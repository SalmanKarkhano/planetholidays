/* ═══════════════════════════════════════════════════════
   PLANET HOLIDAYS — Main JavaScript Engine
   WebGL ocean shader · GSAP ScrollTrigger · Lenis
   Custom cursor · Preloader · Scroll narrative
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ───────────────────────────────
     UTILITIES
     ─────────────────────────────── */
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (val, min, max) { return Math.min(Math.max(val, min), max); };

  var raf = {
    callbacks: [],
    add: function (fn) { this.callbacks.push(fn); },
    remove: function (fn) {
      this.callbacks = this.callbacks.filter(function (c) { return c !== fn; });
    },
    tick: function (time) {
      for (var i = 0; i < raf.callbacks.length; i++) {
        raf.callbacks[i](time);
      }
      requestAnimationFrame(raf.tick);
    }
  };
  requestAnimationFrame(raf.tick);

  /* ───────────────────────────────
     LENIS SMOOTH SCROLL
     ─────────────────────────────── */
  var lenis;
  function initLenis() {
    if (typeof Lenis === 'undefined') return;
    lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      touchMultiplier: 2,
      infinite: false
    });

    lenis.on('scroll', function () {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.update();
      }
    });

    raf.add(function (time) {
      lenis.raf(time);
    });
  }

  /* ───────────────────────────────
     WEBGL OCEAN SHADER (Hero Canvas)
     ─────────────────────────────── */
  function initWebGL() {
    var canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) { canvas.style.display = 'none'; return; }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    var vertSrc = [
      'attribute vec2 a_pos;',
      'void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }'
    ].join('\n');

    var fragSrc = [
      'precision mediump float;',
      'uniform float u_time;',
      'uniform vec2 u_res;',
      'uniform vec2 u_mouse;',
      '',
      'vec3 mod289(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }',
      'vec4 mod289(vec4 x){ return x - floor(x*(1.0/289.0))*289.0; }',
      'vec4 perm(vec4 x){ return mod289(((x*34.0)+1.0)*x); }',
      '',
      'float noise(vec3 p){',
      '  vec3 a = floor(p);',
      '  vec3 d = p - a;',
      '  d = d*d*(3.0-2.0*d);',
      '  vec4 b = a.xxyy + vec4(0.0,1.0,0.0,1.0);',
      '  vec4 k1 = perm(b.xyxy);',
      '  vec4 k2 = perm(k1.xyxy + b.zzww);',
      '  vec4 c = k2 + a.zzzz;',
      '  vec4 k3 = perm(c);',
      '  vec4 k4 = perm(c + 1.0);',
      '  vec4 o1 = fract(k3*(1.0/41.0));',
      '  vec4 o2 = fract(k4*(1.0/41.0));',
      '  vec4 o3 = o2*d.z + o1*(1.0-d.z);',
      '  vec2 o4 = o3.yw*d.x + o3.xz*(1.0-d.x);',
      '  return o4.y*d.y + o4.x*(1.0-d.y);',
      '}',
      '',
      'float fbm(vec3 p){',
      '  float f = 0.0;',
      '  f += 0.5000*noise(p); p *= 2.01;',
      '  f += 0.2500*noise(p); p *= 2.02;',
      '  f += 0.1250*noise(p); p *= 2.03;',
      '  f += 0.0625*noise(p);',
      '  return f / 0.9375;',
      '}',
      '',
      'void main(){',
      '  vec2 uv = gl_FragCoord.xy / u_res;',
      '  float t = u_time * 0.15;',
      '',
      '  // Layered ocean waves',
      '  float n1 = fbm(vec3(uv * 3.0, t));',
      '  float n2 = fbm(vec3(uv * 6.0 + 10.0, t * 1.3));',
      '  float n = n1 * 0.7 + n2 * 0.3;',
      '',
      '  // Caustic light pattern',
      '  float caustic = fbm(vec3(uv * 8.0 + n * 0.5, t * 0.8));',
      '  caustic = pow(caustic, 2.0) * 1.5;',
      '',
      '  // Color palette',
      '  vec3 deep   = vec3(0.02, 0.04, 0.08);',
      '  vec3 mid    = vec3(0.04, 0.10, 0.20);',
      '  vec3 teal   = vec3(0.06, 0.38, 0.35);',
      '  vec3 light  = vec3(0.10, 0.55, 0.50);',
      '',
      '  vec3 col = mix(deep, mid, n);',
      '  col += teal * caustic * 0.3;',
      '  col += light * pow(caustic, 3.0) * 0.15;',
      '',
      '  // Mouse glow',
      '  float md = distance(uv, u_mouse);',
      '  col += vec3(0.05, 0.15, 0.12) * smoothstep(0.4, 0.0, md);',
      '',
      '  // Vignette',
      '  float vig = 1.0 - length((uv - 0.5) * 1.2);',
      '  col *= smoothstep(0.0, 0.7, vig);',
      '',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n');

    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('Shader error:', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }

    var vs = compile(gl.VERTEX_SHADER, vertSrc);
    var fs = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) { canvas.style.display = 'none'; return; }

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);

    var aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var uTime  = gl.getUniformLocation(prog, 'u_time');
    var uRes   = gl.getUniformLocation(prog, 'u_res');
    var uMouse = gl.getUniformLocation(prog, 'u_mouse');

    var mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    document.addEventListener('mousemove', function (e) {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = 1.0 - e.clientY / window.innerHeight;
    }, { passive: true });

    var startTime = performance.now();

    function render(now) {
      mouse.x = lerp(mouse.x, mouse.tx, 0.05);
      mouse.y = lerp(mouse.y, mouse.ty, 0.05);

      gl.uniform1f(uTime, (now - startTime) * 0.001);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    raf.add(render);
  }

  /* ───────────────────────────────
     CUSTOM CURSOR
     ─────────────────────────────── */
  function initCursor() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    var cursor = document.getElementById('cursor');
    if (!cursor) return;

    var dot    = cursor.querySelector('.cursor__dot');
    var circle = cursor.querySelector('.cursor__circle');
    var label  = cursor.querySelector('.cursor__label');

    var pos  = { x: 0, y: 0 };
    var target = { x: 0, y: 0 };

    document.addEventListener('mousemove', function (e) {
      target.x = e.clientX;
      target.y = e.clientY;
    }, { passive: true });

    raf.add(function () {
      pos.x = lerp(pos.x, target.x, 0.15);
      pos.y = lerp(pos.y, target.y, 0.15);

      dot.style.transform    = 'translate(' + target.x + 'px,' + target.y + 'px) translate(-50%,-50%)';
      circle.style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px) translate(-50%,-50%)';
      label.style.transform  = 'translate(' + pos.x + 'px,' + pos.y + 'px) translate(-50%,-50%)';
    });

    // Hover states
    var links = document.querySelectorAll('[data-cursor="link"]');
    var texts = document.querySelectorAll('[data-cursor-text]');

    links.forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.body.classList.add('cursor--link'); });
      el.addEventListener('mouseleave', function () { document.body.classList.remove('cursor--link'); });
    });

    texts.forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        document.body.classList.add('cursor--text');
        label.textContent = el.getAttribute('data-cursor-text');
      });
      el.addEventListener('mouseleave', function () {
        document.body.classList.remove('cursor--text');
        label.textContent = '';
      });
    });
  }

  /* ───────────────────────────────
     SCROLL PROGRESS
     ─────────────────────────────── */
  function initProgress() {
    var fill = document.getElementById('progressFill');
    if (!fill) return;

    window.addEventListener('scroll', function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var pct = h > 0 ? (window.scrollY / h) * 100 : 0;
      fill.style.width = pct + '%';
    }, { passive: true });
  }

  /* ───────────────────────────────
     PRELOADER
     ─────────────────────────────── */
  function initPreloader() {
    var preloader = document.getElementById('preloader');
    var numEl     = document.getElementById('preloaderNum');
    var colL      = preloader ? preloader.querySelector('.preloader__col--left') : null;
    var colR      = preloader ? preloader.querySelector('.preloader__col--right') : null;
    var content   = preloader ? preloader.querySelector('.preloader__content') : null;

    if (!preloader || !numEl || typeof gsap === 'undefined') {
      if (preloader) preloader.style.display = 'none';
      revealHero();
      return;
    }

    var counter = { val: 0 };
    var tl = gsap.timeline({
      onComplete: function () {
        preloader.style.pointerEvents = 'none';
        revealHero();
      }
    });

    tl.to(counter, {
      val: 100,
      duration: 2,
      ease: 'power2.inOut',
      onUpdate: function () {
        numEl.textContent = Math.round(counter.val);
      }
    })
    .to(content, {
      opacity: 0,
      scale: 0.9,
      duration: 0.5,
      ease: 'power2.in'
    }, '+=0.3')
    .to(colL, {
      xPercent: -100,
      duration: 1,
      ease: 'power4.inOut'
    }, '-=0.2')
    .to(colR, {
      xPercent: 100,
      duration: 1,
      ease: 'power4.inOut'
    }, '<')
    .set(preloader, { display: 'none' });
  }

  /* ───────────────────────────────
     HERO REVEAL
     ─────────────────────────────── */
  function revealHero() {
    if (typeof gsap === 'undefined') return;

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to('.hero__title-word', {
      y: 0,
      duration: 1.2,
      stagger: 0.15,
      ease: 'power4.out'
    })
    .to('.hero__tag', {
      opacity: 1,
      duration: 0.8
    }, '-=0.6')
    .to('.hero__subtitle', {
      opacity: 1,
      y: 0,
      duration: 0.8
    }, '-=0.5')
    .to('.hero__cta', {
      opacity: 1,
      y: 0,
      duration: 0.8
    }, '-=0.5')
    .to('.hero__stat', {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.1
    }, '-=0.4')
    .to('.hero__scroll', {
      opacity: 1,
      duration: 0.6
    }, '-=0.3');
  }

  /* ───────────────────────────────
     HEADER SCROLL
     ─────────────────────────────── */
  function initHeader() {
    var header = document.getElementById('header');
    if (!header) return;

    var last = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y > 100) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
      // Hide on scroll down, show on scroll up
      if (y > last && y > 200) {
        header.style.transform = 'translateY(-100%)';
      } else {
        header.style.transform = 'translateY(0)';
      }
      header.style.transition = 'transform 0.4s cubic-bezier(0.16,1,0.3,1), background 0.6s';
      last = y;
    }, { passive: true });
  }

  /* ───────────────────────────────
     MENU
     ─────────────────────────────── */
  function initMenu() {
    var toggle = document.getElementById('menuToggle');
    var menu   = document.getElementById('menu');
    if (!toggle || !menu) return;

    var isOpen = false;

    toggle.addEventListener('click', function () {
      isOpen = !isOpen;
      toggle.classList.toggle('is-active', isOpen);
      menu.classList.toggle('is-open', isOpen);
      menu.setAttribute('aria-hidden', !isOpen);

      if (lenis) {
        isOpen ? lenis.stop() : lenis.start();
      }

      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    menu.querySelectorAll('.menu__link').forEach(function (link) {
      link.addEventListener('click', function () {
        if (isOpen) {
          isOpen = false;
          toggle.classList.remove('is-active');
          menu.classList.remove('is-open');
          menu.setAttribute('aria-hidden', 'true');
          if (lenis) lenis.start();
          document.body.style.overflow = '';
        }
      });
    });
  }

  /* ───────────────────────────────
     TEXT SPLITTING — word-by-word reveal
     ─────────────────────────────── */
  function splitWords(el) {
    var text = el.textContent.trim();
    var words = text.split(/\s+/);
    el.innerHTML = '';
    words.forEach(function (w) {
      var span = document.createElement('span');
      span.className = 'word';
      span.textContent = w;
      el.appendChild(span);
      el.appendChild(document.createTextNode(' '));
    });
  }

  function splitChars(el) {
    var text = el.textContent.trim();
    var html = '';
    for (var i = 0; i < text.length; i++) {
      if (text[i] === '\n' || text[i] === '\r') continue;
      var ch = text[i] === ' ' ? '&nbsp;' : text[i];
      html += '<span class="char" style="transition-delay:' + (i * 0.03) + 's">' + ch + '</span>';
    }
    el.innerHTML = html;
  }

  /* ───────────────────────────────
     SCROLL ANIMATIONS — GSAP ScrollTrigger
     ─────────────────────────────── */
  function initScrollAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // Word-by-word reveals
    document.querySelectorAll('[data-reveal-words]').forEach(function (el) {
      splitWords(el);
      var words = el.querySelectorAll('.word');

      ScrollTrigger.create({
        trigger: el,
        start: 'top 80%',
        end: 'bottom 20%',
        onUpdate: function (self) {
          var progress = self.progress;
          words.forEach(function (w, i) {
            var wordProgress = (i + 1) / words.length;
            if (progress >= wordProgress * 0.8) {
              w.classList.add('is-visible');
            } else {
              w.classList.remove('is-visible');
            }
          });
        }
      });
    });

    // Character reveals
    document.querySelectorAll('[data-reveal-chars]').forEach(function (el) {
      splitChars(el);
      var chars = el.querySelectorAll('.char');

      ScrollTrigger.create({
        trigger: el,
        start: 'top 80%',
        onEnter: function () {
          chars.forEach(function (ch) {
            ch.style.opacity = '1';
            ch.style.transform = 'none';
          });
        }
      });
    });

    // Hero parallax on scroll
    var heroImg = document.querySelector('.hero__bg-img');
    var heroContent = document.querySelector('.hero__content');
    if (heroImg && heroContent) {
      gsap.to(heroImg, {
        y: 100,
        scale: 1.2,
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        }
      });

      gsap.to(heroContent, {
        y: -80,
        opacity: 0,
        scrollTrigger: {
          trigger: '.hero',
          start: '30% top',
          end: 'bottom top',
          scrub: 1
        }
      });
    }

    // Interlude parallax
    var interImg = document.querySelector('.interlude__img');
    if (interImg) {
      gsap.to(interImg, {
        y: -60,
        scrollTrigger: {
          trigger: '.interlude',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5
        }
      });
    }

    // Generic reveal-up elements
    document.querySelectorAll('.reveal-up').forEach(function (el) {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: function () { el.classList.add('is-visible'); },
        once: true
      });
    });

    // Experience cards stagger
    var expCards = document.querySelectorAll('.exp');
    if (expCards.length) {
      gsap.from(expCards, {
        y: 80,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.exp-grid',
          start: 'top 75%'
        }
      });
    }

    // About section
    var aboutMedia = document.querySelector('.about__media');
    var aboutText  = document.querySelector('.about__text');
    if (aboutMedia && aboutText) {
      gsap.from(aboutMedia, {
        x: -60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.about',
          start: 'top 70%'
        }
      });
      gsap.from(aboutText, {
        x: 60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.about',
          start: 'top 70%'
        }
      });
    }

    // CTA section
    var ctaTitle = document.querySelector('.cta__title');
    if (ctaTitle) {
      gsap.from('.cta__title', {
        scale: 0.85,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.chapter--cta',
          start: 'top 70%'
        }
      });
      gsap.from('.cta__desc', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.chapter--cta',
          start: 'top 70%'
        }
      });
      gsap.from('.cta__actions', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.35,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.chapter--cta',
          start: 'top 70%'
        }
      });
    }

    // Chapter labels
    document.querySelectorAll('.chapter__label').forEach(function (el) {
      gsap.from(el, {
        x: -30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%'
        }
      });
    });
  }

  /* ───────────────────────────────
     HORIZONTAL SCROLL (Destinations)
     ─────────────────────────────── */
  function initHorizontalScroll() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    var section = document.getElementById('chapter02');
    var track   = document.getElementById('hscrollTrack');
    if (!section || !track) return;

    function setup() {
      var totalWidth = track.scrollWidth;
      var viewWidth  = window.innerWidth;
      var distance   = totalWidth - viewWidth;

      if (distance <= 0) return;

      // Kill any existing ScrollTrigger on this section
      ScrollTrigger.getAll().forEach(function (st) {
        if (st.trigger === section) st.kill();
      });

      gsap.to(track, {
        x: -distance,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=' + distance,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        }
      });
    }

    setup();

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        ScrollTrigger.refresh();
      }, 250);
    }, { passive: true });
  }

  /* ───────────────────────────────
     COUNTER ANIMATIONS
     ─────────────────────────────── */
  function initCounters() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var obj = { val: 0 };

      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          gsap.to(obj, {
            val: target,
            duration: 2,
            ease: 'power2.out',
            onUpdate: function () {
              el.textContent = Math.round(obj.val).toLocaleString();
            }
          });
        }
      });
    });
  }

  /* ───────────────────────────────
     MAGNETIC BUTTONS
     ─────────────────────────────── */
  function initMagnetic() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + x * 0.2 + 'px,' + y * 0.2 + 'px)';
      });

      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
        btn.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
      });

      btn.addEventListener('mouseenter', function () {
        btn.style.transition = 'none';
      });
    });
  }

  /* ───────────────────────────────
     IMAGE REVEAL on scroll
     ─────────────────────────────── */
  function initImageReveals() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    var images = document.querySelectorAll('.about__img-wrap, .exp__img-wrap');
    images.forEach(function (wrap) {
      gsap.from(wrap, {
        clipPath: 'inset(100% 0 0 0)',
        duration: 1.2,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: wrap,
          start: 'top 80%',
          once: true,
        }
      });
    });
  }

  /* ───────────────────────────────
     INIT
     ─────────────────────────────── */
  function init() {
    initLenis();
    initWebGL();
    initCursor();
    initProgress();
    initPreloader();
    initHeader();
    initMenu();

    // Wait for preloader to finish before initializing scroll stuff
    setTimeout(function () {
      initScrollAnimations();
      initHorizontalScroll();
      initCounters();
      initMagnetic();
      initImageReveals();

      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    }, 3200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

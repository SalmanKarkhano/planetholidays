/* ============================================
   PLANET HOLIDAYS — Awwwards-Level Effects
   GSAP ScrollTrigger reveals, WebGL hero,
   clip-mask letterforms, page transitions,
   unique preloader, scroll narrative
   ============================================ */

(function () {
  'use strict';

  /* ============================================
     WEBGL OCEAN SHADER — Hero canvas background
     A GPU-driven animated ocean surface using
     fractal noise + shimmer light rays.
     Pure GLSL, no Three.js dependency.
  ============================================ */
  function initWebGLHero() {
    var canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      canvas.style.display = 'none';
      return;
    }

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    var vertSrc = [
      'attribute vec2 a_position;',
      'void main() {',
      '  gl_Position = vec4(a_position, 0.0, 1.0);',
      '}'
    ].join('\n');

    var fragSrc = [
      'precision mediump float;',
      'uniform float u_time;',
      'uniform vec2 u_resolution;',
      'uniform vec2 u_mouse;',

      /* --- Fractal noise helpers --- */
      'vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }',
      'vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }',
      'vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }',
      'vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }',

      'float snoise(vec3 v) {',
      '  const vec2 C = vec2(1.0/6.0, 1.0/3.0);',
      '  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);',
      '  vec3 i = floor(v + dot(v, C.yyy));',
      '  vec3 x0 = v - i + dot(i, C.xxx);',
      '  vec3 g = step(x0.yzx, x0.xyz);',
      '  vec3 l = 1.0 - g;',
      '  vec3 i1 = min(g.xyz, l.zxy);',
      '  vec3 i2 = max(g.xyz, l.zxy);',
      '  vec3 x1 = x0 - i1 + C.xxx;',
      '  vec3 x2 = x0 - i2 + C.yyy;',
      '  vec3 x3 = x0 - D.yyy;',
      '  i = mod289(i);',
      '  vec4 p = permute(permute(permute(',
      '    i.z + vec4(0.0, i1.z, i2.z, 1.0))',
      '    + i.y + vec4(0.0, i1.y, i2.y, 1.0))',
      '    + i.x + vec4(0.0, i1.x, i2.x, 1.0));',
      '  float n_ = 0.142857142857;',
      '  vec3 ns = n_ * D.wyz - D.xzx;',
      '  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);',
      '  vec4 x_ = floor(j * ns.z);',
      '  vec4 y_ = floor(j - 7.0 * x_);',
      '  vec4 x = x_ *ns.x + ns.yyyy;',
      '  vec4 y = y_ *ns.x + ns.yyyy;',
      '  vec4 h = 1.0 - abs(x) - abs(y);',
      '  vec4 b0 = vec4(x.xy, y.xy);',
      '  vec4 b1 = vec4(x.zw, y.zw);',
      '  vec4 s0 = floor(b0)*2.0 + 1.0;',
      '  vec4 s1 = floor(b1)*2.0 + 1.0;',
      '  vec4 sh = -step(h, vec4(0.0));',
      '  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;',
      '  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;',
      '  vec3 p0 = vec3(a0.xy, h.x);',
      '  vec3 p1 = vec3(a0.zw, h.y);',
      '  vec3 p2 = vec3(a1.xy, h.z);',
      '  vec3 p3 = vec3(a1.zw, h.w);',
      '  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));',
      '  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;',
      '  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);',
      '  m = m * m;',
      '  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));',
      '}',

      'void main() {',
      '  vec2 uv = gl_FragCoord.xy / u_resolution.xy;',
      '  vec2 mouse = u_mouse / u_resolution.xy;',

      /* Ocean base — layered fractal noise */
      '  float t = u_time * 0.25;',
      '  float n1 = snoise(vec3(uv * 2.8, t * 0.7));',
      '  float n2 = snoise(vec3(uv * 5.6 + 0.3, t * 1.1));',
      '  float n3 = snoise(vec3(uv * 11.2 - 0.7, t * 1.8));',
      '  float ocean = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;',

      /* Mouse ripple */
      '  float dist = length(uv - mouse);',
      '  float ripple = snoise(vec3(uv * 8.0, t * 3.0 - dist * 6.0)) * 0.12 * (1.0 - smoothstep(0.0, 0.5, dist));',
      '  ocean += ripple;',

      /* Colour palette — deep teal to gold shimmer */
      '  vec3 deep    = vec3(0.04, 0.12, 0.22);',
      '  vec3 mid     = vec3(0.08, 0.38, 0.52);',
      '  vec3 shimmer = vec3(0.78, 0.66, 0.49);',
      '  float t1 = smoothstep(-0.6, 0.4, ocean);',
      '  float t2 = smoothstep(0.2, 0.85, ocean);',
      '  vec3 colour = mix(deep, mid, t1);',
      '  colour = mix(colour, shimmer, t2 * 0.55);',

      /* Light caustics from top */
      '  float caustic = snoise(vec3(uv * 18.0, t * 2.5)) * 0.5 + 0.5;',
      '  caustic = pow(caustic, 6.0) * 0.35;',
      '  float yFade = 1.0 - uv.y;',
      '  colour += vec3(caustic * 0.9, caustic * 0.75, caustic * 0.4) * yFade * 0.6;',

      /* Vignette */
      '  float vig = 1.0 - smoothstep(0.3, 1.2, length(uv - 0.5) * 1.6);',
      '  colour *= vig;',

      /* Overall very dark — sits behind hero image */
      '  colour *= 0.85;',
      '  gl_FragColor = vec4(colour, 1.0);',
      '}'
    ].join('\n');

    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('Shader error', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }

    var vert = compile(gl.VERTEX_SHADER, vertSrc);
    var frag = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!vert || !frag) { canvas.style.display = 'none'; return; }

    var prog = gl.createProgram();
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      canvas.style.display = 'none'; return;
    }
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    var pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    var uTime  = gl.getUniformLocation(prog, 'u_time');
    var uRes   = gl.getUniformLocation(prog, 'u_resolution');
    var uMouse = gl.getUniformLocation(prog, 'u_mouse');

    var mx = 0.5, my = 0.5;
    document.addEventListener('mousemove', function(e) {
      mx = e.clientX;
      my = window.innerHeight - e.clientY; // flip Y for GL coords
    }, { passive: true });

    var start = performance.now();
    var rafId;

    function render() {
      var t = (performance.now() - start) * 0.001;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mx, my);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(render);
    }

    /* Pause when hero not visible (performance) */
    var heroEl = document.querySelector('.hero');
    if (heroEl && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting) {
          if (!rafId) render();
        } else {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      });
      io.observe(heroEl);
    } else {
      render();
    }
  }

  /* ============================================
     CLIP-MASK LETTERFORM HERO
     The hero title text acts as a window — the
     hero photography is revealed through the
     letterforms via SVG clipPath.
     On scroll, the clip expands to full viewport.
  ============================================ */
  function initClipMaskHero() {
    var heroClip = document.querySelector('.hero-clip');
    if (!heroClip) return;

    /* Build the SVG clip-path overlay */
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'hero-clip__svg');
    svg.setAttribute('aria-hidden', 'true');
    heroClip.appendChild(svg);

    /* We use CSS clip-path on the image layer directly (more performant) */
    /* The JS controls the scroll-driven expansion */
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    var imgLayer = heroClip.querySelector('.hero-clip__img-layer');
    if (!imgLayer) return;

    /* Start: image clipped to a slim horizontal band */
    gsap.set(imgLayer, { clipPath: 'inset(48% 0% 48% 0%)' });

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.hero-clip',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.4,
        pin: true,
        anticipatePin: 1
      }
    });

    tl.to(imgLayer, {
      clipPath: 'inset(0% 0% 0% 0%)',
      ease: 'power2.inOut',
      duration: 1
    });

    /* Hero text fades on scroll */
    tl.to('.hero-clip__content', {
      opacity: 0,
      y: -60,
      ease: 'power2.inOut',
      duration: 0.5
    }, 0.2);
  }

  /* ============================================
     GSAP SCROLLTRIGGER REVEALS
     Replaces the IntersectionObserver approach.
     Multiple reveal personalities — no more uniform translateY.
  ============================================ */
  function initGSAPReveals() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    /* ---- Clip-from-bottom reveal (primary narrative elements) ---- */
    var clipEls = gsap.utils.toArray('.reveal-clip');
    clipEls.forEach(function(el) {
      gsap.fromTo(el, {
        clipPath: 'inset(0 0 100% 0)',
        opacity: 1
      }, {
        clipPath: 'inset(0 0 0% 0)',
        duration: 1.2,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true
        }
      });
    });

    /* ---- Char-level stagger reveal for section headings ---- */
    var splitHeadings = gsap.utils.toArray('[data-gsap-split]');
    splitHeadings.forEach(function(el) {
      var text = el.textContent;
      var html = '';
      /* Split preserving <br> line breaks */
      var lines = el.innerHTML.split('<br>');
      lines.forEach(function(line, li) {
        var chars = line.replace(/&amp;/g, '&');
        var split = '';
        for (var i = 0; i < chars.length; i++) {
          var c = chars[i] === ' ' ? '&nbsp;' : chars[i];
          split += '<span class="gsap-char" style="display:inline-block;overflow:hidden;vertical-align:bottom"><span class="gsap-char__inner" style="display:inline-block">' + c + '</span></span>';
        }
        html += split;
        if (li < lines.length - 1) html += '<br>';
      });
      el.innerHTML = html;

      var chars = el.querySelectorAll('.gsap-char__inner');
      gsap.set(chars, { yPercent: 110, rotateX: -60, opacity: 0 });

      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: function() {
          gsap.to(chars, {
            yPercent: 0,
            rotateX: 0,
            opacity: 1,
            duration: 0.9,
            ease: 'power4.out',
            stagger: 0.025
          });
        }
      });
    });

    /* ---- Magnetic float — cards that drift up + fade ---- */
    var floatCards = gsap.utils.toArray('.reveal-float');
    floatCards.forEach(function(el, i) {
      gsap.fromTo(el, {
        y: 80,
        opacity: 0,
        scale: 0.96
      }, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1.1,
        delay: (i % 3) * 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          once: true
        }
      });
    });

    /* ---- Horizontal streak — stat numbers ---- */
    var streakEls = gsap.utils.toArray('.reveal-streak');
    streakEls.forEach(function(el, i) {
      gsap.fromTo(el, {
        x: -60,
        opacity: 0
      }, {
        x: 0,
        opacity: 1,
        duration: 1,
        delay: i * 0.1,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true
        }
      });
    });

    /* ---- Legacy .reveal elements — upgrade gracefully ---- */
    /* Remove CSS reveal states and let GSAP take over */
    var legacyReveals = gsap.utils.toArray('.reveal:not(.is-visible)');
    legacyReveals.forEach(function(el, i) {
      gsap.set(el, { opacity: 0, y: 50 });
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true
        }
      });
    });

    /* Kill old IntersectionObserver reveal class additions */
    document.querySelectorAll('.reveal').forEach(function(el) {
      el.style.opacity = '';
      el.style.transform = '';
    });
  }

  /* ============================================
     SCROLL-DRIVEN HORIZONTAL EXPERIENCES
     Replaces the brittle scroll-hijack with a
     GSAP-pinned timeline scrub (buttery smooth).
  ============================================ */
  function initGSAPHorizontalScroll() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    if (window.innerWidth < 768) return; /* Mobile uses native scroll */

    var section = document.querySelector('[data-gsap-horizontal]');
    if (!section) return;

    var track = section.querySelector('.horizontal-track');
    if (!track) return;

    /* Reset any inline styles from old JS */
    section.style.height = '';
    section.style.padding = '';

    var cards = track.querySelectorAll('.experience-card');
    var totalWidth = 0;
    cards.forEach(function(c) { totalWidth += c.offsetWidth + 32; });
    var scrollDist = totalWidth - window.innerWidth + parseInt(getComputedStyle(section).paddingLeft || 0) * 2;

    gsap.to(track, {
      x: -scrollDist,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        pin: true,
        scrub: 1,
        start: 'top top',
        end: '+=' + (scrollDist * 1.1),
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    /* Subtle stagger of card scales as they enter viewport */
    cards.forEach(function(card) {
      gsap.fromTo(card, {
        opacity: 0.4,
        scale: 0.92
      }, {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: card,
          containerAnimation: ScrollTrigger.getById('h-scroll'),
          start: 'left 90%',
          once: true
        }
      });
    });
  }

  /* ============================================
     SECTION NARRATIVE — scroll-driven number strip
     Stats count up only when reaching viewport
     The numbers "write themselves" on scroll.
  ============================================ */
  function initScrollNarrative() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    /* Pinned "about" text parallax layers */
    var narrativeSection = document.querySelector('.narrative-section');
    if (narrativeSection) {
      var layers = narrativeSection.querySelectorAll('[data-depth]');
      layers.forEach(function(layer) {
        var depth = parseFloat(layer.getAttribute('data-depth')) || 1;
        gsap.to(layer, {
          y: -120 * depth,
          ease: 'none',
          scrollTrigger: {
            trigger: narrativeSection,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
      });
    }

    /* Line-by-line paragraph reveal with progress bar */
    var progressSections = document.querySelectorAll('[data-progress-reveal]');
    progressSections.forEach(function(section) {
      var line = section.querySelector('.progress-line');
      if (!line) return;
      gsap.fromTo(line,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          transformOrigin: 'left center',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            end: 'bottom 30%',
            scrub: 1
          }
        });
    });
  }

  /* ============================================
     PAGE TRANSITIONS
     Smooth clip-curtain between all same-domain
     page navigations. The site never "breaks"
     its scroll context on nav.
  ============================================ */
  function initPageTransitions() {
    if (typeof gsap === 'undefined') return;

    /* Build curtain element */
    var curtain = document.createElement('div');
    curtain.id = 'page-curtain';
    curtain.innerHTML = '<div class="page-curtain__inner"><span class="page-curtain__logo">✦ Planet Holidays</span></div>';
    document.body.appendChild(curtain);

    /* Inject curtain styles */
    var style = document.createElement('style');
    style.textContent = [
      '#page-curtain {',
      '  position: fixed; inset: 0; z-index: 999999;',
      '  pointer-events: none;',
      '  clip-path: inset(0 0 100% 0);',
      '}',
      '.page-curtain__inner {',
      '  position: absolute; inset: 0;',
      '  background: #0a0a0a;',
      '  display: flex; align-items: center; justify-content: center;',
      '}',
      '.page-curtain__logo {',
      '  font-family: "Syne", sans-serif; font-size: clamp(1.5rem, 4vw, 2.5rem);',
      '  font-weight: 700; letter-spacing: -0.02em;',
      '  color: #c8a97e; opacity: 0; transform: translateY(20px);',
      '}'
    ].join('\n');
    document.head.appendChild(style);

    /* Page entry reveal (runs on every page load) */
    var tl = gsap.timeline();
    tl.set(curtain, { clipPath: 'inset(0 0 0% 0)' })
      .set('.page-curtain__logo', { opacity: 0, y: 20 })
      .to(curtain, {
        clipPath: 'inset(100% 0 0% 0)',
        duration: 0.9,
        ease: 'power4.inOut',
        delay: 0.1
      });

    /* Intercept internal links */
    function isInternal(href) {
      if (!href) return false;
      if (href.startsWith('#')) return false;
      if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return false;
      try {
        var url = new URL(href, window.location.href);
        return url.hostname === window.location.hostname;
      } catch(e) { return false; }
    }

    document.addEventListener('click', function(e) {
      var link = e.target.closest('a');
      if (!link) return;
      var href = link.getAttribute('href');
      if (!href || !isInternal(href)) return;
      /* Don't intercept new-tab clicks */
      if (link.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;

      e.preventDefault();
      var dest = href;

      var out = gsap.timeline({ onComplete: function() { window.location.assign(dest); } });
      out.set(curtain, { pointerEvents: 'all' })
         .to(curtain, {
           clipPath: 'inset(0 0 0% 0)',
           duration: 0.75,
           ease: 'power4.inOut'
         })
         .to('.page-curtain__logo', {
           opacity: 1, y: 0, duration: 0.35, ease: 'power3.out'
         }, 0.2);
    });
  }

  /* ============================================
     AWWWARDS-LEVEL PRELOADER
     Not a counter to 100. Instead — the brand
     wordmark writes itself letter by letter,
     then the curtain splits open (top + bottom)
     revealing the page beneath with a shutter
     effect.
  ============================================ */
  function initBrandPreloader() {
    var preloader = document.getElementById('preloader');
    if (!preloader) return;
    if (typeof gsap === 'undefined') return;

    /* Rebuild HTML entirely */
    preloader.innerHTML = [
      '<div class="pl2">',
        '<div class="pl2__logo">',
          '<span class="pl2__star">✦</span>',
          '<span class="pl2__name">',
            '<span class="pl2__char" style="--i:0">P</span>',
            '<span class="pl2__char" style="--i:1">L</span>',
            '<span class="pl2__char" style="--i:2">A</span>',
            '<span class="pl2__char" style="--i:3">N</span>',
            '<span class="pl2__char" style="--i:4">E</span>',
            '<span class="pl2__char" style="--i:5">T</span>',
          '</span>',
          '<span class="pl2__divider"></span>',
          '<span class="pl2__sub">',
            '<span class="pl2__char" style="--i:6">H</span>',
            '<span class="pl2__char" style="--i:7">O</span>',
            '<span class="pl2__char" style="--i:8">L</span>',
            '<span class="pl2__char" style="--i:9">I</span>',
            '<span class="pl2__char" style="--i:10">D</span>',
            '<span class="pl2__char" style="--i:11">A</span>',
            '<span class="pl2__char" style="--i:12">Y</span>',
            '<span class="pl2__char" style="--i:13">S</span>',
          '</span>',
        '</div>',
        '<div class="pl2__top-half"></div>',
        '<div class="pl2__bottom-half"></div>',
      '</div>'
    ].join('');

    /* Inject preloader styles */
    var style = document.createElement('style');
    style.textContent = [
      '#preloader { background: transparent; }',
      '.pl2 { position: fixed; inset: 0; z-index: 100000; display: flex; align-items: center; justify-content: center; }',
      '.pl2__top-half, .pl2__bottom-half {',
      '  position: absolute; left: 0; width: 100%;',
      '  background: #0a0a0a;',
      '}',
      '.pl2__top-half { top: 0; height: 50%; transform-origin: top center; }',
      '.pl2__bottom-half { bottom: 0; height: 50%; transform-origin: bottom center; }',
      '.pl2__logo {',
      '  position: relative; z-index: 1;',
      '  display: flex; align-items: center; gap: 1.25rem;',
      '  font-family: "Syne", sans-serif;',
      '}',
      '.pl2__star {',
      '  font-size: clamp(2rem, 5vw, 3.5rem);',
      '  color: #c8a97e;',
      '  display: block;',
      '  opacity: 0; transform: scale(0.4) rotate(-180deg);',
      '}',
      '.pl2__name {',
      '  font-size: clamp(2.5rem, 7vw, 6rem);',
      '  font-weight: 800; letter-spacing: -0.04em;',
      '  color: #f5f0eb;',
      '  display: flex; gap: 0.02em;',
      '}',
      '.pl2__divider {',
      '  width: 1px; background: rgba(200,169,126,0.3);',
      '  height: clamp(2rem, 5vw, 4rem);',
      '  opacity: 0;',
      '}',
      '.pl2__sub {',
      '  font-size: clamp(1rem, 2.5vw, 2rem);',
      '  font-weight: 500; letter-spacing: 0.08em;',
      '  text-transform: uppercase;',
      '  color: #c8a97e;',
      '  display: flex; gap: 0.05em; align-self: flex-end; padding-bottom: 0.2em;',
      '}',
      '.pl2__char { display: inline-block; opacity: 0; transform: translateY(40px); }'
    ].join('\n');
    document.head.appendChild(style);

    var chars = preloader.querySelectorAll('.pl2__char');
    var star  = preloader.querySelector('.pl2__star');
    var divider = preloader.querySelector('.pl2__divider');
    var topHalf = preloader.querySelector('.pl2__top-half');
    var botHalf = preloader.querySelector('.pl2__bottom-half');

    var tl = gsap.timeline({
      onComplete: function() {
        preloader.style.pointerEvents = 'none';
        preloader.style.zIndex = '-1';
      }
    });

    /* Star spins in */
    tl.to(star, { opacity: 1, scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(1.4)' }, 0.2);

    /* Letters cascade in */
    tl.to(Array.from(chars).slice(0, 6), {
      opacity: 1, y: 0, duration: 0.05,
      stagger: 0.06, ease: 'power3.out'
    }, 0.5);

    /* Divider */
    tl.to(divider, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0.9);

    /* Sub-word */
    tl.to(Array.from(chars).slice(6), {
      opacity: 1, y: 0, duration: 0.05,
      stagger: 0.05, ease: 'power3.out'
    }, 1.0);

    /* Brief hold */
    tl.to({}, { duration: 0.5 });

    /* Shutter open — top and bottom halves peel away */
    tl.to(topHalf, {
      scaleY: 0, duration: 0.8, ease: 'power4.inOut'
    }, '>')
    .to(botHalf, {
      scaleY: 0, duration: 0.8, ease: 'power4.inOut'
    }, '<');

    /* Fade the logo */
    tl.to('.pl2__logo', {
      opacity: 0, duration: 0.3
    }, '<+0.2');

    /* Ensure page animations fire after preloader */
    tl.add(function() {
      document.dispatchEvent(new CustomEvent('pl:ready'));
    }, '-=0.3');

    /* Wait for actual load */
    window.addEventListener('load', function() {
      if (tl.time() < 2.1) {
        tl.seek(2.1);
      }
    });
  }

  /* ============================================
     EDITORIAL TYPOGRAPHY — oversized chars
     Scattered large text elements that break
     the grid: section numbers as bg textures,
     running horizontal caption text.
  ============================================ */
  function initEditorialTypography() {
    if (typeof gsap === 'undefined') return;

    /* Running index numbers on value cards */
    var valueCards = document.querySelectorAll('.value-card');
    valueCards.forEach(function(card, i) {
      var bg = card.querySelector('.value-card__number');
      if (!bg) return;
      bg.textContent = String(i + 1).padStart(2, '0');
      gsap.fromTo(bg, { opacity: 0 }, {
        opacity: 0.06,
        duration: 1,
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          once: true
        }
      });
    });

    /* Rotate the section label tags on desktop */
    if (window.innerWidth > 768) {
      var captions = document.querySelectorAll('.t-caption.t-caption--rotated');
      captions.forEach(function(el) {
        el.style.writingMode = 'vertical-rl';
        el.style.textOrientation = 'mixed';
        el.style.transform = 'rotate(180deg)';
        el.style.letterSpacing = '0.2em';
      });
    }
  }

  /* ============================================
     REMOVE MARQUEE BAND (runs before paint)
  ============================================ */
  function removeMarquee() {
    var marquee = document.querySelector('.marquee');
    if (marquee) marquee.remove();
  }

  /* ============================================
     REMOVE FLOATING ORBS
  ============================================ */
  function removeFloatingOrbs() {
    var orbs = document.querySelector('.floating-decor');
    if (orbs) orbs.remove();
  }

  /* ============================================
     IMMERSIVE SPLIT TEXT ON PAGE HEROES
     (inner pages — not homepage)
  ============================================ */
  function initPageHeroAnimations() {
    if (typeof gsap === 'undefined') return;

    var pageHero = document.querySelector('.page-hero');
    if (!pageHero) return;

    var heading = pageHero.querySelector('h1');
    if (!heading) return;

    /* Convert inline <span style="color"> to a class */
    var accentSpan = heading.querySelector('span[style]');
    if (accentSpan) {
      accentSpan.removeAttribute('style');
      accentSpan.classList.add('text-accent');
    }

    /* Animate heading lines */
    var lines = heading.innerHTML.split('<br>');
    heading.innerHTML = lines.map(function(line) {
      return '<span class="ph-line" style="display:block;overflow:hidden"><span class="ph-line__inner" style="display:block">' + line + '</span></span>';
    }).join('');

    gsap.from(heading.querySelectorAll('.ph-line__inner'), {
      yPercent: 105,
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.1,
      delay: 0.3
    });

    /* Breadcrumb + caption */
    var bcrumb = pageHero.querySelector('.page-hero__breadcrumb');
    var caption = pageHero.querySelector('.t-caption');
    var desc = pageHero.querySelector('.t-body-lg');
    var targets = [bcrumb, caption, desc].filter(Boolean);
    gsap.from(targets, {
      opacity: 0,
      y: 30,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.08,
      delay: 0.6
    });
  }

  /* ============================================
     CURSOR UPGRADE — Distortion ring cursor
     More intentional than mix-blend-mode:difference.
     Uses a subtle SVG displacement filter that
     warps content beneath the cursor area.
  ============================================ */
  function upgradeCursor() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (typeof gsap === 'undefined') return;

    /* Remove the existing cursor if already appended by main.js */
    var oldCursor = document.querySelector('.custom-cursor');
    if (oldCursor) oldCursor.remove();
    document.body.classList.remove('has-custom-cursor');

    /* Build new cursor */
    var cursor = document.createElement('div');
    cursor.id = 'orbital-cursor';
    cursor.innerHTML = [
      '<div class="oc__dot"></div>',
      '<div class="oc__ring"></div>',
      '<div class="oc__ring oc__ring--outer"></div>',
      '<span class="oc__label"></span>'
    ].join('');
    document.body.appendChild(cursor);

    var style = document.createElement('style');
    style.textContent = [
      '#orbital-cursor {',
      '  position: fixed; top: 0; left: 0;',
      '  pointer-events: none; z-index: 999998;',
      '  transform: translate(-50%, -50%);',
      '}',
      'body.oc-active { cursor: none; }',
      'body.oc-active a, body.oc-active button,',
      'body.oc-active [data-tilt], body.oc-active .dest-card,',
      'body.oc-active .experience-card, body.oc-active .offer-card,',
      'body.oc-active .blog-card, body.oc-active .service-item { cursor: none; }',
      '.oc__dot {',
      '  position: absolute; width: 5px; height: 5px;',
      '  background: #c8a97e; border-radius: 50%;',
      '  transform: translate(-50%, -50%);',
      '  transition: transform 0.15s ease, width 0.3s ease, height 0.3s ease;',
      '}',
      '.oc__ring {',
      '  position: absolute; width: 32px; height: 32px;',
      '  border: 1px solid rgba(200,169,126,0.6);',
      '  border-radius: 50%;',
      '  transform: translate(-50%, -50%);',
      '  transition: width 0.5s cubic-bezier(0.16,1,0.3,1),',
      '              height 0.5s cubic-bezier(0.16,1,0.3,1),',
      '              border-color 0.3s ease, opacity 0.3s ease;',
      '}',
      '.oc__ring--outer {',
      '  width: 52px; height: 52px;',
      '  border-color: rgba(200,169,126,0.2);',
      '  animation: oc-spin 8s linear infinite;',
      '  border-style: dashed;',
      '}',
      '@keyframes oc-spin { to { transform: translate(-50%,-50%) rotate(360deg); } }',
      '#orbital-cursor.is-hover .oc__ring { width: 48px; height: 48px; border-color: rgba(200,169,126,0.9); }',
      '#orbital-cursor.is-hover .oc__ring--outer { width: 68px; height: 68px; }',
      '#orbital-cursor.is-card .oc__dot { width: 0; height: 0; opacity: 0; }',
      '#orbital-cursor.is-card .oc__ring { width: 80px; height: 80px; background: rgba(200,169,126,0.1); border-color: rgba(200,169,126,0.85); }',
      '#orbital-cursor.is-card .oc__ring--outer { width: 100px; height: 100px; opacity: 0; }',
      '#orbital-cursor.is-card .oc__label { opacity: 1; }',
      '.oc__label {',
      '  position: absolute; top: 50%; left: 50%;',
      '  transform: translate(-50%, -50%);',
      '  font-family: "Inter", sans-serif;',
      '  font-size: 0.55rem; font-weight: 700;',
      '  letter-spacing: 0.14em; text-transform: uppercase;',
      '  color: #c8a97e; opacity: 0;',
      '  transition: opacity 0.3s ease;',
      '  white-space: nowrap; pointer-events: none;',
      '}'
    ].join('\n');
    document.head.appendChild(style);

    var posX = 0, posY = 0;
    var curX = 0, curY = 0;
    var isActive = false;

    document.addEventListener('mousemove', function(e) {
      posX = e.clientX;
      posY = e.clientY;
      if (!isActive) {
        isActive = true;
        document.body.classList.add('oc-active');
      }
    }, { passive: true });

    gsap.ticker.add(function() {
      curX += (posX - curX) * 0.1;
      curY += (posY - curY) * 0.1;
      gsap.set(cursor, { x: curX, y: curY });
    });

    var label = cursor.querySelector('.oc__label');

    var cardEls = document.querySelectorAll('.dest-card, .dest-full-card, .offer-card, .blog-card, .experience-card, .mice-card');
    cardEls.forEach(function(el) {
      var text = el.classList.contains('blog-card') ? 'Read' : 'Explore';
      el.addEventListener('mouseenter', function() {
        cursor.classList.add('is-card');
        cursor.classList.remove('is-hover');
        label.textContent = text;
      });
      el.addEventListener('mouseleave', function() {
        cursor.classList.remove('is-card');
        label.textContent = '';
      });
    });

    var hoverEls = document.querySelectorAll('a:not(.dest-card, .blog-card), button, .service-item, .value-card');
    hoverEls.forEach(function(el) {
      el.addEventListener('mouseenter', function() {
        if (!cursor.classList.contains('is-card')) cursor.classList.add('is-hover');
      });
      el.addEventListener('mouseleave', function() {
        cursor.classList.remove('is-hover');
      });
    });
  }

  /* ============================================
     INIT — Sequence matters:
     1. Remove old elements first
     2. Preloader runs immediately (before DOM ready)
     3. Everything else after DOMContentLoaded
  ============================================ */

  /* Runs before DOM render — remove elements that
     would cause flash before JS removes them */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      removeMarquee();
      removeFloatingOrbs();
    });
  } else {
    removeMarquee();
    removeFloatingOrbs();
  }

  /* Brand preloader overrides old one immediately */
  initBrandPreloader();

  document.addEventListener('DOMContentLoaded', function() {

    /* Wait a tick for GSAP to be available */
    requestAnimationFrame(function() {

      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        /* Integrate with Lenis — main.js exposes it on window */
        /* Use a small delay to ensure lenis is initialized first */
        setTimeout(function() {
          var l = window.lenis;
          if (l && typeof l.on === 'function') {
            l.on('scroll', ScrollTrigger.update);
            /* Override: GSAP ticker already drives lenis in main.js */
          }
        }, 200);
      }

      initGSAPReveals();
      initPageTransitions();
      initClipMaskHero();
      initGSAPHorizontalScroll();
      initScrollNarrative();
      initPageHeroAnimations();
      initEditorialTypography();
      upgradeCursor();
      initWebGLHero();
    });
  });

})();

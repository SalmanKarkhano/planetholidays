/* ============================================
   PLANET HOLIDAYS — Main JavaScript
   Lenis smooth scroll, scroll-hijacked sections,
   magnetic buttons, 3D tilt, clip reveals,
   cursor text, char animations
   ============================================ */

(function () {
  'use strict';

  // ============================================
  // LENIS SMOOTH SCROLL
  // ============================================
  var lenis;
  function initLenis() {
    if (typeof Lenis === 'undefined') return;
    lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      touchMultiplier: 2,
      infinite: false
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // ============================================
  // NAVIGATION
  // ============================================
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navMobile = document.getElementById('navMobile');

  // Scroll detection for nav background
  let lastScroll = 0;
  function handleNavScroll() {
    const scrollY = window.scrollY;
    if (scrollY > 80) {
      nav.classList.add('is-scrolled');
    } else {
      nav.classList.remove('is-scrolled');
    }
    lastScroll = scrollY;
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  // Mobile toggle
  if (navToggle && navMobile) {
    navToggle.addEventListener('click', function () {
      navToggle.classList.toggle('is-active');
      navMobile.classList.toggle('is-open');
      document.body.style.overflow = navMobile.classList.contains('is-open') ? 'hidden' : '';
    });

    // Close mobile menu on link click
    navMobile.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navToggle.classList.remove('is-active');
        navMobile.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  // ============================================
  // REVEAL ON SCROLL (Intersection Observer)
  // ============================================
  function initReveals() {
    var reveals = document.querySelectorAll('.reveal, .reveal-stagger');
    if (!reveals.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px',
      }
    );

    reveals.forEach(function (el) {
      observer.observe(el);
    });
  }

  // ============================================
  // HERO TITLE — CHARACTER-LEVEL SPLIT ANIMATION
  // ============================================
  function initHeroAnimation() {
    var heroTitle = document.querySelector('[data-split-chars]');
    if (heroTitle) {
      // Split each reveal-word into individual characters
      var words = heroTitle.querySelectorAll('.reveal-word');
      var charIndex = 0;
      words.forEach(function (word) {
        var text = word.textContent;
        var parentColor = word.parentElement.style.color || '';
        word.textContent = '';
        word.style.opacity = '1';
        word.style.transform = 'none';
        for (var i = 0; i < text.length; i++) {
          var charSpan = document.createElement('span');
          charSpan.className = 'hero-char';
          charSpan.textContent = text[i];
          charSpan.style.cssText = 'display: inline-block; opacity: 0; transform: translateY(110%) rotateX(-80deg); transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1); transition-delay: ' + (0.4 + charIndex * 0.035) + 's;';
          if (text[i] === ' ') charSpan.innerHTML = '&nbsp;';
          word.appendChild(charSpan);
          charIndex++;
        }
      });

      // Trigger animation
      setTimeout(function () {
        var chars = heroTitle.querySelectorAll('.hero-char');
        chars.forEach(function (c) {
          c.style.opacity = '1';
          c.style.transform = 'translateY(0) rotateX(0)';
        });
      }, 200);
    } else {
      // Fallback: word-level animation
      var wordEls = document.querySelectorAll('.reveal-word');
      if (!wordEls.length) return;
      wordEls.forEach(function (word, i) {
        word.style.opacity = '0';
        word.style.transform = 'translateY(100%)';
        word.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        word.style.transitionDelay = (0.3 + i * 0.15) + 's';
      });
      setTimeout(function () {
        wordEls.forEach(function (word) {
          word.style.opacity = '1';
          word.style.transform = 'translateY(0)';
        });
      }, 100);
    }
  }

  // ============================================
  // PARALLAX EFFECT ON IMAGES
  // ============================================
  function initParallax() {
    var parallaxImages = document.querySelectorAll('.parallax-img img');
    if (!parallaxImages.length) return;

    function updateParallax() {
      parallaxImages.forEach(function (img) {
        var rect = img.parentElement.getBoundingClientRect();
        var windowHeight = window.innerHeight;

        if (rect.top < windowHeight && rect.bottom > 0) {
          var scrollPercent = (windowHeight - rect.top) / (windowHeight + rect.height);
          var translateY = (scrollPercent - 0.5) * -40;
          img.style.transform = 'translateY(' + translateY + 'px)';
        }
      });
    }

    window.addEventListener('scroll', updateParallax, { passive: true });
    updateParallax();
  }

  // ============================================
  // SCROLL-HIJACKED HORIZONTAL SECTION
  // ============================================
  function initHorizontalScroll() {
    var section = document.querySelector('[data-horizontal-scroll]');
    if (!section) return;
    // Only activate on desktop
    if (window.innerWidth < 768) {
      var track = section.querySelector('.horizontal-track');
      if (track) {
        track.style.overflowX = 'auto';
        track.style.cursor = 'grab';
        track.style.scrollbarWidth = 'none';
      }
      return;
    }

    var track = section.querySelector('.horizontal-track');
    if (!track) return;
    var cards = track.querySelectorAll('.experience-card');
    var totalCards = cards.length;
    var cardWidth = cards[0] ? cards[0].offsetWidth : 400;
    var gap = 32; // 2rem
    var trackWidth = (cardWidth + gap) * totalCards - gap;
    var viewportWidth = window.innerWidth;
    var scrollDistance = trackWidth - viewportWidth + 100;

    // Set the section height to create scroll room
    section.style.height = scrollDistance + viewportWidth + 'px';
    section.style.padding = '0';
    section.style.overflow = 'visible';

    var sticky = section.querySelector('.horizontal-section__sticky');
    if (sticky) {
      sticky.style.position = 'sticky';
      sticky.style.top = '0';
      sticky.style.height = '100vh';
      sticky.style.display = 'flex';
      sticky.style.flexDirection = 'column';
      sticky.style.justifyContent = 'center';
      sticky.style.overflow = 'hidden';
    }

    function updateHorizontal() {
      var rect = section.getBoundingClientRect();
      var sectionTop = -rect.top;
      var maxScroll = section.offsetHeight - window.innerHeight;
      var progress = Math.max(0, Math.min(1, sectionTop / maxScroll));
      var translateX = -progress * scrollDistance;
      track.style.transform = 'translateX(' + translateX + 'px)';
    }

    window.addEventListener('scroll', updateHorizontal, { passive: true });
    window.addEventListener('resize', function () {
      cardWidth = cards[0] ? cards[0].offsetWidth : 400;
      trackWidth = (cardWidth + gap) * totalCards - gap;
      viewportWidth = window.innerWidth;
      scrollDistance = trackWidth - viewportWidth + 100;
      section.style.height = scrollDistance + viewportWidth + 'px';
    });
    updateHorizontal();
  }

  // ============================================
  // COUNTER ANIMATION
  // ============================================
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(function (counter) {
      observer.observe(counter);
    });
  }

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var text = el.textContent;
    var suffix = text.replace(/[\d,]/g, '');
    var duration = 2000;
    var start = 0;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      var current = Math.floor(eased * target);

      if (current >= 1000) {
        el.textContent = (current / 1000).toFixed(current >= 10000 ? 0 : 0) + 'K' + suffix.replace('K', '').replace('+', '+');
      } else {
        el.textContent = current + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = text; // Restore original text
      }
    }

    requestAnimationFrame(step);
  }

  // ============================================
  // FAQ ACCORDION
  // ============================================
  function initFAQ() {
    var faqItems = document.querySelectorAll('.faq-item');
    if (!faqItems.length) return;

    faqItems.forEach(function (item) {
      var summary = item.querySelector('summary');
      var arrow = summary.querySelector('.service-item__arrow');

      item.addEventListener('toggle', function () {
        if (item.open) {
          if (arrow) arrow.textContent = '−';
          // Close others
          faqItems.forEach(function (other) {
            if (other !== item && other.open) {
              other.open = false;
            }
          });
        } else {
          if (arrow) arrow.textContent = '+';
        }
      });
    });
  }

  // ============================================
  // CONTACT FORM (Client-side feedback)
  // ============================================
  function initContactForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var btn = form.querySelector('button[type="submit"]');
      var originalText = btn.innerHTML;

      btn.innerHTML = 'Sending... ✦';
      btn.disabled = true;

      // Simulate submission (replace with actual endpoint)
      setTimeout(function () {
        btn.innerHTML = 'Sent Successfully! ✓';
        btn.style.background = '#2d8a9e';

        setTimeout(function () {
          btn.innerHTML = originalText;
          btn.disabled = false;
          btn.style.background = '';
          form.reset();
        }, 3000);
      }, 1500);
    });
  }

  // ============================================
  // SMOOTH ANCHOR SCROLLING
  // ============================================
  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = this.getAttribute('href');
        if (href === '#') return;

        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      });
    });
  }

  // ============================================
  // IMAGE LAZY LOADING ENHANCEMENT
  // ============================================
  function initLazyImages() {
    var images = document.querySelectorAll('img[src*="unsplash"]');
    images.forEach(function (img) {
      img.loading = 'lazy';
      img.decoding = 'async';

      img.addEventListener('load', function () {
        img.style.opacity = '1';
      });

      if (!img.complete) {
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.6s ease';
      }
    });
  }

  // ============================================
  // CUSTOM CURSOR WITH TEXT ON HOVER
  // ============================================
  function initCustomCursor() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    var cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.innerHTML = '<div class="custom-cursor__dot"></div><div class="custom-cursor__ring"></div><span class="custom-cursor__text"></span>';
    document.body.appendChild(cursor);

    var style = document.createElement('style');
    style.textContent = [
      '.custom-cursor { position: fixed; top: 0; left: 0; pointer-events: none; z-index: 99999; mix-blend-mode: difference; }',
      '.custom-cursor__dot { width: 6px; height: 6px; background: #fff; border-radius: 50%; transform: translate(-50%, -50%); transition: opacity 0.3s ease; }',
      '.custom-cursor__ring { width: 36px; height: 36px; border: 1px solid rgba(255,255,255,0.5); border-radius: 50%; position: absolute; top: 0; left: 0; transform: translate(-50%, -50%); transition: width 0.4s cubic-bezier(0.16,1,0.3,1), height 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease, background 0.3s ease; }',
      '.custom-cursor__text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-family: "Inter", sans-serif; font-size: 0.6rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #fff; white-space: nowrap; opacity: 0; transition: opacity 0.3s ease; pointer-events: none; }',
      '.custom-cursor.is-hover .custom-cursor__ring { width: 56px; height: 56px; border-color: rgba(200,169,126,0.8); }',
      '.custom-cursor.is-card-hover .custom-cursor__dot { opacity: 0; }',
      '.custom-cursor.is-card-hover .custom-cursor__ring { width: 90px; height: 90px; border-color: rgba(200,169,126,0.9); background: rgba(200,169,126,0.15); }',
      '.custom-cursor.is-card-hover .custom-cursor__text { opacity: 1; }',
      'body { cursor: none !important; }',
      'a, button, .dest-card, .experience-card, .service-item, .value-card, .dest-full-card, .offer-card, .mice-card, .blog-card { cursor: none !important; }'
    ].join('\n');
    document.head.appendChild(style);

    var mouseX = 0, mouseY = 0;
    var cursorX = 0, cursorY = 0;

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function updateCursor() {
      cursorX += (mouseX - cursorX) * 0.12;
      cursorY += (mouseY - cursorY) * 0.12;
      cursor.style.transform = 'translate(' + cursorX + 'px, ' + cursorY + 'px)';
      requestAnimationFrame(updateCursor);
    }
    updateCursor();

    // Text cursor on cards
    var cardTargets = document.querySelectorAll('.dest-card, .experience-card, .dest-full-card, .offer-card, .mice-card, .blog-card');
    var cursorText = cursor.querySelector('.custom-cursor__text');
    cardTargets.forEach(function (el) {
      var label = el.querySelector('a') ? 'View' : 'Explore';
      if (el.classList.contains('offer-card')) label = 'View';
      if (el.classList.contains('blog-card')) label = 'Read';
      el.addEventListener('mouseenter', function () {
        cursor.classList.add('is-card-hover');
        cursor.classList.remove('is-hover');
        cursorText.textContent = label;
      });
      el.addEventListener('mouseleave', function () {
        cursor.classList.remove('is-card-hover');
        cursorText.textContent = '';
      });
    });

    // Regular hover on links/buttons
    var hoverTargets = document.querySelectorAll('a:not(.dest-card):not(.blog-card__link), button, .service-item, .value-card');
    hoverTargets.forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        if (!cursor.classList.contains('is-card-hover')) {
          cursor.classList.add('is-hover');
        }
      });
      el.addEventListener('mouseleave', function () {
        cursor.classList.remove('is-hover');
      });
    });
  }

  // ============================================
  // PRELOADER WITH % COUNTER
  // ============================================
  function initPreloader() {
    var preloader = document.createElement('div');
    preloader.className = 'preloader';
    preloader.innerHTML = [
      '<div class="preloader__content">',
      '  <div class="preloader__counter-wrap">',
      '    <span class="preloader__counter">0</span>',
      '    <span class="preloader__percent">%</span>',
      '  </div>',
      '  <span class="preloader__text">Planet Holidays</span>',
      '  <div class="preloader__bar"><div class="preloader__bar-fill"></div></div>',
      '</div>'
    ].join('');
    document.body.appendChild(preloader);

    var style = document.createElement('style');
    style.textContent = [
      '.preloader { position: fixed; inset: 0; z-index: 100000; background: #0a0a0a; display: flex; align-items: center; justify-content: center; }',
      '.preloader__content { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }',
      '.preloader__counter-wrap { display: flex; align-items: baseline; font-family: "Syne", sans-serif; font-weight: 800; color: #f5f0eb; }',
      '.preloader__counter { font-size: clamp(3rem, 10vw, 6rem); letter-spacing: -0.04em; line-height: 1; font-variant-numeric: tabular-nums; }',
      '.preloader__percent { font-size: clamp(1rem, 3vw, 1.5rem); color: #c8a97e; margin-left: 0.15em; }',
      '.preloader__text { font-family: "Inter", sans-serif; font-weight: 400; font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(245,240,235,0.4); }',
      '.preloader__bar { width: 120px; height: 1px; background: rgba(245,240,235,0.1); margin-top: 0.5rem; overflow: hidden; }',
      '.preloader__bar-fill { height: 100%; width: 0%; background: #c8a97e; transition: width 0.1s linear; }',
      '.preloader.is-done { opacity: 0; visibility: hidden; transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), visibility 0.8s; }'
    ].join('\n');
    document.head.appendChild(style);

    var counterEl = preloader.querySelector('.preloader__counter');
    var barFill = preloader.querySelector('.preloader__bar-fill');
    var current = { value: 0 };
    var target = 0;

    // Simulate loading stages
    var stages = [
      { delay: 100, to: 25 },
      { delay: 400, to: 55 },
      { delay: 800, to: 78 },
      { delay: 1200, to: 92 }
    ];

    stages.forEach(function (s) {
      setTimeout(function () { target = s.to; }, s.delay);
    });

    function animateCounter() {
      if (current.value < target) {
        current.value += Math.ceil((target - current.value) * 0.12) || 1;
        if (current.value > target) current.value = target;
      }
      counterEl.textContent = current.value;
      barFill.style.width = current.value + '%';
      if (current.value < 100) {
        requestAnimationFrame(animateCounter);
      }
    }
    requestAnimationFrame(animateCounter);

    window.addEventListener('load', function () {
      target = 100;
      setTimeout(function () {
        current.value = 100;
        counterEl.textContent = '100';
        barFill.style.width = '100%';
        setTimeout(function () {
          preloader.classList.add('is-done');
          setTimeout(function () { preloader.remove(); }, 800);
        }, 400);
      }, 300);
    });
  }

  // ============================================
  // TESTIMONIAL CAROUSEL
  // ============================================
  function initTestimonialCarousel() {
    var carousels = document.querySelectorAll('.testimonial-carousel');
    if (!carousels.length) return;

    carousels.forEach(function (carousel) {
      var track = carousel.querySelector('.testimonial-carousel__track');
      var slides = carousel.querySelectorAll('.testimonial-carousel__slide');
      var dots = carousel.querySelectorAll('.testimonial-carousel__dot');
      var prevBtn = carousel.querySelector('.testimonial-carousel__btn--prev');
      var nextBtn = carousel.querySelector('.testimonial-carousel__btn--next');
      var current = 0;
      var total = slides.length;
      var interval;

      function goTo(index) {
        current = ((index % total) + total) % total;
        track.style.transform = 'translateX(-' + (current * 100) + '%)';
        dots.forEach(function (d, i) {
          d.classList.toggle('is-active', i === current);
        });
      }

      function next() { goTo(current + 1); }
      function prev() { goTo(current - 1); }

      function startAuto() {
        interval = setInterval(next, 5000);
      }
      function stopAuto() {
        clearInterval(interval);
      }

      if (nextBtn) nextBtn.addEventListener('click', function () { stopAuto(); next(); startAuto(); });
      if (prevBtn) prevBtn.addEventListener('click', function () { stopAuto(); prev(); startAuto(); });
      dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () { stopAuto(); goTo(i); startAuto(); });
      });

      goTo(0);
      startAuto();
    });
  }

  // ============================================
  // WHATSAPP FLOATING BUTTON
  // ============================================
  function initWhatsApp() {
    var html = '<div class="whatsapp-float">' +
      '<span class="whatsapp-float__label">Chat with us</span>' +
      '<a href="https://wa.me/9607972717" target="_blank" rel="noopener noreferrer" class="whatsapp-float__btn" aria-label="Chat on WhatsApp">' +
      '<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' +
      '</a></div>';
    document.body.insertAdjacentHTML('beforeend', html);
  }

  // ============================================
  // SCROLL PROGRESS BAR
  // ============================================
  function initScrollProgress() {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

    function update() {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = progress + '%';
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ============================================
  // BACK TO TOP BUTTON
  // ============================================
  function initBackToTop() {
    var btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.innerHTML = '↑';
    btn.setAttribute('aria-label', 'Back to top');
    document.body.appendChild(btn);

    function toggle() {
      if (window.scrollY > 600) {
        btn.classList.add('is-visible');
      } else {
        btn.classList.remove('is-visible');
      }
    }

    window.addEventListener('scroll', toggle, { passive: true });
    toggle();

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ============================================
  // MAGNETIC BUTTONS
  // ============================================
  function initMagneticButtons() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    var btns = document.querySelectorAll('.btn, .nav__cta');
    btns.forEach(function (btn) {
      btn.style.transition = 'transform 0.35s cubic-bezier(0.16,1,0.3,1)';

      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + (x * 0.3) + 'px, ' + (y * 0.3) + 'px)';
      });

      btn.addEventListener('mouseleave', function () {
        btn.style.transform = 'translate(0, 0)';
      });
    });
  }

  // ============================================
  // 3D CARD TILT
  // ============================================
  function init3DTilt() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    var cards = document.querySelectorAll('[data-tilt]');
    cards.forEach(function (card) {
      card.style.transformStyle = 'preserve-3d';
      card.style.transition = 'transform 0.45s cubic-bezier(0.16,1,0.3,1)';

      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width;
        var y = (e.clientY - rect.top) / rect.height;
        var rotateX = (0.5 - y) * 12;
        var rotateY = (x - 0.5) * 12;
        card.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale3d(1.02, 1.02, 1.02)';
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });
    });
  }

  // ============================================
  // CLIP-PATH IMAGE REVEALS
  // ============================================
  function initClipReveals() {
    // Only target actual image elements, skip horizontal scroll cards
    var images = document.querySelectorAll('.dest-card__img, .split__img, .about-hero__media img');
    if (!images.length) return;

    images.forEach(function (img) {
      // Skip images inside horizontal scroll section
      if (img.closest('[data-horizontal-scroll]')) return;
      img.style.clipPath = 'inset(100% 0 0 0)';
      img.style.transition = 'clip-path 1s cubic-bezier(0.77, 0, 0.175, 1)';
      img.style.willChange = 'clip-path';
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.clipPath = 'inset(0 0 0 0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '50px' });

    images.forEach(function (img) {
      if (img.closest('[data-horizontal-scroll]')) return;
      if (img.style.clipPath) observer.observe(img);
    });
  }

  // ============================================
  // FLOATING DECORATIVE ORBS
  // ============================================
  function initFloatingDecor() {
    var decor = document.querySelector('.floating-decor');
    if (!decor) return;

    var style = document.createElement('style');
    style.textContent = [
      '.floating-decor { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }',
      '.floating-decor__orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.08; }',
      '.floating-decor__orb--1 { width: 600px; height: 600px; background: radial-gradient(circle, #c8a97e, transparent 70%); top: 10%; left: -10%; animation: floatOrb1 20s ease-in-out infinite; }',
      '.floating-decor__orb--2 { width: 500px; height: 500px; background: radial-gradient(circle, #2d8a9e, transparent 70%); top: 50%; right: -10%; animation: floatOrb2 25s ease-in-out infinite; }',
      '.floating-decor__orb--3 { width: 400px; height: 400px; background: radial-gradient(circle, #c8a97e, transparent 70%); bottom: 10%; left: 30%; animation: floatOrb3 18s ease-in-out infinite; }',
      '@keyframes floatOrb1 { 0%, 100% { transform: translate(0, 0); } 33% { transform: translate(80px, 50px); } 66% { transform: translate(-40px, -30px); } }',
      '@keyframes floatOrb2 { 0%, 100% { transform: translate(0, 0); } 33% { transform: translate(-60px, -80px); } 66% { transform: translate(50px, 40px); } }',
      '@keyframes floatOrb3 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(70px, -50px); } }'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ============================================
  // FOOTER CURTAIN REVEAL
  // ============================================
  function initFooterReveal() {
    var wrap = document.querySelector('.footer-reveal-wrap');
    if (!wrap) return;

    var style = document.createElement('style');
    style.textContent = [
      '.footer-reveal-wrap { position: relative; z-index: 1; }',
      '.footer-reveal-wrap .footer { position: sticky; bottom: 0; z-index: -1; }'
    ].join('\n');
    document.head.appendChild(style);

    // Give main content a background so it covers footer while scrolling
    var main = document.querySelector('main') || document.querySelector('.hero');
    if (main && !main.closest('.footer-reveal-wrap')) {
      main.style.position = 'relative';
      main.style.zIndex = '2';
      main.style.background = '#0a0a0a';
    }
  }

  // ============================================
  // INITIALIZE EVERYTHING
  // ============================================
  initPreloader();

  document.addEventListener('DOMContentLoaded', function () {
    initLenis();
    initReveals();
    initHeroAnimation();
    initParallax();
    initHorizontalScroll();
    initCounters();
    initFAQ();
    initContactForm();
    initSmoothAnchors();
    initLazyImages();
    initCustomCursor();
    initTestimonialCarousel();
    initWhatsApp();
    initScrollProgress();
    initBackToTop();
    initMagneticButtons();
    init3DTilt();
    initClipReveals();
    initFloatingDecor();
    initFooterReveal();
  });
})();

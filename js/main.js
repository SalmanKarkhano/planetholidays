/* ============================================
   PLANET HOLIDAYS — Main JavaScript
   Lenis smooth scroll, scroll-hijacked sections,
   magnetic buttons, 3D tilt, clip reveals,
   cursor text, char animations
   ============================================ */

(function () {
  'use strict';

  // ============================================
  // UNIFIED SCROLL HANDLER (consolidates all scroll listeners)
  // ============================================
  var scrollCallbacks = [];
  var scrollTicking = false;

  function onScroll() {
    if (!scrollTicking) {
      requestAnimationFrame(function () {
        var scrollY = window.scrollY;
        var windowHeight = window.innerHeight;
        var docHeight = document.documentElement.scrollHeight;
        for (var i = 0; i < scrollCallbacks.length; i++) {
          scrollCallbacks[i](scrollY, windowHeight, docHeight);
        }
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }

  function addScrollListener(fn) {
    scrollCallbacks.push(fn);
  }

  window.addEventListener('scroll', onScroll, { passive: true });

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
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var navMobile = document.getElementById('navMobile');

  // Nav scroll detection — via unified handler
  if (nav) {
    addScrollListener(function (scrollY) {
      if (scrollY > 80) {
        nav.classList.add('is-scrolled');
      } else {
        nav.classList.remove('is-scrolled');
      }
    });
    if (window.scrollY > 80) nav.classList.add('is-scrolled');
  }

  // Mobile toggle
  if (navToggle && navMobile) {
    navToggle.addEventListener('click', function () {
      navToggle.classList.toggle('is-active');
      navMobile.classList.toggle('is-open');
      document.body.style.overflow = navMobile.classList.contains('is-open') ? 'hidden' : '';
    });

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
      var words = heroTitle.querySelectorAll('.reveal-word');
      var charIndex = 0;
      words.forEach(function (word) {
        var text = word.textContent;
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

      setTimeout(function () {
        var chars = heroTitle.querySelectorAll('.hero-char');
        chars.forEach(function (c) {
          c.style.opacity = '1';
          c.style.transform = 'translateY(0) rotateX(0)';
        });
      }, 200);
    } else {
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
  // PARALLAX EFFECT ON IMAGES (via unified handler)
  // ============================================
  function initParallax() {
    var parallaxImages = document.querySelectorAll('.parallax-img img');
    if (!parallaxImages.length) return;

    function updateParallax(scrollY, windowHeight) {
      parallaxImages.forEach(function (img) {
        var rect = img.parentElement.getBoundingClientRect();
        if (rect.top < windowHeight && rect.bottom > 0) {
          var scrollPercent = (windowHeight - rect.top) / (windowHeight + rect.height);
          var translateY = (scrollPercent - 0.5) * -40;
          img.style.transform = 'translateY(' + translateY + 'px)';
        }
      });
    }

    addScrollListener(updateParallax);
    updateParallax(window.scrollY, window.innerHeight);
  }

  // ============================================
  // SCROLL-HIJACKED HORIZONTAL SECTION (via unified handler)
  // ============================================
  function initHorizontalScroll() {
    var section = document.querySelector('[data-horizontal-scroll]');
    if (!section) return;

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
    var gap = 32;
    var trackWidth = (cardWidth + gap) * totalCards - gap;
    var viewportWidth = window.innerWidth;
    var scrollDistance = trackWidth - viewportWidth + 100;

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

    addScrollListener(function () {
      var rect = section.getBoundingClientRect();
      var sectionTop = -rect.top;
      var maxScroll = section.offsetHeight - window.innerHeight;
      var progress = Math.max(0, Math.min(1, sectionTop / maxScroll));
      var translateX = -progress * scrollDistance;
      track.style.transform = 'translateX(' + translateX + 'px)';
    });

    window.addEventListener('resize', function () {
      cardWidth = cards[0] ? cards[0].offsetWidth : 400;
      trackWidth = (cardWidth + gap) * totalCards - gap;
      viewportWidth = window.innerWidth;
      scrollDistance = trackWidth - viewportWidth + 100;
      section.style.height = scrollDistance + viewportWidth + 'px';
    });
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
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(eased * target);

      if (current >= 1000) {
        el.textContent = (current / 1000).toFixed(0) + 'K' + suffix.replace('K', '').replace('+', '+');
      } else {
        el.textContent = current + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = text;
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
      var arrow = summary ? summary.querySelector('.service-item__arrow') : null;

      item.addEventListener('toggle', function () {
        if (item.open) {
          if (arrow) arrow.textContent = '\u2212';
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
  // CONTACT FORM (opens mail client as fallback)
  // ============================================
  function initContactForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var btn = form.querySelector('button[type="submit"]');
      var originalText = btn.innerHTML;

      var firstName = (form.querySelector('#firstName') || {}).value || '';
      var lastName = (form.querySelector('#lastName') || {}).value || '';
      var email = (form.querySelector('#email') || {}).value || '';
      var destination = (form.querySelector('#destination') || {}).value || '';
      var message = (form.querySelector('#message') || {}).value || '';

      var subject = encodeURIComponent('Trip Inquiry from ' + firstName + ' ' + lastName);
      var body = encodeURIComponent(
        'Name: ' + firstName + ' ' + lastName + '\n' +
        'Email: ' + email + '\n' +
        'Destination: ' + destination + '\n\n' +
        message
      );

      window.location.href = 'mailto:hello@planetholidays.travel?subject=' + subject + '&body=' + body;

      btn.innerHTML = 'Opening Email Client... \u2726';
      btn.disabled = true;

      setTimeout(function () {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 3000);
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
    var images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(function (img) {
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
  // (idle-aware rAF loop, native cursor as fallback)
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
      'body.has-custom-cursor { cursor: none; }',
      'body.has-custom-cursor a, body.has-custom-cursor button, body.has-custom-cursor .dest-card, body.has-custom-cursor .experience-card, body.has-custom-cursor .service-item, body.has-custom-cursor .value-card, body.has-custom-cursor .dest-full-card, body.has-custom-cursor .offer-card, body.has-custom-cursor .mice-card, body.has-custom-cursor .blog-card { cursor: none; }'
    ].join('\n');
    document.head.appendChild(style);

    var mouseX = 0, mouseY = 0;
    var cursorX = 0, cursorY = 0;
    var cursorRafId = null;
    var mouseActive = false;
    var idleTimer = null;

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!mouseActive) {
        mouseActive = true;
        document.body.classList.add('has-custom-cursor');
        startCursorLoop();
      }

      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () { mouseActive = false; }, 3000);
    });

    function startCursorLoop() {
      if (cursorRafId) return;
      function tick() {
        var dx = mouseX - cursorX;
        var dy = mouseY - cursorY;
        cursorX += dx * 0.12;
        cursorY += dy * 0.12;
        cursor.style.transform = 'translate(' + cursorX + 'px, ' + cursorY + 'px)';

        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1 && !mouseActive) {
          cursorRafId = null;
          return;
        }
        cursorRafId = requestAnimationFrame(tick);
      }
      cursorRafId = requestAnimationFrame(tick);
    }

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
  // PRELOADER — fast, dismisses on load
  // ============================================
  function initPreloader() {
    var preloader = document.getElementById('preloader');
    if (!preloader) return;

    var counterEl = preloader.querySelector('.preloader__counter');
    var barFill = preloader.querySelector('.preloader__bar-fill');
    var current = { value: 0 };
    var target = 0;

    var stages = [
      { delay: 50, to: 30 },
      { delay: 150, to: 60 },
      { delay: 300, to: 85 }
    ];

    stages.forEach(function (s) {
      setTimeout(function () { target = s.to; }, s.delay);
    });

    function animateCounter() {
      if (current.value < target) {
        current.value += Math.ceil((target - current.value) * 0.2) || 1;
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
      current.value = 100;
      counterEl.textContent = '100';
      barFill.style.width = '100%';
      setTimeout(function () {
        preloader.classList.add('is-done');
        setTimeout(function () { preloader.remove(); }, 600);
      }, 100);
    });
  }

  // ============================================
  // TESTIMONIAL CAROUSEL (with touch/swipe)
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

      function startAuto() { interval = setInterval(next, 5000); }
      function stopAuto() { clearInterval(interval); }

      if (nextBtn) nextBtn.addEventListener('click', function () { stopAuto(); next(); startAuto(); });
      if (prevBtn) prevBtn.addEventListener('click', function () { stopAuto(); prev(); startAuto(); });
      dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () { stopAuto(); goTo(i); startAuto(); });
      });

      // Touch/swipe support
      var touchStartX = 0;
      var touchThreshold = 50;

      track.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
        stopAuto();
      }, { passive: true });

      track.addEventListener('touchend', function (e) {
        var diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > touchThreshold) {
          if (diff > 0) { next(); } else { prev(); }
        }
        startAuto();
      }, { passive: true });

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
  // SCROLL PROGRESS BAR (via unified handler)
  // ============================================
  function initScrollProgress() {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

    addScrollListener(function (scrollY, windowHeight, docHeight) {
      var max = docHeight - windowHeight;
      var progress = max > 0 ? (scrollY / max) * 100 : 0;
      bar.style.width = progress + '%';
    });
  }

  // ============================================
  // BACK TO TOP BUTTON (via unified handler)
  // ============================================
  function initBackToTop() {
    var btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.innerHTML = '\u2191';
    btn.setAttribute('aria-label', 'Back to top');
    document.body.appendChild(btn);

    addScrollListener(function (scrollY) {
      if (scrollY > 600) {
        btn.classList.add('is-visible');
      } else {
        btn.classList.remove('is-visible');
      }
    });

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
    var wrappers = document.querySelectorAll('.split__img, .about-hero__media');
    if (!wrappers.length) return;

    wrappers.forEach(function (wrap) {
      wrap.style.clipPath = 'inset(100% 0 0 0)';
      wrap.style.transition = 'clip-path 1.2s cubic-bezier(0.77, 0, 0.175, 1)';
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.clipPath = 'inset(0 0 0 0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '100px' });

    wrappers.forEach(function (wrap) {
      observer.observe(wrap);
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
  // FOOTER CURTAIN REVEAL (uses <main> element)
  // ============================================
  function initFooterReveal() {
    var wrap = document.querySelector('.footer-reveal-wrap');
    if (!wrap) return;

    var main = document.querySelector('main');
    if (main) {
      main.style.position = 'relative';
      main.style.zIndex = '2';
      main.style.background = 'var(--c-bg, #0a0a0a)';
    }
  }

  // ============================================
  // INITIALIZE EVERYTHING
  // ============================================
  // STICKY BOOK NOW BAR
  // ============================================
  function initStickyCTABar() {
    var hero = document.querySelector('.hero, .page-hero');
    if (!hero) return;

    var bar = document.createElement('div');
    bar.className = 'sticky-cta-bar';
    bar.innerHTML =
      '<div class="sticky-cta-bar__info">' +
        '<span class="sticky-cta-bar__text">Ready to plan your dream holiday?</span>' +
        '<span class="sticky-cta-bar__sub">Maldives & Sri Lanka — tailored just for you</span>' +
      '</div>' +
      '<div class="sticky-cta-bar__actions">' +
        '<a href="contact.html" class="btn btn--primary btn--sm">Book a Trip <span class="btn__arrow">→</span></a>' +
        '<button class="sticky-cta-bar__close" aria-label="Dismiss">✕</button>' +
      '</div>';
    document.body.appendChild(bar);

    var dismissed = false;
    var heroBottom = 0;

    function updateHeroBottom() {
      heroBottom = hero.getBoundingClientRect().bottom + window.scrollY;
    }

    updateHeroBottom();
    window.addEventListener('resize', updateHeroBottom, { passive: true });

    addScrollListener(function (scrollY) {
      if (dismissed) return;
      if (scrollY > heroBottom - 100) {
        bar.classList.add('is-visible');
      } else {
        bar.classList.remove('is-visible');
      }
    });

    bar.querySelector('.sticky-cta-bar__close').addEventListener('click', function () {
      dismissed = true;
      bar.classList.remove('is-visible');
    });
  }

  // ============================================
  // COOKIE CONSENT BANNER
  // ============================================
  function initCookieConsent() {
    if (document.cookie.indexOf('ph_cookie_consent=') !== -1) return;
    if (localStorage && localStorage.getItem('ph_cookie_consent')) return;

    var banner = document.createElement('div');
    banner.className = 'cookie-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML =
      '<p class="cookie-consent__title">🍪 We use cookies</p>' +
      '<p class="cookie-consent__text">We use cookies to enhance your browsing experience and analyse site traffic. ' +
      'By clicking "Accept", you consent to our use of cookies. ' +
      '<a href="privacy-policy.html">Learn more</a></p>' +
      '<div class="cookie-consent__actions">' +
        '<button class="btn btn--primary btn--sm cookie-consent__accept">Accept All</button>' +
        '<button class="cookie-consent__decline">Decline</button>' +
      '</div>';
    document.body.appendChild(banner);

    function dismiss(accepted) {
      banner.classList.remove('is-visible');
      var expires = new Date(Date.now() + 365 * 864e5).toUTCString();
      document.cookie = 'ph_cookie_consent=' + (accepted ? '1' : '0') + '; expires=' + expires + '; path=/';
      if (localStorage) localStorage.setItem('ph_cookie_consent', accepted ? '1' : '0');
    }

    setTimeout(function () {
      banner.classList.add('is-visible');
    }, 1500);

    banner.querySelector('.cookie-consent__accept').addEventListener('click', function () { dismiss(true); });
    banner.querySelector('.cookie-consent__decline').addEventListener('click', function () { dismiss(false); });
  }

  // ============================================
  // CONTACT FORM — Enhanced Validation
  // ============================================
  function initContactFormValidation() {
    var form = document.getElementById('contactForm');
    if (!form) return;

    var successEl = document.createElement('div');
    successEl.className = 'form-success';
    successEl.innerHTML =
      '<div class="form-success__icon">✦</div>' +
      '<h3 class="form-success__title">Inquiry Sent!</h3>' +
      '<p class="form-success__text">Thank you for reaching out. One of our travel experts will get back to you within 24 hours.</p>';
    form.parentNode.insertBefore(successEl, form.nextSibling);

    var requiredFields = form.querySelectorAll('[required]');

    requiredFields.forEach(function (field) {
      var errorEl = document.createElement('span');
      errorEl.className = 'form-error-msg';
      errorEl.setAttribute('aria-live', 'polite');
      errorEl.textContent = field.tagName === 'SELECT' ? 'Please make a selection.' : 'This field is required.';
      if (field.type === 'email') errorEl.textContent = 'Please enter a valid email address.';
      field.parentNode.appendChild(errorEl);

      field.addEventListener('blur', function () { validateField(field, errorEl); });
      field.addEventListener('input', function () {
        if (field.classList.contains('is-error')) validateField(field, errorEl);
      });
    });

    function validateField(field, errorEl) {
      var valid = field.checkValidity();
      field.classList.toggle('is-error', !valid);
      errorEl.classList.toggle('is-visible', !valid);
      return valid;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var allValid = true;

      requiredFields.forEach(function (field) {
        var errorEl = field.parentNode.querySelector('.form-error-msg');
        if (errorEl && !validateField(field, errorEl)) allValid = false;
      });

      if (!allValid) return;

      var btn = form.querySelector('button[type="submit"]');
      btn.textContent = 'Sending…';
      btn.disabled = true;

      var firstName = (form.querySelector('#firstName') || {}).value || '';
      var lastName  = (form.querySelector('#lastName')  || {}).value || '';
      var email       = (form.querySelector('#email')       || {}).value || '';
      var destination = (form.querySelector('#destination') || {}).value || '';
      var message     = (form.querySelector('#message')     || {}).value || '';

      var subject = encodeURIComponent('Trip Inquiry from ' + firstName + ' ' + lastName);
      var body = encodeURIComponent(
        'Name: ' + firstName + ' ' + lastName + '\n' +
        'Email: ' + email + '\n' +
        'Destination: ' + destination + '\n\n' +
        message
      );

      window.location.href = 'mailto:hello@planetholidays.travel?subject=' + subject + '&body=' + body;

      setTimeout(function () {
        form.style.display = 'none';
        successEl.classList.add('is-visible');
      }, 600);
    });
  }

  // ============================================
  // NEWSLETTER FORM — Enhanced Feedback
  // ============================================
  function initNewsletterForms() {
    var forms = document.querySelectorAll('.newsletter-form');
    if (!forms.length) return;

    forms.forEach(function (form) {
      var note = form.parentNode.querySelector('.newsletter-form__note');
      if (!note) return;

      var successEl = document.createElement('p');
      successEl.className = 'newsletter-form__success';
      successEl.textContent = '✦ You\'re subscribed! Welcome to the community.';
      note.parentNode.insertBefore(successEl, note);

      var errorEl = document.createElement('p');
      errorEl.className = 'newsletter-form__error';
      errorEl.textContent = 'Please enter a valid email address.';
      note.parentNode.insertBefore(errorEl, note);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = form.querySelector('input[type="email"]');
        if (!input || !input.checkValidity()) {
          errorEl.classList.add('is-visible');
          input && input.classList.add('is-error');
          return;
        }
        errorEl.classList.remove('is-visible');
        input.classList.remove('is-error');
        form.querySelector('.btn').textContent = 'Subscribed ✓';
        form.querySelector('.btn').disabled = true;
        successEl.classList.add('is-visible');
      });
    });
  }

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
    initContactFormValidation();
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
    initStickyCTABar();
    initCookieConsent();
    initNewsletterForms();

    // Fire initial scroll to populate all unified handlers
    onScroll();
  });
})();

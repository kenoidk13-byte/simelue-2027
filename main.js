/* =========================================================
   Симелуэ / 2027 — interactions
   Lenis smooth scroll + GSAP ScrollTrigger
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  var hasLenis = typeof window.Lenis !== 'undefined';

  if (!hasGSAP) return; // CSS keeps everything visible — graceful fallback.

  document.documentElement.classList.add('js');
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  var q = function (s, c) { return (c || document).querySelector(s); };
  var qa = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- word splitter ---------- */
  function splitWords(el) {
    var text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    var frag = document.createDocumentFragment();
    text.split(/\s+/).forEach(function (word, i, arr) {
      var wrap = document.createElement('span');
      wrap.className = 'word';
      var inner = document.createElement('span');
      inner.className = 'word-i';
      inner.textContent = word;
      wrap.appendChild(inner);
      frag.appendChild(wrap);
      if (i < arr.length - 1) frag.appendChild(document.createTextNode(' '));
    });
    el.appendChild(frag);
    return qa('.word-i', el);
  }

  /* ---------- Lenis ---------- */
  var lenis = null;
  if (hasLenis && !reduced) {
    lenis = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      wheelMultiplier: 1
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    if (hasST) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  }

  function scrollTo(target) {
    if (lenis) lenis.scrollTo(target, { offset: -10, duration: 1.4 });
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'smooth' });
    else target.scrollIntoView({ behavior: 'smooth' });
  }

  /* ---------- anchors ---------- */
  qa('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      var el = q(id);
      if (!el) return;
      e.preventDefault();
      scrollTo(el);
    });
  });

  /* ---------- nav state + progress ---------- */
  var nav = q('[data-nav]');
  var bar = q('[data-progress]');
  var heroEnd = function () { var h = q('.hero'); return h ? h.offsetHeight * 0.65 : 400; };

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle('is-scrolled', y > heroEnd());
    if (bar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, y / max) : 0;
      bar.style.transform = 'scaleX(' + p + ')';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- magnetic buttons ---------- */
  if (!reduced && window.matchMedia('(hover:hover)').matches) {
    qa('[data-magnetic]').forEach(function (el) {
      var moveX = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
      var moveY = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        moveX((e.clientX - (r.left + r.width / 2)) * 0.28);
        moveY((e.clientY - (r.top + r.height / 2)) * 0.28);
      });
      el.addEventListener('mouseleave', function () { moveX(0); moveY(0); });
    });
  }

  /* ---------- reveal animations ---------- */
  var ctx = hasST ? gsap.context(function () {

    /* hero intro (plays on load) */
    var hero = q('.hero');
    if (hero) {
      var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.nav__inner > *', { y: -24, opacity: 0, duration: 0.9, stagger: 0.08 })
        .from('.hero__geo .micro', { y: 18, opacity: 0, duration: 0.7, stagger: 0.1 }, '-=0.5')
        .from('.hero .line-i', { yPercent: 115, duration: 1.15, stagger: 0.12 }, '-=0.4')
        .from('.hero__lead', { y: 22, opacity: 0, duration: 0.8 }, '-=0.7')
        .from('.hero__action > *', { y: 22, opacity: 0, duration: 0.8, stagger: 0.1 }, '-=0.6')
        .from('.hero__island-text', { yPercent: 105, duration: 1.3 }, '-=0.9')
        .from('.hero__bottom .micro', { y: 16, opacity: 0, duration: 0.7, stagger: 0.1 }, '-=0.7');

      /* hero parallax on scroll */
      if (hasST && !reduced) {
        gsap.to('[data-hero-img]', {
          yPercent: 16, scale: 1.06, ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
        });
        gsap.to('[data-hero-word]', {
          xPercent: -6, ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
        });
        gsap.to('.hero__top', {
          yPercent: 8, opacity: 0.35, ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
        });
      }
    }

    /* headline lines */
    qa('[data-lines]').forEach(function (h) {
      var lines = qa('.line-i', h);
      if (!lines.length) return;
      gsap.from(lines, {
        yPercent: 115, duration: 1.05, ease: 'power4.out', stagger: 0.09,
        scrollTrigger: { trigger: h, start: 'top 85%' }
      });
    });

    /* generic reveal */
    qa('[data-reveal]').forEach(function (el) {
      if (el.closest('.hero')) return; // hero handled above
      gsap.from(el, {
        y: 26, opacity: 0, duration: 0.85, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    /* word-by-word leads */
    qa('.lead').forEach(function (el) {
      if (el.closest('.hero')) return;
      var words = splitWords(el);
      gsap.from(words, {
        yPercent: 100, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.028,
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    /* dividers */
    qa('[data-rule]').forEach(function (el) {
      gsap.to(el, {
        scaleX: 1, duration: 1.1, ease: 'power3.inOut',
        scrollTrigger: { trigger: el, start: 'top 92%' }
      });
    });

    /* staggered lists */
    qa('[data-stagger]').forEach(function (list) {
      gsap.from(list.children, {
        y: 32, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.09,
        scrollTrigger: { trigger: list, start: 'top 82%' }
      });
    });

    /* image parallax */
    if (!reduced) {
      qa('[data-parallax]').forEach(function (fig) {
        var img = q('img', fig);
        if (!img) return;
        gsap.fromTo(img, { yPercent: -7 }, {
          yPercent: 7, ease: 'none',
          scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
      var nyeBg = q('[data-nye-img]');
      if (nyeBg) {
        gsap.fromTo(nyeBg, { yPercent: -8 }, {
          yPercent: 8, ease: 'none',
          scrollTrigger: { trigger: '.sec--nye', start: 'top bottom', end: 'bottom top', scrub: true }
        });
      }
    }

    /* year + count-up */
    var year = q('[data-year]');
    if (year) {
      gsap.from(year, {
        yPercent: 40, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: year, start: 'top 88%' }
      });
    }
    var counter = q('[data-count]');
    if (counter) {
      var target = parseInt(counter.getAttribute('data-count'), 10) || 0;
      var proxy = { v: 0 };
      counter.textContent = '0';
      gsap.to(proxy, {
        v: target, duration: 1.6, ease: 'power2.out',
        scrollTrigger: { trigger: counter, start: 'top 88%' },
        onUpdate: function () { counter.textContent = Math.round(proxy.v); },
        onComplete: function () { counter.textContent = String(target); }
      });
    }

    ScrollTrigger.refresh();
  }) : null;

  /* ---------- refresh after images load ---------- */
  if (hasST) {
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  }
})();

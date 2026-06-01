/**
 * RadioTech Studio — Main JavaScript
 * Pure vanilla JS: animations, interactions, form validation
 */

'use strict';

/* ==========================================================================
   Utility helpers
   ========================================================================== */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ==========================================================================
   1. Scroll Progress Bar
   ========================================================================== */
window.addEventListener('scroll', () => {
  const menu = document.getElementById('mobileMenu');
  if (menu && !menu.classList.contains('open') && document.body.style.overflow === 'hidden') {
    document.body.style.overflow = '';
  }
}, { passive: true });

function initScrollProgress() {
  const bar = qs('#scrollProgress');
  if (!bar) return;
  const update = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = pct + '%';
    bar.setAttribute('aria-valuenow', Math.round(pct));
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ==========================================================================
   2. Sticky Header
   ========================================================================== */
function initStickyHeader() {
  const header = qs('#header');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ==========================================================================
   3. Active Nav Link
   ========================================================================== */
function initActiveNav() {
  const links  = qsa('.nav-link, .nav-mobile-link');
  const sects  = qsa('section[id]');

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          links.forEach(l => {
            const href = l.getAttribute('href');
            l.classList.toggle('active', href === '#' + id);
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
  );
  sects.forEach(s => observer.observe(s));
}

/* ==========================================================================
   4. Mobile Hamburger Menu (with focus trap — WCAG 2.1 AA)
   ========================================================================== */
function initHamburger() {
  const btn  = qs('#hamburger');
  const menu = qs('#mobileMenu');
  if (!btn || !menu) return;

  const getFocusable = () => qsa(
    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', menu
  );

  const toggle = (force) => {
    const open = typeof force === 'boolean' ? force : !btn.classList.contains('open');
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    menu.classList.toggle('open', open);
    // Only lock scroll on desktop (mobile overflow:hidden causes scroll stuck)
    if (window.innerWidth > 768) document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      // Move focus to first focusable item in menu
      const first = getFocusable()[0];
      if (first) setTimeout(() => first.focus(), 100);
    } else {
      btn.focus();
    }
  };

  btn.addEventListener('click', () => toggle());

  // Focus trap inside open menu
  menu.addEventListener('keydown', e => {
    if (!menu.classList.contains('open')) return;
    if (e.key !== 'Tab') return;
    const focusable = getFocusable();
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

  // Close when a link is clicked
  qsa('.nav-mobile-link, .nav-mobile-cta', menu).forEach(l => {
    l.addEventListener('click', () => { toggle(false); document.body.style.overflow = ''; });
  });

  // Close on outside click (only when menu is open)
  document.addEventListener('click', e => {
    if (menu.classList.contains('open') && !btn.contains(e.target) && !menu.contains(e.target)) toggle(false);
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) toggle(false);
  });
}

/* ==========================================================================
   5. Smooth Scroll for Anchor Links
   ========================================================================== */
function initSmoothScroll() {
  document.addEventListener('click', e => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    const id = anchor.getAttribute('href');
    if (id === '#') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const target = qs(id);
    if (!target) return;
    e.preventDefault();
    const headerH = qs('#header')?.offsetHeight || 70;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH - 20;
    window.scrollTo({ top, behavior: 'smooth' });
  });
}

/* ==========================================================================
   6. Scroll-to-Top Button
   ========================================================================== */
function initScrollTop() {
  const btn = qs('#scrollTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    const show = window.scrollY > 400;
    btn.hidden = !show;
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ==========================================================================
   7. AOS-like Intersection Observer Animations
   ========================================================================== */
function initAOS() {
  const els = qsa('[data-aos]');
  if (!els.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el   = entry.target;
          const delay = parseInt(el.dataset.aosDelay || '0', 10);
          setTimeout(() => el.classList.add('aos-animate'), delay);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  );
  els.forEach(el => observer.observe(el));
}

/* ==========================================================================
   8. Hero Wave Canvas Animation
   ========================================================================== */
function initWaveCanvas() {
  // Skip heavy canvas animation on mobile to save CPU/TBT
  if (window.innerWidth < 768) return;
  const canvas = qs('#waveCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height, animId;

  const waves = [
    { color: 'rgba(0,212,255,0.15)', amp: 40, freq: 0.012, speed: 0.015, phase: 0 },
    { color: 'rgba(124,58,237,0.12)', amp: 55, freq: 0.008, speed: 0.010, phase: 2 },
    { color: 'rgba(0,245,212,0.10)', amp: 30, freq: 0.018, speed: 0.020, phase: 4 },
  ];

  function resize() {
    width  = canvas.width  = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    waves.forEach(w => {
      ctx.beginPath();
      ctx.moveTo(0, height * 0.5);
      for (let x = 0; x <= width; x += 4) {
        const y = height * 0.5 + Math.sin(x * w.freq + w.phase) * w.amp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fillStyle = w.color;
      ctx.fill();
      w.phase += w.speed;
    });

    animId = requestAnimationFrame(draw);
  }

  resize();
  draw();

  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement);

  // Clean up if needed
  return () => { cancelAnimationFrame(animId); ro.disconnect(); };
}

/* ==========================================================================
   9. Animated Listeners Counter
   ========================================================================== */
function initListenersCounter() {
  const el = qs('#listenersCount');
  if (!el) return;

  const target = 1247;
  const duration = 2000;
  const start = performance.now();

  function update(now) {
    const elapsed = Math.min(now - start, duration);
    const progress = elapsed / duration;
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }

  // Start when element is visible
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        requestAnimationFrame(update);
        observer.disconnect();
      }
    });
  }, { threshold: 0.5 });
  observer.observe(el);
}

/* ==========================================================================
   10. FAQ Accordion
   ========================================================================== */
function initFAQ() {
  const items = qsa('.faq-item');
  items.forEach(item => {
    const btn    = qs('.faq-question', item);
    const answer = qs('.faq-answer', item);
    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      // Close all others
      items.forEach(other => {
        const ob = qs('.faq-question', other);
        const oa = qs('.faq-answer', other);
        if (ob && oa && ob !== btn) {
          ob.setAttribute('aria-expanded', 'false');
          oa.hidden = true;
        }
      });

      // Toggle current
      const newState = !isOpen;
      btn.setAttribute('aria-expanded', newState);
      answer.hidden = !newState;

      if (newState) {
        // Animate open
        answer.style.maxHeight = '0px';
        answer.style.overflow  = 'hidden';
        answer.hidden = false;
        const sh = answer.scrollHeight;
        answer.style.transition = 'max-height 0.35s ease';
        requestAnimationFrame(() => { answer.style.maxHeight = sh + 'px'; });
        answer.addEventListener('transitionend', () => {
          answer.style.maxHeight = '';
          answer.style.overflow  = '';
          answer.style.transition = '';
        }, { once: true });
      }
    });
  });
}

/* ==========================================================================
   11. Contact Form Validation & Submission
   ========================================================================== */
/* ==========================================================================
   reCAPTCHA — lazy load on first form interaction
   ========================================================================== */
function initLazyRecaptcha() {
  const form = qs('#contactForm');
  if (!form) return;

  let recaptchaLoaded = false;

  function loadRecaptcha() {
    if (recaptchaLoaded) return;
    recaptchaLoaded = true;

    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit&onload=_rcLoaded';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    window._rcLoaded = function() {
      const widget = qs('#recaptchaWidget');
      if (!widget) return;
      widget.innerHTML = '';
      grecaptcha.render('recaptchaWidget', {
        sitekey: '6Le32wQtAAAAAPFLddugShQY42CzYQVn20Z9f44z',
        theme: 'dark',
        size: 'normal'
      });
    };
  }

  // Load on first interaction with any form field
  const fields = form.querySelectorAll('input, select, textarea');
  fields.forEach(el => {
    el.addEventListener('focus', loadRecaptcha, { once: true, passive: true });
  });

  // Also load when contact section scrolls into view
  const contactSection = qs('#contact');
  if (contactSection && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { loadRecaptcha(); io.disconnect(); }
    }, { threshold: 0.1 });
    io.observe(contactSection);
  }
}

function initContactForm() {
  const form    = qs('#contactForm');
  if (!form) return;

  const submitBtn = qs('#submitBtn', form);
  const success   = qs('#formSuccess', form);

  const rules = {
    name:        { required: true, label: 'Name' },
    email:       { required: true, type: 'email', label: 'Email' },
    projectType: { required: true, label: 'Project Type' },
    message:     { required: true, minLen: 20, label: 'Message' },
  };

  function validateField(name, value) {
    const r = rules[name];
    if (!r) return '';
    if (r.required && !value.trim()) return `${r.label} is required.`;
    if (r.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return 'Please enter a valid email address.';
    if (r.minLen && value.trim().length < r.minLen)
      return `${r.label} must be at least ${r.minLen} characters.`;
    return '';
  }

  function setFieldError(name, msg) {
    const input = form.elements[name];
    const errEl = qs('#' + name + 'Error', form);
    if (input) input.classList.toggle('invalid', !!msg);
    if (errEl) errEl.textContent = msg;
  }

  // Live validation on blur
  Object.keys(rules).forEach(name => {
    const el = form.elements[name];
    if (!el) return;
    el.addEventListener('blur', () => {
      setFieldError(name, validateField(name, el.value));
    });
    el.addEventListener('input', () => {
      if (el.classList.contains('invalid'))
        setFieldError(name, validateField(name, el.value));
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;

    Object.keys(rules).forEach(name => {
      const el = form.elements[name];
      const msg = validateField(name, el ? el.value : '');
      setFieldError(name, msg);
      if (msg) valid = false;
    });

    if (!valid) {
      // Focus first invalid
      const firstInvalid = form.querySelector('.invalid');
      firstInvalid?.focus();
      return;
    }

    // reCAPTCHA v2 validation
    const recaptchaEl = qs('#recaptchaError', form);
    if (typeof grecaptcha !== 'undefined') {
      const token = grecaptcha.getResponse();
      if (!token) {
        if (recaptchaEl) recaptchaEl.textContent = 'Please complete the CAPTCHA verification.';
        qs('#recaptchaWidget')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (recaptchaEl) recaptchaEl.textContent = '';
    }

    // Disable button and show sending state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Sending…';

    const errorEl = qs('#formError', form);

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    })
    .then(response => {
      if (response.ok) {
        // Show inline success then redirect
        submitBtn.style.display = 'none';
        if (success) {
          success.hidden = false;
          success.style.opacity = '0';
          success.style.transform = 'translateY(8px)';
          success.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          requestAnimationFrame(() => requestAnimationFrame(() => {
            success.style.opacity  = '1';
            success.style.transform = 'translateY(0)';
          }));
        }
        setTimeout(() => { window.location.href = 'thankyou.html'; }, 1800);
      } else {
        const label = (typeof RadioTechI18n !== 'undefined') ? RadioTechI18n.get('contact.form_submit') : 'Send Message';
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> ${label}`;
        if (errorEl) errorEl.hidden = false;
      }
    })
    .catch(() => {
      const label = (typeof RadioTechI18n !== 'undefined') ? RadioTechI18n.get('contact.form_submit') : 'Send Message';
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> ${label}`;
      if (errorEl) errorEl.hidden = false;
    });
  });
}

/* ==========================================================================
   12. Footer Year
   ========================================================================== */
function initYear() {
  const el = qs('#currentYear');
  if (el) el.textContent = new Date().getFullYear();
}

/* ==========================================================================
   13. Typewriter Effect for Hero
   ========================================================================== */
function initTypewriter() {
  const el = qs('.np-song');
  if (!el) return;

  const songs = [
    'Morning Vibes — DJ Premier',
    'Electric Pulse — Radio Beats',
    'Night Drive — SoundWave FM',
    'Deep House Session — DJ Aria',
    'Top 40 Mix — Frequency Radio',
  ];
  let idx = 0;
  let charIdx = 0;
  let deleting = false;
  let pause = false;

  function type() {
    if (pause) { setTimeout(type, 1500); pause = false; return; }

    const current = songs[idx];
    if (!deleting) {
      el.textContent = current.slice(0, ++charIdx);
      if (charIdx === current.length) { deleting = true; pause = true; }
    } else {
      el.textContent = current.slice(0, --charIdx);
      if (charIdx === 0) { deleting = false; idx = (idx + 1) % songs.length; pause = true; }
    }
    setTimeout(type, deleting ? 40 : 80);
  }
  setTimeout(type, 2000);
}

/* ==========================================================================
   14. Staggered Card Entrance (platform cards)
   ========================================================================== */
function initCardStagger() {
  const grids = qsa('.platforms-grid, .cards-grid, .why-grid');
  grids.forEach(grid => {
    const cards = qsa(':scope > *', grid);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          cards.forEach((card, i) => {
            setTimeout(() => {
              card.style.transitionDelay = '0ms';
            }, i * 60 + 600);
          });
        }
      });
    }, { threshold: 0.1 });
    observer.observe(grid);
  });
}

/* ==========================================================================
   15. Pricing Card Hover Glow
   ========================================================================== */
function initPricingGlow() {
  const cards = qsa('.pricing-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect  = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
      const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
      card.style.setProperty('--mouse-x', x + '%');
      card.style.setProperty('--mouse-y', y + '%');
    });
  });
}

/* ==========================================================================
   16. Problem Cards Hover Highlight (CSS handles hover; JS stub kept for
       compatibility — cycling animation removed per UX audit)
   ========================================================================== */
function initProblemTags() {
  // Cycling highlight removed — CSS :hover handles interaction instead.
  // Function retained so future callers don't throw.
}

/* ==========================================================================
   17. Announcement Bar dismiss with localStorage (bar removed from HTML;
       function retained for safety)
   ========================================================================== */
function initAnnouncementBar() {
  const bar = qs('#announcementBar');
  if (!bar) return;
  try {
    // Hide immediately if previously dismissed
    if (localStorage.getItem('rts_ann_closed') === '1') {
      bar.style.display = 'none';
      return;
    }
    const closeBtn = qs('.announcement-close', bar);
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        bar.style.maxHeight = bar.offsetHeight + 'px';
        bar.style.overflow  = 'hidden';
        bar.style.transition = 'max-height 0.3s ease, opacity 0.3s ease';
        requestAnimationFrame(() => {
          bar.style.maxHeight = '0';
          bar.style.opacity   = '0';
        });
        bar.addEventListener('transitionend', () => {
          bar.style.display = 'none';
        }, { once: true });
        try { localStorage.setItem('rts_ann_closed', '1'); } catch (_) {}
      });
    }
  } catch (_) {}
}

/* ==========================================================================
   18. Lazy Image Loading (future-proof)
   ========================================================================== */
function initLazyImages() {
  const imgs = qsa('img[data-src]');
  if (!imgs.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        io.unobserve(img);
      }
    });
  });
  imgs.forEach(img => io.observe(img));
}

/* ==========================================================================
   19. Service Card Tilt on Mouse Move
   ========================================================================== */
function initCardTilt() {
  if (window.matchMedia('(hover: none)').matches) return; // Skip on touch

  const cards = qsa('.service-card, .case-card, .platform-card');
  const MAX_TILT = 6;

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect  = card.getBoundingClientRect();
      const cx    = rect.left + rect.width  / 2;
      const cy    = rect.top  + rect.height / 2;
      const dx    = (e.clientX - cx) / (rect.width  / 2);
      const dy    = (e.clientY - cy) / (rect.height / 2);
      const tiltX = (-dy * MAX_TILT).toFixed(2);
      const tiltY = ( dx * MAX_TILT).toFixed(2);
      card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.4s ease';
      setTimeout(() => { card.style.transition = ''; }, 400);
    });
  });
}

/* ==========================================================================
   20. Testimonial / Counter Stats (if added later)
   ========================================================================== */
function initCounterAnimations() {
  // Extensible hook for animated number counters
  const counters = qsa('[data-counter]');
  counters.forEach(el => {
    const target = parseInt(el.dataset.counter, 10);
    const io = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const dur = 1800;
      function step(now) {
        const t = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(t * target);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, { threshold: 0.5 });
    io.observe(el);
  });
}

/* ==========================================================================
   21. Pricing Package → Auto-select Project Type in Contact Form
   ========================================================================== */
function initPricingPackageLinks() {
  const select = qs('#projectType');
  if (!select) return;

  document.addEventListener('click', e => {
    const link = e.target.closest('a[data-package]');
    if (!link) return;

    const pkg = link.dataset.package;

    // Set the select value after the scroll animation lands (~700ms)
    setTimeout(() => {
      // Find the matching option
      const option = [...select.options].find(o => o.value === pkg);
      if (option) {
        select.value = pkg;
        // Clear any previous error state
        select.classList.remove('invalid');
        const err = qs('#projectError');
        if (err) err.textContent = '';
      }

      // Pulse-highlight the select field to draw attention
      select.classList.add('field-autofilled');
      setTimeout(() => select.classList.remove('field-autofilled'), 1800);

      // Focus the select so user knows it's been set
      select.focus({ preventScroll: true });
    }, 700);
  });
}

/* ==========================================================================
   22. i18n Initialisation
   ========================================================================== */
function initI18n() {
  // i18n.js self-initialises via its own DOMContentLoaded listener.
  // Nothing extra needed here — guard exists only to avoid errors if script missing.
  if (typeof RadioTechI18n !== 'undefined' && typeof RadioTechI18n.init === 'function') {
    RadioTechI18n.init();
  }
}

/* ==========================================================================
   Init on DOM ready
   ========================================================================== */
function init() {
  initI18n(); // Must run first — applies translations before page renders
  initAnnouncementBar();
  initScrollProgress();
  initStickyHeader();
  initActiveNav();
  initHamburger();
  initSmoothScroll();
  initScrollTop();
  initAOS();
  initLazyRecaptcha();
  initWaveCanvas();
  initListenersCounter();
  initFAQ();
  initContactForm();
  initYear();
  initTypewriter();
  initCardStagger();
  initPricingGlow();
  initPricingPackageLinks();
  initProblemTags();
  initLazyImages();
  initCardTilt();
  initCounterAnimations();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

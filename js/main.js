/* NeevSemi — main.js */

(function () {
  'use strict';

  /* ── Sanitize input (XSS prevention) ────────────────────────────── */
  function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = String(str).trim();
    return div.innerHTML;
  }

  /* ── Mobile nav ─────────────────────────────────────────────────── */
  const hamburger = document.querySelector('.nav__hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });

    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── Products dropdown — touch/click support ─────────────────────── */
  document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
    const trigger = dropdown.querySelector('a');
    if (!trigger) return;

    trigger.addEventListener('click', (e) => {
      // Only intercept on touch/mobile — desktop uses CSS :hover
      if (window.innerWidth > 768) return;
      e.preventDefault();
      const isOpen = dropdown.classList.contains('open');
      // Close all other dropdowns
      document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
      if (!isOpen) dropdown.classList.add('open');
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-dropdown')) {
      document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
    }
  });

  /* ── Scroll reveal ───────────────────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal');

  if (revealEls.length) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            setTimeout(() => e.target.classList.add('visible'), i * 80);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(el => obs.observe(el));
  }

  /* ── Benchmark bar animation ─────────────────────────────────────── */
  const bars = document.querySelectorAll('.bench-fill[data-val]');

  if (bars.length) {
    const barObs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.style.width = e.target.dataset.val + '%';
            barObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    bars.forEach(b => barObs.observe(b));
  }

  /* ── Contact form (Web3Forms) ───────────────────────────────────── */
  const WEB3FORMS_KEY = '85706bdd-a50f-47e1-9b2f-1b781ab4a703';
  const RATE_LIMIT_MS = 60000; // 1 minute between submissions

  const form = document.querySelector('.contact-form');
  if (form) {

    /* Live validation — red border on blur if empty/invalid */
    form.querySelectorAll('input[required], textarea[required]').forEach(field => {
      field.addEventListener('blur', () => {
        const empty = !field.value.trim();
        const badEmail = field.type === 'email' && field.value &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);
        field.classList.toggle('field--error', empty || badEmail);
      });
      field.addEventListener('input', () => field.classList.remove('field--error'));
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      /* ── Honeypot check — bots fill this, humans don't ── */
      const honeypot = form.querySelector('[name="website_url"]');
      if (honeypot && honeypot.value.trim() !== '') return; // Silent drop

      /* ── Rate limiting (client-side) ── */
      const lastSubmit = localStorage.getItem('ns_last_submit');
      if (lastSubmit && Date.now() - parseInt(lastSubmit, 10) < RATE_LIMIT_MS) {
        const wait = Math.ceil((RATE_LIMIT_MS - (Date.now() - parseInt(lastSubmit, 10))) / 1000);
        alert('Please wait ' + wait + ' seconds before submitting again.');
        return;
      }

      const nameEl    = form.querySelector('[name="name"]');
      const emailEl   = form.querySelector('[name="email"]');
      const messageEl = form.querySelector('[name="message"]');
      let valid = true;

      [nameEl, emailEl, messageEl].forEach(el => {
        if (!el || !el.value.trim()) {
          el && el.classList.add('field--error');
          valid = false;
        }
      });
      if (emailEl && emailEl.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
        emailEl.classList.add('field--error');
        valid = false;
      }

      /* Max length validation */
      if (nameEl && nameEl.value.trim().length > 200) { nameEl.classList.add('field--error'); valid = false; }
      if (messageEl && messageEl.value.trim().length > 5000) { messageEl.classList.add('field--error'); valid = false; }

      if (!valid) return;

      const btn  = form.querySelector('button[type="submit"]');
      const orig = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;

      /* Sanitize before sending */
      const safeName    = sanitize(nameEl.value);
      const safeEmail   = sanitize(emailEl.value);
      const safeMessage = sanitize(messageEl.value);

      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: WEB3FORMS_KEY,
            subject:    'New message from NeevSemi website',
            name:       safeName,
            email:      safeEmail,
            message:    safeMessage,
            from_name:  'NeevSemi Contact Form',
            botcheck:   ''  // Web3Forms built-in bot check
          })
        });

        const data = await res.json();

        if (data.success) {
          localStorage.setItem('ns_last_submit', String(Date.now()));
          btn.textContent = 'Message Sent ✓';
          btn.style.background = '#34c759';
          form.reset();
          setTimeout(() => {
            btn.textContent = orig;
            btn.disabled = false;
            btn.style.background = '';
          }, 4000);
        } else {
          throw new Error(data.message || 'Submission failed');
        }
      } catch (err) {
        btn.textContent = 'Something went wrong — try again';
        btn.style.background = '#ff3b30';
        setTimeout(() => {
          btn.textContent = orig;
          btn.disabled = false;
          btn.style.background = '';
        }, 3500);
      }
    });
  }

  /* ── Smooth anchor scrolling ─────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 64;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

})();

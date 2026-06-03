/* NeevSemi — main.js */

(function () {
  'use strict';

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
  const WEB3FORMS_KEY = "85706bdd-a50f-47e1-9b2f-1b781ab4a703";

  const form = document.querySelector('.contact-form');
  if (form) {
    // Live validation — red border on blur if empty/invalid
    form.querySelectorAll('input[required], textarea[required]').forEach(field => {
      field.addEventListener('blur', () => {
        const empty = !field.value.trim();
        const badEmail = field.type === 'email' && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);
        field.classList.toggle('field--error', empty || badEmail);
      });
      field.addEventListener('input', () => field.classList.remove('field--error'));
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

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
      if (!valid) return;

      const btn  = form.querySelector('button[type="submit"]');
      const orig = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;

      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: WEB3FORMS_KEY,
            subject: 'New message from NeevSemi website',
            name:    nameEl.value.trim(),
            email:   emailEl.value.trim(),
            message: messageEl.value.trim(),
            from_name: 'NeevSemi Contact Form'
          })
        });

        const data = await res.json();

        if (data.success) {
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
        console.error('Form error:', err);
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
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 64;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
})();

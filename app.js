(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && 'IntersectionObserver' in window) document.documentElement.classList.add('motion-ready');
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  // Keyboard-accessible navigation. The Services panel is optional; its primary link still works.
  const navToggle = $('#menu-toggle');
  const mobileMenu = $('#mobile-menu');
  const mega = $('#services-mega');
  const servicesLink = $('.nav__link[href="services.html"]');
  const closeMobile = () => {
    if (!mobileMenu || !navToggle) return;
    mobileMenu.hidden = true;
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation');
    document.body.classList.remove('no-scroll');
  };
  navToggle?.addEventListener('click', () => {
    const next = mobileMenu.hidden;
    mobileMenu.hidden = !next;
    navToggle.setAttribute('aria-expanded', String(next));
    navToggle.setAttribute('aria-label', next ? 'Close navigation' : 'Open navigation');
    document.body.classList.toggle('no-scroll', next);
  });
  $$('a', mobileMenu || document.createElement('div')).forEach(a => a.addEventListener('click', closeMobile));
  let megaTimer;
  const openMega = () => { clearTimeout(megaTimer); if (window.innerWidth > 900) mega?.classList.add('is-open'); };
  const closeMega = () => { megaTimer = setTimeout(() => mega?.classList.remove('is-open'), 130); };
  servicesLink?.addEventListener('mouseenter', openMega);
  servicesLink?.addEventListener('focus', openMega);
  servicesLink?.addEventListener('mouseleave', closeMega);
  mega?.addEventListener('mouseenter', openMega);
  mega?.addEventListener('mouseleave', closeMega);
  mega?.addEventListener('focusout', (e) => { if (!mega.contains(e.relatedTarget)) closeMega(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeMobile(); mega?.classList.remove('is-open'); }
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 900) closeMobile(); }, { passive: true });

  // Progressive-reveal animation: content remains visible with JS disabled in the CSS fallback.
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver(entries => {
      for (const item of entries) if (item.isIntersecting) {
        item.target.classList.add('in-view');
        observer.unobserve(item.target);
      }
    }, { threshold: 0.07, rootMargin: '0px 0px 45px 0px' });
    $$('.reveal').forEach(el => observer.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('in-view'));
  }

  // Subtle hero depth, no canvas/WebGL required. Saves RAM and avoids GPU crashes on older PCs.
  const scene = $('#hero-scene');
  if (scene && !reduceMotion && window.matchMedia('(min-width: 901px) and (pointer: fine)').matches) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf;
    const animate = () => {
      cx += (tx - cx) * 0.075; cy += (ty - cy) * 0.075;
      scene.style.transform = `rotateY(${cx.toFixed(2)}deg) rotateX(${cy.toFixed(2)}deg)`;
      if (Math.abs(tx - cx) > 0.03 || Math.abs(ty - cy) > 0.03) raf = requestAnimationFrame(animate);
      else raf = null;
    };
    const set = (x, y) => { tx = x; ty = y; if (!raf) raf = requestAnimationFrame(animate); };
    scene.closest('.hero').addEventListener('pointermove', e => {
      const rect = scene.getBoundingClientRect();
      set(Math.max(-6, Math.min(6, ((e.clientX - rect.left) / rect.width - .5) * 12)), Math.max(-5, Math.min(5, ((e.clientY - rect.top) / rect.height - .5) * -10)));
    }, { passive: true });
    scene.closest('.hero').addEventListener('pointerleave', () => set(0, 0));
  }

  // Demonstration only: no real AI calls or fabricated real-time records.
  const flowLines = [
    'A customer sends an inquiry through your website or WhatsApp.',
    'An AI-assisted step evaluates the inquiry according to agreed qualification rules.',
    'Structured lead details are added or updated in your connected CRM.',
    'The right person receives a task or alert so the conversation can move forward.'
  ];
  $$('[data-flow]').forEach(flow => {
    const nodes = $$('[data-flow-index]', flow);
    const output = $('#flow-description', flow);
    nodes.forEach(node => node.addEventListener('click', () => {
      nodes.forEach(n => n.classList.toggle('is-selected', n === node));
      if (output) output.textContent = flowLines[Number(node.dataset.flowIndex)] || flowLines[0];
    }));
  });

  // Portfolio filters use real markup rather than re-rendering cards.
  $$('.filter-button').forEach(button => button.addEventListener('click', () => {
    const value = button.dataset.filter;
    $$('.filter-button').forEach(b => b.classList.toggle('is-active', b === button));
    $$('[data-category]').forEach(item => { item.hidden = value !== 'all' && !item.dataset.category.split(' ').includes(value); });
  }));

  // Static Hostinger deployment: visitors review and send their own WhatsApp inquiry.
  // No backend is available here; do not claim that a form submission was saved.
  const form = $('#contact-form');
  if (form) {
    const status = $('#form-status');
    const submitLabel = $('button[type="submit"] span', form);
    if (submitLabel) submitLabel.textContent = 'Continue on WhatsApp';
    form.addEventListener('submit', e => {
      e.preventDefault();
      status.textContent = '';
      status.className = 'form-status';
      $$('[aria-invalid="true"]', form).forEach(el => el.removeAttribute('aria-invalid'));
      if (!form.checkValidity()) {
        const invalid = $$(':invalid', form);
        invalid.forEach(el => el.setAttribute('aria-invalid', 'true'));
        invalid[0]?.focus();
        status.textContent = 'Please complete the required fields correctly.';
        status.classList.add('is-error');
        return;
      }
      const values = Object.fromEntries(new FormData(form).entries());
      if (values.website) return; // honeypot: bots fill this hidden field
      const message = [
        'Hello Buzz Network, I would like to discuss a project.',
        `Name: ${values.name || ''}`,
        `Email: ${values.email || ''}`,
        `Phone: ${values.phone || 'Not provided'}`,
        `Service: ${values.service || ''}`,
        `Project details: ${values.message || ''}`
      ].join('\n');
      status.textContent = 'WhatsApp will open with your prepared inquiry. Please tap Send there to submit it.';
      status.classList.add('is-success');
      window.location.href = 'https://wa.me/923178857600?text=' + encodeURIComponent(message);
    });
  }

})();

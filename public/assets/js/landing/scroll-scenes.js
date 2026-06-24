/**
 * GSAP ScrollTrigger — Scroll Storytelling Scenes
 * 
 * Orchestrates all scroll-based animations:
 * - Statistics counter animation
 * - Risk factors card reveals
 * - AI flow step-by-step animation
 * - CTA section entrance
 */
(function () {
  'use strict';

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  // ── Counter Animation ──
  function animateCounter(element, target, suffix = '') {
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 2.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        once: true,
      },
      onUpdate: () => {
        element.textContent = Math.floor(obj.val).toLocaleString('id-ID') + suffix;
      },
    });
  }

  // ── Statistics Scene ──
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  statNumbers.forEach((el) => {
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    animateCounter(el, target, suffix);
  });

  // Stat items stagger reveal
  gsap.from('.stat-item', {
    opacity: 0,
    y: 60,
    duration: 0.8,
    stagger: 0.2,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '#stats-grid',
      start: 'top 80%',
      once: true,
    },
  });

  // Statistics section header
  gsap.from('#statistics .section-badge, #statistics .section-title, #statistics .section-desc', {
    opacity: 0,
    y: 40,
    duration: 0.7,
    stagger: 0.15,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '#statistics',
      start: 'top 75%',
      once: true,
    },
  });

  // ── Risk Factors Scene ──
  gsap.from('#risk-factors .section-badge, #risk-factors .section-title, #risk-factors .section-desc', {
    opacity: 0,
    y: 40,
    duration: 0.7,
    stagger: 0.15,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '#risk-factors',
      start: 'top 75%',
      once: true,
    },
  });

  gsap.from('.risk-factor-card', {
    opacity: 0,
    y: 50,
    scale: 0.95,
    duration: 0.6,
    stagger: 0.1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '#risk-factors-grid',
      start: 'top 80%',
      once: true,
    },
  });

  // ── AI Technology Scene ──
  gsap.from('#technology .section-badge, #technology .section-title, #technology .section-desc', {
    opacity: 0,
    y: 40,
    duration: 0.7,
    stagger: 0.15,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '#technology',
      start: 'top 75%',
      once: true,
    },
  });

  // AI flow steps - sequential reveal
  const aiFlowSteps = document.querySelectorAll('.ai-flow-step');
  const aiFlowArrows = document.querySelectorAll('.ai-flow-arrow');

  gsap.from(aiFlowSteps, {
    opacity: 0,
    y: 40,
    scale: 0.9,
    duration: 0.5,
    stagger: 0.15,
    ease: 'back.out(1.4)',
    scrollTrigger: {
      trigger: '#ai-flow',
      start: 'top 80%',
      once: true,
    },
  });

  gsap.from(aiFlowArrows, {
    opacity: 0,
    x: -20,
    duration: 0.4,
    stagger: 0.15,
    delay: 0.3,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '#ai-flow',
      start: 'top 80%',
      once: true,
    },
  });

  // ── CTA Scene ──
  gsap.from('#cta .cta-title, #cta .cta-desc, #cta .cta-buttons', {
    opacity: 0,
    y: 50,
    duration: 0.8,
    stagger: 0.2,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '#cta',
      start: 'top 75%',
      once: true,
    },
  });

  // ── Footer reveal ──
  gsap.from('.footer-grid > div', {
    opacity: 0,
    y: 30,
    duration: 0.6,
    stagger: 0.1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '#footer',
      start: 'top 90%',
      once: true,
    },
  });

  // ── Smooth Scroll for Anchor Links ──
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        gsap.to(window, {
          scrollTo: { y: target, offsetY: 80 },
          duration: 1,
          ease: 'power3.inOut',
        });
      }
    });
  });
})();

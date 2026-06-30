/**
 * Features Section — Card Animations
 * Uses GSAP ScrollTrigger for staggered reveal
 */
(function () {
  'use strict';

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  // Features header reveal
  gsap.from('#features .section-badge, #features .section-title, #features .section-desc', {
    opacity: 0,
    y: 40,
    duration: 0.7,
    stagger: 0.15,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '#features',
      start: 'top 75%',
      once: true,
    },
  });

  // Feature cards stagger
  gsap.from('.feature-card', {
    opacity: 0,
    y: 60,
    scale: 0.95,
    duration: 0.6,
    stagger: {
      each: 0.1,
      from: 'start',
    },
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '#features-grid',
      start: 'top 80%',
      once: true,
    },
  });

  // ── Magnetic hover effect for feature cards ──
  const cards = document.querySelectorAll('.feature-card');

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;

      gsap.to(card, {
        rotateX,
        rotateY,
        transformPerspective: 800,
        duration: 0.3,
        ease: 'power2.out',
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)',
      });
    });
  });
})();

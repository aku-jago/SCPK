/**
 * Hero Section — 3D Interactive Human Model
 * 
 * Features:
 * - Mouse movement tracking with requestAnimationFrame
 * - rotateX() and rotateY() limited to ±8 degrees
 * - translate3d() for depth simulation
 * - GSAP-powered inertia for smooth deceleration
 * - Breathing animation (CSS keyframe)
 * - Parallax layers at different speeds
 * - Premium Apple-like interactions
 */
(function () {
  'use strict';

  const model = document.getElementById('hero-model');
  const modelContainer = document.getElementById('model-container');
  if (!model || !modelContainer) return;

  // ── Configuration ──
  const MAX_ROTATION = 8; // degrees
  const MAX_TRANSLATE = 15; // pixels
  const SMOOTHING = 0.08; // lower = smoother (GSAP-like inertia)

  // ── State ──
  let targetRotateX = 0;
  let targetRotateY = 0;
  let targetTranslateX = 0;
  let targetTranslateY = 0;

  let currentRotateX = 0;
  let currentRotateY = 0;
  let currentTranslateX = 0;
  let currentTranslateY = 0;

  // ── Mouse Tracking ──
  function handleMouseMove(e) {
    // Normalize mouse position to -1 to 1
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const normalizedX = (e.clientX - centerX) / centerX;
    const normalizedY = (e.clientY - centerY) / centerY;

    // Set targets (inverted Y for natural feel)
    targetRotateY = normalizedX * MAX_ROTATION;
    targetRotateX = -normalizedY * MAX_ROTATION;
    targetTranslateX = normalizedX * MAX_TRANSLATE;
    targetTranslateY = normalizedY * MAX_TRANSLATE;
  }

  document.addEventListener('mousemove', handleMouseMove, { passive: true });

  // ── Animation Loop (60fps) ──
  function animate() {
    requestAnimationFrame(animate);

    // Smooth interpolation (GSAP-like inertia)
    currentRotateX += (targetRotateX - currentRotateX) * SMOOTHING;
    currentRotateY += (targetRotateY - currentRotateY) * SMOOTHING;
    currentTranslateX += (targetTranslateX - currentTranslateX) * SMOOTHING;
    currentTranslateY += (targetTranslateY - currentTranslateY) * SMOOTHING;

    // Apply transform with CSS 3D
    model.style.transform = `
      rotateX(${currentRotateX.toFixed(3)}deg) 
      rotateY(${currentRotateY.toFixed(3)}deg) 
      translate3d(${currentTranslateX.toFixed(2)}px, ${currentTranslateY.toFixed(2)}px, 0px)
    `;
  }

  animate();

  // ── Parallax Layers ──
  const parallaxElements = document.querySelectorAll('[data-parallax-speed]');

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    
    parallaxElements.forEach((el) => {
      const speed = parseFloat(el.dataset.parallaxSpeed) || 0;
      
      gsap.to(el, {
        y: () => -window.innerHeight * speed,
        ease: "none",
        scrollTrigger: {
          trigger: "#hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true
        }
      });
    });
  } else {
    // Fallback if GSAP is not loaded
    function handleScroll() {
      const scrollY = window.scrollY;

      parallaxElements.forEach((el) => {
        const speed = parseFloat(el.dataset.parallaxSpeed) || 0;
        const yOffset = -(scrollY * speed);
        el.style.transform = `translateY(${yOffset}px)`;
      });
    }

    // Use passive scroll listener for performance
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // ── Navbar Scroll Effect ──
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const navbarObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      },
      { threshold: 0.8 }
    );

    const heroSection = document.getElementById('hero');
    if (heroSection) {
      navbarObserver.observe(heroSection);
    }
  }

  // ── Scroll Indicator Hide ──
  const scrollIndicator = document.getElementById('scroll-indicator');
  if (scrollIndicator) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 100) {
        scrollIndicator.style.opacity = '0';
        scrollIndicator.style.pointerEvents = 'none';
      } else {
        scrollIndicator.style.opacity = '1';
        scrollIndicator.style.pointerEvents = 'auto';
      }
    }, { passive: true });
  }

  // ── Entry Animation with GSAP ──
  if (typeof gsap !== 'undefined') {
    // Animate the glow orbs
    gsap.to('.hero-glow-orb-1', {
      x: 30,
      y: 20,
      duration: 8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    gsap.to('.hero-glow-orb-2', {
      x: -25,
      y: -15,
      duration: 10,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    gsap.to('.hero-glow-orb-3', {
      scale: 1.3,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    // Animate floating cards with GSAP for smoother motion
    gsap.to('#floating-card-1', {
      y: -15,
      rotation: 2,
      duration: 5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    gsap.to('#floating-card-2', {
      y: -12,
      rotation: -1.5,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 1,
    });

    gsap.to('#floating-card-3', {
      y: -18,
      rotation: 1,
      duration: 7,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 2,
    });

    // Model container entrance animation
    gsap.from(modelContainer, {
      opacity: 0,
      scale: 0.9,
      y: 40,
      duration: 1.2,
      ease: 'power3.out',
      delay: 0.5,
    });
  }
})();

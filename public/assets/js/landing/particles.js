/**
 * Three.js Floating Medical Particles
 * Creates an ambient particle field with DNA/medical shapes
 * Soft pink/purple palette with gentle floating animation
 */
(function () {
  'use strict';

  const canvas = document.getElementById('particles-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  camera.position.z = 50;

  // ── Particle System ──
  const particleCount = 120;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const velocities = [];

  const palette = [
    new THREE.Color('#f9a8d4'), // pink-300
    new THREE.Color('#f472b6'), // pink-400
    new THREE.Color('#d8b4fe'), // purple-300
    new THREE.Color('#c084fc'), // purple-400
    new THREE.Color('#fce7f3'), // pink-100
    new THREE.Color('#e9d5ff'), // purple-200
  ];

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;

    // Random position in a sphere
    positions[i3] = (Math.random() - 0.5) * 100;
    positions[i3 + 1] = (Math.random() - 0.5) * 80;
    positions[i3 + 2] = (Math.random() - 0.5) * 60;

    // Random color from palette
    const color = palette[Math.floor(Math.random() * palette.length)];
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;

    // Random size
    sizes[i] = Math.random() * 2 + 0.5;

    // Random velocity
    velocities.push({
      x: (Math.random() - 0.5) * 0.02,
      y: (Math.random() - 0.5) * 0.015 + 0.005, // slight upward bias
      z: (Math.random() - 0.5) * 0.01,
      rotSpeed: (Math.random() - 0.5) * 0.001,
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Create circular particle texture
  const particleCanvas = document.createElement('canvas');
  particleCanvas.width = 64;
  particleCanvas.height = 64;
  const ctx = particleCanvas.getContext('2d');

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.6)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(particleCanvas);

  const material = new THREE.PointsMaterial({
    size: 1.5,
    map: texture,
    transparent: true,
    opacity: 0.6,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // ── Plus Signs (medical crosses) ──
  const crossGroup = new THREE.Group();
  const crossMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#f9a8d4'),
    transparent: true,
    opacity: 0.15,
  });

  for (let i = 0; i < 8; i++) {
    const group = new THREE.Group();

    // Horizontal bar
    const hGeo = new THREE.BoxGeometry(2, 0.5, 0.1);
    const hMesh = new THREE.Mesh(hGeo, crossMaterial.clone());
    group.add(hMesh);

    // Vertical bar
    const vGeo = new THREE.BoxGeometry(0.5, 2, 0.1);
    const vMesh = new THREE.Mesh(vGeo, crossMaterial.clone());
    group.add(vMesh);

    group.position.set(
      (Math.random() - 0.5) * 80,
      (Math.random() - 0.5) * 60,
      (Math.random() - 0.5) * 40
    );
    group.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    group.userData = {
      rotSpeed: {
        x: (Math.random() - 0.5) * 0.003,
        y: (Math.random() - 0.5) * 0.003,
        z: (Math.random() - 0.5) * 0.003,
      },
      floatSpeed: Math.random() * 0.005 + 0.002,
      floatOffset: Math.random() * Math.PI * 2,
    };

    crossGroup.add(group);
  }
  scene.add(crossGroup);

  // ── Mouse interaction ──
  let mouseX = 0;
  let mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ── Animation Loop ──
  let time = 0;

  function animate() {
    requestAnimationFrame(animate);
    time += 0.01;

    const posArray = geometry.attributes.position.array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const vel = velocities[i];

      posArray[i3] += vel.x;
      posArray[i3 + 1] += vel.y;
      posArray[i3 + 2] += vel.z;

      // Add gentle sine wave motion
      posArray[i3] += Math.sin(time + i * 0.1) * 0.01;
      posArray[i3 + 1] += Math.cos(time + i * 0.15) * 0.008;

      // Wrap around boundaries
      if (posArray[i3] > 50) posArray[i3] = -50;
      if (posArray[i3] < -50) posArray[i3] = 50;
      if (posArray[i3 + 1] > 40) posArray[i3 + 1] = -40;
      if (posArray[i3 + 1] < -40) posArray[i3 + 1] = 40;
      if (posArray[i3 + 2] > 30) posArray[i3 + 2] = -30;
      if (posArray[i3 + 2] < -30) posArray[i3 + 2] = 30;
    }

    geometry.attributes.position.needsUpdate = true;

    // Rotate crosses
    crossGroup.children.forEach((cross) => {
      const data = cross.userData;
      cross.rotation.x += data.rotSpeed.x;
      cross.rotation.y += data.rotSpeed.y;
      cross.rotation.z += data.rotSpeed.z;
      cross.position.y += Math.sin(time * data.floatSpeed * 10 + data.floatOffset) * 0.01;
    });

    // Camera responds to mouse (subtle)
    camera.position.x += (mouseX * 3 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 2 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    // Gentle rotation
    particles.rotation.y += 0.0003;

    renderer.render(scene, camera);
  }

  animate();

  // ── Resize Handler ──
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

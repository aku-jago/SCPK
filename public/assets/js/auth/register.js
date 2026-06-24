/**
 * Register Page Logic
 */
(function () {
  'use strict';

  Auth.redirectIfAuthenticated();

  const form = document.getElementById('register-form');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirm-password');
  const submitBtn = document.getElementById('btn-submit');
  const togglePassword = document.getElementById('toggle-password');

  // Password visibility
  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      const icon = togglePassword.querySelector('i');
      if (icon) {
        icon.setAttribute('data-lucide', type === 'password' ? 'eye' : 'eye-off');
        lucide.createIcons();
      }
    });
  }

  // Password strength indicator
  passwordInput.addEventListener('input', () => {
    const val = passwordInput.value;
    let score = 0;
    if (val.length >= 8) score++;
    if (/[a-z]/.test(val) && /[A-Z]/.test(val)) score++;
    if (/\d/.test(val)) score++;
    if (/[^a-zA-Z0-9]/.test(val)) score++;

    const bars = [
      document.getElementById('str-1'),
      document.getElementById('str-2'),
      document.getElementById('str-3'),
      document.getElementById('str-4'),
    ];
    const textEl = document.getElementById('password-strength-text');
    const labels = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];
    const classes = ['', 'active', 'medium', 'strong', 'strong'];

    bars.forEach((bar, i) => {
      bar.className = 'password-strength-bar';
      if (i < score) bar.classList.add(classes[score]);
    });

    textEl.textContent = val.length > 0 ? labels[score] : '';
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelectorAll('.form-error').forEach((el) => (el.textContent = ''));
    document.querySelectorAll('.form-input').forEach((el) => el.classList.remove('error'));

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    let hasError = false;
    if (!name || name.length < 2) {
      document.getElementById('name-error').textContent = 'Nama minimal 2 karakter';
      nameInput.classList.add('error');
      hasError = true;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('email-error').textContent = 'Format email tidak valid';
      emailInput.classList.add('error');
      hasError = true;
    }
    if (!password || password.length < 8) {
      document.getElementById('password-error').textContent = 'Password minimal 8 karakter';
      passwordInput.classList.add('error');
      hasError = true;
    }
    if (password !== confirm) {
      document.getElementById('confirm-password-error').textContent = 'Password tidak cocok';
      confirmInput.classList.add('error');
      hasError = true;
    }
    if (hasError) return;

    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span style="opacity:0">Loading</span>';

    try {
      await Auth.register({ name, email, password });
      Toast.success('Registrasi berhasil! Mengalihkan ke dashboard...');
      setTimeout(() => { window.location.href = '/dashboard/'; }, 800);
    } catch (error) {
      const msg = error.errors
        ? error.errors.map((e) => e.message).join('. ')
        : error.message || 'Registrasi gagal.';
      Toast.error(msg);

      submitBtn.classList.remove('btn-loading');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="user-plus" style="width:18px;height:18px;"></i> Daftar Sekarang';
      lucide.createIcons();
    }
  });
})();

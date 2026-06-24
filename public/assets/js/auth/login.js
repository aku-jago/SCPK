/**
 * Login Page Logic
 */
(function () {
  'use strict';

  // Redirect if already authenticated
  Auth.redirectIfAuthenticated();

  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.getElementById('btn-submit');
  const togglePassword = document.getElementById('toggle-password');

  // Password visibility toggle
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

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear errors
    document.querySelectorAll('.form-error').forEach((el) => (el.textContent = ''));
    document.querySelectorAll('.form-input').forEach((el) => el.classList.remove('error'));

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Client-side validation
    let hasError = false;
    if (!email) {
      document.getElementById('email-error').textContent = 'Email harus diisi';
      emailInput.classList.add('error');
      hasError = true;
    }
    if (!password) {
      document.getElementById('password-error').textContent = 'Password harus diisi';
      passwordInput.classList.add('error');
      hasError = true;
    }
    if (hasError) return;

    // Loading state
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span style="opacity:0">Loading</span>';

    try {
      const data = await Auth.login(email, password);
      Toast.success('Login berhasil! Mengalihkan...');

      setTimeout(() => {
        if (data.user.role === 'ADMIN') {
          window.location.href = '/admin/';
        } else {
          window.location.href = '/dashboard/';
        }
      }, 800);
    } catch (error) {
      Toast.error(error.message || 'Login gagal. Periksa email dan password Anda.');

      submitBtn.classList.remove('btn-loading');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="log-in" style="width:18px;height:18px;"></i> Masuk';
      lucide.createIcons();
    }
  });
})();

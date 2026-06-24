/**
 * Forgot Password Page Logic
 */
(function () {
  'use strict';

  const form = document.getElementById('forgot-form');
  const emailInput = document.getElementById('email');
  const submitBtn = document.getElementById('btn-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('email-error').textContent = '';
    emailInput.classList.remove('error');

    const email = emailInput.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('email-error').textContent = 'Masukkan email yang valid';
      emailInput.classList.add('error');
      return;
    }

    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span style="opacity:0">Loading</span>';

    try {
      await API.post('/auth/forgot-password', { email });
      Toast.success('Instruksi reset password telah dikirim ke email Anda.');
      form.innerHTML = `
        <div style="text-align:center;padding:var(--space-8) 0;">
          <div style="width:64px;height:64px;background:var(--success-light);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-4);">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h3 style="font-size:var(--text-lg);font-weight:700;color:var(--gray-900);margin-bottom:var(--space-2);">Email Terkirim!</h3>
          <p style="font-size:var(--text-sm);color:var(--gray-500);">Periksa inbox Anda untuk instruksi reset password.</p>
        </div>
      `;
    } catch (error) {
      Toast.info(error.message || 'Jika email terdaftar, instruksi reset akan dikirim.');
      submitBtn.classList.remove('btn-loading');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="send" style="width:18px;height:18px;"></i> Kirim Instruksi Reset';
      lucide.createIcons();
    }
  });
})();

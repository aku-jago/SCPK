/**
 * Account Settings — Password changes logic
 */
(function () {
  'use strict';

  if (!Auth.requireAuth()) return;

  // Sidebar toggle
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggle = document.getElementById('sidebar-toggle');

  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', () => Auth.logout());

  // User Info
  const user = Auth.getUser();
  if (user) {
    document.getElementById('user-name').textContent = user.name || 'User';

    const roleEl = document.getElementById('user-role');
    if (roleEl) roleEl.textContent = user.role === 'ADMIN' ? 'Administrator' : 'Pengguna';


    // Add Admin link if user is ADMIN
    if (user.role === 'ADMIN') {
      const nav = document.querySelector('.sidebar-nav');
      if (nav && !document.getElementById('nav-admin-return')) {
        nav.insertAdjacentHTML('beforeend', `
          <div class="sidebar-section-title" style="margin-top:var(--space-4);">Admin Area</div>
          <a href="/admin/" class="sidebar-link" id="nav-admin-return">
            <i data-lucide="shield" style="width:20px;height:20px;"></i> Dashboard Admin
          </a>
        `);
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }

    const avatarEl = document.getElementById('user-avatar');
    if (avatarEl) {
      if (user.avatar) {
        avatarEl.innerHTML = '<img src="' + user.avatar + '" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
        avatarEl.style.background = 'none';
      } else {
        avatarEl.textContent = (user.name || 'U').charAt(0).toUpperCase();
      }
    }
  }

  // Password Form Elements
  const form = document.getElementById('settings-password-form');
  const currentPasswordInput = document.getElementById('current-password');
  const newPasswordInput = document.getElementById('new-password');
  const confirmNewPasswordInput = document.getElementById('confirm-new-password');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear Errors
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');

    let isValid = true;
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmNewPassword = confirmNewPasswordInput.value;

    if (!currentPassword) {
      document.getElementById('current-password-error').textContent = 'Password saat ini harus diisi';
      isValid = false;
    }

    if (!newPassword || newPassword.length < 8) {
      document.getElementById('new-password-error').textContent = 'Password baru minimal 8 karakter';
      isValid = false;
    }

    if (newPassword === currentPassword) {
      document.getElementById('new-password-error').textContent = 'Password baru harus berbeda dengan password lama';
      isValid = false;
    }

    if (newPassword !== confirmNewPassword) {
      document.getElementById('confirm-new-password-error').textContent = 'Konfirmasi password baru tidak cocok';
      isValid = false;
    }

    if (!isValid) return;

    const btn = document.getElementById('btn-save-password');
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Menyimpan...';

    try {
      await API.put('/auth/change-password', {
        currentPassword,
        newPassword
      });

      Toast.success('Password berhasil diubah!');
      form.reset();

    } catch (err) {
      console.error(err);
      const msg = err.errors ? err.errors.map(e => e.msg).join('. ') : err.message || 'Gagal mengubah password.';
      Toast.error(msg);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });
})();

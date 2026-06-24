/**
 * Admin Settings — Profile and password adjustments JS control
 */
(function () {
  'use strict';

  if (!Auth.requireAdmin()) return;

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

  // Set Profile Name
  const user = Auth.getUser();
  if (user) {
    document.getElementById('user-name').textContent = user.name || 'Admin';
    document.getElementById('user-avatar').textContent = (user.name || 'A').charAt(0).toUpperCase();
  }

  // DOM elements
  const profileForm = document.getElementById('admin-profile-form');
  const nameInput = document.getElementById('admin-name');
  const emailInput = document.getElementById('admin-email');

  const passwordForm = document.getElementById('admin-password-form');
  const currentPasswordInput = document.getElementById('current-password');
  const newPasswordInput = document.getElementById('new-password');
  const confirmNewPasswordInput = document.getElementById('confirm-new-password');

  async function loadAdminInfo() {
    try {
      const res = await API.get('/auth/me');
      const data = res.data;

      nameInput.value = data.name || '';
      emailInput.value = data.email || '';

      // Sync sidebar
      document.getElementById('user-name').textContent = data.name || 'Admin';
      document.getElementById('user-avatar').textContent = (data.name || 'A').charAt(0).toUpperCase();

    } catch (err) {
      console.error(err);
      Toast.error('Gagal memuat informasi akun.');
    }
  }

  // Profile Form submit
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('name-error').textContent = '';

    const name = nameInput.value.trim();
    if (!name || name.length < 2) {
      document.getElementById('name-error').textContent = 'Nama lengkap minimal 2 karakter';
      return;
    }

    const btn = document.getElementById('btn-save-profile');
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Menyimpan...';

    try {
      const res = await API.put('/auth/profile', { name });
      const updatedUser = res.data;

      // Update local storage cache
      const localUser = Auth.getUser();
      if (localUser) {
        localUser.name = updatedUser.name;
        API.setUser(localUser);
      }

      Toast.success('Profil admin berhasil diperbarui!');
      loadAdminInfo();

    } catch (err) {
      console.error(err);
      Toast.error(err.message || 'Gagal memperbarui profil admin.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });

  // Password Form submit
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
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
      document.getElementById('confirm-new-password-error').textContent = 'Konfirmasi password tidak cocok';
      isValid = false;
    }

    if (!isValid) return;

    const btn = document.getElementById('btn-save-password');
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Menyimpan...';

    try {
      await API.put('/auth/change-password', { currentPassword, newPassword });
      Toast.success('Password admin berhasil diubah!');
      passwordForm.reset();
    } catch (err) {
      console.error(err);
      Toast.error(err.message || 'Gagal mengubah password admin.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });

  loadAdminInfo();
})();

/**
 * User Profile — Edit Profile Form Logic
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

  // Elements
  const form = document.getElementById('profile-form');
  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');
  const phoneInput = document.getElementById('profile-phone');
  const genderSelect = document.getElementById('profile-gender');
  const dobInput = document.getElementById('profile-dob');

  // Summary Card Elements
  const cardAvatar = document.getElementById('profile-card-avatar');
  const cardName = document.getElementById('profile-card-name');
  const cardEmail = document.getElementById('profile-card-email');
  const cardRole = document.getElementById('profile-card-role');
  const cardJoined = document.getElementById('profile-card-joined');

  async function loadProfile() {
    try {
      const res = await API.get('/auth/me');
      const user = res.data;

      // Populate Inputs
      nameInput.value = user.name || '';
      emailInput.value = user.email || '';
      phoneInput.value = user.phone || '';
      genderSelect.value = user.gender || '';
      
      if (user.dateOfBirth) {
        // Formats ISO timestamp to YYYY-MM-DD
        dobInput.value = new Date(user.dateOfBirth).toISOString().slice(0, 10);
      }

      // Populate Summary Card
      cardName.textContent = user.name || 'User';
      cardEmail.textContent = user.email || 'user@scpk.com';
      cardRole.textContent = user.role === 'ADMIN' ? 'Administrator' : 'Pengguna';
      
      const btnDeleteAvatar = document.getElementById('btn-delete-avatar');
      if (user.avatar) {
        cardAvatar.innerHTML = '<img src="' + user.avatar + '" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
        cardAvatar.style.background = 'none';
        if (btnDeleteAvatar) btnDeleteAvatar.style.display = 'block';
      } else {
        cardAvatar.textContent = (user.name || 'U').charAt(0).toUpperCase();
        cardAvatar.style.background = 'var(--gradient-button)';
        if (btnDeleteAvatar) btnDeleteAvatar.style.display = 'none';
      }

      cardJoined.textContent = new Date(user.createdAt).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Update sidebar
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

    } catch (err) {
      console.error(err);
      Toast.error('Gagal memuat profil pengguna.');
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear Errors
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');

    let isValid = true;
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const gender = genderSelect.value;
    const dob = dobInput.value;

    if (!name || name.length < 2) {
      document.getElementById('name-error').textContent = 'Nama lengkap minimal 2 karakter';
      isValid = false;
    }

    if (phone && !/^\+?[0-9]{10,15}$/.test(phone)) {
      document.getElementById('phone-error').textContent = 'Format nomor telepon tidak valid (10-15 angka)';
      isValid = false;
    }

    if (!isValid) return;

    const btn = document.getElementById('btn-save-profile');
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Menyimpan...';

    try {
      const payload = { name };
      if (phone) payload.phone = phone;
      if (gender) payload.gender = gender;
      if (dob) payload.dateOfBirth = dob;

      const res = await API.put('/auth/profile', payload);
      const updatedUser = res.data;

      // Update localStorage cached user object
      const localUser = Auth.getUser();
      if (localUser) {
        localUser.name = updatedUser.name;
        localUser.avatar = updatedUser.avatar;
        API.setUser(localUser);
      }

      Toast.success('Profil berhasil diperbarui!');
      loadProfile();

    } catch (err) {
      console.error(err);
      const msg = err.errors ? err.errors.map(e => e.msg).join('. ') : err.message || 'Gagal menyimpan profil.';
      Toast.error(msg);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });

  // Avatar Upload Logic
  const avatarUploadInput = document.getElementById('avatar-upload');
  if (avatarUploadInput) {
    avatarUploadInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        Toast.error('Ukuran file maksimal adalah 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        Toast.error('Format file harus berupa gambar');
        return;
      }

      const formData = new FormData();
      formData.append('avatar', file);

      // Temporary loading state
      const originalContent = cardAvatar.innerHTML;
      cardAvatar.innerHTML = '<span class="spinner" style="border-color:white; border-bottom-color:transparent; width:24px; height:24px; border-width:3px;"></span>';

      try {
        const token = API.getToken();
        const res = await fetch('/api/auth/profile-picture', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await res.json();
        
        if (res.ok) {
          Toast.success('Foto profil berhasil diunggah');
          
          // Update cached user
          const localUser = Auth.getUser();
          if (localUser && data.user) {
            localUser.avatar = data.user.avatar;
            API.setUser(localUser);
          }
          
          loadProfile();
        } else {
          throw new Error(data.message || 'Gagal mengunggah foto profil');
        }
      } catch (err) {
        console.error(err);
        Toast.error(err.message || 'Terjadi kesalahan saat mengunggah foto');
        cardAvatar.innerHTML = originalContent;
      } finally {
        avatarUploadInput.value = ''; // Reset input
      }
    });
  }

  // Avatar Delete Logic
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('#btn-delete-avatar');
    if (!btn) return;

    if (!confirm('Apakah Anda yakin ingin menghapus foto profil ini?')) return;

    const originalContent = cardAvatar.innerHTML;
    cardAvatar.innerHTML = '<span class="spinner" style="border-color:white; border-bottom-color:transparent; width:24px; height:24px; border-width:3px;"></span>';

    try {
      const token = API.getToken();
      const res = await fetch('/api/auth/profile-picture', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      
      if (res.ok) {
        Toast.success('Foto profil berhasil dihapus');
        
        // Update cached user
        const localUser = Auth.getUser();
        if (localUser && data.user) {
          localUser.avatar = data.user.avatar; // null
          API.setUser(localUser);
        }
        
        loadProfile();
      } else {
        throw new Error(data.message || 'Gagal menghapus foto profil');
      }
    } catch (err) {
      console.error(err);
      Toast.error(err.message || 'Terjadi kesalahan saat menghapus foto');
      cardAvatar.innerHTML = originalContent;
    }
  });

  loadProfile();
})();

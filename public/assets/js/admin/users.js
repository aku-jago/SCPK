/**
 * Admin User Management — Logic
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

  // User Info
  const user = Auth.getUser();
  if (user) {
    document.getElementById('user-name').textContent = user.name || 'Admin';
    document.getElementById('user-avatar').textContent = (user.name || 'A').charAt(0).toUpperCase();
  }

  // State
  let currentPage = 1;
  const limit = 10;
  let currentSearch = '';
  let cachedUsers = [];

  const loadingContainer = document.getElementById('users-loading-container');
  const emptyContainer = document.getElementById('users-empty-container');
  const contentContainer = document.getElementById('users-content-container');
  const tableBody = document.getElementById('users-table-body');

  const searchInput = document.getElementById('search-input');
  const btnSearch = document.getElementById('btn-search');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const paginationInfo = document.getElementById('pagination-info');

  async function loadUsers(page = 1, search = '') {
    loadingContainer.style.display = 'block';
    loadingContainer.innerHTML = Skeleton.table(6, 6);
    emptyContainer.style.display = 'none';
    contentContainer.style.display = 'none';

    try {
      const res = await API.get(`/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
      const users = res.data.users || [];
      const pagination = res.data.pagination || { total: 0, page: 1, totalPages: 1 };

      loadingContainer.style.display = 'none';
      cachedUsers = users;

      if (users.length === 0) {
        emptyContainer.style.display = 'block';
        return;
      }

      tableBody.innerHTML = users.map(u => {
        const isSelf = u.id === user.id;
        const statusBadge = u.isActive
          ? `<span class="badge badge-success" style="cursor:pointer;" onclick="toggleUserStatus('${u.id}', ${u.isActive})">Aktif</span>`
          : `<span class="badge badge-danger" style="cursor:pointer;" onclick="toggleUserStatus('${u.id}', ${u.isActive})">Nonaktif</span>`;

        const roleBadge = u.role === 'ADMIN'
          ? `<span class="badge badge-pink">Admin</span>`
          : `<span class="badge badge-info">User</span>`;

        return `
          <tr>
            <td>
              <div style="font-weight:600;color:var(--gray-800);">${u.name || 'User'}</div>
              <div style="font-size:11px;color:var(--gray-400);">ID: ${u.id.slice(0, 8)}...</div>
            </td>
            <td><span style="font-size:var(--text-sm);color:var(--gray-600);">${u.email}</span></td>
            <td><span style="font-size:var(--text-sm);color:var(--gray-600);">${u.phone || '-'}</span></td>
            <td>${roleBadge}</td>
            <td>${statusBadge}</td>
            <td style="text-align:right;">
              <div class="actions-cell">
                <button class="btn btn-secondary btn-sm" onclick="showEditUserModal('${u.id}')">
                  Edit
                </button>
                <button class="btn btn-ghost btn-sm" style="color:var(--danger);" ${isSelf ? 'disabled' : ''} onclick="deleteUser('${u.id}', '${u.name}')">
                  Hapus
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Setup pagination
      currentPage = pagination.page;
      const total = pagination.total;
      const startItem = (currentPage - 1) * limit + 1;
      const endItem = Math.min(currentPage * limit, total);

      paginationInfo.textContent = `Menampilkan ${startItem} - ${endItem} dari ${total} hasil`;

      btnPrev.disabled = currentPage <= 1;
      btnNext.disabled = currentPage >= pagination.totalPages;

      contentContainer.style.display = 'block';
      lucide.createIcons();

    } catch (err) {
      console.error(err);
      loadingContainer.style.display = 'none';
      Toast.error('Gagal memuat daftar pengguna.');
    }
  }

  // Toggle Status API
  window.toggleUserStatus = async function (id, currentStatus) {
    if (id === user.id) {
      Toast.warning('Anda tidak dapat menonaktifkan akun sendiri.');
      return;
    }

    try {
      await API.put(`/admin/users/${id}`, { isActive: !currentStatus });
      Toast.success('Status pengguna berhasil diubah!');
      loadUsers(currentPage, currentSearch);
    } catch (err) {
      console.error(err);
      Toast.error('Gagal mengubah status pengguna.');
    }
  };

  // Delete User API
  window.deleteUser = async function (id, name) {
    if (id === user.id) {
      Toast.warning('Anda tidak dapat menghapus akun sendiri.');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus pengguna "${name}" secara permanen? Seluruh riwayat screening juga akan terhapus.`)) {
      return;
    }

    try {
      await API.delete(`/admin/users/${id}`);
      Toast.success('Pengguna berhasil dihapus!');
      loadUsers(currentPage, currentSearch);
    } catch (err) {
      console.error(err);
      Toast.error('Gagal menghapus pengguna.');
    }
  };

  // Show Edit User Dialog Modal
  window.showEditUserModal = function (id) {
    const u = cachedUsers.find(item => item.id === id);
    if (!u) return;

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = `edit-user-modal-${id}`;
    modal.innerHTML = `
      <div class="modal-dialog" style="max-width:440px;width:100%;margin: var(--space-20) auto;animation: modal-fade-in 0.3s ease-out;">
        <div class="modal-content glass-card" style="padding:var(--space-6);position:relative;">
          <button class="btn btn-icon btn-ghost" style="position:absolute;top:var(--space-4);right:var(--space-4);" onclick="closeEditUserModal('${id}')">
            <i data-lucide="x" style="width:20px;height:20px;"></i>
          </button>
          
          <h2 class="admin-modal-title">Edit Akses Pengguna</h2>
          
          <form id="edit-user-form-${id}">
            <div class="form-group">
              <label class="form-label" for="edit-name-${id}">Nama Lengkap</label>
              <input type="text" id="edit-name-${id}" class="form-input" value="${u.name || ''}" required minlength="2">
            </div>
            
            <div class="form-group">
              <label class="form-label" for="edit-role-${id}">Peran Akses (Role)</label>
              <select id="edit-role-${id}" class="form-input">
                <option value="USER" ${u.role === 'USER' ? 'selected' : ''}>User / Pengguna Umum</option>
                <option value="ADMIN" ${u.role === 'ADMIN' ? 'selected' : ''}>Administrator</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="edit-active-${id}">Status Akun</label>
              <select id="edit-active-${id}" class="form-input">
                <option value="true" ${u.isActive ? 'selected' : ''}>Aktif</option>
                <option value="false" ${!u.isActive ? 'selected' : ''}>Nonaktif / Banned</option>
              </select>
            </div>

            <div style="display:flex;justify-content:flex-end;gap:var(--space-2);margin-top:var(--space-6);">
              <button type="button" class="btn btn-secondary btn-sm" onclick="closeEditUserModal('${id}')">Batal</button>
              <button type="submit" class="btn btn-primary btn-sm" id="btn-save-user-${id}">Simpan</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
    lucide.createIcons();

    const editForm = document.getElementById(`edit-user-form-${id}`);
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById(`btn-save-user-${id}`);
      saveBtn.disabled = true;

      try {
        const payload = {
          name: document.getElementById(`edit-name-${id}`).value.trim(),
          role: document.getElementById(`edit-role-${id}`).value,
          isActive: document.getElementById(`edit-active-${id}`).value === 'true'
        };

        await API.put(`/admin/users/${id}`, payload);
        Toast.success('Akses pengguna berhasil diperbarui!');
        closeEditUserModal(id);
        loadUsers(currentPage, currentSearch);
      } catch (err) {
        console.error(err);
        Toast.error('Gagal memperbarui pengguna.');
        saveBtn.disabled = false;
      }
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeEditUserModal(id);
    });
  };

  window.closeEditUserModal = function (id) {
    const modal = document.getElementById(`edit-user-modal-${id}`);
    if (modal) {
      modal.classList.remove('active');
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 300);
    }
  };

  // Event Triggers
  btnSearch.addEventListener('click', () => {
    currentSearch = searchInput.value.trim();
    loadUsers(1, currentSearch);
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      currentSearch = searchInput.value.trim();
      loadUsers(1, currentSearch);
    }
  });

  btnPrev.addEventListener('click', () => {
    if (currentPage > 1) loadUsers(currentPage - 1, currentSearch);
  });

  btnNext.addEventListener('click', () => {
    loadUsers(currentPage + 1, currentSearch);
  });

  // Initial load
  loadUsers(1, '');
})();

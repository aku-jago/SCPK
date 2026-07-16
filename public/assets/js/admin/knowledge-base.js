/**
 * Admin Knowledge Base — CRUD Operations JS logic
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
    const avatarEl2 = document.getElementById('user-avatar');
    if (avatarEl2) {
      if (user.avatar) {
        avatarEl2.innerHTML = '<img src="' + user.avatar + '" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
        avatarEl2.style.background = 'none';
      } else {
        avatarEl2.textContent = (user.name || 'A').charAt(0).toUpperCase();
      }
    }
  }

  // State
  let cachedArticles = [];

  const loadingContainer = document.getElementById('articles-loading-container');
  const emptyContainer = document.getElementById('articles-empty-container');
  const contentContainer = document.getElementById('articles-content-container');
  const tableBody = document.getElementById('articles-table-body');

  async function loadArticles() {
    loadingContainer.style.display = 'block';
    loadingContainer.innerHTML = Skeleton.table(5, 6);
    emptyContainer.style.display = 'none';
    contentContainer.style.display = 'none';

    try {
      const res = await API.get('/knowledge-base');
      const articles = res.data || [];
      cachedArticles = articles;

      loadingContainer.style.display = 'none';

      if (articles.length === 0) {
        emptyContainer.style.display = 'block';
        return;
      }

      tableBody.innerHTML = articles.map(art => {
        const date = new Date(art.updatedAt).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });

        const statusBadge = art.isPublished
          ? `<span class="badge badge-success">Published</span>`
          : `<span class="badge badge-warning">Draft</span>`;

        return `
          <tr>
            <td>
              <div style="font-weight:600;color:var(--gray-800);">${art.title}</div>
              <div style="font-size:11px;color:var(--gray-400);max-width:320px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${art.summary}</div>
            </td>
            <td><span class="badge badge-info" style="font-size:10px;">${art.category.replace('_', ' ')}</span></td>
            <td>${statusBadge}</td>
            <td><span style="font-weight:700;color:var(--gray-600);">${art.viewCount || 0}</span></td>
            <td><span style="font-size:var(--text-xs);color:var(--gray-500);">${date}</span></td>
            <td style="text-align:right;">
              <div class="actions-cell">
                <button class="btn btn-secondary btn-sm" onclick="showArticleEditModal('${art.id}')">
                  Edit
                </button>
                <button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="deleteArticle('${art.id}', '${art.title}')">
                  Hapus
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      contentContainer.style.display = 'block';
      lucide.createIcons();

    } catch (err) {
      console.error(err);
      loadingContainer.style.display = 'none';
      Toast.error('Gagal memuat artikel.');
    }
  }

  // Delete Article API
  window.deleteArticle = async function (id, title) {
    if (!confirm(`Apakah Anda yakin ingin menghapus artikel "${title}"?`)) return;

    try {
      await API.delete(`/knowledge-base/${id}`);
      Toast.success('Artikel berhasil dihapus!');
      loadArticles();
    } catch (err) {
      console.error(err);
      Toast.error('Gagal menghapus artikel.');
    }
  };

  // Show Article Edit/Create Modal
  window.showArticleEditModal = function (id = null) {
    const isEdit = !!id;
    const art = isEdit ? cachedArticles.find(item => item.id === id) : {
      title: '',
      summary: '',
      content: '',
      category: 'LUNG_CANCER',
      tags: [],
      isPublished: true
    };

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = `edit-article-modal`;
    modal.innerHTML = `
      <div class="modal-dialog" style="max-width:720px;width:100%;margin: var(--space-6) auto;animation: modal-fade-in 0.3s ease-out;">
        <div class="modal-content glass-card" style="padding:var(--space-6);max-height:90vh;overflow-y:auto;position:relative;">
          <button class="btn btn-icon btn-ghost" style="position:absolute;top:var(--space-4);right:var(--space-4);" onclick="closeArticleModal()">
            <i data-lucide="x" style="width:20px;height:20px;"></i>
          </button>
          
          <h2 class="admin-modal-title">${isEdit ? 'Edit Artikel' : 'Tulis Artikel Baru'}</h2>
          
          <form id="edit-article-form">
            <div class="form-group">
              <label class="form-label" for="art-title">Judul Artikel *</label>
              <input type="text" id="art-title" class="form-input" value="${art.title}" required placeholder="Masukkan judul menarik...">
            </div>

            <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:var(--space-4);">
              <div class="form-group">
                <label class="form-label" for="art-category">Kategori *</label>
                <select id="art-category" class="form-input">
                  <option value="LUNG_CANCER" ${art.category === 'LUNG_CANCER' ? 'selected' : ''}>Kanker Paru-Paru (Umum)</option>
                  <option value="SMOKING_RISKS" ${art.category === 'SMOKING_RISKS' ? 'selected' : ''}>Risiko Rokok</option>
                  <option value="EARLY_DETECTION" ${art.category === 'EARLY_DETECTION' ? 'selected' : ''}>Deteksi Dini</option>
                  <option value="PREVENTION" ${art.category === 'PREVENTION' ? 'selected' : ''}>Pencegahan & Tips</option>
                  <option value="RECOMMENDATION" ${art.category === 'RECOMMENDATION' ? 'selected' : ''}>Rekomendasi Medis</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="art-tags">Tags (koma-separated)</label>
                <input type="text" id="art-tags" class="form-input" value="${(art.tags || []).join(', ')}" placeholder="kanker, paru, rokok">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="art-summary">Ringkasan Deskripsi (Summary) *</label>
              <textarea id="art-summary" class="form-input" required rows="2" style="resize:vertical;" placeholder="Deskripsi ringkas yang muncul di kartu pratinjau...">${art.summary}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label" for="art-content">Konten Lengkap (Markdown Supported) *</label>
              <textarea id="art-content" class="form-input" required rows="10" style="resize:vertical;font-family:monospace;font-size:var(--text-xs);" placeholder="# Judul Bab\nTulis isi konten menggunakan format markdown...">${art.content}</textarea>
            </div>

            <div class="form-group" style="display:flex;align-items:center;gap:var(--space-2);margin-top:var(--space-4);">
              <input type="checkbox" id="art-published" style="accent-color:var(--admin-blue-500);width:16px;height:16px;" ${art.isPublished ? 'checked' : ''}>
              <label for="art-published" style="font-size:var(--text-sm);font-weight:600;color:var(--gray-800);cursor:pointer;user-select:none;">Publish artikel agar dapat dibaca publik</label>
            </div>

            <div style="display:flex;justify-content:flex-end;gap:var(--space-2);margin-top:var(--space-6);">
              <button type="button" class="btn btn-secondary btn-sm" onclick="closeArticleModal()">Batal</button>
              <button type="submit" class="btn btn-primary btn-sm" id="btn-save-article">Simpan Artikel</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
    lucide.createIcons();

    const form = document.getElementById('edit-article-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('btn-save-article');
      saveBtn.disabled = true;

      const tags = document.getElementById('art-tags').value
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const payload = {
        title: document.getElementById('art-title').value.trim(),
        category: document.getElementById('art-category').value,
        tags: tags,
        summary: document.getElementById('art-summary').value.trim(),
        content: document.getElementById('art-content').value.trim(),
        isPublished: document.getElementById('art-published').checked
      };

      try {
        if (isEdit) {
          await API.put(`/knowledge-base/${id}`, payload);
          Toast.success('Artikel berhasil diperbarui!');
        } else {
          await API.post('/knowledge-base', payload);
          Toast.success('Artikel baru berhasil dibuat!');
        }
        closeArticleModal();
        loadArticles();
      } catch (err) {
        console.error(err);
        Toast.error('Gagal menyimpan artikel.');
        saveBtn.disabled = false;
      }
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeArticleModal();
    });
  };

  window.closeArticleModal = function () {
    const modal = document.getElementById('edit-article-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 300);
    }
  };

  // Initial Load
  loadArticles();
})();

/**
 * Health Recommendations — Dynamic advice and articles client
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

  // Containers
  const personalLoading = document.getElementById('personal-loading-container');
  const personalEmpty = document.getElementById('personal-empty-container');
  const personalList = document.getElementById('personal-recs-list');
  const latestDateEl = document.getElementById('rec-latest-date');

  const articlesLoading = document.getElementById('articles-loading-container');
  const articlesList = document.getElementById('articles-list');

  // Load Custom AI Recommendations (from latest screening)
  async function loadPersonalRecommendations() {
    personalLoading.style.display = 'block';
    personalLoading.innerHTML = Skeleton.text('80%') + Skeleton.text('90%') + Skeleton.text('60%');
    personalEmpty.style.display = 'none';
    personalList.style.display = 'none';

    try {
      const res = await API.get('/screening/history?limit=1');
      const screenings = res.data.screenings || [];

      personalLoading.style.display = 'none';

      if (screenings.length === 0) {
        personalEmpty.style.display = 'block';
        return;
      }

      const latest = screenings[0];
      const recs = latest.recommendations || [];

      latestDateEl.textContent = `Berdasarkan screening tanggal: ${new Date(latest.createdAt).toLocaleDateString('id-ID')}`;

      if (recs.length === 0) {
        personalEmpty.style.display = 'block';
        return;
      }

      personalList.innerHTML = recs.map(rec => {
        let icon = 'shield-check';
        let iconColor = 'var(--success)';
        let bgColor = 'var(--success-light)';

        if (rec.title.toLowerCase().includes('dokter') || rec.title.toLowerCase().includes('medis')) {
          icon = 'heart-pulse';
          iconColor = 'var(--brand-500)';
          bgColor = 'var(--brand-50)';
        } else if (rec.title.toLowerCase().includes('rokok') || rec.title.toLowerCase().includes('berhenti')) {
          icon = 'ban';
          iconColor = 'var(--purple-500)';
          bgColor = 'var(--purple-50)';
        }

        return `
          <div class="rec-card">
            <div class="rec-card-header">
              <div class="rec-card-title">${rec.title}</div>
              <div style="width:36px;height:36px;border-radius:var(--radius-lg);background:${bgColor};color:${iconColor};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <i data-lucide="${icon}" style="width:18px;height:18px;"></i>
              </div>
            </div>
            <div class="rec-card-body">${rec.description}</div>
          </div>
        `;
      }).join('');

      personalList.style.display = 'grid';
      lucide.createIcons();

    } catch (err) {
      console.error(err);
      personalLoading.style.display = 'none';
      Toast.error('Gagal memuat rekomendasi personal.');
    }
  }

  // Load General Educational Articles
  async function loadGeneralArticles() {
    articlesLoading.style.display = 'block';
    articlesLoading.innerHTML = Skeleton.text('95%') + Skeleton.text('80%') + Skeleton.text('85%');
    articlesList.innerHTML = '';

    try {
      const res = await API.get('/knowledge-base?published=true');
      const articles = res.data || [];

      articlesLoading.style.display = 'none';

      if (articles.length === 0) {
        articlesList.innerHTML = `
          <div style="text-align:center;color:var(--gray-400);padding:var(--space-6);">
            Tidak ada artikel edukasi tersedia saat ini.
          </div>
        `;
        return;
      }

      articlesList.innerHTML = articles.map(art => `
        <div class="glass-card" style="padding:var(--space-4);cursor:pointer;transition:transform 0.2s;" onclick="showArticleModal('${art.id}')">
          <div style="font-weight:700;color:var(--gray-800);font-size:var(--text-sm);margin-bottom:var(--space-1);">${art.title}</div>
          <div style="color:var(--gray-500);font-size:var(--text-xs);line-height:1.4;">${art.summary}</div>
          <div style="display:flex;gap:var(--space-2);margin-top:var(--space-3);flex-wrap:wrap;">
            <span class="badge badge-info" style="font-size:10px;padding:2px 6px;">${art.category.replace('_', ' ')}</span>
          </div>
        </div>
      `).join('');

    } catch (err) {
      console.error(err);
      articlesLoading.style.display = 'none';
      articlesList.innerHTML = `<div style="color:var(--danger);text-align:center;">Gagal memuat artikel edukasi.</div>`;
    }
  }

  // Show Article Content in a Dynamic Modal
  window.showArticleModal = async function (id) {
    try {
      const res = await API.get(`/knowledge-base/${id}`);
      const article = res.data;

      // Simple Markdown-to-HTML parser for safety
      const htmlContent = parseSimpleMarkdown(article.content);

      // Create modal container
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.id = `article-modal-${id}`;
      modal.innerHTML = `
        <div class="modal-dialog" style="max-width:680px;width:100%;margin: var(--space-12) auto;animation: modal-fade-in 0.3s ease-out;">
          <div class="modal-content glass-card" style="padding:var(--space-6);max-height:80vh;overflow-y:auto;position:relative;">
            <button class="btn btn-icon btn-ghost" style="position:absolute;top:var(--space-4);right:var(--space-4);" onclick="closeArticleModal('${id}')">
              <i data-lucide="x" style="width:20px;height:20px;"></i>
            </button>
            <div style="display:flex;gap:var(--space-2);margin-bottom:var(--space-2);">
              <span class="badge badge-info" style="font-size:11px;">${article.category.replace('_', ' ')}</span>
            </div>
            <h2 style="font-family:var(--font-display);font-size:var(--text-2xl);font-weight:800;color:var(--gray-900);margin-bottom:var(--space-4);line-height:1.2;">
              ${article.title}
            </h2>
            <div class="markdown-body" style="font-size:var(--text-sm);color:var(--gray-700);line-height:1.6;">
              ${htmlContent}
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      setTimeout(() => modal.classList.add('active'), 10);
      lucide.createIcons();

      // Close modal on outside click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeArticleModal(id);
      });

    } catch (err) {
      console.error(err);
      Toast.error('Gagal menampilkan artikel.');
    }
  };

  window.closeArticleModal = function (id) {
    const modal = document.getElementById(`article-modal-${id}`);
    if (modal) {
      modal.classList.remove('active');
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 300);
    }
  };

  // Helper to parse simple markdown to HTML tags
  function parseSimpleMarkdown(markdown) {
    if (!markdown) return '';
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h4 style="font-size:var(--text-md);font-weight:700;margin-top:var(--space-4);margin-bottom:var(--space-2);color:var(--gray-800);">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 style="font-size:var(--text-lg);font-weight:700;margin-top:var(--space-5);margin-bottom:var(--space-3);color:var(--gray-800);">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 style="font-size:var(--text-xl);font-weight:800;margin-top:var(--space-6);margin-bottom:var(--space-4);color:var(--gray-900);">$1</h2>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:700;color:var(--gray-800);">$1</strong>');

    // Lists
    html = html.replace(/^\s*-\s*(.*$)/gim, '<li style="margin-left:var(--space-4);list-style-type:disc;margin-bottom:var(--space-1);">$1</li>');

    // Convert linebreaks to paragraphs
    html = html.replace(/\n\n/g, '</p><p style="margin-bottom:var(--space-4);">');
    html = '<p style="margin-bottom:var(--space-4);">' + html + '</p>';

    // Fix empty lists wrapping
    return html;
  }

  // Initial Load
  loadPersonalRecommendations();
  loadGeneralArticles();
})();

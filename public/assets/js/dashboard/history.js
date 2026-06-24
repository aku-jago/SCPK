/**
 * Screening History — User History Page Logic
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
    document.getElementById('user-avatar').textContent = (user.name || 'U').charAt(0).toUpperCase();
  }

  // State
  let currentPage = 1;
  const limit = 10;

  const loadingContainer = document.getElementById('history-loading-container');
  const emptyContainer = document.getElementById('history-empty-container');
  const contentContainer = document.getElementById('history-content-container');
  const tableBody = document.getElementById('history-table-body');

  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const paginationInfo = document.getElementById('pagination-info');

  async function loadHistory(page = 1) {
    // Show skeleton
    loadingContainer.style.display = 'block';
    loadingContainer.innerHTML = Skeleton.table(6, 4);
    emptyContainer.style.display = 'none';
    contentContainer.style.display = 'none';

    try {
      const res = await API.get(`/screening/history?page=${page}&limit=${limit}`);
      const screenings = res.data.screenings || [];
      const pagination = res.data.pagination || { total: 0, page: 1, totalPages: 1 };

      loadingContainer.style.display = 'none';

      if (screenings.length === 0) {
        emptyContainer.style.display = 'block';
        return;
      }

      // Populate Table
      tableBody.innerHTML = screenings.map(s => {
        const date = new Date(s.createdAt).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const badgeColor = s.riskColor || '#6b7280';
        const badgeBg = getRGBA(badgeColor, 0.12);

        return `
          <tr style="cursor:pointer;" onclick="window.location.href='/dashboard/result.html?id=${s.id}'">
            <td>
              <div style="display:flex;flex-direction:column;">
                <span style="font-weight:600;color:var(--gray-800);">${date}</span>
                <span style="font-size:var(--text-xs);color:var(--gray-400);">ID: ${s.id.slice(0, 8)}...</span>
              </div>
            </td>
            <td>
              <span style="font-family:var(--font-display);font-weight:800;color:var(--gray-800);font-size:var(--text-md);">${s.riskScore}</span>
            </td>
            <td>
              <span class="badge" style="background-color:${badgeBg};color:${badgeColor};border:1px solid ${badgeColor};font-weight:700;">
                ${s.riskLabel || s.riskCategory}
              </span>
            </td>
            <td style="text-align:right;">
              <a href="/dashboard/result.html?id=${s.id}" class="btn btn-secondary btn-sm" onclick="event.stopPropagation();">
                Lihat Detail
              </a>
            </td>
          </tr>
        `;
      }).join('');

      // Setup pagination state
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
      Toast.error(err.message || 'Gagal memuat riwayat screening.');
    }
  }

  function getRGBA(hex, alpha) {
    if (!hex.startsWith('#')) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // Event Listeners
  btnPrev.addEventListener('click', () => {
    if (currentPage > 1) {
      loadHistory(currentPage - 1);
    }
  });

  btnNext.addEventListener('click', () => {
    loadHistory(currentPage + 1);
  });

  loadHistory(1);
})();

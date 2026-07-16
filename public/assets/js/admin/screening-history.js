/**
 * Admin — Screening History Page Logic
 * Manages fetching, filtering, pagination, and detail view for all screening records
 */
(function () {
  'use strict';

  // Protect Admin Route
  if (!Auth.requireAdmin()) return;

  // ========== Sidebar Setup ==========
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

  // Load User Info
  const user = Auth.getUser();
  if (user) {
    const nameEl = document.getElementById('user-name');
    const avatarEl = document.getElementById('user-avatar');
    if (nameEl) nameEl.textContent = user.name || 'Admin';
    if (avatarEl) {
      if (user.avatar) {
        avatarEl.innerHTML = '<img src="' + user.avatar + '" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
        avatarEl.style.background = 'none';
      } else {
        avatarEl.textContent = (user.name || 'A').charAt(0).toUpperCase();
      }
    }
  }

  // ========== State ==========
  let currentPage = 1;
  const limit = 15;

  // DOM Refs
  const searchInput = document.getElementById('search-input');
  const filterRisk = document.getElementById('filter-risk');
  const filterDateFrom = document.getElementById('filter-date-from');
  const filterDateTo = document.getElementById('filter-date-to');
  const btnSearch = document.getElementById('btn-search');
  const btnReset = document.getElementById('btn-reset');
  const btnExport = document.getElementById('btn-export');

  const loadingContainer = document.getElementById('screenings-loading-container');
  const emptyContainer = document.getElementById('screenings-empty-container');
  const contentContainer = document.getElementById('screenings-content-container');
  const tableBody = document.getElementById('screenings-table-body');
  const paginationInfo = document.getElementById('pagination-info');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  // Risk Config
  const riskConfig = {
    RENDAH: { label: 'Rendah', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    SEDANG: { label: 'Sedang', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    TINGGI: { label: 'Tinggi', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    SANGAT_TINGGI: { label: 'Sangat Tinggi', color: '#991b1b', bg: 'rgba(153,27,27,0.12)' },
  };

  // ========== Initial Load ==========
  loadingContainer.innerHTML = Skeleton.table(8, 7);
  loadScreenings();

  // ========== Event Listeners ==========
  btnSearch.addEventListener('click', () => {
    currentPage = 1;
    loadScreenings();
  });

  btnReset.addEventListener('click', () => {
    searchInput.value = '';
    filterRisk.value = '';
    filterDateFrom.value = '';
    filterDateTo.value = '';
    currentPage = 1;
    loadScreenings();
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      currentPage = 1;
      loadScreenings();
    }
  });

  btnPrev.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadScreenings();
    }
  });

  btnNext.addEventListener('click', () => {
    currentPage++;
    loadScreenings();
  });

  btnExport?.addEventListener('click', exportCSV);

  // ========== Fetch Screenings ==========
  async function loadScreenings() {
    loadingContainer.style.display = 'block';
    emptyContainer.style.display = 'none';
    contentContainer.style.display = 'none';

    try {
      const params = new URLSearchParams();
      params.set('page', currentPage);
      params.set('limit', limit);

      const search = searchInput.value.trim();
      if (search) params.set('search', search);

      const risk = filterRisk.value;
      if (risk) params.set('riskCategory', risk);

      const dateFrom = filterDateFrom.value;
      if (dateFrom) params.set('dateFrom', dateFrom);

      const dateTo = filterDateTo.value;
      if (dateTo) params.set('dateTo', dateTo);

      const res = await API.get(`/admin/screenings?${params.toString()}`);
      const { screenings, pagination } = res.data;

      loadingContainer.style.display = 'none';

      if (!screenings || screenings.length === 0) {
        emptyContainer.style.display = 'flex';
        updateSummaryStats(0, {});
        return;
      }

      // Count categories for summary stats
      const catCounts = {};
      screenings.forEach(s => {
        catCounts[s.riskCategory] = (catCounts[s.riskCategory] || 0) + 1;
      });
      updateSummaryStats(pagination.total, catCounts);

      // Render table
      tableBody.innerHTML = screenings.map(s => {
        const date = new Date(s.createdAt).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const cfg = riskConfig[s.riskCategory] || { label: s.riskCategory, color: '#6b7280', bg: 'rgba(107,114,128,0.12)' };
        const userName = s.user?.name || 'N/A';
        const userEmail = s.user?.email || 'N/A';
        const bmi = s.bmi ? s.bmi.toFixed(1) : '-';

        return `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:var(--space-3);">
                <div style="width:32px;height:32px;border-radius:50%;background:var(--gray-100);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:var(--text-sm);color:var(--gray-600);flex-shrink:0;">${userName.charAt(0).toUpperCase()}</div>
                <span style="font-weight:600;color:var(--gray-800);">${escapeHtml(userName)}</span>
              </div>
            </td>
            <td style="color:var(--gray-500);font-size:var(--text-sm);">${escapeHtml(userEmail)}</td>
            <td>
              <div style="display:flex;flex-direction:column;">
                <span style="font-weight:500;color:var(--gray-800);">${date}</span>
              </div>
            </td>
            <td>
              <span style="font-family:var(--font-display);font-weight:800;color:var(--gray-800);font-size:var(--text-md);">${s.riskScore}</span>
            </td>
            <td>
              <span class="badge" style="background-color:${cfg.bg};color:${cfg.color};border:1px solid ${cfg.color};font-weight:700;">${cfg.label}</span>
            </td>
            <td style="font-weight:600;color:var(--gray-600);">${bmi}</td>
            <td style="text-align:right;">
              <div style="display:flex;justify-content:flex-end;gap:var(--space-2);">
                <button class="btn btn-secondary btn-sm" onclick="showScreeningDetail('${s.id}')" style="font-size:12px;">
                  <i data-lucide="eye" style="width:14px;height:14px;"></i> Detail
                </button>
                <button class="btn btn-secondary btn-sm" onclick="deleteScreening('${s.id}')" style="font-size:12px;color:var(--danger);border-color:var(--danger-light);">
                  <i data-lucide="trash-2" style="width:14px;height:14px;"></i> Hapus
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Pagination
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
      Toast.error(err.message || 'Gagal memuat data riwayat pemeriksaan.');
    }
  }

  // ========== Summary Stats ==========
  function updateSummaryStats(total, catCounts) {
    const elTotal = document.getElementById('stat-total');
    const elRendah = document.getElementById('stat-rendah');
    const elSedang = document.getElementById('stat-sedang');
    const elTinggi = document.getElementById('stat-tinggi');

    if (elTotal) elTotal.textContent = total;
    if (elRendah) elRendah.textContent = catCounts.RENDAH || 0;
    if (elSedang) elSedang.textContent = catCounts.SEDANG || 0;
    if (elTinggi) elTinggi.textContent = (catCounts.TINGGI || 0) + (catCounts.SANGAT_TINGGI || 0);
  }

  // ========== Detail Modal ==========
  window.showScreeningDetail = async function (id) {
    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('detail-modal-content');

    modal.style.display = 'block';
    content.innerHTML = '<div style="text-align:center;padding:var(--space-8);"><div class="skeleton skeleton-text" style="width:80%;margin:0 auto var(--space-3);"></div><div class="skeleton skeleton-text" style="width:60%;margin:0 auto;"></div></div>';

    try {
      // Fetch from admin screenings again (we have the data in the table, but let's get fresh data)
      const res = await API.get(`/admin/screenings?limit=1&search=`);
      // We actually need a specific screening detail endpoint. Since we don't have one for admin,
      // let's just use the screening data we have from the list.
      // For now, fetch all screenings and find the one with matching ID
      const allRes = await API.get(`/admin/screenings?limit=100`);
      const screening = allRes.data.screenings.find(s => s.id === id);

      if (!screening) {
        content.innerHTML = '<p style="color:var(--gray-500);text-align:center;">Data tidak ditemukan.</p>';
        return;
      }

      const date = new Date(screening.createdAt).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const cfg = riskConfig[screening.riskCategory] || { label: screening.riskCategory, color: '#6b7280', bg: 'rgba(107,114,128,0.12)' };

      content.innerHTML = `
        <div style="display:grid;gap:var(--space-4);">
          <!-- User Info -->
          <div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-4);background:var(--gray-50);border-radius:var(--radius-lg);">
            <div style="width:40px;height:40px;border-radius:50%;background:var(--gray-200);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:var(--text-md);color:var(--gray-600);">${(screening.user?.name || 'U').charAt(0).toUpperCase()}</div>
            <div>
              <div style="font-weight:700;color:var(--gray-900);">${escapeHtml(screening.user?.name || 'N/A')}</div>
              <div style="font-size:var(--text-xs);color:var(--gray-500);">${escapeHtml(screening.user?.email || 'N/A')}</div>
            </div>
          </div>

          <!-- Risk Result -->
          <div style="text-align:center;padding:var(--space-6);background:${cfg.bg};border-radius:var(--radius-lg);border:1px solid ${cfg.color}20;">
            <div style="font-size:var(--text-xs);color:var(--gray-500);margin-bottom:var(--space-1);">Skor Risiko</div>
            <div style="font-family:var(--font-display);font-size:2.5rem;font-weight:900;color:${cfg.color};line-height:1;">${screening.riskScore}</div>
            <span class="badge" style="background-color:${cfg.bg};color:${cfg.color};border:1px solid ${cfg.color};font-weight:700;margin-top:var(--space-2);display:inline-block;">${cfg.label}</span>
          </div>

          <!-- Details Grid -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);">
            ${detailItem('Tanggal', date)}
            ${detailItem('Usia', screening.age + ' tahun')}
            ${detailItem('BMI', screening.bmi ? screening.bmi.toFixed(1) : '-')}
            ${detailItem('Perokok Aktif', screening.isSmoker ? 'Ya' : 'Tidak')}
            ${detailItem('Batang/Hari', screening.cigarettesPerDay || '0')}
            ${detailItem('Durasi Merokok', (screening.smokingDurationYears || 0) + ' tahun')}
            ${detailItem('Durasi Batuk', (screening.coughDuration || 0) + ' bulan')}
            ${detailItem('Riwayat Keluarga', screening.familyHistory ? 'Ada' : 'Tidak')}
            ${detailItem('Paparan Lingkungan', (screening.environmentalExposure || 0) + '/10')}
            ${detailItem('Skala Nyeri Dada', (screening.chestPainScale || 0) + '/10')}
          </div>

          <!-- ID -->
          <div style="font-size:var(--text-xs);color:var(--gray-400);text-align:center;margin-top:var(--space-2);">
            ID: ${screening.id}
          </div>
        </div>
      `;
    } catch (err) {
      console.error(err);
      content.innerHTML = '<p style="color:var(--danger);text-align:center;">Gagal memuat detail pemeriksaan.</p>';
    }
  };

  function detailItem(label, value) {
    return `
      <div style="padding:var(--space-3);background:var(--gray-50);border-radius:var(--radius-md);">
        <div style="font-size:11px;color:var(--gray-400);margin-bottom:2px;">${label}</div>
        <div style="font-weight:700;color:var(--gray-800);font-size:var(--text-sm);">${value}</div>
      </div>
    `;
  }

  window.closeDetailModal = function () {
    document.getElementById('detail-modal').style.display = 'none';
  };

  // Close modal on backdrop click
  document.getElementById('detail-modal')?.addEventListener('click', function (e) {
    if (e.target === this) closeDetailModal();
  });

  // ========== Delete Screening ==========
  window.deleteScreening = async function (id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data screening ini? Data yang sudah dihapus tidak dapat dikembalikan.')) {
      return;
    }

    try {
      const res = await API.delete(`/admin/screenings/${id}`);
      if (res.success) {
        Toast.success(res.message || 'Data berhasil dihapus');
        // Reload data
        loadScreenings();
      }
    } catch (err) {
      console.error(err);
      Toast.error(err.message || 'Gagal menghapus data.');
    }
  };

  // ========== Export CSV ==========
  async function exportCSV() {
    try {
      Toast.info('Mengunduh data...');
      const params = new URLSearchParams();
      params.set('limit', 10000);

      const search = searchInput.value.trim();
      if (search) params.set('search', search);
      const risk = filterRisk.value;
      if (risk) params.set('riskCategory', risk);
      const dateFrom = filterDateFrom.value;
      if (dateFrom) params.set('dateFrom', dateFrom);
      const dateTo = filterDateTo.value;
      if (dateTo) params.set('dateTo', dateTo);

      const res = await API.get(`/admin/screenings?${params.toString()}`);
      const { screenings } = res.data;

      if (!screenings || screenings.length === 0) {
        Toast.warning('Tidak ada data untuk diexport.');
        return;
      }

      // Build CSV
      const headers = ['Nama', 'Email', 'Tanggal', 'Usia', 'Perokok', 'Batang/Hari', 'BMI', 'Skor Risiko', 'Kategori Risiko'];
      const rows = screenings.map(s => [
        s.user?.name || '',
        s.user?.email || '',
        new Date(s.createdAt).toLocaleDateString('id-ID'),
        s.age,
        s.isSmoker ? 'Ya' : 'Tidak',
        s.cigarettesPerDay,
        s.bmi ? s.bmi.toFixed(1) : '',
        s.riskScore,
        riskConfig[s.riskCategory]?.label || s.riskCategory,
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `riwayat-pemeriksaan-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      Toast.success('Data berhasil diexport!');
    } catch (err) {
      console.error(err);
      Toast.error('Gagal mengexport data.');
    }
  }

  // ========== Utilities ==========
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

})();

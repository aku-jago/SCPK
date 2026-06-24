/**
 * Admin Analytics — Core JS Logic
 */
(function () {
  'use strict';

  // Protect Admin Route
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

  // Cache recent screenings for detail viewing
  let recentScreeningsData = [];

  async function loadAnalytics() {
    try {
      const res = await API.get('/admin/analytics');
      const data = res.data;

      // Populate Overview Stats
      document.getElementById('total-users').textContent = data.overview.totalUsers;
      document.getElementById('total-screenings').textContent = data.overview.totalScreenings;
      document.getElementById('avg-risk-score').textContent = data.overview.avgRiskScore.toFixed(1);
      document.getElementById('max-risk-score').textContent = data.overview.maxRiskScore;

      // Draw Charts
      renderGrowthChart(data.userGrowth || []);
      renderRiskChart(data.riskDistribution || {});

      // Render Recent Screenings
      recentScreeningsData = data.recentScreenings || [];
      renderRecentScreenings(recentScreeningsData);

    } catch (err) {
      console.error(err);
      Toast.error(err.message || 'Gagal memuat analitik admin.');
    }
  }

  function renderGrowthChart(growthData) {
    const ctx = document.getElementById('user-growth-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    // Use current dates if growthData is empty
    let labels = [];
    let values = [];

    if (growthData.length > 0) {
      labels = growthData.map(d => new Date(d.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }));
      values = growthData.map(d => d.count);
    } else {
      // Mock last 7 days of 0s if database query failed / empty
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }));
        values.push(0);
      }
    }

    new Chart(ctx.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'User Baru',
          data: values,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14,165,233,0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointBackgroundColor: '#0ea5e9',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 0, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  function renderRiskChart(dist) {
    const ctx = document.getElementById('risk-distribution-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    const labels = ['Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi'];
    const keys = ['RENDAH', 'SEDANG', 'TINGGI', 'SANGAT_TINGGI'];
    const data = keys.map(k => dist[k] || 0);

    new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: ['#22c55e', '#eab308', '#f97316', '#ef4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
        },
        cutout: '70%'
      }
    });
  }

  function renderRecentScreenings(screenings) {
    const tableBody = document.getElementById('recent-screenings-table');
    if (!tableBody) return;

    if (screenings.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;color:var(--gray-400);padding:var(--space-6);">
            Belum ada aktivitas screening terbaru.
          </td>
        </tr>
      `;
      return;
    }

    const categories = {
      RENDAH: { label: 'Rendah', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
      SEDANG: { label: 'Sedang', color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
      TINGGI: { label: 'Tinggi', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
      SANGAT_TINGGI: { label: 'Sangat Tinggi', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
    };

    tableBody.innerHTML = screenings.map((s, idx) => {
      const date = new Date(s.createdAt).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });

      const cat = categories[s.riskCategory] || { label: s.riskCategory, color: '#6b7280', bg: 'rgba(107,114,128,0.12)' };

      return `
        <tr style="cursor:pointer;" onclick="showScreeningDetailModal('${s.id}')">
          <td>
            <div style="display:flex;flex-direction:column;">
              <span style="font-weight:600;color:var(--gray-800);">${s.user?.name || 'User'}</span>
              <span style="font-size:var(--text-xs);color:var(--gray-400);">${s.user?.email || ''}</span>
            </div>
          </td>
          <td>
            <span style="font-size:var(--text-sm);color:var(--gray-600);">${date}</span>
          </td>
          <td>
            <span style="font-family:var(--font-display);font-weight:800;color:var(--gray-800);">${s.riskScore}</span>
          </td>
          <td>
            <span class="badge" style="background-color:${cat.bg};color:${cat.color};border:1px solid ${cat.color};">
              ${cat.label}
            </span>
          </td>
          <td style="text-align:right;">
            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); showScreeningDetailModal('${s.id}')">
              Review
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Show Admin Review Modal
  window.showScreeningDetailModal = function (id) {
    const s = recentScreeningsData.find(item => item.id === id);
    if (!s) return;

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = `screening-modal-${id}`;
    modal.innerHTML = `
      <div class="modal-dialog" style="max-width:640px;width:100%;margin: var(--space-12) auto;animation: modal-fade-in 0.3s ease-out;">
        <div class="modal-content glass-card" style="padding:var(--space-6);max-height:85vh;overflow-y:auto;position:relative;">
          <button class="btn btn-icon btn-ghost" style="position:absolute;top:var(--space-4);right:var(--space-4);" onclick="closeScreeningModal('${id}')">
            <i data-lucide="x" style="width:20px;height:20px;"></i>
          </button>
          
          <h2 class="admin-modal-title" style="margin-bottom:var(--space-1);">Review Screening</h2>
          <p style="font-size:var(--text-xs);color:var(--gray-400);margin-bottom:var(--space-4);">ID: ${s.id}</p>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);margin-bottom:var(--space-4);">
            <div style="background:var(--gray-50);padding:var(--space-3);border-radius:var(--radius-md);">
              <span style="font-size:var(--text-xs);color:var(--gray-500);">Identitas Pengguna</span>
              <div style="font-weight:700;font-size:var(--text-sm);color:var(--gray-800);margin-top:var(--space-1);">${s.user?.name || 'User'}</div>
              <div style="font-size:var(--text-xs);color:var(--gray-500);">${s.user?.email || ''}</div>
            </div>
            <div style="background:var(--gray-50);padding:var(--space-3);border-radius:var(--radius-md);">
              <span style="font-size:var(--text-xs);color:var(--gray-500);">Kalkulasi Hasil AI</span>
              <div style="font-weight:800;font-size:var(--text-sm);color:#ef4444;margin-top:var(--space-1);">Skor: ${s.riskScore} (${s.riskCategory})</div>
              <div style="font-size:var(--text-xs);color:var(--gray-500);">Defuzzifikasi Tsukamoto</div>
            </div>
          </div>

          <h3 style="font-size:var(--text-sm);font-weight:700;color:var(--gray-800);margin-bottom:var(--space-2);">Input Parameter</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-2);font-size:var(--text-xs);color:var(--gray-700);margin-bottom:var(--space-4);">
            <div style="display:flex;justify-content:space-between;padding:var(--space-2);background:var(--gray-50);border-radius:var(--radius-sm);">
              <span>Usia</span><strong>${s.age} tahun</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:var(--space-2);background:var(--gray-50);border-radius:var(--radius-sm);">
              <span>Rokok/Hari</span><strong>${s.cigarettesPerDay} batang</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:var(--space-2);background:var(--gray-50);border-radius:var(--radius-sm);">
              <span>Durasi Batuk</span><strong>${s.coughDuration} bulan</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:var(--space-2);background:var(--gray-50);border-radius:var(--radius-sm);">
              <span>BMI</span><strong>${s.bmi} (${s.weight}kg / ${s.height}cm)</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:var(--space-2);background:var(--gray-50);border-radius:var(--radius-sm);">
              <span>Riwayat Keluarga</span><strong>${s.familyHistory ? 'Ada' : 'Tidak Ada'}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:var(--space-2);background:var(--gray-50);border-radius:var(--radius-sm);">
              <span>Paparan Polusi</span><strong>${s.environmentalExposure}/10</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:var(--space-2);background:var(--gray-50);border-radius:var(--radius-sm);grid-column: span 2;">
              <span>Skala Nyeri Dada</span><strong>${s.chestPainScale}/10</strong>
            </div>
          </div>

          <h3 style="font-size:var(--text-sm);font-weight:700;color:var(--gray-800);margin-bottom:var(--space-2);">Langkah Inferensi Fuzzy</h3>
          <div style="background:var(--gray-900);color:#22c55e;font-family:monospace;font-size:11px;padding:var(--space-4);border-radius:var(--radius-md);overflow-x:auto;">
            <div># Defuzzification Details:</div>
            <div>- Method: ${s.defuzzificationResult?.method || 'Weighted Average'}</div>
            <div>- Output Value: ${s.defuzzificationResult?.result || s.riskScore}</div>
            <br>
            <div># Fuzzy Rules Activated:</div>
            ${(s.fuzzyRuleResults || []).map(r => `<div>* Rule: ${r.rule} | Firing Strength (&alpha;): ${r.firingStrength.toFixed(3)} | Output z: ${r.output}</div>`).join('')}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
    lucide.createIcons();

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeScreeningModal(id);
    });
  };

  window.closeScreeningModal = function (id) {
    const modal = document.getElementById(`screening-modal-${id}`);
    if (modal) {
      modal.classList.remove('active');
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 300);
    }
  };

  // Initial Load
  loadAnalytics();
})();

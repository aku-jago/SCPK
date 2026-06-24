/**
 * User Dashboard — Main Page Logic
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

  // Load user info
  const user = Auth.getUser();
  if (user) {
    document.getElementById('user-name').textContent = user.name || 'User';
    document.getElementById('user-role').textContent = user.role === 'ADMIN' ? 'Administrator' : 'Pengguna';
    document.getElementById('user-avatar').textContent = (user.name || 'U').charAt(0).toUpperCase();
  }

  // Highlight active nav
  const currentPath = window.location.pathname;
  document.querySelectorAll('.sidebar-link').forEach((link) => {
    link.classList.remove('active');
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });

  // Load dashboard data
  async function loadDashboard() {
    try {
      const res = await API.get('/screening/history?limit=50');
      const screenings = res.data.screenings || [];

      document.getElementById('total-screenings').textContent = res.data.pagination.total;

      if (screenings.length > 0) {
        const latest = screenings[0];
        document.getElementById('latest-score').textContent = latest.riskScore;
        document.getElementById('risk-category').textContent = latest.riskLabel || latest.riskCategory;
        document.getElementById('last-screening-date').textContent = new Date(latest.createdAt).toLocaleDateString('id-ID');

        // Risk trend chart
        const trendData = screenings.slice(0, 10).reverse();
        const ctx1 = document.getElementById('risk-trend-chart');
        if (ctx1 && typeof Chart !== 'undefined') {
          new Chart(ctx1.getContext('2d'), {
            type: 'line',
            data: {
              labels: trendData.map((s) => new Date(s.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })),
              datasets: [{
                label: 'Skor Risiko',
                data: trendData.map((s) => s.riskScore),
                borderColor: '#ec4899',
                backgroundColor: 'rgba(236,72,153,0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointBackgroundColor: '#ec4899',
                pointRadius: 4,
              }],
            },
            options: {
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { min: 0, max: 100, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } },
              },
            },
          });
        }

        // Factor chart (latest screening)
        const ctx2 = document.getElementById('factor-chart');
        if (ctx2 && typeof Chart !== 'undefined') {
          new Chart(ctx2.getContext('2d'), {
            type: 'radar',
            data: {
              labels: ['Usia', 'Rokok/Hari', 'Batuk', 'BMI', 'Lingkungan', 'Nyeri Dada'],
              datasets: [{
                label: 'Faktor Risiko',
                data: [
                  (latest.age / 80) * 10,
                  (latest.cigarettesPerDay / 60) * 10,
                  (latest.coughDuration / 24) * 10,
                  Math.min(latest.bmi / 40 * 10, 10),
                  latest.environmentalExposure,
                  latest.chestPainScale,
                ],
                borderColor: '#a855f7',
                backgroundColor: 'rgba(168,85,247,0.15)',
                pointBackgroundColor: '#a855f7',
                borderWidth: 2,
              }],
            },
            options: {
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                r: { min: 0, max: 10, ticks: { stepSize: 2, display: false }, grid: { color: 'rgba(0,0,0,0.06)' } },
              },
            },
          });
        }
      } else {
        // No screenings yet
        document.getElementById('latest-score').textContent = '-';
        document.getElementById('risk-category').textContent = 'Belum ada';
        document.getElementById('last-screening-date').textContent = '-';
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
    }
  }

  loadDashboard();
})();

/**
 * Admin Risk Distribution — Statistics JS logic
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

  async function loadData() {
    try {
      const res = await API.get('/admin/risk-distribution');
      const data = res.data;

      // Render Summary Table
      renderSummaryTable(data.distribution || []);

      // Render Stacked Bar Chart
      renderMonthlyChart(data.monthlyTrend || []);

    } catch (err) {
      console.error(err);
      Toast.error('Gagal memuat data distribusi risiko.');
    }
  }

  function renderSummaryTable(distList) {
    const tableBody = document.getElementById('distribution-breakdown-table');
    if (!tableBody) return;

    // Convert list to categories map
    const categories = {
      RENDAH: { label: 'Rendah', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
      SEDANG: { label: 'Sedang', color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
      TINGGI: { label: 'Tinggi', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
      SANGAT_TINGGI: { label: 'Sangat Tinggi', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
    };

    // Initialize display list
    const order = ['RENDAH', 'SEDANG', 'TINGGI', 'SANGAT_TINGGI'];
    
    tableBody.innerHTML = order.map(k => {
      const row = distList.find(d => d.riskCategory === k) || { _count: { id: 0 }, _avg: { riskScore: 0 } };
      const cat = categories[k];

      return `
        <tr>
          <td>
            <span class="badge" style="background-color:${cat.bg};color:${cat.color};border:1px solid ${cat.color};font-weight:700;">
              ${cat.label}
            </span>
          </td>
          <td><strong style="color:var(--gray-800);">${row._count.id}</strong> kasus</td>
          <td><strong style="color:var(--gray-800);">${(row._avg.riskScore || 0).toFixed(1)}</strong></td>
        </tr>
      `;
    }).join('');
  }

  function renderMonthlyChart(trendList) {
    const ctx = document.getElementById('monthly-trend-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    // Group items by month
    const monthsMap = {};
    trendList.forEach(item => {
      if (!monthsMap[item.month]) {
        monthsMap[item.month] = { RENDAH: 0, SEDANG: 0, TINGGI: 0, SANGAT_TINGGI: 0 };
      }
      monthsMap[item.month][item.riskCategory] = item.count;
    });

    // Sort months chronologically
    const sortedMonths = Object.keys(monthsMap).sort();

    // Fallback if no monthly trend data exists
    if (sortedMonths.length === 0) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      sortedMonths.push(currentMonth);
      monthsMap[currentMonth] = { RENDAH: 0, SEDANG: 0, TINGGI: 0, SANGAT_TINGGI: 0 };
    }

    const labels = sortedMonths.map(m => {
      const [year, month] = m.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    });

    const datasetLow = sortedMonths.map(m => monthsMap[m].RENDAH);
    const datasetMed = sortedMonths.map(m => monthsMap[m].SEDANG);
    const datasetHigh = sortedMonths.map(m => monthsMap[m].TINGGI);
    const datasetCritical = sortedMonths.map(m => monthsMap[m].SANGAT_TINGGI);

    new Chart(ctx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Rendah', data: datasetLow, backgroundColor: '#22c55e' },
          { label: 'Sedang', data: datasetMed, backgroundColor: '#eab308' },
          { label: 'Tinggi', data: datasetHigh, backgroundColor: '#f97316' },
          { label: 'Sangat Tinggi', data: datasetCritical, backgroundColor: '#ef4444' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12 } }
        },
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  loadData();
})();

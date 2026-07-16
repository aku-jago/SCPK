/**
 * User Dashboard — Bento Grid Core JS Logic
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

  // Date Range Display
  function setDateRange() {
    const el = document.getElementById('date-range-display');
    if (el) {
      const today = new Date();
      const lastMonth = new Date(today);
      lastMonth.setMonth(today.getMonth() - 1);
      const format = { day: 'numeric', month: 'short', year: 'numeric' };
      el.textContent = `${lastMonth.toLocaleDateString('id-ID', format)} - ${today.toLocaleDateString('id-ID', format)}`;
    }
  }
  setDateRange();

  // Load user info
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

  // Highlight active nav
  const currentPath = window.location.pathname;
  document.querySelectorAll('.sidebar-link').forEach((link) => {
    link.classList.remove('active');
    if (link.getAttribute('href') === currentPath) link.classList.add('active');
  });

  // Value Animation
  function animateValue(el, start, end, duration, decimals = 0) {
    if (!el || isNaN(end)) return;
    const range = end - start;
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + range * eased;
      el.textContent = current.toFixed(decimals);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // Load Dashboard Data
  async function loadDashboard() {
    try {
      const res = await API.get('/screening/history?limit=50');
      const screenings = res.data.screenings || [];
      const totalVal = res.data.pagination?.total || screenings.length;

      // Overview Stats
      animateValue(document.getElementById('total-screenings'), 0, totalVal, 800);

      if (screenings.length > 0) {
        const latest = screenings[0];
        
        // Populate Top Stats
        animateValue(document.getElementById('latest-score'), 0, latest.riskScore, 900, 1);
        document.getElementById('risk-category').textContent = latest.riskLabel || latest.riskCategory;
        
        const dateOpt = { day: '2-digit', month: 'short', year: 'numeric' };
        document.getElementById('last-screening-date').textContent = new Date(latest.createdAt).toLocaleDateString('id-ID', dateOpt);

        if (screenings.length > 1) {
          const prev = screenings[1];
          const diff = latest.riskScore - prev.riskScore;
          const pct = prev.riskScore > 0 ? (Math.abs(diff) / prev.riskScore * 100).toFixed(1) : 0;
          const badge = document.getElementById('score-trend-badge');
          
          if (diff > 0) {
            badge.className = 'bento-trend-badge negative';
            badge.innerHTML = `<i data-lucide="arrow-up" style="width:10px;height:10px;"></i> ${pct}%`;
          } else if (diff < 0) {
            badge.className = 'bento-trend-badge positive';
            badge.innerHTML = `<i data-lucide="arrow-down" style="width:10px;height:10px;"></i> ${pct}%`;
          } else {
            badge.className = 'bento-trend-badge neutral';
            badge.innerHTML = `<i data-lucide="minus" style="width:10px;height:10px;"></i> 0%`;
          }
        }

        // Charts & Visuals
        renderFactorSegmentedBar(latest);
        renderRecentTable(screenings);
        renderFactorRadarChart(latest);
        renderMiniGauge(latest.riskScore);
        setHealthTip(latest);

      } else {
        document.getElementById('latest-score').textContent = '0';
        document.getElementById('risk-category').textContent = 'Belum Ada Data';
        document.getElementById('last-screening-date').textContent = '-';
        renderMiniGauge(0);
        setHealthTip(null);
      }
      // Load Tracker Data
      loadCigaretteTracker();

    } catch (err) {
      console.error(err);
      Toast.error('Gagal memuat data dashboard.');
    }
  }

  async function loadCigaretteTracker() {
    try {
      const res = await API.get('/tracker/cigarette?days=7');
      if (res.success && res.data) {
        const { history, average, aiMessage } = res.data;
        
        document.getElementById('tracker-avg').textContent = average;
        
        const warningEl = document.getElementById('tracker-ai-warning');
        if (aiMessage && average > 0) {
          warningEl.style.display = 'block';
          warningEl.style.borderLeftColor = aiMessage.color;
          warningEl.style.backgroundColor = aiMessage.color.replace('var(--', 'rgba(').replace(')', ', 0.05)'); // simple mock, CSS vars in JS can be tricky but this is a fallback. Actually let's just use a neutral or error bg.
          warningEl.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
          
          document.getElementById('warning-title').textContent = aiMessage.title;
          document.getElementById('warning-title').style.color = aiMessage.color;
          document.getElementById('warning-content').textContent = aiMessage.content;
        } else {
          warningEl.style.display = 'none';
        }

        renderCigaretteTrackerChart(history);
      }
    } catch (err) {
      console.error('Failed to load tracker data', err);
    }
  }

  document.getElementById('btn-log-cigarette')?.addEventListener('click', async () => {
    const input = document.getElementById('cigarette-input');
    const count = parseInt(input.value);
    
    if (isNaN(count) || count < 0) {
      return Toast.error('Masukkan jumlah batang rokok yang valid.');
    }
    
    const btn = document.getElementById('btn-log-cigarette');
    btn.disabled = true;
    btn.textContent = '...';
    
    try {
      const res = await API.post('/tracker/cigarette', { count });
      if (res.success) {
        Toast.success('Konsumsi rokok hari ini berhasil dicatat!');
        input.value = '';
        loadCigaretteTracker();
      }
    } catch (err) {
      console.error(err);
      Toast.error(err.message || 'Gagal menyimpan catatan rokok.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Catat';
    }
  });

  function renderCigaretteTrackerChart(historyData) {
    const ctx = document.getElementById('cigarette-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    const labels = historyData.map(d => new Date(d.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }));
    const values = historyData.map(d => d.count);

    if (window.cigaretteChartInstance) {
      window.cigaretteChartInstance.destroy();
    }

    window.cigaretteChartInstance = new Chart(ctx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            type: 'line',
            label: 'Tren Harian',
            data: values,
            borderColor: '#f97316',
            borderWidth: 2,
            tension: 0.4,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#f97316',
            pointBorderWidth: 2,
            pointRadius: 4,
            fill: false
          },
          {
            type: 'bar',
            label: 'Batang Rokok',
            data: values,
            backgroundColor: 'rgba(245, 158, 11, 0.7)',
            borderRadius: 4,
            barPercentage: 0.6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { display: false }
        },
        scales: {
          y: { 
            beginAtZero: true,
            ticks: { stepSize: 1 } 
          },
          x: { 
            grid: { display: false }
          }
        }
      }
    });
  }

  function renderFactorSegmentedBar(latest) {
    // Convert factors to a relative percentage (mock logic for demo)
    const f1 = (latest.cigarettesPerDay / 60) * 100;
    const f2 = (latest.age / 80) * 100;
    const f3 = (latest.environmentalExposure / 10) * 100;
    const f4 = (latest.chestPainScale / 10) * 100;

    const total = f1 + f2 + f3 + f4 || 1;
    const p1 = ((f1/total) * 100).toFixed(1);
    const p2 = ((f2/total) * 100).toFixed(1);
    const p3 = ((f3/total) * 100).toFixed(1);
    const p4 = ((f4/total) * 100).toFixed(1);

    document.getElementById('factor-segmented-bar').innerHTML = `
      <div class="segment" style="width:${p1}%;background:var(--brand-500);"></div>
      <div class="segment" style="width:${p2}%;background:#8b5cf6;"></div>
      <div class="segment" style="width:${p3}%;background:#f59e0b;"></div>
      <div class="segment" style="width:${p4}%;background:#10b981;"></div>
    `;

    document.getElementById('factor-segmented-labels').innerHTML = `
      <div><div class="segment-label"><span class="segment-dot" style="background:var(--brand-500);"></span> Rokok</div><span class="segment-label-val">${p1}%</span></div>
      <div><div class="segment-label"><span class="segment-dot" style="background:#8b5cf6;"></span> Usia</div><span class="segment-label-val">${p2}%</span></div>
      <div><div class="segment-label"><span class="segment-dot" style="background:#f59e0b;"></span> Lingkungan</div><span class="segment-label-val">${p3}%</span></div>
      <div><div class="segment-label"><span class="segment-dot" style="background:#10b981;"></span> Gejala Fisik</div><span class="segment-label-val">${p4}%</span></div>
    `;
  }

  function renderRecentTable(screenings) {
    const tbody = document.getElementById('recent-table-body');
    if (!tbody) return;

    if (screenings.length === 0) return;

    const categories = {
      RENDAH: { label: 'Rendah', color: '#10b981' },
      SEDANG: { label: 'Sedang', color: '#f59e0b' },
      TINGGI: { label: 'Tinggi', color: '#f97316' },
      SANGAT_TINGGI: { label: 'Sangat Tinggi', color: '#ef4444' }
    };

    tbody.innerHTML = screenings.slice(0, 5).map(s => {
      const date = new Date(s.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const cat = categories[s.riskCategory] || { label: s.riskCategory, color: '#6b7280' };
      return `
        <tr>
          <td>${date}</td>
          <td style="font-weight:800;color:var(--gray-900);">${s.riskScore}</td>
          <td style="color:${cat.color};font-weight:700;font-size:12px;">${cat.label}</td>
          <td style="text-align:right;">
            <a href="/dashboard/result.html?id=${s.id}" class="btn btn-secondary btn-sm">Lihat Hasil</a>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderFactorRadarChart(latest) {
    const ctx = document.getElementById('factor-radar-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    new Chart(ctx.getContext('2d'), {
      type: 'radar',
      data: {
        labels: ['Usia', 'Rokok/Hari', 'Batuk', 'BMI', 'Lingkungan', 'Nyeri Dada'],
        datasets: [{
          label: 'Profil Risiko Anda',
          data: [
            (latest.age / 80) * 10,
            (latest.cigarettesPerDay / 60) * 10,
            (latest.coughDuration / 24) * 10,
            Math.min(latest.bmi / 40 * 10, 10),
            latest.environmentalExposure,
            latest.chestPainScale,
          ],
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139,92,246,0.2)',
          pointBackgroundColor: '#8b5cf6',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          r: { min: 0, max: 10, ticks: { display: false }, grid: { color: 'rgba(0,0,0,0.06)' }, angleLines: { color: 'rgba(0,0,0,0.06)' } },
        },
      }
    });
  }

  function renderMiniGauge(score) {
    const ctx = document.getElementById('risk-gauge-mini');
    if (!ctx || typeof Chart === 'undefined') return;

    animateValue(document.getElementById('gauge-score-val'), 0, score, 800, 1);

    let color = '#10b981'; // Green
    if (score >= 25) color = '#f59e0b'; // Yellow
    if (score >= 50) color = '#f97316'; // Orange
    if (score >= 75) color = '#ef4444'; // Red

    new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Skor', 'Sisa'],
        datasets: [{
          data: [score, 100 - score],
          backgroundColor: [color, '#f3f4f6'],
          borderWidth: 0,
          borderRadius: 20
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '85%',
        rotation: -90,
        circumference: 180,
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
      }
    });
  }

  function setHealthTip(latest) {
    const tipEl = document.getElementById('health-tip-text');
    if (!tipEl) return;
    
    if (!latest) {
      tipEl.textContent = 'Mulai screening pertama Anda untuk mendapatkan analisis cerdas dari AI.';
      return;
    }

    if (latest.riskScore > 75) {
      tipEl.textContent = '🚨 Risiko sangat tinggi terdeteksi. Segera konsultasikan hasil ini dengan dokter spesialis paru atau fasilitas kesehatan terdekat.';
    } else if (latest.cigarettesPerDay > 10) {
      tipEl.textContent = '🚬 Konsumsi rokok harian Anda sangat memengaruhi risiko. Mengurangi rokok sedikit demi sedikit dapat berdampak besar.';
    } else if (latest.environmentalExposure > 7) {
      tipEl.textContent = '🏭 Paparan lingkungan tinggi. Pastikan menggunakan masker standar di area berpolusi dan jaga ventilasi udara rumah.';
    } else {
      tipEl.textContent = '✨ Pertahankan pola hidup sehat Anda! Rutin berolahraga dan makan bergizi sangat baik untuk kesehatan paru-paru.';
    }
  }

  loadDashboard();
})();

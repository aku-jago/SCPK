/**
 * Screening Result — Details & Visualizations
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

  // Load User Info
  const user = Auth.getUser();
  if (user) {
    document.getElementById('user-name').textContent = user.name || 'User';
    document.getElementById('user-avatar').textContent = (user.name || 'U').charAt(0).toUpperCase();
  }

  const params = new URLSearchParams(window.location.search);
  const screeningId = params.get('id');

  if (!screeningId) {
    Toast.error('ID screening tidak ditemukan.');
    setTimeout(() => { window.location.href = '/dashboard/'; }, 2000);
    return;
  }

  let screeningData = null;

  async function loadResult() {
    try {
      const res = await API.get(`/screening/${screeningId}/result`);
      screeningData = res.data;

      // Populate text details
      document.getElementById('result-date').textContent = `Diperiksa pada ${new Date(screeningData.createdAt).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;

      // Set score and badge
      const scoreEl = document.getElementById('risk-score');
      const badgeEl = document.getElementById('risk-badge');
      const descEl = document.getElementById('risk-description');

      // Animating score
      animateValue(scoreEl, 0, screeningData.riskScore, 1000);

      // Badge style
      badgeEl.textContent = screeningData.riskLabel || screeningData.riskCategory;
      badgeEl.style.backgroundColor = getRGBA(screeningData.riskColor || '#6b7280', 0.15);
      badgeEl.style.color = screeningData.riskColor || '#6b7280';
      badgeEl.style.border = `1px solid ${screeningData.riskColor || '#6b7280'}`;

      // Description logic
      let desc = '';
      if (screeningData.riskCategory === 'RENDAH') {
        desc = 'Tingkat risiko kanker paru-paru Anda tergolong rendah. Tetap pertahankan gaya hidup sehat, hindari paparan asap rokok, dan lakukan olahraga teratur.';
      } else if (screeningData.riskCategory === 'SEDANG') {
        desc = 'Terdeteksi risiko tingkat sedang. Sangat disarankan untuk mengurangi kebiasaan merokok, menghindari lingkungan polusi tinggi, dan berkonsultasi dengan tenaga medis.';
      } else if (screeningData.riskCategory === 'TINGGI') {
        desc = 'Peringatan: Tingkat risiko tinggi. Anda sangat dianjurkan untuk segera berkonsultasi dengan dokter spesialis paru untuk pemeriksaan diagnostik lebih lanjut dan memulai program berhenti merokok.';
      } else if (screeningData.riskCategory === 'SANGAT_TINGGI') {
        desc = 'Peringatan Kritis: Risiko sangat tinggi terdeteksi. Silakan hubungi rumah sakit atau dokter spesialis paru sesegera mungkin untuk pemeriksaan medis komprehensif.';
      }
      descEl.textContent = desc;

      // Draw custom risk gauge
      drawGauge(screeningData.riskScore, screeningData.riskColor);

      // Render parameter items
      renderParameters(screeningData);

      // Render radar chart
      renderRadar(screeningData);

      // Render recommendations
      renderRecommendations(screeningData.recommendations || []);

    } catch (err) {
      console.error(err);
      Toast.error(err.message || 'Gagal memuat data hasil screening.');
    }
  }

  // Value animation helper
  function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      obj.innerHTML = Math.floor(progress * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  // Draw custom canvas gauge
  function drawGauge(score, colorCode) {
    const canvas = document.getElementById('risk-gauge');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    const radius = 100;

    let currentAngle = Math.PI; // Start from left

    function drawFrame(currentScore) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background gauge track
      ctx.beginPath();
      ctx.arc(x, y, radius, Math.PI, 2 * Math.PI);
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineCap = 'round';
      ctx.stroke();

      // Colored filled track based on currentScore
      const endAngle = Math.PI + (Math.PI * (currentScore / 100));
      ctx.beginPath();
      ctx.arc(x, y, radius, Math.PI, endAngle);
      ctx.lineWidth = 14;
      ctx.strokeStyle = colorCode || '#ec4899';
      ctx.lineCap = 'round';
      ctx.stroke();

      // Draw needle/pointer
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(endAngle);
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(0, -radius - 4);
      ctx.lineTo(10, 0);
      ctx.closePath();
      ctx.fillStyle = '#1f2937';
      ctx.fill();

      // Needle center
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#1f2937';
      ctx.stroke();
      ctx.restore();
    }

    // Animate the needle sweep
    let currentScoreAnim = 0;
    const duration = 1000;
    let startTimestamp = null;

    const animStep = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      currentScoreAnim = progress * score;
      drawFrame(currentScoreAnim);
      if (progress < 1) {
        window.requestAnimationFrame(animStep);
      }
    };
    window.requestAnimationFrame(animStep);
  }

  function getRGBA(hex, alpha) {
    if (!hex.startsWith('#')) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function renderParameters(data) {
    const list = document.getElementById('params-list');
    if (!list) return;

    const params = [
      { label: 'Usia', value: `${data.age} tahun`, icon: 'user' },
      { label: 'Berat Badan', value: `${data.weight} kg`, icon: 'scale' },
      { label: 'Tinggi Badan', value: `${data.height} cm`, icon: 'ruler' },
      { label: 'Indeks Massa Tubuh (BMI)', value: `${data.bmi} (${getBMICategory(data.bmi)})`, icon: 'activity' },
      { label: 'Rokok per Hari', value: `${data.cigarettesPerDay} batang`, icon: 'cig' },
      { label: 'Durasi Batuk', value: data.coughDuration > 0 ? `${data.coughDuration} bulan` : 'Tidak batuk', icon: 'wind' },
      { label: 'Riwayat Keluarga', value: data.familyHistory ? 'Ya, ada riwayat' : 'Tidak ada riwayat', icon: 'users' },
      { label: 'Paparan Lingkungan Berbahaya', value: `${data.environmentalExposure}/10`, icon: 'shield-alert' },
      { label: 'Skala Nyeri Dada', value: `${data.chestPainScale}/10`, icon: 'flame' }
    ];

    list.innerHTML = params.map(p => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-3) var(--space-4);background:var(--gray-50);border-radius:var(--radius-xl);border:1px solid var(--gray-100);">
        <div style="display:flex;align-items:center;gap:var(--space-3);">
          <span style="color:var(--gray-400);display:flex;"><i data-lucide="${p.icon === 'cig' ? 'ban' : p.icon}" style="width:16px;height:16px;"></i></span>
          <span style="font-size:var(--text-sm);color:var(--gray-600);font-weight:500;">${p.label}</span>
        </div>
        <span style="font-size:var(--text-sm);font-weight:700;color:var(--gray-800);">${p.value}</span>
      </div>
    `).join('');

    lucide.createIcons();
  }

  function getBMICategory(bmi) {
    if (bmi < 18.5) return 'Kurus';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Gemuk';
    return 'Obesitas';
  }

  function renderRadar(data) {
    const ctx = document.getElementById('radar-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    // Normalizing values out of 10
    const ageNormalized = (data.age / 80) * 10;
    const cigsNormalized = (data.cigarettesPerDay / 60) * 10;
    const coughNormalized = (data.coughDuration / 24) * 10;
    const bmiNormalized = Math.min((data.bmi / 40) * 10, 10);
    const envNormalized = data.environmentalExposure;
    const painNormalized = data.chestPainScale;

    new Chart(ctx.getContext('2d'), {
      type: 'radar',
      data: {
        labels: ['Usia', 'Rokok/Hari', 'Batuk', 'BMI', 'Lingkungan', 'Nyeri Dada'],
        datasets: [{
          label: 'Profil Risiko Anda',
          data: [
            ageNormalized,
            cigsNormalized,
            coughNormalized,
            bmiNormalized,
            envNormalized,
            painNormalized
          ],
          borderColor: data.riskColor || '#ec4899',
          backgroundColor: getRGBA(data.riskColor || '#ec4899', 0.15),
          pointBackgroundColor: data.riskColor || '#ec4899',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          r: {
            min: 0,
            max: 10,
            ticks: { display: false, stepSize: 2 },
            grid: { color: 'rgba(0,0,0,0.06)' },
            angleLines: { color: 'rgba(0,0,0,0.06)' }
          }
        }
      }
    });
  }

  function renderRecommendations(recs) {
    const container = document.getElementById('recommendations-list');
    if (!container) return;

    if (recs.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--gray-400); padding: var(--space-8);">
          Belum ada rekomendasi spesifik yang dihasilkan.
        </div>
      `;
      return;
    }

    container.innerHTML = recs.map(rec => {
      let icon = 'shield-check';
      let iconColor = 'var(--success)';
      let bgColor = 'var(--success-light)';

      if (rec.title.toLowerCase().includes('dokter') || rec.title.toLowerCase().includes('medis')) {
        icon = 'heart-pulse';
        iconColor = 'var(--pink-500)';
        bgColor = 'var(--pink-50)';
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

    lucide.createIcons();
  }

  // PDF Download Trigger
  document.getElementById('btn-download')?.addEventListener('click', async () => {
    if (!screeningData) return;
    const btn = document.getElementById('btn-download');
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Generating...';

    try {
      await PDFGenerator.generateReport(screeningData);
      Toast.success('Laporan PDF berhasil diunduh!');
    } catch (error) {
      console.error(error);
      Toast.error('Gagal mengunduh laporan PDF.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });

  loadResult();
})();

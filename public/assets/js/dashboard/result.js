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
      const meterValue = document.getElementById('risk-meter-value');
      const barFill = document.getElementById('risk-bar-fill');

      if (meterValue) animateValue(meterValue, 0, screeningData.riskScore, 1000, '%');
      if (barFill) {
        barFill.style.width = '0%';
        barFill.style.backgroundColor = screeningData.riskColor || '#ef4444';
        setTimeout(() => {
          barFill.style.width = `${screeningData.riskScore}%`;
        }, 100);
      }

      // Animating score with percentage symbol
      animateValue(scoreEl, 0, screeningData.riskScore, 1000, '%');

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

      // Render dominant factors list
      renderDominantFactors(screeningData);

      // Render radar chart
      renderRadar(screeningData);

      // Render recommendations
      renderRecommendations(screeningData.recommendations || []);

      // Show smoking cessation motivation popup
      showQuitMotivationPopup(screeningData);

    } catch (err) {
      console.error(err);
      Toast.error(err.message || 'Gagal memuat data hasil screening.');
    }
  }

  // Value animation helper
  function animateValue(obj, start, end, duration, suffix = '') {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      obj.innerHTML = Math.floor(progress * (end - start) + start) + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  // Draw segmented canvas gauge (like reference)
  function drawGauge(score, colorCode) {
    const canvas = document.getElementById('risk-gauge');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const x = canvas.width / 2;
    // Lower center slightly because it's a semi-circle
    const y = canvas.height / 2 + 30; 
    
    const innerRadius = 95;
    const outerRadius = 125;
    const totalSegments = 45;
    
    function hexToRgba(hex, alpha) {
      if (!hex.startsWith('#')) return hex;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }

    const baseColor = colorCode || '#10b981';

    function drawFrame(currentScore) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const startAngle = Math.PI;
      const totalAngle = Math.PI;
      const filledSegments = Math.round((currentScore / 100) * totalSegments);

      for (let i = 0; i <= totalSegments; i++) {
        const angle = startAngle + (i / totalSegments) * totalAngle;
        
        ctx.beginPath();
        const startX = x + Math.cos(angle) * innerRadius;
        const startY = y + Math.sin(angle) * innerRadius;
        const endX = x + Math.cos(angle) * outerRadius;
        const endY = y + Math.sin(angle) * outerRadius;
        
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        if (i <= filledSegments && currentScore > 0) {
          // Opacity fades out towards the end for a gradient look
          const alpha = 0.4 + (0.6 * (i / Math.max(filledSegments, 1)));
          ctx.strokeStyle = hexToRgba(baseColor, alpha);
        } else {
          ctx.strokeStyle = '#f3f4f6';
        }
        
        ctx.stroke();
      }
    }

    let currentScoreAnim = 0;
    const duration = 1200;
    let startTimestamp = null;

    const animStep = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      currentScoreAnim = easeOut * score;
      
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

  function renderDominantFactors(data) {
    const list = document.getElementById('dominant-factors-list');
    if (!list) return;

    let factors = [];
    if (data.cigarettesPerDay > 10) factors.push({ label: 'Intensitas Merokok Tinggi', icon: 'ban', color: '#ef4444' });
    else if (data.cigarettesPerDay > 0) factors.push({ label: 'Perokok Aktif', icon: 'ban', color: '#f59e0b' });
    
    if (data.coughDuration > 2) factors.push({ label: 'Batuk Kronis', icon: 'wind', color: '#ef4444' });
    if (data.bmi > 25) factors.push({ label: 'Berat Badan Berlebih (BMI)', icon: 'activity', color: '#f59e0b' });
    if (data.familyHistory) factors.push({ label: 'Riwayat Genetik/Keluarga', icon: 'users', color: '#ef4444' });
    if (data.environmentalExposure > 5) factors.push({ label: 'Paparan Polusi Tinggi', icon: 'shield-alert', color: '#ef4444' });
    if (data.chestPainScale > 4) factors.push({ label: 'Nyeri Dada Signifikan', icon: 'flame', color: '#ef4444' });
    else if (data.chestPainScale > 0) factors.push({ label: 'Gejala Nyeri Dada', icon: 'flame', color: '#f59e0b' });

    if (factors.length === 0) {
      factors.push({ label: 'Tidak ada faktor risiko dominan', icon: 'check-circle', color: '#10b981' });
    }

    list.innerHTML = factors.slice(0, 4).map(f => `
      <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-2);background:var(--white);padding:var(--space-2) var(--space-3);border-radius:var(--radius-lg);border:1px solid var(--gray-200);">
        <i data-lucide="${f.icon}" style="width:16px;height:16px;color:${f.color};"></i>
        <span style="font-size:var(--text-sm);font-weight:600;color:var(--gray-800);">${f.label}</span>
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
          borderColor: data.riskColor || 'var(--brand-500)',
          backgroundColor: getRGBA(data.riskColor || 'var(--brand-500)', 0.15),
          pointBackgroundColor: data.riskColor || 'var(--brand-500)',
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

    lucide.createIcons();
  }

  // ═══ Smoking Cessation Motivation Popup ═══
  function showQuitMotivationPopup(data) {
    const overlay = document.getElementById('quit-modal-overlay');
    const modal = document.getElementById('quit-modal');
    if (!overlay || !modal) return;

    // Determine content based on risk level
    const riskCategory = (data.riskCategory || '').toUpperCase();
    const cigarettesPerDay = data.cigarettesPerDay || 0;

    // Configure popup by risk level
    const config = getPopupConfig(riskCategory, cigarettesPerDay);

    // Apply risk-level CSS class
    modal.className = 'quit-modal';
    modal.classList.add(`risk-${riskCategory.toLowerCase()}`);

    // Update badge
    const badge = document.getElementById('quit-modal-badge');
    if (badge) badge.textContent = config.badge;

    // Update icon
    const iconEl = document.getElementById('quit-modal-icon');
    if (iconEl) {
      iconEl.innerHTML = `<i data-lucide="${config.icon}" style="width:32px;height:32px;"></i>`;
    }

    // Update title
    const title = document.getElementById('quit-modal-title');
    if (title) title.textContent = config.title;

    // Update message
    const message = document.getElementById('quit-modal-message');
    if (message) message.textContent = config.message;

    // Update quote
    const quote = document.getElementById('quit-modal-quote');
    if (quote) {
      quote.querySelector('p').textContent = config.quote;
    }

    // Recreate Lucide icons inside the modal
    lucide.createIcons({ nodes: [modal] });

    // Show the popup after a short delay (let the page render first)
    setTimeout(() => {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }, 1500);

    // Close handlers
    const closeModal = () => {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    document.getElementById('quit-modal-close')?.addEventListener('click', closeModal);
    document.getElementById('quit-modal-dismiss')?.addEventListener('click', closeModal);

    // Close on overlay click (outside modal)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        closeModal();
      }
    });
  }

  function getPopupConfig(riskCategory, cigarettesPerDay) {
    const configs = {
      'RENDAH': {
        badge: '💚 Tips Kesehatan',
        icon: 'shield-check',
        title: 'Pertahankan Gaya Hidup Sehat!',
        message: 'Hasil screening Anda menunjukkan risiko rendah. Tetap jaga pola hidup sehat dan hindari paparan asap rokok untuk melindungi paru-paru Anda.',
        quote: '"Pencegahan adalah obat terbaik. Terus jaga kesehatan paru-paru Anda dengan menghindari rokok dan polusi."'
      },
      'SEDANG': {
        badge: '⚠️ Peringatan Kesehatan',
        icon: 'alert-triangle',
        title: 'Waktunya Berubah untuk Kesehatan Anda',
        message: cigarettesPerDay > 0
          ? `Anda mengonsumsi ${cigarettesPerDay} batang rokok per hari. Mengurangi atau berhenti merokok sekarang dapat menurunkan risiko kanker paru-paru secara signifikan.`
          : 'Risiko Anda berada di level sedang. Sangat disarankan untuk menghindari faktor risiko dan berkonsultasi dengan tenaga medis.',
        quote: '"Setiap rokok yang tidak Anda hisap adalah kemenangan kecil untuk paru-paru Anda. Mulailah hari ini."'
      },
      'TINGGI': {
        badge: '🔴 Peringatan Serius',
        icon: 'alert-octagon',
        title: 'Paru-Paru Anda Membutuhkan Perhatian Segera',
        message: cigarettesPerDay > 0
          ? `Dengan ${cigarettesPerDay} batang rokok per hari, risiko Anda tergolong tinggi. Berhenti merokok adalah langkah paling penting yang bisa Anda ambil sekarang.`
          : 'Tingkat risiko Anda tinggi. Segera konsultasikan dengan dokter spesialis paru untuk pemeriksaan lebih lanjut.',
        quote: '"Tidak pernah terlambat untuk berhenti. Dalam 24 jam setelah berhenti merokok, risiko serangan jantung Anda sudah mulai menurun."'
      },
      'SANGAT_TINGGI': {
        badge: '🚨 Peringatan Kritis',
        icon: 'siren',
        title: 'Tindakan Segera Diperlukan!',
        message: cigarettesPerDay > 0
          ? `Mengonsumsi ${cigarettesPerDay} batang rokok per hari menempatkan Anda pada risiko sangat tinggi. Berhenti merokok SEKARANG dan segera hubungi dokter spesialis paru.`
          : 'Risiko Anda sangat tinggi. Sangat penting untuk segera mendapatkan pemeriksaan medis komprehensif dari dokter spesialis.',
        quote: '"Hidup Anda berharga. Setiap detik yang Anda pilih untuk berhenti merokok adalah detik yang Anda berikan untuk keluarga dan masa depan Anda."'
      }
    };

    return configs[riskCategory] || configs['SEDANG'];
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

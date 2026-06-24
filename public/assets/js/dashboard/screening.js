/**
 * Self Screening — Wizard Logic
 */
(function () {
  'use strict';

  if (!Auth.requireAuth()) return;

  // Sidebar
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => { sidebar.classList.toggle('open'); overlay.classList.toggle('active'); });
  overlay?.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); });
  document.getElementById('btn-logout')?.addEventListener('click', () => Auth.logout());

  const user = Auth.getUser();
  if (user) {
    document.getElementById('user-name').textContent = user.name || 'User';
    document.getElementById('user-avatar').textContent = (user.name || 'U')[0].toUpperCase();
  }

  // Wizard state
  let currentStep = 1;
  const totalSteps = 4;

  // BMI Calculator
  const weightInput = document.getElementById('weight');
  const heightInput = document.getElementById('height');
  const bmiDisplay = document.getElementById('bmi-display');
  const bmiValue = document.getElementById('bmi-value');
  const bmiCategory = document.getElementById('bmi-category');

  function calcBMI() {
    const w = parseFloat(weightInput.value);
    const h = parseFloat(heightInput.value);
    if (w > 0 && h > 0) {
      const bmi = w / ((h / 100) ** 2);
      bmiValue.textContent = bmi.toFixed(1);
      bmiDisplay.style.display = 'flex';

      let cat = '', cls = '';
      if (bmi < 18.5) { cat = 'Kurus'; cls = 'badge-info'; }
      else if (bmi < 25) { cat = 'Normal'; cls = 'badge-success'; }
      else if (bmi < 30) { cat = 'Gemuk'; cls = 'badge-warning'; }
      else { cat = 'Obesitas'; cls = 'badge-danger'; }

      bmiCategory.textContent = cat;
      bmiCategory.className = 'badge ' + cls;
    } else {
      bmiDisplay.style.display = 'none';
    }
  }
  weightInput?.addEventListener('input', calcBMI);
  heightInput?.addEventListener('input', calcBMI);

  // Range slider display
  const envSlider = document.getElementById('environmentalExposure');
  const painSlider = document.getElementById('chestPainScale');
  envSlider?.addEventListener('input', () => { document.getElementById('env-value').textContent = envSlider.value; });
  painSlider?.addEventListener('input', () => { document.getElementById('pain-value').textContent = painSlider.value; });

  // Wizard navigation
  window.wizardNext = function () {
    if (!validateStep(currentStep)) return;
    if (currentStep < totalSteps) {
      currentStep++;
      updateWizard();
    }
  };

  window.wizardPrev = function () {
    if (currentStep > 1) {
      currentStep--;
      updateWizard();
    }
  };

  function updateWizard() {
    // Update panels
    document.querySelectorAll('.wizard-panel').forEach((p) => p.classList.remove('active'));
    document.getElementById(`step-${currentStep}`)?.classList.add('active');

    // Update dots
    document.querySelectorAll('.wizard-step-dot').forEach((dot) => {
      const step = parseInt(dot.dataset.step);
      dot.classList.remove('active', 'completed');
      if (step === currentStep) dot.classList.add('active');
      else if (step < currentStep) dot.classList.add('completed');
    });

    // Update lines
    for (let i = 1; i < totalSteps; i++) {
      const line = document.getElementById(`line-${i}`);
      if (line) {
        line.classList.toggle('completed', i < currentStep);
      }
    }

    // Build summary on step 4
    if (currentStep === 4) buildSummary();

    lucide.createIcons();
  }

  function validateStep(step) {
    let valid = true;
    document.querySelectorAll('.form-error').forEach((e) => (e.textContent = ''));

    if (step === 1) {
      const age = document.getElementById('age').value;
      const weight = document.getElementById('weight').value;
      const height = document.getElementById('height').value;
      if (!age || age < 15 || age > 80) { document.getElementById('age-error').textContent = 'Usia harus 15-80 tahun'; valid = false; }
      if (!weight || weight < 30 || weight > 200) { document.getElementById('weight-error').textContent = 'Berat harus 30-200 kg'; valid = false; }
      if (!height || height < 100 || height > 250) { document.getElementById('height-error').textContent = 'Tinggi harus 100-250 cm'; valid = false; }
    }
    if (step === 2) {
      const cigs = document.getElementById('cigarettesPerDay').value;
      const cough = document.getElementById('coughDuration').value;
      if (!cigs || cigs < 1 || cigs > 60) { document.getElementById('cigarettesPerDay-error').textContent = 'Jumlah rokok harus 1-60'; valid = false; }
      if (cough === '' || cough < 0 || cough > 24) { document.getElementById('coughDuration-error').textContent = 'Durasi batuk harus 0-24 bulan'; valid = false; }
    }
    return valid;
  }

  function getFormData() {
    const familyRadio = document.querySelector('input[name="familyHistory"]:checked');
    return {
      age: parseInt(document.getElementById('age').value),
      cigarettesPerDay: parseInt(document.getElementById('cigarettesPerDay').value),
      coughDuration: parseFloat(document.getElementById('coughDuration').value),
      weight: parseFloat(document.getElementById('weight').value),
      height: parseFloat(document.getElementById('height').value),
      familyHistory: familyRadio ? familyRadio.value === 'true' : false,
      environmentalExposure: parseInt(document.getElementById('environmentalExposure').value),
      chestPainScale: parseInt(document.getElementById('chestPainScale').value),
    };
  }

  function buildSummary() {
    const data = getFormData();
    const bmi = data.weight / ((data.height / 100) ** 2);
    const summaryEl = document.getElementById('summary-data');
    const items = [
      ['Usia', `${data.age} tahun`],
      ['Berat Badan', `${data.weight} kg`],
      ['Tinggi Badan', `${data.height} cm`],
      ['BMI', `${bmi.toFixed(1)} kg/m²`],
      ['Rokok per Hari', `${data.cigarettesPerDay} batang`],
      ['Durasi Batuk', `${data.coughDuration} bulan`],
      ['Riwayat Keluarga', data.familyHistory ? 'Ya' : 'Tidak'],
      ['Paparan Lingkungan', `${data.environmentalExposure}/10`],
      ['Nyeri Dada', `${data.chestPainScale}/10`],
    ];
    summaryEl.innerHTML = items.map(([l, v]) => `
      <div style="display:flex;justify-content:space-between;padding:var(--space-3) var(--space-4);background:var(--gray-50);border-radius:var(--radius-md);">
        <span style="font-size:var(--text-sm);color:var(--gray-600);">${l}</span>
        <span style="font-size:var(--text-sm);font-weight:700;color:var(--gray-900);">${v}</span>
      </div>
    `).join('');
  }

  // Submit screening
  document.getElementById('btn-submit-screening')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-submit-screening');
    btn.classList.add('btn-loading');
    btn.disabled = true;
    btn.innerHTML = '<span style="opacity:0">Analyzing...</span>';

    try {
      const data = getFormData();
      const result = await API.post('/screening', data);
      const screeningId = result.data.screening.id;
      // Redirect to AI processing screen
      window.location.href = `/dashboard/ai-processing.html?id=${screeningId}`;
    } catch (error) {
      const msg = error.errors ? error.errors.map((e) => e.message).join('. ') : error.message || 'Screening gagal';
      Toast.error(msg);
      btn.classList.remove('btn-loading');
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="brain" style="width:18px;height:18px;"></i> Analisis dengan AI';
      lucide.createIcons();
    }
  });
})();

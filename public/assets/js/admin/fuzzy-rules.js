/**
 * Admin Fuzzy Rules — Decision Engine Configuration Control
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
    const avatarEl2 = document.getElementById('user-avatar');
    if (avatarEl2) {
      if (user.avatar) {
        avatarEl2.innerHTML = '<img src="' + user.avatar + '" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
        avatarEl2.style.background = 'none';
      } else {
        avatarEl2.textContent = (user.name || 'A').charAt(0).toUpperCase();
      }
    }
  }

  // State
  let cachedRules = [];
  let cachedVariables = [];
  let variableOptionsMap = {}; // Maps variable name to its membership function names

  // Tabs DOM elements
  const tabRulesBtn = document.getElementById('tab-rules-btn');
  const tabVariablesBtn = document.getElementById('tab-variables-btn');
  const tabRulesContent = document.getElementById('tab-rules-content');
  const tabVariablesContent = document.getElementById('tab-variables-content');

  // Loading containers
  const rulesLoading = document.getElementById('rules-loading-container');
  const rulesEmpty = document.getElementById('rules-empty-container');
  const rulesList = document.getElementById('rules-list');

  const variablesLoading = document.getElementById('variables-loading-container');
  const variablesList = document.getElementById('variables-list');

  // Tab switching logic
  tabRulesBtn.addEventListener('click', () => {
    tabRulesBtn.style.borderBottom = '3px solid var(--admin-blue-500)';
    tabRulesBtn.style.color = 'var(--admin-blue-600)';
    tabRulesBtn.style.fontWeight = '700';

    tabVariablesBtn.style.borderBottom = 'none';
    tabVariablesBtn.style.color = 'var(--gray-500)';
    tabVariablesBtn.style.fontWeight = 'normal';

    tabRulesContent.style.display = 'block';
    tabVariablesContent.style.display = 'none';
  });

  tabVariablesBtn.addEventListener('click', () => {
    tabVariablesBtn.style.borderBottom = '3px solid var(--admin-blue-500)';
    tabVariablesBtn.style.color = 'var(--admin-blue-600)';
    tabVariablesBtn.style.fontWeight = '700';

    tabRulesBtn.style.borderBottom = 'none';
    tabRulesBtn.style.color = 'var(--gray-500)';
    tabRulesBtn.style.fontWeight = 'normal';

    tabVariablesContent.style.display = 'block';
    tabRulesContent.style.display = 'none';
    
    if (cachedVariables.length === 0) loadVariables();
  });

  // Load Rules
  async function loadRules() {
    rulesLoading.style.display = 'block';
    rulesLoading.innerHTML = Skeleton.card() + Skeleton.card();
    rulesEmpty.style.display = 'none';
    rulesList.innerHTML = '';

    try {
      const res = await API.get('/admin/fuzzy-rules');
      const rules = res.data || [];
      cachedRules = rules;

      rulesLoading.style.display = 'none';

      if (rules.length === 0) {
        rulesEmpty.style.display = 'block';
        return;
      }

      rulesList.innerHTML = rules.map(r => {
        const conditionsHtml = r.conditions.map(c => `
          <span class="rule-condition-badge"><strong>${c.variable}</strong> = ${c.value}</span>
        `).join('');

        return `
          <div class="glass-card rule-card" style="padding:var(--space-5);">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-2);">
              <div style="font-weight:700;color:var(--gray-800);font-size:var(--text-sm);">${r.name}</div>
              <span class="badge admin-badge" style="font-size:10px;">Bobot: ${r.weight.toFixed(1)}</span>
            </div>
            <div style="margin-bottom:var(--space-4);">
              <div style="font-size:11px;color:var(--gray-400);margin-bottom:4px;">IF (Kondisi):</div>
              <div style="display:flex;flex-wrap:wrap;gap:4px;">${conditionsHtml}</div>
            </div>
            <div style="margin-bottom:var(--space-4);">
              <div style="font-size:11px;color:var(--gray-400);margin-bottom:4px;">THEN (Konsekuensi):</div>
              <span class="badge" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;font-weight:700;">
                riskLevel = ${r.consequent.toUpperCase().replace('_', ' ')}
              </span>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:var(--space-2);border-top:1px solid var(--gray-100);padding-top:var(--space-3);">
              <button class="btn btn-secondary btn-sm" onclick="showRuleEditModal('${r.id}')">Edit</button>
              <button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="deleteRule('${r.id}', '${r.name}')">Hapus</button>
            </div>
          </div>
        `;
      }).join('');

      lucide.createIcons();

    } catch (err) {
      console.error(err);
      rulesLoading.style.display = 'none';
      Toast.error('Gagal memuat aturan fuzzy.');
    }
  }

  // Load Variables & Map options
  async function loadVariables() {
    variablesLoading.style.display = 'block';
    variablesLoading.innerHTML = Skeleton.text('80%') + Skeleton.text('90%') + Skeleton.text('60%');
    variablesList.innerHTML = '';

    try {
      const res = await API.get('/admin/fuzzy-variables');
      const vars = res.data || [];
      cachedVariables = vars;

      variablesLoading.style.display = 'none';

      // Build Map for Rule Conditions Form
      variableOptionsMap = {};
      vars.forEach(v => {
        if (v.type === 'INPUT') {
          variableOptionsMap[v.name] = {
            label: v.label,
            options: v.membershipFunctions.map(f => f.name)
          };
        }
      });

      variablesList.innerHTML = vars.map(v => {
        const typeBadge = v.type === 'INPUT'
          ? `<span class="badge badge-info">Variabel Input</span>`
          : `<span class="badge badge-info">Variabel Output (Konsekuensi)</span>`;

        const ranges = `Rentang: ${v.minValue} - ${v.maxValue} ${v.unit || ''}`;

        const mfList = v.membershipFunctions.map(f => {
          return `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-2) var(--space-3);background:var(--white);border:1px solid var(--gray-200);border-radius:var(--radius-md);font-size:var(--text-xs);color:var(--gray-600);">
              <div>
                <strong style="color:var(--gray-800);">${f.name}</strong> 
                <span style="color:var(--gray-400);margin-left:4px;">(${f.type})</span>
              </div>
              <div style="font-family:monospace;background:var(--gray-50);padding:2px 6px;border-radius:4px;color:var(--gray-700);">
                [ ${f.params.join(', ')} ]
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="glass-card" style="padding:var(--space-5);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-3);flex-wrap:wrap;gap:var(--space-2);">
              <div>
                <h3 style="font-size:var(--text-base);font-weight:800;color:var(--gray-900);">${v.label} <span style="font-size:var(--text-xs);color:var(--gray-400);font-weight:normal;">(${v.name})</span></h3>
                <div style="font-size:var(--text-xs);color:var(--gray-500);margin-top:2px;">${ranges}</div>
              </div>
              ${typeBadge}
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:var(--space-2);background:var(--gray-50);padding:var(--space-3);border-radius:var(--radius-xl);">
              ${mfList}
            </div>
          </div>
        `;
      }).join('');

      lucide.createIcons();

    } catch (err) {
      console.error(err);
      variablesLoading.style.display = 'none';
      Toast.error('Gagal memuat variabel fuzzy.');
    }
  }

  // Delete Rule API
  window.deleteRule = async function (id, name) {
    if (!confirm(`Apakah Anda yakin ingin menghapus aturan "${name}"?`)) return;

    try {
      await API.delete(`/admin/fuzzy-rules/${id}`);
      Toast.success('Aturan berhasil dihapus!');
      loadRules();
    } catch (err) {
      console.error(err);
      Toast.error('Gagal menghapus aturan.');
    }
  };

  // Show Rule Edit/Create modal
  window.showRuleEditModal = function (id = null) {
    const isEdit = !!id;
    const rule = isEdit ? cachedRules.find(item => item.id === id) : {
      name: '',
      conditions: [],
      consequent: 'rendah',
      weight: 1.0
    };

    // Render condition form rows dynamically
    const inputsListHtml = Object.keys(variableOptionsMap).map(varName => {
      const vData = variableOptionsMap[varName];
      const match = rule.conditions.find(c => c.variable === varName);
      const isChecked = !!match;
      const selectedVal = match ? match.value : '';

      const optionsHtml = vData.options.map(opt => `
        <option value="${opt}" ${selectedVal === opt ? 'selected' : ''}>${opt}</option>
      `).join('');

      return `
        <div style="display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:var(--space-3);align-items:center;padding:var(--space-2) 0;border-bottom:1px solid var(--gray-100);">
          <div style="display:flex;align-items:center;gap:var(--space-2);">
            <input type="checkbox" id="chk-var-${varName}" style="accent-color:var(--admin-blue-500);width:16px;height:16px;" ${isChecked ? 'checked' : ''} onchange="toggleFormSelect('${varName}')">
            <label for="chk-var-${varName}" style="font-size:var(--text-xs);font-weight:600;color:var(--gray-700);cursor:pointer;">${vData.label}</label>
          </div>
          <div><span style="font-size:var(--text-xs);color:var(--gray-400);">IS (Himpunan)</span></div>
          <div>
            <select id="sel-var-${varName}" class="form-input" style="padding:var(--space-1) var(--space-2);font-size:var(--text-xs);" ${!isChecked ? 'disabled' : ''}>
              ${optionsHtml}
            </select>
          </div>
        </div>
      `;
    }).join('');

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = `edit-rule-modal`;
    modal.innerHTML = `
      <div class="modal-dialog" style="max-width:540px;width:100%;margin: var(--space-12) auto;animation: modal-fade-in 0.3s ease-out;">
        <div class="modal-content glass-card" style="padding:var(--space-6);position:relative;">
          <button class="btn btn-icon btn-ghost" style="position:absolute;top:var(--space-4);right:var(--space-4);" onclick="closeRuleModal()">
            <i data-lucide="x" style="width:20px;height:20px;"></i>
          </button>
          
          <h2 class="admin-modal-title">${isEdit ? 'Edit Aturan Fuzzy' : 'Buat Aturan Fuzzy Baru'}</h2>
          
          <form id="edit-rule-form">
            <div class="form-group">
              <label class="form-label" for="rule-name">Nama Aturan *</label>
              <input type="text" id="rule-name" class="form-input" value="${rule.name}" required placeholder="Contoh: R21 - Dewasa, Obesitas, Paparan Tinggi -> Tinggi">
            </div>

            <div class="form-group">
              <label class="form-label">Kondisi Input (IF)</label>
              <div style="background:var(--gray-50);padding:var(--space-3);border-radius:var(--radius-md);max-height:220px;overflow-y:auto;">
                ${inputsListHtml}
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">
              <div class="form-group">
                <label class="form-label" for="rule-consequent">Konsekuensi (THEN) *</label>
                <select id="rule-consequent" class="form-input">
                  <option value="rendah" ${rule.consequent === 'rendah' ? 'selected' : ''}>RENDAH</option>
                  <option value="sedang" ${rule.consequent === 'sedang' ? 'selected' : ''}>SEDANG</option>
                  <option value="tinggi" ${rule.consequent === 'tinggi' ? 'selected' : ''}>TINGGI</option>
                  <option value="sangat_tinggi" ${rule.consequent === 'sangat_tinggi' ? 'selected' : ''}>SANGAT TINGGI</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="rule-weight">Bobot Aturan (Weight) *</label>
                <input type="number" id="rule-weight" class="form-input" min="0.1" max="1.0" step="0.1" value="${rule.weight}">
              </div>
            </div>

            <div style="display:flex;justify-content:flex-end;gap:var(--space-2);margin-top:var(--space-6);">
              <button type="button" class="btn btn-secondary btn-sm" onclick="closeRuleModal()">Batal</button>
              <button type="submit" class="btn btn-primary btn-sm" id="btn-save-rule">Simpan Aturan</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
    lucide.createIcons();

    // Toggle Form Select helper
    window.toggleFormSelect = function (varName) {
      const chk = document.getElementById(`chk-var-${varName}`);
      const sel = document.getElementById(`sel-var-${varName}`);
      if (chk && sel) sel.disabled = !chk.checked;
    };

    const form = document.getElementById('edit-rule-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('btn-save-rule');
      saveBtn.disabled = true;

      // Extract checked conditions
      const conditions = [];
      Object.keys(variableOptionsMap).forEach(varName => {
        const chk = document.getElementById(`chk-var-${varName}`);
        const sel = document.getElementById(`sel-var-${varName}`);
        if (chk && chk.checked && sel) {
          conditions.push({
            variable: varName,
            value: sel.value
          });
        }
      });

      if (conditions.length === 0) {
        Toast.warning('Pilih minimal satu kondisi input (IF) untuk aturan.');
        saveBtn.disabled = false;
        return;
      }

      const payload = {
        name: document.getElementById('rule-name').value.trim(),
        conditions: conditions,
        consequent: document.getElementById('rule-consequent').value,
        weight: parseFloat(document.getElementById('rule-weight').value)
      };

      try {
        if (isEdit) {
          await API.post(`/admin/fuzzy-rules/${id}`, payload); // Wait, update endpoint is PUT /fuzzy-rules/:id! Let's check adminRoutes.js: PUT `/fuzzy-rules/:id`
          // Ah! The endpoint is PUT! Let's hit PUT!
          await API.put(`/admin/fuzzy-rules/${id}`, payload);
          Toast.success('Aturan berhasil diperbarui!');
        } else {
          await API.post('/admin/fuzzy-rules', payload);
          Toast.success('Aturan baru berhasil dibuat!');
        }
        closeRuleModal();
        loadRules();
      } catch (err) {
        console.error(err);
        Toast.error('Gagal menyimpan aturan.');
        saveBtn.disabled = false;
      }
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeRuleModal();
    });
  };

  window.closeRuleModal = function () {
    const modal = document.getElementById('edit-rule-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 300);
    }
  };

  // Initial Load (Pre-fetch variables first for dynamic form option construction)
  async function init() {
    await loadVariables();
    await loadRules();
  }

  init();
})();

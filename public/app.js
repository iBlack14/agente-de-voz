/**
 * Dashboard Asistente IA — Via Comunicativa
 * Refactored for Google Stitch Premium UI
 */
const initDashboardApp = () => {
  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  const formatDuration = (sec) => {
    if (sec == null || isNaN(sec)) return '—';
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' + s : s}s`;
  };

  // Mensajes predefinidos para recordatorios
  let reminderTemplates = {
    uso_correos: {
      greeting: "",
      text: "Buenas () Estimado cliente,\n\npara garantizar un uso correcto de sus correos corporativos, les recomendamos descargar periodicamente toda su informacion importante a sus computadoras. Esta accion preventiva es vital para evitar perdidas de datos ante cualquier fallo inesperado en los backups. Atentamente, VIA COMUNICATIVA, 'Publicidad que marca tu exito'."
    },
    informacion_pendientes: {
      greeting: "",
      text: "Estimado cliente,\n\nestamos en la etapa final del proyecto de su desarrollo web ... Para culminar exitosamente el proyecto, solicitamos amablemente el envio de la informacion pendiente. Puede comunicarse directamente con el area de soporte de VIA COMUNICATIVA a los numeros 936613758 o 924461828. Esperamos su pronta respuesta para culminar el servicio exitosamente. Estamos listos para lanzar su proyecto al mercado hoy mismo. Quedamos atentos."
    },
    llamada_ofertas: {
      greeting: "",
      text: "Estimado cliente,\n\nimpulsa tu empresa aumentando la rentabilidad y utilidades con nuestras paginas web profesionales, reestructuraciones y sistemas ERP empresariales. Te entregamos soluciones tecnologicas de excelencia, disenadas para automatizar procesos y escalar tus ventas rapidamente, manteniendo una inversion accesible. Moderniza tu presencia digital y asegura resultados comerciales. Somos VIA COMUNICATIVA - Agencia de Marketing y Publicidad. Puedes comunicarte al: 936613758."
    },
    respuesta_cotizacion: {
      greeting: "",
      text: "Buenos Dias, Estimado cliente,\n\nle enviamos una cotizacion para el desarrollo de su servicio web, esperamos su verificacion tecnica y estamos atentos a una respuesta sobre el servicio. Nos contactaremos a la brevedad desde el numero principal de nuestra empresa. 936613758. VIA COMUNICATIVA, 'Publicidad que marca tu exito'."
    },
    renovacion_servicios: {
      greeting: "",
      text: "Buenas () Estimado Clientes, somos de la Agencia de Publicidad VIA COMUNICATIVA. Tenemos a cargo su servicio web dominio... Esta proximo a vencer, se le recomienda realizar el pago por renovacion de s/.250.00 al haber cumplido ya un ano con nosotros, evitar cortes e interrupciones y pagos por reposicion de servicio. Quedamos Atentos."
    },
    actualizacion_datos: {
      greeting: "",
      text: "Somos la agencia de marketing y publicidad. Via Comunicativa,  Como parte de una mejora continua, estamos realizando actualizaciones y optimizaciones en su sitio web ......, sin costo alguno, incluyendo ajustes visuales, contenido y estructura. Para adjuntar cambios o enviar solicitudes de modificacion, pueden comunicarse directamente al numero: 924461828 Quedamos atentos a sus indicaciones. Saludos cordiales."
    },
    mensaje_personalizado: { greeting: "", text: "" }
  };

  // ─── Custom UI Overrides ──────────────────────────────
  window.appAlert = function(msg, isError = false) {
      const modal = document.getElementById('custom-alert-modal');
      const content = document.getElementById('custom-alert-content');
      document.getElementById('custom-alert-text').innerHTML = escapeHtml(msg);
      
      const icon = document.getElementById('custom-alert-icon');
      if (isError) {
          icon.textContent = 'error';
          icon.className = 'material-symbols-outlined text-error text-3xl';
          icon.parentElement.className = 'w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4';
      } else {
          icon.textContent = 'check_circle';
          icon.className = 'material-symbols-outlined text-primary text-3xl';
          icon.parentElement.className = 'w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4';
      }
      
      modal.classList.add('visible');
      setTimeout(() => content.style.transform = 'scale(1)', 10);
      
      return new Promise(resolve => {
          const btn = document.getElementById('custom-alert-btn');
          const close = () => {
              content.style.transform = 'scale(0.95)';
              modal.classList.remove('visible');
              btn.removeEventListener('click', close);
              resolve();
          };
          btn.addEventListener('click', close);
      });
  };

  window.appPrompt = function(msg, placeholder = 'Escribe aquí...') {
      const modal = document.getElementById('custom-prompt-modal');
      const content = document.getElementById('custom-prompt-content');
      const input = document.getElementById('custom-prompt-input');
      const form = document.getElementById('custom-prompt-form');
      const cancelBtn = document.getElementById('custom-prompt-cancel');
      
      document.getElementById('custom-prompt-text').textContent = msg;
      input.placeholder = placeholder;
      input.value = '';
      
      modal.classList.add('visible');
      setTimeout(() => {
          content.style.transform = 'scale(1)';
          input.focus();
      }, 10);
      
      return new Promise(resolve => {
          const cleanup = () => {
              content.style.transform = 'scale(0.95)';
              modal.classList.remove('visible');
              form.removeEventListener('submit', onSubmit);
              cancelBtn.removeEventListener('click', onCancel);
          };
          
          const onSubmit = (e) => {
              e.preventDefault();
              cleanup();
              resolve(input.value.trim());
          };
          
          const onCancel = () => {
              cleanup();
              resolve(null);
          };
          
          form.addEventListener('submit', onSubmit);
          cancelBtn.addEventListener('click', onCancel);
      });
  };

  window.appConfirm = function(msg, options = {}) {
      const modal = document.getElementById('custom-confirm-modal');
      const content = document.getElementById('custom-confirm-content');
      const title = document.getElementById('custom-confirm-title');
      const text = document.getElementById('custom-confirm-text');
      const cancelBtn = document.getElementById('custom-confirm-cancel');
      const confirmBtn = document.getElementById('custom-confirm-submit');

      title.textContent = options.title || 'Confirmación';
      text.textContent = msg;
      cancelBtn.textContent = options.cancelText || 'Cancelar';
      confirmBtn.textContent = options.confirmText || 'Confirmar';

      modal.classList.add('visible');
      setTimeout(() => {
          content.style.transform = 'scale(1)';
          confirmBtn.focus();
      }, 10);

      return new Promise(resolve => {
          const cleanup = () => {
              content.style.transform = 'scale(0.95)';
              modal.classList.remove('visible');
              cancelBtn.removeEventListener('click', onCancel);
              confirmBtn.removeEventListener('click', onConfirm);
              modal.removeEventListener('click', onBackdrop);
          };

          const onCancel = () => {
              cleanup();
              resolve(false);
          };

          const onConfirm = () => {
              cleanup();
              resolve(true);
          };

          const onBackdrop = (e) => {
              if (e.target === modal) onCancel();
          };

          cancelBtn.addEventListener('click', onCancel);
          confirmBtn.addEventListener('click', onConfirm);
          modal.addEventListener('click', onBackdrop);
      });
  };

  window.appSchedule = function(options = {}) {
      const modal = document.getElementById('custom-schedule-modal');
      const content = document.getElementById('custom-schedule-content');
      const text = document.getElementById('custom-schedule-text');
      const intervalSelect = document.getElementById('custom-schedule-interval');
      const countSelect = document.getElementById('custom-schedule-count');
      const summary = document.getElementById('custom-schedule-summary');
      const cancelBtn = document.getElementById('custom-schedule-cancel');
      const confirmBtn = document.getElementById('custom-schedule-submit');

      text.textContent = options.message || 'Define cada cuánto y cuántas veces se ejecutará este lote.';
      intervalSelect.value = String(options.intervalHours || 2);
      countSelect.value = String(options.repeatCount || 1);

      const refreshSummary = () => {
          const intervalHours = parseInt(intervalSelect.value || '2', 10);
          const repeatCount = parseInt(countSelect.value || '1', 10);
          summary.textContent = `Se programará ${repeatCount} ${repeatCount === 1 ? 'vez' : 'veces'}, cada ${intervalHours} hora${intervalHours === 1 ? '' : 's'}.`;
      };
      refreshSummary();

      modal.classList.add('visible');
      setTimeout(() => {
          initPremiumSelects();
          content.style.transform = 'scale(1)';
          intervalSelect.focus();
      }, 10);

      return new Promise(resolve => {
          const cleanup = () => {
              content.style.transform = 'scale(0.95)';
              modal.classList.remove('visible');
              cancelBtn.removeEventListener('click', onCancel);
              confirmBtn.removeEventListener('click', onConfirm);
              modal.removeEventListener('click', onBackdrop);
              intervalSelect.removeEventListener('change', refreshSummary);
              countSelect.removeEventListener('change', refreshSummary);
          };

          const onCancel = () => {
              cleanup();
              resolve(null);
          };

          const onConfirm = () => {
              cleanup();
              resolve({
                  intervalHours: parseInt(intervalSelect.value || '2', 10),
                  repeatCount: parseInt(countSelect.value || '1', 10)
              });
          };

          const onBackdrop = (e) => {
              if (e.target === modal) onCancel();
          };

          cancelBtn.addEventListener('click', onCancel);
          confirmBtn.addEventListener('click', onConfirm);
          modal.addEventListener('click', onBackdrop);
          intervalSelect.addEventListener('change', refreshSummary);
          countSelect.addEventListener('change', refreshSummary);
      });
  };

  // ─── Tabs Navigation ──────────────────────────────
  const sidebarNav = document.getElementById('sidebar-nav');
  const pageTitle = document.getElementById('page-title');
  const tabTitles = { 
    campaigns: 'Campañas de Voz', 
    updates: 'Gestión de Renovaciones',
    prompts: 'Identidad del Agente', 
    reminders: 'Gestión de Recordatorios',
    history: 'Historial de Transmisiones',
    retrybook: 'Control de Reintentos',
    stats: 'Consumo Neural',
    monitor: 'Monitor en Vivo'
  };

  function switchTab(tabId) {
    const navItems = document.querySelectorAll('.nav-item');
    const tabs = document.querySelectorAll('.tab-content');
    
    console.log(`[ViaAI] Switching to tab: ${tabId}`);

    navItems.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === tabId) btn.classList.add('active');
    });

    tabs.forEach(tab => {
      tab.classList.remove('active');
      if (tab.id === `tab-${tabId}`) tab.classList.add('active');
    });
    
    if (pageTitle) pageTitle.textContent = tabTitles[tabId] || 'Neural Dashboard';
    
    // Trigger data loading
    if (tabId === 'history') loadCallHistory();
    if (tabId === 'updates') loadUpdates();
    if (tabId === 'retrybook') loadCallHistory();
    if (tabId === 'stats') updateConsumptionOverview();
    if (tabId === 'monitor') typeof loadActiveCalls === 'function' && loadActiveCalls();

    // Refresh custom selects for the new active tab
    setTimeout(initPremiumSelects, 50);
  }

  // Delegated listener for sidebar navigation
  if (sidebarNav) {
    sidebarNav.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-item');
      if (btn && btn.dataset.tab) {
        switchTab(btn.dataset.tab);
      }
    });
  }

  // ─── Logout Premium UI ─────────────────────────────
  const logoutBtn = document.getElementById('logout-btn');
  const logoutModal = document.getElementById('logout-confirm-modal');
  const logoutConfirm = document.getElementById('logout-confirm-btn');
  const logoutCancel = document.getElementById('logout-cancel');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (logoutModal) logoutModal.classList.add('visible');
    });
  }
  if (logoutCancel) {
    logoutCancel.addEventListener('click', () => {
        if (logoutModal) logoutModal.classList.remove('visible');
    });
  }
  if (logoutModal) {
    logoutModal.addEventListener('click', (e) => { 
      if (e.target === logoutModal) logoutModal.classList.remove('visible'); 
    });
  }
  if (logoutConfirm) {
    logoutConfirm.addEventListener('click', async () => {
      logoutConfirm.textContent = '...';
      await fetch('/api/logout', { method: 'POST' });
      window.location.replace('/login');
    });
  }

  // ─── Clock ────────────────────────────────────────
  const clockEl = document.getElementById('clock');
  if (clockEl) {
    const updateClock = () => {
      const d = new Date();
      clockEl.textContent = d.toLocaleString('es-ES', {
        weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
      }).replace('.', '');
    };
    updateClock();
    setInterval(updateClock, 1000 * 60);
  }

  // ─── Campaign Logic ───────────────────────────────
  const form = document.getElementById('campaign-form');
  const numberInput = document.getElementById('phone-numbers');
  const domainInput = document.getElementById('domain-names');
  const clearBtn = document.getElementById('clear-btn');
  const startBtn = document.getElementById('start-btn');
  const callList = document.getElementById('call-list');
  const emptyState = document.getElementById('empty-state');

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const createBatchMeta = (prefix, total) => {
    const stamp = Date.now();
    const hhmm = new Date(stamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const shortId = stamp.toString().slice(-4);
    
    // Premium naming
    let premiumLabel = '';
    if (prefix.toLowerCase().includes('recordatorio')) {
        premiumLabel = `Campaña Automática [Vol. ${total}] | ID-${shortId}`;
    } else {
        premiumLabel = `${prefix} [Vol. ${total}] | ID-${shortId}`;
    }

    return {
      batchId: `batch-${shortId}-${stamp}`,
      batchLabel: premiumLabel
    };
  };

  clearBtn.addEventListener('click', () => {
    numberInput.value = '';
    if (domainInput) domainInput.value = '';
    callList.innerHTML = '';
    emptyState.style.display = 'flex';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawNumbers = numberInput.value;
    const rawDomains = domainInput ? domainInput.value : '';
    
    const linesNumbers = rawNumbers.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const linesDomains = rawDomains.split('\n').map(l => l.trim());
    
    const entries = [];
    linesNumbers.forEach((line, index) => {
      const num = line.replace(/[^0-9+]/g, '');
      if (num.length >= 8) {
        const dom = (linesDomains[index] || '').trim();
        entries.push({ number: num, domain: dom });
      }
    });

    if (!entries.length) return;
    const campaignBatch = createBatchMeta('Campaña', entries.length);

    startBtn.disabled = true;
    startBtn.textContent = 'PROCESANDO...';
    emptyState.style.display = 'none';

    for (const entry of entries) {
      const li = document.createElement('li');
      li.className = 'px-5 py-4 rounded-xl bg-surface-container-highest/30 border border-outline-variant/10 flex justify-between items-center animate-pulse';
      li.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-primary text-sm">contact_phone</span>
          <span class="text-xs font-bold font-label tracking-widest text-on-surface">${entry.number}${entry.domain ? ' · ' + escapeHtml(entry.domain) : ''}</span>
        </div>
        <span class="call-status text-[9px] uppercase tracking-widest font-bold text-primary/60">Llamando...</span>
      `;
      callList.prepend(li);

      try {
        const resp = await fetch('/api/make-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: entry.number,
            domain: entry.domain,
            mode: 'identity', // Ensure mode is explicitly set
            batch_id: campaignBatch.batchId,
            batch_label: campaignBatch.batchLabel
          })
        });
        const data = await resp.json();
        const statusEl = li.querySelector('.call-status');
        li.classList.remove('animate-pulse');
        
        if (resp.ok && data.success) {
          statusEl.className = 'call-status text-[9px] uppercase tracking-widest font-bold text-green-400';
          statusEl.textContent = 'EN CURSO';
          li.dataset.number = entry.number;
        } else {
          statusEl.className = 'call-status text-[9px] uppercase tracking-widest font-bold text-red-500';
          statusEl.textContent = data.message || data.error || 'ERROR';
        }
      } catch {
        li.classList.remove('animate-pulse');
        li.querySelector('.call-status').className = 'call-status text-[9px] uppercase tracking-widest font-bold text-red-500';
        li.querySelector('.call-status').textContent = 'FALLO RED';
      }
      await sleep(2500);
    }

    startBtn.disabled = false;
    startBtn.textContent = 'INICIAR CAMPAÑA';
  });

  // ─── Auto-Polling de Estados (Actualización Mágica) ────────
  setInterval(async () => {
    try {
      const liveData = await (await fetch('/api/calls')).json();
      
      // Actualizar número en vivo en la pestaña Campañas
      const campaignItems = document.querySelectorAll('#call-list li');
      campaignItems.forEach(li => {
        const num = li.dataset.number;
        const statusEl = li.querySelector('.call-status');
        if (num && statusEl && statusEl.textContent === 'EN CURSO') {
          const callMatch = liveData.find(c => (c.to === num || c.from === num));
          if (callMatch && (callMatch.status === 'completed' || callMatch.status === 'ws_close' || callMatch.status === 'stop_event')) {
             statusEl.className = 'call-status text-[9px] uppercase tracking-widest font-bold text-blue-400';
             statusEl.textContent = 'FINALIZADA';
          }
        }
      });

      // Actualizar UI del historial y estadísticas
      updateStats(liveData);
      if (document.getElementById('tab-history').classList.contains('active') || document.getElementById('tab-retrybook').classList.contains('active')) {
         loadCallHistory(liveData); 
      }
      if (document.getElementById('tab-stats').classList.contains('active')) {
         updateConsumptionOverview();
      }

    } catch (e) {}
  }, 2500);

  async function updateConsumptionOverview() {
    try {
      const resp = await fetch('/api/stats');
      const data = await resp.json();
      
      const groqTokens = data.usage.filter(u => u.service === 'groq').reduce((acc, u) => acc + parseFloat(u.total), 0);
      const ttsChars = data.usage.filter(u => u.service === 'elevenlabs').reduce((acc, u) => acc + parseFloat(u.total), 0);
      const sttSecs = data.usage.filter(u => u.service === 'deepgram').reduce((acc, u) => acc + parseFloat(u.total), 0);
      
      const elGroq = document.getElementById('usage-groq-tokens');
      const elTTS = document.getElementById('usage-tts-chars');
      const elSTT = document.getElementById('usage-stt-minutes');
      const elTelnyx = document.getElementById('usage-telnyx-seconds');

      if (elGroq) elGroq.textContent = groqTokens.toLocaleString();
      if (elTTS) elTTS.textContent = ttsChars.toLocaleString();
      if (elSTT) elSTT.textContent = (sttSecs / 60).toFixed(2);
      if (elTelnyx) elTelnyx.textContent = (data.telnyx_seconds || 0).toLocaleString();
    } catch (e) {}
  }

  function updateStats(data) {
    const total = data.length;
    const ok = data.filter(c => c.status === 'completed' || c.status === 'ws_close' || c.status === 'stop_event').length;
    const active = data.filter(c => c.status === 'active').length;
    const minutes = Math.round(data.reduce((acc, c) => acc + (c.durationSec || 0), 0) / 60);

    const elTotal = document.getElementById('stat-total-calls');
    const elMin = document.getElementById('stat-total-minutes');
    const elRate = document.getElementById('stat-success-rate');
    const elAct = document.getElementById('stat-active');

    if (elTotal) elTotal.textContent = total;
    if (elMin) elMin.textContent = minutes + 'm';
    if (elRate) elRate.textContent = total > 0 ? Math.round((ok/total)*100) + '%' : '0%';
    if (elAct) {
      elAct.textContent = active;
      elAct.className = `text-3xl font-headline font-bold ${active > 0 ? 'text-green-400 animate-pulse' : 'text-on-surface opacity-30'}`;
    }
  }

  // ─── Prompt Manager ───────────────────────────────
  const promptSelect = document.getElementById('prompt-select');
  const greetingInput = document.getElementById('prompt-greeting');
  const textInput = document.getElementById('prompt-text');
  const savePromptBtn = document.getElementById('save-prompt-btn');
  const newPromptBtn = document.getElementById('new-prompt-btn');
  const voiceIdInput = document.getElementById('voice-id-input');
  const voiceModelInput = document.getElementById('voice-model-input');
  const voiceSpeedInput = document.getElementById('voice-speed-input');
  const voiceSpeedValue = document.getElementById('voice-speed-value');
  const voiceStabilityInput = document.getElementById('voice-stability-input');
  const voiceStabilityValue = document.getElementById('voice-stability-value');
  const voiceSimilarityInput = document.getElementById('voice-similarity-input');
  const voiceSimilarityValue = document.getElementById('voice-similarity-value');
  const voiceStyleInput = document.getElementById('voice-style-input');
  const voiceStyleValue = document.getElementById('voice-style-value');
  const voiceLatencyInput = document.getElementById('voice-latency-input');
  const voiceNormalizationInput = document.getElementById('voice-normalization-input');
  const voiceSpeakerBoostInput = document.getElementById('voice-speaker-boost-input');
  const saveVoiceSettingsBtn = document.getElementById('save-voice-settings-btn');
  const previewVoiceSettingsBtn = document.getElementById('preview-voice-settings-btn');
  const voicePreviewText = document.getElementById('voice-preview-text');

  let currentPrompts = [];
  let activeId = null;

  let currentReminderPrompts = [];
  let activeReminderId = null;
  let currentVoiceSettings = null;

  function bindVoiceRange(input, output, formatter = (value) => value) {
    if (!input || !output) return;
    const render = () => { output.textContent = formatter(input.value); };
    input.addEventListener('input', render);
    render();
  }

  bindVoiceRange(voiceSpeedInput, voiceSpeedValue, value => `${Number(value).toFixed(2)}x`);
  bindVoiceRange(voiceStabilityInput, voiceStabilityValue, value => Number(value).toFixed(2));
  bindVoiceRange(voiceSimilarityInput, voiceSimilarityValue, value => Number(value).toFixed(2));
  bindVoiceRange(voiceStyleInput, voiceStyleValue, value => Number(value).toFixed(2));

  function fillVoiceSettingsForm(settings) {
    currentVoiceSettings = settings;
    if (voiceIdInput) voiceIdInput.value = settings.voiceId || '';
    if (voiceModelInput) voiceModelInput.value = settings.modelId || '';
    if (voiceSpeedInput) {
      voiceSpeedInput.value = settings.speed ?? 1;
      voiceSpeedInput.dispatchEvent(new Event('input'));
    }
    if (voiceStabilityInput) {
      voiceStabilityInput.value = settings.stability ?? 0.5;
      voiceStabilityInput.dispatchEvent(new Event('input'));
    }
    if (voiceSimilarityInput) {
      voiceSimilarityInput.value = settings.similarityBoost ?? 0.8;
      voiceSimilarityInput.dispatchEvent(new Event('input'));
    }
    if (voiceStyleInput) {
      voiceStyleInput.value = settings.style ?? 0;
      voiceStyleInput.dispatchEvent(new Event('input'));
    }
    if (voiceLatencyInput) voiceLatencyInput.value = String(settings.latencyOptimization ?? 0);
    if (voiceNormalizationInput) voiceNormalizationInput.value = settings.applyTextNormalization || 'auto';
    if (voiceSpeakerBoostInput) voiceSpeakerBoostInput.checked = settings.useSpeakerBoost !== false;
  }

  async function loadVoiceSettings() {
    try {
      const response = await fetch('/api/voice-settings');
      const data = await response.json();
      fillVoiceSettingsForm(data);
      if (voicePreviewText && !voicePreviewText.value.trim()) {
        voicePreviewText.value = 'Buenas () estimado cliente. Esta es una prueba de voz para verificar velocidad, claridad y estilo.';
      }
    } catch (e) {
      console.error('Error cargando voice settings:', e);
    }
  }

  async function loadPrompts() {
    try {
      const data = await (await fetch('/api/prompts')).json();
      currentPrompts = data.prompts;
      activeId = data.activeId;
      promptSelect.innerHTML = currentPrompts.map(p =>
        `<option value="${escapeHtml(p.id)}" ${p.id === activeId ? 'selected' : ''}>${escapeHtml(p.name.toUpperCase())}</option>`
      ).join('');
      fillPromptFields();
    } catch (e) { console.error('Error cargando prompts:', e); }

    try {
      const remData = await (await fetch('/api/reminders')).json();
      currentReminderPrompts = remData.prompts;
      activeReminderId = remData.activeId;
      const tmplSelect = document.getElementById('reminder-message-template');
      if (tmplSelect) {
          const options = currentReminderPrompts.map(p =>
            `<option value="${p.id}">${escapeHtml(p.name.toUpperCase())}</option>`
          ).join('');
          let oldVal = tmplSelect.value;
          tmplSelect.innerHTML = '<option value="">-- SELECCIONAR PLANTILLA --</option>' + options + '<option value="mensaje_personalizado">MENSAJE PERSONALIZADO</option>';
          tmplSelect.value = oldVal || activeReminderId || "mensaje_personalizado";
          // Actualizar caché de plantillas para que coincida con DB
          reminderTemplates = currentReminderPrompts.reduce((acc, p) => { acc[p.id] = p; return acc; }, { mensaje_personalizado: { greeting: '', text: '' } });
      }
    } catch (e) { console.error('Error cargando reminders:', e); }

    await loadVoiceSettings();
  }

  function fillPromptFields() {
    const p = currentPrompts.find(p => p.id === promptSelect.value);
    if (p) { greetingInput.value = p.greeting; textInput.value = p.text; }
  }

  promptSelect.addEventListener('change', async () => {
    fillPromptFields();
    await fetch('/api/prompts/active', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: promptSelect.value })
    });
  });

  savePromptBtn.addEventListener('click', async () => {
    const p = currentPrompts.find(p => p.id === promptSelect.value);
    if (!p) return;
    savePromptBtn.textContent = 'PROCESANDO...';
    try {
      await fetch('/api/prompts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, name: p.name, greeting: greetingInput.value, text: textInput.value })
      });
      await loadPrompts();
      savePromptBtn.textContent = '✓ CAMBIOS GUARDADOS';
      setTimeout(() => savePromptBtn.textContent = 'GUARDAR CAMBIOS', 2000);
    } catch { savePromptBtn.textContent = 'ERROR'; }
  });

  saveVoiceSettingsBtn?.addEventListener('click', async () => {
    const payload = {
      voiceId: voiceIdInput?.value.trim(),
      modelId: voiceModelInput?.value.trim(),
      speed: Number(voiceSpeedInput?.value || 1),
      stability: Number(voiceStabilityInput?.value || 0.5),
      similarityBoost: Number(voiceSimilarityInput?.value || 0.8),
      style: Number(voiceStyleInput?.value || 0),
      latencyOptimization: Number(voiceLatencyInput?.value || 0),
      applyTextNormalization: voiceNormalizationInput?.value || 'auto',
      useSpeakerBoost: !!voiceSpeakerBoostInput?.checked
    };

    saveVoiceSettingsBtn.disabled = true;
    saveVoiceSettingsBtn.textContent = 'GUARDANDO...';
    try {
      const response = await fetch('/api/voice-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar la voz');
      fillVoiceSettingsForm(data.data || payload);
      appAlert('✅ Voz AI actualizada. El preview y las llamadas nuevas usarán esta configuración.');
      saveVoiceSettingsBtn.textContent = 'GUARDADO';
      setTimeout(() => {
        saveVoiceSettingsBtn.disabled = false;
        saveVoiceSettingsBtn.textContent = 'Guardar Voz';
      }, 1500);
    } catch (e) {
      console.error(e);
      appAlert(`Error al guardar voz: ${e.message}`, true);
      saveVoiceSettingsBtn.disabled = false;
      saveVoiceSettingsBtn.textContent = 'Guardar Voz';
    }
  });

  const reminderMessageTemplate = document.getElementById('reminder-message-template');
  const btnSaveReminder = document.getElementById('btn-save-reminder-msg');

  const setReminderSaveButtonMode = () => {
    if (!btnSaveReminder) return;
    const val = reminderMessageTemplate?.value;
    const isExisting = val && val !== 'mensaje_personalizado';
    const label = isExisting ? 'Actualizar' : 'Guardar';
    btnSaveReminder.innerHTML = `<span class="material-symbols-outlined text-[12px]">save</span> ${label}`;
  };

  if (reminderMessageTemplate) {
      // El evento de cambio ya se maneja en initDashboardApp, pero podemos acoplar el modo del botón aquí:
      reminderMessageTemplate.addEventListener('change', () => {
          setReminderSaveButtonMode();
          if (reminderMessageTemplate.value === 'mensaje_personalizado') {
              const draft = localStorage.getItem('via_reminder_draft');
              if (draft) document.getElementById('reminder-msg').value = draft;
          }
      });
  }

  if (btnSaveReminder) {
      btnSaveReminder.addEventListener('click', async () => {
          const greeting = '';
          const text = document.getElementById('reminder-msg').value.trim();
          if (!text) return appAlert('Debe existir al menos un mensaje antes de guardar la plantilla.', true);

          const selectedId = reminderMessageTemplate?.value || '';
          const isUpdating = selectedId && selectedId !== 'mensaje_personalizado';
          let payload;

          if (isUpdating) {
              const existing = currentReminderPrompts.find(p => p.id === selectedId);
              if (!existing) return appAlert('No se encontró el guion seleccionado para actualizar.', true);
              payload = {
                  id: existing.id,
                  name: existing.name,
                  greeting: greeting,
                  text: text
              };
          } else {
              let nameName = await appPrompt('Ingresa un título a nivel de matriz para localizar este guion AI (Ej. Promoción Renovación):', 'Promoción...');
              if (!nameName || !nameName.trim()) return;
              payload = {
                  id: Date.now().toString(),
                  name: nameName.trim(),
                  greeting: greeting,
                  text: text
              };
          }

          btnSaveReminder.innerHTML = '...';

          try {
              const res = await fetch('/api/reminders', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
              });
              
              if (!res.ok) {
                  const errorData = await res.json();
                  if (errorData.code === 'AUTH_EXPIRED') {
                      appAlert('Expiró tu sesión. Serás redirigido al login en 3 segundos...', true);
                      setTimeout(() => window.location.replace('/login'), 3000);
                      throw new Error('Sesión expirada');
                  }
                  throw new Error(errorData.error || 'Fallo interno al guardar en base de datos');
              }

              await loadPrompts();
              if (reminderMessageTemplate) {
                  reminderMessageTemplate.value = payload.id;
                  reminderMessageTemplate.dispatchEvent(new Event('change'));
              }

              // Automáticamente activarlo
              await fetch('/api/reminders/active', {
                   method: 'PUT', headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ id: payload.id })
              });
              activeReminderId = payload.id;
              setReminderSaveButtonMode();
              appAlert(isUpdating ? '✅ Guión AI actualizado en la Base de Datos.' : '✅ Guión AI almacenado magnéticamente en los registros!');
          } catch (error) {
              console.error(error);
              btnSaveReminder.innerHTML = `<span class="material-symbols-outlined text-[12px]">save</span> ${isUpdating ? 'Actualizar' : 'Guardar'}`;
              return appAlert(`Error crítico al guardar en Base de Datos: ${error.message}`, true);
          }
      });
  }

  // ─── Modal Nueva Identidad ────────────────────────
  const newIdentityModal = document.getElementById('new-identity-modal');
  const newIdentityForm = document.getElementById('new-identity-form');
  const newIdentityName = document.getElementById('new-identity-name');

  document.getElementById('identity-modal-close').addEventListener('click', () => newIdentityModal.classList.remove('visible'));
  document.getElementById('identity-modal-cancel').addEventListener('click', () => newIdentityModal.classList.remove('visible'));
  newIdentityModal.addEventListener('click', (e) => { if (e.target === newIdentityModal) newIdentityModal.classList.remove('visible'); });

  newPromptBtn.addEventListener('click', () => {
    newIdentityName.value = '';
    newIdentityModal.classList.add('visible');
    setTimeout(() => newIdentityName.focus(), 100);
  });

  newIdentityForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = newIdentityName.value.trim();
    if (!name) return;
    
    newIdentityModal.classList.remove('visible');

    const id = Date.now().toString();
    await fetch('/api/prompts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, greeting: '¡Hola! ¿En qué puedo ayudarte?', text: 'Eres un asistente experto...' })
    });
    await loadPrompts();
    promptSelect.value = id;
    promptSelect.dispatchEvent(new Event('change'));
  });

  // ─── Delete Prompt/Reminder ────────────────────────
  const deletePromptBtn = document.getElementById('delete-prompt-btn');
  if (deletePromptBtn) {
    deletePromptBtn.addEventListener('click', async () => {
      if (!promptSelect.value) return;
      if (promptSelect.value === '1') return appAlert('El nodo por defecto no puede ser eliminado del DNA.', true);
      
      const confirm = await appPrompt('Escribe "ELIMINAR" para confirmar la purga de este nodo de identidad:', 'ELIMINAR');
      if (confirm !== 'ELIMINAR') return;

      try {
        await fetch(`/api/prompts/${promptSelect.value}`, { method: 'DELETE' });
        appAlert('Nodo de identidad eliminado de la matriz.');
        await loadPrompts();
      } catch (e) { appAlert('Error al purgar nodo.', true); }
    });
  }

  const deleteReminderBtn = document.getElementById('delete-reminder-btn');
  if (deleteReminderBtn) {
    deleteReminderBtn.addEventListener('click', async () => {
      const select = document.getElementById('reminder-message-template');
      if (!select || !select.value || select.value === 'mensaje_personalizado') return appAlert('Selecciona un guion para eliminar.', true);
      
      const confirm = await appPrompt('Escribe "ELIMINAR" para confirmar la purga de este guion de recordatorio:', 'ELIMINAR');
      if (confirm !== 'ELIMINAR') return;

      try {
        await fetch(`/api/reminders/${select.value}`, { method: 'DELETE' });
        appAlert('Guion de recordatorio purgado exitosamente.');
        document.getElementById('reminder-msg').value = '';
        select.value = 'mensaje_personalizado';
        await loadPrompts();
      } catch (e) { appAlert('Error al purgar guion.', true); }
    });
  }

  const btnNewReminder = document.getElementById('btn-new-reminder');
  if (btnNewReminder) {
    btnNewReminder.addEventListener('click', () => {
      const select = document.getElementById('reminder-message-template');
      const messageTextarea = document.getElementById('reminder-msg');
      if (select) {
        select.value = 'mensaje_personalizado';
        select.dispatchEvent(new Event('change'));
      }
      if (messageTextarea) {
        messageTextarea.value = '';
        messageTextarea.focus();
      }
      setReminderSaveButtonMode();
    });
  }

  loadPrompts().then(() => {
    setReminderSaveButtonMode();
  });

  // ─── Call History ─────────────────────────────────
  const historyContainer = document.getElementById('history-container');
  const historyEmpty = document.getElementById('history-empty');
  const modal = document.getElementById('transcript-modal');
  const modalMeta = document.getElementById('modal-meta');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');
  const historyAnsweredCount = document.getElementById('history-answered-count');
  const historyUnansweredCount = document.getElementById('history-unanswered-count');
  const historyOutboundTotal = document.getElementById('history-outbound-total');
  const historyAnswerRate = document.getElementById('history-answer-rate');
  const historyTotalDuration = document.getElementById('history-total-duration');
  const historyAvgDuration = document.getElementById('history-avg-duration');
  const historyRetryBtn = document.getElementById('history-retry-all-unanswered');
  const historyBatchContainer = document.getElementById('history-batch-container');

  function initPremiumSelects() {
    const selects = document.querySelectorAll('select.form-control, .updates-month-reminder, #reminder-message-template, #prompt-select, #updates-batch-reminder, #retry-interval-select, #reminder-retry, #custom-schedule-interval, #custom-schedule-count');
    
    selects.forEach(select => {
      if (!select) return;

      // Limpieza preventiva: si ya existe un wrapper, lo quitamos para recrearlo limpio
      const existingWrapper = select.parentNode.querySelector('.custom-select-wrapper');
      if (existingWrapper && existingWrapper.nextElementSibling === select) {
        // En lugar de borrarlo cada vez (lo cual puede ser molesto), solo lo recreamos si algo cambió
        // o simplemente actualizamos el texto del trigger si ya está bien montado.
        const trigger = existingWrapper.querySelector('.custom-select-trigger');
        if (trigger) {
          trigger.textContent = select.options[select.selectedIndex]?.textContent || '-- Seleccionar --';
          return; // Ya existe y está sincronizado.
        }
      }

      select.style.display = 'none';
      select.classList.add('hidden-select');

      const wrapper = document.createElement('div');
      wrapper.className = 'custom-select-wrapper';
      
      const trigger = document.createElement('div');
      trigger.className = 'custom-select-trigger';
      trigger.textContent = select.options[select.selectedIndex]?.textContent || '-- Seleccionar --';
      
      const optionsMenu = document.createElement('div');
      optionsMenu.className = 'custom-select-options noble-scrollbar';

      const updateMenuContent = () => {
        optionsMenu.innerHTML = '';
        Array.from(select.options).forEach((opt, idx) => {
          const div = document.createElement('div');
          div.className = `custom-select-option ${opt.selected ? 'selected' : ''}`;
          div.textContent = opt.textContent;
          div.onclick = (e) => {
            e.stopPropagation();
            select.selectedIndex = idx;
            trigger.textContent = opt.textContent;
            select.dispatchEvent(new Event('change'));
            wrapper.classList.remove('open');
          };
          optionsMenu.appendChild(div);
        });
      };

      trigger.onclick = (e) => {
        e.stopPropagation();
        const isOpen = wrapper.classList.contains('open');
        document.querySelectorAll('.custom-select-wrapper').forEach(w => w.classList.remove('open'));
        if (!isOpen) {
          updateMenuContent();
          wrapper.classList.add('open');
        }
      };

      wrapper.appendChild(trigger);
      wrapper.appendChild(optionsMenu);
      select.parentNode.insertBefore(wrapper, select);

      select.addEventListener('change', () => {
        trigger.textContent = select.options[select.selectedIndex]?.textContent || '-- Seleccionar --';
      });
    });
  }

  document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select-wrapper').forEach(w => w.classList.remove('open'));
  });

  function formatToE164(raw) {
    let clean = String(raw || '').trim().replace(/[^\d+]/g, '');
    if (!clean) return '';
    // Si tiene 9 dígitos y empieza con 9 (Perú), agregar +51
    if (clean.length === 9 && clean.startsWith('9')) {
      return '+51' + clean;
    }
    // Si empieza con 51 y tiene 11 dígitos, agregar el +
    if (clean.length === 11 && clean.startsWith('51')) {
      return '+' + clean;
    }
    if (clean.startsWith('+')) return clean;
    return '+' + clean;
  }
  const historySearchInput = document.getElementById('history-search-input');
  const historyFilterSelect = document.getElementById('history-filter-select');
  const historyLastUpdate = document.getElementById('history-last-update');
  const historyResetAllBtn = document.getElementById('history-reset-all-btn');
  const historyResetConfirm = document.getElementById('history-reset-confirm');
  const retryBookRootSelect = document.getElementById('retrybook-root-select');
  const retryBookFlow = document.getElementById('retrybook-flow');
  const retryBookLastUpdate = document.getElementById('retrybook-last-update');
  const rbTotalAttempts = document.getElementById('rb-total-attempts');
  const rbTotalAnswered = document.getElementById('rb-total-answered');
  const rbTotalPending = document.getElementById('rb-total-pending');
  const rbIterationsCount = document.getElementById('rb-iterations-count');
  const rbTableBody = document.getElementById('rb-table-body');
  const rbSelectedIterTitle = document.getElementById('rb-selected-iter-title');
  const rbAnsweredList = document.getElementById('rb-answered-list');
  const rbAnsweredCount = document.getElementById('rb-answered-count');
  const rbAnsweredBadge = document.getElementById('rb-answered-badge');
  const rbUnansweredCount = document.getElementById('rb-unanswered-count');
  const rbUnansweredBadge = document.getElementById('rb-unanswered-badge');
  const rbUnansweredList = document.getElementById('rb-unanswered-list');
  const rbRetrySelectedBtn = document.getElementById('rb-retry-selected-btn');
  const rbRetrySelectedDetailBtn = document.getElementById('rb-retry-selected-detail-btn');
  const rbRetrySelectedPill = document.getElementById('rb-retry-selected-pill');
  const rbRetrySelectedCount = document.getElementById('rb-retry-selected-count');

  let callsData = [];
  let historyBatchMap = new Map();
  const historyExpandedBatches = new Set();
  const historyView = { query: '', filter: 'all' };
  let retryBookSelectedRoot = '';
  let retryBookRowsCache = [];
  let retryBookSelectedIterIndex = -1;


  function isOutboundCall(call) {
    return call?.direction === 'outbound' || call?.direction === 'outgoing';
  }

  function isCallConnected(call) {
    const connectedStatuses = new Set(['completed', 'ws_close', 'stop_event', 'terminated', 'reminder_completed', 'hangup']);
    return connectedStatuses.has(String(call?.status || '').toLowerCase());
  }

  function classifyOutboundCall(call) {
    if (!isOutboundCall(call)) return 'skip';
    const duration = parseInt(call.durationSec ?? call.duration_sec, 10) || 0;
    const turnCount = parseInt(call.turnCount ?? call.turn_count, 10) || 0;
    const transcriptTurns = Array.isArray(call.transcript) ? call.transcript.length : 0;

    if (isCallConnected(call)) {
      // Consider "answered" when there is real interaction evidence, even for short calls.
      if (duration >= 1 || turnCount > 0 || transcriptTurns > 0) return 'answered';
      return 'unanswered';
    }

    const status = String(call.status || '').toLowerCase();
    const failedStatuses = new Set(['failed', 'busy', 'no_answer', 'timeout', 'canceled', 'rejected', 'hangup_failed', 'failed_to_dial', 'voicemail']);
    if (failedStatuses.has(status)) return 'unanswered';

    return 'pending';
  }

  function getRetryTargetNumber(call) {
    const raw = String(call?.to || call?.to_number || '').trim();
    const clean = raw.replace(/[^0-9+]/g, '');
    return clean.length >= 8 ? clean : null;
  }

  function buildRetryEntries(unansweredCalls) {
    const entries = [];
    const seen = new Set();
    unansweredCalls.forEach(call => {
      const number = getRetryTargetNumber(call);
      if (!number) return;

      const entry = {
        number,
        domain: (call.domain || '').trim(),
        mode: (call.mode || '').trim() || 'reminder',
        greeting: (call.reminderGreeting || '').trim(),
        instructions: (call.reminderInstructions || '').trim()
      };

      const key = JSON.stringify(entry);
      if (seen.has(key)) return;
      seen.add(key);
      entries.push(entry);
    });
    return entries;
  }

  function renderHistorySummary() {
    const outboundCalls = callsData.filter(isOutboundCall);
    const answered = outboundCalls.filter(c => classifyOutboundCall(c) === 'answered').length;
    const unansweredCalls = outboundCalls.filter(c => classifyOutboundCall(c) === 'unanswered');
    const answeredCalls = outboundCalls.filter(c => classifyOutboundCall(c) === 'answered');
    const totalDurationSec = outboundCalls.reduce((acc, call) => acc + (parseInt(call.durationSec ?? call.duration_sec, 10) || 0), 0);
    const avgDurationSec = answeredCalls.length
      ? Math.round(answeredCalls.reduce((acc, call) => acc + (parseInt(call.durationSec ?? call.duration_sec, 10) || 0), 0) / answeredCalls.length)
      : 0;
    const answerRate = outboundCalls.length ? Math.round((answered / outboundCalls.length) * 100) : 0;

    if (historyOutboundTotal) historyOutboundTotal.textContent = String(outboundCalls.length);
    if (historyAnsweredCount) historyAnsweredCount.textContent = String(answered);
    if (historyUnansweredCount) historyUnansweredCount.textContent = String(unansweredCalls.length);
    if (historyAnswerRate) historyAnswerRate.textContent = `${answerRate}%`;
    if (historyTotalDuration) historyTotalDuration.textContent = formatDuration(totalDurationSec);
    if (historyAvgDuration) historyAvgDuration.textContent = formatDuration(avgDurationSec);
  }

  function buildHistoryBatchGroups() {
    const parentMap = new Map();
    const outboundCalls = callsData.filter(isOutboundCall);

    const normalizeBatchLabel = (rawLabel) => {
      const raw = String(rawLabel || '').trim();
      if (!raw) return '';
      // Remove common retry prefixes while preserving the root campaign name.
      return raw
        .replace(/^Reintento\s*\d*\s*[·\-|:]?\s*/i, '')
        .replace(/^Iteración:\s*Reintento\s*[|·\-:]\s*/i, '')
        .replace(/\|\s*Vol\..*$/i, '')
        .replace(/\|\s*ID-\d+.*$/i, '')
        .trim();
    };

    outboundCalls.forEach(call => {
      const bId = call.batchId || '';
      let rootId = bId;
      let iterationLabel = 'Original';
      let iterationNumber = 0;
      
      // Detact if it's a retry batch using our new naming convention
      if (bId.startsWith('retry:')) {
        const parts = bId.split(':');
        if (parts.length >= 3) {
          rootId = parts[1];
          iterationLabel = 'Reintento';
          // Format expected: retry:{root}:{iter}:{timestamp}
          // Older format fallback: retry:{root}:{timestamp}
          if (parts.length >= 4 && /^\d+$/.test(parts[2])) {
            iterationNumber = parseInt(parts[2], 10);
          } else {
            iterationNumber = null;
          }
        }
      }

      const rootKey = rootId || `legacy-${call.callId || call.startedAt}`;
      const candidateLabel = normalizeBatchLabel(call.batchLabel);
      
      if (!parentMap.has(rootKey)) {
        parentMap.set(rootKey, {
          rootKey,
          label: candidateLabel || '',
          iterations: new Map(), // Map of batchId -> iterationData
          lastStartedAt: call.startedAt || null
        });
      }
      
      const group = parentMap.get(rootKey);
      // Prefer a meaningful non-empty root label over generic/empty values.
      if (candidateLabel && (!group.label || group.label === 'Lote Sin Nombre' || bId === rootId)) {
        group.label = candidateLabel;
      }
      if (!group.iterations.has(bId)) {
        group.iterations.set(bId, {
          batchId: bId,
          label: iterationLabel,
          iterationNumber,
          calls: [],
          startedAt: call.startedAt
        });
      }
      
      const iter = group.iterations.get(bId);
      iter.calls.push(call);
      
      if (call.startedAt && (!group.lastStartedAt || new Date(call.startedAt) > new Date(group.lastStartedAt))) {
        group.lastStartedAt = call.startedAt;
      }
    });

    parentMap.forEach((group) => {
      if (!group.label) group.label = 'Lote Sin Nombre';
    });

    return Array.from(parentMap.values()).sort((a, b) => {
      const aDate = a.lastStartedAt ? new Date(a.lastStartedAt).getTime() : 0;
      const bDate = b.lastStartedAt ? new Date(b.lastStartedAt).getTime() : 0;
      return bDate - aDate;
    });
  }

  function renderHistoryBatchCards() {
    if (!historyBatchContainer) return;

    const groups = buildHistoryBatchGroups();
    historyBatchMap = new Map(groups.map(g => [g.key, g]));
    const groupKeys = new Set(groups.map(g => g.key));
    Array.from(historyExpandedBatches).forEach(key => {
      if (!groupKeys.has(key)) historyExpandedBatches.delete(key);
    });

    if (!groups.length) {
      historyBatchContainer.innerHTML = `
        <div class="col-span-full opacity-30 py-8 text-center uppercase text-[9px] font-bold tracking-widest">
          Sin lotes salientes registrados
        </div>`;
      return;
    }

    historyBatchContainer.innerHTML = groups.map((group, idx) => {
      // Sort iterations by date
      const iterations = Array.from(group.iterations.values()).sort((a, b) => {
        const aHasNum = Number.isInteger(a.iterationNumber);
        const bHasNum = Number.isInteger(b.iterationNumber);
        if (aHasNum && bHasNum) return a.iterationNumber - b.iterationNumber;
        if (aHasNum) return -1;
        if (bHasNum) return 1;
        return new Date(a.startedAt || 0) - new Date(b.startedAt || 0);
      });
      const originalIteration = iterations[0] || { calls: [] };
      const originalAnswered = originalIteration.calls.filter(c => classifyOutboundCall(c) === 'answered').length;
      const originalUnanswered = originalIteration.calls.filter(c => classifyOutboundCall(c) === 'unanswered').length;
      const baseDestinations = originalIteration.calls.length;
      const retriesCount = Math.max(0, iterations.length - 1);
      
      const startedText = group.lastStartedAt
        ? new Date(group.lastStartedAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        : '—';

      // Card shows only "Original". Full retries are shown in "Control" tab.
      const iterationBoxesHtml = `
        <div class="space-y-3">
          <div class="flex items-center gap-2">
             <span class="text-[8px] font-black uppercase tracking-widest text-slate-500">Original</span>
             <div class="h-px flex-1 bg-white/5"></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 flex flex-col items-center">
              <span class="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Contestó</span>
              <span class="text-2xl font-black text-emerald-400">${originalAnswered}</span>
            </div>
            <div class="rounded-xl border border-rose-500/10 bg-rose-500/5 p-4 flex flex-col items-center">
              <span class="text-[8px] font-bold text-rose-500 uppercase tracking-widest mb-1">No Contestó</span>
              <span class="text-2xl font-black text-rose-400">${originalUnanswered}</span>
            </div>
          </div>
        </div>
      `;

      const unansweredToRetry = iterations[iterations.length - 1].calls.filter(c => classifyOutboundCall(c) === 'unanswered');

      const detailsId = `batch-contacts-${idx}`;
      const isExpanded = historyExpandedBatches.has(group.rootKey);
      
      return `
        <article class="glass-card shadow-2xl relative overflow-hidden group h-full min-h-[340px] flex flex-col">
          <div class="flex items-start justify-between gap-4 mb-6">
            <div>
              <div class="flex items-center gap-2 mb-1.5">
                  <div class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  <p class="text-[9px] uppercase tracking-[0.2em] text-emerald-500 font-bold">Actividad de Campaña</p>
              </div>
              <h4 class="text-xl leading-tight font-black text-white tracking-tight max-w-[22ch]">${escapeHtml(group.label.replace(/\(\d+\)\s*·\s*\d{2}:\d{2}/, '').trim())}</h4>
              <p class="text-[10px] text-slate-400 mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span class="material-symbols-outlined text-[12px]">calendar_month</span> ${escapeHtml(startedText)} 
                <span class="w-1 h-1 rounded-full bg-slate-600"></span>
                <span class="material-symbols-outlined text-[12px]">groups</span> ${baseDestinations} Destinos
                <span class="w-1 h-1 rounded-full bg-slate-600"></span>
                <span class="material-symbols-outlined text-[12px]">restart_alt</span> ${retriesCount} Reintentos
              </p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shadow-lg shadow-indigo-500/10 shrink-0">
              <span class="material-symbols-outlined text-xl">campaign</span>
            </div>
          </div>

          <div class="flex-1 flex flex-col">
            <div class="mb-6 grid grid-cols-3 gap-3">
              <div class="rounded-xl border border-white/5 bg-black/20 p-3">
                <p class="text-[8px] font-bold uppercase tracking-widest text-slate-500 mb-1">Inicio</p>
                <p class="text-sm font-black text-white">${escapeHtml(startedText)}</p>
              </div>
              <div class="rounded-xl border border-white/5 bg-black/20 p-3">
                <p class="text-[8px] font-bold uppercase tracking-widest text-slate-500 mb-1">Destinos</p>
                <p class="text-sm font-black text-white">${baseDestinations}</p>
              </div>
              <div class="rounded-xl border border-white/5 bg-black/20 p-3">
                <p class="text-[8px] font-bold uppercase tracking-widest text-slate-500 mb-1">Reintentos</p>
                <p class="text-sm font-black text-white">${retriesCount}</p>
              </div>
            </div>

            ${iterationBoxesHtml}
          </div>

          <div class="mt-6 pt-5 border-t border-white/5">
            <button
                data-batch-json="${escapeHtml(JSON.stringify({ 
                   label: group.label, 
                   rootKey: group.rootKey, 
                   lastIterationKey: iterations[iterations.length - 1].batchId,
                   iterations: iterations.map((iter, iterIdx) => ({
                     batchId: iter.batchId,
                     title: iter.iterationNumber === 0
                       ? 'Original'
                       : (Number.isInteger(iter.iterationNumber) ? `Reintento ${iter.iterationNumber}` : `Reintento ${iterIdx}`),
                     answered: iter.calls.filter(c => classifyOutboundCall(c) === 'answered').length,
                     unanswered: iter.calls.filter(c => classifyOutboundCall(c) === 'unanswered').length,
                     total: iter.calls.length,
                     startedAt: iter.startedAt || null
                   })),
                   totalAnswered: iterations.reduce((acc, iter) => acc + iter.calls.filter(c => classifyOutboundCall(c) === 'answered').length, 0),
                   totalFailed: iterations.reduce((acc, iter) => acc + iter.calls.filter(c => classifyOutboundCall(c) === 'unanswered').length, 0)
                }))}"
                class="history-open-modal w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] uppercase font-black tracking-widest transition-all flex items-center justify-center gap-2 border border-white/10"
              >
                <span class="material-symbols-outlined text-[14px]">tune</span>
                ABRIR CENTRO DE CONTROL
            </button>
          </div>
        </article>`;
    }).join('');

    historyBatchContainer.querySelectorAll('.history-open-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          const rawData = btn.dataset.batchJson;
          const payload = JSON.parse(rawData);

          // Preferred UX: open the dedicated "Control de Reintentos" tab
          // and preselect the clicked lote for better analysis.
          const retryBookTab = document.getElementById('tab-retrybook');
          if (retryBookTab) {
            retryBookSelectedRoot = payload.rootKey || '';
            switchTab('retrybook');
            renderRetryBook();
            return;
          }

          const modal = document.getElementById('batch-details-modal');
          if (!modal) return appAlert('Error crítico: No se encontró el componente Modal en el HTML.', true);
          
          // Cargar Cabeceras
          document.getElementById('modal-batch-title').textContent = (payload.label || 'Lote').replace(/\(\d+\)\s*·\s*\d{2}:\d{2}/, '').trim();
          document.getElementById('modal-answered-total').textContent = payload.totalAnswered || 0;
          document.getElementById('modal-failed-total').textContent = payload.totalFailed || 0;

          const flowSummary = document.getElementById('modal-flow-summary');
          const iterationsDetail = document.getElementById('modal-iterations-detail');
          const iterationSelector = document.getElementById('modal-iteration-selector');
          
          // Procesar llamadas
          const allCalls = callsData.filter(isOutboundCall);
          const familyCalls = allCalls.filter(c => c.batchId && (c.batchId === payload.rootKey || c.batchId.includes(`:${payload.rootKey}:`)));
          
          // Para los fallidos, solo queremos los pendientes de la ULTIMA iteración
          const lastIterationCalls = allCalls.filter(c => c.batchId === payload.lastIterationKey);
          const unansweredToRetry = lastIterationCalls.filter(c => classifyOutboundCall(c) === 'unanswered');

          const iterationMeta = Array.isArray(payload.iterations) ? payload.iterations : [];
          if (flowSummary) {
            const initial = iterationMeta[0] || null;
            const retryAnswered = iterationMeta.slice(1).reduce((acc, it) => acc + (it.answered || 0), 0);
            const totalAnswered = iterationMeta.reduce((acc, it) => acc + (it.answered || 0), 0);
            if (initial) {
              flowSummary.textContent = `${initial.total} llamados iniciales -> ${initial.answered} contestaron | Reintentos: +${retryAnswered} contestaron | Total final: ${totalAnswered}`;
            } else {
              flowSummary.textContent = `Total campaña: ${familyCalls.length} llamados | Contestaron: ${payload.totalAnswered || 0} | Fallidos: ${payload.totalFailed || 0}`;
            }
          }

          if (iterationsDetail) {
            iterationsDetail.innerHTML = iterationMeta.map((it) => {
              const stamp = it.startedAt
                ? new Date(it.startedAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                : '—';
              return `
                <div class="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                  <div class="flex items-center justify-between">
                    <p class="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">${escapeHtml(it.title || 'Iteración')}</p>
                    <p class="text-[10px] text-slate-500 font-bold">${escapeHtml(stamp)}</p>
                  </div>
                  <div class="grid grid-cols-3 gap-2 text-center">
                    <div class="rounded-xl bg-slate-900/60 border border-white/10 p-2">
                      <p class="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Total</p>
                      <p class="text-lg font-black text-white">${it.total || 0}</p>
                    </div>
                    <div class="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2">
                      <p class="text-[8px] uppercase tracking-widest text-emerald-500 font-bold">Contestó</p>
                      <p class="text-lg font-black text-emerald-400">${it.answered || 0}</p>
                    </div>
                    <div class="rounded-xl bg-rose-500/10 border border-rose-500/20 p-2">
                      <p class="text-[8px] uppercase tracking-widest text-rose-500 font-bold">No Contestó</p>
                      <p class="text-lg font-black text-rose-400">${it.unanswered || 0}</p>
                    </div>
                  </div>
                </div>
              `;
            }).join('') || '<p class="text-zinc-500 text-xs italic">Sin iteraciones detectadas.</p>';
          }

          // Construir listas HTML
          const listAnswered = document.getElementById('modal-list-answered');
          const listFailed = document.getElementById('modal-list-failed');

          const formatDomain = (c) => {
            const domain = String(c.domain || '').trim();
            return domain ? `Dominio: ${escapeHtml(domain)}` : 'Sin dominio';
          };

          const renderCallLists = (batchIdFilter = null) => {
            const scoped = batchIdFilter
              ? familyCalls.filter(c => c.batchId === batchIdFilter)
              : familyCalls;

            const answeredScoped = scoped.filter(c => classifyOutboundCall(c) === 'answered');
            const failedScoped = scoped.filter(c => classifyOutboundCall(c) === 'unanswered');

            listAnswered.innerHTML = answeredScoped.map(c => `
              <div class="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-emerald-500/10">
                  <div>
                      <p class="text-xs font-black text-white">${c.to || 'Desconocido'}</p>
                      <p class="text-[10px] text-emerald-500/80 mt-1">${c.durationSec ? c.durationSec + 's en línea' : 'Contactado'}</p>
                      <p class="text-[10px] text-slate-500 mt-1">${formatDomain(c)}</p>
                  </div>
                  <span class="material-symbols-outlined text-emerald-400">task_alt</span>
              </div>
            `).join('') || '<p class="text-zinc-500 text-xs italic">Sin contactos exitosos en la iteración seleccionada.</p>';

            listFailed.innerHTML = failedScoped.map(c => `
              <div class="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-rose-500/10">
                  <div>
                      <p class="text-xs font-black text-white">${c.to || 'Desconocido'}</p>
                      <p class="text-[10px] text-rose-500/80 mt-1">${c.status === 'failed' ? 'Telecom. Offline' : 'No Respondió'}</p>
                      <p class="text-[10px] text-slate-500 mt-1">${formatDomain(c)}</p>
                  </div>
                  <span class="material-symbols-outlined text-rose-400">error</span>
              </div>
            `).join('') || '<p class="text-zinc-500 text-xs italic">Sin fallidos en la iteración seleccionada.</p>';
          };

          const selectorButtons = [];
          if (iterationSelector) {
            const selectorData = [{ label: 'Todos', batchId: null }, ...iterationMeta.map(it => ({ label: it.title || 'Iteración', batchId: it.batchId }))];
            iterationSelector.innerHTML = selectorData.map((item, idx) => `
              <button
                data-iter-batch="${item.batchId || '__all__'}"
                class="modal-iter-chip px-3 py-2 rounded-xl border text-[10px] uppercase tracking-widest font-black transition-all ${idx === 0 ? 'border-indigo-400/50 text-indigo-300 bg-indigo-500/10' : 'border-white/10 text-zinc-400 hover:text-white hover:border-white/20'}"
              >
                ${escapeHtml(item.label)}
              </button>
            `).join('');
            selectorButtons.push(...iterationSelector.querySelectorAll('.modal-iter-chip'));
          }

          let selectedIterationBatchId = null;
          const activateSelector = (batchIdFilter = null) => {
            selectedIterationBatchId = batchIdFilter;
            selectorButtons.forEach(btn => {
              const isActive = (btn.dataset.iterBatch === '__all__' && batchIdFilter == null) || btn.dataset.iterBatch === String(batchIdFilter);
              btn.classList.toggle('border-indigo-400/50', isActive);
              btn.classList.toggle('text-indigo-300', isActive);
              btn.classList.toggle('bg-indigo-500/10', isActive);
              btn.classList.toggle('border-white/10', !isActive);
              btn.classList.toggle('text-zinc-400', !isActive);
            });
            renderCallLists(batchIdFilter);
          };

          selectorButtons.forEach(btn => {
            btn.onclick = () => {
              const raw = btn.dataset.iterBatch;
              activateSelector(raw === '__all__' ? null : raw);
            };
          });
          activateSelector(null);

          // TABS Logic
          const btnF = document.getElementById('tab-btn-failed');
          const btnA = document.getElementById('tab-btn-answered');
          btnF.onclick = () => { listFailed.classList.remove('hidden'); listAnswered.classList.add('hidden'); btnF.classList.replace('border-transparent', 'border-rose-500'); btnF.classList.replace('text-zinc-500', 'text-rose-400'); btnA.classList.replace('border-emerald-500', 'border-transparent'); btnA.classList.replace('text-emerald-400', 'text-zinc-500'); };
          btnA.onclick = () => { listAnswered.classList.remove('hidden'); listFailed.classList.add('hidden'); btnA.classList.replace('border-transparent', 'border-emerald-500'); btnA.classList.replace('text-zinc-500', 'text-emerald-400'); btnF.classList.replace('border-rose-500', 'border-transparent'); btnF.classList.replace('text-rose-400', 'text-zinc-500'); };
          btnF.onclick(); // Activar fallback por defecto

          // Footer Action Button
          const retryBtn = document.getElementById('modal-retry-btn');
          document.getElementById('modal-retry-count').textContent = unansweredToRetry.length;
          if (unansweredToRetry.length > 0) {
              retryBtn.disabled = false;
              retryBtn.classList.remove('opacity-30', 'cursor-not-allowed', 'grayscale');
              retryBtn.onclick = async () => {
                  modal.classList.remove('visible');
                  modal.classList.remove('flex');
                  modal.classList.add('hidden');
                  await retryUnansweredCalls(unansweredToRetry, retryBtn, 'Reintento', payload.rootKey);
              };
          } else {
              retryBtn.disabled = true;
              retryBtn.classList.add('opacity-30', 'cursor-not-allowed', 'grayscale');
              retryBtn.onclick = null;
          }

          // Ensure compatibility with Tailwind utility classes (`hidden`/`flex`)
          // and custom `.modal-overlay.visible` animations.
          modal.classList.remove('hidden');
          modal.classList.add('flex');
          modal.classList.add('visible');
          
        } catch (error) {
          console.error("Error procesando Modal de Centro de Control:", error);
          appAlert('Error al intentar abrir el panel: ' + error.message, true);
        }
      });
    });

    // Delegamos el listener de cierre usando la clase oficial .visible
    const modalCloser = document.getElementById('close-batch-modal');
    if (modalCloser && !modalCloser.dataset.hooked) {
        modalCloser.dataset.hooked = 'true';
        modalCloser.addEventListener('click', () => {
            const m = document.getElementById('batch-details-modal');
            m.classList.remove('visible');
            m.classList.remove('flex');
            m.classList.add('hidden');
        });
    }

    historyBatchContainer.querySelectorAll('.history-open-transcript').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const callId = btn.dataset.callId;
        if (!callId) return;
        const call = callsData.find(c => c.callId === callId);
        if (!call) return appAlert('No se encontró la conversación de esta llamada.', true);
        showTranscript(call);
      });
    });
  }

  function renderRetryBook() {
    if (!retryBookRootSelect || !rbTableBody) return;

    const groups = buildHistoryBatchGroups();
    if (!groups.length) {
      retryBookRootSelect.innerHTML = '<option value="">Sin lotes</option>';
      if (retryBookFlow) retryBookFlow.textContent = 'Sin datos de lotes para analizar.';
      if (rbTotalAttempts) rbTotalAttempts.textContent = '0';
      if (rbTotalAnswered) rbTotalAnswered.textContent = '0';
      if (rbTotalPending) rbTotalPending.textContent = '0';
      if (rbIterationsCount) rbIterationsCount.textContent = '0';
      if (rbTableBody) rbTableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-10 text-center text-xs text-slate-500">Sin iteraciones disponibles.</td></tr>';
      if (rbSelectedIterTitle) rbSelectedIterTitle.textContent = 'Selecciona una iteración';
      if (rbAnsweredCount) rbAnsweredCount.textContent = '0';
      if (rbAnsweredBadge) rbAnsweredBadge.textContent = '0';
      if (rbUnansweredCount) rbUnansweredCount.textContent = '0';
      if (rbUnansweredBadge) rbUnansweredBadge.textContent = '0';
      if (rbRetrySelectedPill) rbRetrySelectedPill.textContent = '0';
      if (rbAnsweredList) rbAnsweredList.innerHTML = '<p class="text-xs text-slate-500">Sin contestados.</p>';
      if (rbUnansweredList) rbUnansweredList.innerHTML = '<p class="text-xs text-slate-500">Sin no contestados.</p>';
      return;
    }

    const currentOptions = new Set(Array.from(retryBookRootSelect.options).map(o => o.value));
    const newOptions = groups.map(g => g.rootKey);
    const changed = newOptions.length !== currentOptions.size || newOptions.some(v => !currentOptions.has(v));
    if (changed) {
      retryBookRootSelect.innerHTML = groups.map(g => `<option value="${escapeHtml(g.rootKey)}">${escapeHtml(g.label || 'Lote')}</option>`).join('');
    }

    if (!retryBookSelectedRoot || !groups.some(g => g.rootKey === retryBookSelectedRoot)) {
      retryBookSelectedRoot = groups[0].rootKey;
    }
    retryBookRootSelect.value = retryBookSelectedRoot;

    const selected = groups.find(g => g.rootKey === retryBookSelectedRoot) || groups[0];
    if (!selected) return;

    const iterations = Array.from(selected.iterations.values()).sort((a, b) => {
      const aHasNum = Number.isInteger(a.iterationNumber);
      const bHasNum = Number.isInteger(b.iterationNumber);
      if (aHasNum && bHasNum) return a.iterationNumber - b.iterationNumber;
      if (aHasNum) return -1;
      if (bHasNum) return 1;
      return new Date(a.startedAt || 0) - new Date(b.startedAt || 0);
    });

    const rows = iterations.map((iter, idx) => {
      const total = iter.calls.length;
      const answered = iter.calls.filter(c => classifyOutboundCall(c) === 'answered').length;
      const unanswered = iter.calls.filter(c => classifyOutboundCall(c) === 'unanswered').length;
      const rate = total ? Math.round((answered / total) * 100) : 0;
      const when = iter.startedAt ? new Date(iter.startedAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
      const label = iter.iterationNumber === 0 ? 'Original' : `Reintento ${Number.isInteger(iter.iterationNumber) ? iter.iterationNumber : idx}`;
      return { label, total, answered, unanswered, rate, when, calls: iter.calls, batchId: iter.batchId };
    });
    retryBookRowsCache = rows;

    const totalAttempts = rows.reduce((acc, r) => acc + r.total, 0);
    const totalAnswered = rows.reduce((acc, r) => acc + r.answered, 0);
    const finalPending = rows.length ? rows[rows.length - 1].unanswered : 0;
    const firstTotal = rows.length ? rows[0].total : 0;
    const retryAnswered = rows.slice(1).reduce((acc, r) => acc + r.answered, 0);

    if (rbTotalAttempts) rbTotalAttempts.textContent = String(totalAttempts);
    if (rbTotalAnswered) rbTotalAnswered.textContent = String(totalAnswered);
    if (rbTotalPending) rbTotalPending.textContent = String(finalPending);
    if (rbIterationsCount) rbIterationsCount.textContent = String(rows.length);
    if (retryBookFlow) retryBookFlow.textContent = `${firstTotal} base inicial -> ${rows[0]?.answered || 0} contestaron, ${rows[0]?.unanswered || 0} no | Reintentos: +${retryAnswered} contestaron | Pendientes finales: ${finalPending}`;
    if (retryBookLastUpdate) retryBookLastUpdate.textContent = `Update: ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    if (retryBookSelectedIterIndex < 0 || retryBookSelectedIterIndex >= rows.length) {
      retryBookSelectedIterIndex = rows.length ? rows.length - 1 : -1; // default: latest iteration
    }

    rbTableBody.innerHTML = rows.map((r, idx) => `
      <tr data-rb-iter-idx="${idx}" class="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors ${idx === retryBookSelectedIterIndex ? 'bg-indigo-500/10 border-l-2 border-l-primary' : ''}">
        <td class="px-6 py-3 text-xs font-black text-white">${escapeHtml(r.label)}</td>
        <td class="px-6 py-3 text-xs text-slate-200">${r.total}</td>
        <td class="px-6 py-3 text-xs text-emerald-400 font-bold">${r.answered}</td>
        <td class="px-6 py-3 text-xs text-rose-400 font-bold">${r.unanswered}</td>
        <td class="px-6 py-3 text-xs text-indigo-300 font-bold">${r.rate}%</td>
        <td class="px-6 py-3 text-[11px] text-slate-500">${escapeHtml(r.when)}</td>
      </tr>
    `).join('');

    rbTableBody.querySelectorAll('tr[data-rb-iter-idx]').forEach(tr => {
      tr.addEventListener('click', () => {
        retryBookSelectedIterIndex = parseInt(tr.dataset.rbIterIdx, 10);
        renderRetryBook();
      });
    });

    const selectedRow = rows[retryBookSelectedIterIndex];
    const answeredCalls = (selectedRow?.calls || []).filter(c => classifyOutboundCall(c) === 'answered');
    const unansweredCalls = (selectedRow?.calls || []).filter(c => classifyOutboundCall(c) === 'unanswered');
    if (rbSelectedIterTitle) {
      rbSelectedIterTitle.textContent = selectedRow
        ? `${selectedRow.label} · ${selectedRow.when}`
        : 'Selecciona una iteración';
    }
    if (rbAnsweredCount) rbAnsweredCount.textContent = String(answeredCalls.length);
    if (rbAnsweredBadge) rbAnsweredBadge.textContent = String(answeredCalls.length);
    if (rbUnansweredCount) rbUnansweredCount.textContent = String(unansweredCalls.length);
    if (rbUnansweredBadge) rbUnansweredBadge.textContent = String(unansweredCalls.length);
    if (rbRetrySelectedCount) rbRetrySelectedCount.textContent = String(unansweredCalls.length);
    if (rbRetrySelectedPill) rbRetrySelectedPill.textContent = String(unansweredCalls.length);
    if (rbAnsweredList) {
      rbAnsweredList.innerHTML = answeredCalls.length
        ? answeredCalls.map(c => `
            <div class="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-5 flex items-center justify-between gap-5">
              <div class="min-w-0">
                <p class="text-base md:text-lg font-black text-white truncate">${escapeHtml(c.to || 'Desconocido')}</p>
                <p class="text-sm md:text-base text-slate-400 mt-1 truncate">${escapeHtml(c.domain || 'Sin dominio')}</p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-xs font-bold text-emerald-400 uppercase tracking-widest">Contestó</p>
                <p class="text-sm md:text-base text-slate-300 mt-1">${escapeHtml(formatDuration(c.durationSec ?? c.duration_sec))}</p>
              </div>
            </div>
          `).join('')
        : '<p class="text-xs text-slate-500">Nadie contestó en esta iteración.</p>';
    }
    if (rbUnansweredList) {
      rbUnansweredList.innerHTML = unansweredCalls.length
        ? unansweredCalls.map(c => `
            <div class="rounded-xl border border-rose-500/20 bg-rose-500/5 px-6 py-5 flex items-center justify-between gap-5">
              <div class="min-w-0">
                <p class="text-base md:text-lg font-black text-white truncate">${escapeHtml(c.to || 'Desconocido')}</p>
                <p class="text-sm md:text-base text-slate-400 mt-1 truncate">${escapeHtml(c.domain || 'Sin dominio')}</p>
              </div>
              <span class="text-xs font-bold text-rose-400 uppercase tracking-widest">${escapeHtml(String(c.status || 'unanswered'))}</span>
            </div>
          `).join('')
        : '<p class="text-xs text-slate-500">No hay no contestados en esta iteración.</p>';
    }
    const handleRetrySelected = async (buttonRef) => {
        if (!selectedRow || unansweredCalls.length === 0) return;
        await retryUnansweredCalls(unansweredCalls, buttonRef, selectedRow.label, selected.rootKey);
    };
    if (rbRetrySelectedBtn) {
      rbRetrySelectedBtn.disabled = unansweredCalls.length === 0;
      rbRetrySelectedBtn.textContent = unansweredCalls.length > 0
        ? `Volver a Llamar (${unansweredCalls.length})`
        : 'Sin Pendientes';
      rbRetrySelectedBtn.onclick = async () => {
        await handleRetrySelected(rbRetrySelectedBtn);
      };
    }
    if (rbRetrySelectedDetailBtn) {
      rbRetrySelectedDetailBtn.disabled = unansweredCalls.length === 0;
      rbRetrySelectedDetailBtn.classList.toggle('opacity-50', unansweredCalls.length === 0);
      rbRetrySelectedDetailBtn.classList.toggle('cursor-not-allowed', unansweredCalls.length === 0);
      rbRetrySelectedDetailBtn.textContent = unansweredCalls.length > 0
        ? `Volver a Llamar a los No Contestaron (${unansweredCalls.length})`
        : 'No Hay Pendientes para Reintentar';
      rbRetrySelectedDetailBtn.onclick = async () => {
        await handleRetrySelected(rbRetrySelectedDetailBtn);
      };
    }
  }

  if (retryBookRootSelect) {
    retryBookRootSelect.addEventListener('change', () => {
      retryBookSelectedRoot = retryBookRootSelect.value;
      renderRetryBook();
    });
  }

  async function retryUnansweredCalls(unansweredCalls, buttonEl, batchLabelBase = 'Reintento', parentBatchId = null, options = {}) {
    const entries = buildRetryEntries(unansweredCalls);
    if (!entries.length) {
      appAlert('No hay llamadas no contestadas para reintentar.');
      return;
    }

    const requireConfirm = options?.requireConfirm === true;
    if (requireConfirm) {
      const previewLines = entries
        .slice(0, 8)
        .map(e => `${e.number}${e.domain ? ` | ${e.domain}` : ''}`)
        .join('\n');
      const previewSuffix = entries.length > 8 ? `\n... y ${entries.length - 8} más` : '';
      const confirmMsg = `Lista de reintento (${entries.length}):\n${previewLines}${previewSuffix}\n\nEscribe REINTENTAR para continuar:`;

      const confirmText = await appPrompt(
        confirmMsg,
        'REINTENTAR'
      );
      if (confirmText !== 'REINTENTAR') return;
    }

    if (buttonEl) {
      buttonEl.disabled = true;
      buttonEl.dataset.originalLabel = buttonEl.textContent;
      buttonEl.textContent = 'REINTENTANDO...';
    }

    // New format: retry:[parentBatchId]:[timestamp]
    const rootId = parentBatchId || unansweredCalls[0]?.batchId || `legacy-${Date.now()}`;
    const retryBatchId = `retry:${rootId}:${Date.now()}`;
    const retryBatchLabel = `Iteración: ${batchLabelBase} | Vol. ${entries.length} | ID-${Date.now().toString().slice(-4)}`;

    // Registrar el sub-lote en BD
    await fetch('/api/batches', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            id: retryBatchId,
            parent_batch_id: parentBatchId || unansweredCalls[0]?.batchId || null,
            name: retryBatchLabel,
            template_used: 'Reintento Dinámico',
            total_destinations: entries.length
        })
    }).catch(e=>console.error('Error saving retry batch state:', e));

    let ok = 0;
    let fail = 0;
    for (const entry of entries) {
      try {
        const resp = await fetch('/api/make-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: entry.number,
            domain: entry.domain || undefined,
            mode: entry.mode || 'reminder',
            greeting: entry.greeting || undefined,
            instructions: entry.instructions || undefined,
            batch_id: retryBatchId,
            batch_label: retryBatchLabel
          })
        });
        if (resp.ok) ok++;
        else fail++;
        await new Promise(r => setTimeout(r, 1200));
      } catch {
        fail++;
      }
    }

    if (buttonEl) {
      buttonEl.disabled = false;
      buttonEl.textContent = buttonEl.dataset.originalLabel || 'Reintentar';
    }

    appAlert(`Reintento completado. Exitosas: ${ok} | Fallidas: ${fail}`);
    loadCallHistory();
  }

  modalClose.addEventListener('click', () => modal.classList.remove('visible'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('visible'); });

  function showTranscript(call) {
    const dur = call.durationSec != null ? formatDuration(call.durationSec) : '—';
    const date = call.startedAt ? new Date(call.startedAt).toLocaleString('es-ES') : '—';
    const callScript = [call.reminderGreeting, call.reminderInstructions].filter(Boolean).join('\n\n').trim();
    modalMeta.innerHTML = `
      <span>📞 ${escapeHtml(call.from || '?')}</span>
      <span>→</span>
      <span>${escapeHtml(call.to || '?')}</span>
      <span class="mx-2">|</span>
      <span>${escapeHtml(date)}</span>
      <span class="mx-2">|</span>
      <span>${escapeHtml(dur)}</span>
      <span class="mx-2">|</span>
      <span>${escapeHtml(call.turnCount || 0)} turnos</span>
      ${call.recordingUrl ? `
      <span class="mx-2">|</span>
      <a href="${call.recordingUrl}" target="_blank" class="flex items-center gap-1 text-primary hover:underline">
        <span class="material-symbols-outlined text-sm">download</span> Descargar
      </a>` : ''}
    `;

    const audioPlayer = call.recordingUrl ? `
      <div class="px-10 py-6 bg-primary/5 border-b border-zinc-800/30">
          <audio controls class="w-full h-10">
              <source src="${call.recordingUrl}" type="audio/mpeg">
              Tu navegador no soporta audio.
          </audio>
      </div>` : '';

    const transcript = call.transcript || [];
    if (!transcript.length) {
      modalBody.innerHTML = callScript ? `
        <div class="space-y-4 px-2">
          <div class="text-[9px] font-black uppercase tracking-[0.3em] text-primary/70">Guion usado en la llamada</div>
          <div class="bg-primary/10 border border-primary/20 p-5 rounded-2xl text-[13px] leading-relaxed text-white whitespace-pre-wrap shadow-lg">
            ${escapeHtml(callScript)}
          </div>
        </div>` : `
        <div class="flex flex-col items-center justify-center py-20 opacity-20 text-slate-500">
          <span class="material-symbols-outlined text-6xl mb-4">chat_bubble_outline</span>
          <p class="text-[10px] font-bold uppercase tracking-[0.3em]">Sin registro de audio/texto</p>
        </div>`;
    } else {
      modalBody.innerHTML = `
        <div class="space-y-6 px-2">
          ${transcript.map(msg => {
            const isUser = msg.role === 'user';
            const label = isUser ? 'Humano' : 'ViaAI Matrix';
            const bgColor = isUser ? 'bg-slate-900 border-white/5' : 'bg-primary/10 border-primary/20';
            const labelColor = isUser ? 'text-slate-500' : 'text-primary';
            return `
              <div class="flex flex-col ${isUser ? 'items-end' : 'items-start'}">
                <span class="text-[9px] font-black uppercase tracking-widest ${labelColor} mb-2 px-1">${label}</span>
                <div class="${bgColor} border p-5 rounded-2xl text-[13px] leading-relaxed text-white max-w-[90%] shadow-lg">
                  ${escapeHtml(msg.text)}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
    
    // Inject audio player if exists
    const existingAudio = modal.querySelector('.audio-container');
    if (existingAudio) existingAudio.remove();
    if (audioPlayer) {
        const div = document.createElement('div');
        div.className = 'audio-container';
        div.innerHTML = audioPlayer;
        modal.querySelector('.glass-card').insertBefore(div, modalBody);
    }

    modal.classList.add('visible');
  }

  function getHistoryFilteredData() {
    const query = (historyView.query || '').trim().toLowerCase();
    return callsData.filter(call => {
      const cls = classifyOutboundCall(call);
      const isOut = isOutboundCall(call);
      const status = String(call.status || '').toLowerCase();

      let matchesFilter = true;
      if (historyView.filter === 'answered') matchesFilter = cls === 'answered';
      else if (historyView.filter === 'unanswered') matchesFilter = cls === 'unanswered';
      
      if (!matchesFilter) return false;

      if (!query) return true;
      const haystack = [
        call.from, call.to, call.status, call.batchLabel, call.domain
      ].map(v => String(v || '').toLowerCase()).join(' ');
      return haystack.includes(query);
    });
  }

  window.showTranscriptByCallId = (callId) => {
    const call = callsData.find(c => c.callId === callId);
    if (call) showTranscript(call);
  };

  function renderHistoryRows(rows) {
    const listBody = document.getElementById('history-list-body');
    if (!listBody) return;

    if (!rows.length) {
      listBody.innerHTML = '<tr><td colspan="5" class="px-6 py-12 text-center text-slate-500 italic uppercase text-[9px] tracking-widest">Sin interacciones encontradas</td></tr>';
      return;
    }

    listBody.innerHTML = rows.slice(0, 50).map((c, i) => {
      const cls = classifyOutboundCall(c);
      
      let statusIcon = 'radio_button_checked';
      let statusColor = 'text-slate-500 shadow-none';
      let statusLabel = 'Pendiente';
      
      if (cls === 'answered') { 
        statusIcon = 'check_circle'; 
        statusColor = 'text-emerald-400'; 
        statusLabel = 'Contestada';
      } else if (cls === 'unanswered') { 
        statusIcon = 'cancel'; 
        statusColor = 'text-rose-500'; 
        statusLabel = 'Fallida';
      } else if (c.status === 'active') { 
        statusIcon = 'motion_photos_on'; 
        statusColor = 'text-primary animate-pulse'; 
        statusLabel = 'En Curso';
      }

      const started = c.startedAt ? new Date(c.startedAt).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : '—';
      const dur = c.durationSec != null ? formatDuration(c.durationSec) : '—';
      
      return `
        <tr class="hover:bg-white/[0.03] transition-colors cursor-pointer group" onclick="showTranscriptByCallId('${c.callId}')">
          <td class="px-6 py-4">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px] ${statusColor}">${statusIcon}</span>
              <span class="font-black uppercase tracking-tighter ${statusColor}">${statusLabel}</span>
            </div>
          </td>
          <td class="px-6 py-4">
            <div class="flex flex-col">
                <span class="font-black text-white group-hover:text-primary transition-colors">${escapeHtml(c.to || c.from || '—')}</span>
                <span class="text-slate-500 text-[9px] font-bold uppercase tracking-wider">${escapeHtml(c.domain || 'Interacción Directa')}</span>
            </div>
          </td>
          <td class="px-6 py-4 text-slate-400 font-medium">${escapeHtml(started)}</td>
          <td class="px-6 py-4 text-center font-mono font-bold text-slate-300">${escapeHtml(dur)}</td>
          <td class="px-6 py-4 text-right">
            <div class="flex items-center justify-end gap-2">
                ${c.recordingUrl ? '<span class="material-symbols-outlined text-sm text-indigo-400/50">mic</span>' : ''}
                <button class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-white group-hover:bg-primary/20 transition-all">
                    <span class="material-symbols-outlined text-sm">visibility</span>
                </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function loadCallHistory(preloadedData = null) {
    try {
      callsData = preloadedData || await (await fetch('/api/calls')).json();
      renderHistorySummary();
      renderHistoryBatchCards();
      renderRetryBook();
      if (historyLastUpdate) {
        historyLastUpdate.textContent = `Actualizado: ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
      }

      const filtered = getHistoryFilteredData();
      renderHistoryRows(filtered);
    } catch (e) { console.error('Error cargando historial:', e); }
  }

  if (historyRetryBtn) {
    historyRetryBtn.addEventListener('click', async () => {
      const unansweredCalls = callsData.filter(c => classifyOutboundCall(c) === 'unanswered');
      await retryUnansweredCalls(unansweredCalls, historyRetryBtn, 'Reintento General');
    });
  }

  if (historySearchInput) {
    historySearchInput.addEventListener('input', () => {
      historyView.query = historySearchInput.value || '';
      renderHistoryRows(getHistoryFilteredData());
    });
  }

  if (historyFilterSelect) {
    historyFilterSelect.addEventListener('change', () => {
      historyView.filter = historyFilterSelect.value || 'all';
      renderHistoryRows(getHistoryFilteredData());
    });
  }

  if (historyResetAllBtn) {
    if (historyResetConfirm) {
      historyResetAllBtn.disabled = !historyResetConfirm.checked;
      historyResetConfirm.addEventListener('change', () => {
        historyResetAllBtn.disabled = !historyResetConfirm.checked;
      });
    }

    historyResetAllBtn.addEventListener('click', async () => {
      const confirmText = await appPrompt(
        'Esto borrará historial, transcripciones, lotes y reintentos programados. Escribe "RESETEAR" para confirmar:',
        'RESETEAR'
      );
      if (confirmText !== 'RESETEAR') return;

      historyResetAllBtn.disabled = true;
      const originalLabel = historyResetAllBtn.textContent;
      historyResetAllBtn.textContent = 'RESETEANDO...';
      try {
        const resp = await fetch('/api/calls/reset-all', { method: 'DELETE' });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data?.error || 'No se pudo resetear');
        callsData = [];
        historyBatchMap = new Map();
        historyExpandedBatches.clear();
        renderHistorySummary();
        renderHistoryBatchCards();
        renderHistoryRows([]);
        appAlert('Reset completo realizado. Historial limpio.');
        if (historyResetConfirm) {
          historyResetConfirm.checked = false;
          historyResetAllBtn.disabled = true;
        }
      } catch (e) {
        appAlert(`Error al resetear: ${e.message}`, true);
      } finally {
        if (!historyResetConfirm || historyResetConfirm.checked) {
          historyResetAllBtn.disabled = false;
        }
        historyResetAllBtn.textContent = originalLabel;
      }
    });
  }


  let currentBatch = { active: false, ids: [], stats: { answered: 0, failed: 0, total: 0 }, numbers: {}, startTime: null };

  function updateBatchMonitor() {
      const monitor = document.getElementById('batch-stats');
      const badge = document.getElementById('batch-badge');
      const actions = document.getElementById('batch-actions');
      const ansEl = document.getElementById('batch-answered-count');
      const failEl = document.getElementById('batch-failed-count');
      const queue = document.getElementById('reminder-queue');

      if (!currentBatch.active) {
          monitor?.classList.add('hidden');
          badge?.classList.add('hidden');
          return;
      }

      monitor?.classList.remove('hidden');
      badge?.classList.remove('hidden');
      if (ansEl) ansEl.textContent = currentBatch.stats.answered;
      if (failEl) failEl.textContent = currentBatch.stats.failed;

      const totalProcessed = currentBatch.stats.answered + currentBatch.stats.failed;
      if (totalProcessed >= currentBatch.stats.total && currentBatch.stats.total > 0) {
          badge?.classList.add('hidden');
          actions?.classList.remove('hidden');
          
          // Renderizar resumen final en la cola
          if (queue) queue.innerHTML = `
            <div class="glass-card p-6 border-l-4 border-emerald-400 rounded-2xl bg-emerald-400/5">
                <div class="flex items-center gap-3 mb-3">
                    <span class="material-symbols-outlined text-emerald-400">verified</span>
                    <p class="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Llamadas Finalizadas</p>
                </div>
                <p class="text-sm text-zinc-300">Se procesaron ${currentBatch.stats.total} números. Pulsa el botón inferior para reintentar con los fallidos si es necesario.</p>
            </div>
          `;
      }
  }

  // Polling para el lote actual
  setInterval(async () => {
      if (!currentBatch.active || currentBatch.numbers.length === 0) return;

      try {
          const resp = await fetch('/api/calls');
          const data = await resp.json();
          
          let ansCount = 0;
          let failCount = 0;

          currentBatch.numbers.forEach(num => {
              // Buscar la llamada más reciente al número dentro de este lote
              const call = data.find(c => {
                  const targetNum = c.to_number || c.to || c.from || '';
                  const started = new Date(c.started_at || c.startedAt || null);
                  return targetNum.includes(num) && started >= currentBatch.startTime;
              });
              
              if (call) {
                  const duration = parseInt(call.duration_sec || call.durationSec) || 0;
                  if (call.status === 'completed' || call.status === 'ws_close' || call.status === 'stop_event' || call.status === 'terminated') {
                      if (duration > 5) ansCount++;
                      else failCount++;
                  }
              }
          });

          currentBatch.stats.answered = ansCount;
          currentBatch.stats.failed = failCount;
          updateBatchMonitor();
      } catch (e) { console.error('Error polling batch:', e); }
  }, 3000);

  // Botón Reprogramar
  document.getElementById('btn-reprogramar-fallidos')?.addEventListener('click', () => {
    if (!currentBatch.stats.total) return;
    
    // Buscar qué números del batch fallaron (esto requiere que guardemos metadata)
    // Para simplificar, pediremos a la API los datos y compararemos
    fetch('/api/calls').then(r => r.json()).then(data => {
        const failedNumbers = [];
        currentBatch.numbers.forEach(num => {
            const call = data.find(c => {
                const targetNum = c.to_number || c.to || c.from || '';
                const started = new Date(c.started_at || c.startedAt || null);
                return targetNum.includes(num) && started >= currentBatch.startTime;
            });
            if (call) {
                const duration = parseInt(call.duration_sec || call.durationSec) || 0;
                if (!duration || duration <= 5) {
                    failedNumbers.push(num);
                }
            } else {
                // If call wasn't found at all in the DB (rate limit rejected or telnyx failed instantly), it's a failure too.
                failedNumbers.push(num);
            }
        });

        if (failedNumbers.length === 0) {
            appAlert('¡Excelente! No hay llamadas fallidas detectadas para reprogramar.');
            return;
        }

        // Cargar números y dominios fallidos en el formulario (en cajas separadas)
        const phonesTextarea = document.getElementById('reminder-phones');
        const domainsTextarea = document.getElementById('reminder-domains');
        const restoredNumbers = [];
        const restoredDomains = [];
        failedNumbers.forEach(num => {
            const dom = currentBatch.domains && currentBatch.domains[num] ? currentBatch.domains[num] : '';
            restoredNumbers.push(num);
            restoredDomains.push(dom);
        });
        phonesTextarea.value = restoredNumbers.join('\n');
        if (domainsTextarea) domainsTextarea.value = restoredDomains.join('\n');
        phonesTextarea.dispatchEvent(new Event('input'));
        
        // Tab focus
        window.scrollTo({ top: 0, behavior: 'smooth' });
        appAlert(`✅ Se han cargado ${failedNumbers.length} números fallidos para reintentar.`);
        
        // Reset batch status
        currentBatch.active = false;
        document.getElementById('batch-actions')?.classList.add('hidden');
        document.getElementById('batch-stats')?.classList.add('hidden');
    });
  });

  const reminderForm = document.getElementById('reminder-form');
  const reminderPhones = document.getElementById('reminder-phones');
  const reminderDomains = document.getElementById('reminder-domains');
  const reminderCount = document.getElementById('reminder-count');
  const reminderQueue = document.getElementById('reminder-queue');
  const reminderSubmitBtn = document.getElementById('reminder-submit-btn');

  // Toggle Programado/Inmediato
  const btnInmediato = document.getElementById('btn-modo-inmediato');
  const btnProgramado = document.getElementById('btn-modo-programado');
  const reminderTimeContainer = document.getElementById('reminder-time-container');
  const reminderTimeInput = document.getElementById('reminder-time');
  let reminderDeliveryMode = 'immediate';

  if (btnInmediato && btnProgramado) {
    btnInmediato.addEventListener('click', () => {
      reminderDeliveryMode = 'immediate';
      btnInmediato.classList.replace('text-zinc-500', 'text-white');
      btnInmediato.classList.replace('hover:bg-zinc-800/50', 'bg-zinc-800');
      btnInmediato.classList.add('bg-zinc-800');
      
      btnProgramado.classList.replace('text-white', 'text-zinc-500');
      btnProgramado.classList.replace('bg-zinc-800', 'hover:bg-zinc-800/50');
      btnProgramado.classList.remove('bg-zinc-800');
      
      reminderTimeContainer.classList.add('hidden');
      reminderTimeInput.value = '';
    });

    btnProgramado.addEventListener('click', () => {
      reminderDeliveryMode = 'scheduled';
      btnProgramado.classList.replace('text-zinc-500', 'text-white');
      btnProgramado.classList.replace('hover:bg-zinc-800/50', 'bg-zinc-800');
      btnProgramado.classList.add('bg-zinc-800');
      
      btnInmediato.classList.replace('text-white', 'text-zinc-500');
      btnInmediato.classList.replace('bg-zinc-800', 'hover:bg-zinc-800/50');
      btnInmediato.classList.remove('bg-zinc-800');
      
      reminderTimeContainer.classList.remove('hidden');
      reminderTimeInput.focus();
    });
  }

  // Auto-guardado en LocalStorage para evitar pérdida de guiones no oficiales
  const reminderMsgEl = document.getElementById('reminder-msg');
  if (reminderMsgEl) {
      const savedDraft = localStorage.getItem('via_reminder_draft');
      if (savedDraft && (!reminderMsgEl.value || reminderMsgEl.value.trim() === '')) {
          reminderMsgEl.value = savedDraft;
      }
      reminderMsgEl.addEventListener('input', () => {
          if (document.getElementById('reminder-message-template')?.value === 'mensaje_personalizado') {
              localStorage.setItem('via_reminder_draft', reminderMsgEl.value);
          }
      });
  }


  if (reminderPhones) {
    reminderPhones.addEventListener('input', () => {
      const count = reminderPhones.value
        .split('\n')
        .map(n => (n || '').trim())
        .filter(n => n.length >= 8).length;
      if (reminderCount) reminderCount.textContent = `${count} Destinos`;
    });

    // Auto-format on blur for reminders
    reminderPhones.addEventListener('blur', () => {
      const lines = reminderPhones.value.split('\n');
      const formatted = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        // If it looks like a single number, format it
        if (/^\d{9}$/.test(trimmed)) return formatToE164(trimmed);
        return trimmed;
      });
      reminderPhones.value = formatted.filter(l => l).join('\n');
    });
  }

  function getReminderRetryPolicy(intervalValue) {
    const hours = parseInt(intervalValue || '0', 10);
    if (!hours) {
      return {
        intervalHours: 0,
        maxAttempts: 1,
        summary: 'Sin reintento. Se realiza una sola llamada.'
      };
    }

    const maxAttempts = Math.max(1, Math.floor(24 / hours));
    return {
      intervalHours: hours,
      maxAttempts,
      summary: `Se intentará cada ${hours} hora${hours === 1 ? '' : 's'}, máximo ${maxAttempts} intento${maxAttempts === 1 ? '' : 's'} en 24 horas. Luego se detiene automáticamente.`
    };
  }

  function syncReminderRetrySummary() {
    const retrySelect = document.getElementById('reminder-retry');
    const summaryEl = document.getElementById('reminder-retry-summary');
    if (!retrySelect || !summaryEl) return;

    const policy = getReminderRetryPolicy(retrySelect.value);
    summaryEl.textContent = policy.summary;
  }

  if (reminderForm) {
    document.getElementById('reminder-retry')?.addEventListener('change', syncReminderRetrySummary);
    syncReminderRetrySummary();

    reminderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phoneLines = reminderPhones.value.split('\n').filter(l => l.trim().length > 0);
      const domainLines = reminderDomains ? reminderDomains.value.split('\n') : [];
      const numbers = [];
      const domains = {};
      
      phoneLines.forEach((line, idx) => {
          // Compatibilidad: si viene en formato antiguo "numero,dominio" también se soporta.
          const parts = line.split(/[,\s\t;|]+/).map(p => p.trim()).filter(p => p.length > 0);
          const rawNum = parts[0] || '';
          const num = formatToE164(rawNum);
          if (num.length >= 8) {
              numbers.push(num);
              const legacyDomain = line.substring(line.indexOf(rawNum) + rawNum.length).replace(/^[,\s\t;|]+/, '').trim();
              const explicitDomain = (domainLines[idx] || '').trim();
              const mappedDomain = (window.phoneContexts && window.phoneContexts[num] && window.phoneContexts[num].domain) ? window.phoneContexts[num].domain : '';
              const finalDomain = explicitDomain || legacyDomain || mappedDomain;
              if (finalDomain) domains[num] = finalDomain;
          }
      });

      const time = document.getElementById('reminder-time')?.value || 'Inmediato';
      const scheduledAt = reminderDeliveryMode === 'scheduled' ? (reminderTimeInput?.value || '') : '';
      const retry = document.getElementById('reminder-retry')?.value || '0';
      const retryPolicy = getReminderRetryPolicy(retry);
      const msg = document.getElementById('reminder-msg').value;
      const greeting = document.getElementById('reminder-greeting')?.value || '';

      if (!numbers.length) return appAlert('Ingresa al menos un número válido manualmente o importándolo desde Excel/Word.', true);
      if (reminderDeliveryMode === 'scheduled' && !scheduledAt) {
        return appAlert('Selecciona fecha y hora para programar el envío.', true);
      }
      if (reminderDeliveryMode === 'scheduled' && retryPolicy.intervalHours > 0) {
        const accepted = await appConfirm(
          retryPolicy.summary,
          { title: 'Política de reintento', confirmText: 'Continuar' }
        );
        if (!accepted) return;
      }
      const reminderBatch = createBatchMeta('Lote Recordatorio', numbers.length);

      // Crear elemento de lote en la cola
      const item = document.createElement('div');
      item.className = 'glass-card rounded-xl p-4 group hover:bg-white/5 transition-all cursor-pointer border-l-4 border-primary';
      item.innerHTML = `
          <div class="flex items-start justify-between gap-4">
              <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span class="material-symbols-outlined text-sm">dynamic_feed</span>
                  </div>
                  <div>
                      <h3 class="text-xs font-bold text-on-surface">Llamadas a ${numbers.length} Destinatarios</h3>
                      <p class="text-[10px] text-on-surface-variant opacity-60">${reminderDeliveryMode === 'scheduled' ? scheduledAt : 'Inmediato'}</p>
                  </div>
              </div>
              <span class="text-[8px] uppercase font-bold text-secondary tracking-widest bg-secondary/10 px-2 py-1 rounded">En Cola</span>
          </div>
          <div class="mt-3 pt-3 border-t border-outline-variant/10">
              <p class="text-[11px] text-on-surface-variant italic truncate">"${escapeHtml(msg)}"</p>
          </div>
      `;

      reminderQueue.innerHTML = '';
      reminderQueue.prepend(item);

      // Iniciar Seguimiento de Lote (Arquitectura Profesional)
      currentBatch = {
          active: true,
          ids: [],
          stats: { answered: 0, failed: 0, total: numbers.length },
          numbers: numbers,
          domains: domains, // Store the domains mapping
          startTime: new Date()
      };
      
      document.getElementById('batch-stats')?.classList.remove('hidden');
      document.getElementById('batch-actions')?.classList.add('hidden');
      const batchAnswered = document.getElementById('batch-answered-count');
      const batchFailed = document.getElementById('batch-failed-count');
      if (batchAnswered) batchAnswered.textContent = '0';
      if (batchFailed) batchFailed.textContent = '0';
      document.getElementById('batch-badge')?.classList.remove('hidden');

      // Reset
      reminderForm.reset();
      if (reminderCount) reminderCount.textContent = '0 Destinos';
      
      // LÓGICA NEURAL DE DISPARO:
      if (reminderDeliveryMode === 'immediate') {
        // Enviar llamadas realmente
        appAlert(`Llamadas iniciadas de inmediato para ${numbers.length} destinos.`);
        
        // Disparar asincronicamente en segundo plano
        (async () => {
            const submitBtn = reminderSubmitBtn || reminderForm.querySelector('button[type="submit"]');
            if(submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Preparando envío...'; }
            
            // Garantizar que si hubo edición en caliente, el prompt actual se reescriba en DB
            if (activeReminderId && msg && greeting) {
                 const p = currentReminderPrompts.find(pr => pr.id === activeReminderId);
                 if (p && (p.text !== msg || p.greeting !== greeting)) {
                      await fetch('/api/reminders', {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: p.id, name: p.name, greeting: greeting, text: msg })
                      });
                 }
            }

            if(submitBtn) { submitBtn.textContent = 'Enviando llamadas...'; }
            
            // Registrar Lote
            await fetch('/api/batches', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: reminderBatch.batchId,
                    parent_batch_id: window.pendingRetryParentId || null,
                    name: reminderBatch.batchLabel,
                    template_used: activeReminderId,
                    total_destinations: numbers.length
                })
            }).catch(e=>console.error('Error saving batch state:', e));
            
            window.pendingRetryParentId = null; // Reset for next batch
            
            for (const num of numbers) {
               try {
                   // Importante: Aquí puedes extender el endpoint /api/make-call luego si deseas mandar también el parámetro `msg` como custom_prompt.
                    const resp = await fetch('/api/make-call', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            number: num, 
                            domain: domains[num] || '',
                            mode: 'reminder',
                            greeting: greeting,
                            instructions: msg,
                            retry_interval: parseInt(retry),
                            batch_id: reminderBatch.batchId,
                            batch_label: reminderBatch.batchLabel
                        })
                    });
                    if (!resp.ok) {

                       if (resp.status === 401) {
                           appAlert('Tu sesión ha expirado por un reinicio del servidor. Inicia sesión de nuevo.', true).then(() => {
                               window.location.replace('/login');
                           });
                           return; // abort loop
                       }
                       console.error('Error', resp.statusText);
                   }
                   // Gap preventivo entre llamadas (evita saturar rates de Telnyx)
                   await new Promise(r => setTimeout(r, 2500));
               } catch(e) { console.error('Error al iniciar recordatorio', e); }
            }
            
            if(submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'LLAMAR AHORA'; }
            const badge = item.querySelector('span.text-secondary');
            if (badge) {
                badge.className = 'text-[8px] uppercase font-bold text-green-400 tracking-widest bg-green-500/10 px-2 py-1 rounded';
                badge.textContent = 'COMPLETADO';
            }
        })();
      } else {
        appAlert(`${numbers.length} llamadas programadas para: ${scheduledAt}.`);
        
        // Enviar a programar en el servidor
        (async () => {
            const submitBtn = reminderSubmitBtn || reminderForm.querySelector('button[type="submit"]');
            if(submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Programando llamadas...'; }
            
            for (const num of numbers) {
                await fetch('/api/make-call', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        number: num, 
                        domain: domains[num] || '',
                        mode: 'reminder',
                        greeting: greeting,
                        instructions: msg,
                        retry_interval: parseInt(retry),
                        scheduled_for: scheduledAt,
                        batch_id: reminderBatch.batchId,
                        batch_label: reminderBatch.batchLabel
                    })
                });
            }
            if(submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'PROGRAMAR LLAMADA'; }
        })();
      }
    });
  }

  // ─── File Import Logic (Excel & Word) ──────────────────────
  function handleFileImport(fileInput, targetTextarea, updateCounterCallback) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      const extension = file.name.split('.').pop().toLowerCase();

      reader.onload = async (evt) => {
        try {
          const arrayBuffer = evt.target.result;
          let entries = [];
          if (!window.phoneContexts) window.phoneContexts = {};

          if (extension === 'docx' || extension === 'doc') {
             // Word handler using Mammoth
             const result = await mammoth.extractRawText({ arrayBuffer });
             const text = result.value;
             const lines = text.split(/\n/);
             lines.forEach(line => {
                const parts = line.split(/[,\t|]/).map(p => p.trim());
                const num = parts[0].replace(/[^0-9+]/g, '');
                if (num.length >= 8) {
                   const domain = parts[1] ? parts[1].replace(/[^a-zA-Z0-9.\-]/g, '') : '';
                   entries.push(domain ? `${num}, ${domain}` : num);
                   if (domain) window.phoneContexts[num] = { domain };
                }
             });
          } else {
             // Excel handler using SheetJS
             const data = new Uint8Array(arrayBuffer);
             const workbook = XLSX.read(data, {type: 'array'});
             const sheet = workbook.Sheets[workbook.SheetNames[0]];
             const rows = XLSX.utils.sheet_to_json(sheet, {header: 1});
             
             rows.forEach(row => {
               const phone = String(row[0] || '').trim().replace(/[^0-9+]/g, '');
               const domain = String(row[1] || '').trim();
               if (phone.length >= 8) {
                  entries.push(domain ? `${phone}, ${domain}` : phone);
                  if (domain) window.phoneContexts[phone] = { domain };
               }
             });
          }

          const uniqueEntries = [...new Set(entries)];
          if (uniqueEntries.length > 0) {
            const currentVal = targetTextarea.value.trim();
            targetTextarea.value = (currentVal ? currentVal + '\n' : '') + uniqueEntries.join('\n');
            if (updateCounterCallback) updateCounterCallback();
            appAlert(`Se importaron ${uniqueEntries.length} registros exitosamente de ${extension.toUpperCase()}.`);
          } else {
            appAlert('No se detectaron secuencias numéricas válidas en el archivo seleccionado.', true);
          }
        } catch (err) {
          console.error("Error importando archivo:", err);
          appAlert('Error al procesar el archivo. Revisa que el formato sea correcto.', true);
        }
        fileInput.value = '';
      };
      reader.readAsArrayBuffer(file);
    });
  }

  function handleReminderFileImport(fileInput, phonesTextarea, domainsTextarea, updateCounterCallback) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      const extension = file.name.split('.').pop().toLowerCase();

      reader.onload = async (evt) => {
        try {
          const arrayBuffer = evt.target.result;
          const entries = [];

          if (!window.phoneContexts) window.phoneContexts = {};

          if (extension === 'docx' || extension === 'doc') {
            const result = await mammoth.extractRawText({ arrayBuffer });
            const lines = result.value.split(/\n/);
            lines.forEach(line => {
              const parts = line.split(/[,\t|]/).map(p => p.trim()).filter(Boolean);
              const phone = String(parts[0] || '').replace(/[^0-9+]/g, '');
              if (phone.length >= 8) {
                const domain = parts.slice(1).join(' ').trim();
                entries.push({ phone, domain });
                if (domain) window.phoneContexts[phone] = { domain };
              }
            });
          } else {
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            rows.forEach(row => {
              const phone = String(row[0] || '').trim().replace(/[^0-9+]/g, '');
              const domain = String(row[1] || '').trim();
              if (phone.length >= 8) {
                entries.push({ phone, domain });
                if (domain) window.phoneContexts[phone] = { domain };
              }
            });
          }

          const unique = [];
          const seen = new Set();
          entries.forEach(({ phone, domain }) => {
            const key = `${phone}__${domain}`;
            if (seen.has(key)) return;
            seen.add(key);
            unique.push({ phone, domain });
          });

          if (unique.length > 0) {
            const currentPhones = phonesTextarea.value.trim();
            const currentDomains = domainsTextarea ? domainsTextarea.value.trim() : '';
            const newPhones = unique.map(e => e.phone).join('\n');
            const newDomains = unique.map(e => e.domain || '').join('\n');

            phonesTextarea.value = currentPhones ? `${currentPhones}\n${newPhones}` : newPhones;
            if (domainsTextarea) {
              domainsTextarea.value = currentDomains ? `${currentDomains}\n${newDomains}` : newDomains;
            }

            if (updateCounterCallback) updateCounterCallback();
            appAlert(`Se importaron ${unique.length} registros exitosamente de ${extension.toUpperCase()}.`);
          } else {
            appAlert('No se detectaron secuencias numéricas válidas en el archivo seleccionado.', true);
          }
        } catch (err) {
          console.error("Error importando archivo:", err);
          appAlert('Error al procesar el archivo. Revisa que el formato sea correcto.', true);
        }
        fileInput.value = '';
      };

      reader.readAsArrayBuffer(file);
    });
  }

  const importCamp = document.getElementById('import-file-campaigns');
  if (importCamp) handleFileImport(importCamp, document.getElementById('phone-numbers'), null);

  const importRem = document.getElementById('import-file-reminders');
  if (importRem) handleReminderFileImport(importRem, document.getElementById('reminder-phones'), document.getElementById('reminder-domains'), () => {
      document.getElementById('reminder-phones').dispatchEvent(new Event('input'));
  });

  // ─── Voice Preview System ──────────────────────────────
  const previewBar = document.getElementById('voice-preview-bar');
  const previewAudio = document.getElementById('voice-preview-audio');
  const closePreview = document.getElementById('close-preview');
  const previewPulse = document.getElementById('preview-pulse');

  function showPreviewBar() {
    if (previewBar) previewBar.style.transform = 'translateY(0)';
  }
  function hidePreviewBar() {
    if (previewBar) previewBar.style.transform = 'translateY(100%)';
    if (previewAudio) { previewAudio.pause(); previewAudio.src = ''; }
  }

  if (closePreview) closePreview.addEventListener('click', hidePreviewBar);

  async function previewVoice(text) {
    if (!text || !text.trim()) {
      appAlert('Escribe un texto para escuchar la voz.', true);
      return;
    }
    showPreviewBar();
    if (previewPulse) previewPulse.classList.add('animate-pulse');

    try {
      const resp = await fetch('/api/tts-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() })
      });

      if (!resp.ok) throw new Error('Error al generar audio');

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      previewAudio.src = url;
      previewAudio.play();
      if (previewPulse) previewPulse.classList.remove('animate-pulse');
    } catch (e) {
      hidePreviewBar();
      appAlert('Error al generar la vista previa de voz.', true);
    }
  }

  // Identity tab preview
  const previewPromptBtn = document.getElementById('preview-prompt-btn');
  if (previewPromptBtn) {
    previewPromptBtn.addEventListener('click', () => {
      const greeting = document.getElementById('prompt-greeting')?.value || '';
      const text = document.getElementById('prompt-text')?.value || '';
      previewVoice(greeting || text || 'Hola, esta es una prueba de voz.');
    });
  }

  // Reminders tab preview
  const previewReminderBtn = document.getElementById('preview-reminder-btn');
  if (previewReminderBtn) {
    previewReminderBtn.addEventListener('click', () => {
      const greeting = document.getElementById('reminder-greeting')?.value || '';
      const msg = document.getElementById('reminder-msg')?.value || '';
      previewVoice(`${greeting} ${msg}`.trim() || 'Hola, esta es una prueba de voz.');
    });
  }

  // ─── Live Monitor System ──────────────────────────────
  let monitorWs = null;
  const liveTranscript = document.getElementById('live-transcript');
  const monitorStatus = document.getElementById('monitor-status');
  const monitorEmpty = document.getElementById('monitor-empty');
  const activeCallsList = document.getElementById('active-calls-list');
  const disconnectBtn = document.getElementById('disconnect-monitor');
  const refreshBtn = document.getElementById('refresh-active-calls');

  async function loadActiveCalls() {
    try {
      const resp = await fetch('/api/active-calls');
      const calls = await resp.json();
      
      if (!calls.length) {
        activeCallsList.innerHTML = `
          <div class="opacity-20 py-16 text-center uppercase text-[10px] font-bold tracking-widest flex flex-col items-center gap-3">
            <span class="material-symbols-outlined text-3xl">wifi_tethering_off</span>
            Sin llamadas activas
          </div>`;
        return;
      }

      activeCallsList.innerHTML = calls.map(call => `
        <button class="w-full p-4 rounded-xl bg-surface-container-lowest border border-zinc-800/30 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-left group" data-call-id="${call.callId}">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <span class="material-symbols-outlined text-emerald-400 text-sm animate-pulse">call</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[10px] font-bold uppercase tracking-widest text-emerald-400">En Curso</p>
              <p class="text-[9px] text-zinc-500 truncate">...${call.callId.slice(-12)}</p>
            </div>
            <span class="material-symbols-outlined text-zinc-600 group-hover:text-emerald-400 transition-colors">headset_mic</span>
          </div>
        </button>
      `).join('');

      // Add click handlers
      activeCallsList.querySelectorAll('button[data-call-id]').forEach(btn => {
        btn.addEventListener('click', () => connectMonitor(btn.dataset.callId));
      });
    } catch (e) {
      console.error('Error loading active calls:', e);
    }
  }

  function connectMonitor(callId) {
    // Disconnect existing
    if (monitorWs) { monitorWs.close(); monitorWs = null; }

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}/live-monitor?callId=${callId}`;
    
    monitorWs = new WebSocket(wsUrl);
    monitorStatus.textContent = 'Conectando...';
    monitorStatus.className = 'text-[9px] font-bold text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full uppercase tracking-widest animate-pulse';

    monitorWs.onopen = () => {
      monitorStatus.textContent = '● En Vivo';
      monitorStatus.className = 'text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-widest animate-pulse';
      if (monitorEmpty) monitorEmpty.style.display = 'none';
      if (disconnectBtn) disconnectBtn.classList.remove('hidden');
      
      liveTranscript.innerHTML = `
        <div class="text-center py-4">
          <span class="text-[9px] font-bold uppercase tracking-widest text-emerald-400/50">Conectado a llamada ...${callId.slice(-8)}</span>
        </div>`;
    };

    monitorWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'transcript') {
          const isUser = data.role === 'user';
          const label = isUser ? '👤 Humano' : '🤖 IA';
          const bgCls = isUser ? 'bg-white/5 border-white/10' : 'bg-primary/10 border-primary/20';
          
          const msgEl = document.createElement('div');
          msgEl.className = `p-4 rounded-xl border ${bgCls} animate-fade-in`;
          msgEl.innerHTML = `
            <div class="flex items-center gap-2 mb-2">
              <span class="text-[9px] font-bold uppercase tracking-widest ${isUser ? 'text-zinc-400' : 'text-primary'}">${label}</span>
              <span class="text-[8px] text-zinc-600">${new Date().toLocaleTimeString('es-ES')}</span>
            </div>
            <p class="text-sm text-zinc-200 leading-relaxed">${escapeHtml(data.text)}</p>
          `;
          liveTranscript.appendChild(msgEl);
          liveTranscript.scrollTop = liveTranscript.scrollHeight;
        }

        if (data.type === 'session_end') {
          const endEl = document.createElement('div');
          endEl.className = 'text-center py-6';
          endEl.innerHTML = `<span class="text-[9px] font-bold uppercase tracking-widest text-error/60">● Llamada finalizada (${data.reason})</span>`;
          liveTranscript.appendChild(endEl);
          
          monitorStatus.textContent = 'Finalizada';
          monitorStatus.className = 'text-[9px] font-bold text-zinc-500 bg-zinc-800 px-3 py-1 rounded-full uppercase tracking-widest';
          loadActiveCalls();
        }
      } catch (e) {}
    };

    monitorWs.onclose = () => {
      monitorStatus.textContent = 'Desconectado';
      monitorStatus.className = 'text-[9px] font-bold text-zinc-600 bg-zinc-800 px-3 py-1 rounded-full uppercase tracking-widest';
    };
  }

  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', () => {
      if (monitorWs) { monitorWs.close(); monitorWs = null; }
      disconnectBtn.classList.add('hidden');
      if (monitorEmpty) monitorEmpty.style.display = '';
      liveTranscript.innerHTML = '';
      if (monitorEmpty) liveTranscript.appendChild(monitorEmpty);
    });
  }

  if (refreshBtn) refreshBtn.addEventListener('click', loadActiveCalls);

  async function loadScheduledCalls() {
    try {
      const resp = await fetch('/api/scheduled');
      const data = await resp.json();
      const container = document.getElementById('scheduled-list');
      const stuckCountEl = document.getElementById('scheduled-stuck-count');
      const processingCountEl = document.getElementById('scheduled-processing-count');
      const pendingCountEl = document.getElementById('scheduled-pending-count');
      if (!container) return;

      const now = Date.now();
      let stuckCount = 0;
      let processingCount = 0;
      let pendingCount = 0;

      data.forEach(s => {
        const status = String(s.status || 'pending').toLowerCase();
        const processingStartedAt = s.processing_started_at ? new Date(s.processing_started_at).getTime() : null;
        const isStuck = status === 'processing' && (!processingStartedAt || (now - processingStartedAt) > 180000);
        if (status === 'processing' && isStuck) stuckCount++;
        else if (status === 'processing') processingCount++;
        else if (status === 'pending' || status === 'failed') pendingCount++;
      });

      if (stuckCountEl) stuckCountEl.textContent = String(stuckCount);
      if (processingCountEl) processingCountEl.textContent = String(processingCount);
      if (pendingCountEl) pendingCountEl.textContent = String(pendingCount);

      if (!data.length) {
        container.innerHTML = '<div class="opacity-10 py-10 text-center uppercase text-[8px] font-bold tracking-widest">Sin programaciones</div>';
        return;
      }

      container.innerHTML = data.map(s => {
        const status = String(s.status || 'pending').toLowerCase();
        const processingStartedAt = s.processing_started_at ? new Date(s.processing_started_at).getTime() : null;
        const isStuck = status === 'processing' && (!processingStartedAt || (now - processingStartedAt) > 180000);
        const statusLabel = status === 'processing' ? (isStuck ? 'Atascado' : 'Procesando') : (status === 'failed' ? 'Reintentando' : 'Pendiente');
        const statusClass = status === 'processing'
          ? (isStuck ? 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30' : 'text-primary bg-primary/10 border-primary/30')
          : (status === 'failed' ? 'text-orange-300 bg-orange-500/10 border-orange-500/30' : 'text-zinc-300 bg-zinc-700/30 border-zinc-600/30');
        const attempts = parseInt(s.attempts || 0, 10);
        const retryHours = parseInt(s.retry_interval_hours || 0, 10);
        const maxAttempts = retryHours > 0 ? Math.max(1, Math.floor(24 / retryHours)) : 1;
        const retryMeta = retryHours > 0
          ? `Cada ${retryHours}h · ${attempts}/${maxAttempts} intento${maxAttempts === 1 ? '' : 's'}`
          : `Sin reintento · ${attempts || 1}/1 intento`;
        const errorLine = s.last_error ? `<p class="text-[8px] text-orange-300/80 truncate">${escapeHtml(s.last_error)}</p>` : '';

        return `
        <div class="p-3 rounded-lg bg-surface-container-lowest border border-zinc-800/30 flex justify-between items-center group">
          <div class="min-w-0 flex-1">
            <p class="text-[10px] font-bold text-on-surface truncate">${s.to_number}${s.domain ? ' · ' + escapeHtml(s.domain) : ''}</p>
            <p class="text-[8px] text-zinc-500 uppercase tracking-widest">${new Date(s.scheduled_for).toLocaleString('es-ES', {hour:'2-digit', minute:'2-digit'})} · ${retryMeta}</p>
            ${errorLine}
          </div>
          <span class="mr-2 text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${statusClass}">${statusLabel}</span>
          <button onclick="cancelScheduled('${s.id}')" class="opacity-0 group-hover:opacity-100 material-symbols-outlined text-[12px] text-zinc-600 hover:text-error transition-all">cancel</button>
        </div>
      `;
      }).join('');
    } catch (e) {}
  }

  window.cancelScheduled = async (id) => {
    if (confirm('¿Cancelar este re-intento?')) {
      await fetch(`/api/scheduled/${id}`, { method: 'DELETE' });
      loadScheduledCalls();
    }
  };

  setInterval(loadScheduledCalls, 5000);
  loadScheduledCalls();

  document.getElementById('btn-clear-scheduled')?.addEventListener('click', async () => {
    if (await appPrompt('Confirma escribiendo "DETENER" para purgar todos los re-intentos programados:', 'DETENER') === 'DETENER') {
       await fetch('/api/scheduled', { method: 'DELETE' });
       loadScheduledCalls();
       appAlert('✅ Todos los re-intentos han sido cancelados.');
    }
  });

  document.getElementById('btn-stop-all-reminders')?.addEventListener('click', async () => {
    if (confirm('¿Detener todos los recordatorios pendientes? Esta acción es irreversible.')) {
        await fetch('/api/scheduled', { method: 'DELETE' });
        currentBatch.active = false;
        updateBatchMonitor();
        loadScheduledCalls();
        appAlert('⛔ Operación detenida. Los recordatorios en cola han sido eliminados.');
    }
  });

  document.getElementById('btn-recover-stuck')?.addEventListener('click', async () => {
    try {
      await fetch('/api/scheduled/recover-stuck', { method: 'POST' });
      await loadScheduledCalls();
      appAlert('🔄 Tareas atascadas recuperadas y devueltas a pendiente.');
    } catch (e) {
      appAlert('No se pudieron recuperar las tareas atascadas.', true);
    }
  });

  // Auto-refresh active calls when monitor tab is visible
  const origSwitchTab = switchTab;
  switchTab = function(tabId) {
    origSwitchTab(tabId);
    if (tabId === 'monitor') loadActiveCalls();
  };

    const templateSelect = document.getElementById('reminder-message-template');
    if (templateSelect) {
      console.log('[ViaAI] Reminder template system initialized');
      
      const updateFields = (tplId) => {
        const messageTextarea = document.getElementById('reminder-msg') || document.getElementById('reminder-message');
        
        if (tplId && reminderTemplates[tplId]) {
          const tpl = reminderTemplates[tplId];
          const combinedMsg = `${tpl.greeting || ""}\n\n${tpl.text || ""}`.trim();
          if (messageTextarea) messageTextarea.value = combinedMsg;
          console.log(`[ViaAI] Fields updated for template: ${tplId}`);
        } else if (tplId === 'mensaje_personalizado') {
          if (messageTextarea) messageTextarea.value = '';
          console.log('[ViaAI] Fields cleared for custom message');
        }
      };

      templateSelect.addEventListener('change', (e) => {
        console.log('[ViaAI] Template dropdown changed manually to:', e.target.value);
        updateFields(e.target.value);
      });


  // ─── Updates Manager ──────────────────────────────
  const updatesTableBody = document.getElementById('updates-table-body');
  const updatesFilterMonth = document.getElementById('updates-filter-month');
  const updatesSearch = document.getElementById('updates-search');
  const updatesRefreshBtn = document.getElementById('updates-refresh-btn');
  const updatesSelectAll = document.getElementById('updates-select-all');
  const updatesSelectedCount = document.getElementById('updates-selected-count');
  const updatesBatchReminder = document.getElementById('updates-batch-reminder');
  const updatesCallNowBtn = document.getElementById('updates-call-now-btn');
  const updatesScheduleBtn = document.getElementById('updates-schedule-btn');
  const updatesMonthChips = Array.from(document.querySelectorAll('.updates-month-chip'));

  let currentUpdates = [];

  function getLocalDateInputValue(date = new Date()) {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 10);
  }

  function getMonthFromDateInput(dateValue) {
    if (!dateValue || typeof dateValue !== 'string') return '';
    const [, month = ''] = dateValue.split('-');
    return month ? String(parseInt(month, 10)) : '';
  }

  function getDefaultUpdateDate() {
    const now = new Date();
    const selectedMonth = parseInt(updatesFilterMonth?.value || '', 10);
    if (!selectedMonth) return getLocalDateInputValue(now);

    const year = now.getFullYear();
    const day = Math.min(now.getDate(), new Date(year, selectedMonth, 0).getDate());
    return getLocalDateInputValue(new Date(year, selectedMonth - 1, day));
  }

  function syncUpdatesMonthFilter(monthValue, { force = false, triggerLoad = false } = {}) {
    if (!updatesFilterMonth) return;
    if (!force && updatesFilterMonth.value === String(monthValue ?? '')) return;
    updatesFilterMonth.value = String(monthValue ?? '');
    syncUpdatesMonthGrid();
    if (triggerLoad) window.loadUpdates();
  }

  function syncUpdatesMonthGrid() {
    if (!updatesMonthChips.length || !updatesFilterMonth) return;
    const currentValue = String(updatesFilterMonth.value || '');
  updatesMonthChips.forEach(chip => {
    const isActive = chip.dataset.month === currentValue;
      chip.classList.toggle('active', isActive);
      chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  window.loadUpdates = async function() {
    console.log('[ViaAI] Loading domain updates...');
    const month = updatesFilterMonth?.value || '';
    const search = updatesSearch?.value || '';
    try {
      const resp = await fetch(`/api/updates?month=${month}&search=${search}`);
      console.log('[ViaAI] Fetch status:', resp.status);
      if (!resp.ok) {
          throw new Error(`HTTP Error: ${resp.status}`);
      }
      currentUpdates = await resp.json();
      console.log('[ViaAI] Data received:', currentUpdates?.length, 'records');
      renderUpdatesTable(currentUpdates);
      updateSelectedCount();
      loadUpdatesReminders();
    } catch (e) {
      console.error('[ViaAI] Critical error loading updates:', e);
      updatesTableBody.innerHTML = `<div class="updates-empty-state text-rose-500">Error de conexión: ${e.message}</div>`;
    }
  };

  function loadUpdatesReminders() {
    if (!updatesBatchReminder) return;
    if (updatesBatchReminder.options.length > 1 && currentReminderPrompts.length === (updatesBatchReminder.options.length - 1)) return;
    
    updatesBatchReminder.innerHTML = '<option value="">Seleccionar Recordatorio...</option>' + 
      currentReminderPrompts.map(p => `
        <option value="${p.id}">${escapeHtml(p.name)}</option>
      `).join('');
  }

  function getUpdatesReminderOptionsHtml() {
    return '<option value="">Seleccionar Recordatorio...</option>' + 
      currentReminderPrompts.map(p => `
        <option value="${p.id}">${escapeHtml(p.name)}</option>
      `).join('');
  }

  function renderUpdatesTable(data) {
    console.log('[ViaAI] Rendering updates table with data count:', data?.length);
    const listData = (data && data.length > 0) ? data : (currentUpdates || []);
    if (!updatesTableBody) {
        console.error('[ViaAI] updates-table-body not found in DOM');
        return;
    }
    
    if (listData.length === 0) {
      console.log('[ViaAI] No data to render in updates table');
      updatesTableBody.innerHTML = '<div class="updates-empty-state">No se encontraron registros.</div>';
      return;
    }

    const grouped = listData.reduce((acc, item) => {
      const catMatch = item.notes?.match(/\[CAT:(.*?)\]/);
      if (catMatch) {
        const catName = catMatch[1].trim();
        const key = `cat_${catName.toUpperCase()}`;
        if (!acc[key]) {
          acc[key] = {
            key,
            monthName: catName.toUpperCase(),
            monthIndex: -10,
            items: [],
            isCustomCategory: true
          };
        }
        acc[key].items.push(item);
        return acc;
      }

      const parts = String(item.execution_date || '').split('-');
      if (parts.length < 2) return acc;
      const monthIdx = parseInt(parts[1], 10) - 1;
      const key = `${monthIdx}`;
      if (!acc[key]) {
        const dummyDate = new Date(2024, monthIdx, 15);
        acc[key] = {
          key,
          monthName: dummyDate.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase(),
          monthIndex: monthIdx,
          items: []
        };
      }
      acc[key].items.push(item);
      return acc;
    }, {});

    const groups = Object.values(grouped).sort((a, b) => a.monthIndex - b.monthIndex);

    if (!window.boxPaginationState) window.boxPaginationState = {};

    updatesTableBody.innerHTML = groups.map(group => {
      const visibleItems = group.items.filter(u => u.domain !== 'CABECERA_DE_CUADRO');
      const itemCount = visibleItems.length;
      
      if (!window.boxCollapseState) window.boxCollapseState = {};
      const isCollapsed = window.boxCollapseState[group.key] || false;
      
      const pageSize = 10;
      const currentPage = window.boxPaginationState[group.key] || 1;
      const totalPages = Math.ceil(itemCount / pageSize) || 1;
      const startIndex = (currentPage - 1) * pageSize;
      const pagedItems = visibleItems.slice(startIndex, startIndex + pageSize);

      return `
      <section class="updates-month-card ${group.isCustomCategory ? 'priority-card' : ''}">
        <div class="updates-month-card-head">
          <div class="updates-month-card-icon ${group.isCustomCategory ? 'priority-icon' : ''}">
            <span class="material-symbols-outlined text-xl">${group.isCustomCategory ? 'folder_special' : 'calendar_month'}</span>
          </div>
          <div class="flex-1 flex items-center gap-2 min-w-0 flex-wrap">
            <h3 class="updates-month-card-title">${escapeHtml(group.monthName)}</h3>
            ${group.isCustomCategory ? `
              <button onclick="renameCategory('${escapeHtml(group.monthName)}')" class="p-1 text-zinc-500 hover:text-primary transition-colors">
                  <span class="material-symbols-outlined text-sm">edit_note</span>
              </button>
              <button onclick="deleteCategory('${escapeHtml(group.monthName)}')" class="p-1 text-zinc-500 hover:text-rose-500 transition-colors">
                  <span class="material-symbols-outlined text-sm">delete</span>
              </button>
            ` : ''}
            <button onclick="window.toggleBoxCollapse('${escapeHtml(group.key)}')" class="p-1 text-zinc-500 hover:text-primary transition-colors ml-1">
                <span class="material-symbols-outlined text-[16px]">${isCollapsed ? 'visibility_off' : 'visibility'}</span>
            </button>
            <p class="updates-month-card-subtitle ml-auto">${itemCount} ${itemCount === 1 ? 'dominio' : 'dominios'}</p>
          </div>
          <button onclick="openNewUpdateInBox('${group.isCustomCategory ? escapeHtml(group.monthName) : ''}', ${!group.isCustomCategory ? group.monthIndex + 1 : 'null'})" class="updates-card-add-btn p-2.5 bg-primary text-white hover:scale-110 shadow-lg shadow-primary/20 rounded-xl transition-all flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">add</span>
            <span class="text-[9px] font-black uppercase tracking-widest hidden md:inline">Agregar</span>
          </button>
        </div>
        ${!isCollapsed ? `
        <div class="updates-month-toolbar" data-month-key="${escapeHtml(group.key)}">
          <div class="updates-month-toolbar-left">
            <label class="updates-month-toolbar-select">
              <input type="checkbox" class="updates-month-select-all rounded border-white/10 bg-black/40" data-month-key="${escapeHtml(group.key)}">
              <span><span class="updates-month-selected-count">0</span> seleccionados</span>
            </label>
             <select class="updates-month-reminder w-full sm:w-[350px] max-w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-[10px] font-bold text-primary uppercase tracking-widest outline-none transition-all" onchange="updateBatchPreview(this)">
                ${getUpdatesReminderOptionsHtml(true)}
            </select>
          </div>
          <div class="updates-month-toolbar-right flex flex-col gap-2">
            <button type="button" class="updates-month-call-btn w-full sm:w-auto px-6 py-2 bg-primary text-white font-black rounded-xl text-[10px] uppercase shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed" disabled>Llamar Ahora</button>
            <button type="button" class="updates-month-schedule-btn w-full sm:w-auto px-6 py-2 bg-white/5 border border-white/5 text-white font-bold rounded-xl text-[10px] uppercase hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed" disabled>Programar</button>
          </div>
        </div>
        <div class="updates-reminder-preview px-6 pb-6 hidden" id="preview-${escapeHtml(group.key)}">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2 text-[9px] font-black text-primary/60 uppercase tracking-[0.2em]">
                    <span class="material-symbols-outlined text-[10px]">terminal</span>
                    Contenido del Lote:
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="previewLocalVoice('${escapeHtml(group.key)}')" class="flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/10 text-white text-[8px] font-black rounded uppercase tracking-widest hover:bg-primary transition-all">
                        <span class="material-symbols-outlined text-[10px]">play_circle</span>
                        Escuchar
                    </button>
                    <button onclick="saveLocalTemplate('${escapeHtml(group.key)}')" id="save-btn-${escapeHtml(group.key)}" class="px-2 py-1 bg-primary text-white text-[8px] font-black rounded uppercase tracking-widest hidden transition-all">
                        Guardar
                    </button>
                </div>
            </div>
            <textarea 
                oninput="handlePreviewInput('save-btn-${escapeHtml(group.key)}')"
                class="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-[10px] text-zinc-400 font-medium leading-relaxed focus:border-primary/30 outline-none min-h-[60px] resize-none"
                placeholder="Escribe las instrucciones aquí..."></textarea>
        </div>
        <div class="updates-domain-list">
          ${itemCount === 0 
            ? `<div class="updates-empty-state">No hay dominios en este cuadro.</div>`
            : pagedItems.map(u => `
              <article class="update-row group" data-month-key="${escapeHtml(group.key)}" onclick="const cb = this.querySelector('.update-checkbox'); if(cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change', { bubbles: true })); }">
                <div class="update-list-check" onclick="event.stopPropagation()">
                  <input type="checkbox" class="update-checkbox h-4 w-4 rounded-full border border-white/15 bg-black/40 cursor-pointer transition-all outline-none" data-id="${u.id}">
                </div>
                <div class="update-list-content">
                  <div class="update-list-main">
                    <div class="flex items-center gap-2">
                      <h4 class="update-list-title">${escapeHtml(u.domain)}</h4>
                      ${(() => {
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        const target = new Date(u.execution_date);
                        target.setHours(0,0,0,0);
                        const diffTime = target - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        let badgeClass = 'bg-zinc-800 text-zinc-400';
                        let label = '';

                        if (diffDays === 0) {
                          badgeClass = 'bg-rose-500/20 text-rose-500 border border-rose-500/30 animate-pulse';
                          label = 'Vence Hoy';
                        } else if (diffDays > 0 && diffDays <= 7) {
                          badgeClass = 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
                          label = `Faltan ${diffDays}d`;
                        } else if (diffDays > 0 && diffDays <= 30) {
                          badgeClass = 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
                          label = `Faltan ${diffDays}d`;
                        } else if (diffDays < 0) {
                          badgeClass = 'bg-zinc-900 text-zinc-500 border border-white/5';
                          label = `Venció hace ${Math.abs(diffDays)}d`;
                        } else {
                          return ''; 
                        }
                        
                        return `<span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${badgeClass}">${label}</span>`;
                      })()}
                    </div>
                    <p class="update-list-phone">${escapeHtml(u.phone || '—')}</p>
                  </div>
                  <div class="update-list-meta">
                    <span class="update-list-date">${(() => {
                      const p = String(u.execution_date || '').split('-');
                      if (p.length < 3) return '—';
                      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
                      return `${p[2]} ${months[parseInt(p[1], 10)-1]}`;
                    })()}</span>
                    <div class="flex items-center gap-1 ml-2">
                      <button class="p-1 text-primary hover:scale-125 transition-all" onclick="event.stopPropagation(); window.previewIndividualVoice('${u.id}', '${escapeHtml(group.key)}')">
                        <span class="material-symbols-outlined text-[14px]">play_circle</span>
                      </button>
                      <button class="p-1 text-slate-400 hover:text-primary transition-colors" onclick="event.stopPropagation(); window.openEditUpdateModal('${u.id}')">
                        <span class="material-symbols-outlined text-[14px]">edit</span>
                      </button>
                      <button class="p-1 text-slate-400 hover:text-rose-500 transition-colors" onclick="event.stopPropagation(); window.deleteUpdateRow('${u.id}')">
                        <span class="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            `).join('')
          }
        </div>
        ` : ''}
        ${!isCollapsed && totalPages > 1 ? `
        <div class="px-6 pb-6 flex items-center justify-center gap-4">
            <button onclick="window.changeBoxPage('${escapeHtml(group.key)}', -1)" class="p-2 bg-white/5 border border-white/5 rounded-lg text-white hover:bg-primary transition-all disabled:opacity-20" ${currentPage === 1 ? 'disabled' : ''}>
                <span class="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span class="text-[10px] font-black text-primary/60 uppercase tracking-widest">Página ${currentPage} de ${totalPages}</span>
            <button onclick="window.changeBoxPage('${escapeHtml(group.key)}', 1)" class="p-2 bg-white/5 border border-white/5 rounded-lg text-white hover:bg-primary transition-all disabled:opacity-20" ${currentPage === totalPages ? 'disabled' : ''}>
                <span class="material-symbols-outlined text-sm">chevron_right</span>
            </button>
        </div>
        ` : ''}
      </section>
    `;
    }).join('');
    console.log('[ViaAI] Render complete.');
    
    // Add click event for "Add to month" buttons
    document.querySelectorAll('.add-to-month-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const month = btn.dataset.month;
        const year = btn.dataset.year;
        if (updatesAddBtn) {
          updatesAddBtn.click();
          const dateInput = document.getElementById('new-update-date');
          if (dateInput) {
            const today = new Date();
            const day = Math.min(today.getDate(), new Date(year, month, 0).getDate());
            dateInput.value = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          }
        }
      });
    });
    
    document.querySelectorAll('.update-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        paintUpdateCheckboxState(cb);
        updateSelectedCount();
      });
    });

    document.querySelectorAll('.updates-month-select-all').forEach(toggle => {
      toggle.addEventListener('change', () => {
        const monthKey = toggle.dataset.monthKey;
        document.querySelectorAll(`.update-row[data-month-key="${monthKey}"] .update-checkbox`).forEach(cb => {
          cb.checked = toggle.checked;
          paintUpdateCheckboxState(cb);
        });
        updateSelectedCount();
      });
    });

    document.querySelectorAll('.updates-month-call-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const toolbar = btn.closest('.updates-month-toolbar');
        const monthKey = toolbar?.dataset.monthKey;
        const promptId = toolbar?.querySelector('.updates-month-reminder')?.value || '';
        const selectedIds = Array.from(document.querySelectorAll(`.update-row[data-month-key="${monthKey}"] .update-checkbox:checked`)).map(cb => cb.dataset.id);
        await triggerUpdatesBatchAction({ selectedIds, promptId, mode: 'call', triggerButton: btn });
      });
    });

    document.querySelectorAll('.updates-month-schedule-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const toolbar = btn.closest('.updates-month-toolbar');
        const monthKey = toolbar?.dataset.monthKey;
        const promptId = toolbar?.querySelector('.updates-month-reminder')?.value || '';
        const selectedIds = Array.from(document.querySelectorAll(`.update-row[data-month-key="${monthKey}"] .update-checkbox:checked`)).map(cb => cb.dataset.id);
        await triggerUpdatesBatchAction({ selectedIds, promptId, mode: 'schedule', triggerButton: btn });
      });
    });

    setTimeout(initPremiumSelects, 50);
  }

  window.changeBoxPage = (key, delta) => {
      if (!window.boxPaginationState) window.boxPaginationState = {};
      const current = window.boxPaginationState[key] || 1;
      window.boxPaginationState[key] = current + delta;
      renderUpdatesTable(currentUpdates);
  };

  window.toggleBoxCollapse = (key) => {
      if (!window.boxCollapseState) window.boxCollapseState = {};
      window.boxCollapseState[key] = !(window.boxCollapseState[key] || false);
      renderUpdatesTable(currentUpdates);
  };

  window.previewIndividualVoice = async (id, groupKey) => {
      const update = currentUpdates.find(u => String(u.id) === String(id));
      if (!update) {
          console.warn('[ViaAI] No se encontro el registro para previsualizar audio:', id, groupKey);
          appAlert('No se encontró el registro para reproducir la vista previa.', true);
          return;
      }

      const toolbar = document.querySelector(`.updates-month-toolbar[data-month-key="${groupKey}"]`);
      const promptId = toolbar?.querySelector('.updates-month-reminder')?.value;
      const previewArea = document.getElementById(`preview-${groupKey}`);
      const textarea = previewArea?.querySelector('textarea');
      
      if (!promptId) {
          appAlert('Por favor selecciona un recordatorio en la parte superior del cuadro para poder escuchar la vista previa.', true);
          return;
      }

      const prompt = currentReminderPrompts.find(p => p.id === promptId);
      if (!prompt) return;

      // Use the generic personalization logic
      const fullText = textarea?.value?.trim() || `${prompt.greeting || ''}\n\n${prompt.text || ''}`.trim();
      const personalized = getPersonalizedPreviewText(fullText, update.domain);
      
      console.log('[ViaAI] Playback session started for individual domain:', update.domain);
      playNeuralStream(personalized);
  };

  function paintUpdateCheckboxState(cb) {
    if (!cb) return;
    const row = cb.closest('.update-row');
    if (row) {
      row.classList.toggle('is-selected', cb.checked);
    }
    cb.classList.toggle('is-checked', cb.checked);
  }

  function updateSelectedCount() {
    const checkboxes = Array.from(document.querySelectorAll('.update-checkbox'));
    const selected = checkboxes.filter(cb => cb.checked).length;
    if (updatesSelectedCount) updatesSelectedCount.textContent = selected;
    if (updatesCallNowBtn) updatesCallNowBtn.disabled = true;
    if (updatesScheduleBtn) updatesScheduleBtn.disabled = true;
    if (updatesSelectAll) {
      updatesSelectAll.checked = checkboxes.length > 0 && selected === checkboxes.length;
      updatesSelectAll.indeterminate = selected > 0 && selected < checkboxes.length;
    }

    document.querySelectorAll('.updates-month-toolbar').forEach(toolbar => {
      const monthKey = toolbar.dataset.monthKey;
      const monthCheckboxes = Array.from(document.querySelectorAll(`.update-row[data-month-key="${monthKey}"] .update-checkbox`));
      const monthSelected = monthCheckboxes.filter(cb => cb.checked).length;
      const countEl = toolbar.querySelector('.updates-month-selected-count');
      const monthSelectAll = toolbar.querySelector('.updates-month-select-all');
      const monthCallBtn = toolbar.querySelector('.updates-month-call-btn');
      const monthScheduleBtn = toolbar.querySelector('.updates-month-schedule-btn');
      if (countEl) countEl.textContent = monthSelected;
      if (monthSelectAll) {
        monthSelectAll.checked = monthCheckboxes.length > 0 && monthSelected === monthCheckboxes.length;
        monthSelectAll.indeterminate = monthSelected > 0 && monthSelected < monthCheckboxes.length;
        paintUpdateCheckboxState(monthSelectAll);
      }
      if (monthCallBtn) monthCallBtn.disabled = monthSelected === 0;
      if (monthScheduleBtn) monthScheduleBtn.disabled = monthSelected === 0;
    });

    if (updatesSelectAll) {
      const allCheckboxes = document.querySelectorAll('.update-checkbox');
      const totalSelected = Array.from(allCheckboxes).filter(cb => cb.checked).length;
      updatesSelectAll.checked = allCheckboxes.length > 0 && totalSelected === allCheckboxes.length;
      updatesSelectAll.indeterminate = totalSelected > 0 && totalSelected < allCheckboxes.length;
      paintUpdateCheckboxState(updatesSelectAll);
    }
  }

  async function triggerUpdatesBatchAction({ selectedIds, promptId, mode, triggerButton }) {
    if (!selectedIds?.length) return appAlert('Selecciona al menos un dominio.', true);
    if (!promptId) return appAlert('Por favor selecciona un recordatorio.', true);
    const customPayload = getBatchCustomPayload(promptId, triggerButton);

    if (mode === 'call') {
      try {
        if (triggerButton) {
          triggerButton.disabled = true;
          triggerButton.textContent = 'PROCESANDO...';
        }
        const resp = await fetch('/api/updates/schedule-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updateIds: selectedIds, promptId, ...(customPayload || {}) })
        });
        const result = await resp.json();
        if (result.success) {
          appAlert(`Éxito: ${result.scheduled} llamadas han sido encoladas.`);
          switchTab('campaigns');
        } else {
          appAlert(`Error: ${result.error}`, true);
        }
      } catch (e) {
        appAlert('Error de conexión', true);
      } finally {
        if (triggerButton) {
          triggerButton.disabled = false;
          triggerButton.textContent = triggerButton.classList.contains('updates-month-call-btn') ? 'Llamar Ahora' : 'LLAMAR AHORA';
        }
      }
      return;
    }

    const scheduleConfig = await appSchedule({
      message: 'Define cada cuánto y cuántas veces se ejecutará este lote.',
      intervalHours: 2,
      repeatCount: 1
    });
    if (!scheduleConfig) return;

    try {
      if (triggerButton) {
        triggerButton.disabled = true;
        triggerButton.textContent = 'PROGRAMANDO...';
      }
      const resp = await fetch('/api/updates/schedule-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updateIds: selectedIds,
          promptId,
          repeatEveryHours: scheduleConfig.intervalHours,
          repeatCount: scheduleConfig.repeatCount,
          ...(customPayload || {})
        })
      });
      const result = await resp.json();
      if (result.success) {
        appAlert(`Éxito: ${result.scheduled} llamadas programadas. Se ejecutarán ${scheduleConfig.repeatCount} veces, cada ${scheduleConfig.intervalHours} hora${scheduleConfig.intervalHours === 1 ? '' : 's'}.`);
      } else {
        appAlert(`Error: ${result.error}`, true);
      }
    } catch (e) {
      appAlert('Error de conexión', true);
    } finally {
      if (triggerButton) {
        triggerButton.disabled = false;
        triggerButton.textContent = triggerButton.classList.contains('updates-month-schedule-btn') ? 'Programar' : 'PROGRAMAR';
      }
    }
  }

  updatesRefreshBtn?.addEventListener('click', window.loadUpdates);
  updatesFilterMonth?.addEventListener('change', () => {
    syncUpdatesMonthGrid();
    window.loadUpdates();
  });
  updatesMonthChips.forEach(chip => {
    chip.addEventListener('click', () => {
      if (!updatesFilterMonth) return;
      updatesFilterMonth.value = chip.dataset.month || '';
      syncUpdatesMonthGrid();
      window.loadUpdates();
    });
  });
  syncUpdatesMonthFilter('');
  
  let searchTimeout;
  updatesSearch?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(window.loadUpdates, 500);
  });
  
  updatesSelectAll?.addEventListener('change', () => {
    document.querySelectorAll('.update-checkbox, .updates-month-select-all').forEach(cb => {
      cb.checked = updatesSelectAll.checked;
      paintUpdateCheckboxState(cb);
    });
    updateSelectedCount();
  });

  window.renameCategory = async (oldName) => {
    const newName = await appPrompt(`Renombrar cuadro "${oldName}" a:`, oldName);
    if (!newName || newName === oldName) return;

    const itemsToUpdate = currentUpdates.filter(u => {
      const match = u.notes?.match(/\[CAT:(.*?)\]/);
      return match && match[1].trim().toUpperCase() === oldName.toUpperCase();
    });

    if (itemsToUpdate.length === 0) return;

    let successCount = 0;
    for (const item of itemsToUpdate) {
      const match = item.notes.match(/\[CAT:(.*?)\]/);
      const currentCatTag = match[0];
      const newNotes = item.notes.replace(currentCatTag, `[CAT:${newName.toUpperCase()}]`);
      try {
        const resp = await fetch(`/api/updates/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: newNotes })
        });
        if (resp.ok) successCount++;
      } catch (e) {  }
    }

    if (successCount > 0) {
      appAlert(`✅ Cuadro renombrado a "${newName}".`);
      window.loadUpdates();
    }
  };

  window.deleteCategory = async (catName) => {
    const confirm = await appPrompt(`¿Deseas ELIMINAR COMPLETAMENTE el cuadro "${catName}" y todos sus dominios asociados?\nEscribe "ELIMINAR" para confirmar:`, 'ELIMINAR');
    if (confirm !== 'ELIMINAR') return;

    try {
      const resp = await fetch(`/api/updates/category/${encodeURIComponent(catName)}`, {
        method: 'DELETE'
      });
      if (resp.ok) {
        appAlert(`✅ Cuadro "${catName}" eliminado exitosamente.`);
        window.loadUpdates();
      } else {
        appAlert('Error al eliminar el cuadro.', true);
      }
    } catch (e) {
      appAlert('Error de conexión', true);
    }
  };

  updatesCallNowBtn?.addEventListener('click', async () => {
    appAlert('Las acciones de lote se ejecutan desde cada cuadro.', true);
  });

  updatesScheduleBtn?.addEventListener('click', async () => {
    appAlert('Las acciones de lote se ejecutan desde cada cuadro.', true);
  });

  // Global Preview logic
  const updatesBatchReminderArea = document.getElementById('updates-global-preview');
  const globalPreviewTextarea = document.getElementById('global-preview-textarea');
  const saveGlobalPreviewBtn = document.getElementById('save-global-preview-btn');

  document.getElementById('updates-batch-reminder')?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val && reminderTemplates[val]) {
      updatesBatchReminderArea.classList.remove('hidden');
      globalPreviewTextarea.value = reminderTemplates[val].text || '';
      saveGlobalPreviewBtn.classList.add('hidden');
    } else {
      updatesBatchReminderArea.classList.add('hidden');
    }
  });

  globalPreviewTextarea?.addEventListener('input', () => {
    saveGlobalPreviewBtn.classList.remove('hidden');
  });

  saveGlobalPreviewBtn?.addEventListener('click', () => {
    const val = document.getElementById('updates-batch-reminder').value;
    if (val && reminderTemplates[val]) {
      reminderTemplates[val].text = globalPreviewTextarea.value;
      appAlert(`✅ Instrucciones de "${val}" actualizadas.`);
      saveGlobalPreviewBtn.classList.add('hidden');
    }
  });

  window.updateBatchPreview = (selectEl) => {
    const toolbar = selectEl.closest('.updates-month-toolbar');
    if (!toolbar) return;
    
    const key = toolbar.dataset.monthKey;
    const previewArea = document.getElementById(`preview-${key}`);
    const textarea = previewArea?.querySelector('textarea');
    const saveBtn = previewArea?.querySelector('button');
    
    const val = selectEl.value;
    const prompt = currentReminderPrompts.find(p => p.id === val);
    
    if (previewArea && prompt) {
      previewArea.classList.remove('hidden');
      if (textarea) {
        textarea.value = (prompt.greeting ? prompt.greeting + '\n\n' : '') + (prompt.text || '');
        if (saveBtn) saveBtn.classList.add('hidden');
      }
    } else if (previewArea) {
      previewArea.classList.add('hidden');
    }
  };

  window.saveLocalTemplate = (key) => {
    const previewArea = document.getElementById(`preview-${key}`);
    const textarea = previewArea?.querySelector('textarea');
    const saveBtn = previewArea?.querySelector('button');
    
    const toolbar = previewArea.previousElementSibling;
    const select = toolbar.querySelector('.updates-month-reminder');
    const tplId = select.value;
    const prompt = currentReminderPrompts.find(p => p.id === tplId);

    if (prompt && textarea) {
      // In a real app we might want to save this to DB, 
      // but for now we update the local object so it persists during the session
      prompt.text = textarea.value;
      appAlert(`✅ Cambios temporales para "${prompt.name}" guardados.`);
      if (saveBtn) saveBtn.classList.add('hidden');
    }
  };

  window.handlePreviewInput = (btnId) => {
    const btn = document.getElementById(btnId);
    if (btn) btn.classList.remove('hidden');
  };

  /**
   * REPRODUCTOR NEURAL: Envía el texto al servidor TTS y reproduce el stream MP3
   */
  async function playNeuralStream(text) {
      if (!text) return;
      try {
          console.log('[ViaAI] Neural Stream Request:', text.substring(0, 40));
          showPreviewBar();
          if (previewPulse) previewPulse.classList.add('animate-pulse');
          if (!previewAudio) throw new Error('No se encontró el reproductor de audio');

          const previousUrl = previewAudio.dataset.objectUrl;
          if (previousUrl) {
              URL.revokeObjectURL(previousUrl);
              delete previewAudio.dataset.objectUrl;
          }

          const resp = await fetch('/api/tts-preview', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text })
          });
          
          if (!resp.ok) {
              const err = await resp.json();
              throw new Error(err.error || 'Servidor de voz ocupado');
          }
          
          const blob = await resp.blob();
          if (blob.size < 100) throw new Error('Audio generado vacío (verificar API Key)');

          const url = URL.createObjectURL(blob);
          previewAudio.src = url;
          previewAudio.dataset.objectUrl = url;
          previewAudio.load();
          
          // Requerido para Chrome: Manejar la promesa de play()
          const playPromise = previewAudio.play();
          if (playPromise !== undefined) {
              playPromise.then(() => {
                  if (previewPulse) previewPulse.classList.remove('animate-pulse');
                  console.log('[ViaAI] Reproducción exitosa.');
              }).catch(error => {
                  console.warn('[ViaAI] Autoplay bloqueado o fallo:', error);
                  appAlert('Haz clic en cualquier parte de la página y vuelve a intentarlo para activar el audio.', true);
              });
          }
      } catch (e) {
          console.error('[ViaAI] Playback Failure:', e);
          appAlert(`Error de voz: ${e.message}`, true);
      }
  }

  const getCurrentTimeGreeting = () => {
    const hour = Number(new Intl.DateTimeFormat('es-PE', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'America/Lima'
    }).format(new Date()));

    if (hour >= 5 && hour < 12) return 'Buenos dias';
    if (hour >= 12 && hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const formatDomainForSpeech = (value) => {
    if (!value) return '';
    return String(value)
      .replace(/^www\./i, 'doble u doble u doble u punto ')
      .replace(/\./g, ' punto ')
      .replace(/-/g, ' guion ')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const applyTimeGreeting = (text) => {
    if (!text) return text;
    const greeting = getCurrentTimeGreeting();
    return text
      .replace(/Buenas\s*\(\)/gi, greeting)
      .replace(/\(\)/g, greeting)
      .replace(/\bBuenos\s+d[ií]as\b/gi, greeting)
      .replace(/\bBuenas\s+tardes\b/gi, greeting)
      .replace(/\bBuenas\s+noches\b/gi, greeting);
  };

  const normalizeSpeechText = (text) => {
    if (!text) return '';

    return text
      .replace(/[“”"]/g, '')
      .replace(/\bVIA\s+COMUNICATIVA\b/gi, 'Via Comunicativa')
      .replace(/publicidad que marca tu e[xx][ií]to/gi, 'publicidad que impulsa tu exito')
      .replace(/\bs\/\.?\s?(\d+)(?:\.(\d{1,2}))?/gi, (_, amount, cents) => {
        if (cents) return `${amount} con ${cents} soles`;
        return `${amount} soles`;
      })
      .replace(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g, '$1 $2 $3')
      .replace(/[;:]+/g, ', ')
      .replace(/\.{3,}/g, ', ')
      .replace(/\s+,/g, ',')
      .replace(/\s+\./g, '.')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const injectDomainContext = (text, domainValue) => {
    if (!text) return text;

    const patterns = [
      /\bdominio\b\s*(?:\.{2,}|…)/gi,
      /\bservicio\s+web\b\s*(?:\.{2,}|…)/gi,
      /\bsitio\s+web\b\s*(?:\.{2,}|…)/gi,
      /\bdesarrollo\s+web\b\s*(?:\.{2,}|…)/gi,
      /\bp[aá]gina\s+web\b\s*(?:\.{2,}|…)/gi,
      /\bproyecto\s+web\b\s*(?:\.{2,}|…)/gi
    ];

    let result = text;
    for (const pattern of patterns) {
      result = result.replace(pattern, (match) => {
        const base = match.replace(/\s*(?:\.{2,}|…)\s*$/g, '').trim();
        return `${base} ${domainValue}`;
      });
    }

    return result;
  };

  function getPersonalizedPreviewText(text, overrideDomain = null) {
    if (!text) return "";
    let final = normalizeSpeechText(applyTimeGreeting(text));
    
    // 1. Tratamiento de Moneda (S/.) -> "soles"
    // Buscamos patrones como s/.250 o s/ 250 o s/250.00
    final = final.replace(/s\/\.?\s?(\d+)(\.\d+)?/gi, (match, p1) => {
        return `${p1} soles `;
    });

    // 2. Personalización de Dominio
    let domainName = overrideDomain;
    
    if (!domainName) {
        const selectedCheckboxes = document.querySelectorAll('.update-checkbox:checked');
        if (selectedCheckboxes.length > 0) {
            const firstRow = selectedCheckboxes[0].closest('.update-row');
            domainName = firstRow?.querySelector('.update-list-title')?.textContent.trim() || "";
        }
    }
    
    if (domainName) {
        let phoneticDomain = formatDomainForSpeech(domainName);
        final = injectDomainContext(final, phoneticDomain);
    } else {
        final = injectDomainContext(final, 'su pagina web');
    }

    // 3. Tratamiento de Números (1 por 1 solo para teléfonos, no para montos)
    // Buscamos números de 7 o más cifras (probablemente teléfonos) para leerlos dígito a dígito
    final = final.replace(/\d{7,15}/g, (match) => {
        return match.split('').join(' ');
    });
    
    // Limpieza final de espacios
    return final.replace(/\s+/g, ' ').trim();
  }

  function getBatchCustomPayload(promptId, contextEl = null) {
    const prompt = currentReminderPrompts.find(p => p.id === promptId);
    if (!prompt) return null;

    let textarea = null;
    if (contextEl) {
      const toolbar = contextEl.closest('.updates-month-toolbar');
      if (toolbar) {
        const previewArea = document.getElementById(`preview-${toolbar.dataset.monthKey}`);
        textarea = previewArea?.querySelector('textarea') || null;
      }
    } else {
      textarea = globalPreviewTextarea || null;
    }

    if (!textarea) {
      textarea = globalPreviewTextarea || null;
    }

    const rawText = textarea?.value?.trim();
    if (!rawText) return null;

    const defaultText = `${prompt.greeting || ''}\n\n${prompt.text || ''}`.trim();
    if (rawText === defaultText) return null;

    const blocks = rawText.split(/\n\s*\n/).map(chunk => chunk.trim()).filter(Boolean);
    if (!blocks.length) return null;

    if (blocks.length === 1) {
      return { customGreeting: '', customInstructions: blocks[0] };
    }

    return {
      customGreeting: blocks.shift() || '',
      customInstructions: blocks.join('\n\n')
    };
  }

  document.getElementById('preview-global-voice-btn')?.addEventListener('click', () => {
    const text = globalPreviewTextarea.value;
    if (!text) return;
    const personalized = getPersonalizedPreviewText(text);
    playNeuralStream(personalized);
  });

  previewVoiceSettingsBtn?.addEventListener('click', async () => {
    const text = voicePreviewText?.value?.trim();
    if (!text) return appAlert('Escribe un texto para probar la voz.', true);

    const payload = {
      voiceId: voiceIdInput?.value.trim(),
      modelId: voiceModelInput?.value.trim(),
      speed: Number(voiceSpeedInput?.value || 1),
      stability: Number(voiceStabilityInput?.value || 0.5),
      similarityBoost: Number(voiceSimilarityInput?.value || 0.8),
      style: Number(voiceStyleInput?.value || 0),
      latencyOptimization: Number(voiceLatencyInput?.value || 0),
      applyTextNormalization: voiceNormalizationInput?.value || 'auto',
      useSpeakerBoost: !!voiceSpeakerBoostInput?.checked
    };

    previewVoiceSettingsBtn.disabled = true;
    previewVoiceSettingsBtn.innerHTML = '<span class="material-symbols-outlined text-[14px]">hourglass_top</span> Probando';
    try {
      const saveResp = await fetch('/api/voice-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const saveData = await saveResp.json();
      if (!saveResp.ok) throw new Error(saveData.error || 'No se pudo aplicar la configuración');
      fillVoiceSettingsForm(saveData.data || payload);

      const personalized = getPersonalizedPreviewText(text);
      await playNeuralStream(personalized);
    } catch (e) {
      console.error(e);
      appAlert(`Error al probar la voz: ${e.message}`, true);
    } finally {
      previewVoiceSettingsBtn.disabled = false;
      previewVoiceSettingsBtn.innerHTML = '<span class="material-symbols-outlined text-[14px]">play_circle</span> Probar';
    }
  });

  window.previewLocalVoice = (key) => {
    const previewArea = document.getElementById(`preview-${key}`);
    const textarea = previewArea?.querySelector('textarea');
    if (!textarea || !textarea.value) return;
    const personalized = getPersonalizedPreviewText(textarea.value);
    playNeuralStream(personalized);
  };

  window.openNewUpdateInBox = (category = '', month = null) => {
    editingUpdateId = null;
    newUpdateForm.reset();
    
    const title = newUpdateModal.querySelector('h3');
    const submitBtn = newUpdateForm.querySelector('button[type="submit"]');
    if (title) title.textContent = 'Nuevo Registro';
    if (submitBtn) submitBtn.textContent = 'GUARDAR REGISTRO';

    document.getElementById('new-update-category').value = category;
    
    const dateInput = document.getElementById('new-update-date');
    if (month && dateInput) {
       const now = new Date();
       const year = now.getFullYear();
       const day = Math.min(now.getDate(), new Date(year, month, 0).getDate());
       dateInput.value = getLocalDateInputValue(new Date(year, month - 1, day));
    } else if (dateInput) {
       dateInput.value = getLocalDateInputValue();
    }

    newUpdateModal.classList.add('visible');
    setTimeout(() => document.getElementById('new-update-domain').focus(), 100);
  };

  // Quick Box Creation
  document.getElementById('updates-add-category-btn')?.addEventListener('click', async () => {
    const catName = await appPrompt('Nombre del nuevo Cuadro:', 'Ej: VIP, Campaña Mayo, Urgentes...');
    if (!catName) return;

    try {
      const resp = await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain: 'CABECERA_DE_CUADRO', 
          phone: '---', 
          execution_date: getLocalDateInputValue(), 
          notes: `[CAT:${catName}] Este es un cuadro nuevo.` 
        })
      });
      if (resp.ok) {
        appAlert(`✅ Cuadro "${catName}" creado.`);
        window.loadUpdates();
      }
    } catch (e) {
      appAlert('Error al crear cuadro', true);
    }
  });

  // Modal: Nuevo Registro Manual
  const newUpdateModal = document.getElementById('new-update-modal');
  const newUpdateForm = document.getElementById('new-update-form');
  const updatesAddBtn = document.getElementById('updates-add-btn');
  
  let editingUpdateId = null;

  window.openEditUpdateModal = (id) => {
    const update = currentUpdates.find(u => String(u.id) === String(id));
    if (!update) return;

    editingUpdateId = id;
    
    // Change modal title and button text
    const title = newUpdateModal.querySelector('h3');
    const subtitle = newUpdateModal.querySelector('p');
    const submitBtn = newUpdateForm.querySelector('button[type="submit"]');

    if (title) title.textContent = 'Editar Registro';
    if (subtitle) subtitle.textContent = `Editando: ${update.domain}`;
    if (submitBtn) submitBtn.textContent = 'ACTUALIZAR REGISTRO';

    // Fill fields
    document.getElementById('new-update-domain').value = update.domain || '';
    document.getElementById('new-update-phone').value = update.phone || '';
    document.getElementById('new-update-date').value = update.execution_date || '';
    
    // Check for custom category
    const noteContent = update.notes || '';
    const catMatch = noteContent.match(/\[CAT:(.*?)\]/);
    document.getElementById('new-update-category').value = catMatch ? catMatch[1] : '';
    document.getElementById('new-update-notes').value = noteContent.replace(/\[CAT:.*?\]/, '').trim();

    newUpdateModal.classList.add('visible');
  };

  window.deleteUpdateRow = async (id) => {
    const update = currentUpdates.find(u => String(u.id) === String(id));
    if (!update) return;

    const confirm = await appPrompt(`¿Seguro que deseas ELIMINAR el registro de ${update.domain}?\nEscribe "ELIMINAR" para confirmar:`, 'ELIMINAR');
    if (confirm !== 'ELIMINAR') return;

    try {
        const resp = await fetch(`/api/updates/${id}`, { method: 'DELETE' });
        if (resp.ok) {
            appAlert('✅ Registro eliminado de la matriz.');
            window.loadUpdates();
        } else {
            appAlert('Error al eliminar registro.', true);
        }
    } catch (e) { appAlert('Error de conexión', true); }
  };

  document.getElementById('new-update-phone')?.addEventListener('blur', (e) => {
    const val = e.target.value.trim();
    if (/^\d{9}$/.test(val)) {
      e.target.value = formatToE164(val);
    }
  });

  document.getElementById('update-modal-close')?.addEventListener('click', () => newUpdateModal.classList.remove('visible'));
  document.getElementById('update-modal-cancel')?.addEventListener('click', () => newUpdateModal.classList.remove('visible'));
  newUpdateModal?.addEventListener('click', (e) => { if (e.target === newUpdateModal) newUpdateModal.classList.remove('visible'); });

  newUpdateForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const domain = document.getElementById('new-update-domain').value.trim();
    const rawPhone = document.getElementById('new-update-phone').value.trim();
    const phone = formatToE164(rawPhone);
    const execution_date = document.getElementById('new-update-date').value;
    const notes = document.getElementById('new-update-notes').value.trim();

    if (!execution_date) return appAlert('La fecha de renovación es obligatoria.', true);

    try {
      btn.disabled = true;
      btn.textContent = 'GUARDANDO...';
      
      const method = editingUpdateId ? 'PUT' : 'POST';
      const url = editingUpdateId ? `/api/updates/${editingUpdateId}` : '/api/updates';

      // Inject [CAT:Name] if provided
      const customCategory = document.getElementById('new-update-category')?.value.trim();
      let finalNotes = notes.replace(/\[CAT:.*?\]/g, '').trim(); // Remove existing tags
      if (customCategory) {
        finalNotes = `[CAT:${customCategory}] ${finalNotes}`.trim();
      }

      const resp = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, phone, execution_date, notes: finalNotes })
      });
      
      const result = await resp.json();
      if (resp.ok) {
        appAlert(editingUpdateId ? '✅ Cambios guardados exitosamente.' : '✅ Registro guardado exitosamente.');
        newUpdateModal.classList.remove('visible');
        if (editingUpdateId) {
            // Keep current month filter if editing
            window.loadUpdates();
        } else {
            syncUpdatesMonthFilter(getMonthFromDateInput(execution_date), { force: true });
            window.loadUpdates(); // Refresh table
        }
      } else {
        appAlert(`Error: ${result.error}`, true);
      }
    } catch (e) {
      appAlert('Error de conexión', true);
    } finally {
      btn.disabled = false;
      btn.textContent = editingUpdateId ? 'ACTUALIZAR REGISTRO' : 'GUARDAR REGISTRO';
    }
  });

      // Purgar recordatorios listener
      const purgeRemindersBtn = document.getElementById('purge-reminders-btn');
      if (purgeRemindersBtn) {
        purgeRemindersBtn.addEventListener('click', async () => {
          const confirmed = await appConfirm(
            'Se eliminarán todos los recordatorios pendientes.',
            { title: 'Confirmar purga', confirmText: 'Purgar' }
          );
          if (confirmed) {
            try {
              const resp = await fetch('/api/scheduled', { method: 'DELETE' });
              const result = await resp.json();
              if (result.success) {
                appAlert('Éxito: Se han eliminado todos los recordatorios pendientes.');
                if (typeof loadCallHistory === 'function') loadCallHistory();
              } else {
                appAlert(`Error: ${result.error || 'Error al purgar recordatorios.'}`, true);
              }
            } catch (e) {
              appAlert('Error de conexión', true);
            }
          }
        });
      }

      // Purgar historial listener
      const purgeHistoryBtn = document.getElementById('purge-history-btn');
      if (purgeHistoryBtn) {
        purgeHistoryBtn.addEventListener('click', async () => {
          const confirmed = await appConfirm(
            'Se eliminará permanentemente todo el historial de llamadas.',
            { title: 'Confirmar eliminación', confirmText: 'Borrar todo' }
          );
          if (confirmed) {
            try {
              const resp = await fetch('/api/history', { method: 'DELETE' });
              const result = await resp.json();
              if (result.success) {
                appAlert('Éxito: El historial de llamadas ha sido vaciado.');
                if (typeof loadCallHistory === 'function') loadCallHistory();
              } else {
                appAlert(`Error: ${result.error || 'No se pudo purgar el historial.'}`, true);
              }
            } catch (e) {
              appAlert('Error de conexión', true);
            }
          }
        });
      }

      // Load Initial Prompts and then init Premium Selects
      if (typeof loadPrompts === 'function') loadPrompts().then(initPremiumSelects);
      if (typeof loadReminderPrompts === 'function') loadReminderPrompts().then(initPremiumSelects);

      // Forzar carga inicial
      setTimeout(() => {
        if (templateSelect && templateSelect.value) {
          console.log('[ViaAI] Forcing initial template load for:', templateSelect.value);
          updateFields(templateSelect.value);
          initPremiumSelects();
        }
      }, 250);
    }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
      initDashboardApp();
      // Failsafe: force close any hanging modals on first render
      setTimeout(() => {
          document.getElementById('custom-prompt-modal')?.classList.remove('visible');
          document.getElementById('custom-alert-modal')?.classList.remove('visible');
          console.log('[ViaAI] Failsafe: Modals cleared.');
      }, 1500);
  });
} else {
  initDashboardApp();
  setTimeout(() => {
      document.getElementById('custom-prompt-modal')?.classList.remove('visible');
      document.getElementById('custom-alert-modal')?.classList.remove('visible');
  }, 1500);
}

// Clear legacy storage that might cause blockers
localStorage.removeItem('active_prompt_id');
localStorage.removeItem('active_reminder_prompt_id');
localStorage.removeItem('via_auth_token_retry');

/**
 * Dynamic UI: Change Button labels based on input
 */
function initDynamicUI() {
  const reminderTimeInput = document.getElementById('reminder-time');
  const reminderSubmitBtn = document.getElementById('reminder-submit-btn');

  if (reminderTimeInput && reminderSubmitBtn) {
    const updateButtonText = () => {
      if (reminderTimeInput.value) {
        reminderSubmitBtn.textContent = 'PROGRAMAR LLAMADA';
      } else {
        reminderSubmitBtn.textContent = 'LLAMAR AHORA';
      }
    };
    reminderTimeInput.addEventListener('input', updateButtonText);
    reminderTimeInput.addEventListener('change', updateButtonText);
    // Initial check
    updateButtonText();
  }
}

// Run after a short delay to ensure DOM is ready
setTimeout(initDynamicUI, 2000);

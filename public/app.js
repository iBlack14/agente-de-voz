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

  // ─── Tabs Navigation ──────────────────────────────
  const navItems = document.querySelectorAll('.nav-item');
  const tabs = document.querySelectorAll('.tab-content');
  const pageTitle = document.getElementById('page-title');
  const tabTitles = { 
    campaigns: 'Campañas de Voz', 
    prompts: 'Identidad del Agente', 
    reminders: 'Gestión de Recordatorios',
    history: 'Historial de Transmisiones',
    stats: 'Consumo Neural',
    monitor: 'Monitor en Vivo'
  };

  function switchTab(tabId) {
    navItems.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === tabId) btn.classList.add('active');
    });

    tabs.forEach(tab => {
      tab.classList.remove('active');
      if (tab.id === `tab-${tabId}`) tab.classList.add('active');
    });
    pageTitle.textContent = tabTitles[tabId] || 'Neural Dashboard';
  }

    navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      switchTab(tabId);
      if (tabId === 'history') loadCallHistory();
      if (tabId === 'stats') updateConsumptionOverview();
    });
  });

  // ─── Logout Premium UI ─────────────────────────────
  const logoutBtn = document.getElementById('logout-btn');
  const logoutModal = document.getElementById('logout-confirm-modal');
  const logoutConfirm = document.getElementById('logout-confirm-btn');
  const logoutCancel = document.getElementById('logout-cancel');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => logoutModal.classList.add('visible'));
    logoutCancel.addEventListener('click', () => logoutModal.classList.remove('visible'));
    logoutModal.addEventListener('click', (e) => { 
      if (e.target === logoutModal) logoutModal.classList.remove('visible'); 
    });

    logoutConfirm.addEventListener('click', async () => {
      logoutConfirm.textContent = '...';
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/login.html';
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
  const clearBtn = document.getElementById('clear-btn');
  const startBtn = document.getElementById('start-btn');
  const callList = document.getElementById('call-list');
  const emptyState = document.getElementById('empty-state');

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const createBatchMeta = (prefix, total) => {
    const stamp = Date.now();
    const hhmm = new Date(stamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return {
      batchId: `${prefix.toLowerCase()}-${stamp}`,
      batchLabel: `${prefix} (${total}) · ${hhmm}`
    };
  };

  clearBtn.addEventListener('click', () => {
    numberInput.value = '';
    callList.innerHTML = '';
    emptyState.style.display = 'flex';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawValue = numberInput.value;
    const lines = rawValue.split('\n').filter(l => l.trim().length > 0);
    const entries = [];
    
    lines.forEach(line => {
      const parts = line.split(/[,\s\t;|]+/).map(p => p.trim()).filter(p => p.length > 0);
      const num = (parts[0] || '').replace(/[^0-9+]/g, '');
      if (num.length >= 8) {
        // Capturar todo lo que sigue al número como contexto/dominio completo
        const extraData = line.substring(line.indexOf(parts[0]) + parts[0].length).replace(/^[,\s\t;|]+/, '').trim();
        entries.push({ number: num, domain: extraData || '' });
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
        const resp = await fetch('/make-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: entry.number,
            domain: entry.domain,
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
      if (document.getElementById('tab-history').classList.contains('active')) {
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

  let currentPrompts = [];
  let activeId = null;

  let currentReminderPrompts = [];
  let activeReminderId = null;

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
      const reminderPromptSelect = document.getElementById('reminder-prompt-select');
      if (reminderPromptSelect) {
          const options = currentReminderPrompts.map(p =>
            `<option value="${p.id}">${escapeHtml(p.name.toUpperCase())}</option>`
          ).join('');
          reminderPromptSelect.innerHTML = '<option value="">-- CARGAR GUIÓN GUARDADO --</option>' + options;
          reminderPromptSelect.value = ""; // Forzar que inicie en blanco
      }
    } catch (e) { console.error('Error cargando reminders:', e); }
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

  const reminderPromptSelect = document.getElementById('reminder-prompt-select');
  if (reminderPromptSelect) {
      reminderPromptSelect.addEventListener('change', async () => {
          if (!reminderPromptSelect.value) return;
          const p = currentReminderPrompts.find(p => p.id === reminderPromptSelect.value);
          if (p) {
               document.getElementById('reminder-greeting').value = p.greeting || '¡Hola!';
               document.getElementById('reminder-msg').value = p.text || '';
               // Ciberseguridad/Neural: Forzar a nivel global este prompt
               await fetch('/api/reminders/active', {
                   method: 'PUT', headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ id: p.id })
               });
               activeReminderId = p.id; // local state update
          }
      });
  }

  const btnSaveReminder = document.getElementById('btn-save-reminder-msg');
  if (btnSaveReminder) {
      btnSaveReminder.addEventListener('click', async () => {
          const greeting = document.getElementById('reminder-greeting').value.trim();
          const text = document.getElementById('reminder-msg').value.trim();
          if (!greeting) return appAlert('Debe existir al menos un Saludo Inicial antes de guardar el perfil.', true);
          
          let nameName = await appPrompt('Ingresa un título a nivel de matriz para localizar este guion AI (Ej. Promoción Renovación):', 'Promoción...');
          if (!nameName || !nameName.trim()) return;
          
          btnSaveReminder.innerHTML = '...';
          const newId = Date.now().toString();
          
          await fetch('/api/reminders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  id: newId,
                  name: nameName.trim(),
                  greeting: greeting,
                  text: text
              })
          });
          
          await loadPrompts();
          reminderPromptSelect.value = newId;
          
          // Automáticamente activarlo
          await fetch('/api/reminders/active', {
               method: 'PUT', headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ id: newId })
          });
          
          btnSaveReminder.innerHTML = '<span class="material-symbols-outlined text-[12px]">save</span> Guardar';
          appAlert('✅ Guión AI almacenado magnéticamente en los registros!');
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
      const select = document.getElementById('reminder-prompt-select');
      if (!select || !select.value) return appAlert('Selecciona un guion guardado para eliminar.', true);
      
      const confirm = await appPrompt('Escribe "ELIMINAR" para confirmar la purga de este guion de recordatorio:', 'ELIMINAR');
      if (confirm !== 'ELIMINAR') return;

      try {
        await fetch(`/api/reminders/${select.value}`, { method: 'DELETE' });
        appAlert('Guion de recordatorio purgado exitosamente.');
        document.getElementById('reminder-greeting').value = '';
        document.getElementById('reminder-msg').value = '';
        await loadPrompts();
      } catch (e) { appAlert('Error al purgar guion.', true); }
    });
  }

  loadPrompts();

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
  const historyRetryBtn = document.getElementById('history-retry-all-unanswered');
  const historyBatchContainer = document.getElementById('history-batch-container');

  let callsData = [];
  let historyBatchMap = new Map();

  function isOutboundCall(call) {
    return call?.direction === 'outbound' || call?.direction === 'outgoing';
  }

  function isCallConnected(call) {
    const connectedStatuses = new Set(['completed', 'ws_close', 'stop_event', 'terminated']);
    return connectedStatuses.has(String(call?.status || '').toLowerCase());
  }

  function classifyOutboundCall(call) {
    if (!isOutboundCall(call)) return 'skip';
    const duration = parseInt(call.durationSec ?? call.duration_sec, 10) || 0;
    if (isCallConnected(call) && duration > 5) return 'answered';
    if (isCallConnected(call) && duration <= 5) return 'unanswered';

    const status = String(call.status || '').toLowerCase();
    const failedStatuses = new Set(['failed', 'busy', 'no_answer', 'timeout', 'canceled', 'rejected']);
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

    if (historyOutboundTotal) historyOutboundTotal.textContent = String(outboundCalls.length);
    if (historyAnsweredCount) historyAnsweredCount.textContent = String(answered);
    if (historyUnansweredCount) historyUnansweredCount.textContent = String(unansweredCalls.length);
  }

  function buildHistoryBatchGroups() {
    const groups = new Map();
    const outboundCalls = callsData.filter(isOutboundCall);

    outboundCalls.forEach(call => {
      const fallbackKey = `legacy-${call.callId || call.startedAt || Math.random()}`;
      const key = call.batchId || fallbackKey;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label: call.batchLabel || (call.batchId ? `Lote ${call.batchId.slice(-6)}` : ''),
          calls: [],
          lastStartedAt: call.startedAt || null
        });
      }
      const g = groups.get(key);
      g.calls.push(call);
      if (call.startedAt && (!g.lastStartedAt || new Date(call.startedAt) > new Date(g.lastStartedAt))) {
        g.lastStartedAt = call.startedAt;
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      const aDate = a.lastStartedAt ? new Date(a.lastStartedAt).getTime() : 0;
      const bDate = b.lastStartedAt ? new Date(b.lastStartedAt).getTime() : 0;
      return bDate - aDate;
    });
  }

  function renderHistoryBatchCards() {
    if (!historyBatchContainer) return;

    const groups = buildHistoryBatchGroups();
    historyBatchMap = new Map(groups.map(g => [g.key, g]));

    if (!groups.length) {
      historyBatchContainer.innerHTML = `
        <div class="col-span-full opacity-30 py-8 text-center uppercase text-[9px] font-bold tracking-widest">
          Sin lotes salientes registrados
        </div>`;
      return;
    }

    historyBatchContainer.innerHTML = groups.map((group, idx) => {
      const answered = group.calls.filter(c => classifyOutboundCall(c) === 'answered').length;
      const unansweredCalls = group.calls.filter(c => classifyOutboundCall(c) === 'unanswered');
      const contacts = [];
      const seenNumbers = new Set();
      group.calls.forEach(call => {
        const number = getRetryTargetNumber(call);
        if (!number || seenNumbers.has(number)) return;
        seenNumbers.add(number);
        contacts.push({
          number,
          domain: (call.domain || '').trim(),
          status: classifyOutboundCall(call)
        });
      });
      const startedText = group.lastStartedAt
        ? new Date(group.lastStartedAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        : '—';
      const label = group.label || `Lote ${startedText}`;
      const detailsId = `batch-contacts-${idx}`;
      const preview = contacts.slice(0, 3).map(c => c.number).join(' · ');
      const moreCount = contacts.length > 3 ? contacts.length - 3 : 0;
      const rows = contacts.length
        ? contacts.map(c => {
            const statusChip = c.status === 'answered'
              ? '<span class="text-[8px] px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300 uppercase tracking-widest">Contestada</span>'
              : (c.status === 'unanswered'
                ? '<span class="text-[8px] px-2 py-0.5 rounded-full bg-error/15 text-error uppercase tracking-widest">No cont.</span>'
                : '<span class="text-[8px] px-2 py-0.5 rounded-full bg-zinc-700/40 text-zinc-300 uppercase tracking-widest">Pendiente</span>');
            return `<li class="flex items-center justify-between gap-3 rounded-lg bg-surface-container-lowest/60 border border-primary/10 px-3 py-2">
              <div class="min-w-0">
                <p class="text-[11px] font-bold text-on-surface truncate">${escapeHtml(c.number)}</p>
                <p class="text-[9px] text-zinc-400 truncate">${escapeHtml(c.domain || 'sin dominio')}</p>
              </div>
              ${statusChip}
            </li>`;
          }).join('')
        : '<p class="text-[9px] text-zinc-500 uppercase tracking-widest">Sin números legibles en este lote</p>';

      return `
        <article class="rounded-2xl border border-zinc-800/40 bg-surface-container-low/50 p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Lote</p>
              <h4 class="text-sm font-black text-white">${escapeHtml(label)}</h4>
              <p class="text-[9px] text-zinc-500 mt-1">${escapeHtml(startedText)}</p>
            </div>
            <span class="text-[8px] uppercase tracking-widest text-zinc-400 bg-zinc-800/70 px-2 py-1 rounded-full">${group.calls.length} llamadas</span>
          </div>
          <div class="grid grid-cols-2 gap-3 mt-4">
            <div class="rounded-xl bg-emerald-400/10 border border-emerald-400/20 p-3">
              <p class="text-[8px] uppercase tracking-widest text-emerald-300">Contestadas</p>
              <p class="text-xl font-black text-emerald-400">${answered}</p>
            </div>
            <div class="rounded-xl bg-error/10 border border-error/20 p-3">
              <p class="text-[8px] uppercase tracking-widest text-error">No contestadas</p>
              <p class="text-xl font-black text-error">${unansweredCalls.length}</p>
            </div>
          </div>
          <div class="mt-4 flex items-center justify-between gap-3">
            <div class="min-w-0 flex-1">
              <button
                data-target="${detailsId}"
                class="history-toggle-numbers text-[9px] uppercase tracking-widest font-bold text-zinc-300 hover:text-primary transition-colors"
              >
                Ver números
              </button>
              <p class="text-[9px] text-zinc-500 truncate mt-1">${escapeHtml(preview || 'sin números')}</p>
              ${moreCount > 0 ? `<p class="text-[8px] text-primary/80 uppercase tracking-widest mt-0.5">+${moreCount} más</p>` : ''}
            </div>
            <button
              data-batch-key="${escapeHtml(group.key)}"
              class="history-retry-batch px-4 py-2 rounded-lg bg-primary/15 border border-primary/30 text-primary text-[9px] font-bold uppercase tracking-widest hover:bg-primary/25 transition-all ${unansweredCalls.length ? '' : 'opacity-40 cursor-not-allowed'}"
              ${unansweredCalls.length ? '' : 'disabled'}
            >
              Reintentar este lote
            </button>
          </div>
          <div id="${detailsId}" class="hidden mt-3 rounded-xl border border-primary/15 bg-primary/5 p-3">
            <p class="text-[9px] uppercase tracking-widest text-primary/90 font-bold mb-2">Números del lote</p>
            <ul class="space-y-2 max-h-48 overflow-y-auto no-scrollbar">${rows}</ul>
          </div>
        </article>`;
    }).join('');

    historyBatchContainer.querySelectorAll('.history-retry-batch').forEach(btn => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.batchKey;
        const group = historyBatchMap.get(key);
        if (!group) return;
        const unanswered = group.calls.filter(c => classifyOutboundCall(c) === 'unanswered');
        await retryUnansweredCalls(unanswered, btn, `Reintento ${group.label}`);
      });
    });

    historyBatchContainer.querySelectorAll('.history-toggle-numbers').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const panel = document.getElementById(targetId);
        if (!panel) return;
        const opening = panel.classList.contains('hidden');
        panel.classList.toggle('hidden');
        btn.textContent = opening ? 'Ocultar números' : 'Ver números';
      });
    });
  }

  async function retryUnansweredCalls(unansweredCalls, buttonEl, batchLabelBase = 'Reintento') {
    const entries = buildRetryEntries(unansweredCalls);
    if (!entries.length) {
      appAlert('No hay llamadas no contestadas para reintentar.');
      return;
    }

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

    if (buttonEl) {
      buttonEl.disabled = true;
      buttonEl.dataset.originalLabel = buttonEl.textContent;
      buttonEl.textContent = 'REINTENTANDO...';
    }

    const retryBatchId = `retry-${Date.now()}`;
    const retryBatchLabel = `${batchLabelBase} (${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })})`;

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
      modalBody.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 opacity-20">
          <span class="material-symbols-outlined text-5xl mb-2">comments_disabled</span>
          <p class="text-xs font-bold uppercase tracking-widest">Sin transcripción</p>
        </div>`;
    } else {
      modalBody.innerHTML = transcript.map(msg => {
        const isUser = msg.role === 'user';
        const label = isUser ? 'Humano' : 'Inteligencia';
        const cls = isUser ? 'bg-white/10 ml-auto rounded-tr-none' : 'bg-primary/20 mr-auto rounded-tl-none';
        return `
          <div class="max-w-[85%] ${isUser ? 'ml-auto' : ''}">
            <div class="text-[9px] uppercase tracking-[0.1em] font-bold text-on-surface-variant mb-1 ${isUser ? 'text-right' : 'text-left'}">${label}</div>
            <div class="p-4 rounded-2xl text-sm leading-relaxed text-on-surface ${cls}">
              ${escapeHtml(msg.text)}
            </div>
          </div>
        `;
      }).join('');
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

  async function loadCallHistory(preloadedData = null) {
    try {
      callsData = preloadedData || await (await fetch('/api/calls')).json();
      renderHistorySummary();
      renderHistoryBatchCards();
      if (!callsData.length) {
        historyEmpty.style.display = 'block';
        historyContainer.innerHTML = '';
        if (historyBatchContainer) historyBatchContainer.innerHTML = '';
        return;
      }

      historyEmpty.style.display = 'none';
      historyContainer.innerHTML = callsData.map((c, i) => {
        const ourNumber = '+5114682421';
        const isOut = c.direction === 'outbound' || c.direction === 'outgoing' || (c.from === ourNumber && (c.direction === 'unknown' || !c.direction));
        const dirIcon = isOut ? 'call_made' : 'call_received';
        const dirColor = isOut ? 'text-blue-400' : 'text-purple-400';
        const dirLabel = isOut ? 'Saliente' : 'Entrante';
        
        // El número principal debe ser el de la otra persona
        const cleanNum = (n) => (!n || n === 'N/A') ? null : n;
        const primaryNumber = isOut ? (cleanNum(c.to) || 'Destinatario') : (cleanNum(c.from) || 'Llamada Entrante');
        const secondaryNumber = isOut ? (cleanNum(c.from) || 'Sistema') : (cleanNum(c.to) || 'Sistema');

        const started = c.startedAt
          ? new Date(c.startedAt).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
          : '—';

        const dur = c.durationSec != null ? formatDuration(c.durationSec) : '—';
        
        let statusCls = 'bg-red-500';
        let statusTxt = 'Fallida';
        if (c.status === 'completed' || c.status === 'ws_close' || c.status === 'stop_event') {
          statusCls = 'bg-green-500';
          statusTxt = 'Completada';
        } else if (c.status === 'active') {
          statusCls = 'bg-primary animate-pulse';
          statusTxt = 'En Curso';
        }

        return `
          <div data-idx="${i}" class="grid grid-cols-12 items-center px-6 py-5 rounded-2xl bg-surface-container-low/40 border border-outline-variant/10 hover:border-primary/20 hover:bg-surface-container-high/40 transition-all cursor-pointer group">
            <div class="col-span-1">
              <span class="material-symbols-outlined ${dirColor} text-lg">${dirIcon}</span>
            </div>
            <div class="col-span-3">
               <div class="flex items-center gap-2">
                 <p class="text-xs font-bold font-label text-on-surface">${escapeHtml(primaryNumber)}</p>
                 <span class="text-[7px] px-1 py-0.5 rounded border border-current ${dirColor} opacity-70">${dirLabel.toUpperCase()}</span>
                 ${c.batchLabel ? `<span class="text-[7px] px-1 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary uppercase tracking-widest">${escapeHtml(c.batchLabel)}</span>` : ''}
               </div>
               <p class="text-[9px] uppercase tracking-widest text-on-surface-variant opacity-60">${escapeHtml(secondaryNumber)}</p>
            </div>
            <div class="col-span-2 text-center text-[11px] font-medium text-on-surface-variant font-body">${escapeHtml(started)}</div>
            <div class="col-span-2 text-center text-sm font-bold text-on-surface">${escapeHtml(dur)}</div>
            <div class="col-span-2 text-center text-xs font-medium text-primary/80">${escapeHtml(c.turnCount || 0)} turnos</div>
            <div class="col-span-2 text-right flex justify-end items-center gap-4">
                ${c.recordingUrl ? `<span class="material-symbols-outlined text-primary text-sm animate-pulse">mic</span>` : ''}
                <div class="flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full ${statusCls}"></span>
                    <span class="text-[10px] font-bold uppercase tracking-widest opacity-80">${escapeHtml(statusTxt)}</span>
                </div>
            </div>
          </div>`;
      }).join('');

      historyContainer.querySelectorAll('[data-idx]').forEach(row => {
        row.addEventListener('click', () => {
          const idx = parseInt(row.dataset.idx);
          if (callsData[idx]) showTranscript(callsData[idx]);
        });
      });
    } catch (e) { console.error('Error cargando historial:', e); }
  }

  if (historyRetryBtn) {
    historyRetryBtn.addEventListener('click', async () => {
      const unansweredCalls = callsData.filter(c => classifyOutboundCall(c) === 'unanswered');
      await retryUnansweredCalls(unansweredCalls, historyRetryBtn, 'Reintento General');
    });
  }

  function formatDuration(sec) {
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
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
          monitor.classList.add('hidden');
          badge.classList.add('hidden');
          return;
      }

      monitor.classList.remove('hidden');
      badge.classList.remove('hidden');
      ansEl.textContent = currentBatch.stats.answered;
      failEl.textContent = currentBatch.stats.failed;

      const totalProcessed = currentBatch.stats.answered + currentBatch.stats.failed;
      if (totalProcessed >= currentBatch.stats.total && currentBatch.stats.total > 0) {
          badge.classList.add('hidden');
          actions.classList.remove('hidden');
          
          // Renderizar resumen final en la cola
          queue.innerHTML = `
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
        document.getElementById('batch-actions').classList.add('hidden');
        document.getElementById('batch-stats').classList.add('hidden');
    });
  });

  const reminderForm = document.getElementById('reminder-form');
  const reminderPhones = document.getElementById('reminder-phones');
  const reminderDomains = document.getElementById('reminder-domains');
  const reminderCount = document.getElementById('reminder-count');
  const reminderQueue = document.getElementById('reminder-queue');

  // Toggle Programado/Inmediato
  const btnInmediato = document.getElementById('btn-modo-inmediato');
  const btnProgramado = document.getElementById('btn-modo-programado');
  const reminderTimeContainer = document.getElementById('reminder-time-container');
  const reminderTimeInput = document.getElementById('reminder-time');

  if (btnInmediato && btnProgramado) {
    btnInmediato.addEventListener('click', () => {
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

  if (reminderPhones) {
    reminderPhones.addEventListener('input', () => {
      const count = reminderPhones.value
        .split('\n')
        .map(n => (n || '').trim().replace(/[^0-9+]/g, ''))
        .filter(n => n.length >= 8).length;
      reminderCount.textContent = `${count} Números`;
    });
  }

  if (reminderForm) {
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
          const num = rawNum.replace(/[^0-9+]/g, '');
          if (num.length >= 8) {
              numbers.push(num);
              const legacyDomain = line.substring(line.indexOf(rawNum) + rawNum.length).replace(/^[,\s\t;|]+/, '').trim();
              const explicitDomain = (domainLines[idx] || '').trim();
              const mappedDomain = (window.phoneContexts && window.phoneContexts[num] && window.phoneContexts[num].domain) ? window.phoneContexts[num].domain : '';
              const finalDomain = explicitDomain || legacyDomain || mappedDomain;
              if (finalDomain) domains[num] = finalDomain;
          }
      });

      const time = document.getElementById('reminder-time').value || 'Inmediato';
      const retry = document.getElementById('reminder-retry').value || '0';
      const msg = document.getElementById('reminder-msg').value;
      const greeting = document.getElementById('reminder-greeting').value;

      if (!numbers.length) return appAlert('Ingresa al menos un destino telefónico de manera manual o mediante Excel.', true);
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
                      <p class="text-[10px] text-on-surface-variant opacity-60">${time}</p>
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
      
      document.getElementById('batch-stats').classList.remove('hidden');
      document.getElementById('batch-actions').classList.add('hidden');
      document.getElementById('batch-answered-count').textContent = '0';
      document.getElementById('batch-failed-count').textContent = '0';
      document.getElementById('batch-badge').classList.remove('hidden');

      // Reset
      reminderForm.reset();
      reminderCount.textContent = '0 Números';
      
      // LÓGICA NEURAL DE DISPARO:
      if (time === 'Inmediato') {
        // Enviar llamadas realmente
        appAlert(`🚀 Llamadas iniciadas YA MISMO a ${numbers.length} destinos.`);
        
        // Disparar asincronicamente en segundo plano
        (async () => {
            const submitBtn = reminderForm.querySelector('button[type="submit"]');
            if(submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'PREPARANDO MATRIZ AI...'; }
            
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

            if(submitBtn) { submitBtn.textContent = 'PROCESANDO...'; }
            
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
                               window.location.href = '/login.html';
                           });
                           return; // abort loop
                       }
                       console.error('Error', resp.statusText);
                   }
                   // Gap preventivo entre llamadas (evita saturar rates de Telnyx)
                   await new Promise(r => setTimeout(r, 2500));
               } catch(e) { console.error('Error al iniciar recordatorio', e); }
            }
            
            if(submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'ACTIVAR LOTE'; }
            const badge = item.querySelector('span.text-secondary');
            if (badge) {
                badge.className = 'text-[8px] uppercase font-bold text-green-400 tracking-widest bg-green-500/10 px-2 py-1 rounded';
                badge.textContent = 'COMPLETADO';
            }
        })();
      } else {
        appAlert(`🕒 ${numbers.length} llamadas programadas para: ${time}.`);
        
        // Enviar a programar en el servidor
        (async () => {
            const submitBtn = reminderForm.querySelector('button[type="submit"]');
            if(submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'PROGRAMANDO...'; }
            
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
                        scheduled_for: time,
                        batch_id: reminderBatch.batchId,
                        batch_label: reminderBatch.batchLabel
                    })
                });
            }
            if(submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'ACTIVAR LOTE NEURAL'; }
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
        const errorLine = s.last_error ? `<p class="text-[8px] text-orange-300/80 truncate">${escapeHtml(s.last_error)}</p>` : '';

        return `
        <div class="p-3 rounded-lg bg-surface-container-lowest border border-zinc-800/30 flex justify-between items-center group">
          <div class="min-w-0 flex-1">
            <p class="text-[10px] font-bold text-on-surface truncate">${s.to_number}${s.domain ? ' · ' + escapeHtml(s.domain) : ''}</p>
            <p class="text-[8px] text-zinc-500 uppercase tracking-widest">${new Date(s.scheduled_for).toLocaleString('es-ES', {hour:'2-digit', minute:'2-digit'})} (Int: ${s.retry_interval_hours}h) · Intentos: ${attempts}</p>
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
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboardApp);
} else {
  initDashboardApp();
}

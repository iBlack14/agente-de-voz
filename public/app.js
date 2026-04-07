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
    stats: 'Consumo Neural'
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

  clearBtn.addEventListener('click', () => {
    numberInput.value = '';
    callList.innerHTML = '';
    emptyState.style.display = 'flex';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawValue = numberInput.value;
    const numbers = rawValue
      .split('\n')
      .map(n => n.trim().replace(/[^0-9+]/g, ''))
      .filter(n => n.length >= 8);

    if (!numbers.length) return;

    startBtn.disabled = true;
    startBtn.textContent = 'PROCESANDO...';
    emptyState.style.display = 'none';

    for (const num of numbers) {
      const li = document.createElement('li');
      li.className = 'px-5 py-4 rounded-xl bg-surface-container-highest/30 border border-outline-variant/10 flex justify-between items-center animate-pulse';
      li.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-primary text-sm">contact_phone</span>
          <span class="text-xs font-bold font-label tracking-widest text-on-surface">${num}</span>
        </div>
        <span class="call-status text-[9px] uppercase tracking-widest font-bold text-primary/60">Llamando...</span>
      `;
      callList.prepend(li);

      try {
        const resp = await fetch('/make-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number: num })
        });
        const data = await resp.json();
        const statusEl = li.querySelector('.call-status');
        li.classList.remove('animate-pulse');
        
        if (resp.ok && data.success) {
          statusEl.className = 'call-status text-[9px] uppercase tracking-widest font-bold text-green-400';
          statusEl.textContent = 'EN CURSO';
          li.dataset.number = num;
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

  let callsData = [];

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
      if (!callsData.length) {
        historyEmpty.style.display = 'block';
        historyContainer.innerHTML = '';
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
                    <p class="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Lote Finalizado</p>
                </div>
                <p class="text-sm text-zinc-300">Se procesaron ${currentBatch.stats.total} números. Pulsa el botón inferior para reintentar con los fallidos si es necesario.</p>
            </div>
          `;
      }
  }

  // Polling para el lote actual
  setInterval(async () => {
      if (!currentBatch.active || currentBatch.ids.length === 0) return;

      try {
          const resp = await fetch('/api/calls');
          const data = await resp.json();
          
          let ansCount = 0;
          let failCount = 0;

          currentBatch.ids.forEach(id => {
              const call = data.find(c => c.call_id === id);
              if (call) {
                  const duration = parseInt(call.duration_sec) || 0;
                  if (call.status === 'completed' || call.status === 'terminated') {
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
        currentBatch.ids.forEach(id => {
            const call = data.find(c => c.call_id === id);
            if (call) {
                const duration = parseInt(call.duration_sec) || 0;
                if (!duration || duration <= 5) {
                    failedNumbers.push(call.to_number);
                }
            }
        });

        if (failedNumbers.length === 0) {
            appAlert('¡Excelente! No hay llamadas fallidas detectadas para reprogramar.');
            return;
        }

        // Cargar números fallidos en el formulario
        const phonesTextarea = document.getElementById('reminder-phones');
        phonesTextarea.value = failedNumbers.join('\n');
        // Simular evento input para actualizar el conteo
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
      const count = reminderPhones.value.split('\n').filter(n => n.trim().length >= 8).length;
      reminderCount.textContent = `${count} Números`;
    });
  }

  if (reminderForm) {
    reminderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const lines = reminderPhones.value.split('\n').filter(l => l.trim().length > 0);
      const numbers = [];
      const domains = {};
      
      lines.forEach(line => {
          // Separador inteligente: busca espacios, comas, punto y coma, tabuladores o barras verticales
          const parts = line.split(/[,\s\t;|]+/).map(p => p.trim()).filter(p => p.length > 0);
          const num = (parts[0] || '').replace(/[^0-9+]/g, '');
          if (num.length >= 8) {
              numbers.push(num);
              if (parts[1]) domains[num] = parts[1];
              // Si no hay separador explícito, pero tenemos el mapeo del excel
              if (!parts[1] && window.phoneContexts && window.phoneContexts[num]) {
                  domains[num] = window.phoneContexts[num].domain;
              }
          }
      });

      const time = document.getElementById('reminder-time').value || 'Inmediato';
      const msg = document.getElementById('reminder-msg').value;
      const greeting = document.getElementById('reminder-greeting').value;

      if (!numbers.length) return appAlert('Ingresa al menos un destino telefónico de manera manual o mediante Excel.', true);

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
                      <h3 class="text-xs font-bold text-on-surface">Lote de ${numbers.length} Destinatarios</h3>
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
        appAlert(`🚀 Despacho iniciado YA MISMO a ${numbers.length} destinos.`);
        
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
                           instructions: msg
                       })
                   });
                    const data = await resp.json();
                    if (data.callId) {
                        currentBatch.ids.push(data.callId);
                    }

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
        appAlert(`🕒 Lote de ${numbers.length} recordatorios exitosamente programado para la fecha: ${time}.`);
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

  const importCamp = document.getElementById('import-file-campaigns');
  if (importCamp) handleFileImport(importCamp, document.getElementById('phone-numbers'), null);

  const importRem = document.getElementById('import-file-reminders');
  if (importRem) handleFileImport(importRem, document.getElementById('reminder-phones'), () => {
      document.getElementById('reminder-phones').dispatchEvent(new Event('input'));
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboardApp);
} else {
  initDashboardApp();
}

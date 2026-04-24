const express = require('express');
const router = express.Router();
const axios = require('axios');
const { supabase } = require('../services/db/supabase.service');
const { 
  readPrompts, upsertPrompt, setActivePrompt, deletePrompt,
  readReminderPrompts, upsertReminderPrompt, setActiveReminderPrompt, deleteReminderPrompt 
} = require('../services/prompts/promptService');
const { readVoiceSettings, saveVoiceSettings } = require('../services/config/voiceSettings.service');
const { normalizeText } = require('../services/ai/tts.service');
const { readCallLog, logCall, getUsageStats } = require('../services/db/repository');
const { makeOutboundCall, hangupCall, getBalanceDetails } = require('../services/telephony/telnyxClient');
const { setCallContext } = require('../services/telephony/context.service');
const { isValidE164, formatToE164 } = require('../services/utils');
const { activeSessions } = require('../services/voice/liveMonitor');
const { isWithinAllowedCallWindow, getNextAllowedCallTime, CALL_WINDOW_END_HOUR } = require('../services/telephony/callWindow.service');

// New: Updates Service
const updatesService = require('../services/db/updates.service');

const callRateLimits = new Map();
const WINDOW = 60_000;
const MAX = 50;
const RECENT_CALL_COOLDOWN_HOURS = Math.max(1, parseInt(process.env.RECENT_CALL_COOLDOWN_HOURS || '24', 10));

async function hasRecentContact(number) {
  const cutoff = new Date(Date.now() - RECENT_CALL_COOLDOWN_HOURS * 3600000).toISOString();

  const [{ data: calls, error: callsError }, { data: scheduled, error: scheduledError }] = await Promise.all([
    supabase
      .from('calls')
      .select('call_id,status,started_at')
      .eq('to_number', number)
      .gte('started_at', cutoff)
      .limit(1),
    supabase
      .from('scheduled_calls')
      .select('id,status,scheduled_for')
      .eq('to_number', number)
      .gte('scheduled_for', cutoff)
      .in('status', ['pending', 'processing', 'completed'])
      .limit(1)
  ]);

  if (callsError) throw callsError;
  if (scheduledError) throw scheduledError;

  const recentCall = (calls || []).find(row => !['failed', 'busy', 'no_answer', 'canceled'].includes(String(row.status || '').toLowerCase()));
  return Boolean(recentCall || (scheduled || []).length);
}

router.get('/prompts', async (req, res) => {
  try { res.json(await readPrompts()); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/prompts', async (req, res) => {
  try { await upsertPrompt(req.body); res.json({ success: true, data: await readPrompts() }); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/prompts/active', async (req, res) => {
  try { await setActivePrompt(req.body.id); res.json({ success: true, activeId: req.body.id }); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/prompts/:id', async (req, res) => {
  try { await deletePrompt(req.params.id); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/reminders', async (req, res) => {
  try { res.json(await readReminderPrompts()); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/reminders', async (req, res) => {
  try { await upsertReminderPrompt(req.body); res.json({ success: true, data: await readReminderPrompts() }); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/reminders/active', async (req, res) => {
  try { await setActiveReminderPrompt(req.body.id); res.json({ success: true, activeId: req.body.id }); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/reminders/:id', async (req, res) => {
  try { await deleteReminderPrompt(req.params.id); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/calls', async (req, res) => {
  try { res.json(await readCallLog()); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/calls/reset-all', async (req, res) => {
  try {
    // Supabase native multi-delete
    await supabase.from('call_transcripts').delete().neq('id', 0);
    await supabase.from('usage_logs').delete().neq('id', 0);
    await supabase.from('calls').delete().neq('call_id', 'none');
    await supabase.from('scheduled_calls').delete().neq('id', 0);
    res.json({ success: true, message: 'Datos operativos reiniciados correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/voices', async (req, res) => {
  try {
    const response = await axios.get('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY } });
    const voices = response.data.voices.map(v => ({ id: v.voice_id, name: v.name, category: v.category }));
    res.json({ count: voices.length, voices });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/voice-settings', async (req, res) => {
  try {
    res.json(await readVoiceSettings());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/voice-settings', async (req, res) => {
  try {
    res.json({ success: true, data: await saveVoiceSettings(req.body || {}) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const { callQueue } = require('../services/telephony/queue.service');

function getTimeGreeting() {
  const hour = Number(new Intl.DateTimeFormat('es-PE', {
    hour: 'numeric',
    hour12: false,
    timeZone: 'America/Lima'
  }).format(new Date()));

  if (hour >= 5 && hour < 12) return 'Buenos dias';
  if (hour >= 12 && hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function applyTimeGreeting(text) {
  if (!text) return text;
  const greeting = getTimeGreeting();
  return text
    .replace(/Buenas\s*\(\)/gi, greeting)
    .replace(/\(\)/g, greeting)
    .replace(/\bBuenos\s+d[ií]as\b/gi, greeting)
    .replace(/\bBuenas\s+tardes\b/gi, greeting)
    .replace(/\bBuenas\s+noches\b/gi, greeting);
}

router.post('/make-call', async (req, res) => {
  let { number, domain, mode, greeting, instructions, retry_interval, scheduled_for, batch_id, batch_label } = req.body || {};
  number = formatToE164(number);
  greeting = applyTimeGreeting(greeting);
  instructions = applyTimeGreeting(instructions);
  console.log(`📞 [API] Intento de llamada a: ${number} | Modo: ${scheduled_for ? 'Programado' : 'Inmediato'}`);

  if (!number || !isValidE164(number)) {
    console.error(`❌ [API] Número inválido tras limpieza: ${number}`);
    return res.status(400).json({ error: 'Número inválido' });
  }

  if (await hasRecentContact(number)) {
    return res.status(409).json({ error: `Este número ya fue contactado dentro de las últimas ${RECENT_CALL_COOLDOWN_HOURS} horas.` });
  }

  if (scheduled_for) {
     const normalizedSchedule = isWithinAllowedCallWindow(new Date(scheduled_for))
       ? new Date(scheduled_for)
       : getNextAllowedCallTime(new Date(scheduled_for));
     console.log(`📅 [API] Guardando llamada programada en Supabase para: ${scheduled_for}`);
     await supabase.from('scheduled_calls').insert({
        to_number: number,
        batch_id: batch_id || null,
        batch_label: batch_label || null,
        domain,
        greeting,
        instructions,
        scheduled_for: normalizedSchedule.toISOString(),
        retry_interval_hours: retry_interval || 0
     });
     return res.json({ success: true, message: `Llamada programada para ${normalizedSchedule.toISOString()}` });
  }

  if (!isWithinAllowedCallWindow()) {
    return res.status(409).json({ error: `Fuera de horario de llamadas. Después de las ${CALL_WINDOW_END_HOUR}:00 hora Perú ya no se llama.` });
  }

  // Add call to neural queue
  (async () => {
    try {
      console.log(`🧠 [API] Añadiendo llamada a ${number} a la cola neural...`);
      await callQueue.add(async () => {
        console.log(`🚀 [Telnyx] Disparando llamada real a: ${number}`);
        const result = await makeOutboundCall(number, domain, { mode, customGreeting: greeting, customInstructions: instructions });
        const callId = result.data?.call_control_id;
        
        if (callId) {
          console.log(`✅ [Telnyx] Solicitud aceptada por API. ID: ${callId} (esperando call.answered para confirmar contestación)`);
          setCallContext(callId, { domain, mode, customGreeting: greeting, customInstructions: instructions, retry_interval, batch_id, batch_label });
          await logCall({
            callId,
            from: process.env.TELNYX_PHONE_NUMBER || '+5114682421',
            to: number,
            direction: 'outbound',
            domain: domain || null,
            mode: mode || null,
            reminderGreeting: greeting || null,
            reminderInstructions: instructions || null,
            batchId: batch_id || null,
            batchLabel: batch_label || null,
            startedAt: new Date().toISOString(),
            status: 'queued'
          });
        } else {
            console.warn(`⚠️ [Telnyx] La llamada se aceptó pero no devolvió call_control_id`);
        }
      });
    } catch (err) {
      console.error(`❌ [Queue Manager] Error en llamada a ${number}:`, err.message);
    }
  })();

  res.json({ success: true, message: `Llamada a ${number} procesada por la cola neural` });
});


// --- BATCH MANAGEMENT ---
router.post('/batches', async (req, res) => {
  try {
    const { id, parent_batch_id, name, template_used, total_destinations } = req.body;
    console.log(`📊 [API] Registrando Lote: ${name} (ID: ${id}) | Destinos: ${total_destinations}`);
    
    await supabase.from('call_batches').upsert({
        id,
        parent_batch_id: parent_batch_id || null,
        name,
        template_used: template_used || null,
        total_destinations
    });
    res.json({ success: true });
  } catch (err) {
    console.error(`❌ [API] Error al registrar lote:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/batches', async (req, res) => {
  try {
    // Complex view replacement using Supabase logic
    const { data: batches, error } = await supabase.from('call_batches').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    
    // For counts, we might need a separate query or an RPC for performance
    // Simple version: join is hard in SDK without views, let's fetch summary
    const { data: calls } = await supabase.from('calls').select('batch_id, status').not('batch_id', 'is', null);
    
    const results = batches.map(b => {
        const bCalls = (calls || []).filter(c => c.batch_id === b.id);
        return {
            ...b,
            answered_count: bCalls.filter(c => ['completed', 'answered'].includes(c.status)).length,
            failed_count: bCalls.filter(c => !['completed', 'answered', 'queued', 'in-progress', 'ringing', 'pending', 'scheduled'].includes(c.status)).length,
            active_count: bCalls.filter(c => ['queued', 'in-progress', 'ringing', 'pending', 'scheduled'].includes(c.status)).length
        };
    });
    
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/batches/:id/failed', async (req, res) => {
  try {
    const { data, error } = await supabase
        .from('calls')
        .select('to_number, domain')
        .eq('batch_id', req.params.id)
        .not('status', 'in', "('completed', 'answered', 'queued', 'in-progress', 'ringing', 'pending', 'scheduled')");
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const [usageStats, telnyxBalance] = await Promise.all([
      getUsageStats(),
      getBalanceDetails()
    ]);

    res.json({
      ...usageStats,
      telnyx_balance: telnyxBalance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/history', async (req, res) => {
  try {
    await supabase.from('call_batches').delete().neq('id', 'none');
    const { error } = await supabase.from('calls').delete().neq('status', 'in-progress'); // Don't delete active calls
    if (error) throw error;
    res.json({ success: true, message: 'Historial de llamadas purgado correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tts-preview', async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Texto requerido' });
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceConfig = await readVoiceSettings();
  const voiceId = voiceConfig.voiceId;

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128&optimize_streaming_latency=${voiceConfig.latencyOptimization}`,
      {
        text: normalizeText(text.trim()),
        model_id: voiceConfig.modelId,
        apply_text_normalization: voiceConfig.applyTextNormalization,
        voice_settings: {
          speed: voiceConfig.speed,
          stability: voiceConfig.stability,
          similarity_boost: voiceConfig.similarityBoost,
          style: voiceConfig.style,
          use_speaker_boost: voiceConfig.useSpeakerBoost
        }
      },
      {
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
        responseType: 'stream',
        timeout: 15000,
      }
    );
    res.setHeader('Content-Type', 'audio/mpeg');
    response.data.pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Error tts preview' });
  }
});

router.get('/scheduled', async (req, res) => {
  try {
    const { data, error } = await supabase
        .from('scheduled_calls')
        .select('*')
        .in('status', ['pending', 'processing', 'failed'])
        .order('scheduled_for', { ascending: true })
        .limit(300);
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/calls/stop-all', async (req, res) => {
  try {
    const activeCallIds = Array.from(activeSessions.keys()).filter(Boolean);
    const hangupResults = await Promise.allSettled(
      activeCallIds.map(async (callId) => {
        await hangupCall(callId);
        await logCall({
          callId,
          endedAt: new Date().toISOString(),
          status: 'canceled'
        });
        return callId;
      })
    );

    const { data: queuedTasks, error: fetchError } = await supabase
      .from('scheduled_calls')
      .select('id')
      .in('status', ['pending', 'processing']);

    if (fetchError) throw fetchError;

    const queuedTaskIds = (queuedTasks || []).map(item => item.id);
    if (queuedTaskIds.length > 0) {
      const { error: updateError } = await supabase
        .from('scheduled_calls')
        .update({
          status: 'failed',
          processing_started_at: null,
          last_error: 'Cancelado manualmente por cierre total',
          updated_at: new Date().toISOString()
        })
        .in('id', queuedTaskIds);

      if (updateError) throw updateError;
    }

    res.json({
      success: true,
      active_calls_requested_to_hangup: activeCallIds.length,
      active_calls_hangup_errors: hangupResults.filter(r => r.status === 'rejected').length,
      scheduled_tasks_stopped: queuedTaskIds.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/scheduled/recover-stuck', async (req, res) => {
  try {
    const { recoverStuckScheduledCalls } = require('../services/telephony/scheduler.service');
    await recoverStuckScheduledCalls(0); 
    res.json({ success: true, message: 'Tareas atascadas recuperadas.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/scheduled', async (req, res) => {
  try {
    const { error } = await supabase.from('scheduled_calls').delete().eq('status', 'pending');
    if (error) throw error;
    res.json({ success: true, message: 'Todos los recordatorios pendientes han sido eliminados.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/scheduled/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('scheduled_calls').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- UPDATES & RENEWALS ---
router.get('/updates', async (req, res) => {
  try {
    const { month, year, search } = req.query;
    const data = await updatesService.getUpdates({ 
      month: month ? parseInt(month) : null, 
      year: year ? parseInt(year) : null, 
      search 
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/updates', async (req, res) => {
  try {
    const { domain, phone, execution_date, notes } = req.body;
    if (!execution_date) {
      return res.status(400).json({ error: 'La fecha es obligatoria' });
    }
    const data = await updatesService.createUpdate({ domain, phone, execution_date, notes });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/updates/schedule-batch', async (req, res) => {
  try {
    const { updateIds, promptId, scheduledFor, repeatEveryHours, repeatCount, customGreeting, customInstructions } = req.body;
    if (!updateIds || !promptId) {
      return res.status(400).json({ error: 'updateIds y promptId son requeridos' });
    }
    const result = await updatesService.scheduleBatch({
      updateIds,
      promptId,
      scheduledFor,
      repeatEveryHours,
      repeatCount,
      customGreeting,
      customInstructions
    });
    
    // Trigger scheduler immediately if no scheduled date (immediate call)
    if (!scheduledFor) {
        const { processScheduledCalls } = require('../services/telephony/scheduler.service');
        processScheduledCalls().catch(e => console.error('Error triggering scheduler:', e));
    }

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/updates/:id', async (req, res) => {
  try {
    const { domain, phone, execution_date, notes } = req.body;
    const data = await updatesService.updateUpdate(req.params.id, { domain, phone, execution_date, notes });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/updates/category/:name', async (req, res) => {
  try {
    const result = await updatesService.deleteByCategory(req.params.name);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/updates/:id', async (req, res) => {
  try {
    const result = await updatesService.deleteUpdate(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

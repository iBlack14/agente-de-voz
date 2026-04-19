const express = require('express');
const router = express.Router();
const axios = require('axios');
const { supabase } = require('../services/db/supabase.service');
const { 
  readPrompts, upsertPrompt, setActivePrompt, deletePrompt,
  readReminderPrompts, upsertReminderPrompt, setActiveReminderPrompt, deleteReminderPrompt 
} = require('../services/prompts/promptService');
const { readCallLog, logCall, getUsageStats } = require('../services/db/repository');
const { makeOutboundCall } = require('../services/telephony/telnyxClient');
const { setCallContext } = require('../services/telephony/context.service');
const { isValidE164 } = require('../services/utils');

// New: Updates Service
const updatesService = require('../services/db/updates.service');

const callRateLimits = new Map();
const WINDOW = 60_000;
const MAX = 50;

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

const { callQueue } = require('../services/telephony/queue.service');

router.post('/make-call', async (req, res) => {
  const { number, domain, mode, greeting, instructions, retry_interval, scheduled_for, batch_id, batch_label } = req.body || {};
  console.log(`📞 [API] Intento de llamada a: ${number} | Modo: ${scheduled_for ? 'Programado' : 'Inmediato'}`);

  if (!number || !isValidE164(number)) {
    console.error(`❌ [API] Número inválido: ${number}`);
    return res.status(400).json({ error: 'Número inválido' });
  }

  if (scheduled_for) {
     console.log(`📅 [API] Guardando llamada programada en Supabase para: ${scheduled_for}`);
     await supabase.from('scheduled_calls').insert({
        to_number: number,
        batch_id: batch_id || null,
        batch_label: batch_label || null,
        domain,
        greeting,
        instructions,
        scheduled_for,
        retry_interval_hours: retry_interval || 0
     });
     return res.json({ success: true, message: `Llamada programada para ${scheduled_for}` });
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
  try { res.json(await getUsageStats()); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/tts-preview', async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Texto requerido' });
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || '90ipbRoKi4CpHXvKVtl0';

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
      {
        text: text.trim(),
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.8, use_speaker_boost: true }
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
    if (!domain || !execution_date) {
      return res.status(400).json({ error: 'Dominio y fecha son obligatorios' });
    }
    const data = await updatesService.createUpdate({ domain, phone, execution_date, notes });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/updates/schedule-batch', async (req, res) => {
  try {
    const { updateIds, promptId, scheduledFor } = req.body;
    if (!updateIds || !promptId) {
      return res.status(400).json({ error: 'updateIds y promptId son requeridos' });
    }
    const result = await updatesService.scheduleBatch({ updateIds, promptId, scheduledFor });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

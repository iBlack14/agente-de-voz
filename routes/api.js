const express = require('express');
const router = express.Router();
const axios = require('axios');
const { 
  readPrompts, upsertPrompt, setActivePrompt, deletePrompt,
  readReminderPrompts, upsertReminderPrompt, setActiveReminderPrompt, deleteReminderPrompt 
} = require('../services/prompts/promptService');
const { readCallLog, logCall } = require('../services/db/repository');
const { makeOutboundCall } = require('../services/telephony/telnyxClient');
const { setCallContext } = require('../services/telephony/context.service');
const { isValidE164 } = require('../services/utils');

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

router.get('/voices', async (req, res) => {
  try {
    const response = await axios.get('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY } });
    const voices = response.data.voices.map(v => ({ id: v.voice_id, name: v.name, category: v.category }));
    res.json({ count: voices.length, voices });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const { callQueue } = require('../services/telephony/queue.service');
const { inflightOutbound } = require('../services/callState');

router.post('/make-call', async (req, res) => {
  const { number, domain, mode, greeting, instructions, retry_interval, scheduled_for, batch_id, batch_label } = req.body || {};
  if (!number || !isValidE164(number)) return res.status(400).json({ error: 'Número inválido' });

  const ip = req.ip;
  const now = Date.now();
  const recent = (callRateLimits.get(ip) || []).filter(t => now - t < WINDOW);
  if (recent.length >= MAX) return res.status(429).json({ error: 'Rate limit exceeded' });
  recent.push(now);
  callRateLimits.set(ip, recent);

  if (scheduled_for) {
     const { query } = require('../services/db/postgres.service');
     await query(
       `INSERT INTO scheduled_calls (to_number, batch_id, batch_label, domain, greeting, instructions, scheduled_for, retry_interval_hours)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
       [number, batch_id || null, batch_label || null, domain, greeting, instructions, scheduled_for, retry_interval || 0]
     );
     return res.json({ success: true, message: `Llamada programada para ${scheduled_for}` });
  }

  // Add call to neural queue to handle concurrency (Telnyx D1 error fix)
  (async () => {
    try {
      await callQueue.add(async () => {
        const result = await makeOutboundCall(number, domain, { mode, customGreeting: greeting, customInstructions: instructions });
        const callId = result.data?.call_control_id;
        if (callId) {
          inflightOutbound.add(callId);
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
        }
      });
    } catch (err) {
      console.error(`[Queue Manager] Failed call to ${number}:`, err.message);
    }
  })();

  res.json({ success: true, message: `Llamada a ${number} procesada por la cola neural` });
});


router.get('/stats', async (req, res) => {
  try {
    const { getUsageStats } = require('../services/db/repository');
    res.json(await getUsageStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * TTS Voice Preview — Listen to the AI voice directly from the dashboard
 */
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
    res.setHeader('Cache-Control', 'no-cache');
    response.data.pipe(res);
  } catch (err) {
    console.error('[TTS Preview] Error:', err.message);
    res.status(500).json({ error: 'Error al generar audio de vista previa' });
  }
});

router.get('/scheduled', async (req, res) => {
  try {
    const { query } = require('../services/db/postgres.service');
    const { rows } = await query(`SELECT * FROM scheduled_calls WHERE status IN ('pending', 'processing', 'failed') ORDER BY scheduled_for ASC LIMIT 300`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/scheduled/recover-stuck', async (req, res) => {
  try {
    const { recoverStuckScheduledCalls } = require('../services/telephony/scheduler.service');
    await recoverStuckScheduledCalls(0); // recover all currently processing
    res.json({ success: true, message: 'Tareas atascadas recuperadas.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/scheduled', async (req, res) => {
  try {
    const { query } = require('../services/db/postgres.service');
    await query(`DELETE FROM scheduled_calls WHERE status = 'pending'`);
    res.json({ success: true, message: 'Todos los recordatorios pendientes han sido eliminados.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/scheduled/:id', async (req, res) => {
  try {
    const { query } = require('../services/db/postgres.service');
    await query(`DELETE FROM scheduled_calls WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

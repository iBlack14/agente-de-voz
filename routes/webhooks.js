const express = require('express');
const router = express.Router();
const { verifyTelnyxRequest } = require('../middleware/auth');
const { answerCall, startRecording } = require('../services/telephony/telnyxClient');
const { precomputeGreeting } = require('../services/voice/session.service');
const { logCall } = require('../services/db/repository');
const { processedCalls, addProcessedCall, removeProcessedCall, addInflightOutbound, removeInflightOutbound } = require('../services/callState');
const { getCallContext, updateCallContext } = require('../services/telephony/context.service');
const { hangupCall } = require('../services/telephony/telnyxClient');

const ENABLE_RECORDING_FOR_REMINDERS = String(process.env.ENABLE_RECORDING_FOR_REMINDERS || 'false').toLowerCase() === 'true';
const ENABLE_RECORDING_FOR_CONVERSATIONAL = String(process.env.ENABLE_RECORDING_FOR_CONVERSATIONAL || 'true').toLowerCase() === 'true';

function shouldRecordCall(callId) {
  const context = getCallContext(callId);
  const isReminder = context?.mode === 'reminder';
  return isReminder ? ENABLE_RECORDING_FOR_REMINDERS : ENABLE_RECORDING_FOR_CONVERSATIONAL;
}

/**
 * Main Webhook Entry point for Telnyx Events.
 */
router.post('/telnyx', async (req, res) => {
  if (!verifyTelnyxRequest(req)) return res.status(401).json({ error: 'Firma de webhook inválida' });

  res.sendStatus(200);

  const event = req.body?.data;
  if (!event) return;

  const type = event.event_type;
  const payload = event.payload;
  const callId = payload?.call_control_id;
  if (!callId) return;

  try {
    let direction = payload.direction || payload.call_direction || 'unknown';
    if (direction === 'incoming' || direction === 'inbound') direction = 'inbound';
    else if (direction === 'outgoing' || direction === 'outbound') direction = 'outbound';

    const isInboundInitiated = type === 'call.initiated' && direction === 'inbound';
    const isOutboundInitiated = type === 'call.initiated' && direction === 'outbound';
    const isOutboundAnswered = type === 'call.answered' && direction === 'outbound';

    if (isInboundInitiated && !processedCalls.has(callId)) {
      addProcessedCall(callId);
      console.log(`[Webhook] 🚀 Incoming Voice Flux (${type} | ${direction})`);

      await logCall({
        callId,
        from: payload.from || 'N/A',
        to: payload.to || 'N/A',
        direction: direction,
        startedAt: new Date().toISOString(),
        status: 'active',
      });

      // For inbound calls, we need to answer to start the media stream
      await answerCall(callId);

      precomputeGreeting(callId).catch(e => console.error('[Webhook] Error precompute:', e.message));
      if (shouldRecordCall(callId)) {
        startRecording(callId);
      }
    }

    if (isOutboundInitiated) {
      if (!processedCalls.has(callId)) addProcessedCall(callId);
      addInflightOutbound(callId);
      console.log(`[Webhook] 📞 Outbound call initiated (${callId.slice(-8)})`);

      await logCall({
        callId,
        from: payload.from || 'N/A',
        to: payload.to || 'N/A',
        direction: direction,
        startedAt: new Date().toISOString(),
        status: 'queued',
      });
    }

    if (isOutboundAnswered) {
      if (!processedCalls.has(callId)) addProcessedCall(callId);
      addInflightOutbound(callId);
      console.log(`[Webhook] ✅ Outbound call answered (${callId.slice(-8)})`);
      const ctx = getCallContext(callId);
      const shouldDelayPrecompute = ctx?.mode === 'reminder' && String(process.env.ENABLE_AMD_FOR_REMINDERS || 'true').toLowerCase() === 'true';

      await logCall({
        callId,
        from: payload.from || 'N/A',
        to: payload.to || 'N/A',
        direction: direction,
        status: 'answered',
      });

      if (!shouldDelayPrecompute) {
        precomputeGreeting(callId).catch(e => console.error('[Webhook] Error precompute:', e.message));
      }
      if (shouldRecordCall(callId)) {
        startRecording(callId);
      }
    }

    if (type === 'call.machine.detection.ended' || type === 'call.machine.premium.detection.ended') {
      const result = String(payload.result || '').toLowerCase();
      const ctx = updateCallContext(callId, { amd_result: result, amd_event_type: type });
      console.log(`[Webhook] 🤖 AMD ${type}: ${result} (${callId.slice(-8)})`);

      if (ctx?.mode === 'reminder' && ['machine', 'fax_detected', 'silence'].includes(result)) {
        await logCall({
          callId,
          endedAt: new Date().toISOString(),
          status: 'voicemail'
        });
        await hangupCall(callId);
        removeInflightOutbound(callId);
        removeProcessedCall(callId);
        return;
      }

      if (ctx?.mode === 'reminder' && ['human', 'not_sure', 'human_business', 'human_residence'].includes(result)) {
        precomputeGreeting(callId).catch(e => console.error('[Webhook] Error precompute AMD:', e.message));
      }
    }

    if (type === 'call.hangup') {
      removeProcessedCall(callId);
      removeInflightOutbound(callId);
      // Registrar finalización
      const { query } = require('../services/db/postgres.service');
      const { rows: statusCheck } = await query('SELECT status FROM calls WHERE call_id = $1', [callId]);
      const currentStatus = statusCheck[0]?.status;
      let newStatus = 'completed';
      if (!currentStatus || currentStatus === 'queued' || currentStatus === 'ringing') {
        // Never reached answer event
        newStatus = 'no_answer';
      } else if (currentStatus !== 'active' && currentStatus !== 'answered') {
        // Keep terminal status set elsewhere (failed, busy, etc.)
        newStatus = currentStatus;
      }
      await logCall({ callId, endedAt: new Date().toISOString(), status: newStatus });

      // Lógica de Re-intento Periódico (Infinite Loop según configuración)
      const ctx = getCallContext(callId);
      
      if (ctx && ctx.retry_interval > 0) {
          const currentAttempt = Number(ctx.retry_attempts || 1);
          const maxAttempts = Number(ctx.retry_max_attempts || 1);

          if (currentAttempt < maxAttempts) {
              const nextAttempt = new Date(Date.now() + (ctx.retry_interval * 3600000)).toISOString();
              console.log(`[Webhook] 🔄 Reintento ${currentAttempt + 1}/${maxAttempts}: Programando siguiente llamada para ${payload.to} en ${ctx.retry_interval}h (${nextAttempt})`);
              
              await query(
                  `INSERT INTO scheduled_calls (to_number, batch_id, batch_label, domain, greeting, instructions, scheduled_for, retry_interval_hours, attempts)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                  [payload.to, ctx.batch_id || null, ctx.batch_label || null, ctx.domain, ctx.customGreeting, ctx.customInstructions, nextAttempt, ctx.retry_interval, currentAttempt]
              );
          } else {
              console.log(`[Webhook] ⏹️ Reintentos detenidos para ${payload.to}. Se alcanzó el máximo de ${maxAttempts} intento(s) en 24h.`);
          }
      }
    }

    if (type === 'call.recording_saved') {
      const recordingUrl = payload.recording_urls?.mp3 || payload.public_url || payload.recording_url;
      if (recordingUrl) {
          console.log(`[Webhook] 🎙️ Grabación guardada para ${callId.slice(-8)}`);
          await logCall({ callId, recordingUrl });
      }
    }
  } catch (err) {
    console.error(`[Webhook] Error en ${type}:`, err.message);
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { verifyTelnyxRequest } = require('../middleware/auth');
const { answerCall, startRecording } = require('../services/telephony/telnyxClient');
const { precomputeGreeting } = require('../services/voice/session.service');
const { logCall } = require('../services/db/repository');
const { processedCalls } = require('../services/callState');

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

    const shouldStartInbound = type === 'call.initiated' && direction === 'inbound';
    const shouldStartOutbound = type === 'call.answered';

    if ((shouldStartInbound || shouldStartOutbound) && !processedCalls.has(callId)) {
      processedCalls.add(callId);
      console.log(`[Webhook] 🚀 Incoming Voice Flux (${type} | ${direction})`);

      logCall({
        callId,
        from: payload.from || 'N/A',
        to: payload.to || 'N/A',
        direction: direction,
        startedAt: new Date().toISOString(),
        status: 'active',
      }).catch(e => console.error('[Webhook] Error logCall:', e.message));

      // For inbound calls, we need to answer to start the media stream
      if (shouldStartInbound) {
        await answerCall(callId);
      }

      precomputeGreeting(callId).catch(e => console.error('[Webhook] Error precompute:', e.message));
      startRecording(callId);
    }

    if (type === 'call.hangup') {
      processedCalls.delete(callId);
      await logCall({ callId, endedAt: new Date().toISOString(), status: 'completed' });
      console.log(`[Webhook] Finalizada: ...${callId.slice(-8)}`);
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

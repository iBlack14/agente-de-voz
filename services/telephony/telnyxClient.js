const axios = require('axios');
const { formatToE164 } = require('../utils');

const API_KEY = process.env.TELNYX_API_KEY;
const APP_ID = process.env.TELNYX_CONNECTION_ID;
const FROM_NUMBER = process.env.TELNYX_PHONE_NUMBER || '+5114682421';
const DEFAULT_TIMEOUT_SECS = Math.max(10, parseInt(process.env.OUTBOUND_TIMEOUT_SECS || '60', 10));
const REMINDER_TIMEOUT_SECS = Math.max(10, parseInt(process.env.OUTBOUND_TIMEOUT_SECS_REMINDER || '25', 10));
const ENABLE_AMD_FOR_REMINDERS = String(process.env.ENABLE_AMD_FOR_REMINDERS || 'true').toLowerCase() === 'true';
const REMINDER_AMD_MODE = process.env.REMINDER_AMD_MODE || 'detect';

async function telnyxRequest(method, path, data = {}) {
  try {
    const response = await axios({
      method,
      url: `https://api.telnyx.com/v2${path}`,
      data,
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (err) {
    const errorData = err.response?.data;
    const isCallAlreadyEnded = errorData?.errors?.[0]?.code === '90018';
    
    if (isCallAlreadyEnded) {
      console.debug(`[Telnyx] Call already ended during ${method} ${path} (expected)`);
    } else {
      console.error(`[Telnyx Client] Error in ${path}:`, errorData || err.message);
    }
    throw err;
  }
}

async function getBalanceDetails() {
  if (!API_KEY) {
    return {
      ok: false,
      balance: null,
      available_credit: null,
      credit_limit: null,
      pending: null,
      currency: 'USD',
      error: 'TELNYX_API_KEY no configurada'
    };
  }

  try {
    const response = await telnyxRequest('GET', '/balance');
    const data = response?.data || {};
    return {
      ok: true,
      balance: data.balance ?? null,
      available_credit: data.available_credit ?? null,
      credit_limit: data.credit_limit ?? null,
      pending: data.pending ?? null,
      currency: data.currency || 'USD',
      error: null
    };
  } catch (err) {
    return {
      ok: false,
      balance: null,
      available_credit: null,
      credit_limit: null,
      pending: null,
      currency: 'USD',
      error: err.response?.data?.errors?.[0]?.detail || err.message || 'No se pudo consultar el saldo de Telnyx'
    };
  }
}

module.exports = {
  makeOutboundCall: (to, domain, metadata = {}) => {
    const isReminder = metadata?.mode === 'reminder';
    const payload = {
      to: formatToE164(to), from: FROM_NUMBER, connection_id: APP_ID,
      stream_url: process.env.WS_URL,
      stream_track: 'both_tracks',
      stream_bidirectional_mode: 'rtp',
      stream_bidirectional_codec: 'PCMU',
      stream_bidirectional_sampling_rate: 8000,
      timeout_secs: isReminder ? REMINDER_TIMEOUT_SECS : DEFAULT_TIMEOUT_SECS,
      client_state: Buffer.from(JSON.stringify({ domain, ...metadata })).toString('base64')
    };

    if (isReminder && ENABLE_AMD_FOR_REMINDERS) {
      payload.answering_machine_detection = REMINDER_AMD_MODE;
    }

    return telnyxRequest('POST', '/calls', payload);
  },
  hangupCall: (callId) => telnyxRequest('POST', `/calls/${callId}/actions/hangup`)
    .catch(e => {
        const code = e.response?.data?.errors?.[0]?.code;
        if (code !== '90018') {
            console.warn(`[Telephony] Could not hangup call ${callId}:`, e.message);
        } else {
            console.debug(`[Telephony] Call ${callId} already ended during hangup (expected)`);
        }
    }),
  answerCall: (callId) => telnyxRequest('POST', `/calls/${callId}/actions/answer`, {
    stream_url: process.env.WS_URL,
    stream_track: 'both_tracks',
    stream_bidirectional_mode: 'rtp',
    stream_bidirectional_codec: 'PCMU',
    stream_bidirectional_sampling_rate: 8000
  }).catch(e => {
      const code = e.response?.data?.errors?.[0]?.code;
      if (code !== '90018') {
          console.warn(`[Telephony] Could not answer call ${callId}:`, e.message);
      } else {
          console.debug(`[Telephony] Call ${callId} already ended during answer (expected)`);
      }
  }),
  startRecording: (callId) => telnyxRequest('POST', `/calls/${callId}/actions/record_start`, {
    format: 'mp3',
    channels: 'dual'
  }).catch(e => {
      const code = e.response?.data?.errors?.[0]?.code;
      if (code !== '90018') {
          console.warn(`[Recording] Could not start for ${callId}:`, e.message);
      } else {
          console.debug(`[Recording] Call ${callId} already ended (expected)`);
      }
  }),
  getBalanceDetails
};

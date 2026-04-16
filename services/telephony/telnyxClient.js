const axios = require('axios');

const API_KEY = process.env.TELNYX_API_KEY;
const APP_ID = process.env.TELNYX_CONNECTION_ID;
const FROM_NUMBER = process.env.TELNYX_PHONE_NUMBER || '+5114682421';

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

module.exports = {
  makeOutboundCall: (to, domain, metadata = {}) => telnyxRequest('POST', '/calls', {
    to, from: FROM_NUMBER, connection_id: APP_ID, 
    stream_url: process.env.WS_URL,
    stream_track: 'both_tracks',
    stream_bidirectional_mode: 'rtp',
    stream_bidirectional_codec: 'PCMU',
    stream_bidirectional_sampling_rate: 8000,
    client_state: Buffer.from(JSON.stringify({ domain, ...metadata })).toString('base64')
  }),
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
  })
};

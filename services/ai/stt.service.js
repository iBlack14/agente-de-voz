const axios = require('axios');

const DEEPGRAM_URL =
  'https://api.deepgram.com/v1/listen?' +
  'model=nova-3&' +          // Nova-3 for superior Spanish precision
  'language=es&' +            
  'encoding=mulaw&' +
  'sample_rate=8000&' +       // Standard telephony sample rate (G.711 PCMU)
  'punctuate=true&' +
  'smart_format=true&' +
  'no_delay=true';            // Minimum latency config

const { logUsage } = require('../db/repository');

/**
 * Transcribes μ-law audio buffer to text using Deepgram.
 */
async function transcribeAudio(audioBuffer, callId) {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey || !audioBuffer || audioBuffer.length === 0) return "";

  try {
    // Log usage: 8000 bytes = 1 second in our telephony stream
    const durationSec = audioBuffer.length / 8000;
    if (callId) {
        logUsage({ callId, service: 'deepgram', metric: 'seconds', value: durationSec }).catch(() => {});
    }

    const response = await axios.post(DEEPGRAM_URL, audioBuffer, {
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'audio/mulaw',
      },
      timeout: 5000,
    });

    const transcript = response.data?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    if (transcript && transcript.trim()) console.log(`[STT Service] "${transcript}"`);
    return transcript || "";
  } catch (err) {
    console.error('[STT Service] Error:', err.message);
    return "";
  }
}

module.exports = { transcribeAudio };

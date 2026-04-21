const axios = require('axios');
const { readVoiceSettings } = require('../config/voiceSettings.service');

/**
 * Normalizes text for better AI speech synthesis.
 */
function normalizeText(text) {
  if (!text) return "";
  let cleanText = text
    .replace(/s\/\.\s*(\d+)/gi, "$1 soles")
    .replace(/s\/\.\s*/gi, " soles ") 
    .replace(/S\/\./gi, " soles ")
    .replace(/\bs\/\s*/gi, " soles")
    .trim();

  // Spell out phone numbers digit by digit for clarity
  cleanText = cleanText.replace(/(\+?51)?(9\d{8})\b/g, (match, prefix, digits) => {
    const spelling = digits.split('').join(' ');
    const grouped = spelling.replace(/(\d\s\d\s\d)\s(\d\s\d\s\d)\s(\d\s\d\s\d)/, "$1, $2, $3");
    return (prefix ? prefix.split('').join(' ') + ", " : "") + grouped;
  });

  return cleanText;
}

const { logUsage } = require('../db/repository');

/**
 * Converts text to a mulaw@8kHz audio stream using ElevenLabs.
 */
async function textToSpeech(text, callId) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceConfig = await readVoiceSettings();
  const voiceId = voiceConfig.voiceId;
  
  const normalized = normalizeText(text);
  if (!normalized) return null;

  // Log character usage
  if (callId) {
      logUsage({ callId, service: 'elevenlabs', metric: 'characters', value: normalized.length }).catch(() => {});
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=ulaw_8000&optimize_streaming_latency=${voiceConfig.latencyOptimization}`;

  try {
    const response = await axios.post(
      url,
      {
        text: normalized,
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
        timeout: 10000,
      }
    );
    return response.data;
  } catch (err) {
    console.error('[TTS Service] Error:', err.message);
    return null;
  }
}

module.exports = { textToSpeech, normalizeText };

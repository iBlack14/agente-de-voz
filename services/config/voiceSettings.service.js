const { supabase } = require('../db/supabase.service');

const APP_SETTING_KEY = 'voice_settings';

const DEFAULT_VOICE_SETTINGS = {
  voiceId: process.env.ELEVENLABS_VOICE_ID || '90ipbRoKi4CpHXvKVtl0',
  modelId: process.env.ELEVENLABS_MODEL_ID || 'eleven_turbo_v2_5',
  speed: 1,
  stability: 0.5,
  similarityBoost: 0.8,
  style: 0,
  useSpeakerBoost: true,
  latencyOptimization: 0,
  applyTextNormalization: 'auto'
};

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function sanitizeVoiceSettings(input = {}) {
  return {
    voiceId: String(input.voiceId || DEFAULT_VOICE_SETTINGS.voiceId).trim() || DEFAULT_VOICE_SETTINGS.voiceId,
    modelId: String(input.modelId || DEFAULT_VOICE_SETTINGS.modelId).trim() || DEFAULT_VOICE_SETTINGS.modelId,
    speed: clampNumber(input.speed, 0.7, 1.2, DEFAULT_VOICE_SETTINGS.speed),
    stability: clampNumber(input.stability, 0, 1, DEFAULT_VOICE_SETTINGS.stability),
    similarityBoost: clampNumber(input.similarityBoost, 0, 1, DEFAULT_VOICE_SETTINGS.similarityBoost),
    style: clampNumber(input.style, 0, 1, DEFAULT_VOICE_SETTINGS.style),
    useSpeakerBoost: input.useSpeakerBoost === false ? false : true,
    latencyOptimization: Math.round(clampNumber(input.latencyOptimization, 0, 4, DEFAULT_VOICE_SETTINGS.latencyOptimization)),
    applyTextNormalization: ['auto', 'on', 'off'].includes(String(input.applyTextNormalization || '').toLowerCase())
      ? String(input.applyTextNormalization).toLowerCase()
      : DEFAULT_VOICE_SETTINGS.applyTextNormalization
  };
}

async function readVoiceSettings() {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', APP_SETTING_KEY)
      .single();

    if (error || !data?.value) return { ...DEFAULT_VOICE_SETTINGS };

    const parsed = JSON.parse(data.value);
    return sanitizeVoiceSettings(parsed);
  } catch (_) {
    return { ...DEFAULT_VOICE_SETTINGS };
  }
}

async function saveVoiceSettings(settings) {
  const sanitized = sanitizeVoiceSettings(settings);
  await supabase.from('app_settings').upsert({
    key: APP_SETTING_KEY,
    value: JSON.stringify(sanitized),
    updated_at: new Date().toISOString()
  });
  return sanitized;
}

module.exports = {
  DEFAULT_VOICE_SETTINGS,
  readVoiceSettings,
  saveVoiceSettings,
  sanitizeVoiceSettings
};

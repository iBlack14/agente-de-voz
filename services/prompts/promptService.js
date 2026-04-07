const { query } = require('../db/postgres.service');

const defaultState = {
  activeId: '1',
  prompts: [{
    id: '1',
    name: 'Via Comunicativa (Default)',
    greeting: '¡Hola! Me comunico de la administración. ¿Me logras escuchar y entender bien?',
    text: 'Eres un asistente útil. Responde de forma muy concisa, no más de dos oraciones.',
  }],
  reminder: {
    id: 'rem-1',
    name: 'Renovación Web',
    greeting: 'Buenas () Estimado Clientes, somos de la Agencia VIA COMUNICATIVA...',
    text: 'Está próximo a vencer su servicio web...',
  }
};

async function ensureDefaults() {
  const countRes = await query('SELECT COUNT(*)::int AS count FROM prompts');
  if (countRes.rows[0]?.count > 0) return;
  for (const p of defaultState.prompts) {
    await query(`INSERT INTO prompts (id, name, greeting, text) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`, [p.id, p.name, p.greeting, p.text]);
  }
  await query(`INSERT INTO app_settings (key, value) VALUES ('active_prompt_id', $1) ON CONFLICT DO NOTHING`, [defaultState.activeId]);
}

async function getActivePrompt() {
  await ensureDefaults();
  const res = await query(`SELECT p.greeting, p.text FROM prompts p JOIN app_settings s ON p.id = s.value WHERE s.key = 'active_prompt_id' LIMIT 1`);
  return res.rows[0] || defaultState.prompts[0];
}

async function getActiveReminderPrompt() {
  const res = await query(`SELECT p.greeting, p.text FROM reminder_prompts p JOIN app_settings s ON p.id = s.value WHERE s.key = 'active_reminder_prompt_id' LIMIT 1`);
  return res.rows[0] || { greeting: '', text: '' };
}

module.exports = { 
  getActivePrompt, 
  getActiveReminderPrompt,
  readPrompts: async () => {
    const res = await query(`SELECT id, name, greeting, text FROM prompts ORDER BY created_at ASC`);
    const active = await query(`SELECT value FROM app_settings WHERE key = 'active_prompt_id'`);
    return { activeId: active.rows[0]?.value, prompts: res.rows };
  },
  upsertPrompt: (p) => query(`INSERT INTO prompts (id, name, greeting, text, updated_at) VALUES ($1,$2,$3,$4,NOW()) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, greeting=EXCLUDED.greeting, text=EXCLUDED.text, updated_at=NOW()`, [String(p.id), p.name, p.greeting, p.text]),
  setActivePrompt: (id) => query(`UPDATE app_settings SET value = $1 WHERE key = 'active_prompt_id'`, [String(id)]),
  deletePrompt: (id) => query(`DELETE FROM prompts WHERE id = $1`, [String(id)]),
  
  readReminderPrompts: async () => {
    const res = await query(`SELECT id, name, greeting, text FROM reminder_prompts ORDER BY created_at ASC`);
    const active = await query(`SELECT value FROM app_settings WHERE key = 'active_reminder_prompt_id'`);
    return { activeId: active.rows[0]?.value, prompts: res.rows };
  },
  upsertReminderPrompt: (p) => query(`INSERT INTO reminder_prompts (id, name, greeting, text, updated_at) VALUES ($1,$2,$3,$4,NOW()) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, greeting=EXCLUDED.greeting, text=EXCLUDED.text, updated_at=NOW()`, [String(p.id), p.name, p.greeting, p.text]),
  setActiveReminderPrompt: (id) => query(`UPDATE app_settings SET value = $1 WHERE key = 'active_reminder_prompt_id'`, [String(id)]),
  deleteReminderPrompt: (id) => query(`DELETE FROM reminder_prompts WHERE id = $1`, [String(id)])
};

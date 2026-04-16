require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { query, pool } = require('../services/db/postgres.service');

const ROOT = path.join(__dirname, '..');
const SCHEMA_FILE = path.join(ROOT, 'schema.sql');
const PROMPTS_FILE = path.join(ROOT, 'prompts.json');
const CALL_LOG_FILE = path.join(ROOT, 'call_log.json');

function readJsonSafe(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[MIGRATE] Error leyendo ${path.basename(filePath)}:`, err.message);
    return fallback;
  }
}

async function runSchema() {
  const sql = fs.readFileSync(SCHEMA_FILE, 'utf8');
  await query(sql);
}

async function migratePrompts() {
  const data = readJsonSafe(PROMPTS_FILE, { activeId: '1', prompts: [] });

  for (const p of data.prompts || []) {
    await query(
      `INSERT INTO prompts (id, name, greeting, text, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name,
           greeting = EXCLUDED.greeting,
           text = EXCLUDED.text,
           updated_at = NOW()`,
      [String(p.id), p.name || 'Sin nombre', p.greeting || '', p.text || '']
    );
  }

  const activeId = String(data.activeId || (data.prompts?.[0]?.id || '1'));
  await query(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES ('active_prompt_id', $1, NOW())
     ON CONFLICT (key) DO UPDATE
     SET value = EXCLUDED.value, updated_at = NOW()`,
    [activeId]
  );

  console.log(`[MIGRATE] Prompts migrados: ${(data.prompts || []).length}`);
}

async function migrateCalls() {
  const logs = readJsonSafe(CALL_LOG_FILE, []);
  let transcriptsCount = 0;

  for (const c of logs) {
    const callId = String(c.callId || 'unknown');
    await query(
      `INSERT INTO calls (
         call_id, direction, from_number, to_number,
         started_at, ended_at, duration_sec, turn_count, status, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (call_id) DO UPDATE
       SET direction = EXCLUDED.direction,
           from_number = EXCLUDED.from_number,
           to_number = EXCLUDED.to_number,
           started_at = COALESCE(EXCLUDED.started_at, calls.started_at),
           ended_at = COALESCE(EXCLUDED.ended_at, calls.ended_at),
           duration_sec = COALESCE(EXCLUDED.duration_sec, calls.duration_sec),
           turn_count = COALESCE(EXCLUDED.turn_count, calls.turn_count),
           status = COALESCE(EXCLUDED.status, calls.status),
           updated_at = NOW()`,
      [
        callId,
        c.direction || null,
        c.from || null,
        c.to || null,
        c.startedAt || null,
        c.endedAt || null,
        c.durationSec ?? null,
        c.turnCount ?? null,
        c.status || null,
      ]
    );

    if (Array.isArray(c.transcript) && c.transcript.length > 0) {
      await query('DELETE FROM call_transcripts WHERE call_id = $1', [callId]);

      for (const msg of c.transcript) {
        await query(
          `INSERT INTO call_transcripts (call_id, role, text, at)
           VALUES ($1, $2, $3, $4)`,
          [callId, msg.role || 'assistant', msg.text || '', msg.at || null]
        );
        transcriptsCount += 1;
      }
    }
  }

  console.log(`[MIGRATE] Llamadas migradas: ${logs.length}`);
  console.log(`[MIGRATE] Mensajes de transcripción migrados: ${transcriptsCount}`);
}

async function main() {
  try {
    console.log('[MIGRATE] Aplicando schema.sql...');
    await runSchema();

    console.log('[MIGRATE] Migrando prompts...');
    await migratePrompts();

    console.log('[MIGRATE] Migrando call log...');
    await migrateCalls();

    console.log('[MIGRATE] OK. Migración completada.');
  } catch (err) {
    console.error('[MIGRATE] Error:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();

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

async function migrateReminderPrompts() {
  const normalizeName = (value) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

  const reminderPrompts = [
    {
      id: 'uso_correos',
      name: 'USO DE CORREOS',
      greeting: '',
      text: 'Buenas () Estimado cliente,\n\npara garantizar un uso correcto de sus correos corporativos, les recomendamos descargar periodicamente toda su informacion importante a sus computadoras. Esta accion preventiva es vital para evitar perdidas de datos ante cualquier fallo inesperado en los backups. Atentamente, VIA COMUNICATIVA, "Publicidad que marca tu exito".'
    },
    {
      id: 'informacion_pendientes',
      name: 'INFORMACIÓN PENDIENTES',
      greeting: '',
      text: 'Estimado cliente,\n\nestamos en la etapa final del proyecto de su desarrollo web ... Para culminar exitosamente el proyecto, solicitamos amablemente el envio de la informacion pendiente. Puede comunicarse directamente con el area de soporte de VIA COMUNICATIVA a los numeros 936613758 o 924461828. Esperamos su pronta respuesta para culminar el servicio exitosamente. Estamos listos para lanzar su proyecto al mercado hoy mismo. Quedamos atentos.'
    },
    {
      id: 'llamada_ofertas',
      name: 'LLAMADA DE OFERTAS',
      greeting: '',
      text: 'Estimado cliente,\n\nimpulsa tu empresa aumentando la rentabilidad y utilidades con nuestras paginas web profesionales, reestructuraciones y sistemas ERP empresariales. Te entregamos soluciones tecnologicas de excelencia, disenadas para automatizar procesos y escalar tus ventas rapidamente, manteniendo una inversion accesible. Moderniza tu presencia digital y asegura resultados comerciales. Somos VIA COMUNICATIVA - Agencia de Marketing y Publicidad. Puedes comunicarte al: 936613758.'
    },
    {
      id: 'respuesta_cotizacion',
      name: 'RESPUESTA DE COTIZACIÓN',
      greeting: '',
      text: 'Buenos Dias, Estimado cliente,\n\nle enviamos una cotizacion para el desarrollo de su servicio web, esperamos su verificacion tecnica y estamos atentos a una respuesta sobre el servicio. Nos contactaremos a la brevedad desde el numero principal de nuestra empresa. 936613758. VIA COMUNICATIVA, "Publicidad que marca tu exito".'
    },
    {
      id: 'renovacion_servicios',
      name: 'RENOVACIÓN DE SERVICIOS',
      greeting: '',
      text: 'Buenas () Estimado Clientes, somos de la Agencia de Publicidad VIA COMUNICATIVA. Tenemos a cargo su servicio web dominio... Esta proximo a vencer, se le recomienda realizar el pago por renovacion de s/.250.00 al haber cumplido ya un ano con nosotros, evitar cortes e interrupciones y pagos por reposicion de servicio. Quedamos Atentos.'
    },
    {
      id: 'actualizacion_datos',
      name: 'ACTUALIZACIÓN DE DATOS',
      greeting: '',
      text: 'Somos la agencia de marketing y publicidad. Via Comunicativa,  Como parte de una mejora continua, estamos realizando actualizaciones y optimizaciones en su sitio web ......, sin costo alguno, incluyendo ajustes visuales, contenido y estructura. Para adjuntar cambios o enviar solicitudes de modificacion, pueden comunicarse directamente al numero: 924461828 Quedamos atentos a sus indicaciones. Saludos cordiales.'
    }
  ];

  const existing = await query(`SELECT id, name FROM reminder_prompts`);
  const byNormalizedName = new Map(
    existing.rows.map((r) => [normalizeName(r.name), { id: String(r.id), name: r.name }])
  );

  let activeReminderId = 'informacion_pendientes';

  for (const p of reminderPrompts) {
    const match = byNormalizedName.get(normalizeName(p.name));
    if (match) {
      await query(
        `UPDATE reminder_prompts
         SET name = $2, greeting = $3, text = $4, updated_at = NOW()
         WHERE id = $1`,
        [match.id, p.name, p.greeting, p.text]
      );
      if (normalizeName(p.name) === normalizeName('INFORMACIÓN PENDIENTES')) {
        activeReminderId = match.id;
      }
    } else {
      await query(
        `INSERT INTO reminder_prompts (id, name, greeting, text, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name,
             greeting = EXCLUDED.greeting,
             text = EXCLUDED.text,
             updated_at = NOW()`,
        [String(p.id), p.name, p.greeting, p.text]
      );
      if (normalizeName(p.name) === normalizeName('INFORMACIÓN PENDIENTES')) {
        activeReminderId = String(p.id);
      }
    }
  }

  await query(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES ('active_reminder_prompt_id', $1, NOW())
     ON CONFLICT (key) DO UPDATE
     SET value = EXCLUDED.value, updated_at = NOW()`,
    [activeReminderId]
  );

  console.log(`[MIGRATE] Reminder prompts migrados: ${reminderPrompts.length}`);
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

    console.log('[MIGRATE] Migrando reminder prompts...');
    await migrateReminderPrompts();

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

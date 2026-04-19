require('dotenv').config();

const { supabase } = require('../services/db/supabase.service');

const ROOT_BATCH_ID = 'demo-batch-100x5';
const ROOT_LABEL = 'Campana Demo 100 Personas';
const FROM_NUMBER = process.env.TELNYX_PHONE_NUMBER || '+5114682421';
const BASE_TIME = new Date('2026-04-19T08:00:00-05:00');

const ITERATIONS = [
  { iteration: 0, total: 100, nextUnanswered: 42 },
  { iteration: 1, total: 42, nextUnanswered: 25 },
  { iteration: 2, total: 25, nextUnanswered: 17 },
  { iteration: 3, total: 17, nextUnanswered: 13 },
  { iteration: 4, total: 13, nextUnanswered: 11 },
  { iteration: 5, total: 11, nextUnanswered: 10 }
];

function makeBatchId(iteration) {
  if (iteration === 0) return ROOT_BATCH_ID;
  return `retry:${ROOT_BATCH_ID}:${iteration}:demo`;
}

function makeBatchLabel(total) {
  return `${ROOT_LABEL} | Vol. ${total} | ID-DEMO100X5`;
}

function pad(num, size = 3) {
  return String(num).padStart(size, '0');
}

function makePhone(index) {
  return `+5199${pad(index, 7)}`;
}

function makeDomain(index) {
  return `demo${pad(index)}.via.test`;
}

function plusMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function buildContacts(total) {
  return Array.from({ length: total }, (_, idx) => ({
    index: idx + 1,
    phone: makePhone(idx + 1),
    domain: makeDomain(idx + 1)
  }));
}

async function seed() {
  const allDemoBatchIds = ITERATIONS.map(({ iteration }) => makeBatchId(iteration));

  console.log('[seed-demo] Limpiando demo previo...');
  const { error: deleteCallsError } = await supabase
    .from('calls')
    .delete()
    .like('call_id', `${ROOT_BATCH_ID}-%`);
  if (deleteCallsError) throw deleteCallsError;

  const { error: deleteBatchesError } = await supabase
    .from('call_batches')
    .delete()
    .in('id', allDemoBatchIds);
  if (deleteBatchesError) throw deleteBatchesError;

  let activeContacts = buildContacts(100);
  const batchRows = [];
  const callRows = [];

  ITERATIONS.forEach(({ iteration, total, nextUnanswered }, iterIdx) => {
    const batchId = makeBatchId(iteration);
    const startedAt = plusMinutes(BASE_TIME, iterIdx * 22);
    const label = makeBatchLabel(total);
    const unansweredContacts = activeContacts.slice(0, nextUnanswered);
    const answeredContacts = activeContacts.slice(nextUnanswered);

    batchRows.push({
      id: batchId,
      parent_batch_id: iteration === 0 ? null : ROOT_BATCH_ID,
      name: label,
      total_destinations: total
    });

    unansweredContacts.forEach((contact, idx) => {
      const callStartedAt = plusMinutes(startedAt, idx);
      callRows.push({
        call_id: `${ROOT_BATCH_ID}-r${iteration}-u${pad(contact.index)}`,
        direction: 'outbound',
        from_number: FROM_NUMBER,
        to_number: contact.phone,
        domain: contact.domain,
        mode: 'reminder',
        reminder_greeting: 'Hola, esta es una prueba demo.',
        reminder_instructions: 'Escenario de demo para revisar lotes y reintentos.',
        batch_id: batchId,
        batch_label: label,
        started_at: callStartedAt.toISOString(),
        ended_at: callStartedAt.toISOString(),
        duration_sec: 0,
        turn_count: 0,
        status: 'no_answer',
        recording_url: null,
        updated_at: callStartedAt.toISOString()
      });
    });

    answeredContacts.forEach((contact, idx) => {
      const callStartedAt = plusMinutes(startedAt, nextUnanswered + idx);
      const duration = 18 + ((contact.index + iteration) % 55);
      callRows.push({
        call_id: `${ROOT_BATCH_ID}-r${iteration}-a${pad(contact.index)}`,
        direction: 'outbound',
        from_number: FROM_NUMBER,
        to_number: contact.phone,
        domain: contact.domain,
        mode: 'reminder',
        reminder_greeting: 'Hola, esta es una prueba demo.',
        reminder_instructions: 'Escenario de demo para revisar lotes y reintentos.',
        batch_id: batchId,
        batch_label: label,
        started_at: callStartedAt.toISOString(),
        ended_at: plusMinutes(callStartedAt, 1).toISOString(),
        duration_sec: duration,
        turn_count: 2 + ((contact.index + iteration) % 4),
        status: 'completed',
        recording_url: null,
        updated_at: plusMinutes(callStartedAt, 1).toISOString()
      });
    });

    activeContacts = unansweredContacts;
  });

  console.log(`[seed-demo] Insertando ${batchRows.length} lotes y ${callRows.length} llamadas demo...`);

  const { error: batchInsertError } = await supabase
    .from('call_batches')
    .insert(batchRows);
  if (batchInsertError) throw batchInsertError;

  const chunkSize = 200;
  for (let i = 0; i < callRows.length; i += chunkSize) {
    const chunk = callRows.slice(i, i + chunkSize);
    const { error: callInsertError } = await supabase
      .from('calls')
      .insert(chunk);
    if (callInsertError) throw callInsertError;
  }

  const finalPending = activeContacts.length;
  console.log('[seed-demo] Demo sembrado con exito.');
  console.log(`[seed-demo] Original: 100 contactos`);
  console.log(`[seed-demo] Reintentos: 5`);
  console.log(`[seed-demo] Pendientes tras 5to reintento: ${finalPending}`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[seed-demo] Error:', error.message);
    process.exit(1);
  });

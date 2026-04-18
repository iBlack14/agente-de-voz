const { query, pool } = require('./postgres.service');

/**
 * Handles all database interactions for call records and transcripts.
 */
module.exports = {
  /**
   * Logs or updates a call record and its transcript turns.
   */
  logCall: async (entry) => {
    const callId = String(entry.callId || 'unknown');
    const transcript = Array.isArray(entry.transcript) ? entry.transcript : null;

    await query(
      `INSERT INTO calls (call_id, direction, from_number, to_number, domain, mode, reminder_greeting, reminder_instructions, batch_id, batch_label, started_at, ended_at, duration_sec, turn_count, status, recording_url, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
       ON CONFLICT (call_id) DO UPDATE SET 
         direction = COALESCE(EXCLUDED.direction, calls.direction),
         from_number = COALESCE(EXCLUDED.from_number, calls.from_number),
         to_number = COALESCE(EXCLUDED.to_number, calls.to_number),
         domain = COALESCE(EXCLUDED.domain, calls.domain),
         mode = COALESCE(EXCLUDED.mode, calls.mode),
         reminder_greeting = COALESCE(EXCLUDED.reminder_greeting, calls.reminder_greeting),
         reminder_instructions = COALESCE(EXCLUDED.reminder_instructions, calls.reminder_instructions),
         batch_id = COALESCE(EXCLUDED.batch_id, calls.batch_id),
         batch_label = COALESCE(EXCLUDED.batch_label, calls.batch_label),
         started_at = COALESCE(EXCLUDED.started_at, calls.started_at),
         ended_at = COALESCE(EXCLUDED.ended_at, calls.ended_at),
         duration_sec = COALESCE(EXCLUDED.duration_sec, calls.duration_sec),
         turn_count = COALESCE(EXCLUDED.turn_count, calls.turn_count),
         status = COALESCE(EXCLUDED.status, calls.status),
         recording_url = COALESCE(EXCLUDED.recording_url, calls.recording_url),
         updated_at = NOW()`,
      [
        callId,
        entry.direction,
        entry.from,
        entry.to,
        entry.domain,
        entry.mode,
        entry.reminderGreeting,
        entry.reminderInstructions,
        entry.batchId,
        entry.batchLabel,
        entry.startedAt,
        entry.endedAt,
        entry.durationSec,
        entry.turnCount,
        entry.status,
        entry.recordingUrl
      ]
    );

    if (transcript && transcript.length > 0) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM call_transcripts WHERE call_id = $1', [callId]);
        for (const msg of transcript) {
          await client.query(`INSERT INTO call_transcripts (call_id, role, text, at) VALUES ($1, $2, $3, $4)`, [callId, msg.role, msg.text, msg.at]);
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
  },

  /**
   * Reads call history with associated transcripts.
   */
  readCallLog: async () => {
    const historyLimit = Math.max(200, parseInt(process.env.CALL_HISTORY_LIMIT || '5000', 10) || 5000);
    const { rows: calls } = await query(
      `SELECT * FROM calls ORDER BY COALESCE(started_at, created_at) DESC LIMIT $1`,
      [historyLimit]
    );
    if (!calls.length) return [];

    const ids = calls.map(c => c.call_id);
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const { rows: transcripts } = await query(`SELECT * FROM call_transcripts WHERE call_id IN (${placeholders}) ORDER BY id ASC`, ids);

    const transcriptsMap = transcripts.reduce((acc, t) => {
      if (!acc[t.call_id]) acc[t.call_id] = [];
      acc[t.call_id].push({ role: t.role, text: t.text, at: t.at });
      return acc;
    }, {});

    return calls.map(r => ({
      callId: r.call_id,
      direction: r.direction,
      from: r.from_number,
      to: r.to_number,
      domain: r.domain,
      mode: r.mode,
      reminderGreeting: r.reminder_greeting,
      reminderInstructions: r.reminder_instructions,
      batchId: r.batch_id,
      batchLabel: r.batch_label,
      startedAt: r.started_at,
      endedAt: r.ended_at,
      durationSec: r.duration_sec,
      turnCount: r.turn_count,
      status: r.status,
      recordingUrl: r.recording_url,
      transcript: transcriptsMap[r.call_id] || []
    }));
  },

  /**
   * Logs usage metrics for AI or Telephony services.
   */
  logUsage: async ({ callId, service, metric, value }) => {
    await query(
      `INSERT INTO usage_logs (call_id, service, metric, value) VALUES ($1, $2, $3, $4)`,
      [callId || null, service, metric, value]
    );
  },

  /**
   * Aggregates usage statistics for the dashboard.
   */
  getUsageStats: async () => {
    const { rows } = await query(`
      SELECT 
        service, 
        metric, 
        SUM(value) as total 
      FROM usage_logs 
      GROUP BY service, metric
    `);
    
    // Also include telnyx call duration from calls table
    const { rows: telnyxRows } = await query(`SELECT SUM(duration_sec) as total_sec FROM calls WHERE duration_sec > 0`);
    const totalSec = telnyxRows[0]?.total_sec || 0;

    return {
      usage: rows,
      telnyx_seconds: totalSec
    };
  }
};

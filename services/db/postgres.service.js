const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Service] Unexpected error:', err.message);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  testConnection: () => pool.query('SELECT 1'),
  initSchema: async () => {
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '../../schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(sql);

      // Automatic column migration for recording_url
      try {
          await pool.query(`ALTER TABLE calls ADD COLUMN IF NOT EXISTS recording_url TEXT;`);
          await pool.query(`ALTER TABLE calls ADD COLUMN IF NOT EXISTS direction TEXT;`); // Just in case
          await pool.query(`ALTER TABLE calls ADD COLUMN IF NOT EXISTS domain TEXT;`);
          await pool.query(`ALTER TABLE calls ADD COLUMN IF NOT EXISTS mode TEXT;`);
          await pool.query(`ALTER TABLE calls ADD COLUMN IF NOT EXISTS reminder_greeting TEXT;`);
          await pool.query(`ALTER TABLE calls ADD COLUMN IF NOT EXISTS reminder_instructions TEXT;`);
          await pool.query(`ALTER TABLE calls ADD COLUMN IF NOT EXISTS batch_id TEXT;`);
          await pool.query(`ALTER TABLE calls ADD COLUMN IF NOT EXISTS batch_label TEXT;`);
          await pool.query(`
            CREATE TABLE IF NOT EXISTS scheduled_calls (
              id BIGSERIAL PRIMARY KEY,
              to_number TEXT NOT NULL,
              batch_id TEXT,
              batch_label TEXT,
              domain TEXT,
              greeting TEXT,
              instructions TEXT,
              scheduled_for TIMESTAMPTZ NOT NULL,
              retry_interval_hours INTEGER DEFAULT 0,
              status TEXT DEFAULT 'pending',
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
          `);
          await pool.query(`ALTER TABLE scheduled_calls ADD COLUMN IF NOT EXISTS batch_id TEXT;`);
          await pool.query(`ALTER TABLE scheduled_calls ADD COLUMN IF NOT EXISTS batch_label TEXT;`);
          await pool.query(`ALTER TABLE scheduled_calls ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;`);
          await pool.query(`ALTER TABLE scheduled_calls ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;`);
          await pool.query(`ALTER TABLE scheduled_calls ADD COLUMN IF NOT EXISTS last_error TEXT;`);
          await pool.query(`ALTER TABLE scheduled_calls ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
      } catch (e) {
          console.log('[DB Migration] Column check handled.');
      }
    }
  }
};

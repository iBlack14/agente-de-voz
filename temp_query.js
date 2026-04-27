const { query } = require('./services/db/postgres.service');

async function check() {
  try {
    const res = await query('SELECT * FROM updates LIMIT 1');
    console.log('Update record sample:', res.rows[0]);
    
    const cols = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'updates'");
    console.log('Update table columns:', cols.rows.map(r => r.column_name));
  } catch (e) {
    console.error(e);
  }
}

check();

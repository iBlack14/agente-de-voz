require('dotenv').config();
const { query } = require('./services/db/postgres.service');

async function getCaller() {
  try {
    const res = await query(`SELECT from_number, started_at FROM calls WHERE direction = 'inbound' ORDER BY started_at DESC LIMIT 1`);
    console.log(JSON.stringify(res.rows[0]));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

getCaller();

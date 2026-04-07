require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

// Core Services
const { initSchema, testConnection, query } = require('./services/db/postgres.service');
const { createSession } = require('./services/voice/session.service');

// Routing & Auth
const { authRouter, restrictAccess } = require('./routes/auth');
const apiRouter = require('./routes/api');
const webhookRouter = require('./routes/webhooks');

const app = express();

/**
 * Global Middlewares
 */
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf.toString('utf8'); } }));
app.use(express.urlencoded({ extended: true }));

/**
 * Public Routes
 */
app.get('/health', async (req, res) => {
  try {
    await testConnection();
    res.json({ status: 'ok', database: 'connected', uptime: process.uptime() });
  } catch (e) {
    res.status(503).json({ status: 'error', database: 'disconnected', error: e.message });
  }
});

// Authentication System
app.use('/api', authRouter);
app.use(restrictAccess);

// Static Frontend
app.use(express.static('public'));

/**
 * Modular API Routes
 */
app.use('/api', apiRouter);
app.use('/webhook', webhookRouter);

/**
 * Server Initialization
 */
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host}`);
  
  // Only allow WebSocket upgrades for /neural-stream
  if (pathname === '/neural-stream') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws, req) => {
  console.log(`[WebSocket] New Neural Link: ${req.socket.remoteAddress}`);
  createSession(ws);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  try {
    await initSchema();
    await testConnection();
    console.log('[DB] PostgreSQL Service: ONLINE');

    // Data Sanitization / Cleanup
    const TELNYX_NUM = process.env.TELNYX_PHONE_NUMBER || '+5114682421';
    await query(`UPDATE calls SET direction = CASE WHEN from_number = $1 THEN 'outbound' WHEN to_number = $1 THEN 'inbound' ELSE direction END WHERE direction IS NULL OR direction = 'unknown'`, [TELNYX_NUM]);
    await query(`UPDATE calls SET status = 'completed', ended_at = NOW() WHERE status = 'active' AND (started_at < NOW() - INTERVAL '30 minutes' OR started_at IS NULL)`);

    console.log(`\n🎙️  ViaAI Voice Matrix active on port ${PORT}`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/health\n`);
  } catch (err) {
    console.error('[Startup] Critical Error:', err.message);
  }
});

/**
 * Graceful Shutdown Logic
 */
const { hangupCall } = require('./services/telephony/telnyxClient');
const { processedCalls } = require('./services/callState');

async function gracefulShutdown(signal) {
  console.log(`\n[Server] ${signal} signal received. Cleaning up active calls...`);
  const promises = Array.from(processedCalls).map(id => hangupCall(id).catch(() => {}));
  await Promise.race([Promise.allSettled(promises), new Promise(r => setTimeout(r, 2000))]);
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2'));

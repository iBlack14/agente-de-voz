require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Core Services
const { initSchema, testConnection, query } = require('./services/db/postgres.service');
const { createSession } = require('./services/voice/session.service');
const callState = require('./services/callState');

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

// Manual CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Authentication
app.use('/api', authRouter);
app.use(restrictAccess);

// Static Assets
app.use(express.static('public', { index: false }));

// Routes
app.use('/api', apiRouter);
app.use('/webhook', webhookRouter);

app.get('/health', async (req, res) => {
  try {
    await testConnection();
    res.json({ status: 'ok', database: 'connected', uptime: process.uptime() });
  } catch (e) {
    res.status(503).json({ status: 'error', error: e.message });
  }
});

app.get('/selection', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/advanced',  (req, res) => res.sendFile(path.join(__dirname, 'public/advanced.html')));
app.get('/simple',    (req, res) => res.sendFile(path.join(__dirname, 'public/simple.html')));
app.get('/login',     (req, res) => res.sendFile(path.join(__dirname, 'public/login.html')));
app.get('/', (req, res) => res.redirect('/login'));

/**
 * Server & WebSocket Initialization
 */
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });
const { addMonitor, activeSessions } = require('./services/voice/liveMonitor');

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = url.pathname;
  if (pathname === '/neural-stream') {
    wss.handleUpgrade(request, socket, head, (ws) => wss.emit('connection', ws, request));
  } else if (pathname === '/live-monitor') {
    const callId = url.searchParams.get('callId');
    if (!callId) { socket.destroy(); return; }
    wss.handleUpgrade(request, socket, head, (ws) => {
      addMonitor(callId, ws);
      ws.send(JSON.stringify({ type: 'connected', callId }));
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws, req) => {
  console.log(`📡 [WebSocket] Nueva conexión: ${req.socket.remoteAddress}`);
  createSession(ws);
});

// Active calls API
app.get('/api/active-calls', (req, res) => {
  const calls = [];
  activeSessions.forEach((meta, callId) => calls.push({ callId, ...meta }));
  res.json(calls);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  const actualPort = server.address().port;
  try {
    await initSchema();
    await testConnection();
    console.log('✅ [DB] Conectado a Supabase.');

    const { startScheduler } = require('./services/telephony/scheduler.service');
    startScheduler();

    console.log(`\n🚀  ViaAI Voice Matrix activo en puerto ${actualPort}`);
    console.log(`❤️   Health Check: http://localhost:${actualPort}/health\n`);

  } catch (err) {
    console.warn('⚠️  [Startup] Error:', err.message);
  }
});

const { hangupCall } = require('./services/telephony/telnyxClient');
async function gracefulShutdown(signal) {
  console.log(`\n🛑  [Server] ${signal} recibido. Limpiando...`);
  const promises = Array.from(callState.processedCalls).map(id => hangupCall(id).catch(() => {}));
  await Promise.race([Promise.allSettled(promises), new Promise(r => setTimeout(r, 2000))]);
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2'));

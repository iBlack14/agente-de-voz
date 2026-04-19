const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { parseCookies } = require('../middleware/auth');

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const SESSION_FILE = path.join(__dirname, '../.sessions.json');

// Persistent Session Map
let authSessions = new Map();

// Load sessions from disk
function loadSessions() {
    try {
        if (fs.existsSync(SESSION_FILE)) {
            const data = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
            authSessions = new Map(Object.entries(data));
            console.log(`[Auth] Loaded ${authSessions.size} persistent sessions.`);
        }
    } catch (e) {
        console.error('[Auth] Error loading sessions:', e.message);
    }
}

// Save sessions to disk
function saveSessions() {
    try {
        const obj = Object.fromEntries(authSessions);
        fs.writeFileSync(SESSION_FILE, JSON.stringify(obj), 'utf8');
    } catch (e) {
        console.error('[Auth] Error saving sessions:', e.message);
    }
}

// Initial load
loadSessions();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = require('crypto').randomBytes(32).toString('hex');
    authSessions.set(token, Date.now() + SESSION_TTL_MS);
    saveSessions();

    res.cookie('auth_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SESSION_TTL_MS,
      path: '/',
      secure: false, // Allow http in dev
    });
    console.log(`[Auth] User ${username} logged in. Token: ${token.substring(0, 8)}...`);
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: 'Credenciales inválidas' });
});

router.post('/logout', (req, res) => {
  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies.auth_token) {
      authSessions.delete(cookies.auth_token);
      saveSessions();
  }
  res.clearCookie('auth_token', { httpOnly: true, sameSite: 'strict', path: '/' });
  res.json({ success: true });
});

// Middleware to protect routes
const restrictAccess = (req, res, next) => {
  const publicPaths = ['/login', '/api/login', '/webhook/telnyx', '/health', '/partials/'];
  const isPublic = publicPaths.some(p => req.path.startsWith(p));
  // Never treat HTML pages as public static assets.
  // This prevents bypassing auth via /advanced.html, /simple.html, etc.
  const isStatic = req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico)$/i);
  const isWS = req.headers.upgrade === 'websocket';

  if (isPublic || isStatic || isWS) return next();

  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies.auth_token;
  const expiresAt = authSessions.get(token);

  const isPeriodic = req.path.match(/\/(calls|scheduled|prompts|reminders|health)$/i);
  if (!isPeriodic) {
      console.log(`[Auth] ${req.method} ${req.path} - Token: ${token ? token.substring(0, 8) + '...' : 'NONE'} ${token && expiresAt && expiresAt > Date.now() ? '✅' : '❌'}`);
  }

  if (token && expiresAt && expiresAt > Date.now()) return next();

  if (token) {
      authSessions.delete(token);
      saveSessions();
  }

  if (req.path === '/' || req.path === '/selection' || req.path === '/advanced' || req.path === '/simple') {
      console.log(`[Auth] Redirecting to /login (no valid session)`);
      return res.redirect('/login');
  }

  if (req.path.startsWith('/api')) return res.status(401).json({ error: 'Tu sesión ha expirado por seguridad o reinicio de servidor.', code: 'AUTH_EXPIRED' });
  res.redirect('/login');
};

module.exports = { authRouter: router, restrictAccess, authSessions };

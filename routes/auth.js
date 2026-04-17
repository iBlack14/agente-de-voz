const express = require('express');
const router = express.Router();
const { parseCookies } = require('../middleware/auth');

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const authSessions = new Map();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = require('crypto').randomBytes(32).toString('hex');
    authSessions.set(token, Date.now() + SESSION_TTL_MS);
    res.cookie('auth_token', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: SESSION_TTL_MS,
      path: '/',
    });
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: 'Credenciales inválidas' });
});

router.post('/logout', (req, res) => {
  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies.auth_token) authSessions.delete(cookies.auth_token);
  res.clearCookie('auth_token', { httpOnly: true, sameSite: 'strict', path: '/' });
  res.json({ success: true });
});

// Middleware to protect routes
const restrictAccess = (req, res, next) => {
  const publicPaths = ['/login.html', '/api/login', '/webhook/telnyx', '/health', '/simple.html', '/advanced.html', '/index.html', '/partials/'];
  const isPublic = publicPaths.some(p => req.path.startsWith(p));
  const isStatic = req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|html)$/i);
  const isWS = req.headers.upgrade === 'websocket';
  
  if (isPublic || isStatic || isWS) return next();

  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies.auth_token;
  const expiresAt = authSessions.get(token);

  if (token && expiresAt && expiresAt > Date.now()) return next();
  if (token) authSessions.delete(token);

  if (req.path === '/' || req.path === '/index.html') return res.redirect('/login.html');
  res.status(401).send('Acceso denegado');
};

module.exports = { authRouter: router, restrictAccess, authSessions };

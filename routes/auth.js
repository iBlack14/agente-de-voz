const express = require('express');
const router = express.Router();
const { supabase } = require('../services/db/supabase.service');
const { parseCookies } = require('../middleware/auth');

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days

// Middleware to protect routes (HOISTED for use)
const restrictAccess = async (req, res, next) => {
  try {
    const publicPaths = ['/login', '/api/login', '/webhook/telnyx', '/health', '/partials/', '/assets/'];
    const isPublic = publicPaths.some(p => req.path.startsWith(p));
    const isStatic = req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico)$/i);
    const isWS = req.headers.upgrade === 'websocket';

    if (isPublic || isStatic || isWS) return next();

    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies.auth_token;
    
    if (!token) return handleUnauth(req, res);

    // Check Supabase session
    const { data: session, error } = await supabase
      .from('auth_sessions')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !session || session.expires_at < Date.now()) {
      if (token && !error) await supabase.from('auth_sessions').delete().eq('token', token);
      return handleUnauth(req, res);
    }

    return next();
  } catch (e) {
    console.error('[Auth Middleware] Critical Error:', e.message);
    return handleUnauth(req, res);
  }
};

function handleUnauth(req, res) {
    if (req.path.startsWith('/api')) {
        return res.status(401).json({ error: 'Sesión expirada o inválida.', code: 'AUTH_EXPIRED' });
    }
    res.redirect('/login');
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = Date.now() + SESSION_TTL_MS;

    // Save to Supabase
    await supabase.from('auth_sessions').insert({
        token,
        expires_at: expiresAt
    });

    res.cookie('auth_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SESSION_TTL_MS,
      path: '/',
      secure: false, // Set to true if using https
    });

    console.log(`[Auth] User ${username} logged in. Session persisted in DB.`);
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: 'Credenciales inválidas' });
});

router.post('/logout', async (req, res) => {
  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies.auth_token) {
      await supabase.from('auth_sessions').delete().eq('token', cookies.auth_token);
  }
  res.clearCookie('auth_token', { httpOnly: true, sameSite: 'lax', path: '/' });
  res.json({ success: true });
});

module.exports = { authRouter: router, restrictAccess };

const crypto = require('crypto');

function verifyTelnyxRequest(req) {
  const ENFORCE_TELNYX_SIGNATURE = (process.env.ENFORCE_TELNYX_SIGNATURE || 'true') === 'true';
  if (!ENFORCE_TELNYX_SIGNATURE) return true;

  const signature = req.headers['x-telnyx-signature'];
  const timestamp = req.headers['x-telnyx-timestamp'];
  const TELNYX_PUBLIC_KEY = process.env.TELNYX_PUBLIC_KEY || '';

  if (!signature || !timestamp || !TELNYX_PUBLIC_KEY) return false;

  try {
    const data = timestamp + req.rawBody;
    const expectedSignature = crypto
      .createHmac('sha256', TELNYX_PUBLIC_KEY)
      .update(data)
      .digest('base64');
    return signature === expectedSignature;
  } catch (err) {
    console.error('[Auth] Error verificando firma de Telnyx:', err.message);
    return false;
  }
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    cookies[parts.shift().trim()] = decodeURI(parts.join('='));
  });
  return cookies;
}

module.exports = { verifyTelnyxRequest, parseCookies };

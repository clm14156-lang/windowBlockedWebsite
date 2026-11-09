import { randomUUID } from 'node:crypto';
import { accountApiOrigin } from '../src/site-config.js';

const basePath = '/api/website-session/';
const uuid = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

function fail(status, code) {
  return Object.assign(new Error(code), { status, code });
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

function cookieValue(req, name) {
  const value = (req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(name + '='))?.slice(name.length + 1);
  return uuid.test(value || '') ? value : '';
}

async function jsonBody(req) {
  if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw fail(415, 'validation_failed');
  }
  if (Number(req.headers['content-length']) > 4096) throw fail(413, 'validation_failed');
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 4096) throw fail(413, 'validation_failed');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks)); }
  catch { throw fail(400, 'validation_failed'); }
}

function profile(data) {
  if (!uuid.test(data?.id || '') || typeof data.email !== 'string' || !data.email || data.email.length > 256) {
    throw fail(502, 'service_unavailable');
  }
  return { id: data.id, email: data.email, emailConfirmed: data.emailConfirmed === true };
}

function tokens(data) {
  const expires = Date.parse(data?.refreshTokenExpiresAtUtc);
  const accessExpires = Date.parse(data?.accessTokenExpiresAtUtc);
  if (data?.tokenType !== 'Bearer' || typeof data.accessToken !== 'string' || typeof data.refreshToken !== 'string' ||
      !data.accessToken || !data.refreshToken || !(expires > Date.now()) || !Number.isFinite(accessExpires)) {
    throw fail(502, 'service_unavailable');
  }
  return { accessToken: data.accessToken, refreshToken: data.refreshToken, expires, accessExpires };
}

export function createWebsiteSession({ accountApiBaseUrl, websiteOrigin }) {
  const secure = Boolean(websiteOrigin);
  if (secure && accountApiOrigin(websiteOrigin) !== websiteOrigin) {
    throw new Error('FOCUSTIME_WEBSITE_ORIGIN must be an exact HTTPS origin.');
  }
  const api = accountApiOrigin(accountApiBaseUrl, !secure);
  const sessions = new Map();
  const prefix = secure ? '__Host-' : '';
  const sessionCookie = prefix + 'focustime-session';
  const deviceCookie = prefix + 'focustime-browser';
  const attributes = '; Path=/; HttpOnly; SameSite=Strict' + (secure ? '; Secure' : '');
  const cookie = (name, value, maxAge) => `${name}=${value}${attributes}${maxAge === undefined ? '' : `; Max-Age=${maxAge}`}`;

  async function upstream(operation, payload, accessToken, method = payload ? 'POST' : 'GET') {
    if (!api) throw fail(503, 'not_configured');
    let response;
    try {
      response = await fetch(`${api}/api/v1/${operation}`, {
        method,
        headers: { ...(payload && { 'Content-Type': 'application/json' }), ...(accessToken && { Authorization: `Bearer ${accessToken}` }) },
        body: payload ? JSON.stringify(payload) : undefined,
        signal: AbortSignal.timeout(operation.startsWith('me/security/') ? 20000 : 8000), redirect: 'error', cache: 'no-store',
      });
    } catch (error) {
      throw fail(error.name === 'TimeoutError' ? 504 : 502, error.name === 'TimeoutError' ? 'timeout' : 'service_unavailable');
    }
    if (response.status === 204 && (operation === 'auth/logout' || operation === 'me/security/closure/complete' ||
        operation === 'me/devices/logout-others' || method === 'DELETE')) return;
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const code = typeof data?.code === 'string' && /^[a-z_]{1,48}$/.test(data.code) ? data.code : 'request_failed';
      const error = fail(response.status, response.status >= 500 ? 'service_unavailable' : code);
      error.retryAfter = Number(response.headers.get('Retry-After'));
      if (operation === 'auth/register' && data?.errors && typeof data.errors === 'object') {
        const fields = Object.keys(data.errors).filter(key => ['email', 'password', 'code', 'challengeid'].includes(key.toLowerCase()));
        if (fields.length) error.errors = Object.fromEntries(fields.map(key => [key, []]));
      }
      throw error;
    }
    if (![200, 201].includes(response.status) || !data) throw fail(502, 'service_unavailable');
    return data;
  }

  function refresh(session) {
    if (!session.refreshing) {
      session.requestId ||= randomUUID();
      session.refreshing = upstream('auth/refresh', { refreshToken: session.refreshToken, requestId: session.requestId })
        .then(data => {
          Object.assign(session, tokens(data));
          session.requestId = null;
        })
        .finally(() => { session.refreshing = null; });
    }
    return session.refreshing;
  }

  async function authorized(session, operation, body, method) {
    if (session.refreshing || session.accessExpires <= Date.now()) await refresh(session);
    const token = session.accessToken;
    try {
      return await upstream(operation, body, token, method);
    } catch (error) {
      if (error.status !== 401) throw error;
      if (session.accessToken === token) await refresh(session);
      return upstream(operation, body, session.accessToken, method);
    }
  }

  // Credential changes and refreshes must not race background profile/device requests.
  function serialized(session, work) {
    const pending = (session.pending || Promise.resolve()).then(work);
    session.pending = pending.catch(() => {});
    return pending;
  }

  return async function handleWebsiteSession(req, res, pathname) {
    const operation = pathname.slice(basePath.length);
    try {
      const [area, orderId, action] = operation.split('/');
      const orderAction = area === 'orders' && uuid.test(orderId || '') && ['method', 'simulate-payment'].includes(action) &&
        operation === `orders/${orderId}/${action}`;
      const securityAction = ['email/current/code', 'email/current/verify', 'email/new/code', 'email/complete',
        'password', 'closure/code', 'closure/verify', 'closure/complete'].some(path => operation === `security/${path}`);
      const deviceLogout = area === 'devices' && uuid.test(orderId || '') && operation === `devices/${orderId}/logout`;
      const method = req.method;
      const resource = operation === 'devices' ? 'me/devices' : operation === 'membership' ? 'me/membership' :
        operation === 'orders' ? (method === 'GET' ? 'me/membership-orders?historyOnly=true' : 'me/membership-orders') :
        orderAction ? `me/membership-orders/${orderId}/${action}` : securityAction ? `me/${operation}` :
          deviceLogout ? `me/devices/${orderId}/sessions` : operation === 'devices/logout-others' ? 'me/devices/logout-others' : '';
      if (!['register', 'login', 'me', 'logout'].includes(operation) && !resource) throw fail(404, 'not_found');
      const allowed = operation === 'orders' ? ['GET', 'POST'] : [operation === 'me' || operation === 'membership' || operation === 'devices' ? 'GET' : 'POST'];
      if (!allowed.includes(method)) throw fail(405, 'method_not_allowed');
      const host = req.headers.host || '';
      const origin = websiteOrigin || (/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host) ? `http://${host.toLowerCase()}` : '');
      if (!origin || (req.headers.origin && req.headers.origin !== origin) ||
          (method !== 'GET' && req.headers.origin !== origin) ||
          ['cross-site', 'same-site'].includes(req.headers['sec-fetch-site'])) throw fail(403, 'permission_denied');

      const id = cookieValue(req, sessionCookie);
      const session = sessions.get(id);
      if (operation === 'login' || operation === 'register') {
        const body = await jsonBody(req);
        if (typeof body?.email !== 'string' || !body.email.trim() || body.email.length > 256 ||
            typeof body.password !== 'string' || !body.password.trim() || body.password.length > 128 ||
            (operation === 'login' && typeof body.remember !== 'boolean')) throw fail(400, 'validation_failed');
        if (operation === 'register' && (!uuid.test(body.challengeId || '') || !/^[0-9]{6}$/.test(body.code || ''))) throw fail(400, 'validation_failed');
        const { email, password } = body;
        const remember = operation === 'register' || body.remember;
        for (const [key, entry] of sessions) if (entry.expires <= Date.now()) sessions.delete(key);
        if (sessions.size >= 10000) throw fail(503, 'service_unavailable');
        const deviceId = cookieValue(req, deviceCookie) || randomUUID();
        const device = { installationId: deviceId, name: '专注时光官网', operatingSystem: 'Web', clientVersion: '1.0' };
        const data = await upstream(`auth/${operation}`, operation === 'register'
          ? { email: email.trim(), password, challengeId: body.challengeId, code: body.code, device }
          : { email: email.trim(), password, device });
        const next = tokens(data);
        if (res.destroyed) {
          await upstream('auth/logout', { refreshToken: next.refreshToken }).catch(() => {});
          return;
        }
        const user = profile(data.user);
        const nextId = randomUUID();
        Object.assign(next, { id: nextId, remember });
        sessions.set(nextId, next);
        if (session && sessions.delete(session.id)) {
          void upstream('auth/logout', { refreshToken: session.refreshToken }).catch(() => {});
        }
        const lifetime = remember ? Math.ceil((next.expires - Date.now()) / 1000) : undefined;
        res.setHeader('Set-Cookie', [cookie(sessionCookie, nextId, lifetime), cookie(deviceCookie, deviceId, 31536000)]);
        return json(res, operation === 'register' ? 201 : 200, { user, expiresAtUtc: new Date(next.expires).toISOString() });
      }
      if (operation === 'logout') {
        res.setHeader('Set-Cookie', cookie(sessionCookie, '', 0));
        if (session) {
          try { await serialized(session, async () => { sessions.delete(session.id); await upstream('auth/logout', { refreshToken: session.refreshToken }); }); }
          catch { throw fail(502, 'revocation_failed'); }
        }
        return json(res, 204);
      }
      if (!session || session.expires <= Date.now()) {
        sessions.delete(id);
        throw fail(401, 'authentication_required');
      }
      let result;
      try {
        const body = method === 'POST' ? await jsonBody(req) : undefined;
        if (method === 'POST' && (!body || typeof body !== 'object' || Array.isArray(body))) throw fail(400, 'validation_failed');
        result = await serialized(session, async () => {
          if (sessions.get(session.id) !== session) throw fail(401, 'authentication_required');
          const data = await authorized(session, resource || 'auth/me', body, deviceLogout ? 'DELETE' : undefined);
          if (['security/password', 'security/email/complete'].includes(operation)) {
            const next = tokens(data?.session), user = profile(data?.session?.user);
            Object.assign(session, next, { requestId: null });
            // Replace the browser credential as well as the upstream tokens. Requests already
            // accepted into this session's queue can finish; new requests with the old cookie cannot.
            sessions.delete(session.id);
            session.id = randomUUID();
            sessions.set(session.id, session);
            res.setHeader('Set-Cookie', cookie(sessionCookie, session.id,
              session.remember ? Math.ceil((session.expires - Date.now()) / 1000) : undefined));
            return { user, expiresAtUtc: new Date(next.expires).toISOString(), notificationStatus: data.notificationStatus };
          }
          return data;
        });
      }
      catch (error) {
        if (error.status === 401) sessions.delete(session.id);
        throw error;
      }
      if (sessions.get(session.id) !== session) throw fail(401, 'authentication_required');
      if (operation === 'security/closure/complete') {
        sessions.delete(session.id);
        res.setHeader('Set-Cookie', cookie(sessionCookie, '', 0));
        return json(res, 204);
      }
      if (deviceLogout || operation === 'devices/logout-others') return json(res, 204);
      return json(res, 200, resource ? result : { user: profile(result), expiresAtUtc: new Date(session.expires).toISOString() });
    } catch (error) {
      if (res.destroyed) return;
      if (error.retryAfter > 0) res.setHeader('Retry-After', String(error.retryAfter));
      return json(res, error.status || 500, { code: error.code || 'internal_error', ...(error.errors && { errors: error.errors }) });
    }
  };
}

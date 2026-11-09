import { accountApiOrigin, siteConfig } from './site-config.js';

export class AccountApiError extends Error {
  constructor(code, { status = 0, retryAfterSeconds = 0, fields = [] } = {}) {
    super(code);
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
    this.fields = fields;
  }
}

export async function requestAccount(operation, payload, signal) {
  const session = ['register', 'login', 'me', 'logout', 'membership', 'orders', 'devices'].includes(operation) || /^(orders|security|devices)\//.test(operation);
  const noContent = ['password-reset/complete', 'logout', 'security/closure/complete', 'devices/logout-others'].includes(operation) || /^devices\/[^/]+\/logout$/.test(operation);
  const configured = document.querySelector('meta[name="focustime-api-base"]')?.content || siteConfig.accountApiBaseUrl;
  const loopbackPage = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const origin = accountApiOrigin(configured, loopbackPage);
  if (!session && !origin) throw new AccountApiError('not_configured');
  const timeout = new AbortController();
  const abort = () => timeout.abort();
  const timer = setTimeout(abort, 25000);
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  try {
    const url = operation === 'plans' ? `${origin}/api/v1/membership-plans` :
      session ? `/api/website-session/${operation}` : `${origin}/api/v1/auth/${operation}`;
    const response = await fetch(url, {
      method: ['me', 'membership', 'orders', 'plans', 'devices'].includes(operation) && payload === undefined ? 'GET' : 'POST',
      headers: payload === undefined ? undefined : { 'Content-Type': 'application/json' },
      credentials: session ? 'same-origin' : 'omit', cache: 'no-store', redirect: 'error',
      body: JSON.stringify(payload), signal: timeout.signal,
    });
    if (noContent && response.status === 204) return null;
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new AccountApiError(body?.code || 'request_failed', {
        status: response.status,
        retryAfterSeconds: Number(response.headers.get('Retry-After')) || 0,
        fields: Object.keys(body?.errors || {}).map(key => key.toLowerCase()),
      });
    }
    const expectedStatus = operation === 'register' ? 201 : 200;
    if (!body || noContent || response.status !== expectedStatus) throw new AccountApiError('request_failed');
    return body;
  } catch (error) {
    if (error instanceof AccountApiError) throw error;
    throw new AccountApiError(timeout.signal.aborted ? 'timeout' : 'network_error');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

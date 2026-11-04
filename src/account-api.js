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
  const configured = document.querySelector('meta[name="focustime-api-base"]')?.content || siteConfig.accountApiBaseUrl;
  const loopbackPage = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const origin = accountApiOrigin(configured, loopbackPage);
  if (!origin) throw new AccountApiError('not_configured');
  const timeout = new AbortController();
  const abort = () => timeout.abort();
  const timer = setTimeout(abort, 25000);
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  try {
    const response = await fetch(`${origin}/api/v1/auth/${operation}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'omit', cache: 'no-store', redirect: 'error',
      body: JSON.stringify(payload), signal: timeout.signal,
    });
    if (operation === 'password-reset/complete' && response.status === 204) return null;
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new AccountApiError(body?.code || 'request_failed', {
        status: response.status,
        retryAfterSeconds: Number(response.headers.get('Retry-After')) || 0,
        fields: Object.keys(body?.errors || {}).map(key => key.toLowerCase()),
      });
    }
    const expectedStatus = operation === 'register' ? 201 : 200;
    if (!body || operation === 'password-reset/complete' || response.status !== expectedStatus) throw new AccountApiError('request_failed');
    return body;
  } catch (error) {
    if (error instanceof AccountApiError) throw error;
    throw new AccountApiError(timeout.signal.aborted ? 'timeout' : 'network_error');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

import { emailError, field, fieldError } from './registration.js';
import { requestAccount } from './account-api.js';

export function renderLogin() {
  return `<div class="login-view">
    <img class="login-logo" src="/assets/shiguang-logo.png" width="128" height="128" alt="专注时光" />
    <header class="registration-heading"><h2 id="dialog-title">登录账号</h2><p id="login-subtitle">欢迎回来，继续你的专注之旅</p></header>
    <form class="registration-form" id="login-form" method="dialog" novalidate>
      ${field('email', '邮箱', 'mail', 'email', '', 'login', { placeholder: '请输入邮箱', autocomplete: 'username' })}
      ${field('password', '密码', 'lock', 'password', '<button class="login-link login-recovery" type="button" data-login-recovery>忘记密码？</button>', 'login', { placeholder: '请输入密码', autocomplete: 'current-password' })}
      <p class="registration-error" data-login-error role="alert" hidden></p>
      <button class="button registration-submit" type="submit">登录</button>
    </form>
    <p class="login-register">还没有账号？ <button class="login-link" type="button" data-registration>立即注册</button></p>
  </div>`;
}

function loginError(error) {
  if (error.status === 401) return '邮箱或密码错误';
  if (error.code === 'account_locked') return '登录尝试次数过多，账号已暂时锁定。请稍后重试。';
  if (error.status === 429) return '登录请求过于频繁，请稍后重试。';
  if (error.code === 'session_limit_reached') return '账号登录会话已达上限，请先退出一个已有会话。';
  if (error.code === 'validation_failed') return '请检查邮箱和密码格式。';
  if (error.code === 'not_configured') return '账号服务尚未配置。';
  if (error.code === 'timeout') return '登录请求超时，请稍后重试。';
  if (error.code === 'network_error' || error.code === 'service_unavailable') return '暂时无法连接账号服务，请检查网络后重试。';
  return '登录未完成，请稍后重试。';
}

export function initLoginForm(form, onSuccess, api = requestAccount) {
  const email = form.querySelector('[name="email"]');
  const password = form.querySelector('[name="password"]');
  const submitButton = form.querySelector('[type="submit"]');
  const message = form.querySelector('[data-login-error]');
  const request = new AbortController();
  let pending = false;

  function showError(text = '') {
    message.textContent = text;
    message.hidden = !text;
  }

  function setPending(active) {
    pending = active;
    email.readOnly = password.readOnly = active;
    submitButton.disabled = active;
    submitButton.textContent = active ? '登录中…' : '登录';
    form.setAttribute('aria-busy', String(active));
  }

  function clearError({ target }) {
    if (target !== email && target !== password) return;
    fieldError(form, target);
    showError();
  }

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    showError();
    const invalidEmail = emailError(email);
    const invalidPassword = !password.value.trim() ? '请输入密码' : password.value.length > 128 ? '密码最多 128 个字符' : '';
    fieldError(form, email, invalidEmail);
    fieldError(form, password, invalidPassword);
    if (invalidEmail || invalidPassword) {
      (invalidEmail ? email : password).focus();
      return;
    }
    setPending(true);
    try {
      // Keep the existing default persistent session without a separate UI setting.
      const session = await api('login', { email: email.value.trim(), password: password.value, remember: true }, request.signal);
      if (request.signal.aborted) return;
      if (!session?.user?.id || !session.user.email || !(Date.parse(session.expiresAtUtc) > Date.now())) throw new Error('Invalid session response');
      onSuccess(session);
    } catch (error) {
      if (!request.signal.aborted) showError(loginError(error));
    } finally {
      if (!request.signal.aborted) setPending(false);
    }
  }

  form.addEventListener('input', clearError);
  form.addEventListener('submit', submit);
  return {
    destroy() {
      request.abort();
      form.removeEventListener('input', clearError);
      form.removeEventListener('submit', submit);
      email.value = password.value = '';
    },
  };
}

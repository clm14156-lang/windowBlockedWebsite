import { brand, icon } from './icons.js';
import { AccountApiError, requestAccount } from './account-api.js';

export function field(name, label, leadingIcon, type = 'text', trailing = '', prefix = 'register', options = {}) {
  const id = `${prefix}-${name}`;
  const { placeholder = label, autocomplete = { account: 'username', email: 'email', code: 'one-time-code' }[name] || 'new-password' } = options;
  const account = name === 'account' || name === 'email';
  return `<div class="registration-field" data-registration-field="${name}">
    <label class="visually-hidden" for="${id}">${label}</label>
    <div class="registration-input-row">${icon(leadingIcon)}<input id="${id}" name="${name}" type="${type}" placeholder="${placeholder}" autocomplete="${autocomplete}"${name === 'code' ? ' inputmode="numeric"' : ''}${account ? ' autocapitalize="none" spellcheck="false"' : ''} required aria-describedby="${id}-error"/>${trailing}</div>
    <p class="registration-error" id="${id}-error" data-registration-error="${name}" aria-live="polite" hidden></p>
  </div>`;
}

export function toggle(name, label, prefix = 'register') {
  return `<button type="button" class="registration-password-toggle" data-registration-password="${name}" aria-label="显示${label}" aria-controls="${prefix}-${name}" aria-pressed="false">${icon('eyeOff')}</button>`;
}

export function setPasswordVisibility(input, button, label, visible) {
  input.type = visible ? 'text' : 'password';
  button.setAttribute('aria-pressed', String(visible));
  button.setAttribute('aria-label', `${visible ? '隐藏' : '显示'}${label}`);
  button.innerHTML = icon(visible ? 'eye' : 'eyeOff');
}

export function renderRegistration() {
  return `<div data-registration-view>
    <div class="registration-top">${brand()}</div>
    <header class="registration-heading"><h2 id="dialog-title">注册账号</h2><p id="registration-subtitle">创建账号，同步你的专注记录与设置</p></header>
    <form class="registration-form" id="registration-form" method="dialog" novalidate>
      ${field('account', '邮箱', 'mail', 'email')}
      ${field('code', '验证码', 'shield', 'text', '<button type="button" class="registration-send" data-registration-send>发送验证码</button>')}
      ${field('password', '密码', 'lock', 'password', toggle('password', '密码'))}
      ${field('confirmation', '确认密码', 'lock', 'password', toggle('confirmation', '确认密码'))}
      <p class="registration-status" role="status" aria-live="polite" data-registration-status hidden></p>
      <div class="registration-agreement-field" data-registration-field="agreement">
        <div class="registration-agreement"><input id="register-agreement" name="agreement" type="checkbox" required aria-describedby="register-agreement-error"/><div><label for="register-agreement">我已阅读并同意</label><button type="button" data-registration-policy="terms">《服务协议》</button><span>和</span><button type="button" data-registration-policy="privacy">《隐私政策》</button></div></div>
        <p class="registration-error" id="register-agreement-error" data-registration-error="agreement" aria-live="polite" hidden></p>
      </div>
      <aside class="registration-policy-panel" data-registration-policy-panel hidden><h3 data-registration-policy-title></h3><p data-registration-policy-copy></p><button type="button" data-registration-policy-close>收起</button></aside>
      <button type="submit" class="button registration-submit">注册并开始体验</button>
    </form>
  </div>`;
}

export function emailError(input) {
  if (!input.value.trim()) return '请输入邮箱';
  if (input.validity.typeMismatch || input.value.trim().length > 256) return '请输入有效的邮箱地址';
  return '';
}

function codeError(value) {
  return /^[0-9]{6}$/.test(value.trim()) ? '' : '请输入 6 位邮箱验证码';
}

function passwordError(value) {
  return value.length >= 8 && value.length <= 128 && /\p{L}/u.test(value) && /[0-9]/.test(value)
    ? '' : '密码须为 8–128 个字符，包含字母和数字';
}

export function fieldError(form, input, message = '') {
  const error = form.querySelector(`[data-registration-error="${input.name}"]`);
  error.textContent = message;
  error.hidden = !message;
  input.setAttribute('aria-invalid', String(Boolean(message)));
  form.querySelector(`[data-registration-field="${input.name}"]`).classList.toggle('has-error', Boolean(message));
}

function requestError(error) {
  switch (error.code) {
    case 'email_registered': return ['account', '此邮箱已注册，可以使用「找回密码」'];
    case 'invalid_code': return ['code', '验证码无效、已过期或尝试次数已用完，请重试或重新获取'];
    case 'invalid_reset_ticket': return ['code', '重置凭证已失效，请重新获取验证码'];
    case 'password_policy_failed': return ['password', '密码须为 8–128 个字符，包含字母和数字'];
    case 'not_configured': return ['', '账号服务地址尚未配置'];
    case 'email_unavailable': return ['', '验证码暂时无法发送，请稍后重试'];
    case 'network_error': return ['', '连接账号服务失败，请检查网络后重试'];
    case 'timeout': return ['', '账号服务响应超时，请稍后重试'];
    default:
      if (error.status === 429) return ['', error.retryAfterSeconds ? `请等待 ${error.retryAfterSeconds} 秒后重试` : '操作过于频繁，请稍后重试'];
      if (error.fields?.includes('email')) return ['account', '请输入有效的邮箱地址'];
      if (error.fields?.includes('code')) return ['code', '请输入 6 位邮箱验证码'];
      if (error.fields?.some(field => field === 'password' || field === 'newpassword')) return ['password', '请检查密码是否符合要求'];
      return ['', '账号服务暂时无法完成请求，请稍后重试'];
  }
}

export function validateRegistration(values) {
  const errors = {};
  if (!values.account.trim()) errors.account = '请输入邮箱';
  if (codeError(values.code)) errors.code = codeError(values.code);
  if (passwordError(values.password)) errors.password = passwordError(values.password);
  if (!values.confirmation.trim()) errors.confirmation = '请输入确认密码';
  else if (values.password !== values.confirmation) errors.confirmation = '两次输入的密码不一致';
  if (!values.agreement) errors.agreement = '请先阅读并同意服务协议和隐私政策';
  return errors;
}

export function initRegistrationForm(form, {
  onSuccess = () => {}, now = () => Date.now(),
  schedule = callback => setInterval(callback, 1000), cancel = id => clearInterval(id),
  api = requestAccount,
} = {}) {
  const names = ['account', 'code', 'password', 'confirmation', 'agreement'];
  const fields = Object.fromEntries(names.map(name => [name, form.querySelector(`[name="${name}"]`)]));
  const send = form.querySelector('[data-registration-send]');
  const status = form.querySelector('[data-registration-status]');
  const policy = form.querySelector('[data-registration-policy-panel]');
  const submitButton = form.querySelector('[type="submit"]');
  const request = new AbortController();
  let expires = 0, timer = null, disposed = false, pending = '', challenge = null;
  const error = (name, message) => fieldError(form, fields[name], message);
  function announce(message) { status.textContent = message; status.hidden = !message; }
  function tick() {
    if (disposed) return;
    const remaining = Math.max(0, Math.ceil((expires - now()) / 1000));
    send.disabled = Boolean(pending) || remaining > 0;
    send.textContent = pending === 'send' ? '发送中…' : remaining ? `${remaining}秒后重发` : '发送验证码';
    if (!remaining && timer !== null) { cancel(timer); timer = null; }
  }
  function cooldown(seconds) {
    expires = now() + seconds * 1000;
    if (timer === null) timer = schedule(tick);
    tick();
  }
  function busy(operation) {
    pending = operation;
    form.setAttribute('aria-busy', String(Boolean(operation)));
    submitButton.disabled = Boolean(operation);
    submitButton.textContent = operation === 'submit' ? '注册中…' : '注册并开始体验';
    for (const name of names) if (name !== 'agreement') fields[name].readOnly = Boolean(operation);
    fields.agreement.disabled = Boolean(operation);
    tick();
  }
  async function sendCode() {
    if (pending || now() < expires) return;
    const message = emailError(fields.account);
    error('account', message);
    announce('');
    if (message) { fields.account.focus(); return; }
    const email = fields.account.value.trim();
    busy('send');
    try {
      const response = await api('registration-code', { email }, request.signal);
      if (disposed) return;
      if (!response?.challengeId) throw new AccountApiError('request_failed');
      challenge = { id: response.challengeId, email: email.toLowerCase() };
      fields.code.value = '';
      error('code');
      cooldown(response.resendAfterSeconds || 60);
      announce('验证码已发送，请查看邮箱');
    } catch (failure) {
      if (disposed) return;
      if (failure.retryAfterSeconds) cooldown(failure.retryAfterSeconds);
      error('account', requestError(failure)[1]);
    } finally { if (!disposed) busy(''); }
  }
  function click(event) {
    const button = event.target.closest('button');
    if (!button || !form.contains(button) || disposed) return;
    if (button === send) return sendCode();
    if (button.hasAttribute('data-registration-password')) {
      const name = button.dataset.registrationPassword, input = fields[name];
      setPasswordVisibility(input, button, name === 'password' ? '密码' : '确认密码', input.type === 'password');
    } else if (button.hasAttribute('data-registration-policy')) {
      const terms = button.dataset.registrationPolicy === 'terms';
      form.querySelector('[data-registration-policy-title]').textContent = terms ? '账号服务说明' : '账号数据说明';
      form.querySelector('[data-registration-policy-copy]').textContent = terms
        ? '邮箱验证后创建专注时光账号，可用于 Windows 客户端。请妥善保管密码与验证码。'
        : '邮箱和账号验证信息由专注时光账号服务处理，密码以哈希形式存储。网页表单不会在浏览器中保存密码或验证码。';
      policy.hidden = false;
    } else if (button.hasAttribute('data-registration-policy-close')) {
      policy.hidden = true;
      form.querySelector('[data-registration-policy]').focus();
    }
  }
  function input(event) {
    const name = event.target.name;
    if (!names.includes(name)) return;
    error(name);
    if (name === 'password') error('confirmation');
    if (name === 'account') {
      announce('');
      if (challenge && fields.account.value.trim().toLowerCase() !== challenge.email) {
        challenge = null;
        fields.code.value = '';
        error('code');
      }
    }
  }
  async function submit(event) {
    event.preventDefault();
    if (disposed || pending) return;
    const values = Object.fromEntries(names.map(name => [name, name === 'agreement' ? fields[name].checked : fields[name].value]));
    const errors = validateRegistration(values);
    const emailMessage = emailError(fields.account);
    if (emailMessage) errors.account = emailMessage;
    if (!challenge || challenge.email !== values.account.trim().toLowerCase()) errors.code ||= '请先获取此邮箱的验证码';
    for (const name of names) error(name, errors[name]);
    announce('');
    const first = names.find(name => errors[name]);
    if (first) { fields[first].focus(); return; }
    busy('submit');
    try {
      const session = await api('register', { email: values.account.trim(), challengeId: challenge.id,
        code: values.code.trim(), password: values.password }, request.signal);
      if (disposed) return;
      if (!session?.user?.id || !session.user.email || !(Date.parse(session.expiresAtUtc) > Date.now())) throw new AccountApiError('request_failed');
      onSuccess(session);
    } catch (failure) {
      if (disposed) return;
      const [name, message] = requestError(failure);
      if (name) { error(name, message); fields[name].focus(); }
      else announce(message);
    } finally { if (!disposed) busy(''); }
  }
  form.addEventListener('click', click);
  form.addEventListener('input', input);
  form.addEventListener('change', input);
  form.addEventListener('submit', submit);
  return {
    destroy() {
      if (disposed) return;
      disposed = true;
      request.abort();
      if (timer !== null) { cancel(timer); timer = null; }
      for (const [type, handler] of [['click', click], ['input', input], ['change', input], ['submit', submit]]) form.removeEventListener(type, handler);
      for (const name of names) { fields[name].value = ''; fields[name].checked = false; }
      fields.password.type = fields.confirmation.type = 'password';
    },
  };
}

export function renderPasswordRecovery() {
  const back = `<div class="registration-top"><button type="button" class="recovery-back" data-recovery-back>${icon('arrow')}返回</button></div>`;
  const heading = (step, title, subtitle) => `<header class="registration-heading">
    <h2 id="recovery-${step}-title" tabindex="-1">${title}</h2><p id="recovery-${step}-subtitle">${subtitle}</p>
  </header>`;
  return `<div class="password-recovery" data-recovery-view hidden>
    <section data-recovery-step="email" hidden>
      ${back}
      ${heading('email', '找回密码', '输入注册邮箱，获取验证码')}
      <form class="registration-form recovery-email-form" id="recovery-email-form" method="dialog" novalidate>
        ${field('email', '邮箱', 'mail', 'email', '', 'recovery')}
        <button type="submit" class="button registration-submit">发送验证码</button>
      </form>
    </section>
    <section data-recovery-step="reset" hidden>
      ${back}
      ${heading('reset', '重置密码', '验证邮箱并设置新的登录密码')}
      <form class="registration-form" id="recovery-reset-form" method="dialog" novalidate>
        <div class="recovery-code-row">
          ${field('code', '邮箱验证码', 'shield', 'text', '', 'recovery')}
          <button type="button" class="registration-send" data-recovery-resend>发送验证码</button>
        </div>
        <p class="registration-status recovery-code-status" data-recovery-code-status role="status" aria-live="polite"></p>
        ${field('password', '设置新密码', 'lock', 'password', toggle('password', '新密码', 'recovery'), 'recovery')}
        ${field('confirmation', '确认新密码', 'lock', 'password', toggle('confirmation', '确认新密码', 'recovery'), 'recovery')}
        <button type="submit" class="button registration-submit">重置密码</button>
      </form>
    </section>
    <section class="recovery-success" data-recovery-step="success" hidden>
      <span class="recovery-success-icon">${icon('check')}</span>
      ${heading('success', '密码重置成功', '请使用新密码登录 Windows 客户端')}
      <button type="button" class="button registration-submit" data-recovery-done>返回注册</button>
    </section>
  </div>`;
}

export function initPasswordRecovery(dialog, {
  now = () => Date.now(), api = requestAccount,
  schedule = callback => setInterval(callback, 1000), cancel = id => clearInterval(id),
} = {}) {
  const registration = dialog.querySelector('[data-registration-view]');
  const registrationForm = registration.querySelector('form');
  const recovery = dialog.querySelector('[data-recovery-view]');
  const panels = {
    email: recovery.querySelector('[data-recovery-step="email"]'),
    reset: recovery.querySelector('[data-recovery-step="reset"]'),
    success: recovery.querySelector('[data-recovery-step="success"]'),
  };
  const emailForm = recovery.querySelector('#recovery-email-form');
  const resetForm = recovery.querySelector('#recovery-reset-form');
  const email = emailForm.querySelector('[name="email"]');
  const code = resetForm.querySelector('[name="code"]');
  const password = resetForm.querySelector('[name="password"]');
  const confirmation = resetForm.querySelector('[name="confirmation"]');
  const resetFields = [code, password, confirmation];
  const passwordControls = [
    [password, resetForm.querySelector('[data-registration-password="password"]'), '新密码'],
    [confirmation, resetForm.querySelector('[data-registration-password="confirmation"]'), '确认新密码'],
  ];
  const resend = resetForm.querySelector('[data-recovery-resend]');
  const status = resetForm.querySelector('[data-recovery-code-status]');
  const emailSubmit = emailForm.querySelector('[type="submit"]');
  const resetSubmit = resetForm.querySelector('[type="submit"]');
  const backs = [panels.email, panels.reset].map(panel => panel.querySelector('[data-recovery-back]'));
  const request = new AbortController();
  let step = 'registration';
  let challenge = null;
  let ticket = null;
  let resendAt = 0;
  let timer = null;
  let pending = '';
  let disposed = false;

  function stopTimer() {
    if (timer !== null) cancel(timer);
    timer = null;
  }

  function updateCountdown() {
    const seconds = Math.max(0, Math.ceil((resendAt - now()) / 1000));
    resend.disabled = Boolean(pending) || seconds > 0;
    resend.textContent = pending === 'resend' ? '发送中…' : seconds ? `${seconds}秒后重发` : '发送验证码';
    if (!seconds) stopTimer();
  }

  function startCountdown() {
    stopTimer();
    updateCountdown();
    if (resendAt > now()) timer = schedule(updateCountdown);
  }

  function busy(operation) {
    pending = operation;
    const active = Boolean(operation);
    for (const button of [...backs, emailSubmit, resetSubmit]) button.disabled = active;
    for (const input of [email, ...resetFields]) input.readOnly = active;
    emailForm.setAttribute('aria-busy', String(operation === 'send'));
    resetForm.setAttribute('aria-busy', String(operation === 'reset' || operation === 'resend'));
    emailSubmit.textContent = operation === 'send' ? '发送中…' : '发送验证码';
    resetSubmit.textContent = operation === 'reset' ? '重置中…' : '重置密码';
    updateCountdown();
  }

  function clearReset() {
    for (const input of resetFields) {
      input.value = '';
      fieldError(resetForm, input);
    }
    for (const [input, button, label] of passwordControls) setPasswordVisibility(input, button, label, false);
    status.textContent = '';
  }

  function show(next) {
    stopTimer();
    step = next;
    const registering = next === 'registration';
    registration.hidden = !registering;
    recovery.hidden = registering;
    for (const [name, panel] of Object.entries(panels)) panel.hidden = name !== next;
    const titleId = registering ? 'dialog-title' : `recovery-${next}-title`;
    dialog.setAttribute('aria-labelledby', titleId);
    dialog.setAttribute('aria-describedby', registering ? 'registration-subtitle' : `recovery-${next}-subtitle`);
    dialog.scrollTop = 0;
    const focus = { registration: registrationForm.querySelector('input'), email, reset: code }[next] || recovery.querySelector(`#${titleId}`);
    focus.focus();
    if (next === 'reset') startCountdown();
  }

  async function sendCode(address, resending) {
    busy(resending ? 'resend' : 'send');
    try {
      const response = await api('password-reset/code', { email: address }, request.signal);
      if (disposed) return;
      if (!response?.challengeId) throw new AccountApiError('request_failed');
      clearReset();
      challenge = { id: response.challengeId, email: address.toLowerCase() };
      ticket = null;
      resendAt = now() + (response.resendAfterSeconds || 60) * 1000;
      status.textContent = '如果该邮箱已注册，请查看邮箱中的验证码';
      if (resending) startCountdown();
      else show('reset');
    } catch (failure) {
      if (disposed) return;
      const message = requestError(failure)[1];
      if (resending) {
        if (failure.retryAfterSeconds) {
          resendAt = now() + failure.retryAfterSeconds * 1000;
          startCountdown();
        }
        status.textContent = message;
      } else fieldError(emailForm, email, message);
    } finally { if (!disposed) busy(''); }
  }

  function submitEmail(event) {
    event.preventDefault();
    if (step !== 'email' || pending) return;
    const error = emailError(email);
    fieldError(emailForm, email, error);
    if (error) { email.focus(); return; }
    const address = email.value.trim();
    if (challenge?.email === address.toLowerCase() && now() < resendAt) {
      status.textContent = '如果该邮箱已注册，请查看邮箱中的验证码';
      show('reset');
      return;
    }
    return sendCode(address, false);
  }

  async function submitReset(event) {
    event.preventDefault();
    if (step !== 'reset' || pending) return;
    const enteredCode = code.value.trim();
    const errors = [
      codeError(enteredCode) || (!challenge ? '请重新获取邮箱验证码' : ''),
      passwordError(password.value),
      !confirmation.value.trim() ? '请确认新密码' : password.value !== confirmation.value ? '两次输入的密码不一致' : '',
    ];
    resetFields.forEach((input, index) => fieldError(resetForm, input, errors[index]));
    const firstError = errors.findIndex(Boolean);
    if (firstError !== -1) { resetFields[firstError].focus(); return; }
    busy('reset');
    try {
      if (!ticket || ticket.code !== enteredCode) {
        const result = await api('password-reset/verify', { challengeId: challenge.id, code: enteredCode }, request.signal);
        if (disposed) return;
        if (!result?.resetTicket) throw new AccountApiError('request_failed');
        ticket = { value: result.resetTicket, code: enteredCode };
      }
      await api('password-reset/complete', { resetTicket: ticket.value, newPassword: password.value }, request.signal);
      if (disposed) return;
      show('success');
      clearReset();
      email.value = '';
      challenge = ticket = null;
      resendAt = 0;
    } catch (failure) {
      if (disposed) return;
      if (failure.code === 'invalid_reset_ticket') challenge = ticket = null;
      const [name, message] = requestError(failure);
      if (name === 'code' || name === 'password') {
        const input = name === 'code' ? code : password;
        fieldError(resetForm, input, message);
        input.focus();
      } else status.textContent = message;
    } finally { if (!disposed) busy(''); }
  }

  function startRecovery() {
    if (step === 'registration' && registrationForm.getAttribute('aria-busy') !== 'true') show('email');
  }

  function handleClick(event) {
    const button = event.target.closest('button');
    if (pending) return;
    if (button?.hasAttribute('data-recovery-back')) {
      if (step === 'reset') {
        if (ticket) challenge = ticket = null;
        clearReset();
        show('email');
      }
      else if (step === 'email') show('registration');
    } else if (step === 'reset' && button === resend && now() >= resendAt) {
      return sendCode(email.value.trim(), true);
    } else if (step === 'reset') {
      const control = passwordControls.find(([, toggleButton]) => toggleButton === button);
      if (control) setPasswordVisibility(...control, control[0].type === 'password');
    } else if (step === 'success' && button?.hasAttribute('data-recovery-done')) show('registration');
  }

  function clearError(event) {
    const input = event.target;
    if (step === 'email' && input === email) fieldError(emailForm, email);
    if (step === 'reset' && resetFields.includes(input)) {
      fieldError(resetForm, input);
      if (input === password) fieldError(resetForm, confirmation);
    }
  }

  const listeners = [
    [dialog, 'click', handleClick], [recovery, 'input', clearError],
    [emailForm, 'submit', submitEmail], [resetForm, 'submit', submitReset],
  ];
  for (const [target, type, listener] of listeners) target.addEventListener(type, listener);
  return {
    start: startRecovery,
    destroy() {
      disposed = true;
      request.abort();
      stopTimer();
      for (const [target, type, listener] of listeners) target.removeEventListener(type, listener);
      clearReset();
      email.value = '';
      challenge = ticket = null;
      resendAt = 0;
      dialog.setAttribute('aria-labelledby', 'dialog-title');
    },
  };
}

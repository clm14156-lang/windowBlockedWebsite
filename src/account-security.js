import { icon } from './icons.js';
import { requestAccount } from './account-api.js';

const text = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const titles = { email:'修改登录邮箱', password:'修改登录密码', devices:'登录设备', closure:'注销账号' };
const date = value => {
  const time = new Date(value);
  return Number.isNaN(time.getTime()) ? '暂未提供' : new Intl.DateTimeFormat('zh-CN', {
    year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false,
  }).format(time);
};
const button = (label, action, style = 'primary', extra = '') => `<button type="button" class="security-button security-${style}" data-security-action="${action}" ${extra}>${label}</button>`;
const footer = content => `<div class="security-error" data-security-error role="alert"></div><footer class="security-footer">${content}</footer>`;
const submit = (label, disabled = false, danger = false) => `<button class="security-button security-${danger ? 'danger' : 'primary'}" type="submit" ${disabled ? 'disabled' : ''}>${label}</button>`;
const notice = content => `<div class="security-notice">${content}</div>`;
const success = (title, content, action = 'close') => `<div class="security-result"><span class="security-result-icon">${icon('check')}</span><h3 tabindex="-1">${title}</h3>${content}</div>${footer(button('知道了', action))}`;

export function renderAccountSecurity(kind) {
  return `<section class="security-modal" data-security-root><header class="security-header"><h2 id="dialog-title">${titles[kind] || '账号与安全'}</h2></header><div data-security-content></div></section>`;
}

export function initAccountSecurity(root, { kind, profile, close, sessionUpdated, devicesUpdated, closed }) {
  const content = root.querySelector('[data-security-content]');
  const abort = new AbortController();
  const values = { oldCode:'', newEmail:'', newCode:'', closureCode:'', currentPassword:'', newPassword:'', confirmPassword:'' };
  const challenges = {};
  let step = kind === 'email' ? 'old' : kind === 'closure' ? 'risk' : 'form';
  let proof, proofExpires = 0, busy = false, destroyed = false, devices = [], selected, resultTitle = '', loadError = false;
  let submittedEmail = '', notificationStatus = '';

  function field(name, label, { type = 'text', placeholder = '', glyph = '', readOnly = false, value = values[name] || '', extra = '' } = {}) {
    return `<label class="security-field" for="security-${name}"><span>${label}</span><span class="security-input-wrap">${glyph ? icon(glyph) : ''}<input id="security-${name}" name="${name}" type="${type}" value="${text(value)}" placeholder="${placeholder}" ${readOnly ? 'readonly' : 'required'} ${type === 'password' ? 'maxlength="128" autocomplete="'+(name === 'currentPassword' ? 'current-password' : 'new-password')+'"' : type === 'email' ? 'maxlength="256" autocomplete="email"' : 'autocomplete="off"'} ${extra}/>${type === 'password' ? `<button class="security-eye" type="button" data-security-eye="${name}" aria-label="显示${label}" aria-pressed="false">${icon('eyeOff')}</button>` : ''}</span></label>`;
  }

  function codeField(name, which) {
    return `<div class="security-code-row">${field(name, '邮箱验证码', { placeholder:'请输入验证码', glyph:'shield', extra:'inputmode="numeric" pattern="[0-9]{6}" minlength="6" maxlength="6"' })}<button type="button" class="security-code-button" data-security-send="${which}">获取验证码</button></div><p class="security-hint" data-security-validity="${which}"></p>`;
  }

  function stepper() {
    const current = step === 'old' ? 0 : step === 'new' || step === 'email-failure' ? 1 : 2;
    return `<ol class="security-steps" aria-label="修改邮箱进度">${['验证当前邮箱', '绑定新邮箱', '修改成功'].map((label,i) => `<li class="${i < current ? 'complete' : i === current ? 'current' : ''}" ${i === current ? 'aria-current="step"' : ''}><span>${i < current ? icon('check') : i+1}</span><small>${label}</small></li>`).join('')}</ol>`;
  }

  function emailView() {
    if (step === 'email-failure') return `<div class="security-result is-failure"><span class="security-result-icon">!</span><h3 tabindex="-1">修改失败</h3><p>该邮箱已被其他账号绑定，请更换其他邮箱。</p></div>${footer(button('重新填写', 'retry-email')+button('取消', 'close', 'secondary'))}`;
    if (step === 'success') return stepper()+success('修改成功', `<p>你的登录邮箱已更新为</p><div class="security-email-result">${icon('mail')}${text(submittedEmail)}</div>${notice(`<p>${icon('mail')}${notificationStatus === 'queued' ? '已安排向原邮箱和新邮箱发送安全通知。' : '请留意原邮箱和新邮箱的安全通知。'}</p><p>${icon('check')}其他设备已退出，当前设备保持登录。</p>`)}`);
    return `${stepper()}<form data-security-form novalidate><p class="security-intro">${step === 'old' ? '为了保障账号安全，请先验证当前登录邮箱。' : '请输入新的邮箱地址并完成验证。'}</p>
      ${step === 'old' ? field('currentEmail','当前邮箱',{type:'email',glyph:'mail',readOnly:true,value:profile.email}) + codeField('oldCode','old') : field('newEmail','新邮箱',{type:'email',glyph:'mail',placeholder:'请输入新的邮箱地址'}) + codeField('newCode','new')}
      ${footer(button(step === 'old' ? '取消' : '上一步', step === 'old' ? 'close' : 'previous', 'secondary') + submit(step === 'old' ? '下一步' : '确认修改'))}</form>`;
  }

  function passwordView() {
    if (step === 'success') return success('密码修改成功', notice(`<p>${icon('check')}当前设备已保持登录。</p><p>${icon('devices')}其他设备已退出登录，下次使用需重新登录。</p><p>${icon('mail')}${notificationStatus === 'queued' ? '已安排向' : '请留意'} <strong>${text(profile.email)}</strong> ${notificationStatus === 'queued' ? '发送密码修改通知。' : '的密码修改通知。'}</p>`));
    return `<form class="security-password-form" data-security-form novalidate>
      ${field('currentPassword','当前密码',{type:'password',placeholder:'请输入当前密码'})}
      ${field('newPassword','新密码',{type:'password',placeholder:'请输入新密码'})}<p class="security-hint" data-security-password-rule>密码长度 8–128 位，需包含字母和数字。</p>
      ${field('confirmPassword','确认新密码',{type:'password',placeholder:'请再次输入新密码'})}
      ${footer(button('取消','close','secondary')+submit('确认修改',true))}</form>`;
  }

  function deviceDetails(device) {
    const starts = (device.sessions || []).map(s => Date.parse(s.createdAtUtc)).filter(Number.isFinite);
    return `<p>${text(device.operatingSystem || '未知类型')}${device.clientVersion ? ` · ${text(device.clientVersion)}` : ''}${device.isCurrentDevice ? ' · 当前设备' : ''}</p><p>登录时间：${starts.length ? date(Math.min(...starts)) : '暂未提供'}</p><p>最近活动：${date(device.lastSeenAtUtc)}</p>`;
  }

  function devicesView() {
    if (step === 'success') return success(resultTitle, '<p>设备登录状态已失效，再次使用时需重新登录。</p>', 'back-devices');
    if (step === 'confirm-device' || step === 'confirm-others') {
      const other = step === 'confirm-others';
      return `<div class="security-result ${other ? 'is-warning' : 'is-failure'}"><span class="security-result-icon">${icon('devices')}</span><h3 tabindex="-1">${other ? '确定退出其他所有设备的登录吗？' : '确定退出这台设备的登录吗？'}</h3>${other ? '<p>除当前设备外，其他设备的登录状态将立即失效，需重新登录。</p>' : `<div class="security-device-confirm"><strong>${text(selected.name)}</strong>${deviceDetails(selected)}</div>`}</div><form data-security-form>${footer(button('取消','back-devices','secondary')+submit('确认退出',false,!other))}</form>`;
    }
    return `<p class="security-intro">查看和管理当前账号的登录设备。</p><h3 class="security-list-title">已登录设备（${devices.length} 台）</h3><div class="security-device-list">${devices.map(d => `<article class="security-device"><span class="security-device-icon">${icon('devices')}</span><div class="security-device-copy"><h4>${text(d.name || '未命名设备')}</h4>${deviceDetails(d)}</div>${d.isCurrentDevice ? '<span class="security-current-tag">当前设备</span>' : button('退出登录','logout-device','danger-outline',`data-device-id="${text(d.id)}"`)}</article>`).join('') || `<p class="security-empty">${loadError ? '设备信息读取失败，请重试。' : '正在读取登录设备…'}</p>`}</div>${footer(loadError ? button('重新读取','reload-devices') : `<p class="security-device-note">${icon('info')}退出其他设备后，这些设备需要重新登录。</p>${button('退出其他设备','logout-others','primary',devices.some(d=>!d.isCurrentDevice) ? '' : 'disabled')}`)}`;
  }

  function closureView() {
    if (step === 'risk') return `<div class="security-risk-banner">${icon('alert')}注销后，账号将停用且无法继续登录。</div><div class="security-risk-copy"><h3>注销后将产生以下影响：</h3><ul><li>账号无法登录，所有登录设备的会话均会失效。</li><li>云端专注、任务及同步记录暂时保留。</li><li>会员权益终止；离线缓存权益按现有有效期失效。</li><li>本地设备上的专注记录不会自动删除。</li></ul></div>${footer(button('取消','close','secondary')+button('继续注销','continue-closure'))}`;
    if (step === 'verify') return `<form data-security-form novalidate><p class="security-intro">为确保是你本人操作，请先进行邮箱验证。</p><p class="security-current-email">${icon('mail')}当前绑定邮箱 <strong>${text(profile.email)}</strong></p>${codeField('closureCode','closure')}${footer(button('取消','close','secondary')+submit('验证并继续'))}</form>`;
    return `<div class="security-final-risk"><h3>${icon('alert')}确定要注销该账号吗？</h3><p>注销后账号将立即停用，所有登录会话失效，会员权益终止。云端记录暂时保留，本地记录不会自动删除。</p></div><form data-security-form>${footer(button('再考虑一下','close','secondary')+submit('确认注销',false,true))}</form>`;
  }

  function render(focus = true) {
    if (destroyed) return;
    root.querySelector('#dialog-title').textContent = kind === 'closure' && step === 'confirm' ? '确认注销' : titles[kind];
    root.classList.toggle('security-devices-modal', kind === 'devices');
    content.innerHTML = kind === 'email' ? emailView() : kind === 'password' ? passwordView() : kind === 'devices' ? devicesView() : closureView();
    updateInputs(); updateTimers();
    if (busy) setBusy(true);
    if (focus) (content.querySelector('input:not([readonly]), h3[tabindex], [data-security-action]') || root.querySelector('h2')).focus({preventScroll:true});
  }

  function setBusy(active) {
    busy = active; root.setAttribute('aria-busy',String(active));
    root.querySelectorAll('button, input').forEach(el => {
      if (active) { el.dataset.securityDisabled = String(el.disabled); el.disabled = true; }
      else { el.disabled = el.dataset.securityDisabled === 'true'; delete el.dataset.securityDisabled; }
    });
    if (!active) { updateInputs(); updateTimers(); }
  }

  function showError(error) {
    if (destroyed) return;
    const messages = {
      invalid_code:'验证码不正确或已过期，请检查后重试。', verification_expired:'邮箱验证已过期，请重新验证当前邮箱。',
      email_registered:'该邮箱已被其他账号绑定，请更换邮箱。', email_unchanged:'请输入与当前邮箱不同的新邮箱。',
      current_password_incorrect:'当前密码不正确，请重新输入。', password_policy_failed:'新密码需为 8–128 位，且包含字母和数字。',
      password_unchanged:'新密码不能与当前密码相同。', account_locked:'密码错误次数过多，请稍后再试。',
      email_unavailable:'邮件发送失败，请稍后重试。', not_found:'该设备已不存在，请刷新设备列表。',
      timeout:'请求超时，请检查当前状态后重试。', validation_failed:'请检查填写内容。',
    };
    if (error.status === 401) { content.querySelector('[data-security-error]').textContent = '登录状态已失效，请刷新页面后重新登录。'; return; }
    if (kind === 'email' && step === 'new' && error.code === 'email_registered') { step = 'email-failure'; render(); return; }
    if (error.code === 'verification_expired' && kind === 'email') { proof = null; step = 'old'; render(); }
    if (error.code === 'verification_expired' && kind === 'closure') { proof = null; delete challenges.closure; values.closureCode = ''; step = 'verify'; render(); }
    const area = content.querySelector('[data-security-error]');
    const message = messages[error.code] || (!error.code && error.message) || '连接账号服务失败，请稍后重试。';
    area.textContent = error.retryAfterSeconds ? `请求过于频繁，请在 ${error.retryAfterSeconds} 秒后重试。` : message;
  }

  async function run(work) {
    if (busy || destroyed) return;
    content.querySelector('[data-security-error]')?.replaceChildren();
    setBusy(true);
    try { await work(); } catch(error) { showError(error); }
    finally { if (!destroyed) setBusy(false); }
  }

  async function api(path, payload = {}) {
    const result = await requestAccount(path, payload, abort.signal);
    if (destroyed) throw new Error('Dialog closed');
    return result;
  }

  const passwordValid = () => values.newPassword.length >= 8 && values.newPassword.length <= 128 && /\p{L}/u.test(values.newPassword) && /[0-9]/.test(values.newPassword);
  function updateInputs() {
    if (busy) return;
    if (kind === 'password' && step === 'form') {
      content.querySelector('[type="submit"]').disabled = !values.currentPassword || !passwordValid() || values.newPassword !== values.confirmPassword;
      const hint = content.querySelector('[data-security-password-rule]');
      hint.classList.toggle('is-valid', passwordValid());
      hint.textContent = `${passwordValid() ? '✓ ' : ''}密码长度 8–128 位，需包含字母和数字。`;
    }
    const newSend = content.querySelector('[data-security-send="new"]');
    if (newSend) newSend.disabled = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.newEmail.trim()) || values.newEmail.trim().toLowerCase() === profile.email.toLowerCase();
  }

  function updateTimers() {
    if (busy) return;
    for (const which of ['old','new','closure']) {
      const send = content.querySelector(`[data-security-send="${which}"]`), challenge = challenges[which];
      if (!send) continue;
      const wait = Math.max(0, Math.ceil(((challenge?.resendAt || 0) - Date.now())/1000));
      send.textContent = wait ? `重新发送 (${wait}s)` : challenge ? '重新发送' : '获取验证码';
      send.disabled = wait > 0 || (which === 'new' && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.newEmail.trim()) || values.newEmail.trim().toLowerCase() === profile.email.toLowerCase()));
      const hint = content.querySelector(`[data-security-validity="${which}"]`);
      if (hint) hint.textContent = challenge?.challengeId ? Date.parse(challenge.expiresAtUtc) > Date.now() ? `验证码已发送，有效至 ${date(challenge.expiresAtUtc)}。` : '验证码已过期，请重新获取。' : '';
    }
  }

  async function sendCode(which) {
    const path = which === 'old' ? 'email/current/code' : which === 'new' ? 'email/new/code' : 'closure/code';
    const payload = which === 'new' ? { ticket:proof, newEmail:values.newEmail.trim() } : {};
    try {
      const response = await api(`security/${path}`, payload);
      challenges[which] = { ...response, email:which === 'new' ? values.newEmail.trim().toLowerCase() : profile.email, resendAt:Date.now()+response.resendAfterSeconds*1000 };
    } catch(error) {
      if (error.retryAfterSeconds) challenges[which] = { ...challenges[which], resendAt:Date.now()+error.retryAfterSeconds*1000 };
      throw error;
    }
  }

  function requireCode(which, name) {
    const challenge = challenges[which];
    if (!challenge?.challengeId) throw { code:'invalid_code', message:'请先获取邮箱验证码。' };
    if (Date.parse(challenge.expiresAtUtc) <= Date.now()) throw { code:'invalid_code' };
    if (!/^[0-9]{6}$/.test(values[name])) throw { message:'请输入 6 位数字验证码。' };
    if (which === 'new' && values.newEmail.trim().toLowerCase() !== challenge.email) throw { message:'邮箱地址已更改，请重新获取验证码。' };
    return {challengeId:challenge.challengeId,code:values[name]};
  }

  async function loadDevices() {
    loadError = false;
    try {
      const list = await requestAccount('devices', undefined, abort.signal);
      if (destroyed) return;
      if (!Array.isArray(list)) throw new Error('设备信息格式不正确。');
      devices = list; devicesUpdated?.(list);
    } catch(error) { if (!destroyed) { loadError = true; throw error; } }
    finally { if (!destroyed) render(false); }
  }

  root.addEventListener('input', event => {
    const input = event.target;
    if (Object.hasOwn(values,input.name)) values[input.name] = input.value;
    updateInputs(); updateTimers();
  }, {signal:abort.signal});
  root.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (!target || busy) return;
    if (target.dataset.securityEye) {
      const input = content.querySelector(`[name="${target.dataset.securityEye}"]`);
      const visible = input.type === 'password'; input.type = visible ? 'text' : 'password';
      target.innerHTML = icon(visible ? 'eye' : 'eyeOff'); target.setAttribute('aria-pressed',String(visible));
      target.setAttribute('aria-label',`${visible ? '隐藏' : '显示'}${input.closest('label').querySelector('span').textContent}`);
      return;
    }
    if (target.dataset.securitySend) { void run(()=>sendCode(target.dataset.securitySend)); return; }
    const action = target.dataset.securityAction;
    if (action === 'close') close();
    else if (action === 'previous') { step='old'; render(); }
    else if (action === 'retry-email') { step='new'; values.newCode=''; render(); }
    else if (action === 'continue-closure') void run(async()=>{ step='verify'; render(); await sendCode('closure'); });
    else if (action === 'back-devices') { step='form'; render(); }
    else if (action === 'reload-devices') void run(loadDevices);
    else if (action === 'logout-others') { step='confirm-others'; render(); }
    else if (action === 'logout-device') { selected=devices.find(d=>d.id===target.dataset.deviceId && !d.isCurrentDevice); if (selected) {step='confirm-device';render();} }
  }, {signal:abort.signal});
  root.addEventListener('submit', event => {
    event.preventDefault();
    void run(async()=>{
      if (kind === 'email') {
        if (step === 'old') {
          if (!proof || proofExpires <= Date.now()) {
            const response=await api('security/email/current/verify',requireCode('old','oldCode'));
            proof=response.ticket; proofExpires=Date.parse(response.expiresAtUtc);
          }
          step='new'; render();
        } else {
          const response=await api('security/email/complete',{ticket:proof,...requireCode('new','newCode')});
          submittedEmail=response.user.email; notificationStatus=response.notificationStatus;
          sessionUpdated(response); proof=null; step='success'; render();
        }
      } else if (kind === 'password') {
        if (!passwordValid() || values.newPassword !== values.confirmPassword || !values.currentPassword) throw {message:'请填写当前密码，并确保两次新密码一致。'};
        const response=await api('security/password',{currentPassword:values.currentPassword,newPassword:values.newPassword});
        values.currentPassword=values.newPassword=values.confirmPassword=''; notificationStatus=response.notificationStatus;
        sessionUpdated(response); step='success'; render();
      } else if (kind === 'closure') {
        if (step === 'verify') { const response=await api('security/closure/verify',requireCode('closure','closureCode')); proof=response.ticket; step='confirm'; render(); }
        else { await api('security/closure/complete',{ticket:proof,confirmation:'CLOSE'}); closed(); }
      } else if (step === 'confirm-device' || step === 'confirm-others') {
        const other = step === 'confirm-others';
        await api(other ? 'devices/logout-others' : `devices/${selected.id}/logout`);
        resultTitle=other ? '已退出其他设备' : '已退出该设备';
        try { await loadDevices(); } catch { /* The revocation succeeded; the list can be retried separately. */ }
        step='success'; render();
      }
    });
  }, {signal:abort.signal});

  render();
  const timer=setInterval(updateTimers,1000);
  if (kind === 'devices') void run(loadDevices);
  return {
    canClose:()=>!busy,
    destroy() { destroyed=true; abort.abort(); clearInterval(timer); proof=null; for (const key of Object.keys(values)) values[key]=''; content.replaceChildren(); },
  };
}

import { billingPlans, formatOrderAmount } from './data.js';
import { icon } from './icons.js';
import { requestAccount } from './account-api.js';

const methods = {
  wechat: {
    name: '微信支付',
    scan: '微信',
    seed: 19,
    mark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10 3C5.6 3 2 5.8 2 9.3c0 2 1.2 3.8 3.1 5l-.6 2.4 2.8-1.4 1 .2a6 6 0 0 1-.3-1.9C8 10 11.3 7 15.5 7h1.9C16.2 4.6 13.3 3 10 3Z"/><path fill="currentColor" d="M22 13.6c0-3-2.9-5.4-6.5-5.4S9 10.6 9 13.6s2.9 5.4 6.5 5.4l2.1-.3 2.4 1.2-.5-2.1c1.5-1 2.5-2.5 2.5-4.2Z"/><path stroke="var(--provider-color)" stroke-width="2" stroke-linecap="round" d="M7.3 8.2h.1m4.6 0h.1m1.2 4.2h.1m4.2 0h.1"/></svg>',
  },
  alipay: {
    name: '支付宝',
    scan: '支付宝',
    seed: 73,
    mark: '<span aria-hidden="true">支</span>',
  },
};
function mockCode(seed) {
  // Decorative pattern only. These modules encode no QR payload.
  const size = 29;
  const finders = [[0, 0], [size - 7, 0], [0, size - 7]];
  const modules = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const reserved = finders.some(([left, top]) => x >= left - 1 && x <= left + 7 && y >= top - 1 && y <= top + 7);
      if (!reserved && seed >>> 31) modules.push(`M${x} ${y}h1v1h-1z`);
    }
  }
  const corners = finders.map(([x, y]) => `<rect x="${x + .5}" y="${y + .5}" width="6" height="6" fill="none" stroke="currentColor"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`).join('');
  return `<svg class="payment-code" viewBox="-1 -1 31 31" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><path d="${modules.join('')}"/>${corners}</svg>`;
}

const methodMark = id => `<span class="payment-mark" data-provider="${id}">${methods[id].mark}</span>`;
const code = id => `${mockCode(methods[id].seed)}${methodMark(id)}`;

export function renderMembershipPayment(plan) {
  const planName = plan.name.replace(/[&<>]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]));
  return `<header class="payment-heading">
    <h2 id="dialog-title" data-dialog-focus tabindex="-1">确认支付</h2>
  </header>
  <section class="payment-order" aria-labelledby="payment-order-title">
    <div class="payment-order-summary">
      <h3 id="payment-order-title" data-payment-plan>${planName}</h3>
      <p class="payment-account">开通账号：<span data-payment-email></span></p>
    </div>
    <p class="payment-total"><span>¥</span><strong data-payment-amount>—</strong></p>
  </section>
  <div class="payment-method-switch" role="group" aria-label="选择支付方式">${Object.entries(methods).map(([id, method]) => `<button class="payment-method" type="button" data-payment-method="${id}" aria-pressed="${id === 'wechat'}" disabled>${methodMark(id)}<span>${method.name}</span><span class="payment-method-indicator" aria-hidden="true">${icon('check')}</span></button>`).join('')}</div>
  <figure class="payment-code-frame">
    <div class="payment-code-art" role="img" aria-label="演示二维码" data-payment-code>${code('wechat')}</div>
    <figcaption>演示二维码</figcaption>
  </figure>
  <p class="payment-scan" id="payment-subtitle" data-payment-scan aria-live="polite">微信扫码支付演示</p>
  <p class="payment-timing">${icon('clock')}<span data-payment-time>正在创建订单…</span></p>
  <span class="visually-hidden" role="status" data-payment-expiry></span>
  <p class="payment-error" data-payment-error role="alert" hidden></p>
  <button class="button button-orange payment-primary payment-confirm" type="button" data-payment-action="complete" disabled>正在创建订单…</button>`;
}

export function renderMembershipPaymentSuccess() {
  return `<div class="payment-success">
    <span class="payment-success-mark">${icon('check')}</span>
    <h2 id="dialog-title" data-dialog-focus tabindex="-1">模拟支付成功</h2>
    <p id="payment-subtitle">订单已支付，会员资格已更新。</p>
    <button class="button button-orange payment-primary" type="button" data-dialog-close>返回会员页面</button>
  </div>`;
}

function errorMessage(error) {
  if (error.status === 401) return '登录已失效，请重新登录后重试。';
  if (error.code === 'simulation_unavailable') return '当前环境未开放模拟支付。';
  if (error.code === 'order_expired') return '订单已过期，请重新创建订单。';
  if (error.code === 'plan_unavailable') return '该套餐已下架，请关闭弹窗重新选择。';
  if (error.code === 'plan_changed') return '套餐价格或期限已更新，请关闭弹窗重新确认。';
  if (error.code === 'order_not_pending' || error.code === 'order_not_found') return '订单状态已变更，请重新创建订单。';
  if (error.status === 429) return '操作过于频繁，请稍后重试。';
  return '请求未完成，请检查网络后重试。';
}

export function initMembershipPayment(root, { planId, catalogPlan, email, complete, api = requestAccount }) {
  const controls = [...root.querySelectorAll('[data-payment-method]')];
  const qr = root.querySelector('[data-payment-code]');
  const scan = root.querySelector('[data-payment-scan]');
  const time = root.querySelector('[data-payment-time]');
  const confirm = root.querySelector('[data-payment-action="complete"]');
  const expiry = root.querySelector('[data-payment-expiry]');
  const message = root.querySelector('[data-payment-error]');
  const abort = new AbortController();
  const requestId = crypto.randomUUID();
  root.querySelector('[data-payment-email]').textContent = email;
  let order;
  let deadline = 0;
  let pending = false;
  let expired = false;
  let unavailable = false;
  let methodUnconfirmed = false;
  let fulfillmentPending = false;
  let lastSeconds;
  const interval = setInterval(updateTime, 250);

  function updateTime() {
    if (!order || expired || order.status === 'paid') return;
    const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    if (remaining === lastSeconds) return;
    lastSeconds = remaining;
    if (remaining === 0) {
      expired = true;
      time.textContent = expiry.textContent = '订单已过期';
      syncControls();
      return;
    }
    const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
    const seconds = String(remaining % 60).padStart(2, '0');
    time.innerHTML = `剩余支付时间 <strong>${minutes}:${seconds}</strong>`;
  }

  function syncControls() {
    confirm.disabled = pending || expired || unavailable || methodUnconfirmed;
    for (const option of controls) option.disabled = !order || order.status === 'paid' || pending || expired || unavailable;
  }

  function renderOrder(next) {
    const remaining = Date.parse(next?.expiresAtUtc) - Date.parse(next?.serverTimeUtc);
    if (!next?.id || !Object.hasOwn(billingPlans, next.plan) || !Object.hasOwn(methods, next.method) ||
        !next.planName || (next.plan !== 'lifetime' && !(next.durationDays > 0 || next.durationMonths > 0)) ||
        !Number.isInteger(next.amountFen) || next.amountFen <= 0 || !Number.isFinite(remaining))
      throw new Error('Invalid order response');
    order = next;
    deadline = Date.now() + remaining;
    root.querySelector('[data-payment-plan]').textContent = order.planName;
    root.querySelector('[data-payment-amount]').textContent = formatOrderAmount(order.amountFen);
    for (const option of controls) option.setAttribute('aria-pressed', String(option.dataset.paymentMethod === order.method));
    qr.innerHTML = code(order.method);
    scan.textContent = `${methods[order.method].scan}扫码支付演示`;
    updateTime();
  }

  async function send(operation, payload, loading, receive) {
    pending = true;
    message.hidden = true;
    confirm.textContent = loading;
    confirm.setAttribute('aria-busy', 'true');
    syncControls();
    try {
      const result = await api(operation, payload, abort.signal);
      if (!abort.signal.aborted) receive(result);
    } catch (error) {
      if (abort.signal.aborted) return;
      unavailable = error.status === 401 || ['simulation_unavailable', 'order_not_pending', 'order_not_found', 'plan_changed', 'plan_unavailable'].includes(error.code);
      if (error.code === 'order_expired') {
        expired = true;
        time.textContent = expiry.textContent = '订单已过期';
      } else if (!order) time.textContent = '订单创建未完成';
      message.textContent = errorMessage(error);
      message.hidden = false;
    } finally {
      if (!abort.signal.aborted) {
        pending = false;
        confirm.removeAttribute('aria-busy');
        confirm.textContent = fulfillmentPending ? '重试开通会员' : order ? '我已完成支付' : '重试创建订单';
        syncControls();
      }
    }
  }

  function create() {
    return send('orders', { plan: planId, method: 'wechat', requestId, expectedPlanVersion: catalogPlan?.version }, '正在创建订单…', renderOrder);
  }

  function handleClick(event) {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    const method = button.dataset.paymentMethod;
    if (method) {
      if (method === order.method && !methodUnconfirmed) return;
      methodUnconfirmed = true;
      void send(`orders/${order.id}/method`, { method }, '正在更新支付方式…', result => {
        methodUnconfirmed = false;
        renderOrder(result);
      });
    } else if (button === confirm) {
      if (!order) { void create(); return; }
      updateTime();
      if (confirm.disabled) return;
      void send(`orders/${order.id}/simulate-payment`, {}, '确认中…', result => {
        if (result.order?.id !== order.id || result.order?.status !== 'paid') throw new Error('Payment confirmation incomplete');
        order = result.order;
        if (order.activationStatus !== 'activated') {
          fulfillmentPending = true;
          expired = false;
          time.textContent = expiry.textContent = '订单已支付，会员开通待处理';
          message.textContent = '后端已确认模拟支付，但会员尚未开通。可以重试开通；重复确认不会增加会员时长。';
          message.hidden = false;
          return;
        }
        if (!result.membership?.isActive) throw new Error('Payment confirmation incomplete');
        if (root.closest('dialog')?.open) complete(result.membership);
      });
    }
  }

  root.addEventListener('click', handleClick);
  void create();
  return {
    destroy() {
      clearInterval(interval);
      abort.abort();
      root.removeEventListener('click', handleClick);
    },
  };
}

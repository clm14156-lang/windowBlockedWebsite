import { billingPlans, defaultBillingPlan, formatOrderAmount } from './data.js';
import { requestAccount } from './account-api.js';

export function planPresentation(plan) {
  const lifetime = plan.id === 'lifetime';
  const unit = lifetime ? '' : plan.durationMonths ? `${plan.durationMonths}个月` :
    plan.durationDays === 30 && plan.id === 'monthly' ? '月' :
    plan.durationDays === 365 && plan.id === 'annual' ? '年' : `${plan.durationDays}天`;
  return { unit, note: lifetime ? '一次付费，永久可用' : plan.durationMonths ? `有效期 ${plan.durationMonths} 个月` : `有效期 ${plan.durationDays} 天` };
}

export function validateCatalog(response) {
  if (!response || !Array.isArray(response.plans) || response.plans.length !== 3) throw new Error('Invalid catalog');
  const result = new Map();
  for (const plan of response.plans) {
    if (!Object.hasOwn(billingPlans, plan?.id) || result.has(plan.id) || plan.currency !== 'CNY' ||
        typeof plan.name !== 'string' || !plan.name || plan.name.length > 64 ||
        !Number.isSafeInteger(plan.amountFen) || plan.amountFen < 1 || plan.amountFen > 100000000 ||
        !Number.isSafeInteger(plan.version) || plan.version < 1 || typeof plan.available !== 'boolean' ||
        typeof plan.recommended !== 'boolean' || !Number.isFinite(Date.parse(plan.updatedAtUtc)) ||
        (plan.id === 'lifetime' ? plan.durationDays !== null : !Number.isInteger(plan.durationDays) || plan.durationDays < 1 || plan.durationDays > 36500)) {
      throw new Error('Invalid plan');
    }
    result.set(plan.id, Object.freeze({ ...plan }));
  }
  return result;
}

export function initMembershipPricing(root, { api = requestAccount, onSelect = () => {}, selectedId = defaultBillingPlan } = {}) {
  if (!root) return null;
  const options = [...root.querySelectorAll('[data-billing-plan]')];
  const card = root.querySelector('[data-plan-card="pro"]');
  const action = card.querySelector('[data-upgrade]');
  const status = root.querySelector('[data-catalog-status]');
  const retry = root.querySelector('[data-catalog-retry]');
  const abort = new AbortController();
  let catalog = new Map(), pending = null, selected = selectedId, ready = false, canCheckout = false;

  function render() {
    const plan = catalog.get(selected);
    for (const button of options) {
      const item = catalog.get(button.dataset.billingPlan);
      button.disabled = !ready;
      button.setAttribute('aria-pressed', String(button.dataset.billingPlan === selected));
      button.setAttribute('aria-label', `${billingPlans[button.dataset.billingPlan].label}${item && !item.available ? '（暂未上架）' : ''}`);
    }
    card.querySelector('.plan-price > strong').textContent = plan ? formatOrderAmount(plan.amountFen) : '—';
    card.querySelector('.plan-price > small').textContent = plan && planPresentation(plan).unit ? `/ ${planPresentation(plan).unit}` : '';
    card.querySelector('.plan-note').textContent = plan ? planPresentation(plan).note : '套餐信息暂不可用';
    action.disabled = !ready || !plan?.available || !canCheckout;
    action.querySelector('span').textContent = !ready ? pending ? '正在获取套餐…' : '套餐暂不可用' : !plan?.available ? '套餐暂未上架' : canCheckout ? `立即开通${plan.name}` : '购买入口暂未开放';
    action.setAttribute('aria-busy', String(Boolean(pending)));
  }
  function select(id) {
    if (!ready || !catalog.has(id)) return false;
    selected = id; onSelect(id); render(); return true;
  }
  function refresh() {
    if (pending) return pending;
    ready = false; status.textContent = '正在获取最新套餐…'; retry.hidden = true;
    pending = Promise.resolve().then(() => api('plans', undefined, abort.signal)).then(response => {
      if (abort.signal.aborted) return null;
      catalog = validateCatalog(response); canCheckout = response.simulationAvailable === true;
      ready = true; status.textContent = ''; retry.hidden = true;
      return catalog;
    }).catch(() => {
      if (!abort.signal.aborted) {
        catalog = new Map(); ready = false;
        status.textContent = '套餐加载失败，请重试后再购买。'; retry.hidden = false;
      }
      return null;
    }).finally(() => { pending = null; if (!abort.signal.aborted) render(); });
    render(); return pending;
  }
  const retryClick = () => void refresh();
  const visibleRefresh = () => { if (!document.hidden) void refresh(); };
  retry.addEventListener('click', retryClick);
  window.addEventListener('focus', visibleRefresh);
  document.addEventListener('visibilitychange', visibleRefresh);
  const timer = setInterval(visibleRefresh, 30000);
  void refresh();
  return { select, refresh, get: id => ready ? catalog.get(id) : undefined,
    destroy() { abort.abort(); clearInterval(timer); retry.removeEventListener('click', retryClick);
      window.removeEventListener('focus', visibleRefresh); document.removeEventListener('visibilitychange', visibleRefresh); } };
}

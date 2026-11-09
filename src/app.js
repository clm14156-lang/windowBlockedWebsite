import { pricing, renderSite } from './components.js';
import { icon } from './icons.js';
import { resolvePage, notFoundPage } from './routes.js';
import { initSetupCarousel } from './setup-carousel.js';
import { initStatisticsCarousel } from './statistics-carousel.js';
import { heroDuration, initHeroTimer } from './hero-timer.js';
import { initHeroTheme } from './hero-theme.js';
import { personalizationCharacters } from './personalization-preview.js';
import { initPersonalizationTimer } from './personalization-timer.js';
import { initHeroScrollShowcase } from './hero-scroll-showcase.js';
import { initHelpCenter } from './help-center.js';
import { renderRegistration, initRegistrationForm, renderPasswordRecovery, initPasswordRecovery } from './registration.js';
import { renderLogin, initLoginForm } from './login.js';
import { initAccountCenter } from './account-center.js';
import { renderAccountSecurity, initAccountSecurity } from './account-security.js';
import { billingPlans, defaultBillingPlan } from './data.js';
import { initMembershipPayment, renderMembershipPayment, renderMembershipPaymentSuccess } from './membership-payment.js';
import { initMembershipPricing } from './membership-catalog.js';

const page = resolvePage(location.pathname) || notFoundPage;
const app = document.querySelector('#app');
if (!app.childElementCount) app.innerHTML = renderSite(page.id);
// Reconcile older preview markup before binding the database-backed catalog controls.
else if (page.id === 'membership' && !app.querySelector('[data-catalog-status]')) app.querySelector('#pricing').outerHTML = pricing();
document.title = page.title;
document.querySelector('meta[name="description"]').content = page.description;
history.scrollRestoration = 'auto';
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const formatTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
const demoDuration = 30 * 60;
const state = {
  billingPlan: defaultBillingPlan, heroTime: heroDuration, heroRunning: true,
  demoTime: demoDuration, demoRunning: false, demoTab: 'timer',
  tasks: [false, false, false, false],
};
const membershipPricing = initMembershipPricing($('#pricing'), { onSelect(id) { state.billingPlan = id; } });
const heroTimer = initHeroTimer($('.download-preview .hero-focus'), state);
const personalizationTimer = initPersonalizationTimer($('#personalization'));
let toastTimeout;
function toast(message) {
  clearTimeout(toastTimeout);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimeout = setTimeout(() => $('#toast').classList.remove('visible'), 3800);
}

const dialog = $('#product-dialog');
let lastFocused;
let dialogKind = '';
let dialogController = null;
function openDialog(kind, content) {
  if (!dialog.open) lastFocused = document.activeElement;
  dialogController?.destroy();
  dialogController = null;
  dialogKind = kind;
  const accountForm = kind === 'registration' || kind === 'login';
  dialog.classList.toggle('registration-dialog', accountForm);
  dialog.classList.toggle('login-dialog', kind === 'login');
  dialog.classList.toggle('membership-payment-dialog', kind === 'payment');
  dialog.classList.toggle('account-security-dialog', kind === 'security');
  if (accountForm) dialog.setAttribute('aria-describedby', `${kind}-subtitle`);
  else if (kind === 'payment') dialog.setAttribute('aria-describedby', 'payment-subtitle');
  else dialog.removeAttribute('aria-describedby');
  $('#dialog-content').innerHTML = content;
  if (!dialog.open) { dialog.showModal(); document.body.style.overflow = 'hidden'; }
  dialog.scrollTop = 0;
  const first = $('input, [data-demo-run], [data-dialog-focus], [type="submit"]', $('#dialog-content'));
  (first || $('[data-dialog-close]')).focus({ preventScroll: true });
}
function closeDialog() { if (dialogController?.canClose?.() !== false) dialog.close(); }
const account = initAccountCenter({ toast, showSecurity });

function showSecurity(kind, profile) {
  openDialog('security', renderAccountSecurity(kind));
  dialogController = initAccountSecurity($('[data-security-root]'), {
    kind, profile, close:closeDialog,
    sessionUpdated(session) {
      account.updateSession(session);
      account.refreshDevices();
      lastFocused = $(`[data-account-security="${kind}"]`);
    },
    devicesUpdated() { account.refreshDevices(); },
    closed() { location.replace('/features/'); },
  });
}

dialog.addEventListener('cancel', event => { if (dialogController?.canClose?.() === false) event.preventDefault(); });
dialog.addEventListener('close', () => {
  dialogController?.destroy();
  dialogController = null;
  dialog.classList.remove('registration-dialog', 'login-dialog', 'membership-payment-dialog', 'account-security-dialog');
  dialog.removeAttribute('aria-describedby');
  dialogKind = '';
  document.body.style.overflow = '';
  state.demoRunning = false;
  if (lastFocused?.isConnected) lastFocused.focus({ preventScroll: true });
});
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog();
});

function showLogin(continuePurchase) {
  openDialog('login', renderLogin());
  dialogController = initLoginForm($('#login-form'), session => {
    if (continuePurchase) {
      account.signIn(session, { focus: false });
      continuePurchase(session.user.email);
      return;
    }
    lastFocused = null;
    closeDialog();
    account.signIn(session);
  });
}

function showRegistration(startInRecovery = false) {
  openDialog('registration', renderRegistration() + renderPasswordRecovery());
  const registration = initRegistrationForm($('#registration-form'), {
    onSuccess: session => {
      lastFocused = null;
      closeDialog();
      account.signIn(session);
      toast('注册成功，已自动登录');
    },
  });
  const recovery = initPasswordRecovery(dialog);
  dialogController = {
    destroy() {
      registration.destroy();
      recovery.destroy();
    },
  };
  if (startInRecovery) recovery.start();
}

function selectBillingPlan(button) {
  membershipPricing?.select(button.dataset.billingPlan);
}

async function showMembershipPayment(planId, email) {
  const previousController = dialogController, wasOpen = dialog.open;
  await membershipPricing?.refresh();
  if (wasOpen ? !dialog.open || dialogController !== previousController : dialog.open) return;
  const plan = membershipPricing?.get(planId);
  if (!plan?.available) { toast('套餐暂不可购买，请重新选择。'); return; }
  openDialog('payment', renderMembershipPayment(plan));
  dialogController = initMembershipPayment($('#dialog-content'), {
    planId, catalogPlan: plan,
    email,
    close: closeDialog,
    changePlan() {
      lastFocused = $('[data-billing-plan][aria-pressed="true"]');
      closeDialog();
      lastFocused.scrollIntoView({ block: 'center', behavior: 'instant' });
    },
    complete(status) {
      account.updateMembership(status);
      openDialog('payment', renderMembershipPaymentSuccess());
    },
  });
}

async function showUpgrade(button) {
  if (dialog.open || button.disabled) return;
  const planId = state.billingPlan;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  const email = await account.getEmail();
  button.disabled = !membershipPricing?.get(planId)?.available;
  button.removeAttribute('aria-busy');
  if (dialog.open) return;
  if (email) showMembershipPayment(planId, email);
  else showLogin(email => showMembershipPayment(planId, email));
  lastFocused = button;
}

function renderDemoPanel() {
  if (state.demoTab === 'tasks') return `<ul class="demo-tasks">${[
    ['完成今天的创作', '留一段时间，把想法变成作品'], ['阅读 20 页', '每天向前一点点'], ['整理本周计划', '让重要的事清晰起来'], ['学习一项新技能', '把注意力留给成长'],
  ].map(([title, hint], i) => `<li><label><input type="checkbox" data-task="${i}" ${state.tasks[i] ? 'checked' : ''}/><span>${title}<small>${hint}</small></span></label></li>`).join('')}</ul>`;
  return `<div class="demo-timer"><div class="demo-clock" data-demo-clock>${formatTime(state.demoTime)}</div><p>完成今天的创作</p><div class="demo-controls"><button class="button button-orange" data-demo-run>${icon(state.demoRunning ? 'pause' : 'play')}${state.demoRunning ? '暂停专注' : '开始专注'}</button><button class="button button-soft" data-demo-reset>${icon('refresh')}重置</button></div><span class="demo-status"><i></i>演示模式 · 不会屏蔽你正在访问的网站</span></div>`;
}
function showDemo(tab = 'timer') {
  state.demoTab = tab === 'tasks' ? 'tasks' : 'timer';
  openDialog('demo', `<span class="demo-label">交互演示</span><h2 id="dialog-title">这一刻，专注于自己。</h2><p class="dialog-description">选择一个目标，给自己一段不被打扰的时间。</p><div class="demo-tabs" role="tablist" aria-label="演示内容"><button role="tab" aria-controls="demo-panel" aria-selected="${state.demoTab === 'timer'}" class="${state.demoTab === 'timer' ? 'active' : ''}" data-demo-tab="timer">${icon('clock')} 专注计时</button><button role="tab" aria-controls="demo-panel" aria-selected="${state.demoTab === 'tasks'}" class="${state.demoTab === 'tasks' ? 'active' : ''}" data-demo-tab="tasks">${icon('list')} 我的任务</button></div><div id="demo-panel" role="tabpanel">${renderDemoPanel()}</div>`);
}

function updateChart(period) {
  if (period === '自定义') {
    openDialog('chart-custom', `<span class="demo-label">专注统计演示</span><h2 id="dialog-title">选择统计日期</h2><form class="dialog-form" id="chart-date-form"><label for="chart-date">开始日期（展示一周数据）</label><input id="chart-date" type="date" name="date" value="2024-10-09" required/><button class="button button-orange dialog-full" type="submit">查看趋势${icon('arrow')}</button></form>`);
    return;
  }
  const options = {
    '周': { values: [38, 68, 70, 90, 56, 49, 81], labels: ['10/9', '10/10', '10/11', '10/12', '10/13', '10/14', '10/15'], range: '2024年10月9日 – 10月15日', hours: 32, minutes: 18, tasks: 28, days: 6, unit: '按天' },
    '月': { values: [53, 76, 61, 93, 70, 87, 65], labels: ['1–4', '5–8', '9–12', '13–16', '17–20', '21–24', '25–31'], range: '2024年10月', hours: 128, minutes: 42, tasks: 106, days: 24, unit: '按日期' },
    '年': { values: [35, 48, 62, 56, 77, 90, 81], labels: ['4月', '5月', '6月', '7月', '8月', '9月', '10月'], range: '2024年', hours: 856, minutes: 30, tasks: 724, days: 186, unit: '按月' },
  };
  const data = options[period];
  applyChartData(data, period);
}
function applyChartData(data, period) {
  $$('[data-chart-period]').forEach(button => {
    const selected = button.dataset.chartPeriod === period;
    button.classList.toggle('active', selected); button.setAttribute('aria-pressed', String(selected));
  });
  $('.chart-bars').innerHTML = data.values.map((n, i) => `<div class="bar-column"><div class="chart-bar" style="--bar-height:${n}%" title="${escapeHTML(data.labels[i])}：${(n / 15).toFixed(1)}小时"></div><span>${escapeHTML(data.labels[i])}</span><small>${period === '周' ? ['周三', '周四', '周五', '周六', '周日', '周一', '周二'][i] : ''}</small></div>`).join('');
  $('[data-chart-range]').textContent = data.range;
  $('[data-total-hours]').innerHTML = `${data.hours}<em>小时</em>${data.minutes}<em>分钟</em>`;
  $('[data-total-tasks]').innerHTML = `${data.tasks}<em>项</em>`;
  $('[data-total-days]').innerHTML = `${data.days}<em>天</em>`;
  $('[data-chart-unit]').innerHTML = `${data.unit}${icon('down')}`;
  $('.donut-chart>div').innerHTML = `${data.hours}<small>小时</small><span>${data.minutes}分钟</span>`;
  if (period !== '周') {
    $$('.distribution-content li').forEach((row, index) => {
      const share = [.32, .25, .12, .09, .22][index];
      row.querySelector('span').textContent = `${(data.hours * share).toFixed(1)}小时`;
    });
  } else {
    $$('.distribution-content li').forEach((row, index) => row.querySelector('span').textContent = ['14小时', '8小时', '4小时', '3小时', '3小时'][index]);
  }
  const metrics = $$('.metric-grid p');
  metrics[0].textContent = period === '年' ? '较上年 +18%' : period === '月' ? '较上月 +15%' : '较上周 +12%';
  metrics[1].textContent = period === '年' ? '较上年 +21%' : period === '月' ? '较上月 +9%' : '较上周 +7%';
  metrics[2].textContent = period === '年' ? '本年 72%' : period === '月' ? '本月 77%' : '本周 86%';
  $('.bar-chart').setAttribute('aria-label', `${period}专注时长趋势，演示数据`);
}

document.addEventListener('click', event => {
  const target = event.target.closest('button, a');
  if (!target) return;
  if (target.matches('[data-registration]')) showRegistration();
  else if (target.matches('[data-account-login]')) showLogin();
  else if (target.matches('[data-login-recovery]')) showRegistration(true);
  else if (target.matches('[data-demo]')) showDemo(target.dataset.demo);
  else if (target.matches('[data-dialog-close]')) closeDialog();
  else if (target.matches('[data-upgrade]')) void showUpgrade(target);
  else if (target.matches('[data-billing-plan]')) selectBillingPlan(target);
  else if (target.matches('[data-demo-tab]')) {
    state.demoTab = target.dataset.demoTab;
    $$('[data-demo-tab]').forEach(b => { const active = b.dataset.demoTab === state.demoTab; b.classList.toggle('active', active); b.setAttribute('aria-selected', String(active)); });
    $('#demo-panel').innerHTML = renderDemoPanel();
  }
  else if (target.matches('[data-demo-run]')) {
    if (state.demoTime <= 0) state.demoTime = demoDuration;
    state.demoRunning = !state.demoRunning;
    target.innerHTML = `${icon(state.demoRunning ? 'pause' : 'play')}${state.demoRunning ? '暂停专注' : '开始专注'}`;
    $('[data-demo-clock]').textContent = formatTime(state.demoTime);
  }
  else if (target.matches('[data-demo-reset]')) { state.demoRunning = false; state.demoTime = demoDuration; $('[data-demo-clock]').textContent = formatTime(state.demoTime); $('[data-demo-run]').innerHTML = `${icon('play')}开始专注`; }
  else if (target.matches('[data-chart-period]')) updateChart(target.dataset.chartPeriod);
  else if (target.matches('.mobile-menu')) {
    const open = target.getAttribute('aria-expanded') !== 'true';
    target.setAttribute('aria-expanded', String(open)); target.setAttribute('aria-label', open ? '关闭导航' : '打开导航'); target.innerHTML = icon(open ? 'close' : 'menu'); $('#mobile-nav').hidden = !open;
  }
  else if (target.matches('.back-top')) window.scrollTo({ top: 0, behavior: 'smooth' });
  else if (target.matches('[data-privacy]')) openDialog('privacy', `<span class="demo-label">本网站隐私说明</span><h2 id="dialog-title">体验之后，不留下多余的信息。</h2><p class="dialog-description">本说明适用于专注时光官网的浏览、交互演示和账号表单。</p><ul class="dialog-feature-list"><li>${icon('shield')}演示计时、任务勾选和方案选择保存在当前页面内存中。</li><li>${icon('refresh')}刷新页面后，演示状态会重置。</li><li>${icon('globe')}注册和找回密码由账号服务处理，密码以哈希形式存储。</li></ul><p class="dialog-note">网站托管服务可能保留正常访问日志。正式软件及未来购买服务的数据处理规则，应以届时提供的独立说明为准。</p>`);
  if (target.matches('a[href^="#"], .trial-button') || target.closest('#mobile-nav')) {
    if (target.closest('#mobile-nav') && dialog.open) lastFocused = $('.mobile-menu');
    $('#mobile-nav').hidden = true; $('.mobile-menu').setAttribute('aria-expanded', 'false'); $('.mobile-menu').setAttribute('aria-label', '打开导航'); $('.mobile-menu').innerHTML = icon('menu');
  }
});

document.addEventListener('change', event => {
  if (event.target.matches('[data-task]')) {
    state.tasks[Number(event.target.dataset.task)] = event.target.checked;
    toast(`已完成 ${state.tasks.filter(Boolean).length} / 4 项任务`);
  }
});
document.addEventListener('submit', event => {
  if (!event.target.matches('#chart-date-form')) return;
  event.preventDefault();
  const form = new FormData(event.target);
  const raw = String(form.get('date'));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return;
  const start = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(start.getTime())) return;
  const labels = Array.from({ length: 7 }, (_, i) => { const date = new Date(start); date.setDate(date.getDate() + i); return `${date.getMonth() + 1}/${date.getDate()}`; });
  applyChartData({ values: [46, 62, 78, 59, 88, 66, 73], labels, range: `${raw} 起一周`, hours: 36, minutes: 24, tasks: 31, days: 7, unit: '按天' }, '自定义');
  closeDialog(); toast('已更新自定义日期范围 · 展示演示数据');
});

// Arrow key support for the demo tabs.
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !$('#mobile-nav').hidden) { $('#mobile-nav').hidden = true; $('.mobile-menu').setAttribute('aria-expanded', 'false'); $('.mobile-menu').innerHTML = icon('menu'); $('.mobile-menu').focus(); }
  if (event.defaultPrevented || !['ArrowLeft', 'ArrowRight'].includes(event.key) || !event.target.matches('[data-demo-tab]')) return;
  const tabs = $$('[role="tab"]', event.target.closest('[role="tablist"]'));
  const next = tabs[(tabs.indexOf(event.target) + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
  event.preventDefault(); next.focus(); next.click();
});

let scrollQueued = false;
function updateScroll() {
  const header = $('#site-header');
  header.classList.toggle('scrolled', scrollY > 0);
  $('.back-top').hidden = scrollY < 650;
  scrollQueued = false;
}
window.addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); } }, { passive: true });
updateScroll();
window.addEventListener('resize', () => { if (innerWidth > 700) { $('#mobile-nav').hidden = true; $('.mobile-menu').setAttribute('aria-expanded', 'false'); $('.mobile-menu').setAttribute('aria-label', '打开导航'); $('.mobile-menu').innerHTML = icon('menu'); } updateScroll(); });

// Render clocks only while visible. The personalization clock tracks elapsed time.
setInterval(() => {
  if (document.hidden) return;
  heroTimer?.tick();
  personalizationTimer?.tick();
  if (dialog.open && dialogKind === 'demo' && state.demoRunning && state.demoTime > 0) {
    state.demoTime--;
    if ($('[data-demo-clock]')) $('[data-demo-clock]').textContent = formatTime(state.demoTime);
    if (state.demoTime === 0) { state.demoRunning = false; if (state.demoTab === 'timer') $('#demo-panel').innerHTML = renderDemoPanel(); toast('这一段专注完成了，休息一下吧。'); }
  }
}, 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) personalizationTimer?.tick(); });

initHeroScrollShowcase($('#home'));
initSetupCarousel($('#features'));
initHeroTheme($('#personalization'), { characters: personalizationCharacters });
if ($('#statistics')) initStatisticsCarousel($('#statistics'));
initHelpCenter($('#faq'));

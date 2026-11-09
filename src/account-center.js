import { icon } from './icons.js';
import { accountPage, pages } from './routes.js';
import { requestAccount } from './account-api.js';
import { billingPlans, formatAccountDate, formatOrderAmount } from './data.js';

const sections = [
  { id: 'overview', label: '账户概览', icon: 'home', description: '查看你的账号与会员状态。' },
  { id: 'orders', label: '我的订单', icon: 'receipt', description: '查看会员支付与退款记录。' },
  { id: 'security', label: '账号与安全', icon: 'shield', description: '管理你的登录信息与设备，保障账号安全。' },
];
const orderStatuses = {
  paid: '已支付',
  refunded: '已退款',
};

const sectionUrl = id => `${accountPage.path}#${id}`;
const avatar = `<img class="account-avatar" src="/assets/account-avatar.svg" width="80" height="80" alt="" />`;
const amount = order => `¥${formatOrderAmount(order.amountFen)}`;
const tile = (name, color = 'orange') => `<span class="account-tile is-${color}">${icon(name)}</span>`;
const signOut = `<button class="account-nav-item account-sign-out" type="button" data-account-logout>${icon('logout')}退出登录</button>`;
const escapeText = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function accountNavigation() {
  return `<div class="account-nav-actions" data-account-guest>
    <button class="account-login" type="button" data-account-login aria-haspopup="dialog" aria-controls="product-dialog">登录</button>
    <button class="button button-small trial-button" data-registration aria-haspopup="dialog" aria-controls="product-dialog">免费体验</button>
  </div>
  <div class="account-user" data-account-user hidden>
    <div class="account-user-trigger">
      <a class="account-user-link" href="${accountPage.path}" aria-label="进入个人中心">${avatar}<span data-account-email></span></a>
      <button class="account-menu-toggle" type="button" aria-label="账户菜单" aria-expanded="false" aria-controls="account-poptip">${icon('down')}</button>
    </div>
    <div class="account-poptip" id="account-poptip" hidden>
      <div class="account-menu-card">
        <div class="account-menu-profile">${avatar}<div><strong data-account-email></strong><small data-membership-status></small></div></div>
        ${sections.slice(1).map(({ id, label, icon: name }) => `<a class="account-nav-item" href="${sectionUrl(id)}">${icon(id === 'security' ? 'settings' : name)}${id === 'security' ? '账号设置' : label}</a>`).join('')}
        ${signOut}
      </div>
    </div>
  </div>`;
}

export function accountMembershipState(status, now = Date.now()) {
  const unavailable = { type: 'unavailable', title: '会员状态暂不可用', subtitle: '请稍后刷新重试' };
  const free = { type: 'free', title: '免费版', subtitle: '当前使用基础功能' };
  if (status === undefined) return { type: 'loading', title: '正在读取会员状态…', subtitle: '' };
  if (!status || typeof status.isActive !== 'boolean') return unavailable;
  if (!status.isActive) return free;
  const starts = Date.parse(status.startsAtUtc), expires = Date.parse(status.expiresAtUtc);
  if (Number.isFinite(starts) && starts > now) return free;
  if (Number.isFinite(expires) && expires <= now) return free;
  if (status.plan === 'lifetime' && status.expiresAtUtc === null) return { type: 'lifetime', title: '专业版 · 永久会员', subtitle: '永久有效' };
  if (!Number.isFinite(expires)) return unavailable;
  const remainingDays = Math.max(1, Math.ceil((expires - now) / 86400000));
  if (status.isTrial === true) {
    if (!Number.isFinite(starts) || starts >= expires) return unavailable;
    const days = Math.ceil((expires - starts) / 86400000);
    return { type: 'trial', title: `专业版 · ${days}天体验`, badge: '体验中', expiresAtUtc: status.expiresAtUtc, remainingDays };
  }
  if (!['monthly', 'annual'].includes(status.plan)) return unavailable;
  return { type: status.plan, title: `专业版 · ${billingPlans[status.plan].name}`, badge: '有效中', expiresAtUtc: status.expiresAtUtc, remainingDays };
}

const membershipDate = value => new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));

export function renderAccountMembership(status, now = Date.now()) {
  const view = accountMembershipState(status, now);
  const pro = ['lifetime', 'annual', 'monthly', 'trial'].includes(view.type);
  return `<section class="account-membership-card is-${view.type}" data-account-membership aria-label="会员状态" aria-live="polite">
    <span class="account-membership-icon" aria-hidden="true">${icon('crown')}</span>
    <div class="account-membership-copy"><div class="account-membership-title"><h2>${view.title}</h2>${view.badge ? `<span class="account-membership-badge">${view.badge}</span>` : ''}</div>
      ${view.expiresAtUtc ? `<p class="account-membership-expiry">${icon('calendar')}<span>到期时间：<time datetime="${escapeText(view.expiresAtUtc)}">${membershipDate(view.expiresAtUtc)}</time></span><span class="account-membership-remaining">（剩余${view.remainingDays}天）</span></p>` : `<p>${view.subtitle}</p>`}
    </div>
    ${pro ? '<img class="account-membership-crown" src="/assets/huangguan.png" width="432" height="350" alt="" />' : view.type === 'free' ? `<a class="button account-membership-upgrade" href="/membership/">开通专业版${icon('arrow')}</a>` : ''}
  </section>`;
}

export function overview(profile) {
  const email = escapeText(profile.email);
  return `<div class="account-card account-overview">
    <div class="account-identity"><span class="account-identity-icon" aria-hidden="true">${icon('person')}</span><div>
      <h2>${email}</h2>
      <div class="account-id"><span>账号 ID：${escapeText(profile.id)}</span><button type="button" class="account-copy" data-account-copy aria-label="复制账号 ID" title="复制账号 ID">${icon('copy')}</button></div>
    </div></div>
    ${renderAccountMembership()}
  </div>`;
}

const orderTime = value => Number.isFinite(Date.parse(value)) ? `<time datetime="${escapeText(value)}">${formatAccountDate(value)}</time>` : '待确认';

export function orderTimes(order) {
  return order.status === 'refunded'
    ? `<p>退款时间：${orderTime(order.refundedAtUtc)}</p>`
    : `<p>支付时间：${orderTime(order.paidAtUtc)}</p>`;
}

export function orderList(orders) {
  const history = orders.filter(order => Object.hasOwn(orderStatuses, order?.status));
  if (!history.length) return '<div class="account-card account-orders-empty"><p>暂无会员订单。</p></div>';
  return `<ul class="account-card account-orders" id="account-orders-list">${history.map(order => {
    return `<li class="account-order" data-order-status="${escapeText(order.status)}">
      <div class="account-order-identity">${tile('crown')}<div><h2>专业版 · ${escapeText(order.planName || billingPlans[order.plan]?.name || '会员')}</h2><p class="account-order-number">订单号：${escapeText(order.orderNumber)}</p></div></div>
      <div class="account-order-times">${orderTimes(order)}</div>
      <div class="account-order-summary"><strong class="account-order-amount">${amount(order)}</strong><span class="account-badge is-${order.status}">${orderStatuses[order.status]}</span></div>
    </li>`;
  }).join('')}</ul>`;
}

export function security(profile) {
  const settings = [
    ['mail', 'orange', '登录邮箱', '用于登录、找回密码和接收重要通知。', escapeText(profile.email), '修改', 'email'],
    ['lock', 'orange', '登录密码', '用于保护你的账号安全。', '••••••••', '修改', 'password'],
    ['devices', 'orange', '登录设备', '查看和管理当前账号的登录设备。', '<span data-account-device-count role="status">正在读取设备…</span>', '管理', 'devices'],
  ];
  return `<ul class="account-card account-settings">${settings.map(([name, color, title, description, value, action, feature]) => `<li class="account-setting">${tile(name, color)}<div class="account-setting-copy"><h2>${title}</h2><p>${description}</p></div><div class="account-setting-details"><span class="account-value">${value}</span><button class="button account-outline" type="button" aria-label="${action}${title}" data-account-security="${feature}">${action}${icon('chevron')}</button></div></li>`).join('')}</ul>
    <section class="account-card account-closure"><span class="account-closure-icon">${icon('userClose')}</span><div class="account-setting-copy"><h2>注销账号</h2><p>停用当前账号，注销后无法登录。</p></div><button class="button account-danger-outline" type="button" data-account-security="closure">注销账号</button></section>`;
}

const sectionContent = { overview, orders: () => '<div data-account-orders><p>正在读取订单…</p></div>', security };

function renderSection({ id, label, description }, profile) {
  return `<header class="account-page-heading${id === 'security' ? ' is-security' : ''}"><h1 tabindex="-1">${label}</h1><p>${description}</p>${id === 'security' ? '<img class="account-security-art" src="/assets/account-shield.svg" width="200" height="148" alt="" />' : ''}</header>${sectionContent[id](profile)}`;
}

export function accountCenter() {
  return `<div class="account-layout">
    <aside class="account-card account-sidebar"><h2 class="account-accent-title" id="account-nav-title">个人中心</h2>
      <nav aria-labelledby="account-nav-title">${sections.map(({ id, label, icon: name }) => `<a class="account-nav-item" href="${sectionUrl(id)}" data-account-section="${id}"${id === 'overview' ? ' aria-current="page"' : ''}>${icon(name)}${label}</a>`).join('')}</nav>
      ${signOut}
    </aside>
    <div class="account-content" data-account-content></div>
  </div>`;
}

export function initAccountCenter({ toast, showSecurity }) {
  const guest = document.querySelector('[data-account-guest]');
  const user = document.querySelector('[data-account-user]');
  const menuToggle = user.querySelector('.account-menu-toggle');
  const poptip = user.querySelector('.account-poptip');
  const userLink = user.querySelector('.account-user-link');
  const main = document.querySelector('.page-account');
  const content = main?.querySelector('[data-account-content]');
  let profile = null;
  let membershipStatus;
  let membershipClockOffset = 0;
  let membershipTimer;
  let lastMembershipMarkup = '';
  let membershipVersion = 0;
  let currentSection;
  let sessionVersion = 0;
  let checking = false;
  let signingOut = false;
  let expiryTimer;

  function toggleMenu(open) {
    poptip.hidden = !open;
    menuToggle.setAttribute('aria-expanded', String(open));
  }

  function renderMembership() {
    clearTimeout(membershipTimer);
    const now = Date.now() + membershipClockOffset;
    const view = accountMembershipState(membershipStatus, now);
    const description = `${view.title}${view.expiresAtUtc ? ` · 有效期至 ${membershipDate(view.expiresAtUtc)}` : view.subtitle && view.type === 'lifetime' ? ` · ${view.subtitle}` : ''}`;
    for (const label of document.querySelectorAll('[data-membership-status]')) label.textContent = description;
    const card = content?.querySelector('[data-account-membership]');
    if (card) {
      const markup = renderAccountMembership(membershipStatus, now);
      if (markup !== lastMembershipMarkup) { card.outerHTML = markup; lastMembershipMarkup = markup; }
    }
    const expires = Date.parse(membershipStatus?.expiresAtUtc);
    if (profile && membershipStatus?.isActive && Number.isFinite(expires) && expires > now) {
      membershipTimer = setTimeout(() => {
        if (expires <= Date.now() + membershipClockOffset) {
          // Re-read the effective grant: another entitlement may still be active.
          membershipStatus = undefined;
          renderMembership();
          void refreshMembership();
        } else renderMembership();
      }, Math.min(60000, expires - now));
    }
  }

  function receiveMembership(status) {
    membershipStatus = status;
    const serverTime = Date.parse(status?.serverTimeUtc);
    membershipClockOffset = Number.isFinite(serverTime) ? serverTime - Date.now() : 0;
    renderMembership();
  }

  async function refreshMembership() {
    const version = ++membershipVersion;
    try {
      const result = await requestAccount('membership');
      if (version === membershipVersion) {
        receiveMembership(result);
      }
    } catch {
      if (version === membershipVersion && membershipStatus === undefined) {
        receiveMembership(null);
      }
    }
  }

  async function refreshOrders(container, userId) {
    try {
      const result = await requestAccount('orders');
      if (!container.isConnected || profile?.id !== userId) return;
      container.innerHTML = orderList(result);
    } catch {
      if (container.isConnected && profile?.id === userId) container.textContent = '暂时无法读取订单，请稍后刷新页面。';
    }
  }

  async function refreshDevices(container, userId) {
    try {
      const devices = await requestAccount('devices');
      if (!Array.isArray(devices)) throw new Error('Invalid device list');
      if (!container.isConnected || profile?.id !== userId) return;
      // The existing API returns devices with non-revoked, unexpired login sessions.
      container.textContent = `${devices.length} 台设备在线`;
    } catch {
      if (container.isConnected && profile?.id === userId) container.textContent = '暂时无法读取设备';
    }
  }

  function showSession(session) {
    clearTimeout(expiryTimer);
    const next = session?.user;
    const changed = profile?.id !== next?.id || profile?.email !== next?.email;
    profile = next || null;
    if (changed) {
      membershipVersion++;
      membershipStatus = undefined;
      membershipClockOffset = 0;
    }
    // A suspended tab may resume after expiry before its timer has run.
    const membershipExpiry = Date.parse(membershipStatus?.expiresAtUtc);
    if (profile && membershipStatus?.isActive && Number.isFinite(membershipExpiry) && membershipExpiry <= Date.now() + membershipClockOffset) {
      membershipStatus = undefined;
    }
    guest.hidden = Boolean(profile);
    user.hidden = !profile;
    if (changed || !profile) toggleMenu(false);
    for (const label of user.querySelectorAll('[data-account-email]')) label.textContent = profile?.email || '';
    userLink.setAttribute('aria-label', profile ? `进入个人中心，${profile.email}` : '进入个人中心');
    if (profile) {
      const delay = Date.parse(session.expiresAtUtc) - Date.now();
      expiryTimer = setTimeout(restore, Math.max(0, Math.min(delay, 2_147_483_647)));
    }
    if (main) {
      if (changed || !profile) {
        content.replaceChildren();
        currentSection = null;
      }
      main.hidden = !profile;
      if (profile) updateSection();
    }
    renderMembership();
    if (profile) void refreshMembership();
  }

  async function restore() {
    if (checking || signingOut) return;
    checking = true;
    const version = sessionVersion;
    try {
      const session = await requestAccount('me');
      if (version === sessionVersion) showSession(session);
    } catch (error) {
      if (version !== sessionVersion) return;
      showSession(null);
      if (!main) return;
      if (error.status === 401) location.replace(pages[0].path);
      else {
        main.hidden = false;
        content.innerHTML = '<header class="account-page-heading"><h1>暂时无法确认登录状态</h1><p>请检查网络后重试。</p></header><button class="button account-outline" type="button" data-account-retry>重试</button>';
      }
    } finally {
      checking = false;
    }
  }

  function updateSection(focusHeading = false) {
    if (!profile) return;
    const section = sections.find(({ id }) => location.hash === `#${id}`) || sections[0];
    if (section.id === currentSection) return;
    currentSection = section.id;
    content.innerHTML = renderSection(section, profile);
    lastMembershipMarkup = '';
    renderMembership();
    if (section.id === 'orders') void refreshOrders(content.querySelector('[data-account-orders]'), profile.id);
    if (section.id === 'security') void refreshDevices(content.querySelector('[data-account-device-count]'), profile.id);
    main.querySelector('[aria-current="page"]').removeAttribute('aria-current');
    main.querySelector(`[data-account-section="${section.id}"]`).setAttribute('aria-current', 'page');
    document.title = `${section.label} — ${accountPage.title}`;
    if (focusHeading) {
      content.querySelector('h1').focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  const initialRestore = restore();
  window.addEventListener('pagehide', event => {
    if (!event.persisted) return;
    sessionVersion++;
    showSession(null);
  });
  window.addEventListener('pageshow', event => { if (event.persisted) void restore(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void restore(); });
  if (main) {
    window.addEventListener('hashchange', () => updateSection(true));
    document.querySelector('.skip-link').addEventListener('click', event => {
      event.preventDefault();
      content.querySelector('h1')?.focus();
    });
  }

  user.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') toggleMenu(true); });
  user.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse' && !poptip.contains(document.activeElement)) toggleMenu(false);
  });
  user.addEventListener('focusout', event => { if (!user.contains(event.relatedTarget)) toggleMenu(false); });
  menuToggle.addEventListener('click', () => toggleMenu(poptip.hidden));
  poptip.addEventListener('click', event => { if (event.target.closest('a')) toggleMenu(false); });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || poptip.hidden) return;
    if (user.contains(document.activeElement)) menuToggle.focus();
    toggleMenu(false);
  });
  document.addEventListener('click', async event => {
    if (!user.contains(event.target)) toggleMenu(false);
    const button = event.target.closest('button');
    if (!button) return;
    if (button.matches('[data-account-logout]')) {
      if (signingOut || !profile) return;
      signingOut = true;
      sessionVersion++;
      let warning = '';
      try {
        await requestAccount('logout');
      } catch (error) {
        if (![502, 503, 504].includes(error.status)) {
          toast('暂时无法退出，请连接网络后重试。');
          return;
        }
        warning = '已退出官网，账号服务暂时无法确认会话撤销。';
      } finally {
        signingOut = false;
      }
      showSession(null);
      if (main) location.replace(pages[0].path);
      else {
        guest.querySelector('[data-account-login]').focus({ preventScroll: true });
        toast(warning || '已退出登录');
      }
    } else if (button.matches('[data-account-retry]')) {
      void restore();
    } else if (button.matches('[data-account-copy]')) {
      if (!profile) return;
      const id = profile.id;
      try {
        await navigator.clipboard.writeText(id);
        toast('已复制账号 ID');
      } catch { toast(`账号 ID：${id}`); }
    } else if (button.matches('[data-account-security]')) {
      if (profile) showSecurity?.(button.dataset.accountSecurity, profile);
    }
  });

  return {
    updateSession(session) { sessionVersion++; showSession(session); },
    refreshDevices() {
      if (profile && content) void refreshDevices(content.querySelector('[data-account-device-count]'), profile.id);
    },
    updateMembership(status) {
      membershipVersion++;
      receiveMembership(status);
    },
    async getEmail() {
      await initialRestore;
      return profile?.email || '';
    },
    signIn(session, { focus = true } = {}) {
      sessionVersion++;
      showSession(session);
      if (focus) userLink.focus({ preventScroll: true });
      toast('登录成功');
    },
  };
}

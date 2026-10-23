import { icon, brand } from './icons.js';
import { plans, faqs } from './data.js';
import { pages } from './routes.js';

const controls = (maximizable = true) => `<span class="window-controls" aria-hidden="true"><i>−</i>${maximizable ? '<i>□</i>' : ''}<i>×</i></span>`;
const sidebar = (active = 'shield') => `<aside class="app-sidebar" aria-label="软件界面装饰"><img src="/assets/favicon.svg" alt="" width="25" height="25"/><div>${['home', 'shield', 'clock', 'settings'].map(i => `<span class="${i === active ? 'active' : ''}">${icon(i)}</span>`).join('')}</div><span class="avatar"></span></aside>`;
const windowShell = (className, title, content, active) => `<div class="app-window ${className}">${sidebar(active)}<div class="app-content"><div class="app-title"><strong>${title}</strong>${controls()}</div>${content}</div></div>`;

function focusWindow(floating = false) {
  return `<div class="focus-window${floating ? ' floating-focus' : ''}"${floating ? ' id="floating-focus" role="group" aria-label="完整的专注窗口" aria-describedby="floating-hint"' : ''}>
    <div class="focus-scene" aria-hidden="true"><img src="/assets/focus_scene01.png" alt="" width="1672" height="941" draggable="false"/></div>
    <div class="focus-topbar"><span class="window-dots" aria-hidden="true"><i></i><i></i><i></i></span>${controls(false)}</div>
    <div class="night-greeting"><span class="moon" aria-hidden="true"></span><div><h3>夜深了</h3><p>一天快结束了，给今天一个好收尾。</p></div></div>
    <div class="focus-time" ${floating ? 'data-floating-time' : 'data-hero-time'}>${floating ? '14:47' : '04:53'}</div>
    <p class="focus-task">${icon('language')}<span>学习英语</span></p>
    <div class="focus-toolbar">
      ${floating ? `<div class="focus-toolbar-item">${icon('stop', 'focus-stop-icon')}<span>结束专注</span></div>` : `<button data-hero-toggle>${icon('stop', 'focus-stop-icon')}<span>结束专注</span></button>`}
      <span class="focus-toolbar-divider" aria-hidden="true"></span>
      ${floating ? `<div class="focus-toolbar-item">${icon('list')}<span>查看任务 (4)</span></div>` : `<button data-demo="tasks">${icon('list')}<span>查看任务 (4)</span></button>`}
    </div>
    ${floating ? '' : '<button class="mini-timer hero-mini" data-demo aria-label="体验悬浮专注计时器"><span class="timer-ring"></span><span>03:53</span></button>'}
  </div>`;
}

export function header(page = 'features') {
  const navItems = pages.map(item => `<a class="nav-item${item.id === page ? ' active' : ''}" href="${item.path}" data-nav="${item.id}"${item.id === page ? ' aria-current="page"' : ''}>${item.label}</a>`).join('');
  return `<header class="site-header" id="site-header">
    <div class="nav-bar">
      <div class="nav-shell">
        <a class="brand-link" href="/features/" aria-label="专注首页">${brand()}</a>
        <nav class="desktop-nav" aria-label="主导航">${navItems}</nav>
        <button class="button button-outline trial-button" data-demo>领取免费体验</button>
        <button class="mobile-menu" aria-label="打开导航" aria-expanded="false" aria-controls="mobile-nav">${icon('menu')}</button>
      </div>
      <nav class="mobile-nav" id="mobile-nav" aria-label="移动导航" hidden>${navItems}</nav>
    </div>
  </header>`;
}

export function hero() {
  return `<section class="section hero-section" id="home" aria-labelledby="hero-title">
    <div class="hero-copy">
      <h1 id="hero-title">让专注，自然发生。</h1>
      <p>一款 Windows 专注软件，自动屏蔽分心的网站与应用，<br class="desktop-break"/>帮你减少打断，把时间留给重要的事情。</p>
    </div>
    <div class="hero-stage">
      ${focusWindow()}
    </div>
    <a class="scroll-cue" href="#features" aria-label="向下了解功能"><span></span>${icon('down')}</a>
  </section>`;
}

export function setup() {
  return `<section class="section feature-section setup-section" id="features" aria-labelledby="setup-title"><div class="section-inner setup-layout"><div class="feature-copy reveal"><h2 id="setup-title">两步设置，<br/>立即开始<span class="accent">专注。</span></h2><p class="lead">快速屏蔽分心的网站与应用，让你更专注高效。</p><ol class="setup-steps"><li><span class="step-number">01</span><span class="feature-icon">${icon('plus')}</span><div><h3>添加网站与应用</h3><p>将容易分心的内容加入屏蔽列表</p></div></li><li><span class="step-number">02</span><span class="feature-icon">${icon('play')}</span><div><h3>一键开始专注</h3><p>选择专注时长，点击即可开始</p></div></li></ol><div class="setup-assurance">${icon('shield')}<div><h3>自动屏蔽干扰，无需额外操作</h3><p>专注期间自动拦截已添加的网站与应用</p></div></div></div><div class="setup-showcase" aria-label="软件设置界面展示">
      <figure class="setup-shot setup-shot-blocklist"><img src="/assets/app-blocklist.webp" alt="访问控制软件界面截图" width="1200" height="1065" loading="lazy" draggable="false"/></figure>
      <figure class="setup-shot setup-shot-start"><img src="/assets/app-start.webp" alt="开始专注软件界面截图" width="1200" height="1065" loading="lazy" draggable="false"/></figure>
    </div></div></section>`;
}

export function floating() {
  return `<section class="section feature-section floating-section" id="floating" aria-labelledby="floating-title" data-floating-state="expanded"><div class="section-inner floating-layout">
    <div class="feature-copy floating-copy reveal"><h2 id="floating-title"><span>悬浮在桌面，</span><span>不打扰工作</span></h2><p class="lead">从完整专注窗口切换为轻巧悬浮窗，剩余时间一目了然。</p></div>
    <div class="floating-scroll-track" data-floating-track>
      <div class="desktop-showcase floating-sticky">
        <div class="desktop-canvas" data-floating-desktop data-state="expanded" aria-describedby="floating-hint">
          <img class="desktop-wallpaper" src="/assets/windows-desktop.webp" alt="Windows 11 桌面" width="1672" height="941" loading="lazy" draggable="false"/>
          <div class="floating-mover">${focusWindow(true)}</div>
          <div class="mini-timer desktop-timer" data-floating-timer role="group" aria-label="折叠后的专注悬浮窗" aria-hidden="true"><span class="timer-ring"></span><strong data-floating-time>14:47</strong><span class="timer-divider"></span><span class="floating-label">专注中</span></div>
        </div>
        <div class="floating-caption"><p id="floating-hint">向下滚动收起窗口，向上滚动恢复完整视图</p><div class="floating-progress" aria-hidden="true"><span>完整窗口</span><span class="floating-progress-track"><i></i></span><span>轻巧悬浮</span></div></div>
        <span class="visually-hidden" data-floating-status role="status" aria-live="polite">完整专注窗口。向下滚动可查看悬浮状态。</span>
      </div>
    </div>
  </div></section>`;
}

function calendarWindow() {
  const cells = Array.from({ length: 35 }, (_, i) => { const day = i; return day > 0 && day <= 31 ? `<span class="calendar-day ${day === 10 ? 'selected' : ''}">${day}<small>${day < 21 ? ((day * 7 % 42) / 10 + .5).toFixed(1) + 'h' : ''}</small></span>` : '<span></span>'; }).join('');
  return windowShell('calendar-window', '专注日历', `<div class="calendar-heading">2024年10月 <span>‹　 ›</span></div><div class="calendar-grid">${['一', '二', '三', '四', '五', '六', '日'].map(d => `<b>${d}</b>`).join('')}${cells}</div><div class="calendar-summary"><span>本月统计<strong>52<small>小时</small>24<small>分钟</small></strong></span><span>专注天数<strong>18<small>天</small></strong></span></div>`, 'calendar');
}

function chartWindow() {
  return windowShell('chart-window', '专注统计', `<div class="statistics-tabs" role="group" aria-label="统计周期">${['周', '月', '年', '自定义'].map((t, i) => `<button class="${i === 0 ? 'active' : ''}" data-chart-period="${t}" aria-pressed="${i === 0}">${t}</button>`).join('')}<span data-chart-range>2024年10月9日 – 10月15日</span></div><div class="metric-grid"><div><span class="metric-icon orange">${icon('clock')}</span><small>总专注时长</small><strong data-total-hours>32<em>小时</em>18<em>分钟</em></strong><p>较上周 +12%</p></div><div><span class="metric-icon green">${icon('check')}</span><small>完成任务</small><strong data-total-tasks>28<em>项</em></strong><p>较上周 +7%</p></div><div><span class="metric-icon blue">${icon('chart')}</span><small>专注天数</small><strong data-total-days>6<em>天</em></strong><p class="muted">本周 86%</p></div></div><div class="chart-panel"><div class="panel-title"><strong>专注时长趋势</strong><span data-chart-unit>按天${icon('down')}</span></div><div class="bar-chart" role="img" aria-label="一周专注时长趋势柱状图"><div class="chart-scale"><span>6h</span><span>4h</span><span>2h</span><span>0h</span></div><div class="chart-bars">${[38, 68, 70, 90, 56, 49, 81].map((n, i) => `<div class="bar-column"><div class="chart-bar" style="--bar-height:${n}%" title="10月${9 + i}日：${(n / 15).toFixed(1)}小时"></div><span>${10}/${9 + i}</span><small>${['周三', '周四', '周五', '周六', '周日', '周一', '周二'][i]}</small></div>`).join('')}</div></div></div><div class="distribution-panel"><div class="panel-title"><strong>投入分布</strong><span>按目标${icon('down')}</span></div><div class="distribution-content"><div class="donut-chart" role="img" aria-label="工作32%，学习25%，阅读12%，健身9%，其他22%"><div>32<small>小时</small><span>18分钟</span></div></div><ul>${[['工作/开发', '14小时', '32%', '#2f95ff'], ['学习提升', '8小时', '25%', '#50b7ff'], ['阅读', '4小时', '12%', '#ffc663'], ['健身运动', '3小时', '9%', '#ff9f58'], ['其他', '3小时', '22%', '#b578f5']].map(([t, h, p, c]) => `<li><i style="background:${c}"></i><b>${t}</b><span>${h}</span><small>${p}</small></li>`).join('')}</ul></div></div>`, 'chart');
}

function goalsWindow() {
  return windowShell('goals-window', '目标管理', `<div class="goal-categories"><b>全部</b><span>工作</span><span>学习</span><span>生活</span></div>${[['Windows屏蔽软件开发', '12小时 36分钟', 63, '#ff902d', '⌘'], ['前端技术学习', '8小时 20分钟', 55, '#349eff', '+'], ['阅读', '4小时 15分钟', 42, '#2dcba7', '▤'], ['健身运动', '3小时 40分钟', 70, '#8c65ff', '↗'], ['英语学习', '2小时 28分钟', 28, '#ff6b85', 'A']].map(([t, h, p, c, letter]) => `<div class="goal-item" style="--goal-color:${c}"><span>${letter}</span><div><strong>${t}</strong><small>${h}</small><div class="goal-progress"><i style="width:${p}%"></i></div></div><small>${p}%</small></div>`).join('')}`, 'target');
}

export function statistics() {
  return `<section class="section feature-section statistics-section" id="statistics" aria-labelledby="statistics-title"><div class="section-inner statistics-layout"><div class="feature-copy reveal"><span class="eyebrow">专注统计</span><h2 id="statistics-title">时间花在哪里，<br/><span class="accent">一目了然。</span></h2><p class="lead">自动汇总专注时长、投入趋势与目标记录，<br class="desktop-break"/>清楚知道时间投入了多少，又花在了哪里。</p><div class="stat-features">${[['chart', '投入趋势', '掌握专注变化'], ['calendar', '日历记录', '回顾每天的专注'], ['target', '目标统计', '清晰追踪进度']].map(([i, t, p]) => `<div><span class="feature-icon">${icon(i)}</span><h3>${t}</h3><p>${p}</p></div>`).join('')}</div></div><div class="statistics-showcase reveal">${calendarWindow()}${goalsWindow()}${chartWindow()}<span class="interaction-hint">切换周 / 月 / 年，查看不同周期的投入趋势</span></div></div></section>`;
}

export function pricing() {
  return `<section class="section pricing-section" id="pricing" aria-labelledby="pricing-title"><div class="pricing-inner"><h1 class="section-heading reveal" id="pricing-title">简单透明的定价。</h1><div class="pricing-grid" role="group" aria-label="选择适合你的版本">${plans.map(plan => `<article class="price-card ${plan.id === 'pro' ? 'recommended selected' : ''} reveal" data-plan-card="${plan.id}" style="--reveal-delay:${plan.id === 'pro' ? 120 : 0}ms"><button class="plan-select" data-plan="${plan.id}" aria-pressed="${plan.id === 'pro'}" aria-label="选择${plan.name}"><span>${plan.name}</span>${plan.id === 'pro' ? '<span class="recommend-badge">推荐</span>' : '<span class="selection-mark" aria-hidden="true"></span>'}</button><p class="plan-intro">${plan.intro}</p><p class="plan-price"><span>¥</span><strong>${plan.price}</strong>${plan.id === 'pro' ? '<small>/ 年</small>' : ''}</p><p class="plan-note">${plan.note}</p><ul class="plan-features">${plan.features.map(([text, enabled]) => `<li class="${enabled ? '' : 'unavailable'}"><span>${icon('check')}</span>${text}</li>`).join('')}</ul>${plan.id === 'pro' ? `<button class="button button-orange plan-action" data-upgrade>${icon('windows')}${plan.button}${icon('chevron')}</button>` : `<a class="button button-glass plan-action" href="/download/">${icon('windows')}${plan.button}${icon('chevron')}</a>`}</article>`).join('')}</div><div class="pricing-assurances reveal"><span>${icon('shield')}安心使用</span><span>${icon('lock')}数据保存在本地</span><span>${icon('headphones')}用心支持</span></div></div></section>`;
}

export function faq() {
  return `<section class="section faq-section" id="faq" aria-labelledby="faq-title"><div class="faq-inner"><div class="faq-heading reveal"><h1 class="section-heading" id="faq-title">常见问题</h1><p>关于安装、使用与数据保存，你可能想知道的事情。</p></div><div class="faq-grid">${faqs.map(([title, body], i) => `<details class="faq-item reveal" open style="--reveal-delay:${i % 2 * 70}ms"><summary><span>${title}</span><span class="faq-toggle">${icon('plus')}</span></summary><div class="faq-answer"><p>${body}</p></div></details>`).join('')}</div></div></section>`;
}

export function downloadPage() {
  return `<section class="section closing-section download-section" id="download" aria-labelledby="closing-title">
    <div class="closing-copy reveal"><h1 id="closing-title">愿你拥有，不被打扰的时光</h1><p>把纷扰留在外面，把这一刻留给自己。</p><a class="button button-moonlight" href="#download-details">${icon('windows')}<span>下载 Windows 版</span>${icon('arrow')}</a></div>
    <div class="download-panel reveal" id="download-details" aria-labelledby="download-title">
      <h2 id="download-title">为专注，留一点空间。</h2><p class="dialog-description">让每一刻投入，都回到你真正想做的事情上。</p>
      <div class="dialog-info">${icon('windows')}<div><strong>专注 · Windows 版</strong><small>适用于 Windows 10 / 11 · 64 位</small></div></div>
      <p class="dialog-note">当前为产品官网前端演示，暂未接入 Windows 安装包。你可以先体验专注计时与任务清单。</p>
      <button class="button button-light dialog-full" data-demo>${icon('play')}体验功能演示</button><a class="dialog-subtle" href="/features/">了解如何开始 ${icon('arrow')}</a>
    </div><span class="meteor-note">看，有一颗流星为你而来。</span>
  </section>`;
}

export function footer() {
  return `<footer class="site-footer page-footer"><a href="/features/" aria-label="回到首页">${brand(true)}</a><span>让每一刻投入，都有意义。</span><p>© ${new Date().getFullYear()} 专注 <i>·</i> 为 Windows 而生</p><button data-privacy>隐私说明</button></footer>`;
}

export function overlays() {
  return `<dialog class="product-dialog" id="product-dialog" aria-labelledby="dialog-title"><div class="dialog-shell"><button class="dialog-close" data-dialog-close aria-label="关闭弹窗">${icon('close')}</button><div id="dialog-content"></div></div></dialog><div class="toast" role="status" aria-live="polite" aria-atomic="true" id="toast"></div><button class="back-top" aria-label="回到顶部" title="回到顶部" hidden>${icon('arrow')}</button>`;
}

export function renderSite(page = 'features') {
  const content = {
    features: () => hero() + setup() + floating() + statistics(),
    download: downloadPage,
    membership: pricing,
    help: faq,
  }[page];
  if (!content) throw new Error(`Unknown page: ${page}`);
  return `${header(page)}<main id="main" class="page-${page}${['membership', 'help'].includes(page) ? ' standalone-page' : ''}">${content()}</main>${footer()}${overlays()}`;
}

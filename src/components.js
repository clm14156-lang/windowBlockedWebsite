import { icon } from './icons.js';
import { setup } from './setup-preview.js';
export { setup } from './setup-preview.js';
import { statisticsSlides } from './statistics-slides.js';
import { blockingPreview } from './blocking-preview.js';
import { goalsPreview } from './goals-preview.js';
import { impactSection } from './impact-section.js';
import { heroDuration } from './hero-timer.js';
import { header, heroShell, closing, pricing, faq, downloadShell, footer, overlays, notFound } from './site-shell.js';
export { header, closing, pricing, faq, footer, overlays } from './site-shell.js';

const controls = (maximizable = true) => `<span class="window-controls" aria-hidden="true"><i>−</i>${maximizable ? '<i>□</i>' : ''}<i>×</i></span>`;
const sidebar = (active = 'shield') => `<aside class="app-sidebar" aria-label="软件界面装饰"><img src="/assets/favicon.svg" alt="" width="25" height="25"/><div>${['home', 'shield', 'clock', 'settings'].map(i => `<span class="${i === active ? 'active' : ''}">${icon(i)}</span>`).join('')}</div><span class="avatar"></span></aside>`;
const windowShell = (className, title, content, active) => `<div class="app-window ${className}">${sidebar(active)}<div class="app-content"><div class="app-title"><strong>${title}</strong>${controls()}</div>${content}</div></div>`;

function focusWindow(floating = false) {
  const heroLabel = `${String(Math.floor(heroDuration / 60)).padStart(2, '0')}:${String(heroDuration % 60).padStart(2, '0')}`;
  return `<div class="focus-window${floating ? ' floating-focus' : ' hero-focus'}"${floating ? ' id="floating-focus" role="group" aria-label="完整的专注窗口" aria-describedby="floating-hint"' : ' role="group" aria-label="专注计时演示窗口"'}>
    <div class="focus-scene" aria-hidden="true"><picture>${floating ? '' : '<source srcset="/assets/focus02.webp" type="image/webp"/>'}<img src="/assets/${floating ? 'focus_scene01.png' : 'focus02.png'}" alt="" width="${floating ? 1672 : 1536}" height="${floating ? 941 : 1024}" draggable="false"/></picture></div>
    <div class="focus-topbar"><span class="window-dots" aria-hidden="true"><i></i><i></i><i></i></span>${controls(false)}</div>
    <div class="night-greeting"><span class="${floating ? 'moon' : 'day-sun'}" aria-hidden="true">${floating ? '' : icon('sun')}</span><div><h3>${floating ? '夜深了' : '下午好'}</h3><p>${floating ? '让今天的投入，有一个好收尾。' : '把这一段时间，留给重要的事。'}</p></div></div>
    <div class="focus-time" ${floating ? 'data-floating-time' : 'data-hero-time'}>${floating ? '14:47' : heroLabel}</div>
    <p class="focus-task">${icon('language')}<span>学习英语</span></p>
    <div class="focus-toolbar">
      ${floating ? `<div class="focus-toolbar-item">${icon('stop', 'focus-stop-icon')}<span>结束专注</span></div>` : `<button data-hero-toggle aria-pressed="true">${icon('stop', 'focus-stop-icon')}<span>结束专注</span></button>`}
      <span class="focus-toolbar-divider" aria-hidden="true"></span>
      ${floating ? `<div class="focus-toolbar-item">${icon('list')}<span>查看任务 (4)</span></div>` : `<button data-demo="tasks">${icon('list')}<span>查看任务 (4)</span></button>`}
    </div>
    ${floating ? '' : `<button class="mini-timer hero-mini" data-demo aria-label="体验悬浮专注计时器，剩余 ${heroLabel}"><span class="timer-ring" aria-hidden="true"></span><span data-hero-time>${heroLabel}</span></button>`}
  </div>`;
}

export function hero() { return heroShell(focusWindow()); }

export function floating() {
  return `<section class="section feature-section floating-section" id="floating" aria-labelledby="floating-title" data-floating-state="expanded"><div class="section-inner floating-layout">
    <div class="feature-copy floating-copy"><span class="section-kicker">轻巧的悬浮计时</span><h2 id="floating-title"><span>悬浮在桌面，</span><span>不打扰工作</span></h2><p class="lead">把屏幕留给正在做的事，剩余时间轻轻停在一旁。</p></div>
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
  const windows = [chartWindow(), calendarWindow(), goalsWindow()];
  return `<section class="section feature-section statistics-section" id="statistics" aria-label="专注功能展示" aria-roledescription="轮播图"><div class="section-inner statistics-layout">
    <div class="feature-copy">
      <div class="statistics-copy-panels">${statisticsSlides.map((slide, i) => `<div class="statistics-copy-panel${i === 0 ? ' is-active' : ''}" data-stat-copy="${i}" aria-hidden="${i !== 0}"${i !== 0 ? ' inert' : ''}><span class="eyebrow">${slide.label}</span><h2 id="statistics-title${i ? `-${slide.id}` : ''}">${slide.title}<br/><span class="accent">${slide.accent}</span></h2><p class="lead">${slide.description.join('<br class="desktop-break"/>')}</p></div>`).join('')}</div>
      <div class="stat-features" role="group" aria-label="选择展示功能" data-stat-selector-group>${statisticsSlides.map((slide, i) => `<button type="button" class="stat-feature" data-stat-select="${i}" aria-pressed="${i === 0}" aria-controls="statistics-stage"><span class="feature-icon">${icon(slide.icon)}</span><span class="stat-feature-text"><strong>${slide.label}</strong><small>${slide.summary}</small></span></button>`).join('')}</div>
      <p class="section-footnote statistics-note">界面数据为示例，用于展示统计方式。</p>
    </div>
    <div class="statistics-showcase">
      <div class="statistics-stage" id="statistics-stage">${statisticsSlides.map((slide, i) => `<div class="statistics-slide" data-stat-slide="${i}" data-position="${i === 0 ? 'current' : i === 1 ? 'next' : 'previous'}" role="group" aria-roledescription="幻灯片" aria-label="${i + 1} / 3：${slide.label}" aria-hidden="${i !== 0}"${i !== 0 ? ' inert' : ''}>${windows[i]}</div>`).join('')}</div>
      <div class="statistics-navigation" role="group" aria-label="轮播控制">
        <button type="button" class="statistics-arrow statistics-previous" data-stat-direction="-1" aria-label="上一页" aria-controls="statistics-stage">${icon('chevron')}</button>
        <div class="statistics-dots" role="group" aria-label="选择轮播页面" data-stat-selector-group>${statisticsSlides.map((slide, i) => `<button type="button" class="statistics-dot" data-stat-select="${i}" aria-pressed="${i === 0}" aria-label="第 ${i + 1} 页：${slide.label}" aria-controls="statistics-stage"><span></span></button>`).join('')}</div>
        <button type="button" class="statistics-arrow statistics-next" data-stat-direction="1" aria-label="下一页" aria-controls="statistics-stage">${icon('chevron')}</button>
        <button type="button" class="statistics-rotation" data-stat-rotation aria-label="开启自动轮播" aria-pressed="false">${icon('pause', 'rotation-pause')}${icon('play', 'rotation-play')}</button>
      </div>
    </div>
    <span class="visually-hidden" role="status" aria-live="polite" aria-atomic="true" data-stat-status>第 1 页，共 3 页：专注统计</span>
  </div></section>`;
}

export function downloadPage() { return downloadShell(focusWindow()); }

export function renderSite(page = 'features') {
  const content = {
    features: () => hero() + setup() + blockingPreview() + floating() + goalsPreview() + statistics() + impactSection() + closing(),
    download: downloadPage,
    'not-found': notFound,
    membership: pricing,
    help: faq,
  }[page];
  if (!content) throw new Error(`Unknown page: ${page}`);
  return `${header(page)}<main id="main" class="page-${page}${page !== 'features' ? ' standalone-page' : ''}">${content()}</main>${footer()}${overlays()}`;
}

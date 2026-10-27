import { icon } from './icons.js';
import { setup } from './setup-preview.js';
export { setup } from './setup-preview.js';
import { statisticsPreview } from './statistics-preview.js';
import { blockingPreview } from './blocking-preview.js';
import { goalsPreview } from './goals-preview.js';
import { impactSection } from './impact-section.js';
import { heroDuration } from './hero-timer.js';
import { themeScenes } from './theme-scenes.js';
import { personalizationPreview } from './personalization-preview.js';
import { header, heroShell, closing, pricing, faq, downloadShell, footer, overlays, notFound } from './site-shell.js';
export { header, closing, pricing, faq, footer, overlays } from './site-shell.js';

const controls = (maximizable = true) => `<span class="window-controls" aria-hidden="true"><i>−</i>${maximizable ? '<i>□</i>' : ''}<i>×</i></span>`;

function focusWindow(floating = false, themed = false) {
  const heroLabel = `${String(Math.floor(heroDuration / 60)).padStart(2, '0')}:${String(heroDuration % 60).padStart(2, '0')}`;
  const scene = themed ? themeScenes([], undefined, { day: { src: '/assets/focus03.png', width: 1608, height: 978 } }) : `<picture>${floating ? '' : '<source srcset="/assets/focus02.webp" type="image/webp"/>'}<img src="/assets/${floating ? 'focus_scene01.png' : 'focus02.png'}" alt="" width="${floating ? 1672 : 1536}" height="${floating ? 941 : 1024}" draggable="false"/></picture>`;
  return `<div class="focus-window${floating ? ' floating-focus' : ' hero-focus'}"${floating ? ' id="floating-focus" role="group" aria-label="完整的专注窗口" aria-describedby="floating-hint"' : ` role="group" aria-label="专注计时演示窗口"${themed ? ' id="hero-focus-window" data-hero-theme="day"' : ''}`}>
    <div class="focus-scene${themed ? ' hero-themed-scene' : ''}" aria-hidden="true">${scene}</div>
    <div class="focus-topbar"><span class="window-dots" aria-hidden="true"><i></i><i></i><i></i></span>${controls(false)}</div>
    <div class="night-greeting"><span class="${floating ? 'moon' : 'day-sun'}" aria-hidden="true">${floating ? '' : icon('sun')}</span>${themed ? '<span class="hero-greeting-moon" aria-hidden="true"><img src="/assets/focus-moon.svg" alt="" width="60" height="60"/></span>' : ''}<div><h3${themed ? ' data-hero-greeting' : ''}>${floating ? '夜深了' : '下午好'}</h3><p${themed ? ' data-hero-greeting-note' : ''}>${floating ? '让今天的投入，有一个好收尾。' : '把这一段时间，留给重要的事。'}</p></div></div>
    <div class="focus-time" ${floating ? 'data-floating-time' : 'data-hero-time'}>${floating ? '14:47' : heroLabel}</div>
    <p class="focus-task">${icon('language')}<span>学习英语</span></p>
    <div class="focus-toolbar">
      ${floating ? `<div class="focus-toolbar-item">${icon('stop', 'focus-stop-icon')}<span>结束专注</span></div>` : `<button data-hero-toggle aria-pressed="true"${themed ? ' data-hero-stop-label="结束任务" data-hero-start-label="开始任务"' : ''}>${icon('stop', 'focus-stop-icon')}<span>${themed ? '结束任务' : '结束专注'}</span></button>`}
      ${themed ? '' : `<span class="focus-toolbar-divider" aria-hidden="true"></span>`}
      ${themed ? '' : floating ? `<div class="focus-toolbar-item">${icon('list')}<span>查看任务 (4)</span></div>` : `<button data-demo="tasks">${icon('list')}<span>查看任务 (4)</span></button>`}
    </div>
    ${floating || themed ? '' : `<button class="mini-timer hero-mini" data-demo aria-label="体验悬浮专注计时器，剩余 ${heroLabel}"><span class="timer-ring" aria-hidden="true"></span><span data-hero-time>${heroLabel}</span></button>`}
  </div>`;
}

export function hero() { return heroShell(focusWindow(false, true)); }

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

export function statistics() { return statisticsPreview(); }

export function downloadPage() { return downloadShell(focusWindow()); }

export function renderSite(page = 'features') {
  const content = {
    features: () => hero() + setup() + blockingPreview() + floating() + goalsPreview() + statistics() + impactSection() + personalizationPreview() + closing(),
    download: downloadPage,
    'not-found': notFound,
    membership: pricing,
    help: faq,
  }[page];
  if (!content) throw new Error(`Unknown page: ${page}`);
  return `${header(page)}<main id="main" class="page-${page}${page !== 'features' ? ' standalone-page' : ''}">${content()}</main>${footer()}${overlays()}`;
}

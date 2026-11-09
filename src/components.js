import { icon } from './icons.js';
import { setup } from './setup-preview.js';
export { setup } from './setup-preview.js';
import { statisticsPreview } from './statistics-preview.js';
import { blockingPreview } from './blocking-preview.js';
import { goalsPreview } from './goals-preview.js';
import { impactSection } from './impact-section.js';
import { heroDuration } from './hero-timer.js';
import { personalizationPreview } from './personalization-preview.js';
import { focusCharacters } from './focus-characters.js';
import { heroThemes } from './hero-theme.js';
import { themeScenes } from './theme-scenes.js';
import { accountCenter } from './account-center.js';
import { header, heroShell, closing, pricing, faq, downloadShell, footer, overlays, notFound } from './site-shell.js';
export { header, closing, pricing, faq, footer, overlays } from './site-shell.js';

function focusWindow() {
  const heroLabel = `${String(Math.floor(heroDuration / 60)).padStart(2, '0')}:${String(heroDuration % 60).padStart(2, '0')}`;
  const [day] = heroThemes;
  const [girl] = focusCharacters;
  return `<div class="focus-window hero-focus download-focus" role="group" aria-label="专注计时演示窗口">
    <div class="focus-scene hero-themed-scene" aria-hidden="true">${themeScenes([girl], girl.id, [day])}</div>
    <div class="focus-topbar" aria-hidden="true"><span class="window-dots"><i></i><i></i><i></i></span><span class="window-controls"><i>−</i><i>□</i><i>×</i></span></div>
    <div class="night-greeting"><span class="day-sun" aria-hidden="true">${icon('sun')}</span><div><h3>${day.greeting}</h3><p>${day.note}</p></div></div>
    <div class="focus-time" data-hero-time role="timer" aria-label="专注倒计时" aria-live="off">${heroLabel}</div>
    <div class="focus-toolbar">
      <span class="focus-toolbar-label">${icon('stop', 'focus-stop-icon')}<span>结束专注</span></span>
      <span class="focus-toolbar-divider" aria-hidden="true"></span>
      <span class="focus-toolbar-label">${icon('list')}<span>查看任务 (4)</span></span>
    </div>
  </div>`;
}

export function hero() { return heroShell(); }

export function floating() {
  const steps = [
    ['focus','专注页面','进入专注模式，打开沉浸的专注页面，远离干扰，让注意力回到真正重要的事。','zhuanzhu_shouye.png',1536,1024,'白天专注页面，展示自然风景、专注角色与倒计时'],
    ['floating','悬浮页面','以悬浮窗口的形式停留在桌面，随时查看专注进度和任务清单，不打断当前工作。','zhuanzhu_xuanfu.png',1108,1420,'桌面悬浮专注窗口，展示倒计时、进度与当前任务清单'],
    ['collapsed','折叠页面','折叠后只保留关键的计时信息，贴在屏幕边缘，随时可见，不打扰你的工作。','zhedie.png',1672,941,'折叠后的悬浮计时条，展示剩余时间与当前任务'],
  ];
  const benefits = [
    ['grid','沉浸专注',['清爽的专注页面','帮你远离干扰']],
    ['list','轻巧悬浮',['桌面悬浮窗口','随时查看进度与任务']],
    ['minus','一键收起',['可折叠至屏幕边缘','关键计时信息始终可见']],
    ['heart','不打断工作',['灵活适应不同的工作场景','让专注自然融入日常']],
  ];
  const arrow = '<svg class="floating-flow-arrow" viewBox="0 0 80 56" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6c5 26 30 36 68 33m-12-11 14 11-14 10"/></svg>';
  return `<section class="section feature-section floating-section" id="floating" aria-labelledby="floating-title"><div class="section-inner floating-layout">
    <div class="feature-copy floating-copy"><span class="section-kicker">轻巧的悬浮计时</span><h2 id="floating-title">三种形态，陪你<span>自然专注</span></h2><p class="lead">既可以是一整页的专注空间，也可以是桌面的悬浮窗口，或是折叠在屏幕边缘，<br class="desktop-break"/>适应你不同的工作时刻。</p></div>
    <ol class="floating-cards" aria-label="专注时光的三种形态">${steps.map(([id,title,description,asset,width,height,alt],i) => `<li class="floating-card" data-floating-card="${id}"><div class="floating-card-heading"><span class="floating-step-number" aria-hidden="true">${i+1}</span><div><h3>${title}</h3><p>${description}</p></div></div><div class="floating-visual-wrap"><figure class="floating-card-visual"><img src="/assets/product/${asset}" alt="${alt}" width="${width}" height="${height}" loading="lazy" decoding="async" draggable="false"/></figure>${i<steps.length-1?arrow:''}</div></li>`).join('')}</ol>
    <ul class="floating-benefits" aria-label="三种专注形态的功能特点">${benefits.map(([name,title,lines]) => `<li><span class="floating-benefit-icon ${name}">${icon(name)}</span><div><h3>${title}</h3><p>${lines.join('<br/>')}</p></div></li>`).join('')}</ul>
  </div></section>`;
}

export function statistics() { return statisticsPreview(); }

export function downloadPage() { return downloadShell(focusWindow()); }

export function renderSite(page = 'features') {
  const content = {
    features: () => hero() + setup() + floating() + personalizationPreview() + blockingPreview() + goalsPreview() + statistics() + impactSection() + closing(),
    download: downloadPage,
    'not-found': notFound,
    membership: pricing,
    help: faq,
    account: accountCenter,
  }[page];
  if (!content) throw new Error(`Unknown page: ${page}`);
  if (page === 'account') return `${header(page)}<main id="main" class="page-account" hidden>${content()}</main>${overlays()}`;
  return `${header(page)}<main id="main" class="page-${page}${page !== 'features' ? ' standalone-page' : ''}">${content()}</main>${footer()}${overlays()}`;
}

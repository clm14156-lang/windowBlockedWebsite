import { icon, brand } from './icons.js';
import { plans, faqs } from './data.js';
import { pages } from './routes.js';
import { publicUrl, siteConfig } from './site-config.js';

const primaryActions = () => `<div class="hero-actions"><button type="button" class="button button-orange hero-start" data-demo aria-haspopup="dialog">开始使用${icon('chevron')}</button><a class="button button-secondary hero-download" href="/download/">${icon('windows')}<span>立即下载</span>${icon('arrow', 'hero-download-arrow')}</a></div>`;

export function header(page = 'features') {
  const nav = pages.map(item => `<a class="nav-item${item.id === page ? ' active' : ''}" href="${item.path}" data-nav="${item.id}"${item.id === page ? ' aria-current="page"' : ''}>${item.label}</a>`).join('');
  return `<header class="site-header" id="site-header"><div class="nav-shell"><a class="brand-link" href="/features/" aria-label="专注时光首页">${brand()}</a><nav class="desktop-nav" aria-label="主导航">${nav}</nav><button class="button button-small trial-button" data-demo aria-haspopup="dialog">在线体验${icon('arrow')}</button><button class="mobile-menu" aria-label="打开导航" aria-expanded="false" aria-controls="mobile-nav">${icon('menu')}</button></div><nav class="mobile-nav" id="mobile-nav" aria-label="移动导航" hidden>${nav}</nav></header>`;
}

export function heroShell(window) {
  return `<section class="section hero-section" id="home" aria-labelledby="hero-title"><div class="hero-copy"><span class="hero-eyebrow">${icon('windows')}为 Windows 而设计</span><h1 id="hero-title">让专注，<span>自然发生。</span></h1><p>屏蔽分心的网站与应用，把目标拆成每天的行动。<br class="desktop-break"/>少一点打扰，把时间留给真正重要的事。</p>${primaryActions()}<span class="hero-meta">网站与应用屏蔽<span>·</span>目标与任务<span>·</span>专注记录</span></div><div class="hero-stage">${window}<div class="product-caption"><span>软件界面预览</span><span>试试计时与任务交互${icon('arrow')}</span></div></div><div class="feature-index" aria-label="浏览产品功能">${[['shield','屏蔽干扰','blocking'],['clock','轻巧悬浮','floating'],['target','目标与任务','goals'],['chart','记录投入','statistics']].map(([name,label,id]) => `<a href="#${id}">${icon(name)}<span>${label}</span>${icon('chevron')}</a>`).join('')}</div></section>`;
}

export function closing() {
  return `<section class="section closing-section" id="closing" aria-labelledby="closing-title"><div class="closing-inner"><div><span class="section-kicker">把这一刻，留给自己</span><h2 id="closing-title">愿你拥有，不被打扰的时光。</h2><p>从下一段专注开始，让重要的事慢慢发生。</p></div>${primaryActions()}</div></section>`;
}

export function pricing() {
  return `<section class="section pricing-section" id="pricing" aria-labelledby="pricing-title"><div class="section-inner"><header class="page-heading"><span class="section-kicker">方案与价格</span><h1 id="pricing-title">选择适合你的专注方式。</h1><p>先体验核心功能，再决定是否需要更完整的工具。</p></header><div class="pricing-grid">${plans.map(plan => `<article class="price-card ${plan.id === 'pro' ? 'recommended selected' : ''}" data-plan-card="${plan.id}"><button class="plan-select" data-plan="${plan.id}" aria-pressed="${plan.id === 'pro'}"><span>${plan.name}</span>${plan.id === 'pro' ? '<span class="recommend-badge">完整体验</span>' : '<span class="selection-mark" aria-hidden="true"></span>'}</button><p class="plan-intro">${plan.intro}</p><p class="plan-price"><span>¥</span><strong>${plan.price}</strong><small>${plan.id === 'pro' ? '/ 年' : '/ 免费体验'}</small></p><p class="plan-note">${plan.note}</p><ul class="plan-features">${plan.features.map(([text,enabled]) => `<li class="${enabled ? '' : 'unavailable'}">${icon(enabled ? 'check' : 'close')}<span>${text}</span></li>`).join('')}</ul><button class="button ${plan.id === 'pro' ? 'button-orange' : 'button-secondary'} plan-action" ${plan.id === 'pro' ? 'data-upgrade' : 'data-demo'}>${plan.button}${icon('arrow')}</button></article>`).join('')}</div><p class="commercial-note">${publicUrl(siteConfig.checkoutUrl) ? '正式价格、授权范围与服务条款以购买页面为准。' : '当前为方案预览，价格与权益为展示信息，购买入口暂未开放。'}</p><div class="pricing-bottom"><span>还不确定选哪一种？</span><a href="/help/">先看看常见问题${icon('arrow')}</a></div></div></section>`;
}

export function faq() {
  return `<section class="section faq-section" id="faq" aria-labelledby="faq-title"><div class="section-inner help-layout"><header class="page-heading help-heading"><span class="section-kicker">帮助中心</span><h1 id="faq-title">每一步，都清楚。</h1><p>关于开始专注、任务管理和网页体验，<br class="desktop-break"/>你可能想知道的事。</p><a class="text-link" href="/download/">前往下载页${icon('arrow')}</a></header><div class="faq-list">${faqs.map(([title,body],i) => `<details class="faq-item"${i === 0 ? ' open' : ''}><summary><span>${title}</span><span class="faq-toggle">${icon('plus')}</span></summary><div class="faq-answer"><p>${body}</p></div></details>`).join('')}</div></div></section>`;
}

export function downloadShell(window) {
  const download = publicUrl(siteConfig.downloadUrl);
  return `<section class="section download-section" id="download" aria-labelledby="download-title"><div class="section-inner"><div class="download-layout"><div class="download-copy"><span class="section-kicker">专注时光 · Windows 版</span><h1 id="download-title">把专注，<br/>带回你的桌面。</h1><p>让网站、应用、任务和时间各归其位。<br/>给每一段投入，一个清楚的开始。</p><div class="download-card"><div class="download-card-heading"><span class="download-platform">${icon('windows')}</span><div><strong>专注时光 for Windows</strong><span>${download && siteConfig.version ? `版本 ${siteConfig.version}` : '安装包即将开放'}</span></div></div>${download ? `<a class="button button-orange" href="${download}" rel="noopener">下载 Windows 版${icon('download')}</a>` : `<button class="button button-orange" disabled>下载准备中${icon('download')}</button>`}<button class="text-link" data-demo>先在线体验${icon('arrow')}</button><p class="download-note">${download ? '请通过本页提供的官方地址获取安装包。' : '当前为下载入口预览，暂不提供安装包。'}</p></div></div><div class="download-preview">${window}<p class="product-caption">软件界面预览 · 日间主题</p></div></div><div class="download-guide"><h2>安装之后，只需三步。</h2><ol><li><span>01</span><div><h3>添加屏蔽清单</h3><p>选择需要暂时放下的网站与应用。</p></div></li><li><span>02</span><div><h3>选好目标和时长</h3><p>把这一段时间，交给一件重要的事。</p></div></li><li><span>03</span><div><h3>进入专注状态</h3><p>用悬浮计时与任务记录保持节奏。</p></div></li></ol></div></div></section>`;
}

export function footer() {
  return `<footer class="site-footer"><div class="footer-main"><div class="footer-brand"><a href="/features/" aria-label="回到首页">${brand()}</a><p>少一点分心，多一点自己的时间。</p></div><nav class="footer-links" aria-label="页脚导航">${pages.map(page => `<a href="${page.path}">${page.label}</a>`).join('')}<button data-privacy>隐私说明</button></nav></div><div class="footer-bottom"><p>© ${new Date().getFullYear()} 专注时光</p><span>为 Windows 而设计</span></div></footer>`;
}

export function overlays() {
  return `<dialog class="product-dialog" id="product-dialog" aria-labelledby="dialog-title"><div class="dialog-shell"><button class="dialog-close" data-dialog-close aria-label="关闭弹窗">${icon('close')}</button><div id="dialog-content"></div></div></dialog><div class="toast" role="status" aria-live="polite" aria-atomic="true" id="toast"></div><button class="back-top" aria-label="回到顶部" title="回到顶部" hidden>${icon('arrow')}</button>`;
}

export function notFound() {
  return `<section class="section not-found-section"><div class="section-inner"><span class="section-kicker">404 / 页面未找到</span><h1>这一页，暂时不在这里。</h1><p>链接可能已经更新，回到首页继续了解专注时光。</p><a class="button button-orange" href="/features/">回到首页${icon('arrow')}</a></div></section>`;
}

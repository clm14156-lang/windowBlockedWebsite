import { icon, brand } from './icons.js';
import { plans, faqs, billingPlans, defaultBillingPlan } from './data.js';
import { pages } from './routes.js';
import { publicUrl, siteConfig } from './site-config.js';
import { accountNavigation } from './account-center.js';

const primaryActions = () => `<div class="hero-actions"><button type="button" class="button button-orange hero-start" data-demo aria-haspopup="dialog">开始使用${icon('chevron')}</button><a class="button button-secondary hero-download" href="/download/">${icon('windows')}<span>立即下载</span>${icon('arrow', 'hero-download-arrow')}</a></div>`;

export function header(page = 'features') {
  const nav = pages.map(item => `<a class="nav-item${item.id === page ? ' active' : ''}" href="${item.path}" data-nav="${item.id}"${item.id === page ? ' aria-current="page"' : ''}>${item.label}</a>`).join('');
  return `<header class="site-header${page === 'account' ? ' account-page-header' : ''}" id="site-header"><div class="nav-shell"><a class="brand-link" href="/features/" aria-label="专注时光首页">${brand()}</a><nav class="desktop-nav" aria-label="主导航">${nav}</nav>${accountNavigation()}<button class="mobile-menu" aria-label="打开导航" aria-expanded="false" aria-controls="mobile-nav">${icon('menu')}</button></div><nav class="mobile-nav" id="mobile-nav" aria-label="移动导航" hidden>${nav}</nav></header>`;
}

export function heroShell() {
  const benefits = [['shield','屏蔽干扰','远离分心的网站和应用'],['clock','轻巧悬浮','随时查看专注进度'],['target','目标与任务','让计划更有方向'],['chart','记录投入','看见你的进步']];
  return `<section class="section hero-section" id="home" aria-labelledby="hero-title"><div class="hero-content"><div class="hero-copy"><h1 id="hero-title">让专注，<span>自然发生。</span></h1><p>屏蔽分心的网站与应用，把目标拆成每天的行动。<br class="desktop-break"/>少一点打扰，把时间留给真正重要的事。</p></div>
    <div class="hero-scroll-track" data-hero-scroll-track>${primaryActions()}
      <div class="hero-stage" data-hero-stage><div class="hero-home-preview"><img data-hero-main src="/assets/product/image1.png" alt="专注时光软件首页：开始专注、专注时长选择及当前屏蔽的网站与应用" width="867" height="756" fetchpriority="high" decoding="async" draggable="false"/></div>
        <img class="hero-floating-preview" data-hero-floating src="/assets/product/xuanfuyemian.png" alt="悬浮专注窗口：倒计时、当前目标和任务列表" width="1108" height="1420" loading="eager" decoding="async" draggable="false" aria-hidden="true"/>
        <ul class="hero-benefits" data-hero-benefits aria-label="专注时光的四项功能" aria-hidden="true">${benefits.map(([name,label,description]) => `<li><span class="hero-benefit-icon ${name}">${icon(name)}</span><strong>${label}</strong><p>${description}</p></li>`).join('')}</ul>
      </div>
    </div>
    <span class="visually-hidden" role="status" aria-live="polite" data-hero-showcase-status></span>
  </div></section>`;
}

export function closing() {
  const download = publicUrl(siteConfig.downloadUrl) || '/download/';
  return `<section class="section closing-section" id="closing" aria-labelledby="closing-title">
    <div class="closing-inner">
      <h2 id="closing-title"><span class="closing-title-intro">愿你拥有，</span><span class="closing-title-ending"><span>不被打扰</span>的时光。</span></h2>
      <p>把纷扰留在外面，把这一刻留给自己。</p>
      <a class="button button-orange closing-download" href="${download}"${download.startsWith('https:') ? ' rel="noopener"' : ''} data-closing-download>${icon('windows')}<span>下载 Windows 版</span>${icon('arrow')}</a>
    </div>
  </section>`;
}

export function pricing() {
  const billing = billingPlans[defaultBillingPlan];
  const advantages = [
    ['shield', '减少分心干扰', '自定义网站与应用屏蔽清单。'],
    ['windows', 'Windows 桌面体验', '专注计时，搭配轻巧悬浮窗。'],
    ['refresh', '清晰记录投入', '查看趋势、日历与目标进展。'],
    ['heart', '清楚的使用帮助', '常见问题，随时查阅。'],
  ];
  return `<section class="section pricing-section" id="pricing" aria-labelledby="pricing-title">
    <div class="section-inner membership-inner">
      <header class="page-heading membership-heading"><h1 id="pricing-title">简单开始，<span>按需升级</span>。</h1><p>基础专注功能免费使用，需要更多能力时再选择专业版。</p></header>
      <div class="billing-switch" data-membership-billing role="group" aria-label="选择专业版套餐">${Object.entries(billingPlans).map(([id, option]) => `
        <button class="billing-option" type="button" data-billing-plan="${id}" aria-pressed="${id === defaultBillingPlan}" disabled>
          <span class="billing-option-label">${icon(option.icon)}${option.label}</span>
        </button>`).join('')}</div>
      <div class="pricing-grid">${plans.map(plan => {
        const pro = plan.id === 'pro';
        return `<article class="price-card${pro ? ' recommended selected' : ''}" data-plan-card="${plan.id}" aria-labelledby="plan-title-${plan.id}">
        <h2 class="plan-title" id="plan-title-${plan.id}">${plan.name}</h2>
        <p class="plan-intro">${plan.intro}</p>
        <div aria-live="${pro ? 'polite' : 'off'}"><p class="plan-price"><span>¥</span><strong>${pro ? '—' : plan.price}</strong><small>${pro ? '' : '/ 免费体验'}</small></p><p class="plan-note">${pro ? '正在获取套餐…' : plan.note}</p></div>
        <button type="button" class="button ${pro ? 'button-orange' : 'button-secondary'} plan-action" ${pro ? 'data-upgrade disabled aria-haspopup="dialog" aria-controls="product-dialog"' : 'data-demo'}>${icon(pro ? 'crown' : 'windows')}<span>${pro ? '正在获取套餐…' : plan.button}</span>${icon(pro ? 'arrow' : 'chevron')}</button>
        <div class="plan-inclusions"><h3>包含以下功能</h3><ul class="plan-features">${plan.features.map(([text,enabled]) => `<li class="${enabled ? '' : 'unavailable'}"><span class="plan-feature-marker" aria-hidden="true">${icon(enabled ? 'check' : 'close')}</span>${enabled ? '' : '<span class="visually-hidden">不包含：</span>'}<span>${text}</span></li>`).join('')}</ul></div>
      </article>`;
      }).join('')}</div>
      <div class="membership-notes"><p class="commercial-note" data-catalog-status role="status">正在获取最新套餐…</p><button class="payment-text-button" type="button" data-catalog-retry hidden>重新加载套餐</button><p class="commercial-note">真实购买入口暂未开放。开发测试环境支持模拟支付。</p><div class="pricing-bottom"><a href="/help/">先看看常见问题${icon('arrow')}</a></div></div>
    </div>
    <ul class="membership-benefits" aria-label="专注时光产品与使用帮助">${advantages.map(([name,title,description]) => `<li><span class="membership-benefit-icon ${name}">${icon(name)}</span><div><h3>${title}</h3><p>${description}</p></div></li>`).join('')}</ul>
  </section>`;
}

export function faq() {
  const categories = [
    { icon:'download', title:'下载与安装', description:['软件下载、开放状态','安装前的常见问题'], href:'/download/' },
    { icon:'shield', title:'专注与屏蔽', description:['屏蔽设置、专注计时','与悬浮窗口说明'], question:2 },
    { icon:'list', title:'目标与任务', description:['目标关联、查看任务','专注中的任务记录'], question:4 },
    { icon:'chart', title:'数据与统计', description:['专注记录、趋势回顾','网页数据保存说明'], question:6 },
  ];
  return `<section class="section faq-section" id="faq" aria-labelledby="faq-title">
    <div class="section-inner help-inner">
      <div class="help-intro">
        <header class="page-heading help-heading"><span class="section-kicker">帮助中心</span><h1 id="faq-title">使用专注时光时，<span>有疑问？</span></h1><p>这里提供专注时光的使用指南和常见问题，<br/>帮助你快速解决在下载安装、网站屏蔽、任务管理和数据统计中遇到的问题。</p></header>
        <figure class="help-art" aria-hidden="true"><img src="/assets/helpbackground.png" alt="" width="1983" height="793" decoding="async" fetchpriority="high" draggable="false"/></figure>
      </div>
      <nav class="help-categories" aria-label="帮助分类">${categories.map(category => `<a class="help-category" href="${category.href || '#faq-question-'+category.question}"${category.question ? ` data-help-question="faq-question-${category.question}" aria-controls="faq-question-${category.question}"` : ''}><span class="help-category-icon">${icon(category.icon)}</span><span class="help-category-copy"><strong>${category.title}</strong><span>${category.description.join('<br/>')}</span></span>${icon('chevron','help-category-arrow')}</a>`).join('')}</nav>
      <div class="faq-section-heading"><h2 id="faq-list-title">常见问题</h2><span>共 ${faqs.length} 个问题</span></div>
      <div class="faq-list" aria-labelledby="faq-list-title">${faqs.map(([title,body],i) => `<details class="faq-item" id="faq-question-${i+1}"><summary><span>${title}</span><span class="faq-toggle">${icon('plus')}</span></summary><div class="faq-answer"><p>${body}</p></div></details>`).join('')}</div>
    </div>
  </section>`;
}

export function downloadShell(window) {
  const download = publicUrl(siteConfig.downloadUrl);
  const features = [
    ['shield', '网站与应用屏蔽', '远离干扰，保持专注'],
    ['chart', '专注计时', '记录每一段投入的时间'],
    ['check', '任务与统计', '管理任务，见证进步'],
  ];
  return `<section class="section download-section" id="download" aria-labelledby="download-title">
    <div class="section-inner download-inner">
      <div class="download-layout">
        <div class="download-copy">
          <span class="download-eyebrow">专注时光 for Windows</span>
          <h1 id="download-title">让<span>专注</span>，<br/>自然发生。</h1>
          <p class="download-summary">屏蔽干扰 · 规划任务 · 记录进步</p>
          <div class="download-actions">${download ? `<a class="button button-orange download-primary" href="${download}" rel="noopener" aria-describedby="download-status">${icon('windows')}<span>下载 Windows 版</span>${icon('download')}</a>` : `<button type="button" class="button button-orange download-primary" disabled aria-describedby="download-status">${icon('windows')}<span>下载准备中</span>${icon('download')}</button>`}</div>
          <p class="download-note" id="download-status">${download && siteConfig.version ? `版本 ${siteConfig.version} · ` : ''}${download ? '请通过本页提供的官方地址获取安装包。' : '当前为下载入口预览，暂不提供安装包。'}</p>
        </div>
        <figure class="download-preview">${window}<figcaption class="visually-hidden">专注时光白天软件界面预览</figcaption></figure>
      </div>
      <ul class="download-features" aria-label="三项核心功能">${features.map(([name,title,description]) => `<li><span class="download-feature-icon${name==='check'?' is-task':''}">${icon(name)}</span><div><h2>${title}</h2><p>${description}</p></div></li>`).join('')}</ul>
    </div>
  </section>`;
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

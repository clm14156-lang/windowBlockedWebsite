import { icon } from './icons.js';

const normalBrowser = () => `<img class="blocking-normal-image" src="/assets/product/哔哩哔哩动漫首页浏览器界面.png" alt="哔哩哔哩正常访问的浏览器界面，包含地址栏、网站导航、动漫横幅和视频列表" width="1448" height="1086" loading="lazy" decoding="async" draggable="false"/>`;
const benefits = [
  { icon: 'shield', color: 'orange', title: '自动拦截', description: '访问已屏蔽的网站时自动触发，不需要手动操作。' },
  { icon: 'clock', color: 'blue', title: '专注不中断', description: '清楚展示拦截提示与剩余专注时间，保持专注状态。' },
  { icon: 'grid', color: 'purple', title: '支持多网站和应用', description: '可自定义屏蔽的网站与应用，打造适合自己的专注环境。' },
];

export function blockingPreview() {
  return `<section class="section blocking-section" id="blocking" aria-labelledby="blocking-title">
    <div class="section-inner blocking-inner">
      <header class="section-heading-block blocking-heading">
        <span class="section-kicker">WEBSITE BLOCKING</span>
        <h2 id="blocking-title">让干扰止步，<span>让专注继续。</span></h2>
        <p>专注期间，自动拦截你设定的网站与应用。<br class="desktop-break"/>访问时显示专注提示页和剩余时间，帮助你回到当前任务。</p>
      </header>
      <div class="blocking-comparison" role="group" aria-label="访问分心网站后自动拦截的前后对比">
        <figure class="blocking-comparison-item blocking-before">
          <div class="blocking-preview-frame blocking-normal-surface">${normalBrowser()}</div>
          <figcaption class="visually-hidden">拦截前：访问分心网站 bilibili.com。</figcaption>
        </figure>
        <div class="blocking-flow" aria-hidden="true">
          <span class="blocking-flow-label">自动拦截</span>
          <svg class="blocking-flow-arrow" viewBox="0 0 120 80" fill="none"><path d="M5 10C20 35 42 44 81 43L80 29L114 51L83 76V60C43 58 18 44 5 10Z" fill="currentColor" stroke="white" stroke-width="3" stroke-linejoin="round"/></svg>
        </div>
        <figure class="blocking-comparison-item blocking-after">
          <div class="blocking-preview-frame blocking-blocked-surface">
            <img class="blocking-blocked-image" src="/assets/blocked01.png" alt="此网站已被屏蔽：bilibili.com 显示浅色专注提示页，男孩与企鹅坐在草地上，本次专注仍在继续" width="1607" height="979" loading="lazy" decoding="async" draggable="false"/>
          </div>
          <figcaption class="visually-hidden">自动拦截后：bilibili.com 显示专属提示页与剩余专注时间。</figcaption>
        </figure>
      </div>
      <ul class="impact-benefits blocking-benefits">${benefits.map(benefit => `<li class="impact-benefit"><span class="impact-icon blocking-benefit-icon ${benefit.color}">${icon(benefit.icon)}</span><div><h3>${benefit.title}</h3><p>${benefit.description}</p></div></li>`).join('')}</ul>
    </div>
  </section>`;
}

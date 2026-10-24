import { icon } from './icons.js';

const trafficLights = '<span class="blocking-traffic-lights" aria-hidden="true"><i></i><i></i><i></i></span>';
const siteIcon = (className = '') => `<svg class="blocking-site-icon ${className}" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m13 5 4 6m10-6-4 6"/><rect x="7" y="12" width="26" height="22" rx="6"/><path d="M14 20v5m12-5v5M16 30h8"/></svg>`;
const browserToolbar = () => `<div class="blocking-browser-toolbar" aria-hidden="true"><span class="blocking-browser-back">${icon('arrow')}</span><span class="blocking-browser-forward">${icon('arrow')}</span>${icon('refresh')}<div class="blocking-address">${icon('lock')}<span>bilibili.com</span><span class="blocking-bookmark">☆</span></div><span class="blocking-browser-menu">⋮</span></div>`;

export function blockingPreview() {
  return `<section class="section blocking-section" id="blocking" aria-labelledby="blocking-title">
    <div class="section-inner blocking-inner">
      <header class="section-copy blocking-heading">
        <span class="section-kicker">网站与应用屏蔽</span>
        <h2 id="blocking-title">给分心的念头，<br/>留一道边界。</h2>
        <p>先选好需要暂时放下的网站与应用。专注期间，让容易分心的入口停在专属提示页。</p>
        <ul class="feature-checklist"><li>${icon('check')}按自己的需要管理屏蔽清单</li><li>${icon('check')}访问受限网站时显示专注提示</li><li>${icon('check')}保留当前专注状态与剩余时间</li></ul>
      </header>
      <div class="blocking-composition" role="group" aria-label="访问被屏蔽网站后，浏览器显示专属提示页">
        <div class="blocking-request"><span>${icon('globe')}bilibili.com</span><span>${icon('shield')}已在屏蔽清单中</span></div>
        <div class="blocking-browser blocking-browser-result" role="group" aria-label="步骤 2：bilibili.com 已被屏蔽，显示专注提示与倒计时">
          <div class="blocking-browser-tabs" aria-hidden="true">${trafficLights}<span class="blocking-browser-tab">${icon('shield')}<span></span><span>×</span></span><span class="blocking-new-tab">+</span></div>
          ${browserToolbar()}
          <div class="blocking-scene">
            <picture><source srcset="/assets/blocked_background.webp" type="image/webp"/><img class="blocking-landscape" src="/assets/blocked_background.png" alt="" width="1666" height="944" loading="lazy" decoding="async" draggable="false"/></picture>
            <div class="blocking-notice">
              <span class="blocking-product-brand"><img src="/assets/shiguang-logo.png" alt="" width="128" height="128"/><span>专注时光</span></span>
              <h3>此网站<span>已被屏蔽</span></h3>
              <p>为了减少干扰，专注时光已在专注期间限制访问此网站。</p>
              <div class="blocking-site-details">
                <div class="blocking-site-row"><span class="blocking-site-mark">${siteIcon()}</span><div class="blocking-site-domain"><strong>bilibili.com</strong><span>www.bilibili.com</span></div><span class="blocking-status"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="m5 5 10 10"/></svg>已屏蔽</span></div>
                <div class="blocking-countdown">${icon('clock')}<span>距离专注结束</span><strong data-blocking-time>04:36</strong></div>
              </div>
            </div>
          </div>
        </div><p class="section-footnote">访问受限网站时，显示专注时光的提示页。</p>
      </div>
    </div>
  </section>`;
}

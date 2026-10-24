import { icon } from './icons.js';

const trafficLights = '<span class="blocking-traffic-lights" aria-hidden="true"><i></i><i></i><i></i></span>';
const siteIcon = (className = '') => `<svg class="blocking-site-icon ${className}" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m13 5 4 6m10-6-4 6"/><rect x="7" y="12" width="26" height="22" rx="6"/><path d="M14 20v5m12-5v5M16 30h8"/></svg>`;
const browserToolbar = () => `<div class="blocking-browser-toolbar" aria-hidden="true"><span class="blocking-browser-back">${icon('arrow')}</span><span class="blocking-browser-forward">${icon('arrow')}</span>${icon('refresh')}<div class="blocking-address">${icon('lock')}<span>bilibili.com</span><span class="blocking-bookmark">☆</span></div><span class="blocking-browser-menu">⋮</span></div>`;

export function blockingPreview() {
  return `<section class="section blocking-section" id="blocking" aria-labelledby="blocking-title">
    <div class="blocking-inner">
      <header class="blocking-heading">
        <span class="blocking-brand-badge"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="#e6f1ff"/><circle cx="16" cy="12" r="5" fill="#6199fa"/><path d="M7 26c0-12 18-12 18 0" fill="#6199fa"/></svg><span>专注时光</span></span>
        <h2 id="blocking-title">专注期间，访问受限网站会被拦截</h2>
        <p>不会打开原网站，而是显示专注时光的专属提示页。</p>
      </header>
      <div class="blocking-composition" role="group" aria-label="访问被屏蔽网站后，浏览器显示专属提示页">
        <div class="blocking-step blocking-step-one"><span class="blocking-step-number">1</span><div><h3>输入被屏蔽的网站</h3><p>在浏览器中输入平时容易分散注意力的网站。</p></div></div>
        <div class="blocking-browser blocking-browser-input" role="group" aria-label="步骤 1：在浏览器中输入 bilibili.com">
          <div class="blocking-browser-tabs" aria-hidden="true">${trafficLights}<span class="blocking-browser-tab">${siteIcon()}<span>哔哩哔哩 (゜-゜)つロ</span><span>×</span></span><span class="blocking-new-tab">+</span></div>
          ${browserToolbar()}
          <div class="blocking-input-page" aria-hidden="true"><span class="blocking-bilibili-wordmark">bilibili</span><span>首页</span><span>番剧</span><span>直播</span><span>游戏中心</span><span>会员购</span><span>···</span><div class="blocking-input-placeholder"></div></div>
        </div>
        <svg class="blocking-flow-arrow" viewBox="0 0 120 110" fill="none" aria-hidden="true"><defs><linearGradient id="blocking-arrow-gradient" x1="4" y1="15" x2="105" y2="87" gradientUnits="userSpaceOnUse"><stop stop-color="#4374c2" stop-opacity=".15"/><stop offset=".45" stop-color="#84aeff"/><stop offset="1" stop-color="#97b9ff"/></linearGradient></defs><path d="M5 18C52-2 88 29 101 84m-16-9 18 13 8-21" stroke="url(#blocking-arrow-gradient)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="blocking-step blocking-step-two"><span class="blocking-step-number">2</span><div><h3>显示专属提示页</h3><p>浏览器不会打开原网站，而是显示专注时光的提示页面。</p></div></div>
        <div class="blocking-browser blocking-browser-result" role="group" aria-label="步骤 2：bilibili.com 已被屏蔽，显示专注提示与倒计时">
          <div class="blocking-browser-tabs" aria-hidden="true">${trafficLights}<span class="blocking-browser-tab">${icon('shield')}<span></span><span>×</span></span><span class="blocking-new-tab">+</span></div>
          ${browserToolbar()}
          <div class="blocking-scene">
            <img class="blocking-landscape" src="/assets/blocked_background.png" alt="" width="1666" height="944" loading="lazy" decoding="async" draggable="false"/>
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
        </div>
      </div>
    </div>
  </section>`;
}

import { icon } from './icons.js';

export function impactSection() {
  const benefits = [
    ['shield', 'shield', '屏蔽干扰', '远离分心的网站和应用，<br/>守住专注的空间。'],
    ['target', 'target', '完成目标', '把重要的事拆成一次次专注，<br/>慢慢推进。'],
    ['growth', 'chart', '记录成长', '用时间记录你的投入，<br/>看见持续积累的变化。'],
  ];
  return `<section class="section impact-section" id="impact" aria-labelledby="impact-title">
    <div class="impact-inner">
      <div class="impact-copy"><span class="impact-eyebrow">写给认真生活的人</span><h2 id="impact-title">让专注，<br/>带来<span>真实的改变</span>。</h2><p class="impact-description">专注，不只是屏蔽干扰，<br/>更是找回自己的节奏，把时间留给重要的事，<br/>过一种更有掌控感的生活。</p></div>
      <ul class="impact-benefits" aria-label="专注带来的改变">${benefits.map(([style, name, title, description]) => `<li class="impact-benefit" data-impact-feature="${style}"><span class="impact-icon impact-icon-${style}" aria-hidden="true">${icon(name)}</span><div><h3>${title}</h3><p>${description}</p></div></li>`).join('')}</ul>
    </div>
  </section>`;
}

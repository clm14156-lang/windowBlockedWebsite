import { icon } from './icons.js';

export function impactSection() {
  const benefits = [
    ['shield', 'shield', '屏蔽干扰', '远离分心的网站和应用，<br/>守住专注的空间。'],
    ['target', 'target', '完成目标', '把重要的事拆成一次次专注，<br/>慢慢推进。'],
    ['growth', 'chart', '记录成长', '用时间记录你的投入，<br/>看见持续积累的变化。'],
  ];
  return `<section class="section impact-section" id="impact" aria-labelledby="impact-title">
    <div class="impact-inner">
      <div class="impact-copy"><span class="section-kicker">写给认真生活的人</span><h2 id="impact-title">少一点分心，多一点自己的时间。</h2><p class="impact-description">把重要的事慢慢推进，让每一段投入都有迹可循。</p></div>
      <ul class="impact-benefits" aria-label="专注带来的改变">${benefits.map(([style, name, title, description]) => `<li class="impact-benefit" data-impact-feature="${style}"><span class="impact-icon impact-icon-${style}" aria-hidden="true">${icon(name)}</span><div><h3>${title}</h3><p>${description}</p></div></li>`).join('')}</ul>
    </div>
  </section>`;
}

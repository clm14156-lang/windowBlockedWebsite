import { icon } from './icons.js';

export function impactSection() {
  const benefits = [
    {
      id: 'time', icon: 'clock', title: '时间由自己安排',
      description: '把精力从无关紧要的事情中收回来，留给自己的生活。',
      image: '/assets/jaizhi01.png', width: 406, height: 246,
      alt: '男孩面对电脑，周围是短视频、游戏和视频等分心内容。',
      points: ['自动拦截分心网站和应用', '减少无意义的刷屏时间', '让时间真正掌握在自己手里'],
    },
    {
      id: 'progress', icon: 'sprout', title: '重要的事有进展',
      description: '不再只是想着开始，而是让想做的事真正向前推进。',
      image: '/assets/jiazhi02.png', width: 402, height: 246,
      alt: '男孩在书桌前学习，旁边是按学习、工作、阅读和健身分类的书本。',
      points: ['为学习、工作、生活保留专注时间', '减少干扰，提升专注效率', '让每一个计划都能看见进展'],
    },
    {
      id: 'balance', icon: 'chart', title: '每天都过得更踏实',
      description: '少一点虚度时间的懊悔，多一点对生活的掌控感。',
      image: '/assets/jiazhi03.png', width: 406, height: 246,
      alt: '男孩在窗边放松，旁边显示今日专注时长和投入趋势。',
      points: ['记录专注时长与趋势变化', '看到自己的努力和成长', '养成稳定、自律的生活节奏'],
    },
  ];
  return `<section class="section impact-section" id="impact" aria-labelledby="impact-title">
    <div class="impact-inner">
      <div class="impact-copy"><span class="section-kicker">把生活的节奏还给自己</span><h2 id="impact-title">别让每一天，<br/>都在<span>不知不觉中度过</span>。</h2><p class="impact-description">少一些被动消耗，多一些主动选择。</p></div>
      <ul class="impact-cards" aria-label="专注带来的改变">${benefits.map(benefit => `<li class="impact-card" data-impact-feature="${benefit.id}">
        <div class="impact-card-art"><img src="${benefit.image}" alt="${benefit.alt}" width="${benefit.width}" height="${benefit.height}" loading="lazy" decoding="async"/></div>
        <div class="impact-card-body">
          <div class="impact-card-summary"><span class="impact-card-icon" aria-hidden="true">${icon(benefit.icon)}</span><div><h3>${benefit.title}</h3><p>${benefit.description}</p></div></div>
          <ul class="impact-points" aria-label="${benefit.title}的价值要点">${benefit.points.map(point => `<li><span class="impact-point-check" aria-hidden="true">${icon('check')}</span><span>${point}</span></li>`).join('')}</ul>
        </div>
      </li>`).join('')}</ul>
      <div class="impact-outro"><h3>改变，不需要从完美的一天开始。</h3><p>从今天的一段专注开始，就很好。</p></div>
    </div>
  </section>`;
}

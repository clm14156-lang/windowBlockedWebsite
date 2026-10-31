import { icon } from './icons.js';

export const goalFeatures = [
  {
    title: '专注投入，一目了然', description: '查看累计投入、完成任务数与专注天数，回顾每个目标的日常积累。', icon: 'target', color: 'orange',
    image: '/assets/product/00a.png', width: 1448, height: 1086, layer: 'overview',
    alt: '目标主界面：按图标和颜色区分学习英语、学习绘画、健身减肥、阅读书籍与早睡早起，查看累计投入、完成任务数、专注天数和专注记录。',
  },
  {
    title: '任务管理，有条不紊', description: '通过任务与子任务整理待办事项，让每天的行动更加清晰。', icon: 'list', color: 'blue',
    image: '/assets/product/00b.png', width: 657, height: 508, layer: 'floating',
    alt: '悬浮专注窗口：21:36 专注倒计时、进度条，以及背诵英语单词、练习英语听力和跟读英语口语的当前任务清单。',
  },
  {
    title: '专注过程中，随时记录', description: '无需离开专注窗口，即可快速添加任务，记录临时想到的事情。', icon: 'pencil', color: 'green',
    image: '/assets/product/00c.png', width: 311, height: 178, layer: 'quick',
    alt: '快速创建任务弹窗：填写要做的事情，并选择取消或创建。',
  },
];

export function goalsPreview() {
  return `<section class="section goals-section" id="goals" aria-labelledby="goals-title">
    <div class="section-inner goals-layout">
      <div class="section-copy goals-heading">
        <span class="section-kicker">目标与任务</span>
        <h2 id="goals-title">让目标有方向，<br/>让<span>每一天都有进展。</span></h2>
        <p>将目标、任务与专注记录结合，让每一次投入都能积累为看得见的成果。</p>
        <ul class="goals-benefits" aria-label="目标与任务的功能特点">
          ${goalFeatures.map(feature => `<li class="goal-benefit">
            <span class="goal-benefit-icon ${feature.color}">${icon(feature.icon)}</span>
            <div><h3>${feature.title}</h3><p>${feature.description}</p></div>
          </li>`).join('')}
        </ul>
      </div>
      <div class="goals-product" role="group" aria-label="目标主界面、悬浮专注窗口与快速添加任务的组合预览">
        ${goalFeatures.map(feature => `<figure class="goals-preview-layer goals-${feature.layer}">
          ${feature.layer === 'quick' ? '<figcaption>快速添加任务</figcaption>' : ''}
          <img src="${feature.image}" alt="${feature.alt}" width="${feature.width}" height="${feature.height}" loading="lazy" decoding="async" draggable="false"/>
        </figure>`).join('')}
      </div>
    </div>
  </section>`;
}

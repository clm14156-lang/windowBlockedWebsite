import { icon } from './icons.js';

export const goalSteps = [
  {
    title: '创建目标', description: '为自己设定清晰的目标，用图标和颜色区分不同的方向。', icon: 'book',
    image: '/assets/product/00a.png', width: 1448, height: 1086, layer: 'overview',
    alt: '目标主界面：按图标和颜色区分学习英语、学习绘画、健身减肥、阅读书籍与早睡早起，查看累计投入、完成任务数、专注天数和专注记录。',
  },
  {
    title: '为目标添加任务', description: '在每个目标下添加任务，让计划更具体、更有条理。', icon: 'list',
    image: '/assets/product/00b.png', width: 657, height: 508, layer: 'floating',
    alt: '悬浮专注窗口：21:36 专注倒计时、进度条，以及背诵英语单词、练习英语听力和跟读英语口语的当前任务清单。',
  },
  {
    title: '专注中随时记录', description: '在专注过程中，随时查看当前任务，并快速创建新的任务，不必打断专注节奏。', icon: 'clock',
    image: '/assets/product/00c.png', width: 311, height: 178, layer: 'quick',
    alt: '快速创建任务弹窗：填写要做的事情，并选择取消或创建。',
  },
];

export function goalsPreview() {
  return `<section class="section goals-section" id="goals" aria-labelledby="goals-title">
    <div class="section-inner goals-layout">
      <div class="section-copy goals-heading">
        <span class="section-kicker">目标与任务</span>
        <h2 id="goals-title">让目标，落在<br/>每天的<span>行动里。</span></h2>
        <p>给计划一个清楚的方向，把下一步安排好。<br class="desktop-break"/>专注时冒出的想法，也有地方安放。</p>
        <div class="goals-tabs" role="tablist" aria-label="目标与任务的使用步骤" aria-orientation="vertical">
          ${goalSteps.map((step, i) => `<button type="button" role="tab" id="goal-tab-${i}" aria-controls="goal-panel-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-goal-tab="${i}" class="goal-tab${i === 0 ? ' is-active' : ''}">
            <span class="goal-step-number">0${i + 1}</span>
            <span class="goal-step-icon">${icon(step.icon)}</span>
            <span class="goal-step-copy"><strong>${step.title}</strong><small>${step.description}</small></span>
          </button>`).join('')}
        </div>
      </div>
      <div class="goals-product" role="group" aria-label="目标主界面、悬浮专注窗口与快速添加任务的组合预览">
        ${goalSteps.map((step, i) => `<figure class="goals-demo-panel goals-${step.layer}${i === 0 ? ' is-active' : ''}" role="tabpanel" id="goal-panel-${i}" aria-labelledby="goal-tab-${i}" aria-hidden="${i !== 0}"${i === 0 ? '' : ' inert'} data-goal-panel="${i}">
          ${step.layer === 'quick' ? '<figcaption>快速添加任务</figcaption>' : ''}
          <img src="${step.image}" alt="${step.alt}" width="${step.width}" height="${step.height}" loading="lazy" decoding="async" draggable="false"/>
        </figure>`).join('')}
      </div>
    </div>
  </section>`;
}

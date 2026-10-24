import { icon } from './icons.js';

const previewBrand = () => `<span class="goals-app-brand"><img src="/assets/favicon.svg" alt="" width="48" height="48"/><span>专注时光</span></span>`;
const windowControls = '<span class="goals-window-controls" aria-hidden="true"><i>−</i><i>□</i><i>×</i></span>';
const check = (done = false) => `<span class="goals-check${done ? ' is-done' : ''}" aria-hidden="true">${done ? icon('check') : ''}</span>`;
const taskRows = () => ['完成第一章的学习', '整理生词', '完成练习题'].map((text, i) => `<span class="goals-task-row${i === 0 ? ' is-complete' : ''}">${check(i === 0)}<span>${text}</span></span>`).join('');

function createGoalWindow() {
  return `<div class="goals-create-window" role="group" aria-label="创建新目标：填写名称与备注，选择图标和颜色"><div class="goals-create-content">
    <div class="goals-dialog-title"><strong>创建新目标</strong>${icon('close')}</div>
    <div class="goals-form-field"><span>请输入目标名称...</span><small>0/50</small></div>
    <div class="goals-form-field goals-note-field"><span>添加备注（可选）...</span><small>0/150</small></div>
    <span class="goals-form-label">图标</span><div class="goals-icon-options" aria-label="目标图标">${['chart', 'globe', 'pen', 'notebook', 'wrench', 'dumbbell'].map((name, i) => `<span class="${i === 0 ? 'is-selected' : ''}">${icon(name)}</span>`).join('')}<span>···</span></div>
    <span class="goals-form-label">颜色</span><div class="goals-color-options" aria-label="目标颜色">${['#101e38', '#ff5c63', '#ff9100', '#ffcf32', '#50c88d', '#398bff', '#9c52ff'].map((color, i) => `<i class="${i === 0 ? 'is-selected' : ''}" style="--goal-swatch:${color}"></i>`).join('')}</div>
    <div class="goals-dialog-actions" aria-hidden="true"><span>取消</span><span>创建</span></div>
  </div></div>`;
}

function managerWindow() {
  return `<div class="goals-manager-window" role="group" aria-label="我的目标：为英语学习、健身与工作目标安排任务"><div class="goals-manager-shell">
    <aside class="goals-manager-sidebar">${previewBrand()}<div>${[['home', '首页'], ['notebook', '目标'], ['clock', '专注'], ['chart', '统计'], ['settings', '设置']].map(([name, text]) => `<span class="${text === '目标' ? 'is-current' : ''}">${icon(name)}${text}</span>`).join('')}</div></aside>
    <div class="goals-manager-content"><div class="goals-manager-heading"><strong>我的目标</strong><span class="goals-create-action" aria-hidden="true">＋ 创建目标</span></div>
      <div class="goals-plan is-expanded"><div class="goals-plan-heading"><span class="goals-plan-icon">${icon('book')}</span><strong>完成英语第一章的学习</strong><small>2/5</small>${icon('chevron')}</div><div class="goals-plan-progress"><i></i></div><div class="goals-task-list">${taskRows()}<span class="goals-task-row goals-add-row">＋<span>添加任务</span></span></div></div>
      <div class="goals-plan"><div class="goals-plan-heading"><span class="goals-plan-icon">${icon('dumbbell')}</span><strong>坚持健身</strong><small>0/3</small>${icon('chevron')}</div></div>
      <div class="goals-plan"><div class="goals-plan-heading"><span class="goals-plan-icon">${icon('briefcase')}</span><strong>提升工作能力</strong><small>1/4</small>${icon('chevron')}</div><div class="goals-plan-progress short"><i></i></div></div>
    </div>
  </div></div>`;
}

function focusTaskWindow() {
  return `<div class="goals-focus-window" role="group" aria-label="专注中的当前任务：04:18 倒计时，已完成 1 项，共 3 项任务"><div class="goals-focus-shell">
    <div class="goals-day-scene"><picture><source srcset="/assets/goals-daylight.webp" type="image/webp"/><img class="goals-day-art" src="/assets/goals-daylight.png" alt="" width="1536" height="1024" loading="lazy" draggable="false"/></picture><div class="goals-focus-topbar">${previewBrand()}${windowControls}</div><div class="goals-morning">${icon('sun')}<div><strong>早上好</strong><span>今天的努力，能换来更好的自己。</span></div></div><div class="goals-focus-timer">04:18</div><span class="goals-current-goal">${icon('book')}完成英语第一章的学习</span><div class="goals-focus-toolbar" aria-hidden="true"><span>▪ 结束专注</span><i></i><span>${icon('list')}查看任务 (1)</span></div></div>
    <div class="goals-current-tasks">${windowControls}<strong>当前专注</strong><small>1/3 已完成</small><div class="goals-task-progress"><i></i></div>${taskRows()}<span class="goals-task-row goals-add-row">＋<span>添加新任务</span></span></div>
  </div></div><div class="goals-quick-task" role="group" aria-label="专注时可快速添加任务"><div class="goals-quick-content"><strong>快速添加任务</strong><span class="goals-quick-input">准备做什么？</span><div class="goals-quick-toolbar" aria-hidden="true"><span>${icon('notebook')}${icon('pen')}${icon('target')}${icon('briefcase')}<i>···</i></span><b>添加</b></div></div></div>`;
}

export function goalsPreview() {
  const steps = [
    { title: '创建目标', description: '为自己设定清晰的目标，<br/>用图标和颜色区分不同的方向。', screen: createGoalWindow() },
    { title: '为目标添加任务', description: '在每个目标下添加任务，<br/>让计划更具体、更有条理。', screen: managerWindow() },
    { title: '专注中随时记录', description: '在专注过程中，随时查看当前任务，<br/>并快速创建新的任务，不必打断专注节奏。', screen: focusTaskWindow() },
  ];
  return `<section class="section goals-section" id="goals" aria-labelledby="goals-title"><div class="section-inner goals-layout">
    <div class="section-copy goals-heading"><span class="section-kicker">目标与任务</span><h2 id="goals-title">让目标，落在<br/>每天的行动里。</h2><p>给计划一个清楚的方向，把下一步安排好。专注时冒出的想法，也有地方安放。</p><div class="goals-tabs" role="tablist" aria-label="目标与任务的使用步骤">${steps.map((step,i) => `<button type="button" role="tab" id="goal-tab-${i}" aria-controls="goal-panel-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-goal-tab="${i}" class="goal-tab${i === 0 ? ' is-active' : ''}"><span>0${i + 1}</span><span><strong>${step.title}</strong><small>${step.description.replaceAll('<br/>','')}</small></span></button>`).join('')}</div></div>
    <div class="goals-product">${steps.map((step,i) => `<div class="goals-demo-panel${i === 0 ? ' is-active' : ''}" role="tabpanel" id="goal-panel-${i}" aria-labelledby="goal-tab-${i}" aria-hidden="${i !== 0}"${i === 0 ? '' : ' inert'} data-goal-panel="${i}">${step.screen}</div>`).join('')}<span class="goals-preview-caption">目标与任务 · 软件界面预览</span></div>
  </div></section>`;
}

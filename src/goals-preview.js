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
    <div class="goals-day-scene"><img class="goals-day-art" src="/assets/goals-daylight.png" alt="" width="1536" height="1024" loading="lazy" draggable="false"/><div class="goals-focus-topbar">${previewBrand()}${windowControls}</div><div class="goals-morning">${icon('sun')}<div><strong>早上好</strong><span>今天的努力，能换来更好的自己。</span></div></div><div class="goals-focus-timer">04:18</div><span class="goals-current-goal">${icon('book')}完成英语第一章的学习</span><div class="goals-focus-toolbar" aria-hidden="true"><span>▪ 结束专注</span><i></i><span>${icon('list')}查看任务 (1)</span></div></div>
    <div class="goals-current-tasks">${windowControls}<strong>当前专注</strong><small>1/3 已完成</small><div class="goals-task-progress"><i></i></div>${taskRows()}<span class="goals-task-row goals-add-row">＋<span>添加新任务</span></span></div>
  </div></div><div class="goals-quick-task" role="group" aria-label="专注时可快速添加任务"><div class="goals-quick-content"><strong>快速添加任务</strong><span class="goals-quick-input">准备做什么？</span><div class="goals-quick-toolbar" aria-hidden="true"><span>${icon('notebook')}${icon('pen')}${icon('target')}${icon('briefcase')}<i>···</i></span><b>添加</b></div></div></div>`;
}

export function goalsPreview() {
  const steps = [
    { title: '创建目标', description: '为自己设定清晰的目标，<br/>用图标和颜色区分不同的方向。', screen: createGoalWindow() },
    { title: '为目标添加任务', description: '在每个目标下添加任务，<br/>让计划更具体、更有条理。', screen: managerWindow() },
    { title: '专注中随时记录', description: '在专注过程中，随时查看当前任务，<br/>并快速创建新的任务，不必打断专注节奏。', screen: focusTaskWindow() },
  ];
  return `<section class="section goals-section" id="goals" aria-labelledby="goals-title"><div class="goals-inner">
    <header class="goals-heading"><span class="goals-eyebrow">目标与任务</span><h2 id="goals-title">目标有序，<span>任务</span>随时跟进</h2><p>从创建目标到专注执行，把要做的事安排清楚，也能随时记录新的任务。</p></header>
    <div class="goals-layout"><svg class="goals-connectors" viewBox="0 0 1560 650" fill="none" preserveAspectRatio="none" aria-hidden="true"><path d="M318 152C502 140 393 256 485 212S620 284 498 402 451 556 322 565M932 200C1033 243 990 328 1078 335" stroke="#8faed1" stroke-width="1.3" stroke-dasharray="5 5"/><circle cx="485" cy="212" r="2.5" fill="#ffab35"/><circle cx="932" cy="200" r="2" fill="#ffab35"/></svg>${steps.map((step, index) => `<article class="goals-step-card goals-step-${index + 1}" data-goals-step="${index + 1}" aria-labelledby="goals-step-title-${index + 1}"><header class="goals-step-heading"><span class="goals-step-number">0${index + 1}</span><div><h3 id="goals-step-title-${index + 1}">${step.title}</h3><p>${step.description}</p></div></header>${step.screen}</article>`).join('')}</div>
  </div></section>`;
}

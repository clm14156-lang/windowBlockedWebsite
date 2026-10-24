export const heroDuration = 293;

// One state drives both clock displays and the remaining-time ring.
export function initHeroTimer(root, state, icon) {
  if (!root) return null;
  const clocks = [...root.querySelectorAll('[data-hero-time]')];
  const control = root.querySelector('[data-hero-toggle]');
  const preview = root.querySelector('.hero-mini');

  function render() {
    const label = `${String(Math.floor(state.heroTime / 60)).padStart(2, '0')}:${String(state.heroTime % 60).padStart(2, '0')}`;
    clocks.forEach(clock => { clock.textContent = label; });
    root.style.setProperty('--hero-progress', `${Math.max(0, Math.min(1, state.heroTime / heroDuration)) * 100}%`);
    root.dataset.running = String(state.heroRunning);
    control.setAttribute('aria-pressed', String(state.heroRunning));
    control.innerHTML = `${icon(state.heroRunning ? 'stop' : 'play', state.heroRunning ? 'focus-stop-icon' : '')}<span>${state.heroRunning ? '结束专注' : state.heroTime === 0 ? '重新开始' : '开始专注'}</span>`;
    preview.setAttribute('aria-label', `体验悬浮专注计时器，剩余 ${label}${state.heroRunning ? '' : '，已停止'}`);
  }

  render();
  return {
    toggle() {
      state.heroRunning = !state.heroRunning;
      if (state.heroTime <= 0) state.heroTime = heroDuration;
      render();
    },
    tick() {
      if (!state.heroRunning || state.heroTime <= 0) return;
      state.heroTime--;
      if (state.heroTime === 0) state.heroRunning = false;
      render();
    },
  };
}

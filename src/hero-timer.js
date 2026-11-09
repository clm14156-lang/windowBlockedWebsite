export const heroDuration = 293;

// The software scene is static; only its main countdown changes.
export function initHeroTimer(root, state) {
  if (!root) return null;
  const clocks = [...root.querySelectorAll('[data-hero-time]')];

  function render() {
    const label = `${String(Math.floor(state.heroTime / 60)).padStart(2, '0')}:${String(state.heroTime % 60).padStart(2, '0')}`;
    clocks.forEach(clock => { clock.textContent = label; });
    root.style.setProperty('--hero-progress', `${Math.max(0, Math.min(1, state.heroTime / heroDuration)) * 100}%`);
    root.dataset.running = String(state.heroRunning);
  }

  render();
  return {
    tick() {
      if (!state.heroRunning || state.heroTime <= 0) return;
      state.heroTime--;
      if (state.heroTime === 0) state.heroRunning = false;
      render();
    },
  };
}

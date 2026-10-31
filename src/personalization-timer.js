export const personalizationDuration = 25 * 60;

// The app's existing ticker drives rendering. Elapsed time survives throttled ticks,
// visibility changes and theme/character selections without sharing download state.
export function initPersonalizationTimer(root, { now = () => performance.now() } = {}) {
  const clock = root?.querySelector('[data-personalization-time]');
  const progress = root?.querySelector('[data-personalization-progress]');
  if (!clock || !progress) return null;
  const startedAt = now();
  let remaining = personalizationDuration;

  function tick() {
    const elapsed = Math.max(0, now() - startedAt);
    remaining = Math.max(0, Math.min(remaining, Math.ceil(personalizationDuration - elapsed / 1000)));
    const label = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
    clock.textContent = label;
    root.style.setProperty('--personalization-progress', String(remaining / personalizationDuration));
    progress.setAttribute('aria-valuenow', String(remaining));
    progress.setAttribute('aria-valuetext', label);
  }

  tick();
  return { tick, getRemaining: () => remaining };
}

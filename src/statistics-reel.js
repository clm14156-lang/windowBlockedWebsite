// Repeated edge cards let the track wrap without crossing the center card.
export function initStatisticsReel(root, motion) {
  const track = root.querySelector('[data-stat-track]');
  const showcase = root.querySelector('.statistics-showcase');
  if (!track || !showcase) return null;
  const items = [...track.querySelectorAll('[data-stat-item]')];
  const count = root.querySelectorAll('[data-stat-slide]').length;
  let current = 0, slot = 0, complete, fallback;
  let settled = Promise.resolve();

  function activate(index) {
    items.forEach(item => { item.dataset.statActive = String(Number(item.dataset.statItem) === index); });
  }
  function snap(index) {
    track.classList.toggle('is-repositioning', true);
    slot = index;
    track.style.setProperty('--stat-offset', String(-slot));
    activate(index);
    track.getBoundingClientRect(); // Commit the identical edge copy before restoring motion.
    track.classList.toggle('is-repositioning', false);
  }
  function finish() {
    if (!complete) return;
    window.clearTimeout(fallback);
    if (slot !== current) snap(current);
    const resolve = complete;
    complete = null;
    resolve();
  }
  function measure() {
    const width = showcase.getBoundingClientRect().width;
    if (!width) return;
    finish();
    const viewport = document.documentElement.clientWidth;
    const gap = viewport <= 760 ? 10 : 24;
    const gutter = viewport <= 760 ? 0 : 40;
    const sideWidth = Math.min(width * .82, Math.max(96, (viewport - width - gap * 2 - gutter * 2) / 2));
    showcase.style.setProperty('--stat-card-width', `${width}px`);
    showcase.style.setProperty('--stat-side-scale', String(sideWidth / width));
    showcase.style.setProperty('--stat-step', `${(width + sideWidth) / 2 + gap}px`);
    showcase.style.setProperty('--stat-view-width', `${Math.min(viewport, width + sideWidth * 2 + gap * 2 + 48)}px`);
    snap(current);
  }
  function moveTo(index, direction = 0) {
    if (index === current) return;
    const forward = (index - current + count) % count;
    const delta = direction > 0 ? forward : direction < 0 ? forward - count : forward > count / 2 ? forward - count : forward;
    current = index;
    if (motion.matches) { snap(index); return; }
    settled = new Promise(resolve => { complete = resolve; });
    slot += delta;
    activate(index);
    track.style.setProperty('--stat-offset', String(-slot));
    fallback = window.setTimeout(finish, 520);
  }
  track.addEventListener('transitionend', event => {
    if (event.target === track && event.propertyName === 'transform') finish();
  });
  window.addEventListener('resize', measure, { passive: true });
  if ('ResizeObserver' in window) new window.ResizeObserver(measure).observe(showcase);
  motion.addEventListener('change', () => { if (motion.matches) finish(); });
  measure();
  return { moveTo, whenSettled: () => settled };
}

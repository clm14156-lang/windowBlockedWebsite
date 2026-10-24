import { statisticsSlides } from './statistics-slides.js';

export function initStatisticsCarousel(root) {
  const slides = [...root.querySelectorAll('[data-stat-slide]')];
  const copies = [...root.querySelectorAll('[data-stat-copy]')];
  const selectors = [...root.querySelectorAll('[data-stat-select]')];
  const rotationButton = root.querySelector('[data-stat-rotation]');
  const status = root.querySelector('[data-stat-status]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let timer;
  let inView = false;
  let hovered = false;
  let focused = root.contains(document.activeElement);
  let playing = !motion.matches;

  function schedule() {
    window.clearTimeout(timer);
    if (!playing || !inView || hovered || focused || document.hidden || motion.matches) return;
    timer = window.setTimeout(() => select(current + 1, false), 4500);
  }

  function select(index, announce = true) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const position = i === current ? 'current' : i === (current + 1) % slides.length ? 'next' : 'previous';
      slide.dataset.position = position;
      slide.setAttribute('aria-hidden', String(i !== current));
      slide.inert = i !== current;
      copies[i].classList.toggle('is-active', i === current);
      copies[i].setAttribute('aria-hidden', String(i !== current));
      copies[i].inert = i !== current;
    });
    selectors.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.statSelect) === current)));
    status.setAttribute('aria-live', announce ? 'polite' : 'off');
    status.textContent = `第 ${current + 1} 页，共 ${slides.length} 页：${statisticsSlides[current].label}`;
    schedule();
  }

  function updateRotation() {
    rotationButton.setAttribute('aria-pressed', String(playing));
    rotationButton.setAttribute('aria-label', playing ? '暂停自动轮播' : '开启自动轮播');
    rotationButton.disabled = motion.matches;
    schedule();
  }

  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.matches('[data-stat-select]')) select(Number(button.dataset.statSelect));
    else if (button.matches('[data-stat-direction]')) select(current + Number(button.dataset.statDirection));
    else if (button === rotationButton) { playing = !playing; updateRotation(); }
  });
  root.addEventListener('keydown', event => {
    if (!event.target.closest('[data-stat-select], .statistics-navigation') || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    select(event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : current + (event.key === 'ArrowRight' ? 1 : -1));
    if (event.target.matches('[data-stat-select]')) {
      const group = event.target.closest('[data-stat-selector-group]');
      group.querySelector(`[data-stat-select="${current}"]`).focus({ preventScroll: true });
    }
  });
  root.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; schedule(); } });
  root.addEventListener('pointerleave', () => { hovered = false; schedule(); });
  root.addEventListener('focusin', () => { focused = true; schedule(); });
  root.addEventListener('focusout', event => { focused = root.contains(event.relatedTarget); schedule(); });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => { playing = !motion.matches; updateRotation(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].intersectionRatio >= .25;
      schedule();
    }, { threshold: .25 }).observe(root);
  }
  select(0, false);
  updateRotation();
}

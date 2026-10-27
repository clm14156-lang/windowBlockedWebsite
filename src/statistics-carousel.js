import { statisticsSlides } from './statistics-slides.js';
import { initStatisticsReel } from './statistics-reel.js';

export function initStatisticsCarousel(root) {
  if (!root) return null;
  const slides = [...root.querySelectorAll('[data-stat-slide]')];
  const copies = [...root.querySelectorAll('[data-stat-copy]')];
  const selectors = [...root.querySelectorAll('[data-stat-select]')];
  const rotationButton = root.querySelector('[data-stat-rotation]');
  const status = root.querySelector('[data-stat-status]');
  if (slides.length !== statisticsSlides.length || copies.length !== slides.length || !rotationButton || !status) return null;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reel = initStatisticsReel(root, motion);
  let current = 0, requested = 0, request = 0;
  let timer;
  let inView = false, hovered = false, loading = false;
  let focused = root.contains(document.activeElement);
  let playing = false;

  function schedule() {
    window.clearTimeout(timer);
    if (!playing || !inView || hovered || focused || loading || document.hidden || motion.matches) return;
    timer = window.setTimeout(() => { void select(current + 1, false, 1); }, 4500);
  }
  function render(index, announce, direction = 0) {
    reel?.moveTo(index, direction);
    current = index;
    slides.forEach((slide, i) => {
      slide.dataset.position = i === current ? 'current' : i === (current + 1) % slides.length ? 'next' : 'previous';
      slide.setAttribute('aria-hidden', String(i !== current));
      slide.inert = i !== current;
      copies[i].classList.toggle('is-active', i === current);
      copies[i].setAttribute('aria-hidden', String(i !== current));
      copies[i].inert = i !== current;
    });
    selectors.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.statSelect) === current)));
    status.classList.toggle('is-error', false);
    status.setAttribute('aria-live', announce ? 'polite' : 'off');
    status.textContent = `第 ${current + 1} 页，共 ${slides.length} 页：${statisticsSlides[current].label}`;
    schedule();
  }
  async function select(index, announce = true, direction = 0) {
    if (!Number.isInteger(index)) return false;
    const next = ((index % slides.length) + slides.length) % slides.length;
    const ticket = ++request;
    requested = next;
    window.clearTimeout(timer);
    if (next === current) {
      loading = false; root.setAttribute('aria-busy', 'false'); render(current, announce);
      return true;
    }
    loading = true;
    root.setAttribute('aria-busy', 'true');
    try {
      await Promise.all([reel?.whenSettled(), ...[...slides[next].querySelectorAll('img')].map(async image => {
        if (image.decode) await image.decode();
        else if (!image.complete) await new Promise((resolve, reject) => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', reject, { once: true });
        });
        if (!image.naturalWidth) throw new Error('Statistics screenshot did not load');
      })]);
      if (ticket !== request) return false;
      loading = false;
      render(next, announce, direction);
      return true;
    } catch {
      if (ticket === request) {
        requested = current; playing = false;
        status.classList.toggle('is-error', true);
        status.setAttribute('aria-live', 'polite');
        status.textContent = '该统计界面暂未加载成功，请重试。';
        updateRotation();
      }
      return false;
    } finally {
      if (ticket === request) { loading = false; root.setAttribute('aria-busy', 'false'); }
    }
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
    if (button.matches('[data-stat-select]')) void select(Number(button.dataset.statSelect));
    else if (button.matches('[data-stat-direction]')) void select(requested + Number(button.dataset.statDirection), true, Number(button.dataset.statDirection));
    else if (button === rotationButton && !motion.matches) { playing = !playing; updateRotation(); }
  });
  root.addEventListener('keydown', async event => {
    if (!event.target.closest('[data-stat-select], .statistics-navigation') || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : requested + (event.key === 'ArrowRight' ? 1 : -1);
    const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (await select(next, true, direction) && event.target.matches('[data-stat-select]')) {
      const group = event.target.closest('[data-stat-selector-group]');
      group?.querySelector(`[data-stat-select="${current}"]`)?.focus({ preventScroll: true });
    }
  });
  root.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; schedule(); } });
  root.addEventListener('pointerleave', () => { hovered = false; schedule(); });
  root.addEventListener('focusin', () => { focused = true; schedule(); });
  root.addEventListener('focusout', event => { focused = root.contains(event.relatedTarget); schedule(); });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => { if (motion.matches) playing = false; updateRotation(); });
  if ('IntersectionObserver' in window) {
    new window.IntersectionObserver(entries => {
      inView = entries[0].intersectionRatio >= .25;
      schedule();
    }, { threshold: .25 }).observe(root);
  }
  render(0, false);
  updateRotation();
  return { select, getState: () => ({ current, playing }) };
}

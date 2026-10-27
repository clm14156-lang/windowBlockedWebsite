import { scrollProgress } from './floating-demo.js';

const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const p = clamp(value); return p * p * (3 - 2 * p); };

export function heroPresentationFrame(progress, reducedMotion = false) {
  const p = clamp(progress), travel = smooth(p);
  const blend = smooth((p - .15) / .7);
  const heightTravel = Math.sin(travel * Math.PI / 2);
  return {
    state: p === 0 ? 'home' : p === 1 ? 'focus' : 'transitioning',
    tilt: reducedMotion ? 0 : 26 * (1 - travel),
    scale: reducedMotion ? 1 : .98 + .02 * travel,
    ratio: reducedMotion ? 1.5 : 1 / ((756 / 867) * (1 - heightTravel) + (2 / 3) * heightTravel),
    blend,
    interactive: blend >= .5,
  };
}

export function initHeroPresentation(section) {
  if (!section) return null;
  const track = section.querySelector('[data-hero-scroll-track]');
  const stage = section.querySelector('[data-hero-scroll-stage]');
  const viewport = section.querySelector('[data-hero-presentation]');
  const opening = section.querySelector('[data-hero-start-view]');
  const focus = section.querySelector('[data-hero-focus-view]');
  const controls = section.querySelector('[data-hero-focus-controls]');
  const status = section.querySelector('[data-hero-presentation-status]');
  if (!track || !stage || !viewport || !opening || !focus || !controls) return null;
  const image = opening.querySelector('img');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let start = 0, distance = 1, pendingFrame = 0, imageFailed = false;
  let lastState, lastFrameKey;

  function render() {
    pendingFrame = 0;
    const progress = imageFailed ? 1 : scrollProgress(window.scrollY, start, distance);
    const frameKey = `${progress}/${motion.matches}/${imageFailed}`;
    if (frameKey === lastFrameKey) return;
    lastFrameKey = frameKey;
    const frame = heroPresentationFrame(progress, motion.matches);
    viewport.style.setProperty('--hero-plane-tilt', `${frame.tilt}deg`);
    viewport.style.setProperty('--hero-plane-scale', String(frame.scale));
    viewport.style.setProperty('--hero-plane-ratio', String(frame.ratio));
    viewport.style.setProperty('--hero-start-opacity', String(1 - frame.blend));
    viewport.style.setProperty('--hero-focus-opacity', String(frame.blend));
    stage.style.setProperty('--hero-focus-opacity', String(frame.blend));
    viewport.dataset.presentationState = frame.state;
    opening.style.visibility = frame.blend === 1 ? 'hidden' : 'visible';
    focus.style.visibility = controls.style.visibility = frame.blend === 0 ? 'hidden' : 'visible';
    opening.setAttribute('aria-hidden', String(frame.interactive));
    for (const element of [focus, controls]) {
      element.inert = !frame.interactive;
      element.setAttribute('aria-hidden', String(!frame.interactive));
    }
    if (status && frame.state !== lastState) {
      if (imageFailed) status.textContent = '软件首页图片暂未加载，已显示专注倒计时。';
      else if (frame.state !== 'transitioning') status.textContent = frame.state === 'home' ? '软件首页预览，向下滚动显示专注倒计时。' : '专注倒计时界面，支持结束任务和白天、夜晚切换。';
      lastState = frame.state;
    }
  }
  function schedule() {
    if (!pendingFrame) pendingFrame = window.requestAnimationFrame(render);
  }
  function measure() {
    start = window.scrollY + section.getBoundingClientRect().top;
    distance = Math.max(1, parseFloat(window.getComputedStyle(track).paddingBottom) || 360);
    schedule();
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('pageshow', measure);
  motion.addEventListener('change', schedule);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) measure(); });
  if ('ResizeObserver' in window) {
    const observer = new window.ResizeObserver(measure);
    observer.observe(track); observer.observe(stage);
  }
  image?.addEventListener('error', () => { imageFailed = true; lastState = undefined; schedule(); });
  if (image?.complete && !image.naturalWidth) imageFailed = true;
  measure();
  return { refresh: measure };
}

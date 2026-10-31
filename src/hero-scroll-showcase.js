const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const mix = (from, to, amount) => from + (to - from) * amount;
const FLOAT_RATIO = 1420 / 1108;
// The original PNG's opaque window ends at y=1303; the remaining rows are
// transparent padding/shadow. Align that visible edge, not the image canvas.
const FLOAT_WINDOW_BOTTOM = 1303 / 1108;

// The timeline uses the section's existing travel through the viewport, not a pin/spacer.
export function heroShowcaseGeometry(width, viewportHeight, actionsHeight, gap, benefitsHeight, navHeight = 76) {
  const naturalHeight = width * 756 / 867;
  const top = navHeight + 12;
  const tail = width * .008;
  const fittingScale = (viewportHeight - top - 16 - actionsHeight - gap * 2 - benefitsHeight - tail) / naturalHeight;
  const scale = clamp(fittingScale, .64, .84);
  const mainWidth = width * scale;
  const mainHeight = naturalHeight * scale;
  const floatingWidth = Math.max(mainWidth * .44, width * .32);
  const floatingY = mainHeight - floatingWidth * FLOAT_WINDOW_BOTTOM;
  const floatingX = Math.min(mainWidth - floatingWidth * .52, width - floatingWidth);
  const distance = clamp(width * .4, 280, 440);
  return {
    width, naturalHeight, scale, top, distance, gap, benefitsHeight,
    // Roughly half the floating window sits over the software's right edge.
    // Keep the full PNG inside the stage on narrow or tall viewports.
    floatingWidth, floatingX, floatingY,
    // The stage always has at least a 24px viewport gutter. Limit the right-side
    // entrance to that available space so it cannot create horizontal scrolling.
    floatingTravel: Math.min(clamp(floatingWidth * .32, 48, 128), width + 24 - floatingX - floatingWidth),
  };
}

export function heroShowcaseRange(stageTop, geometry) {
  // Finish while the software's top is still below the navigation. Its document
  // position is unchanged by the animation, so resizing the content below it
  // cannot feed back into the progress calculation.
  const end = Math.max(1, stageTop - geometry.top);
  const start = Math.max(0, end - geometry.distance);
  return { start, end, distance: end - start };
}

export function heroShowcaseFrame(progress, geometry) {
  const p = clamp(progress);
  const angle = mix(10, 0, p);
  const scale = mix(.98, geometry.scale, p);
  const radians = angle * Math.PI / 180;
  const projectedHeight = geometry.naturalHeight * scale * Math.cos(radians) / (1 - geometry.naturalHeight * scale * Math.sin(radians) / 2400);
  const floatingY = projectedHeight - geometry.floatingWidth * FLOAT_WINDOW_BOTTOM;
  const visibleHeight = Math.max(projectedHeight, floatingY + geometry.floatingWidth * FLOAT_RATIO);
  const benefitsOffset = 20 * (1 - p);
  // Ease the entrance along the existing scroll timeline; stopping or reversing
  // scroll still stops or reverses the window immediately, with no timed playback.
  const entrance = 1 - (1 - p) ** 3;
  return {
    angle, scale, x: mix(geometry.width * .01, 0, p),
    visibleHeight,
    stageHeight: visibleHeight + geometry.gap + benefitsOffset + geometry.benefitsHeight,
    floatingOpacity: entrance, floatingX: geometry.floatingX + geometry.floatingTravel * (1 - entrance), floatingY,
    benefitsOpacity: p, benefitsOffset,
  };
}

export function initHeroScrollShowcase(root) {
  if (!root) return null;
  const stage = root.querySelector('[data-hero-stage]');
  const actions = root.querySelector('.hero-actions');
  const main = root.querySelector('[data-hero-main]');
  const floating = root.querySelector('[data-hero-floating]');
  const benefits = root.querySelector('[data-hero-benefits]');
  if (!stage || !actions || !main || !floating || !benefits) return null;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let geometry, range, queued = 0, lastProgress = -1, lastReady = false;
  let mediaReady = floating.complete && floating.naturalWidth > 0;
  let destroyed = false;
  const property = (name, value) => root.style.setProperty(`--hero-${name}`, value);

  function render() {
    queued = 0;
    if (!geometry || destroyed) return;
    const progress = motion.matches ? 1 : clamp((scrollY - range.start) / range.distance);
    if (progress === lastProgress && mediaReady === lastReady) return;
    lastProgress = progress; lastReady = mediaReady;
    const frame = heroShowcaseFrame(progress, geometry);
    property('main-angle', `${frame.angle}deg`);
    property('main-scale', String(frame.scale));
    property('main-x', `${frame.x}px`);
    property('visible-height', `${frame.visibleHeight}px`);
    // Size the natural-flow stage to its visible contents. There is no empty
    // scroll runway to cross after the composition has finished shrinking.
    property('stage-height', `${frame.stageHeight}px`);
    property('floating-x', `${frame.floatingX}px`);
    property('floating-y', `${frame.floatingY}px`);
    property('floating-opacity', String(mediaReady ? frame.floatingOpacity : 0));
    property('benefits-opacity', String(frame.benefitsOpacity));
    property('benefits-offset', `${frame.benefitsOffset}px`);
    const showFloating = mediaReady && frame.floatingOpacity > .001;
    // Decoding only gates image paint; it never gates input or timeline progress.
    floating.style.visibility = mediaReady ? 'visible' : 'hidden';
    floating.setAttribute('aria-hidden', String(!showFloating));
    benefits.style.visibility = frame.benefitsOpacity > .001 ? 'visible' : 'hidden';
    benefits.setAttribute('aria-hidden', String(frame.benefitsOpacity <= .001));
    root.dataset.heroAnimating = String(!motion.matches && progress > 0 && progress < 1);
  }

  function schedule() { if (!queued && !destroyed) queued = requestAnimationFrame(render); }
  function measure() {
    if (destroyed || !stage.clientWidth) return;
    if (queued) { cancelAnimationFrame(queued); queued = 0; }
    const gap = parseFloat(getComputedStyle(stage).marginTop) || 24;
    const navHeight = document.getElementById('site-header')?.offsetHeight || 76;
    geometry = heroShowcaseGeometry(stage.clientWidth, innerHeight, actions.offsetHeight, gap, benefits.offsetHeight, navHeight);
    range = heroShowcaseRange(scrollY + stage.getBoundingClientRect().top, geometry);
    property('floating-width', `${geometry.floatingWidth}px`);
    root.dataset.heroScrollReady = 'true';
    root.dataset.heroReducedMotion = String(motion.matches);
    lastProgress = -1;
    render();
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('pageshow', measure);
  motion.addEventListener('change', measure);
  const observer = new ResizeObserver(measure);
  // Observe the untransformed image wrapper instead of the animated stage's
  // height: scroll-driven sizing must not trigger a measure/render feedback loop.
  for (const element of [main.parentElement, actions, benefits]) observer.observe(element);
  measure();
  Promise.resolve().then(() => floating.decode?.()).then(() => {
    if (destroyed) return;
    mediaReady = floating.naturalWidth > 0;
    schedule();
  }).catch(() => {
    if (destroyed) return;
    const status = root.querySelector('[data-hero-showcase-status]');
    if (status) status.textContent = '悬浮窗口预览暂未加载成功，请刷新页面重试。';
  });
  return {
    refresh: measure,
    destroy() {
      destroyed = true;
      if (queued) cancelAnimationFrame(queued);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      window.removeEventListener('pageshow', measure);
      motion.removeEventListener('change', measure);
      observer.disconnect();
    },
  };
}

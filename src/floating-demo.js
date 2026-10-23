const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const mix = (from, to, amount) => from + (to - from) * amount;
const smooth = amount => { const value = clamp(amount); return value * value * (3 - 2 * value); };

export function scrollProgress(scrollTop, start, distance) {
  return distance > 0 ? clamp((scrollTop - start) / distance) : 0;
}

// The same desktop-local geometry is used at every viewport size.
export function desktopGeometry(width, height, fullWidth, fullHeight, timerWidth, timerHeight) {
  const inset = Math.max(4, width * .018);
  return {
    width, height, fullWidth, fullHeight, timerWidth, timerHeight, inset,
    center: { x: (width - fullWidth) / 2, y: Math.max(inset, (height * .91 - fullHeight) / 2) },
    corner: { x: width - inset - timerWidth, y: inset },
  };
}

export function floatingFrame(progress, geometry, reducedMotion = false) {
  // Hold the full window first, then the folded result; reverse the same path on upward scroll.
  const amount = clamp((progress - .14) / .72);
  const travel = reducedMotion ? Number(amount >= .5) : smooth(amount);
  const blend = reducedMotion ? travel : smooth((amount - .62) / .32);
  const scale = geometry.timerWidth / geometry.fullWidth;
  return {
    state: travel === 0 ? 'expanded' : travel === 1 ? 'collapsed' : 'transitioning',
    full: {
      x: mix(geometry.center.x, geometry.corner.x, travel),
      y: mix(geometry.center.y, geometry.corner.y, travel),
      scale: mix(1, scale, travel),
      opacity: 1 - blend,
    },
    timer: { ...geometry.corner, scale: mix(.88, 1, blend), opacity: blend },
  };
}

export function initFloatingDemo(section) {
  const track = section.querySelector('[data-floating-track]');
  const stage = track.querySelector('.floating-sticky');
  const canvas = track.querySelector('[data-floating-desktop]');
  const mover = canvas.querySelector('.floating-mover');
  const full = canvas.querySelector('.floating-focus');
  const timer = canvas.querySelector('[data-floating-timer]');
  const status = section.querySelector('[data-floating-status]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let geometry, distance, stickyTop, pendingFrame = 0, visible = false;
  let announcedState = '', seconds = 14 * 60 + 47;

  function measure() {
    geometry = desktopGeometry(canvas.clientWidth, canvas.clientHeight, mover.offsetWidth, full.offsetHeight, timer.offsetWidth, timer.offsetHeight);
    stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
    distance = track.offsetHeight - stage.offsetHeight;
  }

  function render() {
    pendingFrame = 0;
    if (!geometry?.width) return;
    const start = scrollY + track.getBoundingClientRect().top - stickyTop;
    const progress = scrollProgress(scrollY, start, distance);
    const frame = floatingFrame(progress, geometry, motion.matches);
    mover.style.transform = `translate3d(${frame.full.x}px,${frame.full.y}px,0) scale(${frame.full.scale})`;
    mover.style.opacity = String(frame.full.opacity);
    mover.style.visibility = frame.full.opacity === 0 ? 'hidden' : 'visible';
    timer.style.transform = `translate3d(${frame.timer.x}px,${frame.timer.y}px,0) scale(${frame.timer.scale})`;
    timer.style.opacity = String(frame.timer.opacity);
    timer.style.visibility = frame.timer.opacity === 0 ? 'hidden' : 'visible';
    full.setAttribute('aria-hidden', String(frame.full.opacity < .5));
    timer.setAttribute('aria-hidden', String(frame.timer.opacity < .5));
    canvas.dataset.state = section.dataset.floatingState = frame.state;
    section.style.setProperty('--floating-progress', String(progress));
    if (frame.state !== announcedState) {
      announcedState = frame.state;
      status.textContent = {
        expanded: '完整专注窗口。向下滚动可查看悬浮状态。',
        transitioning: '正在随滚动切换完整窗口与轻巧悬浮窗。',
        collapsed: '窗口已收起，计时条停在桌面右上角。向上滚动可恢复完整窗口。',
      }[frame.state];
    }
  }

  function schedule() {
    if (!pendingFrame) pendingFrame = requestAnimationFrame(render);
  }
  function resize() { measure(); schedule(); }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pageshow', resize);
  motion.addEventListener('change', schedule);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) resize(); });
  const resizeObserver = new ResizeObserver(resize);
  for (const element of [canvas, full, stage, track]) resizeObserver.observe(element);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, { threshold: 0 }).observe(canvas);

  // Both representations share a clock; there is no autoplay or click/drag state machine.
  setInterval(() => {
    if (!visible || document.hidden || seconds <= 0) return;
    seconds--;
    const label = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    section.querySelectorAll('[data-floating-time]').forEach(clock => { clock.textContent = label; });
  }, 1000);
  measure(); render();
}

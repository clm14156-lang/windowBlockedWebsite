const clamp = value => Math.max(0, Math.min(1, value));

export function settingScrollState(scrollTop, start, distance, count = 3) {
  const progress = distance > 0 ? clamp((scrollTop - start) / distance) : 0;
  return { progress, index: Math.min(count - 1, Math.floor(progress * count)) };
}

export function initSettingDemo(section, steps) {
  const track = section.querySelector('[data-setting-track]');
  const stage = section.querySelector('.setting-sticky');
  const items = [...section.querySelectorAll('[data-setting-item]')];
  const panels = [...section.querySelectorAll('[data-setting-panel]')];
  const windowTitle = section.querySelector('[data-setting-window-title]');
  const counter = section.querySelector('[data-setting-counter]');
  const status = section.querySelector('[data-setting-status]');
  let current = 0, pendingFrame = 0;

  function render() {
    pendingFrame = 0;
    const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
    const start = scrollY + track.getBoundingClientRect().top - stickyTop;
    const state = settingScrollState(scrollY, start, track.offsetHeight - stage.offsetHeight, steps.length);
    section.style.setProperty('--setting-progress', String(state.progress));
    if (state.index === current) return;
    current = state.index;
    section.dataset.settingStep = String(current + 1);
    section.style.setProperty('--setting-line-progress', String(current / (steps.length - 1)));
    items.forEach((item, index) => {
      const active = index === current;
      item.classList.toggle('is-active', active);
      if (active) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
      item.querySelector('p').setAttribute('aria-hidden', String(!active));
      panels[index].classList.toggle('is-active', active);
      panels[index].setAttribute('aria-hidden', String(!active));
    });
    windowTitle.textContent = steps[current].windowTitle;
    counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`;
    status.textContent = `第 ${current + 1} 步，共 ${steps.length} 步：${steps[current].title}。${steps[current].description}`;
  }

  function schedule() {
    if (!pendingFrame) pendingFrame = requestAnimationFrame(render);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  const observer = new ResizeObserver(schedule);
  observer.observe(track);
  observer.observe(stage);
  render();
}

import { initProductTabs } from './product-tabs.js';
import { settingSteps } from './setting-steps.js';

// The existing tab controller owns selection, keyboard focus and accessible panels.
export function initSetupCarousel(root) {
  if (!root) return null;
  const panels = [...root.querySelectorAll('[data-setting-panel]')];
  const stack = root.querySelector('[data-setting-stack]');
  if (!stack || panels.length !== settingSteps.length) return null;
  const caption = root.querySelector('[data-setting-caption]');
  const counter = root.querySelector('[data-setting-current]');
  let current = 0;
  const tabs = initProductTabs(root, '[data-setting-tab]', '[data-setting-panel]', {
    onSelect(index) {
      current = index;
      panels.forEach((panel, i) => {
        panel.dataset.stackPosition = String((i - current + panels.length) % panels.length);
      });
      if (caption) caption.textContent = settingSteps[current].description;
      if (counter) counter.textContent = String(current + 1).padStart(2, '0');
    },
  });
  if (!tabs) return null;
  const tabList = root.querySelector('[role="tablist"]');
  const compact = globalThis.matchMedia?.('(max-width: 900px)');
  const updateOrientation = () => tabList?.setAttribute('aria-orientation', compact?.matches ? 'horizontal' : 'vertical');
  updateOrientation();
  compact?.addEventListener('change', updateOrientation);
  root.querySelectorAll('[data-setting-direction]').forEach(button => {
    button.addEventListener('click', () => tabs.select(current + Number(button.dataset.settingDirection)));
  });

  let gesture;
  stack.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  stack.addEventListener('pointerup', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    gesture = null;
    if (Math.abs(dx) >= Math.max(36, stack.clientWidth * .08) && Math.abs(dx) > Math.abs(dy) * 1.3) {
      tabs.select(current + (dx < 0 ? 1 : -1));
    }
  });
  stack.addEventListener('pointercancel', () => { gesture = null; });
  stack.addEventListener('pointerleave', () => { gesture = null; });
  return tabs;
}

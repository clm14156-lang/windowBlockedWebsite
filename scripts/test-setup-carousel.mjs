import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initSetupCarousel } from '../src/setup-carousel.js';
import { setup } from '../src/setup-preview.js';
import { settingSteps } from '../src/setting-steps.js';

function element(dataset = {}) {
  return {
    dataset, attributes: {}, events: {}, inert: false,
    classList: { toggle(name, active) { this[name] = active; } },
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, handler) { this.events[name] = handler; },
    closest(selector) { return selector === '[data-setting-tab]' && 'settingTab' in this.dataset ? this : null; },
    focus() { this.focused = true; },
  };
}
const tabs = settingSteps.map((_, i) => element({ settingTab: String(i) }));
const panels = settingSteps.map((_, i) => element({ settingPanel: String(i) }));
const controls = [-1, 1].map(direction => element({ settingDirection: String(direction) }));
const stack = Object.assign(element(), { clientWidth: 600 });
const caption = element(), counter = element(), tabList = element();
const root = Object.assign(element(), {
  querySelectorAll(selector) {
    return { '[data-setting-tab]': tabs, '[data-setting-panel]': panels, '[data-setting-direction]': controls }[selector] || [];
  },
  querySelector(selector) {
    return { '[data-setting-stack]': stack, '[data-setting-caption]': caption, '[data-setting-current]': counter, '[role="tablist"]': tabList }[selector] || null;
  },
});
const previousMatchMedia = globalThis.matchMedia;
const media = { matches: false, addEventListener(name, callback) { this.change = callback; } };
globalThis.matchMedia = () => media;
try {
  const controller = initSetupCarousel(root);
  function selected(index) {
    tabs.forEach((tab, i) => {
      assert.equal(tab.attributes['aria-selected'], String(i === index));
      assert.equal(tab.tabIndex, i === index ? 0 : -1);
      assert.equal(panels[i].attributes['aria-hidden'], String(i !== index));
      assert.equal(panels[i].inert, i !== index);
    });
    assert.equal(panels[index].dataset.stackPosition, '0');
    assert.equal(new Set(panels.map(panel => panel.dataset.stackPosition)).size, 3);
    assert.equal(caption.textContent, settingSteps[index].description);
    assert.equal(counter.textContent, String(index + 1).padStart(2, '0'));
  }
  selected(0);
  assert.equal(tabList.attributes['aria-orientation'], 'vertical');
  root.events.click({ target: tabs[1] }); selected(1);
  controls[1].events.click(); selected(2);
  controls[1].events.click(); selected(0);
  controls[0].events.click(); selected(2);
  let prevented = false;
  root.events.keydown({ target: tabs[2], key: 'ArrowRight', preventDefault() { prevented = true; } });
  selected(0); assert(prevented && tabs[0].focused);
  for (const [key, expected] of [['End', 2], ['ArrowUp', 1], ['Home', 0]]) {
    root.events.keydown({ target: tabs[Number(counter.textContent) - 1], key, preventDefault() {} });
    selected(expected);
  }
  function gesture(dx, dy, end = 'pointerup', id = 7) {
    stack.events.pointerdown({ isPrimary: true, button: 0, pointerId: 7, clientX: 200, clientY: 100 });
    if (end !== 'pointerup') stack.events[end]();
    stack.events.pointerup({ pointerId: id, clientX: 200 + dx, clientY: 100 + dy });
  }
  gesture(-100, 10); selected(1);
  gesture(100, 10); selected(0);
  gesture(10, 100); selected(0); // Vertical scrolling does not advance the carousel.
  gesture(20, 0); selected(0); // A tap or short drag does not change steps.
  gesture(-100, 0, 'pointercancel'); selected(0);
  gesture(-100, 0, 'pointerleave'); selected(0);
  gesture(-100, 0, 'pointerup', 8); selected(0); // Ignore a second pointer.
  for (let i = 0; i < 20; i++) controls[1].events.click();
  selected(2);
  controller.select(0); selected(0);
  media.matches = true; media.change();
  assert.equal(tabList.attributes['aria-orientation'], 'horizontal');
  assert.equal(initSetupCarousel(null), null);
  assert.equal(initSetupCarousel({ querySelectorAll: () => [], querySelector: () => null }), null);
} finally {
  if (previousMatchMedia) globalThis.matchMedia = previousMatchMedia;
  else delete globalThis.matchMedia;
}

// Check the supplied PNGs directly: their intrinsic ratio reserves stable space.
const html = setup();
for (const [i, step] of settingSteps.entries()) {
  const data = await readFile(new URL(`..${step.image}`, import.meta.url));
  assert.equal(data.subarray(1, 4).toString(), 'PNG');
  assert.equal(data.readUInt32BE(16), step.width);
  assert.equal(data.readUInt32BE(20), step.height);
  assert(step.image.endsWith(`lunbo_00${i + 1}.png`));
  assert(html.includes(`src="${step.image}"`) && html.includes(`width="${step.width}" height="${step.height}"`));
}
assert.equal((html.match(/data-setting-panel="/g) || []).length, 3);
assert(!html.includes('setting-window-bar'));
console.log('Passed: setup steps, arrow wrapping, keyboard focus, swipe/scroll distinction, rapid switching, responsive ARIA and all three original image dimensions.');

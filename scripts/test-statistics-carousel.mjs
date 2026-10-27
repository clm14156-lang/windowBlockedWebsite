import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { initStatisticsCarousel } from '../src/statistics-carousel.js';
import { statisticsSlides } from '../src/statistics-slides.js';
import { statisticsPreview } from '../src/statistics-preview.js';
import { initStatisticsReel } from '../src/statistics-reel.js';

function element(dataset = {}) {
  return {
    dataset, attributes: {}, inert: false, events: {},
    classList: { toggle(name, value) { this[name] = value; } },
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, handler) { this.events[name] = handler; },
    focus() { this.focused = true; },
    matches(selector) { return selector === '[data-stat-select]' ? 'statSelect' in this.dataset : selector === '[data-stat-direction]' && 'statDirection' in this.dataset; },
    closest(selector) {
      if (selector === 'button') return this;
      if (selector === '[data-stat-selector-group]') return this.group || null;
      if (selector === '[data-stat-select], .statistics-navigation') return this;
      return null;
    },
  };
}
const images = statisticsSlides.map(() => ({ naturalWidth: 1331, complete: true, decode: async () => {} }));
const slides = statisticsSlides.map((_, i) => Object.assign(element(), { querySelectorAll: () => [images[i]] }));
const copies = statisticsSlides.map(() => element());
const groups = [0, 1].map(() => ({ querySelector(selector) { return this.buttons[Number(selector.match(/"(\d+)"/)[1])]; } }));
const selectors = groups.flatMap(group => group.buttons = statisticsSlides.map((_, i) => Object.assign(element({ statSelect: String(i) }), { group })));
const previous = element({ statDirection: '-1' }), next = element({ statDirection: '1' }), rotation = element(), status = element();
const root = Object.assign(element(), {
  querySelectorAll(selector) { return { '[data-stat-slide]': slides, '[data-stat-copy]': copies, '[data-stat-select]': selectors }[selector]; },
  querySelector(selector) { return { '[data-stat-rotation]': rotation, '[data-stat-status]': status }[selector] || null; },
  contains(node) { return selectors.includes(node) || [previous, next, rotation].includes(node); },
});
const oldWindow = globalThis.window, oldDocument = globalThis.document;
const timers = new Map(); let timerId = 0, observe;
const motion = { matches: false, addEventListener(name, handler) { this.change = handler; } };
const doc = { activeElement: null, hidden: false, addEventListener(name, handler) { this[name] = handler; } };
globalThis.window = {
  matchMedia: () => motion, setTimeout(handler, delay) { timers.set(++timerId, { handler, delay }); return timerId; },
  clearTimeout(id) { timers.delete(id); },
  IntersectionObserver: class { constructor(handler) { observe = handler; } observe() {} },
};
globalThis.document = doc;
const settle = () => new Promise(resolve => setTimeout(resolve, 0));
try {
  const controller = initStatisticsCarousel(root);
  function selected(index) {
    assert.equal(controller.getState().current, index);
    slides.forEach((slide, i) => {
      assert.equal(slide.dataset.position === 'current', i === index);
      assert.equal(slide.attributes['aria-hidden'], String(i !== index));
      assert.equal(slide.inert, i !== index);
      assert.equal(copies[i].classList['is-active'], i === index);
      assert.equal(copies[i].inert, i !== index);
    });
    selectors.forEach(button => assert.equal(button.attributes['aria-pressed'], String(Number(button.dataset.statSelect) === index)));
  }
  selected(0); assert.equal(controller.getState().playing, false); assert.equal(timers.size, 0);
  await controller.select(-1); selected(2);
  root.events.click({ target: next }); await settle(); selected(0);
  root.events.click({ target: selectors[4] }); await settle(); selected(1);
  await root.events.keydown({ target: selectors[4], key: 'End', preventDefault() {} }); selected(2); assert(selectors[5].focused);
  await root.events.keydown({ target: selectors[5], key: 'Home', preventDefault() {} }); selected(0);

  let finish;
  images[1].decode = () => new Promise(resolve => { finish = resolve; });
  root.events.click({ target: next }); selected(0); assert.equal(root.attributes['aria-busy'], 'true');
  root.events.click({ target: next }); await settle(); selected(2);
  finish(); await settle(); selected(2); // Fast arrow clicks advance to the latest requested slide.
  images[1].decode = async () => { throw new Error('Unavailable screenshot'); };
  assert.equal(await controller.select(1), false); selected(2);
  assert(status.classList['is-error'] && status.textContent.includes('请重试'));
  assert.equal(root.attributes['aria-busy'], 'false');
  images[1].decode = async () => {};
  assert.equal(await controller.select(1), true); selected(1); assert(!status.classList['is-error']);

  observe([{ intersectionRatio: .7 }]);
  root.events.click({ target: rotation }); assert.equal(controller.getState().playing, true);
  assert.equal(timers.size, 1); assert.equal([...timers.values()][0].delay, 4500);
  root.events.pointerenter({ pointerType: 'mouse' }); assert.equal(timers.size, 0);
  root.events.pointerleave(); assert.equal(timers.size, 1);
  root.events.focusin(); assert.equal(timers.size, 0);
  root.events.focusout({ relatedTarget: null }); assert.equal(timers.size, 1);
  doc.hidden = true; doc.visibilitychange(); assert.equal(timers.size, 0);
  doc.hidden = false; doc.visibilitychange(); assert.equal(timers.size, 1);
  observe([{ intersectionRatio: 0 }]); assert.equal(timers.size, 0);
  observe([{ intersectionRatio: .7 }]);
  const [id, scheduled] = [...timers.entries()][0]; timers.delete(id); scheduled.handler(); await settle(); selected(2);
  assert.equal(status.attributes['aria-live'], 'off', 'Autoplay should not repeatedly announce slide changes');
  motion.matches = true; motion.change();
  assert.equal(timers.size, 0); assert.equal(controller.getState().playing, false); assert.equal(rotation.disabled, true);
  root.events.click({ target: rotation }); assert.equal(controller.getState().playing, false);
  assert.equal(await controller.select(NaN), false);
  assert.equal(initStatisticsCarousel(null), null);
} finally {
  if (oldWindow) globalThis.window = oldWindow; else delete globalThis.window;
  if (oldDocument) globalThis.document = oldDocument; else delete globalThis.document;
}

const html = statisticsPreview();
for (const [i, slide] of statisticsSlides.entries()) {
  assert(slide.image.endsWith(`tongji0${i + 1}.png`));
  const data = await readFile(new URL(`..${slide.image}`, import.meta.url));
  assert.equal(data.readUInt32BE(16), slide.width); assert.equal(data.readUInt32BE(20), slide.height);
  await access(new URL(`..${slide.image.replace('.png','.webp')}`, import.meta.url));
}
assert(html.indexOf('statistics-heading') < html.indexOf('statistics-stage'));
assert(html.indexOf('statistics-stage') < html.indexOf('statistics-navigation'));
assert(html.indexOf('statistics-navigation') < html.indexOf('class="stat-features"'));
assert(!html.includes('class="app-window'));
assert.equal((html.match(/data-stat-slide="/g) || []).length, 3);
assert.equal((html.match(/data-stat-clone aria-hidden="true" inert/g) || []).length, 6);

// Exercise actual track movement separately from the existing selection controls.
const properties = () => ({ values: {}, setProperty(name, value) { this.values[name] = value; } });
const cards = Array.from({ length: 9 }, (_, i) => element({ statItem: String(((i - 3) % 3 + 3) % 3) }));
const track = Object.assign(element(), { style: properties(), querySelectorAll: () => cards, getBoundingClientRect: () => ({ width: cardWidth }) });
let cardWidth = 640, viewportWidth = 1646;
const showcase = { style: properties(), getBoundingClientRect: () => ({ width: cardWidth }) };
const reelEvents = {}, reelTimers = new Map(); let reelTimerId = 0;
const reelMotion = { matches: false, addEventListener(name, handler) { this.change = handler; } };
const reelRoot = { querySelector(selector) { return { '[data-stat-track]': track, '.statistics-showcase': showcase }[selector]; }, querySelectorAll: () => slides };
globalThis.window = { addEventListener(name, handler) { reelEvents[name] = handler; }, setTimeout(handler) { reelTimers.set(++reelTimerId, handler); return reelTimerId; }, clearTimeout(id) { reelTimers.delete(id); } };
globalThis.document = { documentElement: { get clientWidth() { return viewportWidth; } } };
try {
  const reel = initStatisticsReel(reelRoot, reelMotion);
  const end = () => track.events.transitionend({ target: track, propertyName: 'transform' });
  const offset = () => Number(track.style.values['--stat-offset']);
  const active = index => cards.forEach(card => assert.equal(card.dataset.statActive, String(Number(card.dataset.statItem) === index)));
  assert.equal(offset(), 0); active(0);
  reel.moveTo(2); assert.equal(offset(), 1); active(2);
  let resolved = false;
  const wrapped = reel.whenSettled().then(() => { resolved = true; });
  await settle(); assert(!resolved);
  track.events.transitionend({ target: track, propertyName: 'opacity' });
  await settle(); assert(!resolved, 'Child opacity transitions must not reset the moving track');
  end(); await wrapped; assert.equal(offset(), -2); active(2);
  reel.moveTo(0, 1); assert.equal(offset(), -3); end(); await reel.whenSettled(); assert.equal(offset(), 0);
  reel.moveTo(2, -1); assert.equal(offset(), 1); end(); await reel.whenSettled(); assert.equal(offset(), -2);
  reel.moveTo(1, 1); assert.equal(offset(), -4); end(); await reel.whenSettled(); assert.equal(offset(), -1);

  for (const [width, height] of [[320,720],[375,812],[760,900],[761,900],[1024,768],[1366,768],[1646,936],[1920,1080],[2560,1080]]) {
    viewportWidth = width;
    cardWidth = width <= 760 ? Math.min(640, width - 40) : Math.min(width - 64, 760, height * .72);
    reelEvents.resize();
    assert.equal(parseFloat(showcase.style.values['--stat-card-width']), cardWidth, 'The center window must retain its existing responsive width');
    assert(parseFloat(showcase.style.values['--stat-view-width']) <= viewportWidth);
    const scale = Number(showcase.style.values['--stat-side-scale']);
    const spacing = parseFloat(showcase.style.values['--stat-step']);
    const gap = width <= 760 ? 10 : 24;
    for (const [from, to] of [[0,1],[0,2],[2,0],[2,1]]) {
      for (let phase = 0; phase <= 100; phase++) {
        const progress = phase / 100;
        const sizes = cards.map(card => {
          const index = Number(card.dataset.statItem);
          return cardWidth * ((index === from ? 1 : scale) * (1 - progress) + (index === to ? 1 : scale) * progress);
        });
        for (let i = 1; i < sizes.length; i++) assert(spacing - (sizes[i - 1] + sizes[i]) / 2 >= gap - .001, 'Visible cards must stay separated throughout horizontal movement');
      }
    }
  }
  reel.moveTo(0, -1);
  for (const handler of [...reelTimers.values()]) handler();
  await reel.whenSettled(); assert.equal(offset(), 0);
  reelMotion.matches = true;
  reel.moveTo(2); assert.equal(offset(), -2); active(2); assert.equal(reelTimers.size, 0);

  const connectedMotion = { matches: false, addEventListener() {} };
  window.matchMedia = () => connectedMotion;
  document.addEventListener = () => {};
  const connectedRoot = Object.assign(element(), {
    querySelectorAll: root.querySelectorAll, contains: root.contains,
    querySelector(selector) { return { '[data-stat-track]': track, '.statistics-showcase': showcase, '[data-stat-rotation]': rotation, '[data-stat-status]': status }[selector] || null; },
  });
  const connected = initStatisticsCarousel(connectedRoot);
  await connected.select(1); assert.equal(connected.getState().current, 1);
  const superseded = connected.select(2, true, 1);
  const latest = connected.select(0, true, 1);
  await settle(); assert.equal(connected.getState().current, 1, 'A second motion must wait for the visible track to finish');
  end();
  assert.equal(await superseded, false); assert.equal(await latest, true);
  assert.equal(connected.getState().current, 0); assert.equal(offset(), -3);
  end(); await settle(); assert.equal(offset(), 0);
  await connected.select(2, true, -1); assert.equal(offset(), 1);
  end(); await settle(); assert.equal(offset(), -2);
} finally {
  if (oldWindow) globalThis.window = oldWindow; else delete globalThis.window;
  if (oldDocument) globalThis.document = oldDocument; else delete globalThis.document;
}
console.log('Passed: original images/content, linked controls, keyboard, rapid requests, image failure recovery, autoplay pauses, bidirectional track wrapping, reduced motion, unchanged center sizes and nonoverlapping cards throughout transitions across 9 viewports.');

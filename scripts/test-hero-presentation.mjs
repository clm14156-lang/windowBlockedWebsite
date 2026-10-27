import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { heroPresentationFrame, initHeroPresentation } from '../src/hero-presentation.js';
import { hero } from '../src/components.js';

const initial = heroPresentationFrame(0), final = heroPresentationFrame(1);
assert.equal(initial.state, 'home'); assert.equal(initial.tilt, 26);
assert.equal(initial.ratio, 867 / 756); assert.equal(initial.blend, 0);
assert.equal(final.state, 'focus'); assert.equal(final.tilt, 0);
assert.equal(final.scale, 1); assert.equal(final.ratio, 1.5); assert.equal(final.blend, 1);
assert.deepEqual(heroPresentationFrame(-1), initial);
assert.deepEqual(heroPresentationFrame(2), final);
let previous = initial;
for (let i = 1; i <= 100; i++) {
  const frame = heroPresentationFrame(i / 100);
  assert(frame.tilt <= previous.tilt && frame.blend >= previous.blend && frame.ratio >= previous.ratio);
  const reduced = heroPresentationFrame(i / 100, true);
  assert.equal(reduced.tilt, 0); assert.equal(reduced.scale, 1); assert.equal(reduced.ratio, 1.5);
  previous = frame;
}
for (const viewport of [320,375,430,760,1024,1280,1440,1920,2560]) {
  const width = Math.min(1040, viewport - (viewport <= 760 ? 48 : 96));
  const height = width * 2 / 3, gap = viewport <= 760 ? 32 : 36;
  for (let i = 0; i <= 100; i++) {
    const frame = heroPresentationFrame(i / 100);
    const radians = frame.tilt * Math.PI / 180;
    const planeHeight = width / frame.ratio * frame.scale;
    const projectedHeight = planeHeight * Math.cos(radians) / (1 + planeHeight * Math.sin(radians) / 2400);
    assert(height - projectedHeight >= -gap, 'The projected window must not intrude into the headline/buttons');
    assert(width * frame.scale <= viewport, 'The bottom edge must stay within the viewport');
  }
}

const element = () => ({ dataset: {}, attributes: {}, style: { values: {}, setProperty(name, value) { this.values[name] = value; } }, events: {},
  setAttribute(name, value) { this.attributes[name] = value; }, addEventListener(name, handler) { this.events[name] = handler; } });
const track = element(), stage = element(), viewport = element(), opening = element(), focus = element(), controls = element(), status = element();
const image = Object.assign(element(), { complete: true, naturalWidth: 867 });
opening.querySelector = () => image;
const nodes = { '[data-hero-scroll-track]': track, '[data-hero-scroll-stage]': stage, '[data-hero-presentation]': viewport, '[data-hero-start-view]': opening, '[data-hero-focus-view]': focus, '[data-hero-focus-controls]': controls, '[data-hero-presentation-status]': status };
const section = { querySelector: selector => nodes[selector], getBoundingClientRect: () => ({ top: -window.scrollY }) };
const oldWindow = globalThis.window, oldDocument = globalThis.document;
const events = {}, frames = new Map(); let frameId = 0, distance = 360, observed = 0;
const motion = { matches: false, addEventListener(name, handler) { this.change = handler; } };
globalThis.window = { scrollY: 0, matchMedia: () => motion, getComputedStyle: () => ({ paddingBottom: String(distance) }),
  requestAnimationFrame(handler) { frames.set(++frameId, handler); return frameId; },
  addEventListener(name, handler, options) { events[name] = handler; if (name === 'scroll') assert.equal(options.passive, true); },
  ResizeObserver: class { observe() { observed++; } },
};
globalThis.document = { hidden: false, addEventListener(name, handler) { events[name] = handler; } };
const flush = () => { for (const [id, handler] of [...frames]) { frames.delete(id); handler(); } };
try {
  assert.equal(initHeroPresentation(null), null);
  assert.equal(initHeroPresentation({ querySelector: () => null }), null);
  const controller = initHeroPresentation(section); flush();
  assert.equal(observed, 2); assert.equal(viewport.dataset.presentationState, 'home');
  assert.equal(focus.inert, true); assert.equal(controls.inert, true);
  assert.equal(viewport.style.values['--hero-start-opacity'], '1');
  window.scrollY = 180; events.scroll(); events.scroll(); assert.equal(frames.size, 1); flush();
  assert.equal(viewport.dataset.presentationState, 'transitioning');
  assert(Math.abs(Number(viewport.style.values['--hero-focus-opacity']) - .5) < 1e-9);
  window.scrollY = 360; events.scroll(); flush();
  assert.equal(viewport.dataset.presentationState, 'focus'); assert.equal(focus.inert, false);
  assert.equal(controls.attributes['aria-hidden'], 'false'); assert.equal(opening.style.visibility, 'hidden');
  assert.equal(viewport.style.values['--hero-plane-tilt'], '0deg');
  window.scrollY = 0; events.scroll(); flush();
  assert.equal(viewport.dataset.presentationState, 'home'); assert.equal(focus.inert, true);
  assert.equal(opening.attributes['aria-hidden'], 'false');
  window.scrollY = 90; distance = 180; controller.refresh(); flush();
  assert.equal(viewport.dataset.presentationState, 'transitioning');
  motion.matches = true; motion.change(); flush();
  assert.equal(viewport.style.values['--hero-plane-tilt'], '0deg');
  assert.equal(viewport.style.values['--hero-plane-ratio'], '1.5');
  window.scrollY = 180; events.pageshow(); flush(); assert.equal(viewport.dataset.presentationState, 'focus');
  window.scrollY = 0; events.visibilitychange(); flush(); assert.equal(viewport.dataset.presentationState, 'home');
  image.events.error(); flush(); assert.equal(viewport.dataset.presentationState, 'focus');
  assert.equal(focus.inert, false); assert(status.textContent.includes('暂未加载'));
} finally {
  if (oldWindow) globalThis.window = oldWindow; else delete globalThis.window;
  if (oldDocument) globalThis.document = oldDocument; else delete globalThis.document;
}
const html = hero();
assert(html.includes('/assets/product/image1.png') && html.includes('fetchpriority="high"'));
assert.equal((html.match(/data-hero-focus-view/g) || []).length, 1);
assert.equal((html.match(/data-hero-time/g) || []).length, 1);
const png = await readFile(new URL('../assets/product/image1.png', import.meta.url));
assert.equal(png.readUInt32BE(16), 867); assert.equal(png.readUInt32BE(20), 756);
console.log('Passed: original homepage image, reversible scroll/angle/content transitions, exact front-facing endpoint, responsive perspective bounds, inert controls, reduced motion, image-error fallback and restored scroll positions.');

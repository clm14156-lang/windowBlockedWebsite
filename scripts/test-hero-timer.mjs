import assert from 'node:assert/strict';
import { heroDuration, initHeroTimer } from '../src/hero-timer.js';
import { hero, floating } from '../src/components.js';

const element = () => ({ textContent: '', innerHTML: '', attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } });
const clocks = [element(), element()];
const control = element();
const preview = element();
const properties = {};
const root = {
  dataset: {},
  style: { setProperty(name, value) { properties[name] = value; } },
  querySelectorAll: () => clocks,
  querySelector: selector => selector === '[data-hero-toggle]' ? control : preview,
};
const state = { heroTime: heroDuration, heroRunning: true };
const timer = initHeroTimer(root, state, name => `<svg data-icon="${name}"></svg>`);
const expectClocks = label => clocks.forEach(clock => assert.equal(clock.textContent, label));
expectClocks('04:53');
assert.equal(control.attributes['aria-pressed'], 'true');
for (let tick = 0; tick < 58; tick++) timer.tick();
expectClocks('03:55');
assert(Number.parseFloat(properties['--hero-progress']) < 100);

timer.toggle();
assert.equal(state.heroRunning, false);
assert.equal(control.attributes['aria-pressed'], 'false');
for (let tick = 0; tick < 10; tick++) timer.tick();
expectClocks('03:55');
assert(preview.attributes['aria-label'].includes('已停止'));
timer.toggle();
timer.tick();
expectClocks('03:54');

state.heroTime = 1;
timer.tick();
expectClocks('00:00');
assert.equal(state.heroRunning, false);
assert.equal(properties['--hero-progress'], '0%');
assert(control.innerHTML.includes('重新开始'));
timer.tick();
assert.equal(state.heroTime, 0);
timer.toggle();
expectClocks('04:53');
assert.equal(state.heroRunning, true);
assert.equal(properties['--hero-progress'], '100%');
assert.equal(initHeroTimer(null, {}, () => ''), null);

const home = hero();
assert(home.includes('hero-focus') && home.includes('/assets/focus02.png') && home.includes('width="1536" height="1024"'));
assert(home.includes('下午好') && home.includes('day-sun'));
assert.equal((home.match(/data-hero-time/g) || []).length, 2);
assert.equal((home.match(/<img /g) || []).length, 1, 'The provided artwork already contains the character');
assert(home.includes('data-demo="tasks"') && home.includes('data-hero-toggle'));
const desktop = floating();
assert(desktop.includes('/assets/focus_scene01.png') && desktop.includes('夜深了') && !desktop.includes('hero-focus'), 'Other product demonstrations retain their original appearance');
console.log('Passed: shared hero clocks and ring, stop/resume, completion/restart, daytime artwork without duplicate characters, unchanged floating demonstration.');

import assert from 'node:assert/strict';
import { heroDuration, initHeroTimer } from '../src/hero-timer.js';
import { hero, floating, downloadPage } from '../src/components.js';

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
assert(home.includes('hero-focus') && home.includes('/assets/focus03.png') && home.includes('/assets/dark_background02.png'));
assert(home.includes('下午好') && home.includes('day-sun'));
assert.equal((home.match(/data-hero-time/g) || []).length, 1);
assert.equal((home.match(/class="hero-scene-character"/g) || []).length, 2, 'One character per mode, with only one mode visible');
assert(!home.includes('/assets/focus02.png'), 'The homepage must use the separate background and character artwork');
assert(home.includes('data-hero-toggle') && home.includes('结束任务'));
assert(!home.includes('hero-mini') && !home.includes('查看任务') && !home.includes('focus-toolbar-divider'));

// Removing the optional floating preview must keep the main timer usable.
const singleClock = element(), singleControl = element();
singleControl.dataset = { heroStopLabel: '结束任务', heroStartLabel: '开始任务' };
const singleState = { heroTime: heroDuration, heroRunning: true };
const singleTimer = initHeroTimer({
  dataset: {}, style: { setProperty() {} }, querySelectorAll: () => [singleClock],
  querySelector: selector => selector === '[data-hero-toggle]' ? singleControl : null,
}, singleState, () => '');
singleTimer.tick(); assert.equal(singleClock.textContent,'04:52'); assert(singleControl.innerHTML.includes('结束任务'));
singleTimer.toggle(); assert(singleControl.innerHTML.includes('开始任务'));
singleTimer.toggle(); singleState.heroTime=1; singleTimer.tick(); assert(singleControl.innerHTML.includes('重新开始'));
singleTimer.toggle(); assert.equal(singleClock.textContent,'04:53');
const desktop = floating();
assert(desktop.includes('/assets/focus_scene01.png') && desktop.includes('夜深了') && !desktop.includes('hero-focus'), 'Other product demonstrations retain their original appearance');
assert(downloadPage().includes('/assets/focus02.png') && !downloadPage().includes('data-hero-theme'), 'Keep the download page outside the homepage theme change');
console.log('Passed: main-only timer and optional compact preview, task control labels, stop/resume/restart, new day scene and unchanged floating/download demonstrations.');

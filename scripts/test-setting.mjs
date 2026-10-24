import assert from 'node:assert/strict';
import { settingScrollState } from '../src/setting-demo.js';
import { settingSteps } from '../src/setting-steps.js';

assert.deepEqual(settingSteps.map(step => step.image), ['/assets/setting_a1.png', '/assets/setting_a2.png', '/assets/setting_a3.png']);
for (const distance of [600, 1500, 1800, 2400]) {
  const start = 800;
  assert.deepEqual(settingScrollState(start - 500, start, distance), { progress: 0, index: 0 });
  for (const [fraction, index] of [[0, 0], [1 / 6, 0], [1 / 3, 1], [.5, 1], [2 / 3, 2], [5 / 6, 2], [1, 2]]) {
    assert.equal(settingScrollState(start + distance * fraction, start, distance).index, index, `Equal scroll segment ${fraction} at ${distance}px`);
  }
  assert.deepEqual(settingScrollState(start + distance + 500, start, distance), { progress: 1, index: 2 });
  for (const boundary of [1 / 3, 2 / 3]) {
    const point = start + boundary * distance;
    assert.equal(settingScrollState(point - 1, start, distance).index + 1, settingScrollState(point + 1, start, distance).index);
  }
  const states = Array.from({ length: 121 }, (_, i) => settingScrollState(start + distance * i / 120, start, distance));
  assert.deepEqual([...new Set(states.map(state => state.index))], [0, 1, 2]);
  for (let i = 120; i >= 0; i--) assert.deepEqual(settingScrollState(start + distance * i / 120, start, distance), states[i], 'Upward scroll restores the same step');
}
assert.deepEqual(settingScrollState(9999, 800, 0), { progress: 0, index: 0 });
console.log('Passed: three image mappings, equal scroll thirds, exact boundaries, final-step hold, clamping and reversible scroll progress.');

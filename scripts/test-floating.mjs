import assert from 'node:assert/strict';
import { desktopGeometry, floatingFrame, scrollProgress } from '../src/floating-demo.js';

assert.equal(scrollProgress(0, 100, 600), 0);
assert.equal(scrollProgress(100, 100, 600), 0);
assert.equal(scrollProgress(400, 100, 600), .5);
assert.equal(scrollProgress(1000, 100, 600), 1);
assert.equal(scrollProgress(1000, 100, 0), 0);

for (const width of [240, 280, 320, 390, 640, 810, 1000, 1510]) {
  const mobile = width < 600;
  const height = width * 941 / 1672;
  const fullWidth = width * (mobile ? .64 : .54);
  const timerWidth = width * (mobile ? .32 : .20);
  const geometry = desktopGeometry(width, height, fullWidth, fullWidth / 1.48, timerWidth, width * (mobile ? .075 : .047));
  const expanded = floatingFrame(0, geometry);
  const collapsed = floatingFrame(1, geometry);
  assert.equal(expanded.state, 'expanded');
  assert.equal(expanded.full.scale, 1);
  assert.equal(expanded.full.opacity, 1);
  assert.equal(expanded.timer.opacity, 0);
  assert.equal(collapsed.state, 'collapsed');
  assert.equal(collapsed.full.opacity, 0);
  assert.equal(collapsed.timer.opacity, 1);
  assert.equal(collapsed.timer.x + geometry.timerWidth, width - geometry.inset);
  assert.equal(collapsed.timer.y, geometry.inset);
  let previous = expanded;
  const frames = [];
  for (let i = 0; i <= 100; i++) {
    const frame = floatingFrame(i / 100, geometry);
    frames.push(frame);
    const { x, y, scale, opacity } = frame.full;
    assert(x >= 0 && x + fullWidth * scale <= width + .001, 'Window stays inside the desktop horizontally');
    assert(y >= 0 && y + geometry.fullHeight * scale <= height * .91, 'Window stays above the taskbar');
    assert(scale <= previous.full.scale + .0001 && opacity <= previous.full.opacity + .0001, 'Downward scroll continuously shrinks and fades the full window');
    assert(frame.timer.opacity >= previous.timer.opacity - .0001);
    assert(Math.abs(frame.full.x - previous.full.x) < width * .04, 'No jumps between adjacent scroll positions');
    previous = frame;
  }
  for (let i = 100; i >= 0; i--) assert.deepEqual(floatingFrame(i / 100, geometry), frames[i], 'Upward scrolling exactly reverses the transition');
  for (const progress of [0, .3, .5, .7, 1]) {
    const frame = floatingFrame(progress, geometry, true);
    assert(['expanded', 'collapsed'].includes(frame.state));
    assert.equal(frame.full.opacity + frame.timer.opacity, 1);
    assert([0, 1].includes(frame.full.opacity), 'Reduced motion has no interpolated movement');
  }
}
console.log('Passed: scroll clamping, full/collapsed endpoints, smooth reversible motion, fixed top-right timer, desktop/taskbar bounds and reduced motion across 8 sizes.');

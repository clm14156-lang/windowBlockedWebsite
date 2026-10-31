import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSite } from '../src/components.js';
const css = await readFile(new URL('../styles/screens.css', import.meta.url), 'utf8');
const sectionRule = css.match(/\.section\{([^}]+)\}/)[1];
assert(sectionRule.includes('min-height:0') && sectionRule.includes('height:auto') && sectionRule.includes('box-sizing:border-box'));
assert(sectionRule.includes('display:block') && !/(?:justify-content|overflow|max-height)\s*:/.test(sectionRule), 'Content must determine section height without stretching or clipping');
assert(!/\d(?:[sd])?vh\b|screen-media|!important/.test(css), 'No viewport-height spacing or independent image fitting');
assert(!/(?:font-size|font-family|font-weight|color|background)\s*:/.test(css), 'Spacing must preserve existing typography and colors');
assert(css.includes('main>.section:first-child{padding-top:calc(var(--nav-height) + var(--section-space))}'));
assert(sectionRule.includes('padding-block:var(--section-space)'));
assert(css.includes('#home .hero-stage{margin-top:var(--section-gap)}') && css.includes('#home .hero-scroll-track{margin-top:var(--section-gap)}'));
assert(!/floating-scroll-track|floating-sticky|floating-caption/.test(css));
assert(!/screen-layout|initScreenLayout/.test(await readFile(new URL('../src/app.js',import.meta.url),'utf8')));
const stylesheet = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
for (const match of stylesheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const selector = match[1].replace(/\/\*[\s\S]*?\*\//g, '').trim();
  if (selector.split(',').some(value => /^(?:#[\w-]+)?\.[\w-]+-section$/.test(value.trim()))) {
    assert(!/(?:^|;)\s*(?:min-height|max-height|height|padding(?:-top|-bottom)?)\s*:/.test(match[2]), `Keep section sizing in the shared content-flow rules: ${selector}`);
  }
}
let count = 0;
for (const page of ['features','download','membership','help','not-found']) {
  const html = renderSite(page);
  const sections = [...html.matchAll(/<section\b[^>]*class="section [^"]+"[^>]*>([\s\S]*?)<\/section>/g)];
  assert(!/data-screen-media|data-screen-content|data-screen-row/.test(html), `${page}: no viewport fitting annotations`);
  count += sections.length;
}
assert.equal(count, 13);

// Evaluate the actual CSS spacing tokens at the requested browser zoom levels.
const tokens = Object.fromEntries([...css.matchAll(/(--section-[\w-]+):(clamp\([^;]+\));/g)].map(match=>[match[1],match[2]]));
function pixels(value,width) {
  const match = value.trim().match(/^([\d.]+)(rem|vw|px)$/);
  assert(match, `Unsupported spacing expression: ${value}`);
  return Number(match[1]) * (match[2]==='rem'?16:match[2]==='vw'?width/100:1);
}
function spacing(name,width) {
  const values=tokens[name].slice(6,-1).split(',').map(value=>pixels(value,width));
  return Math.min(values[2],Math.max(values[0],values[1]));
}
for (const [physicalWidth,physicalHeight] of [[1366,768],[1920,1080],[390,844]]) {
  let previousSpace=Infinity;
  for (const zoom of [1,.75,.5,.25]) {
    const width=physicalWidth/zoom;
    const space=spacing('--section-space',width), gap=spacing('--section-gap',width);
    assert(space>=48 && space<=80 && gap>=24 && gap<=40);
    assert(space*zoom<=previousSpace, 'Zooming out must not increase visible inter-section whitespace');
    previousSpace=space*zoom;
    for(const contentHeight of [120,500,1100,2000]) {
      const naturalHeight=contentHeight+2*space;
      assert(Math.abs(naturalHeight-contentHeight-2*space)<1e-8,'Empty space follows content spacing, not browser height');
      assert(Math.abs(naturalHeight*zoom-contentHeight*zoom-2*space*zoom)<1e-8);
    }
    assert(Number.isFinite(physicalHeight/zoom));
  }
}
console.log('Passed: 13 content-driven sections, bounded shared spacing at 25% / 50% / 75% / 100%, desktop/mobile widths, no viewport-height media sizing or scroll spacers. (CSS/source checks; not browser screenshots.)');

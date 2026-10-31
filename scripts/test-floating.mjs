import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { floating, renderSite } from '../src/components.js';

const html = floating();
const cards = [...html.matchAll(/<li class="floating-card" data-floating-card="([^"]+)">([\s\S]*?)<\/li>/g)];
assert.deepEqual(cards.map(match => match[1]), ['focus','floating','collapsed']);
const artwork = [['zhuanzhu_shouye.png',1536,1024],['zhuanzhu_xuanfu.png',1108,1420],['zhedie.png',1672,941]];
for (const [index, card] of cards.entries()) {
  const [asset,width,height] = artwork[index];
  assert(card[2].includes(`src="/assets/product/${asset}"`));
  assert(card[2].includes(`width="${width}" height="${height}"`));
  const png = await readFile(new URL(`../assets/product/${asset}`,import.meta.url));
  assert.equal(png.readUInt32BE(16),width);assert.equal(png.readUInt32BE(20),height);
  assert.equal(png[25],6,'Keep the original transparent PNG artwork');
}
for (const text of ['轻巧的悬浮计时','三种形态，陪你<span>自然专注</span>','既可以是一整页的专注空间','适应你不同的工作时刻。','专注页面','悬浮页面','折叠页面','沉浸专注','轻巧悬浮','一键收起','不打断工作','清爽的专注页面','帮你远离干扰','桌面悬浮窗口','随时查看进度与任务','可折叠至屏幕边缘','关键计时信息始终可见','灵活适应不同的工作场景','让专注自然融入日常']) assert(html.includes(text));
assert(!/task_0[123]\.png|折叠状态|展开状态|创建任务|悬浮在桌面，|随时创建任务|提升专注效率/.test(html),'Remove the previous copy and three screenshots');
assert.equal((html.match(/class="floating-flow-arrow"/g)||[]).length,2);
const benefits = html.match(/<ul class="floating-benefits"[\s\S]*?<\/ul>/)[0];
assert.equal((benefits.match(/<li>/g)||[]).length,4);
assert(!/windows-desktop|focus_scene01|data-floating-(?:track|desktop|timer|time|status)|floating-focus/.test(html));
assert(!/<button|<input/.test(html));
const app = await readFile(new URL('../src/app.js',import.meta.url),'utf8');
assert(!/floating-demo|initFloatingDemo/.test(app));
await assert.rejects(access(new URL('../src/floating-demo.js',import.meta.url)),{code:'ENOENT'});
const sectionIds = [...renderSite('features').matchAll(/<section\b[^>]*id="([^"]+)"/g)].map(match=>match[1]);
assert.deepEqual(sectionIds.slice(1,5),['features','floating','personalization','blocking']);
assert.equal(sectionIds.filter(id=>id==='floating').length,1);
const stylesheet = await readFile(new URL('../styles.css',import.meta.url),'utf8');
const css = stylesheet.split('/* Three focus modes, using the original software artwork in a shared product flow. */')[1].split('/* Goals:')[0];
for(const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  for(const selector of match[1].split(',')) assert(/^#floating\b/.test(selector.trim()),'Only style this section');
}
assert(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
assert(css.includes('grid-template-columns:repeat(4,minmax(0,1fr))'));
assert(css.includes('@media(max-width:960px)') && css.includes('rotate(90deg)'));
assert(css.includes('object-fit:contain') && !/100[sdl]?vh/.test(css));
assert(css.includes('aspect-ratio:6/5') && css.includes('width:min(1536px,calc(100% - 72px))'));
const cardRule = css.match(/#floating \.floating-card\{([^}]+)\}/)[1];
assert(!/(?:^|;)\s*(?:height|max-height|overflow)\s*:/.test(cardRule),'Long descriptions grow naturally');
for(const width of [320,390,600,601,768,900,960,961,1024,1366,1536,1920,2560]) {
  const inner = Math.min(1536,width-(width<=600?40:72));
  const columns = width<=960?1:3, grid = columns===1?Math.min(540,inner):inner;
  const gap = columns===1?48:24;
  const card = (grid-gap*(columns-1))/columns;
  const padding = width<=600?16:width<=960?20:width<=1100?16:20;
  const visual = card-2-2*padding, contentWidth = visual-24, contentHeight = visual*5/6-24;
  assert(contentWidth>=200 && contentHeight>=175,'Artwork remains a useful size before stacking');
  assert(grid<=inner && card>0);
  for(const [,sourceWidth,sourceHeight] of artwork){
    const scale = Math.min(contentWidth/sourceWidth,contentHeight/sourceHeight);
    assert(sourceWidth*scale<=contentWidth+.001 && sourceHeight*scale<=contentHeight+.001,'Show the full original aspect ratio');
  }
}
console.log('Passed: focus/floating/collapsed original screenshots, reference copy and four benefits, two flow arrows, retired content absent, 6:5 presentation frames, scoped styles, preserved section position and 320–2560px layout budgets. (Source/geometry checks; no browser screenshots.)');

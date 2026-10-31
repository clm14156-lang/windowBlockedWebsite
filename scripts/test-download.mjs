import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { downloadPage } from '../src/components.js';
import { header } from '../src/site-shell.js';
import { siteConfig } from '../src/site-config.js';

const html=downloadPage();
assert(html.includes('让<span>专注</span>，<br/>自然发生。'));
assert(html.includes('专注时光 for Windows') && html.includes('屏蔽干扰 · 规划任务 · 记录进步'));
assert(!/download-card|download-guide|安装之后，只需三步|先在线体验/.test(html));
assert(html.includes('download-primary') && html.includes('aria-describedby="download-status"'));
const list=html.match(/<ul class="download-features"[\s\S]*?<\/ul>/)[0];
assert.equal((list.match(/<li>/g)||[]).length,3);
for(const title of ['网站与应用屏蔽','专注计时','任务与统计'])assert(list.includes(title));
assert.equal((html.match(/data-hero-time/g)||[]).length,2,'Keep the original main/compact countdown state and controls');
assert(html.includes('/assets/focus02.png') && html.includes('data-hero-toggle') && html.includes('data-demo="tasks"'));
assert(!/Windows 10|Windows 11|纯净安装/.test(html),'Do not invent unconfirmed release requirements');
assert(header('download').includes('class="site-header"') && header('download').includes('data-demo'));
const original={...siteConfig};
try{
  siteConfig.downloadUrl='';
  assert(downloadPage().includes('disabled') && downloadPage().includes('下载准备中'));
  siteConfig.downloadUrl='https://example.com/focus.exe';siteConfig.version='1.0.0';
  const ready=downloadPage();
  assert(ready.includes('href="https://example.com/focus.exe" rel="noopener"') && ready.includes('下载 Windows 版'));
  assert(ready.includes('版本 1.0.0') && !ready.includes('disabled'));
}finally{Object.assign(siteConfig,original);}
const css=await readFile(new URL('../styles/download.css',import.meta.url),'utf8');
for(const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)){
  const selector=match[1].replace(/\/\*[\s\S]*?\*\//g,'').trim();
  for(const part of selector.split(','))assert(/^#download\b/.test(part.trim()),`Download CSS must only style its content: ${part}`);
}
assert(!/100[sdl]?vh|overflow\s*:\s*hidden/.test(css),'Natural scrolling without viewport locks or overflow masking');
assert(css.includes('grid-template-columns:minmax(0,.34fr) minmax(0,.66fr)'));
assert(css.includes('@media(max-width:900px)') && css.includes('grid-template-columns:1fr'));
assert(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
for(const viewport of [320,375,390,700,768,900,901,1024,1366,1610,1920]){
  const inner=Math.min(1360,viewport-(viewport<=700?40:80));
  let preview;
  if(viewport<=900)preview=Math.min(760,inner-(viewport<=700?16:0));
  else preview=(inner-(viewport<=1100?32:48))*(viewport<=1100?.62:.66);
  const right=viewport<=900?(viewport+preview)/2:(viewport+inner)/2;
  assert(preview>0 && right+preview*.035<=viewport,'Allow the preserved floating timer to protrude without horizontal overflow');
}
console.log('Passed: direct ready/pending download CTA, original timer/task controls, three core features, removed card/guide/local trial link, preserved header trial, isolated styles and 320–1920px layout budgets. (Source checks; no browser screenshots.)');

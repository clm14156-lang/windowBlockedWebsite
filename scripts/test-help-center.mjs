import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { faqs } from '../src/data.js';
import { faq, header, footer } from '../src/site-shell.js';
import { initHelpCenter } from '../src/help-center.js';

const html=faq();
assert(html.includes('使用专注时光时，<span>有疑问？</span>'));
assert(html.includes('/assets/helpbackground.png') && !html.includes('/assets/bac.png'));
assert.equal((html.match(/class="help-category"/g)||[]).length,4);
for(const title of ['下载与安装','专注与屏蔽','目标与任务','数据与统计'])assert(html.includes(`<strong>${title}</strong>`));
assert(html.includes('href="/download/"') && html.includes('共 8 个问题'));
assert(!/type="search"|help-layout/.test(html));
const questions=[...html.matchAll(/<details\b([^>]*)>([\s\S]*?)<\/details>/g)];
assert.equal(questions.length,8);
questions.forEach(([all,attributes,content],i)=>{
  assert(!/\bopen(?:\s|=|$)/.test(attributes),'Every question starts collapsed');
  assert(attributes.includes(`id="faq-question-${i+1}"`));
  assert(content.includes(`<summary><span>${faqs[i][0]}</span>`) && content.includes(`<p>${faqs[i][1]}</p>`));
});
assert(header('help').includes('class="site-header"'));
assert(footer().includes('data-privacy') && footer().includes('/membership/'));
const png=await readFile(new URL('../assets/helpbackground.png',import.meta.url));
assert.equal(png.readUInt32BE(16),1983);assert.equal(png.readUInt32BE(20),793);

const previousWindow=globalThis.window,events={},listeners={};
const items=faqs.map((_,i)=>({id:`faq-question-${i+1}`,open:false}));
const links=[2,4,6].map(i=>({dataset:{helpQuestion:`faq-question-${i}`}}));
const root={querySelectorAll:selector=>selector==='.faq-item[id]'?items:links,addEventListener:(name,handler)=>{listeners[name]=handler;}};
globalThis.window={location:{hash:''},addEventListener:(name,handler)=>{events[name]=handler;}};
try{
  assert.equal(initHelpCenter(null),null);
  const controller=initHelpCenter(root);
  assert(items.every(item=>!item.open));
  for(const link of links){
    listeners.click({target:{closest:()=>link},button:0,preventDefault(){throw new Error('Keep native anchor navigation');}});
    assert(items.find(item=>item.id===link.dataset.helpQuestion).open);
  }
  items[3].open=false; // Native summary toggling can close an answer without interference.
  listeners.click({target:{closest:()=>null}});assert.equal(items[3].open,false);
  listeners.click({target:{closest:()=>links[1]},ctrlKey:true,button:0});assert.equal(items[3].open,false);
  window.location.hash='#faq-question-8';events.hashchange();assert(items[7].open);
  window.location.hash='#%E0%A4%A';assert.doesNotThrow(events.hashchange);
  assert.equal(controller.reveal('outside-page'),false);
  items.forEach(item=>{item.open=false;});
  window.location.hash='#faq-question-4';initHelpCenter(root);assert(items[3].open,'Direct FAQ links reveal their answer');
}finally{if(previousWindow)globalThis.window=previousWindow;else delete globalThis.window;}
const css=await readFile(new URL('../styles/help.css',import.meta.url),'utf8');
for(const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)){
  const selector=match[1].replace(/\/\*[\s\S]*?\*\//g,'').trim();
  for(const part of selector.split(','))assert(/^(?:#faq\b|\.page-help \+ \.site-footer\b)/.test(part.trim()),`Do not style header or other pages: ${part}`);
}
assert(!/100[sdl]?vh/.test(css));
assert(css.includes('aspect-ratio:1983/793') && css.includes('height:auto'));
for(const selector of ['faq-list','faq-item','faq-answer']){
  const rule=css.match(new RegExp(`#faq \\.${selector}\\{([^}]+)\\}`))[1];
  assert(!/(?:^|;)\s*(?:height|max-height|overflow)\s*:/.test(rule),'Expanded answers must not be clipped');
}
for(const width of [320,375,600,601,760,900,1024,1366,1536,1920]){
  const inner=Math.min(1120,width-(width<=760?40:64));
  const columns=width<=600?1:width<=1100?2:4,gap=width<=760?16:20;
  const card=(inner-gap*(columns-1))/columns;
  const text=card-26-(width<=760?52:60)-2*(width<=760?12:14)-14;
  assert(text>=130,'Categories keep enough room before wrapping');
  assert(inner<=width);
}
console.log('Passed: unchanged 8 FAQ entries, all initially collapsed, four functioning categories, direct/hash/modified-click navigation, native summary behavior, original illustration ratio, scoped content/footer CSS and responsive category budgets. (Source checks; no browser screenshots.)');

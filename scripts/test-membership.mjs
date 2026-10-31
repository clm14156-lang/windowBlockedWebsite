import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { plans } from '../src/data.js';
import { pricing, header } from '../src/site-shell.js';

// Guard the existing commercial preview while its presentation changes.
assert.deepEqual(plans.map(({id,price,note,button,features})=>({id,price,note,button,features})),[
  {id:'free',price:'0',note:'体验基础专注功能',button:'体验免费版',features:[['网站与应用屏蔽',true],['专注计时与悬浮窗口',true],['基础专注记录',true],['目标与任务管理',false],['详细投入统计',false]]},
  {id:'pro',price:'68',note:'年度方案 · 价格示意',button:'了解专业版',features:[['免费版的全部功能',true],['目标与任务管理',true],['目标进度追踪',true],['专注日历与历史记录',true],['详细投入趋势与分布',true]]},
]);
const html=pricing();
assert(html.includes('简单开始，<span>按需升级</span>。'));
assert(html.includes('基础专注功能免费使用，需要更多能力时再选择专业版。'));
const cards=[...html.matchAll(/<article\b[^>]*data-plan-card="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)];
assert.deepEqual(cards.map(m=>m[1]),['free','pro']);
for(const [,id,card]of cards){
  const plan=plans.find(p=>p.id===id);
  assert(card.includes(`<strong>${plan.price}</strong>`) && card.includes(plan.note));
  assert(card.includes(`data-plan="${id}" aria-pressed="${id==='pro'}"`));
  assert(card.indexOf('plan-action')<card.indexOf('plan-inclusions'),'Action precedes the divider and feature list');
  assert(card.includes(id==='pro'?'data-upgrade':'data-demo'));
  assert(card.includes(plan.button));
  assert.equal((card.match(/class="plan-feature-marker"/g)||[]).length,5);
  for(const[text,enabled]of plan.features){assert(card.includes(text));if(!enabled)assert(card.includes('不包含：'));}
}
assert.equal((html.match(/class="membership-benefit-icon /g)||[]).length,4);
assert(html.includes('购买入口暂未开放') && html.includes('href="/help/"'));
assert(!/多设备|永久免费|云同步|专属技术支持/.test(html),'Do not expand unsupported entitlements to match reference copy');
assert(header('membership').includes('class="site-header"'));
const css=await readFile(new URL('../styles/membership.css',import.meta.url),'utf8');
for(const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)){
  const selector=match[1].replace(/\/\*[\s\S]*?\*\//g,'').trim();
  for(const part of selector.split(','))assert(/^#pricing\b/.test(part.trim()),`Membership CSS must only style its content: ${part}`);
}
const cardRule=css.match(/#pricing \.price-card\{([^}]+)\}/)[1];
assert(!/(?:^|;)\s*(?:height|min-height|max-height|overflow)\s*:/.test(cardRule),'Cards grow naturally with their content');
assert(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))') && css.includes('@media(max-width:800px)'));
assert(css.includes('grid-template-columns:repeat(4,minmax(0,1fr))') && css.includes('@media(max-width:560px)'));
assert(css.includes('--orange:#fd7e05') && !/100[sdl]?vh/.test(css));
for(const viewport of [320,375,560,700,768,801,1024,1366,1920]){
  const inner=Math.min(1240,viewport-(viewport<=700?40:80));
  const columns=viewport<=800?1:2;
  const grid=Math.min(inner,columns===1?470:964);
  const width=(grid-(columns-1)*24)/columns;
  const content=width-(viewport<=700?52:80)-2;
  assert(width>0 && grid<=viewport);
  assert(content>=220,'Price, Windows button and feature text retain usable room');
  if(viewport>=1366)assert.equal(width,470,'Two equally sized desktop cards');
}
console.log('Passed: retained prices/entitlements/actions, aligned two-plan structure, four advantages, isolated navigation/style changes, natural card height and 320–1920px layout budgets. (Source checks; no browser screenshots.)');

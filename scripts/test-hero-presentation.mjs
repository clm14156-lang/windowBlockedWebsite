import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { hero, renderSite } from '../src/components.js';
import { heroShowcaseGeometry, heroShowcaseRange, heroShowcaseFrame, initHeroScrollShowcase } from '../src/hero-scroll-showcase.js';

const html=hero();
assert.equal((html.match(/<img\b/g)||[]).length,2);
assert(html.includes('/assets/product/image1.png') && html.includes('/assets/product/xuanfuyemian.png'));
assert(!/feature-index|data-hero-time|data-hero-toggle|hero-countdown|focus-window|focus-time/.test(html));
assert.equal((html.match(/class="hero-actions"/g)||[]).length,1,'Keep one original action row');
assert(!/hero-scroll-pin/.test(html),'No pinned/sticky presentation wrapper');
const list=html.match(/<ul class="hero-benefits"[\s\S]*?<\/ul>/)[0];
assert.equal((list.match(/<li>/g)||[]).length,4);assert(!/<a\b|<button\b/.test(list));
for(const text of ['屏蔽干扰','轻巧悬浮','目标与任务','记录投入'])assert(list.includes(text));
for(const [file,width,height] of [['image1.png',867,756],['xuanfuyemian.png',1108,1420]]){
 const data=await readFile(new URL(`../assets/product/${file}`,import.meta.url));
 assert.equal(data.readUInt32BE(16),width);assert.equal(data.readUInt32BE(20),height);
}
await assert.rejects(access(new URL('../src/hero-presentation.js',import.meta.url)),{code:'ENOENT'});
const css=await readFile(new URL('../styles.css',import.meta.url),'utf8');
const imageRule=css.match(/#home \.hero-home-preview img\{([^}]+)\}/)[1];
assert(imageRule.includes('height:auto') && imageRule.includes('transform-origin:top left'));
assert(imageRule.includes('rotateX(var(--hero-main-angle,10deg))') && !/scale[XY]\(/.test(imageRule));
const floatingRule=css.match(/#home \.hero-floating-preview\{([^}]+)\}/)[1];
const mainLayer=css.match(/#home \.hero-home-preview\{([^}]+)\}/)[1];
const stageRule=css.match(/#home \.hero-stage\{([^}]+)\}/)[1];
assert(mainLayer.includes('z-index:1') && floatingRule.includes('z-index:3'),'Floating window paints above the perspective software layer');
assert(stageRule.includes('isolation:isolate') && stageRule.includes('overflow:visible') && mainLayer.includes('overflow:visible'),'Keep the overlay and its shadow in an unclipped local stacking context');
assert(floatingRule.includes('position:absolute') && floatingRule.includes('translateX(var(--hero-floating-x,0px))'));
assert(floatingRule.includes('drop-shadow(0 16px 24px #20344f1a)'),'Use a soft, alpha-shaped shadow for the original transparent PNG');
assert(!/feature-index/.test(css));
for(const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)){
 if(!match[1].includes('#home'))continue;
 assert(!/position\s*:\s*(?:sticky|fixed)|--hero-(?:track-height|pin-height|pin-top)/.test(match[2]),'All hero elements stay in normal page flow');
 if(match[1].includes('.hero-scroll-track'))assert(!/(?:^|;)\s*(?:height|min-height)\s*:/.test(match[2]),'No scroll spacer');
}
assert(css.includes('#home .hero-home-preview img,#home .hero-floating-preview,#home .hero-benefits{transition:none;animation:none}'),'No timed CSS interpolation after scroll progress changes');
const controllerSource=await readFile(new URL('../src/hero-scroll-showcase.js',import.meta.url),'utf8');
assert(!/setTimeout\(|setInterval\(|\.animate\(|preventDefault\(|scrollTo\(|scrollIntoView\(/.test(controllerSource),'No independent playback, input lock or forced scrolling');
for(const [physicalWidth,physicalHeight] of [[320,640],[375,812],[760,600],[1024,768],[1366,768],[1920,1080]]){
 for(const zoom of [1,.75,.5,.25]){
  const width=physicalWidth/zoom,height=physicalHeight/zoom;
  const stageWidth=Math.min(1040,width-(width<=760?48:96));
  const g=heroShowcaseGeometry(stageWidth,height,52,32,width<=600?248:120,width<=760?68:76);
  assert(g.distance>=280 && g.distance<=440);
  const stageTop=430,range=heroShowcaseRange(stageTop,g);
  assert(range.start>=0 && range.distance>0 && range.distance<=g.distance);
  assert.equal(stageTop-range.end,g.top,'Finish before the naturally scrolling software passes under navigation');
  const start=heroShowcaseFrame(0,g),end=heroShowcaseFrame(1,g);
  assert.equal(start.angle,10);assert.equal(start.scale,.98);assert.equal(start.x,stageWidth*.01);
  assert.equal(start.floatingOpacity,0);assert.equal(start.benefitsOpacity,0);
  assert.equal(end.angle,0);assert.equal(end.scale,g.scale);assert.equal(end.x,0);
  assert.equal(end.floatingOpacity,1);assert.equal(end.benefitsOpacity,1);
  assert(g.floatingWidth<stageWidth*g.scale,'The main software stays larger than the floating panel');
  const overlap=stageWidth*g.scale-end.floatingX;
  assert(overlap>=g.floatingWidth*.5 && overlap<=g.floatingWidth*.6,'Roughly half the floating window overlaps the software');
  assert.equal(end.floatingX,g.floatingX);assert(start.floatingX>=end.floatingX+24-.001,'Enter from the right with responsive travel space');
  assert(Math.abs(end.floatingY-g.floatingY)<1e-9);
  const frames=[];
  let previous=start;
  for(let i=0;i<=100;i++){
   const f=heroShowcaseFrame(i/100,g);frames.push(f);
   assert(f.angle<=previous.angle+.0001 && f.scale<=previous.scale+.0001);
   assert(f.floatingOpacity>=previous.floatingOpacity && f.benefitsOpacity>=previous.benefitsOpacity);
   assert.equal(f.floatingOpacity,1-(1-i/100)**3,'Ease-out remains an exact function of current scroll progress');
   assert.equal(f.benefitsOpacity,i/100,'Keep the existing benefits timeline');
   assert(f.floatingX<=previous.floatingX,'The entrance always slides right to left when scrolling down');
   assert(Math.abs(f.angle-(1-i/100)*10)<1e-12,'Rotation maps directly to scroll position');
   assert(Math.abs(f.visibleHeight-previous.visibleHeight)<g.naturalHeight*.04,'No jumps between neighboring scroll positions');
   assert(Math.abs(f.stageHeight-previous.stageHeight)<g.naturalHeight*.04,'The following section moves continuously with the same timeline');
   assert.equal(f.stageHeight,f.visibleHeight+g.gap+f.benefitsOffset+g.benefitsHeight,'The stage follows its contents, without a scroll runway or overlap');
   const denominator=1-g.naturalHeight*f.scale*Math.sin(f.angle*Math.PI/180)/2400;
   const mainBottom=g.naturalHeight*f.scale*Math.cos(f.angle*Math.PI/180)/denominator;
   const floatingWindowBottom=f.floatingY+g.floatingWidth*1303/1108;
   assert(Math.abs(floatingWindowBottom-mainBottom)<1e-9,'Visible window bottoms align throughout the timeline, including transparent PNG padding');
   const center=stageWidth/2,stageLeft=(width-stageWidth)/2;
   const left=Math.min(f.x,center+(f.x-center)/denominator),right=Math.max(f.x+stageWidth*f.scale,center+(f.x+stageWidth*f.scale-center)/denominator);
   assert(stageLeft+left>=-.001 && stageLeft+right<=width+.001,'Projected software stays inside the viewport');
   assert(stageLeft+f.floatingX+g.floatingWidth<=width+.001);
   previous=f;
  }
  for(let i=100;i>=0;i--)assert.deepEqual(heroShowcaseFrame(i/100,g),frames[i],'Upward scroll exactly reverses the same path');
  assert.deepEqual(heroShowcaseFrame(-1,g),start);assert.deepEqual(heroShowcaseFrame(2,g),end);
  const viewportY=progress=>stageTop-(range.start+progress*range.distance);
  assert(viewportY(.75)<viewportY(.25),'The software and background continue moving up while the timeline advances');
 }
}

const names=['window','document','matchMedia','ResizeObserver','requestAnimationFrame','cancelAnimationFrame','getComputedStyle','scrollY','innerHeight'];
const previous=new Map(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
const events={},motionEvents={},frames=new Map(),variables={},attributes=()=>({attributes:{},style:{},setAttribute(name,value){this.attributes[name]=value;}});
let nextFrame=0,disconnected=false,layoutReads=0;
const observed=[];
const stage={clientWidth:1040,getBoundingClientRect(){layoutReads++;return {top:504-globalThis.scrollY};}},actions={offsetHeight:52},benefits=Object.assign(attributes(),{offsetHeight:120});
const main={parentElement:{}};
let decoded;
const floating=Object.assign(attributes(),{complete:false,naturalWidth:0,decode:()=>new Promise(resolve=>{decoded=resolve;})});
const root={dataset:{},style:{setProperty(name,value){variables[name]=value;}},querySelector:selector=>({'[data-hero-stage]':stage,'.hero-actions':actions,'[data-hero-main]':main,'[data-hero-floating]':floating,'[data-hero-benefits]':benefits}[selector])};
const motion={matches:false,addEventListener(name,fn){motionEvents[name]=fn;},removeEventListener(name){delete motionEvents[name];}};
function flush(){for(const [id,fn] of [...frames]){frames.delete(id);fn();}}
try{
 globalThis.window={addEventListener(name,fn,options){events[name]={fn,options};},removeEventListener(name){delete events[name];}};
 globalThis.document={getElementById:()=>({offsetHeight:76})};
 globalThis.matchMedia=()=>motion;
 globalThis.ResizeObserver=class{observe(element){observed.push(element);}disconnect(){disconnected=true;}};
 globalThis.requestAnimationFrame=fn=>{const id=++nextFrame;frames.set(id,fn);return id;};
 globalThis.cancelAnimationFrame=id=>frames.delete(id);
 globalThis.getComputedStyle=()=>({marginTop:'32px'});
 globalThis.scrollY=0;globalThis.innerHeight=1080;
 assert.equal(initHeroScrollShowcase(null),null);
 const controller=initHeroScrollShowcase(root);
 assert.equal(variables['--hero-main-angle'],'10deg');assert.equal(variables['--hero-floating-opacity'],'0');
 assert.equal(events.scroll.options.passive,true);assert(!events.wheel && !events.touchmove && !events.keydown);
 assert.deepEqual(observed,[main.parentElement,actions,benefits]);assert(!observed.includes(stage),'Animated height does not retrigger ResizeObserver');
 assert(!('--hero-track-height' in variables) && !('--hero-pin-height' in variables));
 const reads=layoutReads;
 globalThis.scrollY=208;events.scroll.fn();events.scroll.fn();assert.equal(frames.size,1);flush();
 assert.equal(variables['--hero-main-angle'],'5deg');assert.equal(layoutReads,reads,'Scroll frames do not force layout reads');
 const halfway={...variables};flush();assert.deepEqual(variables,halfway,'Pausing scroll immediately pauses the entire timeline');
 globalThis.scrollY=416;events.scroll.fn();flush();
 assert.equal(variables['--hero-main-angle'],'0deg');assert.equal(variables['--hero-benefits-opacity'],'1');assert.equal(variables['--hero-floating-opacity'],'0','An undecoded image never blocks the rest of the timeline');
 globalThis.scrollY=208;events.scroll.fn();flush();assert.equal(variables['--hero-main-angle'],'5deg');
 await Promise.resolve();floating.naturalWidth=1108;decoded();await new Promise(resolve=>setTimeout(resolve,0));flush();
 assert.equal(floating.attributes['aria-hidden'],'false');
 const geometry=heroShowcaseGeometry(1040,1080,52,32,120,76);
 for(const progress of [.99,.2,.8,.05,1,.3,0,.5]){
  globalThis.scrollY=416*progress;events.scroll.fn();flush();
  const frame=heroShowcaseFrame(progress,geometry);
  assert.equal(Number(variables['--hero-main-scale']),frame.scale);
  assert.equal(Number(variables['--hero-floating-opacity']),frame.floatingOpacity);
  assert.equal(Number(variables['--hero-benefits-opacity']),progress);
  assert.equal(Number.parseFloat(variables['--hero-stage-height']),frame.stageHeight);
  assert.equal(frames.size,0,'No follow-on animation frames or playback waits after any scroll speed/direction');
 }
 globalThis.scrollY=416;events.scroll.fn();flush();assert.equal(variables['--hero-main-angle'],'0deg');assert.equal(variables['--hero-benefits-opacity'],'1');
 const completed={...variables};globalThis.scrollY=600;events.scroll.fn();flush();assert.deepEqual(variables,completed,'After completion only native page movement continues');
 globalThis.scrollY=0;events.scroll.fn();flush();assert.equal(variables['--hero-main-angle'],'10deg');assert.equal(variables['--hero-benefits-opacity'],'0');
 stage.clientWidth=800;globalThis.innerHeight=768;events.resize.fn();assert(Number.parseFloat(variables['--hero-stage-height'])>0);
 motion.matches=true;motionEvents.change();assert.equal(variables['--hero-main-angle'],'0deg');assert.equal(root.dataset.heroReducedMotion,'true');
 controller.destroy();assert(disconnected && !events.scroll && !events.resize && frames.size===0);
}finally{for(const [name,descriptor]of previous){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
const sections=[...renderSite().matchAll(/<section\b[^>]*id="([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(sections,['home','features','floating','personalization','blocking','goals','statistics','impact','closing']);
console.log('Passed: original main-software geometry, foreground overlap, right-to-left eased entrance, visible bottom-edge alignment throughout the timeline, PNG padding compensation, soft shadow, responsive bounds, reversible scroll and reduced motion. (Source, state and geometry checks; no browser screenshots.)');

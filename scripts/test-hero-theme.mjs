import assert from 'node:assert/strict';
import { initHeroTheme, heroThemes } from '../src/hero-theme.js';
import { hero } from '../src/components.js';

const element = dataset => ({ dataset, attributes:{}, textContent:'', classList:{toggle(name,value){this[name]=value;}}, setAttribute(name,value){this.attributes[name]=value;}, focus(){this.focused=true;}, closest(){return this;} });
const buttons=heroThemes.map(theme=>element({heroMode:theme.id}));
const images=heroThemes.map(()=>Array.from({length:2},()=>({naturalWidth:800,complete:true,decode:()=>Promise.resolve()})));
const layers=heroThemes.map((theme,i)=>Object.assign(element({heroScene:theme.id}),{querySelectorAll:()=>images[i]}));
const preview=element({heroTheme:'day'}),greeting=element({}),note=element({}),status=element({}),events={};
const nodes={'[data-hero-theme]':preview,'[data-hero-greeting]':greeting,'[data-hero-greeting-note]':note,'[data-hero-theme-status]':status};
const root={querySelector:selector=>nodes[selector],querySelectorAll:selector=>selector==='[data-hero-mode]'?buttons:layers,addEventListener(name,handler){events[name]=handler;}};
const controller=initHeroTheme(root);
function expectMode(id){
  assert.equal(preview.dataset.heroTheme,id);
  buttons.forEach(button=>assert.equal(button.attributes['aria-pressed'],String(button.dataset.heroMode===id)));
  layers.forEach(layer=>assert.equal(layer.classList['is-active'],layer.dataset.heroScene===id));
}
expectMode('day');
assert.equal(greeting.textContent,'下午好');

let finish;
const pending=new Promise(resolve=>{finish=resolve;});
images[1].forEach(image=>{image.decode=()=>pending;});
const selecting=controller.select('night');
expectMode('day');
assert.equal(buttons[1].attributes['aria-busy'],'true');
finish();
assert.equal(await selecting,true);
expectMode('night');
assert.equal(greeting.textContent,'晚上好');
assert(status.textContent.includes('夜晚'));

let finishDay;
const delayedDay=new Promise(resolve=>{finishDay=resolve;});
images[0].forEach(image=>{image.decode=()=>delayedDay;});
const stale=controller.select('day');
assert.equal(await controller.select('night'),true);
finishDay();
assert.equal(await stale,false,'An outdated image request must not overwrite the latest selection');
expectMode('night');
images[0].forEach(image=>{image.decode=()=>Promise.resolve();});
await controller.select('day');
images[1][0].decode=()=>Promise.reject(new Error('Missing image'));
assert.equal(await controller.select('night'),false);
expectMode('day');
assert(status.textContent.includes('请重试'));

images[1].forEach(image=>{image.decode=()=>Promise.resolve();});
let prevented=false;
events.keydown({target:buttons[0],key:'End',preventDefault(){prevented=true;}});
await new Promise(resolve=>setTimeout(resolve,0));
expectMode('night');assert(prevented&&buttons[1].focused);
events.click({target:buttons[0]});
await new Promise(resolve=>setTimeout(resolve,0));
expectMode('day');
assert.equal(await controller.select('invalid'),false);
assert.equal(initHeroTheme(null),null);

const html=hero();
assert(html.includes('data-hero-theme="day"'));
assert.equal((html.match(/data-hero-scene=/g)||[]).length,2);
assert.equal((html.match(/data-hero-mode=/g)||[]).length,2);
for(const theme of heroThemes)assert(html.includes(theme.id==='day'?'/assets/focus03.png':theme.background)&&html.includes(theme.character));
assert.equal((html.match(/data-hero-time/g)||[]).length,1,'Theme changes retain the main clock without recreating the removed floating preview');
console.log('Passed: default day, paired artwork, decoded-image switching, selected/ARIA state, rapid-click cancellation, image failure fallback, keyboard/click control and shared clock markup.');

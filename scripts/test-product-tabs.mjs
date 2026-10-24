import assert from 'node:assert/strict';
import { initProductTabs } from '../src/product-tabs.js';
const node = () => ({ attributes:{}, active:false, inert:false, classList:{toggle(name,value){this[name]=value;}},setAttribute(name,value){this.attributes[name]=value;},focus(){this.focused=true;},closest(){return this;} });
const tabs=Array.from({length:3},node),panels=Array.from({length:3},node),events={};
const root={querySelectorAll:selector=>selector==='tab'?tabs:panels,addEventListener(name,fn){events[name]=fn;}};
const controller=initProductTabs(root,'tab','panel');
function selected(index){
  tabs.forEach((tab,i)=>{
    assert.equal(tab.attributes['aria-selected'],String(i===index));
    assert.equal(tab.tabIndex,i===index?0:-1);
    assert.equal(panels[i].inert,i!==index);
    assert.equal(panels[i].attributes['aria-hidden'],String(i!==index));
  });
}
selected(0);
events.click({target:tabs[2]});selected(2);
let prevented=false;
events.keydown({target:tabs[2],key:'ArrowRight',preventDefault(){prevented=true;}});selected(0);assert(prevented&&tabs[0].focused);
events.keydown({target:tabs[0],key:'End',preventDefault(){}});selected(2);
events.keydown({target:tabs[2],key:'Home',preventDefault(){}});selected(0);
events.keydown({target:tabs[0],key:'ArrowUp',preventDefault(){}});selected(2);
controller.select(1);selected(1);
events.click({target:{closest:()=>null}});selected(1);
assert.equal(initProductTabs(null,'tab','panel'),null);
console.log('Passed: product tabs preserve one active panel, inert/ARIA state, click switching, arrow wrapping, Home/End and keyboard focus.');

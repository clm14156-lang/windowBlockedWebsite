import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { initHeroTheme, heroThemes } from '../src/hero-theme.js';
import { focusCharacters } from '../src/focus-characters.js';
import { renderSite } from '../src/components.js';
import { personalizationPreview, personalizationCharacters } from '../src/personalization-preview.js';
import { initPersonalizationTimer, personalizationDuration } from '../src/personalization-timer.js';

function node(dataset = {}) {
  return {
    dataset, attributes: {}, textContent: '',
    classList: { toggle(name, value) { this[name] = value; } },
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { this.focused = true; }, scrollIntoView() {},
    closest(selector) { return selector === '[data-character-select]' && this.dataset.characterSelect || selector === '[data-hero-mode]' && this.dataset.heroMode ? this : null; },
  };
}
function fixture(characters = focusCharacters, initialComparison = false, staticThumbnails = false) {
  const buttons = heroThemes.map(theme => node({ heroMode: theme.id }));
  const cards = characters.map(character => node({ characterSelect: character.id }));
  const images = heroThemes.map(() => [Object.assign(node(), { naturalWidth: 1448, decode: async () => {} }), ...characters.map(character => Object.assign(node({ characterImage: character.id }), { naturalWidth: 800, decode: async () => {} }))]);
  const layers = heroThemes.map((theme, i) => Object.assign(node({ heroScene: theme.id }), { querySelectorAll: () => images[i] }));
  const thumbnails = (staticThumbnails ? characters : heroThemes).map(theme => Object.assign(node({ themeThumbnail: staticThumbnails ? 'day' : theme.id }), { querySelectorAll: () => [] }));
  if (staticThumbnails) thumbnails.forEach(thumbnail => { thumbnail.classList['is-active'] = true; });
  const preview = node(), greeting = node(), note = node(), status = node(), events = {};
  const selectors = { '[data-hero-mode]': buttons, '[data-hero-scene]': layers, '[data-character-select]': cards, '[data-character-image]': images.flat().filter(image => image.dataset.characterImage), '[data-theme-thumbnail]': staticThumbnails ? [] : thumbnails };
  const elements = { '[data-hero-theme]': preview, '[data-hero-greeting]': greeting, '[data-hero-greeting-note]': note, '[data-hero-theme-status]': status };
  const root = { querySelector: selector => elements[selector], querySelectorAll: selector => selectors[selector], addEventListener(name, handler) { events[name] = handler; } };
  const controller = initHeroTheme(root, { characters, initialComparison });
  function selected(theme, id) {
    assert.deepEqual(controller.getState(), { theme, character: id });
    assert.equal(preview.dataset.heroTheme, theme); assert.equal(preview.dataset.character, id);
    layers.forEach(layer => assert.equal(layer.classList['is-active'], preview.dataset.heroComparison==='true' || layer.dataset.heroScene === theme));
    cards.forEach(card => assert.equal(card.attributes['aria-pressed'], String(card.dataset.characterSelect === id)));
    buttons.forEach(button => assert.equal(button.attributes['aria-pressed'], String(button.dataset.heroMode === theme)));
    for (const image of images.flat().filter(image => image.dataset.characterImage)) assert.equal(image.classList['is-selected'], image.dataset.characterImage === id);
    thumbnails.forEach(thumbnail => assert.equal(thumbnail.classList['is-active'], staticThumbnails || thumbnail.dataset.themeThumbnail === theme));
  }
  return { controller, selected, images, layers, cards, buttons, events, status, preview, thumbnails };
}

const f = fixture();
f.selected('day', 'girl');
for (const character of focusCharacters) {
  assert.equal(await f.controller.selectCharacter(character.id), true); f.selected('day', character.id);
  assert.equal(await f.controller.select('night'), true); f.selected('night', character.id);
  assert.equal(await f.controller.select('day'), true); f.selected('day', character.id);
}
await f.controller.selectCharacter('girl');
let finishOld;
f.images[1][1].decode = () => new Promise(resolve => { finishOld = resolve; });
const pendingNight = f.controller.select('night');
f.selected('day', 'girl');
assert.equal(await f.controller.selectCharacter('fox'), true);
f.selected('night', 'fox');
finishOld(); assert.equal(await pendingNight, false); f.selected('night', 'fox');
f.images[1][1].decode = async () => {};

let finishRabbit;
const rabbitIndex = focusCharacters.findIndex(character => character.id === 'rabbit') + 1;
f.images[1][rabbitIndex].decode = () => new Promise(resolve => { finishRabbit = resolve; });
const pendingRabbit = f.controller.selectCharacter('rabbit');
assert.equal(await f.controller.select('day'), true); f.selected('day', 'rabbit');
finishRabbit(); assert.equal(await pendingRabbit, false); f.selected('day', 'rabbit');
f.images[1][rabbitIndex].decode = async () => {};

f.images[1][rabbitIndex].decode = async () => { throw new Error('Image failed'); };
assert.equal(await f.controller.select('night'), false); f.selected('day', 'rabbit');
assert(f.status.textContent.includes('请重试') && f.status.classList['is-error']);
assert(f.buttons.every(button => button.attributes['aria-busy'] === 'false'));
f.images[1][rabbitIndex].decode = async () => {};
f.events.click({ target: f.cards[2] });
await new Promise(resolve => setTimeout(resolve, 0)); f.selected('day', 'leisure');
let prevented = false;
f.events.keydown({ target: f.cards[2], key: 'End', preventDefault() { prevented = true; } });
await new Promise(resolve => setTimeout(resolve, 0)); f.selected('day', 'rabbit'); assert(prevented && f.cards.at(-1).focused);
f.events.keydown({ target: f.cards.at(-1), key: 'ArrowRight', preventDefault() {} });
await new Promise(resolve => setTimeout(resolve, 0)); f.selected('day', 'girl');
assert.equal(await f.controller.selectCharacter('missing'), false);

const incomplete = structuredClone(focusCharacters);
delete incomplete.find(character => character.id === 'fox').artwork.night;
const missing = fixture(incomplete);
await missing.controller.selectCharacter('fox');
assert.equal(await missing.controller.select('night'), false);
missing.selected('day', 'fox'); assert(missing.status.textContent.includes('暂无夜晚素材'));
await missing.controller.selectCharacter('girl');
await missing.controller.select('night'); missing.selected('night', 'girl');
f.selected('day', 'girl'); // Separate previews keep their selection while using one controller implementation.

// The actual page offers only its original first four roles; the resource catalog stays intact.
assert.deepEqual(personalizationCharacters,focusCharacters.slice(0,4));
const comparison=fixture(personalizationCharacters,true);
comparison.selected('day','girl');
assert.equal(comparison.preview.dataset.heroComparison,'true');
await comparison.controller.selectCharacter('leisure');comparison.selected('day','leisure');
assert(comparison.layers.every(layer=>layer.classList['is-active']));
comparison.images[1][2].decode=async()=>{throw new Error('Night role failed');};
assert.equal(await comparison.controller.selectCharacter('boy'),false,'A split preview waits for both day and night before replacing a role');
comparison.selected('day','leisure');assert.equal(comparison.preview.dataset.heroComparison,'true');
comparison.images[1][2].decode=async()=>{};
await comparison.controller.select('day');comparison.selected('day','leisure');
assert.equal(comparison.preview.dataset.heroComparison,'false','Selecting the already highlighted day control still opens the full day scene');
for(const role of personalizationCharacters){
  await comparison.controller.selectCharacter(role.id);comparison.selected('day',role.id);
  await comparison.controller.select('night');comparison.selected('night',role.id);
  await comparison.controller.select('day');comparison.selected('day',role.id);
}
assert.equal(await comparison.controller.selectCharacter('koala'),false);
comparison.events.keydown({target:comparison.cards[0],key:'End',preventDefault(){}});
await new Promise(resolve=>setTimeout(resolve,0));comparison.selected('day','fox');
assert.equal(comparison.cards.length,4);

// The actual selection cards are fixed day pictures and have no theme-controller marker.
const fixedCards = fixture(personalizationCharacters, false, true);
for (const role of personalizationCharacters) {
  await fixedCards.controller.selectCharacter(role.id);
  await fixedCards.controller.select('night'); fixedCards.selected('night',role.id);
  await fixedCards.controller.select('day'); fixedCards.selected('day',role.id);
  assert(fixedCards.thumbnails.every(thumbnail => thumbnail.dataset.themeThumbnail === 'day' && thumbnail.classList['is-active']));
}

const paths = new Set();
for (const character of focusCharacters) for (const theme of heroThemes) {
  const art = character.artwork[theme.id];
  assert(art, `${character.id}: ${theme.id} mapping`);
  assert(art.src.includes(theme.id === 'day' ? '/white_' : '/dark_'));
  const data = await readFile(new URL(`..${art.src}`, import.meta.url));
  assert.equal(data.readUInt32BE(16), art.width); assert.equal(data.readUInt32BE(20), art.height);
  assert.equal(data[25], 6, 'Original role PNG must retain RGBA transparency');
  await access(new URL(`..${art.webp}`, import.meta.url));
  paths.add(art.src.split('/').at(-1));
}
assert.deepEqual([...paths].sort(), (await readdir(new URL('../assets/juese/', import.meta.url))).filter(name => name.endsWith('.png')).sort(), 'Every original role is mapped once per theme');
const section = personalizationPreview();
assert.equal((section.match(/data-character-select="/g) || []).length, 4);
assert.equal((section.match(/data-character-image="/g) || []).length, 8);
assert.deepEqual([...section.matchAll(/data-character-select="([^"]+)"/g)].map(m=>m[1]),['girl','boy','leisure','fox']);
const roleCards = [...section.matchAll(/<button type="button" class="character-option"[^>]*>([\s\S]*?)<\/button>/g)];
roleCards.forEach(([_,card],i)=>{
  assert(card.includes(personalizationCharacters[i].artwork.day.src));
  assert(!/\/dark_|data-theme-thumbnail/.test(card),'Left cards must never opt into night artwork switching');
});
assert(section.includes('/assets/white_background01.png') && !section.includes('/assets/white_background01.webp'));
assert(section.includes('data-personalization-time') && section.includes('data-personalization-progress'));
assert(!/personalization-top|personalization-scenery|personalization-scene-thumbnail|<br\/>拥有/.test(section));
assert(section.indexOf('personalization-copy')<section.indexOf('personalization-showcase'));
assert(section.indexOf('personalization-showcase')<section.indexOf('hero-theme-switch'));
assert(section.indexOf('hero-theme-switch')<section.indexOf('personalization-characters'));
assert(section.includes('class="personalization-layout"') && section.includes('个性化体验'));
assert(section.includes('data-hero-theme="day"') && !section.includes('data-hero-comparison="true"'),'The full-size preview starts with the day theme');
assert.equal((section.match(/class="personalization-benefit-copy"/g)||[]).length,4);
for(const text of ['多种主题风格','丰富的角色选择','个性化氛围','沉浸式专注体验'])assert(section.includes(text));
const html = renderSite();
const ids = [...html.matchAll(/<section\b[^>]*id="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(ids.slice(1,4), ['features', 'floating', 'personalization']);
assert.equal(ids.filter(id=>id==='personalization').length,1);
assert.equal(ids.at(-1),'closing');
assert(section.includes('让专注，') && section.includes('自己的风格') && section.includes('从主题到角色，打造属于你的专注时光。'));
const css=await readFile(new URL('../styles.css',import.meta.url),'utf8');
assert(css.includes('grid-template-areas:"intro showcase" "characters showcase"'));
assert(css.includes('.personalization-layout{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,5fr)'));
assert(css.includes('.character-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))'));
assert(css.includes('@media(max-width:1000px)') && css.includes('grid-template-areas:"intro" "showcase" "characters"'));
assert(css.includes('aspect-ratio:31/20') && !/personalization-top|personalization-scenery|grid-auto-columns:148px/.test(css));
assert(css.includes('scaleX(var(--personalization-progress,1))') && css.includes('transform-origin:left'));
for(const width of [320,375,600,760,900,1000,1001,1024,1366,1536,1920,2560]){
  const inner=Math.min(1280,width-(width<=760?40:80));
  const desktop=width>1000,gap=width<=1100?32:40;
  const sidebar=desktop?(inner-gap)*3/8:Math.min(560,inner);
  const preview=desktop?(inner-gap)*5/8:Math.min(800,inner);
  const card=(sidebar-4-14)/2;
  assert(card-2-(width<=760?20:28)>=104,'Two-column role cards retain room for uncropped artwork');
  if(desktop){assert(preview>sidebar);assert(Math.abs(sidebar+gap+preview-inner)<1e-8,'Desktop columns fit without horizontal overflow');}
  assert(preview<=inner && sidebar<=inner);
  const previewHeight=preview*20/31;
  const clockBottom=previewHeight*.27+preview*.08*1.15;
  const characterTop=previewHeight*.88-preview*.28;
  assert(characterTop>clockBottom,'The countdown stays above the larger character at every size');
}
let stamp = 12345;
const clock = { textContent:'' }, progress = { attributes:{}, setAttribute(name,value){this.attributes[name]=value;} }, properties={};
const timerRoot = { querySelector: selector=>selector==='[data-personalization-time]'?clock:progress, style:{setProperty(name,value){properties[name]=value;}} };
assert.equal(initPersonalizationTimer(null),null);
assert.equal(initPersonalizationTimer({querySelector(){return null;}}),null);
const timer = initPersonalizationTimer(timerRoot,{now:()=>stamp});
assert.equal(personalizationDuration,1500);assert.equal(clock.textContent,'25:00');assert.equal(properties['--personalization-progress'],'1');
stamp=12345+999;timer.tick();assert.equal(clock.textContent,'25:00');
stamp=12345+1000;timer.tick();assert.equal(clock.textContent,'24:59');
stamp=12345+3400;timer.tick();assert.equal(clock.textContent,'24:57','Delayed callbacks catch up using elapsed time');
stamp=12345+750000;timer.tick();assert.equal(clock.textContent,'12:30');assert.equal(properties['--personalization-progress'],'0.5');
await fixedCards.controller.select('night');await fixedCards.controller.selectCharacter('girl');
timer.tick();assert.equal(clock.textContent,'12:30','Theme and character selection do not restart the countdown');
stamp=12345+1499000;timer.tick();assert.equal(clock.textContent,'00:01');assert.equal(timer.getRemaining(),1);
stamp=12345+1500000;timer.tick();assert.equal(clock.textContent,'00:00');assert.equal(properties['--personalization-progress'],'0');assert.equal(progress.attributes['aria-valuenow'],'0');
stamp=12345+2000000;timer.tick();assert.equal(timer.getRemaining(),0,'The preview stops at zero without restarting or going negative');
console.log('Passed: fixed day cards, paired preview themes, new original day background, elapsed 25-minute countdown and synchronized progress, delayed tick catch-up, no selection reset, zero endpoint, existing keyboard/error handling and unchanged responsive layout. (Source/state/geometry checks; no browser screenshots.)');

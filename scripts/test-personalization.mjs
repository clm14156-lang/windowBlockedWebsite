import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { initHeroTheme, heroThemes } from '../src/hero-theme.js';
import { focusCharacters } from '../src/focus-characters.js';
import { renderSite } from '../src/components.js';
import { personalizationPreview } from '../src/personalization-preview.js';

function node(dataset = {}) {
  return {
    dataset, attributes: {}, textContent: '',
    classList: { toggle(name, value) { this[name] = value; } },
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { this.focused = true; }, scrollIntoView() {},
    closest(selector) { return selector === '[data-character-select]' && this.dataset.characterSelect || selector === '[data-hero-mode]' && this.dataset.heroMode ? this : null; },
  };
}
function fixture(characters = focusCharacters) {
  const buttons = heroThemes.map(theme => node({ heroMode: theme.id }));
  const cards = characters.map(character => node({ characterSelect: character.id }));
  const images = heroThemes.map(() => [Object.assign(node(), { naturalWidth: 1448, decode: async () => {} }), ...characters.map(character => Object.assign(node({ characterImage: character.id }), { naturalWidth: 800, decode: async () => {} }))]);
  const layers = heroThemes.map((theme, i) => Object.assign(node({ heroScene: theme.id }), { querySelectorAll: () => images[i] }));
  const thumbnails = heroThemes.map(theme => Object.assign(node({ themeThumbnail: theme.id }), { querySelectorAll: () => [] }));
  const preview = node(), greeting = node(), note = node(), status = node(), events = {};
  const selectors = { '[data-hero-mode]': buttons, '[data-hero-scene]': layers, '[data-character-select]': cards, '[data-character-image]': images.flat().filter(image => image.dataset.characterImage), '[data-theme-thumbnail]': thumbnails };
  const elements = { '[data-hero-theme]': preview, '[data-hero-greeting]': greeting, '[data-hero-greeting-note]': note, '[data-hero-theme-status]': status };
  const root = { querySelector: selector => elements[selector], querySelectorAll: selector => selectors[selector], addEventListener(name, handler) { events[name] = handler; } };
  const controller = initHeroTheme(root, { characters });
  function selected(theme, id) {
    assert.deepEqual(controller.getState(), { theme, character: id });
    assert.equal(preview.dataset.heroTheme, theme); assert.equal(preview.dataset.character, id);
    layers.forEach(layer => assert.equal(layer.classList['is-active'], layer.dataset.heroScene === theme));
    cards.forEach(card => assert.equal(card.attributes['aria-pressed'], String(card.dataset.characterSelect === id)));
    buttons.forEach(button => assert.equal(button.attributes['aria-pressed'], String(button.dataset.heroMode === theme)));
    for (const image of images.flat().filter(image => image.dataset.characterImage)) assert.equal(image.classList['is-selected'], image.dataset.characterImage === id);
    thumbnails.forEach(thumbnail => assert.equal(thumbnail.classList['is-active'], thumbnail.dataset.themeThumbnail === theme));
  }
  return { controller, selected, images, cards, buttons, events, status, preview };
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
assert.equal((section.match(/data-character-select="/g) || []).length, 7);
assert.equal((section.match(/data-character-image="/g) || []).length, 14);
const html = renderSite();
const ids = [...html.matchAll(/<section\b[^>]*id="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(ids.slice(-2), ['personalization', 'closing']);
assert(section.includes('让专注，') && section.includes('自己的风格。') && section.includes('从主题到角色，打造属于你的专注时光。'));
console.log('Passed: all seven day/night role pairs, retained role across themes, combined rapid selections, keyboard/click state, missing/error recovery, original dimensions/transparency and penultimate section order.');

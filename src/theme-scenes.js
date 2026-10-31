import { heroThemes } from './hero-theme.js';

// Paired scene layers serve the personalization preview and its theme transitions.
export function themeScenes(characters, selectedCharacter = characters[0]?.id) {
  return heroThemes.map((theme, i) => `<div class="hero-scene-layer${i === 0 ? ' is-active' : ''}" data-hero-scene="${theme.id}" aria-hidden="${i !== 0}">
    <picture>${theme.backgroundWebp ? `<source srcset="${theme.backgroundWebp}" type="image/webp"/>` : ''}<img class="hero-scene-background" src="${theme.background}" alt="" width="1448" height="1086" loading="lazy" decoding="async" draggable="false"/></picture>
    ${characters.map(character => {
      const art = character.artwork[theme.id];
      return art ? `<picture><source srcset="${art.webp}" type="image/webp"/><img class="hero-scene-character theme-character-image${character.id === selectedCharacter ? ' is-selected' : ''}" data-character-image="${character.id}" src="${art.src}" alt="" width="${art.width}" height="${art.height}" loading="lazy" decoding="async" draggable="false"/></picture>` : '';
    }).join('')}
  </div>`).join('');
}

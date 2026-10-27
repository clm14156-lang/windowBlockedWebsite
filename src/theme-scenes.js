import { heroThemes } from './hero-theme.js';

// Both previews use the same scene layers and opacity transition.
export function themeScenes(characters = [], selectedCharacter = characters[0]?.id, backgroundOverrides = {}) {
  if (!characters.length) return heroThemes.map((theme,i) => {
    const background = backgroundOverrides[theme.id] || { src: theme.background, width: 1448, height: 1086 };
    return `<div class="hero-scene-layer${i === 0 ? ' is-active' : ''}" data-hero-scene="${theme.id}" aria-hidden="${i !== 0}"><picture><source srcset="${background.src.replace('.png','.webp')}" type="image/webp"/><img class="hero-scene-background" src="${background.src}" alt="" width="${background.width}" height="${background.height}" decoding="async" fetchpriority="${i === 0 ? 'high' : 'low'}" draggable="false"/></picture><picture><source srcset="${theme.character.replace('.png','.webp')}" type="image/webp"/><img class="hero-scene-character" src="${theme.character}" alt="" width="800" height="800" decoding="async" fetchpriority="${i === 0 ? 'high' : 'low'}" draggable="false"/></picture></div>`;
  }).join('');
  return heroThemes.map((theme, i) => `<div class="hero-scene-layer${i === 0 ? ' is-active' : ''}" data-hero-scene="${theme.id}" aria-hidden="${i !== 0}">
    <picture><source srcset="${theme.background.replace('.png','.webp')}" type="image/webp"/><img class="hero-scene-background" src="${theme.background}" alt="" width="1448" height="1086" loading="lazy" decoding="async" draggable="false"/></picture>
    ${characters.map(character => {
      const art = character.artwork[theme.id];
      return art ? `<picture><source srcset="${art.webp}" type="image/webp"/><img class="hero-scene-character theme-character-image${character.id === selectedCharacter ? ' is-selected' : ''}" data-character-image="${character.id}" src="${art.src}" alt="" width="${art.width}" height="${art.height}" loading="lazy" decoding="async" draggable="false"/></picture>` : '';
    }).join('')}
  </div>`).join('');
}

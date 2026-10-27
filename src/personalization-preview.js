import { icon } from './icons.js';
import { heroThemes } from './hero-theme.js';
import { focusCharacters } from './focus-characters.js';
import { themeScenes } from './theme-scenes.js';

const thumbnail = (theme, source, className = '') => `<picture class="theme-thumbnail${theme.id === 'day' ? ' is-active' : ''} ${className}" data-theme-thumbnail="${theme.id}" aria-hidden="true"><source srcset="${source.webp}" type="image/webp"/><img src="${source.src}" alt="" width="${source.width}" height="${source.height}" loading="lazy" decoding="async" draggable="false"/></picture>`;

export function personalizationPreview() {
  return `<section class="section personalization-section" id="personalization" aria-labelledby="personalization-title">
    <div class="section-inner personalization-inner">
      <div class="personalization-top">
        <div class="section-copy personalization-copy">
          <h2 id="personalization-title">让专注，<br/>拥有<span>自己的风格。</span></h2>
          <p>从主题到角色，打造属于你的专注时光。</p>
          <div class="personalization-scenery"><div class="personalization-scene-thumbnail">${heroThemes.map(theme => thumbnail(theme, { src: theme.background, webp: theme.background.replace('.png','.webp'), width: 1448, height: 1086 })).join('')}</div><p>清新的自然场景，<br/>陪伴你专注的每一刻。</p></div>
        </div>
        <div class="personalization-showcase">
          <div class="focus-window hero-focus personalization-preview" id="personalization-preview" data-hero-theme="day" data-character="girl" role="group" aria-label="白天主题，静心少女专注界面预览">
            <div class="focus-scene hero-themed-scene" aria-hidden="true">${themeScenes(focusCharacters)}</div>
            <div class="focus-topbar" aria-hidden="true"><span class="window-dots"><i></i><i></i><i></i></span><span class="window-controls"><i>−</i><i>□</i><i>×</i></span></div>
            <div class="night-greeting"><span class="day-sun" aria-hidden="true">${icon('sun')}</span><span class="hero-greeting-moon" aria-hidden="true"><img src="/assets/focus-moon.svg" alt="" width="60" height="60"/></span><div><h3 data-hero-greeting>下午好</h3><p data-hero-greeting-note>${heroThemes[0].note}</p></div></div>
            <div class="focus-time">25:00</div>
            <div class="personalization-progress" aria-hidden="true"><i></i></div>
          </div>
          <div class="hero-theme-switch" role="group" aria-label="个性化预览的白天与夜晚模式">${heroThemes.map((theme, i) => `<button type="button" data-hero-mode="${theme.id}" aria-pressed="${i === 0}" aria-controls="personalization-preview">${icon(i === 0 ? 'sun' : 'moon')}<span>${theme.label}</span></button>`).join('')}</div>
        </div>
      </div>
      <div class="personalization-characters">
        <h3 id="character-selector-title">选择你的专注角色</h3><p>不同的角色，陪伴你度过每一次专注时光。</p>
        <div class="character-options" role="group" aria-labelledby="character-selector-title">${focusCharacters.map((character, i) => `<button type="button" class="character-option" data-character-select="${character.id}" aria-pressed="${i === 0}" aria-controls="personalization-preview"><span class="character-card-art">${heroThemes.filter(theme => character.artwork[theme.id]).map(theme => thumbnail(theme, character.artwork[theme.id])).join('')}</span><span class="character-option-name">${character.name}</span><span class="character-option-check" aria-hidden="true">${icon('check')}</span></button>`).join('')}</div>
      </div>
      <div class="personalization-benefits">${[['palette','多种主题风格'],['person','丰富的角色选择'],['sliders','个性化氛围'],['heart','沉浸式专注体验']].map(([name, text]) => `<div><span class="personalization-benefit-icon ${name}">${icon(name)}</span><span>${text}</span></div>`).join('')}</div>
      <span class="visually-hidden" role="status" aria-live="polite" aria-atomic="true" data-hero-theme-status></span>
    </div>
  </section>`;
}

import { icon } from './icons.js';
import { heroThemes } from './hero-theme.js';
import { focusCharacters } from './focus-characters.js';
import { themeScenes } from './theme-scenes.js';
import { personalizationDuration } from './personalization-timer.js';

// Preserve the original order, names and artwork; this section offers the first four.
export const personalizationCharacters = focusCharacters.slice(0, 4);

// Selection cards are always day artwork; only scene layers participate in theme changes.
const thumbnail = source => `<picture class="theme-thumbnail is-active" aria-hidden="true"><source srcset="${source.webp}" type="image/webp"/><img src="${source.src}" alt="" width="${source.width}" height="${source.height}" loading="lazy" decoding="async" draggable="false"/></picture>`;

export function personalizationPreview() {
  return `<section class="section personalization-section" id="personalization" aria-labelledby="personalization-title">
    <div class="section-inner personalization-inner">
      <div class="personalization-layout">
      <header class="section-heading-block personalization-copy">
        <span class="section-kicker">${icon('sun')}个性化体验</span>
        <h2 id="personalization-title">让专注，拥有<span>自己的风格。</span></h2>
        <p>从主题到角色，打造属于你的专注时光。</p>
      </header>
        <div class="personalization-showcase">
          <div class="focus-window hero-focus personalization-preview" id="personalization-preview" data-hero-theme="day" data-character="girl" role="group" aria-label="白天主题，静心少女专注界面预览">
            <div class="focus-scene hero-themed-scene" aria-hidden="true">${themeScenes(personalizationCharacters)}</div>
            <div class="focus-topbar" aria-hidden="true"><span class="window-dots"><i></i><i></i><i></i></span><span class="window-controls"><i>−</i><i>□</i><i>×</i></span></div>
            ${heroThemes.map(theme => `<div class="night-greeting personalization-greeting" data-scene-greeting="${theme.id}" aria-hidden="true"><span class="${theme.id==='day'?'day-sun':'hero-greeting-moon'}">${theme.id==='day'?icon('sun'):'<img src="/assets/focus-moon.svg" alt="" width="60" height="60"/>'}</span><div><h3>${theme.greeting}</h3><p>${theme.note}</p></div></div>`).join('')}
            <div class="focus-time" data-personalization-time role="timer" aria-label="专注倒计时" aria-live="off">25:00</div>
            <div class="personalization-progress" data-personalization-progress role="progressbar" aria-label="剩余专注时间" aria-valuemin="0" aria-valuemax="${personalizationDuration}" aria-valuenow="${personalizationDuration}" aria-valuetext="25:00"><i></i></div>
          </div>
          <div class="hero-theme-switch" role="group" aria-label="个性化预览的白天与夜晚模式">${heroThemes.map((theme, i) => `<button type="button" data-hero-mode="${theme.id}" aria-pressed="${i === 0}" aria-controls="personalization-preview">${icon(i === 0 ? 'sun' : 'moon')}<span>${theme.label}</span></button>`).join('')}</div>
        </div>
      <div class="personalization-characters">
        <h3 id="character-selector-title">选择你的专注角色</h3><p>不同的角色，陪伴你度过每一次专注时光。</p>
        <div class="character-options" role="group" aria-labelledby="character-selector-title">${personalizationCharacters.map((character, i) => `<button type="button" class="character-option" data-character-select="${character.id}" aria-pressed="${i === 0}" aria-controls="personalization-preview"><span class="character-card-art">${thumbnail(character.artwork.day)}</span><span class="character-option-name">${character.name}</span><span class="character-option-check" aria-hidden="true">${icon('check')}</span></button>`).join('')}</div>
      </div>
      </div>
      <div class="personalization-benefits">${[['palette','多种主题风格','白天、夜晚随心切换'],['person','丰富的角色选择','不同角色，陪伴专注'],['sliders','个性化氛围','打造自己的专注界面'],['heart','沉浸式专注体验','让专注变得更有仪式感']].map(([name, text, description]) => `<div><span class="personalization-benefit-icon ${name}">${icon(name)}</span><div class="personalization-benefit-copy"><strong>${text}</strong><p>${description}</p></div></div>`).join('')}</div>
      <span class="visually-hidden" role="status" aria-live="polite" aria-atomic="true" data-hero-theme-status></span>
    </div>
  </section>`;
}

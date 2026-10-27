import { settingSteps } from './setting-steps.js';
import { icon } from './icons.js';

const softwareImage = (step, className = 'setting-window-image', decorative = false) => `<img class="${className}" src="${step.image}" alt="${decorative ? '' : step.alt}" width="${step.width}" height="${step.height}" loading="lazy" decoding="async" draggable="false"/>`;

export function setup() {
  return `<section class="section setting-section" id="features" aria-labelledby="setup-title">
    <div class="section-inner setting-inner">
      <header class="section-heading-block">
        <span class="section-kicker">简单三步，开始专注</span>
        <h2 id="setup-title">从设置到专注，<span>只需三步。</span></h2>
        <p>把分心的网站与应用屏蔽起来，让注意力回归真正重要的事。</p>
      </header>
      <div class="setting-grid">
        <div class="setting-steps" role="tablist" aria-label="设置步骤" aria-orientation="vertical">
          ${settingSteps.map((step, i) => `<button type="button" class="setting-step${i === 0 ? ' is-active' : ''}" role="tab" id="setting-tab-${i}" aria-selected="${i === 0}" aria-controls="setting-panel-${i}" tabindex="${i === 0 ? 0 : -1}" data-setting-tab="${i}">
            <span class="setting-step-number">0${i + 1}</span>
            <span class="setting-step-card">
              <span class="setting-step-icon">${icon(step.icon)}</span>
              <span class="setting-step-copy"><strong>${step.title}</strong><span class="setting-step-description">${step.description}</span></span>
            </span>
          </button>`).join('')}
        </div>
        <div class="setting-display" role="region" aria-roledescription="轮播图" aria-label="三步设置界面">
          <div class="setting-screen" id="setting-carousel" data-setting-stack>
            ${settingSteps.map((step, i) => `<figure class="setting-panel${i === 0 ? ' is-active' : ''}" id="setting-panel-${i}" role="tabpanel" aria-labelledby="setting-tab-${i}" aria-hidden="${i !== 0}"${i === 0 ? '' : ' inert'} data-setting-panel="${i}" data-stack-position="${i}">
              ${i === 0 ? `${softwareImage(settingSteps[1], 'setting-window-image setting-window-underlay', true)}<div class="setting-add-dialog">${softwareImage(step, 'setting-add-dialog-image')}</div>` : softwareImage(step)}
            </figure>`).join('')}
          </div>
          <div class="setting-carousel-footer">
            <p class="section-footnote" data-setting-caption aria-live="polite" aria-atomic="true">${settingSteps[0].description}</p>
            <div class="setting-carousel-controls" role="group" aria-label="切换设置步骤">
              <button type="button" class="setting-carousel-arrow" data-setting-direction="-1" aria-label="上一步" aria-controls="setting-carousel">${icon('chevron')}</button>
              <span class="setting-carousel-count" aria-hidden="true"><span data-setting-current>01</span><span> / 03</span></span>
              <button type="button" class="setting-carousel-arrow" data-setting-direction="1" aria-label="下一步" aria-controls="setting-carousel">${icon('chevron')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

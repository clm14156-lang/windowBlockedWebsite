import { icon } from './icons.js';
import { statisticsSlides } from './statistics-slides.js';

function previewCard(slot) {
  const index = ((slot % statisticsSlides.length) + statisticsSlides.length) % statisticsSlides.length;
  const slide = statisticsSlides[index];
  const clone = slot < 0 || slot >= statisticsSlides.length;
  const position = index === 0 ? 'current' : index === 1 ? 'next' : 'previous';
  return `<figure class="statistics-slide" data-stat-item="${index}" data-stat-active="${index === 0}" style="--stat-slot:${slot}" ${clone ? 'data-stat-clone aria-hidden="true" inert' : `data-stat-slide="${index}" data-position="${position}" role="group" aria-roledescription="幻灯片" aria-label="${index + 1} / 3：${slide.label}" aria-hidden="${index !== 0}"${index === 0 ? '' : ' inert'}`}><picture><source srcset="${slide.image.replace('.png','.webp')}" type="image/webp"/><img src="${slide.image}" alt="${clone ? '' : slide.alt}" width="${slide.width}" height="${slide.height}" loading="lazy" decoding="async" draggable="false"/></picture></figure>`;
}

export function statisticsPreview() {
  return `<section class="section statistics-section" id="statistics" aria-labelledby="statistics-title">
    <div class="section-inner statistics-layout">
      <header class="section-heading-block statistics-heading"><div class="statistics-copy-panels">${statisticsSlides.map((slide, i) => `<div class="statistics-copy-panel${i === 0 ? ' is-active' : ''}" data-stat-copy="${i}" aria-hidden="${i !== 0}"${i === 0 ? '' : ' inert'}>
        <span class="section-kicker">${slide.label}</span><h2 id="statistics-title${i ? `-${slide.id}` : ''}">${slide.title}<span>${slide.accent}</span></h2><p>${slide.description.join('')}</p>
      </div>`).join('')}</div></header>
      <div class="statistics-showcase" role="region" aria-roledescription="轮播图" aria-label="统计、日历与目标的软件界面预览">
        <div class="statistics-viewport"><div class="statistics-stage" id="statistics-stage"><div class="statistics-track" data-stat-track>${Array.from({ length: 9 }, (_, i) => previewCard(i - 3)).join('')}</div></div></div>
        <div class="statistics-navigation" role="group" aria-label="轮播控制">
          <button type="button" class="statistics-arrow statistics-previous" data-stat-direction="-1" aria-label="上一页" aria-controls="statistics-stage">${icon('chevron')}</button>
          <div class="statistics-dots" role="group" aria-label="选择轮播页面" data-stat-selector-group>${statisticsSlides.map((slide, i) => `<button type="button" class="statistics-dot" data-stat-select="${i}" aria-pressed="${i === 0}" aria-label="第 ${i + 1} 页：${slide.label}" aria-controls="statistics-stage"><span></span></button>`).join('')}</div>
          <button type="button" class="statistics-arrow statistics-next" data-stat-direction="1" aria-label="下一页" aria-controls="statistics-stage">${icon('chevron')}</button>
          <button type="button" class="statistics-rotation" data-stat-rotation aria-label="开启自动轮播" aria-pressed="false">${icon('pause', 'rotation-pause')}${icon('play', 'rotation-play')}</button>
        </div>
      </div>
      <div class="stat-features" role="group" aria-label="查看统计功能" data-stat-selector-group>${statisticsSlides.map((slide, i) => `<button type="button" class="stat-feature" data-stat-select="${i}" aria-pressed="${i === 0}" aria-controls="statistics-stage"><span class="feature-icon">${icon(slide.icon)}</span><span class="stat-feature-text"><strong>${slide.featureTitle}</strong><span>${slide.featureDescription}</span></span></button>`).join('')}</div>
      <p class="section-footnote statistics-note">界面数据为示例，用于展示统计方式。</p>
      <span class="visually-hidden" role="status" aria-live="polite" aria-atomic="true" data-stat-status>第 1 页，共 3 页：专注统计</span>
    </div>
  </section>`;
}

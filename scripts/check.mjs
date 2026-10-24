import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { renderSite } from '../src/components.js';
import { plans, faqs } from '../src/data.js';
import { pages, resolvePage } from '../src/routes.js';
import { renderDocument } from './document.mjs';
import { settingSteps } from '../src/setting-steps.js';

const root = new URL('../', import.meta.url);
const template = await readFile(new URL('index.html', root), 'utf8');
const css = await readFile(new URL('styles.css', root), 'utf8');
const assets = new Set([...css.matchAll(/url\('\.\/([^']+)'\)/g)].map(match => match[1]));
const expectedSections = { features: ['home', 'features', 'blocking', 'floating', 'goals', 'statistics', 'impact', 'closing'], download: ['download'], membership: ['pricing'], help: ['faq'] };
const mainContents = {};
assert.deepEqual(pages.map(page => page.id), ['features', 'download', 'membership', 'help'], 'Keep the original four navigation pages');
assert.equal(new Set(pages.map(page => page.path)).size, 4);
assert.equal(resolvePage('/').id, 'features');
assert.equal(resolvePage('/unknown/'), null);
for (const retired of ['blocking', 'goals']) {
  for (const pathname of [`/${retired}`, `/${retired}/`, `/${retired}/index.html`]) assert.equal(resolvePage(pathname), null, 'Former feature routes must be removed');
  assert.throws(() => renderSite(retired), /Unknown page/, 'Former standalone renderers must be removed');
}

for (const page of pages) {
  for (const pathname of [page.path, page.path.slice(0, -1), `${page.path}index.html`]) assert.equal(resolvePage(pathname), page);
  const html = renderSite(page.id);
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
  mainContents[page.id] = main;
  assert.deepEqual([...main.matchAll(/<section [^>]*id="([^"]+)"/g)].map(match => match[1]), expectedSections[page.id], `${page.id}: content ownership`);
  assert.equal((main.match(/<h1\b/g) || []).length, 1, `${page.id}: one main heading`);
  assert.equal((html.match(/<footer\b/g) || []).length, 1);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${page.id}: unique IDs`);
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (href.startsWith('#')) assert(ids.includes(href.slice(1)), `${page.id}: missing anchor ${href}`);
    else assert(pages.some(route => route.path === href), `${page.id}: unknown page link ${href}`);
  }
  for (const ref of html.matchAll(/(?:aria-controls|aria-labelledby|aria-describedby)="([^"]+)"/g)) {
    for (const id of ref[1].split(' ')) if (id !== 'dialog-title') assert(ids.includes(id), `${page.id}: missing ARIA target ${id}`);
  }
  for (const nav of html.matchAll(/<nav\b[^>]*>([\s\S]*?)<\/nav>/g)) {
    assert.equal((nav[1].match(/aria-current="page"/g) || []).length, 1, 'One active page per navigation');
    for (const route of pages) assert(nav[1].includes(`href="${route.path}"`));
    assert(!nav[1].includes('href="#'), 'Top navigation must change pages');
    assert(!/访问拦截|目标与任务|\/blocking\/|\/goals\//.test(nav[1]), 'Feature demonstrations must not have separate navigation entries');
  }
  for (const match of html.matchAll(/src="\/([^\"]+)"/g)) assets.add(match[1]);
  const document = renderDocument(template, page);
  assert(document.includes(`<title>${page.title}</title>`));
  assert(document.includes(`content="${page.description}"`));
  assert(document.includes(html), 'Each HTML document must contain its own complete page');
  assert(!document.includes('src="./') && !document.includes('href="./'), 'Nested routes need root-relative assets');
  if (page.preload) assets.add(page.preload.slice(1));
}

assert.equal(plans.length, 2);
assert.equal(faqs.length, 8);
for (const plan of plans) {
  for (const text of [plan.intro, plan.note, ...plan.features.map(([text]) => text)]) assert(mainContents.membership.includes(text), `Missing plan information: ${text}`);
}
for (const [question, answer] of faqs) {
  assert.equal(mainContents.help.split(question).length - 1, 1);
  assert.equal(mainContents.help.split(answer).length - 1, 1);
  assert(!mainContents.features.includes(question) && !mainContents.membership.includes(question) && !mainContents.download.includes(question));
}
assert(mainContents.features.includes('愿你拥有，不被打扰的时光') && mainContents.features.includes('把纷扰留在外面，把这一刻留给自己。'));
assert(mainContents.features.includes('看，有一颗流星为你而来。'));
assert(mainContents.download.includes('/assets/download-placeholder.svg') && !mainContents.download.includes('closing-section'));
assert(!mainContents.download.includes('愿你拥有，不被打扰的时光') && !mainContents.download.includes('data-demo'));
for (const main of Object.values(mainContents)) assert(!/为专注，留一点空间|download-panel|download-details/.test(main), 'The deleted download card must not appear on any page');
assert(mainContents.features.includes('data-hero-toggle') && mainContents.features.includes('data-floating-desktop') && mainContents.features.includes('data-chart-period'));
const setup = mainContents.features.match(/<section[^>]*id="features"[\s\S]*?<\/section>/)[0];
assert.equal((setup.match(/data-setting-item=/g) || []).length, 3, 'Three setup steps');
assert.equal((setup.match(/data-setting-panel=/g) || []).length, 3, 'Three setup screenshots');
assert.deepEqual([...setup.matchAll(/<img src="([^"]+)"/g)].map(match => match[1]), settingSteps.map(step => step.image));
assert.equal((setup.match(/class="setting-step is-active"/g) || []).length, 1, 'One active setup step');
assert.equal((setup.match(/class="setting-panel is-active"/g) || []).length, 1, 'One active screenshot');
assert(!/<button\b|setup-shot/.test(setup), 'Setup progression is scroll driven');
assert(setup.includes('data-setting-track') && setup.includes('role="status"'));
const floating = mainContents.features.match(/<section[^>]*id="floating"[\s\S]*?<\/section>/)[0];
assert(!/<button\b|data-floating-expand|data-floating-replay|data-focus-collapse|tabindex=/.test(floating), 'Floating demo is controlled by scrolling, without click or keyboard toggles');
assert(floating.indexOf('floating-copy') < floating.indexOf('data-floating-desktop'), 'Copy must precede the full-width desktop');
assert(floating.includes('data-floating-track') && floating.includes('data-floating-timer') && floating.includes('向下滚动'));
assert(mainContents.features.indexOf('id="blocking"') > mainContents.features.indexOf('setting-step-focus'), 'Blocking follows the final setup step');
const blocking = mainContents.features.match(/<section[^>]*id="blocking"[\s\S]*?<\/section>/)[0];
assert.equal((blocking.match(/class="blocking-browser blocking-browser-/g) || []).length, 2, 'Retain both blocking preview windows');
assert(blocking.includes('blocking-flow-arrow') && blocking.includes('输入被屏蔽的网站') && blocking.includes('显示专属提示页'));
assert(blocking.includes('/assets/blocked_background.png') && blocking.includes('bilibili.com') && blocking.includes('data-blocking-time'));
assert(mainContents.features.indexOf('id="goals"') > mainContents.features.indexOf('id="floating"') && mainContents.features.indexOf('id="goals"') < mainContents.features.indexOf('id="statistics"'), 'Goals and tasks follows the floating demonstration');
const goals = mainContents.features.match(/<section[^>]*id="goals"[\s\S]*?<\/section>/)[0];
assert.equal((goals.match(/data-goals-step=/g) || []).length, 3, 'Retain all three goals and tasks steps');
for (const content of ['创建目标', '为目标添加任务', '专注中随时记录', 'goals-create-window', 'goals-manager-window', 'goals-focus-window', 'goals-quick-task', '/assets/goals-daylight.png']) assert(goals.includes(content));
assert.deepEqual(expectedSections.features.slice(-2), ['impact', 'closing'], 'The new section must be penultimate');
const impact = mainContents.features.match(/<section[^>]*id="impact"[\s\S]*?<\/section>/)[0];
assert(!/<nav\b|<header\b|<h1\b/.test(impact), 'New section contains only the feature-page body');
assert.equal((impact.match(/data-impact-feature=/g) || []).length, 3);
for (const text of ['写给认真生活的人', '真实的改变', '屏蔽干扰', '完成目标', '记录成长']) assert(impact.includes(text));
for (const page of ['download', 'membership', 'help']) assert(!mainContents[page].includes('impact-section') && !mainContents[page].includes('blocking-section') && !mainContents[page].includes('goals-section'));
for (const asset of assets) await access(new URL(asset, root));
console.log(`Passed: four original pages/navigation entries, retired feature routes removed, blocking/goals content preserved, penultimate body-only impact section, complete plans and 8 FAQs, valid anchors/ARIA and ${assets.size} assets.`);

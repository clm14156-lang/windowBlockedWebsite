import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { renderSite } from '../src/components.js';
import { plans, faqs } from '../src/data.js';
import { pages, resolvePage } from '../src/routes.js';
import { renderDocument } from './document.mjs';

const root = new URL('../', import.meta.url);
const template = await readFile(new URL('index.html', root), 'utf8');
const css = await readFile(new URL('styles.css', root), 'utf8');
const assets = new Set([...css.matchAll(/url\('\.\/([^']+)'\)/g)].map(match => match[1]));
const expectedSections = { features: ['home', 'features', 'floating', 'statistics'], download: ['download'], membership: ['pricing'], help: ['faq'] };
const mainContents = {};
assert.equal(new Set(pages.map(page => page.path)).size, 4);
assert.equal(resolvePage('/').id, 'features');
assert.equal(resolvePage('/unknown/'), null);

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
assert(mainContents.download.includes('暂未接入 Windows 安装包') && mainContents.download.includes('愿你拥有，不被打扰的时光'));
assert(mainContents.features.includes('data-hero-toggle') && mainContents.features.includes('data-floating-desktop') && mainContents.features.includes('data-chart-period'));
const floating = mainContents.features.match(/<section[^>]*id="floating"[\s\S]*?<\/section>/)[0];
assert(!/<button\b|data-floating-expand|data-floating-replay|data-focus-collapse|tabindex=/.test(floating), 'Floating demo is controlled by scrolling, without click or keyboard toggles');
assert(floating.indexOf('floating-copy') < floating.indexOf('data-floating-desktop'), 'Copy must precede the full-width desktop');
assert(floating.includes('data-floating-track') && floating.includes('data-floating-timer') && floating.includes('向下滚动'));
for (const asset of assets) await access(new URL(asset, root));
console.log(`Passed: 4 independent pages, correct navigation and content ownership, complete plans and 8 FAQs, valid anchors/ARIA, ${assets.size} available assets, rendered HTML and route aliases.`);

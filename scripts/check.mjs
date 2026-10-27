import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { renderSite } from '../src/components.js';
import { plans, faqs } from '../src/data.js';
import { pages, resolvePage, notFoundPage } from '../src/routes.js';
import { renderDocument } from './document.mjs';
import { publicUrl, siteConfig } from '../src/site-config.js';

const root = new URL('../', import.meta.url);
const template = await readFile(new URL('index.html',root),'utf8');
const expected = {features:['home','features','blocking','floating','goals','statistics','impact','personalization','closing'],download:['download'],membership:['pricing'],help:['faq']};
const assets = new Set(['assets/favicon.svg']);
const mains = {};
assert.deepEqual(pages.map(page=>page.id),['features','download','membership','help']);
for (const stylesheet of ['styles.css','styles/product.css']) {
  const css = await readFile(new URL(stylesheet,root),'utf8');
  for (const match of css.matchAll(/url\(['"]?(\/assets\/[^'"\)]+)['"]?\)/g)) assets.add(match[1].slice(1));
  assert(template.includes(`href="/${stylesheet}"`));
}
for (const page of pages) {
  assert.equal(resolvePage(page.path),page);
  const html=renderSite(page.id);
  const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
  mains[page.id]=main;
  assert.deepEqual([...main.matchAll(/<section\b[^>]*id="([^"]+)"/g)].map(m=>m[1]),expected[page.id]);
  assert.equal((main.match(/<h1\b/g)||[]).length,1);
  assert.equal((html.match(/<footer\b/g)||[]).length,1);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,`${page.id}: unique IDs`);
  for (const ref of html.matchAll(/(?:aria-controls|aria-labelledby|aria-describedby)="([^"]+)"/g)) for(const id of ref[1].split(' ')) if(id!=='dialog-title')assert(ids.includes(id),`${page.id}: ARIA target ${id}`);
  for (const ref of html.matchAll(/href="([^"]+)"/g)) {
    const href=ref[1];
    if(href.startsWith('#'))assert(ids.includes(href.slice(1)),href);
    else assert(pages.some(route=>route.path===href)||publicUrl(href),`Unknown destination: ${href}`);
  }
  for (const nav of html.matchAll(/<nav\b[^>]*aria-label="(?:主导航|移动导航)"[^>]*>([\s\S]*?)<\/nav>/g)) {
    assert.equal((nav[1].match(/aria-current="page"/g)||[]).length,1);
    for(const route of pages)assert(nav[1].includes(`href="${route.path}"`));
    assert(!/\/blocking\/|\/goals\//.test(nav[1]));
  }
  for (const match of html.matchAll(/(?:src|srcset)="\/(assets\/[^" ]+)"/g)) assets.add(match[1]);
  const document=renderDocument(template,page);
  assert(document.includes(`<title>${page.title}</title>`)&&document.includes(html));
  assert(document.includes('property="og:title"')&&document.includes('property="og:description"'));
  assert(!document.includes('src="./')&&!document.includes('href="./'));
  if(page.preload)assets.add(page.preload.slice(1));
}
for(const retired of ['blocking','goals']) {
  for(const path of [`/${retired}`,`/${retired}/`,`/${retired}/index.html`])assert.equal(resolvePage(path),null);
  assert.throws(()=>renderSite(retired),/Unknown page/);
}
for(const [tab,panel] of [['data-setting-tab','data-setting-panel'],['data-goal-tab','data-goal-panel']]) {
  assert.equal((mains.features.match(new RegExp(`${tab}="`,'g'))||[]).length,3);
  assert.equal((mains.features.match(new RegExp(`${panel}="`,'g'))||[]).length,3);
}
assert.equal((mains.features.match(/data-stat-slide="/g)||[]).length,3);
assert(mains.features.includes('data-stat-direction="-1"')&&mains.features.includes('data-stat-direction="1"'));
assert(mains.features.includes('data-floating-desktop')&&mains.features.includes('data-floating-timer'));
assert(mains.features.includes('已被屏蔽')&&mains.features.includes('/assets/blocked01.png'));
assert(!/data-blocking-(?:mode|trigger|result|time)/.test(mains.features));
for (const asset of ['00a.png','00b.png','00c.png']) assert(mains.features.includes(`/assets/product/${asset}`));
assert(mains.features.includes('goals-overview')&&mains.features.includes('goals-floating')&&mains.features.includes('goals-quick'));
assert(!mains.features.includes('goals-connectors')&&!mains.features.includes('meteor-note'));
if(!siteConfig.downloadUrl)assert(mains.download.includes('下载准备中')&&mains.download.includes('disabled')&&mains.download.includes('data-demo'));
assert(!mains.download.includes('download-placeholder.svg'));
if(!siteConfig.checkoutUrl)assert(mains.membership.includes('购买入口暂未开放'));
for(const plan of plans)for(const [text] of plan.features)assert(mains.membership.includes(text));
assert.equal(faqs.length,8);
for(const [question,answer] of faqs)assert(mains.help.includes(question)&&mains.help.includes(answer));
const missing=renderDocument(template,notFoundPage);
assert(missing.includes('noindex,follow')&&missing.includes('回到首页'));
assert.equal(publicUrl('javascript:alert(1)'), '');
assert.equal(publicUrl('http://example.com'), '');
assert.equal(publicUrl('https://example.com/download'), 'https://example.com/download');
for(const url of [siteConfig.downloadUrl,siteConfig.checkoutUrl,siteConfig.origin])assert(!url||publicUrl(url),'Configured public URLs must use HTTPS');
for(const asset of assets)await access(new URL(asset,root));
console.log(`Passed: four complete pages, preserved feature content, native tabs, accessible controls/anchors, explicit commercial placeholders, metadata/404 and ${assets.size} available assets.`);

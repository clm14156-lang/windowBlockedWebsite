import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createPreviewServer } from './server.mjs';
import { pages } from '../src/routes.js';
import { header } from '../src/site-shell.js';

const normalizeHeader = html => html.replace(/nav-item active/g, 'nav-item').replace(/ aria-current="page"/g, '');
const sharedHeader = normalizeHeader(header('features'));

const server = createPreviewServer();
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;
try {
  for (const page of pages) {
    const response = await fetch(base + page.path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    const html = await response.text();
    assert(html.includes(`<title>${page.title}</title>`));
    assert(html.includes(`class="page-${page.id}`));
    assert.equal((html.match(/<header\b[^>]*\bid="site-header"/g) || []).length, 1, `${page.id}: render one shared navigation header`);
    const pageHeader = html.match(/<header\b[\s\S]*?<\/header>/)[0];
    assert.equal(normalizeHeader(pageHeader), sharedHeader, `${page.id}: only the active navigation item may differ`);
    assert.equal((pageHeader.match(/aria-current="page"/g) || []).length, 2, 'Desktop and mobile navigation highlight the same current page');
    assert(pageHeader.includes(`href="${page.path}" data-nav="${page.id}" aria-current="page"`));
    for (const alias of [page.path.slice(0, -1), `${page.path}index.html`]) {
      const redirect = await fetch(base + alias, { redirect: 'manual' });
      assert.equal(redirect.status, 301);
      assert.equal(redirect.headers.get('location'), page.path);
      await redirect.text();
    }
    const head = await fetch(base + page.path, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
  }
  const home = await fetch(base + '/');
  assert.equal(home.status, 200);
  assert((await home.text()).includes('class="page-features"'));
  for (const [pathname, status] of [['/missing/', 404], ['/missing.js', 404], ['/.git/config', 403]]) {
    const response = await fetch(base + pathname);
    assert.equal(response.status, status, pathname);
    await response.text();
  }
  for (const retired of ['blocking', 'goals']) {
    for (const pathname of [`/${retired}`, `/${retired}/`, `/${retired}/index.html`]) {
      const response = await fetch(base + pathname, { redirect: 'manual' });
      assert.equal(response.status, 404, `Removed standalone page: ${pathname}`);
      await response.text();
    }
  }
  const missing = await fetch(base+'/missing/');
  assert.match(missing.headers.get('content-type'),/text\/html/);
  const missingHtml = await missing.text();
  assert(missingHtml.includes('回到首页')&&missingHtml.includes('noindex,follow'));
  for (const pathname of ['/styles.css', '/styles/product.css', '/src/app.js', '/src/routes.js', '/src/product-tabs.js', '/assets/favicon.svg', '/assets/focus02.webp']) {
    const response = await fetch(base + pathname);
    assert.equal(response.status, 200, pathname);
    assert((await response.text()).length > 0);
  }
  console.log('Passed: four pages, native route aliases, HEAD/refresh, branded 404, metadata, optimized assets and hidden-file protection.');
} finally {
  server.closeAllConnections();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

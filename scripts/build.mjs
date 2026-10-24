import { mkdir, cp, readFile, writeFile, rm, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pages, notFoundPage } from '../src/routes.js';
import { publicUrl, siteConfig } from '../src/site-config.js';
import { renderDocument } from './document.mjs';
const root = new URL('../', import.meta.url);
const outputDirectory = path.resolve(fileURLToPath(new URL('dist/', root)));
const workspaceDirectory = path.resolve(fileURLToPath(root));
if (path.dirname(outputDirectory) !== workspaceDirectory || path.basename(outputDirectory) !== 'dist') throw new Error('Invalid generated output directory');
const outputInfo = await lstat(outputDirectory).catch(error => { if (error.code !== 'ENOENT') throw error; });
if (outputInfo?.isSymbolicLink()) throw new Error('Generated output must not be a symbolic link');
// All files in this verified directory are generated; remove stale routes and modules.
await rm(outputDirectory,{recursive:true,force:true});
await mkdir(outputDirectory,{recursive:true});
for (const entry of ['styles.css', 'styles', 'src', 'assets']) {
  await cp(new URL(entry, root), new URL(`dist/${entry}`, root), { recursive: true });
}
const template = await readFile(new URL('index.html', root), 'utf8');
await writeFile(new URL('dist/index.html', root), renderDocument(template, pages[0]));
await writeFile(new URL('dist/404.html', root), renderDocument(template,notFoundPage));
for (const page of pages) {
  const directory = new URL(`dist${page.path}`, root);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('index.html', directory), renderDocument(template, page));
}
const origin = publicUrl(siteConfig.origin);
await writeFile(new URL('dist/robots.txt',root), `User-agent: *\nAllow: /\n${origin ? `Sitemap: ${new URL('/sitemap.xml',origin).href}\n` : ''}`);
if (origin) await writeFile(new URL('dist/sitemap.xml',root), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(page => `<url><loc>${new URL(page.path,origin).href}</loc></url>`).join('')}</urlset>`);
else await rm(new URL('dist/sitemap.xml',root),{force:true});
console.log(`Static build ready: ${fileURLToPath(new URL('dist/', root))}`);

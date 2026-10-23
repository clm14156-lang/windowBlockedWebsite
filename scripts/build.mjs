import { mkdir, cp, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pages } from '../src/routes.js';
import { renderDocument } from './document.mjs';
const root = new URL('../', import.meta.url);
await mkdir(new URL('dist/', root), { recursive: true });
for (const entry of ['styles.css', 'src', 'assets']) {
  await cp(new URL(entry, root), new URL(`dist/${entry}`, root), { recursive: true });
}
const template = await readFile(new URL('index.html', root), 'utf8');
await writeFile(new URL('dist/index.html', root), renderDocument(template, pages[0]));
for (const page of pages) {
  const directory = new URL(`dist${page.path}`, root);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('index.html', directory), renderDocument(template, page));
}
console.log(`Static build ready: ${fileURLToPath(new URL('dist/', root))}`);

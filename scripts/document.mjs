import { renderSite } from '../src/components.js';

export function renderDocument(template, page) {
  const preload = page.preload ? `<link rel="preload" as="image" href="${page.preload}" />` : '';
  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*("\s*\/?>)/, `$1${page.description}$2`)
    .replace(/<link rel="preload"[^>]*>/, preload)
    .replace('<div id="app"></div>', `<div id="app">${renderSite(page.id)}</div>`);
}

import { renderSite } from '../src/components.js';
import { publicUrl, siteConfig } from '../src/site-config.js';

const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function renderDocument(template, page) {
  const preload = page.preload ? `<link rel="preload" as="image" href="${page.preload}" />` : '';
  const origin = publicUrl(siteConfig.origin);
  const canonical = origin && page.path ? new URL(page.path, origin).href : '';
  const metadata = `<meta property="og:type" content="website" /><meta property="og:locale" content="zh_CN" /><meta property="og:site_name" content="专注时光" /><meta property="og:title" content="${escape(page.title)}" /><meta property="og:description" content="${escape(page.description)}" /><meta name="twitter:card" content="summary_large_image" />${canonical ? `<link rel="canonical" href="${escape(canonical)}" /><meta property="og:url" content="${escape(canonical)}" /><meta property="og:image" content="${escape(new URL('/assets/focus02.png',origin).href)}" />` : ''}${page.id === 'not-found' ? '<meta name="robots" content="noindex,follow" />' : ''}`;
  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*("\s*\/?>)/, `$1${page.description}$2`)
    .replace(/<link rel="preload"[^>]*>/, preload)
    .replace('<!-- page-metadata -->', metadata)
    .replace('<div id="app"></div>', `<div id="app">${renderSite(page.id)}</div>`);
}

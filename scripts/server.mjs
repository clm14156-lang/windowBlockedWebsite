import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePage, notFoundPage } from '../src/routes.js';
import { renderDocument } from './document.mjs';
import { createWebsiteSession } from './website-session.mjs';
import { resolvePreviewConfig } from './preview-config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const previewConfig = resolvePreviewConfig();
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json; charset=utf-8' };
export function createPreviewServer({ accountApiBaseUrl = previewConfig.accountApiBaseUrl, websiteOrigin = previewConfig.websiteOrigin } = {}) {
  const session = createWebsiteSession({ accountApiBaseUrl, websiteOrigin });
  return http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.startsWith('/api/website-session/')) return await session(req, res, pathname);
    const page = resolvePage(pathname);
    if (page) {
      if (pathname !== '/' && pathname !== page.path && pathname !== '/index.html') {
        res.writeHead(301, { Location: page.path }).end(); return;
      }
      const template = await readFile(path.join(root, 'index.html'), 'utf8');
      const html = renderDocument(template, page, { accountApiBaseUrl });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : html); return;
    }
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const target = path.resolve(root, relative);
    const inside = path.relative(root, target);
    if (inside.startsWith('..') || path.isAbsolute(inside) || inside.split(path.sep).some(p => p.startsWith('.'))) {
      res.writeHead(403).end('Forbidden'); return;
    }
    if (!(await stat(target)).isFile()) throw new Error('Not found');
    const data = await readFile(target);
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (!path.extname(pathname) || pathname.endsWith('/index.html') || pathname === '/404.html') {
      const template = await readFile(path.join(root,'index.html'),'utf8');
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : renderDocument(template, notFoundPage, { accountApiBaseUrl }));
    } else res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('资源不存在');
  }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createPreviewServer();
  server.on('error', error => {
    console.error(error.code === 'EADDRINUSE' ? `端口 ${previewConfig.port} 已被占用，请关闭旧官网服务或使用 --port 指定其他端口。` : error.message);
    process.exitCode = 1;
  });
  server.listen(previewConfig.port, '127.0.0.1', () => {
    console.log(`专注官网 Local: http://127.0.0.1:${previewConfig.port}/features/`);
    console.log(`账号后端：${previewConfig.accountApiBaseUrl || '未配置'}`);
  });
}

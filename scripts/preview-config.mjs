import { readFileSync } from 'node:fs';
import { accountApiOrigin } from '../src/site-config.js';

export function resolvePreviewConfig({ args = process.argv.slice(2), env = process.env, localConfig } = {}) {
  const websiteOrigin = env.FOCUSTIME_WEBSITE_ORIGIN || '';
  const local = !websiteOrigin && env.NODE_ENV !== 'production';
  if (local && localConfig === undefined) {
    try { localConfig = JSON.parse(readFileSync(new URL('../.preview-config.json', import.meta.url), 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw new Error(`无法读取 .preview-config.json：${error.message}`); }
  }
  const config = local ? localConfig || {} : {};
  const option = name => {
    const index = args.indexOf(name);
    if (index < 0) return undefined;
    if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`${name} 缺少参数。`);
    return args[index + 1];
  };
  // A project-local setting takes precedence over inherited machine settings.
  // Explicit command-line options can still select another development instance.
  const port = Number(option('--port') ?? config.port ?? env.PORT ?? 5175);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('网站端口必须是 1–65535 的整数。');
  const configuredApi = option('--api-url') ?? config.accountApiBaseUrl ?? env.FOCUSTIME_API_BASE_URL ?? (local ? 'http://127.0.0.1:5082' : '');
  const accountApiBaseUrl = accountApiOrigin(configuredApi, local);
  if (configuredApi && !accountApiBaseUrl) throw new Error('账号后端地址必须是 HTTPS 根地址；本地开发也允许 HTTP 回环地址。');
  return { port, accountApiBaseUrl, websiteOrigin };
}

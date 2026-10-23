import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { openSync, closeSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = 5174;
const url = `http://127.0.0.1:${port}/`;
const logFile = path.join(root, '.preview', 'server.log');

async function isRunning() {
  let response;
  try { response = await fetch(url, { signal: AbortSignal.timeout(1000) }); }
  catch { return false; }
  const html = await response.text();
  if (response.ok && html.includes('专注') && html.includes('/src/app.js')) return true;
  throw new Error(`端口 ${port} 正被其他服务使用，请关闭该服务后重试。`);
}

async function startServer() {
  await mkdir(path.dirname(logFile), { recursive: true });
  const log = openSync(logFile, 'a');
  let child;
  try {
    child = spawn(process.execPath, [path.join(root, 'scripts', 'server.mjs'), '--port', String(port)], {
      cwd: root,
      env: { ...process.env, PORT: String(port) },
      detached: true,
      windowsHide: true,
      stdio: ['ignore', log, log],
    });
    await new Promise((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); });
    child.unref();
  } finally { closeSync(log); }
  for (let attempt = 0; attempt < 50; attempt++) {
    if (await isRunning()) {
      console.log(`网站已在后台启动（PID ${child.pid}）。`);
      return;
    }
    await delay(100);
  }
  const details = await readFile(logFile, 'utf8').catch(() => '');
  throw new Error(`网站启动失败。日志：${logFile}\n${details.slice(-1200)}`);
}

async function openBrowser() {
  // The URL is a fixed local address. Hide only the launcher console.
  const args = ['-NoProfile', '-NonInteractive', '-Command', `Start-Process '${url}'`];
  await new Promise((resolve, reject) => {
    const opener = spawn('powershell.exe', args, { windowsHide: true, stdio: 'ignore' });
    opener.once('error', reject);
    opener.once('exit', code => code === 0 ? resolve() : reject(new Error('浏览器未能自动打开')));
  });
}

try {
  if (await isRunning()) console.log('网站已在运行，直接打开。');
  else await startServer();
  console.log(`访问地址：${url}`);
  if (!process.argv.includes('--no-open')) {
    try { await openBrowser(); }
    catch (error) { throw new Error(`${error.message}，请手动访问 ${url}`); }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

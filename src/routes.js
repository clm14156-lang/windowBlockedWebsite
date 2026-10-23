export const pages = [
  { id: 'features', path: '/features/', label: '功能介绍', title: '功能介绍 — 专注，让专注自然发生。', description: '了解专注 Windows 软件的网站与应用屏蔽、悬浮窗口和专注统计，体验软件功能演示。', preload: '/assets/hero-bg.webp' },
  { id: 'download', path: '/download/', label: '下载软件', title: '下载软件 — 专注', description: '专注 Windows 版下载说明与功能体验，适用于 Windows 10 / 11（64 位）。', preload: '/assets/closing-bg.webp' },
  { id: 'membership', path: '/membership/', label: '高级会员', title: '高级会员 — 专注', description: '了解专注免费版与专业版的完整功能、价格和方案。' },
  { id: 'help', path: '/help/', label: '帮助中心', title: '帮助中心 — 专注', description: '查阅专注软件的安装、使用、数据保存、授权和退款常见问题。' },
];

export function resolvePage(pathname) {
  if (pathname === '/' || pathname === '/index.html') return pages[0];
  return pages.find(page => [page.path, page.path.slice(0, -1), `${page.path}index.html`].includes(pathname)) || null;
}

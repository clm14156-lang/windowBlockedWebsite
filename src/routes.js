export const pages = [
  { id: 'features', path: '/features/', label: '功能介绍', title: '专注时光 — 让专注，自然发生。', description: '一款 Windows 专注工具。屏蔽分心的网站与应用，管理目标与任务，用清晰的记录回顾每一段投入。', preload: '/assets/product/image1.png' },
  { id: 'download', path: '/download/', label: '下载软件', title: '下载 Windows 版 — 专注时光', description: '了解专注时光 Windows 版、安装步骤与下载开放状态，也可以先在线体验主要功能。', preload: '/assets/focus02.webp' },
  { id: 'membership', path: '/membership/', label: '高级会员', title: '方案与价格 — 专注时光', description: '对比专注时光免费版与专业版的示例方案，找到适合自己的专注方式。' },
  { id: 'help', path: '/help/', label: '帮助中心', title: '帮助中心 — 专注时光', description: '了解如何开始专注、管理任务、使用悬浮窗口和回顾专注记录，以及官网体验的使用说明。' },
];

export const notFoundPage = { id: 'not-found', title: '页面未找到 — 专注时光', description: '该页面暂时不在这里，返回专注时光首页继续浏览。' };

export function resolvePage(pathname) {
  if (pathname === '/' || pathname === '/index.html') return pages[0];
  return pages.find(page => [page.path, page.path.slice(0, -1), `${page.path}index.html`].includes(pathname)) || null;
}

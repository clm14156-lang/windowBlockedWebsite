# 专注时光 · 产品官网

使用原生 HTML、CSS 和 JavaScript ES Modules，无第三方运行依赖。四个页面由同一组组件生成完整 HTML，可直接作为静态网站部署。

## 本地运行

```sh
node scripts/server.mjs --port 5175
```

打开 `http://127.0.0.1:5175/features/`。修改服务端路由或组件后需要重启服务；样式与浏览器脚本修改后刷新即可。Windows 启动脚本也可继续使用。

## 页面

| 页面 | 路由 | 内容 |
| --- | --- | --- |
| 功能介绍 | `/features/` | 首屏交互计时、设置步骤、访问拦截、悬浮演示、目标任务、统计轮播、功能总结及收尾 |
| 下载软件 | `/download/` | Windows 产品入口、下载开放状态、在线体验和安装步骤 |
| 高级会员 | `/membership/` | 免费版 / 专业版方案对比与权益预览 |
| 帮助中心 | `/help/` | 8 项原生可折叠问答 |

根路径显示功能介绍页。访问拦截和目标任务仅为功能介绍页内的区块，没有独立导航或路由。未知页面返回带回首页入口的 404，静态构建也提供 `404.html`。

## 视觉与交互

- 页面底色 `#FBFBFB`，统一 1160px 内容宽度、浅色表面、橙色操作按钮、字号、留白与边框。
- `styles.css` 管理官网设计系统；`styles/product.css` 隔离现有软件界面的几何与样式。网站不再混用夜景整屏背景、装饰连线和海报式拼图。
- 设置与目标展示采用点击 / 方向键 / Home / End 切换，每次仅一个面板可交互。悬浮演示保留原生滚动驱动，并缩短滚动行程。
- 统计轮播保留箭头、功能入口、圆点与可选自动播放；默认暂停，悬停、焦点、页面隐藏及减少动态效果时暂停。
- 首屏使用 `focus02.png` 的原始构图，角色已包含在图中。主时钟、右侧计时及进度环共用状态，支持结束、继续与归零重启。
- 三张大插画提供 WebP 与原 PNG 回退。首屏预加载 WebP，其余插画及软件截图按需懒加载。
- 在线体验支持倒计时、任务勾选、统计周期及日期切换。状态仅保存在当前页面内存，不会修改系统、创建账号或订单。

## 发布配置

按当前要求，下载与会员保留明确的占位状态。网站不会生成虚假安装包，也不会执行真实付款。

正式接入时修改 `src/site-config.js`：`origin` 为 HTTPS 正式域名，`downloadUrl` 为 HTTPS 官方安装包地址，`checkoutUrl` 为 HTTPS 购买页面，`version` 为正式版本。价格与权益在 `src/data.js` 中维护；启用真实购买前同步更新方案、帮助与服务说明。

填写正式域名后，构建会生成对应的 canonical、分享链接、图片地址与 sitemap。域名为空时不生成虚假 canonical 或 sitemap。每页已有独立标题、描述、Open Graph 元信息；404 使用 noindex。

```sh
node scripts/check.mjs
node scripts/test-product-tabs.mjs
node scripts/test-floating.mjs
node scripts/test-hero-timer.mjs
node scripts/test-routes.mjs
node scripts/build.mjs
```

构建结果为 `dist/`，部署该目录到支持目录索引的 HTTP 静态服务器。无需 SPA 回退；将 404 错误页映射至 `404.html`。每次构建会校验并重新生成整个 `dist/`，防止残留旧页面和脚本；不要手工存放文件在此目录。构建同时生成 robots.txt。

`src/site-shell.js` 负责共享导航、页脚及独立页面；`src/components.js` 组装产品演示；`src/product-tabs.js` 负责可访问的面板切换；`src/hero-timer.js` 与 `src/floating-demo.js` 维护计时和悬浮状态。素材来源与产品事实见 `docs/`。

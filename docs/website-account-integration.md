# 官网账号联调

网站和 Windows 客户端连接同一 FocusTime_Server 实例时，使用同一个 PostgreSQL 账号。注册写入现有 `identity.users`。找回密码更新同一行的密码哈希，并撤销原有登录会话。验证码与重置凭证沿用 `identity.email_challenges` 中的摘要和用途绑定。此次接入无需新增表或迁移，新的测试库仍需先执行后端现有迁移。

## 本地运行

在 `E:\FocusTime_Server` 中给 `ConnectionStrings__Database` 配置已迁移的开发数据库，然后启动 Development 服务。以下命令使用项目附带的 .NET 10 SDK。请用自己的开发启动方式管理已经运行的 5080 实例。

```powershell
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:Email__Mode = 'Log'
& .\.tools\dotnet\dotnet.exe run --project src/FocusTime.Api --no-launch-profile -- --urls http://localhost:5080
```

若用 Windows 项目现有的本地登录服务脚本管理 5080，需先用其停止脚本释放旧后端进程，再在 `E:\FocusTime_Server` 运行 `& .\.tools\dotnet\dotnet.exe build src/FocusTime.Api -c Release`，然后用原启动脚本启动。该方式沿用现有开发数据库和 `.eml` 投递设置。使用上面的 `Log` 启动方式时，验证码从控制台读取。

在网站目录启动预览。`FOCUSTIME_API_BASE_URL` 是 API 根地址，需要与 Windows 客户端连接的实例一致。未设置时，预览服务器使用 `http://localhost:5080`。

```powershell
$env:FOCUSTIME_API_BASE_URL = 'http://localhost:5080'
node scripts/server.mjs --port 5175
```

打开 `http://127.0.0.1:5175/features/`，点击「免费体验」，用一个开发测试邮箱申请验证码。在后端控制台查找 `Development email code for` 日志，按邮箱和用途 `register` 或 `reset` 取最新的六位码。验证码每次随机生成，10 分钟有效，同一邮箱至少间隔 60 秒再发送，每小时最多发送 5 次，每个挑战最多允许 5 次错误尝试。未知邮箱的找回请求返回同类挑战响应，但没有对应投递。`Log` 模式仅在 Development 可用。Windows 本地登录服务脚本继续使用 Development `Pickup` 模式，验证码保存在该脚本配置的 `.eml` 投递目录。

## 接口

| POST `/api/v1/auth/` 下的路径 | 请求字段 | 成功响应 |
| --- | --- | --- |
| `registration-code` | `email` | 200，挑战 ID、过期时间和重发间隔 |
| `register` | `email`、`challengeId`、`code`、`password` | 201，账号资料 |
| `password-reset/code` | `email` | 200，通用挑战响应 |
| `password-reset/verify` | `challengeId`、`code` | 200，一次性重置凭证 |
| `password-reset/complete` | `resetTicket`、`newPassword` | 204，密码已更新 |
| `login` | `email`、`password`、`device` | 200，Windows 客户端登录响应 |

## 部署配置

为静态构建设置 `FOCUSTIME_API_BASE_URL` 后执行 `node scripts/build.mjs`。生产网站与 API 使用 HTTPS，并为后端配置 `Cors__AllowedOrigins__0` 等环境变量，每项填写一个完整的网站 Origin，例如 `https://focus.example.com`。Development 的默认跨域清单包含 `localhost` 和 `127.0.0.1` 的 5173、5175 端口。网站只在本地回环页面接受 HTTP 回环 API。

正式投递使用后端已有的 SMTP 配置。切换发送方式时，网站请求字段和操作流程相同。开发验证码只从受控的服务端日志或投递目录读取。

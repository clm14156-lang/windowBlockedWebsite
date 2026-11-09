# 官网账号联调

网站和 Windows 客户端连接同一 FocusTime_Server 实例时，使用同一个 PostgreSQL 账号。注册写入现有 `identity.users`。找回密码更新同一行的密码哈希，并撤销原有登录会话。验证码与重置凭证沿用 `identity.email_challenges` 中的摘要和用途绑定。此次接入无需新增表或迁移，新的测试库仍需先执行后端现有迁移。

## 本地运行

本机官网与 `focusServe_admin` 统一连接 `http://127.0.0.1:5082`。后端已运行时直接复用该实例。若需要单独启动，在 `E:\FocusTime_Server` 中给 `ConnectionStrings__Database` 配置已迁移的开发数据库，然后启动 Development 服务。以下命令使用项目附带的 .NET 10 SDK。

```powershell
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:Email__Mode = 'Log'
& .\.tools\dotnet\dotnet.exe run --project src/FocusTime.Api --no-launch-profile -- --urls http://127.0.0.1:5082
```

若用 Windows 项目现有的本地登录服务脚本管理 5080，需先用其停止脚本释放旧后端进程，再在 `E:\FocusTime_Server` 运行 `& .\.tools\dotnet\dotnet.exe build src/FocusTime.Api -c Release`，然后用原启动脚本启动。该方式沿用现有开发数据库和 `.eml` 投递设置。使用上面的 `Log` 启动方式时，验证码从控制台读取。

在网站目录双击 `启动网站.cmd`，或使用下面的命令。`.preview-config.json` 保存本地官网端口 `5175` 和 API 根地址 `http://127.0.0.1:5082`，优先于系统遗留环境变量，以免再次连接已失效的 `https://192.168.1.5:5081`。直接运行和双击启动使用同一份配置。更换实例时修改该文件，或使用显式的 `--api-url` 参数；需要与 Windows 客户端连接的实例一致。

```powershell
.\启动网站.cmd

# 已将 Node 加入 PATH 时，也可以在前台运行：
node scripts/server.mjs --port 5175 --api-url http://127.0.0.1:5082
```

打开 `http://127.0.0.1:5175/features/`，点击「免费体验」，用一个开发测试邮箱申请验证码。在后端控制台查找 `Development email code for` 日志，按邮箱和用途 `register` 或 `reset` 取最新的六位码。验证码每次随机生成，10 分钟有效，同一邮箱至少间隔 60 秒再发送，每小时最多发送 5 次，每个挑战最多允许 5 次错误尝试。未知邮箱的找回请求返回同类挑战响应，但没有对应投递。`Log` 模式仅在 Development 可用。Windows 本地登录服务脚本继续使用 Development `Pickup` 模式，验证码保存在该脚本配置的 `.eml` 投递目录。

## 接口

「我的订单」通过 `GET /api/website-session/orders` 读取历史记录。代理向后端传入 `historyOnly=true`，后端先筛选已支付和已退款订单，再取最近 50 条。页面按状态展示 `paidAtUtc` 或退款凭据的 `refundedAtUtc`，金额为原订单金额。缺少历史时间时显示「待确认」。

「账号与安全」保留邮箱、密码及设备三项，并在底部单独提供注销账号。设备数从 `GET /api/website-session/devices` 获取，统计后端返回的有效登录设备，不将读取故障显示为零台。修改邮箱、密码及设备管理均连接真实后端，盾牌素材沿用 `assets/account-shield.svg`。

账号概览从现有 `GET /api/v1/me/membership` 读取有效权益，共用一份卡片展示免费、月、年、永久或体验状态。沿用 `plan`、`isActive`、`startsAtUtc`、`expiresAtUtc` 和 `serverTimeUtc`；本次只新增只读字段 `isTrial`，由当前生效权益对应的已执行管理员赠送记录（`reasonCode=trial`）确认，并排除订单绑定权益。此字段不改变套餐类型、授予规则、权限和有效期，不需要新增数据库迁移。

体验天数由后端起止时间计算，7 天权益显示「7天体验」，不将普通年会员的剩余 7 天误判为体验。日期使用浏览器当地时区显示，剩余天数向上取整并以服务端时间校准；到期及页面恢复时重新读取有效权益，保留其他仍有效权益，确认无权益后显示免费版。服务不可用时显示待确认状态，不伪装成免费版。升级后需重启后端加载只读字段、重启官网加载新导航。

| POST `/api/v1/auth/` 下的路径 | 请求字段 | 成功响应 |
| --- | --- | --- |
| `registration-code` | `email` | 200，挑战 ID、过期时间和重发间隔 |
| `register` | `email`、`challengeId`、`code`、`password`、可选 `device` | 201，携带设备时返回 Token 与账号资料；不携带设备时保留原账号资料响应 |
| `password-reset/code` | `email` | 200，通用挑战响应 |
| `password-reset/verify` | `challengeId`、`code` | 200，一次性重置凭证 |
| `password-reset/complete` | `resetTicket`、`newPassword` | 204，密码已更新 |
| `login` | `email`、`password`、`device` | 200，Windows 客户端登录响应 |
| `refresh` | `refreshToken`、`requestId` | 200，轮换后的令牌和账号资料 |
| `logout` | `refreshToken` | 204，撤销该会话 |

`GET /api/v1/auth/me` 使用 Bearer 访问令牌返回当前账号的 ID、邮箱和邮箱验证状态等资料。

官网注册通过同源 `POST /api/website-session/register` 转接后端 `register`。Node 复用现有浏览器标识构造设备信息，后端在同一事务中完成账号创建、验证码消耗和会话凭证签发；不需要额外调用登录接口。官网沿用现有 HttpOnly 持久会话 Cookie，浏览器只收到基本资料和会话到期时间，导航立即进入已登录状态，刷新可恢复。旧客户端不传 `device` 时继续收到原有账号资料响应。升级后需重新编译并启动后端、重启官网 Node 服务。

开发测试环境可使用模拟支付。先对 FocusTime_Server 数据库应用 `20261104120000_MembershipOrders` 迁移，再重启后端和官网 Node 服务。模拟二维码用于界面展示，订单与会员资格由后端持久化。

| 后端接口 | 用途 |
| --- | --- |
| `GET /api/v1/me/membership` | 读取当前账号的有效会员、套餐和到期时间 |
| `GET /api/v1/me/membership-orders` | 读取当前账号最近 50 笔订单 |
| `POST /api/v1/me/membership-orders` | 按 `plan`、`method` 和 `requestId` 创建订单，后端计算金额 |
| `POST /api/v1/me/membership-orders/{id}/method` | 修改待支付订单的支付方式 |
| `POST /api/v1/me/membership-orders/{id}/simulate-payment` | 先保存支付确认，再尝试发放会员；重复提交不会重复发放，开通失败保留已支付异常订单 |

官网通过同源会话服务转发上述接口。订单有效期为 15 分钟，新订单有限期套餐在现有有效期上续加订单快照的天数；旧订单保留原日历月快照。Windows 使用原有签名权益租约读取资格，月付对旧客户端仍表现为有期限会员，网站通过 `plan` 区分月付和年付。模拟订单的写入接口仅在后端 `Development` 或 `Testing` 环境开放。

订单闭环还需应用 `20261105123719_OrderFulfillment` 迁移，记录 `activationStatus`、关联授权、开通时间和失败原因。支付弹窗只有在本订单 `activationStatus=activated` 且会员有效时显示成功；失败时显示「重试开通会员」，复用原已支付订单，不重新计费。用户已经拥有其他有效会员时，本次订单失败也不会被误报成功。后台通过真实订单接口查询异常并可重试；数据库变更、权限及后续真实支付约束见后端 `docs/SIMULATED_PAYMENTS.md`。

官网登录通过同源的 `POST /api/website-session/login`、`GET /api/website-session/me` 和 `POST /api/website-session/logout` 转接以上接口。Node 服务将后端令牌保存在进程内存中，浏览器只收到随机会话标识和基础资料。登录弹窗已移除「记住我」选项，继续沿用原来默认勾选时的持久登录行为：登录请求仍发送 `remember: true`，HttpOnly Cookie 持续到后端会话到期。后端仍支持会话 Cookie，接口与会话管理机制不变。浏览器标识 Cookie 仅用于复用同一后端设备记录。服务进程重启后需重新登录，目前使用单实例会话存储。

## 部署配置

为静态构建设置 `FOCUSTIME_API_BASE_URL` 后执行 `node scripts/build.mjs`。生产网站与 API 使用 HTTPS，并为后端配置 `Cors__AllowedOrigins__0` 等环境变量，每项填写一个完整的网站 Origin，例如 `https://focus.example.com`。Development 的默认跨域清单包含 `localhost` 和 `127.0.0.1` 的 5173、5175 端口。网站只在本地回环页面接受 HTTP 回环 API。

生产环境同时启动 `node scripts/server.mjs`，设置 `FOCUSTIME_WEBSITE_ORIGIN` 为网站的完整 HTTPS Origin，设置 `FOCUSTIME_API_BASE_URL` 为 HTTPS 后端地址。由 HTTPS 反向代理将同源的 `/api/website-session/` 转发到该 Node 服务。生产会话 Cookie 带有 Secure、HttpOnly 和 SameSite=Strict 属性。注册验证码请求和找回密码继续按现有方式使用后端跨域配置，注册提交本身走同源会话代理。

正式投递使用后端已有的 SMTP 配置。切换发送方式时，网站请求字段和操作流程相同。开发验证码只从受控的服务端日志或投递目录读取。


## 套餐目录与报价版本

付费套餐使用公开 `GET /api/v1/membership-plans`，响应禁止缓存，浏览器不携带账号凭证。目录响应为 `{plans, simulationAvailable}`，每项包含 `id`、`name`、`amountFen`、`durationDays`、`currency`、`available`、`recommended`、`version`、`updatedAtUtc`。

此目录不走登录会话代理；受保护的订单仍走原同源会话代理。订单增加 `expectedPlanVersion`，价格变化/下架时刷新套餐后重试，不自动按新价下单。服务器返回的订单新增 `planName`、`durationDays`、`durationMonths` 和 `planVersion` 快照字段，支付弹窗只显示该订单的成交条款。部署前应用后端 `20261105143836_MembershipPlans`；后台管理员调价后，下次官网获取目录即显示最新值。

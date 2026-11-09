# 账号安全功能

前端复用现有账号中心和原生 dialog，由 `src/account-security.js` 统一管理四种流程。敏感请求均经过同源 Node 会话代理，浏览器不接收后端访问令牌或刷新令牌。密码和验证凭据只在当前弹窗内存中存在，关闭后清除。

## 接口和会话

以下路径以 `/api/website-session/` 为前缀，均为 POST。Node 只允许列出的路径，校验 Origin 与 Fetch Metadata，不代理任意 URL。

| 官网操作 | 后端接口（`/api/v1/`） |
| --- | --- |
| `security/email/current/code` | `me/security/email/current/code` |
| `security/email/current/verify` | `me/security/email/current/verify` |
| `security/email/new/code` | `me/security/email/new/code` |
| `security/email/complete` | `me/security/email/complete` |
| `security/password` | `me/security/password` |
| `security/closure/code` | `me/security/closure/code` |
| `security/closure/verify` | `me/security/closure/verify` |
| `security/closure/complete` | `me/security/closure/complete` |
| `devices/{id}/logout` | DELETE `me/devices/{id}/sessions` |
| `devices/logout-others` | POST `me/devices/logout-others` |

验证码最长 10 分钟有效，同一收件邮箱至少间隔 60 秒，每个账号或收件邮箱每小时最多 5 次；与注册、找回密码共享收件邮箱限制。每个验证码最多尝试 5 次。验证码及一次性验证凭据绑定用户、当前会话、安全戳和用途，发送新码使同用途旧码失效。新邮箱验证码还绑定已验证旧邮箱的凭据，有效期不超过该凭据。

修改密码使用现有 8–128 位、包含字母与数字的规则。错误当前密码计入现有锁定机制。修改密码或邮箱后撤销其他会话并换发当前会话凭证，原令牌立即失效；Node 更新服务端内存凭证，同时换发当前浏览器的 HttpOnly 会话 Cookie，保持原持久登录选择及到期时间。旧 Cookie 无法发起新请求；换发前已进入同一会话队列的请求可以正常完成。认证请求在单个官网会话内依次执行，防止后台读取或刷新与凭证修改竞争。

设备列表展示有效登录会话，并非实时心跳在线检测。登录时间取该设备当前有效会话的最早创建时间。退出指定设备只允许账号拥有的设备；退出其他设备保留当前设备的会话。

## 软注销与记录保留

依据用户确认，当前实施**软注销**：设置 `AppUser.ClosedAtUtc`，停用密码登录与找回密码，撤销所有会话、验证凭据和会员权益。邮箱绑定继续保留，不能用该邮箱重新注册。云端专注、任务、同步记录以及订单和审计数据暂时保留，不自动删除本地记录。没有新增自助恢复入口，也没有设定未经确认的云端清理期限。

在线会话立即失效；已签发离线会员凭据仍按现有离线有效期过期。弹窗已说明此行为。

## 通知和审计

安全操作写入 `identity.security_audits`，记录用户/会话 ID、操作、结果、错误码与时间，不写密码、验证码或令牌。密码修改和邮箱换绑在同一事务中创建 `identity.security_notifications` 发送任务，分别向绑定邮箱或旧、新邮箱投递通知。后台每 10 秒处理队列，发送失败退避重试，最长重试 24 小时；完成或超过重试期限后清除队列中的地址与正文。数据库变更不会因 SMTP 暂时不可用而回滚。

前端只提示“已安排发送”，不将排队状态描述为邮件已经送达。沿用后端 SMTP、Development Pickup 或 Log 投递方式；当前管理后台一键启动配置使用 Pickup，邮件写入配置的 `mail` 目录，外部邮箱收信需要配置 SMTP。

本机可沿用后端 `scripts/Get-LocalLoginCode.ps1` 取码，`-Purpose` 分别使用 `email-current`（原邮箱）、`email-new`（新邮箱）或 `closure`（注销）。`-Email` 填对应收件邮箱。脚本只读取开发邮箱，并核对当前挑战、会话与安全戳。

## 升级

后端先应用加法迁移 `20261108212948_AccountSecurity`，再重启后端及官网 Node 进程。此迁移仅增加账号关闭字段及验证码、通知、审计表。保留现有数据库、账号和登录设备。前端 CSS 为 `styles/account-security.css`，字体继续使用共享 `styles/typography.css`。

回归覆盖：密码校验及轮换、旧/新邮箱两次验证、验证码用途与会话绑定、重发限制、错误次数和过期、真实设备撤销、软注销后的登录与恢复阻断、云端记录保留、安全审计和通知重试；浏览器验证四种流程及 320–1440px 布局。

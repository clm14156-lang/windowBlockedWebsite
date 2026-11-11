// Display copy only. Paid prices, durations and availability come from the server catalog.
export const plans = [
  { id: 'free', name: '免费版', intro: '减少干扰，专心做好眼前的事。', price: '0', note: '体验基础专注功能', button: '体验免费版', features: [
    ['网站与应用屏蔽', true], ['专注计时与悬浮窗口', true], ['基础专注记录', true], ['目标与任务管理', false], ['详细投入统计', false],
  ] },
  { id: 'pro', name: '专业版', intro: '管理目标，让每一次专注都有迹可循。', features: [
    ['免费版的全部功能', true], ['目标与任务管理', true], ['目标进度追踪', true], ['专注日历与历史记录', true], ['详细投入趋势与分布', true],
  ] },
];

export const billingPlans = {
  monthly: { label: '月付', name: '月会员', icon: 'calendar' },
  annual: { label: '年付', name: '年会员', icon: 'crown' },
  lifetime: { label: '永久', name: '永久会员', icon: 'infinity' },
};
export const defaultBillingPlan = 'annual';
export const formatOrderAmount = amountFen => (amountFen / 100).toFixed(amountFen % 100 ? 2 : 0);
export const formatAccountDate = date => new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));

export function describeMembership(status) {
  if (!status) return '暂时无法读取会员状态';
  if (!status.isActive) return '免费版';
  const name = billingPlans[status.plan]?.name || '专业版';
  return `${name} · ${status.expiresAtUtc ? `有效期至 ${formatAccountDate(status.expiresAtUtc)}` : '永久有效'}`;
}

export const faqs = [
  ['支持屏蔽哪些浏览器、网站和应用？', [
    '专注时光支持屏蔽 Chrome 和 Edge 中指定的网站，以及 Windows 上选定的桌面应用。你可以按域名添加网站屏蔽规则，也可以从屏蔽清单中选择要限制的应用，减少工作和学习时的干扰。',
  ]],
  ['普通专注与强制专注有什么区别？', [
    '普通专注可以随时提前结束，适合日常工作和学习。',
    '强制专注开始后，无法通过软件提前结束专注或主动解除本次屏蔽，适合希望减少分心、提高自律性的用户。',
  ]],
  ['强制模式下，关闭软件或重启电脑能解除屏蔽吗？', [
    '正常关闭软件主界面不会解除强制屏蔽，后台防护程序会继续运行。',
    '重启电脑后，后台服务会恢复尚未结束的强制专注所用的屏蔽规则。重新打开软件后，可按提示继续计时。',
  ]],
  ['为什么网站屏蔽没有生效？', [
    '请先确认专注已开始，屏蔽功能和对应的网站规则均已启用，并检查规则中的域名是否正确。',
    '如果使用 Chrome 或 Edge，请确认对应的专注时光插件已安装并启用。如果仍无法屏蔽，可以尝试重新启动软件或联系客服。',
  ]],
  ['软件意外退出，专注记录会丢失吗？', [
    '已经成功保存的记录会留在本地。专注时光会在专注过程中定期保存进度。',
    '如果软件意外退出，重新启动后可按提示从最近一次成功保存的进度继续。完成后的记录会在登录且网络可用时按现有规则同步至云端。',
  ]],
  ['专注数据保存在本地还是云端？更换电脑能恢复吗？', [
    '专注记录会先保存在本地，登录后会在网络可用时自动同步已完成的记录。暂时断网也不会影响本地保存。',
    '更换电脑后，登录同一账号即可恢复已成功同步至云端的专注记录。未同步的数据仍保留在原设备。',
  ]],
  ['免费版与专业版有什么区别？', [
    '免费版提供基础的专注、任务管理和手动屏蔽功能，满足日常使用需求。',
    '专业版解锁强制专注、自动屏蔽、更多任务容量、更多个性化角色及高级数据统计等功能，适合需要更强专注管理能力的用户。',
  ]],
  ['如何申请退款？', [
    '会员订单可在支付成功后 3 天内申请无理由退款。官网目前尚未开放正式购买和退款入口。',
    '如需退款，请通过原购买渠道联系客服提交申请。符合退款条件的订单将在审核确认后处理，退款进度可通过客服查询。',
  ]],
];

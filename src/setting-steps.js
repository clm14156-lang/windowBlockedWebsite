// Keep steps and carousel scenes in the same order.
export const settingSteps = [
  {
    id: 'add', icon: 'globe', title: '添加网站', description: '将容易分心的网站加入屏蔽列表，减少干扰。',
    image: '/assets/product/lunbo_001.png', width: 924, height: 800,
    alt: '添加网站界面：填写网站地址，可添加备注名称。', windowTitle: '访问控制 · 添加网站',
  },
  {
    id: 'block', icon: 'shield', title: '开启屏蔽', description: '确认需要屏蔽的网站已开启，专注时间自动生效。',
    image: '/assets/product/lunbo_002.png', width: 924, height: 800,
    alt: '网站列表界面：哔哩哔哩、YouTube 与 TikTok 的屏蔽开关已开启。', windowTitle: '访问控制 · 屏蔽列表',
  },
  {
    id: 'focus', icon: 'clock', title: '开始专注', description: '选择专注时长，一键进入专注状态。',
    image: '/assets/product/lunbo_003.png', width: 924, height: 800,
    alt: '开始专注界面：选择专注时长，点击开始专注。', windowTitle: '专注 · 开始专注',
  },
];

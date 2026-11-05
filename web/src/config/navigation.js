// 素材放在 public/img；image 填写 'img/文件名.png'，不包含 public。
// 暂无素材时保留空字符串，自动显示 icon 指定的占位图标。
// 默认保留图片原色；imageMode: 'mask' 可将透明底剪影统一为金色。
export const NAV_ITEMS = [
  { key: 'overview', label: '街区概况', image: 'img/华润历史文化展览.png', icon: 'home' },
  { key: 'archive', label: '建筑档案', image: 'img/历史文化区域管理.png', imageMode: 'mask', icon: 'archive' },
  { key: 'participate', label: '参与设计', image: 'img/历史文化区域管理.png', icon: 'design' },
  { key: 'ai', label: 'AI 问答', image: 'img/历史文化村落保护.png', icon: 'chat' },
  { key: 'tools', label: '数据工具', image: '', icon: 'tools' },
  { key: 'economy', label: '经济运行', image: 'img/经济运行.png', icon: 'tools' },
  { key: 'tourism', label: '农文旅游', image: 'img/农文旅游.png', icon: 'home' },
  { key: 'ecology', label: '生态监测', image: 'img/生态监测.png', icon: 'tools' },
]

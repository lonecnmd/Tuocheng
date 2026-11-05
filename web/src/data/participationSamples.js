export const PARTICIPATION_ROLES = ['家庭', '家族成员', '居民', '设计团队', '其他人员']

export const PARTICIPATION_TOPICS = [
  { key: 'entrance', label: '入口', hint: '到达方式、导览与门面体验' },
  { key: 'function', label: '功能用途', hint: '未来使用与日常运营' },
  { key: 'facade', label: '立面修缮', hint: '材料、细部与原貌保护' },
  { key: 'courtyard', label: '院落使用', hint: '公共活动与开放方式' },
]

// 仅作页面样板，真实访客提交的内容另存于本机浏览器。
export const SAMPLE_OPINIONS = {
  house04: [
    { id: 's04-1', role: '居民', name: '老街居民', topic: 'entrance', text: '入口希望保留原有临街尺度，招牌不要遮住老墙面。', time: '2026-10-28T09:30:00+08:00' },
    { id: 's04-2', role: '设计团队', name: '街区设计组', topic: 'function', text: '可将一层安排为手作体验，二层展示打铁工具和口述记忆。', time: '2026-10-27T15:10:00+08:00' },
    { id: 's04-3', role: '家庭', name: '本地家庭', topic: 'facade', text: '修缮时希望能看见原来的砖墙和老铁铺门口的痕迹。', time: '2026-10-26T11:00:00+08:00' },
    { id: 's04-4', role: '其他人员', name: '街区访客', topic: 'courtyard', text: '若有小型休憩空间，可以安排手工活动，也方便游客停留。', time: '2026-10-25T14:20:00+08:00' },
  ],
  house05: [
    { id: 's05-1', role: '家族成员', name: '沙氏后人', topic: 'entrance', text: '入口应保留族人熟悉的门廊和行走路线，增加低调的导览说明。', time: '2026-10-29T10:40:00+08:00' },
    { id: 's05-2', role: '家庭', name: '返乡家庭', topic: 'function', text: '希望正厅既能展示家史，也能留出团聚和议事的空间。', time: '2026-10-28T18:00:00+08:00' },
    { id: 's05-3', role: '设计团队', name: '修缮研究组', topic: 'facade', text: '前廊拱券需先核实结构和材料，再讨论最小干预的修复方式。', time: '2026-10-27T09:15:00+08:00' },
    { id: 's05-4', role: '居民', name: '邻里代表', topic: 'courtyard', text: '院落可兼顾族人聚会与邻里活动，开放时间需要进一步商量。', time: '2026-10-26T16:30:00+08:00' },
  ],
}

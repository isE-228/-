/*
 * ==================== 可修改内容总表 ====================
 * 不用改 game.js：可以直接改下方文字、主题色、猫咪表情、音效、动画速度等。
 * 改完保存并刷新网页。自定义主题至少需要 2 种物品，最多建议 9 种。
 */
window.GAME_CONFIG = {
  // [网页文字] 页面标题、说明、按钮、提示语等都集中在这里。
  text: {
    title: '小猫家园', pageSuffix: '喵喵合成乐', subtitle: '放下小猫，收获一团软萌', eyebrow: '欢迎回到猫咪小窝', welcome: '让小猫咪们团团相遇',
    score: '本局鱼干', best: '最高鱼干', next: '下一只', restart: '重新开局', guideTitle: '猫咪成长手册',
    guide: '让两只相同的小猫咪碰在一起，它们就会合成更大、更萌的猫咪伙伴！',
    recordTitle: '猫窝小记录', current: '本局鱼干', personalBest: '最多鱼干', privacy: '🔒 记录只保存在这台设备，不联网、不上传。',
    tip: '小秘诀：轻轻调整投放位置，让相同花色的小猫靠在一起吧！',
    controls: '点击 / 轻触投放 · A D 或 ← → 移动 · 空格投放 · R 重开',
    hint: '移动鼠标 / 手指选择投放位置', canvasLabel: '游戏区域。点击或轻触投放，合并相同小猫。', footer: '一个安静的离线小游戏 · 没有广告，没有排行榜', offline: '离线也能玩',
    endEyebrow: '喵呜，玩得真棒', endTitle: '再陪小猫玩一局吗？', result: '本局鱼干', again: '🐾 再玩一次', install: '安装小猫家园',
    toastMerge: '喵呜！猫咪合体啦！', toastMax: '😻 猫咪家园大团圆！', toastBest: '喵！鱼干纪录刷新啦！', toastStart: '喵喵！新的一局开始啦！'
  },

  // [主题] 调整颜色即可更换整页观感；light / dark 会由顶部太阳按钮切换。
  theme: {
    page: '#fff3f3', ink: '#59434b', muted: '#a18a91', accent: '#dc829c', accentDark: '#b95f7a',
    board: '#fffaf7', boardBottom: '#f6e2df', line: '#f0dadd', card: '#fffdfc', highlight: '#f4bdc8',
    darkPage: '#30262d', darkInk: '#fff0f2', darkMuted: '#c9aeb7', darkBoard: '#493943', darkCard: '#3d3039'
  },

  // [游戏物品] 顺序决定猫咪成长链；相同小猫碰撞就会合成。颜色是猫咪毛色，表情可自定义。
  items: [
    { name: '奶牛小猫', emoji: '🐱', color: '#fff8ed', points: 1, radius: 19 },
    { name: '橘子小猫', emoji: '🐱', color: '#ffc786', points: 3, radius: 25 },
    { name: '奶油小猫', emoji: '🐱', color: '#f6dfb7', points: 6, radius: 32 },
    { name: '灰灰小猫', emoji: '🐱', color: '#c8cbd5', points: 10, radius: 40 },
    { name: '玳瑁小猫', emoji: '🐱', color: '#b78a71', points: 15, radius: 49 },
    { name: '布偶小猫', emoji: '🐱', color: '#d7c2e9', points: 22, radius: 59 },
    { name: '三花小猫', emoji: '🐱', color: '#f2b89b', points: 32, radius: 70 },
    { name: '月光猫猫', emoji: '🐱', color: '#b8d9e8', points: 45, radius: 82 },
    { name: '猫咪女王', emoji: '😻', color: '#f2c86b', points: 65, radius: 95 }
  ],

  // [玩法] 可调场地尺寸、投放速度和结束线高度。
  play: { width: 420, height: 620, wallPadding: 14, dangerLine: 0.22, dropDelay: 240, maxItemIndex: 4 },

  // [动画] 数值越短，合并动画越快；摇晃、弹跳、粒子数都能改。
  animation: { gravity: 1250, bounce: 0.48, floorBounce: 0.38, wallBounce: 0.58, surfaceFriction: 0.72, adhesion: 300, stickyRange: 8, mergeScale: 1.2, mergeDuration: 180, shake: 5, particles: 12, particleLife: 650 },

  // [音效] Web Audio 合成音，无需下载音频文件；enabled 默认开启。
  sound: { enabled: true, volume: 0.12, dropHz: 320, mergeHz: 660, duration: 0.12, meowDuration: 0.34, meowPitch: 620 }
};

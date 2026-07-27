export const GRID = 6;          // 每层菜地 6x6 格
export const LEVELS = 2;        // 两层梯田
export const UPPER_Y = 4.2;     // 二层农田高度
export const UPPER_Z = -7.1;    // 二层农田往后错开的距离
export const TILE = 1;          // 每格世界坐标尺寸
export const LAWN_R = 31;       // 草地半径：预留出盖新建筑的地方
export const UNLOCK_COST = 1000; // 二层每块地的解锁价
export const WET_DURATION = 45; // 浇一次水保持湿润的秒数
export const START_COINS = 20;

// 慢动作田园：生长时间统一放慢 5 倍，削一削经济
export const SEEDS = [
  { id: 'sweetpot',   name: '红薯',   emoji: '🍠', cost: 0,   sell: 1,    growTime: 50,   unlock: 0 },
  { id: 'radish',     name: '萝卜',   emoji: '🥕', cost: 5,   sell: 12,   growTime: 100,  unlock: 0 },
  { id: 'potato',     name: '土豆',   emoji: '🥔', cost: 8,   sell: 22,   growTime: 140,  unlock: 30 },
  { id: 'cabbage',    name: '白菜',   emoji: '🥬', cost: 15,  sell: 40,   growTime: 200,  unlock: 60 },
  { id: 'tomato',     name: '番茄',   emoji: '🍅', cost: 20,  sell: 55,   growTime: 225,  unlock: 100 },
  { id: 'corn',       name: '玉米',   emoji: '🌽', cost: 35,  sell: 105,  growTime: 300,  unlock: 200 },
  { id: 'strawberry', name: '草莓',   emoji: '🍓', cost: 55,  sell: 170,  growTime: 375,  unlock: 320 },
  { id: 'pumpkin',    name: '南瓜',   emoji: '🎃', cost: 80,  sell: 240,  growTime: 450,  unlock: 400 },
  { id: 'eggplant',   name: '茄子',   emoji: '🍆', cost: 120, sell: 380,  growTime: 550,  unlock: 650 },
  { id: 'watermelon', name: '西瓜',   emoji: '🍉', cost: 170, sell: 560,  growTime: 650,  unlock: 900 },
  { id: 'pineapple',  name: '菠萝',   emoji: '🍍', cost: 230, sell: 780,  growTime: 750,  unlock: 1200 },
  { id: 'crystal',    name: '水晶果', emoji: '🔮', cost: 300, sell: 1000, growTime: 900,  unlock: 1500 },
  { id: 'starfruit',  name: '星星果', emoji: '⭐', cost: 450, sell: 1600, growTime: 1200, unlock: 2200 },
  { id: 'rainbow',    name: '彩虹果', emoji: '🌈', cost: 650, sell: 2500, growTime: 1500, unlock: 3000 },
];

export const SOILS = [
  { name: '普通土', speed: 1,    yield: 1, cost: 0,   color: 0x9a7355 },
  { name: '肥沃土', speed: 1.4,  yield: 1, cost: 50,  color: 0x7a5033 },
  { name: '黑金土', speed: 1.8,  yield: 2, cost: 200, color: 0x4a3320 },
];

export const WATER_LEVELS = [
  { name: '手动水壶', desc: '点击浇水，一次浇一格', cost: 0 },
  { name: '洒水器',   desc: '浇水时覆盖 3×3 范围', cost: 150 },
  { name: '自动灌溉', desc: '所有土地自动保持湿润，无需浇水', cost: 500 },
];

export const DECORS = [
  { id: 'fence',     name: '小栅栏', emoji: '🪵', cost: 30 },
  { id: 'flower',    name: '花盆',   emoji: '🌼', cost: 40 },
  { id: 'scarecrow', name: '稻草人', emoji: '🎩', cost: 60 },
  { id: 'lamp',      name: '小灯',   emoji: '💡', cost: 90 },
  { id: 'windmill',  name: '小风车', emoji: '🌀', cost: 120 },
];

// 稀有品质：种下时暗中决定，收获入背包单独计
export const QUALITIES = {
  silver: { name: '白银', emoji: '🥈', mult: 2 },
  gold:   { name: '黄金', emoji: '🥇', mult: 3 },
};
export const GOLD_CHANCE = 0.05;
export const SILVER_CHANCE = 0.15;

// 工坊：作物加工成罐头，卖价 ×3
// 工坊：2 个同种作物加工成 1 个罐头，罐头卖价 = 2 个原料总价 × 1.5（向下取整）
// 即每个作物做成罐头只增值 50%，远不如凑配方做料理（×3）划算
export const WORKSHOP = { slots: 3, time: 120, ingredients: 2, bonus: 1.5 };

// 昼夜循环：现实 20 分钟 = 游戏一天（白天/夜晚各 10 分钟），夜晚生长减半
export const DAY_CYCLE = 1200;      // 秒
export const NIGHT_SLOW = 0.5;

// 快捷操作
export const QUICK_WATER_COST = 10; // 一键浇水价格

// 恐龙虾卵：泥土加水的小惊喜，浇水时每块被浇的地 5% 概率出现，自动入背包
export const EGG = { key: 'egg', name: '恐龙虾卵', emoji: '🦐', sell: 10, chance: 0.05 };

// 恶劣天气：每天掷一次，大旱 15%、暴雨 20%
// 大旱：三个太阳，生长 ×1/3；暴雨：持续降雨，生长速度正常
// 两种天气下收获的作物都是"生长不良"，只卖半价——纯削经济，没有福利
export const DROUGHT = { chance: 0.15, growSlow: 1 / 3, sellMult: 0.5 };
export const RAIN = { chance: 0.2 };

// 商场道具：存在独立的道具背包里，和作物背包分开
export const ITEMS = [
  {
    id: 'fertilizer', name: '肥料', emoji: '💊', cost: 50,
    desc: '随机挑 2 块地里的作物，让它们立刻成熟',
  },
  {
    id: 'luck', name: '幸运药剂', emoji: '🧪', cost: 100,
    desc: '随机挑 2 块地施法，下次在这里播种时白银/黄金概率翻倍',
  },
  {
    id: 'net', name: '抓鱼网', emoji: '🕸️', cost: 100,
    desc: '拿到水滩摆放，20 分钟后收网，随机捞到 50~150💰',
  },
  {
    id: 'restorer', name: '恢复器', emoji: '🔧', cost: 250,
    desc: '当场修好一块受灾的地（不修的话，天气转好后也会自然恢复）',
  },
  {
    id: 'pesticide', name: '杀虫剂', emoji: '🧴', cost: 70,
    desc: '一键清光全场虫害（也可以直接点作物上的虫子免费拍掉）',
  },
  {
    id: 'antidote', name: '解毒剂', emoji: '💉', cost: 20,
    desc: '徒手拍虫有 5% 中毒风险，中毒后 60 秒内必须用它解毒，否则死亡',
  },
  {
    id: 'rod', name: '鱼竿', emoji: '🎣', cost: 100, once: true,
    desc: '永久渔具：点击水塘进入钓鱼模式安心垂钓，每分钟 90% 概率钓到 5~10💰',
  },
  {
    id: 'castnet', name: '渔网', emoji: '🥅', cost: 110, once: true,
    desc: '永久渔具：钓鱼时顺手撒一网，每分钟 70% 概率再捞 10~20💰（配合鱼竿使用）',
  },
];

// 主动钓鱼：进入钓鱼模式后每分钟结算一次
export const ROD = { chance: 0.9, min: 5, max: 10 };
export const CASTNET = { chance: 0.7, min: 10, max: 20 };

// 水塘装饰：30 种按稀有度定价，买断制，钓鱼区最多同时摆 3 个，全部会动
export const POND_RARITY = {
  common: { name: '普通', color: '#8a9aa8' },
  rare:   { name: '稀有', color: '#4a90c2' },
  epic:   { name: '史诗', color: '#8a4ac2' },
  legend: { name: '传说', color: '#e0a020' },
};
export const POND_MAX_PLACED = 3;
// kind 决定模型，anim 决定动法：circle 绕塘游 / bob 水面漂 / hover 空中盘旋
export const POND_DECORS = [
  // —— 普通 ——
  { id: 'duck_y',   name: '小黄鸭',   rarity: 'common', cost: 80,  kind: 'duck', color: 0xf2c94c, anim: { type: 'circle', radius: 1.6, speed: 0.5 } },
  { id: 'duck_w',   name: '小白鸭',   rarity: 'common', cost: 90,  kind: 'duck', color: 0xf5f0e6, anim: { type: 'circle', radius: 2.0, speed: 0.45 } },
  { id: 'duck_g',   name: '绿头鸭',   rarity: 'common', cost: 110, kind: 'duck', color: 0x9a8a6a, head: 0x2a7a4a, anim: { type: 'circle', radius: 2.4, speed: 0.4 } },
  { id: 'lily',     name: '大荷叶',   rarity: 'common', cost: 60,  kind: 'lily', color: 0x5c9b52, anim: { type: 'bob', speed: 1.2 } },
  { id: 'lotus_p',  name: '粉荷花',   rarity: 'common', cost: 120, kind: 'lotus', color: 0xf2a7c3, anim: { type: 'bob', speed: 1 } },
  { id: 'lotus_w',  name: '白荷花',   rarity: 'common', cost: 110, kind: 'lotus', color: 0xf5f0e6, anim: { type: 'bob', speed: 0.9 } },
  { id: 'buoy_r',   name: '红浮标',   rarity: 'common', cost: 70,  kind: 'buoy', color: 0xd9534f, anim: { type: 'bob', speed: 1.6 } },
  { id: 'buoy_y',   name: '黄浮标',   rarity: 'common', cost: 70,  kind: 'buoy', color: 0xf2c94c, anim: { type: 'bob', speed: 1.4 } },
  { id: 'turtle',   name: '小乌龟',   rarity: 'common', cost: 150, kind: 'turtle', color: 0x5c8a52, anim: { type: 'circle', radius: 1.2, speed: 0.22 } },
  { id: 'frog',     name: '荷叶青蛙', rarity: 'common', cost: 130, kind: 'frog', color: 0x6aae5e, anim: { type: 'bob', speed: 2 } },
  { id: 'reed',     name: '芦苇丛',   rarity: 'common', cost: 90,  kind: 'reed', color: 0x8a9a5a, anim: { type: 'bob', speed: 0.8 } },
  { id: 'lily2',    name: '睡莲丛',   rarity: 'common', cost: 100, kind: 'lily', color: 0x4a8a62, double: true, anim: { type: 'bob', speed: 1.1 } },
  // —— 稀有 ——
  { id: 'koi_r',    name: '红锦鲤',   rarity: 'rare', cost: 400, kind: 'koi', color: 0xd9534f, anim: { type: 'circle', radius: 2.2, speed: 0.8 } },
  { id: 'koi_g',    name: '金锦鲤',   rarity: 'rare', cost: 500, kind: 'koi', color: 0xe0a020, anim: { type: 'circle', radius: 2.6, speed: 0.85 } },
  { id: 'koi_w',    name: '白锦鲤',   rarity: 'rare', cost: 450, kind: 'koi', color: 0xf0ece4, anim: { type: 'circle', radius: 1.8, speed: 0.75 } },
  { id: 'boat',     name: '小木船',   rarity: 'rare', cost: 550, kind: 'boat', color: 0x9a6a42, anim: { type: 'bob', speed: 0.7 } },
  { id: 'dfly_r',   name: '红蜻蜓',   rarity: 'rare', cost: 300, kind: 'dragonfly', color: 0xd9534f, anim: { type: 'hover', radius: 0.8, speed: 1.6 } },
  { id: 'dfly_b',   name: '蓝蜻蜓',   rarity: 'rare', cost: 300, kind: 'dragonfly', color: 0x4a90c2, anim: { type: 'hover', radius: 1.1, speed: 1.9 } },
  { id: 'egret',    name: '白鹭',     rarity: 'rare', cost: 600, kind: 'bird', color: 0xf5f0e6, anim: { type: 'bob', speed: 0.5 } },
  { id: 'crane',    name: '灰鹤',     rarity: 'rare', cost: 550, kind: 'bird', color: 0x9aa8b0, anim: { type: 'bob', speed: 0.45 } },
  { id: 'lantern',  name: '荷花灯',   rarity: 'rare', cost: 350, kind: 'lantern', color: 0xf2a7c3, anim: { type: 'bob', speed: 0.9 } },
  { id: 'island',   name: '迷你浮岛', rarity: 'rare', cost: 500, kind: 'island', color: 0x6aae5e, anim: { type: 'bob', speed: 0.4 } },
  // —— 史诗 ——
  { id: 'swan_w',   name: '白天鹅',   rarity: 'epic', cost: 1200, kind: 'swan', color: 0xf5f0e6, anim: { type: 'circle', radius: 2.8, speed: 0.35 } },
  { id: 'swan_b',   name: '黑天鹅',   rarity: 'epic', cost: 1500, kind: 'swan', color: 0x2a2a30, anim: { type: 'circle', radius: 2.2, speed: 0.4 } },
  { id: 'fountain', name: '小喷泉',   rarity: 'epic', cost: 1300, kind: 'fountain', color: 0xd4c9b8, anim: { type: 'bob', speed: 0.3 } },
  { id: 'wheel',    name: '水车',     rarity: 'epic', cost: 1400, kind: 'wheel', color: 0x9a6a42, anim: { type: 'bob', speed: 0.2 } },
  { id: 'flamingo', name: '火烈鸟',   rarity: 'epic', cost: 1600, kind: 'bird', color: 0xf08098, anim: { type: 'bob', speed: 0.55 } },
  // —— 传说 ——
  { id: 'swan_gold', name: '金色天鹅', rarity: 'legend', cost: 3000, kind: 'swan', color: 0xe0b64a, glow: true, anim: { type: 'circle', radius: 3.2, speed: 0.3 } },
  { id: 'koi_king',  name: '锦鲤王',   rarity: 'legend', cost: 3500, kind: 'koi', color: 0xe0364a, scale: 1.9, glow: true, anim: { type: 'circle', radius: 3.0, speed: 0.55 } },
  { id: 'jelly',     name: '发光水母', rarity: 'legend', cost: 4000, kind: 'jelly', color: 0x6ae0d0, glow: true, anim: { type: 'hover', radius: 1.4, speed: 0.8 } },
];
export const pondDecorById = (id) => POND_DECORS.find(d => d.id === id);

// 杂交室：两种指定品质的作物合成一个杂交作物，卖价极高（约原料 5 倍）
// a/b: [作物id, 品质 0普通/1白银/2黄金]
export const HYBRIDS = [
  // —— 普通配对，入门款 ——
  { id: 'h1',  name: '萝卜薯',   emoji: '🥣', a: ['sweetpot', 0], b: ['radish', 0],     sell: 60 },
  { id: 'h2',  name: '土萝铃',   emoji: '🔔', a: ['potato', 0],   b: ['radish', 0],     sell: 160 },
  { id: 'h3',  name: '菜薯球',   emoji: '🥎', a: ['cabbage', 0],  b: ['potato', 0],     sell: 300 },
  { id: 'h4',  name: '茄菜锦',   emoji: '🎀', a: ['tomato', 0],   b: ['cabbage', 0],    sell: 450 },
  { id: 'h5',  name: '金茄穗',   emoji: '🌾', a: ['corn', 0],     b: ['tomato', 0],     sell: 750 },
  { id: 'h6',  name: '莓香穗',   emoji: '🍡', a: ['strawberry', 0], b: ['corn', 0],     sell: 1300 },
  { id: 'h7',  name: '莓瓜宝',   emoji: '🧧', a: ['pumpkin', 0],  b: ['strawberry', 0], sell: 1900 },
  { id: 'h8',  name: '紫金瓜',   emoji: '🟣', a: ['eggplant', 0], b: ['pumpkin', 0],    sell: 2900 },
  { id: 'h9',  name: '墨玉瓜',   emoji: '🖤', a: ['watermelon', 0], b: ['eggplant', 0], sell: 4400 },
  { id: 'h10', name: '菠西蜜',   emoji: '🍯', a: ['pineapple', 0], b: ['watermelon', 0], sell: 6200 },
  // —— 白银配对 ——
  { id: 'h11', name: '银穗茄',   emoji: '🥈', a: ['tomato', 1],   b: ['corn', 1],       sell: 1600 },
  { id: 'h12', name: '银霜果',   emoji: '❄️', a: ['strawberry', 1], b: ['pumpkin', 1],  sell: 4000 },
  { id: 'h13', name: '银波蜜',   emoji: '🌊', a: ['watermelon', 1], b: ['pineapple', 1], sell: 13000 },
  { id: 'h14', name: '晶瓜灵',   emoji: '💠', a: ['crystal', 0],  b: ['pumpkin', 1],    sell: 7000 },
  { id: 'h15', name: '晶辰花',   emoji: '💮', a: ['crystal', 0],  b: ['starfruit', 0],  sell: 12500 },
  // —— 黄金与传说配对 ——
  { id: 'h16', name: '鎏金瓜',   emoji: '🏵️', a: ['pumpkin', 2],  b: ['corn', 2],       sell: 5500 },
  { id: 'h17', name: '金焰果',   emoji: '🔥', a: ['strawberry', 2], b: ['watermelon', 2], sell: 11000 },
  { id: 'h18', name: '星虹晶',   emoji: '🌠', a: ['starfruit', 0], b: ['rainbow', 0],   sell: 20000 },
  { id: 'h19', name: '神辉结晶', emoji: '💎', a: ['crystal', 2],  b: ['starfruit', 2],  sell: 40000 },
  { id: 'h20', name: '创世之种', emoji: '🌟', a: ['rainbow', 2],  b: ['rainbow', 2],    sell: 75000 },
];
export const hybridById = (id) => HYBRIDS.find(h => h.id === id);
// 宠物间：买断制，同时只能展示一只；房间装饰另计
export const PET_POS = { x: 0, y: -60, z: 60 };
export const PETS = [
  // 普通
  { id: 'chick',   name: '小鸡',     emoji: '🐤', rarity: 'common', cost: 200,   kind: 'chick',  c1: 0xf7d154, c2: 0xe8843f },
  { id: 'bunny',   name: '小兔',     emoji: '🐰', rarity: 'common', cost: 300,   kind: 'bunny',  c1: 0xf5f0e6, c2: 0xf2a7c3 },
  { id: 'duckling',name: '小鸭',     emoji: '🐥', rarity: 'common', cost: 260,   kind: 'chick',  c1: 0xf2c94c, c2: 0xe8a53d },
  { id: 'piglet',  name: '小猪',     emoji: '🐷', rarity: 'common', cost: 400,   kind: 'piglet', c1: 0xf2a7c3, c2: 0xe08fa8 },
  { id: 'lamb',    name: '小羊',     emoji: '🐑', rarity: 'common', cost: 450,   kind: 'lamb',   c1: 0xf5f0e6, c2: 0x9a8a7a },
  // 稀有
  { id: 'cat_o',   name: '橘猫',     rarity: 'rare', emoji: '🐱', cost: 900,   kind: 'cat',   c1: 0xe8942f, c2: 0xf5e0c0 },
  { id: 'cat_b',   name: '黑猫',     rarity: 'rare', emoji: '🐈‍⬛', cost: 1000,  kind: 'cat',   c1: 0x3a3a44, c2: 0x6ae0a0 },
  { id: 'dog_s',   name: '柴犬',     rarity: 'rare', emoji: '🐕', cost: 1100,  kind: 'dog',   c1: 0xd9a05a, c2: 0xf5f0e6 },
  { id: 'fox',     name: '小狐狸',   rarity: 'rare', emoji: '🦊', cost: 1400,  kind: 'fox',   c1: 0xe8742f, c2: 0xf5f0e6 },
  { id: 'panda',   name: '小熊猫',   rarity: 'rare', emoji: '🐼', cost: 1600,  kind: 'panda', c1: 0xf5f0e6, c2: 0x2a2a30 },
  // 史诗
  { id: 'owl',     name: '猫头鹰',   rarity: 'epic', emoji: '🦉', cost: 3000,  kind: 'owl',   c1: 0xa0794a, c2: 0xf2c94c },
  { id: 'peacock', name: '孔雀',     rarity: 'epic', emoji: '🦚', cost: 3500,  kind: 'peacock', c1: 0x2a8a9a, c2: 0x4ac0a0 },
  { id: 'deer',    name: '小鹿',     rarity: 'epic', emoji: '🦌', cost: 3200,  kind: 'deer',  c1: 0xc99a5a, c2: 0xf5f0e6 },
  { id: 'wolf',    name: '雪狼',     rarity: 'epic', emoji: '🐺', cost: 4000,  kind: 'wolf',  c1: 0xc8d4e0, c2: 0x8a9aa8 },
  { id: 'turtle_p',name: '仙龟',     rarity: 'epic', emoji: '🐢', cost: 3800,  kind: 'turtle',c1: 0x5c9b52, c2: 0xc9a05a },
  // 传说
  { id: 'dragon',  name: '幼龙',     rarity: 'legend', emoji: '🐲', cost: 12000, kind: 'dragon', c1: 0x4ac06a, c2: 0xe0b64a, glow: 0.4 },
  { id: 'phoenix', name: '朱雀',     rarity: 'legend', emoji: '🔥', cost: 15000, kind: 'phoenix',c1: 0xf05a2a, c2: 0xf2c94c, glow: 0.6 },
  { id: 'unicorn', name: '独角兽',   rarity: 'legend', emoji: '🦄', cost: 14000, kind: 'unicorn',c1: 0xf7f2ea, c2: 0xf2a7c3, glow: 0.4 },
  { id: 'kirin',   name: '麒麟',     rarity: 'legend', emoji: '✨', cost: 18000, kind: 'kirin',  c1: 0xe0b64a, c2: 0x6ae0d0, glow: 0.6 },
  { id: 'catgold', name: '招财猫',   rarity: 'legend', emoji: '🪙', cost: 20000, kind: 'cat',    c1: 0xe0b64a, c2: 0xf7f2ea, glow: 0.5 },
];
export const petById = (id) => PETS.find(p => p.id === id);

// 宠物间的房间装饰（10 种，各自摆在固定位置）
// 和小屋家具一样：买下后可升到 3 级，解锁的外观随时切换
export const PET_DECORS = [
  { id: 'bed',      name: '宠物窝',   emoji: '🛏️', cost: 300, up: [600, 1500],  kind: 'petbed',  pos: [-2.6, 1.4],  levelNames: ['草编窝', '软垫窝', '豪华四柱床', '皇家顶篷床', '星空梦境床'] },
  { id: 'bowl',     name: '食碗',     emoji: '🥣', cost: 200, up: [400, 1000],  kind: 'bowl',    pos: [1.6, 1.8],   levelNames: ['塑料碗', '陶瓷双碗', '自动喂食器', '智能餐台', '黄金自助餐厅'] },
  { id: 'ball',     name: '毛线球',   emoji: '🧶', cost: 150, up: [300, 750],   kind: 'ball',    pos: [2.4, 0.2],   levelNames: ['小线球', '双色线球', '逗猫棒套装', '逗猫乐园', '激光旋转塔'] },
  { id: 'tree',     name: '猫爬架',   emoji: '🪜', cost: 900, up: [1800, 4500], kind: 'cattree', pos: [-3.2, -1.6], levelNames: ['单层架', '双层架', '顶天猫别墅', '三层猫堡', '摩天猫塔'] },
  { id: 'plant',    name: '观叶盆栽', emoji: '🪴', cost: 400, up: [800, 2000],  kind: 'petplant',pos: [3.2, -1.8],  levelNames: ['小盆栽', '龟背竹', '室内绿植墙', '巨型盆景', '发光仙境树'] },
  { id: 'rug',      name: '圆地毯',   emoji: '⭕', cost: 350, up: [700, 1750],  kind: 'petrug',  pos: [0, 0.6],     levelNames: ['素色垫', '双色圆毯', '奢华绒毯', '星纹波斯毯', '魔法光环毯'] },
  { id: 'window',   name: '猫窗台',   emoji: '🪟', cost: 700, up: [1400, 3500], kind: 'perch',   pos: [-4.2, -3.4], levelNames: ['木搁板', '软垫窗台', '全景观景台', '豪华飘窗', '全景玻璃塔'] },
  { id: 'fountain', name: '饮水机',   emoji: '⛲', cost: 600, up: [1200, 3000], kind: 'petfount',pos: [2.9, 2.6],   levelNames: ['小水盆', '循环饮水机', '三层流水泉', '四层叠泉', '水晶发光泉'] },
  { id: 'toybox',   name: '玩具箱',   emoji: '🧸', cost: 500, up: [1000, 2500], kind: 'toybox',  pos: [-1.4, 2.8],  levelNames: ['小木箱', '玩具满箱', '游乐架', '猫咪游乐场', '梦幻旋转木马'] },
  { id: 'lamp',     name: '暖光灯',   emoji: '💡', cost: 800, up: [1600, 4000], kind: 'petlamp', pos: [4.0, 0.8],   levelNames: ['小夜灯', '落地暖灯', '水晶吊灯', '黄金枝形灯', '星河水晶吊灯'] },
];
export const petDecorById = (id) => PET_DECORS.find(d => d.id === id);

export const HYBRID_POS = { x: -60, y: -60, z: 0 }; // 3D 实验室藏在岛下
export const HYBRID_TIME = 600;  // 培养 10 分钟
export const HYBRID_SLOTS = 5;   // 5 个玻璃培养罩

// 天灾毁地：旱天晒裂、雨天水泡，随机 5~10 块，修复前不能种田
export const DAMAGE = { min: 5, max: 10 };

// 虫害：作物成熟那一刻 15% 概率生虫，不打药收上来就是生长不良
export const PEST = { chance: 0.15 };

// 徒手拍虫的代价：5% 概率中毒，60 秒内不解毒就死亡，复活要躺 90 秒
export const POISON = { chance: 0.05, timeout: 60, reviveTime: 90 };

// 抓鱼水滩：最多同时摆 5 张网，是亏是赚全看脸
export const FISHING = { slots: 5, time: 1200, rewardMin: 50, rewardMax: 150 };

// 黑房子银行：每天结束结算存款，85% 赚 1~3，15% 亏 1~3
export const BANK = { gainChance: 0.85, magMin: 1, magMax: 3 };

// 图鉴大楼：14 作物 × 3 品质 = 42 个说明台，同作物同品质只能收录一次
export const CODEX_POS = { x: 60, y: -60, z: 0 };
export const CODEX_QUALITIES = [undefined, 'silver', 'gold'];
export const itemById = (id) => ITEMS.find(i => i.id === id);

// 料理工坊：50 种料理，凑齐指定品质的作物就能做，卖价是原料单卖的 3 倍
// recipe 每项 [作物id, 品质档 0普通/1白银/2黄金, 数量]
export const DISH_MULT = 3;
export const COOK_TIME = 360;  // 每道菜要炒 6 分钟
export const COOK_SLOTS = 3;   // 3 个灶位可以同时开火
export const DISHES = [
  // —— 一档：家常小菜（便宜作物·普通品质）——
  { id: 'd1',  name: '烤红薯',     emoji: '🍠', recipe: [['sweetpot', 0, 3]] },
  { id: 'd2',  name: '蜜汁红薯',   emoji: '🍯', recipe: [['sweetpot', 0, 6]] },
  { id: 'd3',  name: '凉拌萝卜',   emoji: '🥕', recipe: [['radish', 0, 3]] },
  { id: 'd4',  name: '萝卜炖汤',   emoji: '🍲', recipe: [['radish', 0, 2], ['potato', 0, 1]] },
  { id: 'd5',  name: '炸薯条',     emoji: '🍟', recipe: [['potato', 0, 3]] },
  { id: 'd6',  name: '土豆泥',     emoji: '🥔', recipe: [['potato', 0, 2], ['cabbage', 0, 1]] },
  { id: 'd7',  name: '醋溜白菜',   emoji: '🥬', recipe: [['cabbage', 0, 3]] },
  { id: 'd8',  name: '白菜豆腐煲', emoji: '🍲', recipe: [['cabbage', 0, 2], ['potato', 0, 1]] },
  { id: 'd9',  name: '番茄炒蛋',   emoji: '🍳', recipe: [['tomato', 0, 3]] },
  { id: 'd10', name: '番茄浓汤',   emoji: '🥣', recipe: [['tomato', 0, 2], ['radish', 0, 1]] },
  // —— 二档：农家菜（中档作物）——
  { id: 'd11', name: '奶油玉米',   emoji: '🌽', recipe: [['corn', 0, 3]] },
  { id: 'd12', name: '玉米排骨',   emoji: '🍖', recipe: [['corn', 0, 2], ['potato', 0, 2]] },
  { id: 'd13', name: '田园沙拉',   emoji: '🥗', recipe: [['radish', 0, 1], ['cabbage', 0, 1], ['tomato', 0, 1]] },
  { id: 'd14', name: '烤蔬菜串',   emoji: '🍢', recipe: [['potato', 0, 2], ['tomato', 0, 1], ['corn', 0, 1]] },
  { id: 'd15', name: '草莓果酱',   emoji: '🍓', recipe: [['strawberry', 0, 2]] },
  { id: 'd16', name: '草莓奶昔',   emoji: '🥤', recipe: [['strawberry', 0, 3]] },
  { id: 'd17', name: '南瓜浓汤',   emoji: '🎃', recipe: [['pumpkin', 0, 2]] },
  { id: 'd18', name: '南瓜派',     emoji: '🥧', recipe: [['pumpkin', 0, 2], ['corn', 0, 1]] },
  { id: 'd19', name: '鱼香茄子',   emoji: '🍆', recipe: [['eggplant', 0, 2]] },
  { id: 'd20', name: '红烧茄子煲', emoji: '🍲', recipe: [['eggplant', 0, 2], ['tomato', 0, 1]] },
  // —— 三档：进阶料理（高档作物 + 白银）——
  { id: 'd21', name: '草莓蛋糕',   emoji: '🍰', recipe: [['strawberry', 1, 2]] },
  { id: 'd22', name: '水果拼盘',   emoji: '🍉', recipe: [['watermelon', 0, 1], ['strawberry', 0, 2]] },
  { id: 'd23', name: '西瓜冰沙',   emoji: '🧊', recipe: [['watermelon', 0, 2]] },
  { id: 'd24', name: '菠萝咕咾肉', emoji: '🍍', recipe: [['pineapple', 0, 1], ['potato', 0, 2]] },
  { id: 'd25', name: '菠萝披萨',   emoji: '🍕', recipe: [['pineapple', 0, 1], ['tomato', 0, 1], ['cabbage', 0, 1]] },
  { id: 'd26', name: '蔬菜大杂烩', emoji: '🍲', recipe: [['cabbage', 0, 1], ['eggplant', 0, 1], ['pumpkin', 0, 1], ['tomato', 0, 1]] },
  { id: 'd27', name: '农家丰收宴', emoji: '🍱', recipe: [['potato', 1, 1], ['corn', 1, 1], ['pumpkin', 0, 1]] },
  { id: 'd28', name: '银光南瓜盅', emoji: '🎃', recipe: [['pumpkin', 1, 2]] },
  { id: 'd29', name: '白银茄子煲', emoji: '🍆', recipe: [['eggplant', 1, 2]] },
  { id: 'd30', name: '草莓千层',   emoji: '🍰', recipe: [['strawberry', 1, 3]] },
  // —— 四档：大餐（白银/黄金 + 顶级作物）——
  { id: 'd31', name: '西瓜盛宴',   emoji: '🍉', recipe: [['watermelon', 1, 2]] },
  { id: 'd32', name: '黄金薯球',   emoji: '🥔', recipe: [['potato', 2, 3]] },
  { id: 'd33', name: '菠萝盛宴',   emoji: '🍍', recipe: [['pineapple', 1, 2]] },
  { id: 'd34', name: '水晶羹',     emoji: '🔮', recipe: [['crystal', 0, 1]] },
  { id: 'd35', name: '水晶果冻',   emoji: '🍮', recipe: [['crystal', 0, 2]] },
  { id: 'd36', name: '星光沙拉',   emoji: '⭐', recipe: [['starfruit', 0, 1], ['strawberry', 1, 2]] },
  { id: 'd37', name: '黄金南瓜宴', emoji: '🎃', recipe: [['pumpkin', 2, 2]] },
  { id: 'd38', name: '白银水果塔', emoji: '🍰', recipe: [['strawberry', 1, 1], ['watermelon', 1, 1], ['pineapple', 1, 1]] },
  { id: 'd39', name: '水晶炖盅',   emoji: '🔮', recipe: [['crystal', 0, 1], ['pumpkin', 1, 2]] },
  { id: 'd40', name: '皇家蔬菜锅', emoji: '🍲', recipe: [['eggplant', 1, 2], ['pumpkin', 1, 1], ['crystal', 0, 1]] },
  // —— 五档：顶级盛宴（黄金 + 星星果/彩虹果）——
  { id: 'd41', name: '水晶盛宴',       emoji: '🔮', recipe: [['crystal', 1, 2]] },
  { id: 'd42', name: '星星果派',       emoji: '⭐', recipe: [['starfruit', 0, 2]] },
  { id: 'd43', name: '星光蛋糕',       emoji: '🌟', recipe: [['starfruit', 1, 2]] },
  { id: 'd44', name: '黄金水晶羹',     emoji: '🔮', recipe: [['crystal', 2, 1], ['starfruit', 0, 1]] },
  { id: 'd45', name: '彩虹果盘',       emoji: '🌈', recipe: [['rainbow', 0, 1]] },
  { id: 'd46', name: '彩虹奶昔',       emoji: '🌈', recipe: [['rainbow', 0, 1], ['strawberry', 2, 2]] },
  { id: 'd47', name: '星辰大餐',       emoji: '✨', recipe: [['starfruit', 2, 2]] },
  { id: 'd48', name: '彩虹蛋糕',       emoji: '🎂', recipe: [['rainbow', 1, 2]] },
  { id: 'd49', name: '满汉全席',       emoji: '👑', recipe: [['rainbow', 1, 1], ['starfruit', 1, 1], ['crystal', 1, 1]] },
  { id: 'd50', name: '传说彩虹盛宴',   emoji: '🌈', recipe: [['rainbow', 2, 3]] },
];
export const dishById = (id) => DISHES.find(d => d.id === id);
// 配方原料对应的背包 key
export const ingredientKey = (seedId, q) => q === 0 ? seedId : `${seedId}:${q === 1 ? 'silver' : 'gold'}`;
export function dishPrice(dish) {
  return dish.recipe.reduce((sum, [id, q, n]) => sum + seedById(id).sell * [1, 2, 3][q] * n, 0) * DISH_MULT;
}

// 房子内饰：床是白送的，其余去商场「内饰」页买，每件最多升到 3 级
// cost = 购入价（1级），up[n] = 升到 n+1 级的花费；pos = 房间内摆放位置
export const INTERIOR_POS = { x: 0, y: -60, z: 0 }; // 3D 房间藏在岛屿下方，进屋时镜头切过去
export const FURNITURE = [
  // —— 卧室区（左后角）——
  {
    id: 'bed', name: '床', emoji: '🛏️', free: true, cost: 0, up: [400, 1200],
    levelNames: ['稻草床', '木架床', '柔软大床', '鎏金雕花床', '星空天蓬床'],
    pos: [-10.4, -9.6], rotY: 0,
  },
  {
    id: 'wardrobe', name: '衣柜', emoji: '👕', cost: 300, up: [600, 1500],
    levelNames: ['挂衣杆', '双门衣柜', '衣帽间大柜', '鎏金三门柜', '魔法镜衣橱'],
    pos: [-11.7, -5.6], rotY: Math.PI / 2,
  },
  {
    id: 'mirror', name: '镜子', emoji: '🪞', cost: 180, up: [360, 900],
    levelNames: ['桌上小镜', '立式穿衣镜', '鎏金全身镜', '巴洛克金镜', '魔镜'],
    pos: [-7.6, -12], rotY: 0,
  },
  {
    id: 'teddy', name: '熊玩偶', emoji: '🧸', cost: 150, up: [300, 750],
    levelNames: ['小布偶', '大熊玩偶', '巨型抱抱熊', '皇冠巨熊', '星光泰迪'],
    pos: [-8.4, -8.2], rotY: 0.6,
  },
  // —— 客厅区（中后）——
  {
    id: 'fire', name: '壁炉', emoji: '🔥', cost: 350, up: [700, 1600],
    levelNames: ['小火盆', '砖砌壁炉', '大理石壁炉', '鎏金双柱炉', '永恒蓝焰炉'],
    pos: [0, -12.15], rotY: 0,
  },
  {
    id: 'art', name: '挂画', emoji: '🖼️', cost: 220, up: [450, 1100],
    levelNames: ['随手涂鸦', '风景画', '名画金框', '三联金框画', '星空全息画'],
    pos: [2.9, -12.4], rotY: 0,
  },
  {
    id: 'sofa', name: '沙发', emoji: '🛋️', cost: 250, up: [500, 1250],
    levelNames: ['小板凳', '双人布沙发', '豪华转角沙发', '贵族转角沙发', '云端悬浮沙发'],
    pos: [-0.2, -8], rotY: Math.PI,
  },
  {
    id: 'rug', name: '地毯', emoji: '🧶', cost: 120, up: [250, 600],
    levelNames: ['草垫', '花纹地毯', '华丽波斯毯', '皇家纹章毯', '星图魔毯'],
    pos: [0, -10.2], rotY: 0,
  },
  {
    id: 'teatable', name: '茶几', emoji: '🫖', cost: 150, up: [300, 750],
    levelNames: ['老树墩', '圆木茶几', '玻璃茶几', '大理石金茶几', '水晶浮空茶几'],
    pos: [0.3, -10.1], rotY: 0,
  },
  {
    id: 'tv', name: '电视', emoji: '📺', cost: 400, up: [800, 2000],
    levelNames: ['老收音机', '大屁股电视', '巨幕影院', '超宽曲面影院', '全息投影幕'],
    pos: [5.6, -12.1], rotY: 0,
  },
  {
    id: 'floorlamp', name: '落地灯', emoji: '💡', cost: 150, up: [300, 750],
    levelNames: ['蜡烛台', '小台灯', '华丽落地灯', '三头金落地灯', '星河灯树'],
    pos: [-3.8, -8.4], rotY: 0,
  },
  {
    id: 'aquarium', name: '鱼缸', emoji: '🐠', cost: 300, up: [600, 1500],
    levelNames: ['金鱼碗', '小鱼缸', '大水族箱', '大型生态缸', '发光水母缸'],
    pos: [8.8, -12.1], rotY: 0,
  },
  // —— 书房区（右侧）——
  {
    id: 'shelf', name: '书架', emoji: '📚', cost: 200, up: [400, 1000],
    levelNames: ['木板架', '书柜', '顶天立地书墙', '双塔图书墙', '悬浮魔法书阁'],
    pos: [11.7, -9.6], rotY: -Math.PI / 2,
  },
  {
    id: 'clock', name: '时钟', emoji: '🕰️', cost: 200, up: [400, 1000],
    levelNames: ['小闹钟', '座钟', '落地大摆钟', '鎏金落地钟', '星象天文钟'],
    pos: [11.8, -6.6], rotY: -Math.PI / 2,
  },
  {
    id: 'statue', name: '雕像', emoji: '🗿', cost: 500, up: [1000, 2500],
    levelNames: ['小石人', '石膏半身像', '黄金全身像', '黄金双人像', '水晶守护神像'],
    pos: [11.6, -3.6], rotY: -Math.PI / 2,
  },
  {
    id: 'safe', name: '保险箱', emoji: '🔐', cost: 600, up: [1200, 3000],
    levelNames: ['小猪存钱罐', '密码保险箱', '黄金金库门', '双门大金库', '能量金库'],
    pos: [11.8, -0.6], rotY: -Math.PI / 2,
  },
  // —— 音乐角（左侧）——
  {
    id: 'piano', name: '钢琴', emoji: '🎹', cost: 500, up: [1000, 2500],
    levelNames: ['小木琴', '立式钢琴', '三角钢琴', '白色演奏琴', '水晶发光钢琴'],
    pos: [-11.3, 0.4], rotY: Math.PI / 2,
  },
  {
    id: 'harp', name: '竖琴', emoji: '🪕', cost: 350, up: [700, 1750],
    levelNames: ['小铃铛', '木竖琴', '鎏金大竖琴', '华丽演奏琴', '天使光弦琴'],
    pos: [-11.5, 4.2], rotY: Math.PI / 2,
  },
  // —— 餐厨区（右中）——
  {
    id: 'table', name: '餐桌', emoji: '🪑', cost: 180, up: [360, 900],
    levelNames: ['小木桌', '实木餐桌', '橡木长桌', '橡木宴会长桌', '水晶浮空宴桌'],
    pos: [5.4, 2.6], rotY: 0.3,
  },
  {
    id: 'kitchen', name: '灶台', emoji: '🍳', cost: 400, up: [800, 2000],
    levelNames: ['小炉灶', '瓷砖灶台', '全套厨房岛台', '中央厨房岛台', '未来料理站'],
    pos: [9.6, 4.4], rotY: -0.5,
  },
  {
    id: 'cabinet', name: '餐边柜', emoji: '🍷', cost: 350, up: [700, 1750],
    levelNames: ['小木柜', '餐边柜', '玻璃展示酒柜', '双层玻璃酒柜', '发光藏酒展柜'],
    pos: [11.7, 7.4], rotY: -Math.PI / 2,
  },
  // —— 休闲区（前方）——
  {
    id: 'rocker', name: '摇椅', emoji: '🪑', cost: 250, up: [500, 1250],
    levelNames: ['蒲团', '木摇椅', '吊篮秋千椅', '藤编吊篮椅', '悬浮云朵椅'],
    pos: [-6.6, -2.8], rotY: 0.8,
  },
  {
    id: 'plant', name: '盆栽', emoji: '🪴', cost: 90, up: [180, 450],
    levelNames: ['小多肉', '绿萝', '室内大树', '室内棕榈树', '发光神木'],
    pos: [-7, 10.8], rotY: 0,
  },
  {
    id: 'bath', name: '浴缸', emoji: '🛁', cost: 300, up: [600, 1500],
    levelNames: ['木澡盆', '白瓷浴缸', '豪华圆浴池', '罗马圆浴池', '温泉月光池'],
    pos: [-11.2, 8.8], rotY: Math.PI / 2,
  },
  {
    id: 'arcade', name: '游戏角', emoji: '🕹️', cost: 300, up: [600, 1500],
    levelNames: ['棋盘', '弹珠游戏桌', '复古街机', '双人街机厅', '全息游戏舱'],
    pos: [6.2, 10.4], rotY: Math.PI,
  },
  {
    id: 'telescope', name: '望远镜', emoji: '🔭', cost: 280, up: [560, 1400],
    levelNames: ['小双筒镜', '三脚架望远镜', '天文观星镜', '黄铜天文镜', '星象观测台'],
    pos: [10.2, 10.6], rotY: -2.4,
  },
];
export const furnitureById = (id) => FURNITURE.find(f => f.id === id);

// ===== 等级扩展:小屋家具与宠物间装饰统一从 3 级升到 5 级 =====
// 建筑党福利：在原有三级之上再加两级「顶配」外观。
// up：追加第 4、5 级的升级价，延续原梯度（每档翻倍，约等于 10×/20× 购入价）。
// levelNames：每件都在上面手写了 5 个名字；万一没写满，用「鎏金/传世」通用名兜底，避免 undefined。
export const FURNITURE_MAX_LEVEL = 5;
const _tierFallback = ['', '', '', '鎏金', '传世'];
function _extendLevels(item) {
  while (item.up.length < FURNITURE_MAX_LEVEL - 1) {
    item.up.push(item.up[item.up.length - 1] * 2);
  }
  while (item.levelNames.length < FURNITURE_MAX_LEVEL) {
    item.levelNames.push(`${_tierFallback[item.levelNames.length]}${item.name}`);
  }
}
FURNITURE.forEach(_extendLevels);
PET_DECORS.forEach(_extendLevels);

export const seedById = (id) => SEEDS.find(s => s.id === id);
export const decorById = (id) => DECORS.find(d => d.id === id);

// 背包物品 key 解析："tomato" | "tomato:gold" | "p:tomato:gold"（p:=罐头）| "x:tomato"（x:=生长不良）| "egg"
export function keyInfo(key) {
  if (key === EGG.key) {
    return { seed: null, quality: undefined, processed: false, stunted: false, price: EGG.sell, label: EGG.name, icon: EGG.emoji };
  }
  if (key.startsWith('k:')) {
    const dish = dishById(key.slice(2));
    return { seed: null, quality: undefined, processed: false, stunted: false, dish: true, price: dishPrice(dish), label: dish.name, icon: dish.emoji };
  }
  if (key.startsWith('h:')) {
    const hy = hybridById(key.slice(2));
    return { seed: null, quality: undefined, processed: false, stunted: false, hybrid: true, price: hy.sell, label: hy.name, icon: hy.emoji };
  }
  const processed = key.startsWith('p:');
  const stunted = key.startsWith('x:');
  const raw = processed || stunted ? key.slice(2) : key;
  const [id, quality] = raw.split(':');
  const seed = seedById(id);
  const q = QUALITIES[quality];
  // 罐头 = 2 个原料总价 × 1.5，向下取整
  const base = seed.sell * (q?.mult ?? 1);
  const price = Math.max(1, Math.floor(
    (processed ? base * WORKSHOP.ingredients * WORKSHOP.bonus : base) * (stunted ? DROUGHT.sellMult : 1)));
  return {
    seed, quality, processed, stunted, price,
    label: `${stunted ? '生长不良的' : ''}${q ? q.name : ''}${seed.name}${processed ? '罐头' : ''}`,
    icon: `${stunted ? '🥀' : ''}${q ? q.emoji : ''}${processed ? '🥫' : ''}${seed.emoji}`,
  };
}

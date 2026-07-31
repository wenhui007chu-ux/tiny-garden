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
// special: true 的是「特殊种子」，在商场种子页单独成一区。规则：
//   · 照常种、卖、出稀有品质，价值全部卡在彩虹果之下（彩虹果始终是最贵最强的）
//   · 收获物只能摆到「个人展台」，不能收录进 42 格基础图鉴
//   · 与「种子收藏家 / 图鉴大成」两条成就完全无关，不会打扰已有的收集进度
export const SEEDS = [
  { id: 'sweetpot',   name: '红薯',   emoji: '🍠', cost: 0,   sell: 1,    growTime: 50,   unlock: 0 },
  { id: 'radish',     name: '萝卜',   emoji: '🥕', cost: 5,   sell: 12,   growTime: 100,  unlock: 0 },
  { id: 'potato',     name: '土豆',   emoji: '🥔', cost: 8,   sell: 22,   growTime: 140,  unlock: 30 },
  { id: 'cabbage',    name: '白菜',   emoji: '🥬', cost: 15,  sell: 40,   growTime: 200,  unlock: 60 },
  { id: 'tomato',     name: '番茄',   emoji: '🍅', cost: 20,  sell: 55,   growTime: 225,  unlock: 100 },
  { id: 'pepper',     name: '青椒',   emoji: '🫑', cost: 26,  sell: 75,   growTime: 260,  unlock: 150,  special: true },
  { id: 'corn',       name: '玉米',   emoji: '🌽', cost: 35,  sell: 105,  growTime: 300,  unlock: 200 },
  { id: 'strawberry', name: '草莓',   emoji: '🍓', cost: 55,  sell: 170,  growTime: 375,  unlock: 320 },
  { id: 'broccoli',   name: '西兰花', emoji: '🥦', cost: 66,  sell: 200,  growTime: 410,  unlock: 360,  special: true },
  { id: 'pumpkin',    name: '南瓜',   emoji: '🎃', cost: 80,  sell: 240,  growTime: 450,  unlock: 400 },
  { id: 'eggplant',   name: '茄子',   emoji: '🍆', cost: 120, sell: 380,  growTime: 550,  unlock: 650 },
  { id: 'grape',      name: '葡萄',   emoji: '🍇', cost: 145, sell: 460,  growTime: 600,  unlock: 770,  special: true },
  { id: 'watermelon', name: '西瓜',   emoji: '🍉', cost: 170, sell: 560,  growTime: 650,  unlock: 900 },
  { id: 'pineapple',  name: '菠萝',   emoji: '🍍', cost: 230, sell: 780,  growTime: 750,  unlock: 1200 },
  { id: 'avocado',    name: '牛油果', emoji: '🥑', cost: 265, sell: 880,  growTime: 820,  unlock: 1340, special: true },
  { id: 'crystal',    name: '水晶果', emoji: '🔮', cost: 300, sell: 1000, growTime: 900,  unlock: 1500 },
  { id: 'peach',      name: '水蜜桃', emoji: '🍑', cost: 370, sell: 1250, growTime: 1050, unlock: 1820, special: true },
  { id: 'starfruit',  name: '星星果', emoji: '⭐', cost: 450, sell: 1600, growTime: 1200, unlock: 2200 },
  { id: 'cherry',     name: '樱桃',   emoji: '🍒', cost: 550, sell: 2000, growTime: 1350, unlock: 2580, special: true },
  { id: 'rainbow',    name: '彩虹果', emoji: '🌈', cost: 650, sell: 2500, growTime: 1500, unlock: 3000 },
];

// 图鉴与作物收集类成就只认这 14 种基础作物，特殊种子不参与，保证老进度不被打扰
export const CODEX_SEEDS = SEEDS.filter(s => !s.special);
export const SPECIAL_SEEDS = SEEDS.filter(s => s.special);

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

// 打药：给地里的作物单独打一次，赌一把卖价
//   花 cost 打一格 → 收获物卖价 +bonus，但卖出时每个有 ruinChance 的概率变成 0💰
//   打过药的只能直接卖，不能做罐头/料理/杂交/收录，免得把风险洗掉
//   期望收益：(base + bonus) × (1 - ruinChance) - cost，便宜作物划算，贵作物赌不起
export const PESTICIDE = { cost: 3, bonus: 10, ruinChance: 0.15 };

// 分拣台：把稀有品质作物拆成「普通作物 + 贵金属条」
// 规则：品质那部分增值单独抽出来，按 10 倍熔成金条/银条，作物本体原样退回。
//   白银 = 2 倍价，增值 1 份 → 银条 = 原价 × 10
//   黄金 = 3 倍价，增值 2 份 → 金条 = 原价 × 20
// 例：红薯卖 1，白银红薯卖 2 → 拆成 普通红薯(1) + 红薯银条(10)
export const SORTER_SLOTS = 2;     // 两个分拣位
export const SORTER_TIME = 1800;   // 分拣一次半小时
export const SORTER_MULT = 10;     // 增值部分熔成金属条的倍率
export const METAL = {
  silver: { name: '银条', emoji: '🥈', bars: 1 }, // 增值 1 份
  gold:   { name: '金条', emoji: '🥇', bars: 2 }, // 增值 2 份
};
// 金属条卖价 = 原作物售价 × 增值份数 × 倍率
export const metalPrice = (seedId, quality) =>
  Math.max(1, Math.floor(seedById(seedId).sell * METAL[quality].bars * SORTER_MULT));

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
    id: 'fertilizer', name: '肥料', emoji: '💊', cost: 150,
    desc: '随机挑 2 块地里的作物，让它们立刻成熟',
  },
  {
    id: 'luck', name: '幸运药剂', emoji: '🧪', cost: 220,
    desc: '随机挑 2 块地施法，下次在这里播种时白银/黄金概率翻倍',
  },
  {
    id: 'net', name: '抓鱼网', emoji: '🕸️', cost: 100,
    desc: '拿到水滩摆放，20 分钟后收网，随机捞到 50~150💰',
  },
  {
    id: 'restorer', name: '恢复器', emoji: '🔧', cost: 120,
    desc: '当场修好一块受灾的地（不修的话，天气转好后也会自然恢复）',
  },
  {
    id: 'pesticide', name: '杀虫剂', emoji: '🧴', cost: 35,
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
  // —— 特殊种子配对：卖价梯度接在原有配方之间，最高仍够不着创世之种 ——
  { id: 'h21', name: '翠玉椒',   emoji: '🫑', a: ['pepper', 0],   b: ['broccoli', 0],   sell: 1100 },
  { id: 'h22', name: '莓香葡',   emoji: '🍇', a: ['grape', 0],    b: ['strawberry', 0], sell: 2600 },
  { id: 'h23', name: '金油瓜',   emoji: '🥑', a: ['avocado', 0],  b: ['pumpkin', 0],    sell: 4600 },
  { id: 'h24', name: '桃樱蜜',   emoji: '🍑', a: ['peach', 0],    b: ['cherry', 0],     sell: 14000 },
  { id: 'h25', name: '绯樱晶',   emoji: '💗', a: ['cherry', 2],   b: ['peach', 2],      sell: 42000 },
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

// 料理工坊：凑齐指定品质的作物就能做，卖价是原料单卖的 3 倍（d51 起是特殊种子专属）
// recipe 每项 [作物id, 品质档 0普通/1白银/2黄金, 数量]
export const DISH_MULT = 3;
export const COOK_TIME = 360;  // 每道菜要炒 6 分钟

// ===== 花房温室：种花 → 收花 → 直接卖 / 扎成花束卖 =====
// 温室恒温：花种下后不受天气影响、无需浇水，按 grow 秒恒速开花
export const GREENHOUSE_POS = { x: -60, y: -60, z: -60 }; // 独立花房场景，藏在岛屿下方
export const GREENHOUSE_SLOTS = 8;   // 花圃格子数
export const BOUQUET_SIZE = 5;       // 五朵花扎一束
export const BOUQUET_MULT = 1.5;     // 花束卖价 = 选中 5 朵花卖价之和 × 1.5
// 15 种花，稀有度沿用 POND_RARITY（普通/稀有/史诗/传说）；seed=花种成本，sell=每朵卖价，grow=开花秒数
export const FLOWERS = [
  // —— 普通 ——
  { id: 'daisy',      name: '雏菊',     emoji: '🌼', rarity: 'common', seed: 8,    sell: 30,   grow: 80 },
  { id: 'cosmos',     name: '波斯菊',   emoji: '🌺', rarity: 'common', seed: 12,   sell: 45,   grow: 100 },
  { id: 'pansy',      name: '三色堇',   emoji: '🌸', rarity: 'common', seed: 16,   sell: 60,   grow: 120 },
  { id: 'marigold',   name: '金盏花',   emoji: '🏵️', rarity: 'common', seed: 20,   sell: 75,   grow: 140 },
  { id: 'babybreath', name: '满天星',   emoji: '💮', rarity: 'common', seed: 25,   sell: 95,   grow: 160 },
  // —— 稀有 ——
  { id: 'tulip',      name: '郁金香',   emoji: '🌷', rarity: 'rare',   seed: 45,   sell: 160,  grow: 220 },
  { id: 'rose',       name: '玫瑰',     emoji: '🌹', rarity: 'rare',   seed: 65,   sell: 230,  grow: 260 },
  { id: 'sunflower',  name: '向日葵',   emoji: '🌻', rarity: 'rare',   seed: 90,   sell: 310,  grow: 300 },
  { id: 'hyacinth',   name: '风信子',   emoji: '💠', rarity: 'rare',   seed: 120,  sell: 420,  grow: 340 },
  { id: 'lily',       name: '百合',     emoji: '⚜️', rarity: 'rare',   seed: 155,  sell: 540,  grow: 380 },
  // —— 史诗 ——
  { id: 'lavender',   name: '薰衣草',   emoji: '🪻', rarity: 'epic',   seed: 230,  sell: 820,  grow: 480 },
  { id: 'hydrangea',  name: '绣球花',   emoji: '💐', rarity: 'epic',   seed: 320,  sell: 1150, grow: 560 },
  { id: 'iris',       name: '鸢尾',     emoji: '🌷', rarity: 'epic',   seed: 450,  sell: 1600, grow: 640 },
  // —— 传说 ——
  { id: 'bluerose',   name: '蓝色妖姬', emoji: '🌹', rarity: 'legend', seed: 850,  sell: 3000, grow: 900 },
  { id: 'spiderlily', name: '彼岸花',   emoji: '🔥', rarity: 'legend', seed: 1400, sell: 4800, grow: 1150 },
];
export const flowerById = (id) => FLOWERS.find(f => f.id === id);
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
  // —— 特殊档：只有特殊种子才做得出的菜（价格照旧 = 原料总价 ×3，天花板压在彩虹果系列之下）——
  { id: 'd51', name: '虎皮青椒',     emoji: '🫑', recipe: [['pepper', 0, 3]] },
  { id: 'd52', name: '青椒肉丝',     emoji: '🥢', recipe: [['pepper', 0, 2], ['tomato', 0, 1]] },
  { id: 'd53', name: '清炒西兰花',   emoji: '🥦', recipe: [['broccoli', 0, 3]] },
  { id: 'd54', name: '西兰花浓汤',   emoji: '🍵', recipe: [['broccoli', 0, 2], ['potato', 0, 2]] },
  { id: 'd55', name: '葡萄果盘',     emoji: '🍇', recipe: [['grape', 0, 3]] },
  { id: 'd56', name: '牛油果沙拉',   emoji: '🥑', recipe: [['avocado', 0, 2], ['broccoli', 0, 1]] },
  { id: 'd57', name: '牛油果吐司',   emoji: '🍞', recipe: [['avocado', 0, 2], ['corn', 0, 2]] },
  { id: 'd58', name: '蜜桃冰沙',     emoji: '🍑', recipe: [['peach', 0, 2]] },
  { id: 'd59', name: '樱桃塔',       emoji: '🍒', recipe: [['cherry', 0, 2]] },
  { id: 'd60', name: '缤纷果盛宴',   emoji: '🎇', recipe: [['cherry', 1, 2], ['peach', 1, 1], ['grape', 1, 1]] },
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

// ===== 房屋外观装修：7 个部位，每个 5 种样式，自由挑选混搭，每次更换扣少量金币 =====
// part: 'ext' = 菜园里那栋外观房子（墙/顶/门/窗）；'int' = 屋内房间（地板/墙纸/灯光）
// 每个部位的第 0 种就是游戏原本的默认样式，向后兼容老存档。
export const HOUSE_SKIN_COST = 50; // 每次更换一处外观扣的金币
export const HOUSE_SKINS = {
  wall:      { name: '外墙', emoji: '🧱', part: 'ext', options: [
    { name: '奶油白', color: 0xfaf0dc }, { name: '暖粉', color: 0xf2c9c9 }, { name: '天空蓝', color: 0xbcd8e8 }, { name: '薄荷绿', color: 0xc2e0c2 }, { name: '原木棕', color: 0xcaa06a } ] },
  roof:      { name: '屋顶', emoji: '🔺', part: 'ext', options: [
    { name: '赤陶红', color: 0xc0563f }, { name: '石板灰', color: 0x6b6b73 }, { name: '森林绿', color: 0x4a7a48 }, { name: '藏青蓝', color: 0x3a4a72 }, { name: '暖橙', color: 0xe0913a } ] },
  door:      { name: '大门', emoji: '🚪', part: 'ext', options: [
    { name: '原木门', color: 0x9a5f33 }, { name: '朱红门', color: 0xc0433a }, { name: '湖蓝门', color: 0x3a6ea5 }, { name: '墨绿门', color: 0x3a6b4a }, { name: '鎏金门', color: 0xe0b64a } ] },
  window:    { name: '窗户', emoji: '🪟', part: 'ext', options: [
    { name: '天蓝窗', color: 0xbfe3f0 }, { name: '暖黄窗', color: 0xf5e6b0 }, { name: '玫瑰窗', color: 0xf2c0d8 }, { name: '薄荷窗', color: 0xc0ecd8 }, { name: '紫晶窗', color: 0xd8c0f0 } ] },
  floor:     { name: '地板', emoji: '🟫', part: 'int', options: [
    { name: '暖木地板', color: 0xc9a06a }, { name: '深胡桃木', color: 0x8a5a35 }, { name: '浅枫木', color: 0xe0c89a }, { name: '灰调地板', color: 0xa8a29a }, { name: '红棕实木', color: 0xb0663f } ] },
  wallpaper: { name: '墙纸', emoji: '🎴', part: 'int', options: [
    { name: '米色墙', color: 0xf3e6cf }, { name: '淡蓝墙', color: 0xd6e4ee }, { name: '鼠尾草绿', color: 0xd2e0c8 }, { name: '暖杏色', color: 0xf2dcc0 }, { name: '藕粉墙', color: 0xecd6dc } ] },
  light:     { name: '灯光', emoji: '💡', part: 'int', options: [
    { name: '暖阳光', color: 0xffd9a0 }, { name: '冷白光', color: 0xdce8ff }, { name: '落日橙', color: 0xffb070 }, { name: '梦幻粉', color: 0xffc0e0 }, { name: '森系绿', color: 0xc8f0c0 } ] },
};
export const DEFAULT_HOUSE_SKIN = { wall: 0, roof: 0, door: 0, window: 0, floor: 0, wallpaper: 0, light: 0 };
export const houseSkinColor = (part, idx) => HOUSE_SKINS[part].options[idx ?? 0].color;
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

// ===== 成就系统：成就大楼 + 成就表 =====
// 设计原则：全部用「当前状态」判定，不依赖累计计数器。
// 好处是老存档一进游戏就能把已经做到的直接点亮，不用从零重新统计。
// 每条成就：cur(g) 取当前进度，max 是目标值，达成条件统一是 cur >= max。
// tier 只影响卡片配色：bronze 铜 / silver 银 / gold 金 / legend 传说。
export const ACHIEVEMENT_POS = { x: 60, y: -60, z: 60 }; // 成就殿堂藏在岛屿下方

const lv5Count = (g) => Object.values(g.furniture).filter(v => v >= FURNITURE_MAX_LEVEL).length;
const legendPets = (g) => Object.keys(g.petsOwned).filter(id => petById(id)?.rarity === 'legend').length;
const blackSoil = (g) => g.tiles.filter(t => !t.locked && t.soil >= SOILS.length - 1).length;
const unlockedTiles = (g) => g.tiles.filter(t => !t.locked).length;

export const ACHIEVEMENTS = [
  // —— 土地开发 ——
  { id: 'a01', name: '开垦者',   emoji: '🌱', tier: 'bronze', group: '土地',
    desc: '解锁 10 块土地', hint: '点未开垦的荒地花 1000💰 开垦',
    cur: unlockedTiles, max: 10 },
  { id: 'a02', name: '一层满员', emoji: '🗺️', tier: 'silver', group: '土地',
    desc: '一层 36 块地全部解锁', hint: '把一层菜地铺满',
    cur: (g) => g.tiles.slice(0, GRID * GRID).filter(t => !t.locked).length, max: GRID * GRID },
  { id: 'a03', name: '双层农场', emoji: '🏔️', tier: 'gold', group: '土地',
    desc: '两层共 72 块地全部解锁', hint: '二层每块也要 1000💰，慢慢来',
    cur: unlockedTiles, max: GRID * GRID * LEVELS },
  { id: 'a04', name: '黑土帝国', emoji: '⛏️', tier: 'gold', group: '土地',
    desc: '把 36 块地升级成黑金土', hint: '商场「土壤」页买黑金土，再用升级模式点地',
    cur: blackSoil, max: 36 },

  // —— 作物与图鉴 ——
  { id: 'a05', name: '育苗开始',   emoji: '🌾', tier: 'bronze', group: '作物',
    desc: '解锁 5 种作物', hint: '商场「种子」页解锁新品种',
    cur: (g) => g.unlockedSeeds.length, max: 5 },
  // 只认 14 种基础作物（特殊种子不算），后续再加作物也不会把这条已达成的成就顶回未完成
  { id: 'a06', name: '种子收藏家', emoji: '🌈', tier: 'gold', group: '作物',
    desc: `解锁全部 ${CODEX_SEEDS.length} 种基础作物`, hint: '彩虹果是最后一种，3000💰',
    cur: (g) => g.unlockedSeeds.filter(id => CODEX_SEEDS.some(s => s.id === id)).length,
    max: CODEX_SEEDS.length },
  { id: 'a07', name: '图鉴入门', emoji: '📖', tier: 'bronze', group: '作物',
    desc: '图鉴收录 10 项', hint: '进图鉴大楼，把背包里的作物捐出去',
    cur: (g) => g.codexCount(), max: 10 },
  { id: 'a08', name: '图鉴过半', emoji: '📗', tier: 'silver', group: '作物',
    desc: '图鉴收录 21 项', hint: '同一作物的普通/白银/黄金各算一项',
    cur: (g) => g.codexCount(), max: 21 },
  { id: 'a09', name: '图鉴大成', emoji: '📚', tier: 'legend', group: '作物',
    desc: '图鉴 42 项全部收录', hint: '14 种作物 × 3 种品质，一个都不能少',
    cur: (g) => g.codexCount(), max: CODEX_SEEDS.length * CODEX_QUALITIES.length },

  // —— 财富 ——
  { id: 'a10', name: '万元户',   emoji: '💰', tier: 'bronze', group: '财富',
    desc: '身上带着 10000💰', hint: '卖作物、做料理都能攒',
    cur: (g) => g.coins, max: 10000 },
  { id: 'a11', name: '十万富翁', emoji: '💎', tier: 'silver', group: '财富',
    desc: '身上带着 100000💰', hint: '高级作物做成料理，卖价 ×3',
    cur: (g) => g.coins, max: 100000 },
  { id: 'a12', name: '百万庄园', emoji: '👑', tier: 'legend', group: '财富',
    desc: '身上带着 1000000💰', hint: '杂交「创世之种」一颗 75000💰',
    cur: (g) => g.coins, max: 1000000 },
  { id: 'a13', name: '储蓄习惯', emoji: '🏦', tier: 'bronze', group: '财富',
    desc: '银行存款达到 1000💰', hint: '点右前方的黑房子存钱',
    cur: (g) => g.bank, max: 1000 },

  // —— 产线满负荷 ——
  { id: 'a14', name: '工坊开工', emoji: '🥫', tier: 'bronze', group: '产线',
    desc: `${WORKSHOP.slots} 个工坊槽位同时加工`, hint: '点右侧工坊小屋，把作物做成罐头',
    cur: (g) => g.workshop.filter(Boolean).length, max: WORKSHOP.slots },
  { id: 'a15', name: '灶火通明', emoji: '🍳', tier: 'silver', group: '产线',
    desc: `${COOK_SLOTS} 个灶位同时开火`, hint: '料理工坊里凑齐配方就能下锅',
    cur: (g) => g.cookSlots.filter(Boolean).length, max: COOK_SLOTS },
  { id: 'a16', name: '满罩培养', emoji: '🧬', tier: 'silver', group: '产线',
    desc: `${HYBRID_SLOTS} 个培养罩同时工作`, hint: '杂交室里两种作物配对培养',
    cur: (g) => g.hybridSlots.filter(Boolean).length, max: HYBRID_SLOTS },
  { id: 'a17', name: '花开满园', emoji: '🌸', tier: 'silver', group: '产线',
    desc: `${GREENHOUSE_SLOTS} 个花圃同时种花`, hint: '花房温室恒温，种下不用浇水',
    cur: (g) => g.flowerPlots.filter(Boolean).length, max: GREENHOUSE_SLOTS },
  { id: 'a18', name: '渔网密布', emoji: '🎣', tier: 'silver', group: '产线',
    desc: `${FISHING.slots} 个鱼网同时下水`, hint: '点水塘下网，不花原料的白捡钱',
    cur: (g) => g.fishNets.filter(Boolean).length, max: FISHING.slots },

  // —— 设施 ——
  { id: 'a19', name: '解放双手', emoji: '💧', tier: 'silver', group: '设施',
    desc: '水利升到「自动灌溉」', hint: '商场「水利」页，500💰 一劳永逸',
    cur: (g) => g.waterLevel, max: WATER_LEVELS.length - 1 },
  { id: 'a20', name: '装饰满园', emoji: '🪴', tier: 'bronze', group: '设施',
    desc: '10 个装饰台全部摆上装饰', hint: '商场「装饰」页买，再点空台子摆',
    cur: (g) => g.decorSlots.filter(s => s.decor).length, max: 10 },
  { id: 'a21', name: '风车矩阵', emoji: '🌀', tier: 'gold', group: '设施',
    desc: '10 个装饰台全部摆成小风车', hint: '风车能离线发电，每台每分钟 +1💰',
    cur: (g) => g.decorSlots.filter(s => s.decor?.id === 'windmill').length, max: 10 },
  { id: 'a22', name: '名品陈列', emoji: '🏆', tier: 'gold', group: '设施',
    desc: '个人图鉴 10 座金台全部摆满', hint: '图鉴大楼「个人图鉴」页，红毯贵宾厅',
    cur: (g) => g.displaySlots.filter(s => s.item).length, max: 10 },

  // —— 小屋 ——
  { id: 'a23', name: '添置家当', emoji: '🛋️', tier: 'bronze', group: '小屋',
    desc: '拥有 10 件家具', hint: '进自己的房子，在家具页购买',
    cur: (g) => Object.keys(g.furniture).length, max: 10 },
  { id: 'a24', name: '满室生辉', emoji: '🏠', tier: 'gold', group: '小屋',
    desc: `集齐全部 ${FURNITURE.length} 件家具`, hint: '一件都不能落下',
    cur: (g) => Object.keys(g.furniture).length, max: FURNITURE.length },
  { id: 'a25', name: '极致装修', emoji: '✨', tier: 'gold', group: '小屋',
    desc: `把 5 件家具升到满级 ${FURNITURE_MAX_LEVEL} 级`, hint: '家具最高 5 级，越升越贵',
    cur: lv5Count, max: 5 },

  // —— 伙伴 ——
  { id: 'a26', name: '第一只伙伴', emoji: '🐕', tier: 'bronze', group: '伙伴',
    desc: '养第一只宠物', hint: '点宠物间小屋，挑一只带回家',
    cur: (g) => Object.keys(g.petsOwned).length, max: 1 },
  { id: 'a27', name: '宠物园',     emoji: '🐾', tier: 'gold', group: '伙伴',
    desc: '收集 10 只宠物', hint: '买断制，买过就一直是你的',
    cur: (g) => Object.keys(g.petsOwned).length, max: 10 },
  { id: 'a28', name: '传说饲主',   emoji: '🐲', tier: 'legend', group: '伙伴',
    desc: '拥有 1 只传说品级宠物', hint: '幼龙 12000💰 是最便宜的传说',
    cur: legendPets, max: 1 },
  { id: 'a29', name: '池塘生态',   emoji: '🦢', tier: 'gold', group: '伙伴',
    desc: '收集 10 种水塘装饰', hint: '商场「水塘」页买，同时最多摆 3 个',
    cur: (g) => Object.keys(g.pondOwned).length, max: 10 },

  // —— 终极 ——
  // —— 特殊种子（单独站在成就殿堂金星正下方的荣誉位）——
  { id: 'a31', name: '特殊种子收藏家', emoji: '✨', tier: 'legend', group: '特殊',
    desc: `集齐全部 ${SPECIAL_SEEDS.length} 种特殊种子`,
    hint: '商场种子页的「✨ 特殊种子」区，樱桃 2580💰 是最后一种',
    cur: (g) => g.unlockedSeeds.filter(id => seedById(id)?.special).length, max: SPECIAL_SEEDS.length,
    // 不占 6×5 的方阵，单独摆在展厅金星浮雕正下方的金毯上
    spot: { x: 0, z: -8.6 } },

  // —— 终极 ——
  { id: 'a30', name: '园艺大师', emoji: '🌟', tier: 'legend', group: '终极',
    desc: '达成其余全部成就', hint: '把上面的都点亮，这个会自己亮',
    // 数「已经拿到的记录」而不是「此刻是否满足条件」：
    // 万元户拿到后又把钱花光了也照样算数，不能让它退回去。
    // 排除自己来数，以后再加成就也不用改这里。
    cur: (g) => ACHIEVEMENTS.filter(a => a.id !== 'a30' && g.achievements[a.id]).length,
    max: 30 },
];
// 园艺大师要求「除自己外全部达成」，成就表增删时自动跟上，免得忘了改数字
{
  const master = ACHIEVEMENTS.find(a => a.id === 'a30');
  master.max = ACHIEVEMENTS.length - 1;
  master.desc = `达成其余全部 ${master.max} 个成就`;
}

export const achievementById = (id) => ACHIEVEMENTS.find(a => a.id === id);
export const ACHIEVEMENT_TIERS = {
  bronze: { name: '铜',   color: '#c98a4a' },
  silver: { name: '银',   color: '#8fa4b8' },
  gold:   { name: '金',   color: '#e0a020' },
  legend: { name: '传说', color: '#a24ac2' },
};

// 背包物品 key 解析："tomato" | "tomato:gold" | "p:tomato:gold"（p:=罐头）| "x:tomato"（x:=生长不良）
//                  | "m:tomato:gold"（m:=分拣出的金属条）| "egg"
export function keyInfo(key) {
  if (key === EGG.key) {
    return { seed: null, quality: undefined, processed: false, stunted: false, price: EGG.sell, label: EGG.name, icon: EGG.emoji };
  }
  if (key.startsWith('m:')) {
    const [id, quality] = key.slice(2).split(':');
    const seed = seedById(id), m = METAL[quality];
    return {
      seed: null, quality: undefined, processed: false, stunted: false, metal: quality,
      metalSeed: seed, price: metalPrice(id, quality),
      label: `${seed.name}${m.name}`, icon: m.emoji,
    };
  }
  if (key.startsWith('k:')) {
    const dish = dishById(key.slice(2));
    return { seed: null, quality: undefined, processed: false, stunted: false, dish: true, price: dishPrice(dish), label: dish.name, icon: dish.emoji };
  }
  if (key.startsWith('h:')) {
    const hy = hybridById(key.slice(2));
    return { seed: null, quality: undefined, processed: false, stunted: false, hybrid: true, price: hy.sell, label: hy.name, icon: hy.emoji };
  }
  if (key.startsWith('f:')) {
    const fl = flowerById(key.slice(2));
    return { seed: null, quality: undefined, processed: false, stunted: false, flower: true, price: fl.sell, label: fl.name, icon: fl.emoji };
  }
  const processed = key.startsWith('p:');
  const stunted = key.startsWith('x:');
  const sprayed = key.startsWith('y:'); // y: = 打过药，卖价 +bonus 但有概率颗粒无收
  const raw = processed || stunted || sprayed ? key.slice(2) : key;
  const [id, quality] = raw.split(':');
  const seed = seedById(id);
  const q = QUALITIES[quality];
  // 罐头 = 2 个原料总价 × 1.5，向下取整
  const base = seed.sell * (q?.mult ?? 1);
  const price = Math.max(1, Math.floor(
    (processed ? base * WORKSHOP.ingredients * WORKSHOP.bonus : base) * (stunted ? DROUGHT.sellMult : 1)
    + (sprayed ? PESTICIDE.bonus : 0)));
  return {
    seed, quality, processed, stunted, sprayed, price,
    label: `${stunted ? '生长不良的' : ''}${sprayed ? '打过药的' : ''}${q ? q.name : ''}${seed.name}${processed ? '罐头' : ''}`,
    icon: `${stunted ? '🥀' : ''}${sprayed ? '🧪' : ''}${q ? q.emoji : ''}${processed ? '🥫' : ''}${seed.emoji}`,
  };
}

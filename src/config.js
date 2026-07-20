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
export const WORKSHOP = { slots: 3, time: 20, mult: 3 };

// 昼夜循环：现实 20 分钟 = 游戏一天（白天/夜晚各 10 分钟），夜晚生长减半
export const DAY_CYCLE = 1200;      // 秒
export const NIGHT_SLOW = 0.5;

// 快捷操作
export const QUICK_WATER_COST = 10; // 一键浇水价格

// 恐龙虾卵：泥土加水的小惊喜，浇水时每块被浇的地 5% 概率出现，自动入背包
export const EGG = { key: 'egg', name: '恐龙虾卵', emoji: '🦐', sell: 10, chance: 0.05 };

// 恶劣天气：每天掷一次，大旱和暴雨各 15%
// 大旱：三个太阳，生长 ×1/3；暴雨：持续降雨，生长 ×3
// 两种天气下收获的作物都是"生长不良"，只卖半价
export const DROUGHT = { chance: 0.15, growSlow: 1 / 3, sellMult: 0.5 };
export const RAIN = { chance: 0.15, growFast: 3 };

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
];

// 抓鱼水滩：最多同时摆 5 张网，是亏是赚全看脸
export const FISHING = { slots: 5, time: 1200, rewardMin: 50, rewardMax: 150 };
export const itemById = (id) => ITEMS.find(i => i.id === id);

// 房子内饰：床是白送的，其余去商店「内饰」页买，每件最多升到 3 级
// cost = 购入价（1级），up[n] = 升到 n+1 级的花费；pos = 房间内摆放位置
export const INTERIOR_POS = { x: 0, y: -60, z: 0 }; // 3D 房间藏在岛屿下方，进屋时镜头切过去
export const FURNITURE = [
  {
    id: 'bed', name: '床', emoji: '🛏️', free: true, cost: 0, up: [400, 1200],
    levelNames: ['稻草床', '木架床', '柔软大床'],
    pos: [-2.3, -2], rotY: 0,
  },
  {
    id: 'rug', name: '地毯', emoji: '🧶', cost: 120, up: [250, 600],
    levelNames: ['草垫', '花纹地毯', '华丽波斯毯'],
    pos: [0.4, 0.6], rotY: 0,
  },
  {
    id: 'table', name: '餐桌', emoji: '🪑', cost: 180, up: [360, 900],
    levelNames: ['小木桌', '实木餐桌', '橡木长桌'],
    pos: [2.2, 0.2], rotY: 0.3,
  },
  {
    id: 'shelf', name: '书架', emoji: '📚', cost: 200, up: [400, 1000],
    levelNames: ['木板架', '书柜', '顶天立地书墙'],
    pos: [2.6, -3], rotY: 0,
  },
  {
    id: 'plant', name: '盆栽', emoji: '🪴', cost: 90, up: [180, 450],
    levelNames: ['小多肉', '绿萝', '室内大树'],
    pos: [-3, 1.8], rotY: 0,
  },
  {
    id: 'fire', name: '壁炉', emoji: '🔥', cost: 350, up: [700, 1600],
    levelNames: ['小火盆', '砖砌壁炉', '大理石壁炉'],
    pos: [0, -3.2], rotY: 0,
  },
];
export const furnitureById = (id) => FURNITURE.find(f => f.id === id);

export const seedById = (id) => SEEDS.find(s => s.id === id);
export const decorById = (id) => DECORS.find(d => d.id === id);

// 背包物品 key 解析："tomato" | "tomato:gold" | "p:tomato:gold"（p:=罐头）| "x:tomato"（x:=生长不良）| "egg"
export function keyInfo(key) {
  if (key === EGG.key) {
    return { seed: null, quality: undefined, processed: false, stunted: false, price: EGG.sell, label: EGG.name, icon: EGG.emoji };
  }
  const processed = key.startsWith('p:');
  const stunted = key.startsWith('x:');
  const raw = processed || stunted ? key.slice(2) : key;
  const [id, quality] = raw.split(':');
  const seed = seedById(id);
  const q = QUALITIES[quality];
  const price = Math.max(1, Math.floor(
    seed.sell * (q?.mult ?? 1) * (processed ? WORKSHOP.mult : 1) * (stunted ? DROUGHT.sellMult : 1)));
  return {
    seed, quality, processed, stunted, price,
    label: `${stunted ? '生长不良的' : ''}${q ? q.name : ''}${seed.name}${processed ? '罐头' : ''}`,
    icon: `${stunted ? '🥀' : ''}${q ? q.emoji : ''}${processed ? '🥫' : ''}${seed.emoji}`,
  };
}

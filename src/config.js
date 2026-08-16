// i18n.js 不 import 任何东西，所以这里引它不会成环
import { tf, nameSep } from './i18n.js';

// 作物名走翻译，查不到就回落到下面配置里的中文名
export const seedName = (s) => (s ? tf(`seed.${s.id}`, s.name) : '');

export const GRID = 6;          // 每层菜地 6x6 格
export const LEVELS = 2;        // 两层梯田
export const UPPER_Y = 4.2;     // 二层农田高度
export const UPPER_Z = -7.1;    // 二层农田往后错开的距离
export const TILE = 1;          // 每格世界坐标尺寸
export const LAWN_R = 54;       // 草地半径：岛被建筑塞满后扩了约 3 倍面积，东边空地留给牧场
export const UNLOCK_COST = 1000; // 二层每块地的解锁价

// ===== 牧场：岛东侧的 6×6 围栏，思路和农田一样 =====
// 买幼崽放进栏 → 等它长大 → 点一下收进背包（背包/黑市都能卖）；
// 也可以不收，成年动物留在栏里每分钟产一笔挂机收益（离线照算）。
// 数值规则：卖价 = 买价 × 2.4；挂机收益/分钟 = 卖价 ÷ 90
//（也就是「不收的话，挂机约 90 分钟 ≈ 卖掉那一笔」，急着用钱就卖，长线就养着）
export const RANCH_GRID = 6;                       // 6×6 = 36 个栏位
export const RANCH_TILE = 1.6;                     // 栏位比菜地格大，animal 站得下
export const RANCH_POS = { x: 30, z: 0 };          // 岛东侧空地，避开所有建筑
export const RANCH_IDLE_TICK = 60;                 // 每 60 秒结算一次挂机收益
export const ANIMALS = [
  { id: 'chick',   name: '小鸡',   emoji: '🐣', cost: 500,     grow: 300,  sell: 1200,    idle: 13 },
  { id: 'rabbit',  name: '兔子',   emoji: '🐰', cost: 1300,    grow: 420,  sell: 3100,    idle: 34 },
  { id: 'duck',    name: '鸭子',   emoji: '🦆', cost: 3200,    grow: 540,  sell: 7700,    idle: 85 },
  { id: 'goat',    name: '山羊',   emoji: '🐐', cost: 7800,    grow: 720,  sell: 18700,   idle: 208 },
  { id: 'sheep',   name: '绵羊',   emoji: '🐑', cost: 19000,   grow: 900,  sell: 45600,   idle: 507 },
  { id: 'pig',     name: '猪',     emoji: '🐖', cost: 46000,   grow: 1140, sell: 110000,  idle: 1222 },
  { id: 'cow',     name: '奶牛',   emoji: '🐄', cost: 110000,  grow: 1440, sell: 264000,  idle: 2933 },
  { id: 'horse',   name: '马',     emoji: '🐎', cost: 270000,  grow: 1800, sell: 648000,  idle: 7200 },
  { id: 'deer',    name: '梅花鹿', emoji: '🦌', cost: 650000,  grow: 2220, sell: 1560000, idle: 17333 },
  { id: 'unicorn', name: '独角兽', emoji: '🦄', cost: 1600000, grow: 2700, sell: 3840000, idle: 42666 },
];
export const animalById = (id) => ANIMALS.find(a => a.id === id);
export const animalName = (a) => (a ? tf(`animal.${a.id}`, a.name) : '');

// ===== 屠宰场：把整只动物拆成部位，分开卖总价是原价的 1.5 倍 =====
// 两段式：先屠宰 1 分钟，再细分 2 分钟，共 3 分钟（离线照常进行）。
// 想改成总共 2 分钟，把 cutTime 调成 60 就行。
export const BUTCHER = { slots: 3, killTime: 60, cutTime: 120, mult: 1.5 };
// 四个部位的分成，加起来正好 = BUTCHER.mult（1.5），所以拆开卖必定比整只卖多五成
export const CUTS = [
  { id: 'meat', name: '肉',   emoji: '🥩', share: 0.75 },
  { id: 'rib',  name: '排骨', emoji: '🍖', share: 0.35 },
  { id: 'hide', name: '皮毛', emoji: '🧥', share: 0.25 },
  { id: 'bone', name: '骨',   emoji: '🦴', share: 0.15 },
];
export const cutById = (id) => CUTS.find(c => c.id === id);
export const cutName = (c) => (c ? tf(`cut.${c.id}`, c.name) : '');
// 部位卖价 = 整只卖价 × 该部位分成
export const cutPrice = (animalId, cutId) =>
  Math.max(1, Math.round(animalById(animalId).sell * cutById(cutId).share));
export const WET_DURATION = 45; // 浇一次水保持湿润的秒数
export const START_COINS = 20;

// 慢动作田园：生长时间统一放慢 5 倍，削一削经济
// special: true 的是「特殊种子」，在商场种子页单独成一区。规则：
//   · 照常种、卖、出稀有品质
//   · 前 6 种（青椒~樱桃）价值都卡在彩虹果之下，插在原有梯度的空档里
//   · 最后两种（月光果/星云果）是唯一越过彩虹果的档位，专门给后期玩家花钱
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
  // —— 两种「天价」特殊种子：唯一越过彩虹果的档位，给后期玩家花钱的地方 ——
  { id: 'moonfruit',  name: '月光果', emoji: '🌙', cost: 1500, sell: 6000,  growTime: 2200, unlock: 8000,  special: true },
  { id: 'nebula',     name: '星云果', emoji: '🌌', cost: 4200, sell: 16000, growTime: 3400, unlock: 25000, special: true },
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

// 睡觉：不再「一瞬间跳到天亮」，而是把时间快进着走完。
// 快进期间 tick 照常跑，所以天气、作物、料理、罐头、杂交都按正常规则推进，
// 只是流逝得快——躺下就白嫖一整批加工的漏洞就此堵上。
// 半天 600 游戏秒 ÷ 20 倍 ≈ 玩家实际等 30 秒，看着时钟一格格走。
export const SLEEP_SPEED = 20;

// 快捷操作
export const QUICK_WATER_COST = 10; // 一键浇水价格

// 恐龙虾卵：泥土加水的小惊喜，浇水时每块被浇的地 5% 概率出现，自动入背包
export const EGG = { key: 'egg', name: '恐龙虾卵', emoji: '🦐', sell: 10, chance: 0.05 };

// 恶劣天气：每天掷一次，大旱 15%、暴雨 20%
// 大旱：三个太阳，生长 ×1/3；暴雨：持续降雨，生长速度正常
// 两种天气下收获的作物都是"生长不良"，只卖半价——纯削经济，没有福利
export const DROUGHT = { chance: 0.15, growSlow: 1 / 3, sellMult: 0.5 };
export const RAIN = { chance: 0.2 };

// 天气改成「由存档种子 + 第几天」算出来的，不再当场 Math.random()。
// 序列照样是乱的，但因为可推算，天气观测台才有得报——
// 否则未来的天气根本还不存在，预报无从谈起。
export function weatherOfDay(seed, day) {
  // 拿正弦的小数部分当伪随机，同样的 (seed, day) 永远得到同一个值
  const x = Math.sin(seed * 12.9898 + day * 78.233) * 43758.5453;
  const r = x - Math.floor(x);
  if (r < DROUGHT.chance) return 'drought';
  if (r < DROUGHT.chance + RAIN.chance) return 'rain';
  return 'clear';
}

// ===== 酒庄：果子酿酒，越窖越贵 =====
// 流程：背包挑果 → 酿造台（3 个位，20 分钟）→ 取出 → 酒窖（9 格）陈酿 → 满意了取回背包卖
// 酒的基础价 = 原果售价 × 2；进窖后每过一个游戏日再 +10💰，取出时价格就定死了。
// 便宜果子靠陈酿翻身，贵果子主要吃那个 ×2——两头都有得算。
export const BREWERY_POS = { x: 0, y: -60, z: -60 }; // 酒窖藏在岛下
export const BREW = {
  slots: 3,        // 酿造台数量
  time: 1200,      // 酿一批 20 分钟
  mult: 2,         // 基础价 = 原果价 × 2
  cellarSlots: 9,  // 酒窖格子
  agePerDay: 10,   // 每窖藏一个游戏日 +10💰
};

// ===== 食品店：四种作物装成礼盒，上架等人来买 =====
// 流程：选 4 种作物 → 装盒上架（货架 5 格）→ 20 秒~30 分钟内自动卖出，钱直接进账
// 跟花房「扎花束」的区别：花束是当场结算，礼盒是挂单——上架了就等，
// 中途反悔可以下架，作物原样退回背包，等于零成本试价。
// 岛下 3×3 的场景坑位只剩 (60, -60) 了：另外八个分别是温室/杂交/水族馆/
// 酒窖/我的家/宠物屋/图鉴/成就殿堂
export const SHOP_POS = { x: 60, y: -60, z: -60 };
export const GIFTBOX = {
  slots: 5,          // 货架最多同时挂 5 盒
  size: 4,           // 一盒装 4 种作物
  mult: 1.8,         // 礼盒价 = 4 件作物售价之和 × 1.8
  minWait: 20,       // 最快 20 秒被买走
  maxWait: 1800,     // 最慢 30 分钟
};
// 礼盒成交价：装盒那一刻就按当时的作物价算死，之后不随行情浮动
export const giftboxPrice = (sum) => Math.max(1, Math.floor(sum * GIFTBOX.mult));
// 一瓶酒此刻值多少：底价 + 窖藏天数 × 每日加成
export const winePrice = (basePrice, days) =>
  Math.max(1, Math.floor(basePrice * BREW.mult + Math.max(0, days) * BREW.agePerDay));

// 仓库：背包本身没有上限，仓库解决的是「囤着不想卖、又不想让背包一直挤着」。
// 存进去的东西不参与一键售卖，也不会在背包列表里碍事，要用再取回来。
export const WAREHOUSE = {
  maxLevel: 10,     // 最高 10 级
  baseCap: 100,     // 1 级装 100 件
  capPerLevel: 50,  // 每升一级 +50 件
  upCost: 100,      // 每级升级费
};
// 第 lv 级的容量：1 级 100，10 级 550
export const warehouseCap = (lv) =>
  WAREHOUSE.baseCap + (Math.min(lv, WAREHOUSE.maxLevel) - 1) * WAREHOUSE.capPerLevel;

// 天气观测台：花钱开机，跑完给一份未来 N 天的天气表
export const OBSERVATORY = {
  cost: 200,      // 每次启动的费用
  time: 1200,     // 跑 20 分钟（正好一个游戏日）
  days: 20,       // 一次报未来 20 天
};
export const WEATHER_INFO = {
  clear:   { icon: '🌅', name: '风调雨顺', tone: 'clear',   desc: '正常生长' },
  drought: { icon: '☀️', name: '大旱',     tone: 'drought', desc: '生长 ×1/3，收成生长不良' },
  rain:    { icon: '⛈', name: '暴雨',     tone: 'rain',    desc: '收成生长不良' },
};

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
    id: 'silverup', name: '白银升变', emoji: '🥈', cost: 200, pick: 'silver',
    desc: '把背包里一个普通作物变成白银品质（卖价 ×2）。越贵的作物越划算',
  },
  {
    id: 'goldup', name: '黄金升变', emoji: '🥇', cost: 350, pick: 'gold',
    desc: '把背包里一个普通或白银作物变成黄金品质（卖价 ×3）。越贵的作物越划算',
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
// min/max 现在是「捞上来的水产价值区间」，按区间随机抽一种水产给玩家，
// 不再直接发钱——水产可以摆进水族馆，也可以照常卖掉
export const ROD = { chance: 0.9, min: 5, max: 20 };
export const CASTNET = { chance: 0.7, min: 10, max: 30 };

// ===== 水产：钓鱼/收网的产物，背包 key 形如 s:carp =====
// 每样都能摆进水族馆（最多 15 个），摆不下的留在背包照常卖
// 定价刻意做成「每个价位都有对应的一种」：
//   5~30 每 1 块一种（26 种）——鱼竿(5~20)、撒网(10~30) 的抽取范围
//   50~150 每 10 块一种（11 种）——捕捞网的抽取范围
// 这样不管抽到哪个价位，都有货可给，不会出现某个价钱抽空
export const SEAFOOD = [
  // —— 小河小溪：鱼竿与撒网的范围 ——
  { id: 'fry',      name: '鱼苗',   emoji: '🐟', kind: 'fish',   sell: 5,  c1: 0xa8c8d8, c2: 0xe0eef4 },
  { id: 'ricesh',   name: '米虾',   emoji: '🦐', kind: 'shrimp', sell: 6,  c1: 0xf0c0a0, c2: 0xf8e0d0 },
  { id: 'mussel',   name: '河蚌',   emoji: '🐚', kind: 'shell',  sell: 7,  c1: 0x8a8a78, c2: 0xc8c8b0 },
  { id: 'minnow',   name: '小鱼',   emoji: '🐟', kind: 'fish',   sell: 8,  c1: 0x8fb8d8, c2: 0xd8e8f0 },
  { id: 'loach',    name: '泥鳅',   emoji: '🐟', kind: 'fish',   sell: 9,  c1: 0x6a5a48, c2: 0xa08868 },
  { id: 'shrimp',   name: '小虾',   emoji: '🦐', kind: 'shrimp', sell: 10, c1: 0xf0a080, c2: 0xf8d0b8 },
  { id: 'snail',    name: '田螺',   emoji: '🐚', kind: 'shell',  sell: 11, c1: 0x5a6a4a, c2: 0x98a878 },
  { id: 'sardine',  name: '沙丁鱼', emoji: '🐟', kind: 'fish',   sell: 12, c1: 0x9ab8c8, c2: 0xdce8ee },
  { id: 'crab',     name: '河蟹',   emoji: '🦀', kind: 'crab',   sell: 13, c1: 0xd06848, c2: 0xf0a888 },
  { id: 'whitebait',name: '白条鱼', emoji: '🐟', kind: 'fish',   sell: 14, c1: 0xd8e0e8, c2: 0xf0f4f8 },
  { id: 'prawn',    name: '青虾',   emoji: '🦐', kind: 'shrimp', sell: 15, c1: 0x5aa890, c2: 0xa8d8c8 },
  { id: 'clam',     name: '蛤蜊',   emoji: '🐚', kind: 'shell',  sell: 16, c1: 0xc8b898, c2: 0xe8dcc8 },
  { id: 'crucian',  name: '鲫鱼',   emoji: '🐟', kind: 'fish',   sell: 17, c1: 0x9a9a80, c2: 0xd0d0b8 },
  { id: 'hairycrab',name: '毛蟹',   emoji: '🦀', kind: 'crab',   sell: 18, c1: 0x6a5a4a, c2: 0xa89880 },
  { id: 'icefish',  name: '银鱼',   emoji: '🐟', kind: 'fish',   sell: 19, c1: 0xe8eef4, c2: 0xf8fafc },
  { id: 'grasssh',  name: '草虾',   emoji: '🦐', kind: 'shrimp', sell: 20, c1: 0x88a860, c2: 0xc0d898 },
  { id: 'scallop',  name: '扇贝',   emoji: '🐚', kind: 'shell',  sell: 21, c1: 0xe0a888, c2: 0xf4d4bc },
  { id: 'carp',     name: '鲤鱼',   emoji: '🐠', kind: 'fish',   sell: 22, c1: 0xe89040, c2: 0xf8d090 },
  { id: 'streamcr', name: '溪蟹',   emoji: '🦀', kind: 'crab',   sell: 23, c1: 0x88a0a8, c2: 0xc0d0d8 },
  { id: 'bass',     name: '鲈鱼',   emoji: '🐠', kind: 'fish',   sell: 24, c1: 0x788898, c2: 0xb8c8d4 },
  { id: 'kingprawn',name: '明虾',   emoji: '🦐', kind: 'shrimp', sell: 25, c1: 0xf08868, c2: 0xf8c0a8 },
  { id: 'oyster',   name: '生蚝',   emoji: '🐚', kind: 'shell',  sell: 26, c1: 0x9a9a8a, c2: 0xd8d8c8 },
  { id: 'bream',    name: '鳊鱼',   emoji: '🐠', kind: 'fish',   sell: 27, c1: 0xb0b8b0, c2: 0xdce4dc },
  { id: 'flowercr', name: '花蟹',   emoji: '🦀', kind: 'crab',   sell: 28, c1: 0xd88860, c2: 0xf4c0a0 },
  { id: 'cuttle',   name: '乌贼',   emoji: '🦑', kind: 'squid',  sell: 29, c1: 0xe0d0c0, c2: 0xf4e8dc },
  { id: 'seabream', name: '鲷鱼',   emoji: '🐠', kind: 'fish',   sell: 30, c1: 0xe8a0a0, c2: 0xf8d0d0 },
  // —— 深水：捕捞网的范围，每 10 块一档 ——
  { id: 'yellowcr', name: '黄鱼',   emoji: '🐠', kind: 'fish',   sell: 50,  c1: 0xe8c850, c2: 0xf8e8a0 },
  { id: 'swimcrab', name: '梭子蟹', emoji: '🦀', kind: 'crab',   sell: 60,  c1: 0x7088c0, c2: 0xb0c0e8 },
  { id: 'octopus',  name: '章鱼',   emoji: '🐙', kind: 'squid',  sell: 70,  c1: 0xc85878, c2: 0xf0a0b8 },
  { id: 'squid',    name: '鱿鱼',   emoji: '🦑', kind: 'squid',  sell: 80,  c1: 0xf0c8b0, c2: 0xf8e4d8 },
  { id: 'seacucum', name: '海参',   emoji: '🐚', kind: 'shell',  sell: 90,  c1: 0x4a3a30, c2: 0x8a6a50 },
  { id: 'grouper',  name: '石斑鱼', emoji: '🐡', kind: 'fish',   sell: 100, c1: 0x9a7ab8, c2: 0xd0b8e0 },
  { id: 'mittencr', name: '大闸蟹', emoji: '🦀', kind: 'crab',   sell: 110, c1: 0x4a5a3a, c2: 0x8aa070 },
  { id: 'lobster',  name: '龙虾',   emoji: '🦞', kind: 'shrimp', sell: 120, c1: 0xd83c3c, c2: 0xf08878 },
  { id: 'abalone',  name: '鲍鱼',   emoji: '🐚', kind: 'shell',  sell: 130, c1: 0x7a6a58, c2: 0xc0a888 },
  { id: 'king',     name: '帝王蟹', emoji: '🦀', kind: 'crab',   sell: 140, c1: 0xe0603c, c2: 0xf8b090 },
  { id: 'tuna',     name: '蓝鳍金枪鱼', emoji: '🐟', kind: 'fish', sell: 150, c1: 0x3a6a9a, c2: 0x88b8d8 },
  // 恐龙虾只能从恐龙虾卵在水族馆里孵，钓不到
  { id: 'dino',     name: '恐龙虾', emoji: '🦞', kind: 'shrimp', sell: 260, c1: 0x6ac0a0, c2: 0xe0f0a0, hatchOnly: true, glow: 0.35 },
];
export const seafoodById = (id) => SEAFOOD.find(s => s.id === id);
// 水产名走翻译，查不到回落到配置里的中文名
export const seafoodName = (sf) => (sf ? tf(`sea.${sf.id}`, sf.name) : '');
// 按价值区间抽一种（恐龙虾除外，它只能孵）
export const rollSeafood = (min, max) => {
  const pool = SEAFOOD.filter(s => !s.hatchOnly && s.sell >= min && s.sell <= max);
  const list = pool.length ? pool : SEAFOOD.filter(s => !s.hatchOnly);
  return list[Math.floor(Math.random() * list.length)];
};

// ===== 黑市：农田正后方的地下交易点 =====
// 卖价在 ±50% 之间浮动：运气好一件顶一件半，运气差直接腰斩。
// 行情【半天一换】：白天一个、夜晚一个，同一段时间内固定不变，天亮/天黑各翻一次牌。
// 面板只给模糊风声，成交倍率要卖了才揭晓——不然玩家蹲着等高点就没有风险可言了。
export const BLACK_MARKET = {
  min: 0.5,          // 最惨腰斩
  max: 1.5,          // 最好多赚五成
  jitter: 0.18,      // 成交那一刻的额外随机，风声再好也可能翻车
};
// 当前行情（0.5~1.5）。period = 半天序号（白天/夜晚各占一个），
// 用序号当种子算，而不是按真实秒数漂移——同一个半天内怎么读档都是同一个价，
// 离线跨过多少个半天也能自动对上。
export function blackMarketMood(period) {
  const x = Math.sin(period * 12.9898 + 78.233) * 43758.5453;
  const r = x - Math.floor(x); // 稳定的伪随机 0~1
  return BLACK_MARKET.min + r * (BLACK_MARKET.max - BLACK_MARKET.min);
}
// 行情的模糊描述：给玩家一点判断依据，但不报精确数字
export const BLACK_MOODS = [
  { at: 1.28, label: '🔥 风声：来了大买家', tone: 'hot' },
  { at: 1.08, label: '🙂 风声：行情不错', tone: 'good' },
  { at: 0.92, label: '😐 风声：平平淡淡', tone: 'flat' },
  { at: 0.72, label: '😒 风声：老板在压价', tone: 'bad' },
  { at: 0,    label: '💀 风声：行情很不妙', tone: 'awful' },
];
export const blackMoodOf = (mood) => BLACK_MOODS.find(m => mood >= m.at) ?? BLACK_MOODS[BLACK_MOODS.length - 1];

// 水族馆：岛上的玻璃馆 + 藏在岛下的 3D 展厅
// 岛下已被占用的坑位：房间(0,0) 杂交(-60,0) 图鉴(60,0) 花房(-60,-60)
// 宠物(0,60) 成就(60,60)，水族馆挑一个没人用的
export const AQUARIUM_POS = { x: -60, y: -60, z: 60 };
export const AQUARIUM_SLOTS = 15;   // 最多养 15 只
export const EGG_HATCH = 'dino';    // 恐龙虾卵放进去孵出什么

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
// 水塘装饰名走翻译，查不到回落到中文名
export const pondName = (d) => (d ? tf(`pond.${d.id}`, d.name) : '');

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
// 花名走翻译，查不到回落到中文名
export const flowerName = (f) => (f ? tf(`flower.${f.id}`, f.name) : '');
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

/* ===================== 高级料理工坊 =====================
 * 这是全岛唯一「五路进货」的建筑：一道菜要同时用到
 *   屠宰场的部位 + 水潭的水产 + 料理工坊的成品菜 + 杂交室的果 + 地里的作物，
 * 后 10 道再加一瓶酒窖的酒。做不出来通常不是没钱，是某条产线断了。
 *
 * 和普通料理工坊的区别：那边只吃作物，本质是「作物换钱」；
 * 这边吃的全是别的系统的产物，本质是「把六条产线拧成一股」。
 *
 * 25 道菜正好对上 25 种杂交果，一道一种不重样。
 */
// 岛东北角：料理工坊往东 2 格、牧场围栏往北 1.5 格的空地。
// 别往南挪——牧场占到 x[23.7,36.3] z[-6.3,6.4]，挪过去整栋楼会插进围栏里
export const ADV_COOK_POS = { x: 24, z: 11.5 };
export const ADV_COOK_SLOTS = 2;              // 只有两口大灶——比普通工坊的三口还少，慢工出细活
export const ADV_COOK_TIME = 900;             // 一道菜 15 分钟（普通料理是 6 分钟）
export const ADV_DISH_MULT = 2.5;             // 成品价 = 全部原料现价之和 × 2.5

// 配方每项 [来源, id, 数量]，来源决定去背包哪个前缀底下找：
//   'cut'  屠宰部位  → c:<动物>:<部位>
//   'sea'  水产      → s:<id>
//   'dish' 料理成品  → k:<id>
//   'hyb'  杂交果    → h:<id>
//   'crop' 普通作物  → 裸 key，可带品质（'rainbow:gold'）
//   'wine' 酒        → w:<原果key>:<窖藏天数>，天数不限，下锅时自动挑最便宜的那瓶
export const ADV_DISHES = [
  // —— 前 15 道：五样原料，不用酒 ——
  { id: 'g01', name: '鸡骨高汤面', emoji: '🍜', recipe: [['cut', 'chick:bone', 1], ['sea', 'fry', 1], ['dish', 'd1', 1], ['hyb', 'h1', 1], ['crop', 'sweetpot', 1]] },
  { id: 'g02', name: '脆皮鸡卷',   emoji: '🌯', recipe: [['cut', 'chick:hide', 1], ['sea', 'ricesh', 1], ['dish', 'd3', 1], ['hyb', 'h2', 1], ['crop', 'radish', 1]] },
  { id: 'g03', name: '蜜汁鸡排',   emoji: '🍗', recipe: [['cut', 'chick:rib', 1], ['sea', 'mussel', 1], ['dish', 'd5', 1], ['hyb', 'h3', 1], ['crop', 'potato', 1]] },
  { id: 'g04', name: '兔骨浓汤',   emoji: '🍲', recipe: [['cut', 'rabbit:bone', 1], ['sea', 'minnow', 1], ['dish', 'd13', 1], ['hyb', 'h4', 1], ['crop', 'cabbage', 1]] },
  { id: 'g05', name: '麻辣兔丝',   emoji: '🌶️', recipe: [['cut', 'rabbit:hide', 1], ['sea', 'loach', 1], ['dish', 'd7', 1], ['hyb', 'h5', 1], ['crop', 'tomato', 1]] },
  { id: 'g06', name: '招牌炖鸡',   emoji: '🍲', recipe: [['cut', 'chick:meat', 1], ['sea', 'shrimp', 1], ['dish', 'd9', 1], ['hyb', 'h21', 1], ['crop', 'pepper', 1]] },
  { id: 'g07', name: '柴火烤兔排', emoji: '🔥', recipe: [['cut', 'rabbit:rib', 1], ['sea', 'snail', 1], ['dish', 'd11', 1], ['hyb', 'h6', 1], ['crop', 'corn', 1]] },
  { id: 'g08', name: '鸭架煲仔饭', emoji: '🍚', recipe: [['cut', 'duck:bone', 1], ['sea', 'sardine', 1], ['dish', 'd15', 1], ['hyb', 'h11', 1], ['crop', 'strawberry', 1]] },
  { id: 'g09', name: '脆皮烤鸭',   emoji: '🦆', recipe: [['cut', 'duck:hide', 1], ['sea', 'crab', 1], ['dish', 'd17', 1], ['hyb', 'h7', 1], ['crop', 'broccoli', 1]] },
  { id: 'g10', name: '红烧兔肉',   emoji: '🍖', recipe: [['cut', 'rabbit:meat', 1], ['sea', 'whitebait', 1], ['dish', 'd18', 1], ['hyb', 'h22', 1], ['crop', 'pumpkin', 1]] },
  { id: 'g11', name: '酱烧鸭方',   emoji: '🍗', recipe: [['cut', 'duck:rib', 1], ['sea', 'prawn', 1], ['dish', 'd21', 1], ['hyb', 'h8', 1], ['crop', 'eggplant', 1]] },
  { id: 'g12', name: '羊骨胡辣汤', emoji: '🍲', recipe: [['cut', 'goat:bone', 1], ['sea', 'clam', 1], ['dish', 'd19', 1], ['hyb', 'h12', 1], ['crop', 'grape', 1]] },
  { id: 'g13', name: '羊杂拼盘',   emoji: '🥘', recipe: [['cut', 'goat:hide', 1], ['sea', 'crucian', 1], ['dish', 'd20', 1], ['hyb', 'h9', 1], ['crop', 'watermelon', 1]] },
  { id: 'g14', name: '八宝全鸭',   emoji: '🍱', recipe: [['cut', 'duck:meat', 1], ['sea', 'hairycrab', 1], ['dish', 'd22', 1], ['hyb', 'h23', 1], ['crop', 'pineapple', 1]] },
  { id: 'g15', name: '手抓羊排',   emoji: '🍖', recipe: [['cut', 'goat:rib', 1], ['sea', 'icefish', 1], ['dish', 'd23', 1], ['hyb', 'h16', 1], ['crop', 'avocado', 1]] },
  // —— 后 10 道：六样原料，多一瓶酒 ——
  { id: 'g16', name: '羊骨药膳锅', emoji: '🍲', recipe: [['cut', 'sheep:bone', 1], ['sea', 'grasssh', 1], ['dish', 'd37', 1], ['hyb', 'h10', 1], ['crop', 'crystal', 1], ['wine', 'grape', 1]] },
  { id: 'g17', name: '绵羊三吃',   emoji: '🥩', recipe: [['cut', 'sheep:hide', 1], ['sea', 'carp', 1], ['dish', 'd29', 1], ['hyb', 'h14', 1], ['crop', 'peach', 1], ['wine', 'watermelon', 1]] },
  { id: 'g18', name: '全羊盛宴',   emoji: '🎊', recipe: [['cut', 'goat:meat', 1], ['sea', 'bass', 1], ['dish', 'd39', 1], ['hyb', 'h17', 1], ['crop', 'starfruit', 1], ['wine', 'pineapple', 1]] },
  { id: 'g19', name: '迷迭香羊排', emoji: '🌿', recipe: [['cut', 'sheep:rib', 1], ['sea', 'oyster', 1], ['dish', 'd31', 1], ['hyb', 'h15', 1], ['crop', 'cherry', 1], ['wine', 'crystal', 1]] },
  { id: 'g20', name: '水晶肘子',   emoji: '💠', recipe: [['cut', 'pig:hide', 1], ['sea', 'seabream', 1], ['dish', 'd45', 1], ['hyb', 'h13', 1], ['crop', 'rainbow', 1], ['wine', 'peach', 1]] },
  { id: 'g21', name: '烤全羊',     emoji: '🔥', recipe: [['cut', 'sheep:meat', 1], ['sea', 'yellowcr', 1], ['dish', 'd33', 1], ['hyb', 'h24', 1], ['crop', 'moonfruit', 1], ['wine', 'starfruit', 1]] },
  { id: 'g22', name: '东坡肉宴',   emoji: '🍖', recipe: [['cut', 'pig:meat', 1], ['sea', 'octopus', 1], ['dish', 'd41', 1], ['hyb', 'h18', 1], ['crop', 'rainbow:gold', 1], ['wine', 'cherry', 1]] },
  { id: 'g23', name: '和牛盛宴',   emoji: '🥩', recipe: [['cut', 'cow:meat', 1], ['sea', 'grouper', 1], ['dish', 'd43', 1], ['hyb', 'h19', 1], ['crop', 'nebula', 1], ['wine', 'rainbow', 1]] },
  { id: 'g24', name: '御膳双烤',   emoji: '👑', recipe: [['cut', 'horse:meat', 1], ['sea', 'lobster', 1], ['dish', 'd47', 1], ['hyb', 'h25', 1], ['crop', 'moonfruit:gold', 1], ['wine', 'moonfruit', 1]] },
  { id: 'g25', name: '独角兽神宴', emoji: '🦄', recipe: [['cut', 'unicorn:meat', 1], ['sea', 'tuna', 1], ['dish', 'd50', 1], ['hyb', 'h20', 1], ['crop', 'nebula:gold', 1], ['wine', 'nebula', 1]] },
];
export const advDishById = (id) => ADV_DISHES.find(d => d.id === id);

// 配方某一项对应的背包 key。酒返回的是「前缀」（w:<原果>:），
// 因为真正的 key 尾巴上还挂着窖藏天数，得去背包里搜。
export const advIngKey = (src, id) => {
  if (src === 'cut') return `c:${id}`;
  if (src === 'sea') return `s:${id}`;
  if (src === 'dish') return `k:${id}`;
  if (src === 'hyb') return `h:${id}`;
  if (src === 'wine') return `w:${id}:`; // 前缀，不是完整 key
  return id;                             // crop：裸 key，可能自带 :silver / :gold
};

// 配方某一项的单价。酒按「刚出窖」的底价估，实际下锅时按真正用掉的那瓶重算，
// 所以列表里看到的是保底价，用陈年酒做只会更贵、不会更便宜。
export const advIngPrice = (src, id) =>
  src === 'wine' ? winePrice(keyInfo(id).price, 0) : keyInfo(advIngKey(src, id)).price;

// 标价：全部原料现价之和 × 倍率
export function advDishPrice(dish) {
  const sum = dish.recipe.reduce((s, [src, id, n]) => s + advIngPrice(src, id) * n, 0);
  return Math.max(1, Math.floor(sum * ADV_DISH_MULT));
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
    desc: '一层 36 块地同时种上作物', hint: '收获前把一层每块地都种满，一块都别空',
    // rev 2：旧版是「36 块全解锁」，可一层本来就是开着的，有手就行。
    // 改成同时种满 36 块。老达成记录 rev 对不上，读档时会被收回重挣。
    cur: (g) => g.tiles.slice(0, GRID * GRID).filter(t => t.plant).length,
    max: GRID * GRID, rev: 2 },
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
// 哪些成就的进度「只增不减」：解锁数、集齐数、收录数、升级档位这类。
// 对它们来说「现在够不着」必然意味着目标被后来调大了，可以安全收回成就。
// 其余的是瞬时状态——金币会花掉、槽位会空、装饰能铲掉、展台能收回——
// 那属于正常波动，玩家当时确实做到过，绝不能因此把成就撤掉。
const MONOTONIC_ACHIEVEMENTS = new Set([
  'a01', 'a03', 'a04',               // 土地解锁 / 黑土升级（a02 改成同时种满，收了就掉，是瞬时的）
  'a05', 'a06', 'a07', 'a08', 'a09', // 作物解锁 / 图鉴收录
  'a19',                             // 水利等级
  'a23', 'a24', 'a25',               // 家具持有 / 满级数
  'a26', 'a27', 'a29',               // 宠物 / 水塘装饰（买断制）
  'a30', 'a31',                      // 园艺大师 / 特殊种子集齐
]);
ACHIEVEMENTS.forEach(a => { a.monotonic = MONOTONIC_ACHIEVEMENTS.has(a.id); });

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
  // 高级料理：g:<菜id>:<成交价>。价格在下锅那一刻按真正用掉的原料算死，
  // 所以写进 key 里——同一道菜用陈年酒做出来就是比用新酒值钱，不能事后重算。
  if (key.startsWith('g:')) {
    const parts = key.slice(2).split(':');
    const price = parseInt(parts.pop(), 10) || 0;
    const dish = advDishById(parts.join(':'));
    return {
      seed: null, quality: undefined, processed: false, stunted: false,
      advDish: true, price, label: dish.name, icon: dish.emoji,
    };
  }
  if (key.startsWith('h:')) {
    const hy = hybridById(key.slice(2));
    return { seed: null, quality: undefined, processed: false, stunted: false, hybrid: true, price: hy.sell, label: hy.name, icon: hy.emoji };
  }
  if (key.startsWith('f:')) {
    const fl = flowerById(key.slice(2));
    return { seed: null, quality: undefined, processed: false, stunted: false, flower: true, price: fl.sell, label: flowerName(fl), icon: fl.emoji };
  }
  // 酒：w:<原果key>:<窖藏天数>，原果 key 自己可能带冒号，所以从尾巴切天数
  if (key.startsWith('w:')) {
    const parts = key.slice(2).split(':');
    const days = parseInt(parts.pop(), 10) || 0;
    const src = keyInfo(parts.join(':')); // 递归查原果，切掉 w: 后不会再进这一支
    return {
      seed: null, quality: undefined, processed: false, stunted: false,
      wine: true, wineDays: days, wineSrc: parts.join(':'),
      price: winePrice(src.price, days),
      label: [src.label, tf('mod.wine', '酒')].filter(Boolean).join(nameSep()), icon: '🍷',
    };
  }
  if (key.startsWith('s:')) {
    const sf = seafoodById(key.slice(2));
    return { seed: null, quality: undefined, processed: false, stunted: false, seafood: sf.id, price: sf.sell, label: seafoodName(sf), icon: sf.emoji };
  }
  if (key.startsWith('a:')) {
    const an = animalById(key.slice(2));
    return { seed: null, quality: undefined, processed: false, stunted: false, animal: an.id, price: an.sell, label: animalName(an), icon: an.emoji };
  }
  // c:<动物>:<部位> —— 屠宰场拆出来的部位，只能卖，不能再加工
  if (key.startsWith('c:')) {
    const [aid, cid] = key.slice(2).split(':');
    const an = animalById(aid), cut = cutById(cid);
    return {
      seed: null, quality: undefined, processed: false, stunted: false,
      cut: cid, animal: aid, price: cutPrice(aid, cid),
      label: [animalName(an), cutName(cut)].filter(Boolean).join(nameSep()),
      icon: cut.emoji,
    };
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
    // 各段分开翻译再拼：中文不留空格，英俄要留（Gold Tomato 而不是 GoldTomato）
    label: [
      stunted ? tf('mod.stunted', '生长不良的') : '',
      sprayed ? tf('mod.sprayed', '打过药的') : '',
      q ? tf(`quality.${quality}`, q.name) : '',
      seedName(seed),
      processed ? tf('mod.can', '罐头') : '',
    ].filter(Boolean).join(nameSep()),
    icon: `${stunted ? '🥀' : ''}${sprayed ? '🧪' : ''}${q ? q.emoji : ''}${processed ? '🥫' : ''}${seed.emoji}`,
  };
}

/* ===================== 繁荣塔：500 级的金币无底洞 =====================
 * 从 1 级一个小土堆，到 500 级的水晶星穹高楼。
 *
 * 为什么塔不能一直长高：太阳光源在 y=30、阴影相机范围 ±34、雾从 120 米起、
 * 相机最远 150。超过 28 米就会出现「塔顶没影子 / 拉远看全塔时整个岛进雾里」。
 * 所以塔身封顶 22 层 ≈ 27 米，500 级的后半程全部花在装修上。
 *
 * 为什么不写 500 套外观：只写 6 种层高 + 6 档装修。
 *   · 六种层高（底层最厚、越往上越薄）→ 塔的轮廓自然收分，不是一根方柱子
 *   · 每层 4 个部位（主体/窗/栏杆/檐灯）各自独立升档
 *   22 层 × 4 部位 × 5 次升档 = 440 步装修，摊到 500 级 = 每级 0.88 步，
 *   算下来 500 级里有 445 级能看到肉眼变化（89%），L500 正好 440/440 满档。
 *
 * 这是纯粹的钱坑：升级只长外观，不给任何数值加成。
 * 给了加成它就会自己把自己赚回来，也就不叫无底洞了。
 */
export const TOWER_POS = { x: -15, z: -14 }; // 岛西南空地：避开仓库(x≥-10.1)和图鉴大楼(z≥-7.6)
export const TOWER_MAX_LEVEL = 500;
export const TOWER_FLOORS_MAX = 22;
export const TOWER_PARTS = 4;   // 每层可升的部位数：主体 / 窗 / 栏杆 / 檐灯
export const TOWER_TIERS = 6;   // 装修档数

// 造价：1250 起，每级 +4.5%。500 级总价约 100 万亿，只占 JS 安全整数上限的 1.1%，
// 精度绝对够（超过 9e15 金币加减会开始丢零头，存档就会出现「买了不扣钱」）
export const TOWER_BASE_COST = 1250;
export const TOWER_COST_RATE = 1.045;
// 从 lv-1 级升到 lv 级要多少钱（lv 从 1 起）
export const towerCost = (lv) =>
  Math.floor(TOWER_BASE_COST * Math.pow(TOWER_COST_RATE, Math.max(0, lv - 1)));

// 六种层高。底层用最厚的，越往上越薄，塔身自然收分
export const TOWER_HEIGHTS = [0.62, 0.80, 0.98, 1.18, 1.42, 1.72];
// 第 i 层（0 = 最底层）用哪一种层高
export const towerSpecOf = (i) =>
  Math.max(0, Math.min(5, 5 - Math.floor(i * 6 / TOWER_FLOORS_MAX)));

// 六档装修：颜色 + 是否自发光。名字用于面板上显示当前档位
export const TOWER_FINISHES = [
  { name: '夯土', body: 0x9a7a5a, trim: 0x7a5c42, glow: 0 },
  { name: '木构', body: 0xb98a5a, trim: 0x8a5f38, glow: 0 },
  { name: '青石', body: 0x8a95a0, trim: 0x646f7a, glow: 0 },
  { name: '砖砌', body: 0xb5654a, trim: 0x8a4230, glow: 0 },
  { name: '鎏金', body: 0xe0b64a, trim: 0xc4923a, glow: 0.18 },
  { name: '星穹', body: 0x8ae0e0, trim: 0x5aa8d8, glow: 0.55 },
];

// 一层一层来：先把这一层盖起来，装修到顶，再起下一层。
// 一层的工程量 = 1 步盖起来 + 4 个部位各升 5 次档 = 21 步；22 层共 462 步。
// 462 步摊到 500 级 = 每级 0.924 步，所以 500 级里约 92% 都看得见变化。
// 一层 = 1 步盖起来 + 5 步换料。装修不按部位拆了——
// 拆成 4 个部位的话每级只换一个部位，而相邻两档颜色本来就近
// （夯土 0x9a7a5a → 木构 0xb98a5a 都是土褐色），一级根本看不出变化，
// 要连升 4 级才「全塔升档」。整层一次换料，一眼就看得见
export const TOWER_STEPS_PER_FLOOR = 1 + (TOWER_TIERS - 1); // 6
export const TOWER_TOTAL_STEPS = TOWER_FLOORS_MAX * TOWER_STEPS_PER_FLOOR; // 462

// 盖楼换料一共 132 步，剩下的 368 级全给挂件。
// 挂件比装修多得多是故意的：换料一层只换 5 次，靠它撑不满 500 级，
// 而挂件是「凭空多出一件东西」，再小也一眼看得见。
// 位置：前 16 件摆台基一圈，之后每层 16 件（4 个角 × 灯笼/旗幡/檐铃/盆栽）。
export const TOWER_ORNAMENT_TOTAL = TOWER_MAX_LEVEL - TOWER_TOTAL_STEPS; // 38
export const towerOrnaments = (lv) =>
  Math.min(TOWER_ORNAMENT_TOTAL,
    Math.floor(Math.max(0, lv) * TOWER_ORNAMENT_TOTAL / TOWER_MAX_LEVEL));

// 到 lv 级干完了多少步工程 = 等级 - 已挂的挂件数。
// 这么写的好处是：每升一级，要么 work +1，要么挂件 +1，绝不会两个都不动，
// 所以 500 级里每一级都看得见变化，一级都不空
export const towerWork = (lv) =>
  Math.max(0, Math.min(TOWER_TOTAL_STEPS, Math.floor(Math.max(0, lv)) - towerOrnaments(lv)));

// 有几层：只要某层「盖起来」那一步干完了就算一层
export const towerFloors = (lv) => {
  const w = towerWork(lv);
  return w <= 0 ? 0
    : Math.min(TOWER_FLOORS_MAX, Math.floor((w - 1) / TOWER_STEPS_PER_FLOOR) + 1);
};

/* 把等级摊成一张施工图。
 *
 * 和第一版的区别（第一版是错的）：那一版让 22 层先一起长出来、再整塔反复刷装修，
 * 结果 50 级时是一座「12 层夯土烂尾楼」——没人会那样盖房子。
 * 现在改成一层一层交付：第 i 层盖好并装修满 21 步，才轮到第 i+1 层动土。
 * 所以玩家看到的永远是「下面几层已经装修完，最顶上那层正在施工」。
 *
 * 装修顺序在层内轮着来：主体→窗→栏杆→檐灯 各升 1 档，再回头升第 2 档，
 * 这样同一层的四个部位是均匀变好的，不会出现「主体已是水晶、窗还是夯土」。
 */
export function towerPlan(lv) {
  const level = Math.max(0, Math.min(TOWER_MAX_LEVEL, Math.floor(lv || 0)));
  const w = towerWork(level);
  const nFloors = towerFloors(level);

  const floors = [];
  let height = 0.5; // 台基
  for (let i = 0; i < nFloors; i++) {
    const local = w - i * TOWER_STEPS_PER_FLOOR;   // 这一层干完了几步
    // 扣掉「盖起来」那一步，剩下的就是换了几次料。整层同档，
    // tiers 仍然保留 4 个元素（建模那边按部位取色），只是四个值一样
    const tier = Math.max(0, Math.min(TOWER_TIERS - 1, local - 1));
    const tiers = new Array(TOWER_PARTS).fill(tier);
    const spec = towerSpecOf(i);
    floors.push({ spec, h: TOWER_HEIGHTS[spec], tiers });
    height += TOWER_HEIGHTS[spec];
  }
  if (nFloors > 0) height += 1.4; // 尖顶
  // 挂件挂在低层的屋檐四角：第 k 件 → 第 floor(k/4) 层的第 k%4 个角，
  // 种类按 k%4 轮换，所以每层四个角是灯笼/旗幡/檐铃/盆栽各一个
  const orn = towerOrnaments(level);
  return {
    level, floors, height, points: w, maxPoints: TOWER_TOTAL_STEPS,
    ornaments: orn, ornamentMax: TOWER_ORNAMENT_TOTAL,
  };
}

/* ===================== 港湾商船 =====================
 * 岛的大后方一片大水域，每 5 天靠一艘商船，只停那一天。
 * 船上开出 150 样想收的货，每样各自一个倍率：最高 ×3，最低 ×0.3。
 *
 * 和黑市是亲戚，但脾气反过来：
 *   黑市——价格藏着、赌一把、随时能去；
 *   商船——价格明着标、你自己算划不划算，但 5 天才来一次，过期不候。
 * 所以黑市考的是胆量，商船考的是备货。
 */
export const HARBOR_POS = { x: 0, z: -34 };  // 岛最南端的空地，越过黑市和观测台
export const HARBOR = {
  period: 5,     // 每 5 天来一艘
  // 一次开 150 样货单。池子一共 335 种，抽 150 种必然大面积覆盖玩家手上的东西。
  // 不能靠「让船更常要玩家有的」来提命中——那等于船在迎合你，
  // ×3 到 ×0.3 的波动就没意义了。命中该来自「船要得多」，不是「船挑你有的」
  slots: 150,
  min: 0.3,      // 最惨砍到三折
  max: 3.0,      // 最好翻三倍
  waterR: 14,    // 水面半径（抓鱼水潭才 4.3，这个是它的三倍多）
  sandR: 15.6,
};

// 稳定伪随机：同一个种子永远给同一个数。
// 用它而不是 Math.random()，是为了「同一艘船怎么读档都是同一张货单」——
// 否则玩家一刷新就能重摇价格，这单就没意义了
function harborRand(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// 全部可能被收购的货，扁平成一张表。src 决定去背包哪个前缀底下找：
//   crop 裸 key ｜ sea s: ｜ dish k: ｜ adv g:(任意价) ｜ hyb h: ｜ flower f:
//   cut c: ｜ wine w:(任意年份) ｜ metal m:
let _harborPool = null;
export function harborPool() {
  if (_harborPool) return _harborPool;
  const p = [];
  SEEDS.forEach(s => {
    p.push({ src: 'crop', id: s.id });
    p.push({ src: 'crop', id: `${s.id}:silver` });
    p.push({ src: 'crop', id: `${s.id}:gold` });
    p.push({ src: 'wine', id: s.id });
    p.push({ src: 'metal', id: `${s.id}:silver` });
    p.push({ src: 'metal', id: `${s.id}:gold` });
  });
  SEAFOOD.forEach(s => p.push({ src: 'sea', id: s.id }));
  DISHES.forEach(d => p.push({ src: 'dish', id: d.id }));
  ADV_DISHES.forEach(d => p.push({ src: 'adv', id: d.id }));
  HYBRIDS.forEach(h => p.push({ src: 'hyb', id: h.id }));
  FLOWERS.forEach(f => p.push({ src: 'flower', id: f.id }));
  ANIMALS.forEach(a => CUTS.forEach(c => p.push({ src: 'cut', id: `${a.id}:${c.id}` })));
  _harborPool = p;
  return p;
}

// 货单某一项对应的背包 key。酒和高级料理返回的是「前缀」，
// 因为它们真正的 key 尾巴上还挂着窖藏天数 / 成交价，得去背包里搜
export const harborKey = (src, id) => {
  if (src === 'sea') return `s:${id}`;
  if (src === 'dish') return `k:${id}`;
  if (src === 'adv') return `g:${id}:`;     // 前缀
  if (src === 'hyb') return `h:${id}`;
  if (src === 'flower') return `f:${id}`;
  if (src === 'cut') return `c:${id}`;
  if (src === 'wine') return `w:${id}:`;    // 前缀
  if (src === 'metal') return `m:${id}`;
  return id;                                // crop：裸 key
};
export const harborIsPrefix = (src) => src === 'adv' || src === 'wine';

// 第 dock 艘船的货单：150 样货 + 各自倍率。
// 全部由 dock 和槽位序号算出来，同一艘船永远是同一张单
export function harborManifest(dock) {
  const pool = harborPool();
  const list = [];
  const used = new Set();
  for (let i = 0; i < HARBOR.slots; i++) {
    // 撞了就往后顺延，保证 150 样不重样
    let idx = Math.floor(harborRand(dock * 977 + i * 31) * pool.length);
    for (let g = 0; g < pool.length && used.has(idx); g++) idx = (idx + 1) % pool.length;
    used.add(idx);
    const mult = HARBOR.min + harborRand(dock * 613 + i * 97 + 7) * (HARBOR.max - HARBOR.min);
    list.push({ ...pool[idx], mult: Math.round(mult * 100) / 100 });
  }
  return list;
}

/* ===================== 港湾装饰 =====================
 * 30 样，全是大海才有的东西——礁石、海草、鲸鱼、沉船、锚。
 * 水潭那套（荷花、青蛙、锦鲤、睡莲）是小水塘的景，放海里不对。
 *
 * 和水潭装饰的两点不同：
 *   · 水潭是买断制（pondOwned[id] = true），港湾可以重复买（harborOwned[id] = 件数）
 *   · 水潭最多摆 3 件，港湾水面大得多，摆 15 件
 * 所以港湾这边存的是「库存件数」和「摆放列表」，同一样可以摆好几件。
 *
 * kind 决定模型，anim 决定动法：swim 绕着游 / bob 随浪浮沉 / drift 缓慢漂移 / none 不动
 */
export const HARBOR_MAX_PLACED = 15;
export const HARBOR_DECORS = [
  // —— 普通：海边随处可见的 ——
  { id: 'reef',      name: '礁石',     rarity: 'common', cost: 200,   kind: 'rock',    color: 0x8a8880, anim: { type: 'none' } },
  { id: 'reef_big',  name: '大礁岩',   rarity: 'common', cost: 320,   kind: 'rock',    color: 0x76736c, scale: 1.7, anim: { type: 'none' } },
  { id: 'kelp',      name: '海草丛',   rarity: 'common', cost: 240,   kind: 'kelp',    color: 0x3f7c52, anim: { type: 'bob', speed: 0.6 } },
  { id: 'kelp_brown',name: '褐藻',     rarity: 'common', cost: 260,   kind: 'kelp',    color: 0x7a6a38, anim: { type: 'bob', speed: 0.5 } },
  { id: 'shells',    name: '贝壳堆',   rarity: 'common', cost: 180,   kind: 'shells',  color: 0xe0d4bc, anim: { type: 'none' } },
  { id: 'starfish',  name: '海星',     rarity: 'common', cost: 220,   kind: 'star',    color: 0xe08050, anim: { type: 'bob', speed: 0.4 } },
  { id: 'buoy_sea',  name: '航标浮筒', rarity: 'common', cost: 300,   kind: 'buoy',    color: 0xd9534f, anim: { type: 'bob', speed: 1.1 } },
  { id: 'piling',    name: '木桩',     rarity: 'common', cost: 260,   kind: 'piling',  color: 0x7a5232, anim: { type: 'none' } },
  { id: 'netfloat',  name: '渔网浮球', rarity: 'common', cost: 210,   kind: 'float',   color: 0xf2c94c, anim: { type: 'bob', speed: 1.3 } },
  { id: 'sandbar',   name: '沙洲',     rarity: 'common', cost: 350,   kind: 'sandbar', color: 0xd9c9a8, anim: { type: 'none' } },
  // —— 稀有：得出海才见得着 ——
  { id: 'coral_r',   name: '红珊瑚',   rarity: 'rare',   cost: 700,   kind: 'coral',   color: 0xd9534f, anim: { type: 'none' } },
  { id: 'coral_p',   name: '紫珊瑚',   rarity: 'rare',   cost: 760,   kind: 'coral',   color: 0x9a5ac2, anim: { type: 'none' } },
  { id: 'turtle_sea',name: '海龟',     rarity: 'rare',   cost: 900,   kind: 'turtle',  color: 0x5c8a52, anim: { type: 'swim', radius: 4.5, speed: 0.18 } },
  { id: 'anchor',    name: '铁锚',     rarity: 'rare',   cost: 820,   kind: 'anchor',  color: 0x6a6a72, anim: { type: 'none' } },
  { id: 'raft',      name: '木筏',     rarity: 'rare',   cost: 880,   kind: 'raft',    color: 0x9a6a42, anim: { type: 'bob', speed: 0.5 } },
  { id: 'kelpforest',name: '巨藻林',   rarity: 'rare',   cost: 1100,  kind: 'kelp',    color: 0x2f6a44, scale: 2.2, anim: { type: 'bob', speed: 0.35 } },
  { id: 'gull',      name: '海鸥',     rarity: 'rare',   cost: 950,   kind: 'gull',    color: 0xf2ece0, anim: { type: 'swim', radius: 6, speed: 0.5, air: 2.6 } },
  { id: 'lightbuoy', name: '灯浮标',   rarity: 'rare',   cost: 1200,  kind: 'buoy',    color: 0x4a90c2, glow: true, anim: { type: 'bob', speed: 0.9 } },
  { id: 'mast',      name: '沉船桅杆', rarity: 'rare',   cost: 1300,  kind: 'mast',    color: 0x6a4a2e, anim: { type: 'none' } },
  { id: 'jelly_sm',  name: '水母群',   rarity: 'rare',   cost: 1050,  kind: 'jelly',   color: 0xc0a8e0, anim: { type: 'drift', radius: 3, speed: 0.3 } },
  // —— 史诗：大家伙 ——
  { id: 'dolphin',   name: '海豚',     rarity: 'epic',   cost: 2600,  kind: 'dolphin', color: 0x8fa8c0, anim: { type: 'swim', radius: 7, speed: 0.55 } },
  { id: 'shipwreck', name: '沉船',     rarity: 'epic',   cost: 3200,  kind: 'wreck',   color: 0x5a4030, anim: { type: 'none' } },
  { id: 'coral_arch',name: '珊瑚拱门', rarity: 'epic',   cost: 3000,  kind: 'arch',    color: 0xe08098, anim: { type: 'none' } },
  { id: 'orca',      name: '虎鲸',     rarity: 'epic',   cost: 3800,  kind: 'whale',   color: 0x2a2a30, scale: 0.85, anim: { type: 'swim', radius: 8, speed: 0.35 } },
  { id: 'islet',     name: '灯塔小岛', rarity: 'epic',   cost: 4200,  kind: 'islet',   color: 0x8a8880, anim: { type: 'none' } },
  // —— 传说：一片海就这么一个 ——
  { id: 'bluewhale', name: '蓝鲸',     rarity: 'legend', cost: 9000,  kind: 'whale',   color: 0x3a6a9a, scale: 1.5, anim: { type: 'swim', radius: 9.5, speed: 0.22 } },
  { id: 'kraken',    name: '海怪触手', rarity: 'legend', cost: 11000, kind: 'kraken',  color: 0x7a3a6a, anim: { type: 'bob', speed: 0.25 } },
  { id: 'jelly_king',name: '发光水母王', rarity: 'legend', cost: 12000, kind: 'jelly', color: 0x6ae0d0, scale: 2.1, glow: true, anim: { type: 'drift', radius: 4, speed: 0.2 } },
  { id: 'ruins',     name: '龙宫遗迹', rarity: 'legend', cost: 14000, kind: 'ruins',   color: 0x4a8a9a, glow: true, anim: { type: 'none' } },
  { id: 'statue',    name: '海神石像', rarity: 'legend', cost: 16000, kind: 'statue',  color: 0xa8b0a8, anim: { type: 'none' } },
];
export const harborDecorById = (id) => HARBOR_DECORS.find(d => d.id === id);
export const harborDecorName = (d) => (d ? tf(`hdecor.${d.id}`, d.name) : '');

// 15 个摆放点：绕着水面铺开，越靠外圈的越远。
// 港湾水面半径 14，留出栈桥（+z 方向）和岸边，所以点位集中在中段和两侧
export const HARBOR_SPOTS = (() => {
  const out = [];
  const rings = [[5.5, 5, 0.4], [9, 6, 0.9], [12, 4, 1.5]]; // [半径, 个数, 起始角]
  rings.forEach(([r, n, a0]) => {
    for (let i = 0; i < n; i++) {
      const a = a0 + i * Math.PI * 2 / n;
      out.push({ x: Math.cos(a) * r, z: Math.sin(a) * r });
    }
  });
  return out;
})();

/* ===================== 发展评估 =====================
 * 十个维度各打一个 0~100 分，换算成 S/A/B/C/D/E。
 * 再从 100 条建议里挑两条：一条夸最强的维度，一条戳最弱的维度。
 *
 * 分数一律「越接近这个维度的天花板越高」，不跟别的存档比——
 * 这是单机游戏，没有别人可比，只跟自己的上限比。
 */
export const REVIEW_GRADES = [
  { at: 90, g: 'S', color: '#e0a020', word: '登峰造极' },
  { at: 76, g: 'A', color: '#8a4ac2', word: '相当可观' },
  { at: 60, g: 'B', color: '#4a90c2', word: '稳步上升' },
  { at: 40, g: 'C', color: '#5c9b52', word: '刚有起色' },
  { at: 20, g: 'D', color: '#c98a4a', word: '才起了个头' },
  { at: 0,  g: 'E', color: '#8a8a95', word: '基本没动' },
];
export const gradeOf = (score) => REVIEW_GRADES.find(x => score >= x.at) ?? REVIEW_GRADES[REVIEW_GRADES.length - 1];

// 十个维度。icon/name 给面板显示，key 用来对上建议表
export const REVIEW_DIMS = [
  { key: 'wealth',  icon: '💰', name: '财富' },
  { key: 'farm',    icon: '🌱', name: '农田' },
  { key: 'ranch',   icon: '🐄', name: '牧场' },
  { key: 'craft',   icon: '🏭', name: '加工' },
  { key: 'cook',    icon: '👨‍🍳', name: '料理' },
  { key: 'collect', icon: '📖', name: '收藏' },
  { key: 'achieve', icon: '🏅', name: '成就' },
  { key: 'home',    icon: '🏠', name: '家园' },
  { key: 'tower',   icon: '🗼', name: '繁荣塔' },
  { key: 'harbor',  icon: '⛵', name: '港湾' },
];

/* 100 条建议：10 个维度 × （5 条夸 + 5 条戳）。
 * good = 这个维度是你的强项时说的；gap = 这个维度垫底时说的。
 * 全部写成「具体能做的一件事」，不说「继续加油」这种废话。
 */
export const REVIEW_TIPS = [
  // 💰 财富
  { dim: 'wealth', type: 'good', text: '钱够了就别囤着——繁荣塔是唯一吃得下无限金币的地方，一口气升到升不动为止。' },
  { dim: 'wealth', type: 'good', text: '手头宽裕就把牧场 36 栏全填成高档动物，挂机收益是按本金算的，本金越大越滚得快。' },
  { dim: 'wealth', type: 'good', text: '有闲钱可以在商船来之前囤货：×3 的倍率碰上大批存货才是真的赚。' },
  { dim: 'wealth', type: 'good', text: '钱多了记得把银行存满，日结利息是白拿的，放背包里一分不生。' },
  { dim: 'wealth', type: 'good', text: '身家到这个程度，杀虫剂修复剂这类小道具直接买一沓，别再省着用了。' },
  { dim: 'wealth', type: 'gap',  text: '钱紧就先种红薯——成本 0，稳赚不赔，铺满一层比种贵作物亏本强。' },
  { dim: 'wealth', type: 'gap',  text: '缺钱先去银行存一笔，85% 概率赚、15% 概率亏，长期是正收益。' },
  { dim: 'wealth', type: 'gap',  text: '别把作物直接卖了——进工坊做成罐头翻三倍，多等 20 秒的事。' },
  { dim: 'wealth', type: 'gap'  , text: '黑市卖价能到 ×1.5，急用钱时比商场划算，就是得赌一把。' },
  { dim: 'wealth', type: 'gap',  text: '收成先别急着出手，等商船靠港看看有没有 ×2 以上的价，一次顶好几天。' },
  // 🌱 农田
  { dim: 'farm', type: 'good', text: '地都开满了就该升土——黑金土速度 ×1.8、产量 ×2，比多开一块地划算得多。' },
  { dim: 'farm', type: 'good', text: '农田这么强，配个自动灌溉吧，省下的浇水时间够你跑三趟牧场。' },
  { dim: 'farm', type: 'good', text: '田里满了就该考虑打药：卖价 +10，15% 概率报废，便宜作物随便赌。' },
  { dim: 'farm', type: 'good', text: '保存几套布局，换季或者清空以后一键播种，比一格一格点快十倍。' },
  { dim: 'farm', type: 'good', text: '产量上来了就多种特殊种子——月光果星云果卖价高，正好摊薄你的土地成本。' },
  { dim: 'farm', type: 'gap',  text: '空着的地就是空着的钱。先把便宜地块解锁了，红薯白菜铺满也比荒着强。' },
  { dim: 'farm', type: 'gap',  text: '土壤还是普通土的话，先升肥沃土——50💰 换 1.4 倍速度，一天就回本。' },
  { dim: 'farm', type: 'gap',  text: '水源等级低会拖慢一切。洒水器 150💰，一次浇 3×3，比手动快得多。' },
  { dim: 'farm', type: 'gap',  text: '别只种一两样。解锁新作物是永久的，越早解锁越早开始摊成本。' },
  { dim: 'farm', type: 'gap',  text: '第二层农田也别忘了——爬梯子上去，那 36 格跟一层一样能种。' },
  // 🐄 牧场
  { dim: 'ranch', type: 'good', text: '牧场满员了就往上换档：奶牛马鹿的挂机收益是小鸡的几千倍，栏位就那么多。' },
  { dim: 'ranch', type: 'good', text: '成年动物别急着卖，先送屠宰场拆成四个部位——分开卖多五成。' },
  { dim: 'ranch', type: 'good', text: '牧场这么强，屠宰出来的肉正好喂高级料理工坊，那边一道菜要五路进货。' },
  { dim: 'ranch', type: 'good', text: '挂机收益是按栏里的成年动物算的，卖之前想清楚：卖一次的钱 vs 一直下蛋。' },
  { dim: 'ranch', type: 'good', text: '有余力就把独角兽凑满——单栏 830💰/秒，是全岛效率最高的一格。' },
  { dim: 'ranch', type: 'gap',  text: '牧场空着太可惜。小鸡才 500💰，五分钟长成卖 1200，比种地稳。' },
  { dim: 'ranch', type: 'gap',  text: '牧场是挂机收益的主力，栏位填得越满，你不在的时候赚得越多。' },
  { dim: 'ranch', type: 'gap',  text: '动物长成了记得收——留在栏里会一直产钱，但栏位也一直占着。' },
  { dim: 'ranch', type: 'gap',  text: '还没开屠宰场的话，整只卖是亏的：拆成肉/排骨/皮毛/骨，总价多五成。' },
  { dim: 'ranch', type: 'gap',  text: '别一直停在小鸡兔子。每往上一档，收益翻两倍多，成本只翻两倍四。' },
  // 🏭 加工
  { dim: 'craft', type: 'good', text: '工坊转得不错，可以试试分拣台——白银黄金作物能分出金属条，又是一条线。' },
  { dim: 'craft', type: 'good', text: '加工链跑顺了就上酒庄：果子酿成酒基础价翻倍，窖藏每天再 +10。' },
  { dim: 'craft', type: 'good', text: '罐头别急着卖，攒着等商船——加工品也在收购单里，×3 的时候一次出干净。' },
  { dim: 'craft', type: 'good', text: '三个工坊位别空着，离线也照常加工，睡一觉起来就是三批货。' },
  { dim: 'craft', type: 'good', text: '产能够了就往食品店挂礼盒：四样作物装一盒，卖价 ×1.8，挂上就不用管。' },
  { dim: 'craft', type: 'gap',  text: '作物直接卖太亏了。工坊两个原料换一个罐头，卖价是原料总和的三倍。' },
  { dim: 'craft', type: 'gap',  text: '工坊位空着就是白等。反正离线也在跑，出门前记得塞满。' },
  { dim: 'craft', type: 'gap',  text: '酒庄还没用起来吧？果子酿酒翻倍，而且窖藏越久越值钱，是纯赚的时间。' },
  { dim: 'craft', type: 'gap',  text: '分拣台能把带品质的作物变成金属条，比直接卖高不少，别浪费白银黄金。' },
  { dim: 'craft', type: 'gap',  text: '加工是这游戏最稳的增值方式——不赌不等运气，投进去就是三倍。' },
  // 👨‍🍳 料理
  { dim: 'cook', type: 'good', text: '料理做得不错，该上高级料理工坊了——一道菜要屠宰、水产、料理、杂交、作物五路凑齐。' },
  { dim: 'cook', type: 'good', text: '高级料理的价在下锅那刻定死，用陈年酒做出来更值钱，别拿新酒凑数。' },
  { dim: 'cook', type: 'good', text: '25 道高级料理正好对上 25 种杂交果，一道一种不重样，可以照着这条线刷。' },
  { dim: 'cook', type: 'good', text: '两口大灶别空着，一道菜炖 15 分钟，离线照炖。' },
  { dim: 'cook', type: 'good', text: '料理是把杂交果变现的最好出口——直接卖杂交果，不如做成菜再卖。' },
  { dim: 'cook', type: 'gap',  text: '料理工坊闲着呢。凑齐配方就能下锅，卖价是原料总和的三倍。' },
  { dim: 'cook', type: 'gap',  text: '先从一档家常菜做起：三个红薯就能烤，几乎零成本。' },
  { dim: 'cook', type: 'gap',  text: '带品质的作物做菜更值钱——白银黄金别急着卖，留几个下锅。' },
  { dim: 'cook', type: 'gap',  text: '三个灶位同时开火有成就可拿，凑齐原料一次点三道。' },
  { dim: 'cook', type: 'gap',  text: '做菜是消耗过剩作物最划算的方式，背包塞满了就该开火了。' },
  // 📖 收藏
  { dim: 'collect', type: 'good', text: '收藏这么齐，去个人展台摆几样最得意的——杂交果、金条、陈年酒都能上台。' },
  { dim: 'collect', type: 'good', text: '图鉴满了就该转战水族馆，15 格水产是另一套收集线。' },
  { dim: 'collect', type: 'good', text: '特殊种子的收获物进不了 42 格图鉴，但能摆个人展台，别浪费。' },
  { dim: 'collect', type: 'good', text: '杂交果 25 种都配出来了吗？每种正好对应一道高级料理。' },
  { dim: 'collect', type: 'good', text: '收藏齐了就去港湾摆装饰——30 样海洋主题，同一样还能买好几件。' },
  { dim: 'collect', type: 'gap',  text: '图鉴大楼还空着不少。收获时留一个品相好的送进去，收录是永久的。' },
  { dim: 'collect', type: 'gap',  text: '白银黄金作物别全卖了，图鉴要的是 14 种作物 × 3 个品质共 42 格。' },
  { dim: 'collect', type: 'gap',  text: '杂交室试过没有？两种作物配一次，出来的是商店买不到的稀世品。' },
  { dim: 'collect', type: 'gap',  text: '钓上来的鱼别全卖，水族馆养着能看，还有成就。' },
  { dim: 'collect', type: 'gap',  text: '收藏不产钱，但成就大多挂在收藏上——顺手的事，别落下。' },
  // 🏅 成就
  { dim: 'achieve', type: 'good', text: '成就快满了，去成就殿堂转一圈——每个奖杯都是实打实的模型。' },
  { dim: 'achieve', type: 'good', text: '「园艺大师」要求除它自己外全部达成，看看还差哪几个。' },
  { dim: 'achieve', type: 'good', text: '成就全满之后游戏就没有终点了，这时候繁荣塔和港湾正好接上。' },
  { dim: 'achieve', type: 'good', text: '成就这么全，说明每个系统你都碰过了——现在可以挑一条深挖了。' },
  { dim: 'achieve', type: 'good', text: '瞬时成就（同时开三个灶、一层种满）可以专门凑一次，拿完就散。' },
  { dim: 'achieve', type: 'gap',  text: '成就殿堂进去看看，很多成就是「顺手就达成」的，只是你没注意。' },
  { dim: 'achieve', type: 'gap',  text: '解锁类成就最好拿：多解锁几种作物、多开几块地，进度只增不减。' },
  { dim: 'achieve', type: 'gap',  text: '有些成就要「同时」满足，比如三个灶位一起开火，得专门凑一下。' },
  { dim: 'achieve', type: 'gap',  text: '成就是这游戏唯一的目标清单，卡住的时候翻一翻，就知道该干嘛了。' },
  { dim: 'achieve', type: 'gap',  text: '别只盯着赚钱，成就里有不少是「做过一次就行」的，很快能补上一批。' },
  // 🏠 家园
  { dim: 'home', type: 'good', text: '家里装得不错，试试换外观——墙顶门窗七个部位各五种样式，随便混搭。' },
  { dim: 'home', type: 'good', text: '家具都能升到 5 级，升级会换模型，不只是数值。' },
  { dim: 'home', type: 'good', text: '布置模式下家具可以拖着摆，不用按预设位置来。' },
  { dim: 'home', type: 'good', text: '宠物间也别落下，装饰同样能升 3 级，还能换风格。' },
  { dim: 'home', type: 'good', text: '仓库升满了？10 级能装 550 件，囤货等商船就靠它。' },
  { dim: 'home', type: 'gap',  text: '屋里还很空。家具在商场「内饰」页买，每件都能升到 5 级。' },
  { dim: 'home', type: 'gap',  text: '仓库等级低会限制囤货。升一级 100💰，多装 50 件，很便宜。' },
  { dim: 'home', type: 'gap',  text: '宠物间可以养一只展示——20 种宠物，传说级有龙有凤。' },
  { dim: 'home', type: 'gap',  text: '房子外观能换：墙、顶、门、窗四个部位，走过路过都看得见。' },
  { dim: 'home', type: 'gap',  text: '家园这块不产钱，但它是你每天看得最多的地方，值得花点。' },
  // 🗼 繁荣塔
  { dim: 'tower', type: 'good', text: '塔盖得不错。500 级总共要 100 万亿，现在这点只是开头。' },
  { dim: 'tower', type: 'good', text: '每层要盖起来 + 换五次料才轮到下一层，慢慢看它一层层变豪华。' },
  { dim: 'tower', type: 'good', text: '塔是纯钱坑，不给任何数值加成——但它是唯一永远吃得下钱的地方。' },
  { dim: 'tower', type: 'good', text: '面板上有「下一个看得见的变化」，照着那个数字攒就行。' },
  { dim: 'tower', type: 'good', text: '塔上还能挂 368 件小挂件：灯笼、旗幡、檐铃、盆栽，一级一件。' },
  { dim: 'tower', type: 'gap',  text: '繁荣塔还是个小土堆。1 级才 1250💰，先立起第一层看看。' },
  { dim: 'tower', type: 'gap',  text: '钱没处花就去盖塔——它是全岛唯一没有上限的支出。' },
  { dim: 'tower', type: 'gap',  text: '塔的前 20 级很便宜，一口气能看完夯土到星穹的全部六档用料。' },
  { dim: 'tower', type: 'gap',  text: '面板上有「一口气升 N 级」，按你现在的钱能升到哪一级它直接算好。' },
  { dim: 'tower', type: 'gap',  text: '塔长到 22 层就封顶了，但装修和挂件还能一直加到 500 级。' },
  // ⛵ 港湾
  { dim: 'harbor', type: 'good', text: '港湾用得不错。商船每 5 天来一次，趁没船的日子把货备足。' },
  { dim: 'harbor', type: 'good', text: '收购单上的倍率是明着标的，×2 以上的那几样值得专门去凑。' },
  { dim: 'harbor', type: 'good', text: '港湾水面能摆 15 件装饰，同一样还能买好几件重复摆。' },
  { dim: 'harbor', type: 'good', text: '船只停靠港那一天，天亮就走——看到好价别犹豫。' },
  { dim: 'harbor', type: 'good', text: '传说级装饰有蓝鲸、海怪触手、龙宫遗迹，摆出来整片海都不一样。' },
  { dim: 'harbor', type: 'gap',  text: '商船每 5 天来一次，收 150 样货，倍率最高 ×3——比黑市猛得多。' },
  { dim: 'harbor', type: 'gap',  text: '东西别一收到就卖。留着等商船，碰上 ×2 以上就是白赚一倍。' },
  { dim: 'harbor', type: 'gap',  text: '港湾水面还是空的，商场「港湾」页有 30 样海洋装饰。' },
  { dim: 'harbor', type: 'gap',  text: '船开出的价从三折到三倍，看清楚再卖——三折那些留着走商场更划算。' },
  { dim: 'harbor', type: 'gap',  text: '仓库囤货 + 商船高价，这套组合是目前最赚的玩法，别只盯着日常收成。' },
];

/* ===================== 工人培养大楼 =====================
 * 五条生产线的每一个工位都单独升级，互不相干。一共 16 个工位 × 100 级。
 * 每级：这条线的加工时间 -N 秒（N 见下表），出货时每件多给 2💰。
 *
 * 每级减多少秒是按各线自己的基础耗时定的，不是一刀切——
 * 一刀切 3 秒的话，工坊（120 秒）升到 40 级耗时就归零了，
 * 而高级料理（900 秒）升满也才少三分之一。
 * 现在这组数字满级后各线都还剩 17%~44%，一条都不会变成负数。
 */
export const TRAINER_POS = { x: 13, z: 20 };  // 岛北，料理工坊和宠物间外侧的空地
export const TRAINER = {
  maxLevel: 100,
  cost: 500,        // 每级固定 500💰（16 工位 × 100 级 = 全部满级 80 万）
  pricePerLevel: 2, // 每级出货时每件多给 2💰
  minRatio: 0.1,    // 兜底下限：耗时最少保留基础的 10%。
                    // 下面这组数字本来就触不到，但万一以后有人调 per 就靠它兜住
};

// 归它管的五条线。per = 每升一级少几秒，按各线基础耗时的量级定
export const TRAINER_LINES = [
  { key: 'workshop', icon: '🏭',  name: '工坊',         slots: WORKSHOP.slots,  base: WORKSHOP.time,                     per: 1 },
  { key: 'butcher',  icon: '🔪',  name: '屠宰场',       slots: BUTCHER.slots,   base: BUTCHER.killTime + BUTCHER.cutTime, per: 1.5 },
  { key: 'cook',     icon: '🍳',  name: '料理工坊',     slots: COOK_SLOTS,      base: COOK_TIME,                         per: 2 },
  { key: 'hybrid',   icon: '🧬',  name: '杂交室',       slots: HYBRID_SLOTS,    base: HYBRID_TIME,                       per: 4 },
  { key: 'adv',      icon: '👨‍🍳', name: '高级料理工坊', slots: ADV_COOK_SLOTS,  base: ADV_COOK_TIME,                     per: 6 },
];
export const trainerLineBy = (key) => TRAINER_LINES.find(l => l.key === key);
export const TRAINER_TOTAL_SLOTS = TRAINER_LINES.reduce((a, l) => a + l.slots, 0);

// 某条线升到 lv 级后，加工时间还剩基础的百分之几。
// 返回比例而不是秒数，是因为屠宰场分「宰杀 + 细分」两段，
// 拿比例去乘两段各自的时间，两段一起变快，不用分开算
export function trainerRatio(lineKey, lv) {
  const L = trainerLineBy(lineKey);
  if (!L) return 1;
  const left = Math.max(L.base * TRAINER.minRatio, L.base - Math.max(0, lv) * L.per);
  return left / L.base;
}
// 某条线升到 lv 级后的实际耗时（秒），面板上显示用
export const trainerTimeAt = (lineKey, lv) => {
  const L = trainerLineBy(lineKey);
  return L ? Math.round(L.base * trainerRatio(lineKey, lv)) : 0;
};

// 多语言：简体中文（默认）/ English / Русский
// 用法：t('tool.harvest')；静态 HTML 上标 data-i18n="key"，applyStaticI18n() 统一填。
// 切换语言后直接 reload——存档在 localStorage 里，重开一遍最省事也最不容易漏。

export const LANGS = [
  { id: 'zh', name: '简体中文', flag: '🇨🇳' },
  { id: 'en', name: 'English', flag: '🇬🇧' },
  { id: 'ru', name: 'Русский', flag: '🇷🇺' },
];

const DICT = {
  zh: {
    // 工具栏
    'tool.harvest': '收获', 'tool.plant': '种植', 'tool.water': '浇水',
    'tool.spray': '打药', 'tool.shovel': '铲除', 'tool.save': '保存',
    'tool.quick': '快捷', 'tool.afk': '挂机', 'tool.music': '选曲',
    'tool.settings': '设置', 'tool.bag': '背包', 'tool.items': '道具',
    // 面板标题
    'panel.bag': '🎒 背包', 'panel.ws': '🏭 工坊', 'panel.mall': '🛒 商场',
    'panel.items': '🧰 道具背包', 'panel.codex': '📖 图鉴大楼', 'panel.bank': '🏦 黑房子银行',
    'panel.kitchen': '🍳 料理工坊', 'panel.hybrid': '🧬 杂交室', 'panel.pet': '🐾 宠物间',
    'panel.wiki': '📖 游戏百科', 'panel.fish': '🎣 抓鱼水滩', 'panel.house': '🏠 我的小屋',
    'panel.greenhouse': '🌸 花房温室', 'panel.ach': '🏅 成就殿堂', 'panel.black': '🕶️ 黑市',
    'panel.aqua': '🐠 水族馆', 'panel.sorter': '⚙️ 分拣台',
    // 通用按钮
    'btn.close': '✕', 'btn.exit': '🚪 出门', 'btn.exitHall': '🚪 出馆',
    // 设置菜单
    'set.title': '⚙️ 设置', 'set.music': '背景音乐', 'set.sfx': '操作音效',
    'set.tips': '消息提示', 'set.lang': '语言 / Language', 'set.on': '开', 'set.off': '关',
    'set.langHint': '切换后会重新载入，存档不受影响',
    // 建筑名牌（浮在屋顶上那块）
    'sign.workshop': '工坊', 'sign.mall': '商场', 'sign.house': '我的小屋',
    'sign.pond': '抓鱼水滩', 'sign.bank': '银行', 'sign.kitchen': '料理工坊',
    'sign.hybridLab': '杂交室', 'sign.petHouse': '宠物间', 'sign.greenhouse': '花房温室',
    'sign.achievement': '成就殿堂', 'sign.codex': '图鉴大楼', 'sign.aquarium': '水族馆',
    'sign.sorter': '分拣台', 'sign.blackMarket': '黑市',
    // 覆盖层
    'hint.main': '🌱 选择种子种下 → 💧 浇水 → 等待成熟 → 🖐 点击收获卖钱',
    'dead.title': '你毒发身亡了',
    'dead.desc': '拍虫的时候被咬了一口，没来得及解毒。<br>躺一会儿就能复活，这期间什么都干不了。',
    'poison.title': '☠️ 中毒！',
    'poison.desc': '秒内用 💉 解毒剂，否则死亡', 'poison.btn': '💉 立刻解毒',
    'sleep.note': '😴 睡觉中 · 时间正在流逝', 'sleep.wake': '🥱 提前起床',
    'afk.title': '挂机中 · 世界已暂停',
    'afk.desc': '作物、时钟、工坊全部冻结<br>休息一下眼睛吧', 'afk.resume': '☀️ 点击解冻',
  },
  en: {
    'tool.harvest': 'Harvest', 'tool.plant': 'Plant', 'tool.water': 'Water',
    'tool.spray': 'Spray', 'tool.shovel': 'Clear', 'tool.save': 'Save',
    'tool.quick': 'Quick', 'tool.afk': 'AFK', 'tool.music': 'Music',
    'tool.settings': 'Settings', 'tool.bag': 'Bag', 'tool.items': 'Items',
    'panel.bag': '🎒 Backpack', 'panel.ws': '🏭 Workshop', 'panel.mall': '🛒 Mall',
    'panel.items': '🧰 Item Bag', 'panel.codex': '📖 Codex Hall', 'panel.bank': '🏦 Bank',
    'panel.kitchen': '🍳 Kitchen', 'panel.hybrid': '🧬 Crossbreed Lab', 'panel.pet': '🐾 Pet Room',
    'panel.wiki': '📖 Wiki', 'panel.fish': '🎣 Fishing Pond', 'panel.house': '🏠 My House',
    'panel.greenhouse': '🌸 Greenhouse', 'panel.ach': '🏅 Hall of Fame', 'panel.black': '🕶️ Black Market',
    'panel.aqua': '🐠 Aquarium', 'panel.sorter': '⚙️ Sorter',
    'btn.close': '✕', 'btn.exit': '🚪 Leave', 'btn.exitHall': '🚪 Leave',
    'set.title': '⚙️ Settings', 'set.music': 'Music', 'set.sfx': 'Sound Effects',
    'set.tips': 'Notifications', 'set.lang': 'Language / 语言', 'set.on': 'On', 'set.off': 'Off',
    'set.langHint': 'The page reloads on switch; your save is untouched',
    'sign.workshop': 'Workshop', 'sign.mall': 'Mall', 'sign.house': 'My House',
    'sign.pond': 'Fishing Pond', 'sign.bank': 'Bank', 'sign.kitchen': 'Kitchen',
    'sign.hybridLab': 'Crossbreed Lab', 'sign.petHouse': 'Pet Room', 'sign.greenhouse': 'Greenhouse',
    'sign.achievement': 'Hall of Fame', 'sign.codex': 'Codex Hall', 'sign.aquarium': 'Aquarium',
    'sign.sorter': 'Sorter', 'sign.blackMarket': 'Black Market',
    'hint.main': '🌱 Pick a seed → 💧 Water it → Wait to ripen → 🖐 Click to harvest',
    'dead.title': 'You died of poison',
    'dead.desc': 'A bug bit you while swatting and you had no antidote.<br>Lie down a while and you will revive.',
    'poison.title': '☠️ Poisoned!',
    'poison.desc': 's left to use an 💉 antidote, or you die', 'poison.btn': '💉 Use antidote',
    'sleep.note': '😴 Sleeping · time is passing', 'sleep.wake': '🥱 Get up early',
    'afk.title': 'AFK · World paused',
    'afk.desc': 'Crops, clock and workshop are all frozen<br>Give your eyes a rest', 'afk.resume': '☀️ Resume',
  },
  ru: {
    'tool.harvest': 'Сбор', 'tool.plant': 'Посев', 'tool.water': 'Полив',
    'tool.spray': 'Опрыск', 'tool.shovel': 'Убрать', 'tool.save': 'Схема',
    'tool.quick': 'Быстро', 'tool.afk': 'Пауза', 'tool.music': 'Музыка',
    'tool.settings': 'Настройки', 'tool.bag': 'Рюкзак', 'tool.items': 'Предметы',
    'panel.bag': '🎒 Рюкзак', 'panel.ws': '🏭 Мастерская', 'panel.mall': '🛒 Магазин',
    'panel.items': '🧰 Предметы', 'panel.codex': '📖 Зал каталога', 'panel.bank': '🏦 Банк',
    'panel.kitchen': '🍳 Кухня', 'panel.hybrid': '🧬 Лаборатория', 'panel.pet': '🐾 Комната питомцев',
    'panel.wiki': '📖 Энциклопедия', 'panel.fish': '🎣 Пруд', 'panel.house': '🏠 Мой дом',
    'panel.greenhouse': '🌸 Оранжерея', 'panel.ach': '🏅 Зал славы', 'panel.black': '🕶️ Чёрный рынок',
    'panel.aqua': '🐠 Аквариум', 'panel.sorter': '⚙️ Сортировщик',
    'btn.close': '✕', 'btn.exit': '🚪 Выйти', 'btn.exitHall': '🚪 Выйти',
    'set.title': '⚙️ Настройки', 'set.music': 'Музыка', 'set.sfx': 'Звуки',
    'set.tips': 'Уведомления', 'set.lang': 'Язык / Language', 'set.on': 'Вкл', 'set.off': 'Выкл',
    'set.langHint': 'Страница перезагрузится, сохранение не пострадает',
    'sign.workshop': 'Мастерская', 'sign.mall': 'Магазин', 'sign.house': 'Мой дом',
    'sign.pond': 'Пруд', 'sign.bank': 'Банк', 'sign.kitchen': 'Кухня',
    'sign.hybridLab': 'Лаборатория', 'sign.petHouse': 'Питомцы', 'sign.greenhouse': 'Оранжерея',
    'sign.achievement': 'Зал славы', 'sign.codex': 'Зал каталога', 'sign.aquarium': 'Аквариум',
    'sign.sorter': 'Сортировщик', 'sign.blackMarket': 'Чёрный рынок',
    'hint.main': '🌱 Выбери семена → 💧 Полей → Дождись урожая → 🖐 Собери и продай',
    'dead.title': 'Вы отравились насмерть',
    'dead.desc': 'Жук укусил вас при ловле, противоядия не нашлось.<br>Полежите немного — и вы оживёте.',
    'poison.title': '☠️ Отравление!',
    'poison.desc': 'сек, чтобы принять 💉 противоядие, иначе смерть', 'poison.btn': '💉 Принять противоядие',
    'sleep.note': '😴 Сон · время идёт', 'sleep.wake': '🥱 Встать пораньше',
    'afk.title': 'Пауза · мир остановлен',
    'afk.desc': 'Растения, часы и мастерская заморожены<br>Дайте глазам отдохнуть', 'afk.resume': '☀️ Продолжить',
  },
};

const KEY = 'farm-lang';
export let lang = (() => {
  const saved = localStorage.getItem(KEY);
  return LANGS.some(l => l.id === saved) ? saved : 'zh';
})();

// 查不到就退回中文，再查不到就把 key 原样吐出来——宁可露个键名，也别显示 undefined
export const t = (key) => DICT[lang]?.[key] ?? DICT.zh[key] ?? key;

export function setLang(id) {
  if (!LANGS.some(l => l.id === id) || id === lang) return false;
  localStorage.setItem(KEY, id);
  return true;
}

// 把静态 HTML 里标了 data-i18n / data-i18n-title 的地方填上当前语言
export function applyStaticI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = t(el.dataset.i18n);
    if (el.dataset.i18nHtml !== undefined) el.innerHTML = v;
    else el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
}

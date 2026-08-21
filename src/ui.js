import { seedName, seafoodName, flowerName, pondName, SEEDS, SOILS, WATER_LEVELS, DECORS, seedById, QUALITIES, WORKSHOP, keyInfo, QUICK_WATER_COST, ITEMS, itemById, FURNITURE, INTERIOR_POS, FISHING, TREASURY_POS, TREASURY_CATS, TREASURY_TOTAL, treasurySlotInfo, TASK_TIERS, taskTypeById, RECEPTION_POS, RECEPTION_WAIT, RECEPTION_DECORS, receptionDecorName, receptionLevelName, DISHES, dishPrice, ingredientKey, ROD, CASTNET, GOLD_CHANCE, SILVER_CHANCE, MUTANT_CHANCE, DISH_MULT, BANK, DROUGHT, RAIN, PEST, POISON, DAMAGE, UNLOCK_COST, EGG, NIGHT_SLOW, DAY_CYCLE, FURNITURE_MAX_LEVEL, HOUSE_SKINS, HOUSE_SKIN_COST, ADV_DISHES, advDishById, advDishPrice, advIngKey, ADV_COOK_TIME, TOWER_MAX_LEVEL, TOWER_FINISHES, TOWER_FLOORS_MAX, towerPlan, towerCost, HARBOR, harborKey, harborIsPrefix, HARBOR_DECORS, harborDecorById, harborDecorName, HARBOR_MAX_PLACED, REVIEW_TIPS, TRAINER, TRAINER_LINES, trainerTimeAt, TRAINER_STAFF, staffName } from './config.js';
import { POND_DECORS, POND_RARITY, POND_MAX_PLACED, pondDecorById, HYBRIDS, hybridById, HYBRID_POS, HYBRID_TIME, HYBRID_SLOTS, PETS, petById, PET_DECORS, PET_POS, dishById, COOK_TIME, COOK_SLOTS, FLOWERS, flowerById, GREENHOUSE_POS, GREENHOUSE_SLOTS, BOUQUET_SIZE, BOUQUET_MULT } from './config.js';
import { ACHIEVEMENTS, ACHIEVEMENT_POS, ACHIEVEMENT_TIERS } from './config.js';
import { ANIMALS, animalById, animalName, RANCH_GRID, RANCH_POS } from './config.js';
import { BUTCHER, CUTS, cutById, cutName, cutPrice } from './config.js';
import { VISITOR, RARITY_MAX } from './config.js';
import { SORTER_SLOTS, SORTER_TIME, SORTER_MULT, METAL, metalPrice, PESTICIDE } from './config.js';
import { SEAFOOD, seafoodById, AQUARIUM_POS, AQUARIUM_SLOTS } from './config.js';
import { BLACK_MARKET, OBSERVATORY, WEATHER_INFO, WAREHOUSE, WEATHER_MISSILE } from './config.js';
import { BREWERY_POS, BREW, winePrice } from './config.js';
import { SHOP_POS, GIFTBOX, giftboxPrice } from './config.js';
import { music, sfx } from './music.js';
import { perf, QUALITY } from './perf.js';
import { t, tf, tp, nameSep, lang, LANGS, setLang, applyStaticI18n } from './i18n.js';

// 秒数显示成「X分X秒」
const fmtTime = (s) => s >= 60 ? `${Math.floor(s / 60)}${t('unit.min')}${s % 60 ? `${Math.round(s % 60)}${t('unit.sec')}` : ''}` : `${Math.ceil(s)}${t('unit.sec')}`;

const $ = (sel) => document.querySelector(sel);

export class UI {
  constructor(game) {
    this.game = game;
    this.tool = 'hand';        // hand | plant | water | shovel | soil | decor
    this.selectedSeed = 'sweetpot';
    this.selectedSoil = 1;   // 商场土壤页里选好目标土壤，再进升级模式
    this.selectedDecor = null;
    this.mallTab = 'items';   // 商场大楼里包揽了原来商店的全部页签
    this.codexTab = 'crop'; // 典藏大楼：七个展厅的 id，或 gallery（贵宾区个人展台）
    this.achTab = 'all';      // 成就殿堂：all 全部 / done 已达成 / todo 未达成
    this.sellMode = false;    // 一键售卖的勾选状态
    this.sellExcluded = new Set(); // 被玩家点掉、不卖的那些 key

    game.onToast = (msg) => this.toast(msg);
    game.onState = () => this.refresh();
    game.onAchievement = (a) => this.achievementBanner(a);
    game.onWake = () => this.exitSleep();

    this.bindToolbar();
    this.refresh();
    // 读档时攒下的话，这会儿 UI 才建好，补说给玩家听
    game._notices.splice(0).forEach((m, i) => setTimeout(() => this.toast(m), 400 + i * 700));
  }

  /* ---------- 工具栏 ---------- */

  bindToolbar() {
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => this.setTool(btn.dataset.tool));
    });
    $('#bag-btn').addEventListener('click', () => {
      const wasHidden = $('#bag').classList.contains('hidden');
      this.closePanels();
      this.exitSellMode(); // 从工具栏正常打开背包，不带勾选状态
      if (wasHidden) { $('#bag').classList.remove('hidden'); this.renderBag(); }
    });
    $('#bag-close').addEventListener('click', () => {
      $('#bag').classList.add('hidden');
      this.exitSellMode(); // 关掉背包就退出勾选状态，下次打开是干净的
      $('#sell-bar')?.remove();
    });
    $('#ws-close').addEventListener('click', () => $('#ws').classList.add('hidden'));
    $('#mall-close').addEventListener('click', () => $('#mall').classList.add('hidden'));
    $('#items-close').addEventListener('click', () => $('#items').classList.add('hidden'));
    $('#house-close').addEventListener('click', () => this.exitHouse());
    // 必须走 exitFishing：只隐藏面板的话 inFishing 会一直是 true，
    // 于是 inside() 恒为真，main.js 里所有菜园点击都被拦掉，表现是「点什么都没反应」
    $('#fish-close').addEventListener('click', () => this.exitFishing());
    $('#bank-close').addEventListener('click', () => $('#bank').classList.add('hidden'));
    $('#kitchen-close').addEventListener('click', () => $('#kitchen').classList.add('hidden'));
    $('#gourmet-close').addEventListener('click', () => $('#gourmet').classList.add('hidden'));
    $('#tower-close').addEventListener('click', () => $('#tower').classList.add('hidden'));
    $('#harbor-close').addEventListener('click', () => $('#harbor').classList.add('hidden'));
    $('#review-close').addEventListener('click', () => $('#review').classList.add('hidden'));
    $('#trainer-close').addEventListener('click', () => $('#trainer').classList.add('hidden'));
    $('#wiki-close').addEventListener('click', () => $('#wiki').classList.add('hidden'));
    $('#hybrid-close').addEventListener('click', () => this.exitHybridLab());
    $('#pet-close').addEventListener('click', () => this.exitPetRoom());
    $('#greenhouse-close').addEventListener('click', () => this.exitGreenhouse());
    $('#ranch-close').addEventListener('click', () => this.exitRanch());
    $('#butcher-close').addEventListener('click', () => this.exitButcher());
    $('#visitor-close').addEventListener('click', () => $('#visitor').classList.add('hidden'));
    $('#day-report-ok').addEventListener('click', () => { this.game.ackDayReport(); this.renderTaskPick(); });
    $('#codex-close').addEventListener('click', () => this.exitCodex());
    $('#ach-close').addEventListener('click', () => this.exitAchievement());
    $('#sorter-close').addEventListener('click', () => $('#sorter').classList.add('hidden'));
    $('#aqua-close').addEventListener('click', () => this.exitAquarium());
    $('#obs-close').addEventListener('click', () => $('#obs').classList.add('hidden'));
    $('#tasks-close').addEventListener('click', () => $('#tasks').classList.add('hidden'));
    $('#reception-close').addEventListener('click', () => this.exitReception());
    $('#brew-close').addEventListener('click', () => this.exitBrewery());
    $('#shop2-close').addEventListener('click', () => this.exitFoodShop());
    $('#ware-close').addEventListener('click', () => $('#ware').classList.add('hidden'));
    $('#black-close').addEventListener('click', () => $('#black').classList.add('hidden'));
    $('#items-btn').addEventListener('click', () => {
      const panel = $('#items');
      const wasHidden = panel.classList.contains('hidden');
      this.closePanels();
      this.itemPicking = null; // 每次重新打开都回到道具列表，别停在上次的挑选界面
      if (wasHidden) { panel.classList.remove('hidden'); this.renderItems(); }
    });
    // 工坊/鱼网倒计时刷新
    setInterval(() => {
      if (!$('#ws').classList.contains('hidden')) this.renderWorkshop();
      if (!$('#kitchen').classList.contains('hidden')) this.renderKitchen();
      if (!$('#gourmet').classList.contains('hidden')) this.renderGourmet();
      if (!$('#trainer').classList.contains('hidden')) this.renderTrainer();
      if (!$('#hybrid').classList.contains('hidden')) {
        this.renderHybrid();
        this.game.updateHybridVisuals(); // 培养罩里的作物随进度长大
      }
      if (!$('#greenhouse').classList.contains('hidden')) this.renderGreenhouse();
      if (!$('#ranch').classList.contains('hidden')) this.renderRanch();
      if (!$('#butcher').classList.contains('hidden') && this.butcherPicking === null) this.renderButcher();
      if (!$('#visitor').classList.contains('hidden')) this.renderVisitor();
      if (!$('#sorter').classList.contains('hidden')) this.renderSorter();
      // 酒庄/食品店的「挑东西」那一屏整屏都是静态的（背包里的作物不会自己变），
      // 定时重绘除了把滚动条弹回顶上，还可能正好在两次点击之间把按钮换掉、吞掉一下点击。
      // 只在总览屏刷新，倒计时该跳还是跳。同钓鱼面板收杆时的处理。
      if (!$('#brew').classList.contains('hidden') && this.brewPick === null) this.renderBrewery();
      if (!$('#shop2').classList.contains('hidden') && !this.giftPicking) this.renderFoodShop();
      if (!$('#tasks').classList.contains('hidden')) this.renderTasks();
      if (!$('#reception').classList.contains('hidden')) this.renderReception();
      if (!$('#fish').classList.contains('hidden')) {
        // 正在狂点收杆时别整块重绘，会打断连点
        if (this.game.pendingCatch && $('#reel-btn')) return;
        this.renderFishing();
      }
    }, 500);
    // 左上角时钟
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
    // 中毒/死亡状态显示
    $('#poison-use').addEventListener('click', () => {
      if ((this.game.items.antidote ?? 0) > 0) this.game.useItem('antidote');
      else this.toast(tp('t.noAntidote', { cost: itemById('antidote')?.cost ?? 20 }));
    });
    setInterval(() => this.updateHealth(), 250);
    // 工具栏保存布局按钮
    $('#save-layout-btn').addEventListener('click', () => this.game.saveLayout());
    // 设置菜单：音乐开关 + 提示开关
    this.tipsOn = localStorage.getItem('farm-tips-on') !== '0';
    $('#settings-btn').addEventListener('click', () => {
      const menu = $('#settings-menu');
      const wasHidden = menu.classList.contains('hidden');
      menu.classList.add('hidden');
      $('#quick-menu').classList.add('hidden');
      $('#music-menu').classList.add('hidden');
      $('#seed-picker').classList.add('hidden');
      if (wasHidden) { menu.classList.remove('hidden'); this.renderSettingsMenu(); }
    });
    music.onTrack = (name) => {
      this.toast(tp('t.nowPlaying', { name }));
      if (!$('#music-menu').classList.contains('hidden')) this.renderMusicMenu();
    };
    // 选曲弹窗
    $('#music-pick-btn').addEventListener('click', () => {
      const menu = $('#music-menu');
      const wasHidden = menu.classList.contains('hidden');
      menu.classList.add('hidden');
      $('#quick-menu').classList.add('hidden');
      $('#settings-menu').classList.add('hidden');
      $('#seed-picker').classList.add('hidden');
      if (wasHidden) { menu.classList.remove('hidden'); this.renderMusicMenu(); }
    });
    // 所有面板的关闭按钮统一来一声，省得在十几处绑定里各加一遍
    document.querySelectorAll('[id$="-close"]').forEach(btn =>
      btn.addEventListener('click', () => sfx.play('close')));
    // 挂机模式
    $('#sleep-wake').addEventListener('click', () => this.game.wakeUp(true));
    $('#afk-btn').addEventListener('click', () => this.setAfk(true));
    $('#afk-resume').addEventListener('click', () => this.setAfk(false));
    if (this.game.paused) $('#afk-overlay').classList.remove('hidden'); // 上次是挂机时关的
    // 快捷菜单 + 键盘快捷键
    $('#quick-btn').addEventListener('click', () => {
      const menu = $('#quick-menu');
      if (menu.classList.contains('hidden')) this.openQuickMenu('main');
      else menu.classList.add('hidden');
      $('#seed-picker').classList.add('hidden');
      $('#music-menu').classList.add('hidden');
      $('#settings-menu').classList.add('hidden');
    });
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return; // 正在输入金额时快捷键不抢戏
      if (e.repeat || this.game.paused) return; // 挂机中快捷键也冻结
      if (this.game.isDead()) return;           // 躺着呢，什么都干不了
      const k = e.key.toLowerCase();
      if (k === 'escape') {
        $('#quick-menu').classList.add('hidden');
        $('#music-menu').classList.add('hidden');
        $('#settings-menu').classList.add('hidden');
        this.exitHouse();
        this.exitCodex();
        this.exitFishing();
        this.exitHybridLab();
        this.exitPetRoom();
        return;
      }
      if (this.inside()) return; // 屋里/馆里不干农活
      if (k === 'r') this.openQuickMenu('layouts'); // R 直接打开布局列表
      if (k === 'w') this.game.waterAll();
      if (k === 'h') this.game.harvestAll();
      if (k === 's') this.openSellMode();
    });
  }

  setTool(tool, opts = {}) {
    this.tool = tool;
    if (opts.decorId) this.selectedDecor = opts.decorId;
    document.querySelectorAll('.tool-btn[data-tool]').forEach(b =>
      b.classList.toggle('active', b.dataset.tool === tool));
    $('#seed-picker').classList.toggle('hidden', tool !== 'plant');
    $('#quick-menu').classList.add('hidden');
    $('#music-menu').classList.add('hidden');
    $('#settings-menu').classList.add('hidden');
    if (tool === 'plant') this.renderSeedPicker();
    const tips = {
      soil: tp('hint.soil', { name: tf(`soil.name.${this.selectedSoil}`, SOILS[this.selectedSoil].name), cost: SOILS[this.selectedSoil].cost }),
      decor: t('hint.decor'),
      water: this.game.waterLevel === 2 ? t('hint.autoWater') : t('hint.water'),
      spray: tp('hint.spray', { rate: Math.round(PESTICIDE.costRate * 100), mult: PESTICIDE.mult, pct: Math.round(PESTICIDE.ruinChance * 100) }),
      shovel: t('hint.shovel'),
    };
    if (tips[tool]) this.toast(tips[tool]);
    sfx.play('tap');
  }

  renderSeedPicker() {
    const wrap = $('#seed-picker');
    wrap.innerHTML = '';
    this.game.unlockedSeeds.forEach(id => {
      const s = seedById(id);
      const chip = document.createElement('div');
      chip.className = 'seed-chip' + (this.selectedSeed === id ? ' selected' : '');
      chip.innerHTML = `<b>${s.emoji}</b>${seedName(s)}<br><small>${s.cost}💰 · ${s.sell}</small>`;
      chip.addEventListener('click', () => { this.selectedSeed = id; this.renderSeedPicker(); sfx.play('tap'); });
      wrap.appendChild(chip);
    });
  }

  /* ---------- 背包 ---------- */

  renderBag() {
    const body = $('#bag-body');
    const g = this.game;
    body.innerHTML = '';
    $('#sell-bar')?.remove(); // 每次重画都先撤掉旧的确认栏，否则会一条条堆起来
    const entries = Object.entries(g.inventory).filter(([, n]) => n > 0);
    if (!entries.length) {
      body.innerHTML = `<div class="bag-empty">${t('bag.empty')}</div>`;
      this.exitSellMode();
      return;
    }
    // 按种子顺序排，同种作物普通→白银→黄金，罐头排在生鲜后面
    const qualityRank = { undefined: 0, silver: 1, gold: 2 };
    entries.sort(([a], [b]) => {
      const ia = keyInfo(a); const ib = keyInfo(b);
      const ai = SEEDS.indexOf(ia.seed); const bi = SEEDS.indexOf(ib.seed);
      return ai - bi || (ia.processed ? 1 : 0) - (ib.processed ? 1 : 0)
        || qualityRank[ia.quality] - qualityRank[ib.quality];
    });
    entries.forEach(([key, n]) => {
      const info = keyInfo(key);
      const quality = info.quality;
      const keep = g.worthKeeping(key); // 图鉴还没收录的，标出来供参考，卖不卖玩家自己定
      const el = document.createElement('div');
      el.className = 'bag-item' + (quality ? ` quality-${quality}` : '') + (keep ? ' keep' : '');

      // 售卖模式：每项前面一个对勾，默认全勾上，点一下取消
      if (this.sellMode) {
        const on = !this.sellExcluded.has(key);
        el.classList.add('sell-pick', on ? 'on' : 'off');
        const tick = document.createElement('div');
        tick.className = 'tick';
        tick.textContent = on ? '✅' : '⬜';
        el.appendChild(tick);
        el.addEventListener('click', () => {
          if (on) this.sellExcluded.add(key); else this.sellExcluded.delete(key);
          this.renderBag();
        });
      }

      el.insertAdjacentHTML('beforeend', `<div class="icon">${info.icon}</div>
        <div class="info"><b>${info.label} ×${n}${keep ? `<i class="keep-tag">${t('bag.keepTag')}</i>` : ''}</b>
          <p>${tp('bag.unit', { price: info.price, total: info.price * n })}</p></div>`);

      // 非售卖模式才给单卖按钮，免得点勾和点卖混在一起
      if (!this.sellMode) {
        const sellOne = document.createElement('button');
        sellOne.textContent = t('bag.sellOne');
        sellOne.addEventListener('click', () => { g.sellCrop(key, 1); this.renderBag(); });
        const sellAll = document.createElement('button');
        sellAll.className = 'sell-all';
        sellAll.textContent = t('bag.sellAll');
        sellAll.addEventListener('click', () => { g.sellCrop(key, n); this.renderBag(); });
        el.append(sellOne, sellAll);
      }
      body.appendChild(el);
    });

    if (this.sellMode) this.renderSellBar(entries);
  }

  /* ---------- 一键售卖：先勾选，再卖 ---------- */

  // 入口：跳到背包并全部勾上，玩家把不卖的点掉再确认
  openSellMode() {
    const g = this.game;
    if (!Object.keys(g.inventory).some(k => g.inventory[k] > 0)) {
      this.toast(t('t.nothingToSell'));
      return;
    }
    this.closePanels();
    this.sellMode = true;
    this.sellExcluded = new Set();
    $('#bag').classList.remove('hidden');
    this.renderBag();
    sfx.play('open');
  }

  exitSellMode() {
    this.sellMode = false;
    this.sellExcluded = new Set();
  }

  // 底部那条固定的确认栏：实时算选中件数与总价
  renderSellBar(entries) {
    const g = this.game;
    const picked = entries.filter(([key]) => !this.sellExcluded.has(key));
    const count = picked.reduce((s, [, n]) => s + n, 0);
    const total = picked.reduce((s, [key, n]) => s + keyInfo(key).price * n, 0);
    const bar = document.createElement('div');
    bar.id = 'sell-bar';
    bar.innerHTML = `<small>${t('sell.tip')}</small>`;
    const btn = document.createElement('button');
    btn.disabled = !picked.length;
    btn.textContent = picked.length ? tp('sell.confirm', { count, total }) : t('sell.none');
    btn.addEventListener('click', () => {
      g.sellKeys(picked.map(([key]) => key));
      this.exitSellMode();
      this.renderBag();
    });
    const cancel = document.createElement('button');
    cancel.className = 'ghost';
    cancel.textContent = t('ui.cancel');
    cancel.addEventListener('click', () => { this.exitSellMode(); this.renderBag(); sfx.play('close'); });
    bar.append(btn, cancel);
    $('#bag').appendChild(bar);
  }

  /* ---------- 面板统一开关 ---------- */

  closePanels() {
    ['#bag', '#ws', '#mall', '#items', '#fish', '#bank', '#kitchen', '#gourmet', '#tower', '#harbor', '#review', '#trainer', '#wiki', '#hybrid', '#pet', '#greenhouse', '#sorter', '#black', '#obs', '#ware', '#brew', '#shop2', '#ranch', '#butcher', '#visitor', '#tasks', '#reception', '#quick-menu']
      .forEach(sel => $(sel).classList.add('hidden'));
    this.exitHouse(); // 打开别的面板时顺便走出房间
    this.exitCodex();
    this.exitFishing(); // 干别的就等于收竿
    this.exitHybridLab();
    this.exitPetRoom();
    this.exitGreenhouse();
    this.exitAchievement();
    this.exitAquarium();
    this.exitBrewery();
    this.exitReception();
    this.exitFoodShop();
    this.exitRanch(); // 漏了这条的后果：在牧场点开别的面板，镜头会卡在岛东回不来
  }

  // 加 !! 保证返回真正的布尔：|| 链在全部 falsy 时会返回最后一项（undefined）
  inside() {
    return !!(this.inHouse || this.inCodex || this.inFishing || this.inHybridLab
      || this.inPetRoom || this.inGreenhouse || this.inAchievement || this.inAquarium || this.inBrewery
      || this.inFoodShop || this.inReception);
  }

  /* ---------- 主动钓鱼 ---------- */

  enterFishing(gear = 'rod') {
    if (!this.game.startFishing(gear)) return;
    // closePanels 会触发 exitFishing，所以先关面板再进入
    this.game.fishing = false;
    this.closePanels();
    this.game.fishing = true;
    if (this.camera) {
      this._fishCamBackup = {
        pos: this.camera.position.clone(),
        target: this.controls.target.clone(),
        minD: this.controls.minDistance,
      };
      const p = this.game.pond.position;
      this.controls.target.set(p.x, 0.2, p.z);
      this.camera.position.set(p.x + 6, 4.5, p.z + 8);
      this.controls.minDistance = 4;
      this.controls.update();
    }
    this.inFishing = true;
    $('#fish').classList.remove('hidden');
    this.renderFishing();
  }

  exitFishing() {
    // 关面板要放在守卫之前：点水塘只是打开面板（inFishing 还是 false），
    // 守卫挡在前面的话叉号就点了没反应，非得先进垂钓模式才关得掉
    $('#fish').classList.add('hidden');
    if (!this.inFishing) return; // 没在垂钓模式，收竿和镜头都不用管
    this.inFishing = false;
    this.game.stopFishing();
    if (this._fishCamBackup) {
      this.camera.position.copy(this._fishCamBackup.pos);
      this.controls.target.copy(this._fishCamBackup.target);
      this.controls.minDistance = this._fishCamBackup.minD;
      this.controls.update();
      this._fishCamBackup = null;
    }
  }

  /* ---------- 食品店 ---------- */

  openFoodShop() {
    this.closePanels();
    $('#shop2').classList.remove('hidden');
    if (!this.inFoodShop && this.camera) {
      this._camBackup = {
        pos: this.camera.position.clone(),
        target: this.controls.target.clone(),
        minD: this.controls.minDistance,
      };
      const p = SHOP_POS;
      // 跟酒窖同样的道理：3D 按整个视口渲染，右边被面板盖住，
      // 相机和目标一起右移半个面板宽，货架才落在露出来的那半屏中间
      // dist 要跟下面相机到目标的实际距离对上（√(10²+17.4²)≈20），
      // 否则算出来的 shift 是按错的距离推的，货架还是会被面板压住
      const dist = 20;
      const visH = 2 * dist * Math.tan((this.camera.fov * Math.PI / 180) / 2);
      const shift = visH * this.camera.aspect * (this.shopPanelWidth() / window.innerWidth) / 2;
      this.controls.target.set(p.x + shift, p.y + 1, p.z + 0.6);
      this.camera.position.set(p.x + shift, p.y + 11, p.z + 18);
      this.controls.minDistance = 3;
      this.controls.update();
      this.inFoodShop = true;
    }
    this.giftSel = [];      // 正在往盒子里放的作物
    this.giftPicking = false; // 是否停在「挑作物」那一屏
    this.renderFoodShop();
    $('#shop2-body').scrollTop = 0;
  }

  shopPanelWidth() {
    const w = $('#shop2').getBoundingClientRect().width;
    return w || Math.min(480, window.innerWidth * 0.4);
  }

  exitFoodShop() {
    $('#shop2').classList.add('hidden');
    if (!this.inFoodShop) return;
    this.inFoodShop = false;
    this.giftSel = [];
    this.giftPicking = false;
    if (this._camBackup) {
      this.camera.position.copy(this._camBackup.pos);
      this.controls.target.copy(this._camBackup.target);
      this.controls.minDistance = this._camBackup.minD;
      this.controls.update();
      this._camBackup = null;
    }
  }

  renderFoodShop() {
    const g = this.game;
    const body = $('#shop2-body');
    const scrolled = body.scrollTop;
    body.innerHTML = '';
    this.giftSel = this.giftSel || [];

    // ① 挑作物那一屏
    if (this.giftPicking) {
      body.insertAdjacentHTML('beforeend',
        `<div id="gift-top"><b>🧺 ${tp('gift.pickTitle', { n: GIFTBOX.size })}</b>`
        + `<small>${tp('gift.pickHint', { n: GIFTBOX.size, mult: GIFTBOX.mult })}</small></div>`);
      const back = document.createElement('button');
      back.className = 'brew-back';
      back.textContent = `↩︎ ${t('gift.back')}`;
      back.addEventListener('click', () => { this.giftPicking = false; this.renderFoodShop(); });
      body.appendChild(back);
      body.appendChild(this.giftBasket());

      const list = g.giftCandidates();
      if (!list.length) {
        body.insertAdjacentHTML('beforeend', `<div class="brew-empty">${t('gift.noCrop')}</div>`);
      } else {
        const grid = document.createElement('div');
        grid.id = 'brew-fruits';
        list.sort((a, b) => keyInfo(b).price - keyInfo(a).price).forEach(key => {
          const info = keyInfo(key);
          // 背包里的数量要减掉已经放进盒子的，否则能超量选
          const avail = g.inventory[key] - this.giftSel.filter(x => x === key).length;
          const el = document.createElement('button');
          el.className = 'brew-fruit';
          el.innerHTML = `<b>${info.icon}</b><span>${info.label}</span><small>×${avail} · ${info.price}💰</small>`;
          el.disabled = avail <= 0 || this.giftSel.length >= GIFTBOX.size;
          el.addEventListener('click', () => { this.giftSel.push(key); this.renderFoodShop(); });
          grid.appendChild(el);
        });
        body.appendChild(grid);
      }
      // 只有刚点开挑作物时才回到顶部。这里每半秒会被定时器重绘一次，
      // 无条件归零的话，玩家往下翻找作物，翻两下就被弹回顶上。
      body.scrollTop = this._giftPickShown ? scrolled : 0;
      this._giftPickShown = true;
      return;
    }
    this._giftPickShown = false; // 退出挑作物，下次再进重新从顶部看起

    // ② 货架总览
    const used = g.shelf.filter(Boolean).length;
    const pending = g.shelf.reduce((s, b) => s + (b ? b.price : 0), 0);
    body.insertAdjacentHTML('beforeend',
      `<div id="gift-top"><b>🎁 ${t('gift.shelf')} ${used} / ${GIFTBOX.slots}</b>`
      + `<small>${tp('gift.shelfHint', { min: GIFTBOX.minWait, max: Math.round(GIFTBOX.maxWait / 60) })}</small>`
      + (used ? `<em>${t('gift.pending')} ${pending}💰</em>` : '') + `</div>`);

    const add = document.createElement('button');
    add.id = 'gift-add';
    add.disabled = used >= GIFTBOX.slots;
    add.textContent = used >= GIFTBOX.slots ? `🈵 ${t('gift.full')}` : `➕ ${t('gift.add')}`;
    add.addEventListener('click', () => { this.giftPicking = true; this.giftSel = []; this.renderFoodShop(); });
    body.appendChild(add);

    g.shelf.forEach((box, k) => {
      const el = document.createElement('div');
      el.className = 'ws-slot';
      if (!box) {
        el.innerHTML = `<div class="icon">🗄️</div><div class="info"><b>${tp('gift.slotN', { n: k + 1 })}</b><p>${t('gift.slotEmpty')}</p></div>`;
      } else {
        const remain = Math.max(0, box.soldAt - g.time);
        const icons = box.keys.map(key => keyInfo(key).icon).join('');
        el.innerHTML = `<div class="icon">🎁</div><div class="info"><b>${icons}</b>`
          + `<p>${tp('gift.waiting', { p: box.price, m: fmtTime(remain) })}</p></div>`;
        const btn = document.createElement('button');
        btn.className = 'gift-unlist';
        btn.textContent = `📤 ${t('gift.unlist')}`;
        btn.addEventListener('click', () => { g.unlistGiftbox(k); this.renderFoodShop(); });
        el.appendChild(btn);
      }
      body.appendChild(el);
    });
    body.scrollTop = scrolled;
  }

  // 待装的四格 + 实时总价 + 卖出键，挑作物那一屏顶上常驻
  giftBasket() {
    const wrap = document.createElement('div');
    wrap.id = 'gift-basket';
    const row = document.createElement('div');
    row.className = 'gift-slots';
    this.giftSel.forEach((key, idx) => {
      const chip = document.createElement('button');
      chip.className = 'gift-chip';
      chip.innerHTML = `${keyInfo(key).icon}<i>✕</i>`;
      chip.title = t('gift.removeTip');
      chip.addEventListener('click', () => { this.giftSel.splice(idx, 1); this.renderFoodShop(); });
      row.appendChild(chip);
    });
    for (let i = this.giftSel.length; i < GIFTBOX.size; i++) {
      const empty = document.createElement('span');
      empty.className = 'gift-chip empty';
      empty.textContent = '➕';
      row.appendChild(empty);
    }
    wrap.appendChild(row);

    // 总价随选随算，没选满也先给个当前小计
    const sum = this.giftSel.reduce((s, k) => s + keyInfo(k).price, 0);
    const price = giftboxPrice(sum);
    const info = document.createElement('div');
    info.className = 'gift-sum';
    info.innerHTML = this.giftSel.length
      ? `${t('gift.sum')} ${sum}💰 × ${GIFTBOX.mult} = <b>${price}💰</b>`
      : `<span class="gift-sum-hint">${tp('gift.pickMore', { n: GIFTBOX.size })}</span>`;
    wrap.appendChild(info);

    const sell = document.createElement('button');
    sell.id = 'gift-sell';
    sell.disabled = this.giftSel.length !== GIFTBOX.size;
    sell.textContent = this.giftSel.length === GIFTBOX.size
      ? `🎁 ${tp('gift.sell', { p: price })}`
      : `${tp('gift.needMore', { n: GIFTBOX.size - this.giftSel.length })}`;
    sell.addEventListener('click', () => {
      if (this.game.listGiftbox([...this.giftSel])) {
        this.giftSel = [];
        this.giftPicking = false;   // 上架成功回到货架总览，能立刻看见新盒子
        this.renderFoodShop();
      }
    });
    wrap.appendChild(sell);
    return wrap;
  }

  /* ---------- 酒庄 ---------- */

  // 面板实际占掉的宽度（CSS 里写死 420，窄屏时不会超过半屏）
  panelWidth() {
    const el = $('#brew');
    const w = el.getBoundingClientRect().width;
    return w || Math.min(420, window.innerWidth * 0.5);
  }

  openBrewery() {
    this.closePanels();
    // 先亮出面板：底下算镜头偏移要量它的实际宽度，还藏着的话量出来是 0
    $('#brew').classList.remove('hidden');
    // 镜头钻进酒窖
    if (!this.inBrewery && this.camera) {
      this._camBackup = {
        pos: this.camera.position.clone(),
        target: this.controls.target.clone(),
        minD: this.controls.minDistance,
      };
      const p = BREWERY_POS;
      // 3D 是按整个视口渲染的，而右边 420px 被面板盖住，
      // 直接对准酒窖中心的话，中心正好藏在面板底下。
      // 把相机和目标一起往右挪半个面板宽，画面里的酒窖就整体左移到露出来的那半屏中间。
      const dist = 16;
      const visH = 2 * dist * Math.tan((this.camera.fov * Math.PI / 180) / 2);
      const shift = visH * this.camera.aspect * (this.panelWidth() / window.innerWidth) / 2;
      this.controls.target.set(p.x + shift, p.y + 1.2, p.z + 0.5);
      this.camera.position.set(p.x + shift, p.y + 9.5, p.z + 13);
      this.controls.minDistance = 3;
      this.controls.update();
      this.inBrewery = true;
    }
    this.brewPick = null; // 正在给几号缸选果，null = 没在选
    this.renderBrewery();
    $('#brew-body').scrollTop = 0; // 每次进门从酿造台看起，别停在上回滚到的地方
  }

  exitBrewery() {
    $('#brew').classList.add('hidden');
    if (!this.inBrewery) return;
    this.inBrewery = false;
    this.brewPick = null;
    if (this._camBackup) {
      this.camera.position.copy(this._camBackup.pos);
      this.controls.target.copy(this._camBackup.target);
      this.controls.minDistance = this._camBackup.minD;
      this.controls.update();
      this._camBackup = null;
    }
  }

  renderBrewery() {
    const g = this.game;
    const body = $('#brew-body');
    const scrolled = body.scrollTop;
    body.innerHTML = '';

    // ① 选果模式：列出背包里所有能酿的果子
    if (this.brewPick !== null) {
      const slot = this.brewPick;
      body.insertAdjacentHTML('beforeend',
        `<div id="brew-top"><b>🍇 ${tp('brew.pickFor', { n: slot + 1 })}</b><small>${tp('brew.pickHint', { min: BREW.time / 60, mult: BREW.mult })}</small></div>`);
      const back = document.createElement('button');
      back.className = 'brew-back';
      back.textContent = `↩︎ ${t('brew.back')}`;
      back.addEventListener('click', () => { this.brewPick = null; this.renderBrewery(); });
      body.appendChild(back);

      const list = g.brewCandidates();
      if (!list.length) {
        body.insertAdjacentHTML('beforeend', `<div class="brew-empty">${t('brew.noFruit')}</div>`);
      } else {
        const grid = document.createElement('div');
        grid.id = 'brew-fruits';
        list.sort((a, b) => keyInfo(b).price - keyInfo(a).price).forEach(key => {
          const info = keyInfo(key);
          const el = document.createElement('button');
          el.className = 'brew-fruit';
          el.innerHTML = `<b>${info.icon}</b><span>${info.label}</span>`
            + `<small>×${g.inventory[key]} · ${info.price}💰 → ${winePrice(info.price, 0)}💰</small>`;
          el.addEventListener('click', () => {
            if (g.startBrew(slot, key)) { this.brewPick = null; this.renderBrewery(); }
          });
          grid.appendChild(el);
        });
        body.appendChild(grid);
      }
      // 只有刚点开选果时才回到顶部。这里每秒都会被定时器重绘，
      // 无条件归零的话，玩家往下翻找便宜果子，两三秒就被弹回顶上。
      body.scrollTop = this._brewPickShown === slot ? scrolled : 0;
      this._brewPickShown = slot;
      return;
    }
    this._brewPickShown = null; // 退出选果模式，下次再进重新从顶部看起

    // ② 三个酿造台
    body.insertAdjacentHTML('beforeend',
      `<div id="brew-top"><b>🍷 ${t('brew.vats')}</b><small>${tp('brew.vatHint', { min: BREW.time / 60, mult: BREW.mult, age: BREW.agePerDay })}</small></div>`);

    g.brewery.forEach((b, k) => {
      const el = document.createElement('div');
      el.className = 'ws-slot';
      if (!b) {
        el.innerHTML = `<div class="icon">🫙</div><div class="info"><b>${tp('brew.vatN', { n: k + 1 })}</b><p>${t('brew.empty')}</p></div>`;
        const btn = document.createElement('button');
        btn.textContent = `🍇 ${t('brew.pick')}`;
        btn.addEventListener('click', () => { this.brewPick = k; this.renderBrewery(); });
        el.appendChild(btn);
      } else {
        const info = keyInfo(b.key);
        const remain = Math.max(0, b.readyAt - g.time);
        if (remain > 0) {
          const pct = Math.round((1 - remain / BREW.time) * 100);
          el.innerHTML = `<div class="icon">${info.icon}</div><div class="info"><b>${info.label}${nameSep()}${t('brew.wineSuffix')}</b>`
            + `<p>${tp('brew.fermenting', { m: Math.ceil(remain / 60) })}</p>`
            + `<div class="ach-bar"><i style="width:${pct}%"></i></div></div>`;
        } else {
          el.innerHTML = `<div class="icon">${info.icon}</div><div class="info"><b>${info.label}${nameSep()}${t('brew.wineSuffix')}</b>`
            + `<p>${tp('brew.done', { p: winePrice(info.price, 0) })}</p></div>`;
          const btn = document.createElement('button');
          btn.textContent = `🍷 ${t('brew.collect')}`;
          btn.addEventListener('click', () => { g.collectBrew(k); this.renderBrewery(); });
          el.appendChild(btn);
        }
      }
      body.appendChild(el);
    });

    // ③ 九格酒柜：实时收益 + 取出
    const usedCellar = g.cellar.filter(Boolean).length;
    const total = g.cellar.reduce((s, c, k) => s + (c ? g.cellarValue(k) : 0), 0);
    body.insertAdjacentHTML('beforeend',
      `<div id="brew-top" class="cellar"><b>🏛️ ${t('brew.cellar')} ${usedCellar} / ${BREW.cellarSlots}</b>`
      + `<small>${tp('brew.cellarHint', { age: BREW.agePerDay })}</small>`
      + (usedCellar ? `<em>${t('brew.totalValue')} ${total}💰</em>` : '') + `</div>`);

    const grid = document.createElement('div');
    grid.id = 'brew-cellar';
    g.cellar.forEach((c, k) => {
      const el = document.createElement('div');
      el.className = 'brew-rack' + (c ? '' : ' empty');
      if (!c) {
        el.innerHTML = `<b>🕳️</b><span>${t('brew.rackEmpty')}</span>`;
      } else {
        const info = keyInfo(c.key);
        const days = g.cellarDays(k), val = g.cellarValue(k);
        el.innerHTML = `<b>🍷</b><span>${info.label}${nameSep()}${t('brew.wineSuffix')}</span>`
          + `<small>${tp('brew.aged', { d: days })}</small><em>${val}💰</em>`;
        const btn = document.createElement('button');
        btn.textContent = `📤 ${t('brew.take')}`;
        btn.addEventListener('click', () => { g.takeWine(k); this.renderBrewery(); });
        el.appendChild(btn);
      }
      grid.appendChild(el);
    });
    body.appendChild(grid);
    body.scrollTop = scrolled;
  }

  /* ---------- 仓库 ---------- */

  openWarehouse() {
    this.closePanels();
    this.wareTab = this.wareTab ?? 'store';
    $('#ware').classList.remove('hidden');
    this.renderWarehouse();
  }

  renderWarehouse() {
    const g = this.game;
    const body = $('#ware-body');
    const scrolled = body.scrollTop;
    body.innerHTML = '';
    const used = g.warehouseUsed(), max = g.warehouseMax();
    const pct = Math.min(100, Math.round((used / max) * 100));
    const full = g.warehouseLevel >= WAREHOUSE.maxLevel;

    // 顶部：容量条 + 升级
    body.insertAdjacentHTML('beforeend', `
      <div id="ware-top">
        <b>📦 Lv.${g.warehouseLevel} · ${used} / ${max}</b>
        <small>${t('ware.hint')}</small>
        <div class="ach-bar"><i style="width:${pct}%"></i></div>
      </div>`);
    const up = document.createElement('button');
    up.id = 'ware-up';
    up.disabled = full;
    up.textContent = full
      ? `✅ ${t('ware.maxed')}`
      : `⬆️ ${t('ware.upgrade')} Lv.${g.warehouseLevel + 1}（+${WAREHOUSE.capPerLevel}）· ${WAREHOUSE.upCost}💰`;
    up.addEventListener('click', () => { g.upgradeWarehouse(); this.renderWarehouse(); });
    body.appendChild(up);

    // 两个页签：存进去 / 取出来
    const tabs = document.createElement('div');
    tabs.id = 'ware-tabs';
    [['store', `📥 ${t('ware.store')}`], ['take', `📤 ${t('ware.take')}（${Object.keys(g.warehouse).length}）`]]
      .forEach(([id, label]) => {
        const b = document.createElement('button');
        b.className = 'shop-tab' + (this.wareTab === id ? ' active' : '');
        b.textContent = label;
        b.addEventListener('click', () => { this.wareTab = id; this.renderWarehouse(); });
        tabs.appendChild(b);
      });
    body.appendChild(tabs);

    const isStore = this.wareTab === 'store';
    const src = isStore ? g.inventory : g.warehouse;
    const list = Object.entries(src).filter(([, n]) => n > 0)
      .sort(([a], [b]) => keyInfo(b).price * src[b] - keyInfo(a).price * src[a]);
    if (!list.length) {
      body.insertAdjacentHTML('beforeend',
        `<div class="bag-empty">${t(isStore ? 'ware.emptyBag' : 'ware.emptyWare')}</div>`);
      body.scrollTop = scrolled;
      return;
    }
    list.forEach(([key, n]) => {
      const info = keyInfo(key);
      const el = document.createElement('div');
      el.className = 'bag-item' + (info.quality ? ` quality-${info.quality}` : '');
      el.innerHTML = `<div class="icon">${info.icon}</div>
        <div class="info"><b>${info.label} ×${n}</b>
          <p>${t('ware.unit')} ${info.price}💰</p></div>`;
      const one = document.createElement('button');
      one.textContent = isStore ? t('ware.in1') : t('ware.out1');
      one.addEventListener('click', () => {
        isStore ? g.storeToWarehouse(key, 1) : g.takeFromWarehouse(key, 1);
        this.renderWarehouse();
      });
      const all = document.createElement('button');
      all.className = 'sell-all';
      all.textContent = isStore ? t('ware.inAll') : t('ware.outAll');
      all.addEventListener('click', () => {
        isStore ? g.storeToWarehouse(key, n) : g.takeFromWarehouse(key, n);
        this.renderWarehouse();
      });
      el.append(one, all);
      body.appendChild(el);
    });
    body.scrollTop = scrolled;
  }

  /* ---------- 天气观测台 ---------- */

  openObservatory() {
    this.closePanels();
    $('#obs').classList.remove('hidden');
    this.renderObservatory();
    // 观测中要走倒计时，开着就跟着刷
    if (!this._obsTimer) this._obsTimer = setInterval(() => {
      if ($('#obs').classList.contains('hidden')) {
        clearInterval(this._obsTimer); this._obsTimer = null; return;
      }
      this.renderObservatory();
    }, 500);
  }

  renderObservatory() {
    const g = this.game;
    const body = $('#obs-body');
    const scrolled = body.scrollTop;
    body.innerHTML = '';
    const state = g.observatoryState();

    // 顶部：说明 / 倒计时 / 取报告
    if (state === 'idle' || state === 'report') {
      const expired = g.forecastExpired();
      body.insertAdjacentHTML('beforeend', `
        <div id="obs-panel">
          <b>🔭 ${t('obs.title')}</b>
          <small>${t('obs.desc').replace('{days}', OBSERVATORY.days)
            .replace('{cost}', OBSERVATORY.cost).replace('{min}', OBSERVATORY.time / 60)}</small>
        </div>`);
      const btn = document.createElement('button');
      btn.id = 'obs-start';
      btn.textContent = `🔭 ${t(expired || state === 'idle' ? 'obs.start' : 'obs.restart')} · ${OBSERVATORY.cost}💰`;
      btn.addEventListener('click', () => { g.startObservatory(); this.renderObservatory(); });
      body.appendChild(btn);
    } else if (state === 'running') {
      const left = Math.max(0, g.observatory.readyAt - g.time);
      const pct = Math.round((1 - left / OBSERVATORY.time) * 100);
      body.insertAdjacentHTML('beforeend', `
        <div id="obs-panel" class="running">
          <b>🔭 ${t('obs.running')}</b>
          <small>${t('obs.left')} ${fmtTime(left)}</small>
          <div class="ach-bar"><i style="width:${pct}%"></i></div>
        </div>`);
    } else if (state === 'done') {
      body.insertAdjacentHTML('beforeend',
        `<div id="obs-panel" class="ready"><b>✅ ${t('obs.ready')}</b></div>`);
      const btn = document.createElement('button');
      btn.id = 'obs-start';
      btn.textContent = `📋 ${t('obs.collect')}`;
      btn.addEventListener('click', () => { g.collectForecast(); this.renderObservatory(); });
      body.appendChild(btn);
    }

    // 气象导弹：只在今天是坏天气时露面。天气好的时候摆个用不了的按钮在这儿
    // 只会让人以为坏了，不如干脆不显示
    if (g.badWeather()) {
      const fired = !g.canFireMissile();
      const poor = g.coins < WEATHER_MISSILE.cost;
      body.insertAdjacentHTML('beforeend',
        `<div id="obs-missile-note">${tp('obs.missileDesc', { cost: WEATHER_MISSILE.cost.toLocaleString() })}</div>`);
      const mb = document.createElement('button');
      mb.id = 'obs-missile';
      mb.disabled = fired || poor;
      mb.textContent = fired
        ? `🚀 ${t('obs.missileDone')}`
        : `🚀 ${t('obs.missile')} · ${WEATHER_MISSILE.cost.toLocaleString()}💰`;
      mb.addEventListener('click', () => { g.fireMissile(); this.renderObservatory(); });
      body.appendChild(mb);
    }

    // 20 个格子一直摆在这儿：没观测时是空的，观测完才填上天气。
    // 一进来就看得见「会得到什么」，比只放一个按钮清楚得多。
    const list = g.forecastList();
    if (list.length && g.forecastExpired()) {
      body.insertAdjacentHTML('beforeend', `<div class="obs-expired">⏳ ${t('obs.expired')}</div>`);
    }
    const grid = document.createElement('div');
    grid.id = 'obs-grid';
    for (let i = 0; i < OBSERVATORY.days; i++) {
      const item = list[i];
      const el = document.createElement('div');
      if (!item) { // 还没有报告：空格子占位
        el.className = 'obs-day empty' + (state === 'running' ? ' waiting' : '');
        el.innerHTML = `<div class="d">${i === 0 ? t('obs.today') : `+${i}`}</div>
          <div class="w">${state === 'running' ? '🔄' : '❔'}</div>
          <div class="n">—</div>`;
      } else {
        const w = WEATHER_INFO[item.weather];
        el.className = `obs-day ${w.tone}`
          + (item.offset < 0 ? ' past' : '') + (item.offset === 0 ? ' today' : '');
        el.innerHTML = `<div class="d">${item.offset === 0 ? t('obs.today')
          : (item.offset > 0 ? `+${item.offset}` : item.offset)}</div>
          <div class="w">${w.icon}</div>
          <div class="n">${t('weather.' + item.weather)}</div>`;
        el.title = t('weatherDesc.' + item.weather);
      }
      grid.appendChild(el);
    }
    body.appendChild(grid);
    body.scrollTop = scrolled;
  }

  /* ---------- 黑市 ---------- */

  openBlackMarket() {
    this.closePanels();
    $('#black').classList.remove('hidden');
    this.renderBlackMarket();
    // 行情半天一换，但倒计时要走，天亮/天黑那一刻也要立刻翻牌，所以面板开着就跟着刷
    if (!this._blackTimer) this._blackTimer = setInterval(() => {
      if ($('#black').classList.contains('hidden')) {
        clearInterval(this._blackTimer); this._blackTimer = null; return;
      }
      this.renderBlackMarket();
    }, 700);
  }

  renderBlackMarket() {
    const g = this.game;
    const body = $('#black-body');
    const scrolled = body.scrollTop;
    body.innerHTML = '';
    const mood = g.blackMoodLabel();
    // 行情半天一换：白天一个、夜晚一个，天亮/天黑各翻一次牌
    const night = g.isNight();
    const untilFlip = (night ? DAY_CYCLE : DAY_CYCLE / 2) - g.clock;

    body.insertAdjacentHTML('beforeend', `
      <div id="black-mood" class="${mood.tone}">
        ${mood.label}
        <small><b>${night ? '🌙 夜晚行情' : '☀️ 白天行情'}</b>：半天一换，${night ? '天亮' : '天黑'}后换新的（还剩 ${fmtTime(untilFlip)}）。<br>
        成交价在原价的 <b>50%~150%</b> 之间浮动，卖了才知道。风声只是参考——真谈崩了照样腰斩。</small>
      </div>`);

    const list = Object.entries(g.inventory).filter(([, n]) => n > 0)
      .sort(([a], [b]) => keyInfo(b).price * g.inventory[b] - keyInfo(a).price * g.inventory[a]);
    if (!list.length) {
      body.insertAdjacentHTML('beforeend',
        '<div class="bag-empty">背包里没东西可出手<br>先去地里收点货 🌱</div>');
      return;
    }
    list.forEach(([key, n]) => {
      const info = keyInfo(key);
      const base = info.price * n;
      const el = document.createElement('div');
      el.className = 'black-row';
      el.innerHTML = `<div class="icon">${info.icon}</div>
        <div class="info"><b>${info.label} ×${n}</b>
          <p>正常卖 ${base}💰 · 黑市 ${Math.floor(base * 0.5)}~${Math.floor(base * 1.5)}💰</p></div>`;
      const btn = document.createElement('button');
      btn.textContent = '出手';
      btn.addEventListener('click', () => {
        g.sellToBlackMarket(key);
        this.renderBlackMarket();
      });
      el.appendChild(btn);
      body.appendChild(el);
    });
    body.scrollTop = scrolled; // 定时重绘别把滚动位置弹回顶部
  }

  /* ---------- 水族馆 ---------- */

  openAquarium() {
    this.closePanels();
    if (!this.inAquarium && this.camera) {
      this._camBackup = {
        pos: this.camera.position.clone(),
        target: this.controls.target.clone(),
        minD: this.controls.minDistance,
      };
      const p = AQUARIUM_POS;
      this.controls.target.set(p.x, p.y + 1, p.z + 1);
      this.camera.position.set(p.x + 5, p.y + 6, p.z + 11);
      this.controls.minDistance = 3;
      this.controls.update();
      this.inAquarium = true;
    }
    this.aquaPicking = false;
    $('#aqua').classList.remove('hidden');
    this.renderAquarium();
  }

  exitAquarium() {
    $('#aqua').classList.add('hidden');
    if (!this.inAquarium) return;
    this.inAquarium = false;
    if (this._camBackup) {
      this.camera.position.copy(this._camBackup.pos);
      this.controls.target.copy(this._camBackup.target);
      this.controls.minDistance = this._camBackup.minD;
      this.controls.update();
      this._camBackup = null;
    }
  }

  renderAquarium() {
    const g = this.game;
    const body = $('#aqua-body');
    body.innerHTML = '';
    const used = g.aquariumCount();

    body.insertAdjacentHTML('beforeend',
      `<div id="aqua-progress">🐠 ${used} / ${AQUARIUM_SLOTS}
        <small>${t('aqua.hint')}</small></div>`);

    // 挑一样放进去
    if (this.aquaPicking) {
      const back = document.createElement('button');
      back.className = 'sorter-pick';
      back.innerHTML = `<span class="icon">↩️</span><span class="info"><b>${t('aqua.backToTanks')}</b></span>`;
      back.addEventListener('click', () => { this.aquaPicking = false; this.renderAquarium(); });
      body.appendChild(back);

      const list = g.aquariumCandidates().sort((a, b) => keyInfo(b).price - keyInfo(a).price);
      if (!list.length) {
        body.insertAdjacentHTML('beforeend',
          `<div class="bag-empty">${t('aqua.noSeafood')}</div>`);
        return;
      }
      list.forEach(key => {
        const info = keyInfo(key);
        const isEgg = key === EGG.key;
        const btn = document.createElement('button');
        btn.className = 'sorter-pick';
        btn.innerHTML = `
          <span class="icon">${info.icon}</span>
          <span class="info">
            <b>${info.label} ×${g.inventory[key]}</b>
            <small>${isEgg ? t('aqua.willHatch') : tp('aqua.worth', { n: info.price })}</small>
          </span>`;
        btn.addEventListener('click', () => {
          if (g.addToAquarium(key)) this.renderAquarium();
        });
        body.appendChild(btn);
      });
      return;
    }

    if (used < AQUARIUM_SLOTS) {
      const add = document.createElement('button');
      add.id = 'aqua-add';
      add.textContent = t('aqua.add');
      add.addEventListener('click', () => { this.aquaPicking = true; this.renderAquarium(); });
      body.appendChild(add);
    }

    g.aquarium.forEach((id, k) => {
      const el = document.createElement('div');
      el.className = 'aqua-tank' + (id ? '' : ' empty');
      if (id) {
        const sf = seafoodById(id);
        el.innerHTML = `<div class="icon">${sf.emoji}</div>
          <div class="info"><b>${tp('aqua.tankOf', { n: k + 1, name: seafoodName(sf) })}</b><p>${tp('aqua.worth', { n: sf.sell })}</p></div>`;
        const btn = document.createElement('button');
        btn.textContent = t('aqua.takeBack');
        btn.addEventListener('click', () => { g.takeFromAquarium(k); this.renderAquarium(); });
        el.appendChild(btn);
      } else {
        el.innerHTML = `<div class="icon">🫧</div>
          <div class="info"><b>${tp('aqua.tankN', { n: k + 1 })}</b><p>${t('fish.slotEmpty')}</p></div>`;
      }
      body.appendChild(el);
    });
  }

  /* ---------- 分拣台 ---------- */

  openSorter() {
    this.closePanels();
    $('#sorter').classList.remove('hidden');
    this.sorterPicking = null; // 正在给哪个位子挑作物
    this.renderSorter();
  }

  renderSorter() {
    const g = this.game;
    const body = $('#sorter-body');
    body.innerHTML = '';

    body.insertAdjacentHTML('beforeend', `
      <div id="sorter-note">
        把<b>白银 / 黄金</b>品质的作物丢进来，${SORTER_TIME / 60} 分钟后拆成
        <b>普通作物</b> + <b>金属条</b>。<br>
        金属条只算品质那部分的增值，再放大 ${METAL.silver.bars * 10} 倍：
        银条 = 原价 ×10，金条 = 原价 ×20。
      </div>`);

    // 正在挑作物：列出背包里所有带品质的作物
    if (this.sorterPicking !== null) {
      const slot = this.sorterPicking;
      const back = document.createElement('button');
      back.className = 'sorter-pick';
      back.innerHTML = '<span class="icon">↩️</span><span class="info"><b>返回分拣位</b></span>';
      back.addEventListener('click', () => { this.sorterPicking = null; this.renderSorter(); });
      body.appendChild(back);

      const list = Object.entries(g.inventory)
        .filter(([k, n]) => n > 0 && g.sortableKey(k))
        .sort(([a], [b]) => keyInfo(b).price - keyInfo(a).price);
      if (!list.length) {
        body.insertAdjacentHTML('beforeend',
          '<div class="bag-empty">背包里没有白银或黄金作物<br>种地时有几率开出稀有品质 🥈🥇</div>');
        return;
      }
      list.forEach(([key, n]) => {
        const { id, quality } = g.sortableKey(key);
        const info = keyInfo(key);
        const barPrice = metalPrice(id, quality);
        const plainPrice = keyInfo(id).price;
        const btn = document.createElement('button');
        btn.className = 'sorter-pick';
        btn.innerHTML = `
          <span class="icon">${info.icon}</span>
          <span class="info">
            <b>${info.label} ×${n}</b>
            <small>直接卖 ${info.price}💰 → 拆开共 ${plainPrice + barPrice}💰</small>
          </span>
          <span class="gain">+${plainPrice + barPrice - info.price}💰</span>`;
        btn.addEventListener('click', () => {
          if (g.sortStart(slot, key)) { this.sorterPicking = null; this.renderSorter(); }
        });
        body.appendChild(btn);
      });
      return;
    }

    // 两个分拣位
    g.sorter.forEach((s, k) => {
      const el = document.createElement('div');
      const ready = s && g.time >= s.readyAt;
      el.className = 'sorter-slot' + (ready ? ' ready' : s ? ' busy' : '');
      if (!s) {
        el.innerHTML = `<div class="head"><span class="icon">⚙️</span><b>${k + 1} 号分拣位 · 空闲</b></div>`;
        const btn = document.createElement('button');
        btn.textContent = '放入作物';
        btn.addEventListener('click', () => { this.sorterPicking = k; this.renderSorter(); });
        el.querySelector('.head').appendChild(btn);
      } else {
        const info = keyInfo(s.key);
        const { id, quality } = g.sortableKey(s.key);
        const m = METAL[quality];
        const left = Math.max(0, s.readyAt - g.time);
        el.innerHTML = `
          <div class="head">
            <span class="icon">${info.icon}</span>
            <b>${info.label}<br><small>${ready ? '✅ 分拣完成' : `⏳ 还要 ${fmtTime(left)}`}</small></b>
          </div>
          <div class="out">产出：${keyInfo(id).icon}${seedById(id).name}
            ＋ <span class="bar">${m.emoji}${seedById(id).name}${m.name}（${metalPrice(id, quality)}💰）</span>
          </div>`;
        const btn = document.createElement('button');
        btn.textContent = ready ? '取出' : '分拣中';
        btn.disabled = !ready;
        btn.addEventListener('click', () => { g.sortCollect(k); this.renderSorter(); });
        el.querySelector('.head').appendChild(btn);
      }
      body.appendChild(el);
    });
  }

  /* ---------- 成就殿堂 ---------- */

  openAchievement() {
    this.closePanels();
    if (!this.inAchievement && this.camera) {
      this._camBackup = {
        pos: this.camera.position.clone(),
        target: this.controls.target.clone(),
        minD: this.controls.minDistance,
      };
      const p = ACHIEVEMENT_POS;
      this.controls.target.set(p.x, p.y + 0.8, p.z);
      this.camera.position.set(p.x + 9, p.y + 11, p.z + 15);
      this.controls.minDistance = 3;
      this.controls.update();
      this.inAchievement = true;
    }
    $('#ach').classList.remove('hidden');
    this.renderAchievement();
  }

  exitAchievement() {
    $('#ach').classList.add('hidden');
    if (!this.inAchievement) return;
    this.inAchievement = false;
    if (this._camBackup) {
      this.camera.position.copy(this._camBackup.pos);
      this.controls.target.copy(this._camBackup.target);
      this.controls.minDistance = this._camBackup.minD;
      this.controls.update();
      this._camBackup = null;
    }
  }

  renderAchievement() {
    const g = this.game;
    const body = $('#ach-body');
    const tabsBox = $('#ach-tabs');
    body.innerHTML = '';
    tabsBox.innerHTML = '';

    const done = g.achievementCount();
    const total = ACHIEVEMENTS.length;

    // 三个页签：全部 / 已达成 / 还没拿
    [['all', `全部 ${total}`], ['done', `✅ 已达成 ${done}`], ['todo', `🔒 还没拿 ${total - done}`]]
      .forEach(([id, label]) => {
        const tab = document.createElement('button');
        tab.className = 'shop-tab' + (this.achTab === id ? ' active' : '');
        tab.textContent = label;
        tab.addEventListener('click', () => { this.achTab = id; this.renderAchievement(); });
        tabsBox.appendChild(tab);
      });

    // 顶部总进度条
    const pct = Math.round((done / total) * 100);
    body.insertAdjacentHTML('beforeend', `
      <div id="ach-progress">
        🏅 ${done} / ${total}
        <small>成就殿堂完成度 ${pct}%</small>
        <div class="ach-bar"><i style="width:${pct}%"></i></div>
      </div>`);

    const list = ACHIEVEMENTS.filter(a => {
      if (this.achTab === 'done') return g.achievements[a.id];
      if (this.achTab === 'todo') return !g.achievements[a.id];
      return true;
    });

    if (!list.length) {
      body.insertAdjacentHTML('beforeend',
        `<div class="bag-empty">${this.achTab === 'done'
          ? '还没有拿到任何成就<br>先去种块地吧 🌱'
          : `全部 ${ACHIEVEMENTS.length} 个成就都拿到了！<br>你就是园艺大师 🌟`}</div>`);
      return;
    }

    // 按分组归拢，每组一个小标题
    let lastGroup = null;
    list.forEach(a => {
      if (a.group !== lastGroup) {
        lastGroup = a.group;
        body.insertAdjacentHTML('beforeend', `<div class="ach-group">${a.group}</div>`);
      }
      const p = g.achievementProgress(a);
      const tier = ACHIEVEMENT_TIERS[a.tier];
      const pctA = Math.min(100, Math.round((p.cur / p.max) * 100));
      const el = document.createElement('div');
      el.className = 'ach-card' + (p.done ? ' done' : '');
      el.style.setProperty('--tier', tier.color);
      el.innerHTML = `
        <div class="ach-icon">${p.done ? a.emoji : '🔒'}</div>
        <div class="ach-info">
          <b>${tf(`ach.${a.id}.name`, a.name)}<span class="ach-tier">${tier.name}</span></b>
          <div class="ach-desc">${tf(`ach.${a.id}.desc`, a.desc)}</div>
          ${p.done
            ? '<div class="ach-got">✅ 已达成</div>'
            : `<div class="ach-hint">💡 ${a.hint}</div>
               <div class="ach-bar small"><i style="width:${pctA}%"></i></div>
               <div class="ach-num">${this.fmtNum(p.cur)} / ${this.fmtNum(p.max)}</div>`}
        </div>`;
      body.appendChild(el);
    });
  }

  // 大数字加千分位，10000 这种看着累
  fmtNum(n) { return n >= 10000 ? n.toLocaleString('en-US') : String(n); }

  // 达成瞬间的横幅：不受「关闭提示」影响，成就是大事
  achievementBanner(a) {
    const wrap = $('#ach-banner-wrap');
    if (!wrap) return;
    const tier = ACHIEVEMENT_TIERS[a.tier];
    const el = document.createElement('div');
    el.className = 'ach-banner';
    el.style.setProperty('--tier', tier.color);
    el.innerHTML = `
      <div class="ach-banner-icon">${a.emoji}</div>
      <div>
        <div class="ach-banner-top">${tp('ach.banner', { tier: tier.name })}</div>
        <div class="ach-banner-name">${tf(`ach.${a.id}.name`, a.name)}</div>
        <div class="ach-banner-desc">${tf(`ach.${a.id}.desc`, a.desc)}</div>
      </div>`;
    // 点横幅直接进成就殿堂看看
    el.addEventListener('click', () => { el.remove(); this.openAchievement(); });
    wrap.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 4200);
    while (wrap.children.length > 3) wrap.firstChild.remove();
    music.achievementJingle?.();
  }

  /* ---------- 图鉴大楼 ---------- */

  openCodex() {
    this.closePanels();
    if (!this.inCodex && this.camera) {
      this._camBackup = {
        pos: this.camera.position.clone(),
        target: this.controls.target.clone(),
        minD: this.controls.minDistance,
      };
      const p = TREASURY_POS;
      this.controls.target.set(p.x, p.y + 0.8, p.z);
      this.camera.position.set(p.x + 13, p.y + 14, p.z + 20);
      this.controls.minDistance = 3;
      this.controls.update();
      this.inCodex = true;
    }
    $('#codex').classList.remove('hidden');
    this.renderCodex();
  }

  exitCodex() {
    $('#codex').classList.add('hidden');
    if (!this.inCodex) return;
    this.inCodex = false;
    if (this._camBackup) {
      this.camera.position.copy(this._camBackup.pos);
      this.controls.target.copy(this._camBackup.target);
      this.controls.minDistance = this._camBackup.minD;
      this.controls.update();
      this._camBackup = null;
    }
  }

  renderCodex() {
    const body = $('#codex-body');
    const g = this.game;
    const scrolled = body.scrollTop;
    body.innerHTML = '';

    // 顶部：总进度 + 繁荣度（这两个数是整馆的，跟当前看哪个厅无关）
    const vs = g.visitorStats();
    const pr = vs.prosperity;
    const pct = Math.round(pr.ratio * 100);
    body.insertAdjacentHTML('beforeend', `
      <div id="codex-progress">🏛️ ${tp('tr.total', { n: g.treasuryCount(), max: TREASURY_TOTAL })}
        <small>${tp('tr.prosperity', {
          pct, ticket: pr.ticketMult.toFixed(2), rate: pr.rateMult.toFixed(2),
        })}</small>
        <div class="ach-bar"><i style="width:${pct}%"></i></div>
      </div>`);

    // 八个页签：七个典藏展厅 + 贵宾区个人展台
    const tabs = document.createElement('div');
    tabs.id = 'codex-tabs';
    const tabDefs = TREASURY_CATS.map(c => {
      const keys = c.keys();
      const got = keys.filter(k => g.treasury[k]).length;
      return [c.id, `${c.emoji}${got}/${keys.length}`];
    });
    // 用数组长度而不是 meshes.js 的 DISPLAY_SLOTS：数值一样，
    // 而 ui.js 至今没有依赖 meshes.js，不值得为一个常量新拉一条
    tabDefs.push(['gallery', `🏆${g.displaySlots.filter(s => s.item).length}/${g.displaySlots.length}`]);
    tabDefs.forEach(([id, label]) => {
      const tab = document.createElement('button');
      tab.className = 'shop-tab' + (this.codexTab === id ? ' active' : '');
      tab.textContent = label;
      tab.addEventListener('click', () => {
        this.codexTab = id;
        this.codexChoosing = null;
        // 3D 展厅跟着页签换，只渲染当前这一类（273 格全摆出来帧率撑不住）
        if (id !== 'gallery') this.game.treasuryCat = id;
        this.renderCodex();
        $('#codex-body').scrollTop = 0;
      });
      tabs.appendChild(tab);
    });
    body.appendChild(tabs);

    if (this.codexTab === 'gallery') this.renderCodexGallery(body);
    else this.renderTreasuryCat(body, this.codexTab);
    body.scrollTop = scrolled; // 定时重绘别把滚动位置弹回顶部
  }

  // 一个典藏展厅：先列背包里能交的，再铺一张全格总览
  renderTreasuryCat(body, catId) {
    const g = this.game;
    const cat = TREASURY_CATS.find(c => c.id === catId) ?? TREASURY_CATS[0];
    const keys = cat.keys();

    // ① 背包里属于这一厅、且还缺的
    const ready = g.treasuryDonatable().filter(({ slot }) => keys.includes(slot));
    if (ready.length) {
      body.insertAdjacentHTML('beforeend',
        `<div class="ach-group">${tp('tr.canDonate', { n: ready.length })}</div>`);
      ready.forEach(({ key, slot }) => {
        const info = keyInfo(key);
        const el = document.createElement('div');
        el.className = 'ws-slot' + (info.quality ? ` quality-${info.quality}` : '');
        el.innerHTML = `<div class="icon">${info.icon}</div>
          <div class="info"><b>${info.label} ×${g.inventory[key]}</b>
          <p>${tp('tr.worth', { p: info.price.toLocaleString() })}</p></div>`;
        const btn = document.createElement('button');
        btn.textContent = `🏛️ ${t('tr.donate')}`;
        btn.addEventListener('click', () => { g.donateTreasury(key); this.renderCodex(); });
        el.appendChild(btn);
        body.appendChild(el);
      });
    } else {
      body.insertAdjacentHTML('beforeend',
        `<div class="bag-empty">${t('tr.nothingToDonate')}</div>`);
    }

    // ② 全格总览：收录的亮着，没收录的留灰格
    body.insertAdjacentHTML('beforeend',
      `<div class="ach-group">${cat.emoji} ${tp('tr.shelf', {
        name: t(`tr.cat.${cat.id}`), got: keys.filter(k => g.treasury[k]).length, max: keys.length,
      })}</div>`);
    const grid = document.createElement('div');
    grid.id = 'tr-grid';
    keys.forEach(slot => {
      const got = !!g.treasury[slot];
      // 必须走 treasurySlotInfo：展位是「切掉尾巴」的短 key，
      // 裸调 keyInfo 的话大菜（g:<id>，真 key 还带成交价）会直接抛
      const info = treasurySlotInfo(slot);
      const cell = document.createElement('div');
      cell.className = 'tr-cell' + (got ? ' got' : '');
      if (info?.quality) cell.className += ` quality-${info.quality}`;
      cell.innerHTML = got
        ? `<b>${info?.icon ?? '❔'}</b><span>${info?.label ?? slot}</span>`
        : `<b>🔒</b><span>${info?.label ?? slot}</span>`;
      cell.title = got ? `${info?.label} · ${info?.price?.toLocaleString()}💰` : t('tr.locked');
      grid.appendChild(cell);
    });
    body.appendChild(grid);
  }

  // 个人图鉴：贵宾区 10 座金台，随摆随收
  renderCodexGallery(body) {
    const g = this.game;
    const used = g.displaySlots.filter(s => s.item).length;
    body.insertAdjacentHTML('beforeend',
      `<div id="codex-progress">🏆 个人珍藏 ${used} / 10</div>`);

    // 正在给某个台子挑作物
    if (this.codexChoosing != null) {
      const k = this.codexChoosing;
      const note = document.createElement('p');
      note.className = 'shop-note';
      note.textContent = `选一个作物摆上 ${k + 1} 号金台：`;
      body.appendChild(note);
      const crops = Object.entries(g.inventory)
        .filter(([key, n]) => n > 0 && !key.startsWith('p:') && !key.startsWith('x:')
          && !key.startsWith('k:') && !key.startsWith('g:') && key !== 'egg');
      if (!crops.length) {
        body.insertAdjacentHTML('beforeend',
          '<div class="bag-empty">背包里没有作物<br>收获一些满意的再来吧 🌱</div>');
      }
      crops.forEach(([key, n]) => {
        const info = keyInfo(key);
        const el = document.createElement('div');
        el.className = 'ws-slot' + (info.quality ? ` quality-${info.quality}` : '');
        el.innerHTML = `<div class="icon">${info.icon}</div>
          <div class="info"><b>${info.label} ×${n}</b><p>价值 ${info.price}💰</p></div>`;
        const btn = document.createElement('button');
        btn.textContent = '摆上';
        btn.addEventListener('click', () => {
          g.placeDisplay(k, key);
          this.codexChoosing = null;
          this.renderCodex();
        });
        el.appendChild(btn);
        body.appendChild(el);
      });
      const back = document.createElement('button');
      back.textContent = t('ui.back');
      back.style.cssText = 'width:100%;padding:9px;border-radius:12px;border:2px solid #d9b071;background:#fff8ec;color:#8a5a2b;font-weight:700;cursor:pointer;';
      back.addEventListener('click', () => { this.codexChoosing = null; this.renderCodex(); });
      body.appendChild(back);
      return;
    }

    g.displaySlots.forEach((s, k) => {
      const el = document.createElement('div');
      el.className = 'ws-slot';
      if (s.item) {
        const info = keyInfo(s.item.key);
        el.className += info.quality ? ` quality-${info.quality}` : '';
        el.innerHTML = `<div class="icon">${info.icon}</div>
          <div class="info"><b>${k + 1} 号金台 · ${info.label}</b><p>价值 ${info.price}💰</p></div>`;
        const btn = document.createElement('button');
        btn.className = 'collect';
        btn.textContent = '收回';
        btn.addEventListener('click', () => { g.takeDisplay(k); this.renderCodex(); });
        el.appendChild(btn);
      } else {
        el.innerHTML = `<div class="icon">🏆</div>
          <div class="info"><b>${k + 1} 号金台</b><p>空着</p></div>`;
        const btn = document.createElement('button');
        btn.textContent = t('ui.place');
        btn.addEventListener('click', () => { this.codexChoosing = k; this.renderCodex(); });
        el.appendChild(btn);
      }
      body.appendChild(el);
    });
  }

  /* ---------- 高级料理工坊 ---------- */

  openGourmet() {
    this.closePanels();
    $('#gourmet').classList.remove('hidden');
    this.renderGourmet();
  }

  renderGourmet() {
    const body = $('#gourmet-body');
    const g = this.game;
    body.innerHTML = '';
    const cookable = ADV_DISHES.filter(d => g.canAdvCook(d.id)).length;
    body.insertAdjacentHTML('beforeend',
      `<div id="kitchen-progress">👨‍🍳 共 ${ADV_DISHES.length} 道大菜 · 现在能做 ${cookable} 道</div>
       <div id="gourmet-src">每道菜要同时用到 🍖屠宰部位 · 🐟水产 · 🍳料理 · 🧬杂交果 · 🌱作物，后 10 道再加一瓶 🍷酒。<br>
       酒不挑年份，下锅时自动用最便宜的那瓶，陈年好酒给你留着。</div>`);

    // 两口大灶
    g.advCookSlots.forEach((s, k) => {
      const el = document.createElement('div');
      el.className = 'ws-slot';
      if (!s) {
        el.innerHTML = `<div class="icon">🔥</div><div class="info"><b>${k + 1} 号大灶</b><p>空着</p></div>`;
      } else {
        const dish = advDishById(s.id);
        const remain = Math.max(0, s.readyAt - g.time);
        if (remain > 0) {
          const pct = Math.round((1 - remain / ADV_COOK_TIME) * 100);
          el.innerHTML = `<div class="icon">${dish.emoji}</div>
            <div class="info"><b>${dish.name} 烹饪中</b><p>还剩 ${Math.ceil(remain)} 秒</p>
            <div class="bar"><i style="width:${pct}%"></i></div></div>`;
        } else {
          el.classList.add('done');
          el.innerHTML = `<div class="icon">${dish.emoji}</div>
            <div class="info"><b>${dish.name} 出锅啦！</b><p>可卖 ${s.price.toLocaleString()}💰</p></div>`;
          const btn = document.createElement('button');
          btn.className = 'collect';
          btn.textContent = '端走';
          btn.addEventListener('click', () => { g.collectAdvDish(k); this.renderGourmet(); });
          el.appendChild(btn);
        }
      }
      body.appendChild(el);
    });

    const filterBtn = document.createElement('button');
    filterBtn.id = 'kitchen-filter';
    filterBtn.className = this.gourmetReadyOnly ? 'on' : '';
    filterBtn.textContent = this.gourmetReadyOnly ? '✓ 只显示现在能做的' : `🔍 只看现在能做的（${cookable}）`;
    filterBtn.addEventListener('click', () => { this.gourmetReadyOnly = !this.gourmetReadyOnly; this.renderGourmet(); });
    body.appendChild(filterBtn);

    const list = this.gourmetReadyOnly ? ADV_DISHES.filter(d => g.canAdvCook(d.id)) : ADV_DISHES;
    if (!list.length) {
      body.insertAdjacentHTML('beforeend',
        '<div class="bag-empty">一道也凑不齐<br>先看看缺的是哪一路：肉？鱼？菜？果？酒？ 🍳</div>');
      return;
    }
    // 每样原料标出「有几个 / 要几个」，缺哪一路一眼看得出来
    const SRC_ICON = { cut: '🍖', sea: '🐟', dish: '🍳', hyb: '🧬', crop: '🌱', wine: '🍷' };
    list.forEach(dish => {
      const ready = g.canAdvCook(dish.id);
      const el = document.createElement('div');
      el.className = 'dish-row' + (ready ? ' ready' : '');
      const ings = dish.recipe.map(([src, id, n]) => {
        const have = g.advIngHave(src, id);
        // 酒是一类而不是一件，标签直接写「XX酒」，不写具体年份
        const label = src === 'wine'
          ? `${keyInfo(id).label}${t('mod.wine') || '酒'}`
          : keyInfo(advIngKey(src, id)).label;
        return `<span class="ing ${have >= n ? 'ok' : 'no'}">${SRC_ICON[src]}${label} ${have}/${n}</span>`;
      }).join('');
      el.innerHTML = `<div class="icon">${dish.emoji}</div>
        <div class="info"><b>${dish.name}</b> <span class="price">约 ${advDishPrice(dish).toLocaleString()}💰</span>
        <div class="recipe">${ings}</div></div>`;
      const slotFree = g.advCookSlots.some(s => !s);
      const btn = document.createElement('button');
      btn.textContent = slotFree ? '下锅' : '灶满';
      btn.disabled = !ready || !slotFree;
      if (ready && slotFree) btn.addEventListener('click', () => { g.advCook(dish.id); this.renderGourmet(); });
      el.appendChild(btn);
      body.appendChild(el);
    });
  }


  /* ---------- 繁荣塔 ---------- */

  openTower() {
    this.closePanels();
    $('#tower').classList.remove('hidden');
    this.renderTower();
  }

  renderTower() {
    const body = $('#tower-body');
    const g = this.game;
    body.innerHTML = '';
    const lv = g.towerLevel;
    const plan = towerPlan(lv);
    const next = g.towerNextCost();
    const maxed = next === null;

    // 全塔部位的档位跨度：装修是从下往上刷的，所以底层总比顶层好
    const tiers = plan.floors.flatMap(f => f.tiers);
    const lo = tiers.length ? Math.min(...tiers) : 0;
    const hi = tiers.length ? Math.max(...tiers) : 0;
    const tierTxt = tiers.length
      ? (lo === hi ? TOWER_FINISHES[lo].name : `${TOWER_FINISHES[lo].name} → ${TOWER_FINISHES[hi].name}`)
      : '还是个小土堆';

    body.insertAdjacentHTML('beforeend', `
      <div id="tower-hero">
        <div class="lv">🗼 ${lv} <s>/ ${TOWER_MAX_LEVEL}</s></div>
        <div class="bar"><i style="width:${(lv / TOWER_MAX_LEVEL * 100).toFixed(1)}%"></i></div>
      </div>
      <div class="tower-stat"><b>楼层</b><span>${plan.floors.length} / ${TOWER_FLOORS_MAX} 层</span></div>
      <div class="tower-stat"><b>高度</b><span>${plan.height.toFixed(2)} 米</span></div>
      <div class="tower-stat"><b>装修</b><span>${tierTxt}</span></div>
      <div class="tower-stat"><b>装修进度</b><span>${plan.points} / ${plan.maxPoints}</span></div>
      <div class="tower-stat"><b>挂件</b><span>${plan.ornaments} / ${plan.ornamentMax} 件</span></div>
    `);

    if (maxed) {
      body.insertAdjacentHTML('beforeend',
        '<div class="bag-empty">🌌 500 级封顶<br>水晶星穹已经点亮，这座岛没有更高的东西了</div>');
      return;
    }

    const afford = g.towerAffordable();
    body.insertAdjacentHTML('beforeend',
      `<div class="tower-cost">下一级要 <b>${next.toLocaleString()}</b>💰<br>
       <small>你现在的钱最多能连升 <b>${afford}</b> 级</small></div>`);

    const btnRow = document.createElement('div');
    btnRow.className = 'tower-btns';
    const mk = (label, n, cls) => {
      const b = document.createElement('button');
      b.textContent = label;
      if (cls) b.className = cls;
      b.disabled = afford < 1;
      b.addEventListener('click', () => { g.upgradeTower(n); this.renderTower(); });
      btnRow.appendChild(b);
    };
    mk('升 1 级', 1);
    mk('升 10 级', 10);
    mk(`一口气升 ${afford} 级`, afford || 1, 'primary');
    body.appendChild(btnRow);

    // 下一个外观里程碑：让玩家知道再攒多少能看到新东西
    const curF = plan.floors.length;
    let nextMile = null;
    for (let n = lv + 1; n <= TOWER_MAX_LEVEL && !nextMile; n++) {
      const p = towerPlan(n);
      if (p.floors.length > curF) nextMile = { n, txt: `长到第 ${p.floors.length} 层` };
      else if (Math.min(...p.floors.flatMap(f => f.tiers)) > lo) {
        nextMile = { n, txt: `全塔升到「${TOWER_FINISHES[Math.min(...p.floors.flatMap(f => f.tiers))].name}」` };
      }
    }
    if (nextMile) {
      let need = 0;
      for (let k = lv + 1; k <= nextMile.n; k++) need += towerCost(k);
      body.insertAdjacentHTML('beforeend',
        `<div id="tower-mile">下一个看得见的变化：<b>${nextMile.n} 级</b> —— ${nextMile.txt}<br>
         <small>还要 ${need.toLocaleString()}💰</small></div>`);
    }
  }

  /* ---------- 港湾商船 ---------- */

  openHarbor() {
    this.closePanels();
    document.getElementById('harbor').classList.remove('hidden');
    this.renderHarbor();
  }

  renderHarbor() {
    const body = document.getElementById('harbor-body');
    const g = this.game;
    body.innerHTML = '';
    const docked = g.shipDocked();

    if (!docked) {
      const d = g.daysToShip();
      body.insertAdjacentHTML('beforeend',
        `<div id="harbor-wait">⛵<br><b>今天没有船</b>
         <p>还有 <b>${d}</b> 天靠港<br>（每 ${HARBOR.period} 天来一艘，只停一天）</p>
         <small>船开出的价从三折到三倍不等，趁没船先备好货</small></div>`);
      this.renderHarborDecorBar(body);
      return;
    }

    const list = g.harborManifestToday();
    const canSell = list.filter((it, i) => !g.harborSold[i] && g.harborHave(it.src, it.id).n > 0).length;
    body.insertAdjacentHTML('beforeend',
      `<div id="harbor-head-note">⛵ 商船今天靠港，收 ${list.length} 样货<br>
       <small>你手上有 <b>${canSell}</b> 样能出。船天亮就走，卖了不能反悔</small></div>`);

    // 150 行铺开谁也翻不动，默认只显示能出的那些（跟料理工坊「只看现在能做的」一个规矩）
    const filterBtn = document.createElement('button');
    filterBtn.id = 'kitchen-filter';
    filterBtn.className = this.harborAll ? '' : 'on';
    filterBtn.textContent = this.harborAll
      ? `📋 正在看全部 ${list.length} 样 — 点这里只看我能出的`
      : `✓ 只看我能出的（${canSell}）— 点这里看全部 ${list.length} 样`;
    filterBtn.addEventListener('click', () => { this.harborAll = !this.harborAll; this.renderHarbor(); });
    body.appendChild(filterBtn);

    const shown = list.map((it, i) => [it, i]).filter(([it, i]) =>
      this.harborAll || g.harborSold[i] || g.harborHave(it.src, it.id).n > 0);
    if (!shown.length) {
      body.insertAdjacentHTML('beforeend',
        `<div class="bag-empty">这船要的 ${list.length} 样，你手上一样都没有<br>点上面那行可以看看它都收些什么 ⛵</div>`);
      return;
    }
    this.renderHarborDecorBar(body);
    shown.forEach(([it, i]) => {
      const have = g.harborHave(it.src, it.id);
      const sold = !!g.harborSold[i];
      // 酒和高级料理按前缀匹配，没货时拿不到实例，用一个占位 key 取名字
      let info;
      try {
        info = keyInfo(have.keys[0] ?? (harborIsPrefix(it.src)
          ? harborKey(it.src, it.id) + (it.src === 'wine' ? '0' : '1')
          : harborKey(it.src, it.id)));
      } catch { info = { icon: '❓', label: it.id, price: 0 }; }

      const pct = Math.round((it.mult - 1) * 100);
      const tone = it.mult >= 2 ? 'hot' : it.mult >= 1.2 ? 'good' : it.mult >= 0.9 ? 'flat' : 'bad';
      const el = document.createElement('div');
      el.className = 'harbor-row ' + tone + (sold ? ' sold' : have.n > 0 ? ' ready' : '');
      const total = Math.floor(have.value * it.mult);
      el.innerHTML = `<div class="icon">${info.icon}</div>
        <div class="info"><b>${info.label}</b>
          <span class="mult">${pct >= 0 ? '+' : ''}${pct}%</span>
          <p>${sold ? '已成交' : have.n > 0
            ? `手上 ${have.n} 件 → 可得 <b>${total.toLocaleString()}</b>💰`
            : '手上没有'}</p></div>`;
      if (!sold && have.n > 0) {
        const btn = document.createElement('button');
        btn.textContent = '卖';
        btn.addEventListener('click', () => { g.sellToShip(i); this.renderHarbor(); });
        el.appendChild(btn);
      }
      body.appendChild(el);
    });
  }

  // 港湾装饰的摆放区。手上有存货就列出来，点一下摆到水面上；
  // 已摆的可以点「收」拿回来（不退钱，跟家具一个规矩）
  renderHarborDecorBar(body) {
    const g = this.game;
    const spare = HARBOR_DECORS.filter(d => g.harborSpare(d.id) > 0);
    const placed = g.harborPlaced;
    const wrap = document.createElement('div');
    wrap.id = 'hdecor-bar';
    wrap.innerHTML = `<b>🌊 港湾装饰 ${placed.length} / ${HARBOR_MAX_PLACED}</b>`;

    if (placed.length) {
      const row = document.createElement('div');
      row.className = 'hdecor-chips';
      placed.forEach((id, slot) => {
        const d = harborDecorById(id);
        const chip = document.createElement('button');
        chip.className = 'hdecor-chip placed';
        chip.innerHTML = `${harborDecorName(d)}<i>✕</i>`;
        chip.title = '点一下收回来';
        chip.addEventListener('click', () => { g.removeHarborDecor(slot); this.renderHarbor(); });
        row.appendChild(chip);
      });
      wrap.appendChild(row);
    }

    if (spare.length) {
      const row = document.createElement('div');
      row.className = 'hdecor-chips';
      spare.forEach(d => {
        const chip = document.createElement('button');
        chip.className = 'hdecor-chip';
        chip.innerHTML = `${harborDecorName(d)}<i>×${g.harborSpare(d.id)}</i>`;
        chip.title = '点一下摆到水面上';
        chip.disabled = placed.length >= HARBOR_MAX_PLACED;
        chip.addEventListener('click', () => { g.placeHarborDecor(d.id); this.renderHarbor(); });
        row.appendChild(chip);
      });
      wrap.appendChild(row);
    } else if (!placed.length) {
      wrap.insertAdjacentHTML('beforeend',
        '<small>还没有装饰。去商场大楼「港湾」页买，同一样可以买好几件。</small>');
    }
    body.appendChild(wrap);
  }

  /* ---------- 工人培养大楼 ---------- */

  openTrainer() {
    this.closePanels();
    $('#trainer').classList.remove('hidden');
    this.renderTrainer();
  }

  renderTrainer() {
    const body = $('#trainer-body');
    const g = this.game;
    body.innerHTML = '';
    const total = TRAINER_LINES.reduce((a, l) => a + l.slots, 0);
    const done = TRAINER_LINES.reduce((a, l) => a
      + Array.from({ length: l.slots }, (_, i) => g.trainerLevel(l.key, i)).reduce((x, y) => x + y, 0), 0);
    body.insertAdjacentHTML('beforeend',
      `<div id="trainer-note">👷 ${total} 个工位各自单独培养，每级 ${TRAINER.cost}💰，最高 ${TRAINER.maxLevel} 级。<br>
       每升一级：这条线加工更快，出货时每件多给 ${TRAINER.pricePerLevel}💰。<br>
       总进度 <b>${done} / ${total * TRAINER.maxLevel}</b> 级</div>`);

    // 员工：一次性招募，之后自动干活。跟下面那些「工位等级」是两回事，
    // 所以单独一块摆在最上面
    body.insertAdjacentHTML('beforeend', `<div class="ach-group">${t('staff.title')}</div>`);
    TRAINER_STAFF.forEach(def => {
      const hired = !!g.staff[def.id];
      const left = hired ? Math.max(0, def.period - (g.staffTimer[def.id] ?? 0)) : 0;
      const el = document.createElement('div');
      el.className = 'ws-slot' + (hired ? '' : ' locked');
      el.innerHTML = `<div class="icon">${def.emoji}</div>
        <div class="info"><b>${staffName(def)}</b>
        <p>${t('staff.desc.' + def.id)}</p>
        ${hired ? `<p>${tp('staff.next', { s: Math.ceil(left) })}</p>
          <div class="ach-bar"><i style="width:${Math.round((1 - left / def.period) * 100)}%"></i></div>` : ''}</div>`;
      const btn = document.createElement('button');
      if (hired) {
        btn.textContent = `✅ ${t('staff.hired')}`;
        btn.disabled = true;
        btn.className = 'owned';
      } else {
        btn.textContent = `${def.cost.toLocaleString()}💰`;
        btn.addEventListener('click', () => { g.hireStaff(def.id); this.renderTrainer(); });
      }
      el.appendChild(btn);
      body.appendChild(el);
    });

    TRAINER_LINES.forEach(line => {
      const wrap = document.createElement('div');
      wrap.className = 'tr-line';
      wrap.innerHTML = `<b>${line.icon} ${line.name}<small>基础 ${line.base}秒 · 每级 -${line.per}秒</small></b>`;
      for (let i = 0; i < line.slots; i++) {
        const lv = g.trainerLevel(line.key, i);
        const maxed = lv >= TRAINER.maxLevel;
        const el = document.createElement('div');
        el.className = 'tr-slot' + (maxed ? ' maxed' : '');
        el.innerHTML = `<div class="no">${i + 1}号</div>
          <div class="lv">${lv}</div>
          <div class="bar"><i style="width:${lv / TRAINER.maxLevel * 100}%"></i></div>
          <div class="st">${trainerTimeAt(line.key, lv)}秒<br>出货 +${lv * TRAINER.pricePerLevel}💰</div>`;
        if (!maxed) {
          const n = g.trainerAffordable(line.key, i);
          const b1 = document.createElement('button');
          b1.textContent = `+1`;
          b1.disabled = g.coins < TRAINER.cost;
          b1.addEventListener('click', () => { g.upgradeTrainer(line.key, i, 1); this.renderTrainer(); });
          el.appendChild(b1);
          const b10 = document.createElement('button');
          b10.textContent = n >= 10 ? '+10' : `+${n || 1}`;
          b10.disabled = n < 1;
          b10.addEventListener('click', () => { g.upgradeTrainer(line.key, i, n >= 10 ? 10 : n); this.renderTrainer(); });
          el.appendChild(b10);
        } else {
          el.insertAdjacentHTML('beforeend', '<div class="no">满级</div>');
        }
        wrap.appendChild(el);
      }
      body.appendChild(wrap);
    });
  }

  /* ---------- 发展评估 ---------- */

  /* ---------- 每日任务 ---------- */

  // 早上 6 点的强制难度面板。没有关闭按钮，也不接 Esc——
  // 玩家定的规矩：必须选好才能走，期间 game.tick 整个冻结
  renderTaskPick() {
    const g = this.game;
    const wrap = $('#task-pick');
    if (!g.awaitingTaskPick) { wrap.classList.add('hidden'); return; }
    wrap.classList.remove('hidden');

    // 跨天先看日报，确认了才露出难度选择。两张卡共用这一层遮罩，
    // 所以「时间冻结、不能关闭」这些规则一条都不用改
    const report = $('#day-report-card'), card = $('#task-pick-card');
    if (g.dayReport) {
      report.classList.remove('hidden');
      card.classList.add('hidden');
      if (report.dataset.day !== String(g.dayReport.day)) {
        report.dataset.day = String(g.dayReport.day);
        const w = WEATHER_INFO[g.dayReport.weather] ?? WEATHER_INFO.clear;
        const net = g.dayReport.net;
        $('#day-report-day').innerHTML = tp('day.title', { n: g.dayReport.day });
        $('#day-report-weather').innerHTML = `<span class="dr-ico">${w.icon}</span>`
          + tp('day.weather', { w: t('weather.' + g.dayReport.weather), desc: tf('weatherDesc.' + g.dayReport.weather, w.desc) });
        // 第一天（或老存档第一次）没有昨天可比，显示占位而不是假装赚了 0
        $('#day-report-net').innerHTML = net === null
          ? `<span class="dr-net none">${t('day.netNone')}</span>`
          : `<span class="dr-net ${net >= 0 ? 'up' : 'down'}">${net >= 0 ? '+' : ''}${net.toLocaleString()}💰</span>`
            + `<small>${t('day.netNote')}</small>`;
        $('#day-report-ok').textContent = t('day.ok');
      }
      return;   // 日报没确认之前，不画难度按钮
    }
    report.classList.add('hidden');
    card.classList.remove('hidden');

    const box = $('#task-tiers');
    if (box.dataset.day === String(g.dayCount)) return; // 已经画过这一天的，别每帧重建
    box.dataset.day = String(g.dayCount);
    box.innerHTML = '';
    TASK_TIERS.forEach(tier => {
      const b = document.createElement('button');
      b.className = 'task-tier';
      b.innerHTML = `<b>${tier.emoji}</b><span>${t('task.tier.' + tier.id)}</span>`
        + `<small>${tp('task.tierNote', {
          mult: tier.scale, reward: tier.reward.toLocaleString(),
        })}</small>`;
      b.addEventListener('click', () => {
        g.pickTaskTier(tier.id);
        wrap.classList.add('hidden');
        box.dataset.day = '';
      });
      box.appendChild(b);
    });
  }

  openTasks() {
    this.closePanels();
    $('#tasks').classList.remove('hidden');
    this.renderTasks();
  }

  renderTasks() {
    const g = this.game;
    const body = $('#tasks-body');
    const scrolled = body.scrollTop;
    body.innerHTML = '';
    const tier = g.taskTierDef();
    if (!tier) {
      body.innerHTML = `<div class="bag-empty">${t('task.notPicked')}</div>`;
      return;
    }
    const done = g.tasks.filter(q => q.progress >= q.target).length;
    const claimable = g.taskClaimable();
    body.insertAdjacentHTML('beforeend', `
      <div id="task-top">
        <b>${tier.emoji} ${t('task.tier.' + tier.id)} · ${tp('task.doneOf', { n: done, max: g.tasks.length })}</b>
        <small>${tp('task.topNote', { reward: tier.reward.toLocaleString() })}</small>
      </div>`);

    const all = document.createElement('button');
    all.id = 'task-claim-all';
    all.disabled = !claimable;
    all.textContent = claimable
      ? `🎁 ${tp('task.claimAll', { n: claimable, coin: (claimable * tier.reward).toLocaleString() })}`
      : t('task.nothingToClaim');
    all.addEventListener('click', () => { g.claimAllTasks(); this.renderTasks(); });
    body.appendChild(all);

    g.tasks.forEach((q, i) => {
      const type = taskTypeById(q.type);
      const ok = q.progress >= q.target;
      const el = document.createElement('div');
      el.className = 'task-row' + (ok ? ' done' : '') + (q.claimed ? ' claimed' : '');
      el.innerHTML = `<div class="icon">${type.emoji}</div>
        <div class="info"><b>${tp('task.name.' + type.id, { n: q.target.toLocaleString() })}</b>
        <p>${q.progress.toLocaleString()} / ${q.target.toLocaleString()}</p>
        <div class="ach-bar"><i style="width:${Math.round(Math.min(1, q.progress / q.target) * 100)}%"></i></div></div>`;
      const btn = document.createElement('button');
      btn.disabled = !ok || q.claimed;
      btn.textContent = q.claimed ? `✅ ${t('task.claimed')}`
        : ok ? `🎁 ${t('task.claim')}` : t('task.doing');
      if (ok && !q.claimed) btn.addEventListener('click', () => { g.claimTask(i); this.renderTasks(); });
      el.appendChild(btn);
      body.appendChild(el);
    });
    body.scrollTop = scrolled;
  }


  /* ---------- 游客招待厅 ---------- */

  openReception() {
    this.closePanels();
    // 镜头切进厅里（跟宠物间/花房一个套路）
    if (!this.inReception && this.camera) {
      this._camBackup = {
        pos: this.camera.position.clone(),
        target: this.controls.target.clone(),
        minD: this.controls.minDistance,
      };
      const p = RECEPTION_POS;
      // 面板占掉右边一条，所以镜头往右偏半个面板宽，厅才落在露出来的那半屏中间
      const dist = 14;
      const visH = 2 * dist * Math.tan((this.camera.fov * Math.PI / 180) / 2);
      const el = $('#reception');
      const pw = el.getBoundingClientRect().width || Math.min(420, window.innerWidth * 0.5);
      const shift = visH * this.camera.aspect * (pw / window.innerWidth) / 2;
      this.controls.target.set(p.x + shift, p.y + 1, p.z);
      this.camera.position.set(p.x + shift, p.y + 9, p.z + 13);
      this.controls.minDistance = 3;
      this.controls.update();
      this.inReception = true;
    }
    $('#reception').classList.remove('hidden');
    this.renderReception();
    $('#reception-body').scrollTop = 0;
  }

  exitReception() {
    this.recEditMode = false;
    $('#reception').classList.add('hidden');
    if (!this.inReception) return;
    this.inReception = false;
    if (this._camBackup) {
      this.camera.position.copy(this._camBackup.pos);
      this.controls.target.copy(this._camBackup.target);
      this.controls.minDistance = this._camBackup.minD;
      this.controls.update();
      this._camBackup = null;
    }
  }

  renderReception() {
    const g = this.game;
    const body = $('#reception-body');

    // 这个面板在 500ms 定时器里，但它有 110 来个按钮，而且几乎全是静态的
    // （买了什么、升到几级，不会自己变）。无条件整块重建有两个后果：
    // 滚动条被弹回顶上，以及——更要命的——在 mousedown 和 mouseup 之间
    // 把按钮换成新元素，那一下点击就此消失。「布置模式点了没反应」就是这么来的。
    // 酒庄那儿早就踩过同一个坑，注释还在。
    //
    // 所以先算一个签名：只有真的变了才重建。金币直接进签名会因为挂机收益
    // 每秒都在变而失效，所以只记「每件买得起买不起」——这个很少变。
    const sig = [
      g.lobby.length, this.recEditMode ? 1 : 0,
      ...RECEPTION_DECORS.map(d => {
        const lv = g.receptionOwned[d.id] ?? 0;
        const next = lv === 0 ? d.cost : (d.up[lv - 1] ?? Infinity);
        return `${lv}.${g.receptionStyle[d.id] ?? 0}.${g.coins >= next ? 1 : 0}`;
      }),
    ].join('|');
    if (body.dataset.sig === sig) return;
    body.dataset.sig = sig;

    const scrolled = body.scrollTop;
    body.innerHTML = '';
    const owned = RECEPTION_DECORS.filter(d => g.receptionOwned[d.id]).length;
    const rc = g.receptionBonus();
    body.insertAdjacentHTML('beforeend', `
      <div id="pet-progress">🛎️ ${tp('rec.progress', { n: owned, max: RECEPTION_DECORS.length })}
        <small>${tp('rec.bonus', {
          pct: Math.round(rc.ratio * 100),
          ticket: rc.ticketMult.toFixed(2), rate: rc.rateMult.toFixed(2),
          wait: RECEPTION_WAIT, n: g.lobby.length,
        })}</small>
        <div class="ach-bar"><i style="width:${Math.round(rc.ratio * 100)}%"></i></div>
      </div>`);

    // 布置模式：跟小屋一样能在 3D 厅里直接拖装饰
    const editBtn = document.createElement('button');
    // id 不能跟小屋那个重名：两个面板同时在 DOM 里，重复 id 是非法 HTML，
    // 任何 querySelector('#house-edit') 都会拿到文档里靠前的那个（小屋的）
    editBtn.id = 'reception-edit';
    editBtn.className = this.recEditMode ? 'on' : '';
    editBtn.textContent = this.recEditMode ? t('rec.editDone') : t('rec.edit');
    editBtn.addEventListener('click', () => {
      this.recEditMode = !this.recEditMode;
      this.toast(this.recEditMode ? t('rec.editTip') : t('rec.editOver'));
      this.renderReception();
    });
    body.appendChild(editBtn);
    if (this.recEditMode) {
      body.insertAdjacentHTML('beforeend', `<p class="shop-note">${t('rec.editNote')}</p>`);
      const reset = document.createElement('button');
      reset.id = 'reception-reset';
      reset.textContent = t('rec.reset');
      reset.addEventListener('click', () => { g.resetReceptionLayout(); this.renderReception(); });
      body.appendChild(reset);
    }

    RECEPTION_DECORS.forEach(d => {
      const lv = g.receptionOwned[d.id] ?? 0;
      const shown = lv ? Math.min(g.receptionStyle[d.id] ?? lv, lv) : 0;
      const el = document.createElement('div');
      el.className = 'fur-row' + (lv ? '' : ' locked');
      const desc = lv
        ? tp('rec.owned', { lv, max: FURNITURE_MAX_LEVEL, name: receptionLevelName(d, shown) })
        : tp('rec.locked', { name: receptionLevelName(d, 1), cost: d.cost.toLocaleString(), max: FURNITURE_MAX_LEVEL });
      el.innerHTML = `<div class="icon">${d.emoji}</div>
        <div class="info"><b>${receptionDecorName(d)}</b><p>${desc}</p></div>`;
      // 已解锁的外观随便换
      if (lv >= 2) {
        const chips = document.createElement('div');
        chips.className = 'style-chips';
        for (let k = 1; k <= lv; k++) {
          const chip = document.createElement('button');
          chip.textContent = receptionLevelName(d, k);
          chip.className = k === shown ? 'active' : '';
          chip.addEventListener('click', () => { g.setReceptionStyle(d.id, k); this.renderReception(); });
          chips.appendChild(chip);
        }
        el.querySelector('.info').appendChild(chips);
      }
      const btn = document.createElement('button');
      if (!lv) {
        btn.textContent = `${d.cost.toLocaleString()}💰`;
        btn.addEventListener('click', () => { g.buyReceptionDecor(d.id); this.renderReception(); });
      } else if (lv < FURNITURE_MAX_LEVEL) {
        btn.textContent = `⬆️ ${d.up[lv - 1].toLocaleString()}💰`;
        btn.addEventListener('click', () => { g.upgradeReceptionDecor(d.id); this.renderReception(); });
      } else {
        btn.textContent = `✅ ${t('rec.maxed')}`;
        btn.disabled = true;
        btn.className = 'owned';
      }
      el.appendChild(btn);
      body.appendChild(el);
    });
    body.scrollTop = scrolled;
  }

  openReview() {
    this.closePanels();
    $('#review').classList.remove('hidden');
    this.renderReview();
  }

  renderReview() {
    const body = $('#review-body');
    const r = this.game.reviewReport();
    body.innerHTML = '';

    body.insertAdjacentHTML('beforeend', `
      <div id="review-overall">
        <div class="g" style="color:${r.overallGrade.color}">${r.overallGrade.g}</div>
        <div class="w" style="color:${r.overallGrade.color}">${r.overallGrade.word}</div>
        <div class="s">综合 ${r.overall} 分 · 第 ${this.game.dayCount} 天</div>
      </div>`);

    r.rows.forEach(row => {
      body.insertAdjacentHTML('beforeend', `
        <div class="rv-row">
          <div class="ic">${row.icon}</div>
          <div class="nm">${row.name}</div>
          <div class="bar"><i style="width:${row.score}%;background:${row.grade.color}"></i></div>
          <div class="gr" style="color:${row.grade.color}">${row.grade.g}</div>
        </div>`);
    });

    body.insertAdjacentHTML('beforeend', `
      <div class="rv-tip good"><b>👍 你的强项：${r.best.icon} ${r.best.name}（${r.best.grade.g}）</b>${r.goodTip}</div>
      <div class="rv-tip gap"><b>👀 最该补的：${r.worst.icon} ${r.worst.name}（${r.worst.grade.g}）</b>${r.gapTip}</div>
      <div id="review-note">评级只跟这个维度的上限比，不跟别人比。<br>
      建议共 ${REVIEW_TIPS.length} 条，按你当天的强弱项各挑一条，隔天会换。</div>`);
  }

  /* ---------- 宠物间 ---------- */

  openPetRoom() {
    this.closePanels();
    if (!this.inPetRoom && this.camera) {
      this._camBackup = {
        pos: this.camera.position.clone(),
        target: this.controls.target.clone(),
        minD: this.controls.minDistance,
      };
      const p = PET_POS;
      this.controls.target.set(p.x, p.y + 0.7, p.z - 1.2);
      this.camera.position.set(p.x + 4.5, p.y + 4.5, p.z + 6);
      this.controls.minDistance = 2.5;
      this.controls.update();
      this.inPetRoom = true;
    }
    $('#pet').classList.remove('hidden');
    this.renderPetRoom();
  }

  exitPetRoom() {
    $('#pet').classList.add('hidden');
    if (!this.inPetRoom) return;
    this.inPetRoom = false;
    if (this._camBackup) {
      this.camera.position.copy(this._camBackup.pos);
      this.controls.target.copy(this._camBackup.target);
      this.controls.minDistance = this._camBackup.minD;
      this.controls.update();
      this._camBackup = null;
    }
  }

  renderPetRoom() {
    const g = this.game;
    const tabsBar = $('#pet-tabs');
    tabsBar.innerHTML = '';
    [['pets', '宠物'], ['decor', '房间装饰']].forEach(([id, label]) => {
      const tab = document.createElement('button');
      tab.className = 'shop-tab' + ((this.petTab ?? 'pets') === id ? ' active' : '');
      tab.textContent = label;
      tab.addEventListener('click', () => { this.petTab = id; this.renderPetRoom(); });
      tabsBar.appendChild(tab);
    });

    const body = $('#pet-body');
    body.innerHTML = '';
    const tab = this.petTab ?? 'pets';

    if (tab === 'pets') {
      const ownedCount = PETS.filter(p => g.petsOwned[p.id]).length;
      const shown = g.petShown ? petById(g.petShown) : null;
      body.insertAdjacentHTML('beforeend',
        `<div id="pet-progress">🐾 已收养 ${ownedCount} / ${PETS.length}<small style="display:block;font-size:12px;font-weight:400;margin-top:4px">${shown ? `正在展示：${shown.emoji} ${shown.name}` : '还没有宠物上台'}</small></div>`);
      ['common', 'rare', 'epic', 'legend'].forEach(rar => {
        PETS.filter(p => p.rarity === rar).forEach(p => {
          const owned = !!g.petsOwned[p.id];
          const onStage = g.petShown === p.id;
          const el = document.createElement('div');
          el.className = 'ws-slot' + (onStage ? ' done' : '');
          el.innerHTML = `<div class="icon">${p.emoji}</div>
            <div class="info"><b>${p.name}</b><p style="color:${POND_RARITY[rar].color}">${POND_RARITY[rar].name}${owned ? (onStage ? ' · 展示中' : ' · 已收养') : ` · ${p.cost}💰`}</p></div>`;
          const btn = document.createElement('button');
          if (!owned) {
            btn.textContent = `${p.cost}💰`;
            btn.addEventListener('click', () => { g.buyPet(p.id); this.renderPetRoom(); });
          } else if (onStage) {
            btn.textContent = '展示中';
            btn.disabled = true;
            btn.style.cssText = 'border-color:#b8b8b8;background:#f3f3f3;color:#888;cursor:default;';
          } else {
            btn.textContent = '上台';
            btn.addEventListener('click', () => { g.showPet(p.id); this.renderPetRoom(); });
          }
          el.appendChild(btn);
          body.appendChild(el);
        });
      });
      return;
    }

    const ownedD = PET_DECORS.filter(d => g.petDecorsOwned[d.id]).length;
    body.insertAdjacentHTML('beforeend',
      `<div id="pet-progress">🛋 房间装饰 ${ownedD} / ${PET_DECORS.length}</div>`);
    PET_DECORS.forEach(d => {
      const lv = g.petDecorsOwned[d.id] ?? 0;
      const shown = lv ? Math.min(g.petDecorStyle[d.id] ?? lv, lv) : 0;
      const el = document.createElement('div');
      el.className = 'fur-row' + (lv ? '' : ' locked');
      const desc = lv
        ? `已解锁 Lv.${lv}/${FURNITURE_MAX_LEVEL} · 正在展示「${d.levelNames[shown - 1]}」`
        : `${d.levelNames[0]} · ${d.cost}💰（之后可升到 ${FURNITURE_MAX_LEVEL} 级）`;
      el.innerHTML = `<div class="icon">${d.emoji}</div>
        <div class="info"><b>${d.name}</b><p>${desc}</p></div>`;
      // 已解锁的外观随便换
      if (lv >= 2) {
        const chips = document.createElement('div');
        chips.className = 'style-chips';
        for (let k = 1; k <= lv; k++) {
          const chip = document.createElement('button');
          chip.textContent = d.levelNames[k - 1];
          chip.className = k === shown ? 'active' : '';
          chip.addEventListener('click', () => { g.setPetDecorStyle(d.id, k); this.renderPetRoom(); });
          chips.appendChild(chip);
        }
        el.querySelector('.info').appendChild(chips);
      }
      const btn = document.createElement('button');
      if (!lv) {
        btn.textContent = `${d.cost}💰`;
        btn.addEventListener('click', () => { g.buyPetDecor(d.id); this.renderPetRoom(); });
      } else if (lv < FURNITURE_MAX_LEVEL) {
        btn.textContent = `升级 ${d.up[lv - 1]}💰`;
        btn.addEventListener('click', () => { g.upgradePetDecor(d.id); this.renderPetRoom(); });
      } else {
        btn.className = 'maxed';
        btn.textContent = '满级';
      }
      el.appendChild(btn);
      body.appendChild(el);
    });
  }

  /* ---------- 参观客 ---------- */

  openVisitor() {
    this.closePanels();
    $('#visitor').classList.remove('hidden');
    this.renderVisitor();
  }

  renderVisitor() {
    const g = this.game;
    const body = $('#visitor-body');
    const scrolled = body.scrollTop;
    const s = g.visitorStats();
    const pct = (v) => (v / RARITY_MAX * 100);
    const n = (v) => Math.round(v).toLocaleString();

    // 三处各自的贡献，按占比排序好让玩家一眼看出哪儿最亏
    const parts = [
      { k: 'house', icon: '\ud83c\udfe0', v: s.house },
      { k: 'petRoom', icon: '\ud83d\udc3e', v: s.petRoom },
      { k: 'aqua', icon: '\ud83d\udc20', v: s.aqua },
    ];
    const worst = parts.slice().sort((a, b) => a.v - b.v)[0];

    body.innerHTML = `
      <div id="visitor-note">${tp('visitor.note', {
        min: VISITOR.ticketMin, max: VISITOR.ticketMax.toLocaleString(),
        rate: VISITOR.rateMax, cap: VISITOR.offlineCap / 3600,
      })}</div>

      <div class="vis-score">
        <div class="vis-score-top">
          <b>${t('visitor.rarity')}</b>
          <span>${(s.ratio * 100).toFixed(1)}%</span>
        </div>
        <div class="vis-bar"><i style="width:${(s.ratio * 100).toFixed(1)}%"></i></div>
        <small>${n(s.total)} / ${n(RARITY_MAX)}</small>
      </div>

      <div class="vis-stats">
        <div><span>${t('visitor.ticket')}</span><b>${n(s.ticket)}\ud83d\udcb0</b></div>
        <div><span>${t('visitor.rate')}</span><b>${s.rate < 1 ? (s.rate * 100).toFixed(0) + '%' : s.rate.toFixed(1)}</b></div>
        <div><span>${t('visitor.income')}</span><b>${n(s.income)}\ud83d\udcb0</b></div>
        <div><span>${t('visitor.earned')}</span><b>${n(s.earned)}\ud83d\udcb0</b></div>
      </div>

      <div class="gh-title">${t('visitor.sources')}</div>
      ${parts.map(p => `
        <div class="vis-part">
          <div class="vis-part-top"><b>${p.icon} ${t('visitor.' + p.k)}</b><span>${n(p.v)}</span></div>
          <div class="vis-bar sm"><i style="width:${Math.min(100, pct(p.v)).toFixed(1)}%"></i></div>
          <small>${tp('visitor.share', { pct: (s.total ? p.v / s.total * 100 : 0).toFixed(0) })}</small>
        </div>`).join('')}

      <p class="ranch-hint">${tp('visitor.tip', { where: t('visitor.' + worst.k) })}</p>`;
    body.scrollTop = scrolled;
  }

  /* ---------- 屠宰场 ---------- */

  openButcher() {
    this.closePanels();
    this.enterEast(); // 屠宰场就在牧场旁边，共用岛东那段镜头
    $('#butcher').classList.remove('hidden');
    this.butcherPicking = null;
    this.renderButcher();
  }

  exitButcher() {
    $('#butcher').classList.add('hidden');
    this.exitRanch(); // 把镜头搬回农田
  }

  renderButcher() {
    const g = this.game;
    const body = $('#butcher-body');
    const scrolled = body.scrollTop;
    body.innerHTML = '';

    const total = BUTCHER.killTime + BUTCHER.cutTime;
    body.insertAdjacentHTML('beforeend', `<div id="butcher-note">${tp('butcher.note', {
      kill: fmtTime(BUTCHER.killTime), cut: fmtTime(BUTCHER.cutTime), all: fmtTime(total),
      n: CUTS.length, mult: BUTCHER.mult,
      cuts: CUTS.map(c => `${c.emoji}${cutName(c)}`).join('、'),
    })}</div>`);

    // 正在挑动物：列出背包里所有整只动物
    if (this.butcherPicking !== null) {
      const slot = this.butcherPicking;
      const back = document.createElement('button');
      back.className = 'sorter-pick';
      back.innerHTML = `<span class="icon">↩️</span><span class="info"><b>${t('butcher.back')}</b></span>`;
      back.addEventListener('click', () => { this.butcherPicking = null; this.renderButcher(); });
      body.appendChild(back);

      const list = g.butcherable().sort((a, b) => keyInfo(b).price - keyInfo(a).price);
      if (!list.length) {
        body.insertAdjacentHTML('beforeend', `<div class="bag-empty">${t('butcher.noAnimal')}</div>`);
        body.scrollTop = scrolled;
        return;
      }
      list.forEach(key => {
        const aid = key.slice(2);
        const an = animalById(aid);
        const n = g.inventory[key];
        const parts = CUTS.reduce((s, c) => s + cutPrice(aid, c.id), 0);
        const btn = document.createElement('button');
        btn.className = 'sorter-pick';
        btn.innerHTML = `
          <span class="icon">${an.emoji}</span>
          <span class="info">
            <b>${animalName(an)} ×${n}</b>
            <small>${tp('butcher.compare', { whole: an.sell.toLocaleString(), parts: parts.toLocaleString() })}</small>
          </span>
          <span class="gain">+${(parts - an.sell).toLocaleString()}💰</span>`;
        btn.addEventListener('click', () => {
          if (g.startButcher(slot, key)) { this.butcherPicking = null; this.renderButcher(); }
        });
        body.appendChild(btn);
      });
      body.scrollTop = scrolled;
      return;
    }

    // 工位
    g.butcher.forEach((b, k) => {
      const stage = g.butcherStage(k);
      const el = document.createElement('div');
      el.className = 'sorter-slot' + (stage === 'done' ? ' ready' : b ? ' busy' : '');
      if (!b) {
        el.innerHTML = `<div class="head"><span class="icon">🔪</span><b>${tp('butcher.slotIdle', { n: k + 1 })}</b></div>`;
        const btn = document.createElement('button');
        btn.textContent = t('butcher.put');
        btn.addEventListener('click', () => { this.butcherPicking = k; this.renderButcher(); });
        el.appendChild(btn);
      } else {
        const an = animalById(b.key.slice(2));
        const left = Math.max(0, b.readyAt - g.time);
        if (stage === 'done') {
          const aid = b.key.slice(2);
          el.innerHTML = `<div class="head"><span class="icon">${an.emoji}</span><b>${tp('butcher.slotDone', { n: k + 1, name: animalName(an) })}</b></div>
            <div class="butcher-cuts">${CUTS.map(c =>
              `<span>${c.emoji}${cutName(c)} <i>${cutPrice(aid, c.id).toLocaleString()}💰</i></span>`).join('')}</div>`;
          const btn = document.createElement('button');
          btn.textContent = t('butcher.take');
          btn.addEventListener('click', () => { g.collectButcher(k); this.renderButcher(); });
          el.appendChild(btn);
        } else {
          const phase = stage === 'kill' ? t('butcher.phaseKill') : t('butcher.phaseCut');
          el.innerHTML = `<div class="head"><span class="icon">${stage === 'kill' ? '🔪' : '🍖'}</span>
            <b>${tp('butcher.slotBusy', { n: k + 1, name: animalName(an), phase })}</b></div>
            <div class="butcher-left">${fmtTime(left)}</div>`;
        }
      }
      body.appendChild(el);
    });
    body.scrollTop = scrolled;
  }

  /* ---------- 牧场 ---------- */

  // 牧场和屠宰场都在岛东边，离农田很远，进任一个都得把镜头挪过去；退出时还原。
  // 两栋楼挨着，共用同一段镜头，来回搬运动物时才不会一步一跳。
  enterEast() {
    if (this.inRanch || !this.camera) return;
    this._camBackup = {
      pos: this.camera.position.clone(),
      target: this.controls.target.clone(),
      minD: this.controls.minDistance,
    };
    this.controls.target.set(RANCH_POS.x, 0.5, RANCH_POS.z);
    this.camera.position.set(RANCH_POS.x + 9, 11, RANCH_POS.z + 13);
    this.controls.minDistance = 4;
    this.controls.update();
    this.inRanch = true;
  }

  openRanch() {
    this.closePanels();
    this.enterEast();
    $('#ranch').classList.remove('hidden');
    this.renderRanch();
  }

  exitRanch() {
    $('#ranch').classList.add('hidden');
    if (!this.inRanch) return;
    this.inRanch = false;
    if (this._camBackup) {
      this.camera.position.copy(this._camBackup.pos);
      this.controls.target.copy(this._camBackup.target);
      this.controls.minDistance = this._camBackup.minD;
      this.controls.update();
      this._camBackup = null;
    }
  }

  renderRanch() {
    const g = this.game;
    const body = $('#ranch-body');
    const scrolled = body.scrollTop;
    body.innerHTML = '';

    // 挂机收益汇总
    body.insertAdjacentHTML('beforeend',
      `<div class="ranch-idle">${tp('ranch.idleTotal', { n: g.ranchIdleRate().toLocaleString(), g: g.ranchGrownCount() })}</div>
       <p class="ranch-hint">${t('ranch.hint')}</p>`);

    // 选幼崽
    body.insertAdjacentHTML('beforeend', `<div class="gh-title">${t('ranch.pick')}</div>`);
    const pick = document.createElement('div');
    pick.className = 'ranch-pick';
    ANIMALS.forEach(a => {
      const b = document.createElement('button');
      b.className = 'ranch-animal' + (this.selectedAnimal === a.id ? ' active' : '');
      b.disabled = g.coins < a.cost;
      b.innerHTML = `${a.emoji}<span>${animalName(a)}</span><i>${a.cost.toLocaleString()}💰</i>`;
      b.title = tp('ranch.buyLine', { cost: a.cost.toLocaleString(), t: fmtTime(a.grow),
        sell: a.sell.toLocaleString(), idle: a.idle.toLocaleString() });
      b.addEventListener('click', () => { this.selectedAnimal = a.id; this.renderRanch(); });
      pick.appendChild(b);
    });
    body.appendChild(pick);

    // 栏位
    const used = g.ranchPens.filter(Boolean).length;
    body.insertAdjacentHTML('beforeend',
      `<div class="gh-title">${tp('ranch.pens', { n: used, max: g.ranchPens.length })}</div>`);
    const grid = document.createElement('div');
    grid.className = 'ranch-pens';
    g.ranchPens.forEach((p, i) => {
      const cell = document.createElement('div');
      cell.className = 'ranch-pen';
      if (!p) {
        cell.classList.add('empty');
        const sel = this.selectedAnimal ? animalById(this.selectedAnimal) : null;
        cell.innerHTML = `<span class="gh-empty">${t('ranch.empty')}</span>`;
        if (sel) {
          const btn = document.createElement('button');
          btn.innerHTML = tp('ranch.put', { emoji: sel.emoji });
          btn.addEventListener('click', () => { g.buyAnimal(i, sel.id); this.renderRanch(); });
          cell.appendChild(btn);
        }
      } else {
        const an = animalById(p.id);
        const grown = g.time >= p.readyAt;
        if (grown) {
          cell.classList.add('grown');
          cell.innerHTML = `<span>${an.emoji}</span><b>${animalName(an)}</b>`;
          const btn = document.createElement('button');
          btn.textContent = t('ranch.collect');
          btn.addEventListener('click', () => { g.collectAnimal(i); this.renderRanch(); });
          cell.appendChild(btn);
        } else {
          cell.innerHTML = `<span style="opacity:.6">${an.emoji}</span><b>${animalName(an)}</b>`
            + `<i>${fmtTime(p.readyAt - g.time)}</i>`;
        }
      }
      grid.appendChild(cell);
    });
    body.appendChild(grid);
    body.scrollTop = scrolled; // 定时重绘别把滚动位置弹回顶部
  }

  /* ---------- 花房温室 ---------- */

  openGreenhouse() {
    this.closePanels();
    if (!this.inGreenhouse && this.camera) {
      this._camBackup = {
        pos: this.camera.position.clone(),
        target: this.controls.target.clone(),
        minD: this.controls.minDistance,
      };
      const p = GREENHOUSE_POS;
      this.controls.target.set(p.x, p.y + 0.7, p.z - 0.5);
      this.camera.position.set(p.x + 5, p.y + 5, p.z + 7);
      this.controls.minDistance = 2.5;
      this.controls.update();
      this.inGreenhouse = true;
    }
    this.bouquetSel = [];
    $('#greenhouse').classList.remove('hidden');
    this.renderGreenhouse();
  }

  exitGreenhouse() {
    $('#greenhouse').classList.add('hidden');
    if (!this.inGreenhouse) return;
    this.inGreenhouse = false;
    if (this._camBackup) {
      this.camera.position.copy(this._camBackup.pos);
      this.controls.target.copy(this._camBackup.target);
      this.controls.minDistance = this._camBackup.minD;
      this.controls.update();
      this._camBackup = null;
    }
  }

  renderGreenhouse() {
    const g = this.game;
    const body = $('#greenhouse-body');
    body.innerHTML = '';

    // —— 选花种 ——
    const seedTitle = document.createElement('div');
    seedTitle.className = 'gh-title';
    seedTitle.textContent = t('gh.pickSeed');
    body.appendChild(seedTitle);
    const seedBox = document.createElement('div');
    seedBox.className = 'gh-seeds';
    FLOWERS.forEach(f => {
      const b = document.createElement('button');
      b.className = 'gh-seed' + (this.selectedFlower === f.id ? ' active' : '');
      b.style.borderColor = POND_RARITY[f.rarity].color;
      b.innerHTML = `${f.emoji}<span>${flowerName(f)}</span><i>${f.seed}💰</i>`;
      b.addEventListener('click', () => { this.selectedFlower = f.id; this.renderGreenhouse(); });
      seedBox.appendChild(b);
    });
    body.appendChild(seedBox);

    // —— 花圃 ——
    const grown = g.flowerPlots.filter(Boolean).length;
    const plotTitle = document.createElement('div');
    plotTitle.className = 'gh-title';
    plotTitle.textContent = tp('gh.plots', { n: grown, max: g.flowerPlots.length });
    body.appendChild(plotTitle);
    const plotBox = document.createElement('div');
    plotBox.className = 'gh-plots';
    g.flowerPlots.forEach((p, i) => {
      const cell = document.createElement('div');
      cell.className = 'gh-plot';
      if (!p) {
        cell.classList.add('empty');
        const sel = this.selectedFlower ? flowerById(this.selectedFlower) : null;
        cell.innerHTML = `<span class="gh-empty">${t('gh.empty')}</span>`;
        if (sel) {
          const btn = document.createElement('button');
          btn.innerHTML = tp('gh.plant', { emoji: sel.emoji });
          btn.addEventListener('click', () => { g.plantFlower(i, sel.id); this.renderGreenhouse(); });
          cell.appendChild(btn);
        }
      } else {
        const fl = flowerById(p.id);
        if (g.time >= p.readyAt) {
          cell.innerHTML = `<span>${fl.emoji}</span><b>${flowerName(fl)}</b>`;
          const btn = document.createElement('button');
          btn.className = 'gh-harvest';
          btn.textContent = t('gh.harvest');
          btn.addEventListener('click', () => { g.harvestFlower(i); this.renderGreenhouse(); });
          cell.appendChild(btn);
        } else {
          cell.innerHTML = `<span>🌱</span><b>${flowerName(fl)}</b><i>${fmtTime(p.readyAt - g.time)}</i>`;
        }
      }
      plotBox.appendChild(cell);
    });
    body.appendChild(plotBox);

    // —— 扎花台 ——
    this.bouquetSel = this.bouquetSel || [];
    const bqTitle = document.createElement('div');
    bqTitle.className = 'gh-title';
    bqTitle.textContent = tp('gh.bench', { n: BOUQUET_SIZE, mult: BOUQUET_MULT });
    body.appendChild(bqTitle);
    const bag = document.createElement('div');
    bag.className = 'gh-seeds';
    const flowerKeys = Object.keys(g.inventory).filter(k => k.startsWith('f:') && g.inventory[k] > 0);
    if (!flowerKeys.length) {
      bag.innerHTML = `<p class="gh-empty">${t('gh.noFlowers')}</p>`;
    } else {
      flowerKeys.forEach(k => {
        const info = keyInfo(k);
        const avail = g.inventory[k] - this.bouquetSel.filter(x => x === k).length;
        const b = document.createElement('button');
        b.className = 'gh-seed';
        b.innerHTML = `${info.icon}<span>${info.label}</span><i>×${avail} · ${info.price}💰</i>`;
        b.disabled = avail <= 0 || this.bouquetSel.length >= BOUQUET_SIZE;
        b.addEventListener('click', () => { this.bouquetSel.push(k); this.renderGreenhouse(); });
        bag.appendChild(b);
      });
    }
    body.appendChild(bag);
    const basket = document.createElement('div');
    basket.className = 'gh-basket';
    basket.innerHTML = `<b>${t('gh.pending')}</b>`;
    this.bouquetSel.forEach((k, idx) => {
      const chip = document.createElement('button');
      chip.textContent = keyInfo(k).icon;
      chip.title = t('gh.removeTip');
      chip.addEventListener('click', () => { this.bouquetSel.splice(idx, 1); this.renderGreenhouse(); });
      basket.appendChild(chip);
    });
    for (let i = this.bouquetSel.length; i < BOUQUET_SIZE; i++) {
      const empty = document.createElement('span');
      empty.className = 'gh-slot-empty';
      empty.textContent = '➕';
      basket.appendChild(empty);
    }
    body.appendChild(basket);
    if (this.bouquetSel.length === BOUQUET_SIZE) {
      const price = Math.floor(this.bouquetSel.reduce((s, k) => s + keyInfo(k).price, 0) * BOUQUET_MULT);
      const btn = document.createElement('button');
      btn.className = 'gh-bouquet';
      btn.textContent = tp('gh.sellBouquet', { n: price });
      btn.addEventListener('click', () => { g.makeBouquet([...this.bouquetSel]); this.bouquetSel = []; this.renderGreenhouse(); });
      body.appendChild(btn);
    }
  }

  /* ---------- 杂交室 ---------- */

  openHybrid() {
    this.closePanels();
    // 镜头切进实验大厅
    if (!this.inHybridLab && this.camera) {
      this._camBackup = {
        pos: this.camera.position.clone(),
        target: this.controls.target.clone(),
        minD: this.controls.minDistance,
      };
      const p = HYBRID_POS;
      this.controls.target.set(p.x, p.y + 0.8, p.z - 1);
      this.camera.position.set(p.x + 6.5, p.y + 6.5, p.z + 9);
      this.controls.minDistance = 3;
      this.controls.update();
      this.inHybridLab = true;
    }
    $('#hybrid').classList.remove('hidden');
    this.renderHybrid();
  }

  exitHybridLab() {
    $('#hybrid').classList.add('hidden');
    if (!this.inHybridLab) return;
    this.inHybridLab = false;
    if (this._camBackup) {
      this.camera.position.copy(this._camBackup.pos);
      this.controls.target.copy(this._camBackup.target);
      this.controls.minDistance = this._camBackup.minD;
      this.controls.update();
      this._camBackup = null;
    }
  }

  renderHybrid() {
    const body = $('#hybrid-body');
    const g = this.game;
    body.innerHTML = '';
    const canCount = HYBRIDS.filter(h => g.canHybrid(h.id)).length;
    body.insertAdjacentHTML('beforeend',
      `<div id="hybrid-progress">🧬 共 ${HYBRIDS.length} 种杂交作物 · 现在能合成 ${canCount} 种</div>`);

    // 5 个培养罩状态
    g.hybridSlots.forEach((s, k) => {
      const el = document.createElement('div');
      el.className = 'ws-slot';
      if (!s) {
        el.innerHTML = `<div class="icon">🫙</div><div class="info"><b>${k + 1} 号培养罩</b><p>空着</p></div>`;
      } else {
        const h = hybridById(s.id);
        const remain = Math.max(0, s.readyAt - g.time);
        if (remain > 0) {
          const pct = Math.round((1 - remain / HYBRID_TIME) * 100);
          el.innerHTML = `<div class="icon">${h.emoji}</div>
            <div class="info"><b>${h.name} 培养中</b><p>还剩 ${fmtTime(remain)}</p>
            <div class="bar"><i style="width:${pct}%"></i></div></div>`;
        } else {
          el.classList.add('done');
          el.innerHTML = `<div class="icon">${h.emoji}</div>
            <div class="info"><b>${h.name} 培养完成！</b><p>可卖 ${h.sell}💰</p></div>`;
          const btn = document.createElement('button');
          btn.className = 'collect';
          btn.textContent = '取出';
          btn.addEventListener('click', () => { g.collectHybrid(k); this.renderHybrid(); });
          el.appendChild(btn);
        }
      }
      body.appendChild(el);
    });

    const filterBtn = document.createElement('button');
    filterBtn.id = 'kitchen-filter';
    filterBtn.className = this.hybridReadyOnly ? 'on' : '';
    filterBtn.textContent = this.hybridReadyOnly ? '✓ 只显示能合成的' : `🔍 只看现在能合成的（${canCount}）`;
    filterBtn.addEventListener('click', () => { this.hybridReadyOnly = !this.hybridReadyOnly; this.renderHybrid(); });
    body.appendChild(filterBtn);

    const list = this.hybridReadyOnly ? HYBRIDS.filter(h => g.canHybrid(h.id)) : HYBRIDS;
    if (!list.length) {
      body.insertAdjacentHTML('beforeend', '<div class="bag-empty">现在还凑不齐任何配对<br>去攒对应品质的作物吧 🌱</div>');
      return;
    }
    list.forEach(h => {
      const ready = g.canHybrid(h.id);
      const el = document.createElement('div');
      el.className = 'dish-row' + (ready ? ' ready' : '');
      const same = ingredientKey(h.a[0], h.a[1]) === ingredientKey(h.b[0], h.b[1]);
      const need = (pair, count) => {
        const key = ingredientKey(pair[0], pair[1]);
        const have = g.inventory[key] ?? 0;
        const info = keyInfo(key);
        return `<span class="ing ${have >= count ? 'ok' : 'no'}">${info.icon}${info.label} ${have}/${count}</span>`;
      };
      const ings = same ? need(h.a, 2) : need(h.a, 1) + need(h.b, 1);
      el.innerHTML = `<div class="icon">${h.emoji}</div>
        <div class="info"><b>${h.name}</b> <span class="price">卖 ${h.sell}💰</span>
        <div class="recipe">${ings}</div></div>`;
      const slotFree = g.hybridSlots.some(s => !s);
      const btn = document.createElement('button');
      btn.textContent = slotFree ? '培养' : '罩满';
      btn.disabled = !ready || !slotFree;
      if (ready && slotFree) btn.addEventListener('click', () => { g.makeHybrid(h.id); this.renderHybrid(); });
      el.appendChild(btn);
      body.appendChild(el);
    });
  }

  /* ---------- 黑房子银行 ---------- */

  openBank() {
    this.closePanels();
    $('#bank').classList.remove('hidden');
    this.renderBank();
  }

  /* ---------- 料理工坊 ---------- */

  openKitchen() {
    this.closePanels();
    $('#kitchen').classList.remove('hidden');
    this.renderKitchen();
  }

  renderKitchen() {
    const body = $('#kitchen-body');
    const g = this.game;
    body.innerHTML = '';
    const madeCount = DISHES.filter(d => g.inventory['k:' + d.id]).length;
    const cookableCount = DISHES.filter(d => g.canCook(d.id)).length;
    body.insertAdjacentHTML('beforeend',
      `<div id="kitchen-progress">🍳 共 ${DISHES.length} 道料理 · 现在能做 ${cookableCount} 道</div>`);

    // 灶位状态
    g.cookSlots.forEach((s, k) => {
      const el = document.createElement('div');
      el.className = 'ws-slot';
      if (!s) {
        el.innerHTML = `<div class="icon">🍳</div><div class="info"><b>${k + 1} 号灶</b><p>空着</p></div>`;
      } else {
        const dish = dishById(s.id);
        const remain = Math.max(0, s.readyAt - g.time);
        if (remain > 0) {
          const pct = Math.round((1 - remain / COOK_TIME) * 100);
          el.innerHTML = `<div class="icon">${dish.emoji}</div>
            <div class="info"><b>${dish.name} 烹饪中</b><p>还剩 ${Math.ceil(remain)} 秒</p>
            <div class="bar"><i style="width:${pct}%"></i></div></div>`;
        } else {
          el.classList.add('done');
          el.innerHTML = `<div class="icon">${dish.emoji}</div>
            <div class="info"><b>${dish.name} 出锅啦！</b><p>可卖 ${dishPrice(dish)}💰</p></div>`;
          const btn = document.createElement('button');
          btn.className = 'collect';
          btn.textContent = '端走';
          btn.addEventListener('click', () => { g.collectDish(k); this.renderKitchen(); });
          el.appendChild(btn);
        }
      }
      body.appendChild(el);
    });

    // 只看现在能做的
    const filterBtn = document.createElement('button');
    filterBtn.id = 'kitchen-filter';
    filterBtn.className = this.kitchenReadyOnly ? 'on' : '';
    filterBtn.textContent = this.kitchenReadyOnly ? '✓ 只显示现在能做的' : `🔍 只看现在能做的（${cookableCount}）`;
    filterBtn.addEventListener('click', () => { this.kitchenReadyOnly = !this.kitchenReadyOnly; this.renderKitchen(); });
    body.appendChild(filterBtn);

    const list = this.kitchenReadyOnly ? DISHES.filter(d => g.canCook(d.id)) : DISHES;
    if (!list.length) {
      body.insertAdjacentHTML('beforeend', '<div class="bag-empty">现在还凑不齐任何一道料理<br>多种点作物、攒攒品质吧 🌱</div>');
      return;
    }
    list.forEach(dish => {
      const ready = g.canCook(dish.id);
      const el = document.createElement('div');
      el.className = 'dish-row' + (ready ? ' ready' : '');
      const ings = dish.recipe.map(([id, q, n]) => {
        const key = ingredientKey(id, q);
        const have = g.inventory[key] ?? 0;
        const info = keyInfo(key);
        return `<span class="ing ${have >= n ? 'ok' : 'no'}">${info.icon}${info.label} ${have}/${n}</span>`;
      }).join('');
      el.innerHTML = `<div class="icon">${dish.emoji}</div>
        <div class="info"><b>${dish.name}</b> <span class="price">卖 ${dishPrice(dish)}💰</span>
        <div class="recipe">${ings}</div></div>`;
      const stoveFree = g.cookSlots.some(s => !s);
      const btn = document.createElement('button');
      btn.textContent = stoveFree ? '下锅' : '灶满';
      btn.disabled = !ready || !stoveFree;
      if (ready && stoveFree) btn.addEventListener('click', () => { g.cookDish(dish.id); this.renderKitchen(); });
      el.appendChild(btn);
      body.appendChild(el);
    });
  }

  renderBank() {
    const body = $('#bank-body');
    const g = this.game;
    body.innerHTML = '';
    body.insertAdjacentHTML('beforeend',
      `<div id="bank-balance">🏦 ${g.bank}💰</div>`);
    const note = document.createElement('p');
    note.className = 'shop-note';
    note.textContent = `身上现金 ${g.coins}💰`;
    body.appendChild(note);
    // 自选金额
    const input = document.createElement('input');
    input.id = 'bank-amount';
    input.type = 'number';
    input.min = '1';
    input.placeholder = '输入金额…';
    body.appendChild(input);
    const getAmt = () => Math.max(0, Math.floor(Number(input.value) || 0));
    const row = (defs, out) => {
      const div = document.createElement('div');
      div.className = 'bank-row' + (out ? ' out' : '');
      defs.forEach(([label, fn]) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.addEventListener('click', () => {
          const amt = fn();
          if (amt <= 0) { this.toast('先输入一个金额'); return; }
          out ? g.bankWithdraw(amt) : g.bankDeposit(amt);
          this.renderBank();
        });
        div.appendChild(btn);
      });
      body.appendChild(div);
    };
    row([['存入', getAmt], ['全部存入', () => g.coins]], false);
    row([['取出', getAmt], ['全部取出', () => g.bank]], true);
  }

  /* ---------- 抓鱼水滩 ---------- */

  openFishing() {
    this.closePanels();
    $('#fish').classList.remove('hidden');
    this.renderFishing();
  }

  renderFishing() {
    const body = $('#fish-body');
    const g = this.game;
    body.innerHTML = '';

    // —— 钓鱼进行中：专注模式 ——
    if (this.inFishing) {
      const c = g.pendingCatch;
      if (c) {
        // 鱼在钩上！狂点收杆
        const pct = Math.round(((c.total - c.clicksLeft) / c.total) * 100);
        body.insertAdjacentHTML('beforeend', `
          <div id="kitchen-progress">${t('fish.bite')}<small>${tp('fish.biteHint', { label: c.label, v: c.value })}</small></div>
          <div class="ws-slot done"><div class="icon">💪</div>
            <div class="info"><b>${tp('fish.reelPct', { pct })}</b>
            <div class="bar"><i style="width:${pct}%"></i></div></div></div>
          ${g.catchQueue.length ? `<p class="shop-note">${tp('fish.queued', { n: g.catchQueue.length })}</p>` : ''}`);
        const reel = document.createElement('button');
        reel.id = 'reel-btn';
        reel.textContent = tp('fish.reelBtn', { n: c.clicksLeft });
        reel.style.cssText = 'width:100%;padding:22px 0;border-radius:16px;border:3px solid #e09b3d;background:#ffe9b8;color:#8a5a2b;font-weight:800;font-size:19px;cursor:pointer;';
        reel.addEventListener('click', () => {
          g.reelClick();
          // 没拉完就只更新文字，别整块重绘打断连点
          const cc = g.pendingCatch;
          if (cc && cc.clicksLeft < cc.total && cc === c) {
            reel.textContent = tp('fish.reelBtn', { n: cc.clicksLeft });
          } else this.renderFishing();
        });
        body.appendChild(reel);
        return;
      }
      const usingRod = g.fishingGear === 'rod';
      const gearCfg = usingRod ? ROD : CASTNET;
      const next = Math.max(0, Math.ceil(60 - g.fishingTimer));
      body.insertAdjacentHTML('beforeend', `
        <div id="kitchen-progress">${t(usingRod ? 'fish.rodOn' : 'fish.netOn')}</div>
        <div class="ws-slot"><div class="icon">⏳</div>
          <div class="info"><b>${tp('fish.nextIn', { n: next })}</b>
          <div class="bar"><i style="width:${Math.round((1 - next / 60) * 100)}%"></i></div></div></div>
        <div class="ws-slot done"><div class="icon">${usingRod ? '🎣' : '🥅'}</div>
          <div class="info"><b>${t(usingRod ? 'fish.rod' : 'fish.net')}</b><p>${tp('fish.gearDesc', { p: gearCfg.chance * 100, min: gearCfg.min, max: gearCfg.max, cmin: gearCfg.min + 5, cmax: gearCfg.max + 5 })}</p></div></div>
        <div class="ws-slot"><div class="icon">💰</div>
          <div class="info"><b>${tp('fish.earned', { n: g.fishingEarned })}</b></div></div>`);
      if ((g.items[usingRod ? 'castnet' : 'rod'] ?? 0) > 0) {
        const sw = document.createElement('button');
        sw.textContent = t(usingRod ? 'fish.toNet' : 'fish.toRod');
        sw.style.cssText = 'width:100%;margin-bottom:8px;padding:10px;border-radius:12px;border:2px solid #d9b071;background:#fff8ec;color:#8a5a2b;font-weight:700;cursor:pointer;';
        sw.addEventListener('click', () => { g.switchGear(); this.renderFishing(); });
        body.appendChild(sw);
      }
      const btn = document.createElement('button');
      btn.textContent = t('fish.stop');
      btn.style.cssText = 'width:100%;padding:11px;border-radius:12px;border:2px solid #e09b3d;background:#ffe9b8;color:#8a5a2b;font-weight:700;cursor:pointer;';
      btn.addEventListener('click', () => this.exitFishing());
      body.appendChild(btn);
      return;
    }

    // —— 钓鱼入口：选一件装备下水 ——
    [['rod', '🎣', t('fish.rodTitle'), tp('fish.rodPitch', { p: ROD.chance * 100, min: ROD.min, max: ROD.max })],
     ['castnet', '🥅', t('fish.netTitle'), tp('fish.netPitch', { p: CASTNET.chance * 100, min: CASTNET.min, max: CASTNET.max })]]
      .forEach(([gear, icon, name, desc]) => {
        const owned = (g.items[gear] ?? 0) > 0;
        const row = document.createElement('div');
        row.className = 'ws-slot' + (owned ? ' done' : '');
        row.innerHTML = `<div class="icon">${icon}</div>
          <div class="info"><b>${name}</b><p>${owned ? desc : tp('fish.notOwned', { n: itemById(gear).cost })}</p></div>`;
        const btn = document.createElement('button');
        btn.textContent = t(owned ? 'fish.dive' : 'fish.noGear');
        btn.disabled = !owned;
        if (owned) btn.addEventListener('click', () => this.enterFishing(gear));
        else btn.style.cssText = 'border-color:#ccc;background:#f0f0f0;color:#aaa;cursor:default;';
        row.appendChild(btn);
        body.appendChild(row);
      });

    // —— 水塘装饰摆放 ——
    const ownedDecors = POND_DECORS.filter(d => g.pondOwned[d.id]);
    if (this.pondChoosing) {
      const unplaced = ownedDecors.filter(d => !g.pondPlaced.includes(d.id));
      unplaced.forEach(d => {
        const el = document.createElement('div');
        el.className = 'ws-slot';
        el.innerHTML = `<div class="icon">🦆</div>
          <div class="info"><b>${pondName(d)}</b><p style="color:${POND_RARITY[d.rarity].color}">${tf(`rarity.${d.rarity}`, POND_RARITY[d.rarity].name)}</p></div>`;
        const btn = document.createElement('button');
        btn.textContent = t('ui.place');
        btn.addEventListener('click', () => { g.placePondDecor(d.id); this.pondChoosing = false; this.renderFishing(); });
        el.appendChild(btn);
        body.appendChild(el);
      });
      const back = document.createElement('button');
      back.textContent = t('ui.back');
      back.style.cssText = 'width:100%;padding:9px;border-radius:12px;border:2px solid #d9b071;background:#fff8ec;color:#8a5a2b;font-weight:700;cursor:pointer;margin-bottom:8px;';
      back.addEventListener('click', () => { this.pondChoosing = false; this.renderFishing(); });
      body.appendChild(back);
      return;
    }
    if (ownedDecors.length) {
      g.pondPlaced.forEach(id => {
        const d = pondDecorById(id);
        const el = document.createElement('div');
        el.className = 'ws-slot done';
        el.innerHTML = `<div class="icon">🦆</div>
          <div class="info"><b>${tf(`pond.${d.id}`, d.name)}</b><p style="color:${POND_RARITY[d.rarity].color}">${tf(`rarity.${d.rarity}`, POND_RARITY[d.rarity].name)} · ${t('fish.swimming')}</p></div>`;
        const btn = document.createElement('button');
        btn.className = 'collect';
        btn.textContent = t('fish.takeBack');
        btn.addEventListener('click', () => { g.removePondDecor(id); this.renderFishing(); });
        el.appendChild(btn);
        body.appendChild(el);
      });
      const unplacedCount = ownedDecors.length - g.pondPlaced.length;
      if (unplacedCount > 0 && g.pondPlaced.length < POND_MAX_PLACED) {
        const btn = document.createElement('button');
        btn.textContent = tp('fish.placeDecor', { n: g.pondPlaced.length, max: POND_MAX_PLACED });
        btn.style.cssText = 'width:100%;padding:9px;border-radius:12px;border:2px solid #d9b071;background:#fff8ec;color:#8a5a2b;font-weight:700;cursor:pointer;margin-bottom:8px;';
        btn.addEventListener('click', () => { this.pondChoosing = true; this.renderFishing(); });
        body.appendChild(btn);
      }
    }

    const nets = g.items.net ?? 0;
    g.fishNets.forEach((n, k) => {
      const el = document.createElement('div');
      el.className = 'ws-slot';
      if (!n) {
        el.innerHTML = `<div class="icon">🌊</div><div class="info"><b>${tp('fish.netSlot', { n: k + 1 })}</b><p>${t('fish.slotEmpty')}</p></div>`;
        const btn = document.createElement('button');
        btn.textContent = t('fish.setNet');
        if (nets <= 0) { btn.disabled = true; btn.style.opacity = 0.5; }
        btn.addEventListener('click', () => { g.placeNet(k); this.renderFishing(); });
        el.appendChild(btn);
      } else {
        const remain = Math.max(0, n.readyAt - g.time);
        if (remain > 0) {
          const pct = Math.round((1 - remain / FISHING.time) * 100);
          el.innerHTML = `<div class="icon">🕸️</div>
            <div class="info"><b>${tp('fish.netWorking', { n: k + 1 })}</b>
            <p>${tp('fish.netRemain', { t: fmtTime(remain) })}</p>
            <div class="bar"><i style="width:${pct}%"></i></div></div>`;
        } else {
          el.classList.add('done');
          el.innerHTML = `<div class="icon">🐟</div>
            <div class="info"><b>${tp('fish.netReady', { n: k + 1 })}</b><p>${t('fish.netReadyHint')}</p></div>`;
          const btn = document.createElement('button');
          btn.className = 'collect';
          btn.textContent = t('fish.collect');
          btn.addEventListener('click', () => { g.collectNet(k); this.renderFishing(); });
          el.appendChild(btn);
        }
      }
      body.appendChild(el);
    });
  }

  /* ---------- 我的小屋（进屋 = 镜头切进 3D 房间） ---------- */

  attachCamera(camera, controls) {
    this.camera = camera;
    this.controls = controls;
  }

  openHouse() {
    this.closePanels();
    if (!this.inHouse && this.camera) {
      // 记住外面的镜头，进屋
      this._camBackup = {
        pos: this.camera.position.clone(),
        target: this.controls.target.clone(),
        minD: this.controls.minDistance,
      };
      const p = INTERIOR_POS;
      this.controls.target.set(p.x + 0.2, p.y + 1.4, p.z - 1);
      this.camera.position.set(p.x + 14, p.y + 11.5, p.z + 15.5);
      this.controls.minDistance = 3;
      this.controls.update();
      this.inHouse = true;
    }
    $('#house').classList.remove('hidden');
    this.renderHouse();
  }

  exitHouse() {
    $('#house').classList.add('hidden');
    if (!this.inHouse) return;
    this.inHouse = false;
    this.editMode = false;
    this.recEditMode = false;   // 招待厅的布置模式，跟小屋各管各的
    if (this._camBackup) {
      this.camera.position.copy(this._camBackup.pos);
      this.controls.target.copy(this._camBackup.target);
      this.controls.minDistance = this._camBackup.minD;
      this.controls.update();
      this._camBackup = null;
    }
  }

  renderHouse() {
    const g = this.game;
    const body = $('#house-body');
    body.innerHTML = '';

    const comfort = document.createElement('div');
    comfort.id = 'house-comfort';
    const ownedCount = FURNITURE.filter(f => g.furniture[f.id]).length;
    comfort.textContent = `🛋 舒适度 ${g.comfort()} · 家具 ${ownedCount}/${FURNITURE.length}`;
    body.appendChild(comfort);

    // 布置模式：可以直接在 3D 房间里拖家具
    const editBtn = document.createElement('button');
    editBtn.id = 'house-edit';
    editBtn.className = this.editMode ? 'on' : '';
    editBtn.textContent = this.editMode ? '✓ 完成布置' : '🔧 布置模式（自由摆放家具）';
    editBtn.addEventListener('click', () => {
      this.editMode = !this.editMode;
      this.toast(this.editMode ? '🔧 按住家具拖到想放的位置' : '✓ 布置完成');
      this.renderHouse();
    });
    body.appendChild(editBtn);

    if (this.editMode) {
      const tip = document.createElement('p');
      tip.className = 'shop-note';
      tip.textContent = '按住家具拖动摆放，点每行的 ↻ 转方向。布置模式下无法旋转视角。';
      body.appendChild(tip);
      const reset = document.createElement('button');
      reset.id = 'house-reset';
      reset.textContent = '↺ 恢复默认布局';
      reset.addEventListener('click', () => { g.resetFurnitureLayout(); this.renderHouse(); });
      body.appendChild(reset);
    }

    // 房屋外观装修：7 个部位各 5 种样式，点一下就换（扣少量金币）
    const skinBox = document.createElement('div');
    skinBox.className = 'skin-box';
    skinBox.innerHTML = `<div class="skin-title">🎨 房屋外观装修 · 每换一处 ${HOUSE_SKIN_COST}💰</div>`;
    Object.entries(HOUSE_SKINS).forEach(([part, def]) => {
      const row = document.createElement('div');
      row.className = 'skin-row';
      row.innerHTML = `<span class="skin-part">${def.emoji} ${tf(`skin.${part}`, def.name)}</span>`;
      const chips = document.createElement('div');
      chips.className = 'style-chips';
      const cur = g.houseSkin[part] ?? 0;
      def.options.forEach((opt, i) => {
        const chip = document.createElement('button');
        chip.textContent = opt.name;
        chip.className = i === cur ? 'active' : '';
        chip.addEventListener('click', () => { g.setHouseSkin(part, i); this.renderHouse(); });
        chips.appendChild(chip);
      });
      row.appendChild(chips);
      skinBox.appendChild(row);
    });
    body.appendChild(skinBox);

    FURNITURE.forEach(f => {
      const lv = g.furniture[f.id] ?? 0;
      const shown = lv ? Math.min(g.furnitureStyle[f.id] ?? lv, lv) : 0;
      const el = document.createElement('div');
      el.className = 'fur-row' + (lv ? '' : ' locked');
      const desc = lv
        ? `已解锁 Lv.${lv}/${FURNITURE_MAX_LEVEL} · 正在展示「${f.levelNames[shown - 1]}」`
        : `未拥有 · 商场「内饰」页 ${f.cost}💰`;
      el.innerHTML = `<div class="icon">${f.emoji}</div>
        <div class="info"><b>${tf(`furn.${f.id}`, f.name)}</b><p>${desc}</p></div>`;
      // 已解锁的外观随便换
      if (lv >= 2) {
        const chips = document.createElement('div');
        chips.className = 'style-chips';
        for (let k = 1; k <= lv; k++) {
          const chip = document.createElement('button');
          chip.textContent = f.levelNames[k - 1];
          chip.className = k === shown ? 'active' : '';
          chip.addEventListener('click', () => { g.setFurnitureStyle(f.id, k); this.renderHouse(); });
          chips.appendChild(chip);
        }
        el.querySelector('.info').appendChild(chips);
      }
      if (this.editMode && lv) {
        const btn = document.createElement('button');
        btn.textContent = '↻';
        btn.title = '旋转 45°';
        btn.addEventListener('click', () => g.rotateFurniture(f.id));
        el.appendChild(btn);
      }
      if (f.id === 'bed' && !this.editMode) {
        const btn = document.createElement('button');
        btn.className = 'sleep';
        btn.textContent = '😴 睡觉';
        btn.addEventListener('click', () => this.enterSleep());
        el.appendChild(btn);
      }
      if (lv && lv < FURNITURE_MAX_LEVEL) {
        const btn = document.createElement('button');
        btn.textContent = `升级 ${f.up[lv - 1]}💰`;
        btn.addEventListener('click', () => { g.upgradeFurniture(f.id); this.renderHouse(); });
        el.appendChild(btn);
      } else if (lv >= FURNITURE_MAX_LEVEL) {
        const btn = document.createElement('button');
        btn.className = 'maxed';
        btn.textContent = '满级';
        el.appendChild(btn);
      }
      body.appendChild(el);
    });
  }

  /* ---------- 商场 ---------- */

  openMall() {
    this.closePanels();
    $('#mall').classList.remove('hidden');
    this.renderMall();
  }

  renderMall() {
    const g = this.game;
    // 页签栏：原商店的全部分类都搬进商场大楼
    const tabsBar = $('#mall-tabs');
    tabsBar.innerHTML = '';
    ['items', 'seeds', 'soil', 'water', 'decor', 'interior', 'pond', 'harbor']
      .forEach((id) => {
        const tab = document.createElement('button');
        tab.className = 'shop-tab' + (this.mallTab === id ? ' active' : '');
        tab.textContent = t(`mallTab.${id}`);
        tab.addEventListener('click', () => { this.mallTab = id; this.renderMall(); });
        tabsBar.appendChild(tab);
      });

    const body = $('#mall-body');
    body.innerHTML = '';
    const item = (icon, title, desc, btnText, onClick, btnClass = '') => {
      const el = document.createElement('div');
      el.className = 'shop-item';
      el.innerHTML = `<div class="icon">${icon}</div>
        <div class="info"><b>${title}</b><p>${desc}</p></div>`;
      const btn = document.createElement('button');
      btn.textContent = btnText;
      if (btnClass) btn.className = btnClass;
      if (onClick) btn.addEventListener('click', onClick); else btn.disabled = true;
      el.appendChild(btn);
      body.appendChild(el);
      return btn;
    };

    if (this.mallTab === 'items') {
      // 一次买几个，想买多少填多少
      const qtyBox = document.createElement('div');
      qtyBox.id = 'mall-qty-box';
      qtyBox.innerHTML = `<span>${t('mall.buyPre')}</span>`;
      const input = document.createElement('input');
      input.id = 'mall-qty';
      input.type = 'number';
      input.min = '1';
      input.value = this.mallQty ?? 1;
      input.addEventListener('input', () => {
        this.mallQty = Math.max(1, Math.floor(Number(input.value) || 1));
        body.querySelectorAll('[data-price]').forEach(b => {
          b.textContent = tp('mall.buyN', { n: this.mallQty, cost: Number(b.dataset.price) * this.mallQty });
        });
      });
      qtyBox.appendChild(input);
      qtyBox.insertAdjacentHTML('beforeend', `<span>${t('mall.buyPost')}</span>`);
      body.appendChild(qtyBox);
      const qty = () => Math.max(1, Math.floor(Number(input.value) || 1));
      ITEMS.forEach(it => {
        const owned = g.items[it.id] ?? 0;
        // 永久工具只买一件
        if (it.once) {
          item(it.emoji, tf(`item.${it.id}`, it.name), tf(`itemDesc.${it.id}`, it.desc),
            owned ? t('mall.owned') : `${it.cost}💰`,
            owned ? null : () => { g.buyItem(it.id, 1); this.renderMall(); },
            owned ? 'owned' : '');
          return;
        }
        const btn = item(it.emoji, `${tf(`item.${it.id}`, it.name)}${owned ? tp('mall.held', { n: owned }) : ''}`,
          tf(`itemDesc.${it.id}`, it.desc),
          tp('mall.buyN', { n: qty(), cost: it.cost * qty() }),
          () => { g.buyItem(it.id, qty()); this.renderMall(); });
        btn.dataset.price = it.cost;
      });
    }

    if (this.mallTab === 'seeds') {
      const seedRow = (s) => {
        const owned = g.unlockedSeeds.includes(s.id);
        item(s.emoji, seedName(s),
          tp('mall.seedDesc', { cost: s.cost, sell: s.sell, time: fmtTime(s.growTime) }),
          owned ? t('mall.unlocked') : tp('mall.unlockN', { n: s.unlock }),
          owned ? null : () => { g.unlockSeed(s.id); this.renderMall(); },
          owned ? 'owned' : '');
      };
      // 原来分「基础 14 种 / ✨特殊 8 种」两区。特殊种子概念随典藏馆一起删了，
      // 所有作物一律平等、都能入藏，所以并成一条按解锁价排好的清单
      body.insertAdjacentHTML('beforeend', `<div class="ach-group">${tp('mall.seedBase', { n: SEEDS.length })}</div>`);
      SEEDS.forEach(seedRow);
    }

    if (this.mallTab === 'soil') {
      SOILS.forEach((s, i) => {
        const desc = tp('mall.soilSpeed', { n: s.speed })
          + (s.yield > 1 ? tp('mall.soilYield', { n: s.yield }) : '')
          + (i > 0 ? tp('mall.soilPer', { n: s.cost }) : t('mall.soilStart'));
        const sname = tf(`soil.name.${i}`, s.name);
        if (i === 0) { item('🟫', sname, desc, t('mall.default'), null, 'owned'); return; }
        const selected = this.selectedSoil === i;
        item('🟫', sname, desc,
          selected ? t('mall.selected') : t('mall.select'),
          () => { this.selectedSoil = i; this.renderMall(); },
          selected ? '' : 'owned');
      });
      const btn = document.createElement('button');
      btn.textContent = tp('mall.soilMode', { name: tf(`soil.name.${this.selectedSoil}`, SOILS[this.selectedSoil].name) });
      btn.style.cssText = 'width:100%;padding:10px;border-radius:12px;border:2px solid #e09b3d;background:#ffe9b8;color:#8a5a2b;font-weight:700;cursor:pointer;';
      btn.addEventListener('click', () => { this.setTool('soil'); $('#mall').classList.add('hidden'); });
      body.appendChild(btn);
    }

    if (this.mallTab === 'water') {
      WATER_LEVELS.forEach((w, i) => {
        const state = i < g.waterLevel ? t('mall.owned') : i === g.waterLevel ? t('mall.current') : null;
        item('💧', tf(`water.name.${i}`, w.name), tf(`water.desc.${i}`, w.desc),
          state ?? tp('mall.upgradeN', { n: w.cost }),
          state || i !== g.waterLevel + 1 ? null : () => { g.buyWaterLevel(); this.renderMall(); },
          state ? 'owned' : '');
      });
    }

    if (this.mallTab === 'decor') {
      DECORS.forEach(d => {
        item(d.emoji, tf(`decor.${d.id}`, d.name), `${d.cost}💰`,
          t('mall.place'), () => { this.setTool('decor', { decorId: d.id }); $('#mall').classList.add('hidden'); });
      });
    }

    if (this.mallTab === 'harbor') {
      body.insertAdjacentHTML('beforeend',
        `<p class="shop-note">🌊 港湾装饰，全是大海里的东西。<br>
         港湾水面大，最多能摆 <b>${HARBOR_MAX_PLACED}</b> 件，<b>同一样可以买好几件重复摆</b>。<br>
         买完去港湾面板底下摆放。</p>`);
      HARBOR_DECORS.forEach(d => {
        const owned = g.harborOwned[d.id] ?? 0;
        const r = POND_RARITY[d.rarity];
        item(d.emoji ?? '🌊',
          `<span style="color:${r.color}">[${r.name}]</span> ${harborDecorName(d)}` + (owned ? ` ×${owned}` : ''),
          `${d.cost}💰` + (owned ? `　已有 ${owned} 件（还能再买）` : ''),
          '买一件', () => { g.buyHarborDecor(d.id); this.renderMall(); });
      });
      return;
    }

    if (this.mallTab === 'pond') {
      ['common', 'rare', 'epic', 'legend'].forEach(rar => {
        POND_DECORS.filter(d => d.rarity === rar).forEach(d => {
          const owned = !!g.pondOwned[d.id];
          const badge = `<span style="color:${POND_RARITY[rar].color};font-weight:700">【${tf(`rarity.${rar}`, POND_RARITY[rar].name)}】</span>`;
          const el = document.createElement('div');
          el.className = 'shop-item';
          el.innerHTML = `<div class="icon">🦆</div>
            <div class="info"><b>${tf(`pond.${d.id}`, d.name)}</b><p>${badge} ${t('mall.pondDesc')}</p></div>`;
          const btn = document.createElement('button');
          btn.textContent = owned ? t('mall.owned') : `${d.cost}💰`;
          if (owned) { btn.className = 'owned'; btn.disabled = true; }
          else btn.addEventListener('click', () => { g.buyPondDecor(d.id); this.renderMall(); });
          el.appendChild(btn);
          body.appendChild(el);
        });
      });
    }

    if (this.mallTab === 'interior') {
      FURNITURE.filter(f => !f.free).forEach(f => {
        const lv = g.furniture[f.id] ?? 0;
        item(f.emoji, tf(`furn.${f.id}`, f.name),
          lv ? tp('mall.ownedLv', { lv })
             : tp('mall.furnDesc', { first: tf(`furnLv0.${f.id}`, f.levelNames[0]), max: FURNITURE_MAX_LEVEL }),
          lv ? t('mall.bought') : `${f.cost}💰`,
          lv ? null : () => { g.buyFurniture(f.id); this.renderMall(); },
          lv ? 'owned' : '');
      });
    }
  }

  /* ---------- 道具背包 ---------- */

  renderItems() {
    const body = $('#items-body');
    const g = this.game;
    body.innerHTML = '';

    // 升变道具要先挑一个作物当目标
    if (this.itemPicking) {
      const item = itemById(this.itemPicking);
      const back = document.createElement('button');
      back.className = 'sorter-pick';
      back.innerHTML = '<span class="icon">↩️</span><span class="info"><b>返回道具背包</b></span>';
      back.addEventListener('click', () => { this.itemPicking = null; this.renderItems(); });
      body.appendChild(back);

      const list = g.upgradeCandidates(item.pick)
        .sort((a, b) => keyInfo(b).price - keyInfo(a).price);
      if (!list.length) {
        body.insertAdjacentHTML('beforeend',
          `<div class="bag-empty">背包里没有能升成${item.name.slice(0, 2)}的作物<br>${
            item.pick === 'silver' ? '需要普通品质的作物' : '需要普通或白银品质的作物'}</div>`);
        return;
      }
      list.forEach(key => {
        const from = keyInfo(key);
        const to = keyInfo(`${key.split(':')[0]}:${item.pick}`);
        const btn = document.createElement('button');
        btn.className = 'sorter-pick';
        btn.innerHTML = `
          <span class="icon">${from.icon}</span>
          <span class="info">
            <b>${from.label} ×${g.inventory[key]}</b>
            <small>${from.price}💰 → ${to.price}💰</small>
          </span>
          <span class="gain">+${to.price - from.price}💰</span>`;
        btn.addEventListener('click', () => {
          if (g.upgradeQuality(this.itemPicking, key)) {
            // 用光了就退回道具列表，还有就留在这继续升
            if ((g.items[this.itemPicking] ?? 0) <= 0) this.itemPicking = null;
            this.renderItems();
          }
        });
        body.appendChild(btn);
      });
      return;
    }

    const owned = ITEMS.filter(i => (g.items[i.id] ?? 0) > 0);
    if (!owned.length) {
      body.innerHTML = '<div class="bag-empty">道具背包空空的<br>去菜园后面的 🛒 商场逛逛吧</div>';
      return;
    }
    owned.forEach(item => {
      const n = g.items[item.id];
      const el = document.createElement('div');
      el.className = 'bag-item';
      el.innerHTML = `<div class="icon">${item.emoji}</div>
        <div class="info"><b>${item.name} ×${n}</b><p>${item.desc}</p></div>`;
      const btn = document.createElement('button');
      btn.textContent = item.pick ? '选作物' : '使用';
      btn.addEventListener('click', () => {
        if (item.pick) { this.itemPicking = item.id; this.renderItems(); return; }
        g.useItem(item.id);
        this.renderItems();
      });
      el.appendChild(btn);
      body.appendChild(el);
    });
  }

  /* ---------- 工坊 ---------- */

  openWorkshop() {
    this.closePanels();
    this.wsChoosing = null;
    $('#ws').classList.remove('hidden');
    this.renderWorkshop();
  }

  renderWorkshop() {
    const body = $('#ws-body');
    const g = this.game;
    body.innerHTML = '';

    // 选择要加工的作物
    if (this.wsChoosing !== null) {
      // 白名单：只有田里收的原果能装罐（跟酿酒同一判定 brewable）。
      // 原来是黑名单，f:/s:/w: 这些后加的前缀全漏了——列表里混进水产/酒，
      // 算罐头价 keyInfo('p:'+key) 解析不了，整个工坊面板每 500ms 崩一次
      const raw = Object.entries(g.inventory)
        .filter(([k, n]) => n > 0 && g.brewable(k));
      if (!raw.length) {
        body.insertAdjacentHTML('beforeend', '<div class="bag-empty">背包里没有可加工的作物<br>先去收获一些吧 🌱</div>');
      }
      raw.forEach(([key, n]) => {
        const info = keyInfo(key);
        const canPrice = keyInfo('p:' + key).price;
        const enough = n >= WORKSHOP.ingredients;
        const el = document.createElement('div');
        el.className = 'ws-slot';
        el.innerHTML = `<div class="icon">${info.icon}</div>
          <div class="info"><b>${info.label} ×${n}</b><p>${WORKSHOP.ingredients} 个 → 罐头卖 ${canPrice}💰</p></div>`;
        const btn = document.createElement('button');
        btn.textContent = enough ? '放入' : `缺${WORKSHOP.ingredients - n}个`;
        btn.disabled = !enough;
        if (!enough) btn.style.cssText = 'border-color:#ccc;background:#f0f0f0;color:#aaa;cursor:default;';
        else btn.addEventListener('click', () => {
          g.processStart(this.wsChoosing, key);
          this.wsChoosing = null;
          this.renderWorkshop();
        });
        el.appendChild(btn);
        body.appendChild(el);
      });
      const back = document.createElement('button');
      back.textContent = t('ui.back');
      back.style.cssText = 'width:100%;padding:9px;border-radius:12px;border:2px solid #d9b071;background:#fff8ec;color:#8a5a2b;font-weight:700;cursor:pointer;';
      back.addEventListener('click', () => { this.wsChoosing = null; this.renderWorkshop(); });
      body.appendChild(back);
      return;
    }

    // 加工位列表
    g.workshop.forEach((s, k) => {
      const el = document.createElement('div');
      el.className = 'ws-slot';
      if (!s) {
        el.innerHTML = `<div class="icon">➕</div><div class="info"><b>空闲加工位</b><p>点击放入作物</p></div>`;
        const btn = document.createElement('button');
        btn.textContent = '放入';
        btn.addEventListener('click', () => { this.wsChoosing = k; this.renderWorkshop(); });
        el.appendChild(btn);
      } else {
        const info = keyInfo(s.key);
        const remain = Math.max(0, s.readyAt - g.time);
        if (remain > 0) {
          const pct = Math.round((1 - remain / WORKSHOP.time) * 100);
          el.innerHTML = `<div class="icon">${info.icon}</div>
            <div class="info"><b>${info.label} 加工中</b>
            <p>还剩 ${Math.ceil(remain)} 秒</p>
            <div class="bar"><i style="width:${pct}%"></i></div></div>`;
        } else {
          el.classList.add('done');
          el.innerHTML = `<div class="icon">🥫</div>
            <div class="info"><b>${info.label}罐头 完成！</b><p>可卖 ${keyInfo('p:' + s.key).price}💰</p></div>`;
          const btn = document.createElement('button');
          btn.className = 'collect';
          btn.textContent = '取出';
          btn.addEventListener('click', () => { g.processCollect(k); this.renderWorkshop(); });
          el.appendChild(btn);
        }
      }
      body.appendChild(el);
    });
  }

  /* ---------- 快捷菜单 ---------- */

  openQuickMenu(view) {
    this.quickView = view;
    const menu = $('#quick-menu');
    menu.classList.remove('hidden');
    menu.innerHTML = '';
    const g = this.game;

    const addBtn = (html, onClick) => {
      const b = document.createElement('button');
      b.innerHTML = html;
      b.addEventListener('click', onClick);
      menu.appendChild(b);
      return b;
    };

    if (view === 'main') {
      addBtn(t('quick.harvest'), () => {
        g.harvestAll();
        menu.classList.add('hidden');
      });
      addBtn(t('quick.sell'), () => {
        this.openSellMode();
        menu.classList.add('hidden');
      });
      {
        // 有能领的就在按钮上挂个红点，省得玩家忘了领——不领第二天就作废了
        const n = g.taskClaimable();
        addBtn(t('quick.tasks') + (n ? ` <em class="bag-badge">${n}</em>` : ''), () => {
          this.openTasks();
          menu.classList.add('hidden');
        });
      }
      addBtn(t('quick.review'), () => {
        this.openReview();
        menu.classList.add('hidden');
      });
      addBtn(t('quick.plant'), () => {
        this.openQuickMenu('layouts');
      });
      addBtn(tp('quick.water', { cost: QUICK_WATER_COST }), () => {
        g.waterAll();
        menu.classList.add('hidden');
      });
      addBtn(tp('quick.spray', { mult: PESTICIDE.mult }), () => {
        g.sprayAll();
        menu.classList.add('hidden');
      });
      addBtn(t('quick.visitor'), () => {
        this.openVisitor();
      });
      addBtn(t('quick.wiki'), () => {
        this.openWiki();
      });
      return;
    }

    // 布局列表
    if (!g.savedLayouts.length) {
      const p = document.createElement('div');
      p.style.cssText = 'padding:8px 12px;color:#a1834f;font-size:13px;line-height:1.8;text-align:center;';
      p.innerHTML = t('quick.noLayout');
      menu.appendChild(p);
    }
    g.savedLayouts.forEach((entry, i) => {
      // 布局摘要：作物数量 + 总成本
      const counts = {};
      let cost = 0;
      entry.layout.forEach(id => {
        if (!id) return;
        counts[id] = (counts[id] ?? 0) + 1;
        cost += seedById(id).cost;
      });
      const summary = Object.entries(counts).map(([id, n]) => `${seedById(id).emoji}×${n}`).join(' ');
      const b = addBtn(
        `🌱 ${entry.name} <small>${summary} · ${tp('quick.layoutCost', { cost })}</small>`,
        () => { g.sowLayout(i); menu.classList.add('hidden'); });
      const del = document.createElement('span');
      del.textContent = '✕';
      del.style.cssText = 'position:absolute;top:6px;right:10px;color:#c9a97e;cursor:pointer;font-size:13px;';
      del.addEventListener('click', (e) => { e.stopPropagation(); g.deleteLayout(i); this.openQuickMenu('layouts'); });
      b.style.position = 'relative';
      b.appendChild(del);
    });
    addBtn(t('ui.back'), () => this.openQuickMenu('main'));
  }

  /* ---------- 挂机 ---------- */

  setAfk(on) {
    this.game.paused = on;
    this.game.save();
    $('#afk-overlay').classList.toggle('hidden', !on);
    if (on) {
      this.closePanels();
      sfx.play('pause');
      // 挂机 = 整个世界暂停，音乐没道理还在放
      music.stop();
    } else {
      this.toast(t('t.thaw'));
      sfx.play('resume');
      if (music.enabled) music.start();
      this.refresh();
    }
  }

  /* ---------- 游戏百科 ---------- */

  openWiki() {
    this.closePanels();
    $('#wiki').classList.remove('hidden');
    this.renderWiki();
  }

  renderWiki() {
    const body = $('#wiki-body');
    body.innerHTML = '';
    const pct = (x) => `${Math.round(x * 100)}%`;
    const th = (k) => t(`wiki.th.${k}`);
    const dft = t('wiki.default');
    const skinNames = (part) => Object.entries(HOUSE_SKINS).filter(([, v]) => v.part === part)
      .map(([k, v]) => tf(`skin.${k}`, v.name)).join('、');
    const groups = [...new Set(ACHIEVEMENTS.map(a => a.group))];
    const tomatoBase = seedById('tomato').sell;
    const tomatoBar = metalPrice('tomato', 'gold');
    // 每条百科的正文都从词表取（wiki.<k>.h），这里只负责把动态数值和表格塞进占位符
    const sections = [
      { icon: '🌱', k: 'farm', v: {
        unlock: UNLOCK_COST, eggChance: pct(EGG.chance), eggSell: EGG.sell,
        soilTable: `<table class="wtable"><tr><th>${th('soil')}</th><th>${th('speed')}</th><th>${th('yield')}</th><th>${th('perPlot')}</th></tr>
          ${SOILS.map((s, i) => `<tr><td>${tf(`soil.name.${i}`, s.name)}</td><td>×${s.speed}</td><td>×${s.yield}</td><td>${s.cost || dft}</td></tr>`).join('')}</table>`,
        waterTable: `<table class="wtable"><tr><th>${th('water')}</th><th>${th('effect')}</th><th>${th('price')}</th></tr>
          ${WATER_LEVELS.map((w, i) => `<tr><td>${tf(`water.name.${i}`, w.name)}</td><td>${tf(`water.desc.${i}`, w.desc)}</td><td>${w.cost || dft}</td></tr>`).join('')}</table>`,
      } },
      { icon: '🥕', k: 'crops', v: {
        table: `<table class="wtable"><tr><th>${th('crop')}</th><th>${th('seed')}</th><th>${th('sell')}</th><th>${th('grow')}</th><th>${th('unlock')}</th></tr>
          ${SEEDS.map(s => `<tr><td>${s.emoji}${seedName(s)}</td><td>${s.cost}</td><td>${s.sell}</td><td>${fmtTime(s.growTime)}</td><td>${s.unlock || dft}</td></tr>`).join('')}</table>`,
      } },
      { icon: '\ud83d\udc04', k: 'ranch', v: {
        n: ANIMALS.length, pens: RANCH_GRID * RANCH_GRID, tick: '1',
        table: `<table class="wtable"><tr><th>${th('animal')}</th><th>${th('buy')}</th><th>${th('grow')}</th><th>${th('sell')}</th><th>${th('idle')}</th></tr>
          ${ANIMALS.map(a => `<tr><td>${a.emoji}${animalName(a)}</td><td>${a.cost.toLocaleString()}</td><td>${fmtTime(a.grow)}</td><td>${a.sell.toLocaleString()}</td><td>${a.idle.toLocaleString()}</td></tr>`).join('')}</table>`,
      } },
      { icon: '\ud83d\udd2a', k: 'butcher', v: {
        kill: fmtTime(BUTCHER.killTime), cut: fmtTime(BUTCHER.cutTime),
        all: fmtTime(BUTCHER.killTime + BUTCHER.cutTime), mult: BUTCHER.mult, slots: BUTCHER.slots,
        table: `<table class="wtable"><tr><th>${th('cut')}</th><th>${th('share')}</th><th>${th('egCow')}</th></tr>
          ${CUTS.map(c => `<tr><td>${c.emoji}${cutName(c)}</td><td>\u00d7${c.share}</td><td>${cutPrice('cow', c.id).toLocaleString()}</td></tr>`).join('')}
          <tr><td><b>${th('total')}</b></td><td><b>\u00d7${BUTCHER.mult}</b></td><td><b>${CUTS.reduce((s, c) => s + cutPrice('cow', c.id), 0).toLocaleString()}</b></td></tr></table>`,
      } },
      { icon: '✨', k: 'quality', v: { gold: pct(GOLD_CHANCE), silver: pct(SILVER_CHANCE), mutant: pct(MUTANT_CHANCE) } },
      { icon: '⏰', k: 'time', v: {
        dayMin: DAY_CYCLE / 60, night: NIGHT_SLOW,
        sun: pct(1 - DROUGHT.chance - RAIN.chance), rain: pct(RAIN.chance), drought: pct(DROUGHT.chance),
        dmgMin: DAMAGE.min, dmgMax: DAMAGE.max,
      } },
      { icon: '🐛', k: 'pest', v: {
        chance: pct(PEST.chance), pestCost: itemById('pesticide').cost,
        poison: Math.round(POISON.chance * 100), timeout: POISON.timeout,
        antidoteCost: itemById('antidote').cost, revive: POISON.reviveTime,
      } },
      { icon: '🏭', k: 'craft', v: {
        ing: WORKSHOP.ingredients, wsTime: WORKSHOP.time / 60, bonus: WORKSHOP.bonus,
        dishes: DISHES.length, slots: COOK_SLOTS, cookTime: COOK_TIME / 60, mult: DISH_MULT,
      } },
      { icon: '⚙️', k: 'sorter', v: {
        slots: SORTER_SLOTS, time: SORTER_TIME / 60, mult: SORTER_MULT,
        sMult: QUALITIES.silver.mult, sBars: METAL.silver.bars, sTotal: METAL.silver.bars * SORTER_MULT,
        gMult: QUALITIES.gold.mult, gBars: METAL.gold.bars, gTotal: METAL.gold.bars * SORTER_MULT,
        exGold: tomatoBase * QUALITIES.gold.mult, exBase: tomatoBase, exBar: tomatoBar,
        exSum: tomatoBase + tomatoBar,
        exTimes: Math.round((tomatoBase + tomatoBar) / (tomatoBase * QUALITIES.gold.mult)),
      } },
      { icon: '🧬', k: 'hybrid', v: {
        slots: HYBRID_SLOTS, time: HYBRID_TIME / 60, n: HYBRIDS.length,
        table: `<table class="wtable"><tr><th>${th('hybrid')}</th><th>${th('recipe')}</th><th>${th('sell')}</th></tr>
          ${HYBRIDS.map(h => {
            const nameOf = ([sid, q]) => `${q ? tf(`quality.${['', 'silver', 'gold'][q]}`, ['', '白银', '黄金'][q]) + nameSep() : ''}${seedName(seedById(sid))}`;
            const same = h.a[0] === h.b[0] && h.a[1] === h.b[1];
            return `<tr><td>${h.emoji}${tf(`hybrid.${h.id}`, h.name)}</td><td>${same ? `${nameOf(h.a)} ×2` : `${nameOf(h.a)} + ${nameOf(h.b)}`}</td><td>${h.sell}</td></tr>`;
          }).join('')}</table>`,
      } },
      { icon: '🌸', k: 'greenhouse', v: {
        slots: GREENHOUSE_SLOTS, n: FLOWERS.length, size: BOUQUET_SIZE, mult: BOUQUET_MULT,
        table: `<table class="wtable"><tr><th>${th('flower')}</th><th>${th('rarity')}</th><th>${th('flowerSeed')}</th><th>${th('sell')}</th><th>${th('bloom')}</th></tr>
          ${FLOWERS.map(f => `<tr><td>${f.emoji}${tf(`flower.${f.id}`, f.name)}</td><td>${tf(`rarity.${f.rarity}`, POND_RARITY[f.rarity].name)}</td><td>${f.seed}</td><td>${f.sell}</td><td>${fmtTime(f.grow)}</td></tr>`).join('')}</table>`,
      } },
      { icon: '🎣', k: 'fishing', v: {
        netCost: itemById('net').cost, netTime: FISHING.time / 60,
        rMin: FISHING.rewardMin, rMax: FISHING.rewardMax, netSlots: FISHING.slots,
        rodCost: itemById('rod').cost, rodChance: pct(ROD.chance), rodMin: ROD.min, rodMax: ROD.max,
        netGearCost: itemById('castnet').cost, netChance: pct(CASTNET.chance), netMin: CASTNET.min, netMax: CASTNET.max,
        decorN: POND_DECORS.length, maxPlaced: POND_MAX_PLACED,
        rarities: Object.keys(POND_RARITY).map(r => tf(`rarity.${r}`, POND_RARITY[r].name)).join('/'),
      } },
      { icon: '🏦', k: 'bank', v: {
        gain: pct(BANK.gainChance), lose: pct(1 - BANK.gainChance),
        rMin: (BANK.rateMin * 100).toFixed(1), rMax: (BANK.rateMax * 100).toFixed(1),
      } },
      { icon: '🏛️', k: 'treasury', v: {
        total: TREASURY_TOTAL,
        table: `<table class="wtable"><tr><th>${th('hall')}</th><th>${th('slots')}</th></tr>`
          + TREASURY_CATS.map(c => `<tr><td>${c.emoji}${t('tr.cat.' + c.id)}</td><td>${c.keys().length}</td></tr>`).join('')
          + `</table>`,
      } },
      { icon: '🏠', k: 'house', v: {
        n: FURNITURE.length, max: FURNITURE_MAX_LEVEL,
        parts: Object.keys(HOUSE_SKINS).length, styles: Object.values(HOUSE_SKINS)[0].options.length,
        cost: HOUSE_SKIN_COST, ext: skinNames('ext'), int: skinNames('int'),
      } },
      { icon: '🐾', k: 'pet', v: { n: PETS.length, decorN: PET_DECORS.length, max: FURNITURE_MAX_LEVEL } },
      { icon: '🏅', k: 'ach', v: {
        n: ACHIEVEMENTS.length, groupN: groups.length, groups: groups.map(x => tf(`achGroup.${x}`, x)).join(' / '),
      } },
      { icon: '🧰', k: 'items', v: {
        table: `<table class="wtable"><tr><th>${th('item')}</th><th>${th('price')}</th><th>${th('effect')}</th></tr>
          ${ITEMS.map(i => `<tr><td>${i.emoji}${tf(`item.${i.id}`, i.name)}</td><td>${i.cost}${i.once ? t('wiki.forever') : ''}</td><td style="text-align:left">${tf(`itemDesc.${i.id}`, i.desc)}</td></tr>`).join('')}</table>`,
      } },
      { icon: '⌨️', k: 'keys', v: { cost: QUICK_WATER_COST } },
    ];
    sections.forEach((s, i) => {
      const sec = document.createElement('div');
      sec.className = 'wiki-sec' + (this.wikiOpenSec === i ? ' open' : '');
      sec.innerHTML = `<div class="sec-head">${s.icon} ${t(`wiki.${s.k}.t`)}<span class="arrow">${this.wikiOpenSec === i ? '▲' : '▼'}</span></div>
        <div class="sec-body">${tp(`wiki.${s.k}.h`, s.v)}</div>`;
      sec.querySelector('.sec-head').addEventListener('click', () => {
        this.wikiOpenSec = this.wikiOpenSec === i ? -1 : i;
        this.renderWiki();
      });
      body.appendChild(sec);
    });
  }

  /* ---------- 设置 ---------- */

  renderSettingsMenu() {
    const menu = $('#settings-menu');
    menu.innerHTML = `<div class="music-head">${t('set.title')}</div>`;
    const row = (icon, label, on, onClick) => {
      const el = document.createElement('div');
      el.className = 'music-row';
      el.innerHTML = `<b>${icon} ${label}</b>`;
      const btn = document.createElement('button');
      btn.className = on ? 'on' : 'off';
      btn.textContent = on ? t('set.on') : t('set.off');
      btn.addEventListener('click', () => { onClick(); this.renderSettingsMenu(); });
      el.appendChild(btn);
      menu.appendChild(el);
    };
    row('🎵', t('set.music'), music.enabled, () => music.toggle());
    row('🔊', t('set.sfx'), sfx.enabled, () => sfx.toggle());
    row('💬', t('set.tips'), this.tipsOn, () => {
      this.tipsOn = !this.tipsOn;
      localStorage.setItem('farm-tips-on', this.tipsOn ? '1' : '0');
      if (this.tipsOn) this.toast('💬 提示已打开');
    });
    row('📊', t('set.fps'), perf.showFps, () => perf.toggleFps());
    row('🤖', t('set.autoQuality'), perf.auto, () => perf.setAuto(!perf.auto));

    // 画质档位：四个档随便切，切了就关掉自动
    const qRow = document.createElement('div');
    qRow.className = 'music-row';
    qRow.innerHTML = `<b>⚙️ ${t('set.quality')}</b>`;
    const chips = document.createElement('div');
    chips.className = 'style-chips';
    Object.keys(QUALITY).forEach(key => {
      const b = document.createElement('button');
      b.textContent = t(`quality.${key}`);
      b.className = perf.level === key ? 'active' : '';
      b.addEventListener('click', () => {
        perf.setAuto(false);
        perf.setLevel(key);
        this.toast(`⚙️ ${t(`quality.${key}`)}`);
        this.renderSettingsMenu();
      });
      chips.appendChild(b);
    });
    qRow.appendChild(chips);
    menu.appendChild(qRow);

    // 语言：点一下展开三个选项，选中的高亮
    const cur = LANGS.find(l => l.id === lang);
    const langRow = document.createElement('div');
    langRow.className = 'music-row';
    langRow.innerHTML = `<b>🌐 ${t('set.lang')}</b>`;
    const langBtn = document.createElement('button');
    langBtn.className = 'on';
    langBtn.textContent = `${cur.flag} ${cur.name}`;
    langBtn.addEventListener('click', () => {
      this.langOpen = !this.langOpen;
      this.renderSettingsMenu();
    });
    langRow.appendChild(langBtn);
    menu.appendChild(langRow);

    if (this.langOpen) {
      LANGS.forEach(l => {
        const opt = document.createElement('div');
        opt.className = 'music-row lang-opt' + (l.id === lang ? ' current' : '');
        opt.innerHTML = `<b>${l.flag} ${l.name}</b>`;
        const pick = document.createElement('button');
        pick.textContent = l.id === lang ? '✓' : '选';
        const choose = () => {
          // 换语言后整页重载：面板文案散在几十个 render 里，重开一遍最干净
          if (setLang(l.id)) { this.game.save(); location.reload(); }
        };
        pick.addEventListener('click', choose);
        opt.addEventListener('click', choose);
        opt.appendChild(pick);
        menu.appendChild(opt);
      });
      menu.insertAdjacentHTML('beforeend',
        `<div class="lang-hint">${t('set.langHint')}</div>`);
    }
  }

  /* ---------- 选曲 ---------- */

  renderMusicMenu() {
    const menu = $('#music-menu');
    menu.innerHTML = '';
    const modeText = music.mode === 'loop' ? '🔁 单曲循环中'
      : music.mode === 'once' ? '▶ 点播中，播完回到随机' : '🔀 随机轮播中';
    menu.insertAdjacentHTML('beforeend',
      `<div class="music-head">${music.playing ? `正在播放《${music.track?.name ?? ''}》 · ${modeText}` : '音乐未开启，选一首即可播放'}</div>`);
    if (music.mode === 'loop') {
      const cancel = document.createElement('button');
      cancel.className = 'cancel-loop';
      cancel.textContent = '⏹ 取消循环（本曲放完回到随机）';
      cancel.addEventListener('click', () => {
        music.cancelLoop();
        this.toast('🔀 已取消循环，回到随机轮播');
        this.renderMusicMenu();
      });
      menu.appendChild(cancel);
    }
    // 参数别叫 t：会遮蔽 i18n 的 t()，以后翻译这个菜单时必踩
    music.listTracks().forEach(track => {
      const row = document.createElement('div');
      row.className = 'music-row' + (music.track?.id === track.id && music.playing ? ' current' : '');
      row.innerHTML = `<b>${music.track?.id === track.id && music.playing ? '🎵 ' : ''}${track.name}</b>`;
      const once = document.createElement('button');
      once.textContent = '▶ 一次';
      once.addEventListener('click', () => {
        music.playTrack(track.id, 'once');
        this.renderMusicMenu();
      });
      const loop = document.createElement('button');
      loop.textContent = '🔁 循环';
      loop.addEventListener('click', () => {
        music.playTrack(track.id, 'loop');
        this.toast(`🔁 循环播放《${track.name}》`);
        this.renderMusicMenu();
      });
      row.append(once, loop);
      menu.appendChild(row);
    });
  }

  /* ---------- 中毒与死亡显示 ---------- */

  updateHealth() {
    const g = this.game;
    const poisoned = g.isPoisoned();
    const dead = g.isDead();
    $('#poison-hud').classList.toggle('hidden', !poisoned);
    if (poisoned) {
      $('#poison-timer').textContent = g.poisonLeft();
      const n = g.items.antidote ?? 0;
      $('#poison-use').textContent = n > 0 ? tp('health.cure', { n }) : t('health.noCure');
    }
    $('#dead-overlay').classList.toggle('hidden', !dead);
    if (dead) {
      $('#dead-timer').textContent = tp('health.revive', { n: g.reviveLeft() });
      this.closePanels(); // 死了就把面板全关掉
    }
  }

  /* ---------- 时钟 ---------- */

  updateClock() {
    const { hh, mm, isNight } = this.game.clockInfo();
    const badge = $('#clock-badge');
    badge.textContent = `${isNight ? '🌙' : '☀️'} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    badge.classList.toggle('night', isNight);
  }

  /* ---------- 睡觉 ---------- */

  // 躺到床上：镜头挪到床头半躺着看房间，屏幕压暗但时钟照常走
  enterSleep() {
    const g = this.game;
    if (!g.sleep()) return;
    $('#house').classList.add('hidden'); // 收起家具面板，别挡着
    if (this.camera) {
      this._sleepCam = {
        pos: this.camera.position.clone(),
        target: this.controls.target.clone(),
        minD: this.controls.minDistance,
      };
      const p = INTERIOR_POS;
      // 床在房间左后角 (-10.4, -9.6)，视线从枕头位置往房间中央斜上方看
      this.camera.position.set(p.x - 10.2, p.y + 1.15, p.z - 9.2);
      this.controls.target.set(p.x + 1, p.y + 3.2, p.z + 1);
      this.controls.minDistance = 0.5;
      this.controls.update();
    }
    $('#sleep-overlay').classList.remove('hidden');
    this.renderSleep();
    if (!this._sleepTimer) this._sleepTimer = setInterval(() => this.renderSleep(), 120);
  }

  exitSleep() {
    $('#sleep-overlay').classList.add('hidden');
    if (this._sleepTimer) { clearInterval(this._sleepTimer); this._sleepTimer = null; }
    if (this._sleepCam) {
      this.camera.position.copy(this._sleepCam.pos);
      this.controls.target.copy(this._sleepCam.target);
      this.controls.minDistance = this._sleepCam.minD;
      this.controls.update();
      this._sleepCam = null;
    }
    if (this.inHouse) { $('#house').classList.remove('hidden'); this.renderHouse(); }
  }

  // 遮罩上的大时钟与进度条，睡着时每 120ms 刷一次
  renderSleep() {
    const g = this.game;
    if (!g.sleeping) return;
    const { hh, mm, isNight } = g.clockInfo();
    $('#sleep-clock').textContent =
      `${isNight ? '🌙' : '☀️'} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    $('#sleep-bar').querySelector('i').style.width = `${Math.round(g.sleepProgress() * 100)}%`;
  }

  /* ---------- 状态刷新 ---------- */

  // 金币/存款变动时在牌子旁飘一个 +N / -N，1 秒后消失
  // 统一在 refresh 里比对差值：售卖、花束、风车、银行、成就奖励、买东西等所有路径都自动覆盖
  popDelta(barSel, value, memo) {
    const prev = this[memo];
    this[memo] = value;
    if (prev === undefined) return;      // 首次进游戏/读档不飘
    const delta = value - prev;
    if (!delta) return;
    const bar = $(barSel);
    let el = bar.querySelector('.coin-pop');
    if (!el) {                            // 1 秒内的连续变动累加进同一个飘字，避免连点刷屏
      el = document.createElement('span');
      el.className = 'coin-pop';
      el._sum = 0;
      bar.appendChild(el);
    }
    el._sum += delta;
    if (el._sum === 0) { clearTimeout(el._t); el.remove(); return; } // 一进一出正好抵消
    el.textContent = (el._sum > 0 ? '+' : '') + el._sum;
    el.classList.toggle('minus', el._sum < 0);
    el.classList.remove('run');
    void el.offsetWidth;                  // 强制重排，让动画能重新播
    el.classList.add('run');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.remove(), 1000);
  }

  refresh() {
    this.popDelta('#coin-bar', this.game.coins, '_lastCoins');
    this.popDelta('#bank-bar', this.game.bank, '_lastBank');
    $('#coin-count').textContent = this.game.coins;
    $('#bank-count').textContent = this.game.bank;
    if (!$('#bank').classList.contains('hidden')) this.renderBank();
    if (!$('#kitchen').classList.contains('hidden')) this.renderKitchen();
    if (!$('#hybrid').classList.contains('hidden')) this.renderHybrid();
    if (!$('#pet').classList.contains('hidden')) this.renderPetRoom();
    if (!$('#codex').classList.contains('hidden')) this.renderCodex();
    if (!$('#ach').classList.contains('hidden')) this.renderAchievement();
    if (!$('#sorter').classList.contains('hidden')) this.renderSorter();
    const wl = this.game.waterLevel;
    $('#water-badge').textContent = `💧 ${tf(`water.name.${wl}`, WATER_LEVELS[wl].name)}`;
    const total = Object.values(this.game.inventory).reduce((a, b) => a + b, 0);
    const badge = $('#bag-badge');
    badge.textContent = total;
    badge.classList.toggle('hidden', total === 0);
    const itemTotal = Object.values(this.game.items).reduce((a, b) => a + b, 0);
    const iBadge = $('#items-badge');
    iBadge.textContent = itemTotal;
    iBadge.classList.toggle('hidden', itemTotal === 0);
    if (!$('#bag').classList.contains('hidden')) this.renderBag();
    if (!$('#items').classList.contains('hidden')) this.renderItems();
    if (!$('#mall').classList.contains('hidden')) this.renderMall();
    if (this.tool === 'plant') this.renderSeedPicker();
  }

  toast(msg) {
    if (this.tipsOn === false) return; // 设置里关掉了消息提示
    const wrap = $('#toast-wrap');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 1900);
    while (wrap.children.length > 3) wrap.firstChild.remove();
  }
}

import { seedName, SEEDS, SOILS, WATER_LEVELS, DECORS, seedById, QUALITIES, WORKSHOP, keyInfo, QUICK_WATER_COST, ITEMS, itemById, FURNITURE, INTERIOR_POS, FISHING, CODEX_POS, DISHES, dishPrice, ingredientKey, ROD, CASTNET, GOLD_CHANCE, SILVER_CHANCE, DISH_MULT, BANK, DROUGHT, RAIN, PEST, POISON, DAMAGE, UNLOCK_COST, EGG, NIGHT_SLOW, DAY_CYCLE, FURNITURE_MAX_LEVEL, HOUSE_SKINS, HOUSE_SKIN_COST, CODEX_SEEDS, SPECIAL_SEEDS } from './config.js';
import { POND_DECORS, POND_RARITY, POND_MAX_PLACED, pondDecorById, HYBRIDS, hybridById, HYBRID_POS, HYBRID_TIME, HYBRID_SLOTS, PETS, petById, PET_DECORS, PET_POS, dishById, COOK_TIME, COOK_SLOTS, FLOWERS, flowerById, GREENHOUSE_POS, GREENHOUSE_SLOTS, BOUQUET_SIZE, BOUQUET_MULT } from './config.js';
import { ACHIEVEMENTS, ACHIEVEMENT_POS, ACHIEVEMENT_TIERS } from './config.js';
import { SORTER_SLOTS, SORTER_TIME, SORTER_MULT, METAL, metalPrice, PESTICIDE } from './config.js';
import { SEAFOOD, seafoodById, AQUARIUM_POS, AQUARIUM_SLOTS } from './config.js';
import { BLACK_MARKET, OBSERVATORY, WEATHER_INFO, WAREHOUSE } from './config.js';
import { BREWERY_POS, BREW, winePrice } from './config.js';
import { music, sfx } from './music.js';
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
    this.codexTab = 'donate'; // 图鉴大楼：donate 基础图鉴 / gallery 个人图鉴
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
    $('#wiki-close').addEventListener('click', () => $('#wiki').classList.add('hidden'));
    $('#hybrid-close').addEventListener('click', () => this.exitHybridLab());
    $('#pet-close').addEventListener('click', () => this.exitPetRoom());
    $('#greenhouse-close').addEventListener('click', () => this.exitGreenhouse());
    $('#codex-close').addEventListener('click', () => this.exitCodex());
    $('#ach-close').addEventListener('click', () => this.exitAchievement());
    $('#sorter-close').addEventListener('click', () => $('#sorter').classList.add('hidden'));
    $('#aqua-close').addEventListener('click', () => this.exitAquarium());
    $('#obs-close').addEventListener('click', () => $('#obs').classList.add('hidden'));
    $('#brew-close').addEventListener('click', () => this.exitBrewery());
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
      if (!$('#hybrid').classList.contains('hidden')) {
        this.renderHybrid();
        this.game.updateHybridVisuals(); // 培养罩里的作物随进度长大
      }
      if (!$('#greenhouse').classList.contains('hidden')) this.renderGreenhouse();
      if (!$('#sorter').classList.contains('hidden')) this.renderSorter();
      if (!$('#brew').classList.contains('hidden')) this.renderBrewery();
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
      else this.toast('没有解毒剂！去商场买（20💰）');
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
      this.toast(`🎵 正在播放《${name}》`);
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
      soil: `点击地块升级为${SOILS[this.selectedSoil].name}（每格 ${SOILS[this.selectedSoil].cost}💰）`,
      decor: '点击盒子四周的装饰台摆放',
      water: this.game.waterLevel === 2 ? '自动灌溉包生长，浇水专门找🦐卵' : '点击土地浇水',
      spray: `点作物打药：${PESTICIDE.cost}💰 一株，卖价 +${PESTICIDE.bonus}💰，但有 ${Math.round(PESTICIDE.ruinChance * 100)}% 概率卖不出去`,
      shovel: '点击作物或装饰铲除',
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
      body.innerHTML = '<div class="bag-empty">背包空空如也<br>去收获点作物吧 🌱</div>';
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
        <div class="info"><b>${info.label} ×${n}${keep ? '<i class="keep-tag">📖 图鉴未收录</i>' : ''}</b>
          <p>单价 ${info.price}💰 · 共 ${info.price * n}💰</p></div>`);

      // 非售卖模式才给单卖按钮，免得点勾和点卖混在一起
      if (!this.sellMode) {
        const sellOne = document.createElement('button');
        sellOne.textContent = '卖1个';
        sellOne.addEventListener('click', () => { g.sellCrop(key, 1); this.renderBag(); });
        const sellAll = document.createElement('button');
        sellAll.className = 'sell-all';
        sellAll.textContent = '全卖';
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
      this.toast('背包里没有东西可以卖');
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
    bar.innerHTML = `<small>点条目上的 ✅ 可以取消，取消的会留在背包</small>`;
    const btn = document.createElement('button');
    btn.disabled = !picked.length;
    btn.textContent = picked.length ? `💰 卖出 ${count} 件 · ${total}💰` : '一件都没选';
    btn.addEventListener('click', () => {
      g.sellKeys(picked.map(([key]) => key));
      this.exitSellMode();
      this.renderBag();
    });
    const cancel = document.createElement('button');
    cancel.className = 'ghost';
    cancel.textContent = '取消';
    cancel.addEventListener('click', () => { this.exitSellMode(); this.renderBag(); sfx.play('close'); });
    bar.append(btn, cancel);
    $('#bag').appendChild(bar);
  }

  /* ---------- 面板统一开关 ---------- */

  closePanels() {
    ['#bag', '#ws', '#mall', '#items', '#fish', '#bank', '#kitchen', '#wiki', '#hybrid', '#pet', '#greenhouse', '#sorter', '#black', '#obs', '#ware', '#brew', '#quick-menu']
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
  }

  // 加 !! 保证返回真正的布尔：|| 链在全部 falsy 时会返回最后一项（undefined）
  inside() {
    return !!(this.inHouse || this.inCodex || this.inFishing || this.inHybridLab
      || this.inPetRoom || this.inGreenhouse || this.inAchievement || this.inAquarium || this.inBrewery);
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
        <small>钓上来的水产可以养在这儿，养不下的留在背包照常卖</small></div>`);

    // 挑一样放进去
    if (this.aquaPicking) {
      const back = document.createElement('button');
      back.className = 'sorter-pick';
      back.innerHTML = '<span class="icon">↩️</span><span class="info"><b>返回鱼缸列表</b></span>';
      back.addEventListener('click', () => { this.aquaPicking = false; this.renderAquarium(); });
      body.appendChild(back);

      const list = g.aquariumCandidates().sort((a, b) => keyInfo(b).price - keyInfo(a).price);
      if (!list.length) {
        body.insertAdjacentHTML('beforeend',
          '<div class="bag-empty">背包里没有水产<br>去左边的抓鱼水滩钓几条 🎣</div>');
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
            <small>${isEgg ? '放进去会孵化成 🦞恐龙虾' : `值 ${info.price}💰`}</small>
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
      add.textContent = '＋ 放一只进来';
      add.addEventListener('click', () => { this.aquaPicking = true; this.renderAquarium(); });
      body.appendChild(add);
    }

    g.aquarium.forEach((id, k) => {
      const el = document.createElement('div');
      el.className = 'aqua-tank' + (id ? '' : ' empty');
      if (id) {
        const sf = seafoodById(id);
        el.innerHTML = `<div class="icon">${sf.emoji}</div>
          <div class="info"><b>${k + 1} 号缸 · ${sf.name}</b><p>值 ${sf.sell}💰</p></div>`;
        const btn = document.createElement('button');
        btn.textContent = '捞回背包';
        btn.addEventListener('click', () => { g.takeFromAquarium(k); this.renderAquarium(); });
        el.appendChild(btn);
      } else {
        el.innerHTML = `<div class="icon">🫧</div>
          <div class="info"><b>${k + 1} 号缸</b><p>空着</p></div>`;
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
          <b>${a.name}<span class="ach-tier">${tier.name}</span></b>
          <div class="ach-desc">${a.desc}</div>
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
        <div class="ach-banner-top">🏅 成就达成 · ${tier.name}</div>
        <div class="ach-banner-name">${a.name}</div>
        <div class="ach-banner-desc">${a.desc}</div>
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
      const p = CODEX_POS;
      this.controls.target.set(p.x, p.y + 0.8, p.z);
      this.camera.position.set(p.x + 11, p.y + 11, p.z + 16);
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
    body.innerHTML = '';

    // 两个展区页签
    const tabs = document.createElement('div');
    tabs.id = 'codex-tabs';
    [['donate', '📖 基础图鉴'], ['gallery', '🏆 个人图鉴']].forEach(([id, label]) => {
      const tab = document.createElement('button');
      tab.className = 'shop-tab' + (this.codexTab === id ? ' active' : '');
      tab.textContent = label;
      tab.addEventListener('click', () => { this.codexTab = id; this.codexChoosing = null; this.renderCodex(); });
      tabs.appendChild(tab);
    });
    body.appendChild(tabs);

    if (this.codexTab === 'donate') this.renderCodexDonate(body);
    else this.renderCodexGallery(body);
  }

  // 基础图鉴：42 台收录
  renderCodexDonate(body) {
    const g = this.game;
    body.insertAdjacentHTML('beforeend',
      `<div id="codex-progress">📖 收录进度 ${g.codexCount()} / 42</div>`);
    // 只列 42 格体系里真正有展位的东西，花/罐头/料理/杂交果都不在其中
    const donatable = Object.entries(g.inventory)
      .filter(([k, n]) => n > 0 && g.codexKeys().includes(k));
    if (!donatable.length) {
      body.insertAdjacentHTML('beforeend',
        '<div class="bag-empty">背包里没有可收录的作物<br>去地里收点新鲜的来 🌱</div>');
      return;
    }
    donatable.sort(([a], [b]) => {
      const ia = keyInfo(a), ib = keyInfo(b);
      const rank = { undefined: 0, silver: 1, gold: 2 };
      return SEEDS.indexOf(ia.seed) - SEEDS.indexOf(ib.seed) || rank[ia.quality] - rank[ib.quality];
    });
    donatable.forEach(([key, n]) => {
      const info = keyInfo(key);
      const done = !!g.codex[key];
      const el = document.createElement('div');
      el.className = 'ws-slot' + (info.quality ? ` quality-${info.quality}` : '');
      el.innerHTML = `<div class="icon">${info.icon}</div>
        <div class="info"><b>${info.label} ×${n}</b><p>${done ? '✓ 已收录过' : `售价 ${info.price}💰 · 尚未收录`}</p></div>`;
      const btn = document.createElement('button');
      if (done) {
        btn.textContent = '已收录';
        btn.className = 'owned';
        btn.disabled = true;
        btn.style.cssText = 'border-color:#b8b8b8;background:#f3f3f3;color:#888;cursor:default;';
      } else {
        btn.textContent = '收录';
        btn.addEventListener('click', () => { g.donateCodex(key); this.renderCodex(); });
      }
      el.appendChild(btn);
      body.appendChild(el);
    });
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
        .filter(([key, n]) => n > 0 && !key.startsWith('p:') && !key.startsWith('x:') && !key.startsWith('k:') && key !== 'egg');
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
      back.textContent = '← 返回';
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
        btn.textContent = '摆放';
        btn.addEventListener('click', () => { this.codexChoosing = k; this.renderCodex(); });
        el.appendChild(btn);
      }
      body.appendChild(el);
    });
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
    seedTitle.textContent = '🌱 选花种（点空花圃种下）';
    body.appendChild(seedTitle);
    const seedBox = document.createElement('div');
    seedBox.className = 'gh-seeds';
    FLOWERS.forEach(f => {
      const b = document.createElement('button');
      b.className = 'gh-seed' + (this.selectedFlower === f.id ? ' active' : '');
      b.style.borderColor = POND_RARITY[f.rarity].color;
      b.innerHTML = `${f.emoji}<span>${f.name}</span><i>${f.seed}💰</i>`;
      b.addEventListener('click', () => { this.selectedFlower = f.id; this.renderGreenhouse(); });
      seedBox.appendChild(b);
    });
    body.appendChild(seedBox);

    // —— 花圃 ——
    const grown = g.flowerPlots.filter(Boolean).length;
    const plotTitle = document.createElement('div');
    plotTitle.className = 'gh-title';
    plotTitle.textContent = `🪴 花圃 ${grown}/${g.flowerPlots.length}`;
    body.appendChild(plotTitle);
    const plotBox = document.createElement('div');
    plotBox.className = 'gh-plots';
    g.flowerPlots.forEach((p, i) => {
      const cell = document.createElement('div');
      cell.className = 'gh-plot';
      if (!p) {
        cell.classList.add('empty');
        const sel = this.selectedFlower ? flowerById(this.selectedFlower) : null;
        cell.innerHTML = `<span class="gh-empty">空</span>`;
        if (sel) {
          const btn = document.createElement('button');
          btn.innerHTML = `种 ${sel.emoji}`;
          btn.addEventListener('click', () => { g.plantFlower(i, sel.id); this.renderGreenhouse(); });
          cell.appendChild(btn);
        }
      } else {
        const fl = flowerById(p.id);
        if (g.time >= p.readyAt) {
          cell.innerHTML = `<span>${fl.emoji}</span><b>${fl.name}</b>`;
          const btn = document.createElement('button');
          btn.className = 'gh-harvest';
          btn.textContent = '🌸 收';
          btn.addEventListener('click', () => { g.harvestFlower(i); this.renderGreenhouse(); });
          cell.appendChild(btn);
        } else {
          cell.innerHTML = `<span>🌱</span><b>${fl.name}</b><i>${fmtTime(p.readyAt - g.time)}</i>`;
        }
      }
      plotBox.appendChild(cell);
    });
    body.appendChild(plotBox);

    // —— 扎花台 ——
    this.bouquetSel = this.bouquetSel || [];
    const bqTitle = document.createElement('div');
    bqTitle.className = 'gh-title';
    bqTitle.textContent = `💐 扎花台（任选 ${BOUQUET_SIZE} 朵 ×${BOUQUET_MULT} 卖出）`;
    body.appendChild(bqTitle);
    const bag = document.createElement('div');
    bag.className = 'gh-seeds';
    const flowerKeys = Object.keys(g.inventory).filter(k => k.startsWith('f:') && g.inventory[k] > 0);
    if (!flowerKeys.length) {
      bag.innerHTML = `<p class="gh-empty">背包里还没有花，先种花收花吧</p>`;
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
    basket.innerHTML = `<b>待扎：</b>`;
    this.bouquetSel.forEach((k, idx) => {
      const chip = document.createElement('button');
      chip.textContent = keyInfo(k).icon;
      chip.title = '点击移除';
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
      btn.textContent = `💐 扎成花束卖出（${price}💰）`;
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
          <div id="kitchen-progress">🐟 咬钩了！！<small>${c.label}上的鱼值 ${c.value}💰，越肥的鱼越难拉</small></div>
          <div class="ws-slot done"><div class="icon">💪</div>
            <div class="info"><b>拉扯进度 ${pct}%</b>
            <div class="bar"><i style="width:${pct}%"></i></div></div></div>
          ${g.catchQueue.length ? `<p class="shop-note">后面还排着 ${g.catchQueue.length} 条鱼等着收！</p>` : ''}`);
        const reel = document.createElement('button');
        reel.id = 'reel-btn';
        reel.textContent = `🎣 收杆！还差 ${c.clicksLeft} 下`;
        reel.style.cssText = 'width:100%;padding:22px 0;border-radius:16px;border:3px solid #e09b3d;background:#ffe9b8;color:#8a5a2b;font-weight:800;font-size:19px;cursor:pointer;';
        reel.addEventListener('click', () => {
          g.reelClick();
          // 没拉完就只更新文字，别整块重绘打断连点
          const cc = g.pendingCatch;
          if (cc && cc.clicksLeft < cc.total && cc === c) {
            reel.textContent = `🎣 收杆！还差 ${cc.clicksLeft} 下`;
          } else this.renderFishing();
        });
        body.appendChild(reel);
        return;
      }
      const usingRod = g.fishingGear === 'rod';
      const gearCfg = usingRod ? ROD : CASTNET;
      const next = Math.max(0, Math.ceil(60 - g.fishingTimer));
      body.insertAdjacentHTML('beforeend', `
        <div id="kitchen-progress">${usingRod ? '🎣 鱼竿垂钓中…' : '🥅 渔网捕捞中…'}</div>
        <div class="ws-slot"><div class="icon">⏳</div>
          <div class="info"><b>下次动静还有 ${next} 秒</b>
          <div class="bar"><i style="width:${Math.round((1 - next / 60) * 100)}%"></i></div></div></div>
        <div class="ws-slot done"><div class="icon">${usingRod ? '🎣' : '🥅'}</div>
          <div class="info"><b>${usingRod ? '鱼竿' : '渔网'}</b><p>每分钟 ${gearCfg.chance * 100}% 咬钩，鱼值 ${gearCfg.min}~${gearCfg.max}💰（收杆点 ${gearCfg.min + 5}~${gearCfg.max + 5} 下）</p></div></div>
        <div class="ws-slot"><div class="icon">💰</div>
          <div class="info"><b>本次已钓 ${g.fishingEarned}💰</b></div></div>`);
      if ((g.items[usingRod ? 'castnet' : 'rod'] ?? 0) > 0) {
        const sw = document.createElement('button');
        sw.textContent = usingRod ? '🥅 换用渔网（搏大的）' : '🎣 换用鱼竿（求稳）';
        sw.style.cssText = 'width:100%;margin-bottom:8px;padding:10px;border-radius:12px;border:2px solid #d9b071;background:#fff8ec;color:#8a5a2b;font-weight:700;cursor:pointer;';
        sw.addEventListener('click', () => { g.switchGear(); this.renderFishing(); });
        body.appendChild(sw);
      }
      const btn = document.createElement('button');
      btn.textContent = '🎣 收竿结束';
      btn.style.cssText = 'width:100%;padding:11px;border-radius:12px;border:2px solid #e09b3d;background:#ffe9b8;color:#8a5a2b;font-weight:700;cursor:pointer;';
      btn.addEventListener('click', () => this.exitFishing());
      body.appendChild(btn);
      return;
    }

    // —— 钓鱼入口：选一件装备下水 ——
    [['rod', '🎣', '鱼竿垂钓', `${ROD.chance * 100}% 咬钩 · 鱼值 ${ROD.min}~${ROD.max}💰 · 求稳`],
     ['castnet', '🥅', '渔网捕捞', `${CASTNET.chance * 100}% 咬钩 · 鱼值 ${CASTNET.min}~${CASTNET.max}💰 · 搏大的`]]
      .forEach(([gear, icon, name, desc]) => {
        const owned = (g.items[gear] ?? 0) > 0;
        const row = document.createElement('div');
        row.className = 'ws-slot' + (owned ? ' done' : '');
        row.innerHTML = `<div class="icon">${icon}</div>
          <div class="info"><b>${name}</b><p>${owned ? desc : `未拥有 · 商场 ${itemById(gear).cost}💰`}</p></div>`;
        const btn = document.createElement('button');
        btn.textContent = owned ? '下水' : '没装备';
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
          <div class="info"><b>${d.name}</b><p style="color:${POND_RARITY[d.rarity].color}">${POND_RARITY[d.rarity].name}</p></div>`;
        const btn = document.createElement('button');
        btn.textContent = '摆放';
        btn.addEventListener('click', () => { g.placePondDecor(d.id); this.pondChoosing = false; this.renderFishing(); });
        el.appendChild(btn);
        body.appendChild(el);
      });
      const back = document.createElement('button');
      back.textContent = '← 返回';
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
          <div class="info"><b>${d.name}</b><p style="color:${POND_RARITY[d.rarity].color}">${POND_RARITY[d.rarity].name} · 塘里游着呢</p></div>`;
        const btn = document.createElement('button');
        btn.className = 'collect';
        btn.textContent = '收起';
        btn.addEventListener('click', () => { g.removePondDecor(id); this.renderFishing(); });
        el.appendChild(btn);
        body.appendChild(el);
      });
      const unplacedCount = ownedDecors.length - g.pondPlaced.length;
      if (unplacedCount > 0 && g.pondPlaced.length < POND_MAX_PLACED) {
        const btn = document.createElement('button');
        btn.textContent = `🦆 摆放装饰（${g.pondPlaced.length}/${POND_MAX_PLACED}）`;
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
        el.innerHTML = `<div class="icon">🌊</div><div class="info"><b>${k + 1} 号网位</b><p>空着</p></div>`;
        const btn = document.createElement('button');
        btn.textContent = '摆网';
        if (nets <= 0) { btn.disabled = true; btn.style.opacity = 0.5; }
        btn.addEventListener('click', () => { g.placeNet(k); this.renderFishing(); });
        el.appendChild(btn);
      } else {
        const remain = Math.max(0, n.readyAt - g.time);
        if (remain > 0) {
          const pct = Math.round((1 - remain / FISHING.time) * 100);
          el.innerHTML = `<div class="icon">🕸️</div>
            <div class="info"><b>${k + 1} 号网 捕捞中</b>
            <p>还剩 ${fmtTime(remain)}</p>
            <div class="bar"><i style="width:${pct}%"></i></div></div>`;
        } else {
          el.classList.add('done');
          el.innerHTML = `<div class="icon">🐟</div>
            <div class="info"><b>${k + 1} 号网 有动静了！</b><p>快收网看看捞到多少</p></div>`;
          const btn = document.createElement('button');
          btn.className = 'collect';
          btn.textContent = '收网';
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
      row.innerHTML = `<span class="skin-part">${def.emoji} ${def.name}</span>`;
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
        <div class="info"><b>${f.name}</b><p>${desc}</p></div>`;
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
    ['items', 'seeds', 'soil', 'water', 'decor', 'interior', 'pond']
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
      body.insertAdjacentHTML('beforeend', `<div class="ach-group">${tp('mall.seedBase', { n: CODEX_SEEDS.length })}</div>`);
      CODEX_SEEDS.forEach(seedRow);
      body.insertAdjacentHTML('beforeend', `<div class="ach-group">${tp('mall.seedSpecial', { n: SPECIAL_SEEDS.length })}</div>`);
      body.insertAdjacentHTML('beforeend', `<p class="shop-note">${t('mall.seedSpecialNote')}</p>`);
      SPECIAL_SEEDS.forEach(seedRow);
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
      back.textContent = '← 返回';
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
      addBtn('🧺 一键收取 <small>所有成熟作物收进背包 · 快捷键 H</small>', () => {
        g.harvestAll();
        menu.classList.add('hidden');
      });
      addBtn('💰 一键售卖 <small>跳到背包勾选，不想卖的点掉再确认 · 快捷键 S</small>', () => {
        this.openSellMode();
        menu.classList.add('hidden');
      });
      addBtn('🌱 一键播种 <small>从保存过的布局中选一个 · 快捷键 R</small>', () => {
        this.openQuickMenu('layouts');
      });
      addBtn(`💦 一键浇水 <small>全场灌满 · ${QUICK_WATER_COST}💰 · 快捷键 W</small>`, () => {
        g.waterAll();
        menu.classList.add('hidden');
      });
      addBtn('📖 游戏百科 <small>所有玩法规则都在这里</small>', () => {
        this.openWiki();
      });
      return;
    }

    // 布局列表
    if (!g.savedLayouts.length) {
      const p = document.createElement('div');
      p.style.cssText = 'padding:8px 12px;color:#a1834f;font-size:13px;line-height:1.8;text-align:center;';
      p.innerHTML = '还没有保存过布局<br>种好一茬后点「💾 保存当前布局」';
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
        `🌱 ${entry.name} <small>${summary} · 成本 ${cost}💰</small>`,
        () => { g.sowLayout(i); menu.classList.add('hidden'); });
      const del = document.createElement('span');
      del.textContent = '✕';
      del.style.cssText = 'position:absolute;top:6px;right:10px;color:#c9a97e;cursor:pointer;font-size:13px;';
      del.addEventListener('click', (e) => { e.stopPropagation(); g.deleteLayout(i); this.openQuickMenu('layouts'); });
      b.style.position = 'relative';
      b.appendChild(del);
    });
    addBtn('← 返回', () => this.openQuickMenu('main'));
  }

  /* ---------- 挂机 ---------- */

  setAfk(on) {
    this.game.paused = on;
    this.game.save();
    $('#afk-overlay').classList.toggle('hidden', !on);
    if (on) {
      this.closePanels();
      sfx.play('pause');
    } else {
      this.toast('☀️ 解冻！世界继续转动');
      sfx.play('resume');
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
          ${SEEDS.map(s => `<tr><td>${s.emoji}${seedName(s)}${s.special ? ' ✨' : ''}</td><td>${s.cost}</td><td>${s.sell}</td><td>${fmtTime(s.growTime)}</td><td>${s.unlock || dft}</td></tr>`).join('')}</table>`,
      } },
      { icon: '✨', k: 'special', v: {
        n: SPECIAL_SEEDS.length, base: CODEX_SEEDS.length,
        list: SPECIAL_SEEDS.map(s => s.emoji + seedName(s)).join('、'),
      } },
      { icon: '✨', k: 'quality', v: { gold: pct(GOLD_CHANCE), silver: pct(SILVER_CHANCE) } },
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
        gain: pct(BANK.gainChance), lose: pct(1 - BANK.gainChance), min: BANK.magMin, max: BANK.magMax,
      } },
      { icon: '📖', k: 'codex', v: { base: CODEX_SEEDS.length, slots: CODEX_SEEDS.length * 3 } },
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
      $('#poison-use').textContent = n > 0 ? `💉 立刻解毒（${n}）` : '💉 没有解毒剂！';
    }
    $('#dead-overlay').classList.toggle('hidden', !dead);
    if (dead) {
      $('#dead-timer').textContent = `复活倒计时 ${g.reviveLeft()} 秒`;
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

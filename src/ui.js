import { SEEDS, SOILS, WATER_LEVELS, DECORS, seedById, QUALITIES, WORKSHOP, keyInfo, QUICK_WATER_COST, ITEMS, itemById, FURNITURE, INTERIOR_POS, FISHING, CODEX_POS, DISHES, dishPrice, ingredientKey, ROD, CASTNET, GOLD_CHANCE, SILVER_CHANCE, DISH_MULT, BANK, DROUGHT, RAIN, PEST, POISON, DAMAGE, UNLOCK_COST, EGG, NIGHT_SLOW, DAY_CYCLE } from './config.js';
import { POND_DECORS, POND_RARITY, POND_MAX_PLACED, pondDecorById, HYBRIDS, hybridById, HYBRID_POS, HYBRID_TIME, HYBRID_SLOTS, PETS, petById, PET_DECORS, PET_POS } from './config.js';
import { music } from './music.js';

// 秒数显示成「X分X秒」
const fmtTime = (s) => s >= 60 ? `${Math.floor(s / 60)}分${s % 60 ? `${Math.round(s % 60)}秒` : ''}` : `${Math.ceil(s)}秒`;

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

    game.onToast = (msg) => this.toast(msg);
    game.onState = () => this.refresh();

    this.bindToolbar();
    this.refresh();
  }

  /* ---------- 工具栏 ---------- */

  bindToolbar() {
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => this.setTool(btn.dataset.tool));
    });
    $('#bag-btn').addEventListener('click', () => {
      const wasHidden = $('#bag').classList.contains('hidden');
      this.closePanels();
      if (wasHidden) { $('#bag').classList.remove('hidden'); this.renderBag(); }
    });
    $('#bag-close').addEventListener('click', () => $('#bag').classList.add('hidden'));
    $('#ws-close').addEventListener('click', () => $('#ws').classList.add('hidden'));
    $('#mall-close').addEventListener('click', () => $('#mall').classList.add('hidden'));
    $('#items-close').addEventListener('click', () => $('#items').classList.add('hidden'));
    $('#house-close').addEventListener('click', () => this.exitHouse());
    $('#fish-close').addEventListener('click', () => $('#fish').classList.add('hidden'));
    $('#bank-close').addEventListener('click', () => $('#bank').classList.add('hidden'));
    $('#kitchen-close').addEventListener('click', () => $('#kitchen').classList.add('hidden'));
    $('#wiki-close').addEventListener('click', () => $('#wiki').classList.add('hidden'));
    $('#hybrid-close').addEventListener('click', () => this.exitHybridLab());
    $('#pet-close').addEventListener('click', () => this.exitPetRoom());
    $('#codex-close').addEventListener('click', () => this.exitCodex());
    $('#items-btn').addEventListener('click', () => {
      const panel = $('#items');
      const wasHidden = panel.classList.contains('hidden');
      this.closePanels();
      if (wasHidden) { panel.classList.remove('hidden'); this.renderItems(); }
    });
    // 工坊/鱼网倒计时刷新
    setInterval(() => {
      if (!$('#ws').classList.contains('hidden')) this.renderWorkshop();
      if (!$('#hybrid').classList.contains('hidden')) {
        this.renderHybrid();
        this.game.updateHybridVisuals(); // 培养罩里的作物随进度长大
      }
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
    // 挂机模式
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
      if (k === 's') this.game.sellAll();
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
      shovel: '点击作物或装饰铲除',
    };
    if (tips[tool]) this.toast(tips[tool]);
  }

  renderSeedPicker() {
    const wrap = $('#seed-picker');
    wrap.innerHTML = '';
    this.game.unlockedSeeds.forEach(id => {
      const s = seedById(id);
      const chip = document.createElement('div');
      chip.className = 'seed-chip' + (this.selectedSeed === id ? ' selected' : '');
      chip.innerHTML = `<b>${s.emoji}</b>${s.name}<br><small>${s.cost}💰 卖${s.sell}</small>`;
      chip.addEventListener('click', () => { this.selectedSeed = id; this.renderSeedPicker(); });
      wrap.appendChild(chip);
    });
  }

  /* ---------- 背包 ---------- */

  renderBag() {
    const body = $('#bag-body');
    const g = this.game;
    body.innerHTML = '';
    const entries = Object.entries(g.inventory).filter(([, n]) => n > 0);
    if (!entries.length) {
      body.innerHTML = '<div class="bag-empty">背包空空如也<br>去收获点作物吧 🌱</div>';
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
      const el = document.createElement('div');
      el.className = 'bag-item' + (quality ? ` quality-${quality}` : '');
      el.innerHTML = `<div class="icon">${info.icon}</div>
        <div class="info"><b>${info.label} ×${n}</b><p>单价 ${info.price}💰 · 全卖 ${info.price * n}💰</p></div>`;
      const sellOne = document.createElement('button');
      sellOne.textContent = '卖1个';
      sellOne.addEventListener('click', () => { g.sellCrop(key, 1); this.renderBag(); });
      const sellAll = document.createElement('button');
      sellAll.className = 'sell-all';
      sellAll.textContent = '全卖';
      sellAll.addEventListener('click', () => { g.sellCrop(key, n); this.renderBag(); });
      el.append(sellOne, sellAll);
      body.appendChild(el);
    });
  }

  /* ---------- 面板统一开关 ---------- */

  closePanels() {
    ['#bag', '#ws', '#mall', '#items', '#fish', '#bank', '#kitchen', '#wiki', '#hybrid', '#pet', '#quick-menu']
      .forEach(sel => $(sel).classList.add('hidden'));
    this.exitHouse(); // 打开别的面板时顺便走出房间
    this.exitCodex();
    this.exitFishing(); // 干别的就等于收竿
    this.exitHybridLab();
    this.exitPetRoom();
  }

  inside() { return this.inHouse || this.inCodex || this.inFishing || this.inHybridLab || this.inPetRoom; }

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
    if (!this.inFishing) return;
    this.inFishing = false;
    this.game.stopFishing();
    $('#fish').classList.add('hidden');
    if (this._fishCamBackup) {
      this.camera.position.copy(this._fishCamBackup.pos);
      this.controls.target.copy(this._fishCamBackup.target);
      this.controls.minDistance = this._fishCamBackup.minD;
      this.controls.update();
      this._fishCamBackup = null;
    }
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
    const donatable = Object.entries(g.inventory)
      .filter(([k, n]) => n > 0 && !k.startsWith('p:') && !k.startsWith('x:') && !k.startsWith('k:') && !k.startsWith('h:') && k !== 'egg');
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
        .filter(([key, n]) => n > 0 && !key.startsWith('p:') && !key.startsWith('x:') && !key.startsWith('k:') && !key.startsWith('h:') && key !== 'egg');
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
        ? `已解锁 Lv.${lv}/3 · 正在展示「${d.levelNames[shown - 1]}」`
        : `${d.levelNames[0]} · ${d.cost}💰（之后可升到 3 级）`;
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
      } else if (lv < 3) {
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
      `<div id="kitchen-progress">🍳 共 50 道料理 · 现在能做 ${cookableCount} 道</div>`);

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
      const btn = document.createElement('button');
      btn.textContent = '制作';
      btn.disabled = !ready;
      if (ready) btn.addEventListener('click', () => { g.cookDish(dish.id); this.renderKitchen(); });
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

    FURNITURE.forEach(f => {
      const lv = g.furniture[f.id] ?? 0;
      const shown = lv ? Math.min(g.furnitureStyle[f.id] ?? lv, lv) : 0;
      const el = document.createElement('div');
      el.className = 'fur-row' + (lv ? '' : ' locked');
      const desc = lv
        ? `已解锁 Lv.${lv}/3 · 正在展示「${f.levelNames[shown - 1]}」`
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
        btn.addEventListener('click', () => { if (g.sleep()) this.renderHouse(); });
        el.appendChild(btn);
      }
      if (lv && lv < 3) {
        const btn = document.createElement('button');
        btn.textContent = `升级 ${f.up[lv - 1]}💰`;
        btn.addEventListener('click', () => { g.upgradeFurniture(f.id); this.renderHouse(); });
        el.appendChild(btn);
      } else if (lv >= 3) {
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
    [['items', '道具'], ['seeds', '种子'], ['soil', '土壤'], ['water', '水源'], ['decor', '装饰'], ['interior', '内饰'], ['pond', '水塘']]
      .forEach(([id, label]) => {
        const tab = document.createElement('button');
        tab.className = 'shop-tab' + (this.mallTab === id ? ' active' : '');
        tab.textContent = label;
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
      qtyBox.innerHTML = '<span>一次买</span>';
      const input = document.createElement('input');
      input.id = 'mall-qty';
      input.type = 'number';
      input.min = '1';
      input.value = this.mallQty ?? 1;
      input.addEventListener('input', () => {
        this.mallQty = Math.max(1, Math.floor(Number(input.value) || 1));
        body.querySelectorAll('[data-price]').forEach(b => {
          b.textContent = `买 ${this.mallQty} 个 · ${Number(b.dataset.price) * this.mallQty}💰`;
        });
      });
      qtyBox.appendChild(input);
      qtyBox.insertAdjacentHTML('beforeend', '<span>个</span>');
      body.appendChild(qtyBox);
      const qty = () => Math.max(1, Math.floor(Number(input.value) || 1));
      ITEMS.forEach(it => {
        const owned = g.items[it.id] ?? 0;
        // 永久工具只买一件
        if (it.once) {
          item(it.emoji, it.name, it.desc,
            owned ? '已拥有' : `${it.cost}💰`,
            owned ? null : () => { g.buyItem(it.id, 1); this.renderMall(); },
            owned ? 'owned' : '');
          return;
        }
        const btn = item(it.emoji, `${it.name}${owned ? `（持有 ${owned}）` : ''}`, it.desc,
          `买 ${qty()} 个 · ${it.cost * qty()}💰`,
          () => { g.buyItem(it.id, qty()); this.renderMall(); });
        btn.dataset.price = it.cost;
      });
    }

    if (this.mallTab === 'seeds') {
      SEEDS.forEach(s => {
        const owned = g.unlockedSeeds.includes(s.id);
        item(s.emoji, s.name,
          `种子 ${s.cost}💰 · 卖出 ${s.sell}💰 · 生长 ${fmtTime(s.growTime)}`,
          owned ? '已解锁' : `解锁 ${s.unlock}💰`,
          owned ? null : () => { g.unlockSeed(s.id); this.renderMall(); },
          owned ? 'owned' : '');
      });
    }

    if (this.mallTab === 'soil') {
      SOILS.forEach((s, i) => {
        const desc = `生长速度 ×${s.speed}${s.yield > 1 ? ` · 收成 ×${s.yield}` : ''}${i > 0 ? ` · 每格 ${s.cost}💰` : ' · 初始土壤'}`;
        if (i === 0) { item('🟫', s.name, desc, '默认', null, 'owned'); return; }
        const selected = this.selectedSoil === i;
        item('🟫', s.name, desc,
          selected ? '✓ 已选择' : '选择',
          () => { this.selectedSoil = i; this.renderMall(); },
          selected ? '' : 'owned');
      });
      const btn = document.createElement('button');
      btn.textContent = `🛠 进入土壤升级模式（${SOILS[this.selectedSoil].name}）`;
      btn.style.cssText = 'width:100%;padding:10px;border-radius:12px;border:2px solid #e09b3d;background:#ffe9b8;color:#8a5a2b;font-weight:700;cursor:pointer;';
      btn.addEventListener('click', () => { this.setTool('soil'); $('#mall').classList.add('hidden'); });
      body.appendChild(btn);
    }

    if (this.mallTab === 'water') {
      WATER_LEVELS.forEach((w, i) => {
        const state = i < g.waterLevel ? '已拥有' : i === g.waterLevel ? '当前' : null;
        item('💧', w.name, w.desc,
          state ?? `升级 ${w.cost}💰`,
          state || i !== g.waterLevel + 1 ? null : () => { g.buyWaterLevel(); this.renderMall(); },
          state ? 'owned' : '');
      });
    }

    if (this.mallTab === 'decor') {
      DECORS.forEach(d => {
        item(d.emoji, d.name, `${d.cost}💰`,
          '摆放', () => { this.setTool('decor', { decorId: d.id }); $('#mall').classList.add('hidden'); });
      });
    }

    if (this.mallTab === 'pond') {
      ['common', 'rare', 'epic', 'legend'].forEach(rar => {
        POND_DECORS.filter(d => d.rarity === rar).forEach(d => {
          const owned = !!g.pondOwned[d.id];
          const badge = `<span style="color:${POND_RARITY[rar].color};font-weight:700">【${POND_RARITY[rar].name}】</span>`;
          const el = document.createElement('div');
          el.className = 'shop-item';
          el.innerHTML = `<div class="icon">🦆</div>
            <div class="info"><b>${d.name}</b><p>${badge} 摆进钓鱼水塘，会动的</p></div>`;
          const btn = document.createElement('button');
          btn.textContent = owned ? '已拥有' : `${d.cost}💰`;
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
        item(f.emoji, f.name,
          lv ? `已拥有 · Lv.${lv}（去小屋里升级）` : `${f.levelNames[0]} · 之后可升到 3 级`,
          lv ? '已购买' : `${f.cost}💰`,
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
      btn.textContent = '使用';
      btn.addEventListener('click', () => { g.useItem(item.id); this.renderItems(); });
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
      const raw = Object.entries(g.inventory)
        .filter(([k, n]) => !k.startsWith('p:') && !k.startsWith('x:') && !k.startsWith('k:') && !k.startsWith('h:') && k !== 'egg' && n > 0);
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
      addBtn('💰 一键售卖 <small>背包里所有东西全部卖掉 · 快捷键 S</small>', () => {
        g.sellAll();
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
    } else {
      this.toast('☀️ 解冻！世界继续转动');
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
    const sections = [
      {
        icon: '🌱', title: '种田基础',
        html: `流程：<b>选种子 → 点空地种下 → 浇水保湿 → 等成熟 → 收获进背包 → 出售</b>。<br>
          没浇水的地作物不生长（湿润保持 45 秒）。二层农田每格 <b>${UNLOCK_COST}💰</b> 解锁（绿边标记）。<br>
          <table class="wtable"><tr><th>土壤</th><th>生长速度</th><th>收成</th><th>每格价</th></tr>
          ${SOILS.map(s => `<tr><td>${s.name}</td><td>×${s.speed}</td><td>×${s.yield}</td><td>${s.cost || '默认'}</td></tr>`).join('')}</table>
          <table class="wtable"><tr><th>水源</th><th>效果</th><th>价格</th></tr>
          ${WATER_LEVELS.map(w => `<tr><td>${w.name}</td><td>${w.desc}</td><td>${w.cost || '默认'}</td></tr>`).join('')}</table>
          升到自动灌溉后，浇水键专门用来找恐龙虾卵（每浇一格 ${pct(EGG.chance)} 出一颗，卖 ${EGG.sell}💰）。`,
      },
      {
        icon: '🥕', title: '作物一览',
        html: `<table class="wtable"><tr><th>作物</th><th>种子</th><th>卖价</th><th>生长</th><th>解锁</th></tr>
          ${SEEDS.map(s => `<tr><td>${s.emoji}${s.name}</td><td>${s.cost}</td><td>${s.sell}</td><td>${fmtTime(s.growTime)}</td><td>${s.unlock || '默认'}</td></tr>`).join('')}</table>`,
      },
      {
        icon: '✨', title: '稀有品质',
        html: `种下的一刻暗中判定品质：<b>黄金 ${pct(GOLD_CHANCE)}（卖价 ×3）、白银 ${pct(SILVER_CHANCE)}（×2）</b>，整株带淡金/淡银镀层。<br>
          商场买不到，纯看脸。🧪 幸运药剂可让指定空地下次播种概率<b>翻倍</b>。<br>
          稀有作物可以：直接卖 / 进工坊 / 做料理 / 收录图鉴 / 摆上个人金台。`,
      },
      {
        icon: '⏰', title: '时间与天气',
        html: `现实 <b>${DAY_CYCLE / 60} 分钟 = 游戏一天</b>（白天 6:00~18:00）。夜晚生长 ×${NIGHT_SLOW}。<br>
          每天早上 6 点掷天气：<b>晴 ${pct(1 - DROUGHT.chance - RAIN.chance)} / 暴雨 ${pct(RAIN.chance)} / 大旱 ${pct(DROUGHT.chance)}</b>。<br>
          大旱生长 ×1/3；恶劣天气收获的作物全部「<b>生长不良</b>」只卖半价，且会随机毁掉 ${DAMAGE.min}~${DAMAGE.max} 块地（晒裂/水泡，不能种）。<br>
          天灾随当天天气结束<b>自动恢复</b>；急用可花 🔧 恢复器当场修。<br>
          🛏 睡觉：夜里睡到早 6 点，白天午睡到晚 6 点，期间生长加工照常。😴 挂机则冻结整个世界。`,
      },
      {
        icon: '🐛', title: '虫害',
        html: `作物成熟时 <b>${pct(PEST.chance)}</b> 概率生虫（头顶飘着小甲虫）。<br>
          不处理就收 → 变生长不良半价。<br>
          <b>直接点击虫子免费拍掉</b>；🧴 杀虫剂（${itemById('pesticide').cost}💰）一键清光全场。<br>
          ⚠️ <b>徒手拍虫有风险</b>：每次 ${Math.round(POISON.chance * 100)}% 概率被咬中毒！中毒后必须在 <b>${POISON.timeout} 秒</b>内用 💉 解毒剂（${itemById('antidote').cost}💰），
          否则毒发身亡，要躺 <b>${POISON.reviveTime} 秒</b>才能复活——这期间点不了、按不了，连视角都转不了。<br>
          想省心就用杀虫剂，想省钱就随身带几支解毒剂。`,
      },
      {
        icon: '🏭', title: '工坊与料理',
        html: `<b>🏭 工坊</b>：${WORKSHOP.ingredients} 个同种作物加工 ${WORKSHOP.time} 秒 → 1 个罐头，卖价为原料总价 ×${WORKSHOP.bonus}（即增值 50%）。离线照常加工。<br>
          <b>🍳 料理工坊</b>：${DISHES.length} 道料理，凑齐配方指定品质的作物即可制作，卖价是原料单卖的 <b>×${DISH_MULT}</b>。<br>
          生长不良的作物两边都不收；罐头和料理不能二次加工。<br>
          <b>变现倍率梯度</b>：直接卖 1× ＜ 罐头 ${WORKSHOP.bonus}× ＜ 料理 ${DISH_MULT}× ＜ 杂交 约5×。`,
      },
      {
        icon: '🧬', title: '杂交室',
        html: `点击玻璃穹顶实验室进入 3D 大厅，<b>${HYBRID_SLOTS} 个培养罩</b>可同时培养 ${HYBRID_SLOTS} 个杂交作物。<br>
          流程：<b>选配方 → 消耗两种指定品质的作物 → 培养 ${HYBRID_TIME / 60} 分钟 → 取出进背包</b>。离线照常培养，罩里的作物会随进度慢慢长大。<br>
          共 <b>${HYBRIDS.length} 种</b>杂交作物，卖价约为原料总价的 <b>5 倍</b>，是全游戏最高倍率的变现方式。<br>
          杂交作物不能做罐头、不能收录图鉴、不能上展示台——生来就是为了卖大钱。<br>
          <table class="wtable"><tr><th>杂交作物</th><th>配方</th><th>卖价</th></tr>
          ${HYBRIDS.map(h => {
            const nameOf = ([sid, q]) => `${['', '白银', '黄金'][q]}${seedById(sid).name}`;
            const same = h.a[0] === h.b[0] && h.a[1] === h.b[1];
            return `<tr><td>${h.emoji}${h.name}</td><td>${same ? `${nameOf(h.a)} ×2` : `${nameOf(h.a)} + ${nameOf(h.b)}`}</td><td>${h.sell}</td></tr>`;
          }).join('')}</table>`,
      },
      {
        icon: '🎣', title: '水塘钓鱼',
        html: `<b>🕸️ 抓鱼网</b>（${itemById('net').cost}💰/张）：摆进水塘 ${FISHING.time / 60} 分钟，随机开出 ${FISHING.rewardMin}~${FISHING.rewardMax}💰，最多同时 ${FISHING.slots} 张，是亏是赚看脸。<br>
          主动钓鱼要<b>二选一带装备下水</b>（钓鱼中可随时切换）：<br>
          <b>🎣 鱼竿</b>（${itemById('rod').cost}💰，永久）：每分钟 ${pct(ROD.chance)} 咬钩，鱼值 ${ROD.min}~${ROD.max}💰——求稳。<br>
          <b>🥅 渔网</b>（${itemById('castnet').cost}💰，永久）：每分钟 ${pct(CASTNET.chance)} 咬钩，鱼值 ${CASTNET.min}~${CASTNET.max}💰——搏大的。<br>
          咬钩后要狂点收杆：<b>点击次数 = 鱼价 + 5</b>。钓鱼时干别的 = 收竿，钩上的鱼会跑。`,
      },
      {
        icon: '🏦', title: '银行',
        html: `黑房子银行：存取自由，金额自填。<br>
          每天结束对存款结算：<b>${pct(BANK.gainChance)} 赚 ${BANK.magMin}~${BANK.magMax}💰，${pct(1 - BANK.gainChance)} 亏 ${BANK.magMin}~${BANK.magMax}💰</b>，离线也照常。<br>
          HUD 黑色钱袋显示存款余额。`,
      },
      {
        icon: '📖', title: '图鉴大楼',
        html: `<b>基础图鉴</b>：${SEEDS.length} 作物 × 3 品质 = 42 个说明台。捐一个对应品质的新鲜作物即可收录（重复不收，罐头/生长不良/料理不收），台上立起模型和数据说明牌。<br>
          <b>个人图鉴</b>：红毯贵宾区 10 座金台，摆你最得意的作物，随摆随收。`,
      },
      {
        icon: '🏠', title: '我的小屋',
        html: `点房子进 3D 房间。🛏 床免费自带，可睡觉跳时间。<br>
          ${FURNITURE.length} 件家具（商场「内饰」页购买），每件升到 3 级，<b>三种外观解锁后随意切换混搭</b>。<br>
          「🔧 布置模式」里按住家具拖动摆放、↻ 旋转，打造自己的家。`,
      },
      {
        icon: '🧰', title: '道具一览',
        html: `<table class="wtable"><tr><th>道具</th><th>价格</th><th>效果</th></tr>
          ${ITEMS.map(i => `<tr><td>${i.emoji}${i.name}</td><td>${i.cost}${i.once ? '(永久)' : ''}</td><td style="text-align:left">${i.desc}</td></tr>`).join('')}</table>
          🌀 小风车装饰每台每分钟发电 +1💰，离线也发（上限 12 小时）。💡 小灯夜里会亮。🎩 稻草人纯装饰。`,
      },
      {
        icon: '⌨️', title: '快捷键',
        html: `<b>H</b> 一键收取全部成熟作物<br><b>S</b> 一键卖光背包（稀有和罐头也卖，慎按！）<br>
          <b>R</b> 打开布局列表一键播种（先用 💾 保存布局）<br><b>W</b> 一键浇水（${QUICK_WATER_COST}💰，全场+找🦐卵）<br>
          <b>Esc</b> 关闭菜单 / 出屋出馆收竿`,
      },
    ];
    sections.forEach((s, i) => {
      const sec = document.createElement('div');
      sec.className = 'wiki-sec' + (this.wikiOpenSec === i ? ' open' : '');
      sec.innerHTML = `<div class="sec-head">${s.icon} ${s.title}<span class="arrow">${this.wikiOpenSec === i ? '▲' : '▼'}</span></div>
        <div class="sec-body">${s.html}</div>`;
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
    menu.innerHTML = '<div class="music-head">⚙️ 设置</div>';
    const row = (icon, label, on, onClick) => {
      const el = document.createElement('div');
      el.className = 'music-row';
      el.innerHTML = `<b>${icon} ${label}</b>`;
      const btn = document.createElement('button');
      btn.className = on ? 'on' : 'off';
      btn.textContent = on ? '开' : '关';
      btn.addEventListener('click', () => { onClick(); this.renderSettingsMenu(); });
      el.appendChild(btn);
      menu.appendChild(el);
    };
    row('🎵', '背景音乐', music.enabled, () => music.toggle());
    row('💬', '消息提示', this.tipsOn, () => {
      this.tipsOn = !this.tipsOn;
      localStorage.setItem('farm-tips-on', this.tipsOn ? '1' : '0');
      if (this.tipsOn) this.toast('💬 提示已打开');
    });
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
    music.listTracks().forEach(t => {
      const row = document.createElement('div');
      row.className = 'music-row' + (music.track?.id === t.id && music.playing ? ' current' : '');
      row.innerHTML = `<b>${music.track?.id === t.id && music.playing ? '🎵 ' : ''}${t.name}</b>`;
      const once = document.createElement('button');
      once.textContent = '▶ 一次';
      once.addEventListener('click', () => {
        music.playTrack(t.id, 'once');
        this.renderMusicMenu();
      });
      const loop = document.createElement('button');
      loop.textContent = '🔁 循环';
      loop.addEventListener('click', () => {
        music.playTrack(t.id, 'loop');
        this.toast(`🔁 循环播放《${t.name}》`);
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

  /* ---------- 状态刷新 ---------- */

  refresh() {
    $('#coin-count').textContent = this.game.coins;
    $('#bank-count').textContent = this.game.bank;
    if (!$('#bank').classList.contains('hidden')) this.renderBank();
    if (!$('#kitchen').classList.contains('hidden')) this.renderKitchen();
    if (!$('#hybrid').classList.contains('hidden')) this.renderHybrid();
    if (!$('#pet').classList.contains('hidden')) this.renderPetRoom();
    if (!$('#codex').classList.contains('hidden')) this.renderCodex();
    $('#water-badge').textContent = `💧 ${WATER_LEVELS[this.game.waterLevel].name}`;
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

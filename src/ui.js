import { SEEDS, SOILS, WATER_LEVELS, DECORS, seedById, QUALITIES, WORKSHOP, keyInfo, QUICK_WATER_COST, ITEMS, itemById, FURNITURE } from './config.js';

const $ = (sel) => document.querySelector(sel);

export class UI {
  constructor(game) {
    this.game = game;
    this.tool = 'hand';        // hand | plant | water | shovel | soil | decor
    this.selectedSeed = 'sweetpot';
    this.selectedSoil = 1;   // 土壤商店里选好目标土壤，再进升级模式
    this.selectedDecor = null;
    this.shopTab = 'seeds';

    game.onToast = (msg) => this.toast(msg);
    game.onState = () => this.refresh();

    this.bindToolbar();
    this.bindShop();
    this.refresh();
  }

  /* ---------- 工具栏 ---------- */

  bindToolbar() {
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => this.setTool(btn.dataset.tool));
    });
    $('#shop-btn').addEventListener('click', () => {
      const wasHidden = $('#shop').classList.contains('hidden');
      this.closePanels();
      if (wasHidden) { $('#shop').classList.remove('hidden'); this.renderShop(); }
    });
    $('#shop-close').addEventListener('click', () => $('#shop').classList.add('hidden'));
    $('#bag-btn').addEventListener('click', () => {
      const wasHidden = $('#bag').classList.contains('hidden');
      this.closePanels();
      if (wasHidden) { $('#bag').classList.remove('hidden'); this.renderBag(); }
    });
    $('#bag-close').addEventListener('click', () => $('#bag').classList.add('hidden'));
    $('#ws-close').addEventListener('click', () => $('#ws').classList.add('hidden'));
    $('#disp-close').addEventListener('click', () => $('#disp').classList.add('hidden'));
    $('#mall-close').addEventListener('click', () => $('#mall').classList.add('hidden'));
    $('#items-close').addEventListener('click', () => $('#items').classList.add('hidden'));
    $('#house-close').addEventListener('click', () => $('#house').classList.add('hidden'));
    $('#items-btn').addEventListener('click', () => {
      const panel = $('#items');
      const wasHidden = panel.classList.contains('hidden');
      this.closePanels();
      if (wasHidden) { panel.classList.remove('hidden'); this.renderItems(); }
    });
    // 工坊倒计时刷新
    setInterval(() => {
      if (!$('#ws').classList.contains('hidden')) this.renderWorkshop();
    }, 500);
    // 左上角时钟
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
    // 工具栏保存布局按钮
    $('#save-layout-btn').addEventListener('click', () => this.game.saveLayout());
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
    });
    window.addEventListener('keydown', (e) => {
      if (e.repeat || this.game.paused) return; // 挂机中快捷键也冻结
      const k = e.key.toLowerCase();
      if (k === 'r') this.openQuickMenu('layouts'); // R 直接打开布局列表
      if (k === 'w') this.game.waterAll();
      if (k === 'h') this.game.harvestAll();
      if (k === 's') this.game.sellAll();
      if (k === 'escape') $('#quick-menu').classList.add('hidden');
    });
  }

  setTool(tool, opts = {}) {
    this.tool = tool;
    if (opts.decorId) this.selectedDecor = opts.decorId;
    document.querySelectorAll('.tool-btn[data-tool]').forEach(b =>
      b.classList.toggle('active', b.dataset.tool === tool));
    $('#seed-picker').classList.toggle('hidden', tool !== 'plant');
    $('#quick-menu').classList.add('hidden');
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

  /* ---------- 商店 ---------- */

  bindShop() {
    document.querySelectorAll('.shop-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.shopTab = tab.dataset.tab;
        document.querySelectorAll('.shop-tab').forEach(t =>
          t.classList.toggle('active', t === tab));
        this.renderShop();
      });
    });
  }

  renderShop() {
    const body = $('#shop-body');
    const g = this.game;
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
    };

    if (this.shopTab === 'seeds') {
      SEEDS.forEach(s => {
        const owned = g.unlockedSeeds.includes(s.id);
        item(s.emoji, s.name,
          `种子 ${s.cost}💰 · 卖出 ${s.sell}💰 · 生长 ${s.growTime}秒`,
          owned ? '已解锁' : `解锁 ${s.unlock}💰`,
          owned ? null : () => { g.unlockSeed(s.id); this.renderShop(); },
          owned ? 'owned' : '');
      });
    }

    if (this.shopTab === 'soil') {
      const note = document.createElement('p');
      note.className = 'shop-note';
      note.textContent = '先「选择」想要的土壤，再点下方按钮进入升级模式，点击地块直接升到所选土壤（可以跳级）。';
      body.appendChild(note);
      SOILS.forEach((s, i) => {
        const desc = `生长速度 ×${s.speed}${s.yield > 1 ? ` · 收成 ×${s.yield}` : ''}${i > 0 ? ` · 每格 ${s.cost}💰` : ' · 初始土壤'}`;
        if (i === 0) { item('🟫', s.name, desc, '默认', null, 'owned'); return; }
        const selected = this.selectedSoil === i;
        item('🟫', s.name, desc,
          selected ? '✓ 已选择' : '选择',
          () => { this.selectedSoil = i; this.renderShop(); },
          selected ? '' : 'owned');
      });
      const btn = document.createElement('button');
      btn.textContent = `🛠 进入土壤升级模式（${SOILS[this.selectedSoil].name}）`;
      btn.style.cssText = 'width:100%;padding:10px;border-radius:12px;border:2px solid #e09b3d;background:#ffe9b8;color:#8a5a2b;font-weight:700;cursor:pointer;';
      btn.addEventListener('click', () => { this.setTool('soil'); $('#shop').classList.add('hidden'); });
      body.appendChild(btn);
    }

    if (this.shopTab === 'water') {
      WATER_LEVELS.forEach((w, i) => {
        const state = i < g.waterLevel ? '已拥有' : i === g.waterLevel ? '当前' : null;
        item('💧', w.name, w.desc,
          state ?? `升级 ${w.cost}💰`,
          state || i !== g.waterLevel + 1 ? null : () => { g.buyWaterLevel(); this.renderShop(); },
          state ? 'owned' : '');
      });
    }

    if (this.shopTab === 'interior') {
      const note = document.createElement('p');
      note.className = 'shop-note';
      note.textContent = '买回来的家具直接摆进 🏠 小屋，进屋后还能花钱升级到 3 级。';
      body.appendChild(note);
      FURNITURE.filter(f => !f.free).forEach(f => {
        const lv = g.furniture[f.id] ?? 0;
        item(f.emoji, f.name,
          lv ? `已拥有 · Lv.${lv}（去小屋里升级）` : `${f.levelNames[0]} · 之后可升到 3 级`,
          lv ? '已购买' : `${f.cost}💰`,
          lv ? null : () => { g.buyFurniture(f.id); this.renderShop(); },
          lv ? 'owned' : '');
      });
    }

    if (this.shopTab === 'decor') {
      const note = document.createElement('p');
      note.className = 'shop-note';
      note.textContent = '点「摆放」后，点击盒子四周的装饰台放置（放置时扣钱）。共 10 个装饰台。';
      body.appendChild(note);
      DECORS.forEach(d => {
        item(d.emoji, d.name, `${d.cost}💰`,
          '摆放', () => { this.setTool('decor', { decorId: d.id }); $('#shop').classList.add('hidden'); });
      });
    }
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
    ['#shop', '#bag', '#ws', '#disp', '#mall', '#items', '#house', '#quick-menu']
      .forEach(sel => $(sel).classList.add('hidden'));
  }

  /* ---------- 我的小屋 ---------- */

  openHouse() {
    this.closePanels();
    $('#house').classList.remove('hidden');
    this.renderHouse();
  }

  renderHouse() {
    const g = this.game;
    const room = $('#house-room');
    const body = $('#house-body');
    room.innerHTML = '';
    body.innerHTML = '';

    // 屋内俯视图：等级越高家具越大
    const owned = FURNITURE.filter(f => g.furniture[f.id]);
    owned.forEach(f => {
      const lv = g.furniture[f.id];
      const el = document.createElement('div');
      el.className = 'fur';
      el.textContent = f.emoji;
      el.style.left = f.spot.left;
      el.style.bottom = f.spot.bottom;
      el.style.fontSize = `${20 + lv * 9}px`;
      el.title = `${f.levelNames[lv - 1]}（Lv.${lv}）`;
      room.appendChild(el);
    });
    if (owned.length <= 1) {
      room.insertAdjacentHTML('beforeend',
        '<div class="empty-tip">屋里只有一张床<br>去商店「内饰」页添点家具吧</div>');
    }

    const comfort = document.createElement('div');
    comfort.id = 'house-comfort';
    comfort.textContent = `🛋 舒适度 ${g.comfort()} · 家具 ${owned.length}/${FURNITURE.length}`;
    body.appendChild(comfort);

    FURNITURE.forEach(f => {
      const lv = g.furniture[f.id] ?? 0;
      const el = document.createElement('div');
      el.className = 'fur-row' + (lv ? '' : ' locked');
      const desc = lv
        ? `${f.levelNames[lv - 1]} · Lv.${lv}/3`
        : `未拥有 · 商店「内饰」页 ${f.cost}💰`;
      el.innerHTML = `<div class="icon">${f.emoji}</div>
        <div class="info"><b>${f.name}</b><p>${desc}</p></div>`;
      if (f.id === 'bed') {
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
    const body = $('#mall-body');
    const g = this.game;
    body.innerHTML = '';
    const note = document.createElement('p');
    note.className = 'shop-note';
    note.textContent = '买来的道具放在 🧰 道具背包里，和作物背包分开。';
    body.appendChild(note);
    ITEMS.forEach(item => {
      const owned = g.items[item.id] ?? 0;
      const el = document.createElement('div');
      el.className = 'shop-item';
      el.innerHTML = `<div class="icon">${item.emoji}</div>
        <div class="info"><b>${item.name}${owned ? `（持有 ${owned}）` : ''}</b><p>${item.desc}</p></div>`;
      const btn = document.createElement('button');
      btn.textContent = `${item.cost}💰`;
      btn.addEventListener('click', () => { g.buyItem(item.id); this.renderMall(); });
      el.appendChild(btn);
      body.appendChild(el);
    });
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

  /* ---------- 作物展示区 ---------- */

  openDisplayChooser(slotIdx) {
    this.closePanels();
    $('#disp').classList.remove('hidden');
    const body = $('#disp-body');
    const g = this.game;
    body.innerHTML = '';
    const note = document.createElement('p');
    note.className = 'shop-note';
    note.textContent = `选一个作物摆上 ${slotIdx + 1} 号展示台（点击展示台上的作物可随时收回背包）：`;
    body.appendChild(note);
    const crops = Object.entries(g.inventory)
      .filter(([k, n]) => !k.startsWith('p:') && !k.startsWith('x:') && k !== 'egg' && n > 0);
    if (!crops.length) {
      body.insertAdjacentHTML('beforeend',
        '<div class="bag-empty">背包里没有作物<br>收获一些满意的再来展示吧 🌱</div>');
      return;
    }
    crops.forEach(([key, n]) => {
      const info = keyInfo(key);
      const el = document.createElement('div');
      el.className = 'ws-slot' + (info.quality ? ` quality-${info.quality}` : '');
      el.innerHTML = `<div class="icon">${info.icon}</div>
        <div class="info"><b>${info.label} ×${n}</b><p>价值 ${info.price}💰</p></div>`;
      const btn = document.createElement('button');
      btn.textContent = '展示';
      btn.addEventListener('click', () => {
        g.placeDisplay(slotIdx, key);
        $('#disp').classList.add('hidden');
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
      const note = document.createElement('p');
      note.className = 'shop-note';
      note.textContent = `选择放入 ${this.wsChoosing + 1} 号加工位的作物（加工 ${WORKSHOP.time} 秒，卖价 ×${WORKSHOP.mult}）：`;
      body.appendChild(note);
      const raw = Object.entries(g.inventory)
        .filter(([k, n]) => !k.startsWith('p:') && !k.startsWith('x:') && k !== 'egg' && n > 0);
      if (!raw.length) {
        body.insertAdjacentHTML('beforeend', '<div class="bag-empty">背包里没有可加工的作物<br>先去收获一些吧 🌱</div>');
      }
      raw.forEach(([key, n]) => {
        const info = keyInfo(key);
        const el = document.createElement('div');
        el.className = 'ws-slot';
        el.innerHTML = `<div class="icon">${info.icon}</div>
          <div class="info"><b>${info.label} ×${n}</b><p>加工后可卖 ${info.price * WORKSHOP.mult}💰</p></div>`;
        const btn = document.createElement('button');
        btn.textContent = '放入';
        btn.addEventListener('click', () => {
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
    const note = document.createElement('p');
    note.className = 'shop-note';
    note.textContent = `放入作物加工 ${WORKSHOP.time} 秒变罐头，卖价是原来的 ${WORKSHOP.mult} 倍。`;
    body.appendChild(note);
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
            <div class="info"><b>${info.label}罐头 完成！</b><p>可卖 ${info.price * WORKSHOP.mult}💰</p></div>`;
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
    if (!$('#shop').classList.contains('hidden')) this.renderShop();
    if (this.tool === 'plant') this.renderSeedPicker();
  }

  toast(msg) {
    const wrap = $('#toast-wrap');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 1900);
    while (wrap.children.length > 3) wrap.firstChild.remove();
  }
}

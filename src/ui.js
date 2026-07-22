import { SEEDS, SOILS, WATER_LEVELS, DECORS, seedById, QUALITIES, WORKSHOP, keyInfo, QUICK_WATER_COST, ITEMS, itemById, FURNITURE, INTERIOR_POS, FISHING, CODEX_POS } from './config.js';

// 秒数显示成「X分X秒」
const fmtTime = (s) => s >= 60 ? `${Math.floor(s / 60)}分${s % 60 ? `${Math.round(s % 60)}秒` : ''}` : `${Math.ceil(s)}秒`;

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
    $('#house-close').addEventListener('click', () => this.exitHouse());
    $('#fish-close').addEventListener('click', () => $('#fish').classList.add('hidden'));
    $('#bank-close').addEventListener('click', () => $('#bank').classList.add('hidden'));
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
      if (!$('#fish').classList.contains('hidden')) this.renderFishing();
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
      if (e.target.tagName === 'INPUT') return; // 正在输入金额时快捷键不抢戏
      if (e.repeat || this.game.paused) return; // 挂机中快捷键也冻结
      const k = e.key.toLowerCase();
      if (k === 'escape') {
        $('#quick-menu').classList.add('hidden');
        this.exitHouse();
        this.exitCodex();
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
          `种子 ${s.cost}💰 · 卖出 ${s.sell}💰 · 生长 ${fmtTime(s.growTime)}`,
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
    ['#shop', '#bag', '#ws', '#disp', '#mall', '#items', '#fish', '#bank', '#quick-menu']
      .forEach(sel => $(sel).classList.add('hidden'));
    this.exitHouse(); // 打开别的面板时顺便走出房间
    this.exitCodex();
  }

  inside() { return this.inHouse || this.inCodex; }

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
    body.insertAdjacentHTML('beforeend',
      `<div id="codex-progress">📖 收录进度 ${g.codexCount()} / 42<small>每种作物的每个品质各收录一次，拖动可以环视展馆</small></div>`);
    const note = document.createElement('p');
    note.className = 'shop-note';
    note.textContent = '从背包里挑作物捐进展馆（罐头、生长不良和恐龙虾卵不收）：';
    body.appendChild(note);
    const donatable = Object.entries(g.inventory)
      .filter(([k, n]) => n > 0 && !k.startsWith('p:') && !k.startsWith('x:') && k !== 'egg');
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

  /* ---------- 黑房子银行 ---------- */

  openBank() {
    this.closePanels();
    $('#bank').classList.remove('hidden');
    this.renderBank();
  }

  renderBank() {
    const body = $('#bank-body');
    const g = this.game;
    body.innerHTML = '';
    body.insertAdjacentHTML('beforeend',
      `<div id="bank-balance">🏦 ${g.bank}💰<small>每天日结：85% 赚 1~3💰，15% 亏 1~3💰</small></div>`);
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
    const nets = g.items.net ?? 0;
    const note = document.createElement('p');
    note.className = 'shop-note';
    note.textContent = `摆网 ${FISHING.time / 60} 分钟，随机捞 ${FISHING.rewardMin}~${FISHING.rewardMax}💰，是亏是赚全看脸。持有抓鱼网 ×${nets}（商场有售 100💰）。`;
    body.appendChild(note);
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
        : `未拥有 · 商店「内饰」页 ${f.cost}💰`;
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
    const body = $('#mall-body');
    const g = this.game;
    body.innerHTML = '';
    const note = document.createElement('p');
    note.className = 'shop-note';
    note.textContent = '买来的道具放在 🧰 道具背包里，和作物背包分开。';
    body.appendChild(note);

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
    ITEMS.forEach(item => {
      const owned = g.items[item.id] ?? 0;
      const el = document.createElement('div');
      el.className = 'shop-item';
      el.innerHTML = `<div class="icon">${item.emoji}</div>
        <div class="info"><b>${item.name}${owned ? `（持有 ${owned}）` : ''}</b><p>${item.desc}</p></div>`;
      const btn = document.createElement('button');
      btn.dataset.price = item.cost;
      btn.textContent = `买 ${qty()} 个 · ${item.cost * qty()}💰`;
      btn.addEventListener('click', () => { g.buyItem(item.id, qty()); this.renderMall(); });
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
    $('#bank-count').textContent = this.game.bank;
    if (!$('#bank').classList.contains('hidden')) this.renderBank();
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

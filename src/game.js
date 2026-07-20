import * as THREE from 'three';
import {
  GRID, LEVELS, WET_DURATION, START_COINS,
  SEEDS, SOILS, WATER_LEVELS, seedById, decorById,
  QUALITIES, GOLD_CHANCE, SILVER_CHANCE, WORKSHOP, keyInfo,
  DAY_CYCLE, NIGHT_SLOW, QUICK_WATER_COST, EGG, DROUGHT, itemById, furnitureById,
  UNLOCK_COST,
} from './config.js';
import {
  createToyBox, createTileMesh, createPlantMesh, createDecorMesh, tilePos,
  createDecorSlotMesh, decorSlotPos, DECOR_SLOTS, applyPlating, createWorkshop,
  createDisplaySlotMesh, displaySlotPos, DISPLAY_SLOTS, createMall,
  createUpperDeck, createLadder, createHouse, createLockEdge,
} from './meshes.js';

export const SAVE_KEY = 'farming-mini-game-save-v1';

const stageOf = (plant, seed) => {
  const p = plant.progress / seed.growTime;
  return p >= 1 ? 3 : p >= 0.66 ? 2 : p >= 0.33 ? 1 : 0;
};

export class Game {
  constructor(scene) {
    this.scene = scene;
    this.time = 0;
    this.clock = DAY_CYCLE / 4; // 昼夜时钟，0 = 早上6点，默认从中午开始
    this.coins = START_COINS;
    this.waterLevel = 0;
    this.unlockedSeeds = ['sweetpot', 'radish'];
    this.inventory = {}; // seedId -> 数量，收获先入背包，手动卖出
    this.savedLayouts = []; // 玩家手动保存的种植布局 [{name, layout}]，供一键播种
    this.layoutSeq = 0;
    this.paused = false;    // 挂机模式：整个世界暂停
    this.windTimer = 0;     // 风车发电计时器
    this.drought = false;   // 大旱天：三个太阳，生长 ×1/3，收成生长不良
    this.items = {};        // 道具背包，和作物背包分开：itemId -> 数量
    this.furniture = { bed: 1 }; // 房子内饰：id -> 等级(1~3)，床是白送的
    this.onToast = () => {};
    this.onState = () => {};

    scene.add(createToyBox());

    this.group = new THREE.Group();
    scene.add(this.group);

    scene.add(createUpperDeck());
    scene.add(createLadder());

    this.tiles = [];
    for (let level = 0; level < LEVELS; level++) {
    for (let j = 0; j < GRID; j++) {
      for (let i = 0; i < GRID; i++) {
        const mesh = createTileMesh();
        const { x, y, z } = tilePos(i, j, level);
        mesh.position.set(x, y, z);
        mesh.userData.tileIndex = this.tiles.length;
        this.group.add(mesh);
        this.tiles.push({
          i, j, level, mesh,
          locked: level === 1, // 二层的地要花钱解锁
          soil: 0,
          wetUntil: 0,       // 游戏时钟秒
          plant: null,        // { seedId, progress, stage, mesh }
          lucky: false,       // 幸运药剂加持：下次播种稀有概率翻倍
          _lastColor: null,
        });
      }
    }
    }

    // 盒子四周的装饰台，与菜地分开
    this.decorSlots = [];
    for (let k = 0; k < DECOR_SLOTS; k++) {
      const mesh = createDecorSlotMesh();
      const { x, z } = decorSlotPos(k);
      mesh.position.set(x, -0.42, z);
      mesh.userData.slotIndex = k;
      this.group.add(mesh);
      this.decorSlots.push({ mesh, decor: null });
    }

    // 作物展示区：左侧草地两排白石台，摆背包里满意的作物
    this.displaySlots = [];
    for (let k = 0; k < DISPLAY_SLOTS; k++) {
      const mesh = createDisplaySlotMesh();
      const { x, z } = displaySlotPos(k);
      mesh.position.set(x, -0.42, z);
      mesh.userData.displayIndex = k;
      this.group.add(mesh);
      this.displaySlots.push({ mesh, item: null });
    }

    // 我们自己的房子：农田右前方
    const house = createHouse();
    house.position.set(10, -0.51, 4.6);
    house.rotation.y = -0.45;
    this.group.add(house);
    this.houseMeshes = [];
    house.traverse(o => { if (o.isMesh) this.houseMeshes.push(o); });

    // 商场：菜园后方的小楼
    const mall = createMall();
    mall.position.set(-9.2, -0.51, -6.6); // 让开二层农田的位置
    mall.rotation.y = 0.75;
    this.group.add(mall);
    this.mallMeshes = [];
    mall.traverse(o => { if (o.isMesh) this.mallMeshes.push(o); });

    // 工坊：右侧草地上的小屋，slots 里是 { key, readyAt } 或 null
    this.workshop = Array(WORKSHOP.slots).fill(null);
    const ws = createWorkshop();
    ws.position.set(7.2, -0.51, -1.6);
    ws.rotation.y = 0.25;
    this.group.add(ws);
    this.workshopMeshes = [];
    ws.traverse(o => { if (o.isMesh) this.workshopMeshes.push(o); });

    this.load();
    this.refreshAllVisuals();
  }

  /* ---------- 查询 ---------- */

  tileMeshes() { return this.tiles.map(t => t.mesh); }
  slotMeshes() { return this.decorSlots.map(s => s.mesh); }
  displayMeshes() { return this.displaySlots.map(s => s.mesh); }
  isWet(t) { return this.waterLevel === 2 || t.wetUntil > this.time; }

  /* ---------- 大旱天 ---------- */

  rollDrought() {
    this.setDrought(Math.random() < DROUGHT.chance);
    this.onToast(this.drought
      ? '☀️☀️☀️ 大旱天！生长缓慢，今天的收成会生长不良'
      : (this._wasDrought ? '🌧 旱情结束，菜园恢复生机！' : '🌅 新的一天开始了'));
    this._wasDrought = this.drought;
  }

  setDrought(on) {
    this.drought = on;
    for (const t of this.tiles) {
      if (t.plant?.mesh) this.applyDroughtTint(t.plant.mesh, on);
    }
  }

  // 旱天作物发黄缩水；恢复时还原本色（origColor 在首次调用时记录）
  applyDroughtTint(root, on) {
    root.traverse(o => {
      if (!o.isMesh) return;
      if (o.userData.origColor === undefined) o.userData.origColor = o.material.color.getHex();
      o.material.color.setHex(o.userData.origColor);
      if (on) o.material.color.lerp(new THREE.Color(0xd8c26a), 0.4);
    });
    if (!root.userData.bob) root.scale.setScalar(on ? 0.85 : 1);
  }

  /* ---------- 昼夜时钟 ---------- */

  // 时钟 0 点 = 游戏内早上 6:00，一整圈 = 24 小时
  clockInfo() {
    const h = (this.clock / DAY_CYCLE) * 24 + 6;
    const hour = h % 24;
    const hh = Math.floor(hour);
    const mm = Math.floor((hour - hh) * 60);
    return { hh, mm, hour, isNight: hh < 6 || hh >= 18 };
  }

  isNight() { return this.clockInfo().isNight; }

  // 0=深夜 1=白天，清晨/黄昏各有一小时渐变，用于灯光过渡
  dayFactor() {
    const { hour } = this.clockInfo();
    if (hour < 5.5 || hour >= 18.5) return 0;
    if (hour < 6.5) return hour - 5.5;
    if (hour < 17.5) return 1;
    return 18.5 - hour;
  }

  /* ---------- 金币 ---------- */

  spend(amount) {
    if (this.coins < amount) {
      this.onToast(`金币不够，还差 ${amount - this.coins} 💰`);
      return false;
    }
    this.coins -= amount;
    this.onState();
    return true;
  }

  gain(amount) {
    this.coins += amount;
    this.onState();
  }

  /* ---------- 操作 ---------- */

  plantAt(idx, seedId) {
    const t = this.tiles[idx];
    const seed = seedById(seedId);
    if (!seed || !this.unlockedSeeds.includes(seedId)) return;
    if (t.locked) { this.onToast(`这块地还没解锁，点它花 ${UNLOCK_COST}💰 开垦`); return; }
    if (t.plant) { this.onToast('这块地已经种上啦'); return; }
    if (!this.spend(seed.cost)) return;
    t.plant = { seedId, progress: 0, stage: -1, quality: this.rollQuality(t.lucky) };
    if (t.lucky) { t.lucky = false; this.onToast('🧪 幸运加持生效！'); }
    this.updatePlantMesh(t);
    this.save();
  }

  // 种下的一刻就暗中决定品质，幼苗起就带镀层；幸运药剂让稀有概率翻倍
  rollQuality(lucky = false) {
    const m = lucky ? 2 : 1;
    const r = Math.random();
    return r < GOLD_CHANCE * m ? 'gold'
      : r < (GOLD_CHANCE + SILVER_CHANCE) * m ? 'silver' : null;
  }

  /* ---------- 快捷操作 ---------- */

  sellAll() {
    const entries = Object.entries(this.inventory).filter(([, n]) => n > 0);
    if (!entries.length) { this.onToast('背包里没有东西可以卖'); return; }
    let total = 0, count = 0;
    entries.forEach(([key, n]) => {
      total += keyInfo(key).price * n;
      count += n;
      delete this.inventory[key];
    });
    this.gain(total);
    this.onToast(`💰 一键售卖！${count} 件东西卖了 ${total}💰`);
    this.save();
  }

  harvestAll() {
    let count = 0;
    for (const t of this.tiles) {
      if (!t.plant || t.plant.stage < 3) continue;
      const seed = seedById(t.plant.seedId);
      const n = SOILS[t.soil].yield;
      const key = (this.drought ? 'x:' : '') + (t.plant.quality ? `${seed.id}:${t.plant.quality}` : seed.id);
      this.inventory[key] = (this.inventory[key] ?? 0) + n;
      this.removePlant(t);
      count += n;
    }
    if (!count) { this.onToast('没有成熟的作物可以收'); return; }
    this.onState();
    this.onToast(`🧺 一键收取！${count} 个作物进了背包`);
    this.save();
  }

  waterAll() {
    if (!this.spend(QUICK_WATER_COST)) return;
    const wetTiles = this.tiles.filter(t => !t.locked);
    wetTiles.forEach(t => { t.wetUntil = this.time + WET_DURATION; });
    this.onToast(this.waterLevel === 2
      ? `💦 全场洒水找恐龙虾卵！-${QUICK_WATER_COST}💰`
      : `💦 一键浇水！全场湿润 -${QUICK_WATER_COST}💰`);
    this.rollEggs(wetTiles.length);
    this.save();
  }

  saveLayout() {
    const layout = this.tiles.map(t => t.plant?.seedId ?? null);
    if (!layout.some(Boolean)) { this.onToast('地里空空的，先种点东西再保存'); return false; }
    if (this.savedLayouts.length >= 8) { this.onToast('最多保存 8 个布局，先删掉一个吧'); return false; }
    this.layoutSeq += 1;
    this.savedLayouts.push({ name: `布局${this.layoutSeq}`, layout });
    this.onToast(`💾 已保存为「布局${this.layoutSeq}」`);
    this.onState();
    this.save();
    return true;
  }

  deleteLayout(i) {
    const entry = this.savedLayouts[i];
    if (!entry) return;
    this.savedLayouts.splice(i, 1);
    this.onToast(`删除了「${entry.name}」`);
    this.onState();
    this.save();
  }

  sowLayout(i) {
    const entry = this.savedLayouts[i];
    if (!entry) return;
    let planted = 0, cost = 0, lackMoney = false;
    entry.layout.forEach((seedId, idx) => {
      if (!seedId || !this.unlockedSeeds.includes(seedId)) return;
      const t = this.tiles[idx];
      if (!t || t.plant || t.locked) return;
      const seed = seedById(seedId);
      if (this.coins < seed.cost) { lackMoney = true; return; }
      this.coins -= seed.cost;
      cost += seed.cost;
      t.plant = { seedId, progress: 0, stage: -1, quality: this.rollQuality() };
      this.updatePlantMesh(t);
      planted += 1;
    });
    this.onState();
    if (!planted) this.onToast(lackMoney ? '金币不够，一块都种不起 😢' : '布局里的地都种着呢');
    else this.onToast(`🌱 按「${entry.name}」播种了 ${planted} 块地，花费 ${cost}💰${lackMoney ? '（金币不够没种完）' : ''}`);
    this.save();
  }

  waterAt(idx) {
    const targets = [];
    const { i, j, level } = this.tiles[idx];
    const range = this.waterLevel >= 1 ? 1 : 0; // 升到洒水器后永久保留 3×3
    for (const t of this.tiles) {
      if (!t.locked && t.level === level
        && Math.abs(t.i - i) <= range && Math.abs(t.j - j) <= range) targets.push(t);
    }
    if (!targets.length) return;
    targets.forEach(t => { t.wetUntil = this.time + WET_DURATION; });
    // 自动灌溉时代，洒水器的使命就是找恐龙虾卵
    this.onToast(this.waterLevel === 2 ? '💦 洒水器出动，找找恐龙虾卵～'
      : this.waterLevel === 1 ? '💧 洒水器浇了 3×3' : '💧 浇水成功');
    this.rollEggs(targets.length);
    this.save();
  }

  // 泥土加水会唤醒恐龙虾卵：每块被浇的地各掷一次骰子
  rollEggs(tileCount) {
    let found = 0;
    for (let i = 0; i < tileCount; i++) {
      if (Math.random() < EGG.chance) found += 1;
    }
    if (!found) return;
    this.inventory[EGG.key] = (this.inventory[EGG.key] ?? 0) + found;
    this.onToast(`${EGG.emoji} 泥土里冒出恐龙虾卵 ×${found}！已放入背包`);
    this.onState();
  }

  harvestAt(idx) {
    const t = this.tiles[idx];
    if (!t.plant) return false;
    const seed = seedById(t.plant.seedId);
    if (t.plant.stage < 3) { this.onToast(`${seed.name}还没成熟`); return false; }
    const count = SOILS[t.soil].yield;
    const quality = t.plant.quality;
    const key = (this.drought ? 'x:' : '') + (quality ? `${seed.id}:${quality}` : seed.id);
    this.removePlant(t);
    this.inventory[key] = (this.inventory[key] ?? 0) + count;
    this.onState();
    const q = QUALITIES[quality];
    this.onToast(q
      ? `${q.emoji} 收获${q.name}${seed.name} ×${count}！放入背包`
      : `${seed.emoji}${seed.name} ×${count} 放入背包`);
    this.save();
    return true;
  }

  sellCrop(key, count) {
    const have = this.inventory[key] ?? 0;
    const n = Math.min(count, have);
    if (n <= 0) return;
    const info = keyInfo(key);
    this.inventory[key] = have - n;
    if (this.inventory[key] === 0) delete this.inventory[key];
    this.gain(info.price * n);
    this.onToast(`卖出${info.icon}${info.label} ×${n} +${info.price * n} 💰`);
    this.save();
  }

  /* ---------- 商场道具 ---------- */

  buyItem(id) {
    const item = itemById(id);
    if (!item || !this.spend(item.cost)) return;
    this.items[id] = (this.items[id] ?? 0) + 1;
    this.onToast(`${item.emoji} 买了 1 个${item.name}，放进道具背包`);
    this.onState();
    this.save();
  }

  useItem(id) {
    if ((this.items[id] ?? 0) <= 0) return;
    const ok = id === 'fertilizer' ? this.useFertilizer() : this.useLuck();
    if (!ok) return;
    this.items[id] -= 1;
    if (this.items[id] === 0) delete this.items[id];
    this.onState();
    this.save();
  }

  // 随机抽 n 个符合条件的地块
  pickRandomTiles(filter, n) {
    const pool = this.tiles.filter(filter);
    const picked = [];
    while (picked.length < n && pool.length) {
      picked.push(...pool.splice(Math.floor(Math.random() * pool.length), 1));
    }
    return picked;
  }

  useFertilizer() {
    const targets = this.pickRandomTiles(t => t.plant && t.plant.stage < 3, 2);
    if (!targets.length) { this.onToast('地里没有还在生长的作物'); return false; }
    const names = targets.map(t => {
      const seed = seedById(t.plant.seedId);
      t.plant.progress = seed.growTime;
      this.updatePlantMesh(t);
      return seed.emoji + seed.name;
    });
    this.onToast(`💊 肥料生效！${names.join('、')} 立刻成熟`);
    return true;
  }

  useLuck() {
    const targets = this.pickRandomTiles(t => !t.plant && !t.lucky, 2);
    if (!targets.length) { this.onToast('没有可以施法的空地（空地都加持过了？）'); return false; }
    targets.forEach(t => { t.lucky = true; });
    this.onToast(`🧪 幸运药剂洒在 ${targets.length} 块空地上，下次播种稀有翻倍！`);
    return true;
  }

  /* ---------- 房子 ---------- */

  buyFurniture(id) {
    const f = furnitureById(id);
    if (!f || this.furniture[id]) return;
    if (!this.spend(f.cost)) return;
    this.furniture[id] = 1;
    this.onToast(`${f.emoji} ${f.name}搬进屋啦！`);
    this.onState();
    this.save();
  }

  upgradeFurniture(id) {
    const f = furnitureById(id);
    const lv = this.furniture[id] ?? 0;
    if (!f || !lv) return;
    if (lv >= 3) { this.onToast(`${f.name}已经是满级了`); return; }
    const cost = f.up[lv - 1];
    if (!this.spend(cost)) return;
    this.furniture[id] = lv + 1;
    this.onToast(`${f.emoji} ${f.name}升级成「${f.levelNames[lv]}」！`);
    this.onState();
    this.save();
  }

  comfort() {
    return Object.entries(this.furniture)
      .reduce((sum, [, lv]) => sum + lv * 5, 0);
  }

  // 睡觉：直接跳到早上 6 点，这段时间的生长和加工照常结算
  sleep() {
    if (!this.isNight()) { this.onToast('大白天的，睡不着啊'); return false; }
    const remain = DAY_CYCLE - this.clock;
    const step = 1.5;
    for (let t = 0; t < remain; t += step) this.tick(Math.min(step, remain - t));
    this.onToast('😴 一觉睡到大天亮！');
    this.save();
    return true;
  }

  /* ---------- 作物展示区 ---------- */

  buildDisplayMesh(key, s) {
    const info = keyInfo(key);
    const m = createPlantMesh(info.seed.id, 3);
    applyPlating(m, info.quality);
    m.position.set(s.mesh.position.x, s.mesh.position.y + 0.13, s.mesh.position.z);
    this.group.add(m);
    return m;
  }

  placeDisplay(k, key) {
    const s = this.displaySlots[k];
    if (s.item) { this.onToast('这个展示台已经摆着东西了'); return false; }
    if (key.startsWith('p:') || key === EGG.key) { this.onToast('展示区只摆作物本物～'); return false; }
    if (key.startsWith('x:')) { this.onToast('蔫了吧唧的就别摆出来了吧…'); return false; }
    if ((this.inventory[key] ?? 0) <= 0) return false;
    this.inventory[key] -= 1;
    if (this.inventory[key] === 0) delete this.inventory[key];
    s.item = { key, mesh: this.buildDisplayMesh(key, s) };
    this.onToast(`🏆 ${keyInfo(key).icon}${keyInfo(key).label}摆上了展示台`);
    this.onState();
    this.save();
    return true;
  }

  takeDisplay(k) {
    const s = this.displaySlots[k];
    if (!s.item) return;
    const key = s.item.key;
    this.group.remove(s.item.mesh);
    s.item = null;
    this.inventory[key] = (this.inventory[key] ?? 0) + 1;
    this.onToast(`${keyInfo(key).label}收回了背包`);
    this.onState();
    this.save();
  }

  /* ---------- 工坊 ---------- */

  processingCount() {
    return this.workshop.filter(s => s && this.time < s.readyAt).length;
  }

  processStart(slot, key) {
    if (this.workshop[slot]) return;
    if (key.startsWith('p:')) { this.onToast('罐头不能再加工啦'); return; }
    if (key === EGG.key) { this.onToast('恐龙虾卵可不能做成罐头！'); return; }
    if (key.startsWith('x:')) { this.onToast('生长不良的作物做不成罐头，贱卖了吧'); return; }
    if ((this.inventory[key] ?? 0) <= 0) return;
    this.inventory[key] -= 1;
    if (this.inventory[key] === 0) delete this.inventory[key];
    this.workshop[slot] = { key, readyAt: this.time + WORKSHOP.time };
    const info = keyInfo(key);
    this.onToast(`${info.icon}${info.label}开始加工 ⏳${WORKSHOP.time}秒`);
    this.onState();
    this.save();
  }

  processCollect(slot) {
    const s = this.workshop[slot];
    if (!s || this.time < s.readyAt) return;
    const pkey = 'p:' + s.key;
    this.inventory[pkey] = (this.inventory[pkey] ?? 0) + 1;
    this.workshop[slot] = null;
    const info = keyInfo(pkey);
    this.onToast(`${info.icon} ${info.label}完成！放入背包`);
    this.onState();
    this.save();
  }

  shovelAt(idx) {
    const t = this.tiles[idx];
    if (t.plant) {
      const seed = seedById(t.plant.seedId);
      this.removePlant(t);
      this.onToast(`铲掉了${seed.name}`);
    }
    this.save();
  }

  shovelSlot(k) {
    const s = this.decorSlots[k];
    if (!s.decor) return;
    const d = decorById(s.decor.id);
    this.group.remove(s.decor.mesh);
    s.decor = null;
    this.onToast(`收起了${d.name}`);
    this.save();
  }

  unlockTile(idx) {
    const t = this.tiles[idx];
    if (!t.locked) return;
    if (!this.spend(UNLOCK_COST)) return;
    t.locked = false;
    t._lastColor = null;
    this.refreshLockEdge(t);
    const left = this.tiles.filter(x => x.locked).length;
    this.onToast(`🌱 开垦成功！还有 ${left} 块地没解锁`);
    this.save();
  }

  refreshLockEdge(t) {
    const old = t.mesh.children.find(c => c.userData.lockEdge);
    if (t.locked && !old) t.mesh.add(createLockEdge());
    if (!t.locked && old) t.mesh.remove(old);
  }

  upgradeSoilAt(idx, level) {
    const t = this.tiles[idx];
    const target = SOILS[level];
    if (!target) return;
    if (t.locked) { this.onToast(`先花 ${UNLOCK_COST}💰 解锁这块地`); return; }
    if (t.soil >= level) { this.onToast(`这块地已经是${SOILS[t.soil].name}了`); return; }
    if (!this.spend(target.cost)) return;
    t.soil = level;
    t._lastColor = null;
    this.onToast(`升级为${target.name}！`);
    this.save();
  }

  buyWaterLevel() {
    if (this.waterLevel >= WATER_LEVELS.length - 1) return;
    const next = WATER_LEVELS[this.waterLevel + 1];
    if (!this.spend(next.cost)) return;
    this.waterLevel += 1;
    this.onToast(`获得${next.name}！`);
    this.onState();
    this.save();
  }

  unlockSeed(seedId) {
    const seed = seedById(seedId);
    if (this.unlockedSeeds.includes(seedId)) return;
    if (!this.spend(seed.unlock)) return;
    this.unlockedSeeds.push(seedId);
    this.onToast(`解锁了${seed.emoji}${seed.name}种子！`);
    this.onState();
    this.save();
  }

  placeDecorAtSlot(k, decorId) {
    const s = this.decorSlots[k];
    const d = decorById(decorId);
    if (s.decor) { this.onToast('这个装饰台已经放了东西'); return false; }
    if (!this.spend(d.cost)) return false;
    s.decor = { id: decorId, mesh: this.attachDecorMesh(decorId, s) };
    this.onToast(`摆好了${d.emoji}${d.name}`);
    this.save();
    return true;
  }

  /* ---------- 内部 ---------- */

  attachMesh(mesh, t) {
    mesh.position.set(t.mesh.position.x, t.mesh.position.y + 0.11, t.mesh.position.z);
    this.group.add(mesh);
    return mesh;
  }

  attachDecorMesh(decorId, s) {
    const m = createDecorMesh(decorId);
    m.position.set(s.mesh.position.x, s.mesh.position.y + 0.09, s.mesh.position.z);
    this.group.add(m);
    return m;
  }

  removePlant(t) {
    if (t.plant?.mesh) this.group.remove(t.plant.mesh);
    t.plant = null;
  }

  updatePlantMesh(t) {
    const seed = seedById(t.plant.seedId);
    const stage = stageOf(t.plant, seed);
    if (stage === t.plant.stage) return;
    if (t.plant.mesh) this.group.remove(t.plant.mesh);
    t.plant.stage = stage;
    const mesh = createPlantMesh(seed.id, stage);
    applyPlating(mesh, t.plant.quality);
    mesh.userData.plantRoot = true;
    if (this.drought) this.applyDroughtTint(mesh, true);
    t.plant.mesh = this.attachMesh(mesh, t);
  }

  refreshAllVisuals() {
    for (const t of this.tiles) {
      if (t.plant) { t.plant.stage = -1; this.updatePlantMesh(t); }
      this.refreshLockEdge(t);
      t._lastColor = null;
    }
    for (const s of this.decorSlots) {
      if (s.decor && !s.decor.mesh) s.decor.mesh = this.attachDecorMesh(s.decor.id, s);
    }
    for (const s of this.displaySlots) {
      if (s.item && !s.item.mesh) s.item.mesh = this.buildDisplayMesh(s.item.key, s);
    }
  }

  /* ---------- 主循环 ---------- */

  tick(dt) {
    if (this.paused) return; // 挂机中：时间、生长、加工全部冻结
    this.time += dt;
    const wrapped = this.clock + dt >= DAY_CYCLE;
    this.clock = (this.clock + dt) % DAY_CYCLE;
    if (wrapped) this.rollDrought(); // 每天早上 6 点掷天气骰子

    // 昼夜切换提示
    const night = this.isNight();
    if (this._night === undefined) this._night = night;
    else if (night !== this._night) {
      this._night = night;
      this.onToast(night ? '🌙 夜幕降临，作物生长变慢了' : '☀️ 天亮啦，作物恢复生长');
    }

    // 风车发电：每台每分钟 +1💰
    const mills = this.decorSlots.filter(s => s.decor?.id === 'windmill').length;
    if (mills > 0) {
      this.windTimer += dt;
      if (this.windTimer >= 60) {
        const payouts = Math.floor(this.windTimer / 60);
        this.windTimer -= payouts * 60;
        this.gain(mills * payouts);
        this.onToast(`🌀 风车发电 +${mills * payouts}💰`);
      }
    }

    const growMult = (night ? NIGHT_SLOW : 1) * (this.drought ? DROUGHT.growSlow : 1);
    for (const t of this.tiles) {
      const wet = this.isWet(t);
      if (t.plant) {
        const seed = seedById(t.plant.seedId);
        if (wet && t.plant.progress < seed.growTime) {
          t.plant.progress += dt * SOILS[t.soil].speed * growMult;
          this.updatePlantMesh(t);
        }
      }
      // 土壤颜色：湿润加深，幸运药剂加持的空地泛紫光
      const base = SOILS[t.soil].color;
      const key = `${base}-${wet}-${t.lucky}-${t.locked}`;
      if (t._lastColor !== key) {
        t._lastColor = key;
        const c = new THREE.Color(base);
        if (wet) c.multiplyScalar(0.6).add(new THREE.Color(0x0a1420));
        if (t.lucky) c.lerp(new THREE.Color(0xb35de0), 0.35);
        if (t.locked) c.lerp(new THREE.Color(0x5c6b52), 0.55); // 未解锁的荒地
        t.mesh.material.color.copy(c);
      }
    }
  }

  /* ---------- 存档 ---------- */

  save() {
    const data = {
      coins: this.coins,
      waterLevel: this.waterLevel,
      unlockedSeeds: this.unlockedSeeds,
      inventory: this.inventory,
      savedAt: Date.now(),
      items: this.items,
      furniture: this.furniture,
      tiles: this.tiles.map(t => ({
        soil: t.soil,
        lucky: t.lucky,
        locked: t.locked,
        wetRemain: Math.max(0, t.wetUntil - this.time),
        plant: t.plant ? { seedId: t.plant.seedId, progress: t.plant.progress, quality: t.plant.quality ?? null } : null,
      })),
      decorSlots: this.decorSlots.map(s => s.decor?.id ?? null),
      displaySlots: this.displaySlots.map(s => s.item?.key ?? null),
      workshop: this.workshop.map(s => s ? { key: s.key, remain: Math.max(0, s.readyAt - this.time) } : null),
      clock: this.clock,
      windTimer: this.windTimer,
      drought: this.drought,
      savedLayouts: this.savedLayouts,
      layoutSeq: this.layoutSeq,
      paused: this.paused,
    };
    const json = JSON.stringify(data);
    localStorage.setItem(SAVE_KEY, json);
    // 同步落盘备份（开发服务器提供 /__save；失败也不影响游戏）
    fetch('/__save', { method: 'POST', body: json }).catch(() => {});
  }

  load() {
    let data;
    try { data = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { /* 存档损坏则重新开始 */ }
    if (!data) return;
    this.coins = data.coins ?? START_COINS;
    this.waterLevel = data.waterLevel ?? 0;
    this.unlockedSeeds = data.unlockedSeeds ?? ['sweetpot', 'radish'];
    // 保底作物：老存档也要有红薯，否则金币归零会卡死
    if (!this.unlockedSeeds.includes('sweetpot')) this.unlockedSeeds.unshift('sweetpot');
    this.inventory = data.inventory ?? {};
    this.items = data.items ?? {};
    this.furniture = data.furniture ?? { bed: 1 };
    if (!this.furniture.bed) this.furniture.bed = 1; // 床永远都在
    // 旧存档只有 lastLayout 的话，迁移成第一个已保存布局
    this.savedLayouts = data.savedLayouts
      ?? (data.lastLayout?.some(Boolean) ? [{ name: '上次布局', layout: data.lastLayout }] : []);
    this.layoutSeq = data.layoutSeq ?? this.savedLayouts.length;
    this.paused = data.paused ?? false;
    // 挂机状态下关的游戏，离线时间不生效
    const elapsed = this.paused ? 0 : Math.max(0, (Date.now() - (data.savedAt ?? Date.now())) / 1000);
    this.drought = data.drought ?? false;
    this._wasDrought = this.drought;
    // 离线跨过了新的一天就重掷天气
    if (Math.floor(((data.clock ?? 0) + elapsed) / DAY_CYCLE) > 0) {
      this.drought = Math.random() < DROUGHT.chance;
      this._wasDrought = this.drought;
    }
    this.clock = ((data.clock ?? DAY_CYCLE / 4) + elapsed) % DAY_CYCLE; // 离线时时间照样流逝
    data.tiles?.forEach((s, idx) => {
      const t = this.tiles[idx];
      if (!t || !s) return;
      t.soil = s.soil ?? 0;
      t.lucky = s.lucky ?? false;
      // 老存档没有 locked 字段：二层默认上锁，但已经种着东西的地放行
      t.locked = s.locked ?? (t.level === 1 && !s.plant);
      const wetRemain = s.wetRemain ?? 0;
      // 离线生长：自动灌溉全程生效，否则只按剩余湿润时间生长
      if (s.plant) {
        const seed = seedById(s.plant.seedId);
        const wetTime = this.waterLevel === 2 ? elapsed : Math.min(elapsed, wetRemain);
        const progress = Math.min(seed.growTime, s.plant.progress + wetTime * SOILS[t.soil].speed);
        t.plant = { seedId: s.plant.seedId, progress, stage: -1, quality: s.plant.quality ?? null };
      }
      t.wetUntil = this.time + Math.max(0, wetRemain - elapsed);
    });
    // 新版：装饰住在专属装饰台上
    (data.decorSlots ?? []).forEach((id, k) => {
      if (id && this.decorSlots[k]) this.decorSlots[k].decor = { id, mesh: null };
    });
    // 旧存档迁移：以前放在菜地里的装饰挪到空闲装饰台
    const legacy = (data.tiles ?? []).map(s => s?.decor).filter(Boolean);
    for (const id of legacy) {
      const free = this.decorSlots.find(s => !s.decor);
      if (free) free.decor = { id, mesh: null };
    }
    (data.displaySlots ?? []).forEach((key, k) => {
      if (key && this.displaySlots[k]) this.displaySlots[k].item = { key, mesh: null };
    });
    // 风车离线也发电（最多结算 12 小时，防止一夜暴富）
    this.windTimer = data.windTimer ?? 0;
    const mills = this.decorSlots.filter(s => s.decor?.id === 'windmill').length;
    if (mills > 0 && elapsed > 0) {
      const total = this.windTimer + Math.min(elapsed, 43200);
      this.coins += mills * Math.floor(total / 60);
      this.windTimer = total % 60;
    }
    // 工坊：离线时间照常加工
    (data.workshop ?? []).forEach((s, k) => {
      if (s && k < this.workshop.length) {
        this.workshop[k] = { key: s.key, readyAt: this.time + Math.max(0, s.remain - elapsed) };
      }
    });
  }
}

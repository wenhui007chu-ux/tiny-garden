import * as THREE from 'three';
import {
  GRID, LEVELS, WET_DURATION, START_COINS,
  SEEDS, SOILS, WATER_LEVELS, seedById, decorById,
  QUALITIES, GOLD_CHANCE, SILVER_CHANCE, WORKSHOP, keyInfo,
  DAY_CYCLE, NIGHT_SLOW, QUICK_WATER_COST, EGG, DROUGHT, RAIN, itemById, furnitureById,
  UNLOCK_COST, FURNITURE, INTERIOR_POS, FISHING, DAMAGE, BANK,
  CODEX_POS, CODEX_QUALITIES, PEST,
  DISHES, dishById, ingredientKey, ROD, CASTNET,
  pondDecorById, POND_MAX_PLACED, HYBRIDS, hybridById,
  HYBRID_POS, HYBRID_TIME, HYBRID_SLOTS,
  PETS, petById, PET_DECORS, petDecorById, PET_POS,
} from './config.js';
import {
  createToyBox, createTileMesh, createPlantMesh, createDecorMesh, tilePos,
  createDecorSlotMesh, decorSlotPos, DECOR_SLOTS, applyPlating, createWorkshop,
  createGalleryPedestal, galleryPedestalPos, DISPLAY_SLOTS, createMall,
  createUpperDeck, createLadder, createHouse, createLockEdge,
  createInteriorRoom, createFurnitureMesh, createPond, createNetMesh, NET_SPOTS,
  createCrackMesh, createWetLayer, createBank,
  createCodexBuilding, createCodexInterior, createPedestalBase, createPlaque,
  createPestBug, createKitchen, createPondDecor, createHybridLab,
  createHybridInterior, createHybridCrop, HYBRID_STATIONS,
  createPetHouse, createPetInterior, createPetMesh, createPetDecorMesh,
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
    this.rain = false;      // 暴雨天：持续降雨，生长 ×3，收成也生长不良
    this.items = {};        // 道具背包，和作物背包分开：itemId -> 数量
    this.furniture = { bed: 1 }; // 房子内饰：id -> 已解锁的最高等级(1~3)，床是白送的
    this.furnitureStyle = {};    // 当前展示的外观等级（可在已解锁范围内随意切换）
    this.furniturePos = {};      // 玩家自己摆的位置：id -> { x, z, rotY }
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
          damaged: null,      // 天灾毁地：'cracked' 晒裂 / 'wet' 水泡，修复前不能种
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

    // 我们自己的房子：农田右前方
    const house = createHouse();
    house.position.set(10, -0.51, 4.6);
    house.rotation.y = -0.45;
    this.group.add(house);
    this.houseMeshes = [];
    house.traverse(o => { if (o.isMesh) this.houseMeshes.push(o); });

    // 房子内部的 3D 房间：藏在岛屿下方，进屋时镜头切过去
    this.interior = createInteriorRoom();
    this.interior.position.set(INTERIOR_POS.x, INTERIOR_POS.y, INTERIOR_POS.z);
    this.group.add(this.interior);
    this.interiorFurniture = {};

    // 图鉴大楼：左侧空地 + 藏在岛下的展馆
    this.codex = {}; // 已收录：'tomato:gold' -> true
    const codexBuilding = createCodexBuilding();
    codexBuilding.position.set(-20, -0.51, -5);
    codexBuilding.rotation.y = 0.7;
    this.group.add(codexBuilding);
    this.codexMeshes = [];
    codexBuilding.traverse(o => { if (o.isMesh) this.codexMeshes.push(o); });

    this.codexHall = createCodexInterior();
    this.codexHall.position.set(CODEX_POS.x, CODEX_POS.y, CODEX_POS.z);
    this.group.add(this.codexHall);
    this.codexPedestals = {};
    // 个人图鉴：馆内贵宾区的 10 座金台
    this.displaySlots = Array.from({ length: DISPLAY_SLOTS }, () => ({ item: null, mesh: null }));

    // 黑房子银行：右前方空地
    this.bank = 0; // 存款
    const bank = createBank();
    bank.position.set(14.5, -0.51, 2.5);
    bank.rotation.y = -1;
    this.group.add(bank);
    this.bankMeshes = [];
    bank.traverse(o => { if (o.isMesh) this.bankMeshes.push(o); });

    // 料理工坊：右前方空地
    const kitchen = createKitchen();
    kitchen.position.set(16, -0.51, 11);
    kitchen.rotation.y = -0.5;
    this.group.add(kitchen);
    this.kitchenMeshes = [];
    kitchen.traverse(o => { if (o.isMesh) this.kitchenMeshes.push(o); });

    // 杂交室：前方偏左的玻璃穹顶实验室
    const lab = createHybridLab();
    lab.position.set(-5, -0.51, 14.5);
    lab.rotation.y = 0.2;
    this.group.add(lab);
    this.hybridLabMeshes = [];
    lab.traverse(o => { if (o.isMesh) this.hybridLabMeshes.push(o); });

    // 实验室内部大厅（藏在岛下）+ 5 个培养罩
    this.hybridHall = createHybridInterior();
    this.hybridHall.position.set(HYBRID_POS.x, HYBRID_POS.y, HYBRID_POS.z);
    this.group.add(this.hybridHall);
    this.hybridSlots = Array(HYBRID_SLOTS).fill(null); // { id, readyAt } 或 null
    this.hybridCropMeshes = Array(HYBRID_SLOTS).fill(null);

    // 宠物间：岛上小屋 + 岛下 3D 展厅
    const petHouse = createPetHouse();
    petHouse.position.set(6.5, -0.51, 12.5);
    petHouse.rotation.y = -0.3;
    this.group.add(petHouse);
    this.petHouseMeshes = [];
    petHouse.traverse(o => { if (o.isMesh) this.petHouseMeshes.push(o); });

    this.petHall = createPetInterior();
    this.petHall.position.set(PET_POS.x, PET_POS.y, PET_POS.z);
    this.group.add(this.petHall);
    this.petsOwned = {};        // 买下的宠物
    this.petShown = null;       // 当前展示的那只
    this.petDecorsOwned = {};   // 房间装饰：id -> 已解锁最高等级(1~3)
    this.petDecorStyle = {};    // 当前展示的外观等级（已解锁范围内随意切换）
    this.petMesh = null;
    this.petDecorMeshes = {};

    // 抓鱼水滩：左前方空地
    this.fishNets = Array(FISHING.slots).fill(null); // { readyAt } 或 null
    this.fishing = false;      // 主动钓鱼模式：进了就安心钓，不能干别的
    this.fishingTimer = 0;     // 距下次咬钩的计时
    this.fishingEarned = 0;    // 本次钓鱼小计
    this.pendingCatch = null;  // 咬钩待收杆：{ label, value, clicksLeft, total }
    this.catchQueue = [];      // 同一分钟咬了两条就排队收
    this.pondOwned = {};       // 水塘装饰：id -> true（买断制）
    this.pondPlaced = [];      // 摆出来的装饰 id，最多 3 个
    this.pondDecorMeshes = {}; // id -> mesh
    this.pond = createPond();
    this.pond.position.set(-14, -0.51, 10);
    this.group.add(this.pond);
    this.pondMeshes = [];
    this.pond.traverse(o => { if (o.isMesh) this.pondMeshes.push(o); });
    this.netMeshes = Array(FISHING.slots).fill(null);

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

    this._booting = true; // 读档期间不弹虫害提示
    this.load();
    this.refreshAllVisuals();
    this._booting = false;
  }

  /* ---------- 查询 ---------- */

  tileMeshes() { return this.tiles.map(t => t.mesh); }
  slotMeshes() { return this.decorSlots.map(s => s.mesh); }
  isWet(t) { return this.waterLevel === 2 || t.wetUntil > this.time; }

  /* ---------- 天气（大旱 / 暴雨） ---------- */

  // 天灾随着那天的天气一起结束，土地自然恢复
  healAllTiles() {
    let n = 0;
    for (const t of this.tiles) {
      if (!t.damaged) continue;
      t.damaged = null;
      this.refreshDamageMesh(t);
      t._lastColor = null;
      n += 1;
    }
    return n;
  }

  rollWeather() {
    const healed = this.healAllTiles();
    if (healed && !this._booting) this.onToast(`🌿 天气转好，${healed} 块受灾的地恢复了`);
    const r = Math.random();
    this.setWeather(r < DROUGHT.chance, r >= DROUGHT.chance && r < DROUGHT.chance + RAIN.chance);
    this.onToast(this.drought
      ? '☀️☀️☀️ 大旱天！生长缓慢，今天的收成会生长不良'
      : this.rain
        ? '⛈ 暴雨天！今天的收成会生长不良'
        : '🌅 新的一天，风调雨顺');
    if (this.badWeather()) this.damageTiles(this.drought ? 'cracked' : 'wet');
  }

  // 天灾毁地：随机抽 5~10 块好地，晒裂或泡水
  // 地上的作物同时清场：熟了的抢收进背包，没熟的铲掉退种子钱
  damageTiles(kind) {
    const count = DAMAGE.min + Math.floor(Math.random() * (DAMAGE.max - DAMAGE.min + 1));
    const victims = this.pickRandomTiles(t => !t.locked && !t.damaged, count);
    if (!victims.length) return;
    let harvested = 0, refund = 0;
    victims.forEach(t => {
      t.damaged = kind;
      this.refreshDamageMesh(t);
      if (t.plant) {
        const seed = seedById(t.plant.seedId);
        if (t.plant.stage === 3) {
          const n = SOILS[t.soil].yield;
          const key = (this.badWeather() || t.plant.pest ? 'x:' : '')
            + (t.plant.quality ? `${seed.id}:${t.plant.quality}` : seed.id);
          this.inventory[key] = (this.inventory[key] ?? 0) + n;
          harvested += n;
        } else {
          refund += seed.cost;
        }
        this.removePlant(t);
      }
    });
    if (refund) this.coins += refund;
    this.onState();
    const head = kind === 'cracked' ? `🌵 烈日晒裂了 ${victims.length} 块地！` : `🌊 暴雨泡坏了 ${victims.length} 块地！`;
    const parts = [];
    if (harvested) parts.push(`抢收 ${harvested} 个成熟作物进背包`);
    if (refund) parts.push(`退还种子钱 ${refund}💰`);
    parts.push('用 🔧 恢复器修复');
    this.onToast(head + parts.join('，'));
    this.save();
  }

  refreshDamageMesh(t) {
    const old = t.mesh.children.find(c => c.userData.damage);
    if (old) t.mesh.remove(old);
    if (t.damaged === 'cracked') t.mesh.add(createCrackMesh());
    if (t.damaged === 'wet') t.mesh.add(createWetLayer());
  }

  // 赤手拍虫：直接点掉某块地作物上的虫子，免费
  swatPest(idx) {
    const t = this.tiles[idx];
    if (!t?.plant?.pest) return false;
    t.plant.pest = false;
    const bug = t.plant.mesh?.children.find(c => c.userData.pestBug);
    if (bug) t.plant.mesh.remove(bug);
    const seed = seedById(t.plant.seedId);
    this.onToast(`👏 啪！拍掉了${seed.emoji}${seed.name}上的虫子`);
    this.save();
    return true;
  }

  // 杀虫剂：一键清光全场虫害
  usePesticide() {
    const infested = this.tiles.filter(t => t.plant?.pest);
    if (!infested.length) { this.onToast('地里没有虫害，杀虫剂先收着吧'); return false; }
    infested.forEach(t => {
      t.plant.pest = false;
      const bug = t.plant.mesh?.children.find(c => c.userData.pestBug);
      if (bug) t.plant.mesh.remove(bug);
    });
    this.onToast(`🧴 杀虫剂喷洒全场，清光了 ${infested.length} 处虫害！`);
    return true;
  }

  // 恢复器：随机修一块受灾的地（在道具背包里点「使用」）
  useRestorer() {
    const damaged = this.tiles.filter(t => t.damaged);
    if (!damaged.length) { this.onToast('没有受灾的土地，恢复器先留着吧'); return false; }
    const t = damaged[Math.floor(Math.random() * damaged.length)];
    const wasCracked = t.damaged === 'cracked';
    t.damaged = null;
    this.refreshDamageMesh(t);
    this.onToast(`🔧 修好了一块${wasCracked ? '晒裂' : '泡水'}的地，还剩 ${damaged.length - 1} 块受灾`);
    return true;
  }

  setWeather(drought, rain) {
    this.drought = drought;
    this.rain = rain;
    for (const t of this.tiles) {
      if (t.plant?.mesh) this.applyWeatherTint(t.plant.mesh);
    }
  }

  badWeather() { return this.drought || this.rain; }

  // 恶劣天气下作物变色缩水：大旱发黄、暴雨灰蓝；恢复时还原本色
  applyWeatherTint(root) {
    const tint = this.drought ? 0xd8c26a : this.rain ? 0x7a8a99 : null;
    root.traverse(o => {
      if (!o.isMesh) return;
      if (o.userData.origColor === undefined) o.userData.origColor = o.material.color.getHex();
      o.material.color.setHex(o.userData.origColor);
      if (tint !== null) o.material.color.lerp(new THREE.Color(tint), 0.4);
    });
    if (!root.userData.bob) root.scale.setScalar(tint !== null ? 0.85 : 1);
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
    if (t.damaged) { this.onToast(`这块地${t.damaged === 'cracked' ? '晒裂' : '被水泡'}了，去道具背包用 🔧 恢复器修复`); return; }
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
      const key = (this.badWeather() || t.plant.pest ? 'x:' : '')
        + (t.plant.quality ? `${seed.id}:${t.plant.quality}` : seed.id);
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
      if (!t || t.plant || t.locked || t.damaged) return;
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
    const key = (this.badWeather() || t.plant.pest ? 'x:' : '') + (quality ? `${seed.id}:${quality}` : seed.id);
    const wasPest = t.plant.pest;
    this.removePlant(t);
    this.inventory[key] = (this.inventory[key] ?? 0) + count;
    this.onState();
    const q = QUALITIES[quality];
    this.onToast(wasPest
      ? `🐛 被虫啃过的${seed.name} ×${count} 放入背包（生长不良）`
      : q
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

  buyItem(id, count = 1) {
    const item = itemById(id);
    if (!item) return;
    // 永久工具一件就够
    if (item.once && (this.items[id] ?? 0) > 0) { this.onToast(`${item.emoji} ${item.name}已经有了，一件就够用`); return; }
    const n = item.once ? 1 : Math.max(1, Math.floor(count));
    if (!this.spend(item.cost * n)) return;
    this.items[id] = (this.items[id] ?? 0) + n;
    this.onToast(`${item.emoji} 买了 ${n} 个${item.name}，放进道具背包`);
    this.onState();
    this.save();
  }

  useItem(id) {
    if ((this.items[id] ?? 0) <= 0) return;
    if (id === 'net') { this.onToast('🕸️ 抓鱼网要拿到水滩去摆（点击左前方的水塘）'); return; }
    if (id === 'rod' || id === 'castnet') { this.onToast('🎣 渔具带在身上就行，点击水塘开始钓鱼'); return; }
    const ok = id === 'fertilizer' ? this.useFertilizer()
      : id === 'restorer' ? this.useRestorer()
      : id === 'pesticide' ? this.usePesticide()
      : this.useLuck();
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

  /* ---------- 图鉴大楼 ---------- */

  codexKeys() {
    // 42 个展位：14 作物 × 3 品质
    const keys = [];
    SEEDS.forEach(s => CODEX_QUALITIES.forEach(q => keys.push(q ? `${s.id}:${q}` : s.id)));
    return keys;
  }

  codexCount() { return Object.keys(this.codex).length; }

  codexSlotPos(idx) {
    const col = idx % 6, row = Math.floor(idx / 6);
    return { x: (col - 2.5) * 2.5, z: (row - 3) * 2.7 - 4.4 }; // 整体靠后，给贵宾区腾地方
  }

  buildCodexPedestal(key) {
    const old = this.codexPedestals[key];
    if (old) this.codexHall.remove(old);
    const idx = this.codexKeys().indexOf(key);
    if (idx < 0) return;
    const info = keyInfo(key);
    const filled = !!this.codex[key];
    const g = new THREE.Group();
    g.add(createPedestalBase(filled));
    // 说明牌：收录后写明数据，没收录只显示名字
    const fmt = (s) => s >= 60 ? `${Math.floor(s / 60)}分${s % 60 ? `${s % 60}秒` : ''}` : `${s}秒`;
    const qName = info.quality ? QUALITIES[info.quality].name : '普通';
    const lines = filled
      ? [`${info.icon} ${info.label}`, `品质：${qName}`,
         `生长：${fmt(info.seed.growTime)} · 种子：${info.seed.cost}💰`, `售价：${info.price}💰`]
      : [`${qName}${info.seed.name}`, '—— 未收录 ——'];
    g.add(createPlaque(lines, !filled));
    // 收录了就把作物摆上台
    if (filled) {
      const crop = createPlantMesh(info.seed.id, 3);
      applyPlating(crop, info.quality);
      crop.position.y = 1.47;
      crop.scale.setScalar(2.1);
      g.add(crop);
    }
    const { x, z } = this.codexSlotPos(idx);
    g.position.set(x, 0, z);
    this.codexHall.add(g);
    this.codexPedestals[key] = g;
  }

  refreshCodex() {
    this.codexKeys().forEach(key => this.buildCodexPedestal(key));
  }

  donateCodex(key) {
    if (key.startsWith('p:') || key.startsWith('x:') || key.startsWith('k:') || key.startsWith('h:') || key === EGG.key) {
      this.onToast('图鉴只收录新鲜的作物本体');
      return false;
    }
    if (this.codex[key]) { this.onToast('这个品质的作物已经收录过啦'); return false; }
    if ((this.inventory[key] ?? 0) <= 0) return false;
    this.inventory[key] -= 1;
    if (this.inventory[key] === 0) delete this.inventory[key];
    this.codex[key] = true;
    this.buildCodexPedestal(key);
    const info = keyInfo(key);
    this.onToast(`📖 ${info.icon}${info.label} 收录成功！图鉴进度 ${this.codexCount()}/42`);
    this.onState();
    this.save();
    return true;
  }

  /* ---------- 料理工坊 ---------- */

  // 某道料理的原料够不够
  canCook(dishId) {
    const dish = dishById(dishId);
    return dish.recipe.every(([id, q, n]) => (this.inventory[ingredientKey(id, q)] ?? 0) >= n);
  }

  cookDish(dishId) {
    const dish = dishById(dishId);
    if (!this.canCook(dishId)) { this.onToast('原料不够，先凑齐配方吧'); return false; }
    dish.recipe.forEach(([id, q, n]) => {
      const key = ingredientKey(id, q);
      this.inventory[key] -= n;
      if (this.inventory[key] <= 0) delete this.inventory[key];
    });
    const dkey = 'k:' + dishId;
    this.inventory[dkey] = (this.inventory[dkey] ?? 0) + 1;
    this.onToast(`🍳 做好了${dish.emoji}${dish.name}！放入背包`);
    this.onState();
    this.save();
    return true;
  }

  /* ---------- 宠物间 ---------- */

  buyPet(id) {
    const p = petById(id);
    if (!p || this.petsOwned[id]) return;
    if (!this.spend(p.cost)) return;
    this.petsOwned[id] = true;
    if (!this.petShown) this.petShown = id; // 第一只自动上台
    this.refreshPetRoom();
    this.onToast(`${p.emoji} ${p.name}来到你家啦！`);
    this.onState();
    this.save();
  }

  showPet(id) {
    if (!this.petsOwned[id]) return;
    this.petShown = id;
    this.refreshPetRoom();
    this.onToast(`${petById(id).emoji} ${petById(id).name}上台展示中`);
    this.onState();
    this.save();
  }

  buyPetDecor(id) {
    const d = petDecorById(id);
    if (!d || this.petDecorsOwned[id]) return;
    if (!this.spend(d.cost)) return;
    this.petDecorsOwned[id] = 1;
    this.refreshPetRoom();
    this.onToast(`${d.emoji} ${d.name}摆进宠物间`);
    this.onState();
    this.save();
  }

  upgradePetDecor(id) {
    const d = petDecorById(id);
    const lv = this.petDecorsOwned[id] ?? 0;
    if (!d || !lv) return;
    if (lv >= 3) { this.onToast(`${d.name}已经是满级了`); return; }
    if (!this.spend(d.up[lv - 1])) return;
    this.petDecorsOwned[id] = lv + 1;
    this.petDecorStyle[id] = lv + 1; // 刚升的新外观先亮出来
    this.refreshPetRoom();
    this.onToast(`${d.emoji} ${d.name}升级成「${d.levelNames[lv]}」！`);
    this.onState();
    this.save();
  }

  // 在已解锁的等级里切换外观，不花钱
  setPetDecorStyle(id, lv) {
    const d = petDecorById(id);
    const max = this.petDecorsOwned[id] ?? 0;
    if (!d || lv < 1 || lv > max) return;
    this.petDecorStyle[id] = lv;
    this.refreshPetRoom();
    this.onToast(`${d.emoji} 换成了「${d.levelNames[lv - 1]}」`);
    this.onState();
    this.save();
  }

  refreshPetRoom() {
    // 展示台上的宠物（同时只能一只）
    if (this.petMesh) { this.petHall.remove(this.petMesh); this.petMesh = null; }
    if (this.petShown && this.petsOwned[this.petShown]) {
      const def = petById(this.petShown);
      if (def) {
        const m = createPetMesh(def);
        m.position.set(0, 0.35, -1.6);
        m.userData.petIdle = true; // 待机小动作
        this.petHall.add(m);
        this.petMesh = m;
      }
    }
    // 房间装饰：按当前展示外观重建
    PET_DECORS.forEach(d => {
      const max = this.petDecorsOwned[d.id] ?? 0;
      const lv = max > 0 ? Math.min(this.petDecorStyle[d.id] ?? max, max) : 0;
      const cur = this.petDecorMeshes[d.id];
      if (cur && cur.userData.lv === lv) return;
      if (cur) { this.petHall.remove(cur); delete this.petDecorMeshes[d.id]; }
      if (lv > 0) {
        const m = createPetDecorMesh(d, lv);
        m.userData.lv = lv;
        m.position.set(d.pos[0], 0, d.pos[1]);
        this.petHall.add(m);
        this.petDecorMeshes[d.id] = m;
      }
    });
  }

  /* ---------- 杂交室 ---------- */

  canHybrid(id) {
    const h = hybridById(id);
    const ka = ingredientKey(h.a[0], h.a[1]);
    const kb = ingredientKey(h.b[0], h.b[1]);
    if (ka === kb) return (this.inventory[ka] ?? 0) >= 2; // 同料配对要两个
    return (this.inventory[ka] ?? 0) >= 1 && (this.inventory[kb] ?? 0) >= 1;
  }

  makeHybrid(id) {
    const h = hybridById(id);
    const slot = this.hybridSlots.findIndex(s => !s);
    if (slot < 0) { this.onToast('5 个培养罩都占着，先取出培养好的'); return false; }
    if (!this.canHybrid(id)) { this.onToast('原料不够，凑齐两种作物再来'); return false; }
    [h.a, h.b].forEach(([sid, q]) => {
      const key = ingredientKey(sid, q);
      this.inventory[key] -= 1;
      if (this.inventory[key] <= 0) delete this.inventory[key];
    });
    this.hybridSlots[slot] = { id, readyAt: this.time + HYBRID_TIME };
    this.refreshHybridStations();
    this.onToast(`🧬 ${h.emoji}${h.name}进入 ${slot + 1} 号培养罩，${HYBRID_TIME / 60} 分钟后来取`);
    this.onState();
    this.save();
    return true;
  }

  collectHybrid(slot) {
    const s = this.hybridSlots[slot];
    if (!s || this.time < s.readyAt) return;
    const h = hybridById(s.id);
    const hkey = 'h:' + s.id;
    this.inventory[hkey] = (this.inventory[hkey] ?? 0) + 1;
    this.hybridSlots[slot] = null;
    this.refreshHybridStations();
    this.onToast(`🧬 培养完成！${h.emoji}${h.name}放入背包`);
    this.onState();
    this.save();
  }

  // 培养罩里的 3D 模型：有作物就摆上，没有就空着
  refreshHybridStations() {
    this.hybridSlots.forEach((s, k) => {
      if (this.hybridCropMeshes[k]) {
        this.hybridHall.remove(this.hybridCropMeshes[k]);
        this.hybridCropMeshes[k] = null;
      }
      if (s) {
        const m = createHybridCrop(s.id);
        const [x, z] = HYBRID_STATIONS[k];
        m.position.set(x, 0.56, z);
        this.hybridHall.add(m);
        this.hybridCropMeshes[k] = m;
      }
    });
    this.updateHybridVisuals();
  }

  // 培养进度可视化：作物随进度从小长大
  updateHybridVisuals() {
    this.hybridSlots.forEach((s, k) => {
      const m = this.hybridCropMeshes[k];
      if (!s || !m) return;
      const p = Math.min(1, 1 - (s.readyAt - this.time) / HYBRID_TIME);
      m.scale.setScalar(0.45 + 0.55 * p);
    });
  }

  /* ---------- 黑房子银行 ---------- */

  bankDeposit(amount) {
    const n = Math.min(amount, this.coins);
    if (n <= 0) { this.onToast('没钱可存了'); return; }
    this.coins -= n;
    this.bank += n;
    this.onToast(`🏦 存入 ${n}💰，银行余额 ${this.bank}`);
    this.onState();
    this.save();
  }

  bankWithdraw(amount) {
    const n = Math.min(amount, this.bank);
    if (n <= 0) { this.onToast('银行里没钱可取'); return; }
    this.bank -= n;
    this.coins += n;
    this.onToast(`🏦 取出 ${n}💰，银行余额 ${this.bank}`);
    this.onState();
    this.save();
  }

  // 每天结束结算：85% 赚 1~3，15% 亏 1~3
  bankDelta() {
    const mag = BANK.magMin + Math.floor(Math.random() * (BANK.magMax - BANK.magMin + 1));
    return Math.random() < BANK.gainChance ? mag : -mag;
  }

  settleBank() {
    if (this.bank <= 0) return;
    const delta = this.bankDelta();
    this.bank = Math.max(0, this.bank + delta);
    this.onState();
    if (delta > 0) this.onToast(`🏦 银行日结：赚了 +${delta}💰`);
    else this.onToast(`🏦 银行日结：亏了 ${delta}💰…`);
  }

  /* ---------- 抓鱼水滩 ---------- */

  // —— 主动钓鱼 ——

  startFishing(gear = 'rod') {
    if ((this.items[gear] ?? 0) <= 0) {
      this.onToast(gear === 'rod' ? '先去商场买根 🎣 鱼竿（100💰）' : '先去商场买张 🥅 渔网（110💰）');
      return false;
    }
    this.fishing = true;
    this.fishingGear = gear;
    this.fishingTimer = 0;
    this.fishingEarned = 0;
    this.onToast(gear === 'rod' ? '🎣 甩竿！安心钓鱼，每分钟看一次动静' : '🥅 撒网！每分钟收一次网');
    return true;
  }

  // 钓到一半换装备（钩上有鱼时不行）
  switchGear() {
    if (!this.fishing || this.pendingCatch) return;
    const other = this.fishingGear === 'rod' ? 'castnet' : 'rod';
    if ((this.items[other] ?? 0) <= 0) { this.onToast('另一件渔具还没买呢'); return; }
    this.fishingGear = other;
    this.onToast(other === 'rod' ? '🎣 换上鱼竿，稳稳地钓' : '🥅 换上渔网，搏一把大的');
  }

  stopFishing() {
    if (!this.fishing) return;
    this.fishing = false;
    const escaped = (this.pendingCatch ? 1 : 0) + this.catchQueue.length;
    this.pendingCatch = null;
    this.catchQueue = [];
    if (escaped > 0) this.onToast(`💨 ${escaped} 条没收完杆的鱼跑掉了…`);
    this.onToast(this.fishingEarned > 0
      ? `🎣 收竿！这趟一共钓了 ${this.fishingEarned}💰`
      : '🎣 收竿，空手而归也是一种修行');
  }

  // 咬钩后排进收杆队列：点击次数 = 金额 + 5（5块10下、6块11下…）
  queueCatch(label, value) {
    const c = { label, value, total: value + 5, clicksLeft: value + 5 };
    if (this.pendingCatch) this.catchQueue.push(c);
    else this.pendingCatch = c;
  }

  // 收杆按钮点一下拉一下，拉完鱼才到手
  reelClick() {
    const c = this.pendingCatch;
    if (!c) return;
    c.clicksLeft -= 1;
    if (c.clicksLeft > 0) return;
    this.coins += c.value;
    this.fishingEarned += c.value;
    this.onToast(`${c.label} 钓上来了！+${c.value}💰`);
    this.pendingCatch = this.catchQueue.shift() ?? null;
    if (this.pendingCatch) this.onToast('🐟 又一条在钩上，继续收杆！');
    this.onState();
    this.save();
  }

  // 每满 1 分钟按当前装备看一次动静：鱼竿 90% 5~10 / 渔网 70% 10~20
  // 咬钩后计时暂停——鱼在钩上，先收杆再说
  tickFishing(dt) {
    if (!this.fishing) return;
    if (this.pendingCatch) return;
    this.fishingTimer += dt;
    if (this.fishingTimer < 60) return;
    this.fishingTimer -= 60;
    const usingRod = this.fishingGear === 'rod';
    const cfg = usingRod ? ROD : CASTNET;
    if (Math.random() < cfg.chance) {
      this.queueCatch(usingRod ? '🎣 鱼竿' : '🥅 渔网',
        cfg.min + Math.floor(Math.random() * (cfg.max - cfg.min + 1)));
      this.onToast('🐟 有鱼咬钩了！快点收杆！');
    } else {
      this.onToast(usingRod ? '🎣 没咬钩…' : '🥅 空网…');
    }
    this.onState();
  }

  // —— 水塘装饰 ——

  buyPondDecor(id) {
    const d = pondDecorById(id);
    if (!d) return;
    if (this.pondOwned[id]) { this.onToast(`${d.name}已经买过了`); return; }
    if (!this.spend(d.cost)) return;
    this.pondOwned[id] = true;
    this.onToast(`🦆 买下了${d.name}，去水塘摆出来吧`);
    this.onState();
    this.save();
  }

  placePondDecor(id) {
    const d = pondDecorById(id);
    if (!d || !this.pondOwned[id] || this.pondPlaced.includes(id)) return;
    if (this.pondPlaced.length >= POND_MAX_PLACED) {
      this.onToast(`水塘最多摆 ${POND_MAX_PLACED} 个装饰，先收一个`);
      return;
    }
    this.pondPlaced.push(id);
    this.refreshPondDecors();
    this.onToast(`🦆 ${d.name}下水啦！`);
    this.onState();
    this.save();
  }

  removePondDecor(id) {
    const i = this.pondPlaced.indexOf(id);
    if (i < 0) return;
    this.pondPlaced.splice(i, 1);
    this.refreshPondDecors();
    this.onToast(`收起了${pondDecorById(id).name}`);
    this.onState();
    this.save();
  }

  refreshPondDecors() {
    Object.values(this.pondDecorMeshes).forEach(m => this.pond.remove(m));
    this.pondDecorMeshes = {};
    this.pondPlaced.forEach((id, slot) => {
      const d = pondDecorById(id);
      if (!d) return;
      const m = createPondDecor(d, slot);
      this.pond.add(m);
      this.pondDecorMeshes[id] = m;
    });
  }

  placeNet(k) {
    if (this.fishNets[k]) return;
    if ((this.items.net ?? 0) <= 0) { this.onToast('没有抓鱼网了，商场有售 100💰'); return; }
    this.items.net -= 1;
    if (this.items.net === 0) delete this.items.net;
    this.fishNets[k] = { readyAt: this.time + FISHING.time };
    this.refreshNets();
    this.onToast(`🕸️ 网摆好了，${FISHING.time / 60} 分钟后来收`);
    this.onState();
    this.save();
  }

  collectNet(k) {
    const n = this.fishNets[k];
    if (!n || this.time < n.readyAt) return;
    const reward = FISHING.rewardMin + Math.floor(Math.random() * (FISHING.rewardMax - FISHING.rewardMin + 1));
    this.fishNets[k] = null;
    this.refreshNets();
    this.gain(reward);
    this.onToast(`🎣 收网！捞上来 ${reward}💰 ${reward >= 100 ? '，血赚' : '，亏了…'}`);
    this.save();
  }

  refreshNets() {
    this.fishNets.forEach((n, k) => {
      const has = !!n;
      if (has && !this.netMeshes[k]) {
        const m = createNetMesh();
        m.position.set(this.pond.position.x + NET_SPOTS[k][0], -0.2, this.pond.position.z + NET_SPOTS[k][1]);
        m.rotation.y = k * 1.2;
        this.group.add(m);
        this.netMeshes[k] = m;
      }
      if (!has && this.netMeshes[k]) {
        this.group.remove(this.netMeshes[k]);
        this.netMeshes[k] = null;
      }
    });
  }

  /* ---------- 房子 ---------- */

  buyFurniture(id) {
    const f = furnitureById(id);
    if (!f || this.furniture[id]) return;
    if (!this.spend(f.cost)) return;
    this.furniture[id] = 1;
    this.refreshInterior();
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
    this.furnitureStyle[id] = lv + 1; // 刚买的新外观先亮出来
    this.refreshInterior();
    this.onToast(`${f.emoji} ${f.name}升级成「${f.levelNames[lv]}」！`);
    this.onState();
    this.save();
  }

  // 在已解锁的等级里切换展示外观，不花钱
  setFurnitureStyle(id, lv) {
    const f = furnitureById(id);
    const max = this.furniture[id] ?? 0;
    if (!f || lv < 1 || lv > max) return;
    this.furnitureStyle[id] = lv;
    this.refreshInterior();
    this.onToast(`${f.emoji} 换成了「${f.levelNames[lv - 1]}」`);
    this.onState();
    this.save();
  }

  // 按当前展示外观重建房间里的 3D 模型
  refreshInterior() {
    for (const f of FURNITURE) {
      const max = this.furniture[f.id] ?? 0;
      const lv = max > 0 ? Math.min(this.furnitureStyle[f.id] ?? max, max) : 0;
      const cur = this.interiorFurniture[f.id];
      const place = (m) => {
        const p = this.furniturePos[f.id];
        m.position.set(p ? p.x : f.pos[0], 0, p ? p.z : f.pos[1]);
        m.rotation.y = p ? p.rotY : (f.rotY ?? 0);
      };
      if (cur && cur.userData.lv === lv) { place(cur); continue; } // 外观没变，只同步位置
      if (cur) { this.interior.remove(cur); delete this.interiorFurniture[f.id]; }
      if (lv > 0) {
        const m = createFurnitureMesh(f.id, lv);
        m.userData.lv = lv;
        place(m);
        m.traverse(o => { if (o.isMesh) o.userData.furnitureId = f.id; });
        this.interior.add(m);
        this.interiorFurniture[f.id] = m;
      }
    }
  }

  /* ---------- 自由布置 ---------- */

  furnitureMeshes() {
    const out = [];
    Object.values(this.interiorFurniture).forEach(g =>
      g.traverse(o => { if (o.isMesh) out.push(o); }));
    return out;
  }

  // 拖动落点：限制在墙内
  setFurniturePos(id, x, z) {
    const m = this.interiorFurniture[id];
    if (!m) return;
    const lim = 11.4;
    const nx = Math.max(-lim, Math.min(lim, x));
    const nz = Math.max(-lim, Math.min(lim, z));
    m.position.x = nx;
    m.position.z = nz;
    this.furniturePos[id] = { x: nx, z: nz, rotY: m.rotation.y };
  }

  rotateFurniture(id) {
    const m = this.interiorFurniture[id];
    if (!m) return;
    m.rotation.y = (m.rotation.y + Math.PI / 4) % (Math.PI * 2);
    this.furniturePos[id] = { x: m.position.x, z: m.position.z, rotY: m.rotation.y };
    this.save();
  }

  resetFurnitureLayout() {
    this.furniturePos = {};
    Object.entries(this.interiorFurniture).forEach(([id, m]) => {
      const f = furnitureById(id);
      m.position.set(f.pos[0], 0, f.pos[1]);
      m.rotation.y = f.rotY ?? 0;
    });
    this.onToast('🏠 家具已恢复默认布局');
    this.save();
  }

  comfort() {
    return Object.entries(this.furniture)
      .reduce((sum, [, lv]) => sum + lv * 5, 0);
  }

  // 睡觉：晚上睡到第二天早上 6 点，白天午睡到傍晚 6 点天黑
  // 这段时间的生长和加工照常结算
  sleep() {
    const wasNight = this.isNight();
    const target = wasNight ? DAY_CYCLE : DAY_CYCLE / 2; // 时钟 0=早6点，600=晚6点
    const remain = target - this.clock;
    const step = 1.5;
    for (let t = 0; t < remain; t += step) this.tick(Math.min(step, remain - t));
    this.onToast(wasNight ? '😴 一觉睡到大天亮！' : '😴 午觉睡醒，天都黑了');
    this.save();
    return true;
  }

  /* ---------- 个人图鉴（图鉴大楼贵宾区） ---------- */

  buildGallerySlot(k) {
    const s = this.displaySlots[k];
    if (s.mesh) this.codexHall.remove(s.mesh);
    const g = new THREE.Group();
    g.add(createGalleryPedestal(!!s.item));
    if (s.item) {
      const info = keyInfo(s.item.key);
      const crop = createPlantMesh(info.seed.id, 3);
      applyPlating(crop, info.quality);
      crop.position.y = 1.56;
      crop.scale.setScalar(1.9);
      g.add(crop);
    }
    const { x, z } = galleryPedestalPos(k);
    g.position.set(x, 0, z);
    this.codexHall.add(g);
    s.mesh = g;
  }

  refreshGallery() {
    for (let k = 0; k < this.displaySlots.length; k++) this.buildGallerySlot(k);
  }

  placeDisplay(k, key) {
    const s = this.displaySlots[k];
    if (s.item) { this.onToast('这个展台已经摆着东西了'); return false; }
    if (key.startsWith('p:') || key.startsWith('k:') || key.startsWith('h:') || key === EGG.key) { this.onToast('个人图鉴只摆作物本物～'); return false; }
    if (key.startsWith('x:')) { this.onToast('蔫了吧唧的就别摆出来了吧…'); return false; }
    if ((this.inventory[key] ?? 0) <= 0) return false;
    this.inventory[key] -= 1;
    if (this.inventory[key] === 0) delete this.inventory[key];
    s.item = { key };
    this.buildGallerySlot(k);
    this.onToast(`🏆 ${keyInfo(key).icon}${keyInfo(key).label}摆上了个人图鉴`);
    this.onState();
    this.save();
    return true;
  }

  takeDisplay(k) {
    const s = this.displaySlots[k];
    if (!s.item) return;
    const key = s.item.key;
    s.item = null;
    this.buildGallerySlot(k);
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
    if (key.startsWith('k:')) { this.onToast('料理不能做成罐头'); return; }
    if (key.startsWith('h:')) { this.onToast('杂交作物是稀世珍品，直接卖个好价吧'); return; }
    if (key === EGG.key) { this.onToast('恐龙虾卵可不能做成罐头！'); return; }
    if (key.startsWith('x:')) { this.onToast('生长不良的作物做不成罐头，贱卖了吧'); return; }
    const need = WORKSHOP.ingredients;
    if ((this.inventory[key] ?? 0) < need) {
      this.onToast(`${need} 个才能加工成 1 个罐头，数量不够`);
      return;
    }
    this.inventory[key] -= need;
    if (this.inventory[key] <= 0) delete this.inventory[key];
    this.workshop[slot] = { key, readyAt: this.time + WORKSHOP.time };
    const info = keyInfo(key);
    this.onToast(`${info.icon}${info.label} ×${need} 开始加工 ⏳${WORKSHOP.time}秒`);
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
    // 成熟那一刻掷虫害骰子，每株只掷一次
    if (stage === 3 && !t.plant.pestRolled) {
      t.plant.pestRolled = true;
      if (Math.random() < PEST.chance) {
        t.plant.pest = true;
        if (!this._booting) this.onToast(`🐛 ${seed.emoji}${seed.name}生虫了！不打药收上来就是生长不良`);
      }
    }
    const mesh = createPlantMesh(seed.id, stage);
    applyPlating(mesh, t.plant.quality);
    mesh.userData.plantRoot = true;
    if (this.badWeather()) this.applyWeatherTint(mesh);
    if (t.plant.pest) mesh.add(createPestBug());
    t.plant.mesh = this.attachMesh(mesh, t);
  }

  refreshAllVisuals() {
    for (const t of this.tiles) {
      if (t.plant) { t.plant.stage = -1; this.updatePlantMesh(t); }
      this.refreshLockEdge(t);
      this.refreshDamageMesh(t);
      t._lastColor = null;
    }
    for (const s of this.decorSlots) {
      if (s.decor && !s.decor.mesh) s.decor.mesh = this.attachDecorMesh(s.decor.id, s);
    }
    this.refreshInterior();
    this.refreshCodex();
    this.refreshGallery();
    this.refreshPondDecors();
    this.refreshHybridStations();
    this.refreshPetRoom();
  }

  /* ---------- 主循环 ---------- */

  tick(dt) {
    if (this.paused) return; // 挂机中：时间、生长、加工全部冻结
    this.time += dt;
    const wrapped = this.clock + dt >= DAY_CYCLE;
    this.clock = (this.clock + dt) % DAY_CYCLE;
    if (wrapped) {
      this.rollWeather(); // 每天早上 6 点掷天气骰子
      this.settleBank();  // 银行日结
    }

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

    this.tickFishing(dt);

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
      const key = `${base}-${wet}-${t.lucky}-${t.locked}-${t.damaged}`;
      if (t._lastColor !== key) {
        t._lastColor = key;
        const c = new THREE.Color(base);
        if (wet) c.multiplyScalar(0.6).add(new THREE.Color(0x0a1420));
        if (t.lucky) c.lerp(new THREE.Color(0xb35de0), 0.35);
        if (t.locked) c.lerp(new THREE.Color(0x5c6b52), 0.55); // 未解锁的荒地
        if (t.damaged === 'cracked') c.lerp(new THREE.Color(0xd4b98a), 0.65); // 晒到发白干裂
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
      furnitureStyle: this.furnitureStyle,
      furniturePos: this.furniturePos,
      tiles: this.tiles.map(t => ({
        soil: t.soil,
        lucky: t.lucky,
        locked: t.locked,
        damaged: t.damaged,
        wetRemain: Math.max(0, t.wetUntil - this.time),
        plant: t.plant ? {
          seedId: t.plant.seedId, progress: t.plant.progress, quality: t.plant.quality ?? null,
          pest: !!t.plant.pest, pestRolled: !!t.plant.pestRolled,
        } : null,
      })),
      decorSlots: this.decorSlots.map(s => s.decor?.id ?? null),
      displaySlots: this.displaySlots.map(s => s.item?.key ?? null),
      workshop: this.workshop.map(s => s ? { key: s.key, remain: Math.max(0, s.readyAt - this.time) } : null),
      fishNets: this.fishNets.map(n => n ? { remain: Math.max(0, n.readyAt - this.time) } : null),
      pondOwned: this.pondOwned,
      pondPlaced: this.pondPlaced,
      hybridSlots: this.hybridSlots.map(s => s ? { id: s.id, remain: Math.max(0, s.readyAt - this.time) } : null),
      petsOwned: this.petsOwned,
      petShown: this.petShown,
      petDecorsOwned: this.petDecorsOwned,
      petDecorStyle: this.petDecorStyle,
      clock: this.clock,
      windTimer: this.windTimer,
      drought: this.drought,
      rain: this.rain,
      savedLayouts: this.savedLayouts,
      layoutSeq: this.layoutSeq,
      paused: this.paused,
      bank: this.bank,
      codex: this.codex,
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
    this.codex = data.codex ?? {};
    this.furniture = data.furniture ?? { bed: 1 };
    if (!this.furniture.bed) this.furniture.bed = 1; // 床永远都在
    this.furnitureStyle = data.furnitureStyle ?? {};
    this.furniturePos = data.furniturePos ?? {};
    // 旧存档只有 lastLayout 的话，迁移成第一个已保存布局
    this.savedLayouts = data.savedLayouts
      ?? (data.lastLayout?.some(Boolean) ? [{ name: '上次布局', layout: data.lastLayout }] : []);
    this.layoutSeq = data.layoutSeq ?? this.savedLayouts.length;
    this.paused = data.paused ?? false;
    // 挂机状态下关的游戏，离线时间不生效
    const elapsed = this.paused ? 0 : Math.max(0, (Date.now() - (data.savedAt ?? Date.now())) / 1000);
    this.drought = data.drought ?? false;
    this.rain = data.rain ?? false;
    // 离线跨过了新的一天就重掷天气
    const offlineDays = Math.floor(((data.clock ?? 0) + elapsed) / DAY_CYCLE);
    if (offlineDays > 0) {
      const r = Math.random();
      this.drought = r < DROUGHT.chance;
      this.rain = r >= DROUGHT.chance && r < DROUGHT.chance + RAIN.chance;
      this._pendingHeal = true; // 隔了一天，之前的天灾都该消退了
      if (this.badWeather()) this._pendingDamage = true; // 地块数据还没读完，稍后再毁地
    }
    // 银行离线也每天日结
    this.bank = data.bank ?? 0;
    for (let d = 0; d < offlineDays && this.bank > 0; d++) {
      this.bank = Math.max(0, this.bank + this.bankDelta());
    }
    this.clock = ((data.clock ?? DAY_CYCLE / 4) + elapsed) % DAY_CYCLE; // 离线时时间照样流逝
    data.tiles?.forEach((s, idx) => {
      const t = this.tiles[idx];
      if (!t || !s) return;
      t.soil = s.soil ?? 0;
      t.lucky = s.lucky ?? false;
      // 老存档没有 locked 字段：二层默认上锁，但已经种着东西的地放行
      t.locked = s.locked ?? (t.level === 1 && !s.plant);
      t.damaged = s.damaged ?? null;
      const wetRemain = s.wetRemain ?? 0;
      // 离线生长：自动灌溉全程生效，否则只按剩余湿润时间生长
      if (s.plant) {
        const seed = seedById(s.plant.seedId);
        const wetTime = this.waterLevel === 2 ? elapsed : Math.min(elapsed, wetRemain);
        const progress = Math.min(seed.growTime, s.plant.progress + wetTime * SOILS[t.soil].speed);
        t.plant = {
          seedId: s.plant.seedId, progress, stage: -1, quality: s.plant.quality ?? null,
          pest: !!s.plant.pest, pestRolled: !!s.plant.pestRolled,
        };
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
    // 鱼网：离线也照常捕鱼
    (data.fishNets ?? []).forEach((n, k) => {
      if (n && k < this.fishNets.length) {
        this.fishNets[k] = { readyAt: this.time + Math.max(0, n.remain - elapsed) };
      }
    });
    this.refreshNets();
    this.pondOwned = data.pondOwned ?? {};
    this.pondPlaced = (data.pondPlaced ?? []).filter(id => pondDecorById(id)).slice(0, POND_MAX_PLACED);
    this.petsOwned = data.petsOwned ?? {};
    this.petShown = data.petShown && this.petsOwned[data.petShown] ? data.petShown : null;
    this.petDecorsOwned = data.petDecorsOwned ?? {};
    // 老存档里是 true，换算成 1 级
    Object.keys(this.petDecorsOwned).forEach(k => {
      if (this.petDecorsOwned[k] === true) this.petDecorsOwned[k] = 1;
    });
    this.petDecorStyle = data.petDecorStyle ?? {};
    // 培养罩：离线也照常培养
    (data.hybridSlots ?? []).forEach((s, k) => {
      if (s && k < this.hybridSlots.length && hybridById(s.id)) {
        this.hybridSlots[k] = { id: s.id, readyAt: this.time + Math.max(0, s.remain - elapsed) };
      }
    });
    // 离线跨天：旧的天灾先消退，再按新天气重新受灾
    if (this._pendingHeal) {
      this._pendingHeal = false;
      this.healAllTiles();
    }
    if (this._pendingDamage) {
      this._pendingDamage = false;
      this.damageTiles(this.drought ? 'cracked' : 'wet');
    }
  }
}

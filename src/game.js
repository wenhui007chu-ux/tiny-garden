import * as THREE from 'three';
import {
  GRID, LEVELS, WET_DURATION, START_COINS,
  SEEDS, SOILS, WATER_LEVELS, seedById, seedName, decorById,
  QUALITIES, GOLD_CHANCE, SILVER_CHANCE, WORKSHOP, keyInfo,
  DAY_CYCLE, NIGHT_SLOW, QUICK_WATER_COST, EGG, DROUGHT, RAIN, itemById, furnitureById,
  UNLOCK_COST, FURNITURE, INTERIOR_POS, FISHING, DAMAGE, BANK,
  CODEX_POS, CODEX_QUALITIES, PEST, POISON,
  DISHES, dishById, ingredientKey, ROD, CASTNET, COOK_TIME, COOK_SLOTS,
  pondDecorById, pondName, POND_MAX_PLACED, HYBRIDS, hybridById,
  HYBRID_POS, HYBRID_TIME, HYBRID_SLOTS,
  PETS, petById, PET_DECORS, petDecorById, PET_POS,
  FURNITURE_MAX_LEVEL,
  HOUSE_SKINS, HOUSE_SKIN_COST, DEFAULT_HOUSE_SKIN,
  FLOWERS, flowerById, flowerName, GREENHOUSE_POS, GREENHOUSE_SLOTS, BOUQUET_SIZE, BOUQUET_MULT,
  ACHIEVEMENTS, ACHIEVEMENT_POS, CODEX_SEEDS,
  SORTER_SLOTS, SORTER_TIME, METAL, metalPrice, PESTICIDE,
  SEAFOOD, seafoodById, seafoodName, rollSeafood,
  ANIMALS, animalById, animalName, RANCH_GRID, RANCH_POS, RANCH_IDLE_TICK,
  BUTCHER, CUTS, cutPrice, AQUARIUM_POS, AQUARIUM_SLOTS, EGG_HATCH,
  VISITOR, rarityBreakdown, RARITY_MAX, visitorTicket, visitorRate, visitorIncome,
  BLACK_MARKET, blackMarketMood, blackMoodOf,
  weatherOfDay, OBSERVATORY, WEATHER_INFO,
  WAREHOUSE, warehouseCap,
  BREWERY_POS, BREW, winePrice,
  SHOP_POS, GIFTBOX, giftboxPrice,
  advDishById, advDishPrice, advIngKey,
  ADV_COOK_POS, ADV_COOK_SLOTS, ADV_COOK_TIME, ADV_DISH_MULT,
  TOWER_POS, TOWER_MAX_LEVEL, towerCost, towerPlan,
  HARBOR, HARBOR_POS, harborManifest, harborKey, harborIsPrefix,
  HARBOR_DECORS, harborDecorById, harborDecorName, HARBOR_MAX_PLACED, HARBOR_SPOTS,
  REVIEW_DIMS, REVIEW_TIPS, gradeOf,
  TRAINER, TRAINER_POS, TRAINER_LINES, trainerLineBy, trainerRatio, trainerTimeAt,
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
  createAnimalMesh, createRanchPen, createRanchGround, ranchPos, createButcher, createVisitor,
  createGreenhouse, createGreenhouseInterior, createFlowerMesh, createFlowerBud, GREENHOUSE_SPOTS,
  createAchievementBuilding, createAchievementInterior, createTrophyMesh, ACHIEVEMENT_SPOTS,
  createSorter, createMetalBar, createSignboard, createSprayMark,
  createAquarium, createAquariumInterior, createAquariumTank, createSeafoodMesh, AQUARIUM_SPOTS,
  createBlackMarket, createObservatory, createWarehouse,
  createBrewery, createBreweryInterior, createBrewVat, createCellarRack, createWineBottle,
  createFoodShop, createFoodShopInterior, createShelfSlot, SHELF_SPOTS,
  createGourmetKitchen, createTower, createHarbor, createMerchantShip, createHarborDecor, createTrainer,
  BREW_SPOTS, CELLAR_SPOTS,
} from './meshes.js';
import { sfx } from './music.js';
import { t, tf, tp } from './i18n.js';

export const SAVE_KEY = 'farming-mini-game-save-v1';

// ===== 存档版本 =====
// 以前只有 key 名带 v1，存档体里没有版本号，全靠 load() 里几十个 `??` 兜底。
// 字段少的时候还行，现在一次能加七八个（towerLevel / trainer / harborSold …），
// 再不上版本号就迁不动了。
//
// v1 = 加版本号之前的所有存档（没有 v 字段，靠 `data.v ?? 1` 认出来）
// v2 = 2026-08-17，引入版本号本身；结构没变，只是打戳
export const SAVE_VERSION = 2;

// 迁移函数表：键是「升到哪一版」，值是把上一版的 data 改成这一版的形状。
// 以后改存档结构，就在这里加一格，别再往 load() 里塞新的 `??`。
const SAVE_MIGRATIONS = {
  2: (d) => d,   // 1 → 2：只打版本戳，字段一个没动
};

function migrateSave(data) {
  let v = data.v ?? 1;
  while (v < SAVE_VERSION) {
    v += 1;
    const step = SAVE_MIGRATIONS[v];
    if (step) data = step(data) ?? data;
  }
  data.v = Math.max(v, data.v ?? 1);
  return data;
}

const stageOf = (plant, seed) => {
  const p = plant.progress / seed.growTime;
  return p >= 1 ? 3 : p >= 0.66 ? 2 : p >= 0.33 ? 1 : 0;
};

export class Game {
  constructor(scene) {
    this.scene = scene;
    this.time = 0;
    this.clock = DAY_CYCLE / 4; // 昼夜时钟，0 = 早上6点，默认从中午开始
    this.dayCount = 0;          // 过了多少天，黑市行情按「半天」翻牌要用
    // 天气种子：每个存档一份，天气由「种子 + 第几天」推算，所以未来可预报
    this.weatherSeed = Math.floor(Math.random() * 1e6);
    this.observatory = null;    // 观测台：{ readyAt } 运行中，或 { fromDay } 已出报告
    this.coins = START_COINS;
    this.waterLevel = 0;
    this.unlockedSeeds = ['sweetpot', 'radish'];
    this.inventory = {}; // seedId -> 数量，收获先入背包，手动卖出
    this.savedLayouts = []; // 玩家手动保存的种植布局 [{name, layout}]，供一键播种
    this.layoutSeq = 0;
    this.paused = false;    // 挂机模式：整个世界暂停
    this.poisonUntil = 0;   // 中毒倒计时：到点还没解毒就死
    this.deadUntil = 0;     // 死亡复活倒计时：这期间什么都干不了
    this.cookSlots = Array(COOK_SLOTS).fill(null); // 灶位：{ id, readyAt } 或 null
    // 高级料理的大灶：{ id, price, readyAt } 或 null。price 在下锅时就算死，
    // 因为用的酒窖藏多久不一样，出锅后不能再倒推
    this.advCookSlots = Array(ADV_COOK_SLOTS).fill(null);
    this.towerLevel = 0;    // 繁荣塔等级 0~500，0 级就是个小土堆
    this.harborSold = {};   // 本次靠港已经卖掉的槽位 { 槽位序号: true }
    // 港湾装饰。和水潭装饰的关键区别：这边可以重复买，所以存的是件数而不是 true
    // 工人培养：{ '线路key:工位号': 等级 }，每个工位单独升
    this.trainer = {};
    this.harborOwned = {};  // { 装饰id: 拥有件数 }
    this.harborPlaced = []; // 摆出来的，最多 HARBOR_MAX_PLACED 件，同一种可以出现多次
    this.harborDock = -1;   // 已记录的靠港批次，换船时清空 harborSold
    this.windTimer = 0;     // 风车发电计时器
    this.drought = false;   // 大旱天：三个太阳，生长 ×1/3，收成生长不良
    this.rain = false;      // 暴雨天：持续降雨，生长 ×3，收成也生长不良
    this.items = {};        // 道具背包，和作物背包分开：itemId -> 数量
    this.furniture = { bed: 1 }; // 房子内饰：id -> 已解锁的最高等级(1~3)，床是白送的
    this.furnitureStyle = {};    // 当前展示的外观等级（可在已解锁范围内随意切换）
    this.furniturePos = {};      // 玩家自己摆的位置：id -> { x, z, rotY }
    this._notices = [];          // 读档时要说的话：那会儿 UI 还没建好，先攒着
    this.sleeping = false;   // 睡觉快进中
    this.sleepLeft = 0;      // 还要走多少游戏秒
    this.onWake = () => {};  // 醒来时通知 UI 收起遮罩
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

    // 房屋外观皮肤（换肤用；load() 会用存档覆盖）
    this.houseSkin = { ...DEFAULT_HOUSE_SKIN };
    // 我们自己的房子：农田右前方
    this.houseMesh = createHouse(this.houseSkin);
    this.houseMesh.position.set(10, -0.51, 4.6);
    this.houseMesh.rotation.y = -0.45;
    this.group.add(this.houseMesh);
    this.houseMeshes = [];
    this.houseMesh.traverse(o => { if (o.isMesh) this.houseMeshes.push(o); });

    // 房子内部的 3D 房间：藏在岛屿下方，进屋时镜头切过去
    this.interior = createInteriorRoom(this.houseSkin);
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

    // 高级料理工坊：岛东，夹在料理工坊、银行和牧场之间
    const gourmet = createGourmetKitchen();
    gourmet.position.set(ADV_COOK_POS.x, -0.51, ADV_COOK_POS.z);
    gourmet.rotation.y = -0.6;
    this.group.add(gourmet);
    this.gourmetMeshes = [];
    gourmet.traverse(o => { if (o.isMesh) this.gourmetMeshes.push(o); });
    // 繁荣塔：500 级的金币无底洞，等级变了就整座重建
    this.towerMeshes = [];
    this.rebuildTower();

    // 港湾：岛最南端的大水域 + 一艘只在靠港日出现的商船
    const harbor = createHarbor();
    harbor.position.set(HARBOR_POS.x, -0.5, HARBOR_POS.z);
    this.group.add(harbor);
    this.harborGroup = harbor;   // 装饰挂在这个组下面，跟着港湾一起定位
    this.harborMeshes = [];
    harbor.traverse(o => { if (o.isMesh) this.harborMeshes.push(o); });
    // 船单独一组：靠港日才显示。不要每次建了拆——
    // 增删网格会触发着色器重编译，那是实打实的掉帧
    this.shipGroup = createMerchantShip();
    this.shipGroup.position.set(HARBOR_POS.x - 3.4, -0.15, HARBOR_POS.z + 6.2);
    this.shipGroup.rotation.y = 0.12;
    this.group.add(this.shipGroup);
    this.shipGroup.traverse(o => { if (o.isMesh) this.harborMeshes.push(o); });
    // 工人培养大楼：岛北空地
    const trainer = createTrainer();
    trainer.position.set(TRAINER_POS.x, -0.51, TRAINER_POS.z);
    trainer.rotation.y = 0.35;
    this.group.add(trainer);
    this.trainerMeshes = [];
    trainer.traverse(o => { if (o.isMesh) this.trainerMeshes.push(o); });
    this.trainerBuilding = trainer;

    this.harborDecorMeshes = {};   // 槽位 -> 模型
    this.refreshShip();
    this.refreshHarborDecors();


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

    // 花房温室：菜园右后方的玻璃温室 + 藏在岛下的花房内部
    // （原来在左前方，跟水塘挤在一起，挪到后方空地避开水塘和装饰台）
    const greenhouse = createGreenhouse();
    greenhouse.position.set(9.5, -0.51, -7.5);
    greenhouse.rotation.y = -0.4;
    this.group.add(greenhouse);
    this.greenhouseMeshes = [];
    greenhouse.traverse(o => { if (o.isMesh) this.greenhouseMeshes.push(o); });
    this.greenhouseHall = createGreenhouseInterior();
    this.greenhouseHall.position.set(GREENHOUSE_POS.x, GREENHOUSE_POS.y, GREENHOUSE_POS.z);
    this.group.add(this.greenhouseHall);
    this.flowerPlots = Array(GREENHOUSE_SLOTS).fill(null); // 每格：null 或 { id, readyAt }
    this.flowerMeshes = {}; // slot -> mesh

    // 成就殿堂：菜园右后方的金顶建筑 + 藏在岛下的 30 座奖杯展厅
    this.achievements = {};     // 已达成：id -> 达成时的时间戳
    this.onAchievement = () => {}; // 达成瞬间的回调，由 UI 接管弹横幅
    const achBuilding = createAchievementBuilding();
    achBuilding.position.set(16, -0.51, -12);
    achBuilding.rotation.y = -0.9;
    this.group.add(achBuilding);
    this.achievementMeshes = [];
    achBuilding.traverse(o => { if (o.isMesh) this.achievementMeshes.push(o); });
    this.achievementHall = createAchievementInterior();
    this.achievementHall.position.set(ACHIEVEMENT_POS.x, ACHIEVEMENT_POS.y, ACHIEVEMENT_POS.z);
    this.group.add(this.achievementHall);
    this.trophyMeshes = {}; // 成就 id -> 展厅里的奖杯

    // 分拣台：稀有品质作物拆成「普通作物 + 金属条」，摆在工坊旁边
    this.sorter = Array(SORTER_SLOTS).fill(null); // { key, readyAt } 或 null
    // 摆右前方空地：盒壁在 ±3.225、二层平台从 z=-3.5 往后、装饰台在 r=6 的弧上，
    // 这里 r≈9.9 全避开了，从默认视角也不会挡住农田
    const sorter = createSorter();
    sorter.position.set(7, -0.51, 7);
    sorter.rotation.y = -2.36; // 正面朝向菜园
    this.group.add(sorter);
    this.sorterMeshes = [];
    sorter.traverse(o => { if (o.isMesh) this.sorterMeshes.push(o); });

    // 牧场：岛东侧的 6×6 围栏。新手玩农场，老手玩牧场——
    // 买幼崽 → 长大 → 收进背包卖掉，或者留着吃每分钟的挂机收益。
    const ranch = createRanchGround();
    ranch.position.set(RANCH_POS.x, -0.51, RANCH_POS.z);
    this.group.add(ranch);
    this.ranchMeshes = [];
    ranch.traverse(o => { if (o.isMesh) this.ranchMeshes.push(o); });
    this.ranchPens = Array(RANCH_GRID * RANCH_GRID).fill(null); // 每栏：null 或 { id, readyAt }
    this.ranchAnimalMeshes = {};   // 栏位序号 -> 动物模型
    this.ranchTimer = 0;           // 挂机收益的计时器

    // 参观客：小人挂在自己的 Group 下，方便整批显隐/清理
    this.visitorGroup = new THREE.Group();
    this.group.add(this.visitorGroup);
    this.visitors = [];            // 正在岛上走动的小人
    this.visitorTimer = 0;         // 结算计时器
    this.visitorTotal = 0;         // 累计门票收入，面板上显示
    for (let j = 0; j < RANCH_GRID; j++) {
      for (let i = 0; i < RANCH_GRID; i++) {
        const pen = createRanchPen();
        const { x, y, z } = ranchPos(i, j);
        pen.position.set(RANCH_POS.x + x, y - 0.44, RANCH_POS.z + z);
        pen.userData.penIndex = j * RANCH_GRID + i;
        this.group.add(pen);
        this.ranchMeshes.push(pen);
      }
    }

    // 屠宰场：牧场北边。整只动物送进来，3 分钟后拆成 4 个部位，分开卖多五成
    const butcher = createButcher();
    butcher.position.set(24, -0.51, -12);
    butcher.rotation.y = 0.6;
    this.group.add(butcher);
    this.butcherMeshes = [];
    butcher.traverse(o => { if (o.isMesh) this.butcherMeshes.push(o); });
    this.butcher = Array(BUTCHER.slots).fill(null); // { key, readyAt } 或 null
    this.butcherBuilding = butcher; // 名牌统一在下面挂（那时 signMeshes 才建好）

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

    // 水族馆：填上图鉴大楼、商场、水塘围出来的那块左侧空地
    this.aquarium = Array(AQUARIUM_SLOTS).fill(null); // 每格：水产 id 或 null
    const aquariumBuilding = createAquarium();
    aquariumBuilding.position.set(-15, -0.51, 0.5);
    aquariumBuilding.rotation.y = 0.5;
    this.group.add(aquariumBuilding);
    this.aquariumMeshes = [];
    aquariumBuilding.traverse(o => { if (o.isMesh) this.aquariumMeshes.push(o); });
    this.aquariumHall = createAquariumInterior();
    this.aquariumHall.position.set(AQUARIUM_POS.x, AQUARIUM_POS.y, AQUARIUM_POS.z);
    this.group.add(this.aquariumHall);
    this.tankMeshes = [];

    // 黑市：农田正后方那块空地，前后左右这下都占满了
    // z=-17 是算过的：再靠前会被二层农田的台面挡住视线
    const blackMarket = createBlackMarket();
    blackMarket.position.set(0, -0.51, -17);
    blackMarket.rotation.y = 0.12;
    this.group.add(blackMarket);
    this.blackMarketMeshes = [];
    blackMarket.traverse(o => { if (o.isMesh) this.blackMarketMeshes.push(o); });

    // 酒庄：农田正前方的石屋 + 藏在岛下的酒窖
    this.brewery = Array(BREW.slots).fill(null);      // 酿造台：{ key, readyAt } 或 null
    this.cellar = Array(BREW.cellarSlots).fill(null); // 酒窖：{ key, sinceDay } 或 null
    const brewery = createBrewery();
    brewery.position.set(1, -0.51, 11);
    brewery.rotation.y = 0.1;
    this.group.add(brewery);
    this.breweryMeshes = [];
    brewery.traverse(o => { if (o.isMesh) this.breweryMeshes.push(o); });
    this.breweryHall = createBreweryInterior();
    this.breweryHall.position.set(BREWERY_POS.x, BREWERY_POS.y, BREWERY_POS.z);
    this.group.add(this.breweryHall);
    this.vatMeshes = [];
    this.rackMeshes = [];

    // 食品店：农田右前方的临街店面 + 藏在岛下的后堂货架
    // 货架格：{ keys:[4个作物key], price, soldAt } 或 null；soldAt 是「到点自动成交」的时刻
    this.shelf = Array(GIFTBOX.slots).fill(null);
    const foodShop = createFoodShop();
    foodShop.position.set(12.5, -0.51, 8.2);
    foodShop.rotation.y = -0.45;
    this.group.add(foodShop);
    this.foodShopMeshes = [];
    foodShop.traverse(o => { if (o.isMesh) this.foodShopMeshes.push(o); });
    this.foodShopHall = createFoodShopInterior();
    this.foodShopHall.position.set(SHOP_POS.x, SHOP_POS.y, SHOP_POS.z);
    this.group.add(this.foodShopHall);
    this.shelfMeshes = [];

    // 仓库：农田左后方，避开二层农田台面的遮挡视线
    this.warehouse = {};        // key -> 件数
    this.warehouseLevel = 1;
    const warehouse = createWarehouse();
    warehouse.position.set(-7.5, -0.51, -14);
    warehouse.rotation.y = 0.35;
    this.group.add(warehouse);
    this.warehouseMeshes = [];
    warehouse.traverse(o => { if (o.isMesh) this.warehouseMeshes.push(o); });

    // 天气观测台：紧挨着黑市（黑市在 0,-17），摆在它右手边
    const observatory = createObservatory();
    observatory.position.set(6.5, -0.51, -16.5);
    observatory.rotation.y = -0.3;
    this.group.add(observatory);
    this.observatoryMeshes = [];
    observatory.traverse(o => { if (o.isMesh) this.observatoryMeshes.push(o); });

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

    // 每栋建筑顶上挂一块悬浮名牌：一眼认出是什么，点名牌等于点建筑
    this.signMeshes = [];
    // 名字走 i18n，换语言重载后名牌跟着变
    this.addSign(ws, '🏭', 'workshop');
    this.addSign(mall, '🛒', 'mall');
    this.addSign(this.houseMesh, '🏠', 'house');
    this.addSign(this.pond, '🎣', 'pond');
    this.addSign(bank, '🏦', 'bank');
    this.addSign(kitchen, '🍳', 'kitchen');
    this.addSign(gourmet, '👨‍🍳', 'gourmet');
    this.addSign(harbor, '⛵', 'harbor');
    this.addSign(trainer, '👷', 'trainer');
    // 塔的招牌得跟别的建筑一样浮在头顶。但 addSign() 只在开局按包围盒
    // 算一次位置，而塔会从 0.5 米长到 27 米——所以位置交给 positionTowerSign()，
    // 每次重建都重算一遍，牌子才会跟着塔往上走
    if (this.towerGroup) {
      this.towerSign = this.addSign(this.towerGroup, '🗼', 'tower');
      this.positionTowerSign();
    }
    this.addSign(lab, '🧬', 'hybridLab');
    this.addSign(petHouse, '🐾', 'petHouse');
    this.addSign(greenhouse, '🌸', 'greenhouse');
    this.addSign(achBuilding, '🏅', 'achievement');
    this.addSign(codexBuilding, '📖', 'codex');
    this.addSign(aquariumBuilding, '🐠', 'aquarium');
    this.addSign(sorter, '⚙️', 'sorter');
    this.addSign(blackMarket, '🕶️', 'blackMarket'); // 之前漏了这块
    this.addSign(observatory, '🔭', 'observatory');
    this.addSign(warehouse, '📦', 'warehouse');
    this.addSign(brewery, '🍷', 'brewery');
    this.addSign(foodShop, '🎁', 'foodshop');
    this.addSign(this.butcherBuilding, '🔪', 'butcher');

    this._booting = true; // 读档期间不弹虫害提示
    this.load();
    this.refreshAllVisuals();
    this._booting = false;
  }

  // 名牌自动浮在建筑包围盒顶上；userData 沿用建筑自己的标记，
  // 这样 main.js 那套点击分发不用改就能直接认。
  // 注意挂在 group 而不是建筑上：换肤会整个重建 houseMesh，
  // 挂建筑上的话名牌会跟着旧对象一起被丢掉。
  addSign(building, emoji, key) {
    const box = new THREE.Box3().setFromObject(building);
    const sign = createSignboard(emoji, t(`sign.${key}`));
    sign.position.set(building.position.x, box.max.y + 0.62, building.position.z);
    sign.userData[key] = true;
    sign.userData.signBaseY = sign.position.y; // 让它轻轻上下浮
    this.group.add(sign);
    this.signMeshes.push(sign);
    return sign;
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

  // 第 n 天是什么天气：只跟存档种子和天数有关，随时可以提前算出来
  weatherAt(day) { return weatherOfDay(this.weatherSeed, day); }

  rollWeather() {
    const healed = this.healAllTiles();
    if (healed && !this._booting) this.onToast(`🌿 天气转好，${healed} 块受灾的地恢复了`);
    const w = this.weatherAt(this.dayCount);
    this.setWeather(w === 'drought', w === 'rain');
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

  /* ---------- 中毒与死亡 ---------- */

  isPoisoned() { return this.poisonUntil > this.time; }
  isDead() { return this.deadUntil > this.time; }
  poisonLeft() { return Math.max(0, Math.ceil(this.poisonUntil - this.time)); }
  reviveLeft() { return Math.max(0, Math.ceil(this.deadUntil - this.time)); }
  // 中毒或死亡期间不能干活
  incapacitated() { return this.isPoisoned() || this.isDead(); }

  useAntidote() {
    if (!this.isPoisoned()) { this.onToast('你没中毒，解毒剂先收着吧'); return false; }
    this.poisonUntil = 0;
    this.onToast('💉 解毒成功！捡回一条命');
    this.onState();
    this.save();
    return true;
  }

  die() {
    this.poisonUntil = 0;
    this.deadUntil = this.time + POISON.reviveTime;
    this.onToast('💀 毒发身亡…等着复活吧');
    sfx.play('die');
    this.onState();
    this.save();
  }

  // 赤手拍虫：免费，但有 5% 概率中毒
  swatPest(idx) {
    const t = this.tiles[idx];
    if (!t?.plant?.pest) return false;
    t.plant.pest = false;
    const bug = t.plant.mesh?.children.find(c => c.userData.pestBug);
    if (bug) t.plant.mesh.remove(bug);
    const seed = seedById(t.plant.seedId);
    if (Math.random() < POISON.chance) {
      this.poisonUntil = this.time + POISON.timeout;
      this.onToast(`☠️ 拍虫时被咬了！${POISON.timeout} 秒内用 💉 解毒剂，否则死亡`);
      sfx.play('poison');
      this.onState();
    } else {
      this.onToast(`👏 啪！拍掉了${seed.emoji}${seed.name}上的虫子`);
      sfx.play('swat');
    }
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
      sfx.play('deny');
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
    // 局部变量不能叫 t——会把导入的 i18n 翻译函数 t() 遮蔽掉，
    // 下面这几句 this.onToast(t('...')) 一调用就是「t is not a function」
    const tile = this.tiles[idx];
    const seed = seedById(seedId);
    if (!seed || !this.unlockedSeeds.includes(seedId)) return;
    if (tile.locked) { this.onToast(tp('plant.locked', { cost: UNLOCK_COST })); return; }
    if (tile.damaged) { this.onToast(t(tile.damaged === 'cracked' ? 'plant.cracked' : 'plant.waterlogged')); return; }
    if (tile.plant) { this.onToast(t('plant.occupied')); return; }
    if (!this.spend(seed.cost)) return;
    tile.plant = { seedId, progress: 0, stage: -1, quality: this.rollQuality(tile.lucky) };
    if (tile.lucky) { tile.lucky = false; this.onToast(t('plant.lucky')); }
    this.updatePlantMesh(tile);
    sfx.play('plant');
    this.save();
  }

  // 打药：赌一把卖价。收获时把标记转成 y: 前缀带进背包
  sprayAt(idx) {
    const t = this.tiles[idx];
    if (t.locked) { this.onToast('这块地还没解锁'); return; }
    if (!t.plant) { this.onToast('这块地上没有作物，打药没用'); sfx.play('deny'); return; }
    if (t.plant.sprayed) { this.onToast('这株已经打过药了'); sfx.play('deny'); return; }
    if (!this.spend(PESTICIDE.cost)) return;
    t.plant.sprayed = true;
    // updatePlantMesh 只在生长阶段变化时才重建，这里得自己把标记挂上去
    if (t.plant.mesh) t.plant.mesh.add(createSprayMark());
    const seed = seedById(t.plant.seedId);
    this.onToast(`🧪 给${seed.emoji}${seed.name}打了药，卖价 +${PESTICIDE.bonus}💰（${Math.round(PESTICIDE.ruinChance * 100)}% 概率报废）`);
    sfx.play('water');
    this.onState();
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

  // 图鉴还没收录的：不替玩家做主，只在背包里标出来供参考
  worthKeeping(key) {
    return this.codexKeys().includes(key) && !this.codex[key];
  }

  // 卖出指定的这些 key（玩家在背包里勾选好的），不传就是全卖
  sellKeys(keys) {
    const list = (keys ?? Object.keys(this.inventory))
      .filter(k => (this.inventory[k] ?? 0) > 0);
    if (!list.length) { this.onToast('没有选中要卖的东西'); return; }
    let total = 0, count = 0, ruined = 0;
    list.forEach(key => {
      const n = this.inventory[key];
      const info = keyInfo(key);
      const bad = info.sprayed ? this.rollSprayed(n) : 0;
      ruined += bad;
      total += info.price * (n - bad);
      count += n;
      delete this.inventory[key];
    });
    this.gain(total);
    this.onToast(`💰 卖掉 ${count} 件，收入 ${total}💰${ruined ? `（${ruined} 个打过药的报废了）` : ''}`);
    sfx.play('coin');
    this.onState();
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
    if (!count) { this.onToast(t('harvest.noneRipe')); return; }
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
    this.onToast(t(this.waterLevel === 2 ? 'water.eggHunt'
      : this.waterLevel === 1 ? 'water.ok3x3' : 'water.ok'));
    sfx.play('water');
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
    // 局部变量不能叫 t——会把导入的 i18n 翻译函数 t() 遮蔽掉，
    // 下面 onToast 里那句 t('harvest.bagged') 一调用就是「t is not a function」
    const tile = this.tiles[idx];
    if (!tile.plant) return false;
    const seed = seedById(tile.plant.seedId);
    if (tile.plant.stage < 3) { this.onToast(tp('harvest.notRipe', { name: seedName(seed) })); return false; }
    const count = SOILS[tile.soil].yield;
    const quality = tile.plant.quality;
    // 生长不良优先于打药：都蔫了，药钱就当白花了，不叠加两个前缀
    const bad = this.badWeather() || tile.plant.pest;
    const prefix = bad ? 'x:' : tile.plant.sprayed ? 'y:' : '';
    const key = prefix + (quality ? `${seed.id}:${quality}` : seed.id);
    const wasPest = tile.plant.pest;
    const wasSprayed = !bad && tile.plant.sprayed; // 蔫了的话药就白打了，提示别再说打过药
    this.removePlant(tile);
    this.inventory[key] = (this.inventory[key] ?? 0) + count;
    this.onState();
    const q = QUALITIES[quality];
    // keyInfo 已经把「生长不良/打过药/品质/作物名」按当前语言拼好了，直接用，省得每种情况各写一句
    const got = keyInfo(key);
    this.onToast(`${got.icon}${got.label} ×${count} ${t('harvest.bagged')}`);
    // 连着收会一级级升调，一片收完像走完一段音阶
    this._combo = (this.time - (this._comboAt ?? -9) < 2) ? Math.min((this._combo ?? 0) + 1, 6) : 0;
    this._comboAt = this.time;
    sfx.play('harvest', { semitones: this._combo * 2, throttle: 0.03 });
    this.save();
    return true;
  }

  // 打过药的逐个掷骰子，运气不好的那些一分钱卖不出去
  rollSprayed(n) {
    let ruined = 0;
    for (let i = 0; i < n; i++) if (Math.random() < PESTICIDE.ruinChance) ruined++;
    return ruined;
  }

  sellCrop(key, count) {
    const have = this.inventory[key] ?? 0;
    const n = Math.min(count, have);
    if (n <= 0) return;
    const info = keyInfo(key);
    this.inventory[key] = have - n;
    if (this.inventory[key] === 0) delete this.inventory[key];
    const ruined = info.sprayed ? this.rollSprayed(n) : 0;
    const total = info.price * (n - ruined);
    this.gain(total);
    this.onToast(ruined
      ? `卖出${info.icon}${info.label} ×${n}，其中 ${ruined} 个药坏了没人要 +${total} 💰`
      : `卖出${info.icon}${info.label} ×${n} +${total} 💰`);
    sfx.play(ruined === n ? 'deny' : 'coin');
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

  // 升变道具能吃哪些作物：白银只收普通，黄金普通和白银都收
  upgradeCandidates(quality) {
    return Object.keys(this.inventory).filter(k => {
      if ((this.inventory[k] ?? 0) <= 0) return false;
      if (['p:', 'k:', 'h:', 'f:', 'x:', 'y:', 'm:'].some(p => k.startsWith(p))) return false;
      if (k === EGG.key) return false;
      const [, q] = k.split(':');
      return quality === 'silver' ? !q : (!q || q === 'silver');
    });
  }

  // 把一个作物升成指定品质，扣掉对应道具
  upgradeQuality(itemId, key) {
    const item = itemById(itemId);
    if (!item?.pick) return false;
    if ((this.items[itemId] ?? 0) <= 0) return false;
    if (!this.upgradeCandidates(item.pick).includes(key)) {
      this.onToast('这个东西没法升变');
      sfx.play('deny');
      return false;
    }
    const [seedId] = key.split(':');
    const target = `${seedId}:${item.pick}`;
    this.inventory[key] -= 1;
    if (this.inventory[key] <= 0) delete this.inventory[key];
    this.inventory[target] = (this.inventory[target] ?? 0) + 1;
    this.items[itemId] -= 1;
    if (this.items[itemId] === 0) delete this.items[itemId];
    const from = keyInfo(key), to = keyInfo(target);
    this.onToast(`${item.emoji} ${from.icon}${from.label} → ${to.icon}${to.label}（${from.price} → ${to.price}💰）`);
    sfx.play('upgrade');
    this.onState();
    this.save();
    return true;
  }

  useItem(id) {
    if ((this.items[id] ?? 0) <= 0) return;
    if (id === 'net') { this.onToast('🕸️ 抓鱼网要拿到水滩去摆（点击左前方的水塘）'); return; }
    if (id === 'rod' || id === 'castnet') { this.onToast('🎣 渔具带在身上就行，点击水塘开始钓鱼'); return; }
    // 升变要先挑目标作物，由 UI 接管，这里不直接消耗
    if (itemById(id)?.pick) return;
    const ok = id === 'fertilizer' ? this.useFertilizer()
      : id === 'restorer' ? this.useRestorer()
      : id === 'pesticide' ? this.usePesticide()
      : id === 'antidote' ? this.useAntidote()
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
    // 42 个展位：最初 14 种基础作物 × 3 品质（bonus 作物不占展位，展馆布局也就不用动）
    const keys = [];
    CODEX_SEEDS.forEach(s => CODEX_QUALITIES.forEach(q => keys.push(q ? `${s.id}:${q}` : s.id)));
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
    // 花不在 42 格体系里（那是 14 作物 × 3 品质），收了也没有对应的展位
    if (key.startsWith('f:')) {
      this.onToast('🌸 图鉴收录的是 14 种作物，花可以摆到个人图鉴去');
      return false;
    }
    if (key.startsWith('p:') || key.startsWith('x:') || key.startsWith('k:') || key.startsWith('h:') || key === EGG.key) {
      this.onToast('图鉴只收录新鲜的作物本体');
      return false;
    }
    // 特殊种子的收获物不占 42 格展位，只能摆到个人展台
    if (seedById(key.split(':')[0])?.special) {
      this.onToast('✨ 特殊种子的收获物只能摆到个人展台');
      return false;
    }
    // 兜底：万一还有别的没想到的 key，宁可拒收也不能吃掉玩家的东西
    if (this.codexKeys().indexOf(key) < 0) {
      this.onToast('这个东西没有对应的收录台');
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
    sfx.play('codex');
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
    const slot = this.cookSlots.findIndex(s => !s);
    if (slot < 0) { this.onToast(`${COOK_SLOTS} 个灶都在用，先端走做好的菜`); return false; }
    if (!this.canCook(dishId)) { this.onToast('原料不够，先凑齐配方吧'); return false; }
    dish.recipe.forEach(([id, q, n]) => {
      const key = ingredientKey(id, q);
      this.inventory[key] -= n;
      if (this.inventory[key] <= 0) delete this.inventory[key];
    });
    this.cookSlots[slot] = { id: dishId, readyAt: this.time + COOK_TIME * this.trainerRatio('cook', slot) };
    this.onToast(`🍳 ${dish.emoji}${dish.name}下锅了，${COOK_TIME / 60} 分钟后出锅`);
    this.onState();
    this.save();
    return true;
  }

  collectDish(slot) {
    const s = this.cookSlots[slot];
    if (!s || this.time < s.readyAt) return;
    const dish = dishById(s.id);
    const dkey = 'k:' + s.id;
    this.inventory[dkey] = (this.inventory[dkey] ?? 0) + 1;
    this.cookSlots[slot] = null;
    const cb = this.payTrainerBonus('cook', slot);
    this.onToast(`🍽️ ${dish.emoji}${dish.name}出锅！放入背包` + (cb ? ` （熟练工 +${cb}💰）` : ''));
    sfx.play('done');
    this.onState();
    this.save();
  }

  /* ---------- 高级料理工坊 ---------- */

  // 背包里所有「原果正好是 srcKey」的酒，便宜的排前面。
  // 注意不能用 `w:grape:` 这样的前缀去匹配——黄金葡萄酒的 key 是
  // `w:grape:gold:5`，前缀一样会被误吃掉。得剥掉尾巴的窖藏天数再整体比对。
  advWineKeys(srcKey) {
    return Object.keys(this.inventory).filter(k => {
      if (!k.startsWith('w:') || this.inventory[k] <= 0) return false;
      const parts = k.slice(2).split(':');
      parts.pop();                       // 去掉窖藏天数
      return parts.join(':') === srcKey; // 原果必须完全一致
    }).sort((a, b) => keyInfo(a).price - keyInfo(b).price);
  }

  // 配方某一项现在有几件。酒要把所有年份的加起来
  advIngHave(src, id) {
    if (src === 'wine') {
      return this.advWineKeys(id).reduce((n, k) => n + this.inventory[k], 0);
    }
    return this.inventory[advIngKey(src, id)] ?? 0;
  }

  canAdvCook(dishId) {
    const dish = advDishById(dishId);
    return !!dish && dish.recipe.every(([src, id, n]) => this.advIngHave(src, id) >= n);
  }

  advCook(dishId) {
    const dish = advDishById(dishId);
    if (!dish) return false;
    const slot = this.advCookSlots.findIndex(s => !s);
    if (slot < 0) { this.onToast(tp('t.advBusy', { n: ADV_COOK_SLOTS })); sfx.play('deny'); return false; }
    if (!this.canAdvCook(dishId)) { this.onToast(t('t.advLack')); sfx.play('deny'); return false; }

    // 边扣原料边累计真实成本：酒每瓶价钱不同，只能一瓶一瓶算
    let sum = 0;
    dish.recipe.forEach(([src, id, n]) => {
      if (src === 'wine') {
        let left = n;
        // 优先用最便宜（最新）的酒，把陈年好酒留给玩家自己卖
        for (const key of this.advWineKeys(id)) {
          if (left <= 0) break;
          const take = Math.min(left, this.inventory[key]);
          sum += keyInfo(key).price * take;
          left -= take;
          this.inventory[key] -= take;
          if (this.inventory[key] <= 0) delete this.inventory[key];
        }
        return;
      }
      const key = advIngKey(src, id);
      sum += keyInfo(key).price * n;
      this.inventory[key] -= n;
      if (this.inventory[key] <= 0) delete this.inventory[key];
    });

    const price = Math.max(1, Math.floor(sum * ADV_DISH_MULT));
    this.advCookSlots[slot] = { id: dishId, price, readyAt: this.time + ADV_COOK_TIME * this.trainerRatio('adv', slot) };
    this.onToast(tp('t.advCooking', { name: `${dish.emoji}${dish.name}`, n: Math.round(ADV_COOK_TIME / 60) }));
    sfx.play('done');
    this.onState();
    this.save();
    return true;
  }

  collectAdvDish(slot) {
    const s = this.advCookSlots[slot];
    if (!s || this.time < s.readyAt) return;
    const dish = advDishById(s.id);
    const key = `g:${s.id}:${s.price}`;
    this.inventory[key] = (this.inventory[key] ?? 0) + 1;
    this.advCookSlots[slot] = null;
    const ab = this.payTrainerBonus('adv', slot);
    if (ab) this.onToast(tp('t.trainerBonus', { n: ab }));
    this.onToast(tp('t.advDone', { name: `${dish.emoji}${dish.name}`, n: s.price.toLocaleString() }));
    sfx.play('done');
    this.onState();
    this.save();
  }


  /* ---------- 繁荣塔 ---------- */

  // 整座重建。塔的形状是等级的纯函数，与其增量改不如推倒重来——
  // 但必须手动 dispose 旧的几何体和材质：一座塔上百个网格，
  // 500 级升下来不释放就是几百次泄漏，显存会一路涨到崩
  rebuildTower() {
    if (this.towerGroup) {
      // 材质在全塔共享（6 档装修只有十几份材质铺在 300 个网格上），
      // 逐网格 dispose 会把同一份材质重复释放几百次。先去重再释放
      const geos = new Set(), mats = new Set();
      this.towerGroup.traverse(o => {
        if (!o.isMesh) return;
        if (o.geometry) geos.add(o.geometry);
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m && mats.add(m));
      });
      geos.forEach(x => x.dispose());
      mats.forEach(x => x.dispose());
      this.group.remove(this.towerGroup);
    }
    const g = createTower(towerPlan(this.towerLevel));
    g.position.set(TOWER_POS.x, -0.51, TOWER_POS.z);
    this.group.add(g);
    this.towerGroup = g;
    this.towerMeshes = [];
    g.traverse(o => { if (o.isMesh) this.towerMeshes.push(o); });
    this.positionTowerSign();
  }

  // 招牌浮在塔顶正上方，跟着塔一起长高。
  // 建筑本体在 y=-0.51，所以世界高度要把这个偏移算进去，跟 addSign() 的口径一致
  positionTowerSign() {
    const s = this.towerSign;
    if (!s) return;
    const y = -0.51 + towerPlan(this.towerLevel).height + 0.62;
    s.position.set(TOWER_POS.x, y, TOWER_POS.z);
    s.userData.signBaseY = y;
  }

  towerNextCost() {
    return this.towerLevel >= TOWER_MAX_LEVEL ? null : towerCost(this.towerLevel + 1);
  }

  // 升一级。n>1 时连升，钱不够就升到升不动为止
  upgradeTower(n = 1) {
    let done = 0;
    for (let k = 0; k < n; k++) {
      const cost = this.towerNextCost();
      if (cost === null) { if (!done) this.onToast(t('t.towerMax')); break; }
      if (this.coins < cost) { if (!done) { this.onToast(t('t.towerPoor')); sfx.play('deny'); } break; }
      this.coins -= cost;
      this.towerLevel += 1;
      done++;
    }
    if (!done) return 0;
    this.rebuildTower();
    const plan = towerPlan(this.towerLevel);
    this.onToast(tp('t.towerUp', {
      n: this.towerLevel, f: plan.floors.length, h: plan.height.toFixed(1),
    }));
    sfx.play('done');
    this.onState();
    this.save();
    return done;
  }

  // 现在的钱最多还能连升几级（面板上「一键升到底」用）
  towerAffordable() {
    let coins = this.coins, lv = this.towerLevel, n = 0;
    while (lv < TOWER_MAX_LEVEL) {
      const c = towerCost(lv + 1);
      if (coins < c) break;
      coins -= c; lv++; n++;
    }
    return n;
  }
  /* ---------- 港湾商船 ---------- */

  // 第几艘船。dayCount 每过 HARBOR.period 天换一艘
  harborDockIndex() { return Math.floor(this.dayCount / HARBOR.period); }

  // 今天船在不在。只停靠港那一天，第二天就走
  shipDocked() { return this.dayCount % HARBOR.period === 0; }

  // 还有几天来下一艘（船在港时返回 0）
  daysToShip() {
    const r = this.dayCount % HARBOR.period;
    return r === 0 ? 0 : HARBOR.period - r;
  }

  // 今天这张货单。同一艘船怎么读档都是同一张——倍率是按批次号算出来的，不是掷骰子
  harborManifestToday() { return harborManifest(this.harborDockIndex()); }

  // 换船了就把「已卖」记录清空，并同步船的可见性。
  // 每天推进时和读档后都要调一次
  refreshShip() {
    const dock = this.harborDockIndex();
    if (this.harborDock !== dock) {
      this.harborDock = dock;
      this.harborSold = {};
    }
    if (this.shipGroup) this.shipGroup.visible = this.shipDocked();
  }

  // 货单某一项，背包里有几件、总共值多少钱。
  // 酒和高级料理的 key 尾巴上挂着窖藏天数 / 成交价，只能按前缀扫
  harborHave(src, id) {
    const key = harborKey(src, id);
    if (!harborIsPrefix(src)) {
      const n = this.inventory[key] ?? 0;
      return { n, keys: n > 0 ? [key] : [], value: n > 0 ? keyInfo(key).price * n : 0 };
    }
    // 前缀匹配不能直接 startsWith：酒的 key 是 w:<原果>:<天数>，
    // 黄金葡萄酒是 w:grape:gold:9，跟普通葡萄酒 w:grape: 前缀一模一样，
    // 直接扫会把贵的那瓶一起算进来。得剥掉尾巴那一段再整体比对
    const pre = src === 'wine' ? 'w:' : 'g:';
    let n = 0, value = 0;
    const keys = [];
    for (const k of Object.keys(this.inventory)) {
      if (!k.startsWith(pre) || this.inventory[k] <= 0) continue;
      const parts = k.slice(2).split(':');
      parts.pop();                        // 酒的窖藏天数 / 高级料理的成交价
      if (parts.join(':') !== id) continue;  // 主体必须完全一致
      keys.push(k);
      n += this.inventory[k];
      value += keyInfo(k).price * this.inventory[k];
    }
    return { n, keys, value };
  }

  // 卖给商船：一次清掉一个槽位，船开走前不能反悔
  sellToShip(slot) {
    if (!this.shipDocked()) { this.onToast(t('t.shipGone')); sfx.play('deny'); return false; }
    if (this.harborSold[slot]) { this.onToast(t('t.shipSoldAlready')); sfx.play('deny'); return false; }
    const item = this.harborManifestToday()[slot];
    if (!item) return false;
    const have = this.harborHave(item.src, item.id);
    if (have.n <= 0) { this.onToast(t('t.shipNoStock')); sfx.play('deny'); return false; }

    const total = Math.max(0, Math.floor(have.value * item.mult));
    have.keys.forEach(k => { delete this.inventory[k]; });
    this.harborSold[slot] = true;
    this.gain(total);
    const info = keyInfo(harborIsPrefix(item.src) ? have.keys[0] : harborKey(item.src, item.id));
    const pct = Math.round((item.mult - 1) * 100);
    this.onToast(tp('t.shipDeal', {
      name: `${info.icon}${info.label}`, n: have.n,
      p: (pct >= 0 ? '+' : '') + pct, g: total.toLocaleString(),
    }));
    sfx.play(item.mult >= 1 ? 'coin' : 'deny');
    this.onState();
    this.save();
    return true;
  }

  /* ---------- 港湾装饰 ---------- */

  // 按 harborPlaced 重建水面上的装饰。整体重建而不是增量改——
  // 一共才 15 件、80 来个网格，重建比维护差异简单得多，也不容易出错
  refreshHarborDecors() {
    if (!this.harborGroup) return;
    Object.values(this.harborDecorMeshes ?? {}).forEach(m => {
      m.traverse(o => {
        if (!o.isMesh) return;
        o.geometry?.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(x => x?.dispose());
      });
      this.harborGroup.remove(m);
    });
    this.harborDecorMeshes = {};
    this.harborPlaced.forEach((id, slot) => {
      const d = harborDecorById(id);
      const spot = HARBOR_SPOTS[slot];
      if (!d || !spot) return;
      const m = createHarborDecor(d, slot);
      m.position.set(spot.x, 0.2, spot.z);
      this.harborGroup.add(m);
      this.harborDecorMeshes[slot] = m;
    });
  }

  // 手上还有几件没摆出去
  harborSpare(id) {
    const owned = this.harborOwned[id] ?? 0;
    const used = this.harborPlaced.filter(x => x === id).length;
    return owned - used;
  }

  // 买。可以重复买，买几件就攒几件
  buyHarborDecor(id) {
    const d = harborDecorById(id);
    if (!d) return false;
    if (!this.spend(d.cost)) return false;
    this.harborOwned[id] = (this.harborOwned[id] ?? 0) + 1;
    this.onToast(tp('t.hdecorBuy', { name: harborDecorName(d), n: this.harborOwned[id] }));
    sfx.play('coin');
    this.onState();
    this.save();
    return true;
  }

  // 摆一件出去
  placeHarborDecor(id) {
    const d = harborDecorById(id);
    if (!d) return false;
    if (this.harborPlaced.length >= HARBOR_MAX_PLACED) {
      this.onToast(tp('t.hdecorFull', { n: HARBOR_MAX_PLACED })); sfx.play('deny'); return false;
    }
    if (this.harborSpare(id) <= 0) { this.onToast(t('t.hdecorNoSpare')); sfx.play('deny'); return false; }
    this.harborPlaced.push(id);
    this.refreshHarborDecors();
    this.onToast(tp('t.hdecorPlace', { name: harborDecorName(d), n: this.harborPlaced.length, m: HARBOR_MAX_PLACED }));
    sfx.play('done');
    this.onState();
    this.save();
    return true;
  }

  // 收回某个槽位的装饰，东西回到手上（不退钱）
  removeHarborDecor(slot) {
    const id = this.harborPlaced[slot];
    if (id === undefined) return false;
    this.harborPlaced.splice(slot, 1);
    this.refreshHarborDecors();
    this.onToast(tp('t.hdecorRemove', { name: harborDecorName(harborDecorById(id)) }));
    this.onState();
    this.save();
    return true;
  }

  /* ---------- 工人培养大楼 ---------- */

  trainerKey(line, slot) { return line + ':' + slot; }
  trainerLevel(line, slot) { return this.trainer?.[this.trainerKey(line, slot)] ?? 0; }

  // 这个工位现在的加工时间是基础的百分之几
  trainerRatio(line, slot) { return trainerRatio(line, this.trainerLevel(line, slot)); }

  // 出货奖金：每级每件 +2💰。做成「出货时直接发钱」而不是改物品售价，
  // 是因为罐头/料理的背包 key 里没地方存这个加成，改 key 格式会动到老存档
  trainerBonus(line, slot, count = 1) {
    return this.trainerLevel(line, slot) * TRAINER.pricePerLevel * count;
  }

  // 出货时结算奖金并提示。没升过级就什么都不做
  payTrainerBonus(line, slot, count = 1) {
    const bonus = this.trainerBonus(line, slot, count);
    if (bonus <= 0) return 0;
    this.gain(bonus);
    return bonus;
  }

  trainerNextCost(line, slot) {
    return this.trainerLevel(line, slot) >= TRAINER.maxLevel ? null : TRAINER.cost;
  }

  // 升级。n > 1 时连升，钱不够或到顶就停
  upgradeTrainer(line, slot, n = 1) {
    const L = trainerLineBy(line);
    if (!L || slot < 0 || slot >= L.slots) return 0;
    const key = this.trainerKey(line, slot);
    let done = 0;
    for (let k = 0; k < n; k++) {
      const cost = this.trainerNextCost(line, slot);
      if (cost === null) { if (!done) this.onToast(tp('t.trainerMax', { n: TRAINER.maxLevel })); break; }
      if (this.coins < cost) { if (!done) { this.onToast(t('t.trainerPoor')); sfx.play('deny'); } break; }
      this.coins -= cost;
      this.trainer[key] = (this.trainer[key] ?? 0) + 1;
      done++;
    }
    if (!done) return 0;
    const lv = this.trainer[key];
    this.onToast(tp('t.trainerUp', {
      name: L.name, s: slot + 1, n: lv, t: trainerTimeAt(line, lv),
    }));
    sfx.play('done');
    this.onState();
    this.save();
    return done;
  }

  // 现在的钱最多还能给这个工位升几级
  trainerAffordable(line, slot) {
    const left = TRAINER.maxLevel - this.trainerLevel(line, slot);
    return Math.max(0, Math.min(left, Math.floor(this.coins / TRAINER.cost)));
  }

  /* ---------- 发展评估 ---------- */

  // 十个维度各打 0~100 分。一律「离这个维度的天花板有多远」，
  // 不跟别的存档比——单机游戏没有别人可比，只跟自己的上限比。
  // 每个维度都由几项加权而成，免得单一数字一大就满分
  reviewScores() {
    const pct = (a, b) => (b > 0 ? Math.min(1, a / b) : 0);
    // 对数刻度：金币这种能到几千万的量，线性算的话前期永远是 0 分
    const log = (v, cap) => (v <= 0 ? 0 : Math.min(1, Math.log10(v + 1) / Math.log10(cap + 1)));
    const mix = (...parts) => Math.round(parts.reduce((a, [v, w]) => a + v * w, 0)
      / parts.reduce((a, [, w]) => a + w, 0) * 100);

    const tiles = this.tiles ?? [];
    const openTiles = tiles.filter(t => !t.locked).length;
    const planted = tiles.filter(t => t.plant).length;
    const soilLv = tiles.length ? tiles.reduce((a, t) => a + (t.soil ?? 0), 0) / tiles.length : 0;

    const pens = this.ranchPens ?? [];
    const filled = pens.filter(Boolean).length;
    // 动物档次：栏里动物在 ANIMALS 表中的位置，越靠后越高级
    const tierSum = pens.reduce((a, p) => {
      const i = p ? ANIMALS.findIndex(x => x.id === p.id) : -1;
      return a + (i >= 0 ? (i + 1) / ANIMALS.length : 0);
    }, 0);

    const inv = Object.keys(this.inventory ?? {});
    const has = (pre) => inv.filter(k => k.startsWith(pre) && this.inventory[k] > 0).length;

    const furnLv = Object.values(this.furniture ?? {}).reduce((a, v) => a + v, 0);
    const furnMax = FURNITURE.length * FURNITURE_MAX_LEVEL;

    return {
      wealth: mix([log(this.coins + (this.bank ?? 0), 5e7), 3], [log(this.bank ?? 0, 1e6), 1]),
      farm: mix([pct(openTiles, tiles.length), 3], [pct(planted, Math.max(1, openTiles)), 2],
        [pct(soilLv, SOILS.length - 1), 2], [pct(this.waterLevel, WATER_LEVELS.length - 1), 1],
        [pct(this.unlockedSeeds?.length ?? 0, SEEDS.length), 2]),
      ranch: mix([pct(filled, pens.length), 3], [pct(tierSum, pens.length), 3],
        [(this.butcher ?? []).some(Boolean) ? 1 : 0, 1]),
      craft: mix([pct((this.workshop ?? []).filter(Boolean).length, WORKSHOP.slots), 2],
        [pct((this.sorter ?? []).filter(Boolean).length, SORTER_SLOTS), 2],
        [pct((this.brewery ?? []).filter(Boolean).length + (this.cellar ?? []).filter(Boolean).length,
          BREW.slots + BREW.cellarSlots), 2],
        [pct(has('p:') + has('m:') + has('w:'), 12), 2]),
      cook: mix([pct((this.cookSlots ?? []).filter(Boolean).length, COOK_SLOTS), 2],
        [pct((this.advCookSlots ?? []).filter(Boolean).length, ADV_COOK_SLOTS), 2],
        [pct(has('k:'), 10), 2], [pct(has('g:'), 5), 3]),
      collect: mix([pct(Object.keys(this.codex ?? {}).length, 42), 3],
        [pct((this.aquarium ?? []).filter(Boolean).length, AQUARIUM_SLOTS), 2],
        [pct((this.displaySlots ?? []).filter(x => x.item).length, DISPLAY_SLOTS), 2],
        [pct(Object.keys(this.petsOwned ?? {}).length, PETS.length), 1],
        [pct(has('h:'), 8), 2]),
      achieve: mix([pct(Object.keys(this.achievements ?? {}).length, ACHIEVEMENTS.length), 1]),
      home: mix([pct(furnLv, furnMax), 3],
        [pct(Object.keys(this.petDecorsOwned ?? {}).length, PET_DECORS.length), 1],
        [pct(this.warehouseLevel ?? 1, WAREHOUSE.maxLevel), 2],
        [this.petShown ? 1 : 0, 1]),
      tower: mix([pct(this.towerLevel ?? 0, TOWER_MAX_LEVEL), 1]),
      harbor: mix([pct((this.harborPlaced ?? []).length, HARBOR_MAX_PLACED), 3],
        [pct(Object.keys(this.harborOwned ?? {}).length, 10), 2],
        [pct(Object.keys(this.harborSold ?? {}).length, 10), 2]),
    };
  }

  // 完整评估报告：各维度评级 + 两条建议（一条夸最强的，一条戳最弱的）
  reviewReport() {
    const scores = this.reviewScores();
    const rows = REVIEW_DIMS.map(d => ({ ...d, score: scores[d.key], grade: gradeOf(scores[d.key]) }));
    const sorted = [...rows].sort((a, b) => b.score - a.score);
    const best = sorted[0], worst = sorted[sorted.length - 1];

    // 建议按天数选，同一天进来看到的是同一条，不会点一次换一条
    const pick = (dim, type) => {
      const pool = REVIEW_TIPS.filter(t => t.dim === dim && t.type === type);
      return pool.length ? pool[this.dayCount % pool.length].text : '';
    };
    const overall = Math.round(rows.reduce((a, r) => a + r.score, 0) / rows.length);
    return {
      rows, overall, overallGrade: gradeOf(overall),
      best, worst,
      goodTip: pick(best.key, 'good'),
      gapTip: pick(worst.key, 'gap'),
    };
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
    if (lv >= FURNITURE_MAX_LEVEL) { this.onToast(`${d.name}已经是满级了`); return; }
    if (!this.spend(d.up[lv - 1])) return;
    this.petDecorsOwned[id] = lv + 1;
    this.petDecorStyle[id] = lv + 1; // 刚升的新外观先亮出来
    this.refreshPetRoom();
    this.onToast(`${d.emoji} ${d.name}升级成「${d.levelNames[lv]}」！`);
    sfx.play('upgrade');
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
    this.hybridSlots[slot] = { id, readyAt: this.time + HYBRID_TIME * this.trainerRatio('hybrid', slot) };
    this.refreshHybridStations();
    this.onToast(`🧬 ${h.emoji}${h.name}进入 ${slot + 1} 号培养罩，${HYBRID_TIME / 60} 分钟后来取`);
    this.onState();
    this.save();
    return true;
  }

  collectHybrid(slot) {
    const s = this.hybridSlots[slot];
    if (!s || this.time < s.readyAt) return;
    const hb = this.payTrainerBonus('hybrid', slot);
    if (hb) this.onToast(tp('t.trainerBonus', { n: hb }));
    const h = hybridById(s.id);
    const hkey = 'h:' + s.id;
    this.inventory[hkey] = (this.inventory[hkey] ?? 0) + 1;
    this.hybridSlots[slot] = null;
    this.refreshHybridStations();
    this.onToast(`🧬 培养完成！${h.emoji}${h.name}放入背包`);
    sfx.play('done');
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
      this.onToast(gear === 'rod'
        ? tp('t.needRod', { n: itemById('rod').cost })
        : tp('t.needNet', { n: itemById('castnet').cost }));
      return false;
    }
    this.fishing = true;
    this.fishingGear = gear;
    this.fishingTimer = 0;
    this.fishingEarned = 0;
    this.onToast(t(gear === 'rod' ? 't.castRod' : 't.castNet'));
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
    if (escaped > 0) this.onToast(tp('t.fishEscaped', { n: escaped }));
    this.onToast(this.fishingEarned > 0
      ? tp('t.reelEnd', { n: this.fishingEarned })
      : t('t.reelEndEmpty'));
  }

  // 咬钩后排进收杆队列：点击次数 = 金额 + 5（5块10下、6块11下…）
  // 咬钩的是一条具体的水产，不再是一坨钱
  queueCatch(label, sf) {
    const clicks = Math.max(4, Math.min(14, Math.round(sf.sell / 12) + 4)); // 越值钱越难拉
    const c = { label, seafood: sf.id, value: sf.sell, total: clicks, clicksLeft: clicks };
    if (this.pendingCatch) this.catchQueue.push(c);
    else this.pendingCatch = c;
  }

  // 收杆按钮点一下拉一下，拉完鱼才到手
  reelClick() {
    const c = this.pendingCatch;
    if (!c) return;
    c.clicksLeft -= 1;
    if (c.clicksLeft > 0) return;
    const sf = seafoodById(c.seafood);
    this.inventory[`s:${sf.id}`] = (this.inventory[`s:${sf.id}`] ?? 0) + 1;
    this.fishingEarned += sf.sell;
    this.onToast(`${c.label} 钓上来一只${sf.emoji}${sf.name}！值 ${sf.sell}💰，可以养进水族馆`);
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
      this.queueCatch(`${usingRod ? '🎣' : '🥅'} ${t(usingRod ? 'fish.rod' : 'fish.net')}`, rollSeafood(cfg.min, cfg.max));
      this.onToast(t('t.fishOn'));
      sfx.play('bite');
    } else {
      this.onToast(t(usingRod ? 't.noBiteRod' : 't.noBiteNet'));
    }
    this.onState();
  }

  // —— 水塘装饰 ——

  buyPondDecor(id) {
    const d = pondDecorById(id);
    if (!d) return;
    if (this.pondOwned[id]) { this.onToast(tp('t.decorOwned', { name: pondName(d) })); return; }
    if (!this.spend(d.cost)) return;
    this.pondOwned[id] = true;
    this.onToast(tp('t.decorBought', { name: pondName(d) }));
    this.onState();
    this.save();
  }

  placePondDecor(id) {
    const d = pondDecorById(id);
    if (!d || !this.pondOwned[id] || this.pondPlaced.includes(id)) return;
    if (this.pondPlaced.length >= POND_MAX_PLACED) {
      this.onToast(tp('t.pondFull', { n: POND_MAX_PLACED }));
      return;
    }
    this.pondPlaced.push(id);
    this.refreshPondDecors();
    this.onToast(tp('t.decorPlaced', { name: pondName(d) }));
    this.onState();
    this.save();
  }

  removePondDecor(id) {
    const i = this.pondPlaced.indexOf(id);
    if (i < 0) return;
    this.pondPlaced.splice(i, 1);
    this.refreshPondDecors();
    this.onToast(tp('t.decorRemoved', { name: pondName(pondDecorById(id)) }));
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
    if ((this.items.net ?? 0) <= 0) { this.onToast(tp('t.noNetItem', { n: itemById('net').cost })); return; }
    this.items.net -= 1;
    if (this.items.net === 0) delete this.items.net;
    this.fishNets[k] = { readyAt: this.time + FISHING.time };
    this.refreshNets();
    this.onToast(tp('t.netPlaced', { n: FISHING.time / 60 }));
    this.onState();
    this.save();
  }

  collectNet(k) {
    const n = this.fishNets[k];
    if (!n || this.time < n.readyAt) return;
    // 收网捞上来的是高档水产，不再直接给钱
    const sf = rollSeafood(FISHING.rewardMin, FISHING.rewardMax);
    this.fishNets[k] = null;
    this.refreshNets();
    this.inventory[`s:${sf.id}`] = (this.inventory[`s:${sf.id}`] ?? 0) + 1;
    this.onToast(tp('t.netCollect', { name: `${sf.emoji}${seafoodName(sf)}`, n: sf.sell }));
    sfx.play('done');
    this.onState();
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
    if (lv >= FURNITURE_MAX_LEVEL) { this.onToast(`${f.name}已经是满级了`); return; }
    const cost = f.up[lv - 1];
    if (!this.spend(cost)) return;
    this.furniture[id] = lv + 1;
    this.furnitureStyle[id] = lv + 1; // 刚买的新外观先亮出来
    this.refreshInterior();
    this.onToast(`${f.emoji} ${f.name}升级成「${f.levelNames[lv]}」！`);
    sfx.play('upgrade');
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

  /* ---------- 花房温室 ---------- */

  // 在花圃里种花：扣花种钱，记下开花时刻
  plantFlower(slot, flowerId) {
    const fl = flowerById(flowerId);
    if (!fl || slot < 0 || slot >= this.flowerPlots.length) return;
    if (this.flowerPlots[slot]) { this.onToast(t('t.plotBusy')); return; }
    if (!this.spend(fl.seed)) return;
    this.flowerPlots[slot] = { id: flowerId, readyAt: this.time + fl.grow };
    this.refreshGreenhousePlot(slot);
    this.onToast(tp('t.flowerSown', { emoji: fl.emoji, name: flowerName(fl),
      t: fl.grow >= 60 ? `${Math.round(fl.grow / 60)} ${t('unit.min')}` : `${fl.grow} ${t('unit.sec')}` }));
    sfx.play('plant');
    this.onState();
    this.save();
  }

  // 收花：开花后放进背包（key 形如 f:daisy）
  harvestFlower(slot) {
    const p = this.flowerPlots[slot];
    if (!p) return;
    if (this.time < p.readyAt) { this.onToast(t('t.notBloomed')); return; }
    const fl = flowerById(p.id);
    const key = 'f:' + p.id;
    this.inventory[key] = (this.inventory[key] ?? 0) + 1;
    this.flowerPlots[slot] = null;
    this.refreshGreenhousePlot(slot);
    this.onToast(tp('t.flowerPicked', { name: flowerName(fl) }));
    sfx.play('harvest');
    this.onState();
    this.save();
  }

  // 扎花束：任选 5 朵花（可跨品种），扣花，直接卖钱（总价 × 倍率）
  makeBouquet(keys) {
    if (!keys || keys.length !== BOUQUET_SIZE) { this.onToast(tp('t.needFlowers', { n: BOUQUET_SIZE })); return; }
    const need = {};
    keys.forEach(k => { need[k] = (need[k] ?? 0) + 1; });
    for (const k in need) { if ((this.inventory[k] ?? 0) < need[k]) { this.onToast(t('t.notEnoughFlowers')); return; } }
    let sum = 0;
    keys.forEach(k => { sum += keyInfo(k).price; });
    const price = Math.floor(sum * BOUQUET_MULT);
    for (const k in need) { this.inventory[k] -= need[k]; if (this.inventory[k] <= 0) delete this.inventory[k]; }
    this.coins += price;
    this.onToast(tp('t.bouquetSold', { n: price }));
    sfx.play('bouquet');
    this.onState();
    this.save();
  }

  refreshGreenhouse() {
    for (let i = 0; i < this.flowerPlots.length; i++) this.refreshGreenhousePlot(i);
  }

  // 单个花圃：空着不显示，生长中显示花苞，开花后显示整朵花
  refreshGreenhousePlot(i) {
    const cur = this.flowerMeshes[i];
    if (cur) { this.greenhouseHall.remove(cur); delete this.flowerMeshes[i]; }
    const p = this.flowerPlots[i];
    if (!p) return;
    const [x, z] = GREENHOUSE_SPOTS[i];
    const m = this.time >= p.readyAt ? createFlowerMesh(p.id) : createFlowerBud();
    m.position.set(x, 0.38, z);
    this.greenhouseHall.add(m);
    this.flowerMeshes[i] = m;
  }

  // 换肤：农田里那栋外观房子按当前皮肤重建
  rebuildHouse() {
    if (this.houseMesh) this.group.remove(this.houseMesh);
    this.houseMesh = createHouse(this.houseSkin);
    this.houseMesh.position.set(10, -0.51, 4.6);
    this.houseMesh.rotation.y = -0.45;
    this.group.add(this.houseMesh);
    this.houseMeshes = [];
    this.houseMesh.traverse(o => { if (o.isMesh) this.houseMeshes.push(o); });
  }

  // 换肤：屋内房间壳（地板/墙纸/灯光）按当前皮肤重建，家具随后由 refreshInterior 重新摆
  rebuildRoomShell() {
    if (this.interior) this.group.remove(this.interior);
    this.interior = createInteriorRoom(this.houseSkin);
    this.interior.position.set(INTERIOR_POS.x, INTERIOR_POS.y, INTERIOR_POS.z);
    this.group.add(this.interior);
    this.interiorFurniture = {}; // 旧家具随旧房间移除，清引用让 refreshInterior 重新生成
  }

  // 挑选一处外观样式：扣少量金币，按内外部位重建对应模型
  setHouseSkin(part, idx) {
    const def = HOUSE_SKINS[part];
    if (!def || !def.options[idx]) return;
    if ((this.houseSkin[part] ?? 0) === idx) return; // 没变化，不扣钱
    if (!this.spend(HOUSE_SKIN_COST)) return;        // 金币不足，spend 内部会提示
    this.houseSkin[part] = idx;
    if (def.part === 'ext') this.rebuildHouse();
    else { this.rebuildRoomShell(); this.refreshInterior(); }
    this.onToast(`🎨 ${def.name}换成了「${def.options[idx].name}」`);
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

  /* ---------- 分拣台 ---------- */

  // 只有带品质的作物本体能分拣：罐头/料理/杂交/花/蔫作物/金属条都不行
  sortableKey(key) {
    if (typeof key !== 'string') return null;
    if (key.startsWith('p:') || key.startsWith('k:') || key.startsWith('h:')
      || key.startsWith('f:') || key.startsWith('x:') || key.startsWith('m:')
      || key.startsWith('y:') || key.startsWith('s:')) return null;
    const [id, quality] = key.split(':');
    if (!quality || !METAL[quality] || !seedById(id)) return null;
    return { id, quality };
  }

  sortStart(slot, key) {
    if (this.sorter[slot]) { this.onToast('这个分拣位正忙着'); return false; }
    const parsed = this.sortableKey(key);
    if (!parsed) {
      this.onToast('分拣台只收白银/黄金品质的作物本体');
      sfx.play('deny');
      return false;
    }
    if ((this.inventory[key] ?? 0) <= 0) return false;
    this.inventory[key] -= 1;
    if (this.inventory[key] <= 0) delete this.inventory[key];
    this.sorter[slot] = { key, readyAt: this.time + SORTER_TIME };
    const info = keyInfo(key);
    this.onToast(`${info.icon}${info.label} 进了分拣台，${SORTER_TIME / 60} 分钟后来取`);
    sfx.play('plant');
    this.onState();
    this.save();
    return true;
  }

  // 分拣产物：普通作物 ×1 + 对应的金属条 ×1
  sortYield(key) {
    const { id, quality } = this.sortableKey(key);
    return { plain: id, metal: `m:${id}:${quality}` };
  }

  sortCollect(slot) {
    const s = this.sorter[slot];
    if (!s || this.time < s.readyAt) return;
    const { plain, metal } = this.sortYield(s.key);
    this.inventory[plain] = (this.inventory[plain] ?? 0) + 1;
    this.inventory[metal] = (this.inventory[metal] ?? 0) + 1;
    this.sorter[slot] = null;
    const pi = keyInfo(plain), mi = keyInfo(metal);
    this.onToast(`⚙️ 分拣完成！${pi.icon}${pi.label} + ${mi.icon}${mi.label}（${mi.price}💰）`);
    sfx.play('done');
    this.onState();
    this.save();
  }

  sortingCount() {
    return this.sorter.filter(s => s && this.time < s.readyAt).length;
  }

  /* ---------- 酒庄 ---------- */

  // 能拿去酿的：田里收的作物本体（含品质），加工品/花/水产/金属条/酒都不行
  brewable(key) {
    if (['p:', 'k:', 'h:', 'f:', 'm:', 's:', 'w:', 'x:', 'y:'].some(p => key.startsWith(p))) return false;
    if (key === EGG.key) return false;
    return !!seedById(key.split(':')[0]);
  }

  brewCandidates() {
    return Object.keys(this.inventory).filter(k => (this.inventory[k] ?? 0) > 0 && this.brewable(k));
  }

  // 放一颗果子进酿造台
  startBrew(slot, key) {
    if (this.brewery[slot]) { this.onToast('这个酿造台正忙着'); sfx.play('deny'); return false; }
    if (!this.brewable(key) || (this.inventory[key] ?? 0) <= 0) {
      this.onToast('这个酿不了酒'); sfx.play('deny'); return false;
    }
    this.inventory[key] -= 1;
    if (this.inventory[key] <= 0) delete this.inventory[key];
    this.brewery[slot] = { key, readyAt: this.time + BREW.time };
    const info = keyInfo(key);
    this.onToast(`🍇 ${info.icon}${info.label} 下缸了，${BREW.time / 60} 分钟后出酒`);
    sfx.play('plant');
    this.refreshBrewery();
    this.onState();
    this.save();
    return true;
  }

  brewReady(slot) {
    const b = this.brewery[slot];
    return !!b && this.time >= b.readyAt;
  }

  // 酿好了取出来 → 直接进酒窖窖藏；酒窖满了就先别取
  collectBrew(slot) {
    if (!this.brewReady(slot)) return false;
    const free = this.cellar.indexOf(null);
    if (free < 0) { this.onToast(`酒窖 ${BREW.cellarSlots} 格都满了，先取几瓶出来`); sfx.play('deny'); return false; }
    const { key } = this.brewery[slot];
    this.brewery[slot] = null;
    this.cellar[free] = { key, sinceDay: this.dayCount };
    const info = keyInfo(key);
    this.onToast(`🍷 ${info.label}酒出缸！进了 ${free + 1} 号酒架，开始窖藏`);
    sfx.play('done');
    this.refreshBrewery();
    this.onState();
    this.save();
    return true;
  }

  // 这瓶窖藏了几天 / 现在值多少
  cellarDays(slot) {
    const c = this.cellar[slot];
    return c ? Math.max(0, this.dayCount - c.sinceDay) : 0;
  }
  cellarValue(slot) {
    const c = this.cellar[slot];
    return c ? winePrice(keyInfo(c.key).price, this.cellarDays(slot)) : 0;
  }

  // 满意了就取回背包，价格在这一刻定死（编进 key 里）
  takeWine(slot) {
    const c = this.cellar[slot];
    if (!c) return false;
    const days = this.cellarDays(slot);
    const wineKey = `w:${c.key}:${days}`;
    this.cellar[slot] = null;
    this.inventory[wineKey] = (this.inventory[wineKey] ?? 0) + 1;
    const info = keyInfo(wineKey);
    this.onToast(`🍷 ${info.label}（窖藏 ${days} 天）收进背包，值 ${info.price}💰`);
    sfx.play('coin');
    this.refreshBrewery();
    this.onState();
    this.save();
    return true;
  }

  // 原果越贵，瓶色越往金紫走
  wineTint(price) {
    if (price >= 5000) return 0xd8b048;  // 金
    if (price >= 1000) return 0x8a3ab0;  // 紫
    if (price >= 200) return 0x9a2a4a;   // 深红
    return 0xc4566a;                     // 浅红
  }

  // 重建酒窖里的三个缸和九个架子
  refreshBrewery() {
    if (!this.breweryHall) return;
    this.vatMeshes.forEach(m => this.breweryHall.remove(m));
    this.rackMeshes.forEach(m => this.breweryHall.remove(m));
    this.vatMeshes = []; this.rackMeshes = [];
    this.brewery.forEach((b, k) => {
      const vat = createBrewVat(!!b && !this.brewReady(k));
      const s = BREW_SPOTS[k];
      vat.position.set(s.x, 0, s.z);
      this.breweryHall.add(vat);
      this.vatMeshes.push(vat);
    });
    this.cellar.forEach((c, k) => {
      // 瓶色按原果身价分档：一排看过去就知道哪瓶是硬货
      const rack = createCellarRack(!!c, c ? this.wineTint(keyInfo(c.key).price) : 0);
      const s = CELLAR_SPOTS[k];
      rack.position.set(s.x, 0, s.z);
      this.breweryHall.add(rack);
      this.rackMeshes.push(rack);
    });
  }

  /* ---------- 食品店：礼盒挂单 ---------- */

  // 能装盒的跟能酿酒的是同一批：田里收的作物本体
  giftCandidates() {
    return Object.keys(this.inventory).filter(k => (this.inventory[k] ?? 0) > 0 && this.brewable(k));
  }

  // 装盒上架：扣掉 4 件作物，随机一个成交时刻挂在货架上
  listGiftbox(keys) {
    const slot = this.shelf.indexOf(null);
    if (slot < 0) { this.onToast(`货架 ${GIFTBOX.slots} 格都满了，先等等或者下架一盒`); sfx.play('deny'); return false; }
    if (!keys || keys.length !== GIFTBOX.size) {
      this.onToast(`要凑够 ${GIFTBOX.size} 种作物才能装一盒`); sfx.play('deny'); return false;
    }
    // 先按 key 汇总需求量再统一校验：选了两份同种作物时，逐个判断会漏掉数量不足
    const need = {};
    keys.forEach(k => { need[k] = (need[k] ?? 0) + 1; });
    for (const k in need) {
      if (!this.brewable(k)) { this.onToast('礼盒只装田里收的作物'); sfx.play('deny'); return false; }
      if ((this.inventory[k] ?? 0) < need[k]) { this.onToast('背包里的作物不够'); sfx.play('deny'); return false; }
    }
    const price = giftboxPrice(keys.reduce((s, k) => s + keyInfo(k).price, 0));
    for (const k in need) {
      this.inventory[k] -= need[k];
      if (this.inventory[k] <= 0) delete this.inventory[k];
    }
    const wait = GIFTBOX.minWait + Math.random() * (GIFTBOX.maxWait - GIFTBOX.minWait);
    this.shelf[slot] = { keys: [...keys], price, soldAt: this.time + wait };
    this.onToast(`🎁 礼盒上架！标价 ${price}💰，等人来买`);
    sfx.play('done');
    this.refreshShelf();
    this.onState();
    this.save();
    return true;
  }

  // 下架：作物原样退回背包，等于零成本反悔
  unlistGiftbox(slot) {
    const box = this.shelf[slot];
    if (!box) return false;
    box.keys.forEach(k => { this.inventory[k] = (this.inventory[k] ?? 0) + 1; });
    this.shelf[slot] = null;
    this.onToast(`📤 ${slot + 1} 号礼盒下架，${GIFTBOX.size} 件作物退回背包`);
    sfx.play('tap');
    this.refreshShelf();
    this.onState();
    this.save();
    return true;
  }

  // 到点的礼盒自动成交，钱直接进账（tick 每帧调用，离线结算也走它）
  tickShelf() {
    let sold = 0, income = 0;
    this.shelf.forEach((box, k) => {
      if (!box || this.time < box.soldAt) return;
      this.shelf[k] = null;
      income += box.price;
      sold += 1;
    });
    if (!sold) return;
    this.gain(income);
    this.onToast(`🎁 卖出 ${sold} 份礼盒，+${income}💰 已入账`);
    sfx.play('coin');
    this.refreshShelf();
    this.save();
  }

  // 重建货架上的 5 个格子
  refreshShelf() {
    if (!this.foodShopHall) return;
    this.shelfMeshes.forEach(m => this.foodShopHall.remove(m));
    this.shelfMeshes = [];
    this.shelf.forEach((box, k) => {
      // 盒子颜色按标价分档，一排看过去知道哪盒是大单
      const tint = box ? this.giftTint(box.price) : 0;
      const m = createShelfSlot(!!box, tint);
      const s = SHELF_SPOTS[k];
      m.position.set(s.x, 0, s.z);
      this.foodShopHall.add(m);
      this.shelfMeshes.push(m);
    });
  }

  // 标价越高，盒子越往金紫走（跟酒瓶同一套分档思路）
  giftTint(price) {
    if (price >= 20000) return 0x8a3ab0;  // 紫
    if (price >= 5000) return 0xd8b048;   // 金
    if (price >= 800) return 0xe08a3a;    // 橙
    return 0xe8b23a;                      // 常规黄
  }

  /* ---------- 仓库 ---------- */

  warehouseUsed() { return Object.values(this.warehouse).reduce((a, b) => a + b, 0); }
  warehouseMax() { return warehouseCap(this.warehouseLevel); }
  warehouseFree() { return Math.max(0, this.warehouseMax() - this.warehouseUsed()); }

  // 背包 → 仓库。装不下就有多少存多少，不静默吞掉
  storeToWarehouse(key, count) {
    const have = this.inventory[key] ?? 0;
    const free = this.warehouseFree();
    const n = Math.min(count, have, free);
    if (n <= 0) {
      this.onToast(free <= 0 ? '仓库满了，先升级或者取点东西出来' : '背包里没有这个');
      sfx.play('deny');
      return false;
    }
    this.inventory[key] -= n;
    if (this.inventory[key] <= 0) delete this.inventory[key];
    this.warehouse[key] = (this.warehouse[key] ?? 0) + n;
    const info = keyInfo(key);
    this.onToast(`📦 ${info.icon}${info.label} ×${n} 存进仓库`
      + (n < count ? `（只装得下 ${n} 件）` : '')
      + ` · ${this.warehouseUsed()}/${this.warehouseMax()}`);
    sfx.play('done');
    this.onState();
    this.save();
    return true;
  }

  // 仓库 → 背包
  takeFromWarehouse(key, count) {
    const have = this.warehouse[key] ?? 0;
    const n = Math.min(count, have);
    if (n <= 0) return false;
    this.warehouse[key] -= n;
    if (this.warehouse[key] <= 0) delete this.warehouse[key];
    this.inventory[key] = (this.inventory[key] ?? 0) + n;
    const info = keyInfo(key);
    this.onToast(`📤 ${info.icon}${info.label} ×${n} 取回背包`);
    sfx.play('open');
    this.onState();
    this.save();
    return true;
  }

  upgradeWarehouse() {
    if (this.warehouseLevel >= WAREHOUSE.maxLevel) {
      this.onToast('仓库已经是满级了'); sfx.play('deny'); return false;
    }
    if (!this.spend(WAREHOUSE.upCost)) return false;
    this.warehouseLevel += 1;
    this.onToast(`📦 仓库升到 ${this.warehouseLevel} 级，能装 ${this.warehouseMax()} 件了`);
    sfx.play('upgrade');
    this.onState();
    this.save();
    return true;
  }

  /* ---------- 天气观测台 ---------- */

  // 三种状态：null 没开机 / { readyAt } 观测中 / { fromDay } 报告已出
  observatoryState() {
    const o = this.observatory;
    if (!o) return 'idle';
    if (o.readyAt !== undefined) return this.time >= o.readyAt ? 'done' : 'running';
    return 'report';
  }

  startObservatory() {
    if (this.observatoryState() !== 'idle' && this.observatoryState() !== 'report') {
      this.onToast('观测台正忙着呢'); sfx.play('deny'); return false;
    }
    if (!this.spend(OBSERVATORY.cost)) return false;
    this.observatory = { readyAt: this.time + OBSERVATORY.time };
    this.onToast(`🔭 观测台启动，${OBSERVATORY.time / 60} 分钟后出预报`);
    sfx.play('upgrade');
    this.onState();
    this.save();
    return true;
  }

  // 观测跑完，把报告的起始天固定下来
  collectForecast() {
    if (this.observatoryState() !== 'done') return false;
    this.observatory = { fromDay: this.dayCount };
    this.onToast(`🔭 预报出炉！未来 ${OBSERVATORY.days} 天的天气都在这儿了`);
    sfx.play('done');
    this.onState();
    this.save();
    return true;
  }

  // 报告内容：从出报告那天起 N 天，每天的天气
  forecastList() {
    const o = this.observatory;
    if (!o || o.fromDay === undefined) return [];
    return Array.from({ length: OBSERVATORY.days }, (_, i) => {
      const day = o.fromDay + i;
      return { day, offset: day - this.dayCount, weather: this.weatherAt(day) };
    });
  }

  // 报告过期 = 当前天数已经走过了整份报告
  forecastExpired() {
    const o = this.observatory;
    return !!o && o.fromDay !== undefined && this.dayCount > o.fromDay + OBSERVATORY.days - 1;
  }

  /* ---------- 牧场 ---------- */

  // 当前每分钟的挂机总收益（只算已成年、还留在栏里的）
  ranchIdleRate() {
    return this.ranchPens.reduce((sum, p) => {
      if (!p || this.time < p.readyAt) return sum;
      return sum + (animalById(p.id)?.idle ?? 0);
    }, 0);
  }

  ranchGrownCount() {
    return this.ranchPens.filter(p => p && this.time >= p.readyAt).length;
  }

  // 买一只幼崽放进空栏
  buyAnimal(pen, animalId) {
    const an = animalById(animalId);
    if (!an || pen < 0 || pen >= this.ranchPens.length) return;
    if (this.ranchPens[pen]) { this.onToast(t('t.penBusy')); return; }
    if (!this.spend(an.cost)) return;
    this.ranchPens[pen] = { id: animalId, readyAt: this.time + an.grow };
    this.refreshRanchPen(pen);
    this.onToast(tp('t.animalBought', { name: `${an.emoji}${animalName(an)}`,
      t: `${Math.round(an.grow / 60)} ${t('unit.min')}` }));
    sfx.play('plant');
    this.onState();
    this.save();
  }

  // 收走成年动物 → 进背包（背包/黑市都能卖）。不收的话它会一直产挂机收益
  collectAnimal(pen) {
    const p = this.ranchPens[pen];
    if (!p) return;
    if (this.time < p.readyAt) { this.onToast(t('t.animalYoung')); return; }
    const an = animalById(p.id);
    const key = 'a:' + p.id;
    this.inventory[key] = (this.inventory[key] ?? 0) + 1;
    this.ranchPens[pen] = null;
    this.refreshRanchPen(pen);
    this.onToast(tp('t.animalCollected', { name: `${an.emoji}${animalName(an)}`, n: an.sell }));
    sfx.play('harvest');
    this.onState();
    this.save();
  }

  refreshRanch() {
    for (let i = 0; i < this.ranchPens.length; i++) this.refreshRanchPen(i);
  }

  // 空栏不显示，未成年显示幼崽，成年显示成体
  refreshRanchPen(i) {
    const cur = this.ranchAnimalMeshes[i];
    if (cur) { this.group.remove(cur); delete this.ranchAnimalMeshes[i]; }
    const p = this.ranchPens[i];
    if (!p) return;
    const grown = this.time >= p.readyAt;
    const m = createAnimalMesh(p.id, grown);
    const { x, y, z } = ranchPos(i % RANCH_GRID, Math.floor(i / RANCH_GRID));
    m.position.set(RANCH_POS.x + x, y - 0.44, RANCH_POS.z + z);
    this.group.add(m);
    this.ranchAnimalMeshes[i] = m;
  }

  /* ---------- 参观客 ---------- */

  // 三处装饰的珍稀度。取的是「已投入的金币」，所以以后加家具加鱼会自动跟着算
  visitorBreakdown() {
    return rarityBreakdown({
      furniture: this.furniture,
      petDecors: this.petDecorsOwned,
      pets: this.petsOwned,
      aquarium: this.aquarium,
    });
  }

  // 面板要的一整套数字，算一次给全，省得面板里到处调
  visitorStats() {
    const b = this.visitorBreakdown();
    return {
      ...b,
      max: RARITY_MAX,
      ratio: Math.min(1, b.total / RARITY_MAX),
      ticket: visitorTicket(b.total),
      rate: visitorRate(b.total),
      income: visitorIncome(b.total),
      total: b.total,
      earned: this.visitorTotal,
    };
  }

  // 参观路线：从岛的东南角上岸 → 小屋 → 宠物间 → 水族馆 → 往西边离岛。
  // 三处的坐标跟建筑摆放写死在一起，改建筑位置时记得一起改
  visitorRoute() {
    return [
      { x: 20, z: 15 },            // 上岸
      { x: 10, z: 6.4, stop: true },   // 🏠 小屋（站在门口一点，别插进墙里）
      { x: 6.5, z: 14.3, stop: true }, // 🐾 宠物间
      { x: -15, z: 2.3, stop: true },  // 🐠 水族馆
      { x: -26, z: 8 },            // 离岛
    ];
  }

  spawnVisitor() {
    if (this.visitors.length >= VISITOR.maxOnScreen) return;
    const mesh = createVisitor();
    const route = this.visitorRoute();
    // 起点稍微散开，不然一串人走同一条线像列队
    const jitter = () => (Math.random() - 0.5) * 1.6;
    const path = route.map(p => ({ x: p.x + jitter(), z: p.z + jitter(), stop: !!p.stop }));
    mesh.position.set(path[0].x, -0.51, path[0].z);
    this.visitorGroup.add(mesh);
    this.visitors.push({ mesh, path, leg: 0, wait: 0 });
  }

  // 每帧推进小人：沿路点走，到「停留点」站一会儿看看，走完整条路就消失
  updateVisitors(dt) {
    for (let i = this.visitors.length - 1; i >= 0; i--) {
      const v = this.visitors[i];
      if (v.wait > 0) {
        v.wait -= dt;
        // 站着看的时候原地轻轻晃，不然像个木桩
        v.mesh.rotation.y += dt * 0.6;
        continue;
      }
      const to = v.path[v.leg + 1];
      if (!to) {   // 走完了，离场
        this.visitorGroup.remove(v.mesh);
        this.visitors.splice(i, 1);
        continue;
      }
      const p = v.mesh.position;
      const dx = to.x - p.x, dz = to.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.15) {
        v.leg += 1;
        if (to.stop) v.wait = VISITOR.stay;
        continue;
      }
      const step = Math.min(d, VISITOR.speed * dt);
      p.x += dx / d * step;
      p.z += dz / d * step;
      v.mesh.rotation.y = Math.atan2(dx, dz);
      // 四肢摆动 + 走路的上下起伏
      const ph = (v.mesh.userData.walkPhase += dt * 9);
      const sw = Math.sin(ph) * 0.5;
      v.mesh.userData.legs[0].rotation.x = sw;
      v.mesh.userData.legs[1].rotation.x = -sw;
      v.mesh.userData.arms[0].rotation.x = -sw * 0.7;
      v.mesh.userData.arms[1].rotation.x = sw * 0.7;
      p.y = -0.51 + Math.abs(Math.sin(ph)) * 0.03;
    }
  }

  /* ---------- 屠宰场 ---------- */

  // 背包里能送进屠宰场的：只有整只动物（a: 前缀）
  butcherable() {
    return Object.keys(this.inventory).filter(k => k.startsWith('a:') && this.inventory[k] > 0);
  }

  // 某个工位当前处在哪一段：'kill' 屠宰中 / 'cut' 细分中 / 'done' 可取
  butcherStage(slot) {
    const b = this.butcher[slot];
    if (!b) return null;
    const remain = b.readyAt - this.time;
    if (remain <= 0) return 'done';
    // 两段都按同一个比例缩，否则升级后阶段分界会错位
    return remain > BUTCHER.cutTime * this.trainerRatio('butcher', slot) ? 'kill' : 'cut';
  }

  startButcher(slot, key) {
    if (slot < 0 || slot >= this.butcher.length) return false;
    if (this.butcher[slot]) { this.onToast(t('t.butcherBusy')); return false; }
    if (!key.startsWith('a:') || (this.inventory[key] ?? 0) <= 0) { this.onToast(t('t.butcherOnlyAnimals')); return false; }
    this.inventory[key] -= 1;
    if (this.inventory[key] <= 0) delete this.inventory[key];
    this.butcher[slot] = { key, readyAt: this.time + (BUTCHER.killTime + BUTCHER.cutTime) * this.trainerRatio('butcher', slot) };
    const info = keyInfo(key);
    this.onToast(tp('t.butcherStart', { name: `${info.icon}${info.label}`,
      t: `${(BUTCHER.killTime + BUTCHER.cutTime) / 60} ${t('unit.min')}` }));
    sfx.play('open');
    this.onState();
    this.save();
    return true;
  }

  // 取出：一只动物拆成 4 个部位，总价 = 整只 × 1.5
  collectButcher(slot) {
    const b = this.butcher[slot];
    if (!b) return;
    if (this.time < b.readyAt) { this.onToast(t('t.butcherWorking')); return; }
    // 屠宰一次出 CUTS.length 个部位，奖金按件数算
    const bb = this.payTrainerBonus('butcher', slot, CUTS.length);
    if (bb) this.onToast(tp('t.trainerBonus', { n: bb }));
    const animalId = b.key.slice(2);
    let total = 0;
    CUTS.forEach(c => {
      const k = `c:${animalId}:${c.id}`;
      this.inventory[k] = (this.inventory[k] ?? 0) + 1;
      total += cutPrice(animalId, c.id);
    });
    this.butcher[slot] = null;
    const an = animalById(animalId);
    this.onToast(tp('t.butcherDone', { name: `${an.emoji}${animalName(an)}`,
      n: CUTS.length, total: total.toLocaleString() }));
    sfx.play('harvest');
    this.onState();
    this.save();
  }

  butcherBusyCount() {
    return this.butcher.filter(b => b && this.time < b.readyAt).length;
  }

  /* ---------- 黑市 ---------- */

  // 半天序号：白天和夜晚各占一个，天亮/天黑时 +1，行情就跟着翻牌
  blackPeriod() { return this.dayCount * 2 + (this.isNight() ? 1 : 0); }

  // 当前行情（0.5~1.5），半天一换，这半天里怎么读档都是同一个值
  blackMood() { return blackMarketMood(this.blackPeriod()); }

  // 给玩家看的模糊风声，不报精确数字
  blackMoodLabel() { return blackMoodOf(this.blackMood()); }

  // 成交倍率：行情为底，再加一层成交那一刻的随机，钳在 ±50% 内
  rollBlackMult() {
    const jitter = (Math.random() * 2 - 1) * BLACK_MARKET.jitter;
    return Math.min(BLACK_MARKET.max, Math.max(BLACK_MARKET.min, this.blackMood() + jitter));
  }

  // 卖给黑市：一次一种，赚多赚少当场揭晓
  sellToBlackMarket(key) {
    const n = this.inventory[key] ?? 0;
    if (n <= 0) return false;
    const info = keyInfo(key);
    const mult = this.rollBlackMult();
    // 打过药的照旧要掷报废骰子，黑市可不管你货好不好
    const ruined = info.sprayed ? this.rollSprayed(n) : 0;
    const total = Math.max(0, Math.floor(info.price * (n - ruined) * mult));
    delete this.inventory[key];
    this.gain(total);
    const pct = Math.round((mult - 1) * 100);
    const face = mult >= 1.25 ? '🤑 老板今天大方' : mult >= 1.02 ? '🙂 谈了个好价'
      : mult >= 0.85 ? '😐 就这么着吧' : '💀 被狠狠压价';
    this.onToast(`${face}：${info.icon}${info.label} ×${n} 按 ${pct >= 0 ? '+' : ''}${pct}% 成交，+${total}💰`
      + (ruined ? `（${ruined} 个药坏了）` : ''));
    sfx.play(mult >= 1.02 ? 'coin' : 'deny');
    this.onState();
    this.save();
    return true;
  }

  /* ---------- 水族馆 ---------- */

  aquariumCount() { return this.aquarium.filter(Boolean).length; }

  // 背包里哪些能摆进水族馆：水产本身，外加能孵化的恐龙虾卵
  aquariumCandidates() {
    return Object.keys(this.inventory).filter(k =>
      (this.inventory[k] ?? 0) > 0 && (k.startsWith('s:') || k === EGG.key));
  }

  // 摆一样进去。恐龙虾卵是特例：进去就孵成恐龙虾
  addToAquarium(key) {
    const slot = this.aquarium.indexOf(null);
    if (slot < 0) { this.onToast(`水族馆最多养 ${AQUARIUM_SLOTS} 只，先取出来一只吧`); sfx.play('deny'); return false; }
    if ((this.inventory[key] ?? 0) <= 0) return false;
    const hatched = key === EGG.key;
    const id = hatched ? EGG_HATCH : key.slice(2);
    if (!seafoodById(id)) { this.onToast('这个养不了'); sfx.play('deny'); return false; }
    this.inventory[key] -= 1;
    if (this.inventory[key] <= 0) delete this.inventory[key];
    this.aquarium[slot] = id;
    this.refreshAquarium();
    const sf = seafoodById(id);
    this.onToast(hatched
      ? tp('t.eggHatched', { name: `${sf.emoji}${seafoodName(sf)}`, n: slot + 1 })
      : tp('t.aquaAdded', { name: `${sf.emoji}${seafoodName(sf)}`, n: slot + 1, cur: this.aquariumCount(), max: AQUARIUM_SLOTS }));
    sfx.play(hatched ? 'upgrade' : 'done');
    this.onState();
    this.save();
    return true;
  }

  // 取出来放回背包（孵出来的恐龙虾也能取，取出就是水产）
  takeFromAquarium(slot) {
    const id = this.aquarium[slot];
    if (!id) return;
    this.aquarium[slot] = null;
    const key = `s:${id}`;
    this.inventory[key] = (this.inventory[key] ?? 0) + 1;
    this.refreshAquarium();
    const sf = seafoodById(id);
    this.onToast(`${sf.emoji} ${sf.name}捞回背包了`);
    sfx.play('close');
    this.onState();
    this.save();
  }

  // 重建 15 个缸：有货的摆水产，空的只留空缸
  refreshAquarium() {
    if (!this.aquariumHall) return;
    this.tankMeshes.forEach(m => this.aquariumHall.remove(m));
    this.tankMeshes = [];
    this.aquarium.forEach((id, k) => {
      const spot = AQUARIUM_SPOTS[k];
      const tank = createAquariumTank(id);
      tank.position.set(spot.x, 0, spot.z);
      this.aquariumHall.add(tank);
      this.tankMeshes.push(tank);
    });
  }

  /* ---------- 成就系统 ---------- */

  // 逐条比对当前状态，把新达成的记下来并回调 UI。
  // silent=true 只补记不弹提示，读档时用——老存档一进来就点亮一批，
  // 不静默的话会一口气弹十几条横幅刷屏。
  // 取一条成就的当前进度，取值函数出错也不能连累主循环
  achievementCur(a) {
    try { return a.cur(this); } catch { return 0; }
  }

  // 收回「名不副实」的成就：目标被后来调大、现在够不着了就撤销。
  // 典型场景：新增了 2 种特殊种子，「特殊种子收藏家」从集齐 6 变成集齐 8，
  // 而玩家手上还是 6 种——这时候顶着「已达成」是假的，先收回，集齐了会自动再亮。
  // 注意只认「目标变大」，玩家自己把钱花光导致金币类成就回落的不算，那是正常波动。
  // 循环到稳定：收回一条会让「园艺大师」这种统计型成就的进度跟着掉，可能连锁。
  revokeUnearned() {
    const revoked = [];
    let changed = true;
    while (changed) {
      changed = false;
      for (const a of ACHIEVEMENTS) {
        const rec = this.achievements[a.id];
        if (!rec) continue;
        // 条件改版（rev 对不上）：达成规则本身换了，不只是目标调大。
        // 这条不看单调性——「玩家当时确实做到过」说的是旧规则，新规则下得重挣。
        const recRev = (typeof rec === 'object' ? rec.rev : null) ?? 1;
        if ((a.rev ?? 1) !== recRev) {
          delete this.achievements[a.id];
          revoked.push({ a, reason: 'rev' });
          changed = true;
          continue;
        }
        // 只动「只增不减」那类。金币、槽位占用、摆放数会正常回落，
        // 玩家当时确实做到过，不能因为此刻不满足就把成就扒了。
        if (!a.monotonic) continue;
        // 老存档只存了时间戳，不知道当年的目标，就按「现在够不够」判定
        const earnedMax = (typeof rec === 'object') ? rec.max : null;
        const targetRaised = earnedMax == null || a.max > earnedMax;
        // 连锁：组件成就被收回后，「园艺大师」这类统计型的进度会掉到
        // 连达成当年的目标都不够——那次达成已被追溯推翻，一并收回。
        // 真正单调的量（解锁数、收录数）永远不会掉到 earnedMax 以下，不受影响。
        const fellBelow = earnedMax != null && this.achievementCur(a) < earnedMax;
        if ((targetRaised || fellBelow) && this.achievementCur(a) < a.max) {
          delete this.achievements[a.id];
          revoked.push({ a, reason: targetRaised ? 'raised' : 'chain' });
          changed = true;
        }
      }
    }
    // 留下来的老记录补上当年的目标值，之后就只在目标真变大时才会再收回
    for (const a of ACHIEVEMENTS) {
      const rec = this.achievements[a.id];
      if (rec && typeof rec !== 'object') this.achievements[a.id] = { at: rec, max: a.max };
    }
    if (revoked.length) this.refreshTrophies();
    return revoked;
  }

  checkAchievements(silent = false) {
    const fresh = [];
    for (const a of ACHIEVEMENTS) {
      if (this.achievements[a.id]) continue;
      let done = false;
      try { done = a.cur(this) >= a.max; } catch { done = false; }
      if (!done) continue;
      // 连达成时的目标一起记下来，日后目标被调大才认得出来；
      // 条件改过版的成就（rev ≥ 2）把版本号也记上，再改版才认得出老记录
      const rec = { at: Date.now(), max: a.max };
      if (a.rev) rec.rev = a.rev;
      this.achievements[a.id] = rec;
      fresh.push(a);
    }
    if (!fresh.length) return fresh;
    this.refreshTrophies();
    if (!silent) fresh.forEach(a => this.onAchievement(a));
    this.save();
    return fresh;
  }

  achievementCount() { return Object.keys(this.achievements).length; }

  // 成就进度：已达成 / 未达成都要算，供面板和奖杯展厅用
  achievementProgress(a) {
    let cur = 0;
    try { cur = a.cur(this); } catch { cur = 0; }
    return { cur: Math.min(cur, a.max), max: a.max, done: !!this.achievements[a.id] };
  }

  // 展厅里每座台子：达成的立起奖杯，没达成的留一个灰底座
  // 带 spot 的成就自己指定站位（比如金星下的荣誉位），其余按顺序填 6×5 方阵
  refreshTrophies() {
    if (!this.achievementHall) return;
    let gridIdx = 0;
    ACHIEVEMENTS.forEach((a) => {
      const spot = a.spot ?? ACHIEVEMENT_SPOTS[gridIdx++];
      const done = !!this.achievements[a.id];
      const cur = this.trophyMeshes[a.id];
      if (cur && cur.userData.done === done) return; // 状态没变就不重建
      if (cur) this.achievementHall.remove(cur);
      const m = createTrophyMesh(a, done);
      m.position.set(spot.x, 0, spot.z);
      m.userData.done = done;
      this.achievementHall.add(m);
      this.trophyMeshes[a.id] = m;
    });
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
  // 躺下：只是开启快进，时间照常一秒秒流过（见 SLEEP_SPEED 的说明）。
  // 以前这里是个 for 循环把 remain 一次性 tick 完，等于瞬移到天亮——
  // 坏天气当场消失、料理罐头杂交全部白嫖，睡一觉顶过所有等待。
  sleep() {
    if (this.sleeping) return false;
    const wasNight = this.isNight();
    const target = wasNight ? DAY_CYCLE : DAY_CYCLE / 2; // 时钟 0=早6点，600=晚6点
    this.sleeping = true;
    this.sleepWasNight = wasNight;
    // 直接记「还要走多少游戏秒」，免得判断时钟绕过 0 点
    this.sleepLeft = target - this.clock;
    this.sleepTotal = this.sleepLeft;
    this.onToast(wasNight ? '😴 睡下了，等天亮…' : '😴 午睡中，等天黑…');
    return true;
  }

  // 时钟走到目标点就自然醒；中途也能被叫醒（wakeUp(true)）
  wakeUp(early = false) {
    if (!this.sleeping) return;
    this.sleeping = false;
    this.onToast(early ? '🥱 被吵醒了…'
      : this.sleepWasNight ? '🌅 一觉睡到大天亮！' : '🌇 午觉睡醒，天都黑了');
    this.onWake();
    this.onState();
    this.save();
  }

  // 睡到几成了（UI 拿去画进度条）
  sleepProgress() {
    if (!this.sleeping || !this.sleepTotal) return 0;
    return Math.min(1, 1 - this.sleepLeft / this.sleepTotal);
  }

  /* ---------- 个人图鉴（图鉴大楼贵宾区） ---------- */

  buildGallerySlot(k) {
    const s = this.displaySlots[k];
    if (s.mesh) this.codexHall.remove(s.mesh);
    const g = new THREE.Group();
    g.add(createGalleryPedestal(!!s.item));
    if (s.item) {
      const info = keyInfo(s.item.key);
      // 花和杂交作物都没有 seed 字段，得各走各的模型，否则 info.seed.id 直接报错、整座台子都不见了
      let model;
      if (info.flower) {
        // 花带茎，比果实高是自然的，但别高过台座本身，不然头重脚轻
        model = createFlowerMesh(s.item.key.slice(2));
        model.scale.setScalar(0.95);
      } else if (info.hybrid) {
        model = createHybridCrop(s.item.key.slice(2));
        model.scale.setScalar(1.7);
      } else if (info.metal) {
        // 金属条也没有 seed 字段，一样得单独走，否则整座台子又不见了
        model = createMetalBar(info.metal, 1.9);
      } else if (info.wine) {
        // 酒同理——摆一瓶实体酒，瓶色跟酒窖里一样按原果身价分档
        model = createWineBottle(this.wineTint(keyInfo(info.wineSrc).price));
        model.scale.setScalar(2.2);
      } else {
        model = createPlantMesh(info.seed.id, 3);
        applyPlating(model, info.quality);
        model.scale.setScalar(1.9);
      }
      model.position.y = 1.56;
      g.add(model);
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
    // 杂交作物是玩家自己配出来的珍品，个人展台是它唯一的展示位（基础图鉴那 42 格照旧不收）
    if (key.startsWith('p:') || key.startsWith('k:') || key === EGG.key) { this.onToast('个人图鉴只摆作物本物～'); return false; }
    if (key.startsWith('x:')) { this.onToast('蔫了吧唧的就别摆出来了吧…'); return false; }
    if (key.startsWith('y:')) { this.onToast('打过药的不适合摆出来展示'); return false; }
    if (key.startsWith('s:')) { this.onToast('水产请养进水族馆，个人图鉴只摆田里的收成'); return false; }
    // 兜底白名单：能上台的就五类——作物本体、花、杂交、金属条、酒。
    // 不认识的新 key 一律先拒，免得摆上去没模型、整座台子隐形（花当年就是这么消失的）
    if (!key.startsWith('f:') && !key.startsWith('h:') && !key.startsWith('m:') && !key.startsWith('w:')
      && !seedById(key.split(':')[0])) { this.onToast('这个东西没法摆上展台'); return false; }
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
    if (key.startsWith('m:')) { this.onToast('金属条是分拣出来的，罐头装不下它'); return; }
    if (key.startsWith('s:')) { this.onToast('水产做不成罐头，卖掉或者养进水族馆吧'); return; }
    if (key === EGG.key) { this.onToast('恐龙虾卵可不能做成罐头！'); return; }
    if (key.startsWith('x:')) { this.onToast('生长不良的作物做不成罐头，贱卖了吧'); return; }
    if (key.startsWith('y:')) { this.onToast('打过药的只能直接卖，加工不了'); return; }
    if (key.startsWith('f:')) { this.onToast('花是拿来看的，装什么罐头'); return; }
    if (key.startsWith('w:')) { this.onToast('酒装进罐头就糟蹋了，直接卖吧'); return; }
    if (key.startsWith('g:')) { this.onToast('大厨的作品塞罐头里？出去'); return; }
    // 兜底白名单：上面的黑名单每加一种新前缀就得补一次，漏了就会产出
    // 「p:怪key」这种解析不了的罐头。不认识的一律拒收，宁可少装一罐
    if (!seedById(key.split(':')[0])) { this.onToast('这个东西做不成罐头'); return; }
    const need = WORKSHOP.ingredients;
    if ((this.inventory[key] ?? 0) < need) {
      this.onToast(`${need} 个才能加工成 1 个罐头，数量不够`);
      return;
    }
    this.inventory[key] -= need;
    if (this.inventory[key] <= 0) delete this.inventory[key];
    this.workshop[slot] = { key, readyAt: this.time + WORKSHOP.time * this.trainerRatio('workshop', slot) };
    const info = keyInfo(key);
    this.onToast(`${info.icon}${info.label} ×${need} 开始加工 ⏳${WORKSHOP.time / 60}分钟`);
    this.onState();
    this.save();
  }

  processCollect(slot) {
    const s = this.workshop[slot];
    if (!s || this.time < s.readyAt) return;
    const pkey = 'p:' + s.key;
    this.inventory[pkey] = (this.inventory[pkey] ?? 0) + 1;
    this.workshop[slot] = null;
    const wb = this.payTrainerBonus('workshop', slot);
    const info = keyInfo(pkey);
    this.onToast(`${info.icon} ${info.label}完成！放入背包` + (wb ? ` （熟练工 +${wb}💰）` : ''));
    sfx.play('done');
    this.onState();
    this.save();
  }

  shovelAt(idx) {
    const t = this.tiles[idx];
    if (t.plant) {
      const seed = seedById(t.plant.seedId);
      this.removePlant(t);
      this.onToast(`铲掉了${seed.name}`);
      sfx.play('shovel');
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
    sfx.play('shovel');
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
    sfx.play('unlock');
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
    this.onToast(`${t('toast.gotWater')}${tf(`water.name.${this.waterLevel}`, next.name)}！`);
    this.onState();
    this.save();
  }

  unlockSeed(seedId) {
    const seed = seedById(seedId);
    if (this.unlockedSeeds.includes(seedId)) return;
    if (!this.spend(seed.unlock)) return;
    this.unlockedSeeds.push(seedId);
    this.onToast(`${t('toast.gotWater')}${seed.emoji}${seedName(seed)}`);
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
    if (t.plant.sprayed) mesh.add(createSprayMark());
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
    this.rebuildHouse();
    this.rebuildRoomShell();
    this.refreshInterior();
    this.refreshCodex();
    this.refreshGallery();
    this.refreshPondDecors();
    this.refreshHybridStations();
    this.refreshPetRoom();
    this.refreshGreenhouse();
    this.refreshRanch();
    this.refreshShelf();
  }

  /* ---------- 主循环 ---------- */

  tick(dt) {
    if (this.paused) return; // 挂机中：时间、生长、加工全部冻结
    this.time += dt;
    // 花圃：花开的那一刻把花苞换成整朵花
    for (let i = 0; i < this.flowerPlots.length; i++) {
      const p = this.flowerPlots[i];
      if (p && !p._bloomed && this.time >= p.readyAt) { p._bloomed = true; this.refreshGreenhousePlot(i); }
    }
    const wrapped = this.clock + dt >= DAY_CYCLE;
    this.clock = (this.clock + dt) % DAY_CYCLE;
    if (wrapped) {
      this.dayCount += 1; // 黑市行情靠它翻牌（配合 isNight 就是半天一换）
      this.rollWeather(); // 每天早上 6 点掷天气骰子
      this.settleBank();  // 银行日结
      // 港湾：靠港日船出现、货单换新；第二天船开走
      const wasDocked = this.shipGroup?.visible;
      this.refreshShip();
      if (!wasDocked && this.shipDocked()) {
        this.onToast(tp('t.shipArrive', { n: HARBOR.slots }));
        sfx.play('done');
      }
    }

    // 昼夜切换提示
    const night = this.isNight();
    if (this._night === undefined) this._night = night;
    else if (night !== this._night) {
      this._night = night;
      this.onToast(night ? '🌙 夜幕降临，作物生长变慢了' : '☀️ 天亮啦，作物恢复生长');
    }

    // 牧场：长大的那一刻把幼崽换成成体
    for (let i = 0; i < this.ranchPens.length; i++) {
      const p = this.ranchPens[i];
      if (p && !p._grown && this.time >= p.readyAt) { p._grown = true; this.refreshRanchPen(i); }
    }
    // 牧场挂机收益：留在栏里的成年动物每分钟产一次
    const idleRate = this.ranchIdleRate();
    if (idleRate > 0) {
      this.ranchTimer += dt;
      if (this.ranchTimer >= RANCH_IDLE_TICK) {
        const payouts = Math.floor(this.ranchTimer / RANCH_IDLE_TICK);
        this.ranchTimer -= payouts * RANCH_IDLE_TICK;
        const got = idleRate * payouts;
        this.gain(got);
        this.onToast(tp('t.ranchIdle', { n: got }));
      }
    }

    // 参观客：每分钟按期望人数结算一次门票
    this.updateVisitors(dt);
    const vs = this.visitorStats();
    this.visitorTimer += dt;
    if (this.visitorTimer >= VISITOR.tick) {
      const rounds = Math.floor(this.visitorTimer / VISITOR.tick);
      this.visitorTimer -= rounds * VISITOR.tick;
      // rate 小于 1 时它就是「这一分钟来人的概率」——空屋 0.01 正好是玩家定的 1%。
      // 所以不能直接乘出小数取整，那样低珍稀度永远是 0，得掷骰子
      let people = 0;
      for (let k = 0; k < rounds; k++) {
        const whole = Math.floor(vs.rate);
        people += whole + (Math.random() < vs.rate - whole ? 1 : 0);
      }
      if (people > 0) {
        const got = people * vs.ticket;
        this.visitorTotal += got;
        this.gain(got);
        this.onToast(tp('t.visitor', { n: people, coin: got.toLocaleString() }));
        // 同屏放几个，别按人数全放出来——满装修一分钟 30 人，全放帧率就没了
        for (let k = 0; k < Math.min(people, VISITOR.maxOnScreen - this.visitors.length); k++) this.spawnVisitor();
      }
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

    // 中毒到点没解毒 → 死亡
    if (this.poisonUntil && this.time >= this.poisonUntil) this.die();
    // 复活
    if (this.deadUntil && this.time >= this.deadUntil) {
      this.deadUntil = 0;
      this.onToast('✨ 复活了！以后拍虫小心点');
      sfx.play('revive');
      this.onState();
      this.save();
    }

    // 睡眠倒计时：走完自然醒。dt 已经被主循环按 SLEEP_SPEED 放大过
    if (this.sleeping) {
      this.sleepLeft -= dt;
      if (this.sleepLeft <= 0) this.wakeUp();
    }

    this.tickFishing(dt);
    this.tickShelf();

    // 成就：每秒统一比对一次，省得在几十个动作里各插一遍钩子
    this._achTimer = (this._achTimer ?? 0) + dt;
    if (this._achTimer >= 1) { this._achTimer = 0; this.checkAchievements(); }

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
      v: SAVE_VERSION,
      coins: this.coins,
      waterLevel: this.waterLevel,
      unlockedSeeds: this.unlockedSeeds,
      inventory: this.inventory,
      savedAt: Date.now(),
      items: this.items,
      furniture: this.furniture,
      furnitureStyle: this.furnitureStyle,
      furniturePos: this.furniturePos,
      houseSkin: this.houseSkin,
      flowerPlots: this.flowerPlots.map(p => p ? { id: p.id, remain: Math.max(0, p.readyAt - this.time) } : null),
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
      aquarium: this.aquarium,
      sorter: this.sorter.map(s => s ? { key: s.key, remain: Math.max(0, s.readyAt - this.time) } : null),
      fishNets: this.fishNets.map(n => n ? { remain: Math.max(0, n.readyAt - this.time) } : null),
      cookSlots: this.cookSlots.map(s => s ? { id: s.id, remain: Math.max(0, s.readyAt - this.time) } : null),
      // 高级料理还要存下锅时定死的价钱，不然出锅就不知道值多少了
      towerLevel: this.towerLevel,
      harborSold: this.harborSold,
      trainer: this.trainer,
      harborOwned: this.harborOwned,
      harborPlaced: this.harborPlaced,
      harborDock: this.harborDock,
      advCookSlots: this.advCookSlots.map(s => s ? { id: s.id, price: s.price, remain: Math.max(0, s.readyAt - this.time) } : null),
      pondOwned: this.pondOwned,
      pondPlaced: this.pondPlaced,
      hybridSlots: this.hybridSlots.map(s => s ? { id: s.id, remain: Math.max(0, s.readyAt - this.time) } : null),
      petsOwned: this.petsOwned,
      petShown: this.petShown,
      petDecorsOwned: this.petDecorsOwned,
      petDecorStyle: this.petDecorStyle,
      clock: this.clock,
      windTimer: this.windTimer,
      ranchTimer: this.ranchTimer,
      visitorTimer: this.visitorTimer,
      visitorTotal: this.visitorTotal,
      butcher: this.butcher.map(b => b ? { key: b.key, remain: Math.max(0, b.readyAt - this.time) } : null),
      ranchPens: this.ranchPens.map(p => p ? { id: p.id, remain: Math.max(0, p.readyAt - this.time) } : null),
      dayCount: this.dayCount,
      weatherSeed: this.weatherSeed,
      shelf: this.shelf.map(b => b ? { keys: b.keys, price: b.price, remain: Math.max(0, b.soldAt - this.time) } : null),
      brewery: this.brewery.map(b => b ? { key: b.key, remain: Math.max(0, b.readyAt - this.time) } : null),
      cellar: this.cellar.map(c => c ? { key: c.key, agedDays: Math.max(0, this.dayCount - c.sinceDay) } : null),
      warehouse: this.warehouse,
      warehouseLevel: this.warehouseLevel,
      observatory: this.observatory ? (this.observatory.readyAt !== undefined
        ? { remain: Math.max(0, this.observatory.readyAt - this.time) }
        : { fromDay: this.observatory.fromDay }) : null,
      drought: this.drought,
      rain: this.rain,
      savedLayouts: this.savedLayouts,
      layoutSeq: this.layoutSeq,
      paused: this.paused,
      poisonLeft: Math.max(0, this.poisonUntil - this.time),
      deadLeft: Math.max(0, this.deadUntil - this.time),
      bank: this.bank,
      codex: this.codex,
      achievements: this.achievements,
    };
    // 比本机新的存档里会有这份代码不认识的字段（三台机器轮流开发时很常见：
    // 另一台加了繁荣塔/港湾，这台还没 pull）。原样带回去，否则老代码存一次
    // 就把新系统的进度整个抹掉——而且没有任何报错，等发现时已经晚了。
    // 已知字段一律以本次 data 为准，只有不认识的才从 _rawSave 里保留。
    const json = JSON.stringify({ ...this._rawSave, ...data });
    localStorage.setItem(SAVE_KEY, json);
    // 同步落盘备份（开发服务器提供 /__save；失败也不影响游戏）
    fetch('/__save', { method: 'POST', body: json }).catch(() => {});
  }

  load() {
    let data;
    try { data = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { /* 存档损坏则重新开始 */ }
    if (!data) return;
    // 原始存档留一份：save() 时把本版本不认识的字段原样写回去，别弄丢别人的进度
    this._rawSave = data;
    if ((data.v ?? 1) > SAVE_VERSION) {
      this._notices.push(`⚠️ 这份存档来自更新的版本（v${data.v}，本机 v${SAVE_VERSION}）。`
        + '本机不认识的内容会原样保留但显示不出来，建议先 git pull 再玩。');
    }
    data = migrateSave(data);
    this.coins = data.coins ?? START_COINS;
    this.waterLevel = data.waterLevel ?? 0;
    this.unlockedSeeds = data.unlockedSeeds ?? ['sweetpot', 'radish'];
    // 保底作物：老存档也要有红薯，否则金币归零会卡死
    if (!this.unlockedSeeds.includes('sweetpot')) this.unlockedSeeds.unshift('sweetpot');
    this.inventory = data.inventory ?? {};
    this.items = data.items ?? {};
    this.codex = data.codex ?? {};
    // 老存档修复：以前花能捐进图鉴，可 42 格里根本没有花的展位，
    // 结果花被扣掉、台子也不显示。把这类无效收录清掉，东西退回背包。
    Object.keys(this.codex).forEach(k => {
      if (this.codexKeys().includes(k)) return;
      delete this.codex[k];
      this.inventory[k] = (this.inventory[k] ?? 0) + 1;
      this._notices.push(`↩️ ${keyInfo(k).icon}${keyInfo(k).label}没有对应的收录台，已退回背包`);
    });
    this.furniture = data.furniture ?? { bed: 1 };
    if (!this.furniture.bed) this.furniture.bed = 1; // 床永远都在
    this.furnitureStyle = data.furnitureStyle ?? {};
    this.furniturePos = data.furniturePos ?? {};
    this.houseSkin = { ...DEFAULT_HOUSE_SKIN, ...(data.houseSkin ?? {}) };
    // 旧存档只有 lastLayout 的话，迁移成第一个已保存布局
    this.savedLayouts = data.savedLayouts
      ?? (data.lastLayout?.some(Boolean) ? [{ name: '上次布局', layout: data.lastLayout }] : []);
    this.layoutSeq = data.layoutSeq ?? this.savedLayouts.length;
    this.paused = data.paused ?? false;
    // 中毒/死亡倒计时：离线时间照常流逝
    const offPoison = (data.poisonLeft ?? 0) - (this.paused ? 0 : Math.max(0, (Date.now() - (data.savedAt ?? Date.now())) / 1000));
    const offDead = (data.deadLeft ?? 0) - (this.paused ? 0 : Math.max(0, (Date.now() - (data.savedAt ?? Date.now())) / 1000));
    this.poisonUntil = offPoison > 0 ? this.time + offPoison : 0;
    // 离线期间毒发了就直接进入（剩余的）死亡状态
    this.deadUntil = offDead > 0 ? this.time + offDead
      : (data.poisonLeft > 0 && offPoison <= 0 ? this.time + Math.max(0, POISON.reviveTime + offPoison) : 0);
    // 挂机状态下关的游戏，离线时间不生效
    const elapsed = this.paused ? 0 : Math.max(0, (Date.now() - (data.savedAt ?? Date.now())) / 1000);
    // 花圃：离线也照常开花（温室恒温，不受天气影响）
    this.flowerPlots = (data.flowerPlots ?? []).slice(0, GREENHOUSE_SLOTS).map(p =>
      p && flowerById(p.id) ? { id: p.id, readyAt: this.time + Math.max(0, (p.remain ?? 0) - elapsed) } : null);
    while (this.flowerPlots.length < GREENHOUSE_SLOTS) this.flowerPlots.push(null);
    // 天气种子要先于任何 weatherAt() 调用读出来。老存档没有就沿用本次随机的，
    // 下次保存时固化——已经过去的天气无从追溯，但往后是一致的
    this.weatherSeed = data.weatherSeed ?? this.weatherSeed;
    this.drought = data.drought ?? false;
    this.rain = data.rain ?? false;
    // 离线跨过了新的一天就重掷天气
    const offlineDays = Math.floor(((data.clock ?? 0) + elapsed) / DAY_CYCLE);
    // 天数要接着走，否则离线回来黑市行情会跳回旧值
    this.dayCount = (data.dayCount ?? 0) + offlineDays;
    if (offlineDays > 0) {
      // 离线跨天也走同一套确定性天气，否则回来看到的和预报对不上
      const w = this.weatherAt(this.dayCount);
      this.drought = w === 'drought';
      this.rain = w === 'rain';
      this._pendingHeal = true; // 隔了一天，之前的天灾都该消退了
      if (this.badWeather()) this._pendingDamage = true; // 地块数据还没读完，稍后再毁地
    }
    // 食品店：离线期间挂单照常倒计时。已经到点的不在这里直接给钱——
    // 留给 tick 里的 tickShelf 统一成交，省得入账逻辑写两份
    this.shelf = Array(GIFTBOX.slots).fill(null);
    (data.shelf ?? []).forEach((b, k) => {
      if (b && k < this.shelf.length) this.shelf[k] = { keys: b.keys, price: b.price, soldAt: this.time + Math.max(0, b.remain - elapsed) };
    });
    this.refreshShelf();
    // 酒庄：离线期间照常酿造；窖藏天数换算回 sinceDay
    this.brewery = Array(BREW.slots).fill(null);
    (data.brewery ?? []).forEach((b, k) => {
      if (b && k < this.brewery.length) this.brewery[k] = { key: b.key, readyAt: this.time + Math.max(0, b.remain - elapsed) };
    });
    this.cellar = Array(BREW.cellarSlots).fill(null);
    (data.cellar ?? []).forEach((c, k) => {
      if (c && k < this.cellar.length) this.cellar[k] = { key: c.key, sinceDay: this.dayCount - (c.agedDays ?? 0) };
    });
    this.refreshBrewery();
    // 仓库：老存档没有就是空的 1 级
    this.warehouse = data.warehouse ?? {};
    this.warehouseLevel = Math.min(WAREHOUSE.maxLevel, Math.max(1, data.warehouseLevel ?? 1));
    // 观测台：运行中的按剩余时间接着跑，已出的报告原样带回来
    this.observatory = null;
    if (data.observatory) {
      if (data.observatory.remain !== undefined) {
        this.observatory = { readyAt: this.time + Math.max(0, data.observatory.remain - elapsed) };
      } else if (data.observatory.fromDay !== undefined) {
        this.observatory = { fromDay: data.observatory.fromDay };
      }
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
    // 屠宰场：离线照常屠宰细分
    this.butcher = (data.butcher ?? []).slice(0, BUTCHER.slots).map(b =>
      b && b.key?.startsWith('a:') && animalById(b.key.slice(2))
        ? { key: b.key, readyAt: this.time + Math.max(0, (b.remain ?? 0) - elapsed) } : null);
    while (this.butcher.length < BUTCHER.slots) this.butcher.push(null);

    // 牧场：离线照常长大，成年后的那段时间也照付挂机收益（和风车一样最多算 12 小时）
    this.ranchTimer = data.ranchTimer ?? 0;
    // 参观客：离线期间照常有人来。逐分钟掷骰子没意义（也算不动），直接按期望值补，
    // 和牧场一样封顶 12 小时
    this.visitorTimer = data.visitorTimer ?? 0;
    this.visitorTotal = data.visitorTotal ?? 0;
    {
      const mins = Math.min(elapsed, VISITOR.offlineCap) / VISITOR.tick;
      const got = Math.floor(visitorIncome(this.visitorBreakdown().total) * mins);
      if (got > 0) {
        this.visitorTotal += got;
        this.coins += got;
        this._notices.push(`\u{1f3ab} 离线期间来了些参观客，门票收入 +${got.toLocaleString()}\u{1f4b0}`);
      }
    }
    this.ranchPens = (data.ranchPens ?? []).slice(0, RANCH_GRID * RANCH_GRID).map(p =>
      p && animalById(p.id) ? { id: p.id, readyAt: this.time + Math.max(0, (p.remain ?? 0) - elapsed) } : null);
    while (this.ranchPens.length < RANCH_GRID * RANCH_GRID) this.ranchPens.push(null);
    if (elapsed > 0) {
      const window = Math.min(elapsed, 43200);
      let earned = 0;
      (data.ranchPens ?? []).forEach(p => {
        if (!p || !animalById(p.id)) return;
        // 这一栏在离线窗口里「已成年」的秒数
        const matureSec = Math.max(0, window - (p.remain ?? 0));
        earned += animalById(p.id).idle * (matureSec / RANCH_IDLE_TICK);
      });
      if (earned > 0) this.coins += Math.floor(earned);
    }

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
    // 水族馆：老存档没有这个字段，留空即可
    this.aquarium = Array(AQUARIUM_SLOTS).fill(null);
    (data.aquarium ?? []).forEach((id, k) => {
      if (id && k < this.aquarium.length && seafoodById(id)) this.aquarium[k] = id;
    });
    this.refreshAquarium();
    // 分拣台：离线也照常分拣（老存档没有这个字段，留空即可）
    (data.sorter ?? []).forEach((s, k) => {
      if (s && k < this.sorter.length && this.sortableKey(s.key)) {
        this.sorter[k] = { key: s.key, readyAt: this.time + Math.max(0, s.remain - elapsed) };
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
    // 灶位：离线也照常炖着
    (data.cookSlots ?? []).forEach((s, k) => {
      if (s && k < this.cookSlots.length && dishById(s.id)) {
        this.cookSlots[k] = { id: s.id, readyAt: this.time + Math.max(0, s.remain - elapsed) };
      }
    });
    // 高级料理的大灶：同样离线照炖。老存档没这个字段，?? [] 兜住，
    // 价钱缺失就按现价补一个，免得出锅是 0 元
    // 繁荣塔：老存档没这个字段，缺省 0 级（小土堆）。
    // 读完必须重建一次，否则场景里还是初始化时那座 0 级土堆
    this.towerLevel = Math.max(0, Math.min(TOWER_MAX_LEVEL, Math.floor(data.towerLevel ?? 0)));
    this.rebuildTower();
    // 港湾：老存档没这两个字段，缺省空
    this.harborSold = data.harborSold ?? {};
    this.trainer = data.trainer ?? {};   // 老存档没这字段，全 0 级
    this.harborOwned = data.harborOwned ?? {};
    this.harborPlaced = (data.harborPlaced ?? []).filter(id => harborDecorById(id)).slice(0, HARBOR_MAX_PLACED);
    this.refreshHarborDecors();
    this.harborDock = data.harborDock ?? -1;
    this.refreshShip();
    (data.advCookSlots ?? []).forEach((s, k) => {
      if (s && k < this.advCookSlots.length && advDishById(s.id)) {
        this.advCookSlots[k] = {
          id: s.id,
          price: s.price ?? advDishPrice(advDishById(s.id)),
          readyAt: this.time + Math.max(0, s.remain - elapsed),
        };
      }
    });
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
    // 成就：先收回名不副实的，再静默补记已经做到的，最后立起奖杯。
    // 提示只报「收回后没立刻挣回来」的——当下就满足新条件的无缝换血，弹提示反而吓人
    this.achievements = data.achievements ?? {};
    const revokedOnLoad = this.revokeUnearned();
    this.checkAchievements(true);
    revokedOnLoad.filter(({ a }) => !this.achievements[a.id]).forEach(({ a, reason }) => this._notices.push(
      reason === 'rev' ? `🔒 「${a.name}」的达成条件改了——现在要${a.desc}，先收回，做到后会自动再亮`
        : reason === 'chain' ? `🔒 「${a.name}」因其中一项成就被收回而暂时不满足，凑齐后会自动再亮`
          : `🔒 「${a.name}」的目标提高到 ${a.max} 了，先收回，达到后会自动再亮`));
    this.refreshTrophies();
  }
}

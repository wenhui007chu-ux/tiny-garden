import * as THREE from 'three';
import { createScene } from './scene.js';
import { Game, SAVE_KEY } from './game.js';
import { UI } from './ui.js';
import { INTERIOR_POS, SLEEP_SPEED } from './config.js';
import { music, sfx } from './music.js';
import { applyStaticI18n } from './i18n.js';
import { startWatchdog } from './watchdog.js';
import { perf } from './perf.js';

// 点到任何一栋建筑都先来一声「开门」，省得在每个分支里各写一遍
const BUILDING_KEYS = ['workshop', 'mall', 'house', 'pond', 'bank', 'kitchen', 'gourmet',
  'hybridLab', 'petHouse', 'greenhouse', 'achievement', 'codex', 'sorter', 'aquarium', 'blackMarket', 'observatory', 'warehouse', 'brewery', 'foodshop', 'ranch', 'butcher'];

// 浏览器要求用户先互动才能出声：第一次点击/按键时启动音乐
['pointerdown', 'keydown'].forEach(ev =>
  window.addEventListener(ev, () => music.start(), { once: false }));

// 启动前先看硬盘备份：浏览器存档丢了或更旧时，用备份顶上
try {
  const r = await fetch('/__save');
  if (r.ok) {
    const backup = await r.json();
    const local = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null');
    if (backup?.savedAt && (!local || backup.savedAt > (local.savedAt ?? 0))) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(backup));
      console.info('[存档] 已从硬盘备份恢复');
    }
  }
} catch { /* 没有备份或非开发环境，用 localStorage 就好 */ }

applyStaticI18n(); // 先把静态文案按当前语言填好，再建场景
const { renderer, scene, camera, controls, ensureSize, lights } = createScene(document.getElementById('app'));
const game = new Game(scene);
const ui = new UI(game);
ui.attachCamera(camera, controls);
perf.attach(renderer, scene, lights);
perf.onAuto = (msg) => ui.toast(msg); // 自动升降档时告诉玩家一声

/* ---------- 拾取与交互 ---------- */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;
let downPos = null;
let dragging = null; // 布置模式下正在拖动的家具

// 屋内地面（家具就在这个平面上滑动）
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -INTERIOR_POS.y);

function setPointer(e) {
  pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
}

function pickFurniture(e) {
  setPointer(e);
  const hits = raycaster.intersectObjects(game.furnitureMeshes(), false);
  return hits.length ? hits[0].object.userData.furnitureId : null;
}

function floorPoint(e) {
  setPointer(e);
  const out = new THREE.Vector3();
  return raycaster.ray.intersectPlane(floorPlane, out) ? out : null;
}

function pickTile(e) {
  pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(
    [...game.tileMeshes(), ...game.slotMeshes(), ...game.workshopMeshes,
     ...game.mallMeshes, ...game.houseMeshes,
     ...game.pondMeshes, ...game.bankMeshes, ...game.codexMeshes,
     ...game.kitchenMeshes, ...game.gourmetMeshes, ...game.hybridLabMeshes, ...game.petHouseMeshes,
     ...game.greenhouseMeshes, ...game.achievementMeshes, ...game.sorterMeshes,
     ...game.aquariumMeshes, ...game.blackMarketMeshes, ...game.observatoryMeshes, ...game.warehouseMeshes, ...game.breweryMeshes, ...game.foodShopMeshes, ...game.ranchMeshes, ...game.butcherMeshes, ...game.signMeshes], false);
  return hits.length ? hits[0].object : null;
}

// 赤手拍虫：射线打到哪只虫子，返回它所在的地块序号
function pickPestTile(e) {
  setPointer(e);
  const bugs = [];
  for (const t of game.tiles) {
    if (!t.plant?.pest || !t.plant.mesh) continue;
    const bug = t.plant.mesh.children.find(c => c.userData.pestBug);
    if (bug) bugs.push({ idx: t.mesh.userData.tileIndex, bug });
  }
  if (!bugs.length) return null;
  const hits = raycaster.intersectObjects(bugs.map(b => b.bug), true);
  if (!hits.length) return null;
  let obj = hits[0].object;
  while (obj && !obj.userData.pestBug) obj = obj.parent;
  return bugs.find(b => b.bug === obj)?.idx ?? null;
}

renderer.domElement.addEventListener('pointermove', (e) => {
  // 布置模式：拖着家具在地板上滑
  if (dragging) {
    const p = floorPoint(e);
    if (p) game.setFurniturePos(dragging.id, p.x - INTERIOR_POS.x + dragging.dx, p.z - INTERIOR_POS.z + dragging.dz);
    return;
  }
  if (ui.inHouse && ui.editMode) {
    renderer.domElement.style.cursor = pickFurniture(e) ? 'grab' : 'default';
    return;
  }
  const hit = pickTile(e);
  // 名牌是 Sprite，材质上没有 emissive，照旧写会直接抛错
  if (hovered && hovered !== hit && hovered.material.emissive) hovered.material.emissive.setHex(0x000000);
  hovered = hit;
  if (hovered?.material.emissive) hovered.material.emissive.setHex(0x332200);
  renderer.domElement.style.cursor = hovered ? 'pointer' : 'default';
});

renderer.domElement.addEventListener('pointerdown', (e) => {
  // 布置模式下按住家具就开始拖
  if (ui.inHouse && ui.editMode) {
    const id = pickFurniture(e);
    const p = id ? floorPoint(e) : null;
    if (id && p) {
      const m = game.interiorFurniture[id];
      dragging = { id, dx: m.position.x - (p.x - INTERIOR_POS.x), dz: m.position.z - (p.z - INTERIOR_POS.z) };
      controls.enabled = false;
      renderer.domElement.style.cursor = 'grabbing';
      return;
    }
  }
  downPos = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('pointerup', (e) => {
  if (dragging) {
    game.save();
    dragging = null;
    controls.enabled = true;
    renderer.domElement.style.cursor = 'grab';
    return;
  }
  if (!downPos) return;
  const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
  downPos = null;
  if (moved > 6) return; // 拖动视角，不算点击
  if (game.paused) return; // 挂机中一切操作无效
  if (game.isDead()) return; // 死亡期间什么都干不了
  if (ui.inside()) return; // 屋里/馆里点不到菜园

  // 赤手拍虫：点到虫子就免费拍掉，优先级最高
  const pestIdx = pickPestTile(e);
  if (pestIdx !== null) { game.swatPest(pestIdx); return; }

  const hit = pickTile(e);
  if (!hit) return;

  if (BUILDING_KEYS.some(k => hit.userData[k])) sfx.play('open');

  // 工坊小屋：点击打开加工面板
  if (hit.userData.workshop) {
    ui.openWorkshop();
    return;
  }

  // 商场小楼：点击打开商场
  if (hit.userData.mall) {
    ui.openMall();
    return;
  }

  // 自己的房子：点击进屋
  if (hit.userData.house) {
    ui.openHouse();
    return;
  }

  // 水滩：点击打开抓鱼面板
  if (hit.userData.pond) {
    ui.openFishing();
    return;
  }

  // 黑房子银行：点击存取钱
  if (hit.userData.bank) {
    ui.openBank();
    return;
  }

  // 料理工坊：点击打开料理面板
  if (hit.userData.kitchen) {
    ui.openKitchen();
    return;
  }

  // 高级料理工坊：点击打开大灶面板
  if (hit.userData.gourmet) {
    ui.openGourmet();
    return;
  }

  // 杂交室：点击打开合成面板
  if (hit.userData.hybridLab) {
    ui.openHybrid();
    return;
  }

  // 宠物间：点击进屋
  if (hit.userData.petHouse) {
    ui.openPetRoom();
    return;
  }

  // 花房温室：点击进花房
  if (hit.userData.greenhouse) {
    ui.openGreenhouse();
    return;
  }

  // 成就殿堂：点击进展厅
  if (hit.userData.achievement) {
    ui.openAchievement();
    return;
  }

  // 图鉴大楼：点击进馆
  if (hit.userData.codex) {
    ui.openCodex();
    return;
  }

  // 食品店：点击进后堂
  if (hit.userData.foodshop) {
    ui.openFoodShop();
    return;
  }

  // 酒庄：点击进酒窖
  if (hit.userData.brewery) {
    ui.openBrewery();
    return;
  }

  // 仓库：点击开存取面板
  if (hit.userData.warehouse) {
    ui.openWarehouse();
    return;
  }

  // 天气观测台：点击开预报面板
  if (hit.userData.observatory) {
    ui.openObservatory();
    return;
  }

  // 黑市：点击开交易面板
  if (hit.userData.blackMarket) {
    ui.openBlackMarket();
    return;
  }

  // 水族馆：点击进馆
  if (hit.userData.aquarium) {
    ui.openAquarium();
    return;
  }

  // 屠宰场：点击开面板
  if (hit.userData.butcher) {
    ui.openButcher();
    return;
  }

  // 牧场：点栏位——成年的直接收走，空栏/幼崽则打开面板挑幼崽
  if (hit.userData.penIndex !== undefined) {
    const pen = game.ranchPens[hit.userData.penIndex];
    if (pen && game.time >= pen.readyAt) game.collectAnimal(hit.userData.penIndex);
    else ui.openRanch();
    return;
  }
  // 牧场围栏/招牌：点开面板
  if (hit.userData.ranch) {
    ui.openRanch();
    return;
  }

  // 分拣台：点击打开分拣面板
  if (hit.userData.sorter) {
    ui.openSorter();
    return;
  }

  // 装饰台：只认摆放和铲除
  if (hit.userData.slotIndex !== undefined) {
    const k = hit.userData.slotIndex;
    if (ui.tool === 'decor' && ui.selectedDecor) game.placeDecorAtSlot(k, ui.selectedDecor);
    else if (ui.tool === 'shovel') game.shovelSlot(k);
    else if (game.decorSlots[k].decor === null) ui.toast('这是装饰台，去商场买装饰来摆吧');
    return;
  }

  const idx = hit.userData.tileIndex;
  const t = game.tiles[idx];

  // 未解锁的地：点一下就开垦
  if (t.locked) {
    game.unlockTile(idx);
    return;
  }

  switch (ui.tool) {
    case 'hand':
      if (t.plant) game.harvestAt(idx);
      break;
    case 'plant':
      if (t.plant?.stage === 3) game.harvestAt(idx); // 种植模式下点成熟作物也直接收
      else game.plantAt(idx, ui.selectedSeed);
      break;
    case 'water':
      game.waterAt(idx);
      break;
    case 'spray':
      game.sprayAt(idx);
      break;
    case 'shovel':
      game.shovelAt(idx);
      break;
    case 'soil':
      game.upgradeSoilAt(idx, ui.selectedSoil);
      break;
    case 'decor':
      if (ui.selectedDecor) game.placeDecorAt(idx, ui.selectedDecor);
      break;
  }
});

/* ---------- 主循环 ---------- */

const clock = new THREE.Clock();
const signPos = new THREE.Vector3(); // 名牌距离补偿的临时向量，别每帧新建
const DAY_BG = new THREE.Color(0xfdf3e3);
const NIGHT_BG = new THREE.Color(0x2b3050);
const DROUGHT_BG = new THREE.Color(0xf6ddb0); // 旱天泛黄的天色
const RAIN_BG = new THREE.Color(0x97a5b8);    // 暴雨的灰蓝天色

// 暴雨的雨点粒子
const RAIN_COUNT = 1200;
const rainPos = new Float32Array(RAIN_COUNT * 3);
for (let k = 0; k < RAIN_COUNT; k++) {
  rainPos[k * 3] = (Math.random() - 0.5) * 64;
  rainPos[k * 3 + 1] = Math.random() * 26;
  rainPos[k * 3 + 2] = (Math.random() - 0.5) * 64;
}
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainDrops = new THREE.Points(rainGeo, new THREE.PointsMaterial({
  color: 0xaec8e8, size: 0.16, transparent: true, opacity: 0.75,
}));
rainDrops.visible = false;
scene.add(rainDrops);

// 大旱天的三个太阳
const suns = new THREE.Group();
[[-6, 13, -11, 1.1], [0, 15.5, -13, 1.5], [6, 12.5, -11, 1.1]].forEach(([x, y, z, r]) => {
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(r, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffb830 })
  );
  sun.position.set(x, y, z);
  suns.add(sun);
});
suns.visible = false;
scene.add(suns);

// 这些 userData 标记意味着「这个对象每帧要动」，其余的一律不用管
const ANIM_KEYS = ['bob', 'spin', 'windmill', 'gear', 'sorterDrum', 'signBaseY',
  'sorterLamp', 'lampLight', 'houseWindow', 'giftBox', 'brewBubble', 'pondAnim',
  'petIdle', 'pestBug', 'flame', 'lampBulb', 'aquaFish', 'ranchAnimal'];
let animList = [];
let animAcc = 999; // 首帧就建一次

function refreshAnimList(dt) {
  animAcc += dt;
  if (animAcc < 0.5) return;
  animAcc = 0;
  animList = [];
  game.group.traverse(obj => {
    const u = obj.userData;
    for (const k of ANIM_KEYS) {
      if (u[k] !== undefined && u[k] !== false) { animList.push(obj); return; }
    }
  });
  // 光源清单也顺带跟着刷新，新盖的建筑带的灯才会纳入裁剪
  perf.collectLights(game.group, THREE);
}

function animate() {
  requestAnimationFrame(animate);
  let dt = Math.min(clock.getDelta(), 0.1);
  // 睡觉时把时间按倍速快进：tick 照常跑，天气/作物/加工都按正常规则推进，
  // 只是流逝得快，不再是一瞬间跳到天亮
  if (game.sleeping) dt *= SLEEP_SPEED;
  ensureSize();
  game.tick(dt);
  controls.update();

  const t = game.time;
  const f = game.dayFactor();
  // 场景后期有 3800+ 对象，但真正需要每帧动的只有 200 出头。
  // 全量 traverse 是纯浪费，改成缓存一份「会动的」清单，每 0.5 秒重建一次
  // （新盖的建筑/新种的作物最迟半秒后开始动，肉眼看不出来）
  refreshAnimList(dt);
  for (const obj of animList) {
    if (obj.userData.bob) {
      const s = (1 + Math.sin(t * 5 + obj.position.x * 3) * 0.05)
        * (game.badWeather() && obj.userData.plantRoot ? 0.85 : 1); // 恶劣天气作物缩水一圈
      obj.scale.set(s, s, s);
    }
    if (obj.userData.spin) obj.rotation.y = t * 1.2;
    if (obj.userData.windmill) obj.rotation.z = t * 3; // 风力发电，转起来
    if (obj.userData.gear && game.processingCount() > 0) obj.rotation.x = t * 2.5; // 加工时齿轮转动
    if (obj.userData.sorterDrum && game.sortingCount() > 0) obj.rotation.x = t * 2; // 分拣时滚筒转动
    if (obj.userData.signBaseY !== undefined) {                                     // 建筑名牌轻轻上下浮
      obj.position.y = obj.userData.signBaseY + Math.sin(t * 1.5 + obj.id) * 0.07;
      // 距离补偿：屏幕上大小大致恒定，镜头拉近不糊脸、拉远也读得清
      const d = camera.position.distanceTo(obj.getWorldPosition(signPos));
      const k = Math.min(1.9, Math.max(0.5, d / 22));
      obj.scale.set(obj.userData.signW * k, obj.userData.signH * k, 1);
    }
    if (obj.userData.sorterLamp !== undefined) {                                    // 分拣位指示灯：忙黄闲绿，好了就闪
      const s = game.sorter[obj.userData.sorterLamp];
      const done = s && game.time >= s.readyAt;
      obj.material.emissive.setHex(done ? 0xf2c94c : s ? 0xc98a12 : 0x2a8a5a);
      obj.material.emissiveIntensity = done ? 0.5 + Math.sin(t * 5) * 0.35 : 0.5;
    }
    if (obj.userData.lampLight) obj.intensity = (1 - f) * 0.9;               // 小灯夜里才亮
    if (obj.userData.houseWindow) {                                          // 夜里窗户透暖光
      obj.material.emissive.setHex(0xffc94a);
      obj.material.emissiveIntensity = (1 - f) * 0.85;
    }
    if (obj.userData.giftBox) {   // 货架上的礼盒轻轻上下浮
      obj.position.y = 0.51 + Math.sin(t * 1.6 + obj.parent.position.x) * 0.06;
    }
    if (obj.userData.brewBubble) {   // 酿造中的气泡往上飘，飘到顶就淡出重来
      const rise = (t * 0.5) % 0.6;
      obj.position.y = 1.85 + rise;
      obj.children.forEach(b => { b.material.opacity = 0.65 - rise * 0.9; });
    }
    if (obj.userData.scopeSpin) obj.rotation.y = Math.sin(t * 0.25) * 0.8; // 望远镜缓慢扫视
    if (obj.userData.sprayMark) obj.position.y = 0.82 + Math.sin(t * 2.2 + obj.id) * 0.05; // 药瓶轻轻浮
    if (obj.userData.tankSwim) {                                                    // 缸里的水产来回游
      obj.position.x = Math.sin(t * 0.8 + obj.id) * 0.22;
      obj.position.y = 0.8 + Math.sin(t * 1.3 + obj.id) * 0.08;
      obj.rotation.y = Math.cos(t * 0.8 + obj.id) > 0 ? 0 : Math.PI;
    }
    if (obj.userData.pestBug) {                                              // 虫子绕着作物打转
      obj.rotation.y = t * 1.6;
      obj.position.y = 0.75 + Math.sin(t * 3 + obj.id) * 0.06;
    }
    if (obj.userData.petIdle) {                                              // 展示台上的宠物轻轻晃动
      obj.position.y = 0.35 + Math.sin(t * 1.6) * 0.035;
      obj.rotation.y = Math.sin(t * 0.4) * 0.5;
    }
    if (obj.userData.pondAnim) {                                             // 水塘装饰的动法
      const a = obj.userData.pondAnim;
      if (a.type === 'circle') {                                             // 绕塘游，头朝前进方向
        const ang = t * a.speed + a.phase;
        obj.position.x = a.cx + Math.cos(ang) * a.radius;
        obj.position.z = a.cz + Math.sin(ang) * a.radius;
        obj.position.y = a.y + Math.sin(t * 2 + a.phase) * 0.03;
        obj.rotation.y = -ang - Math.PI;
      } else if (a.type === 'hover') {                                       // 空中小圈盘旋
        const ang = t * a.speed + a.phase;
        obj.position.x = a.cx + Math.cos(ang) * a.radius;
        obj.position.z = a.cz + Math.sin(ang) * a.radius;
        obj.position.y = a.y + Math.sin(t * 3.5 + a.phase) * 0.12;
        obj.rotation.y = -ang - Math.PI / 2;
      } else {                                                               // 水面漂浮摇晃
        obj.position.y = a.y + Math.sin(t * a.speed + a.phase) * 0.05;
        obj.rotation.z = Math.sin(t * a.speed * 0.7 + a.phase) * 0.06;
        obj.rotation.y = Math.sin(t * 0.3 + a.phase) * 0.3;
      }
    }
    if (obj.userData.flame) {                                                // 炉火/烛火摇曳
      obj.scale.set(1 + Math.sin(t * 11) * 0.12, 1 + Math.sin(t * 14 + 1) * 0.2, 1 + Math.cos(t * 9) * 0.12);
      obj.material.emissiveIntensity = 1 + Math.sin(t * 13) * 0.3;
    }
    if (obj.userData.lampBulb) obj.material.emissiveIntensity = 0.3 + (1 - f) * 1.2;
  }

  // 死亡期间连视角都不能转
  controls.enabled = !game.isDead() && !dragging;

  // 昼夜光照渐变（暴雨时天光压暗）
  const gloom = game.rain ? 0.55 : 1;
  lights.sun.intensity = (0.25 + 1.35 * f) * gloom;
  lights.ambient.intensity = (0.35 + 0.4 * f) * (game.rain ? 0.8 : 1);
  lights.fill.intensity = 0.15 + 0.25 * f;
  const bg = NIGHT_BG.clone().lerp(game.drought ? DROUGHT_BG : game.rain ? RAIN_BG : DAY_BG, f);
  scene.background.copy(bg);
  scene.fog.color.copy(bg);
  suns.visible = game.drought && f > 0.05; // 三个太阳只在旱天的白昼高挂

  // 暴雨：雨点下落（低画质只算前一部分粒子，省下的循环很可观）
  rainDrops.visible = game.rain;
  if (game.rain) {
    const p = rainGeo.attributes.position.array;
    const n = Math.min(RAIN_COUNT, perf.cfg.rain);
    rainGeo.setDrawRange(0, n);
    for (let k = 0; k < n; k++) {
      p[k * 3 + 1] -= dt * 24;
      if (p[k * 3 + 1] < -0.5) p[k * 3 + 1] = 24 + Math.random() * 3;
    }
    rainGeo.attributes.position.needsUpdate = true;
  }

  perf.tick(dt, camera); // 统计帧率、按档位裁剪装饰光源
  renderer.render(scene, camera);
}
animate();

setInterval(() => game.save(), 10000);
window.__debug = { renderer, scene, camera, game, ui, music, sfx, perf };

startWatchdog(game); // 服务器掉线时提示并自动重连
window.addEventListener('beforeunload', () => game.save());

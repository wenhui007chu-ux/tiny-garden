import * as THREE from 'three';
import { createScene } from './scene.js';
import { Game, SAVE_KEY } from './game.js';
import { UI } from './ui.js';
import { INTERIOR_POS } from './config.js';

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

const { renderer, scene, camera, controls, ensureSize, lights } = createScene(document.getElementById('app'));
const game = new Game(scene);
const ui = new UI(game);
ui.attachCamera(camera, controls);

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
     ...game.displayMeshes(), ...game.mallMeshes, ...game.houseMeshes,
     ...game.pondMeshes, ...game.bankMeshes, ...game.codexMeshes], false);
  return hits.length ? hits[0].object : null;
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
  if (hovered && hovered !== hit) hovered.material.emissive.setHex(0x000000);
  hovered = hit;
  if (hovered) hovered.material.emissive.setHex(0x332200);
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
  if (ui.inside()) return; // 屋里/馆里点不到菜园
  const hit = pickTile(e);
  if (!hit) return;

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

  // 图鉴大楼：点击进馆
  if (hit.userData.codex) {
    ui.openCodex();
    return;
  }

  // 展示台：空台选作物摆上去，有东西点击收回
  if (hit.userData.displayIndex !== undefined) {
    const k = hit.userData.displayIndex;
    if (game.displaySlots[k].item) game.takeDisplay(k);
    else ui.openDisplayChooser(k);
    return;
  }

  // 装饰台：只认摆放和铲除
  if (hit.userData.slotIndex !== undefined) {
    const k = hit.userData.slotIndex;
    if (ui.tool === 'decor' && ui.selectedDecor) game.placeDecorAtSlot(k, ui.selectedDecor);
    else if (ui.tool === 'shovel') game.shovelSlot(k);
    else if (game.decorSlots[k].decor === null) ui.toast('这是装饰台，去商店买装饰来摆吧');
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

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);
  ensureSize();
  game.tick(dt);
  controls.update();

  const t = game.time;
  const f = game.dayFactor();
  game.group.traverse(obj => {
    if (obj.userData.bob) {
      const s = (1 + Math.sin(t * 5 + obj.position.x * 3) * 0.05)
        * (game.badWeather() && obj.userData.plantRoot ? 0.85 : 1); // 恶劣天气作物缩水一圈
      obj.scale.set(s, s, s);
    }
    if (obj.userData.spin) obj.rotation.y = t * 1.2;
    if (obj.userData.windmill) obj.rotation.z = t * 3; // 风力发电，转起来
    if (obj.userData.gear && game.processingCount() > 0) obj.rotation.x = t * 2.5; // 加工时齿轮转动
    if (obj.userData.lampLight) obj.intensity = (1 - f) * 0.9;               // 小灯夜里才亮
    if (obj.userData.houseWindow) {                                          // 夜里窗户透暖光
      obj.material.emissive.setHex(0xffc94a);
      obj.material.emissiveIntensity = (1 - f) * 0.85;
    }
    if (obj.userData.pestBug) {                                              // 虫子绕着作物打转
      obj.rotation.y = t * 1.6;
      obj.position.y = 0.75 + Math.sin(t * 3 + obj.id) * 0.06;
    }
    if (obj.userData.flame) {                                                // 炉火/烛火摇曳
      obj.scale.set(1 + Math.sin(t * 11) * 0.12, 1 + Math.sin(t * 14 + 1) * 0.2, 1 + Math.cos(t * 9) * 0.12);
      obj.material.emissiveIntensity = 1 + Math.sin(t * 13) * 0.3;
    }
    if (obj.userData.lampBulb) obj.material.emissiveIntensity = 0.3 + (1 - f) * 1.2;
  });

  // 昼夜光照渐变（暴雨时天光压暗）
  const gloom = game.rain ? 0.55 : 1;
  lights.sun.intensity = (0.25 + 1.35 * f) * gloom;
  lights.ambient.intensity = (0.35 + 0.4 * f) * (game.rain ? 0.8 : 1);
  lights.fill.intensity = 0.15 + 0.25 * f;
  const bg = NIGHT_BG.clone().lerp(game.drought ? DROUGHT_BG : game.rain ? RAIN_BG : DAY_BG, f);
  scene.background.copy(bg);
  scene.fog.color.copy(bg);
  suns.visible = game.drought && f > 0.05; // 三个太阳只在旱天的白昼高挂

  // 暴雨：雨点下落
  rainDrops.visible = game.rain;
  if (game.rain) {
    const p = rainGeo.attributes.position.array;
    for (let k = 0; k < RAIN_COUNT; k++) {
      p[k * 3 + 1] -= dt * 24;
      if (p[k * 3 + 1] < -0.5) p[k * 3 + 1] = 24 + Math.random() * 3;
    }
    rainGeo.attributes.position.needsUpdate = true;
  }

  renderer.render(scene, camera);
}
animate();

setInterval(() => game.save(), 10000);
window.__debug = { renderer, scene, camera, game, ui };
window.addEventListener('beforeunload', () => game.save());

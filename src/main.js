import * as THREE from 'three';
import { createScene } from './scene.js';
import { Game, SAVE_KEY } from './game.js';
import { UI } from './ui.js';

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

/* ---------- 拾取与交互 ---------- */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;
let downPos = null;

function pickTile(e) {
  pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(
    [...game.tileMeshes(), ...game.slotMeshes(), ...game.workshopMeshes,
     ...game.displayMeshes(), ...game.mallMeshes, ...game.houseMeshes], false);
  return hits.length ? hits[0].object : null;
}

renderer.domElement.addEventListener('pointermove', (e) => {
  const hit = pickTile(e);
  if (hovered && hovered !== hit) hovered.material.emissive.setHex(0x000000);
  hovered = hit;
  if (hovered) hovered.material.emissive.setHex(0x332200);
  renderer.domElement.style.cursor = hovered ? 'pointer' : 'default';
});

renderer.domElement.addEventListener('pointerdown', (e) => { downPos = { x: e.clientX, y: e.clientY }; });

renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downPos) return;
  const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
  downPos = null;
  if (moved > 6) return; // 拖动视角，不算点击
  if (game.paused) return; // 挂机中一切操作无效
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
        * (game.drought && obj.userData.plantRoot ? 0.85 : 1); // 旱天作物缩水一圈
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
    if (obj.userData.lampBulb) obj.material.emissiveIntensity = 0.3 + (1 - f) * 1.2;
  });

  // 昼夜光照渐变
  lights.sun.intensity = 0.25 + 1.35 * f;
  lights.ambient.intensity = 0.35 + 0.4 * f;
  lights.fill.intensity = 0.15 + 0.25 * f;
  const bg = NIGHT_BG.clone().lerp(game.drought ? DROUGHT_BG : DAY_BG, f);
  scene.background.copy(bg);
  scene.fog.color.copy(bg);
  suns.visible = game.drought && f > 0.05; // 三个太阳只在旱天的白昼高挂

  renderer.render(scene, camera);
}
animate();

setInterval(() => game.save(), 10000);
window.__debug = { renderer, scene, camera, game, ui };
window.addEventListener('beforeunload', () => game.save());

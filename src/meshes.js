import * as THREE from 'three';
import { GRID, TILE, UPPER_Y, UPPER_Z, LAWN_R } from './config.js';

const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, flatShading: true, ...opts });

function mesh(geo, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

const GREEN = 0x5ea25a;
const DARKGREEN = 0x3f7c3c;
const WOOD = 0xb98a5a;

/* ================= 玩具盒 ================= */

export function createToyBox() {
  const g = new THREE.Group();
  const half = (GRID * TILE) / 2;
  const wallH = 0.55, wallT = 0.35, out = half + wallT / 2 + 0.05;
  const woodMat = mat(0xc79a66);

  // 盒底
  const floor = mesh(new THREE.BoxGeometry(GRID + 1.2, 0.5, GRID + 1.2), mat(0xb2854f), 0, -0.25, 0);
  g.add(floor);

  // 四面盒壁
  const wallGeoX = new THREE.BoxGeometry(GRID + 1.2, wallH, wallT);
  const wallGeoZ = new THREE.BoxGeometry(wallT, wallH, GRID + 1.2);
  g.add(mesh(wallGeoX, woodMat, 0, wallH / 2, -out));
  g.add(mesh(wallGeoX, woodMat, 0, wallH / 2, out));
  g.add(mesh(wallGeoZ, woodMat, -out, wallH / 2, 0));
  g.add(mesh(wallGeoZ, woodMat, out, wallH / 2, 0));

  // 后方的承重墙：撑起二层农田
  const wallW = GRID + 1.2;
  const back = mesh(new THREE.BoxGeometry(wallW, UPPER_Y, 0.6), mat(0xb2854f), 0, UPPER_Y / 2, -out);
  g.add(back);
  // 墙面砖纹
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      const brick = mesh(new THREE.BoxGeometry(1.1, 0.5, 0.08), mat(r % 2 ? 0xc79a66 : 0xbe8f5c),
        (c - 2) * 1.25 + (r % 2 ? 0.3 : 0), 0.85 + r * 0.85, -out - 0.34);
      g.add(brick);
    }
  }

  // 盒外一大片草地台面，留足了盖新建筑的地方
  const lawn = mesh(new THREE.CylinderGeometry(LAWN_R, LAWN_R * 1.04, 0.5, 14), mat(0x8fc177), 0, -0.76, 0);
  g.add(lawn);

  return g;
}

/* ================= 二层农田的平台 ================= */

export function createUpperDeck() {
  const g = new THREE.Group();
  const size = GRID + 1.2, wallH = 0.55, wallT = 0.35;
  const out = size / 2 - wallT / 2;
  const woodMat = mat(0xc79a66);

  // 平台底板
  g.add(mesh(new THREE.BoxGeometry(size, 0.5, size), mat(0xb2854f), 0, -0.25, 0));
  // 四周矮墙
  const gx = new THREE.BoxGeometry(size, wallH, wallT);
  const gz = new THREE.BoxGeometry(wallT, wallH, size);
  g.add(mesh(gx, woodMat, 0, wallH / 2, -out));
  g.add(mesh(gx, woodMat, 0, wallH / 2, out));
  g.add(mesh(gz, woodMat, -out, wallH / 2, 0));
  g.add(mesh(gz, woodMat, out, wallH / 2, 0));
  // 后方两根支柱撑住悬空的一边
  [-2.6, 2.6].forEach(x => g.add(mesh(
    new THREE.BoxGeometry(0.5, UPPER_Y, 0.5), mat(0x9a6a4a), x, -UPPER_Y / 2 - 0.3, -size / 2 + 0.4)));

  g.position.set(0, UPPER_Y, UPPER_Z);
  return g;
}

/* ================= 连接两层的木梯 ================= */

export function createLadder() {
  const g = new THREE.Group();
  const woodMat = mat(0x8a5a2b);
  const H = 5;   // 先在本地坐标里立直：底端在原点，顶端在 y=H
  // 两根扶手
  [-0.42, 0.42].forEach(x =>
    g.add(mesh(new THREE.BoxGeometry(0.13, H, 0.13), woodMat, x, H / 2, 0)));
  // 横档：等间距爬满两根扶手之间
  const rungs = 7, step = (H - 0.7) / (rungs - 1);
  for (let k = 0; k < rungs; k++) {
    g.add(mesh(new THREE.BoxGeometry(0.96, 0.1, 0.15), woodMat, 0, 0.45 + k * step, 0));
  }
  // 整体靠在二层平台右侧边缘：底端落在草地上，顶端刚好够到台面
  g.position.set(4.6, -0.51, -5.4);
  g.rotation.z = 0.22;
  return g;
}

/* ================= 工坊小屋 ================= */

export function createWorkshop() {
  const g = new THREE.Group();
  // 主体
  g.add(mesh(new THREE.BoxGeometry(2.4, 1.5, 2), mat(0xf3e2c0), 0, 0.75, 0));
  // 四棱锥屋顶
  const roof = mesh(new THREE.ConeGeometry(1.9, 1.1, 4), mat(0xd9534f), 0, 2.05, 0);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  // 烟囱
  g.add(mesh(new THREE.BoxGeometry(0.3, 0.7, 0.3), mat(0x9a6a4a), 0.6, 2.2, -0.4));
  // 面向菜园的门和窗
  g.add(mesh(new THREE.BoxGeometry(0.06, 0.85, 0.6), mat(0x8a5a2b), -1.21, 0.42, 0.3));
  g.add(mesh(new THREE.BoxGeometry(0.06, 0.45, 0.45), mat(0xbfe3f0), -1.21, 0.85, -0.55));
  // 会转的齿轮招牌（加工时转动）
  const gear = mesh(new THREE.TorusGeometry(0.24, 0.09, 6, 8), mat(0xf2c94c), -1.28, 1.45, 0.3);
  gear.rotation.y = Math.PI / 2;
  gear.userData.gear = true;
  g.add(gear);
  g.traverse(o => { if (o.isMesh) o.userData.workshop = true; });
  return g;
}

/* ================= 土地格 ================= */

export function createTileMesh() {
  const geo = new THREE.BoxGeometry(TILE * 0.92, 0.22, TILE * 0.92);
  const m = new THREE.Mesh(geo, mat(0x9a7355));
  m.position.y = 0.11;
  m.receiveShadow = true;
  m.castShadow = true;
  return m;
}

// 干裂地块的裂纹（贴在地块表面）
export function createCrackMesh() {
  const g = new THREE.Group();
  const crackMat = mat(0x3a2a1e);
  [[0, 0, 0.7, 0.5], [-0.18, 0.12, 0.45, 1.7], [0.2, -0.1, 0.4, 2.4], [0.05, 0.22, 0.35, 1.1], [-0.1, -0.25, 0.38, 0.2]].forEach(([x, z, len, rot]) => {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(len, 0.02, 0.045), crackMat);
    seg.position.set(x, 0.12, z);
    seg.rotation.y = rot;
    g.add(seg);
  });
  g.userData.damage = true;
  return g;
}

// 水泡地块的半透明水层
export function createWetLayer() {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(TILE * 0.9, 0.05, TILE * 0.9),
    new THREE.MeshStandardMaterial({
      color: 0x5aa8e0, transparent: true, opacity: 0.5,
      roughness: 0.2, emissive: 0x1a4a70, emissiveIntensity: 0.25,
    })
  );
  m.position.y = 0.15;
  m.userData.damage = true;
  return m;
}

// 虫害标记：一只在作物上方打转的小虫子
export function createPestBug() {
  const g = new THREE.Group();
  const body = mat(0x5a7a2a);
  [[0, 0.11], [0.13, 0.1], [-0.13, 0.09]].forEach(([x, r]) =>
    g.add(mesh(new THREE.SphereGeometry(r, 6, 5), body, x, 0, 0)));
  // 触角
  [[-0.2, 0.05], [-0.2, -0.05]].forEach(([x, z]) => {
    const a = mesh(new THREE.BoxGeometry(0.11, 0.02, 0.02), mat(0x3a4a18), x - 0.04, 0.06, z);
    a.rotation.z = 0.5;
    g.add(a);
  });
  // 背上的斑点
  [[0.05, 0.06], [0.16, -0.05]].forEach(([x, z]) =>
    g.add(mesh(new THREE.SphereGeometry(0.035, 5, 4), mat(0xd94a3a), x, 0.08, z)));
  // 隐形的大拾取热区，方便点中拍虫
  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 6, 5),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  g.add(hit);
  g.position.y = 0.75;
  g.userData.pestBug = true;
  return g;
}

// 未解锁地块的绿色边框
export function createLockEdge() {
  const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(TILE * 0.96, 0.26, TILE * 0.96));
  const line = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x4ce05a }));
  line.userData.lockEdge = true;
  return line;
}

export function tilePos(i, j, level = 0) {
  const half = (GRID - 1) / 2;
  return {
    x: (i - half) * TILE,
    y: level === 1 ? UPPER_Y + 0.11 : 0.11,
    z: (j - half) * TILE + (level === 1 ? UPPER_Z : 0),
  };
}

/* ================= 装饰台（盒子四周的草地上） ================= */

export const DECOR_SLOTS = 10;

export function createDecorSlotMesh() {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.5, 0.18, 8),
    mat(0xd8b98a)
  );
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function decorSlotPos(k) {
  // 前方弧线排开：半径要大于盒子对角(约4.75)才不会嵌进农田，
  // 角度收在 ±78° 内以避开左侧展示区和右侧工坊
  const a = ((-78 + (156 / (DECOR_SLOTS - 1)) * k) * Math.PI) / 180;
  const r = 6;
  return { x: Math.sin(a) * r, z: Math.cos(a) * r };
}

/* ================= 图鉴大楼 ================= */

export function createCodexBuilding() {
  const g = new THREE.Group();
  const stone = mat(0xefe6d4);
  const gold = mat(0xf2c94c, { roughness: 0.35 });
  // 台阶
  [[3.9, 0.2, 0], [3.5, 0.2, 0.22], [3.1, 0.2, 0.44]].forEach(([w, h, y], k) =>
    g.add(mesh(new THREE.BoxGeometry(w, h, 3.4 - k * 0.3), mat(0xd8cdb8), 0, y + k * 0.2, 0.3 + k * 0.15)));
  // 主体
  g.add(mesh(new THREE.BoxGeometry(3.4, 2.6, 2.6), stone, 0, 1.9, -0.4));
  // 四根立柱
  [-1.3, -0.44, 0.44, 1.3].forEach(x => {
    g.add(mesh(new THREE.CylinderGeometry(0.17, 0.19, 2.4, 10), stone, x, 1.85, 1.1));
    g.add(mesh(new THREE.BoxGeometry(0.45, 0.14, 0.45), stone, x, 3.1, 1.1));
  });
  // 三角楣 + 屋檐
  g.add(mesh(new THREE.BoxGeometry(3.9, 0.22, 3.2), mat(0xe0d5c0), 0, 3.28, 0.2));
  const ped = mesh(new THREE.ConeGeometry(2.1, 0.9, 3), mat(0xe8dcc6), 0, 3.85, 0.2);
  ped.rotation.y = Math.PI / 2;
  g.add(ped);
  // 大门
  g.add(mesh(new THREE.BoxGeometry(1.1, 1.8, 0.1), mat(0x8a5a2b), 0, 1.5, 0.92));
  // 屋顶金书招牌
  const book = mesh(new THREE.BoxGeometry(0.8, 0.6, 0.16), gold, 0, 4.6, 0.2);
  book.rotation.z = 0.15;
  book.userData.spin = true;
  g.add(book);
  g.traverse(o => { if (o.isMesh) o.userData.codex = true; });
  return g;
}

// 馆内大厅（藏在岛下，进馆时镜头切过去）
// 前区：42 台基础图鉴；后区（红毯贵宾厅）：10 台个人图鉴
export function createCodexInterior() {
  const g = new THREE.Group();
  const W = 17.5, D = 31;
  const wallMat = mat(0xf0ead9);
  // 大理石地面 + 分隔线
  g.add(mesh(new THREE.BoxGeometry(W, 0.3, D), mat(0xdcd3c2), 0, -0.15, 0));
  for (let k = -3; k <= 3; k++) {
    g.add(mesh(new THREE.BoxGeometry(0.05, 0.02, D), mat(0xc4b9a4), k * 2.5, 0.01, 0));
  }
  // 后墙 + 左墙
  g.add(mesh(new THREE.BoxGeometry(W, 5, 0.3), wallMat, 0, 2.5, -D / 2 + 0.15));
  g.add(mesh(new THREE.BoxGeometry(0.3, 5, D), wallMat, -W / 2 + 0.15, 2.5, 0));
  // 后墙高窗
  [-5, 0, 5].forEach(x =>
    g.add(mesh(new THREE.BoxGeometry(2, 1.6, 0.1),
      mat(0xbfe3f0, { emissive: 0x89b8d4, emissiveIntensity: 0.4 }), x, 3.4, -D / 2 + 0.25)));
  // 贵宾区：红毯 + 金柱拱门分界
  g.add(mesh(new THREE.BoxGeometry(14.4, 0.06, 8.8), mat(0xa8433a), 0, 0.04, 11));
  g.add(mesh(new THREE.BoxGeometry(13.6, 0.02, 8), mat(0xc9584a), 0, 0.08, 11));
  const gold = mat(0xf2c94c, { roughness: 0.35 });
  [[-7], [7]].forEach(([x]) => {
    g.add(mesh(new THREE.CylinderGeometry(0.2, 0.26, 3.4, 10), gold, x, 1.7, 6.4));
    g.add(mesh(new THREE.SphereGeometry(0.3, 8, 7), gold, x, 3.6, 6.4));
  });
  g.add(mesh(new THREE.BoxGeometry(14.8, 0.28, 0.5), gold, 0, 3.95, 6.4));
  // 顶灯（两个展区各自照明）
  [[-4, -10], [4, -10], [-4, -2], [4, -2], [0, 3], [-4, 11], [4, 11]].forEach(([x, z]) => {
    const l = new THREE.PointLight(0xfff2d8, 0.5, 20, 1.8);
    l.position.set(x, 4.2, z);
    g.add(l);
  });
  return g;
}

export function createPedestalBase(filled) {
  const g = new THREE.Group();
  const stone = mat(filled ? 0xf7f2e6 : 0xa9a191);
  g.add(mesh(new THREE.BoxGeometry(0.92, 0.14, 0.92), stone, 0, 0.07, 0));
  g.add(mesh(new THREE.BoxGeometry(0.6, 1.2, 0.6), stone, 0, 0.74, 0));
  g.add(mesh(new THREE.BoxGeometry(0.86, 0.13, 0.86), stone, 0, 1.4, 0));
  // 收录了才镶金边、亮起来
  if (filled) {
    g.add(mesh(new THREE.BoxGeometry(0.9, 0.04, 0.9),
      mat(0xf2c94c, { roughness: 0.35, emissive: 0x8a6a1a, emissiveIntensity: 0.25 }), 0, 1.48, 0));
    const glow = new THREE.PointLight(0xffd9a0, 0.35, 2.6, 2);
    glow.position.set(0, 1.9, 0);
    g.add(glow);
  }
  return g;
}

// 说明牌：用 canvas 画文字再贴到平面上
export function createPlaque(lines, dim) {
  const c = document.createElement('canvas');
  c.width = 340; c.height = 210;
  const ctx = c.getContext('2d');
  ctx.fillStyle = dim ? '#8f887a' : '#fffaf0';
  ctx.fillRect(0, 0, 340, 210);
  ctx.strokeStyle = dim ? '#6f695e' : '#c9a97e';
  ctx.lineWidth = 9;
  ctx.strokeRect(4, 4, 332, 202);
  ctx.textAlign = 'center';
  ctx.fillStyle = dim ? '#d8d2c6' : '#5a3a1c';
  ctx.font = 'bold 38px "Microsoft YaHei", sans-serif';
  ctx.fillText(lines[0], 170, 56);
  ctx.font = 'bold 26px "Microsoft YaHei", sans-serif';
  ctx.fillStyle = dim ? '#c4bdb0' : '#8a6a44';
  lines.slice(1).forEach((l, i) => ctx.fillText(l, 170, 100 + i * 33));
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 0.5),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  m.position.set(0, 0.9, 0.42);
  m.rotation.x = -0.5;
  return m;
}

/* ================= 料理工坊 ================= */

export function createKitchen() {
  const g = new THREE.Group();
  const wall = mat(0xf6c98a);
  const roof = mat(0xd9534f);
  // 主楼
  g.add(mesh(new THREE.BoxGeometry(3.2, 2, 2.6), wall, 0, 1, 0));
  // 双坡屋顶
  const r1 = mesh(new THREE.BoxGeometry(3.6, 0.16, 1.7), roof, 0, 2.35, 0.75);
  r1.rotation.x = 0.5;
  const r2 = mesh(new THREE.BoxGeometry(3.6, 0.16, 1.7), roof, 0, 2.35, -0.75);
  r2.rotation.x = -0.5;
  g.add(r1, r2);
  g.add(mesh(new THREE.BoxGeometry(3.6, 0.16, 0.1), mat(0xb03f3a), 0, 2.72, 0));
  // 大烟囱冒着"热气"
  g.add(mesh(new THREE.BoxGeometry(0.5, 1, 0.5), mat(0xc47a4a), 1, 2.6, -0.5));
  [[0.15, 3.3], [-0.1, 3.6], [0.1, 3.85]].forEach(([x, y], k) => {
    const puff = mesh(new THREE.SphereGeometry(0.18 + k * 0.04, 6, 5),
      mat(0xf0ece4, { transparent: true, opacity: 0.7 }), 1 + x, y, -0.5);
    g.add(puff);
  });
  // 门和橱窗
  g.add(mesh(new THREE.BoxGeometry(0.75, 1.3, 0.08), mat(0x8a5a2b), -0.7, 0.65, 1.32));
  g.add(mesh(new THREE.BoxGeometry(0.9, 0.7, 0.06), mat(0xbfe3f0), 0.75, 1.1, 1.32));
  // 招牌：一口金锅 + 铲子（会转）
  const sign = new THREE.Group();
  const pot = mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.32, 12), mat(0x4a4a52), 0, 0, 0);
  const soup = mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 12), mat(0xe8843f, { emissive: 0xc95a1a, emissiveIntensity: 0.3 }), 0, 0.15, 0);
  sign.add(pot, soup);
  sign.add(mesh(new THREE.TorusGeometry(0.1, 0.03, 6, 10), mat(0xe0b64a), 0.4, 0.02, 0));
  sign.position.set(0, 3.15, 0.4);
  sign.userData.spin = true;
  g.add(sign);
  g.traverse(o => { if (o.isMesh) o.userData.kitchen = true; });
  return g;
}

/* ================= 黑房子银行 ================= */

export function createBank() {
  const g = new THREE.Group();
  const black = mat(0x26262c, { roughness: 0.55 });
  const gold = mat(0xf2c94c, { roughness: 0.35 });
  // 黑色主楼 + 平顶
  g.add(mesh(new THREE.BoxGeometry(2.8, 2.2, 2.2), black, 0, 1.1, 0));
  g.add(mesh(new THREE.BoxGeometry(3.1, 0.22, 2.5), mat(0x1a1a20), 0, 2.3, 0));
  // 金色大门和门柱
  g.add(mesh(new THREE.BoxGeometry(0.7, 1.2, 0.08), gold, 0, 0.6, 1.12));
  [[-0.55], [0.55]].forEach(([x]) => g.add(mesh(new THREE.BoxGeometry(0.18, 1.7, 0.18), gold, x, 0.85, 1.15)));
  // 屋顶金币招牌（会转）
  const coin = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 14), gold, 0, 3, 0);
  coin.rotation.x = Math.PI / 2;
  coin.userData.spin = true;
  g.add(coin);
  g.add(mesh(new THREE.BoxGeometry(0.1, 0.4, 0.12), mat(0x8a6a1a), 0, 3, 0.02));
  // 两侧小窗透出金光
  [[-0.95], [0.95]].forEach(([x]) =>
    g.add(mesh(new THREE.BoxGeometry(0.5, 0.5, 0.06),
      mat(0xf7d98a, { emissive: 0xc99a2a, emissiveIntensity: 0.5 }), x, 1.4, 1.12)));
  g.traverse(o => { if (o.isMesh) o.userData.bank = true; });
  return g;
}

/* ================= 抓鱼水滩 ================= */

export const NET_SPOTS = [[0, 0], [1.9, 1], [-1.9, 1.1], [1.1, -1.9], [-1.3, -1.7]];

export function createPond() {
  const g = new THREE.Group();
  // 沙滩边和水面
  g.add(mesh(new THREE.CylinderGeometry(5, 5.3, 0.24, 12), mat(0xd9c9a8), 0, 0.05, 0));
  const water = mesh(new THREE.CylinderGeometry(4.3, 4.3, 0.18, 12),
    mat(0x4a90c2, { roughness: 0.25, emissive: 0x1a4a70, emissiveIntensity: 0.15 }), 0, 0.16, 0);
  water.userData.pondWater = true;
  g.add(water);
  // 几块石头点缀
  [[4.4, 0.6, 0.28], [-3.9, 2.3, 0.22], [-1.5, -4.4, 0.3]].forEach(([x, z, r]) => {
    const rock = mesh(new THREE.DodecahedronGeometry(r), mat(0xa8a095), x, 0.22, z);
    rock.scale.y = 0.65;
    g.add(rock);
  });
  g.traverse(o => { if (o.isMesh) o.userData.pond = true; });
  return g;
}

export function createNetMesh() {
  const g = new THREE.Group();
  const woodMat = mat(0x9a6a42);
  // 浮在水面的方形网框
  [[0, 0.44, 0.9, 0.07], [0, -0.44, 0.9, 0.07]].forEach(([x, z, w]) => {
    g.add(mesh(new THREE.BoxGeometry(w, 0.07, 0.07), woodMat, x, 0, z));
  });
  [[0.44, 0], [-0.44, 0]].forEach(([x, z]) => {
    g.add(mesh(new THREE.BoxGeometry(0.07, 0.07, 0.9), woodMat, x, 0, z));
  });
  // 网绳
  for (let k = -1; k <= 1; k++) {
    g.add(mesh(new THREE.BoxGeometry(0.85, 0.02, 0.025), mat(0xe8e2d4), 0, -0.01, k * 0.22));
    g.add(mesh(new THREE.BoxGeometry(0.025, 0.02, 0.85), mat(0xe8e2d4), k * 0.22, -0.01, 0));
  }
  // 小浮标
  g.add(mesh(new THREE.SphereGeometry(0.09, 6, 5), mat(0xd9534f), 0.44, 0.09, 0.44));
  return g;
}

/* ================= 房子内部：3D 房间与家具 ================= */

export function createInteriorRoom() {
  const g = new THREE.Group();
  const wallMat = mat(0xf3e6cf);
  const S = 25.3, half = S / 2; // 又扩了 3 倍的豪宅大厅
  // 木地板 + 拼缝
  g.add(mesh(new THREE.BoxGeometry(S, 0.3, S), mat(0xc9a06a), 0, -0.15, 0));
  for (let k = -12; k <= 12; k++) {
    g.add(mesh(new THREE.BoxGeometry(0.04, 0.02, S), mat(0xb08a55), k * 1.02, 0.01, 0));
  }
  // 后墙和左墙（前方和右侧敞开给镜头）
  g.add(mesh(new THREE.BoxGeometry(S, 4.4, 0.3), wallMat, 0, 2.2, -half + 0.15));
  g.add(mesh(new THREE.BoxGeometry(0.3, 4.4, S), wallMat, -half + 0.15, 2.2, 0));
  // 踢脚线
  g.add(mesh(new THREE.BoxGeometry(S, 0.25, 0.08), mat(0xa9825a), 0, 0.12, -half + 0.34));
  g.add(mesh(new THREE.BoxGeometry(0.08, 0.25, S), mat(0xa9825a), -half + 0.34, 0.12, 0));
  // 后墙三扇窗 + 左墙两扇窗：夜里也透着天光
  const addWindow = (x, z, rotY) => {
    const w = new THREE.Group();
    w.add(mesh(new THREE.BoxGeometry(1.6, 1.3, 0.1),
      mat(0xbfe3f0, { emissive: 0x89b8d4, emissiveIntensity: 0.35 }), 0, 0, 0));
    w.add(mesh(new THREE.BoxGeometry(0.1, 1.3, 0.12), mat(0x8a5a2b), 0, 0, 0.01));
    w.add(mesh(new THREE.BoxGeometry(1.6, 0.12, 0.12), mat(0x8a5a2b), 0, 0, 0.01));
    w.position.set(x, 2.2, z);
    w.rotation.y = rotY;
    g.add(w);
  };
  [-8.5, 0, 8.5].forEach(wx => addWindow(wx, -half + 0.25, 0));
  [-6.5, 6.5].forEach(wz => addWindow(-half + 0.25, wz, Math.PI / 2));
  // 四盏顶灯照亮大厅
  [[-6, -6], [6, -6], [-6, 6], [6, 6]].forEach(([x, z]) => {
    const lamp = new THREE.PointLight(0xffd9a0, 0.6, 22, 1.8);
    lamp.position.set(x, 4, z);
    g.add(lamp);
  });
  return g;
}

const furnitureBuilders = {
  bed(lv) {
    const g = new THREE.Group();
    if (lv === 1) { // 稻草床
      const hay = mesh(new THREE.BoxGeometry(1.7, 0.28, 1), mat(0xd9b95c), 0, 0.14, 0);
      hay.rotation.y = 0.06;
      g.add(hay);
      [[-0.5, 0.3, 0.3], [0.6, 0.28, -0.25], [0.1, 0.3, 0.4]].forEach(([x, y, z], k) => {
        const straw = mesh(new THREE.BoxGeometry(0.5, 0.04, 0.06), mat(0xc9a545), x, y, z);
        straw.rotation.y = k * 1.1;
        g.add(straw);
      });
      return g;
    }
    const long = lv === 3 ? 2.3 : 1.9, wide = lv === 3 ? 1.4 : 1.05;
    // 床架和床垫
    g.add(mesh(new THREE.BoxGeometry(long, 0.3, wide), mat(0x9a6a42), 0, 0.2, 0));
    [[long / 2 - 0.08, 0], [-long / 2 + 0.08, 0]].forEach(([x]) => {
      g.add(mesh(new THREE.BoxGeometry(0.14, 0.4, wide), mat(0x8a5a35), x, 0.2, 0));
    });
    g.add(mesh(new THREE.BoxGeometry(long - 0.25, 0.22, wide - 0.15), mat(0xf5efe2), 0, 0.45, 0));
    // 被子和枕头
    g.add(mesh(new THREE.BoxGeometry(long * 0.55, 0.1, wide - 0.12), mat(lv === 3 ? 0xd96a6a : 0x7fa8d9), -long * 0.18, 0.56, 0));
    const pillows = lv === 3 ? [[long / 2 - 0.42, 0.3], [long / 2 - 0.42, -0.3]] : [[long / 2 - 0.4, 0]];
    pillows.forEach(([x, z]) => g.add(mesh(new THREE.BoxGeometry(0.42, 0.12, 0.5), mat(0xffffff), x, 0.6, z)));
    if (lv === 3) g.add(mesh(new THREE.BoxGeometry(0.16, 1.1, wide), mat(0x8a5a35), long / 2 + 0.02, 0.55, 0));
    return g;
  },

  rug(lv) {
    const g = new THREE.Group();
    const rings = lv === 1
      ? [[0.75, 0x9bc47a]]
      : lv === 2
        ? [[1.05, 0xc46a5a], [0.7, 0xe8d9a8]]
        : [[1.5, 0xa8433a], [1.1, 0xe0b64a], [0.65, 0xf3e6cf]];
    rings.forEach(([r, color], k) => {
      g.add(mesh(new THREE.CylinderGeometry(r, r, 0.05, 14), mat(color), 0, 0.03 + k * 0.012, 0));
    });
    return g;
  },

  table(lv) {
    const g = new THREE.Group();
    const long = lv === 3 ? 2.1 : lv === 2 ? 1.4 : 1;
    const topMat = mat(lv === 3 ? 0x8a5a35 : 0xb08a55);
    g.add(mesh(new THREE.BoxGeometry(long, 0.09, 0.85), topMat, 0, 0.62, 0));
    [[long / 2 - 0.1, 0.32], [long / 2 - 0.1, -0.32], [-long / 2 + 0.1, 0.32], [-long / 2 + 0.1, -0.32]].forEach(([x, z]) =>
      g.add(mesh(new THREE.BoxGeometry(0.09, 0.6, 0.09), topMat, x, 0.31, z)));
    if (lv >= 2) { // 凳子/椅子
      const seats = lv === 2 ? [[0, 0.85], [0, -0.85]] : [[-0.6, 0.85], [0.6, 0.85], [-0.6, -0.85], [0.6, -0.85]];
      seats.forEach(([x, z]) => {
        g.add(mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.38, 8), mat(0x9a6a42), x, 0.19, z));
        if (lv === 3) g.add(mesh(new THREE.BoxGeometry(0.36, 0.5, 0.08), mat(0x9a6a42), x, 0.62, z + (z > 0 ? 0.16 : -0.16)));
      });
    }
    if (lv === 3) { // 烛台
      g.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.16, 6), mat(0xe0b64a), 0, 0.75, 0));
      const flame = mesh(new THREE.ConeGeometry(0.035, 0.1, 5), mat(0xffb838, { emissive: 0xff9420, emissiveIntensity: 1 }), 0, 0.88, 0);
      flame.userData.flame = true;
      g.add(flame);
    }
    return g;
  },

  shelf(lv) {
    const g = new THREE.Group();
    const w = lv === 3 ? 2.2 : lv === 2 ? 1.3 : 1;
    const h = lv === 3 ? 2.6 : lv === 2 ? 1.7 : 1.1;
    const frameMat = mat(lv === 3 ? 0x7a4e2d : 0x9a6a42);
    // 侧板和层板
    [[-w / 2, 0], [w / 2, 0]].forEach(([x]) => g.add(mesh(new THREE.BoxGeometry(0.1, h, 0.4), frameMat, x, h / 2, 0)));
    const layers = lv === 3 ? 4 : lv === 2 ? 3 : 2;
    for (let k = 0; k < layers; k++) {
      const y = 0.25 + k * ((h - 0.4) / (layers - 1));
      g.add(mesh(new THREE.BoxGeometry(w, 0.08, 0.4), frameMat, 0, y, 0));
      if (lv >= 2 || k === 0) { // 摆上五颜六色的书
        const colors = [0xc4574e, 0x4a90c2, 0x6aae5e, 0xe0b64a, 0x8a6bbf];
        const count = Math.floor(w / 0.16) - 1;
        for (let b = 0; b < count; b++) {
          const bh = 0.26 + ((b * 7 + k * 3) % 3) * 0.04;
          g.add(mesh(new THREE.BoxGeometry(0.11, bh, 0.3),
            mat(colors[(b + k) % colors.length]), -w / 2 + 0.22 + b * 0.16, y + 0.04 + bh / 2, 0));
        }
      }
    }
    return g;
  },

  plant(lv) {
    const g = new THREE.Group();
    const potR = lv === 3 ? 0.32 : lv === 2 ? 0.2 : 0.13;
    g.add(mesh(new THREE.CylinderGeometry(potR, potR * 0.75, potR * 1.3, 8), mat(0xd07a4a), 0, potR * 0.65, 0));
    if (lv === 1) { // 小多肉
      g.add(mesh(new THREE.SphereGeometry(0.09, 6, 5), mat(0x8fbf6a), 0, 0.24, 0));
      return g;
    }
    if (lv === 2) { // 绿萝
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        const leaf = mesh(new THREE.ConeGeometry(0.09, 0.4, 5), mat(0x5c9b52), Math.cos(a) * 0.14, 0.45, Math.sin(a) * 0.14);
        leaf.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6);
        g.add(leaf);
      }
      return g;
    }
    // 室内大树
    g.add(mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.1, 6), mat(0x8a5a35), 0, 0.9, 0));
    [[0, 1.65, 0, 0.45], [0.3, 1.4, 0.15, 0.3], [-0.28, 1.42, -0.1, 0.28]].forEach(([x, y, z, r]) =>
      g.add(mesh(new THREE.SphereGeometry(r, 7, 6), mat(0x5c9b52), x, y, z)));
    return g;
  },

  fire(lv) {
    const g = new THREE.Group();
    let fx = 0, fy = 0.3; // 火焰位置
    if (lv === 1) { // 小火盆
      g.add(mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.25, 8), mat(0x6b625a), 0, 0.13, 0));
      fy = 0.35;
    } else {
      const w = lv === 3 ? 1.9 : 1.5, h = lv === 3 ? 1.5 : 1.2;
      const bodyMat = mat(lv === 3 ? 0xe8e2d6 : 0xa2705a);
      // 炉体和炉膛
      g.add(mesh(new THREE.BoxGeometry(w, h, 0.55), bodyMat, 0, h / 2, 0));
      g.add(mesh(new THREE.BoxGeometry(w * 0.5, h * 0.55, 0.2), mat(0x2e2620), 0, h * 0.32, 0.2));
      g.add(mesh(new THREE.BoxGeometry(w + 0.25, 0.14, 0.7), mat(lv === 3 ? 0xd4c9b8 : 0x8a5a42), 0, h + 0.07, 0));
      if (lv === 3) { // 金饰边
        [[-w / 2 + 0.12], [w / 2 - 0.12]].forEach(([x]) =>
          g.add(mesh(new THREE.BoxGeometry(0.1, h, 0.6), mat(0xe0b64a), x, h / 2, 0.01)));
      }
      fy = h * 0.28; fx = 0;
      // 柴火
      [[-0.15, 0.4], [0.18, -0.4]].forEach(([x, ry]) => {
        const log = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.45, 6), mat(0x7a4e2d), x, 0.08, 0.22);
        log.rotation.set(Math.PI / 2, 0, ry);
        g.add(log);
      });
    }
    const flame = mesh(new THREE.ConeGeometry(lv === 3 ? 0.22 : 0.15, lv === 3 ? 0.55 : 0.38, 6),
      mat(0xffb838, { emissive: 0xff8c1a, emissiveIntensity: 1.2 }), fx, fy, lv === 1 ? 0 : 0.22);
    flame.userData.flame = true;
    g.add(flame);
    const glow = new THREE.PointLight(0xff9c40, 0.7, 6, 2);
    glow.position.set(0, fy + 0.2, 0.5);
    g.add(glow);
    return g;
  },

  sofa(lv) {
    const g = new THREE.Group();
    if (lv === 1) { // 小板凳
      g.add(mesh(new THREE.BoxGeometry(0.6, 0.1, 0.4), mat(0x9a6a42), 0, 0.4, 0));
      [[-0.22, 0.14], [0.22, 0.14], [-0.22, -0.14], [0.22, -0.14]].forEach(([x, z]) =>
        g.add(mesh(new THREE.BoxGeometry(0.08, 0.4, 0.08), mat(0x8a5a35), x, 0.2, z)));
      return g;
    }
    const fabric = mat(lv === 3 ? 0xb04a4a : 0x6a8fc2);
    const long = lv === 3 ? 2.6 : 1.9;
    // 底座 + 靠背 + 扶手
    g.add(mesh(new THREE.BoxGeometry(long, 0.45, 0.95), fabric, 0, 0.28, 0));
    g.add(mesh(new THREE.BoxGeometry(long, 0.7, 0.28), fabric, 0, 0.75, -0.36));
    [[-long / 2 + 0.14], [long / 2 - 0.14]].forEach(([x]) =>
      g.add(mesh(new THREE.BoxGeometry(0.28, 0.68, 0.95), fabric, x, 0.5, 0)));
    // 坐垫
    const cushions = lv === 3 ? 3 : 2;
    for (let k = 0; k < cushions; k++) {
      g.add(mesh(new THREE.BoxGeometry(long / cushions - 0.35, 0.16, 0.8),
        mat(lv === 3 ? 0xd97a6a : 0x8fb0d9), -long / 2 + (k + 0.5) * (long / cushions), 0.58, 0.05));
    }
    if (lv === 3) { // 转角贵妃位
      g.add(mesh(new THREE.BoxGeometry(0.95, 0.45, 1.6), fabric, long / 2 - 0.48, 0.28, 1.25));
      g.add(mesh(new THREE.BoxGeometry(0.8, 0.16, 1.4), mat(0xd97a6a), long / 2 - 0.48, 0.58, 1.28));
    }
    return g;
  },

  floorlamp(lv) {
    const g = new THREE.Group();
    if (lv === 1) { // 蜡烛台
      g.add(mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.08, 8), mat(0xb08a55), 0, 0.04, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.5, 6), mat(0xe8e2d4), 0, 0.33, 0));
      const flame = mesh(new THREE.ConeGeometry(0.05, 0.14, 5),
        mat(0xffb838, { emissive: 0xff9420, emissiveIntensity: 1 }), 0, 0.66, 0);
      flame.userData.flame = true;
      g.add(flame);
      return g;
    }
    const h = lv === 3 ? 1.9 : 1.1;
    const gold = lv === 3;
    g.add(mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.1, 8), mat(gold ? 0xe0b64a : 0x6b625a), 0, 0.05, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, h, 6), mat(gold ? 0xe0b64a : 0x6b625a), 0, h / 2, 0));
    const shade = mesh(new THREE.ConeGeometry(gold ? 0.42 : 0.32, gold ? 0.5 : 0.38, 8),
      mat(gold ? 0xf3d9a4 : 0xf5e8cf, { emissive: 0xffd27a, emissiveIntensity: 0.5 }), 0, h + 0.12, 0);
    g.add(shade);
    const light = new THREE.PointLight(0xffd9a0, gold ? 0.9 : 0.5, gold ? 11 : 7, 2);
    light.position.set(0, h, 0);
    g.add(light);
    return g;
  },

  aquarium(lv) {
    const g = new THREE.Group();
    const glass = mat(0xa8d8f0, { transparent: true, opacity: 0.35, roughness: 0.15 });
    const water = mat(0x4a90c2, { transparent: true, opacity: 0.55, emissive: 0x1a4a70, emissiveIntensity: 0.4 });
    const fishColors = [0xf07338, 0xf2c94c, 0xe0364a];
    const makeFish = (r, y, dist) => {
      const school = new THREE.Group();
      for (let k = 0; k < (lv === 1 ? 1 : lv === 2 ? 2 : 3); k++) {
        const a = (k / 3) * Math.PI * 2;
        const fish = mesh(new THREE.SphereGeometry(r, 6, 5), mat(fishColors[k]), Math.cos(a) * dist, y, Math.sin(a) * dist);
        fish.scale.set(1.5, 0.8, 0.7);
        fish.rotation.y = -a;
        school.add(fish);
      }
      school.userData.spin = true; // 小鱼绕圈游
      return school;
    };
    if (lv === 1) { // 金鱼碗
      g.add(mesh(new THREE.CylinderGeometry(0.26, 0.18, 0.34, 10), glass, 0, 0.55, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.23, 0.16, 0.26, 10), water, 0, 0.52, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.42, 8), mat(0x9a6a42), 0, 0.19, 0));
      g.add(makeFish(0.05, 0.55, 0.1));
      return g;
    }
    const w = lv === 3 ? 2.1 : 1.1, h = lv === 3 ? 1 : 0.6;
    // 柜子 + 玻璃缸 + 水
    g.add(mesh(new THREE.BoxGeometry(w + 0.2, 0.5, 0.85), mat(lv === 3 ? 0x5a4a3a : 0x9a6a42), 0, 0.25, 0));
    g.add(mesh(new THREE.BoxGeometry(w, h, 0.7), glass, 0, 0.5 + h / 2, 0));
    g.add(mesh(new THREE.BoxGeometry(w - 0.1, h - 0.14, 0.6), water, 0, 0.48 + h / 2, 0));
    g.add(makeFish(lv === 3 ? 0.09 : 0.06, 0.5 + h / 2, w / 3.4));
    // 缸底小水草
    for (let k = 0; k < (lv === 3 ? 4 : 2); k++) {
      g.add(mesh(new THREE.ConeGeometry(0.045, 0.28, 4), mat(0x5c9b52), -w / 2 + 0.3 + k * (w / (lv === 3 ? 4.4 : 2.6)), 0.66, 0.12));
    }
    return g;
  },

  piano(lv) {
    const g = new THREE.Group();
    if (lv === 1) { // 小木琴
      const stand = mesh(new THREE.BoxGeometry(0.9, 0.08, 0.5), mat(0x9a6a42), 0, 0.35, 0);
      stand.rotation.x = 0.12;
      g.add(stand);
      [[0xe0364a], [0xf2994c], [0xf2c94c], [0x6aae5e], [0x4a90c2], [0x8a6bbf]].forEach(([color], k) => {
        g.add(mesh(new THREE.BoxGeometry(0.11, 0.04, 0.42 - k * 0.04), mat(color), -0.33 + k * 0.13, 0.42, 0));
      });
      [[-0.38, 0.16], [0.38, 0.16]].forEach(([x, z]) =>
        g.add(mesh(new THREE.BoxGeometry(0.08, 0.36, 0.08), mat(0x8a5a35), x, 0.18, z)));
      return g;
    }
    const black = mat(0x2a2a30, { roughness: 0.35 });
    if (lv === 2) { // 立式钢琴
      g.add(mesh(new THREE.BoxGeometry(1.6, 1.4, 0.55), black, 0, 0.7, 0));
      g.add(mesh(new THREE.BoxGeometry(1.5, 0.08, 0.34), mat(0xf5efe2), 0, 0.85, 0.4)); // 白键
      for (let k = 0; k < 8; k++) {
        g.add(mesh(new THREE.BoxGeometry(0.07, 0.05, 0.16), black, -0.62 + k * 0.18, 0.9, 0.34));
      }
      g.add(mesh(new THREE.BoxGeometry(0.9, 0.3, 0.3), mat(0x8a5a35), 0, 0.15, 0.85)); // 琴凳
      return g;
    }
    // 三角钢琴
    g.add(mesh(new THREE.BoxGeometry(2, 0.28, 1.5), black, 0, 0.85, 0));
    const lid = mesh(new THREE.BoxGeometry(1.9, 0.06, 1.4), black, -0.1, 1.45, -0.1);
    lid.rotation.z = 0.55;
    g.add(lid);
    g.add(mesh(new THREE.BoxGeometry(1.8, 0.07, 0.3), mat(0xf5efe2), 0, 0.92, 0.85));
    for (let k = 0; k < 10; k++) {
      g.add(mesh(new THREE.BoxGeometry(0.06, 0.05, 0.14), black, -0.78 + k * 0.17, 0.97, 0.8));
    }
    [[-0.85, 0.55], [0.85, 0.55], [0, -0.6]].forEach(([x, z]) =>
      g.add(mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.75, 6), black, x, 0.4, z)));
    g.add(mesh(new THREE.BoxGeometry(0.9, 0.28, 0.32), black, 0, 0.14, 1.35)); // 琴凳
    return g;
  },

  art(lv) {
    const g = new THREE.Group();
    const y = 2.1; // 挂在墙上
    const frameMat = mat(lv === 3 ? 0xe0b64a : 0x8a5a35);
    const w = lv === 3 ? 1.7 : lv === 2 ? 1.3 : 0.9;
    const h = lv === 3 ? 1.3 : lv === 2 ? 0.95 : 0.7;
    g.add(mesh(new THREE.BoxGeometry(w, h, 0.08), frameMat, 0, y, 0));
    g.add(mesh(new THREE.BoxGeometry(w - 0.18, h - 0.18, 0.09), mat(0xf5efe2), 0, y, 0.01));
    if (lv === 1) { // 随手涂鸦
      [[0xe0364a, -0.15, 0.08, 0.2, 0.06], [0x4a90c2, 0.1, -0.05, 0.24, 0.05], [0x6aae5e, 0.05, 0.15, 0.14, 0.05]].forEach(([c, x, dy, ww, hh]) =>
        g.add(mesh(new THREE.BoxGeometry(ww, hh, 0.02), mat(c), x, y + dy, 0.06)));
    } else if (lv === 2) { // 风景画
      g.add(mesh(new THREE.BoxGeometry(w - 0.24, (h - 0.24) * 0.55, 0.02), mat(0x9ec9e8), 0, y + (h - 0.24) * 0.22, 0.06));
      g.add(mesh(new THREE.BoxGeometry(w - 0.24, (h - 0.24) * 0.45, 0.02), mat(0x7fb069), 0, y - (h - 0.24) * 0.27, 0.06));
      g.add(mesh(new THREE.SphereGeometry(0.09, 6, 5), mat(0xf2c94c, { emissive: 0xc98a12, emissiveIntensity: 0.4 }), w * 0.22, y + h * 0.24, 0.07));
    } else { // 名画金框：抽象向日葵
      g.add(mesh(new THREE.BoxGeometry(w - 0.24, h - 0.24, 0.02), mat(0x5a7fa8), 0, y, 0.06));
      g.add(mesh(new THREE.SphereGeometry(0.16, 7, 6), mat(0xc98a12), 0, y + 0.05, 0.08));
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const petal = mesh(new THREE.SphereGeometry(0.08, 5, 4), mat(0xf2c94c), Math.cos(a) * 0.26, y + 0.05 + Math.sin(a) * 0.26, 0.07);
        petal.scale.set(1.4, 0.7, 0.4);
        petal.rotation.z = a;
        g.add(petal);
      }
      g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 5), mat(0x6b8f3e), -0.05, y - 0.38, 0.07));
    }
    return g;
  },

  wardrobe(lv) {
    const g = new THREE.Group();
    const wood = mat(0x9a6a42);
    if (lv === 1) { // 挂衣杆
      [[-0.5], [0.5]].forEach(([x]) => g.add(mesh(new THREE.BoxGeometry(0.08, 1.5, 0.08), wood, x, 0.75, 0)));
      g.add(mesh(new THREE.BoxGeometry(1.1, 0.06, 0.06), wood, 0, 1.45, 0));
      [[-0.25, 0x6a8fc2], [0.15, 0xc4574e]].forEach(([x, c]) =>
        g.add(mesh(new THREE.BoxGeometry(0.34, 0.55, 0.06), mat(c), x, 1.1, 0)));
      return g;
    }
    const w = lv === 3 ? 2.6 : 1.5, h = lv === 3 ? 2.4 : 2;
    g.add(mesh(new THREE.BoxGeometry(w, h, 0.65), lv === 3 ? mat(0x7a4e2d) : wood, 0, h / 2, 0));
    // 门缝和把手
    g.add(mesh(new THREE.BoxGeometry(0.03, h - 0.2, 0.05), mat(0x5a3a22), 0, h / 2, 0.32));
    [[-0.12], [0.12]].forEach(([x]) => g.add(mesh(new THREE.SphereGeometry(0.05, 5, 4), mat(0xe0b64a), x, h / 2, 0.36)));
    if (lv === 3) { // 衣帽间：一侧敞开挂着衣服
      g.add(mesh(new THREE.BoxGeometry(0.85, 0.7, 0.1), mat(0xf3e6cf), w / 2 - 0.5, h - 0.5, 0.3));
      [[0x6a8fc2], [0xc4574e], [0x6aae5e]].forEach(([c], k) =>
        g.add(mesh(new THREE.BoxGeometry(0.2, 0.5, 0.08), mat(c), w / 2 - 0.75 + k * 0.26, h - 1.5, 0.32)));
    }
    return g;
  },

  mirror(lv) {
    const g = new THREE.Group();
    const glass = mat(0xcfe6f5, { emissive: 0x9ec4e0, emissiveIntensity: 0.4, roughness: 0.1 });
    if (lv === 1) { // 桌上小镜
      g.add(mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.5, 6), mat(0x9a6a42), 0, 0.25, 0));
      const m = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 10), glass, 0, 0.72, 0);
      m.rotation.x = Math.PI / 2 - 0.2;
      g.add(m);
      return g;
    }
    const h = lv === 3 ? 2.3 : 1.6, w = lv === 3 ? 1.1 : 0.7;
    const frame = mat(lv === 3 ? 0xe0b64a : 0x9a6a42);
    g.add(mesh(new THREE.BoxGeometry(w, h, 0.1), frame, 0, h / 2 + 0.1, 0));
    g.add(mesh(new THREE.BoxGeometry(w - 0.16, h - 0.16, 0.11), glass, 0, h / 2 + 0.1, 0.005));
    g.add(mesh(new THREE.BoxGeometry(w * 0.7, 0.12, 0.4), frame, 0, 0.06, 0));
    if (lv === 3) g.add(mesh(new THREE.SphereGeometry(0.09, 6, 5), frame, 0, h + 0.24, 0));
    return g;
  },

  teddy(lv) {
    const g = new THREE.Group();
    const s = lv === 3 ? 1.7 : lv === 2 ? 1 : 0.55;
    const fur = mat(lv === 3 ? 0xc9944a : 0xa5713d);
    const belly = mat(0xe8d4b0);
    g.add(mesh(new THREE.SphereGeometry(0.32 * s, 8, 7), fur, 0, 0.32 * s, 0));           // 身体
    g.add(mesh(new THREE.SphereGeometry(0.24 * s, 8, 7), belly, 0, 0.3 * s, 0.12 * s));   // 肚皮
    g.add(mesh(new THREE.SphereGeometry(0.22 * s, 8, 7), fur, 0, 0.72 * s, 0));           // 头
    [[-0.16], [0.16]].forEach(([x]) => g.add(mesh(new THREE.SphereGeometry(0.08 * s, 6, 5), fur, x * s, 0.9 * s, 0)));
    [[-0.3, 0.35], [0.3, 0.35]].forEach(([x, y]) => g.add(mesh(new THREE.SphereGeometry(0.11 * s, 6, 5), fur, x * s, y * s, 0.05 * s)));
    [[-0.16], [0.16]].forEach(([x]) => g.add(mesh(new THREE.SphereGeometry(0.13 * s, 6, 5), fur, x * s, 0.1 * s, 0.16 * s)));
    g.add(mesh(new THREE.SphereGeometry(0.05 * s, 5, 4), mat(0x3a2a1e), 0, 0.72 * s, 0.2 * s)); // 鼻子
    return g;
  },

  teatable(lv) {
    const g = new THREE.Group();
    if (lv === 1) { // 老树墩
      g.add(mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.4, 9), mat(0x8a5a35), 0, 0.2, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 9), mat(0xc9a06a), 0, 0.41, 0));
      return g;
    }
    if (lv === 2) {
      g.add(mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 10), mat(0x9a6a42), 0, 0.42, 0));
      [[0, 0.28], [0.24, -0.14], [-0.24, -0.14]].forEach(([x, z]) =>
        g.add(mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.4, 6), mat(0x8a5a35), x, 0.2, z)));
      g.add(mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.12, 6), mat(0xd9534f), 0.1, 0.52, 0.1)); // 小茶壶
      return g;
    }
    g.add(mesh(new THREE.BoxGeometry(1.3, 0.06, 0.75),
      mat(0xa8d8f0, { transparent: true, opacity: 0.4, roughness: 0.1 }), 0, 0.46, 0));
    [[-0.55, 0.3], [0.55, 0.3], [-0.55, -0.3], [0.55, -0.3]].forEach(([x, z]) =>
      g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.44, 6), mat(0xb8b8b8), x, 0.22, z)));
    g.add(mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.14, 7), mat(0xf5efe2), -0.2, 0.56, 0)); // 茶壶
    g.add(mesh(new THREE.SphereGeometry(0.06, 5, 4), mat(0xe0364a), 0.25, 0.53, 0.1));
    return g;
  },

  tv(lv) {
    const g = new THREE.Group();
    if (lv === 1) { // 老收音机
      g.add(mesh(new THREE.BoxGeometry(0.7, 0.45, 0.3), mat(0x8a5a35), 0, 0.5, 0));
      g.add(mesh(new THREE.BoxGeometry(0.25, 0.28, 0.05), mat(0xd9c9a8), -0.15, 0.5, 0.16));
      [[0.15], [0.28]].forEach(([x]) => g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 8), mat(0xe0b64a), x, 0.48, 0.16)));
      const ant = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 4), mat(0xb8b8b8), 0.2, 0.95, 0);
      ant.rotation.z = -0.5;
      g.add(ant);
      g.add(mesh(new THREE.BoxGeometry(0.9, 0.55, 0.5), mat(0x9a6a42), 0, 0.14, 0)); // 柜子
      return g;
    }
    const screen = mat(0x9ecfe8, { emissive: 0x6ab8e0, emissiveIntensity: 0.5 });
    if (lv === 2) { // 大屁股电视
      g.add(mesh(new THREE.BoxGeometry(1.1, 0.85, 0.8), mat(0x6b625a), 0, 0.95, 0));
      g.add(mesh(new THREE.BoxGeometry(0.8, 0.6, 0.06), screen, 0, 0.98, 0.41));
      g.add(mesh(new THREE.BoxGeometry(1.3, 0.5, 0.7), mat(0x9a6a42), 0, 0.26, 0));
      return g;
    }
    g.add(mesh(new THREE.BoxGeometry(3.2, 1.7, 0.12), mat(0x2a2a30), 0, 1.55, 0));
    g.add(mesh(new THREE.BoxGeometry(3, 1.5, 0.13), screen, 0, 1.55, 0.005));
    g.add(mesh(new THREE.BoxGeometry(3.4, 0.6, 0.6), mat(0x4a4a52), 0, 0.3, 0));
    return g;
  },

  clock(lv) {
    const g = new THREE.Group();
    const face = mat(0xf5efe2);
    if (lv === 1) { // 小闹钟
      g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 10), mat(0xd9534f), 0, 0.35, 0).rotateX(Math.PI / 2));
      g.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.13, 10), face, 0, 0.35, 0).rotateX(Math.PI / 2));
      [[-0.12], [0.12]].forEach(([x]) => g.add(mesh(new THREE.SphereGeometry(0.06, 5, 4), mat(0xe0b64a), x, 0.55, 0)));
      g.add(mesh(new THREE.BoxGeometry(0.3, 0.15, 0.2), mat(0x9a6a42), 0, 0.1, 0));
      return g;
    }
    if (lv === 2) { // 座钟
      g.add(mesh(new THREE.BoxGeometry(0.6, 0.9, 0.35), mat(0x8a5a35), 0, 0.45, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.36, 12), face, 0, 0.58, 0).rotateX(Math.PI / 2));
      g.add(mesh(new THREE.BoxGeometry(0.7, 0.12, 0.42), mat(0x7a4e2d), 0, 0.06, 0));
      return g;
    }
    // 落地大摆钟
    g.add(mesh(new THREE.BoxGeometry(0.85, 2.6, 0.5), mat(0x7a4e2d), 0, 1.3, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.52, 14), face, 0, 2.15, 0).rotateX(Math.PI / 2));
    g.add(mesh(new THREE.BoxGeometry(0.5, 1.1, 0.52), mat(0xa8d8f0, { transparent: true, opacity: 0.35 }), 0, 0.85, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 10), mat(0xe0b64a), 0, 0.6, 0.1).rotateX(Math.PI / 2)); // 钟摆
    g.add(mesh(new THREE.BoxGeometry(0.03, 0.7, 0.03), mat(0xe0b64a), 0, 1.05, 0.1));
    return g;
  },

  statue(lv) {
    const g = new THREE.Group();
    if (lv === 1) { // 小石人
      const stone = mat(0xa8a095);
      g.add(mesh(new THREE.SphereGeometry(0.2, 7, 6), stone, 0, 0.2, 0));
      g.add(mesh(new THREE.SphereGeometry(0.13, 7, 6), stone, 0, 0.48, 0));
      return g;
    }
    const gold = lv === 3;
    const bodyMat = mat(gold ? 0xe0b64a : 0xe8e2d6, gold ? { roughness: 0.3, emissive: 0x8a6a1a, emissiveIntensity: 0.15 } : {});
    const ped = mat(gold ? 0x4a4a52 : 0xc9c2b5);
    const h = gold ? 1 : 0.6;
    g.add(mesh(new THREE.BoxGeometry(0.7, h * 0.55, 0.7), ped, 0, h * 0.28, 0));
    if (lv === 2) { // 半身像
      g.add(mesh(new THREE.BoxGeometry(0.44, 0.3, 0.3), bodyMat, 0, h * 0.55 + 0.15, 0));
      g.add(mesh(new THREE.SphereGeometry(0.16, 7, 6), bodyMat, 0, h * 0.55 + 0.45, 0));
      return g;
    }
    // 黄金全身像：举着锄头的农夫
    g.add(mesh(new THREE.BoxGeometry(0.3, 0.75, 0.22), bodyMat, 0, h * 0.55 + 0.38, 0));
    g.add(mesh(new THREE.SphereGeometry(0.14, 7, 6), bodyMat, 0, h * 0.55 + 0.9, 0));
    const arm = mesh(new THREE.BoxGeometry(0.09, 0.5, 0.09), bodyMat, 0.26, h * 0.55 + 0.62, 0);
    arm.rotation.z = -0.7;
    g.add(arm);
    const hoe = mesh(new THREE.BoxGeometry(0.05, 0.85, 0.05), bodyMat, 0.48, h * 0.55 + 0.85, 0);
    hoe.rotation.z = 0.25;
    g.add(hoe);
    return g;
  },

  safe(lv) {
    const g = new THREE.Group();
    if (lv === 1) { // 小猪存钱罐
      const pink = mat(0xf2a7c3);
      const body = mesh(new THREE.SphereGeometry(0.3, 8, 7), pink, 0, 0.3, 0);
      body.scale.set(1.2, 1, 1);
      g.add(body);
      g.add(mesh(new THREE.SphereGeometry(0.1, 6, 5), pink, 0.34, 0.3, 0));
      [[-0.14, 0.12], [0.14, 0.12], [-0.14, -0.12], [0.14, -0.12]].forEach(([x, z]) =>
        g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 5), pink, x, 0.07, z)));
      g.add(mesh(new THREE.BoxGeometry(0.14, 0.02, 0.05), mat(0x8a5a35), 0, 0.58, 0));
      return g;
    }
    if (lv === 2) { // 保险箱
      g.add(mesh(new THREE.BoxGeometry(0.8, 1, 0.7), mat(0x5a5a66), 0, 0.5, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 10), mat(0xb8b8b8), 0.14, 0.6, 0.36).rotateX(Math.PI / 2));
      g.add(mesh(new THREE.BoxGeometry(0.06, 0.2, 0.05), mat(0xb8b8b8), -0.2, 0.5, 0.36));
      return g;
    }
    // 黄金金库门
    g.add(mesh(new THREE.BoxGeometry(1.9, 2.2, 0.4), mat(0x4a4a52), 0, 1.1, 0));
    const door = mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.44, 16), mat(0xe0b64a, { roughness: 0.3 }), 0, 1.1, 0);
    door.rotation.x = Math.PI / 2;
    g.add(door);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      g.add(mesh(new THREE.BoxGeometry(0.5, 0.07, 0.05), mat(0x8a6a1a), Math.cos(a) * 0.3, 1.1 + Math.sin(a) * 0.3, 0.24).rotateZ(a));
    }
    return g;
  },

  harp(lv) {
    const g = new THREE.Group();
    if (lv === 1) { // 小铃铛架
      g.add(mesh(new THREE.BoxGeometry(0.7, 0.06, 0.06), mat(0x9a6a42), 0, 0.8, 0));
      [[-0.5], [0.5]].forEach(([x]) => g.add(mesh(new THREE.BoxGeometry(0.06, 0.8, 0.06), mat(0x9a6a42), x, 0.4, 0)));
      [[-0.25, 0.12], [0, 0.14], [0.25, 0.12]].forEach(([x, r]) =>
        g.add(mesh(new THREE.ConeGeometry(r, 0.2, 8), mat(0xe0b64a), x, 0.66, 0)));
      return g;
    }
    const gold = lv === 3;
    const frame = mat(gold ? 0xe0b64a : 0x9a6a42, gold ? { roughness: 0.35 } : {});
    const h = gold ? 2 : 1.3;
    // 立柱 + 弧顶 + 底座
    g.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, h, 6), frame, -0.5, h / 2, 0));
    const arc = mesh(new THREE.TorusGeometry(h * 0.42, 0.06, 6, 12, Math.PI * 0.9), frame, -0.08, h * 0.78, 0);
    arc.rotation.z = -0.5;
    g.add(arc);
    const slant = mesh(new THREE.CylinderGeometry(0.07, 0.1, h * 1.05, 6), frame, 0.28, h * 0.42, 0);
    slant.rotation.z = 0.55;
    g.add(slant);
    g.add(mesh(new THREE.BoxGeometry(0.9, 0.14, 0.5), frame, 0, 0.07, 0));
    // 琴弦
    for (let k = 0; k < (gold ? 7 : 5); k++) {
      const x = -0.42 + k * (gold ? 0.11 : 0.13);
      const sh = h * (0.85 - k * 0.09);
      g.add(mesh(new THREE.BoxGeometry(0.015, sh, 0.015), mat(0xf5efe2), x, sh / 2 + 0.12, 0));
    }
    return g;
  },

  kitchen(lv) {
    const g = new THREE.Group();
    if (lv === 1) { // 小炉灶
      g.add(mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), mat(0x8a7a6a), 0, 0.25, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 10), mat(0x3a3a40), 0, 0.53, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.16, 8), mat(0x5a5a66), 0, 0.62, 0)); // 小锅
      return g;
    }
    const w = lv === 3 ? 2.8 : 1.6;
    const counterMat = mat(lv === 3 ? 0xe8e2d6 : 0xd9c9a8);
    g.add(mesh(new THREE.BoxGeometry(w, 0.85, 0.75), counterMat, 0, 0.43, 0));
    g.add(mesh(new THREE.BoxGeometry(w + 0.1, 0.08, 0.85), mat(lv === 3 ? 0x4a4a52 : 0x9a6a42), 0, 0.9, 0));
    // 灶眼和锅
    [[-w / 4], [w / 4]].forEach(([x], k) => {
      g.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 10), mat(0x3a3a40), x, 0.96, -0.1));
      if (k === 0) g.add(mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.16, 9), mat(0xd9534f), x, 1.05, -0.1));
    });
    // 水槽
    g.add(mesh(new THREE.BoxGeometry(0.4, 0.06, 0.3), mat(0xb8b8b8), w / 2 - 0.35, 0.95, 0.15));
    if (lv === 3) { // 岛台挂锅架
      g.add(mesh(new THREE.BoxGeometry(w * 0.7, 0.06, 0.06), mat(0x4a4a52), 0, 2, 0));
      [[-0.5, 0xd9534f], [0, 0x5a5a66], [0.5, 0xe0b64a]].forEach(([x, c]) =>
        g.add(mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.12, 8), mat(c), x, 1.75, 0)));
    }
    return g;
  },

  cabinet(lv) {
    const g = new THREE.Group();
    const wood = mat(0x8a5a35);
    if (lv === 1) {
      g.add(mesh(new THREE.BoxGeometry(0.8, 0.7, 0.45), wood, 0, 0.35, 0));
      g.add(mesh(new THREE.SphereGeometry(0.04, 5, 4), mat(0xe0b64a), 0, 0.35, 0.24));
      return g;
    }
    if (lv === 2) {
      g.add(mesh(new THREE.BoxGeometry(1.7, 0.9, 0.5), wood, 0, 0.45, 0));
      g.add(mesh(new THREE.BoxGeometry(0.03, 0.7, 0.05), mat(0x5a3a22), 0, 0.45, 0.26));
      [[-0.6, 0xd9534f], [0.6, 0x6aae5e]].forEach(([x, c]) =>
        g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 6), mat(c), x, 1.05, 0)));
      return g;
    }
    // 玻璃展示酒柜
    g.add(mesh(new THREE.BoxGeometry(1.5, 2.3, 0.55), mat(0x7a4e2d), 0, 1.15, 0));
    g.add(mesh(new THREE.BoxGeometry(1.2, 1.9, 0.1), mat(0xa8d8f0, { transparent: true, opacity: 0.3 }), 0, 1.25, 0.28));
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.32, 6),
          mat([0xc4574e, 0x6aae5e, 0xe0b64a][((row + col) % 3)]), -0.4 + col * 0.4, 0.6 + row * 0.55, 0.05));
      }
    }
    return g;
  },

  rocker(lv) {
    const g = new THREE.Group();
    if (lv === 1) { // 蒲团
      g.add(mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.18, 10), mat(0xc9a97e), 0, 0.09, 0));
      return g;
    }
    if (lv === 2) { // 木摇椅
      const wood = mat(0x9a6a42);
      g.add(mesh(new THREE.BoxGeometry(0.6, 0.08, 0.55), wood, 0, 0.4, 0));
      const back = mesh(new THREE.BoxGeometry(0.6, 0.7, 0.07), wood, 0, 0.75, -0.26);
      back.rotation.x = 0.25;
      g.add(back);
      [[-0.26], [0.26]].forEach(([x]) => {
        const run = mesh(new THREE.TorusGeometry(0.45, 0.04, 5, 8, Math.PI * 0.7), wood, x, 0.32, 0);
        run.rotation.y = Math.PI / 2;
        run.rotation.z = Math.PI + 0.45;
        g.add(run);
        g.add(mesh(new THREE.BoxGeometry(0.06, 0.35, 0.06), wood, x, 0.22, 0.18));
        g.add(mesh(new THREE.BoxGeometry(0.06, 0.35, 0.06), wood, x, 0.22, -0.18));
      });
      return g;
    }
    // 吊篮秋千椅：吊杆顶端 → 吊绳 → 藤篮，全部对齐在一条线上
    const frame = mat(0x8a5a35);
    const arcPole = mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.6, 6), frame, -0.55, 1.25, 0);
    arcPole.rotation.z = -0.42;
    g.add(arcPole);
    g.add(mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.12, 8), frame, -1.05, 0.06, 0));
    const tipX = -0.55 + Math.sin(0.42) * 1.3, tipY = 1.25 + Math.cos(0.42) * 1.3; // 杆顶位置
    g.add(mesh(new THREE.BoxGeometry(0.03, tipY - 1.5, 0.03), mat(0x5a3a22), tipX, (tipY + 1.5) / 2, 0));
    const basket = mesh(new THREE.SphereGeometry(0.55, 8, 6, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.5), mat(0xc9a97e), tipX, 1.15, 0);
    g.add(basket);
    g.add(mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 9), mat(0xd97a6a), tipX, 1.08, 0)); // 坐垫
    return g;
  },

  bath(lv) {
    const g = new THREE.Group();
    const water = mat(0x7ec4e8, { transparent: true, opacity: 0.6, emissive: 0x2a6a90, emissiveIntensity: 0.2 });
    if (lv === 1) { // 木澡盆
      g.add(mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.45, 10), mat(0x9a6a42), 0, 0.22, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.06, 10), water, 0, 0.38, 0));
      return g;
    }
    if (lv === 2) { // 白瓷浴缸
      const tub = mesh(new THREE.BoxGeometry(1.6, 0.6, 0.85), mat(0xf5efe2), 0, 0.3, 0);
      g.add(tub);
      g.add(mesh(new THREE.BoxGeometry(1.4, 0.06, 0.65), water, 0, 0.55, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6), mat(0xb8b8b8), 0.7, 0.75, 0));
      return g;
    }
    // 豪华圆浴池
    g.add(mesh(new THREE.CylinderGeometry(1.15, 1.05, 0.65, 14), mat(0xe8e2d6), 0, 0.32, 0));
    g.add(mesh(new THREE.CylinderGeometry(1, 1, 0.08, 14), water, 0, 0.6, 0));
    g.add(mesh(new THREE.TorusGeometry(1.08, 0.07, 6, 14), mat(0xe0b64a), 0, 0.66, 0).rotateX(Math.PI / 2));
    [[0.4, 0.3], [-0.35, -0.2], [0, 0.05]].forEach(([x, z]) =>
      g.add(mesh(new THREE.SphereGeometry(0.09, 6, 5), mat(0xffffff, { transparent: true, opacity: 0.75 }), x, 0.66, z)));
    return g;
  },

  arcade(lv) {
    const g = new THREE.Group();
    if (lv === 1) { // 棋盘
      g.add(mesh(new THREE.BoxGeometry(0.7, 0.06, 0.7), mat(0xd9c9a8), 0, 0.3, 0));
      g.add(mesh(new THREE.BoxGeometry(0.72, 0.28, 0.72), mat(0x9a6a42), 0, 0.14, 0));
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        if ((r + c) % 2) g.add(mesh(new THREE.BoxGeometry(0.16, 0.015, 0.16), mat(0x5a3a22), -0.25 + c * 0.165, 0.34, -0.25 + r * 0.165));
      }
      [[0.1, 0xf5efe2], [-0.15, 0x3a2a1e]].forEach(([x, c]) =>
        g.add(mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 6), mat(c), x, 0.4, 0.05)));
      return g;
    }
    if (lv === 2) { // 弹珠游戏桌
      const board = mesh(new THREE.BoxGeometry(0.9, 0.1, 1.4), mat(0x4a90c2), 0, 0.62, 0);
      board.rotation.x = -0.18;
      g.add(board);
      [[0.2, 0.3, 0xe0364a], [-0.2, -0.1, 0xf2c94c], [0.1, -0.4, 0x6aae5e]].forEach(([x, z, c]) =>
        g.add(mesh(new THREE.SphereGeometry(0.05, 6, 5), mat(c), x, 0.72, z)));
      [[-0.4, 0.6], [0.4, 0.6], [-0.4, -0.6], [0.4, -0.6]].forEach(([x, z]) =>
        g.add(mesh(new THREE.BoxGeometry(0.08, 0.55, 0.08), mat(0x9a6a42), x, 0.28, z)));
      return g;
    }
    // 复古街机
    g.add(mesh(new THREE.BoxGeometry(1, 1.9, 0.8), mat(0x8a4ac2), 0, 0.95, 0));
    g.add(mesh(new THREE.BoxGeometry(0.75, 0.55, 0.06),
      mat(0x9ecfe8, { emissive: 0x6ab8e0, emissiveIntensity: 0.6 }), 0, 1.35, 0.41));
    const panel = mesh(new THREE.BoxGeometry(0.9, 0.08, 0.4), mat(0x5a2a90), 0, 0.95, 0.5);
    panel.rotation.x = 0.3;
    g.add(panel);
    g.add(mesh(new THREE.SphereGeometry(0.05, 6, 5), mat(0xe0364a), -0.2, 1.02, 0.55));
    [[0.1], [0.24]].forEach(([x]) => g.add(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 8), mat(0xf2c94c), x, 1, 0.56)));
    g.add(mesh(new THREE.BoxGeometry(1, 0.3, 0.85), mat(0x6a3aa0), 0, 2.05, 0)); // 顶棚灯箱
    return g;
  },

  telescope(lv) {
    const g = new THREE.Group();
    if (lv === 1) { // 小双筒镜（放在木箱上）
      g.add(mesh(new THREE.BoxGeometry(0.45, 0.4, 0.45), mat(0x9a6a42), 0, 0.2, 0));
      [[-0.08], [0.08]].forEach(([x]) => {
        const tube = mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.25, 8), mat(0x3a3a40), x, 0.5, 0);
        tube.rotation.x = Math.PI / 2 - 0.4;
        g.add(tube);
      });
      return g;
    }
    const gold = lv === 3;
    const bodyMat = mat(gold ? 0xe0b64a : 0x5a5a66, gold ? { roughness: 0.35 } : {});
    const len = gold ? 1.5 : 0.9, h = gold ? 1.5 : 1.1;
    // 三脚架
    [0, 2.1, 4.2].forEach(a => {
      const leg = mesh(new THREE.CylinderGeometry(0.035, 0.045, h, 6), mat(0x8a5a35), Math.cos(a) * 0.3, h / 2 - 0.05, Math.sin(a) * 0.3);
      leg.rotation.z = Math.cos(a) * 0.28;
      leg.rotation.x = -Math.sin(a) * 0.28;
      g.add(leg);
    });
    const tube = mesh(new THREE.CylinderGeometry(gold ? 0.14 : 0.09, gold ? 0.2 : 0.12, len, 9), bodyMat, 0, h + 0.1, 0);
    tube.rotation.x = Math.PI / 2 - 0.7;
    g.add(tube);
    if (gold) g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 6), mat(0x3a3a40), 0, h - 0.05, -0.35).rotateX(Math.PI / 2 - 0.7));
    return g;
  },
};

export function createFurnitureMesh(id, lv) {
  return furnitureBuilders[id](lv);
}

/* ================= 商场小楼（菜园后方） ================= */

export function createMall() {
  const g = new THREE.Group();
  // 两层主楼
  g.add(mesh(new THREE.BoxGeometry(3, 1.5, 1.8), mat(0xf0e6d8), 0, 0.75, 0));
  g.add(mesh(new THREE.BoxGeometry(2.4, 0.9, 1.5), mat(0xe6dbc9), 0, 1.95, 0));
  // 蓝色平顶和遮阳棚
  g.add(mesh(new THREE.BoxGeometry(3.2, 0.22, 2), mat(0x4a90c2), 0, 2.5, 0));
  const awning = mesh(new THREE.BoxGeometry(3.2, 0.14, 0.7), mat(0x4a90c2), 0, 1.42, 1.1);
  awning.rotation.x = -0.24;
  g.add(awning);
  // 橱窗和门
  [-0.9, 0.9].forEach(x => g.add(mesh(new THREE.BoxGeometry(0.85, 0.7, 0.06), mat(0xbfe3f0), x, 0.75, 0.92)));
  g.add(mesh(new THREE.BoxGeometry(0.6, 1, 0.06), mat(0x8a5a2b), 0, 0.5, 0.92));
  // 屋顶的购物袋招牌
  const sign = mesh(new THREE.BoxGeometry(0.5, 0.55, 0.12), mat(0xf2c94c), 0, 2.95, 0);
  sign.userData.spin = true;
  g.add(sign);
  g.add(mesh(new THREE.TorusGeometry(0.14, 0.03, 6, 10, Math.PI), mat(0xd9a441), 0, 3.24, 0));
  g.traverse(o => { if (o.isMesh) o.userData.mall = true; });
  return g;
}

/* ================= 我们自己的小屋 ================= */

export function createHouse() {
  const g = new THREE.Group();
  // 主体
  g.add(mesh(new THREE.BoxGeometry(3.6, 2, 3), mat(0xfaf0dc), 0, 1, 0));
  // 人字形屋顶
  const roof = mesh(new THREE.ConeGeometry(2.9, 1.5, 4), mat(0xc0563f), 0, 2.75, 0);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  // 烟囱
  g.add(mesh(new THREE.BoxGeometry(0.42, 1, 0.42), mat(0xa2705a), 1.1, 3, -0.6));
  // 门（朝农田）和门口台阶
  g.add(mesh(new THREE.BoxGeometry(0.8, 1.3, 0.08), mat(0x9a5f33), -0.6, 0.65, 1.53));
  g.add(mesh(new THREE.SphereGeometry(0.07, 6, 5), mat(0xf2c94c), -0.28, 0.7, 1.58));
  g.add(mesh(new THREE.BoxGeometry(1.2, 0.16, 0.5), mat(0xd9c9a8), -0.6, 0.08, 1.85));
  // 窗户
  [[0.9, 1.53, 0], [1.86, 0, -0.8]].forEach(([x, z, ry], k) => {
    const win = mesh(new THREE.BoxGeometry(0.75, 0.65, 0.08), mat(0xbfe3f0), x, 1.15, z);
    if (k === 1) { win.rotation.y = Math.PI / 2; }
    win.userData.houseWindow = true; // 夜里透出暖光
    g.add(win);
  });
  g.traverse(o => { if (o.isMesh) o.userData.house = true; });
  return g;
}

/* ================= 个人图鉴展台（住在图鉴大楼的贵宾区） ================= */

export const DISPLAY_SLOTS = 10;

export function createGalleryPedestal(filled) {
  const g = new THREE.Group();
  const base = mat(filled ? 0x3c3c46 : 0x8f8a80);
  g.add(mesh(new THREE.BoxGeometry(1.05, 0.16, 1.05), base, 0, 0.08, 0));
  g.add(mesh(new THREE.BoxGeometry(0.66, 1.3, 0.66), base, 0, 0.8, 0));
  g.add(mesh(new THREE.BoxGeometry(0.95, 0.12, 0.95),
    mat(filled ? 0xf2c94c : 0xb8b2a4, filled ? { roughness: 0.35, emissive: 0x8a6a1a, emissiveIntensity: 0.25 } : {}),
    0, 1.5, 0));
  if (filled) {
    const glow = new THREE.PointLight(0xffe0a8, 0.45, 3.2, 2);
    glow.position.set(0, 2.2, 0);
    g.add(glow);
  }
  return g;
}

export function galleryPedestalPos(k) {
  const col = k % 5, row = Math.floor(k / 5);
  return { x: (col - 2) * 3, z: 9 + row * 3.6 };
}

/* ================= 作物（按阶段 0-3） ================= */

function sprout(scale = 1) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.ConeGeometry(0.07 * scale, 0.22 * scale, 5), mat(GREEN), 0, 0.11 * scale, 0));
  return g;
}

function leafCrown(scale = 1, color = DARKGREEN) {
  const g = new THREE.Group();
  for (let k = 0; k < 4; k++) {
    const leaf = mesh(new THREE.ConeGeometry(0.09 * scale, 0.4 * scale, 4), mat(color));
    const a = (k / 4) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.09 * scale, 0.18 * scale, Math.sin(a) * 0.09 * scale);
    leaf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
    g.add(leaf);
  }
  return g;
}

const builders = {
  sweetpot(stage) {
    const g = new THREE.Group();
    if (stage === 0) return sprout(0.7);
    if (stage === 1) { g.add(leafCrown(0.7, GREEN)); return g; }
    g.add(leafCrown(0.8, GREEN));
    const size = stage === 2 ? 0.6 : 1;
    const tuber = mesh(new THREE.SphereGeometry(0.14 * size, 6, 5), mat(0xa34f6b), 0, 0.08, 0);
    tuber.scale.set(1.5, 0.75, 0.9); // 拉长成红薯形
    tuber.rotation.y = 0.5;
    g.add(tuber);
    return g;
  },

  radish(stage) {
    const g = new THREE.Group();
    if (stage === 0) return sprout(0.8);
    if (stage === 1) { g.add(leafCrown(0.8)); return g; }
    g.add(leafCrown(1));
    const root = mesh(new THREE.ConeGeometry(0.16, 0.3, 6), mat(0xf07338), 0, 0.1, 0);
    root.rotation.x = Math.PI; // 尖朝下，露出圆头
    if (stage === 2) root.scale.setScalar(0.55);
    g.add(root);
    return g;
  },

  tomato(stage) {
    const g = new THREE.Group();
    if (stage === 0) return sprout(0.9);
    const stem = mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.55, 5), mat(DARKGREEN), 0, 0.28, 0);
    g.add(stem, leafCrown(0.7));
    if (stage === 1) return g;
    const fruitColor = stage === 2 ? 0x9ec95d : 0xe8483f;
    const r = stage === 2 ? 0.07 : 0.1;
    [[0.12, 0.42, 0], [-0.1, 0.5, 0.08], [0.02, 0.34, -0.12]].forEach(([x, y, z]) =>
      g.add(mesh(new THREE.SphereGeometry(r, 6, 5), mat(fruitColor), x, y, z)));
    return g;
  },

  pumpkin(stage) {
    const g = new THREE.Group();
    if (stage === 0) return sprout(1);
    if (stage === 1) { g.add(leafCrown(1.1, GREEN)); return g; }
    g.add(leafCrown(0.9, GREEN));
    const size = stage === 2 ? 0.16 : 0.3;
    const body = mesh(new THREE.SphereGeometry(size, 7, 6), mat(stage === 2 ? 0xa8c94f : 0xe8842f), 0, size * 0.8, 0.05);
    body.scale.y = 0.75;
    g.add(body);
    g.add(mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.12, 5), mat(0x6b8f3e), 0, size * 1.4, 0.05));
    return g;
  },

  potato(stage) {
    const g = new THREE.Group();
    if (stage === 0) return sprout(0.7);
    if (stage === 1) { g.add(leafCrown(0.75, GREEN)); return g; }
    g.add(leafCrown(0.85, GREEN));
    const s = stage === 2 ? 0.6 : 1;
    [[0.1, 0.06, 0.05], [-0.12, 0.05, -0.02], [0, 0.07, -0.13]].forEach(([x, y, z], k) => {
      const lump = mesh(new THREE.SphereGeometry(0.1 * s, 6, 5), mat(0xb0895a), x, y, z);
      lump.scale.set(1.25, 0.8, 1);
      lump.rotation.y = k;
      g.add(lump);
    });
    return g;
  },

  cabbage(stage) {
    const g = new THREE.Group();
    if (stage === 0) return sprout(0.8);
    if (stage === 1) { g.add(leafCrown(0.9, 0x8fbf6a)); return g; }
    const s = stage === 2 ? 0.55 : 1;
    const heart = mesh(new THREE.SphereGeometry(0.2 * s, 7, 6), mat(0xcfe3a0), 0, 0.16 * s, 0);
    heart.scale.y = 0.9;
    g.add(heart);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const leaf = mesh(new THREE.SphereGeometry(0.11 * s, 5, 4), mat(0x8fbf6a),
        Math.cos(a) * 0.17 * s, 0.1 * s, Math.sin(a) * 0.17 * s);
      leaf.scale.set(1, 1.3, 0.5);
      leaf.lookAt(0, 0.5 * s, 0);
      g.add(leaf);
    }
    return g;
  },

  corn(stage) {
    const g = new THREE.Group();
    if (stage === 0) return sprout(1);
    const h = stage === 1 ? 0.45 : stage === 2 ? 0.7 : 0.95;
    g.add(mesh(new THREE.CylinderGeometry(0.035, 0.055, h, 5), mat(GREEN), 0, h / 2, 0));
    [[0.5, 0.35], [-0.6, 0.55]].forEach(([rot, y]) => {
      const leaf = mesh(new THREE.ConeGeometry(0.06, 0.4, 4), mat(DARKGREEN), 0, y * h, 0);
      leaf.rotation.z = rot + Math.PI;
      leaf.position.x = rot > 0 ? 0.12 : -0.12;
      g.add(leaf);
    });
    if (stage >= 2) {
      const s = stage === 2 ? 0.6 : 1;
      const cob = mesh(new THREE.CylinderGeometry(0.07 * s, 0.05 * s, 0.28 * s, 6), mat(0xf2c94c), 0.11, h * 0.55, 0);
      cob.rotation.z = -0.25;
      g.add(cob);
    }
    return g;
  },

  strawberry(stage) {
    const g = new THREE.Group();
    if (stage === 0) return sprout(0.7);
    g.add(leafCrown(0.75, DARKGREEN));
    if (stage === 1) return g;
    const s = stage === 2 ? 0.6 : 1;
    const color = stage === 2 ? 0xa8c95d : 0xe0364a;
    [[0.16, 0], [-0.13, 0.1], [0.02, -0.17]].forEach(([x, z], k) => {
      const berry = mesh(new THREE.ConeGeometry(0.07 * s, 0.12 * s, 6), mat(color), x, 0.06, z);
      berry.rotation.x = Math.PI; // 尖朝下
      berry.rotation.z = k * 0.3;
      g.add(berry);
    });
    return g;
  },

  eggplant(stage) {
    const g = new THREE.Group();
    if (stage === 0) return sprout(0.9);
    const stem = mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.5, 5), mat(DARKGREEN), 0, 0.25, 0);
    g.add(stem, leafCrown(0.7));
    if (stage === 1) return g;
    const s = stage === 2 ? 0.55 : 1;
    [[0.12, 0.3, 0.02, 0.4], [-0.1, 0.36, -0.06, -0.3]].forEach(([x, y, z, tilt]) => {
      const fruit = mesh(new THREE.SphereGeometry(0.09 * s, 6, 5), mat(0x6a3d9e), x, y, z);
      fruit.scale.set(0.8, 1.6, 0.8);
      fruit.rotation.z = tilt;
      g.add(fruit);
    });
    return g;
  },

  watermelon(stage) {
    const g = new THREE.Group();
    if (stage === 0) return sprout(1);
    if (stage === 1) { g.add(leafCrown(1, GREEN)); return g; }
    g.add(leafCrown(0.8, GREEN));
    const s = stage === 2 ? 0.5 : 1;
    const melon = mesh(new THREE.SphereGeometry(0.26 * s, 8, 6), mat(stage === 2 ? 0x9ec95d : 0x3e7d3a), 0, 0.2 * s, 0.06);
    melon.scale.set(1.15, 0.95, 1);
    g.add(melon);
    g.add(mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.1, 5), mat(0x6b8f3e), 0, 0.42 * s, 0.06));
    return g;
  },

  pineapple(stage) {
    const g = new THREE.Group();
    if (stage === 0) return sprout(0.9);
    if (stage === 1) { g.add(leafCrown(0.9, 0x7da35c)); return g; }
    const s = stage === 2 ? 0.6 : 1;
    const body = mesh(new THREE.SphereGeometry(0.17 * s, 7, 6), mat(stage === 2 ? 0xc9c96a : 0xe8a53d), 0, 0.2 * s, 0);
    body.scale.y = 1.35;
    g.add(body);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      const spike = mesh(new THREE.ConeGeometry(0.035 * s, 0.22 * s, 4), mat(DARKGREEN),
        Math.cos(a) * 0.05 * s, 0.48 * s, Math.sin(a) * 0.05 * s);
      spike.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
      g.add(spike);
    }
    return g;
  },

  starfruit(stage) {
    const g = new THREE.Group();
    if (stage === 0) return sprout(0.9);
    if (stage === 1) { g.add(leafCrown(0.8, 0xa8a05a)); return g; }
    const s = stage === 2 ? 0.6 : 1;
    const star = mesh(
      new THREE.DodecahedronGeometry(0.17 * s),
      mat(0xf7c948, { emissive: 0xc98a12, emissiveIntensity: stage === 3 ? 0.55 : 0.2, roughness: 0.35 }),
      0, 0.17 * s + 0.14, 0
    );
    star.userData.spin = true;
    g.add(star, leafCrown(0.7, 0xa8a05a));
    return g;
  },

  rainbow(stage) {
    const g = new THREE.Group();
    if (stage === 0) return sprout(0.9);
    if (stage === 1) { g.add(leafCrown(0.85, 0x6fae9e)); return g; }
    const s = stage === 2 ? 0.6 : 1;
    const cluster = new THREE.Group();
    [[0xe0364a, 0, 0.3], [0x3d9be0, 2.1, 0.28], [0x9ee05a, 4.2, 0.26]].forEach(([color, a, y]) => {
      cluster.add(mesh(
        new THREE.SphereGeometry(0.09 * s, 6, 5),
        mat(color, { emissive: color, emissiveIntensity: stage === 3 ? 0.35 : 0.1 }),
        Math.cos(a) * 0.1 * s, y * s, Math.sin(a) * 0.1 * s
      ));
    });
    cluster.userData.spin = true;
    g.add(cluster, leafCrown(0.75, 0x6fae9e));
    return g;
  },

  crystal(stage) {
    const g = new THREE.Group();
    if (stage === 0) return sprout(0.9);
    if (stage === 1) { g.add(leafCrown(0.8, 0x7a6fb0)); return g; }
    const size = stage === 2 ? 0.14 : 0.24;
    const gem = mesh(
      new THREE.OctahedronGeometry(size),
      mat(0xb35de0, { emissive: 0x7a2fa8, emissiveIntensity: stage === 3 ? 0.5 : 0.2, roughness: 0.3 }),
      0, size + 0.15, 0
    );
    gem.userData.spin = true;
    g.add(gem, leafCrown(0.7, 0x7a6fb0));
    return g;
  },
};

export function createPlantMesh(seedId, stage) {
  const g = builders[seedId](stage);
  if (stage === 3) g.userData.bob = true; // 成熟作物轻轻弹跳提示可收获
  return g;
}

// 稀有品质镀层：保留原色，罩一层淡金/淡银的金属光
export function applyPlating(group, quality) {
  if (!quality) return;
  const tint = new THREE.Color(quality === 'gold' ? 0xf7cf6a : 0xc9d6e4);
  const glow = quality === 'gold' ? 0.28 : 0.16;
  const amount = quality === 'gold' ? 0.5 : 0.32; // 银色淡淡罩一层就好，别盖掉原色
  group.traverse(o => {
    if (o.isMesh) {
      o.material.color.lerp(tint, amount);
      o.material.roughness = 0.35;
      o.material.emissive = tint.clone().multiplyScalar(glow);
      o.material.emissiveIntensity = 1;
    }
  });
}

/* ================= 装饰 ================= */

const decorBuilders = {
  fence() {
    const g = new THREE.Group();
    const m = mat(WOOD);
    [-0.3, 0, 0.3].forEach(x => g.add(mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), m, x, 0.22, 0)));
    [0.15, 0.32].forEach(y => g.add(mesh(new THREE.BoxGeometry(0.85, 0.06, 0.05), m, 0, y, 0)));
    return g;
  },
  flower() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.2, 7), mat(0xd07a4a), 0, 0.1, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 5), mat(DARKGREEN), 0, 0.3, 0));
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      g.add(mesh(new THREE.SphereGeometry(0.06, 5, 4), mat(0xf2a7c3), Math.cos(a) * 0.09, 0.45, Math.sin(a) * 0.09));
    }
    g.add(mesh(new THREE.SphereGeometry(0.06, 5, 4), mat(0xf7d154), 0, 0.47, 0));
    return g;
  },
  scarecrow() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.7, 5), mat(WOOD), 0, 0.35, 0));
    g.add(mesh(new THREE.BoxGeometry(0.55, 0.06, 0.06), mat(WOOD), 0, 0.5, 0));
    g.add(mesh(new THREE.SphereGeometry(0.13, 7, 6), mat(0xf3d9a4), 0, 0.78, 0));
    g.add(mesh(new THREE.ConeGeometry(0.17, 0.16, 7), mat(0xc9a144), 0, 0.93, 0));
    return g;
  },
  lamp() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.65, 6), mat(0x5a5a66), 0, 0.32, 0));
    const bulb = mesh(new THREE.SphereGeometry(0.11, 7, 6),
      mat(0xffe9a0, { emissive: 0xffc94a, emissiveIntensity: 0.9 }), 0, 0.7, 0);
    bulb.userData.lampBulb = true;
    g.add(bulb);
    // 夜晚才点亮的真实光源，白天强度归零；范围小、强度低，照亮一小圈就好
    const light = new THREE.PointLight(0xffd27a, 0, 3.5, 2);
    light.position.set(0, 0.72, 0);
    light.userData.lampLight = true;
    g.add(light);
    return g;
  },
  windmill() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.8, 6), mat(0xd9534f), 0, 0.4, 0));
    const blades = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const b = mesh(new THREE.BoxGeometry(0.34, 0.09, 0.02), mat(0xfff3d6), 0.18, 0, 0);
      const holder = new THREE.Group();
      holder.rotation.z = (k / 4) * Math.PI * 2;
      holder.add(b);
      blades.add(holder);
    }
    blades.position.set(0, 0.82, 0.07);
    blades.userData.windmill = true;
    g.add(blades);
    return g;
  },
};

export function createDecorMesh(id) {
  return decorBuilders[id]();
}

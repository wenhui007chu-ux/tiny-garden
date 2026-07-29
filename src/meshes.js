import * as THREE from 'three';
import { GRID, TILE, UPPER_Y, UPPER_Z, LAWN_R, houseSkinColor } from './config.js';

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

/* ================= 杂交室 ================= */

export function createHybridLab() {
  const g = new THREE.Group();
  const wall = mat(0xe8f0ec);
  // 圆形实验室基座 + 玻璃穹顶
  g.add(mesh(new THREE.CylinderGeometry(1.7, 1.85, 1.3, 12), wall, 0, 0.65, 0));
  const dome = mesh(new THREE.SphereGeometry(1.6, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
    mat(0xa8e0d0, { transparent: true, opacity: 0.45, roughness: 0.15 }), 0, 1.3, 0);
  g.add(dome);
  // 门和门框
  g.add(mesh(new THREE.BoxGeometry(0.7, 1.1, 0.1), mat(0x4a8a72), 0, 0.55, 1.78));
  g.add(mesh(new THREE.BoxGeometry(0.85, 0.12, 0.14), mat(0x3a6a58), 0, 1.15, 1.78));
  // 穹顶里的双螺旋（DNA，会转）
  const helix = new THREE.Group();
  for (let k = 0; k < 8; k++) {
    const y = 0.15 + k * 0.16;
    const a = k * 0.8;
    [[a, 0x5ce0a0], [a + Math.PI, 0xe0a05c]].forEach(([ang, c]) => {
      helix.add(mesh(new THREE.SphereGeometry(0.09, 6, 5), mat(c, { emissive: c, emissiveIntensity: 0.3 }),
        Math.cos(ang) * 0.35, y, Math.sin(ang) * 0.35));
    });
    helix.add(mesh(new THREE.BoxGeometry(0.66, 0.03, 0.03), mat(0xd4e8e0), 0, y, 0).rotateY(a));
  }
  helix.position.y = 1.2;
  helix.userData.spin = true;
  g.add(helix);
  // 侧边试管架
  [[-1.4, 0x5ce0a0], [-1.15, 0xe05c8a], [-0.9, 0x5ca0e0]].forEach(([x, c]) => {
    g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.35, 6),
      mat(c, { transparent: true, opacity: 0.75, emissive: c, emissiveIntensity: 0.35 }), x, 1.45, 0.9));
  });
  g.traverse(o => { if (o.isMesh) o.userData.hybridLab = true; });
  return g;
}

/* ================= 宠物间 ================= */

// 岛上的宠物小屋（点击进入）
export function createPetHouse() {
  const g = new THREE.Group();
  const wall = mat(0xf7e0c8);
  const roof = mat(0xe0846a);
  g.add(mesh(new THREE.BoxGeometry(2.8, 1.9, 2.4), wall, 0, 0.95, 0));
  const r = mesh(new THREE.ConeGeometry(2.3, 1.2, 4), roof, 0, 2.5, 0);
  r.rotation.y = Math.PI / 4;
  g.add(r);
  // 圆拱门 + 小爪印招牌
  g.add(mesh(new THREE.BoxGeometry(0.8, 1.1, 0.1), mat(0xb06a4a), 0, 0.55, 1.22));
  g.add(mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 12, 1, false, 0, Math.PI), mat(0xb06a4a), 0, 1.1, 1.22).rotateX(Math.PI / 2));
  [[0.75, 1.35], [-0.75, 1.35]].forEach(([x, y]) =>
    g.add(mesh(new THREE.BoxGeometry(0.6, 0.5, 0.08), mat(0xbfe3f0), x, y, 1.22)));
  const paw = new THREE.Group();
  paw.add(mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(0xf2a7c3), 0, 0, 0));
  [[-0.14, 0.16], [0, 0.2], [0.14, 0.16]].forEach(([x, y]) =>
    paw.add(mesh(new THREE.SphereGeometry(0.07, 6, 5), mat(0xf2a7c3), x, y, 0)));
  paw.position.set(0, 3.2, 0);
  paw.userData.spin = true;
  g.add(paw);
  g.traverse(o => { if (o.isMesh) o.userData.petHouse = true; });
  return g;
}

// 宠物间内部
export function createPetInterior() {
  const g = new THREE.Group();
  const W = 11, D = 9;
  g.add(mesh(new THREE.BoxGeometry(W, 0.3, D), mat(0xe8d4b8), 0, -0.15, 0));
  for (let k = -4; k <= 4; k++) {
    g.add(mesh(new THREE.BoxGeometry(0.04, 0.02, D), mat(0xd4bc9c), k * 1.1, 0.01, 0));
  }
  g.add(mesh(new THREE.BoxGeometry(W, 3.6, 0.3), mat(0xfdf0e0), 0, 1.8, -D / 2 + 0.15));
  g.add(mesh(new THREE.BoxGeometry(0.3, 3.6, D), mat(0xfdf0e0), -W / 2 + 0.15, 1.8, 0));
  // 展示台（宠物站这儿）
  g.add(mesh(new THREE.CylinderGeometry(1.25, 1.4, 0.3, 14), mat(0xf2e2cc), 0, 0.15, -1.6));
  g.add(mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.06, 14), mat(0xf7d9a8, { emissive: 0xd9a860, emissiveIntensity: 0.2 }), 0, 0.32, -1.6));
  // 后墙小窗
  [-3, 3].forEach(x =>
    g.add(mesh(new THREE.BoxGeometry(1.5, 1.2, 0.1), mat(0xbfe3f0, { emissive: 0x89b8d4, emissiveIntensity: 0.35 }), x, 2, -D / 2 + 0.25)));
  [[-3, 0], [3, 0], [0, 3]].forEach(([x, z]) => {
    const l = new THREE.PointLight(0xffe8c8, 0.5, 16, 1.8);
    l.position.set(x, 3.2, z);
    g.add(l);
  });
  return g;
}

// 20 只宠物的模型
const petKinds = {
  chick(c1, c2) {
    const g = new THREE.Group();
    const b = mesh(new THREE.SphereGeometry(0.3, 9, 7), mat(c1), 0, 0.3, 0);
    b.scale.set(1, 0.9, 0.95);
    g.add(b);
    g.add(mesh(new THREE.SphereGeometry(0.21, 9, 7), mat(c1), 0, 0.62, 0.02));
    g.add(mesh(new THREE.ConeGeometry(0.07, 0.14, 5), mat(c2), 0, 0.6, 0.24).rotateX(Math.PI / 2));
    [[-0.08], [0.08]].forEach(([x]) => g.add(mesh(new THREE.SphereGeometry(0.03, 5, 4), mat(0x2a2a30), x, 0.68, 0.19)));
    [[-0.1], [0.1]].forEach(([x]) => g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 4), mat(c2), x, 0.07, 0)));
    return g;
  },
  bunny(c1, c2) {
    const g = new THREE.Group();
    const b = mesh(new THREE.SphereGeometry(0.28, 9, 7), mat(c1), 0, 0.28, 0);
    b.scale.set(1, 0.95, 1.15);
    g.add(b);
    g.add(mesh(new THREE.SphereGeometry(0.2, 9, 7), mat(c1), 0, 0.6, 0.14));
    [[-0.08], [0.08]].forEach(([x]) => {
      const ear = mesh(new THREE.SphereGeometry(0.06, 6, 5), mat(c1), x, 0.85, 0.1);
      ear.scale.set(0.7, 2.6, 0.5);
      g.add(ear);
      g.add(mesh(new THREE.SphereGeometry(0.025, 5, 4), mat(0x2a2a30), x * 1.6, 0.63, 0.3));
    });
    g.add(mesh(new THREE.SphereGeometry(0.045, 6, 5), mat(c2), 0, 0.58, 0.33));
    g.add(mesh(new THREE.SphereGeometry(0.1, 7, 6), mat(0xf5f0e6), 0, 0.3, -0.3));
    return g;
  },
  piglet(c1, c2) {
    const g = new THREE.Group();
    const b = mesh(new THREE.SphereGeometry(0.32, 9, 7), mat(c1), 0, 0.32, 0);
    b.scale.set(1.25, 0.95, 1);
    g.add(b);
    g.add(mesh(new THREE.SphereGeometry(0.22, 9, 7), mat(c1), 0.32, 0.42, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 8), mat(c2), 0.52, 0.4, 0).rotateZ(Math.PI / 2));
    [[-0.1, 0.6], [0.1, 0.6]].forEach(([z]) => {
      const ear = mesh(new THREE.ConeGeometry(0.08, 0.14, 4), mat(c2), 0.28, 0.6, z);
      g.add(ear);
    });
    [[-0.16, 0.16], [0.16, 0.16], [-0.16, -0.16], [0.16, -0.16]].forEach(([x, z]) =>
      g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 6), mat(c1), x, 0.08, z)));
    return g;
  },
  lamb(c1, c2) {
    const g = new THREE.Group();
    [[0, 0.35, 0, 0.26], [-0.2, 0.4, 0.1, 0.17], [0.2, 0.4, -0.1, 0.17], [0, 0.5, 0.15, 0.16]].forEach(([x, y, z, r]) =>
      g.add(mesh(new THREE.SphereGeometry(r, 8, 6), mat(c1), x, y, z)));
    g.add(mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(c2), 0.3, 0.52, 0));
    [[-0.08], [0.08]].forEach(([z]) => g.add(mesh(new THREE.SphereGeometry(0.06, 6, 5), mat(c2), 0.28, 0.66, z)));
    [[-0.14, 0.12], [0.14, 0.12], [-0.14, -0.12], [0.14, -0.12]].forEach(([x, z]) =>
      g.add(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.2, 5), mat(c2), x, 0.1, z)));
    return g;
  },
  cat(c1, c2, def) {
    const g = new THREE.Group();
    const glowOpt = def?.glow ? { emissive: c1, emissiveIntensity: def.glow } : {};
    const b = mesh(new THREE.SphereGeometry(0.3, 9, 7), mat(c1, glowOpt), 0, 0.3, 0);
    b.scale.set(1, 0.9, 1.25);
    g.add(b);
    g.add(mesh(new THREE.SphereGeometry(0.22, 9, 7), mat(c1, glowOpt), 0, 0.62, 0.22));
    [[-0.13], [0.13]].forEach(([x]) => {
      const ear = mesh(new THREE.ConeGeometry(0.09, 0.18, 4), mat(c1, glowOpt), x, 0.82, 0.2);
      g.add(ear);
    });
    [[-0.08], [0.08]].forEach(([x]) => g.add(mesh(new THREE.SphereGeometry(0.035, 6, 5), mat(c2), x, 0.66, 0.4)));
    const tail = mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.5, 6), mat(c1, glowOpt), 0, 0.5, -0.32);
    tail.rotation.x = 0.7;
    g.add(tail);
    [[-0.14, 0.16], [0.14, 0.16], [-0.14, -0.14], [0.14, -0.14]].forEach(([x, z]) =>
      g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 6), mat(c1, glowOpt), x, 0.07, z)));
    return g;
  },
  dog(c1, c2) {
    const g = new THREE.Group();
    const b = mesh(new THREE.SphereGeometry(0.32, 9, 7), mat(c1), 0, 0.32, 0);
    b.scale.set(1, 0.95, 1.3);
    g.add(b);
    g.add(mesh(new THREE.SphereGeometry(0.24, 9, 7), mat(c1), 0, 0.66, 0.26));
    g.add(mesh(new THREE.SphereGeometry(0.12, 7, 6), mat(c2), 0, 0.58, 0.44));
    g.add(mesh(new THREE.SphereGeometry(0.05, 6, 5), mat(0x2a2a30), 0, 0.6, 0.54));
    [[-0.16], [0.16]].forEach(([x]) => {
      const ear = mesh(new THREE.ConeGeometry(0.09, 0.2, 4), mat(c1), x, 0.84, 0.22);
      ear.rotation.z = x > 0 ? -0.3 : 0.3;
      g.add(ear);
    });
    const tail = mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.35, 5), mat(c1), 0, 0.55, -0.35);
    tail.rotation.x = -0.9;
    g.add(tail);
    [[-0.15, 0.2], [0.15, 0.2], [-0.15, -0.16], [0.15, -0.16]].forEach(([x, z]) =>
      g.add(mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.16, 6), mat(c1), x, 0.08, z)));
    return g;
  },
  fox(c1, c2) {
    const g = new THREE.Group();
    const b = mesh(new THREE.SphereGeometry(0.28, 9, 7), mat(c1), 0, 0.3, 0);
    b.scale.set(1, 0.9, 1.3);
    g.add(b);
    g.add(mesh(new THREE.SphereGeometry(0.21, 9, 7), mat(c1), 0, 0.62, 0.24));
    g.add(mesh(new THREE.ConeGeometry(0.1, 0.24, 6), mat(c2), 0, 0.58, 0.46).rotateX(Math.PI / 2));
    [[-0.13], [0.13]].forEach(([x]) => g.add(mesh(new THREE.ConeGeometry(0.1, 0.24, 4), mat(c1), x, 0.85, 0.2)));
    const tail = mesh(new THREE.SphereGeometry(0.18, 8, 6), mat(c2), 0, 0.4, -0.42);
    tail.scale.set(0.8, 0.8, 1.8);
    g.add(tail);
    [[-0.13, 0.18], [0.13, 0.18], [-0.13, -0.14], [0.13, -0.14]].forEach(([x, z]) =>
      g.add(mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.16, 5), mat(0x3a2a24), x, 0.08, z)));
    return g;
  },
  panda(c1, c2) {
    const g = new THREE.Group();
    const b = mesh(new THREE.SphereGeometry(0.34, 9, 7), mat(c1), 0, 0.34, 0);
    b.scale.set(1, 1, 0.95);
    g.add(b);
    g.add(mesh(new THREE.SphereGeometry(0.26, 9, 7), mat(c1), 0, 0.74, 0.06));
    [[-0.17], [0.17]].forEach(([x]) => g.add(mesh(new THREE.SphereGeometry(0.1, 7, 6), mat(c2), x, 0.94, 0)));
    [[-0.1], [0.1]].forEach(([x]) => {
      const patch = mesh(new THREE.SphereGeometry(0.075, 7, 6), mat(c2), x, 0.76, 0.21);
      patch.scale.set(1, 1.2, 0.4);
      g.add(patch);
    });
    g.add(mesh(new THREE.SphereGeometry(0.04, 6, 5), mat(c2), 0, 0.7, 0.26));
    [[-0.2, 0.1], [0.2, 0.1]].forEach(([x, z]) => g.add(mesh(new THREE.SphereGeometry(0.11, 7, 6), mat(c2), x, 0.3, z)));
    [[-0.15, 0.14], [0.15, 0.14]].forEach(([x, z]) => g.add(mesh(new THREE.SphereGeometry(0.1, 7, 6), mat(c2), x, 0.1, z)));
    return g;
  },
  owl(c1, c2) {
    const g = new THREE.Group();
    const b = mesh(new THREE.SphereGeometry(0.32, 9, 7), mat(c1), 0, 0.4, 0);
    b.scale.set(1, 1.25, 0.9);
    g.add(b);
    [[-0.13], [0.13]].forEach(([x]) => {
      g.add(mesh(new THREE.SphereGeometry(0.11, 8, 6), mat(0xf5f0e6), x, 0.62, 0.24));
      g.add(mesh(new THREE.SphereGeometry(0.06, 6, 5), mat(c2), x, 0.62, 0.31));
      g.add(mesh(new THREE.SphereGeometry(0.03, 5, 4), mat(0x2a2a30), x, 0.62, 0.35));
      g.add(mesh(new THREE.ConeGeometry(0.07, 0.16, 4), mat(c1), x * 1.4, 0.82, 0));
    });
    g.add(mesh(new THREE.ConeGeometry(0.05, 0.12, 4), mat(c2), 0, 0.5, 0.3).rotateX(Math.PI / 2));
    [[-0.24], [0.24]].forEach(([x]) => {
      const wing = mesh(new THREE.SphereGeometry(0.13, 7, 6), mat(c1), x, 0.38, 0);
      wing.scale.set(0.5, 1.5, 0.8);
      g.add(wing);
    });
    return g;
  },
  peacock(c1, c2) {
    const g = new THREE.Group();
    // 开屏的尾羽
    for (let k = 0; k < 9; k++) {
      const a = (k / 8 - 0.5) * Math.PI * 0.9;
      const f = mesh(new THREE.SphereGeometry(0.1, 6, 5), mat(k % 2 ? c2 : c1), Math.sin(a) * 0.5, 0.62 + Math.cos(a) * 0.42, -0.3);
      f.scale.set(0.6, 1.5, 0.25);
      f.rotation.z = -a;
      g.add(f);
      g.add(mesh(new THREE.SphereGeometry(0.045, 5, 4), mat(0x2a6a9a), Math.sin(a) * 0.62, 0.62 + Math.cos(a) * 0.55, -0.28));
    }
    const b = mesh(new THREE.SphereGeometry(0.22, 9, 7), mat(c1), 0, 0.34, 0.05);
    b.scale.set(1, 1.1, 1);
    g.add(b);
    g.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.3, 6), mat(c1), 0, 0.62, 0.12));
    g.add(mesh(new THREE.SphereGeometry(0.11, 8, 6), mat(c1), 0, 0.8, 0.14));
    g.add(mesh(new THREE.ConeGeometry(0.04, 0.1, 4), mat(0xf2c94c), 0, 0.79, 0.25).rotateX(Math.PI / 2));
    return g;
  },
  deer(c1, c2) {
    const g = new THREE.Group();
    const b = mesh(new THREE.SphereGeometry(0.26, 9, 7), mat(c1), 0, 0.5, 0);
    b.scale.set(1, 0.9, 1.35);
    g.add(b);
    g.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.3, 6), mat(c1), 0, 0.72, 0.2).rotateX(-0.4));
    g.add(mesh(new THREE.SphereGeometry(0.15, 8, 6), mat(c1), 0, 0.88, 0.32));
    g.add(mesh(new THREE.SphereGeometry(0.05, 6, 5), mat(0x2a2a30), 0, 0.85, 0.45));
    // 鹿角
    [[-0.08], [0.08]].forEach(([x]) => {
      g.add(mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.26, 4), mat(c2), x, 1.06, 0.28).rotateZ(x > 0 ? -0.3 : 0.3));
      g.add(mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.16, 4), mat(c2), x * 2, 1.18, 0.28).rotateZ(x > 0 ? -0.8 : 0.8));
    });
    [[-0.13, 0.2], [0.13, 0.2], [-0.13, -0.18], [0.13, -0.18]].forEach(([x, z]) =>
      g.add(mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.42, 5), mat(c1), x, 0.21, z)));
    return g;
  },
  wolf(c1, c2) {
    const g = new THREE.Group();
    const b = mesh(new THREE.SphereGeometry(0.3, 9, 7), mat(c1), 0, 0.42, 0);
    b.scale.set(1, 0.95, 1.4);
    g.add(b);
    g.add(mesh(new THREE.SphereGeometry(0.22, 9, 7), mat(c1), 0, 0.68, 0.3));
    g.add(mesh(new THREE.ConeGeometry(0.11, 0.26, 6), mat(c2), 0, 0.63, 0.5).rotateX(Math.PI / 2));
    [[-0.13], [0.13]].forEach(([x]) => g.add(mesh(new THREE.ConeGeometry(0.08, 0.2, 4), mat(c1), x, 0.88, 0.26)));
    [[-0.08], [0.08]].forEach(([x]) => g.add(mesh(new THREE.SphereGeometry(0.03, 5, 4), mat(0xf2c94c), x, 0.72, 0.44)));
    const tail = mesh(new THREE.SphereGeometry(0.13, 7, 6), mat(c2), 0, 0.5, -0.46);
    tail.scale.set(0.8, 0.8, 1.9);
    g.add(tail);
    [[-0.15, 0.22], [0.15, 0.22], [-0.15, -0.18], [0.15, -0.18]].forEach(([x, z]) =>
      g.add(mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.3, 6), mat(c1), x, 0.15, z)));
    return g;
  },
  turtle(c1, c2) {
    const g = new THREE.Group();
    const shell = mesh(new THREE.SphereGeometry(0.4, 10, 7), mat(c2), 0, 0.3, 0);
    shell.scale.set(1.15, 0.6, 1);
    g.add(shell);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      g.add(mesh(new THREE.SphereGeometry(0.09, 6, 5), mat(c1), Math.cos(a) * 0.22, 0.44, Math.sin(a) * 0.19));
    }
    g.add(mesh(new THREE.SphereGeometry(0.15, 8, 6), mat(c1), 0, 0.26, 0.42));
    [[-0.08], [0.08]].forEach(([x]) => g.add(mesh(new THREE.SphereGeometry(0.025, 5, 4), mat(0x2a2a30), x, 0.3, 0.53)));
    [[-0.26, 0.2], [0.26, 0.2], [-0.26, -0.2], [0.26, -0.2]].forEach(([x, z]) => {
      const foot = mesh(new THREE.SphereGeometry(0.1, 6, 5), mat(c1), x, 0.12, z);
      foot.scale.set(1, 0.6, 1.2);
      g.add(foot);
    });
    return g;
  },
  dragon(c1, c2, def) {
    const g = new THREE.Group();
    const glowOpt = { emissive: c1, emissiveIntensity: def?.glow ?? 0.3 };
    const b = mesh(new THREE.SphereGeometry(0.3, 9, 7), mat(c1, glowOpt), 0, 0.4, 0);
    b.scale.set(1, 1, 1.35);
    g.add(b);
    g.add(mesh(new THREE.SphereGeometry(0.22, 9, 7), mat(c1, glowOpt), 0, 0.72, 0.28));
    g.add(mesh(new THREE.ConeGeometry(0.1, 0.2, 5), mat(c1, glowOpt), 0, 0.68, 0.48).rotateX(Math.PI / 2));
    // 犄角与翅膀
    [[-0.09], [0.09]].forEach(([x]) => g.add(mesh(new THREE.ConeGeometry(0.05, 0.22, 4), mat(c2), x, 0.94, 0.2).rotateZ(x > 0 ? -0.4 : 0.4)));
    [[-1], [1]].forEach(([s]) => {
      const wing = mesh(new THREE.SphereGeometry(0.28, 7, 5), mat(c2, { transparent: true, opacity: 0.85 }), s * 0.34, 0.62, -0.1);
      wing.scale.set(0.25, 1.1, 0.9);
      wing.rotation.z = s * 0.5;
      g.add(wing);
    });
    const tail = mesh(new THREE.ConeGeometry(0.12, 0.6, 6), mat(c1, glowOpt), 0, 0.4, -0.5);
    tail.rotation.x = -Math.PI / 2 + 0.4;
    g.add(tail);
    [[-0.14, 0.18], [0.14, 0.18], [-0.14, -0.16], [0.14, -0.16]].forEach(([x, z]) =>
      g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 6), mat(c1, glowOpt), x, 0.1, z)));
    return g;
  },
  phoenix(c1, c2, def) {
    const g = new THREE.Group();
    const glowOpt = { emissive: c1, emissiveIntensity: def?.glow ?? 0.5 };
    const b = mesh(new THREE.SphereGeometry(0.26, 9, 7), mat(c1, glowOpt), 0, 0.44, 0);
    b.scale.set(1, 1.2, 1);
    g.add(b);
    g.add(mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(c1, glowOpt), 0, 0.76, 0.1));
    g.add(mesh(new THREE.ConeGeometry(0.05, 0.14, 4), mat(0xf2c94c), 0, 0.74, 0.26).rotateX(Math.PI / 2));
    // 火焰冠羽和尾羽
    [[0, 0.98, 0.06], [-0.1, 0.94, 0.02], [0.1, 0.94, 0.02]].forEach(([x, y, z]) => {
      const f = mesh(new THREE.ConeGeometry(0.05, 0.24, 4), mat(c2, { emissive: c2, emissiveIntensity: 0.7 }), x, y, z);
      f.userData.flame = true;
      g.add(f);
    });
    for (let k = 0; k < 5; k++) {
      const a = (k / 4 - 0.5) * 1.2;
      const f = mesh(new THREE.ConeGeometry(0.07, 0.55, 4), mat(k % 2 ? c2 : c1, { emissive: c2, emissiveIntensity: 0.5 }), Math.sin(a) * 0.3, 0.5, -0.42);
      f.rotation.set(0.9, 0, -a);
      g.add(f);
    }
    [[-1], [1]].forEach(([s]) => {
      const wing = mesh(new THREE.SphereGeometry(0.26, 7, 5), mat(c2, { emissive: c2, emissiveIntensity: 0.4 }), s * 0.3, 0.5, 0);
      wing.scale.set(0.25, 1, 1.1);
      wing.rotation.z = s * 0.6;
      g.add(wing);
    });
    return g;
  },
  unicorn(c1, c2, def) {
    const g = new THREE.Group();
    const glowOpt = { emissive: c1, emissiveIntensity: def?.glow ?? 0.3 };
    const b = mesh(new THREE.SphereGeometry(0.28, 9, 7), mat(c1, glowOpt), 0, 0.5, 0);
    b.scale.set(1, 0.9, 1.4);
    g.add(b);
    g.add(mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.34, 6), mat(c1, glowOpt), 0, 0.76, 0.22).rotateX(-0.35));
    g.add(mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(c1, glowOpt), 0, 0.94, 0.36));
    // 独角与鬃毛
    const horn = mesh(new THREE.ConeGeometry(0.045, 0.32, 6), mat(0xf2c94c, { emissive: 0xe0b64a, emissiveIntensity: 0.6 }), 0, 1.16, 0.34);
    horn.userData.spin = true;
    g.add(horn);
    for (let k = 0; k < 4; k++) {
      g.add(mesh(new THREE.SphereGeometry(0.07, 6, 5), mat(c2, { emissive: c2, emissiveIntensity: 0.3 }), 0, 0.96 - k * 0.11, 0.2 - k * 0.06));
    }
    const tail = mesh(new THREE.SphereGeometry(0.13, 7, 6), mat(c2, { emissive: c2, emissiveIntensity: 0.3 }), 0, 0.5, -0.44);
    tail.scale.set(0.7, 1.4, 0.7);
    g.add(tail);
    [[-0.13, 0.22], [0.13, 0.22], [-0.13, -0.2], [0.13, -0.2]].forEach(([x, z]) =>
      g.add(mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.42, 6), mat(c1, glowOpt), x, 0.21, z)));
    return g;
  },
  kirin(c1, c2, def) {
    const g = new THREE.Group();
    const glowOpt = { emissive: c1, emissiveIntensity: def?.glow ?? 0.5 };
    const b = mesh(new THREE.SphereGeometry(0.3, 9, 7), mat(c1, glowOpt), 0, 0.48, 0);
    b.scale.set(1, 1, 1.35);
    g.add(b);
    g.add(mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.3, 6), mat(c1, glowOpt), 0, 0.76, 0.24).rotateX(-0.4));
    g.add(mesh(new THREE.SphereGeometry(0.18, 8, 6), mat(c1, glowOpt), 0, 0.94, 0.38));
    [[-0.09], [0.09]].forEach(([x]) => g.add(mesh(new THREE.ConeGeometry(0.05, 0.24, 5), mat(c2, { emissive: c2, emissiveIntensity: 0.6 }), x, 1.14, 0.32).rotateZ(x > 0 ? -0.3 : 0.3)));
    // 周身灵光
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      const orb = mesh(new THREE.SphereGeometry(0.055, 6, 5), mat(c2, { emissive: c2, emissiveIntensity: 0.9 }), Math.cos(a) * 0.45, 0.55 + Math.sin(a * 2) * 0.2, Math.sin(a) * 0.45);
      orb.userData.spin = true;
      g.add(orb);
    }
    const tail = mesh(new THREE.ConeGeometry(0.1, 0.5, 6), mat(c2, { emissive: c2, emissiveIntensity: 0.4 }), 0, 0.55, -0.44);
    tail.rotation.x = -Math.PI / 2 + 0.6;
    g.add(tail);
    [[-0.14, 0.2], [0.14, 0.2], [-0.14, -0.18], [0.14, -0.18]].forEach(([x, z]) =>
      g.add(mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.38, 6), mat(c1, glowOpt), x, 0.19, z)));
    return g;
  },
};

export function createPetMesh(def) {
  const g = petKinds[def.kind](def.c1, def.c2, def);
  if (def.glow) {
    const l = new THREE.PointLight(def.c1, 0.5, 4, 2);
    l.position.y = 0.7;
    g.add(l);
  }
  return g;
}

// 10 种宠物间装饰，每种三级外观
const petDecorKinds = {
  petbed(lv) {
    const g = new THREE.Group();
    if (lv === 1) { // 草编窝
      g.add(mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.18, 12), mat(0xd9c48a), 0, 0.09, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.06, 12), mat(0xe8d9a8), 0, 0.16, 0));
      return g;
    }
    if (lv === 2) { // 软垫窝
      g.add(mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.22, 12), mat(0xc98a9a), 0, 0.11, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 12), mat(0xf2d4d8), 0, 0.21, 0));
      return g;
    }
    // 豪华四柱床
    g.add(mesh(new THREE.BoxGeometry(1.3, 0.16, 1.0), mat(0x8a5a35), 0, 0.08, 0));
    g.add(mesh(new THREE.BoxGeometry(1.15, 0.14, 0.88), mat(0xf2d4d8), 0, 0.23, 0));
    g.add(mesh(new THREE.BoxGeometry(0.5, 0.1, 0.4), mat(0xffffff), -0.32, 0.34, 0));
    [[-0.58, -0.42], [0.58, -0.42], [-0.58, 0.42], [0.58, 0.42]].forEach(([x, z]) =>
      g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.95, 6), mat(0x8a5a35), x, 0.55, z)));
    g.add(mesh(new THREE.BoxGeometry(1.35, 0.08, 1.05), mat(0xc98a9a), 0, 1.02, 0));
    return g;
  },
  bowl(lv) {
    const g = new THREE.Group();
    if (lv === 1) {
      g.add(mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.12, 10), mat(0x8ac0d8), 0, 0.06, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 10), mat(0xd9a05a), 0, 0.11, 0));
      return g;
    }
    if (lv === 2) { // 陶瓷双碗
      g.add(mesh(new THREE.BoxGeometry(0.62, 0.06, 0.34), mat(0xc9a97e), 0, 0.03, 0));
      [[-0.15, 0x5aa8d0, 0xd9a05a], [0.15, 0xe0648a, 0x7ec4e8]].forEach(([x, c, food]) => {
        g.add(mesh(new THREE.CylinderGeometry(0.15, 0.11, 0.13, 10), mat(c), x, 0.11, 0));
        g.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 10), mat(food), x, 0.17, 0));
      });
      return g;
    }
    // 自动喂食器
    g.add(mesh(new THREE.BoxGeometry(0.4, 0.55, 0.34), mat(0xe8e8ee), 0, 0.28, -0.12));
    g.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.34, 10), mat(0xd9a05a, { transparent: true, opacity: 0.7 }), 0, 0.62, -0.12));
    g.add(mesh(new THREE.BoxGeometry(0.5, 0.06, 0.3), mat(0xe8e8ee), 0, 0.03, 0.14));
    g.add(mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.11, 10), mat(0x5aa8d0), 0, 0.1, 0.14));
    g.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 10), mat(0xd9a05a), 0, 0.16, 0.14));
    g.add(mesh(new THREE.BoxGeometry(0.16, 0.1, 0.02), mat(0x6ae0a0, { emissive: 0x4ac080, emissiveIntensity: 0.6 }), 0, 0.4, 0.06));
    return g;
  },
  ball(lv) {
    const g = new THREE.Group();
    const mkBall = (r, c1, c2, x, z) => {
      const b = mesh(new THREE.SphereGeometry(r, 9, 7), mat(c1), x, r, z);
      b.userData.spin = true;
      g.add(b);
      for (let k = 0; k < 3; k++) {
        g.add(mesh(new THREE.TorusGeometry(r, 0.015, 5, 12), mat(c2), x, r, z).rotateY(k * 1));
      }
    };
    if (lv === 1) { mkBall(0.15, 0xe0648a, 0xf0a0b8, 0, 0); return g; }
    if (lv === 2) { mkBall(0.17, 0xe0648a, 0xf0a0b8, -0.12, 0); mkBall(0.13, 0x5aa8d0, 0x8ac8e8, 0.18, 0.12); return g; }
    // 逗猫棒套装
    mkBall(0.15, 0xe0648a, 0xf0a0b8, -0.25, 0.1);
    mkBall(0.12, 0x6ac08a, 0x8ad0a8, -0.05, -0.15);
    const rod = mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.9, 5), mat(0x9a6a42), 0.25, 0.45, 0);
    rod.rotation.z = 0.4;
    g.add(rod);
    [[0.42, 0.82], [0.5, 0.76], [0.36, 0.74]].forEach(([x, y]) =>
      g.add(mesh(new THREE.ConeGeometry(0.05, 0.16, 4), mat(0xf2c94c), x, y, 0)));
    return g;
  },
  cattree(lv) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), mat(0xc9a97e), 0, 0.05, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, lv === 1 ? 0.7 : 1.2, 8), mat(0xd9c4a0), 0, lv === 1 ? 0.4 : 0.65, 0));
    if (lv === 1) { // 单层架
      g.add(mesh(new THREE.BoxGeometry(0.66, 0.1, 0.66), mat(0xc9a97e), 0, 0.78, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 12), mat(0xe0b0a0), 0, 0.86, 0));
      return g;
    }
    g.add(mesh(new THREE.BoxGeometry(0.7, 0.1, 0.7), mat(0xc9a97e), 0, 1.25, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.7, 8), mat(0xd9c4a0), 0.22, 1.6, 0.15));
    g.add(mesh(new THREE.SphereGeometry(0.3, 9, 7, 0, Math.PI * 2, 0, Math.PI * 0.6), mat(0xe0b0a0), 0.22, 1.95, 0.15));
    if (lv === 3) { // 顶天猫别墅：加一层带窝的塔楼和吊球
      g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8), mat(0xd9c4a0), -0.28, 1.65, -0.12));
      g.add(mesh(new THREE.BoxGeometry(0.62, 0.55, 0.62), mat(0xc9a97e), -0.28, 2.3, -0.12));
      g.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 10), mat(0x3a3a44), -0.28, 2.3, 0.2).rotateX(Math.PI / 2));
      g.add(mesh(new THREE.BoxGeometry(0.9, 0.1, 0.5), mat(0xc9a97e), 0.1, 2.62, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 4), mat(0xf0a0b8), 0.42, 2.4, 0));
      const hang = mesh(new THREE.SphereGeometry(0.11, 8, 6), mat(0xe0648a), 0.42, 2.16, 0);
      hang.userData.spin = true;
      g.add(hang);
    }
    return g;
  },
  petplant(lv) {
    const g = new THREE.Group();
    if (lv === 1) {
      g.add(mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.26, 8), mat(0xd07a4a), 0, 0.13, 0));
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        const leaf = mesh(new THREE.SphereGeometry(0.11, 6, 5), mat(0x5c9b52), Math.cos(a) * 0.12, 0.38, Math.sin(a) * 0.12);
        leaf.scale.set(0.8, 1.5, 0.4);
        g.add(leaf);
      }
      return g;
    }
    if (lv === 2) { // 龟背竹
      g.add(mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.34, 8), mat(0xd07a4a), 0, 0.17, 0));
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        const h = 0.6 + (k % 3) * 0.22;
        g.add(mesh(new THREE.CylinderGeometry(0.02, 0.025, h, 4), mat(0x4a7a42), Math.cos(a) * 0.1, 0.34 + h / 2, Math.sin(a) * 0.1));
        const leaf = mesh(new THREE.SphereGeometry(0.19, 7, 6), mat(0x3d8a45), Math.cos(a) * 0.2, 0.34 + h, Math.sin(a) * 0.2);
        leaf.scale.set(1, 0.25, 1);
        g.add(leaf);
      }
      return g;
    }
    // 室内绿植墙
    g.add(mesh(new THREE.BoxGeometry(1.5, 1.6, 0.14), mat(0xb08a5a), 0, 0.8, -0.1));
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
      const leaf = mesh(new THREE.SphereGeometry(0.14, 6, 5), mat([0x3d8a45, 0x5c9b52, 0x6aae5e][(r + c) % 3]),
        -0.6 + c * 0.3, 0.22 + r * 0.42, 0.02);
      leaf.scale.set(1, 0.9, 0.5);
      g.add(leaf);
    }
    [[-0.5], [0.5]].forEach(([x]) => g.add(mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.22, 8), mat(0xd07a4a), x, 0.11, 0.16)));
    return g;
  },
  petrug(lv) {
    const g = new THREE.Group();
    const rings = lv === 1 ? [[0.75, 0xe8c8b8]]
      : lv === 2 ? [[0.95, 0xe8b4a0], [0.6, 0xffeee0]]
      : [[1.15, 0xc4566a], [0.85, 0xe8b4a0], [0.55, 0xf2d4c4], [0.28, 0xffeee0]];
    rings.forEach(([r, c], k) =>
      g.add(mesh(new THREE.CylinderGeometry(r, r, 0.04, 18), mat(c), 0, 0.02 + k * 0.008, 0)));
    if (lv === 3) { // 流苏边
      for (let k = 0; k < 20; k++) {
        const a = (k / 20) * Math.PI * 2;
        g.add(mesh(new THREE.BoxGeometry(0.1, 0.02, 0.03), mat(0xe0b64a), Math.cos(a) * 1.2, 0.02, Math.sin(a) * 1.2).rotateY(-a));
      }
    }
    return g;
  },
  perch(lv) {
    const g = new THREE.Group();
    const w = lv === 3 ? 1.8 : 1.2;
    g.add(mesh(new THREE.BoxGeometry(w, 0.12, 0.5), mat(0xc9a97e), 0, 0.9, 0));
    [[-w / 2 + 0.1], [w / 2 - 0.1]].forEach(([x]) => g.add(mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), mat(0xb08a5a), x, 0.45, 0)));
    if (lv >= 2) g.add(mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 12), mat(0xf2d4d8), 0, 1.02, 0));
    if (lv === 3) { // 全景观景台：加窗框和第二层
      g.add(mesh(new THREE.BoxGeometry(1.9, 1.5, 0.08), mat(0xbfe3f0, { transparent: true, opacity: 0.5 }), 0, 1.6, -0.28));
      g.add(mesh(new THREE.BoxGeometry(1.95, 0.08, 0.12), mat(0x8a5a35), 0, 2.35, -0.28));
      g.add(mesh(new THREE.BoxGeometry(0.08, 1.55, 0.12), mat(0x8a5a35), 0, 1.6, -0.28));
      g.add(mesh(new THREE.BoxGeometry(0.7, 0.1, 0.45), mat(0xc9a97e), 0.55, 1.75, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 12), mat(0xe0b0a0), 0.55, 1.85, 0));
    }
    return g;
  },
  petfount(lv) {
    const g = new THREE.Group();
    if (lv === 1) { // 小水盆
      g.add(mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.14, 10), mat(0xe0e6ea), 0, 0.07, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.05, 10), mat(0x7ec4e8, { transparent: true, opacity: 0.75 }), 0, 0.13, 0));
      return g;
    }
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.16, 10), mat(0xe0e6ea), 0, 0.08, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 10), mat(0x7ec4e8, { transparent: true, opacity: 0.75 }), 0, 0.17, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.34, 8), mat(0xe0e6ea), 0, 0.32, 0));
    const spout = mesh(new THREE.SphereGeometry(0.08, 7, 6), mat(0x9ed4f0, { transparent: true, opacity: 0.8 }), 0, 0.52, 0);
    spout.userData.spin = true;
    g.add(spout);
    if (lv === 3) { // 三层流水泉
      g.add(mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 10), mat(0xe0e6ea), 0, 0.6, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 10), mat(0x7ec4e8, { transparent: true, opacity: 0.7 }), 0, 0.65, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.28, 8), mat(0xe0e6ea), 0, 0.8, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 10), mat(0xe0e6ea), 0, 0.96, 0));
      const top = mesh(new THREE.SphereGeometry(0.09, 7, 6), mat(0x9ed4f0, { transparent: true, opacity: 0.85, emissive: 0x5aa8d0, emissiveIntensity: 0.3 }), 0, 1.06, 0);
      top.userData.spin = true;
      g.add(top);
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2;
        g.add(mesh(new THREE.SphereGeometry(0.04, 5, 4), mat(0x9ed4f0, { transparent: true, opacity: 0.6 }),
          Math.cos(a) * 0.2, 0.78, Math.sin(a) * 0.2));
      }
    }
    return g;
  },
  toybox(lv) {
    const g = new THREE.Group();
    const w = lv === 1 ? 0.55 : 0.7;
    g.add(mesh(new THREE.BoxGeometry(w, 0.42, w * 0.72), mat(0xd9a05a), 0, 0.21, 0));
    g.add(mesh(new THREE.BoxGeometry(w + 0.04, 0.08, w * 0.72 + 0.04), mat(0xc08040), 0, 0.45, 0));
    if (lv === 1) { g.add(mesh(new THREE.SphereGeometry(0.09, 7, 6), mat(0xe0648a), 0, 0.54, 0.04)); return g; }
    [[0xe0648a, -0.15], [0x5aa8d0, 0.08], [0xf2c94c, 0.24]].forEach(([c, x], k) =>
      g.add(mesh(new THREE.SphereGeometry(0.1, 7, 6), mat(c), x, 0.55 + (k % 2) * 0.05, 0.05)));
    if (lv === 3) { // 游乐架：隧道 + 拱门
      g.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 12, 1, true), mat(0x6ac08a, { side: 2 }), 0.85, 0.3, 0).rotateZ(Math.PI / 2));
      g.add(mesh(new THREE.TorusGeometry(0.32, 0.05, 6, 14, Math.PI), mat(0xe0648a), -0.75, 0.02, 0).rotateY(Math.PI / 2));
      g.add(mesh(new THREE.SphereGeometry(0.12, 8, 6), mat(0xf2c94c), -0.75, 0.42, 0));
    }
    return g;
  },
  petlamp(lv) {
    const g = new THREE.Group();
    if (lv === 1) { // 小夜灯
      g.add(mesh(new THREE.BoxGeometry(0.28, 0.08, 0.2), mat(0xb08a5a), 0, 0.04, 0));
      g.add(mesh(new THREE.SphereGeometry(0.16, 9, 7), mat(0xffe0a8, { emissive: 0xffc060, emissiveIntensity: 0.6 }), 0, 0.22, 0));
      const l = new THREE.PointLight(0xffd090, 0.35, 3.5, 2);
      l.position.set(0, 0.25, 0);
      g.add(l);
      return g;
    }
    if (lv === 2) { // 落地暖灯
      g.add(mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.08, 10), mat(0xb08a5a), 0, 0.04, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.3, 6), mat(0xc9a97e), 0, 0.68, 0));
      g.add(mesh(new THREE.ConeGeometry(0.34, 0.36, 10), mat(0xffe0a8, { emissive: 0xffc060, emissiveIntensity: 0.5 }), 0, 1.42, 0));
      const l = new THREE.PointLight(0xffd090, 0.6, 6, 2);
      l.position.set(0, 1.3, 0);
      g.add(l);
      return g;
    }
    // 水晶吊灯
    g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 5), mat(0xe0b64a), 0, 2.15, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.34, 0.1, 0.3, 10), mat(0xe0b64a, { emissive: 0xc09020, emissiveIntensity: 0.3 }), 0, 1.75, 0));
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const crystal = mesh(new THREE.OctahedronGeometry(0.075),
        mat(0xf7f2ea, { emissive: 0xffd8a0, emissiveIntensity: 0.7, transparent: true, opacity: 0.9 }),
        Math.cos(a) * 0.3, 1.5 - (k % 3) * 0.12, Math.sin(a) * 0.3);
      crystal.userData.spin = true;
      g.add(crystal);
    }
    g.add(mesh(new THREE.SphereGeometry(0.13, 9, 7), mat(0xffe8b8, { emissive: 0xffc060, emissiveIntensity: 1 }), 0, 1.5, 0));
    const l = new THREE.PointLight(0xffd8a0, 1, 9, 2);
    l.position.set(0, 1.55, 0);
    g.add(l);
    return g;
  },
};

// 传说光环：所有 lv5 顶配共用的特效——一圈悬浮旋转的金色星芒 + 一盏暖光
function legendHalo(g, y = 1.7, r = 0.85, n = 6) {
  const lamp = new THREE.PointLight(0xffe6a0, 0.9, 7, 2);
  lamp.position.set(0, y, 0);
  g.add(lamp);
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const star = mesh(new THREE.OctahedronGeometry(0.075),
      mat(0xfff2c8, { emissive: 0xffcf5a, emissiveIntensity: 1, transparent: true, opacity: 0.95 }),
      Math.cos(a) * r, y + Math.sin(k * 1.7) * 0.16, Math.sin(a) * r);
    star.userData.spin = true;
    g.add(star);
  }
}

// ===== 宠物间装饰 第 4/5 级「顶配」造型（全新建模，不复用低级外观）=====
// lv4 = 鎏金豪华实体；lv5 = 换发光金质 + 顶部星空/水晶点缀 + 传说光环
const PET_HALO_Y = { petbed: 1.5, bowl: 0.95, ball: 1.15, cattree: 2.95, petplant: 1.8, petrug: 0.6, perch: 2.55, petfount: 1.4, toybox: 1.05, petlamp: 2.35 };
function petDecorLux(kind, lv) {
  const g = new THREE.Group();
  const lv5 = lv === 5;
  const GOLD = 0xe0b64a;
  // 主体材质：lv4 磨砂金，lv5 发光金
  const body = () => mat(lv5 ? 0xf2d98a : GOLD, lv5 ? { emissive: 0xc79a2a, emissiveIntensity: 0.35, metalness: 0.3, roughness: 0.4 } : { metalness: 0.25, roughness: 0.5 });
  const gem = (c) => mat(c, { emissive: c, emissiveIntensity: lv5 ? 0.7 : 0.3, transparent: true, opacity: 0.9 });
  switch (kind) {
    case 'petbed': { // 皇家顶篷大床 / 星空悬浮床
      g.add(mesh(new THREE.BoxGeometry(1.5, 0.18, 1.15), body(), 0, 0.09, 0));
      g.add(mesh(new THREE.BoxGeometry(1.32, 0.16, 0.96), mat(lv5 ? 0x9ec8ff : 0xf2d4d8, lv5 ? { emissive: 0x4a90c2, emissiveIntensity: 0.45 } : {}), 0, 0.25, 0));
      g.add(mesh(new THREE.BoxGeometry(0.55, 0.13, 0.5), mat(0xffffff), -0.4, 0.37, 0));
      [[-0.68, -0.5], [0.68, -0.5], [-0.68, 0.5], [0.68, 0.5]].forEach(([x, z]) =>
        g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.15, 8), body(), x, 0.62, z)));
      g.add(mesh(new THREE.BoxGeometry(1.62, 0.1, 1.27), body(), 0, 1.18, 0));
      if (lv5) g.add(mesh(new THREE.ConeGeometry(0.95, 0.55, 4), mat(0x5a3f9e, { emissive: 0x3a2a7e, emissiveIntensity: 0.55 }), 0, 1.5, 0).rotateY(0.78));
      break;
    }
    case 'bowl': { // 智能餐台 / 黄金自助环
      g.add(mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.1, 16), body(), 0, 0.05, 0));
      const n = 4;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        g.add(mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.12, 10), body(), Math.cos(a) * 0.3, 0.16, Math.sin(a) * 0.3));
        g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 10), gem([0xd9a05a, 0x7ec4e8, 0xe0648a, 0x6ac08a][k]), Math.cos(a) * 0.3, 0.22, Math.sin(a) * 0.3));
      }
      g.add(mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.45, 8), body(), 0, 0.32, 0));
      g.add(mesh(new THREE.SphereGeometry(0.14, 10, 8), gem(lv5 ? 0x6ae0ff : 0xbfe3f0), 0, 0.6, 0));
      break;
    }
    case 'ball': { // 弹簧逗猫乐园 / 激光旋转塔
      g.add(mesh(new THREE.CylinderGeometry(0.4, 0.44, 0.08, 16), body(), 0, 0.04, 0));
      [[-0.22, 0xe0648a], [0.2, 0x5aa8d0], [0.05, 0x6ac08a]].forEach(([x, c], k) => {
        const b = mesh(new THREE.SphereGeometry(0.13, 9, 7), gem(c), x, 0.18 + k * 0.02, (k - 1) * 0.15);
        b.userData.spin = true; g.add(b);
      });
      const pole = mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.9, 6), body(), 0.28, 0.5, 0.1); pole.rotation.z = 0.35; g.add(pole);
      const tip = mesh(new THREE.OctahedronGeometry(0.1), gem(lv5 ? 0xff5a5a : 0xf2c94c), 0.5, 0.86, 0.1); tip.userData.spin = true; g.add(tip);
      break;
    }
    case 'cattree': { // 三层猫堡 / 发光摩天猫塔
      g.add(mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.12, 14), body(), 0, 0.06, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.7, 10), body(), 0, 1.4, 0));
      [[0.75, 0.35], [1.5, -0.32], [2.3, 0.25]].forEach(([y, x], k) => {
        g.add(mesh(new THREE.BoxGeometry(0.7, 0.1, 0.7), body(), x, y, 0));
        if (k === 1) g.add(mesh(new THREE.SphereGeometry(0.3, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), mat(lv5 ? 0xffb0c8 : 0xe0b0a0, lv5 ? { emissive: 0xc06080, emissiveIntensity: 0.4 } : {}), x, y + 0.05, 0));
        else g.add(mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.1, 12), gem(k === 0 ? 0xf0a0b8 : 0x9ed4f0), x, y + 0.1, 0));
      });
      g.add(mesh(new THREE.ConeGeometry(0.4, 0.5, 8), body(), 0.25, 2.75, 0));
      break;
    }
    case 'petplant': { // 巨型盆景 / 发光仙境花树
      g.add(mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.4, 12), body(), 0, 0.2, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.09, 0.13, 1.3, 6), mat(0x8a5a35), 0, 1.0, 0));
      [[0, 1.7, 0, 0.5], [0.35, 1.45, 0.1, 0.32], [-0.32, 1.5, -0.1, 0.3], [0.1, 1.95, 0, 0.28]].forEach(([x, y, z, r]) =>
        g.add(mesh(new THREE.SphereGeometry(r, 8, 7), mat(lv5 ? 0x8fe0a0 : 0x4a9a52, lv5 ? { emissive: 0x2a8a4a, emissiveIntensity: 0.4 } : {}), x, y, z)));
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        g.add(mesh(new THREE.SphereGeometry(0.07, 7, 6), gem(lv5 ? 0xff9ad0 : 0xf2a7c3), Math.cos(a) * 0.42, 1.6 + Math.sin(k) * 0.2, Math.sin(a) * 0.42));
      }
      break;
    }
    case 'petrug': { // 星纹波斯毯 / 魔法光环毯
      const rings = [[1.35, 0xa8433a], [1.05, GOLD], [0.75, 0xe8b4a0], [0.42, 0xf2d4c4]];
      rings.forEach(([r, c], k) => g.add(mesh(new THREE.CylinderGeometry(r, r, 0.04, 24), lv5 && k % 2 === 0 ? gem(c) : mat(c), 0, 0.02 + k * 0.006, 0)));
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        g.add(mesh(new THREE.BoxGeometry(0.12, 0.02, 0.03), body(), Math.cos(a) * 1.4, 0.02, Math.sin(a) * 1.4).rotateY(-a));
      }
      if (lv5) for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const rune = mesh(new THREE.TorusGeometry(0.08, 0.02, 5, 8), gem(0x9ed4f0), Math.cos(a) * 0.9, 0.06, Math.sin(a) * 0.9);
        rune.rotation.x = Math.PI / 2; rune.userData.spin = true; g.add(rune);
      }
      break;
    }
    case 'perch': { // 豪华飘窗 / 全景玻璃观景塔
      [[-0.85], [0.85]].forEach(([x]) => g.add(mesh(new THREE.BoxGeometry(0.12, 1.0, 0.12), body(), x, 0.5, 0)));
      g.add(mesh(new THREE.BoxGeometry(2.0, 0.14, 0.6), body(), 0, 1.0, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.14, 14), mat(lv5 ? 0xffb0c8 : 0xf2d4d8, lv5 ? { emissive: 0xc06080, emissiveIntensity: 0.4 } : {}), 0, 1.14, 0));
      g.add(mesh(new THREE.BoxGeometry(2.1, 1.7, 0.08), gem(lv5 ? 0x9ec8ff : 0xbfe3f0), 0, 2.0, -0.3));
      g.add(mesh(new THREE.BoxGeometry(2.15, 0.1, 0.14), body(), 0, 2.85, -0.3));
      g.add(mesh(new THREE.BoxGeometry(0.75, 0.12, 0.5), body(), 0.62, 1.55, 0.05));
      break;
    }
    case 'petfount': { // 四层叠泉 / 水晶发光泉
      const tiers = [[0.4, 0.1], [0.3, 0.55], [0.22, 0.9], [0.15, 1.2]];
      tiers.forEach(([r, y]) => {
        g.add(mesh(new THREE.CylinderGeometry(r, r + 0.04, 0.1, 12), body(), 0, y, 0));
        g.add(mesh(new THREE.CylinderGeometry(r - 0.04, r - 0.04, 0.04, 12), gem(0x7ec4e8), 0, y + 0.07, 0));
      });
      g.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.15, 8), body(), 0, 0.7, 0));
      const top = mesh(new THREE.OctahedronGeometry(0.14), gem(lv5 ? 0x6ae0ff : 0x9ed4f0), 0, 1.4, 0); top.userData.spin = true; g.add(top);
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; g.add(mesh(new THREE.SphereGeometry(0.04, 5, 4), gem(0x9ed4f0), Math.cos(a) * 0.3, 0.3, Math.sin(a) * 0.3)); }
      break;
    }
    case 'toybox': { // 猫咪游乐场 / 梦幻旋转木马
      g.add(mesh(new THREE.CylinderGeometry(0.6, 0.66, 0.12, 16), body(), 0, 0.06, 0));
      const tunnel = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 14, 1, true), mat(lv5 ? 0x8fe0b0 : 0x6ac08a, { side: 2, ...(lv5 ? { emissive: 0x3a9a6a, emissiveIntensity: 0.35 } : {}) }), 0.7, 0.35, 0); tunnel.rotation.z = Math.PI / 2; g.add(tunnel);
      g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 8), body(), -0.35, 0.55, 0));
      const roof = mesh(new THREE.ConeGeometry(0.5, 0.4, 8), gem(0xe0648a), -0.35, 1.15, 0); g.add(roof);
      [[0, 0xe0648a], [1, 0x5aa8d0], [2, 0xf2c94c]].forEach(([k, c]) => {
        const a = k * 2.1; const h = mesh(new THREE.SphereGeometry(0.1, 8, 6), gem(c), -0.35 + Math.cos(a) * 0.4, 0.75, Math.sin(a) * 0.4);
        h.userData.spin = true; g.add(h);
      });
      break;
    }
    case 'petlamp': { // 黄金枝形灯 / 星河水晶吊灯
      g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 5), body(), 0, 2.1, 0));
      g.add(mesh(new THREE.TorusGeometry(0.42, 0.05, 8, 20), body(), 0, 1.75, 0).rotateX(Math.PI / 2));
      g.add(mesh(new THREE.TorusGeometry(0.24, 0.045, 8, 16), body(), 0, 1.95, 0).rotateX(Math.PI / 2));
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        const cr = mesh(new THREE.OctahedronGeometry(0.08), mat(0xf7f2ea, { emissive: lv5 ? 0x9ed4ff : 0xffd8a0, emissiveIntensity: lv5 ? 0.9 : 0.6, transparent: true, opacity: 0.9 }), Math.cos(a) * 0.42, 1.55 - (k % 3) * 0.13, Math.sin(a) * 0.42);
        cr.userData.spin = true; g.add(cr);
      }
      g.add(mesh(new THREE.SphereGeometry(0.15, 10, 8), mat(0xffe8b8, { emissive: 0xffc060, emissiveIntensity: 1 }), 0, 1.5, 0));
      const l = new THREE.PointLight(lv5 ? 0xbfe0ff : 0xffd8a0, 1.2, 10, 2); l.position.set(0, 1.55, 0); g.add(l);
      break;
    }
  }
  if (lv5) legendHalo(g, PET_HALO_Y[kind] ?? 1.6, kind === 'petrug' ? 1.0 : 0.8);
  return g;
}

export function createPetDecorMesh(def, lv = 1) {
  if (lv >= 4) return petDecorLux(def.kind, lv);
  return petDecorKinds[def.kind](lv);
}

/* ================= 杂交室内部：实验大厅与培养罩 ================= */

// 5 个培养罩的站位（大厅局部坐标）
export const HYBRID_STATIONS = [[-4.4, -0.6], [-2.2, -2], [0, -2.6], [2.2, -2], [4.4, -0.6]];

export function createHybridInterior() {
  const g = new THREE.Group();
  const W = 14, D = 11;
  // 实验室地板（冷色调）+ 后墙左墙
  g.add(mesh(new THREE.BoxGeometry(W, 0.3, D), mat(0xdce8e4), 0, -0.15, 0));
  g.add(mesh(new THREE.BoxGeometry(W, 4.2, 0.3), mat(0xeef4f0), 0, 2.1, -D / 2 + 0.15));
  g.add(mesh(new THREE.BoxGeometry(0.3, 4.2, D), mat(0xeef4f0), -W / 2 + 0.15, 2.1, 0));
  // 后墙大屏幕（发着幽幽绿光）
  g.add(mesh(new THREE.BoxGeometry(4.2, 1.8, 0.1),
    mat(0x9ae0c8, { emissive: 0x4aa888, emissiveIntensity: 0.5 }), -3, 2.3, -D / 2 + 0.26));
  // 中央大 DNA 双螺旋
  const helix = new THREE.Group();
  for (let k = 0; k < 12; k++) {
    const y = 0.3 + k * 0.24;
    const a = k * 0.7;
    [[a, 0x5ce0a0], [a + Math.PI, 0xe0a05c]].forEach(([ang, c]) => {
      helix.add(mesh(new THREE.SphereGeometry(0.13, 7, 6), mat(c, { emissive: c, emissiveIntensity: 0.35 }),
        Math.cos(ang) * 0.55, y, Math.sin(ang) * 0.55));
    });
    helix.add(mesh(new THREE.BoxGeometry(1.05, 0.045, 0.045), mat(0xd4e8e0), 0, y, 0).rotateY(a));
  }
  helix.position.set(2.8, 0, -3);
  helix.userData.spin = true;
  g.add(helix);
  // 5 座培养台 + 玻璃罩
  HYBRID_STATIONS.forEach(([x, z]) => {
    g.add(mesh(new THREE.CylinderGeometry(0.72, 0.8, 0.5, 10), mat(0xc4d4ce), x, 0.25, z));
    g.add(mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.06, 10),
      mat(0xf2f7f4, { emissive: 0x88c8b0, emissiveIntensity: 0.25 }), x, 0.53, z));
    const dome = mesh(new THREE.SphereGeometry(0.58, 12, 9, 0, Math.PI * 2, 0, Math.PI * 0.55),
      mat(0xa8e0d0, { transparent: true, opacity: 0.32, roughness: 0.1 }), x, 0.56, z);
    g.add(dome);
  });
  // 顶灯
  [[-3.5, -1], [3.5, -1], [0, 2.5]].forEach(([x, z]) => {
    const l = new THREE.PointLight(0xd8fff0, 0.55, 18, 1.8);
    l.position.set(x, 3.6, z);
    g.add(l);
  });
  return g;
}

// 20 种杂交作物的 3D 模型（参数化生成）
const HYBRID_MODELS = {
  h1:  { kind: 'blob',   c1: 0xf07338, c2: 0x5ea25a },
  h2:  { kind: 'bulb',   c1: 0xb0895a, c2: 0xf07338 },
  h3:  { kind: 'blob',   c1: 0x8fbf6a, c2: 0xd9c9a8 },
  h4:  { kind: 'flower', c1: 0xe8483f, c2: 0x8fbf6a },
  h5:  { kind: 'bulb',   c1: 0xf2c94c, c2: 0xe8483f },
  h6:  { kind: 'cluster', c1: 0xf2a7c3, c2: 0xf2c94c },
  h7:  { kind: 'melon',  c1: 0xe8842f, c2: 0xf2a7c3 },
  h8:  { kind: 'melon',  c1: 0x6a3d9e, c2: 0xe0b64a },
  h9:  { kind: 'melon',  c1: 0x2a3a2a, c2: 0x3e7d3a },
  h10: { kind: 'crown',  c1: 0xe8a53d, c2: 0x3e7d3a },
  h11: { kind: 'bulb',   c1: 0xc8d0d8, c2: 0xe8483f, glow: 0.2 },
  h12: { kind: 'gem',    c1: 0xcfe0f0, c2: 0x9ec4e0, glow: 0.4 },
  h13: { kind: 'melon',  c1: 0x9ab8d0, c2: 0x4a90c2, glow: 0.3 },
  h14: { kind: 'gem',    c1: 0x6ae0d0, c2: 0x8fbf6a, glow: 0.4 },
  h15: { kind: 'flower', c1: 0xb35de0, c2: 0xe0b64a, glow: 0.3 },
  h16: { kind: 'melon',  c1: 0xe0b64a, c2: 0xc98a12, glow: 0.4 },
  h17: { kind: 'flame',  c1: 0xff8c1a, c2: 0xe0364a, glow: 0.6 },
  h18: { kind: 'star',   c1: 0xb35de0, c2: 0x4a90c2, glow: 0.6 },
  h19: { kind: 'gem',    c1: 0xf7f2e0, c2: 0xe0b64a, glow: 0.8, big: true },
  h20: { kind: 'seed',   c1: 0xfff4d8, c2: 0xb35de0, glow: 1 },
};

export function createHybridCrop(id) {
  const p = HYBRID_MODELS[id] ?? HYBRID_MODELS.h1;
  const glowOpt = p.glow ? { emissive: p.c1, emissiveIntensity: p.glow, roughness: 0.35 } : {};
  const g = new THREE.Group();
  const m1 = mat(p.c1, glowOpt);
  const m2 = mat(p.c2 ?? p.c1);
  switch (p.kind) {
    case 'blob': {
      const a = mesh(new THREE.SphereGeometry(0.2, 8, 6), m1, -0.08, 0.18, 0);
      const b = mesh(new THREE.SphereGeometry(0.15, 8, 6), m2, 0.13, 0.14, 0);
      g.add(a, b);
      break;
    }
    case 'bulb': {
      const cone = mesh(new THREE.ConeGeometry(0.17, 0.3, 7), m1, 0, 0.14, 0);
      cone.rotation.x = Math.PI;
      g.add(cone, mesh(new THREE.SphereGeometry(0.14, 8, 6), m2, 0, 0.37, 0));
      break;
    }
    case 'melon': {
      const body = mesh(new THREE.SphereGeometry(0.24, 9, 7), m1, 0, 0.22, 0);
      body.scale.y = 0.8;
      g.add(body);
      g.add(mesh(new THREE.TorusGeometry(0.24, 0.03, 6, 12), m2, 0, 0.22, 0).rotateX(Math.PI / 2));
      g.add(mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.1, 5), mat(0x6b8f3e), 0, 0.45, 0));
      break;
    }
    case 'cluster': {
      [[0, 0.32, 0.11], [-0.11, 0.16, 0.13], [0.11, 0.14, 0.12]].forEach(([x, y, r], k) =>
        g.add(mesh(new THREE.SphereGeometry(r, 7, 6), k === 0 ? m2 : m1, x, y, 0)));
      break;
    }
    case 'flower': {
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        const petal = mesh(new THREE.SphereGeometry(0.1, 6, 5), m1, Math.cos(a) * 0.14, 0.24, Math.sin(a) * 0.14);
        petal.scale.set(1.2, 0.5, 0.7);
        petal.rotation.y = -a;
        g.add(petal);
      }
      g.add(mesh(new THREE.SphereGeometry(0.09, 7, 6), m2, 0, 0.26, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.2, 5), mat(0x6b8f3e), 0, 0.1, 0));
      break;
    }
    case 'gem': {
      const size = p.big ? 0.26 : 0.2;
      const gem = mesh(new THREE.OctahedronGeometry(size), m1, 0, size + 0.1, 0);
      gem.userData.spin = true;
      g.add(gem, mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.08, 8), m2, 0, 0.04, 0));
      break;
    }
    case 'star': {
      const star = mesh(new THREE.DodecahedronGeometry(0.2), m1, 0, 0.32, 0);
      star.userData.spin = true;
      g.add(star, mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 12), m2, 0, 0.12, 0).rotateX(Math.PI / 2));
      break;
    }
    case 'flame': {
      const f = mesh(new THREE.ConeGeometry(0.15, 0.4, 6), m1, 0, 0.28, 0);
      f.userData.flame = true;
      g.add(f, mesh(new THREE.SphereGeometry(0.12, 7, 6), m2, 0, 0.08, 0));
      break;
    }
    case 'seed': {
      const orb = mesh(new THREE.SphereGeometry(0.16, 10, 8), m1, 0, 0.28, 0);
      orb.userData.spin = true;
      const ring = mesh(new THREE.TorusGeometry(0.26, 0.03, 6, 16), mat(p.c2, { emissive: p.c2, emissiveIntensity: 0.6 }), 0, 0.28, 0);
      ring.rotation.x = Math.PI / 2.4;
      ring.userData.spin = true;
      g.add(orb, ring);
      break;
    }
  }
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

/* ================= 水塘装饰（会动的） ================= */

const pondKinds = {
  duck(c, def) {
    const g = new THREE.Group();
    const body = mesh(new THREE.SphereGeometry(0.22, 8, 6), mat(c), 0, 0, 0);
    body.scale.set(1.3, 0.85, 1);
    g.add(body);
    g.add(mesh(new THREE.SphereGeometry(0.13, 7, 6), mat(def.head ?? c), 0.24, 0.16, 0));
    g.add(mesh(new THREE.ConeGeometry(0.05, 0.12, 5), mat(0xe8843f), 0.38, 0.14, 0).rotateZ(-Math.PI / 2));
    return g;
  },
  lily(c, def) {
    const g = new THREE.Group();
    const leaf = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 9, 1, false, 0, Math.PI * 1.8), mat(c), 0, 0, 0);
    g.add(leaf);
    if (def.double) g.add(mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 8, 1, false, 0, Math.PI * 1.8), mat(c), 0.45, 0.01, 0.3));
    return g;
  },
  lotus(c) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 9), mat(0x5c9b52), 0, 0, 0));
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const petal = mesh(new THREE.SphereGeometry(0.09, 6, 5), mat(c), Math.cos(a) * 0.12, 0.1, Math.sin(a) * 0.12);
      petal.scale.set(1, 1.4, 0.5);
      petal.rotation.y = -a;
      g.add(petal);
    }
    g.add(mesh(new THREE.SphereGeometry(0.06, 6, 5), mat(0xf2c94c), 0, 0.14, 0));
    return g;
  },
  buoy(c) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.SphereGeometry(0.16, 8, 7), mat(c), 0, 0.04, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 5), mat(0x5a5a66), 0, 0.25, 0));
    g.add(mesh(new THREE.BoxGeometry(0.14, 0.09, 0.02), mat(c), 0.07, 0.34, 0));
    return g;
  },
  turtle(c) {
    const g = new THREE.Group();
    const shell = mesh(new THREE.SphereGeometry(0.2, 8, 6), mat(c), 0, 0.02, 0);
    shell.scale.set(1.2, 0.6, 1);
    g.add(shell);
    g.add(mesh(new THREE.SphereGeometry(0.08, 6, 5), mat(0x8aae6a), 0.26, 0.02, 0));
    return g;
  },
  frog(c) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 8), mat(0x5c9b52), 0, 0, 0)); // 脚下荷叶
    const body = mesh(new THREE.SphereGeometry(0.13, 7, 6), mat(c), 0, 0.1, 0);
    body.scale.set(1.1, 0.85, 1);
    g.add(body);
    [[-0.06], [0.06]].forEach(([x]) => {
      g.add(mesh(new THREE.SphereGeometry(0.045, 6, 5), mat(c), x, 0.21, 0.06));
      g.add(mesh(new THREE.SphereGeometry(0.02, 5, 4), mat(0x2a2a30), x, 0.22, 0.09));
    });
    return g;
  },
  reed(c) {
    const g = new THREE.Group();
    for (let k = 0; k < 5; k++) {
      const h = 0.5 + (k % 3) * 0.2;
      const stem = mesh(new THREE.CylinderGeometry(0.015, 0.025, h, 4), mat(c), (k - 2) * 0.09, h / 2, (k % 2) * 0.1);
      stem.rotation.z = (k - 2) * 0.08;
      g.add(stem);
      if (k % 2 === 0) g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 5), mat(0x8a5a35), (k - 2) * 0.09, h + 0.06, (k % 2) * 0.1));
    }
    return g;
  },
  koi(c, def) {
    const g = new THREE.Group();
    const body = mesh(new THREE.SphereGeometry(0.18, 8, 6), mat(c, def.glow ? { emissive: c, emissiveIntensity: 0.25 } : {}), 0, 0, 0);
    body.scale.set(1.7, 0.7, 0.8);
    g.add(body);
    const tail = mesh(new THREE.ConeGeometry(0.1, 0.22, 5), mat(c), -0.34, 0, 0);
    tail.rotation.z = Math.PI / 2;
    g.add(tail);
    g.add(mesh(new THREE.SphereGeometry(0.05, 5, 4), mat(0xf5f0e6), 0.1, 0.1, 0.06));
    if (def.scale) g.scale.setScalar(def.scale);
    return g;
  },
  boat(c) {
    const g = new THREE.Group();
    const hull = mesh(new THREE.CylinderGeometry(0.5, 0.32, 0.26, 8, 1, false, 0, Math.PI), mat(c), 0, 0.05, 0);
    hull.rotation.z = Math.PI;
    hull.scale.set(1.5, 1, 0.7);
    g.add(hull);
    g.add(mesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), mat(0x8a5a35), 0, 0.35, 0));
    return g;
  },
  dragonfly(c) {
    const g = new THREE.Group();
    const body = mesh(new THREE.CylinderGeometry(0.03, 0.015, 0.4, 5), mat(c), 0, 0, 0);
    body.rotation.z = Math.PI / 2;
    g.add(body);
    [[-0.05, 0.12], [0.08, 0.12], [-0.05, -0.12], [0.08, -0.12]].forEach(([x, z]) => {
      const wing = mesh(new THREE.SphereGeometry(0.09, 6, 4), mat(0xd8ecf5, { transparent: true, opacity: 0.6 }), x, 0.03, z);
      wing.scale.set(1.6, 0.15, 0.5);
      g.add(wing);
    });
    return g;
  },
  bird(c) {
    const g = new THREE.Group();
    // 站在小石头上的水鸟
    g.add(mesh(new THREE.DodecahedronGeometry(0.16), mat(0xa8a095), 0, 0, 0));
    [[-0.03], [0.04]].forEach(([x]) => g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 4), mat(0xe8843f), x, 0.25, 0)));
    const body = mesh(new THREE.SphereGeometry(0.14, 8, 6), mat(c), 0, 0.48, 0);
    body.scale.set(1.3, 1, 0.9);
    g.add(body);
    g.add(mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.22, 5), mat(c), 0.1, 0.66, 0).rotateZ(-0.4));
    g.add(mesh(new THREE.SphereGeometry(0.07, 6, 5), mat(c), 0.2, 0.76, 0));
    g.add(mesh(new THREE.ConeGeometry(0.02, 0.12, 4), mat(0xe8843f), 0.3, 0.75, 0).rotateZ(-Math.PI / 2));
    return g;
  },
  lantern(c) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 8), mat(0x5c9b52), 0, 0, 0));
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      const petal = mesh(new THREE.SphereGeometry(0.08, 6, 5), mat(c), Math.cos(a) * 0.1, 0.08, Math.sin(a) * 0.1);
      petal.scale.set(1, 1.3, 0.5);
      g.add(petal);
    }
    g.add(mesh(new THREE.SphereGeometry(0.05, 6, 5),
      mat(0xffd27a, { emissive: 0xffb838, emissiveIntensity: 1 }), 0, 0.12, 0));
    const glow = new THREE.PointLight(0xffb838, 0.4, 2.5, 2);
    glow.position.y = 0.3;
    g.add(glow);
    return g;
  },
  island(c) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.16, 9), mat(0x9a7a55), 0, 0, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.05, 9), mat(c), 0, 0.1, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.3, 4), mat(0x8a5a35), 0.08, 0.28, 0));
    g.add(mesh(new THREE.ConeGeometry(0.16, 0.3, 6), mat(0x4a8a52), 0.08, 0.52, 0));
    return g;
  },
  swan(c, def) {
    const g = new THREE.Group();
    const body = mesh(new THREE.SphereGeometry(0.26, 9, 7), mat(c, def.glow ? { emissive: c, emissiveIntensity: 0.2, roughness: 0.4 } : {}), 0, 0.05, 0);
    body.scale.set(1.4, 0.9, 1);
    g.add(body);
    const neck = mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.42, 6), mat(c), 0.3, 0.32, 0);
    neck.rotation.z = -0.35;
    g.add(neck);
    g.add(mesh(new THREE.SphereGeometry(0.08, 7, 6), mat(c), 0.42, 0.52, 0));
    g.add(mesh(new THREE.ConeGeometry(0.03, 0.12, 4), mat(0xe8843f), 0.52, 0.51, 0).rotateZ(-Math.PI / 2));
    const wing = mesh(new THREE.SphereGeometry(0.16, 7, 5), mat(c), -0.08, 0.16, 0);
    wing.scale.set(1.2, 0.6, 0.9);
    g.add(wing);
    return g;
  },
  fountain(c) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.5, 0.56, 0.2, 10), mat(c), 0, 0, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.5, 8), mat(c), 0, 0.3, 0));
    // 喷起的水柱和水花
    g.add(mesh(new THREE.CylinderGeometry(0.045, 0.03, 0.55, 6),
      mat(0x7ec4e8, { transparent: true, opacity: 0.7 }), 0, 0.8, 0));
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      const drop = mesh(new THREE.SphereGeometry(0.05, 5, 4),
        mat(0x9ed4f0, { transparent: true, opacity: 0.7 }), Math.cos(a) * 0.2, 1, Math.sin(a) * 0.2);
      drop.userData.spin = true;
      g.add(drop);
    }
    return g;
  },
  wheel(c) {
    const g = new THREE.Group();
    [[-0.35], [0.35]].forEach(([z]) => g.add(mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), mat(c), 0, 0.2, z)));
    const wheelG = new THREE.Group();
    wheelG.add(mesh(new THREE.TorusGeometry(0.45, 0.05, 6, 12), mat(c), 0, 0, 0));
    for (let k = 0; k < 6; k++) {
      const spoke = mesh(new THREE.BoxGeometry(0.85, 0.05, 0.12), mat(c), 0, 0, 0);
      spoke.rotation.z = (k / 6) * Math.PI;
      wheelG.add(spoke);
    }
    wheelG.position.y = 0.55;
    wheelG.userData.windmill = true; // 复用风车的持续转动动画
    g.add(wheelG);
    return g;
  },
  jelly(c, def) {
    const g = new THREE.Group();
    const dome = mesh(new THREE.SphereGeometry(0.24, 9, 7, 0, Math.PI * 2, 0, Math.PI * 0.55),
      mat(c, { transparent: true, opacity: 0.65, emissive: c, emissiveIntensity: 0.5 }), 0, 0, 0);
    g.add(dome);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      g.add(mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.34, 4),
        mat(c, { transparent: true, opacity: 0.5 }), Math.cos(a) * 0.12, -0.2, Math.sin(a) * 0.12));
    }
    const glow = new THREE.PointLight(c, 0.5, 3, 2);
    g.add(glow);
    return g;
  },
};

// 三个槽位的锚点（塘内局部坐标）
export const POND_SPOTS = [[0, 0], [1.7, -1.2], [-1.6, 1.5]];

export function createPondDecor(def, slot) {
  const g = pondKinds[def.kind](def.color, def);
  const [ax, az] = POND_SPOTS[slot];
  const baseY = def.kind === 'dragonfly' || def.kind === 'jelly' ? 1 : 0.28;
  g.position.set(ax, baseY, az);
  g.userData.pondAnim = {
    ...def.anim,
    y: baseY, cx: def.anim.type === 'circle' ? 0 : ax, cz: def.anim.type === 'circle' ? 0 : az,
    phase: slot * 2.1,
  };
  return g;
}

/* ================= 房子内部：3D 房间与家具 ================= */

export function createInteriorRoom(skin = {}) {
  const c = (part) => houseSkinColor(part, skin[part]);
  const g = new THREE.Group();
  const wallMat = mat(c('wallpaper')); // 墙纸可换色
  const floorColor = c('floor');       // 地板可换色
  const lightColor = c('light');       // 灯光色调可换
  const S = 25.3, half = S / 2; // 又扩了 3 倍的豪宅大厅
  // 木地板 + 拼缝
  g.add(mesh(new THREE.BoxGeometry(S, 0.3, S), mat(floorColor), 0, -0.15, 0));
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
  // 四盏顶灯照亮大厅（灯光色调可换）
  [[-6, -6], [6, -6], [-6, 6], [6, 6]].forEach(([x, z]) => {
    const lamp = new THREE.PointLight(lightColor, 0.6, 22, 1.8);
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

// ===== 小屋家具 第 4/5 级「顶配」造型（全新建模，不复用低级外观）=====
// lv4 = 鎏金豪华放大版；lv5 = 发光金质 + 幻彩点缀 + 传说光环。均按「正面朝 +Z」建模，贴墙旋转交给外层。
const FURN_HALO_Y = { bed: 1.75, wardrobe: 2.9, mirror: 2.7, teddy: 1.9, fire: 2.0, art: 3.0, sofa: 1.5, rug: 0.6, teatable: 1.2, tv: 2.5, floorlamp: 2.35, aquarium: 1.8, shelf: 3.0, clock: 3.0, statue: 2.2, safe: 2.6, piano: 1.9, harp: 2.5, table: 1.5, kitchen: 2.3, cabinet: 2.8, rocker: 2.0, plant: 2.3, bath: 1.4, arcade: 2.5, telescope: 2.1 };
function furnitureLux(id, lv) {
  const g = new THREE.Group();
  const lv5 = lv === 5;
  const GOLD = 0xe0b64a;
  const body = () => mat(lv5 ? 0xf2d98a : GOLD, lv5 ? { emissive: 0xc79a2a, emissiveIntensity: 0.35, metalness: 0.3, roughness: 0.4 } : { metalness: 0.25, roughness: 0.5 });
  const wood = mat(0x7a4e2d);
  const gem = (c) => mat(c, { emissive: c, emissiveIntensity: lv5 ? 0.75 : 0.3, transparent: true, opacity: 0.9 });
  const glass = mat(0xa8d8f0, { transparent: true, opacity: 0.35, roughness: 0.1 });
  switch (id) {
    case 'bed': { // 鎏金雕花大床 / 星空天蓬床
      g.add(mesh(new THREE.BoxGeometry(2.5, 0.35, 1.6), body(), 0, 0.2, 0));
      g.add(mesh(new THREE.BoxGeometry(2.3, 0.24, 1.4), mat(lv5 ? 0x9ec8ff : 0xf5efe2, lv5 ? { emissive: 0x4a90c2, emissiveIntensity: 0.4 } : {}), 0, 0.46, 0));
      g.add(mesh(new THREE.BoxGeometry(1.3, 0.14, 1.3), mat(lv5 ? 0xd97a9a : 0xd96a6a), -0.5, 0.6, 0));
      [[0.9, 0.35], [0.9, -0.35]].forEach(([x, z]) => g.add(mesh(new THREE.BoxGeometry(0.5, 0.16, 0.5), mat(0xffffff), x, 0.62, z)));
      [[-1.15, -0.7], [1.15, -0.7], [-1.15, 0.7], [1.15, 0.7]].forEach(([x, z]) => g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.5, 8), body(), x, 0.75, z)));
      g.add(mesh(new THREE.BoxGeometry(2.6, 0.12, 1.7), body(), 0, 1.5, 0));
      if (lv5) g.add(mesh(new THREE.BoxGeometry(2.4, 0.05, 1.5), gem(0x5a3f9e), 0, 1.42, 0));
      break;
    }
    case 'wardrobe': { // 鎏金三门大柜 / 魔法镜面衣橱
      g.add(mesh(new THREE.BoxGeometry(3.0, 2.6, 0.72), body(), 0, 1.3, 0));
      [-1, 0, 1].forEach(x => g.add(mesh(new THREE.BoxGeometry(0.04, 2.4, 0.06), mat(0x5a3a22), x, 1.3, 0.37)));
      [-1.4, -0.6, 0.4, 1.4].forEach(x => g.add(mesh(new THREE.SphereGeometry(0.06, 6, 5), body(), x, 1.3, 0.4)));
      if (lv5) g.add(mesh(new THREE.BoxGeometry(0.8, 1.9, 0.05), mat(0xcfe6f5, { emissive: 0x9ec4e0, emissiveIntensity: 0.55, roughness: 0.1 }), -1, 1.35, 0.38));
      else g.add(mesh(new THREE.BoxGeometry(0.85, 0.7, 0.1), mat(0xf3e6cf), 1, 1.75, 0.38));
      g.add(mesh(new THREE.BoxGeometry(3.15, 0.16, 0.85), body(), 0, 2.65, 0));
      break;
    }
    case 'mirror': { // 巴洛克金镜 / 魔镜
      const frame = mesh(new THREE.TorusGeometry(0.85, 0.12, 8, 28), body(), 0, 1.7, 0);
      frame.scale.set(0.85, 1.2, 1); g.add(frame);
      const face = mesh(new THREE.CircleGeometry(0.78, 24), mat(0xcfe6f5, { emissive: lv5 ? 0x7ab0e0 : 0x9ec4e0, emissiveIntensity: lv5 ? 0.6 : 0.35, roughness: 0.1 }), 0, 1.7, 0.02);
      face.scale.set(0.82, 1.15, 1); g.add(face);
      g.add(mesh(new THREE.CylinderGeometry(0.14, 0.28, 0.5, 8), body(), 0, 0.25, 0));
      [[0, 2.65]].forEach(([x, y]) => g.add(mesh(new THREE.SphereGeometry(0.11, 7, 6), body(), x, y, 0)));
      break;
    }
    case 'teddy': { // 皇冠巨熊 / 星光泰迪
      const s = 2.3;
      const fur = mat(lv5 ? 0xd9a86a : 0xc9944a);
      g.add(mesh(new THREE.SphereGeometry(0.34 * s, 9, 8), fur, 0, 0.34 * s, 0));
      g.add(mesh(new THREE.SphereGeometry(0.25 * s, 9, 8), mat(0xe8d4b0), 0, 0.32 * s, 0.13 * s));
      g.add(mesh(new THREE.SphereGeometry(0.23 * s, 9, 8), fur, 0, 0.74 * s, 0));
      [[-0.16], [0.16]].forEach(([x]) => g.add(mesh(new THREE.SphereGeometry(0.085 * s, 6, 5), fur, x * s, 0.92 * s, 0)));
      [[-0.16], [0.16]].forEach(([x]) => g.add(mesh(new THREE.SphereGeometry(0.14 * s, 6, 5), fur, x * s, 0.1 * s, 0.16 * s)));
      g.add(mesh(new THREE.SphereGeometry(0.05 * s, 6, 5), gem(lv5 ? 0x6ae0ff : 0x3a2a1e), 0, 0.74 * s, 0.21 * s));
      g.add(mesh(new THREE.CylinderGeometry(0.16 * s, 0.14 * s, 0.14 * s, 8), body(), 0, 0.96 * s, 0)); // 皇冠
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; g.add(mesh(new THREE.ConeGeometry(0.03 * s, 0.1 * s, 4), body(), Math.cos(a) * 0.15 * s, 1.04 * s, Math.sin(a) * 0.15 * s)); }
      break;
    }
    case 'fire': { // 鎏金双柱壁炉 / 永恒蓝焰炉
      g.add(mesh(new THREE.BoxGeometry(2.3, 1.7, 0.6), mat(0xe8e2d6), 0, 0.85, 0));
      g.add(mesh(new THREE.BoxGeometry(1.0, 0.9, 0.24), mat(0x2e2620), 0, 0.6, 0.22));
      g.add(mesh(new THREE.BoxGeometry(2.6, 0.18, 0.75), body(), 0, 1.75, 0));
      [[-1.05], [1.05]].forEach(([x]) => g.add(mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.7, 8), body(), x, 0.85, 0.02)));
      const flame = mesh(new THREE.ConeGeometry(0.3, 0.7, 6), mat(lv5 ? 0x6ac8ff : 0xffb838, { emissive: lv5 ? 0x2a90e0 : 0xff8c1a, emissiveIntensity: 1.3 }), 0, 0.55, 0.22);
      flame.userData.flame = true; g.add(flame);
      const glow = new THREE.PointLight(lv5 ? 0x6ac8ff : 0xff9c40, 1, 8, 2); glow.position.set(0, 0.7, 0.6); g.add(glow);
      break;
    }
    case 'art': { // 三联金框油画 / 星空全息画（挂墙 y≈2.1）
      const y = 2.1;
      [-1.15, 0, 1.15].forEach((x, k) => {
        g.add(mesh(new THREE.BoxGeometry(0.95, 1.5, 0.08), body(), x, y, 0));
        g.add(mesh(new THREE.BoxGeometry(0.78, 1.33, 0.02), mat([0x5a7fa8, 0x7fb069, 0xd98a5a][k], lv5 ? { emissive: [0x2a4f78, 0x3f8039, 0xa95a2a][k], emissiveIntensity: 0.55 } : {}), x, y, 0.06));
        g.add(mesh(new THREE.SphereGeometry(0.12, 7, 6), gem(0xf2c94c), x, y + 0.3, 0.08));
      });
      break;
    }
    case 'sofa': { // 贵族转角沙发 / 云端悬浮沙发
      const fabric = mat(lv5 ? 0x8a6bd0 : 0xb04a4a, lv5 ? { emissive: 0x4a2a90, emissiveIntensity: 0.3 } : {});
      const long = 3.0;
      g.add(mesh(new THREE.BoxGeometry(long, 0.45, 1.0), fabric, 0, 0.3, 0));
      g.add(mesh(new THREE.BoxGeometry(long, 0.75, 0.3), fabric, 0, 0.8, -0.4));
      [[-long / 2 + 0.15], [long / 2 - 0.15]].forEach(([x]) => g.add(mesh(new THREE.BoxGeometry(0.3, 0.7, 1.0), fabric, x, 0.55, 0)));
      for (let k = 0; k < 4; k++) g.add(mesh(new THREE.BoxGeometry(0.6, 0.18, 0.85), mat(lv5 ? 0xb89aff : 0xd97a6a), -long / 2 + 0.5 + k * 0.7, 0.62, 0.05));
      g.add(mesh(new THREE.BoxGeometry(1.0, 0.45, 1.7), fabric, long / 2 - 0.5, 0.3, 1.35));
      g.add(mesh(new THREE.BoxGeometry(0.85, 0.18, 1.5), mat(lv5 ? 0xb89aff : 0xd97a6a), long / 2 - 0.5, 0.62, 1.35));
      break;
    }
    case 'rug': { // 皇家纹章毯 / 星图魔毯（方形）
      g.add(mesh(new THREE.BoxGeometry(2.6, 0.05, 1.9), mat(lv5 ? 0x3a2a6e : 0x7a2a34, lv5 ? { emissive: 0x2a1a5e, emissiveIntensity: 0.3 } : {}), 0, 0.03, 0));
      g.add(mesh(new THREE.BoxGeometry(2.2, 0.06, 1.5), mat(0xa8433a), 0, 0.04, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.07, 6), lv5 ? gem(GOLD) : body(), 0, 0.05, 0));
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; g.add(mesh(new THREE.OctahedronGeometry(0.12), lv5 ? gem(0xffe6a0) : body(), Math.cos(a) * 0.85, 0.06, Math.sin(a) * 0.6)); }
      break;
    }
    case 'teatable': { // 大理石金腿茶几 / 水晶浮空茶几
      g.add(mesh(new THREE.BoxGeometry(1.7, 0.1, 1.0), lv5 ? mat(0xbfe3f0, { transparent: true, opacity: 0.5, emissive: 0x6ab0d0, emissiveIntensity: 0.4 }) : mat(0xe8e2d6), 0, 0.5, 0));
      [[-0.7, 0.35], [0.7, 0.35], [-0.7, -0.35], [0.7, -0.35]].forEach(([x, z]) => g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6), body(), x, 0.25, z)));
      g.add(mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.16, 8), gem(0xd9534f), -0.2, 0.62, 0));
      g.add(mesh(new THREE.SphereGeometry(0.08, 6, 5), gem(0xf2c94c), 0.25, 0.6, 0.1));
      break;
    }
    case 'tv': { // 超宽曲面影院 / 全息投影幕（朝 +Z, y≈1.6）
      g.add(mesh(new THREE.BoxGeometry(4.2, 2.2, 0.14), mat(0x2a2a30), 0, 1.6, 0));
      g.add(mesh(new THREE.BoxGeometry(4.0, 2.0, 0.15), mat(0x9ecfe8, { emissive: lv5 ? 0x8a6bd0 : 0x6ab8e0, emissiveIntensity: lv5 ? 0.8 : 0.55 }), 0, 1.6, 0.02));
      g.add(mesh(new THREE.BoxGeometry(4.6, 0.5, 0.6), body(), 0, 0.35, 0));
      [[-1.6], [1.6]].forEach(([x]) => g.add(mesh(new THREE.BoxGeometry(0.35, 1.2, 0.35), mat(0x4a4a52), x, 0.6, 0.5)));
      break;
    }
    case 'floorlamp': { // 三头金落地灯 / 星河灯树
      g.add(mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.12, 10), body(), 0, 0.06, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.0, 6), body(), 0, 1.0, 0));
      [[-0.4, 1.7], [0.4, 1.7], [0, 2.05]].forEach(([x, y]) => {
        g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 5), body(), x / 2, (y + 1.3) / 2, 0).rotateZ(-x));
        const shade = mesh(new THREE.ConeGeometry(0.26, 0.32, 8), mat(0xf3d9a4, { emissive: lv5 ? 0x9ed4ff : 0xffd27a, emissiveIntensity: 0.6 }), x, y, 0);
        g.add(shade);
      });
      const light = new THREE.PointLight(lv5 ? 0xbfe0ff : 0xffd9a0, 1.1, 12, 2); light.position.set(0, 1.8, 0); g.add(light);
      break;
    }
    case 'aquarium': { // 大型生态缸 / 发光水母缸
      const w = 2.6, h = 1.2;
      g.add(mesh(new THREE.BoxGeometry(w + 0.2, 0.55, 0.95), body(), 0, 0.28, 0));
      g.add(mesh(new THREE.BoxGeometry(w, h, 0.8), glass, 0, 0.55 + h / 2, 0));
      g.add(mesh(new THREE.BoxGeometry(w - 0.1, h - 0.14, 0.68), mat(0x4a90c2, { transparent: true, opacity: 0.55, emissive: lv5 ? 0x2a6ab0 : 0x1a4a70, emissiveIntensity: lv5 ? 0.6 : 0.4 }), 0, 0.53 + h / 2, 0));
      if (lv5) for (let k = 0; k < 3; k++) { const jelly = mesh(new THREE.SphereGeometry(0.18, 9, 7, 0, Math.PI * 2, 0, Math.PI * 0.6), gem(0xff9ad0), -0.7 + k * 0.7, 1.1, 0); jelly.userData.spin = true; g.add(jelly); }
      else { const school = new THREE.Group(); for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; const f = mesh(new THREE.SphereGeometry(0.09, 6, 5), mat([0xf07338, 0xf2c94c, 0xe0364a, 0x6aae5e, 0x4a90c2][k]), Math.cos(a) * w / 3.4, 0.55 + h / 2, Math.sin(a) * 0.2); f.scale.set(1.5, 0.8, 0.7); school.add(f); } school.userData.spin = true; g.add(school); }
      break;
    }
    case 'shelf': { // 双塔图书墙 / 悬浮魔法书阁
      const w = 2.8, h = 3.0;
      [[-w / 2, 0], [w / 2, 0]].forEach(([x]) => g.add(mesh(new THREE.BoxGeometry(0.12, h, 0.42), body(), x, h / 2, 0)));
      const colors = [0xc4574e, 0x4a90c2, 0x6aae5e, 0xe0b64a, 0x8a6bbf];
      for (let k = 0; k < 5; k++) {
        const y = 0.3 + k * ((h - 0.5) / 4);
        g.add(mesh(new THREE.BoxGeometry(w, 0.08, 0.42), body(), 0, y, 0));
        const count = Math.floor(w / 0.16) - 1;
        for (let b = 0; b < count; b++) { const bh = 0.28 + ((b * 7 + k * 3) % 3) * 0.05; g.add(mesh(new THREE.BoxGeometry(0.12, bh, 0.32), lv5 && (b + k) % 4 === 0 ? gem(colors[(b + k) % 5]) : mat(colors[(b + k) % 5]), -w / 2 + 0.24 + b * 0.16, y + 0.04 + bh / 2, 0)); }
      }
      if (lv5) { const book = mesh(new THREE.BoxGeometry(0.4, 0.5, 0.1), gem(0x9ed4ff), 0, h + 0.4, 0.3); book.userData.spin = true; g.add(book); }
      break;
    }
    case 'clock': { // 鎏金落地摆钟 / 星象天文钟
      g.add(mesh(new THREE.BoxGeometry(1.0, 3.0, 0.55), body(), 0, 1.5, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.56, 16), mat(lv5 ? 0x9ec8ff : 0xf5efe2, lv5 ? { emissive: 0x4a90c2, emissiveIntensity: 0.5 } : {}), 0, 2.45, 0).rotateX(Math.PI / 2));
      g.add(mesh(new THREE.BoxGeometry(0.6, 1.3, 0.56), mat(0xa8d8f0, { transparent: true, opacity: 0.35 }), 0, 1.1, 0));
      const pend = mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 12), gem(GOLD), 0, 0.65, 0.12).rotateX(Math.PI / 2);
      pend.userData.spin = true; g.add(pend);
      g.add(mesh(new THREE.BoxGeometry(0.04, 0.8, 0.04), body(), 0, 1.1, 0.12));
      if (lv5) g.add(mesh(new THREE.TorusGeometry(0.44, 0.03, 6, 20), gem(0xffe6a0), 0, 2.45, 0.05));
      break;
    }
    case 'statue': { // 黄金双人像 / 水晶守护神像
      const bodyMat = lv5 ? gem(0x9ed4ff) : body();
      g.add(mesh(new THREE.BoxGeometry(1.2, 0.6, 0.9), mat(0x4a4a52), 0, 0.3, 0));
      [[-0.32], [0.32]].forEach(([x], k) => {
        g.add(mesh(new THREE.BoxGeometry(0.3, 0.85, 0.24), bodyMat, x, 1.05, 0));
        g.add(mesh(new THREE.SphereGeometry(0.15, 8, 6), bodyMat, x, 1.62, 0));
        const arm = mesh(new THREE.BoxGeometry(0.09, 0.55, 0.09), bodyMat, x + (k ? 0.26 : -0.26), 1.25, 0); arm.rotation.z = k ? -0.7 : 0.7; g.add(arm);
      });
      if (lv5) g.add(mesh(new THREE.TorusGeometry(0.6, 0.05, 6, 18), gem(0xffe6a0), 0, 1.9, 0).rotateX(Math.PI / 2));
      break;
    }
    case 'safe': { // 双门金库 / 能量金库
      g.add(mesh(new THREE.BoxGeometry(2.4, 2.4, 0.5), mat(0x4a4a52), 0, 1.2, 0));
      [[-0.6], [0.6]].forEach(([x], k) => {
        const door = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 16), body(), x, 1.2, 0.05); door.rotation.x = Math.PI / 2; g.add(door);
        const spoke = mesh(new THREE.BoxGeometry(0.6, 0.08, 0.06), lv5 ? gem(0x6ae0ff) : mat(0x8a6a1a), x, 1.2, 0.28); if (lv5) spoke.userData.spin = true; g.add(spoke);
        g.add(mesh(new THREE.BoxGeometry(0.06, 0.6, 0.06), lv5 ? gem(0x6ae0ff) : mat(0x8a6a1a), x, 1.2, 0.28));
      });
      [[-0.9, 0.4], [0.9, 0.4]].forEach(([x, z]) => g.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.16, 10), gem(GOLD), x, 0.1, z))); // 金币堆
      break;
    }
    case 'piano': { // 白色演奏三角琴 / 水晶发光钢琴
      const cab = lv5 ? mat(0xf7f2ea, { emissive: 0x9ed4ff, emissiveIntensity: 0.3 }) : mat(0xf5efe2, { roughness: 0.35 });
      g.add(mesh(new THREE.BoxGeometry(2.4, 0.3, 1.8), cab, 0, 0.85, 0));
      const lid = mesh(new THREE.BoxGeometry(2.3, 0.06, 1.7), cab, -0.1, 1.5, -0.1); lid.rotation.z = 0.6; g.add(lid);
      g.add(mesh(new THREE.BoxGeometry(2.1, 0.08, 0.34), mat(0x2a2a30), 0, 0.92, 0.9));
      for (let k = 0; k < 12; k++) g.add(mesh(new THREE.BoxGeometry(0.06, 0.05, 0.16), mat(0x2a2a30), -0.9 + k * 0.16, 0.97, 0.86));
      [[-1.0, 0.65], [1.0, 0.65], [0, -0.7]].forEach(([x, z]) => g.add(mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.75, 6), body(), x, 0.4, z)));
      g.add(mesh(new THREE.BoxGeometry(1.0, 0.28, 0.36), cab, 0, 0.14, 1.5));
      break;
    }
    case 'harp': { // 鎏金大竖琴 / 天使光弦琴
      const frame = body();
      const h = 2.4;
      g.add(mesh(new THREE.CylinderGeometry(0.08, 0.1, h, 8), frame, -0.6, h / 2, 0));
      const arc = mesh(new THREE.TorusGeometry(h * 0.44, 0.08, 8, 14, Math.PI * 0.9), frame, -0.1, h * 0.78, 0); arc.rotation.z = -0.5; g.add(arc);
      const slant = mesh(new THREE.CylinderGeometry(0.09, 0.13, h * 1.05, 8), frame, 0.34, h * 0.42, 0); slant.rotation.z = 0.55; g.add(slant);
      g.add(mesh(new THREE.BoxGeometry(1.1, 0.16, 0.6), frame, 0, 0.08, 0));
      for (let k = 0; k < 9; k++) { const x = -0.5 + k * 0.1; const sh = h * (0.85 - k * 0.075); g.add(mesh(new THREE.BoxGeometry(0.015, sh, 0.015), lv5 ? gem(0xbfe0ff) : mat(0xf5efe2), x, sh / 2 + 0.14, 0)); }
      break;
    }
    case 'table': { // 橡木长桌宴席 / 水晶浮空宴桌
      const top = lv5 ? mat(0xbfe3f0, { transparent: true, opacity: 0.5, emissive: 0x6ab0d0, emissiveIntensity: 0.4 }) : mat(0x8a5a35);
      g.add(mesh(new THREE.BoxGeometry(2.8, 0.1, 1.0), top, 0, 0.65, 0));
      [[1.3], [-1.3]].forEach(([x]) => g.add(mesh(new THREE.BoxGeometry(0.12, 0.6, 0.8), body(), x, 0.32, 0)));
      [[-0.8, 1.0], [0, 1.0], [0.8, 1.0], [-0.8, -1.0], [0, -1.0], [0.8, -1.0]].forEach(([x, z]) => {
        g.add(mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.4, 8), body(), x, 0.2, z));
        g.add(mesh(new THREE.BoxGeometry(0.34, 0.5, 0.08), body(), x, 0.65, z + (z > 0 ? 0.18 : -0.18)));
      });
      [[-0.6], [0.6]].forEach(([x]) => g.add(mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.2, 6), body(), x, 0.78, 0)));
      [[-0.6], [0.6]].forEach(([x]) => { const fl = mesh(new THREE.ConeGeometry(0.04, 0.12, 5), mat(0xffb838, { emissive: 0xff9420, emissiveIntensity: 1 }), x, 0.94, 0); fl.userData.flame = true; g.add(fl); });
      break;
    }
    case 'kitchen': { // 中央厨房岛台 / 未来料理站
      const w = 3.2;
      g.add(mesh(new THREE.BoxGeometry(w, 0.9, 1.1), mat(lv5 ? 0xe8e2d6 : 0xd9c9a8), 0, 0.45, 0));
      g.add(mesh(new THREE.BoxGeometry(w + 0.1, 0.1, 1.2), body(), 0, 0.95, 0));
      [[-w / 4], [w / 4]].forEach(([x], k) => { g.add(mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 10), mat(0x3a3a40), x, 1.01, -0.15)); if (k === 0) g.add(mesh(new THREE.CylinderGeometry(0.19, 0.16, 0.18, 9), mat(0xd9534f), x, 1.12, -0.15)); });
      g.add(mesh(new THREE.BoxGeometry(w * 0.7, 0.08, 0.08), mat(0x4a4a52), 0, 2.2, 0));
      [[-0.6, 0xd9534f], [0, 0x5a5a66], [0.6, 0xe0b64a]].forEach(([x, c]) => g.add(mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.14, 8), lv5 ? gem(c) : mat(c), x, 1.9, 0)));
      if (lv5) g.add(mesh(new THREE.BoxGeometry(0.6, 0.4, 0.04), mat(0x6ae0a0, { emissive: 0x4ac080, emissiveIntensity: 0.7 }), w / 2 - 0.4, 1.3, 0.5));
      break;
    }
    case 'cabinet': { // 双层玻璃酒柜 / 发光藏酒展柜
      g.add(mesh(new THREE.BoxGeometry(1.8, 2.6, 0.6), body(), 0, 1.3, 0));
      g.add(mesh(new THREE.BoxGeometry(1.5, 2.2, 0.1), mat(0xa8d8f0, { transparent: true, opacity: 0.3 }), 0, 1.4, 0.3));
      for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
        const c = [0xc4574e, 0x6aae5e, 0xe0b64a, 0x8a6bbf][(row + col) % 4];
        g.add(mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.34, 6), lv5 ? gem(c) : mat(c), -0.5 + col * 0.34, 0.5 + row * 0.5, 0.06));
      }
      break;
    }
    case 'rocker': { // 藤编吊篮椅 / 悬浮云朵椅
      const frame = body();
      const pole = mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.8, 8), frame, -0.6, 1.35, 0); pole.rotation.z = -0.42; g.add(pole);
      g.add(mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.14, 10), frame, -1.15, 0.07, 0));
      const tipX = -0.6 + Math.sin(0.42) * 1.4;
      g.add(mesh(new THREE.BoxGeometry(0.03, 0.9, 0.03), mat(0x5a3a22), tipX, 1.7, 0));
      const basket = mesh(new THREE.SphereGeometry(0.6, 9, 7, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.5), lv5 ? mat(0xf7f2ea, { emissive: 0x9ed4ff, emissiveIntensity: 0.3 }) : mat(0xc9a97e), tipX, 1.2, 0);
      g.add(basket);
      g.add(mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.12, 10), gem(lv5 ? 0xff9ad0 : 0xd97a6a), tipX, 1.12, 0));
      break;
    }
    case 'plant': { // 室内棕榈树 / 发光神木
      g.add(mesh(new THREE.CylinderGeometry(0.4, 0.34, 0.5, 10), body(), 0, 0.25, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.09, 0.13, 1.9, 6), mat(0x8a5a35), 0, 1.3, 0));
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2;
        const leaf = mesh(new THREE.ConeGeometry(0.16, 0.9, 4), mat(lv5 ? 0x8fe0a0 : 0x4a9a52, lv5 ? { emissive: 0x2a8a4a, emissiveIntensity: 0.4 } : {}), Math.cos(a) * 0.3, 2.2, Math.sin(a) * 0.3);
        leaf.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); g.add(leaf);
      }
      if (lv5) for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; g.add(mesh(new THREE.SphereGeometry(0.09, 7, 6), gem(0xffd86a), Math.cos(a) * 0.35, 1.9 + Math.sin(k) * 0.2, Math.sin(a) * 0.35)); }
      break;
    }
    case 'bath': { // 罗马圆浴池 / 温泉月光池
      const water = mat(0x7ec4e8, { transparent: true, opacity: 0.6, emissive: lv5 ? 0x5a9ad0 : 0x2a6a90, emissiveIntensity: lv5 ? 0.5 : 0.2 });
      g.add(mesh(new THREE.CylinderGeometry(1.35, 1.2, 0.7, 16), mat(0xe8e2d6), 0, 0.35, 0));
      g.add(mesh(new THREE.CylinderGeometry(1.18, 1.18, 0.1, 16), water, 0, 0.65, 0));
      g.add(mesh(new THREE.TorusGeometry(1.26, 0.08, 6, 16), body(), 0, 0.72, 0).rotateX(Math.PI / 2));
      for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + 0.4; g.add(mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.1, 8), body(), Math.cos(a) * 1.15, 0.9, Math.sin(a) * 1.15)); }
      [[0.4, 0.3], [-0.35, -0.2], [0, 0.05]].forEach(([x, z]) => g.add(mesh(new THREE.SphereGeometry(0.1, 6, 5), mat(0xffffff, { transparent: true, opacity: 0.75, ...(lv5 ? { emissive: 0xbfe0ff, emissiveIntensity: 0.5 } : {}) }), x, 0.72, z)));
      break;
    }
    case 'arcade': { // 双人街机厅 / 全息游戏舱
      [[-0.75], [0.75]].forEach(([x], k) => {
        g.add(mesh(new THREE.BoxGeometry(1.2, 2.0, 0.85), mat(lv5 ? 0x6a3aa0 : 0x8a4ac2, lv5 ? { emissive: 0x4a1a80, emissiveIntensity: 0.35 } : {}), x, 1.0, 0));
        g.add(mesh(new THREE.BoxGeometry(0.9, 0.65, 0.06), mat(0x9ecfe8, { emissive: lv5 ? 0x8a6bd0 : 0x6ab8e0, emissiveIntensity: 0.7 }), x, 1.45, 0.44));
        const panel = mesh(new THREE.BoxGeometry(1.0, 0.08, 0.4), mat(0x5a2a90), x, 1.0, 0.52); panel.rotation.x = 0.3; g.add(panel);
        g.add(mesh(new THREE.SphereGeometry(0.06, 6, 5), gem(k ? 0x4a90c2 : 0xe0364a), x, 1.08, 0.57));
      });
      g.add(mesh(new THREE.BoxGeometry(2.7, 0.35, 0.9), body(), 0, 2.2, 0));
      break;
    }
    case 'telescope': { // 黄铜天文望远镜 / 星象观测台
      [0, 2.1, 4.2].forEach(a => { const leg = mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.6, 6), body(), Math.cos(a) * 0.45, 0.75, Math.sin(a) * 0.45); leg.rotation.z = Math.cos(a) * 0.3; leg.rotation.x = -Math.sin(a) * 0.3; g.add(leg); });
      const tube = mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.8, 10), body(), 0, 1.7, 0); tube.rotation.x = Math.PI / 2 - 0.7; g.add(tube);
      g.add(mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.1, 12), gem(lv5 ? 0x6ae0ff : 0x9ed4f0), 0.5, 2.2, -0.5).rotateX(Math.PI / 2 - 0.7));
      if (lv5) { const ring = mesh(new THREE.TorusGeometry(0.5, 0.03, 6, 20), gem(0xffe6a0), 0, 1.7, 0); ring.userData.spin = true; g.add(ring); }
      break;
    }
  }
  if (lv5) legendHalo(g, FURN_HALO_Y[id] ?? 1.9, id === 'rug' || id === 'bath' ? 1.3 : 0.75);
  return g;
}

export function createFurnitureMesh(id, lv) {
  if (lv >= 4) return furnitureLux(id, lv);
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

export function createHouse(skin = {}) {
  const c = (part) => houseSkinColor(part, skin[part]);
  const g = new THREE.Group();
  // 主体（外墙可换色）
  g.add(mesh(new THREE.BoxGeometry(3.6, 2, 3), mat(c('wall')), 0, 1, 0));
  // 人字形屋顶（可换色）
  const roof = mesh(new THREE.ConeGeometry(2.9, 1.5, 4), mat(c('roof')), 0, 2.75, 0);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  // 烟囱
  g.add(mesh(new THREE.BoxGeometry(0.42, 1, 0.42), mat(0xa2705a), 1.1, 3, -0.6));
  // 门（朝农田，可换色）和门口台阶
  g.add(mesh(new THREE.BoxGeometry(0.8, 1.3, 0.08), mat(c('door')), -0.6, 0.65, 1.53));
  g.add(mesh(new THREE.SphereGeometry(0.07, 6, 5), mat(0xf2c94c), -0.28, 0.7, 1.58));
  g.add(mesh(new THREE.BoxGeometry(1.2, 0.16, 0.5), mat(0xd9c9a8), -0.6, 0.08, 1.85));
  // 窗户（可换色）
  [[0.9, 1.53, 0], [1.86, 0, -0.8]].forEach(([x, z, ry], k) => {
    const win = mesh(new THREE.BoxGeometry(0.75, 0.65, 0.08), mat(c('window')), x, 1.15, z);
    if (k === 1) { win.rotation.y = Math.PI / 2; }
    win.userData.houseWindow = true; // 夜里透出暖光
    g.add(win);
  });
  g.traverse(o => { if (o.isMesh) o.userData.house = true; });
  return g;
}

/* ================= 花房温室：15 种花 + 温室建筑 + 花房内部 ================= */

// 每种花的外观参数：kind 决定花形，petal/center 是花瓣与花心色，glow 传说花发光，big 大花
const FLOWER_LOOK = {
  daisy:      { kind: 'daisy',   petal: 0xffffff, center: 0xf2c94c },
  cosmos:     { kind: 'daisy',   petal: 0xf2a7c3, center: 0xf2c94c },
  pansy:      { kind: 'daisy',   petal: 0x8a5ec2, center: 0xf2e04c },
  marigold:   { kind: 'daisy',   petal: 0xf2903a, center: 0xd9702a },
  babybreath: { kind: 'cluster', petal: 0xffffff, center: 0xeef0e8 },
  tulip:      { kind: 'tulip',   petal: 0xe0364a, center: 0x6aae5e },
  rose:       { kind: 'rose',    petal: 0xd63a5a, center: 0x9a2a3a },
  sunflower:  { kind: 'daisy',   petal: 0xf2c220, center: 0x8a5a2a, big: true },
  hyacinth:   { kind: 'spike',   petal: 0x6a7ad0, center: 0x4a5ab0 },
  lily:       { kind: 'lily',    petal: 0xfff0f5, center: 0xf2a7c3 },
  lavender:   { kind: 'spike',   petal: 0x9a6ec2, center: 0x7a4ea2 },
  hydrangea:  { kind: 'cluster', petal: 0x6ab0e0, center: 0x9a8ad0, big: true },
  iris:       { kind: 'lily',    petal: 0x6a5ac2, center: 0xf2c94c },
  bluerose:   { kind: 'rose',    petal: 0x3a6ad0, center: 0x2a4aa0, glow: 0.5 },
  spiderlily: { kind: 'spider',  petal: 0xe0203a, center: 0xf2c94c, glow: 0.5 },
};

const flowerHead = {
  daisy(pm, cm, look) {
    const g = new THREE.Group();
    const s = look.big ? 1.5 : 1, n = 8;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      const petal = mesh(new THREE.SphereGeometry(0.09 * s, 6, 5), pm, Math.cos(a) * 0.13 * s, 0, Math.sin(a) * 0.13 * s);
      petal.scale.set(1.6, 0.35, 0.9); petal.rotation.y = -a; g.add(petal);
    }
    g.add(mesh(new THREE.SphereGeometry(0.09 * s, 8, 6), cm, 0, 0.02, 0));
    return g;
  },
  tulip(pm, cm) {
    const g = new THREE.Group();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const petal = mesh(new THREE.SphereGeometry(0.1, 6, 6, 0, Math.PI * 2, 0, Math.PI * 0.6), pm, Math.cos(a) * 0.06, 0.1, Math.sin(a) * 0.06);
      petal.scale.set(0.7, 1.8, 0.7); petal.rotation.set(0.2 * Math.cos(a), -a, 0.2 * Math.sin(a)); g.add(petal);
    }
    return g;
  },
  rose(pm, cm) {
    const g = new THREE.Group();
    for (let ring = 0; ring < 3; ring++) {
      const rr = 0.14 - ring * 0.04, n = 6 - ring;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + ring * 0.5;
        const petal = mesh(new THREE.SphereGeometry(0.07, 6, 5), pm, Math.cos(a) * rr, ring * 0.03, Math.sin(a) * rr);
        petal.scale.set(1, 0.5, 1.2); petal.rotation.y = -a; g.add(petal);
      }
    }
    g.add(mesh(new THREE.SphereGeometry(0.05, 6, 5), cm, 0, 0.08, 0));
    return g;
  },
  spike(pm, cm) {
    const g = new THREE.Group();
    for (let k = 0; k < 8; k++) {
      const y = k * 0.06, r = 0.08 * (1 - k / 12);
      for (let j = 0; j < 3; j++) {
        const a = (j / 3) * Math.PI * 2 + k * 0.5;
        g.add(mesh(new THREE.SphereGeometry(0.04, 5, 4), k % 2 ? pm : cm, Math.cos(a) * r, y, Math.sin(a) * r));
      }
    }
    return g;
  },
  lily(pm, cm) {
    const g = new THREE.Group();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const petal = mesh(new THREE.ConeGeometry(0.05, 0.22, 4), pm, Math.cos(a) * 0.1, 0.02, Math.sin(a) * 0.1);
      petal.rotation.set(Math.sin(a) * 1.1, -a, -Math.cos(a) * 1.1); g.add(petal);
    }
    g.add(mesh(new THREE.SphereGeometry(0.04, 6, 5), cm, 0, 0.04, 0));
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 4), cm, Math.cos(a) * 0.02, 0.09, Math.sin(a) * 0.02)); }
    return g;
  },
  cluster(pm, cm, look) {
    const g = new THREE.Group();
    const s = look.big ? 1.4 : 1;
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 6, rr = 0.04 + (k % 3) * 0.03, y = 0.02 + (k % 4) * 0.03;
      g.add(mesh(new THREE.SphereGeometry(0.045 * s, 5, 4), k % 2 ? pm : cm, Math.cos(a) * rr * s, y, Math.sin(a) * rr * s));
    }
    return g;
  },
  spider(pm, cm) {
    const g = new THREE.Group();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const petal = mesh(new THREE.CylinderGeometry(0.006, 0.015, 0.28, 4), pm, Math.cos(a) * 0.12, 0.05, Math.sin(a) * 0.12);
      petal.rotation.set(Math.sin(a) * 1.4, -a, -Math.cos(a) * 1.4); g.add(petal);
      g.add(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.2, 3), cm, Math.cos(a) * 0.17, 0.14, Math.sin(a) * 0.17).rotateZ(Math.cos(a) * 0.6));
    }
    return g;
  },
};

// 一朵开好的花：茎 + 叶 + 花头（花头按 kind 生成）
export function createFlowerMesh(id) {
  const look = FLOWER_LOOK[id] ?? FLOWER_LOOK.daisy;
  const g = new THREE.Group();
  const stemH = 0.5;
  g.add(mesh(new THREE.CylinderGeometry(0.025, 0.03, stemH, 5), mat(0x4a8a42), 0, stemH / 2, 0));
  const leaf = mesh(new THREE.SphereGeometry(0.08, 6, 5), mat(0x5aa050), 0.06, stemH * 0.4, 0);
  leaf.scale.set(1.6, 0.3, 0.8); leaf.rotation.z = -0.5; g.add(leaf);
  const glowOpt = look.glow ? { emissive: look.petal, emissiveIntensity: look.glow, roughness: 0.4 } : {};
  const head = flowerHead[look.kind](mat(look.petal, glowOpt), mat(look.center, look.glow ? { emissive: look.center, emissiveIntensity: look.glow * 0.6 } : {}), look);
  head.position.y = stemH + 0.05;
  g.add(head);
  return g;
}

// 生长中的花苞（还没开花时插在花圃里）
export function createFlowerBud() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.3, 5), mat(0x4a8a42), 0, 0.15, 0));
  const bud = mesh(new THREE.SphereGeometry(0.07, 6, 5, 0, Math.PI * 2, 0, Math.PI * 0.7), mat(0x6aae5e), 0, 0.33, 0);
  g.add(bud);
  return g;
}

// 8 个花圃的站位（花房局部坐标）
export const GREENHOUSE_SPOTS = [
  [-4.5, -1], [-1.5, -1], [1.5, -1], [4.5, -1],
  [-4.5, 2], [-1.5, 2], [1.5, 2], [4.5, 2],
];

// 菜园里的玻璃温室（点它进花房）
export function createGreenhouse() {
  const g = new THREE.Group();
  const frame = mat(0xeae4d4);
  const glassM = mat(0xbfe8e0, { transparent: true, opacity: 0.4, roughness: 0.1 });
  g.add(mesh(new THREE.BoxGeometry(3.2, 0.3, 2.6), mat(0xc9a06a), 0, 0.15, 0));       // 底座
  g.add(mesh(new THREE.BoxGeometry(3.0, 1.8, 2.4), glassM, 0, 1.2, 0));               // 玻璃墙体
  [[-1.5, -1.2], [1.5, -1.2], [-1.5, 1.2], [1.5, 1.2]].forEach(([x, z]) =>
    g.add(mesh(new THREE.BoxGeometry(0.12, 1.8, 0.12), frame, x, 1.2, z)));           // 四角框架柱
  const roof = mesh(new THREE.CylinderGeometry(1.5, 1.5, 3.0, 12, 1, false, 0, Math.PI), glassM, 0, 2.1, 0);
  roof.rotation.z = Math.PI / 2; g.add(roof);                                          // 拱形玻璃顶
  g.add(mesh(new THREE.BoxGeometry(3.0, 0.1, 0.1), frame, 0, 2.1, 0));                // 顶脊
  g.add(mesh(new THREE.BoxGeometry(0.8, 1.3, 0.08), frame, 0, 0.75, 1.22));           // 门
  [[-0.7, 0xf2a7c3], [0, 0xf2c94c], [0.7, 0xe0364a]].forEach(([x, c]) =>
    g.add(mesh(new THREE.SphereGeometry(0.14, 7, 6), mat(c), x, 0.8, 0)));            // 里面透出的花
  g.traverse(o => { if (o.isMesh) o.userData.greenhouse = true; });
  return g;
}

// 花房内部：玻璃暖房 + 8 个花圃 + 扎花台
export function createGreenhouseInterior() {
  const g = new THREE.Group();
  const W = 13, D = 10;
  const frame = mat(0xeae4d4);
  const glassM = mat(0xcfeae2, { transparent: true, opacity: 0.32, roughness: 0.1 });
  g.add(mesh(new THREE.BoxGeometry(W, 0.3, D), mat(0xcdbb95), 0, -0.15, 0));          // 泥土地面
  g.add(mesh(new THREE.BoxGeometry(W, 4, 0.2), glassM, 0, 2, -D / 2));                // 玻璃后墙
  g.add(mesh(new THREE.BoxGeometry(0.2, 4, D), glassM, -W / 2, 2, 0));                // 玻璃左墙
  // 白框架横竖梁
  for (let x = -W / 2 + 2; x < W / 2; x += 2.2) g.add(mesh(new THREE.BoxGeometry(0.1, 4, 0.1), frame, x, 2, -D / 2));
  g.add(mesh(new THREE.BoxGeometry(W, 0.12, 0.12), frame, 0, 4, -D / 2));
  // 8 个花圃种植台（木框 + 土）
  GREENHOUSE_SPOTS.forEach(([x, z]) => {
    g.add(mesh(new THREE.BoxGeometry(1.2, 0.3, 1.2), mat(0x9a6a42), x, 0.15, z));
    g.add(mesh(new THREE.BoxGeometry(1.0, 0.12, 1.0), mat(0x6a4a30), x, 0.32, z));
  });
  // 扎花台（后排中间的工作台）
  g.add(mesh(new THREE.BoxGeometry(2.2, 0.85, 1.0), mat(0xb98a5a), 0, 0.42, -3.4));
  g.add(mesh(new THREE.BoxGeometry(2.3, 0.1, 1.1), mat(0xd9c9a8), 0, 0.9, -3.4));
  [[-0.7, 0xf2a7c3], [0, 0xf2c94c], [0.7, 0x6a7ad0]].forEach(([x, c]) =>
    g.add(mesh(new THREE.SphereGeometry(0.1, 6, 5), mat(c), x, 1.0, -3.4)));           // 台上摆着几朵花
  // 顶灯（暖阳）
  [[-4, 0], [4, 0], [0, 3]].forEach(([x, z]) => {
    const l = new THREE.PointLight(0xfff2d8, 0.6, 20, 1.8);
    l.position.set(x, 3.6, z);
    g.add(l);
  });
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

/* ================= 成就殿堂：金顶大楼 + 30 座奖杯展厅 ================= */

// 菜园里的成就大楼（点它进展厅）
export function createAchievementBuilding() {
  const g = new THREE.Group();
  const stone = mat(0xf5eee0);
  const gold = mat(0xe0b64a, { roughness: 0.3, metalness: 0.15 });
  const deepGold = mat(0xc9932f, { roughness: 0.35, metalness: 0.2 });

  // 三级基座台阶
  [[4.2, 3.6], [3.8, 3.2], [3.4, 2.8]].forEach(([w, d], k) =>
    g.add(mesh(new THREE.BoxGeometry(w, 0.22, d), mat(0xe6dcc8), 0, 0.11 + k * 0.22, 0)));

  // 主体：八角形塔身，比图鉴大楼更「殿堂」一点
  g.add(mesh(new THREE.CylinderGeometry(1.5, 1.62, 2.8, 8), stone, 0, 2.06, 0));
  // 腰线金环
  g.add(mesh(new THREE.CylinderGeometry(1.56, 1.56, 0.16, 8), gold, 0, 1.0, 0));
  g.add(mesh(new THREE.CylinderGeometry(1.54, 1.54, 0.14, 8), gold, 0, 3.32, 0));

  // 八根立柱贴在塔身外围
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    g.add(mesh(new THREE.CylinderGeometry(0.11, 0.13, 2.3, 6), stone,
      Math.sin(a) * 1.62, 2.05, Math.cos(a) * 1.62));
  }

  // 金色八角穹顶
  const dome = mesh(new THREE.ConeGeometry(1.85, 1.5, 8), gold, 0, 4.15, 0);
  g.add(dome);
  g.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.5, 6), deepGold, 0, 5.05, 0));

  // 塔尖上会自转的金星
  const star = new THREE.Group();
  const starMat = mat(0xffd75e, { emissive: 0xe0a020, emissiveIntensity: 0.55, roughness: 0.25 });
  for (let k = 0; k < 5; k++) {
    const spike = mesh(new THREE.ConeGeometry(0.12, 0.44, 4), starMat, 0, 0.22, 0);
    const holder = new THREE.Group();
    holder.rotation.z = (k / 5) * Math.PI * 2;
    holder.add(spike);
    star.add(holder);
  }
  star.position.set(0, 5.5, 0);
  star.userData.spin = true;
  g.add(star);

  // 正面大门 + 门口两尊小奖杯
  g.add(mesh(new THREE.BoxGeometry(1.0, 1.7, 0.12), mat(0x8a5a2b), 0, 1.5, 1.5));
  g.add(mesh(new THREE.BoxGeometry(1.16, 0.14, 0.16), gold, 0, 2.42, 1.52));
  [-1.35, 1.35].forEach(x => {
    g.add(mesh(new THREE.BoxGeometry(0.42, 0.3, 0.42), mat(0xe6dcc8), x, 0.85, 1.5));
    g.add(mesh(new THREE.CylinderGeometry(0.16, 0.09, 0.3, 8), gold, x, 1.15, 1.5));
    g.add(mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.14, 6), gold, x, 1.37, 1.5));
    g.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 8), gold, x, 1.46, 1.5));
  });

  g.traverse(o => { if (o.isMesh) o.userData.achievement = true; });
  return g;
}

// 展厅里 30 座台子的站位：6 列 × 5 排，中间留一条走道
export const ACHIEVEMENT_SPOTS = Array.from({ length: 30 }, (_, k) => {
  const col = k % 6, row = Math.floor(k / 6);
  const x = (col - 2.5) * 2.4 + (col >= 3 ? 1.2 : -1.2); // 中间掰开当走道
  return { x, z: (row - 2) * 3.2 };
});

// 展厅内部（藏在岛下，进馆时镜头切过去）
export function createAchievementInterior() {
  const g = new THREE.Group();
  const W = 20, D = 20;
  const wallMat = mat(0xf2ece0);
  const gold = mat(0xe0b64a, { roughness: 0.3, metalness: 0.15 });

  // 深色石地面 + 中央金色走道
  g.add(mesh(new THREE.BoxGeometry(W, 0.3, D), mat(0xd8cec0), 0, -0.15, 0));
  g.add(mesh(new THREE.BoxGeometry(2.0, 0.04, D - 1), mat(0xe8d9b0), 0, 0.02, 0));
  g.add(mesh(new THREE.BoxGeometry(1.7, 0.02, D - 1.4), gold, 0, 0.05, 0));

  // 后墙 + 左右墙
  g.add(mesh(new THREE.BoxGeometry(W, 6, 0.3), wallMat, 0, 3, -D / 2 + 0.15));
  g.add(mesh(new THREE.BoxGeometry(0.3, 6, D), wallMat, -W / 2 + 0.15, 3, 0));
  g.add(mesh(new THREE.BoxGeometry(0.3, 6, D), wallMat, W / 2 - 0.15, 3, 0));

  // 后墙上的巨型金星浮雕
  const starMat = mat(0xf2c94c, { emissive: 0xd9a020, emissiveIntensity: 0.35, roughness: 0.3 });
  for (let k = 0; k < 5; k++) {
    const spike = mesh(new THREE.ConeGeometry(0.5, 1.9, 4), starMat, 0, 0.95, 0);
    const holder = new THREE.Group();
    holder.rotation.z = (k / 5) * Math.PI * 2;
    holder.add(spike);
    holder.position.set(0, 4.1, -D / 2 + 0.35);
    g.add(holder);
  }
  // 金星两侧的垂幔
  [-3.4, 3.4].forEach(x =>
    g.add(mesh(new THREE.BoxGeometry(1.1, 3.6, 0.1), mat(0xa8433a), x, 3.4, -D / 2 + 0.32)));

  // 顶灯：照亮整个展厅
  [[-5, -6], [5, -6], [-5, 0], [5, 0], [-5, 6], [5, 6], [0, -8]].forEach(([x, z]) => {
    const l = new THREE.PointLight(0xfff0d0, 0.55, 24, 1.8);
    l.position.set(x, 5, z);
    g.add(l);
  });
  return g;
}

// 单座奖杯台：达成的立金杯并亮灯，没达成的是灰底座 + 半透明问号方碑
export function createTrophyMesh(a, done) {
  const g = new THREE.Group();
  const tierColor = { bronze: 0xc98a4a, silver: 0xb8c4d0, gold: 0xe0b64a, legend: 0xa24ac2 };
  const c = tierColor[a.tier] ?? 0xe0b64a;

  // 台座：达成的镶金边亮起来，没达成的是暗灰石头
  const baseMat = mat(done ? 0xf7f2e6 : 0x9a958c);
  g.add(mesh(new THREE.BoxGeometry(1.0, 0.16, 1.0), baseMat, 0, 0.08, 0));
  g.add(mesh(new THREE.BoxGeometry(0.66, 0.9, 0.66), baseMat, 0, 0.61, 0));
  g.add(mesh(new THREE.BoxGeometry(0.94, 0.14, 0.94), baseMat, 0, 1.13, 0));
  if (done) {
    g.add(mesh(new THREE.BoxGeometry(1.0, 0.05, 1.0),
      mat(c, { roughness: 0.3, metalness: 0.2 }), 0, 1.22, 0));
  }

  if (done) {
    // 奖杯：杯身 + 双耳 + 杯脚，材质带自发光，远看也亮
    const cup = mat(c, { roughness: 0.25, metalness: 0.35, emissive: c, emissiveIntensity: 0.25 });
    g.add(mesh(new THREE.CylinderGeometry(0.26, 0.15, 0.34, 10), cup, 0, 1.48, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 6), cup, 0, 1.73, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 10), cup, 0, 1.84, 0));
    [-0.3, 0.3].forEach(x =>
      g.add(mesh(new THREE.TorusGeometry(0.09, 0.028, 5, 9), cup, x, 1.5, 0)));
    // 传说级头顶再飘一颗自转的小星
    if (a.tier === 'legend') {
      const sm = mat(0xffd75e, { emissive: 0xe0a020, emissiveIntensity: 0.6, roughness: 0.25 });
      const star = new THREE.Group();
      for (let k = 0; k < 5; k++) {
        const spike = mesh(new THREE.ConeGeometry(0.05, 0.18, 4), sm, 0, 0.09, 0);
        const holder = new THREE.Group();
        holder.rotation.z = (k / 5) * Math.PI * 2;
        holder.add(spike);
        star.add(holder);
      }
      star.position.set(0, 2.15, 0);
      star.userData.spin = true;
      g.add(star);
    }
  } else {
    // 未达成：半透明问号碑
    const ghost = mat(0xb8b2a8, { transparent: true, opacity: 0.45 });
    g.add(mesh(new THREE.BoxGeometry(0.42, 0.56, 0.1), ghost, 0, 1.55, 0));
  }
  return g;
}

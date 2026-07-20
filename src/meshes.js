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
  // 木地板 + 拼缝
  g.add(mesh(new THREE.BoxGeometry(8.4, 0.3, 8.4), mat(0xc9a06a), 0, -0.15, 0));
  for (let k = -3; k <= 3; k++) {
    g.add(mesh(new THREE.BoxGeometry(0.04, 0.02, 8.4), mat(0xb08a55), k * 1.05, 0.01, 0));
  }
  // 后墙和左墙（前方和右侧敞开给镜头）
  g.add(mesh(new THREE.BoxGeometry(8.4, 3.6, 0.3), wallMat, 0, 1.8, -4.05));
  g.add(mesh(new THREE.BoxGeometry(0.3, 3.6, 8.4), wallMat, -4.05, 1.8, 0));
  // 踢脚线
  g.add(mesh(new THREE.BoxGeometry(8.4, 0.25, 0.08), mat(0xa9825a), 0, 0.12, -3.86));
  g.add(mesh(new THREE.BoxGeometry(0.08, 0.25, 8.4), mat(0xa9825a), -3.86, 0.12, 0));
  // 后墙的窗户：夜里也透着天光
  const win = mesh(new THREE.BoxGeometry(1.5, 1.2, 0.1), mat(0xbfe3f0, { emissive: 0x89b8d4, emissiveIntensity: 0.35 }), -2.2, 1.9, -3.95);
  g.add(win);
  [[0, 1.2, 0.06], [1.5, 0.12, 1.24]].forEach(([w, h]) => {
    g.add(mesh(new THREE.BoxGeometry(w || 0.1, h, 0.12), mat(0x8a5a2b), -2.2, 1.9, -3.94));
  });
  // 屋里常亮的暖光
  const lamp = new THREE.PointLight(0xffd9a0, 0.85, 16, 1.8);
  lamp.position.set(0.5, 3.2, 0.5);
  g.add(lamp);
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

/* ================= 作物展示区（草地左侧，工坊对面） ================= */

export const DISPLAY_SLOTS = 10;

export function createDisplaySlotMesh() {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.26, 0.72), mat(0xeae4d6));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function displaySlotPos(k) {
  // 再往左让开一点，免得跟最外侧的装饰台贴到一起
  const row = Math.floor(k / 5), col = k % 5;
  return { x: -8 - row * 1.3, z: (col - 2) * 1.3 };
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

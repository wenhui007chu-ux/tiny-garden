import * as THREE from 'three';
import { GRID, TILE, UPPER_Y, UPPER_Z, LAWN_R, houseSkinColor, SEAFOOD,
  RANCH_GRID, RANCH_TILE, TOWER_FINISHES } from './config.js';

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

// 梯子的安放参数。平台的矮墙要在同一处开豁口，所以两个函数共用这一组常量，
// 别在各自函数里各写一份——改了一边忘了另一边，梯子就又从栏杆里穿出去了。
const LADDER_Z = -5.4;        // 梯子沿平台右边缘停在这个 z
const LADDER_GAP = 1.5;       // 右侧矮墙给梯子留的豁口宽度
const LADDER_LEAN = 0.26;     // 倚靠倾角，约 15°
const LADDER_H = 5.3;         // 梯长：够到台面之后还高出一截，跟真梯子一样
const LADDER_BASE_X = 4.87;   // 底端落点，正好让梯身贴着平台外沿而不是插进去
const LADDER_BASE_Y = -0.51;  // 草地高度

export function createUpperDeck() {
  const g = new THREE.Group();
  const size = GRID + 1.2, wallH = 0.55, wallT = 0.35;
  const out = size / 2 - wallT / 2;
  const woodMat = mat(0xc79a66);

  // 平台底板
  g.add(mesh(new THREE.BoxGeometry(size, 0.5, size), mat(0xb2854f), 0, -0.25, 0));
  // 三面矮墙照常
  const gx = new THREE.BoxGeometry(size, wallH, wallT);
  const gz = new THREE.BoxGeometry(wallT, wallH, size);
  g.add(mesh(gx, woodMat, 0, wallH / 2, -out));
  g.add(mesh(gx, woodMat, 0, wallH / 2, out));
  g.add(mesh(gz, woodMat, -out, wallH / 2, 0));
  // 右侧矮墙拆成两段，中间留个豁口给梯子——原来四面封死，梯子顶端只能从墙里穿出来
  const gapC = LADDER_Z - UPPER_Z;                       // 豁口中心（本地 z）
  [[-size / 2, gapC - LADDER_GAP / 2], [gapC + LADDER_GAP / 2, size / 2]].forEach(([z0, z1]) => {
    if (z1 - z0 <= 0.01) return;
    g.add(mesh(new THREE.BoxGeometry(wallT, wallH, z1 - z0), woodMat, out, wallH / 2, (z0 + z1) / 2));
  });
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
  const H = LADDER_H;   // 先在本地坐标里立直：底端在原点，顶端在 y=H
  // 两根扶手沿 z 分开，于是「攀爬面」朝向 ±X。
  // 这一点必须和倾斜轴对上：梯子是绕 z 轴倾斜（在 XZ 里朝 -x 倒向平台），
  // 横档就得垂直于那个倾斜平面。原来扶手沿 x 分开、横档也沿 x，
  // 一倾斜横档跟着歪，看上去是人得侧着身子爬。
  [-0.42, 0.42].forEach(z =>
    g.add(mesh(new THREE.BoxGeometry(0.13, H, 0.13), woodMat, 0, H / 2, z)));
  // 横档：等间距爬满两根扶手之间
  const rungs = 8, step = (H - 0.7) / (rungs - 1);
  for (let k = 0; k < rungs; k++) {
    g.add(mesh(new THREE.BoxGeometry(0.15, 0.1, 0.96), woodMat, 0, 0.45 + k * step, 0));
  }
  // 倚在平台右侧「外沿」上：整根梯身都在 x>3.6 的外侧，只有顶端 0.4 探过台面，
  // 正对矮墙那个豁口。原来底端太靠里，梯身在半空就钻进底板里去了。
  g.position.set(LADDER_BASE_X, LADDER_BASE_Y, LADDER_Z);
  g.rotation.z = LADDER_LEAN;
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

// 典藏大楼（原址就是拆掉的图鉴大楼）。比原来那座三角楣小庙气派一截：
// 七根柱子对应七个展厅，屋顶换成金穹顶 + 旋转的宝箱招牌
export function createTreasuryBuilding() {
  const g = new THREE.Group();
  const stone = mat(0xf2ead8);
  const trim = mat(0xd8cdb8);
  const gold = mat(0xf2c94c, { roughness: 0.35 });
  // 三级台阶
  [[4.4, 0], [4.0, 0.22], [3.6, 0.44]].forEach(([w, dz], k) =>
    g.add(mesh(new THREE.BoxGeometry(w, 0.2, 3.6 - k * 0.3), trim, 0, 0.1 + k * 0.2, 0.3 + dz)));
  // 主体
  g.add(mesh(new THREE.BoxGeometry(3.8, 2.9, 2.8), stone, 0, 2.05, -0.4));
  // 七根立柱（七个展厅）+ 柱头
  [-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5].forEach(x => {
    g.add(mesh(new THREE.CylinderGeometry(0.13, 0.15, 2.6, 9), stone, x * 1.02, 1.9, 1.2));
    g.add(mesh(new THREE.BoxGeometry(0.34, 0.12, 0.34), trim, x * 1.02, 3.26, 1.2));
  });
  // 檐口
  g.add(mesh(new THREE.BoxGeometry(4.3, 0.24, 3.4), mat(0xe4d9c4), 0, 3.46, 0.2));
  // 金穹顶：三段渐收的圆柱 + 顶球
  [[1.55, 0.5, 3.85], [1.15, 0.45, 4.28], [0.7, 0.4, 4.68]].forEach(([r, h, y]) =>
    g.add(mesh(new THREE.CylinderGeometry(r * 0.78, r, h, 14), mat(0xe8dcc6), 0, y, 0.2)));
  g.add(mesh(new THREE.SphereGeometry(0.42, 12, 10), gold, 0, 5.08, 0.2));
  // 大门 + 门楣浮雕
  g.add(mesh(new THREE.BoxGeometry(1.2, 2.0, 0.1), mat(0x7a4a24), 0, 1.6, 1.02));
  g.add(mesh(new THREE.BoxGeometry(1.5, 0.16, 0.14), gold, 0, 2.72, 1.02));
  // 屋顶旋转的金宝箱招牌
  const chest = new THREE.Group();
  chest.add(mesh(new THREE.BoxGeometry(0.62, 0.4, 0.44), gold, 0, 0, 0));
  chest.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.62, 10, 1, false, 0, Math.PI),
    mat(0xffe08a, { roughness: 0.3 }), 0, 0.2, 0).rotateZ(Math.PI / 2));
  chest.position.set(0, 5.85, 0.2);
  chest.userData.spin = true;
  g.add(chest);

  g.traverse(o => { if (o.isMesh) o.userData.treasury = true; });
  return g;
}

// 馆内大厅（藏在岛下，进馆时镜头切过去）。
// 一次只展出一个分类，所以厅只要装得下最大的那一类（农作物 88 格，8 列 × 11 行）。
// 后区仍是红毯贵宾厅，摆 10 台个人展台。
export function createTreasuryInterior() {
  const g = new THREE.Group();
  const W = 21, D = 40;
  const wallMat = mat(0xf0ead9);
  // 大理石地面 + 纵向分隔线
  g.add(mesh(new THREE.BoxGeometry(W, 0.3, D), mat(0xdcd3c2), 0, -0.15, 0));
  for (let k = -4; k <= 4; k++) {
    g.add(mesh(new THREE.BoxGeometry(0.05, 0.02, D), mat(0xc4b9a4), k * 2.4, 0.01, 0));
  }
  // 后墙 + 两侧墙
  g.add(mesh(new THREE.BoxGeometry(W, 6, 0.3), wallMat, 0, 3, -D / 2 + 0.15));
  [-1, 1].forEach(s => g.add(mesh(new THREE.BoxGeometry(0.3, 6, D), wallMat, s * (W / 2 - 0.15), 3, 0)));
  // 后墙高窗
  [-6.5, 0, 6.5].forEach(x =>
    g.add(mesh(new THREE.BoxGeometry(2.2, 1.8, 0.1),
      mat(0xbfe3f0, { emissive: 0x89b8d4, emissiveIntensity: 0.4 }), x, 4.1, -D / 2 + 0.25)));
  // 贵宾区：红毯 + 金柱拱门分界
  g.add(mesh(new THREE.BoxGeometry(15.4, 0.06, 8.8), mat(0xa8433a), 0, 0.04, 15));
  g.add(mesh(new THREE.BoxGeometry(14.6, 0.02, 8), mat(0xc9584a), 0, 0.08, 15));
  const gold = mat(0xf2c94c, { roughness: 0.35 });
  [-7.6, 7.6].forEach(x => {
    g.add(mesh(new THREE.CylinderGeometry(0.2, 0.26, 3.6, 10), gold, x, 1.8, 10.4));
    g.add(mesh(new THREE.SphereGeometry(0.3, 8, 7), gold, x, 3.8, 10.4));
  });
  g.add(mesh(new THREE.BoxGeometry(15.8, 0.28, 0.5), gold, 0, 4.15, 10.4));
  // 顶灯
  [[-5, -14], [5, -14], [-5, -7], [5, -7], [-5, 0], [5, 0], [0, 6], [-5, 15], [5, 15]].forEach(([x, z]) => {
    const l = new THREE.PointLight(0xfff2d8, 0.45, 22, 1.8);
    l.position.set(x, 5, z);
    g.add(l);
  });
  return g;
}

// 繁荣度水晶柱：立在贵宾区拱门中间，越满越亮越高。ratio ∈ [0,1]
export function createProsperityPillar(ratio = 0) {
  const g = new THREE.Group();
  const r = Math.min(1, Math.max(0, ratio));
  g.add(mesh(new THREE.CylinderGeometry(0.85, 1.05, 0.3, 12), mat(0xd8cdb8), 0, 0.15, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.24, 12),
    mat(0xf2c94c, { roughness: 0.35 }), 0, 0.42, 0));
  // 空柱（外壳）
  g.add(mesh(new THREE.CylinderGeometry(0.34, 0.34, 3.4, 12),
    mat(0xbfd4e0, { transparent: true, opacity: 0.28, roughness: 0.2 }), 0, 2.25, 0));
  // 里面按繁荣度灌起来的光柱
  if (r > 0.001) {
    const h = 3.3 * r;
    g.add(mesh(new THREE.CylinderGeometry(0.27, 0.27, h, 12),
      mat(0xffe08a, { emissive: 0xd8a63a, emissiveIntensity: 0.85, roughness: 0.2 }),
      0, 0.58 + h / 2, 0));
    const l = new THREE.PointLight(0xffd9a0, 0.3 + r * 0.9, 9, 2);
    l.position.set(0, 0.6 + h, 0);
    g.add(l);
  }
  // 顶冠
  g.add(mesh(new THREE.SphereGeometry(0.3, 10, 9),
    mat(0xf2c94c, { roughness: 0.3, emissive: 0x8a6a1a, emissiveIntensity: 0.2 + r * 0.5 }), 0, 4.1, 0));
  return g;
}

// 典藏展柜：比原来的说明台紧凑得多（88 格同屏，台座那套 6 个 mesh 撑不住）。
// 空柜只有灰底座 + 半透玻璃罩，收录了才镶金、亮灯、把东西摆进去
export function createTreasuryCase(filled) {
  const g = new THREE.Group();
  const stone = mat(filled ? 0xf7f2e6 : 0xa9a191);
  g.add(mesh(new THREE.BoxGeometry(0.86, 0.12, 0.86), stone, 0, 0.06, 0));
  g.add(mesh(new THREE.BoxGeometry(0.56, 0.78, 0.56), stone, 0, 0.51, 0));
  g.add(mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), stone, 0, 0.95, 0));
  if (filled) {
    g.add(mesh(new THREE.BoxGeometry(0.84, 0.035, 0.84),
      mat(0xf2c94c, { roughness: 0.35, emissive: 0x8a6a1a, emissiveIntensity: 0.25 }), 0, 1.01, 0));
    // 玻璃罩
    g.add(mesh(new THREE.BoxGeometry(0.66, 0.8, 0.66),
      mat(0xcfe4ee, { transparent: true, opacity: 0.16, roughness: 0.15 }), 0, 1.42, 0));
  }
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

/* ================= 高级料理工坊 =================
 * 比普通料理工坊高一头的石砌餐厅：深色石墙 + 金顶 + 两根冒火的大烟囱，
 * 招牌是一顶会转的厨师帽 + 三颗米其林小星星。
 * 全部用基本几何体拼，没有任何外部素材。
 */

export function createGourmetKitchen() {
  const g = new THREE.Group();
  const stone = mat(0xa8907c);       // 暖砂岩，比旁边橙黄的料理工坊沉一档，但不能真发黑
  const trim = mat(0xeee2cf);        // 米白腰线
  const gold = mat(0xe0b64a, { metalness: 0.3, roughness: 0.5 });
  const roof = mat(0x9a3f52);        // 酒红屋顶

  // 主楼：比普通工坊宽一圈、高一层
  g.add(mesh(new THREE.BoxGeometry(4.2, 2.8, 3.2), stone, 0, 1.4, 0));
  // 腰线和台基
  g.add(mesh(new THREE.BoxGeometry(4.4, 0.18, 3.4), trim, 0, 1.5, 0));
  g.add(mesh(new THREE.BoxGeometry(4.6, 0.22, 3.6), trim, 0, 0.11, 0));

  // 四坡金边屋顶：抬高到 1.7，太扁的话俯视就是一块平板
  const rf = mesh(new THREE.ConeGeometry(3.1, 1.7, 4), roof, 0, 3.68, 0);
  rf.rotation.y = Math.PI / 4;
  g.add(rf);
  g.add(mesh(new THREE.BoxGeometry(4.5, 0.14, 3.5), gold, 0, 2.85, 0));
  // 屋脊小金球
  g.add(mesh(new THREE.SphereGeometry(0.17, 8, 6), gold, 0, 4.62, 0));

  // 两根石烟囱，各顶一簇跳动的火苗
  // 火苗材质必须每根单独 new：flame 动画直接改 material.emissiveIntensity，
  // 共用材质的话两根会互相覆盖（其实是同一个对象）
  [-1.35, 1.35].forEach(x => {
    g.add(mesh(new THREE.BoxGeometry(0.46, 1.3, 0.46), mat(0x8a7364), x, 3.4, -0.9));
    const fire = mesh(new THREE.ConeGeometry(0.2, 0.45, 6),
      mat(0xf07a2a, { emissive: 0xd94a10, emissiveIntensity: 0.85 }), x, 4.28, -0.9);
    fire.userData.flame = true;
    g.add(fire);
  });

  // 拱门 + 门口两盏暖灯
  g.add(mesh(new THREE.BoxGeometry(1.05, 1.7, 0.1), mat(0x6a4632), 0, 0.95, 1.62));
  g.add(mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.1, 12, 1, false, 0, Math.PI), mat(0x6a4632), 0, 1.8, 1.62));
  [-0.95, 0.95].forEach(x => {
    g.add(mesh(new THREE.SphereGeometry(0.13, 7, 6),
      mat(0xffe0a0, { emissive: 0xf0c060, emissiveIntensity: 0.7 }), x, 1.9, 1.62));
  });
  // 落地长窗，透出橘黄的灯光
  [-1.5, 1.5].forEach(x => {
    g.add(mesh(new THREE.BoxGeometry(0.85, 1.25, 0.07),
      mat(0xf0c878, { emissive: 0xc08830, emissiveIntensity: 0.35 }), x, 1.2, 1.62));
  });
  // 门口雨篷：一块向外下斜的板子。
  // 别用半圆柱——CylinderGeometry 开一半再转 90°，在这个视角下会糊成一大坨暗红色
  const awn = mesh(new THREE.BoxGeometry(2.7, 0.12, 1.15), roof, 0, 2.3, 2.06);
  awn.rotation.x = -0.42;
  g.add(awn);
  g.add(mesh(new THREE.BoxGeometry(2.7, 0.1, 0.1), gold, 0, 2.08, 2.58)); // 篷檐金边

  // 露天小餐位：两张圆桌，坐实「餐厅」而不是「工厂」
  [[-3.0, 2.4], [3.0, 2.4]].forEach(([x, z]) => {
    g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6), mat(0x6a5a4a), x, 0.45, z));
    g.add(mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.09, 12), trim, x, 0.84, z));
    g.add(mesh(new THREE.SphereGeometry(0.1, 6, 5), mat(0xd94a6a), x, 0.97, z)); // 桌上一朵小花
  });

  // 招牌：会转的厨师帽 + 三颗米其林星，做成门边一块落地立牌。
  // 两个坑都别踩：放屋顶会被 addSign() 的浮空招牌压在一起（它按整栋楼包围盒顶部摆），
  // 贴正面墙又会被雨篷挡住。挪到门右边的空地上，两样都躲开了
  g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.25, 6), mat(0x6a5a4a), 1.7, 0.72, 2.3));
  const sign = new THREE.Group();
  // 厨师帽的形要靠「细帽箍 + 鼓帽顶」的对比撑起来。
  // 上下一样宽（之前帽箍 0.3、帽顶 0.34）远看就是个灰垃圾桶
  const hatBand = mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.2, 12), mat(0xf0ebe0), 0, 0, 0);
  const hatTop = mesh(new THREE.SphereGeometry(0.38, 12, 9), mat(0xfbf8f2), 0, 0.28, 0);
  hatTop.scale.set(1, 0.92, 1);
  sign.add(hatBand, hatTop);
  [-0.56, 0, 0.56].forEach((x, k) => {
    const star = mesh(new THREE.OctahedronGeometry(0.14), gold, x, -0.42, 0);
    star.rotation.z = 0.4 + k;
    sign.add(star);
  });
  sign.position.set(1.7, 1.85, 2.3);
  sign.userData.spin = true;
  g.add(sign);

  g.traverse(o => { if (o.isMesh) o.userData.gourmet = true; });
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

/* ================= 牧场：10 种家畜 + 围栏 =================
   一句话定位：新手玩农场，老手玩牧场。
   鸡/兔/猪/羊/鹿直接复用宠物那套模型，只补 5 种牧场专有的。 */

// 牧场专有的 5 种（宠物里没有的）
const ranchKinds = {
  duck(c1, c2) {
    const g = new THREE.Group();
    const body = mesh(new THREE.SphereGeometry(0.3, 9, 7), mat(c1), 0, 0.3, 0);
    body.scale.set(1.35, 0.95, 1);
    g.add(body);
    g.add(mesh(new THREE.SphereGeometry(0.18, 9, 7), mat(c1), 0.3, 0.62, 0));      // 头
    g.add(mesh(new THREE.BoxGeometry(0.22, 0.05, 0.12), mat(c2), 0.5, 0.58, 0));   // 扁嘴
    [[-0.06], [0.06]].forEach(([z]) =>
      g.add(mesh(new THREE.SphereGeometry(0.03, 5, 4), mat(0x2a2a30), 0.38, 0.68, z)));
    const tail = mesh(new THREE.ConeGeometry(0.12, 0.22, 5), mat(c1), -0.36, 0.36, 0);
    tail.rotation.z = 1.9;
    g.add(tail);
    [[-0.1], [0.1]].forEach(([z]) =>
      g.add(mesh(new THREE.BoxGeometry(0.14, 0.03, 0.1), mat(c2), 0.02, 0.03, z)));  // 蹼
    return g;
  },
  goat(c1, c2) {
    const g = new THREE.Group();
    const body = mesh(new THREE.SphereGeometry(0.27, 8, 7), mat(c1), 0, 0.42, 0);
    body.scale.set(1.4, 1, 1);
    g.add(body);
    g.add(mesh(new THREE.SphereGeometry(0.17, 8, 7), mat(c1), 0.34, 0.62, 0));     // 头
    [[-0.07], [0.07]].forEach(([z]) => {                                            // 弯角
      const horn = mesh(new THREE.ConeGeometry(0.045, 0.26, 5), mat(c2), 0.3, 0.84, z);
      horn.rotation.z = -0.5;
      g.add(horn);
    });
    g.add(mesh(new THREE.ConeGeometry(0.06, 0.16, 5), mat(c2), 0.42, 0.48, 0).rotateZ(0.3)); // 胡子
    [[-0.16, 0.1], [0.16, 0.1], [-0.16, -0.1], [0.16, -0.1]].forEach(([x, z]) =>
      g.add(mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.32, 5), mat(c2), x, 0.16, z)));
    return g;
  },
  cow(c1, c2) {
    const g = new THREE.Group();
    const body = mesh(new THREE.SphereGeometry(0.36, 9, 7), mat(c1), 0, 0.5, 0);
    body.scale.set(1.5, 1, 1.1);
    g.add(body);
    // 奶牛斑块
    [[0.1, 0.62, 0.3], [-0.22, 0.46, -0.32], [0.3, 0.4, 0.2]].forEach(([x, y, z]) => {
      const p = mesh(new THREE.SphereGeometry(0.14, 7, 6), mat(c2), x, y, z);
      p.scale.set(1.1, 0.8, 0.6);
      g.add(p);
    });
    g.add(mesh(new THREE.SphereGeometry(0.22, 8, 7), mat(c1), 0.5, 0.66, 0));      // 头
    g.add(mesh(new THREE.SphereGeometry(0.12, 7, 6), mat(0xf2b0b8), 0.68, 0.6, 0)); // 鼻子
    [[-0.12], [0.12]].forEach(([z]) =>
      g.add(mesh(new THREE.ConeGeometry(0.05, 0.14, 4), mat(0xe8e2d0), 0.46, 0.86, z)));  // 角
    g.add(mesh(new THREE.SphereGeometry(0.11, 7, 6), mat(0xf2b0b8), -0.05, 0.24, 0));     // 乳房
    [[-0.22, 0.16], [0.22, 0.16], [-0.22, -0.16], [0.22, -0.16]].forEach(([x, z]) =>
      g.add(mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.36, 6), mat(c2), x, 0.18, z)));
    return g;
  },
  horse(c1, c2, def) {
    const g = new THREE.Group();
    const glow = def?.glow ? { emissive: c2, emissiveIntensity: def.glow } : {};
    const body = mesh(new THREE.SphereGeometry(0.34, 9, 7), mat(c1, glow), 0, 0.58, 0);
    body.scale.set(1.55, 1, 1);
    g.add(body);
    const neck = mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.42, 7), mat(c1, glow), 0.42, 0.82, 0);
    neck.rotation.z = -0.55;
    g.add(neck);
    const head = mesh(new THREE.BoxGeometry(0.3, 0.17, 0.16), mat(c1, glow), 0.64, 0.98, 0);
    head.rotation.z = -0.25;
    g.add(head);
    [[-0.05], [0.05]].forEach(([z]) =>
      g.add(mesh(new THREE.ConeGeometry(0.04, 0.12, 4), mat(c1, glow), 0.52, 1.12, z)));  // 耳
    // 鬃毛
    for (let k = 0; k < 5; k++) {
      g.add(mesh(new THREE.BoxGeometry(0.07, 0.13, 0.06), mat(c2, glow), 0.3 + k * 0.08, 0.94 + k * 0.03, 0));
    }
    const tail = mesh(new THREE.ConeGeometry(0.09, 0.4, 5), mat(c2, glow), -0.52, 0.6, 0);
    tail.rotation.z = 2.5;
    g.add(tail);
    [[-0.24, 0.13], [0.24, 0.13], [-0.24, -0.13], [0.24, -0.13]].forEach(([x, z]) =>
      g.add(mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.5, 6), mat(c1, glow), x, 0.25, z)));
    return g;
  },
  unicorn(c1, c2, def) {
    // 就是马，外加一支发光独角和一圈光环
    const g = ranchKinds.horse(c1, c2, { glow: def?.glow ?? 0.25 });
    const horn = mesh(new THREE.ConeGeometry(0.06, 0.34, 6),
      mat(0xfff0b8, { emissive: 0xffd45a, emissiveIntensity: 1 }), 0.66, 1.24, 0);
    horn.rotation.z = -0.3;
    g.add(horn);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const star = mesh(new THREE.OctahedronGeometry(0.05),
        mat(0xfff2c8, { emissive: 0xffcf5a, emissiveIntensity: 1, transparent: true, opacity: 0.9 }),
        Math.cos(a) * 0.5, 1.35 + Math.sin(k * 1.7) * 0.1, Math.sin(a) * 0.5);
      star.userData.spin = true;
      g.add(star);
    }
    const l = new THREE.PointLight(0xffe6a0, 0.7, 5, 2);
    l.position.set(0, 1.1, 0);
    g.add(l);
    return g;
  },
};

// 每种家畜的外观：kind 指向 ranchKinds 或 petKinds
const ANIMAL_LOOK = {
  chick:   { kind: 'chick',   c1: 0xf7d154, c2: 0xe8843f },
  rabbit:  { kind: 'bunny',   c1: 0xf5f0e6, c2: 0xf2a7c3 },
  duck:    { kind: 'duck',    c1: 0xf7f2e4, c2: 0xf2a83c },
  goat:    { kind: 'goat',    c1: 0xe8e0cc, c2: 0xa8917a },
  sheep:   { kind: 'lamb',    c1: 0xf7f4ec, c2: 0x3a3a44 },
  pig:     { kind: 'piglet',  c1: 0xf2b0bc, c2: 0xe08a9a },
  cow:     { kind: 'cow',     c1: 0xf7f4ec, c2: 0x3a3a40 },
  horse:   { kind: 'horse',   c1: 0x9a6a42, c2: 0x4a3320 },
  deer:    { kind: 'deer',    c1: 0xc99a5a, c2: 0xf5f0e6 },
  unicorn: { kind: 'unicorn', c1: 0xf7f2ea, c2: 0xd9a8e0, glow: 0.3 },
};

// grown=false 是幼崽（同一个模型缩小），true 是成年
export function createAnimalMesh(id, grown = true) {
  const look = ANIMAL_LOOK[id] ?? ANIMAL_LOOK.chick;
  const build = ranchKinds[look.kind] ?? petKinds[look.kind];
  const g = build(look.c1, look.c2, look);
  g.scale.setScalar(grown ? 1 : 0.5);
  if (grown) g.userData.petIdle = true; // 成年了会有待机小动作
  return g;
}

// 栏位坐标（牧场局部坐标，牧场整体再挪到岛东侧）
export function ranchPos(i, j) {
  const half = (RANCH_GRID - 1) / 2;
  return { x: (i - half) * RANCH_TILE, y: 0.12, z: (j - half) * RANCH_TILE };
}

// 单个栏位的地面
export function createRanchPen() {
  const m = mesh(new THREE.BoxGeometry(RANCH_TILE * 0.94, 0.16, RANCH_TILE * 0.94), mat(0x8aba6a), 0, 0, 0);
  m.userData.ranchPen = true;
  return m;
}

// 屠宰场：牧场北边的红顶砖房，门口挂块肉招牌
export function createButcher() {
  const g = new THREE.Group();
  const wall = mat(0xefe3d2), roof = mat(0xb0433c), trim = mat(0x8a5a35);
  g.add(mesh(new THREE.BoxGeometry(3.4, 2.1, 2.8), wall, 0, 1.05, 0));
  const r = mesh(new THREE.ConeGeometry(2.7, 1.3, 4), roof, 0, 2.75, 0);
  r.rotation.y = Math.PI / 4;
  g.add(r);
  g.add(mesh(new THREE.BoxGeometry(0.42, 0.9, 0.42), mat(0xa2705a), 1.1, 3.1, -0.5)); // 烟囱
  g.add(mesh(new THREE.BoxGeometry(0.9, 1.4, 0.1), trim, -0.5, 0.7, 1.42));           // 门
  g.add(mesh(new THREE.BoxGeometry(0.9, 0.75, 0.1), mat(0xbfe3f0), 0.9, 1.25, 1.42)); // 窗
  // 门口的肉招牌
  g.add(mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), trim, 1.9, 0.55, 1.2));
  g.add(mesh(new THREE.BoxGeometry(0.9, 0.5, 0.08), mat(0xf5e6c8), 1.9, 1.3, 1.2));
  g.add(mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(0xd9534f), 1.9, 1.32, 1.28));
  // 屋侧的挂肉钩
  [[-1.75, 1.3], [-1.75, 0.3]].forEach(([x, z]) => {
    g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4), mat(0x8a8a92), x, 1.5, z));
    const m = mesh(new THREE.SphereGeometry(0.17, 7, 6), mat(0xd9707a), x, 1.15, z);
    m.scale.set(0.8, 1.3, 0.8);
    g.add(m);
  });
  g.traverse(o => { if (o.isMesh) o.userData.butcher = true; });
  return g;
}

// 牧场整体：草地基座 + 一圈木栅栏 + 门
export function createRanchGround() {
  const g = new THREE.Group();
  const span = RANCH_GRID * RANCH_TILE;
  const pad = 1.4;
  const w = span + pad * 2;
  g.add(mesh(new THREE.BoxGeometry(w, 0.3, w), mat(0x7fb063), 0, -0.08, 0));      // 草地
  const post = mat(0xb98a5a), rail = mat(0xd0a878);
  const half = w / 2;
  // 四边栅栏：立柱 + 两道横杆
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const along = dx ? 'z' : 'x';
    for (let t = -half; t <= half; t += 1.6) {
      const p = mesh(new THREE.BoxGeometry(0.14, 0.9, 0.14), post,
        dx ? dx * half : t, 0.45, dz ? dz * half : t);
      g.add(p);
    }
    [0.34, 0.66].forEach(h => {
      const bar = mesh(new THREE.BoxGeometry(dx ? 0.09 : w, 0.09, dx ? w : 0.09), rail,
        dx ? dx * half : 0, h, dz ? dz * half : 0);
      g.add(bar);
    });
  }
  // 牧场招牌
  g.add(mesh(new THREE.BoxGeometry(0.16, 1.3, 0.16), post, -half + 0.4, 0.65, half + 0.1));
  g.add(mesh(new THREE.BoxGeometry(1.6, 0.5, 0.1), mat(0xe8c68f), -half + 1.2, 1.2, half + 0.1));
  g.traverse(o => { if (o.isMesh) o.userData.ranch = true; });
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

// 杂交作物的 3D 模型（参数化生成）；漏配一条就会 fallback 成 h1 的样子
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
  // 特殊种子配对：不加这几条就会 fallback 成 h1 的样子，五个长得一模一样
  h21: { kind: 'blob',    c1: 0x4a9e4a, c2: 0x8fbf6a },
  h22: { kind: 'cluster', c1: 0x8a4ac2, c2: 0xe8483f },
  h23: { kind: 'melon',   c1: 0x5a7a3a, c2: 0xe8842f },
  h24: { kind: 'bulb',    c1: 0xf7a8b8, c2: 0xe0364a },
  h25: { kind: 'gem',     c1: 0xf2557a, c2: 0xffd0dc, glow: 0.6 },
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
    // 菠西蜜（菠萝×西瓜）：拉长的果身 + 菠萝式冠叶 + 西瓜纹，之前漏了这个分支，模型一直是空的
    case 'crown': {
      const body = mesh(new THREE.SphereGeometry(0.19, 9, 7), m1, 0, 0.22, 0);
      body.scale.set(1, 1.25, 1);
      g.add(body);
      for (let k = 0; k < 6; k++) { // 冠叶
        const a = (k / 6) * Math.PI * 2;
        const leaf = mesh(new THREE.ConeGeometry(0.05, 0.24, 4), m2, Math.cos(a) * 0.06, 0.46, Math.sin(a) * 0.06);
        leaf.rotation.set(Math.sin(a) * 0.5, -a, -Math.cos(a) * 0.5);
        g.add(leaf);
      }
      for (let k = 0; k < 4; k++) { // 西瓜纹
        const a = (k / 4) * Math.PI * 2;
        g.add(mesh(new THREE.BoxGeometry(0.025, 0.34, 0.025), m2, Math.cos(a) * 0.17, 0.22, Math.sin(a) * 0.17));
      }
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

// 10 座个人展台在贵宾厅里的位置，5 列 x 2 排。
// 两排都必须整个落在红毯上——红毯是 createTreasuryInterior 里那块
// BoxGeometry(15.4, 0.06, 8.8) @ z=15，也就是 x[-7.7, 7.7] / z[10.6, 19.4]，
// 金柱拱门立在 z=10.4 划出分界。
// 原来第一排在 z=9，整排跑到拱门外面、落进典藏展区里去了（看着就是「一半在
// 基础图鉴里」）。现在两排改成以红毯中心 z=15 对称，台座（1.05 见方）占
// z[12.68, 13.73] 和 [16.28, 17.33]，离水晶柱（z=10.4）还有 2.8 的余量。
export function galleryPedestalPos(k) {
  const col = k % 5, row = Math.floor(k / 5);
  return { x: (col - 2) * 3, z: 13.2 + row * 3.6 };
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
  // 月光果：一弯冷白月牙悬在叶冠上，旁边跟一颗小星
  moonfruit(stage) {
    const g = new THREE.Group();
    if (stage === 0) return sprout(0.95);
    if (stage === 1) { g.add(leafCrown(0.9, 0x7a8ca8)); return g; }
    const s = stage === 2 ? 0.6 : 1;
    const glow = stage === 3 ? 0.6 : 0.22;
    const moonM = mat(0xf2f5ff, { emissive: 0xa8c0f0, emissiveIntensity: glow, roughness: 0.3 });
    const halo = new THREE.Group();
    // 月牙：截一段粗圆环就是 C 形，比拿小球排弧线像得多（排球看着只是一团）
    const moon = mesh(new THREE.TorusGeometry(0.17 * s, 0.062 * s, 6, 12, Math.PI * 1.3), moonM);
    moon.rotation.z = -0.35;
    halo.add(moon);
    // 两端各补一颗球，把切口磨圆成月牙尖
    [0, Math.PI * 1.3].forEach(a => {
      halo.add(mesh(new THREE.SphereGeometry(0.062 * s, 6, 5), moonM,
        Math.cos(a - 0.35) * 0.17 * s, Math.sin(a - 0.35) * 0.17 * s, 0));
    });
    halo.position.y = 0.32 * s;
    halo.userData.spin = true;
    g.add(halo);
    // 陪衬的小星
    g.add(mesh(new THREE.OctahedronGeometry(0.045 * s),
      mat(0xfff4c0, { emissive: 0xf2c94c, emissiveIntensity: glow, roughness: 0.3 }),
      0.16 * s, 0.5 * s, 0.04 * s));
    g.add(leafCrown(0.78, 0x7a8ca8));
    return g;
  },
  // 星云果：紫蓝双层球体，外层套一圈斜置的星环
  nebula(stage) {
    const g = new THREE.Group();
    if (stage === 0) return sprout(1.0);
    if (stage === 1) { g.add(leafCrown(0.95, 0x6a5a9e)); return g; }
    const s = stage === 2 ? 0.6 : 1;
    const glow = stage === 3 ? 0.75 : 0.25;
    const core = new THREE.Group();
    core.add(mesh(new THREE.IcosahedronGeometry(0.14 * s),
      mat(0x8a4ac2, { emissive: 0x6a2ab2, emissiveIntensity: glow, roughness: 0.25 })));
    core.add(mesh(new THREE.IcosahedronGeometry(0.2 * s),
      mat(0x4a6ae0, { emissive: 0x2a4ac0, emissiveIntensity: glow * 0.55,
        roughness: 0.2, transparent: true, opacity: 0.45 })));
    // 斜环 + 环上散落的星点
    const ring = mesh(new THREE.TorusGeometry(0.29 * s, 0.018 * s, 5, 16),
      mat(0xc0a8f0, { emissive: 0x8a6ae0, emissiveIntensity: glow, roughness: 0.3 }));
    ring.rotation.set(1.15, 0, 0.35);
    core.add(ring);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      core.add(mesh(new THREE.OctahedronGeometry(0.035 * s),
        mat(0xfff0ff, { emissive: 0xd0b0ff, emissiveIntensity: glow, roughness: 0.3 }),
        Math.cos(a) * 0.29 * s, Math.sin(a) * 0.1 * s, Math.sin(a) * 0.24 * s));
    }
    core.position.y = 0.34 * s;
    core.userData.spin = true;
    g.add(core, leafCrown(0.82, 0x6a5a9e));
    return g;
  },

  /* —— 后期扩充的 6 种作物（价值全部卡在彩虹果之下）—— */

  pepper(stage) { // 青椒：灯笼形，四瓣鼓起
    const g = new THREE.Group();
    if (stage === 0) return sprout(0.8);
    if (stage === 1) { g.add(leafCrown(0.8, GREEN)); return g; }
    const s = stage === 2 ? 0.6 : 1;
    g.add(leafCrown(0.85, GREEN));
    const skin = stage === 2 ? 0x8fbf5a : 0x4a9e3a;
    const body = mesh(new THREE.SphereGeometry(0.13 * s, 8, 6), mat(skin), 0, 0.16 * s + 0.06, 0);
    body.scale.set(1, 1.3, 1);
    g.add(body);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      const lobe = mesh(new THREE.SphereGeometry(0.055 * s, 6, 5), mat(stage === 2 ? 0x8fbf5a : 0x3f8f32),
        Math.cos(a) * 0.09 * s, 0.14 * s + 0.06, Math.sin(a) * 0.09 * s);
      lobe.scale.y = 1.5;
      g.add(lobe);
    }
    g.add(mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.07, 5), mat(DARKGREEN), 0, 0.31 * s + 0.06, 0));
    return g;
  },

  broccoli(stage) { // 西兰花：粗茎 + 一簇疙瘩花球
    const g = new THREE.Group();
    if (stage === 0) return sprout(0.85);
    if (stage === 1) { g.add(leafCrown(0.9, 0x5c9b52)); return g; }
    const s = stage === 2 ? 0.6 : 1;
    g.add(leafCrown(0.95, 0x5c9b52));
    g.add(mesh(new THREE.CylinderGeometry(0.05 * s, 0.065 * s, 0.18 * s, 6), mat(0xa8c88a), 0, 0.11 * s, 0));
    const floret = stage === 2 ? 0x4a8a42 : 0x2f6e2a;
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2;
      const r = k % 3 === 0 ? 0 : 0.085 * s;
      g.add(mesh(new THREE.SphereGeometry(0.06 * s, 6, 5), mat(floret),
        Math.cos(a) * r, 0.23 * s + (k % 3) * 0.02 * s, Math.sin(a) * r));
    }
    return g;
  },

  grape(stage) { // 葡萄：倒锥形串，上宽下窄
    const g = new THREE.Group();
    if (stage === 0) return sprout(0.85);
    if (stage === 1) { g.add(leafCrown(0.9, 0x6a9e4a)); return g; }
    const s = stage === 2 ? 0.6 : 1;
    g.add(leafCrown(0.9, 0x6a9e4a));
    const color = stage === 2 ? 0x9a7ab8 : 0x6a3d9e;
    [[4, 0.095, 0.3], [3, 0.06, 0.2], [1, 0, 0.1]].forEach(([n, r, y], layer) => {
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + layer * 0.7;
        g.add(mesh(new THREE.SphereGeometry(0.05 * s, 6, 5), mat(color),
          Math.cos(a) * r * s, y * s + 0.05, Math.sin(a) * r * s));
      }
    });
    return g;
  },

  avocado(stage) { // 牛油果：梨形深绿果身
    const g = new THREE.Group();
    if (stage === 0) return sprout(0.85);
    if (stage === 1) { g.add(leafCrown(0.85, 0x4a7a42)); return g; }
    const s = stage === 2 ? 0.6 : 1;
    g.add(leafCrown(0.8, 0x4a7a42));
    const body = mesh(new THREE.SphereGeometry(0.12 * s, 8, 7), mat(stage === 2 ? 0x7a9e52 : 0x3a5e2a), 0, 0.18 * s + 0.05, 0);
    body.scale.set(1, 1.45, 1);
    g.add(body);
    g.add(mesh(new THREE.SphereGeometry(0.075 * s, 7, 6), mat(stage === 2 ? 0x8aae62 : 0x46702f), 0, 0.09 * s + 0.05, 0));
    if (stage === 3) g.add(mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.06, 5), mat(0x6a4a2a), 0, 0.37 * s, 0));
    return g;
  },

  peach(stage) { // 水蜜桃：带桃缝和小叶子
    const g = new THREE.Group();
    if (stage === 0) return sprout(0.85);
    if (stage === 1) { g.add(leafCrown(0.85, 0x6aae5e)); return g; }
    const s = stage === 2 ? 0.6 : 1;
    g.add(leafCrown(0.8, 0x6aae5e));
    const body = mesh(new THREE.SphereGeometry(0.14 * s, 9, 7), mat(stage === 2 ? 0xf2d0a8 : 0xf2a0a0), 0, 0.16 * s + 0.06, 0);
    body.scale.set(1.05, 1, 1);
    g.add(body);
    g.add(mesh(new THREE.BoxGeometry(0.014, 0.22 * s, 0.03 * s),
      mat(stage === 2 ? 0xd9b48a : 0xd97a86), 0, 0.16 * s + 0.06, 0.13 * s));
    if (stage === 3) {
      const leaf = mesh(new THREE.SphereGeometry(0.06, 6, 5), mat(0x5c9b52), 0.07, 0.31 * s + 0.06, 0);
      leaf.scale.set(1.5, 0.3, 0.7);
      leaf.rotation.z = -0.5;
      g.add(leaf);
    }
    return g;
  },

  cherry(stage) { // 樱桃：一对果 + 细梗
    const g = new THREE.Group();
    if (stage === 0) return sprout(0.8);
    if (stage === 1) { g.add(leafCrown(0.8, 0x5c9b52)); return g; }
    const s = stage === 2 ? 0.6 : 1;
    g.add(leafCrown(0.85, 0x5c9b52));
    const color = stage === 2 ? 0xe08a8a : 0xd0243a;
    [[-0.07, 1], [0.07, -1]].forEach(([x, dir]) => {
      g.add(mesh(new THREE.SphereGeometry(0.075 * s, 8, 6), mat(color, { roughness: 0.45 }), x * s, 0.12 * s + 0.05, 0));
      const stem = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2 * s, 4), mat(0x5a8a3a), x * s * 0.6, 0.25 * s + 0.05, 0);
      stem.rotation.z = dir * 0.45;
      g.add(stem);
    });
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
  // 变异不是单色罩：逐个 mesh 沿色环取不同色相，整株看上去像流动的虹彩，
  // 一眼就能从一片金银里认出来
  if (quality === 'mutant') {
    let i = 0;
    group.traverse(o => {
      if (!o.isMesh) return;
      const hue = (i++ * 0.17) % 1;
      const tint = new THREE.Color().setHSL(hue, 0.85, 0.62);
      o.material.color.lerp(tint, 0.72);
      o.material.roughness = 0.18;
      o.material.metalness = 0.35;
      o.material.emissive = tint.clone().multiplyScalar(0.42);
      o.material.emissiveIntensity = 1;
    });
    return;
  }
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

/* ================= 分拣台：稀有作物拆成普通作物 + 金属条 ================= */

// 岛上的分拣台（点它开分拣面板）
export function createSorter() {
  const g = new THREE.Group();
  const metalM = mat(0x9aa4b0, { roughness: 0.45, metalness: 0.3 });
  const darkM = mat(0x5c6470);
  const woodM = mat(0xc9a06a);

  // 底座平台 + 四条腿
  g.add(mesh(new THREE.BoxGeometry(2.8, 0.24, 2.0), woodM, 0, 0.12, 0));
  [[-1.2, -0.8], [1.2, -0.8], [-1.2, 0.8], [1.2, 0.8]].forEach(([x, z]) =>
    g.add(mesh(new THREE.BoxGeometry(0.18, 0.5, 0.18), darkM, x, -0.14, z)));

  // 中间的滚筒分拣机身
  g.add(mesh(new THREE.BoxGeometry(1.9, 0.9, 1.3), metalM, 0, 0.72, 0));
  const drum = mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.5, 12), mat(0xb8c2ce, { roughness: 0.35, metalness: 0.35 }), 0, 1.28, 0);
  drum.rotation.z = Math.PI / 2;
  drum.userData.sorterDrum = true; // 有活干的时候滚起来（别蹭工坊的 gear 标记）
  g.add(drum);
  // 滚筒上的分隔环
  [-0.45, 0, 0.45].forEach(x =>
    g.add(mesh(new THREE.TorusGeometry(0.44, 0.045, 5, 10), darkM, x, 1.28, 0)));

  // 进料斗（上方敞口漏斗）
  const hopper = mesh(new THREE.CylinderGeometry(0.62, 0.3, 0.55, 6, 1, true), mat(0xd9b071, { side: THREE.DoubleSide }), 0, 2.0, 0);
  g.add(hopper);

  // 两条出料槽：左边吐普通作物（木色），右边吐金属条（金色）
  const chuteL = mesh(new THREE.BoxGeometry(0.7, 0.1, 0.5), woodM, -1.15, 0.5, 0.45);
  chuteL.rotation.z = 0.32;
  g.add(chuteL);
  const chuteR = mesh(new THREE.BoxGeometry(0.7, 0.1, 0.5), mat(0xe0b64a, { roughness: 0.3, metalness: 0.3 }), 1.15, 0.5, 0.45);
  chuteR.rotation.z = -0.32;
  g.add(chuteR);

  // 出料口下各堆一点成品当招牌：左边一颗菜，右边两根金属条
  g.add(mesh(new THREE.SphereGeometry(0.16, 7, 6), mat(0x6aae5e), -1.45, 0.28, 0.62));
  g.add(createMetalBar('gold', 0.75).translateX(1.42).translateY(0.2).translateZ(0.55));
  g.add(createMetalBar('silver', 0.65).translateX(1.5).translateY(0.2).translateZ(0.3));

  // 两个分拣位的指示灯
  [-0.55, 0.55].forEach((x, k) => {
    const lamp = mesh(new THREE.SphereGeometry(0.09, 7, 6),
      mat(0x6ae0a0, { emissive: 0x2a8a5a, emissiveIntensity: 0.5 }), x, 1.25, 0.68);
    lamp.userData.sorterLamp = k;
    g.add(lamp);
  });

  g.traverse(o => { if (o.isMesh) o.userData.sorter = true; });
  return g;
}

// 一根金属条：上窄下宽的梯形块，金/银两色
export function createMetalBar(quality, scale = 1) {
  const g = new THREE.Group();
  const gold = quality === 'gold';
  const m = mat(gold ? 0xe0b64a : 0xc0cad6, {
    roughness: 0.25, metalness: 0.5,
    emissive: gold ? 0x8a6a10 : 0x5a6470, emissiveIntensity: 0.25,
  });
  // 梯形锭身：用 4 边圆柱压扁当棱台
  const bar = mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.16, 4), m, 0, 0.08, 0);
  bar.rotation.y = Math.PI / 4;
  bar.scale.set(1, 1, 1.7);
  g.add(bar);
  // 顶面高光条
  g.add(mesh(new THREE.BoxGeometry(0.14, 0.02, 0.34),
    mat(gold ? 0xf7d97a : 0xe8eef4, { roughness: 0.2, metalness: 0.4 }), 0, 0.17, 0));
  g.scale.setScalar(scale);
  return g;
}

/* ================= 建筑悬浮名牌 ================= */

// 用 canvas 现画一张气泡贴图，贴到 Sprite 上（Sprite 天然始终面向相机）
// 仍然是纯代码生成，不引外部图片或字体文件
export function createSignboard(emoji, text) {
  const FS = 34, PAD = 14, TAIL = 14, R = 14, RATIO = 3; // RATIO 提分辨率，免得糊
  const font = `700 ${FS}px "PingFang SC","Microsoft YaHei","Segoe UI Emoji",sans-serif`;
  const label = `${emoji} ${text}`;

  // 先量一次文字宽度，气泡按文字长短自适应
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = font;
  const w = Math.ceil(probe.measureText(label).width) + PAD * 2;
  const h = FS + PAD * 2;

  const canvas = document.createElement('canvas');
  canvas.width = w * RATIO;
  canvas.height = (h + TAIL) * RATIO;
  const ctx = canvas.getContext('2d');
  ctx.scale(RATIO, RATIO);

  // 圆角气泡 + 底部小三角，配色跟界面上的奶油木牌一致
  ctx.beginPath();
  ctx.moveTo(R, 0);
  ctx.lineTo(w - R, 0);          ctx.quadraticCurveTo(w, 0, w, R);
  ctx.lineTo(w, h - R);          ctx.quadraticCurveTo(w, h, w - R, h);
  ctx.lineTo(w / 2 + 11, h);     ctx.lineTo(w / 2, h + TAIL); ctx.lineTo(w / 2 - 11, h);
  ctx.lineTo(R, h);              ctx.quadraticCurveTo(0, h, 0, h - R);
  ctx.lineTo(0, R);              ctx.quadraticCurveTo(0, 0, R, 0);
  ctx.closePath();
  ctx.fillStyle = '#fff8ecf2';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#e0b071';
  ctx.stroke();

  ctx.font = font;
  ctx.fillStyle = '#8a5a2b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, w / 2, h / 2 + 1);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true,
    depthTest: false,  // 不被建筑/农田挡住，始终看得见才点得到
  }));
  sprite.renderOrder = 999;
  const H = 1.0; // 统一高度，宽度按文字比例撑开。配合主循环的距离补偿，
                 // 这个值在默认视角下字够大又不至于盖住建筑
  sprite.scale.set(H * (w / (h + TAIL)), H, 1);
  sprite.userData.sign = true;
  // 记下基准尺寸，主循环按镜头远近做补偿：
  // 不补的话拉近了糊一脸、拉远了小得看不清字
  sprite.userData.signW = sprite.scale.x;
  sprite.userData.signH = H;
  return sprite;
}

// 打过药的作物头上飘一个小药瓶，方便一眼认出哪株是赌过的
export function createSprayMark() {
  const g = new THREE.Group();
  const glass = mat(0x8ae06a, { transparent: true, opacity: 0.9, emissive: 0x3a8a2a, emissiveIntensity: 0.35 });
  g.add(mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.17, 6), glass, 0, 0.085, 0));   // 瓶身
  g.add(mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.06, 6), mat(0x6a6a76), 0, 0.2, 0)); // 瓶口
  g.add(mesh(new THREE.BoxGeometry(0.11, 0.05, 0.05), mat(0x6a6a76), 0.06, 0.22, 0));    // 喷嘴
  g.position.y = 0.82;
  g.userData.sprayMark = true;
  return g;
}

/* ================= 水族馆：玻璃馆 + 岛下展厅 + 水产模型 ================= */

// 岛上的水族馆（点它进馆）
export function createAquarium() {
  const g = new THREE.Group();
  const wall = mat(0xdfeef5);
  const glassM = mat(0x9fd8e8, { transparent: true, opacity: 0.42, roughness: 0.1 });
  const trim = mat(0x3a7a9a);

  g.add(mesh(new THREE.BoxGeometry(4.0, 0.3, 3.2), mat(0xc8d8e0), 0, 0.15, 0));      // 底座
  g.add(mesh(new THREE.BoxGeometry(3.6, 2.0, 2.8), wall, 0, 1.3, 0));                // 主体
  // 正面整面观景玻璃 + 边框
  g.add(mesh(new THREE.BoxGeometry(2.6, 1.4, 0.1), glassM, 0, 1.35, 1.42));
  g.add(mesh(new THREE.BoxGeometry(2.8, 0.12, 0.14), trim, 0, 2.1, 1.43));
  g.add(mesh(new THREE.BoxGeometry(2.8, 0.12, 0.14), trim, 0, 0.6, 1.43));
  // 圆弧顶（半圆柱）+ 脊线
  const roof = mesh(new THREE.CylinderGeometry(1.5, 1.5, 3.6, 14, 1, false, 0, Math.PI), wall, 0, 2.3, 0);
  roof.rotation.z = Math.PI / 2;
  g.add(roof);
  g.add(mesh(new THREE.BoxGeometry(3.7, 0.1, 0.1), trim, 0, 2.32, 0));
  // 屋顶会转的小鱼招牌
  const fish = createSeafoodMesh('carp', 1.5);
  fish.position.set(0, 3.1, 0);
  fish.userData.spin = true;
  g.add(fish);
  // 门口两侧的水柱缸
  [-1.5, 1.5].forEach(x => {
    g.add(mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.3, 10), glassM, x, 0.95, 1.1));
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 10), trim, x, 1.65, 1.1));
  });
  g.add(mesh(new THREE.BoxGeometry(0.9, 1.2, 0.1), mat(0x2a6a8a), 0, 0.9, 1.45)); // 门

  g.traverse(o => { if (o.isMesh) o.userData.aquarium = true; });
  return g;
}

// 展厅里 15 个展位：三排五列，整体排在大缸前面
// （原先中间排正中是 (0,0)，正好和中央大缸同位，那一缸会被埋进柱子里）
export const AQUARIUM_SPOTS = Array.from({ length: 15 }, (_, k) => {
  const row = Math.floor(k / 5), col = k % 5;
  return { x: (col - 2) * 2.6, z: -2.2 + row * 3.3 };
});

// 馆内（藏在岛下）：深色水厅 + 中央大缸 + 蓝色氛围光
export function createAquariumInterior() {
  const g = new THREE.Group();
  const W = 18, D = 16;
  const wallM = mat(0x1e3a4a);
  const glassM = mat(0x6ac0e0, { transparent: true, opacity: 0.3, roughness: 0.1 });

  g.add(mesh(new THREE.BoxGeometry(W, 0.3, D), mat(0x16303e), 0, -0.15, 0));   // 地面
  g.add(mesh(new THREE.BoxGeometry(W, 6, 0.3), wallM, 0, 3, -D / 2 + 0.15));   // 后墙
  [-1, 1].forEach(s => g.add(mesh(new THREE.BoxGeometry(0.3, 6, D), wallM, s * (W / 2 - 0.15), 3, 0)));
  // 后墙一整面观景窗，透出蓝光
  g.add(mesh(new THREE.BoxGeometry(W - 3, 3.4, 0.12),
    mat(0x3aa8d0, { emissive: 0x2a88b0, emissiveIntensity: 0.5, transparent: true, opacity: 0.55 }),
    0, 3.2, -D / 2 + 0.3));
  // 柱形大缸：摆在后墙前当背景，别占住展位
  const CZ = -6;
  g.add(mesh(new THREE.CylinderGeometry(1.5, 1.5, 3.2, 16), glassM, 0, 1.6, CZ));
  g.add(mesh(new THREE.CylinderGeometry(1.65, 1.65, 0.25, 16), mat(0x2a5a70), 0, 0.12, CZ));
  g.add(mesh(new THREE.CylinderGeometry(1.65, 1.65, 0.2, 16), mat(0x2a5a70), 0, 3.25, CZ));
  // 缸里的水草
  [[-0.6, 0.4], [0.5, -0.5], [0.1, 0.7]].forEach(([x, z]) => {
    const w = mesh(new THREE.ConeGeometry(0.14, 1.2, 5), mat(0x3a9a5a), x, 0.75, CZ + z);
    g.add(w);
  });
  // 蓝色氛围光
  [[-5, -4], [5, -4], [-5, 4], [5, 4], [0, 0]].forEach(([x, z]) => {
    const l = new THREE.PointLight(0x8ad8f0, 0.5, 20, 1.8);
    l.position.set(x, 4.5, z);
    g.add(l);
  });
  return g;
}

// 展位：一个小玻璃缸，有货就把水产摆进去
export function createAquariumTank(seafoodId) {
  const g = new THREE.Group();
  const glassM = mat(0x7ac8e0, { transparent: true, opacity: 0.34, roughness: 0.1 });
  g.add(mesh(new THREE.BoxGeometry(1.5, 0.2, 1.2), mat(0x2a5a70), 0, 0.1, 0));      // 底座
  g.add(mesh(new THREE.BoxGeometry(1.3, 1.1, 1.0), glassM, 0, 0.75, 0));            // 缸体
  g.add(mesh(new THREE.BoxGeometry(1.4, 0.1, 1.1), mat(0x2a5a70), 0, 1.32, 0));     // 缸沿
  g.add(mesh(new THREE.BoxGeometry(1.2, 0.12, 0.9), mat(0xc8b088), 0, 0.28, 0));    // 缸底沙
  if (seafoodId) {
    const m = createSeafoodMesh(seafoodId, 1.25);
    m.position.y = 0.8;
    m.userData.tankSwim = true; // 在缸里慢慢游
    g.add(m);
  }
  return g;
}

// 水产模型：鱼 / 虾 / 蟹三种形态，颜色按品种走
const seafoodShapes = {
  fish(m1, m2, sf) {
    const g = new THREE.Group();
    const body = mesh(new THREE.SphereGeometry(0.17, 7, 6), m1);
    body.scale.set(1.5, 0.9, 0.7);
    g.add(body);
    const tail = mesh(new THREE.ConeGeometry(0.12, 0.2, 4), m2, -0.28, 0, 0);
    tail.rotation.z = Math.PI / 2;
    g.add(tail);
    g.add(mesh(new THREE.ConeGeometry(0.07, 0.14, 4), m2, 0.02, 0.15, 0));           // 背鳍
    [-0.06, 0.06].forEach(z =>
      g.add(mesh(new THREE.SphereGeometry(0.035, 5, 4), mat(0x1a1a22), 0.19, 0.05, z))); // 眼睛
    return g;
  },
  shrimp(m1, m2, sf) {
    const g = new THREE.Group();
    for (let k = 0; k < 4; k++) {                                                    // 分节的身子，越往后越小
      const seg = mesh(new THREE.SphereGeometry(0.13 - k * 0.02, 6, 5), k % 2 ? m2 : m1,
        -k * 0.11, k * 0.015, 0);
      seg.scale.set(1, 0.85, 0.8);
      g.add(seg);
    }
    const tail = mesh(new THREE.ConeGeometry(0.1, 0.16, 4), m2, -0.42, 0.03, 0);
    tail.rotation.z = -Math.PI / 2;
    g.add(tail);
    [-0.05, 0.05].forEach(z => {                                                     // 两根长须
      const a = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 4), m2, 0.24, 0.04, z);
      a.rotation.z = 1.2; g.add(a);
    });
    [-0.05, 0.05].forEach(z =>
      g.add(mesh(new THREE.SphereGeometry(0.03, 5, 4), mat(0x1a1a22), 0.14, 0.08, z)));
    return g;
  },
  // 贝类：两片扇形壳合在一起，壳面带放射棱
  shell(m1, m2, sf) {
    const g = new THREE.Group();
    [-1, 1].forEach(s => {
      const half = mesh(new THREE.SphereGeometry(0.19, 8, 6, 0, Math.PI), m1, 0, 0.02, s * 0.035);
      half.scale.set(1, 0.55, 0.9);
      half.rotation.x = s * 0.28;
      half.rotation.y = s > 0 ? 0 : Math.PI;
      g.add(half);
    });
    for (let k = 0; k < 5; k++) {                         // 壳面棱线
      const a = -0.5 + (k / 4) * 1.0;
      const rib = mesh(new THREE.BoxGeometry(0.015, 0.02, 0.17), m2,
        Math.sin(a) * 0.11, 0.09, Math.cos(a) * 0.02);
      rib.rotation.y = a;
      g.add(rib);
    }
    g.add(mesh(new THREE.SphereGeometry(0.05, 6, 5), m2, 0, -0.03, -0.14)); // 壳顶
    return g;
  },
  // 头足类：锥形身子 + 一圈触手，鱿鱼章鱼共用
  squid(m1, m2, sf) {
    const g = new THREE.Group();
    const body = mesh(new THREE.ConeGeometry(0.15, 0.34, 8), m1, 0, 0.1, 0);
    body.rotation.x = Math.PI; // 尖头朝上
    g.add(body);
    g.add(mesh(new THREE.SphereGeometry(0.14, 8, 6), m1, 0, 0.02, 0));       // 头部
    for (let k = 0; k < 6; k++) {                                            // 六条触手
      const a = (k / 6) * Math.PI * 2;
      const arm = mesh(new THREE.CylinderGeometry(0.022, 0.012, 0.26, 5), m2,
        Math.cos(a) * 0.08, -0.14, Math.sin(a) * 0.08);
      arm.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45);
      g.add(arm);
    }
    [-0.07, 0.07].forEach(x =>
      g.add(mesh(new THREE.SphereGeometry(0.035, 5, 4), mat(0x1a1a22), x, 0.05, 0.11)));
    return g;
  },
  crab(m1, m2, sf) {
    const g = new THREE.Group();
    const shell = mesh(new THREE.SphereGeometry(0.2, 8, 6), m1, 0, 0.06, 0);
    shell.scale.set(1.25, 0.6, 1);
    g.add(shell);
    [-1, 1].forEach(s => {                                                           // 两只大钳
      const arm = mesh(new THREE.SphereGeometry(0.08, 6, 5), m2, s * 0.28, 0.02, 0.14);
      arm.scale.set(1.3, 0.8, 0.9);
      g.add(arm);
      for (let k = 0; k < 3; k++) {                                                   // 每边三条腿
        const leg = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 4), m2,
          s * 0.2, -0.02, -0.04 - k * 0.09);
        leg.rotation.z = s * 0.9;
        g.add(leg);
      }
    });
    [-0.07, 0.07].forEach(x =>
      g.add(mesh(new THREE.SphereGeometry(0.035, 5, 4), mat(0x1a1a22), x, 0.16, 0.13)));
    return g;
  },
};

export function createSeafoodMesh(id, scale = 1) {
  const sf = SEAFOOD.find(s => s.id === id) ?? SEAFOOD[0];
  const opt = sf.glow ? { emissive: sf.c1, emissiveIntensity: sf.glow, roughness: 0.35 } : {};
  const g = seafoodShapes[sf.kind](mat(sf.c1, opt), mat(sf.c2), sf);
  g.scale.setScalar(scale);
  return g;
}

/* ================= 黑市：农田正后方的地下交易点 ================= */

// 岛上的黑市（点它开交易面板）：压低的暗色棚屋，一盏晃动的吊灯
export function createBlackMarket() {
  const g = new THREE.Group();
  const dark = mat(0x2e2a32);
  const wood = mat(0x4a3f38);
  const cloth = mat(0x5a2a3a);

  // 地面台阶与主体（矮胖，透着不正经）
  g.add(mesh(new THREE.BoxGeometry(4.2, 0.26, 3.2), mat(0x3a3038), 0, 0.13, 0));
  g.add(mesh(new THREE.BoxGeometry(3.6, 1.7, 2.6), dark, 0, 1.1, 0));
  // 歪一点的顶棚
  const roof = mesh(new THREE.BoxGeometry(4.4, 0.16, 3.4), wood, 0, 2.0, 0);
  roof.rotation.z = 0.045;
  g.add(roof);
  // 支棚的四根柱子
  [[-1.9, 1.4], [1.9, 1.4], [-1.9, -1.4], [1.9, -1.4]].forEach(([x, z]) =>
    g.add(mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.0, 6), wood, x, 1.0, z)));
  // 正面挂的暗红布帘（半掩着）
  [-0.9, 0.9].forEach(x => {
    const c = mesh(new THREE.BoxGeometry(1.1, 1.5, 0.06), cloth, x, 1.15, 1.32);
    c.rotation.z = x > 0 ? -0.05 : 0.05;
    g.add(c);
  });
  // 柜台 + 上面堆的货箱
  g.add(mesh(new THREE.BoxGeometry(2.6, 0.5, 0.5), wood, 0, 0.5, 1.55));
  [[-0.7, 0.28], [0.5, 0.24]].forEach(([x, s]) =>
    g.add(mesh(new THREE.BoxGeometry(s * 2, s * 1.6, s * 1.6), mat(0x6a5a48), x, 0.9, 1.55)));
  // 会晃的吊灯：昏黄一盏，夜里更明显
  const lampGroup = new THREE.Group();
  lampGroup.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4), dark, 0, 0.25, 0));
  const bulb = mesh(new THREE.SphereGeometry(0.14, 7, 6),
    mat(0xffd98a, { emissive: 0xd89a2a, emissiveIntensity: 0.85 }), 0, -0.05, 0);
  bulb.userData.lampBulb = true;
  lampGroup.add(bulb);
  const light = new THREE.PointLight(0xffc46a, 0.6, 6, 2);
  light.position.set(0, -0.1, 0);
  lampGroup.add(light);
  lampGroup.position.set(0, 1.95, 1.2);
  lampGroup.userData.blackLamp = true; // 主循环里让它轻轻摆
  g.add(lampGroup);
  // 屋顶插的骷髅小旗，表明这里不太正经
  g.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 4), dark, -1.5, 2.5, 0));
  const flag = mesh(new THREE.BoxGeometry(0.7, 0.4, 0.04), mat(0x1e1a22), -1.15, 2.78, 0);
  g.add(flag);
  g.add(mesh(new THREE.SphereGeometry(0.09, 6, 5), mat(0xe8e0d0), -1.15, 2.8, 0.03));

  g.traverse(o => { if (o.isMesh) o.userData.blackMarket = true; });
  return g;
}

/* ================= 天气观测台：黑市旁边的圆顶天文台 ================= */

export function createObservatory() {
  const g = new THREE.Group();
  const wall = mat(0xdde3ec);
  const trim = mat(0x5a6a80);
  const domeM = mat(0xa8b8cc, { roughness: 0.5, metalness: 0.2 });

  // 圆形基座 + 塔身
  g.add(mesh(new THREE.CylinderGeometry(1.7, 1.9, 0.3, 14), mat(0xc4ccd8), 0, 0.15, 0));
  g.add(mesh(new THREE.CylinderGeometry(1.35, 1.45, 2.2, 14), wall, 0, 1.4, 0));
  g.add(mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.14, 14), trim, 0, 2.55, 0));
  // 半球顶
  const dome = mesh(new THREE.SphereGeometry(1.45, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), domeM, 0, 2.6, 0);
  g.add(dome);
  // 顶上开的观测缝
  g.add(mesh(new THREE.BoxGeometry(0.42, 1.5, 0.06), mat(0x2a3444), 0, 3.15, 1.05));
  // 斜伸出来的望远镜（会缓慢转，扫视天空）
  const scope = new THREE.Group();
  const tube = mesh(new THREE.CylinderGeometry(0.17, 0.22, 1.5, 10), mat(0x44506a), 0, 0, 0);
  tube.rotation.x = Math.PI / 2.6;
  scope.add(tube);
  scope.add(mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 10), trim, 0, 0.52, 0.66));
  scope.position.set(0, 3.0, 0.3);
  scope.userData.scopeSpin = true;
  g.add(scope);
  // 塔身几扇亮着的小窗
  [0, 2.1, 4.2].forEach(a =>
    g.add(mesh(new THREE.BoxGeometry(0.3, 0.42, 0.08),
      mat(0xffe6a8, { emissive: 0xd8a83a, emissiveIntensity: 0.5 }),
      Math.sin(a) * 1.4, 1.5, Math.cos(a) * 1.4)));
  // 门
  g.add(mesh(new THREE.BoxGeometry(0.8, 1.2, 0.1), mat(0x4a5568), 0, 0.9, 1.42));
  // 门口的风向标：一根杆 + 会转的箭头
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 5), trim, 1.75, 1.0, 0.9));
  const vane = new THREE.Group();
  vane.add(mesh(new THREE.ConeGeometry(0.11, 0.34, 4), mat(0xe0a040), 0.22, 0, 0).rotateZ(-Math.PI / 2));
  vane.add(mesh(new THREE.BoxGeometry(0.26, 0.2, 0.03), mat(0xe0a040), -0.2, 0, 0));
  vane.position.set(1.75, 1.85, 0.9);
  vane.userData.spin = true;
  g.add(vane);

  g.traverse(o => { if (o.isMesh) o.userData.observatory = true; });
  return g;
}

/* ================= 仓库：农田左后方的木质谷仓 ================= */

export function createWarehouse() {
  const g = new THREE.Group();
  const wood = mat(0xa8703f);
  const darkWood = mat(0x6e4526);
  const roofM = mat(0xc0543f);
  const stone = mat(0xcfc4b0);

  // 石基座 + 木质主体
  g.add(mesh(new THREE.BoxGeometry(4.4, 0.3, 3.4), stone, 0, 0.15, 0));
  g.add(mesh(new THREE.BoxGeometry(3.9, 2.1, 2.9), wood, 0, 1.35, 0));
  // 墙面横向木板纹
  for (let k = 0; k < 4; k++) {
    g.add(mesh(new THREE.BoxGeometry(3.95, 0.08, 0.06), darkWood, 0, 0.65 + k * 0.48, 1.47));
  }
  // 双坡屋顶：两片斜板拼起来
  [-1, 1].forEach(s => {
    const slope = mesh(new THREE.BoxGeometry(2.35, 0.16, 3.3), roofM, s * 1.03, 2.87, 0);
    slope.rotation.z = s * 0.62;
    g.add(slope);
  });
  g.add(mesh(new THREE.BoxGeometry(0.22, 0.22, 3.4), darkWood, 0, 3.42, 0)); // 屋脊
  // 正面的大双开谷仓门 + 交叉木条
  [-0.52, 0.52].forEach(x => {
    g.add(mesh(new THREE.BoxGeometry(0.98, 1.6, 0.1), darkWood, x, 0.95, 1.48));
    [-0.5, 0.5].forEach(a => {
      const bar = mesh(new THREE.BoxGeometry(1.15, 0.11, 0.05), wood, x, 0.95, 1.54);
      bar.rotation.z = a;
      g.add(bar);
    });
  });
  // 阁楼小窗 + 吊货杆
  g.add(mesh(new THREE.BoxGeometry(0.6, 0.55, 0.1), mat(0x3a2a1e), 0, 2.5, 1.47));
  g.add(mesh(new THREE.BoxGeometry(0.12, 0.12, 0.9), darkWood, 0, 2.85, 1.85));
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 5), mat(0x8a8a92), 0, 2.55, 2.24));
  // 门口堆的板条箱和麻袋，一眼看出是存东西的地方
  [[-2.3, 0.45, 1.1], [-2.55, 0.32, 0.35]].forEach(([x, s, z]) =>
    g.add(mesh(new THREE.BoxGeometry(s * 1.5, s * 1.4, s * 1.5), mat(0xc2a071), x, s * 0.7, z)));
  [[2.3, 1.0], [2.55, 0.3]].forEach(([x, z]) => {
    const sack = mesh(new THREE.SphereGeometry(0.32, 7, 6), mat(0xd8c9a0), x, 0.3, z);
    sack.scale.set(1, 1.15, 1);
    g.add(sack);
  });

  g.traverse(o => { if (o.isMesh) o.userData.warehouse = true; });
  return g;
}

/* ================= 酒庄：石屋 + 岛下酒窖（3 个酿造台 + 9 格酒架） ================= */

// 岛上的酒庄（点它进酒窖）
export function createBrewery() {
  const g = new THREE.Group();
  const stone = mat(0xd8cdb8);
  const darkStone = mat(0x9a8f7a);
  const wood = mat(0x7a4a2a);
  const roofM = mat(0x6a4a72);

  g.add(mesh(new THREE.BoxGeometry(4.0, 0.3, 3.2), darkStone, 0, 0.15, 0));   // 基座
  g.add(mesh(new THREE.BoxGeometry(3.5, 2.0, 2.7), stone, 0, 1.3, 0));        // 主体
  // 墙上的石纹
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    g.add(mesh(new THREE.BoxGeometry(0.75, 0.5, 0.06), r % 2 ? darkStone : mat(0xcfc3ac),
      (c - 1.5) * 0.82 + (r % 2 ? 0.2 : 0), 0.65 + r * 0.56, 1.38));
  }
  // 双坡屋顶（紫调，跟葡萄酒呼应）
  [-1, 1].forEach(s => {
    const slope = mesh(new THREE.BoxGeometry(2.15, 0.16, 3.1), roofM, s * 0.93, 2.72, 0);
    slope.rotation.z = s * 0.6;
    g.add(slope);
  });
  g.add(mesh(new THREE.BoxGeometry(0.2, 0.2, 3.2), mat(0x4a3050), 0, 3.22, 0)); // 屋脊
  // 拱门
  g.add(mesh(new THREE.BoxGeometry(0.95, 1.3, 0.12), wood, 0, 0.8, 1.4));
  g.add(mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.12, 12, 1, false, 0, Math.PI), wood, 0, 1.45, 1.4)
    .rotateZ(0).rotateX(Math.PI / 2));
  // 门口滚着的两个橡木桶
  [[-1.55, 0.9], [1.6, 0.7]].forEach(([x, z]) => {
    const barrel = mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.62, 12), wood, x, 0.36, z);
    barrel.rotation.z = Math.PI / 2;
    g.add(barrel);
    [-0.18, 0.18].forEach(o =>
      g.add(mesh(new THREE.TorusGeometry(0.37, 0.035, 5, 12), mat(0x5a5a62), x + o, 0.36, z)
        .rotateY(Math.PI / 2)));
  });
  // 屋顶挂的葡萄串招牌
  const grapes = new THREE.Group();
  [[0, 0], [-0.13, -0.14], [0.13, -0.14], [0, -0.28]].forEach(([x, y]) =>
    grapes.add(mesh(new THREE.SphereGeometry(0.1, 7, 6), mat(0x8a4ac2), x, y, 0)));
  grapes.position.set(0, 3.65, 0);
  grapes.userData.spin = true;
  g.add(grapes);

  g.traverse(o => { if (o.isMesh) o.userData.brewery = true; });
  return g;
}

// 酿造台的三个站位 / 酒架九格的站位（酒窖局部坐标）
export const BREW_SPOTS = [{ x: -3.2, z: -2 }, { x: 0, z: -2 }, { x: 3.2, z: -2 }];
export const CELLAR_SPOTS = Array.from({ length: 9 }, (_, k) => ({
  x: (k % 3 - 1) * 2.4, z: 2.2 + Math.floor(k / 3) * 1.9,
}));

// 岛下的酒窖：昏黄石室
export function createBreweryInterior() {
  const g = new THREE.Group();
  const W = 16, D = 14;
  const wallM = mat(0x4a3a30);
  g.add(mesh(new THREE.BoxGeometry(W, 0.3, D), mat(0x3a2e26), 0, -0.15, 0));
  g.add(mesh(new THREE.BoxGeometry(W, 5.5, 0.3), wallM, 0, 2.75, -D / 2 + 0.15));
  [-1, 1].forEach(s => g.add(mesh(new THREE.BoxGeometry(0.3, 5.5, D), wallM, s * (W / 2 - 0.15), 2.75, 0)));
  // 后墙几个拱形壁龛
  [-4.5, 0, 4.5].forEach(x =>
    g.add(mesh(new THREE.BoxGeometry(2, 2.2, 0.14),
      mat(0x2e241e, { emissive: 0x1a1410, emissiveIntensity: 0.3 }), x, 2.2, -D / 2 + 0.3)));
  // 昏黄壁灯
  [[-5, -3], [5, -3], [-5, 3], [5, 3]].forEach(([x, z]) => {
    const l = new THREE.PointLight(0xffc47a, 0.55, 18, 2);
    l.position.set(x, 3.6, z);
    g.add(l);
    g.add(mesh(new THREE.SphereGeometry(0.14, 7, 6),
      mat(0xffd9a0, { emissive: 0xd89a3a, emissiveIntensity: 0.8 }), x, 3.6, z));
  });
  return g;
}

// 一个酿造台：石座 + 大橡木桶，酿造中桶盖冒泡
export function createBrewVat(busy) {
  const g = new THREE.Group();
  const wood = mat(busy ? 0x8a5230 : 0x6e4526);
  g.add(mesh(new THREE.BoxGeometry(1.9, 0.24, 1.9), mat(0x5a4a3e), 0, 0.12, 0));
  const barrel = mesh(new THREE.CylinderGeometry(0.72, 0.62, 1.5, 14), wood, 0, 0.99, 0);
  g.add(barrel);
  [0.45, 0.99, 1.53].forEach(y =>
    g.add(mesh(new THREE.TorusGeometry(0.73, 0.05, 5, 14), mat(0x4a4a52), 0, y, 0).rotateX(Math.PI / 2)));
  g.add(mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.1, 14), mat(0x54381f), 0, 1.76, 0)); // 桶盖
  if (busy) { // 酿造中：桶口冒出的气泡
    const bubbles = new THREE.Group();
    [[0, 0], [0.2, 0.15], [-0.18, 0.1]].forEach(([x, z], i) => {
      const b = mesh(new THREE.SphereGeometry(0.09 - i * 0.015, 6, 5),
        mat(0xc86ad0, { transparent: true, opacity: 0.65, emissive: 0x8a3a9a, emissiveIntensity: 0.4 }),
        x, 0.1 + i * 0.14, z);
      bubbles.add(b);
    });
    bubbles.position.y = 1.85;
    bubbles.userData.brewBubble = true;
    g.add(bubbles);
  }
  return g;
}

// 酒架上的一瓶酒
export function createWineBottle(tint = 0x7a2a4a) {
  const g = new THREE.Group();
  const glass = mat(tint, { roughness: 0.25, transparent: true, opacity: 0.85 });
  g.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.42, 10), glass, 0, 0.21, 0));   // 瓶身
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.11, 0.16, 8), glass, 0, 0.49, 0));    // 肩
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 8), glass, 0, 0.66, 0));    // 瓶颈
  g.add(mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.07, 8), mat(0x8a5a2b), 0, 0.79, 0)); // 软木塞
  g.add(mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.16, 10), mat(0xf0e6d2), 0, 0.22, 0)); // 标签
  return g;
}

// 酒架：一个斜放的木格，空着就只有格子
export function createCellarRack(hasWine, tint) {
  const g = new THREE.Group();
  const wood = mat(0x6e4526);
  g.add(mesh(new THREE.BoxGeometry(1.5, 0.16, 1.2), wood, 0, 0.08, 0));
  [-0.68, 0.68].forEach(x => g.add(mesh(new THREE.BoxGeometry(0.14, 1.0, 1.2), wood, x, 0.58, 0)));
  g.add(mesh(new THREE.BoxGeometry(1.5, 0.14, 1.2), wood, 0, 1.13, 0));
  if (hasWine) {
    const bottle = createWineBottle(tint);
    bottle.position.set(0, 0.2, 0);
    g.add(bottle);
  }
  return g;
}

/* ================= 食品店：临街店面 + 岛下后堂（5 格货架） ================= */

// 岛上的店面（点它进后堂）
export function createFoodShop() {
  const g = new THREE.Group();
  const wall = mat(0xf2e3c8);
  const trim = mat(0xc75f4a);
  const wood = mat(0x8a5a34);
  const glass = mat(0x9fd8e8, { transparent: true, opacity: 0.55, roughness: 0.15 });

  g.add(mesh(new THREE.BoxGeometry(4.4, 0.3, 3.0), mat(0x9a8f7a), 0, 0.15, 0));  // 基座
  g.add(mesh(new THREE.BoxGeometry(3.9, 2.2, 2.5), wall, 0, 1.4, 0));            // 主体
  // 整面的临街橱窗
  g.add(mesh(new THREE.BoxGeometry(3.0, 1.15, 0.08), glass, 0, 1.45, 1.27));
  g.add(mesh(new THREE.BoxGeometry(3.2, 0.12, 0.16), wood, 0, 0.83, 1.27));      // 窗台
  [-1.5, 1.5].forEach(x => g.add(mesh(new THREE.BoxGeometry(0.16, 1.3, 0.16), wood, x, 1.45, 1.27)));
  // 平顶 + 红白条纹雨棚
  g.add(mesh(new THREE.BoxGeometry(4.2, 0.22, 2.8), trim, 0, 2.6, 0));
  for (let i = 0; i < 7; i++) {
    const awning = mesh(new THREE.BoxGeometry(0.48, 0.1, 1.0), i % 2 ? mat(0xfaf3e6) : trim,
      (i - 3) * 0.5, 2.32, 1.72);
    awning.rotation.x = -0.42;
    g.add(awning);
  }
  // 门
  g.add(mesh(new THREE.BoxGeometry(0.85, 1.5, 0.1), wood, 1.35, 0.9, 1.27));
  g.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(0xe0b048), 1.05, 0.95, 1.34));
  // 门口两筐果子，一眼看出是卖吃的
  [[-1.5, 1.5], [-0.75, 1.62]].forEach(([x, z], k) => {
    g.add(mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.34, 10), wood, x, 0.32, z));
    const tint = k ? 0xe0653a : 0xd8434a;
    [[0, 0], [0.13, 0.1], [-0.12, 0.09], [0.02, -0.13]].forEach(([dx, dz]) =>
      g.add(mesh(new THREE.SphereGeometry(0.11, 7, 6), mat(tint), x + dx, 0.53, z + dz)));
  });
  // 屋顶转动的礼盒招牌
  const sign = new THREE.Group();
  sign.add(mesh(new THREE.BoxGeometry(0.46, 0.34, 0.34), mat(0xe8b23a)));
  sign.add(mesh(new THREE.BoxGeometry(0.5, 0.07, 0.07), trim, 0, 0.06, 0));
  sign.add(mesh(new THREE.BoxGeometry(0.07, 0.36, 0.07), trim, 0, 0.06, 0));
  sign.position.set(0, 3.15, 0);
  sign.userData.spin = true;
  g.add(sign);

  g.traverse(o => { if (o.isMesh) o.userData.foodshop = true; });
  return g;
}

// 5 格货架的站位（后堂局部坐标），一字排开像真的店面陈列
export const SHELF_SPOTS = Array.from({ length: 5 }, (_, k) => ({ x: (k - 2) * 2.7, z: 0.6 }));

// 岛下的后堂：暖光木质小店
export function createFoodShopInterior() {
  const g = new THREE.Group();
  const W = 17, D = 12;
  const wallM = mat(0xe6d3b0);
  g.add(mesh(new THREE.BoxGeometry(W, 0.3, D), mat(0xb98a5a), 0, -0.15, 0));       // 木地板
  g.add(mesh(new THREE.BoxGeometry(W, 5, 0.3), wallM, 0, 2.5, -D / 2 + 0.15));
  [-1, 1].forEach(s => g.add(mesh(new THREE.BoxGeometry(0.3, 5, D), wallM, s * (W / 2 - 0.15), 2.5, 0)));
  // 后墙的木质陈列格，纯装饰，衬出「店」的感觉
  for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) {
    g.add(mesh(new THREE.BoxGeometry(2.0, 0.1, 0.5), mat(0x8a5a34),
      (c - 2.5) * 2.3, 1.5 + r * 1.3, -D / 2 + 0.5));
  }
  // 柜台
  g.add(mesh(new THREE.BoxGeometry(5.2, 1.0, 1.1), mat(0x8a5a34), -4.4, 0.5, 4.0));
  g.add(mesh(new THREE.BoxGeometry(5.4, 0.12, 1.3), mat(0xc79a62), -4.4, 1.06, 4.0));
  // 暖光
  [[-5, 0], [0, 0], [5, 0]].forEach(([x, z]) => {
    const l = new THREE.PointLight(0xffd9a0, 0.5, 20, 2);
    l.position.set(x, 3.8, z);
    g.add(l);
    g.add(mesh(new THREE.SphereGeometry(0.16, 8, 6),
      mat(0xfff0d0, { emissive: 0xe0b048, emissiveIntensity: 0.9 }), x, 3.8, z));
  });
  return g;
}

// 一个货架格：空着只有木架，上架了摆一个礼盒
export function createShelfSlot(hasBox, tint = 0xe8b23a) {
  const g = new THREE.Group();
  const wood = mat(0x8a5a34);
  g.add(mesh(new THREE.BoxGeometry(2.1, 0.16, 1.5), wood, 0, 0.08, 0));            // 底板
  [-0.95, 0.95].forEach(x => g.add(mesh(new THREE.BoxGeometry(0.14, 1.2, 1.5), wood, x, 0.68, 0)));
  g.add(mesh(new THREE.BoxGeometry(2.1, 0.14, 1.5), wood, 0, 1.35, 0));            // 顶板
  if (hasBox) {
    const box = new THREE.Group();
    box.add(mesh(new THREE.BoxGeometry(1.15, 0.7, 0.85), mat(tint)));              // 盒身
    box.add(mesh(new THREE.BoxGeometry(1.22, 0.12, 0.92), mat(0xd8434a), 0, 0.4, 0)); // 盒盖
    box.add(mesh(new THREE.BoxGeometry(0.13, 0.72, 0.87), mat(0xd8434a)));         // 竖丝带
    box.add(mesh(new THREE.BoxGeometry(1.17, 0.72, 0.13), mat(0xd8434a)));         // 横丝带
    // 蝴蝶结
    [-1, 1].forEach(s => box.add(mesh(new THREE.SphereGeometry(0.13, 7, 6), mat(0xd8434a), s * 0.15, 0.5, 0)));
    box.position.set(0, 0.51, 0);
    box.userData.giftBox = true;   // main.js 让它轻轻上下浮动
    g.add(box);
  }
  return g;
}

/* ================= 繁荣塔 =================
 * 按 towerPlan() 给的施工图现搭。6 种层高 × 6 档装修，
 * 每层 4 个部位（主体/窗/栏杆/檐灯）各自独立吃档位。
 *
 * 硬规矩：整座塔一盏 PointLight 都不许加。
 * 岛上 98 盏装饰光源已经能把帧率压到 7 FPS，22 层再塞光源直接玩不了。
 * 「亮」全部靠 emissive 材质，那是零成本的。
 */
export function createTower(plan) {
  const g = new THREE.Group();
  // 六档装修每档只做两个材质（主体/描边），全塔复用，避免 110 个网格 = 110 份材质
  const F = TOWER_FINISHES.map(f => ({
    body: mat(f.body, f.glow ? { emissive: f.body, emissiveIntensity: f.glow } : {}),
    trim: mat(f.trim, f.glow ? { emissive: f.trim, emissiveIntensity: f.glow * 0.6 } : {}),
    glow: f.glow,
  }));
  const glass = (tier) => mat(0xffe0a0, {
    emissive: 0xf0c060, emissiveIntensity: 0.3 + tier * 0.12,
  });

  // 台基：任何等级都有，塔本身可以是 0 层
  g.add(mesh(new THREE.CylinderGeometry(2.9, 3.2, 0.5, 12), mat(0x8a8478), 0, 0.25, 0));
  g.add(mesh(new THREE.CylinderGeometry(3.0, 3.0, 0.08, 12), mat(0xa8a294), 0, 0.52, 0));

  // 0 层 = 一个小土堆，这就是 1 级的样子
  if (!plan.floors.length) {
    const mound = mesh(new THREE.SphereGeometry(1.5, 10, 7), mat(0x8a6a4a), 0, 0.5, 0);
    mound.scale.set(1, 0.45, 1);
    g.add(mound);
    [[0.7, 0.5], [-0.6, -0.7], [0.2, -0.9]].forEach(([x, z]) =>
      g.add(mesh(new THREE.SphereGeometry(0.14, 6, 5), mat(0x6a8a4a), x, 0.82, z)));
    g.traverse(o => { if (o.isMesh) o.userData.tower = true; });
    return g;
  }

  let y = 0.56;
  const eaves = [];   // 每层屋檐：挂件就挂在这儿
  plan.floors.forEach((f, i) => {
    const w = 4.2 - i * 0.115;                 // 越往上越窄，塔身自然收分
    const [tBody, tWin, tRail, tLamp] = f.tiers;

    // 主体
    g.add(mesh(new THREE.BoxGeometry(w, f.h, w), F[tBody].body, 0, y + f.h / 2, 0));
    // 四面窗：层高够才开两排，矮层只开一排
    const rows = f.h >= 1.3 ? [0.32, 0.68] : [0.5];
    rows.forEach(fr => {
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dz]) => {
        const win = mesh(new THREE.BoxGeometry(dz ? w * 0.42 : 0.06, f.h * 0.26, dz ? 0.06 : w * 0.42),
          glass(tWin), dx * (w / 2 + 0.01), y + f.h * fr, dz * (w / 2 + 0.01));
        g.add(win);
      });
    });
    // 楼板/栏杆：比楼身宽一圈，形成一道道出檐
    g.add(mesh(new THREE.BoxGeometry(w + 0.42, 0.13, w + 0.42), F[tRail].trim, 0, y + f.h, 0));
    if (tRail >= 2) { // 3 档以上才长出真正的栏杆立柱
      const r = (w + 0.36) / 2;
      [[r, r], [-r, r], [r, -r], [-r, -r]].forEach(([x, z]) =>
        g.add(mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), F[tRail].trim, x, y + f.h + 0.21, z)));
    }
    // 檐灯：挂在楼板四角，纯 emissive，不是光源
    if (tLamp >= 1) {
      const r = (w + 0.3) / 2;
      const bulb = mat(0xffd98a, { emissive: 0xf0b840, emissiveIntensity: 0.4 + tLamp * 0.16 });
      [[r, r], [-r, -r]].forEach(([x, z]) =>
        g.add(mesh(new THREE.SphereGeometry(0.1 + tLamp * 0.012, 6, 5), bulb, x, y + f.h - 0.18, z)));
    }
    eaves.push({ y: y + f.h, r: (w + 0.36) / 2 });
    y += f.h;
  });

  // 小挂件：368 件，比换料步数（132）多得多。每一件都是「凭空多出一样东西」，
  // 再小也一眼看得见——换料一层只换 5 次，靠它撑不满 500 级。
  //
  // 排布：前 16 件绕台基一圈（那时候可能才 1 层，没地方挂），
  // 之后每层 16 件 = 4 个角 × 4 种。同层先挂满 4 个灯笼，再 4 面旗，依此类推。
  //
  // 必须用 InstancedMesh：一件挂件 2~3 个零件，368 件就是 800 多个网格，
  // 实测直接把帧率从 40 砍到 20。同种挂件共享几何体和材质，
  // 合起来只有十来次绘制调用，帧率零损失。
  const CORNERS = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  const lampBody = new THREE.SphereGeometry(0.15, 8, 6); lampBody.scale(1, 0.82, 1);
  const ORN_DEFS = [
    { parts: [ // 🏮 红灯笼
      { g: new THREE.CylinderGeometry(0.012, 0.012, 0.16, 4), m: mat(0x5a4a3a), dy: -0.09 },
      { g: lampBody, m: mat(0xd94a3a, { emissive: 0xc03020, emissiveIntensity: 0.5 }), dy: -0.3 },
      { g: new THREE.CylinderGeometry(0.05, 0.05, 0.04, 6), m: mat(0xe0b64a), dy: -0.17 },
    ] },
    { parts: [ // 🚩 旗幡
      { g: new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4), m: mat(0x6a5a4a), dy: 0.25 },
      { g: new THREE.BoxGeometry(0.26, 0.2, 0.02), m: mat(0xd9534f), dy: 0.38, dx: 0.14 },
    ] },
    { parts: [ // 🔔 檐铃
      { g: new THREE.ConeGeometry(0.09, 0.13, 7), m: mat(0xc9a05a), dy: -0.16 },
      { g: new THREE.SphereGeometry(0.035, 6, 5), m: mat(0x8a6a3a), dy: -0.25 },
    ] },
    { parts: [ // 🪴 盆栽
      { g: new THREE.CylinderGeometry(0.1, 0.08, 0.12, 8), m: mat(0xb5654a), dy: 0.13 },
      { g: new THREE.SphereGeometry(0.12, 7, 6), m: mat(0x5c9b52), dy: 0.26 },
    ] },
  ];
  const BASE_ORN = 16;
  const spots = [[], [], [], []];   // 按种类分堆，好一次性实例化
  for (let k = 0; k < (plan.ornaments || 0); k++) {
    if (k < BASE_ORN) {                      // 台基一圈
      const a = k * Math.PI * 2 / BASE_ORN;
      spots[k % 4].push([Math.cos(a) * 3.0, 0.72, Math.sin(a) * 3.0]);
      continue;
    }
    const j = k - BASE_ORN;
    const fi = Math.floor(j / 16);
    if (fi >= eaves.length) break;           // 楼层还没盖到，先不挂
    const e = eaves[fi];
    const idx = j % 16;
    const c = CORNERS[idx % 4];
    spots[Math.floor(idx / 4)].push([e.r * c[0], e.y, e.r * c[1]]);
  }
  const mtx = new THREE.Matrix4();
  ORN_DEFS.forEach((def, kind) => {
    const list = spots[kind];
    if (!list.length) { def.parts.forEach(p => p.g.dispose()); return; }
    def.parts.forEach(p => {
      const im = new THREE.InstancedMesh(p.g, p.m, list.length);
      im.castShadow = true; im.receiveShadow = true;
      list.forEach(([x, y, z], i) => {
        mtx.makeTranslation(x + (p.dx || 0), y + p.dy, z);
        im.setMatrixAt(i, mtx);
      });
      im.instanceMatrix.needsUpdate = true;
      g.add(im);
    });
  });

  // 尖顶：用全塔最高的那一档，封顶时是水晶星穹
  const top = Math.max(...plan.floors.flatMap(f => f.tiers));
  const topW = 4.2 - (plan.floors.length - 1) * 0.115;
  const spire = mesh(new THREE.ConeGeometry(topW * 0.72, 1.4, 8), F[top].body, 0, y + 0.7, 0);
  g.add(spire);
  g.add(mesh(new THREE.SphereGeometry(0.2, 8, 6),
    mat(0xffe9a8, { emissive: 0xf0c860, emissiveIntensity: 0.4 + top * 0.14 }), 0, y + 1.5, 0));
  // 满档才有的星穹光环，跟着 spin 转
  if (top >= TOWER_FINISHES.length - 1) {
    const halo = mesh(new THREE.TorusGeometry(1.1, 0.06, 6, 20),
      mat(0x8ae0e0, { emissive: 0x6ac8e0, emissiveIntensity: 0.7 }), 0, y + 1.5, 0);
    halo.rotation.x = Math.PI / 2;
    halo.userData.spin = true;
    g.add(halo);
  }

  g.traverse(o => { if (o.isMesh) o.userData.tower = true; });
  return g;
}

/* ================= 港湾与商船 =================
 * 岛最南端的大水域。水面半径 14——抓鱼水潭才 4.3，这个是它三倍多。
 * 商船单独一个组，靠港日才显示，平时整组 visible=false，
 * 不用反复建了拆（拆建会触发着色器重编译，那是帧率杀手）。
 */
export function createHarbor() {
  const g = new THREE.Group();
  const R = 14, SR = 15.6;
  // 沙岸 + 水面
  g.add(mesh(new THREE.CylinderGeometry(SR, SR + 0.6, 0.26, 28), mat(0xd9c9a8), 0, 0.05, 0));
  const water = mesh(new THREE.CylinderGeometry(R, R, 0.2, 28),
    mat(0x35719e, { roughness: 0.2, emissive: 0x123a5c, emissiveIntensity: 0.18 }), 0, 0.17, 0);
  water.userData.pondWater = true;   // 沿用水面的波动动画
  g.add(water);
  // 深水区：中间再压一层更深的蓝，大水面才不至于像块蓝板子
  g.add(mesh(new THREE.CylinderGeometry(R * 0.62, R * 0.62, 0.03, 24),
    mat(0x255a86, { roughness: 0.2, emissive: 0x0d2c48, emissiveIntensity: 0.2 }), 0, 0.28, 0));

  // 木栈桥：从岛这一侧（+z）伸进水里
  const plank = mat(0x9a6a42);
  for (let i = 0; i < 9; i++) {
    g.add(mesh(new THREE.BoxGeometry(2.6, 0.16, 1.05), plank, 0, 0.42, R - 0.4 - i * 1.15));
  }
  [-1.1, 1.1].forEach(x => {
    for (let i = 0; i < 5; i++) {
      g.add(mesh(new THREE.BoxGeometry(0.18, 0.7, 0.18), mat(0x7a5232), x, 0.1, R - 0.7 - i * 2.2));
    }
  });
  // 桥头两根系缆桩
  [-1.5, 1.5].forEach(x => {
    g.add(mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.85, 8), mat(0x6a4a2e), x, 0.75, R - 4.9));
    g.add(mesh(new THREE.SphereGeometry(0.19, 8, 6), mat(0x8a6540), x, 1.2, R - 4.9));
  });
  // 岸边原本硬摆了四块礁石，去掉了：港湾装饰里第一件就是「礁石」，
  // 玩家想要礁石自己买着摆就行，写死四块反而占掉了摆放位、也没法挪
  g.traverse(o => { if (o.isMesh) o.userData.harbor = true; });
  return g;
}

// 商船：靠在栈桥尽头。整艘船是一个组，靠港日才 visible
export function createMerchantShip() {
  const g = new THREE.Group();
  const hull = mat(0x7a4a2e), deck = mat(0xb98a5a), trim = mat(0xe0b64a);
  // 船身：下宽上窄的梯形块 + 尖船头
  g.add(mesh(new THREE.BoxGeometry(3.1, 1.25, 8.4), hull, 0, 0.72, 0));
  g.add(mesh(new THREE.BoxGeometry(3.4, 0.22, 8.6), trim, 0, 1.34, 0));
  const bow = mesh(new THREE.ConeGeometry(1.55, 2.6, 4), hull, 0, 0.72, 5.2);
  bow.rotation.set(-Math.PI / 2, 0, Math.PI / 4);
  g.add(bow);
  // 甲板与船楼
  g.add(mesh(new THREE.BoxGeometry(2.9, 0.14, 8.2), deck, 0, 1.42, 0));
  g.add(mesh(new THREE.BoxGeometry(2.2, 1.15, 2.4), mat(0xc9a06a), 0, 2.05, -2.5));
  g.add(mesh(new THREE.BoxGeometry(2.45, 0.16, 2.65), mat(0x8a3a4a), 0, 2.68, -2.5));
  [-0.6, 0.6].forEach(x => g.add(mesh(new THREE.BoxGeometry(0.42, 0.42, 0.06),
    mat(0xffe0a0, { emissive: 0xf0c060, emissiveIntensity: 0.45 }), x, 2.15, -1.28)));
  // 主桅与帆
  g.add(mesh(new THREE.CylinderGeometry(0.13, 0.15, 6.2, 8), mat(0x8a6540), 0, 4.5, 1.2));
  const sail = mesh(new THREE.BoxGeometry(0.1, 3.4, 4.2), mat(0xf2ece0), 0.06, 4.9, 1.2);
  sail.userData.bob = true;
  g.add(sail);
  g.add(mesh(new THREE.BoxGeometry(0.08, 0.9, 1.1), mat(0xd9534f), 0.1, 7.2, 1.2)); // 旗
  // 甲板货箱：一眼看出是来做买卖的
  [[-0.85, 3.1, 0xa87048], [0.85, 3.1, 0x8a6540], [-0.85, 1.4, 0x9a7a4a], [0.9, -0.4, 0xa87048]]
    .forEach(([x, z, c]) => {
      g.add(mesh(new THREE.BoxGeometry(0.85, 0.7, 0.85), mat(c), x, 1.84, z));
      g.add(mesh(new THREE.BoxGeometry(0.9, 0.08, 0.9), trim, x, 2.2, z));
    });
  g.userData.bob = true;   // 整艘船跟着水面轻轻起伏
  g.traverse(o => { if (o.isMesh) o.userData.harbor = true; });
  return g;
}


/* ================= 港湾装饰 =================
 * 23 种模型，全程序化。海里的东西跟小水塘不是一套：
 * 这边是礁石、巨藻、鲸鱼、沉船、锚，不是荷花青蛙锦鲤。
 */
const harborKinds = {
  rock: (c) => {
    const g = new THREE.Group();
    g.add(mesh(new THREE.DodecahedronGeometry(0.62), mat(c), 0, 0.1, 0));
    const a = mesh(new THREE.DodecahedronGeometry(0.34), mat(c), 0.55, -0.05, 0.3);
    a.scale.y = 0.7; g.add(a);
    g.add(mesh(new THREE.DodecahedronGeometry(0.22), mat(c), -0.5, -0.1, -0.35));
    return g;
  },
  kelp: (c) => {
    const g = new THREE.Group();
    [[0, 0, 1.9], [0.32, 0.2, 1.5], [-0.28, -0.22, 1.6], [0.15, -0.35, 1.2]].forEach(([x, z, h], i) => {
      const blade = mesh(new THREE.BoxGeometry(0.16, h, 0.05), mat(c), x, h / 2 - 0.1, z);
      blade.rotation.z = (i % 2 ? 1 : -1) * 0.14;
      g.add(blade);
    });
    return g;
  },
  shells: (c) => {
    const g = new THREE.Group();
    [[0, 0, 0.26], [0.3, 0.22, 0.2], [-0.26, 0.18, 0.17], [0.1, -0.3, 0.15]].forEach(([x, z, r]) => {
      const sh = mesh(new THREE.SphereGeometry(r, 7, 5, 0, Math.PI * 2, 0, Math.PI / 2), mat(c), x, 0, z);
      sh.rotation.x = 0.3; g.add(sh);
    });
    return g;
  },
  star: (c) => {
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const arm = mesh(new THREE.BoxGeometry(0.16, 0.09, 0.52), mat(c), 0, 0, 0);
      arm.rotation.y = i * Math.PI * 2 / 5;
      arm.position.set(Math.sin(i * Math.PI * 2 / 5) * 0.24, 0, Math.cos(i * Math.PI * 2 / 5) * 0.24);
      g.add(arm);
    }
    g.add(mesh(new THREE.SphereGeometry(0.19, 7, 5), mat(c), 0, 0.02, 0));
    return g;
  },
  buoy: (c, d) => {
    const g = new THREE.Group();
    g.add(mesh(new THREE.ConeGeometry(0.34, 0.5, 8), mat(c), 0, -0.1, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.5, 8), mat(c), 0, 0.3, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.55, 6), mat(0x8a8a92), 0, 0.8, 0));
    g.add(mesh(new THREE.SphereGeometry(0.15, 8, 6),
      mat(0xffe0a0, d.glow ? { emissive: 0xf0c060, emissiveIntensity: 0.8 } : {}), 0, 1.12, 0));
    return g;
  },
  piling: (c) => {
    const g = new THREE.Group();
    [[0, 0, 1.5], [0.42, 0.3, 1.15], [-0.38, 0.25, 1.3]].forEach(([x, z, h]) => {
      g.add(mesh(new THREE.CylinderGeometry(0.15, 0.17, h, 7), mat(c), x, h / 2 - 0.3, z));
      g.add(mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 7), mat(0x5a3a22), x, h - 0.32, z));
    });
    return g;
  },
  float: (c) => {
    const g = new THREE.Group();
    [[0, 0, 0.3], [0.42, 0.26, 0.24], [-0.36, 0.3, 0.2]].forEach(([x, z, r]) =>
      g.add(mesh(new THREE.SphereGeometry(r, 8, 6), mat(c), x, 0, z)));
    return g;
  },
  sandbar: (c) => {
    const g = new THREE.Group();
    const s = mesh(new THREE.SphereGeometry(1.7, 12, 7), mat(c), 0, -0.2, 0);
    s.scale.set(1, 0.22, 0.72); g.add(s);
    g.add(mesh(new THREE.DodecahedronGeometry(0.2), mat(0x9a9288), 0.9, 0.05, 0.25));
    return g;
  },
  coral: (c) => {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.6, 6), mat(c), 0, 0.1, 0));
    [[0.32, 0.5, 0.7], [-0.3, 0.55, -0.55], [0.05, 0.75, 0.35]].forEach(([x, y, rz]) => {
      const br = mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.62, 6), mat(c), x, y, 0);
      br.rotation.z = rz; g.add(br);
    });
    g.add(mesh(new THREE.SphereGeometry(0.13, 7, 5), mat(c), 0.5, 0.82, 0));
    return g;
  },
  turtle: (c) => {
    const g = new THREE.Group();
    const sh = mesh(new THREE.SphereGeometry(0.55, 10, 7), mat(c), 0, 0, 0);
    sh.scale.set(1, 0.42, 1.25); g.add(sh);
    g.add(mesh(new THREE.SphereGeometry(0.22, 8, 6), mat(0x7aa870), 0, 0.02, 0.72));
    [[0.48, 0.4], [-0.48, 0.4], [0.44, -0.42], [-0.44, -0.42]].forEach(([x, z]) => {
      const f = mesh(new THREE.BoxGeometry(0.34, 0.07, 0.2), mat(0x7aa870), x, -0.05, z);
      f.rotation.y = x > 0 ? -0.4 : 0.4; g.add(f);
    });
    return g;
  },
  anchor: (c) => {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.5, 6), mat(c), 0, 0.25, 0));
    g.add(mesh(new THREE.TorusGeometry(0.18, 0.05, 5, 10), mat(c), 0, 1.05, 0));
    g.add(mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), mat(c), 0, 0.62, 0));
    const arc = mesh(new THREE.TorusGeometry(0.5, 0.08, 5, 12, Math.PI), mat(c), 0, -0.45, 0);
    arc.rotation.z = Math.PI; g.add(arc);
    return g;
  },
  raft: (c) => {
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) g.add(mesh(new THREE.BoxGeometry(0.24, 0.13, 1.6), mat(c), -0.5 + i * 0.26, 0, 0));
    g.add(mesh(new THREE.BoxGeometry(1.5, 0.07, 0.12), mat(0x6a4a2e), 0, 0.09, 0.5));
    g.add(mesh(new THREE.BoxGeometry(1.5, 0.07, 0.12), mat(0x6a4a2e), 0, 0.09, -0.5));
    return g;
  },
  gull: (c) => {
    const g = new THREE.Group();
    const b = mesh(new THREE.SphereGeometry(0.2, 8, 6), mat(c), 0, 0, 0);
    b.scale.set(1, 0.8, 1.5); g.add(b);
    [-1, 1].forEach(s => {
      const w = mesh(new THREE.BoxGeometry(0.62, 0.05, 0.22), mat(c), s * 0.38, 0.06, 0);
      w.rotation.z = s * 0.28; g.add(w);
    });
    g.add(mesh(new THREE.ConeGeometry(0.06, 0.18, 5), mat(0xe0a020), 0, 0, 0.34));
    return g;
  },
  mast: (c) => {
    const g = new THREE.Group();
    const m = mesh(new THREE.CylinderGeometry(0.12, 0.17, 2.6, 7), mat(c), 0, 0.6, 0);
    m.rotation.z = 0.22; g.add(m);
    const y = mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.5, 6), mat(c), -0.2, 1.3, 0);
    y.rotation.set(0, 0, Math.PI / 2 + 0.2); g.add(y);
    g.add(mesh(new THREE.BoxGeometry(0.05, 0.7, 0.55), mat(0xbdb2a0, { transparent: true, opacity: 0.7 }), -0.35, 0.9, 0));
    return g;
  },
  jelly: (c, d) => {
    const g = new THREE.Group();
    const opt = d.glow ? { emissive: c, emissiveIntensity: 0.6, transparent: true, opacity: 0.85 }
      : { transparent: true, opacity: 0.7 };
    const bell = mesh(new THREE.SphereGeometry(0.42, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), mat(c, opt), 0, 0.2, 0);
    bell.scale.y = 1.15; g.add(bell);
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI * 2 / 6;
      g.add(mesh(new THREE.CylinderGeometry(0.03, 0.015, 0.7, 4), mat(c, opt),
        Math.cos(a) * 0.26, -0.18, Math.sin(a) * 0.26));
    }
    return g;
  },
  dolphin: (c) => {
    const g = new THREE.Group();
    const b = mesh(new THREE.SphereGeometry(0.6, 10, 7), mat(c), 0, 0, 0);
    b.scale.set(1, 0.85, 2.1); g.add(b);
    g.add(mesh(new THREE.ConeGeometry(0.22, 0.7, 7), mat(c), 0, 0, 1.5));
    const fin = mesh(new THREE.ConeGeometry(0.2, 0.5, 4), mat(c), 0, 0.55, -0.1);
    fin.rotation.x = -0.3; g.add(fin);
    const tail = mesh(new THREE.BoxGeometry(0.9, 0.07, 0.35), mat(c), 0, 0, -1.5);
    tail.rotation.z = 0.15; g.add(tail);
    g.add(mesh(new THREE.SphereGeometry(0.55, 8, 6), mat(0xd8e4ee), 0, -0.16, 0.2));
    return g;
  },
  whale: (c) => {
    const g = new THREE.Group();
    const b = mesh(new THREE.SphereGeometry(1.15, 12, 8), mat(c), 0, 0, 0);
    b.scale.set(1, 0.82, 2.4); g.add(b);
    const belly = mesh(new THREE.SphereGeometry(1.0, 10, 7), mat(0xe4ecf2), 0, -0.42, 0.15);
    belly.scale.set(0.9, 0.42, 2.1); g.add(belly);
    const tail = mesh(new THREE.BoxGeometry(2.1, 0.13, 0.7), mat(c), 0, 0.1, -2.75);
    tail.rotation.z = 0.12; g.add(tail);
    [-1, 1].forEach(s => {
      const f = mesh(new THREE.BoxGeometry(0.9, 0.1, 0.4), mat(c), s * 1.0, -0.2, 0.6);
      f.rotation.z = s * 0.35; g.add(f);
    });
    g.add(mesh(new THREE.ConeGeometry(0.28, 0.6, 5), mat(c), 0, 0.85, -0.6));
    return g;
  },
  wreck: (c) => {
    const g = new THREE.Group();
    const hull = mesh(new THREE.BoxGeometry(1.5, 0.85, 4.2), mat(c), 0, 0, 0);
    hull.rotation.set(0.18, 0, 0.3); g.add(hull);
    g.add(mesh(new THREE.BoxGeometry(1.7, 0.1, 4.3), mat(0x7a5a42), 0, 0.42, 0));
    const m = mesh(new THREE.CylinderGeometry(0.1, 0.13, 2.2, 6), mat(0x6a4a2e), 0.2, 1.1, 0.5);
    m.rotation.z = 0.45; g.add(m);
    g.add(mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), mat(0x8a6540), -0.3, 0.6, -1.5));
    return g;
  },
  arch: (c) => {
    const g = new THREE.Group();
    const arc = mesh(new THREE.TorusGeometry(1.15, 0.24, 7, 14, Math.PI), mat(c), 0, 0, 0);
    g.add(arc);
    [-1, 1].forEach(s => g.add(mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.5, 7), mat(c), s * 1.15, -0.25, 0)));
    [[0.55, 0.95], [-0.6, 0.9]].forEach(([x, y]) =>
      g.add(mesh(new THREE.SphereGeometry(0.17, 7, 5), mat(0xf0a8b8), x, y, 0)));
    return g;
  },
  islet: (c) => {
    const g = new THREE.Group();
    const base = mesh(new THREE.CylinderGeometry(1.5, 1.85, 0.55, 10), mat(c), 0, 0.1, 0);
    g.add(base);
    g.add(mesh(new THREE.CylinderGeometry(1.35, 1.5, 0.14, 10), mat(0x6aae5e), 0, 0.42, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.42, 1.9, 8), mat(0xf2ece0), 0, 1.4, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.3, 8),
      mat(0xffe0a0, { emissive: 0xf0c060, emissiveIntensity: 0.9 }), 0, 2.5, 0));
    g.add(mesh(new THREE.ConeGeometry(0.42, 0.4, 8), mat(0xd9534f), 0, 2.85, 0));
    return g;
  },
  kraken: (c) => {
    const g = new THREE.Group();
    [[0, 0, 2.4, 0.3], [1.1, 0.6, 1.9, -0.4], [-0.9, -0.7, 2.1, 0.5]].forEach(([x, z, h, tilt]) => {
      const seg = 4;
      for (let i = 0; i < seg; i++) {
        const r = 0.3 - i * 0.06;
        const t = mesh(new THREE.CylinderGeometry(r, r + 0.05, h / seg, 7),
          mat(c), x + Math.sin(i * 0.9) * 0.22 * (tilt > 0 ? 1 : -1), i * (h / seg) - 0.3, z);
        t.rotation.z = tilt * (i / seg);
        g.add(t);
      }
      g.add(mesh(new THREE.SphereGeometry(0.16, 7, 5), mat(0xe0a0c0), x + 0.3, h - 0.3, z));
    });
    return g;
  },
  ruins: (c) => {
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(2.6, 0.24, 2.6), mat(c), 0, -0.2, 0));
    [[-0.95, -0.95, 1.5], [0.95, -0.95, 1.1], [-0.95, 0.95, 1.3], [0.95, 0.95, 0.7]].forEach(([x, z, h]) => {
      g.add(mesh(new THREE.CylinderGeometry(0.19, 0.22, h, 8), mat(c), x, h / 2 - 0.1, z));
      g.add(mesh(new THREE.BoxGeometry(0.5, 0.12, 0.5), mat(c), x, h - 0.05, z));
    });
    g.add(mesh(new THREE.BoxGeometry(2.4, 0.16, 0.5), mat(c), 0, 1.5, -0.95));
    g.add(mesh(new THREE.OctahedronGeometry(0.4),
      mat(0x6ae0d0, { emissive: 0x4ac0b0, emissiveIntensity: 0.9 }), 0, 0.75, 0));
    return g;
  },
  statue: (c) => {
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(1.3, 0.35, 1.3), mat(c), 0, -0.1, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.42, 0.55, 1.7, 8), mat(c), 0, 0.9, 0));
    g.add(mesh(new THREE.SphereGeometry(0.34, 9, 7), mat(c), 0, 1.95, 0));
    const tri = mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.1, 5), mat(0xc9a05a), 0.62, 1.5, 0);
    tri.rotation.z = -0.16; g.add(tri);
    [-0.18, 0, 0.18].forEach(dx =>
      g.add(mesh(new THREE.ConeGeometry(0.07, 0.3, 5), mat(0xc9a05a), 0.72 + dx * 0.1, 2.6, dx)));
    return g;
  },
};

export function createHarborDecor(def, slot) {
  const g = harborKinds[def.kind](def.color, def);
  if (def.scale) g.scale.setScalar(def.scale);
  const a = def.anim ?? { type: 'none' };
  // 动画参数塞进 userData，交给 main.js 每帧驱动。
  // phase 用槽位号错开，同种装饰摆好几件才不会像复制粘贴一样同步动
  g.userData.harborAnim = { ...a, phase: slot * 0.7, baseY: a.air ?? 0 };
  g.traverse(o => { if (o.isMesh) o.userData.harbor = true; });
  return g;
}


/* ================= 工人培养大楼 =================
 * 一栋方正的教学楼：灰蓝石基、三层窗、屋顶一个安全帽招牌。
 * 门口立五根小柱子，对应它管的五条生产线。
 */
export function createTrainer() {
  const g = new THREE.Group();
  const wall = mat(0xc9cdd4), band = mat(0x8f98a6), roof = mat(0x4a5566);

  g.add(mesh(new THREE.BoxGeometry(4.6, 0.3, 3.4), mat(0x9aa0a8), 0, 0.15, 0)); // 台基
  g.add(mesh(new THREE.BoxGeometry(4.2, 3.2, 3.0), wall, 0, 1.9, 0));           // 主楼
  // 三条楼层腰线，一眼看出是三层
  [1.1, 2.1, 3.1].forEach(y => g.add(mesh(new THREE.BoxGeometry(4.35, 0.12, 3.15), band, 0, y, 0)));
  // 平顶 + 女儿墙
  g.add(mesh(new THREE.BoxGeometry(4.5, 0.22, 3.3), roof, 0, 3.6, 0));
  [[0, 1.6], [0, -1.6]].forEach(([x, z]) =>
    g.add(mesh(new THREE.BoxGeometry(4.5, 0.28, 0.14), roof, x, 3.85, z)));

  // 每层四扇窗，透暖光
  [1.55, 2.55].forEach(y => {
    [-1.3, -0.44, 0.44, 1.3].forEach(x => {
      g.add(mesh(new THREE.BoxGeometry(0.55, 0.62, 0.07),
        mat(0xf0c878, { emissive: 0xc08830, emissiveIntensity: 0.32 }), x, y, 1.54));
    });
  });
  // 大门
  g.add(mesh(new THREE.BoxGeometry(1.0, 1.35, 0.1), mat(0x5a4636), 0, 0.98, 1.55));
  g.add(mesh(new THREE.BoxGeometry(1.35, 0.14, 0.5), roof, 0, 1.75, 1.72)); // 门檐

  // 门前五根小柱子 = 它管的五条线
  for (let i = 0; i < 5; i++) {
    const x = -1.6 + i * 0.8;
    g.add(mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.85, 7), band, x, 0.58, 2.15));
    g.add(mesh(new THREE.SphereGeometry(0.13, 7, 5), mat(0xe0b64a), x, 1.08, 2.15));
  }

  // 屋顶招牌：会转的安全帽
  const sign = new THREE.Group();
  const dome = mesh(new THREE.SphereGeometry(0.42, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(0xf0b820), 0, 0, 0);
  sign.add(dome);
  sign.add(mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.07, 14), mat(0xe0a418), 0, 0.02, 0));
  sign.add(mesh(new THREE.BoxGeometry(0.1, 0.34, 0.1), mat(0xe0a418), 0, 0.3, 0));
  sign.position.set(0, 4.3, 0);
  sign.userData.spin = true;
  g.add(sign);

  g.traverse(o => { if (o.isMesh) o.userData.trainer = true; });
  return g;
}

/* ================= 参观客小人 ================= */

// 来岛上参观小屋 / 宠物间 / 水族馆的游客。做得很小（约 0.75 高），
// 因为同屏会有好几个，而且岛已经很挤了——比建筑抢眼就喧宾夺主了。
const VISITOR_SHIRTS = [0xe86a5c, 0x5c9ae8, 0x6fbf73, 0xe8b84a, 0xa87fd4, 0xe87fb0, 0x4ec8c0, 0xd4763a];
const VISITOR_HAIR = [0x3a2a20, 0x6b4a2a, 0x1e1a18, 0x8a6a3a, 0xc0a070];
const VISITOR_SKIN = [0xf0c9a0, 0xe0b088, 0xc99366, 0xf5d9bc];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export function createVisitor() {
  const g = new THREE.Group();
  const shirt = mat(pick(VISITOR_SHIRTS));
  const skin = mat(pick(VISITOR_SKIN));
  const pants = mat(0x4a5a72);

  // 两条腿：走路时由 game 那边摆动，所以各自装进一个小 Group 好绕髋部转
  const legs = [];
  [-0.075, 0.075].forEach(x => {
    const hip = new THREE.Group();
    hip.position.set(x, 0.26, 0);
    hip.add(mesh(new THREE.BoxGeometry(0.1, 0.26, 0.1), pants, 0, -0.13, 0));
    g.add(hip);
    legs.push(hip);
  });
  // 身体 + 脑袋
  g.add(mesh(new THREE.BoxGeometry(0.24, 0.28, 0.16), shirt, 0, 0.4, 0));
  g.add(mesh(new THREE.SphereGeometry(0.115, 10, 8), skin, 0, 0.63, 0));
  // 头发：一顶扣在后脑的小壳
  const hair = mesh(new THREE.SphereGeometry(0.12, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(pick(VISITOR_HAIR)), 0, 0.635, 0);
  g.add(hair);
  // 两条胳膊，同样挂 Group 好摆动
  const arms = [];
  [-0.155, 0.155].forEach(x => {
    const sh = new THREE.Group();
    sh.position.set(x, 0.52, 0);
    sh.add(mesh(new THREE.BoxGeometry(0.07, 0.24, 0.07), skin, 0, -0.12, 0));
    g.add(sh);
    arms.push(sh);
  });
  // 十个里有一个背相机——游客感全靠这个小细节
  if (Math.random() < 0.35) {
    g.add(mesh(new THREE.BoxGeometry(0.12, 0.08, 0.06), mat(0x2a2a2a), 0, 0.45, 0.11));
    g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 8), mat(0x8ac6e0), 0, 0.45, 0.15).rotateX(Math.PI / 2));
  }
  g.userData.legs = legs;
  g.userData.arms = arms;
  g.userData.walkPhase = Math.random() * Math.PI * 2;
  return g;
}

/* ================= 料理 / 大菜的展品模型 ================= */

// 85 道菜（60 料理 + 25 大菜）在典藏馆里原本只有一块 emoji 立牌，跟旁边
// 有真模型的作物、花、酒摆在一起特别寒碜。逐道写 85 个模型不现实，
// 所以走和花（FLOWER_LOOK）、动物（ANIMAL_LOOK）一样的老路：
// 十六种「造型」+ 一张 emoji → {造型, 配色} 的表。
//
// 拿 emoji 当索引是因为它本来就概括了这道菜长什么样（面、肉、蛋糕、饮品…），
// 而且新菜只要沿用已有 emoji 就自动有模型，不用回来补表。
// 整个展厅一次要摆 60 座柜子，所以每个造型控制在 12 个节点以内。

// —— 通用器皿 ——
const dishPlate = (c) => mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.05, 12), mat(c), 0, 0.03, 0);
const dishBowl = (c) => {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.27, 0.16, 0.16, 12), mat(c), 0, 0.08, 0));
  return g;
};
const dishPot = (c) => {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.2, 12), mat(c), 0, 0.1, 0));
  [-0.28, 0.28].forEach(x => g.add(mesh(new THREE.BoxGeometry(0.07, 0.04, 0.1), mat(c), x, 0.16, 0)));
  return g;
};
// 液面：汤、饮料共用，比容器口小一圈才像装在里面
const dishLiquid = (c, r, y) => mesh(new THREE.CylinderGeometry(r, r, 0.03, 12),
  mat(c, { roughness: 0.25 }), 0, y, 0);
// 一堆碎块：炒菜、沙拉、果盘的通用填充
const dishHeap = (g, c1, c2, n, r, y, s) => {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + i * 0.7;
    const rr = r * (0.35 + (i % 3) * 0.28);
    g.add(mesh(new THREE.BoxGeometry(s, s * 0.7, s), mat(i % 2 ? c1 : c2),
      Math.cos(a) * rr, y + (i % 2) * s * 0.5, Math.sin(a) * rr));
  }
};

const dishKinds = {
  soup(c1, c2) {
    const g = dishPot(c2);
    g.add(dishLiquid(c1, 0.22, 0.21));
    dishHeap(g, c1, c2, 4, 0.13, 0.23, 0.07);
    return g;
  },
  roast(c1, c2) {
    const g = new THREE.Group();
    g.add(dishPlate(c2));
    g.add(mesh(new THREE.BoxGeometry(0.3, 0.16, 0.2), mat(c1), 0, 0.13, 0));
    const bone = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 8), mat(0xf2ead8), 0.2, 0.16, 0);
    bone.rotation.z = Math.PI / 2.6;
    g.add(bone);
    g.add(mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(0xf2ead8), 0.28, 0.2, 0));
    return g;
  },
  cake(c1, c2) {
    const g = new THREE.Group();
    g.add(dishPlate(0xf0e8dc));
    g.add(mesh(new THREE.CylinderGeometry(0.22, 0.23, 0.16, 14), mat(c1), 0, 0.13, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.235, 0.235, 0.04, 14), mat(c2), 0, 0.22, 0));
    g.add(mesh(new THREE.SphereGeometry(0.055, 8, 7), mat(c2), 0, 0.27, 0));
    return g;
  },
  platter(c1, c2) {
    const g = new THREE.Group();
    g.add(dishPlate(0xf0e8dc));
    dishHeap(g, c1, c2, 7, 0.2, 0.1, 0.09);
    return g;
  },
  salad(c1, c2) {
    const g = dishBowl(0xf0e8dc);
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05;
      const leaf = mesh(new THREE.BoxGeometry(0.11, 0.03, 0.08), mat(i % 2 ? c1 : c2),
        Math.cos(a) * 0.11, 0.17 + (i % 2) * 0.03, Math.sin(a) * 0.11);
      leaf.rotation.y = a;
      g.add(leaf);
    }
    return g;
  },
  drink(c1, c2) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.34, 12),
      mat(0xdfeef5, { transparent: true, opacity: 0.45 }), 0, 0.17, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.145, 0.12, 0.22, 12), mat(c1), 0, 0.13, 0));
    const straw = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), mat(c2), 0.07, 0.32, 0);
    straw.rotation.z = 0.22;
    g.add(straw);
    return g;
  },
  noodle(c1, c2) {
    const g = dishBowl(0xe8dcc4);
    g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 12), mat(c1), 0, 0.17, 0));
    for (let i = 0; i < 5; i++) {
      const a = i * 1.25;
      const coil = mesh(new THREE.TorusGeometry(0.07, 0.018, 5, 9), mat(c1),
        Math.cos(a) * 0.08, 0.2, Math.sin(a) * 0.08);
      coil.rotation.x = Math.PI / 2;
      g.add(coil);
    }
    g.add(mesh(new THREE.BoxGeometry(0.11, 0.04, 0.09), mat(c2), 0.06, 0.23, 0.02));
    return g;
  },
  rice(c1, c2) {
    const g = dishPot(0x5a4a42);
    g.add(mesh(new THREE.SphereGeometry(0.19, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(c1), 0, 0.2, 0));
    dishHeap(g, c2, c2, 3, 0.1, 0.26, 0.07);
    return g;
  },
  skewer(c1, c2) {
    const g = new THREE.Group();
    g.add(dishPlate(0xf0e8dc));
    const stick = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.46, 6), mat(0xdcc79a), 0, 0.22, 0);
    stick.rotation.z = 0.3;
    g.add(stick);
    [0, 1, 2].forEach(i => g.add(mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), mat(i % 2 ? c1 : c2),
      -0.035 * (i - 1) * 2, 0.13 + i * 0.11, 0)));
    return g;
  },
  whole(c1, c2) {
    const g = new THREE.Group();
    g.add(dishPlate(0xf0e8dc));
    const body = mesh(new THREE.SphereGeometry(0.2, 12, 9), mat(c1), 0, 0.19, 0);
    body.scale.set(1, 0.72, 1.35);
    g.add(body);
    g.add(mesh(new THREE.SphereGeometry(0.09, 9, 7), mat(c2), 0, 0.26, -0.22));
    [-0.11, 0.11].forEach(x => {
      const leg = mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.16, 7), mat(c2), x, 0.14, 0.22);
      leg.rotation.x = -0.5;
      g.add(leg);
    });
    return g;
  },
  stirfry(c1, c2) {
    const g = new THREE.Group();
    g.add(dishPlate(0xf0e8dc));
    dishHeap(g, c1, c2, 8, 0.19, 0.09, 0.085);
    return g;
  },
  pizza(c1, c2) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 14), mat(c1), 0, 0.03, 0));
    const rim = mesh(new THREE.TorusGeometry(0.29, 0.035, 6, 16), mat(c1), 0, 0.05, 0);
    rim.rotation.x = Math.PI / 2;
    g.add(rim);
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05;
      g.add(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 8), mat(c2),
        Math.cos(a) * 0.16, 0.07, Math.sin(a) * 0.16));
    }
    return g;
  },
  wrap(c1, c2) {
    const g = new THREE.Group();
    g.add(dishPlate(0xf0e8dc));
    [-0.09, 0.09].forEach((x, i) => {
      const roll = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 12), mat(c1), x, 0.16, 0);
      roll.rotation.z = Math.PI / 2 - 0.25 + i * 0.5;
      g.add(roll);
      const fill = mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.03, 10), mat(c2), x + (i ? 0.14 : -0.14), 0.19, 0);
      fill.rotation.z = Math.PI / 2;
      g.add(fill);
    });
    return g;
  },
  banquet(c1, c2) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.32, 0.3, 0.05, 14), mat(0xf2c94c), 0, 0.03, 0));
    [[0.24, 0.12, 0.1], [0.18, 0.1, 0.24], [0.11, 0.09, 0.36]].forEach(([r, h, y], i) => {
      g.add(mesh(new THREE.CylinderGeometry(r, r + 0.02, h, 12), mat(i % 2 ? c2 : c1), 0, y, 0));
    });
    g.add(mesh(new THREE.SphereGeometry(0.06, 9, 8),
      mat(0xf2c94c, { emissive: 0x8a6a1a, emissiveIntensity: 0.35 }), 0, 0.46, 0));
    return g;
  },
  crystal(c1, c2) {
    const g = new THREE.Group();
    g.add(dishPlate(0xe8e0d0));
    g.add(mesh(new THREE.OctahedronGeometry(0.19),
      mat(c1, { transparent: true, opacity: 0.75, emissive: c1, emissiveIntensity: 0.4, roughness: 0.15 }),
      0, 0.22, 0));
    [-0.16, 0.16].forEach(x => g.add(mesh(new THREE.OctahedronGeometry(0.08),
      mat(c2, { transparent: true, opacity: 0.7, emissive: c2, emissiveIntensity: 0.3 }), x, 0.1, 0.05)));
    return g;
  },
  jelly(c1, c2) {
    const g = new THREE.Group();
    g.add(dishPlate(0xe8e0d0));
    g.add(mesh(new THREE.BoxGeometry(0.26, 0.2, 0.26),
      mat(c1, { transparent: true, opacity: 0.72, roughness: 0.2 }), 0, 0.14, 0));
    g.add(mesh(new THREE.SphereGeometry(0.05, 8, 7), mat(c2), 0, 0.27, 0));
    return g;
  },
};

// emoji → [造型, 主色, 辅色]。55 种 emoji 覆盖全部 85 道菜。
// 有新菜时优先沿用这里已有的 emoji，就自动有模型；真要用新 emoji 就来这儿补一行。
const DISH_LOOK = {
  '\u{1F372}': ['soup', 0xc98b4a, 0xb5622e], '\u{1F963}': ['soup', 0xd9603f, 0xe8dcc4],
  '\u{1F375}': ['soup', 0x7fb069, 0xe8f0d8], '\u{1F958}': ['soup', 0xb5622e, 0x8a5a3a],
  '\u{1F383}': ['soup', 0xe08a2a, 0xc06a20],
  '\u{1F356}': ['roast', 0x9a4a2a, 0xd9a860], '\u{1F357}': ['roast', 0xc0703a, 0xe8c890],
  '\u{1F969}': ['roast', 0xa83c3c, 0xe8b0a0], '\u{1F525}': ['roast', 0x8a3a22, 0xffa040],
  '\u{1F336}\u{FE0F}': ['roast', 0xc0392b, 0xe86a3a], '\u{1F33F}': ['roast', 0x8a5a3a, 0x6fa04a],
  '\u{1F370}': ['cake', 0xf5e0d0, 0xe86a8a], '\u{1F382}': ['cake', 0xf5e8d8, 0xe86a5c],
  '\u{1F31F}': ['cake', 0xf5e8b0, 0xf2c94c], '\u{1F352}': ['cake', 0xf0dcc0, 0xc0392b],
  '\u{1F967}': ['cake', 0xd9a05a, 0xf0d8a8],
  '\u{1F308}': ['platter', 0xe86a5c, 0x5c9ae8], '\u{1F349}': ['platter', 0xe8556a, 0x6fbf73],
  '\u{1F347}': ['platter', 0x8a5ac0, 0x6fa04a], '\u{2B50}': ['platter', 0xf2c94c, 0xf5e0a0],
  '\u{1F387}': ['platter', 0xe86ac0, 0xf2c94c], '\u{1F371}': ['platter', 0xc0703a, 0xe8d6b0],
  '\u{1F957}': ['salad', 0x7fbf5a, 0xe8556a], '\u{1F951}': ['salad', 0x6a8a3a, 0xd8e0a0],
  '\u{1F964}': ['drink', 0xe8899a, 0xf5d8e0], '\u{1F351}': ['drink', 0xf2a07a, 0xe86a8a],
  '\u{1F35C}': ['noodle', 0xf0dca8, 0xc06a3a], '\u{1F35A}': ['rice', 0xf5f0e0, 0xc0703a],
  '\u{1F362}': ['skewer', 0xc0703a, 0x8ac06a], '\u{1F962}': ['skewer', 0x8a5a3a, 0x6fa04a],
  '\u{1F986}': ['whole', 0xb5622e, 0xe0a060],
  '\u{1F954}': ['stirfry', 0xe0c078, 0xf0dca8], '\u{1F360}': ['stirfry', 0xc06a4a, 0xf0a870],
  '\u{1F36F}': ['stirfry', 0xe0a030, 0xf5cf70], '\u{1F955}': ['stirfry', 0xe08030, 0x6fa04a],
  '\u{1F35F}': ['stirfry', 0xf2c94c, 0xe0a030], '\u{1F96C}': ['stirfry', 0x9fc46a, 0xe8f0d0],
  '\u{1F373}': ['stirfry', 0xf2c94c, 0xe8503a], '\u{1F33D}': ['stirfry', 0xf2d44c, 0xe8c070],
  '\u{1FAD1}': ['stirfry', 0x4a9a4a, 0x8ac06a], '\u{1F966}': ['stirfry', 0x4a8a3a, 0x8ac06a],
  '\u{1F346}': ['stirfry', 0x7a4a8a, 0xa87ac0], '\u{1F34D}': ['stirfry', 0xe0b040, 0xd0a030],
  '\u{1F353}': ['jelly', 0xe8465c, 0xf5a0b0], '\u{1F9CA}': ['jelly', 0x9fd8ea, 0xe0f4fa],
  '\u{1F36E}': ['jelly', 0xe8b84a, 0xf5dca0],
  '\u{1F52E}': ['crystal', 0x9ad4e8, 0xd8f0f8], '\u{1F4A0}': ['crystal', 0x7fc0e0, 0xcfeaf5],
  '\u{1F355}': ['pizza', 0xe0b070, 0xe8503a],
  '\u{1F32F}': ['wrap', 0xe8d0a0, 0x9fc46a], '\u{1F35E}': ['wrap', 0xd9a860, 0x6a8a3a],
  '\u{1F451}': ['banquet', 0xf2c94c, 0xc0392b], '\u{2728}': ['banquet', 0xf2c94c, 0xf5e8c0],
  '\u{1F38A}': ['banquet', 0xe8556a, 0xf2c94c], '\u{1F984}': ['banquet', 0xe8a0e0, 0xf2c94c],
};

// 按 emoji 建一道菜的模型。表里没有的 emoji 返回 null，
// 调用方会自动退回原来的 emoji 立牌，不会整座柜子消失
export function createDishMesh(emoji, scale = 1) {
  const look = DISH_LOOK[emoji];
  if (!look) return null;
  const build = dishKinds[look[0]];
  if (!build) return null;
  const g = build(look[1], look[2]);
  g.scale.setScalar(scale);
  return g;
}

/* ================= 典藏展柜的铭牌 ================= */

// 273 格从 emoji 立牌换成真模型之后丢了最关键的东西：名字。
// 老玩家认得出「那个金色三层塔是满汉全席」，新玩家只看见一个不知道是啥的小模型。
// 所以每座柜子前面挂一块铭牌，写清楚这一格是什么、值多少钱。
//
// 空格也照样写（整块压暗），这才是图鉴该有的样子——玩家得能看出「还差哪些、
// 值不值得专门去做一趟」，而不是收录了才告诉他这格原来是什么。
export function createCaseLabel(name, price, filled) {
  const W = 256, H = 148;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = filled ? '#fffaf0' : '#6e675c';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = filled ? '#c9a97e' : '#4f4a42';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, W - 8, H - 8);
  ctx.textAlign = 'center';

  // 名字：中文名长短差很多（「面」到「传说彩虹盛宴」），按实际宽度缩字号，别溢出
  ctx.fillStyle = filled ? '#5a3a1c' : '#cfc9bd';
  const MAXW = W - 28;
  let fs = 40;
  do {
    ctx.font = 'bold ' + fs + 'px "Microsoft YaHei", sans-serif';
    fs -= 2;
  } while (fs > 18 && ctx.measureText(name).width > MAXW);
  // 缩到最小字号还塞不下就截断。中文最长的「传说彩虹盛宴」正好卡在上限，
  // 但英俄译名会长得多（Legendary Rainbow Feast…），没有这一步就会糊出画框
  let txt = name;
  if (ctx.measureText(txt).width > MAXW) {
    while (txt.length > 1 && ctx.measureText(txt + '…').width > MAXW) txt = txt.slice(0, -1);
    txt += '…';
  }
  ctx.fillText(txt, W / 2, 62);

  // 身价：数字 + 💰，语言无关，不用翻译
  ctx.fillStyle = filled ? '#c8871f' : '#9a948a';
  const money = Number(price ?? 0).toLocaleString() + '\u{1F4B0}';
  fs = 32;
  do {
    ctx.font = 'bold ' + fs + 'px "Microsoft YaHei", sans-serif';
    fs -= 2;
  } while (fs > 14 && ctx.measureText(money).width > W - 28);
  ctx.fillText(money, W / 2, 112);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.36),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  // 贴在柱身正面，稍微仰起一点——馆内镜头是俯视的，完全竖直会看成一条缝
  m.position.set(0, 0.52, 0.31);
  m.rotation.x = -0.22;
  return m;
}

// 释放一整棵子树的显存。换展厅时 60~88 座柜子整批换掉，
// 每座都带一张 canvas 贴图，只 remove 不 dispose 就是纯漏显存。
// mat() 和各几何都是每次新建、没有跨对象共享，所以逐个释放是安全的。
export function disposeTree(obj) {
  obj.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    const list = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    list.forEach(mm => {
      if (mm.map) mm.map.dispose();
      mm.dispose();
    });
  });
}

/* ================= 游客招待厅 ================= */

// 岛上的招待厅：玻璃门脸 + 雨棚 + 转动的迎宾铃
export function createReceptionBuilding() {
  const g = new THREE.Group();
  const wall = mat(0xf0e2c8), trim = mat(0xc9a97e);
  const glass = mat(0xbfe3f0, { transparent: true, opacity: 0.55, roughness: 0.15 });
  g.add(mesh(new THREE.BoxGeometry(4.2, 0.24, 3.2), trim, 0, 0.12, 0));
  g.add(mesh(new THREE.BoxGeometry(3.8, 2.6, 2.8), wall, 0, 1.5, -0.2));
  // 整面玻璃门脸
  g.add(mesh(new THREE.BoxGeometry(2.6, 1.9, 0.1), glass, 0, 1.25, 1.22));
  [-0.9, 0, 0.9].forEach(x => g.add(mesh(new THREE.BoxGeometry(0.09, 1.9, 0.14), trim, x, 1.25, 1.24)));
  // 雨棚
  const awn = mesh(new THREE.BoxGeometry(4.4, 0.14, 1.5), mat(0xc25b5b), 0, 2.6, 1.5);
  awn.rotation.x = -0.22;
  g.add(awn);
  [-2.0, 2.0].forEach(x => g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 8), trim, x, 1.3, 2.1)));
  // 屋顶
  g.add(mesh(new THREE.BoxGeometry(4.2, 0.2, 3.2), trim, 0, 2.92, -0.2));
  g.add(mesh(new THREE.BoxGeometry(3.4, 0.5, 2.4), mat(0xd8cdb8), 0, 3.2, -0.2));
  // 转动的迎宾铃
  const bell = new THREE.Group();
  bell.add(mesh(new THREE.SphereGeometry(0.3, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(0xf2c94c, { roughness: 0.3 }), 0, 0, 0));
  bell.add(mesh(new THREE.SphereGeometry(0.11, 8, 7), mat(0xd8a63a), 0, -0.14, 0));
  bell.position.set(0, 3.85, -0.2);
  bell.userData.spin = true;
  g.add(bell);
  g.traverse(o => { if (o.isMesh) o.userData.reception = true; });
  return g;
}

// 厅内：明亮的候客大厅，15 件装饰各有固定摆位
export function createReceptionInterior() {
  const g = new THREE.Group();
  const W = 14, D = 15;
  g.add(mesh(new THREE.BoxGeometry(W, 0.3, D), mat(0xe4d8c2), 0, -0.15, 0));
  for (let k = -2; k <= 2; k++) {
    g.add(mesh(new THREE.BoxGeometry(0.06, 0.02, D), mat(0xcbbb9e), k * 2.8, 0.01, 0));
  }
  const wallM = mat(0xf6efe0);
  g.add(mesh(new THREE.BoxGeometry(W, 5, 0.3), wallM, 0, 2.5, -D / 2 + 0.15));
  [-1, 1].forEach(s => g.add(mesh(new THREE.BoxGeometry(0.3, 5, D), wallM, s * (W / 2 - 0.15), 2.5, 0)));
  // 后墙落地窗
  [-4.2, 4.2].forEach(x =>
    g.add(mesh(new THREE.BoxGeometry(2.6, 2.4, 0.1),
      mat(0xd4ecf6, { emissive: 0x9fc8dc, emissiveIntensity: 0.35 }), x, 2.2, -D / 2 + 0.25)));
  [[-4, -4], [4, -4], [-4, 3], [4, 3], [0, 0]].forEach(([x, z]) => {
    const l = new THREE.PointLight(0xfff4e0, 0.5, 18, 1.8);
    l.position.set(x, 4, z);
    g.add(l);
  });
  return g;
}

// lv1~3 的常规款
const receptionKinds = {
  desk(lv) { // 前台
    const g = new THREE.Group(), w = 1.6 + lv * 0.25;
    g.add(mesh(new THREE.BoxGeometry(w, 0.9, 0.7), mat(0x8a5a34), 0, 0.45, 0));
    g.add(mesh(new THREE.BoxGeometry(w + 0.2, 0.1, 0.85), mat(0xd8c49a), 0, 0.95, 0));
    if (lv >= 2) g.add(mesh(new THREE.BoxGeometry(0.28, 0.16, 0.28), mat(0xf2c94c, { roughness: 0.3 }), w / 2 - 0.3, 1.08, 0));
    if (lv >= 3) g.add(mesh(new THREE.BoxGeometry(w, 0.7, 0.08), mat(0xb08a5a), 0, 1.5, -0.3));
    return g;
  },
  bench(lv) { // 等候长椅
    const g = new THREE.Group(), w = 1.4 + lv * 0.3;
    g.add(mesh(new THREE.BoxGeometry(w, 0.12, 0.5), mat(0xa9784a), 0, 0.42, 0));
    [-w / 2 + 0.15, w / 2 - 0.15].forEach(x => g.add(mesh(new THREE.BoxGeometry(0.12, 0.42, 0.44), mat(0x8a5a34), x, 0.21, 0)));
    if (lv >= 2) g.add(mesh(new THREE.BoxGeometry(w, 0.45, 0.1), mat(0xa9784a), 0, 0.7, -0.2));
    if (lv >= 3) g.add(mesh(new THREE.BoxGeometry(w - 0.1, 0.1, 0.42), mat(0xc25b5b), 0, 0.53, 0));
    return g;
  },
  sofa(lv) { // 双人沙发
    const g = new THREE.Group(), c = mat(lv >= 3 ? 0x5b7a96 : 0x8a9aa8);
    g.add(mesh(new THREE.BoxGeometry(1.5, 0.35, 0.75), c, 0, 0.28, 0));
    g.add(mesh(new THREE.BoxGeometry(1.5, 0.55, 0.16), c, 0, 0.7, -0.3));
    [-0.72, 0.72].forEach(x => g.add(mesh(new THREE.BoxGeometry(0.16, 0.45, 0.75), c, x, 0.55, 0)));
    if (lv >= 2) [-0.35, 0.35].forEach(x => g.add(mesh(new THREE.BoxGeometry(0.42, 0.12, 0.6), mat(0xf0e2c8), x, 0.5, 0.04)));
    return g;
  },
  rug(lv) { // 迎宾地毯
    const g = new THREE.Group(), r = 1.3 + lv * 0.35;
    g.add(mesh(new THREE.CylinderGeometry(r, r, 0.04, 20), mat(0xa8433a), 0, 0.02, 0));
    if (lv >= 2) g.add(mesh(new THREE.CylinderGeometry(r * 0.7, r * 0.7, 0.02, 20), mat(0xc9584a), 0, 0.05, 0));
    if (lv >= 3) g.add(mesh(new THREE.CylinderGeometry(r * 0.35, r * 0.35, 0.02, 20), mat(0xe0b64a), 0, 0.07, 0));
    return g;
  },
  tea(lv) { // 茶水台
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(1.0, 0.75, 0.55), mat(0xb08a5a), 0, 0.38, 0));
    g.add(mesh(new THREE.BoxGeometry(1.1, 0.08, 0.65), mat(0xe8dcc6), 0, 0.79, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.3, 10), mat(0xdedede), -0.25, 0.98, 0));
    if (lv >= 2) {
      for (let k = 0; k < 3; k++) {
        g.add(mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.1, 8), mat(0xffffff), 0.1 + k * 0.16, 0.88, 0.1));
      }
    }
    if (lv >= 3) g.add(mesh(new THREE.BoxGeometry(1.0, 0.5, 0.08), mat(0x8a5a34), 0, 1.2, -0.24));
    return g;
  },
  plant(lv) { // 迎客松
    const g = new THREE.Group(), h = 0.7 + lv * 0.35;
    g.add(mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.4, 12), mat(0xb5651d), 0, 0.2, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, h, 8), mat(0x6b4a24), 0, 0.4 + h / 2, 0));
    for (let k = 0; k < lv + 1; k++) {
      g.add(mesh(new THREE.ConeGeometry(0.5 - k * 0.09, 0.45, 8), mat(0x3f7c3c), 0, 0.55 + h * 0.55 + k * 0.28, 0));
    }
    return g;
  },
  lamp(lv) { // 落地灯
    const g = new THREE.Group(), h = 1.3 + lv * 0.25;
    g.add(mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.08, 12), mat(0x6b5a44), 0, 0.04, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, h, 8), mat(0x8a7a5a), 0, h / 2, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.34, 0.22, 0.36, 12),
      mat(0xffe6b0, { emissive: 0xd8a63a, emissiveIntensity: 0.35 + lv * 0.12 }), 0, h + 0.16, 0));
    return g;
  },
  chand(lv) { // 水晶吊灯（吊在半空）
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6), mat(0x8a7a5a), 0, 3.4, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.1 + lv * 0.08, 0.32 + lv * 0.1, 0.22, 12),
      mat(0xf2c94c, { roughness: 0.3 }), 0, 2.72, 0));
    const n = 4 + lv * 2;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2, r = 0.3 + lv * 0.1;
      g.add(mesh(new THREE.OctahedronGeometry(0.09),
        mat(0xdff0ff, { emissive: 0x9fd0ee, emissiveIntensity: 0.5, transparent: true, opacity: 0.9 }),
        Math.cos(a) * r, 2.5, Math.sin(a) * r));
    }
    return g;
  },
  art(lv) { // 壁画（贴后墙）
    const g = new THREE.Group(), w = 0.9 + lv * 0.3, h = 0.65 + lv * 0.2;
    const inner = [0x7aa8c4, 0x8ac48a, 0xc4a8e0][lv - 1] ?? 0x7aa8c4;
    g.add(mesh(new THREE.BoxGeometry(w + 0.12, h + 0.12, 0.06), mat(0xc9a24a, { roughness: 0.35 }), 0, 1.6, 0));
    g.add(mesh(new THREE.BoxGeometry(w, h, 0.02), mat(inner), 0, 1.6, 0.04));
    return g;
  },
  clock(lv) { // 立钟
    const g = new THREE.Group(), h = 1.2 + lv * 0.25;
    g.add(mesh(new THREE.BoxGeometry(0.42, h, 0.28), mat(0x7a4a24), 0, h / 2, 0));
    const face = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 14), mat(0xf6efe0), 0, h - 0.24, 0.16);
    face.rotation.x = Math.PI / 2;
    g.add(face);
    if (lv >= 2) g.add(mesh(new THREE.BoxGeometry(0.5, 0.1, 0.34), mat(0x8a5a34), 0, h + 0.05, 0));
    if (lv >= 3) g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, h * 0.5, 8), mat(0xf2c94c, { roughness: 0.3 }), 0, h * 0.35, 0.1));
    return g;
  },
  shelf(lv) { // 纪念品架
    const g = new THREE.Group(), rows = 1 + lv;
    const H = 0.4 + rows * 0.42;
    [-0.5, 0.5].forEach(x => g.add(mesh(new THREE.BoxGeometry(0.1, H, 0.36), mat(0x8a5a34), x, H / 2, 0)));
    for (let k = 0; k < rows; k++) {
      const y = 0.3 + k * 0.42;
      g.add(mesh(new THREE.BoxGeometry(1.15, 0.06, 0.36), mat(0xb08a5a), 0, y, 0));
      for (let j = 0; j < 3; j++) {
        g.add(mesh(new THREE.BoxGeometry(0.14, 0.2, 0.14),
          mat([0xc25b5b, 0x5b96c2, 0x8ac48a][(k + j) % 3]), -0.35 + j * 0.35, y + 0.13, 0));
      }
    }
    return g;
  },
  tank(lv) { // 观赏鱼缸
    const g = new THREE.Group(), w = 0.9 + lv * 0.25;
    g.add(mesh(new THREE.BoxGeometry(w + 0.1, 0.5, 0.55), mat(0x6b5a44), 0, 0.25, 0));
    g.add(mesh(new THREE.BoxGeometry(w, 0.7, 0.45),
      mat(0x4aa8c2, { transparent: true, opacity: 0.45, roughness: 0.12 }), 0, 0.85, 0));
    for (let k = 0; k < lv + 1; k++) {
      g.add(mesh(new THREE.SphereGeometry(0.07, 7, 6), mat([0xf2a04a, 0xf24a6a, 0x6ae0c2][k % 3]),
        -w / 3 + (k % 3) * (w / 3), 0.75 + (k % 2) * 0.2, 0));
    }
    return g;
  },
  screen(lv) { // 屏风
    const g = new THREE.Group(), panels = 2 + lv;
    for (let k = 0; k < panels; k++) {
      const x = (k - (panels - 1) / 2) * 0.52, dz = (k % 2) * 0.12;
      g.add(mesh(new THREE.BoxGeometry(0.5, 1.5, 0.06), mat(0xf0e2c8), x, 0.75, dz));
      g.add(mesh(new THREE.BoxGeometry(0.54, 0.08, 0.08), mat(0x7a4a24), x, 1.52, dz));
    }
    return g;
  },
  music(lv) { // 留声机
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(0.6, 0.55, 0.5), mat(0x7a4a24), 0, 0.28, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 16), mat(0x2a2a2a), 0, 0.57, 0));
    const horn = mesh(new THREE.CylinderGeometry(0.36, 0.07, 0.6, 12, 1, true),
      mat(0xf2c94c, { roughness: 0.3, side: THREE.DoubleSide }), 0.1, 0.95, 0);
    horn.rotation.z = -0.5;
    g.add(horn);
    if (lv >= 3) {
      for (let k = 0; k < 3; k++) {
        g.add(mesh(new THREE.TorusGeometry(0.07, 0.02, 5, 10),
          mat(0xffe6b0, { emissive: 0xd8a63a, emissiveIntensity: 0.5 }), 0.45 + k * 0.16, 1.25 + k * 0.14, 0));
      }
    }
    return g;
  },
  arch(lv) { // 迎宾拱门
    const g = new THREE.Group(), w = 1.6 + lv * 0.3, h = 2.0 + lv * 0.2;
    [-w, w].forEach(x => g.add(mesh(new THREE.CylinderGeometry(0.14, 0.17, h, 10), mat(0xe8dcc6), x, h / 2, 0)));
    g.add(mesh(new THREE.BoxGeometry(w * 2 + 0.5, 0.24, 0.4), mat(0xd8cdb8), 0, h + 0.1, 0));
    if (lv >= 2) g.add(mesh(new THREE.BoxGeometry(w * 1.6, 0.3, 0.1), mat(0xc25b5b), 0, h - 0.3, 0.16));
    if (lv >= 3) {
      for (let k = 0; k < 5; k++) {
        g.add(mesh(new THREE.SphereGeometry(0.1, 8, 7), mat(0xf2c94c, { roughness: 0.3 }), -w + k * (w / 2), h + 0.32, 0));
      }
    }
    return g;
  },
};

// lv4/lv5 统一走鎏金 / 传说：在常规款上罩一层金，lv5 再加发光与光环。
// 跟宠物间装饰同一套路子，省得 15 件各写两套高级款。
// 注意 material 必须 clone：mat() 每次都新建，但同一件里多个 mesh 可能共用，
// 直接改会串色到别的装饰上
export function createReceptionDecor(def, lv = 1) {
  const g = receptionKinds[def.kind](Math.min(3, lv));
  if (lv < 4) return g;
  const lv5 = lv === 5;
  const tint = new THREE.Color(lv5 ? 0xf2d98a : 0xe0b64a);
  g.traverse(o => {
    if (!o.isMesh) return;
    o.material = o.material.clone();
    o.material.color.lerp(tint, lv5 ? 0.7 : 0.5);
    o.material.metalness = 0.35;
    o.material.roughness = 0.32;
    if (lv5) {
      o.material.emissive = tint.clone().multiplyScalar(0.32);
      o.material.emissiveIntensity = 1;
    }
  });
  if (lv5) {
    const halo = mesh(new THREE.TorusGeometry(0.75, 0.035, 6, 20),
      mat(0xffe6b0, { emissive: 0xd8a63a, emissiveIntensity: 0.8 }), 0, 0.06, 0);
    halo.rotation.x = Math.PI / 2;
    g.add(halo);
    const l = new THREE.PointLight(0xffd9a0, 0.35, 4, 2);
    l.position.set(0, 1.2, 0);
    g.add(l);
  }
  return g;
}

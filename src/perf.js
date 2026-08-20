// 性能：帧率统计 + 画质档位
// 岛上后期有 3800+ 对象、90+ 装饰光源，全开会把中端机压到十几帧，
// 所以把「吃帧的东西」归拢到几个档位里，让玩家自己选，并支持按实测帧率自动降档。

const KEY_LEVEL = 'farm-quality';
const KEY_FPS = 'farm-show-fps';

// 每档关掉什么。装饰光源指荷花灯、暖光灯、传说宠物身上那些 PointLight。
//
// 实测（这台机器，岛上 98 盏装饰灯）：
//   98 盏 → 7 FPS ｜ 16 盏 → 36 FPS ｜ 8 盏 → 52 FPS ｜ 0 盏 → 95 FPS
// 光源数是压倒性的第一因素——Three.js 前向渲染下每盏 PointLight 都要在
// 每个受光片元上算一遍，98 盏就是 98 倍。阴影是第二位。
// 所以哪怕最高档也必须限量：放 Infinity 等于给玩家一个 7 帧的废档。
export const QUALITY = {
  high: {
    name: '高画质', shadow: 2048, pixelRatio: 2, shadowEvery: 1,
    decorLights: 20, rain: 1200, softShadow: true,
  },
  medium: {
    name: '中画质', shadow: 1024, pixelRatio: 1.5, shadowEvery: 2,
    decorLights: 10, rain: 600, softShadow: false,
  },
  low: {
    name: '低画质', shadow: 0, pixelRatio: 1, shadowEvery: 1,     // 关阴影
    decorLights: 4, rain: 300, softShadow: false,
  },
  potato: {
    name: '流畅优先', shadow: 0, pixelRatio: 1,
    decorLights: 0, rain: 120, softShadow: false,
  },
};
const ORDER = ['potato', 'low', 'medium', 'high'];

class Perf {
  constructor() {
    this.level = localStorage.getItem(KEY_LEVEL) ?? 'high';
    if (!QUALITY[this.level]) this.level = 'high';
    this.showFps = localStorage.getItem(KEY_FPS) !== '0';
    this.auto = localStorage.getItem('farm-auto-quality') !== '0'; // 默认开：卡了自己降，不用玩家去翻设置

    this.fps = 60;
    this.frames = 0;
    this.acc = 0;
    this.worstStreak = 0;   // 连续多少秒低于阈值，够久才降档
    this.applied = null;
    this.el = null;
  }

  attach(renderer, scene, lights) {
    this.renderer = renderer;
    this.scene = scene;
    this.lights = lights;
    this.buildHud();
    this.apply();
  }

  buildHud() {
    this.el = document.createElement('div');
    this.el.id = 'fps-hud';
    this.el.classList.toggle('hidden', !this.showFps);
    // 挂进左上角的 HUD 竖列（排在灌溉方式下面），而不是 body 的右上角——
    // 右上角跟所有面板的「出门」按钮重叠，会把它挡住点不到
    (document.getElementById('hud') ?? document.body).appendChild(this.el);
  }

  setLevel(level, byAuto = false) {
    if (!QUALITY[level]) return;
    this.level = level;
    localStorage.setItem(KEY_LEVEL, level);
    if (!byAuto) { this._ceiling = null; this.worstStreak = 0; } // 玩家手动选的，解开自动封顶
    this.apply();
  }

  setAuto(on) {
    this.auto = on;
    localStorage.setItem('farm-auto-quality', on ? '1' : '0');
    this.worstStreak = 0;
  }

  toggleFps() {
    this.showFps = !this.showFps;
    localStorage.setItem(KEY_FPS, this.showFps ? '1' : '0');
    this.el?.classList.toggle('hidden', !this.showFps);
    return this.showFps;
  }

  get cfg() { return QUALITY[this.level]; }

  // 把当前档位真正落到渲染器和场景上
  apply() {
    const c = this.cfg;
    const r = this.renderer;
    if (!r) return;
    r.setPixelRatio(Math.min(window.devicePixelRatio, c.pixelRatio));
    r.shadowMap.enabled = c.shadow > 0;
    r.shadowMap.type = c.softShadow ? 2 /* PCFSoftShadowMap */ : 1 /* PCFShadowMap */;
    if (this.lights?.sun && c.shadow > 0) {
      const map = this.lights.sun.shadow.map;
      if (this.applied?.shadow !== c.shadow) {
        // 尺寸变了要丢掉旧的 renderTarget，否则不会重新分配
        if (map) { map.dispose(); this.lights.sun.shadow.map = null; }
        this.lights.sun.shadow.mapSize.set(c.shadow, c.shadow);
      }
      this.lights.sun.castShadow = true;
    } else if (this.lights?.sun) {
      this.lights.sun.castShadow = false;
    }
    r.shadowMap.needsUpdate = true;
    this.applied = { ...c };
    this.lightsDirty = true; // 让下一帧重排装饰光源
  }

  // 装饰光源按「离镜头近」排序，只留档位允许的数量。
  //
  // 关键：改 light.visible 会让 Three.js 重编译场景里所有材质的着色器
  // （3000+ 网格时是肉眼可见的一顿）。所以绝不能每帧、甚至每 0.5 秒去调——
  // 只在「档位变了」或「镜头挪动超过阈值」时才重排，平时一动不动。
  cullLights(camera, dt) {
    if (!this._decorLights?.length) return;
    const cam = camera.position;
    const moved = !this._lastCamPos || this._lastCamPos.distanceToSquared(cam) > 64; // 移动 8 单位以上才重算
    if (!this.lightsDirty && !moved) return;
    this.lightsDirty = false;
    this._lastCamPos = cam.clone();

    const limit = this.cfg.decorLights;
    const sorted = this._decorLights
      .map(l => ({ l, d: l.getWorldPosition(this._tmp).distanceToSquared(cam) }))
      .sort((a, b) => a.d - b.d);
    sorted.forEach(({ l }, i) => {
      const want = i < limit && l.userData.wantVisible !== false;
      if (l.visible !== want) l.visible = want; // 只在真的变了时才写，减少重编译
    });
  }

  // 岛下那些内景大厅（酒窖 / 典藏馆 / 招待厅 / 宠物间 / 花房 / 杂交室 /
  // 成就殿堂 / 水族馆 / 我的家…）：它们全都摆在 y = -60 附近，
  // 玩家在岛上时一个都看不见，却照样进渲染队列、照样往阴影图里画。
  //
  // 实测：岛下 2061 个 mesh，占了 2374 个 draw call 里的 1052 个（44%）。
  // 一次只可能待在一个厅里，所以只留镜头所在的那一个，其余整组隐藏。
  //
  // 判据用「镜头离哪个厅最近」而不是 UI 的 inXxx 标志：标志会跟相机脱节
  // （出过一次相机停在温室坐标、inGreenhouse 却是 false 的状况），
  // 而位置是渲染真正依据的东西，不会说谎。
  collectInteriors(root) {
    this._interiors = [];
    root.traverse(o => {
      // 只认直接挂在世界里、整体沉在地下的那一层 Group，不往里递归
      if (o.isGroup && o.position.y < -20) this._interiors.push(o);
    });
    this.interiorsDirty = true;
    return this._interiors.length;
  }

  // 用 orbit 的「注视点」判断在不在厅里，不能用相机位置。
  //
  // 第一版拿 camera.position 比距离，阈值 50 格，结果一缩小视角就穿帮：
  // OrbitControls 的 maxDistance 是 150，往后拉一点相机就退到 50 格外，
  // 厅当场整个消失。注视点不一样——它始终钉在厅心（实测 3 格），
  // 缩放只动相机、动不了它，正好就是「玩家在看哪儿」这个语义。
  cullInteriors(camera, target) {
    if (!this._interiors?.length) return;
    const at = target ?? camera.position;
    const moved = !this._lastIntAt || this._lastIntAt.distanceToSquared(at) > 25; // 挪 5 格才重算
    if (!this.interiorsDirty && !moved) return;
    this.interiorsDirty = false;
    this._lastIntAt = at.clone();

    // 最近的那个厅，且必须真的近。
    // 在厅里注视点离厅心约 3 格；在岛上注视点是农田(0,1.6,-2.6)，
    // 离最近的厅也有 60+ 格。30 格的门槛把两种情况分得干干净净
    let best = null, bestD = Infinity;
    for (const g of this._interiors) {
      const d = g.position.distanceToSquared(at);
      if (d < bestD) { bestD = d; best = g; }
    }
    const inside = bestD < 30 * 30 ? best : null;
    for (const g of this._interiors) {
      const want = g === inside;
      if (g.visible !== want) g.visible = want;
    }
  }

  // 场景里的装饰光源集合（太阳/环境光/补光不算）
  collectLights(root, THREE) {
    this._tmp = this._tmp ?? new THREE.Vector3();
    this._decorLights = [];
    root.traverse(o => {
      if (o.isLight && o !== this.lights?.sun && o !== this.lights?.fill && !o.isAmbientLight) {
        this._decorLights.push(o);
      }
    });
    this.lightsDirty = true;
    return this._decorLights.length;
  }

  // 每帧调用：统计帧率、必要时自动降档
  tick(dt, camera, target) {
    this.frames++;
    this.acc += dt;
    if (this.acc >= 0.5) {
      this.fps = Math.round(this.frames / this.acc);
      this.frames = 0;
      this.acc = 0;
      if (this.showFps && this.el) {
        const color = this.fps >= 50 ? '#6aae5e' : this.fps >= 30 ? '#e0b64a' : '#d9534f';
        this.el.innerHTML = `<b style="color:${color}">${this.fps}</b> FPS`
          + `<small>${this.cfg.name}${this.auto ? ' · 自动' : ''}</small>`;
      }
      if (this.auto) this.autoAdjust();
    }
    this.cullLights(camera, dt);
    this.cullInteriors(camera, target);
    this.throttleShadow();
  }

  // 阴影图默认每帧重画一遍，实测占了一半的 draw call（3044 里的 1510）。
  // 但这个场景绝大部分是静止的——房子、树、装饰一动不动，
  // 会动的只有作物长大、动物和参观客走动、太阳随昼夜缓慢偏移。
  // 所以隔帧更新完全够用：阴影最多晚一帧，肉眼看不出来，
  // 代价却是把阴影 pass 的开销直接对半砍。
  //
  // 不能干脆冻住不更新：太阳位置跟着昼夜走（main.js 每帧 sun.position.set），
  // 冻住的话影子会跟太阳对不上，那是看得见的错。
  throttleShadow() {
    const r = this.renderer;
    if (!r) return;
    const every = this.cfg.shadowEvery ?? 1;
    if (every <= 1) {                      // 高画质：照旧每帧更新
      if (!r.shadowMap.autoUpdate) { r.shadowMap.autoUpdate = true; }
      return;
    }
    r.shadowMap.autoUpdate = false;
    this._shadowTick = (this._shadowTick ?? 0) + 1;
    if (this._shadowTick >= every) {
      this._shadowTick = 0;
      r.shadowMap.needsUpdate = true;
    }
  }

  // 连续 3 秒不到 45 帧就降一档；连续 10 秒稳在 58 帧以上再试着升回去。
  //
  // 防抖：某一档被判定为「扛不住」之后就把它记成天花板，本次会话不再自动升回去。
  // 否则会出现「中画质 34 帧 → 降到低画质 67 帧 → 帧率宽裕 → 升回中画质 34 帧」
  // 的死循环，玩家眼里就是画质自己在那儿抽搐。
  autoAdjust() {
    const i = ORDER.indexOf(this.level);
    if (this.fps < 45) {
      this.worstStreak += 0.5;
      if (this.worstStreak >= 3 && i > 0) {
        this.worstStreak = 0;
        this._ceiling = Math.min(this._ceiling ?? ORDER.length, i); // 这一档扛不住，封顶
        this.setLevel(ORDER[i - 1], true);
        this.onAuto?.(`⚙️ 帧率偏低，自动降到${this.cfg.name}`);
      }
    } else if (this.fps >= 58) {
      this.worstStreak -= 0.5;
      const canRaise = i + 1 < (this._ceiling ?? ORDER.length);
      if (this.worstStreak <= -10 && i < ORDER.length - 1 && canRaise) {
        this.worstStreak = 0;
        this.setLevel(ORDER[i + 1], true);
        this.onAuto?.(`⚙️ 帧率宽裕，自动升到${this.cfg.name}`);
      }
    } else {
      this.worstStreak = 0;
    }
  }
}

export const perf = new Perf();

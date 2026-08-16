// 程序化背景音乐：不依赖任何音频文件，全部用 Web Audio 现场合成
// 5 首小曲风格各异，一首放完随机换下一首（不连播同一首）

const TRACKS = [
  {
    id: 'dawn', name: '晨露小调', bpm: 70, wave: 'sine', density: 0.45, hat: false,
    root: 60, scale: [0, 2, 4, 7, 9], // C 大调五声
    prog: [[0, 4, 7], [5, 9, 12], [-3, 0, 4], [7, 11, 14]], // C F Am G
    padGain: 0.05,
  },
  {
    id: 'walk', name: '田园漫步', bpm: 92, wave: 'triangle', density: 0.55, hat: false,
    root: 55, scale: [0, 2, 4, 7, 9], // G 大调五声
    prog: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]],
    padGain: 0.045,
  },
  {
    id: 'harvest', name: '丰收进行曲', bpm: 116, wave: 'square', density: 0.62, hat: true,
    root: 62, scale: [0, 2, 4, 7, 9], // D 大调五声
    prog: [[0, 4, 7], [0, 4, 7], [5, 9, 12], [7, 11, 14]],
    padGain: 0.03,
  },
  {
    id: 'night', name: '夜风摇篮曲', bpm: 58, wave: 'sine', density: 0.3, hat: false,
    root: 57, scale: [0, 3, 5, 7, 10], // A 小调五声
    prog: [[0, 3, 7], [-4, 0, 3], [5, 8, 12], [3, 7, 10]],
    padGain: 0.065,
  },
  {
    id: 'rain', name: '雨天咖啡馆', bpm: 84, wave: 'sine', density: 0.5, hat: true,
    root: 62, scale: [0, 3, 5, 7, 10], // D 小调五声（爵士味）
    prog: [[0, 3, 7, 10], [5, 8, 12, 15], [-2, 2, 5, 8], [3, 7, 10, 14]],
    padGain: 0.05,
  },
];

const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// 背景音乐总音量。silence()/unsilence() 要拿它来回切，所以提成常量
const MASTER_GAIN = 0.14;

class MusicBox {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = localStorage.getItem('farm-music-on') !== '0';
    this.playing = false;
    this.mode = 'random'; // random 随机轮播 | once 点播一次后回随机 | loop 单曲循环
    this.track = null;
    this.step = 0;
    this.melodyDeg = 4;   // 旋律随机漫步的当前音级
    this.lastTrackId = null;
    this.timer = null;
    this.nextTime = 0;
    this.onTrack = () => {};
  }

  ensureCtx() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = MASTER_GAIN;
    this.master.connect(this.ctx.destination);
  }

  // 一次拨弦：振荡器 + 指数衰减
  pluck(midi, when, dur, wave, gain, dest) {
    const osc = this.ctx.createOscillator();
    osc.type = wave;
    osc.frequency.value = midiHz(midi);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(gain, when);
    env.gain.exponentialRampToValueAtTime(0.001, when + dur);
    osc.connect(env).connect(dest ?? this.master);
    osc.start(when);
    osc.stop(when + dur + 0.05);
  }

  // 噪声镲片
  tick(when, gain) {
    const len = 0.05;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6000;
    const env = this.ctx.createGain();
    env.gain.value = gain;
    src.connect(hp).connect(env).connect(this.master);
    src.start(when);
  }

  // 成就达成的小号角：大三和弦上行 + 顶音重复一下
  // 它是操作反馈不是背景乐，所以归「操作音效」开关管
  achievementJingle() {
    if (!sfx.enabled) return;
    try { this.ensureCtx(); } catch { return; }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    const t0 = this.ctx.currentTime + 0.02;
    const gain = this.ctx.createGain();
    gain.gain.value = 1.5; // 盖过背景music，成就要听得见
    gain.connect(this.master);
    // C-E-G-C 上行，最后高音 C 补一下
    [[72, 0], [76, 0.09], [79, 0.18], [84, 0.27], [84, 0.42]].forEach(([midi, off], k) =>
      this.pluck(midi, t0 + off, k === 4 ? 0.55 : 0.22, 'triangle', 0.32, gain));
  }

  pickTrack() {
    const pool = TRACKS.filter(t => t.id !== this.lastTrackId);
    const t = pool[Math.floor(Math.random() * pool.length)];
    this.lastTrackId = t.id;
    return t;
  }

  startTrack(track) {
    this.track = track ?? this.pickTrack();
    this.lastTrackId = this.track.id;
    this.step = 0;
    this.melodyDeg = 4;
    this.nextTime = this.ctx.currentTime + 0.15;
    this.onTrack(this.track.name);
  }

  listTracks() {
    return TRACKS.map(t => ({ id: t.id, name: t.name }));
  }

  // 点播：mode = 'once' 播完回到随机 / 'loop' 单曲循环
  playTrack(id, mode) {
    const t = TRACKS.find(x => x.id === id);
    if (!t) return;
    this.enabled = true;
    localStorage.setItem('farm-music-on', '1');
    this.ensureCtx();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.mode = mode === 'loop' ? 'loop' : 'once';
    this.playing = true;
    this.startTrack(t);
    if (!this.timer) this.timer = setInterval(() => this.schedule(), 120);
  }

  cancelLoop() {
    if (this.mode !== 'loop') return;
    this.mode = 'random';
  }

  // 每次调度往前排一小段音符（8 分音符为一步，4 拍一小节，16 小节换曲）
  schedule() {
    if (!this.playing) return;
    const t = this.track;
    const stepDur = 60 / t.bpm / 2;
    while (this.nextTime < this.ctx.currentTime + 0.5) {
      const bar = Math.floor(this.step / 8) % t.prog.length;
      const inBar = this.step % 8;
      const chord = t.prog[bar];
      const when = this.nextTime;
      // 低音：每小节 1、5 步
      if (inBar === 0 || inBar === 4) {
        this.pluck(t.root - 12 + chord[0], when, stepDur * 3.5, 'triangle', 0.16);
      }
      // 和弦垫：小节头轻轻铺一层
      if (inBar === 0) {
        chord.forEach(c => this.pluck(t.root + c, when, stepDur * 7.5, 'sine', t.padGain));
      }
      // 旋律：音级随机漫步（偏向回到和弦音）
      if (Math.random() < t.density) {
        this.melodyDeg += [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)];
        this.melodyDeg = Math.max(0, Math.min(9, this.melodyDeg));
        const oct = Math.floor(this.melodyDeg / t.scale.length);
        const off = t.scale[this.melodyDeg % t.scale.length];
        this.pluck(t.root + 12 + oct * 12 + off, when, stepDur * 1.8, t.wave, t.wave === 'square' ? 0.05 : 0.11);
      }
      // 镲片：欢快曲目的反拍
      if (t.hat && inBar % 2 === 1) this.tick(when, 0.03);
      this.step += 1;
      this.nextTime += stepDur;
      // 16 小节放完：循环模式重放本曲，点播模式回到随机
      if (this.step >= 8 * 16) {
        if (this.mode === 'loop') this.startTrack(this.track);
        else {
          if (this.mode === 'once') this.mode = 'random';
          this.startTrack();
        }
      }
    }
  }

  start() {
    if (!this.enabled || this.playing) return;
    this.ensureCtx();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.unsilence();   // 上次可能是被 stop() 拉到 0 的，先恢复音量
    this.playing = true;
    this.startTrack();
    this.timer = setInterval(() => this.schedule(), 120);
  }

  stop() {
    this.playing = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.silence();
  }

  // 光清定时器不够：schedule() 每轮会把音符排到 0.5 秒之后，
  // 清定时器只是不再往后排，已经排进去的照样响完。
  // 把总线拉到 0 才是立刻哑掉
  silence() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(0, t);
  }

  unsilence() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(MASTER_GAIN, t);
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('farm-music-on', this.enabled ? '1' : '0');
    if (this.enabled) this.start();
    else this.stop();
    return this.enabled;
  }
}

export const music = new MusicBox();

/* ================= 操作音效 =================
 * 和背景音乐共用一个 AudioContext，但挂在自己的音量总线上，
 * 所以关掉音乐不影响音效，两者各开各的。
 * 配方说明：notes = [[音高, 起始秒, 时长], ...]，noise = 一段带滤波的噪声爆。
 * 音高用 MIDI，60=C4 / 72=C5 / 84=C6。 */
const SFX = {
  // —— 田间操作 ——
  plant:    { wave: 'triangle', gain: 0.20, notes: [[72, 0, 0.09], [79, 0.05, 0.13]] },
  water:    { noise: { dur: 0.20, hp: 1400, lp: 5200, gain: 0.16 } },
  harvest:  { wave: 'triangle', gain: 0.22, notes: [[76, 0, 0.08], [83, 0.055, 0.09], [88, 0.11, 0.18]] },
  shovel:   { wave: 'sine', gain: 0.16, notes: [[57, 0.02, 0.14], [50, 0.09, 0.18]],
              noise: { dur: 0.11, hp: 500, lp: 2600, gain: 0.13 } },
  unlock:   { wave: 'triangle', gain: 0.24, notes: [[48, 0, 0.22], [60, 0.06, 0.2], [67, 0.14, 0.28]],
              noise: { dur: 0.16, hp: 300, lp: 1800, gain: 0.16 } },
  swat:     { noise: { dur: 0.07, hp: 800, lp: 7000, gain: 0.3 } },

  // —— 钱 ——
  coin:     { wave: 'square', gain: 0.10, notes: [[88, 0, 0.07], [95, 0.06, 0.14]] },
  spend:    { wave: 'triangle', gain: 0.15, notes: [[79, 0, 0.08], [71, 0.06, 0.14]] },
  upgrade:  { wave: 'triangle', gain: 0.20, notes: [[72, 0, 0.09], [76, 0.06, 0.09], [79, 0.12, 0.09], [84, 0.18, 0.26]] },
  deny:     { wave: 'sawtooth', gain: 0.09, notes: [[55, 0, 0.11], [51, 0.09, 0.17]] },

  // —— 设施与收成 ——
  done:     { wave: 'sine', gain: 0.20, notes: [[81, 0, 0.10], [85, 0.07, 0.10], [88, 0.14, 0.24]] },
  codex:    { wave: 'sine', gain: 0.22, notes: [[60, 0, 0.16], [84, 0.05, 0.1], [84, 0.16, 0.22]] },
  bouquet:  { wave: 'triangle', gain: 0.18, notes: [[79, 0, 0.08], [83, 0.055, 0.08], [86, 0.11, 0.08], [91, 0.17, 0.28]] },
  bite:     { wave: 'sine', gain: 0.26, notes: [[64, 0, 0.10], [71, 0.07, 0.20]] },

  // —— 界面 ——
  tap:      { wave: 'sine', gain: 0.07, notes: [[86, 0, 0.045]] },
  open:     { wave: 'sine', gain: 0.13, notes: [[74, 0, 0.07], [81, 0.05, 0.12]] },
  close:    { wave: 'sine', gain: 0.12, notes: [[81, 0, 0.07], [74, 0.05, 0.12]] },
  pause:    { wave: 'sine', gain: 0.16, notes: [[72, 0, 0.14], [67, 0.11, 0.14], [60, 0.22, 0.32]] },
  resume:   { wave: 'sine', gain: 0.16, notes: [[60, 0, 0.12], [67, 0.09, 0.12], [72, 0.18, 0.3]] },

  // —— 状态 ——
  poison:   { wave: 'sawtooth', gain: 0.12, notes: [[58, 0, 0.2], [56, 0.16, 0.3]] },
  die:      { wave: 'sawtooth', gain: 0.14, notes: [[60, 0, 0.22], [53, 0.2, 0.26], [45, 0.42, 0.6]] },
  revive:   { wave: 'triangle', gain: 0.18, notes: [[55, 0, 0.16], [62, 0.13, 0.16], [69, 0.26, 0.16], [76, 0.39, 0.42]] },
};

class SfxBox {
  constructor(box) {
    this.box = box; // 借背景音乐的 AudioContext，不另开一个
    this.enabled = localStorage.getItem('farm-sfx-on') !== '0';
    this.last = {}; // 每种音效上次响的时间，用来防连点糊成一片
  }

  bus() {
    this.box.ensureCtx();
    const ctx = this.box.ctx;
    if (!this._bus) {
      this._bus = ctx.createGain();
      this._bus.gain.value = 0.5;
      this._bus.connect(ctx.destination);
    }
    return this._bus;
  }

  play(name, opts = {}) {
    const def = SFX[name];
    if (!this.enabled || !def) return;
    let ctx, bus;
    try { bus = this.bus(); ctx = this.box.ctx; } catch { return; }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    // 同一种音效 60ms 内只响一次：一键浇水那种连发不会糊成噪音
    const now = ctx.currentTime;
    if (now - (this.last[name] ?? -9) < (opts.throttle ?? 0.06)) return;
    this.last[name] = now;

    const t0 = now + 0.005;
    const detune = opts.semitones ?? 0; // 连续收获时逐级升调，手感更爽
    (def.notes ?? []).forEach(([midi, off, dur]) => {
      const osc = ctx.createOscillator();
      osc.type = def.wave;
      osc.frequency.value = midiHz(midi + detune);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t0 + off);
      env.gain.exponentialRampToValueAtTime(def.gain, t0 + off + 0.008);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + off + dur);
      osc.connect(env).connect(bus);
      osc.start(t0 + off);
      osc.stop(t0 + off + dur + 0.03);
    });
    const n = def.noise;
    if (n) {
      const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * n.dur), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = n.hp;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = n.lp;
      const env = ctx.createGain();
      env.gain.value = n.gain;
      src.connect(hp).connect(lp).connect(env).connect(bus);
      src.start(t0);
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('farm-sfx-on', this.enabled ? '1' : '0');
    if (this.enabled) this.play('open');
    return this.enabled;
  }
}

export const sfx = new SfxBox(music);

/* ================= 静音守卫 =================
 * 用户把软件/标签页关掉时，页面未必真的卸载——嵌在 App 里的 webview
 * 常常只是被隐藏，JS 和 AudioContext 照跑，于是音乐在后台一直响。
 * 这里做两件事：
 *   · 页面一隐藏就 suspend() 整个 AudioContext（音乐和音效一起冻住，
 *     比逐个停音源干净，而且已排程的音符也一并冻住）
 *   · pagehide 时直接 close()，彻底放掉音频设备
 * 重新可见时只在「本来就在放」的情况下才恢复，不会自己响起来。
 */
function installAudioGuards() {
  if (typeof document === 'undefined') return;
  let wasPlaying = false;

  const hush = () => {
    wasPlaying = music.playing;
    music.silence();
    try { music.ctx?.suspend?.(); } catch { /* 已经关了就算了 */ }
  };
  const wake = () => {
    if (!music.ctx || music.ctx.state === 'closed') return;
    // 只恢复「隐藏前确实在放」的，否则一切回前台就自己唱起来很吓人
    if (!wasPlaying || !music.enabled) return;
    music.ctx.resume?.().then(() => music.unsilence()).catch(() => {});
  };

  document.addEventListener('visibilitychange', () => (document.hidden ? hush() : wake()));
  window.addEventListener('pagehide', () => {
    hush();
    try { music.ctx?.close?.(); } catch { /* 忽略 */ }
  });
  // Safari/部分 webview 不发 pagehide，用 beforeunload 兜一道
  window.addEventListener('beforeunload', hush);
}
installAudioGuards();

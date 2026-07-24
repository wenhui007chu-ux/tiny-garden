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
    this.master.gain.value = 0.14;
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
    this.playing = true;
    this.startTrack();
    this.timer = setInterval(() => this.schedule(), 120);
  }

  stop() {
    this.playing = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
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

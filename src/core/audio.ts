/** Âm thanh tổng hợp bằng WebAudio, không cần file asset. */
export type SfxName = 'throw' | 'splat' | 'bonk' | 'bloop' | 'chomp' | 'flash' | 'alert' | 'combo' | 'breakup'
  | 'whistle' | 'penalty' | 'duck' | 'win' | 'lose' | 'shield' | 'tick' | 'swoosh' | 'pop';

class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;
  private unlockHooks: (() => void)[] = [];

  get context(): AudioContext | null { return this.ctx; }
  get output(): GainNode | null { return this.master; }
  /** Gọi fn ngay khi AudioContext sẵn sàng (sau thao tác đầu tiên của người chơi). */
  onUnlock(fn: () => void): void { if (this.ctx) fn(); else this.unlockHooks.push(fn); }

  unlock(): void {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      const hooks = this.unlockHooks; this.unlockHooks = [];
      hooks.forEach(fn => fn());
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }
  /** Dừng toàn bộ âm thanh khi tab bị ẩn; thời gian của AudioContext cũng đứng yên nên nhạc không bị lệch nhịp. */
  suspend(): void { if (this.ctx?.state === 'running') void this.ctx.suspend(); }
  resume(): void { if (this.ctx?.state === 'suspended') void this.ctx.resume(); }

  play(name: SfxName): void {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    synthSfx(name, { c: this.ctx, out: this.master!, t0: this.ctx.currentTime });
  }
}

/** Nơi phát: context (thật hoặc offline), nút đầu ra và thời điểm bắt đầu. */
export interface SfxTarget { c: BaseAudioContext; out: AudioNode; t0: number }

function tone(tg: SfxTarget, type: OscillatorType, f0: number, f1: number, dur: number, vol = 0.3, delay = 0): void {
  const c = tg.c, t = tg.t0 + delay;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(tg.out);
  o.start(t); o.stop(t + dur + 0.02);
}

function noise(tg: SfxTarget, dur: number, f0: number, f1: number, vol = 0.3, delay = 0, q = 1.2): void {
  const c = tg.c, t = tg.t0 + delay;
  const len = Math.ceil(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q;
  bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(bp).connect(g).connect(tg.out);
  src.start(t); src.stop(t + dur + 0.02);
}

/** Tổng hợp một hiệu ứng âm thanh vào target bất kỳ (dùng cả cho game lẫn khi xuất video). */
export function synthSfx(name: SfxName, tg: SfxTarget): void {
    switch (name) {
      case 'throw': noise(tg, 0.22, 2400, 500, 0.35); break;
      case 'swoosh': noise(tg, 0.3, 1800, 300, 0.3, 0, 0.8); break;
      case 'splat': noise(tg, 0.18, 900, 120, 0.6, 0, 0.7); tone(tg, 'sine', 320, 70, 0.22, 0.4); break;
      case 'bonk': tone(tg, 'square', 560, 240, 0.12, 0.18); tone(tg, 'sine', 900, 600, 0.06, 0.2); break;
      case 'bloop': tone(tg, 'sine', 700, 180, 0.28, 0.35); tone(tg, 'sine', 400, 900, 0.12, 0.2, 0.18); break;
      case 'chomp': noise(tg, 0.06, 1200, 600, 0.5); noise(tg, 0.06, 1200, 600, 0.5, 0.1); break;
      case 'flash': tone(tg, 'square', 2400, 2200, 0.03, 0.15); noise(tg, 0.12, 6000, 3000, 0.25, 0.03); break;
      case 'alert': tone(tg, 'square', 660, 660, 0.09, 0.12); tone(tg, 'square', 990, 990, 0.12, 0.12, 0.1); break;
      case 'combo': [523, 659, 784, 1047].forEach((f, i) => tone(tg, 'triangle', f, f, 0.12, 0.22, i * 0.06)); break;
      case 'breakup': [392, 370, 349, 294].forEach((f, i) => tone(tg, 'sawtooth', f, f * 0.98, i === 3 ? 0.6 : 0.22, 0.12, i * 0.22)); break;
      case 'whistle': for (let i = 0; i < 6; i++) tone(tg, 'sine', 2100, 2300, 0.07, 0.18, i * 0.08); break;
      case 'penalty': tone(tg, 'sawtooth', 160, 110, 0.3, 0.2); break;
      case 'duck': noise(tg, 0.14, 700, 300, 0.18, 0, 0.6); break;
      case 'win': [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(tg, 'triangle', f, f, 0.16, 0.25, i * 0.11)); break;
      case 'lose': [440, 415, 392, 370].forEach((f, i) => tone(tg, 'triangle', f, f, 0.25, 0.22, i * 0.2)); break;
      case 'shield': tone(tg, 'triangle', 1200, 300, 0.35, 0.25); noise(tg, 0.3, 4000, 800, 0.25); break;
      case 'tick': tone(tg, 'square', 1400, 1400, 0.03, 0.08); break;
      case 'pop': tone(tg, 'sine', 500, 1200, 0.08, 0.2); break;
    }
}

export const sfx = new Sfx();

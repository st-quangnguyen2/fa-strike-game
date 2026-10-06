import { sfx } from './audio';

/**
 * Nhạc nền chiptune tự soạn, tổng hợp bằng WebAudio (không có file nhạc).
 * Mỗi bài gồm: giai điệu (lead), bass và rải hợp âm sinh từ vòng hợp âm, trống theo mẫu 16 ô.
 */
export type SongName = 'menu' | 'park' | 'night' | 'boss';
type Wave = 'pulse25' | 'pulse12' | 'square' | 'triangle' | 'sawtooth';

interface Song {
  bpm: number;
  /** Độ lệch nhịp của nốt móc đơn phách nghịch (0 = thẳng, 0.33 ≈ shuffle). */
  swing: number;
  /** Một hợp âm cho mỗi ô nhịp. */
  chords: string[];
  /** "Nốt:số móc kép", r = nghỉ. Tổng độ dài = số ô nhịp × 16. */
  lead: string;
  /** 16 ký hiệu mỗi ô nhịp: R gốc, 3, 5, 7, 8 quãng tám, . nghỉ. */
  bass: string;
  /** 16 ký hiệu mỗi ô nhịp: số = nốt thứ n trong hợp âm, c = cả hợp âm, . nghỉ. */
  arp: string;
  /** Mẫu trống 16 ký tự, xoay vòng theo ô nhịp: k trống cái, s trống lẫy, h hi-hat, K = k+h, S = s+h, o hi-hat mở. */
  drums: string[];
  leadWave: Wave; bassWave: Wave; arpWave: Wave;
  leadVol: number; bassVol: number; arpVol: number;
}

const SONGS: Record<SongName, Song> = {
  // Rình Rập: nhón chân, hơi gian, La thứ có nốt luyến chromatic.
  menu: {
    bpm: 98, swing: 0.3,
    chords: ['Am', 'Am', 'Dm', 'E7', 'F', 'Dm', 'E7', 'Am'],
    lead: `E4:1 r:1 A4:1 r:1 C5:2 B4:1 r:1 A4:2 r:2 E4:2 r:2
      G#4:1 r:1 A4:1 r:1 C5:1 r:1 E5:2 D5:2 C5:2 B4:4
      D5:1 r:1 F5:1 r:1 A5:2 G5:1 F5:1 E5:2 D5:2 r:4
      E5:2 D5:1 r:1 C5:2 B4:1 r:1 G#4:4 r:4
      C5:1 r:1 F5:1 r:1 A5:2 G5:2 F5:2 E5:2 F5:4
      D5:2 F5:2 E5:2 D5:2 C5:2 A4:2 r:4
      B4:1 r:1 C5:1 r:1 D5:1 r:1 E5:2 G#4:2 B4:2 E5:4
      A4:4 r:2 E4:1 r:1 A4:2 r:6`,
    bass: 'R . 5 . R . 5 . R . 5 . 8 . 5 .',
    arp: '. . . . 2 . . . . . . . 1 . . .',
    drums: ['k...s...k.k.s...', 'k...s...k...s.h.'],
    leadWave: 'pulse25', bassWave: 'triangle', arpWave: 'triangle',
    leadVol: 0.09, bassVol: 0.26, arpVol: 0.06,
  },
  // Công Viên Tình Yêu: nhạc ban ngày, Fa trưởng, nhảy nhót.
  park: {
    bpm: 132, swing: 0,
    chords: ['F', 'Dm', 'Bb', 'C', 'F', 'Am', 'Bb', 'C7', 'Bb', 'C', 'Am', 'Dm', 'Gm', 'C', 'F', 'F'],
    lead: `C5:2 F5:2 A5:2 F5:2 G5:2 A5:2 C6:4
      A5:2 G5:2 F5:2 D5:2 E5:2 F5:2 D5:4
      D5:2 F5:2 Bb5:2 A5:2 G5:2 F5:2 D5:2 F5:2
      E5:2 G5:2 C6:2 Bb5:2 A5:2 G5:2 E5:4
      F5:1 r:1 F5:1 r:1 A5:2 C6:2 D6:2 C6:2 A5:4
      C6:2 B5:2 A5:2 E5:2 G5:2 A5:2 E5:4
      D5:2 Bb4:2 D5:2 F5:2 G5:2 Bb5:2 A5:2 G5:2
      E5:2 G5:2 Bb5:2 G5:2 C6:4 r:4
      F5:3 D5:1 Bb4:2 D5:2 F5:4 G5:2 F5:2
      E5:3 C5:1 G4:2 C5:2 E5:4 F5:2 E5:2
      C5:2 E5:2 A5:4 G5:2 E5:2 C5:4
      D5:2 F5:2 A5:4 C6:2 A5:2 F5:4
      G5:2 Bb5:2 D6:4 C6:2 Bb5:2 G5:4
      E5:2 G5:2 C6:2 E6:2 D6:2 C6:2 Bb5:4
      A5:2 C6:2 F6:4 E6:2 C6:2 A5:4
      F5:2 r:2 C5:2 r:2 F5:4 r:4`,
    bass: 'R . 8 . 5 . 8 . R . 8 . 5 . 3 .',
    arp: '. . c . . . c . . . c . . . c .',
    drums: ['K.h.S.h.K.h.S.h.', 'K.h.S.h.K.K.S.hh'],
    leadWave: 'pulse25', bassWave: 'triangle', arpWave: 'pulse12',
    leadVol: 0.085, bassVol: 0.26, arpVol: 0.035,
  },
  // Đêm Rình Rập: Rê thứ, shuffle, bí ẩn nhưng vẫn có lực.
  night: {
    bpm: 116, swing: 0.3,
    chords: ['Dm', 'Dm', 'Gm', 'A7', 'Dm', 'Bb', 'Gm', 'A7'],
    lead: `D5:1 r:1 F5:1 r:1 A5:2 G#5:1 A5:1 r:2 F5:2 D5:2 r:2
      E5:1 r:1 F5:1 r:1 G5:2 A5:2 Bb5:2 A5:2 F5:4
      G5:1 r:1 Bb5:1 r:1 D6:2 C6:1 Bb5:1 A5:2 G5:2 r:4
      A5:2 G5:1 r:1 F5:2 E5:1 r:1 C#5:4 r:4
      D6:2 C6:1 r:1 A5:2 F5:1 r:1 D5:2 F5:2 A5:4
      Bb5:2 A5:2 G5:2 F5:2 D5:2 F5:2 Bb5:4
      G5:1 r:1 A5:1 r:1 Bb5:1 r:1 C6:2 D6:2 C6:2 Bb5:4
      A5:4 E5:2 C#5:2 A4:4 r:4`,
    bass: 'R . . R . . 5 . R . . R . 8 5 .',
    arp: '. . . . c . . . . . . . c . . .',
    drums: ['K.h.S..hK.hhS.h.', 'K.h.S.h.K.K.S.hh'],
    leadWave: 'square', bassWave: 'triangle', arpWave: 'triangle',
    leadVol: 0.06, bassVol: 0.28, arpVol: 0.05,
  },
  // Lá Chắn Tình Yêu: Mi thứ, nhanh, dồn dập cho trận boss.
  boss: {
    bpm: 152, swing: 0,
    chords: ['Em', 'Em', 'C', 'D', 'Em', 'C', 'Am', 'B7'],
    lead: `E5:2 E5:2 G5:2 E5:2 B5:2 A5:2 G5:2 F#5:2
      E5:2 r:2 E5:1 F#5:1 G5:2 A5:2 B5:2 G5:4
      C6:2 B5:2 A5:2 G5:2 E5:2 G5:2 C6:4
      D6:2 C6:2 B5:2 A5:2 F#5:2 A5:2 D6:4
      B5:2 B5:2 E6:2 B5:2 G5:2 B5:2 E5:4
      C6:2 G5:2 E5:2 G5:2 C6:2 E6:2 D6:4
      A5:2 C6:2 E6:2 C6:2 B5:2 A5:2 G5:2 F#5:2
      D#5:2 F#5:2 A5:2 B5:2 D#6:4 r:4`,
    bass: 'R . R 8 R . R 8 R . R 8 5 . 8 .',
    arp: '0 1 2 1 0 1 2 1 0 1 2 1 0 1 2 1',
    drums: ['KhhhShhhKhKhShhh', 'KhhhShhKKhhhShSh'],
    leadWave: 'pulse25', bassWave: 'sawtooth', arpWave: 'pulse12',
    leadVol: 0.08, bassVol: 0.13, arpVol: 0.03,
  },
};

/* ---------- biên dịch bài hát thành danh sách nốt theo từng ô móc kép ---------- */
const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const QUALITY: Record<string, number[]> = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], dim: [0, 3, 6] };
const acc = (a: string) => (a === '#' ? 1 : a === 'b' ? -1 : 0);
function midi(name: string): number {
  const m = /^([A-G])([#b]?)(\d)$/.exec(name);
  if (!m) throw new Error(`Nốt không hợp lệ: ${name}`);
  return 12 * (Number(m[3]) + 1) + PC[m[1]] + acc(m[2]);
}
function chord(name: string): { root: number; tones: number[] } {
  const m = /^([A-G])([#b]?)(.*)$/.exec(name)!;
  return { root: (PC[m[1]] + acc(m[2]) + 12) % 12, tones: QUALITY[m[3]] ?? QUALITY[''] };
}
const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);

type Inst = 'lead' | 'bass' | 'arp';
interface Ev { inst: Inst; m: number; len: number }
interface Compiled { song: Song; steps: Ev[][]; drums: string[]; total: number }

function compile(song: Song): Compiled {
  const bars = song.chords.length, total = bars * 16;
  const steps: Ev[][] = Array.from({ length: total }, () => []);
  const drums: string[] = [];
  let pos = 0;
  for (const tok of song.lead.trim().split(/\s+/)) {
    const [n, l] = tok.split(':'), len = Number(l);
    if (n !== 'r') steps[pos % total].push({ inst: 'lead', m: midi(n), len });
    pos += len;
  }
  if (pos !== total && import.meta.env.DEV) console.warn(`Giai điệu dài ${pos} ô, cần ${total}`);
  const bass = song.bass.split(/\s+/), arp = song.arp.split(/\s+/);
  for (let b = 0; b < bars; b++) {
    const { root, tones } = chord(song.chords[b]);
    let bassBase = 36 + root; if (bassBase > 43) bassBase -= 12;
    let arpBase = 60 + root; if (arpBase > 66) arpBase -= 12;
    for (let i = 0; i < 16; i++) {
      const at = b * 16 + i, t = bass[i];
      if (t && t !== '.') {
        const iv = t === 'R' ? 0 : t === '3' ? tones[1] : t === '5' ? tones[2] : t === '7' ? (tones[3] ?? 12) : 12;
        let len = 1; while (i + len < 16 && len < 4 && bass[i + len] === '.') len++;
        steps[at].push({ inst: 'bass', m: bassBase + iv, len });
      }
      const a = arp[i];
      if (a === 'c') for (const iv of tones) steps[at].push({ inst: 'arp', m: arpBase + iv, len: 1 });
      else if (a && a !== '.') {
        const k = Number(a);
        steps[at].push({ inst: 'arp', m: arpBase + tones[k % tones.length] + 12 * Math.floor(k / tones.length), len: 1 });
      }
      drums[at] = song.drums[b % song.drums.length][i] ?? '.';
    }
  }
  return { song, steps, drums, total };
}

/* ---------- bộ tổng hợp: phát nốt vào một AudioContext bất kỳ (thật hoặc offline) ---------- */
class Synth {
  private noise: AudioBuffer;
  private pulses = new Map<number, PeriodicWave>();
  constructor(private c: BaseAudioContext, private out: AudioNode) {
    const len = c.sampleRate;
    this.noise = c.createBuffer(1, len, c.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  /** Phát toàn bộ nốt của ô móc kép `step` tại thời điểm t. */
  step(cur: Compiled, step: number, t: number, stepDur: number, intensity: number): void {
    const s = cur.song, boost = intensity > 0 ? 1.5 : 1;
    for (const e of cur.steps[step]) {
      const dur = e.len * stepDur;
      if (e.inst === 'lead') this.voice(s.leadWave, hz(e.m), t, dur * 0.9, s.leadVol, 0.7);
      else if (e.inst === 'bass') this.voice(s.bassWave, hz(e.m), t, Math.min(dur, stepDur * 2) * 0.9, s.bassVol, 0.35);
      else this.voice(s.arpWave, hz(e.m), t, stepDur * 0.8, s.arpVol * boost, 0.2);
    }
    const d = cur.drums[step];
    if (d === 'k' || d === 'K') this.kick(t);
    if (d === 's' || d === 'S') this.snare(t);
    if (d === 'h' || d === 'K' || d === 'S') this.hat(t, 0.045, 0.035);
    if (d === 'o') this.hat(t, 0.05, 0.16);
    // căng thẳng: thêm hi-hat móc kép khi thanh nghi ngờ đỏ
    if (intensity > 0 && d !== 'h' && d !== 'K' && d !== 'S') this.hat(t, 0.028, 0.025);
  }

  private pulse(duty: number): PeriodicWave {
    let w = this.pulses.get(duty);
    if (!w) {
      const n = 32, real = new Float32Array(n), imag = new Float32Array(n);
      for (let i = 1; i < n; i++) real[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
      w = this.c.createPeriodicWave(real, imag);
      this.pulses.set(duty, w);
    }
    return w;
  }

  private voice(wave: Wave, f: number, t: number, dur: number, vol: number, sustain: number): void {
    const c = this.c, o = c.createOscillator(), g = c.createGain();
    if (wave === 'pulse25') o.setPeriodicWave(this.pulse(0.25));
    else if (wave === 'pulse12') o.setPeriodicWave(this.pulse(0.125));
    else o.type = wave;
    o.frequency.setValueAtTime(f, t);
    const a = 0.006, dec = Math.min(0.12, dur * 0.5), rel = 0.05, hold = Math.max(a + dec, dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol * sustain), t + a + dec);
    g.gain.setValueAtTime(Math.max(0.0002, vol * sustain), t + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + hold + rel);
    o.connect(g).connect(this.out);
    o.start(t);
    o.stop(t + hold + rel + 0.02);
  }

  private noiseHit(t: number, dur: number, vol: number, type: BiquadFilterType, freq: number, q = 0.8): void {
    const c = this.c, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = this.noise;
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.out);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }
  private kick(t: number): void {
    const c = this.c, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(0.32, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g).connect(this.out);
    o.start(t); o.stop(t + 0.18);
  }
  private snare(t: number): void {
    this.noiseHit(t, 0.13, 0.16, 'bandpass', 1900);
    this.voice('triangle', 190, t, 0.05, 0.1, 0.3);
  }
  private hat(t: number, vol: number, dur: number): void { this.noiseHit(t, dur, vol, 'highpass', 7000, 0.5); }
}

const COMPILED = new Map<SongName, Compiled>();
function compiled(name: SongName): Compiled {
  let c = COMPILED.get(name);
  if (!c) { c = compile(SONGS[name]); COMPILED.set(name, c); }
  return c;
}
const swingAt = (song: Song, step: number, stepDur: number) => (step % 4 === 2 ? song.swing * stepDur : 0);

/**
 * Lên lịch một đoạn bài hát từ t0 tới t1 (giây) vào context offline, bắt đầu từ ô nhịp đầu tiên.
 * intensity(t) trả về 1 khi muốn thêm hi-hat dồn dập.
 */
export function renderSong(c: BaseAudioContext, out: AudioNode, name: SongName, t0: number, t1: number, intensity: (t: number) => number = () => 0): void {
  const cur = compiled(name), synth = new Synth(c, out), stepDur = 60 / cur.song.bpm / 4;
  for (let i = 0, t = t0; t < t1; i++, t += stepDur) {
    const step = i % cur.total;
    synth.step(cur, step, t + swingAt(cur.song, step, stepDur), stepDur, intensity(t));
  }
}

/* ---------- máy phát nhạc trong game ---------- */
const BUS_VOL = 0.6;
const LOOKAHEAD = 0.15;

class Music {
  enabled = true;
  intensity = 0;
  private wanted: SongName | null = null;
  private playing: SongName | null = null;
  private cur: Compiled | null = null;
  private synth: Synth | null = null;
  private songGain: GainNode | null = null;
  private bus: GainNode | null = null;
  private step = 0;
  private next = 0;
  private timer = 0;
  private ducked = false;

  constructor() {
    sfx.onUnlock(() => { if (this.wanted && this.enabled) this.start(this.wanted); });
  }

  private ready(): AudioContext | null {
    const c = sfx.context;
    if (!c || !sfx.output) return null;
    if (!this.bus) {
      this.bus = c.createGain();
      this.bus.gain.value = BUS_VOL;
      this.bus.connect(sfx.output);
    }
    return c;
  }

  /** Chuyển sang bài name (giữ nguyên nếu đang phát đúng bài đó). */
  play(name: SongName): void {
    this.wanted = name;
    if (!this.enabled || this.playing === name) return;
    if (this.ready()) this.start(name);
  }

  stop(fade = 0.5): void {
    this.wanted = null;
    this.fadeOut(fade);
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) this.fadeOut(0.25);
    else if (this.wanted && this.ready()) this.start(this.wanted);
  }

  /** Nhỏ nhạc khi mở màn hình tạm dừng. */
  duck(on: boolean): void {
    this.ducked = on;
    const c = sfx.context;
    if (c && this.bus) this.bus.gain.setTargetAtTime(on ? BUS_VOL * 0.35 : BUS_VOL, c.currentTime, 0.08);
  }

  private fadeOut(fade: number): void {
    const c = sfx.context;
    if (c && this.songGain) {
      const g = this.songGain;
      g.gain.cancelScheduledValues(c.currentTime);
      g.gain.setValueAtTime(g.gain.value, c.currentTime);
      g.gain.linearRampToValueAtTime(0, c.currentTime + fade);
      window.setTimeout(() => g.disconnect(), (fade + 0.3) * 1000);
    }
    window.clearInterval(this.timer);
    this.timer = 0;
    this.songGain = null;
    this.synth = null;
    this.playing = null;
    this.cur = null;
  }

  private start(name: SongName): void {
    const c = this.ready();
    if (!c) return;
    this.fadeOut(0.35);
    this.cur = compiled(name);
    this.playing = name;
    this.wanted = name;
    this.songGain = c.createGain();
    this.songGain.gain.setValueAtTime(0, c.currentTime);
    this.songGain.gain.linearRampToValueAtTime(1, c.currentTime + 0.4);
    this.songGain.connect(this.bus!);
    this.synth = new Synth(c, this.songGain);
    this.duck(this.ducked);
    this.step = 0;
    this.next = c.currentTime + 0.1;
    this.timer = window.setInterval(() => this.tick(), 25);
    this.tick();
  }

  private tick(): void {
    const c = sfx.context, cur = this.cur, synth = this.synth;
    if (!c || !cur || !synth || c.state !== 'running') return;
    const stepDur = 60 / cur.song.bpm / 4;
    if (this.next < c.currentTime - 0.2) this.next = c.currentTime + 0.05; // tab bị bóp interval: nhảy tới, không phát dồn
    while (this.next < c.currentTime + LOOKAHEAD) {
      synth.step(cur, this.step, this.next + swingAt(cur.song, this.step, stepDur), stepDur, this.intensity);
      this.next += stepDur;
      this.step = (this.step + 1) % cur.total;
    }
  }
}

export const music = new Music();

/** Bài nhạc theo giờ trong ngày của màn chơi. */
export function songForTod(tod: string): SongName {
  return tod === 'fireworks' ? 'boss' : tod === 'night' ? 'night' : 'park';
}

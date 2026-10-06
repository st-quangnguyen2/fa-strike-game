import { LEVELS, BENCHES, THROW_ORIGIN } from '../config';
import type { LevelDef, Tod } from '../config';
import type { Ammo } from '../art/kit';
import { Play } from '../game/play';
import type { Loadout } from '../game/play';
import { Couple } from '../game/couple';
import { sfx } from '../core/audio';
import type { SfxName } from '../core/audio';
import type { SongName } from '../core/music';
import type { Lang } from '../i18n';
import { clamp01, inOutCubic, lerp, PX } from './kit';

export interface BigSprite { c: HTMLCanvasElement; bx: number; by: number; bw: number; bh: number }
export interface Studio {
  lang: Lang;
  time: number;
  big: Record<string, BigSprite>;
  bgs: Record<Tod, HTMLCanvasElement>;
  off: HTMLCanvasElement;
  offCtx: CanvasRenderingContext2D;
  toasts: { title: string; body: string; t: number }[];
  /** Ảnh chụp màn chơi sạch: bỏ chữ quảng cáo, ngón tay và hiệu ứng chuyển cảnh. */
  clean: boolean;
}

/** Một cảnh trong video: độ dài, bài nhạc nền, và các hàm chạy theo thời gian cục bộ lt. */
export abstract class Scene {
  start = 0;
  end = 0;
  abstract readonly dur: number;
  song: SongName = 'park';
  /** Khoảng thời gian cục bộ nhạc dồn dập (thêm hi-hat). */
  intense: [number, number] | null = null;
  private fired = new Set<string>();

  enter(_st: Studio): void { this.fired.clear(); }
  update(_st: Studio, _dt: number, _lt: number): void {}
  abstract draw(st: Studio, ctx: CanvasRenderingContext2D, lt: number): void;

  /** Phát hiệu ứng âm thanh đúng một lần khi lt vượt mốc at. */
  protected cue(lt: number, at: number, name: SfxName, id = `${name}@${at}`): void {
    if (lt >= at && !this.fired.has(id)) { this.fired.add(id); sfx.play(name); }
  }
}

interface Drag { t0: number; t1: number; sx: number; sy: number; target: (p: Play) => { x: number; y: number }; cx: number; cy: number }

/** Cảnh chạy Play thật, có kịch bản thao tác theo thời gian và camera. */
export abstract class GameScene extends Scene {
  p!: Play;
  protected drag: Drag | null = null;
  private events: [number, (p: Play) => void][] = [];
  private ei = 0;
  private punchAt = -9; private punchX = 180; private punchY = 320;
  abstract readonly tod: Tod;
  protected hud = true;
  protected player = true;
  protected loadout: Loadout = { skin: 'hoodie', cat: false };

  constructor(protected level: number, protected over: Partial<LevelDef> = {}) { super(); }

  enter(st: Studio): void {
    super.enter(st);
    const def: LevelDef = { ...LEVELS[this.level - 1], couples: 0, npcs: [], counter: false, tod: this.tod, ...this.over };
    this.p = new Play(def, () => {}, () => {}, (title, body) => st.toasts.push({ title, body: body ?? '', t: st.time }), this.loadout);
    this.events = [];
    this.ei = 0;
    this.drag = null;
    this.punchAt = -9;
    this.setup(this.p);
    this.events.sort((a, b) => a[0] - b[0]);
  }
  protected abstract setup(p: Play): void;
  protected camera(_lt: number): { zoom: number; fx: number; fy: number } { return { zoom: 1, fx: 180, fy: 320 }; }
  protected overlay(_st: Studio, _ctx: CanvasRenderingContext2D, _lt: number): void {}

  /** Kéo ngược trong [t0, t1] rồi thả ra ném vào target (tính lại mỗi khung để đón đầu mục tiêu đang đi). */
  protected throwAt(t0: number, t1: number, target: (p: Play) => { x: number; y: number }, ammo: Ammo = 'normal', sx = 214, sy = 470): void {
    this.at(t0, p => {
      p.sel = ammo;
      p.pointerDown(1, sx, sy);
      this.drag = { t0, t1, sx, sy, target, cx: sx, cy: sy };
    });
  }
  protected at(time: number, fn: (p: Play) => void): void { this.events.push([time, fn]); }

  update(_st: Studio, dt: number, lt: number): void {
    const p = this.p;
    while (this.ei < this.events.length && this.events[this.ei][0] <= lt) this.events[this.ei++][1](p);
    const d = this.drag;
    if (d) {
      const k = inOutCubic(clamp01((lt - d.t0) / Math.max(0.05, d.t1 - d.t0 - 0.12)));
      const tg = d.target(p);
      const fx = d.sx - (tg.x - THROW_ORIGIN.x) / 2.9, fy = d.sy - (tg.y - THROW_ORIGIN.y) / 2.9;
      d.cx = lerp(d.sx, fx, k); d.cy = lerp(d.sy, fy, k);
      p.pointerMove(1, d.cx, d.cy);
      if (lt >= d.t1) { p.pointerUp(1); this.drag = null; }
    }
    const before = new Set(p.projectiles);
    p.update(dt);
    for (const pr of before) if (pr.done && !p.projectiles.includes(pr)) { this.punchAt = lt; this.punchX = pr.tx; this.punchY = pr.ty; }
  }

  draw(st: Studio, ctx: CanvasRenderingContext2D, lt: number): void {
    const o = st.offCtx;
    o.setTransform(PX, 0, 0, PX, 0, 0);
    this.p.render(o, st.bgs[this.tod], { hud: this.hud, player: this.player });
    const cam = this.camera(lt);
    const punch = lt >= this.punchAt ? 0.07 * Math.exp(-(lt - this.punchAt) * 7) : 0;
    const zoom = cam.zoom + punch;
    const fx = lerp(cam.fx, this.punchX, punch * 4), fy = lerp(cam.fy, this.punchY, punch * 4);
    ctx.save();
    ctx.translate(fx, fy); ctx.scale(zoom, zoom); ctx.translate(-fx, -fy);
    ctx.drawImage(st.off, 0, 0, 360, 640);
    ctx.restore();
    if (st.clean) return;
    if (this.drag) finger(ctx, (this.drag.cx - fx) * zoom + fx, (this.drag.cy - fy) * zoom + fy);
    this.overlay(st, ctx, lt);
  }
}

export function finger(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.font = '40px system-ui, "Apple Color Emoji", "Segoe UI Emoji"';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('👆', x + 4, y - 4);
  ctx.restore();
}

/** Thời gian bay của cục tới (x,y), cùng công thức với Projectile. */
export const flightTime = (x: number, y: number) => 0.42 + Math.hypot(x - THROW_ORIGIN.x, y - THROW_ORIGIN.y) / 950;

/** Ngắm vào đầu một người trong cặp, có tính đón đầu nếu họ đang đi. */
export function aimCouple(c: Couple, who: 'm' | 'f' | 'center', speed: number): (p: Play) => { x: number; y: number } {
  return () => {
    const a = who === 'f' ? c.f : c.m, s = c.s;
    const x = who === 'center' ? c.cx : a.x, y = a.headY() + 22 * s;
    const v = c.phase === 'walk' ? (c.kind === 'elders' ? 11 : 24 * speed) * (s / 0.65) * c.dir : 0;
    return { x: x + v * flightTime(x, y), y };
  };
}
export function student(p: Play, bench: number): Couple {
  const c = new Couple('student', p, { bench: { ...BENCHES[bench], i: bench } });
  c.m.alpha = c.f.alpha = 1; c.life = 99;
  p.couples.push(c);
  return c;
}
export function walker(p: Play, kind: 'boba' | 'elders', x: number, y: number, dir: 1 | -1): Couple {
  const c = new Couple(kind, p);
  c.cx = x; c.y = y; c.dir = dir;
  p.couples.push(c);
  return c;
}
export function standing(p: Play, kind: 'selfie' | 'confession' | 'proposal', x: number, y: number): Couple {
  const c = new Couple(kind, p);
  c.y = y; c.targetX = x; c.cx = x - 1; c.dir = 1; c.life = 99;
  p.couples.push(c);
  return c;
}

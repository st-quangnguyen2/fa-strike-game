import { Actor } from './actor';
import { drawSprite, CHARS } from '../art/sprites';
import { W, LANES, depthScale } from '../config';
import type { CoupleKind } from '../config';
import { rand, pick, chance } from '../core/util';
import { sfx } from '../core/audio';
import type { World } from './types';
import { walkSpeed } from './types';
import { FONT_UI } from './fx';
import { t } from '../i18n';

export type Kind = CoupleKind | 'elders';
type Phase = 'walk' | 'enter' | 'idle' | 'wait' | 'moment' | 'happy' | 'exit' | 'hit' | 'leave' | 'fade' | 'gone';



export class Couple {
  m: Actor; f: Actor;
  phase: Phase = 'enter';
  t = 0;
  life = 20;
  cx: number; y: number;
  dir = 1;
  gap = 24;
  targetX = 180;
  cycle = 3;
  shots = 0;
  dodgeT = 0; dodgeV = 0;
  slipperIn = -1;
  bench = -1;
  hitAny = false;

  constructor(public kind: Kind, private world: World, opts: { bench?: { x: number; y: number; i: number } } = {}) {
    this.m = new Actor(`${kind}M`, 0, 0);
    this.f = new Actor(`${kind}F`, 0, 0);
    this.dir = chance(0.5) ? 1 : -1;
    const fromEdge = () => (this.dir > 0 ? -40 : W + 40);
    switch (kind) {
      case 'student': {
        const b = opts.bench!;
        this.bench = b.i; this.cx = b.x; this.y = b.y + 3;
        this.phase = 'idle'; this.life = rand(16, 24); this.cycle = rand(2, 5);
        this.m.alpha = this.f.alpha = 0;
        break;
      }
      case 'boba':
        this.y = pick([LANES.near, LANES.mid + 14]) + rand(-6, 6);
        this.cx = fromEdge(); this.phase = 'walk';
        break;
      case 'elders':
        this.y = LANES.near + rand(4, 14);
        this.cx = fromEdge(); this.phase = 'walk';
        break;
      case 'selfie':
        this.y = pick([LANES.far + 4, LANES.mid + 10, LANES.near - 6]);
        this.cx = fromEdge(); this.targetX = rand(70, 290); this.phase = 'enter'; this.life = rand(14, 18);
        break;
      default: // tỏ tình, cầu hôn
        this.y = kind === 'proposal' ? LANES.far + rand(0, 8) : pick([LANES.far + 4, LANES.mid + 12]);
        this.cx = fromEdge(); this.targetX = rand(80, 280); this.phase = 'enter';
    }
    this.place();
  }

  get s(): number { return depthScale(this.y); }
  get members(): Actor[] { return [this.m, this.f]; }
  get innocent(): boolean { return this.kind === 'elders'; }
  get targetable(): boolean { return !['hit', 'leave', 'fade', 'gone'].includes(this.phase) && this.m.alpha > 0.5 && !(this.innocent && this.hitAny); }
  get isMoment(): boolean { return this.phase === 'moment'; }
  get done(): boolean { return this.phase === 'gone'; }
  canDodge(): boolean { return (this.kind === 'boba' || this.kind === 'selfie' || this.kind === 'student') && ['walk', 'idle', 'enter'].includes(this.phase) && this.dodgeT <= 0 && this.slipperIn < 0; }

  private setState(st: string): void {
    for (const a of this.members) if (hasState(a.char, st)) a.state = st;
  }

  private place(): void {
    const s = this.s;
    const side = (this.phase === 'walk' || this.phase === 'enter' || this.phase === 'exit') && this.dir < 0 ? -1 : 1;
    if (this.phase !== 'leave') {
      this.m.x = this.cx - side * this.gap * s;
      this.f.x = this.cx + side * this.gap * s;
      this.m.y = this.f.y = this.y;
    }
  }

  dodge(dir: number): void {
    this.dodgeT = 0.3;
    this.dodgeV = dir * 58 * this.s / 0.3;
    this.slipperIn = 0.45;
    this.world.fx.float(this.cx, this.y - 120 * this.s, t('fx.dodge'), '#FF6FA8', 16);
  }

  onHit(hitMembers: Actor[], moment: boolean): void {
    for (const a of hitMembers) a.splat = 2.2;
    this.hitAny = true;
    if (this.innocent) { this.setState('hit'); return; }
    this.phase = 'hit'; this.t = 0;
    this.setState('hit');
    for (const a of this.members) a.walking = false;
    if (moment) this.world.fx.sprite('brokenHeart', this.cx, this.y - 125 * this.s, this.s * 1.4, 0, -14, 1.6);
  }

  update(dt: number): void {
    const w = this.world, s = this.s, sp = w.def.speed;
    this.t += dt;
    for (const a of this.members) a.update(dt);
    if (this.dodgeT > 0) {
      this.dodgeT -= dt; this.cx += this.dodgeV * dt;
      const k = Math.max(0, this.dodgeT) / 0.3;
      this.m.hop = this.f.hop = -Math.sin(k * Math.PI) * 14 * s;
    }
    if (this.slipperIn >= 0) {
      this.slipperIn -= dt;
      if (this.slipperIn < 0 && this.targetable) w.throwSlipper(this.m.x, this.m.headY() + 20 * s);
    }
    switch (this.phase) {
      case 'walk': {
        const v = walkSpeed(this.kind === 'elders' ? 11 : 24, s, this.kind === 'elders' ? 1 : sp);
        this.cx += this.dir * v * dt;
        this.walk(true);
        if ((this.dir > 0 && this.cx > W + 60) || (this.dir < 0 && this.cx < -60)) this.phase = 'gone';
        break;
      }
      case 'enter': {
        const v = walkSpeed(30, s, sp);
        this.walk(true);
        this.cx += Math.sign(this.targetX - this.cx) * v * dt;
        if (Math.abs(this.targetX - this.cx) < 3) {
          this.walk(false);
          this.phase = this.kind === 'selfie' ? 'idle' : 'wait';
          this.t = 0;
          this.cycle = rand(2.5, 4.5);
          if (this.phase === 'wait') { this.setState('wait'); this.gap = 27; }
          if (this.kind === 'proposal') w.spawnCompanion(this.cx, this.y, this);
        }
        break;
      }
      case 'idle': this.updateIdle(dt); break;
      case 'wait':
        if (this.t > 3.2) { this.phase = 'moment'; this.t = 0; sfx.play('pop'); }
        break;
      case 'moment':
        if (this.t > 1.2) { this.phase = 'happy'; this.t = 0; this.setState('happy'); w.fx.hearts(this.cx, this.y - 110 * s, 6); }
        break;
      case 'happy':
        if (this.t > 1.8) { this.exit(); }
        break;
      case 'exit': {
        const v = walkSpeed(34, s, sp);
        this.cx += this.dir * v * dt; this.walk(true);
        if (this.cx < -60 || this.cx > W + 60) this.phase = 'gone';
        break;
      }
      case 'hit':
        if (this.t > 1.1) {
          this.phase = 'leave'; this.t = 0; this.setState('leave');
          this.m.walking = this.f.walking = true;
          this.m.flip = true; this.f.flip = false;
        }
        break;
      case 'leave':
        this.m.x -= walkSpeed(26, s, 1) * dt;
        this.f.x += walkSpeed(52, s, 1) * dt;
        if (this.t > 2) for (const a of this.members) a.alpha = Math.max(0, a.alpha - dt * 2);
        if (this.t > 2.6 || (this.m.x < -40 && this.f.x > W + 40)) this.phase = 'gone';
        break;
      case 'fade':
        for (const a of this.members) a.alpha = Math.max(0, a.alpha - dt * 1.8);
        if (this.m.alpha <= 0) this.phase = 'gone';
        break;
    }
    // hiện dần khi xuất hiện tại ghế
    if (this.kind === 'student' && this.phase === 'idle') for (const a of this.members) a.alpha = Math.min(1, a.alpha + dt * 2.5);
    this.place();
  }

  private updateIdle(dt: number): void {
    const w = this.world;
    this.life -= dt;
    this.cycle -= dt;
    if (this.kind === 'student') {
      const leaning = this.m.state === 'lean';
      if (this.cycle <= 0) {
        this.cycle = leaning ? rand(3, 6) : 2;
        this.setState(leaning ? 'idle' : 'lean');
        this.gap = leaning ? 24 : 17;
      }
      if (this.life <= 0 && !leaning) { this.phase = 'fade'; w.fx.hearts(this.cx, this.y - 90 * this.s, 3, 'heartPale'); }
    } else if (this.kind === 'selfie') {
      const posing = this.f.state === 'lean';
      if (this.cycle <= 0) {
        if (!posing) { this.setState('lean'); this.gap = 20; this.cycle = 1.0; }
        else {
          // chụp: flash điện thoại
          const px = this.f.x + 30 * this.f.s, py = this.f.y - 98 * this.f.s;
          w.fx.camFlash(px, py, 26 * this.s); sfx.play('flash');
          if (w.playerExposed()) w.addAlert(15, t('note.selfie'));
          this.setState('idle'); this.gap = 24; this.shots++; this.cycle = rand(3.5, 6);
        }
      }
      if ((this.life <= 0 || this.shots >= 2) && !posing) this.exit();
    }
  }

  private exit(): void {
    this.phase = 'exit';
    this.dir = this.cx < W / 2 ? -1 : 1;
    if (this.kind !== 'confession' && this.kind !== 'proposal') this.setState('idle');
    this.gap = 24;
  }

  private walk(on: boolean): void {
    for (const a of this.members) { a.walking = on; a.flip = on && this.dir < 0; }
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    this.m.draw(ctx, time);
    this.f.draw(ctx, time);
  }

  /** Bong bóng tim và câu tỏ tình, vẽ trên cùng. */
  drawOverlay(ctx: CanvasRenderingContext2D, time: number): void {
    const s = this.s;
    if (this.phase === 'wait') {
      const k = Math.min(1, this.t / 3.2);
      drawSprite(ctx, 'heart', this.cx, this.y - 118 * s, s * (0.5 + k * 0.9) * (1 + Math.sin(time * 10) * 0.04));
    } else if (this.phase === 'moment') {
      const k = this.t / 1.2, pulse = 1 + Math.sin(time * 18) * 0.08;
      const hy = this.y - 124 * s;
      ctx.save();
      ctx.strokeStyle = '#FF4D7E'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.cx, hy, 20 * s + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - k)); ctx.stroke();
      ctx.restore();
      drawSprite(ctx, 'heart', this.cx, hy + 6 * s, s * 1.5 * pulse);
      const text = this.kind === 'proposal' ? t('say.proposal') : t('say.confession');
      speech(ctx, this.cx, hy - 30 * s - 10, text, 11);
    }
  }
}

function hasState(char: string, st: string): boolean { return STATES[char]?.has(st) ?? false; }
const STATES: Record<string, Set<string>> = Object.fromEntries(Object.entries(CHARS).map(([k, v]) => [k, new Set(Object.keys(v.states))]));

/** Bong bóng thoại trắng viền đậm. */
export function speech(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, size = 11): void {
  ctx.save();
  ctx.font = `700 ${size}px ${FONT_UI}`;
  const w = ctx.measureText(text).width + 16, h = size + 12;
  const bx = Math.max(4, Math.min(W - w - 4, x - w / 2));
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2A1A12'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.roundRect(bx, y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 5, y + h / 2 - 1); ctx.lineTo(x, y + h / 2 + 7); ctx.lineTo(x + 5, y + h / 2 - 1); ctx.fill(); ctx.stroke();
  ctx.fillRect(x - 6, y + h / 2 - 3, 12, 3);
  ctx.fillStyle = '#2A1A12'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + w / 2, y + 1);
  ctx.restore();
}

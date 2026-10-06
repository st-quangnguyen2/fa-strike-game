import { Actor } from './actor';
import { drawSprite } from '../art/sprites';
import { W, LANES, PLAYER, depthScale } from '../config';
import { rand, pick, chance } from '../core/util';
import { sfx } from '../core/audio';
import type { World, GroundPoop } from './types';
import { walkSpeed } from './types';
import { speech } from './couple';
import { outlinedText } from './fx';
import { t as tr } from '../i18n';

export type PersonNpcKind = 'passerby' | 'guard' | 'auntie' | 'kid' | 'photographer';

/** NPC dạng người. Mỗi loại có máy trạng thái riêng trong update(). */
export class Npc {
  a: Actor;
  phase = 'walk';
  t = 0;
  dir = 1;
  tx = 0; ty = 0;
  wait = 0;
  cycle = 0;
  life = 30;
  gone = false;
  susCd = 0;
  carrying: GroundPoop | null = null;
  owner: { done: boolean; cx: number } | null = null;

  constructor(public kind: PersonNpcKind, private world: World, opts: { x?: number; y?: number; owner?: { done: boolean; cx: number } } = {}) {
    this.dir = chance(0.5) ? 1 : -1;
    const edge = this.dir > 0 ? -30 : W + 30;
    let x: number = edge, y: number = LANES.mid;
    switch (kind) {
      case 'passerby': y = pick([LANES.far + 10, LANES.mid + 18, LANES.near + 16]); break;
      case 'guard': x = rand(60, 300); y = LANES.mid + 8; this.phase = 'patrol'; this.tx = pick([40, 320]); break;
      case 'auntie': y = pick([LANES.far + 8, LANES.mid - 8]); this.tx = rand(60, 300); this.phase = 'enter'; break;
      case 'kid': y = LANES.near + rand(-8, 18); this.phase = 'wander'; this.life = 26; this.pickWander(); break;
      case 'photographer': y = pick([LANES.far + 12, LANES.mid - 4]); this.phase = 'walk'; this.cycle = rand(4, 6); this.tx = rand(60, 300); break;
    }
    if (opts.x !== undefined) x = opts.x;
    if (opts.y !== undefined) y = opts.y;
    if (opts.owner) { this.owner = opts.owner; this.cycle = 2.5; }
    this.a = new Actor(kind, x, y);
    this.ty = y;
    if (kind === 'kid') this.a.scaleMul = 0.8;
  }

  get s(): number { return this.a.s; }
  get hittable(): boolean { return !['hit', 'exit', 'win'].includes(this.phase) && !this.gone; }
  get suspicious(): boolean { return this.kind === 'guard' && ['sus', 'search', 'chase'].includes(this.phase); }

  private moveTo(x: number, y: number, speed: number, dt: number): boolean {
    const dx = x - this.a.x, dy = y - this.a.y, d = Math.hypot(dx, dy);
    if (d < 2) { this.a.walking = false; return true; }
    const step = Math.min(d, speed * dt);
    this.a.x += (dx / d) * step; this.a.y += (dy / d) * step;
    this.a.walking = true;
    if (Math.abs(dx) > 1) this.a.flip = dx < 0;
    return false;
  }
  private exit(): void { this.phase = 'exit'; this.tx = this.a.x < W / 2 ? -40 : W + 40; }
  private pickWander(): void { this.tx = rand(30, 330); this.ty = LANES.near + rand(-8, 18); }

  onHit(): void {
    this.phase = 'hit'; this.t = 0;
    this.a.state = 'hit'; this.a.splat = 2.2; this.a.walking = false;
    if (this.carrying) this.carrying = null;
  }

  update(dt: number): void {
    const w = this.world, a = this.a, sp = w.def.speed;
    this.t += dt;
    a.update(dt);
    switch (this.kind) {
      case 'passerby': this.updatePasserby(dt, sp); break;
      case 'guard': this.updateGuard(dt, sp); break;
      case 'auntie': this.updateAuntie(dt, sp); break;
      case 'kid': this.updateKid(dt, sp); break;
      case 'photographer': this.updatePhotographer(dt, sp); break;
    }
    if (this.phase === 'exit') {
      if (this.moveTo(this.tx, a.y, walkSpeed(60, this.s, 1), dt)) this.gone = true;
    }
  }

  private updatePasserby(dt: number, sp: number): void {
    const a = this.a;
    if (this.phase === 'hit') { if (this.t > 0.7) { a.state = 'hit'; this.exit(); } return; }
    if (this.phase === 'walk') {
      a.x += this.dir * walkSpeed(32, this.s, sp) * dt; a.walking = true; a.flip = this.dir < 0;
      if (a.x < -40 || a.x > W + 40) this.gone = true;
    }
  }

  private updateGuard(dt: number, sp: number): void {
    const w = this.world, a = this.a;
    this.susCd -= dt;
    if (w.alert >= 100 && ['patrol', 'sus', 'return'].includes(this.phase)) {
      this.phase = 'chase'; this.t = 0; sfx.play('whistle');
    }
    switch (this.phase) {
      case 'patrol':
        a.state = 'idle';
        if (this.moveTo(this.tx, LANES.mid + 8, walkSpeed(24, this.s, sp), dt)) this.tx = this.tx < W / 2 ? 320 : 40;
        if (w.alert >= 60 && this.susCd <= 0) { this.phase = 'sus'; this.t = 0; a.walking = false; sfx.play('alert'); }
        break;
      case 'sus':
        a.state = 'sus'; a.walking = false;
        if (this.t > 2) { this.phase = 'patrol'; this.susCd = 3.5; }
        break;
      case 'chase':
        a.state = 'chase';
        if (this.moveTo(PLAYER.x + 40, 552, 150, dt)) { this.phase = 'search'; this.t = 0; }
        break;
      case 'search':
        a.state = 'sus'; a.walking = false;
        a.flip = Math.sin(this.t * 5) < 0;
        if (w.playerExposed()) { this.phase = 'win'; a.state = 'win'; w.caught(); }
        else if (this.t > 3) { w.setAlert(50); w.fx.float(PLAYER.x, 520, tr('fx.escaped'), '#3E9E48', 20); this.phase = 'return'; sfx.play('combo'); }
        break;
      case 'return':
        a.state = 'idle';
        if (this.moveTo(this.tx, LANES.mid + 8, 70, dt)) { this.phase = 'patrol'; this.susCd = 4; }
        break;
      case 'hit':
        if (this.t > 0.5) { this.phase = 'chase'; this.t = 0; sfx.play('whistle'); }
        break;
    }
  }

  private updateAuntie(dt: number, sp: number): void {
    const w = this.world, a = this.a;
    switch (this.phase) {
      case 'enter':
        a.state = 'idle';
        if (this.moveTo(this.tx, this.ty, walkSpeed(26, this.s, sp), dt)) { this.phase = 'idle'; this.t = 0; this.wait = rand(2.5, 5); }
        break;
      case 'idle':
        a.state = 'idle'; a.flip = false;
        if (this.t > this.wait) { this.phase = 'tele'; this.t = 0; }
        break;
      case 'tele':
        a.state = 'scan';
        if (this.t > 1) { this.phase = 'look'; this.t = 0; }
        break;
      case 'look':
        if (w.playerExposed()) { this.phase = 'report'; this.t = 0; sfx.play('alert'); }
        else if (this.t > 1.6) { this.phase = 'idle'; this.t = 0; this.wait = rand(3.5, 6); }
        break;
      case 'report': {
        a.state = 'walk';
        const g = w.guardPos();
        const arrived = g ? this.moveTo(g.x, g.y, walkSpeed(40, this.s, 1), dt) : (this.a.walking = false, false);
        if (this.t > 4 || arrived) { w.addAlert(40, tr('note.auntie')); this.exit(); }
        break;
      }
      case 'hit':
        if (this.t > 0.8) { a.state = 'walk'; this.exit(); }
        break;
    }
  }

  private updateKid(dt: number, sp: number): void {
    const w = this.world, a = this.a;
    this.life -= dt;
    switch (this.phase) {
      case 'wander': {
        a.state = 'idle';
        if (this.wait > 0) { this.wait -= dt; a.walking = false; }
        else if (this.moveTo(this.tx, this.ty, walkSpeed(50, this.s, sp), dt)) { this.pickWander(); this.wait = rand(0.4, 1.4); }
        const p = w.groundPoops.find(g => !g.claimed);
        if (p) { p.claimed = true; this.carrying = p; this.phase = 'fetch'; }
        if (this.life <= 0) this.exit();
        break;
      }
      case 'fetch': {
        const p = this.carrying!;
        if (!w.groundPoops.includes(p)) { this.carrying = null; this.phase = 'wander'; break; }
        if (this.moveTo(p.x, p.y + 2, walkSpeed(62, this.s, sp), dt)) {
          w.groundPoops.splice(w.groundPoops.indexOf(p), 1);
          a.state = 'carry'; this.phase = 'report'; this.t = 0;
          this.tx = a.x < W / 2 ? -40 : W + 40;
        }
        break;
      }
      case 'report':
        a.state = 'carry';
        if (this.moveTo(this.tx, a.y, walkSpeed(70, this.s, 1), dt)) { w.addAlert(20, tr('note.kid')); this.gone = true; }
        break;
      case 'hit':
        if (this.t > 1) this.exit();
        break;
    }
  }

  private updatePhotographer(dt: number, sp: number): void {
    const w = this.world, a = this.a;
    if (this.owner && this.owner.done && this.phase !== 'exit' && this.phase !== 'hit') this.exit();
    this.life -= dt;
    switch (this.phase) {
      case 'walk': {
        a.state = 'idle';
        const tx = this.owner ? Math.min(W - 20, Math.max(20, this.owner.cx + 70 * this.s)) : this.tx;
        if (this.moveTo(tx, this.ty, walkSpeed(30, this.s, sp), dt)) { this.phase = 'pause'; this.t = 0; this.wait = rand(1, 2); }
        this.tickCycle(dt);
        break;
      }
      case 'pause':
        a.walking = false; a.flip = false;
        if (this.t > this.wait) { this.phase = 'walk'; this.tx = rand(50, 310); }
        this.tickCycle(dt);
        break;
      case 'tele':
        a.state = 'shoot'; a.walking = false; a.flip = false;
        if (Math.floor(this.t * 2) !== Math.floor((this.t - dt) * 2)) sfx.play('tick');
        if (this.t >= 3) {
          w.fx.camFlash(a.x, a.headY(), 40 * this.s); sfx.play('flash');
          if (w.playerExposed()) { w.addAlert(35, tr('note.photo')); w.fx.flashAlpha = 0.45; }
          this.phase = 'walk'; this.cycle = this.owner ? rand(3, 4) : rand(5, 8); this.tx = rand(50, 310);
          if (this.life <= 0) this.exit();
        }
        break;
      case 'hit':
        if (this.t > 0.9) this.exit();
        break;
    }
  }
  private tickCycle(dt: number): void {
    this.cycle -= dt;
    if (this.cycle <= 0) { this.phase = 'tele'; this.t = 0; }
    else if (this.life <= 0 && !this.owner) this.exit();
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void { this.a.draw(ctx, time); }

  /** Tầm nhìn bảo vệ: vẽ dưới nhân vật. */
  drawCone(ctx: CanvasRenderingContext2D): void {
    if (this.kind !== 'guard' || this.phase === 'win') return;
    const a = this.a, s = this.s, hx = a.x, hy = a.headY();
    ctx.save();
    ctx.beginPath();
    if (this.phase === 'sus' || this.phase === 'search') {
      ctx.moveTo(hx, hy); ctx.lineTo(PLAYER.x - 70, 610); ctx.lineTo(PLAYER.x + 80, 610);
      ctx.fillStyle = 'rgba(232,72,74,.22)'; ctx.strokeStyle = 'rgba(232,72,74,.7)';
    } else {
      const d = a.flip ? -1 : 1, L = 110 * s;
      ctx.moveTo(hx, hy); ctx.lineTo(hx + d * L, hy - 30 * s); ctx.lineTo(hx + d * L, hy + 34 * s);
      ctx.fillStyle = 'rgba(255,226,90,.35)'; ctx.strokeStyle = 'rgba(224,161,0,.7)';
    }
    ctx.closePath(); ctx.fill();
    ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }

  /** Biểu tượng báo trước (👀, đếm ngược, "!"), vẽ trên cùng. */
  drawOverlay(ctx: CanvasRenderingContext2D, time: number): void {
    const a = this.a, s = this.s, top = a.headY() - 38 * s;
    if (this.kind === 'auntie') {
      if (this.phase === 'tele' || this.phase === 'look') {
        const blink = this.phase === 'tele' ? Math.sin(time * 16) > -0.3 : true;
        if (blink) { ctx.font = `${Math.round(20 + s * 8)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👀', a.x, top - 4); }
      } else if (this.phase === 'report') speech(ctx, a.x, top - 6, tr('say.auntie'), 10);
    } else if (this.kind === 'photographer' && this.phase === 'tele') {
      const n = 3 - Math.floor(this.t);
      outlinedText(ctx, String(Math.max(1, n)), a.x + 24 * s, top - 4, 22, '#E8484A');
      if (Math.sin(time * 20) > 0) { ctx.fillStyle = 'rgba(255,59,59,.45)'; ctx.beginPath(); ctx.arc(a.x + 11 * s, a.headY() + 2 * s, 9 * s, 0, Math.PI * 2); ctx.fill(); }
    } else if (this.kind === 'kid' && this.phase === 'report') speech(ctx, a.x, top - 6, tr('say.kid'), 10);
    else if (this.kind === 'guard') {
      if (this.phase === 'sus' || this.phase === 'search') outlinedText(ctx, '?', a.x + 18 * s, top - 2, 26, '#FFD23F');
      if (this.phase === 'chase') outlinedText(ctx, '!', a.x + 18 * s, top - 2, 30, '#E8484A');
    }
  }
}

/** Chó chạy chéo, nhảy đớp cục đang bay. Không bao giờ bị dính. */
export class Dog {
  x: number; y: number; vx: number; vy: number;
  state: 'run' | 'catch' = 'run';
  t = 0; hop = 0; gone = false;
  constructor(level: number) {
    const fromLeft = chance(0.5);
    this.x = fromLeft ? -40 : W + 40;
    this.y = rand(380, 520);
    const ty = Math.max(370, Math.min(540, this.y + rand(-70, 70)));
    const speed = 100 * Math.sqrt(level);
    const dx = (fromLeft ? W + 80 : -W - 80), dy = ty - this.y, d = Math.hypot(dx, dy);
    this.vx = (dx / d) * speed; this.vy = (dy / d) * speed;
  }
  get s(): number { return depthScale(this.y) * 0.9; }
  tryCatch(px: number, py: number): boolean {
    if (this.state !== 'run') return false;
    const s = this.s;
    if (Math.abs(px - this.x) < 38 * s && py > this.y - 125 * s && py < this.y + 6) {
      this.state = 'catch'; this.t = 0;
      return true;
    }
    return false;
  }
  update(dt: number): void {
    this.t += dt;
    if (this.state === 'catch') {
      this.hop = -Math.sin(Math.min(1, this.t / 0.5) * Math.PI) * 40 * this.s;
      if (this.t > 0.5) { this.vx *= 1 + dt * 3; }
    }
    this.x += this.vx * dt * (this.state === 'catch' && this.t < 0.5 ? 0.3 : 1);
    this.y += this.vy * dt;
    if (this.x < -80 || this.x > W + 80) this.gone = true;
  }
  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const s = this.s;
    ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = '#2A1A12';
    ctx.beginPath(); ctx.ellipse(this.x, this.y, 26 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    const key = this.state === 'catch' ? 'dog.catch' : Math.floor(time * 9) % 2 ? 'dog.run' : 'dog.jump';
    drawSprite(ctx, key, this.x, this.y + this.hop, s, this.vx < 0);
  }
}

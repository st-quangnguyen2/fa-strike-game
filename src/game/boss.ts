import { Actor } from './actor';
import { LANES, W, depthScale } from '../config';
import { circleRect } from '../core/util';
import type { World } from './types';
import { outlinedText } from './fx';
import { t } from '../i18n';

const LAYER_HP = [3, 4, 2];
const LAYER_COLOR = ['#FF6FA8', '#B28DFF', '#FFD23F'];
const LAYER_R = [92, 76, 62];
/** Boss to hơn người thường để nhìn ra ngay là trùm. */
const BOSS_SCALE = 1.3;

export type BossHit = { kind: 'crack' | 'bounce' | 'need-double' | 'break' | 'defeat'; layer: number };

/** Boss: Cặp Đôi Hạnh Phúc Nhất Công Viên, 3 lớp lá chắn. */
export class Boss {
  m = new Actor('bossM', 0, 0);
  f = new Actor('bossF', 0, 0);
  cx = W / 2;
  y = LANES.mid + 36;
  dir = 1;
  layer = 0;
  hp = LAYER_HP[0];
  side = 1;
  glow: 'm' | 'f' = 'm';
  swapT = 2; swapAnim = 0;
  hugT = 2.4; hugging = 0;
  slipperT = 3; callT = 12;
  wobble = 0;
  defeated = false;
  endT = 0;
  gap = 22;

  constructor(private world: World) {
    this.m.scaleMul = this.f.scaleMul = BOSS_SCALE;
    this.place();
  }

  get s(): number { return depthScale(this.y) * BOSS_SCALE; }
  get members(): Actor[] { return [this.m, this.f]; }
  get shieldCenter(): { x: number; y: number } { return { x: this.cx, y: this.y - 50 * this.s }; }

  private place(): void {
    const s = this.s;
    let off = this.gap * s * this.side;
    if (this.swapAnim > 0) off *= Math.cos((1 - this.swapAnim / 0.4) * Math.PI);
    this.m.x = this.cx - off; this.f.x = this.cx + off;
    this.m.y = this.f.y = this.y;
  }

  update(dt: number): void {
    const w = this.world;
    for (const a of this.members) a.update(dt);
    this.wobble = Math.max(0, this.wobble - dt * 3);
    if (this.defeated) {
      this.endT += dt;
      const st = this.endT < 1.5 ? 'laugh' : 'hug';
      this.m.state = this.f.state = st; this.gap = 12;
      this.place();
      return;
    }
    const speed = [40, 30, 22][this.layer];
    this.cx += this.dir * speed * dt;
    if (this.cx > 270) this.dir = -1;
    if (this.cx < 90) this.dir = 1;
    for (const a of this.members) a.walking = this.hugging <= 0;

    if (this.layer === 1) {
      this.swapT -= dt;
      if (this.swapAnim > 0) {
        this.swapAnim -= dt;
        if (this.swapAnim <= 0) { this.side *= -1; this.glow = this.glow === 'm' ? 'f' : 'm'; }
      } else if (this.swapT <= 0) { this.swapAnim = 0.4; this.swapT = 2; }
    }
    if (this.layer === 2) {
      this.hugT -= dt;
      if (this.hugging > 0) {
        this.hugging -= dt;
        if (this.hugging <= 0) { this.hugT = 2.4; this.gap = 22; this.m.state = this.f.state = 'idle'; }
      } else if (this.hugT <= 0) { this.hugging = 1.6; this.gap = 11; this.m.state = this.f.state = 'hug'; }
      this.slipperT -= dt;
      if (this.slipperT <= 0) { this.slipperT = 2.6; w.throwSlipper(this.m.x, this.m.headY() + 20 * this.s); }
      this.callT -= dt;
      if (this.callT <= 0) { this.callT = 15; w.addAlert(30, t('note.bossCall')); }
    }
    this.place();
  }

  /** Những thành viên nằm trong vùng va chạm. Lá chắn bao quanh nên cả vòng tròn lá chắn tính là trúng. */
  membersHit(ix: number, iy: number, r: number): Actor[] {
    return this.members.filter(a => circleRect(ix, iy, r, a.box()));
  }
  shieldHit(ix: number, iy: number, r: number): boolean {
    const c = this.shieldCenter, R = LAYER_R[this.layer] * this.s;
    return Math.hypot((ix - c.x) / 1.0, (iy - c.y) / 0.92) < R + r;
  }

  onHit(hit: Actor[]): BossHit {
    const layer = this.layer;
    let ok = false;
    if (layer === 0) ok = hit.length > 0;
    else if (layer === 1) {
      const target = this.glow === 'm' ? this.m : this.f;
      if (this.swapAnim > 0 || !hit.includes(target)) return { kind: 'bounce', layer };
      ok = true;
    } else {
      if (!(this.hugging > 0 && hit.length === 2)) return { kind: 'need-double', layer };
      ok = true;
    }
    if (!ok) return { kind: 'bounce', layer };
    this.wobble = 1;
    this.hp--;
    if (this.hp > 0) return { kind: 'crack', layer };
    if (layer === 2) { this.defeated = true; for (const a of this.members) a.splat = 3; return { kind: 'defeat', layer }; }
    this.layer++;
    this.hp = LAYER_HP[this.layer];
    return { kind: 'break', layer };
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const s = this.s, c = this.shieldCenter;
    if (this.layer === 1 && !this.defeated) {
      const g = this.glow === 'm' ? this.m : this.f;
      const grd = ctx.createRadialGradient(g.x, g.y - 50 * s, 4, g.x, g.y - 50 * s, 46 * s);
      grd.addColorStop(0, 'rgba(255,226,90,.85)'); grd.addColorStop(1, 'rgba(255,226,90,0)');
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(g.x, g.y - 50 * s, 46 * s, 0, Math.PI * 2); ctx.fill();
    }
    this.m.draw(ctx, time); this.f.draw(ctx, time);
    if (this.defeated) return;
    for (let L = 2; L >= this.layer; L--) {
      const R = LAYER_R[L] * s * (1 + (L === this.layer ? Math.sin(time * 30) * 0.03 * this.wobble : 0));
      ctx.save();
      ctx.globalAlpha = L === this.layer ? 1 : 0.55;
      ctx.fillStyle = LAYER_COLOR[L] + '26';
      ctx.strokeStyle = LAYER_COLOR[L];
      ctx.lineWidth = L === this.layer ? 4 : 2.5;
      ctx.beginPath(); ctx.ellipse(c.x, c.y, R, R * 0.92, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (L === this.layer) {
        const dmg = 1 - this.hp / LAYER_HP[L];
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        for (let i = 0; i < Math.round(dmg * 6); i++) {
          const a0 = i * 1.1 + 0.4, x0 = c.x + Math.cos(a0) * R * 0.95, y0 = c.y + Math.sin(a0) * R * 0.87;
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 - Math.cos(a0) * 14, y0 - Math.sin(a0) * 10 + 4); ctx.lineTo(x0 - Math.cos(a0) * 22, y0 - Math.sin(a0) * 20); ctx.stroke();
        }
      }
      ctx.restore();
    }
    if (this.layer === 2 && this.hugging > 0) outlinedText(ctx, t('fx.hug'), c.x, c.y - LAYER_R[2] * s - 12, 14, '#FFD23F', '"Baloo 2", system-ui, sans-serif');
  }
  static readonly HP = LAYER_HP;
  static readonly COLORS = LAYER_COLOR;
}

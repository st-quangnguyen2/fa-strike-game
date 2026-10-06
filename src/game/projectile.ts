import { drawSprite } from '../art/sprites';
import type { Ammo } from '../art/kit';
import { PLAYER, THROW_ORIGIN, depthScale } from '../config';
import { lerp } from '../core/util';

/** Cục đang bay: nội suy thẳng trên màn hình + cung parabol theo "độ cao". */
export class Projectile {
  t = 0;
  done = false;
  dodgeChecked = false;
  readonly T: number;
  readonly H: number;
  private spin = (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 4);
  readonly ox = THROW_ORIGIN.x;
  readonly oy = THROW_ORIGIN.y;
  constructor(public ammo: Ammo, public tx: number, public ty: number) {
    const d = Math.hypot(tx - this.ox, ty - this.oy);
    const fast = ammo === 'speed';
    this.T = (0.42 + d / 950) / (fast ? 1.9 : 1);
    this.H = d * (fast ? 0.1 : ammo === 'bomb' ? 0.46 : 0.38);
  }
  /** Vị trí tại tiến độ k (0..1). */
  at(k: number): { x: number; y: number } {
    return { x: lerp(this.ox, this.tx, k), y: lerp(this.oy, this.ty, k) - this.H * 4 * k * (1 - k) };
  }
  get x(): number { return this.at(this.t).x; }
  get y(): number { return this.at(this.t).y; }
  get scale(): number { return lerp(0.42, 0.42 * depthScale(this.ty) / 0.85, this.t); }

  update(dt: number): void { this.t = Math.min(1, this.t + dt / this.T); }

  draw(ctx: CanvasRenderingContext2D): void {
    const k = this.t, { x, y } = this.at(k), s = this.scale;
    // bóng dưới đất: dấu hiệu cho cặp đôi né và cho người chơi đoán điểm rơi
    const gx = lerp(this.ox, this.tx, k), gy = lerp(PLAYER.y - 30, this.ty, k);
    ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#2A1A12';
    ctx.beginPath(); ctx.ellipse(gx, gy, 16 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // vệt bay
    ctx.save();
    ctx.strokeStyle = this.ammo === 'rainbow' ? '#FF6FA8' : this.ammo === 'gold' ? '#FFD23F' : this.ammo === 'speed' ? '#8FD3FF' : 'rgba(255,255,255,.85)';
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.setLineDash([2, 7]);
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) { const p = this.at(Math.max(0, k - 0.05 * i)); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }
    ctx.stroke(); ctx.restore();
    drawSprite(ctx, `poop.${this.ammo}`, x, y + 30 * s, s, false, k * this.spin * 0.6);
  }
}

/** Dép phản công bay về phía người chơi. */
export class Slipper {
  t = 0;
  resolved = false;
  missed = false;
  done = false;
  private readonly T = 0.9;
  private readonly tx = PLAYER.x + 6;
  private readonly ty = PLAYER.y - 82;
  constructor(public sx: number, public sy: number) {}
  pos(): { x: number; y: number } {
    const k = Math.min(this.t, 1.5);
    return { x: lerp(this.sx, this.tx, k), y: lerp(this.sy, this.ty, k) - 70 * 4 * k * (1 - k) * (k <= 1 ? 1 : 0) };
  }
  /** Trả về 'hit' | 'miss' đúng một lần khi dép tới nơi. */
  update(dt: number, exposed: boolean): 'hit' | 'miss' | null {
    this.t += dt / this.T;
    if (!this.resolved && this.t >= 1) {
      this.resolved = true;
      if (exposed) { this.done = true; return 'hit'; }
      this.missed = true; return 'miss';
    }
    if (this.missed && this.t > 1.5) this.done = true;
    return null;
  }
  draw(ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.pos();
    drawSprite(ctx, 'slipper', x, y, 0.5 + Math.min(1, this.t) * 0.5, false, this.t * 14);
  }
}

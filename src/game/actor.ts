import { CHARS, drawSprite } from '../art/sprites';
import { depthScale } from '../config';
import type { Rect } from '../core/util';

const POSE_CACHE = new Map<string, string>();
function poseOf(char: string, state: string): string {
  const k = `${char}.${state}`;
  let p = POSE_CACHE.get(k);
  if (!p) {
    const c = CHARS[char];
    p = (c.states[state]?.pose ?? c.base.pose ?? 'stand') as string;
    POSE_CACHE.set(k, p);
  }
  return p;
}

/** Một nhân vật người trên sân: vị trí là điểm chân, tỉ lệ suy ra từ chiều sâu. */
export class Actor {
  state = 'idle';
  flip = false;
  walking = false;
  scaleMul = 1;
  alpha = 1;
  hop = 0;
  splat = 0;
  phase = Math.random() * 10;
  constructor(public char: string, public x: number, public y: number) {}

  get s(): number { return depthScale(this.y) * this.scaleMul; }
  get pose(): string { return poseOf(this.char, this.state); }
  private get poseDy(): number { const p = this.pose; return p === 'sit' ? 10 : p === 'kneel' ? 12 : 0; }

  /** Tâm đầu trên màn hình. */
  headX(): number { return this.x; }
  headY(): number { return this.y + this.hop + (-64 + this.poseDy) * this.s; }

  box(): Rect {
    const s = this.s, top = (-92 + this.poseDy) * s;
    return { x: this.x - 20 * s, y: this.y + this.hop + top, w: 40 * s, h: -top };
  }

  update(dt: number): void {
    if (this.splat > 0) this.splat = Math.max(0, this.splat - dt);
  }

  drawShadow(ctx: CanvasRenderingContext2D): void {
    const s = this.s;
    ctx.save();
    ctx.globalAlpha = 0.16 * this.alpha;
    ctx.fillStyle = '#2A1A12';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, 22 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const s = this.s;
    let off = 0, rot = 0;
    if (this.walking) {
      const w = time * 10 + this.phase;
      off = -Math.abs(Math.sin(w)) * 3 * s;
      rot = Math.sin(w) * 0.05;
    }
    this.drawShadow(ctx);
    drawSprite(ctx, `${this.char}.${this.state}`, this.x, this.y + off + this.hop, s, this.flip, rot, this.alpha);
    if (this.splat > 0) {
      const slide = (1 - Math.min(1, this.splat / 2.2)) * 14 * s;
      const a = Math.min(1, this.splat / 0.4) * this.alpha;
      drawSprite(ctx, 'splat', this.headX(), this.headY() + off - 6 * s + slide, s * 0.95, this.flip, 0, a);
    }
  }
}

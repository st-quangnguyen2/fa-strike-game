import { drawSprite } from '../art/sprites';
import { W, PLAYER, CAT_DISTRACT, ALERT, depthScale } from '../config';
import { sfx } from '../core/audio';
import { t } from '../i18n';
import type { Npc } from './npc';
import type { World } from './types';

/**
 * Mèo Ghen Tị: chạy từ bụi cây tới chỗ bảo vệ, làm bảo vệ mải vuốt ve CAT_DISTRACT giây rồi bỏ đi.
 * Nếu bảo vệ đang truy đuổi thì cuộc truy đuổi bị hủy và thanh nghi ngờ tụt xuống.
 */
export class CatPet {
  x = PLAYER.x - 36;
  y = 604;
  phase: 'run' | 'play' | 'leave' | 'gone' = 'run';
  t = 0;
  flip = false;
  private hearts = 0;
  private exitX = W + 40;
  /** Mèo chốt một bên của bảo vệ ngay từ đầu để không chạy lòng vòng khi bảo vệ đang di chuyển. */
  private side: number;
  constructor(private guard: Npc, private world: World) { this.side = this.x < guard.a.x ? -1 : 1; }

  get s(): number { return depthScale(this.y) * 1.05; }
  get gone(): boolean { return this.phase === 'gone'; }

  private moveTo(x: number, y: number, speed: number, dt: number): boolean {
    const dx = x - this.x, dy = y - this.y, d = Math.hypot(dx, dy);
    if (d < 3) return true;
    const step = Math.min(d, speed * dt);
    this.x += (dx / d) * step; this.y += (dy / d) * step;
    if (Math.abs(dx) > 1) this.flip = dx < 0;
    return false;
  }

  update(dt: number): void {
    this.t += dt;
    const g = this.guard.a;
    if (this.phase === 'run') {
      const near = Math.hypot(this.x - g.x, this.y - g.y) < 34 * g.s;
      if (near || this.moveTo(g.x + this.side * 26 * g.s, g.y + 2, 260, dt)) {
        this.phase = 'play'; this.t = 0;
        const wasHunting = this.guard.distract(CAT_DISTRACT, this.x);
        if (wasHunting) {
          this.world.setAlert(ALERT.escapeTo);
          this.world.fx.float(PLAYER.x, 520, t('cat.save'), '#3E9E48', 18);
        }
        sfx.play('pop');
      }
    } else if (this.phase === 'play') {
      this.flip = this.x > g.x;
      this.hearts -= dt;
      if (this.hearts <= 0) { this.hearts = 0.45; this.world.fx.hearts(g.x, g.headY() - 10 * g.s, 1); }
      if (this.t > CAT_DISTRACT) { this.phase = 'leave'; this.exitX = this.x < W / 2 ? -40 : W + 40; }
    } else if (this.phase === 'leave') {
      if (this.moveTo(this.exitX, this.y + 6, 240, dt)) this.phase = 'gone';
    }
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const s = this.s, running = this.phase !== 'play';
    const hop = running ? -Math.abs(Math.sin(time * 16)) * 5 * s : -Math.abs(Math.sin(time * 5)) * 2 * s;
    ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = '#2A1A12';
    ctx.beginPath(); ctx.ellipse(this.x, this.y, 14 * s, 4 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    drawSprite(ctx, running ? 'cat.jealous' : 'cat.happy', this.x, this.y + hop, s, this.flip, running ? Math.sin(time * 16) * 0.08 : 0);
  }
}

import { drawSprite } from '../art/sprites';
import { easeOutBack } from '../core/util';

const INK = '#2A1A12';
export const FONT_SFX = 'Bangers, Impact, "Arial Black", sans-serif';
export const FONT_UI = '"Be Vietnam Pro", system-ui, sans-serif';
export const FONT_DISPLAY = '"Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif';

interface Fx { t: number; life: number; draw(ctx: CanvasRenderingContext2D, k: number): void; update?(dt: number): void }

/** Ngôi sao răng cưa kiểu truyện tranh. */
export function burstPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, n = 11): void {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = Math.PI * i / n, rr = i % 2 ? r * (i % 4 === 1 ? 0.62 : 0.72) : r;
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.78;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}

/** Chữ có viền đậm. */
/** Bangers không có dấu tiếng Việt: chữ có dấu thì dùng Baloo 2 để khỏi vỡ font. */
const hasDiacritics = (text: string) => /[À-ỹ]/.test(text);

export function outlinedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, fill: string, font = FONT_SFX, stroke = INK, lw = 0.22, align: CanvasTextAlign = 'center'): void {
  if (font === FONT_SFX && hasDiacritics(text)) font = FONT_DISPLAY;
  ctx.font = `${font.includes('Bangers') ? '' : '800 '}${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, size * lw);
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

export class FxLayer {
  private items: Fx[] = [];
  flashAlpha = 0;
  shake = 0;

  burst(x: number, y: number, text: string, r = 30, fill = '#FFD23F', fs = 18): void {
    const rot = (Math.random() - 0.5) * 0.35;
    this.items.push({ t: 0, life: 0.75, draw(ctx, k) {
      const pop = k < 0.3 ? easeOutBack(k / 0.3) : 1;
      ctx.save();
      ctx.globalAlpha = k > 0.75 ? (1 - k) / 0.25 : 1;
      ctx.translate(x, y); ctx.rotate(rot); ctx.scale(pop, pop);
      burstPath(ctx, 0, 0, r);
      ctx.fillStyle = fill; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
      if (text) outlinedText(ctx, text, 0, 1, fs, INK, FONT_SFX, '#fff', 0.12);
      ctx.restore();
    } });
  }

  float(x: number, y: number, text: string, color = '#3E9E48', size = 20, font = FONT_SFX, life = 1.1): void {
    this.items.push({ t: 0, life, draw(ctx, k) {
      ctx.save();
      ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      const sc = k < 0.15 ? easeOutBack(k / 0.15) : 1;
      ctx.translate(x, y - k * 34); ctx.scale(sc, sc);
      outlinedText(ctx, text, 0, 0, size, color, font, '#fff', 0.24);
      ctx.restore();
    } });
  }

  sprite(key: string, x: number, y: number, s: number, vx: number, vy: number, life = 1, spin = 0, gravity = 0): void {
    let px = x, py = y, vvy = vy, r = 0;
    this.items.push({ t: 0, life,
      update(dt) { px += vx * dt; vvy += gravity * dt; py += vvy * dt; r += spin * dt; },
      draw(ctx, k) { drawSprite(ctx, key, px, py, s, false, r, k > 0.7 ? (1 - k) / 0.3 : 1); } });
  }

  stars(x: number, y: number, n = 6, s = 0.6): void {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5, v = 60 + Math.random() * 60;
      this.sprite('sparkle', x, y, s * (0.6 + Math.random() * 0.5), Math.cos(a) * v, Math.sin(a) * v - 30, 0.6, 4, 120);
    }
  }

  hearts(x: number, y: number, n = 5, key = 'heart'): void {
    for (let i = 0; i < n; i++) this.sprite(key, x + (Math.random() - 0.5) * 30, y, 0.5 + Math.random() * 0.3, (Math.random() - 0.5) * 30, -40 - Math.random() * 30, 1.3);
  }

  ring(x: number, y: number, r0: number, r1: number, color: string, life = 0.35): void {
    this.items.push({ t: 0, life, draw(ctx, k) {
      ctx.save();
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = color; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x, y, r0 + (r1 - r0) * k, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    } });
  }

  camFlash(x: number, y: number, r: number): void {
    this.items.push({ t: 0, life: 0.3, draw(ctx, k) {
      ctx.save();
      ctx.globalAlpha = 1 - k;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * (0.6 + k));
      g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r * (0.6 + k), 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } });
  }

  update(dt: number): void {
    for (const f of this.items) { f.t += dt; f.update?.(dt); }
    this.items = this.items.filter(f => f.t < f.life);
    this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 18);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const f of this.items) f.draw(ctx, Math.min(1, f.t / f.life));
  }

  clear(): void { this.items = []; this.flashAlpha = 0; this.shake = 0; }
}

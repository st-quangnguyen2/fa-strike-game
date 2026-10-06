/** Công cụ vẽ cho video quảng bá. Mọi tọa độ theo đơn vị logic 360×640 (canvas đã scale ×3). */
export const FPS = 30;

export const VW = 1080;
export const VH = 1920;
export const PX = VW / 360;

export const INK = '#2A1A12';
export const FONT_DISPLAY = '"Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif';
export const FONT_SFX = 'Bangers, Impact, "Arial Black", sans-serif';
export const FONT_UI = '"Be Vietnam Pro", system-ui, sans-serif';

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const outBack = (t: number) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
export const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const inOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Hệ số "bật" từ 0 lên 1 có vượt đà, bắt đầu tại thời điểm `at`. */
export function pop(lt: number, at: number, dur = 0.32): number {
  const k = (lt - at) / dur;
  return k <= 0 ? 0 : k >= 1 ? 1 : outBack(k);
}

/** Bộ sinh số ngẫu nhiên có seed để mỗi lần dựng video ra kết quả giống hệt nhau. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface CaptionOpts { at: number; lt: number; fill?: string; rot?: number; align?: CanvasTextAlign; out?: number; font?: string; lineGap?: number }
/** Chữ lớn kiểu sticker: viền mực, bóng đổ lệch, bật vào có vượt đà. Hỗ trợ xuống dòng bằng \n. */
export function caption(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, o: CaptionOpts): void {
  const k = pop(o.lt, o.at);
  if (k <= 0) return;
  const fade = o.out !== undefined ? clamp01((o.out - o.lt) / 0.2) : 1;
  if (fade <= 0) return;
  const lines = text.split('\n'), gap = size * (o.lineGap ?? 1.02);
  ctx.save();
  ctx.globalAlpha *= fade;
  ctx.translate(x, y);
  ctx.rotate(((o.rot ?? -3) * Math.PI) / 180);
  ctx.scale(k, k);
  ctx.font = `800 ${size}px ${o.font ?? FONT_DISPLAY}`;
  ctx.textAlign = o.align ?? 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  lines.forEach((line, i) => {
    const ly = (i - (lines.length - 1) / 2) * gap;
    ctx.fillStyle = INK;
    ctx.fillText(line, size * 0.07, ly + size * 0.08);
    ctx.lineWidth = size * 0.2;
    ctx.strokeStyle = INK;
    ctx.strokeText(line, 0, ly);
    ctx.fillStyle = o.fill ?? '#FFFFFF';
    ctx.fillText(line, 0, ly);
  });
  ctx.restore();
}

/** Băng rôn trắng viền mực (thay cho toast DOM của game). */
export function sticker(ctx: CanvasRenderingContext2D, title: string, body: string, x: number, y: number, k: number): void {
  if (k <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.font = `800 22px ${FONT_DISPLAY}`;
  const w1 = ctx.measureText(title).width;
  ctx.font = `700 12px ${FONT_UI}`;
  const w2 = body ? ctx.measureText(body).width : 0;
  const w = Math.max(w1, w2) + 34, h = body ? 62 : 44;
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.roundRect(-w / 2 + 4, -h / 2 + 4, w, h, 14); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeStyle = INK;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 14); ctx.fill(); ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK;
  ctx.font = `800 22px ${FONT_DISPLAY}`;
  ctx.fillText(title, 0, body ? -9 : 1);
  if (body) { ctx.font = `700 12px ${FONT_UI}`; ctx.fillStyle = '#5B4A40'; ctx.fillText(body, 0, 16); }
  ctx.restore();
}

/** Nền tia nắng xoay kiểu truyện tranh. */
export function sunburst(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number, c1: string, c2: string, rays = 18): void {
  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, 360, 640);
  ctx.fillStyle = c2;
  const R = 900, rot = t * 0.25;
  for (let i = 0; i < rays; i++) {
    const a0 = rot + (i / rays) * Math.PI * 2, a1 = a0 + Math.PI / rays;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R);
    ctx.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R);
    ctx.closePath(); ctx.fill();
  }
  // chấm halftone mờ
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  for (let y = 8; y < 640; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < 360; x += 16) { ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill(); }
}

/** Dải chuyển cảnh chéo quét qua màn hình; k từ 0 tới 1, che kín ở k = 0.5. */
export function wipe(ctx: CanvasRenderingContext2D, k: number, color: string): void {
  if (k <= 0 || k >= 1) return;
  const span = 1100, x = lerp(-span, 360 + 200, inOutCubic(k));
  ctx.save();
  ctx.translate(x, 0);
  ctx.beginPath();
  ctx.moveTo(0, -40); ctx.lineTo(760, -40); ctx.lineTo(560, 700); ctx.lineTo(-200, 700); ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  for (let y = 0; y < 700; y += 18) for (let xx = -200 + ((y / 18) % 2) * 9; xx < 760; xx += 18) { ctx.beginPath(); ctx.arc(xx, y, 3, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

/** Vẽ ảnh canvas với gốc ở chân (giống drawSprite) nhưng dùng sprite độ phân giải cao riêng của video. */
export function drawBig(ctx: CanvasRenderingContext2D, img: { c: HTMLCanvasElement; bx: number; by: number; bw: number; bh: number }, x: number, y: number, s: number, rot = 0): void {
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.drawImage(img.c, img.bx, img.by, img.bw, img.bh);
  ctx.restore();
}

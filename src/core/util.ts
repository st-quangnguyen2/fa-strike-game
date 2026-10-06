import { numberLocale } from '../i18n';

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1));
export const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const chance = (p: number) => Math.random() < p;
export const easeOutBack = (t: number) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export interface Rect { x: number; y: number; w: number; h: number }
export const inRect = (px: number, py: number, r: Rect) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
/** Hình tròn (cx,cy,r) có chạm hình chữ nhật không. */
export function circleRect(cx: number, cy: number, r: number, b: Rect): boolean {
  const nx = clamp(cx, b.x, b.x + b.w), ny = clamp(cy, b.y, b.y + b.h);
  return (cx - nx) ** 2 + (cy - ny) ** 2 <= r * r;
}
export const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);

/** Định dạng số theo ngôn ngữ: 12.400 (vi) hoặc 12,400 (en). */
export const fmt = (n: number) => Math.round(n).toLocaleString(numberLocale());

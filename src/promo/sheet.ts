import { drawSprite } from '../art/sprites';
import type { Ammo } from '../art/kit';
import type { BigSprite } from './stage';
import { drawBig, INK, FONT_DISPLAY, FONT_UI } from './kit';

/** Bảng nhân vật cho README (tiếng Anh). Vẽ trong không gian logic 800×540; người gọi scale ×2 ra 1600×1080. */
export const SHEET_W = 800;
export const SHEET_H = 540;

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, chip: string): void {
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.roundRect(x + 4, y + 4, w, h, 14); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill(); ctx.stroke();
  ctx.font = `800 13px ${FONT_DISPLAY}`;
  const tw = ctx.measureText(title).width + 20;
  ctx.fillStyle = chip; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(x + 12, y - 11, tw, 22, 11); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(title, x + 22, y + 1);
}
function caption(ctx: CanvasRenderingContext2D, x: number, y: number, main: string, sub = ''): void {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK;
  ctx.font = `800 10.5px ${FONT_DISPLAY}`; ctx.fillText(main, x, y);
  if (sub) { ctx.font = `600 8.5px ${FONT_UI}`; ctx.fillStyle = '#5B4A40'; ctx.fillText(sub, x, y + 11); }
}
const slotX = (x: number, w: number, n: number, i: number, inset = 0) => x + inset + ((w - inset * 2) * (i + 0.5)) / n;

export function drawConceptSheet(ctx: CanvasRenderingContext2D, big: Record<string, BigSprite>): void {
  ctx.fillStyle = '#EEF8FF';
  ctx.fillRect(0, 0, SHEET_W, SHEET_H);
  ctx.fillStyle = 'rgba(46,139,234,.13)';
  for (let y = 6; y < SHEET_H; y += 12) for (let x = 6; x < SHEET_W; x += 12) { ctx.beginPath(); ctx.arc(x, y, 1.1, 0, Math.PI * 2); ctx.fill(); }

  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  ctx.font = `800 30px ${FONT_DISPLAY}`;
  ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.strokeText('FA Strike', 22, 42);
  ctx.fillStyle = '#FF6FA8'; ctx.fillText('FA Strike', 22, 42);
  ctx.font = `700 11px ${FONT_UI}`; ctx.fillStyle = '#5B4A40';
  ctx.fillText('Character & prop sheet · cute cartoon, thick outlines, big heads', 168, 38);

  // nhân vật chính
  panel(ctx, 16, 72, 376, 172, 'The player', '#FF8A3D');
  const poses: [string, string, string][] = [['front.sneaky', 'Sneaky', 'default'], ['front.aim', 'Aiming', 'pulling back'], ['front.shock', 'Panic', 'guard is coming'], ['front.dizzy', 'Bonked', 'hit by a slipper']];
  poses.forEach(([k, a, b], i) => { const x = slotX(16, 376, 5, i, 10); drawBig(ctx, big[k], x, 212, 1.0); caption(ctx, x, 224, a, b); });
  drawSprite(ctx, 'player.aim', slotX(16, 376, 5, 4, 10) - 6, 212, 0.95);
  caption(ctx, slotX(16, 376, 5, 4, 10), 224, 'In-game view', 'behind the bush');

  // vũ khí
  panel(ctx, 408, 72, 376, 172, 'Poop arsenal', '#FFD23F');
  const ammo: [Ammo, string, string][] = [['normal', 'Classic', 'unlimited'], ['gold', 'Golden', 'double points'], ['rainbow', 'Rainbow', 'pierces 2'], ['bomb', 'Bomb', 'area blast'], ['magnet', 'Magnet', 'homes in'], ['speed', 'Turbo', 'fast & flat']];
  ammo.forEach(([a, n, d], i) => { const x = slotX(408, 376, 6, i); drawBig(ctx, big[`poop.${a}`], x, 200, 0.82); caption(ctx, x, 218, n, d); });

  // cặp đôi
  panel(ctx, 16, 262, 768, 134, 'Lovebirds: the targets', '#FF6FA8');
  const couples: [string, string, number, string, string][] = [
    ['studentM.lean', 'studentF.lean', 13, 'Bench students', '+100'],
    ['bobaM.idle', 'bobaF.idle', 14, 'Bubble tea date', '+100, walks'],
    ['selfieM.lean', 'selfieF.lean', 14, 'Selfie couple', 'flash can expose you'],
    ['confessionM.wait', 'confessionF.wait', 16, 'Confession', '+1,000 at the moment'],
    ['proposalM.wait', 'proposalF.wait', 16, 'Proposal', '+1,500 at the ring'],
    ['eldersM.idle', 'eldersF.idle', 14, 'Grandparents', '−200, don’t!'],
  ];
  couples.forEach(([m, f, gap, a, b], i) => {
    const x = slotX(16, 768, 6, i);
    if (i === 0) drawSprite(ctx, 'bench', x, 360, 0.52);
    drawSprite(ctx, m, x - gap, 362, 0.74);
    drawSprite(ctx, f, x + gap, 362, 0.74);
    caption(ctx, x, 376, a, b);
  });

  // NPC
  panel(ctx, 16, 412, 768, 116, 'Park NPCs: the trouble', '#5BC0FF');
  const npcs: [string, number, string, string][] = [
    ['guard.sus', 0.66, 'Security guard', 'catches you = game over'],
    ['auntie.scan', 0.66, 'Nosy auntie', 'snitches to the guard'],
    ['kid.carry', 0.53, 'Kid', 'picks up your misses'],
    ['photographer.shoot', 0.66, 'Photographer', '3, 2, 1… flash'],
    ['passerby.idle', 0.66, 'Passer-by', 'innocent, −50'],
  ];
  npcs.forEach(([k, s, a, b], i) => { const x = slotX(16, 768, 6, i); drawSprite(ctx, k, x, 496, s); caption(ctx, x, 508, a, b); });
  const dx = slotX(16, 768, 6, 5);
  drawSprite(ctx, 'dog.catch', dx - 6, 492, 0.72);
  caption(ctx, dx, 508, 'Dog', 'catches poop mid-air');
}

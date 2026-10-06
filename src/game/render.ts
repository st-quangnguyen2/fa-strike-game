import { drawSprite } from '../art/sprites';
import { W, H, PLAYER, BENCHES, DUCK_BTN, AMMO_SLOTS, PAUSE_BTN, CAT_BTN, depthScale } from '../config';
import { fmt } from '../core/util';
import { t as tr } from '../i18n';
import { Projectile } from './projectile';
import { Boss } from './boss';
import { outlinedText, FONT_SFX, FONT_UI } from './fx';
import type { Play } from './play';

const INK = '#2A1A12';

export interface RenderOpts { hud?: boolean; player?: boolean }

export function renderPlay(p: Play, ctx: CanvasRenderingContext2D, bg: HTMLCanvasElement | null, opts: RenderOpts = {}): void {
  const { hud = true, player = true } = opts;
  const t = p.time;
  ctx.save();
  if (p.fx.shake > 0) ctx.translate((Math.random() - 0.5) * p.fx.shake, (Math.random() - 0.5) * p.fx.shake);
  if (bg) ctx.drawImage(bg, 0, 0, W, H);
  else { ctx.fillStyle = '#8ED66A'; ctx.fillRect(0, 0, W, H); }
  if (p.def.tod === 'fireworks') drawFireworks(ctx, t);

  for (const n of p.npcs) n.drawCone(ctx);
  for (const g of p.groundPoops) drawSprite(ctx, 'poop.sad', g.x, g.y + 2, depthScale(g.y) * 0.34, false, 0, Math.min(1, g.life / 0.5));

  const items: { y: number; draw: () => void }[] = [];
  for (const b of BENCHES) items.push({ y: b.y, draw: () => drawSprite(ctx, 'bench', b.x, b.y, depthScale(b.y)) });
  for (const c of p.couples) items.push({ y: c.y, draw: () => c.draw(ctx, t) });
  for (const n of p.npcs) items.push({ y: n.a.y, draw: () => n.draw(ctx, t) });
  for (const d of p.dogs) items.push({ y: d.y, draw: () => d.draw(ctx, t) });
  if (p.boss) { const b = p.boss; items.push({ y: b.y, draw: () => b.draw(ctx, t) }); }
  if (p.pet) { const pet = p.pet; items.push({ y: pet.y, draw: () => pet.draw(ctx, t) }); }
  items.sort((a, b) => a.y - b.y);
  for (const i of items) i.draw();

  for (const c of p.couples) c.drawOverlay(ctx, t);
  for (const n of p.npcs) n.drawOverlay(ctx, t);
  for (const pr of p.projectiles) pr.draw(ctx);
  for (const s of p.slippers) s.draw(ctx);
  p.fx.draw(ctx);
  drawAim(p, ctx);
  if (player) drawPlayer(p, ctx, t);
  drawSprite(ctx, 'bushFG', PLAYER.x, 654, 1.55);
  ctx.restore();

  if (p.fx.flashAlpha > 0) { ctx.fillStyle = `rgba(255,255,255,${p.fx.flashAlpha})`; ctx.fillRect(0, 0, W, H); }
  if (!hud) return;
  drawHud(p, ctx, t);
  if (p.def.n === 1 && p.throws === 0 && !p.aim && !p.ended) drawTutorial(ctx, t);
}

function drawPlayer(p: Play, ctx: CanvasRenderingContext2D, t: number): void {
  const pl = p.player;
  const y = PLAYER.y + pl.duck * PLAYER.duckDrop;
  const pose = pl.stun > 0 ? 'stun' : pl.throwAnim > 0 ? 'throw' : p.aimTarget() ? 'aim' : 'idle';
  const key = `player.${p.skin}.${pose}`;
  const sx = pl.stun > 0 ? Math.sin(t * 40) * 2 : pl.caught ? Math.sin(t * 60) * 3 : 0;
  drawSprite(ctx, key, PLAYER.x + sx, y, PLAYER.s);
  if (pl.stun > 0) for (let i = 0; i < 3; i++) {
    const a = t * 6 + i * 2.1;
    drawSprite(ctx, 'sparkle', PLAYER.x + Math.cos(a) * 30, y - 128 + Math.sin(a) * 8, 0.7);
  }
  if (pl.warn > 0 && p.playerExposed() && Math.sin(t * 24) > -0.2) {
    outlinedText(ctx, '!', PLAYER.x - 34, y - 130, 34, '#E8484A');
    outlinedText(ctx, tr('hud.duckWarn'), PLAYER.x + 34, y - 128, 18, '#FFFFFF', '"Baloo 2", system-ui, sans-serif');
  }
}

function drawAim(p: Play, ctx: CanvasRenderingContext2D): void {
  const a = p.aim;
  if (!a) return;
  // dây ná: từ điểm chạm đầu tiên tới ngón tay
  ctx.save();
  ctx.strokeStyle = 'rgba(42,26,18,.35)'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(a.cx, a.cy); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(a.sx, a.sy, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
  const tg = p.aimTarget();
  if (!tg) return;
  const pr = new Projectile(p.sel, tg.x, tg.y);
  ctx.save();
  for (let k = 0.04; k <= p.predict + 0.001; k += 0.045) {
    const q = pr.at(k);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(q.x, q.y, 3.6 - k * 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  if (p.def.reticle) {
    ctx.globalAlpha = 0.45; ctx.fillStyle = '#fff';
    for (let k = p.predict + 0.05; k < 1; k += 0.06) { const q = pr.at(k); ctx.beginPath(); ctx.arc(q.x, q.y, 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#E8484A'; ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.arc(tg.x, tg.y, 13, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(tg.x - 19, tg.y); ctx.lineTo(tg.x - 8, tg.y); ctx.moveTo(tg.x + 8, tg.y); ctx.lineTo(tg.x + 19, tg.y);
    ctx.moveTo(tg.x, tg.y - 19); ctx.lineTo(tg.x, tg.y - 8); ctx.moveTo(tg.x, tg.y + 8); ctx.lineTo(tg.x, tg.y + 19); ctx.stroke();
  }
  ctx.restore();
}

function pill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke = INK, lw = 3): void {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2);
  ctx.fillStyle = fill; ctx.fill();
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color = INK, weight = 700, align: CanvasTextAlign = 'center', font = FONT_UI): void {
  ctx.font = `${weight} ${size}px ${font}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function drawHud(p: Play, ctx: CanvasRenderingContext2D, t: number): void {
  // hàng 1: điểm · mục tiêu · màn + giờ
  pill(ctx, 10, 12, 104, 32, '#fff');
  ctx.font = `24px ${FONT_SFX}`; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(fmt(p.score), 62, 30);
  if (p.boss) {
    pill(ctx, 120, 12, 118, 32, '#fff');
    label(ctx, tr('hud.shields'), 152, 29, 10.5);
    for (let i = 0; i < 3; i++) {
      const alive = p.boss.defeated ? false : i >= p.boss.layer;
      ctx.beginPath(); ctx.arc(190 + i * 18, 28, 7, 0, Math.PI * 2);
      ctx.fillStyle = alive ? Boss.COLORS[i] : '#EADFD6'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
    }
  } else {
    pill(ctx, 120, 12, 118, 32, '#FFD23F');
    label(ctx, tr('hud.goal', { a: Math.min(p.broken, p.def.goal), b: p.def.goal }), 179, 29, 12);
  }
  const low = p.timeLeft <= 10 && !p.ended;
  pill(ctx, 244, 12, 106, 32, low && Math.sin(t * 10) > 0 ? '#E8484A' : INK, INK, 0);
  const mm = Math.floor(Math.ceil(p.timeLeft) / 60), ss = String(Math.ceil(p.timeLeft) % 60).padStart(2, '0');
  label(ctx, `${p.boss ? tr('hud.boss') : tr('hud.level', { n: p.def.n })} · ${mm}:${ss}`, 297, 29, 12.5, '#fff');

  // hàng 2: thanh nghi ngờ
  let y2 = 52;
  if (p.hasGuard) {
    const hot = p.alert >= 60;
    pill(ctx, 10, 52, 340, 26, 'rgba(255,255,255,.92)', hot && Math.sin(t * 12) > 0 ? '#E8484A' : INK);
    label(ctx, tr('hud.alert'), 22, 65.5, 10.5, INK, 800, 'left');
    pill(ctx, 90, 59, 250, 12, '#EADFD6', INK, 0);
    if (p.alert > 0) pill(ctx, 90, 59, Math.max(12, 250 * p.alert / 100), 12, hot ? '#E8484A' : '#FF8A3D', INK, 0);
    ctx.fillStyle = INK; ctx.fillRect(90 + 250 * 0.6 - 1, 57, 2, 16);
    y2 = 86;
  }
  if (p.combo >= 2) {
    pill(ctx, 10, y2, 112, 24, '#FF6FA8');
    label(ctx, `${tr('hud.combo', { n: p.combo })}${p.combo >= 5 ? ` · ×${p.combo >= 10 ? 3 : 2}` : ''}`, 66, y2 + 12.5, 11.5, '#fff', 800);
  }

  // nút tạm dừng
  ctx.beginPath(); ctx.arc(PAUSE_BTN.x, PAUSE_BTN.y, PAUSE_BTN.r, 0, Math.PI * 2);
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = INK; ctx.fillRect(PAUSE_BTN.x - 6, PAUSE_BTN.y - 7, 4, 14); ctx.fillRect(PAUSE_BTN.x + 2, PAUSE_BTN.y - 7, 4, 14);

  // ô chọn đạn
  if (p.ammoList.length > 1) p.ammoList.forEach((a, i) => {
    const cx = AMMO_SLOTS.x, cy = AMMO_SLOTS.y0 - i * AMMO_SLOTS.gap, sel = p.sel === a, empty = p.stock[a] <= 0;
    ctx.save();
    if (empty) ctx.globalAlpha = 0.35;
    ctx.beginPath(); ctx.arc(cx, cy, AMMO_SLOTS.r, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = sel ? 5 : 3; ctx.strokeStyle = sel ? '#FF8A3D' : INK; ctx.stroke();
    drawSprite(ctx, `poop.${a}`, cx, cy + 12, 0.36);
    ctx.beginPath(); ctx.arc(cx + 15, cy - 14, 9, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
    label(ctx, Number.isFinite(p.stock[a]) ? String(p.stock[a]) : '∞', cx + 15, cy - 13.5, 10, '#fff', 800);
    ctx.restore();
  });

  // nút Mèo Ghen Tị
  if (p.showCat) {
    const ready = p.catReady;
    ctx.save();
    if (!ready) ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.arc(CAT_BTN.x, CAT_BTN.y, CAT_BTN.r, 0, Math.PI * 2);
    ctx.fillStyle = ready ? '#FFD23F' : '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    drawSprite(ctx, ready ? 'cat.jealous' : 'cat.happy', CAT_BTN.x - 2, CAT_BTN.y + 18, 0.62);
    ctx.restore();
    ctx.beginPath(); ctx.arc(CAT_BTN.x + 17, CAT_BTN.y - 16, 8.5, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
    label(ctx, p.catUsed ? '✓' : '1', CAT_BTN.x + 17, CAT_BTN.y - 15.5, 10, '#fff', 800);
  }

  // nút núp
  if (p.showDuck) {
    const down = p.ducking;
    ctx.beginPath(); ctx.arc(DUCK_BTN.x + (down ? 2 : 0), DUCK_BTN.y + (down ? 2 : 0), DUCK_BTN.r, 0, Math.PI * 2);
    ctx.fillStyle = down ? '#D94B86' : '#FF6FA8'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
    outlinedText(ctx, tr('hud.duck'), DUCK_BTN.x + (down ? 2 : 0), DUCK_BTN.y + 1, 17, '#fff', '"Baloo 2", system-ui, sans-serif', INK, 0.3);
  }
}

function drawTutorial(ctx: CanvasRenderingContext2D, t: number): void {
  const k = (t % 1.6) / 1.6, e = Math.min(1, k / 0.6);
  const sx = 230, sy = 520, ex = 262, ey = 600;
  const x = sx + (ex - sx) * e, y = sy + (ey - sy) * e;
  ctx.save();
  ctx.globalAlpha = k > 0.85 ? (1 - k) / 0.15 : 1;
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.setLineDash([4, 6]);
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = '34px system-ui, "Apple Color Emoji", "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('👆', x + 4, y + 14);
  ctx.restore();
  pill(ctx, 70, 452, 220, 44, '#fff');
  label(ctx, tr('hud.tut1'), 180, 466, 12.5);
  label(ctx, tr('hud.tut2'), 180, 482, 12.5);
}

function drawFireworks(ctx: CanvasRenderingContext2D, t: number): void {
  const spots = [[60, 70, '#FFD23F'], [250, 50, '#FF6FA8'], [170, 110, '#8FD3FF'], [310, 130, '#B28DFF']] as const;
  spots.forEach(([x, y, c], i) => {
    const k = (t * 0.45 + i * 0.29) % 1, r = 8 + k * 34;
    ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let j = 0; j < 10; j++) {
      const a = j * Math.PI / 5;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke();
    }
    ctx.restore();
  });
}

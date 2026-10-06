import { LANES, DUCK_BTN } from '../config';
import type { Tod } from '../config';
import type { Ammo } from '../art/kit';
import { drawSprite } from '../art/sprites';
import type { Play } from '../game/play';
import type { Couple } from '../game/couple';
import { Npc } from '../game/npc';
import type { Boss } from '../game/boss';
import { t as gameT } from '../i18n';
import type { SongName } from '../core/music';
import { caption, sunburst, drawBig, pop, clamp01, outBack, inOutCubic, INK, FONT_DISPLAY, FONT_UI } from './kit';
import { Scene, GameScene, aimCouple, student, standing, flightTime } from './stage';
import type { Studio } from './stage';
import { label } from './scenes';
import { COPY } from './copy';

/* ================= HỒI 4: KỊCH TÍNH ================= */

/** Phá màn cầu hôn ban đêm. */
export class ProposalScene extends GameScene {
  dur = 5.5; song: SongName = 'night'; tod: Tod = 'night';
  private c!: Couple;
  constructor() { super(8); }
  protected setup(p: Play): void {
    this.c = standing(p, 'proposal', 182, LANES.mid + 12);
    student(p, 0);
    this.at(0.05, () => { if (this.c.phase === 'wait') this.c.t = 1.6; });
    this.throwAt(1.15, 1.72, aimCouple(this.c, 'm', 1.2));
  }
  protected camera(lt: number) {
    const k = inOutCubic(clamp01(lt / 1.0)) * (1 - inOutCubic(clamp01((lt - 4.0) / 1.2)));
    return { zoom: 1 + 0.3 * k, fx: 182, fy: 300 };
  }
  protected overlay(st: Studio, ctx: CanvasRenderingContext2D, lt: number): void {
    caption(ctx, COPY[st.lang].proposal, 180, 150, 40, { at: 0.2, lt, out: 2.2, fill: '#FFD23F' });
  }
}

/** Thanh nghi ngờ đầy, bảo vệ chạy tới, núp kịp. */
export class DangerScene extends GameScene {
  dur = 4.6; song: SongName = 'night'; tod: Tod = 'night';
  intense: [number, number] = [0.9, 4.6];
  constructor() { super(7, { npcs: ['guard'] }); }
  protected setup(p: Play): void {
    p.setAlert(42);
    student(p, 0);
    const auntie = new Npc('auntie', p);
    auntie.a.x = 112; auntie.a.y = auntie.ty = LANES.far + 8; auntie.phase = 'tele'; auntie.t = 0.3;
    const photo = new Npc('photographer', p);
    photo.a.x = 300; photo.a.y = photo.ty = LANES.far + 14; photo.phase = 'tele'; photo.t = 1.5;
    p.npcs.push(auntie, photo);
    this.at(0.02, q => { const g = q.npcs.find(n => n.kind === 'guard'); if (g) { g.a.x = 250; g.tx = 60; } });
    this.at(1.0, q => q.addAlert(25, gameT('note.auntie')));
    this.at(2.0, q => q.key('Space', true));
    this.at(4.4, q => q.key('Space', false));
  }
  update(st: Studio, dt: number, lt: number): void {
    super.update(st, dt, lt);
    // rút ngắn thời gian bảo vệ lục bụi cây cho vừa nhịp video
    const g = this.p.npcs.find(n => n.kind === 'guard');
    if (g && g.phase === 'search' && g.t < 2) g.t = 2;
  }
  protected overlay(st: Studio, ctx: CanvasRenderingContext2D, lt: number): void {
    const c = COPY[st.lang];
    caption(ctx, c.danger, 180, 232, 36, { at: 0.15, lt, out: 1.95 });
    caption(ctx, c.hold, 232, 478, 30, { at: 2.0, lt, out: 4.3, fill: '#FF6FA8' });
    if (lt > 1.9 && lt < 4.3) ring(ctx, DUCK_BTN.x, DUCK_BTN.y, DUCK_BTN.r, lt);
  }
}

/** …hoặc không: bảo vệ tóm được. */
export class CaughtScene extends GameScene {
  dur = 4.8; song: SongName = 'night'; tod: Tod = 'night';
  intense: [number, number] = [0, 2.2];
  constructor() { super(7, { npcs: ['guard'] }); }
  protected setup(p: Play): void {
    p.setAlert(100);
    student(p, 1);
    this.at(0.02, q => { const g = q.npcs.find(n => n.kind === 'guard'); if (g) { g.a.x = 110; g.a.y = LANES.mid + 8; } });
  }
  update(st: Studio, dt: number, lt: number): void {
    super.update(st, dt, lt);
    this.cue(lt, 2.3, 'lose');
  }
  protected overlay(st: Studio, ctx: CanvasRenderingContext2D, lt: number): void {
    const c = COPY[st.lang];
    caption(ctx, c.orNot, 180, 232, 40, { at: 0.1, lt, out: 1.5, fill: '#FFD23F' });
    const k = clamp01((lt - 2.2) / 0.3);
    if (k <= 0) return;
    ctx.fillStyle = `rgba(42,26,18,${0.6 * k})`;
    ctx.fillRect(0, 0, 360, 640);
    const pk = pop(lt, 2.3);
    if (pk > 0) drawBig(ctx, st.big['front.shock'], 180, 500, 2.1 * pk);
    caption(ctx, c.caught, 180, 190, 66, { at: 2.25, lt, fill: '#FF6FA8' });
  }
}

/** 10 màn chơi, từ sáng tới đêm. */
export class LevelsScene extends Scene {
  dur = 5.0; song: SongName = 'night';
  update(_st: Studio, _dt: number, lt: number): void { for (let i = 0; i < 4; i++) this.cue(lt, 0.5 + i * 0.4, 'pop', `l${i}`); }
  draw(st: Studio, ctx: CanvasRenderingContext2D, lt: number): void {
    const c = COPY[st.lang];
    sunburst(ctx, 180, 340, lt, '#3B2E7E', '#4A3A96');
    caption(ctx, c.levels, 180, 92, 46, { at: 0.15, lt, fill: '#FFD23F' });
    const cards: [Tod, number, number, number, [string, string]][] = [
      ['morning', 95, 250, -4, ['studentM.lean', 'studentF.lean']],
      ['sunset', 265, 250, 3, ['confessionM.wait', 'confessionF.wait']],
      ['night', 95, 462, 3, ['proposalM.wait', 'proposalF.wait']],
      ['fireworks', 265, 462, -3, ['bossM.hug', 'bossF.hug']],
    ];
    cards.forEach(([tod, x, y, rot, pair], i) => {
      const k = pop(lt, 0.5 + i * 0.4);
      if (k <= 0) return;
      const w = 146, h = 190;
      ctx.save();
      ctx.translate(x, y); ctx.rotate((rot * Math.PI) / 180); ctx.scale(k, k);
      ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(-w / 2 + 5, -h / 2 + 5, w, h, 14); ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 14); ctx.clip();
      ctx.drawImage(st.bgs[tod], 0, 120, 360, 470, -w / 2, -h / 2, w, h * 1.0);
      const s = 0.62;
      drawSprite(ctx, pair[0], -15, h / 2 - 34, s);
      drawSprite(ctx, pair[1], 15, h / 2 - 34, s);
      ctx.restore();
      ctx.lineWidth = 3.5; ctx.strokeStyle = INK;
      ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 14); ctx.stroke();
      const lines = c.levelCards[i].split('\n');
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(-w / 2 + 10, -h / 2 + 8, w - 20, 38, 12); ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `800 14px ${FONT_DISPLAY}`; ctx.fillText(lines[0], 0, -h / 2 + 21);
      ctx.font = `700 10.5px ${FONT_UI}`; ctx.fillText(lines[1] ?? '', 0, -h / 2 + 36);
      ctx.restore();
    });
  }
}

/* ================= HỒI 5: BOSS ================= */

/** Giới thiệu boss. */
export class BossIntroScene extends Scene {
  dur = 3.2; song: SongName = 'boss';
  update(_st: Studio, _dt: number, lt: number): void { this.cue(lt, 0.15, 'shield'); this.cue(lt, 0.7, 'alert'); }
  draw(st: Studio, ctx: CanvasRenderingContext2D, lt: number): void {
    const c = COPY[st.lang];
    ctx.save();
    ctx.translate(180, 330); ctx.scale(1.35, 1.35); ctx.translate(-180, -300);
    ctx.drawImage(st.bgs.fireworks, 0, 0, 360, 640);
    ctx.restore();
    ctx.fillStyle = 'rgba(23,18,61,.45)'; ctx.fillRect(0, 0, 360, 640);
    fireworks(ctx, lt);
    const k = outBack(clamp01((lt - 0.2) / 0.5));
    const cx = 180, cy = 470;
    for (let L = 2; L >= 0; L--) {
      const R = [126, 104, 84][L] * k * (1 + Math.sin(lt * 6 + L) * 0.02);
      ctx.save(); ctx.globalAlpha = 0.9;
      ctx.fillStyle = ['#FF6FA8', '#B28DFF', '#FFD23F'][L] + '2A'; ctx.strokeStyle = ['#FF6FA8', '#B28DFF', '#FFD23F'][L]; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(cx, cy - 70, R, R * 0.92, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    if (k > 0) { drawBig(ctx, st.big['boss.m'], cx - 26 * k, cy, 2.0 * k); drawBig(ctx, st.big['boss.f'], cx + 26 * k, cy, 2.0 * k); }
    caption(ctx, c.bossIntro, 180, 118, 58, { at: 0.15, lt, fill: '#FF6FA8' });
    caption(ctx, c.bossName, 180, 182, st.lang === 'vi' ? 21 : 23, { at: 0.7, lt, rot: 0 });
  }
}

/** Đánh trọn 3 lớp lá chắn tới cảnh kết. */
export class BossFightScene extends GameScene {
  dur = 10.0; song: SongName = 'boss'; tod: Tod = 'fireworks';
  private layer = 0;
  constructor() { super(10, { npcs: [] }); }
  protected setup(p: Play): void {
    const b = p.boss!;
    b.hp = 1; b.cx = 150; b.dir = 1;
    this.layer = 0;
    const speed = () => [40, 30, 22][b.layer];
    const at = (who: () => { x: number; headY: () => number }) => () => {
      const a = who(), y = a.headY() + 30 * b.s;
      return { x: a.x + b.dir * speed() * flightTime(a.x, y), y };
    };
    this.throwAt(0.3, 0.8, at(() => b.m));
    this.throwAt(2.1, 2.6, at(() => (b.glow === 'm' ? b.m : b.f)));
    this.at(3.9, () => { b.slipperT = 99; });
    this.at(3.95, q => q.key('Space', true));
    this.at(4.9, q => q.key('Space', false));
    this.throwAt(5.3, 5.8, at(() => ({ x: b.cx, headY: () => b.m.headY() })));
  }
  update(st: Studio, dt: number, lt: number): void {
    super.update(st, dt, lt);
    const b: Boss = this.p.boss!;
    if (b.layer !== this.layer) {
      this.layer = b.layer;
      b.hp = 1;
      if (b.layer === 2) b.slipperT = 0.5;
    }
    if (b.defeated && lt > 7.4) this.cue(lt, 7.4, 'combo');
  }
  protected overlay(st: Studio, ctx: CanvasRenderingContext2D, lt: number): void {
    const c = COPY[st.lang];
    caption(ctx, c.shields, 180, 205, 36, { at: 0.1, lt, out: 1.3, fill: '#FFD23F' });
    if (this.p.boss!.defeated) caption(ctx, c.bossWin, 180, 200, st.lang === 'vi' ? 25 : 24, { at: 7.4, lt, fill: '#FFD23F', rot: -2 });
  }
}

/* ================= HỒI 6: KẾT ================= */

export class EndScene extends Scene {
  dur = 7.0;
  update(_st: Studio, _dt: number, lt: number): void {
    this.cue(lt, 0.12, 'win');
    for (let i = 0; i < 4; i++) this.cue(lt, 0.8 + i * 0.12, 'pop', `f${i}`);
    this.cue(lt, 1.3, 'pop', 'cta');
  }
  draw(st: Studio, ctx: CanvasRenderingContext2D, lt: number): void {
    const c = COPY[st.lang];
    sunburst(ctx, 180, 360, lt, '#FFC94D', '#FFE07A');
    caption(ctx, c.logo, 180, 132 + Math.sin(lt * 3) * 3, st.lang === 'vi' ? 60 : 72, { at: 0.12, lt, fill: '#FF6FA8', rot: -4, lineGap: 0.92 });
    const tk = pop(lt, 0.6);
    if (tk > 0) {
      ctx.save(); ctx.globalAlpha = clamp01(tk);
      ctx.font = `700 15px ${FONT_UI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeStyle = '#fff'; ctx.strokeText(c.tagline, 180, 226);
      ctx.fillStyle = INK; ctx.fillText(c.tagline, 180, 226);
      ctx.restore();
    }
    // các con số nổi bật
    ctx.font = `800 12.5px ${FONT_DISPLAY}`;
    const widths = c.features.map(f => ctx.measureText(f).width + 18), gap = 6;
    let x = 180 - (widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1)) / 2;
    c.features.forEach((f, i) => {
      const k = pop(lt, 0.8 + i * 0.12), w = widths[i], cx = x + w / 2;
      x += w + gap;
      if (k <= 0) return;
      ctx.save(); ctx.translate(cx, 256); ctx.scale(k, k);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(-w / 2, -12, w, 24, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(f, 0, 1);
      ctx.restore();
    });
    const pk = pop(lt, 0.4);
    if (pk > 0) drawBig(ctx, st.big['front.happy'], 180, 452, 1.6 * pk);
    const bounce = (i: number) => -Math.abs(Math.sin(lt * 4 + i * 1.3)) * 14;
    ([['normal', 62, 410, 0.8], ['gold', 298, 392, 0.7], ['rainbow', 82, 478, 0.6], ['bomb', 284, 474, 0.6]] as [Ammo, number, number, number][])
      .forEach(([a, px, py, s], i) => { const k = pop(lt, 0.55 + i * 0.1); if (k > 0) drawBig(ctx, st.big[`poop.${a}`], px, py + bounce(i), s * k); });
    const ck = pop(lt, 1.3);
    if (ck > 0) {
      const pulse = 1 + Math.sin(lt * 6) * 0.04;
      ctx.save(); ctx.translate(180, 498); ctx.scale(ck * pulse, ck * pulse);
      ctx.font = `800 22px ${FONT_DISPLAY}`;
      const w = ctx.measureText(c.cta).width + 64;
      ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(-w / 2 + 4, -21, w, 48, 24); ctx.fill();
      ctx.fillStyle = '#FF6FA8'; ctx.lineWidth = 3; ctx.strokeStyle = INK;
      ctx.beginPath(); ctx.roundRect(-w / 2, -25, w, 48, 24); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.lineWidth = 4.5; ctx.strokeText(c.cta, 0, 0); ctx.fillStyle = '#fff'; ctx.fillText(c.cta, 0, 0);
      ctx.restore();
      label(ctx, c.footer, 180, 540, 11.5, clamp01(ck));
    }
  }
}

function ring(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, lt: number): void {
  const k = (lt * 2) % 1;
  ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#FFD23F'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(x, y, r + 6 + k * 22, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
}
function fireworks(ctx: CanvasRenderingContext2D, t: number): void {
  const spots = [[60, 70, '#FFD23F'], [290, 60, '#FF6FA8'], [180, 120, '#8FD3FF'], [320, 200, '#B28DFF'], [40, 220, '#7BD35A']] as const;
  spots.forEach(([x, y, c], i) => {
    const k = (t * 0.7 + i * 0.23) % 1, r = 10 + k * 40;
    ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let j = 0; j < 12; j++) {
      const a = (j * Math.PI) / 6;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke();
    }
    ctx.restore();
  });
}

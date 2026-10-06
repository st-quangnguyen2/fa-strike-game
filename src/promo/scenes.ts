import { LANES } from '../config';
import type { Tod } from '../config';
import type { Ammo } from '../art/kit';
import { drawSprite } from '../art/sprites';
import type { Play } from '../game/play';
import type { Couple } from '../game/couple';
import { Dog } from '../game/npc';
import type { SongName } from '../core/music';
import { caption, sunburst, drawBig, pop, clamp01, outBack, outCubic, inOutCubic, lerp, INK, FONT_DISPLAY, FONT_SFX } from './kit';
import { Scene, GameScene, aimCouple, student, walker, standing, flightTime } from './stage';
import type { Studio } from './stage';
import { COPY } from './copy';

/* ================= HỒI 1: MỞ ĐẦU ================= */

/** Công viên toàn cặp đôi. */
class HookScene extends GameScene {
  dur = 4.0; song: SongName = 'menu'; tod: Tod = 'sunset';
  private c!: Couple;
  constructor() { super(1); this.hud = false; this.player = false; }
  protected setup(p: Play): void {
    this.c = student(p, 0); this.c.cycle = 0.3;
    walker(p, 'boba', 330, LANES.near + 4, -1);
    standing(p, 'selfie', 262, LANES.far + 6);
    for (let i = 0; i < 8; i++) this.at(0.2 + i * 0.5, q => q.fx.hearts(this.c.cx, this.c.y - 92 * this.c.s, 2));
  }
  protected camera(lt: number) { return { zoom: lerp(1.04, 1.18, inOutCubic(clamp01(lt / 4))), fx: 140, fy: 360 }; }
  protected overlay(st: Studio, ctx: CanvasRenderingContext2D, lt: number): void {
    caption(ctx, COPY[st.lang].hook, 180, 128, 34, { at: 0.35, lt, out: 3.9 });
  }
}

/** Kẻ phá đám ló ra từ bụi cây. */
class RevealScene extends Scene {
  dur = 3.0; song: SongName = 'menu';
  update(_st: Studio, _dt: number, lt: number): void { this.cue(lt, 0.18, 'pop'); this.cue(lt, 1.6, 'tick'); }
  draw(st: Studio, ctx: CanvasRenderingContext2D, lt: number): void {
    ctx.save();
    ctx.filter = 'blur(5px)';
    ctx.translate(180, 520); ctx.scale(1.9, 1.9); ctx.translate(-190, -560);
    ctx.drawImage(st.bgs.sunset, 0, 0, 360, 640);
    ctx.restore();
    ctx.filter = 'none';
    const y = lerp(800, 566, outBack(clamp01((lt - 0.15) / 0.45)));
    const aiming = lt > 1.6;
    ctx.save();
    ctx.translate(180, y);
    if (!aiming && Math.floor(lt / 0.35) % 2 === 1) ctx.scale(-1, 1);
    drawBig(ctx, st.big[aiming ? 'front.aim' : 'front.sneaky'], 0, 0, 2.5);
    ctx.restore();
    drawSprite(ctx, 'bushFG', 180, 690, 4.1);
    caption(ctx, COPY[st.lang].fa, 180, 140, 38, { at: 0.3, lt, fill: '#FFD23F' });
    if (aiming) sfxWord(ctx, COPY[st.lang].hehe, 292, 300, 30, pop(lt, 1.65), 0.2);
  }
}

/** Logo đập vào màn hình giữa mưa "cục". */
class TitleSlamScene extends Scene {
  dur = 4.5;
  update(_st: Studio, _dt: number, lt: number): void { this.cue(lt, 0.28, 'splat'); this.cue(lt, 1.0, 'combo'); }
  draw(st: Studio, ctx: CanvasRenderingContext2D, lt: number): void {
    const c = COPY[st.lang];
    const shake = lt > 0.25 && lt < 0.55 ? (1 - (lt - 0.25) / 0.3) * 6 : 0;
    ctx.save();
    ctx.translate(Math.sin(lt * 90) * shake, Math.cos(lt * 70) * shake);
    sunburst(ctx, 180, 260, lt, '#FF8A3D', '#FFA45C');
    const kinds: Ammo[] = ['normal', 'gold', 'rainbow', 'normal', 'bomb', 'magnet', 'normal', 'speed'];
    for (let i = 0; i < 18; i++) {
      const t0 = 0.05 + i * 0.13, k = lt - t0;
      if (k < 0) continue;
      const x = ((i * 61) % 330) + 15, y = -50 + k * (260 + (i % 4) * 40);
      if (y > 700) continue;
      drawBig(ctx, st.big[`poop.${kinds[i % kinds.length]}`], x, y, 0.42 + (i % 3) * 0.12, k * (i % 2 ? 3 : -3));
    }
    const k = clamp01((lt - 0.25) / 0.18);
    if (k > 0) {
      ctx.save();
      ctx.translate(180, 250);
      const s = lerp(2.4, 1, outCubic(k));
      ctx.scale(s, s);
      ctx.globalAlpha = k;
      caption(ctx, c.logo, 0, 0, st.lang === 'vi' ? 70 : 88, { at: -1, lt, fill: '#FFD23F', rot: -4, lineGap: 0.92 });
      ctx.restore();
    }
    const tk = pop(lt, 1.0);
    if (tk > 0) {
      ctx.save(); ctx.translate(180, 372); ctx.scale(tk, tk);
      ctx.font = `800 17px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.strokeText(c.slamTag, 0, 0);
      ctx.fillStyle = '#fff'; ctx.fillText(c.slamTag, 0, 0);
      ctx.restore();
    }
    const pk = outBack(clamp01((lt - 0.8) / 0.45));
    if (pk > 0) drawBig(ctx, st.big['front.happy'], 180, lerp(760, 600, pk), 1.5);
    ctx.restore();
  }
}

/* ================= HỒI 2: CÁCH CHƠI ================= */

/** Vũ khí bí mật: 6 loại Cục. */
class WeaponScene extends Scene {
  dur = 4.2;
  private readonly slots: [Ammo, number, number][] = [['gold', 52, 476], ['rainbow', 116, 508], ['bomb', 180, 520], ['magnet', 244, 508], ['speed', 308, 476]];
  update(_st: Studio, _dt: number, lt: number): void {
    this.cue(lt, 0.42, 'splat');
    this.slots.forEach((_, i) => this.cue(lt, 1.2 + i * 0.25, 'pop', `pop${i}`));
  }
  draw(st: Studio, ctx: CanvasRenderingContext2D, lt: number): void {
    sunburst(ctx, 180, 330, lt, '#FF6FA8', '#FF8FBF');
    const drop = outBack(clamp01((lt - 0.05) / 0.45));
    drawBig(ctx, st.big['poop.normal'], 180, lerp(-60, 360, drop), 2.4, Math.sin(lt * 9) * 0.08);
    caption(ctx, COPY[st.lang].weapon, 180, 122, 48, { at: 0.35, lt, fill: '#FFD23F' });
    this.slots.forEach(([a, x, y], i) => {
      const k = pop(lt, 1.2 + i * 0.25);
      if (k <= 0) return;
      drawBig(ctx, st.big[`poop.${a}`], x, y, 0.95 * k, Math.sin(lt * 7 + i) * 0.1);
      label(ctx, COPY[st.lang].ammo[i], x, y + 18, 14, clamp01(k));
    });
  }
}

/** Kéo, ném, SPLAT, Double Hit, Cục Vàng ở làn xa. */
class ThrowScene extends GameScene {
  dur = 6.0; tod: Tod = 'morning';
  constructor() { super(3); }
  protected setup(p: Play): void {
    const a = student(p, 1);
    const b = walker(p, 'boba', -30, LANES.mid + 18, 1);
    const c = standing(p, 'selfie', 96, LANES.far + 4);
    this.throwAt(0.25, 0.95, aimCouple(a, 'm', 1.1));
    this.throwAt(2.15, 2.8, aimCouple(b, 'center', 1.1));
    this.throwAt(3.85, 4.5, aimCouple(c, 'm', 1.1), 'gold');
  }
  protected overlay(st: Studio, ctx: CanvasRenderingContext2D, lt: number): void {
    const c = COPY[st.lang];
    caption(ctx, c.pull, 76, 168, 36, { at: 0.2, lt, out: 3.4, rot: -6 });
    caption(ctx, c.throw, 180, 176, 36, { at: 0.95, lt, out: 3.4, rot: 2 });
    caption(ctx, c.splat, 288, 166, 40, { at: 1.62, lt, out: 3.4, fill: '#FFD23F', rot: -4, font: FONT_SFX });
  }
}

/** Canh đúng khoảnh khắc tỏ tình. */
class TimingScene extends GameScene {
  dur = 5.0; tod: Tod = 'morning';
  private c!: Couple;
  constructor() { super(4); }
  protected setup(p: Play): void {
    this.c = standing(p, 'confession', 182, LANES.mid + 12);
    student(p, 0);
    this.at(0.05, () => { if (this.c.phase === 'wait') this.c.t = 1.6; });
    this.throwAt(1.15, 1.72, aimCouple(this.c, 'm', 1.2));
  }
  protected camera(lt: number) {
    const k = inOutCubic(clamp01(lt / 1.0)) * (1 - inOutCubic(clamp01((lt - 3.6) / 1.0)));
    return { zoom: 1 + 0.3 * k, fx: 182, fy: 300 };
  }
  protected overlay(st: Studio, ctx: CanvasRenderingContext2D, lt: number): void {
    caption(ctx, COPY[st.lang].timing, 180, 150, 40, { at: 0.2, lt, out: 2.2, fill: '#FFD23F' });
  }
}

/* ================= HỒI 3: ĐA DẠNG ================= */

/** Dàn 6 kiểu cặp đôi. */
class CastScene extends Scene {
  dur = 6.0; song: SongName = 'menu';
  update(_st: Studio, _dt: number, lt: number): void { for (let i = 0; i < 6; i++) this.cue(lt, 0.6 + i * 0.35, 'pop', `c${i}`); }
  draw(st: Studio, ctx: CanvasRenderingContext2D, lt: number): void {
    const c = COPY[st.lang];
    sunburst(ctx, 180, 330, lt, '#5BC0FF', '#7FD0FF');
    caption(ctx, c.cast, 180, 108, 40, { at: 0.2, lt, fill: '#FFD23F' });
    const xs = [66, 180, 294], ys = [330, 522];
    const pairs: [string, string, number][] = [
      ['studentM.lean', 'studentF.lean', 14], ['bobaM.idle', 'bobaF.idle', 16], ['selfieM.lean', 'selfieF.lean', 16],
      ['confessionM.wait', 'confessionF.wait', 18], ['proposalM.wait', 'proposalF.wait', 18], ['eldersM.idle', 'eldersF.idle', 16],
    ];
    pairs.forEach(([m, f, gap], i) => {
      const k = pop(lt, 0.6 + i * 0.35);
      if (k <= 0) return;
      const x = xs[i % 3], y = ys[Math.floor(i / 3)] + Math.sin(lt * 4 + i) * 2;
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
      if (i === 0) drawSprite(ctx, 'bench', 0, -2, 0.62);
      drawSprite(ctx, m, -gap, 0, 0.95);
      drawSprite(ctx, f, gap, 0, 0.95);
      ctx.restore();
      label(ctx, c.castNames[i], x, y + 16, 14, clamp01(k));
      if (i === 5) {
        const tk = pop(lt, 2.6);
        if (tk > 0) {
          ctx.save(); ctx.translate(x, y - 116); ctx.rotate(0.08); ctx.scale(tk, tk);
          ctx.font = `800 13px ${FONT_DISPLAY}`;
          const w = ctx.measureText(c.dontThrow).width + 18;
          ctx.fillStyle = '#E8484A'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.roundRect(-w / 2, -12, w, 24, 12); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.dontThrow, 0, 1);
          ctx.restore();
        }
      }
    });
  }
}

/** Ném liên tục 5 cú để lên combo ×2. */
class ComboScene extends GameScene {
  dur = 7.5; tod: Tod = 'sunset';
  constructor() { super(4); }
  protected setup(p: Play): void {
    const a = student(p, 0), b = student(p, 1);
    const e = standing(p, 'selfie', 180, LANES.mid + 12);
    const c = standing(p, 'selfie', 210, LANES.far + 4);
    const d = walker(p, 'boba', -30, LANES.near + 4, 1);
    this.throwAt(0.3, 0.75, aimCouple(a, 'm', 1.2));
    this.throwAt(1.3, 1.75, aimCouple(b, 'f', 1.2));
    this.throwAt(2.3, 2.75, aimCouple(e, 'm', 1.2));
    this.throwAt(3.3, 3.75, aimCouple(c, 'm', 1.2));
    this.throwAt(4.3, 4.8, aimCouple(d, 'center', 1.2));
  }
  protected overlay(st: Studio, ctx: CanvasRenderingContext2D, lt: number): void {
    caption(ctx, COPY[st.lang].combo, 180, 150, 34, { at: 0.2, lt, out: 4.9 });
  }
}

/** Cục Bom nổ trúng hai cặp một lúc. */
class BombScene extends GameScene {
  dur = 5.0; tod: Tod = 'sunset';
  constructor() { super(6); }
  protected setup(p: Play): void {
    const a = standing(p, 'selfie', 148, LANES.mid + 10);
    standing(p, 'selfie', 222, LANES.mid + 14);
    this.throwAt(0.45, 1.0, () => ({ x: 185, y: a.m.headY() + 26 * a.s }), 'bomb');
  }
  protected overlay(st: Studio, ctx: CanvasRenderingContext2D, lt: number): void {
    caption(ctx, COPY[st.lang].bomb, 180, 160, 36, { at: 0.15, lt, fill: '#FFD23F', out: 4.9 });
  }
}

/** Chó nhảy lên đớp mất cục. */
class DogScene extends GameScene {
  dur = 4.5; tod: Tod = 'sunset';
  constructor() { super(5); }
  protected setup(p: Play): void {
    student(p, 1);
    const dog = new Dog(1);
    dog.x = -40; dog.y = 440; dog.vx = 150; dog.vy = -8;
    p.dogs.push(dog);
    this.throwAt(0.55, 1.05, () => {
      const T = flightTime(dog.x, dog.y - 40);
      return { x: dog.x + dog.vx * T, y: dog.y + dog.vy * T - 40 * dog.s };
    });
  }
  protected overlay(st: Studio, ctx: CanvasRenderingContext2D, lt: number): void {
    caption(ctx, COPY[st.lang].dog, 180, 170, 34, { at: 1.65, lt, out: 4.4 });
  }
}

/** Lỡ tay ném trúng ông bà. */
class EldersScene extends GameScene {
  dur = 4.5; tod: Tod = 'sunset';
  constructor() { super(6); }
  protected setup(p: Play): void {
    p.score = 1200;
    const e = walker(p, 'elders', 118, LANES.near + 8, 1);
    this.throwAt(0.4, 0.95, aimCouple(e, 'm', 1));
  }
  protected overlay(st: Studio, ctx: CanvasRenderingContext2D, lt: number): void {
    caption(ctx, COPY[st.lang].elders, 180, 170, 36, { at: 1.7, lt, fill: '#FF6FA8' });
  }
}

/** Cặp đôi né rồi ném dép: lần đầu dính, lần sau núp kịp. */
class SlipperScene extends GameScene {
  dur = 6.6; tod: Tod = 'sunset';
  constructor() { super(5); }
  protected setup(p: Play): void {
    const c = standing(p, 'selfie', 190, LANES.mid + 12);
    student(p, 0);
    this.throwAt(0.3, 0.8, aimCouple(c, 'm', 1));
    this.at(1.05, () => c.dodge(1));
    this.throwAt(4.0, 4.45, aimCouple(c, 'm', 1));
    this.at(4.7, () => c.dodge(1));
    this.at(5.3, q => q.key('Space', true));
    this.at(6.45, q => q.key('Space', false));
  }
  protected overlay(st: Studio, ctx: CanvasRenderingContext2D, lt: number): void {
    const c = COPY[st.lang];
    caption(ctx, c.dodge, 180, 150, 36, { at: 0.95, lt, out: 3.8 });
    caption(ctx, c.slipper, 180, 200, 30, { at: 1.6, lt, out: 3.8, fill: '#FFD23F' });
    caption(ctx, c.duck, 230, 470, 34, { at: 5.3, lt, fill: '#FF6FA8' });
  }
}

export function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, alpha = 1): void {
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.font = `800 ${size}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.3; ctx.strokeStyle = INK; ctx.strokeText(text, x, y);
  ctx.fillStyle = '#fff'; ctx.fillText(text, x, y);
  ctx.restore();
}
export function sfxWord(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, k: number, rot = 0): void {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
  ctx.font = `${size}px ${FONT_SFX}`; ctx.textAlign = 'center'; ctx.lineWidth = size * 0.24; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  ctx.strokeText(text, 0, 0); ctx.fillStyle = '#FFFFFF'; ctx.fillText(text, 0, 0);
  ctx.restore();
}

export { HookScene, RevealScene, TitleSlamScene, WeaponScene, ThrowScene, TimingScene, CastScene, ComboScene, BombScene, DogScene, EldersScene, SlipperScene };

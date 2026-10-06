import type { Ammo } from '../art/kit';
import {
  W, LANES, GROUND_TOP, LAKE, BENCHES, THROW_ORIGIN, AIM, SCORE, PENALTY, ALERT, AMMO_INFO,
  DUCK_BTN, AMMO_SLOTS, PAUSE_BTN, CAT_BTN, comboMult, depthScale, ammoForLevel,
} from '../config';
import type { SkinId } from '../skins';
import { CatPet } from './pet';
import type { LevelDef, NpcKind, CoupleKind, InnocentKind } from '../config';
import { rand, pick, chance, clamp, circleRect, dist, fmt } from '../core/util';
import { sfx } from '../core/audio';
import { music } from '../core/music';
import { t } from '../i18n';
import { FxLayer } from './fx';
import { Couple } from './couple';
import { Npc, Dog } from './npc';
import { Boss } from './boss';
import { Projectile, Slipper } from './projectile';
import type { Actor } from './actor';
import type { World, GroundPoop } from './types';
import { renderPlay } from './render';
import type { RenderOpts } from './render';

export type EndReason = 'win' | 'timeup' | 'caught';
export interface EndResult {
  reason: EndReason; level: number; score: number; broken: number; goal: number; maxCombo: number;
  timeBonus: number; eldersBonus: number; total: number; boss: boolean;
}

interface Aim { id: number; sx: number; sy: number; cx: number; cy: number }
/** Đồ người chơi mang vào màn: skin và Mèo Ghen Tị. */
export interface Loadout { skin: SkinId; cat: boolean }
type Hit = { kind: 'couple'; c: Couple; a: Actor; y: number } | { kind: 'npc'; n: Npc; y: number }
  | { kind: 'elders'; c: Couple; a: Actor; y: number } | { kind: 'bench'; y: number };

export class Play implements World {
  time = 0;
  timeLeft: number;
  fx = new FxLayer();
  alert = 0;
  groundPoops: GroundPoop[] = [];
  score = 0; combo = 0; maxCombo = 0; broken = 0; throws = 0;
  ammoList: Ammo[];
  stock: Record<Ammo, number>;
  sel: Ammo = 'normal';
  couples: Couple[] = [];
  npcs: Npc[] = [];
  dogs: Dog[] = [];
  projectiles: Projectile[] = [];
  slippers: Slipper[] = [];
  boss: Boss | null = null;
  pet: CatPet | null = null;
  catUsed = false;
  readonly skin: SkinId;
  readonly catOwned: boolean;
  player = { duck: 0, stun: 0, throwAnim: 0, cooldown: 0, caught: false, warn: 0 };
  aim: Aim | null = null;
  private duckPointer: number | null = null;
  private keyDuck = false;
  private coupleCd = 0.4;
  private timers: Partial<Record<NpcKind, number>> = {};
  eldersSeen = false; eldersHit = false;
  private proposalSpawned = false;
  ended: EndReason | null = null;
  private endDelay = 0;
  paused = false;
  readonly hasGuard: boolean;

  constructor(public def: LevelDef, private onEnd: (r: EndResult) => void, private onPause: () => void, private toast: (title: string, body?: string) => void,
    loadout: Loadout = { skin: 'hoodie', cat: false }) {
    this.skin = loadout.skin;
    this.catOwned = loadout.cat;
    this.timeLeft = def.time;
    this.hasGuard = def.npcs.includes('guard');
    this.ammoList = ammoForLevel(def.n);
    this.stock = Object.fromEntries(this.ammoList.map(a => [a, AMMO_INFO[a].stock])) as Record<Ammo, number>;
    const first: Record<NpcKind, number> = { passerby: 3, guard: 0, auntie: 4, kid: 6, photographer: 8, dog: 7, elders: 10 };
    for (const k of def.npcs) this.timers[k] = first[k];
    if (def.boss) this.boss = new Boss(this);
  }

  /* ---------------- World ---------------- */
  get ducking(): boolean { return !this.player.caught && this.player.stun <= 0 && (this.duckPointer !== null || this.keyDuck); }
  playerExposed(): boolean { return this.player.duck < 0.6; }
  guardPos(): { x: number; y: number } | null {
    const g = this.npcs.find(n => n.kind === 'guard');
    return g ? { x: g.a.x, y: g.a.y } : null;
  }
  addAlert(n: number, label: string): void {
    if (!this.hasGuard || this.ended) return;
    this.alert = clamp(this.alert + n, 0, 100);
    this.note(`${label} +${n}`);
    sfx.play('alert');
  }
  setAlert(v: number): void { this.alert = clamp(v, 0, 100); }
  private noteSlot = 0;
  private noteAt = 0;
  /** Dòng chữ đỏ nhỏ dưới thanh nghi ngờ; các dòng gần nhau được xếp so le để không đè lên nhau. */
  private note(text: string): void {
    if (this.time - this.noteAt > 1.2) this.noteSlot = 0;
    this.noteAt = this.time;
    this.fx.float(W / 2, 126 + (this.noteSlot++ % 3) * 18, text, '#E8484A', 12, '"Be Vietnam Pro", system-ui, sans-serif', 1.6);
  }
  /** Chọn vị trí đứng trên làn y sao cho xa các cặp đôi và ghế đá đang có. */
  freeX(y: number): number {
    const taken = this.couples.filter(c => Math.abs(c.y - y) < 40 && c.phase !== 'walk').map(c => c.kind === 'student' ? c.cx : (c.phase === 'enter' ? c.targetX : c.cx));
    for (const b of BENCHES) if (Math.abs(b.y - y) < 40) taken.push(b.x);
    for (const n of this.npcs) if (Math.abs(n.a.y - y) < 40 && n.kind !== 'passerby') taken.push(n.a.x);
    let best = rand(70, 290), bestD = -1;
    for (let i = 0; i < 10; i++) {
      const x = rand(60, 300), d = Math.min(999, ...taken.map(t => Math.abs(t - x)));
      if (d > bestD) { best = x; bestD = d; }
    }
    return best;
  }
  throwSlipper(x: number, y: number): void {
    this.slippers.push(new Slipper(x, y));
    this.player.warn = 0.9;
    sfx.play('swoosh');
  }
  caught(): void {
    if (this.ended || this.player.caught) return;
    this.player.caught = true;
    this.aim = null;
    sfx.play('whistle');
    this.fx.burst(this.player_x(), 520, t('fx.caught'), 46, '#E8484A', 18);
    this.finish('caught', 1.8);
  }
  spawnCompanion(cx: number, y: number, owner: object): void {
    if (!this.def.npcs.includes('photographer')) return;
    const x = cx + (cx < W / 2 ? 80 : -80);
    this.npcs.push(new Npc('photographer', this, { x: x < W / 2 ? -30 : W + 30, y: y + 6, owner: owner as Couple }));
  }
  private player_x(): number { return 190; }

  /** Ninja núp nhanh hơn 30%. */
  private get duckRate(): number { return this.skin === 'ninja' ? 1.3 : 1; }
  /** Phần đường bay được vẽ trước; Ông Chú FA thấy dài hơn 10%. */
  get predict(): number { return AIM.predict + (this.skin === 'uncle' ? 0.1 : 0); }
  get showCat(): boolean { return this.catOwned && this.hasGuard; }
  get catReady(): boolean {
    return this.showCat && !this.catUsed && !this.ended && !this.player.caught && this.npcs.some(n => n.kind === 'guard');
  }
  useCat(): void {
    if (!this.catReady) return;
    const g = this.npcs.find(n => n.kind === 'guard')!;
    this.catUsed = true;
    this.pet = new CatPet(g, this);
    sfx.play('swoosh');
  }

  /* ---------------- input ---------------- */
  pointerDown(id: number, x: number, y: number): void {
    if (this.ended) return;
    sfx.unlock();
    if (dist(x, y, PAUSE_BTN.x, PAUSE_BTN.y) < PAUSE_BTN.r + 8) { this.onPause(); return; }
    if (this.showCat && dist(x, y, CAT_BTN.x, CAT_BTN.y) < CAT_BTN.r + 6) { this.useCat(); return; }
    if (this.showDuck && dist(x, y, DUCK_BTN.x, DUCK_BTN.y) < DUCK_BTN.r + 6) { this.duckPointer = id; this.aim = null; sfx.play('duck'); return; }
    if (this.ammoList.length > 1) {
      const i = this.ammoList.findIndex((_, i) => dist(x, y, AMMO_SLOTS.x, AMMO_SLOTS.y0 - i * AMMO_SLOTS.gap) < AMMO_SLOTS.r + 5);
      if (i >= 0) { this.selectAmmo(this.ammoList[i]); return; }
    }
    if (this.aim === null && y > 90 && !this.ducking) this.aim = { id, sx: x, sy: y, cx: x, cy: y };
  }
  pointerMove(id: number, x: number, y: number): void {
    if (this.aim && this.aim.id === id) { this.aim.cx = x; this.aim.cy = y; }
  }
  pointerUp(id: number): void {
    if (this.duckPointer === id) this.duckPointer = null;
    if (this.aim && this.aim.id === id) {
      const tgt = this.aimTarget();
      if (tgt && this.player.cooldown <= 0 && !this.ducking && this.player.stun <= 0) this.throwAt(tgt.x, tgt.y);
      this.aim = null;
    }
  }
  pointerCancel(id: number): void {
    if (this.duckPointer === id) this.duckPointer = null;
    if (this.aim?.id === id) this.aim = null;
  }
  key(code: string, down: boolean): void {
    if (code === 'Space') { if (down && !this.keyDuck) sfx.play('duck'); this.keyDuck = down; if (down) this.aim = null; }
    if (!down) return;
    if (code === 'Escape' || code === 'KeyP') this.onPause();
    if (code === 'KeyC') this.useCat();
    const n = Number(code.replace('Digit', ''));
    if (n >= 1 && n <= this.ammoList.length) this.selectAmmo(this.ammoList[n - 1]);
  }
  releaseAll(): void { this.duckPointer = null; this.keyDuck = false; this.aim = null; }
  get showDuck(): boolean { return this.hasGuard || this.def.counter === true; }

  private selectAmmo(a: Ammo): void {
    if (this.stock[a] > 0) { this.sel = a; sfx.play('tick'); }
  }

  /** Điểm rơi tính từ cú kéo ngược. null nếu kéo quá ngắn. */
  aimTarget(): { x: number; y: number; pull: number } | null {
    const a = this.aim;
    if (!a) return null;
    let dx = a.sx - a.cx, dy = a.sy - a.cy;
    const pull = Math.hypot(dx, dy);
    if (pull < AIM.minPull) return null;
    if (pull > AIM.maxPull) { dx *= AIM.maxPull / pull; dy *= AIM.maxPull / pull; }
    return { x: clamp(THROW_ORIGIN.x + dx * AIM.pull, -10, W + 10), y: clamp(THROW_ORIGIN.y + dy * AIM.pull, 150, 575), pull };
  }

  private throwAt(tx: number, ty: number): void {
    const ammo = this.sel;
    if (ammo === 'magnet') {
      let best: { x: number; y: number; d: number } | null = null;
      for (const c of this.couples) if (c.targetable && !c.innocent) for (const m of c.members) {
        const hx = m.x, hy = m.headY() + 18 * m.s, d = dist(tx, ty, hx, hy);
        if (d < 80 && (!best || d < best.d)) best = { x: hx, y: hy, d };
      }
      if (best) { tx += (best.x - tx) * 0.75; ty += (best.y - ty) * 0.75; }
    }
    this.projectiles.push(new Projectile(ammo, tx, ty));
    this.throws++;
    this.player.throwAnim = 0.25;
    this.player.cooldown = AIM.cooldown;
    sfx.play('throw');
    if (ammo !== 'normal') {
      this.stock[ammo]--;
      if (this.stock[ammo] <= 0) this.sel = 'normal';
    }
    if (ammo === 'gold') this.addAlert(ALERT.gold, t('note.gold'));
    if (this.npcs.some(n => n.suspicious && n.phase === 'sus')) this.addAlert(ALERT.suspiciousThrow, t('note.watching'));
  }

  /* ---------------- update ---------------- */
  update(dt: number): void {
    if (this.paused) return;
    this.time += dt;
    this.fx.update(dt);
    const p = this.player;
    p.duck = clamp(p.duck + (this.ducking ? 7 : -6) * this.duckRate * dt, 0, 1);
    p.stun = Math.max(0, p.stun - dt);
    p.throwAnim = Math.max(0, p.throwAnim - dt);
    p.cooldown = Math.max(0, p.cooldown - dt);
    p.warn = Math.max(0, p.warn - dt);
    if (this.ducking) this.alert = Math.max(0, this.alert - ALERT.duckDecay * dt);

    if (!this.ended) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) { this.timeLeft = 0; this.finish('timeup', 0.6); this.toast(t('toast.timeup')); sfx.play('lose'); }
      this.spawn(dt);
    } else {
      this.endDelay -= dt;
      if (this.endDelay <= 0 && this.endDelay > -100) { this.endDelay = -1000; this.onEnd(this.result()); }
    }

    for (const c of this.couples) c.update(dt);
    for (const n of this.npcs) n.update(dt);
    for (const d of this.dogs) d.update(dt);
    this.boss?.update(dt);
    if (this.pet) { this.pet.update(dt); if (this.pet.gone) this.pet = null; }
    for (const g of this.groundPoops) g.life -= dt;
    this.groundPoops = this.groundPoops.filter(g => g.life > 0);

    for (const pr of this.projectiles) this.updateProjectile(pr, dt);
    for (const s of this.slippers) {
      const r = s.update(dt, this.playerExposed() && !p.caught);
      if (r === 'hit') {
        p.stun = 1.5; this.aim = null; this.loseCombo();
        this.fx.burst(190, 548, 'BONK!', 30, '#5BC0FF', 16); this.fx.stars(190, 548, 6);
        sfx.play('bonk');
      } else if (r === 'miss') { this.fx.float(190, 540, t('fx.slipperMiss'), '#3E9E48', 16); sfx.play('swoosh'); }
    }
    this.projectiles = this.projectiles.filter(x => !x.done);
    this.slippers = this.slippers.filter(x => !x.done);
    this.couples = this.couples.filter(c => !c.done);
    this.npcs = this.npcs.filter(n => !n.gone);
    this.dogs = this.dogs.filter(d => !d.gone);

    if (!this.ended && !this.def.boss && this.broken >= this.def.goal) { this.finish('win', 1.1); sfx.play('win'); this.toast(t('toast.win')); }
    if (!this.ended && this.boss?.defeated) { this.finish('win', 3.2); sfx.play('win'); }
  }

  private finish(reason: EndReason, delay: number): void {
    if (this.ended) return;
    this.ended = reason; this.endDelay = delay; this.aim = null;
    music.stop(0.8);
  }

  result(): EndResult {
    const win = this.ended === 'win';
    const timeBonus = win ? Math.ceil(this.timeLeft) * SCORE.timeBonus : 0;
    const eldersBonus = win && this.eldersSeen && !this.eldersHit ? SCORE.eldersBonus : 0;
    return { reason: this.ended!, level: this.def.n, score: this.score, broken: this.broken, goal: this.def.goal, maxCombo: this.maxCombo,
      timeBonus, eldersBonus, total: this.score + timeBonus + eldersBonus, boss: !!this.def.boss };
  }

  /* ---------------- spawn ---------------- */
  private spawn(dt: number): void {
    const def = this.def;
    if (!def.boss) {
      const active = this.couples.filter(c => !c.innocent && c.targetable).length;
      if (active < def.couples) {
        this.coupleCd -= dt;
        if (this.coupleCd <= 0) { this.spawnCouple(); this.coupleCd = rand(0.8, 1.8); }
      }
    }
    for (const k of def.npcs) {
      const t = (this.timers[k] ?? 0) - dt;
      this.timers[k] = t;
      if (t > 0) continue;
      const count = k === 'elders' ? this.couples.filter(c => c.innocent).length
        : k === 'dog' ? this.dogs.length
        : this.npcs.filter(n => n.kind === k && !n.owner).length;
      const max = k === 'passerby' ? 2 : 1;
      if (count >= max) { this.timers[k] = 1; continue; }
      if (k === 'dog') { this.dogs.push(new Dog(def.speed)); this.timers[k] = rand(9, 14); }
      else if (k === 'elders') { this.couples.push(new Couple('elders', this)); this.eldersSeen = true; this.timers[k] = rand(14, 20); }
      else { const n = new Npc(k, this); if (k === 'auntie') n.tx = this.freeX(n.ty); this.npcs.push(n); this.timers[k] = k === 'guard' ? 2 : k === 'passerby' ? rand(5, 9) : rand(6, 11); }
    }
  }

  private spawnCouple(): void {
    const used = new Set(this.couples.map(c => c.bench));
    const free = BENCHES.map((b, i) => ({ ...b, i })).filter(b => !used.has(b.i));
    const W8: Record<CoupleKind, number> = { student: 3, boba: 3, selfie: 2, confession: 2, proposal: 1.2 };
    const options = this.def.pool.filter(k =>
      (k !== 'student' || free.length > 0) &&
      (k !== 'proposal' || (!this.proposalSpawned && this.time > 12)) &&
      (k !== 'confession' || this.couples.filter(c => c.kind === 'confession').length < 2));
    if (!options.length) return;
    let r = Math.random() * options.reduce((s, k) => s + W8[k], 0), kind = options[0];
    for (const k of options) { r -= W8[k]; if (r <= 0) { kind = k; break; } }
    if (kind === 'proposal') this.proposalSpawned = true;
    const c = new Couple(kind, this, kind === 'student' ? { bench: pick(free) } : {});
    if (c.phase === 'enter') c.targetX = this.freeX(c.y);
    this.couples.push(c);
  }

  /* ---------------- va chạm ---------------- */
  private updateProjectile(pr: Projectile, dt: number): void {
    pr.update(dt);
    const { x, y } = pr.at(pr.t);
    if (pr.t > 0.25 && pr.t < 0.95) {
      for (const d of this.dogs) if (d.tryCatch(x, y)) {
        pr.done = true;
        this.fx.burst(d.x, d.y - 70 * d.s, 'CHOMP!', 26, '#FFD23F', 13);
        this.fx.float(d.x, d.y - 100 * d.s, t('fx.dog'), '#5B4A40', 13, '"Be Vietnam Pro", system-ui, sans-serif');
        sfx.play('chomp');
        return;
      }
    }
    if (!pr.dodgeChecked && pr.t >= 0.45) {
      pr.dodgeChecked = true;
      if (this.def.counter && pr.ammo !== 'speed' && !this.boss) {
        const c = this.couples.filter(c => c.targetable && !c.innocent && c.members.some(m => circleRect(pr.tx, pr.ty, 10, m.box())))
          .sort((a, b) => b.y - a.y)[0];
        if (c && c.canDodge() && chance(0.25)) c.dodge(pr.tx < c.cx ? 1 : -1);
      }
    }
    if (pr.t >= 1) { pr.done = true; this.impact(pr); }
  }

  private impact(pr: Projectile): void {
    const ix = pr.tx, iy = pr.ty, ds = depthScale(iy);
    const bomb = pr.ammo === 'bomb';
    const r = bomb ? 58 : 10 * ds;
    if (bomb) { this.fx.burst(ix, iy - 20, t('fx.boom'), 56, '#FF8A3D', 22); this.fx.shake = 6; }
    if (this.boss) { this.impactBoss(pr, ix, iy, r); return; }

    const cand: Hit[] = [];
    for (const c of this.couples) {
      if (!c.targetable) continue;
      for (const a of c.members) if (circleRect(ix, iy, r, a.box())) cand.push({ kind: c.innocent ? 'elders' : 'couple', c, a, y: c.y });
    }
    for (const n of this.npcs) if (n.hittable && circleRect(ix, iy, r, n.a.box())) cand.push({ kind: 'npc', n, y: n.a.y });
    for (const b of BENCHES) {
      const s = depthScale(b.y);
      if (circleRect(ix, iy, r * 0.5, { x: b.x - 66 * s, y: b.y - 60 * s, w: 132 * s, h: 58 * s })) cand.push({ kind: 'bench', y: b.y - 1 });
    }
    cand.sort((a, b) => b.y - a.y);

    let hits: Hit[];
    if (bomb) hits = cand;
    else if (pr.ammo === 'rainbow') hits = cand.slice(0, cand[0]?.kind === 'bench' ? 1 : 2);
    else hits = cand.slice(0, 1);

    // Double Hit: vùng văng chạm luôn người kia
    const first = hits[0];
    if (first && (first.kind === 'couple' || first.kind === 'elders')) {
      const other = first.c.m === first.a ? first.c.f : first.c.m;
      if (!hits.some(h => 'a' in h && h.a === other) && circleRect(ix, iy, 16 * ds, other.box())) hits.push({ ...first, a: other });
    }

    if (!hits.length) { this.miss(ix, iy, pr); return; }

    const byCouple = new Map<Couple, Actor[]>();
    for (const h of hits) if (h.kind === 'couple' || h.kind === 'elders') byCouple.set(h.c, [...(byCouple.get(h.c) ?? []), h.a]);
    for (const [c, members] of byCouple) {
      if (c.innocent) this.hitInnocent('elders', ix, iy, () => { c.onHit(members, false); this.eldersHit = true; });
      else this.hitCouple(c, members, ix, iy, pr.ammo);
    }
    for (const h of hits) if (h.kind === 'npc') this.hitInnocent(h.n.kind as InnocentKind, h.n.a.x, h.n.a.headY(), () => h.n.onHit());
    if (hits.length && hits.every(h => h.kind === 'bench')) {
      this.fx.burst(ix, iy, 'BONK!', 26, '#FFFFFF', 15); this.fx.stars(ix, iy, 5, 0.5);
      sfx.play('bonk'); this.loseCombo();
    }
  }

  private hitCouple(c: Couple, members: Actor[], ix: number, iy: number, ammo: Ammo): void {
    const moment = c.isMoment;
    const double = members.length >= 2;
    const base = moment ? (c.kind === 'proposal' ? SCORE.proposal : SCORE.breakup) : double ? SCORE.double : SCORE.hit;
    const far = c.y < LANES.mid - 30 ? SCORE.farBonus : 0;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const pts = (base + far) * comboMult(this.combo) * (ammo === 'gold' ? 2 : 1);
    this.score += pts;
    this.broken++;
    c.onHit(members, moment);
    this.fx.burst(ix, iy - 4, 'SPLAT!', 28 + (double ? 6 : 0), '#FFD23F', 15);
    this.fx.float(ix, iy - 46, `+${fmt(pts)}`, moment ? '#FF4D7E' : '#3E9E48', moment ? 26 : 20);
    sfx.play('splat');
    if (moment) { this.toast(t(c.kind === 'proposal' ? 'toast.proposal' : 'toast.breakup'), t('toast.perfect')); sfx.play('breakup'); this.fx.shake = 5; }
    else if (double) this.fx.float(ix, iy - 72, t('fx.double'), '#FF6FA8', 17);
    if (far && !moment) this.fx.float(ix + 30, iy - 20, t('fx.far'), '#FFFFFF', 12);
    if (this.combo === 5 || this.combo === 10) { this.toast(t('toast.combo', { m: comboMult(this.combo) }), t('toast.comboBody', { n: this.combo })); sfx.play('combo'); }
  }

  private hitInnocent(kind: InnocentKind, x: number, y: number, apply: () => void): void {
    const p = PENALTY[kind];
    this.score = Math.max(0, this.score + p.pts);
    apply();
    this.loseCombo();
    this.fx.burst(x, y, kind === 'guard' ? 'POONG!' : 'BONK!', 26, kind === 'guard' ? '#FF6FA8' : '#FFFFFF', 14);
    this.fx.float(x, y - 36, `${p.pts}`, '#E8484A', 20);
    sfx.play('penalty');
    if (kind === 'guard') { this.setAlert(100); this.note(t('note.hitGuard')); }
    else this.addAlert(p.alert, t(kind === 'elders' ? 'note.hitElders' : 'note.hitInnocent'));
  }

  private miss(ix: number, iy: number, pr: Projectile): void {
    this.loseCombo();
    const inLake = ((ix - LAKE.x) / LAKE.rx) ** 2 + ((iy - LAKE.y) / LAKE.ry) ** 2 <= 1;
    if (inLake) {
      this.fx.burst(ix, iy - 8, 'BLOOP!', 24, '#8FD3FF', 13);
      this.fx.sprite('duck', ix + 14, iy - 4, 0.8, 0, -8, 1.6);
      sfx.play('bloop');
    } else if (iy < GROUND_TOP + 6) {
      this.fx.stars(ix, iy, 4, 0.4);
      sfx.play('bonk');
    } else {
      this.fx.burst(ix, iy - 6, 'PLOP!', 20, '#FFFFFF', 12);
      if (pr.ammo !== 'bomb') this.groundPoops.push({ x: ix, y: iy, life: 5, claimed: false });
      sfx.play('pop');
    }
  }

  private loseCombo(): void {
    if (this.combo >= 3) this.fx.float(W / 2, 140, t('fx.comboLost'), '#5B4A40', 14, '"Be Vietnam Pro", system-ui, sans-serif');
    this.combo = 0;
  }

  private impactBoss(pr: Projectile, ix: number, iy: number, r: number): void {
    const b = this.boss!;
    if (!b.shieldHit(ix, iy, r) || b.defeated) { this.miss(ix, iy, pr); return; }
    let members = b.membersHit(ix, iy, r);
    if (members.length === 1) { const o = members[0] === b.m ? b.f : b.m; if (circleRect(ix, iy, 16 * b.s, o.box())) members = [b.m, b.f]; }
    if (pr.ammo === 'bomb' || pr.ammo === 'rainbow') members = members.length ? (b.hugging > 0 || pr.ammo === 'bomb' ? [b.m, b.f] : members) : members;
    const res = b.onHit(members);
    const c = b.shieldCenter;
    if (res.kind === 'bounce' || res.kind === 'need-double') {
      this.loseCombo();
      this.fx.burst(ix, iy, t('fx.bounce'), 24, '#B28DFF', 13);
      this.fx.float(c.x, c.y - 70, t(res.kind === 'bounce' ? 'fx.hitGlowing' : 'fx.waitHug'), '#FFFFFF', 12, '"Be Vietnam Pro", system-ui, sans-serif', 1.6);
      this.fx.sprite('poop.sad', ix, iy, 0.3, (190 - ix) * 0.8, 260, 0.9, 5, 300);
      sfx.play('bonk');
      return;
    }
    this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
    const mult = comboMult(this.combo) * (pr.ammo === 'gold' ? 2 : 1);
    const pts = (res.kind === 'crack' ? 100 : res.kind === 'break' ? 600 : 3600) * mult;
    this.score += pts;
    this.fx.burst(ix, iy, res.kind === 'crack' ? 'CRACK!' : t('fx.shatter'), res.kind === 'crack' ? 26 : 40, Boss.COLORS[res.layer], 15);
    this.fx.float(ix, iy - 46, `+${fmt(pts)}`, '#3E9E48', 20);
    this.fx.ring(c.x, c.y, 40, 120, Boss.COLORS[res.layer], 0.5);
    sfx.play(res.kind === 'crack' ? 'splat' : 'shield');
    if (res.kind === 'break') { this.toast(t('toast.shield', { n: res.layer + 1 }), t(res.layer === 0 ? 'toast.shield2' : 'toast.shield3')); this.fx.shake = 6; }
    if (res.kind === 'defeat') { this.broken = 1; this.toast(t('toast.bossWin'), t('toast.bossWinBody')); this.fx.shake = 8; this.fx.hearts(c.x, c.y, 10); }
  }

  /* ---------------- vẽ ---------------- */
  render(ctx: CanvasRenderingContext2D, bg: HTMLCanvasElement | null, opts?: RenderOpts): void { renderPlay(this, ctx, bg, opts); }
}

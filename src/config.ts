import type { Ammo } from './art/kit';

/** Thế giới logic 9:16. Mọi tọa độ gameplay dùng đơn vị này, canvas tự scale theo màn hình. */
export const W = 360;
export const H = 640;
export const GROUND_TOP = 186;
export const LANES = { far: 236, mid: 338, near: 482 } as const;
export type Lane = keyof typeof LANES;

/** Tỉ lệ nhân vật theo chiều sâu: làn xa 45%, làn gần 85%. */
export function depthScale(y: number): number {
  const t = (y - LANES.far) / (LANES.near - LANES.far);
  return 0.45 + Math.max(-0.15, Math.min(1.25, t)) * 0.4;
}

export const PLAYER = { x: 190, y: 614, s: 1.25, duckDrop: 64 };
export const THROW_ORIGIN = { x: 232, y: 574 };
export const DUCK_BTN = { x: 316, y: 594, r: 34 };
export const AMMO_SLOTS = { x: 30, y0: 614, gap: 44, r: 19 };
export const PAUSE_BTN = { x: 336, y: 102, r: 16 };
export const LAKE = { x: 74, y: 210, rx: 92, ry: 16 };
export const BENCHES = [{ x: 96, y: LANES.mid + 4 }, { x: 262, y: LANES.mid - 2 }];

export const AIM = { pull: 2.9, maxPull: 150, minPull: 16, predict: 0.4, cooldown: 0.42 };

export const SCORE = { hit: 100, double: 300, breakup: 1000, proposal: 1500, farBonus: 50, timeBonus: 20, eldersBonus: 200 };
export const COMBO_STEPS: [number, number][] = [[10, 3], [5, 2]];
export function comboMult(combo: number): number {
  for (const [need, m] of COMBO_STEPS) if (combo >= need) return m;
  return 1;
}

export type InnocentKind = 'elders' | 'kid' | 'auntie' | 'photographer' | 'passerby' | 'guard';
export const PENALTY: Record<InnocentKind, { pts: number; alert: number }> = {
  elders: { pts: -200, alert: 30 },
  kid: { pts: -50, alert: 30 },
  auntie: { pts: -50, alert: 60 },
  photographer: { pts: -50, alert: 35 },
  passerby: { pts: -50, alert: 10 },
  guard: { pts: -50, alert: 100 },
};

export const ALERT = {
  photographer: 35, auntie: 40, selfie: 15, kid: 20, gold: 10, suspiciousThrow: 25,
  duckDecay: 8, suspicious: 60, chase: 100, escapeTo: 50, searchTime: 3,
};

export const AMMO_INFO: Record<Ammo, { name: string; stock: number; unlock: number }> = {
  normal: { name: 'Cục Thường', stock: Infinity, unlock: 1 },
  gold: { name: 'Cục Vàng', stock: 3, unlock: 3 },
  rainbow: { name: 'Cục Cầu Vồng', stock: 2, unlock: 5 },
  bomb: { name: 'Cục Bom', stock: 1, unlock: 6 },
  magnet: { name: 'Cục Nam Châm', stock: 3, unlock: 7 },
  speed: { name: 'Cục Siêu Tốc', stock: 3, unlock: 8 },
};
export const AMMO_ORDER: Ammo[] = ['normal', 'gold', 'rainbow', 'bomb', 'magnet', 'speed'];

export type CoupleKind = 'student' | 'boba' | 'selfie' | 'confession' | 'proposal';
export type NpcKind = 'passerby' | 'guard' | 'auntie' | 'kid' | 'photographer' | 'dog' | 'elders';
export type Tod = 'morning' | 'sunset' | 'night' | 'fireworks';
export type NewsKey = 'student' | 'boba' | 'passerby' | 'guard' | 'duck' | 'slipper' | 'gold' | 'confession' | 'auntie' | 'dog'
  | 'selfie' | 'rainbow' | 'kid' | 'elders' | 'bomb' | 'photographer' | 'magnet' | 'proposal' | 'speed' | 'all' | 'boss';

export interface LevelDef {
  n: number; couples: number; speed: number; goal: number; time: number; tod: Tod;
  pool: CoupleKind[]; npcs: NpcKind[];
  /** Khóa trong từ điển i18n: news.<khóa> */
  news: NewsKey[];
  reticle?: boolean; counter?: boolean; boss?: boolean;
}

export const LEVELS: LevelDef[] = [
  { n: 1, couples: 2, speed: 1.0, goal: 4, time: 60, tod: 'morning', pool: ['student'], npcs: [], reticle: true,
    news: ['student'] },
  { n: 2, couples: 3, speed: 1.0, goal: 5, time: 65, tod: 'morning', pool: ['student', 'boba'], npcs: ['passerby'], reticle: true,
    news: ['boba', 'passerby'] },
  { n: 3, couples: 3, speed: 1.1, goal: 6, time: 70, tod: 'morning', pool: ['student', 'boba'], npcs: ['passerby', 'guard'], counter: true,
    news: ['guard', 'duck', 'slipper', 'gold'] },
  { n: 4, couples: 4, speed: 1.2, goal: 6, time: 70, tod: 'sunset', pool: ['student', 'boba', 'confession'], npcs: ['passerby', 'guard', 'auntie'], counter: true,
    news: ['confession', 'auntie'] },
  { n: 5, couples: 4, speed: 1.3, goal: 7, time: 70, tod: 'sunset', pool: ['student', 'boba', 'confession', 'selfie'], npcs: ['passerby', 'guard', 'auntie', 'dog'], counter: true,
    news: ['dog', 'selfie', 'rainbow'] },
  { n: 6, couples: 5, speed: 1.4, goal: 7, time: 75, tod: 'sunset', pool: ['student', 'boba', 'confession', 'selfie'], npcs: ['passerby', 'guard', 'auntie', 'dog', 'kid', 'elders'], counter: true,
    news: ['kid', 'elders', 'bomb'] },
  { n: 7, couples: 5, speed: 1.5, goal: 8, time: 75, tod: 'night', pool: ['student', 'boba', 'confession', 'selfie'], npcs: ['passerby', 'guard', 'auntie', 'dog', 'kid', 'elders', 'photographer'], counter: true,
    news: ['photographer', 'magnet'] },
  { n: 8, couples: 6, speed: 1.6, goal: 8, time: 80, tod: 'night', pool: ['student', 'boba', 'confession', 'selfie', 'proposal'], npcs: ['passerby', 'guard', 'auntie', 'dog', 'kid', 'elders', 'photographer'], counter: true,
    news: ['proposal', 'speed'] },
  { n: 9, couples: 6, speed: 1.7, goal: 10, time: 85, tod: 'night', pool: ['student', 'boba', 'confession', 'selfie', 'proposal'], npcs: ['passerby', 'guard', 'auntie', 'dog', 'kid', 'elders', 'photographer'], counter: true,
    news: ['all'] },
  { n: 10, couples: 0, speed: 1.0, goal: 1, time: 90, tod: 'fireworks', pool: [], npcs: ['guard'], counter: true, boss: true,
    news: ['boss'] },
];

export function ammoForLevel(n: number): Ammo[] {
  return AMMO_ORDER.filter(a => AMMO_INFO[a].unlock <= Math.min(n, 9));
}

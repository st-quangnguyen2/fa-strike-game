import { person, poop, dog, bench, bush, tree, lamp, blob, sparkle, heart, playerBack, slipper, splatMask, brokenHeart, duck, prop as propSvg, INK } from './kit';
import type { PersonOpts, Ammo, BackPose, Pt } from './kit';
import { W, H, LAKE } from '../config';
import type { Tod } from '../config';

/** Mật độ điểm ảnh của sprite so với đơn vị logic. 3 đủ nét trên màn hình retina khi phóng 0.85×; video quảng bá dùng cao hơn. */
const DEFAULT_RES = 3;
const PERSON_BOX: [number, number, number, number] = [-50, -130, 100, 140];

export interface Sprite { img: HTMLCanvasElement; bx: number; by: number; bw: number; bh: number }
const cache = new Map<string, Sprite>();

/* ---------- định nghĩa nhân vật: một bộ trang phục gốc + các trạng thái ---------- */
const MUST = `<path d="M-10,-55 Q-5,-60 0,-56 Q5,-60 10,-55 Q5,-51 0,-53.5 Q-5,-51 -10,-55 Z" fill="${INK}"/>`;
const CHEEKS = { l: [-19, -53] as Pt, r: [19, -53] as Pt };
const STAND = { l: [-21, -24] as Pt, r: [21, -24] as Pt };
const RUN = { l: [-25, -38] as Pt, r: [25, -38] as Pt };
type CharDef = { base: PersonOpts; states: Record<string, PersonOpts> };

export const CHARS: Record<string, CharDef> = {
  studentM: { base: { pose: 'sit', hair: '#2B1B12', top: '#5BC0FF', bottom: '#34497A', hands: { l: [-20, -22], r: [-2, -22] } },
    states: { idle: {}, lean: { tilt: 9, face: 'closed' }, hit: { face: 'shock' }, leave: { pose: 'stand', face: 'flat', hands: STAND } } },
  studentF: { base: { pose: 'sit', style: 'long', hair: '#5A3418', top: '#FF6FA8', bottom: '#6B5BD6', skin: '#F2C08F', hands: { l: [2, -22], r: [20, -22] } },
    states: { idle: {}, lean: { tilt: -9, face: 'closed' }, hit: { face: 'shock' }, leave: { pose: 'stand', face: 'angry', hands: STAND } } },
  bobaM: { base: { style: 'spiky', hair: '#2B1B12', top: '#7BD35A', bottom: '#3A3A4A', skin: '#D9A06B', face: 'love', prop: 'boba', propHand: 'l', hands: { l: [-22, -32], r: [22, -26] } },
    states: { idle: {}, hit: { face: 'shock' }, leave: { face: 'cry', prop: null, hands: STAND } } },
  bobaF: { base: { style: 'pony', hair: '#3B2416', top: '#FFD23F', lower: 'skirt', bottom: '#FF6FA8', face: 'love', prop: 'boba', hands: { l: [-22, -26], r: [22, -32] } },
    states: { idle: {}, hit: { face: 'shock' }, leave: { face: 'angry', prop: null, hands: STAND } } },
  selfieM: { base: { hair: '#2B1B12', top: '#38C3B5', bottom: '#3A5BA0', face: 'happy' },
    states: { idle: {}, lean: { tilt: 10 }, hit: { face: 'shock' }, leave: { face: 'flat' } } },
  selfieF: { base: { style: 'bun', hair: '#4A2A16', top: '#B28DFF', bottom: '#2F3B55', skin: '#F2C08F', prop: 'phone', hands: { l: [-20, -26], r: [22, -34] } },
    states: { idle: {}, lean: { face: 'happy', tilt: -4, hands: { l: [-20, -26], r: [30, -86] } }, hit: { face: 'shock' }, leave: { face: 'angry', prop: null, hands: STAND } } },
  confessionM: { base: { hair: '#2B1B12', top: '#FFFFFF', bottom: '#34497A', prop: 'rose', hands: { l: [-21, -24], r: [21, -30] } },
    states: { idle: {}, wait: { pose: 'kneel', face: 'closed', hands: { l: [-20, -26], r: [20, -38] } }, hit: { pose: 'kneel', face: 'shock', prop: null, hands: { l: [-20, -26], r: [20, -38] } },
      leave: { face: 'cry', prop: null, hands: STAND }, happy: { face: 'love', prop: null, hands: RUN } } },
  confessionF: { base: { style: 'long', hair: '#2B1B12', top: '#FF9EC4', lower: 'skirt', bottom: '#FFFFFF', skin: '#F2C08F' },
    states: { idle: {}, wait: { face: 'surprised', hands: CHEEKS }, hit: { face: 'shock', hands: CHEEKS }, leave: { face: 'angry' }, happy: { face: 'love', hands: RUN } } },
  proposalM: { base: { hair: '#1E140E', top: '#2F3B55', bottom: '#2F3B55', skin: '#D9A06B', prop: 'ring', hands: { l: [-21, -24], r: [21, -30] } },
    states: { idle: {}, wait: { pose: 'kneel', hands: { l: [-20, -26], r: [20, -40] } }, hit: { pose: 'kneel', face: 'shock', prop: null, hands: { l: [-20, -26], r: [20, -40] } },
      leave: { face: 'cry', prop: null, hands: STAND }, happy: { face: 'love', prop: null, hands: RUN } } },
  proposalF: { base: { style: 'bun', hair: '#2B1B12', top: '#FFFFFF', lower: 'skirt', bottom: '#FFFFFF' },
    states: { idle: {}, wait: { face: 'love', hands: CHEEKS }, hit: { face: 'shock', hands: CHEEKS }, leave: { face: 'angry' }, happy: { face: 'love', hands: RUN } } },
  eldersM: { base: { style: 'grandpa', skin: '#F2C08F', top: '#8BB7A0', bottom: '#6B5B4B', face: 'closed', prop: 'cane', propHand: 'l', hands: { l: [-22, -26], r: [22, -28] } },
    states: { idle: {}, hit: { face: 'angry' } } },
  eldersF: { base: { style: 'grandma', hair: '#C9C9D1', top: '#C77DBA', lower: 'skirt', bottom: '#7A4E8A', face: 'closed', hands: { l: [-22, -28], r: [21, -24] } },
    states: { idle: {}, hit: { face: 'shock' } } },
  guard: { base: { style: 'cap', hair: '#2B1B12', top: '#3456A3', bottom: '#22305E', face: 'flat', blush: false, headExtra: MUST,
      extra: `<path d="M-8,-46 Q0,-34 8,-46" fill="none" stroke="#FFD23F" stroke-width="2.4"/><rect x="-16" y="-25" width="32" height="5" fill="#1A2A55"/>` + sparkle(-7, -36, 5, '#FFD23F') },
    states: { idle: {}, sus: { face: 'nosy' }, chase: { face: 'angry', hands: RUN }, hit: { face: 'shock', hands: RUN }, win: { face: 'happy', hands: { l: [-22, -26], r: [26, -70] } } } },
  auntie: { base: { style: 'curlers', hair: '#6B3A5A', top: '#FF6FA8', lower: 'skirt', bottom: '#8A5CC9', skin: '#F2C08F', prop: 'fan', hands: { l: [-21, -26], r: [22, -48] },
      extra: `<circle cx="-8" cy="-38" r="2.4" fill="#fff"/><circle cx="6" cy="-32" r="2.4" fill="#fff"/><circle cx="-2" cy="-26" r="2.4" fill="#fff"/>` },
    states: { idle: {}, scan: { face: 'nosy' }, walk: { face: 'angry', hands: RUN }, hit: { face: 'shock', prop: null, hands: RUN } } },
  kid: { base: { style: 'kidcap', hair: '#2B1B12', top: '#FFD23F', lower: 'shorts', bottom: '#3A5BA0', skin: '#D9A06B', face: 'happy' },
    states: { idle: { hands: RUN }, carry: { prop: 'poop', hands: { l: [-21, -26], r: [26, -40] } }, hit: { face: 'cry', hands: RUN } } },
  photographer: { base: { hair: '#4A2E1A', top: '#B9A16B', bottom: '#4A4A55', extra: `<path d="M-12,-45 L12,-22" stroke="#3A3A4A" stroke-width="3"/>`, prop: 'camera', hands: { l: [-21, -24], r: [21, -22] } },
    states: { idle: {}, shoot: { prop: null, hands: { l: [-15, -58], r: [16, -58] }, over: '' }, hit: { face: 'shock', prop: null, hands: RUN } } },
  passerby: { base: { hair: '#2B1B12', top: '#38C3B5', bottom: '#4A4A55', face: 'flat', skin: '#F2C08F', hands: { l: [-23, -28], r: [21, -22] },
      headExtra: `<path d="M-26,-62 C-28,-94 28,-94 26,-62" fill="none" stroke="${INK}" stroke-width="4"/><rect x="-31" y="-68" width="9" height="14" rx="4" fill="#E8484A" stroke="${INK}" stroke-width="2.4"/><rect x="22" y="-68" width="9" height="14" rx="4" fill="#E8484A" stroke="${INK}" stroke-width="2.4"/>` },
    states: { idle: {}, hit: { face: 'shock', hands: RUN } } },
  bossM: { base: { hair: '#2B1B12', top: '#E8484A', bottom: '#2F3B55', face: 'love', hands: { l: [-20, -26], r: [20, -42] } },
    states: { idle: { hands: STAND }, hug: { tilt: 12 }, hit: { face: 'shock', hands: RUN }, laugh: { face: 'happy', tilt: 12 } } },
  bossF: { base: { style: 'long', hair: '#5A3418', top: '#FFFFFF', lower: 'skirt', bottom: '#E8484A', skin: '#F2C08F', face: 'love', hands: { l: [-20, -42], r: [20, -26] } },
    states: { idle: { hands: STAND }, hug: { tilt: -12 }, hit: { face: 'shock', hands: RUN }, laugh: { face: 'happy', tilt: -12 } } },
};
// Máy ảnh đưa lên mặt khi chụp (vẽ sau tay).
CHARS.photographer.states.shoot.over = propSvg('camera', 0, -61);

export function spriteDefs(): Record<string, { svg: string; box: [number, number, number, number] }> {
  const defs: Record<string, { svg: string; box: [number, number, number, number] }> = {};
  for (const [name, c] of Object.entries(CHARS)) {
    for (const [st, o] of Object.entries(c.states)) {
      const merged: PersonOpts = { ...c.base, ...o, hands: o.hands ?? c.base.hands };
      defs[`${name}.${st}`] = { svg: person(merged), box: PERSON_BOX };
    }
  }
  for (const pose of ['idle', 'aim', 'throw', 'stun'] as BackPose[]) defs[`player.${pose}`] = { svg: playerBack(pose), box: [-50, -120, 100, 125] };
  for (const a of ['normal', 'gold', 'rainbow', 'bomb', 'magnet', 'speed'] as Ammo[]) defs[`poop.${a}`] = { svg: poop(a), box: [-40, -72, 80, 80] };
  defs['poop.sad'] = { svg: poop('normal', { mood: 'sad' }), box: [-40, -72, 80, 80] };
  defs['dog.run'] = { svg: dog(), box: [-45, -60, 100, 65] };
  defs['dog.jump'] = { svg: dog({ jump: true }), box: [-45, -60, 100, 65] };
  defs['dog.catch'] = { svg: dog({ catching: true, jump: true }), box: [-45, -60, 100, 65] };
  defs['bench'] = { svg: bench(132), box: [-72, -62, 144, 66] };
  defs['bushFG'] = { svg: bush(0, 0, 1), box: [-60, -54, 120, 60] };
  defs['slipper'] = { svg: slipper(), box: [-16, -26, 32, 52] };
  defs['splat'] = { svg: splatMask(), box: [-30, -26, 60, 54] };
  defs['heart'] = { svg: heart(0, 0, 24), box: [-16, -16, 32, 28] };
  defs['heartPale'] = { svg: heart(0, 0, 24, '#FF9EC4'), box: [-16, -16, 32, 28] };
  defs['brokenHeart'] = { svg: brokenHeart(), box: [-22, -18, 44, 32] };
  defs['duck'] = { svg: duck(), box: [-20, -22, 50, 34] };
  defs['sparkle'] = { svg: sparkle(0, 0, 10, '#FFE27A'), box: [-12, -12, 24, 24] };
  return defs;
}

export async function rasterize(svg: string, box: [number, number, number, number], res: number): Promise<HTMLCanvasElement> {
  const [bx, by, bw, bh] = box;
  const pw = Math.ceil(bw * res), ph = Math.ceil(bh * res);
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bx} ${by} ${bw} ${bh}" width="${pw}" height="${ph}">${svg}</svg>`;
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(doc);
  await img.decode();
  const c = document.createElement('canvas');
  c.width = pw; c.height = ph;
  c.getContext('2d')!.drawImage(img, 0, 0, pw, ph);
  return c;
}

export async function loadSprites(onProgress?: (p: number) => void, res = DEFAULT_RES): Promise<void> {
  const defs = Object.entries(spriteDefs());
  let done = 0;
  await Promise.all(defs.map(async ([key, d]) => {
    const img = await rasterize(d.svg, d.box, res);
    cache.set(key, { img, bx: d.box[0], by: d.box[1], bw: d.box[2], bh: d.box[3] });
    onProgress?.(++done / defs.length);
  }));
}

export function hasSprite(key: string): boolean { return cache.has(key); }

/** Vẽ sprite với gốc (chân) tại (x,y), tỉ lệ s. flip = quay mặt sang trái. */
export function drawSprite(ctx: CanvasRenderingContext2D, key: string, x: number, y: number, s = 1, flip = false, rot = 0, alpha = 1): void {
  const sp = cache.get(key);
  if (!sp) return;
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(flip ? -s : s, s);
  if (alpha < 1) ctx.globalAlpha *= alpha;
  ctx.drawImage(sp.img, sp.bx, sp.by, sp.bw, sp.bh);
  ctx.restore();
}

/** SVG cho DOM (màn hình menu): người chơi nhìn thẳng với biểu cảm. */
export function playerFrontSvg(faceKind: 'sneaky' | 'shock' | 'dizzy' | 'happy' | 'aim'): string {
  const hands = faceKind === 'shock' ? { l: [-27, -72] as Pt, r: [27, -72] as Pt } : faceKind === 'aim' ? { l: [-26, -44] as Pt, r: [26, -60] as Pt } : faceKind === 'happy' ? { l: [-26, -70] as Pt, r: [26, -70] as Pt } : { l: [-9, -34] as Pt, r: [9, -34] as Pt };
  return person({ style: 'hood', hair: '#2B1B12', top: '#FF8A3D', bottom: '#4A4A55', face: faceKind, blush: false, hands, prop: faceKind === 'aim' ? 'poop' : null,
    extra: `<path d="M-5,-43 L-5,-33 M5,-43 L5,-33" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M-10,-26 L10,-26" stroke="#E36A1E" stroke-width="3" stroke-linecap="round"/>` });
}
export { poop as poopSvg };

/* ---------- nền công viên theo giờ trong ngày ---------- */
const TOD: Record<Tod, { sky: string[]; grass: [string, string]; path: string; leaf: string; lake: string; night: boolean }> = {
  morning: { sky: ['#7FD0FF', '#CDEFFF'], grass: ['#8ED66A', '#5DB84C'], path: '#F3D9A4', leaf: '#3FA34D', lake: '#6EC6FF', night: false },
  sunset: { sky: ['#FF9E5E', '#FFC98A', '#FFE7BD'], grass: ['#8ED66A', '#5DB84C'], path: '#F3D9A4', leaf: '#3FA34D', lake: '#7FB8F0', night: false },
  night: { sky: ['#2E3283', '#6C5FC9'], grass: ['#5BA454', '#3B8040'], path: '#CDB78E', leaf: '#2F7F3E', lake: '#4A6FC0', night: true },
  fireworks: { sky: ['#17123D', '#5A2A72'], grass: ['#4C8F48', '#2F6234'], path: '#B9A47E', leaf: '#2A6E37', lake: '#3B5AA8', night: true },
};
export function backgroundSvg(tod: Tod): string {
  const t = TOD[tod];
  const stops = t.sky.map((c, i) => `<stop offset="${i / (t.sky.length - 1)}" stop-color="${c}"/>`).join('');
  const celestial = tod === 'morning' ? `<circle cx="300" cy="86" r="26" fill="#FFE27A" stroke="#FFC23D" stroke-width="3"/>`
    : tod === 'sunset' ? `<circle cx="290" cy="156" r="34" fill="#FFE27A" stroke="#FFB347" stroke-width="3"/>`
    : `<circle cx="296" cy="110" r="20" fill="#FFF4C9"/><circle cx="306" cy="104" r="17" fill="${t.sky[0]}"/>`;
  const clouds = t.night
    ? Array.from({ length: 22 }, (_, i) => `<circle cx="${(i * 97) % 350 + 6}" cy="${(i * 53) % 150 + 14}" r="${i % 3 === 0 ? 1.8 : 1.1}" fill="#FFF8D6"/>`).join('')
    : `<g opacity=".92">${blob([[60, 120, 16], [80, 112, 20], [102, 120, 15]], '#FFFFFF', 1.5, 'rgba(42,26,18,.35)')}${blob([[200, 90, 12], [216, 84, 16], [234, 90, 12]], '#FFFFFF', 1.5, 'rgba(42,26,18,.35)')}</g>`;
  const lanterns = t.night
    ? `<path d="M0,206 Q90,232 180,206 Q270,232 360,206" fill="none" stroke="${INK}" stroke-width="1.5"/>` +
      [30, 75, 120, 165, 210, 255, 300, 340].map((x, i) => `<ellipse cx="${x}" cy="${213 + Math.sin(i * 1.3) * 5}" rx="6" ry="7.5" fill="${i % 2 ? '#FF6FA8' : '#FFD23F'}" stroke="${INK}" stroke-width="1.5"/>`).join('')
    : '';
  return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient>
    <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.grass[0]}"/><stop offset="1" stop-color="${t.grass[1]}"/></linearGradient></defs>
    <rect width="${W}" height="200" fill="url(#sky)"/>${celestial}${clouds}
    <rect y="186" width="${W}" height="${H - 186}" fill="url(#grass)"/>
    ${tree(10, 194, 0.7, t.leaf)}${tree(334, 198, 0.78, t.leaf)}${tree(196, 190, 0.55, t.leaf)}${tree(140, 192, 0.45, t.leaf)}
    <ellipse cx="${LAKE.x}" cy="${LAKE.y}" rx="${LAKE.rx}" ry="${LAKE.ry}" fill="${t.lake}" stroke="${INK}" stroke-width="2.5"/>
    <path d="M34,${LAKE.y - 2} L62,${LAKE.y - 2} M92,${LAKE.y + 6} L120,${LAKE.y + 6}" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>
    <path d="M0,302 C120,286 240,318 360,292 L360,348 C240,372 120,342 0,358 Z" fill="${t.path}" stroke="rgba(42,26,18,.3)" stroke-width="2"/>
    <g opacity=".5">${blob([[16, 410, 10], [30, 404, 12], [44, 410, 9]], '#4FB548', 1.5)}${blob([[320, 420, 9], [334, 414, 12], [348, 420, 10]], '#4FB548', 1.5)}</g>
    ${lamp(180, 296, 0.62, t.night)}${lamp(352, 452, 0.85, t.night)}
    ${lanterns}`;
}
export async function renderBackground(tod: Tod, pxPerUnit: number): Promise<HTMLCanvasElement> {
  return rasterize(backgroundSvg(tod), [0, 0, W, H], pxPerUnit);
}

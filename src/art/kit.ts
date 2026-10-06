/**
 * Art kit: mọi nhân vật được vẽ bằng SVG string, cùng tỉ lệ với bản concept (docs/concept-review.html).
 * Gốc tọa độ = giữa hai bàn chân, đầu bán kính 24, người cao ~95 đơn vị.
 * Không dùng <text> trong SVG vì SVG-as-image không tải được web font; chữ vẽ bằng canvas.
 */
export const INK = '#2A1A12';
const S = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const S2 = `stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
/** Viền mực với độ dày tùy chỉnh (XML không cho lặp lại thuộc tính stroke-width). */
const sw = (w: number) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

export type Face =
  | 'smile' | 'happy' | 'closed' | 'love' | 'sneaky' | 'aim' | 'flat'
  | 'shock' | 'surprised' | 'angry' | 'dizzy' | 'nosy' | 'cry';
export type HairStyle =
  | 'short' | 'long' | 'bun' | 'pony' | 'spiky' | 'grandpa' | 'grandma'
  | 'curlers' | 'cap' | 'kidcap' | 'hood' | 'combover' | 'none';
export type Prop = 'boba' | 'phone' | 'rose' | 'ring' | 'camera' | 'fan' | 'cane' | 'icecream' | 'poop' | null;
export type Pt = [number, number];

export interface PersonOpts {
  skin?: string; hair?: string; style?: HairStyle; top?: string; bottom?: string;
  face?: Face; blush?: boolean; pose?: 'stand' | 'sit' | 'kneel'; lower?: 'pants' | 'skirt' | 'shorts';
  hands?: { l?: Pt; r?: Pt }; prop?: Prop; propHand?: 'l' | 'r'; tilt?: number;
  extra?: string; headExtra?: string; over?: string; x?: number; y?: number; s?: number;
  /** Vẽ sau cùng phía sau cơ thể (áo choàng). */
  back?: string;
  /** Vẽ trên mặt nhưng dưới mắt/miệng (mặt nạ siêu anh hùng). */
  faceUnder?: string;
  /** Màu tay khi khác màu áo (áo ba lỗ, áo ngắn tay). */
  armColor?: string;
}

export function heart(cx: number, cy: number, s: number, fill = '#FF4D7E'): string {
  const k = s / 24;
  return `<path transform="translate(${cx} ${cy}) scale(${k})" d="M0,8 C-14,-2 -12,-13 -5,-13 C-1.5,-13 0,-10 0,-9 C0,-10 1.5,-13 5,-13 C12,-13 14,-2 0,8 Z" fill="${fill}" stroke="${INK}" stroke-width="${2.4 / k}" stroke-linejoin="round"/>`;
}
export function sparkle(cx: number, cy: number, r: number, fill = '#FFF6B0'): string {
  const c = r * 0.18;
  return `<path d="M${cx},${cy - r} Q${cx + c},${cy - c} ${cx + r},${cy} Q${cx + c},${cy + c} ${cx},${cy + r} Q${cx - c},${cy + c} ${cx - r},${cy} Q${cx - c},${cy - c} ${cx},${cy - r} Z" fill="${fill}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`;
}
/** Nhiều hình tròn chồng nhau nhưng chỉ có một viền ngoài (bụi cây, tán lá, mây). */
export function blob(circles: [number, number, number][], fill: string, sw = 3, ink = INK): string {
  return circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${ink}" stroke="${ink}" stroke-width="${sw * 2}"/>`).join('') +
    circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');
}

/* ---------- mặt (tâm đầu ở (0,-64)) ---------- */
const eyeDot = (x: number) => `<ellipse cx="${x}" cy="-62" rx="2.9" ry="3.7" fill="${INK}"/><circle cx="${x + 1}" cy="-63.3" r="1" fill="#fff"/>`;
export function face(t: Face): string {
  const smile = `<path d="M-5,-54 Q0,-50 5,-54" fill="none" ${S2}/>`;
  const openSmile = `<path d="M-6,-55 Q0,-46 6,-55 Z" fill="#B3263E" ${S2}/>`;
  switch (t) {
    case 'happy': return `<path d="M-13,-61 Q-9,-67 -5,-61 M5,-61 Q9,-67 13,-61" fill="none" ${S}/>` + openSmile;
    case 'closed': return `<path d="M-13,-63 Q-9,-59 -5,-63 M5,-63 Q9,-59 13,-63" fill="none" ${S}/>` + smile;
    case 'love': return heart(-9, -61, 12) + heart(9, -61, 12) + openSmile;
    case 'sneaky': return `<path d="M-15,-70 L-5,-68 M5,-71 L15,-73" fill="none" ${S}/><path d="M-14,-63 L-4,-63 M4,-63 L14,-63" fill="none" ${sw(3.4)}/><circle cx="-6" cy="-60.6" r="2.4" fill="${INK}"/><circle cx="12" cy="-60.6" r="2.4" fill="${INK}"/><path d="M-6,-52 Q2,-50 8,-56" fill="none" ${S}/>`;
    case 'aim': return `<path d="M-15,-71 L-4,-66 M15,-71 L4,-66" fill="none" ${S}/><path d="M-14,-62 Q-9,-59 -4,-62" fill="none" ${S}/><circle cx="9" cy="-62" r="4.6" fill="#fff" ${S2}/><circle cx="9.5" cy="-62" r="2.2" fill="${INK}"/><path d="M-8,-55 L8,-55 Q6,-48 0,-48 Q-6,-48 -8,-55 Z" fill="#fff" ${S2}/>`;
    case 'flat': return `<circle cx="-9" cy="-62" r="2.2" fill="${INK}"/><circle cx="9" cy="-62" r="2.2" fill="${INK}"/><path d="M-5,-52 L5,-52" ${S}/>`;
    case 'shock': return `<path d="M-15,-74 Q-9,-77 -4,-74 M4,-74 Q9,-77 15,-74" fill="none" ${S2}/><circle cx="-9" cy="-63" r="6" fill="#fff" ${S2}/><circle cx="9" cy="-63" r="6" fill="#fff" ${S2}/><circle cx="-9" cy="-62" r="2" fill="${INK}"/><circle cx="9" cy="-62" r="2" fill="${INK}"/><ellipse cx="0" cy="-50" rx="4.5" ry="5.5" fill="#B3263E" ${S2}/><path d="M21,-80 Q25,-73 21,-70 Q17,-73 21,-80 Z" fill="#8FD3FF" ${S2}/>`;
    case 'surprised': return `<circle cx="-9" cy="-63" r="5.5" fill="#fff" ${S2}/><circle cx="9" cy="-63" r="5.5" fill="#fff" ${S2}/><circle cx="-8.5" cy="-62.5" r="2.6" fill="${INK}"/><circle cx="9.5" cy="-62.5" r="2.6" fill="${INK}"/><ellipse cx="0" cy="-51.5" rx="3" ry="3.6" fill="#B3263E" ${S2}/>`;
    case 'angry': return `<path d="M-15,-72 L-4,-66 M15,-72 L4,-66" fill="none" ${sw(3.6)}/>` + eyeDot(-9) + eyeDot(9) + `<path d="M-6,-49 Q0,-55 6,-49" fill="none" ${S}/>`;
    case 'dizzy': return `<path d="M-12,-66 L-6,-59 M-6,-66 L-12,-59 M6,-66 L12,-59 M12,-66 L6,-59" ${S}/><path d="M-7,-52 Q-3.5,-56 0,-52 Q3.5,-48 7,-52" fill="none" ${S}/>`;
    case 'nosy': return `<path d="M-15,-73 Q-9,-77 -4,-73 M4,-73 Q9,-77 15,-73" fill="none" ${S2}/><ellipse cx="-9" cy="-62" rx="5.5" ry="4.5" fill="#fff" ${S2}/><ellipse cx="9" cy="-62" rx="5.5" ry="4.5" fill="#fff" ${S2}/><circle cx="-6" cy="-62" r="2.3" fill="${INK}"/><circle cx="12" cy="-62" r="2.3" fill="${INK}"/><path d="M-14,-64.5 L-4,-64.5 M4,-64.5 L14,-64.5" ${S2}/><ellipse cx="2" cy="-51" rx="3" ry="3.4" fill="#B3263E" ${S2}/>`;
    case 'cry': return `<path d="M-13,-63 Q-9,-59 -5,-63 M5,-63 Q9,-59 13,-63" fill="none" ${S}/><path d="M-10,-59 Q-13,-50 -10,-46 M10,-59 Q13,-50 10,-46" fill="none" stroke="#5BC0FF" stroke-width="3.4" stroke-linecap="round"/><path d="M-7,-48 Q0,-58 7,-48 Z" fill="#B3263E" ${S2}/>`;
    default: return eyeDot(-9) + eyeDot(9) + smile;
  }
}

/* ---------- tóc / mũ ---------- */
const GLASSES = `<g fill="rgba(255,255,255,.35)" ${S2}><circle cx="-9" cy="-62" r="6.5"/><circle cx="9" cy="-62" r="6.5"/></g><path d="M-2.5,-62 L2.5,-62" ${S2}/>`;
function hairBack(st: HairStyle, c: string, top: string): string {
  switch (st) {
    case 'long': return `<path d="M-26,-66 C-29,-40 -24,-33 -12,-33 L12,-33 C24,-33 29,-40 26,-66 Z" fill="${c}" ${S}/>`;
    case 'bun': case 'grandma': return `<circle cx="0" cy="-91" r="10" fill="${c}" ${S}/>`;
    case 'pony': return `<path d="M18,-76 C42,-74 40,-44 27,-38 C30,-52 26,-62 18,-66 Z" fill="${c}" ${S}/>`;
    case 'hood': return `<circle cx="0" cy="-63" r="31" fill="${top}" ${S}/><circle cx="0" cy="-61" r="26" fill="rgba(0,0,0,.2)"/>`;
    default: return '';
  }
}
function hairFront(st: HairStyle, c: string, top: string): string {
  const short = `<path d="M-24,-64 C-27,-92 27,-92 24,-64 C17,-73 7,-78 -3,-74 C-11,-79 -19,-75 -24,-64 Z" fill="${c}" ${S}/>`;
  const long = `<path d="M-25,-62 C-28,-95 28,-95 25,-62 C21,-74 12,-80 2,-76 C-8,-80 -18,-74 -25,-62 Z" fill="${c}" ${S}/>`;
  switch (st) {
    case 'short': case 'pony': return short;
    case 'long': case 'bun': return long;
    case 'spiky': return `<path d="M-24,-64 L-23,-84 L-13,-80 L-7,-93 L1,-83 L10,-93 L13,-80 L24,-83 L24,-64 C15,-75 -10,-76 -24,-64 Z" fill="${c}" ${S}/>`;
    case 'grandpa': return `<path d="M-23,-58 C-31,-64 -27,-75 -19,-73 Z M23,-58 C31,-64 27,-75 19,-73 Z" fill="#F4F4F4" ${S2}/><ellipse cx="-8" cy="-80" rx="6" ry="3" fill="#fff" opacity=".7"/>` + GLASSES;
    case 'grandma': return `<path d="M-24,-63 C-26,-91 26,-91 24,-63 C16,-74 -16,-74 -24,-63 Z" fill="${c}" ${S}/>` + GLASSES;
    case 'combover': return `<path d="M-23,-58 C-30,-64 -27,-76 -19,-74 Z M23,-58 C30,-64 27,-76 19,-74 Z" fill="${c}" ${S2}/><path d="M-17,-79 Q-2,-91 16,-80" fill="none" stroke="${INK}" stroke-width="4.6" stroke-linecap="round"/><path d="M-17,-79 Q-2,-91 16,-80" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="-6" cy="-83" rx="5" ry="2.4" fill="#fff" opacity=".6"/>`;
    case 'curlers': return short + [-17, -7, 3, 13].map((x, i) => `<rect x="${x}" y="${i % 3 ? -94 : -90}" width="8" height="11" rx="3" fill="#FF9EC4" ${S2}/>`).join('');
    case 'cap': return short + `<path d="M-25,-70 C-25,-97 25,-97 25,-70 Z" fill="#253B73" ${S}/><path d="M-27,-70 Q0,-62 27,-70 L29,-65 Q0,-55 -29,-65 Z" fill="#1A2A55" ${S}/><circle cx="0" cy="-82" r="4.5" fill="#FFD23F" ${S2}/>`;
    case 'kidcap': return short + `<path d="M-24,-69 C-24,-95 24,-95 24,-69 Z" fill="#FF8A3D" ${S}/><path d="M8,-71 L37,-71 Q40,-65 30,-64 L6,-66 Z" fill="#E36A1E" ${S}/>`;
    case 'hood': return `<path d="M-19,-69 C-14,-85 14,-85 19,-69 C10,-75 4,-71 0,-75 C-5,-71 -11,-75 -19,-69 Z" fill="${c}" ${S2}/><path d="M-31,-58 C-33,-99 33,-99 31,-58 L25,-58 C26,-89 -26,-89 -25,-58 Z" fill="${top}" ${S}/>`;
    default: return '';
  }
}

/* ---------- đạo cụ cầm tay (tọa độ tại bàn tay) ---------- */
export function prop(kind: Prop, hx: number, hy: number): string {
  const g = (inner: string) => `<g transform="translate(${hx} ${hy})">${inner}</g>`;
  switch (kind) {
    case 'boba': return g(`<path d="M-7,-16 L7,-16 L5.5,4 L-5.5,4 Z" fill="#E8C49A" ${S2}/><circle cx="-2" cy="0" r="1.7" fill="${INK}"/><circle cx="2.5" cy="1" r="1.7" fill="${INK}"/><circle cx="0" cy="-3" r="1.7" fill="${INK}"/><rect x="-8.5" y="-19" width="17" height="4" rx="2" fill="#fff" ${S2}/><path d="M2,-19 L6,-29" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M2,-19 L6,-29" stroke="#FF6FA8" stroke-width="2.5" stroke-linecap="round"/>`);
    case 'phone': return g(`<rect x="-6" y="-12" width="12" height="20" rx="3" fill="#3A3A4A" ${S2}/><rect x="-3.5" y="-9" width="7" height="12" rx="1.5" fill="#8EC9FF"/>`);
    case 'rose': return g(`<path d="M0,2 L-3,-24" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/><path d="M0,2 L-3,-24" stroke="#3E9E48" stroke-width="2.5" stroke-linecap="round"/><path d="M-2,-12 Q-12,-16 -10,-8 Q-5,-8 -2,-12 Z" fill="#3E9E48" ${S2}/><circle cx="-3" cy="-29" r="8" fill="#E8484A" ${S2}/><path d="M-7,-30 Q-3,-35 1,-30 Q-3,-25 -5,-29" fill="none" ${sw(1.6)}/>`);
    case 'ring': return g(`<path d="M-9,-12 L-7,-23 L9,-23 L9,-12 Z" fill="#B52A33" ${S2}/><rect x="-9" y="-12" width="18" height="11" rx="3" fill="#E8484A" ${S2}/><circle cx="0" cy="-14" r="4.2" fill="none" stroke="#FFD23F" stroke-width="2.6"/>` + sparkle(2, -21, 4.5, '#DFF6FF'));
    case 'camera': return g(`<rect x="-16" y="-10" width="32" height="20" rx="4" fill="#3A3A4A" ${S}/><rect x="-8" y="-14" width="10" height="5" rx="1.5" fill="#3A3A4A" ${S2}/><circle cx="1" cy="0" r="7" fill="#8EC9FF" ${S2}/><circle cx="-1" cy="-2" r="2" fill="#fff"/><circle cx="11" cy="-5" r="2.2" fill="#FF3B3B"/>`);
    case 'fan': return g(`<path d="M0,0 L-15,-17 A22,22 0 0 1 13,-20 Z" fill="#FF9EC4" ${S2}/><path d="M0,0 L-6,-21 M0,0 L4,-22" ${sw(1.5)}/>`);
    case 'cane': return g(`<path d="M0,-2 L0,${-hy}" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M0,-2 L0,${-hy}" stroke="#A86B3C" stroke-width="3.5" stroke-linecap="round"/><path d="M0,-2 Q0,-10 7,-10" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M0,-2 Q0,-10 7,-10" fill="none" stroke="#A86B3C" stroke-width="3.5" stroke-linecap="round"/>`);
    case 'icecream': return g(`<path d="M-6,-6 L6,-6 L0,8 Z" fill="#E8B26A" ${S2}/><circle cx="0" cy="-11" r="7.5" fill="#FF9EC4" ${S2}/>`);
    case 'poop': return poop('normal', { x: hx, y: hy + 4, s: 0.32 });
    default: return '';
  }
}

/* ---------- người ---------- */
export function person(o: PersonOpts = {}): string {
  const p = {
    skin: '#FFD7B0', hair: '#3B2416', style: 'short' as HairStyle, top: '#FF6FA8', bottom: '#3A5BA0', face: 'smile' as Face, blush: true,
    pose: 'stand', lower: 'pants', prop: null as Prop, propHand: 'r', tilt: 0, extra: '', headExtra: '', over: '', back: '', faceUnder: '', x: 0, y: 0, s: 1, ...o,
  };
  const dy = p.pose === 'sit' ? 10 : p.pose === 'kneel' ? 12 : 0;
  const h = { l: [-21, -24] as Pt, r: [21, -24] as Pt, ...(o.hands || {}) };
  let legs: string;
  if (p.pose === 'kneel') {
    legs = `<rect x="-15" y="-11" width="15" height="11" rx="4" fill="${p.bottom}" ${S}/><rect x="1" y="-21" width="13" height="19" rx="4" fill="${p.bottom}" ${S}/><ellipse cx="8" cy="-2" rx="8" ry="3.6" fill="${INK}"/>`;
  } else if (p.pose === 'sit') {
    legs = `<rect x="-13" y="-13" width="11" height="11" rx="3" fill="${p.bottom}" ${S}/><rect x="2" y="-13" width="11" height="11" rx="3" fill="${p.bottom}" ${S}/><ellipse cx="-7" cy="-2" rx="7" ry="3.4" fill="${INK}"/><ellipse cx="8" cy="-2" rx="7" ry="3.4" fill="${INK}"/>`;
  } else if (p.lower === 'skirt' || p.lower === 'shorts') {
    legs = `<rect x="-10" y="-17" width="7" height="15" rx="3" fill="${p.skin}" ${S2}/><rect x="3" y="-17" width="7" height="15" rx="3" fill="${p.skin}" ${S2}/><ellipse cx="-7" cy="-2" rx="6.5" ry="3.3" fill="${INK}"/><ellipse cx="7" cy="-2" rx="6.5" ry="3.3" fill="${INK}"/>`;
  } else {
    legs = `<rect x="-12" y="-22" width="10" height="20" rx="3" fill="${p.bottom}" ${S}/><rect x="2" y="-22" width="10" height="20" rx="3" fill="${p.bottom}" ${S}/><ellipse cx="-7" cy="-2" rx="7" ry="3.5" fill="${INK}"/><ellipse cx="7" cy="-2" rx="7" ry="3.5" fill="${INK}"/>`;
  }
  let lowerOver = '';
  if (p.pose === 'stand' && p.lower === 'skirt') lowerOver = `<path d="M-14,-27 L14,-27 L19,-13 L-19,-13 Z" fill="${p.bottom}" ${S}/>`;
  if (p.pose === 'stand' && p.lower === 'shorts') lowerOver = `<path d="M-14,-26 L14,-26 L15,-14 L1,-14 L0,-19 L-1,-14 L-15,-14 Z" fill="${p.bottom}" ${S}/>`;
  const torso = `<rect x="-16" y="-46" width="32" height="28" rx="11" fill="${p.top}" ${S}/>`;
  const arm = ([hx, hy]: Pt, sx: number) => `<path d="M${sx},-40 L${hx},${hy}" stroke="${INK}" stroke-width="10.5" stroke-linecap="round"/><path d="M${sx},-40 L${hx},${hy}" stroke="${p.armColor ?? p.top}" stroke-width="5" stroke-linecap="round"/>`;
  const hand = ([hx, hy]: Pt) => `<circle cx="${hx}" cy="${hy}" r="4.6" fill="${p.skin}" ${S2}/>`;
  const ph = p.propHand === 'l' ? h.l : h.r;
  const blush = p.blush ? `<ellipse cx="-14" cy="-55" rx="4.2" ry="2.6" fill="#FF8FB8" opacity=".75"/><ellipse cx="14" cy="-55" rx="4.2" ry="2.6" fill="#FF8FB8" opacity=".75"/>` : '';
  const hood = p.style === 'hood';
  const head = `<g transform="rotate(${p.tilt} 0 -44)">${hairBack(p.style, p.hair, p.top)}<circle cx="0" cy="${hood ? -61 : -64}" r="${hood ? 22 : 24}" fill="${p.skin}" ${S}/>${blush}${p.faceUnder}${face(p.face)}${hairFront(p.style, p.hair, p.top)}${p.headExtra}</g>`;
  return `<g transform="translate(${p.x} ${p.y}) scale(${p.s})">${p.back}${legs}<g transform="translate(0 ${dy})">${torso}${lowerOver}${p.extra}${head}${arm(h.l, -13)}${arm(h.r, 13)}${prop(p.prop, ph[0], ph[1])}${hand(h.l)}${hand(h.r)}${p.over}</g></g>`;
}

/* ---------- Cục ---------- */
export type Ammo = 'normal' | 'gold' | 'rainbow' | 'bomb' | 'magnet' | 'speed';
const POOP: Record<Ammo, { t: [string, string, string]; tip: string | null }> = {
  normal: { t: ['#7A4A22', '#8A5A2B', '#A06A35'], tip: '#A06A35' },
  gold: { t: ['#E0A100', '#F5C518', '#FFDD55'], tip: '#FFE78A' },
  rainbow: { t: ['#5BC0FF', '#7BD35A', '#FFD23F'], tip: '#FF6FA8' },
  bomb: { t: ['#3A3A46', '#4A4A58', '#5C5C6C'], tip: '#5C5C6C' },
  magnet: { t: ['#7A4A22', '#8A5A2B', '#A06A35'], tip: null },
  speed: { t: ['#2563C9', '#3D86E8', '#64A8FF'], tip: null },
};
export function poop(v: Ammo = 'normal', o: { x?: number; y?: number; s?: number; rot?: number; face?: boolean; mood?: 'happy' | 'sad' } = {}): string {
  const p = { x: 0, y: 0, s: 1, rot: 0, face: true, mood: 'happy', ...o }, c = POOP[v];
  let pre = '', post = '';
  const tip = c.tip ? `<path d="M-5,-40 C-3,-50 4,-54 9,-58 C8,-50 7,-44 5,-40 Z" fill="${c.tip}" ${S}/>` : '';
  if (v === 'gold') post = sparkle(-32, -46, 6) + sparkle(30, -40, 5) + sparkle(20, -62, 4);
  if (v === 'rainbow') post = sparkle(-30, -40, 5, '#FFC2DD') + sparkle(30, -50, 5, '#C9F0FF');
  if (v === 'bomb') post = `<path d="M6,-56 Q14,-68 22,-65" fill="none" ${S}/>` + sparkle(23, -66, 7, '#FF8A3D');
  if (v === 'magnet') {
    pre = `<path d="M-30,-38 Q-36,-28 -30,-18 M30,-38 Q36,-28 30,-18" fill="none" stroke="#E8484A" stroke-width="2.4" stroke-linecap="round"/>`;
    post = `<path d="M-11,-40 L-11,-52 A11,11 0 0 1 11,-52 L11,-40 L4,-40 L4,-52 A4,4 0 0 0 -4,-52 L-4,-40 Z" fill="#E8484A" ${S2}/><rect x="-11" y="-44" width="7" height="5" fill="#DADDE3" ${S2}/><rect x="4" y="-44" width="7" height="5" fill="#DADDE3" ${S2}/>`;
  }
  if (v === 'speed') post = `<path d="M2,-40 L-4,-56 L3,-54 L0,-68 L10,-50 L3,-52 L8,-40 Z" fill="#FFD23F" ${S2}/>`;
  const angry = v === 'bomb';
  const mouth = angry ? `<path d="M-14,-31 L-3,-27 M14,-31 L3,-27" ${S}/><path d="M-6,-10 Q0,-15 6,-10" fill="none" ${S}/>`
    : p.mood === 'sad' ? `<path d="M-6,-9 Q0,-15 6,-9" fill="none" ${S}/>`
    : `<path d="M-8,-13 Q0,-4 8,-13 Z" fill="#B3263E" ${S2}/>`;
  const faceSvg = p.face ? `<ellipse cx="-8" cy="-22" rx="5.6" ry="6.6" fill="#fff" ${S2}/><ellipse cx="8" cy="-22" rx="5.6" ry="6.6" fill="#fff" ${S2}/><circle cx="-7" cy="-21" r="2.9" fill="${INK}"/><circle cx="9" cy="-21" r="2.9" fill="${INK}"/><circle cx="-6" cy="-22.5" r="1" fill="#fff"/><circle cx="10" cy="-22.5" r="1" fill="#fff"/>` + mouth +
    `<ellipse cx="-16" cy="-14" rx="3.5" ry="2" fill="#FF8FB8" opacity=".7"/><ellipse cx="16" cy="-14" rx="3.5" ry="2" fill="#FF8FB8" opacity=".7"/>` : '';
  return `<g transform="translate(${p.x} ${p.y}) rotate(${p.rot}) scale(${p.s})">${pre}${tip}<ellipse cx="0" cy="-35" rx="14" ry="8.5" fill="${c.t[2]}" ${S}/><ellipse cx="0" cy="-23" rx="21" ry="10" fill="${c.t[1]}" ${S}/><ellipse cx="0" cy="-10" rx="28" ry="11" fill="${c.t[0]}" ${S}/><ellipse cx="-7" cy="-38" rx="4" ry="2" fill="#fff" opacity=".55"/><ellipse cx="-12" cy="-27" rx="5" ry="2.2" fill="#fff" opacity=".45"/><ellipse cx="-17" cy="-13" rx="6" ry="2.4" fill="#fff" opacity=".35"/>${faceSvg}${post}</g>`;
}

/* ---------- chó, cảnh vật ---------- */
export function dog(o: { catching?: boolean; jump?: boolean } = {}): string {
  const fur = '#E8A65A', dark = '#9C5B2E';
  const legs = o.jump
    ? `<rect x="-26" y="-22" width="15" height="8" rx="3" fill="${dark}" ${S2}/><rect x="14" y="-30" width="15" height="8" rx="3" fill="${dark}" ${S2}/>`
    : `<rect x="-18" y="-16" width="8" height="15" rx="3" fill="${dark}" ${S2}/><rect x="10" y="-16" width="8" height="15" rx="3" fill="${dark}" ${S2}/>`;
  const front = o.jump
    ? `<rect x="-22" y="-16" width="15" height="8" rx="3" fill="${fur}" ${S2}/><rect x="18" y="-24" width="15" height="8" rx="3" fill="${fur}" ${S2}/>`
    : `<rect x="-13" y="-15" width="8" height="15" rx="3" fill="${fur}" ${S2}/><rect x="15" y="-15" width="8" height="15" rx="3" fill="${fur}" ${S2}/>`;
  return `${legs}<path d="M-23,-26 Q-38,-34 -33,-46" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M-23,-26 Q-38,-34 -33,-46" fill="none" stroke="${fur}" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="0" cy="-23" rx="26" ry="13" fill="${fur}" ${S}/><ellipse cx="-7" cy="-27" rx="8" ry="5" fill="${dark}"/>${front}
    <circle cx="24" cy="-39" r="15" fill="${fur}" ${S}/><ellipse cx="36" cy="-34" rx="9.5" ry="7" fill="#FFE2BF" ${S2}/><ellipse cx="44" cy="-37" rx="3.6" ry="3" fill="${INK}"/>
    <path d="M14,-49 Q7,-37 13,-28 Q22,-36 20,-49 Z" fill="${dark}" ${S2}/><circle cx="28" cy="-43" r="2.8" fill="${INK}"/><circle cx="29" cy="-44" r="1" fill="#fff"/>
    <path d="M13,-28 L21,-23" stroke="#E8484A" stroke-width="5" stroke-linecap="round"/>
    ${o.catching ? poop('normal', { x: 47, y: -26, s: 0.33, rot: 20 }) : `<path d="M35,-29 Q37,-21 42,-27" fill="#FF6F91" ${S2}/>`}`;
}
export function bench(w = 120): string {
  const x = -w / 2;
  return `<rect x="${x + 8}" y="-20" width="7" height="20" fill="#7A7A86" ${S2}/><rect x="${w / 2 - 15}" y="-20" width="7" height="20" fill="#7A7A86" ${S2}/>
    <rect x="${x}" y="-58" width="${w}" height="9" rx="3" fill="#C27A3A" ${S2}/><rect x="${x}" y="-44" width="${w}" height="9" rx="3" fill="#C27A3A" ${S2}/>
    <rect x="${x - 4}" y="-24" width="${w + 8}" height="9" rx="3" fill="#D88B45" ${S2}/>`;
}
export function bush(x: number, y: number, s = 1, fill = '#4FB548'): string {
  return `<g transform="translate(${x} ${y}) scale(${s})">${blob([[-34, -14, 20], [-12, -26, 24], [14, -24, 22], [34, -12, 18], [0, -6, 26]], fill)}<circle cx="-14" cy="-30" r="5" fill="#7BD35A"/><circle cx="16" cy="-28" r="4" fill="#7BD35A"/></g>`;
}
export function tree(x: number, y: number, s = 1, leaf = '#3FA34D'): string {
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-6" y="-40" width="12" height="40" rx="4" fill="#9C6B3E" ${S2}/>${blob([[-20, -56, 20], [0, -72, 24], [20, -56, 20], [0, -48, 20]], leaf)}<circle cx="-6" cy="-76" r="5" fill="#6CCB5F" opacity=".8"/></g>`;
}
export function lamp(x: number, y: number, s = 1, lit = false): string {
  return `<g transform="translate(${x} ${y}) scale(${s})">${lit ? `<circle cx="0" cy="-92" r="26" fill="#FFE27A" opacity=".35"/>` : ''}<rect x="-3" y="-86" width="6" height="86" fill="#3A3A4A" ${S2}/><rect x="-9" y="-4" width="18" height="6" rx="2" fill="#3A3A4A" ${S2}/><path d="M-10,-86 L10,-86 L7,-100 L-7,-100 Z" fill="${lit ? '#FFE27A' : '#F4F4F4'}" ${S2}/><path d="M-9,-100 L9,-100 L0,-108 Z" fill="#3A3A4A" ${S2}/></g>`;
}

/* ---------- người chơi nhìn từ sau lưng ---------- */
export type BackPose = 'idle' | 'aim' | 'throw' | 'stun';
/** Ngoại hình người chơi nhìn từ sau lưng (mỗi skin một bộ). */
export interface BackLook {
  top: string; accent: string; bottom: string; arm: string; skin?: string;
  head: 'hood' | 'hair' | 'bald'; hair?: string;
  /** Vẽ đè lên lưng áo: cặp sách, áo choàng, cổ áo ba lỗ… */
  torso?: string;
  /** Vẽ đè lên đầu: băng đô ninja… */
  headExtra?: string;
}
export const HOODIE_BACK: BackLook = { top: '#FF8A3D', accent: '#E36A1E', bottom: '#4A4A55', arm: '#FF8A3D', head: 'hood' };

export function playerBack(pose: BackPose, L: BackLook = HOODIE_BACK): string {
  const skin = L.skin ?? '#FFD7B0';
  const armL: Pt = pose === 'aim' ? [-27, -74] : pose === 'throw' ? [-24, -30] : [-23, -28];
  const armR: Pt = pose === 'aim' ? [33, -30] : pose === 'throw' ? [22, -88] : [24, -28];
  const arm = ([hx, hy]: Pt, sx: number) => `<path d="M${sx},-44 L${hx},${hy}" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="M${sx},-44 L${hx},${hy}" stroke="${L.arm}" stroke-width="5.5" stroke-linecap="round"/><circle cx="${hx}" cy="${hy}" r="5" fill="${skin}" ${S2}/>`;
  const held = pose === 'aim' ? poop('normal', { x: armR[0] + 3, y: armR[1] + 11, s: 0.36 }) : pose === 'idle' ? poop('normal', { x: armR[0] + 2, y: armR[1] + 12, s: 0.3 }) : '';
  const slipper = pose === 'stun' ? `<g transform="rotate(-16 0 -96)"><rect x="-17" y="-104" width="34" height="13" rx="6.5" fill="#5BC0FF" ${S2}/><path d="M-7,-100 Q0,-108 7,-100" fill="none" stroke="#fff" stroke-width="2.6"/></g>` : '';
  const back = pose === 'aim' ? arm(armL, -13) : '';
  const frontL = pose === 'aim' ? '' : arm(armL, -13);
  const head = L.head === 'hood'
    ? `<circle cx="0" cy="-68" r="25" fill="${L.top}" ${S}/><path d="M0,-92 Q4,-70 0,-48" fill="none" stroke="${L.accent}" stroke-width="3" stroke-linecap="round"/><path d="M-20,-80 Q-24,-64 -16,-52" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/>`
    : L.head === 'hair'
      ? `<circle cx="-23" cy="-63" r="4.5" fill="${skin}" ${S2}/><circle cx="23" cy="-63" r="4.5" fill="${skin}" ${S2}/><circle cx="0" cy="-66" r="23" fill="${skin}" ${S}/><path d="M-23,-64 C-25,-94 25,-94 23,-64 C22,-57 17,-51 10,-49 L-10,-49 C-17,-51 -22,-57 -23,-64 Z" fill="${L.hair}" ${S}/><path d="M-12,-82 Q-16,-70 -12,-60" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".3"/>`
      : `<circle cx="-23" cy="-63" r="4.5" fill="${skin}" ${S2}/><circle cx="23" cy="-63" r="4.5" fill="${skin}" ${S2}/><circle cx="0" cy="-66" r="23" fill="${skin}" ${S}/><path d="M-22,-58 C-24,-68 -16,-60 0,-58 C16,-60 24,-68 22,-58 C18,-50 -18,-50 -22,-58 Z" fill="${L.hair}" ${S2}/><ellipse cx="-7" cy="-80" rx="7" ry="3.5" fill="#fff" opacity=".55"/>`;
  return `${back}<rect x="-14" y="-20" width="12" height="18" rx="3" fill="${L.bottom}" ${S}/><rect x="2" y="-20" width="12" height="18" rx="3" fill="${L.bottom}" ${S}/>
    <rect x="-19" y="-52" width="38" height="36" rx="13" fill="${L.top}" ${S}/><path d="M-12,-30 L12,-30" stroke="${L.accent}" stroke-width="3" stroke-linecap="round"/>
    ${L.torso ?? ''}${head}${L.headExtra ?? ''}
    ${frontL}${arm(armR, 13)}${held}${slipper}`;
}

/* ---------- Mèo Ghen Tị ---------- */
/** Mèo xám ngồi nhìn thẳng. jealous: mắt lườm, má phồng; happy: mắt cười, đang được vuốt ve. */
export function cat(mood: 'jealous' | 'happy' = 'jealous'): string {
  const fur = '#9AA3B5', dark = '#6E7790';
  const eyes = mood === 'jealous'
    ? `<path d="M-10,-37 L-3,-36 M3,-36 L10,-37" ${sw(2.6)}/><circle cx="-6" cy="-34" r="1.9" fill="${INK}"/><circle cx="5" cy="-34" r="1.9" fill="${INK}"/><path d="M-3,-27 Q0,-29.5 3,-27" fill="none" ${S2}/><path d="M12,-50 L16,-46 M16,-50 L12,-46" stroke="#E8484A" stroke-width="2.2" stroke-linecap="round"/>`
    : `<path d="M-10,-35 Q-6.5,-39 -3,-35 M3,-35 Q6.5,-39 10,-35" fill="none" ${S2}/><path d="M-4,-28 Q-2,-25.5 0,-28 Q2,-25.5 4,-28" fill="none" ${S2}/>`;
  return `<path d="M10,-8 C26,-10 28,-28 20,-38" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M10,-8 C26,-10 28,-28 20,-38" fill="none" stroke="${fur}" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="0" cy="-12" rx="13" ry="12" fill="${fur}" ${S}/><ellipse cx="0" cy="-9" rx="7" ry="8" fill="#F4F4F8"/>
    <ellipse cx="-6" cy="-1" rx="5" ry="3" fill="#F4F4F8" ${S2}/><ellipse cx="6" cy="-1" rx="5" ry="3" fill="#F4F4F8" ${S2}/>
    <path d="M-13,-40 L-11,-52 L-3,-45 Z M13,-40 L11,-52 L3,-45 Z" fill="${fur}" ${S2}/><path d="M-11,-43 L-10.5,-49 L-6,-45 Z M11,-43 L10.5,-49 L6,-45 Z" fill="#FF9EC4"/>
    <circle cx="0" cy="-33" r="14" fill="${fur}" ${S}/>
    <path d="M-4,-46 L-4,-42 M0,-47 L0,-42 M4,-46 L4,-42" stroke="${dark}" stroke-width="1.8" stroke-linecap="round"/>
    <ellipse cx="-9" cy="-29" rx="3.2" ry="2" fill="#FF8FB8" opacity=".8"/><ellipse cx="9" cy="-29" rx="3.2" ry="2" fill="#FF8FB8" opacity=".8"/>
    <path d="M-1.5,-31 L1.5,-31 L0,-29.5 Z" fill="#FF6F91"/>
    <path d="M-16,-31 L-9,-30 M-16,-27 L-9,-28 M16,-31 L9,-30 M16,-27 L9,-28" stroke="${INK}" stroke-width="1" stroke-linecap="round"/>
    ${eyes}`;
}

/* ---------- vật phẩm nhỏ ---------- */
export function slipper(): string {
  return `<path d="M-9,-22 C-14,-22 -14,22 -8,22 L8,22 C14,22 14,-22 9,-22 Z" fill="#5BC0FF" ${S}/><path d="M-11,-6 Q0,-16 11,-6" fill="none" stroke="#FF6FA8" stroke-width="5" stroke-linecap="round"/><path d="M-11,-6 Q0,-16 11,-6" fill="none" ${sw(1.2)} opacity=".5"/>`;
}
/** Miếng "mặt nạ" dính trên đầu nạn nhân: nâu bóng, mặt cười, không vẽ chi tiết bẩn. */
export function splatMask(): string {
  return `${blob([[-14, -2, 11], [0, -8, 14], [14, -2, 11], [-6, 8, 8], [8, 8, 8]], '#8A5A2B', 2.4)}
    <path d="M-16,8 Q-16,20 -12,20 Q-9,20 -10,8 Z M12,8 Q12,24 16,24 Q19,24 17,8 Z" fill="#8A5A2B" ${S2}/>
    <ellipse cx="-6" cy="-12" rx="6" ry="3" fill="#fff" opacity=".5"/>
    <circle cx="-5" cy="-1" r="2.2" fill="${INK}"/><circle cx="5" cy="-1" r="2.2" fill="${INK}"/><path d="M-4,5 Q0,9 4,5" fill="none" ${S2}/>`;
}
export function brokenHeart(): string {
  return `<path d="M0,8 C-14,-2 -12,-13 -5,-13 C-1.5,-13 0,-10 0,-9 L-3,-3 L2,1 L-1,8 Z" fill="#FF4D7E" ${S2} transform="translate(-3 0) rotate(-12)"/><path d="M1,8 L4,1 L-1,-3 L2,-9 C2,-10 3.5,-13 7,-13 C14,-13 16,-2 1,8 Z" fill="#FF4D7E" ${S2} transform="translate(3 0) rotate(12)"/>`;
}
export function duck(): string {
  return `<ellipse cx="0" cy="0" rx="16" ry="9" fill="#FFD23F" ${S2}/><circle cx="10" cy="-10" r="8" fill="#FFD23F" ${S2}/><path d="M17,-11 L25,-9 L17,-6 Z" fill="#FF8A3D" ${S2}/><path d="M8,-13 L14,-12" ${S2}/><path d="M-12,-1 Q-4,-6 4,-1" fill="none" ${S2}/>`;
}

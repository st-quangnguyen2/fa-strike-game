import type { BackLook, PersonOpts } from './art/kit';
import { INK } from './art/kit';

/** Trang phục người chơi. Giá tính bằng điểm trong ví; ưu điểm luôn nhỏ để không thành pay-to-win. */
export type SkinId = 'hoodie' | 'student' | 'hacker' | 'hero' | 'ninja' | 'uncle';
export type Perk = 'none' | 'duck' | 'aim';

export interface SkinDef { price: number; perk: Perk; front: PersonOpts; back: BackLook }

const S2 = `stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
const MUSTACHE = `<path d="M-10,-55 Q-5,-60 0,-56 Q5,-60 10,-55 Q5,-51 0,-53.5 Q-5,-51 -10,-55 Z" fill="${INK}"/>`;
const DRAWSTRINGS = `<path d="M-5,-43 L-5,-33 M5,-43 L5,-33" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`;

export const SKINS: Record<SkinId, SkinDef> = {
  hoodie: {
    price: 0, perk: 'none',
    front: { style: 'hood', hair: '#2B1B12', top: '#FF8A3D', bottom: '#4A4A55', blush: false,
      extra: DRAWSTRINGS + `<path d="M-10,-26 L10,-26" stroke="#E36A1E" stroke-width="3" stroke-linecap="round"/>` },
    back: { top: '#FF8A3D', accent: '#E36A1E', bottom: '#4A4A55', arm: '#FF8A3D', head: 'hood' },
  },
  student: {
    price: 2000, perk: 'none',
    front: { style: 'short', hair: '#2B1B12', top: '#FFFFFF', bottom: '#2F4B8A', lower: 'shorts', armColor: '#FFFFFF',
      extra: `<path d="M-12,-46 L-12,-26 M12,-46 L12,-26" stroke="#3A6FE0" stroke-width="4" stroke-linecap="round"/><path d="M-10,-46 L10,-46 L0,-33 Z" fill="#E8484A" ${S2}/><circle cx="0" cy="-44" r="3" fill="#E8484A" ${S2}/>` },
    back: { top: '#FFFFFF', accent: '#D6DCE6', bottom: '#2F4B8A', arm: '#FFFFFF', head: 'hair', hair: '#2B1B12',
      torso: `<rect x="-14" y="-49" width="28" height="31" rx="7" fill="#3A6FE0" ${S2}/><rect x="-8" y="-33" width="16" height="10" rx="3" fill="#2F58C0" ${S2}/><path d="M-6,-46 L6,-46" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/><path d="M-6,-52 L6,-52 L0,-45 Z" fill="#E8484A" ${S2}/>` },
  },
  hacker: {
    price: 5000, perk: 'none',
    front: { style: 'hood', hair: '#1E2228', top: '#2F3540', bottom: '#1E2228', blush: false,
      headExtra: `<g fill="rgba(61,255,138,.28)" ${S2}><rect x="-17" y="-68" width="14" height="11" rx="3"/><rect x="3" y="-68" width="14" height="11" rx="3"/></g><path d="M-3,-63 L3,-63" ${S2}/>`,
      extra: `<path d="M-7,-38 L-11,-34 L-7,-30 M7,-38 L11,-34 L7,-30 M2,-39 L-2,-29" stroke="#3DFF8A" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` },
    back: { top: '#2F3540', accent: '#3DFF8A', bottom: '#1E2228', arm: '#2F3540', head: 'hood',
      torso: `<path d="M-8,-40 L-12,-35 L-8,-30 M8,-40 L12,-35 L8,-30 M2,-41 L-2,-29" stroke="#3DFF8A" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` },
  },
  hero: {
    price: 9000, perk: 'none',
    front: { style: 'short', hair: '#2B1B12', top: '#3A6FE0', bottom: '#3A6FE0',
      back: `<path d="M-16,-46 L16,-46 L27,-4 Q0,3 -27,-4 Z" fill="#E8484A" ${S2}/>`,
      faceUnder: `<path d="M-21,-68 Q0,-72 21,-68 L20,-57 Q10,-54 0,-60 Q-10,-54 -20,-57 Z" fill="#E8484A" ${S2}/>`,
      extra: `<rect x="-16" y="-25" width="32" height="4" fill="#FFD23F"/><path d="M0,-41 L3,-35 L9,-35 L4,-31 L6,-25 L0,-29 L-6,-25 L-4,-31 L-9,-35 L-3,-35 Z" fill="#FFD23F" ${S2}/>` },
    back: { top: '#3A6FE0', accent: '#2F58C0', bottom: '#3A6FE0', arm: '#3A6FE0', head: 'hair', hair: '#2B1B12',
      torso: `<path d="M-17,-52 L17,-52 L24,-12 Q12,-6 0,-12 Q-12,-6 -24,-12 Z" fill="#E8484A" ${S2}/><path d="M-6,-48 Q-8,-30 -10,-16 M6,-48 Q8,-30 10,-16" stroke="#C9343A" stroke-width="2" fill="none"/>`,
      headExtra: `<path d="M-23,-66 Q0,-70 23,-66 L23,-62 Q0,-66 -23,-62 Z" fill="#E8484A" ${S2}/><path d="M18,-64 Q28,-62 32,-54" stroke="#E8484A" stroke-width="3.5" fill="none" stroke-linecap="round"/>` },
  },
  ninja: {
    price: 12000, perk: 'duck',
    front: { style: 'hood', hair: '#1E1E28', top: '#2B2B3A', bottom: '#2B2B3A', blush: false,
      headExtra: `<path d="M-21,-57 Q0,-53 21,-57 L19,-44 Q0,-37 -19,-44 Z" fill="#2B2B3A" ${S2}/><path d="M-30,-74 Q0,-80 30,-74 L30,-68 Q0,-74 -30,-68 Z" fill="#E8484A" ${S2}/><path d="M28,-72 Q38,-74 44,-64 M28,-69 Q36,-66 40,-58" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M28,-72 Q38,-74 44,-64 M28,-69 Q36,-66 40,-58" stroke="#E8484A" stroke-width="3" fill="none" stroke-linecap="round"/>`,
      extra: `<path d="M-16,-30 L16,-30" stroke="#E8484A" stroke-width="3"/>` },
    back: { top: '#2B2B3A', accent: '#3E3E52', bottom: '#2B2B3A', arm: '#2B2B3A', head: 'hood',
      torso: `<path d="M-19,-30 L19,-30" stroke="#E8484A" stroke-width="3.5"/>`,
      headExtra: `<path d="M-25,-75 Q0,-81 25,-75 L25,-68 Q0,-74 -25,-68 Z" fill="#E8484A" ${S2}/><path d="M4,-72 Q14,-58 26,-52 M4,-72 Q20,-66 32,-66" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M4,-72 Q14,-58 26,-52 M4,-72 Q20,-66 32,-66" stroke="#E8484A" stroke-width="3" fill="none" stroke-linecap="round"/>` },
  },
  uncle: {
    price: 15000, perk: 'aim',
    front: { style: 'combover', hair: '#8A8A96', skin: '#F2C08F', top: '#FFFFFF', bottom: '#5B7FA6', lower: 'shorts', armColor: '#F2C08F', blush: false,
      headExtra: MUSTACHE,
      extra: `<path d="M-9,-46 Q0,-37 9,-46 Z" fill="#F2C08F"/><path d="M-11,-46 L-11,-40 M11,-46 L11,-40" stroke="#D6DCE6" stroke-width="2"/>` },
    back: { top: '#FFFFFF', accent: '#D6DCE6', bottom: '#5B7FA6', arm: '#F2C08F', skin: '#F2C08F', head: 'bald', hair: '#8A8A96',
      torso: `<path d="M-12,-52 L12,-52 L8,-42 Q0,-38 -8,-42 Z" fill="#F2C08F" ${S2}/>` },
  },
};

export const SKIN_ORDER: SkinId[] = ['hoodie', 'student', 'hacker', 'hero', 'ninja', 'uncle'];
export const CAT_PRICE = 20000;

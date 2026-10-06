import type { Lang } from '../i18n';
import type { SkinId } from '../skins';

export interface SaveData {
  unlocked: number; best: Record<number, number>; muted: boolean; music: boolean; bossCleared: boolean; lang?: Lang;
  /** Điểm tích lũy để mua đồ trong cửa hàng. */
  wallet: number;
  skins: SkinId[]; skin: SkinId;
  /** Đã có Mèo Ghen Tị chưa, và có mang theo vào màn không. */
  cat: boolean; catOn: boolean;
}
const KEY = 'ncpd.save.v1';
const DEFAULT: SaveData = { unlocked: 1, best: {}, muted: false, music: true, bossCleared: false, wallet: 0, skins: ['hoodie'], skin: 'hoodie', cat: false, catOn: true };

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch { /* trình duyệt chặn storage: chơi tiếp với dữ liệu mặc định */ }
  return { ...DEFAULT, best: {}, skins: ['hoodie'] };
}
export function writeSave(d: SaveData): void {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* bỏ qua */ }
}

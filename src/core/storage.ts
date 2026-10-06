import type { Lang } from '../i18n';

export interface SaveData { unlocked: number; best: Record<number, number>; muted: boolean; music: boolean; bossCleared: boolean; lang?: Lang }
const KEY = 'ncpd.save.v1';
const DEFAULT: SaveData = { unlocked: 1, best: {}, muted: false, music: true, bossCleared: false };

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch { /* trình duyệt chặn storage: chơi tiếp với dữ liệu mặc định */ }
  return { ...DEFAULT, best: {} };
}
export function writeSave(d: SaveData): void {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* bỏ qua */ }
}

import type { LevelDef } from '../config';
import type { FxLayer } from './fx';

export interface GroundPoop { x: number; y: number; life: number; claimed: boolean }

/** Những gì thực thể được phép hỏi/tác động lên màn chơi. */
export interface World {
  def: LevelDef;
  time: number;
  fx: FxLayer;
  alert: number;
  groundPoops: GroundPoop[];
  playerExposed(): boolean;
  guardPos(): { x: number; y: number } | null;
  addAlert(n: number, label: string): void;
  setAlert(v: number): void;
  throwSlipper(x: number, y: number): void;
  caught(): void;
  spawnCompanion(cx: number, y: number, owner: object): void;
}

/** Tốc độ đi bộ theo chiều sâu: làn xa đi chậm hơn trên màn hình. */
export const walkSpeed = (base: number, s: number, level: number) => base * (s / 0.65) * level;

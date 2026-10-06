import type { SongName } from '../core/music';
import type { Scene } from './stage';
import { HookScene, RevealScene, TitleSlamScene, WeaponScene, ThrowScene, TimingScene, CastScene, ComboScene, BombScene, DogScene, EldersScene, SlipperScene } from './scenes';
import { ProposalScene, DangerScene, CaughtScene, LevelsScene, BossIntroScene, BossFightScene, EndScene } from './scenes-late';

/** Thứ tự cảnh của trailer. Thời điểm bắt đầu được cộng dồn từ độ dài từng cảnh. */
export function makeScenes(): Scene[] {
  const list: Scene[] = [
    // Hồi 1: mở đầu
    new HookScene(), new RevealScene(), new TitleSlamScene(),
    // Hồi 2: cách chơi
    new WeaponScene(), new ThrowScene(), new TimingScene(),
    // Hồi 3: đa dạng
    new CastScene(), new ComboScene(), new BombScene(), new DogScene(), new EldersScene(), new SlipperScene(),
    // Hồi 4: kịch tính
    new ProposalScene(), new DangerScene(), new CaughtScene(), new LevelsScene(),
    // Hồi 5: boss
    new BossIntroScene(), new BossFightScene(),
    // Hồi 6: kết
    new EndScene(),
  ];
  let t = 0;
  for (const s of list) { s.start = t; s.end = t + s.dur; t = s.end; }
  return list;
}

export interface MusicSegment { song: SongName; t0: number; t1: number; intense: [number, number][] }

export function timelineInfo(scenes: Scene[]): { duration: number; cuts: number[]; music: MusicSegment[] } {
  const duration = scenes[scenes.length - 1].end;
  const cuts = scenes.slice(1).map(s => s.start);
  const music: MusicSegment[] = [];
  for (const s of scenes) {
    const last = music[music.length - 1];
    const win: [number, number][] = s.intense ? [[s.start + s.intense[0], s.start + s.intense[1]]] : [];
    if (last && last.song === s.song) { last.t1 = s.end; last.intense.push(...win); }
    else music.push({ song: s.song, t0: s.start, t1: s.end, intense: win });
  }
  return { duration, cuts, music };
}

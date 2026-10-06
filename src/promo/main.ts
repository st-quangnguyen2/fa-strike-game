import { Output, Mp4OutputFormat, BufferTarget, CanvasSource, AudioBufferSource } from 'mediabunny';
import { loadSprites, rasterize, renderBackground, playerFrontSvg, poopSvg, catSvg, CHARS } from '../art/sprites';
import { SKIN_ORDER } from '../skins';
import { person } from '../art/kit';
import type { Ammo } from '../art/kit';
import type { Tod } from '../config';
import { sfx, synthSfx } from '../core/audio';
import type { SfxName } from '../core/audio';
import { renderSong } from '../core/music';
import { setLang } from '../i18n';
import type { Lang } from '../i18n';
import { makeScenes, timelineInfo } from './sequence';
import type { Scene, Studio, BigSprite } from './stage';
import { FPS, VW, VH, PX, mulberry32, sticker, wipe, pop } from './kit';
import { drawConceptSheet, drawOutfitSheet, SHEET_W, SHEET_H, OUTFIT_W, OUTFIT_H } from './sheet';

const canvas = document.getElementById('promo') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const statusEl = document.getElementById('status')!;
const status = (s: string) => { statusEl.textContent = s; };
const { duration: DURATION, cuts: CUTS, music: MUSIC_PLAN } = timelineInfo(makeScenes());
const FRAMES = Math.round(FPS * DURATION);
const SAMPLE_RATE = 48000;

/* ---------- timeline: chạy các cảnh theo thứ tự, mỗi khung 1/30 giây ---------- */
class Timeline {
  private scenes: Scene[] = makeScenes();
  private cur: Scene | null = null;
  private updRng = mulberry32(20261006);
  private drawRng = mulberry32(42);
  constructor(private st: Studio) {}

  get current(): Scene | null { return this.cur; }
  private scene(t: number): Scene { return this.scenes.find(s => t >= s.start && t < s.end) ?? this.scenes[this.scenes.length - 1]; }

  update(i: number): void {
    const t = i / FPS, st = this.st;
    st.time = t;
    const s = this.scene(t);
    withRandom(this.updRng, () => {
      if (s !== this.cur) { this.cur = s; s.enter(st); }
      s.update(st, 1 / FPS, t - s.start);
    });
  }

  draw(i: number): void {
    const t = i / FPS, s = this.cur!, st = this.st;
    withRandom(this.drawRng, () => {
      ctx.setTransform(PX, 0, 0, PX, 0, 0);
      ctx.imageSmoothingQuality = 'high';
      s.draw(st, ctx, t - s.start);
      for (const toast of st.toasts) {
        const age = t - toast.t;
        if (age < 0 || age > 1.6) continue;
        const k = age > 1.35 ? 1 - (age - 1.35) / 0.25 : pop(age, 0, 0.25);
        sticker(ctx, toast.title, toast.body, 180, 160, k);
      }
      if (!st.clean) CUTS.forEach((c, n) => wipe(ctx, (t - (c - 0.22)) / 0.44, ['#FF6FA8', '#FFD23F', '#5BC0FF', '#7BD35A'][n % 4]));
    });
  }
}
const nativeRandom = Math.random;
function withRandom<T>(r: () => number, fn: () => T): T {
  Math.random = r;
  try { return fn(); } finally { Math.random = nativeRandom; }
}

/* ---------- tài nguyên ---------- */
let studioBase: Omit<Studio, 'lang' | 'time' | 'toasts' | 'clean'> | null = null;
async function prepare(): Promise<void> {
  if (studioBase) return;
  status('Đang tải font và vẽ sprite…');
  await Promise.all(['800 60px "Baloo 2"', '30px Bangers', '700 15px "Be Vietnam Pro"'].map(f => document.fonts.load(f)));
  await loadSprites(undefined, 4);
  const big: Record<string, BigSprite> = {};
  const add = async (key: string, svg: string, box: [number, number, number, number], res: number) => {
    big[key] = { c: await rasterize(svg, box, res), bx: box[0], by: box[1], bw: box[2], bh: box[3] };
  };
  const personBox: [number, number, number, number] = [-50, -130, 100, 140];
  await Promise.all([
    add('front.sneaky', playerFrontSvg('sneaky'), personBox, 9),
    add('front.aim', playerFrontSvg('aim'), personBox, 9),
    add('front.happy', playerFrontSvg('happy'), personBox, 9),
    add('front.shock', playerFrontSvg('shock'), personBox, 9),
    add('front.dizzy', playerFrontSvg('dizzy'), personBox, 9),
    ...SKIN_ORDER.map(id => add(`skin.${id}`, playerFrontSvg('happy', id), personBox, 7)),
    add('cat.happy', catSvg('happy'), [-22, -56, 52, 60], 9),
    add('boss.m', person({ ...CHARS.bossM.base, ...CHARS.bossM.states.hug }), personBox, 8),
    add('boss.f', person({ ...CHARS.bossF.base, ...CHARS.bossF.states.hug }), personBox, 8),
    ...(['normal', 'gold', 'rainbow', 'bomb', 'magnet', 'speed'] as Ammo[]).map(a => add(`poop.${a}`, poopSvg(a), [-40, -72, 80, 80], 9)),
  ]);
  const bgs = {} as Record<Tod, HTMLCanvasElement>;
  for (const tod of ['morning', 'sunset', 'night', 'fireworks'] as Tod[]) bgs[tod] = await renderBackground(tod, PX);
  const off = document.createElement('canvas');
  off.width = VW; off.height = VH;
  studioBase = { big, bgs, off, offCtx: off.getContext('2d')! };
}
function newStudio(lang: Lang): Studio {
  setLang(lang);
  return { ...studioBase!, lang, time: 0, toasts: [], clean: false };
}

/* ---------- âm thanh: chạy thử để ghi lại hiệu ứng, rồi dựng offline cùng nhạc ---------- */
function recordCues(lang: Lang): { name: SfxName; t: number }[] {
  const cues: { name: SfxName; t: number }[] = [];
  const tl = new Timeline(newStudio(lang));
  let now = 0;
  const orig = sfx.play;
  sfx.play = (name: SfxName) => { cues.push({ name, t: now }); };
  try {
    for (let i = 0; i < FRAMES; i++) { now = i / FPS; tl.update(i); }
  } finally { sfx.play = orig; }
  for (const c of CUTS) cues.push({ name: 'swoosh', t: c - 0.2 });
  return cues;
}
async function renderAudio(cues: { name: SfxName; t: number }[]): Promise<AudioBuffer> {
  const ac = new OfflineAudioContext(2, Math.ceil(SAMPLE_RATE * DURATION), SAMPLE_RATE);
  // nén + chặn đỉnh để âm lượng ngang mặt bằng video mạng xã hội mà không bị vỡ tiếng
  const limiter = ac.createDynamicsCompressor();
  limiter.threshold.value = -3; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.001; limiter.release.value = 0.08;
  limiter.connect(ac.destination);
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -18; comp.knee.value = 6; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.12;
  const makeup = ac.createGain(); makeup.gain.value = 1.05;
  comp.connect(makeup).connect(limiter);
  const master = ac.createGain(); master.gain.value = 1.8; master.connect(comp);
  const musicBus = ac.createGain(); musicBus.gain.value = 0.42; musicBus.connect(master);
  MUSIC_PLAN.forEach((seg, i) => {
    const last = i === MUSIC_PLAN.length - 1, fadeOut = last ? 0.9 : 0.12;
    const g = ac.createGain();
    g.gain.setValueAtTime(0, seg.t0);
    g.gain.linearRampToValueAtTime(1, seg.t0 + 0.04);
    g.gain.setValueAtTime(1, seg.t1 - fadeOut);
    g.gain.linearRampToValueAtTime(0, seg.t1);
    g.connect(musicBus);
    renderSong(ac, g, seg.song, seg.t0, seg.t1, t => (seg.intense.some(([a, b]) => t >= a && t < b) ? 1 : 0));
  });
  const sfxBus = ac.createGain(); sfxBus.gain.value = 0.75; sfxBus.connect(master);
  for (const c of cues) synthSfx(c.name, { c: ac, out: sfxBus, t0: c.t });
  return ac.startRendering();
}
function sliceAudio(buf: AudioBuffer, t0: number, t1: number): AudioBuffer {
  const s0 = Math.round(t0 * buf.sampleRate), s1 = Math.min(buf.length, Math.round(t1 * buf.sampleRate));
  const out = new AudioBuffer({ length: Math.max(1, s1 - s0), numberOfChannels: buf.numberOfChannels, sampleRate: buf.sampleRate });
  for (let ch = 0; ch < buf.numberOfChannels; ch++) out.copyToChannel(buf.getChannelData(ch).subarray(s0, s1), ch);
  return out;
}

/* ---------- xuất MP4 ---------- */
let busy = false;
async function exportVideo(lang: Lang): Promise<{ file: string; bytes: number; seconds: number }> {
  if (busy) throw new Error('Đang bận');
  busy = true;
  const started = performance.now();
  try {
    await prepare();
    status(`[${lang}] Ghi lại hiệu ứng âm thanh…`);
    const cues = recordCues(lang);
    status(`[${lang}] Dựng âm thanh (${cues.length} hiệu ứng + nhạc)…`);
    const audioBuf = await renderAudio(cues);

    const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
    const video = new CanvasSource(canvas, { codec: 'avc', bitrate: 8e6, keyFrameInterval: 2 });
    const audio = new AudioBufferSource({ codec: 'aac', bitrate: 192e3 });
    output.addVideoTrack(video, { frameRate: FPS });
    output.addAudioTrack(audio);
    output.setMetadataTags?.({ title: lang === 'vi' ? 'Ném Cứt Phá Đám' : 'FA Strike' });
    await output.start();

    const tl = new Timeline(newStudio(lang));
    let audioUntil = 0;
    for (let i = 0; i < FRAMES; i++) {
      const t = i / FPS;
      // xen kẽ âm thanh từng giây một để bộ ghép không phải chờ
      while (audioUntil < Math.min(DURATION, t + 1)) {
        const next = Math.min(DURATION, audioUntil + 1);
        await audio.add(sliceAudio(audioBuf, audioUntil, next));
        audioUntil = next;
      }
      tl.update(i);
      tl.draw(i);
      await video.add(t, 1 / FPS);
      if (i % 15 === 0) status(`[${lang}] Mã hóa khung ${i}/${FRAMES}…`);
    }
    while (audioUntil < DURATION) { const next = Math.min(DURATION, audioUntil + 1); await audio.add(sliceAudio(audioBuf, audioUntil, next)); audioUntil = next; }
    video.close(); audio.close();
    await output.finalize();
    const bytes = output.target.buffer!;
    status(`[${lang}] Lưu file…`);
    const res = await fetch(`/__promo/save?name=fa-strike-promo-${lang}.mp4`, { method: 'POST', body: bytes });
    const saved = await res.json();
    await savePoster(lang);
    const seconds = Math.round((performance.now() - started) / 100) / 10;
    status(`[${lang}] Xong: ${saved.file}\n${(saved.bytes / 1e6).toFixed(1)} MB · ${seconds}s`);
    return { file: saved.file, bytes: saved.bytes, seconds };
  } finally { busy = false; }
}

/** Ảnh bìa: khung màn kết. */
async function savePoster(lang: Lang): Promise<void> {
  const tl = new Timeline(newStudio(lang));
  const target = Math.round((DURATION - 2.2) * FPS);
  for (let i = 0; i <= target; i++) tl.update(i);
  tl.draw(target);
  const blob = await new Promise<Blob>(r => canvas.toBlob(b => r(b!), 'image/png'));
  await fetch(`/__promo/save?name=fa-strike-poster-${lang}.png`, { method: 'POST', body: blob });
}

/* ---------- xem thử có tiếng ---------- */
let previewing: AudioContext | null = null;
async function preview(lang: Lang): Promise<void> {
  if (busy) return;
  busy = true;
  try {
    await prepare();
    previewing?.close();
    status(`[${lang}] Chuẩn bị âm thanh…`);
    const buf = await renderAudio(recordCues(lang));
    const ac = new AudioContext();
    previewing = ac;
    const src = ac.createBufferSource(); src.buffer = buf; src.connect(ac.destination);
    const t0 = ac.currentTime + 0.1;
    src.start(t0);
    const tl = new Timeline(newStudio(lang));
    let i = 0;
    status(`[${lang}] Đang phát…`);
    await new Promise<void>(done => {
      const tick = () => {
        if (previewing !== ac) return done();
        const want = Math.min(FRAMES - 1, Math.floor((ac.currentTime - t0) * FPS));
        if (want >= 0) {
          while (i <= want) tl.update(i++);
          tl.draw(i - 1);
        }
        if (i >= FRAMES) { status(`[${lang}] Hết video.`); return done(); }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  } finally { busy = false; }
}

/** Vẽ một khung bất kỳ để kiểm tra nhanh (chạy lại từ đầu tới khung đó). */
async function still(lang: Lang, seconds: number): Promise<void> {
  await prepare();
  const tl = new Timeline(newStudio(lang));
  const target = Math.min(FRAMES - 1, Math.round(seconds * FPS));
  for (let i = 0; i <= target; i++) tl.update(i);
  tl.draw(target);
}

document.getElementById('play-vi')!.addEventListener('click', () => void preview('vi'));
document.getElementById('play-en')!.addEventListener('click', () => void preview('en'));
document.getElementById('export-vi')!.addEventListener('click', () => void exportVideo('vi').catch(e => status(String(e))));
document.getElementById('export-en')!.addEventListener('click', () => void exportVideo('en').catch(e => status(String(e))));

/** Chạy thử toàn bộ timeline (không vẽ) và tóm tắt kết quả từng cảnh, để kiểm tra kịch bản. */
async function probe(lang: Lang): Promise<unknown[]> {
  await prepare();
  const st = newStudio(lang), tl = new Timeline(st), out: unknown[] = [];
  let prev: Scene | null = null;
  const summarize = (s: Scene) => {
    const p = (s as unknown as { p?: { score: number; broken: number; maxCombo: number; ended: string | null; boss: { defeated: boolean; layer: number } | null; player: { stun: number } } }).p;
    out.push({ scene: s.constructor.name, start: +s.start.toFixed(1), end: +s.end.toFixed(1),
      ...(p ? { score: p.score, broken: p.broken, maxCombo: p.maxCombo, ended: p.ended, boss: p.boss ? `${p.boss.layer}${p.boss.defeated ? ' defeated' : ''}` : undefined } : {}),
      toasts: st.toasts.filter(t => t.t >= s.start && t.t < s.end).map(t => t.title) });
  };
  for (let i = 0; i < FRAMES; i++) {
    tl.update(i);
    const c = tl.current;
    if (prev && c !== prev) summarize(prev);
    prev = c;
  }
  if (prev) summarize(prev);
  return out;
}

/** Chạy tới các mốc thời gian và trả về trạng thái màn chơi của cảnh đang chạy (dùng khi chỉnh kịch bản). */
async function inspect(lang: Lang, times: number[]): Promise<unknown[]> {
  await prepare();
  const tl = new Timeline(newStudio(lang)), out: unknown[] = [];
  let i = 0;
  for (const t of times) {
    const target = Math.round(t * FPS);
    while (i <= target) tl.update(i++);
    const p = (tl.current as unknown as { p?: import('../game/play').Play }).p;
    out.push(p ? { t, score: p.score, stun: +p.player.stun.toFixed(2), duck: +p.player.duck.toFixed(2), proj: p.projectiles.length, slippers: p.slippers.length,
      couples: p.couples.map(c => `${c.kind}:${c.phase}@${Math.round(c.cx)}${c.hitAny ? '*' : ''}`), dogs: p.dogs.map(d => `${d.state}@${Math.round(d.x)}`),
      guard: p.npcs.filter(n => n.kind === 'guard').map(n => `${n.phase}@${Math.round(n.a.x)},${Math.round(n.a.y)}`), pet: p.pet ? `${p.pet.phase}@${Math.round(p.pet.x)},${Math.round(p.pet.y)}` : null, catUsed: p.catUsed } : { t, scene: tl.current?.constructor.name });
  }
  return out;
}

/* ---------- ảnh minh họa cho README ---------- */
async function postPng(c: HTMLCanvasElement, name: string): Promise<string> {
  const blob = await new Promise<Blob>(r => c.toBlob(b => r(b!), 'image/png'));
  const res = await fetch(`/__promo/save?dir=docs/images&name=${name}.png`, { method: 'POST', body: blob });
  return (await res.json()).file;
}
/** Chụp màn chơi sạch (không chữ quảng cáo) tại thời điểm cục bộ `local` của cảnh `sceneName`, lưu 540×960. */
async function shot(lang: Lang, sceneName: string, local: number, name: string): Promise<string> {
  await prepare();
  const s = makeScenes().find(x => x.constructor.name === sceneName);
  if (!s) throw new Error(`Không có cảnh ${sceneName}`);
  const st = newStudio(lang); st.clean = true;
  const tl = new Timeline(st), target = Math.round((s.start + local) * FPS);
  for (let i = 0; i <= target; i++) tl.update(i);
  tl.draw(target);
  const c = document.createElement('canvas'); c.width = 540; c.height = 960;
  const g = c.getContext('2d')!; g.imageSmoothingQuality = 'high'; g.drawImage(canvas, 0, 0, 540, 960);
  return postPng(c, name);
}
async function conceptSheet(): Promise<string> {
  await prepare();
  setLang('en');
  const c = document.createElement('canvas'); c.width = SHEET_W * 2; c.height = SHEET_H * 2;
  const g = c.getContext('2d')!; g.setTransform(2, 0, 0, 2, 0, 0); g.imageSmoothingQuality = 'high';
  drawConceptSheet(g, studioBase!.big);
  return postPng(c, 'concept-characters');
}
async function outfitSheet(lang: Lang = 'en'): Promise<string> {
  await prepare();
  const c = document.createElement('canvas'); c.width = OUTFIT_W * 2; c.height = OUTFIT_H * 2;
  const g = c.getContext('2d')!; g.setTransform(2, 0, 0, 2, 0, 0); g.imageSmoothingQuality = 'high';
  drawOutfitSheet(g, studioBase!.big, lang);
  return postPng(c, lang === 'vi' ? 'shop-outfits-vi' : 'shop-outfits');
}

(window as unknown as Record<string, unknown>).__promo = { exportVideo, still, preview, probe, inspect, shot, conceptSheet, outfitSheet, get status() { return statusEl.textContent; } };
document.getElementById('heading')!.textContent = `Video quảng bá · 1080×1920 · ${Math.floor(DURATION / 60)}:${String(Math.round(DURATION % 60)).padStart(2, '0')}`;
prepare().then(() => still('vi', 0.6)).then(() => status('Sẵn sàng. Bấm Xem thử hoặc Xuất MP4.'));

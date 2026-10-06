import { W, H, LEVELS, BENCHES, LANES, ALERT, depthScale } from './config';
import type { Tod } from './config';
import { loadSprites, renderBackground, drawSprite } from './art/sprites';
import { sfx } from './core/audio';
import { music, songForTod } from './core/music';
import { loadSave, writeSave } from './core/storage';
import { Play } from './game/play';
import type { EndResult } from './game/play';
import * as ui from './ui/screens';
import { setLang, getLang, detectLang } from './i18n';

const stage = document.getElementById('stage')!;
const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const save = loadSave();
sfx.muted = save.muted;
music.enabled = save.music;
setLang(save.lang ?? detectLang());

let scale = 1;
let bg: HTMLCanvasElement | null = null;
let bgKey = '';
let tod: Tod = 'sunset';
let play: Play | null = null;
let level = 1;
let ready = false;
let autoPause = true;

/* ---------- kích thước & nền ---------- */
async function refreshBackground(): Promise<void> {
  const key = `${tod}@${scale.toFixed(3)}`;
  if (key === bgKey) return;
  bgKey = key;
  const img = await renderBackground(tod, scale);
  if (bgKey === key) bg = img;
}
function resize(): void {
  const r = stage.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.max(1, Math.round(r.width * dpr));
  canvas.height = Math.max(1, Math.round(r.height * dpr));
  scale = canvas.width / W;
  if (ready) void refreshBackground();
}
new ResizeObserver(resize).observe(stage);

/* ---------- luồng màn hình ---------- */
const toggleMute = () => { save.muted = !save.muted; sfx.muted = save.muted; writeSave(save); };
const toggleMusic = () => { sfx.unlock(); save.music = !save.music; music.setEnabled(save.music); writeSave(save); };
const toggleLang = () => { save.lang = getLang() === 'vi' ? 'en' : 'vi'; setLang(save.lang); writeSave(save); };
const sound = { toggleMute, toggleMusic, toggleLang };
function goTitle(): void {
  play = null; tod = 'sunset'; void refreshBackground();
  music.duck(false); music.play('menu');
  ui.showTitle(save, { play: () => { sfx.unlock(); goLevels(); }, ...sound });
}
function goLevels(): void {
  play = null; tod = 'sunset'; void refreshBackground();
  music.duck(false); music.play('menu');
  ui.showLevels(save, { pick: n => goIntro(n), back: goTitle });
}
function goIntro(n: number): void {
  level = n; play = null;
  tod = LEVELS[n - 1].tod; void refreshBackground();
  music.play('menu');
  ui.showIntro(n, { start: () => startLevel(n), back: goLevels });
}
function startLevel(n: number): void {
  sfx.unlock();
  level = n;
  ui.clearScreen();
  play = new Play(LEVELS[n - 1], onEnd, pause, ui.toast);
  tod = play.def.tod; void refreshBackground();
  music.duck(false); music.play(songForTod(tod));
}
function pause(): void {
  if (!play || play.ended || play.paused) return;
  play.paused = true; play.releaseAll();
  music.duck(true);
  ui.showPause(save, {
    resume: () => { if (play) play.paused = false; music.duck(false); ui.clearScreen(); },
    restart: () => startLevel(level),
    levels: goLevels,
    ...sound,
  });
}
function onEnd(r: EndResult): void {
  const prev = save.best[r.level];
  let newBest = false;
  if (r.reason === 'win') {
    newBest = prev === undefined || r.total > prev;
    if (newBest) save.best[r.level] = r.total;
    save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, r.level + 1));
    if (r.boss) save.bossCleared = true;
    writeSave(save);
  }
  // sau đoạn nhạc thắng/thua thì quay lại nhạc menu, trừ khi người chơi đã vào màn mới
  window.setTimeout(() => { if (!play || play.ended) music.play('menu'); }, 1400);
  const hasNext = r.reason === 'win' && r.level < LEVELS.length;
  ui.showResult(r, newBest, { next: hasNext ? () => goIntro(r.level + 1) : null, retry: () => startLevel(r.level), levels: goLevels });
}

/* ---------- input ---------- */
function toWorld(e: PointerEvent): [number, number] {
  const r = canvas.getBoundingClientRect();
  return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
}
canvas.addEventListener('pointerdown', e => {
  if (!play) return;
  canvas.setPointerCapture(e.pointerId);
  play.pointerDown(e.pointerId, ...toWorld(e));
  e.preventDefault();
});
canvas.addEventListener('pointermove', e => { if (play) play.pointerMove(e.pointerId, ...toWorld(e)); });
canvas.addEventListener('pointerup', e => { if (play) play.pointerUp(e.pointerId); });
canvas.addEventListener('pointercancel', e => { if (play) play.pointerCancel(e.pointerId); });
canvas.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('keydown', e => {
  if (!play || play.paused) return;
  if (e.code === 'Space') e.preventDefault();
  if (!e.repeat) play.key(e.code, true);
});
window.addEventListener('keyup', e => { if (play) play.key(e.code, false); });
window.addEventListener('blur', () => play?.releaseAll());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (autoPause) { pause(); sfx.suspend(); } }
  else sfx.resume();
});
// Trình duyệt chỉ cho phát âm thanh sau thao tác đầu tiên: mở khóa ngay lúc đó để nhạc menu bắt đầu.
const firstGesture = () => { sfx.unlock(); window.removeEventListener('pointerdown', firstGesture); window.removeEventListener('keydown', firstGesture); };
window.addEventListener('pointerdown', firstGesture);
window.addEventListener('keydown', firstGesture);

/* ---------- vòng lặp ---------- */
function drawMenuScene(t: number): void {
  if (bg) ctx.drawImage(bg, 0, 0, W, H);
  for (const b of BENCHES) drawSprite(ctx, 'bench', b.x, b.y, depthScale(b.y));
  const s = depthScale(BENCHES[0].y + 3);
  drawSprite(ctx, 'studentM.lean', BENCHES[0].x - 17 * s, BENCHES[0].y + 3, s);
  drawSprite(ctx, 'studentF.lean', BENCHES[0].x + 17 * s, BENCHES[0].y + 3, s);
  const gx = 180 + Math.sin(t * 0.3) * 120;
  drawSprite(ctx, 'guard.idle', gx, LANES.mid + 8, depthScale(LANES.mid + 8), Math.cos(t * 0.3) < 0);
  drawSprite(ctx, 'bushFG', 190, 654, 1.55);
}
let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingQuality = 'high';
  if (play) { play.update(dt); play.render(ctx, bg); }
  else if (ready) drawMenuScene(now / 1000);
  else { ctx.fillStyle = '#FFC98A'; ctx.fillRect(0, 0, W, H); }
  music.intensity = play && !play.ended && (play.alert >= ALERT.suspicious || play.boss?.layer === 2) ? 1 : 0;
  requestAnimationFrame(frame);
}

async function boot(): Promise<void> {
  resize();
  requestAnimationFrame(frame);
  ui.showLoading(0);
  const fonts = Promise.race([
    Promise.all(['24px Bangers', '700 12px "Be Vietnam Pro"', '800 16px "Baloo 2"'].map(f => document.fonts.load(f))),
    new Promise(r => setTimeout(r, 2500)),
  ]);
  await Promise.all([fonts, loadSprites(p => ui.showLoading(p))]);
  ready = true;
  await refreshBackground();
  goTitle();
}
void boot();

// Móc kiểm thử khi chạy dev: điều khiển màn chơi từ console.
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__ncpd = {
    get play() { return play; }, startLevel, save, music, sfx,
    set autoPause(v: boolean) { autoPause = v; },
    render: () => { ctx.setTransform(scale, 0, 0, scale, 0, 0); play?.render(ctx, bg); },
  };
}

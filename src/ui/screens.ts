import { LEVELS } from '../config';
import { playerFrontSvg, poopSvg } from '../art/sprites';
import { fmt } from '../core/util';
import { t } from '../i18n';
import type { Key } from '../i18n';
import type { SaveData } from '../core/storage';
import type { EndResult } from '../game/play';

const overlay = () => document.getElementById('overlay')!;

function mount(html: string, cls = ''): HTMLElement {
  const el = document.createElement('div');
  el.className = `screen ${cls}`;
  el.innerHTML = html;
  overlay().replaceChildren(el);
  el.querySelector<HTMLElement>('.btn:not([disabled])')?.focus({ preventScroll: true });
  return el;
}
export function clearScreen(): void { overlay().replaceChildren(); }
const on = (el: HTMLElement, sel: string, fn: () => void) => el.querySelector(sel)?.addEventListener('click', fn);
const art = (svg: string, vb = '-60 -125 120 135') => `<div class="hero-art"><svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${svg}</svg></div>`;

export function showLoading(p: number): void {
  mount(`<h2>${t('loading')}</h2><p>${Math.round(p * 100)}%</p>`, 'solid');
}

/** Nhạc, âm thanh, ngôn ngữ: có ở màn hình chính và màn tạm dừng. */
export interface Settings { toggleMute: () => void; toggleMusic: () => void; toggleLang: () => void }
const settingsBtns = (save: SaveData) => `
      <div class="btn-row">
        <button class="btn ghost small" id="b-music">${t(save.music ? 'sound.musicOn' : 'sound.musicOff')}</button>
        <button class="btn ghost small" id="b-mute">${t(save.muted ? 'sound.sfxOff' : 'sound.sfxOn')}</button>
      </div>
      <button class="btn ghost small" id="b-lang" aria-label="Language / Ngôn ngữ">${t('lang.button')}</button>`;
function bindSettings(el: HTMLElement, h: Settings, redraw: () => void): void {
  on(el, '#b-mute', () => { h.toggleMute(); redraw(); });
  on(el, '#b-music', () => { h.toggleMusic(); redraw(); });
  on(el, '#b-lang', () => { h.toggleLang(); redraw(); });
}

export function showTitle(save: SaveData, h: { play: () => void } & Settings): void {
  const el = mount(`
    ${art(playerFrontSvg('sneaky') + poopSvg('normal', { x: 40, y: 0, s: 0.42 }) + poopSvg('gold', { x: -42, y: -2, s: 0.32 }))}
    <h1>${t('title.h1')}</h1>
    <p>${t('title.lede')}</p>
    <div class="btns">
      <button class="btn pink" id="b-play">${t(save.unlocked > 1 ? 'title.continue' : 'title.play')}</button>
      ${settingsBtns(save)}
    </div>
    <span class="hint">${t('title.hint')}</span>`, 'solid');
  on(el, '#b-play', h.play);
  bindSettings(el, h, () => showTitle(save, h));
}

export function showLevels(save: SaveData, h: { pick: (n: number) => void; back: () => void }): void {
  const cells = LEVELS.map(l => {
    const locked = l.n > save.unlocked, best = save.best[l.n];
    const done = best !== undefined;
    return `<button class="lvl ${l.boss ? 'boss' : ''} ${done && !l.boss ? 'done' : ''}" data-n="${l.n}" ${locked ? 'disabled' : ''} aria-label="${t('levels.aria', { n: l.n })}${locked ? t('levels.locked') : ''}">
      ${l.boss ? '👑' : l.n}<small>${locked ? '🔒' : done ? fmt(best) : l.boss ? t('levels.boss') : t('levels.new')}</small></button>`;
  }).join('');
  const el = mount(`<h2>${t('levels.title')}</h2><div class="levels">${cells}</div>
    <div class="btns"><button class="btn ghost" id="b-back">${t('btn.back')}</button></div>`, 'solid');
  el.querySelectorAll<HTMLButtonElement>('.lvl').forEach(b => b.addEventListener('click', () => h.pick(Number(b.dataset.n))));
  on(el, '#b-back', h.back);
}

export function showIntro(n: number, h: { start: () => void; back: () => void }): void {
  const l = LEVELS[n - 1];
  const goal = l.boss ? t('intro.bossGoal') : t('intro.goal', { n: l.goal });
  const el = mount(`
    <span class="tag">${l.boss ? t('intro.boss') : t('intro.level', { n })}</span>
    <h2>${l.boss ? t('intro.bossName') : goal}</h2>
    <p>${l.boss ? t('intro.bossDesc', { goal, time: l.time }) : t('intro.desc', { time: l.time })}</p>
    <div class="new-list">${l.news.map(k => `<span>${t('intro.new', { x: t(`news.${k}` as Key) })}</span>`).join('')}</div>
    <div class="panel"><p style="max-width:none">${t(`tip.${n}` as Key)}</p></div>
    <div class="btns"><button class="btn pink" id="b-go">${t('intro.start')}</button><button class="btn ghost" id="b-back">${t('intro.other')}</button></div>`);
  on(el, '#b-go', h.start);
  on(el, '#b-back', h.back);
}

export function showPause(save: SaveData, h: { resume: () => void; restart: () => void; levels: () => void } & Settings): void {
  const el = mount(`<h2>${t('pause.title')}</h2>
    <div class="btns">
      <button class="btn pink" id="b-resume">${t('pause.resume')}</button>
      <button class="btn" id="b-restart">${t('pause.restart')}</button>
      <button class="btn ghost" id="b-levels">${t('btn.levels')}</button>
      ${settingsBtns(save)}
    </div>`);
  on(el, '#b-resume', h.resume);
  on(el, '#b-restart', h.restart);
  on(el, '#b-levels', h.levels);
  bindSettings(el, h, () => showPause(save, h));
}

export function showResult(r: EndResult, newBest: boolean, h: { next: (() => void) | null; retry: () => void; levels: () => void }): void {
  let head: string, body = '', figure: string;
  if (r.reason === 'win' && r.boss) {
    figure = art(playerFrontSvg('dizzy'));
    head = t('result.bossWin'); body = t('result.bossWinBody');
  } else if (r.reason === 'win') {
    figure = art(playerFrontSvg('happy'));
    head = t('result.win');
  } else if (r.reason === 'caught') {
    figure = art(playerFrontSvg('shock'));
    head = t('result.caught'); body = t('result.caughtBody');
  } else {
    figure = art(playerFrontSvg('dizzy'));
    head = t('result.timeup'); body = t('result.timeupBody', { a: r.broken, b: r.goal });
  }
  const rows = r.reason === 'win'
    ? `<span>${t('result.throwPts')}</span><b>${fmt(r.score)}</b>
       <span>${t('result.timeBonus')}</span><b>+${fmt(r.timeBonus)}</b>
       ${r.eldersBonus ? `<span>${t('result.eldersBonus')}</span><b>+${fmt(r.eldersBonus)}</b>` : ''}
       <span>${t('result.maxCombo')}</span><b>${r.maxCombo}</b>
       <span class="total">${t('result.total')}</span><b class="total">${fmt(r.total)}</b>`
    : `<span>${t('result.points')}</span><b>${fmt(r.score)}</b><span>${t('result.maxCombo')}</span><b>${r.maxCombo}</b>`;
  const el = mount(`${figure}<h2>${head}</h2>${body ? `<p>${body}</p>` : ''}
    <div class="panel">${newBest ? `<span class="tag" style="align-self:center;background:#FFD23F">${t('result.newBest')}</span>` : ''}<div class="rows">${rows}</div></div>
    <div class="btns">
      ${h.next ? `<button class="btn pink" id="b-next">${t('result.next')}</button>` : ''}
      <button class="btn${h.next ? ' ghost' : ' pink'}" id="b-retry">${t('result.retry')}</button>
      <button class="btn ghost" id="b-levels">${t('btn.levels')}</button>
    </div>`);
  if (h.next) on(el, '#b-next', h.next);
  on(el, '#b-retry', h.retry);
  on(el, '#b-levels', h.levels);
}

let toastTimer = 0;
export function toast(title: string, body = ''): void {
  const el = document.getElementById('toast')!;
  el.innerHTML = `<div class="t"><b>${title}</b>${body}</div>`;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { el.innerHTML = ''; }, 1600);
}

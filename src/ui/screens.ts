import { LEVELS } from '../config';
import { playerFrontSvg, poopSvg, catSvg } from '../art/sprites';
import { SKINS, SKIN_ORDER, CAT_PRICE } from '../skins';
import type { SkinId } from '../skins';
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
const art = (svg: string, vb = '-60 -125 120 135', cls = '') => `<div class="hero-art ${cls}"><svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${svg}</svg></div>`;

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

export function showTitle(save: SaveData, h: { play: () => void; shop: () => void } & Settings): void {
  const el = mount(`
    ${art(playerFrontSvg('sneaky', save.skin) + poopSvg('normal', { x: 40, y: 0, s: 0.42 }) + poopSvg('gold', { x: -42, y: -2, s: 0.32 }), undefined, 'title-art')}
    <h1>${t('title.h1')}</h1>
    <p>${t('title.lede')}</p>
    <div class="btns">
      <button class="btn pink" id="b-play">${t(save.unlocked > 1 ? 'title.continue' : 'title.play')}</button>
      <button class="btn" id="b-shop">${t('title.shop')}</button>
      ${settingsBtns(save)}
    </div>
    <span class="hint">${t('title.hint')}</span>`, 'solid');
  on(el, '#b-play', h.play);
  on(el, '#b-shop', h.shop);
  bindSettings(el, h, () => showTitle(save, h));
}

export function showLevels(save: SaveData, h: { pick: (n: number) => void; back: () => void; shop: () => void }): void {
  const cells = LEVELS.map(l => {
    const locked = l.n > save.unlocked, best = save.best[l.n];
    const done = best !== undefined;
    return `<button class="lvl ${l.boss ? 'boss' : ''} ${done && !l.boss ? 'done' : ''}" data-n="${l.n}" ${locked ? 'disabled' : ''} aria-label="${t('levels.aria', { n: l.n })}${locked ? t('levels.locked') : ''}">
      ${l.boss ? '👑' : l.n}<small>${locked ? '🔒' : done ? fmt(best) : l.boss ? t('levels.boss') : t('levels.new')}</small></button>`;
  }).join('');
  const el = mount(`<h2>${t('levels.title')}</h2><div class="levels">${cells}</div>
    <div class="btns"><button class="btn" id="b-shop">${t('title.shop')} · ${fmt(save.wallet)}</button><button class="btn ghost" id="b-back">${t('btn.back')}</button></div>`, 'solid');
  on(el, '#b-shop', h.shop);
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

export interface ResultExtra { earned: number; catUnlocked: boolean; skin: SkinId }
export function showResult(r: EndResult, newBest: boolean, x: ResultExtra, h: { next: (() => void) | null; retry: () => void; levels: () => void }): void {
  let head: string, body = '', figure: string;
  if (r.reason === 'win' && r.boss) {
    figure = art(playerFrontSvg('dizzy', x.skin) + `<g transform="translate(44 0)">${catSvg('happy')}</g>`);
    head = t('result.bossWin'); body = t('result.bossWinBody');
  } else if (r.reason === 'win') {
    figure = art(playerFrontSvg('happy', x.skin));
    head = t('result.win');
  } else if (r.reason === 'caught') {
    figure = art(playerFrontSvg('shock', x.skin));
    head = t('result.caught'); body = t('result.caughtBody');
  } else {
    figure = art(playerFrontSvg('dizzy', x.skin));
    head = t('result.timeup'); body = t('result.timeupBody', { a: r.broken, b: r.goal });
  }
  const rows = r.reason === 'win'
    ? `<span>${t('result.throwPts')}</span><b>${fmt(r.score)}</b>
       <span>${t('result.timeBonus')}</span><b>+${fmt(r.timeBonus)}</b>
       ${r.eldersBonus ? `<span>${t('result.eldersBonus')}</span><b>+${fmt(r.eldersBonus)}</b>` : ''}
       <span>${t('result.maxCombo')}</span><b>${r.maxCombo}</b>
       <span class="total">${t('result.total')}</span><b class="total">${fmt(r.total)}</b>
       <span>${t('result.wallet')}</span><b>💰 +${fmt(x.earned)}</b>`
    : `<span>${t('result.points')}</span><b>${fmt(r.score)}</b><span>${t('result.maxCombo')}</span><b>${r.maxCombo}</b>
       <span>${t('result.wallet')}</span><b>💰 +${fmt(x.earned)}</b>`;
  const el = mount(`${figure}<h2>${head}</h2>${body ? `<p>${body}</p>` : ''}
    <div class="panel">${newBest ? `<span class="tag" style="align-self:center;background:#FFD23F">${t('result.newBest')}</span>` : ''}${x.catUnlocked ? `<span class="tag" style="align-self:center;background:#FF9EC4">${t('result.catUnlocked')}</span>` : ''}<div class="rows">${rows}</div></div>
    <div class="btns">
      ${h.next ? `<button class="btn pink" id="b-next">${t('result.next')}</button>` : ''}
      <button class="btn${h.next ? ' ghost' : ' pink'}" id="b-retry">${t('result.retry')}</button>
      <button class="btn ghost" id="b-levels">${t('btn.levels')}</button>
    </div>`);
  if (h.next) on(el, '#b-next', h.next);
  on(el, '#b-retry', h.retry);
  on(el, '#b-levels', h.levels);
}

/* ---------- cửa hàng ---------- */
export interface ShopHandlers { buy: (item: SkinId | 'cat') => boolean; equip: (skin: SkinId) => void; toggleCat: () => void; back: () => void }
/** Món đang chờ bấm lần hai để xác nhận mua. */
let pendingBuy: SkinId | 'cat' | null = null;

function buyButton(save: SaveData, item: SkinId | 'cat', price: number): string {
  if (save.wallet < price) return `<button class="btn small ghost" disabled>${t('shop.need', { n: fmt(price) })}</button>`;
  const confirm = pendingBuy === item;
  return `<button class="btn small ${confirm ? 'pink' : ''}" data-buy="${item}">${t(confirm ? 'shop.confirm' : 'shop.buy', { n: fmt(price) })}</button>`;
}

export function showShop(save: SaveData, h: ShopHandlers): void {
  // giữ vị trí cuộn khi vẽ lại sau mỗi lần bấm
  const keepScroll = document.querySelector<HTMLElement>('#overlay .shop-scroll')?.scrollTop ?? 0;
  const cards = SKIN_ORDER.map(id => {
    const owned = save.skins.includes(id), worn = save.skin === id;
    const btn = worn ? `<button class="btn small ghost" disabled>${t('shop.equipped')}</button>`
      : owned ? `<button class="btn small ghost" data-equip="${id}">${t('shop.equip')}</button>`
      : buyButton(save, id, SKINS[id].price);
    return `<div class="skin-card${worn ? ' worn' : ''}">
      <div class="skin-art"><svg viewBox="-58 -130 116 136" aria-hidden="true">${playerFrontSvg(worn || owned ? 'happy' : 'sneaky', id)}</svg></div>
      <b>${t(`skin.${id}` as Key)}</b><small>${t(`skin.${id}.perk` as Key)}</small>${btn}</div>`;
  }).join('');
  const petBtn = save.cat
    ? `<button class="btn small ${save.catOn ? '' : 'ghost'}" data-cat="toggle">${t(save.catOn ? 'pet.on' : 'pet.off')}</button>`
    : `<small>${t('pet.locked')}</small>${buyButton(save, 'cat', CAT_PRICE)}`;
  const el = mount(`
    <div class="shop-head"><h2>${t('shop.title')}</h2><span class="wallet">${t('shop.wallet', { n: fmt(save.wallet) })}</span></div>
    <div class="shop-scroll">
      <p class="hint">${t('shop.hint')}</p>
      <h3>${t('shop.skins')}</h3>
      <div class="skin-grid">${cards}</div>
      <h3>${t('shop.pet')}</h3>
      <div class="pet-card${save.cat && save.catOn ? ' worn' : ''}">
        <div class="pet-art"><svg viewBox="-26 -58 56 62" aria-hidden="true">${catSvg(save.cat ? 'happy' : 'jealous')}</svg></div>
        <div class="pet-info"><b>${t('pet.cat')}</b><small>${t('pet.cat.perk')}</small>${petBtn}</div>
      </div>
    </div>
    <div class="btns"><button class="btn ghost" id="b-back">${t('btn.back')}</button></div>`, 'solid shop');
  el.querySelector<HTMLElement>('.shop-scroll')!.scrollTop = keepScroll;
  const redraw = () => showShop(save, h);
  el.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach(b => b.addEventListener('click', () => {
    const item = b.dataset.buy as SkinId | 'cat';
    if (pendingBuy !== item) { pendingBuy = item; redraw(); return; }
    pendingBuy = null;
    h.buy(item);
    redraw();
  }));
  el.querySelectorAll<HTMLButtonElement>('[data-equip]').forEach(b => b.addEventListener('click', () => { pendingBuy = null; h.equip(b.dataset.equip as SkinId); redraw(); }));
  on(el, '[data-cat]', () => { pendingBuy = null; h.toggleCat(); redraw(); });
  on(el, '#b-back', () => { pendingBuy = null; h.back(); });
}

let toastTimer = 0;
export function toast(title: string, body = ''): void {
  const el = document.getElementById('toast')!;
  el.innerHTML = `<div class="t"><b>${title}</b>${body}</div>`;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { el.innerHTML = ''; }, 1600);
}

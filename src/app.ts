/* nivo – Nigeria elections. Views, state and the interactive map (hit-mask canvas + borders + LGA shapes).
   Result tables live in ./data/results (LGA_RESULTS, STATE_RESULTS_2015, STATE_RESULTS_2019). */
import STYLE from './styles.css';
import EXTRA from './extra.css';
import SHELL from './shell.html';
// import UI from './ui.css';
import { OUTLINE, BORDERS, MASK, KEYS, BB, SO, LG } from './data/map-data';
import { LOGO, LOGO_RATIO } from './data/brand';
import { LGA_RESULTS, STATE_RESULTS_2015, STATE_RESULTS_2019 } from './data/results';
import type { StateResult } from './data/results';

const FONTS = "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@500&family=Archivo+Narrow:wght@700&display=swap";
const CREATED = 2026;                       // year nivo was created (footer)
/* Feedback form: create a free form at formspree.io (or any endpoint that accepts a JSON POST) and paste its URL here. */
const FEEDBACK_ENDPOINT = 'https://formspree.io/f/mwlljqwj';

const footerHtml = (): string => {
  const now = new Date().getFullYear(), yrs = now > CREATED ? `${CREATED}–${now}` : `${CREATED}`;
  return `<footer class="ft"><div class="ft-in"><p class="ft-c">© ${yrs} nivo. All rights reserved.</p><nav class="ft-n" aria-label="Footer"><a href="#about">About</a><a href="#feedback">Feedback</a><a href="#method">Methodology</a></nav><p class="ft-b">Built &amp; designed by <a href="https://praiseibe.com" target="_blank" rel="noopener noreferrer" style="text-decoration: underline;">Praise</a> &amp; <a href="https://taiwoariyo.framer.website" target="_blank" rel="noopener noreferrer" style="text-decoration: underline;">Taiwo</a></p></div></footer>`;
};

export function mount(): void {
  let th = ''; try { th = localStorage.getItem('nivo-theme') || '' } catch { }       // theme first → no flash of the wrong palette
  document.documentElement.dataset.theme = th || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = FONTS; document.head.append(l);
  for (const css of [STYLE, EXTRA]) { const s = document.createElement('style'); s.textContent = css; document.head.append(s) }
  document.title = 'nivo – For Nigerian Voters';
  document.body.insertAdjacentHTML('afterbegin', SHELL);
  document.body.insertAdjacentHTML('beforeend', footerHtml());
  const img = `<img class="brand-logo" src="${LOGO}" width="${Math.round(28 * LOGO_RATIO)}" height="28" alt="nivo">`;
  const slot = document.querySelector('#logo, .logo, [data-logo], .brand');
  if (slot) slot.innerHTML = img; else (document.querySelector('header') || document.body).insertAdjacentHTML('afterbegin', img);
  main();
}

/* ------------------------------------------------------------------ */
/*  Data: name matching so every map LGA finds its result row          */
/* ------------------------------------------------------------------ */
const norm = (s: string) => s.toLowerCase().replace(/\bstate\b/g, '').trim()
  .replace(/^(federal capital territory|fct)$/, 'fct abuja').replace(/nassarawa/, 'nasarawa').replace(/[^a-z]/g, '');
const STATE_KEY: Record<string, string> = {};
for (const full of Object.keys(LG)) STATE_KEY[norm(full)] = full;
const fullName = (s: string) => STATE_KEY[norm(s)] ?? s;

const nl = (s: string) => s.toLowerCase().replace(/local government( area)?|area council|municipal council|\bm\.?\s?c\.?(?=\s|$)|\blga\b/g, '').replace(/[^a-z]/g, '');
const lev = (a: string, b: string) => {
  if (Math.abs(a.length - b.length) > 3) return 9;
  let p = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) { const c = [i]; for (let j = 1; j <= b.length; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c }
  return p[b.length];
};

// 2023 results, keyed by the MAP's LGA names → [APC, PDP, LP, NNPP]. LGAs with no matching row are simply absent (shown grey).
const LGA_2023: Record<string, Record<string, number[]>> = {};
const STATE_2023: Record<string, number[]> = {};
const NO_DATA: string[] = [];
for (const full of Object.keys(LG)) {
  const rows = Object.entries(LGA_RESULTS).find(([k]) => norm(k) === norm(full))?.[1] ?? [], tot = [0, 0, 0, 0];
  const pool = rows.map(([name, apc, lp, pdp, nnpp]) => { tot[0] += apc; tot[1] += pdp; tot[2] += lp; tot[3] += nnpp; return { k: nl(name), v: [apc, pdp, lp, nnpp], used: false } });
  STATE_2023[full] = tot;
  const out: Record<string, number[]> = LGA_2023[full] = {}, todo: string[] = [];
  for (const [name] of LG[full]) { const k = nl(name), hit = pool.find(r => !r.used && r.k === k); if (hit) { hit.used = true; out[name] = hit.v } else todo.push(name) }
  for (const name of todo) {                                   // second pass: prefixes + near-misses ("Danbata" ≈ "Dambatta")
    const k = nl(name); let best: (typeof pool)[number] | undefined, bd = 99;
    for (const r of pool) if (!r.used) { const d = (k.length > 4 && r.k.length > 4 && (k.startsWith(r.k) || r.k.startsWith(k))) ? 0 : lev(k, r.k); if (d < bd) { bd = d; best = r } }
    if (best && bd <= Math.max(2, Math.round(k.length * .25))) { best.used = true; out[name] = best.v } else NO_DATA.push(`${full} › ${name}`);
  }
}
if (NO_DATA.length) console.info(`[nivo] ${NO_DATA.length} LGAs have no 2023 result row (shown grey):`, NO_DATA);

// 2015 / 2019 state tables → [APC, PDP, Others]
const YEAR_STATE: Record<string, Record<string, number[]>> = { '2019': {}, '2015': {} };
for (const [y, src] of [['2019', STATE_RESULTS_2019], ['2015', STATE_RESULTS_2015]] as [string, Record<string, StateResult>][])
  for (const [s, r] of Object.entries(src)) YEAR_STATE[y][fullName(s)] = [r.apc, r.pdp, r.other];

const NAT_2023 = [8794726, 6984520, 6101533, 1496687];       // APC PDP LP NNPP (official)
const natFor = (y: string): number[] => y === '2023' ? NAT_2023.slice() : Object.values(YEAR_STATE[y]).reduce((a, v) => a.map((x, i) => x + v[i]), [0, 0, 0]);
const winsOf = (rows: number[][], n: number) => { const w = new Array(n).fill(0); for (const v of rows) { let b = 0; for (let i = 1; i < n; i++) if (v[i] > v[b]) b = i; if (v[b] > 0) w[b]++ } return w };
const LG_WINS_2023 = winsOf(Object.values(LGA_2023).flatMap(s => Object.values(s)), 4);
const REG: Record<string, number> = { '2023': 93469008, '2019': 82300000, '2015': 67422005 };
const CAST: Record<string, number> = { '2023': 24965218, '2019': 28614190, '2015': 29432083 };
const PVC_2023 = 93.3;                                       // % of registered voters who collected a PVC
const turnout = (y: string) => CAST[y] / REG[y] * 100;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function main(): void {
  /* ---------- parties & candidates differ per election ---------- */
  const PTY: Record<string, any> = {
    APC: { k: 'APC', n: 'All Progressives Congress', fill: 'var(--blu500)', edge: 'var(--blu600)', tint: 'var(--blu50)', ink: 'var(--blu600)' },
    PDP: { k: 'PDP', n: 'Peoples Democratic Party', fill: 'var(--red500)', edge: 'var(--red600)', tint: 'var(--red50)', ink: 'var(--red600)' },
    LP: { k: 'LP', n: 'Labour Party', fill: 'var(--grn500)', edge: 'var(--grn600)', tint: 'var(--grn50)', ink: 'var(--grn800)' },
    NNPP: { k: 'NNPP', n: 'New Nigeria People’s Party', fill: 'var(--pur400)', edge: 'var(--pur500)', tint: 'var(--g50)', ink: 'var(--g800)' },
    OTH: { k: 'Others', n: 'All other parties', fill: '#9a9a9a', edge: '#7d7d7d', tint: 'var(--g50)', ink: 'var(--g800)', w: 'Other candidates', wiki: '' },
  };
  const mk = (k: string, w: string, wiki: string) => ({ ...PTY[k], w, wiki });
  const YP: Record<string, any[]> = {
    '2023': [mk('APC', 'Bola Ahmed Tinubu', 'Bola_Tinubu'), mk('PDP', 'Abubakar Atiku', 'Atiku_Abubakar'), mk('LP', 'Peter Gregory Obi', 'Peter_Obi'), mk('NNPP', 'Musa Mohammed Rabiu Kwankwaso', 'Rabiu_Kwankwaso')],
    '2019': [mk('APC', 'Muhammadu Buhari', 'Muhammadu_Buhari'), mk('PDP', 'Atiku Abubakar', 'Atiku_Abubakar'), PTY.OTH],
    '2015': [mk('APC', 'Muhammadu Buhari', 'Muhammadu_Buhari'), mk('PDP', 'Goodluck Jonathan', 'Goodluck_Jonathan'), PTY.OTH],
  };
  const YEARS = ['2023', '2019', '2015'], PREV: Record<string, string> = { '2023': '2019', '2019': '2015' };
  let P = YP['2023'];
  const col = (i: number) => P[i].fill;

  const GEO: Record<string, string[]> = Object.fromEntries(Object.keys(LG).sort().map(k => [k, LG[k].map(x => x[0])]));
  const LGAS: { n: string; s: string }[] = Object.entries(GEO).flatMap(([s, l]) => l.map(n => ({ n, s })));
  const STATES: { n: string; s: string }[] = Object.keys(GEO).map(s => ({ n: s.replace(/ State$/, ''), s }));
  const S = { y: '2023', st: '', lga: '', srch: 0, view: 'nat' as 'nat' | 'state' | 'lga', all: 0, z: 1, px: 0, py: 0, c1: '', c2: '' };
  const hasLga = () => S.y === '2023';
  const UNITS = () => hasLga() ? LGAS : STATES;
  const mob = matchMedia('(max-width:600px)'), mob900 = matchMedia('(max-width:900px)');
  const $ = (s: string): any => document.querySelector(s), fmt = (n: number) => Math.round(n).toLocaleString('en-US'), RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDark = () => document.documentElement.dataset.theme === 'dark';
  const gt = (name: string, p: any) => (window as any).gtag?.('event', name, p);

  function votes(name: string, _big?: boolean | number): number[] {
    if (name === 'nat' || name === 'National') return natFor(S.y);
    const m = S.y === '2023' ? STATE_2023 : YEAR_STATE[S.y];
    return (m[fullName(name)] ?? P.map(() => 0)).slice();
  }
  const lvt = (lga: string, state: string, _x = ''): number[] => hasLga() ? (LGA_2023[fullName(state)]?.[lga] ?? [0, 0, 0, 0]).slice() : P.map(() => 0);
  const uv = (u: { n: string; s: string }) => hasLga() ? lvt(u.n, u.s) : votes(u.s);
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0), rank = (v: number[]) => v.map((x, i) => [x, i]).sort((a, b) => b[0] - a[0]);
  const rk = (v: number[]) => rank(v).filter(([, i]) => P[i].k !== 'Others');           // ranking for "who won" – "Others" is never the winner
  const stateWins = () => winsOf(Object.values(S.y === '2023' ? STATE_2023 : YEAR_STATE[S.y]).map(v => v.slice(0, P.length)), P.length);
  const setYear = (y: string) => {
    const was = hasLga(); S.y = y; P = YP[y];
    if (!hasLga()) { S.lga = ''; if (S.view === 'lga') S.view = 'state' }
    if (was !== hasLga()) { S.c1 = S.c2 = ''; S.srch = 0 }
  };
  const winnerOf = (y: string, st: string): string => {
    const v = (y === '2023' ? STATE_2023 : YEAR_STATE[y])[st]; if (!v || !sum(v)) return '';
    const pp = YP[y]; let b = 0; for (let i = 1; i < pp.length; i++) if (pp[i].k !== 'Others' && v[i] > v[b]) b = i; return pp[b].k;
  };

  /* ---------- colour helpers ---------- */
  const probe = document.createElement('i'); probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none'; document.body.append(probe);
  const rgbOf = (c: string): [number, number, number] => { probe.style.color = c; const m = getComputedStyle(probe).color.match(/[\d.]+/g)!; return [+m[0], +m[1], +m[2]] };
  const abgr = ([r, g, b]: number[], a = 255) => ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
  /** LGA fill: party colour, stronger the bigger the winner's share; grey ("fill-disabled") when we have no data. */
  const lgaFill = (st: string, n: string) => {
    const v = lvt(n, st), t = sum(v); if (!t) return { nd: true, fill: 'var(--fill-disabled)' };
    const [x, i] = rk(v)[0], mix = Math.max(38, Math.min(100, 18 + x / t * 100 * 1.35));
    return { nd: false, fill: `color-mix(in srgb, ${col(i)} ${mix.toFixed(0)}%, var(--g100))` };
  };

  const sel = (id: string, o: (string | string[])[], val: string, cls = '', ph?: string) => `<select class="sel ${cls}" id="${id}" aria-label="${ph || id}">${ph ? `<option value="" disabled ${val ? '' : 'selected'}>${ph}</option>` : ''}${o.map(x => { const [v, l] = Array.isArray(x) ? x : [x, x]; return `<option value="${v}"${v === val ? ' selected' : ''}>${l}</option>` }).join('')}</select>`;
  const I: Record<string, string> = { fit: '<path d="M4 8V4h4M16 8V4h-4M4 12v4h4M16 12v4h-4"/>', left: '<path d="m12 5-5 5 5 5"/>', x: '<circle cx="10" cy="10" r="8" fill="#919191" stroke="none"/><path d="m7.5 7.5 5 5m0-5-5 5" stroke="#e4e4e4"/>', sel: '<path d="M6.5 8 10 4.5 13.5 8M6.5 12l3.5 3.5 3.5-3.5"/>', right: '<path d="m8 5 5 5-5 5"/>', add: '<path d="M10 4v12M4 10h12"/>', rem: '<path d="M4 10h12"/>', search: '<circle cx="9" cy="9" r="5"/><path d="m13 13 4 4"/>', back: '<path d="M16 10H4m5-5-5 5 5 5"/>', down: '<path d="m5 8 5 5 5-5"/>', arrow: '<path d="M4 10h12m-4-4 4 4-4 4"/>' };
  const ic = (k: string, s = 20, c = '#767676') => `<svg width="${s}" height="${s}" viewBox="0 0 20 20" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]}</svg>`;
  const layers = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" aria-hidden="true"><path d="m8 2 6 3-6 3-6-3zM2 8l6 3 6-3M2 11l6 3 6-3"/></svg>`;
  const note = (txt: string, cls = '') => `<div class="note sm ${cls}">${layers}<p>${txt}</p></div>`;

  /* ---------- dropdown polish: hug the selected text, drop the native focus box after choosing ---------- */
  const mctx = document.createElement('canvas').getContext('2d')!;
  const fit = (s: HTMLSelectElement | null) => {
    if (!s || !s.options.length || !s.offsetParent) return;
    const cs = getComputedStyle(s); mctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const w = mctx.measureText(s.options[s.selectedIndex]?.text || '').width;
    s.style.width = Math.ceil(w + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth) + 2) + 'px';
  };
  const fitAll = () => ['#st', '#lga', '#year'].forEach(q => fit($(q)));
  const done = (e: any) => e.target?.blur?.();

  /* ---------- searchable dropdown (compare page) ---------- */
  const combo = (id: string, items: string[][], val: string, ph: string) => `<div class="cb" id="${id}"><input class="sel cbi" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="${id}-l" autocomplete="off" spellcheck="false" placeholder="${ph}" aria-label="${ph}" value="${esc(items.find(x => x[0] === val)?.[1] ?? '')}"><ul class="cbl" id="${id}-l" role="listbox" hidden></ul></div>`;
  function bindCombo(id: string, items: string[][], val: string, onPick: (v: string) => void) {
    const root = $('#' + id), inp = root.querySelector('input') as HTMLInputElement, ul = root.querySelector('ul') as HTMLElement, label = items.find(x => x[0] === val)?.[1] ?? '';
    let act = -1, shown: string[][] = [];
    const paint = () => { ul.querySelectorAll('li').forEach((li, i) => li.classList.toggle('on', i === act)); (ul.children[act] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' }) };
    const open = (q: string) => { const k = q.trim().toLowerCase(); shown = (k ? items.filter(x => x[1].toLowerCase().includes(k)) : items).slice(0, 80); act = k && shown.length ? 0 : -1; ul.innerHTML = shown.map((x, i) => `<li role="option" data-i="${i}">${esc(x[1])}</li>`).join('') || '<li class="none">No match</li>'; ul.hidden = false; inp.setAttribute('aria-expanded', 'true'); paint() };
    const close = () => { ul.hidden = true; inp.setAttribute('aria-expanded', 'false') };
    const pick = (i: number) => { const it = shown[i]; if (!it) return; inp.value = it[1]; close(); inp.blur(); onPick(it[0]) };
    inp.onfocus = () => { inp.select(); open('') };
    inp.oninput = () => open(inp.value);
    inp.onkeydown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (ul.hidden) open(inp.value); act = Math.min(shown.length - 1, act + 1); paint() }
      else if (e.key === 'ArrowUp') { e.preventDefault(); act = Math.max(0, act - 1); paint() }
      else if (e.key === 'Enter') { e.preventDefault(); pick(act >= 0 ? act : 0) }
      else if (e.key === 'Escape') { inp.value = label; inp.blur() }
    };
    ul.onmousedown = (e: MouseEvent) => { e.preventDefault(); const li = (e.target as HTMLElement).closest('li[data-i]') as HTMLElement | null; if (li) pick(+li.dataset.i!) };
    inp.onblur = () => { close(); inp.value = label };
  }

  async function loadElectionNews() {
    const feed = $('#news-feed'); if (!feed) return;
    try {
      const rssUrl = encodeURIComponent('https://onyeakuko.online/');
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
      if (!res.ok) throw new Error('API unreachable');
      const data = await res.json(); if (data.status !== 'ok') throw new Error('Feed failed');
      const kw = ['election', '2027', 'inec', 'obi', 'tinubu', 'atiku', 'adc', 'apc', 'campaign', 'poll', 'ballot', 'candidate'];
      const items = (data.items || []).filter((a: any) => { const t = (a.title + ' ' + (a.description || '')).toLowerCase(); return kw.some(k => t.includes(k)) }).slice(0, 5);
      if (!items.length) { feed.innerHTML = `<p class="sm sub" style="padding:12px 0;">No new election updates at the moment.</p>`; return }
      feed.innerHTML = items.map((n: any) => `<a href="${n.link}" target="_blank" rel="noopener noreferrer" class="cl" style="--c:var(--blu500);text-decoration:none;align-items:flex-start;cursor:pointer;"><div class="fl"><p class="md" style="color:var(--g900);margin-bottom:4px;">${n.title}</p><p class="xs sub">${new Date(n.pubDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })} · OnyeAkụkọ</p></div></a>`).join('');
    } catch { feed.innerHTML = `<div class="note sm" style="margin-top:12px;">${layers}<p>Could not load live news. <a href="https://onyeakuko.online" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;">Check OnyeAkụkọ directly</a>.</p></div>` }
  }

  /* ---------- candidate photos (Wikipedia thumbnail, cached, falls back to initials) ---------- */
  const IMG: Record<string, string> = {}; try { Object.assign(IMG, JSON.parse(localStorage.getItem('nivo-img') || '{}')) } catch { }
  const pend: Record<string, Promise<void>> = {};
  const loadImg = (w: string): Promise<void> => IMG[w] ? Promise.resolve() : (pend[w] ??= fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${w}`)
    .then(r => r.json()).then(j => { const u = j?.thumbnail?.source; if (u) { IMG[w] = u; try { localStorage.setItem('nivo-img', JSON.stringify(IMG)) } catch { } } }).catch(() => { }));
  const initials = (w: string) => { const a = w.split(' ').filter(Boolean); return (a[0]?.[0] || '') + (a.length > 1 ? a[a.length - 1][0] : '') };
  function avatars(root: ParentNode) {
    root.querySelectorAll<HTMLElement>('.av[data-wiki]').forEach(a => { const w = a.dataset.wiki!; if (!w) return; const apply = () => { if (IMG[w]) { a.style.backgroundImage = `url("${IMG[w]}")`; a.classList.add('ph-on') } }; apply(); if (!IMG[w]) loadImg(w).then(apply) });
  }
  const candRow = (i: number, v: number, t: number, pp?: number) => `<div class="cell"><i class="dot" style="width:10px;height:10px;background:${col(i)}"></i><span class="av" data-wiki="${P[i].wiki || ''}">${initials(P[i].w)}</span><div class="fl"><p class="md ell">${P[i].w}</p><p class="xs sub">${P[i].n}</p></div><div class="rt"><p class="md">${(pp ?? v / (t || 1) * 100).toFixed(2)}%</p><p class="xs sub">${fmt(v)} votes</p></div></div>`;
  const legend = () => `<div class="leg">${P.map(p => `<span class="xs"><i style="background:${p.fill};border-color:${p.edge}"></i>${p.k}</span>`).join('')}</div>`;

  /* animation */
  function run(root: any) {
    root.querySelectorAll('[data-h],[data-w]').forEach((e: any) => { const h = e.dataset.h, w = e.dataset.w; if (RM) { h && (e.style.height = h); w && (e.style.width = w); return } requestAnimationFrame(() => requestAnimationFrame(() => { h && (e.style.height = h); w && (e.style.width = w) })) });
    root.querySelectorAll('[data-n]').forEach((e: any) => { const to = +e.dataset.n, d = +(e.dataset.d || 0), sf = e.dataset.s || '', cm = e.dataset.c, f = (x: number) => (cm ? fmt(x) : x.toFixed(d)) + sf; if (RM) { e.textContent = f(to); return } const t0 = performance.now(); (function s(t: number) { const k = Math.min(1, (t - t0) / 900), x = to * (1 - Math.pow(1 - k, 3)); e.textContent = f(x); k < 1 && requestAnimationFrame(s) })(t0) });
    avatars(root);
  }
  const tween = (el: HTMLElement, to: number, f: (n: number) => string) => {
    const from = +(el.dataset.v ?? to); el.dataset.v = String(to);
    if (RM || from === to) { el.textContent = f(to); return }
    const t0 = performance.now(); (function s(t: number) { const k = Math.min(1, (t - t0) / 180), x = from + (to - from) * (1 - Math.pow(1 - k, 3)); el.textContent = f(x); if (k < 1 && +(el.dataset.v ?? to) === to) requestAnimationFrame(s) })(t0);
  };

  /* views */
  const V: Record<string, () => string> = {};
  const tipSkeleton = `<h4 class="md ell t-nm"></h4><p class="xs sub t-sub" style="padding:4px 16px 8px"></p><div class="tt xsb sub t-h"><span class="c1">Party</span><span class="c2">Margin</span><span class="c3">Votes</span></div><hr class="t-h">${[0, 1].map(k => `<div class="tt sm t-r t-r${k}"><span class="c1 row" style="gap:6px"><i class="dot"></i><b class="t-p"></b></span><span class="c2"></span><span class="c3"></span></div>`).join('')}`;
  V.map = () => `<section class="mapv${hasLga() ? '' : ' nolga'}"><div class="snb" id="snb"></div><div class="mp" id="mp"><div class="zw" id="zw"><div class="mb" id="mb" role="group" aria-label="Map of Nigeria"><canvas id="mcv" width="736" height="654"></canvas><canvas id="mhv" width="736" height="654"></canvas><svg class="bd" viewBox="0 0 736 654" aria-hidden="true"><path class="b1" d="${BORDERS}"/><path class="b0" d="${OUTLINE}"/></svg><svg id="lgasvg" viewBox="0 0 736 654"></svg></div></div><button class="allst" id="allst" aria-label="Show the full map" title="Show the full map">${ic('fit', 18, '#181818')}Full map</button><div class="tip" id="tip" style="display:none">${tipSkeleton}</div><div class="lcard" id="lcard" hidden></div><div class="zoom"><button data-z="1" aria-label="Zoom in">${ic('add')}</button><hr><button data-z="-1" aria-label="Zoom out">${ic('rem')}</button></div></div><aside class="rp"><div id="bkbar"></div><div id="ph"></div><div id="lg"></div><div class="row ctl" id="ctl"><div class="seg" id="seg"><button class="bk" id="bk" aria-label="Exit search">${ic('left')}</button><select class="sel s" id="st" aria-label="State"></select><select class="sel s" id="lga" aria-label="Local Government Area"></select></div><label class="sbx" id="sbx"><button class="sb1" id="sbtn" aria-label="Search">${ic('search')}</button><input id="q" autocomplete="off" aria-label="Search"><button class="qx" id="qx" aria-label="Clear search">${ic('x', 16)}</button></label></div><div id="pb"></div></aside></section>`;

  /* ---------- tooltip: one persistent box that follows the cursor instantly and morphs its contents between areas ---------- */
  type Hov = { k: string; st: boolean; s: string } | null;
  let HOV: Hov = null, tipKey = '';
  function tipUpdate(h: NonNullable<Hov>) {
    const t = $('#tip'), key = (h.st ? 's:' : 'l:' + h.s + ':') + h.k; if (!t || key === tipKey) return; tipKey = key;
    const v = h.st ? votes(h.k) : lvt(h.k, h.s), nd = !sum(v), q = (c: string) => t.querySelector(c) as HTMLElement;
    t.classList.toggle('nd', nd); q('.t-nm').textContent = h.st ? h.k.replace(' State', '') : h.k;
    if (nd) { q('.t-sub').textContent = 'No result data for this area'; return }
    const r = rk(v), a = r[0], b = r[1], tot = a[0] + (b ? b[0] : 0) || 1;
    q('.t-sub').innerHTML = b ? `${P[a[1]].k} <span style="color:var(--grn500)">+${((a[0] - b[0]) / tot * 100).toFixed(1)} pp</span> ahead of ${P[b[1]].k}` : `${P[a[1]].k} leads`;
    [a, b].forEach((x, k) => {
      const row = q('.t-r' + k); if (!x) { row.style.display = 'none'; return } row.style.display = '';
      row.style.backgroundColor = k ? 'transparent' : col(x[1]); row.style.color = k ? '' : '#fff';
      (row.querySelector('.dot') as HTMLElement).style.background = k ? col(x[1]) : '#fff'; (row.querySelector('.t-p') as HTMLElement).textContent = P[x[1]].k;
      tween(row.querySelector('.c2') as HTMLElement, x[0] / tot * 100, n => n.toFixed(2) + '%'); tween(row.querySelector('.c3') as HTMLElement, x[0], fmt);
    });
  }
  function tipMove(x: number, y: number) {
    const t = $('#tip'), m = $('#mp').getBoundingClientRect(), w = t.offsetWidth || 342, h = t.offsetHeight || 150;
    let px = Math.max(12, Math.min(x - m.left + 16, m.width - w - 12)), py = y - m.top + 16; if (py + h > m.height - 12) py = Math.max(12, y - m.top - h - 16);
    t.style.transform = `translate3d(${px}px,${py}px,0)`;
  }
  /** Re-evaluates what the tooltip should show (hovered area, or – on phones – the selected LGA docked at the bottom). */
  function tip(x?: number, y?: number) {
    const t = $('#tip'); if (!t) return;
    const h: Hov = HOV || (mob900.matches && S.view === 'state' && S.lga && hasLga() ? { k: S.lga, st: false, s: S.st } : null);
    if (!h || (mob900.matches && S.view === 'lga')) { t.style.display = 'none'; tipKey = ''; return }
    t.style.display = 'block'; t.classList.toggle('dock', mob900.matches); tipUpdate(h);
    if (!mob900.matches && x != null && y != null) tipMove(x, y);
  }

  /* ---------- panel header ---------- */
  function hdr() {
    const L = S.lga, st = S.st.replace(/ State$/, ''), tot = fmt(sum(S.view === 'lga' ? lvt(L, S.st) : votes(S.st, 1)));
    $('#bkbar').innerHTML = S.view === 'nat' ? '' : `<div class="in"><button class="back sm" id="back">${ic('back', 20, '#adadad')}${S.view === 'lga' ? 'Back to ' + st : 'Go back'}</button></div>`;
    $('#ph').innerHTML = S.view === 'nat' ? `<div class="in"><h2 class="t20">${S.y} General Elections</h2></div>`
      : S.view === 'lga' ? `<div class="in"><h2 class="ttl" style="margin-top:8px">${L}</h2><p class="r14 sub" style="margin-top:12px">${st} State · ${tot === '0' ? 'no result data' : tot + ' total votes'} · ${S.y}</p></div>`
        : `<div class="in"><h2 class="ttl" style="margin-top:8px">${st}</h2><p class="r14 sub" style="margin-top:12px">${tot} total votes · ${S.y}</p></div>`;
    $('#lg').innerHTML = `<div class="in">${legend()}</div>`;
    $('#back')?.addEventListener('click', back);
    $('.mapv')?.classList.toggle('has-sel', S.view !== 'nat');
    const sn = $('#snb');
    if (sn) sn.innerHTML = S.view === 'nat' ? '' : `<button class="snb-b" id="snbk" aria-label="Go back">${ic('back', 20, 'currentColor')}</button><span class="snb-t ell">${st}${S.view === 'lga' && L ? ` <i>›</i> ${L}` : ''}</span>`;
    $('#snbk')?.addEventListener('click', back);
  }
  function ctl() {
    const g = $('#seg'), st = $('#st'), lg = $('#lga'), L = hasLga();
    g.classList.toggle('has', !!S.st && L); g.classList.toggle('srch', !!S.srch); g.classList.toggle('nolga', !L); $('#sbx').classList.toggle('srch', !!S.srch);
    st.innerHTML = `<option value="" disabled ${S.st ? '' : 'selected'}>Choose a state</option>` + Object.keys(GEO).map(x => `<option${x === S.st ? ' selected' : ''}>${x}</option>`).join('');
    lg.innerHTML = `<option value="" disabled ${S.lga ? '' : 'selected'}>Choose LGA</option>` + (GEO[S.st] || []).map(x => `<option${x === S.lga ? ' selected' : ''}>${x}</option>`).join('');
    st.classList.toggle('act', !S.st || !L); lg.classList.toggle('act', !!S.st && L);
    $('#q').placeholder = L ? 'Search for a Local Government Area' : 'Search for a state'; fitAll();
  }
  let barKey = '';                                           // the results bar only animates when the state (or year) changes
  function body() {
    const r = $('#pb');
    if (S.srch) {
      const q = $('#q').value.trim().toLowerCase(), L = hasLga(), m = UNITS().filter(x => (x.n + ' ' + x.s).toLowerCase().includes(q));
      r.innerHTML = `<div class="in" style="margin-top:12px"><p class="xs sub">${m.length} ${L ? 'Local Government Areas' : 'states'}</p></div>` + (m.slice(0, 150).map(x => `<button class="cell res" data-s="${esc(x.s)}" data-l="${L ? esc(x.n) : ''}"><div class="fl"><p class="md">${x.n}</p><p class="xs sub">${L ? x.s : 'State'}</p></div>${ic('right')}</button>`).join('') || `<p class="in r14 sub">No match for “${esc($('#q').value)}”</p>`);
      r.querySelectorAll('.res').forEach((b: any) => b.onclick = () => pick(b.dataset.s, b.dataset.l)); return;
    }
    if (S.view === 'nat') {
      const nv = votes('nat'), t = sum(nv);
      r.innerHTML = `<hr class="hr"><div style="margin-top:var(--s24)"><div class="in"><h3 class="t18">Presidency</h3><p class="r14 sub" style="margin-top:4px">${fmt(t)} total votes</p></div>${rank(nv).map(([v, i]) => candRow(i, v, t)).join('')}</div><hr class="hr">${hasLga() ? '' : note(`LGA-level results are not available for ${S.y}. Click any state on the map to see its result.`, 'lvl-note')}`;
    } else if (S.view === 'lga') {
      const v = lvt(S.lga, S.st), t = sum(v);
      r.innerHTML = t ? `<hr class="hr"><div style="margin-top:var(--s24)"><div class="in"><h3 class="t18">Presidency</h3><p class="r14 sub" style="margin-top:4px">${fmt(t)} total votes</p></div>${rank(v).map(([x, i]) => candRow(i, x, t)).join('')}</div><hr class="hr"><div class="in"><button class="more sm" id="cmpgo">Compare with another LGA</button></div>` : note(`There is no result data for ${S.lga} in our 2023 table, so it is shown in grey on the map.`, 'lvl-note');
      $('#cmpgo') && ($('#cmpgo').onclick = () => { S.c1 = S.lga + '::' + S.st; S.c2 = ''; location.hash = '#compare' });
    } else {
      const L = GEO[S.st], v = votes(S.st, 1), t = sum(v) || 1, o = rank(v), few = P.length <= 3, vis = S.all || few ? o : o.slice(0, 2);
      const bk = S.st + '|' + S.y, anim = barKey !== bk; barKey = bk;
      const bar = o.map(([x, i]) => anim ? `<div class="grow" data-w="${x / t * 100}%" style="width:0;background:${col(i)}"></div>` : `<div class="grow" style="width:${x / t * 100}%;background:${col(i)}"></div>`).join('');
      const lgaTable = hasLga() ? `<hr class="hr" style="margin:16px 0"><div class="row md" style="padding:8px 12px;gap:4px">Local Governments<span class="sub">(${L.length})</span></div><div class="tbl th"><span style="flex:1">LGA</span><span style="width:var(--c1w)">Ruling Party</span><span style="width:var(--c2w)">Vote %</span><span style="width:var(--c3w)"></span></div><hr class="hr">${L.map(n => {
        const lv = lvt(n, S.st), lt = sum(lv), on = n === S.lga ? ' on' : '';
        const arrow = `<span style="width:var(--c3w);align-self:center"><button class="go" data-l="${esc(n)}" aria-label="Open ${esc(n)}">${ic('right')}</button></span>`;
        if (!lt) return `<div class="tbl sm lr nd${on}" data-l="${esc(n)}" style="padding:0 4px;border-bottom:1px solid var(--g100)"><span style="flex:1;align-self:center">${n}</span><span class="row" style="width:var(--c1w);gap:12px"><i class="dot" style="background:var(--fill-disabled)"></i><span class="sub">No data</span></span><span style="width:var(--c2w);background:var(--fill-disabled);color:var(--g500)">—</span>${arrow}</div>`;
        const [w, i] = rk(lv)[0];
        return `<div class="tbl sm lr${on}" data-l="${esc(n)}" style="padding:0 4px;border-bottom:1px solid var(--g100)"><span style="flex:1;align-self:center">${n}</span><span class="row" style="width:var(--c1w);gap:12px"><i class="dot" style="background:${col(i)}"></i><span><span style="display:block">${P[i].k}</span><span class="xs sub">${P[i].w.split(' ').slice(-1)[0]}</span></span></span><span style="width:var(--c2w);background:${P[i].tint};color:${P[i].ink}">${(w / lt * 100).toFixed(2)}%<span class="xs" style="display:block">${fmt(w)} votes</span></span>${arrow}</div>`;
      }).join('')}` : note(`LGA-level results are not available for ${S.y}; only state results are shown. LGA data exists for 2023.`, 'lvl-note');
      r.innerHTML = `<div class="in" style="padding-top:0"><div class="stk">${bar}</div></div><div style="margin-top:16px">${vis.map(([x, i]) => candRow(i, x, t)).join('')}${few ? '' : `<div class="in"><button class="more sm" id="more">${S.all ? 'Fewer results' : 'More results'}${ic('down')}</button></div>`}</div>${lgaTable}`;
      r.querySelectorAll('.lr').forEach((e: any) => e.onclick = () => { S.lga = e.dataset.l; ctl(); body(); sync(); tip() });
      r.querySelectorAll('.go').forEach((b: any) => b.onclick = (ev: Event) => { ev.stopPropagation(); openLga(b.dataset.l) });
      $('#more') && ($('#more').onclick = () => { S.all = S.all ? 0 : 1; body() });
    }
    run(r);
  }
  function lcard() {
    const c = $('#lcard'); if (!c) return; const show = S.view === 'lga' && !!S.lga; c.hidden = !show; if (!show) return;
    const v = lvt(S.lga, S.st), t = sum(v);
    c.innerHTML = `<p class="md ell">${S.lga}</p><p class="xs sub" style="margin-bottom:10px">${S.st.replace(/ State$/, '')} · ${S.y}</p>` + (t ? rank(v).map(([x, i]) => `<div class="lc-r"><span class="lc-p"><i class="dot" style="background:${col(i)}"></i>${P[i].k}</span><div class="lc-b"><i style="width:${x / t * 100}%;background:${col(i)}"></i></div><span class="lc-v">${(x / t * 100).toFixed(1)}% <span class="sub">· ${fmt(x)}</span></span></div>`).join('') : `<p class="xs sub">No result data</p>`);
  }
  const all = () => { hdr(); ctl(); body(); lcard(); sync(); tip() };

  /* ---------- state changes (+ shareable URLs like #map/Lagos%20State/Ikeja) ---------- */
  const idOf = (h: string) => { const i = h.slice(1).split('/')[0]; return V[i] ? i : 'map' };
  const curId = () => idOf(location.hash);
  let lastH = location.hash;
  const mapHash = () => '#map' + (S.st ? '/' + encodeURIComponent(S.st) + (S.view === 'lga' && S.lga ? '/' + encodeURIComponent(S.lga) : '') : '');
  function pushUrl(replace = false) {
    if (curId() !== 'map') return; const h = mapHash(); if (location.hash === h) return;
    try { replace ? history.replaceState(null, '', h) : history.pushState(null, '', h) } catch { } lastH = location.hash;
  }
  function readUrl() {
    const [, a, b] = location.hash.slice(1).split('/'); S.st = ''; S.lga = ''; S.view = 'nat';
    const st = a ? fullName(decodeURIComponent(a)) : ''; if (!st || !LG[st]) return;
    S.st = st; S.view = 'state'; const n = b ? decodeURIComponent(b) : ''; if (n && GEO[st].includes(n)) { S.lga = n; if (hasLga()) S.view = 'lga' }
    if (n && hasLga() && GEO[st].includes(n)) { S.lga = n; S.view = 'lga' }
  }
  const reset = () => { S.st = ''; S.lga = ''; S.view = 'nat'; S.srch = 0; S.all = 0; S.z = 1; S.px = S.py = 0; HOV = null; tipKey = ''; $('#q').value = ''; all(); drawMap(); drawHover(); pushUrl() };
  const pick = (st: string, l = '') => { gt('select_state', { state: st.replace(/ State$/, '') }); S.st = st; S.lga = l; S.view = 'state'; S.all = 0; S.srch = 0; S.z = 1; S.px = S.py = 0; $('#q').value = ''; all(); drawMap(); pushUrl() };
  const openLga = (n: string) => { gt('open_lga', { lga: n }); S.lga = n; S.view = 'lga'; S.z = 1; S.px = S.py = 0; all(); drawMap(); pushUrl() };
  const back = () => { if (S.view === 'lga') { S.view = 'state'; S.z = 1; S.px = S.py = 0; all(); drawMap(); pushUrl() } else reset() };
  function mapInit() {
    all();
    $('#st').onchange = (e: any) => { pick(e.target.value); done(e) };
    $('#lga').onchange = (e: any) => { S.lga = e.target.value; body(); sync(); tip(); done(e) };
    $('#sbtn').onclick = () => { S.srch = 1; ctl(); body(); $('#q').focus() }; $('#bk').onclick = () => { S.srch = 0; $('#q').value = ''; ctl(); body() };
    $('#q').oninput = body; $('#q').onkeydown = (e: any) => { if (e.key === 'Escape') $('#bk').click(); if (e.key === 'Enter') $('#pb .res')?.click() };
    $('#qx').onclick = () => { $('#q').value = ''; body(); $('#q').focus() }; $('#allst').onclick = reset;
  }

  V.dashboard = () => {
    const nat = votes('nat'), t = sum(nat) || 1, L = hasLga(), wins = L ? LG_WINS_2023 : stateWins(), wt = sum(wins) || 1, reg = REG[S.y], vot = CAST[S.y], tn = +turnout(S.y).toFixed(2);
    const ext = S.y === '2023' ? [['Most voter turnout', 'Jigawa State', 40.61, 'red'], ['Least voter turnout', 'Rivers State', 15.66, 'blu']] : [];
    const newsCard = `<div class="card" style="flex-basis:100%;"><div class="row" style="justify-content:space-between;margin-bottom:12px;"><p class="card-t">2027 Election Updates</p><a href="https://onyeakuko.online" target="_blank" rel="noopener noreferrer" class="xs sub" style="text-decoration:none;display:flex;align-items:center;gap:4px;">Powered by OnyeAkụkọ <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg></a></div><div id="news-feed" style="display:flex;flex-direction:column;gap:0;"><p class="sm sub" style="padding:12px 0;">Fetching latest reports...</p></div></div>`;
    return `<div class="page"><div class="cols pad" style="padding-left:20px;padding-right:20px;grid-template-columns:repeat(${nat.length},1fr)">${nat.map((v, i) => { const p = v / t * 100; return `<div class="col"><div><div class="hd2"><p class="mdb">${P[i].k}</p><p class="sm sub">${mob.matches ? +(v / 1e6).toFixed(2) + 'M' : fmt(v)}</p></div><p class="pc" data-n="${p}" data-d="1" data-s="%">0%</p>${i < 3 && P[i].wiki ? `<p class="xs sub" style="margin-bottom:6px;padding-left:12px;">${P[i].w}</p>` : ''}<div class="grow" data-h="${(p * 6.28).toFixed(1)}px" style="height:0;background:${col(i)}"></div></div></div>` }).join('')}</div>
      <div class="cards"><div class="card"><p class="card-t">${L ? 'Party by Local Government' : 'Party by State'}</p><div><p class="h5" data-n="${wt}" data-c="1">0</p><p class="sm sub">${L ? 'Local Government Areas' : 'States (incl. FCT)'}</p></div><div class="stk" style="margin:8px 0">${wins.map((n, i) => `<div class="grow" data-w="${n / wt * 100}%" style="width:0;background:${col(i)}"></div>`).join('')}</div>${wins.map((n, i) => `<div class="cl" style="--c:${col(i)}"><div class="fl"><p class="md">${P[i].k}</p><p class="xs sub">${P[i].n}</p></div><p class="md" data-n="${n}" data-c="1">0</p></div>`).join('')}</div>
      <div class="card"><p class="card-t">Voting Turnout</p><div class="row" style="gap:12px;flex-wrap:wrap"><div class="stat" style="--c:var(--g100)"><div><p class="h5" data-n="${reg}" data-c="1">0</p><p class="sm sub">registered voters</p></div></div><div class="stat" style="--c:var(--org500)"><div><p class="h5" data-n="${vot}" data-c="1">0</p><p class="sm sub">voted</p></div></div></div><div class="trk">${[0, 25, 50, 75, 100].map(x => `<i style="left:${x === 100 ? 'calc(100% - 1px)' : x + '%'}"></i>`).join('')}<div class="fill"><b class="grow" style="width:0" data-w="${tn}%"></b></div></div>${ext.map(r => `<div class="cl b0" style="--c:var(--${r[3]}500);padding:4px 0"><div class="fl"><p class="xs sub">${r[0]}</p><p class="md">${r[1]}</p></div><p class="md">${r[2]}%</p></div>`).join('')}<div class="note sm">${layers}<p>${tn}% of registered voters cast a ballot in the ${S.y} General Elections${ext.length ? `, with ${ext[0][1]} having the most turnout and ${ext[1][1]} the least` : ''}.</p></div></div>${newsCard}</div></div>`;
  };
  const ph = (t: string, r = '') => `<div class="ph"><h1 class="ttl">${t}</h1>${r}</div>`;
  V.compare = () => {
    const L = hasLga(), kind = L ? 'local government areas' : 'states', what = L ? 'LGA' : 'state',
      ks = (k: string) => k.split('::') as [string, string], items = UNITS().map(x => [x.n + '::' + x.s, L ? `${x.n} · ${x.s.replace(' State', '')}` : x.n]),
      stt = (k: string) => ks(k)[1].replace(' State', ''), nm2 = (k: string) => ks(k)[0], ok = S.c1 && S.c2;
    let b = `<div class="empty"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#adadad" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6v28h28M12 26l7-8 6 5 9-11"/></svg><p class="sm" style="color:var(--g800)">No comparisons made... yet</p><p class="xs sub">Select two ${kind} to compare voting statistics</p></div>`;
    if (ok) {
      const A = uv({ n: nm2(S.c1), s: ks(S.c1)[1] }), B = uv({ n: nm2(S.c2), s: ks(S.c2)[1] }),
        f = (a: number, b2: number, fm: (n: number) => string = fmt) => [a, b2].map((x, k) => `<div class="${(k ? b2 > a : a >= b2) ? 'hl' : ''}">${fm(x)}</div>`).join(''),
        rw = (l: string, a: number, b2: number, dot?: string | number, fm?: (n: number) => string) => `<div class="tr"><div>${dot ? `<i class="dot" style="background:${dot}"></i>` : ''}${l}</div>${f(a, b2, fm)}</div>`,
        ta = sum(A), tb = sum(B), mg = (v: number[]) => { const s = rk(v); return s[1] ? (s[0][0] - s[1][0]) / (sum(v) || 1) * 100 : 0 };
      const nt = turnout(S.y) / 100, ra = Math.round(ta / nt), rb = Math.round(tb / nt), ma = Math.round(ta * 0.55), mb = Math.round(tb * 0.55);
      b = `<div class="tw pad" style="padding:0"><div style="min-width:720px"><div class="tr h"><div>Metric</div><div>${nm2(S.c1)}</div><div>${nm2(S.c2)}</div></div>${L ? `<div class="tr mrow"><div>State</div><div>${stt(S.c1)}</div><div>${stt(S.c2)}</div></div>` : ''}${P.map((p, i) => rw(p.k + ' votes', A[i], B[i], col(i))).join('')}<div class="tr sep"><div>Total votes</div>${f(ta, tb)}</div>${rw('Winning margin', +mg(A).toFixed(1), +mg(B).toFixed(1), 0, x => x.toFixed(1))}<div class="gap"></div>${rw('Registered voters (est.)', ra, rb)}${rw('Male voters (est.)', ma, mb)}${rw('Female voters (est.)', ta - ma, tb - mb)}</div></div>${ta + tb ? `<div class="note sm pad" style="margin:16px 20px 0">${layers}<p>${nm2(ta > tb ? S.c1 : S.c2)} recorded ${fmt(Math.max(ta, tb))} votes against ${fmt(Math.min(ta, tb))} in ${nm2(ta > tb ? S.c2 : S.c1)}, with ${P[rk(ta > tb ? A : B)[0][1]].k} leading.</p></div>` : note('One of these areas has no result data in our table.', 'pad')}`;
    }
    return `<div class="page">${ph(L ? 'LGA Comparison' : 'State Comparison', `<div class="pair">${combo('c1', items, S.c1, `Choose ${what} 1`)}${combo('c2', items, S.c2, `Choose ${what} 2`)}</div>`)}${b}</div>`;
  };
  V.insights = () => {
    const L = hasLga(), what = L ? 'LGA' : 'state', y = S.y, prev = PREV[y];
    const rows = UNITS().map(x => { const v = uv(x), r = rk(v), tot = sum(v); return { ...x, a: r[0], b: r[1], tot, d: tot && r[1] ? (r[0][0] - r[1][0]) / tot * 100 : 0 } }).filter(r => r.tot > 0 && r.b).sort((p, q) => p.d - q.d);
    const irow = (r: any) => `<div class="ir"><div class="fl"><p class="md ell">${r.n}</p><p class="xs sub">${L ? r.s : 'State'}</p></div><div class="irp"><span><b class="sm">${P[r.a[1]].k}</b><i class="xs sub">${fmt(r.a[0])}</i></span><i class="dot" style="background:${col(r.a[1])}"></i></div><div class="irg" style="background:${P[r.a[1]].tint};color:${P[r.a[1]].ink}"><b>${r.d.toFixed(1)} pts</b><span class="xs">${fmt(r.a[0] - r.b[0])} vote gap</span></div><div class="irp r"><i class="dot" style="background:${col(r.b[1])}"></i><span><b class="sm">${P[r.b[1]].k}</b><i class="xs sub">${fmt(r.b[0])}</i></span></div></div>`;
    const sRows = STATES.map(x => { const r = rk(votes(x.s)); return { n: x.n, d: r[1] ? (r[0][0] - r[1][0]) / (r[0][0] + r[1][0]) * 100 : 99 } }).sort((p, q) => p.d - q.d), watch = sRows.slice(0, 5).map(r => r.n);
    const flips = prev ? STATES.map(x => ({ n: x.n, from: winnerOf(prev, x.s), to: winnerOf(y, x.s) })).filter(f => f.from && f.to && f.from !== f.to) : [];
    const dot = (k: string) => `<i class="dot" style="background:${(PTY[k] || PTY.OTH).fill}"></i>`;
    const frow = (f: any, i: number) => `<div class="flr${i > 4 ? ' more-r' : ''}"><span class="md">${f.n}</span><span class="flp">${dot(f.from)}${f.from}${ic('arrow', 16)}${dot(f.to)}${f.to}</span></div>`;
    const tn = +turnout(y).toFixed(2), projReg = Math.round(REG['2023'] * 1.135);
    return `<div class="page"><div class="cards" style="padding-bottom:0"><div class="card" style="grid-column:1/-1"><p class="card-t">2027 Structural Projections</p><div class="row ps"><div class="stat" style="--c:var(--blu500)"><div><p class="h5">${fmt(projReg)}</p><p class="sm sub">est. registered voters</p></div></div><div class="stat" style="--c:var(--org500)"><div><p class="h5">26% - 30%</p><p class="sm sub">est. turnout baseline</p></div></div><div class="stat" style="--c:var(--pur500)"><div><p class="h5">${watch.length}</p><p class="sm sub">Key states to watch</p></div></div></div>${note(`Key states to watch (tightest ${y} margins): ${watch.join(', ')}. Registered voters extrapolate the ~13.5% growth between the 2019 and 2023 registers.`)}</div></div>
      ${ph(y + ' Insights')}
      <div class="cards"><div class="card"><p class="card-t">Closest ${what} contests</p>${rows.slice(0, 5).map(irow).join('') || '<p class="xs sub">No data</p>'}</div><div class="card"><p class="card-t">Widest ${what} contests</p>${rows.slice(-5).reverse().map(irow).join('') || '<p class="xs sub">No data</p>'}</div></div>
      <div class="cards" style="padding-top:0"><div class="card"><p class="card-t">Voter Apathy Index</p><div class="apx"><div class="ap ap-reg"><span>Registered voters</span><b>100%</b></div>${y === '2023' ? `<div class="ap ap-pvc" style="width:${PVC_2023}%"><span>PVC collection</span><b>${PVC_2023}%</b></div>` : ''}<div class="ap ap-vot" style="width:${tn}%;top:${y === '2023' ? 196 : 68}px"><span>Voter turnout</span><b class="big">${tn}%</b></div></div><p class="t20" style="margin-top:12px">National turnout was ${y === '2023' ? 'historically low at just ' : ''}${tn}%</p></div>
        <div class="card" id="flc"><p class="card-t">${prev ? `States that flipped from ${prev} - ${y}` : 'States that flipped'}</p>${prev ? (flips.length ? flips.map(frow).join('') + (flips.length > 5 ? `<button class="more sm" id="flb">View all ${ic('down')}</button>` : '') : '<p class="xs sub" style="padding:12px 0">No state changed hands.</p>') : '<p class="xs sub" style="padding:12px 0">2015 is the earliest election on nivo, so there is nothing to compare it with.</p>'}</div></div></div>`;
  };
  V.method = () => {
    const y = S.y, sec = (h: string, b: string) => `<section><h2 class="t18" style="margin-bottom:8px">${h}</h2>${b}</section>`, p = (t: string, st = '') => `<p class="r14 sub" style="${st}">${t}</p>`;
    const party = (i: number, pp: any[]) => `<div class="cl" style="--c:${pp[i].fill}"><div class="fl"><p class="md">${pp[i].k}</p><p class="xs sub">${pp[i].n} – ${pp[i].w}</p></div></div>`;
    return `<div class="page">${ph('Methodology')}<div class="pad" style="display:flex;flex-direction:column;gap:var(--s24);max-width:720px">
    ${sec('Data sources', p(`Presidential results come from official Independent National Electoral Commission (INEC) declarations. 2023 uses published LGA collation figures; 2015 and 2019 use the declared state totals. National totals for 2015 and 2019 are the sum of the 36 states and the FCT.`))}
    ${sec('Geographic coverage', p(`The map covers all 36 states, the FCT and (for 2023) 774 Local Government Areas. LGAs that have no row in our results table are shown in grey. For 2015 and 2019 there is no LGA data, so the app works at state level.`))}
    ${sec('Parties and candidates by election', p(`Parties and candidates differ per election. 2023 shows the four parties that drew major support; 2015 and 2019 were effectively two-horse races, so every other party is combined into “Others”.`, 'margin-bottom:12px') + `<div class="card" style="padding:var(--s12) var(--s16)">${[0, 1, 2, 3].map(i => party(i, YP['2023'])).join('')}</div><div class="card" style="padding:var(--s12) var(--s16);margin-top:12px">${[0, 1, 2].map(i => party(i, YP['2019'])).join('')}</div><div class="card" style="padding:var(--s12) var(--s16);margin-top:12px">${[0, 1, 2].map(i => party(i, YP['2015'])).join('')}</div>` + p(`Cards above: 2023, 2019, 2015. Candidate photos are fetched from Wikipedia and fall back to initials.`, 'margin-top:12px'))}
    ${sec('Winners', p(`On the dashboard, “Party by Local Government” (2023) or “Party by State” (2015, 2019) counts the units each party won – the party with the most votes in that unit. On the map, an LGA’s colour is the winning party’s, and the stronger the colour, the bigger its share of the vote.`))}
    ${sec('Turnout & registered voters', p(`National registered-voter and turnout figures are the official INEC numbers for each year (selected year: ${y}). In the comparison view, registered voters for an LGA or state are estimated by dividing its votes by the national turnout rate, and the male/female split uses a fixed 55 % / 45 % assumption. These are illustrative estimates, not official data.`))}
    ${sec('Limitations', `<ul class="r14 sub" style="padding-left:20px;display:flex;flex-direction:column;gap:8px"><li>2015 and 2019 are state-level only.</li><li>“Others” aggregates every party outside the top two (2015, 2019); 2023 omits minor parties.</li><li>LGAs missing from the results table appear grey rather than as zero.</li><li>Registered-voter and gender figures for individual areas are estimates.</li></ul>`)}
    </div></div>`;
  };
  V.about = () => {
    const sec = (h: string, b: string) => `<section><h2 class="t18" style="margin-bottom:8px">${h}</h2>${b}</section>`, p = (t: string, st = '') => `<p class="r14 sub" style="${st}">${t}</p>`,
      tile = (t: string, d: string, href: string) => `<a class="card ab-tile" href="${href}"><p class="card-t">${t}</p><p class="r14 sub">${d}</p></a>`, today = new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
    return `<div class="page">${ph('About nivo')}<div class="pad" style="display:flex;flex-direction:column;gap:var(--s24);max-width:720px">
      ${p('nivo is a free data platform for Nigeria’s presidential elections. It turns the results into something anyone can explore without needing a spreadsheet or a statistics degree.', 'font-size:16px;line-height:24px')}
      ${sec('What you can do here', `<div class="cards" style="padding:0;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">${tile('Explore the map', 'Click any state to see who won it, then open a local government to see its votes.', '#map')}${tile('National dashboard', 'Votes by party, how many states or LGAs each party won, and voter turnout.', '#dashboard')}${tile('Compare areas', 'Put two LGAs (or two states) side by side on every metric.', '#compare')}${tile('Political insights', 'The closest and widest contests, voter apathy and the states that flipped.', '#insights')}</div>`)}
      ${sec('Where the numbers come from', p('Results are based on official Independent National Electoral Commission (INEC) declarations: LGA-level collation figures for 2023, and declared state totals for 2015 and 2019. A few figures – such as registered voters or the male/female split for a single area – are estimates and are labelled as such. The full detail is on the <a href="#method">Methodology</a> page.'))}
      ${sec('Using nivo in your reporting', p('Please link back and check anything you publish against the official INEC declaration, which is always the authoritative record. A suggested citation:', 'margin-bottom:8px') + `<div class="note sm"><p>nivo – For Nigerian Voters, ${location.host}. Data: INEC. Accessed ${today}.</p></div>`)}
      ${sec('Spotted a mistake?', p('Every figure traces back to an INEC result, so if something looks wrong we want to fix it. Check the <a href="#method">Methodology</a> first, then tell us on the <a href="#feedback">Feedback</a> page.'))}
      ${sec('Note', p('nivo is an independent project and not an official INEC publication.'))}
    </div></div>`;
  };
  V.feedback = () => `<div class="page">${ph('Feedback')}<div class="pad" style="max-width:640px"><p class="r14 sub" style="margin-bottom:20px">Found a wrong number, a bug, or have an idea that would make nivo more useful? Tell us – every message is read.</p>
    <form id="fbf" class="fb" novalidate><label><span class="sm">What is this about?</span><select class="sel" name="topic"><option>Data error</option><option>Bug</option><option>Idea or feature request</option><option>Something else</option></select></label>
    <label><span class="sm">Your message</span><textarea name="message" rows="6" maxlength="2000" required placeholder="Tell us what you saw – the page, the state or LGA, and what looked wrong."></textarea></label>
    <label><span class="sm">Email <span class="sub">(optional – only if you’d like a reply)</span></span><input name="email" type="email" class="fb-i" autocomplete="email"></label>
    <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" class="fb-hp" aria-hidden="true"><button type="submit" class="more sm fb-btn" id="fbs">Send feedback</button><p class="sm" id="fbm" role="status" aria-live="polite"></p></form></div></div>`;
  function bindFeedback() {
    const f = $('#fbf') as HTMLFormElement | null; if (!f) return; const msg = $('#fbm'), btn = $('#fbs') as HTMLButtonElement;
    f.onsubmit = async (e: Event) => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(f).entries()) as Record<string, string>;
      if (d._gotcha) return; if (!d.message?.trim()) { msg.textContent = 'Please write a short message first.'; msg.className = 'sm fb-err'; return }
      if (!FEEDBACK_ENDPOINT) { console.warn('[nivo] Set FEEDBACK_ENDPOINT in app.ts to receive feedback.'); msg.textContent = 'Feedback isn’t switched on yet – please try again soon.'; msg.className = 'sm fb-err'; return }
      btn.disabled = true; msg.textContent = 'Sending…'; msg.className = 'sm sub';
      try {
        const r = await fetch(FEEDBACK_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ topic: d.topic, message: d.message, email: d.email, page: location.href, year: S.y }) });
        if (!r.ok) throw new Error(String(r.status)); f.reset(); msg.textContent = 'Thank you – your feedback has been sent.'; msg.className = 'sm fb-ok'; gt('feedback_sent', { topic: d.topic });
      } catch { msg.textContent = 'Something went wrong – please try again.'; msg.className = 'sm fb-err' } finally { btn.disabled = false }
    };
  }

  /* ---- interactive map: state hit-mask (canvas) + hover overlay + state/outline borders + per-state LGA shapes ---- */
  let LAB: Uint8Array | null = null, drawn = '', MW = 736, MH = 654; const BBX: Record<number, number[]> = {}, HC: Record<string, HTMLCanvasElement> = {}, LBBC: Record<string, number[]> = {};
  const maskImg = new Image();
  maskImg.onload = () => {
    MW = maskImg.naturalWidth; MH = maskImg.naturalHeight;
    const c = document.createElement('canvas'); c.width = MW; c.height = MH; const x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(maskImg, 0, 0);
    const d = x.getImageData(0, 0, MW, MH).data; LAB = new Uint8Array(MW * MH);
    for (let k = 0; k < LAB.length; k++) { const l = d[k * 4]; LAB[k] = l; if (!l) continue; const px = k % MW, py = (k / MW) | 0, b = BBX[l] ??= [px, py, px, py]; if (px < b[0]) b[0] = px; if (py < b[1]) b[1] = py; if (px > b[2]) b[2] = px; if (py > b[3]) b[3] = py }
    drawMap();
  };
  maskImg.src = MASK;
  const labelAt = (e: MouseEvent): number => { const r = $('#mcv').getBoundingClientRect(), px = Math.floor((e.clientX - r.left) / r.width * MW), py = Math.floor((e.clientY - r.top) / r.height * MH); return !LAB || px < 0 || py < 0 || px >= MW || py >= MH ? 0 : LAB[py * MW + px] };
  /** Base layer: grey states; the selected state is filled with its ruling party's colour (opaque), the rest dimmed. Redrawn only when selection / theme changes. */
  function drawMap() {
    const cv = $('#mcv') as HTMLCanvasElement | null; if (!cv || !LAB) return;
    const x = cv.getContext('2d')!, im = x.createImageData(MW, MH), px = new Uint32Array(im.data.buffer), sl = S.view !== 'nat' ? KEYS.indexOf(S.st) + 1 : 0;
    const g = (c: number) => abgr([c, c, c]), [base, dim] = isDark() ? [g(46), g(30)] : [g(228), g(240)];
    let selC = base; if (sl) { const v = votes(S.st), t = sum(v); if (t) selC = abgr(rgbOf(col(rk(v)[0][1]))) }
    for (let k = 0; k < LAB.length; k++) { const l = LAB[k]; if (l) px[k] = l === sl ? selC : sl ? dim : base }
    x.putImageData(im, 0, 0); drawHover();
  }
  /** Hover layer: a cached, pre-rendered highlight per state, so moving between states is just a drawImage. */
  function drawHover() {
    const c = $('#mhv') as HTMLCanvasElement | null; if (!c) return; const x = c.getContext('2d')!; x.clearRect(0, 0, c.width, c.height);
    if (!HOV || !HOV.st || !LAB) return; const l = KEYS.indexOf(HOV.k) + 1, b = BBX[l]; if (!b) return;
    const key = l + (isDark() ? 'd' : 'l'); let hc = HC[key];
    if (!hc) { const w = b[2] - b[0] + 1, h = b[3] - b[1] + 1; hc = HC[key] = document.createElement('canvas'); hc.width = w; hc.height = h; const hx = hc.getContext('2d')!, im = hx.createImageData(w, h), p = new Uint32Array(im.data.buffer), cc = isDark() ? abgr([255, 255, 255], 26) : abgr([0, 0, 0], 24); for (let yy = 0; yy < h; yy++)for (let xx = 0; xx < w; xx++)if (LAB[(b[1] + yy) * MW + b[0] + xx] === l) p[yy * w + xx] = cc; hx.putImageData(im, 0, 0) }
    x.drawImage(hc, b[0], b[1]);
  }
  const lbb = (st: string, n: string): number[] => {
    const k = st + '|' + n; if (LBBC[k]) return LBBC[k]; const d = LG[st].find(r => r[0] === n)![1], nums = d.match(/-?\d+\.?\d*/g)!.map(Number); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < nums.length; i += 2) { x0 = Math.min(x0, nums[i]); x1 = Math.max(x1, nums[i]); y0 = Math.min(y0, nums[i + 1]); y1 = Math.max(y1, nums[i + 1]) } return LBBC[k] = [x0, y0, x1, y1];
  };
  function sync() {
    const sv = $('#lgasvg') as SVGElement | null, zw = $('#zw') as HTMLElement | null, mp = $('#mp') as HTMLElement | null; if (!sv || !zw || !mp) return;
    const key = S.view !== 'nat' && LG[S.st] ? S.st : '', L = hasLga(), dk = key + '|' + S.y;
    if (drawn !== dk) { sv.innerHTML = key ? (L ? LG[key].map(([n, d]) => { const f = lgaFill(key, n); return `<path class="lp${f.nd ? ' nd' : ''}" data-n="${esc(n)}" d="${d}" style="fill:${f.fill}"/>` }).join('') : '') + `<path class="so" d="${SO[key]}"/>` : ''; drawn = dk }
    sv.classList.toggle('lv', !!S.lga);
    sv.querySelectorAll<SVGPathElement>('.lp').forEach(p => p.classList.toggle('on', p.dataset.n === S.lga));
    const on = sv.querySelector('.lp.on'), so = sv.querySelector('.so'); if (on && so && on.nextSibling !== so) sv.insertBefore(on, so);
    const cs = getComputedStyle(mp), cw = mp.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), ch = mp.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom), u = (zw.offsetWidth || 736) / 736;
    let sc = 1, cx = 368, cy = 327; const zoomLga = S.view === 'lga' && !!S.lga && L && !!key, bb = key ? (zoomLga ? lbb(key, S.lga) : BB[key]) : null;
    if (bb) { const f = zoomLga ? .55 : .8; sc = Math.min(zoomLga ? 40 : 14, Math.min(cw / ((bb[2] - bb[0]) * u), ch / ((bb[3] - bb[1]) * u)) * f); cx = (bb[0] + bb[2]) / 2; cy = (bb[1] + bb[3]) / 2 }
    sc *= S.z; const lim = 60 * Math.max(1, S.z); S.px = Math.max(-lim, Math.min(lim, S.px)); S.py = Math.max(-lim, Math.min(lim, S.py)); if (S.view === 'nat' && S.z <= 1) S.px = S.py = 0;
    zw.style.transform = `translate(${(368 - cx * sc) / 7.36 + S.px}%,${(327 - cy * sc) / 6.54 + S.py}%) scale(${sc})`; zw.style.setProperty('--k', String(1 / sc));
    mp.style.touchAction = (S.z > 1 || S.view !== 'nat') ? 'none' : 'pan-y';
    const ra = $('#allst'); if (ra) ra.disabled = S.view === 'nat' && S.z === 1 && !S.px && !S.py;
    document.documentElement.style.setProperty('--mapH', mp.offsetHeight + 'px');
  }
  function bindMap() {
    const mp = $('#mp') as HTMLElement; let drag: { id: number; x: number; y: number; px: number; py: number; m: boolean } | null = null, moved = false, last: PointerEvent | null = null, raf = 0;
    const endDrag = () => { if (!drag) return; if (drag.m) { moved = true; setTimeout(() => { moved = false }, 0) } try { mp.releasePointerCapture(drag.id) } catch { } drag = null; $('#zw').style.transition = '' };
    const hoverStep = () => {
      raf = 0; const e = last!, t = e.target as HTMLElement; let h: Hov = null;
      if (t.classList.contains('lp')) h = { k: t.dataset.n!, st: false, s: S.st }; else if (t.id === 'mcv' || t.id === 'mhv') { const l = labelAt(e); if (l) h = { k: KEYS[l - 1], st: true, s: '' } }
      if (h?.k !== HOV?.k || h?.st !== HOV?.st) { HOV = h; drawHover() }
      tip(e.clientX, e.clientY); mp.style.cursor = h ? 'pointer' : '';
    };
    mp.onpointerdown = (e: PointerEvent) => { if (e.button > 0 || (S.view === 'nat' && S.z <= 1) || (e.target as HTMLElement).closest('.allst,.zoom')) return; drag = { id: e.pointerId, x: e.clientX, y: e.clientY, px: S.px, py: S.py, m: false } };
    mp.onpointerup = mp.onpointercancel = endDrag;
    mp.onpointermove = (e: PointerEvent) => {
      if (drag) {
        if (e.pointerType === 'mouse' && !e.buttons) endDrag();
        else { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!drag.m && Math.abs(dx) + Math.abs(dy) > 6) { drag.m = true; mp.setPointerCapture(e.pointerId) } if (drag.m) { const zw = $('#zw'); zw.style.transition = 'none'; S.px = drag.px + dx / zw.offsetWidth * 100; S.py = drag.py + dy / zw.offsetHeight * 100; sync(); return } }
      }
      last = e; if (!raf) raf = requestAnimationFrame(hoverStep);
    };
    mp.onpointerleave = () => { if (drag) return; HOV = null; drawHover(); tip() };
    mp.onclick = (e: MouseEvent) => {
      if (moved) { moved = false; return } const t = e.target as HTMLElement;
      if (t.classList.contains('lp')) { const n = t.dataset.n!; if (S.lga === n && S.view === 'state') openLga(n); else { S.lga = n; if (S.view === 'lga') { S.px = S.py = 0 } ctl(); body(); hdr(); lcard(); sync(); tip(); if (!mob900.matches) $('.lr.on')?.scrollIntoView({ block: 'nearest' }); if (S.view === 'lga') pushUrl() } }
      else if (t.id === 'mcv' || t.id === 'mhv') { const l = labelAt(e); if (l) pick(KEYS[l - 1], '') }
    };
    mp.querySelectorAll<HTMLElement>('[data-z]').forEach(b => b.onclick = () => { S.z = Math.max(.8, Math.min(3, S.z + .25 * +b.dataset.z!)); if (S.view === 'nat' && S.z <= 1) S.px = S.py = 0; sync() });
    HOV = null; drawn = ''; sync(); drawMap();
  }

  /* ---------- shell: tabs with sliding pill, year toggle with sliding thumb, theme toggle, footer ---------- */
  const TABS = [['map', 'Map'], ['dashboard', 'National Dashboard'], ['compare', 'LGA Comparison'], ['insights', 'Political Insights'], ['method', 'Methodology']], NAV = [...TABS, ['about', 'About'], ['feedback', 'Feedback']];
  let anim = false;
  const slide = (box: HTMLElement | null, el: string, target: HTMLElement | null) => { const k = box?.querySelector<HTMLElement>(el); if (!box || !k) return; if (!target) { k.classList.remove('on'); return } k.style.width = target.offsetWidth + 'px'; k.style.transform = `translateX(${target.offsetLeft}px)`; k.classList.add('on'); k.classList.toggle('anim', anim) };
  const grp = (after: HTMLElement): HTMLElement => { let g = $('#ctrls'); if (!g) { g = document.createElement('div'); g.id = 'ctrls'; g.className = 'ctrls'; after.after(g) } return g };
  function buildTabs() { $('#tabs').innerHTML = TABS.map(([k, l]) => `<a href="#${k}" data-k="${k}">${l}</a>`).join('') + '<i class="ink" aria-hidden="true"></i>' }
  function buildYears() {
    const old = $('#year'); old.innerHTML = YEARS.map(y => `<option>${y}</option>`).join('');
    let seg = $('#yseg'); if (!seg) { seg = document.createElement('div'); seg.id = 'yseg'; seg.className = 'yseg'; seg.setAttribute('role', 'radiogroup'); seg.setAttribute('aria-label', 'Election year') }
    seg.innerHTML = YEARS.map(y => `<button type="button" role="radio" data-y="${y}">${y}</button>`).join('') + '<i class="thumb" aria-hidden="true"></i>';
    const box = grp(old); box.append(old, seg);                                     // desktop: the sliding toggle · phones: the dropdown
    const change = (y: string) => { setYear(y); gt('change_year', { year: y }); chrome(); swap(page) };
    seg.onclick = (e: any) => { const b = e.target.closest('button'); if (b && b.dataset.y !== S.y) change(b.dataset.y) };
    old.onchange = (e: any) => { change(e.target.value); done(e) };
  }
  function buildTheme() {
    let b = $('#themeToggle') || $('#thm');
    if (!b) { b = document.createElement('button'); b.id = 'thm'; b.type = 'button'; b.className = 'thm'; b.setAttribute('aria-label', 'Toggle dark mode'); b.innerHTML = `<svg class="moon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M16.5 11.5A6.5 6.5 0 0 1 8.5 3.5a6.5 6.5 0 1 0 8 8Z"/></svg><svg class="sun" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="10" cy="10" r="3.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4"/></svg>` }
    grp($('#year')).append(b); b.setAttribute('aria-pressed', String(isDark()));
    if (isDark()) { document.documentElement.classList.add('dark'); document.body.classList.add('dark') }
    b.onclick = () => {
      const d = !isDark(), h = document.documentElement; h.classList.add('tx'); h.dataset.theme = d ? 'dark' : 'light'; h.classList.toggle('dark', d); document.body.classList.toggle('dark', d);
      try { localStorage.setItem('nivo-theme', d ? 'dark' : 'light') } catch { } b.setAttribute('aria-pressed', String(d)); const label = b.querySelector('.theme-label'); if (label) label.textContent = d ? 'Light' : 'Dark';
      drawMap(); sync(); setTimeout(() => h.classList.remove('tx'), 450);
    };
  }
  function chrome() {
    const id = curId(), L = hasLga(), tabs = $('#tabs');
    tabs.querySelector('a[data-k=compare]').textContent = L ? 'LGA Comparison' : 'State Comparison';
    tabs.querySelectorAll('a').forEach((a: any) => a.dataset.k === id ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    slide(tabs, '.ink', tabs.querySelector('a[aria-current=page]'));
    const seg = $('#yseg'); seg.querySelectorAll('button').forEach((b: any) => b.setAttribute('aria-checked', String(b.dataset.y === S.y)));
    slide(seg, '.thumb', seg.querySelector(`button[data-y="${S.y}"]`)); $('#year').value = S.y; fit($('#year'));
    const label = (k: string, l: string) => k === 'compare' ? (L ? 'LGA Comparison' : 'State Comparison') : l;
    $('#navm').innerHTML = `<span class="chip">${label(id, NAV.find(t => t[0] === id)![1])}</span>${ic('sel', 20, '#919191')}<select id="navsel" aria-label="View">${NAV.map(([k, l]) => `<option value="${k}"${k === id ? ' selected' : ''}>${label(k, l)}</option>`).join('')}</select>`;
    $('#navsel').onchange = (e: any) => { location.hash = e.target.value; done(e) };
    document.documentElement.style.setProperty('--hdr', ($('.hd')?.offsetHeight || 96) + 'px');
  }
  let tk = 0;
  function swap(fn: () => void) {
    const v = $('#v'); if (RM) { fn(); return }
    const my = ++tk; v.classList.add('out');
    setTimeout(() => { if (my !== tk) return; fn(); v.classList.remove('out'); v.classList.add('in'); requestAnimationFrame(() => requestAnimationFrame(() => v.classList.remove('in'))) }, 180);
  }
  function page() {
    const id = curId(), v = $('#v'); document.body.classList.toggle('is-map', id === 'map'); v.innerHTML = V[id]();
    if (id === 'map') { S.srch = 0; if (location.hash.slice(1).split('/').length > 1) readUrl(); else pushUrl(true); mapInit(); bindMap() } else run(v);
    if (id === 'compare') { const L = hasLga(), items = UNITS().map(x => [x.n + '::' + x.s, L ? `${x.n} · ${x.s.replace(' State', '')}` : x.n]); bindCombo('c1', items, S.c1, k => { S.c1 = k; page() }); bindCombo('c2', items, S.c2, k => { S.c2 = k; page() }) }
    if (id === 'dashboard') loadElectionNews();
    if (id === 'insights') $('#flb')?.addEventListener('click', (e: any) => { const c = $('#flc'); const o = c.classList.toggle('open'); e.currentTarget.firstChild.textContent = o ? 'Show less ' : 'View all ' });
    if (id === 'feedback') bindFeedback();
    chrome();
  }
  function route() {
    if (location.hash === lastH) return; const was = idOf(lastH); lastH = location.hash;
    if (curId() === 'map' && was === 'map') { readUrl(); all(); drawMap(); return }
    chrome(); swap(page); scrollTo({ top: 0 });
  }

  buildTabs(); buildYears(); buildTheme(); page();
  requestAnimationFrame(() => requestAnimationFrame(() => { anim = true }));
  document.fonts?.ready.then(() => { chrome(); fitAll() });
  addEventListener('resize', () => { chrome(); sync(); fitAll() });
  addEventListener('hashchange', route); addEventListener('popstate', route);
  mob.addEventListener?.('change', () => { chrome(); page() });
}
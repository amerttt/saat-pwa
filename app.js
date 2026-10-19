'use strict';
(() => {
const FACES = ['Yuvarlak','Analog','Dünya','Parlayan','Modernist','Klasik','Minimal','Yıldız','Ay','Sözcük',
  'Kontur','Dilim','Yörünge','Çetele','Odak','Gün Yayı','Nixie','Kum Saati','İkili','Daktilo','Lav'];
const MAP_IDX = 2, LAVA_IDX = FACES.indexOf('Lav'), FOCUS_IDX = FACES.indexOf('Odak');
const KEY = 'saat.v1';
const DEF = { h24: true, night: false, date: false, lang: 'tr', awake: true, dim: 0, sec: false, focusMin: 25 };
const DIGITS = { '0': ['01110','10001','10011','10101','11001','10001','01110'], '1': ['00100','01100','00100','00100','00100','00100','01110'], '2': ['01110','10001','00001','00010','00100','01000','11111'], '3': ['11111','00010','00100','00010','00001','10001','01110'], '4': ['00010','00110','01010','10010','11111','00010','00010'], '5': ['11111','10000','11110','00001','00001','10001','01110'], '6': ['00110','01000','10000','11110','10001','10001','01110'], '7': ['11111','00001','00010','00100','01000','01000','01000'], '8': ['01110','10001','10001','01110','10001','10001','01110'], '9': ['01110','10001','10001','01111','00001','00010','01100'] };
const TRN = ['','bir','iki','üç','dört','beş','altı','yedi','sekiz','dokuz'], TRT = ['','on','yirmi','otuz','kırk','elli'];
const trNum = n => (TRT[Math.floor(n / 10)] + ' ' + TRN[n % 10]).trim();
const ENN = ['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const enNum = n => n < 20 ? ENN[n] : 'twenty' + (n % 10 ? '-' + ENN[n % 10] : '');
const TR_NOM = ['on iki','bir','iki','üç','dört','beş','altı','yedi','sekiz','dokuz','on','on bir'];
const TR_ACC = ['on ikiyi','biri','ikiyi','üçü','dördü','beşi','altıyı','yediyi','sekizi','dokuzu','onu','on biri'];
const TR_DAT = ['on ikiye','bire','ikiye','üçe','dörde','beşe','altıya','yediye','sekize','dokuza','ona','on bire'];
const EN_H = ['twelve','one','two','three','four','five','six','seven','eight','nine','ten','eleven'];
const MOON_TR = ['Yeni Ay','Hilal','İlk Dördün','Şişkin Ay','Dolunay','Şişkin Ay','Son Dördün','Hilal'];
const MOON_EN = ['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent'];
const TR = ['PAZ','PZT','SAL','ÇAR','PER','CUM','CMT'], EN = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const WAKE_TEXT = { on: 'Etkin', video: 'Etkin (yedek yöntem)', off: 'Kapalı', idle: 'Kapalı', unsupported: 'Bu tarayıcı desteklemiyor', err: 'İzin alınamadı' };
const TR_MONTH = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const EN_MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const TR_DAY = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
const EN_DAY = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const TAU = 2 * Math.PI, RAD = Math.PI / 180;

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const pad = n => String(n).padStart(2, '0');
// Tohumlu rastgele sayı: aynı tohum her seferinde aynı diziyi verir.
const rng = seed => { let s = seed % 2147483646 + 1; return () => (s = s * 16807 % 2147483647) / 2147483647; };
const dayKey = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const root = $('#root'), stage = $('#stage'), track = $('#track');

// ---------- durum ----------
let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
const S = {
  index: Number.isInteger(saved.index) ? Math.max(0, Math.min(FACES.length - 1, saved.index)) : 0,
  settings: Object.assign({}, DEF, saved.settings || {}),
  now: new Date(),
  portrait: false, size: { w: 0, h: 0 },
  showBattery: false, sheet: false, battery: null, wake: 'idle', landDots: null, dx: 0
};
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify({ index: S.index, settings: S.settings })); } catch (e) {} };

// ---------- saat ----------
function timeParts() {
  const d = S.now, H = d.getHours(), M = d.getMinutes();
  return { d, H, M, hh: S.settings.h24 ? pad(H) : String(H % 12 || 12), mm: pad(M) };
}
function setText(sel, v) { $$(sel).forEach(el => { if (el.textContent !== String(v)) el.textContent = v; }); }

function renderTime() {
  const { d, H, M, hh, mm } = timeParts(), en = S.settings.lang === 'en';
  setText('.t-hm', hh + ':' + mm); setText('.t-hh', hh); setText('.t-mm', mm);
  setText('.dn', d.getDate()); setText('.dw', (en ? EN : TR)[d.getDay()]);
  stage.style.setProperty('--hd', (H % 12) * 30 + M * 0.5);
  stage.style.setProperty('--md', M * 6);
  stage.style.setProperty('--mp', (M / 60 * 100).toFixed(1) + '%');
  renderYuvarlak(hh, mm);
  renderStars(hh, mm);
  renderMoon(d, en);
  renderWords(H, M, en);
  renderMap();
  renderOrrery(H, M);
  renderCetele(d, H, M, en);
  renderFocus();
  renderSunArc(d, en);
  renderNixie(hh, mm);
  renderHourglass(M);
  renderBinary(hh, mm);
  renderDaktilo(d, H, M, hh, mm, en);
  renderLava(d);
  fitBlocks();
  burnInShift(d);
}

// OLED yanma koruması: bütün yüzler dakikada bir en fazla 1-2 px kayar, ±BURN_PX içinde dolaşır.
// İki farklı periyot (17 ve 23 dakika) birlikte ~6,5 saatte bütün alanı tarar; geçiş animasyonsuzdur.
const BURN_PX = 3;
function burnInShift(d) {
  const t = Math.floor(d.getTime() / 60000);
  const dx = Math.round(BURN_PX * Math.sin(t * TAU / 17)), dy = Math.round(BURN_PX * Math.sin(t * TAU / 23 + 1));
  $('#faces').style.transform = `translate(${dx}px,${dy}px)`;
}

function renderYuvarlak(hh, mm) {
  const pal = ['#0b64cc', '#4da3f0'];
  const mk = (s, off) => s.split('').map((ch, i) => `<span style="color:${pal[(i + off) % 2]};z-index:${(i + off) % 2 ? 3 : 2}">${ch}</span>`).join('');
  $('#yv').innerHTML = mk(hh, 0) + '<div class="yv-colon"><i></i><i></i></div>' + mk(mm, hh.length);
  fitYuvarlak();
}
// Yalnız taşan saatlerde (08:08 gibi) küçültür; yatayda Dynamic Island kenarda ~52pt yer tutar.
function fitYuvarlak() {
  const el = $('#yv');
  el.style.fontSize = '';
  if (!S.size.w) return;
  const cs = getComputedStyle(el), sx = parseFloat(cs.getPropertyValue('--sx')) || 1;
  const w = el.scrollWidth * sx, max = 0.88 * S.size.w;
  if (w > max) el.style.fontSize = (parseFloat(cs.fontSize) * max / w).toFixed(1) + 'px';
}

// Dikdörtgen kadranın 60 çizgisi; yalnız ekran boyutu değişince hesaplanır.
function ticksHTML(gold) {
  const { w: W, h: H } = S.size;
  const R = Math.PI / 180, m = 0.065 * H, cx = W / 2, cy = H / 2, hw = cx - m, hh = cy - m;
  let out = '';
  for (let i = 0; i < 60; i++) {
    const dx = Math.sin(i * 6 * R), dy = -Math.cos(i * 6 * R);
    const tx = Math.abs(dx) > 1e-6 ? hw / Math.abs(dx) : Infinity, ty = Math.abs(dy) > 1e-6 ? hh / Math.abs(dy) : Infinity;
    const t = Math.min(tx, ty), side = tx < ty;
    const major = i % 5 === 0, k = i % 30;
    const L = (major ? (k === 0 ? 0.065 : k === 15 ? 0.19 : (k === 5 || k === 25) ? 0.22 : 0.38) : 0.062) * H;
    const wd = (major ? 0.009 : 0.005) * H;
    const mx = cx + dx * (t - L / 2), my = cy + dy * (t - L / 2);
    const c = gold ? (major ? '#c9a94f' : side ? '#7a6428' : '#4e4120') : (major ? '#a9a9ad' : side ? '#6e6e73' : '#3a3a3c');
    out += `<div class="tick" style="left:${mx.toFixed(1)}px;top:${my.toFixed(1)}px;width:${wd.toFixed(1)}px;height:${L.toFixed(1)}px;margin-left:${(-wd / 2).toFixed(1)}px;margin-top:${(-L / 2).toFixed(1)}px;background:${c};transform:rotate(${i * 6}deg)"></div>`;
  }
  return out;
}

let starsKey = '';
function renderStars(hh, mm) {
  const { w: W, h: Hh } = S.size, str = hh + ':' + mm;
  if (!W) return;
  const cols = str.split('').reduce((a, ch, i) => a + (i ? 1.5 : 0) + (ch === ':' ? 1 : 5), 0);
  const u = Math.min(0.065 * Hh, 0.9 * W / cols), key = str + '@' + u.toFixed(2);
  if (key === starsKey) return;
  starsKey = key;
  const dots = []; let x = 0, seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  str.split('').forEach((ch, ci) => {
    if (ci) x += 1.5 * u;
    if (ch === ':') { [2, 4].forEach(r => dots.push({ cx: x + u / 2, cy: r * u + u / 2 })); x += u; }
    else { (DIGITS[ch] || []).forEach((row, r) => { for (let c = 0; c < 5; c++) if (row[c] === '1') dots.push({ cx: x + c * u + u / 2, cy: r * u + u / 2 }); }); x += 5 * u; }
  });
  const el = $('#stars');
  el.style.width = x.toFixed(1) + 'px';
  el.style.height = (7 * u).toFixed(1) + 'px';
  el.style.setProperty('--glow', (0.14 * u).toFixed(1) + 'px');
  el.innerHTML = dots.map(p => {
    const d = u * (0.15 + rnd() * 0.09);
    return `<i style="left:${(p.cx - d / 2).toFixed(1)}px;top:${(p.cy - d / 2).toFixed(1)}px;width:${d.toFixed(1)}px;height:${d.toFixed(1)}px;opacity:${(0.7 + rnd() * 0.3).toFixed(2)}"></i>`;
  }).join('');
}

function renderBgStars() {
  let s = 12345; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  let out = '', n = 0;
  while (n < 70) {
    const x = r() * 100, y = r() * 100;
    if (x > 14 && x < 86 && y > 20 && y < 80) continue;
    const d = (0.3 + r() * 0.5).toFixed(2) + 'cqh';
    out += `<i style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;width:${d};height:${d};opacity:${(0.15 + r() * 0.4).toFixed(2)}"></i>`;
    n++;
  }
  $('#bg-stars').innerHTML = out;
}

function renderMoon(d, en) {
  let p = ((d.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5 / 29.530588853) % 1; if (p < 0) p += 1;
  const r = 48, c = Math.cos(2 * Math.PI * p), rx = (r * Math.abs(c)).toFixed(2);
  const path = p < 0.5
    ? `M0,-${r} A${r},${r} 0 0 0 0,${r} A${rx},${r} 0 0 ${c > 0 ? 0 : 1} 0,-${r} Z`
    : `M0,-${r} A${r},${r} 0 0 1 0,${r} A${rx},${r} 0 0 ${c < 0 ? 0 : 1} 0,-${r} Z`;
  const i = Math.round(p * 8) % 8;
  $('#moon-shadow').setAttribute('d', path);
  setText('#moon-name', en ? MOON_EN[i] : MOON_TR[i]);
}

function renderWords(H, M, en) {
  const h = H % 12, nh = (H + 1) % 12, L = (t, dim) => ({ t, c: dim ? '#6a675f' : '#c4bfb2' });
  let lines;
  if (en) {
    if (M === 0) lines = [L(EN_H[h]), L("o'clock", true)];
    else if (M === 30) lines = [L('half past', true), L(EN_H[h])];
    else if (M === 15) lines = [L('quarter'), L('past', true), L(EN_H[h])];
    else if (M === 45) lines = [L('quarter'), L('to', true), L(EN_H[nh])];
    else if (M < 30) lines = [L(enNum(M)), L('past', true), L(EN_H[h])];
    else lines = [L(enNum(60 - M)), L('to', true), L(EN_H[nh])];
  } else {
    if (M === 0) lines = [L('saat', true), L(TR_NOM[h])];
    else if (M === 30) lines = [L(TR_NOM[h]), L('buçuk')];
    else if (M === 15) lines = [L(TR_ACC[h]), L('çeyrek'), L('geçiyor', true)];
    else if (M === 45) lines = [L(TR_DAT[nh]), L('çeyrek'), L('var', true)];
    else if (M < 30) lines = [L(TR_ACC[h]), L(trNum(M)), L('geçiyor', true)];
    else lines = [L(TR_DAT[nh]), L(trNum(60 - M)), L('var', true)];
  }
  $('#words').innerHTML = lines.map(l => `<div style="color:${l.c}">${l.t}</div>`).join('');
}

// ---------- harita (nokta listesi önceden hesaplandı: land-dots.json) ----------
let mapStarted = false, mapKey = '', mapCircles = null, mapLit = null;
function maybeLoadMap(idx) {
  if (Math.abs(idx - MAP_IDX) > 1 || mapStarted) return;
  mapStarted = true;
  $('#map-pending').hidden = false;
  fetch('land-dots.json').then(r => r.json()).then(flat => {
    const pts = [];
    for (let i = 0; i < flat.length; i += 2) pts.push([flat[i], flat[i + 1]]);
    S.landDots = pts;
    const circles = pts.map(p => `<circle cx="${p[0] + 180}" cy="${84 - p[1]}" r="1.05" fill="#3c3c42"></circle>`).join('');
    $('#map').innerHTML = `<svg viewBox="0 0 360 142" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${circles}` +
      '<circle cx="208.97" cy="42.99" r="6" fill="rgba(255,159,10,.28)"></circle><circle cx="208.97" cy="42.99" r="3" fill="#ff9f0a"></circle></svg>';
    mapCircles = $('#map svg').querySelectorAll('circle');
    mapLit = new Array(pts.length).fill(false);
    $('#map-pending').hidden = true;
    renderMap();
  }).catch(() => { $('#map-pending').hidden = true; mapStarted = false; });
}
// Gündüz/gece çizgisi: güneşin deklinasyonu ve UTC saatinden, dakikada bir.
function renderMap() {
  const pts = S.landDots;
  if (!pts || Math.abs(S.index - MAP_IDX) > 1) return;
  const d = S.now, key = d.getUTCHours() + ':' + d.getUTCMinutes();
  if (key === mapKey) return;
  mapKey = key;
  const y = d.getUTCFullYear(), N = Math.floor((Date.UTC(y, d.getUTCMonth(), d.getUTCDate()) - Date.UTC(y, 0, 1)) / 864e5) + 1;
  const R = Math.PI / 180, decl = -23.44 * Math.cos(2 * Math.PI * (N + 10) / 365) * R;
  const subLon = 180 - (d.getUTCHours() + d.getUTCMinutes() / 60) * 15;
  const sd = Math.sin(decl), cd = Math.cos(decl);
  pts.forEach((p, i) => {
    const la = p[1] * R, lit = Math.sin(la) * sd + Math.cos(la) * cd * Math.cos((p[0] - subLon) * R) > 0;
    if (lit !== mapLit[i]) { mapLit[i] = lit; mapCircles[i].setAttribute('fill', lit ? '#d6d6da' : '#3c3c42'); }
  });
}

// ---------- v2 yüzleri ----------
// Kontur ve Dilim: blok, genişliği data-fit × ekran genişliğini aşarsa küçültülür.
function fitBlocks() {
  if (!S.size.w) return;
  $$('.fit').forEach(el => {
    el.style.transform = '';
    const s = parseFloat(el.dataset.fit) * S.size.w / el.offsetWidth;
    el.style.transform = s < 1 ? `scale(${s.toFixed(3)})` : '';
  });
}

// Yörünge: dış yörüngede saat gezegeni (12 saatte bir tur), iç yörüngede dakika gezegeni.
function buildOrrery() {
  let t = '';
  for (let k = 0; k < 12; k++) {
    const s = Math.sin(k * 30 * RAD), c = -Math.cos(k * 30 * RAD);
    t += `<line x1="${(43 * s).toFixed(2)}" y1="${(43 * c).toFixed(2)}" x2="${(47.5 * s).toFixed(2)}" y2="${(47.5 * c).toFixed(2)}" stroke="${k ? '#3d3850' : '#ffcf73'}" stroke-width=".7" stroke-linecap="round"/>`;
  }
  $('#orr-ticks').innerHTML = t;
  const r = rng(4242);
  let s = '';
  for (let i = 0; i < 70; i++) {
    const d = (0.25 + r() * 0.45).toFixed(2) + 'cqh';
    s += `<i style="left:${(r() * 100).toFixed(1)}%;top:${(r() * 100).toFixed(1)}%;width:${d};height:${d};opacity:${(0.12 + r() * 0.4).toFixed(2)}"></i>`;
  }
  $('#orr-stars').innerHTML = s;
}
function renderOrrery(H, M) {
  const hf = ((H % 12) * 60 + M) / 720, mf = M / 60;
  const at = (r, f) => `translate(${(r * Math.sin(f * TAU)).toFixed(2)} ${(-r * Math.cos(f * TAU)).toFixed(2)})`;
  $('#orr-h').setAttribute('transform', at(40, hf));
  $('#orr-m').setAttribute('transform', at(26, mf));
  const moon = 5 * hf * TAU + 1.2, el = $('#orr-moon');
  el.setAttribute('cx', (5.6 * Math.sin(moon)).toFixed(2));
  el.setAttribute('cy', (-5.6 * Math.cos(moon)).toFixed(2));
  [['#orr-trail-h', hf], ['#orr-trail-m', mf]].forEach(([sel, f]) => {
    const c = $(sel);
    c.setAttribute('stroke-dasharray', `${(f * 100).toFixed(2)} 100`);
    c.style.visibility = f > 0 ? '' : 'hidden';
  });
}

// Çetele: 24 çentik, dörtlü grupların üstünden beşinci çapraz çizgi; geçmiş saat beyaz, şimdiki sarı.
function buildTally() {
  const r = rng(268), j = () => r() * 2 - 1;
  let s = '';
  for (let k = 0; k < 24; k++) {
    const g = Math.floor(k / 5), p = k % 5, x0 = 10 + g * 52;
    const [x1, y1, x2, y2] = p < 4 ? [x0 + p * 9, 6, x0 + p * 9, 34] : [x0 - 5, 31, x0 + 32, 9];
    s += `<line x1="${(x1 + j()).toFixed(1)}" y1="${(y1 + j()).toFixed(1)}" x2="${(x2 + j()).toFixed(1)}" y2="${(y2 + j()).toFixed(1)}" stroke-width="3" stroke-linecap="round"/>`;
  }
  $('#ct-tally').innerHTML = s;
}
function renderCetele(d, H, M, en) {
  const y = d.getFullYear(), leap = new Date(y, 1, 29).getMonth() === 1;
  const doy = Math.round((Date.UTC(y, d.getMonth(), d.getDate()) - Date.UTC(y, 0, 1)) / 864e5) + 1;
  setText('#ct-doy', `${en ? 'DAY' : 'GÜN'} ${doy} / ${leap ? 366 : 365}`);
  const left = 1440 - (H * 60 + M), lh = pad(Math.floor(left / 60)), lm = pad(left % 60);
  $('#ct-left').innerHTML = en ? `LEFT TODAY <b>${lh}</b> H <b>${lm}</b> M` : `BUGÜNDEN KALAN <b>${lh}</b> SA <b>${lm}</b> DK`;
  $$('#ct-tally line').forEach((el, k) => el.setAttribute('stroke', k < H ? '#f2efe6' : k === H ? '#ffc400' : '#262624'));
}

// Odak: yüze dokununca başlar/durur. Süre ayarlardan; çalışan oturum başladığı süreyi korur.
// Saniyelik iş yok: bitişe kurulu tek setTimeout ve dakikalık tick.
const FOCUS_KEY = 'saat.focus';
let focus = { start: null, n: 0, day: dayKey(new Date()), dur: DEF.focusMin }, focusT;
try { Object.assign(focus, JSON.parse(localStorage.getItem(FOCUS_KEY) || '{}')); } catch (e) {}
const saveFocus = () => { try { localStorage.setItem(FOCUS_KEY, JSON.stringify(focus)); } catch (e) {} };
const focusEnd = () => focus.start + focus.dur * 60000;
function checkFocus() {
  const now = Date.now();
  if (focus.start && now >= focusEnd()) {
    const endDay = dayKey(new Date(focusEnd()));
    if (focus.day !== endDay) { focus.day = endDay; focus.n = 0; }
    focus.n++; focus.start = null; saveFocus();
  }
  const today = dayKey(new Date(now));
  if (focus.day !== today) { focus.day = today; focus.n = 0; saveFocus(); }
  clearTimeout(focusT);
  if (focus.start) focusT = setTimeout(renderFocus, focusEnd() - now + 50);
}
function toggleFocus() {
  if (focus.start) focus.start = null;
  else { focus.start = Date.now(); focus.dur = S.settings.focusMin; }
  saveFocus(); renderFocus();
}
function renderFocus() {
  checkFocus();
  const en = S.settings.lang === 'en', run = !!focus.start, now = Date.now();
  const dur = run ? focus.dur : S.settings.focusMin;
  const left = run ? Math.max(1, Math.ceil((focusEnd() - now) / 60000)) : dur;
  const frac = run ? Math.min(1, Math.floor((now - focus.start) / 60000) / dur) : 0;
  const num = $('#fc-num');
  num.textContent = left;
  num.style.color = run ? '#fff' : '#48484a';
  setText('#fc-label', run ? (en ? 'MIN FOCUS' : 'DK ODAK') : (en ? 'TAP TO START' : 'BAŞLAMAK İÇİN DOKUN'));
  const ring = $('#fc-ring');
  ring.setAttribute('stroke-dasharray', `${(frac * 100).toFixed(2)} 100`);
  ring.style.visibility = frac > 0 ? '' : 'hidden';
  $$('#fc-boxes>i').forEach((el, i) => el.classList.toggle('on', i < focus.n));
  setText('#fc-count', (en ? 'TODAY ' : 'BUGÜN ') + focus.n);
}

// Gün Yayı: İstanbul için gün doğumu/batımı, NOAA denklemleri (denklem zamanı + deklinasyon,
// ufukta 90.833° saat açısı). Ağ gerekmez; sonuç güne göre önbelleğe alınır.
function sunTimes(y, mo, d) {
  const lat = 41.01 * RAD, lon = 28.97;
  const N = Math.round((Date.UTC(y, mo, d) - Date.UTC(y, 0, 1)) / 864e5) + 1, g = TAU / 365 * (N - 1);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g)
    + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const ha = Math.acos(Math.cos(90.833 * RAD) / (Math.cos(lat) * Math.cos(decl)) - Math.tan(lat) * Math.tan(decl)) / RAD;
  const base = Date.UTC(y, mo, d);
  return { rise: base + (720 - 4 * (lon + ha) - eq) * 60000, set: base + (720 - 4 * (lon - ha) - eq) * 60000 };
}
let sunCache = {};
function sunFor(d) {
  const k = dayKey(d);
  if (!sunCache[k]) { if (Object.keys(sunCache).length > 8) sunCache = {}; sunCache[k] = sunTimes(d.getFullYear(), d.getMonth(), d.getDate()); }
  return sunCache[k];
}
function fmtTime(ts) {
  const t = new Date(ts), H = t.getHours(), M = t.getMinutes();
  return (S.settings.h24 ? pad(H) : String(H % 12 || 12)) + ':' + pad(M);
}
function renderSunArc(d, en) {
  const now = d.getTime(), DAY = 864e5, T = sunFor(d), trail = $('#sa-trail');
  let x, y, lit = now >= T.rise && now < T.set;
  if (lit) {
    const t = (now - T.rise) / (T.set - T.rise);
    x = 100 - 80 * Math.cos(Math.PI * t); y = 70 - 52 * Math.sin(Math.PI * t);
    trail.setAttribute('d', `M 20 70 A 80 52 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`);
  } else {
    // Gece: güneş ufkun altındaki yayda batıdan (sağ) doğuya (sol) yürür.
    const prevSet = now >= T.set ? T.set : sunFor(new Date(now - DAY)).set;
    const nextRise = now >= T.set ? sunFor(new Date(now + DAY)).rise : T.rise;
    const t = (now - prevSet) / (nextRise - prevSet);
    x = 100 + 80 * Math.cos(Math.PI * t); y = 70 + 18 * Math.sin(Math.PI * t);
    trail.removeAttribute('d');
  }
  [$('#sa-sun'), $('#sa-glow')].forEach(c => { c.setAttribute('cx', x.toFixed(2)); c.setAttribute('cy', y.toFixed(2)); });
  $('#sa-sun').setAttribute('fill', lit ? '#ffd27a' : '#6b5a48');
  $('#sa-glow').setAttribute('opacity', lit ? 1 : 0.2);
  setText('#sa-rise-k', en ? 'SUNRISE' : 'DOĞUŞ'); setText('#sa-rise', fmtTime(T.rise));
  setText('#sa-set-k', en ? 'SUNSET' : 'BATIŞ'); setText('#sa-set', fmtTime(T.set));
}

// Nixie: 12 saat biçiminde tek haneli saat ilk tüpü boş bırakır, yalnız soluk "8" görünür.
function renderNixie(hh, mm) {
  const s = hh.padStart(2, ' ') + mm;
  $$('.nx-d').forEach((el, i) => { el.textContent = s[i].trim(); });
}

// Kum Saati: kum her saat başı yenilenir; üst yüzey 24'ten 70'e iner, alt yığın 44 birime kadar büyür.
function renderHourglass(M) {
  const f = M / 60, ys = 24 + f * 46, h = f * 44;
  $('#hg-top').setAttribute('d', `M 0 ${ys.toFixed(1)} Q 50 ${Math.min(ys + 5, 70).toFixed(1)} 100 ${ys.toFixed(1)} L 100 70 L 0 70 Z`);
  $('#hg-bot').setAttribute('d', `M 0 130 V ${(130 - 0.4 * h).toFixed(1)} Q 50 ${(130 - 1.6 * h).toFixed(1)} 100 ${(130 - 0.4 * h).toFixed(1)} V 130 Z`);
  $('#hg-stream').setAttribute('y2', (130 - h).toFixed(1));
}

// İkili (BCD): sütunlar saat onlar/birler, dakika onlar/birler; satırlar 8-4-2-1.
// Hiç yanamayacak bitler gizli: saat onlar en fazla 2 (2 bit), dakika onlar en fazla 5 (3 bit).
const BIN_BITS = [2, 4, 3, 4];
function buildBinary() {
  const leg = '<div class="bleg">' + [8, 4, 2, 1].map(b => `<span>${b}</span>`).join('') + '<span style="height:6cqh"></span></div>';
  const col = i => `<div class="bcol${i > 1 ? ' m' : ''}${i === 2 ? ' gap' : ''}">` + '<i class="bd"></i>'.repeat(4) + '<div class="bdig"></div></div>';
  $('#bin').innerHTML = leg + [0, 1, 2, 3].map(col).join('');
}
function renderBinary(hh, mm) {
  const ds = (hh.padStart(2, '0') + mm).split('').map(Number);
  $$('#bin .bcol').forEach((col, i) => {
    col.querySelectorAll('.bd').forEach((dot, r) => {
      dot.classList.toggle('na', r < 4 - BIN_BITS[i]);
      dot.classList.toggle('on', !!(ds[i] & (8 >> r)));
    });
    col.querySelector('.bdig').textContent = ds[i];
  });
}

// Daktilo: her karakter tohumlu titreme alır; tohum günün dakikası, desen dakikada bir değişir.
function renderDaktilo(d, H, M, hh, mm, en) {
  const r = rng(H * 60 + M + 1);
  $('#dk').innerHTML = (hh + ':' + mm).split('').map((ch, i) => {
    const ty = (r() * 1.4).toFixed(2), rot = ((r() * 2 - 1) * 1.75).toFixed(2), op = Math.min(1, 0.86 + r() * 0.28).toFixed(2);
    return `<span style="transform:translateY(${ty}cqh) rotate(${rot}deg);opacity:${op};color:${i > hh.length ? '#d9463b' : '#e8e2d4'}">${ch}</span>`;
  }).join('');
  const m = d.getMonth(), w = d.getDay();
  setText('#dk-date', en ? `${EN_MONTH[m]} ${d.getDate()}, ${d.getFullYear()}, ${EN_DAY[w]}` : `${d.getDate()} ${TR_MONTH[m]} ${d.getFullYear()}, ${TR_DAY[w]}`);
}

// Lav: altı yumuşak leke. Yalnız yüz ekrandayken, dakikada bir yeni konuma 24 saniyede kayar.
const LAVA = [[70, '#ff5a1f'], [55, '#ff2d2d'], [85, '#ff8a1f'], [48, '#e8341c'], [62, '#ffb03a'], [40, '#ff4a2a']];
let lavaKey = -1;
function buildLava() {
  const r = rng(77);
  $('#lava').innerHTML = LAVA.map(([s, c]) =>
    `<i style="width:${s}cqh;height:${s}cqh;opacity:${(0.55 + r() * 0.35).toFixed(2)};background:radial-gradient(circle,${c} 0 30%,transparent 70%);transition:none"></i>`).join('');
  renderLava(S.now, true);
  void $('#lava').offsetWidth;
  $$('#lava>i').forEach(el => { el.style.transition = ''; });
}
function renderLava(d, force) {
  if (S.index !== LAVA_IDX && !force) return;
  const mod = d.getHours() * 60 + d.getMinutes();
  if (mod === lavaKey) return;
  lavaKey = mod;
  const r = rng(mod + 1000);
  $$('#lava>i').forEach(el => {
    el.style.transform = `translate(${(12 + r() * 76).toFixed(1)}cqw, ${(18 + r() * 64).toFixed(1)}cqh) translate(-50%, -50%)`;
  });
}

// ---------- yerleşim ----------
function measure() {
  const w = root.clientWidth || window.innerWidth, h = root.clientHeight || window.innerHeight;
  if (!w || !h) return;
  const portrait = h > w, size = portrait ? { w: h, h: w } : { w, h };
  if (portrait === S.portrait && size.w === S.size.w && size.h === S.size.h) return;
  S.portrait = portrait; S.size = size;
  stage.classList.toggle('portrait', portrait);
  stage.style.width = portrait ? size.w + 'px' : '';
  stage.style.height = portrait ? size.h + 'px' : '';
  $('#an-ticks').innerHTML = ticksHTML(false);
  $('#kl-ticks').innerHTML = ticksHTML(true);
  const cap = 0.84 * 0.5 * size.w, scale = Math.max(1.15, Math.min(2.4, (1.18 * size.h) / cap));
  $('#modern').style.transform = `scaleY(${scale.toFixed(3)})`;
  const { hh, mm } = timeParts();
  renderStars(hh, mm);
  fitYuvarlak();
  fitBlocks();
}

// ---------- yüzler arası geçiş ----------
const dotsEl = $('#dots');
dotsEl.innerHTML = FACES.map(() => '<i></i>').join('');
let dotsT;
function showDots() {
  dotsEl.hidden = false;
  dotsEl.querySelectorAll('i').forEach((el, i) => el.classList.toggle('on', i === S.index));
}
function hideDotsLater() { clearTimeout(dotsT); dotsT = setTimeout(() => { dotsEl.hidden = true; }, 1400); }
track.style.setProperty('--n', FACES.length);
function setTrack() { track.style.transform = `translateX(calc(${(-S.index * 100 / FACES.length).toFixed(4)}% + ${S.dx}px))`; }
function go(i) {
  S.index = Math.max(0, Math.min(FACES.length - 1, i));
  S.dx = 0; track.classList.remove('dragging'); setTrack();
  persist(); showDots(); hideDotsLater();
  maybeLoadMap(S.index); renderMap(); renderLava(S.now);
}

// ---------- dokunma ----------
let ptr = null, lp = null, lpOpen = false, suppressClickUntil = 0;
const localDx = e => S.portrait ? e.clientY - ptr.y : e.clientX - ptr.x;
root.addEventListener('pointerdown', e => {
  if (S.wake !== 'on' && S.wake !== 'video') requestWake();
  if (S.sheet) return;
  ptr = { x: e.clientX, y: e.clientY, moved: false };
  clearTimeout(lp);
  lp = setTimeout(() => { lp = null; ptr = null; lpOpen = true; S.dx = 0; track.classList.remove('dragging'); setTrack(); openSheet(); }, 550);
});
root.addEventListener('pointermove', e => {
  if (!ptr) return;
  const dx = localDx(e), dy = S.portrait ? e.clientX - ptr.x : e.clientY - ptr.y;
  if (!ptr.moved && Math.hypot(dx, dy) > 10) { ptr.moved = true; clearTimeout(lp); lp = null; }
  if (ptr.moved) { S.dx = dx; track.classList.add('dragging'); setTrack(); showDots(); }
});
root.addEventListener('pointerup', e => {
  if (!ptr) return;
  clearTimeout(lp); lp = null;
  const dx = localDx(e), moved = ptr.moved; ptr = null;
  if (moved) {
    const w = S.size.w || 800; let idx = S.index;
    if (dx < -w * 0.15) idx++; else if (dx > w * 0.15) idx--;
    go(idx);
  } else {
    S.dx = 0; track.classList.remove('dragging'); setTrack();
    if (S.index === FOCUS_IDX) toggleFocus();   // Odak yüzünde dokunuş (kaydırma değil) zamanlayıcıyı aç/kapa
  }
  hideDotsLater();
});
const cancel = () => {
  clearTimeout(lp); lp = null;
  if (ptr) { ptr = null; S.dx = 0; track.classList.remove('dragging'); setTrack(); hideDotsLater(); }
};
root.addEventListener('pointercancel', cancel);
root.addEventListener('pointerleave', cancel);
root.addEventListener('contextmenu', e => e.preventDefault());
// Uzun basışla açılan sayfa, parmak kalkınca gelen tıklamayla hemen kapanmasın.
window.addEventListener('pointerup', () => { if (lpOpen) { lpOpen = false; suppressClickUntil = performance.now() + 400; } }, true);

window.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') go(S.index + 1);
  else if (e.key === 'ArrowLeft') go(S.index - 1);
  else if (e.key === 'Escape') closeSheet();
  else if (e.key === 'b') { S.showBattery = !S.showBattery; renderBattery(); }
});

// ---------- pil ----------
const stop = e => e.stopPropagation();
$('#bat-hit').addEventListener('pointerdown', stop);
$('#bat-hit').addEventListener('click', () => { S.showBattery = !S.showBattery; renderBattery(); });
function renderBattery() {
  const el = $('#bat');
  el.hidden = !S.showBattery;
  if (el.hidden) return;
  const b = S.battery, night = S.settings.night, level = b ? b.level : null, low = level !== null && level <= 20;
  const color = night ? (low ? '#8f6a5c' : '#8a8478') : (low ? '#ff453a' : '#30d158');
  $('#bat-track').setAttribute('stroke', night ? 'rgba(138,132,120,.16)' : 'rgba(255,255,255,.14)');
  const ring = $('#bat-ring');
  ring.setAttribute('stroke', color);
  ring.setAttribute('stroke-dasharray', `${level || 0} 100`);
  ring.style.visibility = level ? '' : 'hidden';
  const num = $('#bat-num');
  num.textContent = level === null ? '–' : level;
  num.style.color = level === null ? '#8e8e93' : color;
  $('#bat-bolt polygon').setAttribute('fill', color);
  const charging = !!(b && b.charging);
  el.classList.toggle('charging', charging);
  $('#bat-bolt').hidden = !charging;
}
// iOS Safari pil bilgisi vermiyor: orada gösterge, sağ üst dokunma alanı ve ayarlardaki pil ipucu tamamen kalkar.
function hideBattery() { S.showBattery = false; $('#bat-hit').hidden = true; $('#hint-bat').hidden = true; }
if (navigator.getBattery) navigator.getBattery().then(b => {
  const upd = () => { S.battery = { level: Math.round(b.level * 100), charging: b.charging }; renderBattery(); renderSettings(); };
  upd(); b.addEventListener('levelchange', upd); b.addEventListener('chargingchange', upd);
}).catch(hideBattery);
else hideBattery();

// ---------- ekranı açık tutma ----------
let wl = null, video = null;
function setWake(w) { S.wake = w; setText('#wake-text', WAKE_TEXT[w]); }
async function requestWake() {
  if (!S.settings.awake || document.visibilityState !== 'visible') return;
  if ('wakeLock' in navigator) {
    if (wl && !wl.released) return;
    try {
      wl = await navigator.wakeLock.request('screen');
      setWake('on');
      wl.addEventListener('release', () => {
        wl = null; setWake('off');
        if (S.settings.awake && document.visibilityState === 'visible') requestWake();
      });
    } catch (e) { setWake('err'); }
  } else startVideoFallback();
}
// iOS 16.4 öncesi: sessiz, döngülü, satır içi video (NoSleep yöntemi). İlk dokunuşta başlar.
function startVideoFallback() {
  if (video && !video.paused) return;
  const play = () => {
    if (!video) {
      video = document.createElement('video');
      video.setAttribute('playsinline', ''); video.setAttribute('muted', ''); video.setAttribute('loop', '');
      video.muted = true; video.src = self.NOSLEEP_MP4;
    }
    video.play().then(() => setWake('video')).catch(() => setWake('unsupported'));
  };
  if (self.NOSLEEP_MP4) return play();
  const s = document.createElement('script');
  s.src = 'nosleep-video.js'; s.onload = play; s.onerror = () => setWake('unsupported');
  document.head.appendChild(s);
}
function releaseWake() {
  if (wl) { try { wl.release(); } catch (e) {} wl = null; }
  if (video) video.pause();
  setWake('off');
}

// ---------- saniye ibresi (CSS animasyonu, negatif gecikmeyle hizalı) ----------
function syncSec() {
  const n = new Date(), delay = -(n.getSeconds() + n.getMilliseconds() / 1000) + 's';
  $$('.sec').forEach(el => {
    el.hidden = !S.settings.sec;
    if (el.hidden) return;
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    el.style.animationDelay = delay;
  });
}

// ---------- ayarlar ----------
const sheetBg = $('#sheet-bg');
function openSheet() { S.sheet = true; renderSettings(); sheetBg.hidden = false; }
function closeSheet() { S.sheet = false; sheetBg.hidden = true; }
sheetBg.addEventListener('pointerdown', stop);
sheetBg.addEventListener('click', e => {
  if (e.target !== sheetBg || lpOpen || performance.now() < suppressClickUntil) return;
  closeSheet();
});
$('#sheet').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.act === 'close') return closeSheet();
  if (b.dataset.toggle) return setSetting(b.dataset.toggle, !S.settings[b.dataset.toggle]);
  if (b.dataset.set) return setSetting(b.dataset.set, b.dataset.val === 'true' ? true : b.dataset.val === 'false' ? false : b.dataset.val);
  if (b.dataset.step) return setSetting('focusMin', Math.max(5, Math.min(120, S.settings.focusMin + Number(b.dataset.step))));
});
$('#dim-range').addEventListener('input', e => setSetting('dim', Number(e.target.value)));

function setSetting(k, v) {
  S.settings[k] = v;
  persist(); applySettings();
  if (k === 'awake') v ? requestWake() : releaseWake();
  if (k === 'sec') syncSec();
  if (k === 'h24' || k === 'lang') renderTime();
  if (k === 'focusMin') renderFocus();
}
function applySettings() {
  const st = S.settings;
  document.body.classList.toggle('night', st.night);
  document.body.classList.toggle('show-date', st.date);
  $('#dim').style.opacity = (st.dim || 0) / 100;
  renderSettings(); renderBattery();
}
function renderSettings() {
  const st = S.settings;
  $$('#sheet .sw').forEach(b => b.setAttribute('aria-checked', String(!!st[b.dataset.toggle])));
  $$('#sheet .seg>button').forEach(b => b.classList.toggle('sel', String(st[b.dataset.set]) === b.dataset.val));
  $('#dim-range').value = st.dim || 0;
  setText('#dim-label', (st.dim || 0) + '%');
  setText('#wake-text', WAKE_TEXT[S.wake]);
  setText('#bat-source', S.battery ? 'Pil: cihazdan okunuyor' : '');
  setText('#focus-min', st.focusMin + ' dk');
}

// ---------- kurulum ipucu ----------
const standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
let dismissed = false; try { dismissed = !!localStorage.getItem('saat.install'); } catch (e) {}
const install = $('#install');
install.hidden = standalone || dismissed;
install.addEventListener('pointerdown', stop);
install.querySelector('[data-act=install-ok]').addEventListener('click', () => {
  try { localStorage.setItem('saat.install', '1'); } catch (e) {}
  install.hidden = true;
});

// ---------- dakika saati: setInterval yok, dakika sınırına hizalı tek setTimeout ----------
let tickT;
function scheduleTick() {
  clearTimeout(tickT);
  tickT = setTimeout(() => { S.now = new Date(); renderTime(); scheduleTick(); }, 60000 - (Date.now() % 60000) + 80);
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  S.now = new Date(); renderTime(); scheduleTick(); syncSec(); requestWake();
});

// ---------- başlat ----------
renderBgStars();
buildOrrery();
buildTally();
buildBinary();
$('#fc-boxes').innerHTML = '<i></i>'.repeat(4);
measure();
buildLava();
window.addEventListener('resize', measure);
window.addEventListener('orientationchange', measure);
if (window.ResizeObserver) new ResizeObserver(measure).observe(root);
setTrack();
applySettings();
renderTime();
scheduleTick();
syncSec();
maybeLoadMap(S.index);
requestWake();
// Fredoka gibi geç yüklenen font gelince genişlik değişir; yeniden sığdır.
const refit = () => { fitYuvarlak(); fitBlocks(); };
document.fonts.ready.then(refit);
document.fonts.addEventListener('loadingdone', refit);

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();

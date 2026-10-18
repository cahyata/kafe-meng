(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var api = window.api || { setIgnore: function () {}, quit: function () {}, onOpenPanel: function () {}, onToggleHud: function () {}, onNotice: function () {}, onCursor: function () {} };
  var hasFile = typeof api.loadSave === "function";
  var KEY = "kafe-meong-taskbar-v1";
  var CAT = 72, HUD_W = 380;
  var t = window.I18N.t;

  var BREEDS = [
    { id: "oren",   nama: "Kucing Oren",  w: 60, mult: 1,   body: "#f4a259", belly: "#ffe3c2", pat: "stripe", stripe: "#d9822f", eye: "#3b2a1a" },
    { id: "abu",    nama: "Si Abu",       w: 60, mult: 1,   body: "#a8adb8", belly: "#e6e8ee", pat: "stripe", stripe: "#7f8593", eye: "#2a2f3a" },
    { id: "hitam",  nama: "Hitam Manis",  w: 40, mult: 1.2, body: "#4a4356", belly: "#5d556b", pat: "solid",  stripe: "#4a4356", eye: "#f2c94c" },
    { id: "putih",  nama: "Putih Salju",  w: 40, mult: 1.2, body: "#f7f4fb", belly: "#ffffff", pat: "solid",  stripe: "#f7f4fb", eye: "#4a83c9" },
    { id: "tuxedo", nama: "Tuxedo",       w: 25, mult: 1.5, body: "#463f55", belly: "#ffffff", pat: "tuxedo", stripe: "#463f55", eye: "#7bd18a" },
    { id: "siam",   nama: "Siam Krim",    w: 15, mult: 1.8, body: "#f1dfc6", belly: "#fbf1e2", pat: "siam",   stripe: "#7a5a47", eye: "#4a83c9" },
    { id: "calico", nama: "Tiga Warna",   w: 12, mult: 2,   body: "#fbf6ee", belly: "#ffffff", pat: "calico", stripe: "#f08a3c", eye: "#3b2a1a" },
    { id: "emas",   nama: "Kucing Emas",  w: 3,  mult: 5,   body: "#f2c94c", belly: "#fff0b8", pat: "stripe", stripe: "#d9a526", eye: "#5b3a12" },
    { id: "kelabu",  nama: "Biru Kelabu",   w: 30, mult: 1.3, body: "#8e9db4", belly: "#c9d3e2", pat: "solid",  stripe: "#8e9db4", eye: "#6bd18a" },
    { id: "cokelat", nama: "Cokelat Susu",  w: 35, mult: 1.3, body: "#9b6b4a", belly: "#d9b79a", pat: "solid",  stripe: "#9b6b4a", eye: "#f2c94c" },
    { id: "krem",    nama: "Krem Vanila",   w: 35, mult: 1.3, body: "#f1deb8", belly: "#fff3d9", pat: "solid",  stripe: "#f1deb8", eye: "#e0a43a" },
    { id: "belang",  nama: "Macan Belang",  w: 20, mult: 1.6, body: "#c98a4b", belly: "#f2d3a8", pat: "stripe", stripe: "#4a2e18", eye: "#6bd18a" },
    { id: "smoking", nama: "Tuxedo Abu",    w: 18, mult: 1.7, body: "#8a8fa0", belly: "#ffffff", pat: "tuxedo", stripe: "#8a8fa0", eye: "#f2c94c" },
    { id: "gundul",  nama: "Si Gundul",     w: 10, mult: 2.2, body: "#f0c4b8", belly: "#f9dcd2", pat: "solid",  stripe: "#f0c4b8", eye: "#4a83c9" },
    { id: "bintang", nama: "Kucing Bintang", w: 6, mult: 3.5, body: "#2b2f55", belly: "#3a3f70", pat: "solid",  stripe: "#2b2f55", eye: "#9ad0ff", stars: true },
    { id: "pelangi", nama: "Kucing Pelangi", w: 2, mult: 8,   body: "#ffd93d", belly: "#ffffff", pat: "rainbow", stripe: "#ffd93d", eye: "#3b2a1a" },
    { id: "hantu",   nama: "Kucing Hantu",  w: 0,  mult: 6,   body: "#e8ecf8", belly: "#ffffff", pat: "solid",  stripe: "#e8ecf8", eye: "#ff6b6b", ghost: true }
  ];
  function bname(b) { return t("breed." + b.id); }
  var NAMES = ["Mochi", "Bakpao", "Cilok", "Tahu", "Pepeng", "Nasi", "Boba", "Kopi", "Susu", "Onde", "Cimol", "Pudding", "Kerupuk", "Bubur", "Cendol", "Roti", "Komo", "Kiko", "Mimi", "Gembul", "Telur", "Donat", "Siomay", "Klepon"];

  var UPS = {
    table:   { n: "Jatah tamu",      d: "Satu kucing lagi boleh mampir bersamaan", base: 60, g: 2.4, max: 4 },
    pet:     { n: "Belaian lembut",  d: "Belaian lebih menyenangkan, koin naik",   base: 25, g: 1.6, max: 15 },
    feed:    { n: "Ikan premium",    d: "Ikan dan tip dari tamu jadi lebih besar", base: 40, g: 1.7, max: 15 },
    kitchen: { n: "Dapur ikan",      d: "Stok ikan lebih banyak, terisi lebih cepat", base: 35, g: 1.7, max: 15 },
    decor:   { n: "Dekorasi cantik", d: "Tamu datang lebih sering",                base: 50, g: 1.9, max: 6 },
    helper:  { n: "Pelayan Mimi",    d: "Membelai tamu sendiri, juga saat kamu pergi", base: 80, g: 1.8, max: 10 }
  };

  function fresh() {
    return { coins: 0, fish: 6, up: { table: 0, pet: 0, feed: 0, kitchen: 0, decor: 0, helper: 0 }, seen: {}, served: 0, mute: false, total: 0, pets: 0, feeds: 0, ach: {}, hudHidden: false, helperOff: false, intro: false, vol: 1, theme: "auto", size: "m", lang: "", drops: 0, best: 0, days: 0, dayStamp: "", eggs: {}, btn: { r: 8, b: 6 }, panelH: 470, cats: [], spawnT: 0.5, last: Date.now() };
  }
  var S = fresh();
  var cats = []; // kucing yang sedang tampil, lengkap dengan elemen DOM

  function load() {
    try {
      var raw = hasFile ? api.loadSave() : "";
      if (!raw) raw = localStorage.getItem(KEY); // cadangan, dan untuk pindahan dari versi lama
      if (!raw) return null;
      var d = JSON.parse(raw), f = fresh();
      f.coins = +d.coins || 0; f.fish = +d.fish || 0; f.served = +d.served || 0; f.last = +d.last || Date.now(); f.mute = !!d.mute;
      f.total = +d.total || f.coins; f.pets = +d.pets || 0; f.feeds = +d.feeds || 0; f.ach = d.ach || {}; f.hudHidden = !!d.hudHidden; f.helperOff = !!d.helperOff;
      f.vol = d.vol === undefined ? 1 : Math.max(0, Math.min(1, +d.vol || 0));
      f.theme = ["auto", "light", "dark"].indexOf(d.theme) >= 0 ? d.theme : "auto";
      f.drops = +d.drops || 0; f.best = +d.best || 0; f.days = +d.days || 0; f.dayStamp = typeof d.dayStamp === "string" ? d.dayStamp : ""; f.eggs = d.eggs && typeof d.eggs === "object" ? d.eggs : {};
      f.lang = d.lang === "en" || d.lang === "id" ? d.lang : "";
      f.size = ["s", "m", "l"].indexOf(d.size) >= 0 ? d.size : "m";
      if (d.btn && isFinite(+d.btn.r) && isFinite(+d.btn.b)) f.btn = { r: +d.btn.r, b: +d.btn.b };
      if (isFinite(+d.panelH) && +d.panelH >= 240) f.panelH = Math.min(1200, +d.panelH);
      // pemain lama yang sudah punya progres tidak perlu melihat panduan awal
      f.intro = d.intro !== undefined ? !!d.intro : (f.total > 0 || f.served > 0);
      Object.keys(f.up).forEach(function (k) { f.up[k] = Math.min(UPS[k].max, +(d.up && d.up[k]) || 0); });
      f.seen = d.seen || {};
      f.cats = Array.isArray(d.cats) ? d.cats : [];
      return f;
    } catch (e) { return null; }
  }
  function save() {
    try {
      S.last = Date.now();
      S.cats = cats.filter(function (c) { return !c.done; }).map(function (c) { return { name: c.name, breed: c.breed, love: c.love }; });
      var json = JSON.stringify(S);
      if (hasFile) api.writeSave(json);
      localStorage.setItem(KEY, json);
    } catch (e) {}
  }

  /* ---------- rumus ---------- */
  function maxCats() { return 2 + S.up.table; }
  // 8 Agustus (Hari Kucing Sedunia): koin dobel seharian.
  function isCatDay() { var d = new Date(); return d.getMonth() === 7 && d.getDate() === 8; }
  function isHalloween() { var d = new Date(); return d.getMonth() === 9 && d.getDate() === 31; }
  function dayBonus() { return isCatDay() ? 2 : 1; }
  function petCoins() { return (1 + S.up.pet) * dayBonus(); }
  function petLove() { return 12 + S.up.pet; }
  function feedCoins() { return (5 + 4 * S.up.feed) * dayBonus(); }
  function tipBase() { return (8 + 4 * S.up.feed) * dayBonus(); }
  function fishMax() { return 10 + 5 * S.up.kitchen; }
  function fishRegen() { return 0.12 + 0.08 * S.up.kitchen; }
  function arriveEvery() { return Math.max(2.5, 9 - 1.2 * S.up.decor); }
  function helperRate() { return S.helperOff ? 0 : 0.35 * S.up.helper; }
  function upCost(k) { return Math.round(UPS[k].base * Math.pow(UPS[k].g, S.up[k])); }
  var FISH_PRICE = 12, FISH_PACK = 5;

  function fmt(n) { return Math.floor(n).toLocaleString(window.I18N.lang === "en" ? "en-US" : "id-ID"); }
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
  function breedById(id) { for (var i = 0; i < BREEDS.length; i++) if (BREEDS[i].id === id) return BREEDS[i]; return BREEDS[0]; }
  function pickBreed() {
    var t = 0; BREEDS.forEach(function (b) { t += b.w; });
    var r = Math.random() * t;
    for (var i = 0; i < BREEDS.length; i++) { r -= BREEDS[i].w; if (r <= 0) return BREEDS[i]; }
    return BREEDS[0];
  }
  function roamW() { return Math.max(CAT + 20, window.innerWidth - 72); }
  function earn(n) { S.coins += n; S.total += n; }

  /* ---------- gambar kucing ---------- */
  var gradN = 0;
  function catSVG(b) {
    var s = "", line = 'stroke="rgba(40,25,60,.22)" stroke-width="1.5"', defs = "";
    if (b.pat === "rainbow") {
      // id unik per gambar: gradien di dalam SVG yang tersembunyi (panel tertutup) tidak terpakai oleh SVG lain
      var gid = "rb" + (++gradN);
      defs = '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset=".25" stop-color="#ffd93d"/><stop offset=".5" stop-color="#6bcf7f"/><stop offset=".75" stop-color="#4d9de0"/><stop offset="1" stop-color="#b66be0"/></linearGradient></defs>';
      b = Object.assign({}, b, { body: "url(#" + gid + ")", pat: "solid" });
    }
    var paw = b.pat === "tuxedo" ? "#fff" : b.body;
    s += '<svg viewBox="0 0 100 100" aria-hidden="true"' + (b.ghost ? ' style="opacity:.62"' : "") + '>' + defs;
    s += '<g class="cat-tail"><path d="M74 88 C96 86 98 58 86 54" fill="none" stroke="' + b.body + '" stroke-width="9" stroke-linecap="round"/>';
    if (b.pat === "stripe") s += '<path d="M90 80 l5 -2 M92 70 l5 -1 M89 60 l5 1" stroke="' + b.stripe + '" stroke-width="2.4" stroke-linecap="round"/>';
    if (b.pat === "siam") s += '<path d="M86 54 C90 55 92 58 92 62" fill="none" stroke="' + b.stripe + '" stroke-width="9" stroke-linecap="round"/>';
    s += '</g>';
    s += '<ellipse cx="50" cy="74" rx="27" ry="24" fill="' + b.body + '" ' + line + '/>';
    s += '<ellipse cx="50" cy="79" rx="' + (b.pat === "tuxedo" ? 16 : 14) + '" ry="' + (b.pat === "tuxedo" ? 17 : 15) + '" fill="' + b.belly + '"/>';
    if (b.pat === "calico") s += '<ellipse cx="32" cy="70" rx="9" ry="11" fill="' + b.stripe + '"/><ellipse cx="68" cy="84" rx="8" ry="7" fill="#4a4356"/>';
    if (b.pat === "stripe") s += '<path d="M25 66 l7 3 M24 76 l8 1 M75 66 l-7 3 M76 76 l-8 1" stroke="' + b.stripe + '" stroke-width="2.6" stroke-linecap="round"/>';
    var ear = b.pat === "siam" ? b.stripe : b.body;
    s += '<polygon points="25,34 29,8 46,24" fill="' + ear + '" ' + line + '/>';
    s += '<polygon points="75,34 71,8 54,24" fill="' + (b.pat === "calico" ? "#4a4356" : ear) + '" ' + line + '/>';
    s += '<polygon points="30,26 32,15 40,23" fill="#ffb8c8"/><polygon points="70,26 68,15 60,23" fill="#ffb8c8"/>';
    s += '<ellipse cx="50" cy="44" rx="27" ry="23" fill="' + b.body + '" ' + line + '/>';
    if (b.pat === "calico") s += '<ellipse cx="34" cy="36" rx="12" ry="9" fill="' + b.stripe + '"/>';
    if (b.pat === "stripe") s += '<path d="M50 22 v7 M42 24 l2 6 M58 24 l-2 6" stroke="' + b.stripe + '" stroke-width="2.6" stroke-linecap="round"/>';
    if (b.pat === "tuxedo") s += '<ellipse cx="50" cy="54" rx="13" ry="10" fill="#fff"/>';
    if (b.pat === "siam") s += '<ellipse cx="50" cy="52" rx="14" ry="11" fill="' + b.stripe + '" opacity=".55"/>';
    s += '<ellipse cx="33" cy="52" rx="5" ry="3.2" fill="#ff9db8" opacity=".55"/><ellipse cx="67" cy="52" rx="5" ry="3.2" fill="#ff9db8" opacity=".55"/>';
    s += '<g class="eyes-open"><ellipse cx="39" cy="44" rx="4.2" ry="5.2" fill="' + b.eye + '"/><ellipse cx="61" cy="44" rx="4.2" ry="5.2" fill="' + b.eye + '"/>'
      + '<circle cx="40.5" cy="42" r="1.6" fill="#fff"/><circle cx="62.5" cy="42" r="1.6" fill="#fff"/></g>';
    s += '<g class="eyes-happy"><path d="M34 46 q5 -7 10 0 M56 46 q5 -7 10 0" fill="none" stroke="' + (b.id === "hitam" ? "#f2c94c" : "#3a2f4d") + '" stroke-width="2.6" stroke-linecap="round"/></g>';
    s += '<polygon points="46.5,51 53.5,51 50,55" fill="#ff8fa8"/>';
    s += '<path d="M50 55 q-4 5 -8 2 M50 55 q4 5 8 2" fill="none" stroke="' + (b.pat === "tuxedo" || b.id === "putih" ? "#7d7192" : "rgba(40,25,60,.55)") + '" stroke-width="1.6" stroke-linecap="round"/>';
    s += '<path d="M30 52 l-14 -3 M30 55 l-14 3 M70 52 l14 -3 M70 55 l14 3" stroke="rgba(255,255,255,.75)" stroke-width="1.2" stroke-linecap="round"/>';
    if (b.stars) s += '<path d="M24 38 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5z M76 70 l1.2 2.8 2.8 1.2 -2.8 1.2 -1.2 2.8 -1.2 -2.8 -2.8 -1.2 2.8 -1.2z M58 30 l1 2.2 2.2 1 -2.2 1 -1 2.2 -1 -2.2 -2.2 -1 2.2 -1z" fill="#ffe27a"/>';
    s += '<ellipse cx="39" cy="95" rx="8" ry="5" fill="' + paw + '" ' + line + '/><ellipse cx="61" cy="95" rx="8" ry="5" fill="' + paw + '" ' + line + '/>';
    s += '</svg>';
    return s;
  }


  /* ---------- suara (disintesis, tanpa file audio) ---------- */
  var AC = null, lastSnd = 0;
  // Semua suara lewat satu limiter supaya volumenya imbang, tidak ada yang tiba-tiba keras, dan beberapa suara sekaligus tidak pecah.
  var MASTER = null;
  function master(a) {
    if (!MASTER || MASTER.ctx !== a) {
      var c = a.createDynamicsCompressor();
      c.threshold.value = -16; c.knee.value = 8; c.ratio.value = 10; c.attack.value = 0.004; c.release.value = 0.25;
      var g = a.createGain();
      c.connect(g); g.connect(a.destination);
      MASTER = { ctx: a, input: c, out: g };
    }
    // Volume dari slider dipasang SETELAH limiter. Kalau sebelumnya, limiter meratakan perbedaannya dan slider terasa tidak berfungsi.
    MASTER.out.gain.value = 0.9 * S.vol * S.vol;
    return MASTER.input;
  }
  function actx() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (AC && AC.state === "suspended") AC.resume();
    return AC;
  }
  // Gelombang dasar yang lembut: harmonik turun cepat, jadi tidak berdengung seperti sawtooth.
  var WAVE = null;
  function softWave(a) {
    if (!WAVE || WAVE.ctx !== a) {
      var n = 14, re = new Float32Array(n), im = new Float32Array(n);
      for (var i = 1; i < n; i++) im[i] = 1 / (i * i);
      WAVE = { ctx: a, w: a.createPeriodicWave(re, im) };
    }
    return WAVE.w;
  }
  // Satu not meong: nada naik lalu turun ("mi-aw") dengan vibrato halus dan dua formant yang bergeser mi → a → o.
  function note(a, t, pitch, dur, vol, base, peak, end) {
    var o = a.createOscillator(), lfo = a.createOscillator(), lg = a.createGain();
    var f1 = a.createBiquadFilter(), f2 = a.createBiquadFilter(), g1 = a.createGain(), g2 = a.createGain(), g = a.createGain();
    o.setPeriodicWave(softWave(a));
    o.frequency.setValueAtTime(base * pitch, t);
    o.frequency.exponentialRampToValueAtTime(peak * pitch, t + dur * 0.3);
    o.frequency.exponentialRampToValueAtTime(end * pitch, t + dur);
    lfo.frequency.value = 5; lg.gain.value = dur > 0.35 ? 5 * pitch : 0;
    lfo.connect(lg); lg.connect(o.frequency);
    f1.type = "bandpass"; f1.Q.value = 2.5;
    f1.frequency.setValueAtTime(420, t);
    f1.frequency.linearRampToValueAtTime(980, t + dur * 0.35);
    f1.frequency.linearRampToValueAtTime(520, t + dur);
    f2.type = "bandpass"; f2.Q.value = 3;
    f2.frequency.setValueAtTime(2500, t);
    f2.frequency.linearRampToValueAtTime(1900, t + dur * 0.4);
    f2.frequency.linearRampToValueAtTime(1100, t + dur);
    g1.gain.value = 1; g2.gain.value = 0.55;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.04, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(vol * 0.7, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f1); o.connect(f2); f1.connect(g1); f2.connect(g2); g1.connect(g); g2.connect(g); g.connect(master(a));
    o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
  }
  // kind: "pet" mew pendek, "soft" mew kecil, "feed" mrrow panjang, "happy" kicau naik (prrp-prrp)
  function meow(pitch, dur, vol, kind) {
    if (S.mute || S.vol < 0.01) return;
    vol = Math.max(0.0001, vol) * 1.6;
    var now = performance.now();
    if (now - lastSnd < 150) return;
    lastSnd = now;
    var a = actx(); if (!a) return;
    var t = a.currentTime;
    if (kind === "happy") {
      [0, 0.11, 0.24].forEach(function (off, i) { note(a, t + off, pitch, 0.1, vol * (i === 2 ? 1 : 0.8), 620 + i * 60, 900 + i * 90, 760 + i * 70); });
    } else if (kind === "feed") {
      note(a, t, pitch, Math.max(0.45, dur), vol, 560, 880, 480);
      note(a, t + 0.5, pitch * 0.95, 0.22, vol * 0.6, 620, 760, 520);
    } else if (kind === "lift") {
      // "mew!" kaget: pendek, tinggi, naik
      note(a, t, pitch * 1.18, 0.2, vol * 0.9, 760, 1350, 1000);
    } else if (kind === "soft") {
      note(a, t, pitch * 1.12, Math.max(0.22, dur * 0.8), vol * 0.7, 700, 1000, 760);
    } else {
      note(a, t, pitch * 1.05, Math.max(0.3, dur), vol, 640, 1020, 620);
    }
  }

  // Suara asli (CC0 dari OpenGameArt) dibaca dari renderer/sounds. Kalau file belum ada, dipakai suara sintetis di atas.
  var FILES = {
    pet:   ["Meow.ogg"],
    soft:  ["kitten_mew-1_0.ogg"],
    feed:  ["cat_mewfood.wav"],
    happy: ["cat_mewpurr.wav", "cat_mewpurr2.wav"]
  };
  var ready = {};
  Object.keys(FILES).forEach(function (kind) {
    ready[kind] = [];
    FILES[kind].forEach(function (f) {
      var a = new Audio();
      a.preload = "auto";
      a.addEventListener("canplaythrough", function () { if (ready[kind].indexOf(f) < 0) ready[kind].push(f); }, { once: true });
      a.src = "sounds/" + f;
    });
  });
  function sfx(kind, pitch, fileVol, synthVol, synthDur) {
    if (S.mute || S.vol < 0.01) return;
    var list = ready[kind];
    if (list && list.length) {
      var now = performance.now();
      if (now - lastSnd < 150) return;
      lastSnd = now;
      var a = new Audio("sounds/" + rnd(list));
      var vol = Math.max(0, Math.min(1, fileVol * S.vol));
      a.playbackRate = pitch;
      a.preservesPitch = false;
      var ctx = actx(), routed = false;
      if (ctx) {
        // file audio juga lewat limiter yang sama
        try {
          var src = ctx.createMediaElementSource(a), gn = ctx.createGain();
          gn.gain.value = fileVol; src.connect(gn); gn.connect(master(ctx)); routed = true;
        } catch (e) {}
      }
      if (!routed) a.volume = vol;
      a.play().catch(function () {});
      return;
    }
    meow(pitch, synthDur, synthVol, kind);
  }

  function crunch() {
    if (S.mute || S.vol < 0.01) return;
    var a = actx(); if (!a) return;
    var len = Math.floor(a.sampleRate * 0.06), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    [0, 0.1].forEach(function (off) {
      var s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      s.buffer = buf; f.type = "lowpass"; f.frequency.value = 2400; g.gain.value = 0.25;
      s.connect(f); f.connect(g); g.connect(master(a)); s.start(a.currentTime + off);
    });
  }
  // Suara marah: meong menurun yang serak. Disintesis, jadi tidak butuh berkas audio.
  function dropped() {
    S.drops++;
    if (S.drops === 10) toast(t("toast.drops10"));
  }
  function angry(pitch) {
    if (S.mute || S.vol < 0.01) return;
    var a = actx(); if (!a) return;
    lastSnd = performance.now();
    var t0 = a.currentTime, dur = 0.55, v = 1;
    var o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
    o.type = "sawtooth"; f.type = "bandpass"; f.Q.value = 3;
    o.frequency.setValueAtTime(560 * pitch, t0);
    o.frequency.linearRampToValueAtTime(700 * pitch, t0 + 0.08);
    o.frequency.exponentialRampToValueAtTime(230 * pitch, t0 + dur);
    f.frequency.setValueAtTime(1500, t0); f.frequency.linearRampToValueAtTime(800, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.32 * v, t0 + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(f); f.connect(g); g.connect(master(a));
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function setMute(m) {
    S.mute = !!m;
    var b = $("#mute");
    b.classList.toggle("muted", S.mute);
    b.setAttribute("aria-pressed", S.mute ? "true" : "false");
    b.title = t(S.mute ? "mute.off" : "mute.on");
    var ms = $("#muteSet");
    if (ms) { ms.textContent = t(S.mute ? "set.unmute" : "set.mute"); }
  }

  /* ---------- pengaturan: tema, ukuran, volume ---------- */
  var SIZES = { s: 0.85, m: 1, l: 1.15 };
  function applyLook() {
    var root = document.documentElement;
    if (S.theme === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", S.theme);
    root.style.setProperty("--ui", SIZES[S.size] || 1);
    if (typeof placeUi === "function") placeUi();
    try { localStorage.setItem("kafe-theme", S.theme); } catch (e) {} // dibaca juga oleh menu tray
    document.querySelectorAll("#segTheme button").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-v") === S.theme); });
    document.querySelectorAll("#segSize button").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-v") === S.size); });
    var v = $("#volRange"); if (v) v.value = Math.round(S.vol * 100);
  }

  // Ganti bahasa: teks statis lewat data-i18n, sisanya digambar ulang.
  function applyLang() {
    window.I18N.apply(document);
    document.querySelectorAll("#segLang button").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-v") === window.I18N.lang); });
    document.querySelectorAll("[data-bn]").forEach(function (e) { e.textContent = t("breed." + e.getAttribute("data-bn")); });
    $("#reset").textContent = t("set.reset"); resetArmed = false;
    setMute(S.mute); renderUps(); renderBook(); updateStats();
    renderSys();
    if (!$("#guide").hidden) renderGuide();
  }

  /* ---------- kucing di taskbar ---------- */
  var roam = $("#roam");
  var nextId = 1;

  function makeCat(name, breedId, love, x, dir) {
    var b = breedById(breedId);
    var c = { id: nextId++, name: name, breed: breedId, love: love, done: false, age: 0, x: x, y: 0, vy: 0, falling: false, dir: dir, speed: 24 + Math.random() * 22, state: "walk", timer: 2 + Math.random() * 5, hov: false, leaving: false, pitch: 0.85 + Math.random() * 0.4 };
    var el = document.createElement("div");
    el.className = "cat hit walking";
    el.setAttribute("data-id", c.id);
    el.innerHTML = '<div class="sprite">' + catSVG(b) + '</div>'
      + '<div class="bubble"><div class="bubble-in">'
      + '<div class="who"><b></b><span data-bn="' + b.id + '">' + bname(b) + '</span></div>'
      + '<div class="love"><i></i></div>'
      + '<div class="acts"><button class="btn small" type="button" data-act="pet" data-i18n="act.pet">' + t("act.pet") + '</button>'
      + '<button class="btn small main" type="button" data-act="feed" data-i18n="act.feed">' + t("act.feed") + '</button></div>'
      + '</div></div>';
    el.querySelector(".who b").textContent = name;
    c.el = el;
    c.sprite = el.querySelector(".sprite");
    c.bar = el.querySelector(".love i");
    roam.appendChild(el);
    draw(c);
    return c;
  }

  function draw(c) {
    c.el.style.transform = "translate(" + c.x.toFixed(1) + "px," + (-(c.y || 0)).toFixed(1) + "px)";
    c.sprite.style.transform = "scaleX(" + (c.dir < 0 ? -1 : 1) + ")";
  }

  // Tamu langka yang hanya muncul pada waktu tertentu: tengah malam (00.00 sampai 03.59) dan malam Halloween.
  function ghostChance() { return isHalloween() ? 0.15 : (new Date().getHours() < 4 ? 0.07 : 0); }
  function arrive(force) {
    var live = cats.filter(function (c) { return !c.done; }).length;
    if (live >= maxCats() + (force ? 2 : 0)) return;
    var b = force ? breedById(force) : (Math.random() < ghostChance() ? breedById("hantu") : pickBreed());
    var W = roamW(), fromLeft = Math.random() < 0.5;
    var c = makeCat(rnd(NAMES), b.id, 0, fromLeft ? -CAT : W, fromLeft ? 1 : -1);
    cats.push(c);
    sfx("soft", c.pitch, 0.3, 0.1, 0.3);
    var first = !S.seen[b.id];
    S.seen[b.id] = (S.seen[b.id] || 0) + 1;
    if (first) { renderBook(); toast(t("toast.newguest", { n: bname(b) })); }
  }

  function removeCat(c) {
    if (c.el.parentNode) c.el.parentNode.removeChild(c.el);
    var i = cats.indexOf(c);
    if (i >= 0) cats.splice(i, 1);
  }

  function floatText(c, text, cls) {
    var f = document.createElement("span");
    f.className = "float " + (cls || "");
    f.textContent = text;
    f.style.marginLeft = (Math.random() * 24 - 12) + "px";
    c.el.appendChild(f);
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 1000);
  }

  function check(c) {
    if (c.done || c.love < 100) return;
    c.done = true; c.leaving = true;
    c.el.classList.add("happy"); c.el.classList.remove("hov");
    var tip = Math.round(tipBase() * breedById(c.breed).mult);
    earn(tip); S.served++;
    floatText(c, t("tip", { n: tip }), "tip");
    sfx("happy", c.pitch, 0.7, 0.3, 0.7);
    updateStats();
  }

  var combo = [];
  function pet(c, auto) {
    if (!c || c.done) return;
    c.love += petLove(); c.age = 0;
    var g = petCoins() * breedById(c.breed).mult;
    earn(g); S.pets++;
    if (!auto) {
      // belaian beruntun dalam 3 detik
      var nowT = Date.now(); combo.push(nowT);
      while (combo.length && nowT - combo[0] > 3000) combo.shift();
      if (combo.length > S.best) S.best = combo.length;
    }
    floatText(c, "+" + fmt(Math.max(1, g)), "");
    sfx("pet", c.pitch, auto ? 0.2 : 0.6, auto ? 0.08 : 0.25, 0.28);
    if (!auto) { c.el.classList.add("petted"); setTimeout(function () { c.el.classList.remove("petted"); }, 450); }
    check(c); updateBar(c); updateStats();
  }

  function feed(c) {
    if (!c || c.done) return;
    if (S.fish < 1) { toast(t("toast.nofish")); return; }
    S.fish -= 1; c.love += 45; c.age = 0;
    var g = feedCoins() * breedById(c.breed).mult;
    earn(g); S.feeds++;
    floatText(c, "+" + fmt(g), "");
    crunch();
    setTimeout(function () { sfx("feed", c.pitch, 0.7, 0.3, 0.4); }, 220);
    check(c); updateBar(c); updateStats();
  }

  function updateBar(c) { c.bar.style.width = Math.min(100, c.love) + "%"; }

  function moveCats(dt) {
    var W = roamW();
    for (var i = cats.length - 1; i >= 0; i--) {
      var c = cats[i];
      if (c.falling) {
        // jatuh ke taskbar dengan gravitasi, memantul kecil lalu mendarat
        c.vy += 2600 * dt; c.y -= c.vy * dt;
        if (c.y <= 0) {
          c.y = 0;
          if (c.vy > 380) { c.vy = -c.vy * 0.32; }
          else { c.falling = false; c.vy = 0; c.el.classList.remove("falling"); c.state = "sit"; c.timer = 1.5 + Math.random() * 2; }
        }
        draw(c);
        continue;
      }
      if (c.leaving) {
        // pergi ke tepi layar terdekat setelah senang
        if (c.leaveDir === undefined) c.leaveDir = (c.x + CAT / 2 < W / 2) ? -1 : 1;
        c.dir = c.leaveDir; c.x += c.dir * 150 * dt;
        c.el.classList.add("walking"); c.el.classList.remove("happy");
        draw(c);
        if (c.x < -CAT - 10 || c.x > window.innerWidth + 10) removeCat(c);
        continue;
      }
      if (c.hov) { c.el.classList.remove("walking"); continue; }
      c.timer -= dt;
      if (c.state === "walk") {
        c.x += c.dir * c.speed * dt;
        if (c.x < 0) { c.x = 0; c.dir = 1; }
        if (c.x > W - CAT) { c.x = W - CAT; c.dir = -1; }
        if (c.timer <= 0) { c.state = "sit"; c.timer = 3 + Math.random() * 8; c.el.classList.remove("walking"); }
      } else if (c.timer <= 0) {
        c.state = "walk"; c.timer = 4 + Math.random() * 9;
        if (Math.random() < 0.5) c.dir = -c.dir;
        c.el.classList.add("walking");
      }
      draw(c);
    }
  }

  /* ---------- klik tembus: hanya kucing dan UI yang menerima mouse ---------- */
  var mx = -1, my = -1, ignoring = true, hovCat = null;
  document.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; probe(); });
  document.documentElement.addEventListener("mouseleave", function () { mx = -1; my = -1; probe(); });
  function probe() {
    var t = mx < 0 ? null : document.elementFromPoint(mx, my);
    var hit = drag || tdrag || prs || (t && t.closest(".hit"));
    var want = !hit;
    if (want !== ignoring) { ignoring = want; api.setIgnore(want); }
    var ce = t && t.closest(".cat");
    var id = ce ? +ce.getAttribute("data-id") : 0;
    cats.forEach(function (c) {
      var h = (c.id === id || (drag && drag.c === c)) && !c.done;
      if (h !== c.hov) { c.hov = h; c.el.classList.toggle("hov", h); }
    });
  }
  setInterval(probe, 80);
  // Di Tauri jendela yang sedang klik-tembus tidak menerima mousemove, jadi posisi kursor dikirim dari sisi Rust.
  if (api.onCursor) api.onCursor(function (x, y) { mx = x; my = y; probe(); });

  function catFromEl(el) {
    var ce = el.closest(".cat");
    if (!ce) return null;
    var id = +ce.getAttribute("data-id");
    for (var i = 0; i < cats.length; i++) if (cats[i].id === id) return cats[i];
    return null;
  }
  // geser kucing: tahan klik pada kucing lalu seret ke kiri atau kanan di sepanjang taskbar
  var drag = null, justDragged = false;
  document.addEventListener("mousedown", function (e) {
    if (e.button !== 0 || e.target.closest("[data-act]")) return;
    var c = catFromEl(e.target);
    if (!c || c.leaving) return;
    drag = { c: c, startX: e.clientX, startY: e.clientY, off: e.clientX - c.x, offY: (window.innerHeight - e.clientY) - (c.y || 0), moved: false };
    c.falling = false; c.vy = 0; c.el.classList.remove("falling");
  });
  document.addEventListener("mousemove", function (e) {
    if (!drag) return;
    if (e.buttons === 0) { // tombol mouse dilepas di luar jendela
      var dc = drag.c; dc.el.classList.remove("dragging"); drag = null;
      if (dc.y > 4) { dc.falling = true; dc.vy = 0; dc.el.classList.add("falling"); angry(dc.pitch); dropped(); }
      return;
    }
    if (!drag.moved && Math.abs(e.clientX - drag.startX) < 5 && Math.abs(e.clientY - drag.startY) < 5) return;
    drag.moved = true;
    var c = drag.c, nx = Math.max(-CAT / 3, Math.min(window.innerWidth - CAT * 2 / 3, e.clientX - drag.off));
    if (Math.abs(nx - c.x) > 1) c.dir = nx > c.x ? 1 : -1;
    c.x = nx; c.age = 0; c.state = "sit"; c.timer = 2;
    c.y = Math.max(0, Math.min(window.innerHeight - CAT, (window.innerHeight - e.clientY) - drag.offY));
    c.el.classList.add("dragging"); c.el.classList.remove("walking");
    // kaget saat mulai terangkat dari taskbar; bunyi lagi kalau diangkat ulang setelah turun
    if (c.y > 14 && !drag.lifted) { drag.lifted = true; sfx("lift", c.pitch, 0.5, 0.22, 0.24); }
    else if (c.y <= 4) drag.lifted = false;
    draw(c);
  });
  document.addEventListener("mouseup", function () {
    if (!drag) return;
    var c = drag.c;
    if (drag.moved) {
      justDragged = true; setTimeout(function () { justDragged = false; }, 0);
      c.el.classList.remove("dragging");
      c.x = Math.max(0, Math.min(roamW() - CAT, c.x));
      if (c.y > 4) { c.falling = true; c.vy = 0; c.el.classList.add("falling"); angry(c.pitch); dropped(); }
      else { c.y = 0; sfx("soft", c.pitch, 0.3, 0.1, 0.3); }
      draw(c);
    }
    drag = null;
  });
  document.addEventListener("click", function (e) {
    if (justDragged) return;
    var c = catFromEl(e.target);
    if (!c) return;
    var a = e.target.closest("[data-act]");
    if (a && a.getAttribute("data-act") === "feed") feed(c); else pet(c);
  });

  /* ---------- hud dan panel ---------- */
  var toastT;
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove("show"); }, 2800);
  }


  var ICONS = {
    table:   '<path d="M7 4v16M7 13h10M17 13v7M7 4h6a3 3 0 0 1 3 3v6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
    pet:     '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>',
    feed:    '<path d="M3 12c3-5 9-6 13-2l5-3v10l-5-3c-4 4-10 3-13-2z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><circle cx="8" cy="11" r="1" fill="currentColor"/>',
    kitchen: '<path d="M5 10h14v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-7zM3 10h18M9 6c0-2 2-2 2-4M14 6c0-2 2-2 2-4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
    decor:   '<path d="M12 12V8M12 8c-3 0-4-2-4-4 3 0 4 2 4 4zM12 8c3 0 4-2 4-4-3 0-4 2-4 4zM7 12h10l-1 8H8z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
    helper:  '<circle cx="7" cy="9.5" r="1.9" fill="currentColor"/><circle cx="12" cy="6.5" r="1.9" fill="currentColor"/><circle cx="17" cy="9.5" r="1.9" fill="currentColor"/><path d="M12 12c-3 0-5 3-5 5 0 2 2 2 5 1 3 1 5 1 5-1 0-2-2-5-5-5z" fill="currentColor"/>'
  };

  function renderUps() {
    var h = "";
    Object.keys(UPS).forEach(function (k) {
      h += '<div class="up" data-k="' + k + '"><div class="tile t-' + k + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[k] + '</svg></div><div class="txt"><b>' + t("up." + k + ".n") + '</b><span>' + t("up." + k + ".d") + '</span><div class="dots"></div>'
        + (k === "helper" ? '<button class="btn small" type="button" id="helperToggle" hidden></button>' : "")
        + '</div><button class="btn main" type="button" data-up="' + k + '"></button></div>';
    });
    $("#ups").innerHTML = h;
  }
  function updateUps() {
    if ($("#panel").hidden) return;
    Object.keys(UPS).forEach(function (k) {
      var row = document.querySelector('.up[data-k="' + k + '"]');
      if (!row) return;
      var lv = S.up[k], max = UPS[k].max, dots = "";
      for (var i = 0; i < max; i++) dots += '<i class="' + (i < lv ? "on" : "") + '"></i>';
      row.querySelector(".dots").innerHTML = dots;
      if (k === "table") row.querySelector("span").textContent = t("up.table.now", { a: maxCats(), b: 2 + max });
      var b = row.querySelector("button[data-up]");
      if (k === "helper") {
        var tg = $("#helperToggle");
        tg.hidden = lv < 1;
        tg.textContent = t(S.helperOff ? "helper.on" : "helper.off");
        row.querySelector(".txt > span").textContent = S.helperOff ? t("up.helper.break") : t("up.helper.d");
      }
      if (lv >= max) { b.textContent = t("up.max"); b.disabled = true; }
      else { b.innerHTML = t("up.up") + "<small>" + t("n.coins", { n: fmt(upCost(k)) }) + "</small>"; b.disabled = S.coins < upCost(k); }
    });
    $("#buyFish").disabled = S.coins < FISH_PRICE || S.fish >= fishMax();
    $("#fishCost").textContent = t("n.coins", { n: FISH_PRICE });
  }
  function renderBook() {
    var h = "", got = 0;
    BREEDS.forEach(function (b) {
      var n = S.seen[b.id] || 0;
      if (n) got++;
      h += '<div class="card' + (n ? "" : " lock") + '">' + catSVG(b) + (n ? bname(b) : "???") + "</div>";
    });
    $("#book").innerHTML = h;
    $("#bookCount").textContent = got + "/" + BREEDS.length;
  }

  /* ---------- pencapaian ---------- */
  function upCount() { return Object.keys(S.up).reduce(function (a, k) { return a + S.up[k]; }, 0); }
  function seenCount() { return Object.keys(S.seen).filter(function (k) { return S.seen[k]; }).length; }
  function upMax() { return Object.keys(UPS).reduce(function (a, k) { return a + UPS[k].max; }, 0); }
  function eggOf(k) { return function () { return S.eggs[k] ? 1 : 0; }; }
  function seenN(id) { return function () { return S.seen[id] || 0; }; }
  // "hidden": namanya baru terlihat setelah didapat (easter egg).
  var ACH = [
    { id: "belai1",    goal: 1,       cur: function () { return S.pets; }, r: 5 },
    { id: "belai250",  goal: 250,     cur: function () { return S.pets; }, r: 60 },
    { id: "belai2500", goal: 2500,    cur: function () { return S.pets; }, r: 400 },
    { id: "belai25k",  goal: 25000,   cur: function () { return S.pets; }, r: 3000 },
    { id: "ikan50",    goal: 50,      cur: function () { return S.feeds; }, r: 60 },
    { id: "ikan500",   goal: 500,     cur: function () { return S.feeds; }, r: 300 },
    { id: "ikan5k",    goal: 5000,    cur: function () { return S.feeds; }, r: 2000 },
    { id: "tamu1",     goal: 1,       cur: function () { return S.served; }, r: 10 },
    { id: "tamu50",    goal: 50,      cur: function () { return S.served; }, r: 100 },
    { id: "tamu250",   goal: 250,     cur: function () { return S.served; }, r: 500 },
    { id: "tamu1000",  goal: 1000,    cur: function () { return S.served; }, r: 2500 },
    { id: "tamu5000",  goal: 5000,    cur: function () { return S.served; }, r: 12000 },
    { id: "koin5k",    goal: 5000,    cur: function () { return S.total; }, r: 100 },
    { id: "koin250k",  goal: 250000,  cur: function () { return S.total; }, r: 2000 },
    { id: "koin5m",    goal: 5000000, cur: function () { return S.total; }, r: 30000 },
    { id: "reno1",     goal: 1,       cur: upCount, r: 20 },
    { id: "reno25",    goal: 25,      cur: upCount, r: 300 },
    { id: "reno65",    goal: upMax(), cur: upCount, r: 10000 },
    { id: "kursi",     goal: UPS.table.max, cur: function () { return S.up.table; }, r: 200 },
    { id: "mimi",      goal: 1,       cur: function () { return S.up.helper; }, r: 30 },
    { id: "mimi10",    goal: UPS.helper.max, cur: function () { return S.up.helper; }, r: 1500 },
    { id: "koleksi4",  goal: 4,       cur: seenCount, r: 60 },
    { id: "koleksi9",  goal: 9,       cur: seenCount, r: 300 },
    { id: "koleksi14", goal: 14,      cur: seenCount, r: 1500 },
    { id: "koleksiall", goal: BREEDS.length, cur: seenCount, r: 6000 },
    { id: "emas",      goal: 1,       cur: seenN("emas"), r: 300 },
    { id: "emas5",     goal: 5,       cur: seenN("emas"), r: 2500 },
    { id: "bintang",   goal: 1,       cur: seenN("bintang"), r: 800 },
    { id: "pelangi",   goal: 1,       cur: seenN("pelangi"), r: 1500 },
    { id: "combo10",   goal: 10,      cur: function () { return S.best; }, r: 300 },
    { id: "combo18",   goal: 18,      cur: function () { return S.best; }, r: 1500 },
    { id: "hari3",     goal: 3,       cur: function () { return S.days; }, r: 200 },
    { id: "hari14",    goal: 14,      cur: function () { return S.days; }, r: 1500 },
    { id: "hari60",    goal: 60,      cur: function () { return S.days; }, r: 8000 },
    { id: "hantu",     goal: 1,       cur: seenN("hantu"), r: 1000, hidden: true },
    { id: "logo",      goal: 1,       cur: eggOf("logo"), r: 500, hidden: true },
    { id: "gravitasi", goal: 30,      cur: function () { return S.drops; }, r: 400, hidden: true },
    { id: "hariKucing", goal: 1,      cur: eggOf("catday"), r: 800, hidden: true },
    { id: "halloween", goal: 1,       cur: eggOf("halloween"), r: 800, hidden: true }
  ];
  var notifyQ = [], notifyBusy = false;
  function notify(msg) { notifyQ.push(msg); if (!notifyBusy) notifyNext(); }
  function notifyNext() {
    if (!notifyQ.length) { notifyBusy = false; return; }
    notifyBusy = true; toast(notifyQ.shift());
    setTimeout(notifyNext, 3000);
  }
  function checkAch() {
    ACH.forEach(function (a) {
      if (S.ach[a.id] || a.cur() < a.goal) return;
      S.ach[a.id] = Date.now();
      S.coins += a.r; // hadiah tidak dihitung ke total koin
      notify(t("toast.ach", { n: t("ach." + a.id + ".n"), r: fmt(a.r) }));
      sfx("happy", 1.1, 0.6, 0.25, 0.5);
      save();
    });
  }
  function renderAch() {
    var done = 0, h = '<div class="statline"><span>' + t("stat.served") + ' <b>' + fmt(S.served) + '</b></span><span>' + t("stat.pets") + ' <b>' + fmt(S.pets) + '</b></span><span title="' + t("stat.total.tip") + '">' + t("stat.total") + ' <b>' + fmt(S.total) + '</b></span></div>';
    ACH.forEach(function (a) {
      var ok = !!S.ach[a.id]; if (ok) done++;
      var cur = Math.min(a.cur(), a.goal);
      if (a.hidden && !ok) {
        h += '<div class="ach secret"><div class="badge">?</div><div class="grow"><b>???</b><span>' + t("ach.secret") + '</span></div><div class="rw">+' + fmt(a.r) + '</div></div>';
        return;
      }
      h += '<div class="ach' + (ok ? " done" : "") + '"><div class="badge">' + (ok ? "\u2713" : Math.round(cur / a.goal * 100) + "%") + '</div>'
        + '<div class="grow"><b>' + t("ach." + a.id + ".n") + '</b><span>' + t("ach." + a.id + ".d", { n: BREEDS.length }) + (ok || a.hidden ? "" : " (" + fmt(cur) + "/" + fmt(a.goal) + ")") + '</span>'
        + (ok ? "" : '<div class="bar"><i style="width:' + (cur / a.goal * 100) + '%"></i></div>') + '</div>'
        + '<div class="rw">+' + fmt(a.r) + '</div></div>';
    });
    $("#tabAch").innerHTML = h;
    $("#achCount").textContent = done + "/" + ACH.length;
  }

  function updateStats() {
    $("#coins").textContent = fmt(S.coins);
    $("#fish").textContent = Math.floor(S.fish) + "/" + fishMax();
    var used = cats.filter(function (c) { return !c.done; }).length;
    var g = $("#guests");
    g.textContent = used + "/" + maxCats();
    g.style.color = used >= maxCats() ? "var(--accent)" : "";
    updateUps();
    checkAch();
    if (!$("#panel").hidden && !$("#tabAch").hidden) renderAch();
    else $("#achCount").textContent = ACH.filter(function (a) { return S.ach[a.id]; }).length + "/" + ACH.length;
  }

  /* ---------- letak tombol kucing dan tinggi panel ---------- */
  var tdrag = null, tabJust = false, prs = null, panelAbove = true;
  function uiScale() { return SIZES[S.size] || 1; }
  function placeUi() {
    var z = uiScale(), W = window.innerWidth, H = window.innerHeight, bw = 54 * z;
    S.btn.r = Math.max(4, Math.min(W - bw - 4, S.btn.r));
    S.btn.b = Math.max(4, Math.min(H - bw - 4, S.btn.b));
    var tab = $("#hudTab"), panel = $("#panel");
    tab.style.right = (S.btn.r / z) + "px"; tab.style.bottom = (S.btn.b / z) + "px";
    var pw = 364 * z;
    var pr = Math.max(8, Math.min(W - pw - 8, S.btn.r + bw - pw));
    // Panel dibuka di atas tombol kalau ruang di atas cukup, kalau tidak di bawahnya, supaya tidak pernah menimpa tombol.
    var gap = 6, spaceAbove = H - (S.btn.b + bw + gap) - 8, spaceBelow = S.btn.b - gap - 8;
    panelAbove = spaceAbove >= Math.min(S.panelH, 300) || spaceAbove >= spaceBelow;
    var mh, pb;
    if (panelAbove) { mh = Math.max(160, Math.min(S.panelH, spaceAbove)); pb = S.btn.b + bw + gap; }
    else { mh = Math.max(160, Math.min(S.panelH, spaceBelow)); pb = S.btn.b - gap - mh; }
    // Tinggi dikunci (bukan hanya batas atas) supaya tab dengan isi sedikit, seperti Pengaturan, tidak membuat panel mengecil.
    panel.style.maxHeight = "none";
    panel.style.height = (mh / z) + "px";
    panel.style.right = (pr / z) + "px"; panel.style.bottom = (Math.max(4, pb) / z) + "px";
    $("#panelGrip").style.display = panelAbove ? "" : "none";
  }
  window.addEventListener("resize", placeUi);
  (function () {
    var tab = $("#hudTab");
    tab.style.touchAction = "none";
    tab.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      tab.setPointerCapture(e.pointerId);
      tdrag = { sx: e.clientX, sy: e.clientY, r: S.btn.r, b: S.btn.b, moved: false };
    });
    tab.addEventListener("pointermove", function (e) {
      if (!tdrag) return;
      var dx = e.clientX - tdrag.sx, dy = e.clientY - tdrag.sy;
      if (!tdrag.moved && Math.abs(dx) + Math.abs(dy) < 6) return;
      tdrag.moved = true;
      S.btn.r = tdrag.r - dx; S.btn.b = tdrag.b - dy;
      placeUi();
    });
    function endTab() {
      if (!tdrag) return;
      var moved = tdrag.moved; tdrag = null;
      if (moved) { tabJust = true; setTimeout(function () { tabJust = false; }, 0); save(); }
      probe();
    }
    tab.addEventListener("pointerup", endTab);
    tab.addEventListener("pointercancel", endTab);
    var grip = $("#panelGrip");
    grip.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      grip.setPointerCapture(e.pointerId);
      prs = { sy: e.clientY, h: Math.min(S.panelH, $("#panel").getBoundingClientRect().height) };
    });
    grip.addEventListener("pointermove", function (e) {
      if (!prs) return;
      S.panelH = Math.max(240, Math.min(window.innerHeight - 100, prs.h + (prs.sy - e.clientY)));
      placeUi();
    });
    function endGrip() { if (!prs) return; prs = null; save(); probe(); }
    grip.addEventListener("pointerup", endGrip);
    grip.addEventListener("pointercancel", endGrip);
  })();

  function setPanel(open) {
    $("#panel").hidden = !open;
    if (open) placeUi();
    if (api.panelOpen) api.panelOpen(!!open);
    if (open) {
      renderBook(); updateUps();
      ignoring = false; api.setIgnore(false); // panel langsung bisa diklik tanpa menunggu gerakan mouse berikutnya
    } else {
      probe();
    }
  }
  // Klik di luar kafe: jendela sedang klik-tembus di sana, jadi klik itu dilaporkan dari sisi Rust.
  if (api.onOutsideClick) api.onOutsideClick(function () { if (ignoring && !drag && $("#guide").hidden && !$("#panel").hidden) setPanel(false); });
  // Tutup bereaksi saat tombol ditekan (bukan dilepas) supaya tidak hilang kalau jendela sedang berpindah mode klik tembus.
  $("#closePanel").addEventListener("pointerdown", function (e) { e.preventDefault(); setPanel(false); });
  $("#closePanel").addEventListener("click", function () { setPanel(false); });
  api.onOpenPanel(function (tab) { if (S.hudHidden) setHud(false); if ($("#panel").hidden) setPanel(true); if (tab === "set") showTab("set"); });

  // tab Kafe dan Pencapaian
  document.querySelectorAll(".tab").forEach(function (t) {
    t.addEventListener("click", function () {
      var which = t.getAttribute("data-tab");
      document.querySelectorAll(".tab").forEach(function (x) { x.classList.toggle("on", x === t); });
      $("#tabKafe").hidden = which !== "kafe";
      $("#tabAch").hidden = which !== "ach";
      $("#tabSet").hidden = which !== "set";
      if (which === "ach") renderAch();
      if (which === "set") refreshSys();
    });
  });

  $("#segTheme").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-v]"); if (!b) return;
    S.theme = b.getAttribute("data-v"); applyLook(); save();
  });
  // Bagian sistem di Pengaturan (dulu ada di menu klik kanan tray). Statusnya datang dari Rust.
  var sys = { autostart: false, version: "", updateVersion: null };
  function renderSys() {
    $("#actAuto").textContent = t(sys.autostart ? "on" : "off");
    $("#actAuto").classList.toggle("main", sys.autostart);
    $("#actHud").textContent = t(S.hudHidden ? "hud.show" : "hud.hide");
    $("#verLine").textContent = t("set.upd.d", { v: sys.version || "?" });
    var ins = $("#actInstall");
    ins.hidden = !sys.updateVersion;
    if (sys.updateVersion) ins.textContent = t("upd.install", { v: sys.updateVersion });
  }
  function refreshSys() {
    if (api.appState) api.appState().then(function (st) { if (st) { sys = st; renderSys(); } }).catch(function () {});
    else renderSys();
  }
  function sysAction(name) { if (api.appAction) api.appAction(name).then(function (st) { if (st) { sys = st; renderSys(); } }).catch(function () {}); }
  $("#actCats").addEventListener("click", function () { save(); sysAction("toggle-visible"); });
  $("#actAuto").addEventListener("click", function () { sysAction("autostart"); });
  $("#actHud").addEventListener("click", function () { setHud(!S.hudHidden); renderSys(); });
  $("#actUpd").addEventListener("click", function () { sysAction("check-update"); setTimeout(refreshSys, 4000); });
  $("#actInstall").addEventListener("click", function () { sysAction("install-update"); });
  $("#segLang").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-v]"); if (!b) return;
    S.lang = b.getAttribute("data-v"); window.I18N.set(S.lang); applyLang(); save();
  });
  $("#segSize").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-v]"); if (!b) return;
    S.size = b.getAttribute("data-v"); applyLook(); save();
  });
  $("#volRange").addEventListener("input", function () { S.vol = (+this.value) / 100; });
  $("#volRange").addEventListener("change", function () {
    S.vol = (+this.value) / 100; save();
    if (S.mute && S.vol > 0) setMute(false);
    sfx("soft", 1, 0.5, 0.15, 0.3); // contoh suara pada volume baru
  });
  $("#muteSet").addEventListener("click", function () { setMute(!S.mute); save(); });

  // sembunyikan tombol kucing di pojok (Ctrl+Alt+K) supaya tidak menghalangi klik
  function setHud(hidden) {
    S.hudHidden = !!hidden;
    $("#hudTab").hidden = S.hudHidden;
    if (S.hudHidden) setPanel(false);
    renderSys();
    probe(); save();
  }
  // Gambar kucing di pojok langsung membuka atau menutup kafe.
  $("#hudTab").addEventListener("click", function () { if (tabJust) return; setPanel($("#panel").hidden); });
  api.onToggleHud(function () { setHud(!S.hudHidden); });
  api.onNotice(function (msg) {
    // dari sisi Rust datang sebagai kunci terjemahan, opsional diikuti "|versi"
    var p = String(msg).split("|");
    notify(/^upd\./.test(p[0]) ? t(p[0], { v: p[1] }) : msg);
  });

  $("#ups").addEventListener("click", function (e) {
    var b = e.target.closest("[data-up]");
    if (!b) return;
    var k = b.getAttribute("data-up");
    if (S.up[k] >= UPS[k].max || S.coins < upCost(k)) return;
    S.coins -= upCost(k); S.up[k]++;
    toast(t("toast.up", { n: t("up." + k + ".n"), l: S.up[k] }));
    updateStats(); save();
  });
  /* ---------- panduan untuk pemain baru ---------- */
  // Langkah dengan "sel" menyorot bagian layar yang sebenarnya; "open" dan "tab" mengatur panel kafe lebih dulu.
  var GUIDE = [
    {},
    {},
    { sel: "#hudTab", open: false },
    { sel: ".chips.live", open: true, tab: "kafe" },
    { sel: ".fishbtn", open: true, tab: "kafe" },
    { sel: '.tab[data-tab="ach"]', open: true, tab: "ach" },
    { sel: '.tab[data-tab="set"]', open: true, tab: "set" },
    { sel: "#panelGrip", open: true, tab: "kafe" },
    { open: false }
  ]; // teksnya ada di i18n.js (g0 sampai g8)

  var gi = 0;
  function showTab(which) {
    var t = document.querySelector('.tab[data-tab="' + which + '"]');
    if (t) t.click();
  }
  function placeRing(sel) {
    var ring = $("#tourRing"), card = $("#guide");
    var el = sel ? document.querySelector(sel) : null;
    var r = el && el.offsetParent !== null ? el.getBoundingClientRect() : null;
    card.style.left = ""; card.style.right = ""; card.style.bottom = ""; card.style.top = ""; card.style.transform = "";
    if (!r || !r.width) { ring.hidden = true; return; }
    ring.hidden = false;
    ring.style.left = (r.left - 5) + "px"; ring.style.top = (r.top - 5) + "px";
    ring.style.width = (r.width + 10) + "px"; ring.style.height = (r.height + 10) + "px";
    // kartu penjelasan ditaruh di sisi layar yang berlawanan supaya tidak menutupi yang disorot
    // kartu ditaruh menempel di dekat yang disorot: di bawahnya kalau muat, kalau tidak di atasnya
    card.style.transform = "none";
    var z = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ui")) || 1;
    var cw = card.getBoundingClientRect().width, ch = card.getBoundingClientRect().height;
    var gap = 14, W = window.innerWidth, H = window.innerHeight;
    var top = r.bottom + gap;
    if (top + ch > H - 8) top = r.top - gap - ch;
    if (top < 8) top = Math.max(8, Math.min(H - ch - 8, r.top + r.height / 2 - ch / 2));
    var left = r.left + r.width / 2 - cw / 2;
    if (top < r.bottom + gap && top + ch > r.top - gap) {
      // kalau terpaksa sejajar dengan sorotan, geser ke samping supaya tidak menutupinya
      left = r.left + r.width / 2 > W / 2 ? r.left - gap - cw : r.right + gap;
    }
    left = Math.max(8, Math.min(W - cw - 8, left));
    card.style.bottom = "auto"; card.style.left = (left / z) + "px"; card.style.top = (top / z) + "px";
  }
  function renderGuide() {
    var s = GUIDE[gi], dots = "";
    for (var i = 0; i < GUIDE.length; i++) dots += '<i class="' + (i === gi ? "on" : "") + '"></i>';
    if (s.open === true) { if ($("#panel").hidden) setPanel(true); if (s.tab) showTab(s.tab); }
    else if (s.open === false && !$("#panel").hidden) { setPanel(false); showTab("kafe"); }
    ignoring = false; api.setIgnore(false);
    $("#guideTitle").textContent = t("g" + gi + ".t");
    $("#guideText").innerHTML = t("g" + gi + ".p");
    $("#guideDots").innerHTML = dots;
    $("#guideNext").textContent = t(gi === GUIDE.length - 1 ? "guide.done" : "guide.next");
    $("#guideSkip").hidden = gi === GUIDE.length - 1;
    placeRing(s.sel);
  }
  function openGuide() {
    gi = 0; $("#guide").hidden = false; renderGuide();
  }
  function closeGuide() {
    $("#guide").hidden = true; $("#tourRing").hidden = true;
    if (!$("#panel").hidden) setPanel(false);
    showTab("kafe");
    if (!S.intro) { S.intro = true; save(); }
    probe();
  }
  $("#guideNext").addEventListener("click", function () { if (gi < GUIDE.length - 1) { gi++; renderGuide(); } else closeGuide(); });
  $("#guideSkip").addEventListener("click", closeGuide);
  $("#openGuide").addEventListener("click", function () { setPanel(false); openGuide(); });

  $("#ups").addEventListener("click", function (e) {
    if (!e.target.closest("#helperToggle")) return;
    S.helperOff = !S.helperOff;
    toast(t(S.helperOff ? "toast.helperoff" : "toast.helperon"));
    updateUps(); save();
  });
  $("#buyFish").addEventListener("click", function () {
    if (S.coins < FISH_PRICE || S.fish >= fishMax()) return;
    S.coins -= FISH_PRICE; S.fish = Math.min(fishMax(), S.fish + FISH_PACK);
    updateStats();
  });
  $("#mute").addEventListener("click", function () { setMute(!S.mute); save(); });
  $("#quit").addEventListener("click", function () { save(); api.quit(); });
  $("#quit2").addEventListener("click", function () { save(); api.quit(); });

  var resetArmed = false, resetT;
  $("#reset").addEventListener("click", function () {
    var b = $("#reset");
    if (!resetArmed) {
      resetArmed = true; b.textContent = t("set.reset.sure");
      resetT = setTimeout(function () { resetArmed = false; b.textContent = t("set.reset"); }, 3500);
      return;
    }
    clearTimeout(resetT); resetArmed = false; b.textContent = t("set.reset");
    cats.slice().forEach(removeCat);
    var keep = { lang: S.lang, mute: S.mute, vol: S.vol, theme: S.theme, size: S.size, btn: S.btn, panelH: S.panelH }; S = fresh(); S.mute = keep.mute; S.vol = keep.vol; S.theme = keep.theme; S.size = keep.size; S.lang = keep.lang; S.btn = keep.btn; S.panelH = keep.panelH; S.intro = true; save(); renderBook(); updateStats();
    toast(t("toast.reset"));
  });

  /* ---------- loop ---------- */
  var helperAcc = 0;
  function economy(dt) {
    dayCheck();
    S.fish = Math.min(fishMax(), S.fish + fishRegen() * dt);
    S.spawnT -= dt;
    if (S.spawnT <= 0) { arrive(); S.spawnT = arriveEvery() * (0.7 + Math.random() * 0.6); }
    helperAcc += helperRate() * dt;
    while (helperAcc >= 1) {
      helperAcc -= 1;
      var cand = cats.filter(function (c) { return !c.done; });
      if (cand.length) pet(rnd(cand), true);
    }
    cats.forEach(function (c) {
      if (c.done) return;
      c.age += dt;
      // tamu yang lama tidak diurus pulang sendiri, tanpa denda
      if (c.age > 120) { c.leaving = true; c.done = true; }
    });
    updateStats();
  }

  /* ---------- mulai ---------- */
  var loaded = load();
  if (loaded) {
    S = loaded;
    var away = Math.min(8 * 3600, Math.max(0, (Date.now() - S.last) / 1000));
    if (away > 30) {
      S.fish = Math.min(fishMax(), S.fish + fishRegen() * away);
      var gain = Math.floor(Math.min(away, 3600) * helperRate() * petCoins() * 0.5);
      if (gain > 0) { earn(gain); setTimeout(function () { toast(t("toast.welcome", { n: fmt(gain) })); }, 500); }
    }
    S.cats.slice(0, maxCats()).forEach(function (sc, i) {
      if (!sc || !sc.breed) return;
      var W = roamW();
      cats.push(makeCat(sc.name || rnd(NAMES), sc.breed, +sc.love || 0, Math.random() * (W - CAT), Math.random() < 0.5 ? -1 : 1));
      updateBar(cats[cats.length - 1]);
    });
  }
  if (S.lang) window.I18N.set(S.lang);
  window.I18N.apply(document);
  // hari bermain, dan kejutan pada tanggal tertentu
  function todayStamp() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function dayCheck() {
    var ts = todayStamp();
    if (S.dayStamp === ts) return;
    S.dayStamp = ts; S.days++;
    if (isCatDay()) { S.eggs.catday = 1; setTimeout(function () { notify(t("toast.catday")); }, 1500); }
    if (isHalloween()) { S.eggs.halloween = 1; setTimeout(function () { notify(t("toast.halloween")); }, 1500); }
    save();
  }
  // Rahasia: ketuk logo kafe di panel berkali-kali dengan cepat.
  var logoTaps = [];
  document.querySelector(".sign svg").addEventListener("click", function () {
    var n = Date.now(); logoTaps.push(n);
    while (logoTaps.length && n - logoTaps[0] > 4000) logoTaps.shift();
    if (logoTaps.length >= 7) {
      logoTaps = []; S.eggs.logo = 1;
      toast(t("toast.egg.rainbow")); arrive("pelangi"); updateStats(); save();
    }
  });
  renderUps(); renderBook(); updateStats(); setMute(S.mute); applyLook(); applyLang(); dayCheck(); placeUi(); setHud(S.hudHidden);
  if (!S.intro) { if (S.hudHidden) setHud(false); openGuide(); }

  var lastT = performance.now(), econAcc = 0;
  function frame(now) {
    var dt = Math.min(0.25, (now - lastT) / 1000);
    lastT = now;
    moveCats(dt);
    econAcc += dt;
    if (econAcc >= 0.25) { economy(econAcc); econAcc = 0; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  setInterval(save, 5000);
  window.addEventListener("pagehide", save);
  window.addEventListener("beforeunload", save);
})();

(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var api = window.api || { setIgnore: function () {}, quit: function () {}, onOpenPanel: function () {}, onToggleHud: function () {}, onNotice: function () {}, onBridge: function () {}, bridgeAction: function () {} };
  var hasFile = typeof api.loadSave === "function";
  var KEY = "kafe-meong-taskbar-v1";
  var CAT = 72, HUD_W = 380;

  var BREEDS = [
    { id: "oren",   nama: "Kucing Oren",  w: 60, mult: 1,   body: "#f4a259", belly: "#ffe3c2", pat: "stripe", stripe: "#d9822f", eye: "#3b2a1a" },
    { id: "abu",    nama: "Si Abu",       w: 60, mult: 1,   body: "#a8adb8", belly: "#e6e8ee", pat: "stripe", stripe: "#7f8593", eye: "#2a2f3a" },
    { id: "hitam",  nama: "Hitam Manis",  w: 40, mult: 1.2, body: "#4a4356", belly: "#5d556b", pat: "solid",  stripe: "#4a4356", eye: "#f2c94c" },
    { id: "putih",  nama: "Putih Salju",  w: 40, mult: 1.2, body: "#f7f4fb", belly: "#ffffff", pat: "solid",  stripe: "#f7f4fb", eye: "#4a83c9" },
    { id: "tuxedo", nama: "Tuxedo",       w: 25, mult: 1.5, body: "#463f55", belly: "#ffffff", pat: "tuxedo", stripe: "#463f55", eye: "#7bd18a" },
    { id: "siam",   nama: "Siam Krim",    w: 15, mult: 1.8, body: "#f1dfc6", belly: "#fbf1e2", pat: "siam",   stripe: "#7a5a47", eye: "#4a83c9" },
    { id: "calico", nama: "Tiga Warna",   w: 12, mult: 2,   body: "#fbf6ee", belly: "#ffffff", pat: "calico", stripe: "#f08a3c", eye: "#3b2a1a" },
    { id: "emas",   nama: "Kucing Emas",  w: 3,  mult: 5,   body: "#f2c94c", belly: "#fff0b8", pat: "stripe", stripe: "#d9a526", eye: "#5b3a12" }
  ];
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
    return { coins: 0, fish: 6, up: { table: 0, pet: 0, feed: 0, kitchen: 0, decor: 0, helper: 0 }, seen: {}, served: 0, mute: false, total: 0, pets: 0, feeds: 0, ach: {}, hudHidden: false, cats: [], spawnT: 0.5, last: Date.now() };
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
      f.total = +d.total || f.coins; f.pets = +d.pets || 0; f.feeds = +d.feeds || 0; f.ach = d.ach || {}; f.hudHidden = !!d.hudHidden;
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
  function petCoins() { return 1 + S.up.pet; }
  function petLove() { return 12 + S.up.pet; }
  function feedCoins() { return 5 + 4 * S.up.feed; }
  function tipBase() { return 8 + 4 * S.up.feed; }
  function fishMax() { return 10 + 5 * S.up.kitchen; }
  function fishRegen() { return 0.12 + 0.08 * S.up.kitchen; }
  function arriveEvery() { return Math.max(2.5, 9 - 1.2 * S.up.decor); }
  function helperRate() { return 0.35 * S.up.helper; }
  function upCost(k) { return Math.round(UPS[k].base * Math.pow(UPS[k].g, S.up[k])); }
  var FISH_PRICE = 12, FISH_PACK = 5;

  function fmt(n) { return Math.floor(n).toLocaleString("id-ID"); }
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
  function breedById(id) { for (var i = 0; i < BREEDS.length; i++) if (BREEDS[i].id === id) return BREEDS[i]; return BREEDS[0]; }
  function pickBreed() {
    var t = 0; BREEDS.forEach(function (b) { t += b.w; });
    var r = Math.random() * t;
    for (var i = 0; i < BREEDS.length; i++) { r -= BREEDS[i].w; if (r <= 0) return BREEDS[i]; }
    return BREEDS[0];
  }
  function roamW() { return Math.max(CAT + 20, window.innerWidth - (S.hudHidden ? 72 : HUD_W)); }
  function earn(n) { S.coins += n; S.total += n; }

  /* ---------- gambar kucing ---------- */
  function catSVG(b) {
    var s = "", line = 'stroke="rgba(40,25,60,.22)" stroke-width="1.5"';
    var paw = b.pat === "tuxedo" ? "#fff" : b.body;
    s += '<svg viewBox="0 0 100 100" aria-hidden="true">';
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
    s += '<ellipse cx="39" cy="95" rx="8" ry="5" fill="' + paw + '" ' + line + '/><ellipse cx="61" cy="95" rx="8" ry="5" fill="' + paw + '" ' + line + '/>';
    s += '</svg>';
    return s;
  }


  /* ---------- suara (disintesis, tanpa file audio) ---------- */
  var AC = null, lastSnd = 0;
  function actx() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (AC && AC.state === "suspended") AC.resume();
    return AC;
  }
  function meow(pitch, dur, vol) {
    if (S.mute) return;
    var now = performance.now();
    if (now - lastSnd < 150) return;
    lastSnd = now;
    var a = actx(); if (!a) return;
    var t = a.currentTime, o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
    o.type = "sawtooth"; f.type = "bandpass"; f.Q.value = 4;
    o.frequency.setValueAtTime(420 * pitch, t);
    o.frequency.linearRampToValueAtTime(640 * pitch, t + dur * 0.35);
    o.frequency.exponentialRampToValueAtTime(330 * pitch, t + dur);
    f.frequency.setValueAtTime(900, t);
    f.frequency.linearRampToValueAtTime(1900, t + dur * 0.4);
    f.frequency.linearRampToValueAtTime(1000, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }

  // Suara asli (CC0 dari OpenGameArt) dibaca dari renderer/sounds. Kalau file belum ada, dipakai suara sintetis di atas.
  var FILES = {
    pet:   ["kitten_mew-1_0.ogg", "Meow.ogg"],
    soft:  ["cat_softmew.wav"],
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
    if (S.mute) return;
    var list = ready[kind];
    if (list && list.length) {
      var now = performance.now();
      if (now - lastSnd < 150) return;
      lastSnd = now;
      var a = new Audio("sounds/" + rnd(list));
      a.volume = Math.max(0, Math.min(1, fileVol));
      a.playbackRate = pitch;
      a.preservesPitch = false;
      a.play().catch(function () {});
      return;
    }
    meow(pitch, synthDur, synthVol);
  }

  function crunch() {
    if (S.mute) return;
    var a = actx(); if (!a) return;
    var len = Math.floor(a.sampleRate * 0.06), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    [0, 0.1].forEach(function (off) {
      var s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      s.buffer = buf; f.type = "lowpass"; f.frequency.value = 2400; g.gain.value = 0.25;
      s.connect(f); f.connect(g); g.connect(a.destination); s.start(a.currentTime + off);
    });
  }
  function setMute(m) {
    S.mute = !!m;
    var b = $("#mute");
    b.classList.toggle("muted", S.mute);
    b.setAttribute("aria-pressed", S.mute ? "true" : "false");
    b.title = S.mute ? "Nyalakan suara" : "Matikan suara";
  }

  /* ---------- kucing di taskbar ---------- */
  var roam = $("#roam");
  var nextId = 1;

  function makeCat(name, breedId, love, x, dir) {
    var b = breedById(breedId);
    var c = { id: nextId++, name: name, breed: breedId, love: love, done: false, age: 0, x: x, dir: dir, speed: 24 + Math.random() * 22, state: "walk", timer: 2 + Math.random() * 5, hov: false, leaving: false, pitch: 0.85 + Math.random() * 0.4 };
    var el = document.createElement("div");
    el.className = "cat hit walking";
    el.setAttribute("data-id", c.id);
    el.innerHTML = '<div class="sprite">' + catSVG(b) + '</div>'
      + '<div class="bubble"><div class="bubble-in">'
      + '<div class="who"><b></b><span>' + b.nama + '</span></div>'
      + '<div class="love"><i></i></div>'
      + '<div class="acts"><button class="btn small" type="button" data-act="pet">Belai</button>'
      + '<button class="btn small main" type="button" data-act="feed">Ikan</button></div>'
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
    c.el.style.transform = "translateX(" + c.x.toFixed(1) + "px)";
    c.sprite.style.transform = "scaleX(" + (c.dir < 0 ? -1 : 1) + ")";
  }

  function arrive() {
    if (cats.filter(function (c) { return !c.done; }).length >= maxCats()) return;
    var b = pickBreed(), W = roamW(), fromLeft = Math.random() < 0.5;
    var c = makeCat(rnd(NAMES), b.id, 0, fromLeft ? -CAT : W, fromLeft ? 1 : -1);
    cats.push(c);
    sfx("soft", c.pitch, 0.3, 0.1, 0.3);
    var first = !S.seen[b.id];
    S.seen[b.id] = (S.seen[b.id] || 0) + 1;
    if (first) { renderBook(); toast("Tamu baru: " + b.nama + " mampir."); }
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
    floatText(c, "+" + tip + " tip", "tip");
    sfx("happy", c.pitch, 0.7, 0.3, 0.7);
    updateStats();
  }

  function pet(c, auto) {
    if (!c || c.done) return;
    c.love += petLove(); c.age = 0;
    var g = petCoins() * breedById(c.breed).mult;
    earn(g); S.pets++;
    floatText(c, "+" + fmt(Math.max(1, g)), "");
    sfx("pet", c.pitch, auto ? 0.2 : 0.6, auto ? 0.08 : 0.25, 0.28);
    if (!auto) { c.el.classList.add("petted"); setTimeout(function () { c.el.classList.remove("petted"); }, 450); }
    check(c); updateBar(c); updateStats();
  }

  function feed(c) {
    if (!c || c.done) return;
    if (S.fish < 1) { toast("Ikan habis. Tunggu dapur mengisi atau beli ikan."); return; }
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
    var hit = drag || (t && t.closest(".hit"));
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
    drag = { c: c, startX: e.clientX, off: e.clientX - c.x, moved: false };
  });
  document.addEventListener("mousemove", function (e) {
    if (!drag) return;
    if (e.buttons === 0) { // tombol mouse dilepas di luar jendela
      drag.c.el.classList.remove("dragging"); drag = null; return;
    }
    if (!drag.moved && Math.abs(e.clientX - drag.startX) < 5) return;
    drag.moved = true;
    var c = drag.c, nx = Math.max(-CAT / 3, Math.min(window.innerWidth - CAT * 2 / 3, e.clientX - drag.off));
    if (Math.abs(nx - c.x) > 1) c.dir = nx > c.x ? 1 : -1;
    c.x = nx; c.age = 0; c.state = "sit"; c.timer = 2;
    c.el.classList.add("dragging"); c.el.classList.remove("walking");
    draw(c);
  });
  document.addEventListener("mouseup", function () {
    if (!drag) return;
    var c = drag.c;
    if (drag.moved) {
      justDragged = true; setTimeout(function () { justDragged = false; }, 0);
      c.el.classList.remove("dragging");
      c.x = Math.max(0, Math.min(roamW() - CAT, c.x)); draw(c);
      sfx("soft", c.pitch, 0.3, 0.1, 0.3);
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
      h += '<div class="up" data-k="' + k + '"><div class="tile t-' + k + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[k] + '</svg></div><div class="txt"><b>' + UPS[k].n + '</b><span>' + UPS[k].d + '</span><div class="dots"></div></div>'
        + '<button class="btn main" type="button" data-up="' + k + '"></button></div>';
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
      if (k === "table") row.querySelector("span").textContent = "Kursi sekarang " + maxCats() + " dari maks " + (2 + max) + ". Naik = satu kucing lagi boleh mampir.";
      var b = row.querySelector("button");
      if (lv >= max) { b.textContent = "Maks"; b.disabled = true; }
      else { b.innerHTML = "Naik<small>" + fmt(upCost(k)) + " koin</small>"; b.disabled = S.coins < upCost(k); }
    });
    $("#buyFish").disabled = S.coins < FISH_PRICE || S.fish >= fishMax();
    $("#fishCost").textContent = FISH_PRICE + " koin";
  }
  function renderBook() {
    var h = "", got = 0;
    BREEDS.forEach(function (b) {
      var n = S.seen[b.id] || 0;
      if (n) got++;
      h += '<div class="card' + (n ? "" : " lock") + '">' + catSVG(b) + (n ? b.nama : "???") + "</div>";
    });
    $("#book").innerHTML = h;
    $("#bookCount").textContent = got + "/" + BREEDS.length;
  }

  /* ---------- pencapaian ---------- */
  function upCount() { return Object.keys(S.up).reduce(function (a, k) { return a + S.up[k]; }, 0); }
  function seenCount() { return Object.keys(S.seen).filter(function (k) { return S.seen[k]; }).length; }
  var ACH = [
    { id: "belai1",   n: "Belaian pertama",     d: "Belai kucing 1 kali",            goal: 1,     cur: function () { return S.pets; }, r: 5 },
    { id: "belai100", n: "Tangan ajaib",        d: "Belai kucing 100 kali",          goal: 100,   cur: function () { return S.pets; }, r: 50 },
    { id: "belai1k",  n: "Tangan dewa",         d: "Belai kucing 1.000 kali",        goal: 1000,  cur: function () { return S.pets; }, r: 300 },
    { id: "ikan25",   n: "Juru masak",          d: "Beri ikan 25 kali",              goal: 25,    cur: function () { return S.feeds; }, r: 40 },
    { id: "ikan250",  n: "Koki andalan",        d: "Beri ikan 250 kali",             goal: 250,   cur: function () { return S.feeds; }, r: 200 },
    { id: "tamu1",    n: "Tamu pertama senang", d: "Buat 1 tamu senang",             goal: 1,     cur: function () { return S.served; }, r: 10 },
    { id: "tamu25",   n: "Kafe mulai ramai",    d: "Buat 25 tamu senang",            goal: 25,    cur: function () { return S.served; }, r: 80 },
    { id: "tamu100",  n: "Kafe terkenal",       d: "Buat 100 tamu senang",           goal: 100,   cur: function () { return S.served; }, r: 300 },
    { id: "tamu500",  n: "Legenda taskbar",     d: "Buat 500 tamu senang",           goal: 500,   cur: function () { return S.served; }, r: 1000 },
    { id: "koin1k",   n: "Mulai untung",        d: "Kumpulkan 1.000 koin (total)",   goal: 1000,  cur: function () { return S.total; }, r: 50 },
    { id: "koin50k",  n: "Juragan kucing",      d: "Kumpulkan 50.000 koin (total)",  goal: 50000, cur: function () { return S.total; }, r: 500 },
    { id: "reno1",    n: "Renovasi pertama",    d: "Beli 1 perbaikan kafe",          goal: 1,     cur: upCount, r: 20 },
    { id: "reno20",   n: "Kafe makin mewah",    d: "Beli 20 perbaikan kafe",         goal: 20,    cur: upCount, r: 200 },
    { id: "kursi",    n: "Kursi penuh",         d: "Jatah tamu mencapai maksimal",   goal: UPS.table.max, cur: function () { return S.up.table; }, r: 150 },
    { id: "mimi",     n: "Punya pelayan",       d: "Pekerjakan Pelayan Mimi",        goal: 1,     cur: function () { return S.up.helper; }, r: 30 },
    { id: "koleksi4", n: "Pencinta kucing",     d: "Temui 4 jenis kucing",           goal: 4,     cur: seenCount, r: 60 },
    { id: "koleksi8", n: "Kolektor lengkap",    d: "Temui semua 8 jenis kucing",     goal: 8,     cur: seenCount, r: 500 },
    { id: "emas",     n: "Kucing emas!",        d: "Temui si Kucing Emas",           goal: 1,     cur: function () { return S.seen.emas ? 1 : 0; }, r: 200 }
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
      notify("Pencapaian: " + a.n + " (+" + fmt(a.r) + " koin)");
      sfx("happy", 1.1, 0.6, 0.25, 0.5);
      save();
    });
  }
  function renderAch() {
    var done = 0, h = "";
    ACH.forEach(function (a) {
      var ok = !!S.ach[a.id]; if (ok) done++;
      var cur = Math.min(a.cur(), a.goal);
      h += '<div class="ach' + (ok ? " done" : "") + '"><div class="badge">' + (ok ? "\u2713" : Math.round(cur / a.goal * 100) + "%") + '</div>'
        + '<div class="grow"><b>' + a.n + '</b><span>' + a.d + (ok ? "" : " (" + fmt(cur) + "/" + fmt(a.goal) + ")") + '</span>'
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
    if (!$("#panel").hidden) {
      $("#chipServed").textContent = fmt(S.served);
      $("#chipTotal").textContent = fmt(S.total);
      $("#chipPets").textContent = fmt(S.pets);
    }
    checkAch();
    if (!$("#panel").hidden && !$("#tabAch").hidden) renderAch();
    else $("#achCount").textContent = Object.keys(S.ach).length + "/" + ACH.length;
  }

  function setPanel(open) {
    $("#panel").hidden = !open;
    if (open) {
      renderBook(); updateUps();
      ignoring = false; api.setIgnore(false); // panel langsung bisa diklik tanpa menunggu gerakan mouse berikutnya
    } else {
      probe();
    }
  }
  $("#togglePanel").addEventListener("click", function () { setPanel($("#panel").hidden); });
  // Tutup bereaksi saat tombol ditekan (bukan dilepas) supaya tidak hilang kalau jendela sedang berpindah mode klik tembus.
  $("#closePanel").addEventListener("pointerdown", function (e) { e.preventDefault(); setPanel(false); });
  $("#closePanel").addEventListener("click", function () { setPanel(false); });
  api.onOpenPanel(function () { if (S.hudHidden) setHud(false); setPanel(true); });

  // tab Kafe dan Pencapaian
  document.querySelectorAll(".tab").forEach(function (t) {
    t.addEventListener("click", function () {
      var which = t.getAttribute("data-tab");
      document.querySelectorAll(".tab").forEach(function (x) { x.classList.toggle("on", x === t); });
      $("#tabKafe").hidden = which !== "kafe";
      $("#tabAch").hidden = which !== "ach";
      if (which === "ach") renderAch();
    });
  });

  // sembunyikan bar menu supaya tidak menghalangi klik; tombol kecil di pojok untuk memunculkannya lagi
  function setHud(hidden) {
    S.hudHidden = !!hidden;
    $("#hud").hidden = S.hudHidden;
    $("#hudTab").hidden = !S.hudHidden;
    if (S.hudHidden) setPanel(false);
    probe(); save();
  }
  $("#hideHud").addEventListener("click", function () { setHud(true); });
  $("#collapseHud").addEventListener("click", function () { setHud(true); });
  $("#hudTab").addEventListener("click", function () { setHud(false); });
  api.onToggleHud(function () { setHud(!S.hudHidden); });
  api.onNotice(function (msg) { notify(msg); });

  // ajakan pindah ke versi yang lebih ringan
  api.onBridge(function () { $("#bridge").hidden = false; });
  function closeBridge(name) { $("#bridge").hidden = true; api.bridgeAction(name); probe(); }
  $("#bridgeOpen").addEventListener("click", function () { closeBridge("open"); });
  $("#bridgeLater").addEventListener("click", function () { closeBridge("later"); });

  $("#ups").addEventListener("click", function (e) {
    var b = e.target.closest("[data-up]");
    if (!b) return;
    var k = b.getAttribute("data-up");
    if (S.up[k] >= UPS[k].max || S.coins < upCost(k)) return;
    S.coins -= upCost(k); S.up[k]++;
    toast(UPS[k].n + " naik ke tingkat " + S.up[k] + ".");
    updateStats(); save();
  });
  $("#buyFish").addEventListener("click", function () {
    if (S.coins < FISH_PRICE || S.fish >= fishMax()) return;
    S.coins -= FISH_PRICE; S.fish = Math.min(fishMax(), S.fish + FISH_PACK);
    updateStats();
  });
  $("#mute").addEventListener("click", function () { setMute(!S.mute); save(); });
  $("#quit").addEventListener("click", function () { save(); api.quit(); });

  var resetArmed = false, resetT;
  $("#reset").addEventListener("click", function () {
    var b = $("#reset");
    if (!resetArmed) {
      resetArmed = true; b.textContent = "Yakin? Ketuk lagi";
      resetT = setTimeout(function () { resetArmed = false; b.textContent = "Mulai dari awal"; }, 3500);
      return;
    }
    clearTimeout(resetT); resetArmed = false; b.textContent = "Mulai dari awal";
    cats.slice().forEach(removeCat);
    var wasMuted = S.mute; S = fresh(); S.mute = wasMuted; save(); renderBook(); updateStats();
    toast("Kafe dimulai dari awal.");
  });

  /* ---------- loop ---------- */
  var helperAcc = 0;
  function economy(dt) {
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
      if (gain > 0) { earn(gain); setTimeout(function () { toast("Selamat datang kembali. Pelayan Mimi mengumpulkan " + fmt(gain) + " koin."); }, 500); }
    }
    S.cats.slice(0, maxCats()).forEach(function (sc, i) {
      if (!sc || !sc.breed) return;
      var W = roamW();
      cats.push(makeCat(sc.name || rnd(NAMES), sc.breed, +sc.love || 0, Math.random() * (W - CAT), Math.random() < 0.5 ? -1 : 1));
      updateBar(cats[cats.length - 1]);
    });
  }
  renderUps(); renderBook(); updateStats(); setMute(S.mute); setHud(S.hudHidden);

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

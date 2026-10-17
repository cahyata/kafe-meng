// Jembatan antara game dan Rust (Tauri). Menyediakan window.api dengan bentuk yang sama seperti versi Electron,
// lalu memuat game.js setelah save selesai dibaca supaya game.js tidak perlu tahu soal Tauri.
(function () {
  "use strict";
  var T = window.__TAURI__;
  var noop = function () {};

  // Matikan perilaku "browser": menu klik kanan bawaan WebView2 (Back, Refresh, Inspect) dan pintasan muat ulang atau zoom.
  document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  document.addEventListener("keydown", function (e) {
    var k = (e.key || "").toLowerCase();
    if (e.key === "F5" || ((e.ctrlKey || e.metaKey) && (k === "r" || k === "p" || k === "+" || k === "-" || k === "=" || k === "0"))) e.preventDefault();
  });
  document.addEventListener("wheel", function (e) { if (e.ctrlKey) e.preventDefault(); }, { passive: false });

  function startGame() {
    var s = document.createElement("script");
    s.src = "game.js";
    document.body.appendChild(s);
  }

  // Dibuka di browser biasa (tanpa Tauri): game tetap jalan memakai localStorage.
  if (!T || !T.core) { startGame(); return; }

  var inv = T.core.invoke, listen = T.event.listen;
  var raw = "";
  window.api = {
    setIgnore: function (ignore) { inv("set_ignore", { ignore: !!ignore }).catch(noop); },
    quit: function () { inv("quit").catch(noop); },
    loadSave: function () { return raw; },
    writeSave: function (json) { inv("write_save", { json: json }).catch(noop); },
    onOpenPanel: function (cb) { listen("open-panel", function (e) { cb(e.payload); }); },
    appState: function () { return inv("app_state"); },
    appAction: function (name) { return inv("app_action", { name: name }); },
    onNotice: function (cb) { listen("notice", function (e) { cb(e.payload); }); },
    onToggleHud: function (cb) { listen("toggle-hud", function () { cb(); }); },
    panelOpen: function (open) { inv("panel_open", { open: !!open }).catch(noop); },
    onOutsideClick: function (cb) { listen("outside-click", function () { cb(); }); },
    onCursor: function (cb) { listen("cursor", function (e) { cb(e.payload[0], e.payload[1]); }); }
  };

  inv("load_save").then(function (s) { raw = s || ""; }).catch(noop).then(startGame);
})();

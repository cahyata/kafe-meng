(function () {
  var T = window.__TAURI__;
  var inv = T && T.core ? T.core.invoke : function () { return Promise.resolve({}); };
  function apply(st) {
    var T = window.I18N ? window.I18N.t : function (k) { return k; };
    document.getElementById("visLabel").textContent = T(st.visible ? "menu.hide" : "menu.show");
    var a = document.querySelector('[data-a="autostart"]');
    a.setAttribute("aria-checked", st.autostart ? "true" : "false");
    document.getElementById("ver").textContent = st.version ? T("menu.sub") + " · v" + st.version : T("menu.sub");
    var ins = document.getElementById("installItem");
    ins.hidden = !st.updateVersion;
    if (st.updateVersion) document.getElementById("installLabel").textContent = T("menu.install", { v: st.updateVersion });
    document.getElementById("autoIco").textContent = st.autostart ? "✓" : "";
  }
  // Matikan perilaku "browser": menu klik kanan bawaan WebView2 (Back, Refresh, Inspect) dan pintasan muat ulang atau zoom.
  document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  document.addEventListener("keydown", function (e) {
    var k = (e.key || "").toLowerCase();
    if (e.key === "F5" || ((e.ctrlKey || e.metaKey) && (k === "r" || k === "p" || k === "+" || k === "-" || k === "=" || k === "0"))) e.preventDefault();
  });
  document.addEventListener("wheel", function (e) { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  // Jendela menu dibuat saat dibutuhkan dan dibuang lagi saat ditutup (hemat memori).
  // Ia baru ditampilkan setelah isinya siap supaya tidak berkedip.
  try {
    var th = localStorage.getItem("kafe-theme");
    if (th === "light" || th === "dark") document.documentElement.setAttribute("data-theme", th);
  } catch (e) {}
  if (window.I18N) window.I18N.apply(document);
  inv("menu_state").then(function (st) {
    apply(st || {});
    // setTimeout, bukan requestAnimationFrame: halaman yang masih tersembunyi tidak menjalankan frame animasi.
    // Tinggi jendela disesuaikan dengan isi (ditambah ruang untuk bayangan) supaya tidak ada area kosong yang menangkap klik.
    setTimeout(function () {
      var m = document.querySelector(".menu");
      inv("menu_ready", { height: m ? Math.ceil(m.getBoundingClientRect().height) + 28 : 0 }).catch(function () {});
    }, 30);
  }).catch(function () {});
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-a]");
    if (b) inv("menu_action", { name: b.getAttribute("data-a") }).catch(function () {});
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") inv("menu_action", { name: "close" }).catch(function () {});
  });
})();

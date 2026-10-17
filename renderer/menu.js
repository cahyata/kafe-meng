(function () {
  var api = window.menu || { getState: function () { return Promise.resolve({}); }, onState: function () {}, action: function () {} };
  function apply(st) {
    document.getElementById("visLabel").textContent = st.visible ? "Sembunyikan kucing" : "Tampilkan kucing";
    var a = document.querySelector('[data-a="autostart"]');
    a.setAttribute("aria-checked", st.autostart ? "true" : "false");
    document.getElementById("ver").textContent = st.version ? "kucing di taskbar kamu \u00b7 v" + st.version : "kucing di taskbar kamu";
    var light = document.getElementById("lightItem");
    light.hidden = !st.lightVersion;
    if (st.lightVersion) document.getElementById("lightLabel").textContent = "Unduh versi lebih ringan (v" + st.lightVersion + ")";
    var ins = document.getElementById("installItem");
    ins.hidden = !st.updateReady;
    if (st.updateReady) document.getElementById("installLabel").textContent = "Mulai ulang untuk v" + st.updateReady;
    document.getElementById("autoIco").textContent = st.autostart ? "✓" : "";
  }
  api.getState().then(apply);
  api.onState(apply);
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-a]");
    if (b) api.action(b.getAttribute("data-a"));
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") api.action("close");
  });
})();

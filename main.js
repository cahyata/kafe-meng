const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, globalShortcut } = require("electron");
const path = require("path");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");

const HEIGHT = 430;

// Folder data dipatok ke nama tetap, lepas dari nama produk, lalu save lama disalin sekali kalau ada
// (folder "Kafe Meong" atau nama bawaan lama), supaya progres tidak hilang saat nama berubah.
(function pinUserData() {
  const base = app.getPath("appData");
  const target = path.join(base, "Kafe Meng");
  const legacy = [app.getPath("userData"), path.join(base, "Kafe Meong"), path.join(base, "kafe-meong-taskbar")];
  try {
    if (!fs.existsSync(path.join(target, "save.json"))) {
      for (const dir of legacy) {
        if (dir !== target && fs.existsSync(path.join(dir, "save.json"))) {
          fs.mkdirSync(target, { recursive: true });
          fs.copyFileSync(path.join(dir, "save.json"), path.join(target, "save.json"));
          break;
        }
      }
    }
  } catch (err) { /* kalau gagal, game mulai dari save kosong tapi file lama tetap utuh */ }
  app.setPath("userData", target);
})();

let win = null;
let tray = null;

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

function place() {
  if (!win) return;
  // workArea berakhir tepat di atas taskbar, jadi jendela menempel di sana.
  const wa = screen.getPrimaryDisplay().workArea;
  win.setBounds({ x: wa.x, y: wa.y + wa.height - HEIGHT, width: wa.width, height: HEIGHT });
}

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: HEIGHT,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: false,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      autoplayPolicy: "no-user-gesture-required",
      backgroundThrottling: false
    }
  });
  win.setAlwaysOnTop(true, "floating");
  win.setIgnoreMouseEvents(true, { forward: true });
  place();
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
  win.once("ready-to-show", () => win.showInactive());

  screen.on("display-metrics-changed", place);
  screen.on("display-added", place);
  screen.on("display-removed", place);

  // Taskbar kadang merebut urutan jendela; naikkan lagi secara berkala.
  setInterval(() => { if (win && win.isVisible()) win.moveTop(); }, 5000);
}

const MENU_W = 268, MENU_H = 360;
let menuWin = null;

function createMenuWindow() {
  menuWin = new BrowserWindow({
    width: MENU_W,
    height: MENU_H,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "menu-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  menuWin.setAlwaysOnTop(true, "pop-up-menu");
  menuWin.loadFile(path.join(__dirname, "renderer", "menu.html"));
  menuWin.on("blur", () => menuWin.hide()); // menu menutup sendiri kalau klik di luar
}

let updateReady = null; // nomor versi yang sudah diunduh dan siap dipasang

function menuState() {
  return {
    visible: !!(win && win.isVisible()),
    autostart: app.getLoginItemSettings().openAtLogin,
    version: app.getVersion(),
    updateReady
  };
}

function notice(msg) {
  if (win && !win.isDestroyed()) win.webContents.send("notice", msg);
}

// Pembaruan otomatis dari GitHub Releases (hanya di versi yang sudah dipasang, bukan saat npm start).
let manualCheck = false;
function setupUpdater() {
  if (!app.isPackaged) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("update-available", (info) => notice("Versi baru " + info.version + " ditemukan, sedang diunduh."));
  autoUpdater.on("update-not-available", () => { if (manualCheck) notice("Kamu sudah memakai versi terbaru."); manualCheck = false; });
  autoUpdater.on("update-downloaded", (info) => {
    updateReady = info.version;
    notice("Versi " + info.version + " siap. Buka menu tray lalu pilih Mulai ulang untuk update.");
  });
  autoUpdater.on("error", () => { if (manualCheck) notice("Gagal memeriksa pembaruan. Coba lagi nanti."); manualCheck = false; });
  const check = () => autoUpdater.checkForUpdates().catch(() => {});
  setTimeout(check, 15000);
  setInterval(check, 4 * 60 * 60 * 1000);
}

function showMenu() {
  if (!menuWin) return;
  const pt = screen.getCursorScreenPoint();
  const wa = screen.getDisplayNearestPoint(pt).workArea;
  // Muncul tepat di atas titik klik (taskbar di bawah), dijaga tetap di dalam layar.
  const x = Math.max(wa.x + 4, Math.min(pt.x - MENU_W / 2, wa.x + wa.width - MENU_W - 4));
  const y = Math.max(wa.y + 4, Math.min(pt.y - MENU_H - 6, wa.y + wa.height - MENU_H - 4));
  menuWin.setBounds({ x: Math.round(x), y: Math.round(y), width: MENU_W, height: MENU_H });
  menuWin.webContents.send("menu-state", menuState());
  menuWin.show();
  menuWin.focus();
}

function openPanel() {
  if (!win) return;
  win.showInactive();
  win.webContents.send("open-panel");
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, "assets", "icon.png")).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip("Kafe Meng");
  createMenuWindow();
  tray.on("click", openPanel);
  tray.on("right-click", showMenu);
}

ipcMain.handle("menu-state", () => menuState());
ipcMain.on("menu-action", (_e, name) => {
  if (menuWin) menuWin.hide();
  if (name === "open") openPanel();
  else if (name === "toggle-visible") { if (win.isVisible()) win.hide(); else win.showInactive(); }
  else if (name === "check-update") {
    if (!app.isPackaged) notice("Update otomatis hanya aktif di versi yang sudah dipasang.");
    else { manualCheck = true; autoUpdater.checkForUpdates().catch(() => { notice("Gagal memeriksa pembaruan. Coba lagi nanti."); manualCheck = false; }); }
  }
  else if (name === "install-update") { if (updateReady) autoUpdater.quitAndInstall(); }
  else if (name === "toggle-hud") { if (win) win.webContents.send("toggle-hud"); }
  else if (name === "autostart") app.setLoginItemSettings({ openAtLogin: !app.getLoginItemSettings().openAtLogin });
  else if (name === "quit") app.quit();
});

ipcMain.on("set-ignore", (_e, ignore) => {
  if (!win) return;
  if (ignore) win.setIgnoreMouseEvents(true, { forward: true });
  else win.setIgnoreMouseEvents(false);
});
ipcMain.on("quit", () => app.quit());

// Progres disimpan sebagai JSON di folder data pengguna (Windows: %APPDATA%\Kafe Meng\save.json).
const saveFile = () => path.join(app.getPath("userData"), "save.json");
ipcMain.on("load-save", (e) => {
  try { e.returnValue = fs.readFileSync(saveFile(), "utf8"); } catch (err) { e.returnValue = ""; }
});
ipcMain.on("write-save", (_e, json) => {
  if (typeof json !== "string" || json.length > 1000000) return;
  try {
    fs.mkdirSync(app.getPath("userData"), { recursive: true });
    const tmp = saveFile() + ".tmp";
    fs.writeFileSync(tmp, json);
    fs.renameSync(tmp, saveFile()); // tulis ke file sementara dulu agar save tidak rusak kalau komputer mati
  } catch (err) { /* simpan berikutnya akan mencoba lagi */ }
});

app.whenReady().then(() => {
  createWindow();
  createTray();
  setupUpdater();
  // Pintasan untuk menyembunyikan atau menampilkan bar menu kapan saja.
  globalShortcut.register("CommandOrControl+Alt+K", () => { if (win) win.webContents.send("toggle-hud"); });
});
app.on("second-instance", openPanel);
app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", () => app.quit());

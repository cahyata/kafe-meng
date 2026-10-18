use std::{
    fs,
    io::Write,
    path::PathBuf,
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Mutex,
    },
    thread,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use serde::Serialize;
use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize, RunEvent,
    WebviewWindow,
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt as _};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
use tauri_plugin_updater::{Update, UpdaterExt};

/// Tinggi jendela kucing (piksel logis). Lebarnya selalu selebar area kerja layar.
const HEIGHT: f64 = 4000.0;
#[derive(Default)]
struct AppState {
    /// Pembaruan yang sudah ditemukan dan menunggu dipasang.
    update: Mutex<Option<Update>>,
    /// Versi yang terakhir diumumkan, supaya pengecekan otomatis tidak mengulang pesan yang sama.
    announced: Mutex<Option<String>>,
    /// Panel kafe sedang terbuka (dilaporkan game), supaya klik di luarnya bisa menutupnya.
    panel_open: AtomicBool,
    /// Detak terakhir dari game (ms sejak epoch). Kalau berhenti lama, halaman dianggap mati dan dimuat ulang.
    beat: AtomicU64,
}

fn now_ms() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis() as u64).unwrap_or(0)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AppInfo {
    visible: bool,
    autostart: bool,
    version: String,
    update_version: Option<String>,
}

fn main_window(app: &AppHandle) -> Option<WebviewWindow> {
    app.get_webview_window("main")
}

// msg adalah kunci terjemahan (lihat i18n.js), opsional diikuti "|nilai"
fn notice(app: &AppHandle, msg: &str) {
    let _ = app.emit_to("main", "notice", msg);
}

/// Catatan kecil untuk mencari masalah: dicetak ke terminal (saat `npm run dev`) dan ditulis ke
/// %APPDATA%\Kafe Meng\debug.log (dipotong kalau sudah besar).
fn log(app: &AppHandle, msg: &str) {
    let secs = SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0);
    let line = format!("[{secs}] {msg}");
    eprintln!("[kafe-meng] {line}");
    let dir = save_dir(app);
    let _ = fs::create_dir_all(&dir);
    let file = dir.join("debug.log");
    if fs::metadata(&file).map(|m| m.len() > 200_000).unwrap_or(false) {
        let _ = fs::remove_file(&file);
    }
    if let Ok(mut h) = fs::OpenOptions::new().create(true).append(true).open(&file) {
        let _ = writeln!(h, "{line}");
    }
}

/* ---------- penyimpanan: %APPDATA%\Kafe Meng\save.json ---------- */

fn save_dir(app: &AppHandle) -> PathBuf {
    app.path()
        .data_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("Kafe Meng")
}

/// Salin save dari lokasi lama sekali saja, supaya progres dari versi Electron atau nama lama tidak hilang.
fn migrate_legacy_save(app: &AppHandle) {
    let target = save_dir(app);
    let file = target.join("save.json");
    if file.exists() {
        return;
    }
    let base = match app.path().data_dir() {
        Ok(b) => b,
        Err(_) => return,
    };
    for name in ["Kafe Meong", "kafe-meong-taskbar"] {
        let old = base.join(name).join("save.json");
        if old.exists() {
            if fs::create_dir_all(&target).is_ok() && fs::copy(&old, &file).is_ok() {
                return;
            }
        }
    }
}

#[tauri::command]
fn load_save(app: AppHandle) -> String {
    migrate_legacy_save(&app);
    fs::read_to_string(save_dir(&app).join("save.json")).unwrap_or_default()
}

#[tauri::command]
fn write_save(app: AppHandle, json: String) {
    if json.len() > 1_000_000 {
        return;
    }
    let dir = save_dir(&app);
    if fs::create_dir_all(&dir).is_err() {
        return;
    }
    // Tulis ke file sementara dulu agar save tidak rusak kalau komputer mati di tengah penulisan.
    let tmp = dir.join("save.json.tmp");
    if fs::write(&tmp, json).is_ok() {
        let _ = fs::rename(&tmp, dir.join("save.json"));
    }
}

/* ---------- jendela kucing ---------- */

/// Menempelkan jendela tepat di atas taskbar (bagian bawah area kerja layar utama).
fn place(app: &AppHandle) {
    let (Some(w), Ok(Some(m))) = (main_window(app), app.primary_monitor()) else {
        return;
    };
    let wa = m.work_area();
    let h = ((HEIGHT * m.scale_factor()).round() as u32).min(wa.size.height);
    let size = PhysicalSize::new(wa.size.width, h);
    let pos = PhysicalPosition::new(wa.position.x, wa.position.y + wa.size.height as i32 - h as i32);
    if w.outer_size().ok() != Some(size) {
        let _ = w.set_size(size);
    }
    if w.outer_position().ok() != Some(pos) {
        let _ = w.set_position(pos);
    }
}

/// tab: "" = tab yang sedang terbuka, "set" = Pengaturan.
fn open_panel(app: &AppHandle, tab: &str) {
    if let Some(w) = main_window(app) {
        let _ = w.show();
    }
    let _ = app.emit_to("main", "open-panel", tab);
}

#[tauri::command]
fn set_ignore(window: WebviewWindow, ignore: bool) {
    let _ = window.set_ignore_cursor_events(ignore);
}

#[tauri::command]
fn panel_open(app: AppHandle, open: bool) {
    app.state::<AppState>().panel_open.store(open, Ordering::Relaxed);
}

#[tauri::command]
fn beat(app: AppHandle) {
    app.state::<AppState>().beat.store(now_ms(), Ordering::Relaxed);
}

#[tauri::command]
fn quit(app: AppHandle) {
    app.exit(0);
}

/// Jendela klik-tembus tidak menerima gerakan mouse, jadi Rust yang memantau kursor dan mengirim posisinya
/// (dalam piksel CSS relatif ke jendela) ke game. Sekalian menjaga posisi jendela dan urutan "selalu di atas".
fn spawn_watcher(app: AppHandle) {
    thread::spawn(move || {
        let mut last = (i32::MIN, i32::MIN);
        let mut ticks: u32 = 0;
        let mut was_down = false;
        let mut prev = now_ms();
        app.state::<AppState>().beat.store(prev, Ordering::Relaxed);
        loop {
            ticks = ticks.wrapping_add(1);
            let now = now_ms();
            if now.saturating_sub(prev) > 8000 {
                // Loop ini tertidur lama (laptop sleep atau layar mati): rapikan jendela dan kabari game agar suaranya disiapkan ulang.
                log(&app, "bangun dari sleep");
                app.state::<AppState>().beat.store(now, Ordering::Relaxed);
                place(&app);
                if let Some(w) = main_window(&app) {
                    let _ = w.set_always_on_top(true);
                }
                let _ = app.emit_to("main", "resumed", ());
            }
            prev = now;
            let Some(w) = main_window(&app) else {
                thread::sleep(Duration::from_millis(500));
                continue;
            };
            if ticks % 25 == 0 {
                // Taskbar kadang merebut urutan jendela, dan ukuran layar bisa berubah.
                place(&app);
                let _ = w.set_always_on_top(true);
            }
            if !w.is_visible().unwrap_or(false) {
                app.state::<AppState>().beat.store(now, Ordering::Relaxed);
                thread::sleep(Duration::from_millis(300));
                continue;
            }
            // Halaman game berhenti berdetak lama (WebView2 mati atau macet): muat ulang. Progres aman, game menyimpan tiap 5 detik.
            // Batasnya longgar karena WebView2 memperlambat timer saat jendela tertutup aplikasi layar penuh.
            if now.saturating_sub(app.state::<AppState>().beat.load(Ordering::Relaxed)) > 180_000 {
                log(&app, "game tidak berdetak, memuat ulang halaman");
                app.state::<AppState>().beat.store(now, Ordering::Relaxed);
                let _ = w.reload();
            }
            // Klik di luar panel kafe: jendela klik-tembus tidak melihatnya, jadi dilaporkan dari sini.
            let panel_open = app.state::<AppState>().panel_open.load(Ordering::Relaxed);
            let down = panel_open && mouse_down();
            if down && !was_down {
                let _ = app.emit_to("main", "outside-click", ());
            }
            was_down = down;
            let mut inside = false;
            if let (Ok(c), Ok(o), Ok(s)) = (app.cursor_position(), w.outer_position(), w.outer_size()) {
                let (dx, dy) = (c.x - o.x as f64, c.y - o.y as f64);
                inside = dx >= 0.0 && dy >= 0.0 && dx < s.width as f64 && dy < s.height as f64;
                let sf = w.scale_factor().unwrap_or(1.0);
                let cur = if inside { ((dx / sf) as i32, (dy / sf) as i32) } else { (-1, -1) };
                if cur != last {
                    last = cur;
                    let _ = app.emit_to("main", "cursor", [cur.0, cur.1]);
                }
            }
            // Rapat saat kursor ada di jendela, longgar saat jauh supaya CPU hampir nol.
            thread::sleep(Duration::from_millis(if inside || panel_open { 30 } else { 120 }));
        }
    });
}

fn app_state_now(app: &AppHandle) -> AppInfo {
    AppInfo {
        visible: main_window(app).and_then(|w| w.is_visible().ok()).unwrap_or(false),
        autostart: app.autolaunch().is_enabled().unwrap_or(false),
        version: app.package_info().version.to_string(),
        update_version: app
            .state::<AppState>()
            .update
            .lock()
            .unwrap()
            .as_ref()
            .map(|u| u.version.clone()),
    }
}

/// Status untuk bagian "Sistem" di tab Pengaturan.
#[tauri::command]
fn app_state(app: AppHandle) -> AppInfo { app_state_now(&app) }

/// Tombol mouse kiri atau kanan sedang ditekan (di mana pun di layar).
#[cfg(windows)]
fn mouse_down() -> bool {
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{GetAsyncKeyState, VK_LBUTTON, VK_RBUTTON};
    unsafe { (GetAsyncKeyState(VK_LBUTTON as i32) as u16 & 0x8000) != 0 || (GetAsyncKeyState(VK_RBUTTON as i32) as u16 & 0x8000) != 0 }
}
#[cfg(not(windows))]
fn mouse_down() -> bool {
    false
}

#[tauri::command]
async fn app_action(app: AppHandle, name: String) -> AppInfo {
    match name.as_str() {
        "toggle-visible" => {
            if let Some(w) = main_window(&app) {
                if w.is_visible().unwrap_or(false) {
                    let _ = w.hide();
                } else {
                    let _ = w.show();
                }
            }
        }
        "autostart" => {
            let a = app.autolaunch();
            if a.is_enabled().unwrap_or(false) {
                let _ = a.disable();
            } else {
                let _ = a.enable();
            }
        }
        "check-update" => check_update(&app, true).await,
        "install-update" => install_update(&app).await,
        _ => {}
    }
    app_state_now(&app)
}

/* ---------- pembaruan otomatis (GitHub Releases) ---------- */

async fn check_update(app: &AppHandle, manual: bool) {
    // Saat `tauri dev` tidak ada installer yang bisa diperbarui.
    if cfg!(debug_assertions) {
        if manual {
            notice(app, "upd.portable");
        }
        return;
    }
    let result = match app.updater() {
        Ok(u) => u.check().await,
        Err(e) => Err(e),
    };
    match result {
        Ok(Some(update)) => {
            let v = update.version.clone();
            let state = app.state::<AppState>();
            *state.update.lock().unwrap() = Some(update);
            let mut announced = state.announced.lock().unwrap();
            if manual || announced.as_deref() != Some(v.as_str()) {
                notice(app, &format!("upd.avail|{v}"));
                *announced = Some(v);
            }
        }
        Ok(None) => {
            if manual {
                notice(app, "upd.latest");
            }
        }
        Err(_) => {
            if manual {
                notice(app, "upd.fail");
            }
        }
    }
}

async fn install_update(app: &AppHandle) {
    let update = app.state::<AppState>().update.lock().unwrap().clone();
    let Some(update) = update else { return };
    notice(app, "upd.down");
    // Di Windows pemasang berjalan lalu aplikasi ditutup sendiri.
    match update.download_and_install(|_, _| {}, || {}).await {
        Ok(_) => app.restart(),
        Err(_) => notice(app, "upd.installfail"),
    }
}

fn spawn_update_loop(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        tokio_sleep(15).await;
        loop {
            check_update(&app, false).await;
            tokio_sleep(4 * 60 * 60).await;
        }
    });
}

async fn tokio_sleep(secs: u64) {
    // Tidur di thread terpisah supaya tidak perlu menambah crate tokio hanya untuk timer.
    let (tx, rx) = std::sync::mpsc::channel::<()>();
    thread::spawn(move || {
        thread::sleep(Duration::from_secs(secs));
        let _ = tx.send(());
    });
    let _ = tauri::async_runtime::spawn_blocking(move || {
        let _ = rx.recv();
    })
    .await;
}

/* ---------- tray + start ---------- */

fn create_tray(app: &AppHandle) -> tauri::Result<()> {
    let mut builder = TrayIconBuilder::with_id("kafe-meng").tooltip("Kafe Meng");
    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }
    builder
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { button, button_state, .. } = &event {
                log(tray.app_handle(), &format!("tray klik {:?} {:?}", button, button_state));
                let button = *button;
                if *button_state != MouseButtonState::Up {
                    return;
                }
                let app = tray.app_handle();
                match button {
                    MouseButton::Left => open_panel(app, ""),
                    MouseButton::Right => open_panel(app, "set"),
                    _ => {}
                }
            }
        })
        .build(app)?;
    Ok(())
}

pub fn run() {
    let app = tauri::Builder::default()
        // Plugin ini harus pertama: kalau game sudah jalan, salinan kedua langsung berhenti dan membuka panel.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| open_panel(app, "")))
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new()
            .with_handler(|app, _shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    let _ = app.emit_to("main", "toggle-hud", ());
                }
            })
            .build())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            load_save,
            write_save,
            set_ignore,
            panel_open,
            beat,
            quit,
            app_state,
            app_action
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            place(&handle);
            if let Some(w) = main_window(&handle) {
                let _ = w.set_ignore_cursor_events(true);
                let _ = w.show();
            }
            create_tray(&handle)?;
            // Ctrl+Alt+K menyembunyikan atau menampilkan bar menu kapan saja.
            let _ = handle.global_shortcut().register("ctrl+alt+k");
            spawn_watcher(handle.clone());
            spawn_update_loop(handle);
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("gagal menyiapkan Kafe Meng");

    app.run(|_app, event| {
        // Game ini hidup di tray: jangan berhenti hanya karena tidak ada jendela yang terlihat.
        if let RunEvent::ExitRequested { api, code, .. } = event {
            if code.is_none() {
                api.prevent_exit();
            }
        }
    });
}

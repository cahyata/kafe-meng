# Kafe Meng (Tauri)

Kucing berjalan di atas taskbar Windows. Versi ringan dari proyek Electron, memakai Tauri v2 dan WebView2.

- `src/` : game (HTML, CSS, JavaScript) dan jembatan ke Rust (`tauri-bridge.js`)
- `src-tauri/` : sisi Rust (jendela, tray, simpan, update) dan pengaturan Tauri
- `.github/workflows/release.yml` : workflow GitHub Actions yang membangun dan merilis installer

Perintah: `npm install`, `npm run dev`, `npm run build`.

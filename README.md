# Kafe Meng (Tauri)

Kucing berjalan di atas taskbar Windows. Versi ringan dari proyek Electron, memakai Tauri v2 dan WebView2.

- `src/` : game (HTML, CSS, JavaScript) dan jembatan ke Rust (`tauri-bridge.js`)
- `src-tauri/` : sisi Rust (jendela, tray, simpan, update) dan pengaturan Tauri
- `PANDUAN-TAURI.md` : cara mencoba, membuat kunci update, dan merilis
- `release-workflow.yml` : workflow GitHub Actions (pindahkan ke `.github/workflows/release.yml`)

Perintah: `npm install`, `npm run dev`, `npm run build`.

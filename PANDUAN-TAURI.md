# Kafe Meng versi Tauri (paling ringan)

Ini port dari versi Electron ke **Tauri v2**. Tampilan, game, dan fiturnya sama. Bedanya ada di mesin di bawahnya.

## Soal RAM, jujur saja

- Electron membawa satu mesin Chrome lengkap di dalam game. Tauri memakai **WebView2** yang sudah ada di Windows 10/11, jadi installer dan proses game jauh lebih kecil.
- Perkiraan saya: pemakaian RAM turun **sekitar 40 sampai 60 persen** dan ukuran installer turun jauh (dari sekitar 80 MB ke sekitar 5 sampai 10 MB). Ini perkiraan dari pengalaman umum, **belum saya ukur di PC kamu**.
- Cara mengukur sendiri: buka Task Manager, tab **Details**, jumlahkan kolom Memory dari `Kafe Meng.exe` dan semua `msedgewebview2.exe` yang menjadi anaknya. Task Manager di tab Processes biasanya sudah mengelompokkannya di bawah satu baris "Kafe Meng".
- RAM tidak akan turun ke nol. Game ini tetap sebuah halaman web (WebView2) yang menggambar kucing, dan jendelanya selebar layar. Yang hilang adalah beban Electron, bukan beban halaman webnya.
- Menu klik kanan di tray dibuat hanya saat dibuka lalu dibuang lagi, supaya tidak menambah RAM saat game didiamkan.

## Yang belum teruji (penting)

Kode Rust-nya **lolos pemeriksaan kompilator** (`cargo check` untuk target Windows di tempat saya), dan sisi game (JavaScript) sudah saya uji dengan simulasi. Tapi saya **tidak bisa menjalankan aplikasinya di Windows dari sini**. Jadi bagian berikut belum pernah benar-benar jalan dan bisa butuh perbaikan setelah kamu coba:

- jendela transparan yang menempel di atas taskbar,
- klik tembus dan kucing yang bisa diklik/digeser,
- klik kanan ikon tray langsung membuka tab Pengaturan (sembunyikan kucing, jalan saat Windows mulai, cek update),
- update otomatis (karena butuh rilis sungguhan di GitHub).

Kalau ada yang aneh, kirim ke saya apa yang terlihat dan saya perbaiki.

## Beda dengan versi Electron (dan penggantinya)

| Di Electron | Di Tauri | Dampak |
|---|---|---|
| Klik tembus dengan mode "forward" (jendela tetap tahu posisi mouse) | Tauri tidak punya mode itu. Pengganti: bagian Rust memantau posisi kursor tiap 40 ms (120 ms kalau kursor jauh) dan mengirimnya ke game | Sama saja bagi pemain. Sedikit CPU ekstra, sangat kecil |
| Update diunduh di latar lalu "Mulai ulang untuk vX" | Update ditemukan, kamu diberi tahu, lalu pilih **Perbarui ke vX** di tab Pengaturan. Diunduh lalu game mulai ulang sendiri | Satu klik tambahan, tidak lagi terpasang otomatis saat game ditutup |
| Menu tray = jendela yang selalu ada | Jendela dibuat saat dibuka, dibuang saat ditutup | Muncul sepersekian detik lebih lambat, tapi hemat RAM |
| Jendela tidak bisa fokus (`focusable:false`) | Sama, Tauri punya `focusable: false` | Tidak ada beda |
| Update ditandatangani oleh electron-builder (tanpa kunci) | Update **wajib ditandatangani** dengan kunci milikmu sendiri (gratis, lihat di bawah) | Satu langkah setup tambahan sekali saja |

Yang sama persis: simpan ke `%APPDATA%\Kafe Meng\save.json` (progres Electron langsung terbaca), suara dan tombol mute, pencapaian, bar menu bisa disembunyikan, Ctrl+Alt+K, "Jalan saat Windows mulai", satu salinan saja yang boleh jalan.

## Yang perlu ada di PC kamu (hanya kalau mau build di PC sendiri)

Kalau kamu hanya merilis lewat GitHub Actions (cara di bawah), **PC kamu tidak perlu memasang Rust sama sekali**. Tapi untuk mencoba di PC sebelum rilis:

1. **Node.js**: sudah ada (`D:\node`).
2. **Rust**: unduh `rustup-init.exe` dari https://rustup.rs lalu jalankan, pilih opsi default (1).
3. **Microsoft C++ Build Tools**: unduh dari https://visualstudio.microsoft.com/visual-cpp-build-tools/ , pasang, centang **Desktop development with C++**. Ini unduhan besar (beberapa GB).
4. **WebView2**: sudah ada di Windows 11 dan Windows 10 yang terbaru. Kalau belum: https://developer.microsoft.com/microsoft-edge/webview2/
5. Tutup lalu buka PowerShell baru, cek: `rustc --version` dan `cargo --version`.

## Mencoba di PC

Dari folder proyek (`D:\CLAUDE OKEGAS\kafemeng-tauri`):

```
npm install
npm run dev
```

Pertama kali, Rust mengompilasi banyak paket, jadi bisa sekitar 5 sampai 10 menit. Berikutnya cepat. Tutup versi Electron dulu, karena keduanya memakai save yang sama.

Suara kucing: jalankan sekali `powershell -ExecutionPolicy Bypass -File .\download-sounds.ps1` (file suara masuk ke `src\sounds`). Tanpa itu game memakai suara sintetis.

## Kunci tanda tangan update (gratis, sekali saja)

Update otomatis Tauri hanya mau memasang file yang ditandatangani. Kuncinya kamu buat sendiri, tidak bayar apa pun, dan tidak ada hubungannya dengan sertifikat Windows.

1. Buat kunci (ketik sandi yang kamu ingat saat diminta):

   ```
   npx tauri signer generate -w "$env:USERPROFILE\.tauri\kafe-meng.key"
   ```

   Hasilnya dua file: `kafe-meng.key` (rahasia, **jangan dibagikan dan jangan di-commit**) dan `kafe-meng.key.pub` (kunci publik).
2. Buka `kafe-meng.key.pub` dengan Notepad, salin isinya (satu baris panjang), lalu tempel di `src-tauri\tauri.conf.json` menggantikan nilai `"pubkey"`. **Wajib diganti.** Nilai yang ada sekarang hanya penutup tempat supaya aplikasi bisa dibuka, dan tidak punya pasangan kunci rahasia, jadi update tidak akan bisa terpasang sebelum kamu menggantinya.
3. Di GitHub repo `cahyata/kafe-meng`: **Settings, Secrets and variables, Actions, New repository secret**. Buat dua secret:
   - `TAURI_SIGNING_PRIVATE_KEY`: isi seluruh file `kafe-meng.key` (buka dengan Notepad, salin semua).
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: sandi yang tadi kamu ketik.
4. Simpan cadangan `kafe-meng.key` dan sandinya di tempat aman. **Kalau hilang, pemain lama tidak bisa menerima update lagi** dan harus memasang ulang dari awal.

Untuk `npm run build` di PC sendiri, kunci rahasia harus dikenali dulu:

```
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content "$env:USERPROFILE\.tauri\kafe-meng.key" -Raw
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "sandimu"
npm run build
```

Installer ada di `src-tauri\target\release\bundle\nsis\`.

## Merilis lewat GitHub

1. Pindahkan file workflow ke tempatnya (sekali saja):

   ```
   cd "D:\CLAUDE OKEGAS\kafemeng-tauri"
   New-Item -ItemType Directory -Force .github\workflows
   Move-Item release-workflow.yml .github\workflows\release.yml
   ```

2. Kode Tauri dikirim ke repo `cahyata/kafe-meng` yang sama dengan Electron (satu halaman Releases dan satu alamat update), tapi lewat **cabang baru bernama `tauri`**. Dengan begitu kode Electron di cabang `main` tidak tersentuh dan tidak perlu `--force`. Rilis dibuat dari **tag**, bukan dari cabang, jadi halaman Releases tetap rapi.
3. **Lakukan ini hanya setelah jembatan Electron 1.0.2 dirilis dan pemain sempat memperbarui** (lihat `PANDUAN-JEMBATAN.md` di folder Electron). Dari folder `D:\CLAUDE OKEGAS\kafemeng-tauri`:

   ```
   git init
   git add .
   git commit -m "Kafe Meng versi Tauri 2.0.0"
   git branch -M tauri
   git remote add origin https://github.com/cahyata/kafe-meng.git
   git push -u origin tauri
   git tag v2.0.0
   git push origin v2.0.0
   ```

   `version` di `src-tauri\tauri.conf.json` (sekarang `2.0.0`) harus sama dengan tag, kalau beda build berhenti dengan pesan jelas.
4. Setelah Actions selesai (build pertama bisa 10 sampai 15 menit), halaman Releases berisi installer `Kafe.Meng_2.0.0_x64-setup.exe` dan file `latest.json`. File `latest.json` itulah yang dibaca aplikasi untuk update.
5. Rilis berikutnya: naikkan `version` di tiga tempat (`tauri.conf.json`, `package.json`, `src-tauri\Cargo.toml`), lalu `git add .`, `git commit`, `git push`, dan tag baru (misalnya `v2.0.1`). Hanya `tauri.conf.json` yang diperiksa workflow, tapi yang lain sebaiknya ikut dirapikan.

## Peringatan Windows saat dipasang

Installer belum bertanda tangan sertifikat Windows (itu berbayar), jadi Windows SmartScreen akan bilang "Unknown publisher". Klik **More info** lalu **Run anyway**. Ini normal untuk aplikasi gratisan dan tidak ada hubungannya dengan tanda tangan update di atas.

## Pindah dari Electron

1. Tutup Kafe Meng versi Electron (klik kanan tray, Keluar).
2. Matikan "Jalan saat Windows mulai" di menu klik kanan tray versi Electron.
3. Windows Settings, Apps, cari **Kafe Meng**, Uninstall. Progres tidak hilang karena ada di `%APPDATA%\Kafe Meng\save.json`.
4. Pasang installer Tauri. Progres langsung terbaca.

**Kenapa harus dihapus dulu, bukan ditimpa:** installer Tauri berdiri sendiri sebagai aplikasi kedua (ID aplikasinya beda dari Electron), jadi tidak otomatis menimpa. Karena namanya sama-sama "Kafe Meng", pintasan Desktop dan Start Menu-nya bernama sama. Kalau Electron dihapus *sesudah* Tauri dipasang, pintasan Tauri ikut terhapus. Kalau keduanya jalan bersamaan, mereka berebut menulis `save.json` yang sama. Urutan aman: hapus Electron, baru pasang Tauri.

Folder Electron (`kafemeong`) tidak diubah oleh port ini, jadi masih bisa dipakai sebagai cadangan.

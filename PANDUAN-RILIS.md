# Panduan rilis dan update otomatis (gratis)

Cara kerjanya:

1. Kode game disimpan di GitHub (repo **publik**).
2. Setiap kali kamu membuat "tag versi" (misalnya `v1.0.1`), GitHub Actions membangun installer .exe secara otomatis dan mengunggahnya ke halaman **Releases**.
3. Orang lain mengunduh installer dari halaman Releases. Aplikasi yang sudah terpasang memeriksa Releases itu sendiri, mengunduh versi baru di latar belakang, lalu memasangnya saat dimulai ulang.

Biayanya nol: repo publik, GitHub Actions, dan Releases gratis di GitHub.

## Langkah satu kali (setup)

1. **Akun GitHub.** Pakai akun yang sudah ada.
2. **Buat repo baru** di https://github.com/new
   - Nama: `kafe-meong`
   - Pilih **Public**
   - Jangan centang README, .gitignore, atau license (repo harus kosong).
3. **Cek `package.json`** di bagian `build.publish`: `owner` harus nama akun GitHub kamu dan `repo` harus nama repo yang barusan dibuat. Sekarang isinya `cahyata` dan `kafe-meong`. Kalau beda, ubah.
4. **Pasang Git** kalau belum ada: https://git-scm.com/download/win (Next terus sampai selesai). Tutup lalu buka PowerShell baru, cek dengan `git --version`.
5. **Pasang file workflow.** Folder `.github` tidak bisa ditulis otomatis dari sini, jadi pindahkan sendiri file `release-workflow.yml` ke tempatnya (sekali saja):

   ```
   cd "D:\CLAUDE OKEGAS\kafemeong"
   New-Item -ItemType Directory -Force .github\workflows
   Move-Item release-workflow.yml .github\workflows\release.yml
   ```

6. **Dorong kode ke GitHub.** Di PowerShell, dari folder proyek:

   ```
   cd "D:\CLAUDE OKEGAS\kafemeong"
   git init
   git add .
   git commit -m "Versi pertama"
   git branch -M main
   git remote add origin https://github.com/cahyata/kafe-meong.git
   git push -u origin main
   ```

   Saat `git push`, jendela browser akan meminta kamu masuk ke GitHub. Ikuti saja.
7. **Cek izin Actions** (hanya kalau build nanti gagal karena izin): di repo buka Settings, Actions, General, lalu bagian "Workflow permissions" pilih **Read and write permissions** dan Save.

## Setiap kali mau merilis versi baru

1. Ubah `"version"` di `package.json` (misalnya dari `1.0.0` ke `1.0.1`).
2. Jalankan:

   ```
   git add .
   git commit -m "Versi 1.0.1"
   git push
   git tag v1.0.1
   git push origin v1.0.1
   ```

   Angka di tag harus sama dengan `version` di `package.json`. Kalau beda, build berhenti dengan pesan jelas.
3. Buka tab **Actions** di repo untuk melihat build berjalan (sekitar 3 sampai 6 menit).
4. Setelah selesai, tab **Releases** berisi `Kafe-Meng-Setup-1.0.1.exe`. Kirim link halaman Releases itu ke siapa pun yang mau main.

Pemain yang sudah memasang versi lama akan mendapat notifikasi "Versi baru ditemukan" di dalam game, versi baru diunduh sendiri, lalu muncul pilihan **Mulai ulang untuk vX** di menu klik kanan ikon tray. Kalau mereka tidak memilihnya, update terpasang otomatis saat game ditutup. Menu tray juga punya **Cek pembaruan** untuk memeriksa manual. Pengecekan otomatis berjalan 15 detik setelah game dibuka dan tiap 4 jam.

## Peringatan SmartScreen ("Unknown publisher")

Tanpa sertifikat code signing berbayar, saat pemain pertama kali menjalankan installer Windows menampilkan layar biru **"Windows protected your PC"**. Itu normal untuk aplikasi kecil yang belum dikenal dan bukan berarti file berbahaya. Cara melewatinya:

1. Klik **More info** (Info lebih lanjut).
2. Klik **Run anyway** (Tetap jalankan).

Hal-hal yang perlu diketahui:
- Peringatan biasanya berkurang sendiri setelah banyak orang mengunduh dan memasangnya, tapi tidak ada jaminan kapan.
- Antivirus kadang salah menandai aplikasi baru. Kalau terjadi, kirim file ke https://www.virustotal.com untuk membuktikan aman.
- Sertifikat code signing yang menghilangkan peringatan itu berbayar. Ada program tanda tangan gratis untuk proyek open source (misalnya SignPath Foundation), tapi harus mendaftar dan disetujui dulu, jadi tidak otomatis.
- Update otomatis tetap berjalan tanpa peringatan tambahan setelah game terpasang.

## Catatan penting

- **Repo harus publik.** Update otomatis tanpa token hanya jalan dari repo publik. Artinya kode game bisa dilihat siapa saja. Kalau mau mengatur izin pemakaian kode, tambahkan file LICENSE di repo (untuk saat ini `package.json` memakai `UNLICENSED`, artinya semua hak dipegang pemilik).
- **Update otomatis hanya untuk installer** (`Kafe-Meng-Setup-...exe`). Versi portable tidak bisa memperbarui diri, jadi workflow ini tidak membuatnya. Saat main dari `npm start`, fitur update sengaja nonaktif.
- **Jangan menaruh token atau password** di repo publik. Workflow memakai `GITHUB_TOKEN` bawaan GitHub, jadi kamu tidak perlu membuat token apa pun.
- Folder `renderer\sounds` (suara kucing) ikut terunggah ke repo kalau sudah kamu unduh. Semua suaranya berlisensi CC0, jadi aman dibagikan.
- Progres pemain tersimpan di folder data pengguna masing-masing (`%APPDATA%\Kafe Meng\save.json`) dan tidak hilang saat update. Save dari nama lama ("Kafe Meong") disalin otomatis ke folder ini saat pertama dijalankan. Save dari versi dengan nama lama disalin otomatis ke folder ini saat pertama dijalankan.

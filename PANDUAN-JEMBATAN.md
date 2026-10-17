# Rilis jembatan: Electron 1.0.2 mengantar pemain ke versi Tauri

Pemain yang sudah memasang versi Electron tidak bisa langsung "diupdate" menjadi Tauri, karena mesinnya beda. Jadi dibuat satu rilis Electron terakhir (**1.0.2**) yang tugasnya hanya mengajak mereka mengunduh versi Tauri. Semua fitur lain tetap sama.

## Yang dilakukan versi 1.0.2

- Saat game berjalan, 25 detik setelah dibuka (lalu tiap 6 jam), game memeriksa apakah rilis terbaru di https://github.com/cahyata/kafe-meng/releases/latest sudah berisi versi Tauri (ditandai adanya file `latest.json`).
- Kalau sudah ada, muncul kartu kecil di dekat bar menu: **"Ada versi baru yang lebih ringan"** dengan tombol **Unduh versi ringan** (membuka halaman Releases terbaru di browser, jadi tidak perlu nama file pasti) dan **Nanti**.
- Dua tombol itu sama-sama menunda kartu 3 hari supaya tidak mengganggu. Ajakannya juga ada di menu klik kanan tray: **Unduh versi lebih ringan**.
- Kalau versi Tauri belum dirilis, kartu tidak muncul sama sekali. Progres disimpan seperti biasa.

## Urutan rilis (penting)

1. **Jembatan dulu (v1.0.2).** Pemain Electron lama menerima update otomatis ke 1.0.2.
2. **Tunggu beberapa hari** sampai teman-temanmu sempat membuka game (mereka harus membuka game supaya update 1.0.2 terpasang).
3. **Baru rilis Tauri (v2.0.0).** Setelah ini, rilis "terbaru" di GitHub adalah versi Tauri, dan kartu muncul di semua pemain yang sudah di 1.0.2.

Kenapa tidak dibalik: begitu Tauri menjadi rilis terbaru, aplikasi Electron tidak menemukan file update Electron lagi, jadi pemain yang belum sempat ke 1.0.2 tidak akan pernah mendapat ajakannya. Angka 2.0.0 dipilih supaya jelas ini generasi baru.

## Perintah rilis jembatan

Dari folder `D:\CLAUDE OKEGAS\kafemeong`:

```
git add .
git commit -m "Versi 1.0.2: ajakan pindah ke versi ringan"
git push
git tag v1.0.2
git push origin v1.0.2
```

Lalu pantau tab Actions di repo. Setelah selesai, Releases berisi `Kafe-Meng-Setup-1.0.2.exe`. Versi di `package.json` sudah `1.0.2`, cocok dengan tagnya.

Untuk mencoba kartunya sebelum ada rilis Tauri, kamu bisa sementara mengubah `LIGHT_MANIFEST` di `main.js` ke alamat file JSON mana pun yang berisi `{"version":"2.0.0"}`, jalankan `npm start`, lalu kembalikan lagi.

Rilis Tauri sendiri dijelaskan di `PANDUAN-TAURI.md` di folder kafemeng-tauri.

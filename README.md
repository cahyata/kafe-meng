# Kafe Meng untuk Windows (versi taskbar)

Kucing-kucing berjalan di atas taskbar Windows. Belai atau beri ikan untuk dapat koin, lalu upgrade kafe lewat tombol **Kafe** di pojok kanan bawah. Jendela transparan, selalu di atas, dan klik tembus ke desktop kecuali pada kucing dan tombol.

## Cara build .exe (harus di PC Windows)

1. Pasang Node.js LTS dari https://nodejs.org (sekali saja).
2. Buka PowerShell di folder ini, lalu jalankan:

   ```
   npm install
   npm run build
   ```

3. Hasilnya ada di folder `dist\`:
   - `Kafe Meng Setup 1.0.0.exe`: installer.
   - `Kafe Meng 1.0.0.exe`: versi portable, tanpa instalasi.

Untuk mencoba tanpa build: `npm install` lalu `npm start`.

## Cara main

- Arahkan kursor ke kucing, muncul gelembung dengan tombol **Belai** dan **Ikan**. Mengeklik kucingnya langsung juga membelai.
- Kucing yang sudah senang memberi tip lalu pergi. Tamu baru datang dari tepi layar.
- Ikon di system tray (dekat jam): klik untuk membuka toko, klik kanan untuk menyembunyikan kucing, menyalakan "Jalan saat Windows mulai", atau keluar.
- Progres tersimpan otomatis. Pelayan Mimi tetap mengumpulkan koin saat aplikasi mati (maksimal 1 jam).

## Catatan

- Jendela mengikuti area kerja monitor utama, tepat di atas taskbar. Kalau taskbar disembunyikan otomatis, kucing berjalan di tepi bawah layar.
- Windows SmartScreen bisa memperingatkan karena .exe belum ditandatangani. Pilih "More info" lalu "Run anyway".
- Kode game ada di `renderer/game.js`, tampilan di `renderer/style.css`, jendela dan tray di `main.js`.

## Suara kucing asli

Game memutar suara CC0 dari OpenGameArt kalau file ada di `renderer\sounds`, dan memakai suara sintetis kalau tidak ada. Untuk mengunduhnya, jalankan sekali di folder proyek:

```
powershell -ExecutionPolicy Bypass -File .\download-sounds.ps1
```

Kucing juga bisa digeser: tahan klik pada kucing lalu seret ke kiri atau kanan di taskbar.

## Pencapaian dan bar menu

- Tab **Pencapaian** di panel Kafe berisi 18 milestone dengan hadiah koin.
- Bar menu di pojok kanan bawah bisa disembunyikan: tombol **Sembunyikan bar** di panel, menu klik kanan tray, atau pintasan **Ctrl+Alt+K**. Saat disembunyikan, tinggal tombol kecil `<` di pojok; klik untuk memunculkannya lagi.

## Rilis untuk orang lain

Lihat `PANDUAN-RILIS.md` untuk cara membagikan game dengan update otomatis lewat GitHub Releases (gratis).

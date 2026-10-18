# Kafe Meng

Kafe kucing santai yang hidup di atas taskbar Windows kamu. Kucing-kucing lucu mampir, jalan-jalan, dan menunggu dibelai. Kamu jadi bos kafenya, tanpa timer yang memburu dan tanpa kalah.

<!-- Ganti dengan screenshot atau GIF asli, misalnya taruh di folder docs/ -->
<img width="2558" height="273" alt="image" src="https://github.com/user-attachments/assets/39f15a09-bd51-448e-a790-606f6eba4122" />


<img width="371" height="486" alt="image" src="https://github.com/user-attachments/assets/177fb36f-4442-4fc9-a353-e26fa46faa0f" />


## Download dan install

1. Buka halaman [Releases](https://github.com/cahyata/kafe-meng/releases/latest).
2. Download file `Kafe.Meng_<versi>_x64-setup.exe` dari bagian **Assets**.
3. Jalankan file itu. Tidak perlu admin, aplikasi ter-install hanya untuk akunmu.
4. Setelah selesai, kafe langsung terbuka dan ikon kucing muncul di tray (pojok kanan bawah, dekat jam).

**Windows bilang "Unknown publisher" atau "Windows protected your PC"?** Itu normal. Installer belum memakai sertifikat (code signing) berbayar dari Microsoft. Klik **More info**, lalu **Run anyway**.

Kebutuhan: Windows 10 atau 11 (64-bit) dengan WebView2. WebView2 sudah ada di Windows 11 dan hampir semua Windows 10 yang terbaru, kalau belum Windows akan menawarkan meng-install-nya.

Uninstall: Windows Settings, Apps, cari **Kafe Meng**, lalu Uninstall. Progres permainanmu tidak ikut terhapus (lihat [Lokasi save](#lokasi-save)).

## Fitur

- 17 jenis kucing dengan peluang muncul berbeda, dari Kucing Oren sampai yang super langka. Ada tamu yang hanya muncul pada waktu tertentu.
- Belai kucing untuk dapat koin, atau beri ikan untuk tip yang lebih besar. Tamu yang senang pulang dengan melompat, tamu yang dicuekin pulang sendiri tanpa denda.
- Enam upgrade: jatah tamu, belaian lembut, ikan premium, dapur ikan, dekorasi, dan Pelayan Mimi yang membelai kucing otomatis (bisa dimatikan kapan saja).
- Puluhan pencapaian dengan hadiah koin, dari yang gampang sampai yang butuh berminggu-minggu, dan Buku Kucing untuk mengoleksi semua jenis.
- Beberapa rahasia tersembunyi. Selamat mencari!
- Kucing bisa diseret, bahkan diangkat ke atas lalu dilepas. Dia akan jatuh dan mengeluh.
- Tombol kafe berbentuk gambar kucing yang bisa dipindah ke mana saja di layar, dan tinggi panel bisa diatur dengan menarik garisnya.
- Pengaturan: volume dan senyap, tema terang atau gelap atau otomatis, ukuran tampilan, bahasa Indonesia atau English, ulang panduan, dan mulai dari awal.
- Ringan: dibuat dengan Tauri (Rust dan WebView2), jadi tidak membawa mesin browser sendiri seperti Electron. Angka pemakaian RAM-nya belum diukur secara resmi.
- Auto-start saat Windows menyala (opsional) dan hanya satu instance yang bisa berjalan sekaligus.

## Cara main

1. **Layani tamu.** Arahkan kursor ke kucing, lalu pilih **Belai** (dapat koin) atau **Ikan** (tip lebih besar, memakai stok ikan). Klik langsung pada kucing juga membelai.
2. **Buka kafe.** Klik gambar kucing di pojok layar untuk membuka panel. Klik lagi atau klik di luar panel untuk menutup. Tombolnya bisa diseret ke posisi yang kamu suka.
3. **Belanja.** Koin dipakai untuk beli ikan dan upgrade. Ikan terisi pelan-pelan, dapur ikan membuatnya lebih cepat.
4. **Kejar pencapaian** di tab Pencapaian, dan lihat koleksi kucingmu di tab Kafe.
5. **Pengunjung pertama kali** otomatis mendapat panduan singkat dengan sorotan ke tiap tombol. Panduan itu bisa dibuka lagi dari **Pengaturan, Panduan**.

Pintasan dan tray:

| Aksi | Hasil |
|---|---|
| Klik kiri ikon tray | Buka kafe |
| Klik kanan ikon tray | Buka kafe di tab Pengaturan (sembunyikan kucing, jalan saat Windows mulai, cek update) |
| `Ctrl` + `Alt` + `K` | Sembunyikan atau tampilkan tombol kucing di pojok |
| Tombol **Keluar** di tab Kafe | Tutup game |

Kalau kamu menutup game, tamu yang sedang ada tetap tersimpan. Saat kamu kembali, Pelayan Mimi (kalau sudah dipekerjakan) ikut mengumpulkan sedikit koin selama kamu pergi, maksimal setara satu jam kerja.

## Update otomatis

Kafe Meng mengecek update di GitHub Releases sekitar 15 detik setelah dibuka, lalu tiap beberapa jam.

- Kalau ada versi baru, muncul notifikasi di dalam game.
- Buka **Pengaturan** (klik kanan ikon tray), lalu di baris **Pembaruan** tekan **Perbarui ke vX**. Update di-download, lalu game restart sendiri. Progresmu aman.
- Mau cek manual? Tombol **Cek** di baris yang sama.
- Update ditandatangani dengan signing key milik pembuat, jadi aplikasi menolak file yang bukan dari release resmi.
- Update otomatis hanya bekerja di versi yang ter-install lewat installer, bukan saat dijalankan dari source code.

## Lokasi save

Progres tersimpan otomatis di:

```
%APPDATA%\Kafe Meng\save.json
```

Copy file itu untuk backup atau memindahkan progres ke komputer lain. Di folder yang sama ada `debug.log` untuk mencari masalah. Pengaturan **Mulai dari awal** menghapus progres tetapi mempertahankan setelan suara, tema, ukuran, dan bahasa.

## Untuk pengembang

- `src/`: game (HTML, CSS, JavaScript) dan jembatan ke Rust (`tauri-bridge.js`)
- `src-tauri/`: sisi Rust (window, tray, save, update) dan konfigurasi Tauri
- `.github/workflows/release.yml`: build dan release installer saat tag `v*` di-push

Perintah: `npm install`, `npm run dev`, `npm run build`.

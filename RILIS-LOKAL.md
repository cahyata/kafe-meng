# Compile .exe di PC sendiri lalu rilis ke GitHub

Ringkasnya: build di PC menghasilkan installer dan file tanda tangan (`.sig`), tapi **tidak** membuat `latest.json`. File itu yang dibaca aplikasi untuk update, jadi dibuat dengan skrip `buat-rilis-lokal.ps1`, lalu semuanya diunggah manual di web GitHub.

Aturan urutan: rilis Tauri pertama (v2.0.0) baru boleh jadi "Latest" **setelah** jembatan Electron 1.0.2 dirilis dan pemain sempat memperbarui (lihat `PANDUAN-TAURI.md`). Kalau tidak, update otomatis Electron berhenti bekerja.

## 1. Buat kunci update (sekali saja)

```
npx tauri signer generate -w "$env:USERPROFILE\.tauri\kafe-meng.key"
```

Ketik sandi yang kamu ingat. Hasilnya dua file di `C:\Users\<kamu>\.tauri\`:

- `kafe-meng.key` rahasia. Jangan dibagikan, jangan di-commit. Simpan cadangannya bersama sandi. Kalau hilang, pemain lama tidak bisa menerima update lagi.
- `kafe-meng.key.pub` kunci publik. Buka dengan Notepad, salin satu baris isinya, tempel di `src-tauri\tauri.conf.json` menggantikan nilai `"pubkey"`. Wajib diganti sebelum build rilis pertama, nilai bawaan hanya penutup tempat.

## 2. Build di PC

Naikkan versi dulu (lihat bagian 3), lalu dari folder `D:\CLAUDE OKEGAS\kafemeng-tauri`:

```
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content "$env:USERPROFILE\.tauri\kafe-meng.key" -Raw
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "sandimu"
npm run build
```

Hasilnya di `src-tauri\target\release\bundle\nsis\`:

- `Kafe Meng_2.0.1_x64-setup.exe` installer
- `Kafe Meng_2.0.1_x64-setup.exe.sig` tanda tangan update

Lalu buat folder siap unggah (membuat `latest.json` dan menyalin installer dengan nama tanpa spasi):

```
.\buat-rilis-lokal.ps1 -Version 2.0.1 -Notes "Apa yang baru"
```

Hasilnya folder `rilis-v2.0.1\` berisi `Kafe.Meng_2.0.1_x64-setup.exe` dan `latest.json`.

## 3. Unggah ke GitHub Releases (manual di web)

Nomor versi dinaikkan di tiga tempat, harus sama: `src-tauri\tauri.conf.json` (`version`), `package.json`, dan `src-tauri\Cargo.toml`. Versi baru harus lebih besar dari yang terpasang di pemain.

Di `https://github.com/cahyata/kafe-meng/releases`:

1. **Draft a new release**.
2. **Choose a tag**: ketik `v2.0.1` (awalan `v` plus versi persis) lalu **Create new tag on publish**.
3. Judul bebas, misalnya `Kafe Meng v2.0.1`.
4. Seret **dua file** dari `rilis-v2.0.1\`: `Kafe.Meng_2.0.1_x64-setup.exe` dan `latest.json`. File `.sig` tidak perlu diunggah, isinya sudah ada di dalam `latest.json`.
5. Biarkan **Set as the latest release** tercentang dan jangan centang pre-release atau draft. Aplikasi membaca `.../releases/latest/download/latest.json`, jadi rilis harus berstatus Latest.
6. **Publish release**.

## 4. Cek bahwa update ditemukan

1. Buka di browser: `https://github.com/cahyata/kafe-meng/releases/latest/download/latest.json`. Harus tampil JSON dengan versi baru. Kalau 404, rilisnya masih draft atau bukan Latest.
2. Pakai app yang **terpasang dari installer** versi lama (bukan `npm run dev`, mode dev sengaja melewati update). Dalam sekitar 15 detik setelah dibuka, muncul pemberitahuan "Versi 2.0.1 tersedia". Atau klik kanan ikon tray, tab Pengaturan, baris Pembaruan, tombol **Cek**.
3. Tombol **Perbarui ke v2.0.1** muncul di baris itu. Klik, installer diunduh dan game mulai ulang sendiri.
4. Kalau gagal "Gagal memeriksa": cek isi `latest.json` (url harus persis nama file yang diunggah) dan pastikan `pubkey` di aplikasi lama pasangan dari kunci yang dipakai menandatangani.

## Bandingkan dengan GitHub Actions

| | Lokal | GitHub Actions |
|---|---|---|
| Persiapan | Kunci di PC | Kunci + dua secret di repo, file workflow dipindah |
| Tiap rilis | build, skrip, unggah manual | push tag, selesai sendiri (10 sampai 15 menit) |
| `latest.json` | dibuat dengan skrip | otomatis |
| Risiko salah | nama file tidak cocok, lupa Latest | kecil, ada pengecekan tag sama versi |

Saran: Actions lebih mudah untuk rilis rutin. Build lokal bagus untuk mencoba installer sebelum rilis.

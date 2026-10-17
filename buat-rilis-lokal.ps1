# Menyiapkan folder rilis dari hasil `npm run build`: installer (nama tanpa spasi) dan latest.json.
# Pakai dari folder kafemeng-tauri:  .\buat-rilis-lokal.ps1 -Version 2.0.1 -Notes "Perbaikan kecil"
param(
  [Parameter(Mandatory = $true)][string]$Version,
  [string]$Notes = "Pembaruan Kafe Meng",
  [string]$Repo = "cahyata/kafe-meng"
)
$ErrorActionPreference = "Stop"
$dir = Join-Path $PSScriptRoot "src-tauri\target\release\bundle\nsis"
$exe = Get-ChildItem $dir -Filter "*_${Version}_x64-setup.exe" | Select-Object -First 1
if (-not $exe) { throw "Installer versi $Version tidak ditemukan di $dir. Sudah naikkan versi dan menjalankan npm run build?" }
$sigFile = "$($exe.FullName).sig"
if (-not (Test-Path $sigFile)) { throw "File .sig tidak ada. Set TAURI_SIGNING_PRIVATE_KEY dulu lalu build ulang." }

# GitHub mengganti spasi pada nama file menjadi titik, jadi namanya dibuat tanpa spasi sejak awal supaya alamat di latest.json pasti cocok.
$name = "Kafe.Meng_${Version}_x64-setup.exe"
$out = Join-Path $PSScriptRoot "rilis-v$Version"
New-Item -ItemType Directory -Force $out | Out-Null
Copy-Item $exe.FullName (Join-Path $out $name) -Force

$json = [ordered]@{
  version   = $Version
  notes     = $Notes
  pub_date  = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  platforms = [ordered]@{
    "windows-x86_64" = [ordered]@{
      signature = (Get-Content $sigFile -Raw).Trim()
      url       = "https://github.com/$Repo/releases/download/v$Version/$name"
    }
  }
} | ConvertTo-Json -Depth 5
[IO.File]::WriteAllText((Join-Path $out "latest.json"), $json, (New-Object Text.UTF8Encoding($false)))
Write-Host "Selesai. Unggah dua file di folder ini ke GitHub Releases dengan tag v${Version}:"
Get-ChildItem $out | ForEach-Object { Write-Host "  $($_.Name)" }

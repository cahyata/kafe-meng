# Mengunduh suara kucing CC0 dari OpenGameArt ke src\sounds. Jalankan sekali dari folder proyek:
#   powershell -ExecutionPolicy Bypass -File .\download-sounds.ps1
$dir = Join-Path $PSScriptRoot "src\sounds"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$files = @(
  "kitten_mew-1_0.ogg",   # Kitten Mew oleh AntumDeluge (CC0)
  "Meow.ogg",             # Meow oleh IgnasD (CC0)
  "cat_softmew.wav",      # Cat purr meow oleh Kerzoven (CC0)
  "cat_mewfood.wav",
  "cat_mewpurr.wav",
  "cat_mewpurr2.wav"
)
foreach ($f in $files) {
  try {
    Invoke-WebRequest -Uri "https://opengameart.org/sites/default/files/$f" -OutFile (Join-Path $dir $f) -UseBasicParsing
    Write-Host "OK  $f"
  } catch {
    Write-Host "GAGAL  $f  ($($_.Exception.Message))"
  }
}
Write-Host "Selesai. Jalankan ulang aplikasi (npm run dev) untuk mendengar suara baru."

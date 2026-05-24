Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\Perdorues\.gemini\antigravity\brain\86d14432-ba42-4af1-80c1-4dd8afe44c04\vektra_logo_concept_3_1779649354086.png"
$img = [System.Drawing.Image]::FromFile($sourcePath)

$bmp192 = New-Object System.Drawing.Bitmap(192, 192)
$g192 = [System.Drawing.Graphics]::FromImage($bmp192)
$g192.DrawImage($img, 0, 0, 192, 192)
$bmp192.Save("c:\Users\Perdorues\auto-web-parts\public\icons\icon-192x192.png", [System.Drawing.Imaging.ImageFormat]::Png)

$bmp512 = New-Object System.Drawing.Bitmap(512, 512)
$g512 = [System.Drawing.Graphics]::FromImage($bmp512)
$g512.DrawImage($img, 0, 0, 512, 512)
$bmp512.Save("c:\Users\Perdorues\auto-web-parts\public\icons\icon-512x512.png", [System.Drawing.Imaging.ImageFormat]::Png)

$img.Dispose()
$g192.Dispose()
$bmp192.Dispose()
$g512.Dispose()
$bmp512.Dispose()

Add-Type -AssemblyName System.Drawing
$bmp1 = New-Object System.Drawing.Bitmap(192, 192)
$g1 = [System.Drawing.Graphics]::FromImage($bmp1)
$g1.Clear([System.Drawing.Color]::Blue)
$bmp1.Save("c:\Users\Perdorues\auto-web-parts\public\icons\icon-192x192.png", [System.Drawing.Imaging.ImageFormat]::Png)

$bmp2 = New-Object System.Drawing.Bitmap(512, 512)
$g2 = [System.Drawing.Graphics]::FromImage($bmp2)
$g2.Clear([System.Drawing.Color]::Blue)
$bmp2.Save("c:\Users\Perdorues\auto-web-parts\public\icons\icon-512x512.png", [System.Drawing.Imaging.ImageFormat]::Png)

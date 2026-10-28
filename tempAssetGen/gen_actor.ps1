Add-Type -AssemblyName System.Drawing
$out=Join-Path (Get-Location) 'Assets/Actor'
New-Item -ItemType Directory -Force -Path $out | Out-Null
foreach($pose in @('neutral','listening','rattled','broken')) {
  $bmp=New-Object System.Drawing.Bitmap 512,1024
  $g=[System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)
  $paper=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(235,255,240,214))
  $ink=New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255,87,75,67)),5
  $fine=New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(210,87,75,67)),3
  $rim=New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255,255,240,214)),7
  $points=[System.Drawing.PointF[]]@((New-Object System.Drawing.PointF 207,285),(New-Object System.Drawing.PointF 305,285),(New-Object System.Drawing.PointF 321,344),(New-Object System.Drawing.PointF 414,385),(New-Object System.Drawing.PointF 455,560),(New-Object System.Drawing.PointF 391,635),(New-Object System.Drawing.PointF 379,960),(New-Object System.Drawing.PointF 133,960),(New-Object System.Drawing.PointF 121,635),(New-Object System.Drawing.PointF 57,560),(New-Object System.Drawing.PointF 98,385),(New-Object System.Drawing.PointF 191,344))
  $g.FillPolygon($paper,$points);$g.DrawPolygon($rim,$points);$g.DrawPolygon($ink,$points)
  $g.FillEllipse($paper,161,91,190,243);$g.DrawEllipse($ink,161,91,190,243)
  # Swept hair, lapels and seam lines: authored placeholder theatre illustration.
  $g.DrawBezier($ink,164,202,120,53,321,24,348,163)
  $g.DrawBezier($ink,163,180,219,176,220,92,327,103)
  $g.DrawBezier($fine,165,151,221,122,234,74,307,92)
  $g.DrawBezier($ink,341,155,384,223,350,282,319,303)
  $g.DrawLines($ink,[System.Drawing.PointF[]]@((New-Object System.Drawing.PointF 191,344),(New-Object System.Drawing.PointF 257,425),(New-Object System.Drawing.PointF 154,407),(New-Object System.Drawing.PointF 223,513),(New-Object System.Drawing.PointF 256,810)))
  $g.DrawLines($ink,[System.Drawing.PointF[]]@((New-Object System.Drawing.PointF 321,344),(New-Object System.Drawing.PointF 257,425),(New-Object System.Drawing.PointF 358,407),(New-Object System.Drawing.PointF 289,513),(New-Object System.Drawing.PointF 256,810)))
  $g.DrawLine($fine,153,583,135,902);$g.DrawLine($fine,359,583,377,902)
  $g.DrawEllipse($ink,312,434,25,25)
  $eyeY=207;$browY=188
  if($pose -eq 'rattled'){$eyeY=211;$browY=183}
  if($pose -eq 'broken'){$eyeY=222;$browY=201}
  $g.DrawArc($ink,193,$eyeY,39,14,180,170);$g.DrawArc($ink,278,$eyeY,39,14,180,170)
  $g.DrawLine($fine,193,$browY,229,($browY+4));$g.DrawLine($fine,282,($browY+4),318,$browY)
  $g.DrawLines($fine,[System.Drawing.PointF[]]@((New-Object System.Drawing.PointF 259,219),(New-Object System.Drawing.PointF 246,253),(New-Object System.Drawing.PointF 266,255)))
  $g.DrawArc($ink,232,270,49,14,0,160)
  if($pose -eq 'listening'){$g.DrawBezier($ink,115,562,182,504,196,380,225,304);$g.DrawLine($fine,225,304,238,283)}
  elseif($pose -eq 'rattled'){$g.DrawBezier($ink,118,560,224,546,296,475,324,449);$g.DrawLine($fine,324,449,340,434)}
  elseif($pose -eq 'broken'){$g.DrawBezier($ink,119,556,211,604,294,613,390,556);$g.DrawArc($fine,211,553,80,40,0,160)}
  else{$g.DrawBezier($ink,118,556,199,538,306,548,391,556);$g.DrawLine($fine,198,548,286,568)}
  $bmp.Save((Join-Path $out ('Vale-'+$pose+'.png')),[System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose();$bmp.Dispose();$paper.Dispose();$ink.Dispose();$fine.Dispose();$rim.Dispose()
}

param([Parameter(Mandatory=$true)][string]$Batch)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public static class ArtPixels {
  public static void Fade(Bitmap b, int start, int end) {
    Rectangle r=new Rectangle(0,0,b.Width,b.Height);
    BitmapData d=b.LockBits(r,ImageLockMode.ReadWrite,PixelFormat.Format32bppArgb);
    byte[] p=new byte[d.Stride*b.Height]; Marshal.Copy(d.Scan0,p,0,p.Length);
    for(int y=start;y<b.Height;y++) for(int x=0;x<b.Width;x++) {
      int i=y*d.Stride+x*4+3; p[i]=(byte)Math.Round(p[i]*Math.Max(0.0,1.0-(double)(y-start)/(end-start)));
    }
    Marshal.Copy(p,0,d.Scan0,p.Length); b.UnlockBits(d);
  }
  public static int[] Measure(Bitmap b, int x0, int y0, int x1, int y1) {
    Rectangle r=new Rectangle(0,0,b.Width,b.Height);
    BitmapData d=b.LockBits(r,ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);
    byte[] p=new byte[d.Stride*b.Height]; Marshal.Copy(d.Scan0,p,0,p.Length); b.UnlockBits(d);
    int visible=0,bright=0,sx=0,sy=0;
    for(int y=y0;y<y1;y++) for(int x=x0;x<x1;x++) {
      int i=y*d.Stride+x*4; double a=p[i+3]/255.0;
      if(p[i+3]>24)visible++;
      if((0.2126*p[i+2]+0.7152*p[i+1]+0.0722*p[i])*a>127.5){bright++;sx+=x;sy+=y;}
    }
    return new int[]{visible,bright,sx,sy};
  }
}
'@
function Color($hex, $alpha=1) { [System.Drawing.Color]::FromArgb([int](255*$alpha),[System.Drawing.ColorTranslator]::FromHtml($hex)) }
function Path($spec) {
  $path=[System.Drawing.Drawing2D.GraphicsPath]::new()
  $x=0.0; $y=0.0
  foreach($c in $spec) {
    switch($c[0]) {
      M { $path.StartFigure(); $x=[single]$c[1]; $y=[single]$c[2] }
      L { $path.AddLine([single]$x,[single]$y,[single]$c[1],[single]$c[2]); $x=[single]$c[1];$y=[single]$c[2] }
      C { $path.AddBezier([single]$x,[single]$y,[single]$c[1],[single]$c[2],[single]$c[3],[single]$c[4],[single]$c[5],[single]$c[6]);$x=[single]$c[5];$y=[single]$c[6] }
      Z { $path.CloseFigure() }
    }
  }
  return ,$path
}
$batchData=Get-Content -LiteralPath $Batch -Raw -Encoding UTF8 | ConvertFrom-Json
$fontCollection=[System.Drawing.Text.PrivateFontCollection]::new()
$fontDirectory=Join-Path $PSScriptRoot '../../../Assets/Art/Fonts'
if(Test-Path -LiteralPath $fontDirectory){Get-ChildItem -LiteralPath $fontDirectory -Filter '*.ttf' | ForEach-Object {$fontCollection.AddFontFile($_.FullName)}}
$stats=@()
foreach($job in $batchData) {
  $scale=if($job.scale){[int]$job.scale}else{2}
  $bitmap=[System.Drawing.Bitmap]::new([int]($job.width*$scale),[int]($job.height*$scale),[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g=[System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode='AntiAlias';$g.PixelOffsetMode='HighQuality';$g.InterpolationMode='HighQualityBicubic';$g.TextRenderingHint='AntiAliasGridFit'
  $g.ScaleTransform($scale,$scale)
  if($job.background){$g.Clear((Color $job.background))}
  foreach($item in $job.items) {
    $state=$g.Save()
    if($item.transform){$t=$item.transform;$g.TranslateTransform([single]$t[0],[single]$t[1]);$g.RotateTransform([single]$t[2])}
    $alpha=if($null -ne $item.alpha){[double]$item.alpha}else{1.0}
    $color=Color $item.color $alpha
    switch($item.type){
      path {
        $p=Path $item.path
        if($item.fill){$brush=[System.Drawing.SolidBrush]::new($color);$g.FillPath($brush,$p);$brush.Dispose()}
        else {
          if($item.glow){
            foreach($ring in @(@(12,0.055),@(6,0.11))){$pen=[System.Drawing.Pen]::new((Color $item.color ($alpha*$ring[1])),[single]($item.width+$ring[0]));$pen.LineJoin='Round';$pen.StartCap='Round';$pen.EndCap='Round';$g.DrawPath($pen,$p);$pen.Dispose()}
          }
          $pen=[System.Drawing.Pen]::new($color,[single]$item.width);$pen.StartCap='Round';$pen.EndCap='Round';$pen.LineJoin='Round'
          if($item.dash){$pen.DashStyle='Dash'}
          $g.DrawPath($pen,$p);$pen.Dispose()
        }
        $p.Dispose()
      }
      hatch {
        $p=Path $item.path;$g.SetClip($p)
        $pen=[System.Drawing.Pen]::new($color,[single]$item.width)
        for($y=-1000;$y -lt 2200;$y+=$item.spacing){$g.DrawLine($pen,0,[single]$y,600,[single]($y+$item.slope*600))}
        $pen.Dispose();$p.Dispose()
      }
      ellipse {
        if($item.fill){$brush=[System.Drawing.SolidBrush]::new($color);$g.FillEllipse($brush,[single]$item.x,[single]$item.y,[single]$item.w,[single]$item.h);$brush.Dispose()}
        else{
          if($item.glow){foreach($ring in @(@(12,0.055),@(6,0.11))){$pen=[System.Drawing.Pen]::new((Color $item.color ($alpha*$ring[1])),[single]($item.width+$ring[0]));$g.DrawEllipse($pen,[single]$item.x,[single]$item.y,[single]$item.w,[single]$item.h);$pen.Dispose()}}
          $pen=[System.Drawing.Pen]::new($color,[single]$item.width);$g.DrawEllipse($pen,[single]$item.x,[single]$item.y,[single]$item.w,[single]$item.h);$pen.Dispose()
        }
      }
      text {
        $family=$fontCollection.Families | Where-Object {$_.Name -eq $item.font} | Select-Object -First 1
        if($family){$font=[System.Drawing.Font]::new($family,[single]$item.size,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel)}
        else{$font=[System.Drawing.Font]::new($item.font,[single]$item.size,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel)}
        $brush=[System.Drawing.SolidBrush]::new($color)
        $format=[System.Drawing.StringFormat]::GenericTypographic.Clone()
        if($item.align -eq 'center'){$format.Alignment='Center'}
        $g.DrawString($item.text,$font,$brush,[single]$item.x,[single]$item.y,$format)
        $font.Dispose();$brush.Dispose();$format.Dispose()
      }
      image {
        $im=[System.Drawing.Image]::FromFile($item.path)
        if($item.source){$r=$item.source;$dest=[System.Drawing.Rectangle]::new([int]$item.x,[int]$item.y,[int]$item.w,[int]$item.h);$g.DrawImage($im,$dest,[int]$r[0],[int]$r[1],[int]$r[2],[int]$r[3],[System.Drawing.GraphicsUnit]::Pixel)}
        else{$g.DrawImage($im,[single]$item.x,[single]$item.y,[single]$item.w,[single]$item.h)}
        $im.Dispose()
      }
    }
    $g.Restore($state)
  }
  $g.Dispose()
  $final=[System.Drawing.Bitmap]::new([int]$job.width,[int]$job.height,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $fg=[System.Drawing.Graphics]::FromImage($final);$fg.InterpolationMode='HighQualityBicubic';$fg.DrawImage($bitmap,0,0,[int]$job.width,[int]$job.height);$fg.Dispose();$bitmap.Dispose()
  if($job.fade){[ArtPixels]::Fade($final,[int]$job.fade[0],[int]$job.fade[1])}
  [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($job.output)) | Out-Null
  $final.Save($job.output,[System.Drawing.Imaging.ImageFormat]::Png)
  $m=[ArtPixels]::Measure($final,0,0,$final.Width,$final.Height)
  $entry=@{path=$job.output;width=$final.Width;height=$final.Height;brightFraction=$m[1]/($final.Width*$final.Height)}
  if($job.contract){
    $entry.mouth=[ArtPixels]::Measure($final,220,256,292,338)[0]
    $entry.bottomVisible=[ArtPixels]::Measure($final,0,870,512,1024)[0]
    $a=$job.contract.anchor;$rad=22
    $m=[ArtPixels]::Measure($final,[int]($a[0]-$rad),[int]($a[1]-$rad),[int]($a[0]+$rad),[int]($a[1]+$rad))
    $entry.anchorBright=$m[1];$entry.centroid=if($m[1]){@(($m[2]/$m[1]),($m[3]/$m[1]))}else{@(0,0)}
  }
  $stats+=$entry;$final.Dispose()
}
$stats | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath ($Batch+'.metrics.json') -Encoding UTF8
Write-Output ('Rendered '+$stats.Count+' assets')
$fontCollection.Dispose()

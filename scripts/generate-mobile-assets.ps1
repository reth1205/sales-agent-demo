Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ResRoot = Join-Path $ProjectRoot 'android/app/src/main/res'

function ConvertFrom-HexColor {
  param([string]$Hex)
  $value = $Hex.TrimStart('#')
  return [System.Drawing.Color]::FromArgb(
    [Convert]::ToInt32($value.Substring(0, 2), 16),
    [Convert]::ToInt32($value.Substring(2, 2), 16),
    [Convert]::ToInt32($value.Substring(4, 2), 16)
  )
}

function New-RoundedRectanglePath {
  param(
    [System.Drawing.RectangleF]$Rect,
    [float]$Radius
  )

  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diameter = $Radius * 2
  $path.AddArc($Rect.X, $Rect.Y, $diameter, $diameter, 180, 90)
  $path.AddArc($Rect.Right - $diameter, $Rect.Y, $diameter, $diameter, 270, 90)
  $path.AddArc($Rect.Right - $diameter, $Rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($Rect.X, $Rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-Canvas {
  param(
    [int]$Width,
    [int]$Height
  )

  $bitmap = [System.Drawing.Bitmap]::new($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function Save-Png {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [string]$Path
  )

  $directory = Split-Path -Parent $Path
  if (-not (Test-Path $directory)) {
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
  }

  $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function Draw-BrandMark {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$X,
    [float]$Y,
    [float]$Size,
    [bool]$DrawBackground = $true,
    [bool]$RoundMask = $false
  )

  $deepBlue = ConvertFrom-HexColor '#061627'
  $blue = ConvertFrom-HexColor '#0E3A5B'
  $sky = ConvertFrom-HexColor '#38BDF8'
  $teal = ConvertFrom-HexColor '#2DD4BF'
  $amber = ConvertFrom-HexColor '#F59E0B'
  $white = [System.Drawing.Color]::FromArgb(245, 255, 255, 255)

  if ($DrawBackground) {
    $rect = [System.Drawing.RectangleF]::new($X, $Y, $Size, $Size)
    if ($RoundMask) {
      $clip = [System.Drawing.Drawing2D.GraphicsPath]::new()
      $clip.AddEllipse($rect)
      $Graphics.SetClip($clip)
    }

    $backgroundPath = New-RoundedRectanglePath $rect ($Size * 0.22)
    $backgroundBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
      $rect,
      $blue,
      $deepBlue,
      [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
    )
    $Graphics.FillPath($backgroundBrush, $backgroundPath)

    $glowBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(60, $sky))
    $Graphics.FillEllipse($glowBrush, $X + $Size * 0.58, $Y + $Size * 0.08, $Size * 0.48, $Size * 0.48)
    $glowBrush.Dispose()
    $backgroundBrush.Dispose()
    $backgroundPath.Dispose()
  }

  $panelRect = [System.Drawing.RectangleF]::new($X + $Size * 0.18, $Y + $Size * 0.2, $Size * 0.64, $Size * 0.6)
  $panelPath = New-RoundedRectanglePath $panelRect ($Size * 0.08)
  $panelBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(58, 255, 255, 255))
  $Graphics.FillPath($panelBrush, $panelPath)

  $routePath = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $routePath.StartFigure()
  $routePath.AddBezier(
    $X + $Size * 0.28,
    $Y + $Size * 0.67,
    $X + $Size * 0.37,
    $Y + $Size * 0.48,
    $X + $Size * 0.46,
    $Y + $Size * 0.74,
    $X + $Size * 0.56,
    $Y + $Size * 0.48
  )
  $routePath.AddBezier(
    $X + $Size * 0.56,
    $Y + $Size * 0.48,
    $X + $Size * 0.62,
    $Y + $Size * 0.33,
    $X + $Size * 0.71,
    $Y + $Size * 0.44,
    $X + $Size * 0.74,
    $Y + $Size * 0.3
  )

  $routePen = [System.Drawing.Pen]::new($white, [Math]::Max(2, $Size * 0.055))
  $routePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $routePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $routePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $Graphics.DrawPath($routePen, $routePath)

  $dotBrush = [System.Drawing.SolidBrush]::new($teal)
  $Graphics.FillEllipse($dotBrush, $X + $Size * 0.235, $Y + $Size * 0.61, $Size * 0.12, $Size * 0.12)
  $Graphics.FillEllipse($dotBrush, $X + $Size * 0.5, $Y + $Size * 0.43, $Size * 0.12, $Size * 0.12)
  $pinBrush = [System.Drawing.SolidBrush]::new($amber)
  $Graphics.FillEllipse($pinBrush, $X + $Size * 0.67, $Y + $Size * 0.22, $Size * 0.14, $Size * 0.14)
  $innerBrush = [System.Drawing.SolidBrush]::new($deepBlue)
  $Graphics.FillEllipse($innerBrush, $X + $Size * 0.713, $Y + $Size * 0.263, $Size * 0.054, $Size * 0.054)

  $routePen.Dispose()
  $routePath.Dispose()
  $dotBrush.Dispose()
  $pinBrush.Dispose()
  $innerBrush.Dispose()
  $panelBrush.Dispose()
  $panelPath.Dispose()
  if ($RoundMask) {
    $Graphics.ResetClip()
  }
}

function New-LauncherIcon {
  param(
    [int]$Size,
    [string]$Path,
    [bool]$Round = $false
  )

  $canvas = New-Canvas $Size $Size
  try {
    Draw-BrandMark -Graphics $canvas.Graphics -X 0 -Y 0 -Size $Size -DrawBackground $true -RoundMask:$Round
    Save-Png -Bitmap $canvas.Bitmap -Path $Path
  } finally {
    $canvas.Graphics.Dispose()
    $canvas.Bitmap.Dispose()
  }
}

function New-ForegroundIcon {
  param(
    [int]$Size,
    [string]$Path
  )

  $canvas = New-Canvas $Size $Size
  try {
    $markSize = $Size * 0.68
    $offset = ($Size - $markSize) / 2
    Draw-BrandMark -Graphics $canvas.Graphics -X $offset -Y $offset -Size $markSize -DrawBackground $false
    Save-Png -Bitmap $canvas.Bitmap -Path $Path
  } finally {
    $canvas.Graphics.Dispose()
    $canvas.Bitmap.Dispose()
  }
}

function New-Splash {
  param(
    [int]$Width,
    [int]$Height,
    [string]$Path
  )

  $canvas = New-Canvas $Width $Height
  try {
    $g = $canvas.Graphics
    $rect = [System.Drawing.Rectangle]::new(0, 0, $Width, $Height)
    $bgBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
      $rect,
      (ConvertFrom-HexColor '#071427'),
      (ConvertFrom-HexColor '#0B2A44'),
      [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
    )
    $g.FillRectangle($bgBrush, $rect)
    $bgBrush.Dispose()

    $gridPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(28, 96, 165, 250), [Math]::Max(1, $Width / 900))
    $spacing = [Math]::Max(42, [int]($Width / 12))
    for ($x = -$spacing; $x -lt $Width + $spacing; $x += $spacing) {
      $g.DrawLine($gridPen, $x, 0, $x + ($Width * 0.16), $Height)
    }
    for ($y = 0; $y -lt $Height + $spacing; $y += $spacing) {
      $g.DrawLine($gridPen, 0, $y, $Width, $y - ($Height * 0.08))
    }
    $gridPen.Dispose()

    $markSize = [Math]::Min($Width, $Height) * 0.28
    $markX = ($Width - $markSize) / 2
    $markY = ($Height * 0.44) - ($markSize / 2)
    Draw-BrandMark -Graphics $g -X $markX -Y $markY -Size $markSize -DrawBackground $true

    $titleFontSize = [Math]::Max(18, [Math]::Min($Width, $Height) * 0.055)
    $subtitleFontSize = [Math]::Max(11, [Math]::Min($Width, $Height) * 0.026)
    $titleFont = [System.Drawing.Font]::new('Segoe UI Semibold', $titleFontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $subtitleFont = [System.Drawing.Font]::new('Segoe UI', $subtitleFontSize, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $titleBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(245, 255, 255, 255))
    $subtitleBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(180, 203, 213, 225))
    $format = [System.Drawing.StringFormat]::new()
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center

    $titleY = $markY + $markSize + ($Height * 0.08)
    $g.DrawString('Sales Agent Demo', $titleFont, $titleBrush, [System.Drawing.RectangleF]::new(0, $titleY, $Width, $titleFontSize * 1.4), $format)
    $g.DrawString('Field sales assistant', $subtitleFont, $subtitleBrush, [System.Drawing.RectangleF]::new(0, $titleY + ($titleFontSize * 1.3), $Width, $subtitleFontSize * 1.6), $format)

    $format.Dispose()
    $titleBrush.Dispose()
    $subtitleBrush.Dispose()
    $titleFont.Dispose()
    $subtitleFont.Dispose()
    Save-Png -Bitmap $canvas.Bitmap -Path $Path
  } finally {
    $canvas.Graphics.Dispose()
    $canvas.Bitmap.Dispose()
  }
}

$launcherSizes = @{
  'mipmap-mdpi' = 48
  'mipmap-hdpi' = 72
  'mipmap-xhdpi' = 96
  'mipmap-xxhdpi' = 144
  'mipmap-xxxhdpi' = 192
}

$foregroundSizes = @{
  'mipmap-mdpi' = 108
  'mipmap-hdpi' = 162
  'mipmap-xhdpi' = 216
  'mipmap-xxhdpi' = 324
  'mipmap-xxxhdpi' = 432
}

foreach ($entry in $launcherSizes.GetEnumerator()) {
  $folder = Join-Path $ResRoot $entry.Key
  New-LauncherIcon -Size $entry.Value -Path (Join-Path $folder 'ic_launcher.png')
  New-LauncherIcon -Size $entry.Value -Path (Join-Path $folder 'ic_launcher_round.png') -Round $true
}

foreach ($entry in $foregroundSizes.GetEnumerator()) {
  $folder = Join-Path $ResRoot $entry.Key
  New-ForegroundIcon -Size $entry.Value -Path (Join-Path $folder 'ic_launcher_foreground.png')
}

Get-ChildItem -Recurse -Path $ResRoot -Filter 'splash.png' | ForEach-Object {
  $source = [System.Drawing.Image]::FromFile($_.FullName)
  try {
    $width = $source.Width
    $height = $source.Height
  } finally {
    $source.Dispose()
  }
  New-Splash -Width $width -Height $height -Path $_.FullName
}

Write-Host 'Generated Android launcher icons and splash assets.'

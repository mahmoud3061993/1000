$root = Join-Path $PSScriptRoot "..\dist"
$prefix = "http://127.0.0.1:8765/"
$http = [System.Net.HttpListener]::new()
$http.Prefixes.Add($prefix)
$http.Start()
Start-Process $prefix
Write-Host "عربيتي جاهزة على $prefix — اقفل النافذة عشان توقف السيرفر."
while ($http.IsListening) {
  $ctx = $http.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.LocalPath.TrimStart("/"))
  if ([string]::IsNullOrWhiteSpace($path)) { $path = "index.html" }
  $file = Join-Path $root $path
  if (-not (Test-Path $file) -or (Get-Item $file).PSIsContainer) {
    $ctx.Response.StatusCode = 404
    $ctx.Response.Close()
    continue
  }
  $bytes = [System.IO.File]::ReadAllBytes($file)
  $ext = [IO.Path]::GetExtension($file).ToLower()
  $map = @{ ".html"="text/html; charset=utf-8"; ".js"="text/javascript; charset=utf-8"; ".css"="text/css; charset=utf-8"; ".json"="application/json"; ".svg"="image/svg+xml" }
  $ctx.Response.ContentType = $(if ($map.ContainsKey($ext)) { $map[$ext] } else { "application/octet-stream" })
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $ctx.Response.Close()
}

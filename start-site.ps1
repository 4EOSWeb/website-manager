# Windows launcher: Caddy in its own window, the editor in PowerShell.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $root
$appPort = 3210

function Get-WindowsArch {
  if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64' -or $env:PROCESSOR_ARCHITEW6432 -eq 'ARM64') {
    return 'arm64'
  }
  if ($env:PROCESSOR_ARCHITECTURE -eq 'AMD64' -or $env:PROCESSOR_ARCHITEW6432 -eq 'AMD64') {
    return 'amd64'
  }
  return $null
}

function Test-WindowsExe([string]$Path, [string]$Arch) {
  if (-not (Test-Path -LiteralPath $Path)) { return $false }
  $stream = [System.IO.File]::Open(
    $Path,
    [System.IO.FileMode]::Open,
    [System.IO.FileAccess]::Read,
    [System.IO.FileShare]::ReadWrite
  )
  try {
    if ($stream.Length -lt 10MB) { return $false }
    $dos = New-Object byte[] 64
    if ($stream.Read($dos, 0, 64) -lt 64) { return $false }
    if ($dos[0] -ne 0x4D -or $dos[1] -ne 0x5A) { return $false }
    $peOffset = [BitConverter]::ToInt32($dos, 0x3C)
    if ($peOffset -lt 64 -or $peOffset -gt 1024) { return $false }
    $stream.Position = $peOffset
    $coff = New-Object byte[] 24
    if ($stream.Read($coff, 0, 24) -lt 24) { return $false }
    if ($coff[0] -ne 0x50 -or $coff[1] -ne 0x45 -or $coff[2] -ne 0 -or $coff[3] -ne 0) { return $false }
    $machine = [BitConverter]::ToUInt16($coff, 4)
    $expected = if ($Arch -eq 'arm64') { 0xAA64 } else { 0x8664 }
    if ($machine -ne $expected) { return $false }
    $sections = [BitConverter]::ToUInt16($coff, 6)
    $optionalSize = [BitConverter]::ToUInt16($coff, 20)
    if ($sections -lt 1 -or $optionalSize -lt 24) { return $false }
    $stream.Position = $peOffset + 24
    $magicBytes = New-Object byte[] 2
    if ($stream.Read($magicBytes, 0, 2) -lt 2) { return $false }
    $magic = [BitConverter]::ToUInt16($magicBytes, 0)
    if ($magic -ne 0x20B) { return $false }
    $sectionOffset = $peOffset + 24 + $optionalSize
    $end = 0L
    for ($i = 0; $i -lt $sections; $i++) {
      $stream.Position = $sectionOffset + ($i * 40) + 16
      $raw = New-Object byte[] 8
      if ($stream.Read($raw, 0, 8) -lt 8) { return $false }
      $rawSize = [BitConverter]::ToUInt32($raw, 0)
      $rawPtr = [BitConverter]::ToUInt32($raw, 4)
      $sectionEnd = [int64]$rawPtr + [int64]$rawSize
      if ($sectionEnd -gt $end) { $end = $sectionEnd }
    }
    return ($end -le $stream.Length)
  } catch {
    return $false
  } finally {
    $stream.Close()
  }
}

function Find-Caddy([string]$Arch) {
  $paths = @()
  foreach ($name in @('caddy.exe', 'caddy')) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Source) { $paths += $cmd.Source }
  }
  $paths += @(
    (Join-Path $root 'caddy.exe'),
    (Join-Path $root 'tools\caddy.exe'),
    (Join-Path $env:ProgramFiles 'Caddy\caddy.exe'),
    (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links\caddy.exe')
  )
  if ($env:ChocolateyInstall) {
    $paths += (Join-Path $env:ChocolateyInstall 'bin\caddy.exe')
  }
  foreach ($path in ($paths | Select-Object -Unique)) {
    if (Test-WindowsExe $path $Arch) { return $path }
  }
  return $null
}

function Save-Caddy([string]$Destination, [string]$Arch) {
  $dir = Split-Path -Parent $Destination
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  $temp = "$Destination.download"
  if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Force }
  $curl = Join-Path $env:SystemRoot 'System32\curl.exe'
  if (-not (Test-Path -LiteralPath $curl)) {
    throw 'Windows curl.exe was not found.'
  }
  $url = "https://caddyserver.com/api/download?os=windows&arch=$Arch"
  & $curl -fL --retry 3 --output $temp $url
  if ($LASTEXITCODE -ne 0) {
    throw "Could not download Windows caddy.exe (curl exit $LASTEXITCODE)."
  }
  if (-not (Test-WindowsExe $temp $Arch)) {
    Remove-Item -LiteralPath $temp -Force -ErrorAction SilentlyContinue
    throw 'The download is not a usable Windows caddy.exe.'
  }
  if (Test-Path -LiteralPath $Destination) { Remove-Item -LiteralPath $Destination -Force }
  Move-Item -LiteralPath $temp -Destination $Destination
  Unblock-File -LiteralPath $Destination
}

$arch = Get-WindowsArch
if (-not $arch) {
  Write-Host 'Caddy needs 64-bit Windows. This PC is 32-bit, so caddy.exe cannot start.'
  exit 1
}

foreach ($stale in @(
  (Join-Path $root 'tools\caddy.exe'),
  (Join-Path $root 'caddy.exe')
)) {
  if ((Test-Path -LiteralPath $stale) -and -not (Test-WindowsExe $stale $arch)) {
    Write-Host "Removing unusable $stale"
    try {
      Remove-Item -LiteralPath $stale -Force
    } catch {
      Write-Host 'Close the Caddy window, then run start-site.bat again.'
      Write-Host $_.Exception.Message
      exit 1
    }
  }
}

function Test-CaddyRuns([string]$Path) {
  try {
    & $Path version | Out-Host
    return ($LASTEXITCODE -eq 0)
  } catch {
    Write-Host $_.Exception.Message
    return $false
  }
}

$caddy = Find-Caddy $arch
if ($caddy) {
  $caddy = (Resolve-Path -LiteralPath $caddy).Path
}
if ($caddy -and -not (Test-CaddyRuns $caddy)) {
  $localCopy = $caddy.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)
  if ($localCopy) {
    Write-Host 'The downloaded caddy.exe cannot start. Replacing it...'
    try {
      Remove-Item -LiteralPath $caddy -Force
    } catch {
      Write-Host 'Close the Caddy window, then run start-site.bat again.'
      Write-Host $_.Exception.Message
      exit 1
    }
  }
  $caddy = $null
}

if (-not $caddy) {
  $caddy = Join-Path $root 'tools\caddy.exe'
  Write-Host 'Downloading the Windows caddy.exe...'
  try {
    Save-Caddy $caddy $arch
  } catch {
    Write-Host $_.Exception.Message
    Write-Host 'Install Caddy from PowerShell, close that window, open a new Command Prompt, and run start-site.bat:'
    Write-Host '  winget install -e --id CaddyServer.Caddy'
    exit 1
  }
  if (-not (Test-CaddyRuns $caddy)) {
    Write-Host 'Windows refused to start the new caddy.exe.'
    Write-Host 'Install it, then open a new Command Prompt and run start-site.bat:'
    Write-Host '  winget install -e --id CaddyServer.Caddy'
    exit 1
  }
}

function Get-ProxyNames {
  $names = New-Object System.Collections.Generic.List[string]
  foreach ($name in @('localhost', '127.0.0.1')) { [void]$names.Add($name) }
  try {
    Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop | ForEach-Object {
      $ip = $_.IPAddress
      if ($ip -and $ip -notlike '127.*' -and $ip -notlike '169.254.*' -and $ip -ne '0.0.0.0') {
        [void]$names.Add($ip)
      }
    }
  } catch {
    Write-Host 'Could not list LAN addresses. HTTPS will be available on localhost.'
  }
  return @($names | Select-Object -Unique)
}

function Get-DefaultLanIPv4 {
  try {
    $configs = @(Get-NetIPConfiguration -ErrorAction Stop | Where-Object {
      $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up'
    })
    foreach ($cfg in $configs) {
      $addr = @($cfg.IPv4Address) | Where-Object {
        $_.IPAddress -and $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*'
      } | Select-Object -First 1
      if ($addr) { return $addr.IPAddress }
    }
  } catch {
  }
  return $null
}

function Test-Node22 {
  $node = Get-Command node -ErrorAction SilentlyContinue
  $npm = Get-Command npm -ErrorAction SilentlyContinue
  if (-not $node -or -not $npm) {
    Write-Host 'Node.js 22 is required. Install it from https://nodejs.org, close this window, and run start-site.bat again.'
    exit 1
  }
  $raw = (& node -p "process.versions.node").Trim()
  $parts = $raw.Split('.')
  $major = 0
  $minor = 0
  [void][int]::TryParse($parts[0], [ref]$major)
  if ($parts.Length -gt 1) { [void][int]::TryParse($parts[1], [ref]$minor) }
  if ($major -lt 22 -or ($major -eq 22 -and $minor -lt 5)) {
    Write-Host "This site needs Node.js 22.5 or newer. This PC is running $raw."
    Write-Host 'Install the current Node.js 22 from https://nodejs.org, close this window, and run start-site.bat again.'
    exit 1
  }
}

function Stop-PreviousSite([string]$Runner, [string]$ConfigPath) {
  try {
    $procs = @(Get-CimInstance Win32_Process -ErrorAction Stop)
  } catch {
    Write-Host 'Could not list running programs. Close the old Caddy and server windows, then run start-site.bat again.'
    return
  }
  foreach ($proc in $procs) {
    $cmd = [string]$proc.CommandLine
    if (-not $cmd) { continue }
    $inRoot = $cmd.IndexOf($root + '\', [System.StringComparison]::OrdinalIgnoreCase) -ge 0
    if (-not $inRoot) { continue }
    $name = [string]$proc.Name
    $stop = $false
    if ($name -eq 'node.exe' -and ($cmd -like '*\next\dist\bin\next*' -or $cmd -like '*/next/dist/bin/next*')) { $stop = $true }
    if ($name -eq 'caddy.exe' -and $cmd.IndexOf($ConfigPath, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) { $stop = $true }
    if ($name -eq 'powershell.exe' -and $cmd.IndexOf($Runner, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) { $stop = $true }
    if (-not $stop) { continue }
    Write-Host "Stopping the previous $($proc.Name) so the site can start clean."
    Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Seconds 1
}

function Enable-InboundPort([int]$Port, [string]$Name) {
  $listed = netsh advfirewall firewall show rule name="$Name" 2>$null
  if ($LASTEXITCODE -eq 0 -and $listed -match 'Enabled:\s+Yes') { return $true }
  netsh advfirewall firewall delete rule name="$Name" | Out-Null
  netsh advfirewall firewall add rule name="$Name" dir=in action=allow protocol=TCP localport=$Port profile=any remoteip=any | Out-Null
  return ($LASTEXITCODE -eq 0)
}

$proxyNames = @(Get-ProxyNames)
$lanIp = Get-DefaultLanIPv4
if (-not $lanIp) {
  $lanIp = @($proxyNames | Where-Object { $_ -like '*.*.*.*' -and $_ -notlike '127.*' }) | Select-Object -First 1
}
$tools = Join-Path $root 'tools'
New-Item -ItemType Directory -Force -Path $tools | Out-Null
$caddyConfig = Join-Path $tools 'Caddyfile'
$sites = ($proxyNames -join ', ')
@(
  "$sites {"
  "`ttls internal"
  "`treverse_proxy 127.0.0.1:$appPort"
  '}'
) | Set-Content -LiteralPath $caddyConfig -Encoding ascii

Write-Host 'Trusting the local HTTPS certificate. Windows may ask for approval.'
& $caddy trust
if ($LASTEXITCODE -ne 0) {
  Write-Host 'The certificate was not added. The site still opens, and the browser will warn until an Administrator window runs: caddy trust'
}

Test-Node22
$runner = Join-Path $tools 'run-server.ps1'
Stop-PreviousSite $runner $caddyConfig
$quotedRoot = $root.Replace("'", "''")
@"
`$ErrorActionPreference = 'Continue'
Set-Location -LiteralPath '$quotedRoot'
if (-not (Test-Path -LiteralPath '.env')) {
  Copy-Item -LiteralPath '.env.example' -Destination '.env'
  Write-Host 'Created .env from .env.example.'
}
`$envText = Get-Content -LiteralPath '.env' -Raw
if (`$envText -match 'replace-with-openssl-rand-base64-32') {
  `$bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes(`$bytes)
  `$secret = [Convert]::ToBase64String(`$bytes)
  `$envText = `$envText.Replace('replace-with-openssl-rand-base64-32', `$secret)
  Set-Content -LiteralPath '.env' -Value `$envText -Encoding ascii
  Write-Host 'Wrote a local AUTH_SECRET into .env.'
}
Write-Host 'Installing dependencies...'
npm install
if (`$LASTEXITCODE -ne 0) {
  Write-Host 'npm install failed. The site was not started.'
  return
}
Write-Host 'Preparing the database...'
npx prisma migrate deploy
if (`$LASTEXITCODE -ne 0) {
  Write-Host 'The database is not ready. Start PostgreSQL, create website_manager, and run start-site.bat again.'
  Write-Host 'Expected DATABASE_URL: postgresql://postgres:postgres@localhost:5432/website_manager'
  return
}
node prisma/seed.mjs
if (`$LASTEXITCODE -ne 0) {
  Write-Host 'Seeding the database failed. The site was not started.'
  return
}
Write-Host 'Starting the editor on http://127.0.0.1:$appPort'
npm run dev
"@ | Set-Content -LiteralPath $runner -Encoding ascii
$powershell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
Start-Process -FilePath $caddy -WorkingDirectory $root -ArgumentList @('run', '--config', $caddyConfig)
Start-Process -FilePath $powershell -WorkingDirectory $root -ArgumentList "-NoExit -NoProfile -ExecutionPolicy Bypass -File `"$runner`""
$httpOpen = Enable-InboundPort 80 '4EOS Editor HTTP'
$httpsOpen = Enable-InboundPort 443 '4EOS Editor HTTPS'
if (-not $httpOpen -or -not $httpsOpen) {
  Write-Host 'Windows Firewall did not allow ports 80 and 443. Close this window, right-click start-site.bat, and choose Run as administrator.'
}

Write-Host 'Opened Caddy and the 4EOS editor.'
Write-Host 'The server window installs dependencies, prepares the database, then starts the editor. Leave that window open.'
Write-Host "On this PC: https://localhost and http://127.0.0.1:$appPort"
Write-Host 'Sign in with Continue as 4EOS administrator.'
if ($lanIp) { Write-Host "On this network: https://$lanIp" }
Write-Host 'This is the editor. It does not replace https://testsite.4eos.com.'

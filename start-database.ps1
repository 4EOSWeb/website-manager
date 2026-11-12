# Starts PostgreSQL for the editor when nothing is already listening on port 5432.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $root

function Test-DbPort {
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $wait = $client.BeginConnect('127.0.0.1', 5432, $null, $null)
    if (-not $wait.AsyncWaitHandle.WaitOne(700, $false)) { return $false }
    $client.EndConnect($wait)
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

function Find-PgTool([string]$Bin, [string]$Name) {
  $path = Join-Path $Bin $Name
  if (Test-Path -LiteralPath $path) { return $path }
  throw "PostgreSQL is missing $Name."
}

if (Test-DbPort) {
  Write-Host 'PostgreSQL is already running on port 5432.'
  return
}

$tools = Join-Path $root 'tools'
New-Item -ItemType Directory -Force -Path $tools | Out-Null
$init = Get-ChildItem -LiteralPath $tools -Filter 'initdb.exe' -Recurse -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -match '\\bin\\initdb\.exe$' } |
  Select-Object -First 1

if (-not $init) {
  $zip = Join-Path $tools 'pgsql.zip'
  $curl = Join-Path $env:SystemRoot 'System32\curl.exe'
  if (-not (Test-Path -LiteralPath $curl)) { throw 'Windows curl.exe was not found.' }
  $url = 'https://get.enterprisedb.com/postgresql/postgresql-16.16-1-windows-x64-binaries.zip'
  Write-Host 'No database is running. Downloading PostgreSQL 16 (about 360 MB, one time)...'
  & $curl -fL --retry 3 --output $zip $url
  if ($LASTEXITCODE -ne 0) { throw "Could not download PostgreSQL (curl exit $LASTEXITCODE)." }
  Write-Host 'Unpacking PostgreSQL...'
  $unpack = Join-Path $tools 'pgsql'
  if (Test-Path -LiteralPath $unpack) { Remove-Item -LiteralPath $unpack -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $unpack | Out-Null
  $tar = Join-Path $env:SystemRoot 'System32\tar.exe'
  if (Test-Path -LiteralPath $tar) {
    & $tar -xf $zip -C $unpack
  } else {
    Expand-Archive -LiteralPath $zip -DestinationPath $unpack -Force
  }
  if ($LASTEXITCODE -ne 0) { throw 'Could not unpack PostgreSQL.' }
  Remove-Item -LiteralPath $zip -Force -ErrorAction SilentlyContinue
  $init = Get-ChildItem -LiteralPath $unpack -Filter 'initdb.exe' -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -match '\\bin\\initdb\.exe$' } |
    Select-Object -First 1
}

if (-not $init) { throw 'The PostgreSQL download did not include initdb.exe.' }
$bin = Split-Path -Parent $init.FullName
$initdb = Find-PgTool $bin 'initdb.exe'
$pgctl = Find-PgTool $bin 'pg_ctl.exe'
$psql = Find-PgTool $bin 'psql.exe'
$data = Join-Path $tools 'pgdata'
$log = Join-Path $tools 'postgres.log'

if (-not (Test-Path -LiteralPath (Join-Path $data 'PG_VERSION'))) {
  if (Test-Path -LiteralPath $data) { Remove-Item -LiteralPath $data -Recurse -Force }
  $pwFile = Join-Path $tools 'pgpass.txt'
  Set-Content -LiteralPath $pwFile -Value 'postgres' -Encoding ascii
  Write-Host 'Creating the local database files...'
  & $initdb -D $data -U postgres --pwfile=$pwFile -E UTF8 -A scram-sha-256
  $initCode = $LASTEXITCODE
  Remove-Item -LiteralPath $pwFile -Force -ErrorAction SilentlyContinue
  if ($initCode -ne 0) { throw 'PostgreSQL could not create its data folder.' }
}

Write-Host 'Starting PostgreSQL on 127.0.0.1:5432...'
& $pgctl -D $data -l $log -w start -o '-h 127.0.0.1 -p 5432'
if ($LASTEXITCODE -ne 0 -or -not (Test-DbPort)) {
  if (Test-Path -LiteralPath $log) { Get-Content -LiteralPath $log -Tail 40 | Write-Host }
  throw 'PostgreSQL did not start. If the log mentions a missing DLL, install the Microsoft Visual C++ 2015-2022 Redistributable and run start-site.bat again.'
}

$env:PGPASSWORD = 'postgres'
$exists = (& $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='website_manager'").Trim()
if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL started, but the editor could not sign in as postgres.' }
if ($exists -ne '1') {
  & $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -c 'CREATE DATABASE website_manager'
  if ($LASTEXITCODE -ne 0) { throw 'Could not create the website_manager database.' }
}
Write-Host 'Local PostgreSQL is ready.'

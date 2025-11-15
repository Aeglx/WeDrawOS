param(
  [Parameter(Mandatory=$true)]
  [int]$Port
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Checking and cleaning port: $Port"
$conns = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if (-not $conns) {
  Write-Host "Port $Port is not in use"
  exit 0
}

$pids = $conns | Select-Object -ExpandProperty OwningProcess | Select-Object -Unique
foreach ($procId in $pids) {
  try {
    Stop-Process -Id $procId -Force -ErrorAction Stop
    Write-Host "Killed process PID=${procId} on port $Port"
  } catch {
    Write-Host "Failed to kill PID=${procId}: $($_.Exception.Message)"
  }
}

Write-Host "Port $Port cleaned"
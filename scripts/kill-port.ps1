param(
  [Parameter(Mandatory=$true)]
  [int]$Port
)

Write-Host "检查并清理端口: $Port"
$conns = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if (-not $conns) {
  Write-Host "端口 $Port 未被占用"
  exit 0
}

$pids = $conns | Select-Object -ExpandProperty OwningProcess | Select-Object -Unique
foreach ($pid in $pids) {
  try {
    Stop-Process -Id $pid -Force -ErrorAction Stop
    Write-Host "已终止占用端口 $Port 的进程 PID=$pid"
  } catch {
    Write-Host "终止进程失败 PID=$pid: $($_.Exception.Message)"
  }
}

Write-Host "端口 $Port 清理完成"
$ErrorActionPreference = "Stop"

if (-not $env:EVENTO_DAEMON_TOKEN) {
  Write-Error "Set EVENTO_DAEMON_TOKEN before starting EVENTO Desktop daemon."
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
python "$scriptDir/evento_daemon.py"

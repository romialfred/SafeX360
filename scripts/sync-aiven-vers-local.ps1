# =============================================================================
# sync-aiven-vers-local.ps1 — Wrapper Windows : delegue au script bash
# (Git Bash), seul shell qui transmet correctement les quotes imbriquees
# aux commandes docker exec. Voir sync-aiven-vers-local.sh pour la logique.
#
# Usage : powershell -ExecutionPolicy Bypass -File scripts\sync-aiven-vers-local.ps1
# =============================================================================
$ErrorActionPreference = 'Stop'
$bash = 'C:\Program Files\Git\bin\bash.exe'
if (-not (Test-Path $bash)) { $bash = 'bash' }
$script = Join-Path $PSScriptRoot 'sync-aiven-vers-local.sh'
& $bash $script @args
exit $LASTEXITCODE

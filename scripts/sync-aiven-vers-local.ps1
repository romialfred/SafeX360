# =============================================================================
# sync-aiven-vers-local.ps1 — Synchronise la base Aiven (prod) vers le MySQL
# local Docker (conteneur safex-mysql).
#
# Usage :   powershell -File scripts\sync-aiven-vers-local.ps1
#           (optionnel) -Schemas defaultdb,healthsafety   # défaut : les deux
#
# Sens : Aiven --> local UNIQUEMENT. Ne touche JAMAIS à la prod (lecture seule
# côté Aiven via mysqldump --single-transaction). Chaque schéma local est
# recréé à l'identique (DROP + CREATE + import), données et structure.
#
# Prérequis : conteneur Docker 'safex-mysql' démarré (LOT 51), Backend\.env
# avec DB_USERNAME / DB_PASSWORD / DB_LOCAL_ROOT_PASSWORD et les URLs Aiven
# (DB_URL_AIVEN / DB_URL_HNS_AIVEN, ou à défaut DB_URL / DB_URL_HNS).
# =============================================================================
param(
    [string[]]$Schemas = @('defaultdb', 'healthsafety')
)

$ErrorActionPreference = 'Stop'
$envFile = Join-Path $PSScriptRoot '..\Backend\.env'

# --- Lecture de Backend\.env (valeurs entre quotes simples) ------------------
$vars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^([A-Z_]+)=(.*)$") {
        $vars[$Matches[1]] = $Matches[2].Trim("'").Trim('"')
    }
}

$user   = $vars['DB_USERNAME']
$pass   = $vars['DB_PASSWORD']
$rootPw = $vars['DB_LOCAL_ROOT_PASSWORD']
if (-not $user -or -not $pass -or -not $rootPw) {
    Write-Error "DB_USERNAME / DB_PASSWORD / DB_LOCAL_ROOT_PASSWORD manquants dans Backend\.env"
}

# URL Aiven : DB_URL_AIVEN prioritaire (post-bascule), sinon DB_URL (pré-bascule)
$aivenUrl = $vars['DB_URL_AIVEN']; if (-not $aivenUrl) { $aivenUrl = $vars['DB_URL'] }
if ($aivenUrl -notmatch "@([^:/@]+):(\d+)/") {
    if ($aivenUrl -notmatch "//([^:/@]+):(\d+)/") { Write-Error "Impossible d'extraire hôte/port Aiven de l'URL" }
}
$aivenHost = $Matches[1]; $aivenPort = $Matches[2]
if ($aivenHost -eq 'localhost' -or $aivenHost -eq '127.0.0.1') {
    Write-Error "L'URL Aiven résolue pointe vers localhost — vérifier DB_URL_AIVEN dans Backend\.env"
}

# --- Conteneur local disponible ? --------------------------------------------
$running = docker ps --filter "name=safex-mysql" --format "{{.Names}}"
if ($running -ne 'safex-mysql') { Write-Error "Le conteneur safex-mysql n'est pas démarré (docker start safex-mysql)" }

Write-Host "Source  : $aivenHost`:$aivenPort (Aiven, lecture seule)"
Write-Host "Cible   : conteneur Docker safex-mysql (localhost:3306)"
Write-Host "Schémas : $($Schemas -join ', ')`n"

foreach ($db in $Schemas) {
    Write-Host "--- $db : recréation locale + dump Aiven + import..."
    $t0 = Get-Date

    docker exec -e ROOT_PW=$rootPw safex-mysql sh -c "mysql -uroot -p`"`$ROOT_PW`" -e 'DROP DATABASE IF EXISTS $db; CREATE DATABASE $db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'"
    if ($LASTEXITCODE -ne 0) { Write-Error "Échec recréation du schéma local $db" }

    docker exec -e SRC_PW=$pass -e ROOT_PW=$rootPw safex-mysql sh -c "mysqldump --host=$aivenHost --port=$aivenPort --user=$user --password=`"`$SRC_PW`" --ssl-mode=REQUIRED --single-transaction --skip-lock-tables --set-gtid-purged=OFF --routines --triggers --no-tablespaces $db | mysql -uroot -p`"`$ROOT_PW`" $db"
    if ($LASTEXITCODE -ne 0) { Write-Error "Échec dump/import pour $db" }

    $tables = docker exec -e ROOT_PW=$rootPw safex-mysql sh -c "mysql -uroot -p`"`$ROOT_PW`" -N -e 'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=`"$db`";'"
    $sec = [math]::Round(((Get-Date) - $t0).TotalSeconds, 1)
    Write-Host "    OK — $($tables.Trim()) tables importées en ${sec}s`n"
}

Write-Host "Synchronisation terminée. Les services locaux (profil dev) utilisent ces données via localhost:3306."

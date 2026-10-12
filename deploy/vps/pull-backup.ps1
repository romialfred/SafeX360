# Rapatrie la derniere sauvegarde SafeX du VPS vers ce PC : copie hors serveur.
#
# Tache planifiee Windows « SafeX - copie hors serveur » (tous les jours a 10:00,
# rattrapee au demarrage si le PC etait eteint). La cle ~/.ssh/safex-backup-pull
# ne peut que lire la derniere sauvegarde (commande forcee backup-export cote VPS).
#
# Une copie n'est conservee que si le dump decompresse se termine par
# « Dump completed » ; les copies de plus de $KeepDays jours sont supprimees.
param(
    [string]$Destination = 'D:\SafeX-Backups',
    [int]$KeepDays = 30
)
$ErrorActionPreference = 'Stop'

$ssh = 'C:\Program Files\Git\usr\bin\ssh.exe'
$identityFile = Join-Path $env:USERPROFILE '.ssh\safex-backup-pull'
$knownHosts = Join-Path $env:USERPROFILE '.ssh\known_hosts'
$journal = Join-Path $Destination 'journal.txt'
$partial = Join-Path $Destination 'en-cours.sql.gz'
$nameFile = Join-Path $Destination 'en-cours.nom'

New-Item -ItemType Directory -Force -Path $Destination | Out-Null
function Write-Journal([string]$message) {
    Add-Content -Path $journal -Value ('{0:yyyy-MM-dd HH:mm:ss} {1}' -f (Get-Date), $message)
}

try {
    # cmd.exe redirige en binaire ; la redirection de PowerShell 5.1 corromprait le gzip.
    $command = '"{0}" -i "{1}" -o IdentitiesOnly=yes -o BatchMode=yes -o UserKnownHostsFile="{2}" root@186.241.26.32 > "{3}" 2> "{4}"' -f $ssh, $identityFile, $knownHosts, $partial, $nameFile
    cmd.exe /c $command
    if ($LASTEXITCODE -ne 0) {
        throw ('ssh a echoue (code {0}) : {1}' -f $LASTEXITCODE, (Get-Content $nameFile -Raw))
    }
    $name = Get-Content $nameFile | Where-Object { $_ -match '^safex-[0-9-]+\.sql\.gz$' } | Select-Object -Last 1
    if (-not $name) { throw 'nom de sauvegarde absent de la reponse' }

    $stream = New-Object IO.Compression.GZipStream([IO.File]::OpenRead($partial), [IO.Compression.CompressionMode]::Decompress)
    $reader = New-Object IO.StreamReader($stream)
    $last = ''
    while ($null -ne ($line = $reader.ReadLine())) { if ($line) { $last = $line } }
    $reader.Close()
    if ($last -notmatch 'Dump completed') { throw "sauvegarde $name incomplete" }

    Move-Item -Force -Path $partial -Destination (Join-Path $Destination $name)
    Remove-Item -Force $nameFile
    Get-ChildItem -Path $Destination -Filter 'safex-*.sql.gz' |
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$KeepDays) } |
        Remove-Item -Force
    Write-Journal ('OK {0} ({1:N1} Mo)' -f $name, ((Get-Item (Join-Path $Destination $name)).Length / 1MB))
}
catch {
    Write-Journal ('ECHEC {0}' -f $_.Exception.Message)
    Remove-Item -Force -ErrorAction SilentlyContinue $partial, $nameFile
    exit 1
}

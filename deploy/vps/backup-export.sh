#!/bin/bash
# Commande forcée de la clé SSH « safex-backup-pull » (copie hors serveur).
#
# Installée en /srv/safex/bin/backup-export et référencée dans authorized_keys par
#   command="/srv/safex/bin/backup-export",restrict ssh-ed25519 … safex-backup-pull
# Écrit la dernière sauvegarde quotidienne sur la sortie standard et son nom sur
# la sortie d'erreur ; la clé ne permet rien d'autre (ni shell, ni écriture).
set -euo pipefail

latest="$(ls -1t /srv/safex/backups/safex-*.sql.gz 2>/dev/null | head -n 1)"
if [ -z "$latest" ]; then
  echo "Aucune sauvegarde disponible." >&2
  exit 1
fi
basename "$latest" >&2
exec cat "$latest"

#!/bin/bash
# Sauvegarde quotidienne des deux schémas SafeX (cron root, 02:30 UTC).
#
# Dump cohérent (--single-transaction), compressé, conservé 14 jours dans
# /srv/safex/backups. Le mot de passe root est lu dans le conteneur, jamais
# passé sur la ligne de commande de l'hôte.
set -euo pipefail

DEST=/srv/safex/backups
KEEP_DAYS=14
STAMP="$(date -u +%Y%m%d-%H%M)"
OUT="$DEST/safex-$STAMP.sql.gz"

install -d -m 700 "$DEST"
docker exec safex-db sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" \
    --single-transaction --routines --triggers --events --set-gtid-purged=OFF \
    --databases defaultdb healthsafety' 2>/dev/null | gzip -6 > "$OUT.tmp"

# Un dump tronqué ne se termine pas par « Dump completed » : on le rejette.
if ! zcat "$OUT.tmp" | tail -n 1 | grep -q 'Dump completed'; then
  rm -f "$OUT.tmp"
  echo "ÉCHEC : dump incomplet" >&2
  exit 1
fi
mv "$OUT.tmp" "$OUT"
chmod 600 "$OUT"
find "$DEST" -name 'safex-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
echo "Sauvegarde OK : $OUT ($(du -h "$OUT" | cut -f1))"

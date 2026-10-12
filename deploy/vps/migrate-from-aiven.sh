#!/bin/bash
# Copie unique Aiven → safex-db pour la bascule vers le VPS.
#
# Remplace INTÉGRALEMENT defaultdb et healthsafety dans safex-db, puis compare
# le nombre EXACT de lignes table par table (information_schema.table_rows
# n'est qu'une estimation). Pour la copie finale, les écritures sur Aiven
# doivent être gelées (services Render minexpert et hns suspendus), sinon
# l'écart de comptage est attendu.
#
# Prérequis : /srv/safex/env/aiven.env (chmod 600) avec AIVEN_HOST, AIVEN_PORT,
# AIVEN_USER, AIVEN_PASSWORD. Les secrets restent dans les conteneurs.
set -euo pipefail

main() {
  local ENV_FILE=/srv/safex/env/aiven.env
  local WORK=/srv/safex/migration
  local STAMP DUMP
  STAMP="$(date -u +%Y%m%d-%H%M%S)"
  DUMP="$WORK/aiven-$STAMP.sql"
  install -d -m 700 "$WORK"

  aiven() {
    docker run --rm -i --env-file "$ENV_FILE" mysql:8.0 sh -c \
      'MYSQL_PWD="$AIVEN_PASSWORD" exec "$0" -h "$AIVEN_HOST" -P "$AIVEN_PORT" -u "$AIVEN_USER" --ssl-mode=REQUIRED "$@"' "$@"
  }
  local_db() {
    docker exec -i safex-db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot "$@"' sh "$@"
  }

  echo "— dump Aiven ($STAMP)"
  aiven mysqldump --single-transaction --skip-lock-tables --set-gtid-purged=OFF \
    --routines --triggers --no-tablespaces --hex-blob --default-character-set=utf8mb4 \
    --databases defaultdb healthsafety > "$DUMP"
  tail -n 1 "$DUMP" | grep -q 'Dump completed' || { echo "ÉCHEC : dump incomplet" >&2; exit 1; }
  # Les triggers portent DEFINER=`avnadmin`@`%`, compte qui n'existe pas ici.
  sed -i -E 's/DEFINER=`[^`]+`@`[^`]+`//g' "$DUMP"
  chmod 600 "$DUMP"
  echo "  $(du -h "$DUMP" | cut -f1)"

  echo "— remplacement des schémas dans safex-db"
  local_db -e "DROP DATABASE IF EXISTS defaultdb; DROP DATABASE IF EXISTS healthsafety;"
  local_db < "$DUMP"

  echo "— comptage exact table par table"
  local list_sql="SELECT CONCAT('SELECT ''', table_schema, '.', table_name, ''', COUNT(*) FROM \`', table_schema, '\`.\`', table_name, '\`') FROM information_schema.tables WHERE table_schema IN ('defaultdb','healthsafety') AND table_type='BASE TABLE' ORDER BY 1"
  local union
  union="$(local_db -N -e "$list_sql" | paste -sd'|' | sed 's/|/ UNION ALL /g')"
  aiven mysql -N -e "$union" | sort > "$WORK/counts-aiven-$STAMP.txt"
  local_db -N -e "$union" | sort > "$WORK/counts-vps-$STAMP.txt"
  local tables
  tables="$(wc -l < "$WORK/counts-vps-$STAMP.txt")"
  if diff -u "$WORK/counts-aiven-$STAMP.txt" "$WORK/counts-vps-$STAMP.txt"; then
    echo "  IDENTIQUE : $tables tables, $(awk '{s+=$2} END {print s}' "$WORK/counts-vps-$STAMP.txt") lignes"
  else
    echo "ÉCART de comptage (voir le diff ci-dessus)" >&2
    exit 1
  fi
}

main "$@"
exit

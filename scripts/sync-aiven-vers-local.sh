#!/usr/bin/env bash
# =============================================================================
# sync-aiven-vers-local.sh — Synchronise la base Aiven (prod) vers le MySQL
# local Docker (conteneur safex-mysql). Sens : Aiven --> local UNIQUEMENT
# (lecture seule côté Aiven). Chaque schéma local est recréé (DROP + CREATE
# + import complet structure + données).
#
# Usage : bash scripts/sync-aiven-vers-local.sh [schema...]   (défaut : defaultdb healthsafety)
# Prérequis : conteneur safex-mysql démarré ; Backend/.env avec DB_USERNAME,
# DB_PASSWORD, DB_LOCAL_ROOT_PASSWORD et DB_URL_AIVEN / DB_URL_HNS_AIVEN.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

# Charger .env (valeurs entre quotes simples gérées nativement par bash)
set -a; source Backend/.env; set +a

SCHEMAS=("${@:-defaultdb}" )
[ $# -eq 0 ] && SCHEMAS=(defaultdb healthsafety)

AIVEN_URL="${DB_URL_AIVEN:-$DB_URL}"
if [[ "$AIVEN_URL" =~ @([^:/@]+):([0-9]+)/ ]] || [[ "$AIVEN_URL" =~ //([^:/@]+):([0-9]+)/ ]]; then
  SRC_HOST="${BASH_REMATCH[1]}"; SRC_PORT="${BASH_REMATCH[2]}"
else
  echo "ERREUR : impossible d'extraire hote/port Aiven" >&2; exit 1
fi
if [[ "$SRC_HOST" == "localhost" || "$SRC_HOST" == "127.0.0.1" ]]; then
  echo "ERREUR : l'URL Aiven resolue pointe vers localhost — verifier DB_URL_AIVEN" >&2; exit 1
fi
docker ps --format '{{.Names}}' | grep -q '^safex-mysql$' || { echo "ERREUR : conteneur safex-mysql arrete" >&2; exit 1; }

echo "Source  : $SRC_HOST:$SRC_PORT (Aiven, lecture seule)"
echo "Cible   : conteneur safex-mysql (localhost:3306)"
echo "Schemas : ${SCHEMAS[*]}"
echo

for DBN in "${SCHEMAS[@]}"; do
  echo "--- $DBN : recreation locale + dump Aiven + import..."
  t0=$(date +%s)
  docker exec -e ROOT_PW="$DB_LOCAL_ROOT_PASSWORD" -e DBN="$DBN" safex-mysql sh -c \
    'mysql -uroot -p"$ROOT_PW" -e "DROP DATABASE IF EXISTS $DBN; CREATE DATABASE $DBN CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"' 2>/dev/null
  docker exec -e SRC_PW="$DB_PASSWORD" -e ROOT_PW="$DB_LOCAL_ROOT_PASSWORD" -e DBN="$DBN" \
    -e SRC_HOST="$SRC_HOST" -e SRC_PORT="$SRC_PORT" -e SRC_USER="$DB_USERNAME" safex-mysql sh -c \
    'mysqldump --host="$SRC_HOST" --port="$SRC_PORT" --user="$SRC_USER" --password="$SRC_PW" --ssl-mode=REQUIRED --single-transaction --skip-lock-tables --set-gtid-purged=OFF --routines --triggers --no-tablespaces "$DBN" 2>/dev/null | mysql -uroot -p"$ROOT_PW" "$DBN" 2>/dev/null'
  n=$(docker exec -e ROOT_PW="$DB_LOCAL_ROOT_PASSWORD" -e DBN="$DBN" safex-mysql sh -c \
    'mysql -uroot -p"$ROOT_PW" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = \"$DBN\""' 2>/dev/null)
  echo "    OK — $n tables importees en $(( $(date +%s) - t0 ))s"
done

echo
echo "Synchronisation terminee. Les services locaux utilisent ces donnees via localhost:3306."

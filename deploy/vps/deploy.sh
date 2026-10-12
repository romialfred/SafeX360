#!/bin/bash
# Déploie une révision de SafeX sur le VPS : extraction, build, redémarrage.
#
# Usage (root, sur le VPS) : /srv/safex/src/deploy/vps/deploy.sh [<sha>|origin/main]
# Appelé par GitHub Actions via /srv/safex/bin/ci-deploy (commande forcée SSH).
#
# Échoue en code non nul si un service ne devient pas « healthy » : ne jamais
# lancer ce script derrière un `| tail`, qui masquerait l'échec.
#
# Tout le corps est dans main() : bash lit alors le script en entier avant de
# l'exécuter, et le `git checkout` qui réécrit ce fichier en cours de route
# reste sans effet sur l'exécution.
set -euo pipefail

main() {
  local ROOT=/srv/safex
  local REF="${1:-origin/main}"
  local COMPOSE_DIR="$ROOT/src/deploy/vps"

  exec 9>"$ROOT/deploy.lock"
  flock -n 9 || { echo "Un déploiement est déjà en cours." >&2; exit 1; }

  echo "— extraction de $REF"
  git -C "$ROOT/src" fetch --quiet --prune origin
  git -C "$ROOT/src" checkout --quiet --force --detach "$REF"
  local REVISION
  REVISION="$(git -C "$ROOT/src" rev-parse --short=12 HEAD)"
  echo "  révision $REVISION"

  # Sans ces deux mots de passe, docker compose démarrerait safex-db avec une
  # valeur vide : on s'arrête avant.
  local var
  for var in SAFEX_DB_ROOT_PASSWORD SAFEX_DB_PASSWORD; do
    grep -q "^${var}=." "$ROOT/env/compose.env" \
      || { echo "ÉCHEC : $var absent de $ROOT/env/compose.env" >&2; exit 1; }
  done

  # Images étiquetées « current » : compose ne recrée que les conteneurs dont
  # l'image a réellement changé. La révision déployée est tracée à part.
  export SAFEX_REVISION="$REVISION" SAFEX_ENV_DIR="$ROOT/env"
  compose() { docker compose --project-directory "$COMPOSE_DIR" --env-file "$ROOT/env/compose.env" "$@"; }

  echo "— construction des images"
  compose build

  echo "— démarrage"
  compose up -d --remove-orphans

  echo "— attente de l'état healthy"
  local deadline=$((SECONDS + 420)) svc
  for svc in safex-db safex-eureka safex-minexpert safex-hns safex-gateway safex-web; do
    until [ "$(docker inspect -f '{{.State.Health.Status}}' "$svc" 2>/dev/null)" = healthy ]; do
      if (( SECONDS > deadline )); then
        echo "ÉCHEC : $svc n'est pas healthy. Derniers journaux :" >&2
        docker logs --tail 80 "$svc" >&2 || true
        exit 1
      fi
      sleep 5
    done
    echo "  $svc healthy"
  done

  echo "$REVISION" > "$ROOT/current-revision"
  docker image prune -f >/dev/null
  echo "— publication OK : $REVISION"
}

main "$@"
exit

#!/usr/bin/env bash
#
# Déclenche un déploiement Render pour UN service et attend son issue.
# Sort en échec (exit 1) si le déploiement échoue AU BUILD *ou AU DÉMARRAGE* :
# ainsi une erreur de boot (ex. requête JPQL invalide) apparaît en ROUGE dans
# GitHub Actions au lieu d'échouer en silence côté Render.
#
# Usage : render-deploy.sh <serviceId> <nomLisible>
# Requiert la variable d'environnement RENDER_API_KEY (secret GitHub).
set -euo pipefail

SVC="${1:?serviceId requis}"
NAME="${2:-$SVC}"
: "${RENDER_API_KEY:?RENDER_API_KEY manquant — ajoutez le secret dans GitHub (Settings > Secrets > Actions)}"

API="https://api.render.com/v1/services/${SVC}"
AUTH=(-H "Authorization: Bearer ${RENDER_API_KEY}" -H "Accept: application/json")

echo "▶ ${NAME} : déclenchement du déploiement…"
DEP=$(curl -fsS "${AUTH[@]}" -H "Content-Type: application/json" \
        -X POST "${API}/deploys" -d '{"clearCache":"do_not_clear"}' | jq -r '.id // empty')
if [ -z "${DEP}" ]; then
  echo "❌ ${NAME} : aucun identifiant de déploiement renvoyé par l'API Render."
  exit 1
fi
echo "   deploy=${DEP}"
echo "   suivi : https://dashboard.render.com/web/${SVC}/deploys/${DEP}"

# ~20 min max (80 × 15 s) — un build Docker + boot HNS tourne ~4 min.
for i in $(seq 1 80); do
  ST=$(curl -fsS "${AUTH[@]}" "${API}/deploys/${DEP}" | jq -r '.status // "unknown"')
  echo "   [$((i * 15))s] status=${ST}"
  case "${ST}" in
    live)
      echo "✅ ${NAME} : déployé et démarré (live)."
      exit 0 ;;
    build_failed|update_failed|pre_deploy_failed|canceled|deactivated)
      echo "❌ ${NAME} : ÉCHEC (${ST}). Consultez les logs de déploiement Render ci-dessus."
      exit 1 ;;
  esac
  sleep 15
done

echo "⏱ ${NAME} : délai d'attente dépassé (le déploiement est peut-être encore en cours)."
exit 1

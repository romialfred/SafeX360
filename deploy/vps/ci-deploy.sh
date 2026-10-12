#!/bin/bash
# Commande forcée de la clé SSH de déploiement GitHub Actions.
#
# Installée en /srv/safex/bin/ci-deploy et référencée dans authorized_keys par
#   command="/srv/safex/bin/ci-deploy",restrict ssh-ed25519 … safex-ci-deploy
# La clé ne peut donc rien faire d'autre que déployer un commit de SafeX : le
# seul argument accepté est un SHA git complet (40 caractères hexadécimaux).
set -euo pipefail

SHA="${SSH_ORIGINAL_COMMAND:-}"
if [[ ! "$SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Refusé : un SHA de commit complet est attendu." >&2
  exit 2
fi

LOG="/srv/safex/logs/deploy-$(date -u +%Y%m%d-%H%M%S)-${SHA:0:12}.log"
install -d -m 700 /srv/safex/logs
set +e
/srv/safex/src/deploy/vps/deploy.sh "$SHA" 2>&1 | tee "$LOG"
status=${PIPESTATUS[0]}
set -e
exit "$status"

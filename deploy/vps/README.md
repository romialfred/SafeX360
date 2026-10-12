# SafeX 360 — production sur le VPS Hostinger

Depuis octobre 2026, SafeX ne tourne plus sur Render + Vercel + Aiven : tout est
sur le VPS Hostinger partagé avec les autres applications (Wellnesscare, CACI,
Consilia), en conteneurs Docker.

```
Internet ──443──▶ wcp-caddy (proxy partagé, TLS Let's Encrypt)
                     │ safex360.data-univers.com
                     ▼
                  safex-web (Caddy : SPA + en-têtes/CSP)
                     │ /hrms/*  /hns/*  (même origine, WebSocket compris)
                     ▼
                  safex-gateway :9000 ──▶ safex-minexpert :8080 (/hrms)
                                      └─▶ safex-hns       :8081 (/hns)
                  safex-eureka :8761         │
                                             ▼
                                  safex-db (MySQL 8.0, defaultdb + healthsafety)
```

## Arborescence sur le VPS

| Chemin | Rôle |
|---|---|
| `/srv/safex/src` | clone du dépôt GitHub, extrait par `deploy.sh` sur le commit déployé |
| `/srv/safex/env/*.env` | secrets, un fichier par service + `compose.env` (chmod 600, hors dépôt) |
| `/srv/safex/bin/ci-deploy` | commande forcée de la clé SSH GitHub Actions |
| `/srv/safex/backups` | dumps quotidiens (`backup.sh`, cron 02:30 UTC, 14 jours) |
| `/srv/safex/logs` | journaux des déploiements CI |

## Gestes courants

- **Déployer** : pousser sur `main` (workflow `vps-deploy.yml`), ou à la main
  `ssh root@VPS /srv/safex/src/deploy/vps/deploy.sh origin/main`.
- **Journaux** : `docker logs -f safex-hns` (idem `safex-minexpert`, `safex-gateway`).
- **Base en local** : tunnel `ssh -L 3307:127.0.0.1:3307 root@VPS`, puis
  `localhost:3307` (utilisateur applicatif ou root, voir `compose.env`).
- **Sauvegarde manuelle** : `/srv/safex/src/deploy/vps/backup.sh`.
- **Restauration** : `zcat dump.sql.gz | docker exec -i safex-db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot'`.

## Règles de cohabitation

- Aucun port public : seul `safex-web` rejoint le réseau `wcp-proxy`.
- Le proxy partagé (`/srv/_proxy/Caddyfile`) ne contient qu'un bloc SafeX :
  le sauvegarder, `caddy validate`, puis `caddy reload` (jamais de restart).
- `wcp-mysql` (8.4, partagé) n'est pas utilisé : SafeX exige le `sql_mode`
  ANSI d'Aiven, réglage global qui casserait les autres applications.

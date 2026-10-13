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
| `/srv/safex/bin/backup-export` | commande forcée de la clé `safex-backup-pull` (copie hors serveur) |
| `/srv/safex/logs` | journaux des déploiements CI |

## Gestes courants

- **Déployer** : pousser sur `main` (workflow `vps-deploy.yml`), ou à la main
  `ssh root@VPS /srv/safex/src/deploy/vps/deploy.sh origin/main`.
- **Journaux** : `docker logs -f safex-hns` (idem `safex-minexpert`, `safex-gateway`).
- **Base en local** : tunnel `ssh -L 3307:127.0.0.1:3307 root@VPS`, puis
  `localhost:3307` (utilisateur applicatif ou root, voir `compose.env`).
- **Sauvegarde manuelle** : `/srv/safex/src/deploy/vps/backup.sh`.
- **Copie hors serveur** : la tâche planifiée Windows « SafeX - copie hors
  serveur » du PC de l'administrateur lance `pull-backup.ps1` chaque jour à
  10:00 et garde 30 jours de dumps dans `D:\SafeX-Backups` (journal :
  `journal.txt`). Sans elle, une perte du VPS emporterait aussi les sauvegardes.
- **Restauration** : `zcat dump.sql.gz | docker exec -i safex-db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot'`.

## Origines autorisées (CORS, CSRF, WebSocket)

Le gateway est le seul point d'entrée : sa variable `SAFEX_ALLOWED_ORIGINS`
(`/srv/safex/env/gateway.env`) décide des origines acceptées en production.
Elle ne doit contenir que des origines réellement servies :

| Origine | Usage |
|---|---|
| `https://safex360.data-univers.com` | application web (même origine) |
| `https://localhost`, `capacitor://localhost` | APK SafeX 360 Field (WebView Capacitor) |
| `https://mine-xpert.data-univers.com` | front MineXpert, autre application qui appelle `/hrms` |

Jamais d'origine `http://` de développement ni de domaine d'hébergement partagé
(`*.vercel.app`, `*.onrender.com`) : n'importe qui peut y publier une page, et le
cookie `jwt` est envoyé en `SameSite=None`. Après modification, relancer
`deploy.sh` : compose recrée le conteneur dont l'environnement a changé.

## Anciens hébergements

- **Vercel** (`safex360.vercel.app`) : `Frontend/vercel.json` ne contient plus
  qu'une redirection permanente (308) vers `https://safex360.data-univers.com`,
  pour les favoris et liens anciens. L'application n'y est plus servie.
- **Render** `safex360-gateway` : relais des APK ≤ v2.4, qui appellent encore
  `safex360-gateway.onrender.com` ; il transmet au VPS. À supprimer quand plus
  aucun terminal n'utilise ces versions. `safex360-minexpert`, `safex360-hns`
  et `safex360-eureka` sont suspendus : ne jamais les réactiver (ils écriraient
  dans Aiven).
- **Aiven** : base figée au 2026-10-12, gardée en secours. Son mot de passe a
  fuité dans l'historique public du dépôt : la supprimer dès que la production
  VPS est validée.

## Règles de cohabitation

- Aucun port public : seul `safex-web` rejoint le réseau `wcp-proxy`.
- Le proxy partagé (`/srv/_proxy/Caddyfile`) ne contient qu'un bloc SafeX :
  le sauvegarder, `caddy validate`, puis `caddy reload` (jamais de restart).
- `wcp-mysql` (8.4, partagé) n'est pas utilisé : SafeX exige le `sql_mode`
  ANSI d'Aiven, réglage global qui casserait les autres applications.

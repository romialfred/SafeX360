# -*- coding: utf-8 -*-
"""
Seed des activites de reference TDM (Tournees De Management) manquantes.

Corrige BUG-6 du rapport testeur : le dropdown « Activite de reference » du
formulaire « Nouvelle tournee Leadership » est vide car aucune activite
year=2026 / status=PENDING / category=TDM n'existe en base. Ce script les cree
via l'API (POST /hns/activity/create) — ce qui EVINCE proprement le cache
@Cacheable PLANNED_ACTIVITIES_FILTERED (un INSERT SQL direct ne le viderait pas
et le dropdown resterait vide jusqu'au redemarrage HNS).

Idempotent : ne cree que les activites TDM dont le titre n'existe pas deja pour
l'annee cible.

Usage :
    python seed_reference_activities.py                 # DRY-RUN local  (lecture seule)
    python seed_reference_activities.py --apply         # applique en LOCAL
    python seed_reference_activities.py --env prod       # DRY-RUN prod   (lecture seule)
    python seed_reference_activities.py --env prod --apply   # applique en PROD

Auth : compte admin (login/mdp surchargeables via --login / --password).
"""
import sys
import argparse
import requests

YEAR = 2026
CATEGORY = "TDM"

GATEWAYS = {
    "local": "http://localhost:9100",
    "prod": "https://safex360-gateway.onrender.com",
}

# Activites TDM de reference a garantir pour l'annee (titre -> 1er jour du mois).
# 4 tournees trimestrielles + revues mensuelles cles : de quoi alimenter le
# dropdown « Activite de reference » des tournees Leadership.
TDM_ACTIVITIES = [
    ("Tournee Leadership - T1 2026", f"{YEAR}-01-15"),
    ("Tournee Leadership - T2 2026", f"{YEAR}-04-15"),
    ("Tournee Leadership - T3 2026", f"{YEAR}-07-15"),
    ("Tournee Leadership - T4 2026", f"{YEAR}-10-15"),
    ("Revue Direction HSE - S1 2026", f"{YEAR}-06-30"),
    ("Revue Direction HSE - S2 2026", f"{YEAR}-12-31"),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--env", choices=["local", "prod"], default="local")
    ap.add_argument("--apply", action="store_true", help="ecrit reellement (sinon dry-run lecture seule)")
    ap.add_argument("--login", default="admin")
    ap.add_argument("--password", default="Admin@2026")
    args = ap.parse_args()

    base = GATEWAYS[args.env]
    mode = "APPLY" if args.apply else "DRY-RUN (lecture seule)"
    print(f"== Seed activites TDM {YEAR} | env={args.env} ({base}) | {mode} ==")

    s = requests.Session()
    # 1) Login -> cookie jwt
    r = s.post(f"{base}/hrms/auth/login",
               json={"login": args.login, "password": args.password}, timeout=60)
    if r.status_code != 200:
        print(f"[ERREUR] login {args.login} -> HTTP {r.status_code} : {r.text[:200]}")
        sys.exit(1)
    print(f"[OK] connecte en tant que {args.login}")

    # 2) Etat existant (idempotence) : activites TDM/PENDING de l'annee
    url_list = f"{base}/hns/activity/get/year/{YEAR}/status/PENDING/category/{CATEGORY}"
    r = s.get(url_list, timeout=60)
    if r.status_code != 200:
        print(f"[ERREUR] lecture activites -> HTTP {r.status_code} : {r.text[:200]}")
        sys.exit(1)
    existing = r.json() if r.text else []
    existing_titles = {a.get("title") for a in existing}
    print(f"[INFO] {len(existing)} activite(s) TDM/PENDING deja presentes pour {YEAR}")

    # 3) Diagnostic locations (Select « Site » des inspections)
    rl = s.get(f"{base}/hns/locations/getAllActive", timeout=60)
    nloc = len(rl.json()) if rl.status_code == 200 and rl.text else 0
    print(f"[INFO] {nloc} lieu(x) actif(s) (alimente le Select 'Site' des inspections)")
    if nloc == 0:
        print("       -> ATTENTION : aucun lieu actif ; le Select 'Site' restera vide.")

    # 4) Creation des manquantes
    to_create = [(t, m) for (t, m) in TDM_ACTIVITIES if t not in existing_titles]
    if not to_create:
        print("[OK] Rien a creer : toutes les activites TDM de reference existent deja.")
        return
    print(f"[PLAN] {len(to_create)} activite(s) a creer :")
    for t, m in to_create:
        print(f"        - {t} ({m})")

    if not args.apply:
        print("\n[DRY-RUN] Aucune ecriture. Relancer avec --apply pour creer.")
        return

    created = 0
    for title, month in to_create:
        payload = {"title": title, "month": month, "category": CATEGORY, "status": "PENDING"}
        rc = s.post(f"{base}/hns/activity/create", json=payload, timeout=60)
        if rc.status_code in (200, 201):
            created += 1
            print(f"  [CREE] {title}")
        else:
            print(f"  [ECHEC] {title} -> HTTP {rc.status_code} : {rc.text[:160]}")
    print(f"\n[FIN] {created}/{len(to_create)} activite(s) creee(s). Cache evince (API).")


if __name__ == "__main__":
    main()

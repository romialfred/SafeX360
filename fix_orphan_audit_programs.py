# -*- coding: utf-8 -*-
"""
Rattache les programmes d'audit orphelins (company_id NULL) a une mine.

Contexte : avant le fix BUG-8 (commit b23a3a4), AuditProgramAPI.createProgram
ne persistait pas le companyId injecte -> programmes crees avec company_id=NULL,
donc INVISIBLES dans la liste filtree par mine. Ce script les recupere en leur
affectant le companyId cible, via l'API PUT /audit-program/update (updateProgram
applique bien companyId si non-null). Idempotent : n'agit que sur les NULL.

Usage :
    python fix_orphan_audit_programs.py                       # DRY-RUN local
    python fix_orphan_audit_programs.py --env prod            # DRY-RUN prod
    python fix_orphan_audit_programs.py --env prod --company 1 --apply
"""
import sys
import time
import argparse
import requests

GATEWAYS = {"local": "http://localhost:9100", "prod": "https://safex360-gateway.onrender.com"}


def req_retry(fn, *, tries=5, delay=6):
    last = None
    for _ in range(tries):
        last = fn()
        if last.status_code < 500:
            return last
        time.sleep(delay)
    return last


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--env", choices=["local", "prod"], default="local")
    ap.add_argument("--company", type=int, default=1, help="companyId cible (Burkina GOLD SA = 1)")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--login", default="SAFEX360DEMO")
    ap.add_argument("--password", default="Demo@2026")
    args = ap.parse_args()

    base = GATEWAYS[args.env]
    mode = "APPLY" if args.apply else "DRY-RUN (lecture seule)"
    print(f"== Rattachement programmes d'audit orphelins | env={args.env} | companyId={args.company} | {mode} ==")

    s = requests.Session()
    r = req_retry(lambda: s.post(f"{base}/hrms/auth/login",
                  json={"login": args.login, "password": args.password}, timeout=60))
    if r.status_code != 200:
        print(f"[ERREUR] login -> HTTP {r.status_code} : {r.text[:200]}"); sys.exit(1)
    print(f"[OK] connecte en tant que {args.login}")

    # getAll sans companyId -> tous les programmes (query :companyId IS NULL OR ...)
    r = req_retry(lambda: s.get(f"{base}/hns/audit-program/getAll", timeout=60))
    if r.status_code != 200:
        print(f"[ERREUR] getAll -> HTTP {r.status_code} : {r.text[:200]}"); sys.exit(1)
    programs = r.json() if r.text else []
    orphans = [p for p in programs if p.get("companyId") is None]
    print(f"[INFO] {len(programs)} programme(s) total, {len(orphans)} orphelin(s) (companyId=NULL)")
    for p in orphans:
        print(f"        - id {p.get('id')} : {str(p.get('title'))[:50]}")
    if not orphans:
        print("[OK] Aucun orphelin a rattacher."); return
    if not args.apply:
        print("\n[DRY-RUN] Aucune ecriture. Relancer avec --apply."); return

    fixed = 0
    for p in orphans:
        p["companyId"] = args.company
        rc = req_retry(lambda: s.put(f"{base}/hns/audit-program/update", json=p, timeout=60))
        if rc.status_code in (200, 201, 204):
            fixed += 1
            print(f"  [RATTACHE] id {p.get('id')} -> companyId={args.company}")
        else:
            print(f"  [ECHEC] id {p.get('id')} -> HTTP {rc.status_code} : {rc.text[:160]}")
    print(f"\n[FIN] {fixed}/{len(orphans)} programme(s) rattache(s) a la mine {args.company}.")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Seed des HEURES TRAVAILLÉES par département — octobre 2025 → mois courant (idempotent).

Alimente la nouvelle table `worked_hours_entry` (dénominateur des taux LTIFR/TRIFR/
gravité, ISO 45001 §9.1.1) pour TOUS les départements de TOUTES les mines visibles.
Passe par l'API (via la passerelle) : fonctionne identiquement en local et en prod,
respecte le cloisonnement, et l'endpoint /worked-hours-entries est un UPSERT
(rejouable sans doublon).

⚠ Prérequis : le backend HNS avec la table + les endpoints doit être DÉPLOYÉ.
⚠ JAMAIS de credentials en dur (dépôt public). Fournir par variables d'environnement.

Usage (bash) :
    SAFEX_BASE=https://safex360-gateway.onrender.com \
    SAFEX_LOGIN=Administrator SAFEX_PASSWORD='********' \
    python scripts/seed_worked_hours.py                # écrit
    ... python scripts/seed_worked_hours.py --dry      # simule (n'écrit rien)

PowerShell :
    $env:SAFEX_BASE='https://safex360-gateway.onrender.com'
    $env:SAFEX_LOGIN='Administrator'; $env:SAFEX_PASSWORD='********'
    python scripts/seed_worked_hours.py

Le compte utilisé ne doit PAS avoir la MFA activée (sinon utiliser un compte de
service dédié), sinon le login exigera un code TOTP que ce script ne fournit pas.
"""
import hashlib
import os
import sys
from datetime import date

try:
    import requests
except ImportError:
    raise SystemExit("Module 'requests' requis : pip install requests")

DRY = "--dry" in sys.argv
BASE = os.environ.get("SAFEX_BASE", "https://safex360-gateway.onrender.com").rstrip("/")
LOGIN = os.environ.get("SAFEX_LOGIN")
PASSWORD = os.environ.get("SAFEX_PASSWORD")

if not LOGIN or not PASSWORD:
    raise SystemExit("Définir SAFEX_LOGIN et SAFEX_PASSWORD dans l'environnement.")

# Période : octobre 2025 → mois courant inclus.
START = (2025, 10)


def month_range(start, today):
    y, m = start
    out = []
    while (y, m) <= (today.year, today.month):
        out.append((y, m))
        m += 1
        if m > 12:
            m = 1
            y += 1
    return out


def plausible_hours(company_id, dept_id, year, month):
    """Heures réalistes, DÉTERMINISTES (rejouable) et variées : ~6 000–18 000 h/mois,
    légère saisonnalité (décembre plus bas — congés)."""
    key = f"{company_id}-{dept_id}-{year}-{month}".encode()
    h = int(hashlib.md5(key).hexdigest(), 16)
    base = 6000 + (h % 12000)          # 6 000 .. 18 000
    if month == 12:
        base = int(base * 0.85)         # décembre : congés
    return round(base / 50) * 50        # arrondi à 50 h


def main():
    s = requests.Session()
    print(f"→ Connexion à {BASE} en tant que {LOGIN} …")
    r = s.post(f"{BASE}/hrms/auth/login", json={"login": LOGIN, "password": PASSWORD}, timeout=40)
    if r.status_code != 200:
        raise SystemExit(f"Login échoué (HTTP {r.status_code}) : {r.text[:200]}")
    body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    if isinstance(body, dict) and (body.get("mfaRequired") or body.get("mfa")):
        raise SystemExit("Ce compte exige la MFA (TOTP) : utilisez un compte sans MFA.")

    companies = s.get(f"{BASE}/hrms/company/getAll", timeout=40).json() or []
    months = month_range(START, date.today())
    print(f"→ {len(companies)} mine(s), {len(months)} mois (oct. 2025 → {months[-1][0]}-{months[-1][1]:02d})")

    total, written, skipped = 0, 0, 0
    for c in companies:
        cid = c.get("id")
        cname = c.get("name") or c.get("shortName") or f"#{cid}"
        if cid is None:
            continue
        deps = s.get(f"{BASE}/hrms/department/getByCompanyId/{cid}", timeout=40).json() or []
        print(f"\n  ● {cname} — {len(deps)} département(s)")
        for d in deps:
            did = d.get("id")
            if did is None:
                continue
            for (y, m) in months:
                total += 1
                hours = plausible_hours(cid, did, y, m)
                if DRY:
                    skipped += 1
                    continue
                resp = s.put(
                    f"{BASE}/hns/safety-metrics/worked-hours-entries",
                    params={"companyId": cid},
                    json={"year": y, "month": m, "departmentId": did, "hours": hours},
                    timeout=40,
                )
                if resp.status_code == 200:
                    written += 1
                else:
                    skipped += 1
                    if skipped <= 5:
                        print(f"      ! {d.get('name')} {y}-{m:02d} → HTTP {resp.status_code} {resp.text[:120]}")
        print(f"    ✓ {cname} traité")

    print(f"\n=== {'SIMULATION' if DRY else 'TERMINÉ'} : {total} cellules · {written} écrites · {skipped} ignorées ===")


if __name__ == "__main__":
    main()

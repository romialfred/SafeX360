#!/usr/bin/env python3
"""
Seed DIRECT (base de données) des HEURES TRAVAILLÉES par département — oct. 2025 → date.

Version simple, sans login ni MFA : écrit directement dans la base, comme les autres
seeds du dépôt (même patron que complete-demo-statuses.py). Les départements
(schéma defaultdb / HRMS) et les heures (schéma healthsafety / HNS) sont sur le
MÊME serveur (local ET Aiven) → une seule connexion suffit.

Idempotent : INSERT ... ON DUPLICATE KEY UPDATE (rejouable sans doublon). Crée la
table worked_hours_entry si le déploiement HNS ne l'a pas encore fait.

⚠ JAMAIS de credentials en dur : lus depuis Backend/.env (comme les autres scripts).

Usage :
  python scripts/seed_worked_hours_db.py local        # MySQL Docker local
  python scripts/seed_worked_hours_db.py aiven        # Prod Aiven (SSL)
  python scripts/seed_worked_hours_db.py aiven --dry  # simule (ne écrit rien)
"""
import hashlib
import re
import ssl
import sys
from datetime import date

import pymysql

# Sortie UTF-8 quel que soit le codepage de la console (Windows cp1252, etc.).
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

DRY = "--dry" in sys.argv
TARGET = "aiven" if "aiven" in sys.argv else "local"
START = (2025, 10)  # octobre 2025


def load_env(path="Backend/.env"):
    env = {}
    for line in open(path, encoding="utf-8", errors="ignore"):
        m = re.match(r"\s*([A-Z_]+)\s*=\s*'?([^'\r\n]*)'?", line)
        if m:
            env[m.group(1)] = m.group(2)
    return env


def connect(env):
    """Connexion au SERVEUR (base healthsafety) ; defaultdb est requêté qualifié."""
    if TARGET == "local":
        return pymysql.connect(
            host="127.0.0.1", port=3306,
            user=env.get("DB_USERNAME", "root"), password=env.get("DB_PASSWORD", ""),
            database="healthsafety", autocommit=False, cursorclass=pymysql.cursors.Cursor)
    m = re.search(r"//(?:([^:@/]+)(?::([^@/]+))?@)?([^:/]+):(\d+)/([^?]+)", env["DB_URL_HNS_AIVEN"])
    user = m.group(1) or env.get("DB_USERNAME")
    pwd = m.group(2) or env.get("DB_PASSWORD")
    host, port, dbname = m.group(3), int(m.group(4)), m.group(5)
    ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
    return pymysql.connect(host=host, port=port, user=user, password=pwd, database=dbname,
                           ssl=ctx, autocommit=False, cursorclass=pymysql.cursors.Cursor, connect_timeout=30)


CREATE_SQL = """
CREATE TABLE IF NOT EXISTS worked_hours_entry (
  id BIGINT NOT NULL AUTO_INCREMENT,
  company_id BIGINT,
  `year` INT,
  `month` INT,
  labor_type VARCHAR(16),
  department_id BIGINT,
  subcontractor_name VARCHAR(160),
  hours DOUBLE,
  created_at DATETIME(6),
  updated_at DATETIME(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_whe_dept (company_id, `year`, `month`, department_id),
  UNIQUE KEY uk_whe_sub (company_id, `year`, `month`, subcontractor_name),
  KEY idx_whe_company_year (company_id, `year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""

UPSERT_SQL = """
INSERT INTO worked_hours_entry
  (company_id, `year`, `month`, labor_type, department_id, subcontractor_name, hours, created_at, updated_at)
VALUES (%s, %s, %s, 'DEPARTMENT', %s, NULL, %s, NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE hours = VALUES(hours), updated_at = NOW(6);
"""


def month_range(start, today):
    y, m = start; out = []
    while (y, m) <= (today.year, today.month):
        out.append((y, m)); m += 1
        if m > 12: m, y = 1, y + 1
    return out


def plausible_hours(cid, did, y, mth):
    h = int(hashlib.md5(f"{cid}-{did}-{y}-{mth}".encode()).hexdigest(), 16)
    base = 6000 + (h % 12000)
    if mth == 12: base = int(base * 0.85)
    return round(base / 50) * 50


def main():
    env = load_env()
    conn = connect(env)
    cur = conn.cursor()
    months = month_range(START, date.today())
    print(f"Cible: {TARGET} · période oct. 2025 → {months[-1][0]}-{months[-1][1]:02d} ({len(months)} mois){' · DRY' if DRY else ''}")

    if not DRY:
        cur.execute(CREATE_SQL)

    cur.execute("SELECT id, name, company_id FROM defaultdb.department WHERE company_id IS NOT NULL ORDER BY company_id, id")
    deps = cur.fetchall()
    cur.execute("SELECT id, name FROM defaultdb.company")
    cnames = {r[0]: r[1] for r in cur.fetchall()}
    print(f"{len(deps)} département(s) sur {len(cnames)} mine(s)")

    total = written = 0
    for (did, dname, cid) in deps:
        for (y, mth) in months:
            total += 1
            if DRY:
                continue
            cur.execute(UPSERT_SQL, (cid, y, mth, did, plausible_hours(cid, did, y, mth)))
            written += 1
    if not DRY:
        conn.commit()

    # Récapitulatif par mine (total heures) — seulement hors DRY (table présente).
    if not DRY:
        print("\nRécapitulatif (heures cumulées par mine) :")
        cur.execute("SELECT company_id, COALESCE(SUM(hours),0) FROM worked_hours_entry GROUP BY company_id")
        for (cid, tot) in cur.fetchall():
            print(f"  ● {cnames.get(cid, '#'+str(cid))} : {int(tot):,} h".replace(",", " "))

    cur.close(); conn.close()
    print(f"\n=== {'SIMULATION' if DRY else 'TERMINÉ'} : {total} cellules · {written} écrites ===")


if __name__ == "__main__":
    main()

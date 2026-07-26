#!/usr/bin/env python3
"""Seed de prises de connaissance de la Politique SST (adhésion §5.4).

Pour chaque mine, marque ~68 % de ses employés actifs comme ayant pris
connaissance de la politique EN VIGUEUR, avec des dates réparties sur les 6
derniers mois (pour alimenter l'histogramme mensuel et l'indicateur « ce mois »).

Le tableau de bord rapproche l'employé de l'ack par emp_id ; account_id est NOT
NULL + unique(policy_id, account_id) → on pose un account_id SYNTHÉTIQUE
(900000 + emp_id), sans collision avec les vrais comptes et sans FK côté HNS.

Idempotent : on ne réinsère pas un ack déjà présent pour (policy_id, emp_id).

  python scripts/seed_policy_acknowledgements.py           -> base LOCALE
  python scripts/seed_policy_acknowledgements.py --prod    -> Aiven
"""
import re
import ssl
import sys
from datetime import datetime

import pymysql

RATIO = 0.68           # part des employés qui ont signé
ACCOUNT_OFFSET = 900000  # base des account_id synthétiques


def load_env(path="Backend/.env"):
    env = {}
    for line in open(path, encoding="utf-8", errors="ignore"):
        m = re.match(r"\s*([A-Z_]+)\s*=\s*'?([^'\r\n]*)'?", line)
        if m:
            env[m.group(1)] = m.group(2)
    return env


def connect(env, key, db, prod):
    if prod:
        m = re.search(r"//(?:([^:@/]+)(?::([^@/]+))?@)?([^:/]+):(\d+)/", env[key])
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return pymysql.connect(host=m.group(3), port=int(m.group(4)),
                               user=m.group(1) or env["DB_USERNAME"],
                               password=m.group(2) or env["DB_PASSWORD"],
                               database=db, ssl=ctx, autocommit=True, connect_timeout=30)
    return pymysql.connect(host="localhost", port=3306, user=env["DB_USERNAME"],
                           password=env["DB_PASSWORD"], database=db, autocommit=True, connect_timeout=30)


def date_for(i, now):
    """Date répartie sur les 6 derniers mois (i%6 = mois en arrière)."""
    off = i % 6
    y, mth = now.year, now.month - off
    while mth <= 0:
        mth += 12
        y -= 1
    day = 1 + (i * 7) % 25
    return datetime(y, mth, min(day, 28), 8 + (i % 9), (i * 13) % 60)


def main():
    prod = "--prod" in sys.argv
    env = load_env()
    now = datetime.now()

    hr = connect(env, "DB_URL_AIVEN" if prod else "DB_URL", "defaultdb", prod)
    hc = hr.cursor()
    hc.execute("SELECT id, name FROM company ORDER BY id")
    mines = hc.fetchall()

    hs = connect(env, "DB_URL_HNS_AIVEN" if prod else "DB_URL_HNS", "healthsafety", prod)
    cur = hs.cursor()

    print(f"Cible : {'PROD Aiven' if prod else 'LOCALE'}")
    for company_id, mine_name in mines:
        cur.execute("SELECT id FROM hs_policy WHERE company_id=%s AND status='PUBLISHED' "
                    "ORDER BY version DESC LIMIT 1", (company_id,))
        row = cur.fetchone()
        if not row:
            print(f"  {mine_name} (id={company_id}) : aucune politique publiée — ignoré")
            continue
        policy_id = row[0]

        hc.execute("SELECT id, CONCAT(first_name,' ',family_name) FROM employee "
                   "WHERE company_id=%s AND (effective_end_date IS NULL OR effective_end_date>CURDATE()) "
                   "ORDER BY id", (company_id,))
        emps = hc.fetchall()
        target = max(1, round(len(emps) * RATIO))
        chosen = emps[:target]

        inserted = 0
        for i, (emp_id, name) in enumerate(chosen):
            cur.execute("SELECT 1 FROM hs_policy_acknowledgement WHERE policy_id=%s AND emp_id=%s",
                        (policy_id, emp_id))
            if cur.fetchone():
                continue
            cur.execute(
                "INSERT INTO hs_policy_acknowledgement "
                "(account_id, acknowledged_at, company_id, emp_id, name, policy_id) "
                "VALUES (%s,%s,%s,%s,%s,%s)",
                (ACCOUNT_OFFSET + emp_id, date_for(i, now), company_id, emp_id, name, policy_id))
            inserted += 1
        print(f"  {mine_name} (id={company_id}) : {inserted} signatures ajoutées "
              f"({len(chosen)}/{len(emps)} employés ciblés)")

    hc.close(); hr.close()
    cur.close(); hs.close()
    print("Terminé.")


if __name__ == "__main__":
    main()

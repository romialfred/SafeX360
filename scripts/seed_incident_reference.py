#!/usr/bin/env python3
"""Référentiel incident COHÉRENT et idempotent, PAR MINE.

Pour chaque mine (defaultdb.company), garantit dans healthsafety :
  - les 9 catégories d'incident ISO (FR) ;
  - pour chaque catégorie, l'échelle de gravité standard 1..5 ;
  - pour chaque catégorie, 3 types HSE universels (presque-accident / incident /
    accident), rattachés à un niveau de gravité de LA MÊME catégorie/mine.

Idempotent : chaque ligne est créée seulement si absente (catégorie par
nom+mine ; gravité par catégorie+niveau ; type par catégorie+nom). Rejouable
sans doublon ; COMPLÈTE une mine partiellement seedée (ex. mine 6 qui avait les
catégories mais ni gravité ni types).

Cibles :
  python scripts/seed_incident_reference.py          -> base LOCALE
  python scripts/seed_incident_reference.py --prod    -> Aiven (healthsafety)
"""
import re
import ssl
import sys
from datetime import datetime

import pymysql

CATEGORIES = [
    "Santé et sécurité", "Environnement", "Dommage matériel",
    "Incendie et explosion", "Communauté", "Dynamitage",
    "Sûreté", "Transport", "Processus opérationnel",
]

# (niveau, nom, description)
SEVERITY = [
    (1, "Insignifiante", "Impact négligeable, aucune conséquence notable."),
    (2, "Mineure", "Conséquence légère, sans arrêt d'activité."),
    (3, "Modérée", "Conséquence significative nécessitant une intervention."),
    (4, "Majeure", "Conséquence grave : arrêt d'activité ou blessure sérieuse."),
    (5, "Critique", "Conséquence catastrophique (décès, sinistre majeur)."),
]

# (nom, description, niveau de gravité de référence)
TYPES = [
    ("Presque-accident", "Événement sans conséquence mais au potentiel d'accident.", 1),
    ("Incident", "Événement ayant entraîné une conséquence maîtrisée.", 3),
    ("Accident", "Événement ayant entraîné une conséquence grave.", 4),
]


def load_env(path="Backend/.env"):
    env = {}
    for line in open(path, encoding="utf-8", errors="ignore"):
        m = re.match(r"\s*([A-Z_]+)\s*=\s*'?([^'\r\n]*)'?", line)
        if m:
            env[m.group(1)] = m.group(2)
    return env


def connect(env, url_key, database, prod):
    if prod:
        m = re.search(r"//(?:([^:@/]+)(?::([^@/]+))?@)?([^:/]+):(\d+)/", env[url_key])
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return pymysql.connect(host=m.group(3), port=int(m.group(4)),
                               user=m.group(1) or env["DB_USERNAME"],
                               password=m.group(2) or env["DB_PASSWORD"],
                               database=database, ssl=ctx, autocommit=True, connect_timeout=30)
    return pymysql.connect(host="localhost", port=3306, user=env["DB_USERNAME"],
                           password=env["DB_PASSWORD"], database=database, autocommit=True,
                           connect_timeout=30)


def get_or_create_category(cur, company_id, name):
    cur.execute("SELECT id FROM incident_category WHERE company_id=%s AND name=%s", (company_id, name))
    row = cur.fetchone()
    if row:
        return row[0], False
    now = datetime.now()
    cur.execute("INSERT INTO incident_category (created_at,name,status,updated_at,company_id) "
                "VALUES (%s,%s,'ACTIVE',%s,%s)", (now, name, now, company_id))
    return cur.lastrowid, True


def get_or_create_severity(cur, cat_id, level, name, desc):
    cur.execute("SELECT id FROM severity_level WHERE incident_category_id=%s AND level=%s", (cat_id, level))
    row = cur.fetchone()
    if row:
        return row[0], False
    now = datetime.now()
    cur.execute("INSERT INTO severity_level (created_at,description,level,name,status,updated_at,incident_category_id,examples) "
                "VALUES (%s,%s,%s,%s,'ACTIVE',%s,%s,%s)", (now, desc, level, name, now, cat_id, "[]"))
    return cur.lastrowid, True


def ensure_type(cur, company_id, cat_id, sev_id, name, desc):
    cur.execute("SELECT id FROM incident_type WHERE incident_category_id=%s AND name=%s AND "
                "(company_id=%s OR (company_id IS NULL AND %s IS NULL))",
                (cat_id, name, company_id, company_id))
    if cur.fetchone():
        return False
    now = datetime.now()
    cur.execute("INSERT INTO incident_type (created_at,description,name,status,updated_at,incident_category_id,severity_level_id,company_id) "
                "VALUES (%s,%s,%s,'ACTIVE',%s,%s,%s,%s)", (now, desc, name, now, cat_id, sev_id, company_id))
    return True


def main():
    prod = "--prod" in sys.argv
    env = load_env()
    hr = connect(env, "DB_URL_AIVEN" if prod else "DB_URL", "defaultdb", prod)
    hc = hr.cursor()
    hc.execute("SELECT id, name FROM company ORDER BY id")
    mines = hc.fetchall()
    hc.close(); hr.close()

    hs = connect(env, "DB_URL_HNS_AIVEN" if prod else "DB_URL_HNS", "healthsafety", prod)
    cur = hs.cursor()
    print(f"Cible : {'PROD Aiven' if prod else 'LOCALE'} — {len(mines)} mine(s)")
    for company_id, mine_name in mines:
        c_new = s_new = t_new = 0
        for cat in CATEGORIES:
            cat_id, cc = get_or_create_category(cur, company_id, cat)
            c_new += cc
            sev_by_level = {}
            for level, sname, sdesc in SEVERITY:
                sid, sc = get_or_create_severity(cur, cat_id, level, sname, sdesc)
                sev_by_level[level] = sid
                s_new += sc
            for tname, tdesc, tlvl in TYPES:
                if ensure_type(cur, company_id, cat_id, sev_by_level[tlvl], tname, tdesc):
                    t_new += 1
        print(f"  {mine_name} (id={company_id}) : +{c_new} catégories, +{s_new} gravités, +{t_new} types")
    cur.close(); hs.close()
    print("Terminé.")


if __name__ == "__main__":
    main()

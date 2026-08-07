#!/usr/bin/env python3
"""Backfill media.company_id depuis les entités parentes cloisonnées (prod Aiven).

Audit pré-prod (IDOR médias) : la table `media` reçoit désormais un `company_id`.
Ce script renseigne les médias EXISTANTS (company_id NULL) à partir des tables
parentes qui portent à la fois media_id et company_id — en priorité les pièces de
conformité (photos/documents sensibles). Idempotent (ne touche que les NULL)."""
import re, ssl, sys
import pymysql
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

APPLY = "--apply" in sys.argv

# (table parente, colonne media_id) — toutes portent company_id
PARENTS = [
    ("compliance_docs", "media_id"),
    ("exploitation_license", "media_id"),
    ("work_authorization", "media_id"),
    ("mandatory_inspection", "media_id"),
]

def load_env(path="Backend/.env"):
    env = {}
    for line in open(path, encoding="utf-8", errors="ignore"):
        m = re.match(r"\s*([A-Z_]+)\s*=\s*'?([^'\r\n]*)'?", line)
        if m: env[m.group(1)] = m.group(2)
    return env

env = load_env()
m = re.search(r"//(?:([^:@/]+)(?::([^@/]+))?@)?([^:/]+):(\d+)/", env["DB_URL_HNS_AIVEN"])
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
conn = pymysql.connect(host=m.group(3), port=int(m.group(4)), user=m.group(1), password=m.group(2),
                       database="healthsafety", ssl=ctx, autocommit=True, connect_timeout=30)
cur = conn.cursor()

# La colonne existe-t-elle (créée par ddl-auto au déploiement) ?
cur.execute("""SELECT COUNT(*) FROM information_schema.columns
               WHERE table_schema='healthsafety' AND table_name='media' AND column_name='company_id'""")
if cur.fetchone()[0] == 0:
    print("La colonne media.company_id n'existe pas encore — déployez d'abord le backend.")
    sys.exit(1)

cur.execute("SELECT COUNT(*) FROM media WHERE company_id IS NULL")
print(f"Médias sans company_id (avant) : {cur.fetchone()[0]}")

total = 0
for table, col in PARENTS:
    try:
        sql = (f"UPDATE media md JOIN {table} p ON p.{col} = md.id "
               f"SET md.company_id = p.company_id "
               f"WHERE md.company_id IS NULL AND p.company_id IS NOT NULL")
        if APPLY:
            n = cur.execute(sql)
        else:
            # dry-run : compter les lignes cibles
            cur.execute(f"SELECT COUNT(*) FROM media md JOIN {table} p ON p.{col} = md.id "
                        f"WHERE md.company_id IS NULL AND p.company_id IS NOT NULL")
            n = cur.fetchone()[0]
        print(f"  {table}: {n} média(s) {'rattachés' if APPLY else 'à rattacher'}")
        total += n
    except Exception as e:
        print(f"  {table}: ignoré ({e})")

cur.execute("SELECT COUNT(*) FROM media WHERE company_id IS NULL")
print(f"\nMédias sans company_id (après) : {cur.fetchone()[0]}")
print(f"{'APPLIQUÉ' if APPLY else 'DRY-RUN'} : {total} média(s)"
      + ("" if APPLY else "  (--apply pour écrire)"))
print("NB : les médias restant NULL (référencés par des listes CSV : incidents, "
      "inspections legacy…) restent lisibles ; les nouveaux médias sont cloisonnés dès leur création.")
cur.close(); conn.close()

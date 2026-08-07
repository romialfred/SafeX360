#!/usr/bin/env python3
"""ANALYSE (lecture seule) avant nettoyage : dépendances des 22 incidents
company_id=0, et tables fantômes de defaultdb. Aucune écriture."""
import re, ssl, sys
import pymysql
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

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
                       ssl=ctx, autocommit=True, connect_timeout=30)
cur = conn.cursor()

print("=" * 70)
print("VOLET A — 22 incidents healthsafety.incident WHERE company_id=0")
print("=" * 70)
cur.execute("SELECT id FROM healthsafety.incident WHERE company_id=0 ORDER BY id")
ids = [r[0] for r in cur.fetchall()]
print(f"Incidents ciblés ({len(ids)}) : {ids}")

# Toutes les FK qui pointent vers healthsafety.incident (dépendants directs)
cur.execute("""SELECT table_name, column_name FROM information_schema.KEY_COLUMN_USAGE
               WHERE referenced_table_schema='healthsafety' AND referenced_table_name='incident'
               ORDER BY table_name""")
fks = cur.fetchall()
print(f"\nTables avec FK -> incident ({len(fks)}) :")
if not ids:
    ids_sql = "NULL"
else:
    ids_sql = ",".join(str(i) for i in ids)
dependents = []
for t, col in fks:
    cur.execute(f"SELECT COUNT(*) FROM healthsafety.`{t}` WHERE `{col}` IN ({ids_sql})")
    n = cur.fetchone()[0]
    print(f"   {t}.{col} : {n} ligne(s) liée(s)")
    if n: dependents.append((t, col, n))

# Recherche aussi des colonnes *incident_id sans FK déclarée (soft refs)
cur.execute("""SELECT table_name, column_name FROM information_schema.columns
               WHERE table_schema='healthsafety' AND column_name LIKE '%incident_id%'
               ORDER BY table_name""")
print("\nColonnes '*incident_id' (dont soft-refs sans FK) :")
soft = []
for t, col in cur.fetchall():
    try:
        cur.execute(f"SELECT COUNT(*) FROM healthsafety.`{t}` WHERE `{col}` IN ({ids_sql})")
        n = cur.fetchone()[0]
        flag = "" if any(t == d[0] and col == d[1] for d in dependents) else " (soft-ref)"
        if n: print(f"   {t}.{col} : {n}{flag}"); soft.append((t, col, n))
    except Exception:
        pass

print("\n>>> Dépendants NON vides à supprimer en cascade AVANT les incidents :")
allrefs = {}
for t, col, n in dependents + soft:
    allrefs.setdefault((t, col), n)
for (t, col), n in allrefs.items():
    print(f"   {t}.{col} : {n}")

print("\n" + "=" * 70)
print("VOLET B — tables fantômes dans defaultdb (partagées avec healthsafety)")
print("=" * 70)
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='healthsafety'")
hs_tables = {r[0] for r in cur.fetchall()}
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='defaultdb'")
dd_tables = {r[0] for r in cur.fetchall()}
shared = sorted(hs_tables & dd_tables)
print(f"Tables de même nom (defaultdb ∩ healthsafety) : {len(shared)}")

safe_drop, keep_data, ambiguous = [], [], []
for t in shared:
    cur.execute(f"SELECT COUNT(*) FROM defaultdb.`{t}`"); dd = cur.fetchone()[0]
    cur.execute(f"SELECT COUNT(*) FROM healthsafety.`{t}`"); hs = cur.fetchone()[0]
    if dd == 0 and hs > 0:
        safe_drop.append(t)                 # stray HNS vide dans defaultdb, vraie donnée dans HS
    elif dd > 0:
        keep_data.append((t, dd, hs))       # a des données dans defaultdb -> NE PAS toucher
    else:
        ambiguous.append(t)                 # vide des deux cotes -> prudence

print(f"\n[SUPPRESSION SÛRE] vides dans defaultdb & pleines dans healthsafety ({len(safe_drop)}) :")
print("   " + ", ".join(safe_drop))
print(f"\n[À CONSERVER] données présentes dans defaultdb ({len(keep_data)}) :")
for t, dd, hs in keep_data: print(f"   {t} (defaultdb={dd}, healthsafety={hs})")
print(f"\n[AMBIGU — vides des deux côtés, NON supprimées par prudence] ({len(ambiguous)}) :")
print("   " + ", ".join(ambiguous))
cur.close(); conn.close()

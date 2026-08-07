#!/usr/bin/env python3
"""NETTOYAGE BD (prod Aiven). Dry-run par défaut ; --apply pour exécuter.

Volet A : suppression en cascade des 22 incidents healthsafety.company_id=0 et de
TOUS leurs descendants (découverte récursive via le graphe de clés étrangères).
Volet B : DROP des tables fantômes vides de defaultdb (stray HNS), hors collisions.
Idempotent, transactionnel pour le volet A."""
import re, ssl, sys
import pymysql
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

APPLY = "--apply" in sys.argv

def load_env(path="Backend/.env"):
    env = {}
    for line in open(path, encoding="utf-8", errors="ignore"):
        mm = re.match(r"\s*([A-Z_]+)\s*=\s*'?([^'\r\n]*)'?", line)
        if mm: env[mm.group(1)] = mm.group(2)
    return env

env = load_env()
mm = re.search(r"//(?:([^:@/]+)(?::([^@/]+))?@)?([^:/]+):(\d+)/", env["DB_URL_HNS_AIVEN"])
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
conn = pymysql.connect(host=mm.group(3), port=int(mm.group(4)), user=mm.group(1), password=mm.group(2),
                       ssl=ctx, autocommit=False, connect_timeout=30)
cur = conn.cursor()

SCHEMA = "healthsafety"

# --- graphe des FK de healthsafety : referenced_table -> [(child_table, child_col, ref_col)]
cur.execute("""SELECT referenced_table_name, table_name, column_name, referenced_column_name
               FROM information_schema.KEY_COLUMN_USAGE
               WHERE table_schema=%s AND referenced_table_schema=%s""", (SCHEMA, SCHEMA))
children = {}
for ref_t, child_t, child_c, ref_c in cur.fetchall():
    children.setdefault(ref_t, []).append((child_t, child_c, ref_c))

def pk_col(table):
    cur.execute("""SELECT column_name FROM information_schema.KEY_COLUMN_USAGE
                   WHERE table_schema=%s AND table_name=%s AND constraint_name='PRIMARY'
                   ORDER BY ordinal_position LIMIT 1""", (SCHEMA, table))
    r = cur.fetchone(); return r[0] if r else "id"

# --- BFS descendants : affected[table] = set(pk ids)
cur.execute(f"SELECT id FROM {SCHEMA}.incident WHERE company_id=0")
root_ids = [r[0] for r in cur.fetchall()]
affected = {"incident": set(root_ids)}
order = ["incident"]           # ordre de découverte (parents avant enfants)
frontier = [("incident", set(root_ids))]
while frontier:
    ref_t, ref_ids = frontier.pop(0)
    if not ref_ids: continue
    for child_t, child_c, ref_c in children.get(ref_t, []):
        ids_sql = ",".join(str(int(i)) for i in ref_ids)
        pk = pk_col(child_t)
        cur.execute(f"SELECT DISTINCT `{pk}` FROM {SCHEMA}.`{child_t}` WHERE `{child_c}` IN ({ids_sql})")
        new_ids = {r[0] for r in cur.fetchall() if r[0] is not None}
        if not new_ids: continue
        prev = affected.setdefault(child_t, set())
        delta = new_ids - prev
        if delta:
            prev |= delta
            if child_t not in order: order.append(child_t)
            frontier.append((child_t, delta))

print("=" * 70)
print(f"VOLET A — cascade des {len(root_ids)} incidents company_id=0")
print("=" * 70)
print("Descendants découverts (parent -> enfant) ; suppression EN SENS INVERSE :")
for t in order:
    print(f"   {t} : {len(affected[t])} ligne(s)")

if APPLY:
    try:
        cur.execute("SET FOREIGN_KEY_CHECKS=0")
        deleted = 0
        for t in reversed(order):
            pk = pk_col(t)
            ids_sql = ",".join(str(int(i)) for i in affected[t])
            n = cur.execute(f"DELETE FROM {SCHEMA}.`{t}` WHERE `{pk}` IN ({ids_sql})")
            print(f"   supprimé {t} : {n}")
            deleted += n
        cur.execute("SET FOREIGN_KEY_CHECKS=1")
        conn.commit()
        print(f"VOLET A APPLIQUÉ : {deleted} ligne(s) supprimées (commit).")
    except Exception as e:
        conn.rollback()
        print(f"VOLET A ROLLBACK (erreur) : {e}")
else:
    print("VOLET A : DRY-RUN (relancer avec --apply).")

# --- VOLET B : tables fantômes de defaultdb
print("\n" + "=" * 70)
print("VOLET B — DROP des tables fantômes vides de defaultdb")
print("=" * 70)
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='healthsafety'")
hs = {r[0] for r in cur.fetchall()}
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='defaultdb'")
dd = {r[0] for r in cur.fetchall()}
to_drop = []
for t in sorted(hs & dd):
    cur.execute(f"SELECT COUNT(*) FROM defaultdb.`{t}`"); ddn = cur.fetchone()[0]
    cur.execute(f"SELECT COUNT(*) FROM healthsafety.`{t}`"); hsn = cur.fetchone()[0]
    if ddn == 0 and hsn > 0:
        to_drop.append(t)
print(f"Tables à DROP (vides defaultdb, pleines healthsafety) : {len(to_drop)}")
if APPLY:
    cur.execute("SET FOREIGN_KEY_CHECKS=0")
    for t in to_drop:
        cur.execute(f"DROP TABLE defaultdb.`{t}`")
    cur.execute("SET FOREIGN_KEY_CHECKS=1")
    conn.commit()
    print(f"VOLET B APPLIQUÉ : {len(to_drop)} table(s) supprimées de defaultdb (commit).")
else:
    print("   " + ", ".join(to_drop))
    print("VOLET B : DRY-RUN (relancer avec --apply).")
cur.close(); conn.close()

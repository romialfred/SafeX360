#!/usr/bin/env python3
"""Diagnostic : etat reel de worked_hours_entry en prod Aiven (lecture seule)."""
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
m = re.search(r"//(?:([^:@/]+)(?::([^@/]+))?@)?([^:/]+):(\d+)/([^?]+)", env["DB_URL_HNS_AIVEN"])
user = m.group(1) or env.get("DB_USERNAME"); pwd = m.group(2) or env.get("DB_PASSWORD")
host, port, dbname = m.group(3), int(m.group(4)), m.group(5)
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
conn = pymysql.connect(host=host, port=port, user=user, password=pwd, database=dbname,
                       ssl=ctx, autocommit=True, connect_timeout=30)
cur = conn.cursor()

print(f"=== Serveur Aiven, base HNS = {dbname} ===")
cur.execute("SHOW TABLES LIKE 'worked_hours_entry'")
exists = cur.fetchone()
print("Table worked_hours_entry existe :", bool(exists))
if not exists:
    print("!! La table n'existe PAS dans la base HNS prod.")
    sys.exit(0)

cur.execute("SELECT COUNT(*) FROM worked_hours_entry")
print("Nombre total de lignes :", cur.fetchone()[0])

cur.execute("SELECT company_id, `year`, COUNT(*), COALESCE(SUM(hours),0) FROM worked_hours_entry GROUP BY company_id, `year` ORDER BY company_id, `year`")
print("\ncompany_id | year | nb | somme_heures")
for (cid, y, n, s) in cur.fetchall():
    print(f"  {cid} | {y} | {n} | {int(s):,}".replace(",", " "))

# noms des mines
cur.execute("SELECT id, name FROM defaultdb.company ORDER BY id")
print("\nMines (defaultdb.company) :")
for (cid, name) in cur.fetchall():
    print(f"  id={cid} : {name}")

cur.close(); conn.close()

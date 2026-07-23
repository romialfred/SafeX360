#!/usr/bin/env python3
"""Reconnaissance LECTURE SEULE : schéma des tables du cycle incident + données de
référence par mine (Aiven prod). Sert de socle au générateur de données."""
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
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
conn = pymysql.connect(host=m.group(3), port=int(m.group(4)),
                       user=m.group(1) or env["DB_USERNAME"], password=m.group(2) or env["DB_PASSWORD"],
                       database="healthsafety", ssl=ctx, autocommit=True, connect_timeout=30)
cur = conn.cursor()

print("=== Tables healthsafety liées au cycle incident ===")
cur.execute("SHOW TABLES")
tabs = [r[0] for r in cur.fetchall()]
rel = [t for t in tabs if re.search(r"incident|investig|correct|effective|injur|analys|cause|non_conform|action", t, re.I)]
print(rel)

for t in ["incident", "incident_history", "incident_investigation", "investigation",
          "incident_analysis", "corrective_action", "incident_injury", "effectiveness_review",
          "effectiveness_check"]:
    if t in tabs:
        cur.execute(f"SHOW COLUMNS FROM `{t}`")
        cols = [(r[0], r[1], r[2], r[3]) for r in cur.fetchall()]  # name,type,null,key
        print(f"\n--- {t} ({len(cols)} cols) ---")
        for (n, ty, nu, k) in cols:
            print(f"  {n:32} {ty:22} null={nu:3} {k}")
        cur.execute(f"SELECT COUNT(*) FROM `{t}`")
        print(f"  [rows actuelles: {cur.fetchone()[0]}]")

print("\n\n=== Données de référence ===")
def dump(sql, title, lim=40):
    print(f"\n# {title}")
    try:
        cur.execute(sql)
        rows = cur.fetchall()
        for r in rows[:lim]:
            print("   ", r)
        if len(rows) > lim: print(f"    … (+{len(rows)-lim})")
    except Exception as e:
        print("   ERR:", e)

# catégories / sévérité / lieux (cloisonnés mine ?)
for t in ["incident_category", "severity_level", "location", "event_type", "body_part", "weather_condition"]:
    if t in tabs:
        cur.execute(f"SHOW COLUMNS FROM `{t}`"); cc=[r[0] for r in cur.fetchall()]
        comp = "company_id" if "company_id" in cc else None
        namecol = next((x for x in ["name","label","title"] if x in cc), cc[1] if len(cc)>1 else "id")
        dump(f"SELECT id, {namecol}" + (f", company_id" if comp else "") + f" FROM `{t}` ORDER BY id", f"{t} (cloisonné={bool(comp)})")

# départements + employés par mine (defaultdb)
dump("SELECT company_id, COUNT(*) FROM defaultdb.department WHERE company_id IN (1,6) GROUP BY company_id", "départements par mine")
dump("SELECT id, name, company_id FROM defaultdb.department WHERE company_id IN (1,6) ORDER BY company_id, id", "départements (détail)")
dump("SELECT company_id, COUNT(*) FROM defaultdb.employee WHERE company_id IN (1,6) GROUP BY company_id", "employés par mine")
dump("SELECT id, CONCAT(COALESCE(first_name,''),' ',COALESCE(last_name,'')) nom, company_id, department_id FROM defaultdb.employee WHERE company_id IN (1,6) ORDER BY company_id, id", "employés (échantillon)", lim=12)

# incidents existants par mine/année
dump("SELECT company_id, COUNT(*) FROM incident GROUP BY company_id", "incidents existants par mine")

cur.close(); conn.close()

#!/usr/bin/env python3
"""LECTURE SEULE : permissions modules (healthsafety) du compte 47. Aucun secret imprimé."""
import re, ssl, sys
import pymysql
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

ACCOUNT_ID = 47

def load_env(path="Backend/.env"):
    env = {}
    for line in open(path, encoding="utf-8", errors="ignore"):
        m = re.match(r"\s*([A-Z_]+)\s*=\s*'?([^'\r\n]*)'?", line)
        if m: env[m.group(1)] = m.group(2)
    return env

env = load_env()
m = re.search(r"//(?:([^:@/]+)(?::([^@/]+))?@)?([^:/]+):(\d+)/([^?]+)", env["DB_URL_HNS_AIVEN"])
user = m.group(1) or env.get("DB_USERNAME"); pwd = m.group(2) or env.get("DB_PASSWORD")
host, port = m.group(3), int(m.group(4))
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
conn = pymysql.connect(host=host, port=port, user=user, password=pwd, database="healthsafety",
                       ssl=ctx, autocommit=True, connect_timeout=30)
cur = conn.cursor()

cur.execute("""SELECT table_name FROM information_schema.tables
               WHERE table_schema='healthsafety'
                 AND (table_name LIKE '%perm%' OR table_name LIKE '%module%'
                      OR table_name LIKE '%account%' OR table_name LIKE '%role%')
               ORDER BY table_name""")
tbls = [r[0] for r in cur.fetchall()]
print("=== tables candidates (healthsafety) ===")
print(tbls)

for t in tbls:
    cur.execute(f"SHOW COLUMNS FROM `{t}`")
    cols = [r[0] for r in cur.fetchall()]
    print(f"\n--- {t} : {cols}")
    # colonne clé de compte ?
    acc_col = next((c for c in cols if c.lower() in
                    ("account_id", "accountid", "account", "acc_id")), None)
    allow_col = next((c for c in cols if "allow" in c.lower() or "module" in c.lower()), None)
    if acc_col:
        try:
            cur.execute(f"SELECT * FROM `{t}` WHERE `{acc_col}`=%s", (ACCOUNT_ID,))
            names = [d[0] for d in cur.description]
            rows = cur.fetchall()
            print(f"    lignes pour account {ACCOUNT_ID} : {len(rows)}")
            for r in rows:
                d = dict(zip(names, r))
                # imprime chaque colonne (tronque les longues)
                for k, v in d.items():
                    s = str(v)
                    print(f"      {k} = {s[:400]}{'…' if len(s) > 400 else ''}")
        except Exception as e:
            print(f"    (lecture impossible: {e})")

cur.close(); conn.close()

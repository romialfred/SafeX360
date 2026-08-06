#!/usr/bin/env python3
"""LECTURE SEULE : accès d'un compte (prod Aiven). Aucun secret imprimé."""
import re, ssl, sys
import pymysql
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

EMAIL = "viganbairiot2000@yahoo.fr"

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
conn = pymysql.connect(host=host, port=port, user=user, password=pwd, database="defaultdb",
                       ssl=ctx, autocommit=True, connect_timeout=30)
cur = conn.cursor()

cur.execute("SHOW COLUMNS FROM account")
cols = [r[0] for r in cur.fetchall()]
def has(*c): return [x for x in c if x in cols]
sel = ["id", "login", "email"]
for c in ["name", "role", "status", "identity_source", "identitySource",
          "all_mines_access", "allMinesAccess", "company_id", "companyId"]:
    if c in cols and c not in sel: sel.append(c)

print("=== account columns ===")
print(cols)
print(f"\n=== compte {EMAIL} (defaultdb.account) ===")
cur.execute(f"SELECT {', '.join(sel)} FROM account WHERE email=%s OR login=%s", (EMAIL, EMAIL))
rows = cur.fetchall()
print(" | ".join(sel))
acct_id = None
for r in rows:
    print(" | ".join(str(x) for x in r))
    acct_id = r[0]
if not rows:
    print("(aucun compte trouvé pour cet email/login)")

# assigned mines (multi-mines)
if acct_id is not None:
    try:
        cur.execute("SELECT company_id FROM account_company WHERE account_id=%s", (acct_id,))
        mines = [str(x[0]) for x in cur.fetchall()]
        print(f"\naccount_company (mines assignées) : {mines or '—'}")
    except Exception as e:
        print(f"\naccount_company: n/a ({e})")

print(f"\nACCOUNT_ID={acct_id}")
cur.close(); conn.close()

#!/usr/bin/env python3
"""Change le role d'un compte (prod Aiven). Aucun secret imprime. Idempotent.

Met a jour la source autoritaire defaultdb.account.role (utilisee pour emettre le
JWT) ET le miroir healthsafety.permission_management.role."""
import re, ssl, sys
import pymysql
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

ACCOUNT_ID = 47
NEW_ROLE = "SYSTEM_ADMINISTRATOR"
APPLY = "--apply" in sys.argv

def load_env(path="Backend/.env"):
    env = {}
    for line in open(path, encoding="utf-8", errors="ignore"):
        mm = re.match(r"\s*([A-Z_]+)\s*=\s*'?([^'\r\n]*)'?", line)
        if mm: env[mm.group(1)] = mm.group(2)
    return env

env = load_env()
m = re.search(r"//(?:([^:@/]+)(?::([^@/]+))?@)?([^:/]+):(\d+)/", env["DB_URL_HNS_AIVEN"])
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
conn = pymysql.connect(host=m.group(3), port=int(m.group(4)), user=m.group(1), password=m.group(2),
                       ssl=ctx, autocommit=True, connect_timeout=30)
cur = conn.cursor()

def show(label):
    cur.execute("SELECT role FROM defaultdb.account WHERE id=%s", (ACCOUNT_ID,))
    a = cur.fetchone()
    cur.execute("SELECT role FROM healthsafety.permission_management WHERE account_id=%s", (ACCOUNT_ID,))
    p = cur.fetchone()
    print(f"{label}: account.role={a[0] if a else '—'} | permission_management.role={p[0] if p else '—'}")

show("AVANT")
if APPLY:
    cur.execute("UPDATE defaultdb.account SET role=%s WHERE id=%s", (NEW_ROLE, ACCOUNT_ID))
    cur.execute("UPDATE healthsafety.permission_management SET role=%s, updated_at=NOW() WHERE account_id=%s",
                (NEW_ROLE, ACCOUNT_ID))
    show("APRES")
    print("\nAPPLIQUE. Le compte doit se reconnecter pour obtenir un JWT au nouveau role.")
else:
    print("\nDRY-RUN (relancer avec --apply).")
cur.close(); conn.close()

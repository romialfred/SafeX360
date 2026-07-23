#!/usr/bin/env python3
"""Diagnostic LECTURE SEULE de defaultdb.account (prod Aiven) : comptes + MFA.
Aucune valeur sensible imprimée (on masque les hash/secrets)."""
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
host, port = m.group(3), int(m.group(4))
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
conn = pymysql.connect(host=host, port=port, user=user, password=pwd, database="defaultdb",
                       ssl=ctx, autocommit=True, connect_timeout=30)
cur = conn.cursor()

print("=== Colonnes de defaultdb.account ===")
cur.execute("SHOW COLUMNS FROM account")
cols = [r[0] for r in cur.fetchall()]
print(cols)

# Détecte les colonnes utiles
def find(*cands):
    for c in cands:
        if c in cols: return c
    return None
pw = find("password", "password_hash", "pwd", "hashed_password")
mfa_en = find("mfa_enabled", "mfaEnabled", "totp_enabled", "two_factor_enabled")
mfa_sec = find("mfa_secret", "totp_secret", "mfaSecret")
role = find("role", "roles", "authorities")
firstlog = find("first_login", "firstLogin", "must_change_password")

sel = ["id", "login"]
for c in [role, firstlog]:
    if c: sel.append(c)
print(f"\n=== Comptes (pw='{pw}', mfa_enabled='{mfa_en}', mfa_secret='{mfa_sec}') ===")
cur.execute(f"SELECT {', '.join(sel)}, "
            f"{'CASE WHEN '+pw+' IS NULL OR '+pw+'=\"\" THEN 0 ELSE 1 END' if pw else '0'} AS has_pw, "
            f"{mfa_en if mfa_en else '0'} AS mfa_on, "
            f"{'CASE WHEN '+mfa_sec+' IS NULL THEN 0 ELSE 1 END' if mfa_sec else '0'} AS has_mfa_secret "
            f"FROM account ORDER BY id")
head = sel + ["has_pw", "mfa_on", "has_mfa_secret"]
print(" | ".join(head))
for row in cur.fetchall():
    print(" | ".join(str(x) for x in row))

# empId link (pour reporter/assignee)
empcol = find("emp_id", "employee_id", "empId")
print(f"\ncolonne employé liée: {empcol}")
cur.close(); conn.close()

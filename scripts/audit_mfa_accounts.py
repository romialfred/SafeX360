#!/usr/bin/env python3
"""Audit LECTURE SEULE de l'etat 2FA des comptes (defaultdb.account).

Repond a trois questions posees par la regle « 2FA obligatoire pour TOUS » :
  1. combien de comptes sont dans l'etat de VERROU MORTEL (mfa_enabled=1 mais
     aucun secret) — AuthAPI emet alors un challenge ENROLL que
     MfaService.beginEnrollment refuse (MFA_ENROLLMENT_NOT_ALLOWED) ;
  2. combien de comptes ont un role vide/NULL — exemptes de MFA par
     MfaRolePolicy.requiresMfa ;
  3. combien restent a enroler (mfa_enabled=0) — volume du forcage a venir.

Aucune valeur sensible n'est imprimee (ni hash, ni secret). Cible :
  python scripts/audit_mfa_accounts.py            -> prod Aiven (DB_URL_AIVEN)
  python scripts/audit_mfa_accounts.py --local    -> Docker local (DB_URL)
"""
import re
import ssl
import sys

import pymysql

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def load_env(path="Backend/.env"):
    env = {}
    for line in open(path, encoding="utf-8", errors="ignore"):
        m = re.match(r"\s*([A-Z_]+)\s*=\s*'?([^'\r\n]*)'?", line)
        if m:
            env[m.group(1)] = m.group(2)
    return env


local = "--local" in sys.argv
env = load_env()
url = env["DB_URL" if local else "DB_URL_AIVEN"]
m = re.search(r"//(?:([^:@/]+)(?::([^@/]+))?@)?([^:/]+):(\d+)/([^?]+)", url)
user = m.group(1) or env.get("DB_USERNAME")
pwd = m.group(2) or env.get("DB_PASSWORD")
host, port, db = m.group(3), int(m.group(4)), m.group(5)

kwargs = dict(host=host, port=port, user=user, password=pwd, database=db,
              autocommit=True, connect_timeout=30)
if not local:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    kwargs["ssl"] = ctx
    if local is False and not user:
        kwargs["user"] = env.get("DB_USERNAME")

print("=== Cible : %s @ %s:%s/%s ===" % ("LOCAL" if local else "PROD Aiven", host, port, db))
conn = pymysql.connect(**kwargs)
cur = conn.cursor()

cur.execute("SHOW COLUMNS FROM account")
cols = [r[0] for r in cur.fetchall()]
need = ["mfa_enabled", "mfa_secret_encrypted", "role", "first_login"]
missing = [c for c in need if c not in cols]
if missing:
    print("Colonnes absentes : %s" % missing)
    print("Colonnes reelles : %s" % cols)
    sys.exit(1)

cur.execute(
    "SELECT id, login, COALESCE(role,'<NULL>') AS role, "
    "       COALESCE(first_login,0) AS first_login, "
    "       COALESCE(mfa_enabled,0) AS mfa_on, "
    "       CASE WHEN mfa_secret_encrypted IS NULL OR mfa_secret_encrypted='' THEN 0 ELSE 1 END AS has_secret "
    "FROM account ORDER BY id")
rows = cur.fetchall()

print("\nid | login | role | first_login | mfa_on | has_secret | ETAT")
deadlock, blank_role, to_enroll, enrolled = [], [], [], []
for _id, login, role, first_login, mfa_on, has_secret in rows:
    if mfa_on and not has_secret:
        etat = "VERROU MORTEL"
        deadlock.append(login)
    elif mfa_on and has_secret:
        etat = "enrole"
        enrolled.append(login)
    else:
        etat = "a enroler"
        to_enroll.append(login)
    if not role or role == "<NULL>" or not str(role).strip():
        etat += " + ROLE VIDE (exempte de MFA)"
        blank_role.append(login)
    print("%s | %s | %s | %s | %s | %s | %s"
          % (_id, login, role, first_login, mfa_on, has_secret, etat))

print("\n=== Synthese ===")
print("comptes total          : %d" % len(rows))
print("VERROU MORTEL (P0)     : %d  %s" % (len(deadlock), deadlock))
print("role vide (P1)         : %d  %s" % (len(blank_role), blank_role))
print("deja enroles           : %d  %s" % (len(enrolled), enrolled))
print("a enroler au prochain login : %d  %s" % (len(to_enroll), to_enroll))

cur.close()
conn.close()

#!/usr/bin/env python3
"""Octroi des nouveaux droits « registres reglementaires » (prod Aiven, healthsafety).

Les 4 nouveaux modules (regulatoryRegister, regulatoryLicenses, workAuthorizations,
mandatoryInspections) sont accordes a tout profil disposant deja de
complianceDashboard (acces au module Conformite). Le compte 47 recoit tout le
catalogue (acces complet). Idempotent, cle sur la PK `id`."""
import re, ssl, sys
import pymysql
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

APPLY = "--apply" in sys.argv
FULL_ACCESS_ACCOUNT = 47
NEW_KEYS = ["regulatoryRegister", "regulatoryLicenses", "workAuthorizations", "mandatoryInspections"]
CATALOG_JAVA = "Backend/Health-Safety/src/main/java/com/minexpert/hns/api/users/ModuleCatalog.java"

def full_catalog():
    java = open(CATALOG_JAVA, encoding="utf-8").read()
    return [m.group(1) for m in re.finditer(r'\b(?:m|mine)\("([A-Za-z]+)"', java)]

def load_env(path="Backend/.env"):
    env = {}
    for line in open(path, encoding="utf-8", errors="ignore"):
        mm = re.match(r"\s*([A-Z_]+)\s*=\s*'?([^'\r\n]*)'?", line)
        if mm: env[mm.group(1)] = mm.group(2)
    return env

FULL = full_catalog()
assert all(k in FULL for k in NEW_KEYS), "catalogue serveur pas a jour"
print(f"Catalogue serveur : {len(FULL)} modules ; nouveaux droits : {NEW_KEYS}")

env = load_env()
m = re.search(r"//(?:([^:@/]+)(?::([^@/]+))?@)?([^:/]+):(\d+)/", env["DB_URL_HNS_AIVEN"])
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
conn = pymysql.connect(host=m.group(3), port=int(m.group(4)), user=m.group(1), password=m.group(2),
                       database="healthsafety", ssl=ctx, autocommit=True, connect_timeout=30)
cur = conn.cursor()
cur.execute("SELECT id, account_id, allowed_modules FROM permission_management")
rows = cur.fetchall()
print(f"Profils : {len(rows)}")

changed = 0
for row_id, account_id, am in rows:
    keys = [k.strip() for k in (am or "").split(",") if k.strip()]
    before = list(keys)
    kset = set(keys)
    if account_id == FULL_ACCESS_ACCOUNT:
        for k in FULL:
            if k not in kset: keys.append(k); kset.add(k)
    elif "complianceDashboard" in kset:
        for k in NEW_KEYS:
            if k not in kset: keys.append(k); kset.add(k)
    if keys != before:
        changed += 1
        added = [k for k in keys if k not in set(before)]
        tag = " [COMPTE 47 — COMPLET]" if account_id == FULL_ACCESS_ACCOUNT else ""
        print(f"  row#{row_id} account {account_id}: +{added}{tag}")
        if APPLY:
            cur.execute("UPDATE permission_management SET allowed_modules=%s, updated_at=NOW() WHERE id=%s",
                        (",".join(keys), row_id))

cur.execute("SELECT allowed_modules FROM permission_management WHERE account_id=%s", (FULL_ACCESS_ACCOUNT,))
r = cur.fetchone()
have = set((r[0] or "").split(",")) if r else set()
missing = [k for k in FULL if k not in have]
print(f"\nCompte {FULL_ACCESS_ACCOUNT} manquants {'(apres) ' if APPLY else '(avant) '}: {missing or 'AUCUN ✓'}")
print(f"\n{'APPLIQUE' if APPLY else 'DRY-RUN'} : {changed} profil(s)" + ("" if APPLY else "  (--apply pour ecrire)"))
cur.close(); conn.close()

#!/usr/bin/env python3
"""Alignement des permissions EPI sur la sidebar (prod Aiven, healthsafety).

- ppeStocktake / ppeAnalytics : accordés à tout profil possédant déjà ppeOverview
  (ces écrans étaient visibles via le droit « Vue d'ensemble EPI »).
- ppeMine : accordé à TOUS les profils (l'écran « Mes EPI » était non gardé).
- Compte 47 (viganbairiot2000@yahoo.fr) : accès COMPLET = tout le catalogue.

Idempotent. Aucune valeur sensible imprimée. Écrit UNIQUEMENT allowed_modules
(source unique ; les nouvelles clés EPI n'ont pas de colonne héritée)."""
import re, ssl, sys
import pymysql
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

APPLY = "--apply" in sys.argv
FULL_ACCESS_ACCOUNT = 47
CATALOG_JAVA = "Backend/Health-Safety/src/main/java/com/minexpert/hns/api/users/ModuleCatalog.java"

def full_catalog_keys():
    java = open(CATALOG_JAVA, encoding="utf-8").read()
    return [m.group(1) for m in re.finditer(r'\b(?:m|mine)\("([A-Za-z]+)"', java)]

def load_env(path="Backend/.env"):
    env = {}
    for line in open(path, encoding="utf-8", errors="ignore"):
        mm = re.match(r"\s*([A-Z_]+)\s*=\s*'?([^'\r\n]*)'?", line)
        if mm: env[mm.group(1)] = mm.group(2)
    return env

FULL = full_catalog_keys()
print(f"Catalogue serveur : {len(FULL)} modules")
assert "ppeStocktake" in FULL and "ppeAnalytics" in FULL and "ppeMine" in FULL, "catalogue non à jour"

env = load_env()
m = re.search(r"//(?:([^:@/]+)(?::([^@/]+))?@)?([^:/]+):(\d+)/", env["DB_URL_HNS_AIVEN"])
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
conn = pymysql.connect(host=m.group(3), port=int(m.group(4)), user=m.group(1), password=m.group(2),
                       database="healthsafety", ssl=ctx, autocommit=True, connect_timeout=30)
cur = conn.cursor()

cur.execute("SELECT id, account_id, allowed_modules FROM permission_management")
rows = cur.fetchall()
print(f"Profils permission_management : {len(rows)}")

changed = 0
for row_id, account_id, am in rows:
    keys = [k.strip() for k in (am or "").split(",") if k.strip()]
    kset = set(keys)
    before = list(keys)

    if account_id == FULL_ACCESS_ACCOUNT:
        # accès complet : union avec tout le catalogue (préserve l'ordre existant + ajoute le reste)
        for k in FULL:
            if k not in kset: keys.append(k); kset.add(k)
    else:
        if "ppeOverview" in kset:
            for k in ("ppeStocktake", "ppeAnalytics"):
                if k not in kset: keys.append(k); kset.add(k)
        if "ppeMine" not in kset:
            keys.append("ppeMine"); kset.add("ppeMine")

    if keys != before:
        changed += 1
        added = [k for k in keys if k not in set(before)]
        tag = " [COMPTE 47 — ACCÈS COMPLET]" if account_id == FULL_ACCESS_ACCOUNT else ""
        print(f"  row#{row_id} account {account_id}: +{added}{tag}")
        if APPLY:
            cur.execute("UPDATE permission_management SET allowed_modules=%s, updated_at=NOW() "
                        "WHERE id=%s", (",".join(keys), row_id))

# Vérif compte 47
cur.execute("SELECT allowed_modules FROM permission_management WHERE account_id=%s", (FULL_ACCESS_ACCOUNT,))
r = cur.fetchone()
have = set((r[0] or "").split(",")) if r else set()
missing = [k for k in FULL if k not in have]
print(f"\nCompte {FULL_ACCESS_ACCOUNT} — modules manquants {'(APRÈS apply) ' if APPLY else '(AVANT apply) '}: "
      f"{missing if missing else 'AUCUN — accès complet ✓'}")

print(f"\n{'APPLIQUÉ' if APPLY else 'DRY-RUN'} : {changed} profil(s) modifié(s)"
      + ("" if APPLY else "  (relancer avec --apply pour écrire)"))
cur.close(); conn.close()

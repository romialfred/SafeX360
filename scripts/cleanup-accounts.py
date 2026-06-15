#!/usr/bin/env python3
"""
Nettoyage des comptes SafeX 360 — ne garder que admin(2), SAFEX360DEMO(13), romuald.tiegnan@gmail.com(14).
Supprime aussi les permissions HSE orphelines (healthsafety.permission_management.account_id).
Ne touche PAS aux employés (employee). Idempotent. Usage : python cleanup-accounts.py local|aiven [--dry]
"""
import re, ssl, sys, pymysql
KEEP = (2, 13, 14)

def load_env(path='Backend/.env'):
    env = {}
    for line in open(path, encoding='utf-8', errors='ignore'):
        m = re.match(r"\s*([A-Z_]+)\s*=\s*'?([^'\r\n]*)'?", line)
        if m: env[m.group(1)] = m.group(2)
    return env

def conn(target, env, jdbc_key, dbname):
    if target == 'local':
        return pymysql.connect(host='127.0.0.1', port=3306, user=env.get('DB_USERNAME', 'avnadmin'),
                               password=env.get('DB_PASSWORD', ''), database=dbname, autocommit=False)
    m = re.search(r'//(?:([^:@/]+)(?::([^@/]+))?@)?([^:/]+):(\d+)/', env[jdbc_key])
    u, p, host, port = m.group(1) or env.get('DB_USERNAME'), m.group(2) or env.get('DB_PASSWORD'), m.group(3), int(m.group(4))
    ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
    return pymysql.connect(host=host, port=port, user=u, password=p, database=dbname, ssl=ctx, autocommit=False, connect_timeout=30)

DRY = '--dry' in sys.argv
target = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'local'
env = load_env()
db = conn(target, env, 'DB_URL_AIVEN', 'defaultdb')       # account
hs = conn(target, env, 'DB_URL_HNS_AIVEN', 'healthsafety') # permission_management
dc, hc = db.cursor(), hs.cursor()

dc.execute(f"SELECT id, login FROM account WHERE id NOT IN {KEEP} ORDER BY id")
todel = dc.fetchall()
del_ids = [r[0] for r in todel]
print(f"=== CIBLE: {target} {'(DRY-RUN)' if DRY else ''} ===")
print(f"Comptes à supprimer ({len(del_ids)}): {[r[1] for r in todel]}")
print(f"Conservés: {KEEP}")

if del_ids:
    placeholders = ",".join(["%s"] * len(del_ids))
    hc.execute(f"DELETE FROM permission_management WHERE account_id IN ({placeholders})", del_ids)
    nperm = hc.rowcount
    dc.execute(f"DELETE FROM account WHERE id IN ({placeholders})", del_ids)
    nacc = dc.rowcount
    print(f"  permission_management supprimées: {nperm}")
    print(f"  account supprimés: {nacc}")
    if DRY:
        db.rollback(); hs.rollback(); print(">>> DRY-RUN : rollback")
    else:
        db.commit(); hs.commit(); print(">>> COMMIT")
else:
    print("  (rien à supprimer — déjà nettoyé)")

dc.execute("SELECT id, login, name, status FROM account ORDER BY id")
print("\n=== Comptes restants ===")
for r in dc.fetchall(): print("  ", r)
db.close(); hs.close()

#!/usr/bin/env python3
"""
Complétion des données de démo SafeX 360 — couverture des statuts (idempotent, UPDATE-only).

Objectif : qu'aucun filtre/onglet de statut n'apparaisse vide pour bien présenter la plateforme.
Principe : pour chaque statut manquant d'un module, on bascule UN enregistrement depuis le
bucket excédentaire (PENDING/PLANNING/OPEN/APPROVED). Gardé par `count(cible)==0` → 100% rejouable.
Aucun INSERT, aucune suppression. Schéma : healthsafety.

Usage :
  python complete-demo-statuses.py local      # MySQL Docker local (127.0.0.1:3306)
  python complete-demo-statuses.py aiven       # Prod Aiven (SSL)
  python complete-demo-statuses.py local --dry # n'écrit rien, montre le plan
"""
import re, ssl, sys, pymysql

def load_env(path='Backend/.env'):
    env = {}
    for line in open(path, encoding='utf-8', errors='ignore'):
        m = re.match(r"\s*([A-Z_]+)\s*=\s*'?([^'\r\n]*)'?", line)
        if m: env[m.group(1)] = m.group(2)
    return env

def connect(target, env):
    if target == 'local':
        return pymysql.connect(host='127.0.0.1', port=3306, user=env.get('DB_USERNAME', 'avnadmin'),
                               password=env.get('DB_PASSWORD', ''), database='healthsafety',
                               autocommit=False, cursorclass=pymysql.cursors.Cursor)
    m = re.search(r'//(?:([^:@/]+)(?::([^@/]+))?@)?([^:/]+):(\d+)/([^?]+)', env['DB_URL_HNS_AIVEN'])
    u, p, host, port, dbname = m.group(1) or env.get('DB_USERNAME'), m.group(2) or env.get('DB_PASSWORD'), m.group(3), int(m.group(4)), m.group(5)
    ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
    return pymysql.connect(host=host, port=port, user=u, password=p, database=dbname, ssl=ctx,
                           autocommit=False, cursorclass=pymysql.cursors.Cursor, connect_timeout=30)

DRY = '--dry' in sys.argv
target = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'local'
env = load_env()
con = connect(target, env)
cur = con.cursor()
changes = []

def dist(table, col='status'):
    cur.execute(f"SELECT `{col}`, COUNT(*) FROM `{table}` GROUP BY `{col}`")
    return {(r[0] if r[0] is not None else None): r[1] for r in cur.fetchall()}

def count_status(table, val, col='status'):
    if val is None:
        cur.execute(f"SELECT COUNT(*) FROM `{table}` WHERE `{col}` IS NULL"); return cur.fetchone()[0]
    cur.execute(f"SELECT COUNT(*) FROM `{table}` WHERE `{col}`=%s", (val,)); return cur.fetchone()[0]

def try_exec(sql, params):
    """Exécute sous SAVEPOINT : en cas de contrainte CHECK/FK, rollback ciblé et on continue."""
    cur.execute("SAVEPOINT sp")
    try:
        cur.execute(sql, params)
        cur.execute("RELEASE SAVEPOINT sp")
        return True
    except pymysql.err.OperationalError as e:
        cur.execute("ROLLBACK TO SAVEPOINT sp")
        changes.append(f"  [BLOQUÉ] {sql.split('SET')[0].strip()} … -> {params} : {e.args[1] if len(e.args)>1 else e}")
        return False

def ensure(table, target_val, source_val, col='status', extra=None):
    """Si aucun enregistrement n'a `target_val`, basculer 1 ligne (id max) du bucket source_val."""
    if count_status(table, target_val, col) > 0:
        return  # déjà couvert -> idempotent, no-op
    if count_status(table, source_val, col) <= 1:
        changes.append(f"  [SKIP] {table}.{col}={target_val} : bucket source {source_val} trop petit"); return
    if source_val is None:
        cur.execute(f"SELECT id FROM `{table}` WHERE `{col}` IS NULL ORDER BY id DESC LIMIT 1")
    else:
        cur.execute(f"SELECT id FROM `{table}` WHERE `{col}`=%s ORDER BY id DESC LIMIT 1", (source_val,))
    row = cur.fetchone()
    if not row:
        changes.append(f"  [SKIP] {table}.{col}={target_val} : aucune ligne source"); return
    rid = row[0]
    setclause = f"`{col}`=%s" + (("," + extra) if extra else "")
    if try_exec(f"UPDATE `{table}` SET {setclause} WHERE id=%s", (target_val, rid)):
        changes.append(f"  [OK]  {table} id={rid} : {col} {source_val} -> {target_val}" + (f"  ({extra})" if extra else ""))

def fix_null(table, default_val, col='status'):
    n = count_status(table, None, col)
    if n == 0: return
    if try_exec(f"UPDATE `{table}` SET `{col}`=%s WHERE `{col}` IS NULL", (default_val,)):
        changes.append(f"  [OK]  {table} : {n} NULL -> {default_val}")

print(f"=== CIBLE: {target} {'(DRY-RUN)' if DRY else ''} — schéma healthsafety ===\n")
before = {t: dist(t) for t in ['incident','audit','recommendation','corrective_action','risks','ppe_request']}

# 1) incident (IncidentStatus ordinal: 0 PENDING..6 REJECTED) — couvrir 4 (CORRECTIVE_ACTIONS) et 6 (REJECTED)
ensure('incident', 4, 0)
ensure('incident', 6, 0)
# 2) audit (AuditStatus ordinal 0 PLANNING..4 CANCELLED) — couvrir 4 (CANCELLED)
ensure('audit', 4, 0)
# 3) recommendation (RecommendationStatus 0 PENDING..3 DELAYED) — couvrir 2 (COMPLETED, progress 100) et 3 (DELAYED, progress 60)
ensure('recommendation', 2, 0, extra="progress=100")
ensure('recommendation', 3, 0, extra="progress=60")
# 4) corrective_action (ActionStatus) — corriger le NULL -> 0 PENDING
fix_null('corrective_action', 0)
# 5) risks (String) — couvrir IN_PROGRESS et CLOSED depuis OPEN
ensure('risks', 'IN_PROGRESS', 'OPEN')
ensure('risks', 'CLOSED', 'OPEN')
# 6) ppe_request (String) — couvrir PENDING et REJECTED depuis APPROVED
ensure('ppe_request', 'PENDING', 'APPROVED')
ensure('ppe_request', 'REJECTED', 'APPROVED')
# 7) communications — remplir l'échéance (expires_at) quand NULL : created_at + 90 jours
cur.execute("SELECT COUNT(*) FROM communications WHERE expires_at IS NULL")
nexp = cur.fetchone()[0]
if nexp and try_exec("UPDATE communications SET expires_at = DATE_ADD(COALESCE(scheduled_at, created_at, NOW()), INTERVAL 90 DAY) WHERE expires_at IS NULL", ()):
    changes.append(f"  [OK]  communications : {nexp} expires_at NULL -> +90j")

print("Changements:")
print("\n".join(changes) if changes else "  (aucun — déjà complet, idempotent)")

if DRY:
    con.rollback(); print("\n>>> DRY-RUN : rollback, rien écrit.")
else:
    con.commit(); print("\n>>> COMMIT effectué.")

after = {t: dist(t) for t in before}
print("\n=== Distributions avant -> après ===")
for t in before:
    print(f"  {t}: {before[t]}  ->  {after[t]}")
con.close()

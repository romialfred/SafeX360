"""
Migration Phase 1 — Refonte module Inspections.

Conformement a la decision validee par le owner (Romuald, 2026-06-08) :
toutes les inspections creees AVANT la refonte sont automatiquement
archivees, preservant l'historique sans permettre de modification future.

Idempotent : peut etre rejoue sans effet de bord.
"""
from datetime import datetime

from db_env import connect

# ATTENTION : les tables inspections vivent dans le schema 'healthsafety'
# (cf. DB_URL_HNS dans Backend/.env), pas dans 'defaultdb' (MineXpert HRMS).
conn = connect('healthsafety', connect_timeout=10)
cur = conn.cursor()

print("=" * 60)
print("Migration Phase 1 — Inspections legacy -> ARCHIVED")
print("=" * 60)

# 1. Snapshot avant migration
cur.execute("""
    SELECT status, COUNT(*) FROM general_inspection
    GROUP BY status ORDER BY status
""")
before = cur.fetchall()
print("\nAVANT migration :")
for s, n in before:
    print(f"  {s or 'NULL':20s} : {n}")

# 2. Migration : tous les statuts legacy (PENDING, COMPLETED, IN_PROGRESS sans nouveau workflow)
#    sont archives. CANCELLED reste CANCELLED (deja cloture).
cur.execute("""
    UPDATE general_inspection
    SET status = 'ARCHIVED',
        archived_at = COALESCE(archived_at, updated_at, created_at, NOW())
    WHERE status IN ('PENDING', 'COMPLETED', 'IN_PROGRESS')
""")
affected = cur.rowcount
print(f"\n[migration] {affected} inspection(s) marquees ARCHIVED")

# 3. Snapshot apres migration
cur.execute("""
    SELECT status, COUNT(*) FROM general_inspection
    GROUP BY status ORDER BY status
""")
after = cur.fetchall()
print("\nAPRES migration :")
for s, n in after:
    print(f"  {s or 'NULL':20s} : {n}")

# 4. Verification : 0 inspection avec statut legacy doit subsister
cur.execute("""
    SELECT COUNT(*) FROM general_inspection
    WHERE status IN ('PENDING', 'COMPLETED', 'IN_PROGRESS')
""")
remaining = cur.fetchone()[0]
if remaining == 0:
    print("\n[OK] Migration complete : 0 inspection legacy non archivee.")
    conn.commit()
    print("[OK] COMMIT effectue.")
else:
    print(f"\n[KO] {remaining} inspection(s) legacy non migrees — ROLLBACK")
    conn.rollback()

cur.close()
conn.close()
print("\nFin.")

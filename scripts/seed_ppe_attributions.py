# -*- coding: utf-8 -*-
"""
seed_ppe_attributions — dotations EPI NOMINATIVES par employé (24 mois), pour la
page « Mes EPI » (historique + valorisation + comparaison conso/coût entre pairs).

Pour chaque employé de chaque mine : une demande DELIVERED « container » puis des
lignes d'attribution (ppe_emp) datées sur 24 mois avec quantity_issued = ce que la
personne a réellement reçu (base commune + EPI spécialisés selon un tirage stable
par employé → variation réaliste des coûts). Quelques demandes PENDING et APPROVED
(réservé) sont ajoutées pour peupler les KPI du tableau de bord.

Ces lignes sont des ATTRIBUTIONS (qui a reçu quoi) ; elles NE créent PAS de
mouvements de stock (les distributions au niveau département sont déjà seedées par
seed_ppe_catalog_movements.py) → l'invariant stock reste intact.

IDEMPOTENT : purge les demandes taguées SEED24-* (+ leurs ppe_emp) puis régénère.

Usage :
  python scripts/seed_ppe_attributions.py local | aiven [--dry]
"""
import random
import re
import ssl
import sys
from datetime import datetime, timedelta

import pymysql

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

DRY = "--dry" in sys.argv
TARGET = "aiven" if "aiven" in sys.argv else "local"
MONTHS = 24
random.seed(20260806)

COMPANIES = [6, 1]

# Dotation de BASE (tout employé de chantier) : ref -> (nb de lignes, qty/ligne).
BASE = [
    ("MSA-VG500", 1, 1),    # casque (durable)
    ("GAC-300", 3, 8),      # gants anti-coupure (consommable)
    ("BO-110", 3, 16),      # bouchons d'oreilles (consommable)
    ("3M-9320", 3, 16),     # masque anti-poussière (consommable)
    ("BOL-RUSH", 2, 2),     # lunettes
    ("COF-S3", 1, 1),       # chaussures S3
    ("3M-HV20471", 1, 1),   # gilet HV
]
# Dotations SPÉCIALISÉES tirées selon le profil (hash empId).
SPECIAL = {
    "harness": [("PTZ-AVAO", 1, 1), ("PTZ-ABS", 1, 1)],
    "resp": [("3M-6200", 2, 1), ("DRG-3300", 1, 1)],
    "weld": [("3M-9100", 1, 1), ("MCR-4600", 2, 1)],
    "elec": [("HW-ISO0", 1, 1)],
    "noise": [("PLT-OPT3", 1, 1)],
}


def load_env(path="Backend/.env"):
    env = {}
    for line in open(path, encoding="utf-8", errors="ignore"):
        m = re.match(r"\s*([A-Z_]+)\s*=\s*'?([^'\r\n]*)'?", line)
        if m:
            env[m.group(1)] = m.group(2)
    return env


def connect(env):
    if TARGET == "local":
        return pymysql.connect(host="127.0.0.1", port=3306,
                               user=env.get("DB_USERNAME", "root"), password=env.get("DB_PASSWORD", ""),
                               database="healthsafety", autocommit=False, cursorclass=pymysql.cursors.Cursor)
    m = re.search(r"//(?:([^:@/]+)(?::([^@/]+))?@)?([^:/]+):(\d+)/([^?]+)", env["DB_URL_HNS_AIVEN"])
    user = m.group(1) or env.get("DB_USERNAME")
    pwd = m.group(2) or env.get("DB_PASSWORD")
    host, port, dbname = m.group(3), int(m.group(4)), m.group(5)
    ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
    return pymysql.connect(host=host, port=port, user=user, password=pwd, database=dbname,
                           ssl=ctx, autocommit=False, cursorclass=pymysql.cursors.Cursor, connect_timeout=30)


REQ_SQL = """INSERT INTO ppe_request
  (company_id, status, priority, reason, desired_date, emp_ids, ppe_ids, comment, delivered_at, created_at, updated_at)
  VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
EMP_SQL = """INSERT INTO ppe_emp
  (company_id, emp_id, ppe_id, ppe_request_id, quantity_requested, quantity_approved, quantity_issued,
   quantity_returned, status, date, created_at, updated_at)
  VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""


def profile(emp_id):
    """Tirage stable des dotations spécialisées selon l'empId."""
    kinds = []
    h = emp_id
    if h % 3 == 0:
        kinds.append("harness")
    if h % 4 == 0:
        kinds.append("resp")
    if h % 7 == 0:
        kinds.append("weld")
    if h % 5 == 0:
        kinds.append("elec")
    if h % 6 == 0:
        kinds.append("noise")
    return kinds


def run():
    env = load_env()
    conn = connect(env)
    cur = conn.cursor()
    start = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0) - timedelta(days=31 * (MONTHS - 1))
    total_req, total_lines = 0, 0

    for company_id in COMPANIES:
        # Purge idempotente (demandes taguées + leurs lignes).
        cur.execute("SELECT id FROM ppe_request WHERE company_id=%s AND reason LIKE 'SEED24-%%'", (company_id,))
        old = [r[0] for r in cur.fetchall()]
        if old:
            fmt = ",".join(["%s"] * len(old))
            cur.execute(f"DELETE FROM ppe_emp WHERE ppe_request_id IN ({fmt})", old)
            cur.execute("DELETE FROM ppe_request WHERE id IN (" + fmt + ")", old)

        # Catalogue de la mine : supplier_reference -> ppe_id.
        cur.execute("SELECT supplier_reference, id FROM ppe WHERE company_id=%s AND supplier_reference IS NOT NULL", (company_id,))
        ref2id = {r[0]: r[1] for r in cur.fetchall()}

        # Employés de la mine (defaultdb, requête qualifiée).
        cur.execute("SELECT id FROM defaultdb.employee WHERE company_id=%s ORDER BY id", (company_id,))
        emp_ids = [r[0] for r in cur.fetchall()]

        for idx, emp_id in enumerate(emp_ids):
            dot = list(BASE)
            for k in profile(emp_id):
                dot += SPECIAL[k]
            # Résolution des ppe_id disponibles pour cette mine.
            used_ppe = []
            lines = []  # (ppe_id, qty, date)
            for (ref, nlines, qty) in dot:
                pid = ref2id.get(ref)
                if not pid:
                    continue
                used_ppe.append(pid)
                for j in range(nlines):
                    frac = (j + 0.5) / nlines
                    d = start + timedelta(days=int(frac * 31 * MONTHS) + (emp_id % 20))
                    q = max(1, int(round(qty * random.uniform(0.8, 1.2))))
                    lines.append((pid, q, d))
            if not lines:
                continue
            delivered = max(d for (_, _, d) in lines)
            ppe_ids_csv = ",".join(str(x) for x in sorted(set(used_ppe)))
            cur.execute(REQ_SQL, (company_id, "DELIVERED", "NORMAL", "SEED24-DOT",
                                  delivered.date(), str(emp_id), ppe_ids_csv,
                                  "Dotation EPI (historique 24 mois)", delivered, start, delivered))
            req_id = cur.lastrowid
            rows = [(company_id, emp_id, pid, req_id, q, q, q, 0, "ACTIVE", d.date(), d, d)
                    for (pid, q, d) in lines]
            cur.executemany(EMP_SQL, rows)
            total_req += 1
            total_lines += len(rows)

            # ~1 employé sur 8 : demande EN ATTENTE (peuple « demandes en attente »).
            if idx % 8 == 3:
                pid = ref2id.get("GAC-300") or (used_ppe[0] if used_ppe else None)
                if pid:
                    dd = datetime.now()
                    cur.execute(REQ_SQL, (company_id, "PENDING",
                                          "HIGH" if idx % 3 == 0 else "NORMAL", "SEED24-PEND",
                                          dd.date(), str(emp_id), str(pid), "Demande en cours", None, dd, dd))
                    rq = cur.lastrowid
                    cur.execute(EMP_SQL, (company_id, emp_id, pid, rq, 5, None, 0, 0, "ACTIVE", dd.date(), dd, dd))
                    total_req += 1; total_lines += 1
            # ~1 sur 9 : demande APPROUVÉE non distribuée (peuple « réservé »).
            if idx % 9 == 4:
                pid = ref2id.get("COF-S3") or (used_ppe[0] if used_ppe else None)
                if pid:
                    dd = datetime.now()
                    cur.execute(REQ_SQL, (company_id, "APPROVED", "NORMAL", "SEED24-RSV",
                                          dd.date(), str(emp_id), str(pid), "Approuvée, à distribuer", None, dd, dd))
                    rq = cur.lastrowid
                    cur.execute(EMP_SQL, (company_id, emp_id, pid, rq, 3, 3, 0, 0, "ACTIVE", dd.date(), dd, dd))
                    total_req += 1; total_lines += 1

        print(f"  mine {company_id}: {len(emp_ids)} employés dotés")

    print(f"Total : {total_req} demandes, {total_lines} lignes d'attribution")
    if DRY:
        conn.rollback(); print("DRY — rollback.")
    else:
        conn.commit(); print(f"OK — commit sur {TARGET}.")
    cur.close(); conn.close()


if __name__ == "__main__":
    print(f"Seed dotations EPI nominatives ({TARGET}{' DRY' if DRY else ''}) — {MONTHS} mois")
    run()

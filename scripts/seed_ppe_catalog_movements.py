# -*- coding: utf-8 -*-
"""
seed_ppe_catalog_movements — jeu de données EPI réaliste pour le tableau de bord
« Suivi des EPI » (pilotage des stocks & distributions).

Enregistre un CATALOGUE d'EPI de FABRICANTS RÉELS du secteur minier / industriel
(MSA, 3M, Honeywell, Ansell, Bollé, Petzl, Cofra, Dräger, uvex, Delta Plus…) puis
génère 24 MOIS de mouvements de stock (entrées = réceptions fournisseur, sorties =
distributions attribuées à un département) dans le journal ppe_stock_movement.

Le stock (ppe.stock) reste la PROJECTION du journal : après génération,
ppe.stock == SUM(mouvements) pour chaque EPI (invariant de l'incrément 1).

IDEMPOTENT : les mouvements générés sont tagués (reference LIKE 'SEED24%') ;
une réexécution les purge puis les régénère. Les EPI sont upsertés par (company_id, name).

Usage :
  python scripts/seed_ppe_catalog_movements.py local        # MySQL Docker local
  python scripts/seed_ppe_catalog_movements.py aiven        # Prod Aiven (SSL)
  python scripts/seed_ppe_catalog_movements.py local --dry  # simulation (aucune écriture)
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
random.seed(20260806)  # déterministe → idempotence des volumes

# Mines cibles → départements servant à attribuer les distributions.
COMPANY_DEPTS = {
    6: ["Mining Operations", "Processing Plant", "Maintenance & Engineering", "HSE Department", "Logistics & Support"],
    1: ["Mining", "Processing", "Maintenance Preventive", "Safety", "Warehouse"],
}

# ── Catalogue EPI réel (fabricants/gammes réels du minier) ───────────────────
# monthly = consommation moyenne mensuelle (u.) ; start = stock d'ouverture ;
# price = prix de référence unitaire (FCFA/XOF) ; min = seuil de réappro.
CATALOG = [
    # cat = code backend (PPE_CATEGORY_LABELS)
    dict(name="Casque de sécurité MSA V-Gard 500", cat="Head protection", brand="MSA", manufacturer="MSA Safety",
         model="V-Gard 500", body="Tête", life=60, reuse=1, mand=1, price=9500, uom="unité",
         supplier="MSA Safety West Africa", ref="MSA-VG500", monthly=45, start=520, min=200),
    dict(name="Casque JSP EVO3", cat="Head protection", brand="JSP", manufacturer="JSP Ltd",
         model="EVO3", body="Tête", life=60, reuse=1, mand=1, price=7800, uom="unité",
         supplier="JSP Distribution", ref="JSP-EVO3", monthly=22, start=260, min=120),
    dict(name="Gants anti-coupure Ansell HyFlex 11-518", cat="Hand protection", brand="Ansell", manufacturer="Ansell",
         model="HyFlex 11-518", body="Mains", life=3, reuse=0, mand=1, price=2200, uom="paire",
         supplier="Ansell Protective Solutions", ref="GAC-300", monthly=340, start=900, min=1000),
    dict(name="Gants nitrile Showa 377", cat="Hand protection", brand="Showa", manufacturer="Showa Group",
         model="377", body="Mains", life=2, reuse=0, mand=1, price=1400, uom="paire",
         supplier="Showa Gloves", ref="SHW-377", monthly=520, start=1400, min=800),
    dict(name="Gants soudeur MCR Safety", cat="Hand protection", brand="MCR Safety", manufacturer="MCR Safety",
         model="4600", body="Mains", life=4, reuse=1, mand=0, price=3200, uom="paire",
         supplier="MCR Safety", ref="MCR-4600", monthly=60, start=220, min=120),
    dict(name="Lunettes de protection Bollé Safety Rush+", cat="Eye protection", brand="Bollé Safety", manufacturer="Bollé Safety",
         model="Rush+", body="Yeux", life=24, reuse=1, mand=1, price=3400, uom="unité",
         supplier="Bollé Safety", ref="BOL-RUSH", monthly=180, start=2400, min=1000),
    dict(name="Lunettes-masque uvex ultrasonic", cat="Eye protection", brand="uvex", manufacturer="uvex safety",
         model="ultrasonic", body="Yeux", life=24, reuse=1, mand=0, price=6800, uom="unité",
         supplier="uvex safety group", ref="UVX-ULT", monthly=40, start=300, min=150),
    dict(name="Chaussures de sécurité S3 Cofra New Rock", cat="Foot protection", brand="Cofra", manufacturer="Cofra Safety",
         model="New Rock S3", body="Pieds", life=18, reuse=1, mand=1, price=19500, uom="paire",
         supplier="Cofra Safety Footwear", ref="COF-S3", monthly=95, start=1200, min=1500),
    dict(name="Bottes de sécurité Bata Industrials", cat="Foot protection", brand="Bata", manufacturer="Bata Industrials",
         model="Bickz 903", body="Pieds", life=18, reuse=1, mand=1, price=16800, uom="paire",
         supplier="Bata Industrials", ref="BAT-903", monthly=55, start=520, min=300),
    dict(name="Bouchons d'oreilles 3M E-A-R Classic", cat="Hearing protection", brand="3M", manufacturer="3M",
         model="E-A-R Classic", body="Oreilles", life=1, reuse=0, mand=1, price=350, uom="paire",
         supplier="3M Personal Safety", ref="BO-110", monthly=1200, start=200, min=500),
    dict(name="Casque anti-bruit 3M PELTOR Optime III", cat="Hearing protection", brand="3M PELTOR", manufacturer="3M",
         model="Optime III", body="Oreilles", life=36, reuse=1, mand=0, price=12500, uom="unité",
         supplier="3M Personal Safety", ref="PLT-OPT3", monthly=18, start=180, min=90),
    dict(name="Demi-masque respiratoire 3M 6200", cat="Respiratory protection", brand="3M", manufacturer="3M",
         model="6200", body="Voies respiratoires", life=24, reuse=1, mand=1, price=8900, uom="unité",
         supplier="3M Personal Safety", ref="3M-6200", monthly=70, start=640, min=300),
    dict(name="Masque anti-poussière FFP2 3M Aura 9320", cat="Respiratory protection", brand="3M", manufacturer="3M",
         model="Aura 9320+", body="Voies respiratoires", life=1, reuse=0, mand=1, price=650, uom="unité",
         supplier="3M Personal Safety", ref="3M-9320", monthly=1500, start=3200, min=1500),
    dict(name="Appareil respiratoire Dräger X-plore 3300", cat="Respiratory protection", brand="Dräger", manufacturer="Dräger",
         model="X-plore 3300", body="Voies respiratoires", life=36, reuse=1, mand=0, price=28500, uom="unité",
         supplier="Dräger Safety", ref="DRG-3300", monthly=8, start=90, min=40),
    dict(name="Gilet haute visibilité 3M Scotchlite", cat="Protective clothing", brand="3M", manufacturer="3M",
         model="Scotchlite EN20471", body="Torse", life=18, reuse=1, mand=1, price=4200, uom="unité",
         supplier="3M Personal Safety", ref="3M-HV20471", monthly=120, start=1400, min=600),
    dict(name="Combinaison ignifugée Bulwark FR", cat="Protective clothing", brand="Bulwark", manufacturer="Bulwark Protection",
         model="FR ComforTouch", body="Corps entier", life=24, reuse=1, mand=0, price=34500, uom="unité",
         supplier="Bulwark Protection", ref="BLW-FR", monthly=25, start=280, min=120),
    dict(name="Harnais antichute Petzl AVAO BOD", cat="Fall protection", brand="Petzl", manufacturer="Petzl",
         model="AVAO BOD", body="Corps entier", life=120, reuse=1, mand=1, price=52000, uom="unité",
         supplier="Petzl Professional", ref="PTZ-AVAO", monthly=6, start=140, min=60),
    dict(name="Harnais antichute Honeywell Miller H500", cat="Fall protection", brand="Honeywell Miller", manufacturer="Honeywell",
         model="Miller H500", body="Corps entier", life=120, reuse=1, mand=0, price=41000, uom="unité",
         supplier="Honeywell Safety", ref="HW-H500", monthly=5, start=110, min=50),
    dict(name="Longe antichute Petzl ABSORBICA", cat="Fall protection", brand="Petzl", manufacturer="Petzl",
         model="ABSORBICA-Y", body="Corps entier", life=120, reuse=1, mand=0, price=33000, uom="unité",
         supplier="Petzl Professional", ref="PTZ-ABS", monthly=7, start=95, min=40),
    dict(name="Écran facial anti-éclat Honeywell Bionic", cat="Eye protection", brand="Honeywell", manufacturer="Honeywell",
         model="Bionic Face Shield", body="Visage", life=24, reuse=1, mand=0, price=11500, uom="unité",
         supplier="Honeywell Safety", ref="HW-BIONIC", monthly=15, start=190, min=80),
    dict(name="Masque de soudage Speedglas 3M 9100", cat="Eye protection", brand="3M Speedglas", manufacturer="3M",
         model="9100", body="Visage", life=48, reuse=1, mand=0, price=185000, uom="unité",
         supplier="3M Personal Safety", ref="3M-9100", monthly=2, start=45, min=20),
    dict(name="Genouillères de travail Portwest", cat="Protective clothing", brand="Portwest", manufacturer="Portwest",
         model="KP20", body="Genoux", life=18, reuse=1, mand=0, price=3800, uom="paire",
         supplier="Portwest", ref="PW-KP20", monthly=30, start=260, min=120),
    dict(name="Gants isolants électriques Honeywell", cat="Hand protection", brand="Honeywell", manufacturer="Honeywell",
         model="Class 0 1000V", body="Mains", life=6, reuse=1, mand=0, price=24500, uom="paire",
         supplier="Honeywell Safety", ref="HW-ISO0", monthly=4, start=70, min=30),
    dict(name="Bottes cuissardes PVC Dunlop Purofort", cat="Foot protection", brand="Dunlop", manufacturer="Dunlop Protective",
         model="Purofort", body="Pieds", life=12, reuse=1, mand=0, price=14200, uom="paire",
         supplier="Dunlop Protective Footwear", ref="DNL-PURO", monthly=20, start=200, min=90),
    dict(name="Cagoule ignifugée sous-casque", cat="Protective clothing", brand="Delta Plus", manufacturer="Delta Plus",
         model="Balaclava FR", body="Tête", life=12, reuse=1, mand=0, price=2600, uom="unité",
         supplier="Delta Plus", ref="DP-BALFR", monthly=35, start=300, min=150),
    dict(name="Crème solaire indice 50 chantier", cat="Protective clothing", brand="Delta Plus", manufacturer="Delta Plus",
         model="SPF50 250ml", body="Peau", life=24, reuse=0, mand=0, price=4500, uom="unité",
         supplier="Delta Plus", ref="DP-SPF50", monthly=90, start=700, min=300),
]

INSERT_PPE = """
INSERT INTO ppe (company_id, name, category, brand, manufacturer, model, protection_body_part,
                 lifespan_months, reusable, mandatory, reference_price, currency, unit_of_measure,
                 preferred_supplier, supplier_reference, min_stock, stock, status, created_at, updated_at, version)
VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'XOF',%s,%s,%s,%s,0,'ACTIVE',NOW(6),NOW(6),0)
"""


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


def month_start(dt):
    return dt.replace(day=1, hour=8, minute=0, second=0, microsecond=0)


def gen_movements(item, depts, start_dt):
    """Retourne (movements, final_stock). movement = (type, qty_signed, unit_cost, ref, reason, created_at)."""
    stock = item["start"]
    moves = [("INITIAL", stock, None, "SEED24-INIT", "Solde d'ouverture (24 mois)", start_dt)]
    receipt_every = max(1, round(item["min"] / max(1, item["monthly"])) if item["monthly"] else 3)
    receipt_every = min(4, max(1, receipt_every))
    for i in range(MONTHS):
        mdt = month_start(start_dt + timedelta(days=31 * i)).replace(day=5)
        # Réception fournisseur périodique.
        if i % receipt_every == 0 and i > 0:
            qty = int(round(item["monthly"] * receipt_every * random.uniform(1.0, 1.25)))
            if qty > 0:
                stock += qty
                moves.append(("RECEIPT", qty, float(item["price"]), "SEED24-RC", "Réception fournisseur", mdt))
        # Distributions du mois, réparties sur les départements.
        want = int(round(item["monthly"] * random.uniform(0.7, 1.3)))
        want = min(want, max(0, stock))  # jamais de stock négatif
        if want <= 0:
            continue
        weights = [random.uniform(0.5, 1.5) for _ in depts]
        wsum = sum(weights) or 1.0
        alloc = [int(round(want * w / wsum)) for w in weights]
        # ajuster pour que la somme == want
        diff = want - sum(alloc)
        alloc[0] += diff
        for d, a in zip(depts, alloc):
            if a <= 0:
                continue
            a = min(a, stock)
            if a <= 0:
                break
            stock -= a
            ddt = mdt.replace(day=min(27, 6 + (hash(d) % 20)))
            moves.append(("ISSUE", -a, None, "SEED24-IS", "DEPT:" + d, ddt))
    return moves, stock


def run():
    env = load_env()
    conn = connect(env)
    cur = conn.cursor()
    start_dt = month_start(datetime.now()) - timedelta(days=31 * (MONTHS - 1))
    start_dt = month_start(start_dt)
    total_items, total_moves = 0, 0
    for company_id, depts in COMPANY_DEPTS.items():
        for item in CATALOG:
            # upsert EPI (par nom + mine)
            cur.execute("SELECT id FROM ppe WHERE company_id=%s AND name=%s", (company_id, item["name"]))
            row = cur.fetchone()
            if row:
                ppe_id = row[0]
                cur.execute("""UPDATE ppe SET category=%s, brand=%s, manufacturer=%s, model=%s,
                               protection_body_part=%s, lifespan_months=%s, reusable=%s, mandatory=%s,
                               reference_price=%s, currency='XOF', unit_of_measure=%s, preferred_supplier=%s,
                               supplier_reference=%s, min_stock=%s, status='ACTIVE', updated_at=NOW(6)
                               WHERE id=%s""",
                            (item["cat"], item["brand"], item["manufacturer"], item["model"], item["body"],
                             item["life"], item["reuse"], item["mand"], item["price"], item["uom"],
                             item["supplier"], item["ref"], item["min"], ppe_id))
                cur.execute("DELETE FROM ppe_stock_movement WHERE ppe_id=%s AND reference LIKE 'SEED24%%'", (ppe_id,))
            else:
                cur.execute(INSERT_PPE, (company_id, item["name"], item["cat"], item["brand"], item["manufacturer"],
                                         item["model"], item["body"], item["life"], item["reuse"], item["mand"],
                                         item["price"], item["uom"], item["supplier"], item["ref"], item["min"]))
                ppe_id = cur.lastrowid
            moves, final = gen_movements(item, depts, start_dt)
            running = 0
            rows = []
            for (mtype, qty, ucost, ref, reason, cdt) in moves:
                running += qty
                rows.append((ppe_id, mtype, qty, running, ucost, ref, reason, cdt, company_id))
            # Insertion PAR LOT (executemany) : indispensable sur Aiven (latence réseau).
            cur.executemany("""INSERT INTO ppe_stock_movement
                (ppe_id, movement_type, quantity, balance_after, unit_cost, reference, reason, created_by, created_at, company_id)
                VALUES (%s,%s,%s,%s,%s,%s,%s,NULL,%s,%s)""", rows)
            cur.execute("UPDATE ppe SET stock=%s, updated_at=NOW(6) WHERE id=%s", (final, ppe_id))
            total_items += 1
            total_moves += len(moves)
        print(f"  mine {company_id}: {len(CATALOG)} EPI, ~{total_moves} mouvements cumulés")
    # Contrôle d'invariant
    cur.execute("""SELECT COUNT(*) FROM ppe p WHERE COALESCE(p.stock,0) <>
                   COALESCE((SELECT SUM(m.quantity) FROM ppe_stock_movement m WHERE m.ppe_id=p.id),0)""")
    ecarts = cur.fetchone()[0]
    print(f"Invariant stock : {ecarts} écart(s)")
    if DRY:
        conn.rollback(); print("DRY — rollback, rien écrit.")
    else:
        conn.commit(); print(f"OK — {total_items} EPI, {total_moves} mouvements, commit sur {TARGET}.")
    cur.close(); conn.close()


if __name__ == "__main__":
    print(f"Seed EPI ({TARGET}{' DRY' if DRY else ''}) — {len(CATALOG)} références × {len(COMPANY_DEPTS)} mines, {MONTHS} mois")
    run()

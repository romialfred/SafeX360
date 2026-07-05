# -*- coding: utf-8 -*-
"""
Seed Mine SANAMA YIRI — 3e mine SafeX 360.

Actions (idempotentes) :
  1. Crée la mine SANAMA YIRI (SYR) si absente            [defaultdb]
  2. Crée 5 départements SYR                               [defaultdb]
  3. Crée 10 postes SYR                                    [defaultdb]
  4. Crée 20 employés burkinabè réalistes                  [defaultdb]
  5. Crée 2 comptes utilisateurs (HSE_MANAGER, HSE_OFFICER)[defaultdb]
  6. Crée 7 localisations minières                         [healthsafety]
  7. Crée 8 zones de travail                               [healthsafety]
  8. Crée 12 processus de travail                          [healthsafety]
  9. Crée 5 domaines d'audit                               [healthsafety]
 10. Crée 15 incidents (tous statuts du workflow)           [healthsafety]
 11. Crée 6 audits ISO (tous statuts)                      [healthsafety]

Cible : MySQL local Docker (safex-mysql). Credentials depuis Backend/.env.
Usage :
    python seed_sanama_yiri.py              # base locale complète
    python seed_sanama_yiri.py --sql-only   # uniquement SQL (pas d'API)
"""
import sys
from datetime import datetime, timedelta

import db_env

SQL_ONLY = "--sql-only" in sys.argv

# ═══════════════════════════════════════════════════════════════════════════
# CONSTANTES
# ═══════════════════════════════════════════════════════════════════════════

BCRYPT_HASH = "$2b$10$obhHQpDXw.QXSTirihlk4eeB.9B1ahp8MJN96koZSz8sHEsR7eDFm"

DEPARTMENTS = [
    ("Mining Operations",          "OPS", "General Manager", "OPS"),
    ("Processing Plant",           "PRO", "General Manager", "PRO"),
    ("HSE Department",             "HSE", "General Manager", "HSE"),
    ("Maintenance & Engineering",  "MNT", "General Manager", "MNT"),
    ("Logistics & Support",        "LOG", "General Manager", "LOG"),
]

POSITIONS = [
    # (name, short_name, basic_salary, position_category_id)
    ("Mine Manager",            "MGR",      650000, 1),
    ("HSE Manager",             "HSE-MGR",  480000, 1),
    ("HSE Officer",             "HSE-OFF",  320000, 2),
    ("Shift Supervisor",        "SUP",      280000, 3),
    ("Process Engineer",        "PR-ENG",   350000, 2),
    ("Maintenance Technician",  "MNT-TECH", 220000, 4),
    ("Drill Operator",          "DRL",      195000, 4),
    ("Haul Truck Driver",       "HTD",      180000, 4),
    ("Geologist",               "GEO",      400000, 2),
    ("Environmental Officer",   "ENV-OFF",  300000, 3),
]

# (first, family, gender, dept_idx, position_idx, birth, start, marital, city)
EMPLOYEES = [
    ("Amidou",      "Ouédraogo",  "MALE",   0, 0, "1978-05-12", "2015-03-15", "MARRIED",  "Bobo-Dioulasso"),
    ("Fatimata",    "Sawadogo",   "FEMALE", 2, 1, "1982-09-23", "2016-01-10", "MARRIED",  "Ouagadougou"),
    ("Ibrahim",     "Kaboré",     "MALE",   2, 2, "1990-03-14", "2018-06-01", "SINGLE",   "Koudougou"),
    ("Mariam",      "Traoré",     "FEMALE", 2, 2, "1993-07-08", "2019-09-15", "SINGLE",   "Bobo-Dioulasso"),
    ("Moussa",      "Ilboudo",    "MALE",   0, 3, "1985-11-30", "2017-02-20", "MARRIED",  "Ouagadougou"),
    ("Adjaratou",   "Compaoré",   "FEMALE", 1, 4, "1988-01-17", "2018-04-05", "DIVORCED", "Koudougou"),
    ("Dramane",     "Zoungrana",  "MALE",   3, 5, "1991-06-22", "2020-01-08", "SINGLE",   "Bobo-Dioulasso"),
    ("Ousmane",     "Sorgho",     "MALE",   0, 6, "1987-12-03", "2016-07-12", "MARRIED",  "Dédougou"),
    ("Awa",         "Zongo",      "FEMALE", 0, 7, "1994-04-19", "2021-03-01", "SINGLE",   "Bobo-Dioulasso"),
    ("Seydou",      "Nikiéma",    "MALE",   1, 4, "1983-08-27", "2015-11-20", "MARRIED",  "Ouagadougou"),
    ("Hamidou",     "Tapsoba",    "MALE",   3, 5, "1989-10-15", "2019-05-10", "SINGLE",   "Kaya"),
    ("Aminata",     "Barro",      "FEMALE", 4, 9, "1992-02-28", "2020-08-15", "SINGLE",   "Bobo-Dioulasso"),
    ("Yacouba",     "Sanou",      "MALE",   0, 6, "1986-07-11", "2017-10-03", "MARRIED",  "Banfora"),
    ("Salamata",    "Kindo",      "FEMALE", 1, 4, "1995-12-05", "2022-01-15", "SINGLE",   "Bobo-Dioulasso"),
    ("Abdoulaye",   "Ouattara",   "MALE",   3, 5, "1984-03-30", "2016-04-18", "DIVORCED", "Ouagadougou"),
    ("Rasmata",     "Thiombiano", "FEMALE", 2, 2, "1991-09-14", "2021-06-01", "MARRIED",  "Fada N'Gourma"),
    ("Boukary",     "Kaboré",     "MALE",   0, 3, "1980-01-25", "2015-06-10", "MARRIED",  "Ouagadougou"),
    ("Bibata",      "Millogo",    "FEMALE", 4, 9, "1993-11-18", "2022-03-20", "SINGLE",   "Bobo-Dioulasso"),
    ("Issouf",      "Ky",         "MALE",   1, 8, "1979-06-07", "2015-09-01", "MARRIED",  "Dédougou"),
    ("Roukiatou",   "Dao",        "FEMALE", 3, 5, "1996-08-21", "2023-02-10", "SINGLE",   "Bobo-Dioulasso"),
]

ACCOUNTS = [
    # (emp_idx, login, role)
    (1, "fatimata.sawadogo", "HSE_MANAGER"),
    (2, "ibrahim.kabore",    "HSE_OFFICER"),
]

LOCATIONS = [
    # (name, lat, lon)
    ("Open Pit Est - SYR",          11.185, -4.295),
    ("Open Pit Ouest - SYR",        11.180, -4.302),
    ("Usine de traitement - SYR",   11.183, -4.308),
    ("Atelier mécanique - SYR",     11.186, -4.310),
    ("Parc à résidus - SYR",        11.178, -4.315),
    ("Zone d'explosifs - SYR",      11.172, -4.312),
    ("Camp & Bureaux - SYR",        11.188, -4.290),
]

WORK_AREAS = [
    # (name, dept_idx)
    ("Pit Operations - SYR",   0),
    ("Crushing Area - SYR",    1),
    ("Leaching Area - SYR",    1),
    ("Workshop Bay - SYR",     3),
    ("Fuel Storage - SYR",     4),
    ("Magazine Zone - SYR",    0),
    ("TSF Embankment - SYR",   0),
    ("Office Block - SYR",     2),
]

WORK_PROCESSES = [
    # (name, dept_idx)
    ("Drilling and Blasting - SYR",        0),
    ("Loading and Hauling - SYR",          0),
    ("Primary Crushing - SYR",             1),
    ("Heap Leaching - SYR",                1),
    ("Gold Recovery (CIL) - SYR",          1),
    ("Heavy Equipment Maintenance - SYR",  3),
    ("Welding and Hot Works - SYR",        3),
    ("Working at Height - SYR",            3),
    ("Confined Space Entry - SYR",         3),
    ("Electrical Work - SYR",              3),
    ("Hazardous Chemical Handling - SYR",  1),
    ("Fuel Handling - SYR",                4),
]

AUDIT_AREAS_DATA = [
    ("Processus opérationnels - SYR",  "Process"),
    ("Conformité réglementaire - SYR", "Compliance"),
    ("Système management HSE - SYR",   "Management"),
    ("Sous-traitants HSE - SYR",       "Contractors"),
    ("Hygiène industrielle - SYR",     "Industrial Hygiene"),
]

# incident_status: 0=PENDING, 1=REPORTED, 2=INVESTIGATION, 3=INV_COMPLETED,
#                  4=CORRECTIVE_ACTIONS, 5=CLOSED, 6=REJECTED
# weather: Ensoleillé, Nuageux, Pluvieux, Orageux, Harmattan, Brumeux
# investigation methods: 5 Whys, ICAM, Bow Tie, Fault Tree
INCIDENTS = [
    # (title, occurred_at, weather, final_status, cat_dept_idx, loc_idx, wa_idx, wp_idx, method)
    ("Chute d'objet depuis convoyeur",
     "2025-01-15 08:30:00", "Ensoleillé", 5, 1, 2, 1, 2, "5 Whys"),
    ("Glissade sur rampe d'accès pit",
     "2025-03-08 14:15:00", "Pluvieux",   5, 0, 0, 0, 1, "ICAM"),
    ("Fuite gasoil réservoir auxiliaire",
     "2025-04-22 10:45:00", "Nuageux",    5, 4, 4, 4, 11, "5 Whys"),
    ("Quasi-collision engin-piéton zone pit",
     "2025-06-10 06:20:00", "Brumeux",    4, 0, 0, 0, 1, "Bow Tie"),
    ("Projection oculaire meulage atelier",
     "2025-07-18 11:00:00", "Ensoleillé", 4, 3, 3, 3, 6, "5 Whys"),
    ("EPI non porté — zone de dynamitage",
     "2025-09-03 15:30:00", "Harmattan",  3, 0, 5, 5, 0, "ICAM"),
    ("Court-circuit tableau électrique usine",
     "2025-10-12 22:10:00", "Nuageux",    3, 3, 2, 1, 9, "Fault Tree"),
    ("Contusion bras — chute de plain-pied",
     "2025-11-25 09:45:00", "Ensoleillé", 2, 1, 2, 2, 4, "5 Whys"),
    ("Déversement cyanure mineur — lixiviation",
     "2026-01-14 13:20:00", "Nuageux",    2, 1, 2, 2, 10, "ICAM"),
    ("Zone de travaux non balisée — pit ouest",
     "2026-02-20 07:50:00", "Ensoleillé", 2, 0, 1, 0, 0, "5 Whys"),
    ("Entorse cheville — escalier usine",
     "2026-03-18 16:30:00", "Pluvieux",   1, 1, 2, 2, 3, None),
    ("Émission poussière hors seuil — concassage",
     "2026-04-05 10:15:00", "Harmattan",  1, 1, 2, 1, 2, None),
    ("Collision légère entre engins — rampe pit",
     "2026-05-12 05:45:00", "Brumeux",    0, 0, 0, 0, 1, None),
    ("Bouteille gaz instable — atelier soudure",
     "2026-06-01 14:00:00", "Ensoleillé", 0, 3, 3, 3, 6, None),
    ("Doublon — Glissade rampe (rejeté)",
     "2025-03-09 08:00:00", "Pluvieux",   6, 0, 0, 0, 1, None),
]

# Incident categories — resolved DYNAMICALLY at runtime by name
# (category_name, type_name, severity_name)
INCIDENT_CATS_BY_NAME = [
    ("Health & Safety",  "Near Miss",              "Mineure"),    # Chute d'objet
    ("Health & Safety",  "Near Miss",              "Mineure"),    # Glissade
    ("Environnement",   "Déversement mineur",      "Mineure"),    # Fuite gasoil
    ("Health & Safety",  "Near Miss",              "Modérée"),    # Quasi-collision
    ("Health & Safety",  "First Aid",              "Mineure"),    # Projection oculaire
    ("Health & Safety",  "Near Miss",              "Modérée"),    # EPI non porté
    ("Capital Social",   "Panne critique",         "Modérée"),    # Court-circuit
    ("Health & Safety",  "First Aid",              "Mineure"),    # Contusion bras
    ("Environnement",   "Pollution à court terme", "Modérée"),    # Déversement cyanure
    ("Health & Safety",  "Near Miss",              "Mineure"),    # Zone non balisée
    ("Health & Safety",  "Injury with treatment",  "Mineure"),    # Entorse cheville
    ("Environnement",   "Pollution à court terme", "Mineure"),    # Émission poussière
    ("Capital Social",   "Petit dommage matériel", "Mineure"),    # Collision engins
    ("Health & Safety",  "Near Miss",              "Modérée"),    # Bouteille gaz
    ("Health & Safety",  "Near Miss",              "Mineure"),    # Doublon rejeté
]

# audit_status: 0=PLANNING, 1=PREPARATION, 2=EXECUTION, 3=CLOSED, 4=CANCELLED
# audit_category: 0=INTERNAL, 1=EXTERNAL
# planning_status: 0=PENDING, 1=APPROVED, 2=REJECTED
AUDITS = [
    # (title, ref, category, status, planning_status, start, end, scope_area_idx, types_json)
    ("Audit interne SST Q1 2026",
     "AUD-SYR-INT-2026-001", 0, 3, 1,
     "2026-01-15", "2026-01-22", 0,
     '{"SST": ["ISO 45001"]}'),
    ("Audit externe ISO 14001 — Environnement",
     "AUD-SYR-EXT-2026-002", 1, 3, 1,
     "2026-02-10", "2026-02-14", 1,
     '{"Environnement": ["ISO 14001"]}'),
    ("Audit interne sous-traitants HSE",
     "AUD-SYR-INT-2026-003", 0, 2, 1,
     "2026-04-01", "2026-04-05", 3,
     '{"SST": ["ISO 45001"], "Sous-traitance": ["Procédures internes"]}'),
    ("Audit hygiène industrielle — bruit & poussière",
     "AUD-SYR-INT-2026-004", 0, 1, 1,
     "2026-06-15", "2026-06-20", 4,
     '{"Hygiène": ["NF EN 689", "ISO 45001 §8.1.2"]}'),
    ("Audit management HSE — revue direction",
     "AUD-SYR-INT-2026-005", 0, 0, 0,
     "2026-09-01", "2026-09-05", 2,
     '{"Management": ["ISO 45001 §9.3"]}'),
    ("Audit interne EPI & Protection individuelle",
     "AUD-SYR-INT-2025-006", 0, 3, 1,
     "2025-11-10", "2025-11-14", 0,
     '{"SST": ["ISO 45001 §8.1.2", "EN 397"]}'),
]


# ═══════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════

def dt(s):
    return datetime.strptime(s, "%Y-%m-%d %H:%M:%S") if " " in s else datetime.strptime(s, "%Y-%m-%d")


def upsert_check(cur, table, col, val, schema=None):
    """Return existing id or None."""
    q = f"SELECT id FROM {table} WHERE {col}=%s"
    cur.execute(q, (val,))
    row = cur.fetchone()
    return row[0] if row else None


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

def main():
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # ── DEFAULTDB ─────────────────────────────────────────────────────────
    cn_hr = db_env.connect("defaultdb")
    cur_hr = cn_hr.cursor()

    # 1. Company
    syr_id = upsert_check(cur_hr, "company", "name", "SANAMA YIRI")
    if syr_id:
        print(f"[1] Mine SANAMA YIRI deja presente (id={syr_id})")
    else:
        cur_hr.execute(
            "INSERT INTO company (name, short_name, country, region, locality, material,"
            " start_date, creation_date, status, status_date)"
            " VALUES (%s,%s,%s,%s,%s,%s,%s,%s,0,%s)",
            ("SANAMA YIRI", "SYR", "Burkina Faso", "Hauts-Bassins", "Bobo-Dioulasso",
             "Or", "2015-03-01", now, now),
        )
        syr_id = cur_hr.lastrowid
        print(f"[1] Mine SANAMA YIRI creee (id={syr_id})")

    # 2. Departments
    dept_ids = {}
    created = 0
    for name, short, direction, sector in DEPARTMENTS:
        existing = upsert_check(cur_hr, "department", "name",  name)
        # Check specifically for this company
        cur_hr.execute("SELECT id FROM department WHERE name=%s AND company_id=%s", (name, syr_id))
        row = cur_hr.fetchone()
        if row:
            dept_ids[name] = row[0]
        else:
            cur_hr.execute(
                "INSERT INTO department (name, short_name, direction, sector, status,"
                " creation_date, company_id) VALUES (%s,%s,%s,%s,1,%s,%s)",
                (name, short, direction, sector, "2015-03-15", syr_id),
            )
            dept_ids[name] = cur_hr.lastrowid
            created += 1
    dept_list = list(dept_ids.values())
    print(f"[2] Departements SYR : {created} crees, {len(DEPARTMENTS)-created} existants")

    # 3. Positions
    pos_ids = {}
    created = 0
    for name, short, salary, cat_id in POSITIONS:
        cur_hr.execute(
            "SELECT id FROM `position` WHERE name=%s AND company_id=%s", (name, syr_id))
        row = cur_hr.fetchone()
        if row:
            pos_ids[name] = row[0]
        else:
            cur_hr.execute(
                "INSERT INTO `position` (name, short_name, basic_salary, status,"
                " creation_date, company_id, position_category_id)"
                " VALUES (%s,%s,%s,1,%s,%s,%s)",
                (name, short, salary, now, syr_id, cat_id),
            )
            pos_ids[name] = cur_hr.lastrowid
            created += 1
    pos_list = list(pos_ids.values())
    print(f"[3] Positions SYR : {created} crees, {len(POSITIONS)-created} existantes")

    # 4. Employees
    emp_ids = []
    created = 0
    for i, (first, family, gender, d_idx, p_idx, birth, start, marital, city) in enumerate(EMPLOYEES):
        email = f"{first.lower()}.{family.lower()}@sanama-yiri.bf"
        cur_hr.execute("SELECT id FROM employee WHERE email=%s", (email,))
        row = cur_hr.fetchone()
        if row:
            emp_ids.append(row[0])
            continue
        dept_name = DEPARTMENTS[d_idx][0]
        pos_name  = POSITIONS[p_idx][0]
        cur_hr.execute(
            "INSERT INTO employee (first_name, family_name, gender, date_of_birth,"
            " nationality, city_of_birth, login, email, professional_email,"
            " phone_number, start_date, status, hours_per_day, unique_number,"
            " marital_status, company_id, department_id, position_id)"
            " VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (first, family, gender, birth,
             "Burkinabe", city,
             f"{first.lower()}.{family.lower()}", email, email,
             f"+226{70000000 + i*111111:08d}", start, "ACTIVE", 8,
             f"SYR-EMP-{200+i:04d}", marital, syr_id,
             dept_ids[dept_name], pos_ids[pos_name]),
        )
        emp_ids.append(cur_hr.lastrowid)
        created += 1
    print(f"[4] Employes SYR : {created} crees, {len(EMPLOYEES)-created} existants")

    # 5. Accounts
    created = 0
    for emp_idx, login, role in ACCOUNTS:
        cur_hr.execute("SELECT id FROM account WHERE login=%s", (login,))
        if cur_hr.fetchone():
            continue
        emp_i = emp_idx
        emp_data = EMPLOYEES[emp_i]
        email = f"{emp_data[0].lower()}.{emp_data[1].lower()}@sanama-yiri.bf"
        dept_name = DEPARTMENTS[emp_data[3]][0]
        pos_name  = POSITIONS[emp_data[4]][0]
        cur_hr.execute(
            "INSERT INTO account (name, login, email, role, password, first_login,"
            " status, start_date, company_id, department_id, position_id, emp_id,"
            " employee_permission, company_permission, department_permission,"
            " job_positions, user_accounts_and_roles)"
            " VALUES (%s,%s,%s,%s,%s,0,'ACTIVE',%s,%s,%s,%s,%s,1,1,1,1,1)",
            (f"{emp_data[0]} {emp_data[1]}", login, email, role, BCRYPT_HASH,
             now, syr_id, dept_ids[dept_name], pos_ids[pos_name], emp_ids[emp_i]),
        )
        created += 1
    print(f"[5] Comptes SYR : {created} crees")

    cn_hr.commit()
    print("    [defaultdb COMMIT OK]")

    # ── HEALTHSAFETY ──────────────────────────────────────────────────────
    cn_hs = db_env.connect("healthsafety")
    cur_hs = cn_hs.cursor()

    # 6. Locations
    loc_ids = []
    created = 0
    for name, lat, lon in LOCATIONS:
        cur_hs.execute("SELECT id FROM location WHERE name=%s", (name,))
        row = cur_hs.fetchone()
        if row:
            loc_ids.append(row[0])
        else:
            cur_hs.execute(
                "INSERT INTO location (name, latitude, longitude, status, company_id, created_at)"
                " VALUES (%s,%s,%s,1,%s,%s)",
                (name, lat, lon, syr_id, now),
            )
            loc_ids.append(cur_hs.lastrowid)
            created += 1
    print(f"[6] Locations SYR : {created} crees, {len(LOCATIONS)-created} existantes")

    # 7. Work Areas
    wa_ids = []
    created = 0
    for name, d_idx in WORK_AREAS:
        cur_hs.execute("SELECT id FROM work_area WHERE name=%s", (name,))
        row = cur_hs.fetchone()
        if row:
            wa_ids.append(row[0])
        else:
            cur_hs.execute(
                "INSERT INTO work_area (name, department_id, company_id, status, created_at)"
                " VALUES (%s,%s,%s,1,%s)",
                (name, dept_list[d_idx], syr_id, now),
            )
            wa_ids.append(cur_hs.lastrowid)
            created += 1
    print(f"[7] Work Areas SYR : {created} crees, {len(WORK_AREAS)-created} existantes")

    # 8. Work Processes
    wp_ids = []
    created = 0
    for name, d_idx in WORK_PROCESSES:
        cur_hs.execute("SELECT id FROM work_process WHERE name=%s", (name,))
        row = cur_hs.fetchone()
        if row:
            wp_ids.append(row[0])
        else:
            cur_hs.execute(
                "INSERT INTO work_process (name, department_id, company_id, status, created_at)"
                " VALUES (%s,%s,%s,1,%s)",
                (name, dept_list[d_idx], syr_id, now),
            )
            wp_ids.append(cur_hs.lastrowid)
            created += 1
    print(f"[8] Work Processes SYR : {created} crees, {len(WORK_PROCESSES)-created} existants")

    # 9. Audit Areas
    aa_ids = []
    created = 0
    for name, atype in AUDIT_AREAS_DATA:
        cur_hs.execute("SELECT id FROM audit_areas WHERE name=%s", (name,))
        row = cur_hs.fetchone()
        if row:
            aa_ids.append(row[0])
        else:
            cur_hs.execute(
                "INSERT INTO audit_areas (name, type, status, company_id, created_at)"
                " VALUES (%s,%s,1,%s,%s)",
                (name, atype, syr_id, now),
            )
            aa_ids.append(cur_hs.lastrowid)
            created += 1
    print(f"[9] Audit Areas SYR : {created} crees, {len(AUDIT_AREAS_DATA)-created} existantes")

    # 10. Incidents (15)
    # Resolve incident category/type/severity IDs dynamically by name
    cat_name_to_id = {}
    cur_hs.execute("SELECT id, name FROM incident_category")
    for row in cur_hs.fetchall():
        cat_name_to_id[row[1]] = row[0]

    type_name_to_id = {}
    cur_hs.execute("SELECT id, name, incident_category_id FROM incident_type")
    for row in cur_hs.fetchall():
        type_name_to_id[(row[1], row[2])] = row[0]

    sev_name_to_id = {}
    cur_hs.execute("SELECT id, name, incident_category_id FROM severity_level")
    for row in cur_hs.fetchall():
        key = (row[1], row[2])
        if key not in sev_name_to_id:
            sev_name_to_id[key] = row[0]

    INCIDENT_CATS = []
    for cat_name, type_name, sev_name in INCIDENT_CATS_BY_NAME:
        c_id = cat_name_to_id.get(cat_name)
        if c_id is None:
            raise SystemExit(f"incident_category '{cat_name}' introuvable en base")
        t_id = type_name_to_id.get((type_name, c_id))
        if t_id is None:
            raise SystemExit(f"incident_type '{type_name}' (cat={cat_name}) introuvable en base")
        s_id = sev_name_to_id.get((sev_name, c_id))
        if s_id is None:
            raise SystemExit(f"severity_level '{sev_name}' (cat={cat_name}) introuvable en base")
        INCIDENT_CATS.append((c_id, t_id, s_id))
    print(f"    [Resolved {len(INCIDENT_CATS)} incident categories dynamically]")

    inc_ids = []
    hist_count = 0
    inv_count = 0
    ana_count = 0
    inc_created = 0

    for idx, inc in enumerate(INCIDENTS):
        title, occurred, weather, final_status, d_idx, l_idx, wa_idx, wp_idx, method = inc
        cat_id, type_id, sev_id = INCIDENT_CATS[idx]
        number = f"INC-SYR-{dt(occurred).year}-{idx+1:04d}"

        cur_hs.execute("SELECT id FROM incident WHERE number=%s", (number,))
        row = cur_hs.fetchone()
        if row:
            inc_ids.append(row[0])
            continue

        occ = dt(occurred)
        disc = occ + timedelta(minutes=35)
        reporter = emp_ids[d_idx * 4]  # pick an employee from the dept group

        cur_hs.execute(
            "INSERT INTO incident (number, title, occurred_at, discovery_time,"
            " weather_conditions, status, company_id, department_id, reporter_id,"
            " location_id, work_area_id, work_process_id, created_at, updated_at)"
            " VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (number, title, occ, disc, weather, final_status, syr_id,
             dept_list[d_idx], reporter,
             loc_ids[l_idx], wa_ids[wa_idx], wp_ids[wp_idx], occ, occ),
        )
        inc_id = cur_hs.lastrowid
        inc_ids.append(inc_id)
        inc_created += 1

        # Incident Detail
        cur_hs.execute(
            "INSERT INTO incident_detail (incident_id, incident_category_id,"
            " incident_type_id, severity_level_id, created_at, updated_at)"
            " VALUES (%s,%s,%s,%s,%s,%s)",
            (inc_id, cat_id, type_id, sev_id, occ, occ),
        )

        # History — build transitions up to final_status
        status_labels = {
            0: "Declaration initiale",
            1: "Incident signale — en attente d'investigation",
            2: "Investigation lancee",
            3: "Analyse causale terminee",
            4: "Actions correctives en cours",
            5: "Incident cloture apres verification efficacite",
            6: "Incident rejete — doublon ou erreur",
        }
        hist_date = occ
        for s in range(final_status + 1):
            cur_hs.execute(
                "INSERT INTO incident_history (incident_id, status, date, comment,"
                " created_at, owner_id)"
                " VALUES (%s,%s,%s,%s,%s,%s)",
                (inc_id, s, hist_date.strftime("%Y-%m-%d"),
                 status_labels.get(s, ""), hist_date, reporter),
            )
            hist_count += 1
            hist_date += timedelta(days=3 + idx % 5)

        # Investigation (for status >= 2)
        if final_status >= 2 and method:
            progress = {2: 40, 3: 80, 4: 95, 5: 100}.get(final_status, 30)
            inv_status = 2 if final_status >= 5 else (1 if final_status >= 3 else 0)
            inv_start = occ + timedelta(days=3)
            cur_hs.execute(
                "INSERT INTO incident_investigation (incident_id, company_id, status,"
                " method, start_date, progress, team, created_at, updated_at)"
                " VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                (inc_id, syr_id, inv_status, method,
                 inv_start.strftime("%Y-%m-%d"), progress,
                 "Equipe HSE SYR + Superviseur", inv_start, inv_start),
            )
            inv_count += 1

        # Analysis (for status >= 3)
        if final_status >= 3:
            ana_date = occ + timedelta(days=10)
            root_causes = [
                "Manque de formation specifique au poste",
                "Procedure operatoire non respectee",
                "Defaut de supervision sur le terrain",
                "Fatigue / fin de shift prolonge",
            ]
            imm_causes = [
                "EPI inadapte ou non porte",
                "Signalisation insuffisante",
                "Communication inter-equipes defaillante",
            ]
            cur_hs.execute(
                "INSERT INTO incident_analysis (incident_id, root_causes,"
                " immediate_causes, immediate_actions, factual_description, created_at)"
                " VALUES (%s,%s,%s,%s,%s,%s)",
                (inc_id,
                 f"Causes profondes: {root_causes[idx % len(root_causes)]}",
                 f"Causes immediates: {imm_causes[idx % len(imm_causes)]}",
                 "Securisation zone, briefing immediat, declaration interne",
                 f"Evenement survenu sur le site SANAMA YIRI. {title}. "
                 f"Conditions meteo: {weather}. Investigation methode {method or 'N/A'}.",
                 ana_date),
            )
            ana_count += 1

    print(f"[10] Incidents SYR : {inc_created} crees, "
          f"{hist_count} historiques, {inv_count} investigations, {ana_count} analyses")

    # 11. Audits (6)
    aud_created = 0
    obs_count = 0
    rec_count = 0
    auditor_count = 0

    for a_idx, aud in enumerate(AUDITS):
        title, ref, category, status, plan_status, start, end, scope_idx, types_json = aud

        cur_hs.execute("SELECT id FROM audit WHERE ref_number=%s", (ref,))
        if cur_hs.fetchone():
            continue

        start_d = dt(start)
        end_d   = dt(end)
        scope_id = aa_ids[scope_idx]

        cur_hs.execute(
            "INSERT INTO audit (title, ref_number, category, status, planning_status,"
            " scope_id, start_date, end_date, audit_types,"
            " objectives, methods, processes, description,"
            " created_at, updated_at)"
            " VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (title, ref, category, status, plan_status,
             scope_id, start, end, types_json,
             f"Evaluer la conformite {title.split('—')[0].strip()}",
             "Revue documentaire, entretiens, observation terrain, echantillonnage",
             "Processus operationnels, maintenance, HSE terrain",
             f"Audit planifie pour le site SANAMA YIRI — {title}",
             start_d, start_d),
        )
        aud_id = cur_hs.lastrowid
        aud_created += 1

        # Auditors (2-3 per audit)
        auditors = [
            ("Fatimata Sawadogo",  "Lead Auditor",      "fatimata.sawadogo@sanama-yiri.bf"),
            ("Ibrahim Kabore",     "Co-Auditor",         "ibrahim.kabore@sanama-yiri.bf"),
            ("Expert Externe ISO", "External Specialist", "expert.iso@bureau-veritas.bf"),
        ]
        for a_name, a_role, a_email in auditors[:2 + (a_idx % 2)]:
            cur_hs.execute(
                "INSERT INTO auditor (audit_id, name, role, email, created_at, updated_at)"
                " VALUES (%s,%s,%s,%s,%s,%s)",
                (aud_id, a_name, a_role, a_email, start_d, start_d),
            )
            auditor_count += 1

        # Observations (for EXECUTION and CLOSED audits, status >= 2)
        if status >= 2:
            observations = []
            if a_idx == 0:  # SST CLOSED
                observations = [
                    ("Registre EPI incomplet", "NC_MINEURE", 2,
                     "Le registre de distribution EPI ne couvre pas les sous-traitants",
                     "8.1.2"),
                    ("Formation evacuation insuffisante", "OBSERVATION", 1,
                     "Seuls 60% du personnel ont suivi l'exercice d'evacuation Q4",
                     "7.2"),
                    ("Affichage consignes obsolete", "NC_MINEURE", 2,
                     "Consignes de securite pit datant de 2022, non mises a jour",
                     "7.4"),
                ]
            elif a_idx == 1:  # ENV CLOSED
                observations = [
                    ("Suivi emissions non conforme", "NC_MAJEURE", 4,
                     "Aucun releve d'emissions PM10 depuis 3 mois",
                     "8.1"),
                    ("Registre dechets dangereux incomplet", "NC_MINEURE", 2,
                     "Borderaux de suivi manquants pour 12 envois",
                     "8.1"),
                    ("Opportunite — monitoring continu", "OPPORTUNITE", 1,
                     "Installation de capteurs continus PM2.5/PM10 recommandee",
                     "10.3"),
                ]
            elif a_idx == 2:  # EXECUTION — sous-traitants
                observations = [
                    ("Permis de travail sous-traitant non vise", "NC_MINEURE", 2,
                     "3 permis hot-work sans visa HSE sur 15 verifies",
                     "8.1.4"),
                    ("Habilitations electriques expirees", "OBSERVATION", 1,
                     "2 techniciens sous-traitants avec habilitation perimee",
                     "7.2"),
                ]
            elif a_idx == 5:  # CLOSED — EPI & Protection
                observations = [
                    ("Stock EPI insuffisant casques", "NC_MINEURE", 2,
                     "Stock casques EN 397 en dessous du seuil minimal (28/50)",
                     "8.1.2"),
                    ("Registre distribution gants incomplet", "OBSERVATION", 1,
                     "Registre de distribution gants anti-coupure non tenu depuis 2 mois",
                     "7.5"),
                ]

            for obs_title, classification, severity, fact, clause in observations:
                cur_hs.execute(
                    "INSERT INTO audit_observations (audit_id, zone_id, title, type,"
                    " severity, observed_fact, description, classification, clause,"
                    " date, created_at, updated_at)"
                    " VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                    (aud_id, scope_id, obs_title, classification, severity,
                     fact, f"Constat: {fact}",
                     classification, clause,
                     start, start_d, start_d),
                )
                obs_id = cur_hs.lastrowid
                obs_count += 1

                # Recommendation per observation
                if status >= 2:
                    rec_status = 2 if status >= 3 else 0  # COMPLETED if closed, else OPEN
                    rec_progress = 100 if status >= 3 else 20
                    deadline = end_d + timedelta(days=30 + a_idx * 15)
                    cur_hs.execute(
                        "INSERT INTO recommendation (audit_id, observation_id, title,"
                        " description, priority, corrective_action, deadline,"
                        " status, progress, created_at, updated_at)"
                        " VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                        (aud_id, obs_id,
                         f"Action corrective — {obs_title}",
                         f"Corriger la non-conformite: {fact}",
                         "HIGH" if severity >= 3 else "MEDIUM",
                         f"Mettre en place les mesures correctives pour {obs_title}",
                         deadline.strftime("%Y-%m-%d"),
                         rec_status, rec_progress, start_d, start_d),
                    )
                    rec_count += 1

        # Audit History (for CLOSED audits)
        if status == 3:
            cur_hs.execute(
                "INSERT INTO audit_history (audit_id, owner_id, status, date, comment,"
                " closing_report, lesson_learned, rating)"
                " VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                (aud_id, emp_ids[1], status, end,
                 f"Audit cloture — {title}",
                 f"Rapport final {ref} valide par la direction HSE SANAMA YIRI",
                 "Renforcer la formation terrain et la traçabilite documentaire",
                 4),
            )

    print(f"[11] Audits SYR : {aud_created} crees, {obs_count} observations, "
          f"{rec_count} recommandations, {auditor_count} auditeurs")

    cn_hs.commit()
    print("    [healthsafety COMMIT OK]")

    # ── VERIFICATION FINALE ───────────────────────────────────────────────
    print("\n=== VERIFICATION FINALE ===")
    cur_hr.execute(
        "SELECT c.name, (SELECT COUNT(*) FROM employee e WHERE e.company_id=c.id),"
        " (SELECT COUNT(*) FROM account a WHERE a.company_id=c.id)"
        " FROM company c ORDER BY c.id")
    for name, emp_n, acc_n in cur_hr.fetchall():
        print(f"  {name}: {emp_n} employes, {acc_n} comptes")

    for tbl in ["location", "work_area", "work_process", "audit_areas",
                "incident", "audit", "audit_observations", "recommendation"]:
        cur_hs.execute(f"SELECT COUNT(*) FROM {tbl}")
        print(f"  {tbl}: {cur_hs.fetchone()[0]} total")

    cn_hr.close()
    cn_hs.close()
    print("\n[OK] Seed SANAMA YIRI termine avec succes.")


if __name__ == "__main__":
    main()

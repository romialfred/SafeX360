# -*- coding: utf-8 -*-
"""
LOT 52 — Seed de la deuxième mine « Canadian Mining Company » + rattachement.

Actions (idempotentes) :
  1. Crée la mine Canadian Mining Company (CMC) si absente.
  2. Crée 7 départements CMC.
  3. Crée 10 employés canadiens réalistes rattachés à CMC.
  4. Assignation automatique : tous les comptes sans mine -> mine principale (id 1).
  5. Crée 2 comptes utilisateurs CMC via l'API admin STRICTE (POST /hrms/admin/users/create)
     en source ACTIVE_DIRECTORY (annuaire démo) — teste le flux AD de bout en bout.

Cible : la base du Backend/.env (locale par défaut). Usage :
    python seed_canadian_mine.py            # base locale + API locale (8080)
    python seed_canadian_mine.py --sql-only # uniquement les étapes SQL (pour la prod,
                                            # après bascule du .env ou via DB_URL_*_AIVEN)
"""
import json
import sys
import urllib.request
from datetime import datetime

import db_env

# Surchargables par variables d'environnement pour cibler la prod
import os
API_BASE = os.environ.get("SEED_API_BASE", "http://localhost:8080/hrms")
SQL_ONLY = "--sql-only" in sys.argv

DEPARTMENTS = [
    "Production", "Maintenance", "HSE", "Géologie",
    "Environnement", "Forage & Dynamitage", "Direction",
]

# (first_name, family_name, email, gender, titre, departement)
EMPLOYEES = [
    ("Émilie",  "Tremblay",  "emilie.tremblay@canadianmining.ca",  "FEMALE", "Mine Operations Manager",  "Production"),
    ("Liam",    "MacDonald", "liam.macdonald@canadianmining.ca",   "MALE",   "Reliability Engineer",     "Maintenance"),
    ("Sophie",  "Gagnon",    "sophie.gagnon@canadianmining.ca",    "FEMALE", "EHS Superintendent",       "HSE"),
    ("Noah",    "Singh",     "noah.singh@canadianmining.ca",       "MALE",   "Senior Geologist",         "Géologie"),
    ("Camille", "Bouchard",  "camille.bouchard@canadianmining.ca", "FEMALE", "Environmental Advisor",    "Environnement"),
    ("William", "Fortin",    "william.fortin@canadianmining.ca",   "MALE",   "Blast Supervisor",         "Forage & Dynamitage"),
    ("Ryan",    "Thompson",  "ryan.thompson@canadianmining.ca",    "MALE",   "General Manager",          "Direction"),
    ("Maya",    "Larouche",  "maya.larouche@canadianmining.ca",    "FEMALE", "Shift Supervisor",         "Production"),
    ("Ethan",   "Côté",      "ethan.cote@canadianmining.ca",       "MALE",   "Mechanical Technician",    "Maintenance"),
    ("Olivia",  "Bergeron",  "olivia.bergeron@canadianmining.ca",  "FEMALE", "Safety Trainer",           "HSE"),
]

# Comptes utilisateurs CMC créés via l'API stricte (source ACTIVE_DIRECTORY, annuaire démo)
USERS = [
    {
        "login": "sgagnon", "email": "sophie.gagnon@canadianmining.ca", "name": "Sophie Gagnon",
        "role": "HEALTH_SAFETY_COORDINATOR",
        "allowedModules": "home,nonConformity,inspections,meetings,ppeOverview,ppeMonitoring,ppeRequest,"
                          "incidentManagement,investigations,actionPlansInc,pendingActions,actionPlan,"
                          "recommendations,auditPlan,audits,riskOverview,riskRegister,riskAssessment,"
                          "documents,commDashboard",
        "identitySource": "ACTIVE_DIRECTORY",
    },
    {
        "login": "etremblay", "email": "emilie.tremblay@canadianmining.ca", "name": "Émilie Tremblay",
        "role": "AUDITOR",
        "allowedModules": "home,auditPlan,audits,auditRecommendations,complianceDashboard,requirements,"
                          "riskOverview,riskRegister,documents,documentValidation",
        "identitySource": "ACTIVE_DIRECTORY",
    },
]


def main():
    cn = db_env.connect("defaultdb")
    cur = cn.cursor()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # ── 1. Mine Canadian Mining Company ──────────────────────────────────
    cur.execute("SELECT id FROM company WHERE name = %s", ("Canadian Mining Company",))
    row = cur.fetchone()
    if row:
        cmc_id = row[0]
        print(f"[1] Mine deja presente (id={cmc_id})")
    else:
        cur.execute(
            "INSERT INTO company (name, short_name, country, region, locality, material,"
            " start_date, creation_date, status_date, status)"
            " VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,0)",
            ("Canadian Mining Company", "CMC", "Canada", "Québec", "Val-d'Or", "Or", now, now, now),
        )
        cmc_id = cur.lastrowid
        print(f"[1] Mine Canadian Mining Company creee (id={cmc_id})")

    # ── 2. Departements CMC ───────────────────────────────────────────────
    dept_ids = {}
    created = 0
    for name in DEPARTMENTS:
        cur.execute("SELECT id FROM department WHERE name=%s AND company_id=%s", (name, cmc_id))
        row = cur.fetchone()
        if row:
            dept_ids[name] = row[0]
        else:
            cur.execute("INSERT INTO department (name, company_id) VALUES (%s,%s)", (name, cmc_id))
            dept_ids[name] = cur.lastrowid
            created += 1
    print(f"[2] Departements CMC : {created} crees, {len(DEPARTMENTS)-created} existants")

    # ── 3. Employes CMC ───────────────────────────────────────────────────
    created = 0
    for i, (first, family, email, gender, title, dept) in enumerate(EMPLOYEES, start=1):
        cur.execute("SELECT id FROM employee WHERE email=%s", (email,))
        if cur.fetchone():
            continue
        cur.execute(
            "INSERT INTO employee (first_name, family_name, email, gender, title, status,"
            " unique_number, start_date, company_id, department_id, nationality, work_location,"
            " hours_per_day)"
            " VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (first, family, email, gender, title, "ACTIVE",
             f"CMC-{i:03d}", now, cmc_id, dept_ids[dept], "Canadienne", "Val-d'Or", 8),
        )
        created += 1
    print(f"[3] Employes CMC : {created} crees, {len(EMPLOYEES)-created} existants")

    # ── 4. Assignation automatique des comptes orphelins -> mine principale ──
    cur.execute("UPDATE account SET company_id = 1 WHERE company_id IS NULL")
    print(f"[4] Comptes orphelins rattaches a la mine principale : {cur.rowcount}")

    cn.commit()

    # ── 5. Comptes utilisateurs CMC via l'API admin stricte ──────────────
    if SQL_ONLY:
        print("[5] --sql-only : creation des comptes via API ignoree")
    else:
        secret = db_env._env("INTERNAL_GATEWAY_SECRET")
        for u in USERS:
            cur.execute("SELECT id FROM account WHERE login=%s", (u["login"],))
            if cur.fetchone():
                print(f"[5] Compte {u['login']} deja present")
                continue
            body = dict(u)
            body["companyId"] = cmc_id
            req = urllib.request.Request(
                f"{API_BASE}/admin/users/create",
                data=json.dumps(body).encode(),
                headers={"Content-Type": "application/json", "X-Secret-Key": secret},
                method="POST",
            )
            try:
                resp = json.load(urllib.request.urlopen(req, timeout=30))
                print(f"[5] Compte {u['login']} cree via API : {resp.get('message')}")
            except urllib.error.HTTPError as e:
                print(f"[5] ECHEC creation {u['login']} : {e.code} {e.read().decode()[:200]}")

    # ── Verification finale ───────────────────────────────────────────────
    cur.execute("SELECT c.name, COUNT(e.id) FROM company c LEFT JOIN employee e ON e.company_id=c.id GROUP BY c.id")
    for name, n in cur.fetchall():
        print(f"    {name}: {n} employes")
    cur.execute("SELECT COUNT(*) FROM account WHERE company_id IS NULL")
    print(f"    comptes sans mine restants : {cur.fetchone()[0]}")
    cn.close()


if __name__ == "__main__":
    main()

"""
seed_evacuation_params — initialise les parametres d'evacuation du personnel (SIRH).

Cree, pour CHAQUE employe actif, une ligne employee_evacuation (defaultdb) :
  - priorite P1 automatique pour tout Directeur (intitule de poste),
  - point de rassemblement derive du departement (assembly_point.department_ids, healthsafety),
  - un contact d'urgence pre-rempli depuis family_details quand un telephone existe.

Idempotent et NON destructif : ne remplace jamais une priorite / un point / un
contact deja definis (COALESCE + "si absent"). Tables auto-creees si absentes
(schema identique a JPA ddl-auto=update).

Cible : la base configuree dans Backend/.env (DB_URL_HNS). Pour la prod Aiven :
  DB_URL_HNS="<DB_URL_HNS_AIVEN>" DB_URL="<...>" DB_USERNAME=... DB_PASSWORD=... python seed_evacuation_params.py
JAMAIS de credentials en dur (depot public).
"""
import re

from db_env import connect

DIRECTOR_RE = re.compile(r"directeur|directrice|director", re.IGNORECASE)

DDL_EVAC = """
CREATE TABLE IF NOT EXISTS employee_evacuation (
  id BIGINT NOT NULL AUTO_INCREMENT,
  employee_id BIGINT NOT NULL,
  company_id BIGINT,
  priority_level VARCHAR(4),
  assembly_point_id BIGINT,
  special_needs VARCHAR(255),
  updated_by BIGINT,
  updated_at DATETIME(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_employee_evacuation_emp (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
"""

DDL_CONTACT = """
CREATE TABLE IF NOT EXISTS employee_emergency_contact (
  id BIGINT NOT NULL AUTO_INCREMENT,
  employee_id BIGINT NOT NULL,
  company_id BIGINT,
  name VARCHAR(150),
  relationship VARCHAR(80),
  phone VARCHAR(40),
  alt_phone VARCHAR(40),
  email VARCHAR(150),
  priority INT,
  note VARCHAR(255),
  created_at DATETIME(6),
  PRIMARY KEY (id),
  KEY idx_emergency_contact_emp (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
"""


def has_table(cur, schema, table):
    cur.execute(
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=%s AND table_name=%s",
        (schema, table),
    )
    return cur.fetchone()[0] > 0


def has_column(cur, schema, table, column):
    cur.execute(
        "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=%s AND table_name=%s AND column_name=%s",
        (schema, table, column),
    )
    return cur.fetchone()[0] > 0


def build_department_assembly_map(hs_cur):
    """(company_id, department_id) -> assembly_point_id, en privilegiant la priorite d'evacuation la plus haute (nombre le plus petit)."""
    hs_cur.execute("SELECT id, company_id, department_ids, evacuation_priority FROM assembly_point")
    rows = hs_cur.fetchall()
    # priorite d'evacuation croissante => le point le plus prioritaire est assigne en premier
    rows = sorted(rows, key=lambda r: (r[3] if r[3] is not None else 99))
    mapping = {}
    for ap_id, company_id, dept_csv, _prio in rows:
        if not dept_csv:
            continue
        for tok in str(dept_csv).split(","):
            tok = tok.strip()
            if not tok:
                continue
            try:
                dept_id = int(tok)
            except ValueError:
                continue
            mapping.setdefault((company_id, dept_id), ap_id)
    return mapping


def main():
    hs = connect("healthsafety")
    db = connect("defaultdb")
    try:
        hs_cur = hs.cursor()
        cur = db.cursor()

        # 1. Tables (auto-creation si absentes, schema identique a JPA)
        cur.execute(DDL_EVAC)
        cur.execute(DDL_CONTACT)
        db.commit()

        # 2. Carte departement -> point de rassemblement (healthsafety)
        dept_ap = {}
        if has_table(hs_cur, "healthsafety", "assembly_point"):
            dept_ap = build_department_assembly_map(hs_cur)
        print(f"[map] {len(dept_ap)} affectations departement->point de rassemblement")

        # 3. Employes actifs + intitule de poste
        cur.execute(
            "SELECT e.id, e.company_id, e.department_id, p.name "
            "FROM employee e LEFT JOIN `position` p ON e.position_id = p.id "
            "WHERE (e.effective_end_date IS NULL OR e.effective_end_date > CURDATE())"
        )
        employees = cur.fetchall()
        print(f"[emp] {len(employees)} employes actifs")

        directors = 0
        with_ap = 0
        for emp_id, company_id, dept_id, position_name in employees:
            is_dir = bool(position_name and DIRECTOR_RE.search(position_name))
            priority = "P1" if is_dir else None
            ap_id = dept_ap.get((company_id, dept_id))
            if is_dir:
                directors += 1
            if ap_id:
                with_ap += 1
            # Non destructif : conserve priorite / point deja definis
            cur.execute(
                "INSERT INTO employee_evacuation (employee_id, company_id, priority_level, assembly_point_id, updated_at) "
                "VALUES (%s, %s, %s, %s, NOW(6)) "
                "ON DUPLICATE KEY UPDATE "
                "  company_id = VALUES(company_id), "
                "  priority_level = COALESCE(priority_level, VALUES(priority_level)), "
                "  assembly_point_id = COALESCE(assembly_point_id, VALUES(assembly_point_id)), "
                "  updated_at = NOW(6)",
                (emp_id, company_id, priority, ap_id),
            )
        db.commit()
        print(f"[evac] profils garantis pour {len(employees)} employes | {directors} directeurs -> P1 | {with_ap} avec point de rassemblement")

        # 4. Contact d'urgence pre-rempli depuis family_details (best-effort)
        contacts_created = 0
        if (has_table(cur, "defaultdb", "family_details")
                and has_column(cur, "defaultdb", "family_details", "primary_phone")):
            cur.execute(
                "SELECT fd.employee_id, "
                "  TRIM(CONCAT(COALESCE(fd.first_name,''), ' ', COALESCE(fd.family_name,''))), "
                "  fd.relation, fd.primary_phone, fd.second_phone, fd.email "
                "FROM family_details fd "
                "WHERE fd.primary_phone IS NOT NULL AND fd.primary_phone <> '' "
                "  AND fd.employee_id NOT IN (SELECT employee_id FROM employee_emergency_contact) "
                "ORDER BY fd.employee_id, fd.id"
            )
            seen = set()
            comp_by_emp = {e[0]: e[1] for e in employees}
            for emp_id, name, relation, phone, second_phone, email in cur.fetchall():
                if emp_id in seen:
                    continue  # un seul contact seede par employe
                seen.add(emp_id)
                cur.execute(
                    "INSERT INTO employee_emergency_contact "
                    "(employee_id, company_id, name, relationship, phone, alt_phone, email, priority, note, created_at) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, 1, %s, NOW(6))",
                    (emp_id, comp_by_emp.get(emp_id), (name or None), relation, phone, second_phone, email,
                     "Importe depuis la fiche familiale"),
                )
                contacts_created += 1
            db.commit()
        print(f"[contacts] {contacts_created} contacts d'urgence pre-remplis depuis family_details")

        # 5. Verification
        cur.execute("SELECT COUNT(*) FROM employee_evacuation")
        total_evac = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM employee_evacuation WHERE priority_level = 'P1'")
        total_p1 = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM employee_emergency_contact")
        total_contacts = cur.fetchone()[0]
        print(f"[verif] employee_evacuation={total_evac} (P1={total_p1}) | employee_emergency_contact={total_contacts}")
    finally:
        hs.close()
        db.close()


if __name__ == "__main__":
    main()

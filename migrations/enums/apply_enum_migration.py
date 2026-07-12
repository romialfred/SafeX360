#!/usr/bin/env python3
"""
Migration enums ORDINAL -> STRING (HNS + MineXpert), conscient des contraintes CHECK.

Pourquoi ce script plutôt que du SQL brut :
- Hibernate a créé des contraintes CHECK « `col` between 0 and N » sur les colonnes
  ordinales. MySQL 8.0.16+ les APPLIQUE : impossible d'y écrire un libellé texte
  tant qu'elles existent. Il faut les dropper d'abord.
- Les noms de ces contraintes sont AUTO-GÉNÉRÉS (`table_chk_1`, …) et DIFFÈRENT
  d'une base à l'autre (local vs Aiven). On les découvre donc dynamiquement.
- Idempotent : ne convertit que les colonnes encore numériques (garde REGEXP).

Usage :
    # cible = URL JDBC style « jdbc:mysql://host:3306/schema »
    python apply_enum_migration.py --service hns   --url "$DB_URL_HNS_AIVEN"   --user X --password Y [--dry-run]
    python apply_enum_migration.py --service hrms  --url "$DB_URL_AIVEN"       --user X --password Y [--dry-run]

TOUJOURS lancer --dry-run d'abord, et migrer les données AVANT de déployer le code
annoté @Enumerated(STRING).
"""
import argparse
import re
import sys

try:
    import pymysql
except ImportError:
    sys.exit("pymysql requis : pip install pymysql")

# --- Ordre EXACT des enums (index ordinal = position). Source de vérité. ---
E = {
    "ActionStatus": ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
    "ActivityReportStatus": ["SUBMITTED", "APPROVED", "REJECTED"],
    "AuditCategory": ["INTERNAL", "EXTERNAL"],
    "PlanningStatus": ["PENDING", "APPROVED", "REJECTED"],
    "AuditStatus": ["PLANNING", "PREPARATION", "EXECUTION", "CLOSED", "CANCELLED"],
    "Status": ["ACTIVE", "INACTIVE"],
    "DocStatus": ["VALID", "INVALID", "PENDING"],
    "ActivityType": ["HSM", "ST"],
    "ActivityStatus": ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
    "IncidentStatus": ["PENDING", "REPORTED", "INVESTIGATION", "INVESTIGATION_COMPLETED", "CORRECTIVE_ACTIONS", "CLOSED", "REJECTED"],
    "InspectionStatus": ["COMPLETED", "CANCELLED", "IN_PROGRESS", "SUBMITTED", "APPROVED", "REJECTED", "ARCHIVED"],
    "InvestigationStatus": ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
    "LessonStatus": ["PENDING", "APPROVED"],
    "EventType": ["NON_CONFORMITY", "NEAR_MISS", "HAZARD"],
    "PpeStatus": ["ACTIVE", "INACTIVE"],
    "RecommendationStatus": ["PENDING", "IN_PROGRESS", "COMPLETED", "DELAYED"],
    "AuditReportStatus": ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"],
    "Role": ["TEAM_LEAD", "MEMBER"],
    # --- MineXpert (HRMS) ---
    "CompanyStatus": ["ACTIVE", "INACTIVE", "CLOSING", "CLOSED", "SOLD", "SUSPENDED"],
    "LeaveStatus": ["PENDING", "APPROVED", "DECLINED"],
    "ReimbursementStatus": ["PENDING", "INPROGRESS", "COMPLETED", "REJECTED"],
    "EntryStatus": ["PENDING", "APPROVED", "REJECTED"],
    "EntryType": ["WORKING", "REST"],
    "SignType": ["PREPARER", "VALIDATOR", "APPROVER"],
    "Day": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"],
    "TeamType": ["REGULAR", "CONSULTANT", "CASUAL", "PROJECT"],
    "Rotations": ["FIVE_TWO", "FOURTEEN_SEVEN", "TWENTY_EIGHT_FOURTEEN"],
    "TeamStatus": ["ACTIVE", "INACTIVE"],
    "Shifts": ["DAY", "NIGHT"],
    "TimesheetStatus": ["DRAFT", "PREPARED", "VALIDATED", "APPROVED", "REJECTED", "PAID"],
    "CodeType": ["DAY", "NIGHT", "BOTH"],
    "CodeStatus": ["ACTIVE", "INACTIVE"],
}

# --- (table, colonne, enum) — noms de table VÉRIFIÉS contre le schéma réel. ---
HNS = [
    ("action_process", "status", "ActionStatus"), ("activity_report", "status", "ActivityReportStatus"),
    ("audit", "category", "AuditCategory"), ("audit", "planning_status", "PlanningStatus"), ("audit", "status", "AuditStatus"),
    ("audit_areas", "status", "Status"), ("audit_history", "status", "AuditStatus"), ("body_part", "status", "Status"),
    ("check_list", "status", "Status"), ("compliance_docs", "status", "DocStatus"), ("corrective_action", "status", "ActionStatus"),
    ("hs_activity", "type", "ActivityType"), ("hs_activity_history", "status", "ActivityStatus"), ("incident", "status", "IncidentStatus"),
    ("incident_category", "status", "Status"), ("incident_history", "status", "IncidentStatus"), ("incident_team", "status", "Status"),
    ("incident_type", "status", "Status"), ("inspection_history", "status", "InspectionStatus"), ("internal_auditor", "status", "Status"),
    ("incident_investigation", "status", "InvestigationStatus"), ("investigation_process", "status", "InvestigationStatus"),
    ("lesson_learned", "status", "LessonStatus"), ("location", "status", "Status"), ("measurement", "status", "Status"),
    ("non_conformity", "type", "EventType"), ("position_assignment", "status", "Status"), ("ppe", "status", "PpeStatus"),
    ("recommendation", "status", "RecommendationStatus"), ("recommendation_followup", "status", "RecommendationStatus"),
    ("report", "status", "AuditReportStatus"), ("requirement", "status", "Status"), ("severity_level", "status", "Status"),
    ("team_member", "role", "Role"), ("team_member", "status", "Status"), ("weather_condition", "status", "Status"),
    ("work_area", "status", "Status"), ("work_process", "status", "Status"),
]
# NB : mapping HRMS à compléter/vérifier contre defaultdb avant application (voir README).
HRMS = [
    ("company", "status", "CompanyStatus"), ("department", "status", "Status"), ("position", "status", "Status"),
    ("position_category", "status", "Status"), ("roster", "status", "Status"), ("leave", "status", "LeaveStatus"),
    ("salary_advance", "status", "LeaveStatus"), ("salary_advance", "reimbursement", "ReimbursementStatus"),
    ("constraints", "status", "Status"), ("member_entry", "status", "EntryStatus"), ("member_entry", "type", "EntryType"),
    ("signature", "sign_type", "SignType"), ("team", "week_start_day", "Day"), ("team", "type", "TeamType"),
    ("team", "rotation", "Rotations"), ("team", "status", "TeamStatus"), ("team_manager", "status", "Status"),
    ("team_member", "shift", "Shifts"), ("team_member", "status", "Status"), ("timesheet", "status", "TimesheetStatus"),
    ("work_hour_code", "type", "CodeType"), ("work_hour_code", "status", "CodeStatus"),
]


def parse_jdbc(url):
    m = re.search(r"jdbc:mysql://([^:/]+):(\d+)/([^?]+)", url)
    if not m:
        sys.exit(f"URL JDBC invalide : {url}")
    return m.group(1), int(m.group(2)), m.group(3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--service", choices=["hns", "hrms"], required=True)
    ap.add_argument("--url", required=True, help="URL JDBC mysql")
    ap.add_argument("--user", required=True)
    ap.add_argument("--password", required=True)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    host, port, schema = parse_jdbc(a.url)
    targets = HNS if a.service == "hns" else HRMS
    conn = pymysql.connect(host=host, port=port, user=a.user, password=a.password, database=schema, autocommit=False)
    cur = conn.cursor()
    print(f"== {a.service.upper()} @ {host}:{port}/{schema} — {len(targets)} colonnes {'(DRY-RUN)' if a.dry_run else ''} ==")
    migrated = skipped = 0
    for tbl, col, enum in targets:
        # existe ? déjà migrée (non numérique) ?
        cur.execute("""SELECT data_type FROM information_schema.columns
                       WHERE table_schema=%s AND table_name=%s AND column_name=%s""", (schema, tbl, col))
        row = cur.fetchone()
        if not row:
            print(f"  [ABSENT] {tbl}.{col} — ignoré"); continue
        if row[0] not in ("tinyint", "int", "smallint", "bigint"):
            print(f"  [OK déjà STRING] {tbl}.{col}"); skipped += 1; continue
        vals = E[enum]
        # 1) découvrir + dropper les CHECK sur cette colonne
        cur.execute("""SELECT cc.constraint_name FROM information_schema.check_constraints cc
                       JOIN information_schema.table_constraints tc
                         ON cc.constraint_name=tc.constraint_name AND cc.constraint_schema=tc.constraint_schema
                       WHERE tc.table_schema=%s AND tc.table_name=%s AND cc.check_clause LIKE %s""",
                    (schema, tbl, f"%{col}%"))
        checks = [r[0] for r in cur.fetchall()]
        stmts = [f"ALTER TABLE `{tbl}` DROP CHECK `{c}`" for c in checks]
        stmts.append(f"ALTER TABLE `{tbl}` MODIFY `{col}` VARCHAR(255)")
        cases = " ".join(f"WHEN '{i}' THEN '{v}'" for i, v in enumerate(vals))
        stmts.append(f"UPDATE `{tbl}` SET `{col}` = CASE `{col}` {cases} ELSE `{col}` END WHERE `{col}` REGEXP '^[0-9]+$'")
        print(f"  [MIGRATE] {tbl}.{col} ({enum}) — {len(checks)} CHECK à dropper")
        if not a.dry_run:
            for s in stmts:
                cur.execute(s)
        migrated += 1
    if a.dry_run:
        conn.rollback(); print(f"== DRY-RUN : {migrated} à migrer, {skipped} déjà OK — rien écrit ==")
    else:
        conn.commit(); print(f"== TERMINÉ : {migrated} migrées, {skipped} déjà OK ==")
    cur.close(); conn.close()


if __name__ == "__main__":
    main()

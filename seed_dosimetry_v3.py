"""
SEED Dosimétrie v3 — données réalistes ancrées sur les vrais employés Aiven.
"""
import pymysql, ssl, random
from datetime import datetime, timedelta, date

from db_env import connect

# ATTENTION : le service Health-Safety (module Dosimetrie) utilise le schema
# 'healthsafety'. Les seeds des 06-08/06/2026 avaient cible 'defaultdb' par
# erreur : ces donnees orphelines n'ont jamais ete visibles en production.
conn = connect('healthsafety', connect_timeout=10)
cur = conn.cursor()
random.seed(42)

USER_ID = 14
NOW_SQL = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
TODAY = date.today()

# === 1. Charger 50 employés réels (id, nom complet, matricule) ===
# Privilégier employés qui ont prénom + nom + matricule, exclure id=1 (Alfred TRAORE = compte admin RH)
cur.execute("""
SELECT id, first_name, family_name, unique_number
FROM employee
WHERE first_name IS NOT NULL AND family_name IS NOT NULL
  AND first_name <> '' AND family_name <> ''
  AND id <> 14
ORDER BY id LIMIT 60
""")
employees = [(r[0], f"{r[1]} {r[2]}".strip(), r[3] or f"EMP{r[0]:04d}") for r in cur.fetchall()]
print(f"Loaded {len(employees)} real employees")
for e in employees[:5]: print(f"  ex: id={e[0]}  {e[1]}  ({e[2]})")

# === 2. Sélectionner un médecin du travail (premier employé Cat médical, sinon prendre id=14 lui-même) ===
# Pour la démo, on désigne 1 médecin virtuel via employé existant
PHYSICIAN_ID, PHYSICIAN_NAME = (employees[0][0], "Dr. " + employees[0][1])
print(f"Physician chosen: id={PHYSICIAN_ID}  {PHYSICIAN_NAME}")

# === Purge totale ===
print("\n[0] Purge...")
for t in ['dosimetry_exposure_profile_link','dosimetry_exposure_alert','dosimetry_overexposure_case',
          'dosimetry_dose_record','dosimetry_dose_cumulative','dosimetry_qualification',
          'dosimetry_medical_surveillance','dosimetry_fitness_assessment','dosimetry_medical_visit',
          'dosimetry_dosimeter_assignment','dosimetry_ambient_measurement','dosimetry_monitoring_campaign',
          'dosimetry_measurement_point','dosimetry_dosimeter','dosimetry_exposed_worker',
          'dosimetry_exposure_profile','dosimetry_kpi_snapshot','dosimetry_threshold','dosimetry_audit_log']:
    try: cur.execute(f"DELETE FROM {t}")
    except: pass

# === 3. THRESHOLDS CIPR ===
print("\n[1] Thresholds CIPR 103...")
thresholds = [
    ('WORKER_A','HP10',   15.0, 18.0, 20.0, 20.0),
    ('WORKER_A','HP007', 400.0,450.0,500.0,500.0),
    ('WORKER_A','HP3',    15.0, 18.0, 20.0, 20.0),
    ('WORKER_B','HP10',    4.5,  5.0,  5.5,  6.0),
    ('WORKER_B','HP007', 100.0,120.0,140.0,150.0),
    ('WORKER_B','HP3',     4.5,  5.0,  5.5,  6.0),
    ('APPRENTICE','HP10',  4.5,  5.0,  5.5,  6.0),
    ('PREGNANCY','HP10',   0.7,  0.8,  0.9,  1.0),
    ('PUBLIC','HP10',      0.7,  0.8,  0.9,  1.0),
]
for cat,gd,dc,inv,act,lim in thresholds:
    cur.execute("""INSERT INTO dosimetry_threshold
        (active, person_category, grandeur, dose_constraint, investigation_level, action_level,
         regulatory_limit, unit, reference_framework, mine_id, created_at, created_by)
        VALUES (1,%s,%s,%s,%s,%s,%s,'mSv','CIPR_103',1,%s,%s)""",
        (cat,gd,dc,inv,act,lim, NOW_SQL, USER_ID))
print(f"  {len(thresholds)} thresholds")

# === 4. EXPOSED WORKERS (50 vrais employés) ===
print("\n[2] Exposed workers (50 vrais employés)...")
# Distribution :
#  - 22 Cat A
#  - 14 Cat B
#  - 7 Apprentis (Cat A young, special_status=APPRENTICE)
#  - 2 Femmes enceintes (Cat A, special_status=PREGNANCY) — on cible les prénoms féminins
#  - 5 Cat B NONE
designs = ([('A','NONE')]*22 + [('B','NONE')]*14 + [('A','APPRENTICE')]*7
           + [('A','PREGNANCY')]*2 + [('B','NONE')]*5)
random.shuffle(designs)

worker_ids = []
for i, emp in enumerate(employees[:50]):
    emp_id, full_name, matricule = emp
    cat, spec = designs[i]
    cur.execute("""INSERT INTO dosimetry_exposed_worker
        (active, category, employee_id, mine_id, classification_date, classification_reason,
         created_at, created_by, special_status, rpo_id)
        VALUES (1,%s,%s,1,%s,%s,%s,%s,%s,%s)""",
        (cat, emp_id,
         (TODAY - timedelta(days=random.randint(60,1500))).isoformat(),
         f"Travailleur classé catégorie {cat} pour exposition aux rayonnements externes",
         NOW_SQL, USER_ID, spec, USER_ID))
    wid = cur.lastrowid
    worker_ids.append((wid, emp_id, full_name, matricule, cat, spec))
    cur.execute("""INSERT INTO dosimetry_exposure_profile
        (exposure_type, worker_id, conditions, frequency, created_at, created_by)
        VALUES ('EXTERNAL', %s, 'Rayonnement externe gamma et neutrons en zone surveillée', 'CONTINUOUS', %s, %s)""",
        (wid, NOW_SQL, USER_ID))
print(f"  {len(worker_ids)} travailleurs (par catégorie : A={sum(1 for w in worker_ids if w[4]=='A')}, B={sum(1 for w in worker_ids if w[4]=='B')}, Apprentis={sum(1 for w in worker_ids if w[5]=='APPRENTICE')}, Grossesse={sum(1 for w in worker_ids if w[5]=='PREGNANCY')})")
print(f"  Exemples : {worker_ids[0][2]}, {worker_ids[1][2]}, {worker_ids[2][2]}")

# === 5. DOSIMETERS — type cohérent par fabricant ===
print("\n[3] Dosimètres (15) avec sérials réalistes...")
DOSI = [
    ('TLD-2026-A001', 'TLD', 'AVAILABLE'),
    ('TLD-2026-A002', 'TLD', 'ASSIGNED'),
    ('TLD-2026-A003', 'TLD', 'ASSIGNED'),
    ('TLD-2026-A004', 'TLD', 'ASSIGNED'),
    ('TLD-2026-A005', 'TLD', 'IN_READING'),
    ('OSL-LDX-0001',  'OSL', 'ASSIGNED'),
    ('OSL-LDX-0002',  'OSL', 'ASSIGNED'),
    ('OSL-LDX-0003',  'OSL', 'AVAILABLE'),
    ('OSL-LDX-0004',  'OSL', 'IN_READING'),
    ('EPD-MGP-12001', 'EPD', 'ASSIGNED'),
    ('EPD-MGP-12002', 'EPD', 'AVAILABLE'),
    ('EPD-MGP-12003', 'EPD', 'ASSIGNED'),
    ('FILM-KOD-001',  'FILM','AVAILABLE'),
    ('FILM-KOD-002',  'FILM','DAMAGED'),
    ('FILM-KOD-003',  'FILM','LOST'),
]
dosi_ids = []
for serial, typ, sta in DOSI:
    cal_due = (TODAY + timedelta(days=random.randint(-15, 350))).isoformat()
    cur.execute("""INSERT INTO dosimetry_dosimeter
        (mine_id, serial, type, status, qr_code, calibration_due_date, created_at, created_by)
        VALUES (1,%s,%s,%s,%s,%s,%s,%s)""",
        (serial, typ, sta, f"QR-{serial}", cal_due, NOW_SQL, USER_ID))
    dosi_ids.append((cur.lastrowid, serial, typ, sta))
print(f"  {len(dosi_ids)} dosimètres")

# === 6. DOSE RECORDS (12 mois, doses réalistes par catégorie) ===
print("\n[4] Doses (12 mois)...")
n_doses = 0
for wid, emp_id, name, mat, cat, spec in worker_ids:
    if cat == 'A' and spec == 'NONE': base = random.uniform(0.6, 1.4)
    elif cat == 'A' and spec == 'APPRENTICE': base = random.uniform(0.15, 0.45)
    elif cat == 'A' and spec == 'PREGNANCY': base = random.uniform(0.005, 0.05)
    elif cat == 'B': base = random.uniform(0.1, 0.4)
    else: base = 0.1
    for m in range(12):
        period = (TODAY.replace(day=1) - timedelta(days=30*m))
        hp10 = round(max(0.0, base + random.gauss(0, 0.18)), 3)
        hp007 = round(hp10 * random.uniform(3, 7), 3)
        hp3 = round(hp10 * random.uniform(0.9, 1.1), 3)
        cur.execute("""INSERT INTO dosimetry_dose_record
            (below_detection, period, recorded_at, recorded_by, source, version, worker_id,
             hp10, hp007, hp3, notes, created_at, created_by)
            VALUES (0,%s,%s,%s,'AGENCY',1,%s,%s,%s,%s,'Relevé mensuel laboratoire agréé',%s,%s)""",
            (period.isoformat(), NOW_SQL, USER_ID, wid, hp10, hp007, hp3, NOW_SQL, USER_ID))
        n_doses += 1
print(f"  {n_doses} doses")

# === 7. MEASUREMENT POINTS + AMBIENT ===
print("\n[5] Points de mesure + ambient (30 jours)...")
POINTS = [
    ('GAL-N-001','Galerie nord, entrée principale','Niveau -120 m, point d entrée principal',  1.5,'CONTROLLED'),
    ('FRT-A-001','Front de taille zone A','Front actif extraction principal',                   2.5,'CONTROLLED'),
    ('FRT-B-002','Front de taille zone B','Front secondaire en exploitation',                   1.8,'CONTROLLED'),
    ('VEN-CTL-1','Salle ventilation centrale','Système de ventilation principal',               0.8,'SURVEILLED'),
    ('STK-MIN-1','Salle de stockage minerai','Bunker de stockage avant traitement',             1.2,'CONTROLLED'),
    ('LAB-ANA-1','Laboratoire d''analyse','Bureau d''analyse échantillons radioactifs',         0.4,'SURVEILLED'),
    ('SOR-N-001','Sortie galerie nord','Point de sortie travailleurs',                          0.6,'SURVEILLED'),
    ('ADM-S01-1','Bâtiment administratif','Zone publique en surface',                           0.1,'NONE'),
]
mp_ids = []
for code, label, desc, ref, zone in POINTS:
    cur.execute("""INSERT INTO dosimetry_measurement_point
        (active, code, label, mine_id, zone_classification, reference_level, description,
         version, created_at, created_by)
        VALUES (1,%s,%s,1,%s,%s,%s,1,%s,%s)""",
        (code, label, zone, ref, desc, NOW_SQL, USER_ID))
    mp_ids.append(cur.lastrowid)

n_amb = 0
for mp_id in mp_ids:
    for d in range(30):
        meas_at = (datetime.now() - timedelta(days=d, hours=random.randint(0,23))).strftime('%Y-%m-%d %H:%M:%S')
        val = round(random.uniform(0.05, 2.8), 3)
        cur.execute("""INSERT INTO dosimetry_ambient_measurement
            (context, measured_at, measured_by, measurement_point_id, mine_id, value, uncertainty,
             notes, created_at, created_by)
            VALUES ('ROUTINE',%s,%s,%s,1,%s,%s,'Mesure de routine du débit de dose ambiant',%s,%s)""",
            (meas_at, USER_ID, mp_id, val, round(random.uniform(5,15),2), NOW_SQL, USER_ID))
        n_amb += 1
print(f"  {len(mp_ids)} points + {n_amb} mesures")

# === 8. ASSIGNMENTS ===
print("\n[6] Assignations dosimètres aux travailleurs...")
assigned_count = 0
for i, (did, serial, typ, sta) in enumerate(dosi_ids):
    if sta == 'ASSIGNED' and i < len(worker_ids):
        wid = worker_ids[i][0]
        cur.execute("""INSERT INTO dosimetry_dosimeter_assignment
            (dosimeter_id, worker_id, period_start, period_end, handover_ack, return_ack,
             created_at, created_by, device_condition)
            VALUES (%s,%s,%s,NULL,1,0,%s,%s,'Bon état, calibration valide')""",
            (did, wid, TODAY.isoformat(), NOW_SQL, USER_ID))
        assigned_count += 1
print(f"  {assigned_count} assignations actives")

# === 9. MEDICAL VISITS + FITNESS ===
print("\n[7] Visites médicales + aptitudes...")
n_v=n_f=0
for wid, emp_id, name, mat, cat, spec in worker_ids:
    perf_date = (TODAY - timedelta(days=random.randint(60,400))).isoformat()
    cur.execute("""INSERT INTO dosimetry_medical_visit
        (mine_id, physician_id, scheduled_date, status, visit_type, worker_id,
         performed_date, general_conclusion, physician_name, created_at, created_by)
        VALUES (1,%s,%s,'PERFORMED','INITIAL',%s,%s,'Aptitude initiale validée. Travailleur apte au poste.',%s,%s,%s)""",
        (PHYSICIAN_ID, perf_date, wid, perf_date, PHYSICIAN_NAME, NOW_SQL, USER_ID))
    n_v += 1
    next_date = (TODAY + timedelta(days=random.randint(15,180))).isoformat()
    cur.execute("""INSERT INTO dosimetry_medical_visit
        (mine_id, physician_id, scheduled_date, status, visit_type, worker_id, physician_name, created_at, created_by)
        VALUES (1,%s,%s,'SCHEDULED','PERIODIC_ANNUAL',%s,%s,%s,%s)""",
        (PHYSICIAN_ID, next_date, wid, PHYSICIAN_NAME, NOW_SQL, USER_ID))
    n_v += 1
    fit_choice = random.choices(['FIT','FIT_WITH_RESTRICTIONS','TEMPORARILY_UNFIT','UNFIT'],
                                weights=[62,25,11,2])[0]
    valid_until = (TODAY + timedelta(days=365)).isoformat()
    public_summary = {
        'FIT': 'Aucune restriction. Apte au poste de travail exposé.',
        'FIT_WITH_RESTRICTIONS': 'Apte avec aménagement : limite à 4 h par jour en zone contrôlée.',
        'TEMPORARILY_UNFIT': 'Inaptitude temporaire 30 jours. Retrait des zones surveillées.',
        'UNFIT': 'Inaptitude définitive. Reclassement en zone non exposée requis.'
    }[fit_choice]
    cur.execute("""INSERT INTO dosimetry_fitness_assessment
        (assessment_date, fitness, mine_id, physician_id, signed, worker_id,
         public_restrictions_summary, physician_name, signed_at,
         valid_until, review_required_date, created_at, created_by)
        VALUES (%s,%s,1,%s,1,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (perf_date, fit_choice, PHYSICIAN_ID, wid, public_summary, PHYSICIAN_NAME, perf_date,
         valid_until, valid_until, NOW_SQL, USER_ID))
    n_f += 1
print(f"  {n_v} visites + {n_f} aptitudes")

# === 10. OVEREXPOSURE CASES ===
print("\n[8] Cas de dépassement...")
# Choisir 3 workers à fort cumul (catégorie A)
cat_a_workers = [w for w in worker_ids if w[4]=='A' and w[5]=='NONE'][:3]
for i, (wid, emp_id, name, mat, cat, spec) in enumerate(cat_a_workers):
    open_at = (datetime.now() - timedelta(days=random.randint(7,90))).strftime('%Y-%m-%d %H:%M:%S')
    statuses = ['OPEN','INVESTIGATING','CLOSED']
    cause = "Dépassement annuel détecté lors du contrôle mensuel routinier au laboratoire agréé."
    cur.execute("""INSERT INTO dosimetry_overexposure_case
        (level, opened_at, status, worker_id, cause, authority_declaration, created_at, created_by)
        VALUES ('EXCEEDED',%s,%s,%s,%s,0,%s,%s)""",
        (open_at, statuses[i], wid, cause, NOW_SQL, USER_ID))
print(f"  3 dossiers ({cat_a_workers[0][2]}, {cat_a_workers[1][2]}, {cat_a_workers[2][2]})")

# === 11. KPI SNAPSHOTS ===
print("\n[9] KPI snapshots (12 mois)...")
def kpi_cat(cat, spec):
    if spec == 'PREGNANCY': return 'PREGNANCY'
    if spec == 'APPRENTICE': return 'APPRENTICE'
    return 'WORKER_A' if cat == 'A' else 'WORKER_B'
counts_by_cat = {'WORKER_A':0,'WORKER_B':0,'APPRENTICE':0,'PREGNANCY':0,'PUBLIC':0}
for w in worker_ids: counts_by_cat[kpi_cat(w[4], w[5])] += 1

n_kpi=0
for m in range(12):
    snap_date = (TODAY.replace(day=1) - timedelta(days=30*m)).isoformat()
    for kcat, wc in counts_by_cat.items():
        if wc == 0:
            avg = med = maxd = 0.0
        else:
            avg = round(random.uniform(0.4, 6.0), 2)
            med = round(avg * random.uniform(0.7,0.95), 2)
            maxd = round(avg * random.uniform(1.5,3.0), 2)
        cur.execute("""INSERT INTO dosimetry_kpi_snapshot
            (active_alerts_count, category, created_at, dose_records_count, fitness_expiring_soon,
             measurement_points_count, mine_id, overexposure_cases_open, snapshot_date,
             workers_count, workers_over_100_pct, workers_over_50_pct, workers_over_75_pct,
             workers_over_90_pct, avg_annual_dose, median_annual_dose, max_annual_dose,
             ambient_avg_usvh)
            VALUES (%s,%s,%s,%s,%s,8,1,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (random.randint(0,4), kcat, NOW_SQL, wc*12, random.randint(0,3),
             random.randint(0,1), snap_date, wc,
             max(0,int(wc*0.05)), max(0,int(wc*0.3)), max(0,int(wc*0.15)), max(0,int(wc*0.08)),
             avg, med, maxd, round(random.uniform(0.4,1.6),2)))
        n_kpi += 1
print(f"  {n_kpi} snapshots")

conn.commit()
print("\n=== COMMIT OK ===")

# Verifications
print("\n=== Final counts ===")
for t in ['dosimetry_threshold','dosimetry_exposed_worker','dosimetry_exposure_profile',
          'dosimetry_dosimeter','dosimetry_dosimeter_assignment','dosimetry_dose_record',
          'dosimetry_measurement_point','dosimetry_ambient_measurement','dosimetry_medical_visit',
          'dosimetry_fitness_assessment','dosimetry_overexposure_case','dosimetry_kpi_snapshot']:
    cur.execute(f"SELECT COUNT(*) FROM {t}")
    print(f"  {t:38s} = {cur.fetchone()[0]}")

# Sample : show vrais noms
print("\n=== Exemple jointure ===")
cur.execute("""
SELECT w.id, e.first_name, e.family_name, e.unique_number, w.category, w.special_status
FROM dosimetry_exposed_worker w JOIN employee e ON e.id = w.employee_id
ORDER BY w.id LIMIT 8
""")
for r in cur.fetchall():
    print(f"  worker_id={r[0]:3d}  {r[1]} {r[2]:25s} mat={r[3]:10s} cat={r[4]} status={r[5]}")

cur.close(); conn.close()

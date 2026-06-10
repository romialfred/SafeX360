"""
SEED MASSIF Dosimétrie v2 — enums alignées sur le schema réel.
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

USER_ID = 14  # Romuald
NOW_SQL = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
TODAY = date.today()

cur.execute("SELECT id FROM employee ORDER BY id LIMIT 60")
employee_ids = [r[0] for r in cur.fetchall()]
print(f"Using {len(employee_ids)} employees")

# Purge in FK order
print("\n[0] Purge tables...")
for t in ['dosimetry_exposure_profile_link','dosimetry_exposure_alert','dosimetry_overexposure_case',
          'dosimetry_dose_record','dosimetry_dose_cumulative','dosimetry_qualification',
          'dosimetry_medical_surveillance','dosimetry_fitness_assessment','dosimetry_medical_visit',
          'dosimetry_dosimeter_assignment','dosimetry_ambient_measurement','dosimetry_monitoring_campaign',
          'dosimetry_measurement_point','dosimetry_dosimeter','dosimetry_exposed_worker',
          'dosimetry_exposure_profile','dosimetry_kpi_snapshot','dosimetry_threshold','dosimetry_audit_log']:
    try:
        cur.execute(f"DELETE FROM {t}")
    except Exception as e:
        print(f"  WARN {t}: {str(e)[:50]}")

# ===== 1. THRESHOLDS (CIPR 103) =====
print("\n[1/9] Thresholds CIPR 103...")
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

# ===== 2. EXPOSED WORKERS (50) =====
# category enum: 'A','B' only ; special_status: 'APPRENTICE','PREGNANCY','NONE'
print("\n[2/9] Exposed workers (50)...")
# distribution: 25 Cat A, 15 Cat B, 7 Apprentis (Cat A young), 2 Femmes enceintes (Cat A)
designs = (
    [('A','NONE')]*25 +
    [('B','NONE')]*15 +
    [('A','APPRENTICE')]*7 +
    [('A','PREGNANCY')]*2 +
    [('B','NONE')]
)
random.shuffle(designs)
worker_ids = []
for i, emp_id in enumerate(employee_ids[:50]):
    cat, spec = designs[i]
    cur.execute("""INSERT INTO dosimetry_exposed_worker
        (active, category, employee_id, mine_id, classification_date, classification_reason,
         created_at, created_by, special_status, rpo_id)
        VALUES (1,%s,%s,1,%s,%s,%s,%s,%s,%s)""",
        (cat, emp_id,
         (TODAY - timedelta(days=random.randint(30,1000))).isoformat(),
         f"Classification Cat {cat} - exposition externe rayonnement ionisant",
         NOW_SQL, USER_ID, spec, USER_ID))
    wid = cur.lastrowid
    worker_ids.append((wid, emp_id, cat, spec))
    # exposure profile
    cur.execute("""INSERT INTO dosimetry_exposure_profile
        (exposure_type, worker_id, conditions, frequency, created_at, created_by)
        VALUES ('EXTERNAL', %s, 'Exposition rayonnement gamma + neutrons en zone contrôlée', 'CONTINUOUS', %s, %s)""",
        (wid, NOW_SQL, USER_ID))
print(f"  {len(worker_ids)} workers")

# ===== 3. DOSIMETERS (15) =====
print("\n[3/9] Dosimeters (15)...")
DOSI_TYPES = ['TLD','OSL','FILM','EPD']
STATUSES   = ['AVAILABLE','AVAILABLE','ASSIGNED','ASSIGNED','ASSIGNED','IN_READING','LOST','DAMAGED']
dosi_ids = []
for i in range(15):
    serial = f"DOS-{2026000 + i:07d}"
    qr = f"QR-{serial}"
    typ = DOSI_TYPES[i % len(DOSI_TYPES)]
    sta = STATUSES[i % len(STATUSES)]
    cal_due = (TODAY + timedelta(days=random.randint(-15, 350))).isoformat()
    cur.execute("""INSERT INTO dosimetry_dosimeter
        (mine_id, serial, type, status, qr_code, calibration_due_date, created_at, created_by)
        VALUES (1,%s,%s,%s,%s,%s,%s,%s)""",
        (serial, typ, sta, qr, cal_due, NOW_SQL, USER_ID))
    dosi_ids.append(cur.lastrowid)
print(f"  {len(dosi_ids)} dosimeters")

# ===== 4. DOSE RECORDS (12 mois pour chaque worker) =====
print("\n[4/9] Dose records...")
n_doses = 0
for wid, emp_id, cat, spec in worker_ids:
    base = 1.2 if (cat=='A' and spec=='NONE') else (0.3 if cat=='B' else (0.4 if spec=='APPRENTICE' else 0.05))
    for m in range(12):
        period = (TODAY.replace(day=1) - timedelta(days=30*m))
        hp10 = round(max(0.0, base + random.gauss(0, 0.25)), 3)
        hp007 = round(hp10 * random.uniform(3, 8), 3)
        hp3 = round(hp10 * random.uniform(0.9, 1.1), 3)
        cur.execute("""INSERT INTO dosimetry_dose_record
            (below_detection, period, recorded_at, recorded_by, source, version, worker_id,
             hp10, hp007, hp3, notes, created_at, created_by)
            VALUES (0,%s,%s,%s,'AGENCY',1,%s,%s,%s,%s,'Mesure mensuelle laboratoire',%s,%s)""",
            (period.isoformat(), NOW_SQL, USER_ID, wid, hp10, hp007, hp3, NOW_SQL, USER_ID))
        n_doses += 1
print(f"  {n_doses} dose records")

# ===== 5. MEASUREMENT POINTS + AMBIENT =====
print("\n[5/9] Measurement points (8) + ambient (30 days)...")
POINTS = [
    ('ENT-001','Entrée galerie principale','Niveau -120m, point d entrée galerie',  1.5,'CONTROLLED'),
    ('FRT-001','Front de taille zone A','Front actif extraction principal',         2.5,'CONTROLLED'),
    ('FRT-002','Front de taille zone B','Front secondaire en exploitation',         1.8,'CONTROLLED'),
    ('VEN-001','Salle ventilation centrale','Système ventilation principal mine',   0.8,'SURVEILLED'),
    ('STO-001','Salle stockage minerai','Bunker stockage avant traitement minier',  1.2,'CONTROLLED'),
    ('LAB-001','Laboratoire d analyse','Bureau analyse échantillons radioactifs',   0.4,'SURVEILLED'),
    ('SOR-001','Sortie galerie nord','Point de sortie travailleurs galerie nord',   0.6,'SURVEILLED'),
    ('ADM-001','Bâtiment administratif','Zone publique surface administration',     0.1,'NONE'),
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
            VALUES ('ROUTINE',%s,%s,%s,1,%s,%s,'Mesure routine débit dose ambiant',%s,%s)""",
            (meas_at, USER_ID, mp_id, val, round(random.uniform(5,15),2), NOW_SQL, USER_ID))
        n_amb += 1
print(f"  {len(mp_ids)} points + {n_amb} ambient measurements")

# ===== 6. DOSIMETER ASSIGNMENTS =====
print("\n[6/9] Dosimeter assignments...")
n_ass = 0
for i, dosi_id in enumerate(dosi_ids[:8]):
    if i < len(worker_ids):
        wid = worker_ids[i][0]
        try:
            cur.execute("""INSERT INTO dosimetry_dosimeter_assignment
                (dosimeter_id, worker_id, assigned_at, assigned_by, created_at, created_by)
                VALUES (%s,%s,%s,%s,%s,%s)""",
                (dosi_id, wid, NOW_SQL, USER_ID, NOW_SQL, USER_ID))
            n_ass += 1
        except Exception as e:
            print(f"  WARN {e}")
print(f"  {n_ass} assignments")

# ===== 7. MEDICAL VISITS + FITNESS =====
print("\n[7/9] Medical visits + fitness assessments...")
n_v=n_f=0
PHYSICIAN_ID = 14  # using romuald as fallback physician
for wid, emp_id, cat, spec in worker_ids:
    perf_date = (TODAY - timedelta(days=random.randint(60,400))).isoformat()
    # initial visit
    cur.execute("""INSERT INTO dosimetry_medical_visit
        (mine_id, physician_id, scheduled_date, status, visit_type, worker_id,
         performed_date, general_conclusion, physician_name, created_at, created_by)
        VALUES (1,%s,%s,'PERFORMED','INITIAL',%s,%s,'Aptitude initiale validée - apte au poste','Dr. KOUAME',%s,%s)""",
        (PHYSICIAN_ID, perf_date, wid, perf_date, NOW_SQL, USER_ID))
    n_v += 1
    # next periodic
    next_date = (TODAY + timedelta(days=random.randint(30,180))).isoformat()
    cur.execute("""INSERT INTO dosimetry_medical_visit
        (mine_id, physician_id, scheduled_date, status, visit_type, worker_id, physician_name, created_at, created_by)
        VALUES (1,%s,%s,'SCHEDULED','PERIODIC_ANNUAL',%s,'Dr. KOUAME',%s,%s)""",
        (PHYSICIAN_ID, next_date, wid, NOW_SQL, USER_ID))
    n_v += 1
    # fitness assessment
    fit_choice = random.choices(['FIT','FIT_WITH_RESTRICTIONS','TEMPORARILY_UNFIT','UNFIT'],
                                weights=[60,25,12,3])[0]
    valid_until = (TODAY + timedelta(days=365)).isoformat()
    public_summary = {
        'FIT': 'Aucune restriction. Apte au poste de travail exposé.',
        'FIT_WITH_RESTRICTIONS': 'Apte avec aménagement : temps limité à 4h/jour en zone contrôlée.',
        'TEMPORARILY_UNFIT': 'Inaptitude temporaire 30 jours. Retrait des zones surveillées.',
        'UNFIT': 'Inaptitude définitive. Reclassement en zone non exposée requis.'
    }[fit_choice]
    cur.execute("""INSERT INTO dosimetry_fitness_assessment
        (assessment_date, fitness, mine_id, physician_id, signed, worker_id,
         public_restrictions_summary, physician_name, signed_at,
         valid_until, review_required_date, created_at, created_by)
        VALUES (%s,%s,1,%s,1,%s,%s,'Dr. KOUAME',%s,%s,%s,%s,%s)""",
        (perf_date, fit_choice, PHYSICIAN_ID, wid, public_summary, perf_date,
         valid_until, valid_until, NOW_SQL, USER_ID))
    n_f += 1
print(f"  {n_v} visits + {n_f} fitness")

# ===== 8. OVEREXPOSURE CASES (3) =====
print("\n[8/9] Overexposure cases...")
for i in range(3):
    wid = worker_ids[i][0]
    open_at = (datetime.now() - timedelta(days=random.randint(7,60))).strftime('%Y-%m-%d %H:%M:%S')
    statuses = ['OPEN','INVESTIGATING','CLOSED']
    cur.execute("""INSERT INTO dosimetry_overexposure_case
        (level, opened_at, status, worker_id, cause, authority_declaration, created_at, created_by)
        VALUES ('EXCEEDED',%s,%s,%s,'Dépassement annuel détecté lors du contrôle mensuel routinier',0,%s,%s)""",
        (open_at, statuses[i], wid, NOW_SQL, USER_ID))
print("  3 overexposure cases")

# ===== 9. KPI SNAPSHOTS =====
print("\n[9/9] KPI snapshots (12 months x category)...")
n_kpi=0
# group worker counts by KPI category (mapping)
def kpi_cat(cat, spec):
    if spec == 'PREGNANCY': return 'PREGNANCY'
    if spec == 'APPRENTICE': return 'APPRENTICE'
    return 'WORKER_A' if cat == 'A' else 'WORKER_B'

counts_by_cat = {'WORKER_A':0,'WORKER_B':0,'APPRENTICE':0,'PREGNANCY':0,'PUBLIC':0}
for w in worker_ids:
    counts_by_cat[kpi_cat(w[2], w[3])] += 1

for m in range(12):
    snap_date = (TODAY.replace(day=1) - timedelta(days=30*m)).isoformat()
    for kcat, wc in counts_by_cat.items():
        if wc == 0:
            # still insert 0 row for PUBLIC consistency
            avg = med = maxd = 0.0
        else:
            avg = round(random.uniform(0.5, 8.0), 2)
            med = round(avg * random.uniform(0.7,0.95), 2)
            maxd = round(avg * random.uniform(1.5,3.5), 2)
        cur.execute("""INSERT INTO dosimetry_kpi_snapshot
            (active_alerts_count, category, created_at, dose_records_count, fitness_expiring_soon,
             measurement_points_count, mine_id, overexposure_cases_open, snapshot_date,
             workers_count, workers_over_100_pct, workers_over_50_pct, workers_over_75_pct,
             workers_over_90_pct, avg_annual_dose, median_annual_dose, max_annual_dose,
             ambient_avg_usvh)
            VALUES (%s,%s,%s,%s,%s,8,1,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (random.randint(0,5), kcat, NOW_SQL, wc*12, random.randint(0,3),
             random.randint(0,1), snap_date, wc,
             max(0,int(wc*0.05)), max(0,int(wc*0.3)), max(0,int(wc*0.15)), max(0,int(wc*0.08)),
             avg, med, maxd, round(random.uniform(0.4,1.6),2)))
        n_kpi += 1
print(f"  {n_kpi} KPI snapshots")

conn.commit()
print("\n=== COMMIT OK ===")

# === COUNTS ===
print("\n=== Final ===")
for t in ['dosimetry_threshold','dosimetry_exposed_worker','dosimetry_exposure_profile',
          'dosimetry_dosimeter','dosimetry_dosimeter_assignment','dosimetry_dose_record',
          'dosimetry_measurement_point','dosimetry_ambient_measurement','dosimetry_medical_visit',
          'dosimetry_fitness_assessment','dosimetry_overexposure_case','dosimetry_kpi_snapshot']:
    cur.execute(f"SELECT COUNT(*) FROM {t}")
    print(f"  {t:38s} = {cur.fetchone()[0]}")

cur.close(); conn.close()

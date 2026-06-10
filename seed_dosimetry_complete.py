"""
Complete seed Dosimetry — tables qui restaient vides.
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
NOW = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
TODAY = date.today()

# Get worker list + measurement points + thresholds + profiles
cur.execute("SELECT w.id, e.id, COALESCE(CONCAT(e.first_name,' ',e.family_name),'NN'), w.category, w.special_status FROM dosimetry_exposed_worker w LEFT JOIN employee e ON e.id=w.employee_id ORDER BY w.id")
workers = cur.fetchall()
print(f"Workers : {len(workers)}")

cur.execute("SELECT id, code, reference_level, zone_classification FROM dosimetry_measurement_point ORDER BY id")
points = cur.fetchall()
print(f"Measurement points : {len(points)}")

cur.execute("SELECT id, person_category, grandeur, regulatory_limit FROM dosimetry_threshold")
thresholds = cur.fetchall()
print(f"Thresholds : {len(thresholds)}")
threshold_map = {(t[1], t[2]): (t[0], t[3]) for t in thresholds}

cur.execute("SELECT id, worker_id FROM dosimetry_exposure_profile ORDER BY id")
profiles = cur.fetchall()
print(f"Profiles : {len(profiles)}")

# ===== 1. MONITORING CAMPAIGNS =====
print("\n[1] Monitoring campaigns (3)...")
cur.execute("DESCRIBE dosimetry_monitoring_campaign")
cmp_cols = [c[0] for c in cur.fetchall()]
campaigns_data = [
    ('CAMP-2026-Q2', 'Campagne T2 2026 — Front taille zone A', 'Surveillance renforcée du front actif après installation nouveau revêtement',
     (TODAY - timedelta(days=30)).isoformat(), (TODAY + timedelta(days=60)).isoformat(), 'ONGOING'),
    ('CAMP-2026-Q1', 'Campagne T1 2026 — Mesures référence', 'Cartographie complète des débits de dose ambiants pour révision annuelle des zones',
     (TODAY - timedelta(days=120)).isoformat(), (TODAY - timedelta(days=30)).isoformat(), 'COMPLETED'),
    ('CAMP-2026-LAB', 'Audit laboratoire d analyse', 'Contrôle ponctuel suite renouvellement licence d exploitation labo échantillons',
     (TODAY + timedelta(days=10)).isoformat(), (TODAY + timedelta(days=20)).isoformat(), 'DRAFT'),
]
for code, label, obj, start, end, status in campaigns_data:
    cur.execute("""INSERT INTO dosimetry_monitoring_campaign
        (code, label, mine_id, objective, start_date, end_date, status, responsible_id, created_at, created_by, protocol)
        VALUES (%s,%s,1,%s,%s,%s,%s,%s,%s,%s,'Protocole standard : mesures hebdomadaires + relevés en continu sur les points critiques.')""",
        (code, label, obj, start, end, status, USER_ID, NOW, USER_ID))
print(f"  {len(campaigns_data)} campagnes")

# ===== 2. EXPOSURE PROFILE LINK (3 points par profil = ~150 liens) =====
print(f"\n[2] Exposure profile links (3 par profil)...")
n_links = 0
for pid, wid in profiles:
    # Choisir 3 points aleatoires + fractions qui somment a ~0.9
    sel_points = random.sample(points, min(3, len(points)))
    fractions = [0.5, 0.3, 0.2][:len(sel_points)]
    for (point_id, code, ref, zone), frac in zip(sel_points, fractions):
        dose_rate = float(ref) * random.uniform(0.8, 1.2)
        cur.execute("""INSERT INTO dosimetry_exposure_profile_link
            (estimated_dose_rate, exposure_profile_id, fraction, last_updated, measurement_point_id)
            VALUES (%s,%s,%s,%s,%s)""",
            (round(dose_rate, 3), pid, frac, NOW, point_id))
        n_links += 1
print(f"  {n_links} liens crees")

# ===== 3. QUALIFICATIONS (1 par worker) =====
print(f"\n[3] Qualifications (1 par worker)...")
qual_types = ['PR1', 'PR2', 'Habilitation B1V', 'Formation initiale RP', 'Recyclage RP triennal']
n_q = 0
for wid, eid, name, cat, spec in workers[:50]:
    qt = random.choice(qual_types)
    valid_from = (TODAY - timedelta(days=random.randint(60, 800))).isoformat()
    valid_to = (TODAY + timedelta(days=random.randint(60, 800))).isoformat()
    status = random.choices(['VALID', 'EXPIRED'], weights=[88, 12])[0]
    if status == 'EXPIRED':
        valid_to = (TODAY - timedelta(days=random.randint(10, 60))).isoformat()
    cur.execute("""INSERT INTO dosimetry_qualification
        (status, training_type, valid_from, valid_to, worker_id, created_at, created_by)
        VALUES (%s,%s,%s,%s,%s,%s,%s)""",
        (status, qt, valid_from, valid_to, wid, NOW, USER_ID))
    n_q += 1
print(f"  {n_q} qualifications")

# ===== 4. EXPOSURE ALERTS (12 alertes graduees) =====
print(f"\n[4] Exposure alerts (12 alertes graduees)...")
n_a = 0
levels = ['APPROACH', 'INVESTIGATION', 'ACTION', 'EXCEEDED']
statuses = ['ACTIVE', 'ACTIVE', 'ACK', 'RESOLVED']
# Pour les workers Cat A non special
cat_a_workers = [w for w in workers if w[3]=='A' and w[4]=='NONE'][:6]
for i, (wid, eid, name, cat, spec) in enumerate(cat_a_workers):
    # 2 alertes par worker
    for j in range(2):
        level = levels[(i + j) % 4]
        status = statuses[(i + j) % 4]
        # Trouve un threshold pour Cat A HP10
        thr_id, lim = threshold_map.get(('WORKER_A', 'HP10'), (None, 20.0))
        if not thr_id: continue
        val = float(lim) * {'APPROACH': 0.55, 'INVESTIGATION': 0.78, 'ACTION': 0.92, 'EXCEEDED': 1.15}[level]
        triggered = (datetime.now() - timedelta(days=random.randint(2, 60))).strftime('%Y-%m-%d %H:%M:%S')
        ack_at = None
        ack_by = None
        if status in ('ACK', 'RESOLVED'):
            ack_at = (datetime.now() - timedelta(days=random.randint(0, 5))).strftime('%Y-%m-%d %H:%M:%S')
            ack_by = USER_ID
        cur.execute("""INSERT INTO dosimetry_exposure_alert
            (grandeur, level, status, threshold_id, triggered_at, value, worker_id,
             acknowledged_at, acknowledged_by, created_at, created_by)
            VALUES ('HP10',%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (level, status, thr_id, triggered, val, wid, ack_at, ack_by, NOW, USER_ID))
        n_a += 1
print(f"  {n_a} alertes")

# ===== 5. DOSE CUMULATIVE (1 par worker pour annee courante) =====
print(f"\n[5] Dose cumulative (1 par worker)...")
n_c = 0
year = TODAY.year
for wid, eid, name, cat, spec in workers:
    # Compute approximatif depuis les dose records
    cur.execute("""SELECT SUM(hp10), SUM(hp007), SUM(hp3) FROM dosimetry_dose_record
        WHERE worker_id=%s AND superseded_record_id IS NULL""", (wid,))
    s = cur.fetchone()
    annual_hp10 = float(s[0]) if s[0] else 0.0
    annual_hp007 = float(s[1]) if s[1] else 0.0
    annual_hp3 = float(s[2]) if s[2] else 0.0
    rolling5y = annual_hp10 * random.uniform(3.0, 4.5)  # cumul approximatif 5 ans
    lifetime = rolling5y * random.uniform(1.5, 3.0)
    cur.execute("""INSERT INTO dosimetry_dose_cumulative
        (annual_hp007, annual_hp10, annual_hp3, lifetime_hp10, rolling5y_hp10, updated_at, worker_id, year)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
        (round(annual_hp007,3), round(annual_hp10,3), round(annual_hp3,3),
         round(lifetime,3), round(rolling5y,3), NOW, wid, year))
    n_c += 1
print(f"  {n_c} cumuls")

# ===== 6. MEDICAL SURVEILLANCE (1 par worker) =====
print(f"\n[6] Medical surveillance (fiches simplifiees)...")
n_m = 0
for wid, eid, name, cat, spec in workers:
    exam_date = (TODAY - timedelta(days=random.randint(30, 360))).isoformat()
    next_due = (TODAY + timedelta(days=random.randint(30, 360))).isoformat()
    fitness = random.choices(['FIT','FIT_WITH_RESTRICTIONS','TEMPORARILY_UNFIT'],
                             weights=[70, 22, 8])[0]
    cur.execute("""INSERT INTO dosimetry_medical_surveillance
        (doctor_id, exam_date, fitness, next_due_date, type, worker_id, created_at, created_by, restricted_clinical_details)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (USER_ID, exam_date, fitness, next_due, 'PERIODIC_ANNUAL', wid, NOW, USER_ID,
         'Examen clinique normal. Suivi standard catégorie ' + cat))
    n_m += 1
print(f"  {n_m} fiches medicales")

conn.commit()
print("\n=== COMMIT OK ===")

# Final check
print("\n=== Final counts ===")
for t in ['dosimetry_monitoring_campaign','dosimetry_exposure_profile_link',
          'dosimetry_qualification','dosimetry_exposure_alert',
          'dosimetry_dose_cumulative','dosimetry_medical_surveillance']:
    cur.execute(f"SELECT COUNT(*) FROM {t}")
    print(f"  {t:38s} = {cur.fetchone()[0]}")

cur.close(); conn.close()

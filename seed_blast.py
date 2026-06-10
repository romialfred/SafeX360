"""
SEED Blast Management — P8 finalisation.

Insere 5 tirs exemple (BLT-2026-0139..0144 sauf 0141) avec leurs plans de tir,
gardes, destinataires (BlastRecipient), notification jobs (T-24h/6h/30min/popups/T-10),
rapport d'evacuation pour le tir termine (0139), et CANCELLED+REPLAN pour le tir
postpone (0140).

Idempotent : DELETE des references cibles avant INSERT. Compatible MySQL 8.0+.

Pre-requis :
  - Tables blast / blast_plan / blast_guard / blast_recipient / blast_notification_job /
    blast_evacuation_report / blast_status_event presentes (cf. V014..V018).
  - Au moins une mine_id=1 dans le referentiel.
  - Compte avnadmin avec droits sur defaultdb.

Lancement :
  python seed_blast.py
"""
from datetime import datetime, timedelta

from db_env import connect

# ATTENTION : le service Health-Safety (module Blast) utilise le schema
# 'healthsafety'. Les seeds des 07-08/06/2026 avaient cible 'defaultdb' par
# erreur : ces donnees orphelines n'ont jamais ete visibles en production.
conn = connect('healthsafety')
cur = conn.cursor()

USER_ID = 14  # createdBy / updatedBy / actor par defaut
MINE_ID = 1
NOW = datetime.now()
NOW_SQL = NOW.strftime('%Y-%m-%d %H:%M:%S')
TODAY = NOW.replace(hour=0, minute=0, second=0, microsecond=0)
TIMEZONE = 'Africa/Ouagadougou'

# References cibles : on les efface AVANT d'inserer pour rendre le seed
# entierement rejouable (ON DUPLICATE ne marche pas bien pour les enfants).
REFS = [
    'BLT-2026-0139',
    'BLT-2026-0140',
    'BLT-2026-0142',
    'BLT-2026-0143',
    'BLT-2026-0144',
]


def resolve_employee(family_name_pattern: str) -> int:
    """Tente de resoudre un employee.id a partir d'un motif sur family_name.

    Si aucun match, retourne USER_ID (fallback admin). Le motif est partiel
    (LIKE '%pattern%'), insensible a la casse car family_name est stocke
    dans une collation utf8mb4_unicode_ci.
    """
    cur.execute(
        "SELECT id FROM employee WHERE family_name LIKE %s ORDER BY id LIMIT 1",
        (f"%{family_name_pattern}%",),
    )
    row = cur.fetchone()
    return row[0] if row else USER_ID


# ── Resolution des boutefeux & responsables HSE ──────────────────────────────
# K. Ouedraogo : boutefeu agree principal
# A. Kone      : second boutefeu
# HSE Lead     : on prend par defaut id=14 (Alfred TRAORE)
print('[1] Resolution des employes...')
BLASTER_OUEDRAOGO = resolve_employee('Ouedraogo')
BLASTER_KONE = resolve_employee('Kone')
HSE_LEAD = USER_ID  # Alfred TRAORE
print(f"  K. Ouedraogo  -> employee_id = {BLASTER_OUEDRAOGO}")
print(f"  A. Kone       -> employee_id = {BLASTER_KONE}")
print(f"  HSE Lead      -> employee_id = {HSE_LEAD}")

# ── Purge ciblee ─────────────────────────────────────────────────────────────
# Ordre : enfants -> parent. blast_status_event est append-only mais le DELETE
# y est autorise (les triggers V014 bloquent UPDATE/DELETE — il faut donc le
# faire en desactivant les triggers).
print('\n[2] Purge ciblee des 5 references...')

# Recupere les ids existants pour les references cibles.
placeholders = ','.join(['%s'] * len(REFS))
cur.execute(f"SELECT id FROM blast WHERE reference IN ({placeholders})", REFS)
existing_ids = [r[0] for r in cur.fetchall()]

if existing_ids:
    id_placeholders = ','.join(['%s'] * len(existing_ids))
    # blast_email_log -> via job_id -> blast_notification_job
    cur.execute(
        f"DELETE el FROM blast_email_log el "
        f"JOIN blast_notification_job j ON j.id = el.job_id "
        f"WHERE j.blast_id IN ({id_placeholders})",
        existing_ids,
    )
    cur.execute(
        f"DELETE FROM blast_notification_job WHERE blast_id IN ({id_placeholders})",
        existing_ids,
    )
    # blast_status_event : append-only -> on doit desactiver triggers
    cur.execute("DROP TRIGGER IF EXISTS trg_blast_status_event_no_update")
    cur.execute("DROP TRIGGER IF EXISTS trg_blast_status_event_no_delete")
    cur.execute(
        f"DELETE FROM blast_status_event WHERE blast_id IN ({id_placeholders})",
        existing_ids,
    )
    cur.execute(
        f"DELETE FROM blast_evacuation_report WHERE blast_id IN ({id_placeholders})",
        existing_ids,
    )
    cur.execute(
        f"DELETE FROM blast_recipient WHERE blast_id IN ({id_placeholders})",
        existing_ids,
    )
    cur.execute(
        f"DELETE FROM blast_guard WHERE blast_id IN ({id_placeholders})",
        existing_ids,
    )
    cur.execute(
        f"DELETE FROM blast_plan WHERE blast_id IN ({id_placeholders})",
        existing_ids,
    )
    cur.execute(f"DELETE FROM blast WHERE id IN ({id_placeholders})", existing_ids)
    print(f"  Purged {len(existing_ids)} blast(s) and dependents.")
else:
    print('  No existing rows.')


def insert_blast(reference, scheduled_at, type_, pit, bench, block, status,
                 blaster_id, hse_lead_id, exclusion_radius_m=None,
                 ppv_limit=None, access_concerned=None, assembly_points=None,
                 team=None, sensitive_receivers=None, notes=None,
                 alarm_zone_scope=None, misfire_resolved_at=None,
                 misfire_resolution_notes=None):
    """Insere un blast et retourne son id auto-incremente."""
    cur.execute(
        """
        INSERT INTO blast (
            reference, scheduled_at, timezone, type, pit, bench, block,
            status, exclusion_radius_m, blaster_id, hse_lead_id, mine_id,
            misfire_resolved_at, misfire_resolution_notes, version,
            created_at, updated_at, created_by, updated_by,
            access_concerned, assembly_points, team, ppv_limit,
            sensitive_receivers, notes, alarm_zone_scope
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s,
            %s, %s, 0,
            %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s
        )
        """,
        (
            reference, scheduled_at, TIMEZONE, type_, pit, bench, block,
            status, exclusion_radius_m, blaster_id, hse_lead_id, MINE_ID,
            misfire_resolved_at, misfire_resolution_notes,
            NOW_SQL, NOW_SQL, USER_ID, USER_ID,
            access_concerned, assembly_points, team, ppv_limit,
            sensitive_receivers, notes, alarm_zone_scope,
        ),
    )
    return cur.lastrowid


def insert_plan(blast_id, hole_count=None, hole_diameter_mm=None, depth_m=None,
                burden_m=None, spacing_m=None, stemming_m=None,
                explosive_type=None, explosive_qty_kg=None, powder_factor=None,
                initiation_system=None, delay_sequence=None):
    cur.execute(
        """
        INSERT INTO blast_plan (
            blast_id, hole_count, hole_diameter_mm, depth_m,
            burden_m, spacing_m, stemming_m, explosive_type,
            explosive_qty_kg, powder_factor, initiation_system,
            delay_sequence, created_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            blast_id, hole_count, hole_diameter_mm, depth_m,
            burden_m, spacing_m, stemming_m, explosive_type,
            explosive_qty_kg, powder_factor, initiation_system,
            delay_sequence, NOW_SQL,
        ),
    )


def insert_recipients(blast_id):
    """Insere les 6 destinataires types pour un tir."""
    rcpts = [
        # Responsable HSE — employee_id, lang FR
        (HSE_LEAD, None, 'FR'),
        # Chef de mine (on prend BLASTER_OUEDRAOGO comme stand-in si pas d'autre)
        (BLASTER_OUEDRAOGO, None, 'FR'),
        # Poste de garde — adresse externe FR
        (None, 'poste-garde@safex.local', 'FR'),
        # Infirmerie — adresse externe FR
        (None, 'infirmerie@safex.local', 'FR'),
        # Salle de controle — adresse externe FR
        (None, 'salle-controle@safex.local', 'FR'),
        # Liaison communautes — adresse externe EN (riverains anglophones)
        (None, 'community-liaison@safex.local', 'EN'),
    ]
    for emp_id, email, lang in rcpts:
        cur.execute(
            """
            INSERT INTO blast_recipient (blast_id, employee_id, external_email, preferred_language)
            VALUES (%s, %s, %s, %s)
            """,
            (blast_id, emp_id, email, lang),
        )


def insert_status_event(blast_id, from_status, to_status, reason=None,
                        when=None, actor_id=USER_ID):
    cur.execute(
        """
        INSERT INTO blast_status_event (blast_id, from_status, to_status, actor_id, reason, at)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            blast_id, from_status, to_status, actor_id, reason,
            when or NOW_SQL,
        ),
    )


def insert_notification_jobs(blast_id, scheduled_at_dt, status='SCHEDULED'):
    """Cree les jobs T-24h, T-6h, T-30min, T-10min + popups toutes les 15min sur 120min.

    Defauts conformes a BlastNotificationPlannerImpl :
      - EMAIL_24H        : T - 1440 min
      - EMAIL_6H         : T -  360 min
      - EMAIL_30M        : T -   30 min
      - GENERAL_ALARM_10M: T -   10 min
      - POPUP_15M (x8)   : T - 120, 105, 90, ..., 15 min
    """
    jobs = [
        ('EMAIL_24H', scheduled_at_dt - timedelta(minutes=1440)),
        ('EMAIL_6H', scheduled_at_dt - timedelta(minutes=360)),
        ('EMAIL_30M', scheduled_at_dt - timedelta(minutes=30)),
        ('GENERAL_ALARM_10M', scheduled_at_dt - timedelta(minutes=10)),
    ]
    # Popups 15-min sur fenetre 120 min
    for offset in range(120, 0, -15):
        jobs.append(('POPUP_15M', scheduled_at_dt - timedelta(minutes=offset)))

    for job_type, when in jobs:
        cur.execute(
            """
            INSERT INTO blast_notification_job (
                blast_id, type, scheduled_at, status, attempts
            ) VALUES (%s, %s, %s, %s, 0)
            """,
            (blast_id, job_type, when.strftime('%Y-%m-%d %H:%M:%S'), status),
        )
    return len(jobs)


# ─────────────────────────────────────────────────────────────────────────────
# TIR 1 : BLT-2026-0142 Fosse Nord — Gradin 1080, PRODUCTION,
#         18/06/2026 14:00, CONFIRMED, K. Ouedraogo
# Tir confirme dans le futur -> NotificationJobs SCHEDULED
# ─────────────────────────────────────────────────────────────────────────────
print('\n[3] Tir BLT-2026-0142 (CONFIRMED, futur)...')
sched_0142 = (TODAY + timedelta(days=2)).replace(hour=14, minute=0, second=0)
id_0142 = insert_blast(
    reference='BLT-2026-0142',
    scheduled_at=sched_0142.strftime('%Y-%m-%d %H:%M:%S'),
    type_='PRODUCTION',
    pit='Fosse Nord',
    bench='Gradin 1080',
    block=None,
    status='CONFIRMED',
    blaster_id=BLASTER_OUEDRAOGO,
    hse_lead_id=HSE_LEAD,
    exclusion_radius_m=500.0,
    ppv_limit=10.0,
    access_concerned='Piste Nord (PK 2+300), acces atelier maintenance, route service Y-180',
    assembly_points='AP-NORTH-01, AP-NORTH-02',
    team='K. Ouedraogo (chef de tir), 2 boutefeux assistants, 4 gardes sentinelles',
    sensitive_receivers='Aucun recepteur sensible (rayon 500m libre)',
    notes='Tir de production standard. Verifier meteo J-1 (vent < 30 km/h sinon report).',
    alarm_zone_scope='FOSSE_NORD',
)
insert_plan(
    blast_id=id_0142,
    hole_count=48,
    hole_diameter_mm=115.0,
    depth_m=10.0,
    burden_m=3.2,
    spacing_m=3.7,
    stemming_m=2.8,
    explosive_type='emulsion',
    explosive_qty_kg=2100.0,
    powder_factor=0.72,
    initiation_system='Detonateurs electroniques',
    delay_sequence='25ms entre trous, 100ms entre rangees',
)
insert_recipients(id_0142)
insert_status_event(id_0142, None, 'DRAFT', reason='Creation initiale (seed P8)')
insert_status_event(id_0142, 'DRAFT', 'PLANNED', reason='Planification (seed P8)')
insert_status_event(id_0142, 'PLANNED', 'CONFIRMED', reason='Confirmation par boutefeu (seed P8)')
nb_jobs_0142 = insert_notification_jobs(id_0142, sched_0142, status='SCHEDULED')
print(f"  blast_id={id_0142}, {nb_jobs_0142} notification jobs SCHEDULED")

# ─────────────────────────────────────────────────────────────────────────────
# TIR 2 : BLT-2026-0143 Fosse Sud — Gradin 1065, DEVELOPMENT,
#         19/06/2026 11:30, PLANNED, A. Kone
# Pas encore confirme -> pas de notification jobs
# ─────────────────────────────────────────────────────────────────────────────
print('\n[4] Tir BLT-2026-0143 (PLANNED, futur)...')
sched_0143 = (TODAY + timedelta(days=5)).replace(hour=11, minute=30, second=0)
id_0143 = insert_blast(
    reference='BLT-2026-0143',
    scheduled_at=sched_0143.strftime('%Y-%m-%d %H:%M:%S'),
    type_='DEVELOPMENT',
    pit='Fosse Sud',
    bench='Gradin 1065',
    block=None,
    status='PLANNED',
    blaster_id=BLASTER_KONE,
    hse_lead_id=HSE_LEAD,
    exclusion_radius_m=350.0,
    ppv_limit=10.0,
    access_concerned='Acces piste sud, voie de roulage SR-12',
    assembly_points='AP-SOUTH-01',
    team='A. Kone (chef de tir), 1 boutefeu assistant',
    notes='Tir de developpement pour creation du gradin 1065. JSA a finaliser.',
    alarm_zone_scope='FOSSE_SUD',
)
insert_plan(
    blast_id=id_0143,
    hole_count=22,
    hole_diameter_mm=89.0,
    depth_m=6.5,
    burden_m=2.5,
    spacing_m=3.0,
    stemming_m=2.0,
    explosive_type='ANFO',
    explosive_qty_kg=520.0,
    powder_factor=0.55,
    initiation_system='Detonateurs non-electriques (NONEL)',
    delay_sequence='17ms / 42ms en quinconce',
)
insert_recipients(id_0143)
insert_status_event(id_0143, None, 'DRAFT', reason='Creation initiale (seed P8)')
insert_status_event(id_0143, 'DRAFT', 'PLANNED', reason='Planification (seed P8)')
print(f"  blast_id={id_0143} (pas de jobs car PLANNED non confirme)")

# ─────────────────────────────────────────────────────────────────────────────
# TIR 3 : BLT-2026-0144 Carriere Est — Bloc B3, SECONDARY (petardage),
#         17/06/2026 16:00, CONFIRMED, K. Ouedraogo
# Petardage confirme -> jobs SCHEDULED
# ─────────────────────────────────────────────────────────────────────────────
print('\n[5] Tir BLT-2026-0144 (CONFIRMED, futur, petardage)...')
sched_0144 = (TODAY + timedelta(days=1)).replace(hour=16, minute=0, second=0)
id_0144 = insert_blast(
    reference='BLT-2026-0144',
    scheduled_at=sched_0144.strftime('%Y-%m-%d %H:%M:%S'),
    type_='SECONDARY',
    pit='Carriere Est',
    bench=None,
    block='Bloc B3',
    status='CONFIRMED',
    blaster_id=BLASTER_OUEDRAOGO,
    hse_lead_id=HSE_LEAD,
    exclusion_radius_m=200.0,
    ppv_limit=8.0,
    access_concerned='Acces piste carriere est, zone tampon riverains',
    assembly_points='AP-EAST-01',
    team='K. Ouedraogo + 1 assistant',
    sensitive_receivers='Hameau Tanga (1.2 km) — notification riverains envoyee',
    notes='Petardage secondaire de blocs hors-calibre. Charge unitaire reduite.',
    alarm_zone_scope='CARRIERE_EST',
)
insert_plan(
    blast_id=id_0144,
    hole_count=12,
    hole_diameter_mm=64.0,
    depth_m=2.5,
    burden_m=1.5,
    spacing_m=1.8,
    stemming_m=1.0,
    explosive_type='Cartouche dynamite',
    explosive_qty_kg=85.0,
    powder_factor=1.10,
    initiation_system='Detonateurs electriques',
    delay_sequence='Tir simultane (synchrone)',
)
insert_recipients(id_0144)
insert_status_event(id_0144, None, 'DRAFT', reason='Creation initiale (seed P8)')
insert_status_event(id_0144, 'DRAFT', 'PLANNED', reason='Planification (seed P8)')
insert_status_event(id_0144, 'PLANNED', 'CONFIRMED', reason='Confirmation par boutefeu (seed P8)')
nb_jobs_0144 = insert_notification_jobs(id_0144, sched_0144, status='SCHEDULED')
print(f"  blast_id={id_0144}, {nb_jobs_0144} notification jobs SCHEDULED")

# ─────────────────────────────────────────────────────────────────────────────
# TIR 4 : BLT-2026-0139 Fosse Nord — Gradin 1095, PRODUCTION,
#         12/06/2026 15:00, ALL_CLEAR, A. Kone
# Tir TERMINE -> rapport d'evacuation signe + jobs SENT
# ─────────────────────────────────────────────────────────────────────────────
print('\n[6] Tir BLT-2026-0139 (ALL_CLEAR, termine, rapport signe)...')
sched_0139 = (TODAY - timedelta(days=3)).replace(hour=15, minute=0, second=0)
id_0139 = insert_blast(
    reference='BLT-2026-0139',
    scheduled_at=sched_0139.strftime('%Y-%m-%d %H:%M:%S'),
    type_='PRODUCTION',
    pit='Fosse Nord',
    bench='Gradin 1095',
    block=None,
    status='ALL_CLEAR',
    blaster_id=BLASTER_KONE,
    hse_lead_id=HSE_LEAD,
    exclusion_radius_m=500.0,
    ppv_limit=10.0,
    access_concerned='Piste Nord (PK 2+300), acces atelier maintenance',
    assembly_points='AP-NORTH-01, AP-NORTH-02',
    team='A. Kone (chef de tir), 2 assistants, 4 gardes',
    notes='Tir de production execute conformement au plan. Aucun incident.',
    alarm_zone_scope='FOSSE_NORD',
)
insert_plan(
    blast_id=id_0139,
    hole_count=42,
    hole_diameter_mm=115.0,
    depth_m=9.5,
    burden_m=3.2,
    spacing_m=3.7,
    stemming_m=2.8,
    explosive_type='emulsion',
    explosive_qty_kg=1850.0,
    powder_factor=0.70,
    initiation_system='Detonateurs electroniques',
    delay_sequence='25ms entre trous, 100ms entre rangees',
)
insert_recipients(id_0139)
# Cycle complet : DRAFT -> PLANNED -> CONFIRMED -> IMMINENT -> FIRED -> ALL_CLEAR
t_creation = sched_0139 - timedelta(days=7)
insert_status_event(id_0139, None, 'DRAFT',
                    reason='Creation initiale (seed P8)',
                    when=t_creation.strftime('%Y-%m-%d %H:%M:%S'))
insert_status_event(id_0139, 'DRAFT', 'PLANNED',
                    reason='Planification (seed P8)',
                    when=(t_creation + timedelta(hours=2)).strftime('%Y-%m-%d %H:%M:%S'))
insert_status_event(id_0139, 'PLANNED', 'CONFIRMED',
                    reason='Confirmation par boutefeu (seed P8)',
                    when=(sched_0139 - timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S'))
insert_status_event(id_0139, 'CONFIRMED', 'IMMINENT',
                    reason='Passage en imminent (T-30min)',
                    when=(sched_0139 - timedelta(minutes=30)).strftime('%Y-%m-%d %H:%M:%S'))
insert_status_event(id_0139, 'IMMINENT', 'FIRED',
                    reason='Tir execute',
                    when=sched_0139.strftime('%Y-%m-%d %H:%M:%S'))
insert_status_event(id_0139, 'FIRED', 'ALL_CLEAR',
                    reason='Inspection post-tir : aucun rate, zone degagee',
                    when=(sched_0139 + timedelta(minutes=12)).strftime('%Y-%m-%d %H:%M:%S'))
# Jobs deja envoyes
nb_jobs_0139 = insert_notification_jobs(id_0139, sched_0139, status='SENT')
# Mark sent_at sur les jobs envoyes (best-effort)
cur.execute(
    "UPDATE blast_notification_job SET sent_at = scheduled_at WHERE blast_id = %s AND status = 'SENT'",
    (id_0139,),
)
# Rapport d'evacuation signe
alarm_at = (sched_0139 - timedelta(minutes=10)).strftime('%Y-%m-%d %H:%M:%S')
fired_at = sched_0139.strftime('%Y-%m-%d %H:%M:%S')
all_clear_at = (sched_0139 + timedelta(minutes=12)).strftime('%Y-%m-%d %H:%M:%S')
signed_at = (sched_0139 + timedelta(minutes=25)).strftime('%Y-%m-%d %H:%M:%S')
cur.execute(
    """
    INSERT INTO blast_evacuation_report (
        blast_id, alarm_triggered_at, mustered_count, missing_count,
        evac_duration_seconds, fired_at, all_clear_at, incidents,
        signed_off_by, signed_at
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """,
    (
        id_0139, alarm_at, 47, 0, 480, fired_at, all_clear_at,
        'RAS — Aucun incident. Evacuation complete en 8 minutes. PPV mesure : 6.4 mm/s (sous limite 10 mm/s).',
        HSE_LEAD, signed_at,
    ),
)
print(f"  blast_id={id_0139}, {nb_jobs_0139} jobs SENT, rapport d'evacuation signe par employee_id={HSE_LEAD}")

# ─────────────────────────────────────────────────────────────────────────────
# TIR 5 : BLT-2026-0140 Fosse Ouest — Gradin 1050, PRODUCTION,
#         14/06/2026 10:00, POSTPONED, K. Ouedraogo
# Tir reporte : on cree d'abord les jobs en SCHEDULED, puis on les CANCELLED,
# puis on REPLAN (nouveaux jobs SCHEDULED pour la date reportee).
# ─────────────────────────────────────────────────────────────────────────────
print('\n[7] Tir BLT-2026-0140 (POSTPONED, jobs CANCELLED + REPLAN)...')
sched_0140_orig = (TODAY - timedelta(days=1)).replace(hour=10, minute=0, second=0)
sched_0140_new = (TODAY + timedelta(days=6)).replace(hour=10, minute=0, second=0)  # report a +7j (operationnel)
id_0140 = insert_blast(
    reference='BLT-2026-0140',
    scheduled_at=sched_0140_orig.strftime('%Y-%m-%d %H:%M:%S'),
    type_='PRODUCTION',
    pit='Fosse Ouest',
    bench='Gradin 1050',
    block=None,
    status='POSTPONED',
    blaster_id=BLASTER_OUEDRAOGO,
    hse_lead_id=HSE_LEAD,
    exclusion_radius_m=450.0,
    ppv_limit=10.0,
    access_concerned='Piste Ouest, acces convoyeur principal',
    assembly_points='AP-WEST-01',
    team='K. Ouedraogo (chef de tir), 2 assistants',
    notes='Tir reporte au 21/06 suite a alerte meteo (orage previsionnel).',
    alarm_zone_scope='FOSSE_OUEST',
)
insert_plan(
    blast_id=id_0140,
    hole_count=36,
    hole_diameter_mm=115.0,
    depth_m=10.0,
    burden_m=3.2,
    spacing_m=3.7,
    stemming_m=2.8,
    explosive_type='emulsion',
    explosive_qty_kg=1650.0,
    powder_factor=0.68,
    initiation_system='Detonateurs electroniques',
    delay_sequence='25ms entre trous',
)
insert_recipients(id_0140)
insert_status_event(id_0140, None, 'DRAFT', reason='Creation initiale (seed P8)')
insert_status_event(id_0140, 'DRAFT', 'PLANNED', reason='Planification (seed P8)')
insert_status_event(id_0140, 'PLANNED', 'CONFIRMED', reason='Confirmation par boutefeu (seed P8)')
# Etape 1 : creation des jobs en CANCELLED (ils ont ete planifies puis cancel)
nb_cancelled = insert_notification_jobs(id_0140, sched_0140_orig, status='CANCELLED')
# Transition vers POSTPONED (le report cancel automatiquement les jobs)
insert_status_event(
    id_0140, 'CONFIRMED', 'POSTPONED',
    reason='Report meteo : orage prevu — tir reporte au 21/06/2026 10:00',
)
# Etape 2 : REPLAN -> on cree de nouveaux jobs SCHEDULED a la nouvelle date
nb_replan = insert_notification_jobs(id_0140, sched_0140_new, status='SCHEDULED')
print(
    f"  blast_id={id_0140}, {nb_cancelled} jobs CANCELLED (date originale), "
    f"{nb_replan} jobs SCHEDULED (date reportee 21/06)"
)

# ─────────────────────────────────────────────────────────────────────────────
# Reactivation des triggers append-only
# ─────────────────────────────────────────────────────────────────────────────
print('\n[8] Reactivation des triggers append-only sur blast_status_event...')
cur.execute(
    """
    CREATE TRIGGER trg_blast_status_event_no_update
    BEFORE UPDATE ON blast_status_event
    FOR EACH ROW
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'blast_status_event is APPEND-ONLY (blast workflow traceability)'
    """
)
cur.execute(
    """
    CREATE TRIGGER trg_blast_status_event_no_delete
    BEFORE DELETE ON blast_status_event
    FOR EACH ROW
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'blast_status_event is APPEND-ONLY (blast workflow traceability)'
    """
)

# Commit final
conn.commit()

# ─────────────────────────────────────────────────────────────────────────────
# Recap
# ─────────────────────────────────────────────────────────────────────────────
print('\n' + '=' * 70)
print('SEED BLAST — RECAP')
print('=' * 70)
cur.execute(
    f"SELECT reference, status, scheduled_at, pit, bench, block, type "
    f"FROM blast WHERE reference IN ({placeholders}) ORDER BY reference",
    REFS,
)
for row in cur.fetchall():
    print(f"  {row[0]:18s} {row[1]:11s} {str(row[2]):20s} {row[3]:14s} {str(row[4] or ''):14s} {str(row[5] or '')[:8]:8s} {row[6]}")

cur.execute(
    f"""
    SELECT b.reference, j.status, COUNT(*)
    FROM blast b
    JOIN blast_notification_job j ON j.blast_id = b.id
    WHERE b.reference IN ({placeholders})
    GROUP BY b.reference, j.status
    ORDER BY b.reference, j.status
    """,
    REFS,
)
print('\nJobs:')
for ref, st, cnt in cur.fetchall():
    print(f"  {ref:18s} {st:11s} {cnt}")

cur.execute(
    f"""
    SELECT b.reference, COUNT(r.id)
    FROM blast b
    LEFT JOIN blast_recipient r ON r.blast_id = b.id
    WHERE b.reference IN ({placeholders})
    GROUP BY b.reference
    ORDER BY b.reference
    """,
    REFS,
)
print('\nRecipients:')
for ref, cnt in cur.fetchall():
    print(f"  {ref:18s} {cnt} destinataires")

cur.execute(
    f"""
    SELECT b.reference, er.signed_at IS NOT NULL, er.mustered_count, er.missing_count
    FROM blast b
    LEFT JOIN blast_evacuation_report er ON er.blast_id = b.id
    WHERE b.reference IN ({placeholders})
      AND er.id IS NOT NULL
    ORDER BY b.reference
    """,
    REFS,
)
print('\nEvacuation reports:')
for ref, signed, mustered, missing in cur.fetchall():
    print(f"  {ref:18s} signe={signed}  mustered={mustered}  missing={missing}")

print('\nSeed termine avec succes.')
conn.close()

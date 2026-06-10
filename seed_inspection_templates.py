"""
SEED Inspections HSE — Phase 6.

Insere 8 modeles d'inspection conformes ISO 45001 (referentiels metier mine) :

  EQUIPEMENT (5)
    EQ-CAMION-BENNE     Camion benne (HD truck) — verification journaliere
    EQ-EXCAVATEUR       Excavateur / pelle mecanique — controle pre-quart
    EQ-FOREUSE          Foreuse rotative — visite securite tour de forage
    EQ-CONVOYEUR        Convoyeur a bande — inspection hebdomadaire
    EQ-COMPRESSEUR      Compresseur haute pression — controle technique

  LIEU (2)
    LOC-ATELIER-MAINT   Atelier de maintenance — inspection 5S + securite
    LOC-MAGAZIN-EXPL    Magasin d'explosifs — controle hebdo conformite

  PROCEDURE (1)
    PROC-LOTO           Consignation / deconsignation (LOTO) — audit terrain

Reference normative :
  - ISO 45001 §8.1 (Planification et maitrise operationnelle)
  - ISO 45001 §9.1 (Surveillance, mesure, analyse, evaluation)
  - Code minier OHADA & directives MICTU pour le contenu metier

Lancement : python seed_inspection_templates.py
Idempotent : DELETE des codes cibles avant INSERT.
"""
from datetime import datetime

from db_env import connect

# ATTENTION : le service Health-Safety utilise le schema 'healthsafety'
# (cf. DB_URL_HNS dans Backend/.env). 'defaultdb' = MineXpert HRMS.
# Le seed du 08/06/2026 avait cible 'defaultdb' par erreur (corrige LOT 50).
conn = connect('healthsafety')
cur = conn.cursor()

USER_ID = 14
NOW = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

# ─────────────────────────────────────────────────────────────────────────────
#  Templates a inserer
# ─────────────────────────────────────────────────────────────────────────────
TEMPLATES = [
    # ── EQUIPEMENT 1 : Camion benne ─────────────────────────────────────────
    dict(code='EQ-CAMION-BENNE', name='Camion benne (HD truck)', type='EQUIPMENT',
         scope='HEAVY_TRUCK', est_min=20,
         desc='Verification journaliere avant prise de poste. ISO 45001 §8.1.4 (preparation operationnelle).',
         checkpoints=[
             dict(label='Etat des pneus avant gauche', help='Usure, hernies, pression visible', type='VISUAL_GRADE', expected='GOOD', critical=True),
             dict(label='Etat des pneus avant droit', type='VISUAL_GRADE', expected='GOOD', critical=True),
             dict(label='Etat des pneus arriere', type='VISUAL_GRADE', expected='GOOD'),
             dict(label='Pression huile moteur', help='Lire moteur chaud apres 5 min', type='NUMERIC_RANGE', minv=3.5, maxv=5.5, unit='bar', critical=True),
             dict(label='Niveau liquide de refroidissement', type='NUMERIC_RANGE', minv=80.0, maxv=100.0, unit='%'),
             dict(label='Klaxon fonctionnel', type='BOOLEAN', expected='true', critical=True),
             dict(label='Avertisseur de recul', type='BOOLEAN', expected='true', critical=True),
             dict(label='Feux avant + arriere', type='BOOLEAN', expected='true'),
             dict(label='Gyrophare operationnel', type='BOOLEAN', expected='true'),
             dict(label='Ceinture de securite', type='BOOLEAN', expected='true', critical=True),
             dict(label='Extincteur present et controle', type='BOOLEAN', expected='true', critical=True),
             dict(label='Photo du tableau de bord', type='PHOTO_REQUIRED'),
             dict(label='Observation generale conducteur', type='FREE_TEXT'),
         ]),
    # ── EQUIPEMENT 2 : Excavateur ──────────────────────────────────────────
    dict(code='EQ-EXCAVATEUR', name='Excavateur / pelle mecanique', type='EQUIPMENT',
         scope='EXCAVATOR', est_min=25,
         desc='Controle pre-quart selon ISO 45001 §8.1.2 (elimination des dangers).',
         checkpoints=[
             dict(label='Etat des chenilles', type='VISUAL_GRADE', expected='GOOD', critical=True),
             dict(label='Verins hydrauliques bras principal', help='Verifier absence de fuite', type='VISUAL_GRADE', expected='GOOD', critical=True),
             dict(label='Niveau hydraulique reservoir', type='NUMERIC_RANGE', minv=70.0, maxv=100.0, unit='%', critical=True),
             dict(label='Temperature hydraulique', type='NUMERIC_RANGE', minv=40.0, maxv=80.0, unit='C'),
             dict(label='Pression circuit principal', type='NUMERIC_RANGE', minv=210.0, maxv=350.0, unit='bar', critical=True),
             dict(label='Verrouillage cabine actif', type='BOOLEAN', expected='true', critical=True),
             dict(label='Avertisseur de marche arriere', type='BOOLEAN', expected='true', critical=True),
             dict(label='Vitres cabine et essuie-glaces', type='VISUAL_GRADE', expected='GOOD'),
             dict(label='Trousse de secours embarquee', type='BOOLEAN', expected='true'),
             dict(label='Extincteur 9 kg minimum', type='BOOLEAN', expected='true', critical=True),
             dict(label='Photo du godet apres nettoyage', type='PHOTO_REQUIRED'),
             dict(label='Anomalies observees', type='FREE_TEXT'),
         ]),
    # ── EQUIPEMENT 3 : Foreuse ─────────────────────────────────────────────
    dict(code='EQ-FOREUSE', name='Foreuse rotative', type='EQUIPMENT',
         scope='DRILL_RIG', est_min=30,
         desc='Visite securite tour de forage. ISO 45001 §6.1.2.2 (evaluation des risques).',
         checkpoints=[
             dict(label='Stabilite mat (verticalite)', type='VISUAL_GRADE', expected='GOOD', critical=True),
             dict(label='Etat cable de remontee', help='Pas de toron casse, lubrification', type='VISUAL_GRADE', expected='GOOD', critical=True),
             dict(label='Pression circuit air comprime', type='NUMERIC_RANGE', minv=6.0, maxv=10.0, unit='bar', critical=True),
             dict(label='Debit d injection eau (depoussierage)', type='NUMERIC_RANGE', minv=80.0, maxv=120.0, unit='L/min'),
             dict(label='Capteur fin de course operationnel', type='BOOLEAN', expected='true', critical=True),
             dict(label='Arret d urgence accessible et teste', type='BOOLEAN', expected='true', critical=True),
             dict(label='Isolation electrique mat verifiee', type='BOOLEAN', expected='true', critical=True),
             dict(label='Outils en place et arrimes', type='BOOLEAN', expected='true'),
             dict(label='Pictogrammes de securite visibles', type='BOOLEAN', expected='true'),
             dict(label='Photo de la plateforme de forage', type='PHOTO_REQUIRED'),
             dict(label='Notes complementaires foreur', type='FREE_TEXT'),
         ]),
    # ── EQUIPEMENT 4 : Convoyeur ────────────────────────────────────────────
    dict(code='EQ-CONVOYEUR', name='Convoyeur a bande', type='EQUIPMENT',
         scope='CONVEYOR', est_min=20,
         desc='Inspection hebdomadaire. Risque entrainement reference au Code minier OHADA art. 87.',
         checkpoints=[
             dict(label='Etat de la bande (dechirures, usure)', type='VISUAL_GRADE', expected='GOOD', critical=True),
             dict(label='Alignement tambour de tete', type='VISUAL_GRADE', expected='GOOD'),
             dict(label='Tension de la bande', help='Verifier flexibilite a mi-portee', type='VISUAL_GRADE', expected='GOOD'),
             dict(label='Carter de protection rouleau', type='BOOLEAN', expected='true', critical=True),
             dict(label='Cable d arret d urgence (tirette)', type='BOOLEAN', expected='true', critical=True),
             dict(label='Tunnel grillage anti-acces', type='BOOLEAN', expected='true', critical=True),
             dict(label='Vitesse de bande mesuree', type='NUMERIC_RANGE', minv=1.5, maxv=3.5, unit='m/s'),
             dict(label='Bruit ambiant en zone', type='NUMERIC_RANGE', minv=0.0, maxv=85.0, unit='dB(A)'),
             dict(label='Eclairage tunnel suffisant', type='BOOLEAN', expected='true'),
             dict(label='Photo zone d entrainement', type='PHOTO_REQUIRED'),
             dict(label='Mesures correctives proposees', type='FREE_TEXT'),
         ]),
    # ── EQUIPEMENT 5 : Compresseur ─────────────────────────────────────────
    dict(code='EQ-COMPRESSEUR', name='Compresseur haute pression', type='EQUIPMENT',
         scope='COMPRESSOR', est_min=15,
         desc='Controle technique mensuel. Equipement sous pression - obligation reglementaire.',
         checkpoints=[
             dict(label='Pression de service nominale', type='NUMERIC_RANGE', minv=7.0, maxv=10.0, unit='bar', critical=True),
             dict(label='Soupape de surete (date de controle)', type='BOOLEAN', expected='true', critical=True),
             dict(label='Manometre lisible et calibre', type='BOOLEAN', expected='true'),
             dict(label='Temperature sortie air', type='NUMERIC_RANGE', minv=20.0, maxv=85.0, unit='C'),
             dict(label='Niveau d huile compresseur', type='NUMERIC_RANGE', minv=50.0, maxv=100.0, unit='%'),
             dict(label='Etat du filtre admission', type='VISUAL_GRADE', expected='GOOD'),
             dict(label='Vibration anormale', type='VISUAL_GRADE', expected='GOOD'),
             dict(label='Mise a la terre electrique verifiee', type='BOOLEAN', expected='true', critical=True),
             dict(label='Plaque signaletique lisible', type='BOOLEAN', expected='true'),
             dict(label='Photo de la cuve', type='PHOTO_REQUIRED'),
             dict(label='Constat technicien', type='FREE_TEXT'),
         ]),
    # ── LIEU 1 : Atelier maintenance ───────────────────────────────────────
    dict(code='LOC-ATELIER-MAINT', name='Atelier de maintenance', type='LOCATION',
         scope='WORKSHOP', est_min=25,
         desc='Inspection 5S + securite poste de travail. ISO 45001 §8.1.3 (gestion du changement).',
         checkpoints=[
             dict(label='Sols propres et degages (5S Seiton)', type='VISUAL_GRADE', expected='GOOD'),
             dict(label='Eclairage suffisant au poste', type='NUMERIC_RANGE', minv=300.0, maxv=1000.0, unit='lux'),
             dict(label='Niveau sonore zone soudure', type='NUMERIC_RANGE', minv=0.0, maxv=85.0, unit='dB(A)'),
             dict(label='Extincteurs presents et a jour', type='BOOLEAN', expected='true', critical=True),
             dict(label='Issues de secours degagees', type='BOOLEAN', expected='true', critical=True),
             dict(label='Trousse de secours visible et complete', type='BOOLEAN', expected='true', critical=True),
             dict(label='Douche oculaire d urgence accessible', type='BOOLEAN', expected='true', critical=True),
             dict(label='Affichage consignes incendie', type='BOOLEAN', expected='true'),
             dict(label='Stockage produits chimiques (etagere ventilee)', type='VISUAL_GRADE', expected='GOOD', critical=True),
             dict(label='FDS (fiches donnees securite) accessibles', type='BOOLEAN', expected='true', critical=True),
             dict(label='Photo zone d intervention', type='PHOTO_REQUIRED'),
             dict(label='Actions correctives proposees', type='FREE_TEXT'),
         ]),
    # ── LIEU 2 : Magasin explosifs ──────────────────────────────────────────
    dict(code='LOC-MAGAZIN-EXPL', name='Magasin d explosifs', type='LOCATION',
         scope='EXPLOSIVE_MAGAZINE', est_min=20,
         desc='Controle hebdomadaire de conformite. Reglement minier - acces strictement controle.',
         checkpoints=[
             dict(label='Cloture peripherique integre', type='VISUAL_GRADE', expected='GOOD', critical=True),
             dict(label='Cadenas portes principales', type='BOOLEAN', expected='true', critical=True),
             dict(label='Registre d entree / sortie tenu a jour', type='BOOLEAN', expected='true', critical=True),
             dict(label='Stocks reels = registre theorique', type='BOOLEAN', expected='true', critical=True),
             dict(label='Detonateurs separes des explosifs', type='BOOLEAN', expected='true', critical=True),
             dict(label='Temperature ambiante interieure', type='NUMERIC_RANGE', minv=5.0, maxv=30.0, unit='C', critical=True),
             dict(label='Humidite ambiante', type='NUMERIC_RANGE', minv=20.0, maxv=70.0, unit='%'),
             dict(label='Eclairage de securite fonctionnel', type='BOOLEAN', expected='true'),
             dict(label='Detecteur intrusion arme', type='BOOLEAN', expected='true', critical=True),
             dict(label='Paratonnerre verifie (annuel)', type='BOOLEAN', expected='true', critical=True),
             dict(label='Pictogrammes ATEX en place', type='BOOLEAN', expected='true'),
             dict(label='Photo zone de stockage', type='PHOTO_REQUIRED'),
             dict(label='Observations agent de surveillance', type='FREE_TEXT'),
         ]),
    # ── PROCEDURE 1 : LOTO ──────────────────────────────────────────────────
    dict(code='PROC-LOTO', name='Consignation deconsignation (LOTO)', type='PROCEDURE',
         scope='LOCKOUT_TAGOUT', est_min=15,
         desc='Audit terrain procedure LOTO. ISO 45001 §6.1.2.1 + Reglement OHADA energies dangereuses.',
         checkpoints=[
             dict(label='Permis de consignation emis et signe', type='BOOLEAN', expected='true', critical=True),
             dict(label='Cadenas personnel en place', type='BOOLEAN', expected='true', critical=True),
             dict(label='Etiquette LOTO renseignee (nom, date, raison)', type='BOOLEAN', expected='true', critical=True),
             dict(label='Test d absence de tension effectue', type='BOOLEAN', expected='true', critical=True),
             dict(label='Energie residuelle dissipee (pression, vapeur)', type='BOOLEAN', expected='true', critical=True),
             dict(label='Equipement isole verifie a la mise hors service', type='BOOLEAN', expected='true', critical=True),
             dict(label='Photo des dispositifs de consignation', type='PHOTO_REQUIRED'),
             dict(label='Conformite a la procedure interne (OK/non conforme)', type='VISUAL_GRADE', expected='GOOD'),
             dict(label='Commentaires auditeur', type='FREE_TEXT'),
         ]),
]

# ─────────────────────────────────────────────────────────────────────────────
#  Purge ciblee + reinsertion
# ─────────────────────────────────────────────────────────────────────────────
CODES = [t['code'] for t in TEMPLATES]
placeholders = ','.join(['%s'] * len(CODES))

print(f'[1] Purge des templates existants : {", ".join(CODES)}')
cur.execute(f'SELECT id FROM inspection_template WHERE code IN ({placeholders})', CODES)
existing_ids = [row[0] for row in cur.fetchall()]
if existing_ids:
    cur.execute(
        f'DELETE FROM inspection_checkpoint WHERE template_id IN ({",".join(["%s"] * len(existing_ids))})',
        existing_ids,
    )
    cur.execute(
        f'DELETE FROM inspection_template WHERE id IN ({",".join(["%s"] * len(existing_ids))})',
        existing_ids,
    )
    print(f'  Purged {len(existing_ids)} template(s) + checkpoints')
else:
    print('  Aucun template existant a purger')

print(f'[2] Insertion de {len(TEMPLATES)} templates...')
for tpl in TEMPLATES:
    cur.execute(
        '''
        INSERT INTO inspection_template
            (code, name, description, type, scope_ref, estimated_duration_min,
             created_by, created_at, updated_at, active)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 1)
        ''',
        (tpl['code'], tpl['name'], tpl['desc'], tpl['type'], tpl['scope'],
         tpl['est_min'], USER_ID, NOW, NOW),
    )
    tpl_id = cur.lastrowid
    for order, cp in enumerate(tpl['checkpoints'], start=1):
        cur.execute(
            '''
            INSERT INTO inspection_checkpoint
                (template_id, label, help_text, response_type, min_value, max_value,
                 unit, expected_value, display_order, critical, required)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''',
            (tpl_id, cp['label'], cp.get('help'), cp['type'],
             cp.get('minv'), cp.get('maxv'),
             cp.get('unit'), cp.get('expected'),
             order,
             1 if cp.get('critical', False) else 0,
             1 if cp.get('required', True) else 0),
        )
    print(f'  + {tpl["code"]:20s} {tpl["name"]:42s} {len(tpl["checkpoints"]):2d} checkpoints')

conn.commit()
print()
print('=== COMMIT OK ===')

# Verification finale
print()
print('=== Verification ===')
cur.execute('''SELECT t.code, t.name, t.type, COUNT(c.id) AS cp_count
               FROM inspection_template t
               LEFT JOIN inspection_checkpoint c ON c.template_id = t.id
               WHERE t.active = 1
               GROUP BY t.id, t.code, t.name, t.type
               ORDER BY t.type, t.code''')
for row in cur.fetchall():
    print(f'  {row[0]:20s} {row[1]:42s} {row[2]:10s} cp={row[3]:2d}')

cur.close()
conn.close()
print()
print('Seed termine. 8 templates inseres conformes ISO 45001.')

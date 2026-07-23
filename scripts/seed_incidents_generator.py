#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Générateur d'incidents HSE bien documentés (2024 -> 2026) pour SafeX 360.

Réplique FIDÈLEMENT ce que les formulaires écrivent (contrat d'API vérifié) :
incident + incident_detail + incident_history (machine à états) + incident_analysis
+ incident_investigation + corrective_action (avec évaluation d'efficacité) +
incident_injury (issues de lésion, dont FATALITY). Utilise UNIQUEMENT des ids de
référence RÉELS harvestés depuis les incidents existants de chaque mine -> aucune
donnée orpheline, cohérence garantie.

- Idempotent : chaque incident a un numéro déterministe INC-{annee}-9{mine}{seq},
  ré-exécutable sans doublon (skip si le numéro existe).
- Taggé : le motif « 9{mine} » dans le bloc numéro identifie/permet le nettoyage.
- Prudent : --dry (simulation), --limit N (prototype), --mine M, --target N.

Usage :
  python scripts/seed_incidents_generator.py --dry --limit 3
  python scripts/seed_incidents_generator.py --mine 6 --limit 5
  python scripts/seed_incidents_generator.py --target 235      # plein régime
  python scripts/seed_incidents_generator.py --cleanup         # supprime les générés
"""
import argparse, hashlib, random, re, ssl, sys
from datetime import datetime, timedelta, date
import pymysql

try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

MINES = [1, 6]
FATALITIES_PER_MINE = 3          # 6 au total sur les 2 mines
CANON_TARGET = 235              # taille canonique servant à figer les seq fatals
START = date(2024, 1, 1)
END = date(2026, 7, 20)

# Seq fatals FIGÉS par mine (déterministes, INDÉPENDANTS de --limit/--target) :
# garantit exactement 3 fatalités/mine quel que soit le mode d'exécution.
FATAL_SEQS = {m: set(random.Random(f"fatal-{m}").sample(range(1, CANON_TARGET + 1), FATALITIES_PER_MINE))
              for m in MINES}

# ---------- connexion ----------
def load_env(path="Backend/.env"):
    env = {}
    for line in open(path, encoding="utf-8", errors="ignore"):
        m = re.match(r"\s*([A-Z_]+)\s*=\s*'?([^'\r\n]*)'?", line)
        if m: env[m.group(1)] = m.group(2)
    return env

def connect(target):
    env = load_env()
    key = "DB_URL_HNS_AIVEN" if target == "aiven" else "DB_URL_HNS"
    if target == "local":
        return pymysql.connect(host="127.0.0.1", port=3306, user=env.get("DB_USERNAME", "root"),
                               password=env.get("DB_PASSWORD", ""), database="healthsafety", autocommit=False)
    m = re.search(r"//(?:([^:@/]+)(?::([^@/]+))?@)?([^:/]+):(\d+)/([^?]+)", env[key])
    ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
    return pymysql.connect(host=m.group(3), port=int(m.group(4)), user=m.group(1) or env["DB_USERNAME"],
                           password=m.group(2) or env["DB_PASSWORD"], database=m.group(5).split("?")[0],
                           ssl=ctx, autocommit=False, connect_timeout=30)

# ---------- contenu réaliste (FR) ----------
SCENARIOS = [
    # (titre, bande_severite_cible, categorie_pref, danger)
    ("Chute de hauteur sur échafaudage", "Majeure", "H&S", "travail en hauteur"),
    ("Écrasement main sur convoyeur", "Majeure", "H&S", "pièce en mouvement"),
    ("Projection de particules aux yeux", "Modérée", "H&S", "meulage sans EPI"),
    ("Glissade sur sol souillé d'hydrocarbures", "Mineure", "H&S", "sol glissant"),
    ("Contact avec produit chimique corrosif", "Majeure", "H&S", "manipulation réactif"),
    ("Coup de chaleur en fosse", "Modérée", "H&S", "exposition thermique"),
    ("Renversement d'engin de terrassement", "Catastrophique", "H&S", "conduite engin lourd"),
    ("Collision véhicule léger / camion minier", "Majeure", "H&S", "circulation mine"),
    ("Effondrement partiel de talus", "Catastrophique", "H&S", "stabilité des terrains"),
    ("Explosion prématurée de tir de mine", "Catastrophique", "H&S", "dynamitage"),
    ("Électrisation lors d'une intervention", "Majeure", "H&S", "travaux électriques"),
    ("Inhalation de poussières de silice", "Modérée", "H&S", "empoussièrement"),
    ("Coupure profonde à la main", "Mineure", "H&S", "outil tranchant"),
    ("Presque-collision piéton / chargeuse", "Insignifiante", "H&S", "coactivité piéton-engin"),
    ("Déversement de gasoil au parc à carburant", "Modérée", "Environnement", "stockage hydrocarbures"),
    ("Fuite de boue cyanurée vers un fossé", "Majeure", "Environnement", "gestion des effluents"),
    ("Départ de feu à l'atelier soudure", "Majeure", "H&S", "travail par point chaud"),
    ("Chute d'objet depuis une plateforme", "Modérée", "H&S", "objet en hauteur"),
    ("Blessure au dos lors d'une manutention", "Mineure", "H&S", "manutention manuelle"),
    ("Intrusion non autorisée en zone tir", "Insignifiante", "Security", "contrôle d'accès"),
    ("Bris d'une conduite haute pression", "Majeure", "H&S", "énergie sous pression"),
    ("Malaise d'un opérateur en poste de nuit", "Modérée", "H&S", "fatigue / vigilance"),
    ("Défaillance de frein sur camion benne", "Majeure", "H&S", "maintenance véhicule"),
    ("Presque-accident : charge suspendue", "Insignifiante", "H&S", "levage"),
]
IMMED_CAUSES = ["Absence de balisage de la zone", "EPI non porté ou inadapté", "Procédure non respectée",
    "Défaut de consignation", "Vitesse inadaptée", "Défaillance mécanique non détectée",
    "Éclairage insuffisant", "Communication radio défaillante"]
ROOT_CAUSES = ["Analyse de risque de la tâche non réalisée", "Formation insuffisante de l'opérateur",
    "Maintenance préventive non planifiée", "Supervision insuffisante sur le terrain",
    "Culture sécurité à renforcer", "Pression sur les délais de production",
    "Standard opératoire absent ou obsolète"]
HUMAN = ["Errors", "Fatigue", "Work overload", "Insufficient training", "Rule violation"]
TASK = ["Unsuitable tools or equipment", "Unclear procedure", "Time pressure"]
WORKING = ["Ineffective supervision", "Poor housekeeping", "Inadequate lighting"]
ORG = ["Poor safety culture", "Insufficient resources", "Weak risk assessment process"]
METHODS = ["ICAM", "5 Pourquoi", "Arbre des causes", "TapRooT", "Ishikawa (4M)"]
ACTIONS = [
    ("Renforcer le balisage et la signalisation de la zone", "ENGINEERING", "IMMEDIATE", "P1"),
    ("Réviser et rediffuser le mode opératoire sécurisé", "ADMINISTRATIVE", "CORRECTIVE", "P2"),
    ("Former les opérateurs au risque identifié", "ADMINISTRATIVE", "PREVENTIVE", "P2"),
    ("Installer une protection collective sur l'équipement", "ENGINEERING", "CORRECTIVE", "P1"),
    ("Mettre en place une inspection préalable quotidienne", "ADMINISTRATIVE", "PREVENTIVE", "P3"),
    ("Remplacer l'équipement défaillant", "SUBSTITUTION", "CORRECTIVE", "P1"),
    ("Doter le personnel des EPI adaptés et en contrôler le port", "PPE", "IMMEDIATE", "P2"),
    ("Supprimer la source de danger à la conception", "ELIMINATION", "CORRECTIVE", "P1"),
]
BODY_PARTS = ["Main", "Bras", "Jambe", "Tête", "Œil", "Dos", "Pied", "Thorax", "Multiple"]

# machine à états (fidèle au guard serveur)
def status_chain(final):
    order = ["PENDING", "REPORTED", "INVESTIGATION", "INVESTIGATION_COMPLETED", "CORRECTIVE_ACTIONS", "CLOSED"]
    if final == "REJECTED": return ["REPORTED", "REJECTED"]
    return order[1:order.index(final) + 1] if final in order else ["REPORTED"]

def band_of(name):
    n = (name or "").lower()
    for b in ["insignifiante", "mineure", "modérée", "moderee", "majeure", "catastrophique"]:
        if b in n: return {"moderee": "modérée"}.get(b, b)
    return "mineure"

OUTCOME_BY_BAND = {
    # FATALITY est réservé aux 6 incidents fatals DÉSIGNÉS (is_fatal) — jamais tiré
    # aléatoirement, sinon on dépasse le quota de 6 fatalités demandé.
    "catastrophique": ["LTI", "LTI"], "majeure": ["LTI", "RWC"],
    "modérée": ["RWC", "MTC"], "mineure": ["MTC", "FAC"], "insignifiante": ["FAC", "NEAR_MISS"],
}

def h(s): return f"<p>{s}</p>"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("target_env", nargs="?", default="aiven", choices=["aiven", "local"])
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--limit", type=int, default=0, help="max incidents par mine (prototype)")
    ap.add_argument("--target", type=int, default=235, help="incidents par mine")
    ap.add_argument("--mine", type=int, default=0, help="une seule mine")
    ap.add_argument("--cleanup", action="store_true", help="supprime les incidents générés (motif 9{mine})")
    args = ap.parse_args()
    conn = connect(args.target_env); cur = conn.cursor()
    mines = [args.mine] if args.mine else MINES

    if args.cleanup:
        return cleanup(conn, cur, mines, args.dry)

    per_mine = args.limit or args.target
    print(f"Cible: {args.target_env} · {per_mine} incidents/mine · mines {mines}{' · DRY' if args.dry else ''}")

    # bandes de sévérité -> ids
    cur.execute("SELECT id, name FROM severity_level")
    sev_by_band = {}
    for sid, sname in cur.fetchall():
        sev_by_band.setdefault(band_of(sname), []).append(sid)

    for mine in mines:
        gen_for_mine(conn, cur, mine, per_mine, sev_by_band, args.dry)

    if args.dry: conn.rollback(); print("\n=== DRY : rollback, rien écrit ===")
    else: conn.commit(); print("\n=== COMMIT OK ===")
    cur.close(); conn.close()


def harvest(cur, mine):
    """Pools d'ids RÉELS valides pour cette mine (depuis les incidents existants)."""
    P = {}
    for col in ["location_id", "work_area_id", "work_process_id", "department_id"]:
        cur.execute(f"SELECT DISTINCT {col} FROM incident WHERE company_id=%s AND {col} IS NOT NULL", (mine,))
        P[col] = [r[0] for r in cur.fetchall()]
    # paires (categorie, type) réellement utilisées
    cur.execute("""SELECT DISTINCT d.incident_category_id, d.incident_type_id
                   FROM incident_detail d JOIN incident i ON i.id=d.incident_id WHERE i.company_id=%s""", (mine,))
    P["cat_type"] = [(r[0], r[1]) for r in cur.fetchall() if r[0] and r[1]]
    # employés de la mine
    cur.execute("SELECT id, department_id FROM defaultdb.employee WHERE company_id=%s", (mine,))
    emps = cur.fetchall()
    P["emp_ids"] = [r[0] for r in emps] or [1]
    return P


def gen_for_mine(conn, cur, mine, n, sev_by_band, dry):
    P = harvest(cur, mine)
    if not P["location_id"] or not P["work_area_id"] or not P["work_process_id"] or not P["cat_type"]:
        print(f"  !! mine {mine} : pools de référence incomplets {[(k,len(v)) for k,v in P.items()]} — on saute")
        return
    created = skipped = 0
    # bande cible pour chaque incident (pyramide de Heinrich)
    bands = (["insignifiante"] * 34 + ["mineure"] * 34 + ["modérée"] * 20 + ["majeure"] * 9 + ["catastrophique"] * 3)
    for seq in range(1, n + 1):
        rng = random.Random(f"{mine}-{seq}")
        occ = datetime(START.year, START.month, START.day) + timedelta(
            days=rng.randint(0, (END - START).days), hours=rng.randint(5, 20), minutes=rng.randint(0, 59))
        year = occ.year
        number = f"INC-{year}-9{mine}{seq:04d}"
        cur.execute("SELECT id FROM incident WHERE number=%s", (number,))
        if cur.fetchone(): skipped += 1; continue

        is_fatal = seq in FATAL_SEQS.get(mine, set())
        band = "catastrophique" if is_fatal else rng.choice(bands)
        scen = rng.choice(SCENARIOS)
        cat_id, type_id = rng.choice(P["cat_type"])
        sev_id = rng.choice(sev_by_band.get(band) or sev_by_band.get("mineure"))
        # statut final : plus l'incident est ancien, plus il est clôturé
        age_days = (END - occ.date()).days
        if is_fatal: final = "CLOSED"
        elif rng.random() < 0.04: final = "REJECTED"
        else:
            r = rng.random()
            if age_days > 300: final = "CLOSED" if r < 0.9 else "CORRECTIVE_ACTIONS"
            elif age_days > 120: final = rng.choice(["CLOSED", "CLOSED", "CORRECTIVE_ACTIONS", "INVESTIGATION_COMPLETED"])
            elif age_days > 40: final = rng.choice(["CORRECTIVE_ACTIONS", "INVESTIGATION_COMPLETED", "INVESTIGATION", "CLOSED"])
            else: final = rng.choice(["PENDING", "REPORTED", "INVESTIGATION", "INVESTIGATION_COMPLETED"])
        chain = status_chain(final)
        investigated = any(s in chain for s in ["INVESTIGATION_COMPLETED", "CORRECTIVE_ACTIONS", "CLOSED"])
        has_capa = any(s in chain for s in ["CORRECTIVE_ACTIONS", "CLOSED"])

        loc = rng.choice(P["location_id"]); wa = rng.choice(P["work_area_id"])
        wp = rng.choice(P["work_process_id"]); dep = rng.choice(P["department_id"])
        reporter = rng.choice(P["emp_ids"]); owner = rng.choice(P["emp_ids"])
        hp = 1 if (is_fatal or band == "catastrophique" or (band == "insignifiante" and rng.random() < 0.15)) else None
        title = f"{scen[0]}"
        ca_created = datetime.combine(occ.date(), datetime.min.time())

        if dry:
            print(f"  [{number}] {occ.date()} {band:14} {final:22} inv={investigated} capa={has_capa} fatal={is_fatal} — {title}")
            created += 1
            continue

        # 1) incident
        cur.execute("""INSERT INTO incident
          (number,title,status,occurred_at,discovery_time,reporter_id,location_id,work_area_id,work_process_id,
           department_id,company_id,source,high_potential,ppe,weather_conditions,involved_persons,witnesses,
           created_at,updated_at)
          VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'EMPLOYEE',%s,%s,%s,%s,%s,%s,%s)""",
          (number, title, final, occ, occ + timedelta(minutes=rng.randint(2, 90)), reporter, loc, wa, wp, dep,
           mine, hp, "[helmet, gloves, boots]", "[1, 3]", "[]", "[]", ca_created, ca_created))
        iid = cur.lastrowid
        # 2) incident_detail
        cur.execute("""INSERT INTO incident_detail (incident_id,incident_category_id,incident_type_id,severity_level_id,
           affected_body_parts,containment_measures,environmental_impact,created_at,updated_at)
           VALUES (%s,%s,%s,%s,'[]','','',%s,%s)""", (iid, cat_id, type_id, sev_id, ca_created, ca_created))
        # 3) analyse
        if investigated:
            cur.execute("""INSERT INTO incident_analysis (incident_id,factual_description,immediate_causes,root_causes,
               contributing_factors,immediate_consequences,potential_consequences,immediate_actions,created_at,updated_at)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
               (iid, h(f"{scen[0]} lié au danger « {scen[3]} ». " + rng.choice(["Intervention des secours internes.", "Zone sécurisée immédiatement.", "Premiers soins prodigués sur place."])),
                h(rng.choice(IMMED_CAUSES)), h(rng.choice(ROOT_CAUSES)),
                h(rng.choice(IMMED_CAUSES) + " ; " + rng.choice(ROOT_CAUSES)),
                h("Conséquences maîtrisées." if band in ("insignifiante", "mineure") else "Arrêt de travail et prise en charge."),
                h("Potentiel d'aggravation élevé." if hp else "Potentiel limité."),
                h(rng.choice(["Arrêt des travaux", "Balisage de la zone", "Consignation de l'équipement"])),
                ca_created, ca_created))
        # 4) investigation
        if investigated:
            insts = "COMPLETED"
            cur.execute("""INSERT INTO incident_investigation (incident_id,method,start_date,end_date,team,
               human_causes,task_causes,working_causes,organization_causes,human_analysis,task_analysis,
               working_analysis,organization_analysis,report,progress,status,company_id,validated,evidence,created_at,updated_at)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,100,%s,%s,%s,'[]',%s,%s)""",
               (iid, rng.choice(METHODS), occ.date() + timedelta(days=2), occ.date() + timedelta(days=rng.randint(5, 20)),
                f"{reporter}:Lead Investigator,{owner}:Observer",
                "[" + ", ".join(rng.sample(HUMAN, 2)) + "]", "[" + rng.choice(TASK) + "]",
                "[" + rng.choice(WORKING) + "]", "[" + rng.choice(ORG) + "]",
                h("Analyse des facteurs humains réalisée."), h("Analyse des tâches réalisée."),
                h("Analyse des conditions de travail réalisée."), h("Analyse organisationnelle réalisée."),
                h("Rapport d'investigation validé par le comité HSE."), insts, mine,
                1 if final == "CLOSED" else None, ca_created, ca_created))
        # 5) CAPA (+ efficacité)
        if has_capa:
            for _ in range(rng.randint(1, 3)):
                a = rng.choice(ACTIONS)
                ca_status = "PENDING"; verdict = None; rp = rs = None; erb = era = ecom = None
                assigned = rng.choice(P["emp_ids"])
                if final == "CLOSED":
                    ca_status = "VERIFIED" if rng.random() < 0.8 else "COMPLETED"
                    if ca_status == "VERIFIED":
                        verdict = rng.choice(["EFFECTIVE", "EFFECTIVE", "PARTIALLY_EFFECTIVE"])
                        rp, rs = rng.randint(1, 2), rng.randint(1, 3)
                        # vérificateur != assigné (ségrégation)
                        erb = next((e for e in P["emp_ids"] if e != assigned), owner)
                        era = ca_created + timedelta(days=rng.randint(30, 90))
                        ecom = "Vérification d'efficacité : mesure jugée " + ("efficace." if verdict == "EFFECTIVE" else "partiellement efficace.")
                else:
                    ca_status = rng.choice(["PENDING", "IN_PROGRESS"])
                cur.execute("""INSERT INTO corrective_action
                   (action_name,description,deadline,status,progress,assigned_employee_id,owner_id,department_id,
                    incident_id,company_id,control_hierarchy,action_type,priority,
                    effectiveness_verdict,effectiveness_reviewed_by,effectiveness_reviewed_at,effectiveness_comment,
                    residual_probability,residual_severity,created_at,updated_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                   (a[0], h(a[0] + " afin de traiter la cause identifiée."),
                    occ.date() + timedelta(days=rng.randint(20, 120)), ca_status,
                    100 if ca_status in ("VERIFIED", "COMPLETED") else rng.choice([0, 30, 60]),
                    assigned, owner, dep, iid, mine, a[1], a[2], a[3],
                    verdict, erb, era, ecom, rp, rs, ca_created, ca_created))
        # 6) injury / issue
        outcome = None
        if is_fatal:
            outcome = "FATALITY"
        elif band == "insignifiante":
            outcome = "NEAR_MISS" if rng.random() < 0.6 else ("FAC" if rng.random() < 0.5 else None)
        elif rng.random() < 0.7:
            outcome = rng.choice(OUTCOME_BY_BAND[band])
        if outcome:
            lost = 0
            if outcome == "LTI": lost = rng.randint(1, 45)
            elif outcome == "FATALITY": lost = rng.randint(60, 220)
            cur.execute("""INSERT INTO incident_injury (incident_id,company_id,outcome,employee_id,person_name,
               nature_of_injury,body_part,lost_days,created_at,updated_at)
               VALUES (%s,%s,%s,%s,NULL,%s,%s,%s,%s,%s)""",
               (iid, mine, outcome, rng.choice(P["emp_ids"]),
                rng.choice(["Contusion", "Plaie", "Fracture", "Brûlure", "Entorse", "Traumatisme"]) if outcome not in ("NEAR_MISS",) else "N/A",
                rng.choice(BODY_PARTS), lost, ca_created, ca_created))
        # 7) history (machine à états)
        d = occ.date()
        comments = {"REPORTED": "Incident déclaré", "INVESTIGATION": "Investigation lancée",
                    "INVESTIGATION_COMPLETED": "Investigation terminée", "CORRECTIVE_ACTIONS": "Actions correctives engagées",
                    "CLOSED": "Incident clôturé", "REJECTED": "Déclaration rejetée (doublon)"}
        for st in chain:
            d = d + timedelta(days=rng.randint(1, 12))
            cur.execute("""INSERT INTO incident_history (incident_id,status,owner_id,date,comment,created_at)
               VALUES (%s,%s,%s,%s,%s,%s)""", (iid, st, owner, min(d, END), comments.get(st, st),
               datetime.combine(min(d, END), datetime.min.time())))
        created += 1
        if created % 40 == 0:
            conn.commit(); print(f"  mine {mine}: {created} créés…")
    print(f"  mine {mine}: {created} créés, {skipped} déjà présents (skip)")


def cleanup(conn, cur, mines, dry):
    total = 0
    for mine in mines:
        like = f"INC-____-9{mine}____"
        cur.execute("SELECT id FROM incident WHERE company_id=%s AND number LIKE %s", (mine, like))
        ids = [r[0] for r in cur.fetchall()]
        print(f"mine {mine}: {len(ids)} incidents générés à supprimer")
        total += len(ids)
        if not ids or dry: continue
        fmt = ",".join(["%s"] * len(ids))
        for t, fk in [("incident_injury", "incident_id"), ("corrective_action", "incident_id"),
                      ("incident_investigation", "incident_id"), ("incident_analysis", "incident_id"),
                      ("incident_detail", "incident_id"), ("incident_history", "incident_id"), ("incident", "id")]:
            cur.execute(f"DELETE FROM `{t}` WHERE {fk} IN ({fmt})", ids)
    if dry: conn.rollback(); print(f"DRY: {total} à supprimer (rien fait)")
    else: conn.commit(); print(f"Nettoyage OK: {total} incidents supprimés")
    cur.close(); conn.close()


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Seed de politiques SST (ISO 45001 §5.2) — 2 versions par mine.

Pour CHAQUE mine, insère :
  - une version 1 ARCHIVÉE (l'ancienne politique) ;
  - une version 2 PUBLIÉE (la politique en vigueur, signée, 6 engagements §5.2).
Ainsi le module n'est pas vide : chaque mine a une politique affichable ET un
historique de versions.

Idempotent : les politiques précédemment seedées (titre marqué) sont supprimées
avant réinsertion — les politiques créées à la main dans l'IHM ne sont PAS
touchées (on ne supprime que ce que ce script a posé).

Cibles (comme audit_mfa_accounts.py) :
  python scripts/seed_hs_policies.py            -> base LOCALE (healthsafety)
  python scripts/seed_hs_policies.py --prod     -> Aiven (schéma healthsafety)

Les mines sont lues dans HRMS (defaultdb.company) ; les politiques écrites dans
HNS (healthsafety). companyId n'est qu'un Long côté HNS (pas de FK locale).
"""
import re
import ssl
import sys
from datetime import date, datetime, timedelta

import pymysql

# Marqueur : permet une réexécution idempotente sans toucher aux saisies manuelles.
# Marqueur d'idempotence : le signataire « La Direction de <mine> » — jamais un
# vrai nom de dirigeant — identifie les politiques posées par ce script.
SEED_SIGNATORY_PREFIX = "La Direction de "

PREAMBLE = (
    "La direction de {mine} place la santé et la sécurité de chaque personne travaillant "
    "sur le site au cœur de ses décisions. Aucune production, aucun objectif ne justifie de "
    "mettre en danger un travailleur. Par la présente politique, la direction s'engage, alloue "
    "les moyens nécessaires et rend compte des résultats. Elle s'applique à l'ensemble du "
    "personnel, aux sous-traitants et aux visiteurs."
)

ARTICLES_V2 = [
    ("Des conditions de travail sûres et saines",
     "Nous nous engageons à fournir des conditions de travail sûres et saines afin de prévenir "
     "les traumatismes et les atteintes à la santé liés au travail.",
     "Concrètement : équipements protégés, postes ergonomiques, environnement maîtrisé (bruit, "
     "poussière, chaleur), et le droit de se retirer d'une situation de danger grave et imminent."),
    ("Le respect des exigences légales et autres",
     "Nous nous engageons à satisfaire aux exigences légales applicables et aux autres exigences "
     "auxquelles nous souscrivons en matière de santé et sécurité.",
     "Permis à jour, contrôles réglementaires réalisés dans les délais, formations obligatoires "
     "suivies, engagements clients et de groupe tenus."),
    ("L'élimination des dangers et la réduction des risques",
     "Nous nous engageons à éliminer les dangers et à réduire les risques SST en appliquant la "
     "hiérarchie des mesures de maîtrise.",
     "On cherche d'abord à supprimer le danger, puis à le remplacer, puis à l'isoler par "
     "l'ingénierie, avant les consignes et les EPI. L'EPI est la dernière barrière."),
    ("L'amélioration continue",
     "Nous nous engageons à améliorer en continu notre système de management de la santé et de "
     "la sécurité au travail.",
     "Chaque incident, presque-accident et audit nourrit des actions correctives dont on vérifie "
     "l'efficacité. On mesure, on apprend, on progresse."),
    ("La consultation et la participation des travailleurs",
     "Nous nous engageons à consulter les travailleurs et leurs représentants et à favoriser "
     "leur participation à tous les niveaux.",
     "Votre voix compte : signalez les dangers, proposez des améliorations, participez aux "
     "analyses. Personne ne connaît mieux les risques du terrain que ceux qui y travaillent."),
    ("Un cadre pour fixer nos objectifs SST",
     "Cette politique fournit le cadre dans lequel sont établis et revus nos objectifs de santé "
     "et de sécurité au travail.",
     "Nos objectifs annuels (réduction des accidents, taux de fréquence, actions préventives) "
     "découlent de ces engagements et sont revus en revue de direction."),
]

# Version 1 (archivée) : plus courte, l'ancienne mouture.
ARTICLES_V1 = [
    ("Sécurité de tous",
     "Nous nous engageons à assurer la sécurité de tout le personnel sur le site.",
     "Le premier devoir de l'entreprise est de protéger ceux qui y travaillent."),
    ("Respect de la réglementation",
     "Nous respectons la réglementation SST en vigueur.",
     "Permis, contrôles et formations tenus à jour."),
    ("Prévention des accidents",
     "Nous mettons en place les mesures nécessaires pour prévenir les accidents.",
     "Identifier, évaluer et maîtriser les risques avant qu'un accident ne survienne."),
    ("Amélioration de nos pratiques",
     "Nous cherchons à améliorer nos pratiques de sécurité.",
     "Chaque événement est une occasion d'apprendre et de corriger."),
]


def load_env(path="Backend/.env"):
    env = {}
    for line in open(path, encoding="utf-8", errors="ignore"):
        m = re.match(r"\s*([A-Z_]+)\s*=\s*'?([^'\r\n]*)'?", line)
        if m:
            env[m.group(1)] = m.group(2)
    return env


def connect(env, url_key, database, prod):
    if prod:
        m = re.search(r"//(?:([^:@/]+)(?::([^@/]+))?@)?([^:/]+):(\d+)/", env[url_key])
        host, port = m.group(3), int(m.group(4))
        user = m.group(1) or env["DB_USERNAME"]
        pwd = m.group(2) or env["DB_PASSWORD"]
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return pymysql.connect(host=host, port=port, user=user, password=pwd, database=database,
                               ssl=ctx, autocommit=True, connect_timeout=30)
    return pymysql.connect(host="localhost", port=3306, user=env["DB_USERNAME"],
                           password=env["DB_PASSWORD"], database=database, autocommit=True,
                           connect_timeout=30)


def insert_policy(cur, company_id, version, status, effective, signatory, title_suffix,
                  preamble, articles, signed_at):
    cur.execute(
        "INSERT INTO hs_policy (company_id, title, preamble, version, status, effective_date, "
        "signatory_name, signatory_title, signed_at, created_at, updated_at) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
        (company_id, f"Politique Santé & Sécurité au Travail{title_suffix}", preamble,
         version, status, effective, signatory, "Direction", signed_at,
         datetime.now(), datetime.now()))
    policy_id = cur.lastrowid
    for idx, (t, body, expl) in enumerate(articles):
        cur.execute(
            "INSERT INTO hs_policy_article (policy_id, company_id, order_index, title, body, explanation) "
            "VALUES (%s,%s,%s,%s,%s,%s)",
            (policy_id, company_id, idx, t, body, expl))
    return policy_id


def main():
    prod = "--prod" in sys.argv
    env = load_env()
    hr = connect(env, "DB_URL_AIVEN" if prod else "DB_URL", "defaultdb", prod)
    hcur = hr.cursor()
    hcur.execute("SELECT id, name FROM company ORDER BY id")
    mines = hcur.fetchall()
    hcur.close()
    hr.close()

    hs = connect(env, "DB_URL_HNS_AIVEN" if prod else "DB_URL_HNS", "healthsafety", prod)
    cur = hs.cursor()

    print(f"Cible : {'PROD Aiven' if prod else 'LOCALE'} — {len(mines)} mine(s)")
    for company_id, name in mines:
        # Idempotence : on retire uniquement les politiques seedées de cette mine.
        cur.execute("SELECT id FROM hs_policy WHERE company_id=%s AND signatory_name LIKE %s",
                    (company_id, SEED_SIGNATORY_PREFIX + "%"))
        seeded_ids = [r[0] for r in cur.fetchall()]
        if seeded_ids:
            fmt = ",".join(["%s"] * len(seeded_ids))
            cur.execute(f"DELETE FROM hs_policy_acknowledgement WHERE policy_id IN ({fmt})", seeded_ids)
            cur.execute(f"DELETE FROM hs_policy_article WHERE policy_id IN ({fmt})", seeded_ids)
            cur.execute(f"DELETE FROM hs_policy WHERE id IN ({fmt})", seeded_ids)

        signatory = f"La Direction de {name}"
        # v1 archivée (l'an dernier), v2 publiée (en vigueur).
        insert_policy(cur, company_id, 1, "ARCHIVED", date.today() - timedelta(days=400),
                      signatory, " (v1)", PREAMBLE.format(mine=name), ARTICLES_V1,
                      datetime.now() - timedelta(days=400))
        insert_policy(cur, company_id, 2, "PUBLISHED", date.today() - timedelta(days=20),
                      signatory, "", PREAMBLE.format(mine=name), ARTICLES_V2,
                      datetime.now() - timedelta(days=20))
        print(f"  {name} (id={company_id}) : v1 archivée + v2 publiée ({len(ARTICLES_V2)} engagements)")

    cur.close()
    hs.close()
    print("Seed terminé.")


if __name__ == "__main__":
    main()

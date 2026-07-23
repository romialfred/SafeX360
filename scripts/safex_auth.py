#!/usr/bin/env python3
"""Connexion SafeX pour les scripts d'automatisation — 2FA COMPRISE.

CONTEXTE
    Depuis la regle « 2FA obligatoire pour TOUS les comptes », plus aucun compte
    ne peut se connecter par API avec un simple couple login/mot de passe :
    /hrms/auth/login repond 428 et exige un second facteur. Les scripts qui
    faisaient un POST /auth/login puis reutilisaient le cookie sont donc casses.

    Ce module NE CONTOURNE PAS la 2FA : il la joue, exactement comme le ferait
    l'interface. Le compte d'automatisation est un compte normal, reellement
    enrole ; le script detient son secret TOTP et calcule le code a la volee.

CONFIGURATION (Backend/.env)
    SAFEX_AUTOMATION_LOGIN=...          login du compte d'automatisation
    SAFEX_AUTOMATION_PASSWORD=...       son mot de passe (definitif, pas temporaire)
    SAFEX_AUTOMATION_TOTP_SECRET=...    sa cle TOTP en base32

    Le secret TOTP vaut second facteur : il doit rester dans Backend/.env
    (non versionne) et ne servir QU'A un compte dedie a l'automatisation —
    jamais au compte d'un humain, dont le second facteur doit rester sur son
    telephone.

PREMIERE MISE EN PLACE
    1. Creer le compte d'automatisation depuis l'IHM d'administration.
    2. Renseigner login + mot de passe dans Backend/.env.
    3. Lancer `python scripts/safex_auth.py --enroll` : le script effectue la
       premiere connexion, pose le mot de passe definitif si necessaire, realise
       l'enrolement TOTP et AFFICHE UNE SEULE FOIS la cle a recopier dans
       SAFEX_AUTOMATION_TOTP_SECRET.

USAGE DANS UN SCRIPT
    from safex_auth import login_session
    s = login_session()          # requests.Session authentifiee (cookie jwt)
    s.get(f"{BASE}/hrms/company/getAll")
"""
import base64
import hashlib
import hmac
import os
import re
import struct
import sys
import time

import requests

BASE = os.environ.get("SAFEX_BASE_URL", "https://safex360.vercel.app")
ENV_PATH = os.environ.get("SAFEX_ENV_PATH", "Backend/.env")
# EN-TETE ORIGIN OBLIGATOIRE. La passerelle refuse (403, corps vide) toute requete
# sans Origin autorise — y compris depuis un client non-navigateur. Sans cet
# en-tete, un script echoue avec un 403 muet impossible a diagnostiquer.
# Origines admises : le domaine de l'application en production, http://localhost:5173
# et http://localhost:5174 en developpement.
ORIGIN = os.environ.get("SAFEX_ORIGIN", "https://safex360.vercel.app")


def load_env(path=ENV_PATH):
    env = {}
    try:
        for line in open(path, encoding="utf-8", errors="ignore"):
            m = re.match(r"\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*'?([^'\r\n]*)'?", line)
            if m:
                env[m.group(1)] = m.group(2)
    except FileNotFoundError:
        pass
    env.update({k: v for k, v in os.environ.items() if k.startswith("SAFEX_AUTOMATION")})
    return env


def totp_code(secret_b32, at=None):
    """Code TOTP RFC 6238 (SHA1, 6 chiffres, fenetre de 30 s) — meme algorithme
    que TotpService cote serveur."""
    key = base64.b32decode(secret_b32.strip().replace(" ", "") + "=" * (-len(secret_b32.strip()) % 8),
                           casefold=True)
    step = int((at or time.time()) // 30)
    digest = hmac.new(key, struct.pack(">Q", step), hashlib.sha1).digest()
    off = digest[-1] & 0x0F
    return "%06d" % ((struct.unpack(">I", digest[off:off + 4])[0] & 0x7FFFFFFF) % 1000000)


class AuthError(RuntimeError):
    pass


def _post(session, path, payload, base=None):
    # La base est parametrable : les scripts visent tantot la passerelle Render,
    # tantot le domaine Vercel (proxy same-origin). Le cookie de session est lie
    # au domaine appele — se connecter sur l'un et interroger l'autre ne marche pas.
    r = session.post((base or BASE) + path, json=payload, timeout=40)
    try:
        body = r.json()
    except ValueError:
        body = {}
    return r.status_code, body


def login_session(login=None, password=None, totp_secret=None, session=None, base=None):
    """Ouvre une session authentifiee et renvoie la requests.Session (cookie jwt).

    Gere les trois reponses possibles de /auth/login :
      200 -> deja authentifie (cas theorique : compte sans 2FA, n'existe plus)
      428 MFA_REQUIRED -> verification TOTP
      428 PASSWORD_CHANGE_REQUIRED / MFA_ENROLLMENT_REQUIRED -> le compte n'est
          pas pret : on echoue avec un message explicite plutot que d'enroler
          silencieusement (voir --enroll).
    """
    env = load_env()
    login = login or env.get("SAFEX_AUTOMATION_LOGIN")
    password = password or env.get("SAFEX_AUTOMATION_PASSWORD")
    totp_secret = totp_secret or env.get("SAFEX_AUTOMATION_TOTP_SECRET")
    if not login or not password:
        raise AuthError("SAFEX_AUTOMATION_LOGIN / SAFEX_AUTOMATION_PASSWORD absents de %s" % ENV_PATH)

    s = session or requests.Session()
    s.headers.setdefault("Origin", ORIGIN)
    st, body = _post(s, "/hrms/auth/login", {"login": login, "password": password}, base)
    if st == 200:
        return s
    if st == 401:
        raise AuthError("Identifiants refuses pour %s (HTTP 401)." % login)
    if st != 428:
        raise AuthError("Reponse inattendue du login : HTTP %s %s" % (st, str(body)[:200]))

    code = body.get("errorCode")
    if code == "PASSWORD_CHANGE_REQUIRED":
        raise AuthError("Le compte %s est en premiere connexion (mot de passe temporaire). "
                        "Lancez `python scripts/safex_auth.py --enroll`." % login)
    if code == "MFA_ENROLLMENT_REQUIRED":
        raise AuthError("Le compte %s n'est pas encore enrole en 2FA. "
                        "Lancez `python scripts/safex_auth.py --enroll`." % login)
    if code != "MFA_REQUIRED":
        raise AuthError("Login refuse : %s %s" % (code, body.get("errorMessage", "")))

    if not totp_secret:
        raise AuthError("SAFEX_AUTOMATION_TOTP_SECRET absent : impossible de repondre au second "
                        "facteur. Lancez `python scripts/safex_auth.py --enroll`.")
    # ANTI-REJEU : le serveur memorise le dernier pas TOTP accepte, donc un meme
    # code ne vaut qu'UNE fois. Deux connexions rapprochees (deux scripts a la
    # suite, une reprise apres erreur) tombent dans la meme fenetre de 30 s et la
    # seconde est refusee — echec deroutant en apparence. On attend alors la
    # fenetre suivante et on recommence une connexion complete : le challenge
    # precedent a compte un echec, il faut en obtenir un neuf.
    for attempt in (1, 2):
        st, body = _post(s, "/hrms/auth/mfa/verify",
                         {"challenge": body.get("challenge"), "code": totp_code(totp_secret)}, base)
        if st == 200:
            return s
        replayed = isinstance(body, dict) and body.get("errorCode") == "MFA_CODE_INVALID_OR_REPLAYED"
        if not (replayed and attempt == 1):
            raise AuthError("Verification TOTP refusee : HTTP %s %s — code deja utilise, ou horloge "
                            "du poste desynchronisee." % (st, str(body)[:200]))
        time.sleep(31 - (time.time() % 30))
        st, body = _post(s, "/hrms/auth/login", {"login": login, "password": password}, base)
        if st != 428 or body.get("errorCode") != "MFA_REQUIRED":
            raise AuthError("Nouvelle tentative de connexion refusee : HTTP %s %s" % (st, str(body)[:200]))
    return s


def enroll():
    """Prepare le compte d'automatisation : mot de passe definitif si besoin, puis
    enrolement TOTP. Affiche la cle a recopier dans Backend/.env."""
    env = load_env()
    login = env.get("SAFEX_AUTOMATION_LOGIN")
    password = env.get("SAFEX_AUTOMATION_PASSWORD")
    if not login or not password:
        raise AuthError("SAFEX_AUTOMATION_LOGIN / SAFEX_AUTOMATION_PASSWORD absents de %s" % ENV_PATH)

    s = requests.Session()
    s.headers.setdefault("Origin", ORIGIN)
    st, body = _post(s, "/hrms/auth/login", {"login": login,
                                             "password": env.get("SAFEX_AUTOMATION_TEMP_PASSWORD") or password})
    if st == 200:
        print("Ce compte est deja connecte sans second facteur — rien a faire.")
        return
    if st != 428:
        raise AuthError("Login refuse : HTTP %s %s" % (st, str(body)[:200]))

    if body.get("errorCode") == "PASSWORD_CHANGE_REQUIRED":
        print("→ Premiere connexion : pose du mot de passe definitif…")
        st, body = _post(s, "/hrms/auth/first-login/password",
                         {"challenge": body.get("challenge"), "newPassword": password})
        if st not in (200, 428):
            raise AuthError("Changement du mot de passe refuse : HTTP %s %s" % (st, str(body)[:200]))
        if st == 200:
            print("Compte pret (aucune 2FA demandee).")
            return

    if body.get("errorCode") != "MFA_ENROLLMENT_REQUIRED":
        print("Ce compte est deja enrole (%s). Si la cle TOTP est perdue, demandez a un "
              "administrateur : POST /admin/users/{id}/mfa/reset." % body.get("errorCode"))
        return

    challenge = body.get("challenge")
    st, body = _post(s, "/hrms/auth/mfa/enroll/start", {"challenge": challenge})
    if st != 200:
        raise AuthError("Demarrage de l'enrolement refuse : HTTP %s %s" % (st, str(body)[:200]))
    secret = body.get("manualKey")

    st, body = _post(s, "/hrms/auth/mfa/enroll/confirm",
                     {"challenge": challenge, "code": totp_code(secret)})
    if st != 200:
        raise AuthError("Confirmation de l'enrolement refusee : HTTP %s %s" % (st, str(body)[:200]))

    print("\n=== Enrolement reussi — a recopier dans %s (une seule fois) ===" % ENV_PATH)
    print("SAFEX_AUTOMATION_TOTP_SECRET=%s" % secret)
    codes = body.get("recoveryCodes") or []
    if codes:
        print("\nCodes de recuperation (a conserver hors du depot) :")
        for c in codes:
            print("  %s" % c)


if __name__ == "__main__":
    try:
        if "--enroll" in sys.argv:
            enroll()
        else:
            login_session()
            print("Connexion reussie (2FA validee) — le compte d'automatisation est operationnel.")
    except AuthError as e:
        raise SystemExit("ECHEC : %s" % e)

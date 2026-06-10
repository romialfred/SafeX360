"""
db_env — connexion MySQL Aiven pour les scripts de seed/migration SafeX.

Lit les identifiants depuis Backend/.env : JAMAIS de credentials en dur dans
ces scripts, le depot GitHub est public. Les valeurs du .env sont entourees
de quotes simples ; l'hote et le port sont extraits de DB_URL_HNS.

Schemas :
    'healthsafety' -> service Health-Safety (inspections, dosimetrie, blast, HSE)
    'defaultdb'    -> MineXpert HRMS (employes, comptes)

Usage :
    from db_env import connect
    conn = connect('healthsafety')
"""
import pathlib
import re
import ssl

import pymysql

_ENV_PATH = pathlib.Path(__file__).resolve().parent / 'Backend' / '.env'


def _env(name):
    text = _ENV_PATH.read_text(encoding='utf-8')
    m = re.search(rf"^{name}\s*=\s*(.+)$", text, re.M)
    if not m:
        raise SystemExit(f"Variable {name} absente de {_ENV_PATH}")
    return m.group(1).strip().strip("'\"")


def connect(database, **kwargs):
    """Connexion pymysql au schema demande, credentials depuis Backend/.env."""
    url = _env('DB_URL_HNS')
    m = re.search(r"://(?:[^@/]+@)?([^:/]+):(\d+)/", url)
    if not m:
        raise SystemExit(f"Impossible d'extraire hote/port de DB_URL_HNS : {url}")
    host, port = m.group(1), int(m.group(2))

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    options = dict(connect_timeout=15, autocommit=False)
    options.update(kwargs)
    return pymysql.connect(
        host=host, port=port,
        user=_env('DB_USERNAME'), password=_env('DB_PASSWORD'),
        database=database, ssl=ctx, **options,
    )

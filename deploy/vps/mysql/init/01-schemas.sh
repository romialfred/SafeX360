#!/bin/bash
# Premier démarrage de safex-db (volume vide) uniquement.
#
# Crée les deux schémas de SafeX et donne à l'utilisateur applicatif
# (MYSQL_USER) les droits sur les deux : HNS lit aussi defaultdb (roster HRMS).
set -eo pipefail

mysql --protocol=socket -uroot -p"$MYSQL_ROOT_PASSWORD" <<SQL
CREATE DATABASE IF NOT EXISTS defaultdb CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE IF NOT EXISTS healthsafety CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
GRANT ALL PRIVILEGES ON defaultdb.* TO '$MYSQL_USER'@'%';
GRANT ALL PRIVILEGES ON healthsafety.* TO '$MYSQL_USER'@'%';
FLUSH PRIVILEGES;
SQL

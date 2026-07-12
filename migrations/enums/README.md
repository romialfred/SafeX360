# Migration enums ORDINAL → STRING

## Contexte
~60 colonnes (38 HNS + 22 HRMS) persistaient un enum en **ORDINAL** (tinyint) faute
d'annotation `@Enumerated`. Fragile : réordonner/insérer une valeur d'enum corrompt
silencieusement les données. Cette migration passe tout en STRING.

## Piège majeur (résolu par le script)
Hibernate a créé des contraintes `CHECK (col between 0 and N)` sur ces colonnes.
MySQL 8.0.16+ les **applique** → impossible d'y écrire un libellé texte tant qu'elles
existent. Leurs noms sont auto-générés et **diffèrent entre local et Aiven**. Le script
`apply_enum_migration.py` les découvre et les droppe dynamiquement.

## Séquençage OBLIGATOIRE (sinon prod cassée)
Le code annoté `@Enumerated(STRING)` ne peut lire les données qu'**après** leur conversion.
Ordre impératif, en fenêtre de maintenance :

1. **Sauvegarde** de la base cible (Aiven).
2. `--dry-run` pour visualiser : `python apply_enum_migration.py --service hns --url "$DB_URL_HNS_AIVEN" --user <u> --password <p> --dry-run`
3. Appliquer (sans `--dry-run`) sur **HNS** puis **HRMS**.
4. **Seulement ensuite** : merger la branche `chore/enum-ordinal-to-string` dans `main`
   et laisser Render redéployer HNS + MineXpert.
5. Vider le cache L2 / redémarrer les services (statuts @Cacheable).

## État
- **HNS (38 colonnes)** : code annoté + migration **validés en local** (JPA initialisé
  sans erreur de données). Prêt.
- **HRMS (22 colonnes)** : mapping présent dans le script, **à vérifier contre `defaultdb`**
  (noms de tables) et à annoter côté entités avant application. Voir la liste `HRMS` du script.

## Idempotent
Rejouable sans risque : ne convertit que les colonnes encore numériques.

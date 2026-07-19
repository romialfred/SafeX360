# Fixtures dosimétriques

Ce répertoire appartient exclusivement aux ressources de test Maven et n'est pas embarqué dans l'artefact de production.

- `dosimetry_demo_v1.sql` est la fixture canonique : valeurs fixes, identités synthétiques `990001/990002`, mine fictive `990001`, date de référence fixe et marqueur de provenance `DATASET_SAFEX_DOSIMETRY_V1`.
- `legacy/` conserve les quatre anciens scripts à des fins d'analyse historique. Ils ne doivent plus être exécutés : ils utilisent des dates relatives et, pour V006, des valeurs aléatoires.
- L'exécution de la fixture canonique est manuelle, uniquement après le schéma V003, sur une base DEV/QA/DEMO dédiée.
- Aucun jeu de démonstration ne doit être chargé dans une base contenant des personnes ou des mesures réelles.

Cette séparation évite qu'un script de démonstration soit découvert comme migration de production tout en conservant la traçabilité des anciennes données.

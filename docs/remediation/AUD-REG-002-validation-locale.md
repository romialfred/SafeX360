# AUD-REG-002 — validation locale résiduelle des limites dosimétriques

## Décision implémentée

SafeX distingue désormais :

- `classificationThreshold` : seuil administratif de classification ; pour `WORKER_B`, la donnée historique de 6 mSv est conservée ici ;
- `regulatoryLimit` : limite réglementaire applicable, utilisée par les agrégations, rapports, alertes et interfaces uniquement lorsqu’une valeur active est configurée pour la mine ou globalement.

Le système ne substitue pas automatiquement 20 mSv à 6 mSv. En l’absence de limite active applicable, il affiche « Limite non configurée — à valider localement » et ne calcule aucun pourcentage de consommation de limite.

La limite de 6 mSv reste autorisée comme `regulatoryLimit` pour `APPRENTICE` uniquement.

## Validation externe restant obligatoire

Avant de renseigner ou d’activer une limite réglementaire locale, l’organisation doit obtenir et archiver une validation conjointe couvrant au minimum :

1. PCR/RPO : catégories de travailleurs, grandeurs Hp(10)/Hp(0,07)/Hp(3), période de référence et règles opérationnelles ;
2. médecin du travail : cohérence avec la surveillance médicale et les populations particulières ;
3. juriste ou responsable conformité local : texte légal applicable, juridiction, date d’effet, dérogations et hiérarchie des normes ;
4. propriétaire HSE de la mine : approbation finale, date de révision et responsable du maintien à jour.

## Preuves minimales à conserver

- référence et version du texte réglementaire applicable ;
- compte rendu signé ou approbation électronique des quatre fonctions ci-dessus ;
- valeur, unité, grandeur, catégorie, mine concernée et date d’effet ;
- justification de toute valeur locale différente du seuil global ;
- résultat des tests de non-régression et trace de l’activation dans SafeX.

Cette validation métier et juridique reste hors du périmètre du correctif logiciel et constitue une condition préalable à l’activation d’une nouvelle limite.


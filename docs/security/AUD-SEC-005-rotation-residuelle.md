# AUD-SEC-005 — Résiduel de rotation externe

## Portée de cette remédiation

Cette livraison retire les identifiants et secrets actifs des fichiers suivis,
supprime les fallbacks applicatifs et ajoute un contrôle CI bloquant. Elle ne
réécrit pas l'historique Git et ne réalise aucune opération sur les plateformes
d'hébergement, les bases d'identités ou les coffres de secrets.

## Actions externes encore obligatoires

1. Révoquer puis renouveler les mots de passe des comptes administrateurs qui
   ont été utilisés par les scripts de maintenance concernés.
2. Renouveler `INTERNAL_GATEWAY_SECRET` de manière coordonnée sur Gateway,
   HRMS et Health-Safety, puis redémarrer les trois services.
3. Remplacer toute valeur de démonstration éventuellement déployée par une
   valeur distincte, limitée aux profils `dev`/`test`, ou désactiver le mode
   démonstration.
4. Invalider les sessions ou jetons dérivés des identifiants concernés lorsque
   le fournisseur d'identité le permet.

## Preuves de clôture attendues

- identifiant du ticket de rotation et approbateur ;
- date/heure de révocation et de redéploiement, sans valeur secrète ;
- preuve que l'ancienne valeur est refusée et que la nouvelle est acceptée ;
- résultat du scan `python scripts/security/scan_tracked_secrets.py --root .` ;
- confirmation que les secrets sont désormais injectés depuis le gestionnaire
  de secrets de chaque environnement.

Tant que ces preuves ne sont pas réunies, le volet « exposition historique et
rotation externe » d'AUD-SEC-005 reste ouvert, même si la correction locale est
validée.

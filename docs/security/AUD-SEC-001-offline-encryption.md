# AUD-SEC-001 — Protection des données sensibles hors ligne

**Statut technique local :** implémenté et soumis à validation avant déploiement  
**Périmètre :** frontend web/Capacitor SafeX  
**Objet :** chiffrement, cloisonnement inter-comptes, migration et non-rémanence des données IndexedDB

## 1. Décision de sécurité

Les payloads sensibles sont chiffrés avant leur écriture dans IndexedDB avec WebCrypto **AES-256-GCM**. Chaque couple `(compte, mine)` possède une clé logique distincte. La clé est créée avec `extractable = false`, puis conservée comme objet `CryptoKey` dans une base IndexedDB séparée (`safex-offline-keyring`).

Cette implémentation ne prétend pas fournir une clé liée au matériel. Un navigateur ou la WebView Capacitor peut conserver un `CryptoKey` non extractible sans démontrer son stockage dans Android Keystore, StrongBox, Secure Enclave ou un TEE.

En l'absence de WebCrypto, d'IndexedDB, d'identité ou de mine active valide, l'écriture sensible échoue explicitement. Aucun mécanisme de repli ne persiste de donnée en clair.

## 2. Couverture appliquée

| Stockage | Données chiffrées | Métadonnées minimales visibles | Version de migration |
|---|---|---|---|
| `safex360-field/mutationQueue` | payload et en-têtes | identifiant, endpoint, méthode, état, dates, type, partition | v3 |
| `safex360-field/*Cache` | payload de cache | identifiant logique partitionné, TTL, date, partition | v3 |
| `safex360-field/photoQueue` | contenu du Blob | identifiant, taille, état, dates, partition | v3 |
| `safex_dosimetry_offline/queued_doses` | `DoseRecordDTO` | identifiant, état, tentatives, dates, partition | v4 |
| `safex_dosimetry_offline/queued_measurements` | `AmbientMeasurementDTO` | identifiant, état, tentatives, dates, partition | v4 |
| `safex-emergency/pending_sos` | payload, acteur et dernière erreur | identifiant, état, tentatives, dates, partition | v2 |
| `safex-emergency-checkin/pending_checkin` | employé, statut, point de rassemblement, position GPS, note, acteur et erreur | identifiant, tentatives, date, partition | v2 |

Le cache `userProfileCache` reste désactivé et purgé. Le store historique `synced_doses` n'est plus alimenté ; les copies locales sont supprimées après acquittement serveur.

## 3. Propriétés cryptographiques et anti-rejeu

- Algorithme : AES-GCM, clé 256 bits, tag d'authentification 128 bits.
- IV : 96 bits aléatoires et nouveaux à chaque chiffrement.
- Identifiant de clé : empreinte SHA-256 de la partition `(compte, mine)` avec séparation de domaine.
- Données authentifiées additionnelles (AAD) : version, identifiant de clé, finalité du stockage et identifiant cryptographique unique de l'entrée.
- La lecture avec un autre compte ou une autre mine est rejetée avant déchiffrement.
- La copie d'un ciphertext sous un autre identifiant ou une autre finalité échoue à l'authentification GCM.
- Les mises à jour et suppressions relisent l'entrée stockée et vérifient sa partition avant mutation.
- Le rejeu vérifie à nouveau le compte actif avant l'appel réseau puis avant la suppression locale.

## 4. Migration et non-rémanence

Les schémas antérieurs contenaient des payloads en clair et ne permettaient pas toujours de prouver leur propriétaire. Les mises à niveau purgent donc les entrées legacy plutôt que de les attribuer silencieusement au compte actif. Cette purge entraîne une perte unique des travaux hors ligne créés par les anciennes versions ; elle est nécessaire pour fermer la fuite inter-comptes sans hypothèse d'identité non démontrable.

Un logout ou une expiration de session conserve, par défaut, les travaux non synchronisés sous forme chiffrée pour préserver le mode hors ligne. Une purge explicitement demandée :

1. supprime uniquement les données du compte et de la mine actifs ;
2. vérifie que toutes les files concernées ont pu être purgées ;
3. détruit ensuite la clé de cette partition.

Si une purge de file échoue, la clé est conservée afin de ne pas rendre les données restantes définitivement illisibles. Si l'utilisateur efface les données du navigateur ou si la clé est perdue, les ciphertexts deviennent irrécupérables.

## 5. Menaces traitées et risque résiduel

| Menace | Mesure | Risque résiduel |
|---|---|---|
| Lecture d'une file du compte A par le compte B | partition stricte et clé distincte | faible dans le modèle applicatif |
| Mutation/suppression croisée | vérification propriétaire avant écriture | faible dans le modèle applicatif |
| Altération ou déplacement d'un ciphertext | tag GCM et AAD | faible |
| Inspection directe d'IndexedDB ou sauvegarde logique | payloads chiffrés, clé non extractible | moyen : la clé reste utilisable depuis l'origine autorisée |
| XSS, extension malveillante ou WebView compromise pendant une session | aucune extraction brute de clé | élevé : le code hostile de même origine peut invoquer WebCrypto et demander le déchiffrement |
| Vol d'un terminal déverrouillé | chiffrement local | moyen à élevé selon le verrouillage du terminal et la persistance de session |
| Changement de compte pendant un POST | contrôles avant/après envoi | moyen : le serveur doit aussi garantir l'idempotence pour éviter un doublon après réponse réseau ambiguë |

Les métadonnées nécessaires au fonctionnement — timestamps, tailles, états, nombre de tentatives et, pour les mutations terrain, endpoint/méthode — ne sont pas chiffrées. Elles ne doivent contenir ni nom, ni identifiant médical, ni token, ni donnée GPS.

## 6. Ruptures et contraintes opérationnelles

- **Migration destructive unique :** les anciennes files en clair sont purgées lors du premier démarrage avec les nouveaux schémas.
- **Mode hors ligne fail-closed :** un navigateur sans WebCrypto/IndexedDB ne peut plus enregistrer une saisie sensible hors ligne. L'interface appelante doit afficher l'échec et les canaux d'urgence alternatifs pour un SOS.
- **Photos :** le chiffrement charge le Blob en mémoire et son encodage base64 augmente l'espace occupé d'environ un tiers. Une validation sur appareils bas de gamme avec la taille photo maximale est requise.
- **Multi-onglets :** la création concurrente d'une clé réutilise la clé persistée gagnante ; aucune clé concurrente silencieuse n'est acceptée.

## 7. Actions obligatoires avant clôture conformité

1. Réaliser une AIPD/DPIA couvrant dosimétrie, santé, géolocalisation d'urgence, finalités, base légale, durées de conservation, droits des personnes et gestion d'un terminal perdu.
2. Pour une assurance matériellement liée sur mobile, implémenter une enveloppe de clé via un plugin Capacitor audité utilisant Android Keystore/StrongBox et iOS Keychain/Secure Enclave, avec preuve de niveau matériel et stratégie de rotation/récupération.
3. Appliquer une CSP stricte, éliminer les injections DOM et maintenir des tests XSS : le chiffrement au repos ne protège pas d'un script de même origine.
4. Valider l'idempotence serveur de chaque POST hors ligne, notamment SOS, check-in et dosimétrie.
5. Exécuter les essais sur Chrome/Edge/Android WebView/iOS WKWebView ciblés : migration, quota plein, clé perdue, appareil verrouillé, changement de compte et photo maximale.
6. Faire approuver la perte des files legacy avant diffusion et communiquer la fenêtre de migration aux utilisateurs terrain.

## 8. Traçabilité des preuves

- Implémentation cryptographique : `Frontend/src/security/offlineVault.ts`
- Tests négatifs cryptographiques : `Frontend/src/security/offlineVault.test.ts`
- Test de minimisation/migrations : `Frontend/src/security/sensitiveOfflineMinimization.test.ts`
- Test de purge coordonnée et non-rémanence : `Frontend/src/security/purgeLocalSecurityState.test.ts`
- Intégrations : `Frontend/src/m/offline/db.ts`, `Frontend/src/services/DosimetryOfflineService.ts`, `Frontend/src/utility/OfflineSosQueue.ts`, `Frontend/src/utility/OfflineCheckInQueue.ts`

Cette mesure réduit le constat AUD-SEC-001 mais ne constitue ni une certification ISO 45001, ni une preuve autonome de conformité réglementaire. La clôture doit inclure validation fonctionnelle terrain, revue sécurité indépendante et traitement documenté des risques résiduels.

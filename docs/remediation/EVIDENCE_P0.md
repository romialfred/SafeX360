# Preuves de remédiation — priorité P0

## AUD-SEC-005 — Secrets de démonstration

- Les comptes de démonstration sont désormais synthétiques, limités aux profils développement/test et utilisent le domaine réservé `example.invalid`.
- Le mot de passe de démonstration n'a plus de valeur de repli dans le dépôt : il doit être injecté par l'environnement autorisé.
- Les appels interservices échouent en l'absence de secret configuré au lieu d'accepter une valeur par défaut.
- Le scan bloquant ne détecte aucun secret dans l'état suivi courant ; tests Python 5/5 et Java 4/4 réussis.

Résiduel externe : les anciennes valeurs éventuellement exposées doivent être révoquées/rotées dans les environnements et l'historique Git doit faire l'objet d'une décision du propriétaire du dépôt.

## AUD-SAF-001 — intégrité du tir confirmé

État local : **en validation**.

Contrôles appliqués :

- édition directe limitée aux statuts `DRAFT` et `PLANNED` ;
- modification d'un tir `CONFIRMED` réservée à une autorité serveur `BLAST_ADMIN` vérifiée ;
- motif et version optimiste obligatoires ;
- retour automatique à `PLANNED`, annulation des notifications existantes et nouvelle confirmation obligatoire ;
- refus d'édition directe pour `POSTPONED`, `IMMINENT`, `FIRED`, `MISFIRE`, `ALL_CLEAR` et `CANCELLED` ;
- transition `CONFIRMED -> PLANNED` inscrite dans l'audit métier.

Validation exécutée le 19 juillet 2026 sous Java 17 :

```text
Backend/Health-Safety
./mvnw.cmd -q -Dtest=BlastServiceTest,BlastControllerTest test
Résultat : succès (code 0)
```

La clôture définitive reste conditionnée à la validation du responsable dynamitage sur la règle métier et à la qualification globale de non-régression.

## AUD-GOV-001 — allégations publiques

État local : **en validation**.

- Les formulations de certification/conformité et les résultats non démontrés ont été neutralisés dans la vitrine, les pages publiques et les métadonnées.
- Les badges décrivent désormais des référentiels pris en compte et précisent qu'ils ne constituent pas une attestation tierce.
- Les témoignages attribués et le calculateur de ROI non sourcé ne sont plus diffusés.
- Le garde-fou scanne le DOM rendu et les sources publiques afin d'empêcher la réactivation de ces allégations.

```text
Vitest PublicClaimsPolicy : 4 tests réussis
Recherche résiduelle ciblée : aucune allégation interdite
```

Une revue juridique/qualité signée reste une preuve organisationnelle externe.

## AUD-SEC-002 — WebSocket/STOMP

État local : **en validation**.

- Le cookie JWT HttpOnly est vérifié cryptographiquement au handshake, y compris son expiration.
- L'identité, le rôle et le périmètre de mines sont dérivés des claims signés.
- `SEND` client est interdit ; les destinations inconnues et globales sont refusées.
- `SUBSCRIBE` vérifie le rôle et la mine ; le client n'utilise plus les canaux globaux de tir.

```text
Backend/Health-Safety
./mvnw.cmd -q -Dtest=StompSecurityInterceptorTest,EmergencyWebSocketHandshakeInterceptorTest test
Résultat : succès (code 0)
```

## AUD-SEC-006 — cache PWA authentifié

État local : **en validation**.

- La stratégie Workbox générique pour les GET `/hns/*` et `/api/*` est supprimée.
- Une purge best-effort des lectures locales et de CacheStorage est exécutée au logout et avant la redirection d'une session expirée.
- Les mutations/SOS non synchronisés sont préservés par défaut pour éviter une perte terrain silencieuse.
- Les règles Android désactivant backup et transfert sont rendues reproductibles après chaque `cap sync` par un script versionné.

```text
Vitest sécurité : 9 tests réussis
Build frontend TypeScript + Vite/PWA : succès
Contrôle du service worker généré : aucun cache API générique
```

`AUD-SEC-001` reste en traitement : le chiffrement matériel et le partitionnement multi-compte des files non synchronisées ne sont pas encore démontrés.

## AUD-OPS-001 — disponibilité et preuve de livraison SOS

État local : **en traitement — résiduel d'hébergement externe**.

- Les états `QUEUED`, `RECEIVED`, `ACKNOWLEDGED` et `FAILED` ont des libellés et couleurs distincts.
- Une réception HTTP n'est plus présentée comme une prise en charge humaine.
- Les interfaces affichent les canaux dégradés du plan d'urgence tant qu'aucun acquittement n'est démontré.
- Les identifiants de démonstration `mine=1` et `utilisateur=14` ne sont plus substitués à une session incomplète.
- Une clé `clientRequestId` et un index unique rendent les rejeux SOS idempotents.
- La file web ne supprime plus silencieusement l'alerte la plus ancienne lorsqu'elle est saturée.
- La sonde GitHub échoue sur timeout, réponse non-2xx, statut Actuator différent de `UP` ou latence supérieure à dix secondes.

```text
Vitest SosDeliveryState + sécurité : 5 tests réussis
Maven SosAlertServiceTest : succès (code 0)
Garde statique du workflow de disponibilité : succès
```

Le runbook reproductible est `docs/remediation/SOS_AVAILABILITY_RUNBOOK.md`. La clôture du constat critique nécessite encore un hébergement sans veille, couvert par des objectifs de disponibilité, RTO/RPO et une astreinte approuvés.

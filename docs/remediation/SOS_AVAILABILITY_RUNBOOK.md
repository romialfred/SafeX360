# Runbook de disponibilité SOS SafeX

## Portée

Ce runbook couvre la chaîne technique de réception d'un SOS. SafeX ne doit
jamais être présenté comme l'unique moyen d'alerte d'un site industriel.

## États communiqués à l'émetteur

| État | Preuve disponible | Consigne |
|---|---|---|
| `QUEUED` | Enregistrement local uniquement | Utiliser immédiatement radio, téléphone ou alarme locale |
| `RECEIVED` | Identifiant et horodatage produits par le serveur | Attendre l'acquittement tout en appliquant le plan d'urgence du site |
| `ACKNOWLEDGED` | Transition serveur horodatée et coordinateur affecté | Suivre les instructions du coordinateur |
| `FAILED` | Aucune preuve de réception ni de mise en file | Déclencher sans délai les canaux alternatifs du site |

Chaque envoi porte une clé `clientRequestId` unique. Le serveur renvoie le même
SOS lors d'un rejeu avec la même clé, afin de limiter les doublons après une
coupure réseau.

## Sondes et traitement d'une alerte

Le workflow `SafeX availability probe` vérifie toutes les dix minutes les
services Gateway, Health-Safety, MineXpert et Eureka. Il échoue lorsque :

- la connexion ou la réponse dépasse les délais définis ;
- le statut HTTP n'est pas `2xx` ;
- un endpoint Actuator ne renvoie pas `UP` ;
- la durée totale excède dix secondes.

À réception d'une alerte :

1. qualifier l'incident et tester le parcours SOS depuis un compte de test ;
2. basculer la communication opérationnelle vers les canaux du site ;
3. rétablir le service puis vérifier création, acquittement et diffusion ;
4. ouvrir une analyse d'incident avec chronologie et actions préventives.

## Condition externe restant à satisfaire

La clôture complète d'`AUD-OPS-001` exige un hébergement sans mise en veille,
dimensionné pour les pics, supervisé en continu et couvert par des objectifs de
service approuvés (disponibilité, temps de réponse, RTO et RPO). Le workflow
GitHub détecte certaines pannes mais ne fournit pas cette garantie.


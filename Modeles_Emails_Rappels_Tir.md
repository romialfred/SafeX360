# Modèles d'e-mails — Rappels de tir / Blast reminders
### Module « Gestion des Dynamitages » — versions bilingues, prêtes à l'emploi

Ces modèles sont volontairement courts et factuels. Chaque rappel existe en **français** et en **anglais** : l'e-mail part dans la **langue préférée du destinataire**, ou en version bilingue à défaut. Le corps est en texte simple (lisible partout) ; il peut être habillé en HTML sans en changer le contenu.

## Variables disponibles

| Variable | Exemple |
|---|---|
| `{{blast_reference}}` | BLT-2026-0142 |
| `{{zone}}` | Fosse Nord — Gradin 1080 |
| `{{date}}` | 18/06/2026 |
| `{{time}}` | 14:00 |
| `{{exclusion_radius}}` | 500 m |
| `{{assembly_points}}` | R-Nord-1, R-Nord-2 |
| `{{blaster}}` | K. Ouédraogo |
| `{{control_room}}` | Salle de contrôle — poste 4500 |
| `{{site}}` | Mine de [Site] |

> Règle d'écriture : pas d'emoji, pas de point d'exclamation, pas de formule d'enthousiasme. On annonce, on situe, on dit quoi faire.

---

## 1. Rappel 24 heures avant — Tir prévu demain

**Objet (FR) :** Tir prévu demain — {{zone}}, {{date}} à {{time}}
**Subject (EN):** Blast scheduled tomorrow — {{zone}}, {{date}} at {{time}}

**Corps — Français**
```
Bonjour,

Un tir de mine est prévu demain {{date}} à {{time}} sur {{zone}}.

Référence : {{blast_reference}}
Périmètre d'exclusion : {{exclusion_radius}} autour de la zone
Points de rassemblement : {{assembly_points}}
Boutefeu responsable : {{blaster}}

Merci de planifier vos activités en conséquence et de libérer la zone
avant l'heure du tir. Aucun accès ne sera autorisé dans le périmètre
d'exclusion à l'approche du tir.

Vous recevrez d'autres rappels le jour du tir.

Pour toute question : {{control_room}}.

{{site}} — Service HSE
```

**Body — English**
```
Hello,

A blast is scheduled tomorrow, {{date}} at {{time}}, at {{zone}}.

Reference: {{blast_reference}}
Exclusion zone: {{exclusion_radius}} around the area
Assembly points: {{assembly_points}}
Shotfirer in charge: {{blaster}}

Please plan your activities accordingly and clear the area before the
blast time. No access will be permitted within the exclusion zone as the
blast approaches.

Further reminders will follow on the day of the blast.

Questions: {{control_room}}.

{{site}} — HSE Department
```

---

## 2. Rappel 6 heures avant — Tir aujourd'hui

**Objet (FR) :** Rappel — tir aujourd'hui à {{time}} sur {{zone}}
**Subject (EN):** Reminder — blast today at {{time}} at {{zone}}

**Corps — Français**
```
Bonjour,

Rappel : le tir {{blast_reference}} aura lieu aujourd'hui à {{time}}
sur {{zone}}.

Périmètre d'exclusion : {{exclusion_radius}}
Points de rassemblement : {{assembly_points}}

Commencez à dégager la zone et le matériel. Le périmètre devra être vide
et sécurisé avant l'heure du tir. Un dernier rappel vous sera envoyé
30 minutes avant.

Pour toute question : {{control_room}}.

{{site}} — Service HSE
```

**Body — English**
```
Hello,

Reminder: blast {{blast_reference}} will take place today at {{time}}
at {{zone}}.

Exclusion zone: {{exclusion_radius}}
Assembly points: {{assembly_points}}

Begin clearing the area and equipment. The zone must be empty and secured
before the blast time. A final reminder will be sent 30 minutes before.

Questions: {{control_room}}.

{{site}} — HSE Department
```

---

## 3. Rappel 30 minutes avant — Évacuation

**Objet (FR) :** Tir dans 30 minutes — évacuez {{zone}}
**Subject (EN):** Blast in 30 minutes — clear {{zone}}

**Corps — Français**
```
Bonjour,

Le tir {{blast_reference}} aura lieu dans 30 minutes, à {{time}},
sur {{zone}}.

Évacuez la zone maintenant et rejoignez le point de rassemblement le
plus proche : {{assembly_points}}.

Ne revenez pas dans le périmètre tant que le signal « site dégagé »
n'a pas été donné. Une alerte sonore générale sera déclenchée
10 minutes avant le tir.

{{control_room}} reste joignable.

{{site}} — Service HSE
```

**Body — English**
```
Hello,

Blast {{blast_reference}} will take place in 30 minutes, at {{time}},
at {{zone}}.

Clear the area now and proceed to the nearest assembly point:
{{assembly_points}}.

Do not re-enter the zone until the "all clear" has been given. A general
audible alarm will sound 10 minutes before the blast.

{{control_room}} remains reachable.

{{site}} — HSE Department
```

---

## Modèles complémentaires (recommandés)

Ces deux modèles couvrent les changements et la levée du périmètre. Utiles car la planification recalcule la chaîne en cas de report ou d'annulation.

### Report / nouvelle heure

**Objet (FR) :** Tir reporté — {{zone}}, nouvelle heure : {{date}} à {{time}}
**Subject (EN):** Blast rescheduled — {{zone}}, new time: {{date}} at {{time}}

```
FR — Le tir {{blast_reference}} sur {{zone}} est reporté.
Nouvelle date et heure : {{date}} à {{time}}.
Les rappels seront renvoyés selon ce nouvel horaire.
Pour toute question : {{control_room}}. — {{site}}, Service HSE

EN — Blast {{blast_reference}} at {{zone}} has been rescheduled.
New date and time: {{date}} at {{time}}.
Reminders will be reissued according to this new schedule.
Questions: {{control_room}}. — {{site}}, HSE Department
```

### Annulation

**Objet (FR) :** Tir annulé — {{zone}}, {{date}}
**Subject (EN):** Blast cancelled — {{zone}}, {{date}}

```
FR — Le tir {{blast_reference}} prévu le {{date}} à {{time}} sur {{zone}}
est annulé. Aucune restriction d'accès liée à ce tir ne s'applique.
{{control_room}} reste joignable. — {{site}}, Service HSE

EN — Blast {{blast_reference}} scheduled for {{date}} at {{time}} at
{{zone}} has been cancelled. No access restriction related to this blast
applies. {{control_room}} remains reachable. — {{site}}, HSE Department
```

---

*Astuce d'implémentation : conserver ces modèles en base ou en fichiers de traduction (i18n), un identifiant par modèle et par langue, et résoudre les variables au moment de l'envoi. Journaliser chaque e-mail expédié (destinataire, modèle, langue, statut).*

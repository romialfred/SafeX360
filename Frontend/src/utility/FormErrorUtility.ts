/**
 * FormErrorUtility — restitution LISIBLE des erreurs de validation Mantine.
 *
 * POURQUOI CE FICHIER EXISTE. La déclaration d'événement affichait, quand la
 * validation échouait, un unique « Veuillez compléter tous les champs
 * obligatoires avant de continuer. » qui ne nommait AUCUN champ. Tant que
 * chaque champ fautif portait aussi son erreur en ligne, cela restait
 * supportable. Mais le jour où un champ est déclaré obligatoire SANS être
 * rendu — ce qui est arrivé au type HAZARD, dont quatre champs requis
 * n'existaient sur aucun écran — l'utilisateur se retrouve devant un
 * formulaire entièrement rempli, un message lui demandant de le remplir, et
 * rien à corriger. Le défaut devient indétectable de l'extérieur.
 *
 * La parade est de NOMMER ce qui bloque. Un message qui cite « L'exigence non
 * respectée est requise » alors qu'aucun champ de ce nom n'est à l'écran
 * désigne immédiatement le vrai coupable : l'incohérence entre la validation
 * et le rendu. C'est cette information qui manquait pour diagnostiquer.
 *
 * Utilisation type :
 *
 *   form.validate();
 *   if (!form.isValid()) {
 *       errorNotification(missingFieldsMessage(form.errors));
 *       return;
 *   }
 */

/** Chemin de champ Mantine → message. Les valeurs peuvent être des nœuds React. */
type FormErrors = Record<string, unknown>;

/** Nombre de messages cités avant de basculer sur « … et N autres ». */
const MAX_LISTED = 4;

/**
 * Messages d'erreur exploitables, dédoublonnés et ordonnés comme la validation.
 *
 * Mantine autorise un `ReactNode` en message : on ne conserve donc que les
 * chaînes — un nœud React n'est pas concaténable dans une notification, et
 * tenter de le rendre ici produirait « [object Object] », pire que rien.
 */
export const formErrorMessages = (errors: FormErrors): string[] => {
    const seen = new Set<string>();
    Object.values(errors ?? {}).forEach((value) => {
        if (typeof value === 'string') {
            const message = value.trim();
            if (message) seen.add(message);
        }
    });
    return Array.from(seen);
};

/**
 * Message de notification qui ÉNUMÈRE ce qui bloque, au lieu de renvoyer
 * l'utilisateur à un formulaire qu'il croit — souvent à raison — complet.
 *
 * @param errors  `form.errors` APRÈS un appel à `form.validate()`.
 * @param prefix  Phrase d'introduction ; une valeur par défaut convient à la
 *                plupart des formulaires.
 */
export const missingFieldsMessage = (
    errors: FormErrors,
    prefix = 'Impossible de continuer',
): string => {
    const messages = formErrorMessages(errors);

    // Repli : validation en échec sans message exploitable (message porté par
    // un nœud React, ou erreur posée sans texte). On reste vague plutôt que
    // d'affirmer une cause fausse.
    if (messages.length === 0) {
        return `${prefix} : certains champs obligatoires ne sont pas renseignés.`;
    }

    const listed = messages.slice(0, MAX_LISTED);
    const remaining = messages.length - listed.length;
    const suffix = remaining > 0 ? ` … et ${remaining} autre${remaining > 1 ? 's' : ''}.` : '';

    return `${prefix} : ${listed.join(' · ')}${suffix}`;
};

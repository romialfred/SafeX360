/**
 * Règles de validation de l'étape 1 (Déclaration) d'un événement HSE.
 *
 * SOURCE DE VÉRITÉ UNIQUE, partagée par `NonConformityForm` (création) et
 * `NonConformityEdit` (modification).
 *
 * POURQUOI CE FICHIER EXISTE — ces dix-huit règles vivaient en DEUX
 * exemplaires, recopiés à l'identique dans les deux écrans. Comme toute
 * duplication, ils ont divergé : quatre d'entre eux exigeaient leur champ dès
 * que le type n'était pas NEAR_MISS, alors que `DeclarationStep` ne rendait ces
 * champs QUE pour NON_CONFORMITY. Tant qu'il n'existait que deux types, les
 * deux formulations coïncidaient. L'ajout d'un troisième type, HAZARD, les a
 * séparées : déclarer une situation dangereuse exigeait quatre champs absents
 * de tout écran, rendant l'étape 1 INFRANCHISSABLE — et, les champs n'étant pas
 * rendus, sans la moindre erreur en ligne pour l'expliquer.
 *
 * L'INVARIANT À TENIR : un champ ne doit jamais être exigé sans être rendu.
 * C'est pourquoi les prédicats de section (`hasNonConformityFields`,
 * `hasNearMissFields`) sont importés depuis `nonConformityLabels` et appelés
 * ici comme dans le rendu — jamais réécrits.
 */

import { isValidRichText } from '../../../utility/OtherUtilities';
import { hasNonConformityFields, hasNearMissFields } from './nonConformityLabels';

/** Sous-ensemble des valeurs consulté par les règles. */
interface DeclarationValues {
    nonConformity: {
        type?: string | null;
        [key: string]: any;
    };
}

type Rule = (value: any, values: DeclarationValues) => string | null;

/**
 * Règles de l'étape 1. À injecter tel quel dans `validate.nonConformity` :
 *
 *   validate: { nonConformity: { ...declarationRules, /* règles propres à l'écran *\/ } }
 *
 * Aucune règle ici ne dépend de l'étape courante : l'étape 1 est la seule
 * obligatoire, les suivantes se complètent plus tard.
 */
export const declarationRules: Record<string, Rule> = {
    type: (value) => (value ? null : "Le type d'événement est requis"),
    title: (value) => (value ? null : 'Le titre est requis'),
    date: (value) => (value ? null : "La date de l'événement est requise"),
    detectionDate: (value) => (value ? null : 'La date de détection est requise'),
    reportedBy: (value) => (value ? null : 'Le déclarant est requis'),
    workProcessId: (value) => (value ? null : 'Le processus de travail est requis'),
    locationId: (value) => (value ? null : 'Le lieu est requis'),
    categoryId: (value) => (value ? null : 'La catégorie est requise'),
    description: (value) => (isValidRichText(value) ? null : 'La description est requise'),

    // ─── Bloc « Spécifique non-conformité » ─────────────────────────────────
    // Exigés UNIQUEMENT quand le bloc est rendu. Le prédicat est le MÊME objet
    // que celui qui commande l'affichage : il ne peut plus diverger.
    requirement: (value, values) =>
        !hasNonConformityFields(values.nonConformity.type) || value
            ? null
            : "L'exigence non respectée est requise",
    detectionSource: (value, values) =>
        !hasNonConformityFields(values.nonConformity.type) || value
            ? null
            : 'La source de détection est requise',
    actionTaken: (value, values) =>
        !hasNonConformityFields(values.nonConformity.type) || value
            ? null
            : "L'action immédiate est requise",
    severityLevel: (value, values) =>
        !hasNonConformityFields(values.nonConformity.type) || value
            ? null
            : 'Le niveau de gravité est requis',

    // ─── Bloc « Spécifique quasi-accident » ─────────────────────────────────
    nearMissType: (value, values) =>
        hasNearMissFields(values.nonConformity.type) && !value
            ? 'Le type de quasi-accident est requis'
            : null,
    factors: (value, values) =>
        hasNearMissFields(values.nonConformity.type) && (value?.length ?? 0) === 0
            ? 'Au moins un facteur contributif est requis'
            : null,
    preventiveAction: (value, values) =>
        hasNearMissFields(values.nonConformity.type) && !isValidRichText(value)
            ? "L'action préventive est requise"
            : null,
    improvement: (value, values) =>
        hasNearMissFields(values.nonConformity.type) && !isValidRichText(value)
            ? "L'opportunité d'amélioration est requise"
            : null,

    // Commun aux trois types : la nature classe l'événement (ISO 45001).
    events: (value) =>
        (value?.length ?? 0) === 0 ? "Au moins une nature d'événement est requise" : null,
};

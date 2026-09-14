/**
 * Détection « cet incident a-t-il occasionné une blessure ? ».
 *
 * Le formulaire n'affichait les parties du corps que lorsque le LIBELLÉ du type
 * d'incident contenait « blessure », « premiers soins », « first aid » ou
 * « injury ». Trois angles morts en découlaient :
 *   1. un référentiel qui nomme ses types autrement (« accident corporel »,
 *      « soins médicaux », « LTI ») n'ouvrait jamais la saisie ;
 *   2. un incident décrit comme « l'opérateur s'est coupé la main » restait
 *      muet si son type ne portait pas le mot ;
 *   3. le déclarant n'avait aucun moyen d'ouvrir la saisie lui-même.
 *
 * Ce module ne décide rien : il PROPOSE. La réponse affichée dans le
 * formulaire reste celle du déclarant, qui peut toujours la contredire.
 *
 * Source unique : les deux formulaires (déclaration et modification) importent
 * d'ici. Deux listes de mots-clés divergeraient au premier ajout.
 */

/** Minuscules, sans accents : « Blessé » et « blesse » doivent se rencontrer. */
export const normaliseTexte = (valeur: unknown): string =>
    String(valeur ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();

/** Les descriptions viennent d'un éditeur riche : le balisage n'est pas du texte. */
export const texteBrut = (valeur: unknown): string =>
    normaliseTexte(valeur)
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;|&#160;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

/**
 * Motifs d'atteinte corporelle, bornés aux limites de mot : sans cette borne,
 * « lti » se déclencherait sur « multiple » et « ultime ».
 * Les radicaux couvrent les accords (blessé/blessée/blessés, fracture/fracturé).
 */
const MOTIFS_BLESSURE = [
    'blessur\\w*', 'blesse\\w*', 'blessant\\w*',
    'injur(?:y|ies|ed)', 'harm(?:ed)?',
    'premiers?\\s+soins', 'first\\s+aid', 'secouris\\w*',
    'soins?\\s+medica\\w*', 'medical\\s+treatment', 'hospitalis\\w*', 'infirmerie',
    'lti', 'arret\\s+de\\s+travail', 'accident\\s+corporel', 'atteinte\\s+corporelle',
    'coupure\\w*', 'coupe\\s+(?:la|le|au|a\\s+la)', 'fractur\\w*', 'brulure\\w*', 'brule\\w*',
    'entorse\\w*', 'foulure\\w*', 'contusion\\w*', 'plaie\\w*', 'hematome\\w*',
    'luxation\\w*', 'amputation\\w*', 'ampute\\w*', 'saignement\\w*', 'hemorragi\\w*',
    'traumatis\\w*', 'commotion\\w*', 'piqure\\w*', 'morsure\\w*',
    'electrisation\\w*', 'electrocut\\w*', 'lombalgi\\w*', 'lesion\\w*',
];

const REGEX_BLESSURE = new RegExp(`\\b(?:${MOTIFS_BLESSURE.join('|')})\\b`, 'i');

/** Vrai si le texte mentionne une atteinte corporelle. Accepte du HTML. */
export const mentionneBlessure = (valeur: unknown): boolean => {
    const texte = texteBrut(valeur);
    return texte.length > 0 && REGEX_BLESSURE.test(texte);
};

/**
 * Catégories dont un incident peut atteindre une personne, donc les seules où la
 * question de la blessure est posée. Un dommage matériel ou un écart de processus
 * n'a pas de partie du corps à renseigner : poser la question y était du bruit.
 *
 * Liste volontairement explicite et facile à étendre : le référentiel compte
 * aussi « Incendie et explosion », « Dynamitage », « Transport » et
 * « Communauté », qui peuvent blesser. Leur ajout est une décision métier, pas
 * une déduction du code — ne pas les inscrire ici ferme la saisie chez eux.
 */
const CATEGORIES_CORPORELLES = [
    /** FR : « Santé et sécurité ». EN : « Health and safety », « Health & safety ». */
    (label: string) => label.includes('sante') && label.includes('securite'),
    (label: string) => label.includes('health') && label.includes('safety'),
];

/**
 * Vrai si la catégorie peut concerner une personne. Sans catégorie choisie, la
 * question n'est pas posée : on ne demande pas une blessure avant de savoir de
 * quel type d'événement il s'agit.
 */
export const categorieConcernePersonne = (categorieLabel: unknown): boolean => {
    const label = normaliseTexte(categorieLabel);
    if (!label) { return false; }
    return CATEGORIES_CORPORELLES.some((test) => test(label));
};

export interface IndicesBlessure {
    /** Libellé du type d'incident sélectionné pour cette classification. */
    typeLabel?: string;
    /** Libellé de la catégorie sélectionnée. */
    categorieLabel?: string;
    /** Textes libres du formulaire (description factuelle, conséquences, titre…). */
    textes?: unknown[];
    /** Parties du corps déjà saisies : une saisie existante vaut réponse « oui ». */
    partiesDejaSaisies?: unknown[];
}

/**
 * Proposition du système. Utilisée pour pré-positionner la réponse du
 * déclarant, jamais pour la remplacer ni pour verrouiller la saisie.
 */
export const suggereBlessure = ({ typeLabel, categorieLabel, textes = [], partiesDejaSaisies = [] }: IndicesBlessure): boolean => {
    if (Array.isArray(partiesDejaSaisies) && partiesDejaSaisies.length > 0) { return true; }
    if (mentionneBlessure(typeLabel)) { return true; }
    if (mentionneBlessure(categorieLabel)) { return true; }
    return textes.some((texte) => mentionneBlessure(texte));
};

/** Motif exposé pour les tests et pour l'aide à la saisie. */
export const MOTIFS_BLESSURE_SOURCE = MOTIFS_BLESSURE;

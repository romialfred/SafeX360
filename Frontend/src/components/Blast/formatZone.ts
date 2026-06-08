/**
 * Helper de formatage du libelle de zone d'alerte des tirs de mine.
 *
 * Le backend stocke le scope sous forme machine-friendly :
 *   FOSSE_NORD / FOSSE_SUD / FOSSE_EST / FOSSE_OUEST / CARRIERE_EST / ATELIER_CENTRAL ...
 *
 * L'affichage doit etre humanise pour un rapport HSE professionnel :
 *   "Fosse Nord", "Fosse Sud", "Carriere Est"... (R2 de REGLES.MD).
 *
 * Strategie : underscore -> espace, puis title-case en preservant les
 * articles + sigles courts. Un mapping explicite override pour les cas
 * connus ou la regle naive ne suffirait pas.
 */

const EXPLICIT_LABELS: Record<string, string> = {
    // Fosses
    FOSSE_NORD: 'Fosse Nord',
    FOSSE_SUD: 'Fosse Sud',
    FOSSE_EST: 'Fosse Est',
    FOSSE_OUEST: 'Fosse Ouest',
    // Carrieres
    CARRIERE_EST: 'Carriere Est',
    CARRIERE_OUEST: 'Carriere Ouest',
    CARRIERE_NORD: 'Carriere Nord',
    CARRIERE_SUD: 'Carriere Sud',
    // Generiques
    ATELIER_CENTRAL: 'Atelier central',
    ATELIER_NORD: 'Atelier Nord',
    MAGASIN_EXPLOSIFS: 'Magasin d\'explosifs',
    SITE_COMPLET: 'Site complet',
    ALL: 'Toutes zones',
    NONE: '—',
};

/**
 * Transforme un scope brut "FOSSE_SUD" en libelle humanise "Fosse Sud".
 * Si scope null/vide, renvoie la chaine "—".
 */
export function formatZoneScope(scope?: string | null): string {
    if (!scope) return '—';
    const trimmed = scope.trim().toUpperCase();
    if (!trimmed) return '—';
    // Mapping explicite prioritaire
    if (EXPLICIT_LABELS[trimmed]) {
        return EXPLICIT_LABELS[trimmed];
    }
    // Strategie generique : underscore -> espace, puis title-case
    return trimmed
        .split('_')
        .map((word) => {
            if (!word) return '';
            // Mots courts (1-2 lettres) en majuscules (sigles : NW, SE, B3...)
            if (word.length <= 2 && /^[A-Z0-9]+$/.test(word)) return word;
            return word.charAt(0) + word.slice(1).toLowerCase();
        })
        .filter(Boolean)
        .join(' ');
}

/**
 * Variante TTS : version prononcable, sans abreviations confuses.
 * Utilisee par le moteur de synthese vocale de l'alarme d'evacuation.
 */
export function speakableZone(scope?: string | null): string {
    const human = formatZoneScope(scope);
    if (!human || human === '—') return 'la zone concernee';
    return human;
}

/**
 * Résolution de la MINE ACTIVE pour les écritures cloisonnées.
 *
 * CONTEXTE. En vue « Toutes les Mines » (consolidée), `selectedCompanyId` vaut
 * `null` : il n'y a PAS de mine précise. De nombreux formulaires calculaient
 * alors `selectedCompanyId ?? user?.mineId ?? user?.companyId ?? 1` — un repli
 * silencieux sur la mine 1 (ou 0/NaN selon les cas). Résultat : écriture
 * rattachée à la MAUVAISE mine, entité orpheline, ou 403 du cloisonnement.
 * `??` ne filtre ni le `0` ni le cas consolidé.
 *
 * RÈGLE. Une écriture rattachée à une mine EXIGE une mine précise (> 0). En vue
 * consolidée, on ne devine pas : on BLOQUE avec un message clair invitant à
 * choisir une mine dans l'en-tête. C'est la doctrine unifiée de la plateforme
 * (cf. inspection, points de rassemblement, réglages d'urgence).
 */

/** Renvoie `v` si c'est un identifiant de mine précis (entier > 0), sinon null. */
export function positiveMineId(v: unknown): number | null {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Message standard à afficher quand aucune mine précise n'est active.
 * @param action verbe d'action, ex. « planifier une inspection »,
 *   « déclencher une alerte », « enregistrer ce tir ».
 */
export function selectMineMessage(action: string, lang: 'fr' | 'en' = 'fr'): string {
    return lang === 'fr'
        ? `Sélectionnez d'abord une mine précise dans l'en-tête (actuellement : « Toutes les Mines ») pour ${action}.`
        : `First select a specific mine in the header (currently: “All Mines”) to ${action}.`;
}

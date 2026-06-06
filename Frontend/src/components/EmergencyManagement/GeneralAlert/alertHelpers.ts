/**
 * Helpers partagés pour le module Alerte Générale (LOT 48 P4.d).
 */

/**
 * Mappe les codes raison standardisés vers des libellés français lisibles.
 * Pour un code inconnu, applique un fallback générique (snake_case → Title Case).
 */
const REASON_LABELS: Record<string, string> = {
    EVACUATION_GENERALE: 'Évacuation Générale',
    ZONE_EVACUATION: 'Zone Évacuation',
    MANDATORY_ASSEMBLY: 'Rassemblement obligatoire',
    INCENDIE: 'Incendie',
    FIRE: 'Incendie',
    ACCIDENT_MAJEUR: 'Accident majeur',
    FUITE_CHIMIQUE: 'Fuite chimique majeure',
    EXPLOSION: 'Explosion',
    EXERCICE: 'Exercice d\'évacuation',
    DRILL: 'Exercice d\'évacuation',
    EFFONDREMENT: 'Effondrement',
    AUTRE: 'Alerte Générale',
};

/**
 * Formate un code raison en libellé lisible.
 *   "ZONE_EVACUATION"     → "Zone Évacuation"
 *   "MANDATORY_ASSEMBLY"  → "Rassemblement obligatoire"
 *   "AUTRE_CHOSE_INCONNU" → "Autre Chose Inconnu" (fallback Title Case)
 */
export const formatReasonCode = (code?: string | null): string => {
    if (!code) return 'Alerte Générale';
    if (REASON_LABELS[code]) return REASON_LABELS[code];
    // Fallback : snake_case → Title Case avec espaces
    return code
        .toLowerCase()
        .split(/[_\-\s]+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
};

// ────────────────────────────────────────────────────────────────────────────
// Persistance check-in en localStorage
// ────────────────────────────────────────────────────────────────────────────

const LS_PREFIX = 'safex.emergency.checkedIn';

/** Marque qu'un employé a fait son check-in pour une alerte donnée. */
export const markCheckedIn = (userId: number, alertId: number): void => {
    try {
        const key = `${LS_PREFIX}.${userId}.${alertId}`;
        localStorage.setItem(key, String(Date.now()));
    } catch {
        /* localStorage indisponible */
    }
};

/** Indique si un employé a déjà fait son check-in pour cette alerte. */
export const hasCheckedIn = (userId: number, alertId: number): boolean => {
    try {
        const key = `${LS_PREFIX}.${userId}.${alertId}`;
        return localStorage.getItem(key) !== null;
    } catch {
        return false;
    }
};

/** Nettoie les entrées plus vieilles que 24h pour borner la taille. */
export const cleanupOldCheckIns = (): void => {
    try {
        const cutoff = Date.now() - 24 * 3600 * 1000;
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith(LS_PREFIX)) continue;
            const ts = parseInt(localStorage.getItem(key) ?? '0', 10);
            if (ts < cutoff) keysToRemove.push(key);
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
        /* ignore */
    }
};

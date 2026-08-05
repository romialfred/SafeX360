import { COMPANY_SELECTION_STORAGE_KEY } from '../slices/CompanySelectionSlice';

/**
 * Cache mémoire des DONNÉES DE RÉFÉRENCE (listes déroulantes : employés,
 * départements, catégories…).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * POURQUOI (audit performance du 2026-08-05)
 * ─────────────────────────────────────────────────────────────────────────
 * La liste des employés est re-téléchargée par 45 écrans, les départements par
 * 34, à CHAQUE montage. Chaque re-téléchargement est un aller-retour réseau
 * complet — et l'application (Oregon) est loin de la base (Frankfurt), soit
 * ~150 ms incompressibles par appel. Or ces données changent très rarement.
 *
 * Ce cache sert la même donnée depuis la mémoire du navigateur pendant toute la
 * session : le 1er écran paie l'aller-retour, les suivants sont instantanés.
 *
 * TROIS PROPRIÉTÉS qui le rendent sûr :
 *   1. CLOISONNÉ PAR MINE. La clé inclut la mine active ; changer de mine
 *      repart sur des entrées distinctes — jamais la donnée d'une autre mine.
 *   2. DÉDUP DES REQUÊTES CONCURRENTES. Si 3 composants montent en même temps
 *      et demandent la même liste, UNE seule requête réseau part ; les trois
 *      partagent la même promesse.
 *   3. TTL + INVALIDATION. Fraîcheur bornée (défaut 5 min) ET éviction explicite
 *      appelée par les mutations (création/édition/suppression) pour que la
 *      liste reflète le changement immédiatement, sans attendre le TTL.
 */

type Entry = { at: number; value?: unknown; promise?: Promise<unknown> };

const store = new Map<string, Entry>();

/** 5 min : les référentiels changent rarement, et le TTL n'est qu'un filet —
 *  les mutations invalident explicitement (cf. invalidateReference). */
export const REFERENCE_TTL_MS = 5 * 60 * 1000;

/** Mine active, lue à la MÊME source que l'intercepteur axios. */
const activeMine = (): string => {
    try {
        return window.localStorage.getItem(COMPANY_SELECTION_STORAGE_KEY) ?? 'none';
    } catch {
        return 'none';
    }
};

const scopedKey = (baseKey: string): string => `${activeMine()}::${baseKey}`;

/**
 * Récupère une donnée de référence, depuis le cache si elle est fraîche.
 *
 * @param baseKey  identifiant stable de la ressource (ex. 'employees:dropdown').
 * @param fetcher  la vraie requête réseau, appelée uniquement en cas de manque.
 * @param ttl      fraîcheur maximale (ms). Défaut : REFERENCE_TTL_MS.
 */
export function cachedGet<T>(baseKey: string, fetcher: () => Promise<T>, ttl = REFERENCE_TTL_MS): Promise<T> {
    const key = scopedKey(baseKey);
    const entry = store.get(key);

    // 1) Valeur fraîche en cache.
    if (entry && entry.value !== undefined && Date.now() - entry.at < ttl) {
        return Promise.resolve(entry.value as T);
    }
    // 2) Requête déjà en vol pour cette clé : on partage sa promesse (dédup).
    if (entry && entry.promise) {
        return entry.promise as Promise<T>;
    }
    // 3) Manque : on lance la requête et on la met en cache.
    const promise = fetcher()
        .then((value) => {
            store.set(key, { at: Date.now(), value });
            return value;
        })
        .catch((err) => {
            // Un échec ne doit jamais rester en cache : le prochain appel réessaie.
            store.delete(key);
            throw err;
        });
    store.set(key, { at: Date.now(), promise });
    return promise;
}

/**
 * Évince des entrées du cache. À appeler après toute mutation d'un référentiel.
 *
 * @param baseKey  préfixe à évincer (toutes mines confondues). Omis → vide tout.
 */
export function invalidateReference(baseKey?: string): void {
    if (!baseKey) {
        store.clear();
        return;
    }
    const suffix = `::${baseKey}`;
    for (const key of Array.from(store.keys())) {
        if (key.endsWith(suffix)) store.delete(key);
    }
}

/** Vide entièrement le cache. À la déconnexion, pour ne rien laisser fuiter
 *  d'une session à l'autre. */
export function clearReferenceCache(): void {
    store.clear();
}

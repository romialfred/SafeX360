import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COMPANY_SELECTION_STORAGE_KEY } from '../slices/CompanySelectionSlice';
import { cachedGet, clearReferenceCache, invalidateReference } from './referenceCache';

/**
 * Ces tests verrouillent les trois propriétés qui rendent le cache SÛR :
 * cloisonnement par mine, dédup des requêtes concurrentes, invalidation. Une
 * régression sur l'une d'elles servirait une donnée périmée ou d'une autre mine.
 */

const setMine = (id: string | null) => {
    if (id === null) window.localStorage.removeItem(COMPANY_SELECTION_STORAGE_KEY);
    else window.localStorage.setItem(COMPANY_SELECTION_STORAGE_KEY, id);
};

beforeEach(() => {
    clearReferenceCache();
    setMine('1');
});
afterEach(() => {
    clearReferenceCache();
    window.localStorage.clear();
    vi.restoreAllMocks();
});

describe('cachedGet', () => {
    it('ne lance la requête réseau qu’une fois pour des appels successifs', async () => {
        const fetcher = vi.fn().mockResolvedValue(['a', 'b']);
        const first = await cachedGet('k', fetcher);
        const second = await cachedGet('k', fetcher);

        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(second).toBe(first); // même référence : servie du cache
    });

    it('dédup les requêtes CONCURRENTES en une seule (pas de course)', async () => {
        let resolve!: (v: unknown) => void;
        const fetcher = vi.fn().mockReturnValue(new Promise((r) => { resolve = r; }));

        const p1 = cachedGet('k', fetcher);
        const p2 = cachedGet('k', fetcher); // pendant que la 1re est en vol
        resolve(['x']);
        await Promise.all([p1, p2]);

        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('sépare le cache PAR MINE — jamais la donnée d’une autre mine', async () => {
        const fetcher = vi.fn()
            .mockResolvedValueOnce(['mine-1'])
            .mockResolvedValueOnce(['mine-6']);

        setMine('1');
        expect(await cachedGet('k', fetcher)).toEqual(['mine-1']);
        setMine('6');
        expect(await cachedGet('k', fetcher)).toEqual(['mine-6']);
        // Retour mine 1 : servie du cache, pas de 3e appel.
        setMine('1');
        expect(await cachedGet('k', fetcher)).toEqual(['mine-1']);
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('re-télécharge après expiration du TTL', async () => {
        const fetcher = vi.fn().mockResolvedValue(['v']);
        await cachedGet('k', fetcher, 10);
        await new Promise((r) => setTimeout(r, 25));
        await cachedGet('k', fetcher, 10);
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('ne met PAS un échec en cache : le prochain appel réessaie', async () => {
        const fetcher = vi.fn()
            .mockRejectedValueOnce(new Error('réseau'))
            .mockResolvedValueOnce(['ok']);

        await expect(cachedGet('k', fetcher)).rejects.toThrow('réseau');
        expect(await cachedGet('k', fetcher)).toEqual(['ok']);
        expect(fetcher).toHaveBeenCalledTimes(2);
    });
});

describe('invalidateReference', () => {
    it('force le re-téléchargement après une mutation', async () => {
        const fetcher = vi.fn()
            .mockResolvedValueOnce(['avant'])
            .mockResolvedValueOnce(['après']);

        expect(await cachedGet('depts', fetcher)).toEqual(['avant']);
        invalidateReference('depts');
        expect(await cachedGet('depts', fetcher)).toEqual(['après']);
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('n’évince que le préfixe visé', async () => {
        const a = vi.fn().mockResolvedValue(['A']);
        const b = vi.fn().mockResolvedValue(['B']);
        await cachedGet('a', a);
        await cachedGet('b', b);

        invalidateReference('a');
        await cachedGet('a', a); // ré-appel
        await cachedGet('b', b); // toujours en cache

        expect(a).toHaveBeenCalledTimes(2);
        expect(b).toHaveBeenCalledTimes(1);
    });

    it('évince toutes les mines pour un préfixe donné', async () => {
        const fetcher = vi.fn().mockResolvedValue(['v']);
        setMine('1'); await cachedGet('k', fetcher);
        setMine('6'); await cachedGet('k', fetcher);
        expect(fetcher).toHaveBeenCalledTimes(2);

        invalidateReference('k'); // doit vider mine 1 ET mine 6
        setMine('1'); await cachedGet('k', fetcher);
        setMine('6'); await cachedGet('k', fetcher);
        expect(fetcher).toHaveBeenCalledTimes(4);
    });
});

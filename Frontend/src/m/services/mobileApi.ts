/**
 * mobileApi — Wrapper API offline-aware pour la version Field.
 *
 * Strategie :
 *   - GET  : tente le reseau d'abord (3 s timeout), fallback cache IndexedDB
 *            si echec. Au succes, met a jour le cache.
 *   - POST/PUT/DELETE : tente le reseau. Si echec (offline ou 5xx), enqueue
 *            dans mutationQueue avec une fingerprint pour deduplication.
 *
 * Toutes les ecritures retournent une promise qui resout :
 *   - { online: true,  data: ... }  si le serveur a accepte
 *   - { online: false, queuedId }   si la mutation est partie en queue
 *
 * L'UI peut afficher un feedback adapte ("Envoye" vs "Sauvegarde hors ligne,
 * synchronisera plus tard").
 */

import axiosInstance from '../../interceptors/AxiosInterceptor';
import {
    queueEnqueue,
    cacheGet,
    cachePut,
    type MutationRecord,
} from '../offline/db';

const NETWORK_TIMEOUT_MS = 3000;
const MUTATION_TIMEOUT_MS = 8000;

export interface MobileFetchResult<T> {
    online: boolean;
    data: T;
    /** True si la donnee vient du cache local (pas frais). */
    stale: boolean;
}

export interface MobileMutationResult<T = unknown> {
    online: boolean;
    data?: T;
    queuedId?: number;
}

type CacheStore = 'inspectionCache' | 'templateCache' | 'blastCache' | 'userProfileCache';

/**
 * GET cache-aware. Tente reseau, fallback cache si timeout/erreur.
 * Met a jour le cache au succes.
 */
export async function getCached<T>(opts: {
    endpoint: string;
    cacheStore?: CacheStore;
    cacheKey?: string | number;
    ttlMs?: number;
}): Promise<MobileFetchResult<T>> {
    const { endpoint, cacheStore, cacheKey, ttlMs } = opts;
    try {
        const res = await axiosInstance.get<T>(endpoint, { timeout: NETWORK_TIMEOUT_MS });
        const data = res.data;
        if (cacheStore && cacheKey !== undefined) {
            void cachePut(cacheStore, cacheKey, data, ttlMs);
        }
        return { online: true, data, stale: false };
    } catch (e) {
        if (cacheStore && cacheKey !== undefined) {
            const cached = await cacheGet<T>(cacheStore, cacheKey);
            if (cached !== null) {
                return { online: false, data: cached, stale: true };
            }
        }
        throw e;
    }
}

/**
 * POST/PUT/DELETE offline-aware. En cas d'echec reseau, enqueue dans
 * mutationQueue. La fingerprint est utilisee pour la deduplication
 * (eviter de re-enqueue 2x la meme mutation au double-clic).
 */
export async function mutateOffline<T = unknown>(opts: {
    endpoint: string;
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    payload?: unknown;
    headers?: Record<string, string>;
    kind: MutationRecord['kind'];
    fingerprint?: string;
}): Promise<MobileMutationResult<T>> {
    const { endpoint, method, payload, headers, kind, fingerprint } = opts;
    // Tentative reseau si on est en ligne
    if (typeof navigator !== 'undefined' && navigator.onLine !== false) {
        try {
            const res = await axiosInstance.request<T>({
                method,
                url: endpoint,
                data: payload,
                headers,
                timeout: MUTATION_TIMEOUT_MS,
            });
            return { online: true, data: res.data };
        } catch (e: any) {
            const status = e?.response?.status;
            // 4xx (sauf 408/429) = erreur metier, on remonte direct sans queue
            if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
                throw e;
            }
            // Sinon : enqueue offline
        }
    }
    const queuedId = await queueEnqueue({
        endpoint,
        method,
        payload,
        headers,
        kind,
        fingerprint,
    });
    return { online: false, queuedId };
}

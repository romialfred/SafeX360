/**
 * File d'attente IndexedDB pour les déclenchements SOS hors-ligne
 * (LOT 48 Phase 3.c).
 *
 * <p>Garantit qu'un employé en zone sans réseau (tunnel, sous-sol) peut
 * tout de même déclencher un SOS qui sera transmis dès reconnexion.</p>
 *
 * <p>Pattern :</p>
 * <ul>
 *   <li>{@code enqueueSos(dto)} — stocke l'alerte avec timestamp local</li>
 *   <li>{@code replayPending(post)} — itère les alertes en attente, tente le POST,
 *       supprime au succès</li>
 *   <li>Replay automatique sur événement {@code online} + au démarrage app
 *       + toutes les 30s en background</li>
 * </ul>
 *
 * <p>Stocke jusqu'à 50 entrées. La saturation est signalée explicitement :
 * aucune alerte déjà enregistrée ne peut être supprimée silencieusement.</p>
 */

import {
    belongsToOfflineOwner,
    createOfflineCryptoId,
    currentOfflineOwnerContext,
    decryptOfflineJson,
    encryptOfflineJson,
    type EncryptedOfflinePayload,
    type OfflineOwnerContext,
} from '../security/offlineVault';
import type { SosAlertDTO } from '../services/SosService';

const DB_NAME = 'safex-emergency';
const DB_VERSION = 2;
const STORE_PENDING_SOS = 'pending_sos';
const MAX_PENDING = 50;

export interface PendingSos {
    id?: number;
    payload: SosAlertDTO;
    actorId?: number;
    enqueuedAt: string; // ISO
    attempts: number;
    lastAttemptAt?: string;
    lastError?: string;
    state: 'QUEUED' | 'SENDING' | 'FAILED';
    ownerKey: string;
    mineId: number;
}

interface StoredPendingSos extends Omit<PendingSos, 'payload' | 'actorId' | 'lastError'> {
    cryptoId: string;
    encryptedSensitive: EncryptedOfflinePayload;
}

// ────────────────────────────────────────────────────────────────────────────
// DB open
// ────────────────────────────────────────────────────────────────────────────

const openDb = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB indisponible'));
            return;
        }
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (event) => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_PENDING_SOS)) {
                db.createObjectStore(STORE_PENDING_SOS, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
            }
            // v2 : les SOS legacy non chiffrés/non partitionnés sont purgés.
            if ((event.oldVersion ?? 0) < 2) {
                req.transaction?.objectStore(STORE_PENDING_SOS).clear();
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

// ────────────────────────────────────────────────────────────────────────────
// Enqueue / Dequeue
// ────────────────────────────────────────────────────────────────────────────

export const enqueueSos = async (payload: SosAlertDTO, actorId?: number): Promise<void> => {
    const owner = currentOfflineOwnerContext();
    const cryptoId = createOfflineCryptoId();
    const encryptedSensitive = await encryptOfflineJson(
        owner,
        'emergency-sos',
        cryptoId,
        { payload, actorId },
    );
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PENDING_SOS, 'readwrite');
        const store = tx.objectStore(STORE_PENDING_SOS);

        let saturated = false;
        // Capacité bornée sans perte silencieuse d'une alerte existante.
        const countReq = store.getAll();
        countReq.onsuccess = () => {
            const count = (countReq.result as StoredPendingSos[])
                .filter((entry) => belongsToOfflineOwner(entry, owner)).length;
            if (count >= MAX_PENDING) {
                saturated = true;
                tx.abort();
                return;
            }
            const entry: StoredPendingSos = {
                enqueuedAt: new Date().toISOString(),
                attempts: 0,
                state: 'QUEUED',
                ...owner,
                cryptoId,
                encryptedSensitive,
            };
            store.add(entry);
        };

        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(new Error(
            saturated
                ? "File SOS saturée : utilisez immédiatement les canaux d'urgence du site."
                : 'Enregistrement local du SOS interrompu.',
        ));
        tx.onerror = () => reject(tx.error ?? new Error('Enregistrement local du SOS impossible.'));
    });
};

export const countPending = async (): Promise<number> => {
    try {
        const owner = currentOfflineOwnerContext();
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_PENDING_SOS, 'readonly');
            const req = tx.objectStore(STORE_PENDING_SOS).getAll();
            req.onsuccess = () => resolve((req.result as StoredPendingSos[])
                .filter((entry) => belongsToOfflineOwner(entry, owner)).length);
            req.onerror = () => reject(req.error);
        });
    } catch {
        return 0;
    }
};

/** Supprime les SOS en attente, uniquement apres confirmation explicite. */
export const purgePendingSos = async (): Promise<void> => {
    const owner = currentOfflineOwnerContext();
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PENDING_SOS, 'readwrite');
        const store = tx.objectStore(STORE_PENDING_SOS);
        const req = store.getAll();
        req.onsuccess = () => {
            for (const entry of (req.result as StoredPendingSos[])
                .filter((candidate) => belongsToOfflineOwner(candidate, owner))) {
                if (entry.id !== undefined) store.delete(entry.id);
            }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

const decryptSosEntry = async (
    entry: StoredPendingSos,
    owner: OfflineOwnerContext,
): Promise<PendingSos> => {
    if (!belongsToOfflineOwner(entry, owner)) throw new Error('OFFLINE_ENTRY_FORBIDDEN');
    const sensitive = await decryptOfflineJson<{
        payload: SosAlertDTO;
        actorId?: number;
        lastError?: string;
    }>(
        owner,
        'emergency-sos',
        entry.cryptoId,
        entry.encryptedSensitive,
    );
    return {
        id: entry.id,
        payload: sensitive.payload,
        actorId: sensitive.actorId,
        enqueuedAt: entry.enqueuedAt,
        attempts: entry.attempts,
        lastAttemptAt: entry.lastAttemptAt,
        lastError: sensitive.lastError,
        state: entry.state,
        ownerKey: entry.ownerKey,
        mineId: entry.mineId,
    };
};

export const listPending = async (): Promise<PendingSos[]> => {
    try {
        const owner = currentOfflineOwnerContext();
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_PENDING_SOS, 'readonly');
            const req = tx.objectStore(STORE_PENDING_SOS).getAll();
            req.onsuccess = () => {
                const entries = (req.result as StoredPendingSos[])
                    .filter((entry) => belongsToOfflineOwner(entry, owner));
                Promise.all(entries.map((entry) => decryptSosEntry(entry, owner))).then(resolve, reject);
            };
            req.onerror = () => reject(req.error);
        });
    } catch {
        return [];
    }
};

const updateOne = async (entry: PendingSos): Promise<void> => {
    const owner = currentOfflineOwnerContext();
    if (!belongsToOfflineOwner(entry, owner) || entry.id === undefined) {
        throw new Error('OFFLINE_ENTRY_FORBIDDEN');
    }
    const cryptoId = createOfflineCryptoId();
    const encryptedSensitive = await encryptOfflineJson(owner, 'emergency-sos', cryptoId, {
        payload: entry.payload,
        actorId: entry.actorId,
        lastError: entry.lastError,
    });
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PENDING_SOS, 'readwrite');
        const store = tx.objectStore(STORE_PENDING_SOS);
        const req = store.get(entry.id!);
        req.onsuccess = () => {
            const existing = req.result as StoredPendingSos | undefined;
            if (!existing || !belongsToOfflineOwner(existing, owner)) {
                tx.abort();
                return;
            }
            store.put({
                id: entry.id,
                enqueuedAt: entry.enqueuedAt,
                attempts: entry.attempts,
                lastAttemptAt: entry.lastAttemptAt,
                state: entry.state,
                ownerKey: entry.ownerKey,
                mineId: entry.mineId,
                cryptoId,
                encryptedSensitive,
            } satisfies StoredPendingSos);
        };
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(new Error('OFFLINE_ENTRY_FORBIDDEN'));
        tx.onerror = () => reject(tx.error);
    });
};

const deleteOne = async (id: number): Promise<void> => {
    const owner = currentOfflineOwnerContext();
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PENDING_SOS, 'readwrite');
        const store = tx.objectStore(STORE_PENDING_SOS);
        const req = store.get(id);
        req.onsuccess = () => {
            const existing = req.result as StoredPendingSos | undefined;
            if (!existing || !belongsToOfflineOwner(existing, owner)) {
                tx.abort();
                return;
            }
            store.delete(id);
        };
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(new Error('OFFLINE_ENTRY_FORBIDDEN'));
        tx.onerror = () => reject(tx.error);
    });
};

// ────────────────────────────────────────────────────────────────────────────
// Replay
// ────────────────────────────────────────────────────────────────────────────

export type PostFn = (payload: SosAlertDTO, actorId?: number) => Promise<unknown>;

export interface ReplayResult {
    attempted: number;
    succeeded: number;
    failed: number;
}

/**
 * Tente de re-poster toutes les alertes en attente.
 * Conserve celles qui échouent (avec incrément attempts + lastError).
 */
export const replayPending = async (post: PostFn): Promise<ReplayResult> => {
    const owner = currentOfflineOwnerContext();
    const pending = await listPending();
    let succeeded = 0;
    let failed = 0;

    for (const entry of pending) {
        try {
            if (!belongsToOfflineOwner(entry, owner)
                    || !belongsToOfflineOwner(entry, currentOfflineOwnerContext())) {
                throw new Error('OFFLINE_ENTRY_FORBIDDEN');
            }
            entry.state = 'SENDING';
            if (entry.id !== undefined) await updateOne(entry);
            if (!belongsToOfflineOwner(entry, currentOfflineOwnerContext())) {
                throw new Error('OFFLINE_ENTRY_FORBIDDEN');
            }
            await post(entry.payload, entry.actorId);
            if (!belongsToOfflineOwner(entry, currentOfflineOwnerContext())) {
                throw new Error('OFFLINE_ENTRY_FORBIDDEN');
            }
            if (entry.id !== undefined) await deleteOne(entry.id);
            succeeded++;
        } catch (error: unknown) {
            if (!belongsToOfflineOwner(entry, currentOfflineOwnerContext())) {
                throw new Error('OFFLINE_ENTRY_FORBIDDEN');
            }
            failed++;
            entry.attempts = (entry.attempts ?? 0) + 1;
            entry.lastAttemptAt = new Date().toISOString();
            entry.lastError = error instanceof Error ? error.message : 'Erreur inconnue';
            entry.state = 'FAILED';
            try { await updateOne(entry); } catch { /* ignore */ }
        }
    }

    return { attempted: pending.length, succeeded, failed };
};

// ────────────────────────────────────────────────────────────────────────────
// Auto replay (à appeler une fois au boot)
// ────────────────────────────────────────────────────────────────────────────

let autoReplayInstalled = false;
let autoIntervalId: number | null = null;

export const installAutoReplay = (post: PostFn, onResult?: (r: ReplayResult) => void): (() => void) => {
    if (autoReplayInstalled) {
        return () => {};
    }
    autoReplayInstalled = true;

    const run = async () => {
        try {
            const result = await replayPending(post);
            if (result.attempted > 0 && onResult) onResult(result);
        } catch {
            /* silencieux */
        }
    };

    // Replay au démarrage
    void run();

    // Replay quand le réseau revient
    const onOnline = () => void run();
    window.addEventListener('online', onOnline);

    // Replay périodique 30s (au cas où l'event online ne fire pas, ou pour les
    // alertes ratées avec serveur down momentané)
    autoIntervalId = window.setInterval(() => void run(), 30_000);

    // Cleanup
    return () => {
        window.removeEventListener('online', onOnline);
        if (autoIntervalId !== null) {
            window.clearInterval(autoIntervalId);
            autoIntervalId = null;
        }
        autoReplayInstalled = false;
    };
};

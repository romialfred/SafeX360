/**
 * File d'attente chiffree des check-in d'evacuation hors-ligne.
 *
 * Les donnees personnelles et de geolocalisation sont chiffrees avant toute
 * ecriture IndexedDB. Les metadonnees minimales restent partitionnees par
 * utilisateur et mine afin d'interdire lecture, rejeu ou mutation croises.
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

const DB_NAME = 'safex-emergency-checkin';
const DB_VERSION = 2;
const STORE = 'pending_checkin';
const MAX_PENDING = 30;
const CRYPTO_PURPOSE = 'emergency-checkin';

export interface PendingCheckIn {
    id?: number;
    alertId: number;
    employeeId: number;
    assemblyPointId?: number | null;
    status: 'SAFE' | 'INJURED' | 'MISSING';
    latitude?: number | null;
    longitude?: number | null;
    gpsAccuracy?: number | null;
    note?: string | null;
    actorId?: number;
    enqueuedAt: string;
    attempts: number;
    lastError?: string;
}

type CheckInSensitivePayload = Omit<PendingCheckIn, 'id' | 'enqueuedAt' | 'attempts'>;

interface StoredPendingCheckIn extends OfflineOwnerContext {
    id?: number;
    enqueuedAt: string;
    attempts: number;
    cryptoId: string;
    encryptedSensitive: EncryptedOfflinePayload;
}

const openDb = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB indisponible'));
            return;
        }

        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (event) => {
            const db = req.result;
            const oldVersion = (event as IDBVersionChangeEvent).oldVersion;
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
            } else if (oldVersion < 2) {
                // Les entrees v1 etaient en clair et non partitionnees. Leur
                // proprietaire ne peut pas etre prouve : purge fail-closed.
                req.transaction?.objectStore(STORE).clear();
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

const readAllStored = async (): Promise<StoredPendingCheckIn[]> => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () => resolve((req.result as StoredPendingCheckIn[]) ?? []);
        req.onerror = () => reject(req.error);
    });
};

const decryptEntry = async (
    stored: StoredPendingCheckIn,
    owner: OfflineOwnerContext,
): Promise<PendingCheckIn> => {
    if (!belongsToOfflineOwner(stored, owner)) {
        throw new Error('OFFLINE_PARTITION_MISMATCH');
    }

    const sensitive = await decryptOfflineJson<CheckInSensitivePayload>(
        owner,
        CRYPTO_PURPOSE,
        stored.cryptoId,
        stored.encryptedSensitive,
    );
    return {
        ...sensitive,
        id: stored.id,
        enqueuedAt: stored.enqueuedAt,
        attempts: stored.attempts,
    };
};

const encryptEntry = async (
    entry: PendingCheckIn,
    owner: OfflineOwnerContext,
): Promise<StoredPendingCheckIn> => {
    const { id, enqueuedAt, attempts, ...sensitive } = entry;
    const cryptoId = createOfflineCryptoId();
    return {
        id,
        enqueuedAt,
        attempts,
        ...owner,
        cryptoId,
        encryptedSensitive: await encryptOfflineJson(
            owner,
            CRYPTO_PURPOSE,
            cryptoId,
            sensitive,
        ),
    };
};

export const enqueueCheckIn = async (
    entry: Omit<PendingCheckIn, 'id' | 'enqueuedAt' | 'attempts'>,
): Promise<void> => {
    const owner = currentOfflineOwnerContext();
    const stored = await encryptEntry(
        { ...entry, enqueuedAt: new Date().toISOString(), attempts: 0 },
        owner,
    );
    const db = await openDb();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const all = store.getAll();
        all.onsuccess = () => {
            const owned = (all.result as StoredPendingCheckIn[])
                .filter((candidate) => belongsToOfflineOwner(candidate, owner))
                .sort((left, right) => left.enqueuedAt.localeCompare(right.enqueuedAt));

            if (owned.length >= MAX_PENDING && owned[0]?.id !== undefined) {
                store.delete(owned[0].id);
            }
            store.add(stored);
        };
        all.onerror = () => reject(all.error);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error ?? new Error('Transaction IndexedDB annulee'));
    });
};

export const listPendingCheckIns = async (): Promise<PendingCheckIn[]> => {
    try {
        const owner = currentOfflineOwnerContext();
        const stored = (await readAllStored()).filter((entry) => belongsToOfflineOwner(entry, owner));
        return await Promise.all(stored.map((entry) => decryptEntry(entry, owner)));
    } catch {
        return [];
    }
};

/** Supprime uniquement les pointages du compte/mine actifs. */
export const purgePendingCheckIns = async (): Promise<void> => {
    const owner = currentOfflineOwnerContext();
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const cursor = store.openCursor();
        cursor.onsuccess = () => {
            const current = cursor.result;
            if (!current) return;
            if (belongsToOfflineOwner(current.value as StoredPendingCheckIn, owner)) {
                current.delete();
            }
            current.continue();
        };
        cursor.onerror = () => reject(cursor.error);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

const assertActiveOwner = (expected: OfflineOwnerContext): void => {
    if (!belongsToOfflineOwner(currentOfflineOwnerContext(), expected)) {
        throw new Error('OFFLINE_ACCOUNT_CHANGED');
    }
};

const updateEntry = async (entry: PendingCheckIn, owner: OfflineOwnerContext): Promise<void> => {
    if (entry.id === undefined) throw new Error('OFFLINE_ENTRY_ID_REQUIRED');
    assertActiveOwner(owner);
    const encrypted = await encryptEntry(entry, owner);
    const db = await openDb();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const get = store.get(entry.id as number);
        get.onsuccess = () => {
            const current = get.result as StoredPendingCheckIn | undefined;
            if (!current || !belongsToOfflineOwner(current, owner)) {
                tx.abort();
                return;
            }
            store.put(encrypted);
        };
        get.onerror = () => reject(get.error);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error ?? new Error('OFFLINE_PARTITION_MISMATCH'));
    });
};

const deleteEntry = async (id: number, owner: OfflineOwnerContext): Promise<void> => {
    assertActiveOwner(owner);
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const get = store.get(id);
        get.onsuccess = () => {
            const current = get.result as StoredPendingCheckIn | undefined;
            if (!current || !belongsToOfflineOwner(current, owner)) {
                tx.abort();
                return;
            }
            store.delete(id);
        };
        get.onerror = () => reject(get.error);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error ?? new Error('OFFLINE_PARTITION_MISMATCH'));
    });
};

export type PostCheckInFn = (entry: PendingCheckIn) => Promise<unknown>;

export interface ReplayCheckInResult {
    attempted: number;
    succeeded: number;
    failed: number;
}

export const replayPendingCheckIns = async (post: PostCheckInFn): Promise<ReplayCheckInResult> => {
    const owner = currentOfflineOwnerContext();
    const pending = await listPendingCheckIns();
    let succeeded = 0;
    let failed = 0;

    for (const entry of pending) {
        try {
            assertActiveOwner(owner);
            await post(entry);
            assertActiveOwner(owner);
            if (entry.id !== undefined) await deleteEntry(entry.id, owner);
            succeeded++;
        } catch (error: unknown) {
            failed++;
            try {
                assertActiveOwner(owner);
                await updateEntry(
                    {
                        ...entry,
                        attempts: (entry.attempts ?? 0) + 1,
                        lastError: error instanceof Error ? error.message : 'Erreur inconnue',
                    },
                    owner,
                );
            } catch {
                // Un changement de compte ou une disparition de l'entree interdit
                // toute mutation. L'entree d'origine reste chiffree pour son compte.
            }
        }
    }
    return { attempted: pending.length, succeeded, failed };
};

let installed = false;
let intervalId: number | null = null;

export const installAutoReplayCheckIns = (
    post: PostCheckInFn,
    onResult?: (result: ReplayCheckInResult) => void,
): (() => void) => {
    if (installed) return () => {};
    installed = true;

    const run = async () => {
        try {
            const result = await replayPendingCheckIns(post);
            if (result.attempted > 0 && onResult) onResult(result);
        } catch {
            // La prochaine reconnexion/tentative reprendra la file du compte actif.
        }
    };

    void run();
    const onOnline = () => void run();
    window.addEventListener('online', onOnline);
    intervalId = window.setInterval(() => void run(), 30_000);

    return () => {
        window.removeEventListener('online', onOnline);
        if (intervalId !== null) {
            window.clearInterval(intervalId);
            intervalId = null;
        }
        installed = false;
    };
};

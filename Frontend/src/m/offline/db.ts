/**
 * SafeX 360 Field — Base de donnees offline (IndexedDB via `idb`).
 *
 * Conserve :
 *   - mutationQueue   : actions a synchroniser au reconnect (SOS, inspections, etc.)
 *   - inspectionCache : detail d'inspections recemment consultees
 *   - templateCache   : templates d'inspection (TTL 7 jours)
 *   - blastCache      : prochain tir confirme + alarme
 *   - userProfileCache: store legacy desactive et purge (aucun profil persiste)
 *   - photoQueue      : photos en attente d'upload (avec compression)
 *
 * idb 8.x est deja dans les dependencies du projet. La version du schema
 * est strictement croissante : a chaque changement de structure, incrementer
 * DB_VERSION et ajouter une etape dans `upgrade()`.
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import {
    belongsToOfflineOwner,
    createOfflineCryptoId,
    currentOfflineOwnerContext,
    decryptOfflineBlob,
    decryptOfflineJson,
    encryptOfflineBlob,
    encryptOfflineJson,
    offlinePartitionStorageKey,
    type EncryptedOfflinePayload,
} from '../../security/offlineVault';

const DB_NAME = 'safex360-field';
const DB_VERSION = 3;

export type MutationStatus = 'pending' | 'syncing' | 'done' | 'failed';

export interface MutationRecord {
    id?: number;
    createdAt: number;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    payload: unknown;
    headers?: Record<string, string>;
    retryCount: number;
    lastError?: string;
    status: MutationStatus;
    ownerKey: string;
    mineId: number;
    /** Type metier pour les statistiques + display indicateur. */
    kind: 'inspection.finding' | 'inspection.submit' | 'sos' | 'alert.general' | 'incident'
        | 'nonconformity' | 'ppe.request' | 'action.update' | 'other';
    /** Empreinte pour la deduplication (eviter d'enqueue 2x la meme action). */
    fingerprint?: string;
}

export interface CacheRecord<T = unknown> {
    id: number | string;
    payload: T;
    cachedAt: number;
    ttlMs?: number;
}

export interface PhotoRecord {
    id?: number;
    findingId?: number;
    /** Blob compresse (jpeg q70, 1024 px max). */
    blob: Blob;
    sizeBytes: number;
    createdAt: number;
    uploaded: boolean;
    ownerKey: string;
    mineId: number;
    /** Url de upload retournee par le backend une fois envoyee. */
    serverUrl?: string;
}

interface StoredMutationRecord extends Omit<MutationRecord, 'payload' | 'headers'> {
    cryptoId: string;
    encryptedRequest: EncryptedOfflinePayload;
}

interface StoredCacheRecord {
    id: string;
    logicalId: number | string;
    cachedAt: number;
    ttlMs?: number;
    ownerKey: string;
    mineId: number;
    cryptoId: string;
    encryptedPayload: EncryptedOfflinePayload;
}

interface StoredPhotoRecord extends Omit<PhotoRecord, 'blob'> {
    cryptoId: string;
    encryptedBlob: EncryptedOfflinePayload;
}

interface SafeXFieldDB extends DBSchema {
    mutationQueue: {
        key: number;
        value: StoredMutationRecord;
        indexes: { 'by-status': MutationStatus; 'by-kind': string; 'by-fingerprint': string };
    };
    inspectionCache: {
        key: string;
        value: StoredCacheRecord;
    };
    templateCache: {
        key: string;
        value: StoredCacheRecord;
    };
    blastCache: {
        key: string;
        value: StoredCacheRecord;
    };
    userProfileCache: {
        key: string;
        value: StoredCacheRecord;
    };
    photoQueue: {
        key: number;
        value: StoredPhotoRecord;
        indexes: { 'by-uploaded': number };
    };
}

let dbPromise: Promise<IDBPDatabase<SafeXFieldDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<SafeXFieldDB>> {
    if (!dbPromise) {
        dbPromise = openDB<SafeXFieldDB>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, _newVersion, transaction) {
                // v0 -> v1 : creation du schema initial
                if (oldVersion < 1) {
                    const m = db.createObjectStore('mutationQueue', {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    m.createIndex('by-status', 'status');
                    m.createIndex('by-kind', 'kind');
                    m.createIndex('by-fingerprint', 'fingerprint');

                    db.createObjectStore('inspectionCache', { keyPath: 'id' });
                    db.createObjectStore('templateCache', { keyPath: 'id' });
                    db.createObjectStore('blastCache', { keyPath: 'id' });
                    db.createObjectStore('userProfileCache', { keyPath: 'id' });

                    const p = db.createObjectStore('photoQueue', {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    p.createIndex('by-uploaded', 'uploaded');
                }
                // v2 : les anciennes saisies sans propriétaire ne peuvent pas
                // être attribuées de façon sûre ; purge de migration unique.
                if (oldVersion < 2) {
                    transaction.objectStore('mutationQueue').clear();
                    transaction.objectStore('photoQueue').clear();
                }
                // v3 : aucune valeur legacy en clair ne peut être migrée de
                // manière sûre. Toutes les queues et caches sont purgés une fois.
                if (oldVersion < 3) {
                    for (const name of [
                        'mutationQueue',
                        'photoQueue',
                        'inspectionCache',
                        'templateCache',
                        'blastCache',
                        'userProfileCache',
                    ] as const) {
                        transaction.objectStore(name).clear();
                    }
                }
            },
            blocked() {
                console.warn('[SafeXField DB] Open blocked — un autre onglet utilise une version ancienne.');
            },
            blocking() {
                console.warn('[SafeXField DB] Blocking une nouvelle version — fermeture de la connexion.');
            },
        });
    }
    return dbPromise;
}

// ─────────────────────────────────────────────────────────────────────────
//  Helpers cache (CacheRecord<T> generique)
// ─────────────────────────────────────────────────────────────────────────

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

export type FieldCacheStore =
    | 'inspectionCache'
    | 'templateCache'
    | 'blastCache'
    | 'userProfileCache';

export async function cacheGet<T>(
    store: FieldCacheStore,
    id: number | string,
): Promise<T | null> {
    // Les profils personnels (médical, dosimétrie, EPI, formations) ne sont
    // jamais persistés : ils doivent être relus depuis la source authentifiée.
    if (store === 'userProfileCache') return null;
    const owner = currentOfflineOwnerContext();
    const db = await getDB();
    const storageId = await offlinePartitionStorageKey(owner, store, id);
    const rec = await db.get(store, storageId) as StoredCacheRecord | undefined;
    if (!rec) return null;
    if (!belongsToOfflineOwner(rec, owner)) return null;
    const ttl = rec.ttlMs ?? DEFAULT_TTL_MS;
    if (Date.now() - rec.cachedAt > ttl) {
        // Expire : on ne le supprime pas systematiquement, on retourne null
        // et le sync engine se chargera de re-fetcher.
        return null;
    }
    return decryptOfflineJson<T>(owner, `field-cache:${store}`, rec.cryptoId, rec.encryptedPayload);
}

export async function cachePut<T>(
    store: FieldCacheStore,
    id: number | string,
    payload: T,
    ttlMs?: number,
): Promise<void> {
    if (store === 'userProfileCache') {
        const db = await getDB();
        // Nettoie également toute donnée issue d'une version antérieure.
        await db.clear('userProfileCache');
        return;
    }
    const owner = currentOfflineOwnerContext();
    const cryptoId = createOfflineCryptoId();
    const storageId = await offlinePartitionStorageKey(owner, store, id);
    const encryptedPayload = await encryptOfflineJson(owner, `field-cache:${store}`, cryptoId, payload);
    const db = await getDB();
    await db.put(store, {
        id: storageId,
        logicalId: id,
        cachedAt: Date.now(),
        ttlMs,
        ...owner,
        cryptoId,
        encryptedPayload,
    } as StoredCacheRecord);
}

export async function cacheClear(
    store: FieldCacheStore,
): Promise<void> {
    if (store === 'userProfileCache') {
        await (await getDB()).clear('userProfileCache');
        return;
    }
    const owner = currentOfflineOwnerContext();
    const db = await getDB();
    const entries = await db.getAll(store) as StoredCacheRecord[];
    const tx = db.transaction(store, 'readwrite');
    for (const entry of entries.filter((candidate) => belongsToOfflineOwner(candidate, owner))) {
        await tx.store.delete(entry.id);
    }
    await tx.done;
}

export interface FieldSecurityPurgeResult {
    preservedMutations: number;
    preservedPhotos: number;
}

/**
 * Purge les donnees locales consultables lors d'une fin de session.
 *
 * Par defaut, les saisies non synchronisees sont conservees pour eviter une
 * perte silencieuse de SOS, constats ou photos. Une purge destructive reste
 * disponible, mais ne doit etre appelee qu'apres un avertissement explicite.
 */
export async function purgeFieldSecurityState(
    preserveUnsynced = true,
): Promise<FieldSecurityPurgeResult> {
    const db = await getDB();
    let owner: ReturnType<typeof currentOfflineOwnerContext> | null = null;
    try { owner = currentOfflineOwnerContext(); } catch { /* session déjà effacée */ }
    const cacheStores: Array<'inspectionCache' | 'templateCache' | 'blastCache' | 'userProfileCache'> = [
        'inspectionCache',
        'templateCache',
        'blastCache',
        'userProfileCache',
    ];

    const [mutations, photos] = await Promise.all([
        db.getAll('mutationQueue'),
        db.getAll('photoQueue'),
    ]);

    const tx = db.transaction(
        [...cacheStores, 'mutationQueue', 'photoQueue'],
        'readwrite',
    );
    await Promise.all(cacheStores.map((store) => tx.objectStore(store).clear()));

    if (owner) {
        for (const mutation of mutations) {
            if (belongsToOfflineOwner(mutation, owner)
                    && (!preserveUnsynced || mutation.status === 'done')
                    && mutation.id !== undefined) {
                await tx.objectStore('mutationQueue').delete(mutation.id);
            }
        }
        for (const photo of photos) {
            if (belongsToOfflineOwner(photo, owner)
                    && (!preserveUnsynced || photo.uploaded)
                    && photo.id !== undefined) {
                await tx.objectStore('photoQueue').delete(photo.id);
            }
        }
    }

    await tx.done;
    return {
        preservedMutations: preserveUnsynced
            ? mutations.filter((mutation) => mutation.status !== 'done'
                && owner && belongsToOfflineOwner(mutation, owner)).length
            : 0,
        preservedPhotos: preserveUnsynced
            ? photos.filter((photo) => !photo.uploaded
                && owner && belongsToOfflineOwner(photo, owner)).length
            : 0,
    };
}

// ─────────────────────────────────────────────────────────────────────────
//  Helpers mutation queue
// ─────────────────────────────────────────────────────────────────────────

export async function queueEnqueue(
    mutation: Omit<MutationRecord, 'id' | 'createdAt' | 'retryCount' | 'status' | 'ownerKey' | 'mineId'>,
): Promise<number> {
    const owner = currentOfflineOwnerContext();
    const db = await getDB();
    const partitionedFingerprint = mutation.fingerprint
        ? await offlinePartitionStorageKey(owner, 'field-fingerprint', mutation.fingerprint)
        : undefined;
    // Deduplication par fingerprint (eviter 2x le meme SOS)
    if (partitionedFingerprint) {
        const existing = await db.getFromIndex(
            'mutationQueue',
            'by-fingerprint',
            partitionedFingerprint,
        );
        if (existing && belongsToOfflineOwner(existing, owner) && existing.status === 'pending') {
            return existing.id!;
        }
    }
    const cryptoId = createOfflineCryptoId();
    const encryptedRequest = await encryptOfflineJson(owner, 'field-mutation', cryptoId, {
        payload: mutation.payload,
        headers: mutation.headers,
    });
    const id = await db.add('mutationQueue', {
        endpoint: mutation.endpoint,
        method: mutation.method,
        lastError: mutation.lastError,
        kind: mutation.kind,
        fingerprint: partitionedFingerprint,
        createdAt: Date.now(),
        retryCount: 0,
        status: 'pending',
        ...owner,
        cryptoId,
        encryptedRequest,
    });
    return id as number;
}

const decryptMutation = async (
    entry: StoredMutationRecord,
    owner: ReturnType<typeof currentOfflineOwnerContext>,
): Promise<MutationRecord> => {
    if (!belongsToOfflineOwner(entry, owner)) throw new Error('OFFLINE_ENTRY_FORBIDDEN');
    const request = await decryptOfflineJson<{ payload: unknown; headers?: Record<string, string> }>(
        owner,
        'field-mutation',
        entry.cryptoId,
        entry.encryptedRequest,
    );
    return {
        id: entry.id,
        createdAt: entry.createdAt,
        endpoint: entry.endpoint,
        method: entry.method,
        payload: request.payload,
        headers: request.headers,
        retryCount: entry.retryCount,
        lastError: entry.lastError,
        status: entry.status,
        ownerKey: entry.ownerKey,
        mineId: entry.mineId,
        kind: entry.kind,
        fingerprint: entry.fingerprint,
    };
};

export async function queuePending(): Promise<MutationRecord[]> {
    const owner = currentOfflineOwnerContext();
    const db = await getDB();
    const entries = (await db.getAllFromIndex('mutationQueue', 'by-status', 'pending'))
        .filter((entry) => belongsToOfflineOwner(entry, owner));
    return Promise.all(entries.map((entry) => decryptMutation(entry, owner)));
}

export async function queueCountByStatus(status: MutationStatus): Promise<number> {
    const owner = currentOfflineOwnerContext();
    const db = await getDB();
    return (await db.getAllFromIndex('mutationQueue', 'by-status', status))
        .filter((entry) => belongsToOfflineOwner(entry, owner)).length;
}

export async function queueUpdate(
    id: number,
    patch: Partial<Omit<MutationRecord, 'id' | 'ownerKey' | 'mineId' | 'payload' | 'headers' | 'fingerprint'>>,
): Promise<void> {
    const owner = currentOfflineOwnerContext();
    const db = await getDB();
    const existing = await db.get('mutationQueue', id);
    if (!existing || !belongsToOfflineOwner(existing, owner)) throw new Error('OFFLINE_ENTRY_FORBIDDEN');
    await db.put('mutationQueue', { ...existing, ...patch, id });
}

export async function queueCleanupDone(olderThanMs = 7 * 24 * 3600 * 1000): Promise<number> {
    const owner = currentOfflineOwnerContext();
    const db = await getDB();
    const all = await db.getAllFromIndex('mutationQueue', 'by-status', 'done');
    const cutoff = Date.now() - olderThanMs;
    const toDelete = all.filter((m) => belongsToOfflineOwner(m, owner) && m.createdAt < cutoff);
    const tx = db.transaction('mutationQueue', 'readwrite');
    for (const m of toDelete) {
        if (m.id !== undefined) await tx.store.delete(m.id);
    }
    await tx.done;
    return toDelete.length;
}

/**
 * Requalifie les mutations restees en 'syncing' en 'pending'.
 * A appeler au boot : si l'app est tuee en plein envoi, la mutation reste
 * orpheline en 'syncing' pour toujours et n'est jamais rejouee (queuePending
 * ne remonte que les 'pending'). Retourne le nombre de mutations requalifiees.
 *
 * Garde-fou anti-doublon : seules les mutations 'syncing' de plus de
 * 60 secondes (createdAt) sont requalifiees — une mutation plus recente
 * est probablement encore reellement en vol dans un autre contexte
 * (autre onglet, run concurrent) et la re-passer en 'pending' pourrait
 * la rejouer deux fois cote serveur.
 */
export async function queueResetSyncing(): Promise<number> {
    const owner = currentOfflineOwnerContext();
    const db = await getDB();
    const orphans = await db.getAllFromIndex('mutationQueue', 'by-status', 'syncing');
    const cutoff = Date.now() - 60_000;
    const stale = orphans.filter((m) => belongsToOfflineOwner(m, owner) && m.createdAt < cutoff);
    const tx = db.transaction('mutationQueue', 'readwrite');
    for (const m of stale) {
        if (m.id !== undefined) await tx.store.put({ ...m, status: 'pending' });
    }
    await tx.done;
    return stale.length;
}

// ─────────────────────────────────────────────────────────────────────────
//  Helpers photo queue
// ─────────────────────────────────────────────────────────────────────────

export async function photoEnqueue(
    rec: Omit<PhotoRecord, 'id' | 'createdAt' | 'uploaded' | 'ownerKey' | 'mineId'>,
): Promise<number> {
    const owner = currentOfflineOwnerContext();
    const cryptoId = createOfflineCryptoId();
    const encryptedBlob = await encryptOfflineBlob(owner, 'field-photo', cryptoId, rec.blob);
    const db = await getDB();
    const id = await db.add('photoQueue', {
        findingId: rec.findingId,
        sizeBytes: rec.sizeBytes,
        serverUrl: rec.serverUrl,
        createdAt: Date.now(),
        uploaded: false,
        ...owner,
        cryptoId,
        encryptedBlob,
    });
    return id as number;
}

export async function photoPendingCount(): Promise<number> {
    const owner = currentOfflineOwnerContext();
    const db = await getDB();
    // 0 = false ; les index booleens IDB sont en numeriques
    return (await db.getAllFromIndex('photoQueue', 'by-uploaded', IDBKeyRange.only(0)))
        .filter((entry) => belongsToOfflineOwner(entry, owner)).length;
}

/** Retourne toutes les photos non encore uploadees (FIFO par createdAt). */
export async function photoPending(): Promise<PhotoRecord[]> {
    const owner = currentOfflineOwnerContext();
    const db = await getDB();
    // IDB index booleen : 0 = false
    const all = await db.getAllFromIndex('photoQueue', 'by-uploaded', IDBKeyRange.only(0));
    const owned = all.filter((entry) => belongsToOfflineOwner(entry, owner))
        .sort((a, b) => a.createdAt - b.createdAt);
    return Promise.all(owned.map(async (entry) => {
        const blob = await decryptOfflineBlob(owner, 'field-photo', entry.cryptoId, entry.encryptedBlob);
        return {
            id: entry.id,
            findingId: entry.findingId,
            blob,
            sizeBytes: entry.sizeBytes,
            createdAt: entry.createdAt,
            uploaded: entry.uploaded,
            ownerKey: entry.ownerKey,
            mineId: entry.mineId,
            serverUrl: entry.serverUrl,
        };
    }));
}

/** Marque une photo comme uploadee (avec optionnellement l'url serveur). */
export async function photoMarkUploaded(id: number, serverUrl?: string): Promise<void> {
    const owner = currentOfflineOwnerContext();
    const db = await getDB();
    const existing = await db.get('photoQueue', id);
    if (!existing || !belongsToOfflineOwner(existing, owner)) throw new Error('OFFLINE_ENTRY_FORBIDDEN');
    await db.put('photoQueue', {
        ...existing,
        uploaded: true,
        serverUrl,
    });
}

/** Supprime une photo (ex. apres upload + acquittement metier). */
export async function photoDelete(id: number): Promise<void> {
    const owner = currentOfflineOwnerContext();
    const db = await getDB();
    const existing = await db.get('photoQueue', id);
    if (!existing || !belongsToOfflineOwner(existing, owner)) throw new Error('OFFLINE_ENTRY_FORBIDDEN');
    await db.delete('photoQueue', id);
}

// ─────────────────────────────────────────────────────────────────────────
//  Helpers mutation queue — etats avances (failed/syncing) pour M4
// ─────────────────────────────────────────────────────────────────────────

/** Recupere toutes les mutations en echec definitif (pour UI conflit). */
export async function queueFailed(): Promise<MutationRecord[]> {
    const owner = currentOfflineOwnerContext();
    const db = await getDB();
    const entries = (await db.getAllFromIndex('mutationQueue', 'by-status', 'failed'))
        .filter((entry) => belongsToOfflineOwner(entry, owner));
    return Promise.all(entries.map((entry) => decryptMutation(entry, owner)));
}

/** Replace une mutation 'failed' en 'pending' pour relancer (action user). */
export async function queueRetry(id: number): Promise<void> {
    const owner = currentOfflineOwnerContext();
    const db = await getDB();
    const existing = await db.get('mutationQueue', id);
    if (!existing || !belongsToOfflineOwner(existing, owner)) throw new Error('OFFLINE_ENTRY_FORBIDDEN');
    await db.put('mutationQueue', {
        ...existing,
        status: 'pending',
        retryCount: 0,
        lastError: undefined,
    });
}

/** Supprime une mutation de la queue (action user "abandonner"). */
export async function queueDelete(id: number): Promise<void> {
    const owner = currentOfflineOwnerContext();
    const db = await getDB();
    const existing = await db.get('mutationQueue', id);
    if (!existing || !belongsToOfflineOwner(existing, owner)) throw new Error('OFFLINE_ENTRY_FORBIDDEN');
    await db.delete('mutationQueue', id);
}

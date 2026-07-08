/**
 * SafeX 360 Field — Base de donnees offline (IndexedDB via `idb`).
 *
 * Conserve :
 *   - mutationQueue   : actions a synchroniser au reconnect (SOS, inspections, etc.)
 *   - inspectionCache : detail d'inspections recemment consultees
 *   - templateCache   : templates d'inspection (TTL 7 jours)
 *   - blastCache      : prochain tir confirme + alarme
 *   - userProfileCache: profil HSE perso (EPI, formations, dosimetrie)
 *   - photoQueue      : photos en attente d'upload (avec compression)
 *
 * idb 8.x est deja dans les dependencies du projet. La version du schema
 * est strictement croissante : a chaque changement de structure, incrementer
 * DB_VERSION et ajouter une etape dans `upgrade()`.
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

const DB_NAME = 'safex360-field';
const DB_VERSION = 1;

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
    /** Url de upload retournee par le backend une fois envoyee. */
    serverUrl?: string;
}

interface SafeXFieldDB extends DBSchema {
    mutationQueue: {
        key: number;
        value: MutationRecord;
        indexes: { 'by-status': MutationStatus; 'by-kind': string; 'by-fingerprint': string };
    };
    inspectionCache: {
        key: number;
        value: CacheRecord;
    };
    templateCache: {
        key: number;
        value: CacheRecord;
    };
    blastCache: {
        key: string;
        value: CacheRecord;
    };
    userProfileCache: {
        key: number;
        value: CacheRecord;
    };
    photoQueue: {
        key: number;
        value: PhotoRecord;
        indexes: { 'by-uploaded': number };
    };
}

let dbPromise: Promise<IDBPDatabase<SafeXFieldDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<SafeXFieldDB>> {
    if (!dbPromise) {
        dbPromise = openDB<SafeXFieldDB>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion) {
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

export async function cacheGet<T>(
    store: string,
    id: number | string,
): Promise<T | null> {
    const db = await getDB();
    const rec = await db.get(store as any, id as any);
    if (!rec) return null;
    const ttl = rec.ttlMs ?? DEFAULT_TTL_MS;
    if (Date.now() - rec.cachedAt > ttl) {
        // Expire : on ne le supprime pas systematiquement, on retourne null
        // et le sync engine se chargera de re-fetcher.
        return null;
    }
    return rec.payload as T;
}

export async function cachePut<T>(
    store: string,
    id: number | string,
    payload: T,
    ttlMs?: number,
): Promise<void> {
    const db = await getDB();
    await db.put(store as any, {
        id: id as any,
        payload,
        cachedAt: Date.now(),
        ttlMs,
    });
}

export async function cacheClear(
    store: string,
): Promise<void> {
    const db = await getDB();
    await db.clear(store as any);
}

// ─────────────────────────────────────────────────────────────────────────
//  Helpers mutation queue
// ─────────────────────────────────────────────────────────────────────────

export async function queueEnqueue(
    mutation: Omit<MutationRecord, 'id' | 'createdAt' | 'retryCount' | 'status'>,
): Promise<number> {
    const db = await getDB();
    // Deduplication par fingerprint (eviter 2x le meme SOS)
    if (mutation.fingerprint) {
        const existing = await db.getFromIndex(
            'mutationQueue',
            'by-fingerprint',
            mutation.fingerprint,
        );
        if (existing && existing.status === 'pending') {
            return existing.id!;
        }
    }
    const id = await db.add('mutationQueue', {
        ...mutation,
        createdAt: Date.now(),
        retryCount: 0,
        status: 'pending',
    });
    return id as number;
}

export async function queuePending(): Promise<MutationRecord[]> {
    const db = await getDB();
    return db.getAllFromIndex('mutationQueue', 'by-status', 'pending');
}

export async function queueCountByStatus(status: MutationStatus): Promise<number> {
    const db = await getDB();
    return db.countFromIndex('mutationQueue', 'by-status', status);
}

export async function queueUpdate(
    id: number,
    patch: Partial<MutationRecord>,
): Promise<void> {
    const db = await getDB();
    const existing = await db.get('mutationQueue', id);
    if (!existing) return;
    await db.put('mutationQueue', { ...existing, ...patch, id });
}

export async function queueCleanupDone(olderThanMs = 7 * 24 * 3600 * 1000): Promise<number> {
    const db = await getDB();
    const all = await db.getAllFromIndex('mutationQueue', 'by-status', 'done');
    const cutoff = Date.now() - olderThanMs;
    const toDelete = all.filter((m) => m.createdAt < cutoff);
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
    const db = await getDB();
    const orphans = await db.getAllFromIndex('mutationQueue', 'by-status', 'syncing');
    const cutoff = Date.now() - 60_000;
    const stale = orphans.filter((m) => m.createdAt < cutoff);
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

export async function photoEnqueue(rec: Omit<PhotoRecord, 'id' | 'createdAt' | 'uploaded'>): Promise<number> {
    const db = await getDB();
    const id = await db.add('photoQueue', {
        ...rec,
        createdAt: Date.now(),
        uploaded: false,
    });
    return id as number;
}

export async function photoPendingCount(): Promise<number> {
    const db = await getDB();
    // 0 = false ; les index booleens IDB sont en numeriques
    return db.countFromIndex('photoQueue', 'by-uploaded', IDBKeyRange.only(0));
}

/** Retourne toutes les photos non encore uploadees (FIFO par createdAt). */
export async function photoPending(): Promise<PhotoRecord[]> {
    const db = await getDB();
    // IDB index booleen : 0 = false
    const all = await db.getAllFromIndex('photoQueue', 'by-uploaded', IDBKeyRange.only(0));
    return all.sort((a, b) => a.createdAt - b.createdAt);
}

/** Marque une photo comme uploadee (avec optionnellement l'url serveur). */
export async function photoMarkUploaded(id: number, serverUrl?: string): Promise<void> {
    const db = await getDB();
    const existing = await db.get('photoQueue', id);
    if (!existing) return;
    await db.put('photoQueue', {
        ...existing,
        uploaded: true,
        serverUrl,
    });
}

/** Supprime une photo (ex. apres upload + acquittement metier). */
export async function photoDelete(id: number): Promise<void> {
    const db = await getDB();
    await db.delete('photoQueue', id);
}

// ─────────────────────────────────────────────────────────────────────────
//  Helpers mutation queue — etats avances (failed/syncing) pour M4
// ─────────────────────────────────────────────────────────────────────────

/** Recupere toutes les mutations en echec definitif (pour UI conflit). */
export async function queueFailed(): Promise<MutationRecord[]> {
    const db = await getDB();
    return db.getAllFromIndex('mutationQueue', 'by-status', 'failed');
}

/** Replace une mutation 'failed' en 'pending' pour relancer (action user). */
export async function queueRetry(id: number): Promise<void> {
    const db = await getDB();
    const existing = await db.get('mutationQueue', id);
    if (!existing) return;
    await db.put('mutationQueue', {
        ...existing,
        status: 'pending',
        retryCount: 0,
        lastError: undefined,
    });
}

/** Supprime une mutation de la queue (action user "abandonner"). */
export async function queueDelete(id: number): Promise<void> {
    const db = await getDB();
    await db.delete('mutationQueue', id);
}

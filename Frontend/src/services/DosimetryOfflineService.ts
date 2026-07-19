/**
 * DosimetryOfflineService — Phase 10-B Frontend (Module Dosimetrie).
 *
 * Persistance IndexedDB des saisies terrain (doses individuelles + mesures
 * d'ambiance) lorsqu'aucune connexion reseau n'est disponible, avec
 * resynchronisation automatique au retour en ligne.
 *
 * <p><b>Cas d'usage</b> :
 *  - Saisie d'une dose en galerie / zone confinee sans signal — la dose est
 *    persistee localement et envoyee au backend des que la connectivite
 *    revient.
 *  - Sauvegarde defensive : meme en ligne, si une erreur reseau intermittente
 *    survient au submit, on bascule sur le queueing local pour ne pas perdre
 *    la saisie.
 *
 * <p><b>Architecture</b> :
 *  - Database IndexedDB : {@code safex_dosimetry_offline} (version 4).
 *  - Stores :
 *      - {@code queued_doses}        : doses en attente d'envoi.
 *      - {@code synced_doses}        : store historique conservé uniquement
 *        pour migration/purge ; aucune donnée synchronisée nouvelle n'y est écrite.
 *      - {@code queued_measurements} : mesures d'ambiance en attente.
 *  - Chaque entree porte un id local (UUID), un timestamp et un compteur
 *    d'essais d'envoi (utile pour limiter le retry en cas d'erreur 4xx
 *    persistante : ex. workerId invalide).
 *
 * <p><b>Strategie de sync</b> :
 *  - {@link syncPending} tente un POST par entree dans l'ordre chronologique
 *    et supprime immédiatement la copie locale après acquittement serveur.
 *  - En cas d'echec, l'entree reste dans la queue et son {@code attempts} est
 *    incremente. Au-dela de 5 tentatives, l'entree est marquee
 *    {@code blocked} (UI doit la signaler pour resolution manuelle).
 *
 * <p>Aucune dependance externe lourde : utilise la lib {@code idb} (5 KB
 * gzipped) qui wraps l'API IndexedDB native dans une interface Promise.
 *
 * <p>Toutes les operations sont safe par defaut (try/catch + fallback en
 * memoire si IndexedDB n'est pas disponible — ex. mode privacy / SSR).
 */

import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import {
    belongsToOfflineOwner,
    createOfflineCryptoId,
    currentOfflineOwnerContext,
    decryptOfflineJson,
    encryptOfflineJson,
    type EncryptedOfflinePayload,
} from '../security/offlineVault';
import {
    createDoseRecord,
    recordAmbientMeasurement,
    type DoseRecordDTO,
    type AmbientMeasurementDTO,
} from './DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  Schema IndexedDB
// ─────────────────────────────────────────────────────────────────────────────

/** Statut d'une entree dans la queue offline. */
export type OfflineEntryStatus = 'pending' | 'syncing' | 'blocked';

/**
 * Wrapper persistant pour une dose en attente.
 * - {@code id} : UUID local genere a la creation (cle primaire).
 * - {@code createdAt} : timestamp ISO de la creation locale.
 * - {@code attempts} : nb d'essais de sync (limite a 5).
 * - {@code lastError} : message d'erreur du dernier essai (optionnel).
 * - {@code status} : pending | syncing | blocked.
 * - {@code payload} : DoseRecordDTO exact a envoyer au backend.
 */
export interface QueuedDoseEntry {
    id: string;
    createdAt: string;
    attempts: number;
    lastError?: string | null;
    status: OfflineEntryStatus;
    /** Partition de sécurité : identité et mine actives lors de la saisie. */
    ownerKey: string;
    mineId: number;
    payload: DoseRecordDTO;
}

/** Wrapper persistant pour une mesure d'ambiance en attente (meme structure). */
export interface QueuedMeasurementEntry {
    id: string;
    createdAt: string;
    attempts: number;
    lastError?: string | null;
    status: OfflineEntryStatus;
    ownerKey: string;
    mineId: number;
    payload: AmbientMeasurementDTO;
}

interface StoredQueuedDoseEntry extends Omit<QueuedDoseEntry, 'payload'> {
    cryptoId: string;
    encryptedPayload: EncryptedOfflinePayload;
}

interface StoredQueuedMeasurementEntry extends Omit<QueuedMeasurementEntry, 'payload'> {
    cryptoId: string;
    encryptedPayload: EncryptedOfflinePayload;
}

/** Wrapper persistant pour une entree synchronisee (archive). */
export interface SyncedEntry<T> {
    id: string;
    createdAt: string;
    syncedAt: string;
    payload: T;
}

interface DosimetryOfflineSchema extends DBSchema {
    queued_doses: {
        key: string;
        value: StoredQueuedDoseEntry;
    };
    synced_doses: {
        key: string;
        value: SyncedEntry<DoseRecordDTO>;
    };
    queued_measurements: {
        key: string;
        value: StoredQueuedMeasurementEntry;
    };
}

const DB_NAME = 'safex_dosimetry_offline';
const DB_VERSION = 4;
const MAX_ATTEMPTS = 5;

// ─────────────────────────────────────────────────────────────────────────────
//  Ouverture differee (lazy) — singleton de la Promise<IDBPDatabase>
// ─────────────────────────────────────────────────────────────────────────────

let dbPromise: Promise<IDBPDatabase<DosimetryOfflineSchema>> | null = null;

/**
 * Indique si l'environnement courant supporte IndexedDB.
 * Faux en SSR / certains workers / mode privacy strict.
 */
const isIndexedDbAvailable = (): boolean => {
    try {
        return typeof indexedDB !== 'undefined' && indexedDB !== null;
    } catch {
        return false;
    }
};

const getDb = async (): Promise<IDBPDatabase<DosimetryOfflineSchema>> => {
    if (!isIndexedDbAvailable()) {
        throw new Error('IndexedDB not available in this environment');
    }
    if (!dbPromise) {
        dbPromise = openDB<DosimetryOfflineSchema>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, _newVersion, transaction) {
                if (!db.objectStoreNames.contains('queued_doses')) {
                    db.createObjectStore('queued_doses', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('synced_doses')) {
                    db.createObjectStore('synced_doses', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('queued_measurements')) {
                    db.createObjectStore('queued_measurements', { keyPath: 'id' });
                }
                // v3 : purge unique des anciennes files non partitionnées. Le
                // terminal ne doit jamais attribuer une saisie legacy au compte suivant.
                if (oldVersion < 3) {
                    for (const name of ['queued_doses', 'synced_doses', 'queued_measurements'] as const) {
                        if (db.objectStoreNames.contains(name)) transaction.objectStore(name).clear();
                    }
                }
                // v4 : purge des payloads partitionnés mais encore stockés en
                // clair par la version 3. Aucune migration cryptographique ne
                // doit attribuer silencieusement une dose à une autre session.
                if (oldVersion < 4) {
                    for (const name of ['queued_doses', 'synced_doses', 'queued_measurements'] as const) {
                        if (db.objectStoreNames.contains(name)) transaction.objectStore(name).clear();
                    }
                }
            },
        });
    }
    return dbPromise;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Genere un identifiant local unique (UUID v4 si l'API native est dispo,
 * sinon repli sur un id pseudo-aleatoire base sur timestamp + Math.random).
 */
const generateId = (): string => {
    try {
        if (
            typeof crypto !== 'undefined' &&
            typeof (crypto as Crypto).randomUUID === 'function'
        ) {
            return (crypto as Crypto).randomUUID();
        }
    } catch {
        // ignore
    }
    const ts = Date.now().toString(36);
    const rnd = Math.random().toString(36).slice(2, 10);
    return `local-${ts}-${rnd}`;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ajoute une dose a la queue d'envoi local. Retourne l'id local genere
 * (utile pour permettre une suppression / retry cible depuis l'UI).
 *
 * <p>Idempotence : il appartient a l'appelant de NE PAS appeler cette
 * methode deux fois pour une meme saisie (sinon doublon a la sync).
 */
export const queueDose = async (dose: DoseRecordDTO): Promise<string> => {
    const owner = currentOfflineOwnerContext();
    const id = generateId();
    const cryptoId = createOfflineCryptoId();
    const entry: StoredQueuedDoseEntry = {
        id,
        createdAt: new Date().toISOString(),
        attempts: 0,
        status: 'pending',
        ...owner,
        cryptoId,
        encryptedPayload: await encryptOfflineJson(owner, 'dosimetry-dose', cryptoId, dose),
    };
    const db = await getDb();
    await db.put('queued_doses', entry);
    return id;
};

/**
 * Ajoute une mesure d'ambiance a la queue d'envoi local. Meme contrat que
 * {@link queueDose}.
 */
export const queueMeasurement = async (
    measurement: AmbientMeasurementDTO,
): Promise<string> => {
    const owner = currentOfflineOwnerContext();
    const id = generateId();
    const cryptoId = createOfflineCryptoId();
    const entry: StoredQueuedMeasurementEntry = {
        id,
        createdAt: new Date().toISOString(),
        attempts: 0,
        status: 'pending',
        ...owner,
        cryptoId,
        encryptedPayload: await encryptOfflineJson(owner, 'dosimetry-measurement', cryptoId, measurement),
    };
    const db = await getDb();
    await db.put('queued_measurements', entry);
    return id;
};

/**
 * Liste les entrees en attente (pending OU blocked) — utile pour afficher
 * la queue dans l'UI (ex. liste a retenter).
 */
export const listPendingDoses = async (): Promise<QueuedDoseEntry[]> => {
    if (!isIndexedDbAvailable()) return [];
    const owner = currentOfflineOwnerContext();
    const db = await getDb();
    const entries = (await db.getAll('queued_doses'))
        .filter((entry) => belongsToOfflineOwner(entry, owner));
    return Promise.all(entries.map(async (entry) => {
        const payload = await decryptOfflineJson<DoseRecordDTO>(
            owner, 'dosimetry-dose', entry.cryptoId, entry.encryptedPayload,
        );
        return {
            id: entry.id,
            createdAt: entry.createdAt,
            attempts: entry.attempts,
            lastError: entry.lastError,
            status: entry.status,
            ownerKey: entry.ownerKey,
            mineId: entry.mineId,
            payload,
        };
    }));
};

export const listPendingMeasurements = async (): Promise<QueuedMeasurementEntry[]> => {
    if (!isIndexedDbAvailable()) return [];
    const owner = currentOfflineOwnerContext();
    const db = await getDb();
    const entries = (await db.getAll('queued_measurements'))
        .filter((entry) => belongsToOfflineOwner(entry, owner));
    return Promise.all(entries.map(async (entry) => {
        const payload = await decryptOfflineJson<AmbientMeasurementDTO>(
            owner, 'dosimetry-measurement', entry.cryptoId, entry.encryptedPayload,
        );
        return {
            id: entry.id,
            createdAt: entry.createdAt,
            attempts: entry.attempts,
            lastError: entry.lastError,
            status: entry.status,
            ownerKey: entry.ownerKey,
            mineId: entry.mineId,
            payload,
        };
    }));
};

/**
 * Compte rapide des entrees en attente (pour le banner topbar).
 * Retourne {0,0} si IndexedDB indisponible.
 */
export const getPendingCount = async (): Promise<{
    doses: number;
    measurements: number;
}> => {
    if (!isIndexedDbAvailable()) return { doses: 0, measurements: 0 };
    try {
        const [doses, measurements] = await Promise.all([
            listPendingDoses(),
            listPendingMeasurements(),
        ]);
        return { doses: doses.length, measurements: measurements.length };
    } catch {
        return { doses: 0, measurements: 0 };
    }
};

/**
 * Resultat agrege d'une session de synchronisation.
 */
export interface SyncResult {
    success: number;
    failed: number;
    blocked: number;
}

const syncErrorMessage = (error: unknown): string => {
    if (typeof error !== 'object' || error === null) return 'sync_failed';
    const candidate = error as {
        message?: unknown;
        response?: { data?: { errorMessage?: unknown; message?: unknown } };
    };
    const serverMessage = candidate.response?.data?.errorMessage
        ?? candidate.response?.data?.message
        ?? candidate.message;
    return typeof serverMessage === 'string' && serverMessage.trim()
        ? serverMessage
        : 'sync_failed';
};

/**
 * Synchronise toutes les entrees en attente (doses + mesures). Tente un
 * envoi par entree dans l'ordre chronologique. Les entrees envoyees avec
 * succes sont supprimés du terminal après acquittement serveur. Les echecs voient leur {@code attempts}
 * incremente ; au-dela de 5, l'entree est marquee {@code blocked} (UI doit
 * alors offrir une action de resolution manuelle / suppression).
 *
 * <p>Cette methode est safe a appeler meme offline : si {@code navigator.onLine}
 * est faux, on retourne immediatement {0,0,0} sans tenter d'envoi.
 */
export const syncPending = async (): Promise<SyncResult> => {
    if (!isIndexedDbAvailable()) {
        return { success: 0, failed: 0, blocked: 0 };
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return { success: 0, failed: 0, blocked: 0 };
    }

    const db = await getDb();
    const owner = currentOfflineOwnerContext();
    const result: SyncResult = { success: 0, failed: 0, blocked: 0 };

    const assertActiveOwner = () => {
        const active = currentOfflineOwnerContext();
        if (active.ownerKey !== owner.ownerKey || active.mineId !== owner.mineId) {
            throw new Error('OFFLINE_ENTRY_FORBIDDEN');
        }
    };

    const updateDoseMetadata = async (
        id: string,
        patch: Pick<QueuedDoseEntry, 'attempts' | 'lastError' | 'status'>,
    ) => {
        assertActiveOwner();
        const stored = await db.get('queued_doses', id);
        if (!stored || !belongsToOfflineOwner(stored, owner)) throw new Error('OFFLINE_ENTRY_FORBIDDEN');
        await db.put('queued_doses', { ...stored, ...patch });
    };

    const updateMeasurementMetadata = async (
        id: string,
        patch: Pick<QueuedMeasurementEntry, 'attempts' | 'lastError' | 'status'>,
    ) => {
        assertActiveOwner();
        const stored = await db.get('queued_measurements', id);
        if (!stored || !belongsToOfflineOwner(stored, owner)) throw new Error('OFFLINE_ENTRY_FORBIDDEN');
        await db.put('queued_measurements', { ...stored, ...patch });
    };

    // ─── Doses ──────────────────────────────────────────────────────────
    const doseEntries = (await listPendingDoses()).sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
    );
    for (const entry of doseEntries) {
        if (entry.status === 'blocked') {
            result.blocked += 1;
            continue;
        }
        assertActiveOwner();
        try {
            await createDoseRecord(entry.payload);
            assertActiveOwner();
            const stored = await db.get('queued_doses', entry.id);
            if (!stored || !belongsToOfflineOwner(stored, owner)) throw new Error('OFFLINE_ENTRY_FORBIDDEN');
            await db.delete('queued_doses', entry.id);
            result.success += 1;
        } catch (error: unknown) {
            const attempts = entry.attempts + 1;
            const status: OfflineEntryStatus =
                attempts >= MAX_ATTEMPTS ? 'blocked' : 'pending';
            const lastError = syncErrorMessage(error);
            await updateDoseMetadata(entry.id, {
                attempts,
                lastError,
                status,
            });
            if (status === 'blocked') result.blocked += 1;
            else result.failed += 1;
        }
    }

    // ─── Mesures ────────────────────────────────────────────────────────
    const measurementEntries = (await listPendingMeasurements()).sort(
        (a, b) => a.createdAt.localeCompare(b.createdAt),
    );
    for (const entry of measurementEntries) {
        if (entry.status === 'blocked') {
            result.blocked += 1;
            continue;
        }
        assertActiveOwner();
        try {
            await recordAmbientMeasurement(entry.payload);
            assertActiveOwner();
            const stored = await db.get('queued_measurements', entry.id);
            if (!stored || !belongsToOfflineOwner(stored, owner)) throw new Error('OFFLINE_ENTRY_FORBIDDEN');
            await db.delete('queued_measurements', entry.id);
            result.success += 1;
        } catch (error: unknown) {
            const attempts = entry.attempts + 1;
            const status: OfflineEntryStatus =
                attempts >= MAX_ATTEMPTS ? 'blocked' : 'pending';
            const lastError = syncErrorMessage(error);
            await updateMeasurementMetadata(entry.id, {
                attempts,
                lastError,
                status,
            });
            if (status === 'blocked') result.blocked += 1;
            else result.failed += 1;
        }
    }

    return result;
};

/**
 * Supprime les entrees synchronisees au-dela d'un certain age (en jours)
 * pour eviter de polluer IndexedDB. Par defaut : 30 jours.
 *
 * <p>Si {@code olderThanDays} est null/undefined ou <= 0, on supprime TOUS
 * les synced.
 */
export const clearSynced = async (olderThanDays = 30): Promise<void> => {
    if (!isIndexedDbAvailable()) return;
    const db = await getDb();
    const cutoff =
        olderThanDays > 0
            ? Date.now() - olderThanDays * 24 * 60 * 60 * 1000
            : Date.now();

    const all = await db.getAll('synced_doses');
    for (const item of all) {
        const ts = Date.parse(item.syncedAt);
        if (Number.isNaN(ts) || ts < cutoff) {
            await db.delete('synced_doses', item.id);
        }
    }
};

/**
 * Supprime une entree en attente (dose) — typiquement utilise lorsque
 * l'UI permet a l'utilisateur d'abandonner une saisie blocked.
 */
export const removeQueuedDose = async (id: string): Promise<void> => {
    if (!isIndexedDbAvailable()) return;
    const owner = currentOfflineOwnerContext();
    const db = await getDb();
    const entry = await db.get('queued_doses', id);
    if (!entry || !belongsToOfflineOwner(entry, owner)) throw new Error('OFFLINE_ENTRY_FORBIDDEN');
    await db.delete('queued_doses', id);
};

/** Supprime une mesure d'ambiance en attente — voir {@link removeQueuedDose}. */
export const removeQueuedMeasurement = async (id: string): Promise<void> => {
    if (!isIndexedDbAvailable()) return;
    const owner = currentOfflineOwnerContext();
    const db = await getDb();
    const entry = await db.get('queued_measurements', id);
    if (!entry || !belongsToOfflineOwner(entry, owner)) throw new Error('OFFLINE_ENTRY_FORBIDDEN');
    await db.delete('queued_measurements', id);
};

/**
 * Vide TOUS les stores (queue + synced). Reservee aux outils de
 * developpement / RGPD (droit a l'oubli). N'expose pas de bouton UI.
 */
export const purgeAll = async (): Promise<void> => {
    if (!isIndexedDbAvailable()) return;
    const db = await getDb();
    await Promise.all([
        db.clear('queued_doses'),
        db.clear('synced_doses'),
        db.clear('queued_measurements'),
    ]);
};

export interface DosimetrySecurityPurgeResult {
    preservedDoses: number;
    preservedMeasurements: number;
}

/**
 * Efface l'historique dosimetrique local a la fin d'une session.
 *
 * Les saisies non synchronisees sont conservees par defaut afin qu'un logout
 * ou une expiration de session ne detruise pas silencieusement un relevé
 * terrain. Elles restent chiffrées et rattachées au couple compte-mine.
 */
export const purgeDosimetrySecurityState = async (
    preserveUnsynced = true,
): Promise<DosimetrySecurityPurgeResult> => {
    if (!isIndexedDbAvailable()) {
        return { preservedDoses: 0, preservedMeasurements: 0 };
    }
    const db = await getDb();
    let owner: ReturnType<typeof currentOfflineOwnerContext>;
    try {
        owner = currentOfflineOwnerContext();
    } catch {
        // Sur expiration, l'identité Redux peut déjà avoir été effacée. Les
        // entrées partitionnées restent inaccessibles au compte suivant.
        await db.clear('synced_doses');
        return { preservedDoses: 0, preservedMeasurements: 0 };
    }
    const [ownedDoses, ownedMeasurements] = await Promise.all([
        db.getAll('queued_doses'),
        db.getAll('queued_measurements'),
    ]);
    const preservedDoses = preserveUnsynced
        ? ownedDoses.filter((entry) => belongsToOfflineOwner(entry, owner)).length
        : 0;
    const preservedMeasurements = preserveUnsynced
        ? ownedMeasurements.filter((entry) => belongsToOfflineOwner(entry, owner)).length
        : 0;

    const tx = db.transaction(
        ['queued_doses', 'synced_doses', 'queued_measurements'],
        'readwrite',
    );
    await tx.objectStore('synced_doses').clear();
    if (!preserveUnsynced) {
        for (const entry of ownedDoses.filter((candidate) => belongsToOfflineOwner(candidate, owner))) {
            await tx.objectStore('queued_doses').delete(entry.id);
        }
        for (const entry of ownedMeasurements.filter((candidate) => belongsToOfflineOwner(candidate, owner))) {
            await tx.objectStore('queued_measurements').delete(entry.id);
        }
    }
    await tx.done;

    return { preservedDoses, preservedMeasurements };
};

const DosimetryOfflineService = {
    queueDose,
    queueMeasurement,
    listPendingDoses,
    listPendingMeasurements,
    getPendingCount,
    syncPending,
    clearSynced,
    removeQueuedDose,
    removeQueuedMeasurement,
    purgeAll,
    purgeDosimetrySecurityState,
};

export default DosimetryOfflineService;

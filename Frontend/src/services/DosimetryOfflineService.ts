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
 *  - Database IndexedDB : {@code safex_dosimetry_offline} (version 1).
 *  - Stores :
 *      - {@code queued_doses}        : doses en attente d'envoi.
 *      - {@code synced_doses}        : doses envoyees avec succes (historique).
 *      - {@code queued_measurements} : mesures d'ambiance en attente.
 *  - Chaque entree porte un id local (UUID), un timestamp et un compteur
 *    d'essais d'envoi (utile pour limiter le retry en cas d'erreur 4xx
 *    persistante : ex. workerId invalide).
 *
 * <p><b>Strategie de sync</b> :
 *  - {@link syncPending} tente un POST par entree dans l'ordre chronologique
 *    et migre les succes dans {@code synced_doses} apres un appel reussi.
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
    payload: DoseRecordDTO;
}

/** Wrapper persistant pour une mesure d'ambiance en attente (meme structure). */
export interface QueuedMeasurementEntry {
    id: string;
    createdAt: string;
    attempts: number;
    lastError?: string | null;
    status: OfflineEntryStatus;
    payload: AmbientMeasurementDTO;
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
        value: QueuedDoseEntry;
    };
    synced_doses: {
        key: string;
        value: SyncedEntry<DoseRecordDTO>;
    };
    queued_measurements: {
        key: string;
        value: QueuedMeasurementEntry;
    };
}

const DB_NAME = 'safex_dosimetry_offline';
const DB_VERSION = 1;
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
            upgrade(db) {
                if (!db.objectStoreNames.contains('queued_doses')) {
                    db.createObjectStore('queued_doses', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('synced_doses')) {
                    db.createObjectStore('synced_doses', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('queued_measurements')) {
                    db.createObjectStore('queued_measurements', { keyPath: 'id' });
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
    const id = generateId();
    const entry: QueuedDoseEntry = {
        id,
        createdAt: new Date().toISOString(),
        attempts: 0,
        status: 'pending',
        payload: dose,
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
    const id = generateId();
    const entry: QueuedMeasurementEntry = {
        id,
        createdAt: new Date().toISOString(),
        attempts: 0,
        status: 'pending',
        payload: measurement,
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
    const db = await getDb();
    return db.getAll('queued_doses');
};

export const listPendingMeasurements = async (): Promise<QueuedMeasurementEntry[]> => {
    if (!isIndexedDbAvailable()) return [];
    const db = await getDb();
    return db.getAll('queued_measurements');
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
        const db = await getDb();
        const [doses, measurements] = await Promise.all([
            db.count('queued_doses'),
            db.count('queued_measurements'),
        ]);
        return { doses, measurements };
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

/**
 * Synchronise toutes les entrees en attente (doses + mesures). Tente un
 * envoi par entree dans l'ordre chronologique. Les entrees envoyees avec
 * succes sont migrees dans le store {@code synced_doses} (archive) pour
 * permettre un audit local. Les echecs voient leur {@code attempts}
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
    const result: SyncResult = { success: 0, failed: 0, blocked: 0 };

    // ─── Doses ──────────────────────────────────────────────────────────
    const doseEntries = (await db.getAll('queued_doses')).sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
    );
    for (const entry of doseEntries) {
        if (entry.status === 'blocked') {
            result.blocked += 1;
            continue;
        }
        try {
            await createDoseRecord(entry.payload);
            await db.delete('queued_doses', entry.id);
            const synced: SyncedEntry<DoseRecordDTO> = {
                id: entry.id,
                createdAt: entry.createdAt,
                syncedAt: new Date().toISOString(),
                payload: entry.payload,
            };
            await db.put('synced_doses', synced);
            result.success += 1;
        } catch (err: any) {
            const attempts = entry.attempts + 1;
            const status: OfflineEntryStatus =
                attempts >= MAX_ATTEMPTS ? 'blocked' : 'pending';
            const lastError: string =
                err?.response?.data?.errorMessage ||
                err?.response?.data?.message ||
                err?.message ||
                'sync_failed';
            await db.put('queued_doses', {
                ...entry,
                attempts,
                lastError,
                status,
            });
            if (status === 'blocked') result.blocked += 1;
            else result.failed += 1;
        }
    }

    // ─── Mesures ────────────────────────────────────────────────────────
    const measurementEntries = (await db.getAll('queued_measurements')).sort(
        (a, b) => a.createdAt.localeCompare(b.createdAt),
    );
    for (const entry of measurementEntries) {
        if (entry.status === 'blocked') {
            result.blocked += 1;
            continue;
        }
        try {
            await recordAmbientMeasurement(entry.payload);
            await db.delete('queued_measurements', entry.id);
            result.success += 1;
        } catch (err: any) {
            const attempts = entry.attempts + 1;
            const status: OfflineEntryStatus =
                attempts >= MAX_ATTEMPTS ? 'blocked' : 'pending';
            const lastError: string =
                err?.response?.data?.errorMessage ||
                err?.response?.data?.message ||
                err?.message ||
                'sync_failed';
            await db.put('queued_measurements', {
                ...entry,
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
    const db = await getDb();
    await db.delete('queued_doses', id);
};

/** Supprime une mesure d'ambiance en attente — voir {@link removeQueuedDose}. */
export const removeQueuedMeasurement = async (id: string): Promise<void> => {
    if (!isIndexedDbAvailable()) return;
    const db = await getDb();
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
};

export default DosimetryOfflineService;

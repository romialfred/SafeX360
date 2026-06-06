/**
 * File d'attente IndexedDB pour les check-in d'évacuation hors-ligne
 * (LOT 48 Phase 6).
 *
 * <p>Garantit qu'un employé en zone sans réseau peut tout de même pointer son
 * statut (SAFE / INJURED) lors d'une alerte générale. Le check-in sera transmis
 * dès reconnexion.</p>
 */

const DB_NAME = 'safex-emergency-checkin';
const DB_VERSION = 1;
const STORE = 'pending_checkin';
const MAX_PENDING = 30;

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

// ────────────────────────────────────────────────────────────────────────────

const openDb = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB indisponible'));
            return;
        }
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

export const enqueueCheckIn = async (entry: Omit<PendingCheckIn, 'id' | 'enqueuedAt' | 'attempts'>): Promise<void> => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const count = store.count();
        count.onsuccess = () => {
            if (count.result >= MAX_PENDING) {
                const cur = store.openCursor();
                cur.onsuccess = () => {
                    const c = cur.result;
                    if (c) c.delete();
                    store.add({ ...entry, enqueuedAt: new Date().toISOString(), attempts: 0 });
                };
            } else {
                store.add({ ...entry, enqueuedAt: new Date().toISOString(), attempts: 0 });
            }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export const listPendingCheckIns = async (): Promise<PendingCheckIn[]> => {
    try {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, 'readonly');
            const req = tx.objectStore(STORE).getAll();
            req.onsuccess = () => resolve((req.result as PendingCheckIn[]) ?? []);
            req.onerror = () => reject(req.error);
        });
    } catch {
        return [];
    }
};

const updateEntry = async (entry: PendingCheckIn): Promise<void> => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

const deleteEntry = async (id: number): Promise<void> => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export type PostCheckInFn = (entry: PendingCheckIn) => Promise<any>;

export interface ReplayCheckInResult {
    attempted: number;
    succeeded: number;
    failed: number;
}

export const replayPendingCheckIns = async (post: PostCheckInFn): Promise<ReplayCheckInResult> => {
    const pending = await listPendingCheckIns();
    let succeeded = 0;
    let failed = 0;
    for (const entry of pending) {
        try {
            await post(entry);
            if (entry.id !== undefined) await deleteEntry(entry.id);
            succeeded++;
        } catch (err: any) {
            failed++;
            entry.attempts = (entry.attempts ?? 0) + 1;
            entry.lastError = err?.message ?? 'Erreur inconnue';
            try { await updateEntry(entry); } catch { /* ignore */ }
        }
    }
    return { attempted: pending.length, succeeded, failed };
};

// ── Auto-replay (à installer au boot, comme pour les SOS) ──

let installed = false;
let intervalId: number | null = null;

export const installAutoReplayCheckIns = (
    post: PostCheckInFn,
    onResult?: (r: ReplayCheckInResult) => void
): (() => void) => {
    if (installed) return () => {};
    installed = true;

    const run = async () => {
        try {
            const r = await replayPendingCheckIns(post);
            if (r.attempted > 0 && onResult) onResult(r);
        } catch { /* silencieux */ }
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

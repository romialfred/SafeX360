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
 * <p>Stocke jusqu'à 50 entrées (au-delà = drop le plus ancien — pour borner
 * la mémoire du device).</p>
 */

const DB_NAME = 'safex-emergency';
const DB_VERSION = 1;
const STORE_PENDING_SOS = 'pending_sos';
const MAX_PENDING = 50;

export interface PendingSos {
    id?: number;
    payload: any; // SosAlertDTO sans id (l'id sera assigné serveur)
    actorId?: number;
    enqueuedAt: string; // ISO
    attempts: number;
    lastAttemptAt?: string;
    lastError?: string;
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
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_PENDING_SOS)) {
                db.createObjectStore(STORE_PENDING_SOS, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

// ────────────────────────────────────────────────────────────────────────────
// Enqueue / Dequeue
// ────────────────────────────────────────────────────────────────────────────

export const enqueueSos = async (payload: any, actorId?: number): Promise<void> => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PENDING_SOS, 'readwrite');
        const store = tx.objectStore(STORE_PENDING_SOS);

        // Comptage pour FIFO bounded
        const countReq = store.count();
        countReq.onsuccess = () => {
            const count = countReq.result;
            const doAdd = () => {
                const entry: PendingSos = {
                    payload,
                    actorId,
                    enqueuedAt: new Date().toISOString(),
                    attempts: 0,
                };
                store.add(entry);
            };

            if (count >= MAX_PENDING) {
                // Drop le plus ancien (cursor)
                const cursorReq = store.openCursor();
                cursorReq.onsuccess = () => {
                    const cursor = cursorReq.result;
                    if (cursor) {
                        cursor.delete();
                    }
                    doAdd();
                };
            } else {
                doAdd();
            }
        };

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export const countPending = async (): Promise<number> => {
    try {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_PENDING_SOS, 'readonly');
            const req = tx.objectStore(STORE_PENDING_SOS).count();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    } catch {
        return 0;
    }
};

export const listPending = async (): Promise<PendingSos[]> => {
    try {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_PENDING_SOS, 'readonly');
            const req = tx.objectStore(STORE_PENDING_SOS).getAll();
            req.onsuccess = () => resolve((req.result as PendingSos[]) ?? []);
            req.onerror = () => reject(req.error);
        });
    } catch {
        return [];
    }
};

const updateOne = async (entry: PendingSos): Promise<void> => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PENDING_SOS, 'readwrite');
        tx.objectStore(STORE_PENDING_SOS).put(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

const deleteOne = async (id: number): Promise<void> => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PENDING_SOS, 'readwrite');
        tx.objectStore(STORE_PENDING_SOS).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

// ────────────────────────────────────────────────────────────────────────────
// Replay
// ────────────────────────────────────────────────────────────────────────────

export type PostFn = (payload: any, actorId?: number) => Promise<any>;

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
    const pending = await listPending();
    let succeeded = 0;
    let failed = 0;

    for (const entry of pending) {
        try {
            await post(entry.payload, entry.actorId);
            if (entry.id !== undefined) await deleteOne(entry.id);
            succeeded++;
        } catch (err: any) {
            failed++;
            entry.attempts = (entry.attempts ?? 0) + 1;
            entry.lastAttemptAt = new Date().toISOString();
            entry.lastError = err?.message ?? 'Erreur inconnue';
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

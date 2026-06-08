/**
 * SafeX 360 Field — Sync Engine
 *
 * Replay des mutations en attente avec retry exponentiel et gestion de
 * conflits last-write-wins par defaut. Le moteur s'amorce automatiquement :
 *   - Au boot de l'application si online
 *   - A chaque transition offline -> online
 *   - Au retour au premier plan de l'app (visibilitychange)
 *   - A intervalle regulier (60 s par defaut) tant que la queue n'est pas vide
 *
 * Le moteur emet des evenements via un EventEmitter leger pour permettre
 * a l'UI de mettre a jour l'indicateur "X actions en attente" en temps reel.
 *
 * Implementation deliberement minimaliste — pas de dependance externe :
 * c'est de la coordination de promises + fetch.
 */

import axiosInstance from '../../interceptors/AxiosInterceptor';
import {
    queuePending,
    queueUpdate,
    queueCountByStatus,
    photoPending,
    photoMarkUploaded,
    photoPendingCount,
    type MutationRecord,
} from './db';

const RETRY_BACKOFF_MS = [1_000, 2_000, 5_000, 15_000, 60_000];
const MAX_RETRIES = RETRY_BACKOFF_MS.length;
const POLL_INTERVAL_MS = 60_000;

type SyncEvent =
    | 'started'
    | 'progress'
    | 'completed'
    | 'failed'
    | 'queueChanged';

interface SyncStats {
    pending: number;
    syncing: number;
    failed: number;
    done: number;
    photosPending: number;
}

type Listener = (stats: SyncStats) => void;

class SyncEngine {
    private listeners: Map<SyncEvent, Set<Listener>> = new Map();
    private isRunning = false;
    private pollTimer: number | null = null;

    on(event: SyncEvent, fn: Listener) {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event)!.add(fn);
        return () => this.off(event, fn);
    }
    off(event: SyncEvent, fn: Listener) {
        this.listeners.get(event)?.delete(fn);
    }
    private async emit(event: SyncEvent) {
        const stats = await this.getStats();
        const set = this.listeners.get(event);
        if (set) for (const fn of set) fn(stats);
    }

    async getStats(): Promise<SyncStats> {
        const [pending, syncing, failed, done, photosPending] = await Promise.all([
            queueCountByStatus('pending'),
            queueCountByStatus('syncing'),
            queueCountByStatus('failed'),
            queueCountByStatus('done'),
            photoPendingCount(),
        ]);
        return { pending, syncing, failed, done, photosPending };
    }

    /**
     * Lance le replay de la queue. Si deja en cours, ne re-declenche pas
     * (idempotent par design).
     */
    async run(): Promise<void> {
        if (this.isRunning) return;
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            // Pas de tentative offline — on attend l'event reseau.
            return;
        }
        this.isRunning = true;
        await this.emit('started');
        try {
            // 1) Mutations metier (incident, inspection, SOS)
            const pending = await queuePending();
            for (const m of pending) {
                await this.processOne(m);
                await this.emit('progress');
            }
            // 2) Photos preuves (apres mutations metier pour avoir un lien valide)
            await this.flushPhotos();
            await this.emit('completed');
        } catch (e) {
            console.warn('[SyncEngine] run() exception', e);
            await this.emit('failed');
        } finally {
            this.isRunning = false;
        }
    }

    private async processOne(m: MutationRecord): Promise<void> {
        if (m.id === undefined) return;
        await queueUpdate(m.id, { status: 'syncing' });
        try {
            const config = {
                method: m.method,
                url: m.endpoint,
                data: m.payload,
                headers: m.headers,
            };
            await axiosInstance.request(config);
            await queueUpdate(m.id, { status: 'done', lastError: undefined });
        } catch (e: any) {
            const status = e?.response?.status;
            // 409 Conflict : signaler comme failed pour resolution manuelle UI
            if (status === 409) {
                await queueUpdate(m.id, {
                    status: 'failed',
                    lastError: 'Conflit serveur — necessite resolution manuelle',
                });
                return;
            }
            // 4xx (sauf 408/429) = erreur metier definitive, ne pas retry
            if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
                await queueUpdate(m.id, {
                    status: 'failed',
                    lastError: e?.message ?? `HTTP ${status}`,
                });
                return;
            }
            // Sinon : retry exponentiel — on remet en pending et on laisse
            // le polling/visibilitychange re-tenter ; PAS de setTimeout
            // bloquant ici (sinon on bloque la boucle pour tous les items
            // suivants). Le run() suivant verra cet item revenu en pending.
            const next = m.retryCount + 1;
            if (next >= MAX_RETRIES) {
                await queueUpdate(m.id, {
                    status: 'failed',
                    retryCount: next,
                    lastError: e?.message ?? 'max retries reached',
                });
                return;
            }
            await queueUpdate(m.id, {
                status: 'pending',
                retryCount: next,
                lastError: e?.message,
            });
            // Planifier un re-run apres le backoff sans bloquer cette boucle
            const delay = RETRY_BACKOFF_MS[Math.min(next, RETRY_BACKOFF_MS.length - 1)];
            if (typeof window !== 'undefined') {
                window.setTimeout(() => void this.run(), delay);
            }
        }
    }

    /**
     * Upload des photos en attente. POST multipart sur
     * /hns/mobile/photo-upload (le backend doit retourner { url }).
     * Echec silencieux (re-essai au prochain run).
     */
    private async flushPhotos(): Promise<void> {
        const photos = await photoPending();
        for (const photo of photos) {
            if (photo.id === undefined) continue;
            try {
                const form = new FormData();
                form.append('photo', photo.blob, `photo-${photo.id}.jpg`);
                if (photo.findingId !== undefined) {
                    form.append('findingId', String(photo.findingId));
                }
                const res = await axiosInstance.post<{ url: string }>(
                    '/hns/mobile/photo-upload',
                    form,
                    { headers: { 'Content-Type': 'multipart/form-data' } },
                );
                await photoMarkUploaded(photo.id, res.data?.url);
            } catch (e: any) {
                // En cas d'echec, on laisse uploaded=false pour le prochain run.
                // Si le backend repond 404 (endpoint pas encore deploye), on
                // arrete le flush et on retentera plus tard pour ne pas spammer.
                if (e?.response?.status === 404) {
                    return;
                }
            }
        }
    }

    /**
     * Demarre l'auto-start : reconnexion reseau + visibilitychange + polling.
     * A appeler une seule fois au boot de l'app (depuis MobileShell).
     */
    start(): void {
        // Auto-run au retour online
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => void this.run());
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') void this.run();
            });
        }
        // Polling regulier si online
        if (this.pollTimer === null && typeof window !== 'undefined') {
            this.pollTimer = window.setInterval(() => {
                if (navigator.onLine) void this.run();
            }, POLL_INTERVAL_MS);
        }
        // Run initial (apres 1s, le temps que React monte)
        if (typeof window !== 'undefined') {
            window.setTimeout(() => void this.run(), 1000);
        }
    }

    stop(): void {
        if (this.pollTimer !== null) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }
}

// Singleton — un seul moteur de sync par onglet
export const syncEngine = new SyncEngine();

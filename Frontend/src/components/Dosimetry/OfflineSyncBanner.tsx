/**
 * OfflineSyncBanner — Phase 10-B Frontend (Module Dosimetrie).
 *
 * Banner persistant en haut des pages de saisie terrain du module Dosimetrie
 * signalant :
 *   - L'etat de connectivite reseau (navigator.onLine + listeners online/offline).
 *   - Le nombre de saisies en attente d'envoi dans IndexedDB (doses + mesures
 *     d'ambiance) via {@link DosimetryOfflineService}.
 *   - Un bouton "Synchroniser maintenant" lorsqu'on est en ligne avec des
 *     entrees pending. Synchronisation automatique au retour online.
 *
 * <p><b>Comportement</b> :
 *  - Le banner reste affiche tant que (offline) OR (pendingCount > 0).
 *  - Sur passage online -> tente automatiquement {@code syncPending()} si la
 *    queue n'est pas vide.
 *  - Polling leger (toutes les 30s) pour rafraichir le compteur en cas de
 *    saisie depuis un autre onglet.
 *
 * <p>Mobile-first : badge plein-largeur en mobile, version compacte en desktop.
 *
 * <p>i18n via namespace {@code dosimetry} -> bloc {@code offline.banner}.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    IconCloudOff,
    IconCloudUpload,
    IconRefresh,
    IconAlertTriangle,
    IconCircleCheck,
} from '@tabler/icons-react';
import DosimetryOfflineService from '../../services/DosimetryOfflineService';

// ─────────────────────────────────────────────────────────────────────────────
//  Hook : detection d'etat reseau
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Indique si le navigateur est en ligne. Utilise {@code navigator.onLine}
 * comme valeur initiale et ecoute les events {@code online} / {@code offline}.
 * Repond {@code true} par defaut en SSR pour eviter un flash banner.
 */
export function useOnlineStatus(): boolean {
    const [online, setOnline] = useState<boolean>(() => {
        if (typeof navigator === 'undefined') return true;
        return navigator.onLine !== false;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleOnline = () => setOnline(true);
        const handleOffline = () => setOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return online;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Banner principal
// ─────────────────────────────────────────────────────────────────────────────

export interface OfflineSyncBannerProps {
    /** Force le rendu meme si online + pending == 0 (mode debug). */
    forceVisible?: boolean;
    /** Periode de refresh du compteur, en ms. Defaut : 30 s. */
    pollIntervalMs?: number;
    /** Callback apres un sync (UI peut rafraichir une liste). */
    onSyncCompleted?: (res: { success: number; failed: number; blocked: number }) => void;
}

const OfflineSyncBanner = ({
    forceVisible = false,
    pollIntervalMs = 30000,
    onSyncCompleted,
}: OfflineSyncBannerProps) => {
    const { t } = useTranslation('dosimetry');
    const online = useOnlineStatus();
    const [doses, setDoses] = useState<number>(0);
    const [measurements, setMeasurements] = useState<number>(0);
    const [syncing, setSyncing] = useState<boolean>(false);
    const [lastResult, setLastResult] = useState<{
        success: number;
        failed: number;
        blocked: number;
    } | null>(null);
    const autoSyncRanRef = useRef<boolean>(false);

    const refreshCounts = useCallback(async () => {
        try {
            const c = await DosimetryOfflineService.getPendingCount();
            setDoses(c.doses);
            setMeasurements(c.measurements);
        } catch {
            // ignore — IndexedDB non disponible / mode privacy
        }
    }, []);

    const performSync = useCallback(async () => {
        if (syncing) return;
        setSyncing(true);
        try {
            const res = await DosimetryOfflineService.syncPending();
            setLastResult(res);
            if (onSyncCompleted) onSyncCompleted(res);
            await refreshCounts();
        } finally {
            setSyncing(false);
        }
    }, [syncing, onSyncCompleted, refreshCounts]);

    // ─── Effet : refresh initial + polling ──────────────────────────────
    useEffect(() => {
        void refreshCounts();
        if (pollIntervalMs <= 0) return;
        const id = window.setInterval(() => {
            void refreshCounts();
        }, pollIntervalMs);
        return () => window.clearInterval(id);
    }, [refreshCounts, pollIntervalMs]);

    // ─── Effet : auto-sync au passage online si pending > 0 ─────────────
    useEffect(() => {
        const total = doses + measurements;
        if (online && total > 0 && !autoSyncRanRef.current) {
            autoSyncRanRef.current = true;
            void performSync();
        }
        if (!online) {
            autoSyncRanRef.current = false;
        }
    }, [online, doses, measurements, performSync]);

    const total = doses + measurements;
    const visible = forceVisible || !online || total > 0;
    if (!visible) return null;

    // ─── Choix du theme visuel ──────────────────────────────────────────
    let tone: {
        bg: string;
        border: string;
        icon: React.ReactNode;
        title: string;
        message: string;
    };
    if (!online) {
        tone = {
            bg: 'bg-amber-50',
            border: 'border-amber-300',
            icon: <IconCloudOff size={18} stroke={1.8} className="text-amber-700" />,
            title: t('offline.banner.offlineTitle'),
            message: t('offline.banner.offlineMessage', { count: total }),
        };
    } else if (total > 0) {
        tone = {
            bg: 'bg-indigo-50',
            border: 'border-indigo-300',
            icon: <IconCloudUpload size={18} stroke={1.8} className="text-indigo-700" />,
            title: t('offline.banner.pendingTitle'),
            message: t('offline.banner.pendingMessage', { count: total }),
        };
    } else {
        tone = {
            bg: 'bg-emerald-50',
            border: 'border-emerald-300',
            icon: <IconCircleCheck size={18} stroke={1.8} className="text-emerald-700" />,
            title: t('offline.banner.syncedTitle'),
            message: t('offline.banner.syncedMessage'),
        };
    }

    return (
        <div
            role="status"
            aria-live="polite"
            data-testid="offline-sync-banner"
            className={`mb-3 flex items-start gap-3 px-4 py-2.5 rounded-xl border ${tone.bg} ${tone.border} shadow-sm`}
        >
            <div className="flex-shrink-0 mt-0.5">{tone.icon}</div>

            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-800 leading-tight">
                    {tone.title}
                </p>
                <p className="text-[11.5px] text-slate-600 leading-snug mt-0.5">
                    {tone.message}
                </p>
                {total > 0 && (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                        {doses > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/70 border border-slate-200 text-slate-700">
                                {t('offline.banner.dosesKpi', { n: doses })}
                            </span>
                        )}
                        {measurements > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/70 border border-slate-200 text-slate-700">
                                {t('offline.banner.measurementsKpi', { n: measurements })}
                            </span>
                        )}
                        {lastResult && lastResult.blocked > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-700">
                                <IconAlertTriangle size={11} stroke={2} />
                                {t('offline.banner.blockedKpi', { n: lastResult.blocked })}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {online && total > 0 && (
                <button
                    type="button"
                    onClick={() => void performSync()}
                    disabled={syncing}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-[12px] font-medium hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
                    aria-label={t('offline.banner.syncNow')}
                >
                    {syncing ? (
                        <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                        <IconRefresh size={13} stroke={2} />
                    )}
                    <span className="hidden sm:inline">{t('offline.banner.syncNow')}</span>
                </button>
            )}
        </div>
    );
};

export default OfflineSyncBanner;

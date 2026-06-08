/**
 * AppUpdateBanner — Bandeau "Nouvelle version disponible" pour SafeX 360 Field.
 *
 * Polle l'endpoint /hns/mobile/app-version au boot + toutes les 30 minutes.
 * Compare avec la versionCode locale (depuis MOBILE_APP_VERSION_CODE).
 * Si latestVersionCode > local, affiche un bandeau cyan en haut de l'app
 * avec lien de téléchargement.
 *
 * Le dismiss est persistant par session (sessionStorage) pour ne pas
 * spammer l'utilisateur, mais redéclenche au prochain démarrage.
 */

import { useEffect, useState } from 'react';
import { IconDownload, IconX } from '@tabler/icons-react';
import axiosInstance from '../../interceptors/AxiosInterceptor';

// Aligné sur android/app/build.gradle defaultConfig.versionCode
const LOCAL_VERSION_CODE = 10000;

interface AppVersionInfo {
    latestVersionName: string;
    latestVersionCode: number;
    downloadUrl: string;
    mandatoryUpgrade: boolean;
    releaseNotes?: string;
}

const POLL_INTERVAL_MS = 30 * 60 * 1000; // 30 min
const DISMISS_KEY = 'safex360-field-update-dismissed-v';

export default function AppUpdateBanner() {
    const [info, setInfo] = useState<AppVersionInfo | null>(null);

    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            try {
                const res = await axiosInstance.get<AppVersionInfo>('/hns/mobile/app-version', {
                    timeout: 5000,
                });
                if (cancelled) return;
                const v = res.data;
                if (v.latestVersionCode > LOCAL_VERSION_CODE) {
                    // Vérifie le dismiss sessionStorage (par version)
                    const dismissedFor = sessionStorage.getItem(DISMISS_KEY);
                    if (dismissedFor === String(v.latestVersionCode) && !v.mandatoryUpgrade) {
                        return;
                    }
                    setInfo(v);
                } else {
                    setInfo(null);
                }
            } catch {
                // Backend indisponible : on ignore (pas de bandeau)
            }
        };

        check();
        const interval = window.setInterval(check, POLL_INTERVAL_MS);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    if (!info) return null;

    const handleDismiss = () => {
        if (info.mandatoryUpgrade) return; // pas de dismiss possible
        try {
            sessionStorage.setItem(DISMISS_KEY, String(info.latestVersionCode));
        } catch {
            // ignore
        }
        setInfo(null);
    };

    const handleDownload = () => {
        // Ouvre l'URL dans le navigateur natif (Capacitor Browser ou window.open)
        const url = info.downloadUrl;
        try {
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch {
            window.location.href = url;
        }
    };

    return (
        <div
            className={`w-full ${info.mandatoryUpgrade ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-cyan-50 border-cyan-200 text-cyan-900'} border-b text-[12.5px] px-4 py-2 flex items-start gap-2`}
            role="status"
        >
            <IconDownload size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="font-medium">
                    Nouvelle version disponible : {info.latestVersionName}
                    {info.mandatoryUpgrade && ' (obligatoire)'}
                </div>
                {info.releaseNotes && (
                    <div className="text-[11.5px] opacity-80 line-clamp-2 mt-0.5">
                        {info.releaseNotes}
                    </div>
                )}
                <div className="flex items-center gap-3 mt-1">
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="text-[12px] font-medium underline"
                    >
                        Télécharger
                    </button>
                    {!info.mandatoryUpgrade && (
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="text-[11.5px] opacity-70"
                        >
                            Plus tard
                        </button>
                    )}
                </div>
            </div>
            {!info.mandatoryUpgrade && (
                <button
                    type="button"
                    onClick={handleDismiss}
                    className="p-0.5 flex-shrink-0 opacity-60"
                    aria-label="Fermer"
                    style={{ minWidth: 24, minHeight: 24 }}
                >
                    <IconX size={14} stroke={1.8} />
                </button>
            )}
        </div>
    );
}

/**
 * DosimetryAlertsBanner — Bandeau global d'alertes dosimetrie (Phase 5 Frontend-B).
 *
 * Affiche en haut de TOUTES les pages /dosimetry/* un bandeau d'avertissement
 * lorsque des alertes critiques sont actives, et redirige l'utilisateur vers
 * la page complete /dosimetry/alerts en un clic.
 *
 * Regles d'affichage (par priorite descendante) :
 *   1. Au moins une alerte de niveau EXCEEDED active   -> banner ROUGE pulse.
 *   2. Au moins une alerte INVESTIGATION + ACTION      -> banner JAUNE.
 *   3. Aucune alerte critique                          -> pas de banner.
 *
 * Le composant :
 *   - s'auto-detecte : il ne se rend que si la route courante commence par /dosimetry.
 *   - charge les alertes via DosimetryService.getActiveAlerts(mineId), avec un
 *     polling tres leger (refresh toutes les 60 s) pour rester reactif sans
 *     submerger le backend.
 *   - se masque si la route courante EST deja /dosimetry/alerts (eviter doublon).
 *
 * RBAC : aucune permission requise pour voir le banner — c'est un indicateur de
 * surface, l'action "voir toutes les alertes" est protegee cote page.
 *
 * Integration : monter <DosimetryAlertsBanner /> dans le DashboardLayout, juste
 * apres le <Header /> et avant <Outlet />. Le composant gere lui-meme le test
 * de route + l'invisibilite quand non pertinent (zero overhead visuel).
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconAlertOctagon, IconAlertTriangle, IconChevronRight } from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import {
    getActiveAlerts,
    type ExposureAlertDTO,
} from '../../services/DosimetryService';

/** Periode de re-fetch des alertes (ms). 60 s = compromis frais / charge. */
const REFRESH_INTERVAL_MS = 60_000;

const DosimetryAlertsBanner = () => {
    const { t } = useTranslation('dosimetry');
    const location = useLocation();
    const navigate = useNavigate();

    const user = useAppSelector((state: any) => state.user);
    const selectedMineId: number | null = useAppSelector(
        (state: any) => state?.companySelection?.selectedCompanyId ?? null,
    );

    const [alerts, setAlerts] = useState<ExposureAlertDTO[]>([]);

    // Resolution du mineId (memoisee pour stabiliser la cle d'effet).
    const mineId: number | null = useMemo(() => {
        return selectedMineId ?? user?.mineId ?? user?.companyId ?? null;
    }, [selectedMineId, user]);

    // ───── Eligibilite : on ne rend que sur /dosimetry/* sauf /dosimetry/alerts ─────
    const isDosimetryRoute = location.pathname.startsWith('/dosimetry');
    const isAlertsRoute = location.pathname.startsWith('/dosimetry/alerts');
    const shouldRender = isDosimetryRoute && !isAlertsRoute;

    // ───── Fetch des alertes (refresh discret toutes les 60 s) ─────
    const fetchAlerts = useCallback(async () => {
        if (!shouldRender || mineId == null) {
            setAlerts([]);
            return;
        }
        try {
            const list = await getActiveAlerts(mineId);
            setAlerts(Array.isArray(list) ? list : []);
        } catch {
            // Banner = surface — on echoue silencieusement (pas de notification).
            setAlerts([]);
        }
    }, [shouldRender, mineId]);

    useEffect(() => {
        fetchAlerts();
        if (!shouldRender) return undefined;
        const id = setInterval(fetchAlerts, REFRESH_INTERVAL_MS);
        return () => clearInterval(id);
    }, [fetchAlerts, shouldRender]);

    // ───── Calcul des compteurs par niveau ─────
    const counts = useMemo(() => {
        let exceeded = 0;
        let action = 0;
        let investigation = 0;
        for (const a of alerts) {
            if (a.status !== 'ACTIVE') continue;
            if (a.level === 'EXCEEDED') exceeded += 1;
            else if (a.level === 'ACTION') action += 1;
            else if (a.level === 'INVESTIGATION') investigation += 1;
        }
        return { exceeded, action, investigation, critical: investigation + action };
    }, [alerts]);

    // ───── Garde-fou : rien a afficher ─────
    if (!shouldRender) return null;
    if (counts.exceeded === 0 && counts.critical === 0) return null;

    // ───── Banner ROUGE (EXCEEDED) — priorite ─────
    if (counts.exceeded > 0) {
        return (
            <div
                role="alert"
                aria-live="assertive"
                className="relative overflow-hidden border-b border-red-300 bg-gradient-to-r from-red-50 via-red-100 to-red-50"
            >
                {/* Bandeau animé pulse rouge en haut */}
                <span
                    aria-hidden="true"
                    className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-500 via-red-600 to-red-500 animate-pulse"
                />
                <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white shadow-md shadow-red-200 animate-pulse flex-shrink-0">
                        <IconAlertOctagon size={16} stroke={2} />
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-red-900 leading-tight">
                            {t('alertsBanner.exceededTitle')}
                        </p>
                        <p className="text-[12px] text-red-800 mt-0.5 leading-tight">
                            {t('alertsBanner.exceededBody', { count: counts.exceeded })}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/alerts')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-600 text-white text-[12px] font-semibold hover:bg-red-700 transition shadow-sm"
                    >
                        {t('alertsBanner.viewAll')}
                        <IconChevronRight size={13} stroke={2.2} />
                    </button>
                </div>
            </div>
        );
    }

    // ───── Banner JAUNE (INVESTIGATION + ACTION) ─────
    return (
        <div
            role="status"
            aria-live="polite"
            className="relative overflow-hidden border-b border-amber-300 bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50"
        >
            <span
                aria-hidden="true"
                className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500"
            />
            <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-white shadow-sm flex-shrink-0">
                    <IconAlertTriangle size={16} stroke={2} />
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-amber-900 leading-tight">
                        {t('alertsBanner.criticalTitle')}
                    </p>
                    <p className="text-[12px] text-amber-800 mt-0.5 leading-tight">
                        {t('alertsBanner.criticalBody', { count: counts.critical })}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/dosimetry/alerts')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-amber-600 text-white text-[12px] font-semibold hover:bg-amber-700 transition shadow-sm"
                >
                    {t('alertsBanner.viewAll')}
                    <IconChevronRight size={13} stroke={2.2} />
                </button>
            </div>
        </div>
    );
};

export default DosimetryAlertsBanner;

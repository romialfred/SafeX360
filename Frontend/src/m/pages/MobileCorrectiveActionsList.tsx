/**
 * MobileCorrectiveActionsList — Registre tactile des actions correctives
 * (CAPA), toutes sources confondues (Incident, Inspection, Activité HSE,
 * Non-conformité, Quasi-accident, Danger).
 *
 * Le backend (CorrectiveAction) n'expose pas de champ "priority" — la
 * priorité affichée dans la maquette est donc dérivée ici de l'urgence
 * réelle (échéance dépassée / progression) plutôt qu'inventée. La source
 * (type) réutilise la palette de correctiveLabels.ts (charte R7).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconClipboardCheck,
    IconChevronRight,
    IconCalendarStats,
    IconAlertOctagon,
    IconRefresh,
} from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { ListSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { getCached } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';

interface CorrectiveActionSummary {
    id: number | string;
    actionName: string;
    type?: 'INCIDENT' | 'GENERAL_INSPECTION' | 'HS_ACTIVITY' | 'NON_CONFORMITY' | 'NEAR_MISS' | 'HAZARD' | 'ADHOC' | string;
    incidentId?: number | string;
    incidentTitle?: string;
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | string;
    progress?: number;
    deadline?: string | null;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW' | string;
}

type Filter = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

const FILTERS: { key: Filter; label: string }[] = [
    { key: 'ALL', label: 'Toutes' },
    { key: 'PENDING', label: 'En attente' },
    { key: 'IN_PROGRESS', label: 'En cours' },
    { key: 'COMPLETED', label: 'Réalisées' },
];

const STATUS_CHIP: Record<string, string> = {
    PENDING: 'bg-violet-50 text-violet-700',
    IN_PROGRESS: 'bg-amber-50 text-amber-700',
    COMPLETED: 'bg-emerald-50 text-emerald-700',
    CANCELLED: 'bg-rose-50 text-rose-700',
};

const STATUS_LABEL: Record<string, string> = {
    PENDING: 'En attente',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Réalisée',
    CANCELLED: 'Annulée',
};

const SOURCE_LABEL: Record<string, string> = {
    INCIDENT: 'Incident',
    GENERAL_INSPECTION: 'Inspection',
    HS_ACTIVITY: 'Activité HSE',
    NON_CONFORMITY: 'Non-conformité',
    NEAR_MISS: 'Quasi-accident',
    HAZARD: 'Danger',
    ADHOC: "Idée d'amélioration",
};

const PRIORITY_CHIP: Record<string, string> = {
    HIGH: 'bg-rose-50 text-rose-700',
    MEDIUM: 'bg-amber-50 text-amber-700',
    LOW: 'bg-emerald-50 text-emerald-700',
};

const PRIORITY_LABEL: Record<string, string> = {
    HIGH: 'Élevée',
    MEDIUM: 'Moyenne',
    LOW: 'Faible',
};

function isOverdue(deadline?: string | null): boolean {
    if (!deadline) return false;
    const d = new Date(deadline);
    if (Number.isNaN(d.getTime())) return false;
    const today = new Date();
    d.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return d < today;
}

/** Repli quand le backend n'envoie pas de priorité explicite : dérivée de
 *  l'échéance et de la progression pour rester informative sans inventer
 *  de donnée. */
function derivedPriority(action: CorrectiveActionSummary): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (action.priority && PRIORITY_LABEL[String(action.priority).toUpperCase()]) {
        return String(action.priority).toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW';
    }
    const statusUpper = String(action.status ?? '').toUpperCase();
    if (isOverdue(action.deadline) && statusUpper !== 'COMPLETED' && statusUpper !== 'CANCELLED') return 'HIGH';
    const progress = Number(action.progress ?? 0);
    if (progress < 30) return 'MEDIUM';
    return 'LOW';
}

export default function MobileCorrectiveActionsList() {
    useStatusBarColor('#EA580C', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);
    const companyId = Number(user?.mineId ?? user?.companyId ?? 1);

    const [items, setItems] = useState<CorrectiveActionSummary[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<Filter>('ALL');
    const [stale, setStale] = useState<boolean>(false);

    const fetchData = useCallback(() => {
        setError(null);
        setItems(null);
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<CorrectiveActionSummary[]>({
                    endpoint: `/hns/corrective-action/getAll?companyId=${companyId}`,
                    cacheStore: 'inspectionCache',
                    cacheKey: `corrective-actions-${companyId}`,
                    ttlMs: 2 * 60 * 1000,
                });
                if (!cancelled) {
                    setItems(Array.isArray(res.data) ? res.data : []);
                    setStale(res.stale);
                }
            } catch {
                if (!cancelled) {
                    setError('Impossible de charger les actions correctives.');
                    setItems([]);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [companyId]);

    useEffect(fetchData, [fetchData]);

    const filtered = useMemo(() => {
        if (!items) return [];
        if (filter === 'ALL') return items;
        return items.filter((a) => String(a.status ?? '').toUpperCase() === filter);
    }, [items, filter]);

    const openAction = (action: CorrectiveActionSummary) => {
        haptic('light');
        navigate(`/m/action/${action.id}`);
    };

    return (
        <>
            <MobileTopBar title="Actions correctives" subtitle="Plans d'action HSE" accent="#EA580C" onBack={() => navigate(-1)} />

            {stale && (
                <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-[12px] px-4 py-1.5 flex items-center gap-1.5">
                    <IconAlertOctagon size={12} stroke={1.8} />
                    <span>Données du cache local — synchronisation au retour du réseau.</span>
                </div>
            )}

            {/* top = hauteur TopBar (56px + safe-area) : avec top-0 la barre glissait DERRIÈRE la TopBar (z-40) au scroll et devenait incliquable */}
            <div className="px-4 pt-3 pb-2 sticky z-10 bg-[#FAF8F3]" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 56px)' }}>
                <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            onClick={() => { haptic('light'); setFilter(f.key); }}
                            className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap flex-shrink-0 border transition ${
                                filter === f.key
                                    ? 'bg-orange-700 text-white border-orange-700'
                                    : 'bg-white text-slate-700 border-slate-200'
                            }`}
                            style={{ minHeight: 44 }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <section className="px-4 pt-2 space-y-2.5">
                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[13px] rounded-xl p-3 flex items-center gap-2">
                        <span className="flex-1">{error}</span>
                        <button type="button" onClick={fetchData} className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-medium flex-shrink-0 inline-flex items-center justify-center gap-1" style={{ minHeight: 44 }}>
                            <IconRefresh size={12} stroke={2} /> Réessayer
                        </button>
                    </div>
                )}

                {!items && !error && (
                    <ListSkeleton count={5} />
                )}

                {items && filtered.length === 0 && !error && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center mb-2">
                            <IconClipboardCheck size={24} stroke={1.6} className="text-slate-400" />
                        </div>
                        <p className="text-[14px] font-semibold text-slate-800 mb-1">
                            Aucune action corrective à afficher
                        </p>
                        <p className="text-[12px] text-slate-500">
                            {filter === 'ALL' ? 'Le registre est vide.' : 'Aucune action dans cette catégorie.'}
                        </p>
                    </div>
                )}

                {items && filtered.map((action) => {
                    const statusUpper = String(action.status ?? '').toUpperCase();
                    const statusChip = STATUS_CHIP[statusUpper] ?? 'bg-slate-100 text-slate-600';
                    const statusLabel = STATUS_LABEL[statusUpper] ?? (action.status || '—');
                    const sourceLabel = SOURCE_LABEL[String(action.type ?? '').toUpperCase()] ?? (action.type || '—');
                    const prio = derivedPriority(action);
                    const overdue = isOverdue(action.deadline) && statusUpper !== 'COMPLETED' && statusUpper !== 'CANCELLED';
                    return (
                        <button
                            key={action.id}
                            type="button"
                            onClick={() => openAction(action)}
                            className="w-full text-left bg-white border border-slate-200 rounded-2xl p-3.5 active:scale-[0.99] transition shadow-sm"
                            style={{ minHeight: 88 }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[11px] font-medium">
                                            {sourceLabel}
                                        </span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${PRIORITY_CHIP[prio]} text-[11px] font-medium`}>
                                            {PRIORITY_LABEL[prio]}
                                        </span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${statusChip} text-[11px] font-medium`}>
                                            {statusLabel}
                                        </span>
                                    </div>
                                    <h3 className="text-[14.5px] font-semibold text-slate-900 leading-tight truncate"
                                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                                        {action.actionName}
                                    </h3>
                                    {action.incidentTitle && (
                                        <p className="text-[12.5px] text-slate-600 truncate mt-0.5">
                                            Source : {action.incidentTitle}
                                        </p>
                                    )}
                                    <p className={`text-[11.5px] mt-1 flex items-center gap-1.5 ${overdue ? 'text-rose-600 font-medium' : 'text-slate-500'}`}>
                                        <IconCalendarStats size={11} stroke={1.7} />
                                        {action.deadline ? new Date(action.deadline).toLocaleDateString('fr-FR') : '—'}
                                        {overdue && ' · En retard'}
                                    </p>
                                </div>
                                <IconChevronRight size={18} stroke={1.8} className="text-slate-300 flex-shrink-0 mt-1" />
                            </div>
                        </button>
                    );
                })}
            </section>
        </>
    );
}

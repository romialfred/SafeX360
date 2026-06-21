/**
 * MobileIncidentsHistory — Historique des incidents déclarés par
 * l'utilisateur courant. Liste compacte avec filtre par statut + tap
 * pour ouvrir le détail.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconArrowLeft,
    IconAlertOctagon,
    IconChevronRight,
    IconCalendarStats,
} from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { ListSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { getCached } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';

interface IncidentSummary {
    id: number;
    reference?: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    declaredAt: string;
    status?: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
    descriptionExcerpt?: string;
}

type FilterStatus = 'ALL' | 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';

const FILTERS: { key: FilterStatus; label: string }[] = [
    { key: 'ALL', label: 'Tous' },
    { key: 'OPEN', label: 'Ouverts' },
    { key: 'IN_REVIEW', label: 'En analyse' },
    { key: 'RESOLVED', label: 'Résolus' },
];

const TYPE_LABELS: Record<string, string> = {
    NEAR_MISS: 'Presqu\'accident',
    INJURY: 'Blessure',
    PROPERTY: 'Dommage matériel',
    ENVIRONMENTAL: 'Environnement',
};

const SEVERITY_DOTS: Record<IncidentSummary['severity'], string> = {
    LOW: 'bg-emerald-500',
    MEDIUM: 'bg-amber-500',
    HIGH: 'bg-orange-500',
    CRITICAL: 'bg-rose-600',
};

export default function MobileIncidentsHistory() {
    useStatusBarColor('#B45309', 'LIGHT');
    const navigate = useNavigate();
    const user = useAppSelector((state: any) => state.user);
    const userId = Number(user?.id ?? user?.empId ?? user?.userId ?? user?.sub ?? 0);

    const [items, setItems] = useState<IncidentSummary[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterStatus>('ALL');

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<IncidentSummary[]>({
                    endpoint: `/hns/incidents/findbyreporter/${userId}`,
                    cacheStore: 'inspectionCache',
                    cacheKey: `incidents-${userId}`,
                    ttlMs: 30 * 60 * 1000,
                });
                if (!cancelled) {
                    // Tri par date desc (plus récent en premier)
                    const sorted = res.data.slice().sort((a, b) =>
                        new Date(b.declaredAt).getTime() - new Date(a.declaredAt).getTime()
                    );
                    setItems(sorted);
                }
            } catch (_e) {
                if (!cancelled) {
                    setError('Historique indisponible. Vérifiez votre connexion.');
                    setItems([]);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [userId]);

    const filtered = useMemo(() => {
        if (!items) return [];
        if (filter === 'ALL') return items;
        return items.filter((i) => i.status === filter);
    }, [items, filter]);

    return (
        <>
            <MobileTopBar
                title="Mes signalements"
                subtitle="Historique de mes déclarations"
                accent="#B45309"
                onBack={() => navigate('/m/profile')}
            />
            <section className="px-4 pt-3">
                {/* Filtre segmenté */}
                <div className="flex gap-1.5 mb-3 overflow-x-auto -mx-1 px-1 pb-1">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            onClick={() => setFilter(f.key)}
                            className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap flex-shrink-0 border transition ${
                                filter === f.key
                                    ? 'bg-amber-600 text-white border-amber-600'
                                    : 'bg-white text-slate-700 border-slate-200'
                            }`}
                            style={{ minHeight: 32 }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 text-[12.5px] rounded-xl p-3 mb-3 flex items-start gap-2">
                        <IconAlertOctagon size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {!items && !error && (
                    <ListSkeleton count={5} />
                )}

                {items && filtered.length === 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
                        <IconAlertOctagon size={28} stroke={1.6} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-[14px] font-semibold text-slate-800 mb-1">
                            {filter === 'ALL'
                                ? 'Aucun signalement enregistré'
                                : 'Aucun signalement dans cette catégorie'}
                        </p>
                        <p className="text-[12.5px] text-slate-500 mb-4">
                            Une situation HSE inhabituelle ? Signalez-la depuis l'accueil.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/m/incident/new')}
                            className="px-4 py-2 rounded-lg bg-amber-700 text-white text-[13px] font-medium"
                            style={{ minHeight: 44 }}
                        >
                            Nouveau signalement
                        </button>
                    </div>
                )}

                {items && filtered.length > 0 && (
                    <ul className="space-y-2">
                        {filtered.map((inc) => (
                            <li key={inc.id}>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/m/incident/${inc.id}`)}
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-left active:bg-slate-50"
                                    style={{ minHeight: 64 }}
                                >
                                    <div className="flex items-start gap-2.5">
                                        <span
                                            className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${SEVERITY_DOTS[inc.severity]}`}
                                            aria-label={`Gravité ${inc.severity}`}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[13.5px] font-semibold text-slate-900 truncate">
                                                    {TYPE_LABELS[inc.type] ?? inc.type}
                                                </span>
                                                {inc.reference && (
                                                    <span className="text-[11px] font-mono text-slate-500">
                                                        {inc.reference}
                                                    </span>
                                                )}
                                            </div>
                                            {inc.descriptionExcerpt && (
                                                <p className="text-[12px] text-slate-600 line-clamp-1 mt-0.5">
                                                    {inc.descriptionExcerpt}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                                                <IconCalendarStats size={11} stroke={1.7} />
                                                {new Date(inc.declaredAt).toLocaleDateString('fr-FR', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                        </div>
                                        <IconChevronRight size={14} stroke={1.8} className="text-slate-300 mt-1.5 flex-shrink-0" />
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                <button
                    type="button"
                    onClick={() => navigate('/m/profile')}
                    className="w-full mt-5 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 text-[13px]"
                    style={{ minHeight: 44 }}
                >
                    <IconArrowLeft size={14} stroke={1.8} />
                    Retour
                </button>
            </section>
        </>
    );
}

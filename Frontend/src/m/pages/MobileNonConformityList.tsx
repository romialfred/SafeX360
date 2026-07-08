/**
 * MobileNonConformityList — Registre tactile des non-conformités / constats
 * centraux (Non-conformity & Near Miss). Liste verticale de cards, tap =
 * ouvrir le détail web (réutilisé tel quel côté mobile).
 *
 * Le backend conserve le cycle de vie REPORTED / ANALYSIS / AC_IMPLEMENTATION
 * / CLOSED / CANCELLED / REJECTED (voir nonConformityLabels.ts côté web) —
 * on réutilise ici la même palette charte R7 plutôt que les codes simplifiés
 * pour rester cohérent avec les données réelles retournées par /getAll.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconAlertTriangle,
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
import { MobileButton } from '../components/MobileUI';

interface NonConformitySummary {
    id: number | string;
    number?: string;
    title?: string;
    type?: 'NON_CONFORMITY' | 'NEAR_MISS' | string;
    status?: string;
    severityLevel?: string;
    priority?: string;
    date?: string;
}

type Filter = 'ALL' | 'REPORTED' | 'ANALYSIS' | 'AC_IMPLEMENTATION' | 'CLOSED';

const FILTERS: { key: Filter; label: string }[] = [
    { key: 'ALL', label: 'Tous' },
    { key: 'REPORTED', label: 'Déclarés' },
    { key: 'ANALYSIS', label: 'En analyse' },
    { key: 'AC_IMPLEMENTATION', label: 'Traitement' },
];

const STATUS_CHIP: Record<string, string> = {
    REPORTED: 'bg-cyan-50 text-cyan-700',
    ANALYSIS: 'bg-amber-50 text-amber-700',
    AC_IMPLEMENTATION: 'bg-orange-50 text-orange-700',
    OPEN: 'bg-amber-50 text-amber-700',
    IN_PROGRESS: 'bg-blue-50 text-blue-700',
    CLOSED: 'bg-emerald-50 text-emerald-700',
    CANCELLED: 'bg-slate-100 text-slate-500',
    REJECTED: 'bg-rose-50 text-rose-700',
};

const STATUS_LABEL: Record<string, string> = {
    REPORTED: 'Déclaré',
    ANALYSIS: 'En analyse',
    AC_IMPLEMENTATION: 'Traitement',
    OPEN: 'Ouvert',
    IN_PROGRESS: 'En cours',
    CLOSED: 'Clôturé',
    CANCELLED: 'Annulé',
    REJECTED: 'Rejeté',
};

const SEVERITY_DOT: Record<string, string> = {
    Insignifiante: 'bg-emerald-500',
    Mineure: 'bg-lime-500',
    'Modérée': 'bg-yellow-500',
    Majeure: 'bg-orange-500',
    Catastrophique: 'bg-red-600',
};

export default function MobileNonConformityList() {
    useStatusBarColor('#DC2626', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);
    const companyId = Number(user?.mineId ?? user?.companyId ?? 1);

    const [items, setItems] = useState<NonConformitySummary[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<Filter>('ALL');
    const [stale, setStale] = useState<boolean>(false);

    const fetchData = useCallback(() => {
        setError(null);
        setItems(null);
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<NonConformitySummary[]>({
                    endpoint: `/hns/non-conformity/getAll?companyId=${companyId}`,
                    cacheStore: 'inspectionCache',
                    cacheKey: `non-conformity-${companyId}`,
                    ttlMs: 2 * 60 * 1000,
                });
                if (!cancelled) {
                    setItems(Array.isArray(res.data) ? res.data : []);
                    setStale(res.stale);
                }
            } catch {
                if (!cancelled) {
                    setError('Impossible de charger les non-conformités.');
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
        return items.filter((i) => String(i.status ?? '').toUpperCase() === filter);
    }, [items, filter]);

    const openDetail = (item: NonConformitySummary) => {
        haptic('light');
        navigate(`/m/non-conformities/${item.id}`);
    };

    return (
        <>
            <MobileTopBar title="Non-conformités" subtitle="Registre des constats" accent="#DC2626" onBack={() => navigate(-1)} />

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
                                    ? 'bg-red-600 text-white border-red-600'
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
                {/* CTA de déclaration terrain — sans lui l'écran /m/non-conformities/new est orphelin */}
                <MobileButton
                    accent="#DC2626"
                    onClick={() => { haptic('light'); navigate('/m/non-conformities/new'); }}
                    icon={<IconAlertTriangle size={16} stroke={2} />}
                >
                    Déclarer un événement
                </MobileButton>

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
                            <IconAlertTriangle size={24} stroke={1.6} className="text-slate-400" />
                        </div>
                        <p className="text-[14px] font-semibold text-slate-800 mb-1">
                            Aucune non-conformité à afficher
                        </p>
                        <p className="text-[12px] text-slate-500">
                            {filter === 'ALL' ? 'Le registre est vide.' : 'Aucun élément dans cette catégorie.'}
                        </p>
                    </div>
                )}

                {items && filtered.map((item) => {
                    const statusUpper = String(item.status ?? '').toUpperCase();
                    const chip = STATUS_CHIP[statusUpper] ?? 'bg-slate-100 text-slate-600';
                    const label = STATUS_LABEL[statusUpper] ?? (item.status || '—');
                    const dot = SEVERITY_DOT[item.severityLevel ?? ''] ?? 'bg-slate-300';
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => openDetail(item)}
                            className="w-full text-left bg-white border border-slate-200 rounded-2xl p-3.5 active:scale-[0.99] transition shadow-sm"
                            style={{ minHeight: 88 }}
                        >
                            <div className="flex items-start gap-3">
                                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${dot}`} aria-hidden="true" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${chip} text-[11px] font-medium`}>
                                            {label}
                                        </span>
                                        {item.number && (
                                            <span className="text-[11px] font-mono text-slate-500">{item.number}</span>
                                        )}
                                    </div>
                                    <h3 className="text-[14.5px] font-semibold text-slate-900 leading-tight truncate"
                                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                                        {item.title ?? 'Non-conformité'}
                                    </h3>
                                    <p className="text-[11.5px] text-slate-500 mt-1 flex items-center gap-1.5">
                                        <IconCalendarStats size={11} stroke={1.7} />
                                        {item.date ? new Date(item.date).toLocaleDateString('fr-FR') : '—'}
                                        {item.severityLevel && <span> · {item.severityLevel}</span>}
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

/**
 * MobileAuditList — Registre tactile des audits (lecture seule terrain).
 *
 * Liste verticale de cards, filtre par statut (Planification / Préparation /
 * Exécution / Clôturé), tap = ouvrir le détail web de l'audit.
 * Statuts et catégories alignés sur auditLabels.ts (charte R7) :
 * cyan=planifié, violet=préparation, amber=exécution, emerald=clôturé,
 * slate=annulé ; catégorie interne=cyan, externe=violet.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconClipboardList,
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

interface AuditSummary {
    id: number | string;
    refNumber?: string;
    title: string;
    category?: 'Internal' | 'External' | string;
    status?: 'PLANNING' | 'PREPARATION' | 'EXECUTION' | 'CLOSED' | 'CANCELLED' | string;
    startDate?: string;
}

type Filter = 'ALL' | 'PLANNING' | 'PREPARATION' | 'EXECUTION' | 'CLOSED';

const FILTERS: { key: Filter; label: string }[] = [
    { key: 'ALL', label: 'Tous' },
    { key: 'PLANNING', label: 'Planification' },
    { key: 'EXECUTION', label: 'En cours' },
    { key: 'CLOSED', label: 'Clôturés' },
];

const STATUS_CHIP: Record<string, string> = {
    PLANNING: 'bg-cyan-50 text-cyan-700',
    PREPARATION: 'bg-violet-50 text-violet-700',
    EXECUTION: 'bg-amber-50 text-amber-700',
    CLOSED: 'bg-emerald-50 text-emerald-700',
    CANCELLED: 'bg-slate-100 text-slate-500',
};

const STATUS_LABEL: Record<string, string> = {
    PLANNING: 'Planification',
    PREPARATION: 'Préparation',
    EXECUTION: 'Exécution',
    CLOSED: 'Clôturé',
    CANCELLED: 'Annulé',
};

const CATEGORY_CHIP: Record<string, string> = {
    INTERNAL: 'bg-cyan-50 text-cyan-700',
    EXTERNAL: 'bg-violet-50 text-violet-700',
};

const CATEGORY_LABEL: Record<string, string> = {
    INTERNAL: 'Interne',
    EXTERNAL: 'Externe',
};

export default function MobileAuditList() {
    useStatusBarColor('#0369A1', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);
    const companyId = Number(user?.mineId ?? user?.companyId ?? 1);

    const [items, setItems] = useState<AuditSummary[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<Filter>('ALL');
    const [stale, setStale] = useState<boolean>(false);

    const fetchData = useCallback(() => {
        setError(null);
        setItems(null);
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<AuditSummary[]>({
                    endpoint: `/hns/audit/getAll?companyId=${companyId}`,
                    cacheStore: 'inspectionCache',
                    cacheKey: `audits-${companyId}`,
                    ttlMs: 2 * 60 * 1000,
                });
                if (!cancelled) {
                    setItems(Array.isArray(res.data) ? res.data : []);
                    setStale(res.stale);
                }
            } catch {
                if (!cancelled) {
                    setError('Impossible de charger les audits.');
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

    const openAudit = (audit: AuditSummary) => {
        haptic('light');
        navigate(`/audit-management/details/${audit.id}`);
    };

    return (
        <>
            <MobileTopBar title="Audits" subtitle="Registre des audits ISO" accent="#0369A1" onBack={() => navigate(-1)} />

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
                                    ? 'bg-sky-700 text-white border-sky-700'
                                    : 'bg-white text-slate-700 border-slate-200'
                            }`}
                            style={{ minHeight: 32 }}
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
                        <button type="button" onClick={fetchData} className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-medium flex-shrink-0 inline-flex items-center gap-1">
                            <IconRefresh size={12} stroke={2} /> Réessayer
                        </button>
                    </div>
                )}

                {!items && !error && (
                    <ListSkeleton count={5} />
                )}

                {items && filtered.length === 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center mb-2">
                            <IconClipboardList size={24} stroke={1.6} className="text-slate-400" />
                        </div>
                        <p className="text-[14px] font-semibold text-slate-800 mb-1">
                            Aucun audit à afficher
                        </p>
                        <p className="text-[12px] text-slate-500">
                            {filter === 'ALL' ? 'Le registre est vide.' : 'Aucun audit dans cette catégorie.'}
                        </p>
                    </div>
                )}

                {items && filtered.map((audit) => {
                    const statusUpper = String(audit.status ?? '').toUpperCase();
                    const statusChip = STATUS_CHIP[statusUpper] ?? 'bg-slate-100 text-slate-600';
                    const statusLabel = STATUS_LABEL[statusUpper] ?? (audit.status || '—');
                    const categoryUpper = String(audit.category ?? '').toUpperCase();
                    const categoryChip = CATEGORY_CHIP[categoryUpper] ?? 'bg-slate-100 text-slate-600';
                    const categoryLabel = CATEGORY_LABEL[categoryUpper] ?? (audit.category || '—');
                    return (
                        <button
                            key={audit.id}
                            type="button"
                            onClick={() => openAudit(audit)}
                            className="w-full text-left bg-white border border-slate-200 rounded-2xl p-3.5 active:scale-[0.99] transition shadow-sm"
                            style={{ minHeight: 88 }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${categoryChip} text-[11px] font-medium`}>
                                            {categoryLabel}
                                        </span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${statusChip} text-[11px] font-medium`}>
                                            {statusLabel}
                                        </span>
                                    </div>
                                    <h3 className="text-[14.5px] font-semibold text-slate-900 leading-tight truncate"
                                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                                        {audit.title}
                                    </h3>
                                    {audit.refNumber && (
                                        <p className="text-[11.5px] font-mono text-slate-500 mt-0.5">{audit.refNumber}</p>
                                    )}
                                    <p className="text-[11.5px] text-slate-500 mt-1 flex items-center gap-1.5">
                                        <IconCalendarStats size={11} stroke={1.7} />
                                        {audit.startDate ? new Date(audit.startDate).toLocaleDateString('fr-FR') : '—'}
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

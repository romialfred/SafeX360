/**
 * MobileInspectionsList — Registre tactile des inspections.
 *
 * Liste verticale de cards, segment filter Tous/Mes/En cours, tap = ouvrir
 * execution. FAB cyan en bas a droite pour planifier (reserve PLAN+).
 * Pull-to-refresh deja fourni par MobileShell.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconClipboardList,
    IconChevronRight,
    IconCalendarStats,
    IconCircleDot,
    IconCircleCheck,
    IconCircleX,
    IconAlertOctagon,
    IconRefresh,
} from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { ListSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { getCached } from '../services/mobileApi';
import type { InspectionSummaryDTO, InspectionStatus } from '../../services/InspectionService';
import { useAppSelector } from '../../slices/hooks';

type Filter = 'all' | 'mine' | 'inProgress';

const STATUS_STYLES: Record<InspectionStatus, { bg: string; text: string; icon: React.ReactNode }> = {
    SCHEDULED:   { bg: 'bg-cyan-50',    text: 'text-cyan-800',    icon: <IconCalendarStats size={14} stroke={1.8} /> },
    IN_PROGRESS: { bg: 'bg-amber-50',   text: 'text-amber-800',   icon: <IconCircleDot size={14} stroke={1.8} /> },
    SUBMITTED:   { bg: 'bg-violet-50',  text: 'text-violet-800',  icon: <IconCircleDot size={14} stroke={1.8} /> },
    APPROVED:    { bg: 'bg-emerald-50', text: 'text-emerald-800', icon: <IconCircleCheck size={14} stroke={1.8} /> },
    ARCHIVED:    { bg: 'bg-slate-50',   text: 'text-slate-600',   icon: <IconCircleCheck size={14} stroke={1.8} /> },
    REJECTED:    { bg: 'bg-rose-50',    text: 'text-rose-800',    icon: <IconCircleX size={14} stroke={1.8} /> },
    PENDING:     { bg: 'bg-slate-50',   text: 'text-slate-600',   icon: <IconCircleDot size={14} stroke={1.8} /> },
    COMPLETED:   { bg: 'bg-emerald-50', text: 'text-emerald-800', icon: <IconCircleCheck size={14} stroke={1.8} /> },
    CANCELLED:   { bg: 'bg-slate-50',   text: 'text-slate-400',   icon: <IconCircleX size={14} stroke={1.8} /> },
};

const STATUS_LABEL: Record<InspectionStatus, string> = {
    SCHEDULED: 'Planifiée',
    IN_PROGRESS: 'En cours',
    SUBMITTED: 'Soumise',
    APPROVED: 'Approuvée',
    ARCHIVED: 'Archivée',
    REJECTED: 'Rejetée',
    PENDING: 'En attente',
    COMPLETED: 'Terminée',
    CANCELLED: 'Annulée',
};

export default function MobileInspectionsList() {
    useStatusBarColor('#0E7490', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);
    const userId = Number(user?.id ?? user?.empId ?? user?.userId ?? user?.sub ?? 0);

    const [items, setItems] = useState<InspectionSummaryDTO[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<Filter>('all');
    const [stale, setStale] = useState<boolean>(false);

    const fetchInspections = useCallback(() => {
        setError(null);
        setItems(null);
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<InspectionSummaryDTO[]>({
                    endpoint: '/hns/inspection/list',
                    cacheStore: 'inspectionCache',
                    cacheKey: 'list',
                    ttlMs: 5 * 60 * 1000,
                });
                if (!cancelled) {
                    setItems(Array.isArray(res.data) ? res.data : []);
                    setStale(res.stale);
                }
            } catch (e: any) {
                if (!cancelled) setError("Impossible de charger les inspections.");
            }
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(fetchInspections, [fetchInspections]);

    const filtered = useMemo(() => {
        if (!items) return null;
        switch (filter) {
            case 'mine':
                return items.filter((i) => i.primaryInspectorId === userId);
            case 'inProgress':
                return items.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'SCHEDULED');
            default:
                return items;
        }
    }, [items, filter, userId]);

    const openInspection = (it: InspectionSummaryDTO) => {
        haptic('light');
        // Routes mobile : on garde execute pour SCHEDULED/IN_PROGRESS/REJECTED,
        // detail pour les statuts en lecture seule.
        if (it.status === 'SCHEDULED' || it.status === 'IN_PROGRESS' || it.status === 'REJECTED') {
            navigate(`/m/inspections/${it.id}`);
        } else {
            navigate(`/m/inspections/${it.id}`);
        }
    };

    return (
        <>
            <MobileTopBar title="Inspections" subtitle="Mes inspections terrain" accent="#0E7490" />

            {/* Banner stale (donnees viennent du cache) */}
            {stale && (
                <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-[12px] px-4 py-1.5 flex items-center gap-1.5">
                    <IconAlertOctagon size={12} stroke={1.8} />
                    <span>Données du cache local — synchronisation au retour du réseau.</span>
                </div>
            )}

            {/* Filtres */}
            <div className="px-4 pt-3 pb-2 sticky top-0 z-10 bg-[#FAF8F3]">
                <div className="grid grid-cols-3 gap-1.5 bg-white border border-slate-200 rounded-full p-1">
                    {([
                        ['all', 'Toutes'],
                        ['mine', 'Mes inspections'],
                        ['inProgress', 'En cours'],
                    ] as const).map(([f, label]) => (
                        <button
                            key={f}
                            type="button"
                            onClick={() => { haptic('light'); setFilter(f); }}
                            className={`py-1.5 text-[12px] rounded-full transition ${
                                filter === f
                                    ? 'bg-cyan-700 text-white font-medium'
                                    : 'text-slate-600'
                            }`}
                            style={{ minHeight: 36 }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Liste */}
            <section className="px-4 pt-2 space-y-2.5">
                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[13px] rounded-xl p-3 flex items-center gap-2">
                        <span className="flex-1">{error}</span>
                        <button type="button" onClick={fetchInspections} className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-medium flex-shrink-0 inline-flex items-center gap-1">
                            <IconRefresh size={12} stroke={2} /> Réessayer
                        </button>
                    </div>
                )}

                {!items && !error && (
                    <ListSkeleton count={5} />
                )}

                {filtered && filtered.length === 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center mb-2">
                            <IconClipboardList size={24} stroke={1.6} className="text-slate-400" />
                        </div>
                        <p className="text-[14px] font-semibold text-slate-800 mb-1">
                            Aucune inspection à afficher
                        </p>
                        <p className="text-[12px] text-slate-500">
                            {filter === 'mine' ? 'Vous n\'êtes assigné(e) à aucune inspection.' :
                             filter === 'inProgress' ? 'Aucune inspection en cours ou planifiée.' :
                             'Le registre est vide.'}
                        </p>
                    </div>
                )}

                {filtered && filtered.map((it) => {
                    const s = STATUS_STYLES[it.status];
                    return (
                        <button
                            key={it.id}
                            type="button"
                            onClick={() => openInspection(it)}
                            className="w-full text-left bg-white border border-slate-200 rounded-2xl p-3.5 active:scale-[0.99] transition shadow-sm"
                            style={{ minHeight: 88 }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${s.bg} ${s.text} text-[11px] font-medium mb-1`}>
                                        {s.icon}
                                        {STATUS_LABEL[it.status]}
                                    </div>
                                    <h3 className="text-[14.5px] font-semibold text-slate-900 leading-tight truncate"
                                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                                        {it.templateName ?? 'Inspection'}
                                    </h3>
                                    <p className="text-[12.5px] text-slate-600 truncate mt-0.5">
                                        {it.targetLabel ?? '—'}
                                    </p>
                                    <p className="text-[11.5px] text-slate-500 mt-1">
                                        {it.plannedDate ?? '—'}
                                        {it.totalCheckpoints > 0 && (
                                            <> · {it.findingsRecorded}/{it.totalCheckpoints} points</>
                                        )}
                                        {it.nonConformCount > 0 && (
                                            <span className="text-rose-700 font-medium"> · {it.nonConformCount} NC</span>
                                        )}
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

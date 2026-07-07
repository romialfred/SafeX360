/**
 * MobileMeetingsList — Registre tactile des réunions sécurité (HS Meetings).
 *
 * Liste verticale de cards, filtre par statut, tap = ouvrir le détail web
 * de la réunion. Statuts alignés sur hsMeetingsLabels.ts (charte R7) :
 * cyan=planifiée, amber=en cours, emerald=réalisée, rose=annulée.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconUsersGroup,
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

interface MeetingSummary {
    id: number | string;
    title: string;
    type?: 'HSM' | 'ST' | string;
    plannedDate?: string;
    startTime?: string;
    endTime?: string;
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | string;
    participants?: Array<unknown>;
    participantsCount?: number;
}

type Filter = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const FILTERS: { key: Filter; label: string }[] = [
    { key: 'ALL', label: 'Toutes' },
    { key: 'PENDING', label: 'Planifiées' },
    { key: 'IN_PROGRESS', label: 'En cours' },
    { key: 'COMPLETED', label: 'Réalisées' },
];

const STATUS_CHIP: Record<string, string> = {
    PENDING: 'bg-cyan-50 text-cyan-700',
    IN_PROGRESS: 'bg-amber-50 text-amber-700',
    COMPLETED: 'bg-emerald-50 text-emerald-700',
    CANCELLED: 'bg-rose-50 text-rose-700',
};

const STATUS_LABEL: Record<string, string> = {
    PENDING: 'Planifiée',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Réalisée',
    CANCELLED: 'Annulée',
};

const TYPE_LABEL: Record<string, string> = {
    HSM: 'Réunion santé-sécurité',
    ST: 'Tournée leadership',
};

function participantsCountOf(m: MeetingSummary): number {
    if (typeof m.participantsCount === 'number') return m.participantsCount;
    if (Array.isArray(m.participants)) return m.participants.length;
    return 0;
}

export default function MobileMeetingsList() {
    useStatusBarColor('#059669', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);
    const companyId = Number(user?.mineId ?? user?.companyId ?? 1);

    const [items, setItems] = useState<MeetingSummary[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<Filter>('ALL');
    const [stale, setStale] = useState<boolean>(false);

    const fetchData = useCallback(() => {
        setError(null);
        setItems(null);
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<MeetingSummary[]>({
                    endpoint: `/hns/hs-activities/getAll?companyId=${companyId}`,
                    cacheStore: 'inspectionCache',
                    cacheKey: `hs-meetings-${companyId}`,
                    ttlMs: 2 * 60 * 1000,
                });
                if (!cancelled) {
                    setItems(Array.isArray(res.data) ? res.data : []);
                    setStale(res.stale);
                }
            } catch {
                if (!cancelled) {
                    setError('Impossible de charger les réunions sécurité.');
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
        return items.filter((m) => String(m.status ?? '').toUpperCase() === filter);
    }, [items, filter]);

    const openMeeting = (meeting: MeetingSummary) => {
        haptic('light');
        navigate(`/hs-Meetings/details-meeting/${meeting.id}`);
    };

    return (
        <>
            <MobileTopBar title="Réunions sécurité" subtitle="Activités HSE" accent="#059669" onBack={() => navigate(-1)} />

            {stale && (
                <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-[12px] px-4 py-1.5 flex items-center gap-1.5">
                    <IconAlertOctagon size={12} stroke={1.8} />
                    <span>Données du cache local — synchronisation au retour du réseau.</span>
                </div>
            )}

            <div className="px-4 pt-3 pb-2 sticky top-0 z-10 bg-[#FAF8F3]">
                <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            onClick={() => { haptic('light'); setFilter(f.key); }}
                            className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap flex-shrink-0 border transition ${
                                filter === f.key
                                    ? 'bg-emerald-700 text-white border-emerald-700'
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
                            <IconUsersGroup size={24} stroke={1.6} className="text-slate-400" />
                        </div>
                        <p className="text-[14px] font-semibold text-slate-800 mb-1">
                            Aucune réunion à afficher
                        </p>
                        <p className="text-[12px] text-slate-500">
                            {filter === 'ALL' ? 'Aucune réunion planifiée.' : 'Aucune réunion dans cette catégorie.'}
                        </p>
                    </div>
                )}

                {items && filtered.map((meeting) => {
                    const statusUpper = String(meeting.status ?? '').toUpperCase();
                    const chip = STATUS_CHIP[statusUpper] ?? 'bg-slate-100 text-slate-600';
                    const label = STATUS_LABEL[statusUpper] ?? (meeting.status || '—');
                    const count = participantsCountOf(meeting);
                    return (
                        <button
                            key={meeting.id}
                            type="button"
                            onClick={() => openMeeting(meeting)}
                            className="w-full text-left bg-white border border-slate-200 rounded-2xl p-3.5 active:scale-[0.99] transition shadow-sm"
                            style={{ minHeight: 88 }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${chip} text-[11px] font-medium mb-1`}>
                                        {label}
                                    </div>
                                    <h3 className="text-[14.5px] font-semibold text-slate-900 leading-tight truncate"
                                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                                        {meeting.title}
                                    </h3>
                                    <p className="text-[12.5px] text-slate-600 truncate mt-0.5">
                                        {TYPE_LABEL[meeting.type ?? ''] ?? (meeting.type || '—')}
                                    </p>
                                    <p className="text-[11.5px] text-slate-500 mt-1 flex items-center gap-3">
                                        <span className="flex items-center gap-1.5">
                                            <IconCalendarStats size={11} stroke={1.7} />
                                            {meeting.plannedDate ? new Date(meeting.plannedDate).toLocaleDateString('fr-FR') : '—'}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <IconUsersGroup size={11} stroke={1.7} />
                                            {count} participant{count > 1 ? 's' : ''}
                                        </span>
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

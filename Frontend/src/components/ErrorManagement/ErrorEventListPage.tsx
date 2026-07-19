/**
 * ErrorEventListPage — Registre des événements du module « Gestion des Erreurs ».
 *
 * Route : /error-management
 *
 * Rôle fédérateur : consolidation des signaux faibles (situations dangereuses,
 * presqu'accidents, incidents, accidents) toutes sources confondues. Vue premium
 * (charte signature NAVY) : KPI hero, recherche + filtres (statut / type /
 * criticité), table cliquable vers le détail.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Loader } from '@mantine/core';
import {
    IconChevronRight,
    IconEye,
    IconPlus,
    IconRefresh,
    IconSearch,
    IconShieldExclamation,
    IconTimeline,
} from '@tabler/icons-react';
import {
    getKpis,
    listCriticalityMatrix,
    listEventTypes,
    listEvents,
    type CriticalityLevel,
    type ErrorCriticalityMatrixCell,
    type ErrorEventDTO,
    type ErrorEventStatus,
    type ErrorEventType,
    type ErrorKpiDTO,
} from '../../services/ErrorManagementService';
import { errorNotification, extractErrorMessage } from '../../utility/NotificationUtility';
import {
    AMBER,
    CRITICALITY_LABELS,
    NAVY,
    NAVY_DEEP,
    TEAL,
    STATUS_FLOW,
    STATUS_LABELS,
    formatDay,
} from './errorManagementLabels';
import {
    AnonymousBadge,
    CriticalityChip,
    EventTypeChip,
    HipoBadge,
    StatusChip,
} from './ErrorChips';
import {
    classifyRegisterLoadFailure,
    type RegisterLoadFailure,
} from './registerLoadFailure';

const CRITICALITY_FILTER: CriticalityLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const ErrorEventListPage = () => {
    const navigate = useNavigate();

    const [events, setEvents] = useState<ErrorEventDTO[]>([]);
    const [eventTypes, setEventTypes] = useState<ErrorEventType[]>([]);
    const [matrix, setMatrix] = useState<ErrorCriticalityMatrixCell[]>([]);
    const [kpis, setKpis] = useState<ErrorKpiDTO | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [loadFailure, setLoadFailure] = useState<RegisterLoadFailure | null>(null);

    const [search, setSearch] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<ErrorEventStatus | ''>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [criticalityFilter, setCriticalityFilter] = useState<CriticalityLevel | ''>('');
    type Lens = 'all' | 'hipo' | 'near' | 'accident';
    const [lens, setLens] = useState<Lens>('all');

    const typeById = useMemo(() => {
        const map = new Map<number, ErrorEventType>();
        eventTypes.forEach((t) => map.set(t.id, t));
        return map;
    }, [eventTypes]);

    /** Code (référentiel) du type d'un événement — sert aux onglets nature. */
    const codeOf = useCallback(
        (e: ErrorEventDTO): string => (e.eventTypeId ? typeById.get(e.eventTypeId)?.code ?? '' : ''),
        [typeById],
    );

    const criticalityColor = useCallback(
        (level?: CriticalityLevel | null): string | null => {
            if (!level) return null;
            const cell = matrix.find((c) => c.criticalityLevel === level);
            return cell?.colorHex ?? null;
        },
        [matrix],
    );

    const loadAll = useCallback(async () => {
        setLoadFailure(null);
        try {
            const [evts, types, mtx, kpi] = await Promise.allSettled([
                listEvents({
                    status: statusFilter || undefined,
                    eventTypeId: typeFilter ? Number(typeFilter) : undefined,
                }),
                listEventTypes(),
                listCriticalityMatrix(),
                getKpis(),
            ]);
            if (evts.status === 'fulfilled') setEvents(evts.value);
            else {
                setEvents([]);
                const failure = classifyRegisterLoadFailure(evts.reason);
                setLoadFailure(failure);
                errorNotification(`${failure.title}. ${failure.message}`);
            }
            if (types.status === 'fulfilled') setEventTypes(types.value);
            if (mtx.status === 'fulfilled') setMatrix(mtx.value);
            if (kpi.status === 'fulfilled') setKpis(kpi.value);
        } catch (err) {
            const failure = classifyRegisterLoadFailure(err);
            setLoadFailure(failure);
            errorNotification(extractErrorMessage(err, `${failure.title}. ${failure.message}`));
        }
    }, [statusFilter, typeFilter]);

    useEffect(() => {
        setLoading(true);
        loadAll().finally(() => setLoading(false));
    }, [loadAll]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await loadAll();
        } finally {
            setRefreshing(false);
        }
    }, [loadAll]);

    // Filtrage client (onglet nature + recherche libre + criticité). Statut/type filtrés serveur.
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return events.filter((e) => {
            if (lens === 'hipo' && !e.isHipo) return false;
            if (lens === 'near' && codeOf(e) !== 'near_miss') return false;
            if (lens === 'accident' && !codeOf(e).startsWith('accident')) return false;
            if (criticalityFilter && e.criticalityLevel !== criticalityFilter) return false;
            if (!q) return true;
            const type = e.eventTypeId ? typeById.get(e.eventTypeId)?.label ?? '' : '';
            const haystack = `${e.reference ?? ''} ${e.title ?? ''} ${type}`.toLowerCase();
            return haystack.includes(q);
        });
    }, [events, search, criticalityFilter, typeById, lens, codeOf]);

    // Comptes par onglet (calculés sur l'ensemble chargé : restent cohérents avec
    // les filtres serveur statut/type actifs). Le ratio n'est pas un compte → caption.
    const lensCounts = useMemo(
        () => ({
            all: events.length,
            hipo: events.filter((e) => e.isHipo).length,
            near: events.filter((e) => codeOf(e) === 'near_miss').length,
            accident: events.filter((e) => codeOf(e).startsWith('accident')).length,
        }),
        [events, codeOf],
    );

    const ratioDisplay =
        kpis && kpis.nearMissAccidentRatio > 0 ? kpis.nearMissAccidentRatio.toFixed(1) : 'n/d';

    const lensTabs: { key: Lens; label: string; accent: string; count: number; hint?: string }[] = [
        { key: 'all', label: 'Tous', accent: NAVY, count: lensCounts.all },
        { key: 'hipo', label: 'HiPo', accent: '#DC2626', count: lensCounts.hipo, hint: 'À potentiel grave (HiPo / SIF)' },
        { key: 'near', label: 'Presqu’accidents', accent: TEAL, count: lensCounts.near },
        { key: 'accident', label: 'Accidents', accent: AMBER, count: lensCounts.accident },
    ];

    const inputBase =
        'px-2.5 py-2 text-[12.5px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/25 focus:border-[#1E3A5F] min-h-[40px]';

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">
                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">Gestion des erreurs</span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">Registre des événements</span>
                </div>

                {/* ─── Hero ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        <div
                            className="absolute top-0 left-0 right-0 h-1"
                            style={{ background: `linear-gradient(90deg, ${NAVY}, ${TEAL}, ${AMBER})` }}
                            aria-hidden="true"
                        />
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md shadow-slate-300 flex-shrink-0"
                                style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY_DEEP})` }}
                            >
                                <IconShieldExclamation size={22} stroke={1.8} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1
                                    className="text-slate-900 leading-tight"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 600,
                                        fontSize: 'clamp(22px, 2.4vw, 28px)',
                                        letterSpacing: '-0.02em',
                                    }}
                                >
                                    Registre des événements
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    Consolidation des signaux faibles, toutes sources confondues.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                type="button"
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-50"
                                aria-label="Actualiser le registre"
                            >
                                <IconRefresh size={13} stroke={1.8} className={refreshing ? 'animate-spin' : ''} />
                                <span className="hidden sm:inline">Actualiser</span>
                            </button>
                            <Button
                                size="sm"
                                leftSection={<IconPlus size={15} />}
                                onClick={() => navigate('/error-management/declare')}
                                styles={{ root: { backgroundColor: NAVY } }}
                            >
                                Déclarer un événement
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ─── Onglets nature (remplacent les tuiles KPI) ─── */}
                <div className="mb-5 flex flex-wrap items-center gap-3">
                    <div
                        className="inline-flex items-center gap-1 p-1 rounded-xl border border-slate-200 bg-slate-50 shadow-sm"
                        role="tablist"
                        aria-label="Filtrer le registre par nature"
                    >
                        {lensTabs.map((tab) => {
                            const active = lens === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    title={tab.hint}
                                    onClick={() => setLens(tab.key)}
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12.5px] whitespace-nowrap transition ${
                                        active
                                            ? 'bg-white shadow-sm font-semibold text-slate-900'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    <span
                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: tab.accent }}
                                        aria-hidden="true"
                                    />
                                    {tab.label}
                                    <span className="text-slate-400 font-normal">({loading ? '…' : tab.count})</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="sm:ml-auto inline-flex items-center gap-1.5 text-[12px] text-slate-500">
                        <IconTimeline size={14} className="text-amber-500" aria-hidden="true" />
                        <span>Ratio presqu’acc. / accidents</span>
                        <span className="font-semibold text-slate-800">{loading ? '…' : ratioDisplay}</span>
                    </div>
                </div>

                {/* ─── Filtres ─── */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 mb-4 flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[220px]">
                        <IconSearch
                            size={15}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                            aria-hidden="true"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher par référence, titre ou type…"
                            className="w-full pl-8 pr-3 py-2 text-[12.5px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/25 focus:border-[#1E3A5F] min-h-[40px]"
                            aria-label="Rechercher un événement"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as ErrorEventStatus | '')}
                        className={`${inputBase} min-w-[160px]`}
                        aria-label="Filtrer par statut"
                    >
                        <option value="">Tous les statuts</option>
                        {STATUS_FLOW.concat(['REOPENED']).map((s) => (
                            <option key={s} value={s}>
                                {STATUS_LABELS[s]}
                            </option>
                        ))}
                    </select>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className={`${inputBase} min-w-[170px]`}
                        aria-label="Filtrer par type d'événement"
                    >
                        <option value="">Tous les types</option>
                        {eventTypes.map((t) => (
                            <option key={t.id} value={String(t.id)}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                    <select
                        value={criticalityFilter}
                        onChange={(e) => setCriticalityFilter(e.target.value as CriticalityLevel | '')}
                        className={`${inputBase} min-w-[150px]`}
                        aria-label="Filtrer par criticité"
                    >
                        <option value="">Toute criticité</option>
                        {CRITICALITY_FILTER.map((c) => (
                            <option key={c} value={c}>
                                {CRITICALITY_LABELS[c]}
                            </option>
                        ))}
                    </select>
                </div>

                {/* ─── Table ─── */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader color={NAVY} size="sm" />
                            <p className="text-[12.5px] text-slate-500 mt-3">Chargement du registre…</p>
                        </div>
                    ) : loadFailure ? (
                        <div
                            className="flex flex-col items-center justify-center py-14 text-center px-4"
                            role="alert"
                            aria-live="assertive"
                        >
                            <div
                                className="w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 shadow-sm"
                                style={{ background: '#FEF2F2', borderColor: '#FECACA' }}
                                aria-hidden="true"
                            >
                                <IconShieldExclamation size={28} className="text-red-700" stroke={1.6} />
                            </div>
                            <p className="text-[14px] text-slate-900 font-semibold mb-1">{loadFailure.title}</p>
                            <p className="text-[12.5px] text-slate-600 max-w-lg mb-4 leading-relaxed">
                                {loadFailure.message}
                            </p>
                            <Button
                                size="sm"
                                variant="outline"
                                leftSection={<IconRefresh size={15} />}
                                loading={refreshing}
                                onClick={handleRefresh}
                                styles={{ root: { color: NAVY, borderColor: NAVY } }}
                            >
                                Réessayer le chargement
                            </Button>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 text-center px-4">
                            <div
                                className="w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 shadow-sm"
                                style={{ background: `${NAVY}10`, borderColor: `${NAVY}33` }}
                            >
                                <IconShieldExclamation size={28} style={{ color: NAVY }} stroke={1.6} />
                            </div>
                            <p className="text-[14px] text-slate-800 font-semibold mb-1">Aucun événement</p>
                            <p className="text-[12.5px] text-slate-500 max-w-md mb-4 leading-relaxed">
                                {events.length === 0
                                    ? "Aucun événement n'a encore été déclaré. Déclarez le premier signal pour amorcer la démarche d'amélioration."
                                    : "Aucun événement ne correspond aux filtres sélectionnés."}
                            </p>
                            {events.length === 0 && (
                                <Button
                                    size="sm"
                                    leftSection={<IconPlus size={15} />}
                                    onClick={() => navigate('/error-management/declare')}
                                    styles={{ root: { backgroundColor: NAVY } }}
                                >
                                    Déclarer un événement
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr
                                        className="text-[10.5px] uppercase tracking-[0.1em] text-slate-600"
                                        style={{ borderBottom: `2px solid ${NAVY}` }}
                                    >
                                        <th className="bg-slate-50 font-semibold px-3 py-2.5">Référence</th>
                                        <th className="bg-slate-50 font-semibold px-3 py-2.5">Type</th>
                                        <th className="bg-slate-50 font-semibold px-3 py-2.5">Titre</th>
                                        <th className="bg-slate-50 font-semibold px-3 py-2.5">Criticité</th>
                                        <th className="bg-slate-50 font-semibold px-3 py-2.5">Statut</th>
                                        <th className="bg-slate-50 font-semibold px-3 py-2.5">Survenu le</th>
                                        <th className="bg-slate-50 font-semibold px-3 py-2.5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((e) => {
                                        const type = e.eventTypeId ? typeById.get(e.eventTypeId) : undefined;
                                        return (
                                            <tr
                                                key={e.id}
                                                className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                                                onClick={() => navigate(`/error-management/${e.id}`)}
                                            >
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono text-[12px] font-semibold text-slate-800">
                                                            {e.reference ?? `#${e.id}`}
                                                        </span>
                                                        {e.isHipo && <HipoBadge size="xs" />}
                                                        {e.isAnonymous && (
                                                            <span title="Déclaration anonyme">
                                                                <AnonymousBadge />
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <EventTypeChip label={type?.label} colorHex={type?.colorHex} />
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="text-[12.5px] text-slate-800 line-clamp-1">
                                                        {e.title || <span className="text-slate-400">Sans titre</span>}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <CriticalityChip
                                                        level={e.criticalityLevel}
                                                        colorHex={criticalityColor(e.criticalityLevel)}
                                                    />
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <StatusChip status={e.status} />
                                                </td>
                                                <td className="px-3 py-2.5 text-[12px] text-slate-600 whitespace-nowrap">
                                                    {formatDay(e.occurredAt)}
                                                </td>
                                                <td className="px-3 py-2.5 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={(ev) => {
                                                            ev.stopPropagation();
                                                            navigate(`/error-management/${e.id}`);
                                                        }}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-[#1E3A5F] hover:bg-slate-100 transition"
                                                        aria-label={`Ouvrir le détail de ${e.reference ?? e.id}`}
                                                    >
                                                        <IconEye size={16} stroke={1.7} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <p className="mt-3 text-[11px] text-slate-400 px-1">
                    {filtered.length > 0 && `${filtered.length} événement(s) affiché(s).`} La déclaration consolide les
                    signaux issus des autres modules (urgences, dynamitages, dosimétrie).
                </p>
            </div>
        </div>
    );
};

export default ErrorEventListPage;

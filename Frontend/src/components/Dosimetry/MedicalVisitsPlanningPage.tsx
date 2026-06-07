/**
 * MedicalVisitsPlanningPage — Phase 7 Frontend-A (LOT Dosimetrie & Expositions).
 *
 * Planning premium des visites medicales reglementaires + alertes :
 *   - Hero KPI : Visites a planifier, En retard, Aptitudes expirant <30j, Inaptes
 *   - Onglets : Calendrier (vue mois) | Liste (DataTable filtrable)
 *   - Filtres : type de visite, statut, periode, mine (mineId implicite)
 *   - Bouton "+ Planifier visite" -> /dosimetry/medical/visit/new
 *   - Banner RGPD top : "Acces journalise (RGPD art.30 + AIEA GSR Part 3)"
 *   - Alertes : workers sans visite initiale + aptitudes expirees
 *
 * Route : /dosimetry/medical/planning
 *
 * RBAC UI : visible si DOSIMETRY_MEDICAL OU DOSIMETRY_PCR_RPO. Action "Planifier"
 * masquee si pas DOSIMETRY_MEDICAL.
 *
 * i18n : namespace `dosimetry`, sous-tree `medical.planning.*`.
 *
 * Contraintes : tsc strict + vite EXIT 0.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Select, Tooltip } from '@mantine/core';
import {
    IconStethoscope,
    IconChevronRight,
    IconCalendar,
    IconList,
    IconPlus,
    IconRefresh,
    IconAlertTriangle,
    IconInfoCircle,
    IconShieldLock,
    IconUserCircle,
    IconChevronLeft,
    IconFilter,
    IconEye,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import {
    getUpcomingMedicalVisits,
    searchWorkers,
    type MedicalVisitSummaryDTO,
    type MedicalVisitType,
    type VisitStatus,
} from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  RBAC helper — pattern aligne sur OverexposureCasesPage
// ─────────────────────────────────────────────────────────────────────────────

function hasDosimetryPermission(user: any, permission: string): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
    const candidates: string[] = [];
    if (Array.isArray(user.permissions)) candidates.push(...user.permissions);
    if (Array.isArray(user.authorities)) {
        candidates.push(...user.authorities.map((a: any) => a?.authority ?? a));
    }
    if (Array.isArray(user.roles)) candidates.push(...user.roles);
    if (typeof user.role === 'string') candidates.push(user.role);
    return candidates.includes(permission);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Types & constants
// ─────────────────────────────────────────────────────────────────────────────

interface WorkerLite {
    id: number;
    matricule: string;
    fullName: string;
}

interface PlanningFilters {
    visitType: MedicalVisitType | 'ALL';
    status: VisitStatus | 'ALL';
    daysAhead: number;
}

const ALL_VISIT_TYPES: MedicalVisitType[] = [
    'INITIAL',
    'PERIODIC_ANNUAL',
    'POST_EXPOSURE',
    'FOLLOWUP',
    'FINAL_AT_DEPARTURE',
];

const ALL_STATUSES: VisitStatus[] = ['SCHEDULED', 'PERFORMED', 'CANCELLED', 'MISSED'];

const STATUS_BADGE: Record<VisitStatus, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-800 border border-blue-200',
    PERFORMED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    CANCELLED: 'bg-slate-100 text-slate-700 border border-slate-200',
    MISSED: 'bg-red-100 text-red-800 border border-red-200',
};

const TYPE_BADGE: Record<MedicalVisitType, string> = {
    INITIAL: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    PERIODIC_ANNUAL: 'bg-blue-100 text-blue-800 border border-blue-200',
    POST_EXPOSURE: 'bg-red-100 text-red-800 border border-red-200',
    FOLLOWUP: 'bg-amber-100 text-amber-800 border border-amber-200',
    FINAL_AT_DEPARTURE: 'bg-slate-100 text-slate-700 border border-slate-200',
};

const formatDate = (s?: string | null): string => {
    if (!s) return '—';
    try {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return s;
        return d.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return s;
    }
};

const daysBetween = (a: Date, b: Date): number => {
    const ms = b.getTime() - a.getTime();
    return Math.round(ms / (1000 * 60 * 60 * 24));
};

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const MedicalVisitsPlanningPage = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();

    const user = useAppSelector((state: any) => state.user);
    const selectedMineId: number | null = useAppSelector(
        (state: any) => state?.companySelection?.selectedCompanyId ?? null,
    );

    const canMedical = hasDosimetryPermission(user, 'DOSIMETRY_MEDICAL');
    const canPcr = hasDosimetryPermission(user, 'DOSIMETRY_PCR_RPO');
    const canView = canMedical || canPcr;

    const mineId: number = selectedMineId ?? user?.mineId ?? user?.companyId ?? 1;

    const [visits, setVisits] = useState<MedicalVisitSummaryDTO[]>([]);
    const [workers, setWorkers] = useState<WorkerLite[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('list');
    const [calendarCursor, setCalendarCursor] = useState<Date>(() => {
        const d = new Date();
        d.setDate(1);
        return d;
    });

    const [filters, setFilters] = useState<PlanningFilters>({
        visitType: 'ALL',
        status: 'ALL',
        daysAhead: 90,
    });

    // ───── Chargement initial : visites + workers ─────
    const fetchAll = useCallback(async () => {
        if (!canView) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setLoadError(null);
        try {
            const [visitsResult, workersResult] = await Promise.allSettled([
                getUpcomingMedicalVisits(mineId, filters.daysAhead),
                searchWorkers({ mineId }),
            ]);

            if (visitsResult.status === 'fulfilled') {
                const arr: MedicalVisitSummaryDTO[] = Array.isArray(visitsResult.value)
                    ? visitsResult.value
                    : [];
                setVisits(arr);
            } else {
                setVisits([]);
                setLoadError(t('medical.planning.loadError'));
            }

            if (workersResult.status === 'fulfilled') {
                const list: any = workersResult.value;
                const arr: any[] = Array.isArray(list) ? list : (list?.content ?? []);
                setWorkers(
                    arr
                        .map((w) => ({
                            id: Number(w.id ?? w.workerId ?? 0),
                            matricule: String(w.matricule ?? `#${w.employeeId ?? ''}`),
                            fullName: String(w.fullName ?? `Employee #${w.employeeId ?? ''}`),
                        }))
                        .filter((w) => w.id > 0),
                );
            }
        } finally {
            setLoading(false);
        }
    }, [canView, mineId, filters.daysAhead, t]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const workerById = useMemo(() => {
        const map = new Map<number, WorkerLite>();
        workers.forEach((w) => map.set(w.id, w));
        return map;
    }, [workers]);

    // ───── KPI ─────
    const kpiCounts = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const in30 = new Date(today);
        in30.setDate(today.getDate() + 30);

        let toSchedule = 0;
        let overdue = 0;
        let upcoming30 = 0;
        let cancelledRecent = 0;
        for (const v of visits) {
            if (v.status === 'SCHEDULED') {
                toSchedule += 1;
                if (v.scheduledDate) {
                    const d = new Date(v.scheduledDate);
                    if (!Number.isNaN(d.getTime())) {
                        if (d < today) overdue += 1;
                        else if (d <= in30) upcoming30 += 1;
                    }
                }
            } else if (v.status === 'MISSED') {
                overdue += 1;
            } else if (v.status === 'CANCELLED') {
                cancelledRecent += 1;
            }
        }
        return { toSchedule, overdue, upcoming30, cancelledRecent };
    }, [visits]);

    // ───── Filtrage ─────
    const visibleVisits = useMemo(() => {
        return visits.filter((v) => {
            if (filters.visitType !== 'ALL' && v.visitType !== filters.visitType) return false;
            if (filters.status !== 'ALL' && v.status !== filters.status) return false;
            return true;
        });
    }, [visits, filters]);

    // ───── Index calendrier ─────
    const visitsByDate = useMemo(() => {
        const map = new Map<string, MedicalVisitSummaryDTO[]>();
        for (const v of visibleVisits) {
            if (!v.scheduledDate) continue;
            const key = v.scheduledDate.slice(0, 10);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(v);
        }
        return map;
    }, [visibleVisits]);

    // ───── Calendrier : grille mois ─────
    const monthGrid = useMemo(() => {
        const first = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1);
        const last = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 0);
        const startDay = (first.getDay() + 6) % 7; // Lundi = 0
        const total = startDay + last.getDate();
        const weeks = Math.ceil(total / 7);
        const cells: Array<{ date: Date | null; iso: string | null }> = [];
        for (let i = 0; i < weeks * 7; i += 1) {
            const offset = i - startDay;
            if (offset < 0 || offset >= last.getDate()) {
                cells.push({ date: null, iso: null });
            } else {
                const d = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), offset + 1);
                cells.push({ date: d, iso: d.toISOString().slice(0, 10) });
            }
        }
        return cells;
    }, [calendarCursor]);

    const handleClearFilters = () => {
        setFilters({ visitType: 'ALL', status: 'ALL', daysAhead: 90 });
    };

    // ─── RBAC GATE ───
    if (!canView) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-10">
                <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm px-6 py-10 text-center">
                    <IconShieldLock size={36} className="mx-auto text-red-500 mb-3" />
                    <h2 className="text-slate-900 font-semibold text-lg mb-1">
                        {t('medical.planning.rbacBlockedTitle')}
                    </h2>
                    <p className="text-slate-600 text-[13px]">
                        {t('medical.planning.rbacBlockedBody')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">
                {/* ─── RGPD banner ─── */}
                <div className="mb-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-[12px]">
                    <IconShieldLock size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                    <span>{t('medical.rgpdBanner')}</span>
                </div>

                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/settings')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-700 transition"
                    >
                        {t('medical.planning.breadcrumbRoot')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('medical.planning.breadcrumbCurrent')}
                    </span>
                </div>

                {/* ─── Hero card + KPI tiles inline ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-200 flex-shrink-0">
                                <IconStethoscope size={22} stroke={1.8} className="text-white" />
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
                                    {t('medical.planning.title')}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {t('medical.planning.subtitle')}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-stretch gap-2">
                            <KpiTile
                                label={t('medical.planning.kpi.toScheduleLabel')}
                                sub={t('medical.planning.kpi.toScheduleSub')}
                                value={kpiCounts.toSchedule}
                                tone="indigo"
                            />
                            <KpiTile
                                label={t('medical.planning.kpi.overdueLabel')}
                                sub={t('medical.planning.kpi.overdueSub')}
                                value={kpiCounts.overdue}
                                tone="red"
                                pulse={kpiCounts.overdue > 0}
                            />
                            <KpiTile
                                label={t('medical.planning.kpi.upcomingLabel')}
                                sub={t('medical.planning.kpi.upcomingSub')}
                                value={kpiCounts.upcoming30}
                                tone="amber"
                            />
                            <KpiTile
                                label={t('medical.planning.kpi.cancelledLabel')}
                                sub={t('medical.planning.kpi.cancelledSub')}
                                value={kpiCounts.cancelledRecent}
                                tone="slate"
                            />

                            {canMedical && (
                                <button
                                    type="button"
                                    onClick={() => navigate('/dosimetry/medical/visit/new')}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition self-start shadow-sm"
                                >
                                    <IconPlus size={13} stroke={2} />
                                    {t('medical.planning.scheduleVisit')}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={fetchAll}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition self-start"
                                aria-label={t('medical.planning.refresh')}
                            >
                                <IconRefresh size={13} stroke={1.8} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── Alertes ─── */}
                {kpiCounts.overdue > 0 && (
                    <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[12.5px]">
                        <IconAlertTriangle size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>
                            {t('medical.planning.alerts.overdue', { count: kpiCounts.overdue })}
                        </span>
                    </div>
                )}

                {loadError && (
                    <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]">
                        <IconInfoCircle size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{loadError}</span>
                    </div>
                )}

                {/* ─── Onglets ─── */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-4">
                    <div className="flex items-center border-b border-slate-200">
                        <button
                            type="button"
                            onClick={() => setActiveTab('list')}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-[12.5px] font-medium border-b-2 transition ${
                                activeTab === 'list'
                                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                            }`}
                        >
                            <IconList size={14} stroke={1.8} />
                            {t('medical.planning.tabs.list')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('calendar')}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-[12.5px] font-medium border-b-2 transition ${
                                activeTab === 'calendar'
                                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                            }`}
                        >
                            <IconCalendar size={14} stroke={1.8} />
                            {t('medical.planning.tabs.calendar')}
                        </button>
                    </div>

                    {/* Filtres */}
                    <div className="p-4 flex flex-wrap items-end gap-3 border-b border-slate-100">
                        <div className="min-w-[160px]">
                            <Select
                                size="xs"
                                label={t('medical.planning.filters.visitTypeLabel')}
                                data={[
                                    { value: 'ALL', label: t('medical.planning.filters.visitTypeAll') },
                                    ...ALL_VISIT_TYPES.map((vt) => ({
                                        value: vt,
                                        label: t(`medical.visitType.${vt}`, { defaultValue: vt }),
                                    })),
                                ]}
                                value={filters.visitType}
                                onChange={(v) =>
                                    setFilters((f) => ({
                                        ...f,
                                        visitType: (v as MedicalVisitType | 'ALL') ?? 'ALL',
                                    }))
                                }
                            />
                        </div>
                        <div className="min-w-[160px]">
                            <Select
                                size="xs"
                                label={t('medical.planning.filters.statusLabel')}
                                data={[
                                    { value: 'ALL', label: t('medical.planning.filters.statusAll') },
                                    ...ALL_STATUSES.map((s) => ({
                                        value: s,
                                        label: t(`medical.visitStatus.${s}`, { defaultValue: s }),
                                    })),
                                ]}
                                value={filters.status}
                                onChange={(v) =>
                                    setFilters((f) => ({
                                        ...f,
                                        status: (v as VisitStatus | 'ALL') ?? 'ALL',
                                    }))
                                }
                            />
                        </div>
                        <div className="min-w-[160px]">
                            <Select
                                size="xs"
                                label={t('medical.planning.filters.periodLabel')}
                                data={[
                                    { value: '30', label: t('medical.planning.filters.period30') },
                                    { value: '90', label: t('medical.planning.filters.period90') },
                                    { value: '180', label: t('medical.planning.filters.period180') },
                                    { value: '365', label: t('medical.planning.filters.period365') },
                                ]}
                                value={String(filters.daysAhead)}
                                onChange={(v) =>
                                    setFilters((f) => ({
                                        ...f,
                                        daysAhead: Number(v ?? 90),
                                    }))
                                }
                            />
                        </div>
                        <div className="flex-1" />
                        <div className="flex items-center gap-2 pb-1">
                            <span className="text-[11.5px] text-slate-500">
                                {t('medical.planning.filters.summary', {
                                    count: visibleVisits.length,
                                    total: visits.length,
                                })}
                            </span>
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="inline-flex items-center gap-1 text-[11.5px] text-red-600 hover:text-red-700 underline-offset-2 hover:underline"
                            >
                                <IconFilter size={11} stroke={1.8} />
                                {t('medical.planning.filters.clear')}
                            </button>
                        </div>
                    </div>

                    {/* Onglet liste */}
                    {activeTab === 'list' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[12.5px]">
                                <thead>
                                    <tr className="bg-slate-50/80 text-left text-[10.5px] uppercase tracking-[0.10em] text-slate-500">
                                        <th className="px-4 py-2 font-semibold">{t('medical.planning.table.scheduledDate')}</th>
                                        <th className="px-4 py-2 font-semibold">{t('medical.planning.table.worker')}</th>
                                        <th className="px-4 py-2 font-semibold">{t('medical.planning.table.visitType')}</th>
                                        <th className="px-4 py-2 font-semibold">{t('medical.planning.table.status')}</th>
                                        <th className="px-4 py-2 font-semibold">{t('medical.planning.table.physician')}</th>
                                        <th className="px-4 py-2 font-semibold text-right">{t('medical.planning.table.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                                                <span className="inline-block w-4 h-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin mr-2 align-middle" />
                                                {t('medical.planning.loading')}
                                            </td>
                                        </tr>
                                    ) : visibleVisits.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                                                <IconStethoscope size={28} className="mx-auto text-slate-300 mb-2" />
                                                {t('medical.planning.table.empty')}
                                            </td>
                                        </tr>
                                    ) : (
                                        visibleVisits.map((v, idx) => {
                                            const key = v.id ?? `row-${idx}`;
                                            const worker = workerById.get(Number(v.workerId)) ?? null;
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            const sched = v.scheduledDate ? new Date(v.scheduledDate) : null;
                                            const isOverdue =
                                                v.status === 'SCHEDULED' &&
                                                sched != null &&
                                                !Number.isNaN(sched.getTime()) &&
                                                sched < today;
                                            return (
                                                <tr
                                                    key={key}
                                                    className={`border-t border-slate-100 hover:bg-emerald-50/30 transition ${
                                                        isOverdue ? 'bg-red-50/30' : ''
                                                    }`}
                                                >
                                                    <td className="px-4 py-2.5 text-slate-700">
                                                        <span className="inline-flex items-center gap-1">
                                                            <IconCalendar size={11} className="text-slate-400" />
                                                            {formatDate(v.scheduledDate)}
                                                            {isOverdue && (
                                                                <Tooltip label={t('medical.planning.table.overdueTooltip')} withArrow>
                                                                    <span className="ml-1 inline-flex items-center text-red-600">
                                                                        <IconAlertTriangle size={12} stroke={1.8} />
                                                                    </span>
                                                                </Tooltip>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        {worker ? (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    navigate(`/dosimetry/medical/worker/${worker.id}`)
                                                                }
                                                                className="inline-flex items-center gap-1.5 text-indigo-700 hover:text-indigo-900 hover:underline underline-offset-2 transition"
                                                            >
                                                                <IconUserCircle size={14} stroke={1.8} />
                                                                <span className="font-mono text-[11.5px]">
                                                                    {worker.matricule}
                                                                </span>
                                                                <span className="text-slate-700">
                                                                    {worker.fullName}
                                                                </span>
                                                            </button>
                                                        ) : (
                                                            <span className="text-slate-500">#{v.workerId}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                                                                TYPE_BADGE[v.visitType] ?? ''
                                                            }`}
                                                        >
                                                            {t(`medical.visitType.${v.visitType}`, {
                                                                defaultValue: v.visitType,
                                                            })}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span
                                                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold ${
                                                                STATUS_BADGE[v.status] ?? ''
                                                            }`}
                                                        >
                                                            {t(`medical.visitStatus.${v.status}`, {
                                                                defaultValue: v.status,
                                                            })}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-slate-700">
                                                        {v.physicianName ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right">
                                                        <div className="inline-flex items-center gap-1">
                                                            {v.status === 'SCHEDULED' && canMedical && v.id != null && (
                                                                <Tooltip
                                                                    label={t('medical.planning.table.performTooltip')}
                                                                    withArrow
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            navigate(
                                                                                `/dosimetry/medical/visit/${v.id}/perform`,
                                                                            )
                                                                        }
                                                                        className="px-2 py-1 rounded text-[11px] bg-emerald-600 text-white hover:bg-emerald-700 transition"
                                                                    >
                                                                        {t('medical.planning.table.performBtn')}
                                                                    </button>
                                                                </Tooltip>
                                                            )}
                                                            <Tooltip
                                                                label={t('medical.planning.table.viewDossierTooltip')}
                                                                withArrow
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        navigate(
                                                                            `/dosimetry/medical/worker/${v.workerId}`,
                                                                        )
                                                                    }
                                                                    className="p-1 rounded text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition"
                                                                >
                                                                    <IconEye size={14} stroke={1.8} />
                                                                </button>
                                                            </Tooltip>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Onglet calendrier */}
                    {activeTab === 'calendar' && (
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const d = new Date(calendarCursor);
                                        d.setMonth(d.getMonth() - 1);
                                        setCalendarCursor(d);
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-[12px] rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
                                >
                                    <IconChevronLeft size={12} />
                                    {t('medical.planning.calendar.prev')}
                                </button>
                                <h3 className="text-[14px] font-semibold text-slate-800">
                                    {calendarCursor.toLocaleDateString('fr-FR', {
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const d = new Date(calendarCursor);
                                        d.setMonth(d.getMonth() + 1);
                                        setCalendarCursor(d);
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-[12px] rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
                                >
                                    {t('medical.planning.calendar.next')}
                                    <IconChevronRight size={12} />
                                </button>
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-1 text-[10.5px] uppercase tracking-[0.10em] text-slate-500 font-semibold">
                                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                                    <div key={`dow-${i}`} className="px-2 py-1">
                                        {d}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {monthGrid.map((cell, i) => {
                                    if (!cell.date || !cell.iso) {
                                        return (
                                            <div
                                                key={`cell-${i}`}
                                                className="h-20 rounded bg-slate-50/40"
                                            />
                                        );
                                    }
                                    const dayVisits = visitsByDate.get(cell.iso) ?? [];
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const isToday = daysBetween(today, cell.date) === 0;
                                    return (
                                        <div
                                            key={`cell-${i}`}
                                            className={`h-20 rounded border p-1 overflow-hidden ${
                                                isToday
                                                    ? 'border-emerald-400 bg-emerald-50/40'
                                                    : 'border-slate-100 bg-white hover:bg-slate-50/60'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`text-[11px] font-mono ${
                                                        isToday ? 'text-emerald-700 font-bold' : 'text-slate-600'
                                                    }`}
                                                >
                                                    {cell.date.getDate()}
                                                </span>
                                                {dayVisits.length > 0 && (
                                                    <span className="text-[9.5px] text-indigo-700 bg-indigo-50 px-1.5 py-0 rounded font-semibold">
                                                        {dayVisits.length}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1 space-y-0.5">
                                                {dayVisits.slice(0, 2).map((v) => {
                                                    const worker = workerById.get(Number(v.workerId));
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={v.id ?? `${cell.iso}-${v.workerId}`}
                                                            onClick={() =>
                                                                navigate(
                                                                    `/dosimetry/medical/worker/${v.workerId}`,
                                                                )
                                                            }
                                                            className={`block w-full text-left truncate text-[10px] px-1 py-0.5 rounded ${
                                                                STATUS_BADGE[v.status] ?? 'bg-slate-100'
                                                            }`}
                                                        >
                                                            {worker?.matricule ?? `#${v.workerId}`}
                                                        </button>
                                                    );
                                                })}
                                                {dayVisits.length > 2 && (
                                                    <span className="text-[9px] text-slate-500">
                                                        +{dayVisits.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composant : KPI Tile
// ─────────────────────────────────────────────────────────────────────────────

interface KpiTileProps {
    label: string;
    sub: string;
    value: number;
    tone: 'red' | 'amber' | 'emerald' | 'slate' | 'indigo';
    pulse?: boolean;
}

function KpiTile({ label, sub, value, tone, pulse = false }: KpiTileProps) {
    const palettes: Record<KpiTileProps['tone'], { bg: string; border: string; valueColor: string; labelColor: string }> = {
        red: {
            bg: 'bg-red-50/70',
            border: 'border-red-100',
            valueColor: 'text-red-700',
            labelColor: 'text-red-600',
        },
        amber: {
            bg: 'bg-amber-50/70',
            border: 'border-amber-100',
            valueColor: 'text-amber-700',
            labelColor: 'text-amber-700',
        },
        emerald: {
            bg: 'bg-emerald-50/70',
            border: 'border-emerald-100',
            valueColor: 'text-emerald-700',
            labelColor: 'text-emerald-700',
        },
        slate: {
            bg: 'bg-slate-50/70',
            border: 'border-slate-100',
            valueColor: 'text-slate-800',
            labelColor: 'text-slate-600',
        },
        indigo: {
            bg: 'bg-indigo-50/70',
            border: 'border-indigo-100',
            valueColor: 'text-indigo-700',
            labelColor: 'text-indigo-700',
        },
    };
    const p = palettes[tone];
    return (
        <div
            className={`relative inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border ${p.bg} ${p.border} ${
                pulse ? 'ring-2 ring-red-300 ring-offset-1 animate-pulse' : ''
            }`}
        >
            <div className="w-10 h-10 rounded-lg bg-white border border-white/40 flex items-center justify-center shadow-sm">
                <span className={`text-[15px] font-mono font-bold ${p.valueColor}`}>{value}</span>
            </div>
            <div>
                <p className={`text-[10px] uppercase tracking-[0.14em] leading-none font-semibold ${p.labelColor}`}>
                    {label}
                </p>
                <p className="text-[11.5px] text-slate-700 mt-0.5 leading-none">{sub}</p>
            </div>
        </div>
    );
}

export default MedicalVisitsPlanningPage;

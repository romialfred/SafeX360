/**
 * OverexposureCasesPage — Phase 5 Frontend-C (LOT Dosimetrie & Expositions).
 *
 * Liste premium des dossiers de depassement (workflow OPEN -> INVESTIGATING ->
 * CLOSED) — pattern SafeX 360 aligne sur ExposureAlertsPage / ExposedWorkersRegistryPage.
 *
 * Route : /dosimetry/overexposure
 *
 * Sections :
 *   1. Breadcrumb premium
 *   2. Hero card avec 4 KPI tiles inline (Total, OPEN, INVESTIGATING, CLOSED 30j)
 *   3. Filtres : status, niveau, periode, worker
 *   4. DataTable : N° cas | Worker | Niveau | Cause | Status | Date ouverture |
 *      PCR responsable | Actions. Row click -> /dosimetry/overexposure/:caseId
 *
 * Donnees :
 *   - DosimetryService.getOverexposureCases() : liste complete
 *   - DosimetryService.searchWorkers : resolution noms / matricules
 *
 * RBAC UI :
 *   - Bouton "Nouveau dossier" visible si DOSIMETRY_WRITE.
 *
 * i18n : namespace `dosimetry`, sous-tree `overexposureCases.*`.
 *
 * Contraintes : tsc strict + vite EXIT 0.
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    Select,
    TextInput,
    Tooltip,
} from '@mantine/core';
import {
    IconFolderOpen,
    IconChevronRight,
    IconUserCircle,
    IconEye,
    IconRefresh,
    IconInfoCircle,
    IconFilter,
    IconPlus,
    IconClock,
    IconSearch,
    IconShieldCheck,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import {
    getOverexposureCases,
    searchWorkers,
    type OverexposureCaseDTO,
    type CaseStatus,
    type AlertLevel,
} from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  RBAC helper
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
//  Types locaux
// ─────────────────────────────────────────────────────────────────────────────

interface WorkerLite {
    id: number;
    matricule: string;
    fullName: string;
    rpoId?: number | null;
    rpoName?: string | null;
}

interface CaseFilters {
    status: CaseStatus | 'ALL';
    level: AlertLevel | 'ALL';
    workerId: string; // '' = tous
    from: string; // YYYY-MM-DD
    to: string; // YYYY-MM-DD
}

// ─────────────────────────────────────────────────────────────────────────────
//  Formatters & constants
// ─────────────────────────────────────────────────────────────────────────────

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

const todayIso = (): string => new Date().toISOString().slice(0, 10);
const sixMonthsAgoIso = (): string => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().slice(0, 10);
};

const ALL_STATUSES: CaseStatus[] = ['OPEN', 'INVESTIGATING', 'CLOSED'];
const ALL_LEVELS: AlertLevel[] = ['APPROACH', 'INVESTIGATION', 'ACTION', 'EXCEEDED'];

const STATUS_BADGE: Record<CaseStatus, string> = {
    OPEN: 'bg-red-100 text-red-800 border border-red-200',
    INVESTIGATING: 'bg-amber-100 text-amber-800 border border-amber-200',
    CLOSED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
};

const LEVEL_BADGE: Record<AlertLevel, string> = {
    APPROACH: 'bg-blue-100 text-blue-900 border border-blue-200',
    INVESTIGATION: 'bg-yellow-100 text-yellow-900 border border-yellow-200',
    ACTION: 'bg-orange-100 text-orange-900 border border-orange-200',
    EXCEEDED: 'bg-red-100 text-red-900 border border-red-300',
};

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const OverexposureCasesPage = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();

    const user = useAppSelector((state: any) => state.user);
    const selectedMineId: number | null = useAppSelector(
        (state: any) => state?.companySelection?.selectedCompanyId ?? null,
    );

    const canWrite = hasDosimetryPermission(user, 'DOSIMETRY_WRITE');

    const mineId: number = selectedMineId ?? user?.mineId ?? user?.companyId ?? 1;

    const [cases, setCases] = useState<OverexposureCaseDTO[]>([]);
    const [workers, setWorkers] = useState<WorkerLite[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [filters, setFilters] = useState<CaseFilters>({
        status: 'ALL',
        level: 'ALL',
        workerId: '',
        from: sixMonthsAgoIso(),
        to: todayIso(),
    });

    // ───── Chargement initial : cases + workers ─────
    const fetchAll = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const [casesResult, workersResult] = await Promise.allSettled([
                getOverexposureCases(),
                searchWorkers({ mineId }),
            ]);

            if (casesResult.status === 'fulfilled') {
                const arr: OverexposureCaseDTO[] = Array.isArray(casesResult.value)
                    ? casesResult.value
                    : [];
                setCases(arr);
            } else {
                setCases([]);
                setLoadError(t('overexposureCases.loadError'));
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
                            rpoId: w.rpoId ?? null,
                            rpoName: w.rpoName ?? null,
                        }))
                        .filter((w) => w.id > 0),
                );
            }
        } finally {
            setLoading(false);
        }
    }, [mineId, t]);

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
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        let total = 0;
        let open = 0;
        let investigating = 0;
        let closedRecent = 0;
        for (const c of cases) {
            total += 1;
            if (c.status === 'OPEN') open += 1;
            else if (c.status === 'INVESTIGATING') investigating += 1;
            else if (c.status === 'CLOSED') {
                if (c.closedAt) {
                    try {
                        const d = new Date(c.closedAt);
                        if (!Number.isNaN(d.getTime()) && d >= cutoff) closedRecent += 1;
                    } catch {
                        // ignore parse errors
                    }
                }
            }
        }
        return { total, open, investigating, closedRecent };
    }, [cases]);

    // ───── Filtrage ─────
    const visibleCases = useMemo(() => {
        return cases.filter((c) => {
            if (filters.status !== 'ALL' && c.status !== filters.status) return false;
            if (filters.level !== 'ALL' && c.level !== filters.level) return false;
            if (filters.workerId && String(c.workerId) !== filters.workerId) return false;
            if (c.openedAt) {
                const dStr = c.openedAt.slice(0, 10);
                if (filters.from && dStr < filters.from) return false;
                if (filters.to && dStr > filters.to) return false;
            }
            return true;
        });
    }, [cases, filters]);

    const handleClearFilters = () => {
        setFilters({
            status: 'ALL',
            level: 'ALL',
            workerId: '',
            from: sixMonthsAgoIso(),
            to: todayIso(),
        });
    };

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">
                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/settings')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-700 transition"
                    >
                        {t('overexposureCases.breadcrumbRoot')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/alerts')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-700 transition"
                    >
                        {t('overexposureCases.breadcrumbParent')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('overexposureCases.breadcrumbCurrent')}
                    </span>
                </div>

                {/* ─── Hero card + KPI tiles inline ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-md shadow-red-200 flex-shrink-0">
                                <IconFolderOpen size={22} stroke={1.8} className="text-white" />
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
                                    {t('overexposureCases.title')}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {t('overexposureCases.subtitle')}
                                </p>
                            </div>
                        </div>

                        {/* KPI tiles inline */}
                        <div className="flex flex-wrap items-stretch gap-2">
                            <KpiTile
                                label={t('overexposureCases.kpi.totalLabel')}
                                sub={t('overexposureCases.kpi.totalSub')}
                                value={kpiCounts.total}
                                tone="slate"
                            />
                            <KpiTile
                                label={t('overexposureCases.kpi.openLabel')}
                                sub={t('overexposureCases.kpi.openSub')}
                                value={kpiCounts.open}
                                tone="red"
                                pulse={kpiCounts.open > 0}
                            />
                            <KpiTile
                                label={t('overexposureCases.kpi.investigatingLabel')}
                                sub={t('overexposureCases.kpi.investigatingSub')}
                                value={kpiCounts.investigating}
                                tone="amber"
                            />
                            <KpiTile
                                label={t('overexposureCases.kpi.closedLabel')}
                                sub={t('overexposureCases.kpi.closedSub')}
                                value={kpiCounts.closedRecent}
                                tone="emerald"
                            />

                            {canWrite && (
                                <button
                                    type="button"
                                    onClick={() => navigate('/dosimetry/overexposure/new')}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition self-start shadow-sm"
                                >
                                    <IconPlus size={13} stroke={2} />
                                    {t('overexposureCases.newCase')}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={fetchAll}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition self-start"
                                aria-label={t('overexposureCases.refresh')}
                            >
                                <IconRefresh size={13} stroke={1.8} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── Bandeau erreur ─── */}
                {loadError && (
                    <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]">
                        <IconInfoCircle size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{loadError}</span>
                    </div>
                )}

                {/* ─── Filtres ─── */}
                <div className="bg-white border border-slate-200 rounded-xl mb-4 shadow-sm overflow-hidden">
                    <div className="p-4 flex flex-wrap items-end gap-3">
                        <div className="min-w-[160px]">
                            <Select
                                size="xs"
                                label={t('overexposureCases.filters.statusLabel')}
                                data={[
                                    { value: 'ALL', label: t('overexposureCases.filters.statusAll') },
                                    ...ALL_STATUSES.map((s) => ({
                                        value: s,
                                        label: t(`overexposureCases.status.${s}`, { defaultValue: s }),
                                    })),
                                ]}
                                value={filters.status}
                                onChange={(v) =>
                                    setFilters((f) => ({
                                        ...f,
                                        status: (v as CaseStatus | 'ALL') ?? 'ALL',
                                    }))
                                }
                            />
                        </div>
                        <div className="min-w-[160px]">
                            <Select
                                size="xs"
                                label={t('overexposureCases.filters.levelLabel')}
                                data={[
                                    { value: 'ALL', label: t('overexposureCases.filters.levelAll') },
                                    ...ALL_LEVELS.map((lvl) => ({
                                        value: lvl,
                                        label: t(`alerts.level.${lvl}`, { defaultValue: lvl }),
                                    })),
                                ]}
                                value={filters.level}
                                onChange={(v) =>
                                    setFilters((f) => ({
                                        ...f,
                                        level: (v as AlertLevel | 'ALL') ?? 'ALL',
                                    }))
                                }
                            />
                        </div>
                        <div className="min-w-[220px] flex-1">
                            <Select
                                size="xs"
                                label={t('overexposureCases.filters.workerLabel')}
                                placeholder={t('overexposureCases.filters.workerPlaceholder')}
                                data={workers.map((w) => ({
                                    value: String(w.id),
                                    label: `${w.matricule} — ${w.fullName}`,
                                }))}
                                value={filters.workerId || null}
                                onChange={(v) => setFilters((f) => ({ ...f, workerId: v ?? '' }))}
                                searchable
                                clearable
                                leftSection={<IconSearch size={12} />}
                            />
                        </div>
                        <div className="min-w-[140px]">
                            <TextInput
                                size="xs"
                                label={t('overexposureCases.filters.periodFrom')}
                                type="date"
                                value={filters.from}
                                onChange={(e) =>
                                    setFilters((f) => ({ ...f, from: e.currentTarget.value }))
                                }
                            />
                        </div>
                        <div className="min-w-[140px]">
                            <TextInput
                                size="xs"
                                label={t('overexposureCases.filters.periodTo')}
                                type="date"
                                value={filters.to}
                                onChange={(e) =>
                                    setFilters((f) => ({ ...f, to: e.currentTarget.value }))
                                }
                            />
                        </div>
                        <div className="flex-1" />
                        <div className="flex items-center gap-2 pb-1">
                            <span className="text-[11.5px] text-slate-500">
                                {t('overexposureCases.filters.summary', {
                                    count: visibleCases.length,
                                    total: cases.length,
                                })}
                            </span>
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="inline-flex items-center gap-1 text-[11.5px] text-red-600 hover:text-red-700 underline-offset-2 hover:underline"
                            >
                                <IconFilter size={11} stroke={1.8} />
                                {t('overexposureCases.filters.clear')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── Tableau ─── */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12.5px]">
                            <thead>
                                <tr className="bg-gradient-to-b from-slate-50 to-slate-100 text-left text-[10.5px] uppercase tracking-[0.10em] text-slate-600 border-b border-slate-300">
                                    <th className="px-3 py-2.5 font-semibold">{t('overexposureCases.table.caseNumber')}</th>
                                    <th className="px-3 py-2.5 font-semibold">{t('overexposureCases.table.worker')}</th>
                                    <th className="px-3 py-2.5 font-semibold">{t('overexposureCases.table.level')}</th>
                                    <th className="px-3 py-2.5 font-semibold">{t('overexposureCases.table.cause')}</th>
                                    <th className="px-3 py-2.5 font-semibold">{t('overexposureCases.table.status')}</th>
                                    <th className="px-3 py-2.5 font-semibold">{t('overexposureCases.table.openedAt')}</th>
                                    <th className="px-3 py-2.5 font-semibold">{t('overexposureCases.table.pcr')}</th>
                                    <th className="px-3 py-2.5 font-semibold text-right">{t('overexposureCases.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                                            <span className="inline-block w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin mr-2 align-middle" />
                                            {t('overexposureCases.loading')}
                                        </td>
                                    </tr>
                                ) : visibleCases.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                                            <IconFolderOpen size={28} className="mx-auto text-slate-300 mb-2" />
                                            {t('overexposureCases.table.empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    visibleCases.map((c, idx) => {
                                        const key = c.id ?? `row-${idx}`;
                                        const worker = workerById.get(Number(c.workerId)) ?? null;
                                        return (
                                            <tr
                                                key={key}
                                                onClick={() =>
                                                    c.id != null && navigate(`/dosimetry/overexposure/${c.id}`)
                                                }
                                                className={`border-t border-slate-100 hover:bg-red-50/30 transition cursor-pointer ${
                                                    c.status === 'OPEN' ? 'bg-red-50/20' : ''
                                                }`}
                                            >
                                                <td className="px-4 py-2.5 font-mono text-slate-800 font-semibold">
                                                    #{c.id ?? '—'}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {worker ? (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/dosimetry/workers/detail/${worker.id}`);
                                                            }}
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
                                                        <span className="text-slate-500">#{c.workerId}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                                            LEVEL_BADGE[c.level] ?? ''
                                                        } ${c.level === 'EXCEEDED' ? 'animate-pulse' : ''}`}
                                                    >
                                                        {t(`alerts.level.${c.level}`, { defaultValue: c.level })}
                                                    </span>
                                                </td>
                                                <td
                                                    className="px-4 py-2.5 text-slate-700 max-w-[260px] truncate"
                                                    title={c.cause ?? ''}
                                                >
                                                    {c.cause ?? '—'}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span
                                                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold ${
                                                            STATUS_BADGE[c.status] ?? ''
                                                        }`}
                                                    >
                                                        {t(`overexposureCases.status.${c.status}`, {
                                                            defaultValue: c.status,
                                                        })}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-600">
                                                    <span className="inline-flex items-center gap-1">
                                                        <IconClock size={11} className="text-slate-400" />
                                                        {formatDate(c.openedAt)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-700">
                                                    {worker?.rpoName ? (
                                                        <span className="inline-flex items-center gap-1">
                                                            <IconShieldCheck size={12} className="text-indigo-500" />
                                                            {worker.rpoName}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <Tooltip label={t('overexposureCases.table.view')} withArrow>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (c.id != null) {
                                                                    navigate(`/dosimetry/overexposure/${c.id}`);
                                                                }
                                                            }}
                                                            className="p-1 rounded text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition"
                                                        >
                                                            <IconEye size={14} stroke={1.8} />
                                                        </button>
                                                    </Tooltip>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
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
    tone: 'red' | 'amber' | 'emerald' | 'slate';
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

export default OverexposureCasesPage;

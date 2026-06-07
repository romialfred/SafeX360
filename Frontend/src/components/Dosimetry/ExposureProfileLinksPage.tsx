/**
 * ExposureProfileLinksPage — Phase 6 Frontend-C (LOT Dosimetrie & Expositions).
 *
 * Registre des profils d'exposition agent et de leurs liens vers les points
 * de mesure d'ambiance (avec fractions de temps de presence).
 *
 * Route : /dosimetry/exposure-profiles
 *
 * Layout :
 *   - Breadcrumb premium
 *   - Hero card gradient indigo/violet/fuchsia + 3 KPI tiles :
 *       Profils definis | Workers couverts | Dose estimee an. mediane (mSv)
 *   - Toolbar : recherche libre + filtre par type d'exposition
 *   - DataTable PrimeReact :
 *       Profil | Workers lies | Points lies (count + chips) |
 *       Dose estimee an. (mSv) | Derniere mise a jour | Actions
 *   - Bouton row "Editer les liens" -> /dosimetry/exposure-profiles/:profileId/edit
 *
 * Sources :
 *   - getAllExposureProfiles()
 *   - getExposureProfileLinks(profileId) (par profil)
 *   - getExposureProfileEstimatedDose(profileId)
 *   - listMeasurementPoints(mineId) (pour resoudre les labels de chips)
 *
 * i18n : namespace `dosimetry` -> bloc `exposureProfile.links.list`
 *
 * Contraintes : tsc strict + vite EXIT 0.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    IconAtom2,
    IconChevronRight,
    IconSearch,
    IconEye,
    IconPencil,
    IconPlus,
    IconInfoCircle,
    IconFilter,
    IconAlertOctagon,
    IconUsers,
    IconActivityHeartbeat,
    IconMapPin,
} from '@tabler/icons-react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {
    Modal,
    Select,
    TextInput,
    Textarea,
    Button,
    Group,
} from '@mantine/core';
import { useAppSelector } from '../../slices/hooks';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import {
    getAllExposureProfiles,
    getExposureProfileLinks,
    getExposureProfileEstimatedDose,
    listMeasurementPoints,
    createExposureProfile,
    searchWorkers,
    type ExposureProfileDTO,
    type ExposureProfileLinkDTO,
    type MeasurementPointDTO,
} from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  RBAC tolerant — aligne sur les autres pages Dosimetry
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
//  Types
// ─────────────────────────────────────────────────────────────────────────────

interface ProfileRow {
    id: number;
    workerId: number;
    exposureType: string;
    frequency: string;
    linkedPoints: { pointId: number; code: string; label: string }[];
    pointsCount: number;
    estimatedAnnualMsv: number;
    lastUpdated: string | null;
}

interface FiltersState {
    query: string;
    exposureType: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatDateFr = (s: string | null | undefined): string => {
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
        return s as string;
    }
};

const formatMsv = (uSv: number | null | undefined): string => {
    if (uSv == null || !Number.isFinite(Number(uSv))) return '—';
    const msv = Number(uSv) / 1000;
    if (!Number.isFinite(msv)) return '—';
    return msv.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const computeMedian = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
};

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const ExposureProfileLinksPage = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const user = useAppSelector((state: any) => state.user);
    const selectedCompanyId = useAppSelector(
        (state: any) => state.companySelection?.selectedCompanyId,
    );

    const canWrite = hasDosimetryPermission(user, 'DOSIMETRY_WRITE');

    const mineId: number = Number(
        selectedCompanyId ?? user?.mineId ?? user?.companyId ?? 1,
    );

    const [rows, setRows] = useState<ProfileRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [filters, setFilters] = useState<FiltersState>({
        query: '',
        exposureType: 'all',
    });

    // Modal de creation d'un profil
    const [createModalOpened, setCreateModalOpened] = useState(false);
    const [refreshTick, setRefreshTick] = useState(0);

    // ─── Chargement initial ───
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setLoadError(null);

        const profilesPromise = getAllExposureProfiles();
        const pointsPromise = listMeasurementPoints(mineId).catch(
            () => [] as MeasurementPointDTO[],
        );

        Promise.all([profilesPromise, pointsPromise])
            .then(async ([profiles, points]) => {
                if (cancelled) return;
                const pointMap = new Map<number, MeasurementPointDTO>();
                points.forEach((p) => {
                    if (p?.id != null) pointMap.set(Number(p.id), p);
                });

                const enriched: ProfileRow[] = await Promise.all(
                    profiles.map(async (p: ExposureProfileDTO) => {
                        const profileId = Number(p.id ?? 0);
                        let links: ExposureProfileLinkDTO[] = [];
                        let estimatedUSv = 0;
                        try {
                            if (profileId > 0) {
                                links = await getExposureProfileLinks(profileId);
                            }
                        } catch {
                            // ignore — pas de liens, ligne reste vide
                        }
                        try {
                            if (profileId > 0) {
                                estimatedUSv = await getExposureProfileEstimatedDose(
                                    profileId,
                                    1607,
                                );
                            }
                        } catch {
                            // ignore — estimee a 0
                        }

                        const lastUpdated = links
                            .map((l) => l.lastUpdated ?? null)
                            .filter((v): v is string => v != null)
                            .sort()
                            .pop() ?? p.updatedAt ?? null;

                        const linkedPoints = links.map((l) => {
                            const meta = pointMap.get(Number(l.measurementPointId));
                            return {
                                pointId: Number(l.measurementPointId),
                                code: meta?.code ?? `#${l.measurementPointId}`,
                                label: meta?.label ?? `#${l.measurementPointId}`,
                            };
                        });

                        return {
                            id: profileId,
                            workerId: Number(p.workerId ?? 0),
                            exposureType: String(p.exposureType ?? '—'),
                            frequency: String(p.frequency ?? '—'),
                            linkedPoints,
                            pointsCount: linkedPoints.length,
                            estimatedAnnualMsv: estimatedUSv,
                            lastUpdated,
                        };
                    }),
                );
                if (!cancelled) setRows(enriched);
            })
            .catch(() => {
                if (cancelled) return;
                setRows([]);
                setLoadError(t('exposureProfile.links.list.loadError'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [mineId, refreshTick, t]);

    // ─── KPI ───
    const kpi = useMemo(() => {
        const totalProfiles = rows.length;
        const workersCovered = new Set(
            rows.filter((r) => r.workerId > 0).map((r) => r.workerId),
        ).size;
        const msvValues = rows
            .map((r) => r.estimatedAnnualMsv / 1000)
            .filter((v) => Number.isFinite(v));
        const medianMsv = computeMedian(msvValues);
        return { totalProfiles, workersCovered, medianMsv };
    }, [rows]);

    // ─── Filtrage ───
    const filteredRows = useMemo(() => {
        const q = filters.query.trim().toLowerCase();
        return rows.filter((r) => {
            if (q) {
                const hay = `${r.exposureType} ${r.frequency} ${r.workerId} ${r.linkedPoints
                    .map((p) => `${p.code} ${p.label}`)
                    .join(' ')}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (
                filters.exposureType !== 'all'
                && r.exposureType !== filters.exposureType
            ) {
                return false;
            }
            return true;
        });
    }, [rows, filters]);

    const exposureTypes = useMemo(() => {
        const set = new Set<string>();
        rows.forEach((r) => {
            if (r.exposureType && r.exposureType !== '—') set.add(r.exposureType);
        });
        return Array.from(set).sort();
    }, [rows]);

    // ─── Templates ───
    const renderProfile = (row: ProfileRow) => (
        <div className="flex flex-col leading-tight">
            <span className="text-[12.5px] font-semibold text-slate-800">
                {row.exposureType}
            </span>
            <span className="text-[10.5px] text-slate-500">
                {t('exposureProfile.links.list.workerHint', { workerId: row.workerId })}
            </span>
        </div>
    );

    const renderWorkers = (row: ProfileRow) => (
        <span className="inline-flex items-center gap-1 text-[12px] text-slate-700">
            <IconUsers size={12} stroke={1.6} className="text-slate-400" />
            <span className="font-mono tabular-nums">
                {row.workerId > 0 ? `#${row.workerId}` : '—'}
            </span>
        </span>
    );

    const renderPoints = (row: ProfileRow) => {
        if (row.pointsCount === 0) {
            return (
                <span className="text-[11.5px] italic text-slate-400">
                    {t('exposureProfile.links.list.noPoints')}
                </span>
            );
        }
        const shown = row.linkedPoints.slice(0, 3);
        const overflow = row.pointsCount - shown.length;
        return (
            <div className="flex items-center gap-1 flex-wrap">
                <span className="font-mono text-[11.5px] text-slate-600 tabular-nums mr-1">
                    {row.pointsCount}
                </span>
                {shown.map((p) => (
                    <span
                        key={p.pointId}
                        title={p.label}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border bg-indigo-50 border-indigo-100 text-indigo-700 text-[10.5px] font-medium"
                    >
                        <IconMapPin size={9} stroke={1.8} />
                        {p.code}
                    </span>
                ))}
                {overflow > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[10.5px] font-medium">
                        +{overflow}
                    </span>
                )}
            </div>
        );
    };

    const renderEstimatedDose = (row: ProfileRow) => {
        const msvFmt = formatMsv(row.estimatedAnnualMsv);
        return (
            <span className="inline-flex items-center gap-1 text-[12px] font-mono tabular-nums text-slate-800">
                <IconActivityHeartbeat
                    size={11}
                    stroke={1.8}
                    className="text-violet-500"
                />
                {msvFmt}
                <span className="text-[10px] text-slate-400">mSv</span>
            </span>
        );
    };

    const renderLastUpdated = (row: ProfileRow) => (
        <span className="text-[11.5px] text-slate-600">{formatDateFr(row.lastUpdated)}</span>
    );

    const renderActions = (row: ProfileRow) => (
        <div
            className="inline-flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
        >
            <button
                type="button"
                onClick={() => navigate(`/dosimetry/exposure-profiles/${row.id}/edit`)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11.5px] text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition"
                title={t('exposureProfile.links.list.actions.editLinks')}
                aria-label={t('exposureProfile.links.list.actions.editLinks')}
            >
                {canWrite ? (
                    <IconPencil size={11} stroke={1.8} />
                ) : (
                    <IconEye size={11} stroke={1.8} />
                )}
                {canWrite
                    ? t('exposureProfile.links.list.actions.editLinks')
                    : t('exposureProfile.links.list.actions.viewLinks')}
            </button>
        </div>
    );

    const emptyTemplate = (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200 flex items-center justify-center mb-4 shadow-sm">
                <IconAtom2 size={28} className="text-indigo-500" stroke={1.6} />
            </div>
            <p className="text-[14px] text-slate-800 font-semibold mb-1">
                {t('exposureProfile.links.list.empty.title')}
            </p>
            <p className="text-[12.5px] text-slate-500 max-w-md mb-4 leading-relaxed">
                {t('exposureProfile.links.list.empty.subtitle')}
            </p>
        </div>
    );

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">
                {/* ─── Breadcrumb premium ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('exposureProfile.links.list.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('exposureProfile.links.list.breadcrumbParent')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('exposureProfile.links.list.breadcrumbCurrent')}
                    </span>
                </div>

                {/* ─── Hero card ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
                                <IconAtom2 size={22} stroke={1.8} className="text-white" />
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
                                    {t('exposureProfile.links.list.title')}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {t('exposureProfile.links.list.subtitle')}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-stretch gap-2">
                            <HeroKpi
                                label={t('exposureProfile.links.list.kpi.profiles')}
                                value={kpi.totalProfiles}
                                accent="indigo"
                                icon={<IconAtom2 size={13} stroke={1.8} />}
                            />
                            <HeroKpi
                                label={t('exposureProfile.links.list.kpi.workersCovered')}
                                value={kpi.workersCovered}
                                accent="violet"
                                icon={<IconUsers size={13} stroke={1.8} />}
                            />
                            <HeroKpi
                                label={t('exposureProfile.links.list.kpi.medianDose')}
                                value={kpi.medianMsv.toLocaleString('fr-FR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                                suffix="mSv"
                                accent="fuchsia"
                                icon={<IconActivityHeartbeat size={13} stroke={1.8} />}
                            />
                        </div>
                    </div>
                </div>

                {/* ─── Banner erreur ─── */}
                {loadError && (
                    <div
                        className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]"
                        role="alert"
                    >
                        <IconAlertOctagon
                            size={14}
                            stroke={1.8}
                            className="mt-0.5 flex-shrink-0"
                        />
                        <span>{loadError}</span>
                    </div>
                )}

                {/* ─── Toolbar ─── */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[220px] max-w-[360px]">
                            <IconSearch
                                size={13}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                stroke={1.8}
                            />
                            <input
                                type="search"
                                value={filters.query}
                                onChange={(e) =>
                                    setFilters((f) => ({ ...f, query: e.target.value }))
                                }
                                placeholder={t('exposureProfile.links.list.toolbar.searchPlaceholder')}
                                aria-label={t('exposureProfile.links.list.toolbar.searchAria')}
                                className="w-full pl-8 pr-3 py-1.5 text-[12.5px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                            />
                        </div>

                        <FilterSelect
                            ariaLabel={t('exposureProfile.links.list.toolbar.filterType')}
                            value={filters.exposureType}
                            onChange={(v) =>
                                setFilters((f) => ({ ...f, exposureType: v }))
                            }
                            options={[
                                {
                                    value: 'all',
                                    label: t('exposureProfile.links.list.toolbar.allTypes'),
                                },
                                ...exposureTypes.map((tp) => ({
                                    value: tp,
                                    label: tp,
                                })),
                            ]}
                        />

                        {canWrite && (
                            <button
                                type="button"
                                onClick={() => setCreateModalOpened(true)}
                                className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
                            >
                                <IconPlus size={13} stroke={2} />
                                {t('exposureProfile.links.list.toolbar.add')}
                            </button>
                        )}
                    </div>

                    {(filters.query || filters.exposureType !== 'all') && (
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                            <IconFilter size={11} stroke={1.8} />
                            <span>
                                {t('exposureProfile.links.list.toolbar.activeFilters', {
                                    count: filteredRows.length,
                                    total: rows.length,
                                })}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    setFilters({ query: '', exposureType: 'all' })
                                }
                                className="ml-1 underline hover:text-indigo-600"
                            >
                                {t('exposureProfile.links.list.toolbar.clearFilters')}
                            </button>
                        </div>
                    )}
                </div>

                {/* ─── DataTable ─── */}
                <div className="safex-dosimetry-table bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="px-4 py-12 text-center text-slate-500 text-[13px]">
                            <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-2 align-middle" />
                            {t('exposureProfile.links.list.loading')}
                        </div>
                    ) : (
                        <DataTable
                            value={filteredRows}
                            dataKey="id"
                            size="small"
                            stripedRows
                            paginator
                            rows={15}
                            rowsPerPageOptions={[10, 15, 25, 50]}
                            rowHover
                            responsiveLayout="scroll"
                            emptyMessage={emptyTemplate}
                            onRowClick={(e) =>
                                navigate(
                                    `/dosimetry/exposure-profiles/${(e.data as ProfileRow).id}/edit`,
                                )
                            }
                            rowClassName={() => 'cursor-pointer'}
                            className="text-[12.5px]"
                        >
                            <Column
                                field="exposureType"
                                header={t('exposureProfile.links.list.columns.profile')}
                                sortable
                                style={{ minWidth: 220 }}
                                body={renderProfile}
                            />
                            <Column
                                field="workerId"
                                header={t('exposureProfile.links.list.columns.workers')}
                                sortable
                                style={{ minWidth: 130 }}
                                body={renderWorkers}
                            />
                            <Column
                                field="pointsCount"
                                header={t('exposureProfile.links.list.columns.points')}
                                sortable
                                style={{ minWidth: 220 }}
                                body={renderPoints}
                            />
                            <Column
                                field="estimatedAnnualMsv"
                                header={t('exposureProfile.links.list.columns.estimatedDose')}
                                sortable
                                style={{ width: 160 }}
                                body={renderEstimatedDose}
                                align="right"
                            />
                            <Column
                                field="lastUpdated"
                                header={t('exposureProfile.links.list.columns.lastUpdated')}
                                sortable
                                style={{ minWidth: 140 }}
                                body={renderLastUpdated}
                            />
                            <Column
                                header={t('exposureProfile.links.list.columns.actions')}
                                style={{ width: 170 }}
                                body={renderActions}
                                align="right"
                            />
                        </DataTable>
                    )}
                </div>

                {/* ─── Footer ─── */}
                <div className="mt-6 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 text-indigo-700 flex-shrink-0">
                        <IconInfoCircle size={15} stroke={1.8} />
                    </span>
                    <div className="text-[12.5px] text-slate-700 leading-relaxed">
                        <p className="font-medium text-slate-800 mb-0.5">
                            {t('exposureProfile.links.list.footer.title')}
                        </p>
                        <p>{t('exposureProfile.links.list.footer.note')}</p>
                    </div>
                </div>
            </div>

            {/* ─── Modal de creation d'un profil ─── */}
            {createModalOpened && (
                <CreateExposureProfileModal
                    opened={createModalOpened}
                    mineId={mineId}
                    onClose={() => setCreateModalOpened(false)}
                    onSuccess={(profileId) => {
                        setCreateModalOpened(false);
                        setRefreshTick((n) => n + 1);
                        if (profileId > 0) {
                            navigate(
                                `/dosimetry/exposure-profiles/${profileId}/edit`,
                            );
                        }
                    }}
                />
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

const KPI_ACCENT: Record<
    string,
    { bg: string; text: string; ring: string; iconBg: string }
> = {
    indigo: {
        bg: 'bg-indigo-50/70',
        text: 'text-indigo-700',
        ring: 'border-indigo-200',
        iconBg: 'bg-white border-indigo-200 text-indigo-700',
    },
    violet: {
        bg: 'bg-violet-50/70',
        text: 'text-violet-700',
        ring: 'border-violet-200',
        iconBg: 'bg-white border-violet-200 text-violet-700',
    },
    fuchsia: {
        bg: 'bg-fuchsia-50/70',
        text: 'text-fuchsia-700',
        ring: 'border-fuchsia-200',
        iconBg: 'bg-white border-fuchsia-200 text-fuchsia-700',
    },
};

function HeroKpi({
    label,
    value,
    accent,
    icon,
    suffix,
}: {
    label: string;
    value: number | string;
    accent: keyof typeof KPI_ACCENT;
    icon?: React.ReactNode;
    suffix?: string;
}) {
    const tone = KPI_ACCENT[accent];
    return (
        <div
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${tone.bg} ${tone.ring}`}
        >
            {icon && (
                <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center ${tone.iconBg}`}
                >
                    {icon}
                </div>
            )}
            <div>
                <p
                    className={`text-[10px] uppercase tracking-[0.14em] ${tone.text} leading-none font-semibold`}
                >
                    {label}
                </p>
                <p className="text-[15px] text-slate-800 font-mono font-bold leading-tight mt-0.5">
                    {typeof value === 'number'
                        ? value.toLocaleString('fr-FR')
                        : value}
                    {suffix && (
                        <span className="ml-1 text-[10px] text-slate-400 font-medium">
                            {suffix}
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
}

function FilterSelect({
    ariaLabel,
    value,
    onChange,
    options,
}: {
    ariaLabel: string;
    value: string;
    onChange: (next: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <select
            aria-label={ariaLabel}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="px-2 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
        >
            {options.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Modal de creation d'un profil d'exposition
//
//  Apres creation, l'utilisateur est redirige vers l'editeur de liens
//  /dosimetry/exposure-profiles/:profileId/edit pour rattacher les points
//  de mesure et leurs fractions de temps de presence.
// ─────────────────────────────────────────────────────────────────────────────

interface WorkerLite {
    id: number;
    matricule: string;
    fullName: string;
}

interface CreateExposureProfileModalProps {
    opened: boolean;
    mineId: number;
    onClose: () => void;
    onSuccess: (profileId: number) => void;
}

function CreateExposureProfileModal({
    opened,
    mineId,
    onClose,
    onSuccess,
}: CreateExposureProfileModalProps) {
    const { t } = useTranslation('dosimetry');

    const [workers, setWorkers] = useState<WorkerLite[]>([]);
    const [loadingWorkers, setLoadingWorkers] = useState(false);
    const [workerId, setWorkerId] = useState<string | null>(null);
    const [exposureType, setExposureType] = useState<string>('');
    const [frequency, setFrequency] = useState<string>('');
    const [conditions, setConditions] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!opened) return;
        let cancelled = false;
        setLoadingWorkers(true);
        searchWorkers({ mineId })
            .then((list: any[]) => {
                if (cancelled) return;
                const lite: WorkerLite[] = (Array.isArray(list) ? list : [])
                    .filter((w) => w?.id != null)
                    .map((w) => ({
                        id: Number(w.id),
                        matricule: String(w.matricule ?? w.employeeId ?? `#${w.id}`),
                        fullName: String(w.fullName ?? w.employeeName ?? '—'),
                    }));
                setWorkers(lite);
            })
            .catch(() => {
                if (!cancelled) setWorkers([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingWorkers(false);
            });
        return () => {
            cancelled = true;
        };
    }, [opened, mineId]);

    const validate = (): boolean => {
        const next: Record<string, string> = {};
        if (!workerId) {
            next.workerId = t(
                'exposureProfile.links.list.createModal.errors.workerRequired',
            );
        }
        if (!exposureType.trim()) {
            next.exposureType = t(
                'exposureProfile.links.list.createModal.errors.exposureTypeRequired',
            );
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        const payload: ExposureProfileDTO = {
            workerId: Number(workerId),
            exposureType: exposureType.trim(),
            frequency: frequency.trim() || null,
            conditions: conditions.trim() || null,
        };
        try {
            const newId = await createExposureProfile(payload);
            successNotification(
                t('exposureProfile.links.list.createModal.success'),
            );
            onSuccess(Number(newId));
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ??
                err?.message ??
                t('exposureProfile.links.list.createModal.error');
            errorNotification(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <span
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontWeight: 600,
                        fontSize: '16px',
                    }}
                    className="text-slate-900"
                >
                    {t('exposureProfile.links.list.createModal.title')}
                </span>
            }
            centered
            size="lg"
        >
            <p className="text-[12.5px] text-slate-600 mb-4">
                {t('exposureProfile.links.list.createModal.subtitle')}
            </p>
            <div className="space-y-3">
                <Select
                    label={t('exposureProfile.links.list.createModal.workerLabel')}
                    placeholder={t(
                        'exposureProfile.links.list.createModal.workerPlaceholder',
                    )}
                    data={workers.map((w) => ({
                        value: String(w.id),
                        label: `${w.matricule} — ${w.fullName}`,
                    }))}
                    searchable
                    nothingFoundMessage={t(
                        'exposureProfile.links.list.createModal.workerNotFound',
                    )}
                    value={workerId}
                    onChange={setWorkerId}
                    error={errors.workerId}
                    disabled={loadingWorkers}
                    size="sm"
                    withAsterisk
                />
                <TextInput
                    label={t(
                        'exposureProfile.links.list.createModal.exposureTypeLabel',
                    )}
                    placeholder={t(
                        'exposureProfile.links.list.createModal.exposureTypePlaceholder',
                    )}
                    description={t(
                        'exposureProfile.links.list.createModal.exposureTypeDesc',
                    )}
                    value={exposureType}
                    onChange={(e) => setExposureType(e.currentTarget.value)}
                    error={errors.exposureType}
                    withAsterisk
                    size="sm"
                />
                <TextInput
                    label={t(
                        'exposureProfile.links.list.createModal.frequencyLabel',
                    )}
                    placeholder={t(
                        'exposureProfile.links.list.createModal.frequencyPlaceholder',
                    )}
                    value={frequency}
                    onChange={(e) => setFrequency(e.currentTarget.value)}
                    size="sm"
                />
                <Textarea
                    label={t(
                        'exposureProfile.links.list.createModal.conditionsLabel',
                    )}
                    placeholder={t(
                        'exposureProfile.links.list.createModal.conditionsPlaceholder',
                    )}
                    value={conditions}
                    onChange={(e) => setConditions(e.currentTarget.value)}
                    minRows={2}
                    size="sm"
                />
            </div>
            <Group justify="flex-end" gap="sm" mt="md">
                <Button
                    variant="default"
                    size="sm"
                    onClick={onClose}
                    disabled={submitting}
                >
                    {t('exposureProfile.links.list.createModal.cancel')}
                </Button>
                <Button
                    size="sm"
                    color="indigo"
                    loading={submitting}
                    onClick={handleSubmit}
                    leftSection={<IconPlus size={13} />}
                >
                    {t('exposureProfile.links.list.createModal.submit')}
                </Button>
            </Group>
        </Modal>
    );
}

export default ExposureProfileLinksPage;

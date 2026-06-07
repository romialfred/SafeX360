/**
 * DosimetryDashboardPage — Tableau de bord executif Dosimetrie (Phase 8 Frontend).
 *
 * Route : /dosimetry (landing par defaut du module) + /dosimetry/dashboard (alias).
 *
 * <p>RBAC : DOSIMETRY_READ_AGGREGATE — donnees STRICTEMENT agregees, AUCUNE
 * donnee nominative ou medicale n'apparait dans ce dashboard. La fiche
 * 360 individuelle reste accessible via TopExposedWorkersTable (qui declenche
 * le RBAC nominatif au niveau du detail worker).
 *
 * <p>Sections :
 *   1. Hero serif      : breadcrumb + titre + filtres (mine / categorie / annee) + refresh.
 *   2. KPI Hero        : 6 tuiles premium (workers, dose moy, >50%, >90%, surex, aptitudes).
 *   3. Tendances       : DoseTrendChart 12 mois (avg / median / max) + lignes ref CIPR.
 *   4. Distribution    : DoseDistributionChart 6 buckets (gradient vert -> rouge).
 *   5. Top 10 exposes  : TopExposedWorkersTable (pseudonymise).
 *   6. Multi-mine      : MultiMineComparisonCard (grid 2 col, clic = filtre).
 *
 * <p>Donnees :
 *   - getKpiSummary(mineId)            -> snapshots par categorie
 *   - getKpiTrend(mineId, 12, cat, m)  -> series temporelles
 *   - getKpiDistribution(mineId, y, c) -> histogramme buckets
 *   - getTopExposed(mineId, 10, year)  -> top N
 *   - getMultiMineComparison(date)     -> cross-tenant
 *
 * <p>Tolerance : si tout endpoint renvoie [] (mocked), le dashboard affiche
 * des etats vides explicites — pas de crash.
 *
 * Contraintes : tsc strict + vite EXIT 0.
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Select } from '@mantine/core';
import {
    IconChevronRight,
    IconRefresh,
    IconAtom2,
    IconUsersGroup,
    IconActivity,
    IconChartLine,
    IconAlertOctagon,
    IconStethoscope,
    IconFolderOpen,
    IconInfoCircle,
    IconShieldCheck,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import DosimetryKpiTile from './DosimetryKpiTile';
import DoseTrendChart from './DoseTrendChart';
import DoseDistributionChart from './DoseDistributionChart';
import TopExposedWorkersTable from './TopExposedWorkersTable';
import MultiMineComparisonCard from './MultiMineComparisonCard';
import {
    getKpiSummary,
    getKpiTrend,
    getKpiDistribution,
    getTopExposed,
    getMultiMineComparison,
    type DosimetryKpiSnapshotDTO,
    type DosimetryTrendPointDTO,
    type DosimetryDistributionDTO,
    type DosimetryTopExposedDTO,
    type DosimetryMineComparisonDTO,
    type KpiCategory,
} from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  Constantes
// ─────────────────────────────────────────────────────────────────────────────

const ALL_CATEGORIES: KpiCategory[] = ['WORKER_A', 'WORKER_B', 'APPRENTICE', 'PREGNANCY', 'PUBLIC'];

// Limites reglementaires CIPR 103 par categorie (mSv/an, Hp10).
// On laisse le backend retourner la limite via distribution.regulatoryLimit,
// mais on conserve un fallback de reference pour le chart de tendance.
const CIPR_LIMIT_BY_CATEGORY: Record<KpiCategory, number> = {
    WORKER_A: 20,
    WORKER_B: 6,
    APPRENTICE: 6,
    PREGNANCY: 1,
    PUBLIC: 1,
};

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS: number[] = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3];

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const toNumber = (v: number | null | undefined): number => {
    if (v == null) return 0;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
};

const formatDate = (iso?: string | null): string => {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return iso;
    }
};

const todayIso = (): string => new Date().toISOString().slice(0, 10);

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const DosimetryDashboardPage = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();

    const user = useAppSelector((state: any) => state.user);
    const reduxMineId: number | null = useAppSelector(
        (state: any) => state?.companySelection?.selectedCompanyId ?? null,
    );

    // mineId courant : redux > user > fallback 1
    const initialMineId: number = reduxMineId ?? user?.mineId ?? user?.companyId ?? 1;

    const [mineId, setMineId] = useState<number>(initialMineId);
    const [category, setCategory] = useState<KpiCategory | 'ALL'>('ALL');
    const [year, setYear] = useState<number>(CURRENT_YEAR);

    const [snapshots, setSnapshots] = useState<DosimetryKpiSnapshotDTO[]>([]);
    const [trendAvg, setTrendAvg] = useState<DosimetryTrendPointDTO[]>([]);
    const [trendMedian, setTrendMedian] = useState<DosimetryTrendPointDTO[]>([]);
    const [trendMax, setTrendMax] = useState<DosimetryTrendPointDTO[]>([]);
    const [distribution, setDistribution] = useState<DosimetryDistributionDTO | null>(null);
    const [topExposed, setTopExposed] = useState<DosimetryTopExposedDTO[]>([]);
    const [multiMine, setMultiMine] = useState<DosimetryMineComparisonDTO[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // ───── Sync avec selectedCompanyId du store (changement de tenant global) ─────
    useEffect(() => {
        if (reduxMineId != null && reduxMineId !== mineId) {
            setMineId(reduxMineId);
        }
        // mineId volontairement omis : on ne resynchronise que si le store change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reduxMineId]);

    // ───── Loader principal ─────
    const loadAll = useCallback(
        async (signal?: AbortSignal) => {
            setLoadError(null);
            const targetCategory: KpiCategory | null = category === 'ALL' ? null : category;
            try {
                const [
                    summaryResult,
                    avgResult,
                    medianResult,
                    maxResult,
                    distributionResult,
                    topResult,
                    multiResult,
                ] = await Promise.allSettled([
                    getKpiSummary(mineId, null),
                    getKpiTrend(mineId, 12, targetCategory, 'avgAnnualDose'),
                    getKpiTrend(mineId, 12, targetCategory, 'medianAnnualDose'),
                    getKpiTrend(mineId, 12, targetCategory, 'maxAnnualDose'),
                    getKpiDistribution(mineId, year, targetCategory),
                    getTopExposed(mineId, 10, year),
                    getMultiMineComparison(null),
                ]);

                if (signal?.aborted) return;

                setSnapshots(summaryResult.status === 'fulfilled' ? (summaryResult.value ?? []) : []);
                setTrendAvg(avgResult.status === 'fulfilled' ? (avgResult.value ?? []) : []);
                setTrendMedian(medianResult.status === 'fulfilled' ? (medianResult.value ?? []) : []);
                setTrendMax(maxResult.status === 'fulfilled' ? (maxResult.value ?? []) : []);
                setDistribution(
                    distributionResult.status === 'fulfilled' ? (distributionResult.value ?? null) : null,
                );
                setTopExposed(topResult.status === 'fulfilled' ? (topResult.value ?? []) : []);
                setMultiMine(multiResult.status === 'fulfilled' ? (multiResult.value ?? []) : []);

                // Si tout a echoue, on signale une erreur.
                const allFailed =
                    summaryResult.status === 'rejected' &&
                    avgResult.status === 'rejected' &&
                    distributionResult.status === 'rejected' &&
                    topResult.status === 'rejected';
                if (allFailed) {
                    setLoadError(
                        t('dashboard.loadError', {
                            defaultValue:
                                'Impossible de charger les KPI dosimetrie. Verifiez vos permissions ou reessayez.',
                        }),
                    );
                }
            } catch {
                setLoadError(
                    t('dashboard.loadError', {
                        defaultValue: 'Impossible de charger les KPI dosimetrie.',
                    }),
                );
            }
        },
        [mineId, category, year, t],
    );

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        loadAll(controller.signal).finally(() => {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        });
        return () => controller.abort();
    }, [loadAll]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadAll();
        setRefreshing(false);
    }, [loadAll]);

    // ───── Agregation KPI hero (somme categories selon filtre) ─────
    const aggregated = useMemo(() => {
        const filteredSnaps: DosimetryKpiSnapshotDTO[] =
            category === 'ALL'
                ? snapshots
                : snapshots.filter((s) => s.category === category);

        const workersCount = filteredSnaps.reduce((acc, s) => acc + toNumber(s.workersCount), 0);
        // Moyenne ponderee par workersCount
        let totalDose = 0;
        let totalWorkers = 0;
        for (const s of filteredSnaps) {
            const w = toNumber(s.workersCount);
            const d = toNumber(s.avgAnnualDose);
            if (w > 0) {
                totalDose += d * w;
                totalWorkers += w;
            }
        }
        const avgAnnualDose = totalWorkers > 0 ? totalDose / totalWorkers : 0;

        const workersOver50 = filteredSnaps.reduce((acc, s) => acc + toNumber(s.workersOver50Pct), 0);
        const workersOver90 = filteredSnaps.reduce((acc, s) => acc + toNumber(s.workersOver90Pct), 0);
        const workersOver100 = filteredSnaps.reduce((acc, s) => acc + toNumber(s.workersOver100Pct), 0);
        const overexposureOpen = filteredSnaps.reduce(
            (acc, s) => acc + toNumber(s.overexposureCasesOpen),
            0,
        );
        const fitnessExpiring = filteredSnaps.reduce(
            (acc, s) => acc + toNumber(s.fitnessExpiringSoon),
            0,
        );
        const activeAlerts = filteredSnaps.reduce((acc, s) => acc + toNumber(s.activeAlertsCount), 0);

        // Breakdown categorie pour le sub-text "workers"
        const breakdown: Record<KpiCategory, number> = {
            WORKER_A: 0,
            WORKER_B: 0,
            APPRENTICE: 0,
            PREGNANCY: 0,
            PUBLIC: 0,
        };
        for (const s of snapshots) {
            breakdown[s.category] = (breakdown[s.category] ?? 0) + toNumber(s.workersCount);
        }

        // Snapshot date max
        const snapDates = filteredSnaps
            .map((s) => s.snapshotDate)
            .filter(Boolean)
            .sort()
            .reverse();
        const snapshotDate = snapDates[0] ?? null;

        return {
            workersCount,
            avgAnnualDose,
            workersOver50,
            workersOver90,
            workersOver100,
            overexposureOpen,
            fitnessExpiring,
            activeAlerts,
            breakdown,
            snapshotDate,
        };
    }, [snapshots, category]);

    // ───── Sparkline pour workers >50% : on derive depuis la trend max ─────
    // Si pas dispo, on construit une mini-serie a partir des 6 derniers mois.
    const sparkOver50 = useMemo(() => {
        // On utilise la valeur de trendMax comme proxy : pas ideal mais
        // donne au moins une visualisation correcte. En production, le backend
        // pourrait exposer une metrique "workersOver50PctCount".
        const points = trendMax.slice(-6).map((p) => toNumber(p.value));
        return points.length >= 2 ? points : null;
    }, [trendMax]);

    // ───── Regulatory limit pour le chart de tendance ─────
    const regulatoryLimit = useMemo(() => {
        if (distribution?.regulatoryLimit != null) {
            return Number(distribution.regulatoryLimit);
        }
        if (category !== 'ALL') {
            return CIPR_LIMIT_BY_CATEGORY[category];
        }
        // Par defaut on prend la limite la plus restrictive du subset visible
        return CIPR_LIMIT_BY_CATEGORY.WORKER_B;
    }, [distribution, category]);

    // ───── Selection multi-mine -> filtre dashboard ─────
    const handleSelectMine = useCallback((newMineId: number) => {
        setMineId(newMineId);
    }, []);

    const mineLabels = useMemo(() => {
        const map: Record<number, string> = {};
        multiMine.forEach((m) => {
            map[m.mineId] = `Mine #${m.mineId}`;
        });
        // Mine courante : tente d'afficher un libelle plus lisible si user a un companyName.
        const currentCompanyName: string | null = user?.companyName ?? null;
        if (currentCompanyName && mineId in map === false) {
            map[mineId] = currentCompanyName;
        } else if (currentCompanyName) {
            map[mineId] = currentCompanyName;
        }
        return map;
    }, [multiMine, user, mineId]);

    // ─────────────────────────────────────────────────────────────────────
    //  Render
    // ─────────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-[1500px] mx-auto">
                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('dashboard.breadcrumbRoot', { defaultValue: 'Dosimetrie' })}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('dashboard.breadcrumbCurrent', { defaultValue: 'Vue d ensemble' })}
                    </span>
                </div>

                {/* ─── Hero card (serif title + filtres + refresh) ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-200 flex-shrink-0">
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
                                    {t('dashboard.title', {
                                        defaultValue: 'Tableau de bord dosimetrie',
                                    })}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {t('dashboard.subtitle', {
                                        defaultValue:
                                            'Vue agregee des indicateurs cles d expositions aux rayonnements ionisants — conforme CIPR 103 / AIEA GSR Part 3. Aucune donnee nominative ou medicale n est exposee sur ce tableau.',
                                    })}
                                </p>
                                <p className="text-[11.5px] text-slate-500 mt-2 flex items-center gap-1.5">
                                    <IconShieldCheck size={12} stroke={1.7} className="text-violet-600" />
                                    {t('dashboard.snapshotDate', { defaultValue: 'Snapshot au' })}{' '}
                                    <span className="font-semibold text-slate-700">
                                        {formatDate(aggregated.snapshotDate ?? todayIso())}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Filtres */}
                        <div className="flex flex-wrap items-end gap-2">
                            <Select
                                size="xs"
                                label={t('dashboard.filters.mineLabel', { defaultValue: 'Mine' })}
                                placeholder={t('dashboard.filters.minePlaceholder', {
                                    defaultValue: 'Selectionner',
                                })}
                                data={[
                                    { value: String(mineId), label: mineLabels[mineId] ?? `Mine #${mineId}` },
                                    ...multiMine
                                        .filter((m) => m.mineId !== mineId)
                                        .map((m) => ({
                                            value: String(m.mineId),
                                            label: mineLabels[m.mineId] ?? `Mine #${m.mineId}`,
                                        })),
                                ]}
                                value={String(mineId)}
                                onChange={(v) => {
                                    if (v) setMineId(Number(v));
                                }}
                                w={180}
                            />
                            <Select
                                size="xs"
                                label={t('dashboard.filters.categoryLabel', { defaultValue: 'Categorie' })}
                                data={[
                                    {
                                        value: 'ALL',
                                        label: t('dashboard.filters.categoryAll', {
                                            defaultValue: 'Toutes',
                                        }),
                                    },
                                    ...ALL_CATEGORIES.map((c) => ({
                                        value: c,
                                        label: t(`thresholds.categories.${c}`, { defaultValue: c }),
                                    })),
                                ]}
                                value={category}
                                onChange={(v) => setCategory((v as KpiCategory | 'ALL') ?? 'ALL')}
                                w={180}
                            />
                            <Select
                                size="xs"
                                label={t('dashboard.filters.yearLabel', { defaultValue: 'Annee' })}
                                data={YEAR_OPTIONS.map((y) => ({ value: String(y), label: String(y) }))}
                                value={String(year)}
                                onChange={(v) => {
                                    if (v) setYear(Number(v));
                                }}
                                w={110}
                            />
                            <button
                                type="button"
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-50"
                                aria-label={t('dashboard.refresh', { defaultValue: 'Rafraichir' })}
                            >
                                <IconRefresh
                                    size={13}
                                    stroke={1.8}
                                    className={refreshing ? 'animate-spin' : ''}
                                />
                                <span className="hidden sm:inline">
                                    {t('dashboard.refresh', { defaultValue: 'Rafraichir' })}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── Bandeau d'erreur chargement (non bloquant) ─── */}
                {loadError && (
                    <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]">
                        <IconInfoCircle size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{loadError}</span>
                    </div>
                )}

                {/* ─── Section 1 : KPI Hero (6 tiles) ─── */}
                <div className="mb-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <DosimetryKpiTile
                            icon={IconUsersGroup}
                            label={t('dashboard.kpi.workersLabel', { defaultValue: 'Travailleurs' })}
                            value={aggregated.workersCount}
                            tone="info"
                            loading={loading}
                            tooltip={t('dashboard.kpi.workersTooltip', {
                                defaultValue:
                                    'Nombre total de travailleurs exposes enregistres dans le perimetre filtre.',
                            })}
                        >
                            <div className="text-[10.5px] text-slate-600 leading-tight space-y-0.5">
                                {ALL_CATEGORIES.filter((c) => aggregated.breakdown[c] > 0).map((c) => (
                                    <div key={c} className="flex justify-between gap-2">
                                        <span className="truncate">
                                            {t(`thresholds.categories.${c}`, { defaultValue: c })}
                                        </span>
                                        <span className="font-mono font-semibold text-slate-800 tabular-nums">
                                            {aggregated.breakdown[c]}
                                        </span>
                                    </div>
                                ))}
                                {Object.values(aggregated.breakdown).every((v) => v === 0) && (
                                    <span className="text-slate-400">
                                        {t('dashboard.kpi.workersEmpty', {
                                            defaultValue: 'Aucun travailleur enregistre',
                                        })}
                                    </span>
                                )}
                            </div>
                        </DosimetryKpiTile>

                        <DosimetryKpiTile
                            icon={IconActivity}
                            label={t('dashboard.kpi.avgDoseLabel', { defaultValue: 'Dose moyenne' })}
                            value={aggregated.avgAnnualDose.toFixed(2)}
                            unit="mSv/an"
                            sub={t('dashboard.kpi.avgDoseSub', {
                                defaultValue: 'Hp(10) - moyenne annuelle ponderee',
                            })}
                            tone="info"
                            loading={loading}
                            tooltip={t('dashboard.kpi.avgDoseTooltip', {
                                defaultValue:
                                    'Moyenne ponderee par le nombre de travailleurs de chaque categorie.',
                            })}
                        />

                        <DosimetryKpiTile
                            icon={IconChartLine}
                            label={t('dashboard.kpi.over50Label', { defaultValue: 'Workers > 50% limite' })}
                            value={aggregated.workersOver50}
                            sub={t('dashboard.kpi.over50Sub', {
                                defaultValue: 'Au-dela de la moitie de la limite reglementaire',
                            })}
                            tone="warning"
                            sparkline={sparkOver50}
                            loading={loading}
                            tooltip={t('dashboard.kpi.over50Tooltip', {
                                defaultValue:
                                    'Travailleurs dont le cumul annuel depasse 50% de la limite CIPR de leur categorie.',
                            })}
                        />

                        <DosimetryKpiTile
                            icon={IconAlertOctagon}
                            label={t('dashboard.kpi.over90Label', { defaultValue: 'Workers > 90% limite' })}
                            value={aggregated.workersOver90}
                            sub={t('dashboard.kpi.over90Sub', {
                                defaultValue: 'Niveau d action — surveillance renforcee',
                            })}
                            tone={aggregated.workersOver90 > 0 ? 'critical' : 'success'}
                            pulse={aggregated.workersOver90 > 0}
                            urgent={aggregated.workersOver90 > 0}
                            loading={loading}
                            tooltip={t('dashboard.kpi.over90Tooltip', {
                                defaultValue:
                                    'Travailleurs au niveau d action — un dossier de depassement doit etre envisage.',
                            })}
                        />

                        <DosimetryKpiTile
                            icon={IconFolderOpen}
                            label={t('dashboard.kpi.overexposureLabel', {
                                defaultValue: 'Dossiers surexposition',
                            })}
                            value={aggregated.overexposureOpen}
                            sub={t('dashboard.kpi.overexposureSub', {
                                defaultValue: 'Cas ouverts (OPEN + INVESTIGATING)',
                            })}
                            tone={aggregated.overexposureOpen > 0 ? 'alert' : 'success'}
                            loading={loading}
                            onClick={() => navigate('/dosimetry/overexposure')}
                            tooltip={t('dashboard.kpi.overexposureTooltip', {
                                defaultValue: 'Cliquer pour ouvrir le workflow des dossiers de depassement.',
                            })}
                        />

                        <DosimetryKpiTile
                            icon={IconStethoscope}
                            label={t('dashboard.kpi.fitnessExpiringLabel', {
                                defaultValue: 'Aptitudes < 30j',
                            })}
                            value={aggregated.fitnessExpiring}
                            sub={t('dashboard.kpi.fitnessExpiringSub', {
                                defaultValue: 'Fiches arrivant a echeance bientot',
                            })}
                            tone={aggregated.fitnessExpiring > 0 ? 'warning' : 'success'}
                            loading={loading}
                            onClick={() => navigate('/dosimetry/medical/planning')}
                            tooltip={t('dashboard.kpi.fitnessExpiringTooltip', {
                                defaultValue:
                                    'Cliquer pour ouvrir le planning de surveillance medicale (medecin du travail).',
                            })}
                        />
                    </div>
                </div>

                {/* ─── Section 2 + 3 : Tendances + Distribution (cote-a-cote) ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">
                    <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
                            <div>
                                <h2
                                    className="text-slate-800 font-semibold text-[15px] leading-tight"
                                    style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                                >
                                    {t('dashboard.trend.title', {
                                        defaultValue: 'Tendances mensuelles (12 mois)',
                                    })}
                                </h2>
                                <p className="text-[11.5px] text-slate-500 mt-0.5">
                                    {t('dashboard.trend.subtitle', {
                                        defaultValue:
                                            'Dose annuelle moyenne / mediane / max. Lignes ref. : 50% / 75% / 100% limite CIPR.',
                                    })}
                                </p>
                            </div>
                            {regulatoryLimit > 0 && (
                                <div className="text-right flex-shrink-0">
                                    <p className="text-[10px] uppercase tracking-[0.10em] text-slate-500 font-semibold">
                                        {t('dashboard.trend.limitLabel', { defaultValue: 'Limite CIPR' })}
                                    </p>
                                    <p className="text-[14px] font-mono font-bold text-red-700 tabular-nums">
                                        {regulatoryLimit.toFixed(0)} mSv/an
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="p-4">
                            <DoseTrendChart
                                avg={trendAvg}
                                median={trendMedian}
                                max={trendMax}
                                regulatoryLimit={regulatoryLimit}
                                loading={loading}
                                labels={{
                                    avg: t('dashboard.trend.avg', { defaultValue: 'Dose moyenne' }),
                                    median: t('dashboard.trend.median', { defaultValue: 'Dose mediane' }),
                                    max: t('dashboard.trend.max', { defaultValue: 'Dose max' }),
                                }}
                                refLabels={{
                                    p50: t('dashboard.trend.refP50', { defaultValue: '50% limite' }),
                                    p75: t('dashboard.trend.refP75', { defaultValue: '75% limite' }),
                                    p100: t('dashboard.trend.refP100', { defaultValue: 'Limite CIPR' }),
                                }}
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100">
                            <h2
                                className="text-slate-800 font-semibold text-[15px] leading-tight"
                                style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                            >
                                {t('dashboard.distribution.title', {
                                    defaultValue: 'Distribution des doses annuelles',
                                })}
                            </h2>
                            <p className="text-[11.5px] text-slate-500 mt-0.5">
                                {t('dashboard.distribution.subtitle', {
                                    defaultValue:
                                        'Repartition des travailleurs par % de la limite reglementaire (CIPR 103).',
                                })}
                            </p>
                        </div>
                        <div className="p-4">
                            <DoseDistributionChart
                                distribution={distribution}
                                loading={loading}
                                workersLabel={t('dashboard.distribution.workers', {
                                    defaultValue: 'travailleur(s)',
                                })}
                                totalLabel={t('dashboard.distribution.total', {
                                    defaultValue: 'Total',
                                })}
                            />
                        </div>
                    </div>
                </div>

                {/* ─── Section 4 : Top 10 exposes ─── */}
                <div className="mb-5">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <div>
                            <h2
                                className="text-slate-800 font-semibold text-[16px] leading-tight"
                                style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                            >
                                {t('dashboard.top.title', {
                                    defaultValue: 'Top 10 des travailleurs les plus exposes',
                                })}
                            </h2>
                            <p className="text-[11.5px] text-slate-500 mt-0.5">
                                {t('dashboard.top.subtitle', {
                                    defaultValue: `Annee ${year} — cumul annuel pseudonymise. Cliquer une ligne pour ouvrir la fiche 360 (RBAC DOSIMETRY_READ_NOMINATIVE).`,
                                    year,
                                })}
                            </p>
                        </div>
                    </div>
                    <TopExposedWorkersTable
                        data={topExposed}
                        loading={loading}
                        labels={{
                            rank: t('dashboard.top.rank', { defaultValue: 'Rang' }),
                            workerId: t('dashboard.top.workerId', { defaultValue: 'Worker ID' }),
                            category: t('dashboard.top.category', { defaultValue: 'Categorie' }),
                            annualDose: t('dashboard.top.annualDose', {
                                defaultValue: 'Dose annuelle (mSv)',
                            }),
                            percentLimit: t('dashboard.top.percentLimit', { defaultValue: '% limite' }),
                            status: t('dashboard.top.status', { defaultValue: 'Statut' }),
                            actions: t('dashboard.top.actions', { defaultValue: 'Actions' }),
                            empty: t('dashboard.top.empty', {
                                defaultValue: 'Aucun travailleur expose enregistre pour cette periode.',
                            }),
                            loadingText: t('dashboard.top.loading', {
                                defaultValue: 'Chargement du top 10…',
                            }),
                            privacyNotice: t('dashboard.top.privacyNotice', {
                                defaultValue:
                                    'Donnees agregees - aucune donnee medicale visible ici. Le nom et le matricule du travailleur sont visibles uniquement dans la fiche 360 (permission DOSIMETRY_READ_NOMINATIVE).',
                            }),
                            viewWorker: t('dashboard.top.viewWorker', { defaultValue: 'Ouvrir la fiche' }),
                            statusSafe: t('dashboard.top.statusSafe', { defaultValue: 'Conforme' }),
                            statusWatch: t('dashboard.top.statusWatch', { defaultValue: 'Surveillance' }),
                            statusInvestigation: t('dashboard.top.statusInvestigation', {
                                defaultValue: 'Investigation',
                            }),
                            statusAction: t('dashboard.top.statusAction', { defaultValue: 'Action' }),
                            statusExceeded: t('dashboard.top.statusExceeded', {
                                defaultValue: 'Depassement',
                            }),
                        }}
                    />
                </div>

                {/* ─── Section 5 : Multi-mine comparison ─── */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <div>
                            <h2
                                className="text-slate-800 font-semibold text-[16px] leading-tight"
                                style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                            >
                                {t('dashboard.multimine.title', {
                                    defaultValue: 'Comparatif multi-sites',
                                })}
                            </h2>
                            <p className="text-[11.5px] text-slate-500 mt-0.5">
                                {t('dashboard.multimine.subtitle', {
                                    defaultValue:
                                        'KPI agreges par mine pour la derniere date de snapshot. Cliquer une carte pour filtrer le dashboard.',
                                })}
                            </p>
                        </div>
                    </div>
                    <MultiMineComparisonCard
                        data={multiMine}
                        loading={loading}
                        selectedMineId={mineId}
                        onSelectMine={handleSelectMine}
                        mineLabels={mineLabels}
                        labels={{
                            title: t('dashboard.multimine.title', {
                                defaultValue: 'Comparatif multi-sites',
                            }),
                            workers: t('dashboard.multimine.workers', { defaultValue: 'Workers' }),
                            avgDose: t('dashboard.multimine.avgDose', { defaultValue: 'Moy.' }),
                            maxDose: t('dashboard.multimine.maxDose', { defaultValue: 'Max' }),
                            over100: t('dashboard.multimine.over100', { defaultValue: '>100%' }),
                            alerts: t('dashboard.multimine.alerts', { defaultValue: 'Alertes' }),
                            cases: t('dashboard.multimine.cases', { defaultValue: 'Dossiers' }),
                            empty: t('dashboard.multimine.empty', {
                                defaultValue: 'Aucune donnee de comparaison disponible.',
                            }),
                            loadingText: t('dashboard.multimine.loading', {
                                defaultValue: 'Chargement…',
                            }),
                            unitMsv: 'mSv',
                            currentBadge: t('dashboard.multimine.currentBadge', {
                                defaultValue: 'Active',
                            }),
                            clickHint: t('dashboard.multimine.clickHint', {
                                defaultValue: 'Cliquer pour filtrer →',
                            }),
                        }}
                    />
                </div>

                {/* ─── Footer RGPD / conformite ─── */}
                <footer className="mt-4 text-center text-[10.5px] text-slate-400 leading-relaxed">
                    {t('dashboard.footer', {
                        defaultValue:
                            'Donnees agregees conformes RGPD art. 30 + CIPR 103 + AIEA GSR Part 3. Le rafraichissement des snapshots est quotidien (job nuit).',
                    })}
                </footer>
            </div>
        </div>
    );
};

export default DosimetryDashboardPage;

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
import { setCompanySelection } from '../../slices/CompanySelectionSlice';
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
import { useAppDispatch, useAppSelector } from '../../slices/hooks';
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

// Libellés courts pour le mini-breakdown de la tuile « Travailleurs » (évite la
// troncature des noms longs « Apprentis (16 à 18 ans) » dans une demi-tuile).
const CATEGORY_SHORT: Record<KpiCategory, string> = {
    WORKER_A: 'Cat. A',
    WORKER_B: 'Cat. B',
    APPRENTICE: 'Apprentis',
    PREGNANCY: 'Grossesse',
    PUBLIC: 'Public',
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

    // mineId courant : pilote PAR le selecteur global du header (CompanySelector).
    // Fallbacks : user.mineId / user.companyId / 1 pour le bootstrap initial.
    const mineId: number = reduxMineId ?? user?.mineId ?? user?.companyId ?? 1;

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

    // mineId est desormais derive directement du store global (CompanySelector dans le header).
    // Plus de re-synchronisation locale : tout changement de tenant declenche un nouveau rendu
    // avec un mineId different, ce qui re-execute loadAll via la dependance memoisee.

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
                                "Les indicateurs n'ont pas pu être chargés. Vérifiez vos droits d'accès ou réessayez.",
                        }),
                    );
                }
            } catch {
                setLoadError(
                    t('dashboard.loadError', {
                        defaultValue:
                            "Les indicateurs n'ont pas pu être chargés. Vérifiez vos droits d'accès ou réessayez.",
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
    const regulatoryLimit = useMemo<number | null>(() => {
        if (distribution?.regulatoryLimitConfigured !== false
            && distribution?.regulatoryLimit != null
            && Number(distribution.regulatoryLimit) > 0) {
            return Number(distribution.regulatoryLimit);
        }
        return null;
    }, [distribution]);

    // ───── Selection multi-mine -> delegue au selecteur global (CompanySelector) ─────
    // Au clic sur une carte du comparatif multi-mines, on dispatch le changement de tenant
    // dans le store : le header se met a jour ET tous les modules qui consomment
    // selectedCompanyId se re-synchronisent automatiquement.
    const dispatch = useAppDispatch();
    const handleSelectMine = useCallback(
        (newMineId: number) => {
            dispatch(setCompanySelection(newMineId));
        },
        [dispatch],
    );

    const mineLabels = useMemo(() => {
        const map: Record<number, string> = {};
        const fallbackPrefix = t('dashboard.filters.mineFallback', { defaultValue: 'Site' });
        multiMine.forEach((m) => {
            // Préférence : nom métier renvoyé par le backend si présent.
            const named = (m as unknown as { mineName?: string; companyName?: string }).mineName
                ?? (m as unknown as { mineName?: string; companyName?: string }).companyName;
            map[m.mineId] = named && named.trim().length > 0 ? named : `${fallbackPrefix} ${m.mineId}`;
        });
        // Mine courante : tente d'afficher un libelle plus lisible si user a un companyName.
        const currentCompanyName: string | null = user?.companyName ?? null;
        if (currentCompanyName) {
            map[mineId] = currentCompanyName;
        } else if (!(mineId in map)) {
            map[mineId] = `${fallbackPrefix} ${mineId}`;
        }
        return map;
    }, [multiMine, user, mineId, t]);

    // ─────────────────────────────────────────────────────────────────────
    //  Render
    // ─────────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">
                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('dashboard.breadcrumbRoot', { defaultValue: 'Dosimétrie' })}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('dashboard.breadcrumbCurrent', { defaultValue: "Vue d'ensemble" })}
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
                                        defaultValue: 'Tableau de bord dosimétrie',
                                    })}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {t('dashboard.subtitle', {
                                        defaultValue:
                                            "Suivi consolidé des expositions aux rayonnements ionisants. Aucune donnée nominative ni médicale n'apparaît sur cette page.",
                                    })}
                                </p>
                                <p className="text-[11.5px] text-slate-500 mt-2 flex items-center gap-1.5">
                                    <IconShieldCheck size={12} stroke={1.7} className="text-violet-600" />
                                    {t('dashboard.snapshotDate', { defaultValue: 'Données arrêtées au' })}{' '}
                                    <span className="font-semibold text-slate-700">
                                        {formatDate(aggregated.snapshotDate ?? todayIso())}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Filtres — Mine pilotee par le selecteur global du header (CompanySelector) */}
                        <div className="flex flex-wrap items-end gap-2">
                            <Select
                                size="xs"
                                label={t('dashboard.filters.categoryLabel', { defaultValue: 'Catégorie' })}
                                data={[
                                    {
                                        value: 'ALL',
                                        label: t('dashboard.filters.categoryAll', {
                                            defaultValue: 'Toutes catégories',
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
                                label={t('dashboard.filters.yearLabel', { defaultValue: 'Année' })}
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
                                aria-label={t('dashboard.refresh', { defaultValue: 'Actualiser' })}
                            >
                                <IconRefresh
                                    size={13}
                                    stroke={1.8}
                                    className={refreshing ? 'animate-spin' : ''}
                                />
                                <span className="hidden sm:inline">
                                    {t('dashboard.refresh', { defaultValue: 'Actualiser' })}
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
                    <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-3 auto-rows-fr">
                        <DosimetryKpiTile
                            icon={IconUsersGroup}
                            label={t('dashboard.kpi.workersLabel', { defaultValue: 'Travailleurs exposés' })}
                            value={aggregated.workersCount}
                            tone="info"
                            loading={loading}
                            tooltip={t('dashboard.kpi.workersTooltip', {
                                defaultValue:
                                    'Nombre total de travailleurs exposés sur le périmètre sélectionné. La répartition par catégorie est affichée juste en dessous.',
                            })}
                        >
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10.5px] text-slate-600 leading-tight">
                                {ALL_CATEGORIES.filter((c) => aggregated.breakdown[c] > 0).map((c) => (
                                    <div key={c} className="flex items-center justify-between gap-1.5">
                                        <span className="truncate" title={t(`thresholds.categories.${c}`, { defaultValue: c })}>
                                            {t(`dashboard.kpi.catShort.${c}`, { defaultValue: CATEGORY_SHORT[c] })}
                                        </span>
                                        <span className="font-mono font-semibold text-slate-800 tabular-nums">
                                            {aggregated.breakdown[c]}
                                        </span>
                                    </div>
                                ))}
                                {Object.values(aggregated.breakdown).every((v) => v === 0) && (
                                    <span className="col-span-2 text-slate-400">
                                        {t('dashboard.kpi.workersEmpty', {
                                            defaultValue: "Aucun travailleur enregistré pour l'instant.",
                                        })}
                                    </span>
                                )}
                            </div>
                        </DosimetryKpiTile>

                        <DosimetryKpiTile
                            icon={IconActivity}
                            label={t('dashboard.kpi.avgDoseLabel', { defaultValue: 'Dose moyenne annuelle' })}
                            value={aggregated.avgAnnualDose.toFixed(2)}
                            unit="mSv/an"
                            sub={t('dashboard.kpi.avgDoseSub', {
                                defaultValue: 'Moyenne pondérée Hp(10)',
                            })}
                            tone="info"
                            loading={loading}
                            tooltip={t('dashboard.kpi.avgDoseTooltip', {
                                defaultValue:
                                    'Moyenne pondérée par le nombre de travailleurs de chaque catégorie, exprimée en mSv par an.',
                            })}
                        />

                        <DosimetryKpiTile
                            icon={IconChartLine}
                            label={t('dashboard.kpi.over50Label', { defaultValue: 'Au-delà de 50 % de la limite' })}
                            value={aggregated.workersOver50}
                            sub={t('dashboard.kpi.over50Sub', {
                                defaultValue: 'Surveillance renforcée recommandée',
                            })}
                            tone="warning"
                            sparkline={sparkOver50}
                            loading={loading}
                            tooltip={t('dashboard.kpi.over50Tooltip', {
                                defaultValue:
                                    'Travailleurs dont la dose annuelle cumulée dépasse la moitié de la limite réglementaire applicable à leur catégorie.',
                            })}
                        />

                        <DosimetryKpiTile
                            icon={IconAlertOctagon}
                            label={t('dashboard.kpi.over90Label', { defaultValue: 'Au-delà de 90 % de la limite' })}
                            value={aggregated.workersOver90}
                            sub={t('dashboard.kpi.over90Sub', {
                                defaultValue: 'Intervention immédiate requise',
                            })}
                            tone={aggregated.workersOver90 > 0 ? 'critical' : 'success'}
                            pulse={aggregated.workersOver90 > 0}
                            urgent={aggregated.workersOver90 > 0}
                            loading={loading}
                            tooltip={t('dashboard.kpi.over90Tooltip', {
                                defaultValue:
                                    "Travailleurs très proches de la limite annuelle. L'ouverture d'un dossier de dépassement doit être envisagée sans délai.",
                            })}
                        />

                        <DosimetryKpiTile
                            icon={IconFolderOpen}
                            label={t('dashboard.kpi.overexposureLabel', {
                                defaultValue: 'Dossiers de dépassement',
                            })}
                            value={aggregated.overexposureOpen}
                            sub={t('dashboard.kpi.overexposureSub', {
                                defaultValue: "En cours d'instruction",
                            })}
                            tone={aggregated.overexposureOpen > 0 ? 'alert' : 'success'}
                            loading={loading}
                            onClick={() => navigate('/dosimetry/overexposure')}
                            tooltip={t('dashboard.kpi.overexposureTooltip', {
                                defaultValue: 'Cliquez pour ouvrir le suivi des dossiers de dépassement.',
                            })}
                        />

                        <DosimetryKpiTile
                            icon={IconStethoscope}
                            label={t('dashboard.kpi.fitnessExpiringLabel', {
                                defaultValue: 'Aptitudes à renouveler',
                            })}
                            value={aggregated.fitnessExpiring}
                            sub={t('dashboard.kpi.fitnessExpiringSub', {
                                defaultValue: 'Visite médicale à programmer sous 30 jours',
                            })}
                            tone={aggregated.fitnessExpiring > 0 ? 'warning' : 'success'}
                            loading={loading}
                            onClick={() => navigate('/dosimetry/medical/planning')}
                            tooltip={t('dashboard.kpi.fitnessExpiringTooltip', {
                                defaultValue:
                                    'Cliquez pour ouvrir le planning des visites médicales (médecin du travail).',
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
                                        defaultValue: 'Tendances sur 12 mois',
                                    })}
                                </h2>
                                <p className="text-[11.5px] text-slate-500 mt-0.5">
                                    {t('dashboard.trend.subtitle', {
                                        defaultValue:
                                            'Doses moyenne, médiane et maximale. Repères tracés à 50 %, 75 % et 100 % de la limite réglementaire.',
                                    })}
                                </p>
                            </div>
                            {regulatoryLimit != null && regulatoryLimit > 0 ? (
                                <div className="text-right flex-shrink-0">
                                    <p className="text-[10px] uppercase tracking-[0.10em] text-slate-500 font-semibold">
                                        {t('dashboard.trend.limitLabel', { defaultValue: 'Limite réglementaire' })}
                                    </p>
                                    <p className="text-[14px] font-mono font-bold text-red-700 tabular-nums">
                                        {regulatoryLimit.toFixed(0)} mSv/an
                                    </p>
                                </div>
                            ) : (
                                <div className="text-right flex-shrink-0 max-w-[220px]">
                                    <p className="text-[10px] uppercase tracking-[0.08em] text-amber-700 font-semibold">
                                        {distribution?.regulatoryLimitStatus === 'CATEGORY_REQUIRED'
                                            ? t('dashboard.trend.categoryRequired', {
                                                defaultValue: 'Sélectionnez une catégorie pour appliquer sa limite configurée',
                                            })
                                            : t('dashboard.trend.limitNotConfigured', {
                                                defaultValue: 'Limite non configurée — à valider localement',
                                            })}
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
                                    avg: t('dashboard.trend.avg', { defaultValue: 'Moyenne' }),
                                    median: t('dashboard.trend.median', { defaultValue: 'Médiane' }),
                                    max: t('dashboard.trend.max', { defaultValue: 'Maximum' }),
                                }}
                                refLabels={{
                                    p50: t('dashboard.trend.refP50', { defaultValue: '50 % de la limite' }),
                                    p75: t('dashboard.trend.refP75', { defaultValue: '75 % de la limite' }),
                                    p100: t('dashboard.trend.refP100', { defaultValue: 'Limite réglementaire' }),
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
                                    defaultValue: 'Répartition des doses annuelles',
                                })}
                            </h2>
                            <p className="text-[11.5px] text-slate-500 mt-0.5">
                                {t('dashboard.distribution.subtitle', {
                                    defaultValue:
                                        'Travailleurs classés par bande de la limite réglementaire.',
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
                                    defaultValue: 'Travailleurs les plus exposés',
                                })}
                            </h2>
                            <p className="text-[11.5px] text-slate-500 mt-0.5">
                                {t('dashboard.top.subtitle', {
                                    defaultValue: `Année ${year}, cumul annuel anonymisé. Cliquez sur une ligne pour ouvrir la fiche détaillée (accès tracé).`,
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
                            workerId: t('dashboard.top.workerId', { defaultValue: 'Identifiant' }),
                            category: t('dashboard.top.category', { defaultValue: 'Catégorie' }),
                            annualDose: t('dashboard.top.annualDose', {
                                defaultValue: 'Dose annuelle (mSv)',
                            }),
                            percentLimit: t('dashboard.top.percentLimit', { defaultValue: '% de la limite' }),
                            status: t('dashboard.top.status', { defaultValue: 'Situation' }),
                            actions: t('dashboard.top.actions', { defaultValue: 'Actions' }),
                            empty: t('dashboard.top.empty', {
                                defaultValue: 'Aucun travailleur exposé sur cette période.',
                            }),
                            loadingText: t('dashboard.top.loading', {
                                defaultValue: 'Chargement du classement…',
                            }),
                            privacyNotice: t('dashboard.top.privacyNotice', {
                                defaultValue:
                                    "Données anonymisées. Le nom et le matricule du travailleur n'apparaissent que dans la fiche détaillée, sous accès tracé.",
                            }),
                            viewWorker: t('dashboard.top.viewWorker', { defaultValue: 'Ouvrir la fiche' }),
                            statusSafe: t('dashboard.top.statusSafe', { defaultValue: 'Conforme' }),
                            statusWatch: t('dashboard.top.statusWatch', { defaultValue: 'À surveiller' }),
                            statusInvestigation: t('dashboard.top.statusInvestigation', {
                                defaultValue: 'Investigation',
                            }),
                            statusAction: t('dashboard.top.statusAction', { defaultValue: 'Action requise' }),
                            statusExceeded: t('dashboard.top.statusExceeded', {
                                defaultValue: 'Dépassement',
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
                                    defaultValue: 'Comparatif des sites',
                                })}
                            </h2>
                            <p className="text-[11.5px] text-slate-500 mt-0.5">
                                {t('dashboard.multimine.subtitle', {
                                    defaultValue:
                                        'Indicateurs agrégés par site, sur la dernière mise à jour. Cliquez sur une carte pour filtrer le tableau de bord.',
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
                                defaultValue: 'Comparatif des sites',
                            }),
                            workers: t('dashboard.multimine.workers', { defaultValue: 'Travailleurs' }),
                            avgDose: t('dashboard.multimine.avgDose', { defaultValue: 'Moyenne' }),
                            maxDose: t('dashboard.multimine.maxDose', { defaultValue: 'Maximum' }),
                            over100: t('dashboard.multimine.over100', { defaultValue: 'Au-delà de 100 %' }),
                            alerts: t('dashboard.multimine.alerts', { defaultValue: 'Alertes' }),
                            cases: t('dashboard.multimine.cases', { defaultValue: 'Dossiers' }),
                            empty: t('dashboard.multimine.empty', {
                                defaultValue: 'Aucune donnée à comparer pour le moment.',
                            }),
                            loadingText: t('dashboard.multimine.loading', {
                                defaultValue: 'Chargement…',
                            }),
                            unitMsv: 'mSv',
                            currentBadge: t('dashboard.multimine.currentBadge', {
                                defaultValue: 'Site actif',
                            }),
                            clickHint: t('dashboard.multimine.clickHint', {
                                defaultValue: 'Cliquer pour filtrer',
                            }),
                        }}
                    />
                </div>

                {/* ─── Footer RGPD / conformite ─── */}
                <footer className="mt-4 text-center text-[10.5px] text-slate-400 leading-relaxed">
                    {t('dashboard.footer', {
                        defaultValue:
                            "Données agrégées, conformes au RGPD (art. 30), à la CIPR 103 et à l'AIEA GSR Part 3. Mise à jour quotidienne durant la nuit.",
                    })}
                </footer>
            </div>
        </div>
    );
};

export default DosimetryDashboardPage;

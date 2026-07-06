/**
 * DoseTrackingPage — Phase 4 Frontend-B (LOT Dosimetrie & Expositions).
 *
 * Page de suivi des doses cote travailleur, alignee sur le pattern SafeX 360
 * premium (cf. ExposedWorkerDetailPage / DosimetersInventoryPage).
 *
 * Route : /dosimetry/doses/by-worker/:workerId
 *
 * Sections :
 *   1. Header worker     : avatar + identite + badges categorie A/B + statut
 *                          special + 4 KPI tiles (annuel, glissant 5y, vie pro,
 *                          nb records annuels) + bouton "Imprimer attestation".
 *   2. Alertes actives   : banner urgent si alertes ACTIVE existent, liste
 *                          detaillee avec bouton "Acquitter" si permission.
 *   3. Tableau doses     : PrimeReact DataTable avec colonnes Periode / HP10 /
 *                          HP007 / HP3 / Source / Date saisie / Saisi par /
 *                          Statut / Actions, filtres (annee, source, statut),
 *                          tri par period DESC.
 *   4. Graphique trend   : Recharts LineChart HP10 mensuel + cumul annuel
 *                          (resets a chaque annee civile) + ReferenceLine =
 *                          limite annuelle (20 mSv pour Cat A, 6 mSv pour B).
 *   5. Cumuls gauges     : 3 gauge cards (annuel / 5y / vie pro) avec couleurs
 *                          vert / jaune / orange / rouge selon ratio, tooltip
 *                          valeurs exactes + limite.
 *   6. Footer            : bouton "Nouvelle saisie" -> /dosimetry/doses/new?workerId=X
 *                          + mention confidentialite ISO 27001 / RGPD / CIPR.
 *
 * Donnees fetchees :
 *   - getActiveDoseRecordsByWorker(workerId) : historique append-only actif.
 *   - getWorkerDetail(workerId)               : identite + cumuls + alertes +
 *                                               thresholds + classification.
 *
 * RBAC :
 *   - "Acquitter" alerte    -> DOSIMETRY_PCR_RPO
 *   - "Modifier" record     -> DOSIMETRY_WRITE
 *
 * Contraintes :
 *   - tsc strict + vite EXIT 0.
 *   - i18n FR + EN via namespace `dosimetry` -> bloc `doseTracking`.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
    IconArrowLeft,
    IconChevronRight,
    IconPrinter,
    IconUserCircle,
    IconChartLine,
    IconAlertTriangle,
    IconAlertOctagon,
    IconInfoCircle,
    IconPlus,
    IconEye,
    IconPencil,
    IconHistory,
    IconLockAccess,
    IconCircleCheck,
    IconFilter,
    IconRotate2,
} from '@tabler/icons-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip as RTooltip,
    CartesianGrid,
    ReferenceLine,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useAppSelector } from '../../slices/hooks';
import { successNotification, errorNotification, extractErrorMessage } from '../../utility/NotificationUtility';
import {
    getActiveDoseRecordsByWorker,
    getWorkerDetail,
    updateAlert,
    type DoseRecordDTO,
    type DoseCategory,
    type DoseSource,
    type AlertLevel,
    type ExposedWorkerDetailDTO,
    type ExposureAlertDTO,
    type ThresholdDTO,
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
//  Formatters
// ─────────────────────────────────────────────────────────────────────────────

const formatMsv = (v: number | null | undefined): string => {
    if (v == null || Number.isNaN(v)) return '—';
    return v.toFixed(2);
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

const formatDateTime = (s?: string | null): string => {
    if (!s) return '—';
    try {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return s;
        return d.toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return s;
    }
};

const initialsOf = (fullName?: string | null): string => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/).slice(0, 2);
    const init = parts.map((p) => p[0] ?? '').join('').toUpperCase();
    return init || '?';
};

/** Extrait l'annee d'une cle period YYYY-MM ou YYYY-MM-DD. */
const yearOfPeriod = (period?: string | null): number | null => {
    if (!period) return null;
    const m = period.match(/^(\d{4})/);
    return m ? Number(m[1]) : null;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Gauge tone & threshold resolver — aligne sur ExposedWorkerDetailPage
// ─────────────────────────────────────────────────────────────────────────────

type GaugeTone = {
    ring: string;
    bar: string;
    text: string;
    bg: string;
    border: string;
    badge: string;
};

function gaugeTone(ratio: number): GaugeTone {
    if (ratio == null || Number.isNaN(ratio)) {
        return {
            ring: 'ring-green-200',
            bar: 'bg-gradient-to-r from-green-500 to-emerald-600',
            text: 'text-green-700',
            bg: 'bg-green-50',
            border: 'border-green-200',
            badge: 'bg-green-100 text-green-800',
        };
    }
    if (ratio >= 1.0) {
        return {
            ring: 'ring-red-200',
            bar: 'bg-gradient-to-r from-red-500 to-red-600',
            text: 'text-red-700',
            bg: 'bg-red-50',
            border: 'border-red-200',
            badge: 'bg-red-100 text-red-800',
        };
    }
    if (ratio >= 0.75) {
        return {
            ring: 'ring-orange-200',
            bar: 'bg-gradient-to-r from-orange-500 to-orange-600',
            text: 'text-orange-700',
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            badge: 'bg-orange-100 text-orange-800',
        };
    }
    if (ratio >= 0.5) {
        return {
            ring: 'ring-yellow-200',
            bar: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
            text: 'text-yellow-700',
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            badge: 'bg-yellow-100 text-yellow-800',
        };
    }
    return {
        ring: 'ring-green-200',
        bar: 'bg-gradient-to-r from-green-500 to-emerald-600',
        text: 'text-green-700',
        bg: 'bg-green-50',
        border: 'border-green-200',
        badge: 'bg-green-100 text-green-800',
    };
}

/** Resoud la limite reglementaire Hp(10) annuelle. */
function resolveHp10AnnualLimit(
    thresholds: ThresholdDTO[] | undefined,
    category: DoseCategory,
): number {
    if (thresholds && thresholds.length > 0) {
        const hp10 = thresholds.find((t) => t.grandeur === 'HP10');
        if (hp10?.regulatoryLimit != null && hp10.regulatoryLimit > 0) {
            return hp10.regulatoryLimit;
        }
    }
    return category === 'A' ? 20 : 6;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Filtres locaux
// ─────────────────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'ACTIVE' | 'SUPERSEDED' | 'DRAFT';
type RecordUiStatus = 'ACTIVE' | 'SUPERSEDED' | 'DRAFT';

interface DoseFilters {
    year: 'all' | number;
    sources: DoseSource[];
    status: StatusFilter;
}

/**
 * Derive le statut UI d'un record :
 *   - DRAFT      : flag implicite (recordedAt null + version <= 0)
 *   - SUPERSEDED : presence de supersededRecordId
 *   - ACTIVE     : par defaut.
 *
 * Remarque : l'endpoint getActiveDoseRecordsByWorker filtre deja les records
 * superseded cote backend, mais on conserve cette projection pour rester
 * coherent si le caller affiche aussi les versions historiques.
 */
function deriveRecordStatus(r: DoseRecordDTO): RecordUiStatus {
    if (r.supersededRecordId != null) return 'SUPERSEDED';
    if (r.recordedAt == null && (r.version ?? 0) <= 0) return 'DRAFT';
    return 'ACTIVE';
}

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const DoseTrackingPage = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const { workerId } = useParams<{ workerId: string }>();
    const user = useAppSelector((state: any) => state.user);

    const canEditDose = hasDosimetryPermission(user, 'DOSIMETRY_WRITE');
    const canAckAlert = hasDosimetryPermission(user, 'DOSIMETRY_PCR_RPO');

    const [detail, setDetail] = useState<ExposedWorkerDetailDTO | null>(null);
    const [activeRecords, setActiveRecords] = useState<DoseRecordDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [acking, setAcking] = useState<number | null>(null);
    const [localAlerts, setLocalAlerts] = useState<ExposureAlertDTO[]>([]);

    const [filters, setFilters] = useState<DoseFilters>({
        year: 'all',
        sources: [],
        status: 'all',
    });

    // ── Chargement ──
    useEffect(() => {
        if (!workerId) {
            setLoading(false);
            setLoadError(t('doseTracking.noWorkerId'));
            return;
        }
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getWorkerDetail(workerId).catch(() => null),
            getActiveDoseRecordsByWorker(workerId).catch(() => []),
        ])
            .then(([detailData, records]) => {
                if (cancelled) return;
                if (detailData && (detailData as ExposedWorkerDetailDTO).identity) {
                    setDetail(detailData as ExposedWorkerDetailDTO);
                    setLocalAlerts((detailData as ExposedWorkerDetailDTO).alerts ?? []);
                    setLoadError(null);
                } else {
                    setDetail(null);
                    setLocalAlerts([]);
                    setLoadError(t('doseTracking.loadError'));
                }
                const list: DoseRecordDTO[] = Array.isArray(records)
                    ? (records as DoseRecordDTO[])
                    : ((records as any)?.content ?? []);
                setActiveRecords(list);
            })
            .catch(() => {
                if (cancelled) return;
                setDetail(null);
                setActiveRecords([]);
                setLocalAlerts([]);
                setLoadError(t('doseTracking.loadError'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [workerId, t]);

    // ── Donnees derivees ──
    const fullName = detail?.identity?.fullName ?? '—';
    const matricule = detail?.identity?.matricule ?? `#${detail?.identity?.employeeId ?? ''}`;
    const category: DoseCategory = detail?.classification?.category ?? 'B';
    const specialStatus = detail?.classification?.specialStatus ?? null;
    const isPregnancy = specialStatus === 'PREGNANCY';
    const isApprentice = specialStatus === 'APPRENTICE';

    const annualLimitHp10 = useMemo(
        () => resolveHp10AnnualLimit(detail?.thresholds, category),
        [detail, category],
    );

    const currentYear = new Date().getFullYear();
    const cumulative = detail?.cumulative;

    /** Lignes filtrees pour la table. */
    const filteredRows = useMemo(() => {
        const rows = activeRecords ?? [];
        return rows
            .filter((r) => {
                if (filters.year !== 'all') {
                    const y = yearOfPeriod(r.period);
                    if (y !== filters.year) return false;
                }
                if (filters.sources.length > 0 && !filters.sources.includes(r.source)) {
                    return false;
                }
                if (filters.status !== 'all') {
                    if (deriveRecordStatus(r) !== filters.status) return false;
                }
                return true;
            })
            .sort((a, b) => (b.period ?? '').localeCompare(a.period ?? ''));
    }, [activeRecords, filters]);

    /** Annees presentes dans les records pour le Select. */
    const yearOptions = useMemo(() => {
        const set = new Set<number>();
        (activeRecords ?? []).forEach((r) => {
            const y = yearOfPeriod(r.period);
            if (y != null) set.add(y);
        });
        return Array.from(set).sort((a, b) => b - a);
    }, [activeRecords]);

    /** Nombre de records pour l'annee en cours. */
    const recordsThisYear = useMemo(() => {
        return (activeRecords ?? []).filter((r) => yearOfPeriod(r.period) === currentYear).length;
    }, [activeRecords, currentYear]);

    /**
     * Donnees pour le LineChart : Hp(10) mensuel + cumul annuel.
     * Le cumul reset a chaque changement d'annee civile.
     */
    const trendData = useMemo(() => {
        const sorted = [...(activeRecords ?? [])].sort((a, b) =>
            (a.period ?? '').localeCompare(b.period ?? ''),
        );
        let lastYear: number | null = null;
        let cumulYear = 0;
        return sorted.map((r) => {
            const y = yearOfPeriod(r.period);
            if (lastYear == null || y !== lastYear) {
                cumulYear = 0;
                lastYear = y;
            }
            const monthly = r.hp10 ?? 0;
            cumulYear += monthly;
            return {
                period: r.period ?? '',
                monthly: Number(monthly.toFixed(3)),
                cumul: Number(cumulYear.toFixed(3)),
            };
        });
    }, [activeRecords]);

    // ── Handlers ──
    const handleAckAlert = async (alert: ExposureAlertDTO) => {
        if (!canAckAlert || alert.id == null) return;
        setAcking(alert.id);
        try {
            const payload: ExposureAlertDTO = {
                ...alert,
                status: 'ACK',
                acknowledgedAt: new Date().toISOString(),
            };
            await updateAlert(payload);
            setLocalAlerts((prev) => prev.map((a) => (a.id === alert.id ? payload : a)));
            successNotification(t('doseTracking.alerts.ackSuccess'));
        } catch (err) {
            errorNotification(extractErrorMessage(err, t('doseTracking.alerts.ackError')));
        } finally {
            setAcking(null);
        }
    };

    const handleNewEntry = () => {
        navigate(`/dosimetry/doses/new?workerId=${workerId}`);
    };

    const handleEditRecord = (r: DoseRecordDTO) => {
        if (r.id != null) navigate(`/dosimetry/doses/edit/${r.id}`);
    };

    const handleViewVersions = (r: DoseRecordDTO) => {
        if (r.id != null) {
            // Ouvrira la modale versions superseded dans une iteration suivante.
            // Pour l'instant, on route vers la fiche detail (qui inclura un onglet versions).
            navigate(`/dosimetry/doses/edit/${r.id}`);
        }
    };

    // ── Loading & erreur ──
    if (loading) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-10 text-center">
                <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-2 align-middle" />
                <span className="text-[13px] text-slate-600">{t('doseTracking.loading')}</span>
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-10 text-center">
                <p className="text-[14px] text-slate-700">
                    {loadError ?? t('doseTracking.notFound')}
                </p>
                <button
                    type="button"
                    onClick={() => navigate('/dosimetry/workers')}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                >
                    <IconArrowLeft size={13} stroke={1.8} />
                    {t('doseTracking.actions.back')}
                </button>
            </div>
        );
    }

    const activeOnlyAlerts = (localAlerts ?? []).filter((a) => a.status === 'ACTIVE');

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">
                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('doseTracking.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/workers')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-600 transition"
                    >
                        {t('doseTracking.breadcrumbParent')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('doseTracking.breadcrumbCurrent')}
                    </span>
                </div>

                {/* ─── Banner erreur non bloquante ─── */}
                {loadError && (
                    <div
                        className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]"
                        role="alert"
                    >
                        <IconAlertTriangle size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{loadError}</span>
                    </div>
                )}

                {/* ─── Banner alertes actives (urgent) ─── */}
                {activeOnlyAlerts.length > 0 && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 via-red-50 to-orange-50 px-4 py-3 shadow-sm">
                        <div className="flex items-start gap-3">
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-red-100 text-red-700 flex-shrink-0">
                                <IconAlertOctagon size={18} stroke={1.8} />
                            </span>
                            <div className="flex-1">
                                <p className="text-[13.5px] font-semibold text-red-800">
                                    {t('doseTracking.alerts.bannerTitle', {
                                        count: activeOnlyAlerts.length,
                                    })}
                                </p>
                                <p className="text-[12px] text-red-700 mt-0.5">
                                    {t('doseTracking.alerts.bannerSubtitle')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Header worker ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            {/* Avatar + identite */}
                            <div className="flex items-start gap-4 min-w-0 flex-1">
                                <div
                                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0"
                                    aria-hidden="true"
                                >
                                    <span className="text-white font-semibold text-[19px] tracking-wide">
                                        {initialsOf(detail.identity.fullName)}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h1
                                            className="text-slate-900 leading-tight"
                                            style={{
                                                fontFamily: "'Source Serif 4', Georgia, serif",
                                                fontWeight: 600,
                                                fontSize: 'clamp(20px, 2.2vw, 26px)',
                                                letterSpacing: '-0.02em',
                                            }}
                                        >
                                            {fullName}
                                        </h1>
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                                category === 'A'
                                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                            }`}
                                            aria-label={t('doseTracking.header.categoryAria', {
                                                category,
                                            })}
                                        >
                                            {category}
                                        </span>
                                        {isPregnancy && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border bg-pink-50 text-pink-700 border-pink-200">
                                                {t('doseTracking.header.pregnancy')}
                                            </span>
                                        )}
                                        {isApprentice && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border bg-cyan-50 text-cyan-700 border-cyan-200">
                                                {t('doseTracking.header.apprentice')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[12.5px] text-slate-600 mt-1">
                                        <span className="font-mono text-slate-800 font-medium">
                                            {matricule}
                                        </span>
                                        {detail.identity.position && (
                                            <>
                                                <span className="mx-2 text-slate-400">•</span>
                                                {detail.identity.position}
                                            </>
                                        )}
                                        {detail.identity.department && (
                                            <>
                                                <span className="mx-2 text-slate-400">•</span>
                                                {detail.identity.department}
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Actions header */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            `/dosimetry/workers/detail/${detail.identity.workerId}`,
                                        )
                                    }
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
                                >
                                    <IconArrowLeft size={13} stroke={1.8} />
                                    {t('doseTracking.actions.back')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md bg-slate-800 text-white hover:bg-slate-900 transition shadow-sm"
                                >
                                    <IconPrinter size={13} stroke={1.8} />
                                    {t('doseTracking.actions.printCertificate')}
                                </button>
                            </div>
                        </div>

                        {/* 4 KPI tiles */}
                        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <KpiTile
                                label={t('doseTracking.kpi.annualHp10')}
                                sublabel={t('doseTracking.kpi.annualHp10Sub', {
                                    year: currentYear,
                                })}
                                value={cumulative?.annualHp10 ?? null}
                                ratio={
                                    cumulative?.annualHp10 != null && annualLimitHp10 > 0
                                        ? cumulative.annualHp10 / annualLimitHp10
                                        : null
                                }
                                limit={annualLimitHp10}
                                t={t}
                                showRatio
                            />
                            <KpiTile
                                label={t('doseTracking.kpi.rolling5y')}
                                sublabel={t('doseTracking.kpi.rolling5ySub')}
                                value={cumulative?.rolling5yHp10 ?? null}
                                ratio={
                                    cumulative?.rolling5yHp10 != null
                                        ? cumulative.rolling5yHp10 / 100
                                        : null
                                }
                                limit={100}
                                t={t}
                                showRatio
                            />
                            <KpiTile
                                label={t('doseTracking.kpi.lifetime')}
                                sublabel={t('doseTracking.kpi.lifetimeSub')}
                                value={cumulative?.lifetimeHp10 ?? null}
                                ratio={
                                    cumulative?.lifetimeHp10 != null
                                        ? cumulative.lifetimeHp10 / 400
                                        : null
                                }
                                limit={400}
                                t={t}
                                showRatio
                            />
                            <KpiTile
                                label={t('doseTracking.kpi.recordsCount')}
                                sublabel={t('doseTracking.kpi.recordsCountSub')}
                                value={recordsThisYear}
                                ratio={null}
                                limit={0}
                                t={t}
                                showRatio={false}
                                rawNumber
                            />
                        </div>
                    </div>
                </div>

                {/* ─── Section alertes (liste detaillee) ─── */}
                {activeOnlyAlerts.length > 0 && (
                    <Card
                        title={t('doseTracking.alerts.bannerTitle', {
                            count: activeOnlyAlerts.length,
                        })}
                        icon={<IconAlertTriangle size={14} stroke={1.8} />}
                        tone="red"
                    >
                        <ul className="space-y-2">
                            {activeOnlyAlerts.map((a) => (
                                <AlertRow
                                    key={a.id ?? `${a.workerId}-${a.triggeredAt}`}
                                    alert={a}
                                    canAck={canAckAlert}
                                    onAck={() => handleAckAlert(a)}
                                    busy={acking === a.id}
                                    t={t}
                                />
                            ))}
                        </ul>
                    </Card>
                )}

                {/* ─── Filtres + tableau ─── */}
                <Card
                    title={t('doseTracking.table.title')}
                    icon={<IconChartLine size={14} stroke={1.8} />}
                >
                    <p className="text-[12px] text-slate-500 mb-3">
                        {t('doseTracking.table.subtitle')}
                    </p>

                    {/* Filter toolbar */}
                    <div className="mb-3 flex flex-wrap items-center gap-2 px-2 py-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 mr-1">
                            <IconFilter size={12} stroke={1.8} />
                        </span>
                        {/* Annee */}
                        <FilterSelect
                            ariaLabel={t('doseTracking.filters.year')}
                            value={filters.year === 'all' ? 'all' : String(filters.year)}
                            onChange={(v) =>
                                setFilters((f) => ({
                                    ...f,
                                    year: v === 'all' ? 'all' : Number(v),
                                }))
                            }
                            options={[
                                { value: 'all', label: t('doseTracking.filters.allYears') },
                                ...yearOptions.map((y) => ({ value: String(y), label: String(y) })),
                            ]}
                        />

                        {/* Statut */}
                        <FilterSelect
                            ariaLabel={t('doseTracking.filters.status')}
                            value={filters.status}
                            onChange={(v) =>
                                setFilters((f) => ({ ...f, status: v as StatusFilter }))
                            }
                            options={[
                                { value: 'all', label: t('doseTracking.filters.allStatuses') },
                                { value: 'ACTIVE', label: t('doseTracking.table.status.ACTIVE') },
                                {
                                    value: 'SUPERSEDED',
                                    label: t('doseTracking.table.status.SUPERSEDED'),
                                },
                                { value: 'DRAFT', label: t('doseTracking.table.status.DRAFT') },
                            ]}
                        />

                        {/* Source multi — boutons toggle */}
                        <div className="flex items-center gap-1 flex-wrap">
                            {(['AGENCY', 'EPD', 'ESTIMATED'] as DoseSource[]).map((src) => {
                                const active = filters.sources.includes(src);
                                return (
                                    <button
                                        key={src}
                                        type="button"
                                        onClick={() =>
                                            setFilters((f) => ({
                                                ...f,
                                                sources: active
                                                    ? f.sources.filter((s) => s !== src)
                                                    : [...f.sources, src],
                                            }))
                                        }
                                        className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium border transition ${
                                            active
                                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        {t(`doseTracking.table.source.${src}`, {
                                            defaultValue: src,
                                        })}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setFilters({ year: 'all', sources: [], status: 'all' })
                            }
                            className="ml-auto inline-flex items-center gap-1 px-2 py-1 text-[11px] text-slate-600 hover:text-indigo-600 transition"
                        >
                            <IconRotate2 size={11} stroke={1.8} />
                            {t('doseTracking.filters.reset')}
                        </button>
                    </div>

                    <DataTable
                        value={filteredRows}
                        dataKey="id"
                        size="small"
                        stripedRows
                        paginator
                        rows={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        responsiveLayout="scroll"
                        emptyMessage={
                            <p className="py-6 text-center text-[12.5px] text-slate-500">
                                {t('doseTracking.table.empty')}
                            </p>
                        }
                        className="text-[12.5px]"
                        sortField="period"
                        sortOrder={-1}
                    >
                        <Column
                            field="period"
                            header={t('doseTracking.table.cols.period')}
                            sortable
                            style={{ minWidth: 110 }}
                            body={(r: DoseRecordDTO) => (
                                <span className="font-mono text-[12px] font-medium text-slate-800">
                                    {r.period ?? '—'}
                                </span>
                            )}
                        />
                        <Column
                            field="hp10"
                            header={t('doseTracking.table.cols.hp10')}
                            sortable
                            align="right"
                            style={{ width: 110 }}
                            body={(r: DoseRecordDTO) => (
                                <span className="font-mono tabular-nums">
                                    {formatMsv(r.hp10)}{' '}
                                    <span className="text-slate-400 text-[10px]">
                                        {t('doseTracking.kpi.msvUnit')}
                                    </span>
                                </span>
                            )}
                        />
                        <Column
                            field="hp007"
                            header={t('doseTracking.table.cols.hp007')}
                            sortable
                            align="right"
                            style={{ width: 110 }}
                            body={(r: DoseRecordDTO) => (
                                <span className="font-mono tabular-nums">
                                    {formatMsv(r.hp007)}{' '}
                                    <span className="text-slate-400 text-[10px]">
                                        {t('doseTracking.kpi.msvUnit')}
                                    </span>
                                </span>
                            )}
                        />
                        <Column
                            field="hp3"
                            header={t('doseTracking.table.cols.hp3')}
                            sortable
                            align="right"
                            style={{ width: 110 }}
                            body={(r: DoseRecordDTO) => (
                                <span className="font-mono tabular-nums">
                                    {formatMsv(r.hp3)}{' '}
                                    <span className="text-slate-400 text-[10px]">
                                        {t('doseTracking.kpi.msvUnit')}
                                    </span>
                                </span>
                            )}
                        />
                        <Column
                            field="source"
                            header={t('doseTracking.table.cols.source')}
                            sortable
                            style={{ width: 110 }}
                            body={(r: DoseRecordDTO) => (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-slate-50 border border-slate-200 text-slate-700">
                                    {t(`doseTracking.table.source.${r.source}`, {
                                        defaultValue: r.source,
                                    })}
                                </span>
                            )}
                        />
                        <Column
                            field="recordedAt"
                            header={t('doseTracking.table.cols.recordedAt')}
                            sortable
                            style={{ minWidth: 150 }}
                            body={(r: DoseRecordDTO) => formatDateTime(r.recordedAt)}
                        />
                        <Column
                            field="recordedBy"
                            header={t('doseTracking.table.cols.recordedBy')}
                            sortable
                            style={{ width: 110 }}
                            body={(r: DoseRecordDTO) =>
                                r.recordedBy != null ? (
                                    <span className="font-mono text-[11.5px] text-slate-600">
                                        #{r.recordedBy}
                                    </span>
                                ) : (
                                    <span className="text-slate-400">—</span>
                                )
                            }
                        />
                        <Column
                            header={t('doseTracking.table.cols.status')}
                            style={{ width: 120 }}
                            body={(r: DoseRecordDTO) => {
                                const s = deriveRecordStatus(r);
                                const tone: Record<RecordUiStatus, string> = {
                                    ACTIVE: 'bg-green-50 text-green-700 border-green-200',
                                    SUPERSEDED: 'bg-slate-100 text-slate-600 border-slate-200',
                                    DRAFT: 'bg-orange-50 text-orange-700 border-orange-200',
                                };
                                return (
                                    <span
                                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold border ${tone[s]}`}
                                    >
                                        {t(`doseTracking.table.status.${s}`, { defaultValue: s })}
                                    </span>
                                );
                            }}
                        />
                        <Column
                            header={t('doseTracking.table.cols.actions')}
                            style={{ width: 140 }}
                            body={(r: DoseRecordDTO) => (
                                <div className="flex items-center gap-1">
                                    <IconBtn
                                        onClick={() => handleViewVersions(r)}
                                        title={t('doseTracking.actions.viewDetails')}
                                        icon={<IconEye size={12} stroke={1.8} />}
                                    />
                                    {canEditDose && (
                                        <IconBtn
                                            onClick={() => handleEditRecord(r)}
                                            title={t('doseTracking.actions.edit')}
                                            icon={<IconPencil size={12} stroke={1.8} />}
                                        />
                                    )}
                                    {r.version != null && r.version > 1 && (
                                        <IconBtn
                                            onClick={() => handleViewVersions(r)}
                                            title={t('doseTracking.actions.viewVersions')}
                                            icon={<IconHistory size={12} stroke={1.8} />}
                                        />
                                    )}
                                </div>
                            )}
                        />
                    </DataTable>
                </Card>

                {/* ─── Trend Recharts ─── */}
                <Card
                    title={t('doseTracking.trend.title')}
                    icon={<IconChartLine size={14} stroke={1.8} />}
                >
                    <p className="text-[12px] text-slate-500 mb-3">
                        {t('doseTracking.trend.subtitle')}
                    </p>
                    {trendData.length === 0 ? (
                        <p className="py-6 text-center text-[12.5px] text-slate-500">
                            {t('doseTracking.trend.empty')}
                        </p>
                    ) : (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart
                                    data={trendData}
                                    margin={{ top: 5, right: 24, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="period"
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        stroke="#cbd5e1"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        stroke="#cbd5e1"
                                        label={{
                                            value: t('doseTracking.trend.axisDose'),
                                            angle: -90,
                                            position: 'insideLeft',
                                            style: { fontSize: 11, fill: '#64748b' },
                                        }}
                                    />
                                    <RTooltip
                                        contentStyle={{
                                            background: 'white',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                        formatter={(v: number | string, n: string) => {
                                            const label =
                                                n === 'monthly'
                                                    ? t('doseTracking.trend.tooltipMonthly')
                                                    : t('doseTracking.trend.tooltipCumul');
                                            return [`${v} mSv`, label];
                                        }}
                                        labelFormatter={(label: string) =>
                                            `${t('doseTracking.trend.tooltipPeriod')} : ${label}`
                                        }
                                    />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                    <ReferenceLine
                                        y={annualLimitHp10}
                                        stroke="#dc2626"
                                        strokeDasharray="4 4"
                                        label={{
                                            value: `${t('doseTracking.trend.limit')} (${annualLimitHp10} mSv)`,
                                            position: 'right',
                                            fontSize: 10,
                                            fill: '#dc2626',
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="monthly"
                                        name={t('doseTracking.trend.monthly')}
                                        stroke="#94a3b8"
                                        strokeWidth={1.5}
                                        strokeDasharray="3 3"
                                        dot={{ r: 2, fill: '#94a3b8' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="cumul"
                                        name={t('doseTracking.trend.cumulative')}
                                        stroke="#6366f1"
                                        strokeWidth={2.5}
                                        dot={{ r: 3, fill: '#6366f1' }}
                                        activeDot={{ r: 5 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>

                {/* ─── Cumuls — 3 gauges ─── */}
                <Card
                    title={t('doseTracking.cumuls.title')}
                    icon={<IconChartLine size={14} stroke={1.8} />}
                >
                    <p className="text-[12px] text-slate-500 mb-3">
                        {t('doseTracking.cumuls.subtitle')}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <GaugeCard
                            title={t('doseTracking.cumuls.annual')}
                            subtitle={t('doseTracking.cumuls.annualSub')}
                            value={cumulative?.annualHp10 ?? null}
                            limit={annualLimitHp10}
                            t={t}
                        />
                        <GaugeCard
                            title={t('doseTracking.cumuls.rolling5y')}
                            subtitle={t('doseTracking.cumuls.rolling5ySub')}
                            value={cumulative?.rolling5yHp10 ?? null}
                            limit={100}
                            t={t}
                        />
                        <GaugeCard
                            title={t('doseTracking.cumuls.lifetime')}
                            subtitle={t('doseTracking.cumuls.lifetimeSub')}
                            value={cumulative?.lifetimeHp10 ?? null}
                            limit={400}
                            t={t}
                        />
                    </div>
                </Card>

                {/* ─── Footer ─── */}
                <div className="mt-6 flex flex-wrap items-stretch gap-3">
                    <button
                        type="button"
                        onClick={handleNewEntry}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 transition shadow-sm font-medium"
                    >
                        <IconPlus size={14} stroke={2} />
                        {t('doseTracking.actions.newEntry')}
                    </button>
                    <div className="flex-1 min-w-[260px] bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-3 flex items-start gap-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 text-indigo-700 flex-shrink-0">
                            <IconInfoCircle size={15} stroke={1.8} />
                        </span>
                        <div className="text-[12.5px] text-slate-700 leading-relaxed">
                            <p className="font-medium text-slate-800 mb-0.5">
                                {t('doseTracking.footer.title')}
                            </p>
                            <p>{t('doseTracking.footer.note')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

function Card({
    title,
    icon,
    children,
    tone,
}: {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    tone?: 'red' | 'default';
}) {
    const isRed = tone === 'red';
    return (
        <section
            className={`rounded-xl shadow-sm p-4 mb-4 border ${
                isRed ? 'bg-red-50/60 border-red-200' : 'bg-white border-slate-200'
            }`}
        >
            <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    {icon && (
                        <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-md border ${
                                isRed
                                    ? 'bg-red-100 text-red-700 border-red-200'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                            }`}
                        >
                            {icon}
                        </span>
                    )}
                    <h2
                        className={`text-[13.5px] font-semibold tracking-tight ${
                            isRed ? 'text-red-800' : 'text-slate-800'
                        }`}
                    >
                        {title}
                    </h2>
                </div>
            </div>
            {children}
        </section>
    );
}

function KpiTile({
    label,
    sublabel,
    value,
    ratio,
    limit,
    t,
    showRatio,
    rawNumber,
}: {
    label: string;
    sublabel: string;
    value: number | null;
    ratio: number | null;
    limit: number;
    t: (k: string, o?: any) => string;
    showRatio: boolean;
    rawNumber?: boolean;
}) {
    const tone = gaugeTone(ratio ?? 0);
    const display = value == null ? '—' : rawNumber ? String(value) : formatMsv(value);
    return (
        <div className={`rounded-xl border ${tone.border} ${tone.bg} px-3 py-3`}>
            <p className={`text-[11px] uppercase tracking-[0.12em] ${tone.text} font-semibold`}>
                {label}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{sublabel}</p>
            <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                <span className="text-[22px] font-mono font-bold text-slate-800 tabular-nums leading-none">
                    {display}
                </span>
                {!rawNumber && (
                    <span className="text-[11px] text-slate-500">
                        / {limit.toFixed(0)} {t('doseTracking.kpi.msvUnit')}
                    </span>
                )}
            </div>
            {showRatio && ratio != null && (
                <p className={`mt-2 text-[11px] font-medium ${tone.text}`}>
                    {t('doseTracking.kpi.ratioOfLimit', {
                        pct: (ratio * 100).toFixed(1),
                    })}
                </p>
            )}
        </div>
    );
}

function GaugeCard({
    title,
    subtitle,
    value,
    limit,
    t,
}: {
    title: string;
    subtitle: string;
    value: number | null;
    limit: number;
    t: (k: string, o?: any) => string;
}) {
    const ratio = value == null || limit <= 0 ? 0 : Math.min(value / limit, 1.2);
    const pct = Math.min(ratio * 100, 100);
    const tone = gaugeTone(ratio);
    const tooltipValue = t('doseTracking.cumuls.tooltipValue', { value: formatMsv(value) });
    const tooltipLimit = t('doseTracking.cumuls.tooltipLimit', { limit: limit.toFixed(0) });
    return (
        <div
            className={`relative rounded-xl border ${tone.border} ${tone.bg} p-3 ring-1 ${tone.ring}`}
            title={`${tooltipValue} — ${tooltipLimit}`}
        >
            <p className={`text-[11px] uppercase tracking-[0.12em] ${tone.text} font-semibold`}>
                {title}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>
            <div className="mt-3 flex items-baseline gap-2">
                <span className="text-[22px] font-mono font-bold text-slate-800 tabular-nums leading-none">
                    {formatMsv(value)}
                </span>
                <span className="text-[11px] text-slate-500">
                    / {limit.toFixed(0)} {t('doseTracking.kpi.msvUnit')}
                </span>
            </div>
            <div className="mt-3 h-2 bg-white/70 rounded overflow-hidden border border-slate-200">
                <div
                    className={`h-full ${tone.bar} transition-all`}
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={Math.round(pct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                />
            </div>
            <p className={`mt-1.5 text-[11px] font-medium ${tone.text}`}>
                {(ratio * 100).toFixed(1)} %
            </p>
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
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <select
            aria-label={ariaLabel}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="px-2 py-1 text-[11.5px] bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
        >
            {options.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    );
}

function IconBtn({
    onClick,
    title,
    icon,
}: {
    onClick: () => void;
    title: string;
    icon: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            aria-label={title}
            className="inline-flex items-center justify-center w-6 h-6 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition"
        >
            {icon}
        </button>
    );
}

function AlertRow({
    alert,
    canAck,
    onAck,
    busy,
    t,
}: {
    alert: ExposureAlertDTO;
    canAck: boolean;
    onAck: () => void;
    busy: boolean;
    t: (k: string, o?: any) => string;
}) {
    const tone: Record<AlertLevel, string> = {
        APPROACH: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        INVESTIGATION: 'bg-orange-50 text-orange-800 border-orange-200',
        ACTION: 'bg-red-50 text-red-800 border-red-200',
        EXCEEDED: 'bg-red-100 text-red-900 border-red-300',
    };
    const icon =
        alert.level === 'APPROACH' || alert.level === 'INVESTIGATION'
            ? IconAlertTriangle
            : IconAlertOctagon;
    const Icon = icon;
    const isAcked = alert.status === 'ACK' || alert.status === 'RESOLVED';

    return (
        <li className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border ${tone[alert.level]}`}>
            <div className="flex items-center gap-2 min-w-0">
                <Icon size={14} stroke={1.8} className="flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                    <span className="text-[12.5px] font-semibold truncate">
                        {t(`doseTracking.alerts.level.${alert.level}`, {
                            defaultValue: alert.level,
                        })}
                        <span className="ml-2 font-mono text-[11px] font-normal opacity-80">
                            {alert.grandeur} — {t('doseTracking.alerts.valueLabel')} {alert.value}
                        </span>
                    </span>
                    <span className="text-[10.5px] text-slate-600">
                        {t('doseTracking.alerts.triggeredAt')} {formatDate(alert.triggeredAt)}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                {isAcked ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md bg-white border border-slate-200 text-slate-600">
                        <IconCircleCheck size={12} stroke={1.8} className="text-green-600" />
                        {alert.status}
                    </span>
                ) : (
                    <button
                        type="button"
                        onClick={onAck}
                        disabled={!canAck || busy}
                        title={
                            canAck
                                ? t('doseTracking.actions.acknowledge')
                                : t('doseTracking.alerts.acknowledgeDenied')
                        }
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {busy ? (
                            <span className="inline-block w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                        ) : canAck ? (
                            <IconCircleCheck size={12} stroke={1.8} />
                        ) : (
                            <IconLockAccess size={12} stroke={1.8} />
                        )}
                        {t('doseTracking.actions.acknowledge')}
                    </button>
                )}
            </div>
        </li>
    );
}

export default DoseTrackingPage;

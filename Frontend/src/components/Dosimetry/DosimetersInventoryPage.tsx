import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    IconDeviceWatch,
    IconChevronRight,
    IconSearch,
    IconPlus,
    IconPencil,
    IconQrcode,
    IconScan,
    IconCalendarTime,
    IconCalendarExclamation,
    IconAlertOctagon,
    IconAlertTriangle,
    IconCircleCheck,
    IconInfoCircle,
    IconFilter,
    IconX,
    IconUser,
    IconReceipt,
    IconArrowBackUp,
    IconBookmark,
    IconClockHour4,
    IconHistory,
} from '@tabler/icons-react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useAppSelector } from '../../slices/hooks';
import {
    getAllDosimeters,
    type DosimeterDTO,
    type DosimeterStatus,
    type DosimeterType,
} from '../../services/DosimetryService';

/**
 * DosimetersInventoryPage — Module Dosimetrie & Expositions (Phase 3).
 *
 * Inventaire des dosimetres et instruments de mesure (TLD, OSL, FILM, EPD).
 * Pattern SafeX 360 premium aligne sur {@link ExposedWorkersRegistryPage} et
 * {@link DosimetryParametersPage}.
 *
 * UX :
 *  - Breadcrumb SafeX 360 > Dosimetrie & Expositions > Dosimetres & Instruments
 *  - Hero card gradient violet/indigo + 4 KPI tiles (Total, Disponibles,
 *    Assignes, Etalonnage < 30 jours)
 *  - Mini-banner urgent si etalonnages depasses ou retours en retard
 *  - Toolbar : recherche live (serial + QR), filtres (type, statut multi,
 *    etalonnage), boutons Scanner QR + Ajouter
 *  - DataTable PrimeReact : Serial, Type, QR, Statut, Travailleur assigne,
 *    Etalonnage, Actions
 *  - Modal detail dosimetre : identite + QR + assignment courant + historique
 *  - Footer ISO/AIEA (calibration ISO 17025 + AIEA RS-G-1.3)
 *
 * RBAC UI :
 *  - "Ajouter dosimetre" + actions de cycle de vie visibles si DOSIMETRY_WRITE
 *  - "Scanner QR" navigation vers placeholder mobile (route /coming-soon en P3)
 *
 * Source de donnees : {@code GET /hns/dosimetry/dosimeter/getAll} (mineId injecte
 * par AxiosInterceptor). Les colonnes "Travailleur attribue" et "Historique
 * assignments" seront enrichies via DosimeterAssignment en Phase 4+ ; en P3
 * elles affichent un placeholder mute si l'API ne renvoie pas encore le bloc
 * assignmentInfo.
 */

// ─────────────────────────────────────────────────────────────────────────────
//  Types locaux — projection d'affichage
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Urgence d'etalonnage UI (3 niveaux) — derivee de calibrationDueDate.
 *   - ok      : >30 jours avant echeance OU aucun etalonnage requis
 *   - soon    : echeance dans les 30 prochains jours
 *   - overdue : date depassee (calibration expiree)
 */
type CalibrationUrgency = 'ok' | 'soon' | 'overdue' | 'none';

interface DosimeterRow {
    id: number;
    serial: string;
    type: DosimeterType;
    qrCode: string | null;
    status: DosimeterStatus;
    calibrationDueDate: string | null;
    calibrationUrgency: CalibrationUrgency;
    /** Worker actuellement attribue (placeholder Phase 3 — sera enrichi Phase 4+). */
    assignedWorkerId: number | null;
    assignedWorkerName: string | null;
    /** Indicateur "retour en retard" si attribution depassant la periode prevue (P4+). */
    returnOverdue: boolean;
}

interface FiltersState {
    query: string;
    type: DosimeterType | 'all';
    statuses: Set<DosimeterStatus>;
    calibration: 'all' | 'soon' | 'overdue';
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const CALIBRATION_WARNING_DAYS = 30;

/**
 * Calcule l'urgence d'etalonnage par rapport a la date courante.
 *   - dueDate manquante : 'none' (instrument sans cycle d'etalonnage requis)
 *   - dueDate < today   : 'overdue'
 *   - dueDate <= today + 30j : 'soon'
 *   - sinon             : 'ok'
 */
function computeCalibrationUrgency(dueDate: string | null | undefined): CalibrationUrgency {
    if (!dueDate) return 'none';
    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) return 'none';
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'overdue';
    if (diffDays <= CALIBRATION_WARNING_DAYS) return 'soon';
    return 'ok';
}

function formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/** Mappe un DosimeterDTO backend vers une ligne d'affichage. */
function mapDtoToRow(dto: DosimeterDTO & { assignedWorkerName?: string; assignedWorkerId?: number; returnOverdue?: boolean }): DosimeterRow {
    return {
        id: dto.id ?? 0,
        serial: dto.serial ?? '—',
        type: dto.type,
        qrCode: dto.qrCode ?? null,
        status: dto.status,
        calibrationDueDate: dto.calibrationDueDate ?? null,
        calibrationUrgency: computeCalibrationUrgency(dto.calibrationDueDate),
        assignedWorkerId: dto.assignedWorkerId ?? null,
        assignedWorkerName: dto.assignedWorkerName ?? null,
        returnOverdue: Boolean(dto.returnOverdue),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Configuration des statuts (couleur + libelle + icone)
//  Triplet a11y : aucune information transmise par la couleur seule.
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
    DosimeterStatus,
    { bg: string; border: string; text: string; dot: string; labelKey: string }
> = {
    AVAILABLE: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        dot: 'bg-green-500',
        labelKey: 'dosimeters.statusValues.AVAILABLE',
    },
    ASSIGNED: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        dot: 'bg-blue-500',
        labelKey: 'dosimeters.statusValues.ASSIGNED',
    },
    IN_READING: {
        bg: 'bg-violet-50',
        border: 'border-violet-200',
        text: 'text-violet-700',
        dot: 'bg-violet-500',
        labelKey: 'dosimeters.statusValues.IN_READING',
    },
    LOST: {
        bg: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-800',
        dot: 'bg-red-600',
        labelKey: 'dosimeters.statusValues.LOST',
    },
    DAMAGED: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        dot: 'bg-orange-500',
        labelKey: 'dosimeters.statusValues.DAMAGED',
    },
    RETIRED: {
        bg: 'bg-slate-100',
        border: 'border-slate-300',
        text: 'text-slate-600',
        dot: 'bg-slate-500',
        labelKey: 'dosimeters.statusValues.RETIRED',
    },
};

const TYPE_CONFIG: Record<DosimeterType, { color: string; bg: string; labelKey: string }> = {
    TLD: { color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', labelKey: 'dosimeters.typeValues.TLD' },
    OSL: { color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200', labelKey: 'dosimeters.typeValues.OSL' },
    FILM: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', labelKey: 'dosimeters.typeValues.FILM' },
    EPD: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', labelKey: 'dosimeters.typeValues.EPD' },
};

// ─────────────────────────────────────────────────────────────────────────────
//  RBAC helper — verifie une permission DOSIMETRY_* dans le profil JWT.
//  Tolerant : accepte permissions[], authorities[], roles[] ou role unique.
// ─────────────────────────────────────────────────────────────────────────────

function hasDosimetryPermission(user: any, permission: string): boolean {
    if (!user) return false;
    if (['ADMINISTRATOR', 'SYSTEM_ADMINISTRATOR', 'ADMIN', 'SUPER_ADMIN'].includes(String(user.role ?? '').toUpperCase())) return true;
    const candidates: string[] = [];
    if (Array.isArray(user.permissions)) candidates.push(...user.permissions);
    if (Array.isArray(user.authorities)) candidates.push(...user.authorities.map((a: any) => a?.authority ?? a));
    if (Array.isArray(user.roles)) candidates.push(...user.roles);
    if (typeof user.role === 'string') candidates.push(user.role);
    return candidates.includes(permission);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const DosimetersInventoryPage = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const user = useAppSelector((state: any) => state.user);

    const canWrite = hasDosimetryPermission(user, 'DOSIMETRY_WRITE');

    const [rows, setRows] = useState<DosimeterRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [selectedRow, setSelectedRow] = useState<DosimeterRow | null>(null);

    const [filters, setFilters] = useState<FiltersState>({
        query: '',
        type: 'all',
        statuses: new Set<DosimeterStatus>(),
        calibration: 'all',
    });

    // ───── Chargement initial ─────
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getAllDosimeters()
            .then((data: any) => {
                if (cancelled) return;
                const list: any[] = Array.isArray(data) ? data : (data?.content ?? []);
                setRows(list.map(mapDtoToRow));
                setLoadError(null);
            })
            .catch(() => {
                if (cancelled) return;
                setRows([]);
                setLoadError(t('dosimeters.loadError'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [t]);

    // ───── Filtrage cote client ─────
    const filteredRows = useMemo(() => {
        const q = filters.query.trim().toLowerCase();
        return rows.filter((r) => {
            if (q) {
                const hay = `${r.serial} ${r.qrCode ?? ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (filters.type !== 'all' && r.type !== filters.type) return false;
            if (filters.statuses.size > 0 && !filters.statuses.has(r.status)) return false;
            if (filters.calibration === 'soon' && r.calibrationUrgency !== 'soon') return false;
            if (filters.calibration === 'overdue' && r.calibrationUrgency !== 'overdue') return false;
            return true;
        });
    }, [rows, filters]);

    // ───── KPI tiles ─────
    const kpi = useMemo(() => {
        const total = rows.length;
        const available = rows.filter((r) => r.status === 'AVAILABLE').length;
        const assigned = rows.filter((r) => r.status === 'ASSIGNED').length;
        const calibSoon = rows.filter((r) => r.calibrationUrgency === 'soon').length;
        const calibOverdue = rows.filter((r) => r.calibrationUrgency === 'overdue').length;
        const returnOverdue = rows.filter((r) => r.returnOverdue).length;
        return { total, available, assigned, calibSoon, calibOverdue, returnOverdue };
    }, [rows]);

    const hasUrgentBanner = kpi.calibOverdue > 0 || kpi.returnOverdue > 0;

    // ───── Handlers ─────
    const toggleStatusFilter = (status: DosimeterStatus) => {
        setFilters((f) => {
            const next = new Set(f.statuses);
            if (next.has(status)) next.delete(status);
            else next.add(status);
            return { ...f, statuses: next };
        });
    };

    const clearAllFilters = () => {
        setFilters({ query: '', type: 'all', statuses: new Set<DosimeterStatus>(), calibration: 'all' });
    };

    const handleOpenScan = () => {
        // Phase 3 Frontend-C : scanner QR mobile-friendly (placeholder camera + saisie manuelle).
        navigate('/dosimetry/dosimeters/scan');
    };

    const activeFiltersCount =
        (filters.query ? 1 : 0) +
        (filters.type !== 'all' ? 1 : 0) +
        (filters.statuses.size > 0 ? 1 : 0) +
        (filters.calibration !== 'all' ? 1 : 0);

    // ───── Templates colonnes ─────
    const renderType = (row: DosimeterRow) => {
        const cfg = TYPE_CONFIG[row.type];
        return (
            <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold border ${cfg.bg} ${cfg.color}`}
                aria-label={t(cfg.labelKey)}
            >
                {row.type}
            </span>
        );
    };

    const renderQrCode = (row: DosimeterRow) => (
        <span className="inline-flex items-center gap-1.5 text-slate-700">
            <IconQrcode size={13} stroke={1.6} className="text-slate-400" />
            <span className="font-mono text-[11.5px]">{row.qrCode ?? '—'}</span>
        </span>
    );

    const renderStatus = (row: DosimeterRow) => {
        const cfg = STATUS_CONFIG[row.status];
        return (
            <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.border} ${cfg.text} text-[10.5px] font-medium`}
                aria-label={t(cfg.labelKey)}
            >
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
                {t(cfg.labelKey)}
            </span>
        );
    };

    const renderAssignedWorker = (row: DosimeterRow) => {
        if (row.status !== 'ASSIGNED' || !row.assignedWorkerId) {
            return <span className="text-slate-400 text-[12px] italic">—</span>;
        }
        return (
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dosimetry/workers/detail/${row.assignedWorkerId}`);
                }}
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline text-[12px]"
            >
                <IconUser size={11} stroke={1.8} />
                {row.assignedWorkerName ?? `#${row.assignedWorkerId}`}
            </button>
        );
    };

    const renderCalibration = (row: DosimeterRow) => {
        if (row.calibrationUrgency === 'none') {
            return <span className="text-slate-400 text-[12px] italic">—</span>;
        }
        const map: Record<
            Exclude<CalibrationUrgency, 'none'>,
            { color: string; key: string; icon: typeof IconCalendarTime }
        > = {
            ok: {
                color: 'bg-green-50 text-green-700 border-green-200',
                key: 'dosimeters.calibration.ok',
                icon: IconCircleCheck,
            },
            soon: {
                color: 'bg-orange-50 text-orange-700 border-orange-200',
                key: 'dosimeters.calibration.soon',
                icon: IconCalendarExclamation,
            },
            overdue: {
                color: 'bg-red-50 text-red-700 border-red-300',
                key: 'dosimeters.calibration.overdue',
                icon: IconAlertOctagon,
            },
        };
        const cfg = map[row.calibrationUrgency];
        const Icon = cfg.icon;
        return (
            <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11.5px] text-slate-700 tabular-nums whitespace-nowrap">
                    {formatDate(row.calibrationDueDate)}
                </span>
                <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${cfg.color} text-[10px] font-medium`}
                    aria-label={t(cfg.key)}
                >
                    <Icon size={10} stroke={1.8} />
                    {t(cfg.key)}
                </span>
            </div>
        );
    };

    const renderActions = (row: DosimeterRow) => (
        <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                onClick={() => setSelectedRow(row)}
                className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                title={t('dosimeters.actions.view')}
                aria-label={t('dosimeters.actions.view')}
            >
                <IconQrcode size={13} stroke={1.8} />
            </button>
            {canWrite && (
                <button
                    type="button"
                    onClick={() => navigate(`/dosimetry/dosimeters/edit/${row.id}`)}
                    className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                    title={t('dosimeters.actions.edit')}
                    aria-label={t('dosimeters.actions.edit')}
                >
                    <IconPencil size={13} stroke={1.8} />
                </button>
            )}
        </div>
    );

    /**
     * Empty state premium : icone gradient + titre + sous-titre + CTA "Ajouter".
     */
    const emptyTemplate = (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200 flex items-center justify-center mb-4 shadow-sm">
                <IconDeviceWatch size={28} className="text-indigo-500" stroke={1.6} />
            </div>
            <p className="text-[14px] text-slate-800 font-semibold mb-1">
                {t('dosimeters.empty.title')}
            </p>
            <p className="text-[12.5px] text-slate-500 max-w-md mb-4 leading-relaxed">
                {t('dosimeters.empty.subtitle')}
            </p>
            {canWrite && (
                <button
                    type="button"
                    onClick={() => navigate('/dosimetry/dosimeters/new')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm font-medium"
                >
                    <IconPlus size={14} stroke={2} />
                    {t('dosimeters.empty.cta')}
                </button>
            )}
        </div>
    );

    const allStatuses: DosimeterStatus[] = ['AVAILABLE', 'ASSIGNED', 'IN_READING', 'LOST', 'DAMAGED', 'RETIRED'];

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">

                {/* ─── Breadcrumb premium ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('dosimeters.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('dosimeters.breadcrumbParent')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('dosimeters.breadcrumbCurrent')}
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
                                <IconDeviceWatch size={22} stroke={1.8} className="text-white" />
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
                                    {t('dosimeters.title')}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {t('dosimeters.subtitle')}
                                </p>
                            </div>
                        </div>

                        {/* KPI tiles inline */}
                        <div className="flex flex-wrap items-stretch gap-2">
                            <HeroKpi
                                label={t('dosimeters.kpi.total')}
                                value={kpi.total}
                                accent="indigo"
                                icon={<IconDeviceWatch size={13} stroke={1.8} />}
                            />
                            <HeroKpi
                                label={t('dosimeters.kpi.available')}
                                value={kpi.available}
                                accent="green"
                                icon={<IconCircleCheck size={13} stroke={1.8} />}
                            />
                            <HeroKpi
                                label={t('dosimeters.kpi.assigned')}
                                value={kpi.assigned}
                                accent="blue"
                                icon={<IconUser size={13} stroke={1.8} />}
                            />
                            <HeroKpi
                                label={t('dosimeters.kpi.calibrationSoon')}
                                value={kpi.calibSoon}
                                accent="orange"
                                icon={<IconCalendarExclamation size={13} stroke={1.8} />}
                                pulse={kpi.calibSoon > 0}
                            />
                        </div>
                    </div>
                </div>

                {/* ─── Mini-banner urgent (etalonnages depasses / retours en retard) ─── */}
                {hasUrgentBanner && (
                    <div
                        className="mb-4 flex items-start gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-800"
                        role="alert"
                    >
                        <IconAlertOctagon size={18} stroke={1.8} className="mt-0.5 flex-shrink-0 text-red-600" />
                        <div className="flex-1 text-[12.5px]">
                            <p className="font-semibold text-red-900 mb-0.5">
                                {t('dosimeters.urgentBanner.title')}
                            </p>
                            <p className="leading-relaxed">
                                {kpi.calibOverdue > 0 &&
                                    t('dosimeters.urgentBanner.calibrationOverdue', { count: kpi.calibOverdue })}
                                {kpi.calibOverdue > 0 && kpi.returnOverdue > 0 && ' · '}
                                {kpi.returnOverdue > 0 &&
                                    t('dosimeters.urgentBanner.returnOverdue', { count: kpi.returnOverdue })}
                            </p>
                        </div>
                        {kpi.calibOverdue > 0 && (
                            <button
                                type="button"
                                onClick={() => setFilters((f) => ({ ...f, calibration: 'overdue' }))}
                                className="flex-shrink-0 text-[11.5px] font-medium text-red-700 hover:text-red-900 underline whitespace-nowrap"
                            >
                                {t('dosimeters.urgentBanner.filterAction')}
                            </button>
                        )}
                    </div>
                )}

                {/* ─── Banner erreur ─── */}
                {loadError && (
                    <div
                        className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]"
                        role="alert"
                    >
                        <IconAlertTriangle size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{loadError}</span>
                    </div>
                )}

                {/* ─── Toolbar ─── */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Recherche */}
                        <div className="relative flex-1 min-w-[220px] max-w-[360px]">
                            <IconSearch
                                size={13}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                stroke={1.8}
                            />
                            <input
                                type="search"
                                value={filters.query}
                                onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                                placeholder={t('dosimeters.toolbar.searchPlaceholder')}
                                aria-label={t('dosimeters.toolbar.searchAria')}
                                className="w-full pl-8 pr-3 py-1.5 text-[12.5px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                            />
                        </div>

                        {/* Filtre type */}
                        <FilterSelect
                            ariaLabel={t('dosimeters.toolbar.filterType')}
                            value={filters.type}
                            onChange={(v) => setFilters((f) => ({ ...f, type: v as FiltersState['type'] }))}
                            options={[
                                { value: 'all', label: t('dosimeters.toolbar.allTypes') },
                                { value: 'TLD', label: t('dosimeters.typeValues.TLD') },
                                { value: 'OSL', label: t('dosimeters.typeValues.OSL') },
                                { value: 'FILM', label: t('dosimeters.typeValues.FILM') },
                                { value: 'EPD', label: t('dosimeters.typeValues.EPD') },
                            ]}
                        />

                        {/* Filtre etalonnage */}
                        <FilterSelect
                            ariaLabel={t('dosimeters.toolbar.filterCalibration')}
                            value={filters.calibration}
                            onChange={(v) =>
                                setFilters((f) => ({ ...f, calibration: v as FiltersState['calibration'] }))
                            }
                            options={[
                                { value: 'all', label: t('dosimeters.toolbar.allCalibrations') },
                                { value: 'soon', label: t('dosimeters.toolbar.calibrationSoon') },
                                { value: 'overdue', label: t('dosimeters.toolbar.calibrationOverdue') },
                            ]}
                        />

                        <div className="ml-auto flex items-center gap-2">
                            {/* Scanner QR */}
                            <button
                                type="button"
                                onClick={handleOpenScan}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition"
                                title={t('dosimeters.toolbar.scanQr')}
                            >
                                <IconScan size={13} stroke={1.8} />
                                {t('dosimeters.toolbar.scanQr')}
                            </button>

                            {/* Ajouter dosimetre */}
                            {canWrite && (
                                <button
                                    type="button"
                                    onClick={() => navigate('/dosimetry/dosimeters/new')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
                                >
                                    <IconPlus size={13} stroke={2} />
                                    {t('dosimeters.toolbar.add')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Chips de statut (multi-select) */}
                    <div className="mt-2.5 flex items-center flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.10em] text-slate-500 font-semibold mr-1">
                            <IconFilter size={10} stroke={1.8} />
                            {t('dosimeters.toolbar.statusLabel')}
                        </span>
                        {allStatuses.map((status) => {
                            const cfg = STATUS_CONFIG[status];
                            const active = filters.statuses.has(status);
                            return (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => toggleStatusFilter(status)}
                                    aria-pressed={active}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10.5px] font-medium transition ${
                                        active
                                            ? `${cfg.bg} ${cfg.border} ${cfg.text} ring-2 ring-offset-1 ring-indigo-300`
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
                                    {t(cfg.labelKey)}
                                </button>
                            );
                        })}
                    </div>

                    {/* Indicateur de filtres actifs */}
                    {activeFiltersCount > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                            <IconFilter size={11} stroke={1.8} />
                            <span>
                                {t('dosimeters.toolbar.activeFilters', {
                                    count: filteredRows.length,
                                    total: rows.length,
                                })}
                            </span>
                            <button
                                type="button"
                                onClick={clearAllFilters}
                                className="ml-1 underline hover:text-indigo-600"
                            >
                                {t('dosimeters.toolbar.clearFilters')}
                            </button>
                        </div>
                    )}
                </div>

                {/* ─── DataTable ─── */}
                <div className="safex-dosimetry-table bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="px-4 py-12 text-center text-slate-500 text-[13px]">
                            <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-2 align-middle" />
                            {t('dosimeters.loading')}
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
                            onRowClick={(e) => setSelectedRow(e.data as DosimeterRow)}
                            rowClassName={() => 'cursor-pointer'}
                            className="text-[12.5px]"
                        >
                            <Column
                                field="serial"
                                header={t('dosimeters.columns.serial')}
                                sortable
                                style={{ minWidth: 140 }}
                                body={(row: DosimeterRow) => (
                                    <span className="font-mono text-[12px] text-slate-800 font-medium">{row.serial}</span>
                                )}
                            />
                            <Column
                                field="type"
                                header={t('dosimeters.columns.type')}
                                sortable
                                style={{ width: 100 }}
                                body={renderType}
                            />
                            <Column
                                field="qrCode"
                                header={t('dosimeters.columns.qrCode')}
                                sortable
                                style={{ minWidth: 140 }}
                                body={renderQrCode}
                            />
                            <Column
                                field="status"
                                header={t('dosimeters.columns.status')}
                                sortable
                                style={{ minWidth: 130 }}
                                body={renderStatus}
                            />
                            <Column
                                field="assignedWorkerName"
                                header={t('dosimeters.columns.assignedWorker')}
                                style={{ minWidth: 160 }}
                                body={renderAssignedWorker}
                            />
                            <Column
                                field="calibrationDueDate"
                                header={t('dosimeters.columns.calibration')}
                                sortable
                                style={{ minWidth: 200 }}
                                body={renderCalibration}
                            />
                            <Column
                                header={t('dosimeters.columns.actions')}
                                style={{ width: 80 }}
                                body={renderActions}
                                align="right"
                            />
                        </DataTable>
                    )}
                </div>

                {/* ─── Footer ISO/AIEA ─── */}
                <div className="mt-6 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 text-indigo-700 flex-shrink-0">
                        <IconInfoCircle size={15} stroke={1.8} />
                    </span>
                    <div className="text-[12.5px] text-slate-700 leading-relaxed">
                        <p className="font-medium text-slate-800 mb-0.5">
                            {t('dosimeters.footer.title')}
                        </p>
                        <p>{t('dosimeters.footer.note')}</p>
                    </div>
                </div>
            </div>

            {/* ─── Modal detail dosimetre ─── */}
            {selectedRow && (
                <DosimeterDetailModal
                    row={selectedRow}
                    canWrite={canWrite}
                    onClose={() => setSelectedRow(null)}
                    onNavigateWorker={(workerId) => {
                        setSelectedRow(null);
                        navigate(`/dosimetry/workers/detail/${workerId}`);
                    }}
                    onEdit={(id) => {
                        setSelectedRow(null);
                        navigate(`/dosimetry/dosimeters/edit/${id}`);
                    }}
                />
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

const KPI_ACCENT: Record<string, { bg: string; text: string; ring: string; iconBg: string }> = {
    indigo: { bg: 'bg-indigo-50/70', text: 'text-indigo-700', ring: 'border-indigo-200', iconBg: 'bg-white border-indigo-200 text-indigo-700' },
    violet: { bg: 'bg-violet-50/70', text: 'text-violet-700', ring: 'border-violet-200', iconBg: 'bg-white border-violet-200 text-violet-700' },
    green:  { bg: 'bg-green-50/70',  text: 'text-green-700',  ring: 'border-green-200',  iconBg: 'bg-white border-green-200 text-green-700' },
    blue:   { bg: 'bg-blue-50/70',   text: 'text-blue-700',   ring: 'border-blue-200',   iconBg: 'bg-white border-blue-200 text-blue-700' },
    red:    { bg: 'bg-red-50/70',    text: 'text-red-700',    ring: 'border-red-200',    iconBg: 'bg-white border-red-200 text-red-700' },
    orange: { bg: 'bg-orange-50/70', text: 'text-orange-700', ring: 'border-orange-200', iconBg: 'bg-white border-orange-200 text-orange-700' },
};

function HeroKpi({
    label, value, sub, accent, icon, pulse,
}: {
    label: string;
    value: number | string;
    sub?: string;
    accent: keyof typeof KPI_ACCENT;
    icon?: React.ReactNode;
    pulse?: boolean;
}) {
    const tone = KPI_ACCENT[accent];
    return (
        <div
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${tone.bg} ${tone.ring} ${
                pulse ? 'animate-[pulse_2.4s_ease-in-out_infinite]' : ''
            }`}
        >
            {icon && (
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${tone.iconBg}`}>
                    {icon}
                </div>
            )}
            <div>
                <p className={`text-[10px] uppercase tracking-[0.14em] ${tone.text} leading-none font-semibold`}>
                    {label}
                </p>
                <p className="text-[15px] text-slate-800 font-mono font-bold leading-tight mt-0.5">
                    {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
                </p>
                {sub && <p className="text-[10px] text-slate-500 leading-none">{sub}</p>}
            </div>
        </div>
    );
}

function FilterSelect({
    ariaLabel, value, onChange, options,
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
//  Modal detail dosimetre
//  Affiche identite + QR + assignment courant + historique (placeholder P3).
// ─────────────────────────────────────────────────────────────────────────────

interface DosimeterDetailModalProps {
    row: DosimeterRow;
    canWrite: boolean;
    onClose: () => void;
    onNavigateWorker: (workerId: number) => void;
    onEdit: (dosimeterId: number) => void;
}

function DosimeterDetailModal({ row, canWrite, onClose, onNavigateWorker, onEdit }: DosimeterDetailModalProps) {
    const { t } = useTranslation('dosimetry');

    const statusCfg = STATUS_CONFIG[row.status];
    const typeCfg = TYPE_CONFIG[row.type];

    return (
        <div
            // z-[1100] = Z.modal : à z-50 la modale passait sous le header fixe (z-200).
            className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dosimeter-modal-title"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative px-6 py-5 border-b border-slate-200">
                    <div
                        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 rounded-t-2xl"
                        aria-hidden="true"
                    />
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
                                <IconDeviceWatch size={20} stroke={1.8} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <h2
                                    id="dosimeter-modal-title"
                                    className="text-slate-900 font-mono"
                                    style={{
                                        fontSize: '18px',
                                        fontWeight: 600,
                                        letterSpacing: '-0.01em',
                                    }}
                                >
                                    {row.serial}
                                </h2>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span
                                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold border ${typeCfg.bg} ${typeCfg.color}`}
                                    >
                                        {row.type}
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.text} text-[10.5px] font-medium`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} aria-hidden="true" />
                                        {t(statusCfg.labelKey)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex-shrink-0"
                            aria-label={t('dosimeters.detail.close')}
                        >
                            <IconX size={16} stroke={1.8} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                    {/* Bloc Identite + QR */}
                    <section>
                        <h3 className="text-[10.5px] uppercase tracking-[0.14em] text-slate-500 font-semibold mb-2">
                            {t('dosimeters.detail.identitySection')}
                        </h3>
                        <div className="flex gap-4 items-start p-3 rounded-lg bg-slate-50 border border-slate-200">
                            {/* Placeholder visuel QR */}
                            <div className="w-24 h-24 rounded-md bg-white border border-slate-300 flex items-center justify-center flex-shrink-0 shadow-inner">
                                <IconQrcode size={56} stroke={1} className="text-slate-700" />
                            </div>
                            <dl className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
                                <div>
                                    <dt className="text-[10.5px] uppercase tracking-[0.10em] text-slate-500 font-medium">
                                        {t('dosimeters.detail.serial')}
                                    </dt>
                                    <dd className="text-slate-800 font-mono font-medium">{row.serial}</dd>
                                </div>
                                <div>
                                    <dt className="text-[10.5px] uppercase tracking-[0.10em] text-slate-500 font-medium">
                                        {t('dosimeters.detail.type')}
                                    </dt>
                                    <dd className="text-slate-800">{t(typeCfg.labelKey)}</dd>
                                </div>
                                <div className="col-span-2">
                                    <dt className="text-[10.5px] uppercase tracking-[0.10em] text-slate-500 font-medium">
                                        {t('dosimeters.detail.qrCode')}
                                    </dt>
                                    <dd className="text-slate-800 font-mono text-[11.5px]">
                                        {row.qrCode ?? '—'}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </section>

                    {/* Bloc Statut courant */}
                    <section>
                        <h3 className="text-[10.5px] uppercase tracking-[0.14em] text-slate-500 font-semibold mb-2">
                            {t('dosimeters.detail.statusSection')}
                        </h3>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                            <div className="flex items-center gap-2 mb-2">
                                <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.text} text-[11.5px] font-medium`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} aria-hidden="true" />
                                    {t(statusCfg.labelKey)}
                                </span>
                            </div>
                            {row.status === 'ASSIGNED' && row.assignedWorkerId ? (
                                <div className="text-[12.5px] text-slate-700">
                                    {t('dosimeters.detail.currentlyAssignedTo')}{' '}
                                    <button
                                        type="button"
                                        onClick={() => onNavigateWorker(row.assignedWorkerId!)}
                                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                                    >
                                        <IconUser size={12} stroke={1.8} />
                                        {row.assignedWorkerName ?? `#${row.assignedWorkerId}`}
                                    </button>
                                </div>
                            ) : (
                                <p className="text-[12.5px] text-slate-500 italic">
                                    {t('dosimeters.detail.noCurrentAssignment')}
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Bloc Etalonnage */}
                    <section>
                        <h3 className="text-[10.5px] uppercase tracking-[0.14em] text-slate-500 font-semibold mb-2">
                            {t('dosimeters.detail.calibrationSection')}
                        </h3>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <IconCalendarTime size={16} stroke={1.6} className="text-slate-500" />
                                <div>
                                    <p className="text-[10.5px] uppercase tracking-[0.10em] text-slate-500 font-medium">
                                        {t('dosimeters.detail.nextCalibration')}
                                    </p>
                                    <p className="text-[13px] font-mono text-slate-800">
                                        {formatDate(row.calibrationDueDate)}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled
                                title={t('dosimeters.detail.scheduleCalibrationPhase')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] rounded-md border border-slate-300 text-slate-500 bg-white opacity-60 cursor-not-allowed"
                            >
                                <IconCalendarTime size={12} stroke={1.8} />
                                {t('dosimeters.detail.scheduleCalibration')}
                            </button>
                        </div>
                    </section>

                    {/* Historique assignments — placeholder Phase 3 */}
                    <section>
                        <h3 className="text-[10.5px] uppercase tracking-[0.14em] text-slate-500 font-semibold mb-2 flex items-center gap-1.5">
                            <IconHistory size={11} stroke={1.8} />
                            {t('dosimeters.detail.historySection')}
                        </h3>
                        <div className="p-4 rounded-lg bg-slate-50 border border-dashed border-slate-300 text-center">
                            <IconClockHour4 size={22} stroke={1.4} className="text-slate-400 mx-auto mb-1.5" />
                            <p className="text-[12.5px] text-slate-600">
                                {t('dosimeters.detail.historyEmpty')}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                {t('dosimeters.detail.historyPhaseNote')}
                            </p>
                        </div>
                    </section>
                </div>

                {/* Footer actions */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2 flex-wrap rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
                    >
                        {t('dosimeters.detail.close')}
                    </button>
                    {canWrite && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => onEdit(row.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
                            >
                                <IconPencil size={12} stroke={1.8} />
                                {t('dosimeters.detail.actions.edit')}
                            </button>
                            <button
                                type="button"
                                disabled
                                title={t('dosimeters.detail.actionPhaseNote')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border border-indigo-300 text-indigo-700 bg-white opacity-60 cursor-not-allowed"
                            >
                                <IconBookmark size={12} stroke={1.8} />
                                {t('dosimeters.detail.actions.assign')}
                            </button>
                            <button
                                type="button"
                                disabled
                                title={t('dosimeters.detail.actionPhaseNote')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white opacity-60 cursor-not-allowed"
                            >
                                <IconArrowBackUp size={12} stroke={1.8} />
                                {t('dosimeters.detail.actions.return')}
                            </button>
                            <button
                                type="button"
                                disabled
                                title={t('dosimeters.detail.actionPhaseNote')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md bg-violet-600 text-white opacity-60 cursor-not-allowed"
                            >
                                <IconReceipt size={12} stroke={1.8} />
                                {t('dosimeters.detail.actions.markReading')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DosimetersInventoryPage;

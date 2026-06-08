/**
 * BlastRegistryPage — Module Gestion des Dynamitages (Phase 2 Frontend).
 *
 * Registre des tirs de mine, aligne sur le standard premium SafeX 360
 * (cf. ExposedWorkersRegistryPage / EmergencyDashboardPage).
 *
 * UX :
 *  - Breadcrumb SafeX 360 > Dynamitages > Registre des tirs
 *  - Hero card serif premium + 4 KPI tiles (Tirs aujourd'hui, Cette semaine,
 *    Confirmes, A planifier)
 *  - SegmentedFilter status : 10 etats (Brouillon, Planifie, Confirme,
 *    Imminent, Tire, Site degage, Rate, Annule, Reporte, Tous)
 *  - Filtres : Fosse, Periode (DateInput from/to), Boutefeu, Recherche reference
 *  - Toggle vue Tableau / Tuiles
 *  - DataTable PrimeReact (tri scheduledAt DESC default, row click navigation)
 *  - Bouton "+ Nouveau tir" (RBAC BLAST_PLAN), "Dupliquer" sur chaque ligne,
 *    "Exporter CSV" (genere client-side, le backend n'expose pas d'endpoint
 *    /export pour le module Blast en P1).
 *  - Statuts : couleur DOUBLEE d'un libelle (a11y WCAG)
 *
 * Source de donnees : POST /hns/blast/search (cf. BlastController.search →
 * BlastSearchFiltersDTO).
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    IconBolt,
    IconChevronRight,
    IconSearch,
    IconDownload,
    IconPlus,
    IconEye,
    IconCopy,
    IconAlertOctagon,
    IconFilter,
    IconClock,
    IconCalendarStats,
    IconCheck,
    IconClipboardList,
    IconLayoutGrid,
    IconTable,
    IconUser,
    IconMapPin,
} from '@tabler/icons-react';
import { DateInput } from '@mantine/dates';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useAppSelector } from '../../slices/hooks';
import {
    searchBlasts,
    getBlastDetail,
    createBlast,
    duplicateBlastPayload,
    type BlastListItemDTO,
    type BlastStatus,
    type BlastType,
    type BlastSearchFilters,
} from '../../services/BlastService';

// ─────────────────────────────────────────────────────────────────────────────
//  Configuration des statuts (couleur + libelle obligatoire pour a11y WCAG)
//  Palette §10 du PROMPT Blast Management.
// ─────────────────────────────────────────────────────────────────────────────

interface StatusConfig {
    bg: string;
    border: string;
    text: string;
    dot: string;
    labelKey: string;
}

const STATUS_CONFIG: Record<BlastStatus, StatusConfig> = {
    DRAFT: {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-700',
        dot: 'bg-slate-400',
        labelKey: 'statuses.DRAFT',
    },
    PLANNED: {
        // bleu/teal #0891B2
        bg: 'bg-cyan-50',
        border: 'border-cyan-200',
        text: 'text-cyan-800',
        dot: 'bg-cyan-600',
        labelKey: 'statuses.PLANNED',
    },
    CONFIRMED: {
        // ambre #D97706
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        dot: 'bg-amber-600',
        labelKey: 'statuses.CONFIRMED',
    },
    IMMINENT: {
        // orange #EA580C
        bg: 'bg-orange-50',
        border: 'border-orange-300',
        text: 'text-orange-800',
        dot: 'bg-orange-600',
        labelKey: 'statuses.IMMINENT',
    },
    FIRED: {
        // gris
        bg: 'bg-slate-100',
        border: 'border-slate-300',
        text: 'text-slate-700',
        dot: 'bg-slate-500',
        labelKey: 'statuses.FIRED',
    },
    ALL_CLEAR: {
        // vert #16A34A
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        dot: 'bg-green-600',
        labelKey: 'statuses.ALL_CLEAR',
    },
    MISFIRE: {
        // rouge #DC2626
        bg: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-800',
        dot: 'bg-red-600',
        labelKey: 'statuses.MISFIRE',
    },
    CANCELLED: {
        // gris attenue
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-500',
        dot: 'bg-slate-300',
        labelKey: 'statuses.CANCELLED',
    },
    POSTPONED: {
        // gris attenue
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-500',
        dot: 'bg-slate-300',
        labelKey: 'statuses.POSTPONED',
    },
};

const ALL_STATUSES: BlastStatus[] = [
    'DRAFT',
    'PLANNED',
    'CONFIRMED',
    'IMMINENT',
    'FIRED',
    'ALL_CLEAR',
    'MISFIRE',
    'CANCELLED',
    'POSTPONED',
];

// ─────────────────────────────────────────────────────────────────────────────
//  Filtres locaux du registre
// ─────────────────────────────────────────────────────────────────────────────

interface FiltersState {
    query: string;
    status: BlastStatus | 'all';
    pit: string;
    blasterId: string;
    from: Date | null;
    to: Date | null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers RBAC (verifie une permission BLAST_* dans le profil JWT)
// ─────────────────────────────────────────────────────────────────────────────

function hasBlastPermission(user: any, permission: string): boolean {
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
//  Helpers de formatage
// ─────────────────────────────────────────────────────────────────────────────

const formatDateTime = (iso: string, lang: string): string => {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(d);
    } catch {
        return iso;
    }
};

const isSameDay = (a: Date, b: Date): boolean => {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
};

const isWithinWeek = (date: Date, now: Date): boolean => {
    const diffMs = date.getTime() - now.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return diffMs >= 0 && diffMs <= sevenDaysMs;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composants utilitaires (KPI tile + StatusBadge + SegmentedFilter)
// ─────────────────────────────────────────────────────────────────────────────

interface KpiTileProps {
    label: string;
    sublabel: string;
    value: number | string;
    icon: React.ReactNode;
    accent: 'cyan' | 'amber' | 'green' | 'slate';
}

const KpiTile = ({ label, sublabel, value, icon, accent }: KpiTileProps) => {
    const accentMap = {
        cyan: 'from-cyan-500 to-cyan-700 shadow-cyan-200',
        amber: 'from-amber-500 to-amber-700 shadow-amber-200',
        green: 'from-green-500 to-green-700 shadow-green-200',
        slate: 'from-slate-500 to-slate-700 shadow-slate-200',
    } as const;
    return (
        <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-3 min-w-[150px] flex-1 shadow-sm">
            <div className="flex items-center gap-2.5">
                <div
                    className={`w-9 h-9 rounded-lg bg-gradient-to-br ${accentMap[accent]} flex items-center justify-center shadow-md flex-shrink-0 text-white`}
                >
                    {icon}
                </div>
                <div className="min-w-0">
                    <div className="text-[20px] font-semibold text-slate-900 tabular-nums leading-none">
                        {value}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mt-0.5">
                        {label}
                    </div>
                </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 leading-snug">{sublabel}</p>
        </div>
    );
};

interface StatusBadgeProps {
    status: BlastStatus;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
    const { t } = useTranslation('blast');
    const cfg = STATUS_CONFIG[status];
    const label = t(cfg.labelKey);
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${cfg.bg} ${cfg.border} ${cfg.text} text-[11.5px] font-medium`}
            aria-label={label}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
            {label}
        </span>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const BlastRegistryPage = () => {
    const { t, i18n } = useTranslation('blast');
    const navigate = useNavigate();
    const user = useAppSelector((state: any) => state.user);
    const selectedCompanyId: number | null = useAppSelector(
        (state: any) => state?.companySelection?.selectedCompanyId ?? null,
    );

    const canWrite = hasBlastPermission(user, 'BLAST_PLAN');
    const mineId: number =
        selectedCompanyId ?? user?.mineId ?? user?.companyId ?? 1;

    const [rows, setRows] = useState<BlastListItemDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [view, setView] = useState<'table' | 'tiles'>('table');
    const [filters, setFilters] = useState<FiltersState>({
        query: '',
        status: 'all',
        pit: '',
        blasterId: '',
        from: null,
        to: null,
    });

    // ───── Chargement initial via POST /search ─────
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const serverFilters: BlastSearchFilters = {
            mineId,
            statuses:
                filters.status !== 'all' ? [filters.status as BlastStatus] : null,
            from: filters.from ? filters.from.toISOString() : null,
            to: filters.to ? filters.to.toISOString() : null,
            pit: filters.pit.trim() ? filters.pit.trim() : null,
            blasterId:
                filters.blasterId.trim() && !Number.isNaN(Number(filters.blasterId))
                    ? Number(filters.blasterId)
                    : null,
        };
        searchBlasts(serverFilters)
            .then((data) => {
                if (cancelled) return;
                const list = Array.isArray(data) ? data : [];
                // Sort scheduled_at DESC default
                list.sort(
                    (a, b) =>
                        new Date(b.scheduledAt).getTime() -
                        new Date(a.scheduledAt).getTime(),
                );
                setRows(list);
                setLoadError(null);
            })
            .catch(() => {
                if (cancelled) return;
                setRows([]);
                setLoadError(t('registry.loadError'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [t, mineId, filters.status, filters.pit, filters.blasterId, filters.from, filters.to]);

    // ───── Filtrage cote client (recherche par reference) ─────
    const filteredRows = useMemo(() => {
        const q = filters.query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((r) => (r.reference ?? '').toLowerCase().includes(q));
    }, [rows, filters.query]);

    // ───── KPI tiles ─────
    const kpi = useMemo(() => {
        const now = new Date();
        let today = 0;
        let week = 0;
        let confirmed = 0;
        let toPlan = 0;
        rows.forEach((r) => {
            const d = new Date(r.scheduledAt);
            if (isSameDay(d, now)) today += 1;
            if (isWithinWeek(d, now)) week += 1;
            if (r.status === 'CONFIRMED') confirmed += 1;
            if (r.status === 'DRAFT') toPlan += 1;
        });
        return { today, week, confirmed, toPlan };
    }, [rows]);

    // ───── Liste des fosses uniques pour le filtre ─────
    const pits = useMemo(() => {
        const set = new Set<string>();
        rows.forEach((r) => {
            if (r.pit && r.pit.trim()) set.add(r.pit.trim());
        });
        return Array.from(set).sort();
    }, [rows]);

    // ───── Duplication d'un tir ─────
    const [duplicating, setDuplicating] = useState<number | null>(null);
    const handleDuplicate = async (row: BlastListItemDTO) => {
        if (!canWrite || duplicating != null) return;
        setDuplicating(row.id);
        try {
            const detail = await getBlastDetail(row.id);
            const payload = duplicateBlastPayload(detail);
            const newId = await createBlast(payload);
            navigate(`/blast/edit/${newId}`);
        } catch {
            setLoadError(t('registry.loadError'));
        } finally {
            setDuplicating(null);
        }
    };

    // ───── Export CSV (genere client-side : backend n'expose pas d'/export) ─────
    const [exporting, setExporting] = useState(false);
    const handleExportCsv = () => {
        if (exporting) return;
        setExporting(true);
        try {
            const cols = [
                'reference',
                'scheduledAt',
                'type',
                'status',
                'pit',
                'bench',
                'blasterId',
            ];
            const header = cols.join(',');
            const escape = (v: any) => {
                if (v == null) return '';
                const s = String(v).replace(/"/g, '""');
                return /[",\n]/.test(s) ? `"${s}"` : s;
            };
            const body = filteredRows
                .map((r) =>
                    cols
                        .map((c) =>
                            escape((r as unknown as Record<string, unknown>)[c]),
                        )
                        .join(','),
                )
                .join('\n');
            const csv = `${header}\n${body}\n`;
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const stamp = new Date().toISOString().slice(0, 10);
            a.download = `blast-registry-${stamp}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            setLoadError(t('registry.exportError'));
        } finally {
            setExporting(false);
        }
    };

    // ───── Templates colonnes ─────
    const renderReference = (row: BlastListItemDTO) => (
        <span className="font-mono text-[12px] text-slate-800 font-semibold tracking-tight">
            {row.reference}
        </span>
    );

    const renderZone = (row: BlastListItemDTO) => (
        <div className="text-[12px] text-slate-700 leading-tight">
            <div className="font-medium">{row.pit ?? '—'}</div>
            {row.bench && (
                <div className="text-[11px] text-slate-500">{row.bench}</div>
            )}
        </div>
    );

    const renderType = (row: BlastListItemDTO) => (
        <span className="text-[12px] text-slate-700">
            {t(`types.${row.type}`)}
        </span>
    );

    const renderScheduled = (row: BlastListItemDTO) => (
        <div className="text-[12px] text-slate-700 leading-tight">
            <div className="font-medium tabular-nums">
                {formatDateTime(row.scheduledAt, i18n.language)}
            </div>
            {row.timezone && (
                <div className="text-[10.5px] text-slate-500">{row.timezone}</div>
            )}
        </div>
    );

    const renderStatus = (row: BlastListItemDTO) => <StatusBadge status={row.status} />;

    const renderBlaster = (row: BlastListItemDTO) => (
        <span className="text-[12px] text-slate-700">
            {row.blasterId ? `#${row.blasterId}` : '—'}
        </span>
    );

    const renderNotifications = (row: BlastListItemDTO) => {
        // Phase 3 : etat reel des rappels. Pour l'instant, affichage qualitatif
        // base sur le statut du tir.
        const isStarted =
            row.status === 'CONFIRMED' ||
            row.status === 'IMMINENT' ||
            row.status === 'FIRED' ||
            row.status === 'ALL_CLEAR' ||
            row.status === 'MISFIRE';
        const labelKey = isStarted
            ? 'registry.notifications.pending'
            : 'registry.notifications.notStarted';
        return (
            <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium border ${
                    isStarted
                        ? 'bg-cyan-50 border-cyan-200 text-cyan-800'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
            >
                <IconClock size={10} stroke={2} />
                {t(labelKey)}
            </span>
        );
    };

    const renderActions = (row: BlastListItemDTO) => (
        <div
            className="inline-flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
        >
            <button
                type="button"
                onClick={() => navigate(`/blast/detail/${row.id}`)}
                className="p-1 rounded text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 transition"
                title={t('registry.actions.view')}
                aria-label={t('registry.actions.view')}
            >
                <IconEye size={14} stroke={1.8} />
            </button>
            {canWrite && (
                <button
                    type="button"
                    onClick={() => handleDuplicate(row)}
                    disabled={duplicating === row.id}
                    className="p-1 rounded text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 transition disabled:opacity-50"
                    title={t('registry.actions.duplicate')}
                    aria-label={t('registry.actions.duplicate')}
                >
                    <IconCopy size={14} stroke={1.8} />
                </button>
            )}
        </div>
    );

    // ───── Empty state premium ─────
    const emptyTemplate = (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200 flex items-center justify-center mb-4 shadow-sm">
                <IconBolt size={28} className="text-amber-600" stroke={1.6} />
            </div>
            <p className="text-[14px] text-slate-800 font-semibold mb-1">
                {t('registry.empty.title')}
            </p>
            <p className="text-[12.5px] text-slate-500 max-w-md mb-4 leading-relaxed">
                {t('registry.empty.subtitle')}
            </p>
            {canWrite && (
                <button
                    type="button"
                    onClick={() => navigate('/blast/new')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] rounded-md bg-amber-600 text-white hover:bg-amber-700 transition shadow-sm font-medium min-h-[40px]"
                >
                    <IconPlus size={14} stroke={2} />
                    {t('registry.empty.cta')}
                </button>
            )}
        </div>
    );

    // ───── Tuile pour la vue Tuiles ─────
    const renderTile = (row: BlastListItemDTO) => (
        <button
            key={row.id}
            type="button"
            onClick={() => navigate(`/blast/detail/${row.id}`)}
            className="text-left bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-amber-300 transition p-4 min-h-[140px] flex flex-col gap-2"
        >
            <div className="flex items-center justify-between gap-2">
                {renderReference(row)}
                <StatusBadge status={row.status} />
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-slate-600">
                <IconMapPin size={12} stroke={1.8} />
                <span className="font-medium">{row.pit ?? '—'}</span>
                {row.bench && (
                    <span className="text-slate-400">/ {row.bench}</span>
                )}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-slate-600">
                <IconClock size={12} stroke={1.8} />
                <span className="tabular-nums">
                    {formatDateTime(row.scheduledAt, i18n.language)}
                </span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-slate-600">
                <IconUser size={12} stroke={1.8} />
                <span>
                    {t('registry.columns.blaster')} :{' '}
                    {row.blasterId ? `#${row.blasterId}` : '—'}
                </span>
            </div>
            <div className="mt-auto flex items-center gap-2 text-[11px] text-slate-500">
                {t(`types.${row.type}`)}
            </div>
        </button>
    );

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">
                {/* ─── Breadcrumb premium ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('registry.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('registry.breadcrumbParent')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('registry.breadcrumbCurrent')}
                    </span>
                </div>

                {/* ─── Hero card serif premium ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center shadow-md shadow-amber-200 flex-shrink-0">
                                <IconBolt size={22} stroke={1.8} className="text-white" />
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
                                    {t('registry.title')}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {t('registry.subtitle')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── KPI tiles ─── */}
                <div className="mb-5 flex flex-wrap gap-3">
                    <KpiTile
                        label={t('registry.kpi.today')}
                        sublabel={t('registry.kpi.todayLabel')}
                        value={kpi.today}
                        icon={<IconClock size={18} stroke={1.8} />}
                        accent="cyan"
                    />
                    <KpiTile
                        label={t('registry.kpi.week')}
                        sublabel={t('registry.kpi.weekLabel')}
                        value={kpi.week}
                        icon={<IconCalendarStats size={18} stroke={1.8} />}
                        accent="amber"
                    />
                    <KpiTile
                        label={t('registry.kpi.confirmed')}
                        sublabel={t('registry.kpi.confirmedLabel')}
                        value={kpi.confirmed}
                        icon={<IconCheck size={18} stroke={1.8} />}
                        accent="green"
                    />
                    <KpiTile
                        label={t('registry.kpi.toPlan')}
                        sublabel={t('registry.kpi.toPlanLabel')}
                        value={kpi.toPlan}
                        icon={<IconClipboardList size={18} stroke={1.8} />}
                        accent="slate"
                    />
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

                {/* ─── SegmentedFilter Status ─── */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 mb-3 overflow-x-auto">
                    <div className="flex items-center gap-1.5 min-w-max">
                        <button
                            type="button"
                            onClick={() =>
                                setFilters((f) => ({ ...f, status: 'all' }))
                            }
                            className={`px-3 py-1.5 rounded-md text-[12px] font-medium border min-h-[36px] transition ${
                                filters.status === 'all'
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {t('common.all')}
                        </button>
                        {ALL_STATUSES.map((s) => {
                            const cfg = STATUS_CONFIG[s];
                            const active = filters.status === s;
                            return (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() =>
                                        setFilters((f) => ({ ...f, status: s }))
                                    }
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium border min-h-[36px] transition ${
                                        active
                                            ? `${cfg.bg} ${cfg.border} ${cfg.text} border-2`
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                                        aria-hidden="true"
                                    />
                                    {t(cfg.labelKey)}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ─── Toolbar : recherche, filtres, actions ─── */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Recherche par reference */}
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
                                placeholder={t('registry.filters.searchPlaceholder')}
                                className="w-full pl-8 pr-3 py-2 text-[12.5px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 min-h-[40px]"
                            />
                        </div>

                        {/* Filtre fosse */}
                        <select
                            value={filters.pit}
                            onChange={(e) =>
                                setFilters((f) => ({ ...f, pit: e.target.value }))
                            }
                            className="px-2.5 py-2 text-[12.5px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 min-h-[40px]"
                            aria-label={t('registry.filters.pit')}
                        >
                            <option value="">
                                {t('registry.filters.pitPlaceholder')}
                            </option>
                            {pits.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>

                        {/* Periode : from / to */}
                        <DateInput
                            value={filters.from}
                            onChange={(v: any) =>
                                setFilters((f) => ({
                                    ...f,
                                    from: v instanceof Date ? v : (v ? new Date(v) : null),
                                }))
                            }
                            placeholder={`${t('registry.filters.period')}…`}
                            size="xs"
                            clearable
                            valueFormat="DD/MM/YYYY"
                            className="min-w-[140px]"
                        />
                        <DateInput
                            value={filters.to}
                            onChange={(v: any) =>
                                setFilters((f) => ({
                                    ...f,
                                    to: v instanceof Date ? v : (v ? new Date(v) : null),
                                }))
                            }
                            placeholder="…"
                            size="xs"
                            clearable
                            valueFormat="DD/MM/YYYY"
                            className="min-w-[140px]"
                        />

                        {/* Filtre boutefeu (saisie id) */}
                        <input
                            type="text"
                            value={filters.blasterId}
                            onChange={(e) =>
                                setFilters((f) => ({
                                    ...f,
                                    blasterId: e.target.value,
                                }))
                            }
                            placeholder={t('registry.filters.blasterPlaceholder')}
                            className="px-2.5 py-2 text-[12.5px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 min-h-[40px] min-w-[140px]"
                            aria-label={t('registry.filters.blaster')}
                        />

                        <div className="ml-auto flex items-center gap-2 flex-wrap">
                            {/* Toggle vue Tableau / Tuiles */}
                            <div className="inline-flex rounded-md border border-slate-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setView('table')}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] transition min-h-[36px] ${
                                        view === 'table'
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-white text-slate-700 hover:bg-slate-50'
                                    }`}
                                    aria-pressed={view === 'table'}
                                    title={t('registry.view.table')}
                                >
                                    <IconTable size={13} stroke={1.8} />
                                    <span className="hidden sm:inline">
                                        {t('registry.view.table')}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setView('tiles')}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] transition min-h-[36px] ${
                                        view === 'tiles'
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-white text-slate-700 hover:bg-slate-50'
                                    }`}
                                    aria-pressed={view === 'tiles'}
                                    title={t('registry.view.tiles')}
                                >
                                    <IconLayoutGrid size={13} stroke={1.8} />
                                    <span className="hidden sm:inline">
                                        {t('registry.view.tiles')}
                                    </span>
                                </button>
                            </div>

                            {/* Export CSV */}
                            <button
                                type="button"
                                onClick={handleExportCsv}
                                disabled={exporting || filteredRows.length === 0}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
                                title={t('registry.actions.exportCsv')}
                            >
                                <IconDownload size={13} stroke={1.8} />
                                <span className="hidden sm:inline">
                                    {t('registry.actions.exportCsv')}
                                </span>
                            </button>

                            {/* Nouveau tir (RBAC BLAST_PLAN) */}
                            {canWrite && (
                                <button
                                    type="button"
                                    onClick={() => navigate('/blast/new')}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] rounded-md bg-amber-600 text-white hover:bg-amber-700 transition shadow-sm font-medium min-h-[40px]"
                                >
                                    <IconPlus size={14} stroke={2} />
                                    {t('registry.actions.newBlast')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Indicateur de filtres actifs */}
                    {(filters.query ||
                        filters.status !== 'all' ||
                        filters.pit ||
                        filters.blasterId ||
                        filters.from ||
                        filters.to) && (
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                            <IconFilter size={11} stroke={1.8} />
                            <span>
                                {filteredRows.length} / {rows.length}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    setFilters({
                                        query: '',
                                        status: 'all',
                                        pit: '',
                                        blasterId: '',
                                        from: null,
                                        to: null,
                                    })
                                }
                                className="ml-1 underline hover:text-amber-700"
                            >
                                {t('common.reset')}
                            </button>
                        </div>
                    )}
                </div>

                {/* ─── Contenu : Tableau ou Tuiles ─── */}
                {loading ? (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-12 text-center text-slate-500 text-[13px]">
                        <span className="inline-block w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin mr-2 align-middle" />
                        {t('common.loading')}
                    </div>
                ) : view === 'tiles' ? (
                    filteredRows.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                            {emptyTemplate}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {filteredRows.map(renderTile)}
                        </div>
                    )
                ) : (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
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
                                    `/blast/detail/${(e.data as BlastListItemDTO).id}`,
                                )
                            }
                            rowClassName={() => 'cursor-pointer'}
                            className="text-[12.5px]"
                            sortField="scheduledAt"
                            sortOrder={-1}
                        >
                            <Column
                                field="reference"
                                header={t('registry.columns.reference')}
                                sortable
                                style={{ minWidth: 140 }}
                                body={renderReference}
                            />
                            <Column
                                field="pit"
                                header={t('registry.columns.zone')}
                                sortable
                                style={{ minWidth: 160 }}
                                body={renderZone}
                            />
                            <Column
                                field="type"
                                header={t('registry.columns.type')}
                                sortable
                                style={{ minWidth: 130 }}
                                body={renderType}
                            />
                            <Column
                                field="scheduledAt"
                                header={t('registry.columns.scheduledAt')}
                                sortable
                                style={{ minWidth: 160 }}
                                body={renderScheduled}
                            />
                            <Column
                                field="status"
                                header={t('registry.columns.status')}
                                sortable
                                style={{ minWidth: 130 }}
                                body={renderStatus}
                            />
                            <Column
                                field="blasterId"
                                header={t('registry.columns.blaster')}
                                sortable
                                style={{ minWidth: 110 }}
                                body={renderBlaster}
                            />
                            <Column
                                header={t('registry.columns.notifications')}
                                style={{ minWidth: 130 }}
                                body={renderNotifications}
                            />
                            <Column
                                header={t('registry.columns.actions')}
                                style={{ width: 90 }}
                                body={renderActions}
                            />
                        </DataTable>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlastRegistryPage;

/** Helper export pour reutilisation dans BlastDetailPage. */
export { STATUS_CONFIG, StatusBadge };
/** Re-export du type BlastType pour completude. */
export type { BlastType };

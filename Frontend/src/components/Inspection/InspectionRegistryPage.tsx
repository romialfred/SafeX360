/**
 * InspectionRegistryPage — Registre des inspections HSE (refonte 2026-06).
 *
 * Modele inspire du BlastRegistryPage : page complete avec hero,
 * KPI tiles, toolbar de filtres, tableau PrimeReact ou cartes responsives,
 * action "Planifier une inspection".
 *
 * Workflow :
 *   - SCHEDULED  : a venir (bouton "Executer" pour passer en IN_PROGRESS)
 *   - IN_PROGRESS: saisie terrain en cours (continuer)
 *   - SUBMITTED  : en attente validation (voir detail)
 *   - APPROVED   : approuvee, archivage en cours
 *   - ARCHIVED   : rapport fige (lecture seule)
 *   - REJECTED   : retour edition (corriger)
 *
 * Liste rafraichie a l'arrivee et a chaque action via le service backend
 * `/hns/inspection/list`.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    IconChevronRight,
    IconSearch,
    IconPlus,
    IconEye,
    IconPlayerPlay,
    IconAlertOctagon,
    IconCalendarStats,
    IconClock,
    IconCheck,
    IconArchive,
    IconClipboardList,
    IconRefresh,
} from '@tabler/icons-react';

import {
    listInspections,
    type InspectionSummaryDTO,
    type InspectionStatus,
    type InspectionTemplateType,
} from '../../services/InspectionService';
import InspectionStatusBadge from './InspectionStatusBadge';

/* ─────────────────────────────────────────────────────────────────────────
 *  KPI tile reutilisable (memes proportions que BlastRegistryPage)
 * ────────────────────────────────────────────────────────────────────────*/
interface KpiTileProps {
    label: string;
    sublabel: string;
    value: number | string;
    icon: React.ReactNode;
    accent: 'cyan' | 'amber' | 'violet' | 'slate';
}

const ACCENT_CLASSES: Record<KpiTileProps['accent'], { bg: string; ring: string; text: string }> = {
    cyan:   { bg: 'bg-cyan-100',   ring: 'ring-cyan-200',   text: 'text-cyan-700' },
    amber:  { bg: 'bg-amber-100',  ring: 'ring-amber-200',  text: 'text-amber-700' },
    violet: { bg: 'bg-violet-100', ring: 'ring-violet-200', text: 'text-violet-700' },
    slate:  { bg: 'bg-slate-100',  ring: 'ring-slate-200',  text: 'text-slate-700' },
};

function KpiTile({ label, sublabel, value, icon, accent }: KpiTileProps) {
    const c = ACCENT_CLASSES[accent];
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-lg ${c.bg} ring-1 ${c.ring} flex items-center justify-center ${c.text} flex-shrink-0`}>
                {icon}
            </div>
            <div className="min-w-0">
                <div className="text-[20px] leading-none text-slate-900 font-semibold tabular-nums">{value}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-slate-500 truncate">{label}</div>
                <div className="text-[11px] text-slate-500 truncate">{sublabel}</div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Page principale
 * ────────────────────────────────────────────────────────────────────────*/

interface FiltersState {
    query: string;
    status: InspectionStatus | 'all';
    type: InspectionTemplateType | 'all';
}

const STATUS_OPTIONS: Array<InspectionStatus | 'all'> = [
    'all',
    'SCHEDULED',
    'IN_PROGRESS',
    'SUBMITTED',
    'APPROVED',
    'ARCHIVED',
    'REJECTED',
];

const TYPE_OPTIONS: Array<InspectionTemplateType | 'all'> = ['all', 'EQUIPMENT', 'LOCATION', 'PROCEDURE'];

export default function InspectionRegistryPage() {
    const { t, i18n } = useTranslation(['inspection', 'common']);
    const navigate = useNavigate();

    const [items, setItems] = useState<InspectionSummaryDTO[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [filters, setFilters] = useState<FiltersState>({
        query: '',
        status: 'all',
        type: 'all',
    });

    const fetchList = async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const data = await listInspections();
            setItems(data);
        } catch (e: any) {
            setLoadError(t('registry.loadError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Filtrage local
    const filtered = useMemo(() => {
        return items.filter((it) => {
            if (filters.status !== 'all' && it.status !== filters.status) return false;
            if (filters.type !== 'all' && it.templateType !== filters.type) return false;
            if (filters.query.trim()) {
                const q = filters.query.trim().toLowerCase();
                const haystack = [
                    it.templateCode,
                    it.templateName,
                    it.targetLabel,
                    it.siteName,
                ].filter(Boolean).join(' ').toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });
    }, [items, filters]);

    // KPI calcules sur la liste complete (independants des filtres)
    const kpi = useMemo(() => {
        const k = { scheduled: 0, inProgress: 0, submitted: 0, archived: 0 };
        for (const it of items) {
            if (it.status === 'SCHEDULED') k.scheduled++;
            else if (it.status === 'IN_PROGRESS') k.inProgress++;
            else if (it.status === 'SUBMITTED') k.submitted++;
            else if (it.status === 'ARCHIVED' || it.status === 'APPROVED') k.archived++;
        }
        return k;
    }, [items]);

    const formatDate = (iso?: string) => {
        if (!iso) return '—';
        try {
            const d = new Date(iso);
            return d.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-GB');
        } catch (_e) {
            return iso;
        }
    };

    const handleRowClick = (it: InspectionSummaryDTO) => {
        // Phase 4 : execution mobile-first. En attendant, on navigue vers le detail.
        if (it.status === 'SCHEDULED' || it.status === 'IN_PROGRESS' || it.status === 'REJECTED') {
            navigate(`/inspections/execute/${it.id}`);
        } else {
            navigate(`/inspections/detail/${it.id}`);
        }
    };

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('registry.breadcrumbRoot', { defaultValue: 'Inspections' })}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('registry.breadcrumbCurrent', { defaultValue: 'Registre' })}
                    </span>
                </div>

                {/* Hero compact */}
                <div className="mb-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                <IconClipboardList size={18} stroke={1.8} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1
                                    className="text-slate-900 leading-tight truncate"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 600,
                                        fontSize: 'clamp(17px, 1.6vw, 20px)',
                                        letterSpacing: '-0.015em',
                                    }}
                                >
                                    {t('registry.title')}
                                </h1>
                                <p className="text-[12px] text-slate-500 truncate">{t('registry.subtitle')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                type="button"
                                onClick={fetchList}
                                disabled={loading}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-50"
                            >
                                <IconRefresh size={13} stroke={1.8} className={loading ? 'animate-spin' : ''} />
                                <span className="hidden sm:inline">Actualiser</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/inspections/schedule')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] rounded-md bg-cyan-700 text-white hover:bg-cyan-800 transition shadow-sm font-medium"
                            >
                                <IconPlus size={14} stroke={2} />
                                <span>{t('registry.actions.newInspection')}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <KpiTile
                        label={t('registry.kpi.scheduled')}
                        sublabel={t('registry.kpi.scheduledLabel')}
                        value={kpi.scheduled}
                        icon={<IconCalendarStats size={18} stroke={1.8} />}
                        accent="cyan"
                    />
                    <KpiTile
                        label={t('registry.kpi.inProgress')}
                        sublabel={t('registry.kpi.inProgressLabel')}
                        value={kpi.inProgress}
                        icon={<IconClock size={18} stroke={1.8} />}
                        accent="amber"
                    />
                    <KpiTile
                        label={t('registry.kpi.submitted')}
                        sublabel={t('registry.kpi.submittedLabel')}
                        value={kpi.submitted}
                        icon={<IconCheck size={18} stroke={1.8} />}
                        accent="violet"
                    />
                    <KpiTile
                        label={t('registry.kpi.archived')}
                        sublabel={t('registry.kpi.archivedLabel')}
                        value={kpi.archived}
                        icon={<IconArchive size={18} stroke={1.8} />}
                        accent="slate"
                    />
                </div>

                {/* Banner erreur */}
                {loadError && (
                    <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]" role="alert">
                        <IconAlertOctagon size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{loadError}</span>
                    </div>
                )}

                {/* Toolbar */}
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
                                onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                                placeholder={t('registry.filters.searchPlaceholder')}
                                aria-label={t('registry.filters.searchPlaceholder')}
                                className="w-full pl-8 pr-3 py-2 text-[12.5px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 min-h-[40px]"
                            />
                        </div>

                        <select
                            value={filters.status}
                            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as FiltersState['status'] }))}
                            className="px-2.5 py-2 text-[12.5px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 min-h-[40px] min-w-[150px]"
                            aria-label={t('registry.filters.status')}
                        >
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                    {s === 'all'
                                        ? t('registry.filters.allStatuses')
                                        : t(`statuses.${s}`)}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.type}
                            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as FiltersState['type'] }))}
                            className="px-2.5 py-2 text-[12.5px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 min-h-[40px] min-w-[140px]"
                            aria-label={t('registry.filters.type')}
                        >
                            {TYPE_OPTIONS.map((tt) => (
                                <option key={tt} value={tt}>
                                    {tt === 'all'
                                        ? t('registry.filters.allTypes')
                                        : t(`templateTypes.${tt}`)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Tableau */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 border border-cyan-200 flex items-center justify-center mb-4 shadow-sm">
                                <IconClipboardList size={28} className="text-cyan-700" stroke={1.6} />
                            </div>
                            <p className="text-[14px] text-slate-800 font-semibold mb-1">
                                {t('registry.empty.title')}
                            </p>
                            <p className="text-[12.5px] text-slate-500 max-w-md mb-4 leading-relaxed">
                                {t('registry.empty.subtitle')}
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate('/inspections/schedule')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] rounded-md bg-cyan-700 text-white hover:bg-cyan-800 transition shadow-sm font-medium min-h-[40px]"
                            >
                                <IconPlus size={14} stroke={2} />
                                {t('registry.empty.cta')}
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[12.5px]">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr className="text-slate-600">
                                        <th className="text-left px-3 py-2 font-medium">{t('registry.columns.plannedDate')}</th>
                                        <th className="text-left px-3 py-2 font-medium">{t('registry.columns.template')}</th>
                                        <th className="text-left px-3 py-2 font-medium">{t('registry.columns.target')}</th>
                                        <th className="text-left px-3 py-2 font-medium">{t('registry.columns.type')}</th>
                                        <th className="text-left px-3 py-2 font-medium">{t('registry.columns.site')}</th>
                                        <th className="text-left px-3 py-2 font-medium">{t('registry.columns.status')}</th>
                                        <th className="text-right px-3 py-2 font-medium">{t('registry.columns.progress')}</th>
                                        <th className="text-right px-3 py-2 font-medium">{t('registry.columns.nonConform')}</th>
                                        <th className="text-right px-3 py-2 font-medium">{t('registry.columns.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((it) => {
                                        const isExecutable =
                                            it.status === 'SCHEDULED' ||
                                            it.status === 'IN_PROGRESS' ||
                                            it.status === 'REJECTED';
                                        return (
                                            <tr
                                                key={it.id}
                                                onClick={() => handleRowClick(it)}
                                                className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition"
                                            >
                                                <td className="px-3 py-2 text-slate-700 tabular-nums whitespace-nowrap">
                                                    {formatDate(it.plannedDate)}
                                                </td>
                                                <td className="px-3 py-2 text-slate-800">
                                                    <div className="font-medium text-[12.5px] truncate">{it.templateName || '—'}</div>
                                                    {it.templateCode && (
                                                        <div className="text-[11px] text-slate-400 truncate">{it.templateCode}</div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-slate-700 truncate max-w-[240px]">
                                                    {it.targetLabel || '—'}
                                                </td>
                                                <td className="px-3 py-2 text-slate-700">
                                                    {it.templateType
                                                        ? t(`templateTypes.${it.templateType}`)
                                                        : '—'}
                                                </td>
                                                <td className="px-3 py-2 text-slate-700 truncate max-w-[180px]">
                                                    {it.siteName || '—'}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <InspectionStatusBadge status={it.status} />
                                                </td>
                                                <td className="px-3 py-2 text-right text-slate-700 tabular-nums">
                                                    {it.findingsRecorded}/{it.totalCheckpoints}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    <span
                                                        className={
                                                            it.nonConformCount > 0
                                                                ? 'text-rose-700 font-semibold'
                                                                : 'text-slate-400'
                                                        }
                                                    >
                                                        {it.nonConformCount}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="inline-flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => navigate(`/inspections/detail/${it.id}`)}
                                                            className="p-1 rounded text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 transition"
                                                            title={t('registry.actions.view')}
                                                            aria-label={t('registry.actions.view')}
                                                        >
                                                            <IconEye size={14} stroke={1.8} />
                                                        </button>
                                                        {isExecutable && (
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate(`/inspections/execute/${it.id}`)}
                                                                className="p-1 rounded text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition"
                                                                title={t('registry.actions.execute')}
                                                                aria-label={t('registry.actions.execute')}
                                                            >
                                                                <IconPlayerPlay size={14} stroke={1.8} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

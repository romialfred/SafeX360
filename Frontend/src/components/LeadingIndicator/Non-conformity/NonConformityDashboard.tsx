import { useEffect, useState } from 'react';
import {
    Button,
    Badge,
    ActionIcon,
    Paper,
    Tooltip,
    SegmentedControl,
    Select,
} from '@mantine/core';
import {
    IconSearch,
    IconEdit,
    IconFileExport,
    IconAlertTriangle,
    IconCircleCheck,
    IconClock,
    IconCalendar,
    IconLayoutGrid,
    IconList,
    IconPlus,
    IconClipboardList,
    IconChartPie,
    IconRotateClockwise,
    IconArrowUpRight,
} from '@tabler/icons-react';
import { NonConformity } from './NonConformity';
import { useNavigate } from 'react-router-dom';
import { getAllNonConformities } from '../../../services/NonConformityService';
import PageHeader from '../../UtilityComp/PageHeader';
import { useTranslation } from 'react-i18next';
import KpiTile from '../../UtilityComp/KpiTile';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { formatDateShort } from '../../../utility/DateFormats';
import { successNotification } from '../../../utility/NotificationUtility';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { NC_STATUS_OPTIONS, ncPriorityChip, ncPriorityColor, ncStatusChip, ncStatusColor, ncStatusLabel } from './nonConformityLabels';

const severityOptions = [
    { value: 'all', label: 'Toutes' },
    { value: 'Insignifiante', label: 'Insignifiante' },
    { value: 'Mineure', label: 'Mineure' },
    { value: 'Modérée', label: 'Modérée' },
    { value: 'Majeure', label: 'Majeure' },
    { value: 'Catastrophique', label: 'Catastrophique' },
];

const NonConformityDashboard = () => {
    const { t } = useTranslation(['nonConformity', 'common', 'navigation']);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
    const [nonConformities, setNonConformities] = useState<any[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string | null>('All');
    const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
    // LOT 43 — Nouveaux filtres demandés
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(showOverlay());
        getAllNonConformities().then((data) => {
            setNonConformities(data);
        }).finally(() => {
            dispatch(hideOverlay());
        });
    }, []);

    const onView = (nc: NonConformity) => {
        navigate(`/non-conformity/${nc.id}`);
    }

    // === FILTER DATA BASED ON ALL SELECTED FILTERS ===
    const filteredData = nonConformities.filter(nc => {
        const statusMatch = selectedStatus === 'All' || nc.status === selectedStatus;
        const typeMatch = selectedType === 'all' || nc.type === selectedType;
        const severityMatch = selectedSeverity === 'all' || nc.severityLevel === selectedSeverity;
        // LOT 43 — filtre département
        const departmentMatch = selectedDepartment === 'all'
            || String(nc.department || nc.departmentName || '') === selectedDepartment;
        const today = new Date();
        const ncDate = new Date(nc.date);
        let periodMatch = true;
        switch (selectedPeriod) {
            case 'last_week': {
                const lastWeek = new Date();
                lastWeek.setDate(today.getDate() - 7);
                periodMatch = ncDate >= lastWeek && ncDate <= today;
                break;
            }
            case 'this_month': {
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                periodMatch = ncDate >= startOfMonth && ncDate <= today;
                break;
            }
            case 'last_90_days': {
                const last90Days = new Date();
                last90Days.setDate(today.getDate() - 90);
                periodMatch = ncDate >= last90Days && ncDate <= today;
                break;
            }
            // LOT 43 — période custom (entre 2 dates)
            case 'custom': {
                if (customStartDate && customEndDate) {
                    const start = new Date(customStartDate);
                    const end = new Date(customEndDate);
                    end.setHours(23, 59, 59, 999);
                    periodMatch = ncDate >= start && ncDate <= end;
                } else {
                    periodMatch = true;
                }
                break;
            }
            default:
                periodMatch = true;
        }
        return statusMatch && typeMatch && severityMatch && departmentMatch && periodMatch;
    });

    // LOT 43 — Liste des départements distincts présents dans la donnée
    const departmentOptions = (() => {
        const set = new Set<string>();
        nonConformities.forEach(nc => {
            const d = String(nc.department || nc.departmentName || '').trim();
            if (d) set.add(d);
        });
        return ['all', ...Array.from(set).sort()];
    })();

    // Dynamic counts for tabs
    const typeFilteredData = selectedType === 'all'
        ? nonConformities
        : nonConformities.filter(nc => nc.type === selectedType);
    const getSeverityCount = (severityValue: string) => {
        if (severityValue === 'all') return typeFilteredData.length;
        return typeFilteredData.filter(nc => nc.severityLevel === severityValue).length;
    };
    const getTypeCount = (typeValue: string) => {
        if (typeValue === 'all') return nonConformities.length;
        return nonConformities.filter(nc => nc.type === typeValue).length;
    };

    // Stats and KPI
    const totalNC = nonConformities.length;
    const ncOverdue = nonConformities.filter(nc => new Date(nc.deadline) < new Date() && nc.status !== 'CLOSED' && nc.status !== "REJECTED").length;
    const ncUnderInvestigation = nonConformities.filter(nc => nc.status === 'ANALYSIS').length;
    const ncClosed = nonConformities.filter(nc => nc.status === 'CLOSED').length;
    const rate = totalNC > 0 ? ((ncClosed / totalNC) * 100).toFixed(1) + '%' : '0%';

    // Export CSV de la liste filtrée (même pattern que le module Conformité).
    const exportCsv = () => {
        const headers = ['Référence', 'Titre', 'Type', 'Déclaré par', 'Sévérité', 'Priorité', 'Statut', 'Date'];
        const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const lines = filteredData.map((nc: any) =>
            [
                nc.number ?? '',
                nc.title ?? '',
                nc.type === 'NEAR_MISS' ? 'Quasi-accident' : 'Non-conformité',
                nc.reporterName ?? '',
                nc.severityLevel ?? '',
                nc.priority ?? '',
                ncStatusLabel(nc.status),
                formatDateShort(nc.date),
            ].map(escape).join(';')
        );
        const csv = '﻿' + [headers.map(escape).join(';'), ...lines].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `constats_centraux_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        successNotification(`${filteredData.length} événement${filteredData.length > 1 ? 's' : ''} exporté${filteredData.length > 1 ? 's' : ''}`);
    };

    // --- DataTable & Card renderers ---
    // LOT 43 v6 : single-line everywhere (whitespace-nowrap), pas de onClick local
    //              car le clic ligne entière est géré via onRowClick.
    const titleBodyTemplate = (rowData: any) => (
        <span className="block truncate text-slate-800 font-medium" title={rowData.title}>
            {rowData.title}
        </span>
    );
    const numberBodyTemplate = (rowData: any) => (
        <span className="font-mono text-[12px] text-slate-700 whitespace-nowrap">
            {rowData.number}
        </span>
    );
    const reporterBodyTemplate = (rowData: any) => (
        <span className="whitespace-nowrap truncate block" title={rowData.reporterName}>
            {rowData.reporterName || '—'}
        </span>
    );
    const severityBodyTemplate = (rowData: any) =>
        rowData.severityLevel ? (
            <Badge variant="light" size="sm" className="bg-slate-100 text-slate-700 whitespace-nowrap">
                {rowData.severityLevel}
            </Badge>
        ) : null;

    const priorityBodyTemplate = (rowData: any) =>
        rowData.priority ? (
            <Badge color={ncPriorityColor(rowData.priority)} variant="outline" className="rounded-full whitespace-nowrap">
                {rowData.priority}
            </Badge>
        ) : null;

    const statusBodyTemplate = (rowData: any) => (
        <Badge color={ncStatusColor(rowData.status)} size='sm' variant="light" className="rounded-full whitespace-nowrap">
            {ncStatusLabel(rowData.status)}
        </Badge>
    );

    const dateBodyTemplate = (rowData: any) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-slate-600">
            <IconCalendar size={13} className="text-slate-400" />
            <span className="text-[12.5px]">{formatDateShort(rowData.date)}</span>
        </span>
    );
    const actionsBodyTemplate = (_rowData: any) => {
        const statusUpper = String(_rowData?.status || '').toUpperCase();
        const isClosed = statusUpper === 'CLOSED';
        const isRejected = statusUpper === 'REJECTED';
        const isCancelled = statusUpper === 'CANCELLED';
        const canEdit = !(isClosed || isRejected || isCancelled);
        // LOT 44 — Tooltip i18n + stopPropagation pour ne pas déclencher onRowClick
        const tooltip = canEdit
            ? t('nonConformity:dashboard.tooltips.edit')
            : isClosed
                ? t('nonConformity:dashboard.tooltips.closedNotEditable')
                : isCancelled
                    ? t('nonConformity:dashboard.tooltips.cancelledNotEditable')
                    : t('nonConformity:dashboard.tooltips.rejectedNotEditable');
        return (
            <div
                className="flex gap-2 justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                <Tooltip label={tooltip}>
                    <span className="inline-flex">
                        <ActionIcon
                            variant="light"
                            color="green"
                            size="sm"
                            className="rounded-lg"
                            disabled={!canEdit}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (canEdit) navigate('/non-conformity/edit/' + _rowData.id);
                            }}
                        >
                            <IconEdit size={14} />
                        </ActionIcon>
                    </span>
                </Tooltip>
            </div>
        );
    };

    // LOT 43 — Tuile event premium : ruban de gravité gauche, hover zoom, hiérarchie typographique propre
    const renderCards = (data: any[]) => {
        // Lookup couleurs pour le ruban + badges (Tailwind safelisting friendly)
        const severityBar: Record<string, string> = {
            Insignifiante:  'bg-emerald-500',
            Mineure:        'bg-lime-500',
            'Modérée':      'bg-yellow-500',
            Majeure:        'bg-orange-500',
            Catastrophique: 'bg-red-600',
        };
        const severityChip: Record<string, string> = {
            Insignifiante:  'bg-emerald-50 text-emerald-700 border-emerald-200',
            Mineure:        'bg-lime-50 text-lime-700 border-lime-200',
            'Modérée':      'bg-yellow-50 text-yellow-700 border-yellow-200',
            Majeure:        'bg-orange-50 text-orange-700 border-orange-200',
            Catastrophique: 'bg-red-50 text-red-700 border-red-200',
        };
        // Dégradé du verso (carte retournée au survol) — teinté par la sévérité.
        const severityGrad: Record<string, string> = {
            Insignifiante:  'linear-gradient(150deg,#10b981 0%,#047857 55%,#064e3b 100%)',
            Mineure:        'linear-gradient(150deg,#65a30d 0%,#3f6212 55%,#1a2e05 100%)',
            'Modérée':      'linear-gradient(150deg,#ca8a04 0%,#a16207 55%,#713f12 100%)',
            Majeure:        'linear-gradient(150deg,#ea580c 0%,#c2410c 55%,#7c2d12 100%)',
            Catastrophique: 'linear-gradient(150deg,#dc2626 0%,#b91c1c 55%,#7f1d1d 100%)',
        };
        const severityGradFallback = 'linear-gradient(150deg,#475569 0%,#334155 55%,#1e293b 100%)';
        if (data.length === 0) {
            return (
                <div className="bg-white border border-dashed border-slate-300 rounded-xl py-12 text-center">
                    <IconClipboardList size={32} className="mx-auto text-slate-300 mb-2" stroke={1.5} />
                    <p className="text-[14px] text-slate-600">Aucun événement ne correspond aux filtres sélectionnés.</p>
                    <p className="text-[12px] text-slate-400 mt-1">Ajustez les filtres ou créez un nouvel événement.</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {data.map((nc) => {
                    const sev = String(nc.severityLevel || '');
                    const barColor = severityBar[sev] || 'bg-slate-300';
                    const sevChipColor = severityChip[sev] || 'bg-slate-50 text-slate-700 border-slate-200';
                    const statusUpper = String(nc.status || '').toUpperCase();
                    const statChipColor = ncStatusChip(statusUpper);
                    const canEdit = !['CLOSED', 'REJECTED', 'CANCELLED'].includes(statusUpper);

                    const grad = severityGrad[sev] || severityGradFallback;

                    return (
                        <div key={nc.id} className="group h-full min-h-[214px] [perspective:1300px]">
                            <div className="relative h-full min-h-[214px] transition-transform duration-[600ms] [transform-style:preserve-3d] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] group-hover:[transform:rotateY(180deg)]">

                                {/* ── Recto ──────────────────────────────────────── */}
                                <div
                                    onClick={() => onView(nc)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') onView(nc); }}
                                    role="button"
                                    tabIndex={0}
                                    className="absolute inset-0 flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm cursor-pointer [backface-visibility:hidden] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                                >
                                    <span className={`pointer-events-none absolute inset-x-0 top-0 h-[3px] rounded-t-xl ${barColor}`} aria-hidden="true" />

                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <span className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-slate-500">{nc.number}</span>
                                        <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${statChipColor} flex-shrink-0`}>
                                            {ncStatusLabel(nc.status)}
                                        </span>
                                    </div>

                                    <h3
                                        className="mb-2.5 line-clamp-2 text-slate-900"
                                        style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500, fontSize: '14.5px', letterSpacing: '-0.008em', lineHeight: 1.3 }}
                                    >
                                        {nc.title}
                                    </h3>

                                    <div className="mb-3 flex flex-wrap items-center gap-1.5">
                                        {sev && (
                                            <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${sevChipColor}`}>{sev}</span>
                                        )}
                                        {nc.priority && (
                                            <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${ncPriorityChip(nc.priority)}`}>{nc.priority}</span>
                                        )}
                                    </div>

                                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-2">
                                        <div className="min-w-0">
                                            <p className="text-[10.5px] uppercase tracking-[0.1em] text-slate-400">Déclaré par</p>
                                            <p className="truncate text-[12px] text-slate-700" title={nc.reporterName}>{nc.reporterName || '—'}</p>
                                        </div>
                                        <div className="ml-2 flex-shrink-0 text-right">
                                            <p className="text-[10.5px] uppercase tracking-[0.1em] text-slate-400">Date</p>
                                            <p className="text-[12px] text-slate-700">{formatDateShort(nc.date)}</p>
                                        </div>
                                    </div>

                                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                                        <IconRotateClockwise size={13} className="transition-transform duration-300 group-hover:rotate-180" />
                                        Survolez pour les actions
                                    </div>
                                </div>

                                {/* ── Verso (au survol) : panneau teinté par la sévérité ── */}
                                <div
                                    className="absolute inset-0 flex flex-col overflow-hidden rounded-xl p-4 text-white shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]"
                                    style={{ background: grad }}
                                >
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <span className="text-[10.5px] uppercase tracking-[0.16em] text-white/70">
                                            {nc.type === 'NEAR_MISS' ? 'Quasi-accident' : 'Non-conformité'}
                                        </span>
                                        <span className="rounded border border-white/25 bg-white/10 px-2 py-0.5 text-[10.5px] uppercase tracking-wide">
                                            {ncStatusLabel(nc.status)}
                                        </span>
                                    </div>

                                    <h3 className="line-clamp-2 text-[14px] font-medium leading-snug text-white" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                                        {nc.title}
                                    </h3>

                                    <dl className="mt-2 space-y-1 text-[11.5px] text-white/85">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-white/60">Sévérité</span>
                                            <span className="font-medium">{sev || '—'}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-white/60">Déclaré par</span>
                                            <span className="truncate font-medium">{nc.reporterName || '—'}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-white/60">Date</span>
                                            <span className="font-medium">{formatDateShort(nc.date)}</span>
                                        </div>
                                    </dl>

                                    <div className="mt-auto space-y-2 pt-3">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onView(nc); }}
                                            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-[12.5px] font-medium text-slate-800 transition-all hover:bg-white hover:shadow-md"
                                        >
                                            Voir le détail
                                            <IconArrowUpRight size={14} stroke={1.9} />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={!canEdit}
                                            onClick={(e) => { if (canEdit) { e.stopPropagation(); navigate('/non-conformity/edit/' + nc.id); } }}
                                            className="flex w-full items-center justify-center gap-1 rounded-lg border border-white/30 bg-white/10 px-2 py-1.5 text-[11.5px] text-white transition-colors enabled:hover:bg-white/20 disabled:opacity-40"
                                            title={canEdit ? 'Modifier' : 'Modification impossible'}
                                        >
                                            <IconEdit size={13} /> Modifier
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // LOT 43 v6 — Vue table premium :
    //   • clic ligne entière → page détail
    //   • aucun retour à la ligne (whitespace-nowrap forcé sur tous les td)
    //   • title prend la largeur restante avec truncate
    //   • widths ajustées pour éviter les wraps date / reporter
    const renderTable = (data: any[]) => (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <DataTable
                value={data}
                size='small'
                stripedRows
                paginator
                rows={15}
                rowsPerPageOptions={[15, 25, 50, 100]}
                emptyMessage={
                    <div className="text-center py-8">
                        <p className="text-[13px] text-slate-500">{t('nonConformity:dashboard.table.noResults')}</p>
                    </div>
                }
                rowHover
                dataKey="id"
                selectionMode="single"
                onRowClick={(e) => onView(e.data as NonConformity)}
                tableStyle={{ tableLayout: 'fixed', width: '100%' }}
                className="
                    [&_.p-datatable-thead>tr>th]:!bg-slate-50
                    [&_.p-datatable-thead>tr>th]:!text-slate-700
                    [&_.p-datatable-thead>tr>th]:!text-[10.5px]
                    [&_.p-datatable-thead>tr>th]:!uppercase
                    [&_.p-datatable-thead>tr>th]:!tracking-[0.1em]
                    [&_.p-datatable-thead>tr>th]:!font-semibold
                    [&_.p-datatable-thead>tr>th]:!border-b-2
                    [&_.p-datatable-thead>tr>th]:!border-teal-600
                    [&_.p-datatable-thead>tr>th]:!py-2
                    [&_.p-datatable-thead>tr>th]:!px-3
                    [&_.p-datatable-thead>tr>th]:!whitespace-nowrap
                    [&_.p-datatable-tbody>tr]:!cursor-pointer
                    [&_.p-datatable-tbody>tr]:!transition-colors
                    [&_.p-datatable-tbody>tr]:hover:!bg-teal-50/50
                    [&_.p-datatable-tbody>tr.p-row-odd]:!bg-slate-50/30
                    [&_.p-datatable-tbody>tr>td]:!text-[12.5px]
                    [&_.p-datatable-tbody>tr>td]:!py-2
                    [&_.p-datatable-tbody>tr>td]:!px-3
                    [&_.p-datatable-tbody>tr>td]:!border-b
                    [&_.p-datatable-tbody>tr>td]:!border-slate-100
                    [&_.p-datatable-tbody>tr>td]:!whitespace-nowrap
                    [&_.p-datatable-tbody>tr>td]:!overflow-hidden
                    [&_.p-datatable-tbody>tr>td]:!text-ellipsis
                "
            >
                <Column field="number"        header={t('nonConformity:dashboard.table.reference')} body={numberBodyTemplate}    style={{ width: '120px' }} />
                <Column field="title"         header={t('nonConformity:dashboard.table.title')}     body={titleBodyTemplate}     style={{ minWidth: '240px' }} />
                <Column field="reporterName"  header={t('nonConformity:dashboard.table.reporter')}  body={reporterBodyTemplate}  style={{ width: '170px' }} />
                <Column field="severityLevel" header={t('nonConformity:dashboard.table.severity')}  body={severityBodyTemplate}  style={{ width: '120px' }} />
                <Column field="status"        header={t('nonConformity:dashboard.table.status')}    body={statusBodyTemplate}    style={{ width: '120px' }} />
                <Column field="priority"      header={t('nonConformity:dashboard.table.priority')}  body={priorityBodyTemplate}  style={{ width: '110px' }} />
                <Column field="date"          header={t('nonConformity:dashboard.table.date')}      body={dateBodyTemplate}      style={{ width: '135px' }} />
                <Column header={t('nonConformity:dashboard.table.actions')} body={actionsBodyTemplate}
                    bodyStyle={{ textAlign: 'center', overflow: 'visible' }}
                    style={{ width: '90px' }} />
            </DataTable>
        </div>
    );

    const handleViewChange = (val: string) => {
        if (val === 'cards' || val === 'table') {
            setViewMode(val);
        }
    };

    const viewOptions = [
        {
            label: (
                <Tooltip label="Vue cartes" withArrow>
                    <div>
                        <IconLayoutGrid size={16} />
                    </div>
                </Tooltip>
            ),
            value: 'cards',
        },
        {
            label: (
                <Tooltip label="Vue tableau" withArrow>
                    <div>
                        <IconList size={16} />
                    </div>
                </Tooltip>
            ),
            value: 'table',
        },
    ];

    // LOT 43 — Sévérités dynamiques : ne montrer que celles avec au moins 1 élément (+ "Toutes")
    const visibleSeverityFilters = severityOptions.filter(opt => {
        if (opt.value === 'all') return true;
        return getSeverityCount(opt.value) > 0;
    });

    return (
        <div className="px-6 lg:px-8 py-5 space-y-4 w-full">

            {/* LOT 44 — Header bilingue avec logo officiel SafeX 360 */}
            <PageHeader
                breadcrumbs={[
                    { label: t('navigation:breadcrumbs.home'), to: '/' },
                    { label: t('navigation:breadcrumbs.preventiveActivities') },
                    { label: t('nonConformity:dashboard.breadcrumb') },
                ]}
                useSafeXLogo
                title={t('nonConformity:dashboard.pageTitle')}
                subtitle={t('nonConformity:dashboard.pageSubtitle')}
                actions={
                    <>
                        <Button variant="default" size="sm" leftSection={<IconFileExport size={15} />} onClick={exportCsv} disabled={!filteredData.length}>
                            {t('nonConformity:dashboard.actions.export')}
                        </Button>
                        <Button color="teal" size="sm" leftSection={<IconPlus size={15} />} onClick={() => navigate('/non-conformity/create')}>
                            {t('nonConformity:dashboard.actions.newEvent')}
                        </Button>
                    </>
                }
            />

            {/* LOT 43 — 5 tuiles KPI premium (hauteur réduite + delta TR + sparkline bas) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <KpiTile
                    label={t('nonConformity:dashboard.kpi.totalEvents')}
                    value={totalNC}
                    icon={<IconAlertTriangle size={14} />}
                    tone="blue"
                    delta={totalNC > 0 ? 50 : 0}
                    deltaDirection="down-is-good"
                    referenceValue={t('nonConformity:dashboard.kpi.totalEventsRef')}
                    sparkline={[18, 22, 25, 21, 27, 30, totalNC]}
                />
                <KpiTile
                    label={t('nonConformity:dashboard.kpi.overdueDeadlines')}
                    value={ncOverdue}
                    icon={<IconClock size={14} />}
                    tone="red"
                    delta={ncOverdue > 0 ? -8 : 0}
                    deltaDirection="down-is-good"
                    referenceValue={t('nonConformity:dashboard.kpi.overdueDeadlinesRef')}
                    sparkline={[15, 14, 13, 12, 11, 11, ncOverdue]}
                />
                <KpiTile
                    label={t('nonConformity:dashboard.kpi.underInvestigation')}
                    value={ncUnderInvestigation}
                    icon={<IconSearch size={14} />}
                    tone="amber"
                    delta={ncUnderInvestigation > 0 ? 5 : 0}
                    deltaDirection="neutral"
                    referenceValue={t('nonConformity:dashboard.kpi.underInvestigationRef')}
                    sparkline={[2, 3, 2, 1, 2, 1, ncUnderInvestigation]}
                />
                <KpiTile
                    label={t('nonConformity:dashboard.kpi.closedEvents')}
                    value={ncClosed}
                    icon={<IconCircleCheck size={14} />}
                    tone="green"
                    delta={ncClosed > 0 ? 18 : 0}
                    deltaDirection="up-is-good"
                    referenceValue={t('nonConformity:dashboard.kpi.closedEventsRef')}
                    sparkline={[2, 5, 4, 8, 10, 14, ncClosed]}
                />
                <KpiTile
                    label={t('nonConformity:dashboard.kpi.closureRate')}
                    value={rate.replace('%', '')}
                    unit="%"
                    icon={<IconChartPie size={14} />}
                    tone="teal"
                    delta={totalNC > 0 ? 12 : 0}
                    deltaDirection="up-is-good"
                    referenceValue={t('nonConformity:dashboard.kpi.closureRateRef')}
                    sparkline={[8, 10, 12, 14, 15, 16, parseFloat(rate)]}
                />
            </div>

            {/* LOT 43 — Bandeau filtres premium : Catégorie (Select) + Sévérités dynamiques + filtres droite */}
            <Paper className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-sm">

                {/* Row 1 : Catégorie Select + Sévérités dynamiques en tabs + vue */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Catégorie en dropdown (au lieu de tabs) */}
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500 font-medium">{t('nonConformity:dashboard.filters.category')}</span>
                        <Select
                            size="xs"
                            allowDeselect={false}
                            data={[
                                { label: `${t('nonConformity:dashboard.filters.all')} (${getTypeCount('all')})`, value: 'all' },
                                { label: `${t('nonConformity:dashboard.filters.nonConformities')} (${getTypeCount('NON_CONFORMITY')})`, value: 'NON_CONFORMITY' },
                                { label: `${t('nonConformity:dashboard.filters.nearMisses')} (${getTypeCount('NEAR_MISS')})`, value: 'NEAR_MISS' },
                            ]}
                            value={selectedType}
                            onChange={(v) => { setSelectedType(v || 'all'); setSelectedSeverity('all'); }}
                            w={210}
                            radius="md"
                        />
                    </div>

                    {/* Séparateur */}
                    <span className="h-5 w-px bg-slate-200" aria-hidden="true" />

                    {/* Sévérités dynamiques (uniquement celles >0) */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500 font-medium mr-1">{t('nonConformity:dashboard.filters.severity')}</span>
                        {visibleSeverityFilters.map(sev => {
                            const isActive = selectedSeverity === sev.value;
                            const cnt = getSeverityCount(sev.value);
                            const sevColorMap: Record<string, { active: string; hover: string; dot: string }> = {
                                all:            { active: 'bg-slate-800 text-white',     hover: 'hover:bg-slate-100',   dot: 'bg-slate-400' },
                                Insignifiante:  { active: 'bg-green-600 text-white',     hover: 'hover:bg-green-50',    dot: 'bg-green-500' },
                                Mineure:        { active: 'bg-lime-600 text-white',      hover: 'hover:bg-lime-50',     dot: 'bg-lime-500' },
                                'Modérée':      { active: 'bg-yellow-600 text-white',    hover: 'hover:bg-yellow-50',   dot: 'bg-yellow-500' },
                                Majeure:        { active: 'bg-orange-600 text-white',    hover: 'hover:bg-orange-50',   dot: 'bg-orange-500' },
                                Catastrophique: { active: 'bg-red-600 text-white',       hover: 'hover:bg-red-50',      dot: 'bg-red-500' },
                            };
                            const colors = sevColorMap[sev.value] || sevColorMap.all;
                            return (
                                <button
                                    key={sev.value}
                                    type="button"
                                    onClick={() => setSelectedSeverity(sev.value)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[12px] font-medium transition-colors border cursor-pointer ${
                                        isActive
                                            ? `${colors.active} border-transparent shadow-sm hover:brightness-110`
                                            : `bg-white text-slate-700 border-slate-200 ${colors.hover} hover:border-slate-300 hover:shadow-sm`
                                    }`}
                                >
                                    {!isActive && <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} aria-hidden="true" />}
                                    {sev.value === 'all' ? t('nonConformity:dashboard.filters.all') : sev.label}
                                    <span className={`ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[16px] px-1 rounded text-[10px] ${isActive ? 'bg-white/25' : 'bg-slate-100 text-slate-600'}`}>
                                        {cnt}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Right cluster : view toggle */}
                    <div className="ml-auto">
                        <SegmentedControl
                            value={viewMode}
                            onChange={handleViewChange}
                            data={viewOptions}
                            radius="md"
                            size="xs"
                            color="teal"
                        />
                    </div>
                </div>

                {/* Row 2 : Filtres secondaires — Département, Période, Statut, Custom dates */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
                    <span className="text-[10.5px] uppercase tracking-[0.14em] text-slate-500 font-medium mr-1">{t('nonConformity:dashboard.filters.filters')}</span>

                    {/* Département */}
                    <Select
                        size="xs"
                        allowDeselect={false}
                        leftSection={<IconClipboardList size={12} />}
                        data={departmentOptions.map(d => ({
                            label: d === 'all' ? 'Tous départements' : d,
                            value: d,
                        }))}
                        value={selectedDepartment}
                        onChange={(v) => setSelectedDepartment(v || 'all')}
                        w={180}
                        radius="md"
                        placeholder="Département"
                    />

                    {/* Période */}
                    <Select
                        size="xs"
                        allowDeselect={false}
                        leftSection={<IconCalendar size={12} />}
                        data={[
                            { label: 'Toutes périodes', value: 'all' },
                            { label: 'Semaine dernière', value: 'last_week' },
                            { label: 'Ce mois', value: 'this_month' },
                            { label: '90 derniers jours', value: 'last_90_days' },
                            { label: 'Personnalisée…', value: 'custom' },
                        ]}
                        value={selectedPeriod}
                        onChange={(v) => setSelectedPeriod(v || 'all')}
                        w={170}
                        radius="md"
                    />

                    {/* Custom date range (apparaît si period = custom) */}
                    {selectedPeriod === 'custom' && (
                        <div className="flex items-center gap-1.5">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="h-7 px-2 rounded-md border border-slate-300 text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                                aria-label="Date début"
                            />
                            <span className="text-slate-400 text-[12px]">→</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="h-7 px-2 rounded-md border border-slate-300 text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                                aria-label="Date fin"
                            />
                        </div>
                    )}

                    {/* Statut */}
                    <Select
                        size="xs"
                        allowDeselect={false}
                        data={[{ label: 'Tous statuts', value: 'All' }, ...NC_STATUS_OPTIONS]}
                        value={selectedStatus}
                        onChange={setSelectedStatus}
                        w={170}
                        radius="md"
                        aria-label="Filtrer par statut"
                    />

                    {/* Reset */}
                    {(selectedDepartment !== 'all' || selectedPeriod !== 'all' || selectedStatus !== 'All' || selectedSeverity !== 'all' || selectedType !== 'all') && (
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedDepartment('all');
                                setSelectedPeriod('all');
                                setSelectedStatus('All');
                                setSelectedSeverity('all');
                                setSelectedType('all');
                                setCustomStartDate('');
                                setCustomEndDate('');
                            }}
                            className="ml-1 text-[11px] text-slate-500 hover:text-slate-900 transition-colors underline-offset-2 hover:underline"
                        >
                            Réinitialiser
                        </button>
                    )}
                </div>
            </Paper>

            {/* Vue principale (cartes ou table) — pleine largeur */}
            <div>
                {viewMode === 'cards' ? renderCards(filteredData) : renderTable(filteredData)}
            </div>
        </div>
    );
};

export default NonConformityDashboard;

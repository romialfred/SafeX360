import { useEffect, useState } from 'react';
import {
    Button,
    Group,
    Card,
    Badge,
    Text,
    Grid,
    ActionIcon,
    Paper,
    Tooltip,
    SegmentedControl,
    Select,
} from '@mantine/core';
import {
    IconSearch,
    IconEye,
    IconEdit,
    IconFileExport,
    IconAlertTriangle,
    IconCircleCheck,
    IconClock,
    IconCalendar,
    IconTarget,
    IconLayoutGrid,
    IconList,
    IconPlus,
    IconClipboardList,
    IconChartPie,
} from '@tabler/icons-react';
import { NonConformity } from './NonConformity';
import { useNavigate } from 'react-router-dom';
import { getAllNonConformities } from '../../../services/NonConformityService';
import PageHeader from '../../UtilityComp/PageHeader';
import { useTranslation } from 'react-i18next';
import StatCard from '../../UtilityComp/StatCard';
import KpiTile from '../../UtilityComp/KpiTile';
import SegmentedFilter from '../../UtilityComp/SegmentedFilter';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { formatDateShort } from '../../../utility/DateFormats';
import { eventStatuses, eventStatusMap } from '../../../Data/DropdownData';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';

const severityOptions = [
    { value: 'all', label: 'All', tabClass: "!text-slate-600 hover:!text-slate-800 data-[active]:!bg-slate-100 data-[active]:!text-slate-800 data-[active]:!border-slate-400" },
    { value: 'Insignifiante', label: 'Insignifiante', tabClass: "!text-slate-600 hover:!text-green-600 data-[active]:!bg-green-100 data-[active]:!text-green-800 data-[active]:!border-green-500" },
    { value: 'Mineure', label: 'Mineure', tabClass: "!text-slate-600 hover:!text-lime-600 data-[active]:!bg-lime-100 data-[active]:!text-lime-800 data-[active]:!border-lime-500" },
    { value: 'Modérée', label: 'Modérée', tabClass: "!text-slate-600 hover:!text-yellow-600 data-[active]:!bg-yellow-100 data-[active]:!text-yellow-800 data-[active]:!border-yellow-500" },
    { value: 'Majeure', label: 'Majeure', tabClass: "!text-slate-600 hover:!text-orange-600 data-[active]:!bg-orange-100 data-[active]:!text-orange-800 data-[active]:!border-orange-500" },
    { value: 'Catastrophique', label: 'Catastrophique', tabClass: "!text-slate-600 hover:!text-red-700 data-[active]:!bg-red-100 data-[active]:!text-red-800 data-[active]:!border-red-600" },
];

const typeOptions = [
    { value: 'all', label: 'All' },
    { value: 'NON_CONFORMITY', label: 'Non-Conformity' },
    { value: 'NEAR_MISS', label: 'Near Miss' },
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'REPORTED': return 'blue';
            case 'ANALYSIS': return 'yellow';
            case 'AC_IMPLEMENTATION': return 'orange';
            case 'CLOSED': return 'green';
            case 'REJECTED': return 'red';
            default: return 'gray';
        }
    };
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Urgente': return 'red';
            case 'Élevée': return 'orange';
            case 'Normale': return 'yellow';
            case 'Faible': return 'green';
            default: return 'gray';
        }
    };
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'Insignifiante': return 'green';
            case 'Mineure': return 'lime';
            case 'Modérée': return 'yellow';
            case 'Majeure': return 'orange';
            case 'Catastrophique': return 'red';
            default: return 'gray';
        }
    };

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

    const stats = [
        { label: 'Total Events', value: totalNC.toString(), icon: IconAlertTriangle, color: 'blue' },
        { label: 'Overdue', value: ncOverdue.toString(), icon: IconClock, color: 'orange' },
        { label: 'Investigation', value: ncUnderInvestigation.toString(), icon: IconSearch, color: 'yellow' },
        { label: 'Closed', value: ncClosed.toString(), icon: IconCircleCheck, color: 'green' },
        { label: 'Rate %', value: rate, icon: IconTarget, color: 'purple' }
    ];
    // const getTailwindColor = (color: string) => {
    //     const colorMap: Record<string, string> = {
    //         blue: '#3b82f6', orange: '#f97316', yellow: '#eab308',
    //         green: '#10b981', purple: '#8b5cf6'
    //     };
    //     return colorMap[color] || '#000';
    // };
    const renderStats = () => (
        <Grid className="mb-6">
            {stats.map((stat, index) => (
                <Grid.Col key={index} span={{ base: 12, sm: 6, lg: 2.4 }}>
                    <Card
                        className={`relative transition-all duration-300 ease-out !rounded-2xl p-4 group cursor-pointer shadow-lg hover:shadow-xl hover:scale-[1.02] hover:brightness-105 border border-transparent`}
                        style={{ background: getStatBackgroundGradient(index) }}
                    >
                        <div className="relative z-10">
                            <div className='flex justify-between gap-5'>
                                <Text size="sm" className={`transition-opacity duration-300 ${getStatTextColor(index)}`}>
                                    {stat.label}
                                </Text>
                                <div className={` mt-1 rounded-xl ${getStatIconBackground(index)} transition-all duration-300 p-1 group-hover:scale-110`}>
                                    <stat.icon size={16} className={`${getStatIconColor(index)} transition-colors duration-300`} />
                                </div>
                            </div>
                            <Text size="2xl" className={`${getStatValueColor(index)} transition-colors duration-300 font-mono`}>
                                {stat.value}
                            </Text>
                        </div>
                    </Card>
                </Grid.Col>
            ))}
        </Grid>
    );
    const statGradients = [
        'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
        'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
        'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
        'linear-gradient(135deg, #ede9fe 0%, #e0f2fe 100%)'
    ];
    const getStatBackgroundGradient = (index: number) => statGradients[index] || 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
    const getStatTextColor = (_index: number) => 'text-slate-700 group-hover:text-slate-800';
    const getStatIconBackground = (index: number) => {
        const backgrounds = [
            'bg-blue-100/80 group-hover:bg-blue-200/90',
            'bg-orange-100/80 group-hover:bg-orange-200/90',
            'bg-amber-100/80 group-hover:bg-amber-200/90',
            'bg-emerald-100/80 group-hover:bg-emerald-200/90',
            'bg-indigo-100/80 group-hover:bg-indigo-200/90'
        ];
        return backgrounds[index] || 'bg-slate-100';
    };
    const getStatIconColor = (index: number) => {
        const colors = [
            'text-slate-600', 'text-amber-600', 'text-blue-600', 'text-emerald-600', 'text-indigo-600'
        ];
        return colors[index] || 'text-slate-600';
    };
    const getStatValueColor = (_index: number) => 'text-slate-800 group-hover:text-slate-900';

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
            <Badge color={getPriorityColor(rowData.priority)} variant="outline" className="rounded-full whitespace-nowrap">
                {rowData.priority}
            </Badge>
        ) : null;

    const statusBodyTemplate = (rowData: any) => (
        <Badge color={getStatusColor(rowData.status)} size='sm' variant="light" className="rounded-full whitespace-nowrap">
            {eventStatusMap[rowData.status]}
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
        const statusChip: Record<string, string> = {
            REPORTED:           'bg-sky-50 text-sky-700 border-sky-200',
            ANALYSIS:           'bg-amber-50 text-amber-700 border-amber-200',
            AC_IMPLEMENTATION:  'bg-orange-50 text-orange-700 border-orange-200',
            CLOSED:             'bg-emerald-50 text-emerald-700 border-emerald-200',
            REJECTED:           'bg-red-50 text-red-700 border-red-200',
            CANCELLED:          'bg-slate-100 text-slate-600 border-slate-200',
        };

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
                    const statChipColor = statusChip[statusUpper] || 'bg-slate-50 text-slate-700 border-slate-200';
                    const canEdit = !['CLOSED', 'REJECTED', 'CANCELLED'].includes(statusUpper);

                    // LOT 43 hotfix : background hover doux pour mettre en valeur la tuile
                    // Le hover bg dépend de la sévérité (cohérence couleur + ruban)
                    const hoverBg: Record<string, string> = {
                        Insignifiante:  'hover:bg-emerald-50/40',
                        Mineure:        'hover:bg-lime-50/40',
                        'Modérée':      'hover:bg-yellow-50/40',
                        Majeure:        'hover:bg-orange-50/40',
                        Catastrophique: 'hover:bg-red-50/40',
                    };
                    const hoverBgClass = hoverBg[sev] || 'hover:bg-slate-50';

                    return (
                        <div
                            key={nc.id}
                            onClick={() => onView(nc)}
                            onKeyDown={(e) => { if (e.key === 'Enter') onView(nc); }}
                            role="button"
                            tabIndex={0}
                            className={`group relative bg-white border border-slate-200 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ease-out hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 hover:border-slate-300 ${hoverBgClass} focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2`}
                        >
                            {/* Ruban gauche couleur sévérité */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor}`} aria-hidden="true" />

                            <div className="pl-4 pr-3.5 py-3.5 pb-3">
                                {/* Ligne 1 : numéro + status chip (status TOUJOURS visible, jamais caché) */}
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <span className="text-[11.5px] uppercase tracking-[0.12em] text-slate-500 font-mono">
                                        {nc.number}
                                    </span>
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${statChipColor} flex-shrink-0`}>
                                        {eventStatusMap[nc.status] || nc.status}
                                    </span>
                                </div>

                                {/* Ligne 2 : titre serif */}
                                <h3
                                    className="text-slate-900 line-clamp-2 mb-2.5"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 500,
                                        fontSize: '14.5px',
                                        letterSpacing: '-0.008em',
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {nc.title}
                                </h3>

                                {/* Ligne 3 : badges sévérité + priorité */}
                                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                                    {sev && (
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${sevChipColor}`}>
                                            {sev}
                                        </span>
                                    )}
                                    {nc.priority && (
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-white text-${getPriorityColor(nc.priority)}-700 border-${getPriorityColor(nc.priority)}-200`}>
                                            {nc.priority}
                                        </span>
                                    )}
                                </div>

                                {/* Ligne 4 : reporter + date + actions hover (sur la même ligne, actions remplacent date au hover ?) */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 relative">
                                    {/* Bloc texte (toujours visible) */}
                                    <div className="min-w-0 group-hover:opacity-0 transition-opacity">
                                        <p className="text-[10.5px] uppercase tracking-[0.1em] text-slate-400">Déclaré par</p>
                                        <p className="text-[12px] text-slate-700 truncate" title={nc.reporterName}>
                                            {nc.reporterName || '—'}
                                        </p>
                                    </div>
                                    <div className="text-right ml-2 flex-shrink-0 group-hover:opacity-0 transition-opacity">
                                        <p className="text-[10.5px] uppercase tracking-[0.1em] text-slate-400">Date</p>
                                        <p className="text-[12px] text-slate-700">{formatDateShort(nc.date)}</p>
                                    </div>

                                    {/* LOT 43 hotfix : actions positionnées EN BAS au hover (ne cachent plus le status) */}
                                    <div className="absolute inset-0 flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Tooltip label="Voir le détail">
                                            <ActionIcon
                                                variant="filled"
                                                color="blue"
                                                size="md"
                                                radius="md"
                                                onClick={(e) => { e.stopPropagation(); onView(nc); }}
                                            >
                                                <IconEye size={15} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label={canEdit ? 'Modifier' : 'Modification impossible'}>
                                            <span className="inline-flex">
                                                <ActionIcon
                                                    variant="filled"
                                                    color="teal"
                                                    size="md"
                                                    radius="md"
                                                    disabled={!canEdit}
                                                    onClick={(e) => { if (canEdit) { e.stopPropagation(); navigate('/non-conformity/edit/' + nc.id); } }}
                                                >
                                                    <IconEdit size={15} />
                                                </ActionIcon>
                                            </span>
                                        </Tooltip>
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
                <Tooltip label="Card View" withArrow>
                    <div>
                        <IconLayoutGrid size={16} />
                    </div>
                </Tooltip>
            ),
            value: 'cards',
        },
        {
            label: (
                <Tooltip label="Table View" withArrow>
                    <div>
                        <IconList size={16} />
                    </div>
                </Tooltip>
            ),
            value: 'table',
        },
    ];

    // Mapping pour SegmentedFilter
    const typeFilterOptions = typeOptions.map(opt => ({
        value: opt.value,
        label: opt.value === 'NON_CONFORMITY' ? 'Non-conformités' : opt.value === 'NEAR_MISS' ? 'Quasi-accidents' : 'Tous',
        count: getTypeCount(opt.value),
        color: (opt.value === 'NON_CONFORMITY' ? 'orange' : opt.value === 'NEAR_MISS' ? 'blue' : 'slate') as any,
    }));

    const severityFilterOptions = severityOptions.map(opt => ({
        value: opt.value,
        label: opt.value === 'all' ? 'Toutes' : opt.label,
        count: getSeverityCount(opt.value),
        color: (opt.value === 'Catastrophique' ? 'red' : opt.value === 'Majeure' ? 'orange' : opt.value === 'Modérée' ? 'yellow' : opt.value === 'Mineure' ? 'green' : opt.value === 'Insignifiante' ? 'slate' : 'slate') as any,
    }));

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
                        <Button variant="default" size="sm" leftSection={<IconFileExport size={15} />}>
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
                                    className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[12px] font-medium transition-all border cursor-pointer ${
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
                        data={[{ label: 'Tous statuts', value: 'All' }, ...eventStatuses]}
                        value={selectedStatus}
                        onChange={setSelectedStatus}
                        w={170}
                        radius="md"
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

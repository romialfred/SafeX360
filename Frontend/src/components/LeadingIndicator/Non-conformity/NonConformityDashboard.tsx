import { useEffect, useState } from 'react';
import {
    Button,
    Group,
    Card,
    Badge,
    Text,
    Grid,
    ActionIcon,
    Tabs,
    Paper,
    Tooltip,
    Breadcrumbs,
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
} from '@tabler/icons-react';
import { NonConformity } from './NonConformity';
import { Link, useNavigate } from 'react-router-dom';
import { getAllNonConformities } from '../../../services/NonConformityService';
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
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
    const [nonConformities, setNonConformities] = useState<any[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string | null>('All');
    const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
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
            default:
                periodMatch = true;
        }
        return statusMatch && typeMatch && severityMatch && periodMatch;
    });

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
                                <Text size="sm" className={`font-bold transition-opacity duration-300 ${getStatTextColor(index)}`}>
                                    {stat.label}
                                </Text>
                                <div className={` mt-1 rounded-xl ${getStatIconBackground(index)} transition-all duration-300 p-1 group-hover:scale-110`}>
                                    <stat.icon size={16} className={`${getStatIconColor(index)} transition-colors duration-300`} />
                                </div>
                            </div>
                            <Text size="2xl" fw={900} className={`${getStatValueColor(index)} transition-colors duration-300 font-mono`}>
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
    const titleBodyTemplate = (rowData: any) => (
        <span className="max-w-xs truncate text-blue-500 hover:underline cursor-pointer" onClick={() => onView(rowData)}>
            {rowData.title}
        </span>
    );
    const numberBodyTemplate = (rowData: any) => (
        <span className="text-slate-800 cursor-pointer" onClick={() => onView(rowData)}>
            {rowData.number}
        </span>
    );
    const severityBodyTemplate = (rowData: any) =>
        rowData.severityLevel ? (
            <Badge variant="light" size="sm" className="bg-slate-100 text-slate-700">
                {rowData.severityLevel}
            </Badge>
        ) : null;

    const priorityBodyTemplate = (rowData: any) =>
        rowData.priority ? (
            <Badge color={getPriorityColor(rowData.priority)} variant="outline" className="rounded-full">
                {rowData.priority}
            </Badge>
        ) : null;

    const statusBodyTemplate = (rowData: any) => (
        <Badge color={getStatusColor(rowData.status)} size='sm' variant="light" className="rounded-full">
            {eventStatusMap[rowData.status]}
        </Badge>
    );


    const dateBodyTemplate = (rowData: any) => (
        <span className="flex items-center gap-1">
            <IconCalendar size={14} className="text-slate-400" />
            <span className="text-slate-600 text-sm">{formatDateShort(rowData.date)}</span>
        </span>
    );
    const actionsBodyTemplate = (_rowData: any) => {
        const statusUpper = String(_rowData?.status || '').toUpperCase();
        const isClosed = statusUpper === 'CLOSED';
        const isRejected = statusUpper === 'REJECTED';
        const isCancelled = statusUpper === 'CANCELLED';
        const canEdit = !(isClosed || isRejected || isCancelled);
        const tooltip = canEdit
            ? 'Manage'
            : isClosed
                ? 'Closed — modification not possible'
                : isCancelled
                    ? 'Cancelled — modification not possible'
                    : 'Rejected — modification not possible';
        return (
            <div className="flex gap-2 justify-center">
                <Tooltip label={tooltip}>
                    <span className="inline-flex">
                        <ActionIcon
                            variant="light"
                            color="green"
                            size="sm"
                            className="rounded-lg"
                            disabled={!canEdit}
                            onClick={() => { if (canEdit) navigate("/non-conformity/edit/" + _rowData.id); }}
                        >
                            <IconEdit size={14} />
                        </ActionIcon>
                    </span>
                </Tooltip>
            </div>
        );
    };

    const renderCards = (data: any[]) => (
        <Grid>
            {data.map((nc) => (
                <Grid.Col key={nc.id} span={{ base: 12, md: 6, lg: 4 }}>
                    <Card onClick={() => onView(nc)} className="bg-white border border-slate-200 shadow-sm hover:shadow-lg cursor-pointer transition-all duration-300 rounded-xl group">
                        <div className="space-y-3 p-1">
                            <Group justify="space-between">
                                <Text fw={600} size="md" className="text-slate-800">{nc.number}</Text>
                                <div className='flex gap-3'>
                                    <Badge color={getStatusColor(nc.status)} variant="light" className="rounded-full !capitalize">
                                        {eventStatusMap[nc.status]}
                                    </Badge>
                                    {nc.severityLevel && (
                                        <Badge variant="light" color={getSeverityColor(nc.severityLevel)} size="md" className="bg-slate-100 text-slate-700 rounded-full text-sm  !capitalize">
                                            {nc.severityLevel}
                                        </Badge>
                                    )}
                                    {nc.priority && (
                                        <Badge color={getPriorityColor(nc.priority)} variant="outline" className="rounded-full !capitalize">
                                            {nc.priority}
                                        </Badge>
                                    )}
                                </div>
                            </Group>
                            <div className="!space-y-1">
                                <Text size="sm" className="text-slate-700 line-clamp-2 leading-relaxed">
                                    {nc.title}
                                </Text>
                                <Text size="sm" className="text-slate-600">
                                    <span>Reporter:</span> {nc.reporterName}
                                </Text>
                                <Group justify="space-between" className="">

                                    <Text size="sm" className="text-slate-500">
                                        <span>Date: </span>{formatDateShort(nc.date)}
                                    </Text>
                                    <Group gap="xs">
                                        <Tooltip label="View Details">
                                            <ActionIcon
                                                variant="light"
                                                color="blue"
                                                size="sm"
                                                className="rounded-lg"
                                                onClick={e => { e.stopPropagation(); onView(nc); }}
                                            >
                                                <IconEye size={14} />
                                            </ActionIcon>
                                        </Tooltip>
                                        {(() => {
                                            const statusUpper = String(nc?.status || '').toUpperCase();
                                            const isClosed = statusUpper === 'CLOSED';
                                            const isRejected = statusUpper === 'REJECTED';
                                            const isCancelled = statusUpper === 'CANCELLED';
                                            const canEdit = !(isClosed || isRejected || isCancelled);
                                            const tooltip = canEdit
                                                ? 'Manage'
                                                : isClosed
                                                    ? 'Closed — modification not possible'
                                                    : isCancelled
                                                        ? 'Cancelled — modification not possible'
                                                        : 'Rejected — modification not possible';
                                            return (
                                                <Tooltip label={tooltip}>
                                                    <span className="inline-flex">
                                                        <ActionIcon
                                                            variant="light"
                                                            color="green"
                                                            size="sm"
                                                            className="rounded-lg"
                                                            disabled={!canEdit}
                                                            onClick={e => { if (canEdit) { e.stopPropagation(); navigate("/non-conformity/edit/" + nc.id); } }}
                                                        >
                                                            <IconEdit size={14} />
                                                        </ActionIcon>
                                                    </span>
                                                </Tooltip>
                                            );
                                        })()}
                                    </Group>
                                </Group>
                            </div>

                            {/* <Text size="sm" className="text-slate-600">
                                    <span> Responsible: </span> {nc.manager}
                                </Text> */}

                        </div>
                    </Card>
                </Grid.Col>
            ))}
        </Grid>
    );

    const renderTable = (data: any[]) => (
        <DataTable
            value={data}
            size='small'
            stripedRows
            paginator
            rows={10}
            className="[&_.p-datatable-tbody]:!text-sm"
            rowsPerPageOptions={[10, 25, 50]}
            emptyMessage="No non-conformities found."
        >
            <Column field="number" header="Reference" body={numberBodyTemplate} style={{ fontWeight: 'normal', fontSize: '14px' }} />
            <Column field="title" header="Title" body={titleBodyTemplate} style={{ fontWeight: 'normal', fontSize: '14px' }} />
            <Column field="reporterName" header="Reporter" style={{ fontWeight: 'normal', fontSize: '14px' }} />
            <Column field="severityLevel" header="Severity" body={severityBodyTemplate} style={{ fontWeight: 'normal', fontSize: '14px' }} />
            <Column field="status" header="Status" body={statusBodyTemplate} style={{ fontWeight: 'normal', fontSize: '14px' }} />
            <Column field="priority" header="Priority" body={priorityBodyTemplate} style={{ fontWeight: 'normal', fontSize: '14px' }} />
            {/* <Column field="manager" header="Assigned to" body={managerBodyTemplate} style={{ fontWeight: 'normal', fontSize: '14px' }} /> */}
            <Column field="date" header="Date" body={dateBodyTemplate} style={{ fontWeight: 'normal', fontSize: '14px' }} />
            <Column header="Actions" body={actionsBodyTemplate} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} style={{ fontWeight: 'normal', fontSize: '14px' }} />
        </DataTable>
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

    return (
        <div className="p-5">
            {/* Header */}
            <div className="mb-4">
                <div>
                    <div className="font-semibold  text-2xl text-blue-500 w-fit"> Central Findings Dashboard</div>
                    <Breadcrumbs mt="xs" mb="lg">
                        <Link className="hover:!underline" to="/"><Text variant="gradient">Home</Text></Link>
                        <Link className="hover:!underline" to="/non-conformity"><Text variant="gradient">Central Findings Dashboard</Text></Link>
                    </Breadcrumbs>
                </div>
                <Group justify="space-between" className="">
                    <div>
                        <Text fs="italic" size='sm'>
                            Monitor and manage non-conformities and near miss according to ISO 45001 standards
                        </Text>
                    </div>
                </Group>
            </div>
            {/* KPI Stats */}
            {renderStats()}
            {/* Tabs and Controls */}
            <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 ">
                {/* Type Tabs */}
                <div className='flex justify-between '>

                    <Tabs value={selectedType} onChange={(value) => value && setSelectedType(value)}>
                        <Tabs.List className="mb-2 border-b border-slate-200 bg-white !rounded-lg p-1">
                            {typeOptions.map(opt =>
                                <Tabs.Tab
                                    key={opt.value}
                                    value={opt.value}
                                    className="!text-slate-600 hover:!text-blue-600 data-[active]:!bg-blue-100 data-[active]:!text-blue-800 data-[active]:!border-blue-500 !rounded-lg px-4 py-2 transition-all duration-200"
                                >
                                    {opt.label} ({getTypeCount(opt.value)})
                                </Tabs.Tab>
                            )}
                        </Tabs.List>
                    </Tabs>
                    <Group gap="md" className="mb-6">
                        <Select
                            size='sm'
                            data={[
                                { label: 'All Time', value: 'all' },
                                { label: 'Last Week', value: 'last_week' },
                                { label: 'This Month', value: 'this_month' },
                                { label: 'Last 90 Days', value: 'last_90_days' }
                            ]}
                            value={selectedPeriod}
                            onChange={(value) => setSelectedPeriod(value || 'all')}
                            placeholder="Select Period"
                        />
                        <Select allowDeselect={false}
                            size='sm'
                            data={[{ label: "All", value: "All" }, ...eventStatuses]}
                            value={selectedStatus}
                            onChange={setSelectedStatus}
                        />
                        <Button
                            leftSection={<IconFileExport size={16} />}
                            variant="outline"
                            className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg"
                        >
                            Export
                        </Button>
                        <Group gap="xs">
                            <SegmentedControl
                                value={viewMode}
                                onChange={handleViewChange}
                                data={viewOptions}
                                radius="md"
                                size="sm"
                                color="blue"
                                transitionDuration={500}
                                transitionTimingFunction="linear"
                            />
                        </Group>
                    </Group>
                </div>
                {/* Severity Tabs */}
                <Tabs value={selectedSeverity} onChange={(value) => value && setSelectedSeverity(value)}>
                    <Tabs.List className="mb-4 border-b border-slate-200 bg-slate-50 rounded-lg p-1">
                        {severityOptions.map(opt =>
                            <Tabs.Tab
                                key={opt.value}
                                value={opt.value}
                                className={`${opt.tabClass} !rounded-lg px-3 py-1.5 text-sm transition-all duration-200`}
                            >
                                {opt.label} ({getSeverityCount(opt.value)})
                            </Tabs.Tab>
                        )}
                    </Tabs.List>
                </Tabs>
                {/* Filters and View Toggle */}

                {/* The main table/cards */}
                {viewMode === 'cards' ? renderCards(filteredData) : renderTable(filteredData)}
            </Paper>
        </div>
    );
};

export default NonConformityDashboard;

import {
    ActionIcon,
    Badge,
    Button,
    Card,
    Progress,
    SegmentedControl,
    Select,
    Tooltip,
} from "@mantine/core";
import {
    IconAlertTriangle,
    IconBulb,
    IconCircleCheck,
    IconClock,
    IconLayoutGrid,
    IconLayoutList,
    IconTrendingUp,
} from "@tabler/icons-react";
import PageHeader from "../../UtilityComp/PageHeader";
import { FilterMatchMode } from "primereact/api";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { getAllRecommendations } from "../../../services/AuditService";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { formatDateShort } from "../../../utility/DateFormats";
import RecommendationCard from "./RecommendationCard";
import { Toolbar } from "primereact/toolbar";
import { recStatusColor, recStatusLabel } from "./auditLabels";

const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
};

const Recommendation = () => {
    const { t } = useTranslation('audits');
    // Libellé de statut bilingue : clé i18n `audits:recStatus.*`, repli sur le libellé FR centralisé.
    const tStatus = (code?: string | null): string =>
        code ? t(`recStatus.${String(code).toUpperCase()}`, { defaultValue: recStatusLabel(code) }) : '—';
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [recommendations, setRecommendations] = useState<any>([]);
    const [countMap, setCountMap] = useState<any>({});
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [viewType, setViewType] = useState<'table' | 'card'>('table');
    const [selectedStatus, setSelectedStatus] = useState<string>('All');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
    const [selectedProgress, setSelectedProgress] = useState<string>('All');


    useEffect(() => {
        dispatch(showOverlay())
        getAllRecommendations()
            .then((res) => {
                setRecommendations(res);
                countStatus(res);
            }
            )
            .catch((_err) => console.error(_err)).finally(() => {
                dispatch(hideOverlay());
            }
            );

    }, []);

    const countStatus = (res: any) => {
        const today = new Date();

        // Count map by ID
        const counts: Record<string, number> = {
            total: res.length,
            inProgress: 0,
            implemented: 0,
            overdue: 0,
        };

        res.forEach((r: any) => {
            if (r.status === 'IN_PROGRESS' || r.status == "PENDING") counts.inProgress++;
            if (r.status === 'COMPLETED') counts.implemented++;

            const endDate = new Date(r.deadline);
            if (r.status !== 'COMPLETED' && endDate < today) {
                counts.overdue++;
            }
        });
        const executionRate = counts.total > 0
            ? `${((counts.implemented / counts.total) * 100).toFixed(1)}%`
            : '0%';

        setCountMap({ ...counts, execRate: executionRate });

    }

    const getUpdateRestriction = (status: string, progress: number) => {
        const normalizedStatus = String(status ?? '').toUpperCase();
        const normalizedProgress = Number(progress ?? 0);

        if (normalizedProgress >= 100) {
            return t('recommendations.restrictionProgress100');
        }

        if (normalizedStatus === 'PENDING') {
            return t('recommendations.restrictionPending');
        }

        if (normalizedStatus === 'COMPLETED') {
            return t('recommendations.restrictionCompleted');
        }

        if (normalizedStatus === 'CANCELLED') {
            return t('recommendations.restrictionCancelled');
        }

        return null;
    };

    const getSeverity = (rowData: any, field: 'status' | 'progress') => {
        if (field === 'status') {
            return <Badge size="md" variant="light" color={recStatusColor(rowData.status)} >{tStatus(rowData.status)}</Badge>
        }
        return <Progress.Root size={15}>
            <Tooltip label={`${rowData.progress}%`} withArrow>
                <Progress.Section value={rowData.progress} color={rowData.progress < 20 ? 'red' : rowData.progress < 70 ? 'orange' : 'green'}>
                    <Progress.Label>{rowData.progress}</Progress.Label>
                </Progress.Section>
            </Tooltip>
        </Progress.Root>
    };

    const recommendationSummaryData = [
        { id: 'total', label: t('recommendations.summaryTotal'), icon: IconTrendingUp, color: '#2563eb' },
        { id: 'inProgress', label: t('recommendations.summaryInProgress'), icon: IconClock, color: '#f59e0b' },
        { id: 'implemented', label: t('recommendations.summaryImplemented'), icon: IconCircleCheck, color: '#22c55e' },
        { id: 'overdue', label: t('recommendations.summaryOverdue'), icon: IconAlertTriangle, color: '#f97316' },
        { id: 'execRate', label: t('recommendations.summaryExecRate'), icon: IconTrendingUp, color: '#8b5cf6' },
    ];

    const actionBodyTemplate = (rowData: any) => {
        const restriction = getUpdateRestriction(rowData?.status, rowData?.progress);
        const tooltipLabel = restriction ?? t('recommendations.update');

        return (
            <div className="flex items-center gap-4">
                <Tooltip label={tooltipLabel}>
                    <span className="inline-flex">
                        <Button
                            variant="subtle"
                            size="xs"
                            disabled={Boolean(restriction)}
                            onClick={() => navigate(`update/${rowData.id}`)}
                        >
                            {t('recommendations.update')}
                        </Button>
                    </span>
                </Tooltip>


            </div>

        );
    }



    const getProgressLabel = (progress: number) => {
        if (progress <= 20) return '20';
        if (progress <= 70) return '70';
        return '71';
    };

    const filteredRecommendations = recommendations.filter((item: any) => {
        const statusMatch = selectedStatus === 'All' || item.status?.toLowerCase() === selectedStatus.toLowerCase();
        const deptMatch = selectedDepartment === 'All' || item.department?.toLowerCase() === selectedDepartment.toLowerCase();
        const progressMatch = selectedProgress === 'All' || getProgressLabel(item.progress) === selectedProgress;

        return statusMatch && deptMatch && progressMatch;
    });

    const statusFilter = () => (
        <SegmentedControl
            value={selectedStatus}
            onChange={setSelectedStatus}
            data={[
                { label: t('recommendations.filterAll', { count: recommendations.length }), value: 'All' },
                { label: t('recommendations.filterPending', { count: recommendations.filter((r: any) => r.status?.toLowerCase() === 'pending').length }), value: 'PENDING' },
                { label: t('recommendations.filterInProgress', { count: recommendations.filter((r: any) => r.status?.toLowerCase() === 'in_progress').length }), value: 'IN_PROGRESS' },
                { label: t('recommendations.filterCompleted', { count: recommendations.filter((r: any) => r.status?.toLowerCase() === 'completed').length }), value: 'COMPLETED' },
            ]}
            color="blue"
        />
    );

    const departmentOptions = (() => {
        const set = new Set<string>();
        recommendations.forEach((r: any) => {
            const d = String(r.department || '').trim();
            if (d) set.add(d);
        });
        return [{ value: 'All', label: t('recommendations.filterDeptAll') }, ...Array.from(set).sort().map((d) => ({ value: d, label: d }))];
    })();

    const departmentFilter = () => {
        return (
            <Select
                className="col-span-2"
                placeholder={t('recommendations.filterDeptPlaceholder')}
                data={departmentOptions}
                value={selectedDepartment}
                onChange={(v) => setSelectedDepartment(v ?? 'All')}
                allowDeselect={false}
                size="sm"
                aria-label={t('recommendations.filterDeptAria')}
            />
        );
    };
    const nameBodyTemplate = (rowData: any) => {
        return (
            <Link to={`details/${rowData.id}`} className="text-blue-600 hover:underline">
                {rowData.title}
            </Link>
        );
    }

    const progressFilter = () => (
        <div className="flex items-center gap-3">


            <SegmentedControl
                value={selectedProgress}
                onChange={setSelectedProgress}
                data={[
                    { label: t('recommendations.filterProgressAll'), value: 'All' },
                    { label: t('recommendations.filterProgress0_20'), value: '20' },
                    { label: t('recommendations.filterProgress21_70'), value: '70' },
                    { label: t('recommendations.filterProgress71_100'), value: '71' },
                ]}
                color={selectedProgress === 'All' ? 'blue' : selectedProgress === '20' ? 'red' : selectedProgress === '70' ? 'orange' : 'green'}
            />
            <div className="flex mx-auto gap-2 border border-primary rounded-lg p-2 bg-gray-100">
                <Tooltip label={t('recommendations.tableView')}>
                    <ActionIcon
                        variant={viewType === 'table' ? 'filled' : 'light'}
                        color="blue"
                        onClick={() => setViewType('table')}
                    >
                        <IconLayoutList size={18} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label={t('recommendations.cardView')}>
                    <ActionIcon
                        variant={viewType === 'card' ? 'filled' : 'light'}
                        color="blue"
                        onClick={() => setViewType('card')}
                    >
                        <IconLayoutGrid size={18} />
                    </ActionIcon>
                </Tooltip>
            </div>
        </div>
    );

    return (
        <div className="p-5 space-y-5 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: t('recommendations.breadcrumbHome'), to: '/' },
                    { label: t('recommendations.breadcrumbAudits'), to: '/audit-management' },
                    { label: t('recommendations.breadcrumbTracking') },
                ]}
                icon={<IconBulb size={22} stroke={2} />}
                iconColor="indigo"
                title={t('recommendations.listTitle')}
                subtitle={t('recommendations.listSubtitle')}
            />
            <div className="flex flex-col gap-5">
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-5 sm:grid-cols-1 mb-4">
                    {recommendationSummaryData.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={index}
                                className="relative overflow-hidden rounded-xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm transition-[box-shadow] hover:shadow-md"
                            >
                                <div
                                    className="absolute inset-0 opacity-10"
                                    style={{ background: `linear-gradient(135deg, ${item.color} 0%, transparent 70%)` }}
                                />
                                <div className="relative flex justify-between items-center p-4">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-xs text-slate-500 uppercase tracking-wide">{item.label}</p>
                                        <span className="text-lg text-slate-800">
                                            {countMap[item.id] ?? (item.id === 'execRate' ? '0%' : 0)}
                                        </span>
                                    </div>
                                    <div className="shrink-0">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${item.color}1A` }}>
                                            <Icon size={20} stroke={2} color={item.color} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>





                <Card className="bg-white" shadow="sm" withBorder radius="md" p={10}>
                    <Toolbar className="mb-3 !p-2" left={departmentFilter} center={statusFilter} right={progressFilter} />
                    {
                        viewType === 'table' ? (
                            <DataTable selectionMode="single"
                                className='[&_.p-datatable-tbody]:!text-[13px] [&_.p-datatable-thead_th]:!text-[12px]'
                                size='small'
                                stripedRows
                                removableSort
                                paginator
                                value={filteredRecommendations}
                                rows={10}
                                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                rowsPerPageOptions={[10, 25, 50]}
                                dataKey="id"
                                filters={filters}
                                globalFilterFields={['title', 'auditTitle', 'department']}
                                currentPageReportTemplate={t('recommendations.paginator')}
                                emptyMessage={t('recommendations.emptyFilters')}
                                onFilter={(e) => setFilters(e.filters)}
                            >
                                <Column field="title" header={t('recommendations.colRecommendation')} body={nameBodyTemplate} sortable />
                                <Column field="auditTitle" header={t('recommendations.colLinkedAudit')} />
                                <Column field="endDate" header={t('recommendations.colDeadline')} body={(rowData) => formatDateShort(rowData.deadline)} sortable />
                                <Column field="status" header={t('recommendations.colStatus')} body={(rowData) => getSeverity(rowData, 'status')} sortable />
                                <Column field="progress" header={t('recommendations.colProgress')} body={(rowData) => getSeverity(rowData, 'progress')} sortable />
                                <Column headerStyle={{ width: '5rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} header={t('recommendations.colActions')} body={actionBodyTemplate} />
                            </DataTable>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {filteredRecommendations.map((rec: any) => (
                                    <RecommendationCard key={rec.id} data={rec} onView={() => navigate(`details/${rec.id}`)} onUpdate={() => navigate(`update/${rec.id}`)} />
                                ))}
                                {filteredRecommendations.length === 0 && (
                                    <div className="col-span-3 text-gray-500 text-center">{t('recommendations.emptyFilters')}</div>
                                )}
                            </div>
                        )
                    }
                </Card>
            </div>
        </div >
    );
};

export default Recommendation;

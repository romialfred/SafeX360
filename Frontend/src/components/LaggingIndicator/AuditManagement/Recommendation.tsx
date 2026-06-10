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
            .catch((_err) => { }).finally(() => {
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
            return 'Avancement déjà à 100 %.';
        }

        if (normalizedStatus === 'PENDING') {
            return 'Une recommandation en attente ne peut pas être mise à jour.';
        }

        if (normalizedStatus === 'COMPLETED') {
            return 'Recommandation déjà terminée.';
        }

        if (normalizedStatus === 'CANCELLED') {
            return 'Une recommandation annulée ne peut pas être mise à jour.';
        }

        return null;
    };

    const getSeverity = (rowData: any, field: 'status' | 'progress') => {
        if (field === 'status') {
            return <Badge size="md" variant="light" color={recStatusColor(rowData.status)} >{recStatusLabel(rowData.status)}</Badge>
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
        { id: 'total', label: 'Total recommandations', icon: IconTrendingUp, color: '#2563eb' },
        { id: 'inProgress', label: 'En cours', icon: IconClock, color: '#f59e0b' },
        { id: 'implemented', label: 'Mises en œuvre', icon: IconCircleCheck, color: '#22c55e' },
        { id: 'overdue', label: 'En retard', icon: IconAlertTriangle, color: '#f97316' },
        { id: 'execRate', label: 'Taux de réalisation', icon: IconTrendingUp, color: '#8b5cf6' },
    ];

    const actionBodyTemplate = (rowData: any) => {
        const restriction = getUpdateRestriction(rowData?.status, rowData?.progress);
        const tooltipLabel = restriction ?? 'Mettre à jour';

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
                            Mettre à jour
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
                { label: `Toutes (${recommendations.length})`, value: 'All' },
                { label: `En attente (${recommendations.filter((r: any) => r.status?.toLowerCase() === 'pending').length})`, value: 'PENDING' },
                { label: `En cours (${recommendations.filter((r: any) => r.status?.toLowerCase() === 'in_progress').length})`, value: 'IN_PROGRESS' },
                { label: `Terminées (${recommendations.filter((r: any) => r.status?.toLowerCase() === 'completed').length})`, value: 'COMPLETED' },
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
        return [{ value: 'All', label: 'Tous départements' }, ...Array.from(set).sort().map((d) => ({ value: d, label: d }))];
    })();

    const departmentFilter = () => {
        return (
            <Select
                className="col-span-2"
                placeholder="Filtrer par département"
                data={departmentOptions}
                value={selectedDepartment}
                onChange={(v) => setSelectedDepartment(v ?? 'All')}
                allowDeselect={false}
                size="sm"
                aria-label="Filtrer par département"
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
                    { label: `Tous`, value: 'All' },
                    { label: '0-20%', value: '20' },
                    { label: '21-70%', value: '70' },
                    { label: '71-100%', value: '71' },
                ]}
                color={selectedProgress === 'All' ? 'blue' : selectedProgress === '20' ? 'red' : selectedProgress === '70' ? 'orange' : 'green'}
            />
            <div className="flex mx-auto gap-2 border border-primary rounded-lg p-2 bg-gray-100">
                <Tooltip label="Vue tableau">
                    <ActionIcon
                        variant={viewType === 'table' ? 'filled' : 'light'}
                        color="blue"
                        onClick={() => setViewType('table')}
                    >
                        <IconLayoutList size={18} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label="Vue cartes">
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
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des Audits', to: '/audit-management' },
                    { label: 'Suivi des recommandations' },
                ]}
                icon={<IconBulb size={22} stroke={2} />}
                iconColor="indigo"
                title="Suivi des recommandations d'audit"
                subtitle="Suivi de la mise en œuvre des recommandations d'audit et améliorations associées jusqu'à clôture"
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
                                currentPageReportTemplate="{first}–{last} sur {totalRecords}"
                                emptyMessage="Aucune recommandation ne correspond aux filtres"
                                onFilter={(e) => setFilters(e.filters)}
                            >
                                <Column field="title" header="Recommandation" body={nameBodyTemplate} sortable />
                                <Column field="auditTitle" header="Audit lié" />
                                <Column field="endDate" header="Échéance" body={(rowData) => formatDateShort(rowData.deadline)} sortable />
                                <Column field="status" header="Statut" body={(rowData) => getSeverity(rowData, 'status')} sortable />
                                <Column field="progress" header="Progression" body={(rowData) => getSeverity(rowData, 'progress')} sortable />
                                <Column headerStyle={{ width: '5rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} header="Actions" body={actionBodyTemplate} />
                            </DataTable>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {filteredRecommendations.map((rec: any) => (
                                    <RecommendationCard key={rec.id} data={rec} onView={() => navigate(`details/${rec.id}`)} onUpdate={() => navigate(`update/${rec.id}`)} />
                                ))}
                                {filteredRecommendations.length === 0 && (
                                    <div className="col-span-3 text-gray-500 text-center">Aucune recommandation ne correspond aux filtres</div>
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

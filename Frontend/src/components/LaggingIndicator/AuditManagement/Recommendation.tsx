import {
    ActionIcon,
    Badge,
    Button,
    Card,
    Divider,
    LoadingOverlay,
    Modal,
    NumberInput,
    Progress,
    SegmentedControl,
    Select,
    Text,
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
import SafeHtml from "../../UtilityComp/SafeHtml";
import { FilterMatchMode } from "primereact/api";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { Tag } from "primereact/tag";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import TextEditor from "../../UtilityComp/TextEditor";
import { useForm } from "@mantine/form";
import { createFollowup, getAllRecommendations, getRecommendationById, getRecommendationFollowups } from "../../../services/AuditService";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { formatDateShort } from "../../../utility/DateFormats";
import { recMap, recommendationStatus } from "../../../Data/DropdownData";
import { modals } from "@mantine/modals";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import RecommendationCard from "./RecommendationCard";
import { Toolbar } from "primereact/toolbar";

const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
};

const Recommendation = () => {
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [modalOpened, setModalOpened] = useState(false);
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [recommendations, setRecommendations] = useState<any>([]);
    const [countMap, setCountMap] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [recommendationFollowups, setRecommendationFollowups] = useState<any>([]);
    const [recommendation, setRecommendation] = useState<any>(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [viewType, setViewType] = useState<'table' | 'card'>('table');
    const [selectedStatus, setSelectedStatus] = useState<string>('All');
    const [selectedDepartment, _setSelectedDepartment] = useState<string>('All');
    const [selectedProgress, setSelectedProgress] = useState<string>('All');


    useEffect(() => {
        dispatch(showOverlay())
        getAllRecommendations()
            .then((res) => {
                console.log(res);
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
    const form = useForm({
        initialValues: {
            progress: 0,
            status: '',
            comment: '',
            recommendationId: ''
        },
        validate: {

            status: (value) => (value.length === 0 ? 'Status is required' : null),

        }
    });

    const getUpdateRestriction = (status: string, progress: number) => {
        const normalizedStatus = String(status ?? '').toUpperCase();
        const normalizedProgress = Number(progress ?? 0);

        if (normalizedProgress >= 100) {
            return 'Progress is already at 100%.';
        }

        if (normalizedStatus === 'PENDING') {
            return 'Pending recommendations cannot be updated.';
        }

        if (normalizedStatus === 'COMPLETED') {
            return 'Recommendation is already completed.';
        }

        if (normalizedStatus === 'CANCELLED') {
            return 'Cancelled recommendations cannot be updated.';
        }

        return null;
    };

    const getSeverity = (rowData: any, field: 'status' | 'progress') => {
        if (field === 'status') {
            const severityMap: Record<string, string> = {
                'PENDING': 'orange',
                'IN_PROGRESS': 'blue',
                'COMPLETED': 'green',
                'DELAYED': 'red',
                'CANCELLED': 'gray',
            };
            return <Badge size="md" variant="light" className="!capitalize" color={severityMap[rowData.status] || 'info'} >{recMap[rowData.status]}</Badge>
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

    const handleModalOpen = (rowData: any) => {

        setSelectedRow(rowData);
        setModalOpened(true);
        form.setValues({
            progress: rowData.progress,
            recommendationId: rowData.id,
            status: rowData.status,
            comment: '',
        })
        setLoading(true);
        getRecommendationFollowups(rowData.id)
            .then((res) => {
                setRecommendationFollowups(res);

            }
            ).catch((_err) => { })
            .finally(() => {
                setLoading(false);
            }
            );
        getRecommendationById(rowData.id)
            .then((res) => {
                setRecommendation(res);
            }
            ).catch((_err) => { })
            .finally(() => {
                setLoading(false);
            }
            );
    }
    // Prevent unused function warning after switching to route-based update
    if (false) { console.log(handleModalOpen); }


    const actionBodyTemplate = (rowData: any) => {
        const restriction = getUpdateRestriction(rowData?.status, rowData?.progress);
        const tooltipLabel = restriction ?? 'Update';

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
                            Update
                        </Button>
                    </span>
                </Tooltip>

                {/* <Tooltip label="View Details ">
                    <ActionIcon onClick={() => navigate(`details/${rowData.id}`)} color='yellow' size="sm">
                        <IconEye className="!w-4/5 !h-4/5" stroke={1.5} />
                    </ActionIcon>
                </Tooltip> */}


            </div>

        );
    }

    const handleSubmit = async (values: any) => {
        modals.openConfirmModal({
            title: <span className="text-2xl">Are you sure?</span>,
            centered: true,
            children: (
                <span className="text-md">
                    You want to update the recommendation.
                </span>
            ),
            labels: { confirm: `Yes, Update`, cancel: "Cancel" },
            cancelProps: { color: "red", variant: "filled" },
            confirmProps: { color: "green", variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: async () => {
                setLoading(true);
                createFollowup(values).then((_res) => {
                    setModalOpened(false);
                    setRecommendations((prev: any) => {
                        const newData = [...prev];
                        return newData.map((item) => item.id === selectedRow.id ? ({ ...item, status: values.status, progress: values.progress }) : item);
                    })
                    successNotification("Recommendation updated successfully");
                }).catch((_err) => {
                    errorNotification(_err.response?.data?.errorMessage || "Something went wrong");
                }).finally(() => {
                    setLoading(false);
                })

            },
        });
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

    const departmentFilter = () => {


        return (
            <Select className="col-span-2" placeholder="Sélectionner les départements" data={["Tous départements", "HSE", "Production", "Maintenance", "Logistique"]} withAsterisk />
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
                                className="relative overflow-hidden rounded-xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm transition-transform hover:-translate-y-1"
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
                                className='[&_.p-datatable-tbody]:!text-sm'
                                size='small'
                                stripedRows
                                removableSort
                                paginator
                                value={filteredRecommendations}
                                rows={10}
                                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                rowsPerPageOptions={[10, 25, 50]}
                                dataKey="title"
                                filters={filters}
                                globalFilterFields={['title', 'objective', 'sites', 'ppe']}
                                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                                onFilter={(e) => setFilters(e.filters)}
                            >
                                <Column style={{ fontWeight: 'normal', fontSize: "13px" }} field="title" header="Recommandation" body={nameBodyTemplate} sortable />
                                <Column style={{ fontWeight: 'normal', fontSize: "13px" }} field="auditTitle" header="Audit lié" />
                                <Column style={{ fontWeight: 'normal', fontSize: "13px" }} field="endDate" header="Échéance" body={(rowData) => formatDateShort(rowData.deadline)} sortable />
                                <Column style={{ fontWeight: 'normal', fontSize: "13px" }} field="status" header="Statut" body={(rowData) => getSeverity(rowData, 'status')} sortable />
                                <Column style={{ fontWeight: 'normal', fontSize: "13px" }} field="progress" header="Progression" body={(rowData) => getSeverity(rowData, 'progress')} sortable />
                                <Column headerStyle={{ width: '5rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
                            </DataTable>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {filteredRecommendations.map((rec: any) => (
                                    <RecommendationCard key={rec.id} data={rec} onView={() => navigate(`details/${rec.id}`)} onUpdate={() => navigate(`update/${rec.id}`)} />
                                ))}
                                {filteredRecommendations.length === 0 && (
                                    <div className="col-span-3 text-gray-500 text-center">No Recommendations Found</div>
                                )}
                            </div>
                        )
                    }
                </Card>
            </div>
            <div>
                {/* Modal */}
                <Modal
                    opened={modalOpened}
                    onClose={() => setModalOpened(false)}
                    title={<div className="text-lg">{recommendation?.title}</div>}
                    size="auto"
                    centered yOffset="10dvh"
                >
                    <LoadingOverlay
                        visible={loading}
                        zIndex={1000}
                        overlayProps={{ radius: "sm", blur: 2 }}
                    />
                    {selectedRow && (
                        <div className="flex gap-5 ">
                            <form onSubmit={form.onSubmit(handleSubmit)} className="flex flex-col gap-5 w-[500px]">

                                <div>
                                    <p className="text-lg text-gray-400">Description</p>
                                    <div className="bg-blue-50 rounded-lg shadow-sm p-4 ">
                                        {/* LOT 41 P0 XSS fix */}
                                        <SafeHtml html={recommendation?.description} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">

                                    <NumberInput {...form.getInputProps('progress')} label="Progress (%)" max={100} clampBehavior="blur" min={selectedRow.progress} />
                                    <Select size="sm" {...form.getInputProps('status')} label="Statut" placeholder="Sélectionner le statut" data={recommendationStatus.slice(recommendationStatus.findIndex((item) => item.value === (recommendationFollowups?.length > 0 ? recommendationFollowups[recommendationFollowups.length - 1]?.status : selectedRow?.status)))} />
                                </div>
                                <TextEditor form={form} id="comment" title="Update Comment" />
                                <Divider size="xs" />
                                <div className="flex justify-center gap-2">
                                    <Button type="button" onClick={() => setModalOpened(false)} variant="outline">Close</Button>
                                    <Button type="submit" variant="gradient">Save Changes</Button>
                                </div>
                            </form>
                            {recommendationFollowups && recommendationFollowups.length > 0 && (
                                <>
                                    <Divider size="xs" orientation="vertical" />
                                    <div className="space-y-5 h-[530px] overflow-y-auto">
                                        <p className="text-lg items-center mb-4 flex gap-1 text-amber-600">
                                            <IconClock /> Update History
                                        </p>

                                        {recommendationFollowups
                                            .slice() // create a shallow copy
                                            .reverse() // reverse the copy
                                            .map((x: any, index: number, arr: any) => {
                                                const previousProgress =
                                                    index < arr.length - 1 ? arr[index + 1].progress : 0;
                                                const progressMade = x.progress - previousProgress;

                                                return (
                                                    <Card key={index} shadow="sm" padding="sm" radius="md" withBorder className="w-[300px]">
                                                        <div className="flex flex-col gap-4">
                                                            {/* Header */}
                                                            <div className="flex justify-between items-center">
                                                                <div className="rounded-4xl">
                                                                    <p className="text-sm text-amber-800 flex gap-1 p-1 items-center">
                                                                        <IconClock />
                                                                        {formatDateShort(x.followupDate)}
                                                                    </p>
                                                                </div>
                                                                <Tag severity={x.progress <= 20 ? "danger" : x.progress <= 70 ? "warning" : "success"}>{x.progress}%</Tag>

                                                                <Badge radius="sm" variant="outline" color="purple" className="!capitalize">{recMap[x.status]}</Badge>
                                                            </div>

                                                            {/* Progress Section */}
                                                            <Progress.Root size={20}>
                                                                <Progress.Section value={previousProgress} color="blue">
                                                                    <Progress.Label>{previousProgress}</Progress.Label>
                                                                </Progress.Section>
                                                                {progressMade > 0 && (
                                                                    <Progress.Section value={progressMade} color="teal">
                                                                        <Progress.Label className="text-xs">{progressMade}</Progress.Label>
                                                                    </Progress.Section>
                                                                )}
                                                            </Progress.Root>

                                                            <div className="bg-blue-50 shadow-sm rounded-lg p-2">
                                                                <p className="text-blue-400">Update Details</p>
                                                                {/* LOT 41 P0 XSS fix */}
                                                                <SafeHtml html={x.comment || "-"} className="text-gray-700 mt-1 text-sm" />
                                                            </div>
                                                        </div>
                                                    </Card>
                                                );
                                            })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </Modal>
            </div >

        </div >
    );
};

export default Recommendation;

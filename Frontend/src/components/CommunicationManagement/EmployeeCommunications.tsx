import { useState, useMemo, useEffect, MouseEvent, ReactNode } from 'react';
import {
    Card,
    Text,
    Group,
    Button,
    Select,
    Breadcrumbs,
    Input,
    ActionIcon,
    Tooltip,
    Loader,
} from '@mantine/core';
import {
    IconSearch,
    IconPlus,
    IconCheck,
    IconMessageCircle,
    IconBolt,
    IconAlertTriangle,
    IconLayoutGrid,
    IconLayoutList,
    IconPlayerPlay,
    IconPlayerPause,
    IconPlayerStop,
} from '@tabler/icons-react';
import { communicationTypes, communicationCategories } from '../../Data/dummyData/communicationData';

import { Link, useNavigate } from 'react-router-dom';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { FilterMatchMode } from 'primereact/api';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { Toolbar } from 'primereact/toolbar';
import {
    getAllCommunications,
    resumeCommunicationSchedule,
    pauseCommunicationSchedule,
    cancelCommunicationSchedule,
} from '../../services/CommunicationService';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../slices/OverlaySlice';
import { formatDateShort } from '../../utility/DateFormats';
import { getAllDepartments } from '../../services/HrmsService';
import { mapIdToName } from '../../utility/OtherUtilities';
import CommunicationCard from './EmployeeCommunications/CommunicationCard';
import { successNotification, errorNotification } from '../../utility/NotificationUtility';
import { modals } from '@mantine/modals';
import StatusSummaryCards, { type StatusSummaryCardConfig } from './StatusSummaryCards';



const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
}
const formatEnumValue = (value?: string | null) => {
    if (!value) return '-';
    return value
        .toString()
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};

const normalizeRecipients = (recipients: unknown): number[] => {
    if (Array.isArray(recipients)) {
        return recipients.map((r) => Number(r)).filter((r) => !Number.isNaN(r));
    }

    if (typeof recipients === 'string') {
        try {
            const parsed = JSON.parse(recipients);
            if (Array.isArray(parsed)) {
                return parsed.map((r) => Number(r)).filter((r) => !Number.isNaN(r));
            }
        } catch (_error) {
            return [];
        }
    }

    return [];
};

const normalizeCommunication = (comm: any) => {
    const recipientsList = normalizeRecipients(comm?.recipients);
    const schedule = comm?.schedule ?? {};

    return {
        ...comm,
        recipientsList,
        recipientCount: recipientsList.length,
        scheduleType: schedule?.scheduleType ?? comm?.scheduleType ?? null,
        status: comm?.status ?? schedule?.status ?? null,
        nextRunAt: schedule?.nextRunAt ?? comm?.nextRunAt ?? null,
        scheduledAt: schedule?.oneTimeAt ?? comm?.scheduledAt ?? comm?.createdAt,
        departmentName: comm?.department?.name ?? comm?.departmentName ?? null,
    };
};

const getActionLoaderColor = (color: string) => {
    switch (color) {
        case 'yellow':
            return 'orange';
        case 'green':
            return 'teal';
        default:
            return color;
    }
};

const EmployeeCommunications = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

    const dispatch = useDispatch();
    const [departmentMap, setDepartmentMap] = useState<Record<number, any>>({});
    const [departments, setDepartments] = useState<any[]>([]);
    const [communications, setCommunications] = useState<any[]>([]);
    const [viewType, setViewType] = useState<'table' | 'card'>('table');
    const navigate = useNavigate();
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [_globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [scheduleActionLoading, setScheduleActionLoading] = useState<Record<number, 'resume' | 'pause' | 'cancel'>>({});


    useEffect(() => {
        dispatch(showOverlay());
        getAllCommunications().then((data) => {
            const normalized = (data || []).map((comm: any) => normalizeCommunication(comm));
            setCommunications(normalized);
        }).finally(() => {
            dispatch(hideOverlay());
        });
        getAllDepartments().then((data) => {
            setDepartments(data);
            setDepartmentMap(mapIdToName(data));
        }).finally(() => {
            dispatch(hideOverlay());
        });
    }, [])

    useEffect(() => {
        if (!Object.keys(departmentMap).length) {
            return;
        }

        setCommunications((prev) => {
            let changed = false;
            const updated = prev.map((comm) => {
                const key = comm?.departmentId !== undefined && comm?.departmentId !== null
                    ? Number(comm.departmentId)
                    : null;
                if (key === null || Number.isNaN(key)) {
                    return comm;
                }
                const mappedName = departmentMap[key]?.name;
                if (mappedName && comm.departmentName !== mappedName) {
                    changed = true;
                    return { ...comm, departmentName: mappedName };
                }
                return comm;
            });
            return changed ? updated : prev;
        });
    }, [departmentMap]);

    const handleScheduleAction = async (communication: any, action: 'resume' | 'pause' | 'cancel') => {
        const id = communication?.id;
        if (!id) return;

        const numericId = Number(id);
        setScheduleActionLoading((prev) => ({ ...prev, [numericId]: action }));
        dispatch(showOverlay());

        const successMessages: Record<typeof action, string> = {
            resume: 'Schedule resumed successfully',
            pause: 'Schedule paused successfully',
            cancel: 'Schedule cancelled successfully',
        };

        try {
            let response;
            if (action === 'resume') {
                response = await resumeCommunicationSchedule(id);
            } else if (action === 'pause') {
                response = await pauseCommunicationSchedule(id);
            } else {
                response = await cancelCommunicationSchedule(id);
            }

            const normalized = normalizeCommunication(response);
            setCommunications((prev) => prev.map((comm) => (comm.id === normalized.id ? normalized : comm)));
            successNotification(successMessages[action]);
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Failed to update schedule';
            errorNotification(message);
        } finally {
            dispatch(hideOverlay());
            setScheduleActionLoading((prev) => {
                const updated = { ...prev };
                delete updated[numericId];
                return updated;
            });
        }
    };

    const getScheduleActionDisabled = (communication: any, action: 'resume' | 'pause' | 'cancel') => {
        const status = String(communication?.status ?? '').toUpperCase();
        const hasSchedule = Boolean(communication?.scheduleType);
        if (!hasSchedule) return true;

        if (action === 'resume') {
            return !['PAUSED', 'CANCELLED'].includes(status);
        }

        if (action === 'pause') {
            return ['PAUSED', 'CANCELLED', 'COMPLETED'].includes(status);
        }

        if (action === 'cancel') {
            return ['CANCELLED', 'COMPLETED'].includes(status);
        }

        return false;
    };

    const renderScheduleActionButtons = (communication: any) => {
        const id = Number(communication?.id);
        const loadingAction = scheduleActionLoading[id];

        const actionMeta: Record<'resume' | 'pause' | 'cancel', { label: string; color: string; icon: ReactNode; confirmation: string; confirmLabel: string; }> = {
            resume: {
                label: 'Resume schedule',
                color: 'green',
                icon: <IconPlayerPlay size={16} />,
                confirmation: 'This will resume the schedule and calculate the next run time. Do you want to continue?',
                confirmLabel: 'Resume',
            },
            pause: {
                label: 'Pause schedule',
                color: 'yellow',
                icon: <IconPlayerPause size={16} />,
                confirmation: 'This will pause the schedule and stop future runs until resumed. Continue?',
                confirmLabel: 'Pause',
            },
            cancel: {
                label: 'Cancel schedule',
                color: 'red',
                icon: <IconPlayerStop size={16} />,
                confirmation: 'This will cancel the schedule permanently. You will need to create a new schedule to resume. Are you sure?',
                confirmLabel: 'Cancel Schedule',
            },
        };

        const openConfirmation = (event: MouseEvent<HTMLButtonElement>, action: 'resume' | 'pause' | 'cancel') => {
            event.preventDefault();
            event.stopPropagation();
            if (getScheduleActionDisabled(communication, action) || loadingAction) {
                return;
            }

            const meta = actionMeta[action];
            modals.openConfirmModal({
                title: meta.label,
                centered: true,
                children: (
                    <Text size="sm">
                        {meta.confirmation}
                    </Text>
                ),
                labels: { confirm: meta.confirmLabel, cancel: 'Close' },
                confirmProps: { color: meta.color },
                onConfirm: () => handleScheduleAction(communication, action),
            });
        };

        return (['resume', 'pause', 'cancel'] as const).map((action) => {
            const meta = actionMeta[action];
            const isDisabled = getScheduleActionDisabled(communication, action) || Boolean(loadingAction && loadingAction !== action);
            const isLoading = loadingAction === action;

            return (
                <Tooltip key={action} label={meta.label}>
                    <ActionIcon
                        color={meta.color}
                        variant="light"
                        size="md"
                        disabled={isDisabled}
                        onClick={(event) => openConfirmation(event, action)}
                    >
                        {isLoading ? <Loader size="sm" color={getActionLoaderColor(meta.color)} /> : meta.icon}
                    </ActionIcon>
                </Tooltip>
            );
        });
    };

    // Filter communications based on search criteria
    const filteredCommunications = useMemo(() => {
        let filtered = communications;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(comm => {
                const titleMatch = (comm?.title ?? '').toLowerCase().includes(term);
                const contentMatch = (comm?.content ?? '').toLowerCase().includes(term);
                const typeMatch = (comm?.type ?? '').toLowerCase().includes(term);
                const senderSource = comm?.sender ?? comm?.senderName ?? '';
                const senderMatch = senderSource.toLowerCase().includes(term);

                return titleMatch || contentMatch || typeMatch || senderMatch;
            });
        }

        if (selectedType) {
            filtered = filtered.filter(comm => comm.type === selectedType);
        }

        if (selectedCategory) {
            filtered = filtered.filter(comm => comm.category === selectedCategory);
        }

        if (selectedDepartment) {
            filtered = filtered.filter(comm => comm.departmentId == selectedDepartment);
        }



        return filtered;
    }, [searchTerm, selectedType, selectedCategory, selectedDepartment, communications]);

    const summaryCards = useMemo<StatusSummaryCardConfig[]>(() => {
        const total = communications.length;
        const normalize = (status: any) => String(status ?? '').toUpperCase();
        const activeStatuses = new Set(['ACTIVE', 'SCHEDULED', 'PENDING', 'RUNNING']);
        const completedStatuses = new Set(['COMPLETED', 'FINISHED', 'DONE']);
        const pausedStatuses = new Set(['PAUSED', 'ON_HOLD', 'HALTED', 'CANCELLED', 'CANCELED']);
        const now = new Date();

        const formatCount = (value: number) => new Intl.NumberFormat('en-US').format(value);
        const percentageLabel = (count: number) => (
            total > 0 ? `${Math.round((count / total) * 100)}% of total` : 'Awaiting first record'
        );

        const active = communications.filter((comm) => {
            const status = normalize(comm?.status);
            if (activeStatuses.has(status)) return true;
            if (completedStatuses.has(status) || pausedStatuses.has(status)) return false;
            if (comm?.expiresAt) {
                return new Date(comm.expiresAt) > now;
            }
            return Boolean(comm?.scheduleType);
        }).length;

        const completed = communications.filter((comm) =>
            completedStatuses.has(normalize(comm?.status))
        ).length;

        const paused = communications.filter((comm) =>
            pausedStatuses.has(normalize(comm?.status))
        ).length;

        return [
            {
                key: 'total',
                title: 'Total Communications',
                value: formatCount(total),
                icon: IconMessageCircle,
                color: 'blue',
                description: 'All HSE communications created and tracked.',
            },
            {
                key: 'active',
                title: 'Active',
                value: formatCount(active),
                icon: IconBolt,
                color: 'teal',
                description: 'Currently scheduled or running deliveries.',
                meta: { label: percentageLabel(active), color: 'teal' },
            },
            {
                key: 'completed',
                title: 'Completed',
                value: formatCount(completed),
                icon: IconCheck,
                color: 'indigo',
                description: 'Campaigns finished with completion status.',
                meta: { label: percentageLabel(completed), color: 'indigo' },
            },
            {
                key: 'paused',
                title: 'Paused',
                value: formatCount(paused),
                icon: IconAlertTriangle,
                color: 'orange',
                description: 'Schedules paused and awaiting action.',
                meta: { label: percentageLabel(paused), color: 'orange' },
            },
        ] satisfies StatusSummaryCardConfig[];
    }, [communications]);


    // --- Templates for columns ---

    const leftToolbarTemplate = () => {
        return (
            <div className="flex gap-2">
                <Select
                    placeholder="Filter by Type"
                    data={communicationTypes}
                    value={selectedType}
                    onChange={setSelectedType}
                    clearable
                />
                <Select
                    placeholder="Filter by Category"
                    data={communicationCategories}
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    clearable
                />
                <Select
                    placeholder="Filter by Department"
                    data={departments.map(dep => ({ value: "" + dep.id, label: dep.name }))}
                    value={selectedDepartment}
                    onChange={setSelectedDepartment}
                    clearable
                />
                {/* <Select
                    placeholder="Filter by Status"
                    data={[
                        { value: 'Active', label: 'Active' },
                        { value: 'Archived', label: 'Archived' },
                        { value: 'Draft', label: 'Draft' }
                    ]}
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    clearable
                /> */}
            </div>
        );
    };
    const rightToolbarTemplate = () => {
        return (
            <div className='flex items-center gap-3'>
                <div className="flex items-center gap-1 border border-blue-200 rounded-lg p-1 bg-blue-50">
                    <Tooltip label="Table View">
                        <ActionIcon
                            variant={viewType === 'table' ? 'filled' : 'light'}
                            color="blue"
                            onClick={() => setViewType('table')}
                        >
                            <IconLayoutList size={18} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Card View">
                        <ActionIcon
                            variant={viewType === 'card' ? 'filled' : 'light'}
                            color="blue"
                            onClick={() => setViewType('card')}
                        >
                            <IconLayoutGrid size={18} />
                        </ActionIcon>
                    </Tooltip>
                </div>
                <Input
                    value={_globalFilterValue}
                    leftSection={<IconSearch size={16} />}
                    placeholder="Search Communication..."
                    type="search"
                    size='md'
                    onChange={onGlobalFilterChange}
                />
            </div>
        );
    };


    const titleTemplate = (rowData: any) => (
        <div className="flex flex-col gap-1">
            <a
                onClick={() => navigate(`communications-details/${rowData.id}`)}
                className="text-sm text-blue-700 hover:underline cursor-pointer transition"
            >
                {rowData.title}
            </a>



            {/* <p className="text-xs text-gray-500">{rowData.content}</p> */}
        </div>
    );

    const typeTemplate = (rowData: any) => formatEnumValue(rowData.type);

    const categoryTemplate = (rowData: any) => rowData.category ?? '-';



    const formatDateValue = (value?: string | null) => (value ? formatDateShort(value) : '-');

    const recipientsTemplate = (rowData: any) => (
        <span style={{ fontWeight: 500 }}>{rowData.recipientCount ?? 0}</span>
    );



    const dateTemplate = (rowData: any) => (
        <div>
            <span>{formatDateValue(rowData.scheduledAt)}</span>

        </div>
    );
    const expiryDateTemplate = (rowData: any) => (
        <div>
            <span>{formatDateValue(rowData.expiresAt)}</span>

        </div>
    );

    const departmentTemplate = (rowData: any) => (
        <span>{resolveDepartmentName(rowData)}</span>
    );

    const urgencyTemplate = (rowData: any) => {
        const value = formatEnumValue(rowData.urgency);
        const severity = rowData.urgency === 'URGENT' ? 'danger' : 'success';
        return (
            <Tag
                value={value}
                severity={severity}
                className="text-xs px-2 py-1 rounded-full"
            />
        );
    };

    const statusTemplate = (rowData: any) => {
        const status = rowData.status;
        const normalized = formatEnumValue(status);
        const severity = (() => {
            if (!status) return 'secondary';
            const upper = status.toString().toUpperCase();
            if (upper === 'COMPLETED' || upper === 'ACTIVE' || upper === 'SENT') return 'success';
            if (upper === 'PENDING' || upper === 'SCHEDULED') return 'warning';
            if (upper === 'FAILED' || upper === 'CANCELLED') return 'danger';
            return 'secondary';
        })();

        return (
            <Tag
                value={normalized}
                severity={severity}
                className="text-xs px-2 py-1 rounded-full"
            />
        );
    };

    const scheduleTypeTemplate = (rowData: any) => formatEnumValue(rowData.scheduleType);

    const nextRunTemplate = (rowData: any) => (
        <div>
            <span>{formatDateValue(rowData.nextRunAt)}</span>

        </div>
    );
    const scheduleActionsTemplate = (rowData: any) => (
        <Group gap="xs">{renderScheduleActionButtons(rowData)}</Group>
    );
    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        // @ts-ignore
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
        setSearchTerm(value);
    };

    const resolveDepartmentName = (comm: any) => {
        const key = comm?.departmentId !== undefined && comm?.departmentId !== null
            ? Number(comm.departmentId)
            : null;
        return (key !== null && !Number.isNaN(key) ? departmentMap[key]?.name : undefined)
            ?? comm?.departmentName
            ?? comm?.department?.name
            ?? (typeof comm?.department === 'string' ? comm.department : null)
            ?? '-';
    };


    return (
        <div className='flex flex-col gap-3 p-5'>
            <div className='flex justify-between items-center'>

                <div>
                    {/* LOT 40 P1: text-blue-500 -> text-slate-900 for consistent header tokens */}
                    <div className="text-2xl text-slate-900 w-fit">Employee Communications</div>
                    <Breadcrumbs mt="xs">
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient">Home</Text>
                        </Link>

                        <Text variant="gradient">Employee Communications</Text>
                    </Breadcrumbs>
                </div>

                <Button size="xs" onClick={() => navigate('create-communications')} leftSection={<IconPlus />} variant="gradient">New Communication</Button>
            </div>
            <p className='italic text-gray-600'>Manage Health & Safety communications sent to employees</p>
            <div className='flex flex-col gap-8'>
                <StatusSummaryCards cards={summaryCards} />



                <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Toolbar className="mb-1 !p-2" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>
                    {viewType === 'table' ? (
                        <DataTable
                            selectionMode="single" size='small' stripedRows removableSort paginator rows={10}
                            value={filteredCommunications}
                            responsiveLayout="scroll"
                            className='[&_.p-datatable-tbody]:!text-sm'
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            rowsPerPageOptions={[10, 25, 50]} dataKey="name" filters={filters} globalFilterFields={['title', 'type', 'category', 'department']}
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries" onFilter={(e) => setFilters(e.filters)}
                        >
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="title" header="Title" body={titleTemplate} />
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="type" header="Type" body={typeTemplate} />
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="category" header="Category" body={categoryTemplate} />
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="urgency" header="Urgency" body={urgencyTemplate} />
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="status" header="Status" body={statusTemplate} />
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="departmentId" header="Department" body={departmentTemplate} />
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="recipientCount" header="Recipients" body={recipientsTemplate} />
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="scheduleType" header="Schedule Type" body={scheduleTypeTemplate} />
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="nextRunAt" header="Next Run" body={nextRunTemplate} />
                            {/* <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header="Acknowledgment" body={ackTemplate} /> */}
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="date" header="Scheduled Date" body={dateTemplate} />
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="date" header="Expiry Date" body={expiryDateTemplate} />
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} body={scheduleActionsTemplate} header="Actions" />
                        </DataTable>
                    ) : (
                        filteredCommunications.length ? (
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                                {filteredCommunications.map((comm) => (
                                    <CommunicationCard
                                        key={comm.id ?? comm.title}
                                        communication={comm}
                                        departmentName={resolveDepartmentName(comm)}
                                        actions={renderScheduleActionButtons(comm)}
                                        onViewDetails={() => navigate(`communications-details/${comm.id}`)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-sm text-gray-500 py-6">No communications found</div>
                        )
                    )}
                </Card>
            </div>

        </div>
    );
};

export default EmployeeCommunications;

import { useEffect, useMemo, useState } from 'react';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import {
    IconPlus, IconEdit, IconX, IconCalendar, IconUser, IconAlertTriangle,
    IconCircleCheck, IconClock, IconTarget, IconSearch, IconLayoutGrid, IconLayoutList,
    IconBuilding, IconBolt,
} from '@tabler/icons-react';
import { ActionIcon, Button, Select, TextInput, Tooltip, Badge, Progress } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../UtilityComp/PageHeader';
import { getAllAdhoc } from '../../../services/CorrectiveActionService';
import { getTwProgressColor, mapIdToName } from '../../../utility/OtherUtilities';
import { formatDateShort } from '../../../utility/DateFormats';
import { actionStatuses, actionStatusesMap } from '../../../Data/DropdownData';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { getAllDepartments } from '../../../services/HrmsService';
import { getEmployeeDropdown } from '../../../services/EmployeeService';




const AdhocActions = () => {
    const [actions, setActions] = useState<any[]>([]);
    const [deptMap, setDeptMap] = useState<Record<number, any>>({});
    const [empMap, setEmpMap] = useState<Record<number, any>>({});
    const [departments, setDepartments] = useState<Array<{ label: string, value: string }>>([]);
    const [owners, setOwners] = useState<Array<{ label: string, value: string }>>([]);
    const [selectedStatus, setSelectedStatus] = useState<string | null>('All');
    const [selectedOwner, setSelectedOwner] = useState<string | null>('All');
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>('All');
    const [viewType, setViewType] = useState<'table' | 'card'>('table');
    const defaultFilters: DataTableFilterMeta = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    };
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    // const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const navigate = useNavigate();



    useEffect(() => {
        getAllAdhoc()
            .then((res) => {

                setActions(res);
            })
            .catch((err) => {
                console.error(err);
            });

        // Fetch departments and employees for mapping owner and department names
        getAllDepartments()
            .then((res) => {
                setDeptMap(mapIdToName(res));
                setDepartments(res.map((d: any) => ({ label: d.name, value: String(d.id) })));
            })
            .catch((_err) => { });

        getEmployeeDropdown()
            .then((res) => {
                setEmpMap(mapIdToName(res));
                setOwners(res.map((e: any) => ({ label: e.name, value: String(e.id) })));
            })
            .catch((_err) => { });

    }, []);

    // const priorities = ['low', 'medium', 'high', 'critical'];

    // const getPriorityColor = (priority: string) => {
    //     switch (priority) {
    //         case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    //         case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    //         case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    //         case 'low': return 'bg-green-100 text-green-800 border-green-200';
    //         default: return 'bg-gray-100 text-gray-800 border-gray-200';
    //     }
    // };
    const getStatusColor = (status: string) => {
        switch (status) {

            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // 👈 add this
            case 'IN_PROGRESS': return 'bg-green-100 text-green-800 border-green-200';
            case 'COMPLETED': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <IconCircleCheck className="w-4 h-4" />;
            case 'in-progress': return <IconClock className="w-4 h-4" />;
            case 'on-hold': return <IconAlertTriangle className="w-4 h-4" />;
            case 'not-started': return <IconTarget className="w-4 h-4" />;
            case 'cancelled': return <IconX className="w-4 h-4" />;
            case 'PENDING': return <IconClock className="w-4 h-4 text-yellow-800" />; // 👈 add this
            default: return <IconTarget className="w-4 h-4" />;
        }
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        // @ts-ignore
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const enrichedActions = useMemo(() => {
        return actions.map((a: any) => ({
            ...a,
            ownerName: empMap[a?.ownerId]?.name ?? '-',
            departmentName: deptMap[a?.departmentId]?.name ?? '-',
        }));
    }, [actions, empMap, deptMap]);

    const filteredData = useMemo(() => {
        return enrichedActions.filter((a: any) => {
            const statusMatch = selectedStatus === 'All' || a.status === selectedStatus;
            const ownerMatch = selectedOwner === 'All' || (a.ownerId && String(a.ownerId) === selectedOwner);
            const departmentMatch = selectedDepartment === 'All' || (a.departmentId && String(a.departmentId) === selectedDepartment);
            return statusMatch && ownerMatch && departmentMatch;
        });
    }, [enrichedActions, selectedStatus, selectedOwner, selectedDepartment]);

    const nameBodyTemplate = (rowData: any) => (
        <span onClick={() => navigate(`adhocAction-details/${rowData.id}`)} className='hover:underline text-blue-500 cursor-pointer'>
            {rowData.actionName}
        </span>
    );

    const statusBodyTemplate = (rowData: any) => (
        <Badge radius="sm" className='!capitalize !font-medium' color="purple" variant='outline'>
            {actionStatusesMap[rowData.status]}
        </Badge>
    );

    const progressBodyTemplate = (rowData: any) => {
        const p = Number(rowData?.progress ?? 0);
        const color = p < 20 ? 'red' : p < 70 ? 'orange' : 'green';
        return (
            <div style={{ width: 90 }}>
                <Progress.Root size={15} style={{ width: 90 }}>
                    <Tooltip label={`${p}%`} withArrow>
                        <Progress.Section value={p} color={color}>
                            <Progress.Label>{p}</Progress.Label>
                        </Progress.Section>
                    </Tooltip>
                </Progress.Root>
            </div>
        );
    };

    const actionBodyTemplate = (rowData: any) => {
        const statusUpper = String(rowData?.status).toUpperCase();
        const progress = Number(rowData?.progress ?? 0);
        const canEdit = statusUpper === 'PENDING';
        const canUpdate = progress < 100 && !['COMPLETED', 'PENDING', 'CANCELLED'].includes(statusUpper);

        const editTooltip = canEdit
            ? 'Edit'
            : statusUpper === 'COMPLETED' ? 'Cannot edit a completed idea'
            : statusUpper === 'CANCELLED' ? 'Cannot edit a cancelled idea'
            : 'Editing is only allowed while pending';

        const updateTooltip = canUpdate
            ? 'Update Progress'
            : statusUpper === 'PENDING' ? 'Pending approval — cannot update yet'
            : statusUpper === 'CANCELLED' ? 'Idea cancelled — cannot update'
            : progress >= 100 || statusUpper === 'COMPLETED' ? 'Already completed'
            : 'Update not allowed';

        return (
            <div className='flex gap-3 justify-center'>
                <Tooltip label={editTooltip}>
                    <span className="inline-flex">
                        <ActionIcon
                            onClick={() => canEdit && navigate(`edit/${rowData.id}`)}
                            variant="filled"
                            size="sm"
                            color="primary"
                            disabled={!canEdit}
                        >
                            <IconEdit style={{ width: '90%', height: '90%' }} stroke={1.5} />
                        </ActionIcon>
                    </span>
                </Tooltip>
                <Tooltip label={updateTooltip}>
                    <span className="inline-flex">
                        <ActionIcon
                            onClick={() => canUpdate && navigate(`updateAdhocAction-details/${rowData.id}`)}
                            variant="filled"
                            size="sm"
                            color="blue"
                            disabled={!canUpdate}
                        >
                            <IconClock style={{ width: '90%', height: '90%' }} stroke={1.5} />
                        </ActionIcon>
                    </span>
                </Tooltip>
            </div>
        );
    };

    const rightToolbarTemplate = () => (
        <div className="flex gap-4 items-center">
            <div className="flex items-center gap-1 border border-primary rounded-lg p-1 bg-gray-100">
                <Tooltip label="Vue tableau">
                    <ActionIcon
                        variant={viewType === 'table' ? 'filled' : 'light'}
                        color="blue"
                        onClick={() => setViewType('table')}
                        aria-label="Vue tableau"
                        size="md"
                    >
                        <IconLayoutList size={16} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label="Vue cartes">
                    <ActionIcon
                        variant={viewType === 'card' ? 'filled' : 'light'}
                        color="blue"
                        onClick={() => setViewType('card')}
                        aria-label="Vue cartes"
                        size="md"
                    >
                        <IconLayoutGrid size={16} />
                    </ActionIcon>
                </Tooltip>
            </div>

            <TextInput
                value={globalFilterValue}
                onChange={onGlobalFilterChange}
                size="sm"
                placeholder="Rechercher..."
                leftSection={<IconSearch size={14} />}
            />
        </div>
    );

    const dropdownFilterTemplate = () => (
        <div className="flex items-center gap-2">
            <Select allowDeselect={false}
                size='sm'
                data={[{ label: "Tous statuts", value: "All" }, ...actionStatuses]}
                value={selectedStatus}
                onChange={setSelectedStatus}
                placeholder="Statut"
            />
            <Select allowDeselect={false}
                size='sm'
                data={[{ label: 'Tous responsables', value: 'All' }, ...owners]}
                value={selectedOwner}
                onChange={setSelectedOwner}
                placeholder="Responsable"
                searchable
            />
            <Select allowDeselect={false}
                size='sm'
                data={[{ label: 'Tous départements', value: 'All' }, ...departments]}
                value={selectedDepartment}
                onChange={setSelectedDepartment}
                placeholder="Département"
            />
        </div>
    );



    // const getProgressColor = (progress: number) => {
    //     if (progress === 100) return 'bg-green-500';
    //     if (progress >= 75) return 'bg-blue-500';
    //     if (progress >= 50) return 'bg-yellow-500';
    //     if (progress >= 25) return 'bg-orange-500';
    //     return 'bg-red-500';
    // };

    return (
        <div className="p-5 space-y-5 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Actions Correctives' },
                    { label: "Suggestions d'amélioration" },
                ]}
                icon={<IconBolt size={22} stroke={2} />}
                iconColor="orange"
                title="Suggestions d'amélioration HSE"
                subtitle="Capture, priorisation et suivi des idées d'amélioration contribuées dans toute l'organisation"
                actions={
                    <Button
                        size='sm'
                        radius="md"
                        onClick={() => navigate('create-adhocAction')}
                        leftSection={<IconPlus size={14} />}
                        color="orange"
                    >
                        Nouvelle suggestion
                    </Button>
                }
            />

            {/* Content */}
            <div className="">
                <Toast />
                <Toolbar className="mb-4 !p-2" left={dropdownFilterTemplate} right={rightToolbarTemplate} />
                {
                    viewType === 'table' ? (
                        <DataTable
                            selectionMode="single"
                            className='[&_.p-datatable-tbody]:!text-sm'
                            size="small"
                            stripedRows
                            removableSort
                            paginator
                            value={filteredData}
                            rows={10}
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            rowsPerPageOptions={[10, 25, 50]}
                            dataKey="id"
                            filters={filters}
                            globalFilterFields={['actionName', 'description', 'assignedEmployeeName', 'ownerName', 'departmentName', 'deadline', 'status']}
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                            onFilter={(e) => setFilters(e.filters)}
                        >
                            <Column style={{ fontWeight: 'normal', fontSize: "13px" }} field="actionName" body={nameBodyTemplate} header="Titre de la suggestion" sortable />
                            <Column style={{ fontWeight: 'normal', fontSize: "13px" }} field="assignedEmployeeName" header="Assigné à" sortable />
                            <Column style={{ fontWeight: 'normal', fontSize: "13px" }} field="ownerName" header="Responsable" />
                            <Column style={{ fontWeight: 'normal', fontSize: "13px" }} field="departmentName" header="Département" />
                            <Column style={{ fontWeight: 'normal', fontSize: "13px" }} field="deadline" header="Échéance" body={(rowData: any) => formatDateShort(rowData.deadline)} sortable />
                            <Column style={{ fontWeight: 'normal', fontSize: "13px" }} field="progress" header="Progression" body={progressBodyTemplate} sortable />
                            <Column style={{ fontWeight: 'normal', fontSize: "13px" }} field="status" header="Statut" body={statusBodyTemplate} />
                            <Column bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
                        </DataTable>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                            {filteredData.length == 0 && <div className='text-sm text-gray-500 italic col-span-3 mx-auto py-8'>Aucune suggestion trouvée.</div>}
                            {filteredData.map((action) => (
                                <div key={action.id} onClick={() => navigate(`adhocAction-details/${action.id}`)} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-primary">
                                    {/* Action Header */}
                                    <div className="p-6 border-b border-gray-100">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex-1">
                                                <div className="flex items-center mb-2">
                                                    {action.actionName}
                                                </div>
                                                {/* <p className="text-gray-600 mb-4">{action.description}</p> */}


                                            </div>

                                            <div className="flex flex-col  space-y-2">
                                                <div className="flex space-x-2">
                                                    {/* <span
                                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getPriorityColor(action.priority)}`}
                                                    >
                                                        {(action.priority ?? "").charAt(0).toUpperCase() + (action.priority ?? "").slice(1)}
                                                    </span> */}

                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getStatusColor(action.status)}`}>
                                                        {getStatusIcon(action.status)}
                                                        <span className="ml-1">{actionStatusesMap[action.status]}</span>
                                                    </span>
                                                    {/* Card header action icons removed as requested; bottom buttons retained */}
                                                </div>


                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 mt-3 text-sm">


                                            {action.assignedEmployeeName && <div className="flex ">
                                                <IconUser className="w-4 h-4 text-blue-600 mr-2" />
                                                <span className="text-gray-600">Assigné à :</span>
                                                <span className="ml-1 text-gray-700">{action.assignedEmployeeName}</span>
                                            </div>}
                                            <div className="flex items-center">
                                                <IconCalendar className="w-4 h-4 text-yellow-600 mr-2" />
                                                <span className="text-gray-600">Échéance :</span>
                                                <span className="ml-1 text-gray-700">{formatDateShort(action.deadline)}</span>
                                            </div>
                                            {action.ownerName && action.ownerName !== '-' && (
                                                <div className="flex items-center">
                                                    <IconUser className="w-4 h-4 text-green-600 mr-2" />
                                                    <span className="text-gray-600">Responsable :</span>
                                                    <span className="ml-1 text-gray-700">{action.ownerName}</span>
                                                </div>
                                            )}
                                            {action.departmentName && action.departmentName !== '-' && (
                                                <div className="flex items-center">
                                                    <IconBuilding className="w-4 h-4 text-purple-600 mr-2" />
                                                    <span className="text-gray-600">Département :</span>
                                                    <span className="ml-1 text-gray-700">{action.departmentName}</span>
                                                </div>
                                            )}


                                        </div>

                                        {/* Progress Bar (full width in card view) */}
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-gray-700">Progression</span>
                                                <span className="text-sm text-gray-900">{action.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-300 ${getTwProgressColor(action.progress)}`}
                                                    style={{ width: `${action.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Bottom actions like Incident Card */}
                                        <div className="flex justify-center grow gap-4 mt-4">
                                            <Button
                                                size='xs'
                                                variant='subtle'
                                                leftSection={<IconSearch size={14} />}
                                                color='blue'
                                                onClick={(e) => { e.stopPropagation(); navigate(`adhocAction-details/${action.id}`); }}
                                            >
                                                Détails
                                            </Button>

                                            <Tooltip
                                                label={String(action?.status).toUpperCase() === 'PENDING'
                                                    ? 'Modifier'
                                                    : (String(action?.status).toUpperCase() === 'COMPLETED' ? "Impossible de modifier une suggestion clôturée"
                                                        : String(action?.status).toUpperCase() === 'CANCELLED' ? "Impossible de modifier une suggestion annulée"
                                                            : "Modification possible uniquement en attente")}
                                            >
                                                <span className="inline-flex">
                                                    <Button
                                                        size='xs'
                                                        variant='subtle'
                                                        leftSection={<IconEdit size={14} />}
                                                        color='primary'
                                                        disabled={String(action?.status).toUpperCase() !== 'PENDING'}
                                                        onClick={(e) => { if (String(action?.status).toUpperCase() === 'PENDING') { e.stopPropagation(); navigate(`edit/${action.id}`); } }}
                                                    >
                                                        Modifier
                                                    </Button>
                                                </span>
                                            </Tooltip>

                                            <Tooltip
                                                label={(Number(action?.progress ?? 0) < 100
                                                    && !['COMPLETED', 'PENDING', 'CANCELLED'].includes(String(action?.status).toUpperCase()))
                                                    ? 'Mettre à jour la progression'
                                                    : (String(action?.status).toUpperCase() === 'PENDING' ? "En attente de validation — non modifiable"
                                                        : String(action?.status).toUpperCase() === 'CANCELLED' ? "Suggestion annulée — non modifiable"
                                                            : 'Déjà clôturée')}
                                            >
                                                <span className="inline-flex">
                                                    <Button
                                                        size='xs'
                                                        variant='subtle'
                                                        leftSection={<IconClock size={14} />}
                                                        color='blue'
                                                        disabled={!(Number(action?.progress ?? 0) < 100
                                                            && !['COMPLETED', 'PENDING', 'CANCELLED'].includes(String(action?.status).toUpperCase()))}
                                                        onClick={(e) => {
                                                            const canUpdate = (Number(action?.progress ?? 0) < 100
                                                                && !['COMPLETED', 'PENDING', 'CANCELLED'].includes(String(action?.status).toUpperCase()));
                                                            if (canUpdate) { e.stopPropagation(); navigate(`updateAdhocAction-details/${action.id}`); }
                                                        }}
                                                    >
                                                        Mettre à jour
                                                    </Button>
                                                </span>
                                            </Tooltip>
                                        </div>
                                    </div>

                                    {/* Comments Section */}
                                    {/* {action?.comments?.length > 0 && (
                                        <div className="p-6 bg-gray-50 border-b border-gray-100">
                                            <h4 className="text-sm text-gray-900 mb-4 flex items-center">
                                                <IconMessageCircle className="w-4 h-4 mr-2" />
                                                Recent Updates ({action.comments.length})
                                            </h4>
                                            <div className="space-y-3">
                                                {action.comments.slice(-2).map((comment: any) => (
                                                    <div key={comment.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm text-gray-900">{comment.author}</span>
                                                            <div className="flex items-center space-x-2">
                                                                {comment.progressUpdate !== undefined && (
                                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center">
                                                                        <IconTrendingUp className="w-3 h-3 mr-1" />
                                                                        {comment.progressUpdate}%
                                                                    </span>
                                                                )}
                                                                <span className="text-xs text-gray-500">{comment.date}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-gray-700">{comment.text}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )} */}


                                </div>
                            ))}
                        </div>
                    )
                }

            </div>

        </div>
    );
};

export default AdhocActions;

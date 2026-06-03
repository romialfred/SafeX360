import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { ActionIcon, Button, SegmentedControl, Select, Tooltip, Progress } from '@mantine/core';
import { IconLayoutGrid, IconLayoutList, IconUpload } from '@tabler/icons-react';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { useEffect, useRef, useState } from 'react';
import { getAllCorrectiveAction } from '../../../services/CorrectiveActionService';
import { errorNotification } from '../../../utility/NotificationUtility';
import { actionStatuses } from '../../../Data/DropdownData';
import { statusLabels } from '../../../Data/IncidentsData';
import CorrectiveActionCard from './CorrectiveActionCard';
import { formatDateShort } from '../../../utility/DateFormats';
import { Link } from 'react-router-dom';
// Removed contextual help from Corrective modal as requested

const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
};


const tabColorMap: Record<string, string> = {
    ALL: 'primary',
    INCIDENT: 'red',
    GENERAL_INSPECTION: 'orange',
    HS_ACTIVITY: 'green',
};


const CorrectiveData = () => {
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    // const [_globalFilterValue, setGlobalFilterValue] = useState('');
    // Removed modal in favor of full update page
    const toast = useRef<Toast>(null);
    const [data, setData] = useState<any[]>([]);
    // const [selectedRow, setSelectedRow] = useState<any>({});
    const [viewType, setViewType] = useState<'table' | 'card'>('table');
    const [selectedStatus, setSelectedStatus] = useState<string | null>('All');
    // const [actionHistory, setActionHistory] = useState<any[]>([]);
    // const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState('ALL');
    const tabs = [
        { value: 'ALL', label: `Toutes (${data.length})` },
        { value: 'INCIDENT', label: `Incident (${data.filter((x) => x.type == "INCIDENT").length})` },
        { value: 'GENERAL_INSPECTION', label: `Inspection (${data.filter((x) => x.type == "GENERAL_INSPECTION").length})` },
        { value: 'HS_ACTIVITY', label: `Activité HSE (${data.filter((x) => x.type == "HS_ACTIVITY").length})` },
        { value: "NON_CONFORMITY", label: `Non-conformité (${data.filter((x) => x.type == "NON_CONFORMITY").length})` },
        { value: "NEAR_MISS", label: `Quasi-accident (${data.filter((x) => x.type == "NEAR_MISS").length})` },
        { value: "HAZARD", label: `Danger (${data.filter((x) => x.type == "HAZARD").length})` },
    ]
    // Modal form removed

    useEffect(() => {

        getAllCorrectiveAction({})
            .then((res) => {
                setData(res);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Échec du chargement des actions");
            })
            .finally();
    }, []);




    // submit removed - updates handled on dedicated page




    // const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const value = e.target.value;
    //     let _filters = { ...filters };
    //     // @ts-ignore
    //     _filters['global'].value = value;
    //     setFilters(_filters);
    //     setGlobalFilterValue(value);
    // };
    const nameBodyTemplate = (rowData: any) => {
        const id = rowData.incidentId;
        return (
            <Link className='cursor-pointer text-blue-500 hover:!underline text-sm' to={`details/${id}/${rowData.type}`}>
                {rowData.incidentTitle}
            </Link>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <div className="flex gap-4 items-center">
                <div className="flex items-center gap-1 border border-primary rounded-lg p-1 bg-gray-100">
                    <Tooltip label="Vue tableau">
                        <ActionIcon
                            variant={viewType === 'table' ? 'filled' : 'light'}
                            color="blue"
                            onClick={() => setViewType('table')}
                        >
                            <IconLayoutList size={16} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Vue cartes">
                        <ActionIcon
                            variant={viewType === 'card' ? 'filled' : 'light'}
                            color="blue"
                            onClick={() => setViewType('card')}
                        >
                            <IconLayoutGrid size={16} />
                        </ActionIcon>
                    </Tooltip>
                </div>
                <Button size="sm" variant="default" leftSection={<IconUpload size={14} />}>
                    Exporter
                </Button>
                {/* <TextInput
                    value={globalFilterValue}
                    onChange={onGlobalFilterChange}
                    size="sm"
                    placeholder="Search"
                    leftSection={<IconSearch />}
                /> */}


            </div>
        );
    };


    const leftToolbarTemplate = () => {

        return <>
            <div className='flex gap-2'>

                <SegmentedControl
                    autoContrast
                    color={tabColorMap[tab]}
                    data={tabs}
                    value={tab}
                    fullWidth
                    size="sm"
                    radius="sm"
                    transitionDuration={500}
                    transitionTimingFunction="linear"
                    onChange={setTab}
                />
                <Select allowDeselect={false}
                    size='sm'
                    data={[{ label: "Tous statuts", value: "All" }, ...actionStatuses]}
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                />

            </div>

        </>
    };

    // const handleModalOpen = (rowData: any) => {};


    // const dropdownFilterTemplate = () => (
    //     <div className="flex items-center gap-2">
    {/* <Select allowDeselect={false}
                size='sm'
                data={[{ label: "All", value: "All" }, ...actionStatuses]}
                value={selectedStatus}
                onChange={setSelectedStatus}
            /> */}
    {/* <Select
                size='sm'
                data={[{ label: "All", value: "All" }, ...departments]}
                value={selectedDepartment}
                onChange={setSelectedDepartment}

            /> */}
    //     </div>
    // );





    const filteredData = data.filter((item) => {
        const type = tab === 'ALL' || item.type === tab;
        const statusMatch = selectedStatus === 'All' || item.status == selectedStatus;
        return type && statusMatch;
    });
    return (
        <div className="card">
            <Toast ref={toast} />
            <Toolbar className="mb-1 !p-2" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>
            {/* <Toolbar className="mb-4 !p-2" right={dropdownFilterTemplate} /> */}

            {viewType === 'table' ? (<DataTable selectionMode="single"
                className='[&_.p-datatable-tbody]:!text-sm'
                size='small'
                stripedRows
                removableSort
                paginator
                value={filteredData}
                rows={10}
                dataKey="id"
                filters={filters}
                globalFilterFields={['incidentTitle', 'actionName', 'assignedEmployeeName', 'status']}
                onFilter={(e) => setFilters(e.filters)}
            >
                <Column style={{ fontWeight: 'normal', fontSize: "13px" }} field="incidentTitle" header="Source de l'action" body={nameBodyTemplate} sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "13px" }} field="actionName" header="Plan d'action" />
                <Column style={{ fontWeight: 'normal', fontSize: "13px" }} field="assignedEmployeeName" header="Responsable" sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "13px" }} field="deadline" header="Échéance" body={(rowData) => formatDateShort(rowData.deadline)} sortable />
                <Column
                    style={{ fontWeight: 'normal', fontSize: "13px" }}
                    field="progress"
                    header="Progression"
                    body={(rowData: any) => (
                        <Progress.Root size={14}>
                            <Tooltip label={`${rowData.progress}%`} withArrow>
                                <Progress.Section
                                    value={rowData.progress}
                                    color={rowData.progress < 20 ? 'red' : rowData.progress < 70 ? 'orange' : 'green'}
                                >
                                    <Progress.Label>{rowData.progress}%</Progress.Label>
                                </Progress.Section>
                            </Tooltip>
                        </Progress.Root>
                    )}
                    sortable
                />
                <Column style={{ fontWeight: 'normal', fontSize: "13px" }} field="status" header="Statut"
                    body={(rowData: any) => {
                        const status = String(rowData.status).toUpperCase();
                        const color =
                            status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                            status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            status === 'CANCELLED' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                            'bg-slate-100 text-slate-600 border-slate-200';
                        return <span className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider rounded border ${color}`}>
                            {statusLabels[rowData.status] || rowData.status}
                        </span>;
                    }} />
                <Column
                    style={{ fontWeight: 'normal', fontSize: "13px" }}
                    header="Actions"
                    body={(rowData: any) => {
                        const statusUpper = String(rowData?.status).toUpperCase();
                        const progress = Number(rowData?.progress ?? 0);
                        const canUpdate = progress < 100 && !['COMPLETED'].includes(statusUpper);
                        const tooltip = canUpdate
                            ? "Mettre à jour la progression"
                            : statusUpper === 'PENDING' ? 'En attente de validation — non modifiable'
                                : statusUpper === 'CANCELLED' ? 'Action annulée — non modifiable'
                                    : 'Déjà clôturée';
                        return (
                            <div className="flex items-center gap-2">
                                {canUpdate ? (
                                    <Link to={`update/${rowData.id}`}>
                                        <Button variant="light" color="blue" size="xs">Mettre à jour</Button>
                                    </Link>
                                ) : (
                                    <Tooltip label={tooltip}>
                                        <span className="inline-flex">
                                            <Button variant="light" color="blue" size="xs" disabled>Mettre à jour</Button>
                                        </span>
                                    </Tooltip>
                                )}
                            </div>
                        )
                    }}
                />
            </DataTable>
            ) : (<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredData.map((correctiveActionData) => (
                    <CorrectiveActionCard key={correctiveActionData.id} action={correctiveActionData} />
                ))}
            </div>
            )}

            {/* Modal removed: updates are handled on dedicated page */}

        </div >
    );
};

export default CorrectiveData;

import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { ActionIcon, Button, Progress, SegmentedControl, TextInput, Tooltip } from '@mantine/core';
import { IconEdit, IconLayoutGrid, IconLayoutList, IconSearch, IconUpload } from '@tabler/icons-react';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllInvestigations } from '../../../services/InvestigationService';
import { investMethodMap } from '../../../Data/DropdownData';
import { formatDateShort } from '../../../utility/DateFormats';
import InvestigationCard from './InvestigationCard';
// import { useForm } from '@mantine/form';
//
import { statusLabels } from '../../../Data/IncidentsData';
// removed primereact Tag in favor of Mantine Badge for history entries



const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
};

const InvestigationFileData = () => {
    const navigate = useNavigate();
    const [investigations, setInvestigations] = useState<any[]>([]);
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const toast = useRef<Toast>(null);
    const [viewType, setViewType] = useState<'table' | 'card'>('table');
    const [selectedMethod, setSelectedMethod] = useState('All');

    // Modal-based update removed; using dedicated update page now


    useEffect(() => {
        getAllInvestigations().then((res) => {
            setInvestigations(res);
        }).catch((err) => {
            console.error("Error fetching investigations:", err);
        });
    }, [])

    // form no longer used

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        // @ts-ignore
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const rightToolbarTemplate = () => {
        return (
            <div className="flex gap-4 items-center">

                <div className="flex items-center gap-1 border border-primary rounded-lg p-1 bg-gray-100">
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
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" leftSection={<IconUpload />}>
                        Export
                    </Button>
                </div>
                <TextInput
                    value={globalFilterValue}
                    onChange={onGlobalFilterChange}
                    size="sm"
                    placeholder="Search"
                    leftSection={<IconSearch />}
                />


            </div>
        );
    };
    const nameBodyTemplate = (rowData: any) => {

        return <Link to={`/incidents/${rowData.incidentId}?tab=investigation`} className='hover:underline text-blue-500' >{rowData.incidentTitle}</Link>

    }

    const leftToolbarTemplate = () => {
        const uniqueMethods = Array.from(new Set(investigations.map(i => i.method)));
        const methodOptions = ['All', ...uniqueMethods];
        return (
            <div className='flex flex-col gap-5'>



                <SegmentedControl
                    value={selectedMethod}
                    onChange={setSelectedMethod}
                    data={methodOptions.map(method => ({
                        label: `${investMethodMap[method] || 'All'} (${investigations.filter(i => method === 'All' || i.method === method).length})`,
                        value: method,
                    }))}
                    color="blue"
                />
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
            : statusUpper === 'COMPLETED' ? 'Cannot edit a completed investigation'
            : statusUpper === 'CANCELLED' ? 'Cannot edit a cancelled investigation'
            : 'Editing is only allowed while pending';

        const updateTooltip = canUpdate
            ? 'Update Progress'
            : statusUpper === 'PENDING' ? 'Pending approval — cannot update yet'
            : statusUpper === 'CANCELLED' ? 'Investigation cancelled — cannot update'
            : progress >= 100 || statusUpper === 'COMPLETED' ? 'Already completed'
            : 'Update not allowed';

        return (
            <div className="flex gap-3 justify-center">
                <Tooltip label={updateTooltip}>
                    <span className="inline-flex">
                        <Button
                            size="compact-xs"
                            onClick={() => canUpdate && navigate(`/investigation/update/${rowData.id}`)}
                            disabled={!canUpdate}
                        >
                            Update
                        </Button>
                    </span>
                </Tooltip>
                <Tooltip label={editTooltip}>
                    <span className="inline-flex">
                        <ActionIcon
                            onClick={() => canEdit && navigate(`/incidents/investigation/${rowData.incidentId}`)}
                            variant="filled"
                            size="sm"
                            color="primary"
                            disabled={!canEdit}
                        >
                            <IconEdit stroke={1.5} style={{ width: '90%', height: '90%' }} />
                        </ActionIcon>
                    </span>
                </Tooltip>
            </div>
        );
    };

    const methodBodyTemplate = (rowData: any) => {
        return (
            <span>

                {investMethodMap[rowData.method] || 'Unknown Method'}</span>
        );
    };

    const filteredData = investigations.filter((item) => {
        const matchesMethod = selectedMethod === 'All' || item.method === selectedMethod;
        const matchesSearch =
            globalFilterValue === '' ||
            item.incidentTitle?.toLowerCase().includes(globalFilterValue.toLowerCase());

        return matchesMethod && matchesSearch;
    });

    // No local submit; updates handled on dedicated page


    return (
        <div>
            <div className="card">
                <Toast ref={toast} />
                <Toolbar className="mb-1 !p-2" left={leftToolbarTemplate} right={rightToolbarTemplate} />
                {
                    viewType === 'table' ? (
                        <DataTable selectionMode="single"
                            className='[&_.p-datatable-tbody]:!text-sm mt-2'
                            size="small"
                            stripedRows
                            removableSort
                            paginator
                            value={filteredData}
                            rows={10}
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            rowsPerPageOptions={[10, 25, 50]}
                            dataKey="name"
                            filters={filters}
                            globalFilterFields={[
                                'name',
                                'shortName',
                                'sector',
                                'company',
                            ]}
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                            onFilter={(e) => setFilters(e.filters)}
                        >
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="incidentTitle" header="Incident" body={nameBodyTemplate} />
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="method" header="Method" body={methodBodyTemplate} />
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="startDate" header="Start Date" body={(rowData) => formatDateShort(rowData.startDate)} />
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="endDate" header="End Date" body={(rowData) => formatDateShort(rowData.endDate)} />
                            <Column
                                style={{ fontWeight: 'normal', fontSize: "14px" }}
                                field="progress"
                                header="Progress"
                                body={(rowData: any) => (
                                    <Progress.Root size={15}>
                                        <Tooltip label={`${rowData.progress}%`} withArrow>
                                            <Progress.Section
                                                value={rowData.progress}
                                                color={rowData.progress < 20 ? 'red' : rowData.progress < 70 ? 'orange' : 'green'}
                                            >
                                                <Progress.Label>{rowData.progress}</Progress.Label>
                                            </Progress.Section>
                                        </Tooltip>
                                    </Progress.Root>
                                )}
                            />
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="status" header="Statut" body={(rowData: any) => {
                                /* Refonte ISO Phase 4 : badge semantique aligne NC */
                                const colors: Record<string, string> = {
                                    PENDING: 'cyan',
                                    IN_PROGRESS: 'amber',
                                    COMPLETED: 'green',
                                    CANCELLED: 'gray',
                                    ON_HOLD: 'orange',
                                };
                                const color = colors[String(rowData?.status ?? '').toUpperCase()] ?? 'gray';
                                return (
                                    <Badge color={color} variant="light" size="sm" radius="xl" className="whitespace-nowrap">
                                        {statusLabels[rowData.status]}
                                    </Badge>
                                );
                            }} />

                            <Column bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate}
                            />
                        </DataTable>

                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                            {filteredData.map((investigation) => (
                                <InvestigationCard key={investigation.id} investigation={investigation} />
                            ))}
                            {filteredData.length === 0 && (
                                <div className="text-xl text-gray-600 col-span-3 mx-auto">
                                    No investigations available
                                </div>
                            )}
                        </div>

                    )}
            </div>


            {/* Update moved to dedicated page */}

        </div>
    )
}

export default InvestigationFileData

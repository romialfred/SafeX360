import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { ActionIcon, Button, Tabs, TextInput, Tooltip } from '@mantine/core';
import { IconEdit, IconLayoutGrid, IconLayoutList, IconSearch, IconUpload } from '@tabler/icons-react';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tag } from 'primereact/tag';
import { errorNotification } from '../../../utility/NotificationUtility';
import { formatDateWithDay, formatTo12Hour } from '../../../utility/DateFormats';
import { getSeverity } from '../../../utility/OtherUtilities';
import { getAllTours } from '../../../services/HsActivityService';
import { actionStatusesMap, activityTypesMap } from '../../../Data/DropdownData';
import TourCard from './TourCard';


const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
};

const TourData = () => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const toast = useRef<Toast>(null);
    const [data, setData] = useState<any[]>([]);
    const [viewType, setViewType] = useState<'table' | 'card'>('table');
    const [selectedStatus, setSelectedStatus] = useState<string>('All');


    const statusTabs = [
        { value: 'All', label: 'All' },
        ...Array.from(new Set(data.map(d => d.status))).map(status => ({ value: status, label: actionStatusesMap[status] || status }))
    ];

    useEffect(() => {
        getAllTours()
            .then((res) => setData(res))
            .catch((err) => errorNotification(err.response?.data?.errorMessage || "Failed to fetch Inspection"));
    }, []);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        // @ts-ignore
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const rightToolbarTemplate = () => (
        <div className="flex gap-5">
            <div className="flex items-center gap-1 border border-primary rounded-lg p-1 bg-gray-100">
                <Tooltip label="Table View">
                    {/* LOT 40 P1: aria-label ajouté pour accessibilité */}
                    <ActionIcon
                        variant={viewType === 'table' ? 'filled' : 'light'}
                        color="blue"
                        onClick={() => setViewType('table')}
                        aria-label="Vue tableau"
                    >
                        <IconLayoutList size={18} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label="Card View">
                    {/* LOT 40 P1: aria-label ajouté pour accessibilité */}
                    <ActionIcon
                        variant={viewType === 'card' ? 'filled' : 'light'}
                        color="blue"
                        onClick={() => setViewType('card')}
                        aria-label="Vue cartes"
                    >
                        <IconLayoutGrid size={18} />
                    </ActionIcon>
                </Tooltip>
            </div>
            <Button size="sm" variant='outline' leftSection={<IconUpload />}  >Export</Button>
            <TextInput value={globalFilterValue} onChange={onGlobalFilterChange} size='sm' placeholder='Search' leftSection={<IconSearch />} />
        </div>
    );


    function getStatusSeverity(rowData: any) {
        return <Tag severity={getSeverity(rowData.status)} value={actionStatusesMap[rowData.status]} />;
    }
    const actionBodyTemplate = (rowData: any) => {
        const id = rowData.id;
        const statusUpper = String(rowData?.status || '').toUpperCase();
        const canEdit = !['COMPLETED', 'CANCELLED'].includes(statusUpper);
        const tooltip = canEdit ? 'Edit' : (statusUpper === 'COMPLETED' ? 'Completed — modification not possible' : 'Cancelled — modification not possible');
        return (
            <div className='flex gap-3 justify-center'>
                <Tooltip label={tooltip}>
                    <span className="inline-flex">
                        <ActionIcon onClick={() => { if (canEdit) navigate(`edit/${id}`); }} variant="filled" size="sm" color="primary" aria-label="Settings" disabled={!canEdit}>
                            <IconEdit style={{ width: '90%', height: '90%' }} stroke={1.5} />
                        </ActionIcon>
                    </span>
                </Tooltip>
            </div>
        )
    }



    const nameBodyTemplate = (rowData: any) => (
        <Link to={`details-meeting/${rowData.id}`} className='text-blue-500 hover:!underline'>{rowData.title}</Link>
    );

    const filteredData = data.filter(d => {
        const statusMatch = selectedStatus === 'All' || d.status === selectedStatus;
        return statusMatch;
    });



    // const renderTypeTabs = () => (
    //     <Tabs value={selectedType} onChange={(value) => setSelectedType(value as string)} className="!rounded-lg">
    //         <Tabs.List>
    //             {typeTabs.map(t => (
    //                 <Tabs.Tab key={t.value} value={t.value} className="!rounded-lg px-3 py-1 text-sm">
    //                     {t.label} ({data.filter(d => t.value === 'All' || d.type === t.value).length})
    //                 </Tabs.Tab>
    //             ))}
    //         </Tabs.List>
    //     </Tabs>
    // );

    const renderStatusTabs = () => (
        <Tabs value={selectedStatus} onChange={(value) => setSelectedStatus(value as string)} >
            <Tabs.List className="border-b border-slate-200 bg-white !rounded-lg p-1">
                {statusTabs.map(s => (
                    <Tabs.Tab key={s.value} value={s.value} className=" !rounded-lg px-3 py-1.5 text-sm transition-all duration-200 hover:!text-blue-600 data-[active]:!bg-blue-100 data-[active]:!text-blue-800 data-[active]:!border-blue-500">
                        {s.label} ({data.filter(d => s.value === 'All' || d.status === s.value).length})
                    </Tabs.Tab>
                ))}
            </Tabs.List>
        </Tabs>
    );


    return (
        <div className="card ">
            <Toast ref={toast} />
            <Toolbar className="mb-2 !p-2" left={renderStatusTabs} right={rightToolbarTemplate} />


            {viewType === 'table' ? (
                <DataTable selectionMode="single" size='small' stripedRows removableSort paginator value={filteredData} rows={10}
                    className='[&_.p-datatable-tbody]:!text-sm'
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    rowsPerPageOptions={[10, 25, 50]} dataKey="name" filters={filters} globalFilterFields={['title', 'type', 'status']}
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries" onFilter={(e) => setFilters(e.filters)}
                >
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="title" header="Activity Details" sortable body={nameBodyTemplate} />
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="type" header="Types" body={(rowData: any) => activityTypesMap[rowData.type]} />

                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="plannedDate" header="Planned Date" body={(rowData: any) => formatDateWithDay(rowData.plannedDate)} />
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="startTime" header="Timings" body={(rowData: any) => `${formatTo12Hour(rowData.startTime)} - ${formatTo12Hour(rowData.endTime)}`} />
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="status" header="Status" body={getStatusSeverity} />
                    <Column headerStyle={{ width: '5rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
                </DataTable>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {filteredData.map((item) => (
                        <TourCard key={item.id} tourData={item} />
                    ))}
                    {filteredData.length === 0 && (
                        <div className="text-xl text-gray-600 col-span-3 mx-auto">No tours available</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TourData;

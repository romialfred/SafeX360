import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { ActionIcon, Button, TextInput, Tooltip } from '@mantine/core';
import { IconChecklist, IconEye, IconPlus, IconSearch, IconSettings, IconUpload } from '@tabler/icons-react';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { useEffect, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Tag } from 'primereact/tag';
import { getAllPgi } from '../../../services/PgiService';
import { errorNotification } from '../../../utility/NotificationUtility';
import { formatDateWithDay, formatTo12Hour } from '../../../utility/DateFormats';
import { capitalizeFirstLetter, getSeverityForInspection } from '../../../utility/OtherUtilities';



const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
}


const MbaData = () => {

    const navigate = useNavigate();
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const toast = useRef<Toast>(null);
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {

        getAllPgi({})
            .then((res) => {
                setData(res);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Failed to fetch Inspection");
            })
            .finally();
    }, []);

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
            <div className='flex gap-5'>
                <Button size="sm" variant='outline' leftSection={<IconUpload />}  >Export</Button>
                <TextInput value={globalFilterValue} onChange={onGlobalFilterChange} size='sm' placeholder='Search' leftSection={<IconSearch />} />
            </div>
        );
    };

    const leftToolbarTemplate = () => {
        return (
            <div className="flex gap-3">
                <Button
                    size="sm"
                    onClick={() => navigate('new-card')}
                    leftSection={<IconPlus />}
                    variant="gradient"
                >
                    Add New MBA Card
                </Button>
                <Button
                    size="sm"
                    onClick={() => navigate('/PGI/calendar')}
                    leftSection={<IconSettings />}
                    variant="gradient"
                >
                    Manage Template
                </Button>
            </div>
        );
    };






    function getStatusSeverity(rowData: any) {
        return <Tag severity={getSeverityForInspection(rowData.status)} value={rowData.status} />;
    }
    const actionBodyTemplate = (rowData: any) => {
        const id = rowData.id;
        return (
            <div className='flex gap-3 '>
                {/* LOT 40 P1: aria-label descriptifs ajoutés */}
                <Tooltip label="View Deatils">
                    <ActionIcon onClick={() => navigate(`/PGI/viewPgi/${id}`)} variant="filled" size="sm" color="yellow" aria-label="Voir détails">
                        <IconEye style={{ width: '90%', height: '90%' }} stroke={1.5} /></ActionIcon>
                </Tooltip>
                {rowData.status != "COMPLETED" && rowData.status != "CANCELLED" && <Tooltip label="Start Inspection">
                    <ActionIcon onClick={() => navigate(`/PGI/inspection/${id}`)} variant="filled" size="sm" color="blue" aria-label="Démarrer l'inspection">
                        <IconChecklist stroke={1.5} style={{ width: '90%', height: '90%' }} /></ActionIcon>
                </Tooltip>}
                {/* <Tooltip label="Edit">
                    <ActionIcon onClick={() => navigate(`editPgi/${id}`)} variant="filled" size="lg" color="primary">
                        <IconEdit style={{ width: '90%', height: '90%' }} stroke={1.5} /></ActionIcon>
                </Tooltip> */}
            </div>
        )
    }

    return (
        <div className="card ">
            <Toast ref={toast} />
            <Toolbar className="mb-1 !p-2" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>
            <DataTable selectionMode="single" size='small' stripedRows removableSort paginator value={data} rows={10} className='[&_.p-datatable-tbody]:!text-sm'
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                rowsPerPageOptions={[10, 25, 50]} dataKey="name" filters={filters} globalFilterFields={['name', 'shortName', 'sector', 'company']}
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries" onFilter={(e) => setFilters(e.filters)}
            >

                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="title" header="Worker" sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="frequency" header="Date & Shift" body={(rowData: any) => capitalizeFirstLetter(rowData.frequency)} />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="plannedDate" header="Department" body={(rowData: any) => formatDateWithDay(rowData.plannedDate)} />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="startTime" header="Location" body={(rowData: any) => formatTo12Hour(rowData.startTime)} />

                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="status" header="Status" body={getStatusSeverity} />
                <Column headerStyle={{ width: '5rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />




            </DataTable>

        </div>
    )
}

export default MbaData
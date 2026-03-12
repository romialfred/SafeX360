import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { ActionIcon, Tooltip } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { FilterMatchMode } from 'primereact/api';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Column } from 'primereact/column';

const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
};

// const requirementData = [
//     {
//         requirement: 'Forklift Operation Certificate',
//         category: 'Regulatory',
//         renewalFrequency: 'Biennially',
//         status: 'Missing',
//         lastSubmitted: 'Never',
//         expires: 'N/A',
//     },
//     {
//         requirement: 'Forklift Operation Certificate',
//         category: 'Regulatory',
//         renewalFrequency: 'Biennially',
//         status: 'Missing',
//         lastSubmitted: 'Never',
//         expires: 'N/A',
//     },
// ];

const DocTable = () => {


    const navigate = useNavigate();
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const toast = useRef<Toast>(null);


    const actionBodyTemplate = (rowData: any) => {
        const id = rowData.id;
        return (
            <div className='flex gap-3'>
                <Tooltip label="View Details">
                    <ActionIcon onClick={() => navigate(`View-details/${id}`)} variant="filled" size="sm" color="primary">
                        <IconEye style={{ width: '90%', height: '90%' }} stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
            </div>
        );
    };



    return (
        <div className="card">
            <Toast ref={toast} />
            <DataTable selectionMode="single"
                className='[&_.p-datatable-tbody]:!text-sm'
                size='small'
                stripedRows
                removableSort
                paginator
                rows={10}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                rowsPerPageOptions={[10, 25, 50]}
                dataKey="requirement"
                filters={filters}
                globalFilterFields={['requirement', 'category', 'renewalFrequency', 'status']}
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                onFilter={(e) => setFilters(e.filters)}
            >
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Requirement' field='requirement' />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Category' field='category' />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Renewal Frequency' field='renewalFrequency' />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Status' field='status' />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Last Submitted' field='lastSubmitted' />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Expires' field='expires' />
                <Column
                    headerStyle={{ width: '5rem', textAlign: 'center' }}
                    bodyStyle={{ textAlign: 'center', overflow: 'visible' }}
                    body={actionBodyTemplate}
                />
            </DataTable>
        </div>
    )
}

export default DocTable
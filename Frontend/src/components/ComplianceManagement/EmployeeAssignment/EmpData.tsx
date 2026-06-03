import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { ActionIcon, Button, Input, Tooltip } from '@mantine/core';
import { IconEye, IconFilter, IconSearch } from '@tabler/icons-react';
import { FilterMatchMode } from 'primereact/api';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { Column } from 'primereact/column';
import { getEmployeeComplianceStatus } from '../../../services/ComplianceDocumentService';
import { errorNotification } from '../../../utility/NotificationUtility';
import { capitalizeFirstLetter } from '../../../utility/OtherUtilities';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';



const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
}




const EmpData = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [_globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const toast = useRef<Toast>(null);
    const [data, setData] = useState<any[]>([]);


    useEffect(() => {
        dispatch(showOverlay());
        getEmployeeComplianceStatus()
            .then((res) => {
                const formatted = res.map((item: any) => ({
                    ...item,
                    status: item.status.toUpperCase(),
                }));
                setData(formatted);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Failed to fetch categories");
            })
            .finally(() => {
                dispatch(hideOverlay());
            });
    }, []);


    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        // @ts-ignore
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const actionBodyTemplate = (rowData: any) => {
        const id = rowData.id;
        return (
            <div className='flex gap-3 '>
                <Tooltip label="View Details">
                    <ActionIcon onClick={() => navigate(`employee-details/${id}`)} variant="filled" size="sm" color="primary" >
                        <IconEye style={{ width: '90%', height: '90%' }} stroke={1.5} /></ActionIcon>
                </Tooltip>
            </div>
        )
    }
    const renderHeader = () => {
        return (
            <div className='flex justify-between p-2'>
                <Input
                    leftSection={<IconSearch size={16} />}
                    placeholder="Employee Search..."
                    type="search"
                    onChange={(e) => onGlobalFilterChange(e)}
                />

                <div>
                    <Button variant='outline' leftSection={<IconFilter />}>Filter</Button>
                </div>
            </div>


        );
    };

    const statusBodyTemplate = (rowData: any) => {
        const status = rowData.status;

        const getStatusClasses = (status: string) => {
            switch (status.toUpperCase()) {
                case 'COMPLIANCE':
                    return 'bg-green-100 text-green-800';
                case 'NON-COMPLIANCE':
                    return 'bg-red-100 text-red-800';
                case 'UPLOADED':
                    return 'bg-yellow-100 text-yellow-800';
                default:
                    return 'bg-gray-100 text-gray-800';
            }
        };

        return (
            <span
                className={`px-3 py-1 rounded-xl text-sm ${getStatusClasses(status)}`}
            >
                {capitalizeFirstLetter(status)}
            </span>
        );
    };
    const header = renderHeader();
    return (
        <div className="card ">
            <Toast ref={toast} />
            <DataTable selectionMode="single" size='small' stripedRows removableSort paginator rows={10} header={header} value={data} className='[&_.p-datatable-tbody]:!text-sm'
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                rowsPerPageOptions={[10, 25, 50]} dataKey="name" filters={filters} globalFilterFields={['name', 'shortName', 'sector', 'company']}
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries" onFilter={(e) => setFilters(e.filters)}
            >
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Name' field='name' sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Department' field='department' sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Position' field='position' sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Email' field='email' />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header="Status" body={statusBodyTemplate} />
                <Column headerStyle={{ width: '5rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />




            </DataTable>
        </div>
    )
}

export default EmpData
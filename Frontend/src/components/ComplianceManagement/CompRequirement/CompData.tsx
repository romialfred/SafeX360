import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { ActionIcon, Button, Input, TextInput, Tooltip } from '@mantine/core';
import { IconCheck, IconEdit, IconFilter, IconPlus, IconSearch, IconTrash, IconUpload, IconX } from '@tabler/icons-react';
import { FilterMatchMode } from 'primereact/api';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { useEffect, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { Column } from 'primereact/column';
import { activateRequirement, deactivateRequirement, getAllRequirement } from '../../../services/RequirementService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { modals } from '@mantine/modals';
import { useDispatch } from 'react-redux';



const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
}

const CompData = () => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const toast = useRef<Toast>(null);
    const dispatch = useDispatch();
    const [data, setData] = useState<any[]>([]);



    useEffect(() => {

        getAllRequirement({})
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
            .finally();
    }, []);


    const handleStatusChange = (rowData: any) => {
        const action = rowData.status === "ACTIVE" ? "deactivate" : "activate";

        modals.openConfirmModal({
            title: <span className='font-semibold text-2xl'>Are you sure?</span>,
            centered: true,
            children: (
                <span className="text-md">
                    You want to <strong>{action}</strong> the category: <strong>{rowData.name}</strong>?
                </span>
            ),
            labels: { confirm: `Yes, ${action}`, cancel: 'Cancel' },
            cancelProps: { color: 'red', variant: "filled" },
            confirmProps: { color: action === 'activate' ? 'green' : 'green', variant: "filled" },

            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                dispatch(showOverlay())
                const apiCall = action === "activate" ? activateRequirement : deactivateRequirement;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(`Category ${action}d successfully`);
                        const updatedData = data.map(item =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setData(updatedData);
                    })
                    .catch(() => {
                        errorNotification(`Failed to ${action} category`);
                    }
                    ).finally(() => {
                        dispatch(hideOverlay())
                    })
            },
        });
    };
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
                <Button size="sm" onClick={() => navigate('add-requirement')} leftSection={<IconPlus />} variant="gradient">Add Requirement</Button>
            </div>
        );
    };







    const actionBodyTemplate = (rowData: any) => {
        const id = rowData.id;
        return (
            <div className='flex gap-3 '>
                <Tooltip label="Edit Requirement">
                    <ActionIcon onClick={() => navigate(`edit-requirement/${id}`)} variant="filled" size="sm" color="primary" >
                        <IconEdit style={{ width: '90%', height: '90%' }} stroke={1.5} /></ActionIcon>
                </Tooltip>

                {<Tooltip label="Remove Requirement">
                    <ActionIcon onClick={() => navigate(`inspection/${id}`)} variant="outline" size="sm" color="red" >
                        <IconTrash stroke={1.5} style={{ width: '90%', height: '90%' }} /></ActionIcon>
                </Tooltip>}

                <Tooltip label={rowData.status === 'ACTIVE' ? "Deactivate" : "Activate"}>
                    <ActionIcon
                        color={rowData.status === 'ACTIVE' ? "red" : "green"}
                        onClick={() => handleStatusChange(rowData)}
                        size="sm"
                    >
                        {rowData.status === 'ACTIVE'
                            ? <IconX className="!w-4/5 !h-4/5" stroke={1.5} />
                            : <IconCheck className="!w-4/5 !h-4/5" stroke={1.5} />
                        }
                    </ActionIcon>
                </Tooltip>

            </div>
        )
    }

    const renderHeader = () => {


        return (

            <div className='flex justify-between p-2'>
                <Input
                    leftSection={<IconSearch size={16} />}
                    placeholder="Search Requirement..."
                    type="search"

                    onChange={(e) => onGlobalFilterChange(e)}
                />

                <div>
                    <Button variant='outline' leftSection={<IconFilter />}>Filter</Button>
                </div>
            </div>


        );
    };

    const header = renderHeader();



    return (
        <div className="card ">
            <Toast ref={toast} />
            <Toolbar className="mb-1 !p-2" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>

            <DataTable selectionMode="single" size='small' stripedRows removableSort paginator rows={10} header={header} value={data} className='[&_.p-datatable-tbody]:!text-sm'
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                rowsPerPageOptions={[10, 25, 50]} dataKey="name" filters={filters} globalFilterFields={['name', 'shortName', 'sector', 'company']}
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries" onFilter={(e) => setFilters(e.filters)}
            >

                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Title' field='title' sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Category' field='category' sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Renewal Frequency' field='renewalFrequency' sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Document Type' field='docType' />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="status" header="Status" />
                <Column headerStyle={{ width: '5rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />




            </DataTable>
        </div>
    )
}

export default CompData
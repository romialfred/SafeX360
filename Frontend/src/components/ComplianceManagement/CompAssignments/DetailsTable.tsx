import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { ActionIcon, Button, Modal, Select, Tooltip } from '@mantine/core';
import { IconCheck, IconPlus, IconX } from '@tabler/icons-react';
import { FilterMatchMode } from 'primereact/api';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
import { Column } from 'primereact/column';
import { modals } from '@mantine/modals';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { activatePostionAssignment, deactivatePostionAssignment, getPostionAssignmentById } from '../../../services/AssignmentService';
import { getAllRequirement } from '../../../services/RequirementService';
import { useForm } from '@mantine/form';
import { useParams } from 'react-router-dom';

const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
};



const DetailsTable = () => {

    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const toast = useRef<Toast>(null);
    const [modalOpened, setModalOpened] = useState(false);
    const dispatch = useDispatch();
    const [data, setData] = useState<any[]>([]);
    const [requirements, setRequirements] = useState<any[]>([]);
    const { id } = useParams()

    const form = useForm({
        initialValues: {
            requirementId: '',
            positionId: id,

        },
        validate: {
            requirementId: (value) => value.trim()?.length > 0 ? null : "Name is required",

        }
    });

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
                const apiCall = action === "activate" ? activatePostionAssignment : deactivatePostionAssignment;
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

    useEffect(() => {

        getAllRequirement({}).then((res) => {
            console.log(res)
            setRequirements(res.map((item: any) => ({ label: item.title, value: "" + item.id })));
        })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Failed to fetch categories");
            })


        getPostionAssignmentById(id).then((res) => {
            setData(res.requirements)

        })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Failed to fetch categories");
            })


    }, []);


    const actionBodyTemplate = (rowData: any) => {
        return (
            <div className='flex gap-3'>
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
        );
    };

    const renderHeader = () => {
        return (
            <Button
                size='sm'
                variant='filled'
                leftSection={<IconPlus />}
                onClick={() => setModalOpened(true)} // 👈 open modal on click
            >
                Assign Requirement
            </Button>
        );
    };

    const header = renderHeader();

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
                header={header}
                value={data}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                rowsPerPageOptions={[10, 25, 50]}
                dataKey="requirement"
                filters={filters}
                globalFilterFields={['requirement', 'category', 'renewalFrequency', 'status']}
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                onFilter={(e) => setFilters(e.filters)}
            >
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Title' field='title' />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Description' field='description' />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Category' field='category' />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Renewal Frequency' field='renewalFrequency' />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Document Type' field='docType' />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Status' field='status' />


                <Column
                    headerStyle={{ width: '5rem', textAlign: 'center' }}
                    bodyStyle={{ textAlign: 'center', overflow: 'visible' }}
                    body={actionBodyTemplate}
                />
            </DataTable>


            <Modal
                opened={modalOpened}
                onClose={() => setModalOpened(false)}
                title={
                    <div className="text-lg font-medium text-blue-500">
                        Assign New Requirement
                    </div>
                }
                centered
                size="xl"

            >
                <div className='flex flex-col gap-5'>

                    <div>
                        <Select label="Requirement" placeholder="Select Requirement" data={requirements} withAsterisk  {...form.getInputProps('requirementId')} />
                    </div>


                    <div className='flex gap-4 justify-end mt-4'>
                        <Button variant='outline'>Cancel</Button>
                        <Button onClick={() => setModalOpened(false)} type="submit">Save</Button>
                    </div>

                </div>

            </Modal>
        </div>
    );
};

export default DetailsTable;

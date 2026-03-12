import { Breadcrumbs, Text } from "@mantine/core";
import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import {
    createPostionAssignment,
    getPostionAssignmentById,
    activatePostionAssignment,
    deactivatePostionAssignment,
} from "../../../services/AssignmentService";
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { ActionIcon, Button, Modal, Select, Tooltip } from '@mantine/core';
import { IconCheck, IconPlus, IconX } from '@tabler/icons-react';
import { FilterMatchMode } from 'primereact/api';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { Column } from 'primereact/column';
import { modals } from '@mantine/modals';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { getAllRequirement } from '../../../services/RequirementService';
import { useForm } from '@mantine/form';
import { Toolbar } from "primereact/toolbar";

const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
};

const AssignDetails = () => {
    const [assignment, setAssignment] = useState<any>(null);
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const toast = useRef<Toast>(null);
    const [modalOpened, setModalOpened] = useState(false);
    const dispatch = useDispatch();
    const [data, setData] = useState<any[]>([]);
    const [requirements, setRequirements] = useState<any[]>([]);
    const { id } = useParams();

    const form = useForm({
        initialValues: {
            requirementId: '',
            positionId: id,
        },
        validate: {
            requirementId: (value) => value.trim().length > 0 ? null : "Requirement is required",
        },
    });

    const fetchAssignments = () => {
        getPostionAssignmentById(id).then((res) => {
            setAssignment(res);
            setData(res.requirements);
        }).catch((err) => {
            errorNotification(err.response?.data?.errorMessage || "Failed to fetch assignment");
        });
    };

    useEffect(() => {
        getAllRequirement({}).then((res) => {
            setRequirements(res.map((item: any) => ({ label: item.title, value: String(item.id) })));
        }).catch((err) => {
            errorNotification(err.response?.data?.errorMessage || "Failed to fetch requirements");
        });

        if (id) {
            fetchAssignments();
        }
    }, [id]);

    const handleStatusChange = (rowData: any) => {
        const action = rowData.status === "ACTIVE" ? "deactivate" : "activate";

        modals.openConfirmModal({
            title: <span className='font-semibold text-2xl'>Are you sure?</span>,
            centered: true,
            children: (
                <span className="text-md">
                    You want to <strong>{action}</strong> the Assignment: <strong>{rowData.name}</strong>?
                </span>
            ),
            labels: { confirm: `Yes, ${action}`, cancel: 'Cancel' },
            cancelProps: { color: 'red', variant: "filled" },
            confirmProps: { color: action === 'activate' ? 'green' : 'green', variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                dispatch(showOverlay());
                const apiCall = action === "activate" ? activatePostionAssignment : deactivatePostionAssignment;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(`Assignment ${action}d successfully`);
                        const updatedData = data.map(item =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setData(updatedData);
                    })
                    .catch(() => {
                        errorNotification(`Failed to ${action} assignment`);
                    })
                    .finally(() => {
                        dispatch(hideOverlay());
                    });
            },
        });
    };

    const handleSubmit = () => {
        dispatch(showOverlay());
        createPostionAssignment(form.values)
            .then(() => {
                successNotification("Requirement assigned successfully");
                fetchAssignments();
                setModalOpened(false);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Something went wrong");
            })
            .finally(() => {
                dispatch(hideOverlay());
            });
    };

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
                            : <IconCheck className="!w-4/5 !h-4/5" stroke={1.5} />}
                    </ActionIcon>
                </Tooltip>
            </div>
        );
    };

    const rightToolbarTemplate = () => (
        <div className='flex gap-5'>
            <Button
                size="sm"
                variant='filled'
                leftSection={<IconPlus />}
                onClick={() => setModalOpened(true)}
            >
                Assign Requirement
            </Button>
        </div>
    );

    const leftToolbarTemplate = () => (
        <div className="flex gap-3">
            <h1 className="text-2xl font-medium text-primary">{assignment?.position}</h1>
        </div>
    );

    return (
        <div className="flex flex-col gap-10">
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text">
                        Position Compliance Assignments Details
                    </div>
                    <Breadcrumbs mt="xs">
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient">Home</Text>
                        </Link>
                        <Link className="hover:!underline" to="/compliance-assignment">
                            <Text variant="gradient">Position Compliance Assignments</Text>
                        </Link>
                        <Text variant="gradient">Position Compliance Assignments Details</Text>
                    </Breadcrumbs>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-300 shadow-lg p-4 flex flex-col gap-10">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-1 !p-2" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>
                    <DataTable selectionMode="single"
                        className='[&_.p-datatable-tbody]:!text-sm'
                        size='small'
                        stripedRows
                        removableSort
                        paginator
                        rows={10}
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
                        size="lg"
                    >
                        <form onSubmit={form.onSubmit(handleSubmit)}>
                            <div className='flex flex-col gap-5'>
                                <Select
                                    label="Requirement"
                                    placeholder="Select Requirement"
                                    data={requirements}
                                    withAsterisk
                                    {...form.getInputProps('requirementId')}
                                />
                                <div className='flex gap-4 justify-end mt-4'>
                                    <Button variant='outline' onClick={() => setModalOpened(false)}>Cancel</Button>
                                    <Button type="submit">Save</Button>
                                </div>
                            </div>
                        </form>
                    </Modal>
                </div>
            </div>
        </div>
    );
};

export default AssignDetails;

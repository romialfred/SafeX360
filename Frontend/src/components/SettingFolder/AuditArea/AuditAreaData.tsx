import { ActionIcon, Button, LoadingOverlay, Modal, Select, TextInput, Tooltip } from "@mantine/core";
import { IconCheck, IconEdit, IconPlus, IconSearch, IconUpload, IconX } from "@tabler/icons-react";
import { FilterMatchMode } from "primereact/api";
import { Column } from "primereact/column";
import { DataTable, DataTableExpandedRows, DataTableFilterMeta, DataTableValueArray } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { useEffect, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { Tag } from "primereact/tag";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { useDispatch } from "react-redux";
import { modals } from "@mantine/modals";
import { Z } from '../../../constants/zIndex';
import { auditAreadata } from "../../../Data/DropdownData";
import { getEmployeeDropdown } from "../../../services/EmployeeService";
import { activateAuditArea, createAuditArea, deactivateAuditArea, GetAllAuditArea, updateAuditArea } from "../../../services/AuditAreaService";

const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
};
const AuditAreaData = () => {
    const [opened, { open, close }] = useDisclosure(false);
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | DataTableValueArray | undefined>(undefined);
    const [edit, setEdit] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [emps, setEmps] = useState<{ label: string; value: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const form = useForm({
        initialValues: {
            name: '',
            type: '',
            owner: '',
        },
        validate: {
            name: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Audit Name is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
            type: (value) => (value.trim().length > 0 ? null : "Audit Type is required"),
            owner: (value) => (value.trim().length > 0 ? null : "Owner is required"),
        }
    });

    useEffect(() => {
        setLoading(true);
        getEmployeeDropdown()
            .then((res) => {
                // Assuming res is array of {id, name}
                const empOptions = res.map((item: any) => ({
                    label: item.name,
                    value: String(item.id),
                }));
                setEmps(empOptions);
            })
            .catch(() => {
                errorNotification("Failed to fetch employees");
            });

        GetAllAuditArea({})
            .then((res) => {
                // Assuming res is array of audit areas with status
                const formatted = res.map((item: any) => ({
                    ...item,
                    status: item.status.toUpperCase(),
                    ownerName: item.ownerName || '', // ownerName included from API if any
                }));
                setData(formatted);
            })
            .catch(() => {
                errorNotification("Failed to fetch audit areas");
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = (values: any) => {
        setLoading(true);

        if (edit) {
            // Check if any field changed
            const changed = Object.keys(values).some((key) => {
                const newValue = values[key]?.trim?.() ?? values[key];
                const oldValue = selectedRow[key]?.trim?.() ?? selectedRow[key];
                return newValue !== oldValue;
            });

            if (!changed) {
                form.setErrors({ name: "Please update at least one field before submitting" });
                setLoading(false);
                return;
            }

            const payload = {
                ...selectedRow,
                ...values,
            };

            updateAuditArea(payload)
                .then(() => {
                    successNotification("Audit Area updated successfully");

                    // Update local state with ownerName resolved from emps
                    const updatedData = data.map(item =>
                        item.id === selectedRow.id
                            ? {
                                ...item,
                                ...values,
                                ownerName: emps.find(emp => emp.value === values.owner)?.label || item.ownerName,
                                status: item.status, // keep status as is
                            }
                            : item
                    );
                    setData(updatedData);
                    handleClose();
                })
                .catch(() => {
                    errorNotification("Something went wrong while updating");
                })
                .finally(() => setLoading(false));
        } else {
            // Create new Audit Area
            createAuditArea(values)
                .then((res) => {
                    successNotification("Audit Area added successfully");

                    // res is assumed to be the new id returned from server
                    const newEntry = {
                        ...values,
                        id: res,
                        status: "ACTIVE",
                        ownerName: emps.find(emp => emp.value === values.owner)?.label || '',
                    };

                    setData(prev => [...prev, newEntry]);
                    handleClose();
                })
                .catch(() => {
                    errorNotification("Something went wrong while creating");
                })
                .finally(() => setLoading(false));
        }
    };

    const handleEdit = (rowData: any) => {
        setEdit(true);
        setSelectedRow(rowData);
        form.setValues({
            name: rowData.name,
            type: rowData.type,
            owner: rowData.owner ? String(rowData.owner) : '',
        });
        open();
    };

    const handleClose = () => {
        close();
        form.reset();
        setEdit(false);
        setSelectedRow(null);
    };

    const handleStatusChange = (rowData: any) => {
        const action = rowData.status === "ACTIVE" ? "deactivate" : "activate";

        modals.openConfirmModal({
            title: <span className='text-2xl'>Are you sure?</span>,
            centered: true,
            children: (
                <span className="text-md">
                    You want to <strong>{action}</strong> the area: <strong>{rowData.name}</strong>?
                </span>
            ),
            labels: { confirm: `Yes, ${action}`, cancel: 'Cancel' },
            cancelProps: { color: 'red', variant: "filled" },
            confirmProps: { color: action === 'activate' ? 'green' : 'red', variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                dispatch(showOverlay());
                const apiCall = action === "activate" ? activateAuditArea : deactivateAuditArea;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(`Area ${action}d successfully`);
                        const updatedData = data.map(item =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setData(updatedData);
                    })
                    .catch(() => {
                        errorNotification(`Failed to ${action} area`);
                    })
                    .finally(() => {
                        dispatch(hideOverlay());
                    });
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

    const leftToolbarTemplate = () => (
        <div className="flex gap-5">
            <Button size='sm' leftSection={<IconPlus />} variant="gradient" onClick={open}>
                New Audit Area
            </Button>
        </div>
    );

    const rightToolbarTemplate = () => (
        <div className='flex gap-5'>
            <Button size="sm" variant='outline' leftSection={<IconUpload />}>Export</Button>
            <TextInput
                value={globalFilterValue}
                onChange={onGlobalFilterChange}
                size='sm'
                placeholder='Search'
                leftSection={<IconSearch />}
            />
        </div>
    );

    const actionBodyTemplate = (rowData: any) => (
        <div className='flex gap-3 justify-center'>
            <Tooltip label="Edit">
                <ActionIcon color="primary" onClick={() => handleEdit(rowData)} size="sm">
                    <IconEdit className="!w-4/5 !h-4/5" stroke={1.5} />
                </ActionIcon>
            </Tooltip>

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


    return (
        <div className="card">
            <Toolbar className="mb-1 !p-2" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>

            <DataTable selectionMode="single"
                className='[&_.p-datatable-tbody]:!text-sm'
                size='small'
                stripedRows
                removableSort
                paginator
                value={data}
                rows={10}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReportTemplate RowsPerPageDropdown"
                rowsPerPageOptions={[10, 25, 50]}
                dataKey="name"
                filters={filters}
                globalFilterFields={['name', 'incidentCategory', 'description']}
                emptyMessage="No Audit Area Found."
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                onFilter={(e) => setFilters(e.filters)}
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
            >
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="name" header="Name" sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="type" header="Type" sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="ownerName" header="Owner Name" sortable />

                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="status" header="Status" body={(rowData) => (
                    <Tag severity={rowData.status === "ACTIVE" ? "success" : rowData.status === "INACTIVE" ? "danger" : "info"}>
                        {rowData.status}
                    </Tag>
                )} sortable />
                <Column headerStyle={{ width: '8rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
            </DataTable>

            {/* Add/Edit Modal */}
            <Modal opened={opened} size="lg" onClose={handleClose} centered title={
                <h1 className="text-lg text-blue-500">
                    {edit ? "Update" : "Create"} Audit Area
                </h1>
            }>
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: "sm", blur: 2 }} />
                <form className='flex flex-col gap-4' onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput label="Name" withAsterisk placeholder='Enter name' {...form.getInputProps('name')} />
                    <Select
                        withAsterisk
                        placeholder="Select Type"
                        label="Type"
                        data={auditAreadata}
                        {...form.getInputProps('type')}
                    />

                    <Select
                        withAsterisk
                        placeholder="Select Owner"
                        label="Owner"
                        data={emps}
                        {...form.getInputProps('owner')}
                    />

                    <Button type="submit" mt="md" variant="gradient">{edit ? "Update" : "Add"}</Button>
                </form>
            </Modal>


        </div>
    )
}

export default AuditAreaData
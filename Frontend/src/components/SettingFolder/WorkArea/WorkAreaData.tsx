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
import { activateWorkArea, createWorkArea, deactivateWorkArea, GetAllWorkArea, updateWorkArea } from "../../../services/WorkAreaService";
import { getAllDepartments } from "../../../services/HrmsService";


const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
};
const WorkAreaData = () => {
    const [opened, { open, close }] = useDisclosure(false);
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | DataTableValueArray | undefined>(undefined);
    const [edit, setEdit] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [departments, setDepartments] = useState<{ label: string; value: string }[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>("All");


    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const form = useForm({
        initialValues: {
            name: '',
            departmentId: ''
        },
        validate: {
            name: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Work Area Name is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
            departmentId: (value) => (value.trim().length > 0 ? null : "Department is required"),


        }
    });

    useEffect(() => {
        setLoading(true);

        // Fetch departments
        getAllDepartments()
            .then((res) => {
                const deptOptions = res.map((item: any) => ({
                    label: item.name,
                    value: String(item.id),
                }));
                setDepartments(deptOptions);
            })
            .catch(() => {
                errorNotification("Failed to fetch departments");
            });

        GetAllWorkArea({})
            .then((res) => {
                const formatted = res.map((item: any) => ({
                    ...item,
                    status: item.status.toUpperCase(),
                    departmentId: String(item.departmentId),
                    departmentName: item.departmentName || "",
                }));
                setData(formatted);
            })
            .catch(() => {
                errorNotification("Failed to fetch work areas");
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

            updateWorkArea(payload)
                .then(() => {
                    successNotification("Work Area updated successfully");

                    // Update local state with ownerName resolved from emps
                    const updatedData = data.map(item =>
                        item.id === selectedRow.id
                            ? {
                                ...item,
                                ...values,
                                departmentId: values.departmentId,
                                departmentName: departments.find((dep) => dep.value === values.departmentId)?.label || "",
                                status: item.status
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
            createWorkArea(values)
                .then((res) => {
                    successNotification("Work Area added successfully");

                    const newEntry = {
                        ...values,
                        id: res,
                        status: "ACTIVE",
                        departmentId: values.departmentId,
                        departmentName: departments.find(dep => dep.value === values.departmentId)?.label || ""
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
    const dropdownFilterTemplate = () => (
        <div className="flex items-center gap-2">

            <Select allowDeselect={false} searchable
                size='sm'
                data={[{ label: "All", value: "All" }, ...departments]}
                value={selectedDepartment}
                onChange={setSelectedDepartment}

            />
        </div>
    );
    const handleEdit = (rowData: any) => {
        setEdit(true);
        setSelectedRow(rowData);
        form.setValues({
            name: rowData.name,
            departmentId: rowData.departmentId

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
                const apiCall = action === "activate" ? activateWorkArea : deactivateWorkArea;
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
                New Work Area
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

    const filteredData = data.filter((item) => {

        const departmentMatch = selectedDepartment === 'All' || (item.departmentId && selectedDepartment === "" + item.departmentId);
        return departmentMatch;
    });
    return (
        <div className="card">
            <Toolbar className="mb-1 !p-2" left={leftToolbarTemplate} right={rightToolbarTemplate} center={dropdownFilterTemplate}></Toolbar>

            <DataTable selectionMode="single"
                className='[&_.p-datatable-tbody]:!text-sm'
                size='small'
                stripedRows
                removableSort
                paginator
                value={filteredData}
                rows={10}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReportTemplate RowsPerPageDropdown"
                rowsPerPageOptions={[10, 25, 50]}
                dataKey="name"
                filters={filters}
                globalFilterFields={['name', 'incidentCategory', 'description']}
                emptyMessage="No Work Area Found."
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                onFilter={(e) => setFilters(e.filters)}
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
            >
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="name" header="Name" sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="departmentName" header="Department Name" sortable />


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
                    {edit ? "Update" : "Create"} Work Area
                </h1>
            }>
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: "sm", blur: 2 }} />
                <form className='flex flex-col gap-4' onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput label="Name" withAsterisk placeholder='Enter name' {...form.getInputProps('name')} />
                    <Select
                        label="Department"
                        withAsterisk
                        placeholder="Select department"
                        data={departments}
                        {...form.getInputProps('departmentId')}
                    />


                    <Button type="submit" mt="md" variant="gradient">{edit ? "Update" : "Add"}</Button>
                </form>
            </Modal>


        </div>
    )
}

export default WorkAreaData
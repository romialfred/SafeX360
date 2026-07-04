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
import { getAllEmployeeWithDirection } from "../../../services/EmployeeService";
import { activateAuditors, createAuditors, deactivateAuditors, getAllAuditors, updateAuditors } from "../../../services/AuditorsService";
import { mapIdToName } from "../../../utility/OtherUtilities";
import { auditorRoles } from "../../../Data/DropdownData";

const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
};
const AuiditorData = () => {
    const [opened, { open, close }] = useDisclosure(false);
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | DataTableValueArray | undefined>(undefined);
    const [edit, setEdit] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [emps, setEmps] = useState<{ label: string; value: string }[]>([]);
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const form = useForm({
        initialValues: {
            employeeId: '',
            role: '',

        },
        validate: {
            employeeId: (value) => (value.trim().length > 0 ? null : "Employee Name is required"),
            role: (value) => (value.trim().length > 0 ? null : "Role is required"),

        }
    });

    useEffect(() => {
        setLoading(true);
        getAllEmployeeWithDirection()
            .then((res) => {
                const empOptions = res.map((item: any) => ({
                    label: item.name,
                    value: String(item.id),
                }));
                setEmps(empOptions);
                setEmpMap(mapIdToName(res));
            })
            .catch(() => {

            });

        getAllAuditors()
            .then((res) => {
                setData(res);
            })
            .catch(() => {

            })
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = (values: any) => {
        setLoading(true);

        if (edit) {
            const changed = Object.keys(values).some((key) => {
                return values[key] !== selectedRow[key];
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

            updateAuditors(payload)
                .then(() => {
                    successNotification("Auditors updated successfully");


                    const updatedData = data.map(item =>
                        item.id === selectedRow.id
                            ? {
                                ...item,
                                ...values,
                                employeeName: emps.find(emp => emp.value === values.employeeId)?.label || item.employeeName,
                                status: item.status,
                            }
                            : item
                    );
                    setData(updatedData);
                    handleClose();
                })
                .catch((err) => {
                    errorNotification(err.response?.data?.errorMessage || "Something went wrong while updating");
                })
                .finally(() => setLoading(false));
        } else {
            createAuditors(values)
                .then(() => {
                    successNotification("Auditors added successfully");


                    getAllAuditors()
                        .then((res) => {
                            setData(res);
                        });

                    handleClose();
                })
                .catch((err) => {
                    errorNotification(err.response?.data?.errorMessage || "Something went wrong while creating");
                })
                .finally(() => setLoading(false))
        }
    };
    useEffect(() => {

    }, [form.values.employeeId]);

    const handleEdit = (rowData: any) => {
        setEdit(true);
        setSelectedRow(rowData);
        form.setValues({
            employeeId: String(rowData.employeeId),
            role: rowData.role
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
                    You want to <strong>{action}</strong> the auditors: <strong>{rowData.name}</strong>?
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
                const apiCall = action === "activate" ? activateAuditors : deactivateAuditors;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(`Auditors ${action}d successfully`);
                        const updatedData = data.map(item =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setData(updatedData);
                    })
                    .catch(() => {
                        errorNotification(`Failed to ${action} auditors`);
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
                New Auditor
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
                emptyMessage="No Auditors Found."
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                onFilter={(e) => setFilters(e.filters)}
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
            >
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="employeeName" header="Employee Name" />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="email" header="Email" />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="direction" header="Direction" />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="role" header="Role" />

                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="status" header="Status" body={(rowData) => (
                    <Tag severity={rowData.status === "ACTIVE" ? "success" : rowData.status === "INACTIVE" ? "danger" : "info"}>
                        {rowData.status}
                    </Tag>
                )} />
                <Column headerStyle={{ width: '8rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
            </DataTable>


            <Modal opened={opened} size="lg" onClose={handleClose} centered title={
                <h1 className="text-lg text-blue-500">
                    {edit ? "Update" : "Add"} Auditor
                </h1>
            }>
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: "sm", blur: 2 }} />
                <form className='flex flex-col gap-4' onSubmit={form.onSubmit(handleSubmit)}>

                    {edit ? <Select searchable label="Employee" placeholder="Select employee" data={emps} withAsterisk disabled {...form.getInputProps('employeeId')} /> : <Select searchable label="Employee" placeholder="Select employee" data={emps.filter((x: any) => !data.some((y: any) => x.value == y.employeeId))} withAsterisk {...form.getInputProps('employeeId')} />}
                    <TextInput disabled value={empMap[form.values.employeeId]?.email} label="Email" withAsterisk placeholder='Enter Email' />


                    <TextInput disabled label="Direction" value={empMap[form.values.employeeId]?.direction} withAsterisk placeholder='Enter direction' />

                    <Select label="Role" placeholder="Select Role" data={auditorRoles} withAsterisk {...form.getInputProps('role')} />



                    <Button type="submit" mt="md" variant="gradient">{edit ? "Update" : "Add"}</Button>
                </form>
            </Modal>


        </div>
    )
}

export default AuiditorData
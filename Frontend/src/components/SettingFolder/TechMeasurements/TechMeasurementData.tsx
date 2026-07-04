import {
    ActionIcon,
    Button,
    LoadingOverlay,
    Modal,
    Select,
    Textarea,
    TextInput,
    Tooltip,
} from "@mantine/core";
import {
    IconCheck,
    IconEdit,
    IconPlus,
    IconSearch,
    IconUpload,
    IconX,
} from "@tabler/icons-react";
import { FilterMatchMode } from "primereact/api";
import { Column } from "primereact/column";
import {
    DataTable,
    DataTableExpandedRows,
    DataTableFilterMeta,
    DataTableValueArray,
} from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { useEffect, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { Tag } from "primereact/tag";
import {
    errorNotification,
    successNotification,
} from "../../../utility/NotificationUtility";
import { modals } from "@mantine/modals";
import { useDispatch } from "react-redux";
import {
    hideOverlay,
    showOverlay,
} from "../../../slices/OverlaySlice";
import {
    activateMeasurement,
    createMeasurement,
    deactivateMeasurement,
    GetAllMeasurement,
    updateMeasurement,
} from "../../../services/TechMeasurementService";
import { Z } from '../../../constants/zIndex';

const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
};

const TechMeasurementData = () => {
    const [opened, { open, close }] = useDisclosure(false);
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>("");
    const [expandedRows, setExpandedRows] = useState<
        DataTableExpandedRows | DataTableValueArray | undefined
    >(undefined);
    const [edit, setEdit] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const dispatch = useDispatch();
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: {
            name: "",
            unit: "",
            normalValue: "",
            threshold: "",
            description: "",
        },
        validate: {
            name: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Measurement Name is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
            unit: (value) =>
                value ? null : "Unit is required",
            normalValue: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Normal vlaue is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
            threshold: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Threshold is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
            description: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Description is required";
                const wordCount = trimmed.length;
                return wordCount > 250 ? "Maximum 250 characters allowed" : null;
            }
        },
    });

    const handleEdit = (rowData: any) => {
        setEdit(true);
        setSelectedRow(rowData);
        form.setValues({
            name: rowData.name,
            unit: rowData.unit,
            normalValue: rowData.normalValue,
            threshold: rowData.threshold,
            description: rowData.description,
        });
        open();
    };

    useEffect(() => {
        setLoading(true);
        GetAllMeasurement({})
            .then((res) => {
                setData(res);
            })
            .catch((err) => {
                errorNotification(
                    err.response?.data?.errorMessage || "Failed to fetch measurement"
                );
            })
            .finally(() => setLoading(false));
    }, []);

    const handleClose = () => {
        close();
        form.reset();
        setEdit(false);
        setSelectedRow(null);
    };

    const handleStatusChange = (rowData: any) => {
        const action = rowData.status === "ACTIVE" ? "deactivate" : "activate";

        modals.openConfirmModal({
            title: <span className="text-2xl">Are you sure?</span>,
            centered: true,
            children: (
                <span className="text-md">
                    You want to <strong>{action}</strong> the measurement:{" "}
                    <strong>{rowData.name}</strong>?
                </span>
            ),
            labels: { confirm: `Yes, ${action}`, cancel: "Cancel" },
            cancelProps: { color: "red", variant: "filled" },
            confirmProps: {
                color: action === "activate" ? "green" : "green",
                variant: "filled",
            },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                dispatch(showOverlay());
                const apiCall =
                    action === "activate" ? activateMeasurement : deactivateMeasurement;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(`Technical Measurement ${action}d successfully`);
                        const updatedData = data.map((item) =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setData(updatedData);
                    })
                    .catch(() => {
                        errorNotification(`Failed to ${action} Technical Measurements`);
                    })
                    .finally(() => {
                        dispatch(hideOverlay());
                    });
            },
        });
    };

    const handleSubmit = (values: any) => {
        setLoading(true);
        console.log("values", values);

        if (edit) {
            const payload = { ...selectedRow, ...values };
            updateMeasurement(payload)
                .then(() => {
                    successNotification("Technical Measurements updated successfully");
                    const updatedData = data.map((item) =>
                        item.id === selectedRow.id ? { ...item, ...values } : item
                    );
                    setData(updatedData);
                    handleClose();
                })
                .catch((err) => {
                    errorNotification(err.response?.data?.errorMessage || "Something went wrong");
                })
                .finally(() => setLoading(false));
        } else {
            createMeasurement(values)
                .then((res) => {
                    successNotification("Technical Measurements added successfully");
                    const newEntry = {
                        ...values,
                        status: "ACTIVE",
                        id: res,
                    };
                    setData((prev) => [...prev, newEntry]);
                    handleClose();
                })
                .catch((err) => {
                    errorNotification(err.response?.data?.errorMessage || "Something went wrong");
                })
                .finally(() => setLoading(false));
        }
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        // @ts-ignore
        _filters["global"].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const leftToolbarTemplate = () => {
        return (
            <div className="flex gap-5">
                <Button
                    size="sm"
                    leftSection={<IconPlus />}
                    variant="gradient"
                    onClick={open}
                >
                    New Technical Measurements
                </Button>
            </div>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <div className="flex gap-5">
                <Button size="sm" variant="outline" leftSection={<IconUpload />}>
                    Export
                </Button>
                <TextInput
                    value={globalFilterValue}
                    onChange={onGlobalFilterChange}
                    size="sm"
                    placeholder="Search"
                    leftSection={<IconSearch />}
                />
            </div>
        );
    };

    const actionBodyTemplate = (rowData: any) => {
        return (
            <div className="flex gap-3 justify-center">
                <Tooltip label="Edit">
                    <ActionIcon
                        color="primary"
                        onClick={() => handleEdit(rowData)}
                        size="sm"
                    >
                        <IconEdit className="!w-4/5 !h-4/5" stroke={1.5} />
                    </ActionIcon>
                </Tooltip>

                <Tooltip label={rowData.status === "ACTIVE" ? "Deactivate" : "Activate"}>
                    <ActionIcon
                        color={rowData.status === "ACTIVE" ? "red" : "green"}
                        onClick={() => handleStatusChange(rowData)}
                        size="sm"
                    >
                        {rowData.status === "ACTIVE" ? (
                            <IconX className="!w-4/5 !h-4/5" stroke={1.5} />
                        ) : (
                            <IconCheck className="!w-4/5 !h-4/5" stroke={1.5} />
                        )}
                    </ActionIcon>
                </Tooltip>
            </div>
        );
    };

    return (
        <div className="card">
            <Toolbar
                className="mb-1 !p-2"
                left={leftToolbarTemplate}
                right={rightToolbarTemplate}
            ></Toolbar>

            <DataTable selectionMode="single"
                className='[&_.p-datatable-tbody]:!text-sm'
                size="small"
                stripedRows
                removableSort
                paginator
                value={data}
                rows={10}
                dataKey="id" // ✅ FIXED HERE
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReportTemplate RowsPerPageDropdown"
                rowsPerPageOptions={[10, 25, 50]}
                filters={filters}
                globalFilterFields={[
                    "name",
                    "unit",
                    "normalValue",
                    "threshold",
                    "description",
                    "status",
                ]}
                emptyMessage="No Technical Measurement found."
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                onFilter={(e) => setFilters(e.filters)}
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
            >
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="name" header="Measurement Name" sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="unit" header="Unit" sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="normalValue" header="Normal Value" sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="threshold" header="Alert Threshold" sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="description" header="Description" sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }}
                    field="status"
                    header="Status"
                    body={(rowData) => (
                        <Tag
                            severity={
                                rowData.status === "ACTIVE"
                                    ? "success"
                                    : rowData.status === "INACTIVE"
                                        ? "danger"
                                        : "info"
                            }
                        >
                            {rowData.status}
                        </Tag>
                    )}
                    sortable
                />
                <Column
                    headerStyle={{ width: "8rem", textAlign: "center" }}
                    bodyStyle={{ textAlign: "center", overflow: "visible" }}
                    body={actionBodyTemplate}
                />
            </DataTable>

            {/* Modal */}
            <Modal
                opened={opened}
                size="lg"
                onClose={handleClose}
                centered
                title={
                    <h1 className="text-lg text-blue-500">
                        {edit ? "Update" : "Create"} Technical Measurements
                    </h1>
                }
            >
                <LoadingOverlay
                    visible={loading}
                    zIndex={Z.overlay}
                    overlayProps={{ radius: "sm", blur: 2 }}
                />
                <form className="flex flex-col gap-4" onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput
                        label="Measurement Name"
                        withAsterisk
                        placeholder="Enter name"
                        {...form.getInputProps("name")}
                    />
                    <Select withAsterisk
                        label="Unit"
                        placeholder="Select unit"
                        data={["ppm", "µg/m³", "%", "dB", "Lux", "m/s", "% LEL", "°C"]}
                        {...form.getInputProps("unit")}
                    />
                    <TextInput
                        label="Expected Normal Value"
                        withAsterisk
                        placeholder="Enter normal value"
                        {...form.getInputProps("normalValue")}
                    />
                    <TextInput
                        label="Alert Threshold"
                        withAsterisk
                        placeholder="Enter alert threshold"
                        {...form.getInputProps("threshold")}
                    />
                    <Textarea
                        withAsterisk
                        label="Description"
                        placeholder="Enter Description"
                        {...form.getInputProps("description")}
                    />
                    <Button type="submit" mt="md" variant="gradient">
                        {edit ? "Update" : "Add"}
                    </Button>
                </form>
            </Modal>
        </div>
    );
};

export default TechMeasurementData;

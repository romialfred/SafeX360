import { ActionIcon, Button, LoadingOverlay, Modal, SegmentedControl, Select, Tabs, Textarea, TextInput, Tooltip } from "@mantine/core";
import { IconCheck, IconEdit, IconSearch, IconUpload, IconX } from "@tabler/icons-react";
import { FilterMatchMode } from "primereact/api";
import { Column } from "primereact/column";
import { DataTable, DataTableExpandedRows, DataTableFilterMeta, DataTableValueArray } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import { Tag } from "primereact/tag";
import { activateIncidentType, createIncidentsType, deactivateIncidentType, GetAllIncidentType, updateIncidentType } from "../../../services/IncidentTypeService";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { useDispatch } from "react-redux";
import { modals } from "@mantine/modals";
import { Z } from '../../../constants/zIndex';
import { GetAllIncidentCategories } from "../../../services/IncidentCategory";
import { getAllActiveSeverityLevel } from "../../../services/SeverityLevelService";

const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
};

const colorMap: Record<string, string> = {
    1: "green",
    4: "red",
    3: "orange",
    2: "yellow",
    5: "brown"
}

const IncidentTypeData = ({ opened, open, close }: any) => {
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | DataTableValueArray | undefined>(undefined);
    const [edit, setEdit] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [selectedRow, setSelectedRow] = useState<any>(null);

    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [severities, setSeverities] = useState<any[]>([]);
    const [severityLevels, setSeverityLevels] = useState<any[]>([]);
    const [selectedSeverity, setSelectedSeverity] = useState<string | undefined>("All");
    const [tab, setTab] = useState<string | null>("all");
    const dispatch = useDispatch();

    const [severityMap, setSeverityMap] = useState<Record<string, string>>({});


    const form = useForm({
        initialValues: {
            name: '',
            incidentCategoryId: '',
            severityLevelId: '',
            description: ''
        },

        validate: {
            name: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Name is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
            incidentCategoryId: (value) => value ? null : "Incident Category is required",
            severityLevelId: (value) => value ? null : "Severity Level is required",
            description: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Description is required";
                const wordCount = trimmed.length;
                return wordCount > 250 ? "Maximum 250 characters allowed" : null;
            }
        }
    });

    useEffect(() => {
        setLoading(true);
        GetAllIncidentCategories({}).then((res) => {
            setCategories(res.map((item: any) => ({ label: item.name, value: "" + item.id })));
        })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Failed to fetch categories");
            })

        getAllActiveSeverityLevel().then((res) => {
            console.log(res);
            setSeverities(res.map((item: any) => ({ ...item, label: item.name, value: "" + item.id })));
            setSeverityLevels(Array.from(["All", ...new Set(res.map((item: any) => item.name))]));
            setSeverityMap(
                res.reduce((acc: Record<string, string>, curr: any) => {
                    acc[curr.name] = curr.level;
                    return acc;
                }, {})
            );
        }
        ).catch((_err) => {

        })

        // Fetch incident types
        GetAllIncidentType({})
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
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = (values: any) => {
        setLoading(true);

        if (edit) {
            // Check if at least one field has changed
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

            const payload = { ...selectedRow, ...values };

            // Get matching category name
            const category = categories.find(cat => cat.value === values.incidentCategoryId);

            updateIncidentType(payload)
                .then(() => {
                    successNotification("Incident Type updated successfully");
                    const updatedData = data.map((item) =>
                        item.id === selectedRow.id
                            ? {
                                ...item,
                                ...values,
                                incidentCategoryName: category?.label || item.incidentCategoryName,
                                severityLevelName: severities.find(sev => sev.value === values.severityLevelId)?.label
                            }
                            : item
                    );
                    setData(updatedData);
                    handleClose();
                })
                .catch((err) => {
                    errorNotification(err.response?.data?.errorMessage || "Something went wrong");
                })
                .finally(() => setLoading(false));
        } else {
            createIncidentsType(values)
                .then((res) => {
                    successNotification("Incident Type added successfully");

                    // Get matching category label from dropdown data
                    const category = categories.find(cat => cat.value === values.incidentCategoryId);

                    const newEntry = {
                        ...values,
                        status: "ACTIVE",
                        id: res,
                        incidentCategoryName: category?.label || "",
                        severityLevelName: severities.find(sev => sev.value === values.severityLevelId)?.label

                    };
                    setData(prev => [...prev, newEntry]);
                    handleClose();
                })
                .catch((err) => {
                    errorNotification(err.response?.data?.errorMessage || "Something went wrong");
                })
                .finally(() => {
                    setLoading(false)
                });
        }
    };

    const handleEdit = (rowData: any) => {
        setEdit(true);
        setSelectedRow(rowData);
        form.setValues({
            name: rowData.name,
            incidentCategoryId: "" + rowData.incidentCategoryId,
            severityLevelId: "" + rowData.severityLevelId,
            description: rowData.description
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
                    You want to <strong>{action}</strong> the type: <strong>{rowData.name}</strong>?
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
                const apiCall = action === "activate" ? activateIncidentType : deactivateIncidentType;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(`Type ${action}d successfully`);
                        const updatedData = data.map(item =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setData(updatedData);
                    })
                    .catch(() => {
                        errorNotification(`Failed to ${action} type`);
                    }
                    ).finally(() => {
                        dispatch(hideOverlay())
                    })
            },
        });
    };

    useEffect(() => {
        if (!edit) form.setFieldValue('severityLevelId', '');
    }, [form.values.incidentCategoryId]);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        // @ts-ignore
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };


    const centerToolbarTemplate = () => (
        <SegmentedControl color={colorMap[severityMap[selectedSeverity ?? ""]] ?? "primary"} value={selectedSeverity} onChange={setSelectedSeverity} data={severityLevels} />
    );
    const rightToolbarTemplate = () => (
        <div className='flex gap-5'>
            <Button size="sm" variant='outline' leftSection={<IconUpload />}>Export</Button>
            <TextInput value={globalFilterValue} onChange={onGlobalFilterChange} size='sm' placeholder='Search' leftSection={<IconSearch />} />
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
    const renderHeader = () => {
        return <Tabs value={tab} fw={400} variant="pills" autoContrast onChange={setTab}>
            <Tabs.List>
                <Tabs.Tab value="all">All</Tabs.Tab>
                {categories.map((category) => (
                    <Tabs.Tab key={category.value} value={category.label.toString()}>
                        {category.label}
                    </Tabs.Tab>
                ))}
            </Tabs.List>
        </Tabs>

    }

    useEffect(() => {
        setSelectedSeverity("All");
    }, [tab]);

    const filteredData = data.filter((item) => {
        if (tab === "all") return true;
        return item.incidentCategoryName === tab;
    }).filter((item) => {
        if (selectedSeverity === "All") return true;
        return item.severityLevelName === selectedSeverity;
    });
    return (
        <div className="card">
            <Toolbar className="mb-1 !p-2" right={rightToolbarTemplate} left={centerToolbarTemplate}></Toolbar>

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
                header={() => renderHeader()}
                globalFilterFields={['name', 'incidentCategory', 'description']}
                emptyMessage="No Check List found."
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                onFilter={(e) => setFilters(e.filters)}
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
            >
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="name" header="Name" sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="incidentCategoryName" header="Incident Category" sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="severityLevelName" header="Severity Level" sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="description" header="Description" sortable />

                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="status" header="Status" body={(rowData) => (
                    <Tag severity={rowData.status === "ACTIVE" ? "success" : rowData.status === "INACTIVE" ? "danger" : "info"}>
                        {rowData.status}
                    </Tag>
                )} sortable />
                <Column headerStyle={{ width: '8rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
            </DataTable>

            {/* Add/Edit Modal */}
            <Modal opened={opened} size="lg" onClose={handleClose} centered title={
                <div className="text-lg text-blue-500">
                    {edit ? "Update" : "Create"} Incident Type
                </div>
            }>
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: "sm", blur: 2 }} />
                <form className='flex flex-col gap-4' onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput label="Name" withAsterisk placeholder='Enter name' {...form.getInputProps('name')} />
                    <Select readOnly={edit}
                        withAsterisk
                        label="Incident Category"
                        placeholder="Select Incident Category"
                        data={categories}
                        {...form.getInputProps('incidentCategoryId')}
                    />
                    <Select
                        withAsterisk
                        label="Severity Level"
                        placeholder="Select Severity Level"
                        data={severities.filter((item) => item.incidentCategoryId == form.values.incidentCategoryId)}
                        {...form.getInputProps('severityLevelId')}
                    />
                    <Textarea label="Description" withAsterisk placeholder="Enter Description" {...form.getInputProps('description')} />
                    <Button type="submit" mt="md" variant="gradient">{edit ? "Update" : "Add"}</Button>
                </form>
            </Modal>


        </div>
    )
}

export default IncidentTypeData;

import { ActionIcon, Button, LoadingOverlay, Modal, Select, Textarea, TextInput, Tooltip } from "@mantine/core";
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
import { modals } from '@mantine/modals';
import { Z } from '../../../constants/zIndex';
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { activateCheckList, createCheckList, deactivateCheckList, GetAllCheckList, updateCheckList } from "../../../services/ChecklistParameterService";
import { GetAllIncidentCategories } from "../../../services/IncidentCategory";


const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
};

const CheckListData = () => {
    const [opened, { open, close }] = useDisclosure(false);
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | DataTableValueArray | undefined>(undefined);
    const [edit, setEdit] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const dispatch = useDispatch();
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [checklist, setChecklist] = useState<any[]>([]);

    const form = useForm({
        initialValues: {
            name: '',
            description: '',
            incidentCategoryId: '',
            incidentCategoryName: '',
        },
        validate: {
            name: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Name is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
            description: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Description is required";
                const wordCount = trimmed.length;
                return wordCount > 250 ? "Maximum 250 characters allowed" : null;
            },
            incidentCategoryId: (value) => value?.trim()?.length > 0 ? null : "Category is required",
        }
    });

    const handleEdit = (rowData: any) => {
        setEdit(true);
        setSelectedRow(rowData);
        form.setValues({
            name: rowData.name,
            description: rowData.description,
            incidentCategoryId: "" + rowData.incidentCategoryId,
            incidentCategoryName: rowData.incidentCategoryName
        });
        open();
    };

    useEffect(() => {
        setLoading(true);
        GetAllIncidentCategories({}).then((res) => {
            setChecklist(res.map((item: any) => ({ label: item.name, value: "" + item.id })));
        })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Failed to fetch categories");
            });

        GetAllCheckList({})
            .then((res) => {
                const formatted = res.map((item: any) => ({
                    ...item,
                    status: item.status.toUpperCase(),
                }));
                setData(formatted);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Failed to fetch checklist");
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
            title: <span className='text-2xl'>Are you sure?</span>,
            centered: true,
            children: (
                <span className="text-md">
                    You want to <strong>{action}</strong> the check list: <strong>{rowData.name}</strong>?
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
                const apiCall = action === "activate" ? activateCheckList : deactivateCheckList;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(`Check List ${action}d successfully`);
                        const updatedData = data.map(item =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setData(updatedData);
                    })
                    .catch(() => {
                        errorNotification(`Failed to ${action} check list`);
                    })
                    .finally(() => {
                        dispatch(hideOverlay());
                    });
            },
        });
    };

    const handleSubmit = (values: any) => {
        setLoading(true);

        if (edit) {
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
                id: selectedRow.id,
                name: values.name,
                description: values.description,
                incidentCategoryId: parseInt(values.incidentCategoryId)
            };

            const category = checklist.find(cat => cat.value === values.incidentCategoryId);

            updateCheckList(payload)
                .then(() => {
                    successNotification("Check List updated successfully");
                    const updatedData = data.map((item) =>
                        item.id === selectedRow.id
                            ? {
                                ...item,
                                ...payload,
                                incidentCategoryName: category?.label || item.incidentCategoryName
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
            createCheckList({ ...values, incidentCategoryId: parseInt(values.incidentCategoryId) })
                .then((res) => {
                    successNotification("Check List added successfully");
                    const category = checklist.find(cat => cat.value === values.incidentCategoryId);

                    const newEntry = {
                        ...values,
                        status: "ACTIVE",
                        id: res,
                        incidentCategoryName: category?.label || ""
                    };
                    setData(prev => [...prev, newEntry]);
                    handleClose();
                })
                .catch((err) => {
                    errorNotification(err.response?.data?.errorMessage || "Something went wrong");
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        // @ts-ignore
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const leftToolbarTemplate = () => {
        return (
            <div className="flex gap-5">
                <Button size='sm' leftSection={<IconPlus />} variant="gradient" onClick={open}>
                    New Check List
                </Button>
            </div>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <div className='flex gap-5'>
                <Button size="sm" variant='outline' leftSection={<IconUpload />}>Export</Button>
                <TextInput value={globalFilterValue} onChange={onGlobalFilterChange} size='sm' placeholder='Search' leftSection={<IconSearch />} />
            </div>
        );
    };

    const actionBodyTemplate = (rowData: any) => {
        return (
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
    };

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
                globalFilterFields={['name']}
                emptyMessage="No Check List found."
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                onFilter={(e) => setFilters(e.filters)}
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
            >
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="name" header="CheckList Title" sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="description" header="Description" sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="incidentCategoryName" header="Category" sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="status" header="Status" body={(rowData) => (
                    <Tag severity={rowData.status === "ACTIVE" ? "success" : rowData.status === "INACTIVE" ? "danger" : "info"}>
                        {rowData.status}
                    </Tag>
                )} sortable />
                <Column headerStyle={{ width: '8rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
            </DataTable>

            <Modal opened={opened} size="lg" onClose={handleClose} centered title={
                <h1 className="text-lg text-blue-500">
                    {edit ? "Update" : "Create"} Check List Management
                </h1>
            }>
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: "sm", blur: 2 }} />
                <form className='flex flex-col gap-4' onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput label="Check List Title" withAsterisk placeholder='Enter title' {...form.getInputProps('name')} />
                    <Textarea label="Description" placeholder="Enter Description" {...form.getInputProps('description')} />
                    <Select label="Category" withAsterisk placeholder="Select category" data={checklist} {...form.getInputProps('incidentCategoryId')} />
                    <Button type="submit" mt="md" variant="gradient">{edit ? "Update" : "Add"}</Button>
                </form>
            </Modal>
        </div>
    );
};

export default CheckListData;

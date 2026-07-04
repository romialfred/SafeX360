import { ActionIcon, Button, FileInput, LoadingOverlay, Modal, TextInput, Tooltip } from "@mantine/core";
import { IconCheck, IconEdit, IconEye, IconPlus, IconSearch, IconUpload, IconX } from "@tabler/icons-react";
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
import { activateBodyParts, createBodyParts, deactivateBodyParts, GetAllBodyParts, updateBodyParts } from "../../../services/BodyPartsService";
import { base64ToFile, getBase64 } from "../../../utility/DocumentUtility";

const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
};



const BodyPartsData = () => {
    const [opened, { open, close }] = useDisclosure(false);
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | DataTableValueArray | undefined>(undefined);
    const [edit, setEdit] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();


    const form = useForm({
        initialValues: {
            name: '',
            file: null
        },
        validate: {
            name: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Name is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
            file: (value) => (!edit && !value ? "Image is required" : null)
        }
    });

    useEffect(() => {

        GetAllBodyParts({})
            .then((res) => {

                const formatted = res.map((item: any) => ({
                    ...item,

                }));
                setData(formatted);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Failed to fetch categories");
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (values: any) => {
        setLoading(true);
        // En édition sans nouveau fichier (image effacée), conserver l'image existante :
        // getBase64(null) renvoie null et .split planterait silencieusement (échec save).
        const filePart: any = values.file
            ? ((await getBase64(values.file)) as string)?.split(',')[1] ?? null
            : (edit ? selectedRow?.file : null);
        if (edit) {
            // Check if at least one field has changed
            const changed = Object.keys({ ...values, file: filePart }).some((key) => {
                const newValue = values[key]?.trim?.() ?? values[key];
                const oldValue = selectedRow[key]?.trim?.() ?? selectedRow[key];
                return newValue !== oldValue;
            });

            if (!changed) {
                form.setErrors({ name: "Please update at least one field before submitting" });
                setLoading(false);
                return;
            }

            const payload = { ...selectedRow, ...values, file: filePart };

            updateBodyParts(payload)
                .then(() => {
                    successNotification("Body Parts updated successfully");
                    const updatedData = data.map((item) =>
                        item.id === selectedRow.id
                            ? {
                                ...payload
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

            createBodyParts({ ...values, file: filePart })
                .then((res) => {
                    successNotification("Body Part added successfully");


                    const newEntry = {
                        ...values,
                        status: "ACTIVE",
                        id: res,
                        file: filePart

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
            file: base64ToFile(rowData.file, rowData.name + ".png", "image/png")

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
                    You want to <strong>{action}</strong> the parts: <strong>{rowData.name}</strong>?
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
                const apiCall = action === "activate" ? activateBodyParts : deactivateBodyParts;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(`Parts ${action}d successfully`);
                        const updatedData = data.map(item =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setData(updatedData);
                    })
                    .catch(() => {
                        errorNotification(`Failed to ${action} parts`);
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

    const leftToolbarTemplate = () => (
        <div className="flex gap-5">
            <Button size='sm' leftSection={<IconPlus />} variant="gradient" onClick={open}>
                New Body Parts
            </Button>
        </div>
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
    const imageBodyTemplate = (rowData: any) => {
        const base64 = rowData.file;

        const handlePreview = () => {
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });

            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');
        };

        return <Tooltip label="See Image">
            <ActionIcon color="primary" onClick={handlePreview}>
                <IconEye className="!w-4/5 !h-4/5" stroke={1.5} />
            </ActionIcon>
        </Tooltip>
    }
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
                emptyMessage="No body parts found."
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                onFilter={(e) => setFilters(e.filters)}
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
            >
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="name" header="Name" sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="file" header="Image" body={imageBodyTemplate} sortable />


                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="status" header="Status" body={(rowData) => (
                    <Tag severity={rowData.status === "ACTIVE" ? "success" : rowData.status === "INACTIVE" ? "danger" : "info"}>
                        {rowData.status}
                    </Tag>
                )} sortable />
                <Column headerStyle={{ width: '8rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
            </DataTable>

            {/* Add/Edit Modal */}
            <Modal
                opened={opened}
                size="lg"
                onClose={handleClose}
                centered
                title={
                    <h1 className="text-lg text-blue-500">
                        {edit ? 'Update' : 'Create'} Body Parts
                    </h1>
                }
            >
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: 'sm', blur: 2 }} />

                <form className="flex flex-col gap-4" onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput label="Name" withAsterisk placeholder="Enter name" {...form.getInputProps('name')} />

                    <FileInput
                        label="Image"
                        placeholder="Select Image"
                        accept="image/*"
                        withAsterisk
                        {...form.getInputProps('file')}
                        rightSection={
                            form.values.file ? (
                                <Tooltip label="View Image">
                                    <ActionIcon
                                        size="lg"
                                        variant="light"
                                        onClick={() => {
                                            const file: any = form.values.file;
                                            const fileUrl = URL.createObjectURL(file);
                                            window.open(fileUrl, '_blank');
                                        }}
                                    >
                                        <IconEye style={{ height: "90%", width: "90%" }} />
                                    </ActionIcon></Tooltip>
                            ) : null
                        }
                    />

                    <Button type="submit" mt="md" variant="gradient">
                        {edit ? 'Update' : 'Add'}
                    </Button>
                </form>
            </Modal>


        </div>
    )
}

export default BodyPartsData
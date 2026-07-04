import { ActionIcon, Button, LoadingOverlay, Modal, TextInput, Tooltip } from "@mantine/core";
import { IconCheck, IconEdit, IconPlus, IconSearch, IconUpload, IconX } from "@tabler/icons-react";
import { FilterMatchMode } from "primereact/api";
import { Column } from "primereact/column";
import { DataTable, DataTableExpandedRows, DataTableFilterMeta, DataTableValueArray } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { useEffect, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { Tag } from "primereact/tag";

import { activateLocation, createLocation, deactivateLocation, getAllLocations, updateLocation } from "../../../services/LocationService";
import { Z } from '../../../constants/zIndex';
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { modals } from "@mantine/modals";
import LocationPicker from "../../UtilityComp/LocationPicker";

const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
};

const LocationData = () => {
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
            location: [] as unknown as [number, number],
        },
        validate: {
            name: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Name is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
            location: (value) => value.length > 0 ? null : "Location is required",
        }
    });



    useEffect(() => {
        setLoading(true);
        getAllLocations({})
            .then((res) => {
                const formatted = res.map((item: any) => ({
                    ...item,
                    status: item.status.toUpperCase(),
                }));
                setData(formatted);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Failed to fetch locations");
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = (values: any) => {
        setLoading(true);
        // console.log("values", values);
        // return;
        // Check if edit mode and value hasn't changed
        // if (edit && values.name.trim() === selectedRow?.name.trim()) {
        //     form.setErrors({name: "Please update the value before submitting" });
        //     setLoading(false);
        //     return;
        // }

        if (edit) {
            const payload = { ...selectedRow, name: values.name, latitude: values.location[0], longitude: values.location[1] };
            updateLocation(payload)
                .then(() => {
                    successNotification("Location updated successfully");
                    const updatedData = data.map((item) =>
                        item.id === selectedRow.id ? { ...payload } : item
                    );
                    setData(updatedData);
                    handleClose();
                })
                .catch((err) => {
                    errorNotification(err.response?.data?.errorMessage || "Something went wrong");
                })
                .finally(() => setLoading(false));
        } else {

            createLocation({ name: values.name, latitude: values.location[0], longitude: values.location[1] })

                .then((res) => {
                    successNotification("Location added successfully");
                    const newEntry = {
                        name: values.name, latitude: values.location[0], longitude: values.location[1],
                        status: "ACTIVE",
                        id: res
                    };
                    setData(prev => [...prev, newEntry]);
                    handleClose();
                })
                .catch((err) => {
                    errorNotification(err.response?.data?.errorMessage || "Something went wrong");
                })
                .finally(() => {
                    setLoading(false)
                })
        }
    };



    const handleStatusChange = (rowData: any) => {
        const action = rowData.status === "ACTIVE" ? "deactivate" : "activate";

        modals.openConfirmModal({
            title: <span className='text-2xl'>Are you sure?</span>,
            centered: true,
            children: (
                <span className="text-md">
                    You want to <strong>{action}</strong> the Location: <strong>{rowData.name}</strong>?
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
                const apiCall = action === "activate" ? activateLocation : deactivateLocation;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(`Location ${action}d successfully`);
                        const updatedData = data.map(item =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setData(updatedData);
                    })
                    .catch(() => {
                        errorNotification(`Failed to ${action} Location`);
                    }
                    ).finally(() => {
                        dispatch(hideOverlay())
                    })
            },
        });
    };



    const handleEdit = (rowData: any) => {
        setEdit(true);
        setSelectedRow(rowData);
        form.setValues({
            name: rowData.name,
            location: [rowData.latitude, rowData.longitude],
        });
        open();
    };

    const handleClose = () => {
        close();
        form.reset();
        setEdit(false);
        setSelectedRow(null);
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
                New Location
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
                dataKey="id"
                filters={filters}
                globalFilterFields={['name', 'location']}
                emptyMessage="No Locations found."
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                onFilter={(e) => setFilters(e.filters)}
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
            >
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="name" header="Name" sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="latitude" header="Latitude" sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="longitude" header="Longitude" sortable />
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
                    {edit ? "Update" : "Create"} Location
                </h1>
            }>
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: "sm", blur: 2 }} />
                <form className='flex flex-col gap-4' onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput label="Name" withAsterisk placeholder='Enter name' {...form.getInputProps('name')} />
                    <LocationPicker label="Location" placeholder="Click to select location" form={form} id="location" required />
                    <Button type="submit" mt="md" variant="gradient">{edit ? "Update" : "Add"}</Button>
                </form>
            </Modal>


        </div>
    );
};

export default LocationData;

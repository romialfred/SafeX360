import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { ActionIcon, Button, Modal, Select, Stack, Tooltip } from '@mantine/core';
import { IconEye, IconPlus } from '@tabler/icons-react';
import { FilterMatchMode } from 'primereact/api';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { useRef, useState } from 'react';
import { Column } from 'primereact/column';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import PdfDropzone from '../../UtilityComp/PdfDropzone';
import { getBase64, openPDF } from '../../../utility/DocumentUtility';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { createComplianceDocument } from '../../../services/ComplianceDocumentService';
import { getMedia } from '../../../services/MediaService';
import { formatDate, formatDateShort } from '../../../utility/DateFormats';

const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
};

type EmpTableProps = {
    requirements: any[];
    docMap: Record<number, any>; // Map of document IDs to their details
    fetchData?: () => void; // Optional function to refetch data after actions
};

const EmpTable = ({ requirements, fetchData, docMap }: EmpTableProps) => {
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const toast = useRef<Toast>(null);
    const [modalOpened, setModalOpened] = useState(false);
    const dispatch = useDispatch();

    const { id: employeeId } = useParams<{ id: string }>();

    const form = useForm({
        initialValues: {
            requirementId: '',
            file: [] as File[],
            expiryDate: null as Date | null
        },
        validate: {
            requirementId: (value) => (value.trim().length > 0 ? null : 'Requirement is required'),
            file: (value) => (value && value.length > 0 ? null : 'File is required'),
            expiryDate: (value) => (value ? null : 'Expiry Date is required')
        }
    });

    const handleSubmit = async (values: any) => {
        if (!employeeId) {
            errorNotification('Employee ID not found');
            return;
        }


        const base64: any = await getBase64(values.file[0].file);
        const val = {
            ...values, media: {
                name: values.file[0].file?.name,
                file: base64.split(',')[1],
            },
            employeeId: Number(employeeId)
        }
        console.log(val);

        dispatch(showOverlay());


        createComplianceDocument(val)
            .then(() => {
                successNotification('Requirement assigned successfully');
                setModalOpened(false);
                form.reset();
                fetchData?.(); // Refetch data if provided
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Something went wrong');
            })
            .finally(() => {
                dispatch(hideOverlay());
            });
    };


    const openDoc = (docId: any) => {
        dispatch(showOverlay());
        getMedia(docMap[docId]?.docId)
            .then((res) => {
                openPDF(res.file);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Failed to open document');
            }).finally(() => {
                dispatch(hideOverlay());
            }
            );
    }

    const actionBodyTemplate = (rowData: any) => {
        return (
            <div className="flex gap-3">
                {rowData.docId && <Tooltip label="View Details">
                    <ActionIcon onClick={() => openDoc(rowData.docId)} variant="filled" size="sm" color="primary">
                        <IconEye style={{ width: '90%', height: '90%' }} stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
                }
            </div>
        );
    };

    const renderHeader = () => {
        return (
            <div className="flex justify-end">
                <Button variant="filled" leftSection={<IconPlus />} onClick={() => setModalOpened(true)}>
                    Upload Document
                </Button>
            </div>
        );
    };

    const statusBodyTemplate = (rowData: any) => {
        const status = rowData.status;


        const getStatusClasses = (status: string) => {
            switch (status.toUpperCase()) {
                case 'COMPLIANCE':
                    return 'bg-green-100 text-green-800';
                case 'NON-COMPLIANCE':
                    return 'bg-red-100 text-red-800';
                case 'UPLOADED':
                    return 'bg-yellow-100 text-yellow-800';
                default:
                    return 'bg-gray-100 text-gray-800';
            }
        };

        return <span className={`px-3 py-1 rounded-xl text-sm ${getStatusClasses(status)}`}>{status}</span>;
    };

    const header = renderHeader();

    return (
        <div className="card">
            <Toast ref={toast} />
            <DataTable selectionMode="single"
                className='[&_.p-datatable-tbody]:!text-sm'
                size="small"
                stripedRows
                removableSort
                paginator
                rows={10}
                header={header}
                value={requirements}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                rowsPerPageOptions={[10, 25, 50]}
                dataKey="requirementId"
                filters={filters}
                globalFilterFields={['requirementName', 'category', 'renewalFrequency', 'status']}
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                onFilter={(e) => setFilters(e.filters)}
            >
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header="Requirement" field="requirementName" />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header="Category" field="category" />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header="Status" body={statusBodyTemplate} field="status" />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header="Last Updated" field="updatedAt" body={(rowData: any) => rowData.updatedAt ? formatDate(rowData.updatedAt) : ""} />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header="Expires" field="expiryDate" body={(rowData: any) => rowData.expiryDate ? formatDateShort(rowData.expiryDate) : ""} />
                <Column
                    headerStyle={{ width: '5rem', textAlign: 'center' }}
                    bodyStyle={{ textAlign: 'center', overflow: 'visible' }}
                    body={actionBodyTemplate}
                />
            </DataTable>

            <Modal
                opened={modalOpened}
                onClose={() => setModalOpened(false)}
                title={<div className="text-lg text-blue-500">Upload Document</div>}
                centered
                size="xl"
            >
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack >
                        <Select withAsterisk
                            label="Select Requirement"
                            placeholder="-- Select a requirement --"
                            data={requirements.filter((x) => x.status == "Non-Compliance").map((r) => ({
                                label: r.requirementName,
                                value: String(r.requirementId)
                            }))}
                            {...form.getInputProps('requirementId')}
                        />

                        <PdfDropzone title="Document" id="file" form={form} withAsterisk single />

                        <DateInput minDate={new Date()} withAsterisk label="Document Expiry Date" placeholder="dd-mm-yyyy" {...form.getInputProps('expiryDate')} />

                        <div className="flex gap-4 justify-end">
                            <Button variant="outline" onClick={() => setModalOpened(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Save</Button>
                        </div>
                    </Stack>
                </form>
            </Modal>
        </div>
    );
};

export default EmpTable;

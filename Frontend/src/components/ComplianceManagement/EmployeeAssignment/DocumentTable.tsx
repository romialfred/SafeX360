import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { ActionIcon, Tooltip } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { FilterMatchMode } from 'primereact/api';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { useRef, useState } from 'react';
import { Column } from 'primereact/column';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { getMedia } from '../../../services/MediaService';
import { errorNotification } from '../../../utility/NotificationUtility';
import { openPDF } from '../../../utility/DocumentUtility';
import { capitalizeFirstLetter } from '../../../utility/OtherUtilities';
import { formatDate, formatDateShort, isPastDate } from '../../../utility/DateFormats';

const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
};


interface DocumentTableProps {
    documents: any[];  // Tum apne hisaab se type specify kar sakti ho
}
const DocumentTable = ({ documents }: DocumentTableProps) => {
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const dispatch = useDispatch();
    const toast = useRef<Toast>(null);

    console.log(documents);

    const actionBodyTemplate = (rowData: any) => {

        return (
            <div className='flex gap-3'>
                <Tooltip label="View Details">
                    <ActionIcon onClick={() => openDoc(rowData.docId)} variant="filled" size="sm" color="primary">
                        <IconEye style={{ width: '90%', height: '90%' }} stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
            </div>
        );
    };

    const statusBodyTemplate = (rowData: any) => {
        const status = isPastDate(rowData.expiryDate) ? "INVALID" : rowData.status;

        const getStatusClasses = (status: string) => {
            switch (status) {
                case 'VALID':
                    return 'bg-green-100 text-green-800';
                case 'PENDING':
                    return 'bg-yellow-100 text-yellow-800';
                case 'INVALID':
                    return 'bg-red-100 text-red-800';
                default:
                    return 'bg-gray-100 text-gray-800';
            }
        };

        return (
            <span
                className={`px-3 py-1  rounded-xl text-sm font-medium ${getStatusClasses(status)}`}
            >
                {capitalizeFirstLetter(status)}
            </span>
        );
    };


    const openDoc = (docId: any) => {
        dispatch(showOverlay());
        getMedia(docId)
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

    return (
        <div className="card">
            <Toast ref={toast} />
            <DataTable selectionMode="single"
                className='[&_.p-datatable-tbody]:!text-sm'
                size='small'
                stripedRows
                removableSort
                paginator
                rows={10}

                value={documents}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                rowsPerPageOptions={[10, 25, 50]}
                dataKey="requirement"
                filters={filters}
                globalFilterFields={['requirement', 'category', 'renewalFrequency', 'status']}
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                onFilter={(e) => setFilters(e.filters)}
            >
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Document Name' field='docName' body={(rowData) => <span className='!line-clamp-1'>{rowData.docName}</span>} />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Requirement' field='requirement' />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Uploaded By' field='uploadedBy' />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Expires' field='expiryDate' body={(rowData: any) => rowData.expiryDate ? formatDateShort(rowData.expiryDate) : ""} />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Upload Date' field='uploadDate' body={(rowData: any) => rowData.uploadDate ? formatDate(rowData.uploadDate) : ""} />
                {/* <Column header='Comment' field='comment' /> */}
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header="Status" body={statusBodyTemplate} field='status' />
                <Column
                    headerStyle={{ width: '5rem', textAlign: 'center' }}
                    bodyStyle={{ textAlign: 'center', overflow: 'visible' }}
                    body={actionBodyTemplate}
                />
            </DataTable>
        </div>

    )
}

export default DocumentTable
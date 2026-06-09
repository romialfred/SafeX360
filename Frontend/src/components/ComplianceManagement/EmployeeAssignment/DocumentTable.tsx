import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { ActionIcon, Tooltip } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { getMedia } from '../../../services/MediaService';
import { errorNotification } from '../../../utility/NotificationUtility';
import { openPDF } from '../../../utility/DocumentUtility';
import { isPastDate } from '../../../utility/DateFormats';
import { docStatusConfig, formatDateFr } from '../complianceLabels';

interface DocumentTableProps {
    documents: any[];
}

/** Justificatifs déposés par un employé (LOT 49). */
const DocumentTable = ({ documents }: DocumentTableProps) => {
    const dispatch = useDispatch();

    const openDoc = (docId: any) => {
        dispatch(showOverlay());
        getMedia(docId)
            .then((res) => openPDF(res.file))
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Le document n'a pas pu être ouvert");
            })
            .finally(() => dispatch(hideOverlay()));
    };

    const documentBody = (row: any) => (
        <div className="min-w-0 max-w-sm">
            <p className="text-[13px] text-slate-800 leading-snug truncate">{row.docName || '—'}</p>
            {row.requirement && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{row.requirement}</p>}
        </div>
    );

    const statusBody = (row: any) => {
        const raw = (row.status ?? '').toString().toUpperCase();
        const computed = raw === 'VALID' && row.expiryDate && isPastDate(row.expiryDate) ? 'EXPIRED' : raw;
        const cfg = docStatusConfig(computed);
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {cfg.label}
            </span>
        );
    };

    const actionBody = (row: any) => (
        <Tooltip label="Ouvrir le document" withArrow>
            <ActionIcon
                onClick={() => openDoc(row.docId)}
                variant="light"
                size="sm"
                color="teal"
                aria-label="Ouvrir le document"
            >
                <IconEye size={14} stroke={1.5} />
            </ActionIcon>
        </Tooltip>
    );

    return (
        <DataTable
            value={documents}
            size="small"
            stripedRows
            removableSort
            paginator
            rows={10}
            rowsPerPageOptions={[10, 25, 50]}
            dataKey="id"
            className="[&_.p-datatable-tbody]:!text-[13px] [&_.p-datatable-thead_th]:!text-[12px]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="{first}–{last} sur {totalRecords}"
            emptyMessage={
                <div className="py-8 text-center text-[13px] text-slate-500">
                    Aucun document déposé par cet employé.
                </div>
            }
        >
            <Column header="Document" body={documentBody} sortable sortField="docName" />
            <Column
                header="Déposé le"
                body={(row: any) => <span className="text-[12.5px] text-slate-600">{row.uploadDate ? formatDateFr(row.uploadDate) : '—'}</span>}
                sortable
                sortField="uploadDate"
                style={{ width: '9rem' }}
            />
            <Column
                header="Expire le"
                body={(row: any) => <span className="text-[12.5px] text-slate-600">{row.expiryDate ? formatDateFr(row.expiryDate) : '—'}</span>}
                sortable
                sortField="expiryDate"
                style={{ width: '9rem' }}
            />
            <Column header="Statut" body={statusBody} style={{ width: '8rem' }} />
            <Column header="" body={actionBody} headerStyle={{ width: '4rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} />
        </DataTable>
    );
};

export default DocumentTable;

import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useEffect, useMemo, useState } from 'react';
import { ActionIcon, TextInput, Tooltip } from '@mantine/core';
import { IconEye, IconFolderOpen, IconSearch } from '@tabler/icons-react';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { useNavigate } from 'react-router-dom';
import { getAllComplianceDocuments } from '../../../services/ComplianceDocumentService';
import { errorNotification } from '../../../utility/NotificationUtility';
import SegmentedFilter from '../../UtilityComp/SegmentedFilter';
import EmptyState from '../../UtilityComp/EmptyState';
import { docStatusConfig, formatDateFr } from '../complianceLabels';

/**
 * Registre des documents de conformité (LOT 49).
 * Le statut affiché est recalculé : un document VALID dont la date
 * d'expiration est dépassée est présenté comme Expiré.
 */

const CompDocData = () => {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<string>('PENDING');
    const [search, setSearch] = useState('');

    useEffect(() => {
        setLoading(true);
        getAllComplianceDocuments()
            .then((res) => {
                const formatted = (res ?? []).map((item: any) => {
                    const rawStatus = (item.status ?? '').toString().toUpperCase();
                    const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
                    const hasValidExpiry = expiryDate instanceof Date && !Number.isNaN(expiryDate.getTime());
                    const isExpired = rawStatus === 'VALID' && hasValidExpiry && expiryDate!.getTime() < Date.now();
                    // Canon REJECTED (le backend stocke INVALID).
                    const computedStatus = isExpired
                        ? 'EXPIRED'
                        : rawStatus === 'INVALID'
                            ? 'REJECTED'
                            : rawStatus;
                    return { ...item, computedStatus };
                });
                setDocuments(formatted);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Échec du chargement des documents');
            })
            .finally(() => setLoading(false));
    }, []);

    const statusCounts = useMemo(() => {
        return documents.reduce(
            (acc, doc) => {
                const status = (doc.computedStatus ?? '').toString();
                if (status === 'VALID') acc.valid += 1;
                else if (status === 'PENDING') acc.pending += 1;
                else if (status === 'EXPIRED') acc.expired += 1;
                else if (status === 'REJECTED') acc.invalid += 1;
                return acc;
            },
            { pending: 0, valid: 0, invalid: 0, expired: 0 }
        );
    }, [documents]);

    const filteredDocuments = useMemo(() => {
        const q = search.trim().toLowerCase();
        return documents.filter((doc) => {
            if (tab !== 'ALL' && (doc.computedStatus ?? '') !== tab) return false;
            if (!q) return true;
            const haystack = [doc.docName, doc.requirement, doc.uploadedBy]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [documents, tab, search]);

    const documentBody = (row: any) => (
        <div className="min-w-0 max-w-sm">
            <p className="text-[13px] text-slate-800 leading-snug truncate">{row.docName || '—'}</p>
            {row.requirement && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{row.requirement}</p>}
        </div>
    );

    const uploadedByBody = (row: any) => (
        <span className="text-[12.5px] text-slate-600">{row.uploadedBy || '—'}</span>
    );

    const statusBody = (row: any) => {
        const cfg = docStatusConfig(row.computedStatus);
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {cfg.label}
            </span>
        );
    };

    const actionBody = (row: any) => (
        <Tooltip label="Voir le détail du document" withArrow>
            <ActionIcon
                onClick={() => navigate(`details-documents/${row.id}`)}
                variant="light"
                size="sm"
                color="teal"
                aria-label="Voir le détail du document"
            >
                <IconEye size={14} stroke={1.5} />
            </ActionIcon>
        </Tooltip>
    );

    return (
        <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 p-3">
                <SegmentedFilter
                    value={tab}
                    onChange={setTab}
                    options={[
                        { value: 'PENDING', label: 'En attente', count: statusCounts.pending, color: 'violet' },
                        { value: 'VALID', label: 'Validés', count: statusCounts.valid, color: 'green' },
                        { value: 'REJECTED', label: 'Rejetés', count: statusCounts.invalid, color: 'rose' },
                        { value: 'EXPIRED', label: 'Expirés', count: statusCounts.expired, color: 'rose' },
                        { value: 'ALL', label: 'Tous', count: documents.length, color: 'slate' },
                    ]}
                    rightElement={
                        <TextInput
                            placeholder="Rechercher un document, une exigence, un employé…"
                            leftSection={<IconSearch size={14} />}
                            value={search}
                            onChange={(e) => setSearch(e.currentTarget.value)}
                            size="xs"
                            w={300}
                        />
                    }
                />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-2">
                {loading ? (
                    <div className="flex flex-col gap-2 p-2" aria-busy="true">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="h-11 rounded-lg bg-slate-100 animate-pulse" />
                        ))}
                    </div>
                ) : !filteredDocuments.length ? (
                    <EmptyState
                        icon={<IconFolderOpen size={24} />}
                        title="Aucun document dans cette catégorie"
                        description="Les justificatifs déposés par les employés apparaîtront ici selon leur statut."
                        compact
                    />
                ) : (
                    <DataTable
                        value={filteredDocuments}
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
                    >
                        <Column header="Document" body={documentBody} sortable sortField="docName" />
                        <Column header="Déposé par" body={uploadedByBody} sortable sortField="uploadedBy" style={{ width: '12rem' }} />
                        <Column
                            header="Déposé le"
                            sortable
                            sortField="uploadDate"
                            body={(row) => <span className="text-[12.5px] text-slate-600">{formatDateFr(row.uploadDate)}</span>}
                            style={{ width: '9rem' }}
                        />
                        <Column
                            header="Expire le"
                            sortable
                            sortField="expiryDate"
                            body={(row) => <span className="text-[12.5px] text-slate-600">{formatDateFr(row.expiryDate)}</span>}
                            style={{ width: '9rem' }}
                        />
                        <Column header="Statut" body={statusBody} style={{ width: '7.5rem' }} />
                        <Column header="" body={actionBody} headerStyle={{ width: '4rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} />
                    </DataTable>
                )}
            </div>
        </div>
    );
};

export default CompDocData;

import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useEffect, useMemo, useState } from 'react';
import { ActionIcon, Button, Textarea, TextInput, Tooltip } from '@mantine/core';
import {
    IconAlertTriangle,
    IconCheck,
    IconCircleCheck,
    IconEye,
    IconFileText,
    IconHourglassHigh,
    IconSearch,
    IconX,
} from '@tabler/icons-react';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { modals } from '@mantine/modals';
import { useDispatch } from 'react-redux';
import KpiTile from '../../UtilityComp/KpiTile';
import SegmentedFilter from '../../UtilityComp/SegmentedFilter';
import EmptyState from '../../UtilityComp/EmptyState';
import {
    approveComplianceDocument,
    getAllComplianceDocuments,
    rejectComplianceDocument,
} from '../../../services/ComplianceDocumentService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { getMedia } from '../../../services/MediaService';
import { openPDF } from '../../../utility/DocumentUtility';
import { docStatusConfig, formatDateFr } from '../complianceLabels';

/**
 * File de validation des documents de conformité (LOT 49).
 * Workflow : consultation du PDF → approbation, ou rejet avec motif obligatoire.
 */
const ValidationData = () => {
    const dispatch = useDispatch();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('PENDING');
    const [search, setSearch] = useState('');

    useEffect(() => {
        setLoading(true);
        getAllComplianceDocuments()
            .then((res) => {
                const now = Date.now();
                const formatted = (res ?? []).map((item: any) => {
                    const rawStatus = (item.status ?? '').toString().toUpperCase();
                    const normalizedStatus = rawStatus === 'INVALID' ? 'REJECTED' : rawStatus;
                    const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
                    const hasValidExpiry = expiryDate instanceof Date && !Number.isNaN(expiryDate.getTime());
                    const isExpired = normalizedStatus === 'VALID' && hasValidExpiry && expiryDate!.getTime() < now;
                    return { ...item, status: isExpired ? 'EXPIRED' : normalizedStatus };
                });
                setData(formatted);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Échec du chargement des documents');
            })
            .finally(() => setLoading(false));
    }, []);

    const statusCounts = useMemo(() => {
        return data.reduce(
            (acc, doc) => {
                const status = (doc.status ?? '').toString().toUpperCase();
                if (status === 'PENDING') acc.PENDING += 1;
                else if (status === 'VALID') acc.VALID += 1;
                else if (status === 'REJECTED') acc.REJECTED += 1;
                else if (status === 'EXPIRED') acc.EXPIRED += 1;
                return acc;
            },
            { PENDING: 0, VALID: 0, REJECTED: 0, EXPIRED: 0 }
        );
    }, [data]);

    const filteredData = useMemo(() => {
        const q = search.trim().toLowerCase();
        return data.filter((doc) => {
            if (statusFilter && (doc.status ?? '').toString().toUpperCase() !== statusFilter) return false;
            if (!q) return true;
            const haystack = [doc.requirement, doc.uploadedBy, doc.docName].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(q);
        });
    }, [data, statusFilter, search]);

    const openDoc = (docId: any) => {
        dispatch(showOverlay());
        getMedia(docId)
            .then((res) => openPDF(res.file))
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Le document n'a pas pu être ouvert");
            })
            .finally(() => dispatch(hideOverlay()));
    };

    const handleApprove = (rowData: any) => {
        modals.openConfirmModal({
            title: <span className="text-base">Approuver le document</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Confirmer la validité du justificatif <strong>{rowData.requirement}</strong> déposé par{' '}
                    <strong>{rowData.uploadedBy}</strong> ?
                </span>
            ),
            labels: { confirm: 'Approuver', cancel: 'Annuler' },
            cancelProps: { color: 'gray', variant: 'default' },
            confirmProps: { color: 'teal' },
            onConfirm: () => {
                dispatch(showOverlay());
                approveComplianceDocument(rowData.id)
                    .then(() => {
                        successNotification('Document approuvé');
                        setData((prev) =>
                            prev.map((doc) => {
                                if (doc.id !== rowData.id) return doc;
                                const expiryDate = doc.expiryDate ? new Date(doc.expiryDate) : null;
                                const isExpired =
                                    expiryDate instanceof Date &&
                                    !Number.isNaN(expiryDate.getTime()) &&
                                    expiryDate.getTime() < Date.now();
                                return { ...doc, status: isExpired ? 'EXPIRED' : 'VALID' };
                            })
                        );
                    })
                    .catch((err) => errorNotification(err.response?.data?.errorMessage || "L'approbation a échoué"))
                    .finally(() => dispatch(hideOverlay()));
            },
        });
    };

    const handleReject = (rowData: any) => {
        const RejectModal = () => {
            const [value, setValue] = useState('');
            const [error, setError] = useState<string | null>(null);

            const handleSubmit = () => {
                if (!value.trim()) {
                    setError('Le motif du rejet est obligatoire');
                    return;
                }
                dispatch(showOverlay());
                rejectComplianceDocument(rowData.id, value)
                    .then(() => {
                        successNotification("Document rejeté. L'employé devra déposer un nouveau justificatif.");
                        setData((prev) => prev.map((doc) => (doc.id === rowData.id ? { ...doc, status: 'REJECTED' } : doc)));
                        modals.closeAll();
                    })
                    .catch((err) => {
                        errorNotification(err.response?.data?.errorMessage || 'Le rejet a échoué');
                    })
                    .finally(() => dispatch(hideOverlay()));
            };

            return (
                <div className="flex flex-col gap-4">
                    <p className="text-[12.5px] text-slate-600">
                        Justificatif <strong>{rowData.requirement}</strong> déposé par <strong>{rowData.uploadedBy}</strong>.
                        Le motif sera visible par l'employé.
                    </p>
                    <Textarea
                        label="Motif du rejet"
                        placeholder="ex. Document illisible, date d'expiration incohérente avec le certificat"
                        value={value}
                        minRows={3}
                        onChange={(e) => {
                            setValue(e.target.value);
                            setError(null);
                        }}
                        error={error}
                        withAsterisk
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="default" size="sm" onClick={() => modals.closeAll()}>
                            Annuler
                        </Button>
                        <Button color="red" size="sm" onClick={handleSubmit}>
                            Rejeter le document
                        </Button>
                    </div>
                </div>
            );
        };

        modals.open({
            title: <span className="text-base">Rejeter le document</span>,
            centered: true,
            children: <RejectModal />,
        });
    };

    const requirementBody = (row: any) => (
        <div className="min-w-0 max-w-sm">
            <p className="text-[13px] text-slate-800 leading-snug">{row.requirement || '—'}</p>
            {row.docName && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{row.docName}</p>}
        </div>
    );

    const statusBody = (row: any) => {
        const cfg = docStatusConfig(row.status);
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {cfg.label}
            </span>
        );
    };

    const actionBody = (rowData: any) => {
        const isFinalized = ['VALID', 'REJECTED', 'EXPIRED'].includes(rowData.status);
        return (
            <div className="flex gap-1.5 justify-center">
                <Tooltip label="Consulter le document" withArrow>
                    <ActionIcon
                        variant="light"
                        size="sm"
                        color="teal"
                        onClick={() => openDoc(rowData.docId)}
                        aria-label="Consulter le document"
                    >
                        <IconEye size={14} stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
                {!isFinalized && (
                    <>
                        <Tooltip label="Approuver" withArrow>
                            <ActionIcon
                                variant="light"
                                size="sm"
                                color="teal"
                                onClick={() => handleApprove(rowData)}
                                aria-label="Approuver le document"
                            >
                                <IconCheck size={14} stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Rejeter avec motif" withArrow>
                            <ActionIcon
                                variant="light"
                                size="sm"
                                color="red"
                                onClick={() => handleReject(rowData)}
                                aria-label="Rejeter le document"
                            >
                                <IconX size={14} stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* KPI de la file de validation */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <KpiTile
                    label="Total documents"
                    value={loading ? '…' : data.length}
                    tone="slate"
                    icon={<IconFileText size={14} stroke={1.8} />}
                />
                <KpiTile
                    label="À valider"
                    value={loading ? '…' : statusCounts.PENDING}
                    tone="violet"
                    icon={<IconHourglassHigh size={14} stroke={1.8} />}
                    referenceValue="File de revue HSE"
                />
                <KpiTile
                    label="Validés"
                    value={loading ? '…' : statusCounts.VALID}
                    tone="green"
                    icon={<IconCircleCheck size={14} stroke={1.8} />}
                />
                <KpiTile
                    label="Expirés"
                    value={loading ? '…' : statusCounts.EXPIRED}
                    tone="rose"
                    icon={<IconAlertTriangle size={14} stroke={1.8} />}
                />
                <KpiTile
                    label="Rejetés"
                    value={loading ? '…' : statusCounts.REJECTED}
                    tone="rose"
                    icon={<IconX size={14} stroke={1.8} />}
                />
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
                <SegmentedFilter
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                        { value: 'PENDING', label: 'À valider', count: statusCounts.PENDING, color: 'violet' },
                        { value: 'VALID', label: 'Validés', count: statusCounts.VALID, color: 'green' },
                        { value: 'REJECTED', label: 'Rejetés', count: statusCounts.REJECTED, color: 'rose' },
                        { value: 'EXPIRED', label: 'Expirés', count: statusCounts.EXPIRED, color: 'rose' },
                    ]}
                    rightElement={
                        <TextInput
                            placeholder="Rechercher une exigence, un employé…"
                            leftSection={<IconSearch size={14} />}
                            value={search}
                            onChange={(e) => setSearch(e.currentTarget.value)}
                            size="xs"
                            w={280}
                        />
                    }
                />
            </div>

            {/* File de documents */}
            <div className="bg-white rounded-xl border border-slate-200 p-2">
                {loading ? (
                    <div className="flex flex-col gap-2 p-2" aria-busy="true">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="h-11 rounded-lg bg-slate-100 animate-pulse" />
                        ))}
                    </div>
                ) : !filteredData.length ? (
                    <EmptyState
                        icon={<IconCircleCheck size={24} />}
                        title={statusFilter === 'PENDING' ? 'Aucun document à valider' : 'Aucun document dans cette catégorie'}
                        description={
                            statusFilter === 'PENDING'
                                ? 'La file de validation est vide. Les nouveaux dépôts apparaîtront ici.'
                                : 'Changez de filtre pour consulter les autres documents.'
                        }
                        iconColor="emerald"
                        compact
                    />
                ) : (
                    <DataTable
                        value={filteredData}
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
                        <Column header="Exigence / document" body={requirementBody} sortable sortField="requirement" />
                        <Column
                            header="Déposé par"
                            body={(row) => <span className="text-[12.5px] text-slate-600">{row.uploadedBy || '—'}</span>}
                            sortable
                            sortField="uploadedBy"
                            style={{ width: '12rem' }}
                        />
                        <Column
                            header="Déposé le"
                            body={(row) => <span className="text-[12.5px] text-slate-600">{formatDateFr(row.uploadDate)}</span>}
                            sortable
                            sortField="uploadDate"
                            style={{ width: '9rem' }}
                        />
                        <Column
                            header="Expire le"
                            body={(row) => <span className="text-[12.5px] text-slate-600">{formatDateFr(row.expiryDate)}</span>}
                            sortable
                            sortField="expiryDate"
                            style={{ width: '9rem' }}
                        />
                        <Column header="Statut" body={statusBody} style={{ width: '7.5rem' }} />
                        <Column header="Actions" body={actionBody} headerStyle={{ width: '7rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} />
                    </DataTable>
                )}
            </div>
        </div>
    );
};

export default ValidationData;

import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useEffect, useMemo, useState } from 'react';
import { ActionIcon, Badge, Button, Select, TextInput, Tooltip } from '@mantine/core';
import {
    IconCircleCheck,
    IconDownload,
    IconEye,
    IconFileDescription,
    IconFiles,
    IconFolderOpen,
    IconHourglassHigh,
    IconPlus,
    IconSearch,
} from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import PageHeader from '../UtilityComp/PageHeader';
import KpiTile from '../UtilityComp/KpiTile';
import EmptyState from '../UtilityComp/EmptyState';
import { getAllDocuments, getApprovedDocuments } from '../../services/DocumentService';
import { getEmployeeDropdown } from '../../services/EmployeeService';
import { getAllDepartments } from '../../services/HrmsService';
import { mapIdToName } from '../../utility/OtherUtilities';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import { type DocumentSummary } from '../../types/documents';
import {
    DOC_CATEGORY_COLORS,
    DOC_CATEGORY_OPTIONS,
    DOC_STATUS_OPTIONS,
    ACCESS_LEVEL_OPTIONS,
    accessLevelConfig,
    docCategoryLabel,
    docStatusConfig,
    formatDateFr,
} from './documentLabels';

/**
 * Registre documentaire : référentiel central des documents de la plateforme.
 * Barre de filtres complète, export CSV, statuts du cycle de vie et niveaux
 * d'accès selon la charte R7.
 */

const ALL = 'ALL';

const DocumentManagement = () => {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<DocumentSummary[]>([]);
    const [approvedDocuments, setApprovedDocuments] = useState<DocumentSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [departmentMap, setDepartmentMap] = useState<Record<string, any>>({});
    const [departments, setDepartments] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
    const [departmentFilter, setDepartmentFilter] = useState<string>(ALL);
    const [ownerFilter, setOwnerFilter] = useState<string>(ALL);
    const [statusFilter, setStatusFilter] = useState<string>(ALL);
    const [accessFilter, setAccessFilter] = useState<string>(ALL);

    useEffect(() => {
        setLoading(true);
        getAllDocuments()
            .then((res) => {
                setDocuments(Array.isArray(res) ? (res as DocumentSummary[]) : []);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Échec du chargement des documents');
            })
            .finally(() => setLoading(false));

        getApprovedDocuments()
            .then((res) => setApprovedDocuments(res ?? []))
            .catch(() => {
                // KPI secondaire : le registre reste exploitable sans ce compteur
            });

        getEmployeeDropdown()
            .then((res) => {
                setEmpMap(mapIdToName(res));
                setEmployees(res ?? []);
            })
            .catch(() => {
                // les noms de propriétaires resteront vides
            });

        getAllDepartments()
            .then((res) => {
                setDepartmentMap(mapIdToName(res));
                setDepartments(res ?? []);
            })
            .catch(() => {
                // les noms de départements resteront vides
            });
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return documents.filter((doc) => {
            if (categoryFilter !== ALL && doc.category !== categoryFilter) return false;
            if (departmentFilter !== ALL && String(doc.departmentId ?? '') !== departmentFilter) return false;
            if (ownerFilter !== ALL && String(doc.ownerId ?? '') !== ownerFilter) return false;
            if (statusFilter !== ALL && (doc.status ?? '').toUpperCase() !== statusFilter) return false;
            if (accessFilter !== ALL && (doc.accessLevel ?? '').toUpperCase() !== accessFilter) return false;
            if (!q) return true;
            const ownerName = empMap[String(doc.ownerId ?? '')]?.name ?? '';
            const haystack = [doc.documentName, doc.description, ownerName, ...(doc.tags ?? [])]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [documents, search, categoryFilter, departmentFilter, ownerFilter, statusFilter, accessFilter, empMap]);

    const counts = useMemo(
        () => ({
            total: documents.length,
            underReview: documents.filter((doc) => doc.status === 'UNDER_REVIEW').length,
            drafts: documents.filter((doc) => doc.status === 'DRAFT').length,
        }),
        [documents]
    );

    const exportCsv = () => {
        const headers = [
            'Document', 'Catégorie', 'Propriétaire', 'Département', "Niveau d'accès",
            'Statut', 'Date de révision', "Date d'expiration",
        ];
        const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const lines = filtered.map((doc) =>
            [
                doc.documentName,
                docCategoryLabel(doc.category),
                empMap[String(doc.ownerId ?? '')]?.name ?? '',
                departmentMap[String(doc.departmentId ?? '')]?.name ?? '',
                accessLevelConfig(doc.accessLevel).label,
                docStatusConfig(doc.status).label,
                doc.reviewDate ? formatDateFr(doc.reviewDate) : '',
                doc.expiryDate ? formatDateFr(doc.expiryDate) : '',
            ].map(escape).join(';')
        );
        const csv = '﻿' + [headers.map(escape).join(';'), ...lines].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `registre_documentaire_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        successNotification(`${filtered.length} document${filtered.length > 1 ? 's' : ''} exporté${filtered.length > 1 ? 's' : ''}`);
    };

    // ─── Rendus de colonnes ──────────────────────────────────────────────────

    const nameBody = (doc: DocumentSummary) => (
        <div className="min-w-0 max-w-md">
            <Link
                to={`document-details/${doc.id}`}
                className="text-[13px] text-slate-800 leading-snug hover:text-teal-700 hover:underline"
            >
                {doc.documentName}
            </Link>
            {doc.description && (
                <p className="text-[11.5px] text-slate-500 mt-0.5 truncate">{doc.description}</p>
            )}
        </div>
    );

    const categoryBody = (doc: DocumentSummary) => (
        <Badge
            color={DOC_CATEGORY_COLORS[doc.category ?? ''] ?? 'gray'}
            variant="light"
            size="sm"
            radius="sm"
        >
            {docCategoryLabel(doc.category)}
        </Badge>
    );

    const ownerBody = (doc: DocumentSummary) => (
        <span className="text-[12.5px] text-slate-600">
            {empMap[String(doc.ownerId ?? '')]?.name ?? '—'}
        </span>
    );

    const departmentBody = (doc: DocumentSummary) => (
        <span className="text-[12.5px] text-slate-600">
            {departmentMap[String(doc.departmentId ?? '')]?.name ?? '—'}
        </span>
    );

    const accessBody = (doc: DocumentSummary) => {
        const cfg = accessLevelConfig(doc.accessLevel);
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {cfg.label}
            </span>
        );
    };

    const statusBody = (doc: DocumentSummary) => {
        const cfg = docStatusConfig(doc.status);
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {cfg.label}
            </span>
        );
    };

    const actionsBody = (doc: DocumentSummary) => {
        if (!doc?.id) return null;
        return (
            <Tooltip label="Consulter la fiche du document" withArrow>
                <ActionIcon
                    onClick={() => navigate(`document-details/${doc.id}`)}
                    variant="light"
                    size="sm"
                    color="teal"
                    aria-label="Consulter la fiche du document"
                >
                    <IconEye size={14} stroke={1.5} />
                </ActionIcon>
            </Tooltip>
        );
    };

    const hasActiveFilters =
        search.trim() !== '' ||
        categoryFilter !== ALL ||
        departmentFilter !== ALL ||
        ownerFilter !== ALL ||
        statusFilter !== ALL ||
        accessFilter !== ALL;

    const resetFilters = () => {
        setSearch('');
        setCategoryFilter(ALL);
        setDepartmentFilter(ALL);
        setOwnerFilter(ALL);
        setStatusFilter(ALL);
        setAccessFilter(ALL);
    };

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Centre de Connaissances' },
                    { label: 'Gestionnaire de documents' },
                ]}
                icon={<IconFolderOpen size={22} stroke={2} />}
                iconColor="cyan"
                title="Gestionnaire de documents"
                subtitle="Référentiel central des documents : versions, statuts et niveaux d'accès"
                actions={
                    <Button
                        size="sm"
                        color="teal"
                        leftSection={<IconPlus size={15} />}
                        onClick={() => navigate('create-document')}
                    >
                        Nouveau document
                    </Button>
                }
            />

            {/* KPI du registre */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiTile
                    label="Total documents"
                    value={loading ? '…' : counts.total}
                    tone="slate"
                    icon={<IconFiles size={14} stroke={1.8} />}
                />
                <KpiTile
                    label="Approuvés"
                    value={loading ? '…' : approvedDocuments.length}
                    tone="green"
                    icon={<IconCircleCheck size={14} stroke={1.8} />}
                    referenceValue="Diffusables aux équipes"
                />
                <KpiTile
                    label="En revue"
                    value={loading ? '…' : counts.underReview}
                    tone="violet"
                    icon={<IconHourglassHigh size={14} stroke={1.8} />}
                    referenceValue="En attente d'approbation"
                />
                <KpiTile
                    label="Brouillons"
                    value={loading ? '…' : counts.drafts}
                    tone="teal"
                    icon={<IconFileDescription size={14} stroke={1.8} />}
                />
            </div>

            {/* Barre de filtres */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                    <TextInput
                        placeholder="Rechercher par nom, description, propriétaire ou étiquette…"
                        leftSection={<IconSearch size={14} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        size="xs"
                        className="flex-1 min-w-[220px]"
                    />
                    <Select
                        data={[{ value: ALL, label: 'Toutes catégories' }, ...DOC_CATEGORY_OPTIONS]}
                        value={categoryFilter}
                        onChange={(v) => setCategoryFilter(v ?? ALL)}
                        size="xs"
                        w={155}
                        aria-label="Filtrer par catégorie"
                    />
                    <Select
                        data={[
                            { value: ALL, label: 'Tous départements' },
                            ...departments.map((x) => ({ value: String(x.id), label: x.name })),
                        ]}
                        value={departmentFilter}
                        onChange={(v) => setDepartmentFilter(v ?? ALL)}
                        size="xs"
                        w={165}
                        searchable
                        aria-label="Filtrer par département"
                    />
                    <Select
                        data={[
                            { value: ALL, label: 'Tous propriétaires' },
                            ...employees.map((x) => ({ value: String(x.id), label: x.name })),
                        ]}
                        value={ownerFilter}
                        onChange={(v) => setOwnerFilter(v ?? ALL)}
                        size="xs"
                        w={165}
                        searchable
                        aria-label="Filtrer par propriétaire"
                    />
                    <Select
                        data={[{ value: ALL, label: 'Tous statuts' }, ...DOC_STATUS_OPTIONS]}
                        value={statusFilter}
                        onChange={(v) => setStatusFilter(v ?? ALL)}
                        size="xs"
                        w={135}
                        aria-label="Filtrer par statut"
                    />
                    <Select
                        data={[{ value: ALL, label: 'Tous accès' }, ...ACCESS_LEVEL_OPTIONS]}
                        value={accessFilter}
                        onChange={(v) => setAccessFilter(v ?? ALL)}
                        size="xs"
                        w={135}
                        aria-label="Filtrer par niveau d'accès"
                    />
                    <Button
                        variant="default"
                        size="xs"
                        leftSection={<IconDownload size={14} />}
                        onClick={exportCsv}
                        disabled={!filtered.length}
                        className="ml-auto"
                    >
                        Exporter CSV
                    </Button>
                </div>
                <p className="text-[11.5px] text-slate-500 mt-2">
                    {loading
                        ? 'Chargement du registre…'
                        : `${filtered.length} document${filtered.length > 1 ? 's' : ''} affiché${filtered.length > 1 ? 's' : ''} sur ${documents.length}`}
                </p>
            </div>

            {/* Registre */}
            <div className="bg-white rounded-xl border border-slate-200 p-2">
                {loading ? (
                    <div className="flex flex-col gap-2 p-2" aria-busy="true">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-11 rounded-lg bg-slate-100 animate-pulse" />
                        ))}
                    </div>
                ) : !filtered.length ? (
                    <EmptyState
                        icon={<IconSearch size={24} />}
                        title={hasActiveFilters ? 'Aucun document ne correspond aux filtres' : 'Aucun document enregistré'}
                        description={
                            hasActiveFilters
                                ? 'Élargissez la recherche ou réinitialisez les filtres pour retrouver le registre complet.'
                                : 'Ajoutez le premier document du référentiel : politique, procédure ou rapport.'
                        }
                        compact
                        action={
                            hasActiveFilters ? (
                                <Button variant="default" size="xs" onClick={resetFilters}>
                                    Réinitialiser les filtres
                                </Button>
                            ) : (
                                <Button
                                    size="xs"
                                    color="teal"
                                    leftSection={<IconPlus size={14} />}
                                    onClick={() => navigate('create-document')}
                                >
                                    Nouveau document
                                </Button>
                            )
                        }
                    />
                ) : (
                    <DataTable
                        value={filtered}
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
                        <Column header="Document" body={nameBody} sortable sortField="documentName" />
                        <Column header="Catégorie" body={categoryBody} sortable sortField="category" style={{ width: '8.5rem' }} />
                        <Column header="Propriétaire" body={ownerBody} sortable sortField="ownerId" style={{ width: '10rem' }} />
                        <Column header="Département" body={departmentBody} sortable sortField="departmentId" style={{ width: '10rem' }} />
                        <Column header="Accès" body={accessBody} sortable sortField="accessLevel" style={{ width: '8rem' }} />
                        <Column header="Statut" body={statusBody} sortable sortField="status" style={{ width: '7.5rem' }} />
                        <Column
                            header="Révision"
                            body={(doc: DocumentSummary) => (
                                <span className="text-[12.5px] text-slate-600">{formatDateFr(doc.reviewDate)}</span>
                            )}
                            sortable
                            sortField="reviewDate"
                            style={{ width: '7.5rem' }}
                        />
                        <Column
                            header="Expiration"
                            body={(doc: DocumentSummary) => (
                                <span className="text-[12.5px] text-slate-600">{formatDateFr(doc.expiryDate)}</span>
                            )}
                            sortable
                            sortField="expiryDate"
                            style={{ width: '7.5rem' }}
                        />
                        <Column
                            header="Actions"
                            body={actionsBody}
                            headerStyle={{ width: '5rem', textAlign: 'center' }}
                            bodyStyle={{ textAlign: 'center', overflow: 'visible' }}
                        />
                    </DataTable>
                )}
            </div>
        </div>
    );
};

export default DocumentManagement;

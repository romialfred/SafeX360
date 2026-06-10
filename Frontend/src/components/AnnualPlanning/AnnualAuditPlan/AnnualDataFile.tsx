import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useEffect, useMemo, useState } from 'react';
import { ActionIcon, Button, Select, TextInput, Tooltip } from '@mantine/core';
import {
    IconCheck,
    IconDownload,
    IconEdit,
    IconLayoutGrid,
    IconLayoutList,
    IconSearch,
    IconX,
} from '@tabler/icons-react';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { modals } from '@mantine/modals';
import AnnualAuditCard from './AnnualAuditCard';
import EmptyState from '../../UtilityComp/EmptyState';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import {
    approvePlanning,
    getLeadAuditorsForPlanning,
    getPlanningAudits,
    rejectPlanning,
} from '../../../services/AuditService';
import { mapIdToName } from '../../../utility/OtherUtilities';
import { GetAllAuditArea } from '../../../services/AuditAreaService';
import {
    PLAN_STATUS_OPTIONS,
    auditCategoryConfig,
    formatDateFr,
    planStatusConfig,
} from '../planningLabels';

/**
 * Registre du plan annuel d'audits : barre de filtres (recherche, catégorie,
 * statut), export CSV, vue tableau ou cartes, approbation / rejet des plans.
 */

const ALL = 'ALL';

const AnnualDataFile = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [viewType, setViewType] = useState<'table' | 'card'>('table');
    const [audits, setAudits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [auditAreaMap, setAuditAreaMap] = useState<any>({});
    const [leadAuditors, setLeadAuditors] = useState<Record<string, any>>({});

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
    const [statusFilter, setStatusFilter] = useState<string>(ALL);

    useEffect(() => {
        setLoading(true);
        getPlanningAudits()
            .then((res) => setAudits(res ?? []))
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Échec du chargement du plan d'audits");
            })
            .finally(() => setLoading(false));
        GetAllAuditArea({})
            .then((res) => setAuditAreaMap(mapIdToName(res)))
            .catch(() => { });
        getLeadAuditorsForPlanning()
            .then((res) => {
                setLeadAuditors(
                    (res ?? []).reduce((acc: any, auditor: any) => {
                        acc[auditor.auditId] = auditor;
                        return acc;
                    }, {})
                );
            })
            .catch(() => { });
    }, []);

    const scopeName = (rowData: any) => {
        const key = String(rowData.scopeId ?? '');
        return auditAreaMap[key]?.name || rowData.auditArea || rowData.scope || rowData.scopeName || '—';
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return audits.filter((row) => {
            if (categoryFilter !== ALL && String(row.category ?? '').toUpperCase() !== categoryFilter) return false;
            if (statusFilter !== ALL && String(row.planningStatus ?? '').toUpperCase() !== statusFilter) return false;
            if (!q) return true;
            const haystack = [row.title, row.refNumber, scopeName(row), leadAuditors[row.id]?.name]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [audits, search, categoryFilter, statusFilter, auditAreaMap, leadAuditors]);

    const handleStatusChange = (rowData: any, status: 'APPROVED' | 'REJECTED') => {
        const actionLabel = status === 'APPROVED' ? 'approuver' : 'rejeter';
        modals.openConfirmModal({
            title: <span className="text-base">Confirmer l'action</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Souhaitez-vous <strong>{actionLabel}</strong> le plan d'audit : <strong>{rowData.title}</strong> ?
                </span>
            ),
            labels: { confirm: status === 'APPROVED' ? 'Oui, approuver' : 'Oui, rejeter', cancel: 'Annuler' },
            cancelProps: { color: 'gray', variant: 'default' },
            confirmProps: { color: status === 'APPROVED' ? 'teal' : 'red', variant: 'filled' },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                dispatch(showOverlay());
                const apiCall = status === 'APPROVED' ? approvePlanning : rejectPlanning;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(status === 'APPROVED' ? "Plan d'audit approuvé" : "Plan d'audit rejeté");
                        setAudits((prev) =>
                            prev.map((item) => (item.id === rowData.id ? { ...item, planningStatus: status } : item))
                        );
                    })
                    .catch(() => {
                        errorNotification("L'opération a échoué");
                    })
                    .finally(() => {
                        dispatch(hideOverlay());
                    });
            },
        });
    };

    const exportCsv = () => {
        const headers = ['Référence', 'Intitulé', "Périmètre", 'Auditeur principal', 'Catégorie', 'Date de début', 'Date de fin', 'Statut'];
        const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const lines = filtered.map((row) =>
            [
                row.refNumber ?? '',
                row.title ?? '',
                scopeName(row),
                leadAuditors[row.id]?.name ?? '',
                auditCategoryConfig(row.category).label,
                formatDateFr(row.startDate),
                formatDateFr(row.endDate),
                planStatusConfig(row.planningStatus).label,
            ].map(escape).join(';')
        );
        const csv = '﻿' + [headers.map(escape).join(';'), ...lines].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `plan_annuel_audits_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        successNotification(`${filtered.length} plan${filtered.length > 1 ? 's' : ''} d'audit exporté${filtered.length > 1 ? 's' : ''}`);
    };

    // ─── Rendus de colonnes ──────────────────────────────────────────────────

    const refBody = (row: any) => (
        <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-mono text-slate-600">
            {row.refNumber || '—'}
        </span>
    );

    const titleBody = (row: any) => (
        <div className="min-w-0 max-w-md">
            <Link to={`details/${row.id}`} className="text-[13px] text-slate-800 leading-snug hover:text-teal-700 hover:underline">
                {row.title}
            </Link>
            <p className="text-[11.5px] text-slate-500 mt-0.5 truncate">{scopeName(row)}</p>
        </div>
    );

    const leadAuditorBody = (row: any) => (
        <span className="text-[12.5px] text-slate-600">{leadAuditors[row.id]?.name ?? '—'}</span>
    );

    const categoryBody = (row: any) => {
        const cfg = auditCategoryConfig(row.category);
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {cfg.label}
            </span>
        );
    };

    const statusBody = (row: any) => {
        const cfg = planStatusConfig(row.planningStatus);
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {cfg.label}
            </span>
        );
    };

    const actionsBody = (rowData: any) => {
        const status = String(rowData?.planningStatus || '').toUpperCase();
        const isPending = status === 'PENDING';

        return (
            <div className="flex gap-1.5 justify-center">
                {isPending ? (
                    <Tooltip label="Modifier le plan" withArrow>
                        <ActionIcon
                            onClick={() => navigate(`edit-auditplan/${rowData.id}`)}
                            variant="light"
                            size="sm"
                            color="blue"
                            aria-label="Modifier le plan"
                        >
                            <IconEdit size={14} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>
                ) : (
                    <Tooltip label={status === 'APPROVED' ? 'Plan approuvé — modification verrouillée' : 'Plan rejeté — modification impossible'} withArrow>
                        <ActionIcon variant="light" size="sm" color="gray" disabled aria-label="Modification indisponible">
                            <IconEdit size={14} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>
                )}
                {isPending && (
                    <>
                        <Tooltip label="Approuver le plan" withArrow>
                            <ActionIcon
                                variant="light"
                                color="teal"
                                onClick={() => handleStatusChange(rowData, 'APPROVED')}
                                size="sm"
                                aria-label="Approuver le plan"
                            >
                                <IconCheck size={14} stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Rejeter le plan" withArrow>
                            <ActionIcon
                                variant="light"
                                color="red"
                                onClick={() => handleStatusChange(rowData, 'REJECTED')}
                                size="sm"
                                aria-label="Rejeter le plan"
                            >
                                <IconX size={14} stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                    </>
                )}
            </div>
        );
    };

    const hasActiveFilters = search.trim() !== '' || categoryFilter !== ALL || statusFilter !== ALL;

    return (
        <div className="space-y-3">
            {/* Barre de filtres */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                    <TextInput
                        placeholder="Rechercher par intitulé, référence ou périmètre…"
                        leftSection={<IconSearch size={14} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        size="xs"
                        className="flex-1 min-w-[220px]"
                    />
                    <Select
                        data={[
                            { value: ALL, label: 'Toutes catégories' },
                            { value: 'INTERNAL', label: 'Internes' },
                            { value: 'EXTERNAL', label: 'Externes' },
                        ]}
                        value={categoryFilter}
                        onChange={(v) => setCategoryFilter(v ?? ALL)}
                        size="xs"
                        w={160}
                        aria-label="Filtrer par catégorie"
                    />
                    <Select
                        data={[{ value: ALL, label: 'Tous statuts' }, ...PLAN_STATUS_OPTIONS]}
                        value={statusFilter}
                        onChange={(v) => setStatusFilter(v ?? ALL)}
                        size="xs"
                        w={140}
                        aria-label="Filtrer par statut"
                    />
                    <div className="flex items-center gap-2 ml-auto">
                        <div className="flex items-center gap-0.5 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                            <Tooltip label="Vue tableau" withArrow>
                                <ActionIcon
                                    variant={viewType === 'table' ? 'filled' : 'subtle'}
                                    color="teal"
                                    size="sm"
                                    onClick={() => setViewType('table')}
                                    aria-label="Vue tableau"
                                >
                                    <IconLayoutList size={14} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Vue cartes" withArrow>
                                <ActionIcon
                                    variant={viewType === 'card' ? 'filled' : 'subtle'}
                                    color="teal"
                                    size="sm"
                                    onClick={() => setViewType('card')}
                                    aria-label="Vue cartes"
                                >
                                    <IconLayoutGrid size={14} />
                                </ActionIcon>
                            </Tooltip>
                        </div>
                        <Button
                            variant="default"
                            size="xs"
                            leftSection={<IconDownload size={14} />}
                            onClick={exportCsv}
                            disabled={!filtered.length}
                        >
                            Exporter CSV
                        </Button>
                    </div>
                </div>
                <p className="text-[11.5px] text-slate-500 mt-2">
                    {loading
                        ? 'Chargement du plan…'
                        : `${filtered.length} plan${filtered.length > 1 ? 's' : ''} d'audit affiché${filtered.length > 1 ? 's' : ''} sur ${audits.length}`}
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
                        title={hasActiveFilters ? 'Aucun plan ne correspond aux filtres' : "Aucun plan d'audit enregistré"}
                        description={
                            hasActiveFilters
                                ? 'Élargissez la recherche ou réinitialisez les filtres pour retrouver le plan complet.'
                                : "Programmez le premier audit de l'année pour alimenter le plan annuel."
                        }
                        compact
                        action={
                            hasActiveFilters ? (
                                <Button
                                    variant="default"
                                    size="xs"
                                    onClick={() => {
                                        setSearch('');
                                        setCategoryFilter(ALL);
                                        setStatusFilter(ALL);
                                    }}
                                >
                                    Réinitialiser les filtres
                                </Button>
                            ) : (
                                <Button size="xs" color="amber" onClick={() => navigate('new-auditplan')}>
                                    Nouveau plan d'audit
                                </Button>
                            )
                        }
                    />
                ) : viewType === 'table' ? (
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
                        <Column header="Référence" body={refBody} sortable sortField="refNumber" style={{ width: '9rem' }} />
                        <Column header="Audit" body={titleBody} sortable sortField="title" />
                        <Column header="Auditeur principal" body={leadAuditorBody} style={{ width: '11rem' }} />
                        <Column header="Catégorie" body={categoryBody} sortable sortField="category" style={{ width: '7.5rem' }} />
                        <Column
                            header="Début"
                            body={(row) => <span className="text-[12.5px] text-slate-600">{formatDateFr(row.startDate)}</span>}
                            sortable
                            sortField="startDate"
                            style={{ width: '7.5rem' }}
                        />
                        <Column
                            header="Fin"
                            body={(row) => <span className="text-[12.5px] text-slate-600">{formatDateFr(row.endDate)}</span>}
                            sortable
                            sortField="endDate"
                            style={{ width: '7.5rem' }}
                        />
                        <Column header="Statut" body={statusBody} sortable sortField="planningStatus" style={{ width: '7.5rem' }} />
                        <Column header="Actions" body={actionsBody} headerStyle={{ width: '7rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} />
                    </DataTable>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-1">
                        {filtered.map((audit: any) => (
                            <AnnualAuditCard
                                key={audit.id}
                                audit={audit}
                                onEdit={(a: any) => navigate(`edit-auditplan/${a.id}`)}
                                onView={(a: any) => navigate(`details/${a.id}`)}
                                onApprove={(a: any) => handleStatusChange(a, 'APPROVED')}
                                onReject={(a: any) => handleStatusChange(a, 'REJECTED')}
                                auditAreaMap={auditAreaMap}
                                leadAuditor={leadAuditors[audit.id]}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnnualDataFile;

import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useEffect, useMemo, useState } from 'react';
import { ActionIcon, Badge, Button, Select, TextInput, Tooltip } from '@mantine/core';
import {
    IconCheck,
    IconDownload,
    IconEdit,
    IconPlus,
    IconSearch,
    IconX,
} from '@tabler/icons-react';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { modals } from '@mantine/modals';
import {
    activateRequirement,
    deactivateRequirement,
    getAllRequirement,
} from '../../../services/RequirementService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import EmptyState from '../../UtilityComp/EmptyState';
import {
    CATEGORY_COLORS,
    CATEGORY_OPTIONS,
    CRITICALITY_CONFIG,
    CRITICALITY_OPTIONS,
    FREQUENCY_OPTIONS,
    categoryLabel,
    docTypeLabel,
    frequencyLabel,
} from '../complianceLabels';

/**
 * Registre des exigences réglementaires (LOT 49).
 * Barre de filtres complète (recherche, catégorie, criticité, statut,
 * fréquence), export CSV fonctionnel, actions activer / désactiver.
 */

interface RequirementRow {
    id: number;
    title: string;
    description?: string;
    category?: string;
    renewalFrequency?: string;
    docType?: string;
    referenceCode?: string;
    legalSource?: string;
    authority?: string;
    criticality?: string;
    status: string;
}

const ALL = 'ALL';

const CompData = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [data, setData] = useState<RequirementRow[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
    const [criticalityFilter, setCriticalityFilter] = useState<string>(ALL);
    const [statusFilter, setStatusFilter] = useState<string>(ALL);
    const [frequencyFilter, setFrequencyFilter] = useState<string>(ALL);

    useEffect(() => {
        setLoading(true);
        getAllRequirement({})
            .then((res) => {
                const formatted: RequirementRow[] = (res ?? []).map((item: any) => ({
                    ...item,
                    status: String(item.status ?? '').toUpperCase(),
                }));
                setData(formatted);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Échec du chargement des exigences');
            })
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return data.filter((row) => {
            if (categoryFilter !== ALL && row.category !== categoryFilter) return false;
            if (criticalityFilter !== ALL && (row.criticality ?? 'STANDARD') !== criticalityFilter) return false;
            if (statusFilter !== ALL && row.status !== statusFilter) return false;
            if (frequencyFilter !== ALL && row.renewalFrequency !== frequencyFilter) return false;
            if (!q) return true;
            const haystack = [row.title, row.referenceCode, row.legalSource, row.authority, row.description]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [data, search, categoryFilter, criticalityFilter, statusFilter, frequencyFilter]);

    const handleStatusChange = (rowData: RequirementRow) => {
        const action = rowData.status === 'ACTIVE' ? 'deactivate' : 'activate';
        const actionLabel = action === 'activate' ? 'activer' : 'désactiver';
        modals.openConfirmModal({
            title: <span className="text-base">Confirmer l'action</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Souhaitez-vous <strong>{actionLabel}</strong> l'exigence : <strong>{rowData.title}</strong> ?
                </span>
            ),
            labels: { confirm: `Oui, ${actionLabel}`, cancel: 'Annuler' },
            cancelProps: { color: 'gray', variant: 'default' },
            confirmProps: { color: action === 'activate' ? 'teal' : 'red', variant: 'filled' },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                dispatch(showOverlay());
                const apiCall = action === 'activate' ? activateRequirement : deactivateRequirement;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(`Exigence ${action === 'activate' ? 'activée' : 'désactivée'}`);
                        setData((prev) =>
                            prev.map((item) =>
                                item.id === rowData.id
                                    ? { ...item, status: action === 'activate' ? 'ACTIVE' : 'INACTIVE' }
                                    : item
                            )
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
        const headers = [
            'Code', 'Intitulé', 'Catégorie', 'Criticité', 'Fréquence',
            'Type de document', 'Source légale', 'Autorité', 'Statut',
        ];
        const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const lines = filtered.map((row) =>
            [
                row.referenceCode ?? `EXG-${String(row.id).padStart(3, '0')}`,
                row.title,
                categoryLabel(row.category),
                (CRITICALITY_CONFIG[row.criticality ?? 'STANDARD'] ?? CRITICALITY_CONFIG.STANDARD).label,
                frequencyLabel(row.renewalFrequency),
                docTypeLabel(row.docType),
                row.legalSource ?? '',
                row.authority ?? '',
                row.status === 'ACTIVE' ? 'Active' : 'Inactive',
            ].map(escape).join(';')
        );
        const csv = '﻿' + [headers.map(escape).join(';'), ...lines].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `exigences_reglementaires_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        successNotification(`${filtered.length} exigence${filtered.length > 1 ? 's' : ''} exportée${filtered.length > 1 ? 's' : ''}`);
    };

    // ─── Rendus de colonnes ──────────────────────────────────────────────────

    const codeBody = (row: RequirementRow) => (
        <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-mono text-slate-600">
            {row.referenceCode ?? `EXG-${String(row.id).padStart(3, '0')}`}
        </span>
    );

    const titleBody = (row: RequirementRow) => (
        <div className="min-w-0 max-w-md">
            <p className="text-[13px] text-slate-800 leading-snug">{row.title}</p>
            {row.legalSource && (
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">{row.legalSource}</p>
            )}
        </div>
    );

    const categoryBody = (row: RequirementRow) => (
        <Badge color={CATEGORY_COLORS[row.category ?? ''] ?? 'gray'} variant="light" size="sm" radius="sm">
            {categoryLabel(row.category)}
        </Badge>
    );

    const criticalityBody = (row: RequirementRow) => {
        const cfg = CRITICALITY_CONFIG[row.criticality ?? 'STANDARD'] ?? CRITICALITY_CONFIG.STANDARD;
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {cfg.label}
            </span>
        );
    };

    const frequencyBody = (row: RequirementRow) => (
        <span className="text-[12.5px] text-slate-600">{frequencyLabel(row.renewalFrequency)}</span>
    );

    const statusBody = (row: RequirementRow) => (
        <span
            className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider rounded border ${
                row.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
        >
            {row.status === 'ACTIVE' ? 'Active' : 'Inactive'}
        </span>
    );

    const actionsBody = (row: RequirementRow) => (
        <div className="flex gap-1.5 justify-center">
            <Tooltip label="Modifier l'exigence" withArrow>
                <ActionIcon
                    onClick={() => navigate(`edit-requirement/${row.id}`)}
                    variant="light"
                    size="sm"
                    color="blue"
                    aria-label="Modifier l'exigence"
                >
                    <IconEdit size={14} stroke={1.5} />
                </ActionIcon>
            </Tooltip>
            <Tooltip label={row.status === 'ACTIVE' ? "Désactiver l'exigence" : "Activer l'exigence"} withArrow>
                <ActionIcon
                    variant="light"
                    color={row.status === 'ACTIVE' ? 'red' : 'teal'}
                    onClick={() => handleStatusChange(row)}
                    size="sm"
                    aria-label={row.status === 'ACTIVE' ? "Désactiver l'exigence" : "Activer l'exigence"}
                >
                    {row.status === 'ACTIVE' ? <IconX size={14} /> : <IconCheck size={14} />}
                </ActionIcon>
            </Tooltip>
        </div>
    );

    const hasActiveFilters =
        search.trim() !== '' ||
        categoryFilter !== ALL ||
        criticalityFilter !== ALL ||
        statusFilter !== ALL ||
        frequencyFilter !== ALL;

    return (
        <div className="space-y-3">
            {/* Barre de filtres */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                    <TextInput
                        placeholder="Rechercher par intitulé, code ou source légale…"
                        leftSection={<IconSearch size={14} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        size="xs"
                        className="flex-1 min-w-[220px]"
                    />
                    <Select
                        data={[{ value: ALL, label: 'Toutes catégories' }, ...CATEGORY_OPTIONS]}
                        value={categoryFilter}
                        onChange={(v) => setCategoryFilter(v ?? ALL)}
                        size="xs"
                        w={160}
                        aria-label="Filtrer par catégorie"
                    />
                    <Select
                        data={[{ value: ALL, label: 'Toutes criticités' }, ...CRITICALITY_OPTIONS]}
                        value={criticalityFilter}
                        onChange={(v) => setCriticalityFilter(v ?? ALL)}
                        size="xs"
                        w={150}
                        aria-label="Filtrer par criticité"
                    />
                    <Select
                        data={[
                            { value: ALL, label: 'Tous statuts' },
                            { value: 'ACTIVE', label: 'Actives' },
                            { value: 'INACTIVE', label: 'Inactives' },
                        ]}
                        value={statusFilter}
                        onChange={(v) => setStatusFilter(v ?? ALL)}
                        size="xs"
                        w={130}
                        aria-label="Filtrer par statut"
                    />
                    <Select
                        data={[{ value: ALL, label: 'Toutes fréquences' }, ...FREQUENCY_OPTIONS]}
                        value={frequencyFilter}
                        onChange={(v) => setFrequencyFilter(v ?? ALL)}
                        size="xs"
                        w={160}
                        aria-label="Filtrer par fréquence"
                    />
                    <div className="flex items-center gap-2 ml-auto">
                        <Button
                            variant="default"
                            size="xs"
                            leftSection={<IconDownload size={14} />}
                            onClick={exportCsv}
                            disabled={!filtered.length}
                        >
                            Exporter CSV
                        </Button>
                        <Button
                            size="xs"
                            color="teal"
                            leftSection={<IconPlus size={14} />}
                            onClick={() => navigate('add-requirement')}
                        >
                            Nouvelle exigence
                        </Button>
                    </div>
                </div>
                <p className="text-[11.5px] text-slate-500 mt-2">
                    {loading
                        ? 'Chargement du registre…'
                        : `${filtered.length} exigence${filtered.length > 1 ? 's' : ''} affichée${filtered.length > 1 ? 's' : ''} sur ${data.length}`}
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
                        title={hasActiveFilters ? 'Aucune exigence ne correspond aux filtres' : 'Aucune exigence enregistrée'}
                        description={
                            hasActiveFilters
                                ? 'Élargissez la recherche ou réinitialisez les filtres pour retrouver le registre complet.'
                                : 'Créez la première exigence réglementaire applicable à votre site.'
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
                                        setCriticalityFilter(ALL);
                                        setStatusFilter(ALL);
                                        setFrequencyFilter(ALL);
                                    }}
                                >
                                    Réinitialiser les filtres
                                </Button>
                            ) : (
                                <Button size="xs" color="teal" leftSection={<IconPlus size={14} />} onClick={() => navigate('add-requirement')}>
                                    Nouvelle exigence
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
                        <Column header="Code" body={codeBody} sortable sortField="referenceCode" style={{ width: '6.5rem' }} />
                        <Column header="Exigence" body={titleBody} sortable sortField="title" />
                        <Column header="Catégorie" body={categoryBody} sortable sortField="category" style={{ width: '8.5rem' }} />
                        <Column header="Criticité" body={criticalityBody} sortable sortField="criticality" style={{ width: '7.5rem' }} />
                        <Column header="Renouvellement" body={frequencyBody} sortable sortField="renewalFrequency" style={{ width: '9rem' }} />
                        <Column header="Statut" body={statusBody} sortable sortField="status" style={{ width: '6.5rem' }} />
                        <Column header="Actions" body={actionsBody} headerStyle={{ width: '6rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} />
                    </DataTable>
                )}
            </div>
        </div>
    );
};

export default CompData;

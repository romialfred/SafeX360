import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { ActionIcon, Button, Select, TextInput, Tooltip, Progress } from '@mantine/core';
import { IconDownload, IconLayoutGrid, IconLayoutList, IconSearch } from '@tabler/icons-react';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAllCorrectiveAction } from '../../../services/CorrectiveActionService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import SegmentedFilter from '../../UtilityComp/SegmentedFilter';
import EmptyState from '../../UtilityComp/EmptyState';
import CorrectiveActionCard from './CorrectiveActionCard';
import ControlHierarchyWidget from './ControlHierarchyWidget';
import {
    CA_STATUS_OPTIONS,
    CA_TYPE_LABELS,
    caStatusConfig,
    caTypeLabel,
    formatDateFr,
    isOverdue,
} from './correctiveLabels';

/**
 * Registre des actions correctives : filtres par source et statut,
 * recherche, export CSV, double vue tableau / cartes.
 */

const ALL = 'ALL';

const CorrectiveData = () => {
    const { t } = useTranslation('corrective');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>(ALL);
    const [statusFilter, setStatusFilter] = useState<string | null>(ALL);
    const [viewType, setViewType] = useState<'table' | 'card'>('table');

    useEffect(() => {
        setLoading(true);
        getAllCorrectiveAction({})
            .then((res) => {
                setData(res ?? []);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Échec du chargement des actions");
            })
            .finally(() => setLoading(false));
    }, []);

    const typeOptions = useMemo(() => ([
        { value: ALL, label: t('tabs.all'), count: data.length, color: 'teal' as const },
        { value: 'INCIDENT', label: t('tabs.incident'), count: data.filter((x) => x.type === 'INCIDENT').length, color: 'rose' as const },
        { value: 'GENERAL_INSPECTION', label: t('tabs.inspection'), count: data.filter((x) => x.type === 'GENERAL_INSPECTION').length, color: 'orange' as const },
        { value: 'HS_ACTIVITY', label: t('tabs.hsActivity'), count: data.filter((x) => x.type === 'HS_ACTIVITY').length, color: 'green' as const },
        { value: 'NON_CONFORMITY', label: t('tabs.nonConformity'), count: data.filter((x) => x.type === 'NON_CONFORMITY').length, color: 'amber' as const },
        { value: 'NEAR_MISS', label: t('tabs.nearMiss'), count: data.filter((x) => x.type === 'NEAR_MISS').length, color: 'indigo' as const },
        { value: 'HAZARD', label: t('tabs.hazard'), count: data.filter((x) => x.type === 'HAZARD').length, color: 'violet' as const },
    ]), [data, t]);

    const filteredData = useMemo(() => {
        const q = search.trim().toLowerCase();
        return data.filter((item) => {
            if (typeFilter !== ALL && item.type !== typeFilter) return false;
            if (statusFilter !== ALL && String(item.status ?? '').toUpperCase() !== statusFilter) return false;
            if (!q) return true;
            const haystack = [item.incidentTitle, item.actionName, item.assignedEmployeeName]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [data, search, typeFilter, statusFilter]);

    const exportCsv = () => {
        const headers = ["Source", "Plan d'action", 'Type', 'Responsable', 'Échéance', 'Progression', 'Statut'];
        const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const lines = filteredData.map((row) =>
            [
                row.incidentTitle ?? '',
                row.actionName ?? '',
                caTypeLabel(row.type),
                row.assignedEmployeeName ?? '',
                formatDateFr(row.deadline),
                `${row.progress ?? 0}%`,
                caStatusConfig(row.status).label,
            ].map(escape).join(';')
        );
        const csv = '﻿' + [headers.map(escape).join(';'), ...lines].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `actions_correctives_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        successNotification(`${filteredData.length} action${filteredData.length > 1 ? 's' : ''} exportée${filteredData.length > 1 ? 's' : ''}`);
    };

    // ─── Rendus de colonnes ──────────────────────────────────────────────────

    const sourceBody = (row: any) => (
        <div className="min-w-0 max-w-sm">
            <Link className="text-[13px] text-teal-700 hover:underline leading-snug" to={`details/${row.incidentId}/${row.type}`}>
                {row.incidentTitle || '—'}
            </Link>
            <p className="text-[11.5px] text-slate-500 mt-0.5">{caTypeLabel(row.type)}</p>
        </div>
    );

    const actionNameBody = (row: any) => (
        <span className="text-[13px] text-slate-800">{row.actionName || '—'}</span>
    );

    const ownerBody = (row: any) => (
        <span className="text-[12.5px] text-slate-600">{row.assignedEmployeeName || '—'}</span>
    );

    const deadlineBody = (row: any) => {
        const statusUpper = String(row.status ?? '').toUpperCase();
        const late = isOverdue(row.deadline) && !['COMPLETED', 'CANCELLED'].includes(statusUpper);
        return (
            <span className={`text-[12.5px] ${late ? 'text-rose-600' : 'text-slate-600'}`}>
                {formatDateFr(row.deadline)}
                {late && <span className="block text-[10.5px] uppercase tracking-wider text-rose-600">En retard</span>}
            </span>
        );
    };

    const progressBody = (row: any) => (
        <Progress.Root size={14}>
            <Tooltip label={`${row.progress}%`} withArrow>
                <Progress.Section
                    value={row.progress}
                    color={row.progress < 20 ? 'red' : row.progress < 70 ? 'orange' : 'teal'}
                >
                    <Progress.Label>{row.progress}%</Progress.Label>
                </Progress.Section>
            </Tooltip>
        </Progress.Root>
    );

    const statusBody = (row: any) => {
        const cfg = caStatusConfig(row.status);
        return (
            <span className={`inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-wider rounded border ${cfg.chip}`}>
                {cfg.label}
            </span>
        );
    };

    const actionsBody = (row: any) => {
        const statusUpper = String(row?.status).toUpperCase();
        const progress = Number(row?.progress ?? 0);
        const canUpdate = progress < 100 && !['COMPLETED'].includes(statusUpper);
        const tooltip = canUpdate
            ? "Mettre à jour la progression"
            : statusUpper === 'PENDING' ? 'En attente de validation — non modifiable'
                : statusUpper === 'CANCELLED' ? 'Action annulée — non modifiable'
                    : 'Déjà clôturée';
        return (
            <div className="flex items-center justify-center gap-2">
                {canUpdate ? (
                    <Link to={`update/${row.id}`}>
                        <Button variant="light" color="teal" size="xs">Mettre à jour</Button>
                    </Link>
                ) : (
                    <Tooltip label={tooltip} withArrow>
                        <span className="inline-flex">
                            <Button variant="light" color="teal" size="xs" disabled>Mettre à jour</Button>
                        </span>
                    </Tooltip>
                )}
            </div>
        );
    };

    const hasActiveFilters = search.trim() !== '' || typeFilter !== ALL || statusFilter !== ALL;

    return (
        <div className="space-y-3">
            {/* Indicateur de maturité HSE : mesures par niveau de hiérarchie (§8.1.2). */}
            <ControlHierarchyWidget />
            {/* Barre de filtres */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
                <SegmentedFilter
                    value={typeFilter}
                    onChange={setTypeFilter}
                    options={typeOptions}
                    rightElement={
                        <>
                            <TextInput
                                placeholder="Rechercher une source, une action, un responsable…"
                                leftSection={<IconSearch size={14} />}
                                value={search}
                                onChange={(e) => setSearch(e.currentTarget.value)}
                                size="xs"
                                w={260}
                            />
                            <Select
                                allowDeselect={false}
                                size="xs"
                                w={140}
                                data={[{ label: 'Tous statuts', value: ALL }, ...CA_STATUS_OPTIONS]}
                                value={statusFilter}
                                onChange={setStatusFilter}
                                aria-label="Filtrer par statut"
                            />
                            <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                                <Tooltip label="Vue tableau" withArrow>
                                    <ActionIcon
                                        variant={viewType === 'table' ? 'filled' : 'subtle'}
                                        color="teal"
                                        size="sm"
                                        onClick={() => setViewType('table')}
                                        aria-label="Vue tableau"
                                    >
                                        <IconLayoutList size={15} />
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
                                        <IconLayoutGrid size={15} />
                                    </ActionIcon>
                                </Tooltip>
                            </div>
                            <Button
                                variant="default"
                                size="xs"
                                leftSection={<IconDownload size={14} />}
                                onClick={exportCsv}
                                disabled={!filteredData.length}
                            >
                                Exporter CSV
                            </Button>
                        </>
                    }
                />
                <p className="text-[11.5px] text-slate-500 mt-2">
                    {loading
                        ? 'Chargement du registre…'
                        : `${filteredData.length} action${filteredData.length > 1 ? 's' : ''} affichée${filteredData.length > 1 ? 's' : ''} sur ${data.length}`}
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
                ) : !filteredData.length ? (
                    <EmptyState
                        icon={<IconSearch size={24} />}
                        title={hasActiveFilters ? 'Aucune action ne correspond aux filtres' : 'Aucune action corrective enregistrée'}
                        description={
                            hasActiveFilters
                                ? 'Élargissez la recherche ou réinitialisez les filtres pour retrouver le registre complet.'
                                : "Les actions issues des incidents, inspections et activités HSE apparaîtront ici."
                        }
                        compact
                        action={
                            hasActiveFilters ? (
                                <Button
                                    variant="default"
                                    size="xs"
                                    onClick={() => {
                                        setSearch('');
                                        setTypeFilter(ALL);
                                        setStatusFilter(ALL);
                                    }}
                                >
                                    Réinitialiser les filtres
                                </Button>
                            ) : undefined
                        }
                    />
                ) : viewType === 'table' ? (
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
                        <Column header="Source de l'action" body={sourceBody} sortable sortField="incidentTitle" />
                        <Column header="Plan d'action" body={actionNameBody} sortable sortField="actionName" />
                        <Column header="Responsable" body={ownerBody} sortable sortField="assignedEmployeeName" style={{ width: '11rem' }} />
                        <Column header="Échéance" body={deadlineBody} sortable sortField="deadline" style={{ width: '8.5rem' }} />
                        <Column header="Progression" body={progressBody} sortable sortField="progress" style={{ width: '9rem' }} />
                        <Column header="Statut" body={statusBody} sortable sortField="status" style={{ width: '8rem' }} />
                        <Column header="Actions" body={actionsBody} headerStyle={{ width: '9rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} />
                    </DataTable>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-2">
                        {filteredData.map((correctiveActionData) => (
                            <CorrectiveActionCard key={correctiveActionData.id} action={correctiveActionData} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CorrectiveData;

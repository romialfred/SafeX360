import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionIcon, Button, TextInput, Tooltip } from '@mantine/core';
import { IconDownload, IconEdit, IconLayoutGrid, IconLayoutList, IconSearch } from '@tabler/icons-react';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Link, useNavigate } from 'react-router-dom';
import { getAllPgi } from '../../../services/PgiService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { formatDateWithDay, formatTo12Hour } from '../../../utility/DateFormats';
import SegmentedFilter from '../../UtilityComp/SegmentedFilter';
import EmptyState from '../../UtilityComp/EmptyState';
import PgiCard from './PgiCard';
import { CHIP_BASE, formatDateFr, inspectionStatusConfig } from './pgiLabels';

const ALL = 'ALL';

/**
 * Registre des inspections : recherche, filtre par statut, bascule
 * tableau / cartes et export CSV.
 */
const PgiData = () => {
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [viewType, setViewType] = useState<'table' | 'card'>('table');
    const [statusFilter, setStatusFilter] = useState<string>(ALL);

    useEffect(() => {
        setLoading(true);
        getAllPgi({})
            .then((res) => setData(res ?? []))
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Échec du chargement des inspections');
            })
            .finally(() => setLoading(false));
    }, []);

    const statusCounts = useMemo(
        () =>
            data.reduce(
                (acc, item) => {
                    const status = String(item.status ?? '').toUpperCase();
                    if (acc[status] !== undefined) acc[status] += 1;
                    return acc;
                },
                { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 } as Record<string, number>
            ),
        [data]
    );

    const filteredData = useMemo(() => {
        const q = search.trim().toLowerCase();
        return data.filter((item) => {
            if (statusFilter !== ALL && String(item.status ?? '').toUpperCase() !== statusFilter) return false;
            if (!q) return true;
            return [item.title, item.siteName].filter(Boolean).join(' ').toLowerCase().includes(q);
        });
    }, [data, search, statusFilter]);

    const exportCsv = () => {
        const headers = ['Inspection', 'Site', 'Date planifiée', 'Début', 'Fin', 'Statut'];
        const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const lines = filteredData.map((row) =>
            [
                row.title,
                row.siteName,
                formatDateFr(row.plannedDate),
                row.startTime ?? '',
                row.endTime ?? '',
                inspectionStatusConfig(row.status).label,
            ].map(escape).join(';')
        );
        const csv = '﻿' + [headers.map(escape).join(';'), ...lines].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `inspections_hse_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        successNotification(`${filteredData.length} inspection${filteredData.length > 1 ? 's' : ''} exportée${filteredData.length > 1 ? 's' : ''}`);
    };

    // ─── Rendus de colonnes ──────────────────────────────────────────────────

    const nameBodyTemplate = (rowData: any) => (
        <Link to={`details-pgi/${rowData.id}`} className="text-[13px] text-teal-700 hover:!underline leading-snug">
            {rowData.title}
        </Link>
    );

    const statusBodyTemplate = (rowData: any) => {
        const cfg = inspectionStatusConfig(rowData.status);
        return <span className={`${CHIP_BASE} ${cfg.chip}`}>{cfg.label}</span>;
    };

    const actionBodyTemplate = (rowData: any) => {
        const statusUpper = String(rowData?.status || '').toUpperCase();
        const canEdit = !['COMPLETED', 'CANCELLED'].includes(statusUpper);
        const tooltip = canEdit
            ? "Modifier l'inspection"
            : statusUpper === 'COMPLETED'
            ? 'Inspection terminée : modification impossible'
            : 'Inspection annulée : modification impossible';
        return (
            <div className="flex gap-1.5 justify-center">
                <Tooltip label={tooltip} withArrow>
                    <span className="inline-flex">
                        <ActionIcon
                            onClick={() => { if (canEdit) navigate(`edit/${rowData.id}`); }}
                            variant="light"
                            size="sm"
                            color="blue"
                            aria-label="Modifier l'inspection"
                            disabled={!canEdit}
                        >
                            <IconEdit size={14} stroke={1.5} />
                        </ActionIcon>
                    </span>
                </Tooltip>
            </div>
        );
    };

    return (
        <div className="space-y-3">
            {/* Barre de filtres */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
                <SegmentedFilter
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                        { value: ALL, label: t('statusValues.all'), count: data.length, color: 'slate' },
                        { value: 'PENDING', label: t('statusValues.pending'), count: statusCounts.PENDING, color: 'violet' },
                        { value: 'IN_PROGRESS', label: t('statusValues.inProgress'), count: statusCounts.IN_PROGRESS, color: 'amber' },
                        { value: 'COMPLETED', label: t('statusValues.completed'), count: statusCounts.COMPLETED, color: 'green' },
                        { value: 'CANCELLED', label: t('statusValues.cancelled'), count: statusCounts.CANCELLED, color: 'rose' },
                    ]}
                    rightElement={
                        <div className="flex items-center gap-2 flex-wrap">
                            <TextInput
                                placeholder={t('search.inspectionPlaceholder')}
                                leftSection={<IconSearch size={14} />}
                                value={search}
                                onChange={(e) => setSearch(e.currentTarget.value)}
                                size="xs"
                                w={240}
                                aria-label="Rechercher une inspection"
                            />
                            <Button
                                variant="default"
                                size="xs"
                                leftSection={<IconDownload size={14} />}
                                onClick={exportCsv}
                                disabled={!filteredData.length}
                            >
                                Exporter CSV
                            </Button>
                            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
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
                        </div>
                    }
                />
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
                        title={
                            statusFilter === ALL && !search.trim()
                                ? 'Aucune inspection planifiée'
                                : 'Aucune inspection ne correspond aux critères'
                        }
                        description={
                            statusFilter === ALL && !search.trim()
                                ? 'Planifiez la première inspection HSE depuis le bouton « Nouvelle inspection ».'
                                : 'Élargissez la recherche ou changez de filtre pour retrouver le registre complet.'
                        }
                        compact
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
                        <Column field="title" header="Inspection" sortable body={nameBodyTemplate} />
                        <Column
                            field="plannedDate"
                            header="Date planifiée"
                            sortable
                            body={(rowData: any) => (
                                <span className="text-[12.5px] text-slate-600">{formatDateWithDay(rowData.plannedDate)}</span>
                            )}
                        />
                        <Column
                            field="startTime"
                            header="Début"
                            style={{ width: '6.5rem' }}
                            body={(rowData: any) => (
                                <span className="text-[12.5px] text-slate-600 tabular-nums">{formatTo12Hour(rowData.startTime)}</span>
                            )}
                        />
                        <Column
                            field="endTime"
                            header="Fin"
                            style={{ width: '6.5rem' }}
                            body={(rowData: any) => (
                                <span className="text-[12.5px] text-slate-600 tabular-nums">{formatTo12Hour(rowData.endTime)}</span>
                            )}
                        />
                        <Column
                            field="siteName"
                            header="Site"
                            sortable
                            body={(rowData: any) => <span className="text-[12.5px] text-slate-600">{rowData.siteName}</span>}
                        />
                        <Column field="status" header="Statut" sortable body={statusBodyTemplate} style={{ width: '8rem' }} />
                        <Column
                            header="Actions"
                            headerStyle={{ width: '5.5rem', textAlign: 'center' }}
                            bodyStyle={{ textAlign: 'center', overflow: 'visible' }}
                            body={actionBodyTemplate}
                        />
                    </DataTable>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-2">
                        {filteredData.map((pgi) => (
                            <PgiCard key={pgi.id} pgiData={pgi} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default PgiData

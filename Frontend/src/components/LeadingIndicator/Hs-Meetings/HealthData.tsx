import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { ActionIcon, Button, TextInput, Tooltip } from '@mantine/core';
import { IconDownload, IconEdit, IconLayoutGrid, IconLayoutList, IconPlus, IconSearch } from '@tabler/icons-react';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { getAllMeetings } from '../../../services/HsActivityService';
import SegmentedFilter from '../../UtilityComp/SegmentedFilter';
import EmptyState from '../../UtilityComp/EmptyState';
import HealthCard from './HealthCard';
import {
    ACTIVITY_STATUS_CONFIG,
    activityStatusConfig,
    activityTypeLabel,
    formatDateFr,
    formatTimeFr,
} from './hsMeetingsLabels';

/**
 * Registre des réunions sécurité : filtre par statut (compteurs), recherche,
 * export CSV, double vue tableau / cartes.
 */

const ALL = 'ALL';

const HealthData = () => {
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>(ALL);
    const [viewType, setViewType] = useState<'table' | 'card'>('table');

    useEffect(() => {
        setLoading(true);
        getAllMeetings()
            .then((res) => setData(res ?? []))
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Échec du chargement des réunions');
            })
            .finally(() => setLoading(false));
    }, []);

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 };
        data.forEach((item) => {
            const s = String(item.status ?? '').toUpperCase();
            if (counts[s] !== undefined) counts[s] += 1;
        });
        return counts;
    }, [data]);

    const filteredData = useMemo(() => {
        const q = search.trim().toLowerCase();
        return data.filter((item) => {
            if (statusFilter !== ALL && String(item.status ?? '').toUpperCase() !== statusFilter) return false;
            if (!q) return true;
            return String(item.title ?? '').toLowerCase().includes(q);
        });
    }, [data, search, statusFilter]);

    const exportCsv = () => {
        const headers = ['Réunion', 'Type', 'Date planifiée', 'Début', 'Fin', 'Statut'];
        const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const lines = filteredData.map((row) =>
            [
                row.title,
                activityTypeLabel(row.type),
                formatDateFr(row.plannedDate),
                formatTimeFr(row.startTime),
                formatTimeFr(row.endTime),
                activityStatusConfig(row.status).label,
            ].map(escape).join(';')
        );
        const csv = '﻿' + [headers.map(escape).join(';'), ...lines].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reunions_securite_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        successNotification(`${filteredData.length} réunion${filteredData.length > 1 ? 's' : ''} exportée${filteredData.length > 1 ? 's' : ''}`);
    };

    // ─── Rendus de colonnes ──────────────────────────────────────────────────

    const titleBody = (row: any) => (
        <div className="min-w-0 max-w-md">
            <Link to={`details-meeting/${row.id}`} className="text-[13px] text-teal-700 hover:underline leading-snug">
                {row.title}
            </Link>
            <p className="text-[11.5px] text-slate-500 mt-0.5">{activityTypeLabel(row.type)}</p>
        </div>
    );

    const dateBody = (row: any) => (
        <span className="text-[12.5px] text-slate-600">{formatDateFr(row.plannedDate)}</span>
    );

    const timeBody = (row: any) => (
        <span className="text-[12.5px] text-slate-600">
            {formatTimeFr(row.startTime)} – {formatTimeFr(row.endTime)}
        </span>
    );

    const statusBody = (row: any) => {
        const cfg = activityStatusConfig(row.status);
        return (
            <span className={`inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-wider rounded border ${cfg.chip}`}>
                {cfg.label}
            </span>
        );
    };

    const actionsBody = (row: any) => {
        const statusUpper = String(row?.status || '').toUpperCase();
        const canEdit = !['COMPLETED', 'CANCELLED'].includes(statusUpper);
        const tooltip = canEdit
            ? 'Modifier la réunion'
            : statusUpper === 'COMPLETED'
                ? 'Réunion réalisée — modification impossible'
                : 'Réunion annulée — modification impossible';
        return (
            <div className="flex gap-1.5 justify-center">
                <Tooltip label={tooltip} withArrow>
                    <span className="inline-flex">
                        <ActionIcon
                            onClick={() => { if (canEdit) navigate(`editActivity/${row.id}`); }}
                            variant="light"
                            size="sm"
                            color="blue"
                            aria-label="Modifier la réunion"
                            disabled={!canEdit}
                        >
                            <IconEdit size={14} stroke={1.5} />
                        </ActionIcon>
                    </span>
                </Tooltip>
            </div>
        );
    };

    const hasActiveFilters = search.trim() !== '' || statusFilter !== ALL;

    return (
        <div className="space-y-3">
            {/* Barre de filtres */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
                <SegmentedFilter
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                        { value: ALL, label: t('statusValues.all'), count: data.length, color: 'teal' },
                        { value: 'PENDING', label: t('statusValues.pending'), count: statusCounts.PENDING, color: 'blue' },
                        { value: 'IN_PROGRESS', label: t('statusValues.inProgress'), count: statusCounts.IN_PROGRESS, color: 'amber' },
                        { value: 'COMPLETED', label: t('statusValues.completed'), count: statusCounts.COMPLETED, color: 'green' },
                        { value: 'CANCELLED', label: t('statusValues.cancelled'), count: statusCounts.CANCELLED, color: 'rose' },
                    ]}
                    rightElement={
                        <>
                            <TextInput
                                placeholder={t('search.meetingPlaceholder')}
                                leftSection={<IconSearch size={14} />}
                                value={search}
                                onChange={(e) => setSearch(e.currentTarget.value)}
                                size="xs"
                                w={220}
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
                        : `${filteredData.length} réunion${filteredData.length > 1 ? 's' : ''} affichée${filteredData.length > 1 ? 's' : ''} sur ${data.length}`}
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
                        title={hasActiveFilters ? 'Aucune réunion ne correspond aux filtres' : 'Aucune réunion planifiée'}
                        description={
                            hasActiveFilters
                                ? 'Élargissez la recherche ou réinitialisez les filtres pour retrouver le registre complet.'
                                : 'Planifiez la première réunion sécurité de votre site.'
                        }
                        compact
                        action={
                            hasActiveFilters ? (
                                <Button
                                    variant="default"
                                    size="xs"
                                    onClick={() => {
                                        setSearch('');
                                        setStatusFilter(ALL);
                                    }}
                                >
                                    Réinitialiser les filtres
                                </Button>
                            ) : (
                                <Button size="xs" color="teal" leftSection={<IconPlus size={14} />} onClick={() => navigate('/add-NewActivity')}>
                                    Nouvelle réunion
                                </Button>
                            )
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
                        <Column header="Réunion" body={titleBody} sortable sortField="title" />
                        <Column header="Date planifiée" body={dateBody} sortable sortField="plannedDate" style={{ width: '11rem' }} />
                        <Column header="Horaires" body={timeBody} style={{ width: '9.5rem' }} />
                        <Column header="Statut" body={statusBody} sortable sortField="status" style={{ width: '8rem' }} />
                        <Column header="Actions" body={actionsBody} headerStyle={{ width: '6rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} />
                    </DataTable>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-2">
                        {filteredData.map((activity) => (
                            <HealthCard key={activity.id} healthData={activity} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HealthData;

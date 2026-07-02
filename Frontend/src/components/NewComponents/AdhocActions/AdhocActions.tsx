import { useEffect, useMemo, useState } from 'react';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import {
    IconBolt,
    IconBuilding,
    IconCalendar,
    IconClock,
    IconDownload,
    IconEdit,
    IconEye,
    IconLayoutGrid,
    IconLayoutList,
    IconPlus,
    IconSearch,
    IconUser,
} from '@tabler/icons-react';
import { ActionIcon, Button, Select, TextInput, Tooltip } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import PageHeader from '../../UtilityComp/PageHeader';
import EmptyState from '../../UtilityComp/EmptyState';
import { getAllAdhoc } from '../../../services/CorrectiveActionService';
import { mapIdToName } from '../../../utility/OtherUtilities';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { getAllDepartments } from '../../../services/HrmsService';
import { getEmployeeDropdown } from '../../../services/EmployeeService';
import {
    ADHOC_STATUS_OPTIONS,
    adhocStatusConfig,
    formatDateFr,
    progressBarClass,
    progressColor,
} from './adhocLabels';

/**
 * Registre des suggestions d'amélioration HSE : barre de filtres (recherche,
 * statut, responsable, département), export CSV, vue tableau ou cartes.
 */

const ALL = 'ALL';

const AdhocActions = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('adhoc');
    // Statuts issus de adhocLabels.ts (codes backend) : clés i18n `adhoc:state.*`, repli sur le libellé FR centralisé.
    const tState = (status?: string | null, fallback?: string) =>
        t(`state.${(status ?? '').toUpperCase()}`, { defaultValue: fallback ?? (status ?? '—') });
    const [actions, setActions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deptMap, setDeptMap] = useState<Record<number, any>>({});
    const [empMap, setEmpMap] = useState<Record<number, any>>({});
    const [departments, setDepartments] = useState<Array<{ label: string, value: string }>>([]);
    const [owners, setOwners] = useState<Array<{ label: string, value: string }>>([]);

    const [search, setSearch] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>(ALL);
    const [selectedOwner, setSelectedOwner] = useState<string>(ALL);
    const [selectedDepartment, setSelectedDepartment] = useState<string>(ALL);
    const [viewType, setViewType] = useState<'table' | 'card'>('table');

    useEffect(() => {
        setLoading(true);
        getAllAdhoc()
            .then((res) => setActions(res ?? []))
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || t('list.loadFailed'));
            })
            .finally(() => setLoading(false));

        getAllDepartments()
            .then((res) => {
                setDeptMap(mapIdToName(res));
                setDepartments(res.map((d: any) => ({ label: d.name, value: String(d.id) })));
            })
            .catch((err) => console.error(err));

        getEmployeeDropdown()
            .then((res) => {
                setEmpMap(mapIdToName(res));
                setOwners(res.map((e: any) => ({ label: e.name, value: String(e.id) })));
            })
            .catch((err) => console.error(err));
    }, []);

    const enrichedActions = useMemo(() => {
        return actions.map((a: any) => ({
            ...a,
            ownerName: empMap[a?.ownerId]?.name ?? '—',
            departmentName: deptMap[a?.departmentId]?.name ?? '—',
        }));
    }, [actions, empMap, deptMap]);

    const filteredData = useMemo(() => {
        const q = search.trim().toLowerCase();
        return enrichedActions.filter((a: any) => {
            if (selectedStatus !== ALL && a.status !== selectedStatus) return false;
            if (selectedOwner !== ALL && String(a.ownerId ?? '') !== selectedOwner) return false;
            if (selectedDepartment !== ALL && String(a.departmentId ?? '') !== selectedDepartment) return false;
            if (!q) return true;
            const haystack = [a.actionName, a.assignedEmployeeName, a.ownerName, a.departmentName]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [enrichedActions, search, selectedStatus, selectedOwner, selectedDepartment]);

    const exportCsv = () => {
        const headers = [
            t('list.csvHeaderTitle'),
            t('list.csvHeaderAssignedTo'),
            t('list.csvHeaderOwner'),
            t('list.csvHeaderDepartment'),
            t('list.csvHeaderDeadline'),
            t('list.csvHeaderProgress'),
            t('list.csvHeaderStatus'),
        ];
        const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const lines = filteredData.map((row: any) =>
            [
                row.actionName ?? '',
                row.assignedEmployeeName ?? '',
                row.ownerName === '—' ? '' : row.ownerName,
                row.departmentName === '—' ? '' : row.departmentName,
                formatDateFr(row.deadline),
                Number(row.progress ?? 0),
                tState(row.status, adhocStatusConfig(row.status).label),
            ].map(escape).join(';')
        );
        const csv = '﻿' + [headers.map(escape).join(';'), ...lines].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `suggestions_amelioration_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        successNotification(t('list.exportedToast', { count: filteredData.length }));
    };

    // ─── Règles d'édition / mise à jour ──────────────────────────────────────

    const editRules = (action: any) => {
        const statusUpper = String(action?.status).toUpperCase();
        const progress = Number(action?.progress ?? 0);
        const canEdit = statusUpper === 'PENDING';
        const canUpdate = progress < 100 && !['COMPLETED', 'PENDING', 'CANCELLED'].includes(statusUpper);

        const editTooltip = canEdit
            ? t('list.editSuggestion')
            : statusUpper === 'COMPLETED' ? t('list.editTooltipCompleted')
            : statusUpper === 'CANCELLED' ? t('list.editTooltipCancelled')
            : t('list.editTooltipPendingOnly');

        const updateTooltip = canUpdate
            ? t('list.updateProgress')
            : statusUpper === 'PENDING' ? t('list.updateTooltipPending')
            : statusUpper === 'CANCELLED' ? t('list.updateTooltipCancelled')
            : t('list.updateTooltipClosed');

        return { canEdit, canUpdate, editTooltip, updateTooltip };
    };

    // ─── Rendus de colonnes ──────────────────────────────────────────────────

    const nameBody = (row: any) => (
        <div className="min-w-0 max-w-md">
            <button
                type="button"
                onClick={() => navigate(`adhocAction-details/${row.id}`)}
                className="text-[13px] text-slate-800 leading-snug text-left hover:text-teal-700 hover:underline"
            >
                {row.actionName}
            </button>
            {row.assignedEmployeeName && (
                <p className="text-[11.5px] text-slate-500 mt-0.5 truncate">{t('list.assignedTo')} {row.assignedEmployeeName}</p>
            )}
        </div>
    );

    const statusBody = (row: any) => {
        const cfg = adhocStatusConfig(row.status);
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {tState(row.status, cfg.label)}
            </span>
        );
    };

    const progressBody = (row: any) => {
        const p = Number(row?.progress ?? 0);
        return (
            <div className="flex items-center gap-2" style={{ minWidth: 110 }}>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}>
                    <div className={`h-full rounded-full ${progressBarClass(p)}`} style={{ width: `${p}%` }} />
                </div>
                <span className="text-[11.5px] text-slate-600 tabular-nums w-8 text-right">{p}%</span>
            </div>
        );
    };

    const actionsBody = (row: any) => {
        const { canEdit, canUpdate, editTooltip, updateTooltip } = editRules(row);
        return (
            <div className="flex gap-1.5 justify-center">
                <Tooltip label={t('list.viewDetail')} withArrow>
                    <ActionIcon
                        variant="light"
                        size="sm"
                        color="teal"
                        onClick={() => navigate(`adhocAction-details/${row.id}`)}
                        aria-label={t('list.viewDetail')}
                    >
                        <IconEye size={14} stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label={editTooltip} withArrow>
                    <span className="inline-flex">
                        <ActionIcon
                            onClick={() => canEdit && navigate(`edit/${row.id}`)}
                            variant="light"
                            size="sm"
                            color="blue"
                            disabled={!canEdit}
                            aria-label={t('list.editSuggestion')}
                        >
                            <IconEdit size={14} stroke={1.5} />
                        </ActionIcon>
                    </span>
                </Tooltip>
                <Tooltip label={updateTooltip} withArrow>
                    <span className="inline-flex">
                        <ActionIcon
                            onClick={() => canUpdate && navigate(`updateAdhocAction-details/${row.id}`)}
                            variant="light"
                            size="sm"
                            color="orange"
                            disabled={!canUpdate}
                            aria-label={t('list.updateProgress')}
                        >
                            <IconClock size={14} stroke={1.5} />
                        </ActionIcon>
                    </span>
                </Tooltip>
            </div>
        );
    };

    const hasActiveFilters =
        search.trim() !== '' || selectedStatus !== ALL || selectedOwner !== ALL || selectedDepartment !== ALL;

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: t('list.breadcrumbHome'), to: '/' },
                    { label: t('list.breadcrumbCorrective') },
                    { label: t('list.breadcrumbSuggestions') },
                ]}
                icon={<IconBolt size={22} stroke={2} />}
                iconColor="orange"
                title={t('list.title')}
                subtitle={t('list.subtitle')}
                actions={
                    <Button
                        size="sm"
                        onClick={() => navigate('create-adhocAction')}
                        leftSection={<IconPlus size={14} />}
                        color="orange"
                    >
                        {t('list.newSuggestion')}
                    </Button>
                }
            />

            {/* Barre de filtres */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                    <TextInput
                        placeholder={t('list.searchPlaceholder')}
                        leftSection={<IconSearch size={14} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        size="xs"
                        className="flex-1 min-w-[220px]"
                    />
                    <Select
                        data={[
                            { value: ALL, label: t('list.allStatuses') },
                            ...ADHOC_STATUS_OPTIONS.map((opt) => ({ value: opt.value, label: tState(opt.value, opt.label) })),
                        ]}
                        value={selectedStatus}
                        onChange={(v) => setSelectedStatus(v ?? ALL)}
                        size="xs"
                        w={140}
                        aria-label={t('list.filterByStatus')}
                    />
                    <Select
                        data={[{ value: ALL, label: t('list.allOwners') }, ...owners]}
                        value={selectedOwner}
                        onChange={(v) => setSelectedOwner(v ?? ALL)}
                        size="xs"
                        w={170}
                        searchable
                        aria-label={t('list.filterByOwner')}
                    />
                    <Select
                        data={[{ value: ALL, label: t('list.allDepartments') }, ...departments]}
                        value={selectedDepartment}
                        onChange={(v) => setSelectedDepartment(v ?? ALL)}
                        size="xs"
                        w={170}
                        aria-label={t('list.filterByDepartment')}
                    />
                    <div className="flex items-center gap-2 ml-auto">
                        <div className="flex items-center gap-0.5 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                            <Tooltip label={t('list.viewTable')} withArrow>
                                <ActionIcon
                                    variant={viewType === 'table' ? 'filled' : 'subtle'}
                                    color="teal"
                                    size="sm"
                                    onClick={() => setViewType('table')}
                                    aria-label={t('list.viewTable')}
                                >
                                    <IconLayoutList size={14} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label={t('list.viewCards')} withArrow>
                                <ActionIcon
                                    variant={viewType === 'card' ? 'filled' : 'subtle'}
                                    color="teal"
                                    size="sm"
                                    onClick={() => setViewType('card')}
                                    aria-label={t('list.viewCards')}
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
                            disabled={!filteredData.length}
                        >
                            {t('list.exportCsv')}
                        </Button>
                    </div>
                </div>
                <p className="text-[11.5px] text-slate-500 mt-2">
                    {loading
                        ? t('list.loading')
                        : t('list.shownCount', { count: filteredData.length, total: actions.length })}
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
                        icon={<IconBolt size={24} />}
                        title={hasActiveFilters ? t('list.emptyFilteredTitle') : t('list.emptyTitle')}
                        description={
                            hasActiveFilters
                                ? t('list.emptyFilteredDescription')
                                : t('list.emptyDescription')
                        }
                        compact
                        action={
                            hasActiveFilters ? (
                                <Button
                                    variant="default"
                                    size="xs"
                                    onClick={() => {
                                        setSearch('');
                                        setSelectedStatus(ALL);
                                        setSelectedOwner(ALL);
                                        setSelectedDepartment(ALL);
                                    }}
                                >
                                    {t('list.resetFilters')}
                                </Button>
                            ) : (
                                <Button size="xs" color="orange" leftSection={<IconPlus size={14} />} onClick={() => navigate('create-adhocAction')}>
                                    {t('list.newSuggestion')}
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
                        currentPageReportTemplate={t('list.currentPageReport')}
                    >
                        <Column header={t('list.colSuggestion')} body={nameBody} sortable sortField="actionName" />
                        <Column
                            header={t('list.colOwner')}
                            body={(row) => <span className="text-[12.5px] text-slate-600">{row.ownerName}</span>}
                            sortable
                            sortField="ownerName"
                            style={{ width: '11rem' }}
                        />
                        <Column
                            header={t('list.colDepartment')}
                            body={(row) => <span className="text-[12.5px] text-slate-600">{row.departmentName}</span>}
                            sortable
                            sortField="departmentName"
                            style={{ width: '10rem' }}
                        />
                        <Column
                            header={t('list.colDeadline')}
                            body={(row) => <span className="text-[12.5px] text-slate-600">{formatDateFr(row.deadline)}</span>}
                            sortable
                            sortField="deadline"
                            style={{ width: '8.5rem' }}
                        />
                        <Column header={t('list.colProgress')} body={progressBody} sortable sortField="progress" style={{ width: '10rem' }} />
                        <Column header={t('list.colStatus')} body={statusBody} sortable sortField="status" style={{ width: '8rem' }} />
                        <Column header={t('list.colActions')} body={actionsBody} headerStyle={{ width: '7.5rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} />
                    </DataTable>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-1">
                        {filteredData.map((action: any) => {
                            const { canEdit, canUpdate, editTooltip, updateTooltip } = editRules(action);
                            const cfg = adhocStatusConfig(action.status);
                            const p = Number(action.progress ?? 0);
                            return (
                                <div key={action.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col h-full">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3
                                            className="text-slate-800 leading-snug line-clamp-2"
                                            style={{
                                                fontFamily: "'Source Serif 4', Georgia, serif",
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                letterSpacing: '-0.01em',
                                            }}
                                        >
                                            {action.actionName}
                                        </h3>
                                        <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider flex-shrink-0 ${cfg.chip}`}>
                                            {tState(action.status, cfg.label)}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 text-[12.5px]">
                                        {action.assignedEmployeeName && (
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <IconUser size={13} className="text-slate-400 flex-shrink-0" aria-hidden="true" />
                                                <span className="text-slate-500">{t('list.assignedTo')}</span>
                                                <span className="text-slate-800">{action.assignedEmployeeName}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 text-slate-600">
                                            <IconCalendar size={13} className="text-slate-400 flex-shrink-0" aria-hidden="true" />
                                            <span className="text-slate-500">{t('list.deadline')}</span>
                                            <span className="text-slate-800">{formatDateFr(action.deadline)}</span>
                                        </div>
                                        {action.ownerName && action.ownerName !== '—' && (
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <IconUser size={13} className="text-slate-400 flex-shrink-0" aria-hidden="true" />
                                                <span className="text-slate-500">{t('list.owner')}</span>
                                                <span className="text-slate-800">{action.ownerName}</span>
                                            </div>
                                        )}
                                        {action.departmentName && action.departmentName !== '—' && (
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <IconBuilding size={13} className="text-slate-400 flex-shrink-0" aria-hidden="true" />
                                                <span className="text-slate-500">{t('list.department')}</span>
                                                <span className="text-slate-800">{action.departmentName}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11.5px] text-slate-500">{t('list.progress')}</span>
                                            <span className="text-[11.5px] text-slate-800 tabular-nums">{p}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}>
                                            <div className={`h-full rounded-full ${progressBarClass(p)}`} style={{ width: `${p}%` }} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-1.5 pt-3 mt-auto border-t border-slate-100">
                                        <Tooltip label={t('list.viewDetail')} withArrow>
                                            <ActionIcon
                                                variant="light"
                                                size="sm"
                                                color="teal"
                                                onClick={() => navigate(`adhocAction-details/${action.id}`)}
                                                aria-label={t('list.viewDetail')}
                                            >
                                                <IconEye size={14} stroke={1.5} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label={editTooltip} withArrow>
                                            <span className="inline-flex">
                                                <ActionIcon
                                                    variant="light"
                                                    size="sm"
                                                    color="blue"
                                                    disabled={!canEdit}
                                                    onClick={() => canEdit && navigate(`edit/${action.id}`)}
                                                    aria-label={t('list.editSuggestion')}
                                                >
                                                    <IconEdit size={14} stroke={1.5} />
                                                </ActionIcon>
                                            </span>
                                        </Tooltip>
                                        <Tooltip label={updateTooltip} withArrow>
                                            <span className="inline-flex">
                                                <ActionIcon
                                                    variant="light"
                                                    size="sm"
                                                    color="orange"
                                                    disabled={!canUpdate}
                                                    onClick={() => canUpdate && navigate(`updateAdhocAction-details/${action.id}`)}
                                                    aria-label={t('list.updateProgress')}
                                                >
                                                    <IconClock size={14} stroke={1.5} />
                                                </ActionIcon>
                                            </span>
                                        </Tooltip>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdhocActions;

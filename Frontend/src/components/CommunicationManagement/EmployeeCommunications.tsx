import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useState, useMemo, useEffect, MouseEvent, ReactNode } from 'react';
import { ActionIcon, Badge, Button, Select, TextInput, Tooltip } from '@mantine/core';
import {
    IconDownload,
    IconLayoutGrid,
    IconLayoutList,
    IconMessageCircle,
    IconPlayerPause,
    IconPlayerPlay,
    IconPlayerStop,
    IconPlus,
    IconSearch,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { modals } from '@mantine/modals';
import PageHeader from '../UtilityComp/PageHeader';
import EmptyState from '../UtilityComp/EmptyState';
import {
    getAllCommunications,
    resumeCommunicationSchedule,
    pauseCommunicationSchedule,
    cancelCommunicationSchedule,
} from '../../services/CommunicationService';
import { hideOverlay, showOverlay } from '../../slices/OverlaySlice';
import { getAllDepartments } from '../../services/HrmsService';
import { mapIdToName } from '../../utility/OtherUtilities';
import { successNotification, errorNotification } from '../../utility/NotificationUtility';
import CommunicationCard from './EmployeeCommunications/CommunicationCard';
import {
    CATEGORY_COLORS,
    CATEGORY_OPTIONS,
    TYPE_OPTIONS,
    categoryLabel,
    commStatusConfig,
    formatDateFr,
    parseRecipientIds,
    scheduleTypeLabel,
    typeLabel,
    urgencyConfig,
} from './communicationLabels';

/**
 * Registre des communications HSE : diffusion, planification et suivi des
 * messages sécurité envoyés aux employés. Vue tableau ou cartes, filtres,
 * export CSV et pilotage des planifications (reprendre / suspendre / annuler).
 */

const ALL = 'ALL';

type ScheduleAction = 'resume' | 'pause' | 'cancel';

const STATUS_BUCKETS: Record<string, string[]> = {
    ACTIVE: ['ACTIVE', 'SCHEDULED', 'PENDING', 'RUNNING'],
    PAUSED: ['PAUSED', 'ON_HOLD', 'HALTED'],
    COMPLETED: ['COMPLETED', 'FINISHED', 'DONE'],
    CANCELLED: ['CANCELLED', 'CANCELED'],
};

const normalizeCommunication = (comm: any) => {
    const recipientsList = parseRecipientIds(comm?.recipients);
    const schedule = comm?.schedule ?? {};

    return {
        ...comm,
        recipientsList,
        recipientCount: recipientsList.length,
        scheduleType: schedule?.scheduleType ?? comm?.scheduleType ?? null,
        status: comm?.status ?? schedule?.status ?? null,
        nextRunAt: schedule?.nextRunAt ?? comm?.nextRunAt ?? null,
        scheduledAt: schedule?.oneTimeAt ?? comm?.scheduledAt ?? comm?.createdAt,
        departmentName: comm?.department?.name ?? comm?.departmentName ?? null,
    };
};

const EmployeeCommunications = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { t } = useTranslation('communications');
    // Libellés bilingues : clés i18n `communications:*`, repli sur les libellés FR centralisés.
    const tType = (code?: string | null) => t(`type.${code ?? ''}`, { defaultValue: typeLabel(code) });
    const tCategory = (code?: string | null) => t(`category.${code ?? ''}`, { defaultValue: categoryLabel(code) });
    const tScheduleType = (code?: string | null) =>
        t(`scheduleType.${(code ?? '').toUpperCase()}`, { defaultValue: scheduleTypeLabel(code) });
    const tCommStatus = (status?: string | null) =>
        t(`commStatus.${(status ?? '').toUpperCase()}`, { defaultValue: commStatusConfig(status).label });
    const tUrgency = (urgency?: string | null) =>
        t(`urgency.${(urgency ?? '').toUpperCase()}`, { defaultValue: urgencyConfig(urgency).label });

    const [communications, setCommunications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [departmentMap, setDepartmentMap] = useState<Record<number, any>>({});
    const [departments, setDepartments] = useState<any[]>([]);
    const [viewType, setViewType] = useState<'table' | 'card'>('table');
    const [scheduleActionLoading, setScheduleActionLoading] = useState<Record<number, ScheduleAction>>({});

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>(ALL);
    const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
    const [departmentFilter, setDepartmentFilter] = useState<string>(ALL);
    const [statusFilter, setStatusFilter] = useState<string>(ALL);

    useEffect(() => {
        setLoading(true);
        getAllCommunications()
            .then((data) => {
                setCommunications((data || []).map((comm: any) => normalizeCommunication(comm)));
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || t('list.loadError'));
            })
            .finally(() => setLoading(false));

        getAllDepartments()
            .then((data) => {
                setDepartments(data ?? []);
                setDepartmentMap(mapIdToName(data ?? []));
            })
            .catch(() => {
                // les noms de départements resteront vides
            });
    }, []);

    const resolveDepartmentName = (comm: any) => {
        const key = comm?.departmentId !== undefined && comm?.departmentId !== null
            ? Number(comm.departmentId)
            : null;
        return (key !== null && !Number.isNaN(key) ? departmentMap[key]?.name : undefined)
            ?? comm?.departmentName
            ?? comm?.department?.name
            ?? (typeof comm?.department === 'string' ? comm.department : null)
            ?? '—';
    };

    // ─── Pilotage des planifications ─────────────────────────────────────────

    const handleScheduleAction = async (communication: any, action: ScheduleAction) => {
        const id = communication?.id;
        if (!id) return;

        const numericId = Number(id);
        setScheduleActionLoading((prev) => ({ ...prev, [numericId]: action }));
        dispatch(showOverlay());

        const successMessages: Record<ScheduleAction, string> = {
            resume: t('list.resumeScheduleSuccess'),
            pause: t('list.pauseScheduleSuccess'),
            cancel: t('list.cancelScheduleSuccess'),
        };

        try {
            let response;
            if (action === 'resume') {
                response = await resumeCommunicationSchedule(id);
            } else if (action === 'pause') {
                response = await pauseCommunicationSchedule(id);
            } else {
                response = await cancelCommunicationSchedule(id);
            }

            const normalized = normalizeCommunication(response);
            setCommunications((prev) => prev.map((comm) => (comm.id === normalized.id ? normalized : comm)));
            successNotification(successMessages[action]);
        } catch (error: any) {
            errorNotification(error?.response?.data?.message || t('list.scheduleUpdateError'));
        } finally {
            dispatch(hideOverlay());
            setScheduleActionLoading((prev) => {
                const updated = { ...prev };
                delete updated[numericId];
                return updated;
            });
        }
    };

    const getScheduleActionDisabled = (communication: any, action: ScheduleAction) => {
        const status = String(communication?.status ?? '').toUpperCase();
        const hasSchedule = Boolean(communication?.scheduleType);
        if (!hasSchedule) return true;

        if (action === 'resume') return !['PAUSED', 'CANCELLED'].includes(status);
        if (action === 'pause') return ['PAUSED', 'CANCELLED', 'COMPLETED'].includes(status);
        return ['CANCELLED', 'COMPLETED'].includes(status);
    };

    const renderScheduleActionButtons = (communication: any) => {
        const id = Number(communication?.id);
        const loadingAction = scheduleActionLoading[id];

        const actionMeta: Record<ScheduleAction, {
            label: string;
            color: string;
            icon: ReactNode;
            confirmation: string;
            confirmLabel: string;
        }> = {
            resume: {
                label: t('list.resumeLabel'),
                color: 'teal',
                icon: <IconPlayerPlay size={14} stroke={1.5} />,
                confirmation: t('list.resumeConfirmation'),
                confirmLabel: t('list.resumeConfirmLabel'),
            },
            pause: {
                label: t('list.pauseLabel'),
                color: 'orange',
                icon: <IconPlayerPause size={14} stroke={1.5} />,
                confirmation: t('list.pauseConfirmation'),
                confirmLabel: t('list.pauseConfirmLabel'),
            },
            cancel: {
                label: t('list.cancelLabel'),
                color: 'red',
                icon: <IconPlayerStop size={14} stroke={1.5} />,
                confirmation: t('list.cancelConfirmation'),
                confirmLabel: t('list.cancelConfirmLabel'),
            },
        };

        const openConfirmation = (event: MouseEvent<HTMLButtonElement>, action: ScheduleAction) => {
            event.preventDefault();
            event.stopPropagation();
            if (getScheduleActionDisabled(communication, action) || loadingAction) {
                return;
            }

            const meta = actionMeta[action];
            modals.openConfirmModal({
                title: <span className="text-base">{meta.label}</span>,
                centered: true,
                children: (
                    <span className="text-sm">
                        {t('list.confirmCommunicationPrefix')}<strong>{communication?.title}</strong>.
                        <br />
                        {meta.confirmation}
                    </span>
                ),
                labels: { confirm: meta.confirmLabel, cancel: t('list.confirmClose') },
                cancelProps: { color: 'gray', variant: 'default' },
                confirmProps: { color: meta.color },
                onConfirm: () => handleScheduleAction(communication, action),
            });
        };

        return (['resume', 'pause', 'cancel'] as const).map((action) => {
            const meta = actionMeta[action];
            const isDisabled = getScheduleActionDisabled(communication, action) || Boolean(loadingAction && loadingAction !== action);
            const isLoading = loadingAction === action;

            return (
                <Tooltip key={action} label={meta.label} withArrow>
                    <ActionIcon
                        color={meta.color}
                        variant="light"
                        size="sm"
                        disabled={isDisabled}
                        loading={isLoading}
                        onClick={(event) => openConfirmation(event, action)}
                        aria-label={meta.label}
                    >
                        {meta.icon}
                    </ActionIcon>
                </Tooltip>
            );
        });
    };

    // ─── Filtres et compteurs ────────────────────────────────────────────────

    const filteredCommunications = useMemo(() => {
        const q = search.trim().toLowerCase();
        return communications.filter((comm) => {
            if (typeFilter !== ALL && comm.type !== typeFilter) return false;
            if (categoryFilter !== ALL && comm.category !== categoryFilter) return false;
            if (departmentFilter !== ALL && String(comm.departmentId ?? '') !== departmentFilter) return false;
            if (statusFilter !== ALL) {
                const status = String(comm.status ?? '').toUpperCase();
                if (!STATUS_BUCKETS[statusFilter]?.includes(status)) return false;
            }
            if (!q) return true;
            const haystack = [comm.title, comm.content, comm.senderName, comm.sender]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [communications, search, typeFilter, categoryFilter, departmentFilter, statusFilter]);

    const exportCsv = () => {
        const headers = [
            t('list.csvHeaderTitle'), t('list.csvHeaderType'), t('list.csvHeaderCategory'), t('list.csvHeaderUrgency'),
            t('list.csvHeaderStatus'), t('list.csvHeaderDepartment'), t('list.csvHeaderRecipients'),
            t('list.csvHeaderSchedule'), t('list.csvHeaderNextRun'), t('list.csvHeaderDeadline'),
        ];
        const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const lines = filteredCommunications.map((comm) =>
            [
                comm.title,
                tType(comm.type),
                tCategory(comm.category),
                tUrgency(comm.urgency),
                tCommStatus(comm.status),
                resolveDepartmentName(comm) === '—' ? '' : resolveDepartmentName(comm),
                comm.recipientCount ?? 0,
                comm.scheduleType ? tScheduleType(comm.scheduleType) : '',
                comm.nextRunAt ? formatDateFr(comm.nextRunAt) : '',
                comm.expiresAt ? formatDateFr(comm.expiresAt) : '',
            ].map(escape).join(';')
        );
        const csv = '﻿' + [headers.map(escape).join(';'), ...lines].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `communications_hse_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        successNotification(t('list.exportSuccess', { count: filteredCommunications.length }));
    };

    // ─── Rendus de colonnes ──────────────────────────────────────────────────

    const titleBody = (comm: any) => (
        <div className="min-w-0 max-w-md">
            <button
                type="button"
                onClick={() => navigate(`communications-details/${comm.id}`)}
                className="text-[13px] text-slate-800 leading-snug text-left hover:text-teal-700 hover:underline"
            >
                {comm.title}
            </button>
            <p className="text-[11.5px] text-slate-500 mt-0.5">{tType(comm.type)}</p>
        </div>
    );

    const categoryBody = (comm: any) => (
        <Badge
            color={CATEGORY_COLORS[comm.category ?? ''] ?? 'gray'}
            variant="light"
            size="sm"
            radius="sm"
        >
            {tCategory(comm.category)}
        </Badge>
    );

    const urgencyBody = (comm: any) => {
        const cfg = urgencyConfig(comm.urgency);
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {tUrgency(comm.urgency)}
            </span>
        );
    };

    const statusBody = (comm: any) => {
        const cfg = commStatusConfig(comm.status);
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {tCommStatus(comm.status)}
            </span>
        );
    };

    const scheduleBody = (comm: any) => (
        <div className="min-w-0">
            <p className="text-[12.5px] text-slate-600">
                {comm.scheduleType ? tScheduleType(comm.scheduleType) : '—'}
            </p>
            {comm.nextRunAt && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                    {t('list.nextRun', { date: formatDateFr(comm.nextRunAt) })}
                </p>
            )}
        </div>
    );

    const actionsBody = (comm: any) => (
        <div className="flex gap-1.5 justify-center">{renderScheduleActionButtons(comm)}</div>
    );

    const hasActiveFilters =
        search.trim() !== '' ||
        typeFilter !== ALL ||
        categoryFilter !== ALL ||
        departmentFilter !== ALL ||
        statusFilter !== ALL;

    const resetFilters = () => {
        setSearch('');
        setTypeFilter(ALL);
        setCategoryFilter(ALL);
        setDepartmentFilter(ALL);
        setStatusFilter(ALL);
    };

    const emptyState = (
        <EmptyState
            icon={<IconSearch size={24} />}
            title={hasActiveFilters ? t('list.emptyFilteredTitle') : t('list.emptyTitle')}
            description={
                hasActiveFilters
                    ? t('list.emptyFilteredDescription')
                    : t('list.emptyDescription')
            }
            compact
            action={
                hasActiveFilters ? (
                    <Button variant="default" size="xs" onClick={resetFilters}>
                        {t('list.resetFilters')}
                    </Button>
                ) : (
                    <Button
                        size="xs"
                        color="teal"
                        leftSection={<IconPlus size={14} />}
                        onClick={() => navigate('create-communications')}
                    >
                        {t('list.newCommunication')}
                    </Button>
                )
            }
        />
    );

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: t('breadcrumbs.home'), to: '/' },
                    { label: t('breadcrumbs.module') },
                    { label: t('breadcrumbs.communications') },
                ]}
                icon={<IconMessageCircle size={22} stroke={2} />}
                iconColor="pink"
                title={t('list.title')}
                subtitle={t('list.subtitle')}
                actions={
                    <Button
                        size="sm"
                        color="teal"
                        leftSection={<IconPlus size={15} />}
                        onClick={() => navigate('create-communications')}
                    >
                        {t('list.newCommunication')}
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
                            { value: ALL, label: t('list.allTypes') },
                            ...TYPE_OPTIONS.map((o) => ({ value: o.value, label: tType(o.value) })),
                        ]}
                        value={typeFilter}
                        onChange={(v) => setTypeFilter(v ?? ALL)}
                        size="xs"
                        w={170}
                        aria-label={t('list.filterByType')}
                    />
                    <Select
                        data={[
                            { value: ALL, label: t('list.allCategories') },
                            ...CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: tCategory(o.value) })),
                        ]}
                        value={categoryFilter}
                        onChange={(v) => setCategoryFilter(v ?? ALL)}
                        size="xs"
                        w={155}
                        aria-label={t('list.filterByCategory')}
                    />
                    <Select
                        data={[
                            { value: ALL, label: t('list.allDepartments') },
                            ...departments.map((dep) => ({ value: String(dep.id), label: dep.name })),
                        ]}
                        value={departmentFilter}
                        onChange={(v) => setDepartmentFilter(v ?? ALL)}
                        size="xs"
                        w={165}
                        searchable
                        aria-label={t('list.filterByDepartment')}
                    />
                    <Select
                        data={[
                            { value: ALL, label: t('list.allStatuses') },
                            { value: 'ACTIVE', label: t('list.statusActive') },
                            { value: 'PAUSED', label: t('list.statusPaused') },
                            { value: 'COMPLETED', label: t('list.statusCompleted') },
                            { value: 'CANCELLED', label: t('list.statusCancelled') },
                        ]}
                        value={statusFilter}
                        onChange={(v) => setStatusFilter(v ?? ALL)}
                        size="xs"
                        w={135}
                        aria-label={t('list.filterByStatus')}
                    />
                    <div className="flex items-center gap-2 ml-auto">
                        <div className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 p-0.5">
                            <Tooltip label={t('list.tableView')} withArrow>
                                <ActionIcon
                                    variant={viewType === 'table' ? 'filled' : 'subtle'}
                                    color="teal"
                                    size="sm"
                                    onClick={() => setViewType('table')}
                                    aria-label={t('list.tableView')}
                                >
                                    <IconLayoutList size={14} stroke={1.5} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label={t('list.cardView')} withArrow>
                                <ActionIcon
                                    variant={viewType === 'card' ? 'filled' : 'subtle'}
                                    color="teal"
                                    size="sm"
                                    onClick={() => setViewType('card')}
                                    aria-label={t('list.cardView')}
                                >
                                    <IconLayoutGrid size={14} stroke={1.5} />
                                </ActionIcon>
                            </Tooltip>
                        </div>
                        <Button
                            variant="default"
                            size="xs"
                            leftSection={<IconDownload size={14} />}
                            onClick={exportCsv}
                            disabled={!filteredCommunications.length}
                        >
                            {t('list.exportCsv')}
                        </Button>
                    </div>
                </div>
                <p className="text-[11.5px] text-slate-500 mt-2">
                    {loading
                        ? t('list.loadingRegistry')
                        : t('list.displayedCount', { count: filteredCommunications.length, total: communications.length })}
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
                ) : !filteredCommunications.length ? (
                    emptyState
                ) : viewType === 'table' ? (
                    <DataTable
                        value={filteredCommunications}
                        size="small"
                        stripedRows
                        removableSort
                        paginator
                        rows={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        dataKey="id"
                        className="[&_.p-datatable-tbody]:!text-[13px] [&_.p-datatable-thead_th]:!text-[12px]"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate={t('list.paginatorReport')}
                    >
                        <Column header={t('list.colCommunication')} body={titleBody} sortable sortField="title" />
                        <Column header={t('list.colCategory')} body={categoryBody} sortable sortField="category" style={{ width: '8.5rem' }} />
                        <Column header={t('list.colUrgency')} body={urgencyBody} sortable sortField="urgency" style={{ width: '7rem' }} />
                        <Column header={t('list.colStatus')} body={statusBody} sortable sortField="status" style={{ width: '8rem' }} />
                        <Column
                            header={t('list.colDepartment')}
                            body={(comm: any) => (
                                <span className="text-[12.5px] text-slate-600">{resolveDepartmentName(comm)}</span>
                            )}
                            sortable
                            sortField="departmentId"
                            style={{ width: '9rem' }}
                        />
                        <Column
                            header={t('list.colRecipients')}
                            body={(comm: any) => (
                                <span className="text-[12.5px] text-slate-600 tabular-nums">{comm.recipientCount ?? 0}</span>
                            )}
                            sortable
                            sortField="recipientCount"
                            style={{ width: '7.5rem' }}
                            bodyStyle={{ textAlign: 'center' }}
                            headerStyle={{ textAlign: 'center' }}
                        />
                        <Column header={t('list.colSchedule')} body={scheduleBody} sortable sortField="nextRunAt" style={{ width: '11rem' }} />
                        <Column
                            header={t('list.colDeadline')}
                            body={(comm: any) => (
                                <span className="text-[12.5px] text-slate-600">{formatDateFr(comm.expiresAt)}</span>
                            )}
                            sortable
                            sortField="expiresAt"
                            style={{ width: '7.5rem' }}
                        />
                        <Column
                            header={t('list.colActions')}
                            body={actionsBody}
                            headerStyle={{ width: '7.5rem', textAlign: 'center' }}
                            bodyStyle={{ textAlign: 'center', overflow: 'visible' }}
                        />
                    </DataTable>
                ) : (
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 p-1">
                        {filteredCommunications.map((comm) => (
                            <CommunicationCard
                                key={comm.id ?? comm.title}
                                communication={comm}
                                departmentName={resolveDepartmentName(comm)}
                                actions={renderScheduleActionButtons(comm)}
                                onViewDetails={() => navigate(`communications-details/${comm.id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeCommunications;

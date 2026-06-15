import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActionIcon, Select, TextInput, Tooltip } from '@mantine/core';
import {
    IconBell,
    IconCircleCheck,
    IconEye,
    IconHourglassHigh,
    IconSearch,
    IconAlertTriangle,
} from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import PageHeader from '../UtilityComp/PageHeader';
import KpiTile from '../UtilityComp/KpiTile';
import EmptyState from '../UtilityComp/EmptyState';
import { getNotifications } from '../../services/NotificationService';
import { errorNotification } from '../../utility/NotificationUtility';
import { getAllDepartments } from '../../services/HrmsService';
import { mapIdToName } from '../../utility/OtherUtilities';
import {
    TYPE_OPTIONS,
    formatDateTimeFr,
    isNotifFailure,
    notifStatusConfig,
    parseRecipientIds,
    typeLabel,
    urgencyConfig,
} from './communicationLabels';

/**
 * Centre de notifications : suivi des envois générés par les communications
 * (statut de livraison, urgence, zone, département).
 */

type NotificationSummary = {
    id: number;
    communicationId: number | null;
    status: string;
    responseMessage?: string | null;
    createdAt: string;
    type?: string | null;
    recipients?: any;
    title?: string | null;
    departmentId?: number | null;
    urgency?: string | null;
    zoneId?: number | null;
    zoneName?: string | null;
    departmentName?: string;
};

const ALL = 'ALL';

const NotificationsManagement = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('communications');
    // Libellés bilingues : clés i18n `communications:*`, repli sur les libellés FR centralisés.
    const tType = (code?: string | null) => t(`type.${code ?? ''}`, { defaultValue: typeLabel(code) });
    const tNotifStatus = (status?: string | null) =>
        t(`notifStatus.${(status ?? '').toUpperCase()}`, { defaultValue: notifStatusConfig(status).label });
    const tUrgency = (urgency?: string | null) =>
        t(`urgency.${(urgency ?? '').toUpperCase()}`, { defaultValue: urgencyConfig(urgency).label });
    const [notificationsList, setNotificationsList] = useState<NotificationSummary[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [departmentMap, setDepartmentMap] = useState<Record<string, any>>({});

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>(ALL);
    const [statusFilter, setStatusFilter] = useState<string>(ALL);
    const [urgencyFilter, setUrgencyFilter] = useState<string>(ALL);
    const [zoneFilter, setZoneFilter] = useState<string>(ALL);
    const [departmentFilter, setDepartmentFilter] = useState<string>(ALL);

    useEffect(() => {
        setLoading(true);
        getNotifications()
            .then((response) => {
                setNotificationsList(response ?? []);
            })
            .catch((error: any) => {
                errorNotification(error?.response?.data?.errorMessage || t('notifications.loadError'));
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        getAllDepartments()
            .then((data) => {
                setDepartmentMap(mapIdToName(data));
            })
            .catch(() => {
                // non bloquant : les noms de départements resteront vides
            });
    }, []);

    const resolveDepartmentName = useCallback((departmentId?: number | null) => {
        if (departmentId === null || departmentId === undefined) return undefined;
        const department = departmentMap[String(departmentId)];
        return department?.name ?? department?.departmentName ?? undefined;
    }, [departmentMap]);

    const enrichedNotifications = useMemo<NotificationSummary[]>(() => {
        return notificationsList.map((notification) => {
            const departmentName = resolveDepartmentName(notification.departmentId);
            const hasDepartment = notification.departmentId !== null && notification.departmentId !== undefined;
            return {
                ...notification,
                departmentName: departmentName ?? (hasDepartment ? t('notifications.departmentFallback', { id: notification.departmentId }) : undefined),
            };
        });
    }, [notificationsList, resolveDepartmentName, t]);

    // ─── Options de filtres dérivées des données ─────────────────────────────

    const typeOptions = useMemo(() => {
        const values = Array.from(new Set(enrichedNotifications.map((item) => item.type).filter(Boolean)));
        const known = TYPE_OPTIONS.filter((opt) => values.includes(opt.value)).map((opt) => ({ value: opt.value, label: tType(opt.value) }));
        const unknown = values
            .filter((value) => !TYPE_OPTIONS.some((opt) => opt.value === value))
            .map((value) => ({ value: value!, label: tType(value) }));
        return [...known, ...unknown];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enrichedNotifications, t]);

    const statusOptions = useMemo(() => {
        const values = Array.from(new Set(enrichedNotifications.map((item) => item.status).filter(Boolean)));
        return values.map((value) => ({ value, label: tNotifStatus(value) }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enrichedNotifications, t]);

    const urgencyOptions = useMemo(() => {
        const values = Array.from(new Set(enrichedNotifications.map((item) => item.urgency).filter(Boolean)));
        return values.map((value) => ({ value: value!, label: tUrgency(value) }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enrichedNotifications, t]);

    const zoneOptions = useMemo(() => {
        const values = Array.from(new Set(enrichedNotifications.map((item) => item.zoneName).filter(Boolean)));
        return values.map((value) => ({ value: value!, label: value! }));
    }, [enrichedNotifications]);

    const departmentOptions = useMemo(() => {
        const values = Array.from(
            new Set(
                enrichedNotifications
                    .map((item) => item.departmentId)
                    .filter((id): id is number => typeof id === 'number')
            )
        );
        return values.map((value) => ({
            value: String(value),
            label: resolveDepartmentName(value) ?? t('notifications.departmentFallback', { id: value }),
        }));
    }, [enrichedNotifications, resolveDepartmentName, t]);

    const filteredNotifications = useMemo(() => {
        const q = search.trim().toLowerCase();
        const filtered = enrichedNotifications.filter((notification) => {
            if (typeFilter !== ALL && notification.type !== typeFilter) return false;
            if (statusFilter !== ALL && notification.status !== statusFilter) return false;
            if (urgencyFilter !== ALL && notification.urgency !== urgencyFilter) return false;
            if (zoneFilter !== ALL && notification.zoneName !== zoneFilter) return false;
            if (departmentFilter !== ALL && String(notification.departmentId ?? '') !== departmentFilter) return false;
            if (!q) return true;
            const haystack = [notification.title, notification.responseMessage, notification.zoneName]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        });

        return filtered.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
    }, [enrichedNotifications, search, typeFilter, statusFilter, urgencyFilter, zoneFilter, departmentFilter]);

    const counts = useMemo(() => {
        const deliveredStatuses = new Set(['SUCCESS', 'SENT', 'DELIVERED', 'COMPLETED']);
        const pendingStatuses = new Set(['PENDING', 'QUEUED', 'IN_PROGRESS', 'SENDING', 'SCHEDULED']);
        let delivered = 0;
        let pending = 0;
        let failed = 0;

        enrichedNotifications.forEach((notification) => {
            const status = (notification.status ?? '').toUpperCase();
            if (deliveredStatuses.has(status)) delivered += 1;
            else if (pendingStatuses.has(status)) pending += 1;
            else if (isNotifFailure(status)) failed += 1;
        });

        const total = enrichedNotifications.length;
        const successRate = total > 0 ? Math.round((delivered / total) * 100) : null;
        return { total, delivered, pending, failed, successRate };
    }, [enrichedNotifications]);

    // ─── Rendus de colonnes ──────────────────────────────────────────────────

    const resolveDescription = (rowData: NotificationSummary) => {
        if (isNotifFailure(rowData.status)) {
            return rowData.responseMessage || t('notifications.sendError');
        }
        return rowData.responseMessage || t('notifications.transmitted');
    };

    const titleBody = (rowData: NotificationSummary) => {
        const description = resolveDescription(rowData);
        const failure = isNotifFailure(rowData.status);
        return (
            <div className="min-w-0 max-w-md">
                {rowData.communicationId ? (
                    <Link
                        to={`/communications/communications-details/${rowData.communicationId}`}
                        className="text-[13px] text-slate-800 leading-snug hover:text-teal-700 hover:underline"
                    >
                        {rowData.title || t('notifications.notificationNumber', { id: rowData.id })}
                    </Link>
                ) : (
                    <p className="text-[13px] text-slate-800 leading-snug">
                        {rowData.title || t('notifications.notificationNumber', { id: rowData.id })}
                    </p>
                )}
                <p className={`text-[11.5px] mt-0.5 truncate ${failure ? 'text-rose-600' : 'text-slate-500'}`}>
                    {description}
                </p>
            </div>
        );
    };

    const statusBody = (rowData: NotificationSummary) => {
        const cfg = notifStatusConfig(rowData.status);
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {tNotifStatus(rowData.status)}
            </span>
        );
    };

    const urgencyBody = (rowData: NotificationSummary) => {
        const cfg = urgencyConfig(rowData.urgency);
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {tUrgency(rowData.urgency)}
            </span>
        );
    };

    const recipientsBody = (rowData: NotificationSummary) => {
        const recipients = parseRecipientIds(rowData.recipients);
        if (!recipients.length) return <span className="text-[12.5px] text-slate-500">—</span>;
        return <span className="text-[12.5px] text-slate-600 tabular-nums">{recipients.length}</span>;
    };

    const actionsBody = (rowData: NotificationSummary) => (
        <Tooltip label={t('notifications.viewNotification')} withArrow>
            <ActionIcon
                variant="light"
                size="sm"
                color="teal"
                onClick={() => navigate(`notifications-details/${rowData.id}`)}
                aria-label={t('notifications.viewNotification')}
            >
                <IconEye size={14} stroke={1.5} />
            </ActionIcon>
        </Tooltip>
    );

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: t('breadcrumbs.home'), to: '/' },
                    { label: t('breadcrumbs.module') },
                    { label: t('breadcrumbs.notificationsCenter') },
                ]}
                icon={<IconBell size={22} stroke={2} />}
                iconColor="pink"
                title={t('notifications.title')}
                subtitle={t('notifications.subtitle')}
            />

            {/* KPI des envois */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiTile
                    label={t('notifications.kpiTotal')}
                    value={loading ? '…' : counts.total}
                    tone="slate"
                    icon={<IconBell size={14} stroke={1.8} />}
                />
                <KpiTile
                    label={t('notifications.kpiSent')}
                    value={loading ? '…' : counts.delivered}
                    tone="green"
                    icon={<IconCircleCheck size={14} stroke={1.8} />}
                    referenceValue={counts.successRate !== null ? t('notifications.kpiSuccessRate', { rate: counts.successRate }) : undefined}
                />
                <KpiTile
                    label={t('notifications.kpiPending')}
                    value={loading ? '…' : counts.pending}
                    tone="violet"
                    icon={<IconHourglassHigh size={14} stroke={1.8} />}
                />
                <KpiTile
                    label={t('notifications.kpiFailed')}
                    value={loading ? '…' : counts.failed}
                    tone="rose"
                    icon={<IconAlertTriangle size={14} stroke={1.8} />}
                    referenceValue={counts.failed > 0 ? t('notifications.kpiFailedReferenceHas') : t('notifications.kpiFailedReferenceNone')}
                />
            </div>

            {/* Barre de filtres */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                    <TextInput
                        placeholder={t('notifications.searchPlaceholder')}
                        leftSection={<IconSearch size={14} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        size="xs"
                        className="flex-1 min-w-[200px]"
                    />
                    <Select
                        data={[{ value: ALL, label: t('notifications.allTypes') }, ...typeOptions]}
                        value={typeFilter}
                        onChange={(v) => setTypeFilter(v ?? ALL)}
                        size="xs"
                        w={165}
                        aria-label={t('notifications.filterByType')}
                    />
                    <Select
                        data={[{ value: ALL, label: t('notifications.allStatuses') }, ...statusOptions]}
                        value={statusFilter}
                        onChange={(v) => setStatusFilter(v ?? ALL)}
                        size="xs"
                        w={140}
                        aria-label={t('notifications.filterByStatus')}
                    />
                    <Select
                        data={[{ value: ALL, label: t('notifications.allUrgencies') }, ...urgencyOptions]}
                        value={urgencyFilter}
                        onChange={(v) => setUrgencyFilter(v ?? ALL)}
                        size="xs"
                        w={145}
                        aria-label={t('notifications.filterByUrgency')}
                    />
                    <Select
                        data={[{ value: ALL, label: t('notifications.allZones') }, ...zoneOptions]}
                        value={zoneFilter}
                        onChange={(v) => setZoneFilter(v ?? ALL)}
                        size="xs"
                        w={140}
                        searchable
                        aria-label={t('notifications.filterByZone')}
                    />
                    <Select
                        data={[{ value: ALL, label: t('notifications.allDepartments') }, ...departmentOptions]}
                        value={departmentFilter}
                        onChange={(v) => setDepartmentFilter(v ?? ALL)}
                        size="xs"
                        w={165}
                        searchable
                        aria-label={t('notifications.filterByDepartment')}
                    />
                </div>
                <p className="text-[11.5px] text-slate-500 mt-2">
                    {loading
                        ? t('notifications.loadingNotifications')
                        : t('notifications.displayedCount', { count: filteredNotifications.length, total: enrichedNotifications.length })}
                </p>
            </div>

            {/* Journal des envois */}
            <div className="bg-white rounded-xl border border-slate-200 p-2">
                {loading ? (
                    <div className="flex flex-col gap-2 p-2" aria-busy="true">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-11 rounded-lg bg-slate-100 animate-pulse" />
                        ))}
                    </div>
                ) : !filteredNotifications.length ? (
                    <EmptyState
                        icon={<IconBell size={24} />}
                        title={t('notifications.emptyTitle')}
                        description={t('notifications.emptyDescription')}
                        compact
                    />
                ) : (
                    <DataTable
                        value={filteredNotifications}
                        size="small"
                        stripedRows
                        removableSort
                        paginator
                        rows={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        dataKey="id"
                        className="[&_.p-datatable-tbody]:!text-[13px] [&_.p-datatable-thead_th]:!text-[12px]"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate={t('notifications.paginatorReport')}
                    >
                        <Column header={t('notifications.colNotification')} body={titleBody} sortable sortField="title" />
                        <Column
                            header={t('notifications.colType')}
                            body={(rowData: NotificationSummary) => (
                                <span className="text-[12.5px] text-slate-600">{tType(rowData.type)}</span>
                            )}
                            sortable
                            sortField="type"
                            style={{ width: '10rem' }}
                        />
                        <Column header={t('notifications.colStatus')} body={statusBody} sortable sortField="status" style={{ width: '8rem' }} />
                        <Column header={t('notifications.colUrgency')} body={urgencyBody} sortable sortField="urgency" style={{ width: '7rem' }} />
                        <Column
                            header={t('notifications.colRecipients')}
                            body={recipientsBody}
                            style={{ width: '7.5rem' }}
                            bodyStyle={{ textAlign: 'center' }}
                        />
                        <Column
                            header={t('notifications.colZone')}
                            body={(rowData: NotificationSummary) => (
                                <span className="text-[12.5px] text-slate-600">{rowData.zoneName || '—'}</span>
                            )}
                            sortable
                            sortField="zoneName"
                            style={{ width: '9rem' }}
                        />
                        <Column
                            header={t('notifications.colDepartment')}
                            body={(rowData: NotificationSummary) => (
                                <span className="text-[12.5px] text-slate-600">{rowData.departmentName || '—'}</span>
                            )}
                            sortable
                            sortField="departmentName"
                            style={{ width: '9.5rem' }}
                        />
                        <Column
                            header={t('notifications.colSentAt')}
                            body={(rowData: NotificationSummary) => (
                                <span className="text-[12.5px] text-slate-600">{formatDateTimeFr(rowData.createdAt)}</span>
                            )}
                            sortable
                            sortField="createdAt"
                            style={{ width: '10.5rem' }}
                        />
                        <Column
                            header={t('notifications.colActions')}
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

export default NotificationsManagement;

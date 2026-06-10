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
                errorNotification(error?.response?.data?.errorMessage || 'Échec du chargement des notifications');
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
                departmentName: departmentName ?? (hasDepartment ? `Département ${notification.departmentId}` : undefined),
            };
        });
    }, [notificationsList, resolveDepartmentName]);

    // ─── Options de filtres dérivées des données ─────────────────────────────

    const typeOptions = useMemo(() => {
        const values = Array.from(new Set(enrichedNotifications.map((item) => item.type).filter(Boolean)));
        const known = TYPE_OPTIONS.filter((opt) => values.includes(opt.value));
        const unknown = values
            .filter((value) => !TYPE_OPTIONS.some((opt) => opt.value === value))
            .map((value) => ({ value: value!, label: typeLabel(value) }));
        return [...known, ...unknown];
    }, [enrichedNotifications]);

    const statusOptions = useMemo(() => {
        const values = Array.from(new Set(enrichedNotifications.map((item) => item.status).filter(Boolean)));
        return values.map((value) => ({ value, label: notifStatusConfig(value).label }));
    }, [enrichedNotifications]);

    const urgencyOptions = useMemo(() => {
        const values = Array.from(new Set(enrichedNotifications.map((item) => item.urgency).filter(Boolean)));
        return values.map((value) => ({ value: value!, label: urgencyConfig(value).label }));
    }, [enrichedNotifications]);

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
            label: resolveDepartmentName(value) ?? `Département ${value}`,
        }));
    }, [enrichedNotifications, resolveDepartmentName]);

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
            return rowData.responseMessage || "Erreur lors de l'envoi du message.";
        }
        return rowData.responseMessage || 'Notification transmise.';
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
                        {rowData.title || `Notification n° ${rowData.id}`}
                    </Link>
                ) : (
                    <p className="text-[13px] text-slate-800 leading-snug">
                        {rowData.title || `Notification n° ${rowData.id}`}
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
                {cfg.label}
            </span>
        );
    };

    const urgencyBody = (rowData: NotificationSummary) => {
        const cfg = urgencyConfig(rowData.urgency);
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {cfg.label}
            </span>
        );
    };

    const recipientsBody = (rowData: NotificationSummary) => {
        const recipients = parseRecipientIds(rowData.recipients);
        if (!recipients.length) return <span className="text-[12.5px] text-slate-500">—</span>;
        return <span className="text-[12.5px] text-slate-600 tabular-nums">{recipients.length}</span>;
    };

    const actionsBody = (rowData: NotificationSummary) => (
        <Tooltip label="Consulter la notification" withArrow>
            <ActionIcon
                variant="light"
                size="sm"
                color="teal"
                onClick={() => navigate(`notifications-details/${rowData.id}`)}
                aria-label="Consulter la notification"
            >
                <IconEye size={14} stroke={1.5} />
            </ActionIcon>
        </Tooltip>
    );

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Communication Sécurité' },
                    { label: 'Centre de notifications' },
                ]}
                icon={<IconBell size={22} stroke={2} />}
                iconColor="pink"
                title="Centre de notifications"
                subtitle="Suivi des envois générés par les communications : livraison, urgence et destinataires"
            />

            {/* KPI des envois */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiTile
                    label="Total notifications"
                    value={loading ? '…' : counts.total}
                    tone="slate"
                    icon={<IconBell size={14} stroke={1.8} />}
                />
                <KpiTile
                    label="Envoyées"
                    value={loading ? '…' : counts.delivered}
                    tone="green"
                    icon={<IconCircleCheck size={14} stroke={1.8} />}
                    referenceValue={counts.successRate !== null ? `Taux de réussite : ${counts.successRate}%` : undefined}
                />
                <KpiTile
                    label="En attente"
                    value={loading ? '…' : counts.pending}
                    tone="violet"
                    icon={<IconHourglassHigh size={14} stroke={1.8} />}
                />
                <KpiTile
                    label="Échecs"
                    value={loading ? '…' : counts.failed}
                    tone="rose"
                    icon={<IconAlertTriangle size={14} stroke={1.8} />}
                    referenceValue={counts.failed > 0 ? 'Envois à relancer' : 'Aucun échec enregistré'}
                />
            </div>

            {/* Barre de filtres */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                    <TextInput
                        placeholder="Rechercher par titre, message ou zone…"
                        leftSection={<IconSearch size={14} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        size="xs"
                        className="flex-1 min-w-[200px]"
                    />
                    <Select
                        data={[{ value: ALL, label: 'Tous types' }, ...typeOptions]}
                        value={typeFilter}
                        onChange={(v) => setTypeFilter(v ?? ALL)}
                        size="xs"
                        w={165}
                        aria-label="Filtrer par type"
                    />
                    <Select
                        data={[{ value: ALL, label: 'Tous statuts' }, ...statusOptions]}
                        value={statusFilter}
                        onChange={(v) => setStatusFilter(v ?? ALL)}
                        size="xs"
                        w={140}
                        aria-label="Filtrer par statut"
                    />
                    <Select
                        data={[{ value: ALL, label: 'Toutes urgences' }, ...urgencyOptions]}
                        value={urgencyFilter}
                        onChange={(v) => setUrgencyFilter(v ?? ALL)}
                        size="xs"
                        w={145}
                        aria-label="Filtrer par urgence"
                    />
                    <Select
                        data={[{ value: ALL, label: 'Toutes zones' }, ...zoneOptions]}
                        value={zoneFilter}
                        onChange={(v) => setZoneFilter(v ?? ALL)}
                        size="xs"
                        w={140}
                        searchable
                        aria-label="Filtrer par zone"
                    />
                    <Select
                        data={[{ value: ALL, label: 'Tous départements' }, ...departmentOptions]}
                        value={departmentFilter}
                        onChange={(v) => setDepartmentFilter(v ?? ALL)}
                        size="xs"
                        w={165}
                        searchable
                        aria-label="Filtrer par département"
                    />
                </div>
                <p className="text-[11.5px] text-slate-500 mt-2">
                    {loading
                        ? 'Chargement des notifications…'
                        : `${filteredNotifications.length} notification${filteredNotifications.length > 1 ? 's' : ''} affichée${filteredNotifications.length > 1 ? 's' : ''} sur ${enrichedNotifications.length}`}
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
                        title="Aucune notification trouvée"
                        description="Aucun envoi ne correspond aux filtres sélectionnés. Les nouvelles notifications apparaîtront ici."
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
                        currentPageReportTemplate="{first}–{last} sur {totalRecords}"
                    >
                        <Column header="Notification" body={titleBody} sortable sortField="title" />
                        <Column
                            header="Type"
                            body={(rowData: NotificationSummary) => (
                                <span className="text-[12.5px] text-slate-600">{typeLabel(rowData.type)}</span>
                            )}
                            sortable
                            sortField="type"
                            style={{ width: '10rem' }}
                        />
                        <Column header="Statut" body={statusBody} sortable sortField="status" style={{ width: '8rem' }} />
                        <Column header="Urgence" body={urgencyBody} sortable sortField="urgency" style={{ width: '7rem' }} />
                        <Column
                            header="Destinataires"
                            body={recipientsBody}
                            style={{ width: '7.5rem' }}
                            bodyStyle={{ textAlign: 'center' }}
                        />
                        <Column
                            header="Zone"
                            body={(rowData: NotificationSummary) => (
                                <span className="text-[12.5px] text-slate-600">{rowData.zoneName || '—'}</span>
                            )}
                            sortable
                            sortField="zoneName"
                            style={{ width: '9rem' }}
                        />
                        <Column
                            header="Département"
                            body={(rowData: NotificationSummary) => (
                                <span className="text-[12.5px] text-slate-600">{rowData.departmentName || '—'}</span>
                            )}
                            sortable
                            sortField="departmentName"
                            style={{ width: '9.5rem' }}
                        />
                        <Column
                            header="Envoyée le"
                            body={(rowData: NotificationSummary) => (
                                <span className="text-[12.5px] text-slate-600">{formatDateTimeFr(rowData.createdAt)}</span>
                            )}
                            sortable
                            sortField="createdAt"
                            style={{ width: '10.5rem' }}
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

export default NotificationsManagement;

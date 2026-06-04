import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Card,
    Text,
    Select,
    Input,
    Tooltip,
} from '@mantine/core';
import { IconSearch, IconBell, IconCheck, IconAlertTriangle, IconBolt } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import PageHeader from '../UtilityComp/PageHeader';
import { SkeletonTable } from '../UtilityComp/LoadingSkeleton';
import EmptyState from '../UtilityComp/EmptyState';
import { Toolbar } from 'primereact/toolbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { getNotifications } from '../../services/NotificationService';
import { errorNotification } from '../../utility/NotificationUtility';
import { getAllDepartments } from '../../services/HrmsService';
import { mapIdToName } from '../../utility/OtherUtilities';
import StatusSummaryCards, { type StatusSummaryCardConfig } from './StatusSummaryCards';

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

const formatEnumValue = (value?: string | null) => {
    if (!value) return '-';
    return value
        .toString()
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};

const parseRecipients = (recipients: NotificationSummary['recipients']): string[] => {
    if (!recipients) return [];
    if (Array.isArray(recipients)) return recipients.map((item) => String(item));
    if (typeof recipients === 'string') {
        try {
            const parsed = JSON.parse(recipients);
            if (Array.isArray(parsed)) return parsed.map((item) => String(item));
        } catch (_err) {
            // value is not JSON, fall back to comma split
        }
        return recipients.split(',').map((item) => item.trim()).filter(Boolean);
    }
    if (typeof recipients === 'object') {
        return Object.values(recipients).map((item) => String(item));
    }
    return [String(recipients)];
};

const getStatusSeverity = (status: string) => {
    switch (status.toUpperCase()) {
        case 'SUCCESS':
        case 'SENT':
            return 'success';
        case 'FAILURE':
        case 'FAILED':
        case 'ERROR':
            return 'danger';
        case 'PENDING':
        case 'QUEUED':
        case 'IN_PROGRESS':
            return 'warning';
        default:
            return 'info';
    }
};

const getUrgencySeverity = (urgency?: string | null) => {
    switch ((urgency ?? '').toUpperCase()) {
        case 'URGENT':
        case 'HIGH':
            return 'danger';
        case 'MEDIUM':
            return 'warning';
        case 'LOW':
        case 'NORMAL':
            return 'info';
        default:
            return 'info';
    }
};

const NotificationsManagement = () => {
    const [notificationsList, setNotificationsList] = useState<NotificationSummary[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [selectedUrgency, setSelectedUrgency] = useState<string | null>(null);
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
    const [departmentMap, setDepartmentMap] = useState<Record<string, any>>({});

    useEffect(() => {
        setLoading(true);
        getNotifications()
            .then((response) => {
                setNotificationsList(response ?? []);
            })
            .catch((error: any) => {
                errorNotification(error?.response?.data?.errorMessage || 'Failed to load notifications.');
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        getAllDepartments()
            .then((data) => {
                setDepartmentMap(mapIdToName(data));
            })
            .catch((_err) => {
                // non critical; keep map empty
            });
    }, []);

    const statusOptions = useMemo(() => {
        const values = Array.from(new Set(notificationsList.map((item) => item.status).filter(Boolean)));
        return values.map((value) => ({ value, label: formatEnumValue(value) }));
    }, [notificationsList]);

    const typeOptions = useMemo(() => {
        const values = Array.from(new Set(notificationsList.map((item) => item.type).filter(Boolean)));
        return values.map((value) => ({ value: value!, label: formatEnumValue(value!) }));
    }, [notificationsList]);

    const urgencyOptions = useMemo(() => {
        const values = Array.from(new Set(notificationsList.map((item) => item.urgency).filter(Boolean)));
        return values.map((value) => ({ value: value!, label: formatEnumValue(value!) }));
    }, [notificationsList]);

    const zoneOptions = useMemo(() => {
        const values = Array.from(new Set(notificationsList.map((item) => item.zoneName).filter(Boolean)));
        return values.map((value) => ({ value: value!, label: value! }));
    }, [notificationsList]);

    const resolveDepartmentName = useCallback((departmentId?: number | null) => {
        if (departmentId === null || departmentId === undefined) return undefined;
        const key = String(departmentId);
        const department = departmentMap[key];
        return department?.name ?? department?.departmentName ?? undefined;
    }, [departmentMap]);

    const enrichedNotifications = useMemo<NotificationSummary[]>(() => {
        return notificationsList.map((notification) => {
            const departmentName = resolveDepartmentName(notification.departmentId);
            const hasDepartment = notification.departmentId !== null && notification.departmentId !== undefined;
            return {
                ...notification,
                departmentName: departmentName ?? (hasDepartment ? `Department ${notification.departmentId}` : undefined),
            };
        });
    }, [notificationsList, resolveDepartmentName]);

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
            label: resolveDepartmentName(value) ?? `Department ${value}`,
        }));
    }, [enrichedNotifications, resolveDepartmentName]);

    const filteredNotifications = useMemo(() => {
        let filtered = [...enrichedNotifications];

        if (searchTerm.trim()) {
            const term = searchTerm.trim().toLowerCase();
            filtered = filtered.filter((notification) => (
                (notification.title ?? '').toLowerCase().includes(term) ||
                (notification.responseMessage ?? '').toLowerCase().includes(term) ||
                (notification.type ?? '').toLowerCase().includes(term) ||
                (notification.zoneName ?? '').toLowerCase().includes(term)
            ));
        }

        if (selectedType) {
            filtered = filtered.filter((notification) => notification.type === selectedType);
        }

        if (selectedStatus) {
            filtered = filtered.filter((notification) => notification.status === selectedStatus);
        }

        if (selectedUrgency) {
            filtered = filtered.filter((notification) => notification.urgency === selectedUrgency);
        }

        if (selectedZone) {
            filtered = filtered.filter((notification) => notification.zoneName === selectedZone);
        }

        if (selectedDepartment) {
            filtered = filtered.filter((notification) => String(notification.departmentId ?? '') === selectedDepartment);
        }

        filtered.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        return filtered;
    }, [enrichedNotifications, searchTerm, selectedType, selectedStatus, selectedUrgency, selectedZone, selectedDepartment]);

    const summaryCards = useMemo<StatusSummaryCardConfig[]>(() => {
        const total = enrichedNotifications.length;
        const normalize = (status: any) => String(status ?? '').toUpperCase();
        const activeStatuses = new Set(['PENDING', 'QUEUED', 'IN_PROGRESS', 'SENDING', 'SCHEDULED']);
        const completedStatuses = new Set(['SUCCESS', 'SENT', 'DELIVERED', 'COMPLETED']);
        const pausedStatuses = new Set(['PAUSED', 'ON_HOLD', 'HALTED', 'CANCELLED', 'CANCELED', 'STOPPED', 'FAILED', 'FAILURE', 'ERROR']);

        let active = 0;
        let completed = 0;
        let paused = 0;
        let failed = 0;

        enrichedNotifications.forEach((notification) => {
            const status = normalize(notification.status);
            if (completedStatuses.has(status)) {
                completed += 1;
            } else if (pausedStatuses.has(status)) {
                paused += 1;
                if (status === 'FAILED' || status === 'FAILURE' || status === 'ERROR') {
                    failed += 1;
                }
            } else if (activeStatuses.has(status)) {
                active += 1;
            }
        });

        const formatCount = (value: number) => new Intl.NumberFormat('en-US').format(value);
        const percentageLabel = (count: number) => (
            total > 0 ? `${Math.round((count / total) * 100)}% of total` : 'Awaiting first record'
        );
        const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';
        const failedLabel = failed > 0 ? `${formatCount(failed)} failed deliveries` : 'No failures logged';

        return [
            {
                key: 'total',
                title: 'Total notifications',
                value: formatCount(total),
                icon: IconBell,
                color: 'blue',
                description: 'Every notification generated across communications.',
            },
            {
                key: 'active',
                title: 'Active',
                value: formatCount(active),
                icon: IconBolt,
                color: 'teal',
                description: 'Queued, pending or in-progress deliveries.',
                meta: { label: percentageLabel(active), color: 'teal' },
            },
            {
                key: 'completed',
                title: 'Completed',
                value: formatCount(completed),
                icon: IconCheck,
                color: 'indigo',
                description: 'Successfully delivered notifications.',
                meta: { label: `${successRate}% success rate`, color: 'indigo' },
            },
            {
                key: 'paused',
                title: 'Paused',
                value: formatCount(paused),
                icon: IconAlertTriangle,
                color: 'orange',
                description: 'Paused, cancelled or failed attempts.',
                meta: { label: failedLabel, color: failed > 0 ? 'red' : 'gray', variant: 'light' },
            },
        ] satisfies StatusSummaryCardConfig[];
    }, [enrichedNotifications]);

    const toolbarTemplate = () => (
        <div className="flex gap-2 items-center overflow-x-auto">
            <Select
                placeholder="Filtrer par type"
                data={typeOptions}
                value={selectedType}
                onChange={setSelectedType}
                clearable
                size="sm"
                className="min-w-[160px]"
            />
            <Select
                placeholder="Filtrer par statut"
                data={statusOptions}
                value={selectedStatus}
                onChange={setSelectedStatus}
                clearable
                size="sm"
                className="min-w-[160px]"
            />
            <Select
                placeholder="Filtrer par urgence"
                data={urgencyOptions}
                value={selectedUrgency}
                onChange={setSelectedUrgency}
                clearable
                size="sm"
                className="min-w-[160px]"
            />
            <Select
                placeholder="Filtrer par zone"
                data={zoneOptions}
                value={selectedZone}
                onChange={setSelectedZone}
                clearable
                size="sm"
                className="min-w-[160px]"
            />
            <Select
                placeholder="Filtrer par département"
                data={departmentOptions}
                value={selectedDepartment}
                onChange={setSelectedDepartment}
                clearable
                size="sm"
                className="min-w-[180px]"
            />
            <Input
                leftSection={<IconSearch size={16} />}
                placeholder="Rechercher des notifications..."
                type="search"
                size="sm"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.currentTarget.value)}
                className="min-w-[200px]"
            />
        </div>
    );

    const resolveDescription = (rowData: NotificationSummary) => {
        const upperStatus = rowData.status?.toUpperCase?.() ?? '';
        if (['FAILED', 'FAILURE', 'ERROR'].includes(upperStatus)) {
            return 'Error sending message.';
        }
        return rowData.responseMessage || 'Notification sent successfully.';
    };

    const titleTemplate = (rowData: NotificationSummary) => {
        const description = resolveDescription(rowData);
        const isFailure = ['FAILED', 'FAILURE', 'ERROR'].includes((rowData.status ?? '').toUpperCase());
        return (
            <div className="flex flex-col gap-1">
                <Text
                    component={Link}
                    to={`/communications/communications-details/${rowData.communicationId ?? rowData.id}`}
                    size="sm"
                    c="blue"
                    className="hover:underline"
                >
                    {rowData.title || `Notification #${rowData.id}`}
                </Text>
                {description && (
                    <Tooltip label={description} withArrow position="top-start">
                        <Text size="xs" c={isFailure ? 'red' : 'dimmed'} lineClamp={1}>
                            {description}
                        </Text>
                    </Tooltip>
                )}
            </div>
        );
    };

    const statusTemplate = (rowData: NotificationSummary) => (
        <Tag
            value={formatEnumValue(rowData.status)}
            severity={getStatusSeverity(rowData.status)}
            className="text-xs px-2 py-1 rounded-full"
        />
    );

    const urgencyTemplate = (rowData: NotificationSummary) => (
        <Tag
            value={formatEnumValue(rowData.urgency)}
            severity={getUrgencySeverity(rowData.urgency)}
            className="text-xs px-2 py-1 rounded-full"
        />
    );

    const recipientsTemplate = (rowData: NotificationSummary) => {
        const recipients = parseRecipients(rowData.recipients);
        if (!recipients.length) return <Text size="sm">-</Text>;
        return (
            <Tooltip label={recipients.join(', ')} withArrow position="top">
                <Text size="sm" className="cursor-help">
                    {recipients.length}
                </Text>
            </Tooltip>
        );
    };

    const zoneTemplate = (rowData: NotificationSummary) => (
        <Text size="sm">{rowData.zoneName || '-'}</Text>
    );

    const departmentTemplate = (rowData: NotificationSummary) => {
        if (rowData.departmentId === null || rowData.departmentId === undefined) return <Text size="sm">-</Text>;
        const deptName = rowData.departmentName ?? resolveDepartmentName(rowData.departmentId);
        if (!deptName) return <Text size="sm">-</Text>;
        return <Text size="sm">{deptName}</Text>;
    };

    const dateTemplate = (rowData: NotificationSummary) => (
        <Text size="sm">
            {rowData.createdAt
                ? new Date(rowData.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                })
                : '-'}
        </Text>
    );

    return (
        <div className="p-5 space-y-5 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Communication Sécurité' },
                    { label: 'Centre de notifications' },
                ]}
                icon={<IconBell size={22} stroke={2} />}
                iconColor="pink"
                title="Centre de notifications"
                subtitle="Gestion et suivi de toutes les notifications de communication dans l'organisation"
            />

            <StatusSummaryCards cards={summaryCards} />

            <Card shadow="sm" padding="md" radius="md" withBorder>
                <Toolbar className="mb-3 !p-2" left={toolbarTemplate}></Toolbar>
                {loading ? (
                    /* LOT 41 E: SkeletonTable pendant le chargement */
                    <SkeletonTable rows={6} cols={7} />
                ) : (
                    <DataTable
                        value={filteredNotifications}
                        size="small"
                        stripedRows
                        paginator
                        rows={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        responsiveLayout="scroll"
                        className="[&_.p-datatable-tbody]:!text-sm"
                        /* LOT 41 E: EmptyState unifié dans la DataTable */
                        emptyMessage={
                            <EmptyState
                                icon={<IconBell size={28} />}
                                title="Aucune notification trouvée"
                                description="Aucune notification ne correspond aux filtres sélectionnés."
                                iconColor="slate"
                                compact
                            />
                        }
                    >
                        <Column style={{ fontWeight: 'normal', fontSize: '14px', maxWidth: '360px' }} header="Notification" body={titleTemplate} />
                        <Column style={{ fontWeight: 'normal', fontSize: '14px' }} header="Type" body={(rowData: NotificationSummary) => <Text size="sm">{formatEnumValue(rowData.type)}</Text>} />
                        <Column style={{ fontWeight: 'normal', fontSize: '14px' }} header="Status" body={statusTemplate} />
                        <Column style={{ fontWeight: 'normal', fontSize: '14px' }} header="Urgency" body={urgencyTemplate} />
                        <Column style={{ fontWeight: 'normal', fontSize: '14px' }} header="Recipients" body={recipientsTemplate} />
                        <Column style={{ fontWeight: 'normal', fontSize: '14px' }} header="Zone" body={zoneTemplate} />
                        <Column style={{ fontWeight: 'normal', fontSize: '14px' }} header="Department" body={departmentTemplate} />
                        <Column style={{ fontWeight: 'normal', fontSize: '14px' }} header="Sent At" body={dateTemplate} />
                    </DataTable>
                )}
            </Card>
        </div>
    );
};

export default NotificationsManagement;

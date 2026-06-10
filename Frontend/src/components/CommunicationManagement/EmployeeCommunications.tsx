import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useState, useMemo, useEffect, MouseEvent, ReactNode } from 'react';
import { ActionIcon, Badge, Button, Select, TextInput, Tooltip } from '@mantine/core';
import {
    IconCircleCheck,
    IconDownload,
    IconLayoutGrid,
    IconLayoutList,
    IconMessageCircle,
    IconPlayerPause,
    IconPlayerPlay,
    IconPlayerStop,
    IconPlus,
    IconSearch,
    IconSend,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { modals } from '@mantine/modals';
import PageHeader from '../UtilityComp/PageHeader';
import KpiTile from '../UtilityComp/KpiTile';
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
                errorNotification(err.response?.data?.errorMessage || 'Échec du chargement des communications');
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
            resume: 'Planification reprise',
            pause: 'Planification suspendue',
            cancel: 'Planification annulée',
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
            errorNotification(error?.response?.data?.message || 'La mise à jour de la planification a échoué');
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
                label: 'Reprendre la planification',
                color: 'teal',
                icon: <IconPlayerPlay size={14} stroke={1.5} />,
                confirmation: 'La planification reprendra et la prochaine exécution sera recalculée. Continuer ?',
                confirmLabel: 'Reprendre',
            },
            pause: {
                label: 'Suspendre la planification',
                color: 'orange',
                icon: <IconPlayerPause size={14} stroke={1.5} />,
                confirmation: "Les envois seront suspendus jusqu'à la reprise de la planification. Continuer ?",
                confirmLabel: 'Suspendre',
            },
            cancel: {
                label: 'Annuler la planification',
                color: 'red',
                icon: <IconPlayerStop size={14} stroke={1.5} />,
                confirmation: 'La planification sera annulée définitivement. Il faudra en créer une nouvelle pour reprendre les envois. Confirmer ?',
                confirmLabel: 'Annuler la planification',
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
                        Communication : <strong>{communication?.title}</strong>.
                        <br />
                        {meta.confirmation}
                    </span>
                ),
                labels: { confirm: meta.confirmLabel, cancel: 'Fermer' },
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

    const counts = useMemo(() => {
        const inBucket = (comm: any, bucket: string) =>
            STATUS_BUCKETS[bucket].includes(String(comm?.status ?? '').toUpperCase());
        return {
            total: communications.length,
            active: communications.filter((c) => inBucket(c, 'ACTIVE')).length,
            completed: communications.filter((c) => inBucket(c, 'COMPLETED')).length,
            paused: communications.filter((c) => inBucket(c, 'PAUSED') || inBucket(c, 'CANCELLED')).length,
        };
    }, [communications]);

    const exportCsv = () => {
        const headers = [
            'Titre', 'Type', 'Catégorie', 'Urgence', 'Statut', 'Département',
            'Destinataires', 'Planification', 'Prochaine exécution', 'Échéance',
        ];
        const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const lines = filteredCommunications.map((comm) =>
            [
                comm.title,
                typeLabel(comm.type),
                categoryLabel(comm.category),
                urgencyConfig(comm.urgency).label,
                commStatusConfig(comm.status).label,
                resolveDepartmentName(comm) === '—' ? '' : resolveDepartmentName(comm),
                comm.recipientCount ?? 0,
                comm.scheduleType ? scheduleTypeLabel(comm.scheduleType) : '',
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
        successNotification(`${filteredCommunications.length} communication${filteredCommunications.length > 1 ? 's' : ''} exportée${filteredCommunications.length > 1 ? 's' : ''}`);
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
            <p className="text-[11.5px] text-slate-500 mt-0.5">{typeLabel(comm.type)}</p>
        </div>
    );

    const categoryBody = (comm: any) => (
        <Badge
            color={CATEGORY_COLORS[comm.category ?? ''] ?? 'gray'}
            variant="light"
            size="sm"
            radius="sm"
        >
            {categoryLabel(comm.category)}
        </Badge>
    );

    const urgencyBody = (comm: any) => {
        const cfg = urgencyConfig(comm.urgency);
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {cfg.label}
            </span>
        );
    };

    const statusBody = (comm: any) => {
        const cfg = commStatusConfig(comm.status);
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {cfg.label}
            </span>
        );
    };

    const scheduleBody = (comm: any) => (
        <div className="min-w-0">
            <p className="text-[12.5px] text-slate-600">
                {comm.scheduleType ? scheduleTypeLabel(comm.scheduleType) : '—'}
            </p>
            {comm.nextRunAt && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                    Prochain envoi : {formatDateFr(comm.nextRunAt)}
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
            title={hasActiveFilters ? 'Aucune communication ne correspond aux filtres' : 'Aucune communication enregistrée'}
            description={
                hasActiveFilters
                    ? 'Élargissez la recherche ou réinitialisez les filtres pour retrouver le registre complet.'
                    : 'Créez la première communication sécurité à diffuser aux équipes.'
            }
            compact
            action={
                hasActiveFilters ? (
                    <Button variant="default" size="xs" onClick={resetFilters}>
                        Réinitialiser les filtres
                    </Button>
                ) : (
                    <Button
                        size="xs"
                        color="teal"
                        leftSection={<IconPlus size={14} />}
                        onClick={() => navigate('create-communications')}
                    >
                        Nouvelle communication
                    </Button>
                )
            }
        />
    );

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Communication Sécurité' },
                    { label: 'Communications HSE' },
                ]}
                icon={<IconMessageCircle size={22} stroke={2} />}
                iconColor="pink"
                title="Communications HSE"
                subtitle="Diffusion et suivi des communications sécurité envoyées aux employés"
                actions={
                    <Button
                        size="sm"
                        color="teal"
                        leftSection={<IconPlus size={15} />}
                        onClick={() => navigate('create-communications')}
                    >
                        Nouvelle communication
                    </Button>
                }
            />

            {/* KPI du registre */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiTile
                    label="Total communications"
                    value={loading ? '…' : counts.total}
                    tone="slate"
                    icon={<IconMessageCircle size={14} stroke={1.8} />}
                />
                <KpiTile
                    label="Actives"
                    value={loading ? '…' : counts.active}
                    tone="green"
                    icon={<IconSend size={14} stroke={1.8} />}
                    referenceValue="Planifiées ou en diffusion"
                />
                <KpiTile
                    label="Terminées"
                    value={loading ? '…' : counts.completed}
                    tone="teal"
                    icon={<IconCircleCheck size={14} stroke={1.8} />}
                />
                <KpiTile
                    label="Suspendues / annulées"
                    value={loading ? '…' : counts.paused}
                    tone="amber"
                    icon={<IconPlayerPause size={14} stroke={1.8} />}
                    referenceValue="En attente d'une décision"
                />
            </div>

            {/* Barre de filtres */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                    <TextInput
                        placeholder="Rechercher par titre, contenu ou expéditeur…"
                        leftSection={<IconSearch size={14} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        size="xs"
                        className="flex-1 min-w-[220px]"
                    />
                    <Select
                        data={[{ value: ALL, label: 'Tous types' }, ...TYPE_OPTIONS]}
                        value={typeFilter}
                        onChange={(v) => setTypeFilter(v ?? ALL)}
                        size="xs"
                        w={170}
                        aria-label="Filtrer par type"
                    />
                    <Select
                        data={[{ value: ALL, label: 'Toutes catégories' }, ...CATEGORY_OPTIONS]}
                        value={categoryFilter}
                        onChange={(v) => setCategoryFilter(v ?? ALL)}
                        size="xs"
                        w={155}
                        aria-label="Filtrer par catégorie"
                    />
                    <Select
                        data={[
                            { value: ALL, label: 'Tous départements' },
                            ...departments.map((dep) => ({ value: String(dep.id), label: dep.name })),
                        ]}
                        value={departmentFilter}
                        onChange={(v) => setDepartmentFilter(v ?? ALL)}
                        size="xs"
                        w={165}
                        searchable
                        aria-label="Filtrer par département"
                    />
                    <Select
                        data={[
                            { value: ALL, label: 'Tous statuts' },
                            { value: 'ACTIVE', label: 'Actives' },
                            { value: 'PAUSED', label: 'En pause' },
                            { value: 'COMPLETED', label: 'Terminées' },
                            { value: 'CANCELLED', label: 'Annulées' },
                        ]}
                        value={statusFilter}
                        onChange={(v) => setStatusFilter(v ?? ALL)}
                        size="xs"
                        w={135}
                        aria-label="Filtrer par statut"
                    />
                    <div className="flex items-center gap-2 ml-auto">
                        <div className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 p-0.5">
                            <Tooltip label="Vue tableau" withArrow>
                                <ActionIcon
                                    variant={viewType === 'table' ? 'filled' : 'subtle'}
                                    color="teal"
                                    size="sm"
                                    onClick={() => setViewType('table')}
                                    aria-label="Vue tableau"
                                >
                                    <IconLayoutList size={14} stroke={1.5} />
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
                            Exporter CSV
                        </Button>
                    </div>
                </div>
                <p className="text-[11.5px] text-slate-500 mt-2">
                    {loading
                        ? 'Chargement du registre…'
                        : `${filteredCommunications.length} communication${filteredCommunications.length > 1 ? 's' : ''} affichée${filteredCommunications.length > 1 ? 's' : ''} sur ${communications.length}`}
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
                        currentPageReportTemplate="{first}–{last} sur {totalRecords}"
                    >
                        <Column header="Communication" body={titleBody} sortable sortField="title" />
                        <Column header="Catégorie" body={categoryBody} sortable sortField="category" style={{ width: '8.5rem' }} />
                        <Column header="Urgence" body={urgencyBody} sortable sortField="urgency" style={{ width: '7rem' }} />
                        <Column header="Statut" body={statusBody} sortable sortField="status" style={{ width: '8rem' }} />
                        <Column
                            header="Département"
                            body={(comm: any) => (
                                <span className="text-[12.5px] text-slate-600">{resolveDepartmentName(comm)}</span>
                            )}
                            sortable
                            sortField="departmentId"
                            style={{ width: '9rem' }}
                        />
                        <Column
                            header="Destinataires"
                            body={(comm: any) => (
                                <span className="text-[12.5px] text-slate-600 tabular-nums">{comm.recipientCount ?? 0}</span>
                            )}
                            sortable
                            sortField="recipientCount"
                            style={{ width: '7.5rem' }}
                            bodyStyle={{ textAlign: 'center' }}
                            headerStyle={{ textAlign: 'center' }}
                        />
                        <Column header="Planification" body={scheduleBody} sortable sortField="nextRunAt" style={{ width: '11rem' }} />
                        <Column
                            header="Échéance"
                            body={(comm: any) => (
                                <span className="text-[12.5px] text-slate-600">{formatDateFr(comm.expiresAt)}</span>
                            )}
                            sortable
                            sortField="expiresAt"
                            style={{ width: '7.5rem' }}
                        />
                        <Column
                            header="Actions"
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

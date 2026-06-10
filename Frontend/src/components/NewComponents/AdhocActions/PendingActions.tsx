import { useEffect, useMemo, useState } from 'react';
import {
    IconAlertTriangle,
    IconBook,
    IconBuilding,
    IconCalendar,
    IconCalendarDue,
    IconChevronDown,
    IconChevronRight,
    IconCircleCheck,
    IconClock,
    IconFileText,
    IconHelmet,
    IconSearch,
    IconShield,
    IconTarget,
    IconUser,
    IconX,
} from '@tabler/icons-react';
import { Button, Select, TextInput } from '@mantine/core';
import { modals } from '@mantine/modals';
import PageHeader from '../../UtilityComp/PageHeader';
import KpiTile from '../../UtilityComp/KpiTile';
import SafeHtml from '../../UtilityComp/SafeHtml';
import EmptyState from '../../UtilityComp/EmptyState';
import {
    approveCorrectiveAction,
    cancelCorrectiveAction,
    getCorrectiveActionDescription,
    getCorrectiveActionsByDepartmentId,
    getAllPending,
} from '../../../services/CorrectiveActionService';
import { getTeamMemberByEmployeeId } from '../../../services/TeamMemberService';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';
import { useDispatch, useSelector } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { getAllDepartments } from '../../../services/HrmsService';
import { getEmployeeDropdown } from '../../../services/EmployeeService';
import { mapIdToName } from '../../../utility/OtherUtilities';
import { formatDateFr, pendingStateConfig, sourceTypeLabel } from './adhocLabels';

/**
 * File des actions en attente d'approbation : synthèse, filtres et revue
 * action par action (approbation ou annulation motivée par le responsable).
 */

interface PendingAction {
    id: string;
    title: string;
    description: string;
    type: string;
    status: 'pending' | 'overdue' | 'urgent';
    assignedBy: string;
    ownerId?: number | null;
    departmentId?: number | null;
    ownerName?: string;
    departmentName?: string;
    /** Date brute ISO renvoyée par le backend (sert aux calculs d'échéance). */
    dueDateRaw: string;
    createdDateRaw: string;
    relatedId: string;
    details: {
        actionProgress?: number;
    };
}

const ALL = 'all';

const typeIconMap: Record<string, { icon: typeof IconHelmet; iconColor: string }> = {
    PPE_APPROVAL: { icon: IconHelmet, iconColor: 'text-blue-600' },
    RISK_ASSESSMENT: { icon: IconShield, iconColor: 'text-orange-600' },
    DOCUMENT_APPROVAL: { icon: IconFileText, iconColor: 'text-green-600' },
    INCIDENT_INVESTIGATION: { icon: IconAlertTriangle, iconColor: 'text-red-600' },
    ACTION_ASSIGNMENT: { icon: IconTarget, iconColor: 'text-purple-600' },
    AUDIT_REVIEW: { icon: IconCircleCheck, iconColor: 'text-indigo-600' },
    TRAINING_APPROVAL: { icon: IconBook, iconColor: 'text-cyan-600' },
    GENERAL_INSPECTION: { icon: IconSearch, iconColor: 'text-teal-600' },
};

/** Résumé texte d'une description potentiellement riche (HTML). */
const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const PendingActions = () => {
    const [actions, setActions] = useState<PendingAction[]>([]);
    const [deptMap, setDeptMap] = useState<Record<number, any>>({});
    const [empMap, setEmpMap] = useState<Record<number, any>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>(ALL);
    const [statusFilter, setStatusFilter] = useState<string>(ALL);
    const dispatch = useDispatch();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [descMap, setDescMap] = useState<Record<string, { loading: boolean; value?: string; error?: string }>>({});
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const user = useSelector((state: any) => state.user);

    const normalizeType = (value: string) => value?.toString?.().trim().toUpperCase().replace(/[\s-]+/g, '_') ?? '';

    const availableTypes = useMemo(() => {
        const set = new Set<string>();
        actions.forEach((action) => {
            const normalized = normalizeType(action.type);
            if (normalized) {
                set.add(normalized);
            }
        });
        if (typeFilter !== ALL) {
            set.add(typeFilter);
        }
        return Array.from(set).sort();
    }, [actions, typeFilter]);

    const getTypeConfig = (type: string) => {
        const normalized = normalizeType(type);
        const iconCfg = typeIconMap[normalized];
        return {
            normalized,
            icon: iconCfg?.icon ?? IconFileText,
            iconColor: iconCfg?.iconColor ?? 'text-slate-500',
            label: sourceTypeLabel(type),
        };
    };

    const isOverdue = (dueDateRaw: string) => {
        if (!dueDateRaw) return false;
        const due = new Date(dueDateRaw);
        if (Number.isNaN(due.getTime())) return false;
        return due.getTime() < Date.now();
    };

    const getDaysUntilDue = (dueDateRaw: string) => {
        const today = new Date();
        const due = new Date(dueDateRaw);
        if (Number.isNaN(due.getTime())) return 0;
        const diffTime = due.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const executeApprove = async (action: PendingAction) => {
        setHighlightedId(action.id);
        dispatch(showOverlay());
        try {
            await approveCorrectiveAction(action.id);
            successNotification(`Action « ${action.title || 'sans titre'} » approuvée`);
            setActions(prev => prev.filter(a => a.id !== action.id));
            setHighlightedId(null);
        } catch (e: any) {
            errorNotification(e?.response?.data?.errorMessage || "L'approbation a échoué");
        }
        dispatch(hideOverlay());
    };

    const executeCancel = async (action: PendingAction) => {
        setHighlightedId(action.id);
        dispatch(showOverlay());
        try {
            await cancelCorrectiveAction(action.id);
            successNotification(`Action « ${action.title || 'sans titre'} » annulée`);
            setActions(prev => prev.filter(a => a.id !== action.id));
            setHighlightedId(null);
        } catch (e: any) {
            errorNotification(e?.response?.data?.errorMessage || "L'annulation a échoué");
        }
        dispatch(hideOverlay());
    };

    const handleApprove = (action: PendingAction) => {
        setHighlightedId(action.id);
        modals.openConfirmModal({
            title: <span className="text-base">Approuver cette action ?</span>,
            centered: true,
            children: (
                <span className="text-sm text-slate-700">
                    Confirmer l'approbation de <strong>{action.title}</strong> ? Elle passera en cours de réalisation.
                </span>
            ),
            labels: { confirm: 'Approuver', cancel: 'Annuler' },
            confirmProps: { color: 'teal' },
            cancelProps: { color: 'gray', variant: 'default' },
            withCloseButton: false,
            closeOnClickOutside: false,
            onCancel: () => setHighlightedId(null),
            onConfirm: () => executeApprove(action),
        });
    };

    const handleCancel = (action: PendingAction) => {
        setHighlightedId(action.id);
        modals.openConfirmModal({
            title: <span className="text-base">Annuler cette action ?</span>,
            centered: true,
            children: (
                <span className="text-sm text-slate-700">
                    Confirmer l'annulation de <strong>{action.title}</strong> ? Elle sera retirée de la file d'approbation.
                </span>
            ),
            labels: { confirm: "Annuler l'action", cancel: 'Garder en attente' },
            confirmProps: { color: 'red' },
            cancelProps: { color: 'gray', variant: 'default' },
            withCloseButton: false,
            closeOnClickOutside: false,
            onCancel: () => setHighlightedId(null),
            onConfirm: () => executeCancel(action),
        });
    };

    const isNumericId = (id: string) => /^\d+$/.test(id);

    const handleToggleDetails = async (id: string) => {
        if (expandedId === id) {
            setExpandedId(null);
            setHighlightedId(null);
            return;
        }
        setExpandedId(id);
        setHighlightedId(id);

        if (!isNumericId(id)) return;
        if (descMap[id]?.value || descMap[id]?.loading) return;

        setDescMap(prev => ({ ...prev, [id]: { loading: true } }));
        try {
            const desc = await getCorrectiveActionDescription(id);
            setDescMap(prev => ({ ...prev, [id]: { loading: false, value: desc } }));
        } catch (e: any) {
            setDescMap(prev => ({ ...prev, [id]: { loading: false, error: e?.response?.data?.errorMessage || 'Le chargement de la description a échoué' } }));
        }
    };

    // Enrichissement avec les noms de responsable / département avant filtrage
    const enrichedActions = useMemo(() => actions.map(a => ({
        ...a,
        ownerName: a.ownerId ? (empMap[a.ownerId]?.name ?? '—') : (a.ownerName ?? '—'),
        departmentName: a.departmentId ? (deptMap[a.departmentId]?.name ?? '—') : (a.departmentName ?? '—')
    })), [actions, empMap, deptMap]);

    const filteredActions = enrichedActions.filter(action => {
        const q = searchTerm.toLowerCase();
        const matchesSearch = action.title.toLowerCase().includes(q) ||
            action.description.toLowerCase().includes(q) ||
            action.assignedBy.toLowerCase().includes(q);
        const matchesType = typeFilter === ALL || normalizeType(action.type) === typeFilter;
        const normalizedStatusFilter = normalizeType(statusFilter);
        const matchesStatus =
            statusFilter === ALL
            || (normalizedStatusFilter === 'OVERDUE' ? isOverdue(action.dueDateRaw) : normalizeType(action.status) === normalizedStatusFilter);
        return matchesSearch && matchesType && matchesStatus;
    });

    // Synthèse
    const totalActions = actions.length;
    const overdueActions = actions.filter(a => isOverdue(a.dueDateRaw)).length;
    const dueSoonActions = actions.filter(a => {
        if (isOverdue(a.dueDateRaw)) return false;
        const days = getDaysUntilDue(a.dueDateRaw);
        return days >= 0 && days <= 7;
    }).length;

    useEffect(() => {
        getAllDepartments()
            .then((res) => setDeptMap(mapIdToName(res)))
            .catch(() => { });
        getEmployeeDropdown()
            .then((res) => setEmpMap(mapIdToName(res)))
            .catch(() => { });
    }, []);

    const mapActions = (items: any[] | undefined, fallbackDepartmentId?: number | string | null): PendingAction[] => {
        if (!items || !Array.isArray(items)) return [];
        return items.map((x: any) => {
            const normalizedStatus = typeof x.status === 'string' ? x.status.toLowerCase() : 'pending';
            const departmentId = x.departmentId ?? (fallbackDepartmentId ?? null);
            const normalizedDepartmentId = (() => {
                if (departmentId === null || departmentId === undefined || departmentId === '') {
                    return null;
                }
                const numeric = Number(departmentId);
                return Number.isNaN(numeric) ? null : numeric;
            })();
            return {
                id: String(x.id),
                title: x.actionName ?? 'Action corrective',
                description: stripHtml(x.description || ''),
                type: x.type,
                status: ['pending', 'urgent', 'overdue'].includes(normalizedStatus) ? normalizedStatus as PendingAction['status'] : 'pending',
                assignedBy: x.assignedEmployeeName || '—',
                ownerId: x.ownerId ?? null,
                departmentId: normalizedDepartmentId,
                ownerName: '—',
                departmentName: '—',
                dueDateRaw: x.deadline ?? '',
                createdDateRaw: x.createdAt ?? '',
                relatedId: x.incidentTitle || 'ADHOC',
                details: { actionProgress: typeof x.progress === 'number' ? x.progress : undefined }
            } as PendingAction;
        });
    };

    useEffect(() => {
        let isMounted = true;

        const fetchActions = async () => {
            dispatch(showOverlay());
            try {
                const employeeId = user?.empId ?? user?.employeeId;
                const departmentId = user?.departmentId ?? user?.deptId;
                let fetchedActions: any[] | undefined;

                if (employeeId && departmentId) {
                    try {
                        const teamMember = await getTeamMemberByEmployeeId(employeeId);
                        const memberStatus = (teamMember?.status ?? '').toUpperCase();
                        if (teamMember && memberStatus === 'ACTIVE') {
                            fetchedActions = await getCorrectiveActionsByDepartmentId(departmentId);
                        }
                    } catch (error: any) {
                        const errorCode = error?.response?.data?.errorCode;
                        if (errorCode && errorCode !== 'TEAM_MEMBER_NOT_FOUND') {
                            console.error("Échec du chargement du membre d'équipe", error);
                        }
                    }
                }

                if (!fetchedActions) {
                    fetchedActions = await getAllPending();
                }

                if (isMounted) {
                    const mapped = mapActions(fetchedActions, user?.departmentId ?? user?.deptId ?? null);
                    setActions(mapped);
                }
            } catch (error) {
                console.error('Échec du chargement des actions', error);
                if (isMounted) {
                    setActions([]);
                }
            } finally {
                dispatch(hideOverlay());
            }
        };

        fetchActions();

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, user]);

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Actions Correctives' },
                    { label: 'Actions en attente' },
                ]}
                icon={<IconClock size={22} stroke={2} />}
                iconColor="orange"
                title="Actions en attente"
                subtitle="Revue et approbation des actions correctives soumises par les équipes"
            />

            {/* Synthèse */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <KpiTile
                    label="Total en attente"
                    value={totalActions}
                    tone="violet"
                    icon={<IconClock size={14} stroke={1.8} />}
                    referenceValue="File d'approbation"
                />
                <KpiTile
                    label="En retard"
                    value={overdueActions}
                    tone="rose"
                    icon={<IconAlertTriangle size={14} stroke={1.8} />}
                    referenceValue="Échéance dépassée"
                />
                <KpiTile
                    label="Échéance sous 7 jours"
                    value={dueSoonActions}
                    tone="amber"
                    icon={<IconCalendarDue size={14} stroke={1.8} />}
                    referenceValue="À traiter en priorité"
                />
            </div>

            {/* Barre de filtres */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                    <TextInput
                        placeholder="Rechercher par intitulé, description ou assigné…"
                        leftSection={<IconSearch size={14} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.currentTarget.value)}
                        size="xs"
                        className="flex-1 min-w-[220px]"
                    />
                    <Select
                        data={[
                            { value: ALL, label: 'Tous les types' },
                            ...availableTypes.map((type) => ({ value: type, label: getTypeConfig(type).label })),
                        ]}
                        value={typeFilter}
                        onChange={(v) => setTypeFilter(v ?? ALL)}
                        size="xs"
                        w={200}
                        aria-label="Filtrer par type"
                    />
                    <Select
                        data={[
                            { value: ALL, label: 'Tous les statuts' },
                            { value: 'pending', label: 'En attente' },
                            { value: 'urgent', label: 'Urgentes' },
                            { value: 'overdue', label: 'En retard' },
                        ]}
                        value={statusFilter}
                        onChange={(v) => setStatusFilter(v ?? ALL)}
                        size="xs"
                        w={150}
                        aria-label="Filtrer par statut"
                    />
                </div>
                <p className="text-[11.5px] text-slate-500 mt-2">
                    {filteredActions.length} action{filteredActions.length > 1 ? 's' : ''} affichée{filteredActions.length > 1 ? 's' : ''} sur {totalActions}
                </p>
            </div>

            {/* Liste des actions */}
            <div className="space-y-3">
                {filteredActions.map((action) => {
                    const typeConfig: any = getTypeConfig(action.type);
                    const daysUntilDue = getDaysUntilDue(action.dueDateRaw);
                    const overdue = isOverdue(action.dueDateRaw);
                    const stateCfg = pendingStateConfig(overdue ? 'OVERDUE' : action.status);

                    const isHighlighted = highlightedId === action.id || expandedId === action.id;

                    return (
                        <div
                            key={action.id}
                            className={`rounded-xl border bg-white ${isHighlighted ? 'border-teal-300 shadow-sm' : 'border-slate-200'}`}
                        >
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div className="flex-1 min-w-[260px]">
                                        <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                                            <div className="p-1.5 rounded-md bg-slate-50 border border-slate-200">
                                                <typeConfig.icon className={`w-4 h-4 ${typeConfig.iconColor}`} aria-hidden="true" />
                                            </div>
                                            <h3
                                                className="text-slate-800 leading-snug"
                                                style={{
                                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                                    fontSize: '14.5px',
                                                    fontWeight: 600,
                                                    letterSpacing: '-0.01em',
                                                }}
                                            >
                                                {action.title}
                                            </h3>
                                            <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-600">
                                                {typeConfig.label}
                                            </span>
                                        </div>

                                        {action.description && (
                                            <p className="text-[12.5px] text-slate-600 mb-3 line-clamp-2">{action.description}</p>
                                        )}

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[12px]">
                                            {action.assignedBy && action.assignedBy !== '—' && (
                                                <div className="flex items-center gap-1.5">
                                                    <IconUser className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                                                    <span className="text-slate-500">Assignée à</span>
                                                    <span className="text-slate-800">{action.assignedBy}</span>
                                                </div>
                                            )}
                                            {action.ownerName && action.ownerName !== '—' && (
                                                <div className="flex items-center gap-1.5">
                                                    <IconUser className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                                                    <span className="text-slate-500">Responsable</span>
                                                    <span className="text-slate-800">{action.ownerName}</span>
                                                </div>
                                            )}
                                            {action.departmentName && action.departmentName !== '—' && (
                                                <div className="flex items-center gap-1.5">
                                                    <IconBuilding className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                                                    <span className="text-slate-500">Département</span>
                                                    <span className="text-slate-800">{action.departmentName}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5">
                                                <IconCalendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                                                <span className="text-slate-500">Échéance</span>
                                                <span className={overdue ? 'text-rose-600' : 'text-slate-800'}>
                                                    {formatDateFr(action.dueDateRaw)}
                                                </span>
                                            </div>
                                        </div>

                                        {action.details.actionProgress !== undefined && (
                                            <div className="mt-3 max-w-sm">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[11.5px] text-slate-500">Progression actuelle</span>
                                                    <span className="text-[11.5px] text-slate-800 tabular-nums">{action.details.actionProgress}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={action.details.actionProgress} aria-valuemin={0} aria-valuemax={100}>
                                                    <div
                                                        className="bg-sky-500 h-full rounded-full"
                                                        style={{ width: `${action.details.actionProgress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${stateCfg.chip}`}>
                                            {stateCfg.label}
                                        </span>

                                        <div className="text-right text-[12px]">
                                            {overdue ? (
                                                <span className="text-rose-600">
                                                    {Math.abs(daysUntilDue)} jour{Math.abs(daysUntilDue) > 1 ? 's' : ''} de retard
                                                </span>
                                            ) : daysUntilDue === 0 ? (
                                                <span className="text-amber-700">Échéance aujourd'hui</span>
                                            ) : daysUntilDue === 1 ? (
                                                <span className="text-amber-700">Échéance demain</span>
                                            ) : (
                                                <span className="text-slate-600">
                                                    {daysUntilDue} jour{daysUntilDue > 1 ? 's' : ''} restant{daysUntilDue > 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex gap-1.5 flex-wrap justify-end">
                                            <Button
                                                variant="default"
                                                size="xs"
                                                onClick={() => handleToggleDetails(action.id)}
                                                leftSection={expandedId === action.id
                                                    ? <IconChevronDown size={13} aria-hidden="true" />
                                                    : <IconChevronRight size={13} aria-hidden="true" />}
                                                aria-expanded={expandedId === action.id}
                                            >
                                                Détails
                                            </Button>
                                            <Button
                                                color="teal"
                                                size="xs"
                                                onClick={() => handleApprove(action)}
                                                leftSection={<IconCircleCheck size={13} aria-hidden="true" />}
                                            >
                                                Approuver
                                            </Button>
                                            <Button
                                                color="red"
                                                variant="light"
                                                size="xs"
                                                onClick={() => handleCancel(action)}
                                                leftSection={<IconX size={13} aria-hidden="true" />}
                                            >
                                                Annuler
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Détails dépliés */}
                            {expandedId === action.id && (
                                <div className="px-4 pb-4 border-t border-slate-100">
                                    <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3 mt-3">
                                        <p className="text-[10.5px] uppercase tracking-wider text-slate-500 mb-1">Description complète</p>
                                        {descMap[action.id]?.loading && (
                                            <p className="text-[12.5px] text-slate-600">Chargement de la description…</p>
                                        )}
                                        {descMap[action.id]?.error && (
                                            <p className="text-[12.5px] text-rose-600">{descMap[action.id]?.error}</p>
                                        )}
                                        {descMap[action.id]?.value && (
                                            <SafeHtml html={descMap[action.id]?.value || ''} className="text-slate-700 text-[12.5px]" />
                                        )}
                                        {!isNumericId(action.id) && !descMap[action.id] && (
                                            <p className="text-[12.5px] text-slate-600">Description indisponible pour cet élément.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {filteredActions.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200">
                    <EmptyState
                        icon={<IconCircleCheck size={28} />}
                        title="Aucune action en attente"
                        description={
                            searchTerm || typeFilter !== ALL || statusFilter !== ALL
                                ? 'Aucune action ne correspond aux filtres sélectionnés.'
                                : 'Toutes les actions correctives sont à jour.'
                        }
                        iconColor="emerald"
                    />
                </div>
            )}
        </div>
    );
};

export default PendingActions;

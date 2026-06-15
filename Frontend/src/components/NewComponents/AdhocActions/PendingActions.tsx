import { Fragment, useEffect, useMemo, useState } from 'react';
import {
    IconAlertTriangle,
    IconBolt,
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
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation('adhoc');
    // Libellés bilingues : clés i18n `adhoc:*`, repli sur les libellés FR centralisés (adhocLabels.ts).
    const tSourceType = (code?: string | null) => {
        const norm = (code ?? '').toString().trim().toUpperCase().replace(/[\s-]+/g, '_');
        return t(`sourceType.${norm}`, { defaultValue: sourceTypeLabel(code) });
    };
    const tState = (state?: string | null, fallback?: string) =>
        t(`state.${(state ?? '').toUpperCase()}`, { defaultValue: fallback ?? (state ?? '—') });

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
            label: tSourceType(type),
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
            successNotification(t('pending.approvedToast', { title: action.title || t('pending.untitled') }));
            setActions(prev => prev.filter(a => a.id !== action.id));
            setHighlightedId(null);
        } catch (e: any) {
            errorNotification(e?.response?.data?.errorMessage || t('pending.approveFailed'));
        }
        dispatch(hideOverlay());
    };

    const executeCancel = async (action: PendingAction) => {
        setHighlightedId(action.id);
        dispatch(showOverlay());
        try {
            await cancelCorrectiveAction(action.id);
            successNotification(t('pending.cancelledToast', { title: action.title || t('pending.untitled') }));
            setActions(prev => prev.filter(a => a.id !== action.id));
            setHighlightedId(null);
        } catch (e: any) {
            errorNotification(e?.response?.data?.errorMessage || t('pending.cancelFailed'));
        }
        dispatch(hideOverlay());
    };

    const handleApprove = (action: PendingAction) => {
        setHighlightedId(action.id);
        modals.openConfirmModal({
            title: <span className="text-base">{t('pending.approveModalTitle')}</span>,
            centered: true,
            children: (
                <span className="text-sm text-slate-700">
                    {t('pending.approveBodyPrefix')}<strong>{action.title}</strong>{t('pending.approveBodySuffix')}
                </span>
            ),
            labels: { confirm: t('pending.approveConfirm'), cancel: t('pending.modalCancel') },
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
            title: <span className="text-base">{t('pending.cancelModalTitle')}</span>,
            centered: true,
            children: (
                <span className="text-sm text-slate-700">
                    {t('pending.cancelBodyPrefix')}<strong>{action.title}</strong>{t('pending.cancelBodySuffix')}
                </span>
            ),
            labels: { confirm: t('pending.cancelConfirm'), cancel: t('pending.keepPending') },
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
            setDescMap(prev => ({ ...prev, [id]: { loading: false, error: e?.response?.data?.errorMessage || t('pending.descLoadFailed') } }));
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
        const days = getDaysUntilDue(action.dueDateRaw);
        const matchesStatus =
            statusFilter === ALL
            || (normalizedStatusFilter === 'OVERDUE'
                ? isOverdue(action.dueDateRaw)
                : normalizedStatusFilter === 'DUESOON'
                    ? (!isOverdue(action.dueDateRaw) && days >= 0 && days <= 7)
                    : normalizeType(action.status) === normalizedStatusFilter);
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
                    { label: t('pending.breadcrumbHome', { defaultValue: 'Accueil' }), to: '/' },
                    { label: t('pending.breadcrumbCorrective') },
                    { label: t('pending.title') },
                ]}
                icon={<IconClock size={22} stroke={2} />}
                iconColor="orange"
                title={t('pending.title')}
                subtitle={t('pending.subtitle')}
            />

            {/* Onglets de statut raffinés — remplacent les tuiles KPI : ils comptent ET filtrent */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5">
                {[
                    { value: ALL, label: t('pending.tabAll'), count: totalActions, Icon: IconClock, active: 'bg-slate-800 text-white border-slate-800' },
                    { value: 'overdue', label: t('pending.tabOverdue'), count: overdueActions, Icon: IconAlertTriangle, active: 'bg-rose-600 text-white border-rose-600' },
                    { value: 'urgent', label: t('pending.tabUrgent'), count: actions.filter((a) => normalizeType(a.status) === 'URGENT').length, Icon: IconBolt, active: 'bg-orange-500 text-white border-orange-500' },
                    { value: 'duesoon', label: t('pending.tabDueSoon'), count: dueSoonActions, Icon: IconCalendarDue, active: 'bg-amber-500 text-white border-amber-500' },
                ].map((tab) => {
                    const isActive = statusFilter === tab.value;
                    return (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => setStatusFilter(tab.value)}
                            className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[13px] transition-colors ${isActive ? `${tab.active} shadow-sm` : 'border-transparent bg-white text-slate-600 hover:bg-slate-50'}`}
                            aria-pressed={isActive}
                        >
                            <tab.Icon size={15} stroke={1.8} />
                            {tab.label}
                            <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[11px] ${isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Barre de filtres */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                    <TextInput
                        placeholder={t('pending.searchPlaceholder')}
                        leftSection={<IconSearch size={14} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.currentTarget.value)}
                        size="xs"
                        className="flex-1 min-w-[220px]"
                    />
                    <Select
                        data={[
                            { value: ALL, label: t('pending.allTypes') },
                            ...availableTypes.map((type) => ({ value: type, label: getTypeConfig(type).label })),
                        ]}
                        value={typeFilter}
                        onChange={(v) => setTypeFilter(v ?? ALL)}
                        size="xs"
                        w={200}
                        aria-label={t('pending.filterByType')}
                    />
                    <Select
                        data={[
                            { value: ALL, label: t('pending.allStatuses') },
                            { value: 'pending', label: t('pending.statusPending') },
                            { value: 'urgent', label: t('pending.statusUrgent') },
                            { value: 'overdue', label: t('pending.statusOverdue') },
                        ]}
                        value={statusFilter}
                        onChange={(v) => setStatusFilter(v ?? ALL)}
                        size="xs"
                        w={150}
                        aria-label={t('pending.filterByStatus')}
                    />
                </div>
                <p className="text-[11.5px] text-slate-500 mt-2">
                    {t('pending.shownCount', { count: filteredActions.length, total: totalActions })}
                </p>
            </div>

            {/* Tableau raffiné des actions en attente (remplace les tuiles) */}
            {filteredActions.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[13px]">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                                    <th className="px-4 py-2.5 font-medium">{t('pending.colAction')}</th>
                                    <th className="px-4 py-2.5 font-medium">{t('pending.colAssignment')}</th>
                                    <th className="px-4 py-2.5 font-medium">{t('pending.colDepartment')}</th>
                                    <th className="px-4 py-2.5 font-medium">{t('pending.colDue')}</th>
                                    <th className="px-4 py-2.5 font-medium">{t('pending.colProgress')}</th>
                                    <th className="px-4 py-2.5 font-medium">{t('pending.colStatus')}</th>
                                    <th className="px-4 py-2.5 font-medium text-right">{t('pending.colActions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredActions.map((action) => {
                                    const typeConfig: any = getTypeConfig(action.type);
                                    const daysUntilDue = getDaysUntilDue(action.dueDateRaw);
                                    const overdue = isOverdue(action.dueDateRaw);
                                    const stateCode = overdue ? 'OVERDUE' : action.status;
                                    const stateCfg = pendingStateConfig(stateCode);
                                    const isExpanded = expandedId === action.id;
                                    const isHighlighted = highlightedId === action.id || isExpanded;
                                    const progress = action.details.actionProgress;
                                    return (
                                        <Fragment key={action.id}>
                                            <tr className={`align-top transition-colors hover:bg-slate-50/70 ${isHighlighted ? 'bg-teal-50/40' : ''}`}>
                                                {/* Action */}
                                                <td className="px-4 py-3 max-w-[320px]">
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="mt-0.5 shrink-0 rounded-md border border-slate-200 bg-slate-50 p-1.5">
                                                            <typeConfig.icon className={`h-4 w-4 ${typeConfig.iconColor}`} aria-hidden="true" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="leading-snug text-slate-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '13.5px', fontWeight: 600, letterSpacing: '-0.01em' }}>
                                                                {action.title}
                                                            </p>
                                                            <span className="mt-1 inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-600">
                                                                {typeConfig.label}
                                                            </span>
                                                            {action.description && (
                                                                <p className="mt-1 line-clamp-1 text-[12px] text-slate-500">{action.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Assignation */}
                                                <td className="px-4 py-3 text-[12.5px] text-slate-700">
                                                    {action.assignedBy && action.assignedBy !== '—' ? (
                                                        <div className="flex items-center gap-1.5"><IconUser className="h-3.5 w-3.5 text-slate-400" /> {action.assignedBy}</div>
                                                    ) : action.ownerName && action.ownerName !== '—' ? (
                                                        <div className="flex items-center gap-1.5"><IconUser className="h-3.5 w-3.5 text-slate-400" /> {action.ownerName}</div>
                                                    ) : <span className="text-slate-300">—</span>}
                                                </td>
                                                {/* Département */}
                                                <td className="px-4 py-3 text-[12.5px] text-slate-700">
                                                    {action.departmentName && action.departmentName !== '—'
                                                        ? <div className="flex items-center gap-1.5"><IconBuilding className="h-3.5 w-3.5 text-slate-400" /> {action.departmentName}</div>
                                                        : <span className="text-slate-300">—</span>}
                                                </td>
                                                {/* Échéance */}
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className={`flex items-center gap-1.5 text-[12.5px] ${overdue ? 'text-rose-600' : 'text-slate-700'}`}>
                                                        <IconCalendar className="h-3.5 w-3.5 text-slate-400" />
                                                        {formatDateFr(action.dueDateRaw)}
                                                    </div>
                                                    <div className="mt-0.5 text-[11px]">
                                                        {overdue ? (
                                                            <span className="text-rose-600">{t('pending.daysOverdue', { count: Math.abs(daysUntilDue) })}</span>
                                                        ) : daysUntilDue === 0 ? (
                                                            <span className="text-amber-700">{t('pending.today')}</span>
                                                        ) : daysUntilDue === 1 ? (
                                                            <span className="text-amber-700">{t('pending.tomorrow')}</span>
                                                        ) : (
                                                            <span className="text-slate-400">{t('pending.daysLeft', { count: daysUntilDue })}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                {/* Progression */}
                                                <td className="px-4 py-3 w-[130px]">
                                                    {progress !== undefined ? (
                                                        <div>
                                                            <div className="mb-1 text-[11px] tabular-nums text-slate-600">{progress}%</div>
                                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                                                                <div className="h-full rounded-full bg-sky-500" style={{ width: `${progress}%` }} />
                                                            </div>
                                                        </div>
                                                    ) : <span className="text-[12px] text-slate-300">—</span>}
                                                </td>
                                                {/* Statut */}
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center whitespace-nowrap rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${stateCfg.chip}`}>
                                                        {tState(stateCode, stateCfg.label)}
                                                    </span>
                                                </td>
                                                {/* Actions */}
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-1.5">
                                                        <Button variant="default" size="xs" onClick={() => handleToggleDetails(action.id)}
                                                            leftSection={isExpanded ? <IconChevronDown size={13} /> : <IconChevronRight size={13} />}
                                                            aria-expanded={isExpanded}>
                                                            {t('pending.details')}
                                                        </Button>
                                                        <Button color="teal" size="xs" onClick={() => handleApprove(action)} leftSection={<IconCircleCheck size={13} />}>
                                                            {t('pending.approve')}
                                                        </Button>
                                                        <Button color="red" variant="light" size="xs" onClick={() => handleCancel(action)} leftSection={<IconX size={13} />}>
                                                            {t('pending.cancel')}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-slate-50/50">
                                                    <td colSpan={7} className="px-4 pb-4 pt-0">
                                                        <div className="mt-1 rounded-md border border-slate-200 bg-white p-3">
                                                            <p className="mb-1 text-[10.5px] uppercase tracking-wider text-slate-500">{t('pending.fullDescription')}</p>
                                                            {descMap[action.id]?.loading && <p className="text-[12.5px] text-slate-600">{t('pending.loadingDescription')}</p>}
                                                            {descMap[action.id]?.error && <p className="text-[12.5px] text-rose-600">{descMap[action.id]?.error}</p>}
                                                            {descMap[action.id]?.value && <SafeHtml html={descMap[action.id]?.value || ''} className="text-[12.5px] text-slate-700" />}
                                                            {!isNumericId(action.id) && !descMap[action.id] && <p className="text-[12.5px] text-slate-600">{t('pending.descriptionUnavailable')}</p>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {filteredActions.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200">
                    <EmptyState
                        icon={<IconCircleCheck size={28} />}
                        title={t('pending.emptyTitle')}
                        description={
                            searchTerm || typeFilter !== ALL || statusFilter !== ALL
                                ? t('pending.emptyFiltered')
                                : t('pending.emptyAllDone')
                        }
                        iconColor="emerald"
                    />
                </div>
            )}
        </div>
    );
};

export default PendingActions;

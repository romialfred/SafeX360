import { useEffect, useMemo, useState } from 'react';
import {
    // AlertTriangle
    // CheckCircle
    IconClock, // Eye
    IconAlertTriangle, // FileText
    IconCircleCheck, // Shield
    IconFileText, // Search
    IconHelmet, // Filter
    IconShield, // Calendar
    IconSearch, // User
    IconFilter, // Building
    IconCalendar, // Target
    IconUser, // Zap
    IconBuilding, IconTarget, IconBolt, IconBook, IconChevronRight, IconChevronDown
} from '@tabler/icons-react';
import { Badge, Breadcrumbs, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { Link } from 'react-router-dom';
import {
    approveCorrectiveAction,
    cancelCorrectiveAction,
    getCorrectiveActionDescription,
    getCorrectiveActionsByDepartmentId,
    getAllPending,
} from '../../../services/CorrectiveActionService';
import { getTeamMemberByEmployeeId } from '../../../services/TeamMemberService';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';
import { formatDateShort } from '../../../utility/DateFormats';
import { useDispatch, useSelector } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { getAllDepartments } from '../../../services/HrmsService';
import { getEmployeeDropdown } from '../../../services/EmployeeService';
import { mapIdToName } from '../../../utility/OtherUtilities';
import { actionTypesMap } from '../../../Data/DropdownData';
interface PendingAction {
    id: string;
    title: string;
    description: string;
    type: 'ppe-approval' | 'risk-assessment' | 'document-approval' | 'incident-investigation' | 'action-assignment' | 'audit-review' | 'training-approval' | 'GENERAL_INSPECTION';
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'overdue' | 'urgent';
    assignedBy: string;
    department: string;
    ownerId?: number | null;
    departmentId?: number | null;
    ownerName?: string;
    departmentName?: string;
    dueDate: string;
    createdDate: string;
    relatedId: string;
    estimatedTime: string;
    details: {
        requestor?: string;
        location?: string;
        amount?: string;
        riskLevel?: string;
        documentType?: string;
        incidentDate?: string;
        actionProgress?: number;
    };
}


const PendingActions = () => {
    const [actions, setActions] = useState<PendingAction[]>([]);
    const [deptMap, setDeptMap] = useState<Record<number, any>>({});
    const [empMap, setEmpMap] = useState<Record<number, any>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const dispatch = useDispatch();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [descMap, setDescMap] = useState<Record<string, { loading: boolean; value?: string; error?: string }>>({});
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const user = useSelector((state: any) => state.user);
    const normalizeType = (value: string) => value?.toString?.().trim().toUpperCase().replace(/[\s-]+/g, '_') ?? '';

    const typeConfigMap: Record<string, { label: string; icon: typeof IconHelmet; iconColor: string; badgeColor: string }> = {
        PPE_APPROVAL: { label: 'PPE Approval', icon: IconHelmet, iconColor: 'text-blue-600', badgeColor: 'blue' },
        RISK_ASSESSMENT: { label: 'Risk Assessment', icon: IconShield, iconColor: 'text-orange-600', badgeColor: 'orange' },
        DOCUMENT_APPROVAL: { label: 'Document Approval', icon: IconFileText, iconColor: 'text-green-600', badgeColor: 'green' },
        INCIDENT_INVESTIGATION: { label: 'Incident Investigation', icon: IconAlertTriangle, iconColor: 'text-red-600', badgeColor: 'red' },
        ACTION_ASSIGNMENT: { label: 'Action Assignment', icon: IconTarget, iconColor: 'text-purple-600', badgeColor: 'grape' },
        AUDIT_REVIEW: { label: 'Audit Review', icon: IconCircleCheck, iconColor: 'text-indigo-600', badgeColor: 'indigo' },
        TRAINING_APPROVAL: { label: 'Training Approval', icon: IconBook, iconColor: 'text-cyan-600', badgeColor: 'cyan' },
        GENERAL_INSPECTION: { label: 'General Inspection', icon: IconSearch, iconColor: 'text-teal-600', badgeColor: 'teal' },
    };

    const statuses = ['pending', 'urgent', 'overdue'];

    const availableTypes = useMemo(() => {
        const set = new Set<string>();
        actions.forEach((action) => {
            const normalized = normalizeType(action.type);
            if (normalized) {
                set.add(normalized);
            }
        });
        if (typeFilter !== 'all') {
            set.add(typeFilter);
        }
        return Array.from(set).sort();
    }, [actions, typeFilter]);

    const getTypeConfig = (type: string) => {
        const normalized = normalizeType(type);
        const config = typeConfigMap[normalized];
        return {
            normalized,
            icon: config?.icon ?? IconFileText,
            iconColor: config?.iconColor ?? 'text-gray-500',
            badgeColor: config?.badgeColor ?? 'gray',
            label: config?.label ?? (normalized || 'Unknown Type'),
        };
    };

    // priority visuals removed; keep placeholder if needed
    // const getPriorityColor = (_: string) => 'bg-gray-100 text-gray-800 border-gray-200';

    const getStatusColor = (status: string) => {
        switch (normalizeType(status)) {
            case 'OVERDUE': return 'bg-red-100 text-red-800 border-red-200';
            case 'URGENT': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'PENDING': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (normalizeType(status)) {
            case 'OVERDUE': return <IconAlertTriangle className="w-4 h-4" />;
            case 'URGENT': return <IconBolt className="w-4 h-4" />;
            case 'PENDING': return <IconClock className="w-4 h-4" />;
            default: return <IconClock className="w-4 h-4" />;
        }
    };

    const isOverdue = (dueDate: string) => {
        return new Date(dueDate) < new Date();
    };

    const getDaysUntilDue = (dueDate: string) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const executeApprove = async (action: PendingAction) => {
        setHighlightedId(action.id);
        dispatch(showOverlay());
        try {
            await approveCorrectiveAction(action.id);
            successNotification(`${action.title || 'Corrective Action'} approved`);
            setActions(prev => prev.filter(a => a.id !== action.id));
            setHighlightedId(null);
        } catch (e: any) {
            errorNotification(e?.response?.data?.errorMessage || 'Failed to approve');
        }
        dispatch(hideOverlay());
    };

    const executeCancel = async (action: PendingAction) => {
        setHighlightedId(action.id);
        dispatch(showOverlay());
        try {
            await cancelCorrectiveAction(action.id);
            successNotification(`${action.title || 'Corrective Action'} cancelled`);
            setActions(prev => prev.filter(a => a.id !== action.id));
            setHighlightedId(null);
        } catch (e: any) {
            errorNotification(e?.response?.data?.errorMessage || 'Failed to cancel');
        }

        dispatch(hideOverlay());
    };

    const handleApprove = (action: PendingAction) => {
        setHighlightedId(action.id);
        modals.openConfirmModal({
            title: <span className="font-semibold text-lg">Approve this action?</span>,
            centered: true,
            children: (
                <span className="text-sm text-gray-700">
                    Are you sure you want to approve <strong>{action.title}</strong>?
                </span>
            ),
            labels: { confirm: 'Approve', cancel: 'Cancel' },
            confirmProps: { color: 'green' },
            cancelProps: { color: 'gray', variant: 'outline' },
            withCloseButton: false,
            closeOnClickOutside: false,
            onCancel: () => setHighlightedId(null),
            onConfirm: () => executeApprove(action),
        });
    };

    const handleCancel = (action: PendingAction) => {
        setHighlightedId(action.id);
        modals.openConfirmModal({
            title: <span className="font-semibold text-lg">Cancel this action?</span>,
            centered: true,
            children: (
                <span className="text-sm text-gray-700">
                    Are you sure you want to cancel <strong>{action.title}</strong>?
                </span>
            ),
            labels: { confirm: 'Cancel Action', cancel: 'Keep Pending' },
            confirmProps: { color: 'red' },
            cancelProps: { color: 'gray', variant: 'outline' },
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
            setDescMap(prev => ({ ...prev, [id]: { loading: false, error: e?.response?.data?.errorMessage || 'Failed to load description' } }));
        }
    };

    // Enrich actions with owner/department names before filtering
    const enrichedActions = useMemo(() => actions.map(a => ({
        ...a,
        ownerName: a.ownerId ? (empMap[a.ownerId]?.name ?? '-') : (a.ownerName ?? '-'),
        departmentName: a.departmentId ? (deptMap[a.departmentId]?.name ?? '-') : (a.departmentName ?? '-')
    })), [actions, empMap, deptMap]);

    const filteredActions = enrichedActions.filter(action => {
        const matchesSearch = action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            action.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            action.assignedBy.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || normalizeType(action.type) === typeFilter;
        const normalizedStatusFilter = normalizeType(statusFilter);
        const matchesStatus =
            statusFilter === 'all'
            || (normalizedStatusFilter === 'OVERDUE' ? isOverdue(action.dueDate) : normalizeType(action.status) === normalizedStatusFilter);
        return matchesSearch && matchesType && matchesStatus;
    });

    // Statistics
    const totalActions = actions.length;
    const overdueActions = actions.filter(a => isOverdue(a.dueDate)).length;
    const criticalActions = actions.filter(a => a.priority === 'critical').length;

    // Load department and employee maps for owner/department names
    useEffect(() => {
        getAllDepartments()
            .then((res) => setDeptMap(mapIdToName(res)))
            .catch((_err) => { });
        getEmployeeDropdown()
            .then((res) => setEmpMap(mapIdToName(res)))
            .catch((_err) => { });
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
                title: x.actionName ?? 'Corrective Action',
                description: x.description || '',
                type: x.type,
                priority: 'medium',
                status: ['pending', 'urgent', 'overdue'].includes(normalizedStatus) ? normalizedStatus as PendingAction['status'] : 'pending',
                assignedBy: x.assignedEmployeeName || '-',
                department: '',
                ownerId: x.ownerId ?? null,
                departmentId: normalizedDepartmentId,
                ownerName: '-',
                departmentName: '-',
                dueDate: x.deadline ? formatDateShort(x.deadline) : '',
                createdDate: x.createdAt ? formatDateShort(x.createdAt) : '',
                relatedId: x.incidentTitle || 'ADHOC',
                estimatedTime: '',
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
                            console.error('Failed to load team member data', error);
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
                console.error('Failed to load actions', error);
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
    }, [dispatch, user]);



    return (
        <div className="flex flex-col gap-5 p-5">
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Pending Actions</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text variant="gradient">Pending Actions</Text>
                    </Breadcrumbs>
                </div>

            </div>
            <p className=' italic'>Review and resolve overdue, urgent, and critical hazard-related actions</p>
            {/* Content */}
            <div className="">

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <IconClock className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Total Pending</p>
                                <p className="text-2xl font-bold text-gray-900">{totalActions}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <IconAlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Overdue</p>
                                <p className="text-2xl font-bold text-red-600">{overdueActions}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <IconTarget className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Critical Priority</p>
                                <p className="text-2xl font-bold text-purple-600">{criticalActions}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <IconSearch className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search actions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Types</option>
                            {availableTypes.map((type) => {
                                const config = getTypeConfig(type);
                                return (
                                    <option key={type} value={type}>
                                        {`Type: ${config.label}`}
                                    </option>
                                );
                            })}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Statuses</option>
                            {statuses.map(status => (
                                <option key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </option>
                            ))}
                        </select>

                        <div className="flex items-center text-sm text-gray-600">
                            <IconFilter className="w-4 h-4 mr-2" />
                            {filteredActions.length} of {totalActions} actions
                        </div>
                    </div>
                </div>

                {/* Actions List */}
                <div className="space-y-4">
                    {filteredActions.map((action) => {
                        const typeConfig: any = getTypeConfig(action.type);
                        const daysUntilDue = getDaysUntilDue(action.dueDate);
                        const overdue = isOverdue(action.dueDate);

                        const isHighlighted = highlightedId === action.id || expandedId === action.id;

                        return (
                            <div
                                key={action.id}
                                className={`rounded-xl border transition-all duration-200 ${isHighlighted ? 'bg-blue-50 border-blue-400 shadow-lg ring-2 ring-blue-200' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-3">
                                                <div className={`p-2 rounded-lg bg-gray-50 mr-3`}>
                                                    <typeConfig.icon className={`w-5 h-5 ${typeConfig.iconColor}`} />
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
                                                    <Badge
                                                        color={typeConfig.badgeColor}
                                                        variant="light"
                                                        className="uppercase"
                                                    >
                                                        {actionTypesMap[action.type] || action.type}
                                                    </Badge>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        {/* <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                            {action.id}
                                                        </span> */}
                                                        {/* <span className="text-sm text-gray-500">•</span>
                                                        <span className="text-sm text-gray-500">{action.relatedId}</span> */}
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-gray-600 mb-4">{action.description}</p>

                                            {/* Details moved to bottom-of-card */}

                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                                                {action.assignedBy && (
                                                    <div className="flex items-center">
                                                        <IconUser className="w-4 h-4 text-gray-400 mr-2" />
                                                        <span className="text-gray-600">From:</span>
                                                        <span className="ml-1 font-medium">{action.assignedBy}</span>
                                                    </div>
                                                )}
                                                {action.ownerName && action.ownerName !== '-' && (
                                                    <div className="flex items-center">
                                                        <IconUser className="w-4 h-4 text-green-600 mr-2" />
                                                        <span className="text-gray-600">Owner:</span>
                                                        <span className="ml-1 font-medium">{action.ownerName}</span>
                                                    </div>
                                                )}
                                                {action.departmentName && action.departmentName !== '-' && (
                                                    <div className="flex items-center">
                                                        <IconBuilding className="w-4 h-4 text-purple-600 mr-2" />
                                                        <span className="text-gray-600">Dept:</span>
                                                        <span className="ml-1 font-medium">{action.departmentName}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center">
                                                    <IconCalendar className="w-4 h-4 text-gray-400 mr-2" />
                                                    <span className="text-gray-600">Due:</span>
                                                    <span className={`ml-1 font-medium ${overdue ? 'text-red-600' : ''}`}>
                                                        {action.dueDate}
                                                    </span>
                                                </div>
                                                {/* removed estimated time */}
                                            </div>

                                            {/* Additional Details */}
                                            {action.details.requestor && <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                                    {action.details.requestor && (
                                                        <div>
                                                            <span className="text-gray-500">Requestor:</span>
                                                            <span className="ml-1 font-medium">{action.details.requestor}</span>
                                                        </div>
                                                    )}
                                                    {action.details.location && (
                                                        <div>
                                                            <span className="text-gray-500">Location:</span>
                                                            <span className="ml-1 font-medium">{action.details.location}</span>
                                                        </div>
                                                    )}
                                                    {action.details.amount && (
                                                        <div>
                                                            <span className="text-gray-500">Amount:</span>
                                                            <span className="ml-1 font-medium">{action.details.amount}</span>
                                                        </div>
                                                    )}
                                                    {action.details.riskLevel && (
                                                        <div>
                                                            <span className="text-gray-500">Risk Level:</span>
                                                            <span className="ml-1 font-medium text-orange-600">{action.details.riskLevel}</span>
                                                        </div>
                                                    )}
                                                    {action.details.documentType && (
                                                        <div>
                                                            <span className="text-gray-500">Document Type:</span>
                                                            <span className="ml-1 font-medium">{action.details.documentType}</span>
                                                        </div>
                                                    )}
                                                    {action.details.incidentDate && (
                                                        <div>
                                                            <span className="text-gray-500">Incident Date:</span>
                                                            <span className="ml-1 font-medium">{action.details.incidentDate}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {action.details.actionProgress !== undefined && (
                                                    <div className="mt-3">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm text-gray-500">Current Progress</span>
                                                            <span className="text-sm font-medium">{action.details.actionProgress}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                                style={{ width: `${action.details.actionProgress}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            }
                                        </div>

                                        <div className="flex flex-col items-end space-y-3 ml-6">
                                            <div className="flex flex-col space-y-2">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(action.status)}`}>
                                                    {getStatusIcon(action.status)}
                                                    <span className="ml-1">{action.status.charAt(0).toUpperCase() + action.status.slice(1)}</span>
                                                </span>
                                            </div>

                                            <div className="text-right text-sm">
                                                {overdue ? (
                                                    <span className="text-red-600 font-medium">
                                                        {Math.abs(daysUntilDue)} days overdue
                                                    </span>
                                                ) : daysUntilDue === 0 ? (
                                                    <span className="text-orange-600 font-medium">Due today</span>
                                                ) : daysUntilDue === 1 ? (
                                                    <span className="text-orange-600 font-medium">Due tomorrow</span>
                                                ) : (
                                                    <span className="text-gray-600">
                                                        {daysUntilDue} days remaining
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex space-x-2">
                                                <button onClick={() => handleToggleDetails(action.id)} className="flex items-center px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    {expandedId === action.id ? (
                                                        <IconChevronDown className="w-4 h-4 mr-1" />
                                                    ) : (
                                                        <IconChevronRight className="w-4 h-4 mr-1" />
                                                    )}
                                                    Details
                                                </button>
                                                <button onClick={() => handleApprove(action)} className="flex items-center px-3 py-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                                    <IconCircleCheck className="w-4 h-4 mr-1" />
                                                    Approve
                                                </button>
                                                <button onClick={() => handleCancel(action)} className="flex items-center px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Bottom-of-card expanded details */}
                                {expandedId === action.id && (
                                    <div className="px-6 pb-6 border-t border-gray-100">
                                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-4">
                                            <p className="text-blue-600 text-sm font-medium mb-1">Action Details</p>
                                            {descMap[action.id]?.loading && (
                                                <p className="text-sm text-gray-600">Loading description...</p>
                                            )}
                                            {descMap[action.id]?.error && (
                                                <p className="text-sm text-red-600">{descMap[action.id]?.error}</p>
                                            )}
                                            {descMap[action.id]?.value && (
                                                <div className="text-gray-700 text-sm" dangerouslySetInnerHTML={{ __html: descMap[action.id]?.value || '' }} />
                                            )}
                                            {!isNumericId(action.id) && !descMap[action.id] && (
                                                <p className="text-sm text-gray-600">Details not available for mock items.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {filteredActions.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <IconCircleCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No pending actions found</h3>
                        <p className="text-gray-600">
                            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                                ? 'Try adjusting your filters to see more actions.'
                                : 'Great job! You\'re all caught up with your pending actions.'
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PendingActions;

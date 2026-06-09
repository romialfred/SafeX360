import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, ScrollArea } from "@mantine/core";
import {
    IconAlertTriangle,
    IconCircleCheck,
    IconClockHour4,
    IconFileCheck,
    IconFileX,
    IconHourglassHigh,
    IconRefresh,
    IconShieldCheck,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";
import PageHeader from "../../UtilityComp/PageHeader";
import KpiTile from "../../UtilityComp/KpiTile";
import SegmentedFilter from "../../UtilityComp/SegmentedFilter";
import ActionItemList, { ActionTone } from "./ActionItemList";
import BarChartFiles from "./BarChartFiles";
import DonutChartFile from "./DonutChartFile";
import TableFile from "./TableFile";
import {
    getActionItems,
    getCompliantEmployees,
    getDepartmentSummary,
    getOverallStatus,
    ActionStatus,
    DepartmentSummaryEntry,
    OverallStatusResponse,
    CompliantEmployeesResponse,
} from "../../../services/ComplianceDashboardService";
import { errorNotification } from "../../../utility/NotificationUtility";
import { ACTION_TAB_LABELS, bucketFromBackendStatus } from "../complianceLabels";

const TAB_ORDER: ActionTone[] = ["expired", "upcoming", "missing", "pending"];
const DEFAULT_EMPLOYEE_PAGE_SIZE = 5;

const TAB_FILTER_COLORS: Record<string, 'red' | 'orange' | 'slate' | 'indigo'> = {
    expired: 'red',
    upcoming: 'orange',
    missing: 'slate',
    pending: 'indigo',
};

const CompDashboard = () => {
    const [activeTab, setActiveTab] = useState<string>('expired');
    const [actionStatuses, setActionStatuses] = useState<ActionStatus[]>([]);
    const [departmentSummary, setDepartmentSummary] = useState<DepartmentSummaryEntry[]>([]);
    const [overallStatus, setOverallStatusState] = useState<OverallStatusResponse | null>(null);
    const [compliantEmployees, setCompliantEmployeesState] = useState<CompliantEmployeesResponse | null>(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [employeesLoading, setEmployeesLoading] = useState(true);
    const [employeePage, setEmployeePage] = useState(1);
    const [employeePageSize, setEmployeePageSize] = useState(DEFAULT_EMPLOYEE_PAGE_SIZE);

    const fetchDashboardData = useCallback(async () => {
        setDashboardLoading(true);
        try {
            const [actionItemsResponse, departmentSummaryResponse, overallStatusResponse] = await Promise.all([
                getActionItems(),
                getDepartmentSummary(),
                getOverallStatus(),
            ]);

            setActionStatuses(actionItemsResponse.statuses ?? []);
            setDepartmentSummary(departmentSummaryResponse.departments ?? []);
            setOverallStatusState(overallStatusResponse);
        } catch (error: any) {
            console.error("Échec du chargement du tableau de bord conformité", error);
            errorNotification(error?.response?.data?.errorMessage || "Le tableau de bord conformité n'a pas pu être chargé");
        } finally {
            setDashboardLoading(false);
        }
    }, []);

    const loadCompliantEmployees = useCallback(async (page: number, pageSize: number) => {
        setEmployeesLoading(true);
        try {
            const response = await getCompliantEmployees(page, pageSize);
            setCompliantEmployeesState(response);
            setEmployeePage(page);
            setEmployeePageSize(pageSize);
        } catch (error: any) {
            console.error("Échec du chargement des employés conformes", error);
            errorNotification(error?.response?.data?.errorMessage || "La liste des employés conformes n'a pas pu être chargée");
        } finally {
            setEmployeesLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        loadCompliantEmployees(0, DEFAULT_EMPLOYEE_PAGE_SIZE);
    }, [loadCompliantEmployees]);

    const orderedStatuses = useMemo(() => {
        if (!actionStatuses.length) return [];
        const byCode = new Map(actionStatuses.map((status) => [status.code, status]));
        const ordered: ActionStatus[] = [];

        TAB_ORDER.forEach((code) => {
            const status = byCode.get(code);
            if (status) {
                ordered.push(status);
                byCode.delete(code);
            }
        });

        byCode.forEach((status) => ordered.push(status));
        return ordered;
    }, [actionStatuses]);

    useEffect(() => {
        if (!orderedStatuses.length) return;
        const hasActiveTab = orderedStatuses.some((status) => status.code === activeTab);
        if (!hasActiveTab) {
            setActiveTab(orderedStatuses[0].code);
        }
    }, [orderedStatuses, activeTab]);

    const handleEmployeePageChange = useCallback(
        (page: number, pageSize: number) => {
            loadCompliantEmployees(page, pageSize);
        },
        [loadCompliantEmployees]
    );

    // ─── KPI dérivés des données du backend ─────────────────────────────────
    const kpis = useMemo(() => {
        const counts = { compliant: 0, upcoming: 0, expired: 0, missing: 0, pending: 0 };
        (overallStatus?.breakdown ?? []).forEach((entry) => {
            counts[bucketFromBackendStatus(entry.status)] += entry.count ?? 0;
        });
        const pendingStatus = actionStatuses.find((s) => s.code === 'pending');
        counts.pending = pendingStatus?.count ?? 0;

        const total = overallStatus?.totalRequirements ?? 0;
        const rate = total > 0 ? Math.round((counts.compliant / total) * 100) : 0;
        return { ...counts, total, rate };
    }, [overallStatus, actionStatuses]);

    const totalOpenActions = orderedStatuses.reduce((sum, status) => sum + (status.count ?? 0), 0);
    const activeStatus = orderedStatuses.find((status) => status.code === activeTab);

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Conformité Réglementaire' },
                    { label: 'Tableau de bord' },
                ]}
                icon={<IconShieldCheck size={22} stroke={2} />}
                iconColor="teal"
                title="Tableau de bord — Conformité Réglementaire"
                subtitle="Posture de conformité du site : exigences légales, justificatifs et échéances de renouvellement"
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="default"
                            size="xs"
                            leftSection={<IconRefresh size={14} />}
                            onClick={() => {
                                fetchDashboardData();
                                loadCompliantEmployees(0, employeePageSize);
                            }}
                        >
                            Actualiser
                        </Button>
                        <Button
                            component={Link}
                            to="/compliance-requirements"
                            variant="light"
                            color="teal"
                            size="xs"
                            leftSection={<IconFileCheck size={14} />}
                        >
                            Gérer les exigences
                        </Button>
                    </div>
                }
            />

            {/* Rangée KPI — six indicateurs charte R7 */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                <KpiTile
                    label="Taux de conformité"
                    value={dashboardLoading ? '…' : kpis.rate}
                    unit="%"
                    tone="teal"
                    icon={<IconShieldCheck size={14} stroke={1.8} />}
                    referenceValue="Cible : ≥ 90 %"
                />
                <KpiTile
                    label="Conformes"
                    value={dashboardLoading ? '…' : kpis.compliant}
                    tone="green"
                    icon={<IconCircleCheck size={14} stroke={1.8} />}
                    referenceValue="Justificatifs valides"
                />
                <KpiTile
                    label="Échéances proches"
                    value={dashboardLoading ? '…' : kpis.upcoming}
                    tone="amber"
                    icon={<IconClockHour4 size={14} stroke={1.8} />}
                    referenceValue="Sous 30 jours"
                />
                <KpiTile
                    label="Expirés"
                    value={dashboardLoading ? '…' : kpis.expired}
                    tone="rose"
                    icon={<IconAlertTriangle size={14} stroke={1.8} />}
                    referenceValue="À renouveler"
                />
                <KpiTile
                    label="Manquants"
                    value={dashboardLoading ? '…' : kpis.missing}
                    tone="slate"
                    icon={<IconFileX size={14} stroke={1.8} />}
                    referenceValue="Aucun justificatif"
                />
                <KpiTile
                    label="En attente"
                    value={dashboardLoading ? '…' : kpis.pending}
                    tone="violet"
                    icon={<IconHourglassHigh size={14} stroke={1.8} />}
                    referenceValue="À valider"
                />
            </div>

            {/* Actions requises — file de travail du préventeur */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                        <h2
                            className="text-slate-800"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontSize: '15px',
                                fontWeight: 600,
                                letterSpacing: '-0.01em',
                            }}
                        >
                            Actions requises
                        </h2>
                        <p className="text-[12px] text-slate-500 mt-0.5">
                            Renouvellements expirés, échéances proches, pièces manquantes et validations en attente.
                        </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[12px]">
                        {dashboardLoading ? 'Chargement…' : `${totalOpenActions} action${totalOpenActions > 1 ? 's' : ''} ouverte${totalOpenActions > 1 ? 's' : ''}`}
                    </span>
                </div>

                <SegmentedFilter
                    value={activeTab}
                    onChange={setActiveTab}
                    options={orderedStatuses.map((status) => ({
                        value: status.code,
                        label: ACTION_TAB_LABELS[status.code] ?? status.label,
                        count: status.count ?? 0,
                        color: TAB_FILTER_COLORS[status.code] ?? 'slate',
                    }))}
                />

                <div className="mt-3">
                    {dashboardLoading ? (
                        <div className="flex flex-col gap-2" aria-busy="true">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />
                            ))}
                        </div>
                    ) : activeStatus ? (
                        <ScrollArea.Autosize mah={380} type="auto">
                            <ActionItemList
                                items={activeStatus.items}
                                tone={(TAB_ORDER.includes(activeStatus.code as ActionTone)
                                    ? activeStatus.code
                                    : 'pending') as ActionTone}
                                seeAllHref={activeStatus.code === 'pending' ? '/document-validation' : undefined}
                                seeAllLabel="Tout traiter dans Validation des documents"
                            />
                        </ScrollArea.Autosize>
                    ) : (
                        <ActionItemList items={[]} tone="pending" />
                    )}
                </div>
            </div>

            {/* Analyse — répartition par département et vue d'ensemble */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <BarChartFiles departments={departmentSummary} loading={dashboardLoading} />
                <DonutChartFile
                    data={overallStatus?.breakdown ?? []}
                    total={overallStatus?.totalRequirements ?? 0}
                    loading={dashboardLoading}
                />
            </div>

            {/* Registre des employés conformes */}
            <TableFile
                employees={compliantEmployees?.employees ?? []}
                total={compliantEmployees?.total ?? 0}
                page={employeePage}
                pageSize={employeePageSize}
                onPageChange={handleEmployeePageChange}
                loading={employeesLoading}
            />
        </div>
    );
};

export default CompDashboard;

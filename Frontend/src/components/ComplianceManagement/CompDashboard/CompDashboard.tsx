import { Breadcrumbs, Text, Tabs, Card, ScrollArea, rem, Loader, Center, Badge } from "@mantine/core";
import {
    IconClockHour4,
    IconAlertTriangle,
    IconFileX,
    IconCircleCheck,
    IconAlertOctagon,
} from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ExpiredContent from "./ExpiredContent";
import UpcomingExpiry from "./UpcomingExpiry";
import MissingFile from "./MissingFile";
import Pending from "./Pending";
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
    CompliantEmployeesResponse
} from "../../../services/ComplianceDashboardService";
import { errorNotification } from "../../../utility/NotificationUtility";

const TAB_ORDER = ["expired", "upcoming", "missing", "pending"];
const DEFAULT_EMPLOYEE_PAGE_SIZE = 5;

const CompDashboard = () => {
    const [activeTab, setActiveTab] = useState('expired');
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
            console.error("Failed to load compliance dashboard data", error);
            errorNotification(error?.response?.data?.errorMessage || "Failed to load compliance dashboard data");
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
            console.error("Failed to load compliant employees", error);
            errorNotification(error?.response?.data?.errorMessage || "Failed to load compliant employees");
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

    const renderTabContent = (status: ActionStatus) => {
        switch (status.code) {
            case "expired":
                return <ExpiredContent items={status.items} />;
            case "upcoming":
                return <UpcomingExpiry items={status.items} />;
            case "missing":
                return <MissingFile items={status.items} />;
            case "pending":
                return <Pending items={status.items} label={status.label} seeAllHref="/document-validation" />;
            default:
                return <Pending items={status.items} label={status.label} seeAllHref="/document-validation" />;
        }
    };

    return (
        <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text">Compliance Dashboard</div>
                    <Breadcrumbs mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text variant="gradient">Compliance Dashboard</Text>
                    </Breadcrumbs>
                </div>
            </div>
            <p className=' italic '>Real-time overview of regulatory requirements, assignments, and compliance performance tracking</p>

            <Card shadow="xl" radius="lg" withBorder className="overflow-hidden border-slate-200">
                <Card.Section
                    className="px-6 py-5"
                    style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 50%, #ede9fe 100%)' }}
                >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-white/70 p-2 shadow-sm">
                                <IconAlertOctagon size={26} className="text-blue-600" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Text size="lg" fw={700} c="blue.9">Action Required</Text>
                                <Text size="sm" c="blue.7">
                                    Track overdue, upcoming, and missing compliance tasks in real time.
                                </Text>
                            </div>
                        </div>
                        <Badge size="lg" variant="light" color="blue" radius="sm" className="!bg-white/80 !text-blue-700 shadow-sm">
                            {orderedStatuses.reduce((sum, status) => sum + (status.count ?? 0), 0)} open items
                        </Badge>
                    </div>
                </Card.Section>

                <div className="flex flex-col gap-6 px-6 py-6">
                    {orderedStatuses.length > 0 && (
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {orderedStatuses.slice(0, 4).map((status) => {
                                const palette: Record<string, { text: string; bg: string; hoverBg: string }> = {
                                    expired: { text: 'text-red-600', bg: 'bg-red-50', hoverBg: 'hover:bg-red-100/70' },
                                    upcoming: { text: 'text-orange-600', bg: 'bg-orange-50', hoverBg: 'hover:bg-orange-100/70' },
                                    missing: { text: 'text-gray-600', bg: 'bg-slate-50', hoverBg: 'hover:bg-slate-100/70' },
                                    pending: { text: 'text-blue-600', bg: 'bg-blue-50', hoverBg: 'hover:bg-blue-100/70' },
                                };
                                const styles = palette[status.code] ?? palette.pending;
                                return (
                                    <div
                                        key={status.code}
                                        className={`rounded-xl border border-white/60 ${styles.bg} px-4 py-3 shadow-sm transition-all duration-200 ease-out hover:scale-[1.02] ${styles.hoverBg} hover:shadow-md`}
                                    >
                                        <Text size="xs" fw={600} className={`uppercase tracking-wide ${styles.text}`}>
                                            {status.label}
                                        </Text>
                                        <Text size="xl" fw={700} className={styles.text}>
                                            {status.count ?? 0}
                                        </Text>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {orderedStatuses.length ? (
                        <Tabs
                            value={activeTab}
                            onChange={(value) => value && setActiveTab(value)}
                            variant="pills"
                            radius="xl"
                            keepMounted={false}
                            classNames={{
                                list: "flex flex-wrap gap-3",
                                tab: "data-[active=true]:!bg-blue-600 data-[active=true]:!text-white !bg-blue-50 !text-blue-600 !font-medium !px-5 !py-2 !rounded-full !shadow-sm transition-colors",
                            }}
                        >
                            <Tabs.List>
                                {orderedStatuses.map((status) => {
                                    const iconMap: Record<string, any> = {
                                        expired: IconAlertTriangle,
                                        upcoming: IconClockHour4,
                                        missing: IconFileX,
                                        pending: IconCircleCheck,
                                    };
                                    const IconComponent = iconMap[status.code] || IconCircleCheck;
                                    return (
                                        <Tabs.Tab
                                            key={status.code}
                                            value={status.code}
                                            leftSection={<IconComponent size={18} />}
                                        >
                                            {`${status.label} (${status.count ?? 0})`}
                                        </Tabs.Tab>
                                    );
                                })}
                            </Tabs.List>

                            {orderedStatuses.map((status) => (
                                <Tabs.Panel value={status.code} key={status.code} pt="md">
                                    <Card shadow="sm" radius="lg" withBorder style={{ maxHeight: rem(320), overflow: 'hidden' }}>
                                        <ScrollArea h={320} className="px-2">
                                            <div className="p-2">
                                                {dashboardLoading ? (
                                                    <Center className="py-10">
                                                        <Loader color="blue" />
                                                    </Center>
                                                ) : status.items.length ? (
                                                    renderTabContent(status)
                                                ) : (
                                                    <Center className="py-10">
                                                        <Text className="text-gray-500">No records found for {status.label.toLowerCase()}.</Text>
                                                    </Center>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </Card>
                                </Tabs.Panel>
                            ))}
                        </Tabs>
                    ) : (
                        <Card shadow="sm" radius="lg" withBorder style={{ maxHeight: rem(320), overflow: 'hidden' }}>
                            <Center className="py-10">
                                {dashboardLoading ? <Loader color="blue" /> : <Text className="text-gray-500">No compliance action items available.</Text>}
                            </Center>
                        </Card>
                    )}
                </div>
            </Card>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 place-items-center">
                <BarChartFiles departments={departmentSummary} loading={dashboardLoading} />
                <DonutChartFile data={overallStatus?.breakdown ?? []} total={overallStatus?.totalRequirements ?? 0} loading={dashboardLoading} />
            </div>

            <div>
                <TableFile
                    employees={compliantEmployees?.employees ?? []}
                    total={compliantEmployees?.total ?? 0}
                    page={employeePage}
                    pageSize={employeePageSize}
                    onPageChange={handleEmployeePageChange}
                    loading={employeesLoading}
                />
            </div>
        </div>
    );
};

export default CompDashboard;

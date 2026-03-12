import { useEffect, useMemo, useState } from "react";
import { IconAlertTriangle, IconCertificate, IconFileAnalytics, IconUserCheck } from "@tabler/icons-react";
import StatisticsCard from "./StatisticsCard";
import DepartmentCard from "./DepartmentCard";
import RecentActivityCard from "./RecentActivityCard";
import { useAppSelector } from "../../slices/hooks";
import { errorNotification } from "../../utility/NotificationUtility";
import { getDepartmentStatistics } from "../../services/IncidentService";

const DepartmentStatistics = () => {
    const user = useAppSelector((state) => state.user as any);
    const departmentId = user?.departmentId ?? null;
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState({
        incidentReportsLast30Days: 0,
        completedInvestigationsLast30Days: 0,
        correctiveActionsDueLast30Days: 0,
    });

    useEffect(() => {
        let cancelled = false;

        const loadMetrics = async () => {
            setLoading(true);
            try {
                const data = await getDepartmentStatistics(departmentId);
                if (!cancelled) {
                    setMetrics({
                        incidentReportsLast30Days: data?.incidentReportsLast30Days ?? 0,
                        completedInvestigationsLast30Days: data?.completedInvestigationsLast30Days ?? 0,
                        correctiveActionsDueLast30Days: data?.correctiveActionsDueLast30Days ?? 0,
                    });
                    setFetchError(null);
                }
            } catch (error: any) {
                if (!cancelled) {
                    setMetrics({
                        incidentReportsLast30Days: 0,
                        completedInvestigationsLast30Days: 0,
                        correctiveActionsDueLast30Days: 0,
                    });
                    setFetchError("Unable to load current department statistics.");
                    if (error?.response?.data?.errorMessage) {
                        errorNotification(error.response.data.errorMessage);
                    }
                    else {
                        console.error("Failed to fetch department statistics", error);
                    }
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadMetrics();

        return () => {
            cancelled = true;
        };
    }, [departmentId]);

    const numberFormatter = useMemo(() => new Intl.NumberFormat("en-US"), []);

    const incidentSummaryCards = useMemo(() => {
        const placeholder = loading ? "…" : undefined;
        return [
            {
                icon: <IconFileAnalytics size={25} className="text-blue-600" />,
                type: "30d",
                incident: "Total Incident Reports",
                value: placeholder ?? numberFormatter.format(metrics.incidentReportsLast30Days ?? 0),
                unit: "Last 30 Days",
                text: "text-blue-600",
                bgColor: "bg-blue-50",
                borderColor: "border-blue-300",
            },
            {
                icon: <IconUserCheck size={25} className="text-green-600" />,
                type: "30d",
                incident: "Investigations Complete",
                value: placeholder ?? numberFormatter.format(metrics.completedInvestigationsLast30Days ?? 0),
                unit: "Last 30 Days",
                text: "text-green-600",
                bgColor: "bg-green-50",
                borderColor: "border-green-300",
            },
            {
                icon: <IconAlertTriangle size={25} className="text-red-600" />,
                type: "30d",
                incident: "Corrective Actions Due",
                value: placeholder ?? numberFormatter.format(metrics.correctiveActionsDueLast30Days ?? 0),
                unit: "Last 30 Days",
                text: "text-red-600",
                bgColor: "bg-red-50",
                borderColor: "border-red-300",
            },
            {
                icon: <IconCertificate size={25} className="text-emerald-600" />,
                type: "+2",
                incident: "Training Compliance",
                value: "94%",
                unit: "Current",
                text: "text-emerald-600",
                bgColor: "bg-emerald-50",
                borderColor: "border-emerald-300",
            },
        ];
    }, [loading, metrics, numberFormatter]);

    return (
        <div className="flex flex-col gap-5 p-5 bg-white border border-gray-300 shadow-sm rounded-2xl">
            <h1 className="text-2xl font-bold text-gray-600">My Department Statistics</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {incidentSummaryCards.map((card, index) => (
                    <StatisticsCard key={index} incidentSummaryCards={card} />
                ))}
            </div>

            {fetchError && <p className="text-sm text-red-600">{fetchError}</p>}

            <div className="grid gap-5 grid-cols-3 ">
                <DepartmentCard />
                <RecentActivityCard />
            </div>
        </div>
    );
};

export default DepartmentStatistics;

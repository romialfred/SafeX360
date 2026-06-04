import { useEffect, useMemo, useState } from "react";
import { Button } from "@mantine/core";
import { IconChevronLeft, IconChevronRight, IconMenu3, IconShield } from "@tabler/icons-react";
import { Carousel } from "@mantine/carousel";
import ActiveCard from "./ActiveCard";
import RiskCard from "./RiskCard";
import { riskMap } from "../../Data/DropdownData";
import { searchRisks, type RiskDto, type RiskStatus } from "../../services/RiskRegisterService";
import type { RiskSummary } from "./types";
import { getEmployeeDropdown } from "../../services/EmployeeService";
import { mapIdToName } from "../../utility/OtherUtilities";
import EmptyState from "../UtilityComp/EmptyState";
import ErrorBanner from "../UtilityComp/ErrorBanner";
import { SkeletonCardList } from "../UtilityComp/LoadingSkeleton";

const DEFAULT_STATUS_LABEL: Record<RiskStatus, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    CLOSED: "Closed",
};

const fallbackAxisValue = (riskKey: string | null | undefined, index: number): number | null => {
    if (!riskKey || riskKey.length < 2) {
        return null;
    }
    const char = riskKey.charAt(index);
    const parsed = Number(char);
    return Number.isNaN(parsed) ? null : parsed;
};

const mapRiskDtoToSummary = (risk: RiskDto): RiskSummary => {
    const probability = risk.probability ?? fallbackAxisValue(risk.riskLevel, 0);
    const severity = risk.severity ?? fallbackAxisValue(risk.riskLevel, 1);
    const score = probability != null && severity != null ? probability * severity : null;
    const riskMeta = risk.riskLevel ? riskMap[risk.riskLevel] : undefined;
    const riskLevelLabel = riskMeta?.level ? `${riskMeta.level} Risk` : "Not Rated";
    const ownerLabel = risk.ownerId ? `Owner #${risk.ownerId}` : "Unassigned";

    return {
        id: risk.id,
        title: risk.title,
        description: risk.description ?? "",
        status: risk.status,
        statusLabel: DEFAULT_STATUS_LABEL[risk.status] ?? risk.status,
        riskLevelKey: risk.riskLevel ?? null,
        riskLevelLabel,
        riskLevelColor: riskMeta?.color ?? "gray",
        probability,
        severity,
        score,
        hazardSource: risk.hazardSource ?? "",
        potentialConsequences: risk.potentialConsequences ?? "",
        ownerId: risk.ownerId,
        ownerLabel,
        departmentId: risk.departmentId,
        workProcessId: risk.workProcessId,
        createdAt: risk.createdAt,
        updatedAt: risk.updatedAt,
        reviewDate: risk.reviewDate,
    };
};

const ActiveTask = () => {
    const [activeTab, setActiveTab] = useState<"active" | "risk">("active");
    const [risks, setRisks] = useState<RiskSummary[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [empMap, setEmpMap] = useState<Record<string, any>>({});

    useEffect(() => {
        fetchOpenRisks();
        fetchEmployeeMap();
    }, []);

    const fetchEmployeeMap = () => {
        getEmployeeDropdown().then((data) => {
            setEmpMap(mapIdToName(data));
        });
    }

    const fetchOpenRisks = () => {
        setLoading(true);
        setError(null);
        searchRisks({ status: "OPEN" })
            .then((response) => {
                setRisks(response.map(mapRiskDtoToSummary));
            })
            .catch((err) => {
                const message = err?.response?.data?.errorMessage ?? err?.message ?? "Failed to fetch open risks";
                setError(message);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const slideSize = useMemo(() => {
        if (risks.length >= 3) return "33.3333%";
        if (risks.length === 2) return "50%";
        return "100%";
    }, [risks.length]);

    const renderCarouselContent = (CardComponent: React.ComponentType<{ owner: string | undefined; risk: RiskSummary }>) => {
        if (loading) {
            /* LOT 41 E: SkeletonCardList pendant le chargement */
            return <SkeletonCardList items={3} columns={3} />;
        }

        if (error) {
            /* LOT 41 E: ErrorBanner unifié */
            return (
                <ErrorBanner
                    tone="error"
                    title="Échec du chargement"
                    action={
                        <Button size="xs" variant="outline" color="red" onClick={fetchOpenRisks}>
                            Retry
                        </Button>
                    }
                >
                    {error}
                </ErrorBanner>
            );
        }

        if (risks.length === 0) {
            /* LOT 41 E: EmptyState unifié */
            return (
                <EmptyState
                    icon={<IconShield size={28} />}
                    title="No open risks found"
                    description="Create a risk assessment to see it here."
                    iconColor="slate"
                />
            );
        }

        return (
            <Carousel
                slideSize={slideSize}
                slideGap="md"
                align="start"
                loop={risks.length > 3}
                controlSize={48}
                nextControlIcon={<IconChevronRight size={32} />}
                previousControlIcon={<IconChevronLeft size={32} />}
                styles={{
                    control: {
                        backgroundColor: "#1e40af",
                        color: "white",
                        borderRadius: "9999px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        "&:hover": {
                            backgroundColor: "#1d4ed8",
                        },
                    },
                }}
            >
                {risks.map((risk) => (
                    <Carousel.Slide key={risk.id}>
                        <CardComponent owner={empMap[risk?.ownerId ?? ""]?.name} risk={risk} />
                    </Carousel.Slide>
                ))}
            </Carousel>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-300">
            <div className="flex gap-4">
                <Button
                    color={activeTab === "active" ? "blue" : "gray"}
                    leftSection={<IconMenu3 />}
                    onClick={() => setActiveTab("active")}
                >
                    Active Tasks
                </Button>
                <Button
                    color={activeTab === "risk" ? "blue" : "gray"}
                    leftSection={<IconShield />}
                    onClick={() => setActiveTab("risk")}
                >
                    Risk Assessments
                </Button>
            </div>

            <div className="grid grid-cols-1">
                {activeTab === "active" && <div className="mt-5">{renderCarouselContent(ActiveCard)}</div>}
                {activeTab === "risk" && <div className="mt-5">{renderCarouselContent(RiskCard)}</div>}
            </div>
        </div>
    );
};

export default ActiveTask;

import { Button } from "@mantine/core";
import type { RiskSummary } from "./types";
import { formatDateShort } from "../../utility/DateFormats";

const riskLevelClassMap: Record<string, string> = {
    red: "bg-red-100 text-red-700",
    orange: "bg-orange-100 text-orange-700",
    yellow: "bg-yellow-100 text-yellow-700",
    limegreen: "bg-lime-100 text-lime-700",
    green: "bg-green-100 text-green-700",
};

const statusClassMap: Record<string, string> = {
    OPEN: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700",
    CLOSED: "bg-gray-200 text-gray-700",
};

interface ActiveCardProps {
    risk: RiskSummary;
    owner?: string;
}

const ActiveCard = ({ risk, owner }: ActiveCardProps) => {
    const statusClass = statusClassMap[risk.status] ?? "bg-gray-100 text-gray-700";
    const hasProbability = typeof risk.probability === "number";
    const hasSeverity = typeof risk.severity === "number";
    const hasRiskKey = Boolean(risk.riskLevelKey);
    const hasScore = typeof risk.score === "number" && hasProbability && hasSeverity;
    const showRiskScale = hasProbability || hasSeverity || hasRiskKey;
    const riskLevelClass = showRiskScale
        ? (riskLevelClassMap[risk.riskLevelColor] ?? "bg-slate-100 text-slate-700")
        : "";
    const reviewDate = risk.reviewDate ? formatDateShort(risk.reviewDate) : "Not scheduled";

    return (
        <div className="bg-white rounded-2xl border hover:shadow-xl cursor-pointer hover:scale-[1.02] transition-all duration-300 ease-in-out border-gray-300 shadow-md p-5 flex flex-col gap-5">
            {showRiskScale && <div className="flex flex-wrap items-center gap-2">
                {showRiskScale && (
                    <span className={`text-sm px-3 py-1 rounded-full ${riskLevelClass}`}>
                        {risk.riskLevelLabel}
                    </span>
                )}
                {showRiskScale && hasScore && (
                    <span className="text-sm text-gray-700">Score: {risk.score}</span>
                )}

            </div>}

            <div className="space-y-3">
                <div>
                    <div className="flex items-center gap-3 ">


                        <h2 className="text-lg text-gray-800">{risk.title}</h2>
                        <span className={`text-sm px-3 py-1 rounded-full uppercase ${statusClass} ml-auto`}>
                            {risk.statusLabel}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3">
                        {risk.description || "No description provided."}
                    </p>
                </div>

                {showRiskScale && (
                    <div className="flex flex-wrap gap-3 text-xs uppercase tracking-wide text-gray-500">
                        {hasProbability && <span>Probability: {risk.probability}</span>}
                        {hasSeverity && <span>Severity: {risk.severity}</span>}
                        {hasRiskKey && <span>Risk Key: {risk.riskLevelKey}</span>}
                    </div>
                )}
            </div>

            <hr className="border-gray-200" />

            <div className="text-sm text-gray-700 space-y-2">
                <div className="flex justify-between gap-4">
                    <span className="font-medium">Hazard Source</span>
                    <span className="text-right">{risk.hazardSource || "Not specified"}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="font-medium">Consequences</span>
                    <span className="text-right">{risk.potentialConsequences || "Not specified"}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="font-medium">Owner</span>
                    <span className="text-right">{owner}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="font-medium">Review Date</span>
                    <span className="text-right">{reviewDate || "Not scheduled"}</span>
                </div>
            </div>

            <div className="pt-2">
                <Button fullWidth variant="outline" color="blue" size="sm" radius="md">
                    View details
                </Button>
            </div>
        </div>
    );
};

export default ActiveCard;

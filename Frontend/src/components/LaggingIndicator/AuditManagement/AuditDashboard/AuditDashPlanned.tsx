import { DonutChart } from "@mantine/charts";
import { Card, Divider, Stack, Text } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { getAllAudit, getPendingRecommendations } from "../../../../services/AuditService";
import { formatDateShort } from "../../../../utility/DateFormats";
import { Link } from "react-router-dom";


// Dynamic Overall Compliance (status distribution)
type DonutItem = { name: string; value: number; color: string };

// will display pending recommendations in place of the static planned audits list


const AuditDashPlanned = () => {

    const [startIndex, setStartIndex] = useState(0);
    const itemsPerPage = 2;
    const [totalAudits, setTotalAudits] = useState<number>(0);
    const [pendingRecs, setPendingRecs] = useState<any[]>([]);
    const [complianceData, setComplianceData] = useState<DonutItem[]>([
        { name: 'Planning', value: 0, color: 'blue' },
        { name: 'Preparation', value: 0, color: 'violet' },
        { name: 'Execution', value: 0, color: 'orange' },
        { name: 'Closed', value: 0, color: 'green' },
        { name: 'Cancelled', value: 0, color: 'red' },
    ]);

    useEffect(() => {
        getAllAudit()
            .then((audits: any[]) => {
                const total = audits?.length || 0;
                const counts = { PLANNING: 0, PREPARATION: 0, EXECUTION: 0, CLOSED: 0, CANCELLED: 0 } as Record<string, number>;
                (audits || []).forEach((a: any) => {
                    const key = String(a.status || '').toUpperCase();
                    if (counts[key] !== undefined) counts[key] += 1;
                });
                setTotalAudits(total);
                setComplianceData([
                    { name: 'Planning', value: counts.PLANNING, color: 'blue' },
                    { name: 'Preparation', value: counts.PREPARATION, color: 'violet' },
                    { name: 'Execution', value: counts.EXECUTION, color: 'orange' },
                    { name: 'Closed', value: counts.CLOSED, color: 'green' },
                    { name: 'Cancelled', value: counts.CANCELLED, color: 'red' },
                ]);
            })
            .catch(() => { /* noop */ });
        getPendingRecommendations()
            .then((res) => setPendingRecs(res || []))
            .catch(() => setPendingRecs([]));
    }, []);

    const handlePrev = () => {
        if (startIndex > 0) {
            setStartIndex(startIndex - itemsPerPage);
        }
    };

    const handleNext = () => {
        if (startIndex + itemsPerPage < pendingRecs.length) {
            setStartIndex(startIndex + itemsPerPage);
        }
    };
    const visiblePending = pendingRecs.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="grid grid-cols-2 gap-4">
            <Card shadow="xs" p="lg" radius="md" withBorder >
                <Stack gap="sm">
                    <div className="flex justify-between p-5">
                        <div>

                            <Text size="xl" fw={700}>Overall Compliance Status</Text>
                        </div>

                    </div>
                </Stack>

                <div className="flex flex-wrap gap-4 px-5">
                    {complianceData.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: item.color }}
                            ></div>
                            <span className="text-sm font-normal">{item.name}</span>
                        </div>
                    ))}
                </div>

                <div className="flex items-center h-full justify-center">

                    <DonutChart
                        h={100}
                        data={complianceData}
                        size={350}
                        thickness={90}
                        chartLabel={`${totalAudits} Audits`}

                    />

                </div>
            </Card>

            <div className="p-4 bg-white border-gray-300 shadow-sm border rounded-lg flex flex-col gap-2">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-600">Pending Recommendations</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrev}
                            disabled={startIndex === 0}
                            className="p-2 bg-gray-200 rounded-full disabled:opacity-50"
                        >
                            <IconChevronLeft size={20} />
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={startIndex + itemsPerPage >= pendingRecs.length}
                            className="p-2 bg-gray-200 rounded-full disabled:opacity-50"
                        >
                            <IconChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {visiblePending.map((rec, index) => {
                        const auditId = rec.auditId || rec.audit?.id;
                        const recommendationLink = auditId ? `/audit-management/details/${auditId}?tab=recommendation` : undefined;

                        return (
                            <div
                                key={index}
                                className="border border-gray-200 rounded-xl flex flex-col gap-2 shadow-sm p-3 items-start bg-white"
                            >
                                <h3 className="text-sm self-start font-semibold text-gray-700">{rec.title || '-'}</h3>
                                <div className="flex justify-between gap-4 w-full items-center">
                                    <p className="text-xs text-gray-600 truncate">Audit: {rec.auditTitle || '-'}</p>
                                    <div className="text-[11px] text-gray-500">Due: {rec?.deadline ? formatDateShort(rec.deadline) : '-'}</div>
                                </div>
                                <Divider />
                                <div className="flex justify-between items-center w-full">
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <span className="text-[11px]">Priority:</span>
                                        {(() => {
                                            const p = String(rec.priority || '').toLowerCase();
                                            const cls = p === 'high'
                                                ? 'bg-red-100 text-red-700'
                                                : p === 'average' || p === 'medium'
                                                    ? 'bg-orange-100 text-orange-700'
                                                    : 'bg-yellow-100 text-yellow-800';
                                            const label = rec.priority || '-';
                                            return <span className={`px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
                                        })()}
                                    </div>
                                    {recommendationLink && (
                                        <Link
                                            to={recommendationLink}
                                            className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-full mb-1 hover:bg-blue-100"
                                        >
                                            View Details
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {pendingRecs.length === 0 && (
                        <div className="text-gray-500 text-sm">No pending recommendations</div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AuditDashPlanned

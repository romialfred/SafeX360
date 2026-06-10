import { BarChart } from "@mantine/charts";
import { Card } from "@mantine/core";
import { useMemo } from "react";

const AuditDashChart = ({ audits = [], auditAreaMap = {} as Record<string, any> }: { audits?: any[]; auditAreaMap?: Record<string, any> }) => {
    const areaSeries = useMemo(() => {
        const counts: Record<string, number> = {};
        (audits || []).forEach((a: any) => {
            const key = String(a.scopeId ?? '');
            if (!key) return;
            counts[key] = (counts[key] || 0) + 1;
        });
        // Build chart data with area names
        const base = Object.entries(counts).map(([scopeId, value]) => ({
            name: auditAreaMap[String(scopeId)]?.name || `Domaine ${scopeId}`,
            value,
        }));
        // Sort by value desc
        base.sort((a, b) => (b.value - a.value));
        // Assign distinct colors per bar (cycles through palette if needed)
        const palette = [
            'blue', 'green', 'orange', 'red', 'teal', 'violet', 'cyan', 'pink', 'grape', 'lime', 'yellow', 'indigo', 'gray.6'
        ];
        return base.map((item, idx) => ({ ...item, color: palette[idx % palette.length] }));
    }, [audits, auditAreaMap]);

    return (
        <Card shadow="xs" radius="md" withBorder p="lg" className="w-full">
            <div className="flex justify-between items-center">
                <div className="mb-4">
                    <h2 className="text-sm text-slate-700" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>Audits par domaine</h2>
                </div>
            </div>
            <BarChart
                h={260}
                data={areaSeries}
                dataKey="name"
                withBarValueLabel
                gridAxis="none"
                series={[{ name: 'value' }]}
                maxBarWidth={28}
                yAxisLabel="Nombre d'audits"
                legendProps={{ verticalAlign: 'top' }}
                withYAxis
                withTooltip={false}
                withXAxis
                xAxisLabel="Domaine d'audit"
            />
        </Card>
    )
}

export default AuditDashChart

import { DonutChart } from "@mantine/charts";
import { Card, Center, Loader, Text } from "@mantine/core";
import { IconChartPie } from "@tabler/icons-react";
import { StatusBreakdownEntry } from "../../../services/ComplianceDashboardService";

interface DonutChartFileProps {
    data: StatusBreakdownEntry[];
    total: number;
    loading?: boolean;
}

const fallbackColors = ["#6b7280", "#ef4444", "#f97316", "#22c55e", "#0ea5e9"];

const DonutChartFile = ({ data, total, loading = false }: DonutChartFileProps) => {
    const chartData = data.map((item, idx) => ({
        name: item.status,
        value: item.count,
        color: item.color || fallbackColors[idx % fallbackColors.length],
    }));

    const topStatus = chartData
        .slice()
        .sort((a, b) => b.value - a.value)[0];

    const complianceRate = total ? Math.round(((chartData.find(item => item.name.toLowerCase() === "compliant")?.value ?? 0) / total) * 100) : 0;

    return (
        <Card
            shadow="xl"
            radius="lg"
            withBorder
            className="flex h-full w-full max-w-3xl flex-col overflow-hidden border-purple-100 bg-gradient-to-br from-white via-indigo-50 to-white"
        >
            <Card.Section className=" px-6 py-5"
                style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 50%, #ede9fe 100%)' }}>
                <div className="flex items-center gap-3">
                    <div className="rounded-full bg-white/20 p-2">
                        <IconChartPie size={28} className="text-blue-600" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <Text size="lg" c="blue.9">Overall Compliance Snapshot</Text>
                        <Text size="sm" c="blue.7">
                            Visualize how your requirements are distributed across statuses right now.
                        </Text>
                    </div>
                </div>
            </Card.Section>

            <div className="flex flex-1 flex-col items-center gap-6 px-6 py-6">
                <div className="grid w-full gap-3 sm:grid-cols-3">
                    <div className="flex flex-col gap-1 rounded-xl border border-white/60 bg-slate-50 px-4 py-3 shadow-sm transition-all duration-200 ease-out hover:scale-[1.02] hover:bg-slate-100/70 hover:shadow-md">
                        <span className="text-xs uppercase tracking-wide text-slate-500">Total Requirements</span>
                        <span className="text-2xl font-semibold text-slate-800">{total ?? 0}</span>
                    </div>
                    <div className="flex flex-col gap-1 rounded-xl border border-white/60 bg-emerald-50 px-4 py-3 shadow-sm transition-all duration-200 ease-out hover:scale-[1.02] hover:bg-emerald-100/70 hover:shadow-md">
                        <span className="text-xs uppercase tracking-wide text-emerald-600">Compliance Rate</span>
                        <span className="text-2xl font-semibold text-emerald-500">{complianceRate}%</span>
                    </div>
                    <div className="flex flex-col gap-1 rounded-xl border border-white/60 bg-indigo-50 px-4 py-3 shadow-sm transition-all duration-200 ease-out hover:scale-[1.02] hover:bg-indigo-100/70 hover:shadow-md">
                        <span className="text-xs uppercase tracking-wide text-indigo-600">Top Status</span>
                        <span className="text-lg text-indigo-500">
                            {topStatus ? `${topStatus.name} (${topStatus.value})` : "—"}
                        </span>
                    </div>
                </div>



                <div className="flex w-full flex-1 items-center justify-center">
                    <div className="w-full max-w-xs sm:max-w-sm md:max-w-md flex justify-center">
                        {loading ? (
                            <Center h={240}>
                                <Loader color="purple" size="lg" />
                            </Center>
                        ) : chartData.length ? (
                            <DonutChart
                                h={240}
                                data={chartData}
                                size={320}
                                thickness={48}
                                labelsType="value"
                                chartLabel={`${total ?? 0} Total`}
                            />
                        ) : (
                            <Center h={240}>
                                <Text c="dimmed">Awaiting compliance summary.</Text>
                            </Center>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                    {chartData.map((item) => (
                        <div key={item.name} className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs shadow-sm">
                            <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="text-slate-700">
                                {item.name} <span className="text-xs text-slate-500">({item.value})</span>
                            </span>
                        </div>
                    ))}
                    {!chartData.length && !loading && (
                        <Text size="xs" c="dimmed">No overall status data available.</Text>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default DonutChartFile;

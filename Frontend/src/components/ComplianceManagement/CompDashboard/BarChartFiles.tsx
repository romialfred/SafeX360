import { BarChart } from "@mantine/charts";
import { Card, Center, Loader, Text } from "@mantine/core";
import { IconChartHistogram } from "@tabler/icons-react";
import { DepartmentSummaryEntry } from "../../../services/ComplianceDashboardService";

interface BarChartFilesProps {
    departments: DepartmentSummaryEntry[];
    loading?: boolean;
}

const BarChartFiles = ({ departments, loading = false }: BarChartFilesProps) => {
    const chartData = departments.map((dept) => ({
        department: dept.name,
        Compliant: dept.compliant ?? 0,
        UpComingExpiry: dept.upcoming ?? 0,
        Expired: dept.expired ?? 0,
        Missing: dept.missing ?? 0,
    }));

    const totals = departments.reduce(
        (acc, dept) => {
            acc.compliant += dept.compliant ?? 0;
            acc.upcoming += dept.upcoming ?? 0;
            acc.expired += dept.expired ?? 0;
            acc.missing += dept.missing ?? 0;
            return acc;
        },
        { compliant: 0, upcoming: 0, expired: 0, missing: 0 }
    );

    return (
        <Card
            shadow="xl"
            radius="lg"
            withBorder
            className="flex h-full w-full max-w-3xl flex-col overflow-hidden border-blue-100 bg-gradient-to-br from-white via-indigo-50 to-white"
        >
            <Card.Section
                className="px-6 py-5"
                style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 50%, #ede9fe 100%)' }}
            >
                <div className="flex items-center gap-3 ">
                    <div className="rounded-full bg-white/70 p-2 shadow-sm">
                        <IconChartHistogram size={28} className="text-blue-600" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <Text size="lg" fw={700} c="blue.9">Compliance Status by Department</Text>
                        <Text size="sm" c="blue.7">
                            Monitor how each team is performing against their compliance requirements.
                        </Text>
                    </div>
                </div>
            </Card.Section>

            <div className="flex flex-1 flex-col items-center gap-6 px-6 py-6">
                <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex flex-col gap-1 rounded-xl border border-white/60 bg-green-50 px-4 py-3 shadow-sm transition-all duration-200 ease-out hover:scale-[1.02] hover:bg-green-100/70 hover:shadow-md">
                        <span className="text-xs font-semibold uppercase tracking-wide text-green-700">Compliant</span>
                        <span className="text-2xl font-semibold text-green-600">{totals.compliant}</span>
                    </div>
                    <div className="flex flex-col gap-1 rounded-xl border border-white/60 bg-orange-50 px-4 py-3 shadow-sm transition-all duration-200 ease-out hover:scale-[1.02] hover:bg-orange-100/70 hover:shadow-md">
                        <span className="text-xs font-semibold uppercase tracking-wide text-orange-600">Upcoming</span>
                        <span className="text-2xl font-semibold text-orange-500">{totals.upcoming}</span>
                    </div>
                    <div className="flex flex-col gap-1 rounded-xl border border-white/60 bg-red-50 px-4 py-3 shadow-sm transition-all duration-200 ease-out hover:scale-[1.02] hover:bg-red-100/70 hover:shadow-md">
                        <span className="text-xs font-semibold uppercase tracking-wide text-red-600">Expired</span>
                        <span className="text-2xl font-semibold text-red-500">{totals.expired}</span>
                    </div>
                    <div className="flex flex-col gap-1 rounded-xl border border-white/60 bg-slate-50 px-4 py-3 shadow-sm transition-all duration-200 ease-out hover:scale-[1.02] hover:bg-slate-100/70 hover:shadow-md">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">Missing</span>
                        <span className="text-2xl font-semibold text-gray-600">{totals.missing}</span>
                    </div>
                </div>

                <div className="w-full max-w-2xl mx-auto flex-1">
                    {loading ? (
                        <Center h={320}>
                            <Loader color="blue" size="lg" />
                        </Center>
                    ) : chartData.length ? (
                        <BarChart
                            h={450}
                            data={chartData}
                            dataKey="department"
                            type="stacked"
                            orientation="vertical"
                            xAxisProps={{ tickLine: false, stroke: "#94a3b8" }}
                            yAxisProps={{ width: 80, tickLine: false, stroke: "#94a3b8" }}
                            withLegend
                            legendProps={{ verticalAlign: 'bottom', height: 60 }}
                            gridAxis="y"
                            gridColor="#e2e8f0"
                            barProps={{ radius: 6 }}
                            series={[
                                { name: 'Compliant', color: '#0ea5e9' },
                                { name: 'UpComingExpiry', color: '#facc15' },
                                { name: 'Expired', color: '#f97316' },
                                { name: 'Missing', color: '#94a3b8' },
                            ]}
                        />
                    ) : (
                        <Center h={320}>
                            <Text c="dimmed">No department summary data available.</Text>
                        </Center>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default BarChartFiles;

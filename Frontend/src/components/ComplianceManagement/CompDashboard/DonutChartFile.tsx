import { DonutChart } from "@mantine/charts";
import { Center, Loader } from "@mantine/core";
import { IconChartPie } from "@tabler/icons-react";
import { StatusBreakdownEntry } from "../../../services/ComplianceDashboardService";
import EmptyState from "../../UtilityComp/EmptyState";
import { BUCKET_CONFIG, bucketFromBackendStatus } from "../complianceLabels";

interface DonutChartFileProps {
    data: StatusBreakdownEntry[];
    total: number;
    loading?: boolean;
}

/**
 * Vue d'ensemble des statuts — donut + taux de conformité au centre (LOT 49).
 */
const DonutChartFile = ({ data, total, loading = false }: DonutChartFileProps) => {
    const chartData = data
        .map((item) => {
            const bucket = bucketFromBackendStatus(item.status);
            return {
                name: BUCKET_CONFIG[bucket].label,
                value: item.count ?? 0,
                color: BUCKET_CONFIG[bucket].hex,
            };
        })
        .filter((item) => item.value > 0);

    const compliantCount = data
        .filter((item) => bucketFromBackendStatus(item.status) === 'compliant')
        .reduce((sum, item) => sum + (item.count ?? 0), 0);
    const complianceRate = total ? Math.round((compliantCount / total) * 100) : 0;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 h-full flex flex-col">
            <div className="flex items-center gap-2.5 mb-3">
                <span className="inline-flex p-1.5 rounded-md bg-teal-50 text-teal-700">
                    <IconChartPie size={16} stroke={1.8} aria-hidden="true" />
                </span>
                <div>
                    <h3
                        className="text-slate-800"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontSize: '14.5px',
                            fontWeight: 600,
                            letterSpacing: '-0.01em',
                        }}
                    >
                        Vue d'ensemble des statuts
                    </h3>
                    <p className="text-[11.5px] text-slate-500">
                        Répartition des {total || 0} affectations réglementaires suivies à date.
                    </p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                {loading ? (
                    <Center h={240}>
                        <Loader color="teal" size="sm" />
                    </Center>
                ) : chartData.length ? (
                    <>
                        <DonutChart
                            h={230}
                            data={chartData}
                            size={210}
                            thickness={26}
                            paddingAngle={2}
                            withTooltip
                            tooltipDataSource="segment"
                            chartLabel={`${complianceRate}% conforme`}
                            styles={{
                                label: {
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontSize: 16,
                                    fontWeight: 600,
                                    fill: '#0f172a',
                                },
                            }}
                        />
                        <div className="flex flex-wrap justify-center gap-2">
                            {chartData.map((item) => (
                                <span
                                    key={item.name}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50/60 px-2 py-1 text-[11.5px] text-slate-700"
                                >
                                    <span
                                        className="inline-block h-2 w-2 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                    <span className="text-slate-400">({item.value})</span>
                                </span>
                            ))}
                        </div>
                    </>
                ) : (
                    <EmptyState
                        icon={<IconChartPie size={22} />}
                        title="Aucune donnée de conformité"
                        description="Le suivi démarre dès que des exigences sont affectées aux postes."
                        compact
                    />
                )}
            </div>
        </div>
    );
};

export default DonutChartFile;

import { BarChart } from "@mantine/charts";
import { Center, Loader } from "@mantine/core";
import { IconChartHistogram } from "@tabler/icons-react";
import { DepartmentSummaryEntry } from "../../../services/ComplianceDashboardService";
import EmptyState from "../../UtilityComp/EmptyState";
import { BUCKET_CONFIG } from "../complianceLabels";

interface BarChartFilesProps {
    departments: DepartmentSummaryEntry[];
    loading?: boolean;
}

/**
 * Conformité par département — barres empilées horizontales (LOT 49).
 * Palette charte R7 : emerald / amber / rose / slate.
 */
const BarChartFiles = ({ departments, loading = false }: BarChartFilesProps) => {
    const chartData = departments.map((dept) => ({
        department: dept.name,
        [BUCKET_CONFIG.compliant.label]: dept.compliant ?? 0,
        [BUCKET_CONFIG.upcoming.label]: dept.upcoming ?? 0,
        [BUCKET_CONFIG.expired.label]: dept.expired ?? 0,
        [BUCKET_CONFIG.missing.label]: dept.missing ?? 0,
    }));

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 h-full flex flex-col">
            <div className="flex items-center gap-2.5 mb-3">
                <span className="inline-flex p-1.5 rounded-md bg-teal-50 text-teal-700">
                    <IconChartHistogram size={16} stroke={1.8} aria-hidden="true" />
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
                        Conformité par département
                    </h3>
                    <p className="text-[11.5px] text-slate-500">
                        Affectations réglementaires par statut, sur la base des postes occupés.
                    </p>
                </div>
            </div>

            <div className="flex-1">
                {loading ? (
                    <Center h={300}>
                        <Loader color="teal" size="sm" />
                    </Center>
                ) : chartData.length ? (
                    <BarChart
                        h={Math.max(260, chartData.length * 44 + 80)}
                        data={chartData}
                        dataKey="department"
                        type="stacked"
                        orientation="vertical"
                        xAxisProps={{ tickLine: false, stroke: "#cbd5e1", fontSize: 11 }}
                        yAxisProps={{ width: 110, tickLine: false, stroke: "#cbd5e1", fontSize: 11 }}
                        withLegend
                        legendProps={{ verticalAlign: 'bottom', height: 36 }}
                        gridAxis="x"
                        gridColor="#f1f5f9"
                        barProps={{ radius: 3, barSize: 18 }}
                        series={[
                            { name: BUCKET_CONFIG.compliant.label, color: BUCKET_CONFIG.compliant.hex },
                            { name: BUCKET_CONFIG.upcoming.label, color: BUCKET_CONFIG.upcoming.hex },
                            { name: BUCKET_CONFIG.expired.label, color: BUCKET_CONFIG.expired.hex },
                            { name: BUCKET_CONFIG.missing.label, color: BUCKET_CONFIG.missing.hex },
                        ]}
                    />
                ) : (
                    <EmptyState
                        icon={<IconChartHistogram size={22} />}
                        title="Aucune donnée par département"
                        description="Les affectations par poste alimentent ce graphique dès qu'elles existent."
                        compact
                    />
                )}
            </div>
        </div>
    );
};

export default BarChartFiles;

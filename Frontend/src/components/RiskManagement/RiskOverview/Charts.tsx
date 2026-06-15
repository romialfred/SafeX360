import React from 'react';
import { Text } from '@mantine/core';
import { BarChart, DonutChart } from '@mantine/charts';
import { useTranslation } from 'react-i18next';
import {
    MATRIX_LEVEL_GRID,
    PROBABILITY_LABELS_FR,
    RISK_LEVEL_CONFIG,
    SEVERITY_LABELS_FR,
} from '../riskLabels';

/**
 * Graphiques de la vue d'ensemble des risques (LOT 50) : donuts de
 * répartition, matrice probabilité × gravité et fréquence par probabilité.
 */

type DonutDatum = { name: string; value: number; color: string };

interface ChartsProps {
    leftDonutTitle: string;
    rightDonutTitle: string;
    leftDonutData: DonutDatum[];
    rightDonutData: DonutDatum[];
    matrixCounts: number[][]; // [prob-1][gravité-1]
    probabilityLabels?: string[];
    severityLabels?: string[];
    frequencyChartData: { probability: string; count: number }[];
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3
        className="text-slate-800 mb-3"
        style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
        }}
    >
        {children}
    </h3>
);

const DonutCard = ({ title, data }: { title: string; data: DonutDatum[] }) => {
    const { t } = useTranslation('risk');
    const total = data.reduce((acc, d) => acc + (Number(d.value) || 0), 0);
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
            <SectionTitle>{title}</SectionTitle>
            {data.length === 0 ? (
                <p className="text-[12.5px] text-slate-500 py-6 text-center">{t('dashboard.donutEmpty')}</p>
            ) : (
                <div className="grid grid-cols-3 gap-2 items-center">
                    <div className="col-span-2 flex items-center justify-center">
                        <div className="relative inline-flex items-center justify-center">
                            <DonutChart data={data} thickness={36} withTooltip />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <Text size="sm" className="!text-slate-700 tabular-nums">
                                    {total}
                                </Text>
                            </div>
                        </div>
                    </div>
                    <ul className="flex flex-col gap-1.5">
                        {data.map((cell) => (
                            <li key={cell.name} className="flex items-center gap-1.5 min-w-0">
                                <span
                                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                                    style={{ backgroundColor: cell.color }}
                                    aria-hidden="true"
                                />
                                <span className="text-[11.5px] text-slate-600 truncate" title={cell.name}>
                                    {cell.name}
                                </span>
                                <span className="text-[11.5px] text-slate-400 ml-auto tabular-nums">{cell.value}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const Charts: React.FC<ChartsProps> = ({
    leftDonutTitle,
    rightDonutTitle,
    leftDonutData,
    rightDonutData,
    matrixCounts,
    probabilityLabels,
    severityLabels,
    frequencyChartData,
}) => {
    const { t } = useTranslation('risk');
    const leftColors = ['#0E7490', '#D97706', '#059669', '#7C3AED', '#0284C7'];
    const rightColors = ['#0284C7', '#0D9488', '#E11D48', '#7C3AED', '#CA8A04'];
    const coloredLeft = leftDonutData.map((d, idx) => ({ ...d, color: d.color || leftColors[idx % leftColors.length] }));
    const coloredRight = rightDonutData.map((d, idx) => ({ ...d, color: d.color || rightColors[idx % rightColors.length] }));

    const probLabels = probabilityLabels?.length === 5 ? probabilityLabels : PROBABILITY_LABELS_FR;
    const sevLabels = severityLabels?.length === 5 ? severityLabels : SEVERITY_LABELS_FR;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DonutCard title={leftDonutTitle} data={coloredLeft} />
                <DonutCard title={rightDonutTitle} data={coloredRight} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4">
                    <SectionTitle>{t('dashboard.matrixTitle')}</SectionTitle>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[640px]">
                            <thead>
                                <tr>
                                    <th className="p-2 bg-slate-50 border border-slate-200 text-left text-[12px] font-medium text-slate-600 w-40">
                                        {t('dashboard.matrixHeader')}
                                    </th>
                                    {sevLabels.map((severity) => (
                                        <th
                                            key={severity}
                                            className="p-2 bg-slate-50 border border-slate-200 text-center text-[12px] font-medium text-slate-600"
                                        >
                                            {severity}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {probLabels.map((probability, pIdx) => (
                                    <tr key={probability}>
                                        <td className="p-2 bg-slate-50 border border-slate-200 text-[12px] text-slate-600">
                                            {probability}
                                        </td>
                                        {sevLabels.map((_s, gIdx) => {
                                            const level = MATRIX_LEVEL_GRID[pIdx][gIdx];
                                            const cfg = RISK_LEVEL_CONFIG[level];
                                            const count = matrixCounts?.[pIdx]?.[gIdx] ?? 0;
                                            return (
                                                <td
                                                    key={gIdx}
                                                    className={`p-1.5 border border-slate-200 text-center h-11 align-middle ${cfg?.cell ?? 'bg-slate-50 text-slate-600'}`}
                                                >
                                                    <div className="text-[10px] uppercase tracking-wider leading-none mb-1 opacity-80">
                                                        {t(`level.${level}`, { defaultValue: cfg?.label ?? level })}
                                                    </div>
                                                    <div className="text-[14px] leading-none font-medium tabular-nums">{count}</div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-[11.5px] text-slate-500 mt-2 text-center">
                        {t('dashboard.matrixCaption')}
                    </p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <SectionTitle>{t('dashboard.frequencyTitle')}</SectionTitle>
                    <BarChart
                        h={300}
                        data={frequencyChartData}
                        dataKey="probability"
                        series={[{ name: 'count', label: t('dashboard.frequencySeriesLabel'), color: '#0F766E' }]}
                        orientation="horizontal"
                        gridAxis="none"
                        withBarValueLabel
                        xAxisProps={{ tickCount: 4 }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Charts;

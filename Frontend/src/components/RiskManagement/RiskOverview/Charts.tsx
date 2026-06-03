import React from 'react';
import { Box, Grid, Card, Title, Badge, Text, Stack } from '@mantine/core';
import { BarChart, DonutChart } from '@mantine/charts';

type DonutDatum = { name: string; value: number; color?: string };

interface ChartsProps {
    leftDonutTitle: string;
    rightDonutTitle: string;
    leftDonutData: DonutDatum[];
    rightDonutData: DonutDatum[];
    matrixCounts: number[][]; // [prob-1][sev-1]
    probabilityLabels?: string[];
    severityLabels?: string[];
    frequencyChartData: { probability: string; count: number }[];
}

const Charts: React.FC<ChartsProps> = ({ leftDonutTitle, rightDonutTitle, leftDonutData, rightDonutData, matrixCounts, probabilityLabels, severityLabels, frequencyChartData }) => {
    const leftColors = ['#1971C2', '#FF922B', '#51CF66', '#A55EEA', '#339AF0'];
    const rightColors = ['#339AF0', '#12B886', '#E64980', '#7950F2', '#FCC419'];
    const coloredLeft = leftDonutData.map((d, idx) => ({ ...d, color: d.color || leftColors[idx % leftColors.length] }));
    const coloredRight = rightDonutData.map((d, idx) => ({ ...d, color: d.color || rightColors[idx % rightColors.length] }));

    return (
        <Box mb="md">
            <Grid mb="md" gutter="md">
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card shadow="sm" padding="md" radius="md" withBorder>
                        <Title order={5} mb="sm">{leftDonutTitle}</Title>
                        <div className="grid grid-cols-3">
                            <div className='col-span-2 flex items-center justify-center'>
                                <div className="relative inline-flex items-center justify-center">
                                    <DonutChart data={coloredLeft} thickness={40} withTooltip />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <Text size="sm">
                                            {coloredLeft.reduce((acc, d) => acc + (Number(d.value) || 0), 0)}
                                        </Text>
                                    </div>
                                </div>
                            </div>
                            <Stack gap="sm" mt="sm">
                                {coloredLeft.map(cell => (
                                    <Badge key={cell.name} color={cell.color} variant="outline">{cell.name}</Badge>
                                ))}
                            </Stack>
                        </div>
                    </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card shadow="sm" padding="md" radius="md" withBorder>
                        <Title order={5} mb="sm">{rightDonutTitle}</Title>
                        <div className="grid grid-cols-3">
                            <div className='col-span-2 flex items-center justify-center'>
                                <div className="relative inline-flex items-center justify-center">
                                    <DonutChart data={coloredRight} thickness={40} withTooltip />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <Text size="sm">
                                            {coloredRight.reduce((acc, d) => acc + (Number(d.value) || 0), 0)}
                                        </Text>
                                    </div>
                                </div>
                            </div>
                            <Stack gap="sm" mt="sm">
                                {coloredRight.map(cell => (
                                    <Badge key={cell.name} color={cell.color} variant="outline">{cell.name}</Badge>
                                ))}
                            </Stack>
                        </div>
                    </Card>
                </Grid.Col>
            </Grid>

            <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Card shadow="sm" padding="md" radius="md" withBorder>
                        <Title order={5} mb="sm">Risk Matrix</Title>
                        <Box style={{ overflowX: 'auto' }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '700px' }}>
                                <thead>
                                    <tr>
                                        <th style={{ border: '1px solid #dee2e6', padding: '6px', backgroundColor: '#f8f9fa', fontWeight: 'bold', fontSize: '12px', width: '160px' }}>
                                            Probability / Severity
                                        </th>
                                        {(severityLabels || ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic']).map(severity => (
                                            <th key={severity} style={{ border: '1px solid #dee2e6', padding: '6px', backgroundColor: '#f8f9fa', fontWeight: 'bold', textAlign: 'center', fontSize: '12px', width: '110px' }}>
                                                {severity}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(probabilityLabels || ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain']).map((probability, pIdx) => (
                                        <tr key={probability}>
                                            <td style={{ border: '1px solid #dee2e6', padding: '6px', backgroundColor: '#f8f9fa', fontWeight: 'bold', fontSize: '12px' }}>{probability}</td>
                                            {(severityLabels || ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic']).map((severity, sIdx) => {
                                                const levelGrid = [
                                                    ['Low', 'Low', 'Low', 'Low', 'Low Med'],
                                                    ['Low', 'Low', 'Low Med', 'Low Med', 'Medium'],
                                                    ['Low', 'Low Med', 'Low Med', 'Medium', 'Med High'],
                                                    ['Low', 'Low Med', 'Medium', 'Med High', 'High'],
                                                    ['Low Med', 'Medium', 'Med High', 'High', 'High'],
                                                ];
                                                const levelToColor: Record<string, string> = {
                                                    'Low': '#51CF66',
                                                    'Low Med': '#94D82D',
                                                    'Medium': '#FFD43B',
                                                    'Med High': '#FF922B',
                                                    'High': '#FF6B6B'
                                                };
                                                const level = levelGrid[pIdx]?.[sIdx] || 'Low';
                                                const bg = levelToColor[level] || '#51CF66';
                                                const count = matrixCounts?.[pIdx]?.[sIdx] ?? 0;
                                                return (
                                                    <td key={severity} style={{ border: '1px solid #dee2e6', padding: '6px', backgroundColor: bg, textAlign: 'center', color: (level === 'Low' || level === 'Low Med') ? '#000' : '#fff', fontWeight: 'bold', height: '44px', verticalAlign: 'middle' }}>
                                                        <div style={{ fontSize: '12px', marginBottom: '1px' }}>{level}</div>
                                                        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{count || ''}</div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Box>
                        <Text size="xs" c="dimmed" mt="sm" ta="center">Numbers in cells represent the count of risks in each probability/severity combination</Text>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 4 }}>
                    <Card shadow="sm" padding="md" radius="md" withBorder>
                        <Title order={5} mb="sm">Risk frequency</Title>
                        <Box h={300}>
                            <BarChart
                                h={300}
                                data={frequencyChartData}
                                dataKey="probability"
                                series={[{ name: 'count', label: 'Count', color: '#1971C2' }]}
                                orientation="horizontal"
                                gridAxis="none"
                                withBarValueLabel
                                xAxisProps={{ tickCount: 4 }}
                            />
                        </Box>
                    </Card>
                </Grid.Col>
            </Grid>
        </Box>
    );
};

export default Charts;

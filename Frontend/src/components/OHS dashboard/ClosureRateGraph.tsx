import { BarChart } from "@mantine/charts";
import { Alert, Badge, Box, Card, Center, Grid, Group, Loader, Paper, Select, Stack, Text } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getYearlyClosureSummary, type YearlyClosureResponse } from "../../services/IncidentService";

type MonthlyClosure = YearlyClosureResponse;

const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

const buildEmptyDataset = (): MonthlyClosure[] => monthOrder.map((month) => ({
    date: month,
    totalIncidents: 0,
    closedIncidents: 0,
}));

const ClosureRateGraph = () => {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
    const [data, setData] = useState<MonthlyClosure[]>(buildEmptyDataset());
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const years = useMemo(() => {
        return [currentYear, currentYear - 1].map((year) => year.toString());
    }, [currentYear]);

    const fetchYearlyData = useCallback(async (year: number) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getYearlyClosureSummary(year);
            if (!Array.isArray(response) || response.length === 0) {
                setData(buildEmptyDataset());
                return;
            }
            const monthMap = new Map(response.map((entry) => [entry.date, entry] as const));
            const normalized = monthOrder.map((month) => {
                const entry = monthMap.get(month);
                return {
                    date: month,
                    totalIncidents: entry?.totalIncidents ?? 0,
                    closedIncidents: entry?.closedIncidents ?? 0,
                };
            });
            setData(normalized);
        } catch (_err) {
            setError("Unable to load closure data. Please try again later.");
            setData(buildEmptyDataset());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const parsedYear = Number(selectedYear);
        fetchYearlyData(Number.isFinite(parsedYear) ? parsedYear : currentYear);
    }, [selectedYear, fetchYearlyData, currentYear]);

    const totals = useMemo(() => {
        const totalIncidents = data.reduce((acc, month) => acc + month.totalIncidents, 0);
        const closedIncidents = data.reduce((acc, month) => acc + month.closedIncidents, 0);
        const closureRate = totalIncidents ? Math.round((closedIncidents / totalIncidents) * 100) : 0;
        return { totalIncidents, closedIncidents, closureRate };
    }, [data]);

    const yAxisMax = useMemo(() => {
        const peak = data.reduce((acc, month) => Math.max(acc, month.totalIncidents, month.closedIncidents), 0);
        if (peak === 0) return 5;
        const step = 5;
        return Math.ceil((peak + 1) / step) * step;
    }, [data]);

    return (
        <Card shadow="sm" p="lg" radius="md" withBorder>
            <Stack gap="md">
                <Group justify="space-between" align="flex-start" gap="xl">
                    <Stack gap={4}>
                        <Text size="xl" c="gray.7">Incident Management & Closure Rate</Text>
                        <Text size="sm" c="gray.5">
                            Monitor monthly totals versus resolved incidents to understand overall performance.
                        </Text>
                    </Stack>
                    <Select
                        // label="Year"
                        placeholder="Select year"
                        data={years.map((year) => ({ value: year, label: year }))}
                        value={selectedYear}
                        onChange={(value) => value && setSelectedYear(value)}
                        allowDeselect={false}
                        size="sm"
                        w={140}
                    />
                </Group>

                {error && (
                    <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md">
                        {error}
                    </Alert>
                )}

                <Paper withBorder radius="md" p="md" shadow="xs">
                    <Group gap="lg" justify="space-between" wrap="wrap">
                        <Stack gap={2}>
                            <Text size="sm" c="gray.6">Selected Year</Text>
                            <Badge variant="light" color="red" size="lg" radius="md">{selectedYear}</Badge>
                        </Stack>
                        <Box className="hidden sm:block" style={{ width: 1, height: 48, background: 'var(--mantine-color-gray-2)' }} />
                        <Stack gap={2}>
                            <Text size="sm" c="gray.6">Total Incidents</Text>
                            <Text size="lg">{totals.totalIncidents}</Text>
                        </Stack>
                        <Box className="hidden sm:block" style={{ width: 1, height: 48, background: 'var(--mantine-color-gray-2)' }} />
                        <Stack gap={2}>
                            <Text size="sm" c="gray.6">Closed Incidents</Text>
                            <Text size="lg" c="green.6">{totals.closedIncidents}</Text>
                        </Stack>
                        <Box className="hidden sm:block" style={{ width: 1, height: 48, background: 'var(--mantine-color-gray-2)' }} />
                        <Stack gap={2}>
                            <Text size="sm" c="gray.6">Closure Rate</Text>
                            <Text size="lg">{totals.closureRate}%</Text>
                        </Stack>
                    </Group>
                </Paper>

                <Grid grow gutter={40}>
                    <Grid.Col span={12}>
                        <Box>
                            {loading ? (
                                <Center h={360}>
                                    <Loader color="red" />
                                </Center>
                            ) : (
                                <BarChart
                                    h={360}
                                    data={data}
                                    dataKey="date"
                                    yAxisProps={{ domain: [0, yAxisMax] }}
                                    series={[
                                        { name: 'totalIncidents', label: 'Total Incidents', color: 'gray.6' },
                                        { name: 'closedIncidents', label: 'Closed Incidents', color: 'green.5' }
                                    ]}
                                    tickLine="xy"
                                    gridAxis="none"
                                    withLegend
                                    legendProps={{ verticalAlign: 'top', align: 'right' }}
                                    barProps={{ radius: 6, barSize: 18 }}
                                    xAxisLabel="Month"
                                    yAxisLabel="Number of Incidents"
                                />
                            )}
                        </Box>
                    </Grid.Col>
                </Grid>
            </Stack>
        </Card>
    );
};

export default ClosureRateGraph;

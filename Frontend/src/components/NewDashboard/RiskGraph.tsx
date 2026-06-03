import { LineChart } from "@mantine/charts";
import { Box, Card, Grid, Stack, Text } from "@mantine/core";

const RiskGraph = () => {
    const data = [
        {
            date: 'Jan',
            SafetyScore: 65,
            RiskLevel: 75

        },
        {
            date: 'Feb',
            SafetyScore: 70,
            RiskLevel: 65
        },
        {
            date: 'Mar',
            SafetyScore: 75,
            RiskLevel: 55
        },
        {
            date: 'Apr',
            SafetyScore: 80,
            RiskLevel: 45
        },
        {
            date: 'May',
            SafetyScore: 85,
            RiskLevel: 40
        },
        {
            date: 'June',
            SafetyScore: 90,
            RiskLevel: 35
        },

    ];

    return (
        <Card shadow="sm" p="lg" radius="md" withBorder className="">
            <Stack gap="sm">
                <div className="flex justify-between p-5">
                    <div>

                        <Text size="xl">Risk Trends & Safety Performance</Text>
                    </div>

                </div>
            </Stack>

            <Grid mt="md" grow gutter={50}>
                <Grid.Col span={8}>
                    <Box>
                        <LineChart
                            h={350}
                            data={data}
                            dataKey="date"
                            yAxisProps={{ domain: [30, 90] }}
                            series={[
                                { name: 'SafetyScore', color: 'indigo.6' },
                                { name: 'RiskLevel', color: 'red.6' }

                            ]}
                            tickLine="xy"
                            withLegend
                            withPointLabels


                        />
                    </Box>
                </Grid.Col>
            </Grid>
        </Card>
    )
}

export default RiskGraph
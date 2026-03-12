import { BarChart } from "@mantine/charts";
import { Box, Card, Grid, Stack, Text } from "@mantine/core";


const IncidentGraph = () => {
    const data = [
        {
            date: 'Jan',
            ClosedIncidents: 10,
            TotalIncidents: 12

        },
        {
            date: 'Feb',
            ClosedIncidents: 13,
            TotalIncidents: 15
        },
        {
            date: 'Mar',
            ClosedIncidents: 9,
            TotalIncidents: 10
        },
        {
            date: 'Apr',
            ClosedIncidents: 7,
            TotalIncidents: 8
        },
        {
            date: 'May',
            ClosedIncidents: 12,
            TotalIncidents: 14
        },
        {
            date: 'June',
            ClosedIncidents: 8,
            TotalIncidents: 9
        },
        {
            date: 'July',
            ClosedIncidents: 6,
            TotalIncidents: 7
        },
        {
            date: 'Aug',
            ClosedIncidents: 9,
            TotalIncidents: 11
        },
        {
            date: 'Sept',
            ClosedIncidents: 11,
            TotalIncidents: 13
        },
        {
            date: 'Oct',
            ClosedIncidents: 6,
            TotalIncidents: 6
        },
        {
            date: 'Nov',
            ClosedIncidents: 7,
            TotalIncidents: 8
        },
        {
            date: 'Dec',
            ClosedIncidents: 8,
            TotalIncidents: 10
        },

    ];
    return (
        <Card shadow="sm" p="lg" radius="md" withBorder className=" ">
            <Stack gap="sm">
                <div className="flex justify-between p-5">
                    <div>

                        <Text size="xl" fw={700}>Incident Trends & Closure Rate</Text>
                    </div>

                </div>
            </Stack>

            <Grid mt="md" grow gutter={50}>
                <Grid.Col span={8}>
                    <Box>
                        <BarChart
                            h={400}
                            data={data}
                            dataKey="date"
                            yAxisProps={{ domain: [0, 16] }}
                            series={[
                                { name: 'TotalIncidents', label: 'Total Incidents', color: 'red.6' },
                                { name: 'ClosedIncidents', label: 'Closed Incidents', color: 'indigo.6' }

                            ]}
                            tickLine="xy"
                            withLegend
                            xAxisLabel="Month"
                            yAxisLabel="Number of Incidents"
                            legendProps={{ verticalAlign: 'top' }}



                        />
                    </Box>
                </Grid.Col>
            </Grid>
        </Card>
    )
}

export default IncidentGraph
import { useState } from 'react';
import { Select, Card, Grid, Box, Text, Button, Stack, Avatar } from '@mantine/core';
import { useMantineTheme } from '@mantine/core';
import { IconGridDots } from '@tabler/icons-react';
import { LineChart } from '@mantine/charts';

const RevenueUpdates = () => {
    const [month, setMonth] = useState('1');
    const theme = useMantineTheme();
    const primary = theme.colors.blue[6];
    const secondary = theme.colors.red[6];

    const data = [
        {
            "date": 'Mar 22',
            "Apples": 2890,
            "Oranges": 2338,
            "Tomatoes": 2452,
        },
        {
            "date": 'Mar 23',
            "Apples": 2756,
            "Oranges": 2103,
            "Tomatoes": 2402,
        },
        {
            "date": 'Mar 24',
            "Apples": 3322,
            "Oranges": 986,
            "Tomatoes": 1821,
        },
        {
            "date": 'Mar 25',
            "Apples": 3470,
            "Oranges": 2108,
            "Tomatoes": 2809,
        },
        {
            "date": 'Mar 26',
            "Apples": 3129,
            "Oranges": 1726,
            "Tomatoes": 2290,
        },
    ];

    return (
        <>

            <Card shadow="sm" p="lg" radius="md" withBorder >

                <Stack gap="sm" >
                    <div className='flex justify-between p-5'>
                        <div>
                            <Text size="lg">Revenue Updates</Text>
                            <Text color="dimmed" size="sm">Overview of Profit</Text>
                        </div>
                        <Select

                            value={month}
                            onChange={(val) => setMonth(val || '1')}
                            data={[
                                { value: '1', label: 'March 2025' },
                                { value: '2', label: 'April 2025' },
                                { value: '3', label: 'May 2025' },
                            ]}
                            size='sm'
                        />
                    </div>
                </Stack>

                <Grid mt="md" grow gutter={50}>

                    <Grid.Col span={8}>
                        <Box>
                            <LineChart
                                h={300}
                                data={data}
                                dataKey="date"
                                series={[
                                    { name: 'Apples', color: "indigo.6" },
                                    { name: 'Oranges', color: "blue.6" },
                                    { name: 'Tomatoes', color: "teal.6" },
                                ]}
                                curveType="natural"
                                withLegend
                                withPointLabels
                                tickLine='xy'

                            />

                        </Box>
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <Stack gap="xl" justify="space-between" align='stretch'>
                            <Stack style={{ flexDirection: 'row' }} gap="sm" align="center">
                                <Box p="xs" bg={theme.colors.blue[1]} style={{ borderRadius: '8px' }}> {/* ✅ radius fix */}
                                    <IconGridDots color={primary} size={20} />
                                </Box>
                                <Box>
                                    <Text size="xl">$63,489.50</Text>
                                    <Text size="sm" color="dimmed">Total Earnings</Text>
                                </Box>
                            </Stack>

                            <Stack>
                                <Stack style={{ flexDirection: 'row' }} gap="sm" align="center">
                                    <Avatar size={10} color={primary} />
                                    <Box>
                                        <Text size="sm" color="dimmed">Earnings this month</Text>
                                        <Text size="lg">$48,820</Text>
                                    </Box>
                                </Stack>
                                <Stack style={{ flexDirection: 'row' }} gap="sm" align="center">
                                    <Avatar size={10} color={secondary} />
                                    <Box>
                                        <Text size="sm" color="dimmed">Expense this month</Text>
                                        <Text size="lg">$26,498</Text>
                                    </Box>
                                </Stack>
                            </Stack>

                            <Button fullWidth color="blue">View Full Report</Button>
                        </Stack>
                    </Grid.Col>

                </Grid>
            </Card>
        </>
    );
};

export default RevenueUpdates;

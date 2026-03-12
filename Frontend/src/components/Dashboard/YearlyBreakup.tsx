
import { Card, Grid, Box, Text, Avatar, Stack } from '@mantine/core';
import { useMantineTheme } from '@mantine/core';
import { IconArrowUpLeft } from '@tabler/icons-react';
import { DonutChart } from '@mantine/charts';

const YearlyBreakup = () => {
    const theme = useMantineTheme();
    const primary = theme.colors.blue[6];
    const primaryLight = theme.colors.blue[3];
    const successLight = theme.colors.green[3];

    const data = [
        { name: '2022', value: 38, color: primary },
        { name: '2023', value: 40, color: primaryLight },
        { name: '2024', value: 25, color: theme.colors.gray[2] },
    ];

    return (
        <Card shadow="sm" p="md" radius="md" withBorder  >
            <Text size="xl" fw={700} mb="sm">Yearly Breakup</Text>
            <Grid>
                <Grid.Col span={7}>
                    <Text size="lg" fw={700}>$36,358</Text>
                    <Stack gap="md" mt="sm" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <Avatar size={27} radius="xl" style={{ backgroundColor: successLight }}>
                            <IconArrowUpLeft size={20} color="#39B69A" />
                        </Avatar>
                        <Text size="sm" fw={600}>+9%</Text>
                        <Text size="sm" color="dimmed">last year</Text>
                    </Stack>
                    <Stack gap="sm" mt="lg" style={{ display: 'flex', flexDirection: 'row' }}>
                        <Stack gap="xs" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                            <Avatar size={9} radius="xl" style={{ backgroundColor: primary }} />
                            <Text size="sm" color="dimmed">2022</Text>
                        </Stack>
                        <Stack gap="xs" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                            <Avatar size={9} radius="xl" style={{ backgroundColor: primaryLight }} />
                            <Text size="sm" color="dimmed">2023</Text>
                        </Stack>
                    </Stack>
                </Grid.Col>

                <Grid.Col span={5}>
                    <Box>
                        <DonutChart
                            size={200}
                            data={data}
                        />
                    </Box>
                </Grid.Col>
            </Grid>
        </Card>
    );
};

export default YearlyBreakup;
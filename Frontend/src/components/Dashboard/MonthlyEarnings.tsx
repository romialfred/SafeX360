
import { Sparkline } from '@mantine/charts';
import { Card, Stack, Text, Avatar, Button, Box } from '@mantine/core';
import { useMantineTheme } from '@mantine/core';
import { IconArrowDownRight, IconCurrencyDollar } from '@tabler/icons-react';

const MonthlyEarnings = () => {
    const theme = useMantineTheme();


    const errorLight = theme.colors.red[3];



    return (
        <Card shadow="sm" p="md" radius="md" withBorder >
            <Stack gap="xs">
                <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text size="md" fw={700}>Monthly Earnings</Text>
                    <Button color="primary" radius="xl" size="sm">
                        <IconCurrencyDollar size={24} />
                    </Button>
                </Box>

                <Text size="md" fw={700}>$6,820</Text>

                <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Avatar size={27} radius="xl" style={{ backgroundColor: errorLight }}>
                        <IconArrowDownRight size={20} color="#FA896B" />
                    </Avatar>
                    <Text size="sm" fw={600}>+9%</Text>
                    <Text size="sm" color="dimmed">last year</Text>
                </Box>

                <Box mt="sm">
                    <Sparkline
                        w={660}
                        h={80}
                        data={[10, 20, 40, 20, 40, 10, 50, 60, 70, 80,]}
                        curveType="natural"
                        color="blue"
                        fillOpacity={0.6}
                        strokeWidth={2}
                    />
                </Box>
            </Stack>
        </Card>
    );
};

export default MonthlyEarnings;
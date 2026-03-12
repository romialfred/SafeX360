import React from 'react';
import { Card, Box, Text, Avatar, Stack } from '@mantine/core';
import { useMantineTheme } from '@mantine/core';
import { IconGridDots } from '@tabler/icons-react';
import { Sparkline } from '@mantine/charts';

interface Stat {
    title: string;
    subtitle: string;
    percent: string;
    color: string;
    lightcolor: string;
    icon: any;
}

const WeeklyStats: React.FC = () => {
    const theme = useMantineTheme();
    const primary = theme.colors.blue[6];
    const primaryLight = theme.colors.blue[3];
    const error = theme.colors.red[6];
    const errorLight = theme.colors.red[3];
    const secondary = theme.colors.green[6];




    const stats: Stat[] = [
        {
            title: 'Top Sales',
            subtitle: 'Johnathan Doe',
            percent: '68',
            color: primary,
            lightcolor: primaryLight,
            icon: <IconGridDots size={18} color='white' />,
        },
        {
            title: 'Best Seller',
            subtitle: 'Footware',
            percent: '45',
            color: secondary,
            lightcolor: primary,
            icon: <IconGridDots size={18} color='white' />,
        },
        {
            title: 'Most Commented',
            subtitle: 'Fashionware',
            percent: '14',
            color: error,
            lightcolor: errorLight,
            icon: <IconGridDots size={18} color='white' />,
        },
    ];

    return (
        <Card shadow="sm" p="lg" radius="md" withBorder>
            <Text size="lg" fw={700}>Weekly Stats</Text>
            <Text size="sm" color="dimmed">Average sales</Text>

            <Box mt="md">
                <Sparkline
                    w={650}
                    h={200}
                    data={[10, 20, 40, 20, 40, 10, 50, 70, 80, 90]}
                    curveType="natural"
                    color="blue"
                    fillOpacity={0.8}
                    strokeWidth={2}
                />
            </Box>

            <Stack mt="md" gap="md">
                {stats.map((stat, i) => (
                    <Box key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Avatar size={40} radius="md" style={{ backgroundColor: stat.lightcolor, color: stat.color }}>
                                {stat.icon}
                            </Avatar>
                            <Box>
                                <Text size="md" fw={600}>{stat.title}</Text>
                                <Text size="sm" color="dimmed">{stat.subtitle}</Text>
                            </Box>
                        </Box>
                        <Avatar size={42} radius="sm" style={{ backgroundColor: stat.lightcolor, color: stat.color }}>
                            <Text size="sm" fw={600} color='white'>+{stat.percent}</Text>
                        </Avatar>
                    </Box>
                ))}
            </Stack>
        </Card>
    );
};

export default WeeklyStats;
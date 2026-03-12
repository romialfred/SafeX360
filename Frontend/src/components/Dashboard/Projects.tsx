
import { Card, Text, Avatar, Box } from '@mantine/core';
import { useMantineTheme } from '@mantine/core';
import { IconArrowUpLeft } from '@tabler/icons-react';
import { BarChart } from '@mantine/charts';

const Projects = () => {
    const theme = useMantineTheme();
    const primary = theme.colors.blue[6];
    const successLight = theme.colors.green[3];

    const data = [
        { week: 'W1', projects: 4 },
        { week: 'W2', projects: 10 },
        { week: 'W3', projects: 9 },
        { week: 'W4', projects: 7 },
        { week: 'W5', projects: 9 },
        { week: 'W6', projects: 10 },
        { week: 'W7', projects: 11 },
        { week: 'W8', projects: 8 },
        { week: 'W9', projects: 10 },
    ];

    return (
        <Card shadow="sm" p="lg" radius="md" withBorder >
            <Text size="sm" fw={500}>Projects</Text>
            <Text size="xl" fw={700}>78,298</Text>
            <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <Avatar size={24} radius="xl" style={{ backgroundColor: successLight }}>
                    <IconArrowUpLeft size={18} color="#39B69A" />
                </Avatar>
                <Text size="sm" fw={600}>+9%</Text>
            </Box>
            <Box mt="sm">
                <BarChart
                    h={150}
                    ml={-15}
                    data={data}
                    dataKey="week"
                    series={[{ name: 'projects', color: primary }]}
                />
            </Box>
        </Card>
    );
};

export default Projects;

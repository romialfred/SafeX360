
import { Sparkline } from '@mantine/charts';
import { Card, Text, Avatar, Box } from '@mantine/core';
import { useMantineTheme } from '@mantine/core';
import { IconArrowDownRight } from '@tabler/icons-react';

const Customers = () => {
    const theme = useMantineTheme();


    const errorLight = theme.colors.red[3];



    return (
        <Card shadow="sm" p="lg" radius="md" withBorder >
            <Text size="sm">Customers</Text>
            <Text size="xl">36,358</Text>
            <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <Avatar size={24} radius="xl" style={{ backgroundColor: errorLight }}>
                    <IconArrowDownRight size={18} color="#FA896B" />
                </Avatar>
                <Text size="sm">+9%</Text>
            </Box>
            <Box mt="sm">
                <Sparkline
                    w={200}
                    h={190}
                    data={[10, 20, 40, 20, 40, 10, 50, 70]}
                    curveType="natural"
                    color="blue"
                    fillOpacity={0.8}
                    strokeWidth={2}
                />
            </Box>
        </Card>
    );
};

export default Customers;

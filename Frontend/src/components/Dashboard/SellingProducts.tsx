import { Card, Box, Text, Stack, Progress, Chip } from '@mantine/core';
import { useMantineTheme } from '@mantine/core';

interface SellsData {
    product: string;
    price: string;
    percent: number;
    color: string;
}

const sells: SellsData[] = [
    {
        product: 'MaterialPro',
        price: '23,568',
        percent: 55,
        color: 'blue',
    },
    {
        product: 'Flexy Admin',
        price: '23,568',
        percent: 20,
        color: 'violet',
    },
];

const SellingProducts = () => {
    const theme = useMantineTheme();

    const primary = theme.colors.blue[6];
    const secondary = theme.colors.violet[6];

    return (
        <Card shadow="sm" p="lg" radius="md" withBorder style={{ backgroundColor: primary }}>
            <Text size="lg" fw={700} color="white">Best selling products</Text>
            <Text size="sm" color="white" mb="md">Overview 2025</Text>

            <Box style={{ textAlign: 'center', marginTop: '16px', marginBottom: '-70px' }}>
                {/* <Image src={SavingsImg} alt="Savings" width={300} mx="auto" /> */}
            </Box>

            <Card shadow="xs" radius="md" mt="xl" p="xl">
                <Stack gap="lg">
                    {sells.map((sell, i) => (
                        <Box key={i}>
                            <Stack gap="xs" justify="space-between" align="center" style={{ display: 'flex', flexDirection: 'row' }}>
                                <Box>
                                    <Text size="md" fw={600}>{sell.product}</Text>
                                    <Text size="sm" color="dimmed">${sell.price}</Text>
                                </Box>
                                <Chip
                                    size="sm"
                                    color={sell.color === 'blue' ? primary : secondary}
                                    variant="filled"
                                >
                                    {sell.percent}%
                                </Chip>
                            </Stack>
                            <Progress value={sell.percent} color={sell.color} mt="xs" />
                        </Box>
                    ))}
                </Stack>
            </Card>
        </Card>
    );
};

export default SellingProducts;

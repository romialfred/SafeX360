
import { Card, Text, Box, Stack } from '@mantine/core';
import { useMantineTheme } from '@mantine/core';
import { BarChart } from '@mantine/charts';

const EmployeeSalary = () => {
    const theme = useMantineTheme();
    const primary = theme.colors.blue[6];
    const primaryLight = theme.colors.gray[2];

    const data = [
        { month: 'Apr', salary: 20, color: primaryLight },
        { month: 'May', salary: 15, color: primaryLight },
        { month: 'June', salary: 30, color: primary },
        { month: 'July', salary: 25, color: primaryLight },
        { month: 'Aug', salary: 10, color: primaryLight },
        { month: 'Sept', salary: 15, color: primaryLight },
    ];

    return (
        <Card shadow="sm" p="md" radius="md" withBorder>

            <div className='flex  justify-between flex-col  '>
                <Text size="lg" >Employee Salary</Text>
                <Text size="sm" color="dimmed">Every month</Text>
            </div>

            <Stack gap={10}>
                <Box className='flex justify-between '>
                    <Text size="sm">Salary: $36,358</Text>
                    <Text size="sm">Profit: $5,296</Text>
                </Box>

                <Box mt="md">
                    <BarChart
                        h={300}
                        data={data}
                        dataKey="month"
                        series={[{ name: 'salary', color: "indigo.6" }]}
                    />
                </Box>
            </Stack>

        </Card >
    );
};

export default EmployeeSalary;
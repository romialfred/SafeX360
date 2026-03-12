import { LineChart } from "@mantine/charts";
import { Box, Button, Card, Grid, Stack, Text, Menu } from "@mantine/core";
import { IconArrowRight, IconFilter } from "@tabler/icons-react";

const WeeklyOverview = () => {
  const data = [
    { days: 'Sun', Overtime: 2890, Working: 2338 },
    { days: 'Mon', Overtime: 2756, Working: 2103 },
    { days: 'Tue', Overtime: 3322, Working: 986 },
    { days: 'Wed', Overtime: 3470, Working: 2108 },
    { days: 'Thu', Overtime: 3129, Working: 1726 },
    { days: 'Fri', Overtime: 3129, Working: 1726 },
    { days: 'Sat', Overtime: 3129, Working: 1726 },
  ];

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Stack gap="sm">
        <div className="flex justify-between p-5">
          <div>
            <Text color="dimmed" size="sm">Working Hours</Text>
            <Text size="lg" fw={700}>Weekly Overview</Text>
          </div>
          <div className="flex gap-5 items-center">
            <Menu>
              <Menu.Target>
                <IconFilter
                  stroke={2}
                  size={50}
                  className="text-blue-500 bg-hoverbg p-3 rounded-3xl cursor-pointer"
                />
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => console.log('Filter by Overtime')}>This Week</Menu.Item>
                <Menu.Item onClick={() => console.log('Filter by Working Hours')}>Last Week</Menu.Item>
                <Menu.Item onClick={() => console.log('Show All')}>This Month</Menu.Item>
              </Menu.Dropdown>
            </Menu>

            <Button rightSection={<IconArrowRight stroke={2} size={18} />} color="primary">
              View Details
            </Button>
          </div>
        </div>
      </Stack>

      <Grid mt="md" grow gutter={50}>
        <Grid.Col span={8}>
          <Box>
            <LineChart
              h={300}
              data={data}
              dataKey="days"
              series={[
                { name: 'Overtime', color: "indigo.6" },
                { name: 'Working', color: "green.6" },
              ]}
              curveType="natural"
              withLegend
              withPointLabels
              tickLine="xy"
            />
          </Box>
        </Grid.Col>
      </Grid>
    </Card>
  );
};

export default WeeklyOverview;

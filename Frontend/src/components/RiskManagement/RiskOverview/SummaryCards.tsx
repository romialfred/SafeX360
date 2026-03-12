import React from 'react';
import { SimpleGrid, Card, Group, Box, Text, Title } from '@mantine/core';
import { IconShield, IconPlayerPlay, IconCircleCheck, IconClockPause } from '@tabler/icons-react';

type OverviewMetrics = {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
  overdue: number;
};

interface SummaryCardsProps {
  metrics: OverviewMetrics;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ metrics }) => (
  <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="md" spacing="sm">
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between">
        <Box>
          <Text c="dimmed" size="sm">Total Risks</Text>
          <Title order={2}>{metrics.total}</Title>
        </Box>
        <IconShield size={24} color="#1971C2" />
      </Group>
    </Card>

    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between">
        <Box>
          <Text c="dimmed" size="sm">Open</Text>
          <Title order={2} c="red">{metrics.open}</Title>
        </Box>
        <IconPlayerPlay size={24} color="#FF6B6B" />
      </Group>
    </Card>

    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between">
        <Box>
          <Text c="dimmed" size="sm">In Progress</Text>
          <Title order={2} c="orange">{metrics.inProgress}</Title>
        </Box>
        <IconClockPause size={24} color="#FFA94D" />
      </Group>
    </Card>

    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between">
        <Box>
          <Text c="dimmed" size="sm">Closed / Overdue</Text>
          <Title order={2}><span style={{ color: '#37B24D' }}>{metrics.closed}</span> / <span style={{ color: '#FF6B6B' }}>{metrics.overdue}</span></Title>
        </Box>
        <IconCircleCheck size={24} color="#37B24D" />
      </Group>
    </Card>
  </SimpleGrid>
);

export default SummaryCards;

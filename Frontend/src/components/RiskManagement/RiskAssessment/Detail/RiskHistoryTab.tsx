import { Card, Group, Title, Text, Timeline, Grid, Badge } from '@mantine/core';
import { IconHistory } from '@tabler/icons-react';
import { formatDateShort } from '../../../../utility/DateFormats';
import { gravitiesMap, mantineColorToLevel, probabilitiesMap, riskMap, severitiesMap } from '../../../../Data/DropdownData';


const RiskHistoryTab = ({ revisionHistory }: any) => (
    < Card shadow="sm" padding="xl" radius="md" withBorder>
        <Group justify="space-between" mb="md">
            <Title order={3}>Assessment History</Title>
            <IconHistory size={20} />
        </Group>
        {(!revisionHistory || revisionHistory.length === 0) && (
            <Card withBorder p="md" mb="md" className="text-center bg-gray-50">
                <Text size="sm" c="dimmed">No assessments recorded yet.</Text>
            </Card>
        )}
        {revisionHistory && revisionHistory.length > 0 && (
            <Timeline active={revisionHistory.length} bulletSize={20} lineWidth={2}>
                {revisionHistory.slice().reverse().map((revision: any, index: any) => (
                    <Timeline.Item key={index}>
                        <Card withBorder p="md" mb="md">
                            <Group justify="space-between" mb="xs">
                                <Text size="sm">
                                    Assessment on {formatDateShort(revision.createdAt)}
                                </Text>
                            </Group>

                            <Grid mb="sm">
                                <Grid.Col span={3}>
                                    <Text size="sm" c="dimmed">Gravity:</Text>
                                    <Badge color={mantineColorToLevel[revision.gravity]} variant="light" mb="md">{gravitiesMap[revision.gravity]}</Badge>
                                </Grid.Col>
                                <Grid.Col span={3}>
                                    <Text size="sm" c="dimmed">Probability:</Text>
                                    <Badge color={mantineColorToLevel[revision.probability]} variant="light" mb="md">{probabilitiesMap[revision.probability]}</Badge>
                                </Grid.Col>
                                <Grid.Col span={3}>
                                    <Text size="sm" c="dimmed">Severity:</Text>
                                    <Badge color={mantineColorToLevel[revision.severity]} variant="light" mb="md">{severitiesMap[revision.severity]}</Badge>
                                </Grid.Col>
                                <Grid.Col span={3}>
                                    <Text size="xs" c="dimmed">Risk Level:</Text>
                                    <Badge color={riskMap[revision.riskLevel]?.color} variant="filled">{riskMap[revision.riskLevel]?.level}</Badge>
                                </Grid.Col>
                            </Grid>

                            <Grid>
                                {revision.currentControls && (
                                    <Grid.Col span={6}>
                                        <Text size="sm" c="dimmed" mb="xs">Current Controls:</Text>
                                        <Text size="sm">{revision.currentControls}</Text>
                                    </Grid.Col>
                                )}
                                {revision.additionalControl && (
                                    <Grid.Col span={6}>
                                        <Text size="sm" c="dimmed" mb="xs">Additional Controls:</Text>
                                        <Text size="sm">{revision.additionalControl}</Text>
                                    </Grid.Col>
                                )}
                                {revision.preventiveMeasures && (
                                    <Grid.Col span={6}>
                                        <Text size="sm" c="dimmed" mb="xs">Preventive Measures:</Text>
                                        <Text size="sm">{revision.preventiveMeasures}</Text>
                                    </Grid.Col>
                                )}
                                {revision.improvementsMeasures && (
                                    <Grid.Col span={6}>
                                        <Text size="sm" c="dimmed" mb="xs">Improvement Measures:</Text>
                                        <Text size="sm">{revision.improvementsMeasures}</Text>
                                    </Grid.Col>
                                )}
                            </Grid>
                        </Card>
                    </Timeline.Item>
                ))}
                <Timeline.Item />
            </Timeline>
        )}
    </Card >
);

export default RiskHistoryTab;

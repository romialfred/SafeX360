import { Grid, Card, Title, Text, Badge } from '@mantine/core';
import { gravitiesMap, mantineColorToLevel, probabilitiesMap, riskMap, severitiesMap } from '../../../../Data/DropdownData';



const RiskDetailOverview = ({ risk, departmentMap, processMap, empMap, assessment }: any) => (
    <Grid>
        <Grid.Col span={{ base: 12, lg: 8 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
                <Title order={3} mb="md">General Information</Title>
                <Grid>
                    <Grid.Col span={12}>
                        <Text size="sm" c="dimmed">Title:</Text>
                        <Text size="sm" fw={500} mb="md">{risk.title}</Text>
                    </Grid.Col>
                    <Grid.Col span={12}>
                        <Text size="sm" c="dimmed">Description:</Text>
                        <Text size="sm" mb="md">{risk.description}</Text>
                    </Grid.Col>
                    {/* <Grid.Col span={6}>
                        <Text size="sm" c="dimmed">Zone:</Text>
                        <Badge mb="md">{risk.zone}</Badge>
                    </Grid.Col> */}
                    <Grid.Col span={6}>
                        <Text size="sm" c="dimmed">Department:</Text>
                        <Text size="sm" mb="md">{departmentMap[risk.departmentId]?.name}</Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Text size="sm" c="dimmed">Process:</Text>
                        <Text size="sm" mb="md">{processMap[risk.workProcessId]?.name}</Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Text size="sm" c="dimmed">Owner:</Text>
                        <Text size="sm" mb="md">{empMap[risk.ownerId]?.name}</Text>
                    </Grid.Col>
                </Grid>
            </Card>

            {assessment && (
                <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
                    <Title order={3} mb="md">Current Assessment</Title>
                    <Grid>
                        <Grid.Col span={4}>
                            <Text size="sm" c="dimmed">Gravity:</Text>
                            <Badge color={mantineColorToLevel[assessment.gravity]} variant="light" mb="md">{gravitiesMap[assessment.gravity]}</Badge>
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <Text size="sm" c="dimmed">Probability:</Text>
                            <Badge color={mantineColorToLevel[assessment.probability]} variant="light" mb="md">{probabilitiesMap[assessment.probability]}</Badge>
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <Text size="sm" c="dimmed">Severity:</Text>
                            <Badge color={mantineColorToLevel[assessment.severity]} variant="light" mb="md">{severitiesMap[assessment.severity]}</Badge>
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <Text size="xs" c="dimmed">Risk Level:</Text>
                            <Badge color={riskMap[assessment.riskLevel]?.color} variant="filled">{riskMap[assessment.riskLevel]?.level}</Badge>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="sm" c="dimmed">Status:</Text>
                            <Badge variant="light" mb="md">{risk.status}</Badge>
                        </Grid.Col>
                    </Grid>
                </Card>
            )
            }
            {
                assessment && <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
                    <Title order={3} mb="md">Controls</Title>
                    <Text size="sm" c="dimmed" mb="xs">Current Controls:</Text>
                    <Text size="sm" mb="md">{assessment.currentControls}</Text>
                    <Text size="sm" c="dimmed" mb="xs">Additional Controls:</Text>
                    <Text size="sm" mb="md">{assessment.additionalControl}</Text>
                    <Text size="sm" c="dimmed" mb="xs">Preventive Measures:</Text>
                    <Text size="sm">{assessment.preventiveMeasures}</Text>
                </Card>
            }
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
                <Title order={4} mb="md">ISO Reference</Title>
                <Text size="sm" c="blue">{risk.isoReference}</Text>
            </Card>

            {/* <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
                <Group justify="space-between" mb="md">
                    <Title order={4}>Related Documents</Title>
                    <IconFileText size={20} />
                </Group>
                <Stack gap="xs">
                    {risk?.documents?.map((doc: any, index: any) => (
                        <Group justify="space-between" key={index}>
                            <Group>
                                <IconFileText size={16} />
                                <Text size="sm">{doc.name}</Text>
                                <Badge size="xs" variant="outline">{doc.type}</Badge>
                            </Group>
                            <Button size="xs" variant="light">Download</Button>
                        </Group>
                    ))}
                </Stack>
            </Card> */}
        </Grid.Col>
    </Grid>
);

export default RiskDetailOverview;

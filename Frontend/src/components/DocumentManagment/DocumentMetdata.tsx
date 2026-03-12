import { Badge, Card, Divider, Grid, Group, Stack, Text, Title } from "@mantine/core";
import { getFriendlyFileType } from "../../utility/DocumentUtility";
import { documentStatusesMap } from "../../Data/dummyData/documentData";
import { formatDateShort } from "../../utility/DateFormats";

const DocumentMetadata = ({ document, versions, empMap, departmentMap }: any) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'gray';
            case 'UNDER_REVIEW': return 'yellow';
            case 'APPROVED': return 'green';
            case 'ARCHIVED': return 'red';
            default: return 'gray';
        }
    };

    const getAccessLevelColor = (level: string) => {
        switch (level) {
            case 'PUBLIC': return 'green';
            case 'INTERNAL': return 'blue';
            case 'CONFIDENTIAL': return 'orange';
            case 'RESTRICTED': return 'red';
            default: return 'gray';
        }
    };

    return (
        <div>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Complete Metadata</Title>

                <Grid>
                    <Grid.Col span={6}>
                        <Text size="sm" fw={500} mb="xs">Identification</Text>
                        <Stack gap="xs" mb="md">
                            {/* <Group justify="space-between">
                                <Text size="sm" c="dimmed">Document ID:</Text>
                                <Text size="sm" fw={500}>{document?.id}</Text>
                            </Group> */}
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Name:</Text>
                                <Text size="sm">{document?.documentName}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Category:</Text>
                                <Text size="sm">{document?.category}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">File Type:</Text>
                                <Text size="sm">{getFriendlyFileType(versions?.[versions.length - 1]?.mediaType)}</Text>
                            </Group>
                        </Stack>
                    </Grid.Col>

                    <Grid.Col span={6}>
                        <Text size="sm" fw={500} mb="xs">Gestion</Text>
                        <Stack gap="xs" mb="md">
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Owner:</Text>
                                <Text size="sm">{empMap[document?.ownerId]?.name}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Department:</Text>
                                <Text size="sm">{departmentMap[document?.departmentId]?.name}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Status:</Text>
                                <Badge color={getStatusColor(document?.status)} variant="light" size="sm">
                                    {documentStatusesMap[document?.status]}
                                </Badge>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Access Level:</Text>
                                <Badge color={getAccessLevelColor(document?.accessLevel)} variant="light" size="sm">
                                    {document?.accessLevel}
                                </Badge>
                            </Group>
                        </Stack>
                    </Grid.Col>

                    <Grid.Col span={6}>
                        <Text size="sm" fw={500} mb="xs">Dates</Text>
                        <Stack gap="xs" mb="md">
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Creation Date:</Text>
                                <Text size="sm">{formatDateShort(document?.createdAt)}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Last Modified:</Text>
                                <Text size="sm">{formatDateShort(document?.updatedAt)}</Text>
                            </Group>
                            {document?.approvalDate && (
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Approval Date:</Text>
                                    <Text size="sm">{formatDateShort(document?.approvalDate)}</Text>
                                </Group>
                            )}
                            {document?.reviewDate && (
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Next Review:</Text>
                                    <Text size="sm">{formatDateShort(document?.reviewDate)}</Text>
                                </Group>
                            )}
                        </Stack>
                    </Grid.Col>

                    <Grid.Col span={6}>
                        <Text size="sm" fw={500} mb="xs">Statistiques</Text>
                        <Stack gap="xs" mb="md">
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Current Version:</Text>
                                <Text size="sm" fw={500}>v{versions?.[versions.length - 1]?.version}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Number of Versions:</Text>
                                <Text size="sm">{versions?.length}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Total Views:</Text>
                                <Text size="sm">{101}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Downloads:</Text>
                                <Text size="sm">{78}</Text>
                            </Group>
                        </Stack>
                    </Grid.Col>
                </Grid>

                <Divider my="md" />

                <Text size="sm" fw={500} mb="xs">Tags</Text>
                <Group mb="md">
                    {document?.tags?.map((tag: any, index: number) => (
                        <Badge key={index} variant="outline" size="sm">
                            {tag}
                        </Badge>
                    ))}
                </Group>

                <Text size="sm" fw={500} mb="xs">Full Description</Text>
                <Text size="sm" c="dimmed">
                    {document?.description}
                </Text>
            </Card>
        </div>
    )
}

export default DocumentMetadata
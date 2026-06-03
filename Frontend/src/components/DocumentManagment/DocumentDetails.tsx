import { ActionIcon, Badge, Box, Card, Grid, Group, Stack, Text, Title } from "@mantine/core";
import { IconDownload, IconEye, IconFile, IconFileTypeDoc, IconFileTypePdf, IconFileTypeXls, IconPhoto, IconPresentation } from "@tabler/icons-react";
import { documentsData, documentStatusesMap } from "../../Data/dummyData/documentData";
import { getFriendlyFileType } from "../../utility/DocumentUtility";
import { formatDateShort } from "../../utility/DateFormats";



const DocumentDetails = ({ document, version, empMap, departmentMap }: any) => {

    const getFileTypeIcon = (fileType: string) => {
        switch (fileType) {
            case 'PDF': return <IconFileTypePdf size={16} color="#FF6B6B" />;
            case 'Word': return <IconFileTypeDoc size={16} color="#339AF0" />;
            case 'Excel': return <IconFileTypeXls size={16} color="#51CF66" />;
            case 'PowerPoint': return <IconPresentation size={16} color="#FF922B" />;
            case 'Image': return <IconPhoto size={16} color="#9775FA" />;
            default: return <IconFile size={16} color="#868E96" />;
        }
    };

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
        <Grid>
            <Grid.Col span={{ base: 12, lg: 8 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
                    <Group justify="space-between" mb="md">
                        <Title order={3}>General Information</Title>
                        <Group>
                            {getFileTypeIcon(getFriendlyFileType(version?.mediaType))}
                            <Badge color={getStatusColor(document?.status)} variant="light">
                                {documentStatusesMap[document?.status]}
                            </Badge>
                        </Group>
                    </Group>

                    <Grid>
                        <Grid.Col span={12}>
                            <Text size="sm" c="dimmed">Description:</Text>
                            <Text size="sm" mb="md">{document?.description}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="sm" c="dimmed">Category:</Text>
                            <Badge variant="light" color="blue" mb="md">{document?.category}</Badge>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="sm" c="dimmed">File Type:</Text>
                            <Text size="sm" mb="md">{getFriendlyFileType(version?.mediaType)}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="sm" c="dimmed">Owner:</Text>
                            <Text size="sm" mb="md">{empMap[document?.ownerId]?.name}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="sm" c="dimmed">Department:</Text>
                            <Text size="sm" mb="md">{departmentMap[document?.departmentId]?.name}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="sm" c="dimmed">Access Level:</Text>
                            <Badge color={getAccessLevelColor(document?.accessLevel)} variant="light" mb="md">
                                {document?.accessLevel}
                            </Badge>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="sm" c="dimmed">Current Version:</Text>
                            <Text size="sm" mb="md">v{version?.version}</Text>
                        </Grid.Col>
                    </Grid>

                    <Text size="sm" c="dimmed" mb="xs">Tags:</Text>
                    <Group mb="md">
                        {document?.tags?.map((tag: any, index: any) => (
                            <Badge key={index} variant="outline" size="sm">
                                {tag}
                            </Badge>
                        ))}
                    </Group>
                </Card>

                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Title order={3} mb="md">Usage Statistics</Title>
                    <Grid>
                        <Grid.Col span={6}>
                            <Group>
                                <IconEye size={20} color="#339AF0" />
                                <Box>
                                    <Text size="lg">{86}</Text>
                                    <Text size="sm" c="dimmed">Views</Text>
                                </Box>
                            </Group>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Group>
                                <IconDownload size={20} color="#51CF66" />
                                <Box>
                                    <Text size="lg">{10}</Text>
                                    <Text size="sm" c="dimmed">Downloads</Text>
                                </Box>
                            </Group>
                        </Grid.Col>
                    </Grid>
                </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, lg: 4 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
                    <Title order={4} mb="md">Important Dates</Title>
                    <Stack gap="sm">
                        <Group justify="space-between">
                            <Text size="sm" c="dimmed">Created:</Text>
                            <Text size="sm">{formatDateShort(document?.createdAt)}</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text size="sm" c="dimmed">Modified:</Text>
                            <Text size="sm">{formatDateShort(document?.updatedAt)}</Text>
                        </Group>
                        {document?.approvalDate && (
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Approved:</Text>
                                <Text size="sm">{document?.approvalDate}</Text>
                            </Group>
                        )}
                        {document?.reviewDate && (
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Review Due:</Text>
                                <Text size="sm">{formatDateShort(document?.reviewDate)}</Text>
                            </Group>
                        )}
                        {document?.expiryDate && (
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Expires:</Text>
                                <Text size="sm" c="orange">{formatDateShort(document?.expiryDate)}</Text>
                            </Group>
                        )}
                    </Stack>
                </Card>

                {document?.relatedDocuments?.length > 0 && (
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Title order={4} mb="md">Related Documents</Title>
                        <Stack gap="xs">
                            {document?.relatedDocuments?.map((docId: any, index: any) => {
                                const relatedDoc: any = documentsData.find((d: any) => d.id === docId);
                                return relatedDoc ? (
                                    <Group key={index} justify="space-between">
                                        <Group>
                                            {getFileTypeIcon(relatedDoc.fileType)}
                                            <Text size="sm">{relatedDoc.name}</Text>
                                        </Group>
                                        <ActionIcon variant="light" size="sm">
                                            <IconEye size={14} />
                                        </ActionIcon>
                                    </Group>
                                ) : null;
                            })}
                        </Stack>
                    </Card>
                )}
            </Grid.Col>
        </Grid>
    )
}

export default DocumentDetails
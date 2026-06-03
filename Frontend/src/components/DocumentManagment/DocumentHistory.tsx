import { ActionIcon, Card, Group, Text, Timeline, Title } from "@mantine/core";
import { IconDownload, IconEye } from "@tabler/icons-react";
import { formatDateShort } from "../../utility/DateFormats";

const DocumentHistory = ({ versions, downloadDocument, openDocument }: any) => {


    // const formatFileSize = (bytes: number) => {
    //     if (bytes === 0) return '0 Bytes';
    //     const k = 1024;
    //     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    //     const i = Math.floor(Math.log(bytes) / Math.log(k));
    //     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    // };
    return (
        <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Group justify="space-between" mb="md">
                <Title order={3}>Version History</Title>
                <Text size="sm" c="dimmed">
                    {versions?.length} version(s)
                </Text>
            </Group>

            <Timeline active={versions?.length}>
                {versions?.slice()?.reverse()?.map((version: any, index: any) => (
                    <Timeline.Item key={version.id} title={`Version ${version?.version}`}>
                        <Card withBorder p="md" mb="md">
                            <Group justify="space-between" mb="xs">
                                <Group>
                                    <Text size="sm">
                                        {version.mediaName}
                                        {index === 0 && <Text component="span" c="blue"> (current)</Text>}
                                    </Text>
                                    {/* <Badge size="sm" variant="outline">
                                        {formatFileSize(version. )}
                                    </Badge> */}
                                </Group>
                                <Group>
                                    <ActionIcon variant="light" onClick={() => downloadDocument(version.mediaId)} color="blue">
                                        <IconDownload size={16} />
                                    </ActionIcon>
                                    <ActionIcon variant="light" onClick={() => openDocument(version.mediaId)} color="green">
                                        <IconEye size={16} />
                                    </ActionIcon>
                                </Group>
                            </Group>

                            <Group justify="space-between" mb="md">
                                <Text size="xs" c="dimmed">
                                    Uploaded on {formatDateShort(version.createdAt)}
                                </Text>
                            </Group>

                            <Text size="sm" c="dimmed" mb="xs">Changes:</Text>
                            <Text size="sm">{version.description}</Text>
                        </Card>
                    </Timeline.Item>
                ))}
                <Timeline.Item>
                </Timeline.Item>
            </Timeline>
        </Card>
    )
}

export default DocumentHistory
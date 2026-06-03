import React from 'react';
import { Grid, Card, Group, Title, Text, Badge, Stack, Progress, Box, Button } from '@mantine/core';
import { IconUsers, IconEye, IconCheck, IconPaperclip, IconX, IconSend, IconEdit } from '@tabler/icons-react';
import { Notification } from '../../../Data/dummyData/communicationData';

interface NotificationDetailsProps {
    notification: Notification;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Sent': return 'green';
        case 'Pending': return 'yellow';
        case 'Draft': return 'gray';
        case 'Failed': return 'red';
        default: return 'gray';
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'Critical': return 'red';
        case 'High': return 'orange';
        case 'Medium': return 'yellow';
        case 'Low': return 'green';
        default: return 'gray';
    }
};

const getDeliveryStatusColor = (status: string) => {
    switch (status) {
        case 'Delivered': return 'green';
        case 'Partially Delivered': return 'yellow';
        case 'Failed': return 'red';
        case 'Pending': return 'blue';
        default: return 'gray';
    }
};

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const NotificationDetails: React.FC<NotificationDetailsProps> = ({ notification }) => (
    <Grid>
        <Grid.Col span={{ base: 12, lg: 8 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
                <Group justify="space-between" mb="md">
                    <Title order={3}>Notification Details</Title>
                    <Group>
                        <Badge color={getStatusColor(notification.status)} variant="light">
                            {notification.status}
                        </Badge>
                        <Badge color={getPriorityColor(notification.priority)} variant="filled">
                            {notification.priority}
                        </Badge>
                    </Group>
                </Group>

                <Grid>
                    <Grid.Col span={12}>
                        <Text size="sm" c="dimmed">Type:</Text>
                        <Badge variant="light" color="blue" mb="md">{notification.type}</Badge>
                    </Grid.Col>
                    <Grid.Col span={12}>
                        <Text size="sm" c="dimmed">Content:</Text>
                        <Text size="sm" mb="md">{notification.content}</Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Text size="sm" c="dimmed">Sender:</Text>
                        <Text size="sm" mb="md">{notification.sender}</Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Text size="sm" c="dimmed">Department:</Text>
                        <Text size="sm" mb="md">{notification.department}</Text>
                    </Grid.Col>
                    {notification.zone && (
                        <Grid.Col span={6}>
                            <Text size="sm" c="dimmed">Zone:</Text>
                            <Text size="sm" mb="md">{notification.zone}</Text>
                        </Grid.Col>
                    )}
                    <Grid.Col span={6}>
                        <Text size="sm" c="dimmed">Delivery Status:</Text>
                        <Badge color={getDeliveryStatusColor(notification.deliveryStatus)} variant="light" mb="md">
                            {notification.deliveryStatus}
                        </Badge>
                    </Grid.Col>
                </Grid>

                {notification.attachments.length > 0 && (
                    <>
                        <Text size="sm" c="dimmed" mb="xs">Attachments:</Text>
                        <Stack gap="xs" mb="md">
                            {notification.attachments.map((attachment, index) => (
                                <Group key={index} justify="space-between" p="sm" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                    <Group>
                                        <IconPaperclip size={16} />
                                        <Box>
                                            <Text size="sm">{attachment.name}</Text>
                                            <Text size="xs" c="dimmed">{attachment.type} • {formatFileSize(attachment.size)}</Text>
                                        </Box>
                                    </Group>
                                    <Button size="xs" variant="light">
                                        Download
                                    </Button>
                                </Group>
                            ))}
                        </Stack>
                    </>
                )}
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Engagement Metrics</Title>
                <Grid>
                    <Grid.Col span={4}>
                        <Group>
                            <IconUsers size={20} color="#339AF0" />
                            <Box>
                                <Text size="lg">{notification.recipientCount}</Text>
                                <Text size="sm" c="dimmed">Recipients</Text>
                            </Box>
                        </Group>
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <Group>
                            <IconEye size={20} color="#51CF66" />
                            <Box>
                                <Text size="lg">{notification.readCount}</Text>
                                <Text size="sm" c="dimmed">Read</Text>
                            </Box>
                        </Group>
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <Group>
                            <IconCheck size={20} color="#20C997" />
                            <Box>
                                <Text size="lg"> {((notification.readCount / notification.recipientCount) * 100).toFixed(1)}%</Text>
                                <Text size="sm" c="dimmed">Read Rate</Text>
                            </Box>
                        </Group>
                    </Grid.Col>
                </Grid>

                <Box mt="md">
                    <Text size="sm" c="dimmed" mb="xs">Read Progress:</Text>
                    <Progress
                        value={(notification.readCount / notification.recipientCount) * 100}
                        color="green"
                        size="lg"
                    />
                </Box>
            </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
                <Title order={4} mb="md">Timeline</Title>
                <Stack gap="sm">
                    <Group justify="space-between">
                        <Text size="sm" c="dimmed">Created:</Text>
                        <Text size="sm">{notification.createdDate}</Text>
                    </Group>
                    <Group justify="space-between">
                        <Text size="sm" c="dimmed">Scheduled:</Text>
                        <Text size="sm">{notification.date}</Text>
                    </Group>
                    {notification.sentDate && (
                        <Group justify="space-between">
                            <Text size="sm" c="dimmed">Sent:</Text>
                            <Text size="sm">{notification.sentDate}</Text>
                        </Group>
                    )}
                </Stack>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={4} mb="md">Quick Actions</Title>
                <Stack gap="sm">
                    {notification.status === 'Pending' && (
                        <Button fullWidth leftSection={<IconSend size={16} />} color="green" onClick={() => {/** handled in parent */ }}>
                            Send Now
                        </Button>
                    )}
                    <Button fullWidth variant="outline" leftSection={<IconEdit size={16} />}>
                        Edit Notification
                    </Button>
                    {notification.status === 'Draft' && (
                        <Button fullWidth variant="outline" color="red" leftSection={<IconX size={16} />}>
                            Delete Draft
                        </Button>
                    )}
                </Stack>
            </Card>
        </Grid.Col>
    </Grid>
);

export default NotificationDetails;

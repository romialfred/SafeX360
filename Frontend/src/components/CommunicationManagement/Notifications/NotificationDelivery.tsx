import React from 'react';
import {
    Card,
    Group,
    Title,
    Badge,
    Grid,
    Text,
    Progress,
    Box,
    Alert,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import {
    Notification,
} from '../../../Data/dummyData/communicationData';

interface NotificationDeliveryProps {
    notification: Notification;
}

const getDeliveryStatusColor = (status: string) => {
    switch (status) {
        case 'Delivered': return 'green';
        case 'Partially Delivered': return 'yellow';
        case 'Failed': return 'red';
        case 'Pending': return 'blue';
        default: return 'gray';
    }
};

const NotificationDelivery: React.FC<NotificationDeliveryProps> = ({ notification }) => (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
            <Title order={3}>Delivery Status</Title>
            <Badge color={getDeliveryStatusColor(notification.deliveryStatus)} variant="light">
                {notification.deliveryStatus}
            </Badge>
        </Group>

        <Grid mb="md">
            <Grid.Col span={3}>
                <Card withBorder p="md" style={{ backgroundColor: '#E7F5FF' }}>
                    <Text size="lg" fw={700} c="blue">{notification.recipientCount}</Text>
                    <Text size="sm" c="dimmed">Total Sent</Text>
                </Card>
            </Grid.Col>
            <Grid.Col span={3}>
                <Card withBorder p="md" style={{ backgroundColor: '#D3F9D8' }}>
                    <Text size="lg" fw={700} c="green">{notification.readCount}</Text>
                    <Text size="sm" c="dimmed">Delivered</Text>
                </Card>
            </Grid.Col>
            <Grid.Col span={3}>
                <Card withBorder p="md" style={{ backgroundColor: '#FFF3CD' }}>
                    <Text size="lg" fw={700} c="orange">{notification.recipientCount - notification.readCount}</Text>
                    <Text size="sm" c="dimmed">Pending</Text>
                </Card>
            </Grid.Col>
            <Grid.Col span={3}>
                <Card withBorder p="md" style={{ backgroundColor: '#F8D7DA' }}>
                    <Text size="lg" fw={700} c="red">0</Text>
                    <Text size="sm" c="dimmed">Failed</Text>
                </Card>
            </Grid.Col>
        </Grid>

        <Box mb="md">
            <Text size="sm" fw={500} mb="xs">Delivery Progress</Text>
            <Progress
                value={(notification.readCount / notification.recipientCount) * 100}
                color="green"
                size="lg"
            />
            <Text size="xs" c="dimmed" mt="xs">
                {notification.readCount} of {notification.recipientCount} recipients have received the notification
            </Text>
        </Box>

        {notification.status === 'Sent' && (
            <Alert icon={<IconInfoCircle size={16} />} color="blue">
                <Text size="sm">
                    This notification was sent on {notification.sentDate}.
                    Delivery tracking is updated in real-time as recipients read the message.
                </Text>
            </Alert>
        )}
    </Card>
);

export default NotificationDelivery;

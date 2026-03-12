import React from 'react';
import {
    Card,
    Group,
    Title,
    Text,
    ScrollArea,
    Table,
    Badge,
} from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import {
    Notification,
    communicationRecipients,
} from '../../../Data/dummyData/communicationData';

interface NotificationRecipientsProps {
    notification: Notification;
}

const NotificationRecipients: React.FC<NotificationRecipientsProps> = ({ notification }) => (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
            <Title order={3}>Recipients List</Title>
            <Text size="sm" c="dimmed">
                {notification.recipientCount} recipients
            </Text>
        </Group>

        <ScrollArea h={400}>
            <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Department</Table.Th>
                        <Table.Th>Position</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Read</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {notification.recipients.map((recipientId, index) => {
                        const recipient = communicationRecipients.find(r => r.id === recipientId);
                        const hasRead = index < notification.readCount;

                        return recipient ? (
                            <Table.Tr key={recipientId}>
                                <Table.Td>
                                    <Text size="sm" fw={500}>{recipient.name}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{recipient.department}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{recipient.position}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge
                                        color={recipient.isActive ? 'green' : 'red'}
                                        variant="light"
                                        size="sm"
                                    >
                                        {recipient.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    {hasRead ? (
                                        <IconCheck size={16} color="#51CF66" />
                                    ) : (
                                        <IconX size={16} color="#FF6B6B" />
                                    )}
                                </Table.Td>
                            </Table.Tr>
                        ) : null;
                    })}
                </Table.Tbody>
            </Table>
        </ScrollArea>
    </Card>
);

export default NotificationRecipients;

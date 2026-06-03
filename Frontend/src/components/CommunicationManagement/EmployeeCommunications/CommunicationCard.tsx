import { Card, Group, Badge, Stack, Text, Button } from '@mantine/core';
import { ReactNode } from 'react';
import { IconEye } from '@tabler/icons-react';
import { formatDateShort } from '../../../utility/DateFormats';

interface CommunicationCardProps {
    communication: any;
    departmentName: string;
    onViewDetails: () => void;
    actions?: ReactNode;
}

const formatEnumValue = (value?: string | null) => {
    if (!value) return '-';
    return value
        .toString()
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};

const CommunicationCard = ({ communication, departmentName, onViewDetails, actions }: CommunicationCardProps) => {
    const typeLabel = communication?.type ? formatEnumValue(communication.type) : null;
    const categoryLabel = communication?.category ?? null;
    const urgency = communication?.urgency ? String(communication.urgency).toUpperCase() : null;
    const status = communication?.status ? String(communication.status).toUpperCase() : null;

    const scheduleTypeLabel = communication?.scheduleType ? formatEnumValue(communication.scheduleType) : null;
    const nextRunLabel = communication?.nextRunAt ? formatDateShort(communication.nextRunAt) : null;
    const expiresAtLabel = communication?.expiresAt ? formatDateShort(communication.expiresAt) : null;
    const departmentLabel = departmentName && departmentName !== '-' ? departmentName : null;
    const recipientsCount = communication?.recipientCount;

    const getStatusColor = () => {
        if (!status) return 'gray';
        if (['COMPLETED', 'ACTIVE', 'SENT'].includes(status)) return 'green';
        if (['PENDING', 'SCHEDULED'].includes(status)) return 'yellow';
        if (['FAILED', 'CANCELLED', 'ERROR'].includes(status)) return 'red';
        return 'gray';
    };

    const actionsContent = Array.isArray(actions) ? actions : actions ? [actions] : [];

    return (
        <Card withBorder padding="md" radius="md" className="transition-all duration-200 hover:shadow-lg hover:translate-y-[-2px]">
            <Stack gap="sm">
                <Group gap="xs" justify="space-between" align="flex-start">
                    <Group gap="xs">
                        {typeLabel && (
                            <Badge color="blue" variant="light">{typeLabel}</Badge>
                        )}
                        {categoryLabel && (
                            <Badge color="violet" variant="light">{categoryLabel}</Badge>
                        )}
                        {urgency && (
                            <Badge
                                color={urgency === 'URGENT' ? 'red' : 'green'}
                                variant="light"
                            >
                                {formatEnumValue(urgency)}
                            </Badge>
                        )}
                        {status && (
                            <Badge color={getStatusColor()} variant="light">{formatEnumValue(status)}</Badge>
                        )}
                    </Group>
                </Group>

                <Text size="lg" c="dark">{communication.title}</Text>

                <Stack gap={4} className="text-sm text-gray-600">
                    {departmentLabel && (
                        <Text size="sm">Department: <Text span>{departmentLabel}</Text></Text>
                    )}
                    {typeof recipientsCount === 'number' && recipientsCount >= 0 && (
                        <Text size="sm">Recipients: <Text span>{recipientsCount}</Text></Text>
                    )}
                    {scheduleTypeLabel && (
                        <Text size="sm">Schedule: <Text span>{scheduleTypeLabel}</Text></Text>
                    )}
                    {nextRunLabel && (
                        <Text size="sm">Next Run: <Text span>{nextRunLabel}</Text></Text>
                    )}
                    {expiresAtLabel && (
                        <Text size="sm">Expires At: <Text span>{expiresAtLabel}</Text></Text>
                    )}
                </Stack>

                <Group justify="space-between" align="center">
                    <Group gap="xs">
                        {actionsContent}
                    </Group>
                    <Button size="xs" variant="light" leftSection={<IconEye size={14} />} onClick={onViewDetails}>
                        View Details
                    </Button>
                </Group>
            </Stack>
        </Card>
    );
};

export default CommunicationCard;

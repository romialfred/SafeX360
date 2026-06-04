import { useEffect, useMemo, useState } from 'react';
import { Badge, Center, ScrollArea, Stack, Table, Text } from '@mantine/core';
import { IconBellRinging } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { getNotificationsByCommunication } from '../../../services/NotificationService';
import EmptyState from '../../UtilityComp/EmptyState';
import { SkeletonTable } from '../../UtilityComp/LoadingSkeleton';

type NotificationHistoryProps = {
    communicationId?: number | string;
};

type NotificationItem = {
    id: number;
    communicationId: number;
    commTimeId: number | null;
    dedupedKey: string;
    status: string;
    responseMessage: string | null;
    createdAt: string;
    updatedAt: string | null;
};

const statusColorMap: Record<string, string> = {
    SUCCESS: 'green',
    FAILED: 'red',
    FAILURE: 'red',
    ERROR: 'red',
    PENDING: 'yellow',
    IN_PROGRESS: 'blue',
};

const formatDate = (value: string | null) => {
    if (!value) return '-';
    return dayjs(value).isValid() ? dayjs(value).format('DD MMM YYYY HH:mm') : value;
};

const CommunicationNotificationHistory = ({ communicationId }: NotificationHistoryProps) => {
    const [data, setData] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!communicationId) {
            setData([]);
            return;
        }

        setLoading(true);
        getNotificationsByCommunication(communicationId)
            .then((response) => {
                setData(response || []);
            })
            .catch(() => {
                setData([
                    {
                        id: -1,
                        communicationId: Number(communicationId ?? 0),
                        commTimeId: null,
                        dedupedKey: '',
                        status: 'ERROR',
                        responseMessage: 'Unable to load notification history. Please try again later.',
                        createdAt: new Date().toISOString(),
                        updatedAt: null,
                    },
                ]);
            })
            .finally(() => setLoading(false));
    }, [communicationId]);

    const rows = useMemo(() => {
        const sorted = [...data].sort((a, b) => {
            const dateA = a.createdAt ? dayjs(a.createdAt) : dayjs(0);
            const dateB = b.createdAt ? dayjs(b.createdAt) : dayjs(0);
            if (!dateA.isValid() && !dateB.isValid()) return 0;
            if (!dateA.isValid()) return 1;
            if (!dateB.isValid()) return -1;
            return dateB.valueOf() - dateA.valueOf();
        });

        return sorted.map((item) => {
            const status = item.status?.toUpperCase?.() ?? 'UNKNOWN';
            const badgeColor = statusColorMap[status] || 'gray';
            const isFailure = ['FAILED', 'FAILURE', 'ERROR'].includes(status);
            const descriptionColor = isFailure ? 'red' : 'dimmed';
            const descriptionText = isFailure
                ? 'Notification delivery failed.'
                : item.responseMessage || 'No additional details';
            return (
                <Table.Tr key={item.id}>
                    <Table.Td width="150">
                        <Badge color={badgeColor} variant="light">
                            {status}
                        </Badge>
                    </Table.Td>
                    <Table.Td>
                        <Text size="sm" c={descriptionColor}>
                            {descriptionText}
                        </Text>
                    </Table.Td>
                    <Table.Td>{formatDate(item.createdAt)}</Table.Td>
                </Table.Tr>
            );
        });
    }, [data]);

    if (!communicationId) {
        return (
            <Center py="xl">
                <Text c="dimmed">Communication not found.</Text>
            </Center>
        );
    }

    return (
        <Stack>
            {loading ? (
                /* LOT 41 E: SkeletonTable pendant le chargement */
                <SkeletonTable rows={5} cols={3} />
            ) : data.length === 0 ? (
                /* LOT 41 E: EmptyState unifié */
                <EmptyState
                    icon={<IconBellRinging size={28} />}
                    title="Aucune notification générée"
                    description="Aucune notification n'a encore été envoyée pour cette communication."
                    iconColor="slate"
                />
            ) : (
                <ScrollArea>
                    <Table striped highlightOnHover withTableBorder>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Description</Table.Th>
                                <Table.Th>Sent At</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                </ScrollArea>
            )}
        </Stack>
    );
};

export default CommunicationNotificationHistory;

import { useEffect, useMemo, useState } from 'react';
import { Card, Group, Title, Text, ScrollArea } from '@mantine/core';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { getNotificationsByCommunication } from '../../../services/NotificationService';


const CommunicationRecipientsPage = ({ communication, empMap }: any) => {
    const [latestNotificationStatus, setLatestNotificationStatus] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const communicationId = communication?.id;

        if (!communicationId) {
            setLatestNotificationStatus(null);
            return () => {
                isMounted = false;
            };
        }

        getNotificationsByCommunication(communicationId)
            .then((notifications) => {
                if (!isMounted) return;
                if (!Array.isArray(notifications) || notifications.length === 0) {
                    setLatestNotificationStatus(null);
                    return;
                }

                const normalized = notifications
                    .map((item: any) => ({
                        status: item?.status?.toString?.().toUpperCase?.() ?? null,
                        createdAt: item?.createdAt ?? null,
                    }))
                    .filter((item: { status: string | null }) => Boolean(item.status));

                if (!normalized.length) {
                    setLatestNotificationStatus(null);
                    return;
                }

                const successNotification = normalized.find((item) => item.status === 'SUCCESS');
                if (successNotification) {
                    setLatestNotificationStatus(successNotification.status);
                    return;
                }

                const latest = normalized.reduce((latestItem, currentItem) => {
                    const latestTime = latestItem?.createdAt ? new Date(latestItem.createdAt).getTime() : 0;
                    const currentTime = currentItem?.createdAt ? new Date(currentItem.createdAt).getTime() : 0;
                    return currentTime > latestTime ? currentItem : latestItem;
                });

                setLatestNotificationStatus(latest?.status ?? null);
            })
            .catch(() => {
                if (!isMounted) return;
                setLatestNotificationStatus(null);
            });

        return () => {
            isMounted = false;
        };
    }, [communication?.id]);

    const rows = useMemo(() => {

        return communication?.recipients
            ?.map((recipientId: any) => {
                return {
                    id: recipientId,
                    name: empMap[recipientId]?.name || 'Unknown',
                    department: empMap[recipientId]?.department || 'Unknown',
                    position: empMap[recipientId]?.position || 'Unknown',
                    isActive: true,
                    sentStatus: latestNotificationStatus,
                };
            })
            .filter(Boolean) as any[];
    }, [communication, empMap, latestNotificationStatus]);
    const statusBody = (row: any) => (
        <Tag
            value={row.isActive ? 'Active' : 'Inactive'}
            severity={row.isActive ? 'success' : 'danger'}
            rounded
            className="text-xs"
        />
    );

    const formatStatusLabel = (status?: string | null) => {
        if (!status) return 'Not Sent';
        return status
            .toString()
            .toLowerCase()
            .split('_')
            .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    };

    const booleanIcon = (isSuccess: boolean, label: string) => (
        <i
            className={`pi ${isSuccess ? 'pi-check-circle' : 'pi-times-circle'}`}
            style={{ fontSize: 16, color: isSuccess ? 'var(--green-600)' : 'var(--red-500)' }}
            aria-label={label}
            title={label}
        />
    );

    const sentStatusBody = (row: any) => {
        const normalized = row.sentStatus?.toString?.().toUpperCase?.() ?? null;
        const isSuccess = normalized === 'SUCCESS';
        const label = formatStatusLabel(row.sentStatus);
        return booleanIcon(isSuccess, label);
    };

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
            <Group justify="space-between" mb="md">
                <Title order={3}>Recipients List</Title>
                <Text size="sm" c="dimmed">
                    {communication?.recipients?.length} recipients
                </Text>
            </Group>

            <ScrollArea h={400}>
                <DataTable
                    value={rows}
                    dataKey="id"
                    stripedRows
                    rowHover
                    size="small"
                    tableStyle={{ minWidth: '52rem' }}
                    emptyMessage="No recipients found."
                >
                    <Column field="name" header="Name" />
                    <Column field="department" header="Department" />
                    <Column field="position" header="Position" />
                    <Column align="center" header="Status" body={statusBody} />
                    <Column align="center" header="Sent" body={sentStatusBody} />
                </DataTable>
            </ScrollArea>
        </Card>
    );
};

export default CommunicationRecipientsPage;

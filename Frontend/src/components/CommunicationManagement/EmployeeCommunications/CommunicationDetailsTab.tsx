import { Grid, Card, Group, Title, Text, Badge, Stack, Button, Tooltip } from '@mantine/core';
import { IconArchive, IconEdit, IconPhoto, IconSend } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { formatDateShort } from '../../../utility/DateFormats';
import { handlePreview } from '../../../utility/DocumentUtility';
import { sendCommunicationNow } from '../../../services/CommunicationService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';


// const getStatusColor = (status: string) => {
//     switch (status) {
//         case 'Active': return 'green';
//         case 'Archived': return 'gray';
//         case 'Draft': return 'yellow';
//         default: return 'gray';
//     }
// };

const getCategoryColor = (category: string) => {
    switch (category) {
        case 'Safety': return 'red';
        case 'Operations': return 'blue';
        case 'Training': return 'green';
        case 'Administrative': return 'gray';
        case 'Emergency': return 'orange';
        default: return 'gray';
    }
};

const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
};

const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
};

const formatEnumValue = (value?: string | null) => {
    if (!value) return '-';
    return value
        .toString()
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};

const CommunicationDetailsTab = ({ communication, departmentMap, zoneMap }: any) => {
    const navigate = useNavigate();
    const [isSendingNow, setIsSendingNow] = useState(false);
    const schedule = communication?.schedule ?? {};
    const scheduleStatusRaw = schedule?.status?.toString?.() ?? communication?.status?.toString?.();
    const scheduleStatus = scheduleStatusRaw ? scheduleStatusRaw.toUpperCase() : null;
    const canEdit = scheduleStatus ? ['ACTIVE', 'PAUSED'].includes(scheduleStatus) : true;
    const canSendNow = scheduleStatus === 'ACTIVE';
    const scheduleItems = [
        { label: 'Status', value: formatEnumValue(schedule?.status) },
        { label: 'Schedule Type', value: formatEnumValue(schedule?.scheduleType) },
        { label: 'Next Run', value: schedule?.nextRunAt ? formatDateShort(schedule.nextRunAt) : null },
        { label: 'Last Run', value: schedule?.lastRunAt ? formatDateShort(schedule.lastRunAt) : null },
        { label: 'One-time Execution', value: schedule?.oneTimeAt ? formatDateShort(schedule.oneTimeAt) : null },
        { label: 'Time of Day', value: schedule?.timeOfDay ?? null },
        { label: 'Weekly Day', value: schedule?.weeklyDay ? formatEnumValue(schedule.weeklyDay) : null },
        { label: 'Monthly Day', value: schedule?.monthlyDay ?? null },
    ].filter((item) => item.value && item.value !== '-');

    const scheduleStatusLabel = schedule?.status ? formatEnumValue(schedule.status) : null;

    const handleSendNow = async () => {
        if (!communication?.id) return;
        if (!canSendNow) {
            errorNotification('Send now is only available while the communication is active.');
            return;
        }
        setIsSendingNow(true);
        try {
            await sendCommunicationNow(communication.id);
            successNotification('Communication queued for immediate sending.');
        } catch (error: any) {
            errorNotification(error?.response?.data?.errorMessage || 'Unable to send communication now.');
        } finally {
            setIsSendingNow(false);
        }
    };

    return (
    <Grid gutter="md">
        <Grid.Col span={{ base: 12, lg: 8 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg">
                <Group justify="space-between" mb="md" align="center">
                    <Title order={3}>{communication?.title}</Title>
                    <Group>
                        <Badge color={getCategoryColor(communication?.category)} variant="filled">
                            {communication?.category}
                        </Badge>
                        {communication?.urgency == "URGENT" && (
                            <Badge color="red" variant="filled">
                                Urgent
                            </Badge>
                        )}
                        {scheduleStatusLabel && (
                            <Badge color="blue" variant="light">
                                {scheduleStatusLabel}
                            </Badge>
                        )}
                    </Group>
                </Group>

                <Grid gutter="sm">
                    <Grid.Col span={12}>
                        <Text size="sm" c="dimmed">Type:</Text>
                        <Badge variant="light" color="blue" mb="md">{communication?.type}</Badge>
                    </Grid.Col>
                    <Grid.Col span={12}>
                        <Text size="sm" c="dimmed">Content:</Text>
                        <Text size="sm" mb="md"><div dangerouslySetInnerHTML={{ __html: communication?.content }} /></Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Text size="sm" c="dimmed">Sender:</Text>
                        <Text size="sm" mb="md">{communication?.senderName}</Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Text size="sm" c="dimmed">Department:</Text>
                        <Text size="sm" mb="md">{departmentMap[communication?.departmentId]?.name}</Text>
                    </Grid.Col>
                    {communication?.zoneId && (
                        <Grid.Col span={6}>
                            <Text size="sm" c="dimmed">Zone:</Text>
                            <Text size="sm" mb="md">{zoneMap[communication?.zoneId]?.name}</Text>
                        </Grid.Col>
                    )}
                    {communication?.expiresAt && (
                        <Grid.Col span={6}>
                            <Text size="sm" c="dimmed">Expiry Date:</Text>
                            <Group>
                                <Text size="sm" >{formatDateShort(communication?.expiresAt)}</Text>
                                {isExpiringSoon(communication?.expiresAt) && (
                                    <Badge color="orange" variant="light" size="sm">
                                        Expiring Soon
                                    </Badge>
                                )}
                                {isExpired(communication?.expiresAt) && (
                                    <Badge color="red" variant="light" size="sm">
                                        Expired
                                    </Badge>
                                )}
                            </Group>
                        </Grid.Col>
                    )}
                </Grid>

                <Text size="sm" c="dimmed" mb="xs">Attachments:</Text>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 border border-gray-300 rounded-xl p-2 bg-gray-50">
                    {communication?.attachments?.map((item: any, index: number) => (
                        <Badge key={index} size='sm' className='!cursor-pointer' onClick={() => handlePreview(item)} leftSection={<IconPhoto size={12} />} color="orange" variant="light">
                            {item.name}
                        </Badge>
                    ))}
                </div>


            </Card>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Schedule Details</Title>
                {scheduleItems.length ? (
                    <Stack gap="xs">
                        {scheduleItems.map((item, index) => (
                            <Group key={item.label ?? index} justify="space-between" align="flex-start">
                                <Text size="sm" c="dimmed">{item.label}</Text>
                                <Text size="sm">{item.value}</Text>
                            </Group>
                        ))}
                    </Stack>
                ) : (
                    <Text size="sm" c="dimmed">No schedule information available.</Text>
                )}
            </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 4 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
                <Title order={4} mb="md">Timeline</Title>
                <Stack gap="sm">
                    <Group justify="space-between">
                        <Text size="sm" c="dimmed">Created:</Text>
                        <Text size="sm">{formatDateShort(communication?.createdAt)}</Text>
                    </Group>
                    <Group justify="space-between">
                        <Text size="sm" c="dimmed">Published:</Text>
                        <Text size="sm">{formatDateShort(communication?.scheduledAt)}</Text>
                    </Group>
                    {communication?.expiresAt && (
                        <Group justify="space-between">
                            <Text size="sm" c="dimmed">Expires:</Text>
                            <Text size="sm" c={isExpired(communication?.expiresAt) ? 'red' : isExpiringSoon(communication?.expiresAt) ? 'orange' : 'dimmed'}>
                                {formatDateShort(communication?.expiresAt)}
                            </Text>
                        </Group>
                    )}
                </Stack>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={4} mb="md">Quick Actions</Title>
                <Stack gap="sm">
                    {communication?.status === 'Active' && (
                        <Button
                            fullWidth
                            leftSection={<IconArchive size={16} />}
                            color="blue"
                        >
                            Archive Communication
                        </Button>
                    )}
                    <Tooltip
                        label="Editing is available only when the schedule is Active or Paused."
                        withArrow
                        position="top"
                        disabled={canEdit}
                    >
                        <span className="w-full">
                            <Button
                                fullWidth
                                variant="outline"
                                leftSection={<IconEdit size={16} />}
                                onClick={() => navigate(`/communications/edit/${communication?.id}`)}
                                disabled={!canEdit}
                            >
                                Edit Communication
                            </Button>
                        </span>
                    </Tooltip>
                    <Tooltip
                        label="Send now is available only while the communication is Active."
                        withArrow
                        position="top"
                        disabled={canSendNow}
                    >
                        <span className="w-full">
                            <Button
                                fullWidth
                                variant="outline"
                                leftSection={<IconSend size={16} />}
                                color="green"
                                onClick={handleSendNow}
                                loading={isSendingNow}
                                disabled={!canSendNow}
                            >
                                Send Now
                            </Button>
                        </span>
                    </Tooltip>
                </Stack>
            </Card>
        </Grid.Col>
    </Grid>
    );
};

export default CommunicationDetailsTab;

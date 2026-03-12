import {
    Card,
    Group,
    Title,
    Grid,
    Divider,
    Box,
    Text,
    Progress,
    Alert,
} from '@mantine/core';
import {
    IconAlertTriangle,
    IconClock
} from '@tabler/icons-react';
import { formatDateShort } from '../../../utility/DateFormats';


const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
};

// const isExpired = (expiryDate?: string) => {
//     if (!expiryDate) return false;
//     const expiry = new Date(expiryDate);
//     const today = new Date();
//     return expiry < today;
// };

const CommunicationEngagementPage = ({ communication }: any) => (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
            <Title order={3}>Engagement Analytics</Title>
        </Group>

        <Grid mb="md">
            <Grid.Col span={3}>
                <Card withBorder p="md" style={{ backgroundColor: '#E7F5FF' }}>
                    <Text size="lg" fw={700} c="blue">{6}</Text>
                    <Text size="sm" c="dimmed">Total Recipients</Text>
                </Card>
            </Grid.Col>
            <Grid.Col span={3}>
                <Card withBorder p="md" style={{ backgroundColor: '#D3F9D8' }}>
                    <Text size="lg" fw={700} c="green">{5}</Text>
                    <Text size="sm" c="dimmed">Read</Text>
                </Card>
            </Grid.Col>
            <Grid.Col span={3}>
                <Card withBorder p="md" style={{ backgroundColor: '#D1F2EB' }}>
                    <Text size="lg" fw={700} c="teal">{4}</Text>
                    <Text size="sm" c="dimmed">Acknowledged</Text>
                </Card>
            </Grid.Col>
            <Grid.Col span={3}>
                <Card withBorder p="md" style={{ backgroundColor: '#FFF3CD' }}>
                    <Text size="lg" fw={700} c="orange">
                        {2}
                    </Text>
                    <Text size="sm" c="dimmed">Pending</Text>
                </Card>
            </Grid.Col>
        </Grid>

        <Divider my="md" />

        <Grid>
            <Grid.Col span={6}>
                <Box mb="md">
                    <Text size="sm" fw={500} mb="xs">Read Rate</Text>
                    <Progress
                        value={(5 / 6) * 100}
                        color="blue"
                        size="lg"
                    />
                    <Text size="xs" c="dimmed" mt="xs">
                        {5} of {6} recipients have read this communication
                    </Text>
                </Box>
            </Grid.Col>
            <Grid.Col span={6}>
                <Box mb="md">
                    <Text size="sm" fw={500} mb="xs">Acknowledgment Rate</Text>
                    <Progress
                        value={(4 / 6) * 100}
                        color="green"
                        size="lg"
                    />
                    <Text size="xs" c="dimmed" mt="xs">
                        {4} of {6} recipients have acknowledged
                    </Text>
                </Box>
            </Grid.Col>
        </Grid>

        {communication?.urgency == "URGENT" && (
            <Alert icon={<IconAlertTriangle size={16} />} color="orange" mt="md">
                <Text size="sm">
                    This is an urgent communication. Consider sending reminders to recipients who haven't acknowledged yet.
                </Text>
            </Alert>
        )}

        {isExpiringSoon(communication?.expiresAt) && (
            <Alert icon={<IconClock size={16} />} color="yellow" mt="md">
                <Text size="sm">
                    This communication is expiring soon ({formatDateShort(communication?.expiresAt)}). Consider extending the deadline or sending final reminders.
                </Text>
            </Alert>
        )}
    </Card>
);

export default CommunicationEngagementPage;

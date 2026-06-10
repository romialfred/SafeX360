import { Timeline, Text, Card, Badge, Group } from '@mantine/core';
import { IconUser, IconCalendar, IconClock } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { auditStatusMap } from '../../../../Data/DropdownData';
import { auditStatusColor } from '../auditLabels';

type AuditStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface AuiditHistoryDetails {
    id: number;
    auditId: number;
    status: AuditStatus;
    comment: string;
    ownerId: number;
    ownerName: string;
    createdAt: string;
    date: string;
}

interface AuditHistoryProps {
    history: AuiditHistoryDetails[];
    audit: any;
    empMap: any
}

const AuditHistoryTabs = ({ history, audit: _audit, empMap }: AuditHistoryProps) => {

    const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return (
        <div className="p-6">

            <Timeline active={history.length} bulletSize={24} lineWidth={3}>
                {sortedHistory.map((entry, index) => {
                    const currentDate = dayjs(entry.date);
                    const nextDate = index < sortedHistory.length - 1
                        ? dayjs(sortedHistory[index + 1].date)
                        : dayjs();

                    const daysInStatus = nextDate.diff(currentDate, 'day');

                    return (
                        <Timeline.Item key={entry.id} title={auditStatusMap[entry.status]}>
                            <Card shadow="sm" radius="md" className="bg-white mt-2" withBorder>
                                <Group justify="space-between" className="mb-2">
                                    <Text size="sm" className="text-gray-500 flex items-center gap-1">
                                        <IconUser size={14} /> {empMap ? empMap[entry.ownerId]?.name : ""}
                                    </Text>
                                    <Badge color={auditStatusColor(entry.status)} variant="light">{auditStatusMap[entry.status] ?? entry.status}</Badge>
                                </Group>

                                <Text size="sm" className="text-gray-700">{entry.comment || 'Aucun commentaire renseigné.'}</Text>

                                <Group justify="space-between" className="mt-2 text-xs text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <IconCalendar size={14} />
                                        {dayjs(entry.date).format('DD MMM YYYY')}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <IconClock size={14} />
                                        {daysInStatus} jour{daysInStatus > 1 ? 's' : ''} dans ce statut
                                    </div>
                                </Group>
                            </Card>
                        </Timeline.Item>
                    );
                })}
            </Timeline>
            {
                sortedHistory.length === 0 && (
                    <Text size="sm" className="text-gray-500 mt-4">
                        Aucun changement de statut enregistré pour cet audit.
                    </Text>
                )
            }
        </div>
    );
};

export default AuditHistoryTabs;

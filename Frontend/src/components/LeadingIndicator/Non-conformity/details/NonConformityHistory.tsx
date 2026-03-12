import { Timeline, Text, Card, Badge, Group } from '@mantine/core';
import { IconUser, IconCalendar, IconClock } from '@tabler/icons-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import { eventStatusMap } from '../../../../Data/DropdownData';



dayjs.extend(relativeTime);
dayjs.extend(duration);

type NCStatus = 'REPORTED' | 'INPROGRESS' | 'REOPENED' | 'CLOSED';

interface NCHistoryDetails {
    id: number;
    ownerId: number;
    ownerName: string;
    date: string; // ISO string or date in "YYYY-MM-DD"
    status: NCStatus;
    comment: string;
    nonConformityId: number;
    createdAt: string; // ISO datetime string
}

interface NCHistoryProps {
    history: NCHistoryDetails[];
    empMap: any
}

const NonConformityHistory = ({ history, empMap }: NCHistoryProps) => {
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
                        <Timeline.Item key={entry.id} title={eventStatusMap[entry.status]}>
                            <Card shadow="sm" radius="md" className="bg-white mt-2" withBorder>
                                <Group justify="space-between" className="mb-2">
                                    <Text size="sm" className="text-gray-500 flex items-center gap-1">
                                        <IconUser size={14} /> {empMap[entry.ownerId]?.name}
                                    </Text>
                                    <Badge color="gray" variant="light">{eventStatusMap[entry.status]}</Badge>
                                </Group>

                                <Text size="sm" className="text-gray-700">{entry.comment || 'No comment provided.'}</Text>

                                <Group justify="space-between" className="mt-2 text-xs text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <IconCalendar size={14} />
                                        {dayjs(entry.date).format('DD MMM YYYY')}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <IconClock size={14} />
                                        In this status for {daysInStatus} day{daysInStatus !== 1 ? 's' : ''}
                                    </div>
                                </Group>
                            </Card>
                        </Timeline.Item>
                    );
                })}
            </Timeline>
        </div>
    )
}

export default NonConformityHistory
import { Timeline, Text, Card, Group } from '@mantine/core';
import { IconUser, IconCalendar, IconClock } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { formatDateShort } from '../../../../utility/DateFormats';
import { activityStatusConfig } from '../hsMeetingsLabels';

type MeetingStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface MeetingHistoryDetails {
    id: number;
    auditId: number;
    status: MeetingStatus;
    comment: string;
    ownerId: number;
    ownerName: string;
    createdAt: string;
    date: string;
}

interface MeetingHistoryProps {
    history: MeetingHistoryDetails[];
    empMap: any;
    meeting: any;
}

const ActivityHistory = ({ history, meeting: _meeting, empMap }: MeetingHistoryProps) => {
    const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return (
        <div className="p-4">
            <Timeline active={history.length} bulletSize={24} lineWidth={3}>
                {sortedHistory.map((entry, index) => {
                    const currentDate = dayjs(entry.date);
                    const nextDate = index < sortedHistory.length - 1
                        ? dayjs(sortedHistory[index + 1].date)
                        : dayjs();

                    const daysInStatus = nextDate.diff(currentDate, 'day');
                    const statusCfg = activityStatusConfig(entry.status);

                    return (
                        <Timeline.Item key={entry.id} title={statusCfg.label}>
                            <Card shadow="sm" radius="md" className="bg-white mt-2" withBorder>
                                <Group justify="space-between" className="mb-2">
                                    <Text size="sm" className="text-slate-500 flex items-center gap-1">
                                        <IconUser size={14} aria-hidden="true" /> {empMap ? empMap[entry.ownerId]?.name : ""}
                                    </Text>
                                    <span className={`inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-wider rounded border ${statusCfg.chip}`}>
                                        {statusCfg.label}
                                    </span>
                                </Group>

                                <Text size="sm" className="text-slate-700">{entry.comment || 'Aucun commentaire.'}</Text>

                                <Group justify="space-between" className="mt-2 text-xs text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <IconCalendar size={14} aria-hidden="true" />
                                        {formatDateShort(entry.date)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <IconClock size={14} aria-hidden="true" />
                                        Dans ce statut depuis {daysInStatus} jour{daysInStatus > 1 ? 's' : ''}
                                    </div>
                                </Group>
                            </Card>
                        </Timeline.Item>
                    );
                })}
            </Timeline>
            {sortedHistory.length === 0 && (
                <Text size="sm" className="text-slate-500 mt-4">
                    Aucun historique pour cette activité.
                </Text>
            )}
        </div>
    );
};

export default ActivityHistory;

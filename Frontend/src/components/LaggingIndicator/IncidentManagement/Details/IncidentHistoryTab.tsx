import { Timeline, Text, Card, Badge, Group } from '@mantine/core';
import { IconUser, IconCalendar, IconClock } from '@tabler/icons-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import { incidentStatusMap } from '../../../../Data/DropdownData';

dayjs.extend(relativeTime);
dayjs.extend(duration);

type IncidentStatus = 'REPORTED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED' | 'PENDING';

interface IncidentHistoryDetails {
    id: number;
    ownerId: number;
    ownerName: string;
    date: string; // ISO string or date in "YYYY-MM-DD"
    status: IncidentStatus;
    comment: string;
    incidentId: number;
    createdAt: string; // ISO datetime string
}

interface IncidentHistoryProps {
    history: IncidentHistoryDetails[];
    incident: any;
}

const IncidentHistory = ({ history, incident: _incident }: IncidentHistoryProps) => {
    const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sortedHistory.length === 0) {
        return (
            <div className="p-4">
                <p className="text-xs text-slate-400 italic">Aucun changement de statut enregistré pour cet incident.</p>
            </div>
        );
    }

    return (
        <div className="p-2">
            <Timeline active={history.length} bulletSize={20} lineWidth={2} color="teal">
                {sortedHistory.map((entry, index) => {
                    const currentDate = dayjs(entry.date);
                    const nextDate = index < sortedHistory.length - 1
                        ? dayjs(sortedHistory[index + 1].date)
                        : dayjs();
                    const daysInStatus = nextDate.diff(currentDate, 'day');

                    return (
                        <Timeline.Item key={entry.id} title={
                            <span className="text-xs text-slate-800 uppercase tracking-wider">
                                {incidentStatusMap[entry.status]}
                            </span>
                        }>
                            <Card shadow="none" radius="md" className="!bg-white mt-2 !border !border-slate-200" p="sm">
                                <Group justify="space-between" mb={6}>
                                    <Text size="xs" className="text-slate-600 flex items-center gap-1">
                                        <IconUser size={12} className="text-slate-400" />
                                        <span className="font-medium">{entry.ownerName || 'Utilisateur inconnu'}</span>
                                    </Text>
                                    <Badge color="teal" variant="light" size="xs" radius="sm">
                                        {incidentStatusMap[entry.status]}
                                    </Badge>
                                </Group>

                                <Text size="xs" className="text-slate-700 leading-relaxed">
                                    {entry.comment || <span className="italic text-slate-400">Aucun commentaire fourni</span>}
                                </Text>

                                <Group justify="space-between" mt={8} className="text-[10px] text-slate-500">
                                    <div className="flex items-center gap-1">
                                        <IconCalendar size={11} />
                                        {dayjs(entry.date).format('DD MMM YYYY')}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <IconClock size={11} />
                                        Durée dans le statut : {daysInStatus} jour{daysInStatus !== 1 ? 's' : ''}
                                    </div>
                                </Group>
                            </Card>
                        </Timeline.Item>
                    );
                })}
            </Timeline>
        </div>
    );
}
export default IncidentHistory;
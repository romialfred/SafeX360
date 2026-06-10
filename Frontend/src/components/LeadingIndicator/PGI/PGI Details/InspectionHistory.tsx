import { Timeline } from '@mantine/core';
import { IconCalendar, IconClock, IconUser } from '@tabler/icons-react';
import dayjs from 'dayjs';
import EmptyState from '../../../UtilityComp/EmptyState';
import { CHIP_BASE, formatDateFr, inspectionStatusConfig } from '../pgiLabels';

type InspectionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface InspectionHistoryDetails {
    id: number;
    auditId: number;
    status: InspectionStatus;
    comment: string;
    ownerId: number;
    ownerName: string;
    createdAt: string;
    date: string;
}

interface InspectionHistoryProps {
    history: InspectionHistoryDetails[];
    inspection: any;
    empMap: any
}

/**
 * Historique des changements de statut de l'inspection : qui, quand,
 * avec quel commentaire et durée passée dans chaque statut.
 */
const InspectionHistory = ({ history, inspection: _inspection, empMap }: InspectionHistoryProps) => {
    const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sortedHistory.length === 0) {
        return (
            <EmptyState
                title="Aucun historique de statut"
                description="Les changements de statut de l'inspection apparaîtront ici."
                compact
            />
        );
    }

    return (
        <div className="p-2">
            <Timeline active={history.length} bulletSize={24} lineWidth={3}>
                {sortedHistory.map((entry, index) => {
                    const currentDate = dayjs(entry.date);
                    const nextDate = index < sortedHistory.length - 1
                        ? dayjs(sortedHistory[index + 1].date)
                        : dayjs();

                    const daysInStatus = nextDate.diff(currentDate, 'day');
                    const cfg = inspectionStatusConfig(entry.status);

                    return (
                        <Timeline.Item
                            key={entry.id}
                            title={
                                <span
                                    className="text-slate-800"
                                    style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14px', fontWeight: 600 }}
                                >
                                    {cfg.label}
                                </span>
                            }
                        >
                            <div className="bg-white rounded-lg border border-slate-200 p-3 mt-1 space-y-2">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <p className="text-[12.5px] text-slate-600 flex items-center gap-1">
                                        <IconUser size={13} className="text-slate-400" aria-hidden="true" />
                                        {empMap ? empMap[entry.ownerId]?.name || '—' : '—'}
                                    </p>
                                    <span className={`${CHIP_BASE} ${cfg.chip}`}>{cfg.label}</span>
                                </div>

                                <p className="text-[13px] text-slate-700 leading-snug">
                                    {entry.comment || 'Aucun commentaire renseigné.'}
                                </p>

                                <div className="flex items-center justify-between gap-2 text-[11.5px] text-slate-500 pt-1 border-t border-slate-100">
                                    <span className="flex items-center gap-1">
                                        <IconCalendar size={13} aria-hidden="true" />
                                        {formatDateFr(entry.date)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <IconClock size={13} aria-hidden="true" />
                                        {daysInStatus} jour{daysInStatus > 1 ? 's' : ''} dans ce statut
                                    </span>
                                </div>
                            </div>
                        </Timeline.Item>
                    );
                })}
            </Timeline>
        </div>
    )
}

export default InspectionHistory

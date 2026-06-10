import { Button, Tooltip } from '@mantine/core';
import { IconCalendarEvent, IconClock, IconEdit, IconEye } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import {
    activityStatusConfig,
    activityTypeLabel,
    formatDateFr,
    formatTimeFr,
} from './hsMeetingsLabels';

interface HealthCardProps {
    healthData: any;
}

const HealthCard = ({ healthData }: HealthCardProps) => {
    const statusCfg = activityStatusConfig(healthData.status);
    const statusUpper = String(healthData?.status || '').toUpperCase();
    const canEdit = !['COMPLETED', 'CANCELLED'].includes(statusUpper);
    const editTooltip = canEdit
        ? 'Modifier la réunion'
        : statusUpper === 'COMPLETED'
            ? 'Réunion réalisée — modification impossible'
            : 'Réunion annulée — modification impossible';

    return (
        <div className="rounded-xl border border-slate-200 p-4 bg-white flex flex-col gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-wider rounded border bg-teal-50 text-teal-700 border-teal-200">
                    {activityTypeLabel(healthData.type)}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-wider rounded border ${statusCfg.chip}`}>
                    {statusCfg.label}
                </span>
            </div>

            <Link to={`details-meeting/${healthData.id}`} className="text-[13px] text-slate-800 leading-snug hover:text-teal-700">
                {healthData.title}
            </Link>

            <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <IconCalendarEvent size={13} stroke={1.6} aria-hidden="true" />
                {formatDateFr(healthData.plannedDate)}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <IconClock size={13} stroke={1.6} aria-hidden="true" />
                {formatTimeFr(healthData.startTime)} – {formatTimeFr(healthData.endTime)}
            </div>

            <div className="flex grow items-end gap-2 pt-1">
                <Tooltip label={editTooltip} withArrow>
                    <span className="inline-flex">
                        <Button
                            size="xs"
                            variant="subtle"
                            leftSection={<IconEdit size={14} />}
                            color="blue"
                            component={Link}
                            to={canEdit ? `editActivity/${healthData.id}` : '#'}
                            onClick={(e) => { if (!canEdit) e.preventDefault(); }}
                            disabled={!canEdit}
                        >
                            Modifier
                        </Button>
                    </span>
                </Tooltip>
                <Button
                    size="xs"
                    variant="subtle"
                    leftSection={<IconEye size={14} />}
                    color="teal"
                    component={Link}
                    to={`details-meeting/${healthData.id}`}
                >
                    Détails
                </Button>
            </div>
        </div>
    );
};

export default HealthCard;

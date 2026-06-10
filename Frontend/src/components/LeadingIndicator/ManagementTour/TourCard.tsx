import { Button, Tooltip } from "@mantine/core";
import { IconCalendarEvent, IconClock, IconEdit, IconEye, IconRepeat } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import {
    tourStatusConfig,
    tourTypeLabel,
    formatDateFr,
    formatTimeFr,
} from "./tourLabels";

interface TourDataProps {
    tourData: any;
}

const TourCard = ({ tourData }: TourDataProps) => {
    const statusCfg = tourStatusConfig(tourData.status);
    const statusUpper = String(tourData?.status || '').toUpperCase();
    const canEdit = !['COMPLETED', 'CANCELLED'].includes(statusUpper);
    const editTooltip = canEdit
        ? 'Modifier la tournée'
        : statusUpper === 'COMPLETED'
            ? 'Tournée réalisée — modification impossible'
            : 'Tournée annulée — modification impossible';

    return (
        <div className="rounded-xl border border-slate-200 p-4 bg-white flex flex-col gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-wider rounded border bg-teal-50 text-teal-700 border-teal-200">
                    {tourTypeLabel(tourData.type)}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-wider rounded border ${statusCfg.chip}`}>
                    {statusCfg.label}
                </span>
            </div>

            <Link to={`details-meeting/${tourData.id}`} className="text-[13px] text-slate-800 leading-snug hover:text-teal-700">
                {tourData.title}
            </Link>

            {tourData.frequency && (
                <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                    <IconRepeat size={13} stroke={1.6} aria-hidden="true" />
                    Fréquence : {tourData.frequency}
                </div>
            )}
            <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <IconCalendarEvent size={13} stroke={1.6} aria-hidden="true" />
                {formatDateFr(tourData.plannedDate)}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <IconClock size={13} stroke={1.6} aria-hidden="true" />
                {formatTimeFr(tourData.startTime)} – {formatTimeFr(tourData.endTime)}
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
                            to={canEdit ? `edit/${tourData.id}` : '#'}
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
                    to={`details-meeting/${tourData.id}`}
                >
                    Détails
                </Button>
            </div>
        </div>
    );
};

export default TourCard;

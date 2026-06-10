import { Button, Tooltip } from "@mantine/core";
import { IconCalendarEvent, IconClock, IconEdit, IconEye, IconMapPin } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { formatDateWithDay, formatTo12Hour } from "../../../utility/DateFormats";
import { CHIP_BASE, inspectionStatusConfig } from "./pgiLabels";

interface PgiData {
    id: number;
    title: string;
    siteName: string;
    plannedDate: string;
    startTime: string;
    endTime: string;
    status: string;
}

/** Carte d'inspection pour la vue grille du registre PGI. */
const PgiCard = ({ pgiData }: { pgiData: PgiData }) => {
    const statusCfg = inspectionStatusConfig(pgiData.status);
    const statusUpper = String(pgiData?.status || '').toUpperCase();
    const canEdit = !['COMPLETED', 'CANCELLED'].includes(statusUpper);
    const editTooltip = canEdit
        ? "Modifier l'inspection"
        : statusUpper === 'COMPLETED'
        ? 'Inspection terminée : modification impossible'
        : 'Inspection annulée : modification impossible';

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[11.5px] text-slate-600">
                    <IconMapPin size={12} className="text-slate-400" aria-hidden="true" />
                    {pgiData.siteName || 'Site non renseigné'}
                </span>
                <span className={`${CHIP_BASE} ${statusCfg.chip} flex-shrink-0`}>{statusCfg.label}</span>
            </div>

            <Link to={`details-pgi/${pgiData.id}`} className="text-[13px] text-slate-800 leading-snug hover:!underline">
                {pgiData.title}
            </Link>

            <div className="space-y-1 text-[11.5px] text-slate-500">
                <p className="flex items-center gap-1.5">
                    <IconCalendarEvent size={12} className="text-slate-400" aria-hidden="true" />
                    {formatDateWithDay(pgiData.plannedDate)}
                </p>
                <p className="flex items-center gap-1.5">
                    <IconClock size={12} className="text-slate-400" aria-hidden="true" />
                    {formatTo12Hour(pgiData.startTime)} – {formatTo12Hour(pgiData.endTime)}
                </p>
            </div>

            <div className="flex gap-2 pt-1 border-t border-slate-100">
                <Tooltip label={editTooltip} withArrow>
                    <span className="inline-flex">
                        <Button
                            size="xs"
                            variant="subtle"
                            leftSection={<IconEdit size={14} />}
                            color="blue"
                            component={Link}
                            to={canEdit ? `edit/${pgiData.id}` : '#'}
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
                    to={`details-pgi/${pgiData.id}`}
                >
                    Consulter
                </Button>
            </div>
        </div>
    );
};

export default PgiCard;

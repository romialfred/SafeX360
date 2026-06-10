import { Button, Tooltip } from "@mantine/core";
import { IconCalendar, IconEye, IconEdit } from "@tabler/icons-react";
import { formatDateShort } from "../../../utility/DateFormats";
import { REC_STATUS_CHIPS, recPriorityLabel, recStatusLabel } from "./auditLabels";

interface RecommendationData {
    id: number;
    title: string;
    auditTitle: string;
    department: string;
    deadline: string;
    status: string;
    progress: number;
    observation: string;
    actionManagerId: string;
    priority?: string;
}

const getUpdateRestriction = (status: string, progress: number) => {
    const normalizedStatus = String(status ?? '').toUpperCase();
    const normalizedProgress = Number(progress ?? 0);

    if (normalizedProgress >= 100) {
        return 'Avancement déjà à 100 %.';
    }

    if (normalizedStatus === 'PENDING') {
        return 'Une recommandation en attente ne peut pas être mise à jour.';
    }

    if (normalizedStatus === 'COMPLETED') {
        return 'Recommandation déjà terminée.';
    }

    if (normalizedStatus === 'CANCELLED') {
        return 'Une recommandation annulée ne peut pas être mise à jour.';
    }

    return null;
};

const RecommendationCard = ({ data, onView, onUpdate }: {
    data: RecommendationData;
    onView: () => void;
    onUpdate: () => void;
}) => {
    const statusChip = REC_STATUS_CHIPS[data.status?.toUpperCase()] || "bg-slate-50 text-slate-600 border-slate-200";
    const updateRestriction = getUpdateRestriction(data?.status, data?.progress);
    const updateTooltip = updateRestriction ?? 'Mettre à jour';

    return (
        <div className="rounded-xl border border-slate-200 shadow-sm p-4 bg-white flex flex-col gap-3 transition-[box-shadow,border-color] duration-200 hover:shadow-md hover:border-slate-300">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2 py-1 rounded-lg border ${statusChip}`}>
                    {recStatusLabel(data.status)}
                </span>
                <span className="text-xs px-2 py-1 rounded-lg bg-orange-50 text-orange-800 border border-orange-200">
                    {data.progress}%
                </span>
                {data.priority && (
                    <span className="text-xs px-2 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200">
                        Priorité : {recPriorityLabel(data.priority)}
                    </span>
                )}
            </div>

            {/* Titre */}
            <p className="text-[13px] text-slate-800">{data.title}</p>

            {data.observation && <p className="text-[12.5px] text-slate-600">Constat : {data.observation}</p>}
            {data.department && <p className="text-[12.5px] text-slate-600">Département : {data.department}</p>}

            {/* Échéance */}
            <div className="text-slate-600 text-[12.5px] flex items-center gap-1">
                <IconCalendar size={15} /> Échéance : {formatDateShort(data.deadline)}
            </div>

            {/* Actions */}
            <div className="flex justify-center grow gap-4">
                <Button size="xs" leftSection={<IconEye size={15} />} color="gray" variant="subtle" onClick={onView}>
                    Consulter
                </Button>
                <Tooltip label={updateTooltip}>
                    <span className="inline-flex">
                        <Button
                            size="xs"
                            leftSection={<IconEdit size={15} />}
                            color="blue"
                            variant="subtle"
                            disabled={Boolean(updateRestriction)}
                            onClick={onUpdate}
                        >
                            Mettre à jour
                        </Button>
                    </span>
                </Tooltip>
            </div>
        </div>
    );
};

export default RecommendationCard;

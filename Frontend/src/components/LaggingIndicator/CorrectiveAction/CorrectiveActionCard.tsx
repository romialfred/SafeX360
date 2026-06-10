import { Button, Progress, Tooltip } from "@mantine/core";
import { IconCalendarEvent, IconEye, IconPencilCheck, IconUser } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { caStatusConfig, caTypeLabel, formatDateFr } from "./correctiveLabels";

const CorrectiveActionCard = ({ action }: any) => {
    const navigate = useNavigate();
    const statusCfg = caStatusConfig(action?.status);
    const statusUpper = String(action?.status).toUpperCase();
    const progress = Number(action?.progress ?? 0);
    const canUpdate = progress < 100 && statusUpper !== 'COMPLETED';
    const updateTooltip = canUpdate
        ? 'Mettre à jour la progression'
        : statusUpper === 'PENDING' ? 'En attente de validation — non modifiable'
            : statusUpper === 'CANCELLED' ? 'Action annulée — non modifiable'
                : 'Déjà clôturée';

    return (
        <div className="rounded-xl border border-slate-200 p-4 bg-white flex flex-col gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-wider rounded border bg-sky-50 text-sky-700 border-sky-200">
                    {caTypeLabel(action.type)}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-wider rounded border ${statusCfg.chip}`}>
                    {statusCfg.label}
                </span>
            </div>

            <div className="flex flex-col gap-0.5">
                <h2 className="text-[13px] text-slate-800 leading-snug line-clamp-1">{action.actionName}</h2>
                {action.incidentTitle && (
                    <p className="text-[11.5px] text-slate-500">Source : <span className="text-slate-700">{action.incidentTitle}</span></p>
                )}
            </div>

            <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <IconUser size={13} stroke={1.6} aria-hidden="true" />
                {action.assignedEmployeeName || '—'}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <IconCalendarEvent size={13} stroke={1.6} aria-hidden="true" />
                Échéance : {formatDateFr(action.deadline)}
            </div>

            <div className="flex items-center gap-2">
                <Progress
                    value={progress}
                    radius="xl"
                    size="sm"
                    color={progress < 20 ? 'red' : progress < 70 ? 'orange' : 'teal'}
                    className="flex-1"
                    aria-label={`Progression ${progress} %`}
                />
                <span className="text-[11.5px] text-slate-600 tabular-nums">{progress}%</span>
            </div>

            <div className="flex grow items-end gap-2 pt-1">
                <Button
                    size="xs"
                    onClick={() => navigate(`details/${action.incidentId}/${action.type}`)}
                    leftSection={<IconEye size={14} />}
                    variant="subtle"
                    color="teal"
                >
                    Détails
                </Button>
                <Tooltip label={updateTooltip} withArrow>
                    <span className="inline-flex">
                        <Button
                            size="xs"
                            onClick={() => { if (canUpdate) navigate(`update/${action.id}`); }}
                            leftSection={<IconPencilCheck size={14} />}
                            variant="subtle"
                            color="blue"
                            disabled={!canUpdate}
                        >
                            Mettre à jour
                        </Button>
                    </span>
                </Tooltip>
            </div>
        </div>
    );
};

export default CorrectiveActionCard;

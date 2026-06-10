import { Button, Tooltip } from "@mantine/core";
import { IconClock, IconEdit } from "@tabler/icons-react";
import { formatDateWithDay } from "../../../utility/DateFormats";
import { investMethodMap } from "../../../Data/DropdownData";
import { useNavigate } from "react-router-dom";

interface InvestigationData {
    id: number;
    incidentId: number;
    incidentTitle: string;
    method: string;
    startDate: string;
    endDate: string;
    status?: string;
    progress?: number;
}

const InvestigationCard = ({ investigation }: { investigation: InvestigationData }) => {
    const navigate = useNavigate();

    const methodLabel = investMethodMap[investigation.method] || investigation.method || "—";

    return (
        <div className="rounded-xl border border-gray-300 shadow-sm mt-4 p-4 bg-white flex flex-col gap-3 transition-[box-shadow,border-color] duration-200 hover:shadow-md cursor-pointer hover:border-primary">
            <div className="flex gap-4">
                <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded-lg">
                    {methodLabel}
                </span>
            </div>

            <div className="text-lg text-gray-900">{investigation.incidentTitle}</div>

            <div className="text-gray-500">
                Début : {formatDateWithDay(investigation.startDate)}
            </div>
            <div className="text-gray-500">
                Fin : {formatDateWithDay(investigation.endDate)}
            </div>

            <div className="flex  grow gap-2">
                {(() => {
                    const statusUpper = String(investigation?.status).toUpperCase();
                    const progress = Number(investigation?.progress ?? 0);
                    const canEdit = statusUpper === 'PENDING';
                    const canUpdate = progress < 100 && !['COMPLETED', 'PENDING', 'CANCELLED'].includes(statusUpper);
                    const editTooltip = canEdit
                        ? 'Modifier'
                        : statusUpper === 'COMPLETED' ? 'Investigation terminée — modification impossible'
                        : statusUpper === 'CANCELLED' ? 'Investigation annulée — modification impossible'
                        : 'Modification possible uniquement en attente d\'approbation';

                    const updateTooltip = canUpdate
                        ? 'Mettre à jour l\'avancement'
                        : statusUpper === 'PENDING' ? 'En attente d\'approbation — mise à jour impossible'
                        : statusUpper === 'CANCELLED' ? 'Investigation annulée — mise à jour impossible'
                        : progress >= 100 || statusUpper === 'COMPLETED' ? 'Investigation déjà terminée'
                        : 'Mise à jour non autorisée';

                    return (
                        <>
                            <Tooltip label={editTooltip}>
                                <div className="grow">
                                    <Button
                                        size="sm"
                                        leftSection={<IconEdit />}
                                        color="primary"
                                        fullWidth
                                        disabled={!canEdit}
                                        onClick={() => canEdit && navigate(`/incidents/investigation/${investigation.incidentId}`)}
                                    >
                                        Modifier
                                    </Button>
                                </div>
                            </Tooltip>
                            <Tooltip label={updateTooltip}>
                                <div className="grow">
                                    <Button
                                        size="sm"
                                        variant="light"
                                        leftSection={<IconClock />}
                                        color="blue"
                                        fullWidth
                                        disabled={!canUpdate}
                                        onClick={() => canUpdate && navigate(`/investigation/update/${investigation.id}`)}
                                    >
                                        Mettre à jour
                                    </Button>
                                </div>
                            </Tooltip>
                        </>
                    );
                })()}
            </div>
        </div>
    );
};

export default InvestigationCard;

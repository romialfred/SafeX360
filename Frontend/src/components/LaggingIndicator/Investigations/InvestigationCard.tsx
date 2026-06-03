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

    const methodLabel = investMethodMap[investigation.method] || "Unknown";

    return (
        <div className="rounded-xl border border-gray-300 shadow-sm mt-4 p-4 bg-white flex flex-col gap-3 transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-primary">
            <div className="flex gap-4">
                <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded-lg">
                    {methodLabel}
                </span>
            </div>

            <div className="text-lg text-gray-900">{investigation.incidentTitle}</div>

            <div className="text-gray-500">
                Start: {formatDateWithDay(investigation.startDate)}
            </div>
            <div className="text-gray-500">
                End: {formatDateWithDay(investigation.endDate)}
            </div>

            <div className="flex  grow gap-2">
                {(() => {
                    const statusUpper = String(investigation?.status).toUpperCase();
                    const progress = Number(investigation?.progress ?? 0);
                    const canEdit = statusUpper === 'PENDING';
                    const canUpdate = progress < 100 && !['COMPLETED', 'PENDING', 'CANCELLED'].includes(statusUpper);
                    const editTooltip = canEdit
                        ? 'Edit'
                        : statusUpper === 'COMPLETED' ? 'Cannot edit a completed investigation'
                        : statusUpper === 'CANCELLED' ? 'Cannot edit a cancelled investigation'
                        : 'Editing is only allowed while pending';

                    const updateTooltip = canUpdate
                        ? 'Update Progress'
                        : statusUpper === 'PENDING' ? 'Pending approval — cannot update yet'
                        : statusUpper === 'CANCELLED' ? 'Investigation cancelled — cannot update'
                        : progress >= 100 || statusUpper === 'COMPLETED' ? 'Already completed'
                        : 'Update not allowed';

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
                                        Edit
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
                                        Update
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

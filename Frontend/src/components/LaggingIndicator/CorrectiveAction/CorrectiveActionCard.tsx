import { Button, Progress, Tooltip } from "@mantine/core";
import { IconEye, IconPencilCheck } from "@tabler/icons-react";
import { actionTypesMap } from "../../../Data/DropdownData";
import { formatDateWithDay } from "../../../utility/DateFormats";
import { useNavigate } from "react-router-dom";

const CorrectiveActionCard = ({ action }: any) => {
    const navigate = useNavigate();
    const badgeColors: any = {
        priority: {
            Critical: "bg-red-700 text-white",
            High: "bg-red-500 text-white",
            Medium: "bg-yellow-400 text-white",
            Low: "bg-green-400 text-black",
        },
        status: {
            "In Progress": "bg-yellow-500 text-white",
            PENDING: "bg-orange-400 text-white",
            Completed: "bg-green-600 text-white",
        },
    };

    return (
        <div className="rounded-2xl border shadow-sm border-gray-200 p-5 bg-white flex flex-col gap-5 transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.01] cursor-pointer hover:border-primary/50">
            {/* Title and related info */}
            <div className="flex flex-col gap-1">
                <h2 className="text-lg line-clamp-1 text-gray-800">{action.actionName}</h2>
                {action.incidentTitle && (
                    <p className="text-sm text-gray-500">Related to: <span className="text-gray-700">{action.incidentTitle}</span></p>
                )}
            </div>

            {/* Assignee and deadline */}
            <div className="text-sm text-gray-600 space-y-1">
                <div><strong>Assigned to:</strong> <span className="text-gray-800">{action.assignedEmployeeName}</span></div>
                <div><strong>Deadline:</strong> <span className="text-gray-800">{formatDateWithDay(action.deadline)}</span></div>
                <div><strong>Progress:</strong> <span className="text-gray-800">{action.progress}%</span></div>
            </div>

            {/* Progress bar */}
            <Progress value={action.progress} radius="xl" size="md" color="blue" />

            {/* Badges */}
            <div className="flex gap-3 text-xs">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    {actionTypesMap[action.type]}
                </span>
                <span className={`px-3 py-1 rounded-full ${badgeColors.status[action?.status] || "bg-gray-200 text-gray-600"}`}>
                    {action?.status}
                </span>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center gap-4">
                <Button size="xs" onClick={() => navigate(`details/${action.incidentId}/${action.type}`)} leftSection={<IconEye />} variant="outline" color="gray">
                    View
                </Button>
                {(() => {
                    const statusUpper = String(action?.status).toUpperCase();
                    const progress = Number(action?.progress ?? 0);
                    const canUpdate = progress < 100 && statusUpper !== 'COMPLETED';
                    const tooltip = canUpdate
                        ? 'Update progress'
                        : statusUpper === 'PENDING' ? 'Pending approval — cannot update yet'
                            : statusUpper === 'CANCELLED' ? 'Action cancelled — cannot update'
                                : 'Already completed';
                    return (
                        <Tooltip label={tooltip}>
                            <span className="inline-flex">
                                <Button
                                    size="xs"
                                    onClick={() => { if (canUpdate) navigate(`update/${action.id}`); }}
                                    leftSection={<IconPencilCheck />}
                                    color="blue"
                                    disabled={!canUpdate}
                                >
                                    Update
                                </Button>
                            </span>
                        </Tooltip>
                    );
                })()}
            </div>
        </div>
    );
};

export default CorrectiveActionCard;

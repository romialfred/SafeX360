import { Button, Tooltip } from "@mantine/core";
import { IconEdit, IconSearch } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { formatDateWithDay, formatTo12Hour } from "../../../utility/DateFormats";
import { activityTypesMap, actionStatusesMap } from "../../../Data/DropdownData";

interface TourDataProps {
    tourData: any;
}

const badgeColors: Record<string, string> = {
    PENDING: "bg-blue-100 text-blue-600",
    ONGOING: "bg-yellow-100 text-yellow-600",
    COMPLETED: "bg-green-100 text-green-600",
    CANCELLED: "bg-red-100 text-red-600",
};

const TourCard = ({ tourData }: TourDataProps) => {
    const statusColor = badgeColors[tourData.status] || "bg-gray-100 text-gray-700";

    return (
        <div className="rounded-xl border border-gray-300 shadow-sm p-4 bg-white flex flex-col gap-3 transition-all duration-300 ease-in-out hover:shadow-md hover:scale-[1.02] cursor-pointer">
            <div className="flex gap-4">
                <span className="text-sm bg-blue-50 text-blue-800 px-2 py-1 rounded-lg font-medium">
                    {activityTypesMap[tourData.type] || "N/A"}
                </span>
                <span className={`text-sm px-2 py-1 rounded-lg font-medium ${statusColor}`}>
                    {actionStatusesMap[tourData.status] || tourData.status}
                </span>
            </div>

            <h2 className="font-semibold text-gray-900 text-base">{tourData.title}</h2>

            <div className="text-gray-500 text-sm font-medium">
                Frequency: {tourData.frequency}
            </div>

            <div className="text-gray-500 text-sm font-medium">
                Planned Date: {formatDateWithDay(tourData.plannedDate)}
            </div>

            <div className="text-gray-500 text-sm font-medium">
                Time: {formatTo12Hour(tourData.startTime)} - {formatTo12Hour(tourData.endTime)}
            </div>

            <div className="flex justify-center gap-4 mt-2">
                {(() => {
                    const statusUpper = String(tourData?.status || '').toUpperCase();
                    const canEdit = !['COMPLETED', 'CANCELLED'].includes(statusUpper);
                    const tooltip = canEdit ? 'Edit' : (statusUpper === 'COMPLETED' ? 'Completed — modification not possible' : 'Cancelled — modification not possible');
                    return (
                        <Tooltip label={tooltip}>
                            <span className="inline-flex">
                                <Button
                                    size="xs"
                                    variant="subtle"
                                    leftSection={<IconEdit size={15} />}
                                    color="primary"
                                    component={Link}
                                    to={canEdit ? `edit/${tourData.id}` : '#'}
                                    onClick={(e) => { if (!canEdit) e.preventDefault(); }}
                                    disabled={!canEdit}
                                >
                                    Edit
                                </Button>
                            </span>
                        </Tooltip>
                    );
                })()}
                <Button
                    size="xs"
                    variant="subtle"
                    leftSection={<IconSearch size={15} />}
                    color="blue"
                    component={Link}
                    to={`details-meeting/${tourData.id}`}
                >
                    View
                </Button>
                {/* <Button size="xs" variant="subtle" leftSection={<IconClipboardList size={15} />} color="teal">
                    Report
                </Button> */}
            </div>
        </div>
    );
};

export default TourCard;

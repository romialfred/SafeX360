import { Button, Tooltip } from "@mantine/core";
import { IconBook, IconCalendar, IconEye, IconEdit } from "@tabler/icons-react";
import { formatDateShort } from "../../../utility/DateFormats";
import { recMap } from "../../../Data/DropdownData";

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
}

const statusColorMap: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    DELAYED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-200 text-gray-700",
};

const getUpdateRestriction = (status: string, progress: number) => {
    const normalizedStatus = String(status ?? '').toUpperCase();
    const normalizedProgress = Number(progress ?? 0);

    if (normalizedProgress >= 100) {
        return 'Progress is already at 100%.';
    }

    if (normalizedStatus === 'PENDING') {
        return 'Pending recommendations cannot be updated.';
    }

    if (normalizedStatus === 'COMPLETED') {
        return 'Recommendation is already completed.';
    }

    if (normalizedStatus === 'CANCELLED') {
        return 'Cancelled recommendations cannot be updated.';
    }

    return null;
};

const RecommendationCard = ({ data, onView, onUpdate }: {
    data: RecommendationData;
    onView: () => void;
    onUpdate: () => void;
}) => {
    const statusStyle = statusColorMap[data.status?.toUpperCase()] || "bg-gray-100 text-gray-800";
    const updateRestriction = getUpdateRestriction(data?.status, data?.progress);
    const updateTooltip = updateRestriction ?? 'Update';

    return (
        <div className="rounded-xl border border-gray-300 shadow-sm p-4 bg-white flex flex-col gap-3 transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-primary">
            {/* Top badges */}
            <div className="flex flex-wrap gap-3">
                <span className={`text-sm px-2 py-1 rounded-lg font-medium ${statusStyle}`}>
                    {recMap[data.status]}
                </span>
                <span className="text-sm px-2 py-1 rounded-lg font-medium bg-orange-100 text-orange-800">
                    {data.progress}%
                </span>
                <span className="text-sm px-2 py-1 rounded-lg font-medium bg-sky-100 text-sky-800">
                    Department: {data.department}
                </span>
            </div>

            {/* Title */}
            <p className=" font-medium text-gray-700">{data.title}</p>

            {/* Audit Title */}
            <p className="text-gray-700 font-medium">Observation: {data.observation}</p>
            <p className="text-gray-700 font-medium">Responsible: {data.actionManagerId}</p>

            {/* Date */}
            <div className="text-gray-700 font-normal flex items-center gap-1">
                <IconCalendar size={16} /> Due: {formatDateShort(data.deadline)}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center grow gap-4">
                <Button size="xs" leftSection={<IconEye />} color="gray" variant="subtle" onClick={onView}>
                    View
                </Button>
                <Tooltip label={updateTooltip}>
                    <span className="inline-flex">
                        <Button
                            size="xs"
                            leftSection={<IconEdit />}
                            color="blue"
                            variant="subtle"
                            disabled={Boolean(updateRestriction)}
                            onClick={onUpdate}
                        >
                            Update
                        </Button>
                    </span>
                </Tooltip>
                <Button size="xs" leftSection={<IconBook />} color="green" variant="subtle">
                    Learn
                </Button>
            </div>
        </div>
    );
};

export default RecommendationCard;

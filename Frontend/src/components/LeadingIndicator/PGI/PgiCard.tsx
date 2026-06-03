import { Badge, Button, Tooltip } from "@mantine/core";
import { IconEdit, IconSearch } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { formatDateWithDay, formatTo12Hour } from "../../../utility/DateFormats";
import { actionStatusesMap } from "../../../Data/DropdownData";

interface PgiData {
    id: number;
    title: string;
    siteName: string;
    plannedDate: string;
    startTime: string;
    endTime: string;
    status: string;
}

const getSeverityClass = (status: string) => {
    switch (status) {
        case 'REPORTED':
            return 'text-orange-600 border-orange-300';
        case 'IN_PROGRESS':
            return 'text-yellow-700 border-yellow-300';
        case 'RESOLVED':
            return 'text-green-700 border-green-300';
        case 'CLOSED':
            return 'text-blue-700 border-blue-300';
        default:
            return 'text-gray-700 border-gray-300';
    }
};


const PgiCard = ({ pgiData }: { pgiData: PgiData }) => {
    return (
        <div className="rounded-xl border border-gray-300 shadow-sm p-4 bg-white flex flex-col gap-3 transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.0] mt-4 cursor-pointer hover:border-primary">
            <div className="flex gap-4 items-center flex-wrap">
                <span className="text-sm bg-blue-50 text-blue-800 px-2 py-1 rounded-lg">
                    {pgiData.siteName}
                </span>
                <Badge
                    radius="xl"
                    size="lg"

                    className={`!capitalize ${getSeverityClass(pgiData.status)}`}
                    variant="outline"
                >
                    {actionStatusesMap[pgiData.status]}
                </Badge>
            </div>

            <Link to={`details-pgi/${pgiData.id}`} className="text-gray-900">
                {pgiData.title}
            </Link>

            <div className="text-gray-500 text-sm">
                Inspection Date: {formatDateWithDay(pgiData.plannedDate)}
            </div>
            <div className="text-gray-500 text-sm">
                Time: {formatTo12Hour(pgiData.startTime)} - {formatTo12Hour(pgiData.endTime)}
            </div>

            <div className="flex   gap-4">
                {(() => {
                    const statusUpper = String(pgiData?.status || '').toUpperCase();
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
                                    to={canEdit ? `edit/${pgiData.id}` : '#'}
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
                    to={`details-pgi/${pgiData.id}`}
                >
                    View
                </Button>
            </div>
        </div>
    );
};

export default PgiCard;

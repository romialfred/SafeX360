import { Badge, Button, Tooltip } from '@mantine/core';
import { IconEdit, IconSearch } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { actionStatusesMap, activityTypesMap } from '../../../Data/DropdownData';
import { formatDateWithDay, formatTo12Hour } from '../../../utility/DateFormats';

interface HealthCardProps {
    healthData: any;
}

const HealthCard = ({ healthData }: HealthCardProps) => {
    return (
        <div className="rounded-xl border border-gray-300 shadow-sm p-4 bg-white flex flex-col gap-3 transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.0] cursor-pointer mt-4 hover:border-primary">
            <div className="flex gap-4">
                <span className="text-sm bg-green-50 text-green-800 px-2 py-1 rounded-full border border-green-200">
                    {activityTypesMap[healthData.type]}
                </span>
                <Badge radius="xl" color='yellow' size="lg" variant="outline" className="!capitalize">
                    {actionStatusesMap[healthData.status]}
                </Badge>
            </div>

            <h2 className="text-blue-600">{healthData.title}</h2>

            <div className="text-gray-500 text-sm">
                Planned Date: {formatDateWithDay(healthData.plannedDate)}
            </div>
            <div className="text-gray-500 text-sm">
                Time: {formatTo12Hour(healthData.startTime)} - {formatTo12Hour(healthData.endTime)}
            </div>

            <div className="flex  grow gap-4">
                {(() => {
                    const statusUpper = String(healthData?.status || '').toUpperCase();
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
                                    to={canEdit ? `editActivity/${healthData.id}` : '#'}
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
                    color="green"
                    component={Link}
                    to={`details-meeting/${healthData.id}`}
                >
                    Details
                </Button>
            </div>
        </div>
    );
};

export default HealthCard;

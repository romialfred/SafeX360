import React from 'react';
import { IconEdit, IconTrash, IconCalendar, IconUser, IconBuilding, IconTag } from '@tabler/icons-react';
import { ActionIcon } from '@mantine/core';
import { formatDateShort } from '../../../utility/DateFormats';

interface ActivityCardProps {
    activity: any;
    CategoryIcon: React.ElementType;
    getCategoryColor: (category: string) => string;
    getCategoryLabel: (category: string) => string;
    getStatusColor: (status: string) => string;
    onDelete: (id: string) => void;
    onEdit: (activity: any) => void;
    empMap: any;

}

const ActivityCard: React.FC<ActivityCardProps> = ({
    activity,
    CategoryIcon,
    getCategoryColor,
    getCategoryLabel,
    getStatusColor,
    onDelete,
    onEdit,
    empMap
}) => {
    return (
        <div
            className={`p-3 rounded-lg border ${getStatusColor(activity.status)} group relative bg-white/80 backdrop-blur-sm`}
        >
            {/* Category badge at the top */}
            <div className="flex items-start justify-between mb-2">
                <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs border  ${getCategoryColor(activity.category)}`}>
                    <CategoryIcon className="w-3 h-3 mr-1" />
                    {getCategoryLabel(activity.category)}
                </div>

                <div className="opacity-0 group-hover:opacity-100 flex space-x-1">

                    <ActionIcon
                        size="sm"
                        variant="light"
                        color="blue"
                        onClick={() => onEdit(activity)}
                    >
                        <IconEdit size={12} />
                    </ActionIcon>

                    <ActionIcon
                        size="sm"
                        variant="light"
                        color="red"
                        onClick={() => onDelete(activity.id)}
                    >
                        <IconTrash size={12} />
                    </ActionIcon>
                </div>
            </div>

            <h5 className="text-sm mb-2 leading-tight">{activity.title}</h5>

            <div className="space-y-1 text-xs">
                {activity.dateTime && (
                    <div className="flex items-center text-slate-600">
                        <IconCalendar className="w-3 h-3 mr-1" />
                        <span>{formatDateShort(activity.dateTime)}</span>
                    </div>
                )}
                <div className="flex items-center text-slate-600">
                    <IconUser className="w-3 h-3 mr-1" />
                    <span>{empMap[activity.responsibleId]?.name}</span>
                </div>
                <div className="flex items-center text-slate-600">
                    <IconBuilding className="w-3 h-3 mr-1" />
                    <span>{empMap[activity.responsibleId]?.department}</span>
                </div>
                {activity.theme && (
                    <div className="flex items-center text-slate-600">
                        <IconTag className="w-3 h-3 mr-1" />
                        <span>{activity.theme}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityCard;

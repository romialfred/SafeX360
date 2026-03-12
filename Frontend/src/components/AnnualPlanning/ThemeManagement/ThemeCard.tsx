import React from 'react';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { ActionIcon } from '@mantine/core';

interface ThemeCardProps {
    theme: any;
    categoryInfo: any;
    typeInfo: any;
    onEdit: (theme: any) => void;
    onDelete: (id: string) => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({ theme, categoryInfo, typeInfo, onEdit, onDelete }) => {
    return (
        <div
            key={theme.id}
            className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 group relative bg-white"
        >
            {/* < div className="flex items-start justify-between mb-2">
                <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                    <ActionIcon
                        size="sm"
                        variant="light"
                        color="blue"
                        onClick={() => onEdit(theme)}
                    >
                        <IconEdit size={12} />
                    </ActionIcon>

                    <ActionIcon
                        size="sm"
                        variant="light"
                        color="red"
                        onClick={() => onDelete(theme.id)}
                    >
                        <IconTrash size={12} />
                    </ActionIcon>
                </div>
            </div> */}

            <h5 className="font-medium text-sm mb-2 leading-tight">{theme.title}</h5>

            <p className="text-xs text-slate-600 mb-2 line-clamp-3">
                {theme.description}
            </p>

            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                    <span className={`${categoryInfo.color.replace('bg-', 'text-')} font-medium text-xs`}>
                        {categoryInfo.label}
                    </span>
                    <span className={`${typeInfo.color.replace('bg-', 'text-')} font-medium text-xs`}>
                        {typeInfo.label}
                    </span>
                </div>
                {/* {theme.participants && (
                    <span className="text-blue-600 font-medium">
                        {theme.participants} participants
                    </span>
                )} */}
                <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                    <ActionIcon
                        size="sm"
                        variant="light"
                        color="blue"
                        onClick={() => onEdit(theme)}
                    >
                        <IconEdit size={12} />
                    </ActionIcon>

                    <ActionIcon
                        size="sm"
                        variant="light"
                        color="red"
                        onClick={() => onDelete(theme.id)}
                    >
                        <IconTrash size={12} />
                    </ActionIcon>
                </div>
            </div>
        </div>
    );
};

export default ThemeCard;

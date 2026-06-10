import React from 'react';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { themeCategoryLabel } from '../planningLabels';

/**
 * Carte d'un thème mensuel : intitulé, description, type et catégorie
 * d'activité, avec actions de modification et suppression.
 */

interface ThemeCardProps {
    theme: any;
    typeInfo: { label: string; chip: string; dot: string };
    onEdit: (theme: any) => void;
    onDelete: (theme: any) => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({ theme, typeInfo, onEdit, onDelete }) => {
    return (
        <div className="p-3 rounded-lg border border-slate-200 bg-white">
            <div className="flex items-start justify-between gap-2">
                <h4 className="text-[13px] text-slate-800 leading-snug">{theme.title}</h4>
                <div className="flex gap-1 flex-shrink-0">
                    <Tooltip label="Modifier le thème" withArrow>
                        <ActionIcon
                            size="sm"
                            variant="light"
                            color="blue"
                            onClick={() => onEdit(theme)}
                            aria-label="Modifier le thème"
                        >
                            <IconEdit size={12} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Supprimer le thème" withArrow>
                        <ActionIcon
                            size="sm"
                            variant="light"
                            color="red"
                            onClick={() => onDelete(theme)}
                            aria-label="Supprimer le thème"
                        >
                            <IconTrash size={12} />
                        </ActionIcon>
                    </Tooltip>
                </div>
            </div>

            {theme.description && (
                <p className="text-[11.5px] text-slate-500 mt-1 line-clamp-3">{theme.description}</p>
            )}

            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${typeInfo.chip}`}>
                    {typeInfo.label}
                </span>
                {theme.category && (
                    <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-600">
                        {themeCategoryLabel(theme.category)}
                    </span>
                )}
            </div>
        </div>
    );
};

export default ThemeCard;

/**
 * PremiumKpiTile — KPI Tile gradient inspiré de NonConformityDashboard.
 *
 * Source intacte : NonConformityDashboard.tsx lignes 210-235.
 * Ce composant extrait le pattern pour réutilisation dans Audits,
 * Incidents, EPI, Risques, etc. sans toucher au module Non-conformité.
 *
 * Usage :
 *   <PremiumKpiTile
 *     index={0}
 *     label="Audits planifiés"
 *     value="12"
 *     icon={IconClipboardList}
 *   />
 */

import { Card, Text } from '@mantine/core';
import type { Icon as TablerIcon } from '@tabler/icons-react';
import {
    getKpiGradient,
    getKpiIconBg,
    getKpiIconColor,
} from './tokens';

export interface PremiumKpiTileProps {
    /** Position 0-4 dans le bandeau KPI (cycle après 5). */
    index: number;
    label: string;
    value: string | number;
    icon: TablerIcon;
    /** Action au clic (drill-down vers liste filtrée). */
    onClick?: () => void;
    /** Sous-texte optionnel (ex. "+3 vs mois dernier"). */
    trend?: string;
}

export default function PremiumKpiTile({
    index,
    label,
    value,
    icon: Icon,
    onClick,
    trend,
}: PremiumKpiTileProps) {
    return (
        <Card
            onClick={onClick}
            className={`relative transition-all duration-300 ease-out !rounded-2xl p-4 group ${
                onClick ? 'cursor-pointer' : ''
            } shadow-sm hover:shadow-md hover:scale-[1.02] hover:brightness-105 border border-transparent`}
            style={{ background: getKpiGradient(index) }}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={
                onClick
                    ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onClick();
                          }
                      }
                    : undefined
            }
        >
            <div className="relative z-10">
                <div className="flex justify-between gap-5">
                    <Text
                        size="sm"
                        className="text-slate-700 group-hover:text-slate-800 transition-opacity duration-300"
                    >
                        {label}
                    </Text>
                    <div
                        className={`mt-1 rounded-xl ${getKpiIconBg(index)} transition-all duration-300 p-1 group-hover:scale-110`}
                    >
                        <Icon
                            size={16}
                            className={`${getKpiIconColor(index)} transition-colors duration-300`}
                        />
                    </div>
                </div>
                <Text
                    size="2xl"
                    className="text-slate-800 group-hover:text-slate-900 transition-colors duration-300 font-mono"
                >
                    {value}
                </Text>
                {trend && (
                    <Text size="xs" className="text-slate-500 mt-1">
                        {trend}
                    </Text>
                )}
            </div>
        </Card>
    );
}

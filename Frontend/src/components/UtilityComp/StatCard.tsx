import { ReactNode } from 'react';
import { Tooltip } from '@mantine/core';

/**
 * Carte KPI sobre et professionnelle, partagée entre tous les modules.
 * Design : accent vertical gauche coloré + gros chiffre + label + badge optionnel.
 * Pattern inspiré du tableau de bord HSE.
 */

interface StatCardProps {
    label: string;
    value: number | string | null;
    icon?: ReactNode;
    color?: 'teal' | 'green' | 'red' | 'orange' | 'yellow' | 'blue' | 'indigo' | 'slate' | 'cyan' | 'pink' | 'amber' | 'violet';
    badge?: string;
    tooltip?: string;
    suffix?: string;
}

const colorMap = {
    teal: { from: 'from-teal-50', accent: 'bg-teal-500', iconBg: 'bg-teal-100/80', iconText: 'text-teal-700', badgeText: 'text-teal-700', badgeBg: 'bg-teal-100/80' },
    green: { from: 'from-green-50', accent: 'bg-green-500', iconBg: 'bg-green-100/80', iconText: 'text-green-700', badgeText: 'text-green-700', badgeBg: 'bg-green-100/80' },
    red: { from: 'from-red-50', accent: 'bg-red-500', iconBg: 'bg-red-100/80', iconText: 'text-red-700', badgeText: 'text-red-700', badgeBg: 'bg-red-100/80' },
    orange: { from: 'from-orange-50', accent: 'bg-orange-500', iconBg: 'bg-orange-100/80', iconText: 'text-orange-700', badgeText: 'text-orange-700', badgeBg: 'bg-orange-100/80' },
    yellow: { from: 'from-yellow-50', accent: 'bg-yellow-500', iconBg: 'bg-yellow-100/80', iconText: 'text-yellow-700', badgeText: 'text-yellow-700', badgeBg: 'bg-yellow-100/80' },
    blue: { from: 'from-blue-50', accent: 'bg-blue-500', iconBg: 'bg-blue-100/80', iconText: 'text-blue-700', badgeText: 'text-blue-700', badgeBg: 'bg-blue-100/80' },
    indigo: { from: 'from-indigo-50', accent: 'bg-indigo-500', iconBg: 'bg-indigo-100/80', iconText: 'text-indigo-700', badgeText: 'text-indigo-700', badgeBg: 'bg-indigo-100/80' },
    slate: { from: 'from-slate-50', accent: 'bg-slate-500', iconBg: 'bg-slate-100/80', iconText: 'text-slate-700', badgeText: 'text-slate-700', badgeBg: 'bg-slate-100/80' },
    cyan: { from: 'from-cyan-50', accent: 'bg-cyan-500', iconBg: 'bg-cyan-100/80', iconText: 'text-cyan-700', badgeText: 'text-cyan-700', badgeBg: 'bg-cyan-100/80' },
    pink: { from: 'from-pink-50', accent: 'bg-pink-500', iconBg: 'bg-pink-100/80', iconText: 'text-pink-700', badgeText: 'text-pink-700', badgeBg: 'bg-pink-100/80' },
    amber: { from: 'from-amber-50', accent: 'bg-amber-500', iconBg: 'bg-amber-100/80', iconText: 'text-amber-700', badgeText: 'text-amber-700', badgeBg: 'bg-amber-100/80' },
    violet: { from: 'from-violet-50', accent: 'bg-violet-500', iconBg: 'bg-violet-100/80', iconText: 'text-violet-700', badgeText: 'text-violet-700', badgeBg: 'bg-violet-100/80' },
};

const StatCard = ({ label, value, icon, color = 'teal', badge, tooltip, suffix }: StatCardProps) => {
    const colors = colorMap[color] || colorMap.teal;
    const displayValue = value === null || value === undefined ? '·' : `${value}${suffix || ''}`;
    const badgeContent = badge ? (
        <span className={`text-[10px] uppercase tracking-wider ${colors.badgeText} ${colors.badgeBg} px-1.5 py-0.5 rounded`}>
            {badge}
        </span>
    ) : null;

    return (
        <div className={`relative bg-gradient-to-br ${colors.from} via-white to-white rounded-xl border border-slate-200 p-4 overflow-hidden`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.accent}`}></div>
            <div className="flex items-start justify-between mb-2">
                {icon && (
                    <div className={`p-2 rounded-lg ${colors.iconBg}`}>
                        <span className={colors.iconText}>{icon}</span>
                    </div>
                )}
                {badge && (tooltip
                    ? <Tooltip label={tooltip} position="top" multiline w={220} withArrow>{badgeContent!}</Tooltip>
                    : badgeContent)}
            </div>
            <p className="text-2xl font-semibold text-slate-900 leading-none tabular-nums">{displayValue}</p>
            <p className="text-xs text-slate-600 mt-1.5">{label}</p>
        </div>
    );
};

export default StatCard;

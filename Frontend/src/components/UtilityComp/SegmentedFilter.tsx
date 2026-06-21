import { ReactNode } from 'react';

/**
 * Filtre par onglets sobres et professionnels.
 * Remplace les <Tabs> rudimentaires avec un design pills cohérent.
 *
 * Pattern : pills sur fond blanc avec bordure, état actif teal solide.
 */

export interface SegmentedFilterOption {
    value: string;
    label: string;
    count?: number;
    color?: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'slate' | 'teal' | 'indigo' | 'gray' | 'violet' | 'rose' | 'amber';
}

interface SegmentedFilterProps {
    value: string;
    onChange: (value: string) => void;
    options: SegmentedFilterOption[];
    leftElement?: ReactNode;
    rightElement?: ReactNode;
    size?: 'sm' | 'md';
}

const colorActiveMap: Record<string, string> = {
    red: 'bg-red-50 text-red-700 border border-red-200 font-medium',
    orange: 'bg-orange-50 text-orange-700 border border-orange-200 font-medium',
    yellow: 'bg-amber-50 text-amber-700 border border-amber-200 font-medium',
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200 font-medium',
    slate: 'bg-slate-100 text-slate-800 border border-slate-300 font-medium',
    teal: 'bg-teal-50 text-teal-700 border border-teal-200 font-medium',
    indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium',
    gray: 'bg-slate-100 text-slate-700 border border-slate-300 font-medium',
    violet: 'bg-violet-50 text-violet-700 border border-violet-200 font-medium',
    rose: 'bg-rose-50 text-rose-700 border border-rose-200 font-medium',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200 font-medium',
};

const colorCountActiveMap: Record<string, string> = {
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
    yellow: 'bg-amber-100 text-amber-700',
    green: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    slate: 'bg-slate-200 text-slate-700',
    teal: 'bg-teal-100 text-teal-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    gray: 'bg-slate-200 text-slate-600',
    violet: 'bg-violet-100 text-violet-700',
    rose: 'bg-rose-100 text-rose-700',
    amber: 'bg-amber-100 text-amber-700',
};

const SegmentedFilter = ({ value, onChange, options, leftElement, rightElement, size = 'sm' }: SegmentedFilterProps) => {
    return (
        <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
                {leftElement}
                <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    {options.map((opt) => {
                        const isActive = value === opt.value;
                        const activeClass = isActive ? (colorActiveMap[opt.color || 'teal'] || colorActiveMap.teal) : 'text-slate-600 hover:bg-white hover:text-slate-900';
                        const countClass = isActive
                            ? (colorCountActiveMap[opt.color || 'teal'])
                            : 'bg-slate-200 text-slate-600';
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => onChange(opt.value)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md ${size === 'sm' ? 'text-xs' : 'text-sm'} transition-colors ${activeClass}`}
                            >
                                {opt.label}
                                {opt.count !== undefined && (
                                    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded text-[10px] ${countClass}`}>
                                        {opt.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            {rightElement && (
                <div className="flex items-center gap-2 flex-wrap">
                    {rightElement}
                </div>
            )}
        </div>
    );
};

export default SegmentedFilter;

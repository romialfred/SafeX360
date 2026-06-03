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
    color?: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'slate' | 'teal' | 'indigo' | 'gray';
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
    red: 'bg-red-600 text-white',
    orange: 'bg-orange-600 text-white',
    yellow: 'bg-yellow-600 text-white',
    green: 'bg-green-600 text-white',
    blue: 'bg-blue-600 text-white',
    slate: 'bg-slate-700 text-white',
    teal: 'bg-teal-600 text-white',
    indigo: 'bg-indigo-600 text-white',
    gray: 'bg-slate-600 text-white',
};

const colorCountActiveMap: Record<string, string> = {
    red: 'bg-white/20',
    orange: 'bg-white/20',
    yellow: 'bg-white/20',
    green: 'bg-white/20',
    blue: 'bg-white/20',
    slate: 'bg-white/20',
    teal: 'bg-white/20',
    indigo: 'bg-white/20',
    gray: 'bg-white/20',
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
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md ${size === 'sm' ? 'text-xs' : 'text-sm'} transition-all ${activeClass}`}
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

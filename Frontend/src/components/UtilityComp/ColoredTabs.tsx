import { ReactNode } from 'react';

/**
 * ColoredTabs — Onglets colorés (LOT 41).
 *
 * Remplace les onglets ternes noir/gris par une version moderne :
 *   - Onglet actif : fond coloré teal/blanc avec barre d'accent en dessous
 *   - Onglet inactif : texte slate-500, hover slate-700
 *   - Compteur optionnel à droite du label
 *   - Icône optionnelle à gauche
 *
 * Usage :
 *   <ColoredTabs
 *     activeId={current}
 *     onChange={setCurrent}
 *     tabs={[
 *       { id: 'all', label: 'Tous', count: 47 },
 *       { id: 'open', label: 'Ouvertes', count: 23, tone: 'red' },
 *       { id: 'closed', label: 'Clôturées', count: 24, tone: 'green' },
 *     ]}
 *   />
 */

type Tone = 'teal' | 'red' | 'amber' | 'green' | 'blue' | 'violet' | 'slate';

export interface ColoredTab {
    id: string;
    label: string;
    icon?: ReactNode;
    count?: number;
    tone?: Tone;
}

interface Props {
    tabs: ColoredTab[];
    activeId: string;
    onChange: (id: string) => void;
    /** Largeur : "fit" = chaque onglet à la taille de son contenu ; "full" = répartition équitable */
    layout?: 'fit' | 'full';
    /** Style visuel : "underline" = barre fine en dessous (par défaut) ; "pill" = badge pilule pleine */
    variant?: 'underline' | 'pill';
}

const TONE_ACTIVE: Record<Tone, { text: string; bar: string; bg: string; ring: string }> = {
    teal:   { text: 'text-teal-700',   bar: 'bg-teal-600',   bg: 'bg-teal-50',   ring: 'ring-teal-500/40' },
    red:    { text: 'text-red-700',    bar: 'bg-red-600',    bg: 'bg-red-50',    ring: 'ring-red-500/40' },
    amber:  { text: 'text-amber-800',  bar: 'bg-amber-600',  bg: 'bg-amber-50',  ring: 'ring-amber-500/40' },
    green:  { text: 'text-emerald-700',bar: 'bg-emerald-600',bg: 'bg-emerald-50',ring: 'ring-emerald-500/40' },
    blue:   { text: 'text-sky-700',    bar: 'bg-sky-600',    bg: 'bg-sky-50',    ring: 'ring-sky-500/40' },
    violet: { text: 'text-violet-700', bar: 'bg-violet-600', bg: 'bg-violet-50', ring: 'ring-violet-500/40' },
    slate:  { text: 'text-slate-800',  bar: 'bg-slate-700',  bg: 'bg-slate-100', ring: 'ring-slate-500/40' },
};

export default function ColoredTabs({
    tabs,
    activeId,
    onChange,
    layout = 'fit',
    variant = 'underline',
}: Props) {
    return (
        <div
            role="tablist"
            className={`relative ${variant === 'underline' ? 'border-b border-slate-200' : ''} ${
                layout === 'full' ? 'grid grid-flow-col auto-cols-fr' : 'flex flex-wrap'
            } gap-1`}
        >
            {tabs.map((tab) => {
                const isActive = tab.id === activeId;
                const tone = tab.tone || 'teal';
                const cfg = TONE_ACTIVE[tone];

                if (variant === 'pill') {
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => onChange(tab.id)}
                            className={`inline-flex items-center gap-2 px-3.5 h-9 rounded-full text-[13px] font-medium transition-all whitespace-nowrap ${
                                isActive
                                    ? `${cfg.bg} ${cfg.text} ring-1 ${cfg.ring}`
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span
                                    className={`inline-flex items-center justify-center min-w-[20px] h-[18px] px-1 rounded text-[11px] ${
                                        isActive ? 'bg-white/70' : 'bg-slate-200/70 text-slate-700'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                }

                // variant underline
                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(tab.id)}
                        className={`relative inline-flex items-center gap-2 px-4 h-10 text-[13.5px] font-medium transition-colors whitespace-nowrap ${
                            isActive
                                ? cfg.text
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                        {tab.count !== undefined && (
                            <span
                                className={`inline-flex items-center justify-center min-w-[20px] h-[18px] px-1 rounded text-[11px] ${
                                    isActive ? `${cfg.bg} ${cfg.text}` : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                                {tab.count}
                            </span>
                        )}
                        {/* Barre d'accent active */}
                        {isActive && (
                            <span
                                className={`absolute -bottom-px left-2 right-2 h-[2.5px] rounded-t ${cfg.bar}`}
                                aria-hidden="true"
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
}

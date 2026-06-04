import { ReactNode } from 'react';
import { IconInbox } from '@tabler/icons-react';

/**
 * EmptyState — Pattern unifié pour les listes vides.
 *
 * Remplace les "Aucun enregistrement" génériques par un état empty
 * professionnel : icône + titre serif + description + CTA optionnel.
 *
 * Utilisation :
 *   <EmptyState
 *     icon={<IconShield />}
 *     title="Aucun incident déclaré"
 *     description="Les incidents apparaîtront ici une fois déclarés."
 *     action={<Button>Déclarer un incident</Button>}
 *   />
 */

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    /** Variante compacte (utilisable dans une carte) */
    compact?: boolean;
    /** Couleur de l'icône — défaut slate */
    iconColor?: 'teal' | 'slate' | 'amber' | 'rose' | 'emerald' | 'sky' | 'indigo';
}

const ICON_COLOR_MAP = {
    teal:    { bg: 'bg-teal-50',    text: 'text-teal-600',    border: 'border-teal-100' },
    slate:   { bg: 'bg-slate-50',   text: 'text-slate-500',   border: 'border-slate-200' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100' },
    rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    sky:     { bg: 'bg-sky-50',     text: 'text-sky-600',     border: 'border-sky-100' },
    indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-100' },
};

export default function EmptyState({
    icon,
    title,
    description,
    action,
    compact = false,
    iconColor = 'slate',
}: EmptyStateProps) {
    const colors = ICON_COLOR_MAP[iconColor];
    const finalIcon = icon ?? <IconInbox size={compact ? 20 : 28} />;

    return (
        <div
            className={`flex flex-col items-center justify-center text-center ${
                compact ? 'py-8 px-4' : 'py-14 px-6'
            }`}
            role="status"
            aria-live="polite"
        >
            <div
                className={`flex items-center justify-center rounded-full border ${colors.bg} ${colors.border} ${colors.text} ${
                    compact ? 'w-12 h-12' : 'w-16 h-16'
                }`}
                aria-hidden="true"
            >
                {finalIcon}
            </div>

            <h3
                className="text-slate-800 mt-4"
                style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontWeight: 500,
                    fontSize: compact ? '15px' : '17px',
                    letterSpacing: '-0.008em',
                }}
            >
                {title}
            </h3>

            {description && (
                <p className="text-[13px] text-slate-500 mt-1.5 max-w-md leading-relaxed">
                    {description}
                </p>
            )}

            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

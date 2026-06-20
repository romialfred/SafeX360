/**
 * ErrorChips — pastilles (chips) réutilisables du module Gestion des Erreurs.
 * Statut, criticité, HiPo, anonymat, niveau de cause — charte signature NAVY.
 */

import { IconEyeOff, IconFlame } from '@tabler/icons-react';
import type {
    CauseLevel,
    CriticalityLevel,
    ErrorEventStatus,
} from '../../services/ErrorManagementService';
import {
    CAUSE_LEVEL_LABELS,
    CAUSE_LEVEL_TONE,
    CRITICALITY_LABELS,
    CRITICALITY_TONE,
    STATUS_LABELS,
    STATUS_TONE,
    type ChipTone,
} from './errorManagementLabels';

interface BaseChipProps {
    tone: ChipTone;
    label: string;
    className?: string;
}

const BaseChip = ({ tone, label, className = '' }: BaseChipProps) => (
    <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${tone.bg} ${tone.border} ${tone.text} text-[11.5px] font-medium ${className}`}
    >
        <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
        {label}
    </span>
);

export const StatusChip = ({ status }: { status?: ErrorEventStatus | null }) => {
    if (!status) return <span className="text-[11.5px] text-slate-400">n/d</span>;
    return <BaseChip tone={STATUS_TONE[status]} label={STATUS_LABELS[status] ?? status} />;
};

export const CriticalityChip = ({
    level,
    colorHex,
}: {
    level?: CriticalityLevel | null;
    colorHex?: string | null;
}) => {
    if (!level) return <span className="text-[11.5px] text-slate-400">n/d</span>;
    const tone = CRITICALITY_TONE[level];
    // Si la matrice fournit une couleur, on l'utilise pour la pastille (cohérence référentiel).
    if (colorHex) {
        return (
            <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11.5px] font-medium"
                style={{
                    backgroundColor: `${colorHex}1A`,
                    borderColor: `${colorHex}55`,
                    color: colorHex,
                }}
            >
                <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: colorHex }}
                    aria-hidden="true"
                />
                {CRITICALITY_LABELS[level] ?? level}
            </span>
        );
    }
    return <BaseChip tone={tone} label={CRITICALITY_LABELS[level] ?? level} />;
};

export const CauseLevelChip = ({ level }: { level?: CauseLevel | null }) => {
    if (!level) return <span className="text-[11.5px] text-slate-400">n/d</span>;
    return <BaseChip tone={CAUSE_LEVEL_TONE[level]} label={CAUSE_LEVEL_LABELS[level] ?? level} />;
};

export const HipoBadge = ({ size = 'sm' }: { size?: 'sm' | 'xs' }) => (
    <span
        className={`inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 text-red-800 font-semibold ${
            size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
        }`}
        title="Événement à potentiel grave (HiPo / SIF)"
    >
        <IconFlame size={size === 'xs' ? 11 : 12} stroke={2} aria-hidden="true" />
        HiPo
    </span>
);

export const AnonymousBadge = () => (
    <span
        className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 text-slate-700 font-medium px-2 py-0.5 text-[11px]"
        title="Déclaration anonyme : le déclarant n'est pas identifié"
    >
        <IconEyeOff size={12} stroke={1.8} aria-hidden="true" />
        Anonyme
    </span>
);

/** Pastille d'un type d'événement, colorée d'après le référentiel (colorHex). */
export const EventTypeChip = ({
    label,
    colorHex,
}: {
    label?: string | null;
    colorHex?: string | null;
}) => {
    if (!label) return <span className="text-[11.5px] text-slate-400">n/d</span>;
    const color = colorHex || '#1E3A5F';
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11.5px] font-medium max-w-full"
            style={{
                backgroundColor: `${color}14`,
                borderColor: `${color}40`,
                color,
            }}
        >
            <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
                aria-hidden="true"
            />
            <span className="truncate">{label}</span>
        </span>
    );
};

/**
 * PremiumStatusBadge — Badge de statut/sévérité/priorité.
 *
 * Source : NonConformityDashboard.tsx lignes 281-299.
 * Unifie l'affichage des statuts dans tous les modules refondus.
 *
 * 3 modes :
 *  - severity : couleur basée sur SEVERITY_COLORS (insignifiante…catastrophique)
 *  - priority : couleur basée sur PRIORITY_COLORS (faible…urgente)
 *  - status   : couleur basée sur STATUS_COLORS (workflow)
 *
 * Usage :
 *   <PremiumStatusBadge mode="severity" value="Majeure" />
 *   <PremiumStatusBadge mode="status" value="ANALYSIS" label="En analyse" />
 */

import { Badge } from '@mantine/core';
import {
    getSeverityColor,
    getPriorityColor,
    getStatusColor,
} from './tokens';

export interface PremiumStatusBadgeProps {
    mode: 'severity' | 'priority' | 'status';
    value: string;
    /** Texte affiché (sinon = value brute). Utile pour traduire un enum. */
    label?: string;
    /** Variante visuelle Mantine. */
    variant?: 'light' | 'outline' | 'filled' | 'dot';
    /** Taille du badge. */
    size?: 'xs' | 'sm' | 'md' | 'lg';
    /** Forme : rounded-full ou rectangle léger. */
    rounded?: boolean;
}

export default function PremiumStatusBadge({
    mode,
    value,
    label,
    variant = 'light',
    size = 'sm',
    rounded = true,
}: PremiumStatusBadgeProps) {
    const color =
        mode === 'severity'
            ? getSeverityColor(value)
            : mode === 'priority'
              ? getPriorityColor(value)
              : getStatusColor(value);

    return (
        <Badge
            color={color}
            variant={variant}
            size={size}
            className={`whitespace-nowrap ${rounded ? 'rounded-full' : ''}`}
        >
            {label ?? value}
        </Badge>
    );
}

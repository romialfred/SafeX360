/**
 * InspectionStatusBadge — Composant badge de statut reutilisable pour le
 * module Inspections refondu.
 *
 * Convention couleurs alignee sur les autres modules (Blast / Dosimetry) :
 *   - SCHEDULED  : bleu (a venir)
 *   - IN_PROGRESS: amber (en cours)
 *   - SUBMITTED  : violet (en attente validation)
 *   - APPROVED   : emeraude (valide)
 *   - ARCHIVED   : slate (clos)
 *   - REJECTED   : rouge (a corriger)
 *   - PENDING / COMPLETED / CANCELLED : legacy fallback
 *
 * Tous les badges incluent un dot avant le libelle pour l'accessibilite
 * WCAG (forme + couleur).
 */

import { useTranslation } from 'react-i18next';
import type { InspectionStatus } from '../../services/InspectionService';

interface StatusConfig {
    bg: string;
    border: string;
    text: string;
    dot: string;
}

const CONFIG: Record<InspectionStatus, StatusConfig> = {
    SCHEDULED:   { bg: 'bg-cyan-50',     border: 'border-cyan-200',     text: 'text-cyan-800',     dot: 'bg-cyan-500' },
    IN_PROGRESS: { bg: 'bg-amber-50',    border: 'border-amber-200',    text: 'text-amber-800',    dot: 'bg-amber-500' },
    SUBMITTED:   { bg: 'bg-violet-50',   border: 'border-violet-200',   text: 'text-violet-800',   dot: 'bg-violet-500' },
    APPROVED:    { bg: 'bg-emerald-50',  border: 'border-emerald-200',  text: 'text-emerald-800',  dot: 'bg-emerald-500' },
    ARCHIVED:    { bg: 'bg-slate-50',    border: 'border-slate-300',    text: 'text-slate-700',    dot: 'bg-slate-500' },
    REJECTED:    { bg: 'bg-rose-50',     border: 'border-rose-200',     text: 'text-rose-800',     dot: 'bg-rose-500' },
    PENDING:     { bg: 'bg-slate-50',    border: 'border-slate-200',    text: 'text-slate-700',    dot: 'bg-slate-400' },
    COMPLETED:   { bg: 'bg-emerald-50',  border: 'border-emerald-200',  text: 'text-emerald-800',  dot: 'bg-emerald-500' },
    CANCELLED:   { bg: 'bg-slate-50',    border: 'border-slate-200',    text: 'text-slate-500',    dot: 'bg-slate-400' },
};

interface InspectionStatusBadgeProps {
    status: InspectionStatus;
    size?: 'sm' | 'md';
}

export function InspectionStatusBadge({ status, size = 'sm' }: InspectionStatusBadgeProps) {
    const { t } = useTranslation('inspection');
    const cfg = CONFIG[status] ?? CONFIG.PENDING;
    const padding = size === 'sm' ? 'px-1.5 py-0.5 text-[10.5px]' : 'px-2 py-1 text-[12px]';
    return (
        <span
            className={`inline-flex items-center gap-1 ${padding} rounded font-medium border ${cfg.bg} ${cfg.border} ${cfg.text}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
            {t(`statuses.${status}`, { defaultValue: status })}
        </span>
    );
}

export default InspectionStatusBadge;

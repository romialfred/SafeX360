/**
 * PremiumFormSection — Section de formulaire raffinée.
 *
 * Source : DeclarationStep / TreatmentStep / AnalysisStep de Non-conformité.
 * Pattern : titre uppercase tracking-wide en haut + bloc enveloppant card.
 *
 * Usage :
 *   <PremiumFormSection
 *     title="Informations générales"
 *     subtitle="Identification de la non-conformité"
 *     icon={IconClipboardList}
 *   >
 *     <TextInput label="..." />
 *   </PremiumFormSection>
 */

import { Paper, Text } from '@mantine/core';
import type { Icon as TablerIcon } from '@tabler/icons-react';
import { ReactNode } from 'react';

export interface PremiumFormSectionProps {
    title: string;
    /** Sous-titre optionnel. */
    subtitle?: string;
    /** Icône à gauche du titre (tabler). */
    icon?: TablerIcon;
    /** Couleur de l'accent de l'icône. */
    accent?: 'slate' | 'blue' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';
    /** Actions en haut à droite (boutons, badges, etc.). */
    actions?: ReactNode;
    /** Contenu de la section (le formulaire à proprement parler). */
    children: ReactNode;
    /** Espacement interne réduit (densité). */
    dense?: boolean;
}

const ACCENT_BG: Record<NonNullable<PremiumFormSectionProps['accent']>, string> = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-100 text-blue-700',
    cyan: 'bg-cyan-100 text-cyan-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
    violet: 'bg-violet-100 text-violet-700',
};

export default function PremiumFormSection({
    title,
    subtitle,
    icon: Icon,
    accent = 'slate',
    actions,
    children,
    dense = false,
}: PremiumFormSectionProps) {
    return (
        <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    {Icon && (
                        <div
                            className={`w-9 h-9 rounded-lg ${ACCENT_BG[accent]} flex items-center justify-center flex-shrink-0`}
                        >
                            <Icon size={17} stroke={1.8} />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <Text
                            className="text-slate-900 leading-tight"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: '15px',
                            }}
                        >
                            {title}
                        </Text>
                        {subtitle && (
                            <Text size="xs" className="text-slate-500 mt-0.5">
                                {subtitle}
                            </Text>
                        )}
                    </div>
                </div>
                {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
            </div>
            <div className={dense ? 'p-4' : 'p-5'}>{children}</div>
        </Paper>
    );
}

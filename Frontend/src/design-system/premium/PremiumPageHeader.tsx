/**
 * PremiumPageHeader — Wrapper minimal autour du PageHeader existant.
 *
 * Le composant PageHeader actuel (UtilityComp/PageHeader.tsx) est déjà aligné
 * sur le pattern Non-conformité. Ce wrapper ne change pas son comportement,
 * il ajoute uniquement :
 *  - une référence ISO automatique en sous-titre (via tokens.ISO_REFS)
 *  - une convention de badge N° standardisée
 *
 * Pour ne pas créer de régression sur les pages qui utilisent déjà PageHeader,
 * ce composant est un strict superset : tout passe en props et est délégué.
 *
 * Usage :
 *   <PremiumPageHeader
 *     breadcrumbs={[{label:'Accueil', to:'/'}, {label:'Audits'}]}
 *     title="Planification des audits"
 *     icon={<IconClipboardCheck size={22} />}
 *     iconColor="blue"
 *     isoRef="AUDIT"   // ajoute "ISO 19011 — Audits…" en sous-titre
 *     refNumber="AUD-2026-007"
 *     actions={<Button color="blue">Nouveau plan</Button>}
 *   />
 */

import { ReactNode } from 'react';
import { IconHash } from '@tabler/icons-react';
import PageHeader from '../../components/UtilityComp/PageHeader';
import { ISO_REFS } from './tokens';

export interface PremiumPageHeaderProps {
    breadcrumbs: { label: string; to?: string }[];
    title: string;
    /** Sous-titre custom (sinon généré depuis isoRef si fourni). */
    subtitle?: string;
    /** Référence ISO du module : génère un sous-titre automatique. */
    isoRef?: keyof typeof ISO_REFS;
    /** Icône du module (élément ReactNode pour respecter PageHeader). */
    icon?: ReactNode;
    /** Couleur Mantine de l'icône. */
    iconColor?: 'teal' | 'green' | 'red' | 'orange' | 'yellow' | 'blue' | 'indigo' | 'slate' | 'cyan' | 'pink' | 'amber' | 'violet';
    /** Numéro de référence (ex. AUD-2026-007) affiché comme badge mono. */
    refNumber?: string;
    /** Badge custom (à la place de refNumber). */
    badge?: ReactNode;
    /** Actions à droite (boutons). */
    actions?: ReactNode;
}

export default function PremiumPageHeader({
    breadcrumbs,
    title,
    subtitle,
    isoRef,
    icon,
    iconColor,
    refNumber,
    badge,
    actions,
}: PremiumPageHeaderProps) {
    const finalSubtitle = subtitle ?? (isoRef ? ISO_REFS[isoRef] : undefined);

    const finalBadge =
        badge ??
        (refNumber ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                <IconHash size={13} className="text-slate-500" />
                <span className="text-xs font-mono text-slate-700">{refNumber}</span>
            </div>
        ) : undefined);

    return (
        <PageHeader
            breadcrumbs={breadcrumbs}
            icon={icon}
            iconColor={iconColor}
            title={title}
            subtitle={finalSubtitle}
            badge={finalBadge}
            actions={actions}
        />
    );
}

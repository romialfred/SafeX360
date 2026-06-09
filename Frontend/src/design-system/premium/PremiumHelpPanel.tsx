/**
 * PremiumHelpPanel — Volet d'aide collapsible aligné Non-conformité.
 *
 * Source : NonConformityForm.tsx ligne 488 (grid 3 colonnes / 1).
 * Pattern : à droite du formulaire, peut être masqué pour gagner de la
 * place. Contient les références ISO, les étapes du workflow, les liens
 * vers la documentation.
 *
 * Usage :
 *   const [helpVisible, setHelpVisible] = useState(true);
 *   <div className={`grid grid-cols-1 gap-5 ${helpVisible ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
 *     <div className={helpVisible ? 'lg:col-span-2' : 'lg:col-span-1'}>
 *       {formContent}
 *     </div>
 *     {helpVisible && (
 *       <PremiumHelpPanel title="Aide à la saisie" icoRef="AUDIT">
 *         <p>Conseils contextuels...</p>
 *       </PremiumHelpPanel>
 *     )}
 *   </div>
 */

import { Paper, Text } from '@mantine/core';
import { IconBook2, IconExternalLink } from '@tabler/icons-react';
import { ReactNode } from 'react';
import { ISO_REFS } from './tokens';

export interface PremiumHelpPanelProps {
    /** Titre du volet (ex. "Aide à la saisie"). */
    title: string;
    /** Référence ISO pour le badge top-right. */
    isoRef?: keyof typeof ISO_REFS;
    /** Lien vers la documentation complète du module. */
    docHref?: string;
    /** Contenu pédagogique (étapes, conseils, exemples). */
    children: ReactNode;
}

export default function PremiumHelpPanel({
    title,
    isoRef,
    docHref,
    children,
}: PremiumHelpPanelProps) {
    return (
        <Paper
            className="bg-slate-50/60 border border-slate-200 rounded-xl shadow-sm"
            role="complementary"
            aria-label={title}
        >
            <div className="px-5 py-3 border-b border-slate-200/70 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                        <IconBook2 size={15} stroke={1.8} />
                    </div>
                    <div className="min-w-0">
                        <Text
                            className="text-slate-900 leading-tight"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: '14px',
                            }}
                        >
                            {title}
                        </Text>
                        {isoRef && (
                            <Text size="xs" className="text-slate-500 mt-0.5">
                                {ISO_REFS[isoRef]}
                            </Text>
                        )}
                    </div>
                </div>
            </div>
            <div className="px-5 py-4 text-[13px] text-slate-700 leading-relaxed space-y-3">
                {children}
                {docHref && (
                    <a
                        href={docHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-800 text-[12px] underline-offset-2 hover:underline"
                    >
                        Documentation complète
                        <IconExternalLink size={11} stroke={1.8} />
                    </a>
                )}
            </div>
        </Paper>
    );
}

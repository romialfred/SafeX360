import { useState, type ReactNode } from 'react';
import { Button, Tooltip } from '@mantine/core';
import { IconLayoutSidebarRightCollapse, IconLayoutSidebarRightExpand } from '@tabler/icons-react';
import HelpPanel, { type HelpItem, type HelpIconColor } from './HelpPanel';

/**
 * FormWithHelp — wrapper layout réutilisable pour tout formulaire SafeX360.
 *
 * Reproduit le pattern du formulaire ReportIncidents :
 *  - colonne principale formulaire (lg:col-span-2)
 *  - volet d'aide latéral collapsible (lg:col-span-1)
 *  - bouton flottant pour rouvrir l'aide quand elle est masquée
 *  - bascule plein écran : formulaire passe en lg:col-span-3 quand aide fermée
 *
 * Utilisation :
 *  <FormWithHelp
 *      helpTitle="Aide : Programmer un audit"
 *      helpSubtitle="Renseignez les paramètres essentiels."
 *      helpItems={items}
 *      helpTip="..."
 *  >
 *      {form JSX here}
 *  </FormWithHelp>
 */

interface FormWithHelpProps {
    children: ReactNode;
    helpTitle: string;
    helpSubtitle?: string;
    helpItems: HelpItem[];
    helpTip?: string;
    helpAccentColor?: HelpIconColor;
    /** Affiche le bouton de bascule en haut à droite (optionnel, par défaut: visible) */
    showToggleButton?: boolean;
    /** Position du bouton de bascule. Si null, pas de bouton intégré (le parent gère). */
    toggleButtonSlot?: 'inline' | 'none';
}

const FormWithHelp = ({
    children,
    helpTitle,
    helpSubtitle,
    helpItems,
    helpTip,
    helpAccentColor = 'teal',
    toggleButtonSlot = 'inline',
}: FormWithHelpProps) => {
    const [helpVisible, setHelpVisible] = useState(true);

    return (
        <div className="space-y-3">
            {toggleButtonSlot === 'inline' && (
                <div className="flex justify-end">
                    <Tooltip label={helpVisible ? "Masquer le volet d'aide" : "Afficher le volet d'aide"}>
                        <Button
                            size="xs"
                            variant="subtle"
                            color="gray"
                            onClick={() => setHelpVisible((v) => !v)}
                            leftSection={helpVisible
                                ? <IconLayoutSidebarRightCollapse size={14} />
                                : <IconLayoutSidebarRightExpand size={14} />}
                        >
                            {helpVisible ? "Masquer l'aide" : "Afficher l'aide"}
                        </Button>
                    </Tooltip>
                </div>
            )}

            <div className={`grid grid-cols-1 gap-5 ${helpVisible ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
                <div className={helpVisible ? 'lg:col-span-2 space-y-5' : 'lg:col-span-1 space-y-5'}>
                    {children}
                </div>
                {helpVisible && (
                    <div className="lg:col-span-1">
                        <HelpPanel
                            title={helpTitle}
                            subtitle={helpSubtitle}
                            items={helpItems}
                            tip={helpTip}
                            accentColor={helpAccentColor}
                            onClose={() => setHelpVisible(false)}
                        />
                    </div>
                )}
            </div>

            {!helpVisible && (
                <Tooltip label="Afficher le volet d'aide" position="left" withArrow>
                    <button
                        type="button"
                        onClick={() => setHelpVisible(true)}
                        className="fixed right-0 top-1/3 z-40 bg-teal-600 hover:bg-teal-700 text-white px-3 py-3 rounded-l-lg shadow-xl flex flex-col items-center gap-1 transition-all"
                        aria-label="Afficher le volet d'aide"
                    >
                        <IconLayoutSidebarRightExpand size={18} />
                        <span className="text-[10px] uppercase tracking-wider">Aide</span>
                    </button>
                </Tooltip>
            )}
        </div>
    );
};

export default FormWithHelp;

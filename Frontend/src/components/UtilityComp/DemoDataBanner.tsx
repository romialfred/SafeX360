import { IconAlertTriangle } from '@tabler/icons-react';
import { ReactNode } from 'react';

/**
 * Bandeau non contournable signalant un écran à données de DÉMONSTRATION.
 *
 * Audit pré-production : plusieurs écrans « Rapports » affichent des indicateurs
 * codés en dur / aléatoires, atteignables en production et pris pour des chiffres
 * réels — risque de décision managériale sur des données fictives. En attendant
 * leur branchement à un vrai service serveur, ce bandeau lève l'ambiguïté.
 */
export default function DemoDataBanner({ children }: { children: ReactNode }) {
    return (
        <div>
            <div role="alert"
                className="sticky top-0 z-40 flex items-center gap-2 px-4 py-2 bg-amber-100 border-b-2 border-amber-400 text-amber-900 text-[13px] font-semibold">
                <IconAlertTriangle size={18} className="shrink-0" aria-hidden="true" />
                Écran de DÉMONSTRATION — chiffres illustratifs, non représentatifs des données réelles
                de votre mine. Ne pas utiliser pour une décision.
            </div>
            {children}
        </div>
    );
}

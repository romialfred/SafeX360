import { IconFlask2 } from '@tabler/icons-react';
import PageHeader from '../../UtilityComp/PageHeader';
import RiskIdentification from './RiskIdentification';

/**
 * Page de création d'un risque chimique (LOT 50) :
 * en-tête standard + formulaire d'identification sectionné.
 */
const ChemicalRiskForms = () => {
    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des Risques' },
                    { label: 'Registre chimique', to: '/chemical-register' },
                    { label: 'Nouveau risque chimique' },
                ]}
                icon={<IconFlask2 size={22} stroke={2} />}
                iconColor="violet"
                title="Identifier un risque chimique"
                subtitle="Décrire le produit, sa classe de danger SGH et le scénario d'exposition"
            />
            <RiskIdentification />
        </div>
    );
};

export default ChemicalRiskForms;

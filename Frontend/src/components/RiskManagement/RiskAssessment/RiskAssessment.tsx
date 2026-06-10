import { IconClipboardCheck } from '@tabler/icons-react';
import RiskDataTable from './RiskTable';
import PageHeader from '../../UtilityComp/PageHeader';

/**
 * Évaluation des risques (LOT 50) : risques déjà cotés sur la matrice
 * probabilité × gravité, avec la date de leur dernière évaluation.
 */
const RiskAssessment = () => {
    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des Risques' },
                    { label: 'Évaluation des risques' },
                ]}
                icon={<IconClipboardCheck size={22} stroke={2} />}
                iconColor="red"
                title="Évaluation des risques"
                subtitle="Risques cotés sur la matrice probabilité × gravité et suivi des réévaluations"
            />

            <RiskDataTable />
        </div>
    );
};

export default RiskAssessment;

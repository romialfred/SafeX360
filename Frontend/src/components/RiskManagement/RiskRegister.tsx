import { Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconFileText, IconPlus } from '@tabler/icons-react';
import RiskTable from './RiskRegister/RiskTable';
import PageHeader from '../UtilityComp/PageHeader';

/**
 * Registre des risques (LOT 50) : catalogue des risques HSE identifiés,
 * avec filtres, export CSV et accès aux fiches détaillées.
 */
const RiskRegister = () => {
    const navigate = useNavigate();

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des Risques' },
                    { label: 'Registre des risques' },
                ]}
                icon={<IconFileText size={22} stroke={2} />}
                iconColor="red"
                title="Registre des risques"
                subtitle="Catalogue des risques HSE identifiés : contexte, responsables et suivi du traitement"
                actions={
                    <Button
                        size="sm"
                        color="teal"
                        leftSection={<IconPlus size={14} />}
                        onClick={() => navigate('register-form')}
                    >
                        Nouveau risque
                    </Button>
                }
            />

            <RiskTable />
        </div>
    );
};

export default RiskRegister;

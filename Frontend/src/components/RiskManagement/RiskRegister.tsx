import { Button } from '@mantine/core';
import RiskTable from './RiskRegister/RiskTable';
import { useNavigate } from 'react-router-dom';
import { IconPlus, IconFileText } from '@tabler/icons-react';
import PageHeader from '../UtilityComp/PageHeader';

const RiskRegister = () => {
    const navigate = useNavigate();
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'uncontrolled': return 'red';
            case 'partially controlled': return 'orange';
            case 'under control': return 'green';
            default: return 'gray';
        }
    };
    return (
        <div className="p-5 space-y-5 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des Risques' },
                    { label: 'Registre des risques' },
                ]}
                icon={<IconFileText size={22} stroke={2} />}
                iconColor="red"
                title="Registre des risques"
                subtitle="Catalogue complet et suivi des risques HSE — analyse, contrôles et plans d'action"
                actions={
                    <Button
                        size="sm"
                        color="red"
                        leftSection={<IconPlus size={14} />}
                        onClick={() => navigate('register-form')}
                    >
                        Nouveau risque
                    </Button>
                }
            />

            <RiskTable getStatusColor={getStatusColor} />
        </div>
    );
};

export default RiskRegister;

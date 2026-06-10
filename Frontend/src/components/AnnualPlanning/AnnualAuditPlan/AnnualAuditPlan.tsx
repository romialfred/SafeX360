import { Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import AnnualDataFile from './AnnualDataFile';
import { IconArrowRight, IconCalendarStats, IconPlus } from '@tabler/icons-react';
import PageHeader from '../../UtilityComp/PageHeader';

export default function AnnualAuditPlan() {
    const navigate = useNavigate();
    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Planification annuelle' },
                    { label: "Plan annuel d'audits" },
                ]}
                icon={<IconCalendarStats size={22} stroke={2} />}
                iconColor="amber"
                title="Plan annuel d'audits"
                subtitle="Programmation et approbation des audits internes et externes — ISO 19011"
                actions={
                    <>
                        <Button
                            size="sm"
                            variant="default"
                            rightSection={<IconArrowRight size={15} />}
                            onClick={() => navigate('/audit-management')}
                        >
                            Voir les audits
                        </Button>
                        <Button
                            size="sm"
                            color="amber"
                            leftSection={<IconPlus size={15} />}
                            onClick={() => navigate('/annual-audit-plan/new-auditplan')}
                        >
                            Nouveau plan
                        </Button>
                    </>
                }
            />
            <AnnualDataFile />
        </div>
    );
}

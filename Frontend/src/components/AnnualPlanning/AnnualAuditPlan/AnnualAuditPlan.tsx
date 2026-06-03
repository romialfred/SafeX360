import { Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import AnnualDataFile from './AnnualDataFile';
import { IconArrowRight, IconCalendarStats, IconPlus, IconFileExport } from '@tabler/icons-react';
import PageHeader from '../../UtilityComp/PageHeader';

export default function AnnualAuditPlan() {
    const navigate = useNavigate();
    return (
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Planification annuelle' },
                    { label: "Plan annuel d'audits" },
                ]}
                icon={<IconCalendarStats size={22} stroke={2} />}
                iconColor="amber"
                title="Plan annuel d'audits"
                subtitle="Calendrier annuel des audits internes pour garantir la conformité et l'amélioration continue ISO 19011"
                actions={
                    <>
                        <Button variant="default" size="sm" leftSection={<IconFileExport size={15} />}>
                            Exporter le plan
                        </Button>
                        <Button
                            size="sm"
                            variant="default"
                            rightSection={<IconArrowRight size={15} />}
                            onClick={() => navigate("/audit-management")}
                        >
                            Voir les audits
                        </Button>
                        <Button
                            size="sm"
                            color="amber"
                            leftSection={<IconPlus size={15} />}
                            onClick={() => navigate("/annual-audit-plan/new-auditplan")}
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

import { Button } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import PgiData from "./PgiData";
import { IconPlus, IconClipboardCheck, IconCalendar } from "@tabler/icons-react";
import PageHeader from "../../UtilityComp/PageHeader";

/**
 * Registre des inspections HSE planifiées (PGI) : planification, suivi
 * d'avancement et accès aux dossiers d'inspection.
 */
const Pgi = () => {
    const navigate = useNavigate();
    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Activités préventives' },
                    { label: 'Inspections HSE' },
                ]}
                icon={<IconClipboardCheck size={22} stroke={2} />}
                iconColor="green"
                title="Inspections HSE planifiées"
                subtitle="Planifier, suivre et clôturer les inspections de sécurité du site"
                actions={
                    <>
                        <Button variant="default" size="sm" leftSection={<IconCalendar size={14} />} onClick={() => navigate('calendar')}>
                            Calendrier
                        </Button>
                        <Button color="green" size="sm" leftSection={<IconPlus size={14} />} onClick={() => navigate('report')}>
                            Nouvelle inspection
                        </Button>
                    </>
                }
            />
            <PgiData />
        </div>
    )
}

export default Pgi

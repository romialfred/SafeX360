import { Button } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import HealthData from "./HealthData";
import { IconPlus, IconUsers, IconFileExport } from "@tabler/icons-react";
import PageHeader from "../../UtilityComp/PageHeader";

const HealthMeeting = () => {
    const navigate = useNavigate();
    return (
        <div className="p-5 space-y-5 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Activités préventives' },
                    { label: 'Réunions sécurité' },
                ]}
                icon={<IconUsers size={22} stroke={2} />}
                iconColor="green"
                title="Réunions sécurité"
                subtitle="ISO 45001 §5.4 — Consultation et participation des travailleurs : ordres du jour, comptes-rendus, points d'action"
                actions={
                    <>
                        <Button variant="default" size="sm" leftSection={<IconFileExport size={15} />}>
                            Exporter
                        </Button>
                        <Button color="green" size="sm" leftSection={<IconPlus size={15} />} onClick={() => navigate('/add-NewActivity')}>
                            Nouvelle réunion
                        </Button>
                    </>
                }
            />
            <HealthData />
        </div>
    )
}

export default HealthMeeting

import { Button } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import HealthData from "./HealthData";
import { IconPlus, IconUsers, IconFileExport } from "@tabler/icons-react";
import PageHeader from "../../UtilityComp/PageHeader";

const HealthMeeting = () => {
    const navigate = useNavigate();
    return (
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Activités préventives' },
                    { label: 'Réunions sécurité' },
                ]}
                icon={<IconUsers size={22} stroke={2} />}
                iconColor="green"
                title="Réunions sécurité"
                subtitle="Enregistrement, suivi et clôture des points d'action issus des réunions sécurité"
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

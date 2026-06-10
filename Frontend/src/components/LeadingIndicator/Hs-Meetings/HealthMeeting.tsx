import { Button } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import HealthData from "./HealthData";
import { IconPlus, IconUsers } from "@tabler/icons-react";
import PageHeader from "../../UtilityComp/PageHeader";

const HealthMeeting = () => {
    const navigate = useNavigate();
    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Activités préventives' },
                    { label: 'Réunions sécurité' },
                ]}
                icon={<IconUsers size={22} stroke={2} />}
                iconColor="green"
                title="Réunions sécurité"
                subtitle="Planification et suivi des réunions HSE : ordres du jour, comptes-rendus et points d'action — ISO 45001 §5.4"
                actions={
                    <Button color="teal" size="sm" leftSection={<IconPlus size={15} />} onClick={() => navigate('/add-NewActivity')}>
                        Nouvelle réunion
                    </Button>
                }
            />
            <HealthData />
        </div>
    );
};

export default HealthMeeting;

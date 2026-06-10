import { Button } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import TourData from "./TourData";
import { IconPlus, IconRoute } from "@tabler/icons-react";
import PageHeader from "../../UtilityComp/PageHeader";

const SteeringTour = () => {
    const navigate = useNavigate();
    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Activités préventives' },
                    { label: 'Tournées Leadership' },
                ]}
                icon={<IconRoute size={22} stroke={2} />}
                iconColor="green"
                title="Tournées Leadership"
                subtitle="Visites terrain de la direction : conformité, engagement et amélioration continue — ISO 45001 §5.1"
                actions={
                    <Button color="teal" size="sm" leftSection={<IconPlus size={15} />} onClick={() => navigate('/add-tour')}>
                        Nouvelle tournée
                    </Button>
                }
            />
            <TourData />
        </div>
    );
};

export default SteeringTour;

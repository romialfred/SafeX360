import { Button } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import TourData from "./TourData";
import { IconPlus, IconRoute, IconFileExport } from "@tabler/icons-react";
import PageHeader from "../../UtilityComp/PageHeader";

const SteeringTour = () => {
    const navigate = useNavigate();
    return (
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Activités préventives' },
                    { label: 'Tournées Leadership' },
                ]}
                icon={<IconRoute size={22} stroke={2} />}
                iconColor="green"
                title="Tournées Leadership"
                subtitle="Tournées terrain proactives pour vérifier la conformité, l'engagement et l'amélioration continue"
                actions={
                    <>
                        <Button variant="default" size="sm" leftSection={<IconFileExport size={15} />}>
                            Exporter
                        </Button>
                        <Button color="green" size="sm" leftSection={<IconPlus size={15} />} onClick={() => navigate('/add-tour')}>
                            Nouvelle tournée
                        </Button>
                    </>
                }
            />
            <TourData />
        </div>
    )
}

export default SteeringTour

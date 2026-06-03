import { Button } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import PgiData from "./PgiData";
import { IconPlus, IconSearch, IconFileExport, IconCalendar } from "@tabler/icons-react";
import PageHeader from "../../UtilityComp/PageHeader";

const Pgi = () => {
    const navigate = useNavigate();
    return (
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Activités préventives' },
                    { label: 'Inspections HSE' },
                ]}
                icon={<IconSearch size={22} stroke={2} />}
                iconColor="green"
                title="Inspections HSE planifiées"
                subtitle="Planification, suivi et contrôle des inspections de sécurité et des dangers en milieu de travail"
                actions={
                    <>
                        <Button variant="default" size="sm" leftSection={<IconCalendar size={15} />} onClick={() => navigate('calendar')}>
                            Calendrier
                        </Button>
                        <Button variant="default" size="sm" leftSection={<IconFileExport size={15} />}>
                            Exporter
                        </Button>
                        <Button color="green" size="sm" leftSection={<IconPlus size={15} />} onClick={() => navigate('report')}>
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

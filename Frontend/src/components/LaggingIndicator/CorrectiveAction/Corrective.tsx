import { Button } from "@mantine/core";
import { IconPlus, IconTarget } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../UtilityComp/PageHeader";
import CorrectiveData from "./CorrectiveData";

const Corrective = () => {
    const navigate = useNavigate();
    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Actions correctives' },
                    { label: "Plans d'actions" },
                ]}
                icon={<IconTarget size={22} stroke={2} />}
                iconColor="orange"
                title="Plans d'actions correctives et préventives"
                subtitle="Affectation, suivi et clôture des CAPA — conformité ISO 45001 §10.2.1.d"
                actions={
                    <Button color="teal" size="sm" leftSection={<IconPlus size={15} />} onClick={() => navigate('report')}>
                        Nouvelle action
                    </Button>
                }
            />
            <CorrectiveData />
        </div>
    );
};

export default Corrective;

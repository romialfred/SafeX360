import { IconTarget } from "@tabler/icons-react";
import PageHeader from "../../UtilityComp/PageHeader";
import CorrectiveData from "./CorrectiveData";

const Corrective = () => {
    return (
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Actions Correctives' },
                    { label: "Plans d'actions" },
                ]}
                icon={<IconTarget size={22} stroke={2} />}
                iconColor="orange"
                title="Plans d'actions correctives & préventives"
                subtitle="Affectation, suivi et clôture des CAPA — conformité ISO 45001 §10.2.1.d"
            />
            <CorrectiveData />
        </div>
    );
};

export default Corrective;

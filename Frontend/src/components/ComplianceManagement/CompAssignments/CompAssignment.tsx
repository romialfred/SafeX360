import { IconUserCheck } from "@tabler/icons-react";
import PageHeader from "../../UtilityComp/PageHeader";
import AssignData from "./AssignData";

/** Affectations d'exigences par poste de travail (LOT 49). */
const CompAssignment = () => {
    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Conformité Réglementaire' },
                    { label: 'Affectations par poste' },
                ]}
                icon={<IconUserCheck size={22} stroke={2} />}
                iconColor="teal"
                title="Affectations par poste"
                subtitle="Exigences réglementaires applicables à chaque poste de travail du site"
            />
            <AssignData />
        </div>
    );
};

export default CompAssignment;

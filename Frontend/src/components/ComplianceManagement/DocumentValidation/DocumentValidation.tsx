import { IconSquareCheck } from "@tabler/icons-react";
import PageHeader from "../../UtilityComp/PageHeader";
import ValidationData from "./ValidationData";

/** Validation des documents de conformité (LOT 49). */
const DocumentValidation = () => {
    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Conformité Réglementaire' },
                    { label: 'Validation des documents' },
                ]}
                icon={<IconSquareCheck size={22} stroke={2} />}
                iconColor="teal"
                title="Validation des documents"
                subtitle="Revue des justificatifs déposés : approbation ou rejet motivé par l'équipe HSE"
            />
            <ValidationData />
        </div>
    );
};

export default DocumentValidation;

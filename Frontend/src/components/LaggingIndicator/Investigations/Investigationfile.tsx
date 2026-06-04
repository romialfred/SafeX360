import { IconSearch } from "@tabler/icons-react";
import PageHeader from "../../UtilityComp/PageHeader";
import InvestigationFileData from "./InvestigationFileData";

const Investigationfile = () => {
    return (
        <div className="p-5 space-y-5 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Surveillance des Activités' },
                    { label: 'Investigations' },
                ]}
                icon={<IconSearch size={22} stroke={2} />}
                iconColor="blue"
                title="Investigations d'incidents"
                subtitle="Analyse des causes profondes des incidents et dangers pour mise en œuvre des actions correctives"
            />
            <InvestigationFileData />
        </div>
    );
};

export default Investigationfile;

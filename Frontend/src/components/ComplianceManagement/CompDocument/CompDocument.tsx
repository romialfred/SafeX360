import { Button } from "@mantine/core";
import { IconFolderOpen, IconUpload } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../UtilityComp/PageHeader";
import CompDocData from "./CompDocData";

/** Registre des documents de conformité (LOT 49). */
const CompDocument = () => {
    const navigate = useNavigate();
    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Conformité Réglementaire' },
                    { label: 'Documents' },
                ]}
                icon={<IconFolderOpen size={22} stroke={2} />}
                iconColor="teal"
                title="Documents de conformité"
                subtitle="Justificatifs déposés par les employés : certificats, habilitations et examens médicaux"
                actions={
                    <Button
                        size="xs"
                        color="teal"
                        leftSection={<IconUpload size={14} />}
                        onClick={() => navigate('upload-document')}
                    >
                        Déposer un document
                    </Button>
                }
            />
            <CompDocData />
        </div>
    );
};

export default CompDocument;

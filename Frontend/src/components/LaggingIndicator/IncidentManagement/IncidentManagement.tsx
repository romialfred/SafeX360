import { IconAlertTriangle, IconBrain, IconSparkles } from "@tabler/icons-react";
import { Button } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import IncidentManagementData from "./IncidentManagementData";
import PageHeader from "../../UtilityComp/PageHeader";

/**
 * IncidentManagement — Page d'entête + liste des incidents.
 *
 * 2026-06-09 : ajout du bouton "Déclarer par IA" qui ouvre le module
 * d'analyse par photo (Claude Vision). Le bouton utilise un gradient
 * indigo→violet et une icône cerveau pour signaler l'innovation IA.
 */

const IncidentManagement = () => {
    const navigate = useNavigate();
    return (
        <div className="safex-page w-full space-y-5">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des incidents' },
                ]}
                icon={<IconAlertTriangle size={22} />}
                iconColor="red"
                title="Gestion des incidents"
                subtitle="ISO 45001 §10.2 — Déclaration, analyse et clôture des incidents et quasi-accidents HSE"
                actions={
                    <Button
                        size="sm"
                        leftSection={<IconBrain size={15} />}
                        rightSection={<IconSparkles size={12} />}
                        onClick={() => navigate('/incidents/ai-declare')}
                        styles={{
                            root: {
                                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                                color: 'white',
                                fontWeight: 600,
                                boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                            },
                        }}
                    >
                        Déclarer par IA
                    </Button>
                }
            />

            <IncidentManagementData />
        </div>
    );
};

export default IncidentManagement;
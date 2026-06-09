import { IconAlertTriangle } from "@tabler/icons-react";
import IncidentManagementData from "./IncidentManagementData";
import PageHeader from "../../UtilityComp/PageHeader";

/**
 * IncidentManagement — Page d'entête + liste des incidents.
 *
 * LOT 40 P0 fix : refonte cohérente avec PageHeader unifié, suppression
 * du mélange "text-blue-500 + gradient" illisible, traduction FR conforme
 * au reste de la plateforme, pas de gradient sur breadcrumbs.
 */

const IncidentManagement = () => {
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
            />

            <IncidentManagementData />
        </div>
    );
};

export default IncidentManagement;
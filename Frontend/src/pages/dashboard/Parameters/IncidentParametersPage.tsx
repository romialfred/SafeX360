import { IconAlertTriangle } from '@tabler/icons-react';
import ParameterSectionPage, { ParameterTab } from '../../../components/NewComponents/Parameters/ParameterSectionPage';
import IncidentCategoryData from '../../../components/SettingFolder/IncidentCategory/IncidentCategoryData';
import IncidentTypeData from '../../../components/SettingFolder/IncidentType/IncidentTypeData';
import SeverityLevelData from '../../../components/SettingFolder/SeverityLevel/SeverityLevelData';
import BodyPartsData from '../../../components/SettingFolder/BodyParts/BodyPartsData';
import TeamSetupData from '../../../components/SettingFolder/TeamSetup/TeamSetupData';

const TABS: ParameterTab[] = [
    {
        id: 'categories',
        label: "Catégories d'incident",
        description:
            "Classification de premier niveau des événements HSE (Santé & Sécurité, Environnement, Sûreté…). Chaque catégorie porte sa propre échelle de gravité. Seules les catégories officielles ISO 45001 sont conservées.",
        content: <IncidentCategoryData />,
    },
    {
        id: 'types',
        label: "Types d'incident",
        description:
            "Typologie fine rattachée à une catégorie (LTI, MTI, presqu'accident, situation dangereuse…). C'est la liste proposée au déclarant.",
        content: <IncidentTypeData />,
    },
    {
        id: 'severity',
        label: 'Niveaux de gravité',
        description:
            'Matrice de criticité (gravité × probabilité) par catégorie. Détermine le niveau de risque calculé et les seuils de notification.',
        content: <SeverityLevelData />,
    },
    {
        id: 'body-parts',
        label: 'Parties du corps',
        description:
            "Zones anatomiques sélectionnables lors de la déclaration d'un événement avec blessure, pour l'analyse des lésions.",
        content: <BodyPartsData />,
    },
    {
        id: 'teams',
        label: "Équipes d'intervention",
        description:
            "Constitution des équipes d'investigation et de secours, avec leurs membres et niveaux de notification.",
        content: <TeamSetupData />,
    },
];

export default function IncidentParametersPage() {
    return (
        <ParameterSectionPage
            breadcrumb="Paramètres Incidents"
            title="Paramètres Incidents"
            intro="Classification, typologie, gravité et équipes mobilisées sur les événements HSE."
            icon={IconAlertTriangle}
            tone="red"
            helpText="Ces référentiels structurent la déclaration d'événement. Toute modification impacte directement les listes proposées au déclarant et le calcul de criticité."
            tabs={TABS}
        />
    );
}

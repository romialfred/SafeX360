import { IconMapPin } from '@tabler/icons-react';
import ParameterSectionPage, { ParameterTab } from '../../../components/NewComponents/Parameters/ParameterSectionPage';
import LocationData from '../../../components/SettingFolder/Location/LocationData';
import WeatherConditionData from '../../../components/SettingFolder/WeatherConditions/WeatherConditionData';
import AuditAreaData from '../../../components/SettingFolder/AuditArea/AuditAreaData';
import WorkAreaData from '../../../components/SettingFolder/WorkArea/WorkAreaData';
import WorkProcessData from '../../../components/SettingFolder/WorkProcess/WorkProcessData';

const TABS: ParameterTab[] = [
    {
        id: 'sites',
        label: 'Sites & emplacements',
        description:
            "Géolocalisation des sites miniers, sites secondaires et bureaux. Ces emplacements alimentent la déclaration d'incident, la planification d'inspection et le périmètre des alertes d'évacuation.",
        content: <LocationData />,
    },
    {
        id: 'conditions',
        label: 'Conditions environnementales',
        description:
            "Conditions ambiantes (pluie, poussière, éclairage, bruit…) proposées lors de la déclaration d'un événement pour caractériser le contexte de survenue.",
        content: <WeatherConditionData />,
    },
    {
        id: 'audit-areas',
        label: "Zones d'audit",
        description:
            "Périmètres auditables au sens ISO 19011. Servent à cadrer le champ d'un audit lors de sa planification.",
        content: <AuditAreaData />,
    },
    {
        id: 'work-areas',
        label: 'Zones de travail',
        description:
            'Découpage opérationnel de la mine. Utilisé pour localiser un risque, une inspection ou une observation terrain.',
        content: <WorkAreaData />,
    },
    {
        id: 'work-processes',
        label: 'Processus de travail',
        description:
            'Cartographie des processus opérationnels (forage, transport, maintenance…) rattachés aux départements et aux analyses de risque.',
        content: <WorkProcessData />,
    },
];

export default function SitesEnvironmentPage() {
    return (
        <ParameterSectionPage
            breadcrumb="Sites & Environnement"
            title="Sites & Environnement"
            intro="Cartographie des sites miniers, zones, processus et conditions de surveillance."
            icon={IconMapPin}
            tone="teal"
            helpText="Ces référentiels décrivent OÙ se déroulent les opérations. Ils sont rattachés à la mine active et alimentent les formulaires de déclaration, d'inspection et d'audit."
            tabs={TABS}
        />
    );
}

import { IconTools } from '@tabler/icons-react';
import ParameterSectionPage, { ParameterTab } from '../../../components/NewComponents/Parameters/ParameterSectionPage';
import InspectionTemplates from '../../../components/SettingFolder/InspectionTemplates/InspectionTemplates';
import CheckListData from '../../../components/SettingFolder/CheckList/CheckListData';
import AuiditorData from '../../../components/SettingFolder/Auditors/AuiditorData';
import TechMeasurementData from '../../../components/SettingFolder/TechMeasurements/TechMeasurementData';

const TABS: ParameterTab[] = [
    {
        id: 'inspection-templates',
        label: "Modèles d'inspection",
        description:
            "Modèles réutilisables de grilles d'inspection et leurs points de contrôle. Ce sont ces modèles qui sont proposés — et personnalisables point par point — lors de la planification d'une inspection.",
        content: <InspectionTemplates />,
    },
    {
        id: 'checklists',
        label: 'Check-lists',
        description:
            'Listes de vérification rattachées aux catégories d\'événement, utilisées lors des contrôles terrain.',
        content: <CheckListData />,
    },
    {
        id: 'auditors',
        label: 'Auditeurs internes',
        description:
            "Vivier d'auditeurs internes avec leurs qualifications, domaines de compétence et langues (ISO 19011 §7). Alimente la constitution des équipes d'audit.",
        content: <AuiditorData />,
    },
    {
        id: 'measurements',
        label: 'Mesures techniques',
        description:
            'Grandeurs et unités de mesure techniques utilisées dans les relevés et les indicateurs de surveillance.',
        content: <TechMeasurementData />,
    },
];

export default function ToolsTemplatesPage() {
    return (
        <ParameterSectionPage
            breadcrumb="Outils & Templates"
            title="Outils & Templates"
            intro="Modèles d'inspection, check-lists, vivier d'auditeurs et mesures techniques."
            icon={IconTools}
            tone="violet"
            helpText="Ces référentiels sont les outils réutilisables de la plateforme : ils évitent de resaisir une grille ou une liste de contrôle à chaque intervention."
            tabs={TABS}
        />
    );
}

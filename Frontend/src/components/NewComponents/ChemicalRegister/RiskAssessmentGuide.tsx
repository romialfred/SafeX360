import React from 'react';
import {
    IconCalculator,
    IconCircleCheck,
    IconFileText,
    IconShield,
} from '@tabler/icons-react';
import GuideSidebar, { GuideSection } from './GuideSidebar';

/**
 * Aide-mémoire affiché à côté du formulaire d'évaluation d'un risque
 * chimique (LOT 50) — repères de cotation et de documentation des mesures.
 */
const guideSections: GuideSection[] = [
    {
        title: 'Renseigner la cotation',
        icon: IconFileText,
        color: 'text-sky-700',
        accentClasses: 'bg-sky-50 border-sky-200',
        tips: [
            "En réévaluation, précisez le déclencheur : incident, constat d'audit, changement de procédé.",
            'La gravité reflète la sévérité des conséquences possibles. Appuyez-vous sur la fiche de données de sécurité.',
            "La probabilité traduit la vraisemblance d'une exposition, selon la fréquence des tâches et les mesures en place.",
            'Le niveau de risque est calculé automatiquement à partir de la combinaison probabilité × gravité.',
        ],
    },
    {
        title: 'Lire le niveau calculé',
        icon: IconCalculator,
        color: 'text-amber-700',
        accentClasses: 'bg-amber-50 border-amber-200',
        tips: [
            'Faible et faible à modéré : risque acceptable, à surveiller dans le cycle normal.',
            "Modéré : risque tolérable sous réserve d'un plan d'action suivi.",
            'Élevé et critique : traitement prioritaire, mesures complémentaires obligatoires.',
        ],
    },
    {
        title: 'Documenter la maîtrise',
        icon: IconShield,
        color: 'text-emerald-700',
        accentClasses: 'bg-emerald-50 border-emerald-200',
        tips: [
            'Listez les mesures existantes : protections collectives, EPI, surveillance des expositions.',
            'Les mesures proposées doivent être concrètes, avec un responsable et une échéance.',
            "Pensez à la substitution du produit avant les mesures de protection individuelles.",
        ],
    },
    {
        title: 'Avant de valider',
        icon: IconCircleCheck,
        color: 'text-violet-700',
        accentClasses: 'bg-violet-50 border-violet-200',
        tips: [
            'Notez en commentaire les validations obtenues et les actions restant à suivre.',
            'Réévaluez le risque dès que le produit, le procédé ou la fréquence d\'exposition change.',
        ],
    },
];

interface RiskAssessmentGuideProps {
    className?: string;
}

const RiskAssessmentGuide: React.FC<RiskAssessmentGuideProps> = ({ className }) => {
    return <GuideSidebar sections={guideSections} className={className} />;
};

export default RiskAssessmentGuide;

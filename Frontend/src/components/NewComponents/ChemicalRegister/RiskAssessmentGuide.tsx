import React from 'react';
import { useTranslation } from 'react-i18next';
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

interface RiskAssessmentGuideProps {
    className?: string;
}

const RiskAssessmentGuide: React.FC<RiskAssessmentGuideProps> = ({ className }) => {
    const { t } = useTranslation('risk');
    const guideSections: GuideSection[] = [
        {
            title: t('chemicalGuide.fillRating.title'),
            icon: IconFileText,
            color: 'text-sky-700',
            accentClasses: 'bg-sky-50 border-sky-200',
            tips: [
                t('chemicalGuide.fillRating.tip1'),
                t('chemicalGuide.fillRating.tip2'),
                t('chemicalGuide.fillRating.tip3'),
                t('chemicalGuide.fillRating.tip4'),
            ],
        },
        {
            title: t('chemicalGuide.readLevel.title'),
            icon: IconCalculator,
            color: 'text-amber-700',
            accentClasses: 'bg-amber-50 border-amber-200',
            tips: [
                t('chemicalGuide.readLevel.tip1'),
                t('chemicalGuide.readLevel.tip2'),
                t('chemicalGuide.readLevel.tip3'),
            ],
        },
        {
            title: t('chemicalGuide.documentControl.title'),
            icon: IconShield,
            color: 'text-emerald-700',
            accentClasses: 'bg-emerald-50 border-emerald-200',
            tips: [
                t('chemicalGuide.documentControl.tip1'),
                t('chemicalGuide.documentControl.tip2'),
                t('chemicalGuide.documentControl.tip3'),
            ],
        },
        {
            title: t('chemicalGuide.beforeValidate.title'),
            icon: IconCircleCheck,
            color: 'text-violet-700',
            accentClasses: 'bg-violet-50 border-violet-200',
            tips: [
                t('chemicalGuide.beforeValidate.tip1'),
                t('chemicalGuide.beforeValidate.tip2'),
            ],
        },
    ];
    return <GuideSidebar sections={guideSections} className={className} />;
};

export default RiskAssessmentGuide;

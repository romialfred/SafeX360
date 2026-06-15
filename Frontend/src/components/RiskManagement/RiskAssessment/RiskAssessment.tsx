import { IconClipboardCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import RiskDataTable from './RiskTable';
import PageHeader from '../../UtilityComp/PageHeader';

/**
 * Évaluation des risques (LOT 50) : risques déjà cotés sur la matrice
 * probabilité × gravité, avec la date de leur dernière évaluation.
 */
const RiskAssessment = () => {
    const { t } = useTranslation('risk');
    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: t('common.home'), to: '/' },
                    { label: t('common.riskManagement') },
                    { label: t('assessment.breadcrumb') },
                ]}
                icon={<IconClipboardCheck size={22} stroke={2} />}
                iconColor="red"
                title={t('assessment.title')}
                subtitle={t('assessment.subtitle')}
            />

            <RiskDataTable />
        </div>
    );
};

export default RiskAssessment;

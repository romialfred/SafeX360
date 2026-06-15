import { IconFlask2 } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../UtilityComp/PageHeader';
import RiskIdentification from './RiskIdentification';

/**
 * Page de création d'un risque chimique (LOT 50) :
 * en-tête standard + formulaire d'identification sectionné.
 */
const ChemicalRiskForms = () => {
    const { t } = useTranslation('risk');
    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: t('common.home'), to: '/' },
                    { label: t('common.riskManagement') },
                    { label: t('chemicalRegister.breadcrumb'), to: '/chemical-register' },
                    { label: t('chemicalForm.breadcrumbNew') },
                ]}
                icon={<IconFlask2 size={22} stroke={2} />}
                iconColor="violet"
                title={t('chemicalForm.title')}
                subtitle={t('chemicalForm.subtitle')}
            />
            <RiskIdentification />
        </div>
    );
};

export default ChemicalRiskForms;

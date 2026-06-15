import { Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconFileText, IconPlus } from '@tabler/icons-react';
import RiskTable from './RiskRegister/RiskTable';
import PageHeader from '../UtilityComp/PageHeader';

/**
 * Registre des risques (LOT 50) : catalogue des risques HSE identifiés,
 * avec filtres, export CSV et accès aux fiches détaillées.
 */
const RiskRegister = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('risk');

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: t('common.home'), to: '/' },
                    { label: t('common.riskManagement') },
                    { label: t('register.breadcrumb') },
                ]}
                icon={<IconFileText size={22} stroke={2} />}
                iconColor="red"
                title={t('register.title')}
                subtitle={t('register.subtitle')}
                actions={
                    <Button
                        size="sm"
                        color="teal"
                        leftSection={<IconPlus size={14} />}
                        onClick={() => navigate('register-form')}
                    >
                        {t('register.newRisk')}
                    </Button>
                }
            />

            <RiskTable />
        </div>
    );
};

export default RiskRegister;

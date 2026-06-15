import React from 'react';
import { IconAlertOctagon, IconCircleCheck, IconClock, IconShield } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import KpiTile from '../../UtilityComp/KpiTile';

/**
 * Indicateurs de la vue d'ensemble des risques (LOT 50) — tuiles KPI
 * standardisées : total, ouverts, en traitement, clôturés / en retard.
 */

type OverviewMetrics = {
    total: number;
    open: number;
    inProgress: number;
    closed: number;
    overdue: number;
};

interface SummaryCardsProps {
    metrics: OverviewMetrics;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ metrics }) => {
    const { t } = useTranslation('risk');
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiTile
                label={t('dashboard.kpi.total')}
                value={metrics.total}
                tone="slate"
                icon={<IconShield size={14} stroke={1.8} />}
            />
            <KpiTile
                label={t('dashboard.kpi.open')}
                value={metrics.open}
                tone="blue"
                icon={<IconAlertOctagon size={14} stroke={1.8} />}
                referenceValue={t('dashboard.kpi.openReference')}
            />
            <KpiTile
                label={t('dashboard.kpi.inProgress')}
                value={metrics.inProgress}
                tone="amber"
                icon={<IconClock size={14} stroke={1.8} />}
            />
            <KpiTile
                label={t('dashboard.kpi.closed')}
                value={metrics.closed}
                tone="green"
                icon={<IconCircleCheck size={14} stroke={1.8} />}
                referenceValue={t('dashboard.kpi.overdueReference', { count: metrics.overdue })}
            />
        </div>
    );
};

export default SummaryCards;

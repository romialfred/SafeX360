import React from 'react';
import { IconAlertOctagon, IconCircleCheck, IconClock, IconShield } from '@tabler/icons-react';
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

const SummaryCards: React.FC<SummaryCardsProps> = ({ metrics }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile
            label="Risques au registre"
            value={metrics.total}
            tone="slate"
            icon={<IconShield size={14} stroke={1.8} />}
        />
        <KpiTile
            label="Ouverts"
            value={metrics.open}
            tone="blue"
            icon={<IconAlertOctagon size={14} stroke={1.8} />}
            referenceValue="En attente de traitement"
        />
        <KpiTile
            label="En traitement"
            value={metrics.inProgress}
            tone="amber"
            icon={<IconClock size={14} stroke={1.8} />}
        />
        <KpiTile
            label="Clôturés"
            value={metrics.closed}
            tone="green"
            icon={<IconCircleCheck size={14} stroke={1.8} />}
            referenceValue={`${metrics.overdue} revue${metrics.overdue > 1 ? 's' : ''} en retard`}
        />
    </div>
);

export default SummaryCards;

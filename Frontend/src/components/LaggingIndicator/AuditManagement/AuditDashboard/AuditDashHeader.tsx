import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { IconCalendar, IconCircleCheck, IconClock, IconTarget, IconTrendingUp } from "@tabler/icons-react";
import type { Icon as TablerIcon } from '@tabler/icons-react';
import { PremiumKpiTile } from "../../../../design-system/premium";
import { computeAuditMetrics, type AuditMetricSource } from './auditDashboardMetrics';

/**
 * Statuts d'audit (backend AuditStatus enum, ORDINAL ou STRING) :
 *   0/PLANNING     → planifié (non démarré)
 *   1/PREPARATION  → en préparation
 *   2/EXECUTION    → en exécution
 *   3/CLOSED       → clôturé
 * Le backend Spring serialise par défaut en NOM (PLANNING/PREPARATION/...) mais
 * peut aussi renvoyer l'ordinal numérique selon la config Jackson.
 */
const AuditDashHeader = ({ audits = [] }: { audits?: AuditMetricSource[] }) => {
    const navigate = useNavigate();
    const stats = useMemo(() => computeAuditMetrics(audits), [audits]);

    /**
     * Refonte ISO Phase 2 (2026-06-09) : utilisation de PremiumKpiTile pour
     * alignement avec le DS Premium (extrait de Non-conformité). Aucune
     * régression : mêmes endpoints, mêmes calculs, mêmes valeurs affichées.
     * Seul le rendu visuel est unifié sur le DS plateforme.
     */
    const cards: { value: string | number; label: string; trend: string; icon: TablerIcon; onClick?: () => void }[] = [
        {
            value: stats.total,
            label: 'Audits planifiés',
            trend: 'Total programme',
            icon: IconCalendar,
            onClick: () => navigate('/audit-management'),
        },
        {
            value: stats.inProgress,
            label: 'En exécution',
            trend: 'Audits en cours',
            icon: IconTarget,
        },
        {
            value: stats.completed,
            label: 'Clôturés',
            trend: 'Rapports finalisés',
            icon: IconCircleCheck,
        },
        {
            value: stats.upcoming,
            label: 'À venir',
            trend: 'Démarrage planifié',
            icon: IconClock,
        },
        {
            value: stats.executionRate,
            label: "Taux d'exécution",
            trend: 'Clôturés / Total — ISO 19011',
            icon: IconTrendingUp,
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {cards.map((card, idx) => (
                <PremiumKpiTile
                    key={idx}
                    index={idx}
                    value={card.value}
                    label={card.label}
                    trend={card.trend}
                    icon={card.icon}
                    onClick={card.onClick}
                />
            ))}
        </div>
    );
};

export default AuditDashHeader;

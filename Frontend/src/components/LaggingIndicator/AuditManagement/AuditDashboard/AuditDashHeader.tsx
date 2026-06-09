import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconCalendar, IconCircleCheck, IconClock, IconTarget, IconTrendingUp } from "@tabler/icons-react";
import { getAllAudit } from "../../../../services/AuditService";
import { PremiumKpiTile } from "../../../../design-system/premium";

/**
 * Statuts d'audit (backend AuditStatus enum, ORDINAL ou STRING) :
 *   0/PLANNING     → planifié (non démarré)
 *   1/PREPARATION  → en préparation
 *   2/EXECUTION    → en exécution
 *   3/CLOSED       → clôturé
 * Le backend Spring serialise par défaut en NOM (PLANNING/PREPARATION/...) mais
 * peut aussi renvoyer l'ordinal numérique selon la config Jackson.
 */
const normalizeStatus = (raw: any): string => {
    if (raw === null || raw === undefined) return '';
    if (typeof raw === 'number') {
        const map = ['PLANNING', 'PREPARATION', 'EXECUTION', 'CLOSED', 'CANCELLED'];
        return map[raw] || '';
    }
    return String(raw).toUpperCase();
};

const AuditDashHeader = () => {
    const [audits, setAudits] = useState<any[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        getAllAudit()
            .then((data: any[]) => setAudits(Array.isArray(data) ? data : []))
            .catch(() => setAudits([]));
    }, []);

    const stats = useMemo(() => {
        const now = new Date();
        let inProgress = 0;
        let completed = 0;
        let upcoming = 0;

        audits.forEach((audit: any) => {
            const status = normalizeStatus(audit?.status);
            const startDate = audit?.startDate ? new Date(audit.startDate) : null;

            if (status === 'EXECUTION' || status === 'IN_PROGRESS') {
                inProgress += 1;
            } else if (status === 'CLOSED' || status === 'COMPLETED' || status === 'FINISHED') {
                completed += 1;
            } else if (status === 'PLANNING' || status === 'PREPARATION') {
                if (startDate && startDate > now) upcoming += 1;
            }
        });

        const planned = audits.length;
        const executionRate = planned > 0
            ? `${Math.round((completed / planned) * 100)}%`
            : '0%';

        return { planned, inProgress, completed, upcoming, executionRate };
    }, [audits]);

    /**
     * Refonte ISO Phase 2 (2026-06-09) : utilisation de PremiumKpiTile pour
     * alignement avec le DS Premium (extrait de Non-conformité). Aucune
     * régression : mêmes endpoints, mêmes calculs, mêmes valeurs affichées.
     * Seul le rendu visuel est unifié sur le DS plateforme.
     */
    const cards: { value: string | number; label: string; trend: string; icon: any; onClick?: () => void }[] = [
        {
            value: stats.planned,
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

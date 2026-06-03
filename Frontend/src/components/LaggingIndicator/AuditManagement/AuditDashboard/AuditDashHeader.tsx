import { useEffect, useMemo, useState } from "react";
import { IconCalendar, IconCircleCheck, IconClock, IconTarget, IconTrendingUp } from "@tabler/icons-react";
import { getAllAudit } from "../../../../services/AuditService";

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

    const cards = [
        {
            value: stats.planned,
            label: 'Audits planifiés',
            sublabel: 'Total programme',
            icon: IconCalendar,
            iconColor: 'text-blue-700',
            bg: 'bg-blue-50/70',
            border: 'border-blue-200',
            accent: 'bg-blue-500',
        },
        {
            value: stats.inProgress,
            label: 'En exécution',
            sublabel: 'Audits en cours',
            icon: IconTarget,
            iconColor: 'text-amber-700',
            bg: 'bg-amber-50/70',
            border: 'border-amber-200',
            accent: 'bg-amber-500',
        },
        {
            value: stats.completed,
            label: 'Clôturés',
            sublabel: 'Rapports finalisés',
            icon: IconCircleCheck,
            iconColor: 'text-green-700',
            bg: 'bg-green-50/70',
            border: 'border-green-200',
            accent: 'bg-green-500',
        },
        {
            value: stats.upcoming,
            label: 'À venir',
            sublabel: 'Démarrage planifié',
            icon: IconClock,
            iconColor: 'text-pink-700',
            bg: 'bg-pink-50/70',
            border: 'border-pink-200',
            accent: 'bg-pink-500',
        },
        {
            value: stats.executionRate,
            label: "Taux d'exécution",
            sublabel: 'Clôturés / Total',
            icon: IconTrendingUp,
            iconColor: 'text-violet-700',
            bg: 'bg-violet-50/70',
            border: 'border-violet-200',
            accent: 'bg-violet-500',
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {cards.map((card, idx) => {
                const Icon = card.icon;
                return (
                    <div
                        key={idx}
                        className={`relative bg-white rounded-lg border ${card.border} hover:shadow-md transition-all overflow-hidden`}
                    >
                        <div className={`h-1 ${card.accent}`}></div>
                        <div className="p-3">
                            <div className="flex items-start justify-between mb-2">
                                <div className={`p-1.5 rounded-md ${card.bg} ${card.border} border`}>
                                    <Icon size={15} className={card.iconColor} stroke={2} />
                                </div>
                            </div>
                            <p className={`text-2xl ${card.iconColor} tabular-nums leading-none`}>
                                {String(card.value)}
                            </p>
                            <p className="text-[11px] text-slate-800 mt-1.5 leading-tight">{card.label}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{card.sublabel}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AuditDashHeader;

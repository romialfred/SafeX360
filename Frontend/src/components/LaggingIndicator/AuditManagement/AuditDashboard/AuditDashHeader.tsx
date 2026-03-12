import { useEffect, useMemo, useState } from "react";
import { IconCalendar, IconCircleCheck, IconClock, IconTarget, IconTrendingUp } from "@tabler/icons-react";
import { getAllAudit } from "../../../../services/AuditService";

const AuditDashHeader = () => {
  const [audits, setAudits] = useState<any[]>([]);

  useEffect(() => {
    getAllAudit()
      .then((audits: any[]) => {
        setAudits(Array.isArray(audits) ? audits : []);
      })
      .catch(() => { /* noop */ });
  }, []);

  const statistics = useMemo(() => {
    const counts = {
      planned: 0,
      inProgress: 0,
      completed: 0,
      upcoming: 0,
    };

    const now = new Date();

    audits.forEach((audit: any) => {
      const normalized = String(audit?.status || '').toUpperCase();
      const plannedStart = audit?.plannedStartDate ? new Date(audit.plannedStartDate) : null;

      if (normalized === 'PLANNED') {
        counts.planned += 1;
        if (plannedStart && plannedStart > now) {
          counts.upcoming += 1;
        }
        return;
      }

      if (['IN_PROGRESS', 'EXECUTION', 'ONGOING'].includes(normalized)) {
        counts.inProgress += 1;
        return;
      }

      if (['COMPLETED', 'CLOSED', 'FINISHED'].includes(normalized)) {
        counts.completed += 1;
        return;
      }

      if (['UPCOMING', 'SCHEDULED', 'NOT_STARTED'].includes(normalized)) {
        counts.upcoming += 1;
        return;
      }

      if (plannedStart && plannedStart > now) {
        counts.upcoming += 1;
      }
    });

    counts.planned = audits.length;

    const executionRate = counts.planned > 0
      ? `${((counts.completed / counts.planned) * 100).toFixed(1)}%`
      : '0%';

    return {
      counts,
      executionRate,
    };
  }, [audits]);

  const { counts, executionRate } = statistics;

  const cards = [
    {
      id: counts.planned,
      label: 'Planned Audits',
      icon: IconCalendar,
      color: '#2563eb',
      textColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      cardBg: 'bg-blue-50',
    },
    {
      id: counts.inProgress,
      label: 'In Progress Audits',
      icon: IconTarget,
      color: '#f59e0b',
      textColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      cardBg: 'bg-amber-50',
    },
    {
      id: counts.completed,
      label: 'Completed Audits',
      icon: IconCircleCheck,
      color: '#22c55e',
      textColor: 'text-green-600',
      iconBg: 'bg-green-100',
      cardBg: 'bg-green-50',
    },
    {
      id: counts.upcoming,
      label: 'Upcoming Audits',
      icon: IconClock,
      color: '#ec4899',
      textColor: 'text-pink-600',
      iconBg: 'bg-pink-100',
      cardBg: 'bg-pink-50',
    },
    {
      id: executionRate,
      label: 'Execution Rate',
      icon: IconTrendingUp,
      color: '#8b5cf6',
      textColor: 'text-purple-500',
      iconBg: 'bg-purple-100',
      cardBg: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {cards.map((item, index) => {
        const Icon = item.icon as any;
        return (
          <div key={index} className={`flex justify-between items-center p-4 shadow-sm rounded-xl ${item.cardBg}`}>
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">{item.label}</p>
              <h2 className={`text-xl font-bold ${item.textColor}`}>{String(item.id)}</h2>
            </div>
            <div className={`w-10 h-10 flex items-center justify-center rounded-full ${item.iconBg}`}>
              <Icon size={24} stroke={2} color={item.color} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AuditDashHeader;

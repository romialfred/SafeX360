export const normalizeAuditStatus = (raw: unknown): string => {
    if (raw === null || raw === undefined) return '';
    if (typeof raw === 'number') {
        const map = ['PLANNING', 'PREPARATION', 'EXECUTION', 'CLOSED', 'CANCELLED'];
        return map[raw] || '';
    }
    return String(raw).toUpperCase();
};

export interface AuditMetricSource {
    status?: unknown;
    startDate?: string | number | Date | null;
}

export const computeAuditMetrics = (audits: AuditMetricSource[], now = new Date()) => {
    let inProgress = 0;
    let completed = 0;
    let upcoming = 0;

    audits.forEach((audit) => {
        const status = normalizeAuditStatus(audit?.status);
        const startDate = audit?.startDate
            ? audit.startDate instanceof Date
                ? audit.startDate
                : new Date(audit.startDate)
            : null;
        if (status === 'EXECUTION' || status === 'IN_PROGRESS') inProgress += 1;
        else if (['CLOSED', 'COMPLETED', 'FINISHED'].includes(status)) completed += 1;
        else if (['PLANNING', 'PREPARATION'].includes(status)
                && startDate && !Number.isNaN(startDate.getTime()) && startDate > now) {
            upcoming += 1;
        }
    });

    const total = audits.length;
    return {
        total,
        inProgress,
        completed,
        upcoming,
        executionRate: total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%',
    };
};

export const computeAuditDistribution = (audits: AuditMetricSource[]) => {
    const counts = { PLANNING: 0, PREPARATION: 0, EXECUTION: 0, CLOSED: 0, CANCELLED: 0 };
    audits.forEach((audit) => {
        const key = normalizeAuditStatus(audit?.status) as keyof typeof counts;
        if (key in counts) counts[key] += 1;
    });
    return counts;
};

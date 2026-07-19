import { describe, expect, it } from 'vitest';
import { computeAuditDistribution, computeAuditMetrics } from './auditDashboardMetrics';

describe('métriques du tableau de bord audit', () => {
    it('calcule KPI et répartition depuis la même liste', () => {
        const audits = [
            { status: 'PLANNING', startDate: '2026-08-01' },
            { status: 'EXECUTION' },
            { status: 'CLOSED' },
            { status: 3 },
        ];
        const metrics = computeAuditMetrics(audits, new Date('2026-07-19'));
        const distribution = computeAuditDistribution(audits);

        expect(metrics).toMatchObject({ total: 4, inProgress: 1, completed: 2, upcoming: 1 });
        expect(metrics.executionRate).toBe('50%');
        expect(Object.values(distribution).reduce((sum, value) => sum + value, 0)).toBe(metrics.total);
    });

    it('affiche des KPI nuls lorsque la liste est vide', () => {
        expect(computeAuditMetrics([])).toMatchObject({ total: 0, executionRate: '0%' });
        expect(Object.values(computeAuditDistribution([])).every((value) => value === 0)).toBe(true);
    });
});


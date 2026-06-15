import React, { useEffect, useMemo, useState } from 'react';
import { IconChartBar } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import SummaryCards from './RiskOverview/SummaryCards';
import Charts from './RiskOverview/Charts';
import PageHeader from '../UtilityComp/PageHeader';
import EmptyState from '../UtilityComp/EmptyState';
import { SkeletonDashboard } from '../UtilityComp/LoadingSkeleton';
import { getAllDepartments } from '../../services/HrmsService';
import { getRiskOverview, RiskOverviewResponse } from '../../services/RiskRegisterService';
import { errorNotification } from '../../utility/NotificationUtility';
import { PROBABILITY_LABELS_FR, SEVERITY_LABELS_FR } from './riskLabels';

/**
 * Vue d'ensemble des risques (LOT 50) : indicateurs, répartitions par source
 * de danger et par département, matrice probabilité × gravité.
 */
const RiskOverview: React.FC = () => {
    const { t } = useTranslation('risk');
    // Axes de la matrice : libellés API d'abord, repli sur les clés i18n indexées
    // (qui retombent elles-mêmes sur le libellé FR centralisé de riskLabels.ts).
    const tProbability = (idx: number): string =>
        t(`probability.${idx + 1}`, { defaultValue: PROBABILITY_LABELS_FR[idx] });
    const tSeverity = (idx: number): string =>
        t(`severity.${idx + 1}`, { defaultValue: SEVERITY_LABELS_FR[idx] });
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<RiskOverviewResponse | null>(null);
    const [departmentMap, setDepartmentMap] = useState<Record<string | number, any>>({});

    useEffect(() => {
        getRiskOverview()
            .then(setOverview)
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || t('dashboard.loadFailed'));
            })
            .finally(() => setLoading(false));

        getAllDepartments()
            .then((list) => {
                const map: Record<string | number, any> = {};
                (list || []).forEach((d: any) => {
                    map[d.id] = d;
                });
                setDepartmentMap(map);
            })
            .catch(() => {
                /* les libellés de département retombent sur la clé brute */
            });
    }, []);

    // Repli traduit (FR/EN) quand l'API ne fournit pas les axes ; sinon, libellés API conservés.
    const fallbackProbabilityLabels = PROBABILITY_LABELS_FR.map((_l, idx) => tProbability(idx));
    const fallbackSeverityLabels = SEVERITY_LABELS_FR.map((_l, idx) => tSeverity(idx));
    const probabilityLabels = overview?.matrix?.probabilityLabels || fallbackProbabilityLabels;
    const severityLabels = overview?.matrix?.severityLabels || fallbackSeverityLabels;

    // Donuts — palette cyclique sobre (les segments étaient sans couleur)
    const DONUT_PALETTE = ['#0F766E', '#D97706', '#7C3AED', '#0284C7', '#E11D48', '#475569', '#059669', '#C2410C'];
    const departmentDonut = (overview?.distributions?.byDepartment || []).map((d, i) => ({
        name: d.label || departmentMap[d.key]?.name || String(d.key),
        value: d.count,
        color: DONUT_PALETTE[i % DONUT_PALETTE.length],
    }));
    const hazardDonut = (overview?.distributions?.byHazardSource || []).map((d, i) => ({
        name: d.label || String(d.key),
        value: d.count,
        color: DONUT_PALETTE[i % DONUT_PALETTE.length],
    }));

    // Fréquence par probabilité (somme par premier chiffre de la clé de niveau)
    const frequencyChartData = useMemo(() => {
        const map: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        const src = overview?.distributions?.byLevelKey || {};
        Object.entries(src).forEach(([key, cnt]) => {
            const p = key.charAt(0);
            if (map[p] !== undefined) map[p] += cnt;
        });
        return ['1', '2', '3', '4', '5'].map((n, idx) => ({
            probability: probabilityLabels[idx] || n,
            count: map[n] || 0,
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [overview?.distributions?.byLevelKey, probabilityLabels]);

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: t('common.home'), to: '/' },
                    { label: t('common.riskManagement') },
                    { label: t('dashboard.breadcrumb') },
                ]}
                icon={<IconChartBar size={22} stroke={2} />}
                iconColor="red"
                title={t('dashboard.title')}
                subtitle={t('dashboard.subtitle')}
            />

            {loading ? (
                <SkeletonDashboard />
            ) : overview ? (
                <>
                    <SummaryCards metrics={overview.metrics} />
                    <Charts
                        leftDonutTitle={t('dashboard.donutHazardTitle')}
                        rightDonutTitle={t('dashboard.donutDepartmentTitle')}
                        leftDonutData={hazardDonut}
                        rightDonutData={departmentDonut}
                        matrixCounts={overview.matrix.counts}
                        probabilityLabels={probabilityLabels}
                        severityLabels={severityLabels}
                        frequencyChartData={frequencyChartData}
                    />
                </>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200">
                    <EmptyState
                        icon={<IconChartBar size={24} />}
                        title={t('dashboard.emptyTitle')}
                        description={t('dashboard.emptyDescription')}
                        compact
                    />
                </div>
            )}
        </div>
    );
};

export default RiskOverview;

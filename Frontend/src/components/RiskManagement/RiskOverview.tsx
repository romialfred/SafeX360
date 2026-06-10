import React, { useEffect, useMemo, useState } from 'react';
import { IconChartBar } from '@tabler/icons-react';
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
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<RiskOverviewResponse | null>(null);
    const [departmentMap, setDepartmentMap] = useState<Record<string | number, any>>({});

    useEffect(() => {
        getRiskOverview()
            .then(setOverview)
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Échec du chargement de la vue d'ensemble");
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

    const probabilityLabels = overview?.matrix?.probabilityLabels || PROBABILITY_LABELS_FR;
    const severityLabels = overview?.matrix?.severityLabels || SEVERITY_LABELS_FR;

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
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des Risques' },
                    { label: "Vue d'ensemble" },
                ]}
                icon={<IconChartBar size={22} stroke={2} />}
                iconColor="red"
                title="Vue d'ensemble des risques"
                subtitle="Indicateurs, répartitions et matrice probabilité × gravité — cadre ISO 31000"
            />

            {loading ? (
                <SkeletonDashboard />
            ) : overview ? (
                <>
                    <SummaryCards metrics={overview.metrics} />
                    <Charts
                        leftDonutTitle="Répartition par source de danger"
                        rightDonutTitle="Répartition par département"
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
                        title="Aucune donnée de synthèse disponible"
                        description="La vue d'ensemble s'alimente automatiquement dès que des risques sont enregistrés au registre."
                        compact
                    />
                </div>
            )}
        </div>
    );
};

export default RiskOverview;

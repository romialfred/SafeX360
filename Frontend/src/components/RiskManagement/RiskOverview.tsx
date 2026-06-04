import React, { useEffect, useMemo, useState } from 'react';
import { Box, LoadingOverlay } from '@mantine/core';
import { IconChartBar } from '@tabler/icons-react';
import SummaryCards from './RiskOverview/SummaryCards';
import Charts from './RiskOverview/Charts';
import DetailView from './RiskAssessment/Detail/DetailView';
import PageHeader from '../UtilityComp/PageHeader';
import { getAllDepartments } from '../../services/HrmsService';
import { getRiskOverview, RiskOverviewResponse } from '../../services/RiskRegisterService';

// LOT 40 P1: Extract hardcoded fallback labels to module-top constants for consistency / reuse
const DEFAULT_PROBABILITY_LABELS = ['Rare', 'Improbable', 'Possible', 'Probable', 'Quasi-certain'];
const DEFAULT_IMPACT_LABELS = ['Négligeable', 'Mineure', 'Modérée', 'Majeure', 'Catastrophique'];

const RiskOverview: React.FC = () => {
    // Detail view state (not used yet in overview)
    const [showDetails, _setShowDetails] = useState(false);
    const [selectedRisk, _setSelectedRisk] = useState<any | null>(null);

    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<RiskOverviewResponse | null>(null);
    const [departmentMap, setDepartmentMap] = useState<Record<string | number, any>>({});

    useEffect(() => {
        getRiskOverview()
            .then(setOverview)
            .catch((_e) => { /* optionally show a toast */ })
            .finally(() => setLoading(false));

        getAllDepartments()
            .then((list) => {
                const map: Record<string | number, any> = {};
                (list || []).forEach((d: any) => { map[d.id] = d; });
                setDepartmentMap(map);
            })
            .catch((_e) => { /* ignore */ });
    }, []);

    // LOT 40 P1: Use module-level constants instead of inline arrays
    const probabilityLabels = overview?.matrix?.probabilityLabels || DEFAULT_PROBABILITY_LABELS;
    const severityLabels = overview?.matrix?.severityLabels || DEFAULT_IMPACT_LABELS;

    // Donuts
    const departmentDonut = (overview?.distributions?.byDepartment || []).map((d) => ({ name: d.label || departmentMap[d.key]?.name || String(d.key), value: d.count, color: '' }));
    const hazardDonut = (overview?.distributions?.byHazardSource || []).map((d) => ({ name: d.label || String(d.key), value: d.count, color: '' }));

    // Frequency by probability (sum by first digit of riskLevel key)
    const frequencyChartData = useMemo(() => {
        const map: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        const src = overview?.distributions?.byLevelKey || {};
        Object.entries(src).forEach(([key, cnt]) => {
            const p = key.charAt(0);
            if (map[p] !== undefined) map[p] += cnt;
        });
        const labels = probabilityLabels;
        return ['1', '2', '3', '4', '5'].map((n, idx) => ({ probability: labels[idx] || n, count: map[n] || 0 }));
    }, [overview?.distributions?.byLevelKey]);



    return (
        <Box p="md">



            {!showDetails ? (
                <div className="space-y-5 w-full">
                    <PageHeader
                        breadcrumbs={[
                            { label: 'Accueil', to: '/' },
                            { label: 'Gestion des Risques' },
                            { label: "Vue d'ensemble" },
                        ]}
                        icon={<IconChartBar size={22} stroke={2} />}
                        iconColor="red"
                        title="Vue d'ensemble — Gestion des risques"
                        subtitle="Analyse complète et surveillance des risques HSE conformément à ISO 31000"
                    />
                    <LoadingOverlay visible={loading} />
                    {overview && (
                        <>
                            <SummaryCards metrics={overview.metrics} />
                            <Charts
                                leftDonutTitle="Répartition par sources de danger"
                                rightDonutTitle="Répartition par département"
                                leftDonutData={hazardDonut}
                                rightDonutData={departmentDonut}
                                matrixCounts={overview.matrix.counts}
                                probabilityLabels={probabilityLabels}
                                severityLabels={severityLabels}
                                frequencyChartData={frequencyChartData}
                            />
                        </>
                    )}
                    {/* <RiskTable
                        filteredRisks={filteredRisks}
                        onSelect={handleRiskClick}

                        getStatusColor={getStatusColor}
                    /> */}
                </div>
            ) : selectedRisk ? (
                <DetailView


                />
            ) : null}
        </Box>
    );

};

export default RiskOverview;

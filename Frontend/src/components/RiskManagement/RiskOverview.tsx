import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, Breadcrumbs, LoadingOverlay } from '@mantine/core';
import SummaryCards from './RiskOverview/SummaryCards';
import Charts from './RiskOverview/Charts';
import DetailView from './RiskAssessment/Detail/DetailView';
import { Link } from 'react-router-dom';
import { getAllDepartments } from '../../services/HrmsService';
import { getRiskOverview, RiskOverviewResponse } from '../../services/RiskRegisterService';

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

    const probabilityLabels = overview?.matrix?.probabilityLabels || ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];
    const severityLabels = overview?.matrix?.severityLabels || ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'];

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
                <>

                    <div>
                        <div className="font-semibold text-2xl text-blue-500 w-fit">Risk Management Dashboard</div>
                        <Breadcrumbs mt="xs" mb="lg">
                            <Link className="hover:!underline" to="/">
                                <Text variant="gradient">Home</Text>
                            </Link>

                            <Text variant="gradient">Risk Management Dashboard</Text>
                        </Breadcrumbs>
                    </div>
                    <p className=' italic mb-3'>Comprehensive risk analysis and monitoring system</p>
                    <LoadingOverlay visible={loading} />
                    {overview && (
                        <>
                            <SummaryCards metrics={overview.metrics} />
                            <Charts
                                leftDonutTitle="Risk distribution by hazard sources"
                                rightDonutTitle="Risk distribution by Department"
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
                </>
            ) : selectedRisk ? (
                <DetailView


                />
            ) : null}
        </Box>
    );

};

export default RiskOverview;

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@mantine/core';
import { BarChart } from '@mantine/charts';
import {
    IconClipboardList,
    IconDownload,
    IconHourglassHigh,
    IconPackage,
    IconPlus,
    IconShieldCheck,
    IconTriangleSquareCircle,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../UtilityComp/PageHeader';
import KpiTile from '../UtilityComp/KpiTile';
import { getAllPPE } from '../../services/PPEService';
import { getAllAssignmentCounts } from '../../services/PpeEmpService';
import { getAllPpeRequests } from '../../services/PpeRequestService';
import { getEmployeesWithPosition } from '../../services/HrmsService';
import { mapIdToName } from '../../utility/OtherUtilities';
import { successNotification } from '../../utility/NotificationUtility';
import { ppeCategoryLabel, stockBucket, STOCK_STATUS_CONFIG, ppeStatusConfig } from './ppeLabels';

/**
 * Vue d'ensemble du parc d'EPI : stocks par catégorie, dotations par
 * département, alertes de seuil et demandes en attente.
 * ISO 45001 §8.1.2 — Dotation et suivi des équipements de protection.
 */
const PPEManagementDashboard = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('ppe');
    const [ppe, setPpe] = useState<any[]>([]);
    const [ppeEmp, setPpeEmp] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.allSettled([
            getAllPPE().then(setPpe),
            getAllAssignmentCounts().then(setPpeEmp),
            getAllPpeRequests().then(setRequests),
            getEmployeesWithPosition().then((data) => setEmpMap(mapIdToName(data))),
        ]).finally(() => setLoading(false));
    }, []);

    const metrics = useMemo(() => {
        const byCategory = ppe.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + (item.stock ?? 0);
            return acc;
        }, {} as Record<string, number>);

        return {
            totalStock: ppe.reduce((sum, item) => sum + (item.stock ?? 0), 0),
            availableStock: ppe
                .filter((item) => String(item.status).toUpperCase() === 'ACTIVE')
                .reduce((sum, item) => sum + (item.stock ?? 0), 0),
            lowStockCount: ppe.filter((item) => stockBucket(item.stock, item.minStock) !== 'AVAILABLE').length,
            pendingRequests: requests.filter((req) => String(req.status).toUpperCase() === 'PENDING').length,
            byCategory,
        };
    }, [ppe, requests]);

    const categoryChartData = useMemo(
        () =>
            Object.keys(metrics.byCategory).map((cat, idx) => ({
                category: ppeCategoryLabel(cat),
                quantity: metrics.byCategory[cat],
                color: ['#0F766E', '#0284C7', '#D97706', '#7C3AED', '#059669', '#E11D48', '#475569', '#4F46E5'][idx % 8],
            })),
        [metrics.byCategory]
    );

    const departmentChartData = useMemo(
        () =>
            ppeEmp.reduce((acc: any[], emp: any) => {
                const department = empMap[emp?.empId]?.department || t('common.notProvided');
                const assignments = emp.count || 0;
                const existing = acc.find((item) => item.department === department);
                if (existing) {
                    existing.assignments += assignments;
                } else {
                    acc.push({
                        department,
                        assignments,
                        color: ['#0F766E', '#0284C7', '#D97706', '#7C3AED', '#059669', '#E11D48', '#475569'][acc.length % 7],
                    });
                }
                return acc;
            }, []),
        [ppeEmp, empMap]
    );

    const exportCsv = () => {
        const headers = [
            t('dashboard.csvHeaderPpe'),
            t('dashboard.csvHeaderCategory'),
            t('dashboard.csvHeaderCurrentStock'),
            t('dashboard.csvHeaderMinStock'),
            t('dashboard.csvHeaderStockStatus'),
            t('dashboard.csvHeaderCatalogStatus'),
        ];
        const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const lines = ppe.map((item) =>
            [
                item.name,
                ppeCategoryLabel(item.category),
                item.stock ?? 0,
                item.minStock ?? 0,
                STOCK_STATUS_CONFIG[stockBucket(item.stock, item.minStock)].label,
                ppeStatusConfig(item.status).label,
            ].map(escape).join(';')
        );
        const csv = '﻿' + [headers.map(escape).join(';'), ...lines].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `stock_epi_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        successNotification(t('dashboard.exportSuccess', { count: ppe.length }));
    };

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: t('common.breadcrumbHome'), to: '/' },
                    { label: t('common.breadcrumbModule') },
                    { label: t('dashboard.breadcrumbOverview') },
                ]}
                icon={<IconShieldCheck size={22} stroke={2} />}
                iconColor="amber"
                title={t('dashboard.title')}
                subtitle={t('dashboard.subtitle')}
                actions={
                    <>
                        <Button
                            variant="default"
                            size="sm"
                            leftSection={<IconDownload size={14} />}
                            onClick={exportCsv}
                            disabled={!ppe.length}
                        >
                            {t('dashboard.exportCsv')}
                        </Button>
                        <Button size="sm" variant="default" leftSection={<IconPlus size={14} />} onClick={() => navigate('create-ppe')}>
                            {t('common.newPpe')}
                        </Button>
                        <Button size="sm" color="teal" leftSection={<IconPackage size={14} />} onClick={() => navigate('stock-form')}>
                            {t('common.stockEntry')}
                        </Button>
                        <Button size="sm" variant="default" leftSection={<IconClipboardList size={14} />} onClick={() => navigate('request-table')}>
                            {t('dashboard.requests')}
                        </Button>
                    </>
                }
            />

            {/* Indicateurs clés */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiTile
                    label={t('dashboard.kpiTotalStock')}
                    value={loading ? '…' : metrics.totalStock}
                    unit={t('dashboard.kpiUnit')}
                    tone="teal"
                    icon={<IconPackage size={14} stroke={1.8} />}
                    referenceValue={t('dashboard.kpiTotalStockRef', { count: ppe.length })}
                />
                <KpiTile
                    label={t('dashboard.kpiAvailable')}
                    value={loading ? '…' : metrics.availableStock}
                    unit={t('dashboard.kpiUnit')}
                    tone="green"
                    icon={<IconShieldCheck size={14} stroke={1.8} />}
                    referenceValue={t('dashboard.kpiAvailableRef')}
                />
                <KpiTile
                    label={t('dashboard.kpiLowStock')}
                    value={loading ? '…' : metrics.lowStockCount}
                    tone="amber"
                    icon={<IconTriangleSquareCircle size={14} stroke={1.8} />}
                    referenceValue={t('dashboard.kpiLowStockRef')}
                />
                <KpiTile
                    label={t('dashboard.kpiPending')}
                    value={loading ? '…' : metrics.pendingRequests}
                    tone="violet"
                    icon={<IconHourglassHigh size={14} stroke={1.8} />}
                    referenceValue={t('dashboard.kpiPendingRef')}
                />
            </div>

            {/* Répartitions */}
            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3" aria-busy="true">
                    {[0, 1].map((i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="h-4 w-48 rounded bg-slate-100 animate-pulse mb-4" />
                            <div className="h-64 rounded-lg bg-slate-100 animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <h2
                            className="text-slate-800 mb-3"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14.5px', fontWeight: 600 }}
                        >
                            {t('dashboard.chartStockByCategory')}
                        </h2>
                        {categoryChartData.length ? (
                            <BarChart
                                gridAxis="none"
                                h={280}
                                maxBarWidth={40}
                                data={categoryChartData}
                                dataKey="category"
                                series={[{ name: 'quantity', color: 'color', label: t('dashboard.chartStockLegend') }]}
                                withLegend={false}
                                withTooltip
                            />
                        ) : (
                            <p className="text-[12.5px] text-slate-500 py-10 text-center">
                                {t('dashboard.chartEmptyCatalog')}
                            </p>
                        )}
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <h2
                            className="text-slate-800 mb-3"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14.5px', fontWeight: 600 }}
                        >
                            {t('dashboard.chartAssignmentsByDept')}
                        </h2>
                        {departmentChartData.length ? (
                            <BarChart
                                gridAxis="none"
                                h={280}
                                maxBarWidth={40}
                                data={departmentChartData}
                                dataKey="department"
                                series={[{ name: 'assignments', color: 'color', label: t('dashboard.chartAssignmentsLegend') }]}
                                withLegend={false}
                                withTooltip
                            />
                        ) : (
                            <p className="text-[12.5px] text-slate-500 py-10 text-center">
                                {t('dashboard.chartEmptyAssignments')}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PPEManagementDashboard;

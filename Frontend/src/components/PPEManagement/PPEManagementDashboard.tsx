import { useEffect, useMemo, useState } from 'react';
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
                const department = empMap[emp?.empId]?.department || 'Non renseigné';
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
        const headers = ['EPI', 'Catégorie', 'Stock actuel', 'Stock minimum', 'Statut de stock', 'Statut catalogue'];
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
        successNotification(`${ppe.length} référence${ppe.length > 1 ? 's' : ''} EPI exportée${ppe.length > 1 ? 's' : ''}`);
    };

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des EPI' },
                    { label: "Vue d'ensemble" },
                ]}
                icon={<IconShieldCheck size={22} stroke={2} />}
                iconColor="amber"
                title="Équipements de protection individuelle"
                subtitle="Stocks, dotations et demandes d'EPI du site — ISO 45001 §8.1.2"
                actions={
                    <>
                        <Button
                            variant="default"
                            size="sm"
                            leftSection={<IconDownload size={14} />}
                            onClick={exportCsv}
                            disabled={!ppe.length}
                        >
                            Exporter CSV
                        </Button>
                        <Button size="sm" variant="default" leftSection={<IconPlus size={14} />} onClick={() => navigate('create-ppe')}>
                            Nouvel EPI
                        </Button>
                        <Button size="sm" color="teal" leftSection={<IconPackage size={14} />} onClick={() => navigate('stock-form')}>
                            Entrée de stock
                        </Button>
                        <Button size="sm" variant="default" leftSection={<IconClipboardList size={14} />} onClick={() => navigate('request-table')}>
                            Demandes
                        </Button>
                    </>
                }
            />

            {/* Indicateurs clés */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiTile
                    label="Stock total"
                    value={loading ? '…' : metrics.totalStock}
                    unit="unités"
                    tone="teal"
                    icon={<IconPackage size={14} stroke={1.8} />}
                    referenceValue={`${ppe.length} référence${ppe.length > 1 ? 's' : ''} au catalogue`}
                />
                <KpiTile
                    label="EPI disponibles"
                    value={loading ? '…' : metrics.availableStock}
                    unit="unités"
                    tone="green"
                    icon={<IconShieldCheck size={14} stroke={1.8} />}
                    referenceValue="Références actives uniquement"
                />
                <KpiTile
                    label="Sous le seuil"
                    value={loading ? '…' : metrics.lowStockCount}
                    tone="amber"
                    icon={<IconTriangleSquareCircle size={14} stroke={1.8} />}
                    referenceValue="Réapprovisionnement à planifier"
                />
                <KpiTile
                    label="Demandes en attente"
                    value={loading ? '…' : metrics.pendingRequests}
                    tone="violet"
                    icon={<IconHourglassHigh size={14} stroke={1.8} />}
                    referenceValue="File de validation EPI"
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
                            Stock par catégorie d'EPI
                        </h2>
                        {categoryChartData.length ? (
                            <BarChart
                                gridAxis="none"
                                h={280}
                                maxBarWidth={40}
                                data={categoryChartData}
                                dataKey="category"
                                series={[{ name: 'quantity', color: 'color', label: 'Quantité en stock' }]}
                                withLegend={false}
                                withTooltip
                            />
                        ) : (
                            <p className="text-[12.5px] text-slate-500 py-10 text-center">
                                Aucun EPI au catalogue pour le moment.
                            </p>
                        )}
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <h2
                            className="text-slate-800 mb-3"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14.5px', fontWeight: 600 }}
                        >
                            Dotations par département
                        </h2>
                        {departmentChartData.length ? (
                            <BarChart
                                gridAxis="none"
                                h={280}
                                maxBarWidth={40}
                                data={departmentChartData}
                                dataKey="department"
                                series={[{ name: 'assignments', color: 'color', label: 'Dotations actives' }]}
                                withLegend={false}
                                withTooltip
                            />
                        ) : (
                            <p className="text-[12.5px] text-slate-500 py-10 text-center">
                                Aucune dotation enregistrée pour le moment.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PPEManagementDashboard;

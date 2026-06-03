import { useState, useMemo, useEffect } from 'react';
import { Box, Title, Grid, Card, Text, Group, Button } from '@mantine/core';
import { BarChart } from '@mantine/charts';
import {
    IconShield,
    IconPackage,
    IconAlertTriangle,
    IconPlus,
    IconClipboardList,
    IconClock,
    IconShieldCheck,
    IconDownload,
} from '@tabler/icons-react';
import { employeesData, eppAssignments, eppRequests } from '../../Data/dummyData/eppData';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../UtilityComp/PageHeader';
import { getAllPPE } from '../../services/PPEService';
import { getAllAssignmentCounts } from '../../services/PpeEmpService';
import { getEmployeesWithPosition } from '../../services/HrmsService';
import { mapIdToName } from '../../utility/OtherUtilities';

const PPEManagementDashboard = () => {

    const navigate = useNavigate();
    const [ppe, setPpe] = useState<any[]>([]);
    const [ppeEmp, setPpeEmp] = useState<any[]>([]);
    const [empMap, setEmpMap] = useState<Record<string, any>>({});


    useEffect(() => {
        getAllPPE().then((res) => {
            setPpe(res);
        }).catch((err) => {
            console.error(err);
        });

        getAllAssignmentCounts().then((res) => {
            setPpeEmp(res);
        }).catch((err) => {
            console.error(err);
        });
        getEmployeesWithPosition().then((data) => {
            setEmpMap(mapIdToName(data));
        }).catch((err) => {
            console.error(err);
        });
    }, [])


    // Calculate dashboard metrics
    const dashboardMetrics = useMemo(() => {
        const eppByCategory = ppe.reduce((acc, epp) => {
            acc[epp.category] = (acc[epp.category] || 0) + epp.stock;
            return acc;
        }, {} as Record<string, number>);

        const assignmentsByDept = eppAssignments
            .filter(assignment => assignment.status === 'Active')
            .reduce((acc, assignment) => {
                const employee = employeesData.find(emp => emp.id === assignment.employeeId);
                if (employee) {
                    acc[employee.department] = (acc[employee.department] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);

        const lowStockItems = ppe.filter(epp => epp.stock <= epp.minStock);
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        const expiringItems = ppe.filter(epp => new Date(epp.expiryDate) <= sixMonthsFromNow);
        const availableEPP = ppe.filter(epp => epp.status === 'ACTIVE').reduce((sum, epp) => sum + epp.stock, 0);
        const pendingRequests = eppRequests.filter(req => req.status === 'Pending').length;

        return {
            totalEPP: ppe.reduce((sum, epp) => sum + epp.stock, 0),
            availableEPP,
            totalCategories: Object.keys(eppByCategory).length,
            activeAssignments: eppAssignments.filter(a => a.status === 'Active').length,
            lowStockCount: lowStockItems.length,
            expiringCount: expiringItems.length,
            pendingRequests,
            eppByCategory,
            assignmentsByDept,
            lowStockItems,
            expiringItems
        };
    }, [ppe]);

    const categoryChartData = Object.keys(dashboardMetrics.eppByCategory).map((cat, idx) => ({
        category: cat,
        quantity: dashboardMetrics.eppByCategory[cat],
        color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#3B82F6'][idx % 8]
    }));
    const departmentChartData = ppeEmp.reduce((acc, emp, _idx) => {
        const department = empMap[emp?.empId]?.department || "Unknown";
        const assignments = emp.count || 0;

        // Check if department already exists in acc
        const existing = acc.find((item: any) => item.department === department);

        if (existing) {
            // Add to existing count
            existing.assignments += assignments;
        } else {
            // Add new department
            acc.push({
                department,
                assignments,
                color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EF4444', '#A16207'][acc.length % 7]
            });
        }

        return acc;
    }, []);





    return (
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des EPI' },
                    { label: "Vue d'ensemble" },
                ]}
                icon={<IconShieldCheck size={22} stroke={2} />}
                iconColor="yellow"
                title="Vue d'ensemble — Équipements de protection individuelle"
                subtitle="Contrôle centralisé du cycle de vie, conformité et disponibilité des EPI"
                actions={
                    <>
                        <Button variant="default" size="sm" leftSection={<IconDownload size={14} />}>
                            Exporter
                        </Button>
                        <Button size="sm" leftSection={<IconPlus size={14} />} onClick={() => navigate('create-ppe')} color="blue">
                            Nouveau EPI
                        </Button>
                        <Button size="sm" leftSection={<IconPackage size={14} />} onClick={() => navigate('stock-form')} color="teal">
                            Entrée stock
                        </Button>
                        <Button size="sm" leftSection={<IconClipboardList size={14} />} onClick={() => navigate('request-table')} color="amber">
                            Demandes
                        </Button>
                    </>
                }
            />

            {/* KPIs raffinés */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiTile color="blue" label="Total EPI en stock" value={dashboardMetrics.totalEPP} icon={IconPackage} />
                <KpiTile color="green" label="EPI disponibles" value={dashboardMetrics.availableEPP} icon={IconShield} />
                <KpiTile color="orange" label="Stock faible" value={dashboardMetrics.lowStockCount} icon={IconAlertTriangle} />
                <KpiTile color="amber" label="Demandes en attente" value={dashboardMetrics.pendingRequests} icon={IconClock} />
            </div>

            <Grid mb="xl">
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card shadow="sm" padding="md" radius="md" withBorder>
                        <Title order={5} mb="sm" className="text-slate-800">EPI par catégorie</Title>
                        <Box h={330} style={{ position: 'relative' }}>
                            <BarChart
                                gridAxis='none'
                                h={300}
                                maxBarWidth={40}
                                data={categoryChartData}
                                dataKey="category"
                                series={[{ name: 'quantity', color: 'color', label: 'Quantité' }]}
                                withLegend={false}
                                withTooltip={false}
                            />
                        </Box>
                    </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card shadow="sm" padding="md" radius="md" withBorder>
                        <Title order={5} mb="sm" className="text-slate-800">Affectations par département</Title>
                        <Box h={330} style={{ position: 'relative' }}>
                            <BarChart
                                h={300}
                                gridAxis='none'
                                withTooltip={false}
                                maxBarWidth={40}
                                data={departmentChartData}
                                dataKey="department"
                                series={[{ name: 'assignments', color: 'color', label: 'Affectations actives' }]}
                                withLegend={false}
                            />
                        </Box>
                    </Card>
                </Grid.Col>
            </Grid>
        </div>
    );
};

// === KPI tile compact ===
const KpiTile = ({ color, label, value, icon: Icon }: any) => {
    const colors: Record<string, any> = {
        blue: { bg: 'bg-blue-50/60', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-500' },
        green: { bg: 'bg-green-50/60', border: 'border-green-200', text: 'text-green-700', accent: 'bg-green-500' },
        orange: { bg: 'bg-orange-50/60', border: 'border-orange-200', text: 'text-orange-700', accent: 'bg-orange-500' },
        amber: { bg: 'bg-amber-50/60', border: 'border-amber-200', text: 'text-amber-700', accent: 'bg-amber-500' },
    };
    const c = colors[color];
    return (
        <div className={`bg-white rounded-lg border ${c.border} overflow-hidden hover:shadow-md transition-all`}>
            <div className={`h-1 ${c.accent}`}></div>
            <div className="p-3">
                <div className={`p-1.5 rounded-md ${c.bg} ${c.border} border inline-block mb-2`}>
                    <Icon size={14} className={c.text} />
                </div>
                <p className={`text-2xl ${c.text} tabular-nums`}>{value}</p>
                <p className="text-[11px] text-slate-700 mt-0.5">{label}</p>
            </div>
        </div>
    );
};

export default PPEManagementDashboard;

import { useState, useMemo, useEffect } from 'react';
import { Box, Title, Grid, Card, Text, Group, SimpleGrid, Button, Breadcrumbs } from '@mantine/core';
import { BarChart } from '@mantine/charts';
import {
    IconShield,
    IconPackage,
    IconAlertTriangle,
    IconPlus,
    IconClipboardList,
    IconClock,
} from '@tabler/icons-react';
import { employeesData, eppAssignments, eppRequests } from '../../Data/dummyData/eppData';
import { Link, useNavigate } from 'react-router-dom';
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
        <div className='flex flex-col gap-5'>
            <div className="flex items-center justify-between">

                <div>
                    <div className="font-semibold text-2xl text-blue-500 w-fit">PPE Dashboard</div>
                    <Breadcrumbs mt="xs" >
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient">Home</Text>
                        </Link>

                        <Text variant="gradient">PPE Dashboard</Text>
                    </Breadcrumbs>
                </div>


                <div className="flex gap-5">

                    <Button leftSection={<IconPlus size={16} />} onClick={() => navigate('create-ppe')} color="blue">
                        Create new PPE
                    </Button>
                    <Button leftSection={<IconPackage size={16} />} onClick={() => navigate('stock-form')} color="teal">
                        Stock entry
                    </Button>
                    <Button leftSection={<IconClipboardList size={16} />} onClick={() => navigate('request-table')} color="yellow">
                        View Requests
                    </Button>
                </div>
            </div>
            <div className="italic">
                Centralized control of personal protective equipment lifecycle, compliance, and availability
            </div>


            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl" spacing="md">
                <Card shadow="sm" padding="md" radius="md" withBorder h={120}>
                    <Group justify="space-between">
                        <Box>
                            <Text c="dimmed" size="sm">Total PPE</Text>
                            <Title order={2}>{dashboardMetrics.totalEPP}</Title>
                        </Box>
                        <IconPackage size={24} color="#1971C2" />
                    </Group>
                </Card>
                <Card shadow="sm" padding="md" radius="md" withBorder h={120}>
                    <Group justify="space-between">
                        <Box>
                            <Text c="dimmed" size="sm">PPE Available</Text>
                            <Title order={2}>{dashboardMetrics.availableEPP}</Title>
                        </Box>
                        <IconShield size={24} color="#51CF66" />
                    </Group>
                </Card>
                <Card shadow="sm" padding="md" radius="md" withBorder h={120}>
                    <Group justify="space-between">
                        <Box>
                            <Text c="dimmed" size="sm">Low Stock</Text>
                            <Title order={2} c="orange">{dashboardMetrics.lowStockCount}</Title>
                        </Box>
                        <IconAlertTriangle size={24} color="#FF922B" />
                    </Group>
                </Card>
                {/* <Card shadow="sm" padding="md" radius="md" withBorder h={120}>
                    <Group justify="space-between">
                        <Box>
                            <Text c="dimmed" size="sm">Expiring Soon</Text>
                            <Title order={2} c="red">{dashboardMetrics.expiringCount}</Title>
                        </Box>
                        <IconTool size={24} color="#FF6B6B" />
                    </Group>
                </Card> */}
                <Card shadow="sm" padding="md" radius="md" withBorder h={120}>
                    <Group justify="space-between">
                        <Box>
                            <Text c="dimmed" size="sm">Pending Requests</Text>
                            <Title order={2} c="blue">{dashboardMetrics.pendingRequests}</Title>
                        </Box>
                        <IconClock size={24} color="#1971C2" />
                    </Group>
                </Card>
            </SimpleGrid>

            <Grid mb="xl">
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card shadow="sm" padding="md" radius="md" withBorder>
                        <Title order={5} mb="sm">PPE per Category</Title>
                        <Box h={330} style={{ position: 'relative' }}>
                            <BarChart
                                gridAxis='none'

                                h={300}
                                maxBarWidth={40}
                                data={categoryChartData}
                                dataKey="category"
                                series={[{ name: 'quantity', color: 'color', label: 'Quantity' }]}
                                withLegend={false}
                                withTooltip={false}
                            />
                        </Box>
                    </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card shadow="sm" padding="md" radius="md" withBorder>
                        <Title order={5} mb="sm">Department Assignments</Title>
                        <Box h={330} style={{ position: 'relative' }}>
                            <BarChart
                                h={300}
                                gridAxis='none'

                                withTooltip={false}
                                maxBarWidth={40}
                                data={departmentChartData}
                                dataKey="department"
                                series={[{ name: 'assignments', color: 'color', label: 'Active Assignments' }]}
                                withLegend={false}
                            />
                        </Box>
                    </Card>
                </Grid.Col>
            </Grid>


        </div>
    );
};

export default PPEManagementDashboard;

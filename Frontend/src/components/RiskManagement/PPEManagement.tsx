import { useState, useMemo } from 'react';
import {
    Box,
    Title,
    Grid,
    Card,
    Text,
    Group,
    Badge,
    Select,
    SimpleGrid,
    Button,
    Modal,
    Stack,
    Table,
    ScrollArea,
    Tabs,
    TextInput,
    Textarea,
    NumberInput,
    ActionIcon,
    Anchor,
    Timeline,
    Progress,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { BarChart } from '@mantine/charts';
import {
    IconShield,
    IconPackage,
    IconAlertTriangle,
    IconPlus,
    IconEye,
    IconHistory,
    IconArrowLeft,
    IconDeviceFloppy,
    IconClipboardList,
    IconTool,
    IconCheck,
    IconX,
    IconClock,
} from '@tabler/icons-react';
import {
    eppData,
    employeesData,
    eppAssignments,
    eppHistory,
    eppRequests,
    EPP,
    Employee,
} from '../../Data/dummyData/eppData';

const PpeManagement = () => {
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [showEPPForm, setShowEPPForm] = useState(false);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [showRequestsTable, setShowRequestsTable] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedEPPForStock, setSelectedEPPForStock] = useState<EPP | null>(null);

    const eppForm = useForm({
        initialValues: {
            name: '',
            category: '',
            description: '',
            minStockLevel: 5,
            certificationStandard: ''
        }
    });

    const stockEntryForm = useForm({
        initialValues: {
            eppId: '',
            quantity: 1,
            unitPrice: 0,
            supplier: ''
        }
    });

    const requestForm = useForm({
        initialValues: {
            employeeIds: [],
            eppIds: [],
            requestedDate: null,
            reason: '',
            priority: 'Medium'
        }
    });

    // Calculate dashboard metrics
    const dashboardMetrics = useMemo(() => {
        // EPP by category
        const eppByCategory = eppData.reduce((acc, epp) => {
            acc[epp.category] = (acc[epp.category] || 0) + epp.quantity;
            return acc;
        }, {} as Record<string, number>);

        // Assignments by department
        const assignmentsByDept = eppAssignments
            .filter(assignment => assignment.status === 'Active')
            .reduce((acc, assignment) => {
                const employee = employeesData.find(emp => emp.id === assignment.employeeId);
                if (employee) {
                    acc[employee.department] = (acc[employee.department] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);

        // Low stock items
        const lowStockItems = eppData.filter(epp => epp.quantity <= epp.minStockLevel);

        // Expiring items (within 6 months)
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        const expiringItems = eppData.filter(epp => new Date(epp.expiryDate) <= sixMonthsFromNow);

        // Available EPP
        const availableEPP = eppData.filter(epp => epp.status === 'Available').reduce((sum, epp) => sum + epp.quantity, 0);

        // Pending requests
        const pendingRequests = eppRequests.filter(req => req.status === 'Pending').length;

        return {
            totalEPP: eppData.reduce((sum, epp) => sum + epp.quantity, 0),
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
    }, []);

    // Mantine BarChart data
    const categoryChartData = Object.keys(dashboardMetrics.eppByCategory).map((cat, idx) => ({
        category: cat,
        quantity: dashboardMetrics.eppByCategory[cat],
        color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#3B82F6'][idx % 8]
    }));

    const departmentLabels = ['Mine', 'Geologie', 'Usine maintenance', 'Usine Production', 'RH', 'IT', 'SCM'];
    const departmentChartData = departmentLabels.map((dept, idx) => ({
        department: dept,
        assignments: dashboardMetrics.assignmentsByDept[dept] || 0,
        color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EF4444', '#A16207'][idx % 7]
    }));

    // Get employee assignments with EPP details
    const getEmployeeAssignments = (employeeId: string) => {
        return eppAssignments
            .filter(assignment => assignment.employeeId === employeeId)
            .map(assignment => ({
                ...assignment,
                epp: eppData.find(epp => epp.id === assignment.eppId)
            }));
    };

    // Get employee history
    const getEmployeeHistory = (employeeId: string) => {
        return eppHistory
            .filter(history => history.employeeId === employeeId)
            .map(history => ({
                ...history,
                epp: eppData.find(epp => epp.id === history.eppId)
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const handleEmployeeClick = (employee: Employee) => {
        setSelectedEmployee(employee);
        setActiveView('employee-details');
    };

    const handleSubmitEPP = (values: any) => {
        const newEPP = {
            ...values,
            id: `EPP-${String(eppData.length + 1).padStart(3, '0')}`,
            brand: 'N/A',
            model: 'N/A',
            size: 'N/A',
            status: 'Available',
            quantity: 0,
            unitPrice: 0,
            supplier: 'N/A',
            expiryDate: '2030-12-31',
            dateAdded: new Date().toISOString().split('T')[0],
            lastInspection: new Date().toISOString().split('T')[0],
            nextInspection: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };

        notifications.show({
            title: 'EPP ajouté avec succès',
            message: `${newEPP.name} (${newEPP.id}) a été ajouté à l'inventaire`,
            color: 'green'
        });

        eppForm.reset();
        setActiveView('dashboard');
    };

    const handleSubmitStockEntry = (values: any) => {
        if (!selectedEPPForStock) return;

        // Update the EPP quantity in the data


        // Update selected EPP for stock with new quantity
        setSelectedEPPForStock(prev => prev ? { ...prev, quantity: prev.quantity + parseInt(values.quantity) } : null);

        notifications.show({
            title: 'Stock Updated Successfully',
            message: `Added ${values.quantity} units to ${selectedEPPForStock.name}`,
            color: 'green'
        });

        stockEntryForm.reset();
        setActiveView('dashboard');
        setSelectedEPPForStock(null);
    };


    const handleSubmitRequest = (values: any) => {
        const employees = employeesData.filter(emp => values.employeeIds.includes(emp.id));
        const epps = eppData.filter(epp => values.eppIds.includes(epp.id));

        notifications.show({
            title: 'Demande EPP créée',
            message: `Demande pour ${employees.length} employé(s) et ${epps.length} EPP(s) soumise`,
            color: 'green'
        });

        requestForm.reset();
        setShowRequestForm(false);
    };

    const handleApproveRequest = (requestId: string,) => {
        notifications.show({
            title: 'Demande approuvée',
            message: `La demande ${requestId} a été approuvée`,
            color: 'green'
        });
    };

    const handleRejectRequest = (requestId: string,) => {
        notifications.show({
            title: 'Demande rejetée',
            message: `La demande ${requestId} a été rejetée`,
            color: 'red'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'available': return 'green';
            case 'assigned': return 'blue';
            case 'maintenance': return 'orange';
            case 'expired': return 'red';
            case 'active': return 'green';
            case 'returned': return 'gray';
            case 'lost': return 'red';
            case 'damaged': return 'orange';
            case 'pending': return 'yellow';
            case 'approved': return 'green';
            case 'rejected': return 'red';
            default: return 'gray';
        }
    };

    const getActionColor = (action: string) => {
        switch (action.toLowerCase()) {
            case 'assigned': return 'green';
            case 'returned': return 'blue';
            case 'replaced': return 'orange';
            case 'lost': return 'red';
            case 'damaged': return 'orange';
            case 'expired': return 'red';
            default: return 'gray';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'high': return 'red';
            case 'medium': return 'orange';
            case 'low': return 'green';
            default: return 'gray';
        }
    };

    const departments = ['Mine', 'Geologie', 'Usine maintenance', 'Usine Production', 'RH', 'IT', 'SCM'];
    const categories = [...new Set(eppData.map(epp => epp.category))];

    // Render Create EPP Form
    const renderCreateEPPForm = () => (
        <Box>
            <Group justify="space-between" mb="md">
                <Group>
                    <Button variant="light" leftSection={<IconArrowLeft size={16} />} onClick={() => setActiveView('dashboard')}>
                        Back
                    </Button>
                    <Title order={2}>Create New PPE</Title>
                </Group>
            </Group>

            <Grid>
                <Grid.Col span={{ base: 12, lg: 8 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Title order={3} mb="md">PPE Information</Title>
                        <form onSubmit={eppForm.onSubmit(handleSubmitEPP)}>
                            <Grid>
                                <Grid.Col span={12}>
                                    <TextInput
                                        label="PPE Name *"
                                        placeholder="Ex: Safety Helmet"
                                        required
                                        {...eppForm.getInputProps('name')}
                                    />
                                </Grid.Col>

                                <Grid.Col span={12}>
                                    <Select
                                        label="Category *"
                                        placeholder="Select a category"
                                        data={[
                                            'Head protection',
                                            'Eye protection',
                                            'Hand protection',
                                            'Foot protection',
                                            'Respiratory protection',
                                            'Protective clothing',
                                            'Hearing protection',
                                            'Fall protection'
                                        ]}
                                        required
                                        {...eppForm.getInputProps('category')}
                                    />
                                </Grid.Col>

                                <Grid.Col span={12}>
                                    <Textarea
                                        label="Description *"
                                        placeholder="Detailed description of the PPE..."
                                        rows={4}
                                        required
                                        {...eppForm.getInputProps('description')}
                                    />
                                </Grid.Col>

                                <Grid.Col span={6}>
                                    <NumberInput
                                        label="Minimum Stock *"
                                        placeholder="5"
                                        min={1}
                                        required
                                        {...eppForm.getInputProps('minStockLevel')}
                                    />
                                </Grid.Col>

                                <Grid.Col span={6}>
                                    <TextInput
                                        label="Certification Standard (Optional)"
                                        placeholder="Ex: EN 397"
                                        {...eppForm.getInputProps('certificationStandard')}
                                    />
                                </Grid.Col>

                                <Grid.Col span={12}>
                                    <Group justify="flex-end" mt="md">
                                        <Button variant="outline" onClick={() => setActiveView('dashboard')}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" leftSection={<IconDeviceFloppy size={16} />}>
                                            Create PPE
                                        </Button>
                                    </Group>
                                </Grid.Col>
                            </Grid>
                        </form>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 4 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Title order={4} mb="md">Existing PPE List</Title>
                        <Stack gap="md">
                            {eppData.slice(0, 5).map((epp) => (
                                <Box key={epp.id} p="sm" style={{ border: '1px solid #e9ecef', borderRadius: '8px' }}>
                                    <Group justify="space-between" mb="xs">
                                        <Text size="sm" lineClamp={1}>{epp.name}</Text>
                                    </Group>
                                    <Badge variant="light" color="blue" size="xs" mb="xs">
                                        {epp.category.toUpperCase()}
                                    </Badge>
                                    <Text size="xs" c="dimmed" lineClamp={2} mb="xs">
                                        {epp.description}
                                    </Text>
                                    <Group justify="space-between" align="center">
                                        <Text size="xs" c="dimmed">Stock: {epp.quantity}</Text>
                                        <Text size="xs" c="dimmed">Min: {epp.minStockLevel}</Text>
                                    </Group>
                                </Box>
                            ))}
                        </Stack>
                    </Card>
                </Grid.Col>
            </Grid>
        </Box>
    );

    // Render dashboard
    const renderDashboard = () => (
        <Box>
            <Group justify="space-between" mb="md">
                <Title order={1}>PPE Dashboard</Title>
                <Group>
                    <Button leftSection={<IconPlus size={16} />} onClick={() => setActiveView('create-epp')} color="blue">
                        Create new EPP
                    </Button>
                    <Button leftSection={<IconPackage size={16} />} onClick={() => setActiveView('stock-entry')} color="teal">
                        Stock entry
                    </Button>
                    <Button leftSection={<IconClipboardList size={16} />} onClick={() => setShowRequestForm(true)} color="green">
                        Nouvelle Demande
                    </Button>
                </Group>
            </Group>

            {/* Summary Cards */}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} mb="xl" spacing="md">
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

                <Card shadow="sm" padding="md" radius="md" withBorder h={120}>
                    <Group justify="space-between">
                        <Box>
                            <Text c="dimmed" size="sm">Expiring Soon</Text>
                            <Title order={2} c="red">{dashboardMetrics.expiringCount}</Title>
                        </Box>
                        <IconTool size={24} color="#FF6B6B" />
                    </Group>
                </Card>

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

            {/* Charts */}
            <Grid mb="xl">
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card shadow="sm" padding="md" radius="md" withBorder>
                        <Title order={5} mb="sm">PPE per Category</Title>
                        <Box h={330} style={{ position: 'relative' }}>
                            <BarChart
                                h={300}
                                data={categoryChartData}
                                dataKey="category"
                                series={[{ name: 'quantity', color: 'color', label: 'Quantité' }]}
                                withLegend={false}
                                withTooltip
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
                                data={departmentChartData}
                                dataKey="department"
                                series={[{ name: 'assignments', color: 'color', label: 'Attributions actives' }]}
                                withLegend={false}
                                withTooltip
                            />
                        </Box>
                    </Card>
                </Grid.Col>
            </Grid>

            {/* Tables */}
            {/* Demandes EPP en Attente - En haut après les graphiques */}
            <Grid mb="xs">
                <Grid.Col span={12}>
                    <Card shadow="sm" padding="md" radius="md" withBorder>
                        <Title order={3} mb="md">Pending PPE Requests</Title>
                        <ScrollArea>
                            <Table striped highlightOnHover withTableBorder>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>ID</Table.Th>
                                        <Table.Th>Employee(s)</Table.Th>
                                        <Table.Th>PPE</Table.Th>
                                        <Table.Th>Priority</Table.Th>
                                        <Table.Th>Requested Date</Table.Th>
                                        <Table.Th>Actions</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {eppRequests
                                        .filter(req => req.status === 'Pending')
                                        .map((request) => {
                                            const employees = employeesData.filter(emp => request.employeeIds?.includes(emp.id) || emp.id === request.employeeId);
                                            const requestedEPPs = eppData.filter(epp => request.eppIds.includes(epp.id));

                                            return (
                                                <Table.Tr key={request.id}>
                                                    <Table.Td>{request.id}</Table.Td>
                                                    <Table.Td>
                                                        <Stack gap="xs">
                                                            {employees.map(emp => (
                                                                <Text key={emp.id} size="xs">{emp.firstName} {emp.lastName}</Text>
                                                            ))}
                                                        </Stack>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Stack gap="xs">
                                                            {requestedEPPs.slice(0, 2).map(epp => (
                                                                <Text key={epp.id} size="xs">{epp.name}</Text>
                                                            ))}
                                                            {requestedEPPs.length > 2 && (
                                                                <Text size="xs" c="dimmed">+{requestedEPPs.length - 2} more</Text>
                                                            )}
                                                        </Stack>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Badge color={getPriorityColor(request.priority)} variant="light" size="sm">
                                                            {request.priority}
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text size="xs">{request.requestedDate || 'Not specified'}</Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Group gap="xs">
                                                            <ActionIcon
                                                                variant="light"
                                                                color="green"
                                                                onClick={() => handleApproveRequest(request.id)}
                                                                size="sm"
                                                            >
                                                                <IconCheck size={14} />
                                                            </ActionIcon>
                                                            <ActionIcon
                                                                variant="light"
                                                                color="red"
                                                                onClick={() => handleRejectRequest(request.id,)}
                                                                size="sm"
                                                            >
                                                                <IconX size={14} />
                                                            </ActionIcon>
                                                        </Group>
                                                    </Table.Td>
                                                </Table.Tr>
                                            );
                                        })}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
                    </Card>
                </Grid.Col>
            </Grid>

            {/* Employees and PPE Assignments */}
            <Grid mb="xs">
                <Grid.Col span={12}>
                    <Card shadow="sm" padding="md" radius="md" withBorder>
                        <Group justify="space-between" mb="md">
                            <Title order={3}>Employees and PPE Assignments</Title>
                            <Group>
                                <Select
                                    placeholder="Filter by department"
                                    data={departments}
                                    value={selectedDepartment}
                                    onChange={setSelectedDepartment}
                                    clearable
                                    w={200}
                                />
                            </Group>
                        </Group>
                        <ScrollArea>
                            <Table striped highlightOnHover withTableBorder>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Employee</Table.Th>
                                        <Table.Th>Department</Table.Th>
                                        <Table.Th>Position</Table.Th>
                                        <Table.Th>PPE Assigned</Table.Th>
                                        <Table.Th>Actions</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {employeesData
                                        .filter(emp => !selectedDepartment || emp.department === selectedDepartment)
                                        .map((employee) => {
                                            const assignments = getEmployeeAssignments(employee.id).filter(a => a.status === 'Active');
                                            return (
                                                <Table.Tr key={employee.id}>
                                                    <Table.Td>
                                                        <Anchor onClick={() => handleEmployeeClick(employee)} style={{ cursor: 'pointer' }}>
                                                            {employee.firstName} {employee.lastName}
                                                        </Anchor>
                                                    </Table.Td>
                                                    <Table.Td>{employee.department}</Table.Td>
                                                    <Table.Td>{employee.position}</Table.Td>
                                                    <Table.Td>
                                                        <Badge color="blue" variant="light">
                                                            {assignments.length} PPE
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <ActionIcon variant="light" color="blue" onClick={() => handleEmployeeClick(employee)}>
                                                            <IconEye size={16} />
                                                        </ActionIcon>
                                                    </Table.Td>
                                                </Table.Tr>
                                            );
                                        })}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
                    </Card>
                </Grid.Col>
            </Grid>

            {/* PPE Stock Tracking */}
            <Grid>
                <Grid.Col span={12}>
                    <Card shadow="sm" padding="md" radius="md" withBorder mb="md">
                        <Group justify="space-between" mb="md">
                            <Title order={3}>PPE Stock Tracking</Title>
                            <Group>
                                <Select
                                    placeholder="Filter by category"
                                    data={categories}
                                    value={selectedCategory}
                                    onChange={setSelectedCategory}
                                    clearable
                                    w={200}
                                />
                            </Group>
                        </Group>
                        <ScrollArea>
                            <Table striped highlightOnHover withTableBorder>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>PPE</Table.Th>
                                        <Table.Th>Category</Table.Th>
                                        <Table.Th>Current Stock</Table.Th>
                                        <Table.Th>Minimum Stock</Table.Th>
                                        <Table.Th>Stock Status</Table.Th>
                                        <Table.Th>Expiry Date</Table.Th>
                                        <Table.Th>PPE Status</Table.Th>
                                        <Table.Th>Supplier</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {eppData
                                        .filter(epp => !selectedCategory || epp.category === selectedCategory)
                                        .map((epp) => {
                                            const stockStatus = epp.quantity <= epp.minStockLevel ? 'Stock faible' :
                                                epp.quantity === 0 ? 'Rupture' : 'Normal';
                                            const stockColor = stockStatus === 'Rupture' ? 'red' :
                                                stockStatus === 'Stock faible' ? 'orange' : 'green';

                                            const sixMonthsFromNow = new Date();
                                            sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
                                            const isExpiringSoon = new Date(epp.expiryDate) <= sixMonthsFromNow;

                                            return (
                                                <Table.Tr key={epp.id}>
                                                    <Table.Td>
                                                        <Box>
                                                            <Text size="sm">{epp.name}</Text>
                                                            <Text size="xs" c="dimmed">{epp.brand} {epp.model}</Text>
                                                        </Box>
                                                    </Table.Td>
                                                    <Table.Td>{epp.category}</Table.Td>
                                                    <Table.Td>
                                                        <Text c={stockColor}>{epp.quantity}</Text>
                                                    </Table.Td>
                                                    <Table.Td>{epp.minStockLevel}</Table.Td>
                                                    <Table.Td>
                                                        <Badge color={stockColor} variant="light">
                                                            {stockStatus === 'Stock faible' ? 'Low stock' : stockStatus === 'Rupture' ? 'Out of stock' : 'Normal'}
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text size="sm" c={isExpiringSoon ? 'red' : 'dimmed'}>
                                                            {epp.expiryDate}
                                                        </Text>
                                                        {isExpiringSoon && (
                                                            <Badge color="red" variant="light" size="xs" mt="xs">
                                                                Expiring soon
                                                            </Badge>
                                                        )}
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Badge color={getStatusColor(epp.status)} variant="filled">
                                                            {epp.status.charAt(0).toUpperCase() + epp.status.slice(1).toLowerCase()}
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text size="sm">{epp.supplier}</Text>
                                                    </Table.Td>
                                                </Table.Tr>
                                            );
                                        })}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
                    </Card>
                </Grid.Col>
            </Grid>
        </Box>
    );

    // Render Stock Entry Form
    const renderStockEntryForm = () => (
        <Box>
            <Group justify="space-between" mb="md">
                <Group>
                    <Button variant="light" leftSection={<IconArrowLeft size={16} />} onClick={() => setActiveView('dashboard')}>
                        Back to Dashboard
                    </Button>
                    <Title order={2}>Stock Entry</Title>
                </Group>
            </Group>

            <Grid>
                <Grid.Col span={{ base: 12, lg: 8 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <form onSubmit={stockEntryForm.onSubmit(handleSubmitStockEntry)}>
                            <Grid>
                                <Grid.Col span={12}>
                                    <Select
                                        label="PPE Name"
                                        placeholder="Select PPE to add stock"
                                        data={eppData.map(epp => ({
                                            value: epp.id,
                                            label: `${epp.name} - ${epp.category}`
                                        }))}
                                        value={selectedEPPForStock?.id || ''}
                                        onChange={(value) => {
                                            const selected = eppData.find(epp => epp.id === value);
                                            setSelectedEPPForStock(selected || null);
                                            if (selected) {
                                                stockEntryForm.setValues({
                                                    quantity: undefined,
                                                    unitPrice: undefined,
                                                    supplier: undefined,
                                                    // brand: undefined,
                                                    // model: undefined,
                                                    // size: undefined,
                                                    // expiryDate: null
                                                });
                                            }
                                        }}
                                        required
                                        searchable
                                    />
                                </Grid.Col>

                                <Grid.Col span={12}>
                                    <Title order={4} c="blue" mb="md">New Stock Information</Title>
                                </Grid.Col>

                                <Grid.Col span={6}>
                                    <NumberInput
                                        label="Quantity *"
                                        placeholder="1"
                                        min={1}
                                        required
                                        {...stockEntryForm.getInputProps('quantity')}
                                    />
                                </Grid.Col>

                                <Grid.Col span={6}>
                                    <NumberInput
                                        label="Unit Price (€) *"
                                        placeholder="0"
                                        min={0}
                                        required
                                        {...stockEntryForm.getInputProps('unitPrice')}
                                    />
                                </Grid.Col>

                                <Grid.Col span={12}>
                                    <TextInput
                                        label="Supplier *"
                                        placeholder="Ex: Safety Equipment Ltd"
                                        required
                                        {...stockEntryForm.getInputProps('supplier')}
                                    />
                                </Grid.Col>

                                <Grid.Col span={4}>
                                    <TextInput
                                        label="Brand *"
                                        placeholder="SafeGuard"
                                        required
                                        value={selectedEPPForStock?.brand || ''}
                                    />
                                </Grid.Col>

                                <Grid.Col span={4}>
                                    <TextInput
                                        label="Model *"
                                        placeholder="SG-100"
                                        required
                                        value={selectedEPPForStock?.model || ''}
                                    />
                                </Grid.Col>

                                <Grid.Col span={4}>
                                    <TextInput
                                        label="Size *"
                                        placeholder="Adjustable"
                                        required
                                        value={selectedEPPForStock?.size || ''}
                                    />
                                </Grid.Col>

                                <Grid.Col span={12}>
                                    <DateInput
                                        label="Expiry Date"
                                        placeholder="Select expiry date"
                                    />
                                </Grid.Col>

                                <Grid.Col span={12}>
                                    <Group justify="flex-end" mt="md">
                                        <Button variant="outline" onClick={() => setActiveView('dashboard')}>
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            leftSection={<IconPlus size={16} />}
                                            disabled={!selectedEPPForStock}
                                        >
                                            Add Stock
                                        </Button>
                                    </Group>
                                </Grid.Col>
                            </Grid>
                        </form>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 4 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Title order={4} mb="md">PPE Information</Title>

                        {selectedEPPForStock ? (
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Category:</Text>
                                    <Text size="sm">{selectedEPPForStock.category}</Text>
                                </Group>

                                <Box>
                                    <Text size="sm" c="dimmed" mb="xs">Description:</Text>
                                    <Text size="sm">{selectedEPPForStock.description}</Text>
                                </Box>

                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Minimum Stock:</Text>
                                    <Text size="sm">{selectedEPPForStock.minStockLevel}</Text>
                                </Group>

                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Certification:</Text>
                                    <Text size="sm">{selectedEPPForStock.certificationStandard}</Text>
                                </Group>

                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Current Stock:</Text>
                                    <Badge color="green" variant="filled">
                                        {selectedEPPForStock.quantity} UNITS
                                    </Badge>
                                </Group>

                                {stockEntryForm.values.quantity && (
                                    <Group justify="space-between">
                                        <Text size="sm" c="dimmed">New Total:</Text>
                                        <Badge color="blue" variant="filled">
                                            {selectedEPPForStock.quantity + parseInt(String(stockEntryForm.values.quantity || '0'))} UNITS
                                        </Badge>
                                    </Group>
                                )}
                            </Stack>
                        ) : (
                            <Text size="sm" c="dimmed" ta="center" py="xl">
                                Select a PPE to view information
                            </Text>
                        )}
                    </Card>

                    {/* Low Stock Alert Section */}
                    <Card shadow="sm" padding="lg" radius="md" withBorder mt="md">
                        <Group mb="md">
                            <IconAlertTriangle size={20} color="#FF922B" />
                            <Title order={5} c="orange">Low Stock Alert</Title>
                        </Group>

                        <Stack gap="md">
                            {eppData
                                .filter(epp => epp.quantity <= epp.minStockLevel)
                                .slice(0, 3)
                                .map((epp) => {
                                    const percentage = Math.round((epp.quantity / epp.minStockLevel) * 100);
                                    return (
                                        <Box key={epp.id}>
                                            <Group justify="space-between" mb="xs">
                                                <Text size="sm">{epp.name}</Text>
                                                <Badge color="orange" variant="light" size="xs">
                                                    {percentage}%
                                                </Badge>
                                            </Group>
                                            <Badge variant="light" color="blue" size="xs" mb="xs">
                                                {epp.category.toUpperCase()}
                                            </Badge>
                                            <Text size="xs" c="dimmed">
                                                {epp.quantity} / {epp.minStockLevel} units
                                            </Text>
                                            <Progress value={percentage} color="orange" size="xs" mt="xs" />
                                        </Box>
                                    );
                                })}
                        </Stack>
                    </Card>
                </Grid.Col>
            </Grid>
        </Box>
    );

    // Render requests table
    const renderRequestsTable = () => (
        <Box>
            <Group justify="space-between" mb="md">
                <Group>
                    <Button variant="light" leftSection={<IconArrowLeft size={16} />} onClick={() => setShowRequestsTable(false)}>
                        Back
                    </Button>
                    <Title order={2}>Pending PPE Requests</Title>
                </Group>
            </Group>

            <Card shadow="sm" padding="md" radius="md" withBorder>
                <ScrollArea>
                    <Table striped highlightOnHover withTableBorder>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Request ID</Table.Th>
                                <Table.Th>Employee</Table.Th>
                                <Table.Th>PPE Requested</Table.Th>
                                <Table.Th>Reason</Table.Th>
                                <Table.Th>Priority</Table.Th>
                                <Table.Th>Date</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {eppRequests.map((request) => {
                                const employee = employeesData.find(emp => emp.id === request.employeeId);
                                const requestedEPPs = eppData.filter(epp => request.eppIds.includes(epp.id));

                                return (
                                    <Table.Tr key={request.id}>
                                        <Table.Td>{request.id}</Table.Td>
                                        <Table.Td>
                                            {employee ? `${employee.firstName} ${employee.lastName}` : 'N/A'}
                                        </Table.Td>
                                        <Table.Td>
                                            <Stack gap="xs">
                                                {requestedEPPs.map(epp => (
                                                    <Text key={epp.id} size="xs">{epp.name}</Text>
                                                ))}
                                            </Stack>
                                        </Table.Td>
                                        <Table.Td style={{ maxWidth: '200px' }}>
                                            <Text size="sm" lineClamp={2}>{request.reason}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={getPriorityColor(request.priority)} variant="light">
                                                {request.priority}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>{request.requestDate}</Table.Td>
                                        <Table.Td>
                                            <Badge color={getStatusColor(request.status)} variant="filled">
                                                {request.status.charAt(0).toUpperCase() + request.status.slice(1).toLowerCase()}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            {request.status === 'Pending' && (
                                                <Group gap="xs">
                                                    <ActionIcon
                                                        variant="light"
                                                        color="green"
                                                        onClick={() => handleApproveRequest(request.id)}
                                                    >
                                                        <IconCheck size={16} />
                                                    </ActionIcon>
                                                    <ActionIcon
                                                        variant="light"
                                                        color="red"
                                                        onClick={() => handleRejectRequest(request.id,)}
                                                    >
                                                        <IconX size={16} />
                                                    </ActionIcon>
                                                </Group>
                                            )}
                                            {request.status !== 'Pending' && (
                                                <ActionIcon variant="light" color="blue">
                                                    <IconEye size={16} />
                                                </ActionIcon>
                                            )}
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </ScrollArea>
            </Card>
        </Box>
    );

    // Render employee details
    const renderEmployeeDetails = () => {
        if (!selectedEmployee) return null;

        const assignments = getEmployeeAssignments(selectedEmployee.id);
        const history = getEmployeeHistory(selectedEmployee.id);

        return (
            <Box>
                <Group justify="space-between" mb="md">
                    <Group>
                        <Button variant="light" leftSection={<IconArrowLeft size={16} />} onClick={() => setActiveView('dashboard')}>
                            Back
                        </Button>
                        <Title order={2}>{selectedEmployee.firstName} {selectedEmployee.lastName}</Title>
                    </Group>
                </Group>

                <Tabs defaultValue="assignments">
                    <Tabs.List>
                        <Tabs.Tab value="assignments" leftSection={<IconPackage size={16} />}>
                            PPE Assigned
                        </Tabs.Tab>
                        <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
                            History
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="assignments" pt="md">
                        <Grid>
                            <Grid.Col span={{ base: 12, lg: 8 }}>
                                <Card shadow="sm" padding="lg" radius="md" withBorder>
                                    <Title order={3} mb="md">Currently Assigned PPE</Title>
                                    <Table striped withTableBorder>
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th>EPP</Table.Th>
                                                <Table.Th>Catégorie</Table.Th>
                                                <Table.Th>Date Attribution</Table.Th>
                                                <Table.Th>État</Table.Th>
                                                <Table.Th>Statut</Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {assignments.map((assignment) => (
                                                <Table.Tr key={assignment.id}>
                                                    <Table.Td>
                                                        <Box>
                                                            <Text size="sm">{assignment.epp?.name}</Text>
                                                            <Text size="xs" c="dimmed">{assignment.epp?.brand} {assignment.epp?.model}</Text>
                                                        </Box>
                                                    </Table.Td>
                                                    <Table.Td>{assignment.epp?.category}</Table.Td>
                                                    <Table.Td>{assignment.assignedDate}</Table.Td>
                                                    <Table.Td>
                                                        <Badge color={assignment.condition === 'New' ? 'green' : assignment.condition === 'Good' ? 'blue' : 'orange'} variant="light">
                                                            {assignment.condition}
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Badge color={getStatusColor(assignment.status)} variant="filled">
                                                            {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1).toLowerCase()}
                                                        </Badge>
                                                    </Table.Td>
                                                </Table.Tr>
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                </Card>
                            </Grid.Col>

                            <Grid.Col span={{ base: 12, lg: 4 }}>
                                <Card shadow="sm" padding="lg" radius="md" withBorder>
                                    <Title order={4} mb="md">Informations Employé</Title>
                                    <Stack gap="sm">
                                        <Group justify="space-between">
                                            <Text size="sm" c="dimmed">Numéro:</Text>
                                            <Text size="sm">{selectedEmployee.employeeNumber}</Text>
                                        </Group>
                                        <Group justify="space-between">
                                            <Text size="sm" c="dimmed">Département:</Text>
                                            <Text size="sm">{selectedEmployee.department}</Text>
                                        </Group>
                                        <Group justify="space-between">
                                            <Text size="sm" c="dimmed">Poste:</Text>
                                            <Text size="sm">{selectedEmployee.position}</Text>
                                        </Group>
                                        <Group justify="space-between">
                                            <Text size="sm" c="dimmed">Date d'embauche:</Text>
                                            <Text size="sm">{selectedEmployee.hireDate}</Text>
                                        </Group>
                                        <Group justify="space-between">
                                            <Text size="sm" c="dimmed">Email:</Text>
                                            <Text size="sm">{selectedEmployee.email}</Text>
                                        </Group>
                                        <Group justify="space-between">
                                            <Text size="sm" c="dimmed">Téléphone:</Text>
                                            <Text size="sm">{selectedEmployee.phone}</Text>
                                        </Group>
                                    </Stack>
                                </Card>
                            </Grid.Col>
                        </Grid>
                    </Tabs.Panel>

                    <Tabs.Panel value="history" pt="md">
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Title order={3} mb="md">PPE History</Title>
                            <Timeline>
                                {history.map((historyItem) => (
                                    <Timeline.Item
                                        key={historyItem.id}
                                        title={historyItem.action}
                                        color={getActionColor(historyItem.action)}
                                    >
                                        <Card withBorder p="md" mb="md">
                                            <Group justify="space-between" mb="xs">
                                                <Text size="sm">{historyItem.epp?.name}</Text>
                                                <Badge color={getActionColor(historyItem.action)} variant="light" size="sm">
                                                    {historyItem.action}
                                                </Badge>
                                            </Group>

                                            <Text size="xs" c="dimmed" mb="xs">
                                                {historyItem.epp?.category} - {historyItem.epp?.brand} {historyItem.epp?.model}
                                            </Text>

                                            <Group justify="space-between" mb="xs">
                                                <Text size="xs" c="dimmed">Date:</Text>
                                                <Text size="xs">{historyItem.date}</Text>
                                            </Group>
                                        </Card>
                                    </Timeline.Item>
                                ))}
                            </Timeline>
                        </Card>
                    </Tabs.Panel>
                </Tabs>
            </Box>
        );
    };

    return (
        <Box p="xl">

            {activeView === 'dashboard' && renderDashboard()}
            {activeView === 'create-epp' && renderCreateEPPForm()}
            {activeView === 'stock-entry' && renderStockEntryForm()}
            {activeView === 'employee-details' && renderEmployeeDetails()}
            {showRequestsTable && renderRequestsTable()}

            {/* Old Add EPP Modal - keeping for reference but hidden */}
            <Modal opened={showEPPForm} onClose={() => setShowEPPForm(false)} title="Ajouter un nouvel EPP" size="lg" style={{ display: 'none' }}>
                <form onSubmit={eppForm.onSubmit(handleSubmitEPP)}>
                    <Grid>
                        <Grid.Col span={12}>
                            <TextInput
                                label="Nom de l'EPP"
                                placeholder="Ex: Casque de sécurité"
                                required
                                {...eppForm.getInputProps('name')}
                            />
                        </Grid.Col>

                        <Grid.Col span={6}>
                            <Select
                                label="Catégorie"
                                placeholder="Sélectionner une catégorie"
                                data={[
                                    'Protection de la tête',
                                    'Protection des yeux',
                                    'Protection des mains',
                                    'Protection des pieds',
                                    'Protection respiratoire',
                                    'Vêtements de protection',
                                    'Protection auditive',
                                    'Protection contre les chutes'
                                ]}
                                required
                                {...eppForm.getInputProps('category')}
                            />
                        </Grid.Col>

                        <Grid.Col span={12}>
                            <Textarea
                                label="Description"
                                placeholder="Description détaillée de l'EPP..."
                                rows={3}
                                {...eppForm.getInputProps('description')}
                            />
                        </Grid.Col>

                        <Grid.Col span={12}>
                            <Group justify="flex-end" mt="md">
                                <Button variant="outline" onClick={() => setShowEPPForm(false)}>
                                    Annuler
                                </Button>
                                <Button type="submit" leftSection={<IconDeviceFloppy size={16} />}>
                                    Enregistrer
                                </Button>
                            </Group>
                        </Grid.Col>
                    </Grid>
                </form>
            </Modal>

            {/* Request Modal */}
            <Modal opened={showRequestForm} onClose={() => setShowRequestForm(false)} title="Nouvelle Demande EPP" size="lg">
                <form onSubmit={requestForm.onSubmit(handleSubmitRequest)}>
                    <Stack>
                        <Select
                            label="Employés *"
                            placeholder="Sélectionner des employés"
                            data={employeesData.map(emp => ({
                                value: emp.id,
                                label: `${emp.firstName} ${emp.lastName} - ${emp.department}`
                            }))}
                            required
                            multiple
                            searchable
                            {...requestForm.getInputProps('employeeIds')}
                        />

                        <Select
                            label="EPP Demandés *"
                            placeholder="Sélectionner des EPP"
                            data={eppData.map(epp => ({
                                value: epp.id,
                                label: `${epp.name} - ${epp.category} (Stock: ${epp.quantity})`
                            }))}
                            required
                            multiple
                            searchable
                            {...requestForm.getInputProps('eppIds')}
                        />

                        <DateInput
                            label="Date Souhaitée"
                            placeholder="Quand avez-vous besoin de ces EPP ?"
                            {...requestForm.getInputProps('requestedDate')}
                        />

                        <Select
                            label="Priorité"
                            placeholder="Sélectionner la priorité"
                            data={['Low', 'Medium', 'High']}
                            required
                            {...requestForm.getInputProps('priority')}
                        />

                        <Textarea
                            label="Raison de la demande"
                            placeholder="Expliquez pourquoi ces EPP sont nécessaires..."
                            rows={3}
                            required
                            {...requestForm.getInputProps('reason')}
                        />

                        <Group justify="flex-end" mt="md">
                            <Button variant="outline" onClick={() => setShowRequestForm(false)}>
                                Annuler
                            </Button>
                            <Button type="submit" leftSection={<IconClipboardList size={16} />}>
                                Soumettre Demande
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </Box>
    );
};

export default PpeManagement;
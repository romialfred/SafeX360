import { ActionIcon, Badge, Box, Breadcrumbs, Button, Card, Grid, Group, Select, Text, Title, Tooltip } from "@mantine/core";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getEmployeesWithPosition } from "../../services/HrmsService";
import { mapIdToName } from "../../utility/OtherUtilities";
import { getAllAssignmentCounts } from "../../services/PpeEmpService";
import { getAllPPE } from "../../services/PPEService";
import { IconEye, IconPackage, IconPlus } from "@tabler/icons-react";

const PPEMonitoring = () => {
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
            console.log(data)
        }).catch((err) => {
            console.error(err);
        });
    }, [])
    const employeesTableData = useMemo(() => {
        return ppeEmp.map((emp) => ({
            ...emp,
            name: empMap[emp?.empId]?.name ?? '-',
            department: empMap[emp?.empId]?.department ?? 'Unknown',
            position: empMap[emp?.empId]?.position ?? '-',
        }));
    }, [ppeEmp, empMap]);

    const departments = useMemo(() => {
        return [...new Set(employeesTableData.map(emp => emp.department || 'Unknown'))];
    }, [employeesTableData]);

    const categories = useMemo(() => {
        return [...new Set(ppe.map(epp => epp.category))];
    }, [ppe]);

    const filteredEmployees = useMemo(() => {
        return employeesTableData.filter(emp => !selectedDepartment || emp.department === selectedDepartment);
    }, [employeesTableData, selectedDepartment]);
    const tableData = ppe.filter((x) => !selectedCategory || selectedCategory == x.category).map((epp) => {
        const stockStatus =
            epp.stock === 0
                ? "Out of stock"
                : epp.stock <= epp.minStock
                    ? "Low stock"
                    : "Normal";

        const stockColor =
            stockStatus === "Out of stock"
                ? "red"
                : stockStatus === "Low stock"
                    ? "orange"
                    : "green";


        return {
            ...epp,
            stockStatus,
            stockColor
        };
    });

    const actionBodyTemplate = (rowData: any) => {

        return (
            <div className="flex gap-3">
                <Tooltip label="View Details ">
                    <ActionIcon
                        onClick={() => navigate(`details/${rowData.empId}`)}
                        color="yellow"
                        size="sm"
                    >
                        <IconEye className="!w-4/5 !h-4/5" stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
            </div>
        );
    };

    // Derived columns are precomputed in employeesTableData via useMemo
    return (
        <div className="p-5">
            <div className="flex items-center justify-between">

                <div>
                    <div className="font-semibold text-2xl text-blue-500 w-fit">PPE Monitoring</div>
                    <Breadcrumbs mt="xs" >
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient">Home</Text>
                        </Link>

                        <Text variant="gradient">PPE Monitoring</Text>
                    </Breadcrumbs>
                </div>

                <div className="flex gap-5">

                    <Button leftSection={<IconPlus size={16} />} onClick={() => navigate('/ppe-management/create-ppe')} color="blue">
                        Create new PPE
                    </Button>
                    <Button leftSection={<IconPackage size={16} />} onClick={() => navigate('/ppe-management/stock-form')} color="teal">
                        Stock entry
                    </Button>
                </div>
            </div>

            <p className=' italic my-3'>Track PPE usage, inspections, and compliance to ensure worker safety</p>
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
                        <DataTable value={filteredEmployees} stripedRows tableStyle={{ minWidth: '50rem' }} dataKey="empId">
                            <Column field="name" header="Employee" />
                            <Column field="department" header="Department" />
                            <Column field="position" header="Position" />
                            <Column header="PPE Assigned" body={(row) =>
                                <Badge color="blue" variant="light">{row.count} PPE</Badge>
                            } />
                            <Column
                                style={{ fontWeight: 'normal', fontSize: '14px' }}
                                headerStyle={{ width: '5rem', textAlign: 'center' }}
                                bodyStyle={{ textAlign: 'center', overflow: 'visible' }}
                                header="Actions"
                                body={actionBodyTemplate}
                            />
                        </DataTable>
                    </Card>
                </Grid.Col>
            </Grid>
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
                        <DataTable value={tableData} stripedRows tableStyle={{ minWidth: '70rem' }}>
                            <Column field="name" header="PPE" body={(row) =>
                                <Box>
                                    <Text size="sm" fw={500}>{row.name}</Text>
                                    {/* <Text size="xs" c="dimmed">{row.brand} {row.model}</Text> */}
                                </Box>
                            } />
                            <Column field="category" header="Category" />
                            <Column align="center" header="Current Stock" body={(row) =>
                                <Text fw={500} c={row.stockColor}>{row.stock}</Text>
                            } />
                            <Column align="center" field="minStock" header="Minimum Stock" />
                            <Column align="center" header="Stock Status" body={(row) =>
                                <Badge color={row.stockColor} variant="light">{row.stockStatus}</Badge>
                            } />
                            {/* <Column align="center" header="Expiry Date" body={(row) =>
                                        <Box>
                                            <Text size="sm" c={row.isExpiringSoon ? 'red' : 'dimmed'}>
                                                {row.expiryDate}
                                            </Text>
                                            {row.isExpiringSoon && (
                                                <Badge color="red" variant="light" size="xs" mt="xs">
                                                    Expiring soon
                                                </Badge>
                                            )}
                                        </Box>
                                    } /> */}
                            <Column header="PPE Status" body={(row) =>
                                <Badge color={row.status === 'ACTIVE' ? 'green' : 'gray'} variant="filled">
                                    {row.status}
                                </Badge>
                            } />
                            {/* <Column field="supplier" header="Supplier" /> */}
                        </DataTable>
                    </Card>
                </Grid.Col>
            </Grid>
        </div>
    )
}

export default PPEMonitoring

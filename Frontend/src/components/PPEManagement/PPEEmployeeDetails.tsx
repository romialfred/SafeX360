import {
    Box, Title, Grid, Card, Text, Group, Badge, Tabs, Stack, Button
} from '@mantine/core';
import { IconArrowLeft, IconPackage, IconHistory } from '@tabler/icons-react';
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import { getEmployee } from '../../services/EmployeeService';
import { getPpeByEmp } from '../../services/PpeEmpService';
import { getAllPPE } from '../../services/PPEService';
import { mapIdToName } from '../../utility/OtherUtilities';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const PPEEmployeeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [emp, setEmp] = useState<any>({});
    const [ppeMap, setPpeMap] = useState<Record<string, any>>({});

    useEffect(() => {
        getEmployee(id).then(data => {
            setEmp(data);
        }).catch(err => {
            console.error('Error fetching employee data:', err);
        });

        getPpeByEmp(Number(id)).then(data => {
            setAssignments(data);
        }).catch(err => {
            console.error('Error fetching PPE data:', err);
        });

        getAllPPE().then(data => {
            setPpeMap(mapIdToName(data));
        }).catch(err => {
            console.error('Error fetching all PPE data:', err);
        });

    }, [id]);




    // const history: EPPHistory[] = eppHistory.filter(h => h.employeeId === id);


    return (
        <Box>
            <Group justify="space-between" mb="md">
                <Group>
                    <Button
                        variant="light"
                        leftSection={<IconArrowLeft size={16} />}
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </Button>
                    <Title order={2}>{emp?.name}</Title>
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
                                {/* <Stack>
                                    {assignments.map((assignment) => {
                                        const epp = ppeMap[assignment.ppeId];
                                        return (
                                            <Card key={assignment.id} shadow="xs" padding="md" radius="md" withBorder>
                                                <Group justify="space-between">
                                                    <Text size="sm" fw={500}>{epp?.name}</Text>
                                                    <Badge color="blue" variant="light">{assignment.status}</Badge>
                                                </Group>
                                                <Text size="xs" c="dimmed">{epp?.category} </Text>
                                                <Text size="xs" c="dimmed">Assigned: {assignment.date}</Text>
                                            </Card>
                                        );
                                    })}
                                </Stack> */}
                                <DataTable
                                    value={assignments.filter((x: any) => x.status === 'ACTIVE')}
                                    // paginator
                                    rows={5}
                                    stripedRows
                                    responsiveLayout="scroll"
                                    emptyMessage="No PPE assigned yet"
                                >
                                    {/* PPE Name */}
                                    <Column
                                        header="PPE Name"
                                        body={(rowData) => ppeMap[rowData.ppeId]?.name || "N/A"}

                                    />

                                    {/* Category */}
                                    <Column
                                        header="Category"
                                        body={(rowData) => ppeMap[rowData.ppeId]?.category || "N/A"}

                                    />

                                    {/* Status */}
                                    <Column
                                        header="Status"
                                        body={(rowData) => (
                                            <Badge
                                                variant='light'
                                                color={rowData.status === "ACTIVE" ? "green" : rowData.status == "INACTIVE" ? "red" : "orange"}
                                            >{rowData.status}</Badge>
                                        )}
                                    />

                                    {/* Assigned Date */}
                                    <Column field="date" header="Assigned Date" />
                                </DataTable>
                            </Card>

                        </Grid.Col>
                        <Grid.Col span={{ base: 12, lg: 4 }}>
                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Title order={4} mb="md">Employee Info</Title>
                                <Stack gap="sm">
                                    {/* <Group justify="space-between">
                                        <Text size="sm" c="dimmed">Number:</Text>
                                        <Text size="sm" fw={500}>{emp?.employeeNumber}</Text>
                                    </Group> */}
                                    <Group justify="space-between">
                                        <Text size="sm" c="dimmed">Department:</Text>
                                        <Text size="sm" fw={500}>{emp?.department}</Text>
                                    </Group>
                                    <Group justify="space-between">
                                        <Text size="sm" c="dimmed">Position:</Text>
                                        <Text size="sm" fw={500}>{emp?.position}</Text>
                                    </Group>
                                    {/* <Group justify="space-between">
                                        <Text size="sm" c="dimmed">Hire Date:</Text>
                                        <Text size="sm" fw={500}>{employee?.hireDate}</Text>
                                    </Group> */}
                                    <Group justify="space-between">
                                        <Text size="sm" c="dimmed">Email:</Text>
                                        <Text size="sm" fw={500}>{emp?.email}</Text>
                                    </Group>
                                    {/* <Group justify="space-between">
                                        <Text size="sm" c="dimmed">Phone:</Text>
                                        <Text size="sm" fw={500}>{emp?.phone}</Text>
                                    </Group> */}
                                </Stack>
                            </Card>
                        </Grid.Col>
                    </Grid>
                </Tabs.Panel>

                <Tabs.Panel value="history" pt="md">
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Title order={3} mb="md">PPE History</Title>
                        <DataTable
                            value={assignments}
                            // paginator
                            rows={5}
                            stripedRows
                            responsiveLayout="scroll"
                            emptyMessage="No PPE assigned yet"
                        >
                            {/* PPE Name */}
                            <Column
                                header="PPE Name"
                                body={(rowData) => ppeMap[rowData.ppeId]?.name || "N/A"}

                            />

                            {/* Category */}
                            <Column
                                header="Category"
                                body={(rowData) => ppeMap[rowData.ppeId]?.category || "N/A"}

                            />

                            {/* Status */}
                            <Column
                                header="Status"
                                body={(rowData) => (
                                    <Badge
                                        variant='light'
                                        color={rowData.status === "ACTIVE" ? "green" : rowData.status == "INACTIVE" ? "red" : "orange"}
                                    >{rowData.status}</Badge>
                                )}
                            />

                            {/* Assigned Date */}
                            <Column field="date" header="Assigned Date" />
                        </DataTable>
                    </Card>
                </Tabs.Panel>
            </Tabs>
        </Box>
    );
};

export default PPEEmployeeDetails;

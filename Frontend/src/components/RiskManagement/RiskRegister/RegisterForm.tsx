import {
    Box,
    Breadcrumbs,
    Button,
    Card,
    Grid,
    Group,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput,
    Title,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { IconPlus } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { createRisk } from "../../../services/RiskRegisterService";
import { getAllDepartments } from "../../../services/HrmsService";
import { GetAllWorkProcess } from "../../../services/WorkProcessService";
import { getEmployeeDropdown } from "../../../services/EmployeeService";

const RegisterForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [departments, setDepartments] = useState<any[]>([]);
    const [workProcesses, setWorkProcesses] = useState<any[]>([]);
    const [emps, setEmps] = useState<any[]>([]);


    const form = useForm({
        initialValues: {
            title: '',
            description: '',
            departmentId: '',
            workProcessId: '',
            hazardSource: '',
            potentialConsequences: '',
            ownerId: '',
            status: 'OPEN',
            reviewDate: null
        },
    });

    useEffect(() => {
        fetchDepartments();
        fetchWorkProcesses();
        fetchEmployees();
    }, [])

    useEffect(() => {
        const hazard = (form.values.hazardSource || '').trim();
        const description = (form.values.description || '').trim();
        const derivedTitle = hazard || description ? (hazard || description).slice(0, 120) : '';
        if (derivedTitle !== form.values.title) {
            form.setFieldValue('title', derivedTitle);
        }
    }, [form.values.hazardSource, form.values.description]);

    const fetchDepartments = () => {
        // Fetch departments from API or service
        getAllDepartments().then((data) => {
            setDepartments(data.map((department: any) => ({ value: "" + department.id, label: department.name })));
        }).catch((error) => {
            errorNotification(error.response?.data?.errorMessage || "Failed to fetch departments");
        });
    };
    const fetchWorkProcesses = () => {
        // Fetch work processes from API or service
        GetAllWorkProcess({}).then((data) => {

            setWorkProcesses(data.map((workProcess: any) => ({ value: "" + workProcess.id, label: workProcess.name })));
        }).catch((error) => {
            errorNotification(error.response?.data?.errorMessage || "Failed to fetch work processes");
        });
    };
    const fetchEmployees = () => {
        // Fetch employees from API or service
        getEmployeeDropdown().then((data) => {
            setEmps(data);
        }).catch((error) => {
            errorNotification(error.response?.data?.errorMessage || "Failed to fetch employees");
        });
    };


    const handleSubmit = () => {
        dispatch(showOverlay());
        createRisk(form.values).then((_res) => {
            successNotification("Requirement created successfully");
            navigate("/risks-register");

        }).catch((err) => {
            errorNotification(err.response?.data?.errorMessage || "Something went wrong");
        }
        ).finally(() => {
            dispatch(hideOverlay());
        }
        );
    }


    return (

        <div>
            <div>
                <div className="font-semibold text-2xl text-blue-500 w-fit">New Risk Identification</div>
                <Breadcrumbs mt="xs" mb="lg">
                    <Link className="hover:!underline" to="/">
                        <Text variant="gradient">Home</Text>
                    </Link>
                    <Link className="hover:!underline" to="/risks-register">
                        <Text variant="gradient">Risk Catalog & Tracking</Text>
                    </Link>
                    <Text variant="gradient">New Risk Identification</Text>
                </Breadcrumbs>
            </div>


            <Grid>
                <Grid.Col span={{ base: 12, lg: 8 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <form onSubmit={form.onSubmit(handleSubmit)}>
                            <Stack gap="md">


                                {/* Risk Identification Section */}
                                <Title order={3}>Risk Identification</Title>

                                <Textarea
                                    label="Risk Description"
                                    placeholder="Describe the identified risk..."
                                    required
                                    rows={3}
                                    {...form.getInputProps('description')}
                                />

                                <Grid>
                                    <Grid.Col span={6}>
                                        <Select
                                            label="Department"
                                            placeholder="Select department"
                                            data={departments}
                                            required
                                            {...form.getInputProps('departmentId')}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Select
                                            label="Work Process"
                                            placeholder="Select work process"
                                            data={workProcesses}
                                            required
                                            {...form.getInputProps('workProcessId')}
                                        />
                                    </Grid.Col>
                                </Grid>
                                <TextInput
                                    label="Hazard Source"
                                    placeholder="Identify the source of the hazard"
                                    required
                                    {...form.getInputProps('hazardSource')}
                                />
                                <Textarea
                                    label="Potential Consequences"
                                    placeholder="Describe what could happen if this risk materializes..."
                                    required
                                    rows={2}
                                    {...form.getInputProps('potentialConsequences')}
                                />
                                <Grid>
                                    <Grid.Col span={6}>
                                        <Select
                                            label="Risk Owner"
                                            placeholder="Who is responsible for this risk?"
                                            data={emps.map(emp => ({ value: "" + emp.id, label: emp.name }))}
                                            required
                                            {...form.getInputProps('ownerId')}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <DateInput
                                            label="Review Date"
                                            placeholder="When should this risk be reviewed?"
                                            minDate={new Date()}
                                            {...form.getInputProps('reviewDate')}
                                        />
                                    </Grid.Col>
                                </Grid>

                                <Group justify="flex-end" mt="xl">
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate("/risks-register")}
                                        size="md"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        leftSection={<IconPlus size={16} />}
                                        color="green"
                                        size="md"
                                    >
                                        Save Risk Identification
                                    </Button>
                                </Group>
                            </Stack>
                        </form>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 4 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
                        <Title order={4} mb="md" c="blue">Risk Identification Guide</Title>

                        <Box p="md" mb="md" style={{ backgroundColor: '#e7f5ff', borderRadius: '8px', border: '1px solid #339af0' }}>
                            <Text fw={600} size="sm" mb="xs" c="blue">Document the Scenario</Text>
                            <Text size="xs" c="dimmed">
                                • Use the description to explain what is happening or could happen.<br />
                                • Include triggering conditions, locations, or equipment involved.<br />
                                • Mention any existing preventive measures already in place.
                            </Text>
                        </Box>

                        <Box p="md" mb="md" style={{ backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
                            <Text fw={600} size="sm" mb="xs" c="orange">Department & Process Context</Text>
                            <Text size="xs" c="dimmed">
                                • Select the department accountable for monitoring the risk.<br />
                                • Choose the work process where the hazard originates.<br />
                                • Accurate selections improve reporting and escalation paths.
                            </Text>
                        </Box>

                        <Box p="md" mb="md" style={{ backgroundColor: '#f8d7da', borderRadius: '8px', border: '1px solid #f5c6cb' }}>
                            <Text fw={600} size="sm" mb="xs" c="red">Hazard & Consequence Tips</Text>
                            <Text size="xs" c="dimmed">
                                • Hazard source: identify the condition, task, or substance causing concern.<br />
                                • Potential consequences: focus on credible outcomes (injury, downtime, environmental impact).<br />
                                • Keep statements concise so they can be reused in assessments.
                            </Text>
                        </Box>

                        <Box p="md" style={{ backgroundColor: '#d1ecf1', borderRadius: '8px', border: '1px solid #bee5eb' }}>
                            <Text fw={600} size="sm" mb="xs" c="teal">Assign Ownership & Reviews</Text>
                            <Text size="xs" c="dimmed">
                                • Nominate an owner empowered to coordinate mitigations.<br />
                                • Set a review date aligned with inspections or audits.<br />
                                • Review earlier if major process or personnel changes occur.
                            </Text>
                        </Box>
                    </Card>
                </Grid.Col>
            </Grid>
        </div>

    )
}

export default RegisterForm

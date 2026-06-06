import { Box, Breadcrumbs, Button, Card, Grid, Group, Select, Stack, Text, Textarea, TextInput, Title } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { toLocalDate } from "../../../utility/dateConversion";
import { getAllDepartments } from "../../../services/HrmsService";
import { GetAllWorkProcess } from "../../../services/WorkProcessService";
import { getEmployeeDropdown } from "../../../services/EmployeeService";
import { getRiskById, updateRisk } from "../../../services/RiskRegisterService";

const EditRegisterForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const [departments, setDepartments] = useState<any[]>([]);
  const [workProcesses, setWorkProcesses] = useState<any[]>([]);
  const [emps, setEmps] = useState<any[]>([]);

  const form = useForm({
    initialValues: {
      id: '',
      title: '',
      description: '',
      departmentId: '',
      workProcessId: '',
      hazardSource: '',
      potentialConsequences: '',
      ownerId: '',
      status: 'OPEN',
      reviewDate: null as any,
    },
  });

  useEffect(() => {
    fetchDepartments();
    fetchWorkProcesses();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!id) return;
    getRiskById(id)
      .then((res) => {
        form.setValues({
          id: res.id,
          title: res.title || '',
          description: res.description || '',
          departmentId: res.departmentId ? String(res.departmentId) : '',
          workProcessId: res.workProcessId ? String(res.workProcessId) : '',
          hazardSource: res.hazardSource || '',
          potentialConsequences: res.potentialConsequences || '',
          ownerId: res.ownerId ? String(res.ownerId) : '',
          status: res.status || 'OPEN',
          reviewDate: res.reviewDate ? new Date(res.reviewDate) : null,
        });
      })
      .catch((error) => {
        errorNotification(error.response?.data?.errorMessage || 'Failed to load risk');
        navigate('/risks-register');
      });
  }, [id]);

  const fetchDepartments = () => {
    getAllDepartments()
      .then((data) => setDepartments(data.map((d: any) => ({ value: String(d.id), label: d.name }))))
      .catch((error) => errorNotification(error.response?.data?.errorMessage || 'Failed to fetch departments'));
  };
  const fetchWorkProcesses = () => {
    GetAllWorkProcess({})
      .then((data) => setWorkProcesses(data.map((wp: any) => ({ value: String(wp.id), label: wp.name }))))
      .catch((error) => errorNotification(error.response?.data?.errorMessage || 'Failed to fetch work processes'));
  };
  const fetchEmployees = () => {
    getEmployeeDropdown()
      .then((data) => setEmps(data))
      .catch((error) => errorNotification(error.response?.data?.errorMessage || 'Failed to fetch employees'));
  };

  useEffect(() => {
    const hazard = (form.values.hazardSource || '').trim();
    const description = (form.values.description || '').trim();
    const derivedTitle = hazard || description ? (hazard || description).slice(0, 120) : '';
    if (derivedTitle !== form.values.title) {
      form.setFieldValue('title', derivedTitle);
    }
  }, [form.values.hazardSource, form.values.description]);

  const handleSubmit = () => {
    dispatch(showOverlay());
    const payload = {
      ...form.values,
      id: form.values.id || id,
      departmentId: form.values.departmentId ? Number(form.values.departmentId) : null,
      workProcessId: form.values.workProcessId ? Number(form.values.workProcessId) : null,
      ownerId: form.values.ownerId ? Number(form.values.ownerId) : null,
      reviewDate: toLocalDate(form.values.reviewDate),
    };
    updateRisk(payload)
      .then((_res) => {
        successNotification('Risk updated successfully');
        navigate('/risks-register');
      })
      .catch((err) => {
        errorNotification(err.response?.data?.errorMessage || 'Something went wrong');
      })
      .finally(() => dispatch(hideOverlay()));
  };

  return (
    <div>
      <div>
        <div className="text-2xl text-blue-500 w-fit">Edit Risk Identification</div>
        <Breadcrumbs mt="xs" mb="lg">
          <Link className="hover:!underline" to="/">
            <Text variant="gradient">Home</Text>
          </Link>
          <Link className="hover:!underline" to="/risks-register">
            <Text variant="gradient">Risk Catalog & Tracking</Text>
          </Link>
          <Text variant="gradient">Edit Risk</Text>
        </Breadcrumbs>
      </div>

      <Grid>
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
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
                    <Select label="Department" placeholder="Select department" data={departments} required {...form.getInputProps('departmentId')} />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Select label="Work Process" placeholder="Select process" data={workProcesses} required {...form.getInputProps('workProcessId')} />
                  </Grid.Col>
                </Grid>

                <TextInput label="Hazard Source" placeholder="Identify the source of the hazard" required {...form.getInputProps('hazardSource')} />

                <Textarea label="Potential Consequences" placeholder="Describe what could happen if this risk materializes..." required rows={2} {...form.getInputProps('potentialConsequences')} />

                <Grid>
                  <Grid.Col span={6}>
                    <Select label="Risk Owner" placeholder="Who is responsible for this risk?" data={emps.map(emp => ({ value: String(emp.id), label: emp.name }))} required {...form.getInputProps('ownerId')} />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <DateInput label="Review Date" placeholder="When should this risk be reviewed?" minDate={new Date()} {...form.getInputProps('reviewDate')} />
                  </Grid.Col>
                </Grid>

                <Group justify="flex-end" mt="xl">
                  <Button variant="outline" onClick={() => navigate('/risks-register')} size="md">Cancel</Button>
                  <Button type="submit" leftSection={<IconDeviceFloppy size={16} />} color="green" size="md">Update Risk</Button>
                </Group>
              </Stack>
            </form>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
            <Title order={4} mb="md" c="blue">Risk Identification Guide</Title>

            <Box p="md" mb="md" style={{ backgroundColor: '#e7f5ff', borderRadius: '8px', border: '1px solid #339af0' }}>
              <Text size="sm" mb="xs" c="blue">Document the Scenario</Text>
              <Text size="xs" c="dimmed">
                • Use the description to explain what is happening or could happen.<br />
                • Include triggering conditions, locations, or equipment involved.<br />
                • Mention any existing preventive measures already in place.
              </Text>
            </Box>

            <Box p="md" mb="md" style={{ backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
              <Text size="sm" mb="xs" c="orange">Department & Process Context</Text>
              <Text size="xs" c="dimmed">
                • Select the department accountable for monitoring the risk.<br />
                • Choose the work process where the hazard originates.<br />
                • Accurate selections improve reporting and escalation paths.
              </Text>
            </Box>

            <Box p="md" mb="md" style={{ backgroundColor: '#f8d7da', borderRadius: '8px', border: '1px solid #f5c6cb' }}>
              <Text size="sm" mb="xs" c="red">Hazard & Consequence Tips</Text>
              <Text size="xs" c="dimmed">
                • Hazard source: identify the condition, task, or substance causing concern.<br />
                • Potential consequences: focus on credible outcomes (injury, downtime, environmental impact).<br />
                • Keep statements concise so they can be reused in assessments.
              </Text>
            </Box>

            <Box p="md" style={{ backgroundColor: '#d1ecf1', borderRadius: '8px', border: '1px solid #bee5eb' }}>
              <Text size="sm" mb="xs" c="teal">Assign Ownership & Reviews</Text>
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
  );
};

export default EditRegisterForm;

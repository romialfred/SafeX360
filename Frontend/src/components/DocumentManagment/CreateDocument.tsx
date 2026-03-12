import {
    Badge,
    Box,
    Breadcrumbs,
    Button,
    Card,
    FileInput,
    Grid,
    Group,
    MultiSelect,
    Select,
    Stack,
    Switch,
    Text,
    Textarea,
    TextInput,
    Title,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { IconPlus, IconUpload } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { documentCategories, accessLevels, documentStatuses, documentStatusesMap } from '../../Data/dummyData/documentData';
import { Link, useNavigate } from "react-router-dom";
import { getEmployeeDropdown } from "../../services/EmployeeService";
import { getAllDepartments } from "../../services/HrmsService";
import { convertFileToBase64DTO } from "../../utility/DocumentUtility";
import { createDocument, getLatestDocuments } from "../../services/DocumentService";
import { errorNotification, successNotification } from "../../utility/NotificationUtility";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../slices/OverlaySlice";
import { formatDateShort } from "../../utility/DateFormats";


const CreateDocument = () => {
    const [_showNewDocumentForm, setShowNewDocumentForm] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [docs, setDocs] = useState<any[]>([]);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const newDocumentForm = useForm({
        initialValues: {
            documentName: '',
            description: '',
            category: '',
            ownerId: '',
            departmentId: '',
            tags: [],
            accessLevel: 'INTERNAL',
            status: 'DRAFT',
            allowDownload: true,
            reviewDate: null,
            expiryDate: null,
            file: null
        }
    });

    useEffect(() => {
        getEmployeeDropdown().then((res) => {
            setEmployees(res);
        }).catch((_err) => {
        });

        getAllDepartments().then((res) => {
            setDepartments(res);
        }).catch((_err) => {
        });
        getLatestDocuments().then((res) => {
            setDocs(res);
        });
    }, [])


    const handleNewDocument = async (values: any) => {
        const media = await convertFileToBase64DTO(values.file);

        dispatch(showOverlay());
        createDocument({
            ...values,
            media: media
        }).then((_res) => {
            successNotification("Document Added Successfully.");
            navigate("/document-management");
        }).catch((err) => {
            errorNotification(err.response?.data?.errorMessage || "Failed to create document");
        }).finally(() => {
            dispatch(hideOverlay());
        })
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'gray';
            case 'UNDER_REVIEW': return 'yellow';
            case 'APPROVED': return 'green';
            case 'ARCHIVED': return 'red';
            default: return 'gray';
        }
    };
    const getAccessLevelColor = (level: string) => {
        switch (level) {
            case 'PUBLIC': return 'green';
            case 'INTERNAL': return 'blue';
            case 'CONFIDENTIAL': return 'orange';
            case 'RESTRICTED': return 'red';
            default: return 'gray';
        }
    };
    return (
        <div >
            <div>
                <div className="font-semibold text-2xl text-blue-500 w-fit">Create New Document</div>
                <Breadcrumbs mt="xs" mb="lg">
                    <Link className="hover:!underline" to="/">
                        <Text variant="gradient">Home</Text>
                    </Link>
                    <Link className="hover:!underline" to="/document-management">
                        <Text variant="gradient">Document Management</Text>
                    </Link>
                    <Text variant="gradient">Create New Document</Text>
                </Breadcrumbs>
            </div>


            <Grid>
                <Grid.Col span={{ base: 12, lg: 8 }}>
                    <form onSubmit={newDocumentForm.onSubmit(handleNewDocument)}>
                        <Stack gap="lg">
                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Title order={3} mb="md">Document Information</Title>

                                <TextInput
                                    label="Document Name"
                                    placeholder="Enter document name"
                                    required
                                    size="md"
                                    {...newDocumentForm.getInputProps('documentName')}
                                />

                                <Textarea
                                    label="Description"
                                    placeholder="Describe the content and purpose of the document"
                                    required
                                    rows={4}
                                    mt="md"
                                    {...newDocumentForm.getInputProps('description')}
                                />

                                <Grid mt="md">
                                    <Grid.Col span={6}>
                                        <Select
                                            label="Category"
                                            placeholder="Select a category"
                                            data={documentCategories}
                                            required
                                            {...newDocumentForm.getInputProps('category')}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Select
                                            label="Access Level"
                                            data={accessLevels}
                                            required
                                            {...newDocumentForm.getInputProps('accessLevel')}
                                        />
                                    </Grid.Col>
                                </Grid>
                            </Card>

                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Title order={3} mb="md">Document Management</Title>

                                <Grid>
                                    <Grid.Col span={6}>
                                        <Select
                                            label="Owner"
                                            placeholder="Select owner"
                                            data={employees.map((x) => ({ value: "" + x.id, label: x.name }))}
                                            required
                                            {...newDocumentForm.getInputProps('ownerId')}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Select
                                            label="Department"
                                            placeholder="Select department"
                                            data={departments.map((x) => ({ value: "" + x.id, label: x.name }))}
                                            required
                                            {...newDocumentForm.getInputProps('departmentId')}
                                        />
                                    </Grid.Col>
                                </Grid>

                                <Grid mt="md">
                                    <Grid.Col span={6}>
                                        <Select
                                            label="Status"
                                            data={documentStatuses}
                                            required
                                            {...newDocumentForm.getInputProps('status')}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Box mt="lg">
                                            <Switch
                                                label="Allow Download"
                                                description="Enable users to download this document"
                                                {...newDocumentForm.getInputProps('allowDownload', { type: 'checkbox' })}
                                            />
                                        </Box>
                                    </Grid.Col>
                                </Grid>
                            </Card>

                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Title order={3} mb="md">Classification & Tags</Title>

                                <MultiSelect
                                    label="Tags"
                                    placeholder="Add tags to facilitate search"
                                    data={[
                                        'safety', 'policy', 'procedure', 'training', 'emergency',
                                        'maintenance', 'equipment', 'compliance', 'audit', 'report'
                                    ]}
                                    searchable
                                    {...newDocumentForm.getInputProps('tags')}
                                />
                            </Card>

                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Title order={3} mb="md">Schedule & Dates</Title>

                                <Grid>
                                    <Grid.Col span={6}>
                                        <DateInput
                                            label="Review Date"
                                            placeholder="When should this document be reviewed?"
                                            {...newDocumentForm.getInputProps('reviewDate')}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <DateInput
                                            label="Expiry Date"
                                            placeholder="When does this document expire?"
                                            {...newDocumentForm.getInputProps('expiryDate')}
                                        />
                                    </Grid.Col>
                                </Grid>
                            </Card>

                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Title order={3} mb="md">File Upload</Title>

                                <FileInput
                                    label="Document File"
                                    placeholder="Select file to upload"
                                    required
                                    leftSection={<IconUpload size={16} />}
                                    {...newDocumentForm.getInputProps('file')}
                                />
                            </Card>

                            <Group justify="flex-end" mt="xl">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowNewDocumentForm(false)}
                                    size="md"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    color="green"
                                    size="md"
                                    leftSection={<IconPlus size={16} />}
                                >
                                    Create Document
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 4 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
                        <Title order={4} mb="md">Recent Documents</Title>
                        {/* <Text size="sm" c="dimmed" mb="md">Last 5 updated documents</Text> */}

                        <Stack gap="md">
                            {docs.map((doc: any) => (
                                <Card key={doc.id} withBorder p="sm" style={{ backgroundColor: '#f8f9fa' }}>
                                    <Group justify="space-between" mb="xs">
                                        <Group>
                                            {/* {getFileTypeIcon(doc.fileType)} */}
                                            <Box>
                                                <Link to={`/document-management/document-details/${doc.id}`}>
                                                    <Text size="sm" fw={500} lineClamp={1}>{doc.documentName}</Text>
                                                </Link>
                                                <Text size="xs" c="dimmed">{doc.category}</Text>
                                            </Box>
                                        </Group>
                                        <Badge color={getStatusColor(doc.status)} variant="light" size="sm">
                                            {documentStatusesMap[doc.status]}
                                        </Badge>
                                    </Group>

                                    <Group justify="space-between" mb="xs">
                                        <Text size="xs" c="dimmed">Modified: {formatDateShort(doc.updatedAt)}</Text>
                                        <Group gap="xs">
                                            <Badge color={getAccessLevelColor(doc.accessLevel)} variant="outline" size="xs">
                                                {doc.accessLevel}
                                            </Badge>
                                            {/* <ActionIcon variant="light" size="sm" color="blue">
                                                <IconEye size={12} />
                                            </ActionIcon> */}
                                        </Group>
                                    </Group>

                                    <Text size="xs" c="dimmed" lineClamp={2}>
                                        {doc.description}
                                    </Text>
                                </Card>
                            ))}
                        </Stack>
                    </Card>

                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Title order={4} mb="md">Document Guidelines</Title>

                        <Stack gap="sm">
                            <Box p="sm" style={{ backgroundColor: '#e7f5ff', borderRadius: '8px' }}>
                                <Text size="sm" fw={500} c="blue" mb="xs">📋 Status Guidelines</Text>
                                <Text size="xs" c="dimmed">
                                    • <strong>Draft:</strong> Document in creation<br />
                                    • <strong>Under Review:</strong> Pending approval<br />
                                    • <strong>Approved:</strong> Ready for use<br />
                                    • <strong>Archived:</strong> No longer active
                                </Text>
                            </Box>

                            <Box p="sm" style={{ backgroundColor: '#fff3cd', borderRadius: '8px' }}>
                                <Text size="sm" fw={500} c="orange" mb="xs">🔒 Access Levels</Text>
                                <Text size="xs" c="dimmed">
                                    • <strong>Public:</strong> Available to everyone<br />
                                    • <strong>Internal:</strong> Company employees only<br />
                                    • <strong>Confidential:</strong> Restricted access<br />
                                    • <strong>Restricted:</strong> Authorized personnel only
                                </Text>
                            </Box>

                            <Box p="sm" style={{ backgroundColor: '#d1ecf1', borderRadius: '8px' }}>
                                <Text size="sm" fw={500} c="teal" mb="xs">💡 Best Practices</Text>
                                <Text size="xs" c="dimmed">
                                    • Use descriptive names and tags<br />
                                    • Set appropriate review dates<br />
                                    • Choose correct access levels<br />
                                    • Add comprehensive descriptions
                                </Text>
                            </Box>
                        </Stack>
                    </Card>
                </Grid.Col>
            </Grid>
        </div>
    )
}

export default CreateDocument
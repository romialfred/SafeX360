import {
    Alert,
    Breadcrumbs,
    Button,
    FileInput,
    Group,
    LoadingOverlay,
    Modal,
    Select,
    Stack,
    Tabs,
    Text,
    Textarea,
    TextInput,
} from "@mantine/core";
import { IconCloudUpload, IconDownload, IconEdit, IconHistory, IconInfoCircle, IconTag, IconVersions } from "@tabler/icons-react";
import { Link, useParams } from "react-router-dom";
import DocumentDetails from "./DocumentDetails";
import DocumentHistory from "./DocumentHistory";
import { useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import { changeDocumentStatus, getDocumentById } from "../../services/DocumentService";
import { createDocumentVersion, getDocumentVersionsByDocId } from "../../services/DocumentVersionService";
import { getEmployeeDropdown } from "../../services/EmployeeService";
import { getAllDepartments } from "../../services/HrmsService";
import { mapIdToName } from "../../utility/OtherUtilities";
import DocumentMetadata from "./DocumentMetdata";
import { useDispatch } from "react-redux";
import { convertFileToBase64DTO, handleDownload, handlePreview } from "../../utility/DocumentUtility";
import { hideOverlay, showOverlay } from "../../slices/OverlaySlice";
import { errorNotification, successNotification } from "../../utility/NotificationUtility";
import { documentStatusesMap } from "../../Data/dummyData/documentData";
import { getMedia } from "../../services/MediaService";


const DocumentsTabs = () => {
    const [showNewVersionModal, setShowNewVersionModal] = useState(false);
    const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
    // const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const { id } = useParams();

    const [document, setDocument] = useState<any>({});
    const [versions, setVersions] = useState<any[]>([]);
    const dispatch = useDispatch();
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [departmentMap, setDepartmentMap] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        dispatch(showOverlay());
        fetchDocument();
        getEmployeeDropdown().then((res) => {
            setEmpMap(mapIdToName(res));
        }).catch((_err) => {
        });

        getAllDepartments().then((res) => {
            setDepartmentMap(mapIdToName(res));
        }).catch((_err) => {
        });
        fetchVersions();
    }, [])
    const fetchVersions = () => {
        getDocumentVersionsByDocId(id).then((res) => {
            setVersions(res);
        });
    };
    const fetchDocument = () => {
        getDocumentById(id).then((res) => {
            setDocument(res);
            dispatch(hideOverlay());
        });
    }
    const newVersionForm = useForm({
        initialValues: {
            description: '',
            version: "",
            file: null,
            documentId: id
        },
        validate: {
            description: (value) => (value ? null : 'Description is required'),
            version: (value) => (value ? null : 'Version is required'),
            file: (value) => (value ? null : 'File is required'),
        }
    });
    const statusChangeForm = useForm({
        initialValues: {
            status: document.status,
            reason: ''
        }
    });
    const handleNewVersion = async (values: any) => {
        const media = await convertFileToBase64DTO(values.file);

        setLoading(true);
        () => setShowNewVersionModal(false)
        createDocumentVersion({
            ...values,
            media: media
        }).then((_res) => {
            successNotification("New version added Successfully.");
            setShowNewVersionModal(false)
            newVersionForm.reset();
            fetchVersions();
        }).catch((err) => {
            errorNotification(err.response?.data?.errorMessage || "Failed to create document");
        }).finally(() => {
            setLoading(false);
        })
    };

    const handleStatusChange = (values: any) => {
        setLoading(true);
        changeDocumentStatus(
            id,
            values.status
        ).then((_res) => {
            successNotification("Document status changed Successfully.");
            setShowStatusChangeModal(false)
            statusChangeForm.reset();
            fetchDocument();
        }).catch((err) => {
            errorNotification(err.response?.data?.errorMessage || "Failed to change document status");
        }).finally(() => {
            setLoading(false);
        })
    }


    const downloadDocument = (id: any) => {
        getMedia(id).then((res) => {
            handleDownload(res);
        }).catch((err) => {
            errorNotification(err.response?.data?.errorMessage || "Failed to download document");
        });
    }
    const openDocument = (id: any) => {
        getMedia(id).then((res) => {
            handlePreview(res);
        }).catch((err) => {
            errorNotification(err.response?.data?.errorMessage || "Failed to open document");
        });
    }

    return (
        <div>
            <div className="flex justify-between items-center">

                <div>
                    <div className="font-semibold text-2xl text-blue-500 w-fit">Document Details</div>
                    <Breadcrumbs mt="xs" mb="lg">
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient">Home</Text>
                        </Link>
                        <Link className="hover:!underline" to="/document-management">
                            <Text variant="gradient">Document Management</Text>
                        </Link>
                        <Text variant="gradient">Document Details</Text>
                    </Breadcrumbs>
                </div>

                <Group justify="space-between" mb="xl">

                    <Group>
                        <Button
                            leftSection={<IconVersions size={16} />}
                            onClick={() => setShowNewVersionModal(true)}
                            color="green"
                        >
                            New Version
                        </Button>
                        <Button
                            leftSection={<IconEdit size={16} />}
                            onClick={() => setShowStatusChangeModal(true)}
                            color="blue"
                        >
                            Change Status
                        </Button>
                        <Button
                            leftSection={<IconDownload size={16} />}
                            variant="outline"
                            onClick={() => downloadDocument(versions[versions.length - 1]?.mediaId)}
                        >
                            Download
                        </Button>
                    </Group>
                </Group>
            </div>

            <Tabs defaultValue="details">
                <Tabs.List>
                    <Tabs.Tab value="details" leftSection={<IconInfoCircle size={16} />}>
                        Details
                    </Tabs.Tab>
                    <Tabs.Tab value="versions" leftSection={<IconHistory size={16} />}>
                        Version History
                    </Tabs.Tab>
                    <Tabs.Tab value="metadata" leftSection={<IconTag size={16} />}>
                        Metadata
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="details" pt="md">
                    <DocumentDetails document={document} version={versions?.length > 0 ? versions[versions.length - 1] : null} empMap={empMap} departmentMap={departmentMap} />
                </Tabs.Panel>

                <Tabs.Panel value="versions" pt="md">
                    <DocumentHistory openDocument={openDocument} downloadDocument={downloadDocument} document={document} versions={versions} />
                </Tabs.Panel>

                <Tabs.Panel value="metadata" pt="md">
                    <DocumentMetadata document={document} versions={versions} empMap={empMap} departmentMap={departmentMap} />
                </Tabs.Panel>
            </Tabs>

            {/* New Version Modal */}
            <Modal
                opened={showNewVersionModal}
                onClose={() => setShowNewVersionModal(false)}
                title="Add New Version"
                size="md"
                centered
            >
                <LoadingOverlay visible={loading} />
                <form onSubmit={newVersionForm.onSubmit(handleNewVersion)}>
                    <Stack gap="md">
                        <Alert icon={<IconInfoCircle size={16} />} color="blue">
                            <div className="flex flex-col ">

                                You are adding a new version for: <span>
                                    {document.documentName}</span>
                            </div>
                        </Alert>

                        <TextInput label="Version Name" placeholder="eg: 2.0, 2.1" required {...newVersionForm.getInputProps('version')} />

                        <FileInput
                            label="File"
                            placeholder="Select file"
                            required
                            leftSection={<IconCloudUpload size={16} />}
                            {...newVersionForm.getInputProps('file')}
                        />

                        <Textarea
                            label="Change Description"
                            placeholder="Describe the changes made in this version..."
                            required
                            rows={4}
                            {...newVersionForm.getInputProps('description')}
                        />

                        <Group justify="flex-end">
                            <Button loading={loading} variant="outline" onClick={() => setShowNewVersionModal(false)}>
                                Cancel
                            </Button>
                            <Button loading={loading} type="submit" color="green">
                                Add Version
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
            <Modal
                opened={showStatusChangeModal}
                onClose={() => setShowStatusChangeModal(false)}
                title="Change Document Status"
                size="md"
                centered
            >
                <LoadingOverlay visible={loading} />
                <form onSubmit={statusChangeForm.onSubmit(handleStatusChange)}>
                    <Stack gap="md">
                        <Alert icon={<IconInfoCircle size={16} />} color="blue">
                            You are changing the status for: <strong>{document.documentName}</strong>
                            <br />
                            Current status: <strong>{documentStatusesMap[document.status]}</strong>
                        </Alert>

                        <Select
                            label="New Status"
                            placeholder="Select new status"
                            data={[
                                { value: 'DRAFT', label: 'Draft' },
                                { value: 'UNDER_REVIEW', label: 'Under Review' },
                                { value: 'APPROVED', label: 'Approved' },
                                { value: 'ARCHIVED', label: 'Archived' }
                            ]}
                            required
                            {...statusChangeForm.getInputProps('status')}
                        />

                        <Textarea
                            label="Reason for Status Change"
                            placeholder="Explain why you are changing the status..."
                            required
                            rows={3}
                            {...statusChangeForm.getInputProps('reason')}
                        />

                        <Group justify="flex-end">
                            <Button variant="outline" loading={loading} onClick={() => setShowStatusChangeModal(false)}>
                                Cancel
                            </Button>
                            <Button loading={loading} type="submit" color="green">
                                Update Status
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </div>
    )
}

export default DocumentsTabs 
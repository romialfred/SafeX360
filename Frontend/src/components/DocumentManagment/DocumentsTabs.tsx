import { useEffect, useState } from 'react';
import {
    Alert,
    Button,
    FileInput,
    Group,
    LoadingOverlay,
    Modal,
    Select,
    Stack,
    Tabs,
    Textarea,
    TextInput,
} from '@mantine/core';
import {
    IconCloudUpload,
    IconDownload,
    IconExchange,
    IconFolderOpen,
    IconHistory,
    IconInfoCircle,
    IconTag,
    IconVersions,
} from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from '@mantine/form';
import PageHeader from '../UtilityComp/PageHeader';
import DocumentDetails from './DocumentDetails';
import DocumentHistory from './DocumentHistory';
import DocumentMetadata from './DocumentMetdata';
import { changeDocumentStatus, getDocumentById } from '../../services/DocumentService';
import { createDocumentVersion, getDocumentVersionsByDocId } from '../../services/DocumentVersionService';
import { getEmployeeDropdown } from '../../services/EmployeeService';
import { getAllDepartments } from '../../services/HrmsService';
import { mapIdToName } from '../../utility/OtherUtilities';
import { convertFileToBase64DTO, handleDownload, handlePreview } from '../../utility/DocumentUtility';
import { hideOverlay, showOverlay } from '../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import { getMedia } from '../../services/MediaService';
import { DOC_STATUS_OPTIONS, docStatusConfig } from './documentLabels';

/**
 * Fiche d'un document du référentiel : détails, historique des versions et
 * métadonnées. Actions : nouvelle version, changement de statut, téléchargement.
 */

const DocumentsTabs = () => {
    const [showNewVersionModal, setShowNewVersionModal] = useState(false);
    const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
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
        getEmployeeDropdown()
            .then((res) => setEmpMap(mapIdToName(res)))
            .catch(() => {
                // les noms d'employés resteront vides
            });
        getAllDepartments()
            .then((res) => setDepartmentMap(mapIdToName(res)))
            .catch(() => {
                // les noms de départements resteront vides
            });
        fetchVersions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchVersions = () => {
        getDocumentVersionsByDocId(id)
            .then((res) => setVersions(res ?? []))
            .catch(() => {
                errorNotification("L'historique des versions n'a pas pu être chargé");
            });
    };

    const fetchDocument = () => {
        getDocumentById(id)
            .then((res) => setDocument(res ?? {}))
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Le document n'a pas pu être chargé");
            })
            .finally(() => dispatch(hideOverlay()));
    };

    const newVersionForm = useForm({
        initialValues: {
            description: '',
            version: '',
            file: null as File | null,
            documentId: id,
        },
        validate: {
            description: (value) => (value.trim() ? null : 'La description des changements est obligatoire'),
            version: (value) => (value.trim() ? null : 'Le numéro de version est obligatoire'),
            file: (value) => (value ? null : 'Le fichier est obligatoire'),
        },
    });

    const statusChangeForm = useForm({
        initialValues: {
            status: '',
        },
        validate: {
            status: (value) => (value ? null : 'Le nouveau statut est obligatoire'),
        },
    });

    const openStatusModal = () => {
        statusChangeForm.setValues({ status: document.status ?? '' });
        setShowStatusChangeModal(true);
    };

    const handleNewVersion = async (values: any) => {
        setLoading(true);
        try {
            const media = await convertFileToBase64DTO(values.file);
            await createDocumentVersion({ ...values, media });
            successNotification('Nouvelle version ajoutée');
            setShowNewVersionModal(false);
            newVersionForm.reset();
            fetchVersions();
        } catch (err: any) {
            errorNotification(err.response?.data?.errorMessage || "L'ajout de la version a échoué");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (values: any) => {
        setLoading(true);
        changeDocumentStatus(id, values.status)
            .then(() => {
                successNotification('Statut du document mis à jour');
                setShowStatusChangeModal(false);
                statusChangeForm.reset();
                fetchDocument();
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Le changement de statut a échoué');
            })
            .finally(() => setLoading(false));
    };

    const downloadDocument = (mediaId: any) => {
        getMedia(mediaId)
            .then((res) => handleDownload(res))
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Le téléchargement a échoué');
            });
    };

    const openDocument = (mediaId: any) => {
        getMedia(mediaId)
            .then((res) => handlePreview(res))
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "L'ouverture du document a échoué");
            });
    };

    const latestVersion = versions.length ? versions[versions.length - 1] : null;
    const currentStatusCfg = docStatusConfig(document?.status);

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Centre de Connaissances' },
                    { label: 'Gestionnaire de documents', to: '/document-management' },
                    { label: 'Fiche du document' },
                ]}
                icon={<IconFolderOpen size={22} stroke={2} />}
                iconColor="cyan"
                title={document?.documentName || 'Fiche du document'}
                subtitle="Détails, historique des versions et métadonnées du document"
                badge={
                    document?.status ? (
                        <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${currentStatusCfg.chip}`}>
                            {currentStatusCfg.label}
                        </span>
                    ) : undefined
                }
                actions={
                    <Group gap="xs">
                        <Button
                            size="sm"
                            color="teal"
                            leftSection={<IconVersions size={15} />}
                            onClick={() => setShowNewVersionModal(true)}
                        >
                            Nouvelle version
                        </Button>
                        <Button
                            size="sm"
                            variant="default"
                            leftSection={<IconExchange size={15} />}
                            onClick={openStatusModal}
                        >
                            Changer le statut
                        </Button>
                        <Button
                            size="sm"
                            variant="default"
                            leftSection={<IconDownload size={15} />}
                            onClick={() => downloadDocument(latestVersion?.mediaId)}
                            disabled={!latestVersion}
                        >
                            Télécharger
                        </Button>
                    </Group>
                }
            />

            <Tabs defaultValue="details" color="teal">
                <Tabs.List>
                    <Tabs.Tab value="details" leftSection={<IconInfoCircle size={15} />}>
                        Détails
                    </Tabs.Tab>
                    <Tabs.Tab value="versions" leftSection={<IconHistory size={15} />}>
                        Historique des versions
                    </Tabs.Tab>
                    <Tabs.Tab value="metadata" leftSection={<IconTag size={15} />}>
                        Métadonnées
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="details" pt="md">
                    <DocumentDetails
                        document={document}
                        version={latestVersion}
                        empMap={empMap}
                        departmentMap={departmentMap}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="versions" pt="md">
                    <DocumentHistory
                        openDocument={openDocument}
                        downloadDocument={downloadDocument}
                        document={document}
                        versions={versions}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="metadata" pt="md">
                    <DocumentMetadata
                        document={document}
                        versions={versions}
                        empMap={empMap}
                        departmentMap={departmentMap}
                    />
                </Tabs.Panel>
            </Tabs>

            {/* Modal : nouvelle version */}
            <Modal
                opened={showNewVersionModal}
                onClose={() => setShowNewVersionModal(false)}
                title={<span className="text-base">Ajouter une version</span>}
                size="md"
                centered
            >
                <LoadingOverlay visible={loading} />
                <form onSubmit={newVersionForm.onSubmit(handleNewVersion)}>
                    <Stack gap="md">
                        <Alert icon={<IconInfoCircle size={16} />} color="teal" variant="light">
                            Nouvelle version pour : <strong>{document.documentName}</strong>
                        </Alert>

                        <TextInput
                            label="Numéro de version"
                            placeholder="ex. 2.0, 2.1"
                            withAsterisk
                            size="sm"
                            {...newVersionForm.getInputProps('version')}
                        />

                        <FileInput
                            label="Fichier"
                            placeholder="Sélectionner le fichier"
                            withAsterisk
                            size="sm"
                            leftSection={<IconCloudUpload size={15} />}
                            {...newVersionForm.getInputProps('file')}
                        />

                        <Textarea
                            label="Description des changements"
                            placeholder="ex. Mise à jour du chapitre 4 suite à l'audit interne de mai"
                            withAsterisk
                            minRows={3}
                            autosize
                            size="sm"
                            {...newVersionForm.getInputProps('description')}
                        />

                        <Group justify="flex-end" gap="xs">
                            <Button
                                type="button"
                                variant="default"
                                size="sm"
                                disabled={loading}
                                onClick={() => setShowNewVersionModal(false)}
                            >
                                Annuler
                            </Button>
                            <Button loading={loading} type="submit" color="teal" size="sm">
                                Ajouter la version
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            {/* Modal : changement de statut */}
            <Modal
                opened={showStatusChangeModal}
                onClose={() => setShowStatusChangeModal(false)}
                title={<span className="text-base">Changer le statut du document</span>}
                size="md"
                centered
            >
                <LoadingOverlay visible={loading} />
                <form onSubmit={statusChangeForm.onSubmit(handleStatusChange)}>
                    <Stack gap="md">
                        <Alert icon={<IconInfoCircle size={16} />} color="teal" variant="light">
                            Document : <strong>{document.documentName}</strong>
                            <br />
                            Statut actuel : <strong>{currentStatusCfg.label}</strong>
                        </Alert>

                        <Select
                            label="Nouveau statut"
                            placeholder="Choisir le nouveau statut"
                            data={DOC_STATUS_OPTIONS}
                            withAsterisk
                            size="sm"
                            {...statusChangeForm.getInputProps('status')}
                        />

                        <Group justify="flex-end" gap="xs">
                            <Button
                                type="button"
                                variant="default"
                                size="sm"
                                disabled={loading}
                                onClick={() => setShowStatusChangeModal(false)}
                            >
                                Annuler
                            </Button>
                            <Button loading={loading} type="submit" color="teal" size="sm">
                                Mettre à jour le statut
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </div>
    );
};

export default DocumentsTabs;

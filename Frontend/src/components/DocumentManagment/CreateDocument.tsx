import { useEffect, useState } from 'react';
import {
    Badge,
    Button,
    FileInput,
    MultiSelect,
    Select,
    Switch,
    Textarea,
    TextInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import {
    IconCalendarDue,
    IconDeviceFloppy,
    IconFileDescription,
    IconFolderOpen,
    IconShieldLock,
    IconUpload,
} from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import PageHeader from '../UtilityComp/PageHeader';
import { getEmployeeDropdown } from '../../services/EmployeeService';
import { getAllDepartments } from '../../services/HrmsService';
import { convertFileToBase64DTO } from '../../utility/DocumentUtility';
import { createDocument, getLatestDocuments } from '../../services/DocumentService';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import { hideOverlay, showOverlay } from '../../slices/OverlaySlice';
import {
    ACCESS_LEVEL_CONFIG,
    ACCESS_LEVEL_OPTIONS,
    DOC_CATEGORY_OPTIONS,
    DOC_STATUS_OPTIONS,
    TAG_SUGGESTIONS,
    accessLevelConfig,
    docCategoryLabel,
    docStatusConfig,
    formatDateFr,
    toIsoDateLocal,
} from './documentLabels';

/**
 * Création d'un document du référentiel : identification, gestion, accès,
 * échéances et fichier source. Les derniers documents déposés sont rappelés
 * en aparté pour éviter les doublons.
 */

interface CreateDocumentValues {
    documentName: string;
    description: string;
    category: string;
    ownerId: string;
    departmentId: string;
    tags: string[];
    accessLevel: string;
    status: string;
    allowDownload: boolean;
    reviewDate: Date | null;
    expiryDate: Date | null;
    file: File | null;
}

const SectionCard = ({
    icon,
    title,
    subtitle,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) => (
    <section className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-slate-100">
            <span className="inline-flex p-1.5 rounded-md bg-teal-50 text-teal-700">{icon}</span>
            <div>
                <h3
                    className="text-slate-800"
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontSize: '14px',
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                    }}
                >
                    {title}
                </h3>
                <p className="text-[11.5px] text-slate-500">{subtitle}</p>
            </div>
        </div>
        <div className="flex flex-col gap-3">{children}</div>
    </section>
);

const CreateDocument = () => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [docs, setDocs] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const form = useForm<CreateDocumentValues>({
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
            file: null,
        },
        validate: {
            documentName: (value) => {
                const trimmed = value.trim();
                if (!trimmed) return 'Le nom du document est obligatoire';
                return trimmed.length < 3 ? 'Au moins 3 caractères' : null;
            },
            description: (value) => (value.trim() ? null : 'La description est obligatoire'),
            category: (value) => (value ? null : 'La catégorie est obligatoire'),
            ownerId: (value) => (value ? null : 'Le propriétaire est obligatoire'),
            departmentId: (value) => (value ? null : 'Le département est obligatoire'),
            accessLevel: (value) => (value ? null : "Le niveau d'accès est obligatoire"),
            status: (value) => (value ? null : 'Le statut initial est obligatoire'),
            file: (value) => (value ? null : 'Le fichier du document est obligatoire'),
            expiryDate: (value, values) =>
                value && values.reviewDate && value < values.reviewDate
                    ? "L'expiration ne peut pas précéder la date de révision"
                    : null,
        },
        validateInputOnBlur: true,
    });

    useEffect(() => {
        getEmployeeDropdown()
            .then((res) => setEmployees(res ?? []))
            .catch(() => {
                // la liste des propriétaires restera vide
            });

        getAllDepartments()
            .then((res) => setDepartments(res ?? []))
            .catch(() => {
                // la liste des départements restera vide
            });

        getLatestDocuments()
            .then((res) => setDocs(res ?? []))
            .catch(() => {
                // l'aparté des documents récents restera vide
            });
    }, []);

    const handleSubmit = async (values: CreateDocumentValues) => {
        setSubmitting(true);
        dispatch(showOverlay());
        try {
            const media = await convertFileToBase64DTO(values.file);
            await createDocument({
                ...values,
                documentName: values.documentName.trim(),
                description: values.description.trim(),
                reviewDate: values.reviewDate ? toIsoDateLocal(values.reviewDate) : null,
                expiryDate: values.expiryDate ? toIsoDateLocal(values.expiryDate) : null,
                media,
            });
            successNotification('Document ajouté au référentiel');
            navigate('/document-management');
        } catch (err: any) {
            errorNotification(err.response?.data?.errorMessage || "L'enregistrement du document a échoué");
        } finally {
            setSubmitting(false);
            dispatch(hideOverlay());
        }
    };

    const accessCfg = ACCESS_LEVEL_CONFIG[form.values.accessLevel];

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Centre de Connaissances' },
                    { label: 'Gestionnaire de documents', to: '/document-management' },
                    { label: 'Nouveau document' },
                ]}
                icon={<IconFolderOpen size={22} stroke={2} />}
                iconColor="cyan"
                title="Nouveau document"
                subtitle="Décrire le document, fixer son niveau d'accès et déposer le fichier source"
            />

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
                    {/* ─── Colonne saisie ─────────────────────────────────── */}
                    <div className="xl:col-span-3 flex flex-col gap-4">
                        <SectionCard
                            icon={<IconFileDescription size={15} stroke={1.8} />}
                            title="Identification"
                            subtitle="Nom, objet et catégorie du document"
                        >
                            <TextInput
                                label="Nom du document"
                                placeholder="ex. Procédure de consignation des équipements mobiles"
                                withAsterisk
                                size="sm"
                                {...form.getInputProps('documentName')}
                            />
                            <Textarea
                                label="Description"
                                placeholder="Objet du document, périmètre d'application et public concerné"
                                minRows={3}
                                autosize
                                withAsterisk
                                size="sm"
                                {...form.getInputProps('description')}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select
                                    label="Catégorie"
                                    placeholder="Choisir une catégorie"
                                    data={DOC_CATEGORY_OPTIONS}
                                    withAsterisk
                                    size="sm"
                                    {...form.getInputProps('category')}
                                />
                                <MultiSelect
                                    label="Étiquettes"
                                    placeholder="Ajouter des étiquettes pour la recherche"
                                    data={TAG_SUGGESTIONS}
                                    searchable
                                    size="sm"
                                    {...form.getInputProps('tags')}
                                />
                            </div>
                        </SectionCard>

                        <SectionCard
                            icon={<IconShieldLock size={15} stroke={1.8} />}
                            title="Gestion et accès"
                            subtitle="Responsable du document, statut initial et confidentialité"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select
                                    label="Propriétaire"
                                    placeholder="Choisir le responsable"
                                    data={employees.map((x) => ({ value: String(x.id), label: x.name }))}
                                    searchable
                                    withAsterisk
                                    size="sm"
                                    {...form.getInputProps('ownerId')}
                                />
                                <Select
                                    label="Département"
                                    placeholder="Choisir le département"
                                    data={departments.map((x) => ({ value: String(x.id), label: x.name }))}
                                    searchable
                                    withAsterisk
                                    size="sm"
                                    {...form.getInputProps('departmentId')}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select
                                    label="Statut initial"
                                    data={DOC_STATUS_OPTIONS}
                                    withAsterisk
                                    size="sm"
                                    {...form.getInputProps('status')}
                                />
                                <Select
                                    label="Niveau d'accès"
                                    data={ACCESS_LEVEL_OPTIONS}
                                    withAsterisk
                                    size="sm"
                                    {...form.getInputProps('accessLevel')}
                                />
                            </div>
                            {accessCfg && (
                                <p className="text-[11.5px] text-slate-500 -mt-1">{accessCfg.description}</p>
                            )}
                            <Switch
                                label="Autoriser le téléchargement"
                                description="Les lecteurs habilités pourront télécharger le fichier source."
                                color="teal"
                                size="sm"
                                checked={form.values.allowDownload}
                                onChange={(e) => form.setFieldValue('allowDownload', e.currentTarget.checked)}
                            />
                        </SectionCard>

                        <SectionCard
                            icon={<IconCalendarDue size={15} stroke={1.8} />}
                            title="Échéances"
                            subtitle="Cycle de révision et fin de validité du document"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <DateInput
                                    label="Date de révision"
                                    placeholder="Prochaine revue du contenu"
                                    valueFormat="DD/MM/YYYY"
                                    clearable
                                    size="sm"
                                    {...form.getInputProps('reviewDate')}
                                />
                                <DateInput
                                    label="Date d'expiration"
                                    placeholder="Fin de validité du document"
                                    valueFormat="DD/MM/YYYY"
                                    clearable
                                    size="sm"
                                    {...form.getInputProps('expiryDate')}
                                />
                            </div>
                        </SectionCard>

                        <SectionCard
                            icon={<IconUpload size={15} stroke={1.8} />}
                            title="Fichier source"
                            subtitle="Version initiale du document (PDF, Word, Excel ou image)"
                        >
                            <FileInput
                                label="Fichier du document"
                                placeholder="Sélectionner le fichier à déposer"
                                withAsterisk
                                size="sm"
                                leftSection={<IconUpload size={15} />}
                                {...form.getInputProps('file')}
                            />
                        </SectionCard>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="default"
                                size="sm"
                                type="button"
                                disabled={submitting}
                                onClick={() => navigate('/document-management')}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                color="teal"
                                size="sm"
                                loading={submitting}
                                leftSection={<IconDeviceFloppy size={15} />}
                            >
                                Créer le document
                            </Button>
                        </div>
                    </div>

                    {/* ─── Aparté : documents récents + repères ───────────── */}
                    <aside className="xl:col-span-2">
                        <div className="sticky top-4 flex flex-col gap-3">
                            <div className="bg-white rounded-xl border border-slate-200 p-4">
                                <h3
                                    className="text-slate-800 mb-1"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        letterSpacing: '-0.01em',
                                    }}
                                >
                                    Derniers documents déposés
                                </h3>
                                <p className="text-[11.5px] text-slate-500 mb-3">
                                    Vérifiez qu'un document équivalent n'existe pas déjà.
                                </p>
                                {docs.length ? (
                                    <div className="flex flex-col gap-2">
                                        {docs.map((doc: any) => {
                                            const statusCfg = docStatusConfig(doc.status);
                                            const accessChip = accessLevelConfig(doc.accessLevel);
                                            return (
                                                <div key={doc.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <Link
                                                                to={`/document-management/document-details/${doc.id}`}
                                                                className="text-[12.5px] text-slate-800 leading-snug hover:text-teal-700 hover:underline line-clamp-1"
                                                            >
                                                                {doc.documentName}
                                                            </Link>
                                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                                {docCategoryLabel(doc.category)} · modifié le {formatDateFr(doc.updatedAt)}
                                                            </p>
                                                        </div>
                                                        <span className={`flex-shrink-0 inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${statusCfg.chip}`}>
                                                            {statusCfg.label}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2 mt-1.5">
                                                        <p className="text-[11px] text-slate-500 line-clamp-1">{doc.description}</p>
                                                        <Badge variant="outline" color="gray" size="xs" radius="sm">
                                                            {accessChip.label}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-[12px] text-slate-500">Aucun document récent.</p>
                                )}
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                                <p className="text-[11.5px] text-slate-600 leading-relaxed">
                                    Un document créé en brouillon n'est pas diffusé. Passez-le « En revue »
                                    pour lancer l'approbation, puis « Approuvé » pour le rendre consultable
                                    selon son niveau d'accès.
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </form>
        </div>
    );
};

export default CreateDocument;

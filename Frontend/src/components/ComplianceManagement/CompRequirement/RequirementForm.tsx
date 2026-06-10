import { useEffect, useState } from "react";
import { Button, Select, Switch, Textarea, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
    IconClipboardList,
    IconDeviceFloppy,
    IconFileCheck,
    IconRepeat,
    IconScale,
} from "@tabler/icons-react";
import PageHeader from "../../UtilityComp/PageHeader";
import IsoBadge from "../../UtilityComp/IsoBadge";
import {
    createRequirement,
    getRequirementById,
    updateRequirement,
} from "../../../services/RequirementService";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import {
    CATEGORY_OPTIONS,
    CRITICALITY_CONFIG,
    CRITICALITY_OPTIONS,
    DOCTYPE_OPTIONS,
    FREQUENCY_OPTIONS,
    categoryLabel,
    docTypeLabel,
    frequencyLabel,
} from "../complianceLabels";

/**
 * RequirementForm — création / modification d'une exigence réglementaire (LOT 49).
 *
 * Design signature du module : saisie sectionnée à gauche, et à droite la
 * « fiche exigence réglementaire » qui se construit en direct pendant la
 * saisie — code de référence, sceau de criticité, source légale, autorité.
 */

interface RequirementFormProps {
    mode: 'create' | 'edit';
}

interface RequirementFormValues {
    title: string;
    description: string;
    category: string;
    criticality: string;
    legalSource: string;
    authority: string;
    renewalFrequency: string;
    docType: string;
    active: boolean;
}

const SEAL_CLASSES: Record<string, string> = {
    CRITIQUE: 'border-rose-300 text-rose-600 bg-rose-50/60',
    MAJEURE: 'border-amber-300 text-amber-600 bg-amber-50/60',
    STANDARD: 'border-slate-300 text-slate-500 bg-slate-50/60',
};

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

const RequirementForm = ({ mode }: RequirementFormProps) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();
    const [submitting, setSubmitting] = useState(false);
    const [loadedCode, setLoadedCode] = useState<string | null>(null);

    const form = useForm<RequirementFormValues>({
        initialValues: {
            title: '',
            description: '',
            category: '',
            criticality: 'STANDARD',
            legalSource: '',
            authority: '',
            renewalFrequency: '',
            docType: '',
            active: true,
        },
        validate: {
            title: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "L'intitulé est obligatoire";
                if (trimmed.length < 5) return "L'intitulé doit compter au moins 5 caractères";
                return trimmed.length > 150 ? 'Maximum 150 caractères' : null;
            },
            description: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return 'La description est obligatoire';
                return trimmed.length > 250 ? 'Maximum 250 caractères' : null;
            },
            category: (value) => (value?.trim() ? null : 'La catégorie est obligatoire'),
            criticality: (value) => (value?.trim() ? null : 'La criticité est obligatoire'),
            renewalFrequency: (value) => (value ? null : 'La fréquence de renouvellement est obligatoire'),
            docType: (value) => (value?.trim() ? null : 'Le type de document attendu est obligatoire'),
            legalSource: (value) => (value && value.length > 160 ? 'Maximum 160 caractères' : null),
            authority: (value) => (value && value.length > 120 ? 'Maximum 120 caractères' : null),
        },
        validateInputOnBlur: true,
    });

    useEffect(() => {
        if (mode === 'edit' && id) {
            dispatch(showOverlay());
            getRequirementById(id)
                .then((res) => {
                    form.setValues({
                        title: res.title ?? '',
                        description: res.description ?? '',
                        category: res.category ?? '',
                        criticality: res.criticality ?? 'STANDARD',
                        legalSource: res.legalSource ?? '',
                        authority: res.authority ?? '',
                        renewalFrequency: res.renewalFrequency ?? '',
                        docType: res.docType ?? '',
                        active: res.status === 'ACTIVE',
                    });
                    setLoadedCode(res.referenceCode ?? null);
                })
                .catch((err) => {
                    errorNotification(err.response?.data?.errorMessage || "L'exigence n'a pas pu être chargée");
                })
                .finally(() => {
                    dispatch(hideOverlay());
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, id]);

    const handleSubmit = (values: RequirementFormValues) => {
        setSubmitting(true);
        dispatch(showOverlay());
        const payload = {
            title: values.title.trim(),
            description: values.description.trim(),
            category: values.category,
            criticality: values.criticality,
            legalSource: values.legalSource.trim(),
            authority: values.authority.trim(),
            renewalFrequency: values.renewalFrequency,
            docType: values.docType,
        };

        const request =
            mode === 'create'
                ? createRequirement(payload)
                : updateRequirement({ id, ...payload, status: values.active ? 'ACTIVE' : 'INACTIVE' });

        request
            .then(() => {
                successNotification(mode === 'create' ? 'Exigence réglementaire créée' : 'Exigence mise à jour');
                navigate('/compliance-requirements');
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "L'enregistrement a échoué");
            })
            .finally(() => {
                setSubmitting(false);
                dispatch(hideOverlay());
            });
    };

    const criticality = form.values.criticality || 'STANDARD';
    const criticalityCfg = CRITICALITY_CONFIG[criticality] ?? CRITICALITY_CONFIG.STANDARD;
    const codePreview = mode === 'edit' ? (loadedCode ?? (id ? `EXG-${String(id).padStart(3, '0')}` : '—')) : 'EXG-···';

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Conformité Réglementaire' },
                    { label: 'Exigences légales', to: '/compliance-requirements' },
                    { label: mode === 'create' ? 'Nouvelle exigence' : "Modifier l'exigence" },
                ]}
                icon={<IconFileCheck size={22} stroke={2} />}
                iconColor="teal"
                title={mode === 'create' ? 'Nouvelle exigence réglementaire' : "Modifier l'exigence réglementaire"}
                subtitle={
                    mode === 'create'
                        ? "Décrire l'obligation, sa source légale et son cycle de renouvellement"
                        : 'Mettre à jour la fiche réglementaire et son cycle de renouvellement'
                }
            />

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
                    {/* ─── Colonne saisie ─────────────────────────────────── */}
                    <div className="xl:col-span-3 flex flex-col gap-4">
                        <SectionCard
                            icon={<IconClipboardList size={15} stroke={1.8} />}
                            title="Identification"
                            subtitle="Ce que couvre l'exigence, en termes clairs pour les équipes"
                        >
                            <TextInput
                                label="Intitulé"
                                placeholder="ex. Certificat d'aptitude médicale au poste"
                                withAsterisk
                                size="sm"
                                {...form.getInputProps('title')}
                            />
                            <Textarea
                                label="Description"
                                placeholder="Objet de l'obligation, périmètre d'application et conditions de validité"
                                minRows={3}
                                autosize
                                withAsterisk
                                size="sm"
                                {...form.getInputProps('description')}
                            />
                        </SectionCard>

                        <SectionCard
                            icon={<IconScale size={15} stroke={1.8} />}
                            title="Classement réglementaire"
                            subtitle="Catégorie, criticité et ancrage juridique de l'obligation"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select
                                    label="Catégorie"
                                    placeholder="Choisir une catégorie"
                                    data={CATEGORY_OPTIONS}
                                    withAsterisk
                                    size="sm"
                                    {...form.getInputProps('category')}
                                />
                                <Select
                                    label="Criticité"
                                    placeholder="Choisir la criticité"
                                    data={CRITICALITY_OPTIONS}
                                    withAsterisk
                                    size="sm"
                                    {...form.getInputProps('criticality')}
                                />
                            </div>
                            <p className="text-[11.5px] text-slate-500 -mt-1">{criticalityCfg.description}</p>
                            <TextInput
                                label="Source légale ou normative"
                                placeholder="ex. Code Minier — Réglementation des explosifs, ISO 45001"
                                size="sm"
                                {...form.getInputProps('legalSource')}
                            />
                            <TextInput
                                label="Autorité émettrice"
                                placeholder="ex. Direction Générale des Mines, Médecine du travail"
                                size="sm"
                                {...form.getInputProps('authority')}
                            />
                        </SectionCard>

                        <SectionCard
                            icon={<IconRepeat size={15} stroke={1.8} />}
                            title="Cycle de renouvellement"
                            subtitle="Périodicité du justificatif et pièce attendue des employés"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select
                                    label="Fréquence de renouvellement"
                                    placeholder="Choisir une fréquence"
                                    data={FREQUENCY_OPTIONS}
                                    withAsterisk
                                    size="sm"
                                    {...form.getInputProps('renewalFrequency')}
                                />
                                <Select
                                    label="Type de document attendu"
                                    placeholder="Choisir un type"
                                    data={DOCTYPE_OPTIONS}
                                    withAsterisk
                                    size="sm"
                                    {...form.getInputProps('docType')}
                                />
                            </div>
                            {mode === 'edit' && (
                                <Switch
                                    label="Exigence active"
                                    description="Une exigence inactive reste consultable mais n'est plus appliquée aux postes."
                                    color="teal"
                                    size="sm"
                                    checked={form.values.active}
                                    onChange={(e) => form.setFieldValue('active', e.currentTarget.checked)}
                                />
                            )}
                        </SectionCard>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="default"
                                size="sm"
                                type="button"
                                disabled={submitting}
                                onClick={() => navigate('/compliance-requirements')}
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
                                {mode === 'create' ? "Créer l'exigence" : 'Enregistrer les modifications'}
                            </Button>
                        </div>
                    </div>

                    {/* ─── Fiche réglementaire en direct ──────────────────── */}
                    <aside className="xl:col-span-2">
                        <div className="sticky top-4 flex flex-col gap-3">
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="px-4 py-2.5 bg-gradient-to-r from-teal-800 to-teal-600 flex items-center justify-between gap-2">
                                    <span className="text-[10px] uppercase tracking-[0.18em] text-teal-50">
                                        Fiche exigence réglementaire
                                    </span>
                                    <span className="text-[11px] font-mono bg-white/15 text-white rounded px-1.5 py-0.5">
                                        {codePreview}
                                    </span>
                                </div>

                                <div className="relative p-4 pb-3">
                                    {/* Sceau de criticité, façon tampon */}
                                    <div
                                        className={`absolute top-3 right-3 rotate-[-6deg] border-2 rounded px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${SEAL_CLASSES[criticality] ?? SEAL_CLASSES.STANDARD}`}
                                        role="img"
                                        aria-label={`Criticité : ${criticalityCfg.label}`}
                                    >
                                        {criticalityCfg.label}
                                    </div>

                                    <h4
                                        className={`pr-20 leading-snug ${form.values.title ? 'text-slate-800' : 'text-slate-400 italic'}`}
                                        style={{
                                            fontFamily: "'Source Serif 4', Georgia, serif",
                                            fontSize: '16px',
                                            fontWeight: 600,
                                            letterSpacing: '-0.01em',
                                        }}
                                    >
                                        {form.values.title || "Intitulé de l'exigence"}
                                    </h4>
                                    <p className={`text-[12px] mt-1.5 leading-relaxed ${form.values.description ? 'text-slate-600' : 'text-slate-400 italic'}`}>
                                        {form.values.description || 'La description saisie apparaîtra ici, telle que les coordinateurs HSE la liront.'}
                                    </p>

                                    <dl className="mt-4 grid grid-cols-1 gap-2 text-[12px]">
                                        <div className="flex items-center justify-between gap-3 py-1.5 border-t border-slate-100">
                                            <dt className="text-slate-500">Catégorie</dt>
                                            <dd className="text-slate-800">{form.values.category ? categoryLabel(form.values.category) : '—'}</dd>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-1.5 border-t border-slate-100">
                                            <dt className="text-slate-500">Renouvellement</dt>
                                            <dd className="text-slate-800">{form.values.renewalFrequency ? frequencyLabel(form.values.renewalFrequency) : '—'}</dd>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-1.5 border-t border-slate-100">
                                            <dt className="text-slate-500">Document attendu</dt>
                                            <dd className="text-slate-800">{form.values.docType ? docTypeLabel(form.values.docType) : '—'}</dd>
                                        </div>
                                        <div className="flex items-start justify-between gap-3 py-1.5 border-t border-slate-100">
                                            <dt className="text-slate-500 flex-shrink-0">Source légale</dt>
                                            <dd className="text-slate-800 text-right">{form.values.legalSource || '—'}</dd>
                                        </div>
                                        <div className="flex items-start justify-between gap-3 py-1.5 border-t border-slate-100">
                                            <dt className="text-slate-500 flex-shrink-0">Autorité émettrice</dt>
                                            <dd className="text-slate-800 text-right">{form.values.authority || '—'}</dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                                    <IsoBadge norm="ISO 45001" size="sm" />
                                    <p className="text-[10.5px] text-slate-500">
                                        § 6.1.3 — Détermination des exigences légales et autres exigences
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                                <p className="text-[11.5px] text-slate-600 leading-relaxed">
                                    {mode === 'create'
                                        ? "Le code de référence est attribué automatiquement à la création. L'exigence devient applicable une fois affectée aux postes concernés."
                                        : 'Les modifications sont visibles immédiatement sur le tableau de bord et les affectations existantes.'}
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </form>
        </div>
    );
};

export default RequirementForm;

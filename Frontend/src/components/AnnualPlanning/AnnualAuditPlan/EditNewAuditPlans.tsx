import { useEffect, useState } from "react";
import {
    Text,
    TextInput,
    Select,
    Button,
    Checkbox,
    Group,
    Stepper,
    NumberInput,
    MultiSelect,
    Fieldset,
    ActionIcon,
    Divider,
    Radio,
    Alert,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
    IconCalendar, IconFileText, IconInfoCircle, IconPlus, IconTrash, IconUsers,
    IconClipboardCheck, IconDeviceFloppy, IconX, IconArrowLeft, IconArrowRight,
    IconTarget, IconBuildingFactory, IconRoute2, IconShield, IconChecks, IconCertificate,
    IconBookmark, IconLock,
} from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../UtilityComp/PageHeader";
import FormWithHelp from "../../UtilityComp/FormWithHelp";
import TextEditor from "../../UtilityComp/TextEditor";
import { useForm } from "@mantine/form";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { deleteAuditor, getAuditDetails, getAuditorsByAuditId, updateAudit } from "../../../services/AuditService";
import { modals } from "@mantine/modals";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { getAllActiveAuditArea } from "../../../services/AuditAreaService";
import { isValidRichText, mapIdToName } from "../../../utility/OtherUtilities";
import { auditorRoles, auditTypesLabels, criteriaByLabel } from "../../../Data/DropdownData";
import { getAllAuditors } from "../../../services/AuditorsService";
import { getDateDifferenceInDays } from "../../../utility/DateFormats";
import { getAllActiveWorkProcess } from "../../../services/WorkProcessService";

interface ListItem { id: number; name: string; }

// Mêmes référentiels FR que le formulaire de création (NewAuditPlans) :
// les valeurs saisies à la création sont relues telles quelles ici.
const auditMethods = [
    "Entretiens individuels",
    "Entretiens collectifs",
    "Observations terrain",
    "Vérification documentaire",
    "Inspection d'équipements",
    "Tests et mesures",
    "Analyse d'échantillons",
    "Simulation d'urgence",
];

const documents = [
    "Manuel de management intégré",
    "Politique HSE",
    "Procédures opérationnelles",
    "Instructions de travail",
    "Plans de prévention",
    "Analyses de risques",
    "Registres de conformité",
    "Tableaux de bord HSE",
];

const AuditObjectives = [
    "Vérifier la conformité réglementaire",
    "Évaluer l'efficacité du système de management",
    "Identifier les axes d'amélioration",
];

const EditNewAuditPlans: React.FC = () => {
    const [auditors, setAuditors] = useState<any[]>([]);
    const [auditorsMap, setAuditorsMap] = useState<Record<string, any>>({});
    const [auditorsNameMap, setAuditorsNameMap] = useState<Record<string, any>>({});
    const [activeStep, setActiveStep] = useState(0);
    const [auditAreas, setAuditAreas] = useState<any[]>([]);
    const [processes, setProcesses] = useState<any[]>([]);
    const [planStatus, setPlanStatus] = useState<string>('');

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();

    const form = useForm({
        initialValues: {
            audit: {
                title: "",
                refNumber: "AUD-SSE-XXXX-XXX",
                objectives: [] as string[],
                processes: [],
                scopeId: "",
                methods: [] as string[],
                description: "",
                category: "INTERNAL",
                references: [] as string[],
                auditTypes: {},
                startDate: null,
                endDate: null,
                types: [] as string[],
            },
            auditors: [] as any,
            company: "",
            companyEmail: ""
        },
        validate: {
            audit: {
                title: (value) => (value ? null : "Le titre est requis"),
                objectives: (value) => (value.length > 0 ? null : "Au moins un objectif est requis"),
                processes: (value) => (value.length > 0 ? null : "Au moins un processus est requis"),
                scopeId: (value) => (value ? null : "Le périmètre est requis"),
                methods: (value) => (value.length > 0 ? null : "Au moins une méthode est requise"),
                description: (value) => (isValidRichText(value) ? null : "La description est requise"),
                startDate: (value) => (value ? null : "La date de début est requise"),
                endDate: (value) => (value ? null : "La date de fin est requise"),
                references: (value) => (value.length > 0 || activeStep == 0 ? null : "Au moins une référence est requise"),
                types: (value) => (value?.length > 0 || activeStep == 0 ? null : "Au moins un type est requis"),
            },
            auditors: {
                name: (value) => (value ? null : "L'auditeur est requis"),
                role: (value) => (value ? null : "Le rôle est requis"),
                email: (value) => (value ? null : "L'email est requis"),
            },
            company: (value): string | null => ((form.values.audit.category === "INTERNAL" || value) ? null : "L'entreprise est requise"),
            companyEmail: (value): string | null => ((form.values.audit.category === "INTERNAL" || value) ? null : "L'email de l'entreprise est requis"),
        },
    });

    useEffect(() => {
        getAllAuditors().then((res) => {
            setAuditorsNameMap(res.reduce((acc: any, auditor: any) => {
                acc[auditor.email] = auditor;
                return acc;
            }, {}));
            setAuditors(res.map((item: any) => ({
                value: "" + item.id,
                label: item.employeeName
            })));
            setAuditorsMap(mapIdToName(res));
        }).catch(() => { errorNotification("Impossible de charger les auditeurs"); });

        dispatch(showOverlay());
        getAuditDetails(Number(id)).then((res) => {
            setPlanStatus(String(res.planningStatus || ''));
            form.setFieldValue('audit', {
                ...res,
                startDate: new Date(res.startDate),
                endDate: new Date(res.endDate),
                processes: res.processes.map((item: any) => String(item)),
                scopeId: String(res.scopeId),
                types: Object.keys(res.auditTypes),
            });
        }).catch((err) => {
            errorNotification(err.response?.data?.errorMessage || "Le plan d'audit n'a pas pu être chargé");
        }).finally(() => {
            dispatch(hideOverlay());
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (auditorsNameMap && Object.keys(auditorsNameMap).length > 0) {
            getAuditorsByAuditId(Number(id)).then((res) => {
                form.setFieldValue("auditors", res.map((item: any) => ({
                    ...item,
                    name: "" + auditorsNameMap[item.email]?.id,
                    role: auditorsNameMap[item.email]?.role,
                    email: item?.email || ""
                })));
            }).catch(() => { errorNotification("Impossible de charger les auditeurs de cet audit"); });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auditorsNameMap]);

    useEffect(() => {
        getAllActiveAuditArea().then((res) => {
            setAuditAreas(res.map((item: any) => ({
                ...item,
                value: "" + item.id,
                label: item.name,
            })));
        }).catch(() => { errorNotification("Impossible de charger les périmètres d'audit"); });

        getAllActiveWorkProcess().then((res) => {
            setProcesses(res.map((item: any) => ({
                ...item,
                value: "" + item.id,
                label: item.name,
            })));
        }).catch(() => { errorNotification("Impossible de charger les processus"); });
    }, []);

    const handleNext = () => {
        form.validate();
        if (!form.isValid()) return;
        if (activeStep < 1) {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handlePrev = () => {
        if (activeStep > 0) {
            setActiveStep((prev) => prev - 1);
        }
    };

    const insertAuditor = () => {
        form.insertListItem("auditors", {
            name: "",
            role: "",
            email: "",
        });
    };

    const handleSubmit = () => {
        form.validate();
        if (!form.isValid()) return;
        if (form.values.auditors.length === 0) {
            errorNotification("Ajoutez au moins un auditeur à l'équipe");
            return;
        }

        let values = form.values;
        if (form.values.audit.category == "INTERNAL") {
            let mapped: any = values.auditors.map((auditor: any) => ({ ...auditor, name: auditorsMap[auditor.name]?.employeeName, company: null, companyMail: null }));
            values = { ...values, auditors: mapped };
        } else {
            let mapped: any = values.auditors.map((auditor: any) => ({ ...auditor, company: values.company, companyEmail: values.companyEmail }));
            values = { ...values, auditors: mapped };
        }
        modals.openConfirmModal({
            title: <span className="text-lg">Confirmer la mise à jour</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Souhaitez-vous enregistrer les modifications apportées à ce plan d'audit ?
                </span>
            ),
            labels: { confirm: "Oui, enregistrer", cancel: "Annuler" },
            cancelProps: { color: "gray", variant: "default" },
            confirmProps: { color: "indigo", variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                dispatch(showOverlay());
                updateAudit(values)
                    .then(() => {
                        successNotification("Plan d'audit mis à jour");
                        navigate("/annual-audit-plan");
                    })
                    .catch((err) => {
                        errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue");
                    })
                    .finally(() => {
                        dispatch(hideOverlay());
                    });
            },
        });
    };

    const handleRemoveAuditor = (item: any, index: any) => {
        if (item.id) {
            modals.openConfirmModal({
                title: <span className="text-lg">Retirer cet auditeur ?</span>,
                centered: true,
                children: (
                    <span className="text-sm">
                        L'auditeur sera retiré de l'équipe d'audit. Cette action est irréversible.
                    </span>
                ),
                labels: { confirm: "Oui, retirer", cancel: "Annuler" },
                cancelProps: { color: "gray", variant: "default" },
                confirmProps: { color: "red", variant: "filled" },
                closeOnEscape: false,
                closeOnClickOutside: false,
                withCloseButton: false,
                onConfirm: () => {
                    dispatch(showOverlay());
                    deleteAuditor(item.id)
                        .then(() => {
                            successNotification("Auditeur retiré de l'équipe");
                            form.removeListItem("auditors", index);
                        })
                        .catch((err) => {
                            errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue");
                        })
                        .finally(() => {
                            dispatch(hideOverlay());
                        });
                },
            });
        } else {
            form.removeListItem("auditors", index);
        }
    };

    const renderAuditInfo = () => (
        <div className="space-y-4">
            {/* Section 1 — Calendrier & identification */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-indigo-50/60 border-b border-indigo-200/70 flex items-center gap-2">
                    <div className="p-1 rounded bg-indigo-100">
                        <IconCalendar size={14} className="text-indigo-700" />
                    </div>
                    <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                        Calendrier & identification
                    </h2>
                </header>
                <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <DateInput size="sm" label="Date de début" {...form.getInputProps("audit.startDate")} leftSection={<IconCalendar size={14} />} maxDate={form.values.audit.endDate ? new Date(form.values.audit.endDate) : undefined} placeholder="Sélectionner" withAsterisk />
                        <DateInput size="sm" label="Date de fin" {...form.getInputProps("audit.endDate")} leftSection={<IconCalendar size={14} />} minDate={form.values.audit.startDate ? new Date(form.values.audit.startDate) : undefined} placeholder="Sélectionner" withAsterisk />
                        <NumberInput size="sm" value={getDateDifferenceInDays(form.values.audit.startDate, form.values.audit.endDate)} disabled label="Durée estimée (jours)" placeholder="Calculé automatiquement" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <TextInput size="sm" disabled {...form.getInputProps("audit.refNumber")} label="Référence" placeholder="Référence du plan" />
                        <TextInput size="sm" label="Titre de l'audit" placeholder="Ex. Audit SST trimestriel Q2 2026" {...form.getInputProps("audit.title")} withAsterisk />
                    </div>
                </div>
            </section>

            {/* Section 2 — Objectifs & périmètre */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-indigo-50/60 border-b border-indigo-200/70 flex items-center gap-2">
                    <div className="p-1 rounded bg-indigo-100">
                        <IconTarget size={14} className="text-indigo-700" />
                    </div>
                    <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                        Objectifs & périmètre
                    </h2>
                    <span className="text-[10px] text-slate-500 ml-auto">ISO 19011 §5.4</span>
                </header>
                <div className="p-4 space-y-3">
                    <Checkbox.Group size="sm" {...form.getInputProps('audit.objectives')} label="Objectifs de l'audit" withAsterisk>
                        <div className="flex flex-wrap mt-2 gap-2">
                            {AuditObjectives.map((type) => (
                                <Checkbox.Card key={type}
                                    value={type}
                                    radius="md"
                                    className="group border border-slate-300 transition duration-150 cursor-pointer hover:!border-indigo-500 hover:!bg-indigo-50 data-[checked]:!border-indigo-500 data-[checked]:!bg-indigo-50 data-[checked]:shadow-sm"
                                    p="xs"
                                >
                                    <Group align="center" gap="xs">
                                        <Checkbox.Indicator size="xs" />
                                        <Text size="xs" className="text-slate-800 group-data-[checked]:text-indigo-900 group-data-[checked]:font-medium">
                                            {type}
                                        </Text>
                                    </Group>
                                </Checkbox.Card>
                            ))}
                        </div>
                    </Checkbox.Group>

                    <MultiSelect size="sm" hidePickedOptions {...form.getInputProps("audit.processes")} label="Processus audités" placeholder="Sélectionner les processus" withAsterisk data={processes} />
                    <Select size="sm" {...form.getInputProps("audit.scopeId")} label="Périmètre d'audit" placeholder="Sélectionner le périmètre" data={auditAreas} withAsterisk />
                </div>
            </section>

            {/* Section 3 — Méthodes & description */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-indigo-50/60 border-b border-indigo-200/70 flex items-center gap-2">
                    <div className="p-1 rounded bg-indigo-100">
                        <IconRoute2 size={14} className="text-indigo-700" />
                    </div>
                    <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                        Méthodes & description
                    </h2>
                </header>
                <div className="p-4 space-y-3">
                    <div className="flex flex-col gap-2">
                        <h3 className="text-xs text-slate-700">Méthodes d'audit planifiées <span className="text-red-500">*</span></h3>
                        <Checkbox.Group {...form.getInputProps("audit.methods")} className="p-3 border border-slate-200 rounded-md bg-slate-50/40">
                            <Group className="!grid !grid-cols-2 md:!grid-cols-4 gap-2">
                                {auditMethods.map((method) => (
                                    <Checkbox key={method} value={method} label={method} size="xs" />
                                ))}
                            </Group>
                        </Checkbox.Group>
                    </div>
                    <TextEditor form={form} id="audit.description" title="Description de la méthodologie" />
                </div>
            </section>
        </div>
    );

    const renderAuditorItem = (item: ListItem, index: number) => (
        <div key={index} className="flex flex-col gap-2">
            <Fieldset key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3"
                styles={{
                    root: { borderColor: '#E2E8F0' },
                    legend: { fontSize: 11, fontWeight: 600, color: '#4338CA', padding: '0 6px' }
                }}
                legend={<div className="flex items-center gap-2">
                    <span className="text-[11px] text-indigo-700 uppercase tracking-wider">Auditeur {index + 1}</span>
                    <ActionIcon size="xs" onClick={() => handleRemoveAuditor(item, index)} variant="light" color="red" aria-label="Retirer l'auditeur">
                        <IconTrash size={11} stroke={1.5} />
                    </ActionIcon>
                </div>}>

                {form.values.audit.category === "EXTERNAL" ? (
                    <TextInput size="sm" {...form.getInputProps(`auditors.${index}.name`)} placeholder="Nom de l'auditeur" withAsterisk />
                ) : (
                    <Select size="sm"
                        {...form.getInputProps(`auditors.${index}.name`)}
                        onChange={(e) => {
                            const emp = auditorsMap[e || ""] || {};
                            form.setFieldValue(`auditors.${index}.name`, e || "");
                            form.setFieldValue(`auditors.${index}.email`, emp.email || "");
                            form.setFieldValue(`auditors.${index}.role`, emp.role || "");
                        }}
                        placeholder="Sélectionner un auditeur"
                        withAsterisk
                        searchable
                        data={auditors.filter((x: any) =>
                            !form.values.auditors.some((y: any, i: number) => x.value === y.name && i !== index)
                        )}
                    />
                )}
                <Select size="sm" disabled={form.values.audit.category === "INTERNAL"} placeholder="Rôle" {...form.getInputProps(`auditors.${index}.role`)} data={auditorRoles} withAsterisk />
                <TextInput size="sm" disabled={form.values.audit.category === "INTERNAL"} {...form.getInputProps(`auditors.${index}.email`)} placeholder="Email" withAsterisk />
            </Fieldset>
        </div>
    );

    const renderSection = () => {
        switch (activeStep) {
            case 0:
                return renderAuditInfo();

            case 1:
                return (
                    <div className="space-y-4">
                        {/* Section — Type d'audit HSE */}
                        <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <header className="px-4 py-2.5 bg-indigo-50/60 border-b border-indigo-200/70 flex items-center gap-2">
                                <div className="p-1 rounded bg-indigo-100">
                                    <IconShield size={14} className="text-indigo-700" />
                                </div>
                                <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                                    Type d'audit HSE
                                </h2>
                            </header>
                            <div className="p-4 space-y-3">
                                <MultiSelect size="sm" maxValues={2}
                                    {...form.getInputProps("audit.types")}
                                    label="Type d'audit HSE"
                                    placeholder="Sélectionner le type pour voir les critères recommandés"
                                    description="Choisir le type d'audit HSE à réaliser. Maximum 2 types."
                                    data={auditTypesLabels}
                                    withAsterisk
                                />
                                {form.values.audit.types?.map((x, index) => (
                                    <div key={index} className="rounded-md border border-green-200 bg-green-50/60 p-3">
                                        <Text size="sm" mb="xs" className="!text-green-800">
                                            {x}
                                        </Text>
                                        <Checkbox.Group {...form.getInputProps(`audit.auditTypes.${x}`)}>
                                            <Group className="!grid !grid-cols-1 md:!grid-cols-2 !gap-1.5">
                                                {(criteriaByLabel[x] ?? []).map((item: any) => (
                                                    <Checkbox size="xs" key={item} label={item} value={item} />
                                                ))}
                                            </Group>
                                        </Checkbox.Group>
                                        <div className="mt-3 flex items-start gap-2 p-2 rounded bg-white border border-green-200">
                                            <IconInfoCircle size={14} className="mt-0.5 text-green-700 flex-shrink-0" />
                                            <Text size="xs" className="!text-green-800">
                                                Cocher/décocher selon la réalité de votre site.
                                            </Text>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section — Modalité & équipe */}
                        <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <header className="px-4 py-2.5 bg-indigo-50/60 border-b border-indigo-200/70 flex items-center gap-2">
                                <div className="p-1 rounded bg-indigo-100">
                                    <IconUsers size={14} className="text-indigo-700" />
                                </div>
                                <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                                    Modalité & équipe d'audit
                                </h2>
                                <span className="text-[10px] text-slate-500 ml-auto">ISO 19011 §5.5</span>
                            </header>
                            <div className="p-4 space-y-3">
                                <Radio.Group size="sm" {...form.getInputProps("audit.category")} label="Modalité d'audit (non modifiable après création)" withAsterisk readOnly>
                                    <Group mt="xs">
                                        <Radio value="INTERNAL" label="Audit interne (1ère partie)" />
                                        <Radio value="EXTERNAL" label="Audit externe (2ème/3ème partie)" />
                                    </Group>
                                </Radio.Group>

                                <Divider />

                                <div className="flex justify-between items-center">
                                    <Text size="sm" className="text-slate-800">Équipe d'audit</Text>
                                    <Button size="xs" leftSection={<IconPlus size={13} />} onClick={insertAuditor} color="indigo" variant="light">
                                        Ajouter un auditeur
                                    </Button>
                                </div>

                                {form.values.audit.category === "EXTERNAL" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <TextInput size="sm" withAsterisk {...form.getInputProps(`company`)} placeholder="Nom de l'organisme" label="Cabinet d'audit" />
                                        <TextInput size="sm" withAsterisk {...form.getInputProps(`companyEmail`)} placeholder="Email" label="Email du cabinet" />
                                    </div>
                                )}

                                {form.values.auditors.map(renderAuditorItem)}

                                <div className="bg-amber-50/60 border border-amber-200 rounded-md p-3">
                                    <h3 className="flex items-center gap-1.5 text-xs text-amber-800 mb-1.5 uppercase tracking-wider">
                                        <IconInfoCircle size={13} className="text-amber-700" />
                                        Règles de validation
                                    </h3>
                                    <ul className="list-disc pl-5 text-[11px] grid grid-cols-1 md:grid-cols-2 text-amber-800 space-y-0.5">
                                        <li>Un seul chef d'audit par équipe</li>
                                        <li>Un même employé ne peut être désigné plusieurs fois</li>
                                        <li>Tous les champs sont obligatoires</li>
                                        <li>Seuls les utilisateurs habilités peuvent être sélectionnés</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Section — Références documentaires */}
                        <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <header className="px-4 py-2.5 bg-indigo-50/60 border-b border-indigo-200/70 flex items-center gap-2">
                                <div className="p-1 rounded bg-indigo-100">
                                    <IconBookmark size={14} className="text-indigo-700" />
                                </div>
                                <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                                    Références documentaires internes
                                </h2>
                            </header>
                            <div className="p-4">
                                <Checkbox.Group {...form.getInputProps("audit.references")}>
                                    <Group className="!grid !grid-cols-2 md:!grid-cols-4 gap-2 p-3 bg-slate-50/40 rounded-md border border-slate-200">
                                        {documents.map((doc) => (
                                            <Checkbox key={doc} value={doc} label={doc} size="xs" />
                                        ))}
                                    </Group>
                                </Checkbox.Group>
                            </div>
                        </section>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Planification annuelle', to: '/hs-activities-planning' },
                    { label: "Plan d'audits", to: '/annual-audit-plan' },
                    { label: "Modifier le plan d'audit" },
                ]}
                icon={<IconClipboardCheck size={22} stroke={2} />}
                iconColor="indigo"
                title="Modifier le plan d'audit"
                subtitle="Mise à jour du périmètre, des méthodes et de l'équipe — ISO 19011"
                badge={
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                        <IconBookmark size={13} className="text-slate-500" />
                        <span className="text-xs font-mono text-slate-700">
                            {form.values.audit.refNumber}
                        </span>
                    </div>
                }
                actions={
                    <>
                        <Button variant="default" size="sm" leftSection={<IconX size={15} />} onClick={() => navigate('/annual-audit-plan')}>
                            Annuler
                        </Button>
                        <Button color="indigo" size="sm" leftSection={<IconDeviceFloppy size={15} />} onClick={handleSubmit}>
                            Enregistrer
                        </Button>
                    </>
                }
            />

            {planStatus.toUpperCase() === 'APPROVED' && (
                <Alert color="teal" variant="light" icon={<IconLock size={16} />}>
                    <Text size="sm">Ce plan d'audit est approuvé : les modifications peuvent être restreintes.</Text>
                </Alert>
            )}

            {/* Stepper sobre */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                <Stepper active={activeStep} onStepClick={setActiveStep} allowNextStepsSelect size="sm" color="indigo">
                    <Stepper.Step
                        icon={<IconFileText size={14} />}
                        label={<Text size="sm" className="text-slate-900">Détails de l'audit</Text>}
                        description={<Text size="xs" className="text-slate-500">Périmètre, objectifs, méthodes</Text>}
                    />
                    <Stepper.Step
                        icon={<IconUsers size={14} />}
                        label={<Text size="sm" className="text-slate-900">Équipe & références</Text>}
                        description={<Text size="xs" className="text-slate-500">Auditeurs et documents applicables</Text>}
                    />
                </Stepper>
            </div>

            <FormWithHelp
                helpAccentColor="indigo"
                helpTitle="Aide : Plan d'audit ISO 19011"
                helpSubtitle="Lignes directrices pour l'audit des systèmes de management"
                helpItems={[
                    { key: 'dates', icon: IconCalendar, iconColor: 'orange',
                        title: "Calendrier",
                        content: "Date de début et fin de la phase d'exécution. La durée doit être proportionnée au périmètre (1-5 jours typiques).",
                        isoRef: 'ISO 19011 §6.3' },
                    { key: 'title', icon: IconFileText, iconColor: 'teal',
                        title: "Titre",
                        content: "Intitulé clair. Exemple : « Audit interne SST atelier maintenance Q2 2026 »." },
                    { key: 'objectives', icon: IconTarget, iconColor: 'red',
                        title: "Objectifs",
                        content: "Ce que l'audit doit accomplir : conformité réglementaire, performance du système, opportunités d'amélioration.",
                        isoRef: 'ISO 19011 §5.4.2' },
                    { key: 'processes', icon: IconRoute2, iconColor: 'blue',
                        title: "Processus audités",
                        content: "Sélection des processus opérationnels concernés. Doit être cohérent avec les objectifs définis." },
                    { key: 'scope', icon: IconBuildingFactory, iconColor: 'cyan',
                        title: "Périmètre",
                        content: "Délimitation physique et fonctionnelle : sites, départements, processus, période couverte.",
                        isoRef: 'ISO 19011 §5.4.3' },
                    { key: 'methods', icon: IconChecks, iconColor: 'green',
                        title: "Méthodes",
                        content: "Combinaison d'entretiens, observations, vérification documentaire, tests. Plusieurs méthodes améliorent la fiabilité." },
                    { key: 'types', icon: IconShield, iconColor: 'amber',
                        title: "Type d'audit HSE",
                        content: "Sécurité, environnement, qualité, énergie. Détermine les critères normatifs à vérifier." },
                    { key: 'category', icon: IconCertificate, iconColor: 'violet',
                        title: "Modalité",
                        content: "Interne (1ère partie), fournisseur (2ème partie) ou certification (3ème partie). La modalité est figée après la création.",
                        isoRef: 'ISO 19011 §3.2' },
                    { key: 'auditors', icon: IconUsers, iconColor: 'indigo',
                        title: "Équipe d'audit",
                        content: "Chef d'audit + auditeurs + experts techniques. Vérifier l'absence de conflit d'intérêts.",
                        isoRef: 'ISO 19011 §5.5.4' },
                    { key: 'refs', icon: IconBookmark, iconColor: 'slate',
                        title: "Références documentaires",
                        content: "Documents applicables : politique HSE, procédures, manuel intégré, registres. Servent de critères d'audit." },
                ]}
                helpTip="Le retrait d'un auditeur déjà enregistré est immédiat et irréversible. Les autres modifications ne sont appliquées qu'à l'enregistrement."
            >
                <div className="space-y-5">
                    {renderSection()}

                    {/* Barre de navigation */}
                    <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-4 flex justify-between items-center flex-wrap gap-3">
                        <Button
                            variant="default"
                            leftSection={<IconArrowLeft size={15} />}
                            onClick={handlePrev}
                            disabled={activeStep === 0}
                        >
                            Étape précédente
                        </Button>

                        <div className="text-[11px] text-slate-500">
                            Étape {activeStep + 1} sur 2
                        </div>

                        {activeStep < 1 ? (
                            <Button
                                color="indigo"
                                rightSection={<IconArrowRight size={15} />}
                                onClick={handleNext}
                            >
                                Étape suivante
                            </Button>
                        ) : (
                            <Button
                                color="indigo"
                                leftSection={<IconDeviceFloppy size={15} />}
                                onClick={handleSubmit}
                            >
                                Enregistrer les modifications
                            </Button>
                        )}
                    </div>
                </div>
            </FormWithHelp>
        </div>
    );
};

export default EditNewAuditPlans;

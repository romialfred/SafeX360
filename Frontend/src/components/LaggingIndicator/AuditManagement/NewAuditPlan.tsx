import { useEffect, useState } from "react";
import {
    Text,
    Card,
    TextInput,
    Select,
    Button,
    Stack,
    Checkbox,
    Group,
    Stepper,
    NumberInput,
    MultiSelect,
    Fieldset,
    ActionIcon,
    Divider,
    Radio,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconCalendar, IconClipboardCheck, IconDeviceFloppy, IconFileText, IconInfoCircle, IconPlus, IconTrash, IconUsers, IconX } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { PremiumPageHeader } from "../../../design-system/premium";
import TextEditor from "../../UtilityComp/TextEditor";
import { useForm } from "@mantine/form";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { createAudit } from "../../../services/AuditService";
import { modals } from "@mantine/modals";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { getAllActiveAuditArea } from "../../../services/AuditAreaService";
import { isValidRichText, mapIdToName } from "../../../utility/OtherUtilities";
import { auditTypesLabels, criteriaByLabel } from "../../../Data/DropdownData";
import { getAllAuditors } from "../../../services/AuditorsService";
import { getDateDifferenceInDays } from "../../../utility/DateFormats";
import { getAllActiveWorkProcess } from "../../../services/WorkProcessService";
import {
    AUDIT_METHOD_OPTIONS,
    AUDIT_OBJECTIVE_OPTIONS,
    AUDIT_REFERENCE_OPTIONS,
    AUDITOR_ROLE_OPTIONS,
} from "./auditLabels";

interface ListItem { id: number; name: string; }


const NewAuditPlan: React.FC = () => {
    const [auditors, setAuditors] = useState<any[]>([]);
    const [auditorsMap, setAuditorsMap] = useState<Record<string, any>>({});
    const [activeStep, setActiveStep] = useState(0);

    const [processes, setProcesses] = useState<any[]>([]);


    useEffect(() => {
        getAllAuditors().then((res) => {
            setAuditors(res.map((item: any) => ({
                value: "" + item.id,
                label: item.employeeName
            })));
            setAuditorsMap(mapIdToName(res));
        }).catch(() => {

        })
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
    const [auditAreas, setAuditAreas] = useState<any[]>([]);

    const dispatch = useDispatch();
    const navigate = useNavigate();

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

                types: (value) => (value.length > 0 || activeStep == 0 ? null : "Au moins un type est requis"),
            },
            auditors: {
                name: (value) => (value ? null : "L'auditeur est requis"),
                role: (value) => (value ? null : "Le rôle est requis"),
                email: (value) => (value ? null : "L'adresse e-mail est requise"),
            },
            company: (value): string | null => ((form.values.audit.category === "INTERNAL" || value) ? null : "La société est requise"),
            companyEmail: (value): string | null => ((form.values.audit.category === "INTERNAL" || value) ? null : "L'e-mail de la société est requis"),



        },

    });
    useEffect(() => {
        getAllActiveAuditArea().then((res) => {
            setAuditAreas(res.map((item: any) => {
                return {
                    ...item,
                    value: "" + item.id,
                    label: item.name,
                }
            }));
        }).catch((_err) => {
        })

        getAllActiveWorkProcess().then((res) => {
            setProcesses(res.map((item: any) => {
                return {
                    ...item,
                    value: "" + item.id,
                    label: item.name,
                }
            }));
        }).catch((_err) => {
        })


    }, []);



    const insertAuditor = () => {
        form.insertListItem("auditors", {
            name: "",
            role: "",
            email: "",
        })
    }


    const handleSubmit = () => {

        form.validate();
        if (!form.isValid()) return;
        if (form.values.auditors.length === 0) {
            errorNotification("Ajoutez au moins un auditeur avant d'enregistrer");
            return;
        }

        let values = form.values;
        if (form.values.audit.category == "INTERNAL") {
            let auditors: any = values.auditors.map((auditor: any) => ({ ...auditor, name: auditorsMap[auditor.name]?.employeeName, company: null, companyMail: null }));;
            values = { ...values, auditors: auditors };
        }
        else {
            let auditors: any = values.auditors.map((auditor: any) => ({ ...auditor, company: values.company, companyEmail: values.companyEmail }));;
            values = { ...values, auditors: auditors };
        }
        modals.openConfirmModal({
            title: <span className="text-base">Confirmer la programmation</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Programmer cet audit avec le cadrage et l'équipe renseignés ?
                </span>
            ),
            labels: { confirm: "Oui, programmer", cancel: "Annuler" },
            cancelProps: { color: "gray", variant: "default" },
            confirmProps: { color: "indigo", variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                dispatch(showOverlay());
                createAudit(values)
                    .then(() => {
                        successNotification("Audit programmé");
                        navigate("/audit-management");
                    }
                    ).catch((err) => {
                        errorNotification(err.response?.data?.errorMessage || "L'enregistrement a échoué");
                    }
                    ).finally(() => {
                        dispatch(hideOverlay());
                    }
                    )
            },
        });



    };


    useEffect(() => {
        form.setFieldValue('auditors', []);
    }, [form.values.audit.category])





    const renderAuditInfo = () => (
        <div className="p-2 flex flex-col gap-8">
            {/* LOT 40 P1: responsive grid breakpoints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <DateInput label="Date de début" {...form.getInputProps("audit.startDate")} leftSection={<IconCalendar />} maxDate={form.values.audit.endDate ? new Date(form.values.audit.endDate) : undefined} placeholder="Sélectionner la date de début" withAsterisk />
                <DateInput label="Date de fin" {...form.getInputProps("audit.endDate")} leftSection={<IconCalendar />} minDate={form.values.audit.startDate ? new Date(form.values.audit.startDate) : undefined} placeholder="Sélectionner la date de fin" withAsterisk />
                <NumberInput value={getDateDifferenceInDays(form.values.audit.startDate, form.values.audit.endDate)} disabled label="Durée estimée (jours)" placeholder="Calcul automatique" withAsterisk />
            </div>
            <div className="grid grid-cols-2 gap-4 ">
                <TextInput disabled {...form.getInputProps("audit.refNumber")} label="Référence de l'audit" placeholder="Générée automatiquement" withAsterisk />
                <TextInput label="Titre de l'audit" placeholder="Ex. Audit SST atelier maintenance Q2" {...form.getInputProps("audit.title")} withAsterisk />

            </div>
            <Checkbox.Group size="md"
                {...form.getInputProps('audit.objectives')}
                label="Objectifs de l'audit"
                withAsterisk
            >
                <div className="flex flex-wrap mt-5 gap-2">
                    {AUDIT_OBJECTIVE_OPTIONS.map((objective) => (
                        <div key={objective.value}>
                            <Checkbox.Card
                                value={objective.value}
                                radius="md"
                                className="group border border-gray-300 transition duration-150 cursor-pointer  hover:!border-primary hover:!bg-primary/10  data-[checked]:!border-primary data-[checked]:!bg-primary/20 data-[checked]:shadow-sm"
                                p="xs"
                            >
                                <Group align="center" gap="xs">
                                    <Checkbox.Indicator size="xs" className=" text-blue-600" />
                                    <Text
                                        size="sm"
                                        className="text-gray-800 group-data-[checked]:text-blue-900 group-data-[checked]:font-medium"
                                    >
                                        {objective.label}
                                    </Text>
                                </Group>
                            </Checkbox.Card>
                        </div>
                    ))}
                </div>
            </Checkbox.Group>

            <div>
                <MultiSelect hidePickedOptions {...form.getInputProps("audit.processes")} label="Processus audités" placeholder="Sélectionner les processus audités" withAsterisk data={processes} />
            </div>

            <Select {...form.getInputProps("audit.scopeId")} label="Périmètre de l'audit" placeholder="Sélectionner le périmètre" data={auditAreas} withAsterisk />
            <div className="flex flex-col gap-2">
                <h2 className="text-sm text-slate-800">Méthodes prévues <span className="text-red-500">*</span></h2>
                <Checkbox.Group {...form.getInputProps("audit.methods")} className="p-4 border border-gray-300 rounded-lg ">
                    <Group className="!grid !grid-cols-4 gap-2">

                        {AUDIT_METHOD_OPTIONS.map((method) => (
                            <Checkbox
                                key={method.value}
                                value={method.value}
                                label={method.label}
                                className="!text-gray-700 !font-medium"
                            />))
                        }
                    </Group>
                </Checkbox.Group>
            </div>
            <TextEditor form={form} id="audit.description" title="Description de la méthodologie" />



        </div>
    );

    const renderAuditorItem = (_item: ListItem, index: number) => (
        <div key={index} className="flex flex-col gap-6" >
            {/* LOT 40 P1: responsive grid + teal accent on fieldset legend */}
            <Fieldset key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" legend={<div className="flex gap-5">
                <div className="text-base text-teal-700">Auditeur {index + 1}</div>
                <ActionIcon onClick={() => form.removeListItem("auditors", index)} variant="filled" color="red" aria-label={`Retirer l'auditeur ${index + 1}`}>
                    <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
                </ActionIcon>
            </div>}>

                {form.values.audit.category === "EXTERNAL" ? (
                    <TextInput
                        {...form.getInputProps(`auditors.${index}.name`)}
                        placeholder="Nom de l'auditeur"
                        withAsterisk
                    />
                ) : (
                    <Select
                        {...form.getInputProps(`auditors.${index}.name`)}
                        onChange={(e) => {
                            const emp = auditorsMap[e || ""] || {};
                            form.setFieldValue(`auditors.${index}.name`, e || "");
                            form.setFieldValue(`auditors.${index}.email`, emp.email || "");
                            form.setFieldValue(`auditors.${index}.role`, emp.role || "");
                        }}
                        placeholder="Sélectionner l'auditeur"
                        withAsterisk
                        searchable
                        data={auditors.filter((x: any) =>
                            !form.values.auditors.some((y: any, i: number) => x.value === y.name && i !== index)
                        )}
                    />
                )}
                <Select disabled={form.values.audit.category === "INTERNAL"} placeholder="Rôle"  {...form.getInputProps(`auditors.${index}.role`)} data={AUDITOR_ROLE_OPTIONS} withAsterisk />
                <TextInput disabled={form.values.audit.category === "INTERNAL"} {...form.getInputProps(`auditors.${index}.email`)} placeholder="Adresse e-mail" withAsterisk />
            </Fieldset>

        </div>
    );







    const renderSection = () => {
        switch (activeStep) {
            case 0:
                return renderAuditInfo()
                    ;

            case 1:
                return (
                    <Stack my={10}>


                        {/* Types d'audit HSE */}
                        <div className="grid grid-cols-1 gap-4">
                            <MultiSelect maxValues={2}
                                {...form.getInputProps("audit.types")}
                                label="Type d'audit HSE"
                                placeholder="Sélectionner le type pour afficher les critères recommandés"
                                data={auditTypesLabels}

                                withAsterisk
                            />

                            {form.values.audit.types?.map((x, index) => (
                                <Card key={index} shadow="sm" radius="md" withBorder className="!bg-green-50">
                                    <Text size="md" mb="sm" className="!text-green-700">
                                        {x}
                                    </Text>
                                    <Checkbox.Group {...form.getInputProps(`audit.auditTypes.${x}`)} className="flex flex-col  text-gray-600">
                                        <Group className="!grid !grid-cols-2 !gap-2">
                                            {criteriaByLabel[x].map((item: any) => (
                                                <Checkbox size="xs"
                                                    key={item}
                                                    label={item}
                                                    value={item}
                                                />
                                            ))}
                                        </Group>
                                    </Checkbox.Group>
                                    <div className="mt-4 flex items-start gap-2 p-3 rounded-xl  bg-green-100">
                                        <IconInfoCircle size={18} className="mt-1 text-green-700" />
                                        <Text size="sm" color="dimmed" className="!text-green-700">
                                            Ajustez les critères cochés selon la réalité de votre site.
                                        </Text>
                                    </div>
                                </Card>)
                            )}
                        </div>
                        <Radio.Group size="md" {...form.getInputProps("audit.category")}
                            label="Modalité d'audit"
                            withAsterisk
                        >
                            <Group mt="xs">
                                <Radio value="INTERNAL" label="Audit interne" />
                                <Radio value="EXTERNAL" label="Audit externe" />

                            </Group>
                        </Radio.Group>

                        <Divider />

                        <div className="flex justify-between">
                            <Text size="lg">Équipe d'audit</Text>
                            <Button leftSection={<IconPlus />} onClick={insertAuditor}>
                                Ajouter un auditeur
                            </Button>
                        </div>
                        {form.values.audit.category === "EXTERNAL" && <div className="grid grid-cols-2 gap-5">
                            <TextInput withAsterisk {...form.getInputProps(`company`)} placeholder="Nom de la société" label="Société des auditeurs" />
                            <TextInput withAsterisk {...form.getInputProps(`companyEmail`)} placeholder="Adresse e-mail" label="E-mail de la société" />
                        </div>
                        }

                        {form.values.auditors.map(renderAuditorItem)}
                        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
                            <h2 className="flex items-center gap-2 text-base text-yellow-800 mb-2">
                                <IconInfoCircle size={18} className="text-yellow-600" />
                                Règles de validation
                            </h2>
                            <ul className="list-disc pl-6 text-sm grid grid-cols-2  text-yellow-700 space-y-1">
                                <li>Un seul auditeur principal par équipe d'audit</li>
                                <li>Un même employé ne peut pas être ajouté deux fois</li>
                                <li>Tous les champs sont obligatoires</li>
                                <li>Seuls les employés déclarés auditeurs sont sélectionnables</li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-2">
                            <h2 className="text-sm text-slate-800">Références documentaires internes applicables</h2>
                            <Checkbox.Group {...form.getInputProps("audit.references")} className="p-4 border border-gray-300 rounded-lg ">
                                <Group className="!grid !grid-cols-4 gap-2">
                                    {AUDIT_REFERENCE_OPTIONS.map((doc) => (
                                        <Checkbox size="sm"
                                            key={doc.value}
                                            value={doc.value}
                                            label={doc.label}
                                            className="!text-gray-700 !font-medium"
                                        />
                                    ))}
                                </Group>

                            </Checkbox.Group>
                        </div>
                    </Stack>
                );




            default:
                return null;
        }
    };
    return (
        <div className="space-y-5 w-full">
            {/* Refonte ISO Phase 2 : PremiumPageHeader avec reference ISO 19011 */}
            <PremiumPageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des audits', to: '/audit-management' },
                    { label: 'Programmer un audit' },
                ]}
                icon={<IconClipboardCheck size={22} stroke={2} />}
                iconColor="indigo"
                title="Programmer un nouvel audit"
                isoRef="AUDIT"
                actions={
                    <>
                        <Button
                            variant="default"
                            size="sm"
                            leftSection={<IconX size={15} />}
                            onClick={() => navigate(-1)}
                        >
                            Annuler
                        </Button>
                        <Button
                            color="indigo"
                            size="sm"
                            leftSection={<IconDeviceFloppy size={15} />}
                            onClick={handleSubmit}
                        >
                            Enregistrer
                        </Button>
                    </>
                }
            />

            <Card className="bg-white" shadow="sm" withBorder radius="md">
                <Stepper active={activeStep} onStepClick={setActiveStep} allowNextStepsSelect color="indigo" size="sm">
                    <Stepper.Step icon={<IconFileText size={16} />} label={<Text size="sm">Informations</Text>} description={<Text size="xs" c="dimmed">Cadrage et planning</Text>} />
                    <Stepper.Step icon={<IconUsers size={16} />} label={<Text size="sm">Processus & équipe</Text>} description={<Text size="xs" c="dimmed">Périmètre et auditeurs</Text>} />
                </Stepper>

                <div className="mt-6">{renderSection()}</div>

                <div className="flex gap-4 justify-center mt-6">
                    {activeStep > 0 && (
                        <Button variant="default" onClick={handlePrev}>
                            Étape précédente
                        </Button>
                    )}
                    {activeStep < 1 ? (
                        <Button onClick={handleNext} color="indigo">
                            Étape suivante
                        </Button>
                    ) : (
                        <>
                            <Button type="button" onClick={handleSubmit} color="indigo">
                                Programmer l'audit
                            </Button>
                        </>
                    )}
                </div>
            </Card>
        </div>
    )
}

export default NewAuditPlan
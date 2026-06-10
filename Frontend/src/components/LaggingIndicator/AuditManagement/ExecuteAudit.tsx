import { useEffect, useRef, useState } from "react";
import {
    Card,
    Text,
    Button,
    Group,
    Stack,
    TextInput,
    Grid,
    ActionIcon,
    Select,
    Fieldset,
    Stepper,
} from "@mantine/core";
import { DateInput, TimeInput } from "@mantine/dates";
import {
    IconCalendar,
    IconClipboardCheck,
    IconClock,
    IconFilePencil,
    IconPlus,
    IconTrash,
    IconUserCheck,
    IconUsers,
} from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../UtilityComp/PageHeader";
import TextEditor from "../../UtilityComp/TextEditor";
import { useForm } from "@mantine/form";
import { executeAudit, getAreasByAuditId, reportExists } from "../../../services/AuditService";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { GetAllAuditArea } from "../../../services/AuditAreaService";
import { mapIdToName } from "../../../utility/OtherUtilities";
import ImagePdfDropzone from "../../UtilityComp/ImagePdfDropzone";
import { getEmployeeDropdown } from "../../../services/EmployeeService";
import { PickList } from "primereact/picklist";
import { modals } from "@mantine/modals";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { getBase64 } from "../../../utility/DocumentUtility";
import { REC_STATUS_OPTIONS, REC_TYPE_OPTIONS, VALIDATOR_STATUS_OPTIONS } from "./auditLabels";


const sectionMap = ['audit-area', 'audit-report', 'recommendations'];
const ExecuteAudit = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [active, setActive] = useState(0); // step index (0 to 2)
    const section = sectionMap[active];
    const [selectedArea, setSelectedArea] = useState<any>({});
    const [areas, setAreas] = useState<any[]>([]);
    const [areaMap, setAreaMap] = useState<Record<string, any>>({});
    const [employees, setEmployees] = useState<any[]>([]);
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
    const ref = useRef<HTMLInputElement>(null);
    const ref1 = useRef<HTMLInputElement>(null);
    const [submitted, setSubmitted] = useState(false);


    useEffect(() => {
        dispatch(showOverlay());
        reportExists(id).then((res) => {
            if (res) {

                setSubmitted(true);
                modals.openConfirmModal({
                    title: <span className="text-base">Rapport déjà soumis</span>,
                    centered: true,
                    children: (
                        <span className="text-sm">
                            Le rapport de cet audit a déjà été soumis.
                        </span>
                    ),
                    onConfirm: () => {
                        modals.closeAll();
                        navigate("/audit-management");
                    },
                    labels: { confirm: "OK", cancel: "Non" },
                    cancelProps: { color: "red", display: "none", variant: "filled" },
                    confirmProps: { color: "indigo", variant: "filled" },
                    closeOnEscape: false,
                    closeOnClickOutside: false,
                    withCloseButton: false,
                    closeOnConfirm: true
                });
            }
        }).catch((_err) => {

        })
        getAreasByAuditId(id).then((res) => {
            setAreas(res);
        }
        ).catch((_err) => {
        }).finally(() => {
            dispatch(hideOverlay());
        }
        );
        GetAllAuditArea({}).then((res) => {
            setAreaMap(mapIdToName(res));
        }).catch((_err) => {
        })
        getEmployeeDropdown().then((res) => {
            setEmployees(res);
        }).catch((_err) => {
        })
    }, []);

    const addRecommendation = () => {
        form.insertListItem("recommendations", {
            title: "",
            description: "",
            type: "",
            department: "",
            goal: "",
            startDate: "",
            endDate: "",
            assessment: "",
            areaId: "",
            auditId: id,
            status: undefined,
        })
    };

    const form = useForm({
        initialValues: {
            executions: [] as any[],
            report: {
                preparerName: "",
                preparerRole: "",
                preDate: "",
                validatorName: "",
                validatorRole: "",
                validatorStatus: "",
                rejectionComment: "",
                auditId: id,
                docs: [],
                description: "",
            },
            recommendations: [],
            contributors: [],
        },
        validate: {

        },
    })
    const pickerControl = (
        <ActionIcon variant="subtle" color="gray" onClick={() => ref.current?.showPicker()}>
            <IconClock size={16} stroke={1.5} />
        </ActionIcon>
    );

    const pickerControl1 = (
        <ActionIcon variant="subtle" color="gray" onClick={() => ref1.current?.showPicker()}>
            <IconClock size={16} stroke={1.5} />
        </ActionIcon>
    );


    const addContributor = () => {
        form.insertListItem("contributors", {
            name: "",
            role: "",
            section: "",
            auditId: id,
        })

    }

    const removeContributor = (id: number) => {
        form.removeListItem("contributors", id);
    }


    const removeRecommendation = (id: number) => {
        form.removeListItem("recommendations", id);
    };


    const addInterview = () => {
        form.insertListItem("executions", {
            topic: "",
            interviewDate: "",
            location: "",
            startTime: "",
            endTime: "",
            attendees: [],
            findings: "",
            evidence: [],
            areaId: selectedArea.id,
            emps: employees,
            index: form.values.executions.length,
        })

    }

    const removeInterview = (index: number) => {

        let val = form.values.executions.filter((x: any) => x.index !== index);
        form.setFieldValue(`executions`, val.map((x: any, i: number) => ({ ...x, index: i })));
    };


    const onChange = (event: any, index: any) => {
        form.setFieldValue(`executions.${index}.emps`, event.source?.map((x: any) => ({ ...x, pos: "Source" })));
        form.setFieldValue(`executions.${index}.attendees`, (event.target?.map((x: any) => ({ ...x, pos: "Target" }))));
    };

    const handleRoleChange = (id: number, value: string, index: any) => {
        let selEmp: any = form.values.executions[index]?.attendees;
        form.setFieldValue(`executions.${index}.attendees`, selEmp.map((item: any) => item.id === id ? { ...item, role: value } : item)

        )
        setEditingRoleId(null); // hide dropdown after selection
    };


    const handleSubmit = () => {
        form.validate();
        if (!form.isValid()) return;
        modals.openConfirmModal({
            title: <span className="text-base">Confirmer l'exécution</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Soumettre l'exécution de cet audit (interventions par domaine, rapport et recommandations) ?
                </span>
            ),
            labels: { confirm: "Oui, soumettre", cancel: "Annuler" },
            cancelProps: { color: "gray", variant: "default" },
            confirmProps: { color: "indigo", variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: async () => {
                const values = form.values;
                const docs = await convertFilesToBase64(values.report.docs);
                const executions = await Promise.all(
                    values.executions.map(async (item: any) => {
                        const evidence = await convertFilesToBase64(item.evidence);
                        return {
                            ...item,
                            evidence: evidence,
                        };
                    }
                    )
                );


                dispatch(showOverlay());
                executeAudit({ ...values, report: { ...values.report, docs }, executions })
                    .then(() => {
                        successNotification("Exécution de l'audit enregistrée");
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
    }
    const convertFilesToBase64 = async (files: any[]) => {
        const fileObjects = await Promise.all(
            files.map(async (image) => {
                const base64: any = await getBase64(image.file);
                return {
                    id: image.id ?? null,
                    name: image.file.name,

                    file: base64.split(',')[1],
                };
            })
        );
        return fileObjects;
    };
    const itemTemplate = (item: any, index: any) => {
        return (
            <div className={`  flex gap-5 justify-between self-center`}>
                <div className='flex flex-col gap-1'>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-400">{item.empNumber}</span>
                </div>
                {item.pos === "Target" && (
                    <div className='flex items-center gap-2 w-[220px]'>
                        {editingRoleId === item.id || !item.role ? (
                            <Select
                                autoFocus
                                placeholder="Sélectionner le rôle"
                                data={[
                                    { value: "Committee Member", label: "Membre du comité" },
                                    { value: "Committee Chair", label: "Président du comité" },
                                    { value: "Committee Secretary", label: "Secrétaire du comité" },
                                ]}
                                value={item.role}
                                onChange={(val) => handleRoleChange(item.id, val!, index)}
                                className="w-full"
                            />
                        ) : (
                            <div
                                className="cursor-pointer text-sm px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                onClick={() => setEditingRoleId(item.id)}
                            >
                                {item.role}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };


    const renderAreaCards = () => (
        <div className="flex flex-col gap-4">
            {areas.map((area) => (
                <Card
                    key={area.id}
                    withBorder
                    p={10}
                    shadow={selectedArea.id === area.id ? "md" : "sm"}
                    bg={selectedArea.id === area.id ? "blue.1" : "white"}
                    bd={selectedArea.id === area.id ? "blue.5" : "gray.2"}
                    onClick={() => {
                        setSelectedArea(area);
                    }}
                    className="cursor-pointer hover:shadow-lg"
                >
                    <Stack gap={2}>
                        <p className="text-lg">{areaMap[area.auditAreaId]?.name}</p>
                        <Text>{areaMap[area.auditAreaId]?.type}</Text>
                        <Text color="dimmed" size="sm">{areaMap[area.auditAreaId]?.ownerName}</Text>
                    </Stack>
                </Card>
            ))}
        </div>
    );

    const renderInterviewForm = () => (
        <Card withBorder shadow="md" >
            <Stack>
                <div className="flex justify-between">
                    <p className="text-lg">Interventions sur le domaine</p>
                    <Button leftSection={<IconPlus />} onClick={addInterview}>
                        Ajouter un entretien
                    </Button>
                </div>

                {/* LOT 40 P1: teal accent on legend + descriptive aria-label */}
                {form.values.executions.filter(x => x.areaId == selectedArea.id).map((x, index: any) => (
                    <Fieldset key={index} className="grid grid-cols-1 md:grid-cols-2 gap-5" legend={<div className="flex gap-5">
                        <div className="text-base text-teal-700">Entretien {index + 1}</div>
                        <ActionIcon onClick={() => removeInterview(x.index)} variant="filled" color="red" aria-label={`Retirer l'entretien ${index + 1}`}>
                            <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
                        </ActionIcon>
                    </div>}>
                        <TextInput className="col-span-2" label="Sujet"  {...form.getInputProps(`executions.${x.index}.topic`)} />
                        <DateInput {...form.getInputProps(`executions.${x.index}.interviewDate`)} label="Date de l'entretien" placeholder="jj-mm-aaaa" />
                        <TextInput {...form.getInputProps(`executions.${x.index}.location`)} label="Lieu" placeholder="Lieu de l'entretien" />
                        <TimeInput label="Heure de début" ref={ref} rightSection={pickerControl} withAsterisk {...form.getInputProps(`executions.${x.index}.startTime`)} />

                        <TimeInput label="Heure de fin" ref={ref1} rightSection={pickerControl1} withAsterisk {...form.getInputProps(`executions.${x.index}.endTime`)} />


                        <div className="col-span-2">

                            <TextEditor form={form} id={`executions.${x.index}.findings`} title="Constats" />
                        </div>

                        <div className="col-span-2">

                            <PickList
                                dataKey="id"
                                filter
                                filterBy="name"
                                sourceFilterPlaceholder="Rechercher par nom"
                                showTargetControls={false}
                                showSourceControls={false}
                                targetFilterPlaceholder="Rechercher par nom"
                                source={form.getValues().executions[x.index]?.emps}
                                target={form.getValues().executions[x.index]?.attendees}
                                onChange={(event) => onChange(event, x.index)}
                                itemTemplate={(item) => itemTemplate(item, x.index)}
                                breakpoint="1280px"
                                sourceHeader={`Employés (${form.getValues().executions[x.index]?.emps.length})`}
                                targetHeader={`Participants (${form.getValues().executions[x.index]?.attendees?.length})`}
                                sourceStyle={{ height: '24rem' }}
                                targetStyle={{ height: '24rem' }}
                            />

                        </div>

                        <div className="col-span-2">
                            <p className="text-lg ">Preuves</p>
                            <ImagePdfDropzone name="Preuves" id={`executions.${x.index}.evidence`} form={form} />
                        </div>

                    </Fieldset>
                ))}
            </Stack>
        </Card>
    );



    return (
        submitted ? <div></div> : <div className="space-y-5 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des audits', to: '/audit-management' },
                    { label: "Exécution de l'audit" },
                ]}
                icon={<IconClipboardCheck size={22} stroke={2} />}
                iconColor="indigo"
                title="Exécuter l'audit"
                subtitle="Saisie des entretiens par domaine, du rapport et des recommandations"
            />

            <Card className="bg-white" shadow="sm" withBorder radius="md">
                <Stepper allowNextStepsSelect={false} active={active} onStepClick={setActive} color="indigo" size="sm">
                    <Stepper.Step label="Étape 1" description="Domaines d'audit" />
                    <Stepper.Step label="Étape 2" description="Rapport d'audit" />
                    <Stepper.Step label="Étape 3" description="Recommandations" />
                </Stepper>
                <div className="mt-6">
                    {section === "audit-area" && (
                        <div className="grid grid-cols-4 gap-5 ">
                            {renderAreaCards()}
                            <div className="col-span-3">

                                {!selectedArea.id ? (
                                    <Text >Sélectionnez un domaine pour saisir les détails d'exécution</Text>
                                ) : (
                                    renderInterviewForm()
                                )}
                            </div>
                        </div>
                    )}

                    {section === "audit-report" && (
                        <Stack>
                            {/* <Card shadow="md" withBorder className={`transition-all ${submitted ? "bg-yellow-100" : "bg-white"}`}>
                            <Group justify="space-between">
                                <div className="flex gap-2 ">
                                    <IconFileText color="gray" />
                                    <div className="flex flex-col gap-1 ">
                                        <p className="text-lg text-gray-600">Report Status</p>
                                        <p className="text-sm text-gray-400 ">Draft</p>
                                    </div>


                                </div>

                                {!submitted ? (
                                    <Button onClick={() => setSubmitted(true)}>Submit for Validation</Button>
                                ) : (
                                    <Text c="green">Submitted</Text>
                                )}
                            </Group>
                        </Card> */}

                            <Card shadow="md" withBorder>
                                <p className="flex items-center text-lg mb-2 text-gray-600"> <IconFilePencil stroke={1.5} size={20} /> Rédacteur du rapport</p>
                                <Grid>
                                    <Grid.Col span={4}><TextInput {...form.getInputProps("report.preparerName")} label="Nom" placeholder="Nom du rédacteur" /></Grid.Col>
                                    <Grid.Col span={4}><TextInput label="Fonction" placeholder="Fonction du rédacteur" {...form.getInputProps("report.preparerRole")} /></Grid.Col>
                                    <Grid.Col span={4}><DateInput leftSection={<IconCalendar />} label="Date" placeholder="jj-mm-aaaa" {...form.getInputProps("report.preDate")} /></Grid.Col>
                                </Grid>
                            </Card>

                            <Card shadow="md" withBorder>
                                <Group justify="space-between" mb="xs">
                                    <p className="flex text-lg items-center text-gray-600"><IconUsers stroke={1.5} size={20} />  Contributeurs</p>
                                    <Button size="xs" leftSection={<IconPlus />} onClick={addContributor}>Ajouter un contributeur</Button>
                                </Group>
                                {form.values.contributors.map((_item, index) => (
                                    // LOT 40 P1: responsive grid + teal legend + descriptive aria-label
                                    <Fieldset key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5" legend={<div className="flex gap-5">
                                        <div className="text-base text-teal-700">Contributeur {index + 1}</div>
                                        <ActionIcon onClick={() => removeContributor(index)} variant="filled" color="red" aria-label={`Retirer le contributeur ${index + 1}`}>
                                            <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
                                        </ActionIcon>
                                    </div>}>
                                        <TextInput label="Nom" placeholder="Nom du contributeur" {...form.getInputProps(`contributors.${index}.name`)} />
                                        <TextInput label="Fonction" placeholder="Fonction du contributeur"  {...form.getInputProps(`contributors.${index}.role`)} />
                                        <TextInput label="Section" placeholder="Section concernée"  {...form.getInputProps(`contributors.${index}.section`)} />

                                    </Fieldset>
                                ))}
                            </Card>

                            <Card shadow="md" withBorder>
                                <p className="flex items-center mb-2 text-lg text-gray-600"><IconUserCheck stroke={1.5} size={20} /> Validateur du rapport</p>
                                <Grid mb={10}>
                                    <Grid.Col span={4}><TextInput {...form.getInputProps("report.validatorName")} label="Nom" placeholder="Nom du validateur" /></Grid.Col>
                                    <Grid.Col span={4}><TextInput label="Fonction" placeholder="Fonction du validateur" {...form.getInputProps("report.validatorRole")} /></Grid.Col>
                                    <Grid.Col span={4}><Select  {...form.getInputProps("report.validatorStatus")} placeholder="Sélectionner le statut" data={VALIDATOR_STATUS_OPTIONS} label="Statut" /></Grid.Col>
                                </Grid>
                                {form.values.report?.validatorStatus == "Rejected" && < TextInput label="Motif du rejet" placeholder="Saisir le motif" {...form.getInputProps("report.rejectionComment")} />}
                            </Card>

                            <Card shadow="md" withBorder>
                                <p className="text-lg text-gray-600">Documents justificatifs</p>

                                <ImagePdfDropzone name="Documents justificatifs" id="report.docs" form={form} />
                            </Card>

                            <Card shadow="md" withBorder>
                                <TextEditor form={form} id="report.description" title="Contenu du rapport" />
                            </Card>

                            {/* <div className="flex gap-4 justify-end">
                            <Button variant="default">Save as Draft</Button>
                            <Button color="blue">Submit for Validation</Button>
                        </div> */}
                        </Stack>
                    )}

                    {/* Recommendations section */}
                    {section === "recommendations" && (
                        <Stack>
                            <div className="flex justify-between">
                                <p className="text-lg text-gray-600">Recommandations d'audit</p>
                                <Button leftSection={<IconPlus size={16} />} onClick={addRecommendation}>
                                    Ajouter une recommandation
                                </Button>
                            </div>


                            {form.values.recommendations.map((_rec, index) => (
                                // LOT 40 P1: teal legend + descriptive aria-label
                                <Fieldset key={index} className="grid grid-cols-2 gap-5" legend={<div className="flex gap-5">
                                    <div className="text-base text-teal-700">Recommandation {index + 1}</div>
                                    <ActionIcon onClick={() => removeRecommendation(index)} variant="filled" color="red" aria-label={`Retirer la recommandation ${index + 1}`}>
                                        <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
                                    </ActionIcon>
                                </div>}>
                                    <Select {...form.getInputProps(`recommendations.${index}.areaId`)}
                                        label="Domaine d'audit"
                                        placeholder="Sélectionner le domaine"
                                        data={areas.map((a) => ({ value: "" + a.id, label: areaMap[a.auditAreaId]?.name }))}
                                    />
                                    <TextInput {...form.getInputProps(`recommendations.${index}.title`)}
                                        label="Titre"
                                        placeholder="Titre de la recommandation" />

                                    <div className="col-span-2">
                                        <TextEditor form={form} id={`recommendations.${index}.description`} title="Description" />
                                    </div>

                                    <Select {...form.getInputProps(`recommendations.${index}.type`)} label="Type" placeholder="Sélectionner le type" data={REC_TYPE_OPTIONS} />


                                    <TextInput
                                        {...form.getInputProps(`recommendations.${index}.department`)}
                                        label="Département"
                                        placeholder="Département assigné"

                                    />
                                    <div className="col-span-2">
                                        <TextEditor form={form} id={`recommendations.${index}.goal`} title="Objectif" />
                                    </div>

                                    {/* LOT 40 P1: responsive grid breakpoints */}
                                    <div className="grid col-span-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
                                        <DateInput label="Date de début" placeholder="jj-mm-aaaa" leftSection={<IconCalendar />} withAsterisk {...form.getInputProps(`recommendations.${index}.startDate`)} />

                                        <DateInput label="Date de fin" placeholder="jj-mm-aaaa" leftSection={<IconCalendar />} withAsterisk {...form.getInputProps(`recommendations.${index}.endDate`)} />
                                        <Select {...form.getInputProps(`recommendations.${index}.status`)}
                                            label="Statut"
                                            placeholder="Sélectionner le statut"
                                            data={REC_STATUS_OPTIONS}
                                        />
                                    </div>

                                    <div className="col-span-2">

                                        <TextEditor form={form} id={`recommendations.${index}.assessment`} title="Évaluation" />
                                    </div>
                                </Fieldset>
                            ))}
                        </Stack>
                    )}
                </div>

                <Group justify="center" mt="xl">
                    <Button variant="default" onClick={() => setActive((a) => Math.max(a - 1, 0))} disabled={active === 0}>
                        Étape précédente
                    </Button>
                    {active < 2 ? (
                        <Button color="indigo" onClick={() => setActive((a) => Math.min(a + 1, 2))}>Étape suivante</Button>
                    ) : (
                        <Button color="indigo" onClick={handleSubmit}>
                            Soumettre l'exécution
                        </Button>
                    )}
                </Group>
            </Card>
        </div>

    );
};

export default ExecuteAudit;
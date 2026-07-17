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
import { useTranslation } from "react-i18next";
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
import { REC_PRIORITY_OPTIONS, VALIDATOR_STATUS_OPTIONS, toIsoDateLocalOrNull } from "./auditLabels";
import { getObservationDropdown } from "../../../services/ObservationService";
import AuditChecklistPanel from "./AuditChecklistPanel";


// LOT 52 — étape « Checklist ISO » insérée entre les domaines et le rapport.
const sectionMap = ['audit-area', 'iso-checklist', 'audit-report', 'recommendations'];
const LAST_STEP = sectionMap.length - 1;
const ExecuteAudit = () => {
    const { id } = useParams();
    const { t } = useTranslation('audits');
    // Options bilingues : clés i18n `audits:*`, repli sur les libellés FR centralisés (auditLabels.ts).
    const validatorStatusOptions = VALIDATOR_STATUS_OPTIONS.map((o) => ({
        value: o.value,
        label: t(`validatorStatus.${o.value}`, { defaultValue: o.label }),
    }));
    // Priorité de la recommandation : valeurs backend (High/Average/Weak) conservées.
    const recPriorityOptions = REC_PRIORITY_OPTIONS.map((o) => ({
        value: o.value,
        label: t(`recPriority.${o.value}`, { defaultValue: o.label }),
    }));
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [active, setActive] = useState(0); // step index (0 to 3)
    const section = sectionMap[active];
    const [selectedArea, setSelectedArea] = useState<any>({});
    const [areas, setAreas] = useState<any[]>([]);
    const [areaMap, setAreaMap] = useState<Record<string, any>>({});
    const [employees, setEmployees] = useState<any[]>([]);
    const [observations, setObservations] = useState<any[]>([]);
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
    const ref = useRef<HTMLInputElement>(null);
    const ref1 = useRef<HTMLInputElement>(null);
    const [submitted, setSubmitted] = useState(false);


    useEffect(() => {
        dispatch(showOverlay());
        reportExists(Number(id)).then((res) => {
            if (res) {

                setSubmitted(true);
                modals.openConfirmModal({
                    title: <span className="text-base">{t('execute.reportSubmittedTitle')}</span>,
                    centered: true,
                    children: (
                        <span className="text-sm">
                            {t('execute.reportSubmittedBody')}
                        </span>
                    ),
                    onConfirm: () => {
                        modals.closeAll();
                        navigate("/audit-management");
                    },
                    labels: { confirm: t('execute.reportSubmittedConfirm'), cancel: t('execute.reportSubmittedCancel') },
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
        getAreasByAuditId(Number(id)).then((res) => {
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
        // Constats de l'audit : alimentent le rattachement (facultatif) d'une
        // recommandation à un constat, comme l'onglet Recommandations du dossier.
        getObservationDropdown(id).then((res) => {
            setObservations((res ?? []).map((x: any) => ({ value: "" + x.id, label: x.title })));
        }).catch((_err) => {
            setObservations([]);
        })
    }, []);

    // Le formulaire suit désormais EXACTEMENT le modèle backend RecommendationDTO
    // (cf. onglet « Recommandations » du dossier d'audit). Les champs historiques
    // type/department/goal/startDate/assessment/areaId n'avaient aucune colonne en
    // base et étaient écartés par Jackson.
    const addRecommendation = () => {
        form.insertListItem("recommendations", {
            title: "",
            auditId: id,
            observationId: "",
            description: "",
            priority: "",
            actionManagerId: "",
            correctiveAction: "",
            deadline: null,
            // Pas de `status` : le service force PENDING/0 % à la création.
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
            recommendations: [] as any[],
            contributors: [] as any[],
        },
        validate: {
            // LOT audit P2 : validation des champs marqués withAsterisk côté UI
            report: {
                preparerName: (value: string) =>
                    value && value.trim() ? null : 'Le rédacteur du rapport est requis',
                validatorName: (value: string) =>
                    value && value.trim() ? null : 'Le validateur du rapport est requis',
            },
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
            title: <span className="text-base">{t('execute.confirmTitle')}</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    {t('execute.confirmBody')}
                </span>
            ),
            labels: { confirm: t('execute.confirmSubmit'), cancel: t('execute.confirmCancel') },
            cancelProps: { color: "gray", variant: "default" },
            confirmProps: { color: "indigo", variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: async () => {
                const values = form.values;
                const docs = await convertFilesToBase64(values.report.docs);
                // `emps` (annuaire complet) et `index` (clé de rendu) sont des
                // artefacts d'UI : hors contrat AreaExecutionDTO, on ne les poste pas.
                const executions = await Promise.all(
                    values.executions.map(async ({ emps: _emps, index: _index, ...item }: any) => {
                        const evidence = await convertFilesToBase64(item.evidence);
                        return {
                            ...item,
                            interviewDate: toIsoDateLocalOrNull(item.interviewDate),
                            attendees: (item.attendees ?? []).map((a: any) => ({ id: a.id, role: a.role ?? null })),
                            evidence: evidence,
                        };
                    }
                    )
                );
                // Contrat RecommendationDTO : ids Long (chaîne vide -> null) et
                // échéance en date locale (LocalDate côté backend).
                const recommendations = values.recommendations.map((rec: any) => ({
                    ...rec,
                    auditId: id,
                    observationId: rec.observationId || null,
                    actionManagerId: rec.actionManagerId || null,
                    priority: rec.priority || null,
                    deadline: toIsoDateLocalOrNull(rec.deadline),
                }));


                // `preDate` est un LocalDate côté backend : elle DOIT être
                // normalisée comme interviewDate/deadline. Envoyée brute, la Date
                // du DateInput part en UTC (toISOString) et peut décaler d'un jour
                // — inacceptable sur la date d'un rapport d'audit (pièce ISO 19011).
                const report = {
                    ...values.report,
                    docs,
                    preDate: toIsoDateLocalOrNull(values.report.preDate),
                };

                dispatch(showOverlay());
                executeAudit({ ...values, report, executions, recommendations })
                    .then(() => {
                        successNotification(t('execute.savedToast'));
                        navigate("/audit-management");
                    }
                    ).catch((err) => {
                        errorNotification(err.response?.data?.errorMessage || t('execute.saveFailed'));
                    }
                    ).finally(() => {
                        dispatch(hideOverlay());
                    }
                    )
            },
        });
    }
    const convertFilesToBase64 = async (files: any[]) => {
        // Null-safe : une zone de dépôt jamais ouverte laisse le champ à undefined.
        const fileObjects = await Promise.all(
            (files ?? []).map(async (image) => {
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
                                placeholder={t('execute.selectRole')}
                                data={[
                                    { value: "Committee Member", label: t('interviewRole.Committee Member', { defaultValue: "Membre du comité" }) },
                                    { value: "Committee Chair", label: t('interviewRole.Committee Chair', { defaultValue: "Président du comité" }) },
                                    { value: "Committee Secretary", label: t('interviewRole.Committee Secretary', { defaultValue: "Secrétaire du comité" }) },
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
                    <p className="text-lg">{t('execute.interviewsOnArea')}</p>
                    <Button leftSection={<IconPlus />} onClick={addInterview}>
                        {t('execute.addInterview')}
                    </Button>
                </div>

                {/* LOT 40 P1: teal accent on legend + descriptive aria-label */}
                {form.values.executions.filter(x => x.areaId == selectedArea.id).map((x, index: any) => (
                    <Fieldset key={index} className="grid grid-cols-1 md:grid-cols-2 gap-5" legend={<div className="flex gap-5">
                        <div className="text-base text-teal-700">{t('execute.interviewLegend', { index: index + 1 })}</div>
                        <ActionIcon onClick={() => removeInterview(x.index)} variant="filled" color="red" aria-label={t('execute.removeInterview', { index: index + 1 })}>
                            <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
                        </ActionIcon>
                    </div>}>
                        <TextInput className="col-span-2" label={t('execute.interviewTopic')}  {...form.getInputProps(`executions.${x.index}.topic`)} />
                        <DateInput {...form.getInputProps(`executions.${x.index}.interviewDate`)} label={t('execute.interviewDate')} placeholder={t('execute.datePlaceholder')} />
                        <TextInput {...form.getInputProps(`executions.${x.index}.location`)} label={t('execute.interviewLocation')} placeholder={t('execute.interviewLocationPlaceholder')} />
                        <TimeInput label={t('execute.startTime')} ref={ref} rightSection={pickerControl} withAsterisk {...form.getInputProps(`executions.${x.index}.startTime`)} />

                        <TimeInput label={t('execute.endTime')} ref={ref1} rightSection={pickerControl1} withAsterisk {...form.getInputProps(`executions.${x.index}.endTime`)} />


                        <div className="col-span-2">

                            <TextEditor form={form} id={`executions.${x.index}.findings`} title={t('execute.findings')} />
                        </div>

                        <div className="col-span-2">

                            <PickList
                                dataKey="id"
                                filter
                                filterBy="name"
                                sourceFilterPlaceholder={t('execute.searchByName')}
                                showTargetControls={false}
                                showSourceControls={false}
                                targetFilterPlaceholder={t('execute.searchByName')}
                                source={form.getValues().executions[x.index]?.emps}
                                target={form.getValues().executions[x.index]?.attendees}
                                onChange={(event) => onChange(event, x.index)}
                                itemTemplate={(item) => itemTemplate(item, x.index)}
                                breakpoint="1280px"
                                sourceHeader={t('execute.employeesHeader', { count: form.getValues().executions[x.index]?.emps.length })}
                                targetHeader={t('execute.attendeesHeader', { count: form.getValues().executions[x.index]?.attendees?.length })}
                                sourceStyle={{ height: '24rem' }}
                                targetStyle={{ height: '24rem' }}
                            />

                        </div>

                        <div className="col-span-2">
                            <p className="text-lg ">{t('execute.evidence')}</p>
                            <ImagePdfDropzone name={t('execute.evidence')} id={`executions.${x.index}.evidence`} form={form} />
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
                    { label: t('execute.breadcrumbHome'), to: '/' },
                    { label: t('execute.breadcrumbAudits'), to: '/audit-management' },
                    { label: t('execute.breadcrumbExecute') },
                ]}
                icon={<IconClipboardCheck size={22} stroke={2} />}
                iconColor="indigo"
                title={t('execute.title')}
                subtitle={t('execute.subtitle')}
            />

            <Card className="bg-white" shadow="sm" withBorder radius="md">
                <Stepper allowNextStepsSelect={false} active={active} onStepClick={setActive} color="indigo" size="sm">
                    <Stepper.Step label={t('execute.step1')} description={t('execute.step1Desc')} />
                    <Stepper.Step label={t('execute.step2')} description={t('execute.step2Desc')} />
                    <Stepper.Step label={t('execute.step3')} description={t('execute.step3Desc')} />
                    <Stepper.Step label={t('execute.step4')} description={t('execute.step4Desc')} />
                </Stepper>
                <div className="mt-6">
                    {section === "audit-area" && (
                        <div className="grid grid-cols-4 gap-5 ">
                            {renderAreaCards()}
                            <div className="col-span-3">

                                {!selectedArea.id ? (
                                    <Text >{t('execute.selectAreaPrompt')}</Text>
                                ) : (
                                    renderInterviewForm()
                                )}
                            </div>
                        </div>
                    )}

                    {/* LOT 52 — checklist ISO par référentiel (initialisation + évaluation) */}
                    {section === "iso-checklist" && (
                        <AuditChecklistPanel auditId={id} />
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
                                <p className="flex items-center text-lg mb-2 text-gray-600"> <IconFilePencil stroke={1.5} size={20} /> {t('execute.reportPreparer')}</p>
                                <Grid>
                                    <Grid.Col span={4}><TextInput {...form.getInputProps("report.preparerName")} label={t('execute.name')} placeholder={t('execute.preparerNamePlaceholder')} /></Grid.Col>
                                    <Grid.Col span={4}><TextInput label={t('execute.role')} placeholder={t('execute.preparerRolePlaceholder')} {...form.getInputProps("report.preparerRole")} /></Grid.Col>
                                    <Grid.Col span={4}><DateInput leftSection={<IconCalendar />} label={t('execute.date')} placeholder={t('execute.datePlaceholder')} {...form.getInputProps("report.preDate")} /></Grid.Col>
                                </Grid>
                            </Card>

                            <Card shadow="md" withBorder>
                                <Group justify="space-between" mb="xs">
                                    <p className="flex text-lg items-center text-gray-600"><IconUsers stroke={1.5} size={20} />  {t('execute.contributors')}</p>
                                    <Button size="xs" leftSection={<IconPlus />} onClick={addContributor}>{t('execute.addContributor')}</Button>
                                </Group>
                                {form.values.contributors.map((_item, index) => (
                                    // LOT 40 P1: responsive grid + teal legend + descriptive aria-label
                                    <Fieldset key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5" legend={<div className="flex gap-5">
                                        <div className="text-base text-teal-700">{t('execute.contributorLegend', { index: index + 1 })}</div>
                                        <ActionIcon onClick={() => removeContributor(index)} variant="filled" color="red" aria-label={t('execute.removeContributor', { index: index + 1 })}>
                                            <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
                                        </ActionIcon>
                                    </div>}>
                                        <TextInput label={t('execute.name')} placeholder={t('execute.contributorNamePlaceholder')} {...form.getInputProps(`contributors.${index}.name`)} />
                                        <TextInput label={t('execute.role')} placeholder={t('execute.contributorRolePlaceholder')}  {...form.getInputProps(`contributors.${index}.role`)} />
                                        <TextInput label={t('execute.section')} placeholder={t('execute.contributorSectionPlaceholder')}  {...form.getInputProps(`contributors.${index}.section`)} />

                                    </Fieldset>
                                ))}
                            </Card>

                            <Card shadow="md" withBorder>
                                <p className="flex items-center mb-2 text-lg text-gray-600"><IconUserCheck stroke={1.5} size={20} /> {t('execute.reportValidator')}</p>
                                <Grid mb={10}>
                                    <Grid.Col span={4}><TextInput {...form.getInputProps("report.validatorName")} label={t('execute.name')} placeholder={t('execute.validatorNamePlaceholder')} /></Grid.Col>
                                    <Grid.Col span={4}><TextInput label={t('execute.role')} placeholder={t('execute.validatorRolePlaceholder')} {...form.getInputProps("report.validatorRole")} /></Grid.Col>
                                    <Grid.Col span={4}><Select  {...form.getInputProps("report.validatorStatus")} placeholder={t('execute.selectStatus')} data={validatorStatusOptions} label={t('execute.status')} /></Grid.Col>
                                </Grid>
                                {form.values.report?.validatorStatus == "Rejected" && < TextInput label={t('execute.rejectionComment')} placeholder={t('execute.rejectionCommentPlaceholder')} {...form.getInputProps("report.rejectionComment")} />}
                            </Card>

                            <Card shadow="md" withBorder>
                                <p className="text-lg text-gray-600">{t('execute.supportingDocs')}</p>

                                <ImagePdfDropzone name={t('execute.supportingDocs')} id="report.docs" form={form} />
                            </Card>

                            <Card shadow="md" withBorder>
                                <TextEditor form={form} id="report.description" title={t('execute.reportContent')} />
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
                                <p className="text-lg text-gray-600">{t('execute.recommendationsTitle')}</p>
                                <Button leftSection={<IconPlus size={16} />} onClick={addRecommendation}>
                                    {t('execute.addRecommendation')}
                                </Button>
                            </div>


                            {form.values.recommendations.map((_rec, index) => (
                                // LOT 40 P1: teal legend + descriptive aria-label
                                <Fieldset key={index} className="grid grid-cols-2 gap-5" legend={<div className="flex gap-5">
                                    <div className="text-base text-teal-700">{t('execute.recommendationLegend', { index: index + 1 })}</div>
                                    <ActionIcon onClick={() => removeRecommendation(index)} variant="filled" color="red" aria-label={t('execute.removeRecommendation', { index: index + 1 })}>
                                        <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
                                    </ActionIcon>
                                </div>}>
                                    <Select {...form.getInputProps(`recommendations.${index}.observationId`)}
                                        label={t('execute.recObservation')}
                                        placeholder={observations.length ? t('execute.selectObservation') : t('execute.noObservation')}
                                        disabled={!observations.length}
                                        clearable
                                        searchable
                                        data={observations}
                                    />
                                    <TextInput {...form.getInputProps(`recommendations.${index}.title`)}
                                        label={t('execute.recTitle')}
                                        placeholder={t('execute.recTitlePlaceholder')} />

                                    <div className="col-span-2">
                                        <TextEditor form={form} id={`recommendations.${index}.description`} title={t('execute.recDescription')} />
                                    </div>

                                    <Select {...form.getInputProps(`recommendations.${index}.priority`)}
                                        label={t('execute.recPriority')}
                                        placeholder={t('execute.selectPriority')}
                                        data={recPriorityOptions} />

                                    {/* Le responsable d'action est un identifiant employé (actionManagerId) :
                                        Select alimenté par l'annuaire, plus de saisie libre « Département ». */}
                                    <Select
                                        {...form.getInputProps(`recommendations.${index}.actionManagerId`)}
                                        label={t('execute.recActionManager')}
                                        placeholder={t('execute.selectActionManager')}
                                        searchable
                                        clearable
                                        data={employees.map((e: any) => ({ value: "" + e.id, label: e.name }))}
                                    />
                                    <div className="col-span-2">
                                        <TextEditor form={form} id={`recommendations.${index}.correctiveAction`} title={t('execute.recCorrectiveAction')} />
                                    </div>

                                    {/* Pas de sélecteur de STATUT ici : une recommandation naît
                                        « En attente » avec 0 % de progression — le service le force
                                        (RecommendationServiceImpl). Le champ affiché était donc un
                                        leurre : choisir « Terminée » à la création n'avait aucun
                                        effet. Le statut évolue ensuite via le suivi
                                        (UpdateRecommendation / RecommendationFileTab), où il est
                                        contraint aux transitions valides. */}
                                    <div className="grid col-span-2 grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                                        <DateInput label={t('execute.recDeadline')} placeholder={t('execute.datePlaceholder')} leftSection={<IconCalendar />} withAsterisk {...form.getInputProps(`recommendations.${index}.deadline`)} />
                                    </div>
                                </Fieldset>
                            ))}
                        </Stack>
                    )}
                </div>

                <Group justify="center" mt="xl">
                    <Button variant="default" onClick={() => setActive((a) => Math.max(a - 1, 0))} disabled={active === 0}>
                        {t('execute.previousStep')}
                    </Button>
                    {active < LAST_STEP ? (
                        <Button color="indigo" onClick={() => setActive((a) => Math.min(a + 1, LAST_STEP))}>{t('execute.nextStep')}</Button>
                    ) : (
                        <Button color="indigo" onClick={handleSubmit}>
                            {t('execute.submit')}
                        </Button>
                    )}
                </Group>
            </Card>
        </div>

    );
};

export default ExecuteAudit;
import {
    Text,
    Button,
    Select,
    SimpleGrid,
    Checkbox,
    Avatar,
    ActionIcon,
    TextInput,
    Group,
    Tooltip,
} from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";
import TextEditor from "../../UtilityComp/TextEditor";
import { IconClipboardText, IconDeviceFloppy, IconPlus, IconTarget, IconTrash, IconUsers, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import ImagePdfDropzone from "../../UtilityComp/ImagePdfDropzone";
import { getActivityById } from "../../../services/HsActivityService";
import { DateInput } from "@mantine/dates";
import { getEmployeeDropdown } from "../../../services/EmployeeService";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { createActivityReport } from "../../../services/ActivityReportService";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { getBase64 } from "../../../utility/DocumentUtility";
import { toLocalDate } from "../../../utility/dateConversion";
import PageHeader from "../../UtilityComp/PageHeader";
import { ACTION_PLAN_STATUS_OPTIONS, SERIF } from "./hsMeetingsLabels";

/** En-tête de section : icône chip + titre serif + sous-titre. */
const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) => (
    <header className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-green-50 to-white">
        <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-green-100 border border-green-200">
                <Icon size={16} className="text-green-700" />
            </div>
            <div>
                <h2 className="text-slate-900" style={{ fontFamily: SERIF, fontSize: '14px', fontWeight: 600 }}>{title}</h2>
                {subtitle && <p className="text-[11.5px] text-slate-500">{subtitle}</p>}
            </div>
        </div>
    </header>
);

const ActivityReport = () => {
    const { id } = useParams();
    const [participants, setParticipants] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        getActivityById(id).then((res) => {
            setParticipants(res.participants);
        }).catch((_err) => { });
        getEmployeeDropdown()
            .then((res) => {
                setEmployees(res.map((x: any) => ({ value: "" + x.id, label: x.name })));
            })
            .catch((_err) => { });
    }, []);

    const handleAddActionItem = () => {
        form.insertListItem("actions", {
            actionName: "",
            assignedEmployeeId: "",
            deadline: "",
            status: "",
            description: "",
            hsActivityId: id,
        });
    };

    const form = useForm({
        initialValues: {
            report: {
                summary: "",
                findings: "",
                docs: [],
                signOff: [] as any[],
                activityId: id,
            },
            actions: [],
        },
        validate: {},
    });

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

    const handleSubmit = async () => {
        setSubmitting(true);
        const docs = await convertFilesToBase64(form.values.report.docs);
        dispatch(showOverlay());
        createActivityReport({
            ...form.values,
            report: {
                ...form.values.report,
                docs: docs,
            },
            // LocalDate backend : échéances sérialisées 'yyyy-MM-dd' en fuseau LOCAL
            actions: (form.values.actions as any[]).map((a: any) => ({
                ...a,
                deadline: a.deadline ? toLocalDate(a.deadline) : a.deadline,
            })),
        })
            .then((_res) => {
                successNotification("Compte rendu enregistré");
                navigate("/hs-Meetings");
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "L'enregistrement du compte rendu a échoué");
            })
            .finally(() => {
                setSubmitting(false);
                dispatch(hideOverlay());
            });
    };

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Réunions sécurité', to: '/hs-Meetings' },
                    { label: "Compte rendu d'exécution" },
                ]}
                icon={<IconClipboardText size={22} stroke={2} />}
                iconColor="green"
                title="Compte rendu d'exécution"
                subtitle="Synthèse de la réunion, constats, actions décidées et émargement des participants"
                actions={
                    <>
                        <Button variant="default" size="sm" leftSection={<IconX size={15} />} onClick={() => navigate(-1)}>
                            Annuler
                        </Button>
                        <Button color="teal" size="sm" loading={submitting} leftSection={<IconDeviceFloppy size={15} />} onClick={handleSubmit}>
                            Soumettre le compte rendu
                        </Button>
                    </>
                }
            />

            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <SectionHeader icon={IconClipboardText} title="Synthèse et constats" subtitle="Déroulé de la réunion et observations relevées" />
                <div className="p-4 space-y-4">
                    <TextEditor form={form} id="report.summary" title="Synthèse" />
                    <TextEditor form={form} id="report.findings" title="Constats et observations" />
                    <ImagePdfDropzone title="Preuves et documentation" id="report.docs" form={form} />
                </div>
            </section>

            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <SectionHeader icon={IconTarget} title="Actions correctives" subtitle="Actions décidées en réunion, assignées et datées" />
                <div className="p-4 space-y-4">
                    <div className="flex justify-end">
                        <Button size="sm" color="teal" variant="light" leftSection={<IconPlus size={15} />} onClick={handleAddActionItem}>
                            Ajouter une action
                        </Button>
                    </div>

                    {(form.values.actions as any[]).length === 0 && (
                        <p className="text-[12.5px] text-slate-500">
                            Aucune action pour le moment. Ajoutez les décisions à suivre issues de la réunion.
                        </p>
                    )}

                    {(form.values.actions as any[]).map((_item, index: any) => (
                        <div key={index} className="rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-slate-800" style={{ fontFamily: SERIF, fontSize: '14px', fontWeight: 600 }}>
                                    Action {index + 1}
                                </h3>
                                <Tooltip label="Supprimer l'action" withArrow>
                                    <ActionIcon onClick={() => form.removeListItem('actions', index)} variant="light" color="red" aria-label="Supprimer l'action">
                                        <IconTrash size={15} stroke={1.5} />
                                    </ActionIcon>
                                </Tooltip>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TextInput size="sm" {...form.getInputProps(`actions.${index}.actionName`)} label="Intitulé du plan d'action" placeholder="ex. Remplacer la signalisation de la zone de tir" />
                                <Select size="sm" {...form.getInputProps(`actions.${index}.assignedEmployeeId`)} data={employees} label="Responsable" placeholder="Sélectionner le responsable" />
                                <DateInput size="sm" {...form.getInputProps(`actions.${index}.deadline`)} label="Échéance" placeholder="Sélectionner l'échéance" />
                                <Select size="sm" {...form.getInputProps(`actions.${index}.status`)} data={ACTION_PLAN_STATUS_OPTIONS} label="Statut" placeholder="Sélectionner le statut" />
                                <div className="md:col-span-2">
                                    <TextEditor form={form} id={`actions.${index}.description`} title="Description" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <SectionHeader
                    icon={IconUsers}
                    title={`Émargement des participants (${form.values.report.signOff.length}/${participants.length})`}
                    subtitle="Cochez les participants présents à la réunion"
                />
                <div className="p-4">
                    <Checkbox.Group {...form.getInputProps("report.signOff")} className="!flex flex-col gap-4">
                        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
                            {participants.map((person) => {
                                const isSelected = form.values.report.signOff.includes(person.id.toString());
                                return (
                                    <Checkbox.Card
                                        key={person.id}
                                        value={person.id.toString()}
                                        radius="md"
                                        withBorder
                                        className={`!p-3 transition-colors duration-150 ${isSelected ? "!bg-teal-50 !border-teal-300" : "bg-white"}`}
                                    >
                                        <Group align="center" justify="space-between" className="!gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar radius="xl" size="sm" color="teal" name={person.name} />
                                                <div className="flex flex-col min-w-0">
                                                    <Text size="sm" className="truncate">{person.name}</Text>
                                                    <Text size="xs" c="dimmed" className="truncate">{person.role || 'Participant'}</Text>
                                                </div>
                                            </div>
                                            <Checkbox.Indicator size="sm" />
                                        </Group>
                                    </Checkbox.Card>
                                );
                            })}
                        </SimpleGrid>
                    </Checkbox.Group>
                    {participants.length === 0 && (
                        <p className="text-[12.5px] text-slate-500">Aucun participant convié à cette réunion.</p>
                    )}
                </div>
            </section>

            <div className="flex gap-2 justify-end pt-2">
                <Button variant="default" size="sm" leftSection={<IconX size={15} />} onClick={() => navigate(-1)}>
                    Annuler
                </Button>
                <Button size="sm" color="teal" loading={submitting} leftSection={<IconDeviceFloppy size={15} />} onClick={handleSubmit}>
                    Soumettre le compte rendu
                </Button>
            </div>
        </div>
    );
};

export default ActivityReport;

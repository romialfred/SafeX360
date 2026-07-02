import { useEffect, useState } from "react";
import {
    Button,
    Select,
    Modal,
    Badge,
    Progress,
    Divider,
    TextInput,
    Card,
    Title,
    Group,
    Stack,
    Text,
    LoadingOverlay,
    NumberInput,
} from "@mantine/core";
import { IconClock, IconPlus } from "@tabler/icons-react";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useParams } from "react-router-dom";
import TextEditor from "../../../UtilityComp/TextEditor";
import SafeHtml from "../../../UtilityComp/SafeHtml";
import { useDispatch } from "react-redux";
import { modals } from "@mantine/modals";
import { getObservationDropdown } from "../../../../services/ObservationService";
import { hideOverlay, showOverlay } from "../../../../slices/OverlaySlice";
import { createFollowup, createRecommendation, getRecommendationByAuditId, getRecommendationFollowups } from "../../../../services/AuditService";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import { formatDateShort } from "../../../../utility/DateFormats";
import { getProgressColor, isValidRichText } from "../../../../utility/OtherUtilities";
import { Tag } from "primereact/tag";
import {
    ACTION_STATUS_OPTIONS,
    REC_PRIORITY_COLORS,
    REC_PRIORITY_OPTIONS,
    REC_STATUS_OPTIONS,
    recPriorityLabel,
    recStatusColor,
    recStatusLabel,
} from "../auditLabels";

const RecommendationFileTab = ({ employees, empMap, audit, observationVersion }: any) => {
    const { id } = useParams();
    const [showForm, setShowForm] = useState(false);
    const dispatch = useDispatch();
    const [observations, setObservations] = useState<any[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [recommendation, setRecommendation] = useState<any>({});
    const [recommendationFollowups, setRecommendationFollowups] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [opened, setOpened] = useState<"update" | "history" | null>(null);
    const isAuditLocked = audit?.status === "CLOSED" || audit?.status === "CANCELLED";

    useEffect(() => {
        if (isAuditLocked) {
            setShowForm(false);
            setOpened((prev) => (prev === "history" ? prev : null));
        }
    }, [isAuditLocked]);

    const fetchObservations = () => {
        getObservationDropdown(id)
            .then((res) => {
                setObservations(res.map((x: any) => ({
                    value: "" + x.id,
                    label: x.title
                })));
            }).catch((_err) => {
                setObservations([]);
            });
    };

    useEffect(() => {
        fetchObservations();
        fetchRecommendation();
    }, [id, observationVersion]);


    const fetchRecommendation = () => {
        getRecommendationByAuditId(id).then((res) => {
            setRecommendations(res);
        }).catch((_err) => {
            setRecommendations([]);
        });
    }


    const handleCancel = () => {
        setShowForm(false);
    };


    const form = useForm({
        initialValues: {
            title: "",
            auditId: "" + id,
            observationId: "",
            description: "",
            priority: "",
            actionManagerId: "",
            correctiveAction: "",
            deadline: "",
            status: "",



        },
        validate: {
            title: (value) => value ? null : "Le titre est requis",
            auditId: (value) => value ? null : "L'audit est requis",
            observationId: (value) => value ? null : "Le constat associé est requis",
            description: (value) => value ? null : "La description est requise",
            priority: (value) => value ? null : "La priorité est requise",
            actionManagerId: (value) => value ? null : "Le responsable d'action est requis",
            correctiveAction: (value) => value ? null : "L'action corrective est requise",
            deadline: (value) => value ? null : "L'échéance est requise",
            status: (value) => value ? null : "Le statut est requis",
        }
    });
    const updateForm = useForm({
        initialValues: {
            progress: 0,
            status: '',
            comment: '',
            recommendationId: ''
        },
        validate: {

            status: (value) => (value ? null : 'Le statut est requis'),
            comment: (value) => (isValidRichText(value) ? null : 'Le commentaire est requis'),


        }
    });

    const handleModal = (modal: any, rec: any) => {
        if (isAuditLocked && modal !== "history") return;
        setRecommendation(rec);
        setOpened(modal);
        form.reset();
        if (modal === "update" || modal == "history") {
            updateForm.setValues({
                progress: rec.progress,
                recommendationId: rec.id,
                status: rec.status,
                comment: '',
            });
            setLoading(true);
            getRecommendationFollowups(rec.id)
                .then((res) => {
                    setRecommendationFollowups(res);
                }
                ).catch((_err) => console.error(_err))
                .finally(() => {
                    setLoading(false);
                }
                );

        }


    }

    const handleSubmit = () => {
        if (isAuditLocked) return;
        form.validate();
        if (!form.isValid()) {
            return;
        }
        // console.log("Form submitted with values:", form.values);

        modals.openConfirmModal({
            title: <span className="text-base">Confirmer la recommandation</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Enregistrer cette recommandation d'audit ?
                </span>
            ),
            labels: { confirm: "Oui, enregistrer", cancel: "Annuler" },
            cancelProps: { color: "gray", variant: "default" },
            confirmProps: { color: "indigo", variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: async () => {

                dispatch(showOverlay());
                createRecommendation(form.values)
                    .then(() => {
                        successNotification("Recommandation enregistrée");
                        form.reset();
                        setShowForm(false);
                        fetchObservations();
                        fetchRecommendation();
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

    const handleFollowupSubmit = (values: any) => {
        if (isAuditLocked) return;
        modals.openConfirmModal({
            title: <span className="text-base">Confirmer le suivi</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Enregistrer cette mise à jour de la recommandation ?
                </span>
            ),
            labels: { confirm: "Oui, mettre à jour", cancel: "Annuler" },
            cancelProps: { color: "gray", variant: "default" },
            confirmProps: { color: "indigo", variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: async () => {
                setLoading(true);
                createFollowup(values).then((_res) => {
                    setOpened(null);
                    setRecommendations((prev: any) => {
                        const newData = [...prev];
                        return newData.map((item) => item.id === recommendation.id ? ({ ...item, status: values.status, progress: values.progress }) : item);
                    })
                    successNotification("Recommandation mise à jour");
                }).catch((_err) => {
                    errorNotification(_err.response?.data?.errorMessage || "La mise à jour a échoué");
                }).finally(() => {
                    setLoading(false);
                })

            },
        });
    }
    return (
        <div className="   p-6 bg-white rounded-xl shadow-sm border border-gray-300">
            {!showForm ? (
                <div className="flex flex-col gap-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <Title order={4} className="text-gray-700">Recommandations ({recommendations.length})</Title>
                        {!isAuditLocked && (
                            <Button
                                leftSection={<IconPlus />}
                                onClick={() => setShowForm(true)}
                            >
                                Nouvelle recommandation
                            </Button>
                        )}
                    </div>

                    {/* Recommendation Cards */}
                    {recommendations.length > 0 && recommendations.map((obs, index) => (
                        <Card key={index} shadow="sm" padding="lg" radius="md" withBorder>
                            {/* Top Section */}
                            <Group justify="space-between" mb="md">
                                <Group gap="xs">
                                    <Badge color={recStatusColor(obs.status)} variant="light">{recStatusLabel(obs.status)}</Badge>
                                    <Badge color={REC_PRIORITY_COLORS[obs.priority] ?? 'gray'} variant="light">{recPriorityLabel(obs.priority)}</Badge>
                                </Group>

                                <Group gap="xs">
                                    {!isAuditLocked && (
                                        <Button size="xs" color="green" variant="light" onClick={() => handleModal("update", obs)}>Mettre à jour</Button>
                                    )}
                                    <Button size="xs" color="orange" variant="light" onClick={() => handleModal("history", obs)}>Historique</Button>
                                </Group>
                            </Group>

                            {/* Title */}
                            <div className="text-gray-800 font-normal !mb-2">{obs.title}</div>

                            {/* Description and Info */}
                            <Stack gap="xs">
                                <Group justify="space-between " >  <Text size="sm">
                                    <strong className="text-gray-600 ">Responsable :</strong>{" "}
                                    {empMap[obs.actionManagerId]?.name || "—"}
                                </Text>
                                    <Text size="sm">
                                        <strong className="text-gray-600">Échéance :</strong>{" "}
                                        {formatDateShort(obs.deadline)}
                                    </Text>
                                </Group>

                                {/* Progress Bar */}
                                <div>
                                    <Group justify="space-between" mb={5}>
                                        <Text size="sm">Avancement</Text>
                                        <Text size="sm" color={getProgressColor(obs.progress)}>{obs.progress}%</Text>
                                    </Group>
                                    <Progress color={getProgressColor(obs.progress)} value={obs.progress} />
                                </div>

                                {/* Description */}
                                <div>
                                    <Text size="sm" c="gray">Description</Text>
                                    {/* LOT 41 P0 XSS fix */}
                                    <SafeHtml html={obs.description} className="text-sm" />
                                </div>

                                {/* Corrective Action */}
                                <div>
                                    <Text size="sm" c="gray">Action corrective</Text>
                                    {/* LOT 41 P0 XSS fix */}
                                    <SafeHtml html={obs.correctiveAction} className="text-sm" />
                                </div>
                            </Stack>

                            <Divider mt="md" />
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    {/* New Recommendation Form */}
                    <div className="flex justify-between items-center">

                        <h2 className="text-lg text-gray-700 ">Nouvelle recommandation</h2>
                        <Button color="red" variant="light" onClick={handleCancel}>Annuler</Button>

                    </div>
                    <div className="flex flex-col gap-5">


                        <div className="grid grid-cols-2 gap-5">
                            <TextInput label="Titre de la recommandation" placeholder="Saisir le titre" withAsterisk {...form.getInputProps('title')} />
                            <Select label="Constat associé" placeholder="Sélectionner le constat" data={observations} withAsterisk  {...form.getInputProps('observationId')} />
                            <div className="col-span-2">

                                <TextEditor title="Description de la recommandation" withAsterisk form={form} id="description" />
                            </div>
                            <Select label="Priorité" placeholder="Sélectionner la priorité" withAsterisk data={REC_PRIORITY_OPTIONS}  {...form.getInputProps('priority')} />
                            <Select label="Responsable d'action" placeholder="Sélectionner le responsable" data={employees} withAsterisk {...form.getInputProps('actionManagerId')} />

                            <div className="col-span-2">
                                <TextEditor title="Action corrective prévue" withAsterisk form={form} id="correctiveAction" />
                            </div>

                            <DateInput label="Échéance de réalisation" placeholder="Sélectionner la date" {...form.getInputProps('deadline')} minDate={new Date(audit.startDate)} withAsterisk />
                            <Select
                                placeholder="Sélectionner le statut"
                                label="Statut"
                                data={ACTION_STATUS_OPTIONS}
                                withAsterisk
                                {...form.getInputProps('status')}
                            />
                        </div>

                        {/* Action buttons */}
                        <div className="flex justify-end gap-3 mt-6">

                            <Button color="indigo" onClick={handleSubmit}>Enregistrer</Button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Modals */}
            <Modal
                opened={opened === "update"}
                onClose={() => setOpened(null)}
                title={<div className="text-base text-slate-800">Mise à jour de la recommandation</div>}
                size="auto"
                centered yOffset="10dvh"
            >
                <LoadingOverlay
                    visible={loading}
                    zIndex={1000}
                    overlayProps={{ radius: "sm", blur: 2 }}
                />
                {recommendation && (
                    <div className="flex gap-5 ">
                        <form onSubmit={updateForm.onSubmit(handleFollowupSubmit)} className="flex flex-col gap-5 w-[500px]">
                            <div className="text-lg">Titre : {recommendation?.title}</div>
                            <div>
                                <p className="text-lg text-gray-700">Description</p>
                                <div className="border-blue-300 border rounded-lg shadow-sm p-4 ">
                                    {/* LOT 41 P0 XSS fix */}
                                    <SafeHtml html={recommendation?.description} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">

                                <NumberInput {...updateForm.getInputProps('progress')} label="Avancement (%)" max={100} clampBehavior="blur" min={recommendation.progress} />
                                <Select {...updateForm.getInputProps('status')} label="Statut" placeholder="Sélectionner le statut" data={REC_STATUS_OPTIONS.slice(REC_STATUS_OPTIONS.findIndex((item) => item.value === (recommendationFollowups?.length > 0 ? recommendationFollowups[recommendationFollowups.length - 1]?.status : recommendation?.status)))} />
                            </div>
                            <TextEditor form={updateForm} id="comment" title="Commentaire de suivi" />
                            <Divider size="xs" />
                            <div className="flex justify-center gap-2">
                                <Button type="button" onClick={() => setOpened(null)} variant="outline">Fermer</Button>
                                <Button type="submit" color="indigo">Enregistrer</Button>
                            </div>
                        </form>
                        {recommendationFollowups && recommendationFollowups.length > 0 && (
                            <>
                                <Divider size="xs" orientation="vertical" />
                                <div className="space-y-5 h-[530px] overflow-y-auto">
                                    <p className="text-lg items-center mb-4 flex gap-1 text-amber-600">
                                        <IconClock /> Historique des suivis
                                    </p>

                                    {recommendationFollowups
                                        .slice() // create a shallow copy
                                        .reverse() // reverse the copy
                                        .map((x: any, index: number, arr) => {
                                            const previousProgress =
                                                index < arr.length - 1 ? arr[index + 1].progress : 0;
                                            const progressMade = x.progress - previousProgress;

                                            return (
                                                <Card key={index} shadow="sm" padding="sm" radius="md" withBorder className="w-[300px]">
                                                    <div className="flex flex-col gap-4">
                                                        {/* Header */}
                                                        <div className="flex justify-between items-center">
                                                            <div className="rounded-4xl">
                                                                <p className="text-sm text-amber-800 flex gap-1 p-1 items-center">
                                                                    <IconClock />
                                                                    {formatDateShort(x.followupDate)}
                                                                </p>
                                                            </div>
                                                            <Tag severity={x.progress <= 20 ? "danger" : x.progress <= 70 ? "warning" : "success"}>{x.progress}%</Tag>

                                                            <Badge radius="sm" variant="outline" color={recStatusColor(x.status)}>{recStatusLabel(x.status)}</Badge>
                                                        </div>

                                                        {/* Progress Section */}
                                                        <Progress.Root size={20}>
                                                            <Progress.Section value={previousProgress} color="blue">
                                                                <Progress.Label>{previousProgress}</Progress.Label>
                                                            </Progress.Section>
                                                            {progressMade > 0 && (
                                                                <Progress.Section value={progressMade} color="teal">
                                                                    <Progress.Label className="text-xs">{progressMade}</Progress.Label>
                                                                </Progress.Section>
                                                            )}
                                                        </Progress.Root>

                                                        <div className="bg-blue-50 shadow-sm rounded-lg p-2">
                                                            <p className="text-blue-400">Détail du suivi</p>
                                                            {/* LOT 41 P0 XSS fix */}
                                                            <SafeHtml html={x.comment || "-"} className="text-gray-700 mt-1 text-sm" />
                                                        </div>
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </Modal>

            <Modal
                opened={opened === "history"}
                onClose={() => setOpened(null)}
                title={<span className="text-slate-800 text-base">Historique des suivis de la recommandation</span>}
                size="lg"
                centered
            >
                <LoadingOverlay
                    visible={loading}
                    zIndex={1000}
                    overlayProps={{ radius: "sm", blur: 2 }}
                />
                <div className="space-y-4 text-sm text-gray-800">
                    {/* Overview Header */}
                    <div className="bg-gray-50 p-4 rounded-md space-y-1">
                        <div className="text-base "> Titre : {recommendation.title}</div>
                        <div className="flex justify-between">
                            <p><strong>Responsable d'action :</strong> {empMap[recommendation.actionManagerId]?.name}</p>
                            <p><strong>Échéance :</strong> {formatDateShort(recommendation.deadline)}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="text-base">Historique des changements ({recommendationFollowups.length})</div>

                        {recommendationFollowups.map((entry, index) => {
                            const previous = recommendationFollowups[index - 1];
                            const statusChange = previous
                                ? `${recStatusLabel(previous.status)} → ${recStatusLabel(entry.status)}`
                                : `Initial → ${recStatusLabel(entry.status)}`;
                            const previousProgress = index > 0 ? recommendationFollowups[index - 1].progress : 0;
                            const progressMade = entry.progress - previousProgress;
                            return (
                                <div
                                    key={entry.id}
                                    className="p-4 border rounded-md bg-blue-50 space-y-2"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-blue-800">{statusChange}</span>
                                        <span className="text-sm text-gray-600">{entry.progress}%</span>
                                    </div>

                                    <div className="text-xs text-gray-500">
                                        {formatDateShort(entry.followupDate)}
                                    </div>
                                    <Progress.Root size={20}>
                                        <Progress.Section value={previousProgress} color="blue">
                                            <Progress.Label>{previousProgress}</Progress.Label>
                                        </Progress.Section>
                                        {progressMade > 0 && (
                                            <Progress.Section value={progressMade} color="teal">
                                                <Progress.Label className="text-xs">{progressMade}</Progress.Label>
                                            </Progress.Section>
                                        )}
                                    </Progress.Root>
                                    {/* LOT 41 P0 XSS fix */}
                                    <SafeHtml html={entry.comment} className="text-sm text-gray-700" />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Modal>
        </div >

    )
}

export default RecommendationFileTab

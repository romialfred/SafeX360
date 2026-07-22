import { IconUsersGroup, IconUser, IconPencil, IconCalculator, IconAlertTriangle, IconCheckbox, IconPhoto, IconShieldCheck, IconShieldExclamation } from "@tabler/icons-react";
import { Badge, Button, Card, Group, List, Modal, Progress, Text, Textarea, ThemeIcon, Timeline, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { Carousel } from "@mantine/carousel";
import { getBase64FileSize, handlePreview } from "../../../../utility/DocumentUtility";
import { investMethodMap } from "../../../../Data/DropdownData";
import { formatDateWithDay } from "../../../../utility/DateFormats";
import { actionStatusColor, actionStatusLabel, causeLabel, INVESTIGATION_ROLE_LABELS } from "../incidentLabels";
import SafeHtml from "../../../UtilityComp/SafeHtml";
import { validateInvestigation } from "../../../../services/InvestigationService";
import { successNotification } from "../../../../utility/NotificationUtility";
import { notifyError } from "../../../../utility/notifyError";

const InvestigationDetailsTab = ({ investigation, processes, onValidated, canValidate = false, reviewerName }: any) => {
    const [opened, { open, close }] = useDisclosure(false);
    const [startIndex, setStartIndex] = useState(0);
    const [validationComment, setValidationComment] = useState("");
    const [validating, setValidating] = useState(false);

    const isValidated = investigation?.validated === true;

    const handleValidate = () => {
        if (!investigation?.id || validating) return;
        setValidating(true);
        validateInvestigation(investigation.id, validationComment.trim() || undefined)
            .then(() => {
                successNotification("Enquête validée. La clôture de l'incident est désormais autorisée.");
                setValidationComment("");
                onValidated?.();
            })
            .catch((err) => {
                // INVESTIGATION_ALREADY_VALIDATED, etc. -> message FR via notifyError
                notifyError(err, "Une erreur est survenue lors de la validation de l'enquête.");
            })
            .finally(() => setValidating(false));
    };



    const handleImageClick = (index: number) => {
        setStartIndex(index);
        open();
    };
    const sectionStyles: any = {
        human: {
            bg: "bg-blue-50",
            border: "border-blue-400",
            icon: <IconUser size={20} className="text-blue-600" />,
            title: "Actions humaines",
        },
        task: {
            bg: "bg-pink-50",
            border: "border-pink-400",
            icon: <IconPencil size={20} className="text-pink-600" />,
            title: "Facteurs liés à la tâche",
        },
        working: {
            bg: "bg-green-50",
            border: "border-green-400",
            icon: <IconCalculator size={20} className="text-green-600" />,
            title: "Conditions de travail",
        },
        organization: {
            bg: "bg-violet-50",
            border: "border-violet-400",
            icon: <IconAlertTriangle size={20} className="text-violet-600" />,
            title: "Défaillances organisationnelles et latentes",
        },
    };

    return (
        <div className="flex flex-col gap-6 ">
            <h2 className="text-lg text-gray-800">Détails de l'investigation</h2>

            {/* Gouvernance d'enquête — validation par un pair (ISO 45001 §10.2).
                La clôture de l'incident est verrouillée tant que l'enquête n'est pas validée. */}
            {isValidated ? (
                <div className="border-l-4 border-green-500 bg-green-50 rounded-xl p-4 shadow-sm flex items-start gap-3">
                    <IconShieldCheck size={24} className="text-green-600 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-green-800">Enquête validée</span>
                            <Badge size="sm" color="green" variant="light">Conforme §10.2</Badge>
                        </div>
                        <Text className="!text-sm !text-gray-600">
                            Validée{reviewerName ? ` par ${reviewerName}` : ""}
                            {investigation?.reviewedAt ? ` le ${formatDateWithDay(investigation.reviewedAt)}` : ""}
                        </Text>{investigation?.reviewedBy && !reviewerName && (
                            <Text className="!text-xs !text-gray-500">
                                Vérificateur : matricule #{investigation.reviewedBy}
                            </Text>
                        )}
                        {investigation?.validationComment && (
                            <Text className="!text-sm !text-gray-700 italic">
                                « {investigation.validationComment} »
                            </Text>
                        )}
                    </div>
                </div>
            ) : (
                <div className="border-l-4 border-amber-500 bg-amber-50 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                        <IconShieldExclamation size={24} className="text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-1">
                            <span className="text-amber-800">Enquête non validée</span>
                            <Text className="!text-sm !text-gray-700">
                                Une validation par un pair indépendant est requise avant de pouvoir clôturer l'incident (ISO 45001 §10.2).
                            </Text>
                        </div>
                    </div>
                    {canValidate && (
                        <div className="flex flex-col gap-2 sm:pl-9">
                            <Textarea
                                size="sm"
                                label="Commentaire de validation (optionnel)"
                                placeholder="Ex. : analyse causale complète, actions correctives adaptées et proportionnées."
                                autosize
                                minRows={2}
                                maxRows={4}
                                value={validationComment}
                                onChange={(e) => setValidationComment(e.currentTarget.value)}
                            />
                            <Group justify="flex-end">
                                <Button
                                    size="sm"
                                    color="green"
                                    loading={validating}
                                    disabled={!investigation?.id}
                                    leftSection={<IconShieldCheck size={16} />}
                                    onClick={handleValidate}
                                >
                                    Valider l'enquête
                                </Button>
                            </Group>
                        </div>
                    )}
                    {!canValidate && (
                        <Text className="!text-xs !text-gray-500 sm:pl-9">
                            La validation n'est plus possible : l'incident est clôturé ou rejeté.
                        </Text>
                    )}
                </div>
            )}

            {/* Méthode et dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                    <h4 className="text-gray-500 text-sm mb-1">Méthode</h4>
                    <p className="text-base text-gray-800">{investMethodMap[investigation.method] || "—"}</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                    <h4 className="text-gray-500 text-sm mb-1">Date de début</h4>
                    <p className="text-base text-gray-800">{formatDateWithDay(investigation.startDate) || "—"}</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                    <h4 className="text-gray-500 text-sm mb-1">Date de fin</h4>
                    <p className="text-base text-gray-800">{investigation.endDate ? formatDateWithDay(investigation.endDate) : "En cours"}</p>
                </div>
            </div>

            {/* Équipe */}
            <div className="border border-gray-300 rounded-xl p-4 bg-white shadow-sm">
                <h4 className="text-lg text-gray-700 mb-4 flex items-center gap-2">
                    <IconUsersGroup size={20} className="text-blue-500" /> Équipe d'investigation
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {investigation.team?.map((member: any, index: number) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition border border-blue-100"
                        >
                            <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 text-xs">
                                {member.name
                                    ?.split(" ")
                                    .map((n: string) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                            </div>
                            <div>
                                <p className="text-blue-700 text-xs">{member.name}</p>
                                <p className="text-xs text-gray-600">{INVESTIGATION_ROLE_LABELS[member.role] ?? member.role} </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Analysis Sections */}
            {["human", "task", "working", "organization"].map((type) => (
                <div
                    key={type}
                    className={`border-l-4 rounded-xl p-4 shadow-sm ${sectionStyles[type].bg} ${sectionStyles[type].border}`}
                >
                    <h4 className="text-lg text-gray-800 mb-2 flex items-center gap-2">
                        {sectionStyles[type].icon} {sectionStyles[type].title}
                    </h4>
                    <List
                        spacing="xs"
                        size="sm"
                        center
                        icon={
                            <ThemeIcon color="teal" variant="transparent" size={20} radius="xl">
                                <IconCheckbox size={20} />

                            </ThemeIcon>
                        }
                    >
                        <div className="flex  items-center gap-5">
                            {investigation[`${type}Causes`]?.length > 0 ? (
                                investigation[`${type}Causes`].map((cause: string, i: number) => (
                                    <List.Item mt={0} key={i}>{causeLabel(cause)}</List.Item>
                                ))
                            ) : (
                                <List.Item>Aucune cause identifiée</List.Item>
                            )}
                        </div>
                    </List>
                    {/* LOT 41 P0 XSS fix */}
                    <SafeHtml
                        html={investigation[`${type}Analysis`] || "<p>Analyse non renseignée.</p>"}
                        className="prose max-w-none mt-3 text-gray-800"
                    />
                </div>
            ))}

            {/* Rapport final */}
            <div className="border border-gray-300 rounded-xl p-4 bg-white shadow-sm">
                <h4 className="text-lg text-gray-700 mb-2">Rapport d'investigation</h4>
                {/* LOT 41 P0 XSS fix */}
                <SafeHtml
                    html={investigation.report || "<p>Rapport non disponible.</p>"}
                    className="prose max-w-none text-gray-800"
                />
            </div>

            {investigation.evidence?.length > 0 && <div className="">
                <h4 className="text-lg mb-4 text-gray-800">Preuves</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 border border-gray-300 rounded-xl p-6 bg-gray-50">
                    {[...(investigation.evidence ?? [])]?.map((image: any, index: number) => (
                        <div key={index} role="button" tabIndex={0} className="flex gap-4 bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition duration-200 cursor-pointer" onClick={() => handleImageClick(index)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleImageClick(index); } }}>
                            <img
                                src={`data:image/png;base64,${image.file}`}
                                alt={image.name}
                                className="w-20 h-20 object-cover rounded-md border"
                            />
                            <div className="flex flex-col justify-center">
                                <p className="text-sm text-gray-800">{image.name}</p>
                                <p className="text-sm text-gray-500">{getBase64FileSize(image.file)} ko</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>}
            {processes?.length > 0 && (
                <div className="p-4 bg-white border border-gray-300 rounded-lg shadow flex flex-col gap-4">
                    <Title order={4} className="text-primary">
                        Chronologie de l'avancement
                    </Title>

                    <Timeline
                        active={processes.length}
                        bulletSize={20}
                        variant="filled"

                        lineWidth={2}
                        className="space-y-4"
                    >
                        {processes.map((process: any, index: number) => {
                            const previousProgress = index > 0 ? processes[index - 1]?.progress : 0;
                            const progressMade = process?.progress - previousProgress;
                            return <Timeline.Item key={index}>
                                <Card
                                    shadow="sm"
                                    padding="xs"
                                    radius="md"
                                    withBorder
                                    className="bg-gray-50 space-y-3"
                                >
                                    <Group className="!flex !justify-between">
                                        <Badge size="sm" color={actionStatusColor(process.status)}>
                                            {actionStatusLabel(process.status)}
                                        </Badge>
                                        <div className="p-1 bg-yellow-100 border border-yellow-600 rounded-full shadow">
                                            <Text className="!text-sm !text-yellow-500">
                                                {formatDateWithDay(process.date)}
                                            </Text>
                                        </div>
                                    </Group>
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
                                    <div className="flex flex-col gap-2">
                                        <Text className="!text-gray-500 !text-sm">
                                            {process.description}
                                        </Text>

                                        <Group>
                                            {process.docs?.map((doc: any, i: number) => (
                                                <Badge
                                                    key={i}
                                                    size="sm"
                                                    className="!cursor-pointer"
                                                    onClick={() => handlePreview(doc)}
                                                    leftSection={<IconPhoto size={12} />}
                                                    color="orange"
                                                    variant="light"
                                                >
                                                    {doc.name}
                                                </Badge>
                                            ))}
                                        </Group>
                                    </div>
                                </Card>
                            </Timeline.Item>
                        }
                        )}

                    </Timeline>
                </div>
            )}



            <Modal
                opened={opened}
                onClose={close}
                size="xl"

                title="Aperçu des preuves"
                centered
                overlayProps={{
                    backgroundOpacity: 0.55,
                    blur: 3,
                }}
            >
                < Carousel className='[&_.mantine-Carousel-control]:!bg-primary  [&_.mantine-Carousel-control]:!text-white'
                    classNames={{
                        indicator: 'mantine-Carousel-indicator bg-white opacity-80 data-[active=true]:!bg-primary transition',
                    }} initialSlide={startIndex} withIndicators controlSize={40} height={500} loop>
                    {[...(investigation.evidence ?? []), ...(investigation.supportingEvidence ?? [])]?.map((image: any, index: number) => (
                        <Carousel.Slide key={index}>
                            <img
                                src={`data:image/png;base64,${image.file}`}
                                alt={image.name}
                                className="w-full h-full object-contain rounded-md"
                            />
                        </Carousel.Slide>
                    ))}
                </Carousel>
            </Modal>
        </div>
    );
};

export default InvestigationDetailsTab;
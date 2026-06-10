import { useEffect, useState } from "react";
import {
    Button,
    Card,
    TextInput,
    Text,
    Group,
    Stack,
    Grid,
    Fieldset,
    ActionIcon,
    Select,
    Badge,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
    IconCalendar,
    IconEdit,
    IconFilePencil,
    IconPhoto,
    IconPlus,
    IconTrash,
    IconUserCheck,
    IconUsers,
} from "@tabler/icons-react";
import { DateInput } from "@mantine/dates";
import TextEditor from "../../../UtilityComp/TextEditor";
import SafeHtml from "../../../UtilityComp/SafeHtml";
import { formatDateShort } from "../../../../utility/DateFormats";
import FileUpdateDropzone from "../../../UtilityComp/FileUpdateDropzone";
import { useParams } from "react-router-dom";
import { modals } from "@mantine/modals";
import { convertFilesToBase64New, handlePreview } from "../../../../utility/DocumentUtility";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../../slices/OverlaySlice";
import { addAuditReport, getAuditReportByAuditId } from "../../../../services/AuditReportService";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import { VALIDATOR_STATUS_LABELS, VALIDATOR_STATUS_OPTIONS } from "../auditLabels";

const AuditReportTabs = () => {
    const dispatch = useDispatch();
    const { id } = useParams();
    const [isEditing, setIsEditing] = useState(true);
    const [report, setReport] = useState<any>(null);
    const [contributors, setContributors] = useState<any[]>([]);
    useEffect(() => {
        dispatch(showOverlay());
        fetchReport();
    }, [id]);
    const form = useForm({
        initialValues: {
            report: {
                preparerName: "",
                preparerRole: "",
                preDate: "",
                validatorName: "",
                validatorRole: "",
                validatorStatus: "",
                rejectionComment: "",
                docs: [],
                description: "",
                auditId: id
            },
            contributors: [],
        },
    });

    const addContributor = () => {
        form.insertListItem("contributors", { name: "", role: "", section: "", auditId: id });
    };

    const removeContributor = (index: number) => {
        form.removeListItem("contributors", index);
    };

    const fetchReport = () => {
        getAuditReportByAuditId(id).then((res) => {
            // setSubmittedData(res);
            setReport(res.report);
            setContributors(res.contributors);
            setIsEditing(false);
        }).catch((_err) => {

            setIsEditing(true);
        }).finally(() => {
            dispatch(hideOverlay());
        }
        );

    }

    const handleSubmit = () => {

        form.validate();
        if (!form.isValid()) return;


        let values = form.values;

        modals.openConfirmModal({
            title: <span className="text-base">Confirmer le rapport</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Enregistrer ce rapport d'audit ?
                </span>
            ),
            labels: { confirm: "Oui, enregistrer", cancel: "Annuler" },
            cancelProps: { color: "gray", variant: "default" },
            confirmProps: { color: "indigo", variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: async () => {
                const evidence = await convertFilesToBase64New(values.report.docs);
                dispatch(showOverlay());
                addAuditReport({ report: { ...values.report, docs: evidence }, contributors: values.contributors })
                    .then(() => {
                        successNotification("Rapport enregistré");
                        form.reset();
                        setIsEditing(false);
                        fetchReport();
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


    return (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            {isEditing ? (
                <Stack>
                    <Card shadow="md" withBorder>
                        <p className="flex items-center text-lg mb-2 text-gray-600">
                            <IconFilePencil stroke={1.5} size={20} /> Rédacteur du rapport
                        </p>
                        <Grid>
                            <Grid.Col span={6}>
                                <TextInput size="md"{...form.getInputProps("report.preparerName")} label="Nom" placeholder="Nom du rédacteur" />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <DateInput leftSection={<IconCalendar />} label="Date" placeholder="jj-mm-aaaa" {...form.getInputProps("report.preDate")} />
                            </Grid.Col>
                        </Grid>
                    </Card>

                    <Card shadow="md" withBorder>
                        <Group justify="space-between" mb="xs">
                            <p className="flex text-lg items-center text-gray-600">
                                <IconUsers stroke={1.5} size={20} /> Contributeurs
                            </p>
                            <Button size="xs" leftSection={<IconPlus />} onClick={addContributor}>Ajouter un contributeur</Button>
                        </Group>
                        {form.values.contributors.map((_item, index) => (
                            <Fieldset key={index} className="grid grid-cols-2 gap-5 mb-5" legend={
                                <div className="flex gap-5">
                                    <div className="text-base text-teal-700">Contributeur {index + 1}</div>
                                    <ActionIcon onClick={() => removeContributor(index)} variant="filled" color="red" aria-label={`Retirer le contributeur ${index + 1}`}>
                                        <IconTrash style={{ width: "70%", height: "70%" }} stroke={1.5} />
                                    </ActionIcon>
                                </div>
                            }>
                                <TextInput label="Nom" placeholder="Nom du contributeur" {...form.getInputProps(`contributors.${index}.name`)} />
                                <TextInput label="Section" placeholder="Section concernée" {...form.getInputProps(`contributors.${index}.section`)} />
                            </Fieldset>
                        ))}
                    </Card>

                    <Card shadow="md" withBorder>
                        <p className="flex items-center mb-2 text-lg text-gray-600">
                            <IconUserCheck stroke={1.5} size={20} /> Validateur du rapport
                        </p>
                        <Grid mb={10}>
                            <Grid.Col span={6}>
                                <TextInput {...form.getInputProps("report.validatorName")} label="Nom" placeholder="Nom du validateur" />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Select {...form.getInputProps("report.validatorStatus")} placeholder="Sélectionner le statut" data={VALIDATOR_STATUS_OPTIONS} label="Statut" />
                            </Grid.Col>
                        </Grid>
                        {form.values.report?.validatorStatus == "Rejected" && (
                            <TextInput label="Motif du rejet" placeholder="Saisir le motif" {...form.getInputProps("report.rejectionComment")} />
                        )}
                    </Card>

                    <Card shadow="md" withBorder>
                        <p className="text-lg text-gray-600">Documents justificatifs</p>
                        <FileUpdateDropzone name="Documents justificatifs" id="report.docs" form={form} />
                    </Card>

                    <Card shadow="md" withBorder>
                        <TextEditor form={form} id="report.description" title="Contenu du rapport" />
                    </Card>

                    <Group justify="end">
                        <Button onClick={handleSubmit} color="indigo">Soumettre</Button>
                    </Group>
                </Stack>
            ) : (
                <Stack>
                    <Card shadow="md" withBorder className="!rounded-lg !p-6">
                        {/* Header */}
                        <Group justify="space-between" className="mb-2">
                            <h2 className="text-lg text-slate-800">Synthèse du rapport</h2>
                            <Button
                                onClick={() => setIsEditing(true)}
                                radius="xl"
                                leftSection={<IconEdit size={16} />}
                            >
                                Modifier
                            </Button>
                        </Group>

                        {/* Content Container */}
                        <div className="flex flex-col gap-5  p-5 rounded-xl shadow-sm">
                            {/* Top Section: Status + Description */}
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                <Badge variant="light"
                                    color={report?.validatorStatus === "Approved" ? "green" : report?.validatorStatus === "Rejected" ? "red" : "violet"}
                                    size="lg"
                                >
                                    {VALIDATOR_STATUS_LABELS[report?.validatorStatus] ?? report?.validatorStatus}
                                </Badge>

                                {report?.validatorStatus === "Rejected" && (
                                    <Text className="text-red-600 text-sm">
                                        <strong>Motif du rejet :</strong> {report?.rejectionComment}
                                    </Text>
                                )}
                                <div className="flex text-sm items-center gap-2">
                                    <span >Date de rédaction :</span>
                                    <Badge variant="light" color="orange"
                                        className="!capitalize"

                                    >{formatDateShort(report?.preDate)}</Badge>
                                </div>
                            </div>

                            {/* Preparer & Validator Info */}
                            <div className="grid grid-cols-1 text-sm sm:grid-cols-3 gap-4">
                                <p className="">
                                    Rédacteur : {report?.preparerName}
                                </p>
                                <div className="flex flex-wrap items-center gap-1">
                                    <Text size="sm" className="">Contributeurs :</Text>
                                    {contributors.map((c, i) => (
                                        <span key={i} className="text-sm" >
                                            {c.name} {i < contributors.length - 1 ? "," : ""}
                                        </span>
                                    ))}
                                </div>
                                <p className="">
                                    Validateur : {report?.validatorName}
                                </p>

                            </div>


                            <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-blue-200 border rounded-md px-4 py-3 text-sm">
                                {/* LOT 41 P0 XSS fix */}
                                <SafeHtml html={report?.description || ""} />

                            </div>


                            {/* Files Section */}
                            {report.docs?.length > 0 && (
                                <div className="md:col-span-2">
                                    <p className="block text-sm mb-2">Pièces jointes :</p>
                                    <Stack className="flex flex-wrap flex-col !gap-1">
                                        {report?.docs?.map((doc: any) => (
                                            <Badge
                                                key={doc.name}
                                                size="lg"
                                                className="!cursor-pointer !capitalize hover:!underline"
                                                onClick={() => handlePreview(doc)}
                                                leftSection={<IconPhoto size={14} />}
                                                color="orange"
                                                variant="transparent"

                                            >
                                                {doc.name}
                                            </Badge>
                                        ))}
                                    </Stack>
                                </div>
                            )}
                        </div>
                    </Card>
                </Stack>
            )}
        </form>
    )
}

export default AuditReportTabs
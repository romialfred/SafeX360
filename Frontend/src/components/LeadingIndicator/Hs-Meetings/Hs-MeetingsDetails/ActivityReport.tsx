import { Text, Button, SimpleGrid, Checkbox, Avatar, Group, Badge } from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import { useDispatch } from "react-redux";
import { getActivityById } from "../../../../services/HsActivityService";
import { convertDocsToFiles, convertFilesToBase64New, handlePreview } from "../../../../utility/DocumentUtility";
import { createActivityReportDTO, getActivityReportByActivityId, updateActivityReport } from "../../../../services/ActivityReportService";
import { hideOverlay, showOverlay } from "../../../../slices/OverlaySlice";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import TextEditor from "../../../UtilityComp/TextEditor";
import FileUpdateDropzone from "../../../UtilityComp/FileUpdateDropzone";
import SafeHtml from "../../../UtilityComp/SafeHtml";
import { IconCheck, IconEdit, IconPhoto } from "@tabler/icons-react";
import { mapIdToName } from "../../../../utility/OtherUtilities";
import { SERIF } from "../hsMeetingsLabels";

/** Titre de section du compte rendu (serif, charte R7). */
const ReportTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-slate-800 mt-4 first:mt-0" style={{ fontFamily: SERIF, fontSize: '14px', fontWeight: 600 }}>
        {children}
    </h3>
);

const ActivityReport = () => {
    const { id } = useParams();
    const [participants, setParticipants] = useState<any[]>([]);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [activityReport, setActivityReport] = useState<any>(null);
    const [participantsMap, setParticipantsMap] = useState<any>({});
    const [editMode, setEditMode] = useState<boolean>(false);

    useEffect(() => {
        getActivityById(id)
            .then((res) => {
                setParticipants(res.participants || []);
                setParticipantsMap(mapIdToName(res.participants));
            })
            .catch((_err) => { });
        fetchActivityReport();
    }, []);

    const fetchActivityReport = () => {
        getActivityReportByActivityId(id)
            .then(async (res) => {
                setActivityReport(res);
                if (res) {
                    const docs = convertDocsToFiles(res.docs);
                    form.setValues({
                        summary: res.summary || "",
                        findings: res.findings || "",
                        docs: docs,
                        signOff: res.signOff?.map((x: any) => String(x)) || [],
                        activityId: id,
                        id: res.id,
                    });
                }
            })
            .catch(() => setActivityReport(null));
    };

    const form = useForm({
        initialValues: {
            summary: "",
            findings: "",
            docs: [] as any[],
            signOff: [] as any[],
            activityId: id,
            id: undefined,
        },
        validate: {},
    });

    const handleSubmit = async () => {
        const docs = await convertFilesToBase64New(form.values.docs);
        dispatch(showOverlay());
        const payload = {
            ...form.values,
            docs: docs,
        };
        const apiCall = editMode && activityReport
            ? updateActivityReport(payload)
            : createActivityReportDTO(payload);

        apiCall
            .then((_res) => {
                successNotification(editMode ? "Compte rendu mis à jour" : "Compte rendu enregistré");
                setEditMode(false);
                fetchActivityReport();
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "L'enregistrement du compte rendu a échoué");
            })
            .finally(() => {
                dispatch(hideOverlay());
            });
    };

    const handleEdit = () => {
        setEditMode(true);
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        const docs = convertDocsToFiles(activityReport.docs);
        form.setValues({
            summary: activityReport.summary || "",
            findings: activityReport.findings || "",
            docs: docs,
            signOff: activityReport.signOff?.map((x: any) => String(x)) || [],
            activityId: id,
            id: activityReport.id,
        });
    };

    return (
        <div className="space-y-4">
            {(activityReport && !editMode) ? (
                // ─── Consultation du compte rendu ───────────────────────────
                <>
                    <div className="flex justify-between items-center">
                        <h2 className="text-slate-800" style={{ fontFamily: SERIF, fontSize: '14.5px', fontWeight: 600 }}>
                            Compte rendu d'exécution
                        </h2>
                        <Button size="sm" onClick={handleEdit} color="teal" variant="light" leftSection={<IconEdit size={14} />}>
                            Modifier
                        </Button>
                    </div>
                    <ReportTitle>Synthèse</ReportTitle>
                    <SafeHtml html={activityReport.summary || "<span>—</span>"} className="prose max-w-none text-[13px] text-slate-700" />

                    <ReportTitle>Constats et observations</ReportTitle>
                    <SafeHtml html={activityReport.findings || "<span>—</span>"} className="prose max-w-none text-[13px] text-slate-700" />

                    <ReportTitle>Preuves et documentation</ReportTitle>
                    {activityReport.docs && activityReport.docs.length > 0 ? (
                        <Group className="flex flex-wrap flex-col !gap-1">
                            {activityReport?.docs?.map((doc: any) => (
                                <Badge
                                    key={doc.name}
                                    size="sm"
                                    className="!cursor-pointer !capitalize"
                                    onClick={() => handlePreview(doc)}
                                    leftSection={<IconPhoto size={12} />}
                                    color="orange"
                                    variant="transparent"
                                >
                                    {doc.name}
                                </Badge>
                            ))}
                        </Group>
                    ) : (
                        <Text size="sm" c="dimmed">Aucun document joint.</Text>
                    )}

                    <ReportTitle>
                        Émargement des participants ({activityReport.signOff?.length || 0}/{participants.length})
                    </ReportTitle>
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="sm" className="mt-2">
                        {activityReport.signOff?.map((person: any) => (
                            <div
                                key={person}
                                className="rounded-xl border border-teal-200 bg-teal-50/60 p-3 flex flex-row items-center gap-3"
                            >
                                <Avatar radius="xl" size="sm" color="teal" name={participantsMap[person]?.name} />
                                <div className="min-w-0">
                                    <Text size="sm" className="truncate">{participantsMap[person]?.name}</Text>
                                    <Text size="xs" c="dimmed" className="truncate">{participantsMap[person]?.role || 'Participant'}</Text>
                                </div>
                                <IconCheck className="ml-auto text-teal-600" size={16} aria-hidden="true" />
                            </div>
                        ))}
                    </SimpleGrid>
                </>
            ) : (
                // ─── Saisie ou modification du compte rendu ─────────────────
                <>
                    <TextEditor form={form} id="summary" title="Synthèse" />
                    <TextEditor form={form} id="findings" title="Constats et observations" />
                    <FileUpdateDropzone title="Preuves et documentation" id="docs" form={form} />

                    <ReportTitle>
                        Émargement des participants ({form.values.signOff.length}/{participants.length})
                    </ReportTitle>
                    <Text size="sm" c="dimmed" mb={12}>
                        Cochez les participants présents à la réunion
                    </Text>
                    <Checkbox.Group
                        {...form.getInputProps("signOff")}
                        className="flex flex-col gap-4"
                    >
                        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="sm">
                            {participants.map((person) => {
                                const isSelected = form.values.signOff.includes(person.id.toString());
                                return (
                                    <label
                                        key={person.id}
                                        htmlFor={`signoff-${person.id}`}
                                        className={`relative cursor-pointer rounded-xl border p-3 flex flex-col transition-colors duration-150 ${isSelected
                                            ? "border-teal-300 bg-teal-50/60"
                                            : "border-slate-200 bg-white"
                                            }`}
                                    >
                                        <div className="flex flex-row items-center gap-3 w-full">
                                            <div className="relative">
                                                <Avatar
                                                    radius="xl"
                                                    size="md"
                                                    color={isSelected ? "teal" : "blue"}
                                                    name={person.name}
                                                />
                                                {isSelected && (
                                                    <span className="absolute -right-1.5 -top-1.5 bg-teal-600 text-white rounded-full p-0.5">
                                                        <IconCheck size={12} aria-hidden="true" />
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <Text size="sm" className="text-slate-900 truncate">
                                                    {person.name}
                                                </Text>
                                                <Text size="xs" c="dimmed" className="truncate">
                                                    {person.role || 'Participant'}
                                                </Text>
                                            </div>
                                        </div>
                                        <Checkbox
                                            id={`signoff-${person.id}`}
                                            value={person.id.toString()}
                                            checked={isSelected}
                                            tabIndex={-1}
                                            className="absolute top-[35%] right-3 pointer-events-none"
                                            readOnly
                                        />
                                    </label>
                                );
                            })}
                        </SimpleGrid>
                    </Checkbox.Group>
                    <div className="flex gap-2 justify-end pt-2">
                        <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                                editMode && activityReport ? handleCancelEdit() : navigate(-1);
                            }}
                        >
                            Annuler
                        </Button>
                        <Button
                            size="sm"
                            color="teal"
                            onClick={handleSubmit}
                            type="submit"
                        >
                            {editMode ? "Mettre à jour le compte rendu" : "Soumettre le compte rendu"}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ActivityReport;

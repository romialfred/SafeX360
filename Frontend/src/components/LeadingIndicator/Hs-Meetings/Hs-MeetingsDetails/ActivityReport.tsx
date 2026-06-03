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
import { IconCheck, IconPhoto } from "@tabler/icons-react";
import { mapIdToName } from "../../../../utility/OtherUtilities";

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
            .catch((err) => console.error("Error fetching activity info:", err));
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
                        id: res.id // In case needed for update
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
            id: undefined // for update
        },
        validate: {},
    });

    const handleSubmit = async () => {
        const docs = await convertFilesToBase64New(form.values.docs);
        dispatch(showOverlay());
        const payload = {
            ...form.values,
            docs: docs
        };
        const apiCall = editMode && activityReport
            ? updateActivityReport(payload) // <-- You must implement this service
            : createActivityReportDTO(payload);

        apiCall
            .then((_res) => {
                successNotification(editMode ? "Activity report updated successfully" : "Activity report created successfully");
                setEditMode(false);
                fetchActivityReport();
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Something went wrong");
            })
            .finally(() => {
                dispatch(hideOverlay());
            });
    };

    const handleEdit = () => {
        setEditMode(true);
        // Form values already set in fetchActivityReport()
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
            id: activityReport.id
        });
    };

    return (
        <div className="space-y-5">
            {(activityReport && !editMode) ? (
                // === READ-ONLY REPORT DISPLAY ===
                <>
                    <div className="flex justify-between items-center">

                        <h2>Activity Report</h2>
                        <Button size="sm" onClick={handleEdit} variant="gradient">
                            Edit
                        </Button>
                    </div>
                    <Text size="md" mt={6}>Summary</Text>
                    < div
                        className="prose max-w-none text-sm text-gray-700"
                        dangerouslySetInnerHTML={{ __html: activityReport.summary || "<span>-</span>" }
                        }
                    />

                    < Text size="md" mt={6} > Findings & Observations</Text >
                    <div
                        className="prose max-w-none text-sm text-gray-700"
                        dangerouslySetInnerHTML={{ __html: activityReport.findings || "<span>-</span>" }}
                    />

                    <Text size="md" mt={6}>Evidence & Documentation</Text>
                    {
                        activityReport.docs && activityReport.docs.length > 0 ? (
                            <Group className="flex flex-wrap flex-col !gap-1">
                                {activityReport?.docs?.map((doc: any) => (
                                    <Badge
                                        key={doc.name}
                                        size="sm"
                                        className="!cursor-pointer !capitalize !hover:!underline"
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
                            <Text size="sm" color="dimmed">No documents.</Text>
                        )
                    }

                    <Text className="!text-base !mb-2 mt-6">
                        Participant Sign-off ({activityReport.signOff?.length || 0}/{participants.length})
                    </Text>
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg" className="mt-4">
                        {activityReport.signOff?.map((person: any) => (
                            <div
                                key={person}
                                className="rounded-2xl border border-primary bg-primary/10 p-4 flex flex-row items-center gap-4"
                            >
                                <Avatar radius="xl" size="md" color="primary" name={participantsMap[person]?.name} />
                                <div>
                                    <Text size="sm">{participantsMap[person]?.name}</Text>
                                    <Text size="sm" color="dimmed">{participantsMap[person]?.role}</Text>
                                </div>
                                <IconCheck className="ml-auto text-primary" size={18} />
                            </div>
                        ))}
                    </SimpleGrid>


                </>
            ) : (
                // === FORM VIEW (create or edit) ===
                <>
                    <TextEditor form={form} id="summary" title="Summary" />
                    <TextEditor form={form} id="findings" title="Findings & Observations" />
                    <FileUpdateDropzone title="Evidence & Documentation" id="docs" form={form} />

                    <Text className="!text-xl !mb-2">
                        Participant Sign-off ({form.values.signOff.length}/{participants.length})
                    </Text>
                    <Text size="sm" color="dimmed" mb={16}>
                        Select the participants that were/are present
                    </Text>
                    <Checkbox.Group
                        {...form.getInputProps("signOff")}
                        className="flex flex-col gap-6"
                    >
                        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
                            {participants.map((person) => {
                                const isSelected = form.values.signOff.includes(person.id.toString());
                                return (
                                    <label
                                        key={person.id}
                                        htmlFor={`signoff-${person.id}`}
                                        className={`relative group cursor-pointer rounded-2xl border
                        transition-all duration-200 p-4
                        flex flex-col items-center shadow-md
                        hover:shadow-lg
                        ${isSelected
                                                ? "border-primary bg-gradient-to-b from-primary/10 to-white scale-[1.03]"
                                                : "border-gray-200 bg-white"
                                            }`}
                                        style={{
                                            minHeight: "100px",
                                            minWidth: "220px",
                                        }}
                                    >
                                        <div className="flex flex-row items-center gap-4 w-full">
                                            <div className="relative">
                                                <Avatar
                                                    radius="xl"
                                                    size="lg"
                                                    color={isSelected ? "primary" : "blue"}
                                                    name={person.name}
                                                    className={`ring-2 ${isSelected ? "ring-primary" : "ring-gray-200"}`}
                                                />
                                                {isSelected && (
                                                    <span className="absolute -right-2 -top-2 bg-primary text-white rounded-full p-1">
                                                        <IconCheck size={16} />
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <Text size="sm" className="text-gray-900">
                                                    {person.name}
                                                </Text>
                                                <Text size="sm" color="dimmed" className="text-gray-500">
                                                    {person.role}
                                                </Text>
                                            </div>
                                        </div>
                                        <Checkbox
                                            id={`signoff-${person.id}`}
                                            value={person.id.toString()}
                                            checked={isSelected}
                                            tabIndex={-1}
                                            className="absolute top-[35%] right-4 pointer-events-none"
                                            readOnly
                                        />
                                    </label>
                                );
                            })}
                        </SimpleGrid>
                    </Checkbox.Group>
                    <div className="flex gap-2 mt-8 justify-center">
                        <Button
                            size="md"
                            variant="outline"
                            onClick={() => {
                                editMode && activityReport ? handleCancelEdit() : navigate(-1);
                            }}
                        >
                            {editMode ? "Cancel" : "Cancel"}
                        </Button>
                        <Button
                            size="md"
                            onClick={handleSubmit}
                            type="submit"
                            variant="gradient"
                        >
                            {editMode ? "Update Report" : "Submit Report"}
                        </Button>
                    </div>
                </>
            )}
        </div >
    );
};

export default ActivityReport;
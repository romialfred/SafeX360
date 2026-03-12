import { useEffect, useState } from "react";
import { Button, Card, TextInput, Group, Stack, Grid, Badge } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCalendar, IconEdit, IconPhoto, IconFilePencil } from "@tabler/icons-react";
import { DateInput } from "@mantine/dates";
import TextEditor from "../../../UtilityComp/TextEditor";
import FileUpdateDropzone from "../../../UtilityComp/FileUpdateDropzone";
import { useParams } from "react-router-dom";
import { modals } from "@mantine/modals";
import { convertFilesToBase64New, handlePreview } from "../../../../utility/DocumentUtility";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../../slices/OverlaySlice";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";

import { formatDateShort } from "../../../../utility/DateFormats";
import { addInspectionReport, getInspectionReportByInspectionId } from "../../../../services/PgiReportService";
import dayjs from "dayjs";

const InspectionReportTabs = () => {
    const dispatch = useDispatch();
    const { id } = useParams(); // generalInspectionId
    const [isEditing, setIsEditing] = useState(true);
    const [report, setReport] = useState<any>(null);


    const form = useForm({
        initialValues: {
            reportedId: "",
            reportDate: "",
            description: "",
            docs: [],
            generalInspectionId: ''

        },
    });

    useEffect(() => {
        dispatch(showOverlay());
        getInspectionReportByInspectionId(id)
            .then((res: any) => {
                setReport(res);
                setIsEditing(false);
            })
            .catch(() => {
                setIsEditing(true);
            })
            .finally(() => dispatch(hideOverlay()));
    }, [id]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();

        form.validate();
        if (!form.isValid()) return;

        const values = form.values;

        modals.openConfirmModal({
            title: <span className="font-semibold text-2xl">Are you sure?</span>,
            centered: true,
            children: <span className="text-md">Do you want to submit this inspection report?</span>,
            labels: { confirm: `Yes, Submit`, cancel: "Cancel" },
            cancelProps: { color: "red", variant: "filled" },
            confirmProps: { color: "green", variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: async () => {
                dispatch(showOverlay());
                try {
                    const evidence = await convertFilesToBase64New(values.docs);
                    console.log("Evidence:", evidence);

                    const payload = {
                        generalInspectionId: parseInt(id || ""),
                        reportDate: dayjs(values.reportDate).format("YYYY-MM-DD"), // ✅ fixed
                        reportedId: Number(values.reportedId),
                        description: values.description,
                        docs: evidence,
                    };

                    console.log("✅ Payload being sent:", payload);

                    await addInspectionReport(payload);
                    successNotification("Inspection report created successfully");

                    form.reset();
                    setIsEditing(false);
                    getInspectionReportByInspectionId(id).then(setReport);
                } catch (err: any) {
                    console.error("❌ API Error:", err);
                    errorNotification(err.response?.data?.errorMessage || "Something went wrong");
                } finally {
                    dispatch(hideOverlay());
                }
            },
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            {isEditing ? (
                <Stack>
                    <Card shadow="md" withBorder>
                        <p className="flex items-center text-lg mb-2 font-medium text-gray-600">
                            <IconFilePencil stroke={1.5} size={20} /> Inspection Report Details
                        </p>
                        <Grid>
                            <Grid.Col span={6}>
                                <TextInput size="md" {...form.getInputProps("reportedId")} label=" select reporter" placeholder="Enter reported ID" withAsterisk />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <DateInput
                                    leftSection={<IconCalendar />}
                                    label="Report Date"
                                    placeholder="dd-mm-yyyy"
                                    {...form.getInputProps("reportDate")}
                                    withAsterisk
                                />
                            </Grid.Col>
                        </Grid>
                    </Card>

                    <Card shadow="md" withBorder>
                        <TextEditor form={form} id="description" title="Description" />
                    </Card>

                    <Card shadow="md" withBorder>
                        <p className="text-lg font-medium text-gray-600">Supporting Documents</p>
                        <FileUpdateDropzone name="Supporting Documents" id="docs" form={form} />
                    </Card>

                    <Group justify="end">
                        <Button onClick={handleSubmit} color="blue">Submit</Button>
                    </Group>
                </Stack>
            ) : (
                <Stack>
                    <Card shadow="md" withBorder className="!rounded-lg !p-6">
                        <Group justify="space-between" className="mb-2">
                            <h1 className="text-lg font-bold text-blue-700">Inspection Report Summary</h1>
                            <Button onClick={() => setIsEditing(true)} radius="xl" leftSection={<IconEdit size={16} />}>Edit</Button>
                        </Group>

                        <div className="flex flex-col gap-4 p-5 rounded-xl shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <p><strong>Reported By:</strong> {report?.reportedId}</p>
                                <p><strong>Date:</strong> {formatDateShort(report?.reportDate)}</p>
                                <p><strong>Inspection ID:</strong> {report?.generalInspectionId}</p>
                            </div>

                            <div className="border-blue-200 border rounded-md px-4 py-3 text-sm">
                                <div dangerouslySetInnerHTML={{ __html: report?.description || "" }} />
                            </div>

                            {report?.docs?.length > 0 && (
                                <div>
                                    <p className="block text-sm mb-2">Attachments:</p>
                                    <Stack className="flex flex-wrap flex-col !gap-1">
                                        {report.docs.map((doc: any) => (
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
    );
};

export default InspectionReportTabs;

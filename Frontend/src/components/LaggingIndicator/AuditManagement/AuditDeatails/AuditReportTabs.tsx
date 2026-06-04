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
            title: <span className="text-2xl">Are you sure?</span>,
            centered: true,
            children: (
                <span className="text-md">
                    You want to add this report?
                </span>
            ),
            labels: { confirm: `Yes, Create`, cancel: "Cancel" },
            cancelProps: { color: "red", variant: "filled" },
            confirmProps: { color: "green", variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: async () => {
                const evidence = await convertFilesToBase64New(values.report.docs);
                console.log({ report: { ...values.report, docs: evidence }, contributors: values.contributors })
                dispatch(showOverlay());
                addAuditReport({ report: { ...values.report, docs: evidence }, contributors: values.contributors })
                    .then(() => {
                        successNotification("Report created successfully");
                        form.reset();
                        setIsEditing(false);
                        fetchReport();
                    }
                    ).catch((err) => {
                        errorNotification(err.response?.data?.errorMessage || "Something went wrong");
                    }
                    ).finally(() => {
                        dispatch(hideOverlay());
                    }
                    )
            },
        });



    };


    return (
        <form onSubmit={handleSubmit}>
            {isEditing ? (
                <Stack>
                    <Card shadow="md" withBorder>
                        <p className="flex items-center text-lg mb-2 text-gray-600">
                            <IconFilePencil stroke={1.5} size={20} /> Report Preparer
                        </p>
                        <Grid>
                            <Grid.Col span={6}>
                                <TextInput size="md"{...form.getInputProps("report.preparerName")} label="Name" placeholder="Enter preparer's name" />
                            </Grid.Col>
                            {/* <Grid.Col span={4}> */}
                            {/* <TextInput label="Role" placeholder="Enter preparer's role" {...form.getInputProps("report.preparerRole")} /> */}
                            {/* </Grid.Col> */}
                            <Grid.Col span={6}>
                                <DateInput leftSection={<IconCalendar />} label="Date" placeholder="dd-mm-yyyy" {...form.getInputProps("report.preDate")} />
                            </Grid.Col>
                        </Grid>
                    </Card>

                    <Card shadow="md" withBorder>
                        <Group justify="space-between" mb="xs">
                            <p className="flex text-lg items-center text-gray-600">
                                <IconUsers stroke={1.5} size={20} /> Contributors
                            </p>
                            <Button size="xs" leftSection={<IconPlus />} onClick={addContributor}>Add Contributor</Button>
                        </Group>
                        {form.values.contributors.map((_item, index) => (
                            <Fieldset key={index} className="grid grid-cols-2 gap-5 mb-5" legend={
                                <div className="flex gap-5">
                                    <div className="text-lg text-blue-500">Contributor {index + 1}</div>
                                    <ActionIcon onClick={() => removeContributor(index)} variant="filled" color="red">
                                        <IconTrash style={{ width: "70%", height: "70%" }} stroke={1.5} />
                                    </ActionIcon>
                                </div>
                            }>
                                <TextInput label="Name" placeholder="Enter Contributor Name" {...form.getInputProps(`contributors.${index}.name`)} />
                                {/* <TextInput label="Role" placeholder="Enter Contributor Role" {...form.getInputProps(`contributors.${index}.role`)} /> */}
                                <TextInput label="Section" placeholder="Enter Contributor Section" {...form.getInputProps(`contributors.${index}.section`)} />
                            </Fieldset>
                        ))}
                    </Card>

                    <Card shadow="md" withBorder>
                        <p className="flex items-center mb-2 text-lg text-gray-600">
                            <IconUserCheck stroke={1.5} size={20} /> Report Validator
                        </p>
                        <Grid mb={10}>
                            <Grid.Col span={6}>
                                <TextInput {...form.getInputProps("report.validatorName")} label="Name" placeholder="Enter preparer's name" />
                            </Grid.Col>
                            {/* <Grid.Col span={4}>
                                <TextInput label="Role" placeholder="Enter preparer's role" {...form.getInputProps("report.validatorRole")} />
                            </Grid.Col> */}
                            <Grid.Col span={6}>
                                <Select {...form.getInputProps("report.validatorStatus")} placeholder="Select Status" data={["Pending Review", "Approved", "Rejected"]} label="Status" />
                            </Grid.Col>
                        </Grid>
                        {form.values.report?.validatorStatus == "Rejected" && (
                            <TextInput label="Rejection Comment" placeholder="Enter comments" {...form.getInputProps("report.rejectionComment")} />
                        )}
                    </Card>

                    <Card shadow="md" withBorder>
                        <p className="text-lg text-gray-600">Supporting Documents</p>
                        <FileUpdateDropzone name="Supporting Documents" id="report.docs" form={form} />
                    </Card>

                    <Card shadow="md" withBorder>
                        <TextEditor form={form} id="report.description" title="Report Content" />
                    </Card>

                    <Group justify="end">
                        <Button onClick={handleSubmit} color="blue">Submit</Button>
                    </Group>
                </Stack>
            ) : (
                <Stack>
                    <Card shadow="md" withBorder className="!rounded-lg !p-6">
                        {/* Header */}
                        <Group justify="space-between" className="mb-2">
                            <h1 className="text-lg text-blue-700">Report Summary</h1>
                            <Button
                                onClick={() => setIsEditing(true)}
                                radius="xl"
                                leftSection={<IconEdit size={16} />}
                            >
                                Edit
                            </Button>
                        </Group>

                        {/* Content Container */}
                        <div className="flex flex-col gap-5  p-5 rounded-xl shadow-sm">
                            {/* Top Section: Status + Description */}
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                <Badge variant="light" className="!capitalize"
                                    color={report?.validatorStatus === "Approved" ? "green" : report?.validatorStatus === "Rejected" ? "red" : "blue"}
                                    size="lg"
                                >
                                    {report?.validatorStatus}
                                </Badge>

                                {report?.validatorStatus === "Rejected" && (
                                    <Text className="text-red-600 text-sm">
                                        <strong>Rejection Comment:</strong> {report?.rejectionComment}
                                    </Text>
                                )}
                                <div className="flex text-sm items-center gap-2">
                                    <span >Preparation Date :</span>
                                    <Badge variant="light" color="orange"
                                        className="!capitalize"

                                    >{formatDateShort(report?.preDate)}</Badge>
                                </div>
                            </div>

                            {/* Preparer & Validator Info */}
                            <div className="grid grid-cols-1 text-sm sm:grid-cols-3 gap-4">
                                <p className="">
                                    Preparer: {report?.preparerName}
                                </p>
                                <div className="flex flex-wrap items-center gap-1">
                                    <Text size="sm" className="">Contributors:</Text>
                                    {contributors.map((c, i) => (
                                        <span key={i} className="text-sm" >
                                            {c.name} {i < contributors.length - 1 ? "," : ""}
                                        </span>
                                    ))}
                                </div>
                                <p className="">
                                    Validator: {report?.validatorName}
                                </p>

                            </div>


                            <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-blue-200 border rounded-md px-4 py-3 text-sm">
                                {/* LOT 41 P0 XSS fix */}
                                <SafeHtml html={report?.description || ""} />

                            </div>


                            {/* Files Section */}
                            {report.docs?.length > 0 && (
                                <div className="md:col-span-2">
                                    <p className="block text-sm mb-2">Attachments:</p>
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
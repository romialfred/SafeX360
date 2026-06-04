import {
    Breadcrumbs,
    Card,
    Text,
    Group,
    Button,
    Select,
    SimpleGrid,
    Checkbox,
    Avatar,
    Fieldset,
    ActionIcon,
    TextInput,
} from "@mantine/core";
import { Link, useNavigate, useParams } from "react-router-dom";
import TextEditor from "../../UtilityComp/TextEditor";
import { IconPlus, IconTrash } from "@tabler/icons-react";
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


const ActivityReport = () => {
    const { id } = useParams();
    const [participants, setParticipants] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        getActivityById(id).then((res) => {
            setParticipants(res.participants);
        })
            .catch((err) => {
                console.error("Error fetching activity info:", err);
            });
        getEmployeeDropdown()
            .then((res) => {
                console.log(res);
                setEmployees(res.map((x: any) => ({ value: "" + x.id, label: x.name })));
            })
            .catch((err) => {
                console.error("Error fetching employee info:", err);
            });
    }, []);


    const handleAddActionItem = () => {
        form.insertListItem("actions", {
            actionName: "",
            assignedEmployeeId: "",
            deadline: "",
            status: "",
            description: "",
            hsActivityId: id,
        })
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
            actions: []


        },
        validate: {


        },
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
        console.log(form.values);
        const docs = await convertFilesToBase64(form.values.report.docs);
        dispatch(showOverlay());
        createActivityReport({
            ...form.values,
            report: {
                ...form.values.report,
                docs: docs
            },

        })
            .then((_res) => {
                successNotification("Activity report created successfully");
                navigate("/hs-Meetings");
            }
            )
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Something went wrong");

            }).finally(() => {
                dispatch(hideOverlay());
            }
            )

    }


    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    {/* LOT 40 P1: titre page passé en text-slate-900 */}
                    <div className="text-2xl text-slate-900 w-fit">Activity Execution Report</div>
                    <Breadcrumbs mt="xs" mb="lg">
                        {/* LOT 40 P1: breadcrumbs Mantine 7 — couleurs sémantiques au lieu de variant="gradient" */}
                        <Link className="hover:!underline" to="/">
                            <Text c="dimmed">Home</Text>
                        </Link>
                        <Link className="hover:!underline" to="/hs-Meetings">
                            <Text c="dimmed">Health and Safety Meeting</Text>
                        </Link>
                        <Text c="teal" fw={500}>Activity Execution Report</Text>
                    </Breadcrumbs>
                </div>
            </div>

            <Card shadow="sm" radius="md" withBorder className="!p-6 bg-white space-y-6 ">
                <TextEditor form={form} id="report.summary" title="Summary" />
                <TextEditor form={form} id="report.findings" title="Findings & Observations" />

                {/* <Text className="!text-xl !font-medium">Evidence & Documentation</Text>
                <div className="grid grid-cols-2 gap-4 p-2">
                    <div>
                        <Dropzone
                            onDrop={(files: File[]) => {
                                const updatedImages = [...uploadedImages, ...files];
                                setUploadedImages(updatedImages);
                                forms.setFieldValue(id + "_images", updatedImages);
                            }}
                            accept={["image/*"]}
                            maxSize={30 * 1024 * 1024}
                            multiple
                            className="border-2 border-dashed rounded-md p-5"
                        >
                            <div style={{ pointerEvents: "none" }}>
                                <Group justify="center">
                                    <Dropzone.Accept>
                                        <IconDownload size={50} color={theme.colors.blue[6]} stroke={1.5} />
                                    </Dropzone.Accept>
                                    <Dropzone.Reject>
                                        <IconX size={50} color={theme.colors.red[6]} stroke={1.5} />
                                    </Dropzone.Reject>
                                    <Dropzone.Idle>
                                        <IconCamera size={50} stroke={1.5} />
                                    </Dropzone.Idle>
                                </Group>
                                <Text ta="center" fz="lg" mt="xl">
                                    <Dropzone.Accept>Drop image files here</Dropzone.Accept>
                                    <Dropzone.Reject>Only image files under 30MB are allowed</Dropzone.Reject>
                                    <Dropzone.Idle>Upload images</Dropzone.Idle>
                                </Text>
                            </div>
                        </Dropzone>

                        {uploadedImages.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                {uploadedImages.map((file, index) => (
                                    <div key={index} className="relative group border p-4 rounded shadow bg-white">
                                        <div className="w-full h-[120px] flex items-center justify-center">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`upload-${index}`}
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        </div>

                                        <Tooltip label="View" withArrow position="top">
                                            <button
                                                type="button"
                                                onClick={() => setPreviewFile(URL.createObjectURL(file))}
                                                className="absolute top-2 right-12 bg-white text-blue-600 p-2 rounded-full shadow hover:scale-105 transition-all opacity-0 group-hover:opacity-100 z-10"
                                            >
                                                <IconEye size={18} />
                                            </button>
                                        </Tooltip>

                                        <Tooltip label="Delete" withArrow position="top">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                className="absolute top-2 right-2 bg-white text-red-600 p-2 rounded-full shadow hover:scale-105 transition-all opacity-0 group-hover:opacity-100 z-10"
                                            >
                                                <IconTrash size={18} />
                                            </button>
                                        </Tooltip>

                                        <Text ta="center" fz="xs" className="truncate !p-2">
                                            {file.name}
                                        </Text>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <Dropzone
                            onDrop={(files: File[]) => {
                                const updatedDocs = [...uploadedDocs, ...files];
                                setUploadedDocs(updatedDocs);
                                forms.setFieldValue(id + "_docs", updatedDocs);
                            }}
                            accept={["application/pdf"]}
                            maxSize={30 * 1024 * 1024}
                            multiple
                            className="border-2 border-dashed rounded-md p-5"
                        >
                            <div style={{ pointerEvents: "none" }}>
                                <Group justify="center">
                                    <Dropzone.Accept>
                                        <IconDownload size={50} color={theme.colors.blue[6]} stroke={1.5} />
                                    </Dropzone.Accept>
                                    <Dropzone.Reject>
                                        <IconX size={50} color={theme.colors.red[6]} stroke={1.5} />
                                    </Dropzone.Reject>
                                    <Dropzone.Idle>
                                        <IconFile size={50} stroke={1.5} />
                                    </Dropzone.Idle>
                                </Group>
                                <Text ta="center" fz="lg" mt="xl">
                                    <Dropzone.Accept>Drop PDF files here</Dropzone.Accept>
                                    <Dropzone.Reject>Only PDF files under 30MB are allowed</Dropzone.Reject>
                                    <Dropzone.Idle>Upload documents</Dropzone.Idle>
                                </Text>
                            </div>
                        </Dropzone>

                        {uploadedDocs.length > 0 && (
                            <div className="mt-4 flex flex-col gap-4">
                                {uploadedDocs.map((file, index) => (
                                    <div
                                        key={index}
                                        className="relative group border p-5 rounded shadow bg-white flex justify-between items-center"
                                    >
                                        <Text>{file.name}</Text>
                                        <div className="flex gap-2">
                                            <Tooltip label="View" withArrow position="top">
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewFile(URL.createObjectURL(file))}
                                                    className="bg-white text-blue-600 p-2 rounded-full shadow hover:scale-105 transition-all"
                                                >
                                                    <IconEye size={18} />
                                                </button>
                                            </Tooltip>

                                            <Tooltip label="Delete" withArrow position="top">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveDoc(index)}
                                                    className="bg-white text-red-600 p-2 rounded-full shadow hover:scale-105 transition-all"
                                                >
                                                    <IconTrash size={18} />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <Modal
                    opened={!!previewFile}
                    onClose={() => setPreviewFile(null)}
                    title="Preview"
                    centered
                    size="lg"
                    withCloseButton
                    overlayProps={{ blur: 3 }}
                >
                    {previewFile && (
                        <div className="flex justify-center items-center">
                            {previewFile.endsWith(".pdf") ? (
                                <embed src={previewFile} type="application/pdf" width="100%" height="600px" />
                            ) : (
                                <img
                                    src={previewFile}
                                    alt="Preview"
                                    className="max-w-full max-h-[75vh] rounded shadow-md object-contain"
                                />
                            )}
                        </div>
                    )}
                </Modal> */}
                <ImagePdfDropzone title="Evidence & Documentation" id="report.docs" form={form} />
                <div className="flex justify-between p-2">
                    <Text className="!text-xl !font-medium">Corrective Actions</Text>
                    <Button leftSection={<IconPlus />} onClick={handleAddActionItem}>
                        Add Action
                    </Button>
                </div>

                <div className="space-y-4">
                    {form.values.actions.map((_item, index: any) => (
                        // LOT 40 P1: grille responsive (mobile→single col) + légende teal-700 + aria-label descriptif
                        <Fieldset key={index} className="grid grid-cols-1 md:grid-cols-2 gap-6" legend={<div className="flex gap-5">
                            <div className="text-lg text-teal-700">Action {index + 1}</div>
                            <ActionIcon onClick={() => form.removeListItem('actions', index)} variant="filled" color="red" aria-label="Supprimer l'action">
                                <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
                            </ActionIcon>
                        </div>}>
                            <TextInput {...form.getInputProps(`actions.${index}.actionName`)} label="Action Plan Name" placeholder='Enter action plan name' />
                            <Select {...form.getInputProps(`actions.${index}.assignedEmployeeId`)} data={employees} label="Assign Employee" placeholder="Select assigned employee" />
                            <DateInput {...form.getInputProps(`actions.${index}.deadline`)} label="Deadline" placeholder="Select deadline" />
                            <Select {...form.getInputProps(`actions.${index}.status`)} data={[{ label: "Pending", value: "PENDING" }, { label: "In-Progress", value: "IN_PROGRESS" }, { label: "Canceled", value: "CANCELED" }, { label: "Completed", value: "COMPLETED" }]} label="Status" placeholder="Select status" />
                            <div className='col-span-2'>

                                <TextEditor form={form} id={`actions.${index}.description`} title="Description" />
                            </div>
                        </Fieldset>
                    ))}
                </div>

                <Text className="!text-xl !mb-2">Participant Sign-off ({form.values.report.signOff.length}/{participants.length})</Text>
                <Text size="sm" color="dimmed" mb={16}>
                    Select the participants that were/are present
                </Text>

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
                                    className={`!p-4 transition-all duration-200 ${isSelected ? "!bg-primary/10 !border-primary shadow-md" : "bg-white"
                                        }`}
                                >
                                    <Group align="center" justify="space-between" className="!gap-4">
                                        <div className="flex items-center gap-5">

                                            <Avatar radius="xl" size="md" color="blue" name={person.name} />

                                            <div className="flex flex-col">
                                                <Text size="md">
                                                    {person.name}
                                                </Text>
                                                <Text size="sm" color="dimmed">
                                                    {person.role}
                                                </Text>
                                            </div>
                                        </div>
                                        <Checkbox.Indicator size="md" />
                                    </Group>
                                </Checkbox.Card>
                            );
                        })}
                    </SimpleGrid>
                </Checkbox.Group>
            </Card>
            <div className="flex gap-2 mt-8 justify-center">
                <Button size="md" variant="outline">Cancel</Button>
                <Button size="md" onClick={handleSubmit} type="submit" variant="gradient">Submit Report</Button>
            </div>
        </div>
    );
};

export default ActivityReport;

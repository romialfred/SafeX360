import { useEffect, useState } from "react";
import {
    Button,
    Textarea,
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
import { actionStatuses, recMap, recommendationStatus } from "../../../../Data/DropdownData";
import { useDispatch } from "react-redux";
import { modals } from "@mantine/modals";
import { getObservationDropdown } from "../../../../services/ObservationService";
import { hideOverlay, showOverlay } from "../../../../slices/OverlaySlice";
import { createFollowup, createRecommendation, getRecommendationByAuditId, getRecommendationFollowups } from "../../../../services/AuditService";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import { formatDateShort } from "../../../../utility/DateFormats";
import { capitalizeFirstLetter, getProgressColor, isValidRichText } from "../../../../utility/OtherUtilities";
import { Tag } from "primereact/tag";

const RecommendationFileTab = ({ employees, empMap, audit, observationVersion }: any) => {
    console.log(audit);
    const { id } = useParams();
    const [showForm, setShowForm] = useState(false);
    const dispatch = useDispatch();
    const [observations, setObservations] = useState<any[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [recommendation, setRecommendation] = useState<any>({});
    const [recommendationFollowups, setRecommendationFollowups] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [opened, setOpened] = useState<"modify" | "update" | "history" | null>(null);
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


    const handleSave = () => {
        setShowForm(false);
    };

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
            title: (value) => value ? null : "Title is required",
            auditId: (value) => value ? null : "Audit ID is required",
            observationId: (value) => value ? null : "Observation ID is required",
            description: (value) => value ? null : "Description is required",
            priority: (value) => value ? null : "Priority is required",
            actionManagerId: (value) => value ? null : "Action Manager is required",
            correctiveAction: (value) => value ? null : "Corrective Action is required",
            deadline: (value) => value ? null : "Deadline is required",
            status: (value) => value ? null : "Status is required",
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

            status: (value) => (value ? null : 'Status is required'),
            comment: (value) => (isValidRichText(value) ? null : 'Comment is required'),


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
                    console.log(res);

                }
                ).catch((_err) => { })
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
            title: <span className="text-2xl">Are you sure?</span>,
            centered: true,
            children: (
                <span className="text-md">
                    You want to create this observation?
                </span>
            ),
            labels: { confirm: `Yes, Create`, cancel: "Cancel" },
            cancelProps: { color: "red", variant: "filled" },
            confirmProps: { color: "green", variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: async () => {

                dispatch(showOverlay());
                createRecommendation(form.values)
                    .then(() => {
                        successNotification("Recommendation created successfully");
                        form.reset();
                        setShowForm(false);
                        fetchObservations();
                        fetchRecommendation();
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
    }

    const handleFollowupSubmit = (values: any) => {
        if (isAuditLocked) return;
        modals.openConfirmModal({
            title: <span className="text-2xl">Are you sure?</span>,
            centered: true,
            children: (
                <span className="text-md">
                    You want to update the recommendation.
                </span>
            ),
            labels: { confirm: `Yes, Update`, cancel: "Cancel" },
            cancelProps: { color: "red", variant: "filled" },
            confirmProps: { color: "green", variant: "filled" },
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
                    successNotification("Recommendation updated successfully");
                }).catch((_err) => {
                    errorNotification(_err.response?.data?.errorMessage || "Something went wrong");
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
                        <Title order={4} className="text-gray-700">Recommendations ({recommendations.length})</Title>
                        {!isAuditLocked && (
                            <Button
                                leftSection={<IconPlus />}
                                onClick={() => setShowForm(true)}
                            >
                                New Recommendation
                            </Button>
                        )}
                    </div>

                    {/* Recommendation Cards */}
                    {recommendations.length > 0 && recommendations.map((obs, index) => (
                        <Card key={index} shadow="sm" padding="lg" radius="md" withBorder>
                            {/* Top Section */}
                            <Group justify="space-between" mb="md">
                                <Group gap="xs">
                                    <Badge color="orange" variant="light" className="!capitalize" >{recMap[obs.status]}</Badge>
                                    <Badge color="red" variant="light" className="!capitalize" >{obs.priority}</Badge>
                                </Group>

                                <Group gap="xs">
                                    {!isAuditLocked && (
                                        <>
                                            <Button size="xs" variant="light" color="blue" onClick={() => handleModal("modify", obs)}>Modify</Button>
                                            <Button size="xs" color="green" variant="light" onClick={() => handleModal("update", obs)}>Update</Button>
                                        </>
                                    )}
                                    <Button size="xs" color="orange" variant="light" onClick={() => handleModal("history", obs)}>History</Button>
                                </Group>
                            </Group>

                            {/* Title */}
                            <div className="text-gray-800 font-normal !mb-2">{obs.title}</div>

                            {/* Description and Info */}
                            <Stack gap="xs">
                                <Group justify="space-between " >  <Text size="sm">
                                    <strong className="text-gray-600 ">Responsible:</strong>{" "}
                                    {empMap[obs.actionManagerId]?.name || "N/A"}
                                </Text>
                                    <Text size="sm">
                                        <strong className="text-gray-600">Deadline:</strong>{" "}
                                        {formatDateShort(obs.deadline)}
                                    </Text>
                                </Group>

                                {/* Progress Bar */}
                                <div>
                                    <Group justify="space-between" mb={5}>
                                        <Text size="sm">Advancement</Text>
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
                                    <Text size="sm" c="gray">Corrective Action</Text>
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
                    {/* New Observation Form */}
                    <div className="flex justify-between items-center">

                        <h2 className="text-lg text-gray-700 ">New Recommendation</h2>
                        <Button color="red" onClick={handleCancel}>Cancel</Button>

                    </div>
                    <div className="flex flex-col gap-5">


                        <div className="grid grid-cols-2 gap-5">
                            <TextInput label="Recommendation Title" placeholder="Enter Recommendation Title" withAsterisk {...form.getInputProps('title')} />
                            <Select label="Associated observation" placeholder="Select Associated finding " data={observations} withAsterisk  {...form.getInputProps('observationId')} />
                            <div className="col-span-2">

                                <TextEditor title="Description of Recommendation" withAsterisk form={form} id="description" />
                            </div>
                            <Select label="Priority" placeholder="Select Priority" withAsterisk data={["High", "Average", "Weak"]}  {...form.getInputProps('priority')} />
                            <Select label="Action Manager" placeholder=" Select Action Manager " data={employees} withAsterisk {...form.getInputProps('actionManagerId')} />

                            <div className="col-span-2">
                                <TextEditor title="Planned corrective action" withAsterisk form={form} id="correctiveAction" />
                            </div>

                            <DateInput label="Deadline of completion" placeholder="Enter Date" {...form.getInputProps('deadline')} minDate={new Date(audit.startDate)} withAsterisk />
                            <Select
                                placeholder="Select Status*"
                                label="Status"
                                data={actionStatuses}
                                withAsterisk
                                {...form.getInputProps('status')}
                            />
                        </div>

                        {/* Action buttons */}
                        <div className="flex justify-end gap-3 mt-6">

                            <Button onClick={handleSubmit}>Save</Button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Modals */}
            <Modal
                opened={opened === "modify"}
                onClose={() => setOpened(null)}
                title="Modify Corrective Action"
                size="lg"
                centered
            >
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-4">
                            <Select
                                label="Associated finding"
                                placeholder="Select Associated finding "
                                data={[]}
                                withAsterisk
                                {...form.getInputProps("report")}
                            />
                            <Textarea
                                placeholder="Describe the recommendation to be implemented...."
                                label="Description of Recommendation"
                                withAsterisk
                                {...form.getInputProps("description")}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="Priority"
                                placeholder="Select Priority"
                                withAsterisk
                                data={["High", "Average", "Weak"]}
                                {...form.getInputProps("gravity")}
                            />
                            <Select
                                label="Action leader"
                                placeholder="Select Action leader"
                                data={["John Smith", "Ronert", "Sara", "Max"]}
                                withAsterisk
                                {...form.getInputProps("location")}
                            />
                        </div>

                        <div>
                            <Textarea
                                placeholder="Describe the corrective action to be implemented...."
                                label="Planned corrective action"
                                withAsterisk
                                {...form.getInputProps("description")}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                placeholder="Select Status*"
                                label="Status"
                                data={["Completed", "Pending", "Cheked", "In-Progress", "Rejected"]}
                                withAsterisk
                                {...form.getInputProps("employee")}
                            />
                            <DateInput
                                label="Completion date"
                                placeholder="Enter Date"
                                {...form.getInputProps("interviewDate")}
                                withAsterisk
                            />
                        </div>
                    </div>

                    {/* Modal Action Buttons */}
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="outline" color="gray" onClick={() => setOpened(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>Save</Button>
                    </div>
                </div>
            </Modal>

            <Modal
                opened={opened === "update"}
                onClose={() => setOpened(null)}
                title={<div className="text-lg text-blue-500">Recommendation Update</div>}
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
                            <div className="text-lg">Title : {recommendation?.title}</div>
                            <div>
                                <p className="text-lg text-gray-700">Description</p>
                                <div className="border-blue-300 border rounded-lg shadow-sm p-4 ">
                                    {/* LOT 41 P0 XSS fix */}
                                    <SafeHtml html={recommendation?.description} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">

                                <NumberInput {...updateForm.getInputProps('progress')} label="Progress (%)" max={100} clampBehavior="blur" min={recommendation.progress} />
                                <Select {...updateForm.getInputProps('status')} label="Status" placeholder="Select Status" data={recommendationStatus.slice(recommendationStatus.findIndex((item) => item.value === (recommendationFollowups?.length > 0 ? recommendationFollowups[recommendationFollowups.length - 1]?.status : recommendation?.status)))} />
                            </div>
                            <TextEditor form={updateForm} id="comment" title="Update Comment" />
                            <Divider size="xs" />
                            <div className="flex justify-center gap-2">
                                <Button type="button" onClick={() => setOpened(null)} variant="outline">Close</Button>
                                <Button type="submit" variant="gradient">Save Changes</Button>
                            </div>
                        </form>
                        {recommendationFollowups && recommendationFollowups.length > 0 && (
                            <>
                                <Divider size="xs" orientation="vertical" />
                                <div className="space-y-5 h-[530px] overflow-y-auto">
                                    <p className="text-lg items-center mb-4 flex gap-1 text-amber-600">
                                        <IconClock /> Update History
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

                                                            <Badge radius="sm" variant="outline" color="purple" className="!capitalize">{recMap[x.status]}</Badge>
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
                                                            <p className="text-blue-400">Update Details</p>
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
                title={<span className="text-blue-500 text-lg"> Recommendation Update History</span>}
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
                        <div className="text-base "> Title: {recommendation.title}</div>
                        <div className="flex justify-between">
                            <p><strong>Action Manager:</strong> {empMap[recommendation.actionManagerId]?.name}</p>
                            <p><strong>Deadline:</strong> {formatDateShort(recommendation.deadline)}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="text-base">Change History ({recommendationFollowups.length})</div>

                        {recommendationFollowups.map((entry, index) => {
                            const previous = recommendationFollowups[index - 1];
                            const statusChange = previous
                                ? `${capitalizeFirstLetter(recMap[previous.status])} → ${capitalizeFirstLetter(recMap[entry.status])}`
                                : `Initial → ${capitalizeFirstLetter(recMap[entry.status])}`;
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

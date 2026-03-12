import { Breadcrumbs, Text, Button, Card, Progress, Select, NumberInput, Badge, Group } from "@mantine/core";
import { IconClock, IconFileText, IconAlertCircle, IconUser, IconCalendar, IconBulb } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom"; // 👈 useLocation import
import FileDropzone from "../../UtilityComp/FileDropzone";
import { useForm } from "@mantine/form";
import { actionStatuses, actionStatusesMap } from "../../../Data/DropdownData";
import { formatDateShort } from "../../../utility/DateFormats";
import { addActionProcess, getAllActionProcessByActionId } from "../../../services/ActionProcessService";
import { convertFileToBase64DTO } from "../../../utility/DocumentUtility";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { getActionById } from "../../../services/CorrectiveActionService";
import TextEditor from "../../UtilityComp/TextEditor";
import { isValidRichText } from "../../../utility/OtherUtilities";

const UpdateAdhocAction = () => {
    const { id } = useParams();
    const [actionHistory, setActionHistory] = useState<any[]>([]);
    const [selectedRow, setSelectedRow] = useState<any>({});
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const form = useForm({
        initialValues: {
            status: '',
            description: '',
            progress: 0,
            docs: []
        },
        validate: {
            status: (value) => (value?.trim().length > 0 ? null : 'Status is Required'),
            progress: (value) => (value === null || value === undefined ? 'Progress is Required' : null),
            description: (value) => (isValidRichText(value) ? null : 'Description is Required')
        }
    });

    // Track initial values for revert logic
    const [initialStatus, setInitialStatus] = useState<string>('');
    const [initialProgress, setInitialProgress] = useState<number>(0);

    // Track previous values to detect direction of change
    const prevProgressRef = useRef<number>(0);
    const prevStatusRef = useRef<string>('');

    // Keep status/progress in sync in the UI with revert support
    useEffect(() => {
        const progress = Number(form.values.progress ?? 0);
        const status = String(form.values.status || '').toUpperCase();

        if (progress >= 100 && status !== 'COMPLETED') {
            form.setFieldValue('status', 'COMPLETED');
        }

        if (prevProgressRef.current === 100 && progress < 100 && initialStatus) {
            form.setFieldValue('status', initialStatus);
        }

        prevProgressRef.current = progress;
    }, [form.values.progress, initialStatus]);

    useEffect(() => {
        const progress = Number(form.values.progress ?? 0);
        const status = String(form.values.status || '').toUpperCase();

        if (status === 'COMPLETED' && progress < 100) {
            form.setFieldValue('progress', 100);
        }

        if (prevStatusRef.current === 'COMPLETED' && status !== 'COMPLETED') {
            form.setFieldValue('progress', initialProgress);
        }

        prevStatusRef.current = status;
    }, [form.values.status, initialProgress]);

    const statusUpper = String(selectedRow?.status || '').toUpperCase();
    const isCompleted = (selectedRow?.progress ?? 0) >= 100 || statusUpper === 'COMPLETED';
    const isCancelled = statusUpper === 'CANCELLED';
    const isPending = statusUpper === 'PENDING';
    const cannotUpdate = isCompleted || isCancelled || isPending;

    useEffect(() => {
        getActionById(id)
            .then((res) => {
                setSelectedRow(res);
                form.setValues({
                    status: res.status,
                    description: res.description,
                    progress: res.progress,
                    docs: Array.isArray(res.docs) ? res.docs : []
                });
                setInitialStatus(res.status || '');
                setInitialProgress(Number(res.progress ?? 0));
                prevStatusRef.current = String(res.status || '').toUpperCase();
                prevProgressRef.current = Number(res.progress ?? 0);
            }).catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Something went wrong");
            })

        // Fetch action history
        getAllActionProcessByActionId(id)
            .then((res) => setActionHistory(res))
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Something went wrong");
            });

    }, [id]);

    const handleSubmit = async (values: any) => {
        dispatch(showOverlay());
        const docsInput = Array.isArray(values.docs) ? values.docs : [];
        const docs = await Promise.all(docsInput.map(convertFileToBase64DTO));

        // Enforce consistency server-side as well
        const sanitizedValues = { ...values } as any;
        const numericProgress = Number(sanitizedValues.progress ?? 0);

        if (numericProgress >= 100) {
            sanitizedValues.progress = 100;
            sanitizedValues.status = 'COMPLETED';
        }

        if (String(sanitizedValues.status || '').toUpperCase() === 'COMPLETED') {
            sanitizedValues.progress = 100;
        }

        const payload = {
            ...sanitizedValues,
            correctiveActionId: id,
            docs: docs,
        };


        addActionProcess(payload)
            .then((_res) => {
                successNotification("Improvement idea progress updated.");
                navigate("/adhoc-actions");
            })
            .catch((err) => {

                errorNotification(err.response?.data?.errorMessage || "Something went wrong");
            })
            .finally(() => {
                dispatch(hideOverlay());
            });
    };

    return (
        <div className="flex flex-col gap-5 p-5">
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text">Update Improvement Idea</div>
                    <Breadcrumbs mt="xs">
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text>
                        </Link>
                        <Link className="hover:!underline" to="/adhoc-actions">
                            <Text variant="gradient" className="hover:!underline cursor-pointer">Improvement Ideas</Text>
                        </Link>
                        <Text variant="gradient">Update Improvement Idea</Text>
                    </Breadcrumbs>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-5">
                {/* Left Side: Form column with details box above */}
                <div className='flex self-start flex-col col-span-2 gap-3 shadow-sm p-5 rounded-md border border-gray-200'>
                    {/* Idea Details box */}
                    <div className="bg-white rounded-md">
                        <div className="mb-5">
                            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <IconFileText className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="text-sm font-semibold text-blue-900">Idea Details</p>
                                        <p className="text-xs text-blue-700">Review the current improvement idea context.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className=" space-y-4">
                            {/* Top meta: Incident and Assignee */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-2">
                                    <span className="p-1.5 rounded-md bg-blue-50 text-blue-600"><IconAlertCircle size={16} /></span>
                                    <div>
                                        <p className="text-xs capitalize tracking-wide text-gray-500">Incident / Source</p>
                                        <p className="text-sm text-gray-900">{selectedRow?.incidentTitle || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="p-1.5 rounded-md bg-violet-50 text-violet-600"><IconUser size={16} /></span>
                                    <div>
                                        <p className="text-xs capitalize tracking-wide text-gray-500">Assigned To</p>
                                        <p className="text-sm text-gray-900">{selectedRow?.assignedEmployeeName || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action name */}
                            <div className="flex items-start gap-2">
                                <span className="p-1.5 rounded-md bg-cyan-50 text-cyan-600"><IconFileText size={16} /></span>
                                <div className="w-full">
                                    <p className="text-xs capitalize tracking-wide text-gray-500">Idea Title</p>
                                    <p className="text-sm text-gray-900">{selectedRow?.actionName || '-'}</p>
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="rounded-md border border-gray-200 p-3">
                                    <p className="text-xs capitalize tracking-wide text-gray-500 mb-1 flex items-center gap-1"><IconCalendar size={14} /> Deadline</p>
                                    <p className="text-sm text-gray-900">{selectedRow?.deadline ? formatDateShort(selectedRow.deadline) : '-'}</p>
                                </div>
                                <div className="rounded-md border border-gray-200 p-3">
                                    <p className="text-xs capitalize tracking-wide text-gray-500 mb-1">Current Progress</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-900">{selectedRow?.progress ?? 0}%</p>
                                    </div>
                                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                                        <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${selectedRow?.progress ?? 0}%` }} />
                                    </div>
                                </div>
                                <div className="rounded-md border border-gray-200 p-3">
                                    <p className="text-xs capitalize tracking-wide text-gray-500 mb-1">Current Status</p>
                                    <Badge size="sm" radius="sm" variant="light" color="yellow" className="!capitalize">
                                        <Group gap={4}><IconClock size={14} /> {actionStatusesMap[selectedRow?.status] || '-'}</Group>
                                    </Badge>
                                </div>
                            </div>

                            {selectedRow?.description && (
                                <div className="rounded-md border border-gray-200 p-3">
                                    <p className="text-xs capitalize tracking-wide text-gray-500 mb-1">Description</p>
                                    <Text size="sm" className="text-gray-700" dangerouslySetInnerHTML={{ __html: selectedRow?.description }} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Separator between Details and Update */}
                    <hr className="my-2 border-t border-gray-200" />

                    {/* Update heading */}
                    <div className="px-1">
                        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <IconClock className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="text-sm font-semibold text-blue-900">Status Update</p>
                                    <p className="text-xs text-blue-700">Update progress and add supporting details.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Existing update UI (unchanged) */}
                    {cannotUpdate ? (
                        <Card shadow="xs" padding="md" radius="md" withBorder className={`${isCompleted ? 'bg-green-50 border-green-200' : isCancelled ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                            {isCompleted && (<Text c="green" fw={600}>This idea is already completed (100% or status Completed). Further updates are not allowed.</Text>)}
                            {isPending && (<Text c="yellow" fw={600}>This idea is pending approval. Updates are not allowed until it is approved.</Text>)}
                            {isCancelled && (<Text c="red" fw={600}>This idea has been cancelled. Further updates are not allowed.</Text>)}
                        </Card>
                    ) : (
                        <form className='space-y-3' onSubmit={form.onSubmit(handleSubmit)}>
                            <div className="grid grid-cols-2 gap-3">
                                <NumberInput size="sm" disabled={cannotUpdate} {...form.getInputProps('progress')} label="Progress (%)" max={100} clampBehavior="blur" min={selectedRow.progress} />
                                <Select size="sm" disabled={cannotUpdate} label="Status" data={actionStatuses.slice(actionStatuses.findIndex((item) => item.value === (actionHistory?.length > 0 ? actionHistory[actionHistory.length - 1]?.status : selectedRow?.status)))}  {...form.getInputProps('status')} />
                            </div>
                            <TextEditor form={form} id="description" title="Description" withAsterisk />
                            {!cannotUpdate && <FileDropzone form={form} id="docs" />}
                            <div className="flex gap-2 mt-2">
                                <Button variant='default' onClick={() => navigate('/adhoc-actions')}>Cancel</Button>
                                <Button disabled={cannotUpdate} variant='gradient' type='submit'>Save</Button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Right Side: History */}
                {selectedRow.progress >= 0 && (
                    <div className="col-span-1 self-start p-5 space-y-5 rounded-md border shadow-sm border-gray-200 ">
                        <p className="text-lg items-center font-semibold mb-4 flex gap-1 text-amber-600"><IconClock /> Update History</p>
                        {actionHistory.length === 0 && (
                            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                                <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-1"><IconBulb size={16} /> Tips</h4>
                                <ul className="text-xs text-blue-700 space-y-1">
                                    <li>• Update progress regularly</li>
                                    <li>• Add details about obstacles encountered</li>
                                    <li>• Attach photos or documents if necessary</li>
                                    <li>• Notify the assignee of important changes</li>
                                </ul>
                            </div>
                        )}
                        {actionHistory.slice().reverse().map((x: any, index: number, arr: any[]) => {
                            const previousProgress = index < arr.length - 1 ? arr[index + 1].progress : 0;
                            const progressMade = x.progress - previousProgress;
                            return (
                                <Card key={index} shadow="sm" padding="sm" radius="md" withBorder className="">
                                    <div className="flex flex-col gap-4">
                                        {/* Header */}
                                        <div className="flex justify-between items-center">
                                            <div className="rounded-4xl">
                                                <p className="text-sm font-medium text-amber-800 flex gap-1 p-1 items-center">
                                                    <IconClock /> {formatDateShort(x.createdAt)}
                                                </p>
                                            </div>
                                            <Badge radius="sm" variant="outline" color="purple" className="!capitalize">{actionStatusesMap[x.status]}</Badge>
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
                                            <Text dangerouslySetInnerHTML={{ __html: x.description || "-" }} size="sm" className="text-gray-700 mt-1" />
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                        {actionHistory.length > 0 && null}
                    </div>
                )}
            </div>
        </div>
    )
}

export default UpdateAdhocAction;

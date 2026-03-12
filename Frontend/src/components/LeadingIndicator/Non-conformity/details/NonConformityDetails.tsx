import { useEffect, useState } from 'react';
import {
    Title,
    Button,
    Group,
    Badge,
    Text,
    Paper,
    Tabs,
    Modal,
    Select,
    Textarea,
    Breadcrumbs,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
    IconEdit,
    IconDownload,
    IconTool,
    IconClock,
    IconFileText,
    IconTarget,
    IconSettings,
    IconLock,
    IconHistory,
} from '@tabler/icons-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { eventStatuses, eventStatusMap } from '../../../../Data/DropdownData';
import { useForm } from '@mantine/form';
import { getEmployeeDropdown } from '../../../../services/EmployeeService';
import { useDisclosure } from '@mantine/hooks';
import NonConformityHistory from './NonConformityHistory';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../../../utility/NotificationUtility';
import { createNCHistory, getNCHistorybyNonConformityID } from '../../../../services/NonConFormityHistoryService';
import NonConformityTreatment from './NonConformityTreatment';
import NonConformityAnalysis from './NonConformityAnalysis';
import NonConformityOverview from './NonConformityOverview';
import { getEventAnalysisByNonConformityId, getNonConformity } from '../../../../services/NonConformityService';
import { getActionsByNonConformityId } from '../../../../services/CorrectiveActionService';
import { mapIdToName } from '../../../../utility/OtherUtilities';
import ActionPlansTab from './ActionPlanTab';
import { getAllLocations } from '../../../../services/LocationService';
import { GetAllWorkProcess } from '../../../../services/WorkProcessService';


const NonConformityDetails = () => {
    const [opened, { open, close }] = useDisclosure(false);
    const [emps, setEmps] = useState<any[]>([]);
    const [empMap, setEmpMap] = useState<any>({});
    const dispatch = useDispatch();
    const [history, setHistory] = useState<any[]>([]);
    const { id } = useParams();
    const nonConformityId = Number(id);
    const [nonConformity, setNonConformity] = useState<any | null>({});
    const [analysis, setAnalysis] = useState<any | null>({});
    const [actions, setActions] = useState<any[]>([]);
    const [locationMap, setLocationMap] = useState<any>({});
    const [processMap, setProcessMap] = useState<any>({});
    const navigate = useNavigate();
    useEffect(() => {
        dispatch(showOverlay());
        getNonConformity(id).then((res) => {
            setNonConformity(res);
            form.setValues({
                ...form.values,
                status: res.status || '',
                nonConformityId,
            });
        }).catch((_err) => {
        }).finally(() => {
            dispatch(hideOverlay());
        })
        getEventAnalysisByNonConformityId(id)
            .then((res) => {
                setAnalysis(res);
            })
            .catch((_err) => { })

        getActionsByNonConformityId(id).then((res) => {
            setActions(res);
        }).catch((_err) => { });
        getEmployeeDropdown()
            .then((res) => {
                const mappedEmployees = res.map((emp: any) => ({
                    label: emp.name,
                    value: String(emp.id), // ensure value is string if form field is string
                }));
                setEmps(mappedEmployees);
                setEmpMap(mapIdToName(res));
            })
            .catch((_err) => { });
        getAllLocations({})
            .then((res) => {
                setLocationMap(mapIdToName(res));
            })
            .catch((_err) => { });
        GetAllWorkProcess({})
            .then((res) => {
                setProcessMap(mapIdToName(res));
            })
            .catch((_err) => { });
        fetchHistory();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'REPORTED': return 'blue';
            case 'ANALYSIS': return 'yellow';
            case 'AC_IMPLEMENTATION': return 'orange';
            case 'CLOSED': return 'green';
            case 'REJECTED': return 'red';
            default: return 'gray';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Urgente': return 'red';       // Highest urgency
            case 'Élevée': return 'orange';     // High priority
            case 'Normale': return 'yellow';    // Medium
            case 'Faible': return 'green';      // Low
            default: return 'gray';             // Unknown / fallback
        }
    };
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'Insignifiante': return 'green';
            case 'Mineure': return 'lime';
            case 'Modérée': return 'yellow';
            case 'Majeure': return 'orange';
            case 'Catastrophique': return 'red';
            default: return 'gray';
        }
    };



    const form = useForm({
        initialValues: {
            ownerId: "",
            date: null as Date | null,
            status: "",
            comment: "",
            nonConformityId: nonConformityId

        },
        validate: {
            ownerId: (value) => value ? null : "Owner is required",
            date: (value) => value ? null : "Date is required",
            status: (value) => value ? null : "Status is required",
        }
    });

    const normalizedStatus = String(nonConformity?.status || '').toUpperCase();
    const statusSequence = ['REPORTED', 'ANALYSIS', 'AC_IMPLEMENTATION', 'CLOSED'];
    const currentStatusIndex = statusSequence.indexOf(normalizedStatus);
    const isFinalStatus = normalizedStatus === 'CLOSED' || normalizedStatus === 'CANCELLED';

    const progressionStatuses = currentStatusIndex >= 0
        ? statusSequence.slice(currentStatusIndex)
        : statusSequence;

    const allowedStatusSet = new Set(progressionStatuses);
    if (!isFinalStatus && normalizedStatus !== 'CANCELLED') {
        allowedStatusSet.add('CANCELLED');
    }

    const allowedStatusOptions = eventStatuses.filter((option) => allowedStatusSet.has(option.value));

    const statusSelectOptions = allowedStatusOptions.length > 0 ? allowedStatusOptions : eventStatuses;

    const handleStatusChange = () => {
        if (isFinalStatus) {
            return;
        }

        const defaultStatus = statusSelectOptions.find((option) => option.value === normalizedStatus)?.value
            || statusSelectOptions[0]?.value
            || '';

        form.setValues((prev) => ({
            ...prev,
            status: defaultStatus,
            nonConformityId,
            date: prev.date || new Date(),
        }));

        open();
    };

    const fetchHistory = () => {
        getNCHistorybyNonConformityID(id).then((res) => {
            setHistory(res);

        }).catch((err) => {
            console.log(err);
        });
    }

    const handleSubmit = async (values: any) => {
        dispatch(showOverlay());
        createNCHistory(values).then((_res) => {
            successNotification("Status updated successfully");
            close();
            setNonConformity((prev: any) => ({
                ...prev,
                status: values.status,
            }));
            fetchHistory();
        }).catch((err) => {
            errorNotification(err.response?.data?.errorMessage || "Something went wrong");
        }).finally(() => {
            dispatch(hideOverlay());
        });
    };

    return (
        <div className='p-5'>

            <div>
                <div className="font-semibold  text-2xl text-blue-500 w-fit"> Central Finding Details</div>
                <Breadcrumbs mt="xs" mb="lg">
                    <Link className="hover:!underline" to="/"><Text variant="gradient">Home</Text></Link>
                    <Link className="hover:!underline" to="/non-conformity"><Text variant="gradient">Central Findings Dashboard</Text></Link>
                    <Link className="hover:!underline" to=""><Text variant="gradient">Central Finding Details</Text></Link>

                </Breadcrumbs>
            </div>
            {/* Header */}
            <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 mb-6">
                <Group justify="space-between" className="mb-4">
                    <Group>
                        {/* <ActionIcon
                            onClick={onBack}
                            variant="light"
                            className="rounded-lg hover:bg-slate-100"
                            size="lg"
                        >
                            <IconArrowLeft size={18} />
                        </ActionIcon> */}
                        <div>
                            <Title order={2} className="text-slate-800 flex items-center gap-10 font-bold">
                                {nonConformity.number}  <div className='text-sm font-normal flex gap-2 items-center'>
                                    <span>Status :</span>
                                    <Badge
                                        color={getStatusColor(nonConformity.status)}
                                        variant="light"
                                        size="lg"
                                        className="rounded-full !capitalize"
                                    >
                                        {eventStatusMap[nonConformity.status]}
                                    </Badge>
                                </div>
                            </Title>
                            {/* <Text className="text-slate-600">
                                Non-Conformity Details
                            </Text> */}
                        </div>
                    </Group>

                    <Group gap="md">

                        {/* <Button
                            leftSection={<IconPrinter size={16} />}
                            variant="outline"
                            className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg"
                        >
                            Print
                        </Button>
                        <Button
                            leftSection={<IconShare size={16} />}
                            variant="outline"
                            className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg"
                        >
                            Share
                        </Button> */}
                        <Button
                            leftSection={<IconSettings size={16} />}
                            onClick={handleStatusChange}
                            className={`rounded-lg ${isFinalStatus
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : '!bg-gradient-to-r !from-blue-500 !to-blue-600 hover:!from-blue-600 hover:!to-blue-700 !text-white shadow-lg !shadow-blue-500/25'}`}
                            disabled={isFinalStatus}
                            title={isFinalStatus ? 'Closed or cancelled events cannot be updated.' : undefined}
                        >
                            Manage
                        </Button>
                        <Button
                            leftSection={<IconEdit size={16} />}
                            onClick={() => navigate("/non-conformity/edit/" + nonConformity.id)}
                            className={`rounded-lg ${isFinalStatus
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : '!bg-gradient-to-r !from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-emerald-500/25'}`}
                            disabled={isFinalStatus}
                            title={isFinalStatus ? 'Closed or cancelled events cannot be edited.' : undefined}
                        >
                            Edit
                        </Button>

                        <Button
                            leftSection={<IconDownload size={16} />}
                            variant="outline"
                            className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg"
                        >
                            Export PDF
                        </Button>
                        {/* <Button
                            leftSection={<IconTrash size={16} />}
                            variant="outline"
                            color="red"
                            className="border-red-300 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                            Delete
                        </Button> */}
                    </Group>
                </Group>

                {/* Status Overview */}
                <div className="space-y-4">
                    <Group>
                        <div className='flex items-center gap-2 text-sm'>
                            Priority:
                            <Badge
                                color={getPriorityColor(analysis.priority)}
                                variant="outline"
                                size="md"
                                className="rounded-full"
                            >
                                {analysis.priority || 'Not available'}
                            </Badge>
                        </div>
                        <div className='flex items-center gap-2 text-sm'>
                            Severity:
                            <Badge variant="light" color={getSeverityColor(analysis.severityLevel)} size="md" className="bg-slate-100 text-slate-700 rounded-full">
                                {analysis.severityLevel || 'Not available'}
                            </Badge>
                        </div>
                    </Group>

                    {/* <div>
                        <Group justify="space-between" className="mb-2">
                            <Text size="sm" fw={500} className="text-slate-700">Progress</Text>
                            <Text size="sm" className="text-slate-600">{getStatusProgress(nonConformity.status)}%</Text>
                        </Group>
                        <Progress
                            value={getStatusProgress(nonConformity.status)}
                            color={getStatusColor(nonConformity.status)}
                            className="h-2 rounded-full"
                        />
                    </div> */}
                </div>
            </Paper>

            <Tabs defaultValue="overview" className="space-y-2">
                <Tabs.List className="bg-white border border-slate-200 rounded-lg p-1 !flex !gap-1">
                    <Tabs.Tab
                        value="overview"
                        leftSection={<IconFileText size={16} />}
                        className="!text-slate-600 hover:!text-blue-600 data-[active]:!bg-blue-100 data-[active]:!text-blue-800 data-[active]:!border-blue-500 !rounded-lg px-3 py-1.5 text-sm transition-all duration-200"
                    >
                        Overview
                    </Tabs.Tab>
                    <Tabs.Tab
                        value="analysis"
                        leftSection={<IconTarget size={16} />}
                        className="!text-slate-600 hover:!text-blue-600 data-[active]:!bg-blue-100 data-[active]:!text-blue-800 data-[active]:!border-blue-500 !rounded-lg px-3 py-1.5 text-sm transition-all duration-200"
                    >
                        Analysis
                    </Tabs.Tab>
                    <Tabs.Tab
                        value="treatment"
                        leftSection={<IconTool size={16} />}
                        className="!text-slate-600 hover:!text-blue-600 data-[active]:!bg-blue-100 data-[active]:!text-blue-800 data-[active]:!border-blue-500 !rounded-lg px-3 py-1.5 text-sm transition-all duration-200"
                    >
                        Treatment
                    </Tabs.Tab>
                    <Tabs.Tab
                        value="actions"
                        leftSection={<IconClock size={16} />}
                        className="!text-slate-600 hover:!text-blue-600 data-[active]:!bg-blue-100 data-[active]:!text-blue-800 data-[active]:!border-blue-500 !rounded-lg px-3 py-1.5 text-sm transition-all duration-200"
                    >
                        Corrective Actions
                    </Tabs.Tab>

                    <Tabs.Tab
                        value="history"
                        leftSection={<IconHistory size={16} />}
                        className="!text-slate-600 hover:!text-blue-600 data-[active]:!bg-blue-100 data-[active]:!text-blue-800 data-[active]:!border-blue-500 !rounded-lg px-3 py-1.5 text-sm transition-all duration-200"
                    >
                        History
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="overview">
                    {nonConformity && Object.keys(nonConformity).length > 0 ? (
                        <NonConformityOverview nonConformity={nonConformity} empMap={empMap} analysis={analysis} locationMap={locationMap} processMap={processMap} />
                    ) : (
                        <Text className="text-slate-400">No data available</Text>
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="analysis">
                    {analysis && Object.keys(analysis).length > 0 ? (
                        <NonConformityAnalysis analysis={analysis} />
                    ) : (
                        <Text className="text-slate-400">No analysis data available</Text>
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="treatment">
                    {nonConformity && Object.keys(nonConformity).length > 0 ? (
                        <NonConformityTreatment nonConformity={nonConformity} actions={actions} />
                    ) : (
                        <Text className="text-slate-400">No treatment data available</Text>
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="actions">
                    {actions && actions.length > 0 ? (
                        <ActionPlansTab actions={actions} />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10">
                            <IconClock size={40} className="text-blue-300 mb-2" />
                            <Text size="md" fw={500} className="text-blue-400">No corrective actions found</Text>
                            <Text size="sm" className="text-slate-400">There are currently no corrective actions for this event.</Text>
                        </div>
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="history">
                    {history && history.length > 0 ? (
                        <NonConformityHistory history={history} empMap={empMap} />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10">
                            <IconHistory size={40} className="text-blue-300 mb-2" />
                            <Text size="md" fw={500} className="text-blue-400">No history available</Text>
                            <Text size="sm" className="text-slate-400">No status changes or updates have been recorded yet.</Text>
                        </div>
                    )}
                </Tabs.Panel>
            </Tabs>

            {/* Manage NC Modal */}
            <Modal
                opened={opened}
                onClose={close}

                title={<div className='text-lg flex items-center gap-2'>  <span className='bg-gray-100 rounded-full p-2'><IconLock /></span>Manage Central Finding Details</div>}
                centered
                size="lg"
                classNames={{
                    body: 'p-6',
                    header: 'text-lg font-semibold border-b border-gray-500 mx-2',
                }}
            >
                <form onSubmit={form.onSubmit(handleSubmit)} className="flex flex-col gap-4 mt-4">


                    <Select
                        label="Owner"
                        placeholder="Select owner"
                        data={emps}
                        {...form.getInputProps("ownerId")}
                        withAsterisk
                    />

                    <DateInput
                        maxDate={new Date()}
                        label="Date"
                        placeholder='Select date'
                        {...form.getInputProps("date")}
                        withAsterisk
                    />
                    <Select

                        label="Status"
                        placeholder="Select Status"
                        data={statusSelectOptions}
                        {...form.getInputProps("status")}
                        withAsterisk
                    />
                    <Textarea
                        label="Comment"
                        placeholder="Write comment regarding status change"
                        {...form.getInputProps("comment")}
                        minRows={3}
                    />

                    {/* <Alert
                                 icon={<IconAlertCircle size="1.2rem" />}
                                 title="Warning: Incomplete Action Plans"
                                 color="orange"
                                 className="text-sm text-orange-200"
                             >
                                 <span className='text-orange-400'>This incident has incomplete action plans. Closing the incident will not automatically complete these actions. They will need to be managed separately.</span>
                             </Alert> */}

                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" onClick={close}>
                            Cancel
                        </Button>
                        <Button color="primary" type='submit'>
                            Submit
                        </Button>
                    </div>
                </form>
            </Modal>


        </div>
    );
};

export default NonConformityDetails;

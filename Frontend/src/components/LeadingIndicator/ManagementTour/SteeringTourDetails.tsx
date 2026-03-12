import {
    Alert,
    Breadcrumbs,
    Button,
    Modal,
    NumberInput,
    Select,
    Tabs,
    Text,
    Textarea,
    Tooltip
} from "@mantine/core";
import {
    IconCalendarEvent,
    IconClock,
    IconFileCheck,
    IconFileText,
    IconHistory,
    IconLock,
    IconTrendingUp,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { useDisclosure } from "@mantine/hooks";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDispatch } from "react-redux";
import { getEmployeeDropdown } from "../../../services/EmployeeService";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { mapIdToName } from "../../../utility/OtherUtilities";
import { addHsActivityHistory, getHsActivityHistoryById } from "../../../services/ActivityHistoryService";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import ViewDetailsMeeting from "../Hs-Meetings/Hs-MeetingsDetails/ViewDetailsMeeting";
import CorrectiveActions from "../Hs-Meetings/Hs-MeetingsDetails/CorrectiveActions";
import ActivityHistory from "../Hs-Meetings/Hs-MeetingsDetails/ActivityHistory";
import { formatDateShort, formatTimeToAmPm } from "../../../utility/DateFormats";
import { actionStatusesMap, inspectionStatuses } from "../../../Data/DropdownData";
import { getActivityById } from "../../../services/HsActivityService";
import ActivityReport from "../Hs-Meetings/Hs-MeetingsDetails/ActivityReport";


const SteeringTourDetails = () => {
    const [activeTab, setActiveTab] = useState('details');
    const [opened, { open, close }] = useDisclosure(false);
    const [searchParams] = useSearchParams();
    const { id } = useParams();
    const [emps, setEmps] = useState<any[]>([]);
    const [meeting, setMeeting] = useState<any>({});
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const dispatch = useDispatch();
    const [history, setHistory] = useState<any[]>([]);
    const [activity, setActivity] = useState<any>({});
    const [locked, setLocked] = useState<{ locked: boolean; status: string }>({ locked: false, status: '' });



    const form = useForm<{
        ownerId: string;
        date: Date | null;
        status: string;
        comment: string;
    }>({
        initialValues: {
            ownerId: "",
            date: null,
            status: "",
            comment: "",

        },
        validate: {
            ownerId: (value) => value ? null : "Owner is required",
            date: (value) => value ? null : "Date is required",
            status: (value) => value ? null : "Status is required",
        }
    });
    useEffect(() => {
        if (!searchParams) return;
        const tab = searchParams.get('tab')
        if (tab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    useEffect(() => {

        dispatch(showOverlay())
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
        getActivityById(id)
            .then((res) => {
                setActivity(res);
                const statusUpper = String(res?.status || '').toUpperCase();
                if (['COMPLETED', 'CANCELLED'].includes(statusUpper)) {
                    setLocked({ locked: true, status: statusUpper });
                } else {
                    setLocked({ locked: false, status: '' });
                }
                form.setValues({
                    ...form.values,
                    status: res.status || '',
                });
            })
            .finally(() => {
                dispatch(hideOverlay());
            });
        fetchHistory();

    }, []);

    const normalizedStatus = String(activity?.status || '').toUpperCase();
    const statusSequence = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
    const currentStatusIndex = statusSequence.indexOf(normalizedStatus);
    const isFinalStatus = normalizedStatus === 'COMPLETED' || normalizedStatus === 'CANCELLED';

    const progressionStatuses = currentStatusIndex >= 0
        ? statusSequence.slice(currentStatusIndex)
        : statusSequence;

    const allowedStatusSet = new Set(progressionStatuses);
    if (!isFinalStatus && normalizedStatus !== 'CANCELLED') {
        allowedStatusSet.add('CANCELLED');
    }

    const statusSelectOptions = inspectionStatuses.filter((option) => allowedStatusSet.has(option.value));

    const fetchHistory = () => {
        getHsActivityHistoryById(id).then((res) => {
            setHistory(res);
        }).catch((err) => {
            console.log(err);
        });
    }

    const handleSubmit = async (values: any) => {
        if (locked.locked) {
            errorNotification(locked.status === 'COMPLETED' ? 'This activity is completed. Modifications are not allowed.' : 'This activity is cancelled. Modifications are not allowed.');
            return;
        }
        dispatch(showOverlay());

        const payload = {
            ...values,
            hsActivityId: parseInt(id || "")
        };

        addHsActivityHistory(payload)
            .then((_res) => {
                console.log(_res)
                successNotification("Status changed successfully");
                close();
                setMeeting((prev: any) => ({
                    ...prev,
                    status: values.status,
                }));
                setActivity((prev: any) => ({
                    ...prev,
                    status: values.status,
                }));
                if (['COMPLETED', 'CANCELLED'].includes(String(values.status || '').toUpperCase())) {
                    setLocked({ locked: true, status: String(values.status || '').toUpperCase() });
                } else {
                    setLocked({ locked: false, status: '' });
                }
                fetchHistory();
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Something went wrong");
            })
            .finally(() => {
                dispatch(hideOverlay());
            });
    };


    const tabData = {
        details: {
            label: 'Meeting Details',
            icon: IconFileText,
            content: <ViewDetailsMeeting activity={activity} />,

            hide: false
        },
        activity: {
            label: 'Activity Report',
            icon: IconTrendingUp,
            content: <ActivityReport />,
            hide: false
        },
        // recommendation: {
        //     label: 'Recommendation',
        //     icon: IconFileAnalytics,
        //     content: <RecommendationFileTab employees={emps} empMap={empMap} />,
        //     hide: false
        // },
        actions: {
            label: 'Corrective Actions',
            icon: IconFileCheck,
            content: <CorrectiveActions employee={emps} empMap={empMap} />,
            hide: false
        },
        history: {
            label: 'History',
            icon: IconHistory,
            content: <ActivityHistory meeting={meeting} history={history} empMap={empMap} />,
            hide: false

        },



    };


    const handleStatusChange = () => {
        if (locked.locked || isFinalStatus) return;

        const defaultStatus = statusSelectOptions.find((option) => option.value === normalizedStatus)?.value
            || statusSelectOptions[0]?.value
            || '';

        form.setValues({
            ...form.values,
            status: defaultStatus,
            date: form.values.date || new Date(),
        });

        open();
    }
    return (
        <div className=" space-y-6" >
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Steering tour details</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/steering-tours" ><Text variant="gradient" className="hover:!underline cursor-pointer">Steering Tours</Text></Link>
                        <Text variant="gradient">Steering tour details</Text>
                    </Breadcrumbs>
                </div>

            </div>


            <div className="  rounded-lg p-5 space-y-3 bg-home">
                <div className="flex justify-between">
                    <div className='flex flex-col gap-1'>
                        <h2 className="text-2xl flex items-center gap-5 font-semibold text-white">{activity.title}</h2>

                        <div className="flex items-center gap-1 text-white">
                            <IconCalendarEvent size={18} />
                            <span>{formatDateShort(activity?.plannedDate)}, {formatTimeToAmPm(activity?.startTime)} - {formatTimeToAmPm(activity?.endTime)}</span>
                        </div>
                    </div>

                    <div className="flex items-end gap-2  flex-col">
                        <Tooltip label={(locked.locked || isFinalStatus) ? ((locked.status || normalizedStatus) === 'COMPLETED' ? 'Completed — status cannot be changed' : 'Cancelled — status cannot be changed') : 'Change status'}>
                            <span className="inline-flex">
                                <Button leftSection={<IconClock />} onClick={handleStatusChange} disabled={locked.locked || isFinalStatus} className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-sm">{actionStatusesMap[activity?.status]}</Button>
                            </span>
                        </Tooltip>
                    </div>
                </div>

            </div>

            {locked.locked && (
                <Alert color={locked.status === 'COMPLETED' ? 'green' : 'red'} variant="light" className="border">
                    <Text fw={600}>
                        {locked.status === 'COMPLETED' ? 'This activity is completed. Modifications are not allowed.' : 'This activity is cancelled. Modifications are not allowed.'}
                    </Text>
                </Alert>
            )}


            <div className="">
                <Tabs

                    value={activeTab}
                    onChange={(value) => value && setActiveTab(value)}

                >
                    <Tabs.List className='bg-white border border-slate-200 rounded-lg p-2 !flex !gap-1'>
                        {Object.entries(tabData).map(([key, { label, icon: Icon, hide }]) => (
                            !hide && <Tabs.Tab key={key} value={key} leftSection={<Icon size={15} />} className="!text-slate-600 hover:!text-blue-600 data-[active]:!bg-blue-100 data-[active]:!text-blue-800 data-[active]:!border-blue-500 !rounded-lg px-3 py-1.5 text-sm transition-all duration-200">
                                {label}
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>

                    {Object.entries(tabData).map(([key, { content }]) => (
                        <Tabs.Panel value={key} key={key} pt="md">



                            <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                                <div className="p-2">{content}</div>
                            </div>

                        </Tabs.Panel>
                    ))}
                </Tabs>
            </div>

            <Modal
                opened={opened}
                onClose={close}
                title={
                    <div className='text-lg flex items-center gap-2'>
                        <span className='bg-gray-100 rounded-full p-2'><IconLock /></span>
                        Manage Meeting Status
                    </div>
                }
                centered
                size="xl"
                classNames={{
                    body: 'p-6',
                    header: 'text-lg font-semibold border-b border-gray-500 mx-2',
                }}
            >
                <form onSubmit={form.onSubmit(handleSubmit)} className="flex flex-col gap-4 mt-4">
                    {/* <div className="bg-blue-50 rounded-lg p-4 flex flex-col gap-2">
                        <Checkbox label="All corrective actions have been completed and verified" />
                        <p>Current status: 1/3 actions completed (33.3%)</p>
                    </div> */}

                    <div className="grid grid-cols-2 gap-4">
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


                    </div>

                    <Select
                        label="Status"
                        placeholder="Select Status"
                        data={statusSelectOptions}
                        {...form.getInputProps("status")}
                        withAsterisk
                    />

                    {form.values.status === 'CLOSED' ? (
                        <>
                            <NumberInput
                                label="Quality Evaluation (1-10)"
                                placeholder="Enter Quality Evaluation"
                                withAsterisk
                                {...form.getInputProps("evaluation")}
                            />

                            <Textarea
                                label="Closing Report"
                                placeholder="Summary of the closure, validation of action, final comments....."
                                withAsterisk
                                minRows={3}
                                {...form.getInputProps("closingReport")}
                            />

                            <Textarea
                                label="Lessons Learned"
                                withAsterisk
                                placeholder="Points for improvements for future audits, best practices identified, recommendations for the organization"
                                minRows={6}
                                {...form.getInputProps("comment")}
                            />
                        </>
                    ) : (
                        <Textarea
                            label="Comment"
                            withAsterisk
                            placeholder="Enter your comment"
                            minRows={6}
                            {...form.getInputProps("comment")}
                        />
                    )}

                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" onClick={close}>
                            Cancel
                        </Button>
                        <Button color="primary" type='submit' disabled={locked.locked}>
                            Submit
                        </Button>
                    </div>
                </form>
            </Modal>

        </div >
    )
}

export default SteeringTourDetails

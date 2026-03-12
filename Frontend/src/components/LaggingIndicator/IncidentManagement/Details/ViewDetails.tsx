
import { Alert, Badge, Breadcrumbs, Button, Modal, Select, Tabs, Text, Textarea, Tooltip } from '@mantine/core';
import {
    IconCalendarEvent,
    IconClock,
    IconBook,
    IconTrendingUp,
    IconFileText,
    IconSearch,
    IconCalendarFilled,
    IconLock,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getIncidentById } from '../../../../services/IncidentService';
import { mapIdToName } from '../../../../utility/OtherUtilities';
import { formatDate } from '../../../../utility/DateFormats';
import { getEmployeeDropdown, getEmployeesByIds } from '../../../../services/EmployeeService';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../../slices/OverlaySlice';

import IncidentDetailsTab from './IncidentDetailsTab';
import ImpactAnalysis from '../ImpactAnalysis';
import Lesson from './Lesson';
import { incidentHistoryStatus, incidentStatusMap } from '../../../../Data/DropdownData';
import RiskAssessment from '../RiskAssessment';
import { getInvestigationByIncidentId } from '../../../../services/InvestigationService';
import InvestigationDetailsTab from './InvestigationDetailsTab';
import { getCorrectiveActionByIncidentId } from '../../../../services/CorrectiveActionService';
import ActionPlansTab from './ActionPlansTab';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import { errorNotification, successNotification } from '../../../../utility/NotificationUtility';
import { addIncidentHistory, getIncidentHistoryByIncidentId } from '../../../../services/IncidentHistoryService';
import IncidentHistory from './IncidentHistoryTab';
import { getWeathersByIds } from '../../../../services/WeatherService';
import { getAllInvestigationProcessByInvestigationId } from '../../../../services/InvestigationFileService';

const ViewDetails = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const dispatch = useDispatch();
    const [employees, setEmployees] = useState<Record<number, any>>([]);
    const [incident, setIncident] = useState<any>({});
    const [activeTab, setActiveTab] = useState('details');
    const incidentId = Number(id);
    const [investigation, setInvestigation] = useState<any>({});
    const [locked, setLocked] = useState<{ locked: boolean; status: string }>({ locked: false, status: '' });
    const [actions, setActions] = useState<any[]>([]);
    const [opened, { open, close }] = useDisclosure(false);
    const [emps, setEmps] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [weatherMap, setWeatherMap] = useState<Record<number, any>>({});
    const [investigationProcesses, setInvestigationProcesses] = useState<any[]>([]);



    useEffect(() => {
        dispatch(showOverlay());
        getIncidentById(id).then((res) => {
            setIncident(res);
            console.log(res);
            const statusUpper = String(res?.status || '').toUpperCase();
            if (['CLOSED', 'REJECTED'].includes(statusUpper)) {
                setLocked({ locked: true, status: statusUpper });
            }
            dispatch(hideOverlay());
            let emps = Array.from(new Set([...res.involvedPersons, ...res.witnesses, res.reporterId]));
            getEmployeesByIds(emps).then((res: any) => {
                setEmployees(mapIdToName(res));
            }).catch((_err) => {

            });
            getWeathersByIds(res.weatherConditions).then((weatherRes) => {

                setWeatherMap(mapIdToName(weatherRes));
            }).catch((err) => {
                console.log(err);
            })
        }
        ).catch((err) => {
            console.log(err);
        }).finally(() => {
            dispatch(hideOverlay());
        });

        getEmployeeDropdown()
            .then((res) => {
                const mappedEmployees = res.map((emp: any) => ({
                    label: emp.name,
                    value: String(emp.id), // ensure value is string if form field is string
                }));
                setEmps(mappedEmployees);
            })
            .catch((_err) => { });

        getInvestigationByIncidentId(id).then((res) => {
            setInvestigation(res);
            getAllInvestigationProcessByInvestigationId(res.id).then((processes) => {
                setInvestigationProcesses(processes);
            }).catch((_err) => { });

        }).catch((err) => {
            console.log(err);
        })

        getCorrectiveActionByIncidentId(id).then((res) => {
            setActions(res);
        }).catch((err) => {
            console.log(err);
        });

        fetchHistory();



    }, []);
    useEffect(() => {
        if (!searchParams) return;
        const tab = searchParams.get('tab')
        if (tab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const fetchHistory = () => {
        getIncidentHistoryByIncidentId(id).then((res) => {
            setHistory(res);
            console.log(res);

        }).catch((err) => {
            console.log(err);
        });
    }



    const handleStatusChange = () => {
        if (locked.locked) return;
        open();

    }
    const form = useForm({
        initialValues: {
            ownerId: "",
            date: "",
            status: "",
            comment: "",
            incidentId: incidentId
        },
        validate: {
            ownerId: (value) => value ? null : "Owner is required",
            date: (value) => value ? null : "Date is required",
            status: (value) => value ? null : "Status is required",
        }
    });

    const handleSubmit = async (values: any) => {
        if (locked.locked) {
            errorNotification(locked.status === 'CLOSED' ? 'This incident is closed. Modifications are not allowed.' : 'This incident is rejected. Modifications are not allowed.');
            return;
        }
        dispatch(showOverlay());
        addIncidentHistory(values).then((_res) => {
            successNotification("Status changed successfully");
            close();
            setIncident((prev: any) => ({
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


    const tabData = {
        details: {
            label: 'Incident Details',
            icon: IconFileText,
            content: <IncidentDetailsTab
                incident={incident}
                employees={employees}
                weatherMap={weatherMap}
            />,
            hide: false
        },
        analysis: {
            label: 'Impact Analysis',
            icon: IconTrendingUp,
            content: <ImpactAnalysis
                incident={incident}
                employees={employees}
            />,
            hide: false
        },
        risks: {
            label: 'Risk Assessment',
            icon: IconClock,
            content: <RiskAssessment incident={incident} />,
            hide: false
        },
        investigation: {
            label: 'Investigation',
            icon: IconSearch,
            content: <InvestigationDetailsTab investigation={investigation} processes={investigationProcesses} />,
            hide: !investigation || Object.keys(investigation).length === 0,
        },
        actions: {
            label: 'Action Plans',
            icon: IconCalendarFilled,
            content: <ActionPlansTab actions={actions} />,
            hide: !actions || actions.length === 0,
        },

        lessons: {
            label: 'Lessons Learned',
            icon: IconBook,
            content: <Lesson incidentId={incidentId} />,
            hide: false
        },
        history: {
            label: "History",
            icon: IconCalendarEvent,
            content: <IncidentHistory incident={incident} history={history} />,
            hide: history.length === 0
        }

    };

    return (
        <div className=" space-y-6" >
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Incidents Details</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/incidents" ><Text variant="gradient" className="hover:!underline cursor-pointer">Incidents Management</Text></Link>
                        <Text variant="gradient">Incidents Details</Text>
                    </Breadcrumbs>
                </div>

            </div>


            <div className="  rounded-lg p-5 space-y-3 bg-home">
                <div className="flex justify-between">
                    <div className='flex flex-col gap-1'>
                        <h2 className="text-2xl flex items-center gap-5 font-semibold text-white">{incident.title} <Badge className='' radius="xs" size='md'>{incident.number}</Badge></h2>

                        <div className="flex items-center gap-1 text-white">
                            <IconCalendarEvent size={18} />
                            <span>{formatDate(incident.occurredAt)}</span>
                        </div>
                    </div>

                    <div className="flex items-end gap-2  flex-col">
                        <Tooltip label={locked.locked ? (locked.status === 'CLOSED' ? 'Closed — status cannot be changed' : 'Rejected — status cannot be changed') : 'Change status'}>
                            <span className="inline-flex">
                                <Button leftSection={<IconClock />} onClick={handleStatusChange} disabled={locked.locked} className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-sm">{incidentStatusMap[incident.status]}</Button>
                            </span>
                        </Tooltip>
                        <p className='text-sm text-white'>
                            Reporter : <span className='font-medium'>{employees[incident.reporterId] ? employees[incident.reporterId]?.name : "Unknown"}</span>
                        </p>
                    </div>
                </div>

            </div>

            {locked.locked && (
                <Alert color={locked.status === 'CLOSED' ? 'green' : 'red'} variant="light" className="border">
                    <Text fw={600}>
                        {locked.status === 'CLOSED' ? 'This incident is closed. Modifications are not allowed.' : 'This incident is rejected. Modifications are not allowed.'}
                    </Text>
                </Alert>
            )}


            <div className="">
                <Tabs
                    value={activeTab}
                    onChange={(value) => value && setActiveTab(value)}
                    className=""

                >
                    <Tabs.List className="bg-white border border-slate-200 rounded-lg p-2 !flex !gap-1">
                        {Object.entries(tabData).map(([key, { label, icon: Icon, hide }]) => (
                            !hide && <Tabs.Tab key={key} value={key} leftSection={<Icon size={15} />} className="  !text-slate-600 hover:!text-blue-600 data-[active]:!bg-blue-100 data-[active]:!text-blue-800 data-[active]:!border-blue-500 !rounded-lg px-3 py-1.5 text-sm transition-all duration-200">
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
                title={<div className='text-lg flex items-center gap-2'>  <span className='bg-gray-100 rounded-full p-2'><IconLock /></span>Manage Incident Status</div>}
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
                        minDate={history?.length > 0
                            ? new Date(Math.max(...history.map(h => new Date(h.date).getTime())))
                            : incident.discoveryTime
                                ? new Date(incident.discoveryTime)
                                : undefined}
                        {...form.getInputProps("date")}
                        withAsterisk
                    />
                    <Select

                        label="Status"
                        placeholder="Select Status"
                        data={incidentHistoryStatus.slice(incidentHistoryStatus.findIndex((item) => item.value === (history.length > 0 ? history[history.length - 1]?.status : incident.status)))}
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
                        <Button color="primary" type='submit' disabled={locked.locked}>
                            Submit
                        </Button>
                    </div>
                </form>
            </Modal>


        </div >
    );
};

export default ViewDetails;

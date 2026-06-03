import {
    Alert,
    Badge,
    Button,
    Modal,
    NumberInput,
    Select,
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
    IconUsers,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import PageHeader from "../../../UtilityComp/PageHeader";

import { useDisclosure } from "@mantine/hooks";
import { DateInput } from "@mantine/dates";
import { actionStatusesMap, inspectionStatuses } from "../../../../Data/DropdownData";
import { useForm } from "@mantine/form";
import { getEmployeesWithDepartment } from "../../../../services/EmployeeService";

import { mapIdToName } from "../../../../utility/OtherUtilities";

import { hideOverlay, showOverlay } from "../../../../slices/OverlaySlice";
import { useDispatch } from "react-redux";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import ViewDetailsMeeting from "./ViewDetailsMeeting";
import ActivityHistory from "./ActivityHistory";
import CorrectiveActions from "./CorrectiveActions";
import ActivityReport from "./ActivityReport";
import { addHsActivityHistory, getHsActivityHistoryById } from "../../../../services/ActivityHistoryService";
import { getActivityById } from "../../../../services/HsActivityService";
import { formatDateShort, formatTimeToAmPm } from "../../../../utility/DateFormats";


const MeetingDetailsTabs = () => {
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



    const form = useForm({
        initialValues: {
            ownerId: "",
            date: "",
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
        getEmployeesWithDepartment()
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
                }
            })
            .finally(() => {
                dispatch(hideOverlay());
            });
        fetchHistory();

    }, []);

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
                successNotification("Status changed successfully");
                close();
                setMeeting((prev: any) => ({
                    ...prev,
                    status: values.status,
                }));
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
            label: 'Détails de la réunion',
            icon: IconFileText,
            content: <ViewDetailsMeeting activity={activity} />,
            hide: false
        },
        activity: {
            label: "Compte rendu",
            icon: IconTrendingUp,
            content: <ActivityReport />,
            hide: false
        },
        actions: {
            label: 'Actions correctives',
            icon: IconFileCheck,
            content: <CorrectiveActions employee={emps} empMap={empMap} />,
            hide: false
        },
        history: {
            label: 'Historique',
            icon: IconHistory,
            content: <ActivityHistory meeting={meeting} history={history} empMap={empMap} />,
            hide: false
        },
    };


    const handleStatusChange = () => {
        if (locked.locked) return;
        open();
    }
    return (
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto" >
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Réunions sécurité', to: '/hs-Meetings' },
                    { label: 'Détails de la réunion' },
                ]}
                icon={<IconUsers size={22} stroke={2} />}
                iconColor="green"
                title="Détails de la réunion"
                subtitle="Compte rendu, actions correctives et suivi de la réunion HSE"
            />

            <div className="rounded-xl p-5 space-y-3 bg-gradient-to-br from-green-600 to-green-800 shadow-md">
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className='flex flex-col gap-1.5'>
                        <h2 className="text-lg text-white">{activity.title}</h2>
                        <div className="flex items-center gap-1.5 text-green-50 text-sm">
                            <IconCalendarEvent size={16} />
                            <span>{formatDateShort(activity?.plannedDate)} — {formatTimeToAmPm(activity?.startTime)} à {formatTimeToAmPm(activity?.endTime)}</span>
                        </div>
                    </div>

                    <div className="flex items-end gap-2 flex-col">
                        <Tooltip label={locked.locked ? (locked.status === 'COMPLETED' ? 'Réunion clôturée : statut non modifiable' : 'Réunion annulée : statut non modifiable') : 'Changer le statut'}>
                            <span className="inline-flex">
                                <Button
                                    size="sm"
                                    leftSection={<IconClock size={15} />}
                                    onClick={handleStatusChange}
                                    disabled={locked.locked}
                                    className="!bg-white !text-green-700 hover:!bg-green-50"
                                >
                                    {actionStatusesMap[activity?.status] || "Statut"}
                                </Button>
                            </span>
                        </Tooltip>
                        {activity?.status && (
                            <Badge color={activity.status === 'COMPLETED' ? 'green.2' : activity.status === 'CANCELLED' ? 'red.4' : 'yellow.4'} variant="filled" radius="sm" size="sm" className="!text-slate-900">
                                {actionStatusesMap[activity?.status]}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {locked.locked && (
                <Alert color={locked.status === 'COMPLETED' ? 'green' : 'red'} variant="light" className="border">
                    <Text size="sm">
                        {locked.status === 'COMPLETED' ? 'Cette réunion est clôturée. Aucune modification possible.' : 'Cette réunion est annulée. Aucune modification possible.'}
                    </Text>
                </Alert>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                    <div className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                        {Object.entries(tabData).map(([key, { label, icon: Icon, hide }]) => (
                            !hide && (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setActiveTab(key)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${activeTab === key
                                        ? 'bg-green-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                >
                                    <Icon size={14} />
                                    {label}
                                </button>
                            )
                        ))}
                    </div>
                </div>
                <div className="p-5">
                    {Object.entries(tabData).map(([key, { content, hide }]) => (
                        !hide && activeTab === key && (
                            <div key={key}>{content}</div>
                        )
                    ))}
                </div>
            </div>

            <Modal
                opened={opened}
                onClose={close}
                title={
                    <div className='text-base flex items-center gap-2'>
                        <span className='bg-green-100 text-green-700 rounded-full p-2'><IconLock size={18} /></span>
                        Changer le statut de la réunion
                    </div>
                }
                centered
                size="xl"
                classNames={{
                    body: 'p-6',
                    header: 'text-lg border-b border-slate-200 mx-2',
                }}
            >
                <form onSubmit={form.onSubmit(handleSubmit)} className="flex flex-col gap-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Responsable"
                            placeholder="Sélectionner le responsable"
                            data={emps}
                            {...form.getInputProps("ownerId")}
                            withAsterisk
                        />

                        <DateInput
                            maxDate={new Date()}
                            label="Date"
                            placeholder="Sélectionner la date"
                            {...form.getInputProps("date")}
                            withAsterisk
                        />
                    </div>

                    <Select
                        label="Statut"
                        placeholder="Sélectionner le statut"
                        data={inspectionStatuses}
                        {...form.getInputProps("status")}
                        withAsterisk
                    />

                    {form.values.status === 'CLOSED' ? (
                        <>
                            <NumberInput
                                label="Évaluation qualité (1-10)"
                                placeholder="Note de la réunion"
                                withAsterisk
                                {...form.getInputProps("evaluation")}
                            />

                            <Textarea
                                label="Rapport de clôture"
                                placeholder="Synthèse, validation des décisions, commentaires finaux..."
                                withAsterisk
                                minRows={3}
                                {...form.getInputProps("closingReport")}
                            />

                            <Textarea
                                label="Leçons apprises"
                                withAsterisk
                                placeholder="Points d'amélioration, bonnes pratiques identifiées, recommandations"
                                minRows={6}
                                {...form.getInputProps("comment")}
                            />
                        </>
                    ) : (
                        <Textarea
                            label="Commentaire"
                            withAsterisk
                            placeholder="Saisir votre commentaire"
                            minRows={6}
                            {...form.getInputProps("comment")}
                        />
                    )}

                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="default" onClick={close}>
                            Annuler
                        </Button>
                        <Button color="green" type='submit' disabled={locked.locked}>
                            Soumettre
                        </Button>
                    </div>
                </form>
            </Modal>

        </div >
    )
}

export default MeetingDetailsTabs

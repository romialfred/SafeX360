import {
    Alert, Badge, Button, Modal, NumberInput, Select, Text, Textarea, Tooltip
} from "@mantine/core";
import {
    IconCalendarEvent, IconClock, IconFileCheck, IconFileText, IconHistory,
    IconLock, IconTrendingUp, IconRoute,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import PageHeader from "../../UtilityComp/PageHeader";

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
            ownerId: (value) => value ? null : "Le responsable est requis",
            date: (value) => value ? null : "La date est requise",
            status: (value) => value ? null : "Le statut est requis",
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
            errorNotification(locked.status === 'COMPLETED' ? 'Cette tournée est clôturée. Aucune modification possible.' : 'Cette tournée est annulée. Aucune modification possible.');
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
                successNotification("Statut mis à jour avec succès");
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
                errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue");
            })
            .finally(() => {
                dispatch(hideOverlay());
            });
    };


    const tabData = {
        details: {
            label: 'Détails de la tournée',
            icon: IconFileText,
            content: <ViewDetailsMeeting activity={activity} />,
            hide: false
        },
        activity: {
            label: 'Compte rendu',
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
        <div className="p-5 space-y-5 w-full" >
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Tournées Leadership', to: '/steering-tours' },
                    { label: 'Détails de la tournée' },
                ]}
                icon={<IconRoute size={22} stroke={2} />}
                iconColor="indigo"
                title="Détails de la tournée Leadership"
                subtitle="Visite terrain proactive — observations, actions correctives et suivi"
            />

            <div className="rounded-xl p-5 space-y-3 bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-md">
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className='flex flex-col gap-1.5'>
                        <h2 className="text-lg text-white">{activity.title}</h2>
                        <div className="flex items-center gap-1.5 text-indigo-50 text-sm">
                            <IconCalendarEvent size={16} />
                            <span>{formatDateShort(activity?.plannedDate)} — {formatTimeToAmPm(activity?.startTime)} à {formatTimeToAmPm(activity?.endTime)}</span>
                        </div>
                    </div>

                    <div className="flex items-end gap-2 flex-col">
                        <Tooltip label={(locked.locked || isFinalStatus) ? ((locked.status || normalizedStatus) === 'COMPLETED' ? 'Tournée clôturée : statut non modifiable' : 'Tournée annulée : statut non modifiable') : 'Changer le statut'}>
                            <span className="inline-flex">
                                <Button size="sm" leftSection={<IconClock size={15} />} onClick={handleStatusChange} disabled={locked.locked || isFinalStatus} className="!bg-white !text-indigo-700 hover:!bg-indigo-50">
                                    {actionStatusesMap[activity?.status] || 'Statut'}
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
                        {locked.status === 'COMPLETED' ? 'Cette tournée est clôturée. Aucune modification possible.' : 'Cette tournée est annulée. Aucune modification possible.'}
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
                                        ? 'bg-indigo-600 text-white shadow-sm'
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
                        <span className='bg-indigo-100 text-indigo-700 rounded-full p-2'><IconLock size={18} /></span>
                        Changer le statut de la tournée
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
                    {/* LOT 40 P1: grille responsive (mobile→single col) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        data={statusSelectOptions}
                        {...form.getInputProps("status")}
                        withAsterisk
                    />

                    {form.values.status === 'CLOSED' ? (
                        <>
                            <NumberInput
                                label="Évaluation qualité (1-10)"
                                placeholder="Note de la tournée"
                                withAsterisk
                                {...form.getInputProps("evaluation")}
                            />

                            <Textarea
                                label="Rapport de clôture"
                                placeholder="Synthèse, validation des actions, commentaires finaux..."
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
                        <Button color="indigo" type='submit' disabled={locked.locked}>
                            Soumettre
                        </Button>
                    </div>
                </form>
            </Modal>

        </div >
    )
}

export default SteeringTourDetails

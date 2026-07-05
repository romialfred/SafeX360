import {
    Alert,
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
import { useForm } from "@mantine/form";
import { getEmployeesWithDepartment } from "../../../../services/EmployeeService";

import { mapIdToName } from "../../../../utility/OtherUtilities";
import { toLocalDate } from "../../../../utility/dateConversion";

import { hideOverlay, showOverlay } from "../../../../slices/OverlaySlice";
import { useDispatch } from "react-redux";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import ViewDetailsMeeting from "./ViewDetailsMeeting";
import ActivityHistory from "./ActivityHistory";
import CorrectiveActions from "./CorrectiveActions";
import ActivityReport from "./ActivityReport";
import { addHsActivityHistory, getHsActivityHistoryById } from "../../../../services/ActivityHistoryService";
import { getActivityById } from "../../../../services/HsActivityService";
import { formatDateShort } from "../../../../utility/DateFormats";
import { ACTIVITY_STATUS_OPTIONS, activityStatusConfig, formatTimeFr } from "../hsMeetingsLabels";

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

    const form = useForm<{
        ownerId: string;
        date: Date | null;
        status: string;
        comment: string;
        evaluation: number | string;
        closingReport: string;
    }>({
        initialValues: {
            ownerId: "",
            date: null,
            status: "",
            comment: "",
            evaluation: "",
            closingReport: "",
        },
        validate: {
            ownerId: (value) => value ? null : "Le responsable est requis",
            date: (value) => value ? null : "La date est requise",
            status: (value) => value ? null : "Le statut est requis",
            comment: (value) => value && value.trim() ? null : "Un commentaire est requis",
            evaluation: (value, values) =>
                values.status === 'COMPLETED' && (value === '' || value === null || value === undefined)
                    ? "L'évaluation est requise pour clôturer"
                    : null,
            closingReport: (value, values) =>
                values.status === 'COMPLETED' && (!value || !value.trim())
                    ? 'Le rapport de clôture est requis'
                    : null,
        }
    });

    useEffect(() => {
        if (!searchParams) return;
        const tab = searchParams.get('tab');
        if (tab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    useEffect(() => {
        dispatch(showOverlay());
        getEmployeesWithDepartment()
            .then((res) => {
                const mappedEmployees = res.map((emp: any) => ({
                    label: emp.name,
                    value: String(emp.id),
                }));
                setEmps(mappedEmployees);
                setEmpMap(mapIdToName(res));
            })
            .catch((_err) => console.error(_err));
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

    const statusSelectOptions = ACTIVITY_STATUS_OPTIONS.filter((option) => allowedStatusSet.has(option.value));

    const fetchHistory = () => {
        getHsActivityHistoryById(id).then((res) => {
            setHistory(res);
        }).catch((_err) => console.error(_err));
    };

    const lockedMessage = locked.status === 'COMPLETED'
        ? 'Cette réunion est clôturée. Aucune modification possible.'
        : 'Cette réunion est annulée. Aucune modification possible.';

    const handleSubmit = async (values: any) => {
        if (locked.locked) {
            errorNotification(lockedMessage);
            return;
        }
        dispatch(showOverlay());

        const payload = {
            ...values,
            date: toLocalDate(values.date),
            hsActivityId: parseInt(id || "")
        };

        addHsActivityHistory(payload)
            .then((_res) => {
                successNotification("Statut mis à jour");
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
    };

    const statusCfg = activityStatusConfig(activity?.status);

    return (
        <div className="p-5 space-y-4 w-full">
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

            <div className="rounded-xl p-4 space-y-3 bg-gradient-to-br from-green-600 to-green-800 shadow-md">
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className='flex flex-col gap-1.5'>
                        <h2 className="text-white" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '17px', fontWeight: 600 }}>
                            {activity.title}
                        </h2>
                        <div className="flex items-center gap-1.5 text-green-50 text-[12.5px]">
                            <IconCalendarEvent size={15} aria-hidden="true" />
                            <span>{formatDateShort(activity?.plannedDate)} — {formatTimeFr(activity?.startTime)} à {formatTimeFr(activity?.endTime)}</span>
                        </div>
                    </div>

                    <div className="flex items-end gap-2 flex-col">
                        <Tooltip label={(locked.locked || isFinalStatus) ? ((locked.status || normalizedStatus) === 'COMPLETED' ? 'Réunion clôturée : statut non modifiable' : 'Réunion annulée : statut non modifiable') : 'Changer le statut'} withArrow>
                            <span className="inline-flex">
                                <Button
                                    size="sm"
                                    leftSection={<IconClock size={15} />}
                                    onClick={handleStatusChange}
                                    disabled={locked.locked || isFinalStatus}
                                    className="!bg-white !text-green-700 hover:!bg-green-50"
                                >
                                    Changer le statut
                                </Button>
                            </span>
                        </Tooltip>
                        {activity?.status && (
                            <span className="inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-wider rounded border bg-white/15 text-white border-white/40">
                                {statusCfg.label}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {locked.locked && (
                <Alert color={locked.status === 'COMPLETED' ? 'green' : 'red'} variant="light" className="border">
                    <Text size="sm">{lockedMessage}</Text>
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
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${activeTab === key
                                        ? 'bg-green-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                >
                                    <Icon size={14} aria-hidden="true" />
                                    {label}
                                </button>
                            )
                        ))}
                    </div>
                </div>
                <div className="p-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            size="sm"
                            label="Responsable"
                            placeholder="Sélectionner le responsable"
                            data={emps}
                            {...form.getInputProps("ownerId")}
                            withAsterisk
                        />

                        <DateInput
                            size="sm"
                            label="Date"
                            placeholder="Sélectionner la date"
                            {...form.getInputProps("date")}
                            withAsterisk
                        />
                    </div>

                    <Select
                        size="sm"
                        label="Statut"
                        placeholder="Sélectionner le statut"
                        data={statusSelectOptions}
                        {...form.getInputProps("status")}
                        withAsterisk
                    />

                    {form.values.status === 'COMPLETED' ? (
                        <>
                            <NumberInput
                                size="sm"
                                label="Évaluation qualité (1-10)"
                                placeholder="Note de la réunion"
                                withAsterisk
                                {...form.getInputProps("evaluation")}
                            />

                            <Textarea
                                size="sm"
                                label="Rapport de clôture"
                                placeholder="Synthèse, validation des décisions, commentaires finaux"
                                withAsterisk
                                minRows={3}
                                {...form.getInputProps("closingReport")}
                            />

                            <Textarea
                                size="sm"
                                label="Leçons apprises"
                                withAsterisk
                                placeholder="Points d'amélioration, bonnes pratiques identifiées, recommandations"
                                minRows={6}
                                {...form.getInputProps("comment")}
                            />
                        </>
                    ) : (
                        <Textarea
                            size="sm"
                            label="Commentaire"
                            withAsterisk
                            placeholder="Saisir votre commentaire"
                            minRows={6}
                            {...form.getInputProps("comment")}
                        />
                    )}

                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="default" size="sm" onClick={close}>
                            Annuler
                        </Button>
                        <Button color="teal" size="sm" type='submit' disabled={locked.locked}>
                            Soumettre
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default MeetingDetailsTabs;

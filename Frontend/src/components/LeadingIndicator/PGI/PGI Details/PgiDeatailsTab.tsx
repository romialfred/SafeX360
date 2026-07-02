import { Alert, Button, Modal, Select, Text, Textarea, Tooltip } from "@mantine/core";
import { IconCalendarEvent, IconCheckbox, IconClock, IconFileAnalytics, IconFileCheck, IconFileText, IconHistory, IconLock, IconSearch } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import PageHeader from "../../../UtilityComp/PageHeader";

import { useDisclosure } from "@mantine/hooks";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { getEmployeesWithDepartment } from "../../../../services/EmployeeService";

import { mapIdToName } from "../../../../utility/OtherUtilities";

import { hideOverlay, showOverlay } from "../../../../slices/OverlaySlice";
import { useDispatch } from "react-redux";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import ChecklistInspection from "./ChecklistInspection";
import Measurements from "./Measurements";
import InspectionReport from "./InspectionReport";
import InspectionHistory from "./InspectionHistory";
import { addInspectionHistory, getInspectionHistoryByInspectionId } from "../../../../services/InspectionHistoryService";
import ViewDetailsPgi from "./ViewDetailsPgi";
import { getPgiById } from "../../../../services/PgiService";
import { formatDateShort, formatTimeToAmPm } from "../../../../utility/DateFormats";
import { CHIP_BASE, INSPECTION_STATUS_OPTIONS, inspectionStatusConfig } from "../pgiLabels";

const PgiDeatailsTab = () => {
    const [activeTab, setActiveTab] = useState('details');
    const [opened, { open, close }] = useDisclosure(false);
    const [searchParams] = useSearchParams();
    const { id } = useParams();
    const [emps, setEmps] = useState<any[]>([]);
    const [inspection, setInspection] = useState<any>({});
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const dispatch = useDispatch();
    const [history, setHistory] = useState<any[]>([]);
    const [locked, setLocked] = useState<{ locked: boolean; status: string }>({ locked: false, status: '' });



    const form = useForm({
        initialValues: {
            ownerId: "",
            date: null as any,
            status: "",
            comment: "",

        },
        validate: {
            ownerId: (value) => value ? null : "Le responsable est obligatoire",
            date: (value) => value ? null : "La date est obligatoire",
            status: (value) => value ? null : "Le statut est obligatoire",
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
                    value: String(emp.id), // valeur en chaîne pour rester aligné avec le champ du formulaire
                }));
                setEmps(mappedEmployees);
                setEmpMap(mapIdToName(res));
            })
            .catch((_err) => console.error(_err));
        getPgiById(id)
            .then((res) => {
                setInspection(res);
                const statusUpper = String(res?.status || '').toUpperCase();
                if (['COMPLETED', 'CANCELLED'].includes(statusUpper)) {
                    setLocked({ locked: true, status: statusUpper });
                }
                form.setValues({
                    ...form.values,
                    status: res.status || '',
                });
            })
            .catch((_err) => console.error(_err)).finally(() => {
                dispatch(hideOverlay());
            });
        fetchHistory();

    }, []);

    const normalizedStatus = String(inspection?.status || '').toUpperCase();
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

    const statusSelectOptions = INSPECTION_STATUS_OPTIONS.filter((option) => allowedStatusSet.has(option.value));


    const fetchHistory = () => {
        getInspectionHistoryByInspectionId(id).then((res) => {
            setHistory(res);
        }).catch((_err) => console.error(_err));
    }

    const handleSubmit = async (values: any) => {
        dispatch(showOverlay());

        const payload = {
            ...values,
            inspectionId: parseInt(id || ""),
        };

        addInspectionHistory(payload)
            .then((_res) => {
                successNotification("Statut de l'inspection mis à jour");
                close();
                setInspection((prev: any) => ({
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
                errorNotification(err.response?.data?.errorMessage || "Le changement de statut a échoué");
            })
            .finally(() => {
                dispatch(hideOverlay());
            });
    };


    const tabData = {
        details: {
            label: "Détails de l'inspection",
            icon: IconFileText,
            content: <ViewDetailsPgi inspection={inspection} />,
            hide: false
        },
        execution: {
            label: 'Checklist',
            icon: IconCheckbox,
            content: <ChecklistInspection />,
            hide: false
        },
        recommendation: {
            label: 'Mesures',
            icon: IconFileAnalytics,
            content: <Measurements employee={emps} empMap={empMap} />,
            hide: false
        },
        report: {
            label: 'Rapport',
            icon: IconFileCheck,
            content: <InspectionReport employee={emps} empMap={empMap} />,
            hide: false
        },
        history: {
            label: 'Historique',
            icon: IconHistory,
            content: <InspectionHistory inspection={inspection} history={history} empMap={empMap} />,
            hide: false
        },
    };


    const handleStatusChange = () => {
        if (locked.locked || isFinalStatus) {
            return;
        }

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
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Inspections HSE', to: '/PGI' },
                    { label: "Détails de l'inspection" },
                ]}
                icon={<IconSearch size={22} stroke={2} />}
                iconColor="green"
                title="Détails de l'inspection"
                subtitle="Checklist, mesures, rapport et historique de l'inspection planifiée"
            />

            <div className="rounded-xl p-5 space-y-3 bg-gradient-to-br from-green-600 to-green-800 shadow-md">
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className='flex flex-col gap-1.5'>
                        <h2 className="text-lg text-white">{inspection?.title}</h2>
                        <div className="flex items-center gap-1.5 text-green-50 text-sm">
                            <IconCalendarEvent size={16} />
                            <span>{formatDateShort(inspection?.plannedDate)} — {formatTimeToAmPm(inspection?.startTime)} à {formatTimeToAmPm(inspection?.endTime)}</span>
                        </div>
                    </div>

                    <div className="flex items-end gap-2 flex-col">
                        <Tooltip label={(locked.locked || isFinalStatus) ? ((locked.status || normalizedStatus) === 'COMPLETED' ? 'Inspection clôturée : statut non modifiable' : 'Inspection annulée : statut non modifiable') : 'Changer le statut'}>
                            <span className="inline-flex">
                                <Button
                                    size="sm"
                                    leftSection={<IconClock size={15} />}
                                    onClick={handleStatusChange}
                                    disabled={locked.locked || isFinalStatus}
                                    className="!bg-white !text-green-700 hover:!bg-green-50"
                                >
                                    {inspectionStatusConfig(inspection?.status).label}
                                </Button>
                            </span>
                        </Tooltip>
                        {inspection?.status && (
                            <span className={`${CHIP_BASE} ${inspectionStatusConfig(inspection.status).chip} !bg-white/90`}>
                                {inspectionStatusConfig(inspection.status).label}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {locked.locked && (
                <Alert color={locked.status === 'COMPLETED' ? 'green' : 'red'} variant="light" className="border">
                    <Text size="sm">
                        {locked.status === 'COMPLETED' ? 'Cette inspection est clôturée. Aucune modification possible.' : 'Cette inspection est annulée. Aucune modification possible.'}
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
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${activeTab === key
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
                        Changer le statut de l'inspection
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
                        data={statusSelectOptions}
                        {...form.getInputProps("status")}
                        withAsterisk
                    />

                    <Textarea
                        label="Commentaire"
                        withAsterisk
                        placeholder="ex. Passage en exécution après confirmation de l'équipe d'inspection"
                        minRows={6}
                        {...form.getInputProps("comment")}
                    />

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

export default PgiDeatailsTab
